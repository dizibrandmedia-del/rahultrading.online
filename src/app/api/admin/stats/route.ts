import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const totalUsers = await prisma.user.count();
    const totalBusinesses = await prisma.business.count();
    const totalSales = await prisma.sale.count();
    const totalPurchases = await prisma.purchase.count();

    const salesVolumeAgg = await prisma.sale.aggregate({
      _sum: { grandTotal: true },
    });

    const businesses = await prisma.business.findMany({
      include: {
        users: { include: { user: true } },
        _count: {
          select: { sales: true, products: true, parties: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const recentAuditLogs = await prisma.auditLog.findMany({
      include: {
        user: true,
        business: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    return NextResponse.json({
      success: true,
      stats: {
        totalUsers,
        totalBusinesses,
        totalInvoices: totalSales + totalPurchases,
        totalBillingVolume: salesVolumeAgg._sum.grandTotal || 0,
      },
      businesses,
      recentAuditLogs,
    });
  } catch (error: any) {
    console.error('Error fetching admin stats:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
