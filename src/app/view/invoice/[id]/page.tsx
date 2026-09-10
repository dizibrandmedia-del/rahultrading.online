'use client';

import React, { useEffect, useState, use } from 'react';
import { useSearchParams } from 'next/navigation';
import { InvoiceA4Template } from '@/components/printing/InvoiceA4Template';
import { NonGstInvoiceTemplate } from '@/components/printing/NonGstInvoiceTemplate';
import { downloadInvoicePdf } from '@/lib/pdfGenerator';
import { Printer, Download, ArrowLeft, Loader2, FileCheck } from 'lucide-react';

const DEFAULT_BUSINESS = {
  name: 'RAHUL JEE TRADING COMPANY',
  legalName: 'RAHUL JEE TRADING COMPANY',
  state: 'Uttar Pradesh',
  stateCode: '09',
  gstin: '09DMCPG4193P1ZG',
  pan: 'DMCPG4193P',
  address: 'Allahabad Bank Road, Yusufpur, Mohammadabad, Dist- Ghazipur (U.P.) - 233227',
  phone: '8887754821',
  email: 'rahuljee1217@gmail.com',
  bankName: 'HDFC Bank Ltd',
  bankAccountNo: '50200088991122',
  bankIfsc: 'HDFC0001234',
  upiId: '8887754821@upi',
};

export default function PublicInvoiceViewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const invoiceId = resolvedParams.id;
  const searchParams = useSearchParams();
  const typeParam = searchParams?.get('type') || '';

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [invoice, setInvoice] = useState<any | null>(null);
  const [business, setBusiness] = useState<any>(DEFAULT_BUSINESS);
  const [isGst, setIsGst] = useState<boolean>(true);
  const [downloading, setDownloading] = useState<boolean>(false);

  useEffect(() => {
    // 1. Fetch business details
    fetch('/api/business')
      .then((res) => res.json())
      .then((data) => {
        if (data?.success && data?.business) {
          setBusiness(data.business);
        }
      })
      .catch((e) => console.error(e));

    // 2. Fetch invoice (try GST first or by typeParam)
    async function loadInvoice() {
      try {
        setLoading(true);
        setError(null);

        if (typeParam === 'nongst') {
          const res = await fetch(`/api/non-gst-invoices/${invoiceId}`);
          const data = await res.json();
          if (data.success && data.invoice) {
            setInvoice(data.invoice);
            setIsGst(false);
            return;
          }
        }

        // Try GST Sale first
        const saleRes = await fetch(`/api/sales/${invoiceId}`);
        const saleData = await saleRes.json();
        if (saleData.success && saleData.sale) {
          setInvoice(saleData.sale);
          setIsGst(true);
          return;
        }

        // Fallback to Non-GST invoice
        const nonGstRes = await fetch(`/api/non-gst-invoices/${invoiceId}`);
        const nonGstData = await nonGstRes.json();
        if (nonGstData.success && nonGstData.invoice) {
          setInvoice(nonGstData.invoice);
          setIsGst(false);
          return;
        }

        setError('Invoice could not be found or has expired.');
      } catch (err: any) {
        console.error('Error loading invoice:', err);
        setError(err.message || 'Failed to load invoice');
      } finally {
        setLoading(false);
      }
    }

    if (invoiceId) {
      loadInvoice();
    }
  }, [invoiceId, typeParam]);

  const handleDownload = async () => {
    if (!invoice) return;
    try {
      setDownloading(true);
      await downloadInvoicePdf(invoice, business, isGst);
    } catch (err: any) {
      alert('Download error: ' + err.message);
    } finally {
      setDownloading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-center p-4">
        <Loader2 className="w-8 h-8 animate-spin text-[#0e7490] mb-3" />
        <p className="text-sm font-semibold text-slate-700">Loading Official Invoice...</p>
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-center p-4 text-center">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 max-w-md w-full">
          <FileCheck className="w-12 h-12 text-slate-400 mx-auto mb-3" />
          <h2 className="text-lg font-bold text-slate-800 mb-1">Invoice Not Found</h2>
          <p className="text-xs text-slate-500 mb-4">{error || 'This invoice may have been removed or the link is invalid.'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 py-6 px-3 sm:px-6">
      {/* Top Floating Action Bar */}
      <div className="max-w-[794px] mx-auto mb-4 bg-white p-3 sm:p-4 rounded-2xl shadow-sm border border-slate-200 flex flex-wrap items-center justify-between gap-3 no-print">
        <div>
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
            {isGst ? 'GST Tax Invoice' : 'Non-GST Invoice'}
          </span>
          <h2 className="text-sm sm:text-base font-black text-slate-900">
            #{invoice.invoiceNumber}{' '}
            <span className="text-slate-400 font-normal text-xs">• {invoice.partyName}</span>
          </h2>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold shadow-sm transition-all active:scale-95 cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Print</span>
          </button>
          <button
            type="button"
            onClick={handleDownload}
            disabled={downloading}
            className="flex items-center gap-1.5 px-4 py-1.5 bg-[#0e7490] hover:bg-[#0c627a] text-white rounded-xl text-xs font-bold shadow-sm transition-all active:scale-95 cursor-pointer"
          >
            {downloading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Download className="w-4 h-4" />
            )}
            <span>{downloading ? 'Downloading...' : 'Download PDF'}</span>
          </button>
        </div>
      </div>

      {/* Render Invoice Template */}
      <div className="overflow-x-auto flex justify-center">
        {isGst ? (
          <InvoiceA4Template business={business} sale={invoice} />
        ) : (
          <NonGstInvoiceTemplate business={business} invoice={invoice} />
        )}
      </div>
    </div>
  );
}
