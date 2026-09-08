import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { calculateInvoiceGst } from '@/lib/gst-engine';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    const purchase = await prisma.purchase.findUnique({
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

    if (!purchase) {
      return NextResponse.json({ success: false, error: 'Purchase bill not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, purchase });
  } catch (error: any) {
    console.error('Error fetching purchase:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const {
      partyId,
      partyName,
      partyPhone,
      partyGstin,
      partyAddress,
      partyState = 'Delhi',
      customBillNumber,
      paymentMode = 'BANK',
      paidAmount = 0,
      notes,
      items = [],
    } = body;

    const existingPurchase = await prisma.purchase.findUnique({
      where: { id },
      include: {
        items: true,
        business: true,
      },
    });

    if (!existingPurchase) {
      return NextResponse.json({ success: false, error: 'Purchase bill not found' }, { status: 404 });
    }

    const business = existingPurchase.business;
    const sellerStateCode = partyGstin && partyGstin.length >= 2 ? partyGstin.substring(0, 2) : (business?.stateCode || '07');
    const buyerStateCode = business?.stateCode || '07';

    // Calculate GST using Engine
    const gstResult = calculateInvoiceGst(sellerStateCode, buyerStateCode, items);

    const actualPaid = Number(paidAmount) || 0;
    const balance = Math.max(0, gstResult.grandTotal - actualPaid);
    const paymentStatus = balance === 0 ? 'PAID' : actualPaid > 0 ? 'PARTIAL' : 'UNPAID';

    const updatedPurchase = await prisma.$transaction(async (tx) => {
      // 1. Revert previous stock addition for old items
      for (const oldItem of existingPurchase.items) {
        if (oldItem.productId) {
          const prod = await tx.product.findUnique({ where: { id: oldItem.productId } });
          if (prod) {
            const restoredStock = Math.max(0, prod.currentStock - oldItem.quantity);
            await tx.product.update({
              where: { id: prod.id },
              data: {
                currentStock: restoredStock,
                stockValue: restoredStock * prod.purchasePrice,
              },
            });
          }
        }
      }

      // Remove previous stock movements for this purchase bill
      await tx.stockMovement.deleteMany({
        where: { referenceId: id, referenceType: 'BILL' },
      });

      // 2. Revert previous supplier balance
      if (existingPurchase.partyId && existingPurchase.balanceAmount > 0) {
        await tx.party.update({
          where: { id: existingPurchase.partyId },
          data: { currentBalance: { increment: existingPurchase.balanceAmount } },
        });
      }

      // 3. Delete old items
      await tx.purchaseItem.deleteMany({
        where: { purchaseId: id },
      });

      // 4. Update Purchase Record
      const billNumber = customBillNumber || existingPurchase.billNumber;
      const updated = await tx.purchase.update({
        where: { id },
        data: {
          billNumber,
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

      // 5. Create new items and apply new stock increments
      for (const item of gstResult.items) {
        await tx.purchaseItem.create({
          data: {
            purchaseId: id,
            productId: item.productId || null,
            productName: item.productName,
            hsnCode: item.hsnCode || null,
            quantity: item.quantity,
            unit: item.unit || 'PCS',
            unitPrice: item.unitPrice,
            discountPercent: item.discountPercent || 0,
            discountAmount: item.discountAmount || 0,
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
                purchasePrice: item.unitPrice,
                stockValue: newStock * item.unitPrice,
              },
            });

            await tx.stockMovement.create({
              data: {
                businessId: business?.id || prod.businessId,
                productId: prod.id,
                type: 'PURCHASE',
                quantity: item.quantity,
                previousStock: prod.currentStock,
                newStock,
                unitPrice: item.unitPrice,
                referenceId: id,
                referenceType: 'BILL',
                notes: `Purchase Bill #${billNumber} (Updated)`,
              },
            });
          }
        }
      }

      // 6. Apply new supplier balance
      if (partyId && balance > 0) {
        await tx.party.update({
          where: { id: partyId },
          data: { currentBalance: { decrement: balance } },
        });
      }

      return updated;
    });

    return NextResponse.json({ success: true, purchase: updatedPurchase });
  } catch (error: any) {
    console.error('Error updating purchase:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    const existingPurchase = await prisma.purchase.findUnique({
      where: { id },
      include: {
        items: true,
        business: true,
      },
    });

    if (!existingPurchase) {
      return NextResponse.json({ success: false, error: 'Purchase bill not found' }, { status: 404 });
    }

    await prisma.$transaction(async (tx) => {
      // 1. Revert product stock added by this purchase
      for (const item of existingPurchase.items) {
        if (item.productId) {
          const prod = await tx.product.findUnique({ where: { id: item.productId } });
          if (prod) {
            const revertedStock = Math.max(0, prod.currentStock - item.quantity);
            await tx.product.update({
              where: { id: prod.id },
              data: {
                currentStock: revertedStock,
                stockValue: revertedStock * prod.purchasePrice,
              },
            });

            await tx.stockMovement.create({
              data: {
                businessId: existingPurchase.businessId,
                productId: prod.id,
                type: 'ADJUSTMENT_OUT',
                quantity: -item.quantity,
                previousStock: prod.currentStock,
                newStock: revertedStock,
                unitPrice: item.unitPrice,
                referenceId: id,
                referenceType: 'BILL_DELETE',
                notes: `Stock Reversal: Purchase Bill #${existingPurchase.billNumber} Deleted`,
              },
            });
          }
        }
      }

      // 2. Delete original stock movements
      await tx.stockMovement.deleteMany({
        where: { referenceId: id, referenceType: 'BILL' },
      });

      // 3. Revert supplier balance if payable was recorded
      if (existingPurchase.partyId && existingPurchase.balanceAmount > 0) {
        await tx.party.update({
          where: { id: existingPurchase.partyId },
          data: { currentBalance: { increment: existingPurchase.balanceAmount } },
        });
      }

      // 4. Delete purchase items
      await tx.purchaseItem.deleteMany({
        where: { purchaseId: id },
      });

      // 5. Delete the purchase bill record
      await tx.purchase.delete({
        where: { id },
      });
    });

    return NextResponse.json({
      success: true,
      message: `Purchase bill #${existingPurchase.billNumber} deleted and stock reversed successfully.`,
    });
  } catch (error: any) {
    console.error('Error deleting purchase:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
