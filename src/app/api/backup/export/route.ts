import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const [
      business,
      sales,
      nonGstInvoices,
      purchases,
      products,
      parties,
      payments,
      stockMovements,
    ] = await Promise.all([
      prisma.business.findFirst({
        include: {
          branches: true,
          categories: true,
          units: true,
        },
      }),
      prisma.sale.findMany({
        include: {
          items: true,
          party: true,
        },
        orderBy: { invoiceDate: 'desc' },
      }),
      prisma.nonGstInvoice.findMany({
        include: {
          items: true,
          party: true,
        },
        orderBy: { invoiceDate: 'desc' },
      }),
      prisma.purchase.findMany({
        include: {
          items: true,
          party: true,
        },
        orderBy: { billDate: 'desc' },
      }),
      prisma.product.findMany({
        include: {
          category: true,
          unit: true,
        },
        orderBy: { name: 'asc' },
      }),
      prisma.party.findMany({
        orderBy: { name: 'asc' },
      }),
      prisma.payment.findMany({
        orderBy: { paymentDate: 'desc' },
      }),
      prisma.stockMovement.findMany({
        orderBy: { createdAt: 'desc' },
        take: 2000,
      }),
    ]);

    const backupSnapshot = {
      system: 'RAHUL JEE TRADING COMPANY ERP',
      exportTimestamp: new Date().toISOString(),
      summary: {
        totalGstSales: sales.length,
        totalNonGstInvoices: nonGstInvoices.length,
        totalPurchases: purchases.length,
        totalProducts: products.length,
        totalParties: parties.length,
        totalPayments: payments.length,
        totalStockMovements: stockMovements.length,
      },
      business,
      sales,
      nonGstInvoices,
      purchases,
      products,
      parties,
      payments,
      stockMovements,
    };

    const jsonString = JSON.stringify(backupSnapshot, null, 2);
    const dateStr = new Date().toISOString().split('T')[0];
    const fileName = `RJTC_Full_Backup_${dateStr}.json`;

    return new NextResponse(jsonString, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="${fileName}"`,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });
  } catch (error: any) {
    console.error('Full backup export error:', error);
    return NextResponse.json(
      { error: 'Failed to export backup: ' + error.message },
      { status: 500 }
    );
  }
}
