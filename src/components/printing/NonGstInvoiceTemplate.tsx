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

  const sellerTitle =
    invoice.fromName && invoice.fromName.trim() !== ''
      ? invoice.fromName
      : 'R.J.T.C';

  const sellerContact = invoice.fromPhone || null;
  const sellerSubtitle = invoice.fromAddress || null;

  const totalQuantity = (invoice.items || []).reduce(
    (sum, it) => sum + (Number(it.quantity) || 0),
    0
  );

  return (
    <div
      id="print-section"
      className="w-full max-w-[794px] mx-auto bg-white text-slate-900 p-8 shadow-sm border border-slate-200 print:border-0 print:shadow-none print:p-6 print:max-w-none text-xs font-sans selection:bg-[#0e7490] selection:text-white"
    >
      {/* 1. Header: Company / Seller Brand */}
      <div className="pb-2">
        <h1 className="text-2xl font-black tracking-tight text-slate-900 uppercase">
          {sellerTitle}
        </h1>
        {sellerContact && (
          <p className="text-[11px] text-slate-700 mt-1">
            Phone no. : <span className="font-semibold text-slate-900">{sellerContact}</span>
          </p>
        )}
        {sellerSubtitle && (
          <p className="text-[11px] text-slate-600 mt-0.5 whitespace-pre-line leading-relaxed">
            {sellerSubtitle}
          </p>
        )}
      </div>

      {/* Solid Teal Horizontal Divider Line matching Image 2 */}
      <div className="h-1 w-full bg-[#0e7490] my-3"></div>

      {/* 2. Middle Row: Bill To (Left), Centered INVOICE, Metadata Box (Right) */}
      <div className="grid grid-cols-3 items-start pt-2 pb-4 gap-4">
        {/* Left: Bill To */}
        <div className="space-y-1">
          <p className="font-bold text-slate-800 text-xs mb-1 leading-none">Bill To</p>
          <p className="font-black text-sm text-slate-900 uppercase tracking-tight leading-snug">
            {invoice.partyName || 'Walk-in Cash Customer'}
          </p>
          {(invoice.partyAddress || invoice.billingAddress) && (
            <p className="text-[11px] text-slate-600 uppercase font-medium leading-snug">
              {invoice.partyAddress || invoice.billingAddress}
            </p>
          )}
          {invoice.partyPhone && (
            <p className="text-[11px] text-slate-700 leading-normal">
              Contact No. : <span className="font-semibold text-slate-900">{invoice.partyPhone}</span>
            </p>
          )}
          <p className="text-[11px] text-slate-700 leading-normal">
            State: <span className="font-semibold text-slate-900">{invoice.partyState || '09-Uttar Pradesh'}</span>
          </p>
        </div>

        {/* Center: INVOICE Title */}
        <div className="pt-2 text-center">
          <h2 className="text-xl md:text-2xl font-black tracking-widest text-[#0891b2] uppercase leading-none">
            INVOICE
          </h2>
        </div>

        {/* Right: Invoice Metadata Box */}
        <div className="flex justify-end">
          <div className="bg-slate-50/90 p-3.5 rounded-lg border border-slate-200/90 text-right space-y-2.5 w-full max-w-[210px] shadow-xs">
            <div>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-0.5 leading-none">
                INVOICE NUMBER
              </p>
              <p className="font-mono font-black text-sm text-[#0e7490] leading-tight">
                {invoice.invoiceNumber}
              </p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-0.5 leading-none">
                INVOICE DATE
              </p>
              <p className="font-semibold text-slate-800 text-[11px] tabular-nums leading-tight">
                {new Date(invoice.invoiceDate).toLocaleDateString('en-IN', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric',
                })}
              </p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 leading-none">
                PAYMENT MODE
              </p>
              <div className="flex justify-end">
                <span className="inline-block font-mono font-bold text-[10px] leading-tight px-2.5 py-1 rounded bg-slate-200 text-slate-800 uppercase">
                  {invoice.paymentMode || 'UNPAID'}
                </span>
              </div>
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 leading-none">
                INVOICE STATUS
              </p>
              <div className="flex justify-end">
                <span
                  className={`inline-block font-black text-[10px] leading-tight px-2.5 py-1 rounded border uppercase ${
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
        </div>
      </div>

      {/* 3. Line Items Table */}
      <div className="mb-6 overflow-hidden rounded-lg border border-slate-200">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-[#0e7490] text-white text-[11px] font-bold">
              <th className="py-2.5 px-3 text-center w-10">#</th>
              <th className="py-2.5 px-4 text-left">Item name</th>
              <th className="py-2.5 px-3 text-center w-24">Quantity</th>
              <th className="py-2.5 px-3 text-center w-20">Unit</th>
              <th className="py-2.5 px-3 text-right w-28">Price/ Unit</th>
              <th className="py-2.5 px-4 text-right w-32">Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 text-[11px]">
            {(invoice.items || []).map((item, index) => (
              <tr key={index} className="hover:bg-slate-50/70">
                <td className="py-2 px-3 text-center text-slate-500 tabular-nums">{index + 1}</td>
                <td className="py-2 px-4 font-bold text-slate-900 uppercase">
                  {item.productName}
                  {item.description && (
                    <span className="block text-[10px] font-normal text-slate-500 normal-case">{item.description}</span>
                  )}
                </td>
                <td className="py-2 px-3 text-center font-bold text-slate-900 tabular-nums">
                  {item.quantity}
                </td>
                <td className="py-2 px-3 text-center text-slate-700 font-medium">
                  {item.unit || 'PCS'}
                </td>
                <td className="py-2 px-3 text-right font-mono tabular-nums text-slate-800">
                  {formatINR(item.unitPrice, false)}
                </td>
                <td className="py-2 px-4 text-right font-bold font-mono tabular-nums text-slate-900">
                  {formatINR(item.totalAmount, false)}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-slate-300 font-bold text-xs bg-slate-50/60">
              <td colSpan={2} className="py-2.5 px-4 font-black text-slate-900">
                Total
              </td>
              <td className="py-2.5 px-3 text-center font-black text-slate-900 tabular-nums">
                {totalQuantity}
              </td>
              <td colSpan={2}></td>
              <td className="py-2.5 px-4 text-right font-black font-mono text-slate-900 tabular-nums">
                {formatINR(invoice.subTotal)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* 4. Bottom Section (Card matching Image 2) */}
      <div className="border border-slate-300 rounded-xl p-5 shadow-xs">
        <div className="grid grid-cols-2 gap-8">
          {/* Left Column: Words, Terms */}
          <div className="space-y-4 text-xs flex flex-col justify-between">
            <div>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                AMOUNT IN WORDS:
              </p>
              <p className="text-xs font-black text-slate-900 italic mt-0.5 leading-relaxed">
                {numberToWordsINR(invoice.grandTotal)}
              </p>
            </div>

            <div className="text-[10px] text-slate-600 pt-2">
              <p className="font-black text-slate-900 text-sm mb-0.5">Terms and Conditions</p>
              <p className="whitespace-pre-line leading-relaxed text-slate-600">
                {invoice.terms || business.termsAndConditions || 'Thanks for doing business with us!'}
              </p>
              {invoice.notes && (
                <p className="text-slate-700 mt-1">
                  <span className="font-semibold">Notes:</span> {invoice.notes}
                </p>
              )}
            </div>
          </div>

          {/* Right Column: Calculations */}
          <div className="space-y-1.5 text-xs">
            <div className="flex justify-between py-1 text-slate-700 font-medium">
              <span>Sub Total</span>
              <span className="font-mono font-bold tabular-nums text-slate-900">{formatINR(invoice.subTotal)}</span>
            </div>

            {(invoice.extraCharges || 0) > 0 && (
              <div className="flex justify-between py-1 text-slate-700 font-medium uppercase">
                <span>{invoice.extraChargeName || 'LOADING CHARGE'}:</span>
                <span className="font-mono font-bold tabular-nums text-slate-900">{formatINR(invoice.extraCharges || 0)}</span>
              </div>
            )}

            {invoice.discountTotal > 0 && (
              <div className="flex justify-between py-1 text-rose-600 font-medium">
                <span>Discount:</span>
                <span className="font-mono font-bold tabular-nums">- {formatINR(invoice.discountTotal)}</span>
              </div>
            )}

            {invoice.roundOff && invoice.roundOff !== 0 ? (
              <div className="flex justify-between py-1 text-slate-500 font-medium">
                <span>Round Off:</span>
                <span className="font-mono tabular-nums">{invoice.roundOff > 0 ? `+${invoice.roundOff}` : invoice.roundOff}</span>
              </div>
            ) : null}

            {/* Solid Teal Banner for Total matching Image 2 */}
            <div className="bg-[#0e7490] text-white px-3.5 py-2.5 rounded-md flex justify-between items-center my-2 shadow-xs">
              <span className="font-black text-sm text-white tracking-wide">Total</span>
              <span className="font-black text-base md:text-lg font-mono tabular-nums text-white">
                {formatINR(invoice.grandTotal)}
              </span>
            </div>

            <div className="flex justify-between py-1 text-slate-600 font-medium">
              <span>Received</span>
              <span className="font-mono tabular-nums">{formatINR(invoice.paidAmount)}</span>
            </div>

            <div className="flex justify-between py-1 text-xs font-bold text-slate-900">
              <span>Balance</span>
              <span className="font-mono font-black tabular-nums">{formatINR(invoice.balanceAmount)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 5. Dual Signatures */}
      <div className="grid grid-cols-2 gap-4 pt-10 mt-6 border-t border-slate-200 text-[10px]">
        <div className="flex flex-col justify-between items-start h-16">
          <p className="text-slate-500 font-medium">Customer's Signature</p>
          <div className="w-48 border-t-2 border-slate-400 pt-1">
            <p className="text-[10px] font-bold text-slate-700">Receiver's Signature</p>
          </div>
        </div>
        <div className="text-right flex flex-col justify-between items-end h-16">
          <p className="font-extrabold text-slate-800 text-xs">
            For {sellerTitle}
          </p>
          <div className="w-48 border-t-2 border-slate-400 pt-1 text-right">
            <p className="text-[10px] font-bold text-slate-700">Authorized Signatory</p>
          </div>
        </div>
      </div>
    </div>
  );
}
