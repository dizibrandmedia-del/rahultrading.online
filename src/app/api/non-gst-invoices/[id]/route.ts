import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    const invoice = await prisma.nonGstInvoice.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            product: true,
          },
        },
        party: true,
        business: true,
      },
    });

    if (!invoice) {
      return NextResponse.json({ success: false, error: 'Invoice not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, invoice });
  } catch (error: any) {
    console.error('Error fetching non-GST invoice:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const {
      fromName,
      fromPhone,
      fromAddress,
      invoiceNumber,
      invoiceDate,
      dueDate,
      partyId,
      partyName,
      partyPhone,
      partyAddress,
      billingAddress,
      partyState,
      extraCharges = 0,
      extraChargeName = 'LOADING CHARGE',
      paymentMode = 'UNPAID',
      paidAmount = 0,
      notes,
      terms,
      items = [],
    } = body;

    // Calculate line items and totals
    let subTotal = 0;
    let discountTotal = 0;

    const processedItems = items.map((it: any) => {
      const qty = Number(it.quantity) || 1;
      const rate = Number(it.unitPrice) || 0;
      const discPercent = Number(it.discountPercent) || 0;
      let discAmount = Number(it.discountAmount) || 0;

      const gross = qty * rate;
      if (discPercent > 0 && discAmount === 0) {
        discAmount = (gross * discPercent) / 100;
      }
      const lineTotal = Math.max(0, gross - discAmount);

      subTotal += gross;
      discountTotal += discAmount;

      return {
        productId: it.productId || null,
        productName: it.productName || 'General Item',
        description: it.description || null,
        quantity: qty,
        unit: it.unit || 'PCS',
        unitPrice: rate,
        discountPercent: discPercent,
        discountAmount: discAmount,
        totalAmount: lineTotal,
      };
    });

    const parsedExtra = Number(extraCharges) || 0;
    const grandTotal = Math.max(0, subTotal - discountTotal + parsedExtra);
    const actualPaid = Number(paidAmount) || 0;
    const balance = Math.max(0, grandTotal - actualPaid);
    const paymentStatus = balance === 0 ? 'PAID' : actualPaid > 0 ? 'PARTIAL' : 'UNPAID';

    const updatedInvoice = await prisma.$transaction(async (tx) => {
      // 1. Delete existing items
      await tx.nonGstInvoiceItem.deleteMany({
        where: { invoiceId: id },
      });

      // 2. Update invoice header
      const invoice = await tx.nonGstInvoice.update({
        where: { id },
        data: {
          fromName: fromName !== undefined ? fromName : undefined,
          fromPhone: fromPhone !== undefined ? fromPhone : undefined,
          fromAddress: fromAddress !== undefined ? fromAddress : undefined,
          invoiceNumber: invoiceNumber || undefined,
          invoiceDate: invoiceDate ? new Date(invoiceDate) : undefined,
          dueDate: dueDate ? new Date(dueDate) : null,
          partyId: partyId || null,
          partyName: partyName || 'Walk-in Cash Customer',
          partyPhone: partyPhone || null,
          partyAddress: partyAddress || null,
          billingAddress: billingAddress || partyAddress || null,
          partyState: partyState || 'Uttar Pradesh',
          subTotal,
          discountTotal,
          extraCharges: parsedExtra,
          extraChargeName: extraChargeName || 'LOADING CHARGE',
          grandTotal,
          paidAmount: actualPaid,
          balanceAmount: balance,
          paymentStatus,
          paymentMode,
          notes,
          terms,
        },
      });

      // 3. Re-create items
      for (const item of processedItems) {
        await tx.nonGstInvoiceItem.create({
          data: {
            invoiceId: id,
            productId: item.productId,
            productName: item.productName,
            description: item.description,
            quantity: item.quantity,
            unit: item.unit,
            unitPrice: item.unitPrice,
            discountPercent: item.discountPercent,
            discountAmount: item.discountAmount,
            totalAmount: item.totalAmount,
          },
        });
      }

      return invoice;
    });

    return NextResponse.json({ success: true, invoice: updatedInvoice });
  } catch (error: any) {
    console.error('Error updating non-GST invoice:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    await prisma.nonGstInvoice.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: 'Invoice deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting non-GST invoice:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
