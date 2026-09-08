'use client';

import React, { useState } from 'react';
import {
  Database,
  Download,
  CheckCircle,
  FileSpreadsheet,
  ShieldCheck,
  HardDrive,
  FolderArchive,
  Users,
  Package,
  FileText,
  Clock,
  AlertTriangle,
  Server
} from 'lucide-react';

export default function BackupPage() {
  const [downloadingDb, setDownloadingDb] = useState(false);
  const [downloadingJson, setDownloadingJson] = useState(false);
  const [downloadingCsv, setDownloadingCsv] = useState<string | null>(null);
  const [statusMsg, setStatusMsg] = useState('');

  // 1. Download Direct Live SQLite Database File (.db)
  const handleDownloadDatabase = async () => {
    setDownloadingDb(true);
    setStatusMsg('');
    try {
      const res = await fetch('/api/backup/database');
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to download database');
      }
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const dateStr = new Date().toISOString().split('T')[0];
      a.download = `RJTC_Live_Database_${dateStr}.db`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      setStatusMsg('Live SQLite Database (.db) downloaded successfully! Keep this file safe on your computer or Google Drive.');
    } catch (e: any) {
      alert('Error downloading database: ' + e.message);
    } finally {
      setDownloadingDb(false);
    }
  };

  // 2. Download Complete System JSON Snapshot
  const handleDownloadJson = async () => {
    setDownloadingJson(true);
    setStatusMsg('');
    try {
      const res = await fetch('/api/backup/export');
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to export backup');
      }
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const dateStr = new Date().toISOString().split('T')[0];
      a.download = `RJTC_Full_Backup_${dateStr}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      setStatusMsg('Full JSON Snapshot (GST, Non-GST, Purchases, Stock, Parties) downloaded successfully!');
    } catch (e: any) {
      alert('Error exporting JSON: ' + e.message);
    } finally {
      setDownloadingJson(false);
    }
  };

  // 3. Export CSV Spreadsheets (Sales, Purchases, Inventory, Parties)
  const handleExportCsv = async (type: 'sales' | 'purchases' | 'products' | 'parties') => {
    setDownloadingCsv(type);
    setStatusMsg('');
    try {
      const dateStr = new Date().toISOString().split('T')[0];

      if (type === 'sales') {
        const [gstRes, nonGstRes] = await Promise.all([
          fetch('/api/sales').then(r => r.json()),
          fetch('/api/non-gst-invoices').then(r => r.json())
        ]);
        const gstSales = gstRes.sales || [];
        const nonGstSales = nonGstRes.invoices || [];

        let csv = 'Invoice Type,Invoice No,Date,Customer Name,Phone,GSTIN,Payment Mode,Taxable / Subtotal,Tax Amt,Grand Total,Paid,Balance,Status\n';
        
        gstSales.forEach((s: any) => {
          csv += `GST Tax Invoice,"${s.invoiceNumber}","${s.invoiceDate?.split('T')[0]}","${s.partyName || ''}","${s.partyPhone || ''}","${s.partyGstin || ''}","${s.paymentMode}",${s.taxableAmount || 0},${s.totalTax || 0},${s.grandTotal || 0},${s.paidAmount || 0},${s.balanceAmount || 0},"${s.paymentStatus}"\n`;
        });
        nonGstSales.forEach((s: any) => {
          csv += `Non-GST Invoice,"${s.invoiceNumber}","${s.invoiceDate?.split('T')[0]}","${s.partyName || ''}","${s.partyPhone || ''}","-","${s.paymentMode}",${s.subTotal || 0},0,${s.grandTotal || 0},${s.paidAmount || 0},${s.balanceAmount || 0},"${s.paymentStatus}"\n`;
        });

        downloadCsvFile(csv, `RJTC_Sales_Register_${dateStr}.csv`);
        setStatusMsg('Sales Register CSV exported successfully!');
      } else if (type === 'purchases') {
        const res = await fetch('/api/purchases').then(r => r.json());
        const purchases = res.purchases || [];

        let csv = 'Bill Number,Date,Vendor / Supplier,Phone,GSTIN,Payment Mode,Taxable,GST Tax,Grand Total,Paid,Balance,Status\n';
        purchases.forEach((p: any) => {
          const dateStr = (p.billDate || p.createdAt || '').split('T')[0];
          csv += `"${p.billNumber}","${dateStr}","${p.partyName || ''}","${p.partyPhone || ''}","${p.partyGstin || ''}","${p.paymentMode}",${p.taxableAmount || 0},${p.totalTax || 0},${p.grandTotal || 0},${p.paidAmount || 0},${p.balanceAmount || 0},"${p.paymentStatus}"\n`;
        });

        downloadCsvFile(csv, `RJTC_Purchase_Bills_${dateStr}.csv`);
        setStatusMsg('Purchase Inward Bills CSV exported successfully!');
      } else if (type === 'products') {
        const res = await fetch('/api/products').then(r => r.json());
        const products = res.products || [];

        let csv = 'Product Name,HSN Code,Category,Current Stock,Unit,Selling Price,Purchase Price,GST %\n';
        products.forEach((p: any) => {
          csv += `"${p.name}","${p.hsnCode || ''}","${p.category?.name || 'General'}",${p.currentStock || 0},"${p.unit?.shortName || 'PCS'}",${p.sellingPrice || 0},${p.purchasePrice || 0},${p.gstRate || 0}%\n`;
        });

        downloadCsvFile(csv, `RJTC_Inventory_Stock_${dateStr}.csv`);
        setStatusMsg('Inventory Stock Register CSV exported successfully!');
      } else if (type === 'parties') {
        const res = await fetch('/api/parties').then(r => r.json());
        const parties = res.parties || [];

        let csv = 'Party Name,Type,Phone,GSTIN,State,Address,Current Balance (Due)\n';
        parties.forEach((pt: any) => {
          csv += `"${pt.name}","${pt.type}","${pt.phone || ''}","${pt.gstin || ''}","${pt.state || ''}","${pt.address || ''}",${pt.currentBalance || 0}\n`;
        });

        downloadCsvFile(csv, `RJTC_Customers_Vendors_${dateStr}.csv`);
        setStatusMsg('Customer & Vendor Directory CSV exported successfully!');
      }
    } catch (e: any) {
      alert('Error exporting CSV: ' + e.message);
    } finally {
      setDownloadingCsv(null);
    }
  };

  const downloadCsvFile = (csvContent: string, fileName: string) => {
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-2.5">
              <Database className="w-6 h-6 text-[#0e7490]" />
              <span>Backup & Data Export Center</span>
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Live SQLite database backup, accounting registers, inventory sheets, aur full system data download
            </p>
          </div>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold w-fit">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Persistent Disk Storage Active</span>
          </div>
        </div>
      </div>

      {statusMsg && (
        <div className="p-4 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 rounded-2xl flex items-center gap-3 text-xs font-bold text-emerald-800 dark:text-emerald-200 animate-in fade-in">
          <CheckCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span>{statusMsg}</span>
        </div>
      )}

      {/* Main Backup Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Card 1: Direct SQLite Database Download */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between space-y-4">
          <div className="space-y-2.5">
            <div className="p-3 bg-cyan-50 dark:bg-cyan-950/60 text-[#0e7490] rounded-xl w-fit border border-cyan-200 dark:border-cyan-800">
              <HardDrive className="w-6 h-6" />
            </div>
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Live SQLite Database (.db File)</h3>
              <span className="px-2 py-0.5 bg-cyan-100 text-[#0e7490] rounded text-[10px] font-black uppercase">Primary Backup</span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Downloads the complete raw binary database (<code className="bg-slate-100 px-1 py-0.5 rounded text-slate-700 font-mono">dev.db</code>) containing all your tables, invoices, parties, stock ledger, and business settings.
            </p>
            <div className="text-[11px] text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/50 p-2.5 rounded-xl border border-slate-200/80 dark:border-slate-700/60">
              💡 <strong>Best for safety:</strong> Har hafte ya mahine me ek baar ye file download karke apne laptop ya Google Drive par save kar lijiye.
            </div>
          </div>

          <button
            onClick={handleDownloadDatabase}
            disabled={downloadingDb}
            className="w-full flex items-center justify-center gap-2 py-2.5 bg-[#0e7490] hover:bg-[#085a70] text-white rounded-xl text-xs font-bold shadow-md shadow-cyan-900/20 transition-all disabled:opacity-50 active:scale-95"
          >
            <Download className="w-4 h-4" />
            <span>{downloadingDb ? 'Downloading Database...' : 'Download Live Database (.db)'}</span>
          </button>
        </div>

        {/* Card 2: Complete JSON Data Snapshot */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between space-y-4">
          <div className="space-y-2.5">
            <div className="p-3 bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 rounded-xl w-fit border border-blue-200 dark:border-blue-800">
              <FolderArchive className="w-6 h-6" />
            </div>
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">All-in-One JSON Data Snapshot</h3>
              <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded text-[10px] font-black uppercase">Structured</span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Downloads a structured JSON file containing all GST Sales, Non-GST Bills, Purchase Inwards, Inventory Products, Parties, and Ledgers.
            </p>
            <div className="text-[11px] text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/50 p-2.5 rounded-xl border border-slate-200/80 dark:border-slate-700/60">
              💡 <strong>Human readable format:</strong> Easily importable or viewable in any text editor, JSON viewer, or accounting migration tool.
            </div>
          </div>

          <button
            onClick={handleDownloadJson}
            disabled={downloadingJson}
            className="w-full flex items-center justify-center gap-2 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-600/30 transition-all disabled:opacity-50 active:scale-95"
          >
            <Download className="w-4 h-4" />
            <span>{downloadingJson ? 'Exporting JSON...' : 'Download Full JSON Backup'}</span>
          </button>
        </div>
      </div>

      {/* CSV / Excel Accounting Exports */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 rounded-lg border border-emerald-200 dark:border-emerald-800">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Excel / CSV Accounting Worksheets</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Directly compatible with Microsoft Excel, Google Sheets, and CA software</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
          {/* Sales CSV */}
          <button
            onClick={() => handleExportCsv('sales')}
            disabled={downloadingCsv === 'sales'}
            className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-[#0e7490] hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all text-left group"
          >
            <div className="flex items-center justify-between mb-1.5">
              <FileText className="w-4 h-4 text-[#0e7490]" />
              <Download className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#0e7490] transition-colors" />
            </div>
            <p className="text-xs font-bold text-slate-900 dark:text-slate-100">Sales Register</p>
            <p className="text-[10px] text-slate-500 mt-0.5">GST + Non-GST Invoices</p>
          </button>

          {/* Purchases CSV */}
          <button
            onClick={() => handleExportCsv('purchases')}
            disabled={downloadingCsv === 'purchases'}
            className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-emerald-500 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all text-left group"
          >
            <div className="flex items-center justify-between mb-1.5">
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              <Download className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-600 transition-colors" />
            </div>
            <p className="text-xs font-bold text-slate-900 dark:text-slate-100">Purchase Bills</p>
            <p className="text-[10px] text-slate-500 mt-0.5">Vendor inward vouchers</p>
          </button>

          {/* Inventory Stock CSV */}
          <button
            onClick={() => handleExportCsv('products')}
            disabled={downloadingCsv === 'products'}
            className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-blue-500 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all text-left group"
          >
            <div className="flex items-center justify-between mb-1.5">
              <Package className="w-4 h-4 text-blue-600" />
              <Download className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-600 transition-colors" />
            </div>
            <p className="text-xs font-bold text-slate-900 dark:text-slate-100">Inventory Stock</p>
            <p className="text-[10px] text-slate-500 mt-0.5">Items, rates & stock levels</p>
          </button>

          {/* Parties CSV */}
          <button
            onClick={() => handleExportCsv('parties')}
            disabled={downloadingCsv === 'parties'}
            className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-purple-500 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all text-left group"
          >
            <div className="flex items-center justify-between mb-1.5">
              <Users className="w-4 h-4 text-purple-600" />
              <Download className="w-3.5 h-3.5 text-slate-400 group-hover:text-purple-600 transition-colors" />
            </div>
            <p className="text-xs font-bold text-slate-900 dark:text-slate-100">Customers & Vendors</p>
            <p className="text-[10px] text-slate-500 mt-0.5">Contacts & due balance list</p>
          </button>
        </div>
      </div>

      {/* Data Persistence & Protection Guide */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="bg-slate-50 dark:bg-slate-800/50 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2">
          <div className="flex items-center gap-2 text-slate-800 dark:text-slate-200 font-bold text-xs">
            <Server className="w-4 h-4 text-[#0e7490]" />
            <span>Kaha Par Save Hota Hai Data? (Server File Path)</span>
          </div>
          <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
            Aapka sara live data Hostinger Cloud Server par permanent SSD disk me <code className="bg-white dark:bg-slate-900 px-1.5 py-0.5 rounded border border-slate-300 dark:border-slate-700 font-mono text-slate-800 dark:text-slate-200">dev.db</code> file ke andar realtime me save hota hai. Har naya product, invoice, party aur payment turant commit hoti hai.
          </p>
        </div>

        <div className="bg-slate-50 dark:bg-slate-800/50 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2">
          <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-bold text-xs">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Kya Data Apne Aap Remove / Reset Hoga?</span>
          </div>
          <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
            <strong>Bilkul nahi!</strong> SQLite persistent relational database hai. Server restart hone se ya logout karne se data delete nahi hota. System me koi auto-reset script nahi hai jo data ko delete kare.
          </p>
        </div>
      </div>
    </div>
  );
}
