'use client';

import React from 'react';
import { formatINR, numberToWordsINR } from '@/lib/currency';

interface PurchaseBillA4Props {
  business: {
    name: string;
    legalName?: string | null;
    gstin?: string | null;
    pan?: string | null;
    address?: string | null;
    state: string;
    stateCode: string;
    phone?: string | null;
    email?: string | null;
    bankName?: string | null;
    bankAccountNo?: string | null;
    bankIfsc?: string | null;
    bankBranch?: string | null;
  };
  purchase: {
    billNumber: string;
    billDate: Date | string;
    dueDate?: Date | string | null;
    partyName: string;
    partyGstin?: string | null;
    partyPhone?: string | null;
    partyAddress?: string | null;
    partyState?: string | null;
    isInterState: boolean;
    subTotal: number;
    discountTotal: number;
    taxableTotal: number;
    cgstTotal: number;
    sgstTotal: number;
    igstTotal: number;
    taxTotal: number;
    roundOff: number;
    grandTotal: number;
    paidAmount: number;
    balanceAmount: number;
    paymentMode: string;
    paymentStatus?: string;
    notes?: string | null;
    items: Array<{
      id?: string;
      productName: string;
      hsnCode?: string | null;
      quantity: number;
      unit: string;
      unitPrice: number;
      discountAmount?: number;
      taxableAmount: number;
      gstRate: number;
      cgstAmount: number;
      sgstAmount: number;
      igstAmount: number;
      totalAmount: number;
    }>;
  };
}

