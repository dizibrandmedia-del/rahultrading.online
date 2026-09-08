'use client';

import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { formatINR, numberToWordsINR } from '@/lib/currency';

export interface InvoiceA4Props {
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
    upiId?: string | null;
    termsAndConditions?: string | null;
  };
  sale: {
    invoiceNumber: string;
    invoiceDate: Date | string;
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
    terms?: string | null;
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
      cgstAmount?: number;
      sgstAmount?: number;
      igstAmount?: number;
      totalAmount: number;
    }>;
  };
}

export function InvoiceA4Template({ business, sale }: InvoiceA4Props) {
  const [qrUrl, setQrUrl] = useState<string>('');

  useEffect(() => {
    if (business.upiId && sale.grandTotal > 0) {
      const upiUri = `upi://pay?pa=${encodeURIComponent(business.upiId)}&pn=${encodeURIComponent(
        business.name
      )}&am=${sale.grandTotal.toFixed(2)}&tn=${encodeURIComponent(`Inv ${sale.invoiceNumber}`)}&cu=INR`;
      QRCode.toDataURL(upiUri, { width: 120, margin: 1 })
        .then((url) => setQrUrl(url))
        .catch((err) => console.error(err));
    }
  }, [business.upiId, business.name, sale.grandTotal, sale.invoiceNumber]);

  const paymentStatus =
    sale.paymentStatus ||
    (sale.balanceAmount <= 0
      ? 'PAID'
      : sale.paidAmount > 0
      ? 'PARTIAL'
      : 'UNPAID');

  return (
    <div
      id="print-section"
      className="w-full max-w-[794px] mx-auto bg-white text-slate-900 p-8 shadow-sm border border-slate-200 print:border-0 print:shadow-none print:p-6 print:max-w-none text-xs font-sans selection:bg-blue-500 selection:text-white"
    >
      {/* Header Banner */}
      <div className="flex justify-between items-start border-b-2 border-slate-800 pb-4">
        <div>
          <span className="inline-block px-2.5 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wider bg-blue-100 text-blue-800 border border-blue-200 mb-1.5">
            TAX INVOICE / ORIGINAL FOR RECIPIENT
          </span>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">{business.name}</h1>
          {business.legalName && business.legalName !== business.name && (
            <p className="text-[11px] font-semibold text-slate-600">({business.legalName})</p>
          )}
          <p className="text-[11px] text-slate-600 mt-1 max-w-sm whitespace-pre-line leading-relaxed">
            {business.address || 'Wholesale & Retail Trading Store'}
          </p>
          {business.gstin && (
            <p className="text-[11px] font-medium text-slate-700 mt-1.5">
              <strong className="font-bold text-slate-900">GSTIN:</strong>{' '}
              <span className="font-mono font-bold text-slate-900">{business.gstin}</span>
            </p>
          )}
        </div>

        {/* Invoice Metadata Box */}
        <div className="text-right space-y-1.5 bg-slate-50 p-3 rounded-xl border border-slate-200 min-w-[210px]">
          <div>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Invoice Number</p>
            <p className="font-mono font-extrabold text-sm text-blue-700">{sale.invoiceNumber}</p>
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Invoice Date</p>
            <p className="font-semibold text-slate-800 tabular-nums">
              {new Date(sale.invoiceDate).toLocaleDateString('en-IN', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
              })}
            </p>
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Payment Mode</p>
            <span className="inline-block font-mono font-bold text-[11px] px-2 py-0.5 rounded bg-slate-200 text-slate-800">
              {sale.paymentMode || 'CASH'}
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
      <div className="grid grid-cols-2 gap-4 py-3 border-b border-slate-200">
        {/* Customer / Buyer Details */}
        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
          <p className="text-[10px] font-bold text-blue-700 uppercase tracking-wider">
            Customer / Buyer (Billed To):
          </p>
          <p className="font-extrabold text-sm text-slate-900">{sale.partyName || 'Cash Customer'}</p>
          {sale.partyAddress && (
            <p className="text-slate-600 text-[11px] leading-relaxed">{sale.partyAddress}</p>
          )}
          <div className="pt-1 space-y-0.5 text-[11px]">
            {sale.partyGstin ? (
              <p className="text-slate-700">
                <span className="font-semibold">GSTIN:</span>{' '}
                <span className="font-mono font-bold text-slate-900">{sale.partyGstin}</span>
              </p>
            ) : (
              <p className="text-slate-500 italic">Unregistered Consumer / Cash</p>
            )}
            <p className="text-slate-700">
              <span className="font-semibold">State / Place of Supply:</span> {sale.partyState || business.state}
            </p>
            {sale.partyPhone && (
              <p className="text-slate-700">
                <span className="font-semibold">Phone:</span> {sale.partyPhone}
              </p>
            )}
          </div>
        </div>

        {/* Consignor / Seller Details */}
        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
            Billed By / Supplier (Seller):
          </p>
          <p className="font-extrabold text-sm text-slate-900">{business.name || 'RAHUL JEE TRADING COMPANY'}</p>
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

      {/* Line Items Table */}
      <div className="pt-3 pb-4">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-100 text-[10px] font-bold text-slate-700 uppercase border-y border-slate-300">
              <th className="py-2 px-2 text-center w-8">#</th>
              <th className="py-2 px-3">Item Description</th>
              <th className="py-2 px-2 text-center">HSN</th>
              <th className="py-2 px-2 text-center">Qty</th>
              <th className="py-2 px-2 text-right">Rate</th>
              <th className="py-2 px-2 text-right">Taxable</th>
              <th className="py-2 px-2 text-center">GST %</th>
              <th className="py-2 px-2 text-right">Tax Amt</th>
              <th className="py-2 px-2 text-right">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 text-[11px]">
            {(sale.items || []).map((item, index) => {
              const taxAmt =
                (item.cgstAmount || 0) +
                (item.sgstAmount || 0) +
                (item.igstAmount || 0) ||
                Math.max(0, item.totalAmount - item.taxableAmount);

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
                  <td className="py-2 px-2 text-center font-bold text-blue-700 tabular-nums">{item.gstRate}%</td>
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
        {/* Left Column: Words, Bank Details, Terms & Notes */}
        <div className="space-y-4">
          <div>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Amount in Words:</p>
            <p className="text-xs font-extrabold text-blue-950 italic mt-0.5">
              {numberToWordsINR(sale.grandTotal)}
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
                <span className="font-bold text-blue-600 tabular-nums">{business.upiId || 'rahultraders@icici'}</span>
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
              {sale.terms || business.termsAndConditions || '1. Goods once sold will not be accepted back.\n2. Subject to local jurisdiction.'}
            </p>
            {sale.notes && (
              <p className="text-slate-700 pt-1 border-t border-slate-200">
                <span className="font-semibold">Notes:</span> {sale.notes}
              </p>
            )}
          </div>
        </div>

        {/* Right Column: Calculations */}
        <div className="space-y-1.5 text-xs bg-slate-50 p-4 rounded-xl border border-slate-200">
          <div className="flex justify-between py-1 border-b border-slate-200">
            <span className="text-slate-600 font-medium">Subtotal (Taxable Value):</span>
            <span className="font-semibold tabular-nums">{formatINR(sale.taxableTotal)}</span>
          </div>

          {!sale.isInterState ? (
            <>
              <div className="flex justify-between py-1 border-b border-slate-200">
                <span className="text-slate-600">Central GST (CGST):</span>
                <span className="font-semibold tabular-nums">{formatINR(sale.cgstTotal)}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200">
                <span className="text-slate-600">State GST (SGST):</span>
                <span className="font-semibold tabular-nums">{formatINR(sale.sgstTotal)}</span>
              </div>
            </>
          ) : (
            <div className="flex justify-between py-1 border-b border-slate-200">
              <span className="text-slate-600">Integrated GST (IGST):</span>
              <span className="font-semibold tabular-nums">{formatINR(sale.igstTotal)}</span>
            </div>
          )}

          {sale.roundOff !== 0 && (
            <div className="flex justify-between py-1 border-b border-slate-200 text-slate-500">
              <span>Round Off:</span>
              <span className="tabular-nums">
                {sale.roundOff > 0 ? `+${sale.roundOff}` : sale.roundOff}
              </span>
            </div>
          )}

          <div className="flex justify-between py-2 border-b-2 border-slate-400 text-sm font-black text-slate-900">
            <span>Invoice Total:</span>
            <span className="text-blue-900 font-bold text-base tabular-nums">
              {formatINR(sale.grandTotal)}
            </span>
          </div>

          <div className="flex justify-between py-1 text-xs font-semibold text-emerald-700">
            <span>Paid Amount:</span>
            <span className="tabular-nums">{formatINR(sale.paidAmount)}</span>
          </div>

          {sale.balanceAmount > 0 && (
            <div className="flex justify-between py-1 text-xs font-bold text-rose-600">
              <span>Balance Due:</span>
              <span className="tabular-nums">{formatINR(sale.balanceAmount)}</span>
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
          <p className="font-bold text-slate-800">For {business.name}</p>
          <p className="text-[10px] text-slate-700 border-t border-slate-400 pt-1 pl-8">Authorized Signatory</p>
        </div>
      </div>
    </div>
  );
}
