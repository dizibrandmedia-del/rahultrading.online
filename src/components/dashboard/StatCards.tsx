import React from 'react';
import { formatINR } from '@/lib/currency';
import {
  ArrowUpRight,
  ArrowDownLeft,
  Package,
  Wallet,
  TrendingUp,
  AlertCircle
} from 'lucide-react';

interface StatCardsProps {
  stats: {
    todaySales: number;
    todayPurchases: number;
    totalReceivable: number;
    totalPayable: number;
    cashBankBalance: number;
    stockValue: number;
    todayProfit: number;
    lowStockCount: number;
  };
}

export function StatCards({ stats }: StatCardsProps) {
  const cards = [
    {
      title: "Today's Sales",
      value: formatINR(stats.todaySales),
      subtitle: "Gross billing today",
      icon: TrendingUp,
      textColor: "text-blue-600 dark:text-blue-400",
      bgColor: "bg-blue-50 dark:bg-blue-950/50 border-blue-200 dark:border-blue-800",
    },
    {
      title: "Total Receivable",
      value: formatINR(stats.totalReceivable),
      subtitle: "From customers & debtors",
      icon: ArrowDownLeft,
      textColor: "text-emerald-600 dark:text-emerald-400",
      bgColor: "bg-emerald-50 dark:bg-emerald-950/50 border-emerald-200 dark:border-emerald-800",
    },
    {
      title: "Total Payable",
      value: formatINR(stats.totalPayable),
      subtitle: "To suppliers & creditors",
      icon: ArrowUpRight,
      textColor: "text-rose-600 dark:text-rose-400",
      bgColor: "bg-rose-50 dark:bg-rose-950/50 border-rose-200 dark:border-rose-800",
    },
    {
      title: "Cash & Bank Balance",
      value: formatINR(stats.cashBankBalance),
      subtitle: "Liquid operating funds",
      icon: Wallet,
      textColor: "text-purple-600 dark:text-purple-400",
      bgColor: "bg-purple-50 dark:bg-purple-950/50 border-purple-200 dark:border-purple-800",
    },
    {
      title: "Total Stock Value",
      value: formatINR(stats.stockValue),
      subtitle: `${stats.lowStockCount > 0 ? `${stats.lowStockCount} items low` : 'Inventory healthy'}`,
      icon: Package,
      textColor: "text-amber-600 dark:text-amber-400",
      bgColor: "bg-amber-50 dark:bg-amber-950/50 border-amber-200 dark:border-amber-800",
      alert: stats.lowStockCount > 0,
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
      {cards.map((card, idx) => {
        const Icon = card.icon;
        return (
          <div
            key={idx}
            className={`bg-white dark:bg-slate-900 p-3 sm:p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all relative overflow-hidden flex flex-col justify-between ${
              idx === 4 ? 'col-span-2 sm:col-span-1' : ''
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="min-w-0 pr-2">
                <p className="text-[10px] sm:text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider truncate">
                  {card.title}
                </p>
                <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-slate-100 mt-0.5 sm:mt-1 font-mono tracking-tight truncate">
                  {card.value}
                </h3>
              </div>
              <div className={`p-2 sm:p-2.5 rounded-xl ${card.bgColor} border shrink-0`}>
                <Icon className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${card.textColor}`} />
              </div>
            </div>

            <div className="mt-2.5 pt-2 sm:mt-3 sm:pt-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[10px] sm:text-[11px]">
              <span className="text-slate-500 dark:text-slate-400 font-medium truncate">{card.subtitle}</span>
              {card.alert && (
                <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400 font-bold shrink-0">
                  <AlertCircle className="w-3 h-3" />
                  Alert
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
