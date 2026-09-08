'use client';

import React, { useState, useEffect } from 'react';
import { formatINR } from '@/lib/currency';
import { Badge } from '@/components/ui/Badge';
import {
  Calculator,
  FileSpreadsheet,
  TrendingUp,
  Scale,
  BookOpen,
  ShieldCheck
} from 'lucide-react';

export default function AccountingPage() {
  const [activeTab, setActiveTab] = useState<'DAYBOOK' | 'PL' | 'BALANCESHEET' | 'ACCOUNTS'>('DAYBOOK');
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/accounting')
      .then((r) => r.json())
      .then((res) => {
        if (res.success) setData(res);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading || !data) {
    return (
      <div className="p-12 text-center text-xs text-slate-400 dark:text-slate-500">
        <Calculator className="w-8 h-8 mx-auto animate-pulse text-blue-600 dark:text-blue-400 mb-2" />
        Calculating double-entry balances and trial balance...
      </div>
    );
  }

  const { accounts = [], journalEntries = [], pl = {}, balanceSheet = {} } = data || {};

  return (
    <div className="space-y-4 sm:space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm transition-colors duration-150">
        <div>
          <h1 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-2">
            <Calculator className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <span>Double-Entry Automated Accounting</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 sm:mt-1">
            Real-time Day Book, Ledger Postings, Profit & Loss Statement, and Balance Sheet
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 font-bold text-xs rounded-xl border border-emerald-200 dark:border-emerald-800">
            <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>Debit-Credit Invariant Verified</span>
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1.5 sm:gap-2 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-1.5 sm:p-2 rounded-2xl border shadow-xs overflow-x-auto transition-colors duration-150">
        {[
          { id: 'DAYBOOK', label: 'Day Book', icon: BookOpen },
          { id: 'PL', label: 'Profit & Loss', icon: TrendingUp },
          { id: 'BALANCESHEET', label: 'Balance Sheet', icon: Scale },
          { id: 'ACCOUNTS', label: 'Chart of Accounts', icon: FileSpreadsheet },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
                isActive
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: Day Book */}
      {activeTab === 'DAYBOOK' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden transition-colors duration-150">
            <div className="p-4 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
                Recent Journal Entries & Double-Entry Ledger Postings
              </h3>
              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 font-mono">
                {journalEntries.length} Posted Journals
              </span>
            </div>

            <div className="divide-y divide-slate-200 dark:divide-slate-800">
              {journalEntries.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400 dark:text-slate-500">
                  No journal transactions recorded yet.
                </div>
              ) : (
                journalEntries.map((je: any) => (
                  <div key={je.id} className="p-3 sm:p-4 hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors space-y-2">
                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-blue-900 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded border border-blue-200 dark:border-blue-800">
                          {je.entryNumber}
                        </span>
                        <span className="font-semibold text-slate-800 dark:text-slate-200">{je.narration}</span>
                      </div>
                      <span className="text-slate-400 dark:text-slate-500 text-[11px] font-mono">
                        {new Date(je.entryDate).toLocaleString('en-IN', {
                          dateStyle: 'medium',
                          timeStyle: 'short',
                        })}
                      </span>
                    </div>

                    {/* Postings Table */}
                    <div className="bg-slate-50/80 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-800 overflow-x-auto text-xs">
                      <table className="w-full text-left">
                        <thead>
                          <tr className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 bg-slate-100/70 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800">
                            <th className="py-1.5 px-3 whitespace-nowrap">Account</th>
                            <th className="py-1.5 px-3 whitespace-nowrap">Description</th>
                            <th className="py-1.5 px-3 text-right whitespace-nowrap">Debit (Dr ₹)</th>
                            <th className="py-1.5 px-3 text-right whitespace-nowrap">Credit (Cr ₹)</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200/60 dark:divide-slate-800 font-mono text-[11px]">
                          {je.entries.map((entry: any) => (
                            <tr key={entry.id}>
                              <td className="py-1.5 px-3 font-semibold text-slate-800 dark:text-slate-200 whitespace-nowrap">
                                {entry.account.code} - {entry.account.name}
                              </td>
                              <td className="py-1.5 px-3 text-slate-600 dark:text-slate-400 font-sans text-xs whitespace-nowrap">
                                {entry.description}
                              </td>
                              <td className="py-1.5 px-3 text-right font-bold text-blue-700 dark:text-blue-400 whitespace-nowrap">
                                {entry.debit > 0 ? formatINR(entry.debit) : '-'}
                              </td>
                              <td className="py-1.5 px-3 text-right font-bold text-emerald-700 dark:text-emerald-400 whitespace-nowrap">
                                {entry.credit > 0 ? formatINR(entry.credit) : '-'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Profit & Loss */}
      {activeTab === 'PL' && (
        <div className="space-y-4 sm:space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            <div className="bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/60 p-3 sm:p-4 rounded-2xl">
              <p className="text-[11px] sm:text-xs font-semibold text-blue-800 dark:text-blue-300 uppercase">Gross Revenue</p>
              <h3 className="text-lg sm:text-xl font-black text-blue-950 dark:text-blue-100 font-mono mt-1">{formatINR(pl.revenue)}</h3>
            </div>
            <div className="bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/60 p-3 sm:p-4 rounded-2xl">
              <p className="text-[11px] sm:text-xs font-semibold text-indigo-800 dark:text-indigo-300 uppercase">COGS / Purchases</p>
              <h3 className="text-lg sm:text-xl font-black text-indigo-950 dark:text-indigo-100 font-mono mt-1">{formatINR(pl.cogs)}</h3>
            </div>
            <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 p-3 sm:p-4 rounded-2xl">
              <p className="text-[11px] sm:text-xs font-semibold text-emerald-800 dark:text-emerald-300 uppercase">Gross Profit</p>
              <h3 className="text-lg sm:text-xl font-black text-emerald-950 dark:text-emerald-100 font-mono mt-1">{formatINR(pl.grossProfit)}</h3>
              <p className="text-[10px] text-emerald-700 dark:text-emerald-400 mt-0.5">Margin: {pl.grossMarginPercent}%</p>
            </div>
            <div className="bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800/60 p-3 sm:p-4 rounded-2xl">
              <p className="text-[11px] sm:text-xs font-semibold text-purple-800 dark:text-purple-300 uppercase">Net Profit</p>
              <h3 className="text-lg sm:text-xl font-black text-purple-950 dark:text-purple-100 font-mono mt-1">{formatINR(pl.netProfit)}</h3>
              <p className="text-[10px] text-purple-700 dark:text-purple-400 mt-0.5">Net Margin: {pl.netMarginPercent}%</p>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-4 sm:p-6 max-w-3xl mx-auto space-y-4 transition-colors duration-150">
            <div className="text-center pb-3 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-base font-black text-slate-900 dark:text-slate-100 uppercase">Statement of Profit & Loss</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Financial Year 2026-27 (All amounts in INR ₹)</p>
            </div>

            <div className="space-y-2 text-xs divide-y divide-slate-100 dark:divide-slate-800">
              <div className="flex justify-between py-2 font-bold text-slate-800 dark:text-slate-200">
                <span>Revenue from Operations (Gross Sales)</span>
                <span className="font-mono">{formatINR(pl.revenue)}</span>
              </div>
              <div className="flex justify-between py-2 text-slate-600 dark:text-slate-400 pl-4">
                <span>Less: Cost of Goods Sold (Purchases)</span>
                <span className="font-mono text-rose-600 dark:text-rose-400">({formatINR(pl.cogs)})</span>
              </div>
              <div className="flex justify-between py-2.5 font-black text-sm bg-slate-50 dark:bg-slate-800/60 px-2 rounded-lg text-slate-900 dark:text-slate-100">
                <span>GROSS PROFIT</span>
                <span className="font-mono text-blue-600 dark:text-blue-400">{formatINR(pl.grossProfit)}</span>
              </div>
              <div className="flex justify-between py-2 text-slate-600 dark:text-slate-400 pl-4">
                <span>Less: Operating & Shop Expenses</span>
                <span className="font-mono text-rose-600 dark:text-rose-400">({formatINR(pl.operatingExpenses)})</span>
              </div>
              <div className="flex justify-between py-3 font-black text-base bg-emerald-50 dark:bg-emerald-950/40 px-3 rounded-xl border border-emerald-200 dark:border-emerald-800 text-emerald-950 dark:text-emerald-100">
                <span>NET PROFIT FOR PERIOD</span>
                <span className="font-mono text-emerald-600 dark:text-emerald-400">{formatINR(pl.netProfit)}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: Balance Sheet */}
      {activeTab === 'BALANCESHEET' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-4 sm:p-6 max-w-4xl mx-auto space-y-6 transition-colors duration-150">
          <div className="text-center pb-3 border-b border-slate-200 dark:border-slate-800">
            <h3 className="text-base font-black text-slate-900 dark:text-slate-100 uppercase">Balance Sheet</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">As of Current Date | Indian Accounting Standards</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 text-xs">
            {/* Left: Assets */}
            <div className="space-y-3">
              <h4 className="font-extrabold uppercase text-blue-900 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/60 p-2 rounded-lg border border-blue-200 dark:border-blue-800">
                Assets (Total)
              </h4>
              <div className="space-y-2 divide-y divide-slate-100 dark:divide-slate-800">
                <div className="flex justify-between py-1.5">
                  <span className="text-slate-700 dark:text-slate-300">Cash in Hand & Bank Accounts</span>
                  <span className="font-mono font-semibold text-slate-900 dark:text-slate-100">{formatINR(balanceSheet.assets.cashAndBank)}</span>
                </div>
                <div className="flex justify-between py-1.5">
                  <span className="text-slate-700 dark:text-slate-300">Accounts Receivable (Trade Debtors)</span>
                  <span className="font-mono font-semibold text-slate-900 dark:text-slate-100">{formatINR(balanceSheet.assets.receivables)}</span>
                </div>
                <div className="flex justify-between py-1.5">
                  <span className="text-slate-700 dark:text-slate-300">Stock Inventory on Hand</span>
                  <span className="font-mono font-semibold text-slate-900 dark:text-slate-100">{formatINR(balanceSheet.assets.inventory)}</span>
                </div>
                <div className="flex justify-between py-2 font-black text-sm bg-blue-50/60 dark:bg-blue-950/40 px-2 rounded-lg text-blue-950 dark:text-blue-200">
                  <span>TOTAL ASSETS</span>
                  <span className="font-mono">{formatINR(balanceSheet.assets.totalAssets)}</span>
                </div>
              </div>
            </div>

            {/* Right: Liabilities & Equity */}
            <div className="space-y-3">
              <h4 className="font-extrabold uppercase text-rose-900 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/60 p-2 rounded-lg border border-rose-200 dark:border-rose-800">
                Liabilities & Owner Equity
              </h4>
              <div className="space-y-2 divide-y divide-slate-100 dark:divide-slate-800">
                <div className="flex justify-between py-1.5">
                  <span className="text-slate-700 dark:text-slate-300">Accounts Payable (Trade Creditors)</span>
                  <span className="font-mono font-semibold text-slate-900 dark:text-slate-100">{formatINR(balanceSheet.liabilities.payables)}</span>
                </div>
                <div className="flex justify-between py-1.5">
                  <span className="text-slate-700 dark:text-slate-300">GST Tax Liability Payable</span>
                  <span className="font-mono font-semibold text-slate-900 dark:text-slate-100">{formatINR(balanceSheet.liabilities.gstPayable)}</span>
                </div>
                <div className="flex justify-between py-1.5 font-bold text-slate-800 dark:text-slate-200">
                  <span>Owner&apos;s Capital / Equity</span>
                  <span className="font-mono">{formatINR(balanceSheet.equity.ownerCapital)}</span>
                </div>
                <div className="flex justify-between py-1.5 text-emerald-700 dark:text-emerald-400 font-semibold">
                  <span>Retained Earnings (Net Profit)</span>
                  <span className="font-mono">{formatINR(balanceSheet.equity.retainedEarnings)}</span>
                </div>
                <div className="flex justify-between py-2 font-black text-sm bg-rose-50/60 dark:bg-rose-950/40 px-2 rounded-lg text-rose-950 dark:text-rose-200">
                  <span>TOTAL LIABILITIES & EQUITY</span>
                  <span className="font-mono">
                    {formatINR(balanceSheet.liabilities.totalLiabilities + balanceSheet.equity.totalEquity)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: Chart of Accounts */}
      {activeTab === 'ACCOUNTS' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden transition-colors duration-150">
          <div className="p-4 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800">
            <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
              Standard Chart of Accounts (COA)
            </h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/60 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase border-b border-slate-200 dark:border-slate-800">
                  <th className="py-3 px-4 whitespace-nowrap">Account Code</th>
                  <th className="py-3 px-4 whitespace-nowrap">Account Name</th>
                  <th className="py-3 px-4 whitespace-nowrap">Type</th>
                  <th className="py-3 px-4 whitespace-nowrap">Sub-Type</th>
                  <th className="py-3 px-4 text-right whitespace-nowrap">Current Ledger Balance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {accounts.map((acc: any) => (
                  <tr key={acc.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-blue-600 dark:text-blue-400 whitespace-nowrap">{acc.code}</td>
                    <td className="py-3 px-4 font-semibold text-slate-800 dark:text-slate-200 whitespace-nowrap">{acc.name}</td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <Badge
                        variant={
                          acc.type === 'ASSET'
                            ? 'primary'
                            : acc.type === 'LIABILITY'
                            ? 'danger'
                            : acc.type === 'REVENUE'
                            ? 'success'
                            : 'warning'
                        }
                      >
                        {acc.type}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-slate-500 dark:text-slate-400 font-mono text-[11px] whitespace-nowrap">{acc.subType}</td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-slate-900 dark:text-slate-100 whitespace-nowrap">
                      {formatINR(acc.balance)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
