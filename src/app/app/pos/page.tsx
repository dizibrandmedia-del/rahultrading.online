'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { formatINR } from '@/lib/currency';
import { calculateInvoiceGst } from '@/lib/gst-engine';
import { ThermalReceiptTemplate } from '@/components/printing/ThermalReceiptTemplate';
import { QrModal } from '@/components/billing/QrModal';
import { Modal } from '@/components/ui/Modal';
import {
  Zap,
  Search,
  Barcode,
  Plus,
  Minus,
  Trash2,
  Printer,
  PauseCircle,
  PlayCircle,
  QrCode,
  CreditCard,
  Banknote,
  ArrowLeft,
  CheckCircle2,
  ShoppingCart
} from 'lucide-react';
import { clsx } from 'clsx';

export default function PosBillingPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [barcodeInput, setBarcodeInput] = useState('');
  const [business, setBusiness] = useState<any>(null);
  const [mobileTab, setMobileTab] = useState<'catalog' | 'cart'>('catalog');

  // Cart
  const [cart, setCart] = useState<
    Array<{
      product: any;
      quantity: number;
      unitPrice: number;
    }>
  >([]);

  // Held Bills
  const [heldBills, setHeldBills] = useState<any[]>([]);

  // Customer
  const [customerName, setCustomerName] = useState('Walk-in Customer');
  const [customerPhone, setCustomerPhone] = useState('');

  // Payment
  const [paymentMode, setPaymentMode] = useState<'CASH' | 'UPI' | 'CARD'>('CASH');
  const [cashTendered, setCashTendered] = useState<number>(0);

  // Completed Invoice for instant thermal print
  const [completedSale, setCompletedSale] = useState<any>(null);
  const [showQrModal, setShowQrModal] = useState(false);
  const [saving, setSaving] = useState(false);

  const barcodeInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Load products and business
    Promise.all([
      fetch('/api/products').then((r) => r.json()).catch(() => ({ products: [] })),
      fetch('/api/business').then((r) => r.json()).catch(() => ({ business: null })),
    ]).then(([pData, bData]) => {
      if (pData.success && pData.products) {
        setProducts(pData.products);
        const cats = Array.from(
          new Set(pData.products.map((p: any) => p.category?.name).filter(Boolean))
        ) as string[];
        setCategories(cats);
      }
      if (bData.success && bData.business) setBusiness(bData.business);
    });
  }, []);

  // Quick Add by Barcode or SKU
  const handleBarcodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!barcodeInput.trim()) return;

    const matched = products.find(
      (p) =>
        (p.barcode && p.barcode.toLowerCase() === barcodeInput.trim().toLowerCase()) ||
        (p.sku && p.sku.toLowerCase() === barcodeInput.trim().toLowerCase())
    );

    if (matched) {
      addToCart(matched);
      setBarcodeInput('');
    } else {
      alert(`No product found matching Barcode/SKU: ${barcodeInput}`);
    }
  };

  const addToCart = (product: any) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      } else {
        return [
          ...prev,
          {
            product,
            quantity: 1,
            unitPrice: product.salePrice,
          },
        ];
      }
    });
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.product.id === productId) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean) as any
    );
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
  };

  // Hold Bill
  const handleHoldBill = () => {
    if (cart.length === 0) return;
    setHeldBills((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        timestamp: new Date().toLocaleTimeString(),
        cart: [...cart],
        customerName,
        customerPhone,
      },
    ]);
    setCart([]);
    setCustomerName('Walk-in Customer');
    setCustomerPhone('');
  };

  // Resume Bill
  const handleResumeBill = (held: any) => {
    setCart(held.cart);
    setCustomerName(held.customerName);
    setCustomerPhone(held.customerPhone);
    setHeldBills((prev) => prev.filter((b) => b.id !== held.id));
  };

  // Calculate live GST breakdown
  const gstCalculationItems = cart.map((item) => ({
    productId: item.product.id,
    productName: item.product.name,
    hsnCode: item.product.hsnCode,
    quantity: item.quantity,
    unitPrice: item.unitPrice,
    discountPercent: 0,
    gstRate: item.product.gstRate,
    isTaxInclusive: item.product.isTaxInclusive,
  }));

  const gstSummary = calculateInvoiceGst(
    business?.stateCode || '07',
    '07', // Intra-state POS default
    gstCalculationItems as any
  );

  const setExactCash = () => {
    setCashTendered(gstSummary.grandTotal);
  };

  const handleCheckout = async () => {
    if (cart.length === 0) {
      alert('Please add items to cart before checkout');
      return;
    }

    try {
      setSaving(true);
      const res = await fetch('/api/sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          partyName: customerName || 'Walk-in Customer',
          partyPhone: customerPhone,
          paymentMode,
          paidAmount: gstSummary.grandTotal,
          items: gstSummary.items,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setCompletedSale({
          ...data.sale,
          items: gstSummary.items,
        });
        setCart([]);
        setCustomerName('Walk-in Customer');
        setCustomerPhone('');
        setCashTendered(0);
        setMobileTab('catalog');
      } else {
        alert('Failed to checkout: ' + data.error);
      }
    } catch (err: any) {
      alert('Error: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const filteredProducts = products.filter((p) => {
    const matchesCat = selectedCategory === 'ALL' || p.category?.name === selectedCategory;
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.barcode && p.barcode.includes(searchQuery)) ||
      (p.sku && p.sku.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCat && matchesSearch;
  });

  const changeDue = Math.max(0, cashTendered - gstSummary.grandTotal);
  const totalCartCount = cart.reduce((a, b) => a + b.quantity, 0);

  return (
    <div className="h-[calc(100vh-8rem)] lg:h-[calc(100vh-5.5rem)] flex flex-col lg:flex-row gap-4 overflow-hidden -m-3 sm:-m-6 lg:-m-8 p-3 sm:p-4">
      {/* Mobile Tab Switcher (< lg) */}
      <div className="lg:hidden flex items-center bg-slate-200 dark:bg-slate-800 p-1 rounded-xl shrink-0">
        <button
          type="button"
          onClick={() => setMobileTab('catalog')}
          className={clsx(
            'flex-1 py-1.5 text-xs font-bold rounded-lg transition-all',
            mobileTab === 'catalog'
              ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
              : 'text-slate-600 dark:text-slate-400'
          )}
        >
          Catalog ({filteredProducts.length})
        </button>
        <button
          type="button"
          onClick={() => setMobileTab('cart')}
          className={clsx(
            'flex-1 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5',
            mobileTab === 'cart'
              ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
              : 'text-slate-600 dark:text-slate-400'
          )}
        >
          <ShoppingCart className="w-3.5 h-3.5" />
          <span>Cart ({totalCartCount}) • {formatINR(gstSummary.grandTotal)}</span>
        </button>
      </div>

      {/* Left Column: Product Search, Barcode & Grid */}
      <div
        className={clsx(
          'flex-1 flex-col min-w-0 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden transition-colors duration-150',
          mobileTab === 'catalog' ? 'flex' : 'hidden lg:flex'
        )}
      >
        {/* Barcode & Search Top Bar */}
        <div className="p-2.5 sm:p-3.5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 flex items-center gap-2 sm:gap-3">
          <Link
            href="/app"
            className="p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors shrink-0"
            title="Back to Dashboard"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>

          {/* Barcode Form */}
          <form onSubmit={handleBarcodeSubmit} className="flex-1 relative">
            <Barcode className="w-4 h-4 text-blue-600 dark:text-blue-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              ref={barcodeInputRef}
              type="text"
              placeholder="Scan Barcode / SKU..."
              value={barcodeInput}
              onChange={(e) => setBarcodeInput(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-white dark:bg-slate-800 border border-blue-200 dark:border-blue-800 rounded-xl text-xs font-mono font-semibold text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-inner"
            />
          </form>

          {/* Text Search */}
          <div className="relative w-36 sm:w-48">
            <Search className="w-4 h-4 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Filter items..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Categories Bar */}
        <div className="px-3 py-2 border-b border-slate-200 dark:border-slate-800 flex items-center gap-1.5 overflow-x-auto bg-white dark:bg-slate-900 shrink-0">
          <button
            onClick={() => setSelectedCategory('ALL')}
            className={`px-3 py-1 rounded-xl text-xs font-bold shrink-0 transition-all ${
              selectedCategory === 'ALL'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            All Items
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1 rounded-xl text-xs font-bold shrink-0 transition-all ${
                selectedCategory === cat
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Product Cards Grid */}
        <div className="flex-1 overflow-y-auto p-2.5 sm:p-3 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 sm:gap-2.5">
          {filteredProducts.map((prod) => (
            <div
              key={prod.id}
              onClick={() => addToCart(prod)}
              className="bg-white dark:bg-slate-800/80 hover:bg-blue-50/50 dark:hover:bg-slate-700/60 p-2.5 sm:p-3 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-500 shadow-xs hover:shadow-md cursor-pointer transition-all flex flex-col justify-between group active:scale-[0.98]"
            >
              <div>
                <span className="text-[9px] sm:text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase bg-blue-50 dark:bg-blue-950/60 px-1.5 py-0.5 rounded border border-blue-100 dark:border-blue-800">
                  GST {prod.gstRate}%
                </span>
                <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 mt-1.5 line-clamp-2 leading-tight group-hover:text-blue-600 dark:group-hover:text-blue-400">
                  {prod.name}
                </h4>
                {prod.barcode && (
                  <p className="text-[10px] font-mono text-slate-400 dark:text-slate-500 mt-0.5">#{prod.barcode}</p>
                )}
              </div>

              <div className="mt-2 sm:mt-3 pt-2 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between">
                <div>
                  <p className="text-xs font-black font-mono text-slate-900 dark:text-slate-100">
                    {formatINR(prod.salePrice)}
                  </p>
                  <p className="text-[9px] text-slate-400 dark:text-slate-500 font-mono">
                    Stock: {prod.currentStock} {prod.unit?.shortName}
                  </p>
                </div>
                <div className="w-6 h-6 rounded-lg bg-blue-100 dark:bg-blue-900/60 text-blue-600 dark:text-blue-300 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors">
                  <Plus className="w-3.5 h-3.5" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Right Column: Active Cart, Quick Cash & Settlement */}
      <div
        className={clsx(
          'w-full lg:w-96 flex-col bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden shrink-0 transition-colors duration-150',
          mobileTab === 'cart' ? 'flex' : 'hidden lg:flex'
        )}
      >
        {/* Cart Top: Customer & Hold/Resume */}
        <div className="p-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-amber-500 fill-current" />
              <span>POS Cart ({totalCartCount})</span>
            </span>

            {/* Held Bills Counter */}
            {heldBills.length > 0 && (
              <button
                onClick={() => handleResumeBill(heldBills[0])}
                className="flex items-center gap-1 px-2 py-0.5 bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 rounded-lg text-[11px] font-bold hover:bg-amber-200 animate-pulse border border-amber-200 dark:border-amber-800"
              >
                <PlayCircle className="w-3 h-3" />
                <span>Resume ({heldBills.length})</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2">
            <input
              type="text"
              placeholder="Customer Name..."
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium text-slate-900 dark:text-slate-100 focus:outline-none"
            />
            <input
              type="tel"
              placeholder="Mobile Phone..."
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium text-slate-900 dark:text-slate-100 focus:outline-none"
            />
          </div>
        </div>

        {/* Cart Items List */}
        <div className="flex-1 overflow-y-auto p-2 divide-y divide-slate-100 dark:divide-slate-800 min-h-[140px]">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400 dark:text-slate-500">
              <Barcode className="w-10 h-10 stroke-1 text-slate-300 dark:text-slate-600 mb-2" />
              <p className="text-xs font-semibold">Cart is currently empty</p>
              <p className="text-[10px] mt-0.5">Scan barcode or tap products from catalog</p>
            </div>
          ) : (
            cart.map((item) => (
              <div key={item.product.id} className="py-2 px-1 flex items-center justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">{item.product.name}</p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                    {formatINR(item.unitPrice)} x {item.quantity} = {formatINR(item.unitPrice * item.quantity)}
                  </p>
                </div>

                {/* Qty Stepper */}
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => updateQuantity(item.product.id, -1)}
                    className="w-6 h-6 rounded-md bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center text-slate-700 dark:text-slate-300"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className="w-6 text-center text-xs font-bold font-mono text-slate-900 dark:text-slate-100">{item.quantity}</span>
                  <button
                    onClick={() => updateQuantity(item.product.id, 1)}
                    className="w-6 h-6 rounded-md bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center text-slate-700 dark:text-slate-300"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                  <button
                    onClick={() => removeFromCart(item.product.id)}
                    className="p-1 text-slate-300 dark:text-slate-600 hover:text-rose-600 dark:hover:text-rose-400 transition-colors ml-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Settlement & Totals */}
        <div className="p-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/50 space-y-2.5">
          {/* GST & Totals */}
          <div className="space-y-1 text-xs">
            <div className="flex justify-between text-slate-500 dark:text-slate-400">
              <span>Taxable Value:</span>
              <span className="font-mono">{formatINR(gstSummary.taxableTotal)}</span>
            </div>
            <div className="flex justify-between text-slate-500 dark:text-slate-400">
              <span>GST (CGST+SGST):</span>
              <span className="font-mono">{formatINR(gstSummary.taxTotal)}</span>
            </div>
            <div className="flex justify-between font-black text-slate-900 dark:text-slate-100 text-sm pt-1 border-t border-slate-200 dark:border-slate-700">
              <span>TOTAL PAYABLE:</span>
              <span className="text-blue-600 dark:text-blue-400 font-mono text-base">{formatINR(gstSummary.grandTotal)}</span>
            </div>
          </div>

          {/* Payment Mode Selector */}
          <div className="grid grid-cols-3 gap-1.5">
            {[
              { mode: 'CASH', label: 'Cash', icon: Banknote },
              { mode: 'UPI', label: 'UPI QR', icon: QrCode },
              { mode: 'CARD', label: 'Card', icon: CreditCard },
            ].map((p) => {
              const Icon = p.icon;
              return (
                <button
                  key={p.mode}
                  type="button"
                  onClick={() => {
                    setPaymentMode(p.mode as any);
                    if (p.mode === 'UPI') setShowQrModal(true);
                  }}
                  className={`flex items-center justify-center gap-1.5 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                    paymentMode === p.mode
                      ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                      : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{p.label}</span>
                </button>
              );
            })}
          </div>

          {/* Quick Cash Tendered helpers (if CASH) */}
          {paymentMode === 'CASH' && gstSummary.grandTotal > 0 && (
            <div className="space-y-1.5 pt-1">
              <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-600 dark:text-slate-300">
                <span className="text-slate-400">Quick Tender:</span>
                <button
                  onClick={setExactCash}
                  className="px-2 py-0.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded hover:bg-slate-100 dark:hover:bg-slate-700"
                >
                  Exact (₹{gstSummary.grandTotal})
                </button>
                <button
                  onClick={() => setCashTendered(500)}
                  className="px-2 py-0.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded hover:bg-slate-100 dark:hover:bg-slate-700"
                >
                  ₹500
                </button>
                <button
                  onClick={() => setCashTendered(2000)}
                  className="px-2 py-0.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded hover:bg-slate-100 dark:hover:bg-slate-700"
                >
                  ₹2000
                </button>
              </div>

              {cashTendered > 0 && (
                <div className="flex justify-between items-center bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-1 rounded-lg border border-emerald-200 dark:border-emerald-800 text-xs font-bold text-emerald-800 dark:text-emerald-300">
                  <span>Change to Return:</span>
                  <span className="font-mono">{formatINR(changeDue)}</span>
                </div>
              )}
            </div>
          )}

          {/* Action Buttons: Hold + Instant Checkout */}
          <div className="grid grid-cols-4 gap-2 pt-1">
            <button
              onClick={handleHoldBill}
              disabled={cart.length === 0}
              className="col-span-1 flex items-center justify-center p-2.5 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-bold transition-colors disabled:opacity-40"
              title="Hold this bill"
            >
              <PauseCircle className="w-5 h-5" />
            </button>

            <button
              onClick={handleCheckout}
              disabled={cart.length === 0 || saving}
              className="col-span-3 flex items-center justify-center gap-2 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-600/30 transition-all disabled:opacity-50 active:scale-95"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{saving ? 'Processing...' : `Pay & Print (${formatINR(gstSummary.grandTotal)})`}</span>
            </button>
          </div>
        </div>
      </div>

      {/* UPI QR Modal if triggered */}
      {showQrModal && gstSummary.grandTotal > 0 && (
        <QrModal
          isOpen={showQrModal}
          onClose={() => setShowQrModal(false)}
          amount={gstSummary.grandTotal}
          invoiceNumber={`POS-${Date.now().toString().slice(-4)}`}
          upiId={business?.upiId || '8887754821@upi'}
          upiName={business?.name || 'RAHUL JEE TRADING COMPANY'}
        />
      )}

      {/* Completed Bill Thermal Print Dialog */}
      <Modal
        isOpen={!!completedSale}
        onClose={() => setCompletedSale(null)}
        title="POS Invoice Finalized!"
        subtitle="Receipt generated and ready"
        maxWidth="sm"
      >
        <div className="space-y-4">
          <div className="flex justify-end gap-3 no-print">
            <button
              onClick={() => window.print()}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-900 dark:bg-blue-600 hover:bg-black dark:hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md active:scale-95 transition-all"
            >
              <Printer className="w-4 h-4" />
              <span>Print Thermal Receipt</span>
            </button>
          </div>

          {completedSale && (
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
              sale={completedSale}
            />
          )}
        </div>
      </Modal>
    </div>
  );
}
