import React from 'react';
import Link from 'next/link';
import { formatINR } from '@/lib/currency';
import { Badge } from '@/components/ui/Badge';
import { ChevronRight } from 'lucide-react';

interface RecentSalesProps {
  sales: Array<{
    id: string;
    invoiceNumber: string;
    invoiceDate: Date | string;
    partyName: string;
    grandTotal: number;
    paidAmount: number;
    balanceAmount: number;
    paymentStatus: string;
    paymentMode: string;
  }>;
}

export function RecentSalesTable({ sales }: RecentSalesProps) {
  const safeSales = Array.isArray(sales) ? sales : [];

  return (
    <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm transition-colors duration-150">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Recent Sales & Invoices</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Latest finalized customer transactions</p>
        </div>
        <Link
          href="/app/sales"
          className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 flex items-center gap-1"
        >
          <span>View All</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      <div className="overflow-x-auto -mx-4 sm:mx-0">
        <div className="inline-block min-w-full align-middle px-4 sm:px-0">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/60 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase border-y border-slate-200 dark:border-slate-800">
                <th className="py-2.5 px-3 whitespace-nowrap">Invoice No</th>
                <th className="py-2.5 px-3 whitespace-nowrap">Date</th>
                <th className="py-2.5 px-3 whitespace-nowrap">Customer</th>
                <th className="py-2.5 px-3 whitespace-nowrap">Mode</th>
                <th className="py-2.5 px-3 text-right whitespace-nowrap">Amount</th>
                <th className="py-2.5 px-3 text-center whitespace-nowrap">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {safeSales.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-slate-400 dark:text-slate-500">
                    No recent sales recorded yet.
                  </td>
                </tr>
              ) : (
                safeSales.map((sale) => {
                  let dateStr = '-';
                  try {
                    if (sale?.invoiceDate) {
                      const d = new Date(sale.invoiceDate);
                      if (!isNaN(d.getTime())) {
                        dateStr = d.toLocaleDateString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                        });
                      }
                    }
                  } catch (_) {}

                  return (
                    <tr key={sale.id || Math.random()} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-3 font-mono font-bold whitespace-nowrap">
                        <Link
                          href="/app/sales"
                          className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:underline"
                          title="View in Sales"
                        >
                          {sale.invoiceNumber || 'INV-DRAFT'}
                        </Link>
                      </td>
                      <td className="py-3 px-3 text-slate-500 dark:text-slate-400 whitespace-nowrap">{dateStr}</td>
                      <td className="py-3 px-3 font-semibold text-slate-800 dark:text-slate-200 max-w-[150px] truncate">
                        {sale.partyName || 'Cash Customer'}
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap">
                        <span className="font-mono text-[10px] sm:text-[11px] bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                          {sale.paymentMode || 'CASH'}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-slate-900 dark:text-slate-100 whitespace-nowrap">
                        {formatINR(sale.grandTotal)}
                      </td>
                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        <Badge
                          variant={
                            sale.paymentStatus === 'PAID'
                              ? 'success'
                              : sale.paymentStatus === 'PARTIAL'
                              ? 'warning'
                              : 'danger'
                          }
                        >
                          {sale.paymentStatus || 'PENDING'}
                        </Badge>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
