'use client';

import React from 'react';
import { formatINR, numberToWordsINR } from '@/lib/currency';

export interface NonGstInvoiceTemplateProps {
  business: {
    name: string;
    legalName?: string | null;
    address?: string | null;
    state?: string | null;
    stateCode?: string | null;
    phone?: string | null;
    email?: string | null;
    pan?: string | null;
    logo?: string | null;
    bankName?: string | null;
    bankAccountNo?: string | null;
    bankIfsc?: string | null;
    bankBranch?: string | null;
    upiId?: string | null;
    termsAndConditions?: string | null;
  };
  invoice: {
    fromName?: string | null;
    fromPhone?: string | null;
    fromAddress?: string | null;
    invoiceNumber: string;
    invoiceDate: Date | string;
    dueDate?: Date | string | null;
    partyName: string;
    partyPhone?: string | null;
    partyAddress?: string | null;
    billingAddress?: string | null;
    partyState?: string | null;
    subTotal: number;
    discountTotal: number;
    extraCharges?: number;
    extraChargeName?: string | null;
    roundOff?: number;
    grandTotal: number;
    paidAmount: number;
    balanceAmount: number;
    paymentMode?: string;
    paymentStatus?: string;
    notes?: string | null;
    terms?: string | null;
    items: Array<{
      id?: string;
      productName: string;
      description?: string | null;
      hsnCode?: string | null;
      quantity: number;
      unit?: string;
      unitPrice: number;
      discountPercent?: number;
      discountAmount?: number;
      totalAmount: number;
    }>;
  };
}

