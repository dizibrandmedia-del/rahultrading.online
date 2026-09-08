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
      className="w-full max-w-[794px] mx-auto bg-white text-slate-900 p-8 shadow-sm border border-slate-200 print:border-0 print:shadow-none print:p-6 print:max-w-none text-xs font-sans selection:bg-cyan-500 selection:text-white"
    >
      {/* Header Banner */}
      <div className="flex justify-between items-start border-b-2 border-slate-800 pb-4">
        <div>
          <span className="inline-block px-2.5 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wider bg-cyan-100 text-cyan-800 border border-cyan-200 mb-1.5">
            INVOICE / BILL OF SUPPLY
          </span>
          {hasCustomSeller && (
            <>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                {invoice.fromName}
              </h1>
              {invoice.fromAddress && (
                <p className="text-[11px] text-slate-600 mt-1 max-w-sm whitespace-pre-line leading-relaxed">
                  {invoice.fromAddress}
                </p>
              )}
              {invoice.fromPhone && (
                <p className="text-[11px] text-slate-600">
                  Mobile: <span className="font-semibold">{invoice.fromPhone}</span>
                </p>
              )}
            </>
          )}
        </div>

        {/* Invoice Metadata Box (previous format) */}
        <div className="text-right space-y-1.5 bg-slate-50 p-3 rounded-xl border border-slate-200 min-w-[210px]">
          <div>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Invoice Number</p>
            <p className="font-mono font-extrabold text-sm text-cyan-700">{invoice.invoiceNumber}</p>
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Invoice Date</p>
            <p className="font-semibold text-slate-800 tabular-nums">
              {new Date(invoice.invoiceDate).toLocaleDateString('en-IN', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
              })}
            </p>
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Payment Mode</p>
            <span className="inline-block font-mono font-bold text-[11px] px-2 py-0.5 rounded bg-slate-200 text-slate-800">
              {invoice.paymentMode || 'UNPAID'}
            </span>
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Invoice Status</p>
            <span
              className={`inline-block font-bold text-[10px] px-2 py-0.5 rounded border ${
                paymentStatus === 'PAID'
                  ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                  : paymentStatus === 'PARTIAL'
                  ? 'bg-amber-100 text-amber-800 border-amber-300'
                  : 'bg-rose-100 text-rose-800 border-rose-300'
              }`}
            >
              {paymentStatus}
            </span>
          </div>
        </div>
      </div>

      {/* Customer & Consignor/Seller Row */}
      <div className={`grid ${hasCustomSeller ? 'grid-cols-2' : 'grid-cols-1'} gap-4 py-3 border-b border-slate-200`}>
        {/* Customer / Buyer Details */}
        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
          <p className="text-[10px] font-bold text-cyan-700 uppercase tracking-wider">
            Customer / Buyer (Billed To):
          </p>
          <p className="font-extrabold text-sm text-slate-900">{invoice.partyName || 'Cash Customer'}</p>
          {(invoice.partyAddress || invoice.billingAddress) && (
            <p className="text-slate-600 text-[11px] leading-relaxed">
              {invoice.partyAddress || invoice.billingAddress}
            </p>
          )}
          <div className="pt-1 space-y-0.5 text-[11px]">
            {invoice.partyPhone && (
              <p className="text-slate-700">
                <span className="font-semibold">Phone:</span> {invoice.partyPhone}
              </p>
            )}
            <p className="text-slate-500 italic text-[10px]">Non-GST Regular Customer</p>
          </div>
        </div>

        {/* Consignor / Seller Details (Only shown if custom filled) */}
        {hasCustomSeller && (
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              Billed By / Supplier (Seller):
            </p>
            <p className="font-extrabold text-sm text-slate-900">{invoice.fromName}</p>
            {invoice.fromAddress && (
              <p className="text-slate-600 text-[11px] leading-relaxed">
                {invoice.fromAddress}
              </p>
            )}
            {invoice.fromPhone && (
              <div className="pt-1 space-y-0.5 text-[11px]">
                <p className="text-slate-700">
                  <span className="font-semibold">Contact:</span> {invoice.fromPhone}
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Line Items Table */}
      <div className="pt-3 pb-4">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-100 text-[10px] font-bold text-slate-700 uppercase border-y border-slate-300">
              <th className="py-2 px-2 text-center w-8">#</th>
              <th className="py-2 px-3">Item Description</th>
              <th className="py-2 px-2 text-center">HSN / Code</th>
              <th className="py-2 px-2 text-center">Qty</th>
              <th className="py-2 px-2 text-center">Unit</th>
              <th className="py-2 px-2 text-right">Price / Unit</th>
              <th className="py-2 px-2 text-right">Total Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 text-[11px]">
            {(invoice.items || []).map((item, index) => (
              <tr key={index} className="hover:bg-slate-50/80">
                <td className="py-2 px-2 text-center text-slate-500 tabular-nums">{index + 1}</td>
                <td className="py-2 px-3">
                  <p className="font-semibold text-slate-900">{item.productName}</p>
                  {item.description && (
                    <p className="text-[10px] text-slate-500">{item.description}</p>
                  )}
                </td>
                <td className="py-2 px-2 text-center text-slate-600 font-mono tabular-nums">
                  {item.hsnCode || '-'}
                </td>
                <td className="py-2 px-2 text-center font-bold tabular-nums">{item.quantity}</td>
                <td className="py-2 px-2 text-center text-slate-600 font-medium">
                  {item.unit || 'PCS'}
                </td>
                <td className="py-2 px-2 text-right tabular-nums">{formatINR(item.unitPrice, false)}</td>
                <td className="py-2 px-2 text-right font-bold text-slate-900 tabular-nums">
                  {formatINR(item.totalAmount, false)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Calculation & Terms Summary */}
      <div className="grid grid-cols-2 gap-6 pt-3 border-t-2 border-slate-300">
        {/* Left Column: Words, Bank Details, Terms & Notes */}
        <div className="space-y-4">
          <div>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Amount in Words:</p>
            <p className="text-xs font-extrabold text-blue-950 italic mt-0.5">
              {numberToWordsINR(invoice.grandTotal)}
            </p>
          </div>



          {/* Terms & Notes */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-[11px] space-y-1.5">
            <p className="font-bold text-slate-800 uppercase text-[10px]">Terms & Conditions</p>
            <p className="text-slate-600 leading-relaxed text-[10.5px] whitespace-pre-line">
              {invoice.terms || business.termsAndConditions || 'Thanks for doing business with us!'}
            </p>
            {invoice.notes && (
              <p className="text-slate-700 pt-1 border-t border-slate-200">
                <span className="font-semibold">Notes:</span> {invoice.notes}
              </p>
            )}
          </div>
        </div>

        {/* Right Column: Calculations */}
        <div className="space-y-1.5 text-xs bg-slate-50 p-4 rounded-xl border border-slate-200">
          <div className="flex justify-between py-1 border-b border-slate-200">
            <span className="text-slate-600 font-medium">Sub Total:</span>
            <span className="font-semibold tabular-nums">{formatINR(invoice.subTotal)}</span>
          </div>

          {invoice.discountTotal > 0 && (
            <div className="flex justify-between py-1 border-b border-slate-200 text-rose-600">
              <span className="font-medium">Discount:</span>
              <span className="font-semibold tabular-nums">- {formatINR(invoice.discountTotal)}</span>
            </div>
          )}

          {(invoice.extraCharges || 0) > 0 && (
            <div className="flex justify-between py-1 border-b border-slate-200">
              <span className="text-slate-600 font-medium uppercase">
                {invoice.extraChargeName || 'EXTRA CHARGES'}:
              </span>
              <span className="font-semibold tabular-nums">{formatINR(invoice.extraCharges || 0)}</span>
            </div>
          )}

          {invoice.roundOff && invoice.roundOff !== 0 ? (
            <div className="flex justify-between py-1 border-b border-slate-200 text-slate-500">
              <span>Round Off:</span>
              <span className="tabular-nums">
                {invoice.roundOff > 0 ? `+${invoice.roundOff}` : invoice.roundOff}
              </span>
            </div>
          ) : null}

          <div className="flex justify-between py-2 border-b-2 border-slate-400 text-sm font-black text-slate-900">
            <span>Grand Total:</span>
            <span className="text-cyan-900 font-bold text-base tabular-nums">
              {formatINR(invoice.grandTotal)}
            </span>
          </div>

          <div className="flex justify-between py-1 text-xs font-semibold text-emerald-700">
            <span>Received / Paid:</span>
            <span className="tabular-nums">{formatINR(invoice.paidAmount)}</span>
          </div>

          {invoice.balanceAmount > 0 && (
            <div className="flex justify-between py-1 text-xs font-bold text-rose-600">
              <span>Balance Due:</span>
              <span className="tabular-nums">{formatINR(invoice.balanceAmount)}</span>
            </div>
          )}
        </div>
      </div>

      {/* Signatures */}
      <div className="grid grid-cols-2 gap-4 pt-8 mt-6 border-t border-slate-200 text-[10px]">
        <div className="flex flex-col justify-between items-start h-16">
          <p className="text-slate-500">Customer's Signature / Stamp</p>
          <p className="text-[10px] text-slate-700 border-t border-slate-400 pt-1 pr-8">Receiver's Signature</p>
        </div>
        <div className="text-right flex flex-col justify-between items-end h-16">
          {hasCustomSeller && (
            <p className="font-bold text-slate-800">For {invoice.fromName}</p>
          )}
          <p className="text-[10px] text-slate-700 border-t border-slate-400 pt-1 pl-8">Authorized Signatory</p>
        </div>
      </div>
    </div>
  );
}
