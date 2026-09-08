'use client';

import React from 'react';
import { formatINR, numberToWordsINR } from '@/lib/currency';

export interface NonGstInvoiceTemplateProps {
  business: {
    name: string;
    legalName?: string | null;
    address?: string | null;
    city?: string | null;
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
  const hasCustomSeller = Boolean(
    invoice.fromName &&
      invoice.fromName.trim() !== '' &&
      invoice.fromName !== 'Rahul Traders' &&
      invoice.fromName !== 'Rahul Trader'
  );

  const sellerTitle = hasCustomSeller
    ? invoice.fromName
    : (business.legalName || business.name || 'R,J.T.C');

  const sellerSubtitle = hasCustomSeller
    ? invoice.fromAddress
    : (business.city || 'GHAZIPUR');

  const sellerContact = hasCustomSeller
    ? invoice.fromPhone
    : (business.phone || null);

  const formattedDate = (() => {
    const d = new Date(invoice.invoiceDate);
    if (isNaN(d.getTime())) return String(invoice.invoiceDate);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}-${month}-${year}`;
  })();

  const totalQuantity = (invoice.items || []).reduce(
    (sum, it) => sum + (Number(it.quantity) || 0),
    0
  );

  return (
    <div
      id="print-section"
      className="w-full max-w-[800px] mx-auto bg-white text-slate-900 p-8 shadow-sm border border-slate-200 print:border-0 print:shadow-none print:p-6 print:max-w-none text-xs font-sans"
    >
      {/* 1. Header: Company Brand */}
      <div className="pb-2 border-b border-slate-300">
        <h1 className="text-xl font-black tracking-wide text-slate-900 uppercase">
          {sellerTitle}
        </h1>
        {sellerSubtitle && (
          <p className="text-[11px] font-semibold text-slate-600 uppercase tracking-wider mt-0.5">
            {sellerSubtitle}
          </p>
        )}
        {sellerContact && (
          <p className="text-[10px] text-slate-600 mt-0.5">
            Contact No. : <span className="font-semibold text-slate-800">{sellerContact}</span>
          </p>
        )}
      </div>

      {/* 2. Centered INVOICE Title */}
      <div className="py-4 text-center">
        <h2 className="text-lg md:text-xl font-black tracking-widest text-slate-800 uppercase">
          INVOICE
        </h2>
      </div>

      {/* 3. Bill To & Invoice Details */}
      <div className="grid grid-cols-2 gap-6 mb-6 text-xs">
        {/* Left: Bill To */}
        <div className="space-y-0.5">
          <p className="font-bold text-slate-900 text-xs mb-1">Bill To</p>
          <p className="font-black text-slate-900 text-sm uppercase tracking-tight">
            {invoice.partyName || 'Walk-in Cash Customer'}
          </p>
          {(invoice.partyAddress || invoice.billingAddress) && (
            <p className="text-[11px] text-slate-600 uppercase font-medium leading-tight">
              {invoice.partyAddress || invoice.billingAddress}
            </p>
          )}
          {invoice.partyPhone && (
            <p className="text-[11px] text-slate-700">
              Contact No. : <span className="font-semibold">{invoice.partyPhone}</span>
            </p>
          )}
          <p className="text-[11px] text-slate-700">
            State: <span className="font-semibold">{invoice.partyState || '09-Uttar Pradesh'}</span>
          </p>
        </div>

        {/* Right: Invoice Details */}
        <div className="text-right space-y-1">
          <p className="font-bold text-slate-900 text-xs mb-1">Invoice Details</p>
          <p className="text-[11px] text-slate-700">
            Invoice No. : <span className="font-black text-slate-900 font-mono">{invoice.invoiceNumber}</span>
          </p>
          <p className="text-[11px] text-slate-700">
            Date : <span className="font-semibold text-slate-900">{formattedDate}</span>
          </p>
          <p className="text-[11px] text-slate-700">
            Place of supply: <span className="font-semibold text-slate-900">{invoice.partyState || business.state || '09-Uttar Pradesh'}</span>
          </p>
        </div>
      </div>

      {/* 4. Line Items Table */}
      <div className="mb-6">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-[#374151] text-white text-[11px] font-bold">
              <th className="py-2.5 px-3 text-center w-10 rounded-tl-md">#</th>
              <th className="py-2.5 px-4 text-left">Item name</th>
              <th className="py-2.5 px-3 text-center w-24">Quantity</th>
              <th className="py-2.5 px-3 text-center w-20">Unit</th>
              <th className="py-2.5 px-3 text-right w-28">Price/ Unit</th>
              <th className="py-2.5 px-4 text-right w-32 rounded-tr-md">Amount</th>
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
            <tr className="border-t-2 border-slate-300 font-bold text-xs">
              <td colSpan={2} className="py-3 px-4 font-black text-slate-900">
                Total
              </td>
              <td className="py-3 px-3 text-center font-black text-slate-900 tabular-nums">
                {totalQuantity}
              </td>
              <td colSpan={2}></td>
              <td className="py-3 px-4 text-right font-black font-mono text-slate-900 tabular-nums">
                {formatINR(invoice.subTotal)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* 5. Calculation & Terms Summary */}
      <div className="grid grid-cols-2 gap-8 pt-4">
        {/* Left: Words, Bank Details, Terms */}
        <div className="space-y-4 text-xs">
          <div>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">
              AMOUNT IN WORDS:
            </p>
            <p className="text-xs font-black text-slate-900 italic mt-0.5 leading-relaxed">
              {numberToWordsINR(invoice.grandTotal)}
            </p>
          </div>

          {/* Bank Payment Details (Clean text layout matching photo) */}
          {(!hasCustomSeller && (business.bankName || business.bankAccountNo)) && (
            <div className="space-y-0.5 text-[10px] text-slate-700 pt-1">
              <p className="font-black text-slate-800 uppercase tracking-wider text-[10px] mb-1">
                BANK PAYMENT DETAILS
              </p>
              {business.bankName && (
                <p><span className="text-slate-500">Bank:</span> <span className="font-semibold text-slate-800">{business.bankName}</span></p>
              )}
              {business.bankAccountNo && (
                <p><span className="text-slate-500">A/C No:</span> <span className="font-bold tabular-nums text-slate-900">{business.bankAccountNo}</span></p>
              )}
              {business.bankIfsc && (
                <p><span className="text-slate-500">IFSC:</span> <span className="font-bold tabular-nums text-slate-900">{business.bankIfsc}</span></p>
              )}
              {business.upiId && (
                <p><span className="text-slate-500">UPI ID:</span> <span className="font-semibold text-cyan-800 tabular-nums">{business.upiId}</span></p>
              )}
            </div>
          )}

          {/* Terms and Conditions */}
          <div className="text-[10px] text-slate-600 pt-1">
            <p className="font-black text-slate-800 text-[11px] mb-0.5">Terms and Conditions</p>
            <p className="whitespace-pre-line leading-relaxed">
              {invoice.terms || business.termsAndConditions || 'Thanks for doing business with us!'}
            </p>
            {invoice.notes && (
              <p className="text-slate-700 mt-1">
                <span className="font-semibold">Notes:</span> {invoice.notes}
              </p>
            )}
          </div>
        </div>

        {/* Right: Totals */}
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

          {/* Solid Dark Banner for Total */}
          <div className="bg-[#374151] text-white px-3.5 py-2.5 rounded-md flex justify-between items-center my-2 shadow-xs">
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

      {/* 6. Signatures */}
      <div className="grid grid-cols-2 gap-4 pt-12 mt-8 border-t border-slate-200 text-[10px]">
        <div className="flex flex-col justify-between items-start h-14">
          <p className="text-slate-500">Customer's Signature</p>
          <p className="text-[10px] text-slate-700 border-t border-slate-400 pt-1 pr-8">Receiver's Signature</p>
        </div>
        <div className="text-right flex flex-col justify-between items-end h-14">
          <p className="font-bold text-slate-800">
            For {sellerTitle}
          </p>
          <p className="text-[10px] text-slate-700 border-t border-slate-400 pt-1 pl-8">Authorized Signatory</p>
        </div>
      </div>
    </div>
  );
}
