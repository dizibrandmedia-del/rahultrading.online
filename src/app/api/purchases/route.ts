import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { calculateInvoiceGst } from '@/lib/gst-engine';
import { getOrCreateDefaultBusiness } from '@/lib/seed-helper';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const businessId = searchParams.get('businessId') || undefined;

    const purchases = await prisma.purchase.findMany({
      where: businessId ? { businessId } : undefined,
      include: {
        items: true,
        party: true,
      },
      orderBy: { billDate: 'desc' },
      take: 100,
    });

    return NextResponse.json({ success: true, purchases });
  } catch (error: any) {
    console.error('Error fetching purchases:', error);
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
      billNumber: customBillNumber,
      paymentMode = 'BANK',
      paidAmount = 0,
      notes,
      items = [],
    } = body;

    let business = await prisma.business.findFirst({
      where: businessId ? { id: businessId } : undefined,
    });

    if (!business) {
      business = await getOrCreateDefaultBusiness();
    }

    if (!business) {
      return NextResponse.json({ success: false, error: 'Business not found' }, { status: 404 });
    }

    const sellerStateCode = partyGstin && partyGstin.length >= 2 ? partyGstin.substring(0, 2) : business.stateCode;
    const buyerStateCode = business.stateCode || '07';

    // Calculate GST using Engine
    const gstResult = calculateInvoiceGst(sellerStateCode, buyerStateCode, items);

    const actualPaid = Number(paidAmount) || 0;
    const balance = Math.max(0, gstResult.grandTotal - actualPaid);
    const paymentStatus = balance === 0 ? 'PAID' : actualPaid > 0 ? 'PARTIAL' : 'UNPAID';

    const billNumber = customBillNumber || `${business.purchasePrefix}${String(business.purchaseNextNumber).padStart(4, '0')}`;

    const purchase = await prisma.$transaction(async (tx) => {
      // 1. Create Purchase
      const newPurchase = await tx.purchase.create({
        data: {
          businessId: business.id,
          billNumber,
          billDate: new Date(),
          partyId: partyId || null,
          partyName: partyName || 'Cash Supplier',
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
        },
      });

      // 2. Add Items & Increment Stock
      for (const item of gstResult.items) {
        await tx.purchaseItem.create({
          data: {
            purchaseId: newPurchase.id,
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

        // Increment Product Stock
        if (item.productId) {
          const prod = await tx.product.findUnique({ where: { id: item.productId } });
          if (prod) {
            const newStock = prod.currentStock + item.quantity;
            await tx.product.update({
              where: { id: prod.id },
              data: {
                currentStock: newStock,
                purchasePrice: item.unitPrice, // update latest purchase price
                stockValue: newStock * item.unitPrice,
              },
            });

            await tx.stockMovement.create({
              data: {
                businessId: business.id,
                productId: prod.id,
                type: 'PURCHASE',
                quantity: item.quantity,
                previousStock: prod.currentStock,
                newStock,
                unitPrice: item.unitPrice,
                referenceId: newPurchase.id,
                referenceType: 'BILL',
                notes: `Purchase Bill #${billNumber}`,
              },
            });
          }
        }
      }

      // 3. Update Party Balance (Supplier Payable)
      if (partyId && balance > 0) {
        await tx.party.update({
          where: { id: partyId },
          data: { currentBalance: { decrement: balance } }, // Negative balance for supplier payable
        });
      }

      // 4. Increment Sequence
      await tx.business.update({
        where: { id: business.id },
        data: { purchaseNextNumber: { increment: 1 } },
      });

      return newPurchase;
    });

    return NextResponse.json({ success: true, purchase });
  } catch (error: any) {
    console.error('Error recording purchase:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
