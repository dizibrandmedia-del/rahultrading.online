import React from 'react';
import Link from 'next/link';
import { AlertTriangle, ChevronRight } from 'lucide-react';

interface LowStockProps {
  items: Array<{
    id: string;
    name: string;
    sku?: string | null;
    currentStock: number;
    minStock: number;
    unit?: { shortName: string } | null;
  }>;
}

export function LowStockAlerts({ items }: LowStockProps) {
  return (
    <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between transition-colors duration-150">
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Low Stock Reorder Alerts</h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">Items below safety thresholds</p>
            </div>
          </div>
          <span className="text-xs font-bold bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 px-2 py-0.5 rounded-full border border-amber-200 dark:border-amber-800">
            {items.length} Alert{items.length !== 1 ? 's' : ''}
          </span>
        </div>

        {items.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-400 dark:text-slate-500">
            All inventory items are currently above minimum safety stock.
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-56 overflow-y-auto">
            {items.map((item) => (
              <div key={item.id} className="py-2.5 flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate max-w-[180px] sm:max-w-[240px]">
                    {item.name}
                  </p>
                  <p className="text-[10px] font-mono text-slate-400 dark:text-slate-500">
                    Min Required: {item.minStock} {item.unit?.shortName || 'PCS'}
                  </p>
                </div>
                <div className="text-right">
                  <span className="inline-block px-2 py-0.5 rounded text-xs font-bold font-mono bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800">
                    {item.currentStock} {item.unit?.shortName || 'PCS'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
        <Link
          href="/app/items"
          className="w-full flex items-center justify-center gap-1.5 py-2 bg-slate-50 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-xs rounded-xl border border-slate-200 dark:border-slate-700 transition-colors"
        >
          <span>Manage All Inventory</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
}
