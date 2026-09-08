'use client';

import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { formatINR } from '@/lib/currency';

interface ThermalReceiptProps {
  business: {
    name: string;
    phone?: string | null;
    gstin?: string | null;
    address?: string | null;
    upiId?: string | null;
  };
  sale: {
    invoiceNumber: string;
    invoiceDate: Date | string;
    partyName: string;
    grandTotal: number;
    paidAmount: number;
    balanceAmount: number;
    paymentMode: string;
    items: Array<{
      productName: string;
      quantity: number;
      unit: string;
      unitPrice: number;
      totalAmount: number;
    }>;
  };
  width?: '80mm' | '58mm';
}

export function ThermalReceiptTemplate({
  business,
  sale,
  width = '80mm',
}: ThermalReceiptProps) {
  const [qrUrl, setQrUrl] = useState<string>('');

  useEffect(() => {
    if (business.upiId && sale.grandTotal > 0) {
      const upiUri = `upi://pay?pa=${encodeURIComponent(business.upiId)}&pn=${encodeURIComponent(
        business.name
      )}&am=${sale.grandTotal.toFixed(2)}&tn=${encodeURIComponent(`Inv ${sale.invoiceNumber}`)}&cu=INR`;
      QRCode.toDataURL(upiUri, { width: 100, margin: 1 })
        .then((url) => setQrUrl(url))
        .catch((err) => console.error(err));
    }
  }, [business.upiId, business.name, sale.grandTotal, sale.invoiceNumber]);

  const formattedDate = new Date(sale.invoiceDate).toLocaleString('en-IN', {
    dateStyle: 'short',
    timeStyle: 'short',
  });

  return (
    <div
      id="print-section"
      className={`bg-white font-sans tabular-nums text-[11px] leading-tight text-black p-3 border border-dashed border-slate-300 mx-auto ${
        width === '58mm' ? 'max-w-[200px]' : 'max-w-[300px]'
      }`}
    >
      {/* Header */}
      <div className="text-center pb-2 border-b border-dashed border-black">
        <p className="font-bold text-sm uppercase">{business.name}</p>
        {business.address && <p className="text-[10px]">{business.address}</p>}
        {business.phone && <p className="text-[10px]">Ph: {business.phone}</p>}
        {business.gstin && <p className="text-[10px] font-bold">GSTIN: {business.gstin}</p>}
      </div>

      {/* Bill Metadata */}
      <div className="py-1.5 border-b border-dashed border-black text-[10px] space-y-0.5">
        <div className="flex justify-between">
          <span>Bill No: {sale.invoiceNumber}</span>
        </div>
        <div className="flex justify-between">
          <span>Date: {formattedDate}</span>
        </div>
        <div className="flex justify-between">
          <span>Cust: {sale.partyName}</span>
          <span>Mode: {sale.paymentMode}</span>
        </div>
      </div>

      {/* Items */}
      <div className="py-2 border-b border-dashed border-black">
        <div className="flex justify-between font-bold pb-1 border-b border-black text-[10px]">
          <span>Item</span>
          <span>Qty x Rate</span>
          <span>Amt</span>
        </div>
        <div className="divide-y divide-dotted divide-slate-300 pt-1">
          {sale.items.map((item, idx) => (
            <div key={idx} className="py-1">
              <p className="font-bold">{item.productName}</p>
              <div className="flex justify-between text-[10px]">
                <span>
                  {item.quantity} {item.unit} @ {formatINR(item.unitPrice, false)}
                </span>
                <span className="font-bold">{formatINR(item.totalAmount, false)}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Totals */}
      <div className="py-2 space-y-1 text-[11px]">
        <div className="flex justify-between font-black text-xs border-b border-black pb-1">
          <span>NET TOTAL:</span>
          <span>{formatINR(sale.grandTotal)}</span>
        </div>
        <div className="flex justify-between text-[10px]">
          <span>PAID:</span>
          <span>{formatINR(sale.paidAmount)}</span>
        </div>
        {sale.balanceAmount > 0 && (
          <div className="flex justify-between text-[10px] font-bold">
            <span>DUE:</span>
            <span>{formatINR(sale.balanceAmount)}</span>
          </div>
        )}
      </div>

      {/* UPI QR & Footer */}
      {qrUrl && (
        <div className="flex flex-col items-center justify-center pt-2 border-t border-dashed border-black">
          <img src={qrUrl} alt="UPI QR" className="w-20 h-20" />
          <p className="text-[9px] font-bold mt-0.5">Scan & Pay via UPI</p>
        </div>
      )}

      <div className="text-center pt-2 text-[9px] border-t border-dashed border-black mt-2">
        <p className="font-bold">*** THANK YOU! VISIT AGAIN ***</p>
      </div>
    </div>
  );
}
