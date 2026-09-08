'use client';

import React from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { formatINR } from '@/lib/currency';
import { useTheme } from '@/components/theme/ThemeProvider';

interface ChartProps {
  data?: Array<{
    day: string;
    sales: number;
    purchases: number;
  }>;
}

export function SalesPurchaseChart({ data }: ChartProps) {
  const [mounted, setMounted] = React.useState(false);
  const { theme } = useTheme();

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const chartData = data && data.length > 0 ? data : [
    { day: 'Mon', sales: 12000, purchases: 8000 },
    { day: 'Tue', sales: 18500, purchases: 5000 },
    { day: 'Wed', sales: 14000, purchases: 11000 },
    { day: 'Thu', sales: 22000, purchases: 9500 },
    { day: 'Fri', sales: 31100, purchases: 14000 },
    { day: 'Sat', sales: 42000, purchases: 18000 },
    { day: 'Sun', sales: 28500, purchases: 6000 },
  ];

  if (!mounted) {
    return (
      <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm h-80 flex flex-col justify-between">
        <div className="h-5 w-48 bg-slate-100 dark:bg-slate-800 rounded animate-pulse" />
        <div className="h-56 bg-slate-50 dark:bg-slate-800/50 rounded-xl animate-pulse flex items-center justify-center text-slate-400 text-xs font-semibold">
          Loading Analytics...
        </div>
      </div>
    );
  }

  const isDark = theme === 'dark';

  return (
    <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm transition-colors duration-150">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
        <div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Revenue & Inward Trends (Last 7 Days)</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Real-time daily sales vs purchase volumes</p>
        </div>
        <div className="flex items-center gap-3 text-xs font-semibold">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-600 dark:bg-blue-400" />
            <span className="text-slate-600 dark:text-slate-400">Sales</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
            <span className="text-slate-600 dark:text-slate-400">Purchases</span>
          </div>
        </div>
      </div>

      <div className="h-60 sm:h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
            <defs>
              <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#2563eb" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#2563eb" stopOpacity={0.0} />
              </linearGradient>
              <linearGradient id="colorPurchases" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#f43f5e" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              vertical={false}
              stroke={isDark ? '#1e293b' : '#f1f5f9'}
            />
            <XAxis
              dataKey="day"
              tick={{ fontSize: 11, fill: isDark ? '#94a3b8' : '#64748b' }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 10, fill: isDark ? '#94a3b8' : '#64748b' }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(val) => `₹${val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}`}
            />
            <Tooltip
              formatter={(value: any) => [formatINR(Number(value)), '']}
              contentStyle={{
                backgroundColor: isDark ? '#0f172a' : '#ffffff',
                borderRadius: '0.75rem',
                border: isDark ? '1px solid #334155' : '1px solid #e2e8f0',
                boxShadow: '0 4px 6px -1px rgba(0,0,0,0.2)',
                fontSize: '12px',
                fontWeight: 600,
                color: isDark ? '#f8fafc' : '#0f172a',
              }}
            />
            <Area
              type="monotone"
              dataKey="sales"
              name="Sales"
              stroke="#2563eb"
              strokeWidth={2.5}
              fillOpacity={1}
              fill="url(#colorSales)"
            />
            <Area
              type="monotone"
              dataKey="purchases"
              name="Purchases"
              stroke="#f43f5e"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorPurchases)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
