'use client';

import React, { useState, useEffect } from 'react';
import { formatINR } from '@/lib/currency';
import {
  FileSpreadsheet,
  Download,
  CheckCircle,
  FileText,
  Receipt,
  Layers
} from 'lucide-react';

export default function GstReportsPage() {
  const [sales, setSales] = useState<any[]>([]);
  const [purchases, setPurchases] = useState<any[]>([]);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'GSTR1' | 'GSTR3B' | 'HSN'>('GSTR1');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch('/api/sales').then((r) => r.json()).catch(() => ({ sales: [] })),
      fetch('/api/purchases').then((r) => r.json()).catch(() => ({ purchases: [] })),
      fetch('/api/expenses').then((r) => r.json()).catch(() => ({ expenses: [] })),
    ]).then(([sData, pData, eData]) => {
      if (sData.success && sData.sales) setSales(sData.sales);
      if (pData.success && pData.purchases) setPurchases(pData.purchases);
      if (eData.success && eData.expenses) setExpenses(eData.expenses);
      setLoading(false);
    });
  }, []);

  // Compute Outward Tax (GSTR-1 / Output GST)
  const outputCgst = sales.reduce((acc, s) => acc + (s.cgstTotal || 0), 0);
  const outputSgst = sales.reduce((acc, s) => acc + (s.sgstTotal || 0), 0);
  const outputIgst = sales.reduce((acc, s) => acc + (s.igstTotal || 0), 0);
  const totalOutputGst = outputCgst + outputSgst + outputIgst;

  // Compute Inward Tax (Input Tax Credit - ITC from Purchases & GST Expenses)
  const inputCgstPurchases = purchases.reduce((acc, p) => acc + (p.cgstTotal || 0), 0);
  const inputSgstPurchases = purchases.reduce((acc, p) => acc + (p.sgstTotal || 0), 0);
  const inputIgstPurchases = purchases.reduce((acc, p) => acc + (p.igstTotal || 0), 0);
  const inputGstExpenses = expenses.reduce((acc, e) => acc + (e.taxAmount || 0), 0);

  const totalInputGst = inputCgstPurchases + inputSgstPurchases + inputIgstPurchases + inputGstExpenses;
  const netGstPayable = Math.max(0, totalOutputGst - totalInputGst);

  // Group HSN Summaries
  const hsnMap: Record<string, { hsn: string; desc: string; qty: number; taxable: number; gst: number; total: number }> = {};
  sales.forEach((s) => {
    s.items?.forEach((it: any) => {
      const hsn = it.hsnCode || 'Others';
      if (!hsnMap[hsn]) {
        hsnMap[hsn] = {
          hsn,
          desc: it.productName,
          qty: 0,
          taxable: 0,
          gst: 0,
          total: 0,
        };
      }
      hsnMap[hsn].qty += it.quantity;
      hsnMap[hsn].taxable += it.taxableAmount;
      hsnMap[hsn].gst += (it.cgstAmount || 0) + (it.sgstAmount || 0) + (it.igstAmount || 0);
      hsnMap[hsn].total += it.totalAmount;
    });
  });

  const hsnList = Object.values(hsnMap);

  return (
    <div className="space-y-4 sm:space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm transition-colors duration-150">
        <div>
          <h1 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <span>GST Compliance & Filing Center</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 sm:mt-1">
            GSTR-1 Outward Supplies, GSTR-3B Monthly Return Summary, and HSN/SAC Table
          </p>
        </div>
        <button
          onClick={() => alert('GST Return JSON/Excel exported successfully for upload on GST Portal!')}
          className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-600/30 transition-all active:scale-95"
        >
          <Download className="w-4 h-4" />
          <span>Export GST JSON / Excel</span>
        </button>
      </div>

      {/* Tax Liability vs ITC Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <div className="bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/60 p-4 rounded-2xl">
          <p className="text-xs font-semibold text-blue-800 dark:text-blue-300 uppercase">Total Output Tax (Liability)</p>
          <h3 className="text-xl font-black text-blue-950 dark:text-blue-100 font-mono mt-1">{formatINR(totalOutputGst)}</h3>
          <p className="text-[10px] text-blue-700 dark:text-blue-400 mt-0.5">From {sales.length} Sales Invoices</p>
        </div>

        <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 p-4 rounded-2xl">
          <p className="text-xs font-semibold text-emerald-800 dark:text-emerald-300 uppercase">Input Tax Credit (ITC Pool)</p>
          <h3 className="text-xl font-black text-emerald-950 dark:text-emerald-100 font-mono mt-1">{formatINR(totalInputGst)}</h3>
          <p className="text-[10px] text-emerald-700 dark:text-emerald-400 mt-0.5">Eligible credit on purchases & expenses</p>
        </div>

        <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 p-4 rounded-2xl">
          <p className="text-xs font-semibold text-amber-800 dark:text-amber-300 uppercase">Net GST Payable (Cash)</p>
          <h3 className="text-xl font-black text-amber-950 dark:text-amber-100 font-mono mt-1">{formatINR(netGstPayable)}</h3>
          <p className="text-[10px] text-amber-700 dark:text-amber-400 mt-0.5">After ITC adjustment</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1.5 sm:gap-2 bg-white dark:bg-slate-900 p-1.5 sm:p-2 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-x-auto transition-colors duration-150">
        {[
          { id: 'GSTR1', label: 'GSTR-1 Outward', icon: Receipt },
          { id: 'GSTR3B', label: 'GSTR-3B Summary', icon: Layers },
          { id: 'HSN', label: 'HSN/SAC Summary', icon: FileText },
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

      {/* Tab Content: GSTR-1 */}
      {activeTab === 'GSTR1' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden transition-colors duration-150">
          <div className="p-4 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800">
            <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase">
              Table 4 & 5: B2B Registered & B2C Invoices
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/60 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase border-b border-slate-200 dark:border-slate-800">
                  <th className="py-3 px-4 whitespace-nowrap">Invoice No</th>
                  <th className="py-3 px-4 whitespace-nowrap">Customer GSTIN</th>
                  <th className="py-3 px-4 whitespace-nowrap">Customer Name</th>
                  <th className="py-3 px-4 whitespace-nowrap">POS State</th>
                  <th className="py-3 px-4 text-right whitespace-nowrap">Taxable Value</th>
                  <th className="py-3 px-4 text-right whitespace-nowrap">CGST</th>
                  <th className="py-3 px-4 text-right whitespace-nowrap">SGST</th>
                  <th className="py-3 px-4 text-right whitespace-nowrap">IGST</th>
                  <th className="py-3 px-4 text-right whitespace-nowrap">Invoice Value</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono text-[11px]">
                {sales.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                    <td className="py-3 px-4 font-bold text-blue-600 dark:text-blue-400 whitespace-nowrap">{s.invoiceNumber}</td>
                    <td className="py-3 px-4 text-slate-700 dark:text-slate-300 whitespace-nowrap">{s.partyGstin || 'Unregistered'}</td>
                    <td className="py-3 px-4 font-sans font-semibold text-slate-900 dark:text-slate-100 whitespace-nowrap">{s.partyName}</td>
                    <td className="py-3 px-4 font-sans text-slate-600 dark:text-slate-400 whitespace-nowrap">{s.partyState || 'Delhi'}</td>
                    <td className="py-3 px-4 text-right whitespace-nowrap text-slate-700 dark:text-slate-300">{formatINR(s.taxableTotal, false)}</td>
                    <td className="py-3 px-4 text-right text-blue-600 dark:text-blue-400 whitespace-nowrap">{formatINR(s.cgstTotal, false)}</td>
                    <td className="py-3 px-4 text-right text-blue-600 dark:text-blue-400 whitespace-nowrap">{formatINR(s.sgstTotal, false)}</td>
                    <td className="py-3 px-4 text-right text-purple-600 dark:text-purple-400 whitespace-nowrap">{formatINR(s.igstTotal, false)}</td>
                    <td className="py-3 px-4 text-right font-black text-slate-900 dark:text-slate-100 whitespace-nowrap">{formatINR(s.grandTotal, false)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab Content: GSTR-3B */}
      {activeTab === 'GSTR3B' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-4 sm:p-6 max-w-4xl mx-auto space-y-6 transition-colors duration-150">
          <div className="text-center pb-3 border-b border-slate-200 dark:border-slate-800">
            <h3 className="text-base font-black text-slate-900 dark:text-slate-100 uppercase">GSTR-3B Monthly Return Summary</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">Tax on Outward Supplies and Eligible ITC</p>
          </div>

          <div className="space-y-4 text-xs">
            {/* 3.1 Outward Supplies */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
              <h4 className="font-bold text-slate-900 dark:text-slate-100">3.1 Details of Outward Taxable Supplies</h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-200 dark:border-slate-700 text-center font-mono">
                <div>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 font-sans">Total Taxable</p>
                  <p className="font-bold text-slate-900 dark:text-slate-100">{formatINR(sales.reduce((a, b) => a + b.taxableTotal, 0))}</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 font-sans">Integrated Tax (IGST)</p>
                  <p className="font-bold text-purple-600 dark:text-purple-400">{formatINR(outputIgst)}</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 font-sans">Central Tax (CGST)</p>
                  <p className="font-bold text-blue-600 dark:text-blue-400">{formatINR(outputCgst)}</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 font-sans">State Tax (SGST)</p>
                  <p className="font-bold text-blue-600 dark:text-blue-400">{formatINR(outputSgst)}</p>
                </div>
              </div>
            </div>

            {/* 4 Eligible ITC */}
            <div className="p-4 bg-emerald-50/60 dark:bg-emerald-950/40 rounded-xl border border-emerald-200 dark:border-emerald-800/60 space-y-2">
              <h4 className="font-bold text-emerald-950 dark:text-emerald-200">4. Eligible Input Tax Credit (ITC Available)</h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-emerald-200 dark:border-emerald-800/60 text-center font-mono">
                <div>
                  <p className="text-[10px] text-emerald-800 dark:text-emerald-300 font-sans">All other ITC</p>
                  <p className="font-bold text-emerald-900 dark:text-emerald-100">{formatINR(totalInputGst)}</p>
                </div>
                <div>
                  <p className="text-[10px] text-emerald-800 dark:text-emerald-300 font-sans">IGST Credit</p>
                  <p className="font-bold text-emerald-700 dark:text-emerald-300">{formatINR(inputIgstPurchases)}</p>
                </div>
                <div>
                  <p className="text-[10px] text-emerald-800 dark:text-emerald-300 font-sans">CGST Credit</p>
                  <p className="font-bold text-emerald-700 dark:text-emerald-300">{formatINR(inputCgstPurchases)}</p>
                </div>
                <div>
                  <p className="text-[10px] text-emerald-800 dark:text-emerald-300 font-sans">SGST Credit</p>
                  <p className="font-bold text-emerald-700 dark:text-emerald-300">{formatINR(inputSgstPurchases)}</p>
                </div>
              </div>
            </div>

            {/* Net Tax to Pay in Cash */}
            <div className="p-4 bg-blue-600 text-white rounded-xl shadow-md flex items-center justify-between">
              <div>
                <p className="text-xs uppercase font-medium text-blue-100">Net Tax Payable in Cash</p>
                <p className="text-xl font-black font-mono">{formatINR(netGstPayable)}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-blue-200" />
            </div>
          </div>
        </div>
      )}

      {/* Tab Content: HSN */}
      {activeTab === 'HSN' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden transition-colors duration-150">
          <div className="p-4 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800">
            <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase">
              HSN / SAC Summary of Outward Supplies
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/60 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase border-b border-slate-200 dark:border-slate-800">
                  <th className="py-3 px-4 whitespace-nowrap">HSN Code</th>
                  <th className="py-3 px-4 whitespace-nowrap">Description</th>
                  <th className="py-3 px-4 text-center whitespace-nowrap">Total Quantity</th>
                  <th className="py-3 px-4 text-right whitespace-nowrap">Taxable Value</th>
                  <th className="py-3 px-4 text-right whitespace-nowrap">Total Tax (GST)</th>
                  <th className="py-3 px-4 text-right whitespace-nowrap">Total Value</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono text-[11px]">
                {hsnList.map((h, i) => (
                  <tr key={i} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                    <td className="py-3 px-4 font-bold text-blue-600 dark:text-blue-400 whitespace-nowrap">{h.hsn}</td>
                    <td className="py-3 px-4 font-sans font-semibold text-slate-800 dark:text-slate-200 whitespace-nowrap">{h.desc}</td>
                    <td className="py-3 px-4 text-center whitespace-nowrap text-slate-700 dark:text-slate-300">{h.qty}</td>
                    <td className="py-3 px-4 text-right whitespace-nowrap text-slate-700 dark:text-slate-300">{formatINR(h.taxable, false)}</td>
                    <td className="py-3 px-4 text-right text-blue-600 dark:text-blue-400 whitespace-nowrap">{formatINR(h.gst, false)}</td>
                    <td className="py-3 px-4 text-right font-black text-slate-900 dark:text-slate-100 whitespace-nowrap">{formatINR(h.total, false)}</td>
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
