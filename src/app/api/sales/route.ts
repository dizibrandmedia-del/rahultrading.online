import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { calculateInvoiceGst } from '@/lib/gst-engine';
import { postSaleJournalEntry } from '@/lib/accounting-engine';
import { getOrCreateDefaultBusiness } from '@/lib/seed-helper';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const businessId = searchParams.get('businessId') || undefined;

    const sales = await prisma.sale.findMany({
      where: businessId ? { businessId } : undefined,
      include: {
        items: true,
        party: true,
        business: true,
      },
      orderBy: { invoiceDate: 'desc' },
      take: 100,
    });

    return NextResponse.json({ success: true, sales });
  } catch (error: any) {
    console.error('Error fetching sales:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      businessId,
      partyId,
      partyName,
      partyGstin,
      partyPhone,
      partyState = 'Delhi',
      paymentMode = 'CASH',
      paidAmount = 0,
      notes,
      terms,
      items = [],
    } = body;

    // Fetch Business to get state code and invoice prefix
    let business = await prisma.business.findFirst({
      where: businessId ? { id: businessId } : undefined,
    });

    if (!business) {
      business = await getOrCreateDefaultBusiness();
    }

    if (!business) {
      return NextResponse.json({ success: false, error: 'Business not found' }, { status: 404 });
    }

    const sellerStateCode = business.stateCode || '07';
    const buyerStateCode = partyGstin && partyGstin.length >= 2 ? partyGstin.substring(0, 2) : sellerStateCode;

    // Calculate GST using Engine
    const gstResult = calculateInvoiceGst(sellerStateCode, buyerStateCode, items);

    const actualPaid = Number(paidAmount) || 0;
    const balance = Math.max(0, gstResult.grandTotal - actualPaid);
    const paymentStatus = balance === 0 ? 'PAID' : actualPaid > 0 ? 'PARTIAL' : 'UNPAID';

    const invoiceNumber = `${business.invoicePrefix}${String(business.invoiceNextNumber).padStart(4, '0')}`;

    // Execute atomic transaction for Sale + Items + Stock Decrement + Accounting
    const sale = await prisma.$transaction(async (tx) => {
      // 1. Create Sale
      const newSale = await tx.sale.create({
        data: {
          businessId: business.id,
          invoiceNumber,
          invoiceDate: new Date(),
          partyId: partyId || null,
          partyName: partyName || 'Cash Customer',
          partyGstin: partyGstin || null,
          partyPhone: partyPhone || null,
          partyState: partyState,
          isInterState: gstResult.isInterState,
          subTotal: gstResult.subTotal,
          discountTotal: gstResult.discountTotal,
          taxableTotal: gstResult.taxableTotal,
          taxTotal: gstResult.taxTotal,
          cgstTotal: gstResult.cgstTotal,
          sgstTotal: gstResult.sgstTotal,
          igstTotal: gstResult.igstTotal,
          roundOff: gstResult.roundOff,
          grandTotal: gstResult.grandTotal,
          paidAmount: actualPaid,
          balanceAmount: balance,
          paymentStatus,
          paymentMode,
          notes,
          terms,
        },
      });

      // 2. Create Items & Decrement Inventory
      for (const item of gstResult.items) {
        await tx.saleItem.create({
          data: {
            saleId: newSale.id,
            productId: item.productId || null,
            productName: item.productName,
            hsnCode: item.hsnCode || null,
            quantity: item.quantity,
            unit: item.unit || 'PCS',
            unitPrice: item.unitPrice,
            discountPercent: item.discountPercent,
            discountAmount: item.discountAmount,
            taxableAmount: item.taxableAmount,
            gstRate: item.gstRate,
            cgstRate: item.cgstRate,
            cgstAmount: item.cgstAmount,
            sgstRate: item.sgstRate,
            sgstAmount: item.sgstAmount,
            igstRate: item.igstRate,
            igstAmount: item.igstAmount,
            totalAmount: item.totalAmount,
          },
        });

        // Decrement Product Stock
        if (item.productId) {
          const prod = await tx.product.findUnique({ where: { id: item.productId } });
          if (prod) {
            const newStock = prod.currentStock - item.quantity;
            await tx.product.update({
              where: { id: prod.id },
              data: {
                currentStock: newStock,
                stockValue: newStock * prod.purchasePrice,
              },
            });

            // Record Stock Movement
            await tx.stockMovement.create({
              data: {
                businessId: business.id,
                productId: prod.id,
                type: 'SALE',
                quantity: -item.quantity,
                previousStock: prod.currentStock,
                newStock,
                unitPrice: item.unitPrice,
                referenceId: newSale.id,
                referenceType: 'INVOICE',
                notes: `Invoice #${invoiceNumber}`,
              },
            });
          }
        }
      }

      // 3. Increment Invoice Sequence
      await tx.business.update({
        where: { id: business.id },
        data: { invoiceNextNumber: { increment: 1 } },
      });

      return newSale;
    });

    // 4. Post Double-Entry Accounting Journal Entries
    await postSaleJournalEntry(sale.id);

    return NextResponse.json({ success: true, sale });
  } catch (error: any) {
    console.error('Error creating sale:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
