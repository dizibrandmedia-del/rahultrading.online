'use client';

import React, { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import {
  Database,
  Download,
  CheckCircle,
  CheckCircle2,
  FileSpreadsheet,
  ShieldCheck,
  HardDrive,
  FolderArchive,
  Users,
  Package,
  FileText,
  Clock,
  AlertTriangle,
  AlertOctagon,
  AlertCircle,
  Server,
  Trash2,
  Loader2,
} from 'lucide-react';

export default function BackupPage() {
  const [downloadingDb, setDownloadingDb] = useState(false);
  const [downloadingJson, setDownloadingJson] = useState(false);
  const [downloadingCsv, setDownloadingCsv] = useState<string | null>(null);
  const [statusMsg, setStatusMsg] = useState('');

  // Reset Test Data State
  const [resetModalOpen, setResetModalOpen] = useState(false);
  const [confirmInput, setConfirmInput] = useState('');
  const [resetting, setResetting] = useState(false);
  const [resetResult, setResetResult] = useState<any | null>(null);
  const [resetError, setResetError] = useState<string | null>(null);

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

  const handleResetDatabase = async () => {
    const cleanConfirm = confirmInput.trim().toUpperCase();
    if (cleanConfirm !== 'RESET') {
      setResetError('Please type "RESET" to confirm.');
      return;
    }
    setResetError(null);
    setResetting(true);

    try {
      const res = await fetch('/api/backup/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirmText: 'RESET' }),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to reset database');
      }

      setResetResult(data.details);
      setStatusMsg('System data reset successfully! All development records cleared. Dashboard now starts from clean zero state.');
    } catch (e: any) {
      setResetError(e.message || 'Error executing reset');
    } finally {
      setResetting(false);
    }
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
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between space-y-4 hover:border-emerald-500 transition-colors">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 rounded-xl border border-emerald-200 dark:border-emerald-800">
                <FolderArchive className="w-6 h-6" />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 rounded-full">
                Universal Format
              </span>
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">Full System JSON Snapshot</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                Structured human-readable export of Business Details, GST Invoices, Non-GST Invoices, Purchases, Inventory, Parties, and Accounting Journals.
              </p>
            </div>
            <div className="text-[11px] text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl space-y-1">
              <div className="flex items-center gap-1.5 font-semibold text-slate-700 dark:text-slate-300">
                <FileText className="w-3.5 h-3.5 text-emerald-600" />
                <span>Format: Complete JSON Archive</span>
              </div>
              <p>Ideal for migrating to PostgreSQL, cloud archives, or custom reporting.</p>
            </div>
          </div>

          <button
            onClick={handleDownloadJson}
            disabled={downloadingJson}
            className="w-full flex items-center justify-center gap-2 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-600/20 transition-all active:scale-95 disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            <span>{downloadingJson ? 'Exporting JSON...' : 'Export Full JSON Snapshot'}</span>
          </button>
        </div>
      </div>

      {/* CSV / Excel Spreadsheets */}
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

      {/* Danger Zone: Final Test Data Cleanup / Reset */}
      <div className="bg-rose-500/5 dark:bg-rose-950/20 p-6 rounded-3xl border-2 border-rose-500/30 dark:border-rose-900/50 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2.5 bg-rose-500/10 text-rose-600 dark:text-rose-400 rounded-xl shrink-0 mt-0.5 border border-rose-500/20">
              <AlertOctagon className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <span>Danger Zone: Clear Test Data / Production Reset</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-500/20 text-rose-700 dark:text-rose-300">
                  Admin Action
                </span>
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed max-w-2xl">
                Wipe all development/testing invoices (GST & Non-GST), purchase bills, stock movements, products, test parties, and expenses. 
                <strong className="text-slate-900 dark:text-white font-semibold"> Preserves your Business master profile, User logins, and Chart of Accounts structure.</strong>
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              setResetModalOpen(true);
              setConfirmInput('');
              setResetError(null);
              setResetResult(null);
            }}
            className="flex items-center justify-center gap-2 px-5 py-3 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-lg shadow-rose-600/30 transition-all active:scale-95 shrink-0"
          >
            <Trash2 className="w-4 h-4" />
            <span>Reset Test Data</span>
          </button>
        </div>

        {/* Protection Note */}
        <div className="p-3 bg-white/60 dark:bg-slate-900/60 rounded-xl border border-rose-500/20 text-[11px] text-slate-600 dark:text-slate-400 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>
            <strong>Safety Guaranteed:</strong> After reset, all dashboard KPIs will show <strong>₹0.00</strong> and the database will never automatically regenerate dummy test data.
          </span>
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

      {/* Reset Confirmation Modal */}
      <Modal
        isOpen={resetModalOpen}
        onClose={() => {
          if (!resetting) {
            setResetModalOpen(false);
            setConfirmInput('');
            setResetError(null);
          }
        }}
        title="Confirm Safe System Reset"
        subtitle="This action will wipe all test transactions and prepare for live business usage"
        maxWidth="md"
      >
        <div className="space-y-4 text-xs">
          {resetError && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-600 dark:text-rose-400 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{resetError}</span>
            </div>
          )}

          {resetResult ? (
            <div className="space-y-3 p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl">
              <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-300 font-bold text-sm">
                <CheckCircle2 className="w-5 h-5" />
                <span>Reset Completed Successfully!</span>
              </div>
              <p className="text-slate-600 dark:text-slate-300">
                The database has been brought to a clean production state. Summary of purged test items:
              </p>
              <div className="grid grid-cols-2 gap-2 text-[11px] font-mono text-slate-700 dark:text-slate-200">
                <div className="p-2 bg-white/70 dark:bg-slate-800/70 rounded-lg">GST Sales: {resetResult.sales}</div>
                <div className="p-2 bg-white/70 dark:bg-slate-800/70 rounded-lg">Non-GST Invoices: {resetResult.nonGst}</div>
                <div className="p-2 bg-white/70 dark:bg-slate-800/70 rounded-lg">Purchases: {resetResult.purchases}</div>
                <div className="p-2 bg-white/70 dark:bg-slate-800/70 rounded-lg">Products: {resetResult.products}</div>
                <div className="p-2 bg-white/70 dark:bg-slate-800/70 rounded-lg">Parties: {resetResult.parties}</div>
                <div className="p-2 bg-white/70 dark:bg-slate-800/70 rounded-lg">Ledger Entries: {resetResult.ledgers}</div>
              </div>
              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setResetModalOpen(false);
                    window.location.href = '/app';
                  }}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs"
                >
                  Go to Clean Dashboard
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="p-3.5 bg-amber-500/10 border border-amber-500/30 rounded-2xl text-amber-800 dark:text-amber-300 space-y-2">
                <p className="font-bold flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>Important: Download Backup First</span>
                </p>
                <p className="leading-relaxed">
                  Before resetting, ensure you have clicked <strong>"Download Live Database (.db)"</strong> above so you have a copy of existing test records if needed.
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block font-bold text-slate-800 dark:text-slate-200">
                    To confirm, type <span className="font-mono text-rose-600 dark:text-rose-400 font-black">RESET</span> in the box below:
                  </label>
                  <button
                    type="button"
                    onClick={() => setConfirmInput('RESET')}
                    className="text-[11px] font-semibold text-rose-600 dark:text-rose-400 hover:underline"
                  >
                    Auto-Fill "RESET"
                  </button>
                </div>
                <input
                  type="text"
                  placeholder="RESET"
                  value={confirmInput}
                  onChange={(e) => setConfirmInput(e.target.value.toUpperCase())}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && confirmInput.trim().toUpperCase() === 'RESET' && !resetting) {
                      e.preventDefault();
                      handleResetDatabase();
                    }
                  }}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl font-mono text-center font-bold tracking-widest text-slate-900 dark:text-white uppercase focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  disabled={resetting}
                  onClick={() => setResetModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={resetting || confirmInput.trim().toUpperCase() !== 'RESET'}
                  onClick={handleResetDatabase}
                  className="flex items-center gap-2 px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold shadow-md shadow-rose-600/30 active:scale-95 disabled:opacity-50 transition-all cursor-pointer disabled:cursor-not-allowed"
                >
                  {resetting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                  <span>{resetting ? 'Resetting Database...' : 'Permanently Reset'}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}
