'use client';

import React from 'react';
import { formatINR } from '@/lib/currency';

export interface PartyLedgerPrintProps {
  business: {
    name: string;
    legalName?: string | null;
    gstin?: string | null;
    pan?: string | null;
    address?: string | null;
    state?: string | null;
    stateCode?: string | null;
    phone?: string | null;
    email?: string | null;
    bankName?: string | null;
    bankAccountNo?: string | null;
    bankIfsc?: string | null;
    bankBranch?: string | null;
    upiId?: string | null;
  };
  party: {
    name: string;
    type?: string;
    phone?: string | null;
    email?: string | null;
    gstin?: string | null;
    address?: string | null;
    state?: string | null;
    stateCode?: string | null;
    openingBalance?: number | null;
    currentBalance?: number | null;
  };
  metrics?: {
    totalInbound?: number;
    totalOutbound?: number;
    currentBalance?: number;
    openingBalance?: number;
    totalTransactions?: number;
    salesCount?: number;
    nonGstCount?: number;
    purchasesCount?: number;
    paymentsCount?: number;
  };
  transactions: Array<{
    id: string;
    date: Date | string;
    type: string;
    typeLabel: string;
    direction: 'INBOUND' | 'OUTBOUND';
    referenceNumber: string;
    title?: string;
    description: string;
    amount: number;
    paidAmount?: number;
    balanceAmount?: number;
    paymentMode?: string;
    paymentStatus?: string;
    notes?: string;
    runningBalance: number;
    items?: Array<{
      productName: string;
      quantity: number;
      unit?: string;
      unitPrice: number;
      totalAmount: number;
    }>;
  }>;
  filterNote?: string;
}

