import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { calculateInvoiceGst } from '@/lib/gst-engine';
import { postSaleJournalEntry, reverseSaleJournalEntry } from '@/lib/accounting-engine';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    const sale = await prisma.sale.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            product: true,
          },
        },
        party: true,
        business: true,
        allocations: true,
      },
    });

    if (!sale) {
      return NextResponse.json({ success: false, error: 'Sale invoice not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, sale });
  } catch (error: any) {
    console.error('Error fetching sale:', error);
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
      partyState = 'Delhi',
      partyStateCode = '07',
      paymentMode = 'CASH',
      paidAmount = 0,
      notes,
      terms,
      items = [],
    } = body;

    const existingSale = await prisma.sale.findUnique({
      where: { id },
      include: {
        items: true,
        business: true,
      },
    });

    if (!existingSale) {
      return NextResponse.json({ success: false, error: 'Sale invoice not found' }, { status: 404 });
    }

    const business = existingSale.business;
    const sellerStateCode = business?.stateCode || '07';
    const buyerStateCode = partyGstin && partyGstin.length >= 2 ? partyGstin.substring(0, 2) : (partyStateCode || sellerStateCode);

    // Calculate GST using Engine
    const gstResult = calculateInvoiceGst(sellerStateCode, buyerStateCode, items);

    const actualPaid = Number(paidAmount) || 0;
    const balance = Math.max(0, gstResult.grandTotal - actualPaid);
    const paymentStatus = balance === 0 ? 'PAID' : actualPaid > 0 ? 'PARTIAL' : 'UNPAID';

    // Atomic transaction for updating sale, reverting old inventory, applying new inventory, adjusting balances
    const updatedSale = await prisma.$transaction(async (tx) => {
      // 1. Revert previous inventory increments
      for (const oldItem of existingSale.items) {
        if (oldItem.productId) {
          const prod = await tx.product.findUnique({ where: { id: oldItem.productId } });
          if (prod) {
            const restoredStock = prod.currentStock + oldItem.quantity;
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

      // Remove previous stock movements for this sale
      await tx.stockMovement.deleteMany({
        where: { referenceId: id, referenceType: 'INVOICE' },
      });

      // 2. Revert previous party balance
      if (existingSale.partyId && existingSale.balanceAmount > 0) {
        await tx.party.update({
          where: { id: existingSale.partyId },
          data: { currentBalance: { decrement: existingSale.balanceAmount } },
        });
      }

      // 3. Delete existing line items
      await tx.saleItem.deleteMany({
        where: { saleId: id },
      });

      // 4. Update Sale record
      const sale = await tx.sale.update({
        where: { id },
        data: {
          partyId: partyId || null,
          partyName: partyName || 'Cash Customer',
          partyGstin: partyGstin || null,
          partyPhone: partyPhone || null,
          partyState,
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

      // 5. Create new items and decrement stock
      for (const item of gstResult.items) {
        await tx.saleItem.create({
          data: {
            saleId: id,
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
                referenceId: id,
                referenceType: 'INVOICE',
                notes: `Invoice #${sale.invoiceNumber} (Updated)`,
              },
            });
          }
        }
      }

      // 6. Update new party balance
      if (partyId && balance > 0) {
        await tx.party.update({
          where: { id: partyId },
          data: { currentBalance: { increment: balance } },
        });
      }

      return sale;
    });

    // 7. Reverse old journal entry and post fresh journal entry
    await reverseSaleJournalEntry(id);
    await postSaleJournalEntry(id);

    return NextResponse.json({ success: true, sale: updatedSale });
  } catch (error: any) {
    console.error('Error updating sale:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    const sale = await prisma.sale.findUnique({
      where: { id },
      include: {
        items: true,
        business: true,
      },
    });

    if (!sale) {
      return NextResponse.json({ success: false, error: 'Sale invoice not found' }, { status: 404 });
    }

    await prisma.$transaction(async (tx) => {
      // 1. Restore product stock
      for (const item of sale.items) {
        if (item.productId) {
          const prod = await tx.product.findUnique({ where: { id: item.productId } });
          if (prod) {
            const restoredStock = prod.currentStock + item.quantity;
            await tx.product.update({
              where: { id: prod.id },
              data: {
                currentStock: restoredStock,
                stockValue: restoredStock * prod.purchasePrice,
              },
            });

            await tx.stockMovement.create({
              data: {
                businessId: sale.businessId,
                productId: prod.id,
                type: 'ADJUSTMENT_IN',
                quantity: item.quantity,
                previousStock: prod.currentStock,
                newStock: restoredStock,
                unitPrice: item.unitPrice,
                referenceId: sale.id,
                referenceType: 'INVOICE',
                notes: `Invoice #${sale.invoiceNumber} deleted`,
              },
            });
          }
        }
      }

      // 2. Remove stock movements
      await tx.stockMovement.deleteMany({
        where: { referenceId: id, referenceType: 'INVOICE' },
      });

      // 3. Revert party current balance
      if (sale.partyId && sale.balanceAmount > 0) {
        await tx.party.update({
          where: { id: sale.partyId },
          data: { currentBalance: { decrement: sale.balanceAmount } },
        });
      }

      // 4. Delete allocations
      await tx.paymentAllocation.deleteMany({
        where: { saleId: id },
      });

      // 5. Delete sale items
      await tx.saleItem.deleteMany({
        where: { saleId: id },
      });

      // 6. Delete the sale itself
      await tx.sale.delete({
        where: { id },
      });
    });

    // 7. Reverse journal entry
    await reverseSaleJournalEntry(id);

    return NextResponse.json({ success: true, message: 'Invoice deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting sale:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
