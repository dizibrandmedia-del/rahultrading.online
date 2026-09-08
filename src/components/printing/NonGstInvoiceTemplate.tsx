'use client';

import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
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
  const [qrUrl, setQrUrl] = useState<string>('');

  useEffect(() => {
    if (business.upiId && invoice.grandTotal > 0) {
      const upiUri = `upi://pay?pa=${encodeURIComponent(business.upiId)}&pn=${encodeURIComponent(
        business.name
      )}&am=${invoice.grandTotal.toFixed(2)}&tn=${encodeURIComponent(`Inv ${invoice.invoiceNumber}`)}&cu=INR`;
      QRCode.toDataURL(upiUri, { width: 120, margin: 1 })
        .then((url) => setQrUrl(url))
        .catch((err) => console.error('Error generating UPI QR:', err));
    }
  }, [business.upiId, business.name, invoice.grandTotal, invoice.invoiceNumber]);

  const paymentStatus =
    invoice.paymentStatus ||
    (invoice.balanceAmount <= 0
      ? 'PAID'
      : invoice.paidAmount > 0
      ? 'PARTIAL'
      : 'UNPAID');

  const companyDisplayName =
    invoice.fromName && invoice.fromName !== 'Rahul Traders' && invoice.fromName !== 'Rahul Trader'
      ? invoice.fromName
      : business.name || 'RAHUL JEE TRADING COMPANY';

  return (
    <div
      id="print-section"
      className="w-full max-w-[794px] mx-auto bg-white text-slate-900 p-8 shadow-sm border border-slate-200 print:border-0 print:shadow-none print:p-6 print:max-w-none text-xs font-sans selection:bg-cyan-500 selection:text-white"
    >
      {/* Header Banner */}
      <div className="flex justify-between items-start gap-6 border-b-2 border-slate-800 pb-4">
        <div className="flex-1 min-w-0 pr-4">
          <div className="mb-2">
            <span className="inline-flex items-center px-2.5 py-1 rounded text-[10px] font-extrabold uppercase tracking-wider bg-cyan-100 text-cyan-800 border border-cyan-200 leading-none">
              NON-GST INVOICE / BILL OF SUPPLY
            </span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight leading-tight">
            {companyDisplayName}
          </h1>
          {business.legalName && business.legalName !== business.name && (
            <p className="text-[11px] font-semibold text-slate-600 mt-0.5">({business.legalName})</p>
          )}
          <p className="text-[11px] text-slate-600 mt-1 max-w-sm whitespace-pre-line leading-relaxed">
            {invoice.fromAddress || business.address || 'Allahabad Bank Road, Yusufpur, Mohammadabad, Dist- Ghazipur (U.P.) - 233227'}
          </p>
        </div>

        {/* Invoice Metadata Box */}
        <div className="bg-slate-50/90 p-3.5 rounded-xl border border-slate-200 w-[260px] shrink-0 self-start shadow-sm">
          <div className="divide-y divide-slate-200/80 text-xs">
            <div className="flex items-center justify-between gap-3 pb-2">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Invoice No</span>
              <span className="font-mono font-extrabold text-sm text-cyan-700 tracking-tight">{invoice.invoiceNumber}</span>
            </div>
            <div className="flex items-center justify-between gap-3 py-2">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Invoice Date</span>
              <span className="font-semibold text-slate-800 tabular-nums">
                {new Date(invoice.invoiceDate).toLocaleDateString('en-IN', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric',
                })}
              </span>
            </div>
            <div className="flex items-center justify-between gap-3 py-2">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Payment Mode</span>
              <span className="inline-flex items-center justify-center font-mono font-bold text-[10px] px-2.5 py-0.5 rounded-md bg-slate-200 text-slate-800 uppercase leading-none">
                {invoice.paymentMode || 'CASH'}
              </span>
            </div>
            <div className="flex items-center justify-between gap-3 pt-2">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Invoice Status</span>
              <span
                className={`inline-flex items-center justify-center font-bold text-[10px] px-2.5 py-0.5 rounded-md border leading-none tracking-wide ${
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
      </div>

      {/* Customer & Consignor/Seller Row */}
      <div className="grid grid-cols-2 gap-4 py-3 border-b border-slate-200">
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

        {/* Consignor / Seller Details */}
        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
            Billed By / Supplier (Seller):
          </p>
          <p className="font-extrabold text-sm text-slate-900">{companyDisplayName}</p>
          <p className="text-slate-600 text-[11px] leading-relaxed">
            {invoice.fromAddress || business.address || 'Allahabad Bank Road, Yusufpur, Mohammadabad, Dist- Ghazipur (U.P.) - 233227'}
          </p>
          <div className="pt-1 space-y-0.5 text-[11px]">
            {(invoice.fromPhone || business.phone) && (
              <p className="text-slate-700">
                <span className="font-semibold">Contact:</span> {invoice.fromPhone || business.phone}
              </p>
            )}
          </div>
        </div>
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

          {/* Bank Payment Details + QR */}
          <div className="flex gap-4 p-3 bg-slate-50 rounded-xl border border-slate-200 items-center">
            <div className="flex-1 space-y-1 text-[11px]">
              <p className="font-bold text-slate-800 uppercase text-[10px]">Bank Payment Details</p>
              <p>
                <span className="font-semibold">Bank:</span> {business.bankName || 'HDFC Bank Ltd'}
              </p>
              <p>
                <span className="font-semibold">A/C No:</span>{' '}
                <span className="font-bold tabular-nums">{business.bankAccountNo || '50200088991122'}</span>
              </p>
              <p>
                <span className="font-semibold">IFSC:</span>{' '}
                <span className="font-bold tabular-nums">{business.bankIfsc || 'HDFC0001234'}</span>
              </p>
              <p>
                <span className="font-semibold">UPI ID:</span>{' '}
                <span className="font-bold text-cyan-700 tabular-nums">{business.upiId || 'rahultraders@icici'}</span>
              </p>
            </div>
            {qrUrl && (
              <div className="text-center shrink-0">
                <img
                  src={qrUrl}
                  alt="UPI QR"
                  className="w-20 h-20 bg-white p-1 rounded border border-slate-300 shadow-sm"
                />
                <p className="text-[9px] font-bold text-slate-500 mt-1">Scan & Pay</p>
              </div>
            )}
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
          <p className="font-bold text-slate-800">For {companyDisplayName}</p>
          <p className="text-[10px] text-slate-700 border-t border-slate-400 pt-1 pl-8">Authorized Signatory</p>
        </div>
      </div>
    </div>
  );
}
