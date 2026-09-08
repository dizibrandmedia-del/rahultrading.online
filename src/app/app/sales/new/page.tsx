'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { formatINR } from '@/lib/currency';
import { calculateInvoiceGst } from '@/lib/gst-engine';
import { InvoiceItemDraft, INDIAN_STATES } from '@/types';
import { ItemSearchInput } from '@/components/billing/ItemSearchInput';
import {
  Receipt,
  Plus,
  Trash2,
  Save,
  ArrowLeft,
  CheckCircle2,
} from 'lucide-react';

function NewSaleContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const duplicateId = searchParams.get('duplicate');

  // Master data
  const [parties, setParties] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [business, setBusiness] = useState<any>(null);
  const [saving, setSaving] = useState(false);

  // Form State
  const [partyId, setPartyId] = useState('');
  const [partyName, setPartyName] = useState('Walk-in Cash Customer');
  const [partyPhone, setPartyPhone] = useState('');
  const [partyGstin, setPartyGstin] = useState('');
  const [partyState, setPartyState] = useState('Delhi');
  const [partyStateCode, setPartyStateCode] = useState('07');

  const [paymentMode, setPaymentMode] = useState('CREDIT');
  const [paidAmount, setPaidAmount] = useState<number>(0);
  const [notes, setNotes] = useState('');

  // Line items
  const [items, setItems] = useState<InvoiceItemDraft[]>([
    {
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
    },
  ]);

  useEffect(() => {
    // Load business, parties and products
    Promise.all([
      fetch('/api/business').then((r) => r.json()).catch(() => ({ business: null })),
      fetch('/api/parties?type=CUSTOMER').then((r) => r.json()).catch(() => ({ parties: [] })),
      fetch('/api/products').then((r) => r.json()).catch(() => ({ products: [] })),
    ]).then(([bData, pData, prodData]) => {
      if (bData.success && bData.business) setBusiness(bData.business);
      if (pData.success && pData.parties) setParties(pData.parties);
      if (prodData.success && prodData.products) setProducts(prodData.products);
    });
  }, []);

  // Handle duplicate invoice preloading
  useEffect(() => {
    if (duplicateId) {
      fetch(`/api/sales/${duplicateId}`)
        .then((r) => r.json())
        .then((data) => {
          if (data.success && data.sale) {
            const s = data.sale;
            setPartyId(s.partyId || '');
            setPartyName(s.partyName || 'Walk-in Cash Customer');
            setPartyPhone(s.partyPhone || '');
            setPartyGstin(s.partyGstin || '');
            setPartyState(s.partyState || 'Delhi');
            if (s.partyGstin && s.partyGstin.length >= 2) {
              setPartyStateCode(s.partyGstin.substring(0, 2));
            } else {
              const st = INDIAN_STATES.find((item) => item.name === s.partyState);
              if (st) setPartyStateCode(st.code);
            }
            setPaymentMode(s.paymentMode || 'UNPAID');
            setNotes(s.notes || '');
            if (s.items && s.items.length > 0) {
              setItems(
                s.items.map((it: any) => ({
                  productId: it.productId || undefined,
                  productName: it.productName,
                  hsnCode: it.hsnCode || '',
                  quantity: it.quantity,
                  unit: it.unit || 'PCS',
                  unitPrice: it.unitPrice,
                  discountPercent: it.discountPercent || 0,
                  discountAmount: it.discountAmount || 0,
                  taxableAmount: it.taxableAmount || 0,
                  gstRate: it.gstRate,
                  cgstRate: it.cgstRate || 0,
                  cgstAmount: it.cgstAmount || 0,
                  sgstRate: it.sgstRate || 0,
                  sgstAmount: it.sgstAmount || 0,
                  igstRate: it.igstRate || 0,
                  igstAmount: it.igstAmount || 0,
                  totalAmount: it.totalAmount,
                }))
              );
            }
          }
        })
        .catch((err) => console.error('Error duplicating sale:', err));
    }
  }, [duplicateId]);

  // Handle party selection
  const handlePartySelect = (selectedId: string) => {
    setPartyId(selectedId);
    if (selectedId === '') {
      setPartyName('Walk-in Cash Customer');
      setPartyPhone('');
      setPartyGstin('');
      setPartyState('Delhi');
      setPartyStateCode('07');
      return;
    }

    const party = parties.find((p) => p.id === selectedId);
    if (party) {
      setPartyName(party.name);
      setPartyPhone(party.phone || '');
      setPartyGstin(party.gstin || '');
      setPartyState(party.state || 'Delhi');
      setPartyStateCode(party.stateCode || '07');
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
        gstRate: 18,
      };
      setItems(updated);
      return;
    }

    const prod = typeof productOrId === 'object' ? productOrId : products.find((p) => p.id === productOrId);
    if (prod) {
      updated[index] = {
        ...updated[index],
        productId: prod.id,
        productName: prod.name,
        hsnCode: prod.hsnCode || '',
        unitPrice: prod.salePrice,
        gstRate: prod.gstRate,
        isTaxInclusive: prod.isTaxInclusive,
        unit: prod.unit?.shortName || 'PCS',
      };
      setItems(updated);
    }
  };

  // Update item field
  const updateItem = (index: number, field: keyof InvoiceItemDraft, value: any) => {
    const updated = [...items];
    updated[index] = {
      ...updated[index],
      [field]: value,
    };
    setItems(updated);
  };

  // Add line item
  const addItem = () => {
    setItems([
      ...items,
      {
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

  // Calculate live GST breakdown
  const sellerStateCode = business?.stateCode || '07';
  const buyerStateCode = partyStateCode || '07';

  const gstSummary = calculateInvoiceGst(
    sellerStateCode,
    buyerStateCode,
    items.map((it) => ({
      productId: it.productId,
      productName: it.productName,
      hsnCode: it.hsnCode,
      quantity: it.quantity,
      unitPrice: it.unitPrice,
      discountPercent: it.discountPercent,
      gstRate: it.gstRate,
      isTaxInclusive: it.isTaxInclusive,
    })) as any
  );

  // Sync paidAmount when grandTotal changes if not CREDIT
  useEffect(() => {
    if (paymentMode !== 'CREDIT') {
      setPaidAmount(gstSummary.grandTotal);
    }
  }, [gstSummary.grandTotal, paymentMode]);

  // Submit invoice
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate at least 1 valid item
    const validItems = gstSummary.items.filter((it) => it.productName.trim() && it.quantity > 0);
    if (validItems.length === 0) {
      alert('Please add at least one valid product item to create the invoice');
      return;
    }

    try {
      setSaving(true);
      const res = await fetch('/api/sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          partyId: partyId || null,
          partyName,
          partyPhone,
          partyGstin,
          partyState,
          partyStateCode,
          paymentMode,
          paidAmount: paymentMode === 'CREDIT' || paymentMode === 'UNPAID' ? 0 : paidAmount,
          notes,
          items: validItems,
        }),
      });

      const data = await res.json();
      if (data.success) {
        router.push('/app/sales');
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
    <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6 max-w-6xl mx-auto pb-10">
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm transition-colors duration-150">
        <div className="flex items-center gap-3">
          <Link
            href="/app/sales"
            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg sm:text-xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
                New GST Tax Invoice
              </h1>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 font-mono">
                B2B / B2C
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              GST compliant invoice with automatic CGST, SGST & IGST calculation
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            href="/app/sales"
            className="flex-1 sm:flex-none px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition-colors text-center"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-600/30 transition-all disabled:opacity-50 active:scale-95"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Generating...' : `Save Invoice (${formatINR(gstSummary.grandTotal)})`}</span>
          </button>
        </div>
      </div>

      {/* Customer & Billing Details */}
      <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4 transition-colors duration-150">
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          Customer & Party Details
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 text-xs">
          {/* Party Dropdown */}
          <div className="sm:col-span-2">
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Select Customer / Party</label>
            <select
              value={partyId}
              onChange={(e) => handlePartySelect(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-medium text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="">-- Cash / Walk-in Customer --</option>
              {parties.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} {p.gstin ? `(${p.gstin})` : ''} - Bal: {formatINR(p.currentBalance)}
                </option>
              ))}
            </select>
          </div>

          {/* Customer Name */}
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Billing Name</label>
            <input
              type="text"
              required
              value={partyName}
              onChange={(e) => setPartyName(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:bg-white dark:focus:bg-slate-800 focus:outline-none text-slate-900 dark:text-slate-100 font-medium"
            />
          </div>

          {/* Phone */}
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Phone Number</label>
            <input
              type="tel"
              placeholder="10-digit mobile"
              value={partyPhone}
              onChange={(e) => setPartyPhone(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:bg-white dark:focus:bg-slate-800 focus:outline-none text-slate-900 dark:text-slate-100 font-mono"
            />
          </div>

          {/* Customer GSTIN */}
          <div className="sm:col-span-2">
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Customer GSTIN (Optional)</label>
            <input
              type="text"
              placeholder="e.g. 07AAAAA0000A1Z5"
              value={partyGstin}
              onChange={(e) => {
                const val = e.target.value.toUpperCase();
                setPartyGstin(val);
                if (val.length >= 2) {
                  const sCode = val.substring(0, 2);
                  setPartyStateCode(sCode);
                  const st = INDIAN_STATES.find((s) => s.code === sCode);
                  if (st) setPartyState(st.name);
                }
              }}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:bg-white dark:focus:bg-slate-800 focus:outline-none font-mono text-slate-900 dark:text-slate-100 uppercase font-semibold"
            />
          </div>

          {/* State of Supply */}
          <div className="sm:col-span-2">
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Place of Supply (State)</label>
            <select
              value={partyState}
              onChange={(e) => {
                const st = INDIAN_STATES.find((s) => s.name === e.target.value);
                if (st) {
                  setPartyState(st.name);
                  setPartyStateCode(st.code);
                }
              }}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:bg-white dark:focus:bg-slate-800 focus:outline-none text-slate-900 dark:text-slate-100 font-medium"
            >
              {INDIAN_STATES.map((s) => (
                <option key={s.code} value={s.name}>
                  {s.code} - {s.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* GST Type Indicator Banner */}
        <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 flex items-center gap-3 w-full">
          <CheckCircle2 className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0" />
          <div className="text-[11px]">
            <p className="font-bold text-blue-950 dark:text-blue-200">
              {gstSummary.isInterState
                ? 'Inter-State Transaction (IGST Applicable)'
                : 'Intra-State Transaction (CGST + SGST Applicable)'}
            </p>
            <p className="text-blue-700 dark:text-blue-300">
              Seller State: {business?.state || 'Delhi'} ({sellerStateCode}) | Buyer State: {partyState} ({buyerStateCode})
            </p>
          </div>
        </div>
      </div>

      {/* Line Items Table */}
      <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4 transition-colors duration-150">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Products / Line Items
          </h2>
          <button
            type="button"
            onClick={addItem}
            title="Add Item (Shortcut: F2)"
            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 dark:bg-blue-950/50 hover:bg-blue-100 dark:hover:bg-blue-900/50 text-blue-700 dark:text-blue-300 rounded-xl text-xs font-bold border border-blue-200 dark:border-blue-800 transition-colors cursor-pointer active:scale-95"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Item</span>
            <kbd className="px-1.5 py-0.2 text-[9px] bg-white dark:bg-slate-900 text-blue-800 dark:text-blue-200 border border-blue-300 dark:border-blue-700 rounded font-mono font-bold shadow-xs">
              F2
            </kbd>
          </button>
        </div>

        <div className="overflow-x-auto -mx-4 sm:mx-0 min-h-[300px] pb-16">
          <div className="inline-block min-w-full align-middle px-4 sm:px-0">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/60 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase border-y border-slate-200 dark:border-slate-800">
                  <th className="py-2.5 px-2 w-8 text-center">#</th>
                  <th className="py-2.5 px-3 min-w-[220px]">Item / Product</th>
                  <th className="py-2.5 px-2 w-20">HSN</th>
                  <th className="py-2.5 px-2 w-20 text-center">Qty</th>
                  <th className="py-2.5 px-2 w-24 text-right">Rate (₹)</th>
                  <th className="py-2.5 px-2 w-20 text-right">Disc %</th>
                  <th className="py-2.5 px-2 w-24 text-right">Taxable</th>
                  <th className="py-2.5 px-2 w-24 text-center">GST Rate</th>
                  <th className="py-2.5 px-3 w-28 text-right">Total (₹)</th>
                  <th className="py-2.5 px-2 w-10 text-center"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {items.map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                    <td className="py-2.5 px-2 text-center text-slate-400 font-mono">{idx + 1}</td>
                    <td className="py-2.5 px-3 relative">
                      <ItemSearchInput
                        value={item.productName}
                        onChange={(val) => updateItem(idx, 'productName', val)}
                        onSelectProduct={(prod) => handleProductSelect(idx, prod)}
                        products={products}
                        placeholder="Item name (e.g. JAU AATA)"
                        required
                      />
                    </td>
                    <td className="py-2.5 px-2">
                      <input
                        type="text"
                        placeholder="HSN"
                        value={item.hsnCode}
                        onChange={(e) => updateItem(idx, 'hsnCode', e.target.value)}
                        className="w-full px-2 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-mono text-slate-900 dark:text-slate-100"
                      />
                    </td>
                    <td className="py-2.5 px-2 text-center">
                      <input
                        type="number"
                        min="0.1"
                        step="any"
                        value={item.quantity}
                        onFocus={(e) => e.target.select()}
                        onClick={(e) => e.currentTarget.select()}
                        onChange={(e) => updateItem(idx, 'quantity', parseFloat(e.target.value) || 0)}
                        className="w-full px-2 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-center font-bold font-mono text-slate-900 dark:text-slate-100"
                      />
                    </td>
                    <td className="py-2.5 px-2 text-right">
                      <input
                        type="number"
                        min="0"
                        step="any"
                        value={item.unitPrice}
                        onFocus={(e) => e.target.select()}
                        onClick={(e) => e.currentTarget.select()}
                        onChange={(e) => updateItem(idx, 'unitPrice', parseFloat(e.target.value) || 0)}
                        className="w-full px-2 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-right font-mono font-semibold text-slate-900 dark:text-slate-100"
                      />
                    </td>
                    <td className="py-2.5 px-2 text-right">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="any"
                        value={item.discountPercent}
                        onFocus={(e) => e.target.select()}
                        onClick={(e) => e.currentTarget.select()}
                        onChange={(e) => updateItem(idx, 'discountPercent', parseFloat(e.target.value) || 0)}
                        className="w-full px-2 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-right font-mono text-slate-900 dark:text-slate-100"
                      />
                    </td>
                    <td className="py-2.5 px-2 text-right font-mono font-medium text-slate-700 dark:text-slate-300">
                      {formatINR(gstSummary.items[idx]?.taxableAmount || 0, false)}
                    </td>
                    <td className="py-2.5 px-2 text-center">
                      <select
                        value={item.gstRate}
                        onChange={(e) => updateItem(idx, 'gstRate', parseFloat(e.target.value) || 0)}
                        className="w-full px-2 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold text-blue-800 dark:text-blue-300 text-center"
                      >
                        <option value="0">0%</option>
                        <option value="5">5%</option>
                        <option value="12">12%</option>
                        <option value="18">18%</option>
                        <option value="28">28%</option>
                      </select>
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900 dark:text-slate-100">
                      {formatINR(gstSummary.items[idx]?.totalAmount || 0, false)}
                    </td>
                    <td className="py-2.5 px-2 text-center">
                      <button
                        type="button"
                        onClick={() => removeItem(idx)}
                        disabled={items.length <= 1}
                        className="p-1 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 disabled:opacity-30 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Calculations & Payment Summary Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Left: Payment Mode & Notes */}
        <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4 transition-colors duration-150">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Payment & Settlement
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Payment Mode</label>
              <select
                value={paymentMode}
                onChange={(e) => {
                  const m = e.target.value;
                  setPaymentMode(m);
                  if (m === 'CREDIT' || m === 'UNPAID') setPaidAmount(0);
                  else setPaidAmount(gstSummary.grandTotal);
                }}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-slate-900 dark:text-slate-100"
              >
                <option value="CREDIT">Customer Credit (Receivable Later)</option>
                <option value="CASH">Cash in Hand</option>
                <option value="UPI">Instant UPI (GPay/PhonePe)</option>
                <option value="BANK">Bank Account / NetBanking</option>
                <option value="CARD">Debit / Credit Card</option>
                <option value="CHEQUE">Cheque</option>
                <option value="UNPAID">Unpaid</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Amount Received (₹)</label>
              <input
                type="number"
                min="0"
                step="any"
                disabled={paymentMode === 'CREDIT' || paymentMode === 'UNPAID'}
                value={paymentMode === 'CREDIT' || paymentMode === 'UNPAID' ? 0 : paidAmount}
                onFocus={(e) => e.target.select()}
                onClick={(e) => e.currentTarget.select()}
                onChange={(e) => setPaidAmount(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono font-black text-slate-900 dark:text-slate-100 text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1 text-xs">Invoice Notes & Delivery Details</label>
            <textarea
              rows={3}
              placeholder="e.g. Delivered by Porter. Transporter receipt #1042."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100"
            />
          </div>
        </div>

        {/* Right: Tax Breakdown & Grand Total */}
        <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-2 text-xs transition-colors duration-150">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3">
            Tax Breakdown & Total (INR)
          </h2>

          <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800 text-slate-600 dark:text-slate-400">
            <span>Subtotal (Item Total):</span>
            <span className="font-mono font-semibold text-slate-900 dark:text-slate-100">{formatINR(gstSummary.subTotal)}</span>
          </div>

          {gstSummary.discountTotal > 0 && (
            <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800 text-emerald-600 dark:text-emerald-400 font-medium">
              <span>Total Discount:</span>
              <span className="font-mono">-{formatINR(gstSummary.discountTotal)}</span>
            </div>
          )}

          <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800 text-slate-600 dark:text-slate-400">
            <span>Taxable Value:</span>
            <span className="font-mono font-semibold text-slate-900 dark:text-slate-100">{formatINR(gstSummary.taxableTotal)}</span>
          </div>

          {!gstSummary.isInterState ? (
            <>
              <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800 text-slate-600 dark:text-slate-400">
                <span>Central GST (CGST Total):</span>
                <span className="font-mono font-semibold text-slate-900 dark:text-slate-100">{formatINR(gstSummary.cgstTotal)}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800 text-slate-600 dark:text-slate-400">
                <span>State GST (SGST Total):</span>
                <span className="font-mono font-semibold text-slate-900 dark:text-slate-100">{formatINR(gstSummary.sgstTotal)}</span>
              </div>
            </>
          ) : (
            <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800 text-purple-700 dark:text-purple-300">
              <span>Integrated GST (IGST Total):</span>
              <span className="font-mono font-semibold">{formatINR(gstSummary.igstTotal)}</span>
            </div>
          )}

          {gstSummary.roundOff !== 0 && (
            <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800 text-slate-500 dark:text-slate-400">
              <span>Round Off:</span>
              <span className="font-mono">{gstSummary.roundOff > 0 ? `+${gstSummary.roundOff}` : gstSummary.roundOff}</span>
            </div>
          )}

          <div className="flex justify-between py-3 border-b-2 border-slate-300 dark:border-slate-700 text-base font-black text-slate-900 dark:text-slate-100">
            <span>Grand Total:</span>
            <span className="text-blue-600 dark:text-blue-400 font-mono text-xl">{formatINR(gstSummary.grandTotal)}</span>
          </div>

          <div className="flex justify-between py-1 text-emerald-700 dark:text-emerald-400 font-bold">
            <span>Paid Amount:</span>
            <span className="font-mono">{formatINR(paymentMode === 'CREDIT' ? 0 : paidAmount)}</span>
          </div>

          {gstSummary.grandTotal - (paymentMode === 'CREDIT' ? 0 : paidAmount) > 0 && (
            <div className="flex justify-between py-1 text-rose-600 dark:text-rose-400 font-bold">
              <span>Balance Due (Receivable):</span>
              <span className="font-mono">
                {formatINR(gstSummary.grandTotal - (paymentMode === 'CREDIT' ? 0 : paidAmount))}
              </span>
            </div>
          )}
        </div>
      </div>
    </form>
  );
}

export default function NewSalePage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-slate-400">Loading invoice form...</div>}>
      <NewSaleContent />
    </Suspense>
  );
}