export function NonGstInvoiceTemplate({ business, invoice }: NonGstInvoiceTemplateProps) {
  const paymentStatus =
    invoice.paymentStatus ||
    (invoice.balanceAmount <= 0
      ? 'PAID'
      : invoice.paidAmount > 0
      ? 'PARTIAL'
      : 'UNPAID');

  const hasCustomSeller = Boolean(
    invoice.fromName &&
      invoice.fromName.trim() !== '' &&
      invoice.fromName !== 'Rahul Traders' &&
      invoice.fromName !== 'Rahul Trader'
  );

  return (
    <div
      id="print-section"
      className="w-full max-w-[794px] mx-auto bg-white text-slate-900 p-8 shadow-sm border border-slate-200 print:border-0 print:shadow-none print:p-6 print:max-w-none text-xs font-sans selection:bg-[#2563EB] selection:text-white"
    >
      {/* Top Professional Accent Bar */}
      <div className="h-1.5 w-full bg-[#2563EB] rounded-full mb-5 print:mb-4"></div>

      {/* Header Banner */}
      <div className="flex justify-between items-start border-b border-slate-200 pb-5">
        <div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-[11px] font-extrabold uppercase tracking-wider bg-[#2563EB] text-white shadow-xs mb-2.5">
            <svg className="w-3 h-3 fill-current" viewBox="0 0 24 24">
              <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z" />
            </svg>
            INVOICE / BILL OF SUPPLY
          </span>
          {hasCustomSeller && (
            <>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight leading-tight">
                {invoice.fromName}
              </h1>
              {invoice.fromAddress && (
                <p className="text-[11px] text-slate-600 mt-1 max-w-sm whitespace-pre-line leading-relaxed">
                  {invoice.fromAddress}
                </p>
              )}
              {invoice.fromPhone && (
                <p className="text-[11px] text-slate-700 font-medium mt-1">
                  Mobile: <span className="font-bold text-slate-900">{invoice.fromPhone}</span>
                </p>
              )}
            </>
          )}
        </div>

        {/* Invoice Metadata Box */}
        <div className="text-right space-y-2 bg-gradient-to-br from-blue-50/60 to-slate-50 p-4 rounded-xl border border-blue-100 shadow-xs min-w-[220px]">
          <div className="border-b border-blue-100 pb-1.5">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Invoice Number</p>
            <p className="font-mono font-black text-base text-[#2563EB] tracking-tight">{invoice.invoiceNumber}</p>
          </div>
          <div className="border-b border-blue-100/60 pb-1.5 flex justify-between items-center gap-2">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Invoice Date</span>
            <span className="font-bold text-slate-800 tabular-nums text-[11px]">
              {new Date(invoice.invoiceDate).toLocaleDateString('en-IN', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
              })}
            </span>
          </div>
          <div className="border-b border-blue-100/60 pb-1.5 flex justify-between items-center gap-2">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Payment Mode</span>
            <span className="inline-block font-mono font-bold text-[10.5px] px-2 py-0.5 rounded bg-blue-100/80 text-blue-800 border border-blue-200 uppercase">
              {invoice.paymentMode || 'UNPAID'}
            </span>
          </div>
          <div className="flex justify-between items-center gap-2 pt-0.5">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Invoice Status</span>
            <span
              className={`inline-block font-black text-[10px] px-2.5 py-0.5 rounded border uppercase tracking-wide ${
                paymentStatus === 'PAID'
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                  : paymentStatus === 'PARTIAL'
                  ? 'bg-amber-50 text-amber-700 border-amber-300'
                  : 'bg-rose-50 text-rose-700 border-rose-300'
              }`}
            >
              {paymentStatus}
            </span>
          </div>
        </div>
      </div>

      {/* Customer & Consignor/Seller Row */}
      <div className={`grid ${hasCustomSeller ? 'grid-cols-2' : 'grid-cols-1'} gap-4 py-4 border-b border-slate-200`}>
        {/* Customer / Buyer Details */}
        <div className="p-3.5 bg-slate-50/80 rounded-xl border border-slate-200 space-y-1">
          <div className="flex items-center gap-1.5 mb-1">
            <div className="w-1.5 h-1.5 rounded-full bg-[#2563EB]"></div>
            <p className="text-[10px] font-extrabold text-[#2563EB] uppercase tracking-wider">
              Customer / Buyer (Billed To):
            </p>
          </div>
          <p className="font-black text-sm text-slate-900">{invoice.partyName || 'Cash Customer'}</p>
          {(invoice.partyAddress || invoice.billingAddress) && (
            <p className="text-slate-600 text-[11px] leading-relaxed">
              {invoice.partyAddress || invoice.billingAddress}
            </p>
          )}
          <div className="pt-1 space-y-0.5 text-[11px]">
            {invoice.partyPhone && (
              <p className="text-slate-700">
                <span className="font-semibold text-slate-500">Phone:</span>{' '}
                <span className="font-bold text-slate-800">{invoice.partyPhone}</span>
              </p>
            )}
            <p className="text-slate-500 italic text-[10px]">Non-GST Regular Customer</p>
          </div>
        </div>

        {/* Consignor / Seller Details (Only shown if custom filled) */}
        {hasCustomSeller && (
          <div className="p-3.5 bg-slate-50/80 rounded-xl border border-slate-200 space-y-1">
            <div className="flex items-center gap-1.5 mb-1">
              <div className="w-1.5 h-1.5 rounded-full bg-[#2563EB]"></div>
              <p className="text-[10px] font-extrabold text-[#2563EB] uppercase tracking-wider">
                Billed By / Supplier (Seller):
              </p>
            </div>
            <p className="font-black text-sm text-slate-900">{invoice.fromName}</p>
            {invoice.fromAddress && (
              <p className="text-slate-600 text-[11px] leading-relaxed">
                {invoice.fromAddress}
              </p>
            )}
            {invoice.fromPhone && (
              <div className="pt-1 space-y-0.5 text-[11px]">
                <p className="text-slate-700">
                  <span className="font-semibold text-slate-500">Contact:</span>{' '}
                  <span className="font-bold text-slate-800">{invoice.fromPhone}</span>
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Line Items Table */}
      <div className="pt-4 pb-8 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-[#2563EB] text-white text-[10px] font-black uppercase tracking-wider">
              <th className="py-2.5 px-3 text-center w-10 rounded-tl-lg">#</th>
              <th className="py-2.5 px-4">Item Description</th>
              <th className="py-2.5 px-3 text-center">HSN / Code</th>
              <th className="py-2.5 px-3 text-center">Qty</th>
              <th className="py-2.5 px-3 text-center">Unit</th>
              <th className="py-2.5 px-3 text-right">Price / Unit</th>
              <th className="py-2.5 px-4 text-right rounded-tr-lg">Total Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 text-[11px] border-b border-slate-300">
            {(invoice.items || []).map((item, index) => (
              <tr
                key={index}
                className={index % 2 === 1 ? 'bg-blue-50/25 hover:bg-blue-50/50' : 'bg-white hover:bg-blue-50/30'}
              >
                <td className="py-2.5 px-3 text-center text-slate-500 tabular-nums font-medium">{index + 1}</td>
                <td className="py-2.5 px-4">
                  <p className="font-bold text-slate-900">{item.productName}</p>
                  {item.description && (
                    <p className="text-[10px] text-slate-500 mt-0.5">{item.description}</p>
                  )}
                </td>
                <td className="py-2.5 px-3 text-center text-slate-600 font-mono tabular-nums">
                  {item.hsnCode || '-'}
                </td>
                <td className="py-2.5 px-3 text-center font-black text-slate-900 tabular-nums">{item.quantity}</td>
                <td className="py-2.5 px-3 text-center text-slate-600 font-medium">
                  {item.unit || 'PCS'}
                </td>
                <td className="py-2.5 px-3 text-right text-slate-700 tabular-nums">{formatINR(item.unitPrice, false)}</td>
                <td className="py-2.5 px-4 text-right font-black text-slate-900 tabular-nums">
                  {formatINR(item.totalAmount, false)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Calculation & Terms Summary */}
      <div className="grid grid-cols-2 gap-6 mt-8 pt-6 border-t-2 border-slate-200">
        {/* Left Column: Words, Terms & Notes */}
        <div className="space-y-4">
          <div>
            <div className="flex items-center gap-1.5 mb-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-[#2563EB]"></div>
              <p className="text-[10px] font-black text-[#2563EB] uppercase tracking-wider">Amount in Words:</p>
            </div>
            <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-100 text-xs font-black text-blue-950 italic leading-snug">
              {numberToWordsINR(invoice.grandTotal)}
            </div>
          </div>

          {/* Terms & Notes */}
          <div className="p-3.5 bg-slate-50/80 rounded-xl border border-slate-200 text-[11px] space-y-1.5">
            <p className="font-black text-slate-800 uppercase text-[10px] tracking-wider">Terms & Conditions</p>
            <p className="text-slate-600 leading-relaxed text-[10.5px] whitespace-pre-line">
              {invoice.terms || business.termsAndConditions || 'Thanks for doing business with us!'}
            </p>
            {invoice.notes && (
              <p className="text-slate-700 pt-1.5 border-t border-slate-200">
                <span className="font-bold text-slate-800">Notes:</span> {invoice.notes}
              </p>
            )}
          </div>
        </div>

        {/* Right Column: Calculations */}
        <div className="space-y-2 text-xs bg-slate-50/80 p-4 rounded-xl border border-slate-200">
          <div className="flex justify-between py-1 border-b border-slate-200/80 text-slate-600">
            <span className="font-medium">Sub Total:</span>
            <span className="font-bold text-slate-800 tabular-nums">{formatINR(invoice.subTotal)}</span>
          </div>

          {invoice.discountTotal > 0 && (
            <div className="flex justify-between py-1 border-b border-slate-200/80 text-rose-600">
              <span className="font-medium">Discount:</span>
              <span className="font-bold tabular-nums">- {formatINR(invoice.discountTotal)}</span>
            </div>
          )}

          {(invoice.extraCharges || 0) > 0 && (
            <div className="flex justify-between py-1 border-b border-slate-200/80 text-slate-600">
              <span className="font-medium uppercase">
                {invoice.extraChargeName || 'Extra Charges'}:
              </span>
              <span className="font-bold text-slate-800 tabular-nums">{formatINR(invoice.extraCharges || 0)}</span>
            </div>
          )}

          {invoice.roundOff && invoice.roundOff !== 0 ? (
            <div className="flex justify-between py-1 border-b border-slate-200/80 text-slate-500">
              <span>Round Off:</span>
              <span className="tabular-nums font-medium">
                {invoice.roundOff > 0 ? `+${invoice.roundOff}` : invoice.roundOff}
              </span>
            </div>
          ) : null}

          {/* Professional #2563EB Grand Total Banner */}
          <div className="flex justify-between items-center py-2.5 px-3.5 bg-[#2563EB] text-white rounded-lg font-black shadow-sm my-1.5">
            <span className="text-xs uppercase tracking-wider font-extrabold">Grand Total:</span>
            <span className="text-base font-black tabular-nums tracking-tight">
              {formatINR(invoice.grandTotal)}
            </span>
          </div>

          <div className="flex justify-between items-center py-1 text-xs font-bold text-emerald-700">
            <span>Received / Paid:</span>
            <span className="tabular-nums">{formatINR(invoice.paidAmount)}</span>
          </div>

          {invoice.balanceAmount > 0 && (
            <div className="flex justify-between items-center py-1.5 px-2.5 rounded-lg bg-rose-50 border border-rose-200 text-xs font-black text-rose-700">
              <span>Balance Due:</span>
              <span className="tabular-nums">{formatINR(invoice.balanceAmount)}</span>
            </div>
          )}
        </div>
      </div>

      {/* Signatures */}
      <div className="grid grid-cols-2 gap-6 pt-10 mt-6 border-t border-slate-200 text-[10px]">
        <div className="flex flex-col justify-between items-start h-20">
          <p className="text-slate-500 font-medium">Customer's Signature / Stamp</p>
          <div className="w-48 border-t-2 border-slate-400 pt-1.5">
            <p className="text-[10px] font-bold text-slate-700">Receiver's Signature</p>
          </div>
        </div>
        <div className="text-right flex flex-col justify-between items-end h-20">
          {hasCustomSeller ? (
            <p className="font-extrabold text-slate-800 text-xs">For {invoice.fromName}</p>
          ) : (
            <div></div>
          )}
          <div className="w-48 border-t-2 border-slate-400 pt-1.5 text-right">
            <p className="text-[10px] font-bold text-slate-700">Authorized Signatory</p>
          </div>
        </div>
      </div>
    </div>
  );
}
