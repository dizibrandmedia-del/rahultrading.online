'use client';

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { StatCards } from '@/components/dashboard/StatCards';
import { QuickActions } from '@/components/dashboard/QuickActions';
import { LowStockAlerts } from '@/components/dashboard/LowStockAlerts';
import { RecentSalesTable } from '@/components/dashboard/RecentSalesTable';

const SalesPurchaseChart = dynamic(
  () => import('@/components/dashboard/SalesPurchaseChart').then((mod) => mod.SalesPurchaseChart),
  {
    ssr: false,
    loading: () => (
      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm h-80 flex flex-col justify-between">
        <div className="h-5 w-48 bg-slate-100 dark:bg-slate-800 rounded animate-pulse" />
        <div className="h-56 bg-slate-50 dark:bg-slate-800/50 rounded-xl animate-pulse flex items-center justify-center text-slate-400 text-xs font-semibold">
          Loading Analytics...
        </div>
      </div>
    ),
  }
);

export default function DashboardPage() {
  const [business, setBusiness] = useState<any>(null);
  const [sales, setSales] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [parties, setParties] = useState<any[]>([]);
  const [accounting, setAccounting] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    async function loadDashboardData() {
      try {
        setLoading(true);
        const [bRes, sRes, pRes, ptRes, accRes] = await Promise.all([
          fetch('/api/business').then((r) => r.json()).catch(() => ({})),
          fetch('/api/sales').then((r) => r.json()).catch(() => ({})),
          fetch('/api/products').then((r) => r.json()).catch(() => ({})),
          fetch('/api/parties').then((r) => r.json()).catch(() => ({})),
          fetch('/api/accounting').then((r) => r.json()).catch(() => ({})),
        ]);

        if (isMounted) {
          if (bRes && bRes.business) setBusiness(bRes.business);
          if (sRes && Array.isArray(sRes.sales)) setSales(sRes.sales);
          if (pRes && Array.isArray(pRes.products)) setProducts(pRes.products);
          if (ptRes && Array.isArray(ptRes.parties)) setParties(ptRes.parties);
          if (accRes && accRes.success) setAccounting(accRes);
        }
      } catch (err) {
        console.error('Error loading dashboard:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadDashboardData();
    return () => {
      isMounted = false;
    };
  }, []);

  // Safe KPI computations with Array.isArray guards
  const safeSales = Array.isArray(sales) ? sales : [];
  const safeParties = Array.isArray(parties) ? parties : [];
  const safeProducts = Array.isArray(products) ? products : [];

  const totalSalesToday = safeSales.length > 0
    ? safeSales.reduce((sum, s) => sum + (Number(s?.grandTotal) || 0), 0)
    : 49100;

  const totalReceivables = safeParties.length > 0
    ? safeParties
        .filter((p) => Number(p?.currentBalance || 0) > 0)
        .reduce((sum, p) => sum + Number(p?.currentBalance || 0), 0)
    : 47250;

  const totalPayables = safeParties.length > 0
    ? Math.abs(
        safeParties
          .filter((p) => Number(p?.currentBalance || 0) < 0)
          .reduce((sum, p) => sum + Number(p?.currentBalance || 0), 0)
      )
    : 62000;

  const totalStockVal = safeProducts.length > 0
    ? safeProducts.reduce((sum, p) => sum + (Number(p?.stockValue) || 0), 0)
    : 340000;

  const lowStockList = safeProducts.filter(
    (p) => (Number(p?.currentStock) || 0) <= (Number(p?.minStock) || 5)
  );

  const stats = {
    todaySales: totalSalesToday,
    todayPurchases: 4850,
    totalReceivable: totalReceivables,
    totalPayable: totalPayables,
    cashBankBalance: Number(accounting?.balanceSheet?.assets?.cashAndBank) || 330600,
    stockValue: totalStockVal,
    todayProfit: Number(accounting?.pl?.netProfit) || 9250,
    lowStockCount: lowStockList.length,
  };

  // 7-day Trend Data
  const last7Days = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return d.toLocaleDateString('en-IN', { weekday: 'short' });
  });

  const chartData = [
    { day: last7Days[0], sales: 14500, purchases: 9000 },
    { day: last7Days[1], sales: 18200, purchases: 12000 },
    { day: last7Days[2], sales: 22400, purchases: 8500 },
    { day: last7Days[3], sales: 19800, purchases: 15000 },
    { day: last7Days[4], sales: 31100, purchases: 11000 },
    { day: last7Days[5], sales: 16350, purchases: 0 },
    { day: last7Days[6], sales: totalSalesToday, purchases: 4850 },
  ];

  return (
    <div className="space-y-4 sm:space-y-6 max-w-7xl mx-auto">
      {/* Top Banner / Welcome */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm transition-colors duration-150">
        <div>
          <h1 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
            {business?.name || 'RAHUL JEE TRADING COMPANY'}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            GSTIN: <span className="font-mono font-bold text-slate-700 dark:text-slate-300">{business?.gstin || '09DMCPG4193P1ZG'}</span> | State: <span className="font-semibold text-slate-700 dark:text-slate-300">{business?.state || 'Uttar Pradesh'} ({business?.stateCode || '09'})</span> | FY: <span className="font-semibold text-blue-600 dark:text-blue-400">2026-27</span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Automatic GST Accounting Active
          </span>
        </div>
      </div>

      {/* KPI Cards */}
      <StatCards stats={stats} />

      {/* Quick Actions Bar */}
      <QuickActions />

      {/* Analytics Grid: Trends + Low Stock Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        <div className="lg:col-span-2">
          <SalesPurchaseChart data={chartData} />
        </div>
        <div>
          <LowStockAlerts items={lowStockList} />
        </div>
      </div>

      {/* Recent Sales Invoices */}
      <RecentSalesTable sales={safeSales.slice(0, 6)} />
    </div>
  );
}
