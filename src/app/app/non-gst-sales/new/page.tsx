'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { formatINR } from '@/lib/currency';
import { NonGstInvoiceItemDraft, INDIAN_STATES } from '@/types';
import { ItemSearchInput } from '@/components/billing/ItemSearchInput';
import {
  FileText,
  Plus,
  Trash2,
  Save,
  ArrowLeft,
  Printer,
  Sparkles,
} from 'lucide-react';

const COMMON_UNITS = ['Bag', 'Pcs', 'Box', 'TIN', 'Kg', 'Ltr', 'Pkt', 'Mtr', 'Dozen', 'Quintal', 'Gram'];

function NewNonGstSaleContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const duplicateId = searchParams.get('duplicate');

  // Master data
  const [parties, setParties] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [business, setBusiness] = useState<any>(null);
  const [saving, setSaving] = useState(false);

  // Form State (Custom Fill - Optional)
  const [fromName, setFromName] = useState('');
  const [fromPhone, setFromPhone] = useState('');
  const [fromAddress, setFromAddress] = useState('');

  const [partyId, setPartyId] = useState('');
  const [partyName, setPartyName] = useState('Walk-in Cash Customer');
  const [partyPhone, setPartyPhone] = useState('');
  const [partyAddress, setPartyAddress] = useState('');
  const [partyState, setPartyState] = useState('09-Uttar Pradesh');
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState('');
  const [invoiceNumber, setInvoiceNumber] = useState('');

  // Extra charges & Payment
  const [extraChargeName, setExtraChargeName] = useState('LOADING CHARGE');
  const [extraCharges, setExtraCharges] = useState<number>(0);
  const [paymentMode, setPaymentMode] = useState('UNPAID');
  const [paidAmount, setPaidAmount] = useState<number>(0);
  const [notes, setNotes] = useState('');
  const [terms, setTerms] = useState('Thanks for doing business with us!');

  // Line items
  const [items, setItems] = useState<NonGstInvoiceItemDraft[]>([
    {
      productName: '',
      description: '',
      quantity: 1,
      unit: 'Bag',
      unitPrice: 0,
      discountPercent: 0,
      discountAmount: 0,
      totalAmount: 0,
    },
  ]);

  useEffect(() => {
    // Load business, parties and products
    Promise.all([
      fetch('/api/business').then((r) => r.json()).catch(() => ({ business: null })),
      fetch('/api/parties?type=CUSTOMER').then((r) => r.json()).catch(() => ({ parties: [] })),
      fetch('/api/products').then((r) => r.json()).catch(() => ({ products: [] })),
    ]).then(([bData, pData, prodData]) => {
      if (bData.success && bData.business) {
        setBusiness(bData.business);
        const prefix = bData.business.nonGstPrefix || 'NG-';
        const nextNum = bData.business.nonGstNextNumber || 1;
        setInvoiceNumber(`${prefix}${String(nextNum).padStart(4, '0')}`);
        if (bData.business.state) {
          setPartyState(bData.business.state);
        }
      }
      if (pData.success && pData.parties) setParties(pData.parties);
      if (prodData.success && prodData.products) setProducts(prodData.products);
    });
  }, []);

  // Handle duplicate invoice preloading
  useEffect(() => {
    if (duplicateId) {
      fetch(`/api/non-gst-invoices/${duplicateId}`)
        .then((r) => r.json())
        .then((data) => {
          if (data.success && data.invoice) {
            const inv = data.invoice;
            if (inv.fromName) setFromName(inv.fromName);
            if (inv.fromPhone) setFromPhone(inv.fromPhone);
            if (inv.fromAddress) setFromAddress(inv.fromAddress);
            setPartyId(inv.partyId || '');
            setPartyName(inv.partyName || '');
            setPartyPhone(inv.partyPhone || '');
            setPartyAddress(inv.partyAddress || inv.billingAddress || '');
            setPartyState(inv.partyState || '09-Uttar Pradesh');
            setExtraChargeName(inv.extraChargeName || 'LOADING CHARGE');
            setExtraCharges(inv.extraCharges || 0);
            setPaymentMode(inv.paymentMode || 'UNPAID');
            setNotes(inv.notes || '');
            setTerms(inv.terms || 'Thanks for doing business with us!');
            if (inv.items && inv.items.length > 0) {
              setItems(
                inv.items.map((it: any) => ({
                  productId: it.productId,
                  productName: it.productName,
                  description: it.description || '',
                  quantity: it.quantity,
                  unit: it.unit || 'Bag',
                  unitPrice: it.unitPrice,
                  discountPercent: it.discountPercent || 0,
                  discountAmount: it.discountAmount || 0,
                  totalAmount: it.totalAmount,
                }))
              );
            }
          }
        })
        .catch((err) => console.error('Error duplicating invoice:', err));
    }
  }, [duplicateId]);

  // Handle party selection
  const handlePartySelect = (selectedId: string) => {
    setPartyId(selectedId);
    if (selectedId === '') {
      setPartyName('Walk-in Cash Customer');
      setPartyPhone('');
      setPartyAddress('');
      return;
    }

    const party = parties.find((p) => p.id === selectedId);
    if (party) {
      setPartyName(party.name);
      setPartyPhone(party.phone || '');
      setPartyAddress(party.address || '');
      if (party.state) {
        setPartyState(party.state);
      }
    }
  };

  // Handle product selection on line item
  const handleProductSelect = (index: number, productOrId: any) => {
    const updated = [...items];
    if (!productOrId || productOrId === '') {
      updated[index] = {
        ...updated[index],
        productId: undefined,
        productName: '',
        unitPrice: 0,
        totalAmount: 0,
      };
      setItems(updated);
      return;
    }

    const prod = typeof productOrId === 'object' ? productOrId : products.find((p) => p.id === productOrId);
    if (prod) {
      const qty = updated[index].quantity || 1;
      const rate = prod.salePrice || 0;
      const discAmt = updated[index].discountAmount || 0;
      const lineTotal = Math.max(0, qty * rate - discAmt);

      updated[index] = {
        ...updated[index],
        productId: prod.id,
        productName: prod.name,
        unitPrice: rate,
        unit: prod.unit?.shortName || prod.unit?.name || 'Bag',
        totalAmount: lineTotal,
      };
      setItems(updated);
    }
  };

  // Update item field with live line total calculation
  const updateItem = (index: number, field: keyof NonGstInvoiceItemDraft, value: any) => {
    const updated = [...items];
    const item = { ...updated[index], [field]: value };

    const qty = Number(field === 'quantity' ? value : item.quantity) || 0;
    const rate = Number(field === 'unitPrice' ? value : item.unitPrice) || 0;
    const discPercent = Number(field === 'discountPercent' ? value : item.discountPercent) || 0;
    let discAmount = Number(field === 'discountAmount' ? value : item.discountAmount) || 0;

    const gross = qty * rate;
    if (field === 'discountPercent' && discPercent > 0) {
      discAmount = (gross * discPercent) / 100;
      item.discountAmount = discAmount;
    } else if (field === 'discountAmount') {
      item.discountPercent = gross > 0 ? (discAmount / gross) * 100 : 0;
    }

    item.totalAmount = Math.max(0, gross - (item.discountAmount || 0));
    updated[index] = item;
    setItems(updated);
  };

  // Add line item
  const addItem = () => {
    setItems([
      ...items,
      {
        productName: '',
        description: '',
        quantity: 1,
        unit: 'Bag',
        unitPrice: 0,
        discountPercent: 0,
        discountAmount: 0,
        totalAmount: 0,
      },
    ]);
  };

  // Remove line item
  const removeItem = (index: number) => {
    if (items.length <= 1) return;
    setItems(items.filter((_, i) => i !== index));
  };

  // Keyboard shortcut listener: F2 to Add Item
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F2') {
        e.preventDefault();
        addItem();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [items]);

  // Calculate live Subtotal, Discount Total, and Grand Total
  const subTotal = items.reduce((acc, it) => acc + (it.quantity || 0) * (it.unitPrice || 0), 0);
  const discountTotal = items.reduce((acc, it) => acc + (it.discountAmount || 0), 0);
  const parsedExtra = Number(extraCharges) || 0;
  const grandTotal = Math.max(0, subTotal - discountTotal + parsedExtra);
  const balance = Math.max(0, grandTotal - (paymentMode === 'CREDIT' || paymentMode === 'UNPAID' ? 0 : paidAmount));

  // Sync paidAmount when grandTotal changes if not CREDIT or UNPAID
  useEffect(() => {
    if (paymentMode !== 'CREDIT' && paymentMode !== 'UNPAID') {
      setPaidAmount(grandTotal);
    } else {
      setPaidAmount(0);
    }
  }, [grandTotal, paymentMode]);

  // Submit invoice
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validItems = items.filter((it) => it.productName.trim() && it.quantity > 0);
    if (validItems.length === 0) {
      alert('Please add at least one item with a valid name and quantity');
      return;
    }

    try {
      setSaving(true);
      const res = await fetch('/api/non-gst-invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fromName: fromName.trim() || null,
          fromPhone: fromPhone.trim() || null,
          fromAddress: fromAddress.trim() || null,
          invoiceNumber,
          invoiceDate,
          dueDate: dueDate || null,
          partyId: partyId || null,
          partyName,
          partyPhone,
          partyAddress,
          billingAddress: partyAddress,
          partyState,
          extraCharges: parsedExtra,
          extraChargeName,
          paymentMode,
          paidAmount: paymentMode === 'CREDIT' || paymentMode === 'UNPAID' ? 0 : paidAmount,
          notes,
          terms,
          items: validItems,
        }),
      });

      const data = await res.json();
      if (data.success) {
        router.push('/app/non-gst-sales');
      } else {
        alert('Failed to save invoice: ' + data.error);
      }
    } catch (err: any) {
      alert('Error saving invoice: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6 max-w-6xl mx-auto pb-12">
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm transition-colors duration-150">
        <div className="flex items-center gap-3">
          <Link
            href="/app/non-gst-sales"
            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg sm:text-xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
                New Non-GST Invoice
              </h1>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-cyan-100 dark:bg-cyan-950 text-cyan-700 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-800 font-mono">
                No Tax / Non-GST
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Create a clean Non-GST invoice calculated as Subtotal → Discount → Grand Total
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            href="/app/non-gst-sales"
            className="flex-1 sm:flex-none px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition-colors text-center"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl text-xs font-bold shadow-md shadow-cyan-600/30 transition-all disabled:opacity-50 active:scale-95"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Generating...' : `Save Invoice (${formatINR(grandTotal)})`}</span>
          </button>
        </div>
      </div>

      {/* From (Seller / Trader Details - Custom Fill Optional) */}
      <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4 transition-colors duration-150">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
            <span>From (Company / Seller Details - Optional)</span>
          </h2>
          <span className="text-[10px] text-cyan-600 dark:text-cyan-400 font-semibold">
            Leave blank if no company details needed on bill
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 text-xs">
          {/* Trader Name */}
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Company / Seller Name
            </label>
            <input
              type="text"
              value={fromName}
              onChange={(e) => setFromName(e.target.value)}
              placeholder="Leave empty or enter custom name"
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 font-semibold"
            />
          </div>

          {/* Trader Phone */}
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Phone Number
            </label>
            <input
              type="text"
              value={fromPhone}
              onChange={(e) => setFromPhone(e.target.value)}
              placeholder="Optional"
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-cyan-500/20"
            />
          </div>

          {/* Trader Address */}
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Address / Location
            </label>
            <input
              type="text"
              value={fromAddress}
              onChange={(e) => setFromAddress(e.target.value)}
              placeholder="Optional"
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-cyan-500/20"
            />
          </div>
        </div>
      </div>

      {/* Customer & Invoice Metadata */}
      <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4 transition-colors duration-150">
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          Customer & Invoice Details
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 text-xs">
          {/* Party Dropdown */}
          <div className="sm:col-span-2">
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Select Customer / Party
            </label>
            <select
              value={partyId}
              onChange={(e) => handlePartySelect(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-medium text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-cyan-500/20"
            >
              <option value="">-- Walk-in / Cash Customer --</option>
              {parties.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} {p.phone ? `(${p.phone})` : ''} - Bal: {formatINR(p.currentBalance)}
                </option>
              ))}
            </select>
          </div>

          {/* Customer Name */}
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Customer / Billing Name *
            </label>
            <input
              type="text"
              required
              value={partyName}
              onChange={(e) => setPartyName(e.target.value)}
              placeholder="Customer Name"
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-cyan-500/20"
            />
          </div>

          {/* Phone Number */}
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Phone Number
            </label>
            <input
              type="text"
              value={partyPhone}
              onChange={(e) => setPartyPhone(e.target.value)}
              placeholder="e.g. 8543814204"
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-cyan-500/20"
            />
          </div>

          {/* Billing Address */}
          <div className="sm:col-span-2">
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Billing Address / Delivery Location
            </label>
            <input
              type="text"
              value={partyAddress}
              onChange={(e) => setPartyAddress(e.target.value)}
              placeholder="e.g. Kundesar Kabirpur, Uttar Pradesh"
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-cyan-500/20"
            />
          </div>

          {/* State */}
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              State / Place of Supply
            </label>
            <input
              type="text"
              value={partyState}
              onChange={(e) => setPartyState(e.target.value)}
              placeholder="09-Uttar Pradesh"
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-cyan-500/20"
            />
          </div>

          {/* Invoice Number */}
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Invoice No.
            </label>
            <input
              type="text"
              value={invoiceNumber}
              onChange={(e) => setInvoiceNumber(e.target.value)}
              placeholder="NG-0001"
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-cyan-500/20"
            />
          </div>

          {/* Invoice Date */}
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Invoice Date
            </label>
            <input
              type="date"
              value={invoiceDate}
              onChange={(e) => setInvoiceDate(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-cyan-500/20"
            />
          </div>

          {/* Due Date */}
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Due Date (Optional)
            </label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-cyan-500/20"
            />
          </div>
        </div>
      </div>

      {/* Line Items Table */}
      <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4 transition-colors duration-150">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Invoice Items / Products
          </h2>
          <button
            type="button"
            onClick={addItem}
            title="Add Item (Shortcut: F2)"
            className="flex items-center gap-1.5 px-3 py-1.5 bg-cyan-50 dark:bg-cyan-950/60 hover:bg-cyan-100 dark:hover:bg-cyan-900/60 text-cyan-700 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-800 rounded-xl text-xs font-bold transition-all cursor-pointer active:scale-95"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Item Row</span>
            <kbd className="px-1.5 py-0.2 text-[9px] bg-white dark:bg-slate-900 text-cyan-800 dark:text-cyan-200 border border-cyan-300 dark:border-cyan-700 rounded font-mono font-bold shadow-xs">
              F2
            </kbd>
          </button>
        </div>

        <div className="overflow-x-auto min-h-[300px] pb-16">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/60 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase border-b border-slate-200 dark:border-slate-800">
                <th className="py-2.5 px-2 text-center w-8">#</th>
                <th className="py-2.5 px-3 min-w-[220px]">Item / Product Name</th>
                <th className="py-2.5 px-2 w-20">Quantity</th>
                <th className="py-2.5 px-2 w-24">Unit</th>
                <th className="py-2.5 px-2 w-28">Rate (₹)</th>
                <th className="py-2.5 px-2 w-24">Discount (₹)</th>
                <th className="py-2.5 px-3 text-right w-28">Line Total</th>
                <th className="py-2.5 px-2 text-center w-10"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {items.map((item, index) => (
                <tr key={index} className="group">
                  <td className="py-2 px-2 text-center font-mono text-slate-400 text-xs">
                    {index + 1}
                  </td>
                  <td className="py-2 px-3 space-y-1 relative">
                    <ItemSearchInput
                      value={item.productName}
                      onChange={(val) => updateItem(index, 'productName', val)}
                      onSelectProduct={(prod) => handleProductSelect(index, prod)}
                      products={products}
                      placeholder="Item name (e.g. JAU AATA)"
                      required
                    />
                    <input
                      type="text"
                      placeholder="Optional description / details"
                      value={item.description || ''}
                      onChange={(e) => updateItem(index, 'description', e.target.value)}
                      className="w-full px-2 py-1 bg-transparent border-0 text-[11px] text-slate-500 dark:text-slate-400 placeholder:text-slate-400 focus:outline-none"
                    />
                  </td>
                  <td className="py-2 px-2">
                    <input
                      type="number"
                      min="0.01"
                      step="any"
                      required
                      value={item.quantity}
                      onFocus={(e) => e.target.select()}
                      onClick={(e) => e.currentTarget.select()}
                      onChange={(e) => updateItem(index, 'quantity', parseFloat(e.target.value) || 0)}
                      className="w-full px-2 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-center font-mono font-bold text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-800 focus:outline-none"
                    />
                  </td>
                  <td className="py-2 px-2">
                    <input
                      type="text"
                      list={`units-list-${index}`}
                      value={item.unit}
                      onChange={(e) => updateItem(index, 'unit', e.target.value)}
                      className="w-full px-2 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-center font-medium text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-800 focus:outline-none"
                    />
                    <datalist id={`units-list-${index}`}>
                      {COMMON_UNITS.map((u) => (
                        <option key={u} value={u} />
                      ))}
                    </datalist>
                  </td>
                  <td className="py-2 px-2">
                    <input
                      type="number"
                      min="0"
                      step="any"
                      required
                      value={item.unitPrice}
                      onFocus={(e) => e.target.select()}
                      onClick={(e) => e.currentTarget.select()}
                      onChange={(e) => updateItem(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                      className="w-full px-2 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-mono text-right font-medium text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-800 focus:outline-none"
                    />
                  </td>
                  <td className="py-2 px-2">
                    <input
                      type="number"
                      min="0"
                      step="any"
                      value={item.discountAmount || 0}
                      onFocus={(e) => e.target.select()}
                      onClick={(e) => e.currentTarget.select()}
                      onChange={(e) => updateItem(index, 'discountAmount', parseFloat(e.target.value) || 0)}
                      className="w-full px-2 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-mono text-right text-slate-700 dark:text-slate-300 focus:bg-white dark:focus:bg-slate-800 focus:outline-none"
                    />
                  </td>
                  <td className="py-2 px-3 text-right font-mono font-bold text-slate-900 dark:text-slate-100 text-xs">
                    {formatINR(item.totalAmount)}
                  </td>
                  <td className="py-2 px-2 text-center">
                    <button
                      type="button"
                      disabled={items.length <= 1}
                      onClick={() => removeItem(index)}
                      className="p-1.5 text-slate-400 hover:text-rose-500 disabled:opacity-30 transition-colors"
                      title="Remove Row"
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

      {/* Calculations & Payment Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6">
        {/* Left Column: Notes & Terms */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Terms & Invoice Notes
          </h2>
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 text-xs mb-1">
              Terms & Conditions
            </label>
            <textarea
              rows={3}
              value={terms}
              onChange={(e) => setTerms(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-800 focus:outline-none"
              placeholder="e.g. Thanks for doing business with us!"
            />
          </div>
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 text-xs mb-1">
              Private Notes / Reference
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-800 focus:outline-none"
              placeholder="e.g. Vehicle No: UP65-AB-1234"
            />
          </div>
        </div>

        {/* Right Column: Calculations & Payment */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3.5 text-xs">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Summary & Payment
          </h2>

          <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
            <span className="text-slate-600 dark:text-slate-400 font-medium">Subtotal:</span>
            <span className="font-mono font-bold text-slate-900 dark:text-slate-100">
              {formatINR(subTotal)}
            </span>
          </div>

          {discountTotal > 0 && (
            <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800 text-rose-500">
              <span className="font-medium">Total Discount:</span>
              <span className="font-mono font-bold">- {formatINR(discountTotal)}</span>
            </div>
          )}

          {/* Extra Charges Row */}
          <div className="grid grid-cols-2 gap-2 py-1 border-b border-slate-100 dark:border-slate-800 items-center">
            <input
              type="text"
              value={extraChargeName}
              onChange={(e) => setExtraChargeName(e.target.value)}
              className="px-2 py-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium uppercase text-slate-700 dark:text-slate-300"
              placeholder="LOADING CHARGE"
            />
            <input
              type="number"
              min="0"
              step="any"
              value={extraCharges}
              onChange={(e) => setExtraCharges(parseFloat(e.target.value) || 0)}
              className="px-2 py-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-mono text-right text-slate-900 dark:text-slate-100"
              placeholder="0.00"
            />
          </div>

          {/* Grand Total */}
          <div className="flex justify-between items-center py-2 px-3 bg-cyan-700 text-white rounded-xl font-black text-sm shadow-md shadow-cyan-700/20">
            <span>Grand Total:</span>
            <span className="font-mono text-base">{formatINR(grandTotal)}</span>
          </div>

          {/* Payment Mode */}
          <div className="grid grid-cols-2 gap-2 pt-2">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 text-[11px] mb-1">
                Payment Mode
              </label>
              <select
                value={paymentMode}
                onChange={(e) => {
                  const val = e.target.value;
                  setPaymentMode(val);
                  if (val === 'UNPAID' || val === 'CREDIT') {
                    setPaidAmount(0);
                  } else {
                    setPaidAmount(grandTotal);
                  }
                }}
                className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-medium text-slate-900 dark:text-slate-100"
              >
                <option value="UNPAID">Unpaid</option>
                <option value="CASH">Cash</option>
                <option value="UPI">UPI / QR</option>
                <option value="BANK">Bank Transfer</option>
                <option value="CARD">Card</option>
                <option value="CHEQUE">Cheque</option>
                <option value="CREDIT">Credit Unpaid</option>
              </select>
            </div>
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 text-[11px] mb-1">
                Amount Received (₹)
              </label>
              <input
                type="number"
                min="0"
                step="any"
                disabled={paymentMode === 'CREDIT' || paymentMode === 'UNPAID'}
                value={paymentMode === 'CREDIT' || paymentMode === 'UNPAID' ? 0 : paidAmount}
                onFocus={(e) => e.target.select()}
                onClick={(e) => e.currentTarget.select()}
                onChange={(e) => setPaidAmount(parseFloat(e.target.value) || 0)}
                className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono text-right font-bold text-slate-900 dark:text-slate-100"
              />
            </div>
          </div>

          {/* Balance Due */}
          <div className="flex justify-between py-1 text-xs font-bold pt-1">
            <span className="text-slate-700 dark:text-slate-300">Balance Due:</span>
            <span className={`font-mono ${balance > 0 ? 'text-rose-600 dark:text-rose-400 font-extrabold' : 'text-emerald-600 dark:text-emerald-400'}`}>
              {formatINR(balance)}
            </span>
          </div>

          {/* Bottom Save Action */}
          <div className="pt-3">
            <button
              type="submit"
              disabled={saving}
              className="w-full flex items-center justify-center gap-2 py-2.5 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl text-xs font-bold shadow-md shadow-cyan-600/30 transition-all disabled:opacity-50 active:scale-[0.98]"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Saving...' : 'Save Non-GST Invoice'}</span>
            </button>
          </div>
        </div>
      </div>
    </form>
  );
}

export default function NewNonGstSalePage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-slate-400">Loading form...</div>}>
      <NewNonGstSaleContent />
    </Suspense>
  );
}
