'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { formatINR } from '@/lib/currency';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { ItemSearchInput } from '@/components/billing/ItemSearchInput';
import { calculateInvoiceGst } from '@/lib/gst-engine';
import { InvoiceItemDraft, INDIAN_STATES } from '@/types';
import { InvoiceA4Template } from '@/components/printing/InvoiceA4Template';
import { ThermalReceiptTemplate } from '@/components/printing/ThermalReceiptTemplate';
import { QrModal } from '@/components/billing/QrModal';
import { shareInvoiceWithPdf, downloadInvoicePdf } from '@/lib/pdfGenerator';
import {
  Receipt,
  Plus,
  Search,
  Printer,
  QrCode,
  Share2,
  FileText,
  Eye,
  Copy,
  Edit,
  Trash2,
  Download,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Save,
} from 'lucide-react';

export default function SalesPage() {
  const router = useRouter();

  const [sales, setSales] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [business, setBusiness] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [sharingSaleId, setSharingSaleId] = useState<string | null>(null);
  const [downloadingSaleId, setDownloadingSaleId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // New Sale In-Page Modal State
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [savingNew, setSavingNew] = useState(false);
  const [newPartyId, setNewPartyId] = useState('');
  const [newPartyName, setNewPartyName] = useState('Walk-in Cash Customer');
  const [newPartyPhone, setNewPartyPhone] = useState('');
  const [newPartyGstin, setNewPartyGstin] = useState('');
  const [newPartyState, setNewPartyState] = useState('Delhi');
  const [newPartyStateCode, setNewPartyStateCode] = useState('07');
  const [newPaymentMode, setNewPaymentMode] = useState('CREDIT');

  const defaultDraftItem: InvoiceItemDraft = {
    productName: '',
    hsnCode: '',
    quantity: 1,
    unit: 'PCS',
    unitPrice: 0,
    discountPercent: 0,
    discountAmount: 0,
    taxableAmount: 0,
    gstRate: 18,
    cgstRate: 9,
    cgstAmount: 0,
    sgstRate: 9,
    sgstAmount: 0,
    igstRate: 0,
    igstAmount: 0,
    totalAmount: 0,
  };

  const [newItems, setNewItems] = useState<InvoiceItemDraft[]>([{ ...defaultDraftItem }]);

  // Edit Sale In-Page Modal State
  const [editSale, setEditSale] = useState<any | null>(null);
  const [editPartyId, setEditPartyId] = useState('');
  const [editPartyName, setEditPartyName] = useState('');
  const [editPartyPhone, setEditPartyPhone] = useState('');
  const [editPartyGstin, setEditPartyGstin] = useState('');
  const [editPartyState, setEditPartyState] = useState('Delhi');
  const [editPartyStateCode, setEditPartyStateCode] = useState('07');
  const [editPaymentMode, setEditPaymentMode] = useState('CASH');
  const [editNotes, setEditNotes] = useState('');
  const [editItems, setEditItems] = useState<InvoiceItemDraft[]>([]);
  const [updating, setUpdating] = useState(false);

  // Modals view & delete state
  const [selectedSaleForA4, setSelectedSaleForA4] = useState<any>(null);
  const [selectedSaleForThermal, setSelectedSaleForThermal] = useState<any>(null);
  const [selectedSaleForQr, setSelectedSaleForQr] = useState<any>(null);
  const [deleteSale, setDeleteSale] = useState<any | null>(null);
  const [deleting, setDeleting] = useState(false);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const fetchSalesData = async () => {
    try {
      setLoading(true);
      const [sRes, cRes, prodRes, bRes] = await Promise.all([
        fetch('/api/sales').then((r) => r.json()).catch(() => ({ sales: [] })),
        fetch('/api/parties?type=CUSTOMER').then((r) => r.json()).catch(() => ({ parties: [] })),
        fetch('/api/products').then((r) => r.json()).catch(() => ({ products: [] })),
        fetch('/api/business').then((r) => r.json()).catch(() => ({ business: null })),
      ]);

      if (sRes.success && sRes.sales) setSales(sRes.sales);
      if (cRes.success && cRes.parties) setCustomers(cRes.parties);
      if (prodRes.success && prodRes.products) setProducts(prodRes.products);
      if (bRes.success && bRes.business) {
        setBusiness(bRes.business);
        if (bRes.business.state) setNewPartyState(bRes.business.state);
        if (bRes.business.stateCode) setNewPartyStateCode(bRes.business.stateCode);
      }
    } catch (err) {
      console.error('Error loading sales data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSalesData();
  }, []);

  // Handle Customer Selection
  const handleCustomerSelect = (cId: string, isEdit = false) => {
    const cust = customers.find((c) => c.id === cId);
    if (isEdit) {
      setEditPartyId(cId);
      if (cust) {
        setEditPartyName(cust.name);
        setEditPartyGstin(cust.gstin || '');
        setEditPartyPhone(cust.phone || '');
        setEditPartyState(cust.state || business?.state || 'Delhi');
        setEditPartyStateCode(cust.stateCode || business?.stateCode || '07');
      }
    } else {
      setNewPartyId(cId);
      if (cust) {
        setNewPartyName(cust.name);
        setNewPartyGstin(cust.gstin || '');
        setNewPartyPhone(cust.phone || '');
        setNewPartyState(cust.state || business?.state || 'Delhi');
        setNewPartyStateCode(cust.stateCode || business?.stateCode || '07');
      }
    }
  };

  // Handle Product Selection
  const handleProductSelect = (index: number, productOrId: any, isEdit = false) => {
    if (!productOrId || productOrId === '') return;
    const prod = typeof productOrId === 'object' ? productOrId : products.find((p) => p.id === productOrId);
    if (!prod) return;

    if (isEdit) {
      const newArr = [...editItems];
      newArr[index] = {
        ...newArr[index],
        productId: prod.id,
        productName: prod.name,
        hsnCode: prod.hsnCode || '',
        unitPrice: prod.salePrice || 0,
        gstRate: prod.gstRate || 18,
      };
      setEditItems(newArr);
    } else {
      const newArr = [...newItems];
      newArr[index] = {
        ...newArr[index],
        productId: prod.id,
        productName: prod.name,
        hsnCode: prod.hsnCode || '',
        unitPrice: prod.salePrice || 0,
        gstRate: prod.gstRate || 18,
      };
      setNewItems(newArr);
    }
  };

  const updateItem = (index: number, field: keyof InvoiceItemDraft, val: any, isEdit = false) => {
    if (isEdit) {
      const newArr = [...editItems];
      newArr[index] = { ...newArr[index], [field]: val };
      setEditItems(newArr);
    } else {
      const newArr = [...newItems];
      newArr[index] = { ...newArr[index], [field]: val };
      setNewItems(newArr);
    }
  };

  const addItem = (isEdit = false) => {
    if (isEdit) {
      setEditItems([...editItems, { ...defaultDraftItem }]);
    } else {
      setNewItems([...newItems, { ...defaultDraftItem }]);
    }
  };

  const removeItem = (index: number, isEdit = false) => {
    if (isEdit) {
      if (editItems.length <= 1) return;
      setEditItems(editItems.filter((_, i) => i !== index));
    } else {
      if (newItems.length <= 1) return;
      setNewItems(newItems.filter((_, i) => i !== index));
    }
  };

  // Keyboard shortcut listener: F2 to Add Item
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F2') {
        if (isNewModalOpen) {
          e.preventDefault();
          addItem(false);
        } else if (editSale) {
          e.preventDefault();
          addItem(true);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isNewModalOpen, editSale, newItems, editItems]);

  // Calculations for New Sale
  const newGstSummary = calculateInvoiceGst(
    business?.stateCode || '07',
    newPartyStateCode || business?.stateCode || '07',
    newItems.map((it) => ({
      productId: it.productId,
      productName: it.productName,
      hsnCode: it.hsnCode,
      quantity: it.quantity,
      unitPrice: it.unitPrice,
      discountPercent: 0,
      gstRate: it.gstRate,
      isTaxInclusive: false,
    })) as any
  );

  // Calculations for Edit Sale
  const editGstSummary = calculateInvoiceGst(
    business?.stateCode || '07',
    editPartyStateCode || business?.stateCode || '07',
    editItems.map((it) => ({
      productId: it.productId,
      productName: it.productName,
      hsnCode: it.hsnCode,
      quantity: it.quantity,
      unitPrice: it.unitPrice,
      discountPercent: 0,
      gstRate: it.gstRate,
      isTaxInclusive: false,
    })) as any
  );

  // Handle Save New Sale
  const handleSaveNewSale = async (e: React.FormEvent) => {
    e.preventDefault();
    const validItems = newGstSummary.items.filter((it) => it.productName.trim() && it.quantity > 0);
    if (validItems.length === 0) {
      alert('Please add valid products to invoice');
      return;
    }

    try {
      setSavingNew(true);
      const res = await fetch('/api/sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          partyId: newPartyId || null,
          partyName: newPartyName || 'Walk-in Cash Customer',
          partyPhone: newPartyPhone || null,
          partyGstin: newPartyGstin || null,
          partyState: newPartyState,
          paymentMode: newPaymentMode,
          paidAmount: newPaymentMode === 'CREDIT' || newPaymentMode === 'UNPAID' ? 0 : newGstSummary.grandTotal,
          items: validItems,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setIsNewModalOpen(false);
        showToast('Tax invoice generated and stock updated successfully!');
        // Reset
        setNewPartyId('');
        setNewPartyName('Walk-in Cash Customer');
        setNewPartyPhone('');
        setNewPartyGstin('');
        setNewPaymentMode('CREDIT');
        setNewItems([{ ...defaultDraftItem }]);
        fetchSalesData();
      } else {
        alert('Error: ' + data.error);
      }
    } catch (err: any) {
      alert('Error: ' + err.message);
    } finally {
      setSavingNew(false);
    }
  };

  // Open Edit Modal
  const handleOpenEdit = (sale: any) => {
    setEditSale(sale);
    setEditPartyId(sale.partyId || '');
    setEditPartyName(sale.partyName || '');
    setEditPartyPhone(sale.partyPhone || '');
    setEditPartyGstin(sale.partyGstin || '');
    setEditPartyState(sale.partyState || 'Delhi');
    if (sale.partyGstin && sale.partyGstin.length >= 2) {
      setEditPartyStateCode(sale.partyGstin.substring(0, 2));
    } else {
      const st = INDIAN_STATES.find((item) => item.name === sale.partyState);
      setEditPartyStateCode(st ? st.code : '07');
    }
    setEditPaymentMode(sale.paymentMode || 'CASH');
    setEditNotes(sale.notes || '');

    const mappedItems: InvoiceItemDraft[] = (sale.items || []).map((it: any) => ({
      productId: it.productId || undefined,
      productName: it.productName || '',
      hsnCode: it.hsnCode || '',
      quantity: Number(it.quantity) || 1,
      unit: it.unit || 'PCS',
      unitPrice: Number(it.unitPrice) || 0,
      discountPercent: Number(it.discountPercent) || 0,
      discountAmount: Number(it.discountAmount) || 0,
      taxableAmount: Number(it.taxableAmount) || 0,
      gstRate: Number(it.gstRate) || 18,
      cgstRate: Number(it.cgstRate) || 9,
      cgstAmount: Number(it.cgstAmount) || 0,
      sgstRate: Number(it.sgstRate) || 9,
      sgstAmount: Number(it.sgstAmount) || 0,
      igstRate: Number(it.igstRate) || 0,
      igstAmount: Number(it.igstAmount) || 0,
      totalAmount: Number(it.totalAmount) || 0,
    }));

    setEditItems(mappedItems.length > 0 ? mappedItems : [{ ...defaultDraftItem }]);
  };

  // Handle Update Sale
  const handleUpdateSale = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editSale) return;

    const validItems = editGstSummary.items.filter((it) => it.productName.trim() && it.quantity > 0);
    if (validItems.length === 0) {
      alert('Please add valid products');
      return;
    }

    try {
      setUpdating(true);
      const res = await fetch(`/api/sales/${editSale.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          partyId: editPartyId || null,
          partyName: editPartyName,
          partyPhone: editPartyPhone,
          partyGstin: editPartyGstin,
          partyState: editPartyState,
          partyStateCode: editPartyStateCode,
          paymentMode: editPaymentMode,
          paidAmount: editPaymentMode === 'CREDIT' || editPaymentMode === 'UNPAID' ? 0 : editGstSummary.grandTotal,
          notes: editNotes,
          items: validItems,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setEditSale(null);
        showToast(`Tax invoice #${editSale.invoiceNumber} updated successfully!`);
        fetchSalesData();
      } else {
        alert('Error: ' + data.error);
      }
    } catch (err: any) {
      alert('Error: ' + err.message);
    } finally {
      setUpdating(false);
    }
  };

  // Direct Print
  const handlePrint = () => {
    const prev = document.title;
    document.title = ' ';
    window.print();
    setTimeout(() => {
      document.title = prev;
    }, 1000);
  };

  // WhatsApp Share with Attached PDF
  const handleWhatsAppShare = async (sale: any) => {
    try {
      setSharingSaleId(sale.id);
      const partyFromList = customers.find(
        (c: any) =>
          (sale.partyId && c.id === sale.partyId) ||
          (sale.partyName && c.name?.trim().toLowerCase() === sale.partyName?.trim().toLowerCase())
      );
      const enrichedSale = {
        ...sale,
        partyPhone:
          sale.partyPhone ||
          sale.party?.phone ||
          sale.party?.mobile ||
          partyFromList?.phone ||
          partyFromList?.mobile ||
          '',
      };
      await shareInvoiceWithPdf(enrichedSale, business, true, (msg) => showToast(msg));
    } catch (err: any) {
      console.error('Error sharing invoice:', err);
      alert('Failed to generate or share invoice: ' + err.message);
    } finally {
      setSharingSaleId(null);
    }
  };

  // Download PDF
  const handleDownloadPdf = async (sale: any) => {
    try {
      setDownloadingSaleId(sale.id);
      await downloadInvoicePdf(sale, business, true);
      showToast(`Invoice #${sale.invoiceNumber} PDF downloaded!`);
    } catch (err: any) {
      console.error('Error downloading invoice PDF:', err);
      alert('Failed to download invoice PDF: ' + err.message);
    } finally {
      setDownloadingSaleId(null);
    }
  };

  // Delete Invoice
  const handleDelete = async () => {
    if (!deleteSale) return;
    try {
      setDeleting(true);
      const res = await fetch(`/api/sales/${deleteSale.id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        showToast(`Invoice #${deleteSale.invoiceNumber} deleted and stock restored successfully!`);
        setDeleteSale(null);
        fetchSalesData();
      } else {
        alert('Failed to delete invoice: ' + data.error);
      }
    } catch (err: any) {
      alert('Error deleting invoice: ' + err.message);
    } finally {
      setDeleting(false);
    }
  };

  const safeSales = Array.isArray(sales) ? sales : [];

  const filteredSales = safeSales.filter((s) => {
    const matchesSearch =
      (s?.invoiceNumber || '').toLowerCase().includes(search.toLowerCase()) ||
      (s?.partyName || '').toLowerCase().includes(search.toLowerCase()) ||
      (s?.partyPhone && s.partyPhone.includes(search));
    const matchesStatus = statusFilter === 'ALL' || s?.paymentStatus === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-4 sm:space-y-6 max-w-7xl mx-auto">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-20 right-4 sm:bottom-6 sm:right-6 z-50 flex items-center gap-2.5 px-4 py-3 bg-slate-900 text-white rounded-2xl shadow-xl border border-slate-700 animate-in fade-in slide-in-from-bottom-5 duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="text-xs font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm transition-colors duration-150">
        <div>
          <h1 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-2">
            <Receipt className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <span>Sales & Invoices</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 sm:mt-1">
            Generate GST tax invoices, record sales, issue receipts, and manage accounts receivable
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setIsNewModalOpen(true)}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-600/30 transition-all active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Record New Sale</span>
          </button>
          <Link
            href="/app/sales/new"
            className="hidden sm:flex items-center gap-1.5 px-3 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition-all"
            title="Open Advanced Full-Screen Invoice Editor"
          >
            <span>Full Form (F1)</span>
          </Link>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white dark:bg-slate-900 p-3 sm:p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3 transition-colors duration-150">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by invoice # or customer name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          />
        </div>

        {/* Status Filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          {(['ALL', 'PAID', 'PARTIAL', 'UNPAID'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                statusFilter === st
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {st === 'ALL' ? 'All Invoices' : st}
            </button>
          ))}
        </div>
      </div>

      {/* Sales Invoices Data Table - Matching Purchases Format */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden transition-colors duration-150">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/60 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase border-b border-slate-200 dark:border-slate-800">
                <th className="py-3 px-4 whitespace-nowrap">Invoice No</th>
                <th className="py-3 px-4 whitespace-nowrap">Date</th>
                <th className="py-3 px-4 whitespace-nowrap">Customer</th>
                <th className="py-3 px-4 whitespace-nowrap">Payment Mode</th>
                <th className="py-3 px-4 text-right whitespace-nowrap">Taxable</th>
                <th className="py-3 px-4 text-right whitespace-nowrap">GST Total</th>
                <th className="py-3 px-4 text-right whitespace-nowrap">Grand Total</th>
                <th className="py-3 px-4 text-center whitespace-nowrap">Status</th>
                <th className="py-3 px-4 text-center whitespace-nowrap font-extrabold tracking-wider text-slate-600 dark:text-slate-300">
                  ACTIONS
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400 text-xs">
                    Loading sales records...
                  </td>
                </tr>
              ) : filteredSales.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400 text-xs">
                    No sales invoices found matching your criteria.
                  </td>
                </tr>
              ) : (
                filteredSales.map((sale) => {
                  const dateFormatted = new Date(sale.invoiceDate).toLocaleDateString('en-IN', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                  });

                  return (
                    <tr
                      key={sale.id}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      {/* Clickable Invoice Number with File Icon */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => setSelectedSaleForA4(sale)}
                          className="group font-mono font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:underline flex items-center gap-1.5 cursor-pointer text-left"
                          title="Click to view & print tax invoice"
                        >
                          <FileText className="w-3.5 h-3.5 text-blue-500 group-hover:scale-110 transition-transform shrink-0" />
                          <span>{sale.invoiceNumber}</span>
                        </button>
                      </td>

                      {/* Date */}
                      <td className="py-3.5 px-4 text-slate-500 dark:text-slate-400 whitespace-nowrap">
                        {dateFormatted}
                      </td>

                      {/* Customer with GSTIN */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <p className="font-semibold text-slate-900 dark:text-slate-100">{sale.partyName}</p>
                        {sale.partyGstin ? (
                          <p className="font-mono text-[10px] text-slate-400 dark:text-slate-500">
                            GST: {sale.partyGstin}
                          </p>
                        ) : sale.partyPhone ? (
                          <p className="font-mono text-[10px] text-slate-400 dark:text-slate-500">
                            Ph: {sale.partyPhone}
                          </p>
                        ) : null}
                      </td>

                      {/* Payment Mode */}
                      <td className="py-3.5 px-4 font-mono text-[11px] text-slate-600 dark:text-slate-400 whitespace-nowrap">
                        {sale.paymentMode || 'CASH'}
                      </td>

                      {/* Taxable */}
                      <td className="py-3.5 px-4 text-right font-mono font-medium text-slate-700 dark:text-slate-300 whitespace-nowrap">
                        {formatINR(sale.taxableTotal)}
                      </td>

                      {/* GST Total */}
                      <td className="py-3.5 px-4 text-right font-mono font-semibold text-slate-800 dark:text-slate-200 whitespace-nowrap">
                        {formatINR(sale.taxTotal)}
                      </td>

                      {/* Grand Total */}
                      <td className="py-3.5 px-4 text-right font-mono font-black text-slate-900 dark:text-slate-100 text-sm whitespace-nowrap">
                        {formatINR(sale.grandTotal)}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <Badge
                          variant={
                            sale.paymentStatus === 'PAID'
                              ? 'success'
                              : sale.paymentStatus === 'PARTIAL'
                              ? 'warning'
                              : 'danger'
                          }
                        >
                          {sale.paymentStatus}
                        </Badge>
                      </td>

                      {/* Action Circular Buttons - Matching Purchases */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* 1. View Invoice Overview */}
                          <button
                            type="button"
                            onClick={() => setSelectedSaleForA4(sale)}
                            title="View Invoice Details"
                            className="w-8 h-8 rounded-full flex items-center justify-center bg-cyan-50 hover:bg-cyan-100 text-cyan-700 dark:bg-cyan-950/50 dark:hover:bg-cyan-900/60 dark:text-cyan-400 border border-cyan-200 dark:border-cyan-800 shadow-xs transition-all active:scale-90 cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          {/* 2. Print Tax Invoice */}
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedSaleForA4(sale);
                              setTimeout(() => window.print(), 350);
                            }}
                            title="Print Tax Invoice"
                            className="w-8 h-8 rounded-full flex items-center justify-center bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 shadow-xs transition-all active:scale-90 cursor-pointer"
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </button>

                          {/* 3. Share WhatsApp with PDF */}
                          <button
                            type="button"
                            onClick={() => handleWhatsAppShare(sale)}
                            disabled={sharingSaleId === sale.id}
                            title="Share Invoice via WhatsApp"
                            className="w-8 h-8 rounded-full flex items-center justify-center bg-emerald-50 hover:bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:hover:bg-emerald-900/60 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 shadow-xs transition-all active:scale-90 disabled:opacity-50 cursor-pointer"
                          >
                            {sharingSaleId === sale.id ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Share2 className="w-3.5 h-3.5" />
                            )}
                          </button>

                          {/* 4. Quick Edit Invoice */}
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(sale)}
                            title="Edit Invoice"
                            className="w-8 h-8 rounded-full flex items-center justify-center bg-blue-50 hover:bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:hover:bg-blue-900/60 dark:text-blue-400 border border-blue-200 dark:border-blue-800 shadow-xs transition-all active:scale-90 cursor-pointer"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>

                          {/* 5. Duplicate Invoice */}
                          <button
                            type="button"
                            onClick={() => router.push(`/app/sales/new?duplicate=${sale.id}`)}
                            title="Duplicate Invoice"
                            className="w-8 h-8 rounded-full flex items-center justify-center bg-amber-50 hover:bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:hover:bg-amber-900/60 dark:text-amber-400 border border-amber-200 dark:border-amber-800 shadow-xs transition-all active:scale-90 cursor-pointer"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>

                          {/* 6. Delete Invoice */}
                          <button
                            type="button"
                            onClick={() => setDeleteSale(sale)}
                            title="Delete Invoice & Restore Inventory"
                            className="w-8 h-8 rounded-full flex items-center justify-center bg-rose-50 hover:bg-rose-100 text-rose-700 dark:bg-rose-950/50 dark:hover:bg-rose-900/60 dark:text-rose-400 border border-rose-200 dark:border-rose-800 shadow-xs transition-all active:scale-90 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* View / Print A4 Tax Invoice Modal */}
      <Modal
        isOpen={!!selectedSaleForA4}
        onClose={() => setSelectedSaleForA4(null)}
        title={`Tax Invoice #${selectedSaleForA4?.invoiceNumber}`}
        subtitle="Standard GST Tax Invoice format with PDF export, thermal slip & WhatsApp share"
        maxWidth="4xl"
      >
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 p-2 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 no-print">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Customer:{' '}
                <span className="text-blue-600 dark:text-blue-400">{selectedSaleForA4?.partyName}</span>
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  const s = selectedSaleForA4;
                  setSelectedSaleForThermal(s);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-700 transition-all cursor-pointer"
              >
                <FileText className="w-4 h-4" />
                <span>Thermal Slip</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  const s = selectedSaleForA4;
                  setSelectedSaleForQr(s);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 dark:bg-amber-950/50 hover:bg-amber-100 text-amber-700 dark:text-amber-300 rounded-xl text-xs font-bold border border-amber-200 dark:border-amber-800 transition-all cursor-pointer"
              >
                <QrCode className="w-4 h-4" />
                <span>UPI QR</span>
              </button>
              <button
                type="button"
                onClick={() => handleDownloadPdf(selectedSaleForA4)}
                disabled={downloadingSaleId === selectedSaleForA4?.id}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-700 transition-all cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Download PDF</span>
              </button>
              <button
                type="button"
                onClick={() => handleWhatsAppShare(selectedSaleForA4)}
                disabled={sharingSaleId === selectedSaleForA4?.id}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-600/30 transition-all cursor-pointer"
              >
                <Share2 className="w-4 h-4" />
                <span>Share WhatsApp</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  const toEdit = selectedSaleForA4;
                  setSelectedSaleForA4(null);
                  handleOpenEdit(toEdit);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-600/30 transition-all cursor-pointer"
              >
                <Edit className="w-4 h-4" />
                <span>Edit Invoice</span>
              </button>
              <button
                type="button"
                onClick={handlePrint}
                className="flex items-center gap-1.5 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-600/30 transition-all cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>Print Bill</span>
              </button>
            </div>
          </div>

          {selectedSaleForA4 && (
            <InvoiceA4Template
              business={
                business || {
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
                }
              }
              sale={selectedSaleForA4}
            />
          )}
        </div>
      </Modal>

      {/* Record New Sale Modal - In-Page Quick Creation Matching Purchases */}
      <Modal
        isOpen={isNewModalOpen}
        onClose={() => setIsNewModalOpen(false)}
        title="Record New Sales Invoice"
        subtitle="Generates GST compliant tax invoice, decrements inventory stock, and posts ledger entries"
        maxWidth="4xl"
      >
        <form onSubmit={handleSaveNewSale} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Select Customer
              </label>
              <select
                value={newPartyId}
                onChange={(e) => handleCustomerSelect(e.target.value, false)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100"
              >
                <option value="">-- Walk-in / Cash Customer --</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Customer Name
              </label>
              <input
                type="text"
                required
                value={newPartyName}
                onChange={(e) => setNewPartyName(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Customer Phone
              </label>
              <input
                type="text"
                placeholder="Optional"
                value={newPartyPhone}
                onChange={(e) => setNewPartyPhone(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono text-slate-900 dark:text-slate-100"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Customer GSTIN
              </label>
              <input
                type="text"
                placeholder="Optional (B2B)"
                value={newPartyGstin}
                onChange={(e) => {
                  const val = e.target.value.toUpperCase();
                  setNewPartyGstin(val);
                  if (val.length >= 2) setNewPartyStateCode(val.substring(0, 2));
                }}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono text-slate-900 dark:text-slate-100"
              />
            </div>
          </div>

          {/* Line items table */}
          <div className="space-y-2 pt-2">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold uppercase text-slate-600 dark:text-slate-400">
                Invoice Line Items
              </span>
              <button
                type="button"
                onClick={() => addItem(false)}
                title="Add Item (Shortcut: F2)"
                className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 dark:bg-blue-950/50 hover:bg-blue-100 dark:hover:bg-blue-900/50 text-blue-700 dark:text-blue-300 text-xs font-bold rounded-lg border border-blue-200 dark:border-blue-800 transition-colors shadow-xs cursor-pointer active:scale-95"
              >
                <span>+ Add Item</span>
                <kbd className="px-1.5 py-0.2 text-[9px] bg-white dark:bg-slate-900 text-blue-800 dark:text-blue-200 border border-blue-300 dark:border-blue-700 rounded font-mono font-bold shadow-xs">
                  F2
                </kbd>
              </button>
            </div>

            <div className="overflow-x-auto min-h-[200px] pb-8">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-100 dark:bg-slate-800/60 text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase">
                    <th className="py-2 px-2 min-w-[200px]">Item</th>
                    <th className="py-2 px-2 text-center">Qty</th>
                    <th className="py-2 px-2 text-right">Sale Price (₹)</th>
                    <th className="py-2 px-2 text-center">GST %</th>
                    <th className="py-2 px-2 text-right">Total</th>
                    <th className="py-2 px-1"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {newItems.map((item, idx) => (
                    <tr key={idx}>
                      <td className="py-2 px-2 min-w-[200px] relative">
                        <ItemSearchInput
                          value={item.productName}
                          onChange={(val) => updateItem(idx, 'productName', val, false)}
                          onSelectProduct={(prod) => handleProductSelect(idx, prod, false)}
                          products={products}
                          priceType="sale"
                          placeholder="Search product..."
                          required
                        />
                      </td>
                      <td className="py-2 px-2 w-20 text-center">
                        <input
                          type="number"
                          min="0.1"
                          step="any"
                          value={item.quantity}
                          onFocus={(e) => e.target.select()}
                          onClick={(e) => e.currentTarget.select()}
                          onChange={(e) => updateItem(idx, 'quantity', parseFloat(e.target.value) || 0, false)}
                          className="w-full px-2 py-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-xs text-center font-bold text-slate-900 dark:text-slate-100"
                        />
                      </td>
                      <td className="py-2 px-2 w-24 text-right">
                        <input
                          type="number"
                          min="0"
                          step="any"
                          value={item.unitPrice}
                          onFocus={(e) => e.target.select()}
                          onClick={(e) => e.currentTarget.select()}
                          onChange={(e) => updateItem(idx, 'unitPrice', parseFloat(e.target.value) || 0, false)}
                          className="w-full px-2 py-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-xs text-right font-mono text-slate-900 dark:text-slate-100"
                        />
                      </td>
                      <td className="py-2 px-2 w-20 text-center">
                        <select
                          value={item.gstRate}
                          onChange={(e) => updateItem(idx, 'gstRate', parseFloat(e.target.value) || 0, false)}
                          className="w-full px-2 py-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-xs font-bold text-center text-slate-900 dark:text-slate-100"
                        >
                          <option value="0">0%</option>
                          <option value="5">5%</option>
                          <option value="12">12%</option>
                          <option value="18">18%</option>
                          <option value="28">28%</option>
                        </select>
                      </td>
                      <td className="py-2 px-2 w-28 text-right font-mono font-bold text-slate-900 dark:text-slate-100">
                        {formatINR(newGstSummary.items[idx]?.totalAmount || 0, false)}
                      </td>
                      <td className="py-2 px-1 text-center">
                        <button
                          type="button"
                          onClick={() => removeItem(idx, false)}
                          disabled={newItems.length <= 1}
                          className="p-1 text-slate-400 hover:text-rose-600 disabled:opacity-20 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Payment & Totals */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-slate-200 dark:border-slate-800 text-xs">
            <div className="space-y-2">
              <label className="block font-semibold text-slate-700 dark:text-slate-300">Payment Mode</label>
              <select
                value={newPaymentMode}
                onChange={(e) => setNewPaymentMode(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-slate-900 dark:text-slate-100"
              >
                <option value="CREDIT">Customer Credit (Receivable Later)</option>
                <option value="CASH">Cash in Hand</option>
                <option value="UPI">UPI / QR Code</option>
                <option value="BANK">Bank Transfer / NEFT</option>
                <option value="UNPAID">Unpaid</option>
              </select>
            </div>

            <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-200 dark:border-slate-700 space-y-1 text-right">
              <p className="text-slate-500 dark:text-slate-400">
                Taxable: {formatINR(newGstSummary.taxableTotal)}
              </p>
              <p className="text-slate-500 dark:text-slate-400">
                Output GST: {formatINR(newGstSummary.taxTotal)}
              </p>
              <p className="text-base font-black text-slate-900 dark:text-slate-100 font-mono">
                Total: {formatINR(newGstSummary.grandTotal)}
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-3">
            <button
              type="button"
              onClick={() => setIsNewModalOpen(false)}
              className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={savingNew}
              className="flex items-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-600/30 active:scale-95 cursor-pointer disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{savingNew ? 'Saving...' : 'Generate Tax Invoice'}</span>
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Sale In-Page Modal */}
      <Modal
        isOpen={!!editSale}
        onClose={() => setEditSale(null)}
        title={`Edit Tax Invoice #${editSale?.invoiceNumber}`}
        subtitle="Modify sold items, quantities, rates, customer details, or payment mode"
        maxWidth="4xl"
      >
        {editSale && (
          <form onSubmit={handleUpdateSale} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Select Customer
              </label>
              <select
                value={editPartyId}
                onChange={(e) => handleCustomerSelect(e.target.value, true)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100"
              >
                <option value="">-- Walk-in Customer --</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Customer Name
              </label>
              <input
                type="text"
                required
                value={editPartyName}
                onChange={(e) => setEditPartyName(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Customer Phone
              </label>
              <input
                type="text"
                placeholder="Optional"
                value={editPartyPhone}
                onChange={(e) => setEditPartyPhone(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono text-slate-900 dark:text-slate-100"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Customer GSTIN
              </label>
              <input
                type="text"
                placeholder="Optional"
                value={editPartyGstin}
                onChange={(e) => {
                  const val = e.target.value.toUpperCase();
                  setEditPartyGstin(val);
                  if (val.length >= 2) setEditPartyStateCode(val.substring(0, 2));
                }}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono text-slate-900 dark:text-slate-100"
              />
            </div>
          </div>

          {/* Edit Line items */}
          <div className="space-y-2 pt-2">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold uppercase text-slate-600 dark:text-slate-400">
                Invoice Line Items
              </span>
              <button
                type="button"
                onClick={() => addItem(true)}
                title="Add Item (Shortcut: F2)"
                className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 dark:bg-blue-950/50 hover:bg-blue-100 dark:hover:bg-blue-900/50 text-blue-700 dark:text-blue-300 text-xs font-bold rounded-lg border border-blue-200 dark:border-blue-800 transition-colors shadow-xs cursor-pointer active:scale-95"
              >
                <span>+ Add Item</span>
                <kbd className="px-1.5 py-0.2 text-[9px] bg-white dark:bg-slate-900 text-blue-800 dark:text-blue-200 border border-blue-300 dark:border-blue-700 rounded font-mono font-bold shadow-xs">
                  F2
                </kbd>
              </button>
            </div>

            <div className="overflow-x-auto min-h-[200px] pb-8">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-100 dark:bg-slate-800/60 text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase">
                    <th className="py-2 px-2 min-w-[200px]">Item</th>
                    <th className="py-2 px-2 text-center">Qty</th>
                    <th className="py-2 px-2 text-right">Sale Price (₹)</th>
                    <th className="py-2 px-2 text-center">GST %</th>
                    <th className="py-2 px-2 text-right">Total</th>
                    <th className="py-2 px-1"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {editItems.map((item, idx) => (
                    <tr key={idx}>
                      <td className="py-2 px-2 min-w-[200px] relative">
                        <ItemSearchInput
                          value={item.productName}
                          onChange={(val) => updateItem(idx, 'productName', val, true)}
                          onSelectProduct={(prod) => handleProductSelect(idx, prod, true)}
                          products={products}
                          priceType="sale"
                          placeholder="Search product..."
                          required
                        />
                      </td>
                      <td className="py-2 px-2 w-20 text-center">
                        <input
                          type="number"
                          min="0.1"
                          step="any"
                          value={item.quantity}
                          onFocus={(e) => e.target.select()}
                          onClick={(e) => e.currentTarget.select()}
                          onChange={(e) => updateItem(idx, 'quantity', parseFloat(e.target.value) || 0, true)}
                          className="w-full px-2 py-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-xs text-center font-bold text-slate-900 dark:text-slate-100"
                        />
                      </td>
                      <td className="py-2 px-2 w-24 text-right">
                        <input
                          type="number"
                          min="0"
                          step="any"
                          value={item.unitPrice}
                          onFocus={(e) => e.target.select()}
                          onClick={(e) => e.currentTarget.select()}
                          onChange={(e) => updateItem(idx, 'unitPrice', parseFloat(e.target.value) || 0, true)}
                          className="w-full px-2 py-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-xs text-right font-mono text-slate-900 dark:text-slate-100"
                        />
                      </td>
                      <td className="py-2 px-2 w-20 text-center">
                        <select
                          value={item.gstRate}
                          onChange={(e) => updateItem(idx, 'gstRate', parseFloat(e.target.value) || 0, true)}
                          className="w-full px-2 py-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-xs font-bold text-center text-slate-900 dark:text-slate-100"
                        >
                          <option value="0">0%</option>
                          <option value="5">5%</option>
                          <option value="12">12%</option>
                          <option value="18">18%</option>
                          <option value="28">28%</option>
                        </select>
                      </td>
                      <td className="py-2 px-2 w-28 text-right font-mono font-bold text-slate-900 dark:text-slate-100">
                        {formatINR(editGstSummary.items[idx]?.totalAmount || 0, false)}
                      </td>
                      <td className="py-2 px-1 text-center">
                        <button
                          type="button"
                          onClick={() => removeItem(idx, true)}
                          disabled={editItems.length <= 1}
                          className="p-1 text-slate-400 hover:text-rose-600 disabled:opacity-20 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Payment Mode & Totals */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-slate-200 dark:border-slate-800 text-xs">
            <div className="space-y-2">
              <label className="block font-semibold text-slate-700 dark:text-slate-300">Payment Mode</label>
              <select
                value={editPaymentMode}
                onChange={(e) => setEditPaymentMode(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-slate-900 dark:text-slate-100"
              >
                <option value="CREDIT">Customer Credit (Receivable Later)</option>
                <option value="CASH">Cash in Hand</option>
                <option value="UPI">UPI / QR Code</option>
                <option value="BANK">Bank Transfer / NEFT</option>
                <option value="UNPAID">Unpaid</option>
              </select>
            </div>

            <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-200 dark:border-slate-700 space-y-1 text-right">
              <p className="text-slate-500 dark:text-slate-400">
                Taxable: {formatINR(editGstSummary.taxableTotal)}
              </p>
              <p className="text-slate-500 dark:text-slate-400">
                Output GST: {formatINR(editGstSummary.taxTotal)}
              </p>
              <p className="text-base font-black text-slate-900 dark:text-slate-100 font-mono">
                Total: {formatINR(editGstSummary.grandTotal)}
              </p>
            </div>
          </div>

          <div className="flex justify-between items-center pt-3">
            <Link
              href={`/app/sales/edit/${editSale?.id || ''}`}
              className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline"
            >
              Open in full page editor →
            </Link>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setEditSale(null)}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={updating}
                className="flex items-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-600/30 active:scale-95 cursor-pointer disabled:opacity-50"
              >
                {updating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                <span>{updating ? 'Saving Updates...' : 'Update Tax Invoice'}</span>
              </button>
            </div>
          </div>
        </form>
        )}
      </Modal>

      {/* POS Thermal Slip Modal */}
      <Modal
        isOpen={!!selectedSaleForThermal}
        onClose={() => setSelectedSaleForThermal(null)}
        title={`Thermal POS Receipt #${selectedSaleForThermal?.invoiceNumber}`}
        subtitle="Optimized for 80mm / 58mm POS thermal billing printers"
        maxWidth="md"
      >
        <div className="space-y-4">
          <div className="flex justify-end gap-2 no-print">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold shadow-md transition-all cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Print Thermal Slip</span>
            </button>
          </div>

          {selectedSaleForThermal && (
            <ThermalReceiptTemplate
              business={
                business || {
                  name: 'RAHUL JEE TRADING COMPANY',
                  address: 'Allahabad Bank Road, Yusufpur, Mohammadabad, Dist- Ghazipur (U.P.) - 233227',
                  phone: '8887754821',
                  gstin: '09DMCPG4193P1ZG',
                  upiId: '8887754821@upi',
                }
              }
              sale={selectedSaleForThermal}
            />
          )}
        </div>
      </Modal>

      {/* UPI QR Modal */}
      {selectedSaleForQr && (
        <QrModal
          isOpen={!!selectedSaleForQr}
          onClose={() => setSelectedSaleForQr(null)}
          amount={selectedSaleForQr.balanceAmount > 0 ? selectedSaleForQr.balanceAmount : selectedSaleForQr.grandTotal}
          invoiceNumber={selectedSaleForQr.invoiceNumber}
          upiId={business?.upiId || '8887754821@upi'}
          upiName={business?.name || 'RAHUL JEE TRADING COMPANY'}
        />
      )}

      {/* Delete Confirmation Modal - Matching Purchases */}
      <Modal
        isOpen={!!deleteSale}
        onClose={() => setDeleteSale(null)}
        title="Delete Tax Invoice"
        subtitle="Warning: Warehouse inventory stock will be restored and customer balance reversed."
        maxWidth="sm"
      >
        {deleteSale && (
        <div className="space-y-4">
          <div className="p-3 bg-amber-50 dark:bg-amber-950/40 rounded-xl border border-amber-200 dark:border-amber-800 flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <p className="text-[11px] text-amber-800 dark:text-amber-300 leading-relaxed">
              Deleting this invoice will automatically add the items back into warehouse stock and reverse any receivable or ledger entries.
            </p>
          </div>

          <p className="text-xs text-slate-600 dark:text-slate-300">
            Are you sure you want to delete Tax Invoice{' '}
            <strong className="font-mono text-slate-900 dark:text-slate-100">
              #{deleteSale?.invoiceNumber}
            </strong>{' '}
            for <strong className="text-slate-900 dark:text-slate-100">{deleteSale?.partyName}</strong> for{' '}
            <strong className="text-blue-600 dark:text-blue-400">{formatINR(deleteSale?.grandTotal || 0)}</strong>?
          </p>

          <div className="flex justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={() => setDeleteSale(null)}
              className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={deleting}
              onClick={handleDelete}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-600 text-white text-xs font-bold hover:bg-rose-700 disabled:opacity-50 cursor-pointer"
            >
              {deleting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>{deleting ? 'Deleting...' : 'Yes, Delete & Restore Stock'}</span>
            </button>
          </div>
        </div>
        )}
      </Modal>
    </div>
  );
}
