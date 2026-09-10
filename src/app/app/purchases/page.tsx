'use client';

import React, { useState, useEffect } from 'react';
import { formatINR } from '@/lib/currency';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { ItemSearchInput } from '@/components/billing/ItemSearchInput';
import { calculateInvoiceGst } from '@/lib/gst-engine';
import { InvoiceItemDraft } from '@/types';
import { PurchaseBillA4Template } from '@/components/printing/PurchaseBillA4Template';
import { downloadPurchaseBillPdf, sharePurchaseBillWithPdf } from '@/lib/pdfGenerator';
import {
  ShoppingCart,
  Plus,
  Search,
  Save,
  Trash2,
  Eye,
  Printer,
  Share2,
  Download,
  Edit,
  FileText,
  CheckCircle2,
  AlertTriangle,
  Loader2
} from 'lucide-react';

export default function PurchasesPage() {
  const [purchases, setPurchases] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [business, setBusiness] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // New Purchase Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const [partyId, setPartyId] = useState('');
  const [partyName, setPartyName] = useState('');
  const [partyGstin, setPartyGstin] = useState('');
  const [partyPhone, setPartyPhone] = useState('');
  const [customBillNumber, setCustomBillNumber] = useState('');
  const [paymentMode, setPaymentMode] = useState('BANK');

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

  const [items, setItems] = useState<InvoiceItemDraft[]>([{ ...defaultDraftItem }]);

  // Modals & Action States
  const [selectedPurchaseForBill, setSelectedPurchaseForBill] = useState<any | null>(null);
  const [sharingPurchaseId, setSharingPurchaseId] = useState<string | null>(null);
  const [downloadingPurchaseId, setDownloadingPurchaseId] = useState<string | null>(null);

  // Edit Purchase State
  const [editPurchase, setEditPurchase] = useState<any | null>(null);
  const [editPartyId, setEditPartyId] = useState('');
  const [editPartyName, setEditPartyName] = useState('');
  const [editPartyGstin, setEditPartyGstin] = useState('');
  const [editPartyPhone, setEditPartyPhone] = useState('');
  const [editCustomBillNumber, setEditCustomBillNumber] = useState('');
  const [editPaymentMode, setEditPaymentMode] = useState('BANK');
  const [editItems, setEditItems] = useState<InvoiceItemDraft[]>([]);
  const [editNotes, setEditNotes] = useState('');
  const [updating, setUpdating] = useState(false);

  // Delete Purchase State
  const [deletePurchase, setDeletePurchase] = useState<any | null>(null);
  const [deleting, setDeleting] = useState(false);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const loadData = async () => {
    try {
      setLoading(true);
      const [purRes, supRes, prodRes, bRes] = await Promise.all([
        fetch('/api/purchases').then((r) => r.json()).catch(() => ({ purchases: [] })),
        fetch('/api/parties?type=SUPPLIER').then((r) => r.json()).catch(() => ({ parties: [] })),
        fetch('/api/products').then((r) => r.json()).catch(() => ({ products: [] })),
        fetch('/api/business').then((r) => r.json()).catch(() => ({ business: null })),
      ]);

      if (purRes.success && purRes.purchases) setPurchases(purRes.purchases);
      if (supRes.success && supRes.parties) setSuppliers(supRes.parties);
      if (prodRes.success && prodRes.products) setProducts(prodRes.products);
      if (bRes.success && bRes.business) setBusiness(bRes.business);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSupplierSelect = (sId: string, isEdit = false) => {
    const sup = suppliers.find((s) => s.id === sId);
    if (isEdit) {
      setEditPartyId(sId);
      if (sup) {
        setEditPartyName(sup.name);
        setEditPartyGstin(sup.gstin || '');
        setEditPartyPhone(sup.phone || '');
      }
    } else {
      setPartyId(sId);
      if (sup) {
        setPartyName(sup.name);
        setPartyGstin(sup.gstin || '');
        setPartyPhone(sup.phone || '');
      }
    }
  };

  const handleProductSelect = (index: number, productOrId: any, isEdit = false) => {
    if (!productOrId || productOrId === '') return;
    const prod = typeof productOrId === 'object' ? productOrId : products.find((p) => p.id === productOrId);
    if (!prod) return;

    if (isEdit) {
      const newItems = [...editItems];
      newItems[index] = {
        ...newItems[index],
        productId: prod.id,
        productName: prod.name,
        hsnCode: prod.hsnCode || '',
        unitPrice: prod.purchasePrice || 0,
        gstRate: prod.gstRate || 18,
      };
      setEditItems(newItems);
    } else {
      const newItems = [...items];
      newItems[index] = {
        ...newItems[index],
        productId: prod.id,
        productName: prod.name,
        hsnCode: prod.hsnCode || '',
        unitPrice: prod.purchasePrice || 0,
        gstRate: prod.gstRate || 18,
      };
      setItems(newItems);
    }
  };

  const updateItem = (index: number, field: keyof InvoiceItemDraft, val: any, isEdit = false) => {
    if (isEdit) {
      const newItems = [...editItems];
      newItems[index] = { ...newItems[index], [field]: val };
      setEditItems(newItems);
    } else {
      const newItems = [...items];
      newItems[index] = { ...newItems[index], [field]: val };
      setItems(newItems);
    }
  };

  const addItem = (isEdit = false) => {
    if (isEdit) {
      setEditItems([...editItems, { ...defaultDraftItem }]);
    } else {
      setItems([...items, { ...defaultDraftItem }]);
    }
  };

  const removeItem = (index: number, isEdit = false) => {
    if (isEdit) {
      if (editItems.length <= 1) return;
      setEditItems(editItems.filter((_, i) => i !== index));
    } else {
      if (items.length <= 1) return;
      setItems(items.filter((_, i) => i !== index));
    }
  };

  // Keyboard shortcut listener: F2 to Add Item
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F2') {
        if (isModalOpen) {
          e.preventDefault();
          addItem(false);
        } else if (editPurchase) {
          e.preventDefault();
          addItem(true);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isModalOpen, editPurchase, items, editItems]);

  // Calculations for New Purchase
  const gstSummary = calculateInvoiceGst(
    business?.stateCode || '07',
    business?.stateCode || '07',
    items.map((it) => ({
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

  // Calculations for Edit Purchase
  const editGstSummary = calculateInvoiceGst(
    business?.stateCode || '07',
    business?.stateCode || '07',
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

  const handleSavePurchase = async (e: React.FormEvent) => {
    e.preventDefault();
    const validItems = gstSummary.items.filter((it) => it.productName.trim() && it.quantity > 0);
    if (validItems.length === 0) {
      alert('Please add valid products');
      return;
    }

    try {
      setSaving(true);
      const res = await fetch('/api/purchases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          partyId: partyId || null,
          partyName,
          partyGstin,
          partyPhone,
          customBillNumber,
          paymentMode,
          paidAmount: paymentMode === 'CREDIT' ? 0 : gstSummary.grandTotal,
          items: validItems,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setIsModalOpen(false);
        showToast('Purchase bill recorded and stock incremented successfully!');
        // Reset form
        setPartyId('');
        setPartyName('');
        setPartyGstin('');
        setPartyPhone('');
        setCustomBillNumber('');
        setItems([{ ...defaultDraftItem }]);
        loadData();
      } else {
        alert('Error: ' + data.error);
      }
    } catch (err: any) {
      alert('Error: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  // Open Edit Modal
  const handleOpenEdit = (p: any) => {
    setEditPurchase(p);
    setEditPartyId(p.partyId || '');
    setEditPartyName(p.partyName || '');
    setEditPartyGstin(p.partyGstin || '');
    setEditPartyPhone(p.partyPhone || '');
    setEditCustomBillNumber(p.billNumber || '');
    setEditPaymentMode(p.paymentMode || 'BANK');
    setEditNotes(p.notes || '');

    const mappedItems: InvoiceItemDraft[] = (p.items || []).map((it: any) => ({
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

  const handleUpdatePurchase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editPurchase) return;

    const validItems = editGstSummary.items.filter((it) => it.productName.trim() && it.quantity > 0);
    if (validItems.length === 0) {
      alert('Please add valid products');
      return;
    }

    try {
      setUpdating(true);
      const res = await fetch(`/api/purchases/${editPurchase.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          partyId: editPartyId || null,
          partyName: editPartyName,
          partyGstin: editPartyGstin,
          partyPhone: editPartyPhone,
          customBillNumber: editCustomBillNumber,
          paymentMode: editPaymentMode,
          paidAmount: editPaymentMode === 'CREDIT' ? 0 : editGstSummary.grandTotal,
          notes: editNotes,
          items: validItems,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setEditPurchase(null);
        showToast(`Purchase bill #${editCustomBillNumber || editPurchase.billNumber} updated successfully!`);
        loadData();
      } else {
        alert('Error: ' + data.error);
      }
    } catch (err: any) {
      alert('Error: ' + err.message);
    } finally {
      setUpdating(false);
    }
  };

  // Handle Delete
  const handleDeletePurchase = async () => {
    if (!deletePurchase) return;
    try {
      setDeleting(true);
      const res = await fetch(`/api/purchases/${deletePurchase.id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        showToast(`Purchase bill #${deletePurchase.billNumber} deleted and stock reversed successfully!`);
        setDeletePurchase(null);
        loadData();
      } else {
        alert('Error: ' + data.error);
      }
    } catch (err: any) {
      alert('Error: ' + err.message);
    } finally {
      setDeleting(false);
    }
  };

  // Print, Download, Share handlers
  const handlePrint = () => {
    const prev = document.title;
    document.title = ' ';
    window.print();
    setTimeout(() => {
      document.title = prev;
    }, 1000);
  };

  const handleDownloadPdf = async (p: any) => {
    try {
      setDownloadingPurchaseId(p.id);
      await downloadPurchaseBillPdf(p, business);
      showToast(`Purchase bill #${p.billNumber} PDF downloaded!`);
    } catch (err: any) {
      console.error(err);
      alert('Failed to download PDF: ' + err.message);
    } finally {
      setDownloadingPurchaseId(null);
    }
  };

  const handleWhatsAppShare = async (p: any) => {
    try {
      setSharingPurchaseId(p.id);
      const supFromList = suppliers.find(
        (s: any) =>
          (p.partyId && s.id === p.partyId) ||
          (p.partyName && s.name?.trim().toLowerCase() === p.partyName?.trim().toLowerCase())
      );
      const enrichedPurchase = {
        ...p,
        partyPhone:
          p.partyPhone ||
          p.party?.phone ||
          p.party?.mobile ||
          supFromList?.phone ||
          supFromList?.mobile ||
          '',
      };
      await sharePurchaseBillWithPdf(enrichedPurchase, business, (msg) => showToast(msg));
    } catch (err: any) {
      console.error(err);
      alert('Failed to share bill: ' + err.message);
    } finally {
      setSharingPurchaseId(null);
    }
  };

  const safePurchases = Array.isArray(purchases) ? purchases : [];

  const filteredPurchases = safePurchases.filter(
    (p) =>
      (p?.billNumber || '').toLowerCase().includes(search.toLowerCase()) ||
      (p?.partyName || '').toLowerCase().includes(search.toLowerCase())
  );

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
            <ShoppingCart className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <span>Purchases & Vendor Inward</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 sm:mt-1">
            Record supplier bills, update stock automatically, and manage accounts payable
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-600/30 transition-all active:scale-95 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Record Purchase Bill</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="bg-white dark:bg-slate-900 p-3 sm:p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between transition-colors duration-150">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by bill # or supplier name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          />
        </div>
      </div>

      {/* Purchases Data Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden transition-colors duration-150">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/60 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase border-b border-slate-200 dark:border-slate-800">
                <th className="py-3 px-4 whitespace-nowrap">Bill No</th>
                <th className="py-3 px-4 whitespace-nowrap">Date</th>
                <th className="py-3 px-4 whitespace-nowrap">Supplier</th>
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
                    Loading purchases...
                  </td>
                </tr>
              ) : filteredPurchases.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400 text-xs">
                    No purchase bills recorded yet.
                  </td>
                </tr>
              ) : (
                filteredPurchases.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                    {/* Clickable Bill Number */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => setSelectedPurchaseForBill(p)}
                        className="group font-mono font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 hover:underline flex items-center gap-1.5 cursor-pointer text-left"
                        title="Click to view & print purchase bill"
                      >
                        <FileText className="w-3.5 h-3.5 text-indigo-500 group-hover:scale-110 transition-transform shrink-0" />
                        <span>{p.billNumber}</span>
                      </button>
                    </td>
                    <td className="py-3.5 px-4 text-slate-500 dark:text-slate-400 whitespace-nowrap">
                      {new Date(p.billDate).toLocaleDateString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <p className="font-semibold text-slate-900 dark:text-slate-100">{p.partyName}</p>
                      {p.partyGstin && (
                        <p className="font-mono text-[10px] text-slate-400 dark:text-slate-500">GST: {p.partyGstin}</p>
                      )}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-[11px] text-slate-600 dark:text-slate-400 whitespace-nowrap">
                      {p.paymentMode}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-medium text-slate-700 dark:text-slate-300 whitespace-nowrap">
                      {formatINR(p.taxableTotal)}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-semibold text-slate-800 dark:text-slate-200 whitespace-nowrap">
                      {formatINR(p.taxTotal)}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-black text-slate-900 dark:text-slate-100 text-sm whitespace-nowrap">
                      {formatINR(p.grandTotal)}
                    </td>
                    <td className="py-3.5 px-4 text-center whitespace-nowrap">
                      <Badge
                        variant={
                          p.paymentStatus === 'PAID'
                            ? 'success'
                            : p.paymentStatus === 'PARTIAL'
                            ? 'warning'
                            : 'danger'
                        }
                      >
                        {p.paymentStatus}
                      </Badge>
                    </td>

                    {/* Circular Action Buttons */}
                    <td className="py-3.5 px-4 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1.5">
                        {/* 1. View Purchase Bill */}
                        <button
                          type="button"
                          onClick={() => setSelectedPurchaseForBill(p)}
                          title="View Bill Details"
                          className="w-8 h-8 rounded-full flex items-center justify-center bg-cyan-50 hover:bg-cyan-100 text-cyan-700 dark:bg-cyan-950/50 dark:hover:bg-cyan-900/60 dark:text-cyan-400 border border-cyan-200 dark:border-cyan-800 shadow-xs transition-all active:scale-90 cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>

                        {/* 2. Print Purchase Bill */}
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedPurchaseForBill(p);
                            setTimeout(() => window.print(), 350);
                          }}
                          title="Print Purchase Bill"
                          className="w-8 h-8 rounded-full flex items-center justify-center bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 shadow-xs transition-all active:scale-90 cursor-pointer"
                        >
                          <Printer className="w-3.5 h-3.5" />
                        </button>

                        {/* 3. Share WhatsApp */}
                        <button
                          type="button"
                          onClick={() => handleWhatsAppShare(p)}
                          disabled={sharingPurchaseId === p.id}
                          title="Share Bill via WhatsApp"
                          className="w-8 h-8 rounded-full flex items-center justify-center bg-emerald-50 hover:bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:hover:bg-emerald-900/60 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 shadow-xs transition-all active:scale-90 disabled:opacity-50 cursor-pointer"
                        >
                          <Share2 className="w-3.5 h-3.5" />
                        </button>

                        {/* 4. Edit Purchase Bill */}
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(p)}
                          title="Edit Purchase Bill"
                          className="w-8 h-8 rounded-full flex items-center justify-center bg-blue-50 hover:bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:hover:bg-blue-900/60 dark:text-blue-400 border border-blue-200 dark:border-blue-800 shadow-xs transition-all active:scale-90 cursor-pointer"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>

                        {/* 5. Delete Purchase Bill */}
                        <button
                          type="button"
                          onClick={() => setDeletePurchase(p)}
                          title="Delete Purchase Bill & Reverse Stock"
                          className="w-8 h-8 rounded-full flex items-center justify-center bg-rose-50 hover:bg-rose-100 text-rose-700 dark:bg-rose-950/50 dark:hover:bg-rose-900/60 dark:text-rose-400 border border-rose-200 dark:border-rose-800 shadow-xs transition-all active:scale-90 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* View / Print Purchase Bill Modal */}
      <Modal
        isOpen={!!selectedPurchaseForBill}
        onClose={() => setSelectedPurchaseForBill(null)}
        title={`Purchase Inward Voucher #${selectedPurchaseForBill?.billNumber}`}
        subtitle="Standard A4 Goods Inward Memo & Supplier Invoice Record"
        maxWidth="4xl"
      >
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 p-2 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 no-print">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Supplier: <span className="text-indigo-600 dark:text-indigo-400">{selectedPurchaseForBill?.partyName}</span>
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => handleDownloadPdf(selectedPurchaseForBill)}
                disabled={downloadingPurchaseId === selectedPurchaseForBill?.id}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-700 transition-all cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Download PDF</span>
              </button>
              <button
                type="button"
                onClick={() => handleWhatsAppShare(selectedPurchaseForBill)}
                disabled={sharingPurchaseId === selectedPurchaseForBill?.id}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-600/30 transition-all cursor-pointer"
              >
                <Share2 className="w-4 h-4" />
                <span>Share WhatsApp</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  const toEdit = selectedPurchaseForBill;
                  setSelectedPurchaseForBill(null);
                  handleOpenEdit(toEdit);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-600/30 transition-all cursor-pointer"
              >
                <Edit className="w-4 h-4" />
                <span>Edit Bill</span>
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

          {selectedPurchaseForBill && (
            <PurchaseBillA4Template
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
                }
              }
              purchase={selectedPurchaseForBill}
            />
          )}
        </div>
      </Modal>

      {/* Record New Purchase Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Record Supplier Purchase Bill"
        subtitle="Increments warehouse stock and creates Accounts Payable entry"
        maxWidth="4xl"
      >
        <form onSubmit={handleSavePurchase} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Select Supplier</label>
              <select
                value={partyId}
                onChange={(e) => handleSupplierSelect(e.target.value, false)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100"
              >
                <option value="">-- Choose Supplier --</option>
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Supplier Name</label>
              <input
                type="text"
                required
                value={partyName}
                onChange={(e) => setPartyName(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Supplier GSTIN</label>
              <input
                type="text"
                placeholder="Optional"
                value={partyGstin}
                onChange={(e) => setPartyGstin(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono text-slate-900 dark:text-slate-100"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Vendor Bill Number</label>
              <input
                type="text"
                placeholder="e.g. HUL/DEL/2026/891"
                value={customBillNumber}
                onChange={(e) => setCustomBillNumber(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono text-slate-900 dark:text-slate-100"
              />
            </div>
          </div>

          {/* Line items */}
          <div className="space-y-2 pt-2">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold uppercase text-slate-600 dark:text-slate-400">Inward Line Items</span>
              <button
                type="button"
                onClick={() => addItem(false)}
                title="Add Item (Shortcut: F2)"
                className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-indigo-50 dark:bg-indigo-950/50 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 text-xs font-bold rounded-lg border border-indigo-200 dark:border-indigo-800 transition-colors shadow-xs cursor-pointer active:scale-95"
              >
                <span>+ Add Item</span>
                <kbd className="px-1.5 py-0.2 text-[9px] bg-white dark:bg-slate-900 text-indigo-800 dark:text-indigo-200 border border-indigo-300 dark:border-indigo-700 rounded font-mono font-bold shadow-xs">
                  F2
                </kbd>
              </button>
            </div>

            <div className="overflow-x-auto min-h-[220px] pb-12">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-100 dark:bg-slate-800/60 text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase">
                    <th className="py-2 px-2 min-w-[200px]">Item</th>
                    <th className="py-2 px-2 text-center">Qty</th>
                    <th className="py-2 px-2 text-right">Cost Rate (₹)</th>
                    <th className="py-2 px-2 text-center">GST %</th>
                    <th className="py-2 px-2 text-right">Total</th>
                    <th className="py-2 px-1"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {items.map((item, idx) => (
                    <tr key={idx}>
                      <td className="py-2 px-2 min-w-[200px] relative">
                        <ItemSearchInput
                          value={item.productName}
                          onChange={(val) => updateItem(idx, 'productName', val, false)}
                          onSelectProduct={(prod) => handleProductSelect(idx, prod, false)}
                          products={products}
                          priceType="purchase"
                          placeholder="Item name (e.g. JAU AATA)"
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
                        {formatINR(gstSummary.items[idx]?.totalAmount || 0, false)}
                      </td>
                      <td className="py-2 px-1 text-center">
                        <button
                          type="button"
                          onClick={() => removeItem(idx, false)}
                          disabled={items.length <= 1}
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
                value={paymentMode}
                onChange={(e) => setPaymentMode(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-slate-900 dark:text-slate-100"
              >
                <option value="BANK">Bank Transfer / NEFT / RTGS</option>
                <option value="UPI">UPI Payment</option>
                <option value="CASH">Cash in Hand</option>
                <option value="CREDIT">Supplier Credit (Payable Later)</option>
              </select>
            </div>

            <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-200 dark:border-slate-700 space-y-1 text-right">
              <p className="text-slate-500 dark:text-slate-400">Taxable: {formatINR(gstSummary.taxableTotal)}</p>
              <p className="text-slate-500 dark:text-slate-400">Input GST Credit: {formatINR(gstSummary.taxTotal)}</p>
              <p className="text-base font-black text-slate-900 dark:text-slate-100 font-mono">
                Total: {formatINR(gstSummary.grandTotal)}
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-3">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-600/30 active:scale-95 cursor-pointer disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Saving...' : 'Record Inward Bill'}</span>
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Purchase Modal */}
      <Modal
        isOpen={!!editPurchase}
        onClose={() => setEditPurchase(null)}
        title={`Edit Purchase Bill #${editPurchase?.billNumber}`}
        subtitle="Modify inward quantities, prices, supplier details, or tax rates"
        maxWidth="4xl"
      >
        <form onSubmit={handleUpdatePurchase} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Select Supplier</label>
              <select
                value={editPartyId}
                onChange={(e) => handleSupplierSelect(e.target.value, true)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100"
              >
                <option value="">-- Choose Supplier --</option>
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Supplier Name</label>
              <input
                type="text"
                required
                value={editPartyName}
                onChange={(e) => setEditPartyName(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Supplier GSTIN</label>
              <input
                type="text"
                placeholder="Optional"
                value={editPartyGstin}
                onChange={(e) => setEditPartyGstin(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono text-slate-900 dark:text-slate-100"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Vendor Bill Number</label>
              <input
                type="text"
                value={editCustomBillNumber}
                onChange={(e) => setEditCustomBillNumber(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono text-slate-900 dark:text-slate-100"
              />
            </div>
          </div>

          {/* Edit Line items */}
          <div className="space-y-2 pt-2">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold uppercase text-slate-600 dark:text-slate-400">Inward Line Items</span>
              <button
                type="button"
                onClick={() => addItem(true)}
                title="Add Item (Shortcut: F2)"
                className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-indigo-50 dark:bg-indigo-950/50 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 text-xs font-bold rounded-lg border border-indigo-200 dark:border-indigo-800 transition-colors shadow-xs cursor-pointer active:scale-95"
              >
                <span>+ Add Item</span>
                <kbd className="px-1.5 py-0.2 text-[9px] bg-white dark:bg-slate-900 text-indigo-800 dark:text-indigo-200 border border-indigo-300 dark:border-indigo-700 rounded font-mono font-bold shadow-xs">
                  F2
                </kbd>
              </button>
            </div>

            <div className="overflow-x-auto min-h-[220px] pb-12">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-100 dark:bg-slate-800/60 text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase">
                    <th className="py-2 px-2 min-w-[200px]">Item</th>
                    <th className="py-2 px-2 text-center">Qty</th>
                    <th className="py-2 px-2 text-right">Cost Rate (₹)</th>
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
                          priceType="purchase"
                          placeholder="Item name (e.g. JAU AATA)"
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
                <option value="BANK">Bank Transfer / NEFT / RTGS</option>
                <option value="UPI">UPI Payment</option>
                <option value="CASH">Cash in Hand</option>
                <option value="CREDIT">Supplier Credit (Payable Later)</option>
              </select>
            </div>

            <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-200 dark:border-slate-700 space-y-1 text-right">
              <p className="text-slate-500 dark:text-slate-400">Taxable: {formatINR(editGstSummary.taxableTotal)}</p>
              <p className="text-slate-500 dark:text-slate-400">Input GST Credit: {formatINR(editGstSummary.taxTotal)}</p>
              <p className="text-base font-black text-slate-900 dark:text-slate-100 font-mono">
                Total: {formatINR(editGstSummary.grandTotal)}
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-3">
            <button
              type="button"
              onClick={() => setEditPurchase(null)}
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
              <span>{updating ? 'Saving Updates...' : 'Update Purchase Bill'}</span>
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deletePurchase}
        onClose={() => setDeletePurchase(null)}
        title="Delete Purchase Bill"
        subtitle="Warning: Warehouse inventory and supplier balances will be reversed automatically."
        maxWidth="sm"
      >
        <div className="space-y-4">
          <div className="p-3 bg-amber-50 dark:bg-amber-950/40 rounded-xl border border-amber-200 dark:border-amber-800 flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <p className="text-[11px] text-amber-800 dark:text-amber-300 leading-relaxed">
              Deleting this purchase bill will automatically decrease the warehouse stock that was added by this inward receipt.
            </p>
          </div>

          <p className="text-xs text-slate-600 dark:text-slate-300">
            Are you sure you want to delete purchase bill{' '}
            <strong className="font-mono text-slate-900 dark:text-slate-100">
              #{deletePurchase?.billNumber}
            </strong>{' '}
            from <strong className="text-slate-900 dark:text-slate-100">{deletePurchase?.partyName}</strong> for{' '}
            <strong className="text-indigo-600 dark:text-indigo-400">{formatINR(deletePurchase?.grandTotal || 0)}</strong>?
          </p>

          <div className="flex justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={() => setDeletePurchase(null)}
              className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={deleting}
              onClick={handleDeletePurchase}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-600 text-white text-xs font-bold hover:bg-rose-700 disabled:opacity-50 cursor-pointer"
            >
              {deleting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>{deleting ? 'Deleting...' : 'Yes, Delete & Reverse Stock'}</span>
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
