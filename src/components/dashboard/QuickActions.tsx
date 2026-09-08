import React from 'react';
import Link from 'next/link';
import {
  Receipt,
  ShoppingCart,
  Zap,
  ArrowDownLeft,
  ArrowUpRight,
  UserPlus,
  PackagePlus,
  FileSpreadsheet
} from 'lucide-react';

export function QuickActions() {
  const actions = [
    {
      label: 'New Sale (F1)',
      href: '/app/sales/new',
      icon: Receipt,
      color: 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/50 border-blue-200 dark:border-blue-800'
    },
    {
      label: 'Express POS',
      href: '/app/pos',
      icon: Zap,
      color: 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/50 border-amber-200 dark:border-amber-800'
    },
    {
      label: 'New Purchase',
      href: '/app/purchases',
      icon: ShoppingCart,
      color: 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 border-indigo-200 dark:border-indigo-800'
    },
    {
      label: 'Receive Payment (F6)',
      href: '/app/payments',
      icon: ArrowDownLeft,
      color: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 border-emerald-200 dark:border-emerald-800'
    },
    {
      label: 'Add Expense',
      href: '/app/expenses',
      icon: ArrowUpRight,
      color: 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 hover:bg-rose-100 dark:hover:bg-rose-900/50 border-rose-200 dark:border-rose-800'
    },
    {
      label: 'Add Party (F4)',
      href: '/app/parties',
      icon: UserPlus,
      color: 'bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300 hover:bg-teal-100 dark:hover:bg-teal-900/50 border-teal-200 dark:border-teal-800'
    },
    {
      label: 'Add Item (F5)',
      href: '/app/items',
      icon: PackagePlus,
      color: 'bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 hover:bg-purple-100 dark:hover:bg-purple-900/50 border-purple-200 dark:border-purple-800'
    },
    {
      label: 'GSTR Report',
      href: '/app/gst',
      icon: FileSpreadsheet,
      color: 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 border-slate-200 dark:border-slate-700'
    },
  ];

  return (
    <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm transition-colors duration-150">
      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3">
        Quick Action Launcher
      </h3>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-2.5">
        {actions.map((act, i) => {
          const Icon = act.icon;
          return (
            <Link
              key={i}
              href={act.href}
              className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs font-semibold transition-all active:scale-95 ${act.color}`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span className="truncate">{act.label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
