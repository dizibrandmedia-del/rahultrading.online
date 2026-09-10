import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ensureDefaultAccounts } from '@/lib/accounting-engine';
import { getOrCreateDefaultBusiness } from '@/lib/seed-helper';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const businessId = searchParams.get('businessId') || undefined;

    let business = await prisma.business.findFirst({
      where: businessId ? { id: businessId } : undefined,
    });

    if (!business) {
      business = await getOrCreateDefaultBusiness();
    }

    if (!business) {
      return NextResponse.json({ success: false, error: 'Business not found' }, { status: 404 });
    }

    await ensureDefaultAccounts(business.id);

    // Fetch Accounts
    const accounts = await prisma.account.findMany({
      where: { businessId: business.id },
      orderBy: { code: 'asc' },
    });

    // Fetch Day Book (Recent Journal Entries & Ledger Postings)
    const journalEntries = await prisma.journalEntry.findMany({
      where: { businessId: business.id },
      include: {
        entries: {
          include: {
            account: true,
            party: true,
          },
        },
      },
      orderBy: { entryDate: 'desc' },
      take: 50,
    });

    // Compute P&L
    const salesTotal = await prisma.sale.aggregate({
      where: { businessId: business.id },
      _sum: { taxableTotal: true },
    });

    const purchasesTotal = await prisma.purchase.aggregate({
      where: { businessId: business.id },
      _sum: { taxableTotal: true },
    });

    const expensesTotal = await prisma.expense.aggregate({
      where: { businessId: business.id },
      _sum: { amount: true },
    });

    const revenue = salesTotal._sum.taxableTotal || 0;
    const cogs = purchasesTotal._sum.taxableTotal || 0;
    const grossProfit = revenue - cogs;
    const operatingExpenses = expensesTotal._sum.amount || 0;
    const netProfit = grossProfit - operatingExpenses;

    // Compute Balance Sheet components
    const receivables = await prisma.party.aggregate({
      where: { businessId: business.id, currentBalance: { gt: 0 } },
      _sum: { currentBalance: true },
    });

    const payables = await prisma.party.aggregate({
      where: { businessId: business.id, currentBalance: { lt: 0 } },
      _sum: { currentBalance: true },
    });

    const stock = await prisma.product.aggregate({
      where: { businessId: business.id },
      _sum: { stockValue: true },
    });


    // Dynamic Cash & Bank balance from Cash in Hand (1000) and Bank Accounts (1100)
    const cashAcc = accounts.find((a) => a.code === '1000');
    const bankAcc = accounts.find((a) => a.code === '1100');
    const cashAndBank = (Number(cashAcc?.balance) || 0) + (Number(bankAcc?.balance) || 0);

    const gstPayableAcc = accounts.find((a) => a.code === '2100');
    const gstInputAcc = accounts.find((a) => a.code === '1300');
    const gstPayable = Math.max(0, (Number(gstPayableAcc?.balance) || 0) - (Number(gstInputAcc?.balance) || 0));

    const capitalAcc = accounts.find((a) => a.code === '3000');
    const ownerCapital = Number(capitalAcc?.balance) || 0;

    const totalReceivables = Number(receivables._sum.currentBalance) || 0;
    const totalInventory = Number(stock._sum.stockValue) || 0;
    const totalAssets = cashAndBank + totalReceivables + totalInventory;

    const totalPayables = Math.abs(Number(payables._sum.currentBalance) || 0);
    const totalLiabilities = totalPayables + gstPayable;
    const totalEquity = ownerCapital + netProfit;

    return NextResponse.json({
      success: true,
      accounts,
      journalEntries,
      pl: {
        revenue,
        cogs,
        grossProfit,
        operatingExpenses,
        netProfit,
        grossMarginPercent: revenue > 0 ? Number(((grossProfit / revenue) * 100).toFixed(1)) : 0,
        netMarginPercent: revenue > 0 ? Number(((netProfit / revenue) * 100).toFixed(1)) : 0,
      },
      balanceSheet: {
        assets: {
          cashAndBank,
          receivables: totalReceivables,
          inventory: totalInventory,
          totalAssets,
        },
        liabilities: {
          payables: totalPayables,
          gstPayable,
          totalLiabilities,
        },
        equity: {
          ownerCapital,
          retainedEarnings: netProfit,
          totalEquity,
        },
      },
    });
  } catch (error: any) {
    console.error('Error fetching accounting data:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
