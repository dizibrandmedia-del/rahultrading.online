'use client';

import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { Modal } from '@/components/ui/Modal';
import { formatINR } from '@/lib/currency';
import { QrCode, CheckCircle, Copy, Share2 } from 'lucide-react';

interface QrModalProps {
  isOpen: boolean;
  onClose: () => void;
  amount: number;
  invoiceNumber: string;
  upiId?: string;
  upiName?: string;
}

export function QrModal({
  isOpen,
  onClose,
  amount,
  invoiceNumber,
  upiId = 'shreeganesh@icici',
  upiName = 'Shree Ganesh Enterprises',
}: QrModalProps) {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);

  // Standard UPI URI format: upi://pay?pa=address&pn=name&am=amount&tn=note&cu=INR
  const upiUri = `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(
    upiName
  )}&am=${amount.toFixed(2)}&tn=${encodeURIComponent(`Inv ${invoiceNumber}`)}&cu=INR`;

  useEffect(() => {
    if (isOpen && amount > 0) {
      QRCode.toDataURL(upiUri, {
        width: 260,
        margin: 2,
        color: {
          dark: '#0f172a',
          light: '#ffffff',
        },
      })
        .then((url) => setQrDataUrl(url))
        .catch((err) => console.error(err));
    }
  }, [isOpen, upiUri, amount]);

  const handleCopyUPI = () => {
    navigator.clipboard.writeText(upiId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Instant UPI Payment QR"
      subtitle={`Scan to pay ${formatINR(amount)} for Invoice #${invoiceNumber}`}
      maxWidth="md"
    >
      <div className="flex flex-col items-center justify-center text-center space-y-4">
        {/* QR Display Card */}
        <div className="p-4 bg-gradient-to-b from-blue-50 to-slate-50 border-2 border-dashed border-blue-200 rounded-2xl shadow-inner">
          {qrDataUrl ? (
            <img src={qrDataUrl} alt="UPI QR Code" className="w-56 h-56 rounded-xl shadow-md bg-white p-2" />
          ) : (
            <div className="w-56 h-56 flex items-center justify-center text-slate-400">
              <QrCode className="w-12 h-12 animate-pulse" />
            </div>
          )}
        </div>

        {/* Amount Badge */}
        <div className="bg-blue-600 text-white px-5 py-2 rounded-xl shadow-md shadow-blue-600/30">
          <p className="text-xs font-medium text-blue-100 uppercase tracking-wide">Amount Payable</p>
          <p className="text-2xl font-black">{formatINR(amount)}</p>
        </div>

        {/* Supported UPI Apps */}
        <div className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-600">
          <p className="font-semibold text-slate-700 mb-1.5">Supported UPI Payment Apps:</p>
          <div className="flex items-center justify-center gap-4 text-[11px] font-medium text-slate-500">
            <span className="bg-white px-2 py-1 rounded shadow-sm border border-slate-200">Google Pay</span>
            <span className="bg-white px-2 py-1 rounded shadow-sm border border-slate-200">PhonePe</span>
            <span className="bg-white px-2 py-1 rounded shadow-sm border border-slate-200">Paytm</span>
            <span className="bg-white px-2 py-1 rounded shadow-sm border border-slate-200">BHIM</span>
          </div>
        </div>

        {/* UPI Details & Copy */}
        <div className="w-full flex items-center justify-between px-3 py-2 bg-slate-100 rounded-lg text-xs">
          <span className="font-mono text-slate-700 font-semibold">{upiId}</span>
          <button
            onClick={handleCopyUPI}
            className="flex items-center gap-1 text-blue-600 hover:text-blue-700 font-medium"
          >
            {copied ? (
              <>
                <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-emerald-600">Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy UPI</span>
              </>
            )}
          </button>
        </div>
      </div>
    </Modal>
  );
}
