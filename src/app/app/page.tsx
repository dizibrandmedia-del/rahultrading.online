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
  const [purchases, setPurchases] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [parties, setParties] = useState<any[]>([]);
  const [accounting, setAccounting] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    async function loadDashboardData() {
      try {
        setLoading(true);
        const [bRes, sRes, puRes, pRes, ptRes, accRes] = await Promise.all([
          fetch('/api/business').then((r) => r.json()).catch(() => ({})),
          fetch('/api/sales').then((r) => r.json()).catch(() => ({})),
          fetch('/api/purchases').then((r) => r.json()).catch(() => ({})),
          fetch('/api/products').then((r) => r.json()).catch(() => ({})),
          fetch('/api/parties').then((r) => r.json()).catch(() => ({})),
          fetch('/api/accounting').then((r) => r.json()).catch(() => ({})),
        ]);

        if (isMounted) {
          if (bRes && bRes.business) setBusiness(bRes.business);
          if (sRes && Array.isArray(sRes.sales)) setSales(sRes.sales);
          if (puRes && Array.isArray(puRes.purchases)) setPurchases(puRes.purchases);
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
  const safePurchases = Array.isArray(purchases) ? purchases : [];
  const safeParties = Array.isArray(parties) ? parties : [];
  const safeProducts = Array.isArray(products) ? products : [];

  // Compute Today's Date in local YYYY-MM-DD
  const todayStr = new Date().toISOString().split('T')[0];

  const totalSalesToday = safeSales
    .filter((s) => s?.invoiceDate && s.invoiceDate.toString().startsWith(todayStr))
    .reduce((sum, s) => sum + (Number(s?.grandTotal) || 0), 0);

  const allTimeSales = safeSales.reduce((sum, s) => sum + (Number(s?.grandTotal) || 0), 0);
  const displaySales = totalSalesToday > 0 ? totalSalesToday : (safeSales.length === 0 ? 0 : allTimeSales);

  const totalPurchasesToday = safePurchases
    .filter((p) => p?.billDate && p.billDate.toString().startsWith(todayStr))
    .reduce((sum, p) => sum + (Number(p?.grandTotal) || 0), 0);

  const allTimePurchases = safePurchases.reduce((sum, p) => sum + (Number(p?.grandTotal) || 0), 0);
  const displayPurchases = totalPurchasesToday > 0 ? totalPurchasesToday : (safePurchases.length === 0 ? 0 : allTimePurchases);

  const totalReceivables = safeParties
    .filter((p) => Number(p?.currentBalance || 0) > 0)
    .reduce((sum, p) => sum + Number(p?.currentBalance || 0), 0);

  const totalPayables = Math.abs(
    safeParties
      .filter((p) => Number(p?.currentBalance || 0) < 0)
      .reduce((sum, p) => sum + Number(p?.currentBalance || 0), 0)
  );

  const totalStockVal = safeProducts.reduce(
    (sum, p) =>
      sum +
      (Number(p?.stockValue) ||
        (Number(p?.currentStock || 0) * Number(p?.purchaseRate || 0)) ||
        0),
    0
  );

  const lowStockList = safeProducts.filter(
    (p) => (Number(p?.currentStock) || 0) <= (Number(p?.minStock) || 5)
  );

  const stats = {
    todaySales: displaySales,
    todayPurchases: displayPurchases,
    totalReceivable: totalReceivables,
    totalPayable: totalPayables,
    cashBankBalance: Number(accounting?.balanceSheet?.assets?.cashAndBank) || 0,
    stockValue: totalStockVal,
    todayProfit: Number(accounting?.pl?.netProfit) || 0,
    lowStockCount: lowStockList.length,
  };

  // 7-day Dynamic Trend Data based on actual transaction dates
  const daysList = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const dayName = d.toLocaleDateString('en-IN', { weekday: 'short' });
    const isoDate = d.toISOString().split('T')[0];
    return { dayName, isoDate };
  });

  const chartData = daysList.map(({ dayName, isoDate }) => {
    const daySales = safeSales
      .filter((s) => s?.invoiceDate && s.invoiceDate.toString().startsWith(isoDate))
      .reduce((sum, s) => sum + (Number(s?.grandTotal) || 0), 0);

    const dayPurchases = safePurchases
      .filter((p) => p?.billDate && p.billDate.toString().startsWith(isoDate))
      .reduce((sum, p) => sum + (Number(p?.grandTotal) || 0), 0);

    return {
      day: dayName,
      sales: daySales,
      purchases: dayPurchases,
    };
  });

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
