import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Party ID is required' },
        { status: 400 }
      );
    }

    const party = await prisma.party.findUnique({
      where: { id },
      include: {
        business: true,
      },
    });

    if (!party) {
      return NextResponse.json(
        { success: false, error: 'Party not found' },
        { status: 404 }
      );
    }

    const businessId = party.businessId;
    const nameMatch = party.name?.trim();

    // 1. Fetch GST Sales for this party
    const sales = await prisma.sale.findMany({
      where: {
        businessId,
        OR: [
          { partyId: party.id },
          ...(nameMatch ? [{ partyName: { equals: nameMatch } }] : []),
        ],
      },
      include: {
        items: true,
      },
      orderBy: { invoiceDate: 'desc' },
    });

    // 2. Fetch Non-GST Invoices for this party
    const nonGstInvoices = await prisma.nonGstInvoice.findMany({
      where: {
        businessId,
        OR: [
          { partyId: party.id },
          ...(nameMatch ? [{ partyName: { equals: nameMatch } }] : []),
        ],
      },
      include: {
        items: true,
      },
      orderBy: { invoiceDate: 'desc' },
    });

    // 3. Fetch Purchases for this party
    const purchases = await prisma.purchase.findMany({
      where: {
        businessId,
        OR: [
          { partyId: party.id },
          ...(nameMatch ? [{ partyName: { equals: nameMatch } }] : []),
        ],
      },
      include: {
        items: true,
      },
      orderBy: { billDate: 'desc' },
    });

    // 4. Fetch Payments for this party
    const payments = await prisma.payment.findMany({
      where: {
        businessId,
        OR: [
          { partyId: party.id },
          ...(nameMatch ? [{ partyName: { equals: nameMatch } }] : []),
        ],
      },
      include: {
        allocations: true,
      },
      orderBy: { paymentDate: 'desc' },
    });

    // Unified transaction records
    const unified: any[] = [];

    // GST Sales: Outbound (Invoice sent / Goods delivered to client)
    for (const s of sales) {
      const itemSummaries = (s.items || []).map(
        (it) => `${it.productName} (${it.quantity} ${it.unit || 'PCS'})`
      );
      unified.push({
        id: `sale_${s.id}`,
        rawId: s.id,
        date: s.invoiceDate,
        type: 'GST_SALE',
        typeLabel: 'GST Tax Invoice',
        direction: 'OUTBOUND',
        referenceNumber: s.invoiceNumber,
        title: `GST Tax Invoice #${s.invoiceNumber}`,
        description:
          itemSummaries.length > 0
            ? itemSummaries.join(', ')
            : 'Tax Invoice (Goods & Services)',
        amount: Number(s.grandTotal || 0),
        paidAmount: Number(s.paidAmount || 0),
        balanceAmount: Number(s.balanceAmount || 0),
        paymentMode: s.paymentMode || 'CASH',
        paymentStatus: s.paymentStatus || 'PAID',
        notes: s.notes || '',
        items: (s.items || []).map((it) => ({
          productName: it.productName,
          quantity: it.quantity,
          unit: it.unit || 'PCS',
          unitPrice: it.unitPrice,
          totalAmount: it.totalAmount,
        })),
      });
    }

    // Non-GST Invoices: Outbound (Goods & Invoice sent to client)
    for (const inv of nonGstInvoices) {
      const itemSummaries = (inv.items || []).map(
        (it) => `${it.productName} (${it.quantity} ${it.unit || 'PCS'})`
      );
      unified.push({
        id: `nongst_${inv.id}`,
        rawId: inv.id,
        date: inv.invoiceDate,
        type: 'NON_GST_SALE',
        typeLabel: 'Non-GST Invoice',
        direction: 'OUTBOUND',
        referenceNumber: inv.invoiceNumber,
        title: `Non-GST Invoice #${inv.invoiceNumber}`,
        description:
          itemSummaries.length > 0
            ? itemSummaries.join(', ')
            : 'Non-GST Invoice (Goods)',
        amount: Number(inv.grandTotal || 0),
        paidAmount: Number(inv.paidAmount || 0),
        balanceAmount: Number(inv.balanceAmount || 0),
        paymentMode: inv.paymentMode || 'CASH',
        paymentStatus: inv.paymentStatus || 'PAID',
        notes: inv.notes || '',
        items: (inv.items || []).map((it) => ({
          productName: it.productName,
          quantity: it.quantity,
          unit: it.unit || 'PCS',
          unitPrice: it.unitPrice,
          totalAmount: it.totalAmount,
        })),
      });
    }

    // Purchases: Inbound (Goods received from supplier)
    for (const p of purchases) {
      const itemSummaries = (p.items || []).map(
        (it) => `${it.productName} (${it.quantity} ${it.unit || 'PCS'})`
      );
      unified.push({
        id: `pur_${p.id}`,
        rawId: p.id,
        date: p.billDate,
        type: 'PURCHASE',
        typeLabel: 'Purchase Bill',
        direction: 'INBOUND',
        referenceNumber: p.billNumber,
        title: `Purchase Bill #${p.billNumber}`,
        description:
          itemSummaries.length > 0
            ? itemSummaries.join(', ')
            : 'Inward Purchase Inventory',
        amount: Number(p.grandTotal || 0),
        paidAmount: Number(p.paidAmount || 0),
        balanceAmount: Number(p.balanceAmount || 0),
        paymentMode: p.paymentMode || 'BANK',
        paymentStatus: p.paymentStatus || 'PAID',
        notes: p.notes || '',
        items: (p.items || []).map((it) => ({
          productName: it.productName,
          quantity: it.quantity,
          unit: it.unit || 'PCS',
          unitPrice: it.unitPrice,
          totalAmount: it.totalAmount,
        })),
      });
    }

    // Payments:
    // PAYMENT_IN: Inbound (Money received from customer)
    // PAYMENT_OUT: Outbound (Money sent to supplier)
    for (const pay of payments) {
      const isIn = pay.type === 'PAYMENT_IN';
      unified.push({
        id: `pay_${pay.id}`,
        rawId: pay.id,
        date: pay.paymentDate,
        type: isIn ? 'PAYMENT_IN' : 'PAYMENT_OUT',
        typeLabel: isIn ? 'Payment Received' : 'Payment Made',
        direction: isIn ? 'INBOUND' : 'OUTBOUND',
        referenceNumber: pay.paymentNumber || pay.referenceNumber || 'PAY',
        title: isIn
          ? `Payment Received (${pay.paymentMode})`
          : `Payment Sent (${pay.paymentMode})`,
        description: `${isIn ? 'Received from' : 'Paid to'} party via ${pay.paymentMode}${
          pay.referenceNumber ? ` (Ref #${pay.referenceNumber})` : ''
        }`,
        amount: Number(pay.amount || 0),
        paidAmount: Number(pay.amount || 0),
        balanceAmount: 0,
        paymentMode: pay.paymentMode || 'CASH',
        paymentStatus: 'PAID',
        notes: pay.notes || '',
        items: [],
      });
    }

    // Sort chronologically (oldest first) to compute running balance
    unified.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    let runningBal = Number(party.openingBalance || 0);
    for (const tx of unified) {
      if (party.type === 'SUPPLIER') {
        // For suppliers: Purchase increases payable (-), Payment Out decreases payable (+)
        if (tx.type === 'PURCHASE') {
          runningBal -= tx.amount;
        } else if (tx.type === 'PAYMENT_OUT') {
          runningBal += tx.amount;
        }
      } else {
        // For customers: Invoices increase receivable (+), Payments In decrease receivable (-)
        if (tx.type === 'GST_SALE' || tx.type === 'NON_GST_SALE') {
          runningBal += tx.balanceAmount !== undefined ? tx.balanceAmount : tx.amount;
        } else if (tx.type === 'PAYMENT_IN') {
          runningBal -= tx.amount;
        }
      }
      tx.runningBalance = runningBal;
    }

    // Sort newest first for display
    unified.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    // Calculate metrics
    const totalInbound = unified
      .filter((t) => t.direction === 'INBOUND')
      .reduce((sum, t) => sum + t.amount, 0);

    const totalOutbound = unified
      .filter((t) => t.direction === 'OUTBOUND')
      .reduce((sum, t) => sum + t.amount, 0);

    return NextResponse.json({
      success: true,
      party,
      metrics: {
        totalInbound,
        totalOutbound,
        currentBalance: party.currentBalance,
        openingBalance: party.openingBalance,
        totalTransactions: unified.length,
        salesCount: sales.length,
        nonGstCount: nonGstInvoices.length,
        purchasesCount: purchases.length,
        paymentsCount: payments.length,
      },
      transactions: unified,
    });
  } catch (error: any) {
    console.error('Error fetching party history:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
