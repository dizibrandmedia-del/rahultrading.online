'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { formatINR } from '@/lib/currency';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { ItemSearchInput } from '@/components/billing/ItemSearchInput';
import { NonGstInvoiceTemplate } from '@/components/printing/NonGstInvoiceTemplate';
import { shareInvoiceWithPdf, downloadInvoicePdf } from '@/lib/pdfGenerator';
import {
  FileText,
  Plus,
  Search,
  Printer,
  Share2,
  Copy,
  Edit,
  Trash2,
  Download,
  Eye,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Save,
} from 'lucide-react';

interface NonGstDraftItem {
  productId?: string;
  productName: string;
  description?: string;
  hsnCode?: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  discountPercent?: number;
  discountAmount?: number;
  totalAmount: number;
}

export default function NonGstSalesPage() {
  const router = useRouter();
  const [invoices, setInvoices] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [business, setBusiness] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [sharingInvoiceId, setSharingInvoiceId] = useState<string | null>(null);
  const [downloadingInvoiceId, setDownloadingInvoiceId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // In-Page Quick Record Modal
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [savingNew, setSavingNew] = useState(false);
  const [newPartyId, setNewPartyId] = useState('');
  const [newPartyName, setNewPartyName] = useState('Walk-in Cash Customer');
  const [newPartyPhone, setNewPartyPhone] = useState('');
  const [newPartyAddress, setNewPartyAddress] = useState('');
  const [newFromName, setNewFromName] = useState('R.J.T.C');
  const [newFromPhone, setNewFromPhone] = useState('');
  const [newFromAddress, setNewFromAddress] = useState('');
  const [newPaymentMode, setNewPaymentMode] = useState('CREDIT');
  const [newExtraCharges, setNewExtraCharges] = useState(0);
  const [newExtraChargeName, setNewExtraChargeName] = useState('LOADING CHARGE');

  const defaultDraftItem: NonGstDraftItem = {
    productName: '',
    hsnCode: '',
    quantity: 1,
    unit: 'PCS',
    unitPrice: 0,
    totalAmount: 0,
  };

  const [newItems, setNewItems] = useState<NonGstDraftItem[]>([{ ...defaultDraftItem }]);

  // In-Page Quick Edit Modal
  const [editInvoice, setEditInvoice] = useState<any | null>(null);
  const [editPartyId, setEditPartyId] = useState('');
  const [editPartyName, setEditPartyName] = useState('');
  const [editPartyPhone, setEditPartyPhone] = useState('');
  const [editPartyAddress, setEditPartyAddress] = useState('');
  const [editFromName, setEditFromName] = useState('R.J.T.C');
  const [editFromPhone, setEditFromPhone] = useState('');
  const [editFromAddress, setEditFromAddress] = useState('');
  const [editPaymentMode, setEditPaymentMode] = useState('CASH');
  const [editExtraCharges, setEditExtraCharges] = useState(0);
  const [editExtraChargeName, setEditExtraChargeName] = useState('LOADING CHARGE');
  const [editNotes, setEditNotes] = useState('');
  const [editItems, setEditItems] = useState<NonGstDraftItem[]>([]);
  const [updating, setUpdating] = useState(false);

  // View & Delete Modal
  const [selectedInvoiceForView, setSelectedInvoiceForView] = useState<any>(null);
  const [deleteInvoice, setDeleteInvoice] = useState<any | null>(null);
  const [deleting, setDeleting] = useState(false);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const fetchInvoicesData = async () => {
    try {
      setLoading(true);
      const [invRes, cRes, prodRes, bRes] = await Promise.all([
        fetch('/api/non-gst-invoices').then((r) => r.json()).catch(() => ({ invoices: [] })),
        fetch('/api/parties?type=CUSTOMER').then((r) => r.json()).catch(() => ({ parties: [] })),
        fetch('/api/products').then((r) => r.json()).catch(() => ({ products: [] })),
        fetch('/api/business').then((r) => r.json()).catch(() => ({ business: null })),
      ]);

      if (invRes.success && invRes.invoices) setInvoices(invRes.invoices);
      if (cRes.success && cRes.parties) setCustomers(cRes.parties);
      if (prodRes.success && prodRes.products) setProducts(prodRes.products);
      if (bRes.success && bRes.business) setBusiness(bRes.business);
    } catch (err) {
      console.error('Error fetching non-GST invoices:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoicesData();
  }, []);

  // Handle Customer Select
  const handleCustomerSelect = (cId: string, isEdit = false) => {
    const cust = customers.find((c) => c.id === cId);
    if (isEdit) {
      setEditPartyId(cId);
      if (cust) {
        setEditPartyName(cust.name);
        setEditPartyPhone(cust.phone || '');
        setEditPartyAddress(cust.address || '');
      }
    } else {
      setNewPartyId(cId);
      if (cust) {
        setNewPartyName(cust.name);
        setNewPartyPhone(cust.phone || '');
        setNewPartyAddress(cust.address || '');
      }
    }
  };

  // Handle Product Select
  const handleProductSelect = (index: number, productOrId: any, isEdit = false) => {
    if (!productOrId || productOrId === '') return;
    const prod = typeof productOrId === 'object' ? productOrId : products.find((p) => p.id === productOrId);
    if (!prod) return;

    if (isEdit) {
      const newArr = [...editItems];
      const qty = newArr[index].quantity || 1;
      const rate = prod.salePrice || 0;
      newArr[index] = {
        ...newArr[index],
        productId: prod.id,
        productName: prod.name,
        hsnCode: prod.hsnCode || '',
        unitPrice: rate,
        totalAmount: qty * rate,
      };
      setEditItems(newArr);
    } else {
      const newArr = [...newItems];
      const qty = newArr[index].quantity || 1;
      const rate = prod.salePrice || 0;
      newArr[index] = {
        ...newArr[index],
        productId: prod.id,
        productName: prod.name,
        hsnCode: prod.hsnCode || '',
        unitPrice: rate,
        totalAmount: qty * rate,
      };
      setNewItems(newArr);
    }
  };

  const updateItem = (index: number, field: keyof NonGstDraftItem, val: any, isEdit = false) => {
    if (isEdit) {
      const newArr = [...editItems];
      newArr[index] = { ...newArr[index], [field]: val };
      if (field === 'quantity' || field === 'unitPrice') {
        const q = field === 'quantity' ? Number(val) || 0 : newArr[index].quantity;
        const p = field === 'unitPrice' ? Number(val) || 0 : newArr[index].unitPrice;
        newArr[index].totalAmount = q * p;
      }
      setEditItems(newArr);
    } else {
      const newArr = [...newItems];
      newArr[index] = { ...newArr[index], [field]: val };
      if (field === 'quantity' || field === 'unitPrice') {
        const q = field === 'quantity' ? Number(val) || 0 : newArr[index].quantity;
        const p = field === 'unitPrice' ? Number(val) || 0 : newArr[index].unitPrice;
        newArr[index].totalAmount = q * p;
      }
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
        } else if (editInvoice) {
          e.preventDefault();
          addItem(true);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isNewModalOpen, editInvoice, newItems, editItems]);

  // Calculations for New Non-GST Sale
  const newSubTotal = newItems.reduce((acc, it) => acc + (it.totalAmount || 0), 0);
  const newGrandTotal = Math.round(newSubTotal + (Number(newExtraCharges) || 0));

  // Calculations for Edit Non-GST Sale
  const editSubTotal = editItems.reduce((acc, it) => acc + (it.totalAmount || 0), 0);
  const editGrandTotal = Math.round(editSubTotal + (Number(editExtraCharges) || 0));

  // Save New Non-GST Sale
  const handleSaveNewInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    const validItems = newItems.filter((it) => it.productName.trim() && it.quantity > 0);
    if (validItems.length === 0) {
      alert('Please add valid products');
      return;
    }

    try {
      setSavingNew(true);
      const res = await fetch('/api/non-gst-invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fromName: newFromName.trim() || null,
          fromPhone: newFromPhone.trim() || null,
          fromAddress: newFromAddress.trim() || null,
          partyId: newPartyId || null,
          partyName: newPartyName || 'Walk-in Cash Customer',
          partyPhone: newPartyPhone || null,
          partyAddress: newPartyAddress || null,
          paymentMode: newPaymentMode,
          extraCharges: Number(newExtraCharges) || 0,
          extraChargeName: newExtraChargeName,
          paidAmount: newPaymentMode === 'CREDIT' || newPaymentMode === 'UNPAID' ? 0 : newGrandTotal,
          items: validItems.map((it) => ({
            productId: it.productId || null,
            productName: it.productName,
            hsnCode: it.hsnCode || null,
            quantity: Number(it.quantity) || 1,
            unit: it.unit || 'PCS',
            unitPrice: Number(it.unitPrice) || 0,
            discountPercent: 0,
            discountAmount: 0,
            totalAmount: Number(it.totalAmount) || 0,
          })),
        }),
      });

      const data = await res.json();
      if (data.success) {
        setIsNewModalOpen(false);
        showToast('Non-GST invoice recorded successfully!');
        setNewFromName('R.J.T.C');
        setNewFromPhone('');
        setNewFromAddress('');
        setNewPartyId('');
        setNewPartyName('Walk-in Cash Customer');
        setNewPartyPhone('');
        setNewPartyAddress('');
        setNewPaymentMode('CREDIT');
        setNewExtraCharges(0);
        setNewItems([{ ...defaultDraftItem }]);
        fetchInvoicesData();
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
  const handleOpenEdit = (inv: any) => {
    setEditInvoice(inv);
    setEditFromName(inv.fromName || 'R.J.T.C');
    setEditFromPhone(inv.fromPhone || '');
    setEditFromAddress(inv.fromAddress || '');
    setEditPartyId(inv.partyId || '');
    setEditPartyName(inv.partyName || '');
    setEditPartyPhone(inv.partyPhone || '');
    setEditPartyAddress(inv.partyAddress || inv.billingAddress || '');
    setEditPaymentMode(inv.paymentMode || 'UNPAID');
    setEditExtraCharges(inv.extraCharges || 0);
    setEditExtraChargeName(inv.extraChargeName || 'LOADING CHARGE');
    setEditNotes(inv.notes || '');

    const mappedItems: NonGstDraftItem[] = (inv.items || []).map((it: any) => ({
      productId: it.productId || undefined,
      productName: it.productName || '',
      description: it.description || '',
      hsnCode: it.hsnCode || '',
      quantity: Number(it.quantity) || 1,
      unit: it.unit || 'PCS',
      unitPrice: Number(it.unitPrice) || 0,
      discountPercent: Number(it.discountPercent) || 0,
      discountAmount: Number(it.discountAmount) || 0,
      totalAmount: Number(it.totalAmount) || 0,
    }));

    setEditItems(mappedItems.length > 0 ? mappedItems : [{ ...defaultDraftItem }]);
  };

  // Update Non-GST Invoice
  const handleUpdateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editInvoice) return;

    const validItems = editItems.filter((it) => it.productName.trim() && it.quantity > 0);
    if (validItems.length === 0) {
      alert('Please add valid products');
      return;
    }

    try {
      setUpdating(true);
      const res = await fetch(`/api/non-gst-invoices/${editInvoice.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fromName: editFromName.trim() || null,
          fromPhone: editFromPhone.trim() || null,
          fromAddress: editFromAddress.trim() || null,
          partyId: editPartyId || null,
          partyName: editPartyName,
          partyPhone: editPartyPhone,
          partyAddress: editPartyAddress,
          paymentMode: editPaymentMode,
          extraCharges: Number(editExtraCharges) || 0,
          extraChargeName: editExtraChargeName,
          paidAmount: editPaymentMode === 'CREDIT' || editPaymentMode === 'UNPAID' ? 0 : editGrandTotal,
          notes: editNotes,
          items: validItems.map((it) => ({
            id: (it as any).id,
            productId: it.productId || null,
            productName: it.productName,
            description: it.description || null,
            hsnCode: it.hsnCode || null,
            quantity: Number(it.quantity) || 1,
            unit: it.unit || 'PCS',
            unitPrice: Number(it.unitPrice) || 0,
            discountPercent: Number(it.discountPercent) || 0,
            discountAmount: Number(it.discountAmount) || 0,
            totalAmount: Number(it.totalAmount) || 0,
          })),
        }),
      });

      const data = await res.json();
      if (data.success) {
        setEditInvoice(null);
        showToast(`Non-GST invoice #${editInvoice.invoiceNumber} updated successfully!`);
        fetchInvoicesData();
      } else {
        alert('Error: ' + data.error);
      }
    } catch (err: any) {
      alert('Error: ' + err.message);
    } finally {
      setUpdating(false);
    }
  };

  const getEnrichedInvoiceWithCustomerDue = (inv: any) => {
    if (!inv) return null;
    const nameKey = inv.partyName?.trim().toLowerCase();
    const isWalkIn = !nameKey || nameKey === 'walk-in cash customer';

    if (isWalkIn) {
      return {
        ...inv,
        hasPreviousInvoices: false,
        previousBalance: 0,
        customerTotalDue: Number(inv.balanceAmount) || 0,
      };
    }

    // Filter all other invoices for this customer from safeInvoices
    const otherInvoices = safeInvoices.filter(
      (o: any) =>
        o.id !== inv.id &&
        ((inv.partyId && o.partyId === inv.partyId) ||
          (nameKey && o.partyName?.trim().toLowerCase() === nameKey))
    );

    const hasPreviousInvoices = otherInvoices.length > 0 || Boolean(inv.hasPreviousInvoices);
    const previousBalance =
      inv.previousBalance !== undefined
        ? Number(inv.previousBalance)
        : otherInvoices.reduce(
            (sum: number, o: any) => sum + (Number(o.balanceAmount) || 0),
            0
          );
    const customerTotalDue =
      inv.customerTotalDue !== undefined
        ? Number(inv.customerTotalDue)
        : previousBalance + (Number(inv.balanceAmount) || 0);

    return {
      ...inv,
      hasPreviousInvoices,
      previousBalance,
      customerTotalDue,
    };
  };

  const handlePrint = () => {
    const prev = document.title;
    document.title = ' ';
    window.print();
    setTimeout(() => {
      document.title = prev;
    }, 1000);
  };

  const handleWhatsAppShare = async (inv: any) => {
    try {
      setSharingInvoiceId(inv.id);
      const enriched = getEnrichedInvoiceWithCustomerDue(inv);
      await shareInvoiceWithPdf(enriched, business, false, (msg) => showToast(msg));
    } catch (err: any) {
      console.error('Error sharing Non-GST invoice:', err);
      alert('Failed to generate or share invoice: ' + err.message);
    } finally {
      setSharingInvoiceId(null);
    }
  };

  const handleDownloadPdf = async (inv: any) => {
    try {
      setDownloadingInvoiceId(inv.id);
      const enriched = getEnrichedInvoiceWithCustomerDue(inv);
      await downloadInvoicePdf(enriched, business, false);
      showToast(`Non-GST Invoice #${inv.invoiceNumber} PDF downloaded!`);
    } catch (err: any) {
      console.error('Error downloading invoice PDF:', err);
      alert('Failed to download invoice PDF: ' + err.message);
    } finally {
      setDownloadingInvoiceId(null);
    }
  };

  const handleDelete = async () => {
    if (!deleteInvoice) return;
    try {
      setDeleting(true);
      const res = await fetch(`/api/non-gst-invoices/${deleteInvoice.id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        setInvoices(invoices.filter((inv) => inv.id !== deleteInvoice.id));
        setDeleteInvoice(null);
        showToast('Invoice deleted successfully.');
      } else {
        alert('Failed to delete invoice: ' + data.error);
      }
    } catch (err: any) {
      alert('Error deleting invoice: ' + err.message);
    } finally {
      setDeleting(false);
    }
  };

  const safeInvoices = Array.isArray(invoices) ? invoices : [];

  const filteredInvoices = safeInvoices.filter((inv) => {
    const matchesSearch =
      (inv?.invoiceNumber || '').toLowerCase().includes(search.toLowerCase()) ||
      (inv?.partyName || '').toLowerCase().includes(search.toLowerCase()) ||
      (inv?.partyPhone && inv.partyPhone.includes(search));
    const matchesStatus = statusFilter === 'ALL' || inv?.paymentStatus === statusFilter;
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
            <FileText className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
            <span>Non-GST Invoices</span>
            <span className="text-[10px] uppercase font-bold bg-cyan-500/10 text-cyan-700 dark:text-cyan-300 px-2 py-0.5 rounded-md border border-cyan-500/20">
              Tax-Free
            </span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 sm:mt-1">
            Create, manage, print A4 bills, and share PDF invoices via WhatsApp without tax calculations
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setIsNewModalOpen(true)}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl text-xs font-bold shadow-md shadow-cyan-600/30 transition-all active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Record Non-GST Invoice</span>
          </button>
          <Link
            href="/app/non-gst-sales/new"
            className="hidden sm:flex items-center gap-1.5 px-3 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition-all"
            title="Open Advanced Full-Screen Non-GST Editor"
          >
            <span>Full Form</span>
          </Link>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white dark:bg-slate-900 p-3 sm:p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3 transition-colors duration-150">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by invoice # or customer name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-cyan-500/20"
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
                  ? 'bg-cyan-600 text-white shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {st === 'ALL' ? 'All Invoices' : st}
            </button>
          ))}
        </div>
      </div>

      {/* Invoices Table - Matching Purchases Layout */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden transition-colors duration-150">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/60 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase border-b border-slate-200 dark:border-slate-800">
                <th className="py-3 px-4 whitespace-nowrap">Invoice No</th>
                <th className="py-3 px-4 whitespace-nowrap">Date</th>
                <th className="py-3 px-4 whitespace-nowrap">Customer</th>
                <th className="py-3 px-4 whitespace-nowrap">Payment Mode</th>
                <th className="py-3 px-4 text-right whitespace-nowrap">Subtotal</th>
                <th className="py-3 px-4 text-right whitespace-nowrap">Extra / Disc</th>
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
                    Loading Non-GST invoices...
                  </td>
                </tr>
              ) : filteredInvoices.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400 text-xs">
                    No Non-GST invoices found matching your criteria.
                  </td>
                </tr>
              ) : (
                filteredInvoices.map((inv) => {
                  const dateFormatted = new Date(inv.invoiceDate).toLocaleDateString('en-IN', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                  });

                  return (
                    <tr
                      key={inv.id}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      {/* Clickable Invoice Number with File Icon */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => setSelectedInvoiceForView(inv)}
                          className="group font-mono font-bold text-cyan-600 dark:text-cyan-400 hover:text-cyan-700 dark:hover:text-cyan-300 hover:underline flex items-center gap-1.5 cursor-pointer text-left"
                          title="Click to view & print invoice"
                        >
                          <FileText className="w-3.5 h-3.5 text-cyan-500 group-hover:scale-110 transition-transform shrink-0" />
                          <span>{inv.invoiceNumber}</span>
                        </button>
                      </td>

                      {/* Date */}
                      <td className="py-3.5 px-4 text-slate-500 dark:text-slate-400 whitespace-nowrap">
                        {dateFormatted}
                      </td>

                      {/* Customer with Phone */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <p className="font-semibold text-slate-900 dark:text-slate-100">{inv.partyName}</p>
                        {inv.partyPhone && (
                          <p className="font-mono text-[10px] text-slate-400 dark:text-slate-500">
                            Ph: {inv.partyPhone}
                          </p>
                        )}
                      </td>

                      {/* Payment Mode */}
                      <td className="py-3.5 px-4 font-mono text-[11px] text-slate-600 dark:text-slate-400 whitespace-nowrap">
                        {inv.paymentMode || 'CASH'}
                      </td>

                      {/* Subtotal */}
                      <td className="py-3.5 px-4 text-right font-mono font-medium text-slate-700 dark:text-slate-300 whitespace-nowrap">
                        {formatINR(inv.subTotal)}
                      </td>

                      {/* Extra / Disc */}
                      <td className="py-3.5 px-4 text-right font-mono text-[11px] whitespace-nowrap">
                        {inv.extraCharges > 0 && (
                          <span className="text-slate-600 dark:text-slate-300">+{formatINR(inv.extraCharges)} </span>
                        )}
                        {inv.discountTotal > 0 && (
                          <span className="text-rose-500">-{formatINR(inv.discountTotal)}</span>
                        )}
                        {!inv.extraCharges && !inv.discountTotal && (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>

                      {/* Grand Total */}
                      <td className="py-3.5 px-4 text-right font-mono font-black text-slate-900 dark:text-slate-100 text-sm whitespace-nowrap">
                        {formatINR(inv.grandTotal)}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <Badge
                          variant={
                            inv.paymentStatus === 'PAID'
                              ? 'success'
                              : inv.paymentStatus === 'PARTIAL'
                              ? 'warning'
                              : 'danger'
                          }
                        >
                          {inv.paymentStatus}
                        </Badge>
                      </td>

                      {/* Actions - Circular Buttons Matching Purchases */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* 1. View Invoice Overview */}
                          <button
                            type="button"
                            onClick={() => setSelectedInvoiceForView(getEnrichedInvoiceWithCustomerDue(inv))}
                            title="View Invoice Details"
                            className="w-8 h-8 rounded-full flex items-center justify-center bg-cyan-50 hover:bg-cyan-100 text-cyan-700 dark:bg-cyan-950/50 dark:hover:bg-cyan-900/60 dark:text-cyan-400 border border-cyan-200 dark:border-cyan-800 shadow-xs transition-all active:scale-90 cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          {/* 2. Print Non-GST Invoice */}
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedInvoiceForView(getEnrichedInvoiceWithCustomerDue(inv));
                              setTimeout(() => window.print(), 350);
                            }}
                            title="Print Non-GST Invoice"
                            className="w-8 h-8 rounded-full flex items-center justify-center bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 shadow-xs transition-all active:scale-90 cursor-pointer"
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </button>

                          {/* 3. Share WhatsApp with PDF */}
                          <button
                            type="button"
                            onClick={() => handleWhatsAppShare(inv)}
                            disabled={sharingInvoiceId === inv.id}
                            title="Share Invoice via WhatsApp"
                            className="w-8 h-8 rounded-full flex items-center justify-center bg-emerald-50 hover:bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:hover:bg-emerald-900/60 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 shadow-xs transition-all active:scale-90 disabled:opacity-50 cursor-pointer"
                          >
                            {sharingInvoiceId === inv.id ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Share2 className="w-3.5 h-3.5" />
                            )}
                          </button>

                          {/* 4. Quick Edit Invoice */}
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(inv)}
                            title="Edit Invoice"
                            className="w-8 h-8 rounded-full flex items-center justify-center bg-blue-50 hover:bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:hover:bg-blue-900/60 dark:text-blue-400 border border-blue-200 dark:border-blue-800 shadow-xs transition-all active:scale-90 cursor-pointer"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>

                          {/* 5. Duplicate Invoice */}
                          <button
                            type="button"
                            onClick={() => router.push(`/app/non-gst-sales/new?duplicate=${inv.id}`)}
                            title="Duplicate Invoice"
                            className="w-8 h-8 rounded-full flex items-center justify-center bg-amber-50 hover:bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:hover:bg-amber-900/60 dark:text-amber-400 border border-amber-200 dark:border-amber-800 shadow-xs transition-all active:scale-90 cursor-pointer"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>

                          {/* 6. Delete Invoice */}
                          <button
                            type="button"
                            onClick={() => setDeleteInvoice(inv)}
                            title="Delete Invoice"
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

      {/* View / Print A4 Non-GST Invoice Modal */}
      <Modal
        isOpen={!!selectedInvoiceForView}
        onClose={() => setSelectedInvoiceForView(null)}
        title={`Non-GST Invoice #${selectedInvoiceForView?.invoiceNumber}`}
        subtitle="Standard Non-GST Bill of Supply format with PDF export & WhatsApp share"
        maxWidth="4xl"
      >
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 p-2 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 no-print">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Customer:{' '}
                <span className="text-cyan-600 dark:text-cyan-400">{selectedInvoiceForView?.partyName}</span>
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => handleDownloadPdf(selectedInvoiceForView)}
                disabled={downloadingInvoiceId === selectedInvoiceForView?.id}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-700 transition-all cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Download PDF</span>
              </button>
              <button
                type="button"
                onClick={() => handleWhatsAppShare(selectedInvoiceForView)}
                disabled={sharingInvoiceId === selectedInvoiceForView?.id}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-600/30 transition-all cursor-pointer"
              >
                <Share2 className="w-4 h-4" />
                <span>Share WhatsApp</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  const toEdit = selectedInvoiceForView;
                  setSelectedInvoiceForView(null);
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
                className="flex items-center gap-1.5 px-3.5 py-1.5 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl text-xs font-bold shadow-md shadow-cyan-600/30 transition-all cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>Print Bill</span>
              </button>
            </div>
          </div>

          {selectedInvoiceForView && (
            <NonGstInvoiceTemplate
              business={
                business || {
                  name: 'RAHUL JEE TRADING COMPANY',
                  legalName: 'RAHUL JEE TRADING COMPANY',
                  state: 'Uttar Pradesh',
                  stateCode: '09',
                  phone: '8887754821',
                  email: 'rahuljee1217@gmail.com',
                  address: 'Allahabad Bank Road, Yusufpur, Mohammadabad, Dist- Ghazipur (U.P.) - 233227',
                  bankName: 'HDFC Bank Ltd',
                  bankAccountNo: '50200088991122',
                  bankIfsc: 'HDFC0001234',
                  upiId: '8887754821@upi',
                }
              }
              invoice={getEnrichedInvoiceWithCustomerDue(selectedInvoiceForView) || selectedInvoiceForView}
            />
          )}
        </div>
      </Modal>

      {/* Record New Non-GST Invoice In-Page Modal */}
      <Modal
        isOpen={isNewModalOpen}
        onClose={() => setIsNewModalOpen(false)}
        title="Record Non-GST Sales Invoice"
        subtitle="Create clean tax-free commercial invoice without GST calculation"
        maxWidth="4xl"
      >
        <form onSubmit={handleSaveNewInvoice} className="space-y-4">
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
                Delivery Address
              </label>
              <input
                type="text"
                placeholder="Optional"
                value={newPartyAddress}
                onChange={(e) => setNewPartyAddress(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100"
              />
            </div>
          </div>

          {/* Optional Custom Fill: Company / Seller Details */}
          <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase text-slate-600 dark:text-slate-400">
                Company / Seller Details (Optional - Custom Fill)
              </span>
              <span className="text-[10px] text-slate-400">
                Leave empty for no company name/details on invoice
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Company / Seller Name
                </label>
                <input
                  type="text"
                  placeholder="Custom name or leave blank"
                  value={newFromName}
                  onChange={(e) => setNewFromName(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Phone Number
                </label>
                <input
                  type="text"
                  placeholder="Optional"
                  value={newFromPhone}
                  onChange={(e) => setNewFromPhone(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Address / Location
                </label>
                <input
                  type="text"
                  placeholder="Optional"
                  value={newFromAddress}
                  onChange={(e) => setNewFromAddress(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100"
                />
              </div>
            </div>
          </div>

          {/* Line Items */}
          <div className="space-y-2 pt-2">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold uppercase text-slate-600 dark:text-slate-400">
                Non-GST Line Items
              </span>
              <button
                type="button"
                onClick={() => addItem(false)}
                title="Add Item (Shortcut: F2)"
                className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-cyan-50 dark:bg-cyan-950/50 hover:bg-cyan-100 dark:hover:bg-cyan-900/50 text-cyan-700 dark:text-cyan-300 text-xs font-bold rounded-lg border border-cyan-200 dark:border-cyan-800 transition-colors shadow-xs cursor-pointer active:scale-95"
              >
                <span>+ Add Item</span>
                <kbd className="px-1.5 py-0.2 text-[9px] bg-white dark:bg-slate-900 text-cyan-800 dark:text-cyan-200 border border-cyan-300 dark:border-cyan-700 rounded font-mono font-bold shadow-xs">
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
                    <th className="py-2 px-2 text-right">Price / Unit (₹)</th>
                    <th className="py-2 px-2 text-right">Total (₹)</th>
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
                      <td className="py-2 px-2 w-24 text-center">
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
                      <td className="py-2 px-2 w-28 text-right">
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
                      <td className="py-2 px-2 w-32 text-right font-mono font-bold text-slate-900 dark:text-slate-100">
                        {formatINR(item.totalAmount || 0, false)}
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

          {/* Charges & Payment */}
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

              <div className="grid grid-cols-2 gap-2 pt-1">
                <div>
                  <label className="block font-semibold text-slate-600 dark:text-slate-400 text-[11px] mb-1">
                    Charge Name
                  </label>
                  <input
                    type="text"
                    value={newExtraChargeName}
                    onChange={(e) => setNewExtraChargeName(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-600 dark:text-slate-400 text-[11px] mb-1">
                    Extra Amount (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={newExtraCharges}
                    onChange={(e) => setNewExtraCharges(parseFloat(e.target.value) || 0)}
                    className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-mono"
                  />
                </div>
              </div>
            </div>

            <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-200 dark:border-slate-700 space-y-1 text-right">
              <p className="text-slate-500 dark:text-slate-400">Subtotal: {formatINR(newSubTotal)}</p>
              {newExtraCharges > 0 && (
                <p className="text-slate-500 dark:text-slate-400">
                  {newExtraChargeName}: +{formatINR(newExtraCharges)}
                </p>
              )}
              <p className="text-base font-black text-slate-900 dark:text-slate-100 font-mono">
                Total: {formatINR(newGrandTotal)}
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
              className="flex items-center gap-2 px-5 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl text-xs font-bold shadow-md shadow-cyan-600/30 active:scale-95 cursor-pointer disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{savingNew ? 'Saving...' : 'Generate Non-GST Invoice'}</span>
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Non-GST Invoice In-Page Modal */}
      <Modal
        isOpen={!!editInvoice}
        onClose={() => setEditInvoice(null)}
        title={`Edit Non-GST Invoice #${editInvoice?.invoiceNumber}`}
        subtitle="Modify items, quantities, rates, customer details, or extra charges"
        maxWidth="4xl"
      >
        {editInvoice && (
          <form onSubmit={handleUpdateInvoice} className="space-y-4">
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
                Delivery Address
              </label>
              <input
                type="text"
                placeholder="Optional"
                value={editPartyAddress}
                onChange={(e) => setEditPartyAddress(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100"
              />
            </div>
          </div>

          {/* Optional Custom Fill: Company / Seller Details */}
          <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase text-slate-600 dark:text-slate-400">
                Company / Seller Details (Optional - Custom Fill)
              </span>
              <span className="text-[10px] text-slate-400">
                Leave empty for no company name/details on invoice
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Company / Seller Name
                </label>
                <input
                  type="text"
                  placeholder="Custom name or leave blank"
                  value={editFromName}
                  onChange={(e) => setEditFromName(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Phone Number
                </label>
                <input
                  type="text"
                  placeholder="Optional"
                  value={editFromPhone}
                  onChange={(e) => setEditFromPhone(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Address / Location
                </label>
                <input
                  type="text"
                  placeholder="Optional"
                  value={editFromAddress}
                  onChange={(e) => setEditFromAddress(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100"
                />
              </div>
            </div>
          </div>

          {/* Edit Line items */}
          <div className="space-y-2 pt-2">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold uppercase text-slate-600 dark:text-slate-400">
                Non-GST Line Items
              </span>
              <button
                type="button"
                onClick={() => addItem(true)}
                title="Add Item (Shortcut: F2)"
                className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-cyan-50 dark:bg-cyan-950/50 hover:bg-cyan-100 dark:hover:bg-cyan-900/50 text-cyan-700 dark:text-cyan-300 text-xs font-bold rounded-lg border border-cyan-200 dark:border-cyan-800 transition-colors shadow-xs cursor-pointer active:scale-95"
              >
                <span>+ Add Item</span>
                <kbd className="px-1.5 py-0.2 text-[9px] bg-white dark:bg-slate-900 text-cyan-800 dark:text-cyan-200 border border-cyan-300 dark:border-cyan-700 rounded font-mono font-bold shadow-xs">
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
                    <th className="py-2 px-2 text-right">Price / Unit (₹)</th>
                    <th className="py-2 px-2 text-right">Total (₹)</th>
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
                      <td className="py-2 px-2 w-24 text-center">
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
                      <td className="py-2 px-2 w-28 text-right">
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
                      <td className="py-2 px-2 w-32 text-right font-mono font-bold text-slate-900 dark:text-slate-100">
                        {formatINR(item.totalAmount || 0, false)}
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

          {/* Charges & Payment */}
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

              <div className="grid grid-cols-2 gap-2 pt-1">
                <div>
                  <label className="block font-semibold text-slate-600 dark:text-slate-400 text-[11px] mb-1">
                    Charge Name
                  </label>
                  <input
                    type="text"
                    value={editExtraChargeName}
                    onChange={(e) => setEditExtraChargeName(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-600 dark:text-slate-400 text-[11px] mb-1">
                    Extra Amount (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={editExtraCharges}
                    onChange={(e) => setEditExtraCharges(parseFloat(e.target.value) || 0)}
                    className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-mono"
                  />
                </div>
              </div>
            </div>

            <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-200 dark:border-slate-700 space-y-1 text-right">
              <p className="text-slate-500 dark:text-slate-400">Subtotal: {formatINR(editSubTotal)}</p>
              {editExtraCharges > 0 && (
                <p className="text-slate-500 dark:text-slate-400">
                  {editExtraChargeName}: +{formatINR(editExtraCharges)}
                </p>
              )}
              <p className="text-base font-black text-slate-900 dark:text-slate-100 font-mono">
                Total: {formatINR(editGrandTotal)}
              </p>
            </div>
          </div>

          <div className="flex justify-between items-center pt-3">
            <Link
              href={`/app/non-gst-sales/edit/${editInvoice?.id || ''}`}
              className="text-xs font-semibold text-cyan-600 dark:text-cyan-400 hover:underline"
            >
              Open in full page editor →
            </Link>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setEditInvoice(null)}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={updating}
                className="flex items-center gap-2 px-5 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl text-xs font-bold shadow-md shadow-cyan-600/30 active:scale-95 cursor-pointer disabled:opacity-50"
              >
                {updating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                <span>{updating ? 'Saving Updates...' : 'Update Non-GST Invoice'}</span>
              </button>
            </div>
          </div>
        </form>
        )}
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deleteInvoice}
        onClose={() => setDeleteInvoice(null)}
        title="Delete Non-GST Invoice"
        subtitle="Warning: This action will permanently remove this invoice record."
        maxWidth="sm"
      >
        {deleteInvoice && (
        <div className="space-y-4">
          <div className="p-3 bg-amber-50 dark:bg-amber-950/40 rounded-xl border border-amber-200 dark:border-amber-800 flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <p className="text-[11px] text-amber-800 dark:text-amber-300 leading-relaxed">
              Are you sure you want to delete Non-GST Invoice{' '}
              <strong className="font-mono text-slate-900 dark:text-slate-100">
                #{deleteInvoice?.invoiceNumber}
              </strong>{' '}
              for <strong className="text-slate-900 dark:text-slate-100">{deleteInvoice?.partyName}</strong> for{' '}
              <strong className="text-cyan-600 dark:text-cyan-400">{formatINR(deleteInvoice?.grandTotal || 0)}</strong>?
            </p>
          </div>

          <div className="flex justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={() => setDeleteInvoice(null)}
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
              <span>{deleting ? 'Deleting...' : 'Yes, Delete Invoice'}</span>
            </button>
          </div>
        </div>
        )}
      </Modal>
    </div>
  );
}