export function PartyLedgerPrintTemplate({
  business,
  party,
  metrics,
  transactions,
  filterNote,
}: PartyLedgerPrintProps) {
  const companyDisplayName =
    business.name && business.name !== 'Rahul Traders' && business.name !== 'Rahul Trader'
      ? business.name
      : 'RAHUL JEE TRADING COMPANY';

  const isSupplier = party.type === 'SUPPLIER';
  const currentBal = Number(party.currentBalance ?? metrics?.currentBalance ?? 0);
  const openBal = Number(party.openingBalance ?? metrics?.openingBalance ?? 0);

  // Totals calculation from transactions
  const totalDebit = transactions
    .filter((tx) => tx.direction === 'OUTBOUND')
    .reduce((acc, tx) => acc + (tx.amount || 0), 0);

  const totalCredit = transactions
    .filter((tx) => tx.direction === 'INBOUND')
    .reduce((acc, tx) => acc + (tx.amount || 0), 0);

  const currentDate = new Date().toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
  const currentTime = new Date().toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div
      id="print-section"
      className="w-full max-w-[794px] mx-auto bg-white text-slate-900 p-8 shadow-sm border border-slate-200 print:border-0 print:shadow-none print:p-4 print:max-w-none text-xs font-sans selection:bg-[#0e7490] selection:text-white"
    >
      {/* Top Accent Bar */}
      <div className="h-1.5 w-full bg-[#0e7490] rounded-full mb-4 print:mb-3"></div>

      {/* Header Banner */}
      <div className="flex justify-between items-start gap-4 border-b border-slate-200 pb-4">
        <div className="flex-1 min-w-0 pr-2">
          <div className="mb-1.5">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-[11px] font-extrabold uppercase tracking-wider bg-[#0e7490] text-white shadow-xs">
              <svg className="w-3 h-3 fill-current" viewBox="0 0 24 24">
                <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z" />
              </svg>
              ACCOUNT LEDGER STATEMENT / खाता विवरण
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight leading-tight">
            {companyDisplayName}
          </h1>
          {business.legalName && business.legalName !== business.name && (
            <p className="text-slate-600 font-medium text-xs mt-0.5">{business.legalName}</p>
          )}
          <p className="text-slate-600 text-[11px] mt-1 leading-relaxed max-w-lg">
            {business.address ||
              'Allahabad Bank Road, Yusufpur, Mohammadabad, Dist- Ghazipur (U.P.) - 233227'}
          </p>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-0.5 mt-1.5 text-[11px] text-slate-600">
            {business.gstin && (
              <span>
                GSTIN: <strong className="font-mono text-slate-800">{business.gstin}</strong>
              </span>
            )}
            {business.pan && (
              <span>
                PAN: <strong className="font-mono text-slate-800">{business.pan}</strong>
              </span>
            )}
            {business.phone && (
              <span>
                Phone: <strong className="font-mono text-slate-800">{business.phone}</strong>
              </span>
            )}
            {business.state && (
              <span>
                State: <strong>{business.state}</strong> ({business.stateCode || '09'})
              </span>
            )}
          </div>
        </div>

        {/* Statement Metadata Box */}
        <div className="bg-slate-50/90 p-3 rounded-xl border border-slate-200 w-[240px] shrink-0 self-start shadow-xs">
          <div className="divide-y divide-slate-200/80 text-[11px]">
            <div className="flex items-center justify-between pb-1.5">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                Statement Date
              </span>
              <span className="font-semibold text-slate-800 tabular-nums">{currentDate}</span>
            </div>
            <div className="flex items-center justify-between py-1.5">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                Generation Time
              </span>
              <span className="font-mono font-medium text-slate-700">{currentTime}</span>
            </div>
            <div className="flex items-center justify-between py-1.5">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                Total Records
              </span>
              <span className="font-mono font-bold text-[#0e7490]">
                {transactions.length} Transactions
              </span>
            </div>
            <div className="flex items-center justify-between pt-1.5">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                Account Type
              </span>
              <span className="inline-flex items-center font-bold text-[10px] px-2 py-0.5 rounded bg-slate-200 text-slate-800 uppercase">
                {party.type || 'CUSTOMER'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Party & Financial Summary Strip */}
      <div className="grid grid-cols-2 gap-3 py-3 border-b border-slate-200">
        {/* Party / Client Details */}
        <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-200 space-y-1">
          <p className="text-[10px] font-bold text-[#0e7490] uppercase tracking-wider">
            Party / Account Details:
          </p>
          <p className="font-black text-sm text-slate-900">{party.name}</p>
          {party.address && (
            <p className="text-slate-600 text-[11px] leading-relaxed">{party.address}</p>
          )}
          <div className="pt-0.5 space-y-0.5 text-[11px]">
            {party.gstin ? (
              <p className="text-slate-700">
                <span className="font-semibold">GSTIN:</span>{' '}
                <span className="font-mono font-bold text-slate-900">{party.gstin}</span>
              </p>
            ) : (
              <p className="text-slate-500 italic text-[10px]">Unregistered / Consumer</p>
            )}
            <p className="text-slate-700">
              <span className="font-semibold">State:</span> {party.state || 'Delhi'}{' '}
              <span className="font-mono font-semibold">({party.stateCode || '07'})</span>
            </p>
            {party.phone && (
              <p className="text-slate-700">
                <span className="font-semibold">Phone:</span>{' '}
                <span className="font-mono font-semibold">{party.phone}</span>
              </p>
            )}
          </div>
        </div>

        {/* Current Account Summary Box */}
        <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-200 flex flex-col justify-between">
          <div>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">
              Financial Status Summary
            </p>
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div>
                <span className="text-slate-500 block text-[10px]">Opening Balance:</span>
                <span className="font-mono font-bold text-slate-800">{formatINR(openBal)}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px]">Total Outbound (Debited):</span>
                <span className="font-mono font-bold text-rose-700">{formatINR(totalDebit)}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px]">Total Inbound (Credited):</span>
                <span className="font-mono font-bold text-emerald-700">
                  {formatINR(totalCredit)}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px]">Status:</span>
                <span className="font-bold text-[10px] text-slate-700">
                  {currentBal > 0
                    ? isSupplier
                      ? 'Advance Paid'
                      : 'Receivable'
                    : currentBal < 0
                    ? isSupplier
                      ? 'Payable to Vendor'
                      : 'Advance Received'
                    : 'Account Settled'}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-2 pt-2 border-t border-slate-200 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-900 uppercase">Closing Balance:</span>
            <span
              className={`font-mono text-base font-black ${
                currentBal > 0
                  ? 'text-emerald-700'
                  : currentBal < 0
                  ? 'text-rose-700'
                  : 'text-slate-700'
              }`}
            >
              {currentBal > 0 ? '+' : currentBal < 0 ? '-' : ''}
              {formatINR(Math.abs(currentBal))}
              <span className="text-[10px] ml-1 font-sans font-bold">
                {currentBal > 0 ? '(Dr)' : currentBal < 0 ? '(Cr)' : ''}
              </span>
            </span>
          </div>
        </div>
      </div>

      {filterNote && (
        <div className="my-2 px-3 py-1 bg-amber-50 border border-amber-200 rounded-lg text-[10px] text-amber-800 font-semibold">
          Filtered View: {filterNote}
        </div>
      )}

      {/* Transaction Ledger Table */}
      <div className="mt-3 overflow-hidden rounded-xl border border-slate-300">
        <table className="w-full text-left border-collapse text-[11px]">
          <thead>
            <tr className="bg-slate-100 text-slate-700 uppercase font-black tracking-wider text-[10px] border-b border-slate-300">
              <th className="py-2 px-2.5 w-8 text-center">#</th>
              <th className="py-2 px-2.5 whitespace-nowrap">Date</th>
              <th className="py-2 px-2.5 whitespace-nowrap">Type & Voucher #</th>
              <th className="py-2 px-3">Particulars / Details</th>
              <th className="py-2 px-2.5 text-right whitespace-nowrap">Debit / Out (₹)</th>
              <th className="py-2 px-2.5 text-right whitespace-nowrap">Credit / In (₹)</th>
              <th className="py-2 px-2.5 text-right whitespace-nowrap">Balance (₹)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {transactions.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-8 text-center text-slate-500 font-medium">
                  No transaction records found for this party.
                </td>
              </tr>
            ) : (
              transactions.map((tx, idx) => {
                const isOut = tx.direction === 'OUTBOUND';
                const isIn = tx.direction === 'INBOUND';
                const txDate = new Date(tx.date).toLocaleDateString('en-IN', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric',
                });

                return (
                  <tr
                    key={tx.id || idx}
                    className="hover:bg-slate-50/80 transition-colors"
                    style={{ pageBreakInside: 'avoid', breakInside: 'avoid' }}
                  >
                    {/* Index */}
                    <td className="py-2 px-2.5 text-center text-slate-500 font-mono text-[10px]">
                      {idx + 1}
                    </td>

                    {/* Date */}
                    <td className="py-2 px-2.5 whitespace-nowrap">
                      <p className="font-bold text-slate-900">{txDate}</p>
                      <p className="text-[9px] text-slate-500 font-mono">
                        {new Date(tx.date).toLocaleTimeString('en-IN', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </td>

                    {/* Voucher Type & Ref */}
                    <td className="py-2 px-2.5 whitespace-nowrap">
                      <span className="font-bold text-slate-800 block text-[10px]">
                        {tx.typeLabel || tx.type}
                      </span>
                      <span className="font-mono font-black text-[#0e7490] text-[10px]">
                        #{tx.referenceNumber}
                      </span>
                      {tx.paymentMode && (
                        <span className="block text-[9px] text-slate-500 uppercase font-mono">
                          {tx.paymentMode}
                        </span>
                      )}
                    </td>

                    {/* Particulars & Details */}
                    <td className="py-2 px-3">
                      <p className="font-medium text-slate-900 leading-tight">{tx.description}</p>
                      {tx.notes && (
                        <p className="text-[10px] text-slate-500 italic mt-0.5">Note: {tx.notes}</p>
                      )}
                      {Array.isArray(tx.items) && tx.items.length > 0 && (
                        <div className="mt-1 pl-2 border-l-2 border-slate-200 text-[10px] text-slate-600 font-mono space-y-0.5">
                          {tx.items.slice(0, 4).map((it, itIdx) => (
                            <div key={itIdx} className="flex justify-between">
                              <span>
                                • {it.productName} ({it.quantity} {it.unit || 'PCS'})
                              </span>
                              <span className="ml-2 font-semibold">
                                {formatINR(it.totalAmount)}
                              </span>
                            </div>
                          ))}
                          {tx.items.length > 4 && (
                            <p className="text-[9px] text-slate-500 italic">
                              + {tx.items.length - 4} more item(s)...
                            </p>
                          )}
                        </div>
                      )}
                    </td>

                    {/* Debit / Outbound */}
                    <td className="py-2 px-2.5 text-right font-mono tabular-nums whitespace-nowrap font-bold text-slate-900">
                      {isOut ? formatINR(tx.amount) : '—'}
                    </td>

                    {/* Credit / Inbound */}
                    <td className="py-2 px-2.5 text-right font-mono tabular-nums whitespace-nowrap font-bold text-slate-900">
                      {isIn ? formatINR(tx.amount) : '—'}
                    </td>

                    {/* Running Balance */}
                    <td className="py-2 px-2.5 text-right font-mono tabular-nums whitespace-nowrap font-black">
                      <span
                        className={
                          tx.runningBalance > 0
                            ? 'text-emerald-700'
                            : tx.runningBalance < 0
                            ? 'text-rose-700'
                            : 'text-slate-600'
                        }
                      >
                        {formatINR(Math.abs(tx.runningBalance))}
                        <span className="text-[9px] ml-0.5 font-sans font-bold">
                          {tx.runningBalance > 0 ? 'Dr' : tx.runningBalance < 0 ? 'Cr' : ''}
                        </span>
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>

          {/* Table Totals Row */}
          <tfoot>
            <tr className="bg-slate-100 font-black text-slate-900 border-t-2 border-slate-300">
              <td colSpan={4} className="py-2 px-3 text-right uppercase tracking-wider text-[10px]">
                Total Debit & Credit Summary:
              </td>
              <td className="py-2 px-2.5 text-right font-mono font-black text-rose-700 whitespace-nowrap">
                {formatINR(totalDebit)}
              </td>
              <td className="py-2 px-2.5 text-right font-mono font-black text-emerald-700 whitespace-nowrap">
                {formatINR(totalCredit)}
              </td>
              <td className="py-2 px-2.5 text-right font-mono font-black whitespace-nowrap text-[#0e7490]">
                {formatINR(Math.abs(currentBal))} {currentBal > 0 ? 'Dr' : currentBal < 0 ? 'Cr' : ''}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Settlement & Banking Information */}
      <div className="grid grid-cols-2 gap-4 mt-4 pt-3 border-t border-slate-200">
        <div className="p-3 bg-slate-50/70 rounded-xl border border-slate-200 text-[11px] space-y-1">
          <p className="text-[10px] font-bold text-[#0e7490] uppercase tracking-wider">
            Bank & Payment Settlement Details:
          </p>
          <div className="space-y-0.5 text-slate-700">
            <p>
              Bank Name:{' '}
              <strong className="text-slate-900">{business.bankName || 'HDFC Bank Ltd'}</strong>
            </p>
            <p>
              A/C No:{' '}
              <strong className="font-mono text-slate-900">
                {business.bankAccountNo || '50200088991122'}
              </strong>
            </p>
            <p>
              IFSC Code:{' '}
              <strong className="font-mono text-slate-900">
                {business.bankIfsc || 'HDFC0001234'}
              </strong>
            </p>
            {business.upiId && (
              <p>
                UPI ID:{' '}
                <strong className="font-mono text-[#0e7490]">{business.upiId}</strong>
              </p>
            )}
          </div>
        </div>

        {/* Disclaimer & Authorized Signatory */}
        <div className="flex flex-col justify-between p-3 bg-slate-50/70 rounded-xl border border-slate-200 text-[10px]">
          <div>
            <p className="font-bold text-slate-700 uppercase tracking-wider">Verification Note</p>
            <p className="text-slate-600 mt-0.5 leading-relaxed">
              Please inspect the recorded invoices and payments. Kindly report any discrepancies
              within 7 days of statement generation.
            </p>
          </div>

          <div className="mt-4 pt-2 border-t border-slate-200 flex justify-between items-end">
            <div>
              <p className="font-bold text-slate-800 text-[11px]">{companyDisplayName}</p>
              <p className="text-slate-500 text-[9px]">Computer Generated Statement</p>
            </div>
            <div className="text-right">
              <div className="h-7"></div>
              <p className="text-[10px] font-bold text-slate-800 border-t border-slate-400 pt-0.5 px-2">
                Authorized Signatory
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
