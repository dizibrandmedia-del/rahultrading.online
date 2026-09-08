'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import confetti from 'canvas-confetti';
import { INDIAN_STATES } from '@/types';
import {
  Building2,
  ShieldCheck,
  CreditCard,
  Package,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Zap
} from 'lucide-react';
import { ThemeToggle } from '@/components/theme/ThemeToggle';

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [businessName, setBusinessName] = useState('My Kirana & Retail Mart');
  const [phone, setPhone] = useState('9811223344');
  const [state, setState] = useState('Delhi');
  const [stateCode, setStateCode] = useState('07');
  const [city, setCity] = useState('New Delhi');

  const [gstScheme, setGstScheme] = useState('REGULAR');
  const [gstin, setGstin] = useState('09DMCPG4193P1ZG');

  const [bankName, setBankName] = useState('State Bank of India');
  const [bankAccountNo, setBankAccountNo] = useState('30998811223');
  const [upiId, setUpiId] = useState('shop@sbi');

  const [prodName, setProdName] = useState('Basmati Rice 5kg Bag');
  const [salePrice, setSalePrice] = useState(450);
  const [purchasePrice, setPurchasePrice] = useState(380);
  const [openingStock, setOpeningStock] = useState(25);
  const [gstRate, setGstRate] = useState(5);

  const handleNext = () => {
    if (step === 4) {
      handleFinalSubmit();
    } else {
      setStep((prev) => prev + 1);
    }
  };

  const handleFinalSubmit = async () => {
    try {
      setSubmitting(true);

      // Create Business
      const bRes = await fetch('/api/business', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: businessName,
          phone,
          state,
          stateCode,
          city,
          gstin: gstScheme === 'REGULAR' ? gstin : null,
          bankName,
          bankAccountNo,
          upiId,
          upiName: businessName,
        }),
      });

      const bData = await bRes.json();

      // Create First Product
      if (bData.success && bData.business) {
        await fetch('/api/products', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            businessId: bData.business.id,
            name: prodName,
            salePrice,
            purchasePrice,
            openingStock,
            gstRate,
          }),
        });
      }

      setStep(5);
      confetti({
        particleCount: 120,
        spread: 70,
        origin: { y: 0.6 },
      });
    } catch (e: any) {
      alert('Error during onboarding: ' + e.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col justify-center py-10 px-4 sm:px-6 lg:px-8 relative overflow-hidden transition-colors duration-150">
      {/* Top right Theme Toggle */}
      <div className="absolute top-4 right-4 z-20">
        <ThemeToggle showLabel />
      </div>

      <div className="absolute top-10 left-1/2 -translate-x-1/2 w-96 h-96 bg-blue-600/10 dark:bg-blue-600/20 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="sm:mx-auto sm:w-full sm:max-w-xl text-center relative z-10">
        <div className="inline-flex items-center gap-2 mb-2">
          <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white font-black text-xl shadow-lg">
            R
          </div>
          <span className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-white">RAHUL JEE TRADING COMPANY</span>
        </div>
        <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">60-Second Business Onboarding</h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Set up your Indian GST store and create your first invoice in under 1 minute
        </p>

        {/* Stepper Progress */}
        <div className="flex items-center justify-center gap-2 sm:gap-3 my-5 sm:my-6">
          {[1, 2, 3, 4, 5].map((s) => (
            <div
              key={s}
              className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                step === s
                  ? 'bg-blue-600 text-white ring-4 ring-blue-500/30'
                  : step > s
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
              }`}
            >
              {step > s ? <CheckCircle2 className="w-4 h-4" /> : s}
            </div>
          ))}
        </div>
      </div>

      {/* Card */}
      <div className="sm:mx-auto sm:w-full sm:max-w-xl relative z-10">
        <div className="bg-white dark:bg-slate-900/90 backdrop-blur-xl p-5 sm:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl space-y-6">
          {/* STEP 1: Business Profile */}
          {step === 1 && (
            <div className="space-y-4 animate-in fade-in">
              <div className="flex items-center gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
                <Building2 className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">Step 1: Your Business Profile</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Enter your shop or company name</p>
                </div>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Business / Shop Name</label>
                  <input
                    type="text"
                    required
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-bold text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Owner Mobile</label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">City</label>
                    <input
                      type="text"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">State (GST State Code)</label>
                  <select
                    value={state}
                    onChange={(e) => {
                      const st = INDIAN_STATES.find((s) => s.name === e.target.value);
                      if (st) {
                        setState(st.name);
                        setStateCode(st.code);
                      }
                    }}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                  >
                    {INDIAN_STATES.map((s) => (
                      <option key={s.code} value={s.name}>
                        {s.code} - {s.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: GST Configuration */}
          {step === 2 && (
            <div className="space-y-4 animate-in fade-in">
              <div className="flex items-center gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
                <ShieldCheck className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">Step 2: GST Tax Registration</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Configure your GSTIN and filing scheme</p>
                </div>
              </div>

              <div className="space-y-3 text-xs">
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setGstScheme('REGULAR')}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      gstScheme === 'REGULAR'
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/60 text-blue-900 dark:text-blue-300'
                        : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <p className="font-bold text-xs">Regular GST</p>
                    <p className="text-[10px] mt-0.5 opacity-80">Full CGST/SGST/IGST tax invoices with Input Credit</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setGstScheme('COMPOSITION')}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      gstScheme === 'COMPOSITION'
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/60 text-blue-900 dark:text-blue-300'
                        : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <p className="font-bold text-xs">Composition / Non-GST</p>
                    <p className="text-[10px] mt-0.5 opacity-80">Bill of Supply for small retail stores without GST</p>
                  </button>
                </div>

                {gstScheme === 'REGULAR' && (
                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">15-Digit GSTIN</label>
                    <input
                      type="text"
                      required
                      value={gstin}
                      onChange={(e) => setGstin(e.target.value.toUpperCase())}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-mono uppercase font-bold"
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* STEP 3: Bank & UPI */}
          {step === 3 && (
            <div className="space-y-4 animate-in fade-in">
              <div className="flex items-center gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
                <CreditCard className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">Step 3: Payments & Instant UPI QR</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Receive payments directly into your bank account</p>
                </div>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">UPI ID (For Print & QR)</label>
                  <input
                    type="text"
                    required
                    placeholder="yourshop@icici"
                    value={upiId}
                    onChange={(e) => setUpiId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-mono font-bold"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Bank Name</label>
                    <input
                      type="text"
                      value={bankName}
                      onChange={(e) => setBankName(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Account Number</label>
                    <input
                      type="text"
                      value={bankAccountNo}
                      onChange={(e) => setBankAccountNo(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-mono"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: First Product */}
          {step === 4 && (
            <div className="space-y-4 animate-in fade-in">
              <div className="flex items-center gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
                <Package className="w-6 h-6 text-amber-600 dark:text-amber-400" />
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">Step 4: Add Your First Item</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Add an inventory item to test instant billing</p>
                </div>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Product Name</label>
                  <input
                    type="text"
                    required
                    value={prodName}
                    onChange={(e) => setProdName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Sale Price (₹)</label>
                    <input
                      type="number"
                      value={salePrice}
                      onChange={(e) => setSalePrice(parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-mono font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Purchase Cost (₹)</label>
                    <input
                      type="number"
                      value={purchasePrice}
                      onChange={(e) => setPurchasePrice(parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Opening Stock</label>
                    <input
                      type="number"
                      value={openingStock}
                      onChange={(e) => setOpeningStock(parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">GST Rate</label>
                    <select
                      value={gstRate}
                      onChange={(e) => setGstRate(parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-bold"
                    >
                      <option value="0">0%</option>
                      <option value="5">5%</option>
                      <option value="12">12%</option>
                      <option value="18">18%</option>
                      <option value="28">28%</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 5: Congratulations / Ready */}
          {step === 5 && (
            <div className="text-center py-6 space-y-4 animate-in zoom-in-95">
              <div className="w-16 h-16 bg-emerald-600 text-white rounded-full flex items-center justify-center mx-auto shadow-xl shadow-emerald-600/40">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <h2 className="text-2xl font-black text-slate-900 dark:text-white">Your Business is Ready to Bill!</h2>
              <p className="text-xs text-slate-600 dark:text-slate-300 max-w-sm mx-auto">
                <strong className="text-slate-900 dark:text-white">{businessName}</strong> has been configured with GST tax engine, inventory ledger, and instant POS terminal.
              </p>

              <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
                <Link
                  href="/app/sales/new"
                  className="w-full sm:w-auto px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-lg shadow-blue-600/30 transition-all flex items-center justify-center gap-2 active:scale-95"
                >
                  <Zap className="w-4 h-4 fill-current" />
                  <span>Create First GST Invoice</span>
                </Link>

                <Link
                  href="/app"
                  className="w-full sm:w-auto px-6 py-3 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-white rounded-xl text-xs font-bold transition-all text-center"
                >
                  Go to Dashboard
                </Link>
              </div>
            </div>
          )}

          {/* Buttons Navigation */}
          {step < 5 && (
            <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
              {step > 1 ? (
                <button
                  type="button"
                  onClick={() => setStep((prev) => prev - 1)}
                  className="flex items-center gap-1 text-xs font-bold text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back</span>
                </button>
              ) : (
                <div />
              )}

              <button
                type="button"
                onClick={handleNext}
                disabled={submitting}
                className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-lg shadow-blue-600/30 transition-all active:scale-95"
              >
                <span>{step === 4 ? (submitting ? 'Setting up...' : 'Finish Setup') : 'Continue'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
