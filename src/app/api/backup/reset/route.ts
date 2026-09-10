import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getOrCreateDefaultBusiness } from '@/lib/seed-helper';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { confirmText } = body;

    // Validation (case-insensitive and trimmed)
    if (!confirmText || confirmText.toString().trim().toUpperCase() !== 'RESET') {
      return NextResponse.json(
        {
          success: false,
          error: 'Confirmation mismatch. You must explicitly type "RESET" to confirm.',
        },
        { status: 400 }
      );
    }

    const business = await getOrCreateDefaultBusiness();
    if (!business) {
      return NextResponse.json(
        { success: false, error: 'Business profile not found' },
        { status: 404 }
      );
    }
    const businessId = business.id;

    // Execute in a single transactional unit to ensure complete data integrity
    const result = await prisma.$transaction(async (tx) => {
      // 1. Delete Payment Allocations & Payments
      const deletedAllocations = await tx.paymentAllocation.deleteMany({});
      const deletedPayments = await tx.payment.deleteMany({ where: { businessId } });

      // 2. Delete Invoices (GST & Non-GST) and items
      const deletedSaleItems = await tx.saleItem.deleteMany({});
      const deletedSales = await tx.sale.deleteMany({ where: { businessId } });

      const deletedNonGstItems = await tx.nonGstInvoiceItem.deleteMany({});
      const deletedNonGst = await tx.nonGstInvoice.deleteMany({ where: { businessId } });

      // 3. Delete Purchases and items
      const deletedPurchaseItems = await tx.purchaseItem.deleteMany({});
      const deletedPurchases = await tx.purchase.deleteMany({ where: { businessId } });

      // 4. Delete Inventory (Stock Movements, Batches, Products)
      const deletedStockMovements = await tx.stockMovement.deleteMany({ where: { businessId } });
      const deletedBatches = await tx.batch.deleteMany({});
      const deletedProducts = await tx.product.deleteMany({ where: { businessId } });

      // 5. Delete Expenses
      const deletedExpenses = await tx.expense.deleteMany({ where: { businessId } });

      // 6. Delete Accounting Ledgers & Journals
      const deletedLedgers = await tx.ledgerEntry.deleteMany({ where: { businessId } });
      const deletedJournals = await tx.journalEntry.deleteMany({ where: { businessId } });

      // 7. Delete Parties (Customers & Vendors)
      const deletedParties = await tx.party.deleteMany({ where: { businessId } });

      // 8. Delete any pending Auth OTPs
      const deletedOtps = await tx.authOtp.deleteMany({});

      // 9. Reset Chart of Accounts balances to 0
      await tx.account.updateMany({
        where: { businessId },
        data: { balance: 0 },
      });

      // 10. Reset Business Invoice / Bill sequence counters back to 1
      await tx.business.update({
        where: { id: businessId },
        data: {
          invoiceNextNumber: 1,
          purchaseNextNumber: 1,
          nonGstNextNumber: 1,
        },
      });

      // 11. Create Audit Log entry
      await tx.auditLog.create({
        data: {
          businessId,
          action: 'RESET_DATABASE',
          entityType: 'BUSINESS',
          entityId: businessId,
          newValues: JSON.stringify({
            timestamp: new Date().toISOString(),
            status: 'CLEAN_SLATE_FOR_PRODUCTION',
          }),
        },
      });

      return {
        sales: deletedSales.count,
        nonGst: deletedNonGst.count,
        purchases: deletedPurchases.count,
        products: deletedProducts.count,
        parties: deletedParties.count,
        expenses: deletedExpenses.count,
        payments: deletedPayments.count,
        ledgers: deletedLedgers.count,
      };
    });

    return NextResponse.json({
      success: true,
      message: 'Database successfully cleared. System is now ready for production with clean zero state.',
      details: result,
    });
  } catch (err: any) {
    console.error('Reset database error:', err);
    return NextResponse.json(
      {
        success: false,
        error: err.message || 'Failed to reset database.',
      },
      { status: 500 }
    );
  }
}
