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

  const companyDisplayName =
    business.name && business.name !== 'Rahul Traders' && business.name !== 'Rahul Trader'
      ? business.name
      : 'RAHUL JEE TRADING COMPANY';

  return (
    <div
      id="print-section"
      className="w-full max-w-[794px] mx-auto bg-white text-slate-900 p-8 shadow-sm border border-slate-200 print:border-0 print:shadow-none print:p-6 print:max-w-none text-xs font-sans selection:bg-[#2563EB] selection:text-white"
    >
      {/* Top Professional Accent Bar */}
      <div className="h-1.5 w-full bg-[#2563EB] rounded-full mb-5 print:mb-4"></div>

      {/* Header Banner */}
      <div className="flex justify-between items-start gap-6 border-b border-slate-200 pb-5">
        <div className="flex-1 min-w-0 pr-4">
          <div className="mb-2.5">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-[11px] font-extrabold uppercase tracking-wider bg-[#2563EB] text-white shadow-xs">
              <svg className="w-3 h-3 fill-current" viewBox="0 0 24 24">
                <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z" />
              </svg>
              TAX INVOICE / ORIGINAL FOR RECIPIENT
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

        {/* Invoice Metadata Box */}
        <div className="bg-gradient-to-br from-blue-50/60 to-slate-50 p-4 rounded-xl border border-blue-100 w-[260px] shrink-0 self-start shadow-xs">
          <div className="divide-y divide-blue-100/70 text-xs">
            <div className="flex items-center justify-between gap-3 pb-2">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Invoice No</span>
              <span className="font-mono font-black text-base text-[#2563EB] tracking-tight">{sale.invoiceNumber}</span>
            </div>
            <div className="flex items-center justify-between gap-3 py-2">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Invoice Date</span>
              <span className="font-bold text-slate-800 tabular-nums text-[11px]">
                {new Date(sale.invoiceDate).toLocaleDateString('en-IN', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric',
                })}
              </span>
            </div>
            <div className="flex items-center justify-between gap-3 py-2">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Payment Mode</span>
              <span className="inline-flex items-center justify-center font-mono font-bold text-[10px] px-2.5 py-0.5 rounded-md bg-blue-100/80 text-blue-800 border border-blue-200 uppercase leading-none">
                {sale.paymentMode || 'CASH'}
              </span>
            </div>
            <div className="flex items-center justify-between gap-3 pt-2">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Invoice Status</span>
              <span
                className={`inline-flex items-center justify-center font-black text-[10px] px-2.5 py-0.5 rounded-md border uppercase leading-none tracking-wide ${
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

      {/* Customer & Consignor/Seller Row */}
      <div className="grid grid-cols-2 gap-4 py-4 border-b border-slate-200">
        {/* Customer / Buyer Details */}
        <div className="p-3.5 bg-slate-50/80 rounded-xl border border-slate-200 space-y-1">
          <div className="flex items-center gap-1.5 mb-1">
            <div className="w-1.5 h-1.5 rounded-full bg-[#2563EB]"></div>
            <p className="text-[10px] font-extrabold text-[#2563EB] uppercase tracking-wider">
              Customer / Buyer (Billed To):
            </p>
          </div>
          <p className="font-black text-sm text-slate-900">{sale.partyName || 'Cash Customer'}</p>
          {sale.partyAddress && (
            <p className="text-slate-600 text-[11px] leading-relaxed">{sale.partyAddress}</p>
          )}
          <div className="pt-1 space-y-0.5 text-[11px]">
            {sale.partyGstin ? (
              <p className="text-slate-700">
                <span className="font-semibold text-slate-500">GSTIN:</span>{' '}
                <span className="font-mono font-bold text-slate-900">{sale.partyGstin}</span>
              </p>
            ) : (
              <p className="text-slate-500 italic">Unregistered Consumer / Cash</p>
            )}
            <p className="text-slate-700">
              <span className="font-semibold text-slate-500">State / Place of Supply:</span>{' '}
              <span className="font-medium text-slate-800">{sale.partyState || business.state}</span>
            </p>
            {sale.partyPhone && (
              <p className="text-slate-700">
                <span className="font-semibold text-slate-500">Phone:</span>{' '}
                <span className="font-bold text-slate-800">{sale.partyPhone}</span>
              </p>
            )}
          </div>
        </div>

        {/* Consignor / Seller Details */}
        <div className="p-3.5 bg-slate-50/80 rounded-xl border border-slate-200 space-y-1">
          <div className="flex items-center gap-1.5 mb-1">
            <div className="w-1.5 h-1.5 rounded-full bg-[#2563EB]"></div>
            <p className="text-[10px] font-extrabold text-[#2563EB] uppercase tracking-wider">
              Billed By / Supplier (Seller):
            </p>
          </div>
          <p className="font-black text-sm text-slate-900">{companyDisplayName}</p>
          <p className="text-slate-600 text-[11px] leading-relaxed">
            {business.address || 'Allahabad Bank Road, Yusufpur, Mohammadabad, Dist- Ghazipur (U.P.) - 233227'}
          </p>
          <div className="pt-1 space-y-0.5 text-[11px]">
            <p className="text-slate-700">
              <span className="font-semibold text-slate-500">GSTIN:</span>{' '}
              <span className="font-mono font-bold text-slate-900">{business.gstin || '09DMCPG4193P1ZG'}</span>
            </p>
            <p className="text-slate-700">
              <span className="font-semibold text-slate-500">State:</span>{' '}
              <span className="font-medium text-slate-800">{business.state} ({business.stateCode})</span>
            </p>
            {business.phone && (
              <p className="text-slate-700">
                <span className="font-semibold text-slate-500">Contact:</span>{' '}
                <span className="font-bold text-slate-800">{business.phone}</span>
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Line Items Table */}
      <div className="pt-4 pb-8 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-[#2563EB] text-white text-[10px] font-black uppercase tracking-wider">
              <th className="py-2.5 px-3 text-center w-8 rounded-tl-lg">#</th>
              <th className="py-2.5 px-3">Item Description</th>
              <th className="py-2.5 px-2 text-center">HSN</th>
              <th className="py-2.5 px-2 text-center">Qty</th>
              <th className="py-2.5 px-2 text-right">Rate</th>
              <th className="py-2.5 px-2 text-right">Taxable</th>
              <th className="py-2.5 px-2 text-center">GST %</th>
              <th className="py-2.5 px-2 text-right">Tax Amt</th>
              <th className="py-2.5 px-3 text-right rounded-tr-lg">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 text-[11px] border-b border-slate-300">
            {(sale.items || []).map((item, index) => {
              const taxAmt =
                (item.cgstAmount || 0) +
                (item.sgstAmount || 0) +
                (item.igstAmount || 0) ||
                Math.max(0, item.totalAmount - item.taxableAmount);

              return (
                <tr
                  key={index}
                  className={index % 2 === 1 ? 'bg-blue-50/25 hover:bg-blue-50/50' : 'bg-white hover:bg-blue-50/30'}
                >
                  <td className="py-2.5 px-3 text-center text-slate-500 tabular-nums font-medium">{index + 1}</td>
                  <td className="py-2.5 px-3 font-bold text-slate-900">{item.productName}</td>
                  <td className="py-2.5 px-2 text-center text-slate-600 font-mono tabular-nums">{item.hsnCode || '-'}</td>
                  <td className="py-2.5 px-2 text-center font-black text-slate-900 tabular-nums">
                    {item.quantity} {item.unit || 'PCS'}
                  </td>
                  <td className="py-2.5 px-2 text-right text-slate-700 tabular-nums">{formatINR(item.unitPrice, false)}</td>
                  <td className="py-2.5 px-2 text-right font-medium tabular-nums">
                    {formatINR(item.taxableAmount, false)}
                  </td>
                  <td className="py-2.5 px-2 text-center font-black text-[#2563EB] tabular-nums">{item.gstRate}%</td>
                  <td className="py-2.5 px-2 text-right text-slate-600 tabular-nums">
                    {formatINR(taxAmt, false)}
                  </td>
                  <td className="py-2.5 px-3 text-right font-black text-slate-900 tabular-nums">
                    {formatINR(item.totalAmount, false)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Tax & Total Calculation Summary */}
      <div className="grid grid-cols-2 gap-6 mt-8 pt-6 border-t-2 border-slate-200">
        {/* Left Column: Words, Bank Details, Terms & Notes */}
        <div className="space-y-4">
          <div>
            <div className="flex items-center gap-1.5 mb-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-[#2563EB]"></div>
              <p className="text-[10px] font-black text-[#2563EB] uppercase tracking-wider">Amount in Words:</p>
            </div>
            <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-100 text-xs font-black text-blue-950 italic leading-snug">
              {numberToWordsINR(sale.grandTotal)}
            </div>
          </div>

          {/* Bank Payment Details + QR */}
          <div className="flex gap-4 p-3.5 bg-slate-50/80 rounded-xl border border-slate-200 items-center">
            <div className="flex-1 space-y-1 text-[11px]">
              <p className="font-black text-slate-800 uppercase text-[10px] tracking-wider">Bank Payment Details</p>
              <p>
                <span className="font-semibold text-slate-500">Bank:</span>{' '}
                <span className="font-medium text-slate-800">{business.bankName || 'HDFC Bank Ltd'}</span>
              </p>
              <p>
                <span className="font-semibold text-slate-500">A/C No:</span>{' '}
                <span className="font-bold text-slate-900 tabular-nums">{business.bankAccountNo || '50200088991122'}</span>
              </p>
              <p>
                <span className="font-semibold text-slate-500">IFSC:</span>{' '}
                <span className="font-bold text-slate-900 tabular-nums">{business.bankIfsc || 'HDFC0001234'}</span>
              </p>
              <p>
                <span className="font-semibold text-slate-500">UPI ID:</span>{' '}
                <span className="font-bold text-[#2563EB] tabular-nums">{business.upiId || 'rahultraders@icici'}</span>
              </p>
            </div>
            {qrUrl && (
              <div className="text-center shrink-0">
                <img
                  src={qrUrl}
                  alt="UPI QR"
                  className="w-20 h-20 bg-white p-1 rounded-lg border border-slate-300 shadow-xs"
                />
                <p className="text-[9px] font-bold text-slate-500 mt-1 uppercase tracking-wider">Scan & Pay</p>
              </div>
            )}
          </div>

          {/* Terms & Notes */}
          <div className="p-3.5 bg-slate-50/80 rounded-xl border border-slate-200 text-[11px] space-y-1.5">
            <p className="font-black text-slate-800 uppercase text-[10px] tracking-wider">Terms & Conditions</p>
            <p className="text-slate-600 leading-relaxed text-[10.5px] whitespace-pre-line">
              {sale.terms || business.termsAndConditions || '1. Goods once sold will not be accepted back.\n2. Subject to local jurisdiction.'}
            </p>
            {sale.notes && (
              <p className="text-slate-700 pt-1.5 border-t border-slate-200">
                <span className="font-bold text-slate-800">Notes:</span> {sale.notes}
              </p>
            )}
          </div>
        </div>

        {/* Right Column: Calculations */}
        <div className="space-y-2 text-xs bg-slate-50/80 p-4 rounded-xl border border-slate-200">
          <div className="flex justify-between py-1 border-b border-slate-200/80 text-slate-600">
            <span className="font-medium">Subtotal (Taxable Value):</span>
            <span className="font-bold text-slate-800 tabular-nums">{formatINR(sale.taxableTotal)}</span>
          </div>

          {!sale.isInterState ? (
            <>
              <div className="flex justify-between py-1 border-b border-slate-200/80 text-slate-600">
                <span className="font-medium">Central GST (CGST):</span>
                <span className="font-bold text-slate-800 tabular-nums">{formatINR(sale.cgstTotal)}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200/80 text-slate-600">
                <span className="font-medium">State GST (SGST):</span>
                <span className="font-bold text-slate-800 tabular-nums">{formatINR(sale.sgstTotal)}</span>
              </div>
            </>
          ) : (
            <div className="flex justify-between py-1 border-b border-slate-200/80 text-slate-600">
              <span className="font-medium">Integrated GST (IGST):</span>
              <span className="font-bold text-slate-800 tabular-nums">{formatINR(sale.igstTotal)}</span>
            </div>
          )}

          {sale.roundOff !== 0 && (
            <div className="flex justify-between py-1 border-b border-slate-200/80 text-slate-500">
              <span>Round Off:</span>
              <span className="tabular-nums font-medium">
                {sale.roundOff > 0 ? `+${sale.roundOff}` : sale.roundOff}
              </span>
            </div>
          )}

          {/* Professional #2563EB Grand Total Banner */}
          <div className="flex justify-between items-center py-2.5 px-3.5 bg-[#2563EB] text-white rounded-lg font-black shadow-sm my-1.5">
            <span className="text-xs uppercase tracking-wider font-extrabold">Invoice Total:</span>
            <span className="text-base font-black tabular-nums tracking-tight">
              {formatINR(sale.grandTotal)}
            </span>
          </div>

          <div className="flex justify-between items-center py-1 text-xs font-bold text-emerald-700">
            <span>Paid Amount:</span>
            <span className="tabular-nums">{formatINR(sale.paidAmount)}</span>
          </div>

          {sale.balanceAmount > 0 && (
            <div className="flex justify-between items-center py-1.5 px-2.5 rounded-lg bg-rose-50 border border-rose-200 text-xs font-black text-rose-700">
              <span>Balance Due:</span>
              <span className="tabular-nums">{formatINR(sale.balanceAmount)}</span>
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
          <p className="font-extrabold text-slate-800 text-xs">For {companyDisplayName}</p>
          <div className="w-48 border-t-2 border-slate-400 pt-1.5 text-right">
            <p className="text-[10px] font-bold text-slate-700">Authorized Signatory</p>
          </div>
        </div>
      </div>
    </div>
  );
}