export function PurchaseBillA4Template({ business, purchase }: PurchaseBillA4Props) {
  const companyDisplayName =
    business.name && business.name !== 'Rahul Traders' && business.name !== 'Rahul Trader'
      ? business.name
      : 'RAHUL JEE TRADING COMPANY';

  return (
    <div id="print-section" className="w-full max-w-[794px] mx-auto bg-white text-slate-900 p-8 shadow-sm border border-slate-200 print:border-0 print:shadow-none print:p-6 print:max-w-none text-xs font-sans selection:bg-indigo-500 selection:text-white">
      {/* Header Banner */}
      <div className="flex justify-between items-start gap-6 border-b-2 border-slate-800 pb-4">
        <div className="flex-1 min-w-0 pr-4">
          <div className="mb-2">
            <span className="inline-flex items-center px-2.5 py-1 rounded text-[10px] font-extrabold uppercase tracking-wider bg-indigo-100 text-indigo-800 border border-indigo-200 leading-none">
              PURCHASE INWARD VOUCHER / BILL
            </span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight leading-tight">{companyDisplayName}</h1>
          {business.legalName && business.legalName !== business.name && (
            <p className="text-[11px] font-semibold text-slate-600 mt-0.5">({business.legalName})</p>
          )}
          <p className="text-[11px] text-slate-600 mt-1 max-w-sm whitespace-pre-line leading-relaxed">
            {business.address || 'Allahabad Bank Road, Yusufpur, Mohammadabad, Dist- Ghazipur (U.P.) - 233227'}
          </p>
          {business.gstin && (
            <p className="text-[11px] font-medium text-slate-700 mt-1.5">
              <strong className="font-bold text-slate-900">GSTIN:</strong>{' '}
              <span className="font-mono font-bold text-slate-900">{business.gstin}</span>
            </p>
          )}
        </div>

        {/* Bill Metadata */}
        <div className="bg-slate-50/90 p-3.5 rounded-xl border border-slate-200 w-[260px] shrink-0 self-start shadow-sm">
          <div className="divide-y divide-slate-200/80 text-xs">
            <div className="flex items-center justify-between gap-3 pb-2">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Bill Number</span>
              <span className="font-mono font-extrabold text-sm text-indigo-700 tracking-tight">{purchase.billNumber}</span>
            </div>
            <div className="flex items-center justify-between gap-3 py-2">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Inward Bill Date</span>
              <span className="font-semibold text-slate-800 tabular-nums">
                {new Date(purchase.billDate).toLocaleDateString('en-IN', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric',
                })}
              </span>
            </div>
            <div className="flex items-center justify-between gap-3 py-2">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Payment Mode</span>
              <span className="inline-flex items-center justify-center font-mono font-bold text-[10px] px-2.5 py-0.5 rounded-md bg-slate-200 text-slate-800 uppercase leading-none">
                {purchase.paymentMode || 'BANK'}
              </span>
            </div>
            <div className="flex items-center justify-between gap-3 pt-2">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Bill Status</span>
              <span
                className={`inline-flex items-center justify-center font-bold text-[10px] px-2.5 py-0.5 rounded-md border leading-none tracking-wide ${
                  purchase.paymentStatus === 'PAID'
                    ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                    : purchase.paymentStatus === 'PARTIAL'
                    ? 'bg-amber-100 text-amber-800 border-amber-300'
                    : 'bg-rose-100 text-rose-800 border-rose-300'
                }`}
              >
                {purchase.paymentStatus || (purchase.balanceAmount === 0 ? 'PAID' : 'UNPAID')}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Supplier & Consignee Row */}
      <div className="grid grid-cols-2 gap-4 py-3 border-b border-slate-200">
        {/* Supplier / Vendor Details */}
        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
          <p className="text-[10px] font-bold text-indigo-700 uppercase tracking-wider">
            Vendor / Supplier (Billed By):
          </p>
          <p className="font-extrabold text-sm text-slate-900">{purchase.partyName || 'Supplier'}</p>
          {purchase.partyAddress && (
            <p className="text-slate-600 text-[11px] leading-relaxed">{purchase.partyAddress}</p>
          )}
          <div className="pt-1 space-y-0.5 text-[11px]">
            {purchase.partyGstin ? (
              <p className="text-slate-700">
                <span className="font-semibold">GSTIN:</span>{' '}
                <span className="font-mono font-bold text-slate-900">{purchase.partyGstin}</span>
              </p>
            ) : (
              <p className="text-slate-500 italic">Unregistered / Regular Supplier</p>
            )}
            {purchase.partyState && (
              <p className="text-slate-700">
                <span className="font-semibold">State:</span> {purchase.partyState}
              </p>
            )}
            {purchase.partyPhone && (
              <p className="text-slate-700">
                <span className="font-semibold">Phone:</span> {purchase.partyPhone}
              </p>
            )}
          </div>
        </div>

        {/* Consignee / Recipient Warehouse Details */}
        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
            Billed To / Received At (Warehouse):
          </p>
          <p className="font-extrabold text-sm text-slate-900">{companyDisplayName}</p>
          <p className="text-slate-600 text-[11px] leading-relaxed">
            {business.address || 'Allahabad Bank Road, Yusufpur, Mohammadabad, Dist- Ghazipur (U.P.) - 233227'}
          </p>
          <div className="pt-1 space-y-0.5 text-[11px]">
            <p className="text-slate-700">
              <span className="font-semibold">GSTIN:</span>{' '}
              <span className="font-mono font-bold text-slate-900">{business.gstin || '09DMCPG4193P1ZG'}</span>
            </p>
            <p className="text-slate-700">
              <span className="font-semibold">State:</span> {business.state} ({business.stateCode})
            </p>
            {business.phone && (
              <p className="text-slate-700">
                <span className="font-semibold">Contact:</span> {business.phone}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Inward Items Table */}
      <div className="pt-3 pb-4">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-100 text-[10px] font-bold text-slate-700 uppercase border-y border-slate-300">
              <th className="py-2 px-2 text-center w-8">#</th>
              <th className="py-2 px-3">Item Description</th>
              <th className="py-2 px-2 text-center">HSN</th>
              <th className="py-2 px-2 text-center">Qty</th>
              <th className="py-2 px-2 text-right">Cost Rate</th>
              <th className="py-2 px-2 text-right">Taxable</th>
              <th className="py-2 px-2 text-center">GST %</th>
              <th className="py-2 px-2 text-right">Tax Amt</th>
              <th className="py-2 px-2 text-right">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 text-[11px]">
            {(purchase.items || []).map((item, index) => {
              const taxAmt = (item.cgstAmount || 0) + (item.sgstAmount || 0) + (item.igstAmount || 0);
              return (
                <tr key={index} className="hover:bg-slate-50/80">
                  <td className="py-2 px-2 text-center text-slate-500 tabular-nums">{index + 1}</td>
                  <td className="py-2 px-3 font-semibold text-slate-900">{item.productName}</td>
                  <td className="py-2 px-2 text-center text-slate-600 font-mono tabular-nums">{item.hsnCode || '-'}</td>
                  <td className="py-2 px-2 text-center font-bold tabular-nums">
                    {item.quantity} {item.unit || 'PCS'}
                  </td>
                  <td className="py-2 px-2 text-right tabular-nums">{formatINR(item.unitPrice, false)}</td>
                  <td className="py-2 px-2 text-right font-medium tabular-nums">
                    {formatINR(item.taxableAmount, false)}
                  </td>
                  <td className="py-2 px-2 text-center font-bold text-indigo-700 tabular-nums">{item.gstRate}%</td>
                  <td className="py-2 px-2 text-right text-slate-600 tabular-nums">
                    {formatINR(taxAmt, false)}
                  </td>
                  <td className="py-2 px-2 text-right font-bold text-slate-900 tabular-nums">
                    {formatINR(item.totalAmount, false)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Tax & Total Calculation Summary */}
      <div className="grid grid-cols-2 gap-6 pt-3 border-t-2 border-slate-300">
        {/* Left Column: Amount in Words & Inward Verification */}
        <div className="space-y-4">
          <div>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Amount in Words:</p>
            <p className="text-xs font-extrabold text-indigo-950 italic mt-0.5">
              {numberToWordsINR(purchase.grandTotal)}
            </p>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-[11px] space-y-1.5">
            <p className="font-bold text-slate-800 uppercase text-[10px]">Goods Inward Verification Note</p>
            <p className="text-slate-600 leading-relaxed text-[10.5px]">
              ✔ Certified that the items mentioned above have been physically inspected, counted, and taken into warehouse inventory stock.
            </p>
            {purchase.notes && (
              <p className="text-slate-700 pt-1 border-t border-slate-200">
                <span className="font-semibold">Notes:</span> {purchase.notes}
              </p>
            )}
          </div>
        </div>

        {/* Right Column: Calculations */}
        <div className="space-y-1.5 text-xs bg-slate-50 p-4 rounded-xl border border-slate-200">
          <div className="flex justify-between py-1 border-b border-slate-200">
            <span className="text-slate-600 font-medium">Taxable Subtotal:</span>
            <span className="font-semibold tabular-nums">{formatINR(purchase.taxableTotal)}</span>
          </div>

          {!purchase.isInterState ? (
            <>
              <div className="flex justify-between py-1 border-b border-slate-200">
                <span className="text-slate-600">Input Central GST (CGST):</span>
                <span className="font-semibold tabular-nums">{formatINR(purchase.cgstTotal)}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200">
                <span className="text-slate-600">Input State GST (SGST):</span>
                <span className="font-semibold tabular-nums">{formatINR(purchase.sgstTotal)}</span>
              </div>
            </>
          ) : (
            <div className="flex justify-between py-1 border-b border-slate-200">
              <span className="text-slate-600">Input Integrated GST (IGST):</span>
              <span className="font-semibold tabular-nums">{formatINR(purchase.igstTotal)}</span>
            </div>
          )}

          {purchase.roundOff !== 0 && (
            <div className="flex justify-between py-1 border-b border-slate-200 text-slate-500">
              <span>Round Off:</span>
              <span className="tabular-nums">
                {purchase.roundOff > 0 ? `+${purchase.roundOff}` : purchase.roundOff}
              </span>
            </div>
          )}

          <div className="flex justify-between py-2 border-b-2 border-slate-400 text-sm font-black text-slate-900">
            <span>Bill Total:</span>
            <span className="text-indigo-900 font-bold text-base tabular-nums">
              {formatINR(purchase.grandTotal)}
            </span>
          </div>

          <div className="flex justify-between py-1 text-xs font-semibold text-emerald-700">
            <span>Paid Amount:</span>
            <span className="tabular-nums">{formatINR(purchase.paidAmount)}</span>
          </div>

          {purchase.balanceAmount > 0 && (
            <div className="flex justify-between py-1 text-xs font-bold text-rose-600">
              <span>Balance Payable:</span>
              <span className="tabular-nums">{formatINR(purchase.balanceAmount)}</span>
            </div>
          )}
        </div>
      </div>

      {/* Signatures */}
      <div className="grid grid-cols-2 gap-4 pt-8 mt-6 border-t border-slate-200 text-[10px]">
        <div className="flex flex-col justify-between items-start h-16">
          <p className="text-slate-500">Received & Verified by Store In-charge</p>
          <p className="text-[10px] text-slate-700 border-t border-slate-400 pt-1 pr-8">Receiver's Signature</p>
        </div>
        <div className="text-right flex flex-col justify-between items-end h-16">
          <p className="font-bold text-slate-800">For {companyDisplayName}</p>
          <p className="text-[10px] text-slate-700 border-t border-slate-400 pt-1 pl-8">Authorized Signatory</p>
        </div>
      </div>
    </div>
  );
}
