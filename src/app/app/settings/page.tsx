'use client';

import React, { useState, useEffect } from 'react';
import { INDIAN_STATES } from '@/types';
import {
  Settings,
  Building2,
  CreditCard,
  FileText,
  Save,
  CheckCircle2
} from 'lucide-react';

export default function SettingsPage() {
  const [business, setBusiness] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Form Fields
  const [userName, setUserName] = useState('Rahul');
  const [name, setName] = useState('');
  const [legalName, setLegalName] = useState('');
  const [type, setType] = useState('Retail');
  const [gstin, setGstin] = useState('');
  const [pan, setPan] = useState('');
  const [state, setState] = useState('Delhi');
  const [stateCode, setStateCode] = useState('07');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [upiId, setUpiId] = useState('');
  const [upiName, setUpiName] = useState('');
  const [bankName, setBankName] = useState('');
  const [bankAccountNo, setBankAccountNo] = useState('');
  const [bankIfsc, setBankIfsc] = useState('');
  const [bankBranch, setBankBranch] = useState('');
  const [invoicePrefix, setInvoicePrefix] = useState('INV-');
  const [thermalWidth, setThermalWidth] = useState('80mm');
  const [termsAndConditions, setTermsAndConditions] = useState('');

  useEffect(() => {
    fetch('/api/business')
      .then((r) => r.json())
      .then((res) => {
        if (res.success && res.business) {
          const b = res.business;
          setBusiness(b);
          setUserName(b.users?.[0]?.user?.name || 'Rahul');
          setName(b.name || '');
          setLegalName(b.legalName || '');
          setType(b.type || 'Retail');
          setGstin(b.gstin || '');
          setPan(b.pan || '');
          setState(b.state || 'Delhi');
          setStateCode(b.stateCode || '07');
          setAddress(b.address || '');
          setPhone(b.phone || '');
          setEmail(b.email || '');
          setUpiId(b.upiId || '');
          setUpiName(b.upiName || '');
          setBankName(b.bankName || '');
          setBankAccountNo(b.bankAccountNo || '');
          setBankIfsc(b.bankIfsc || '');
          setBankBranch(b.bankBranch || '');
          setInvoicePrefix(b.invoicePrefix || 'INV-');
          setThermalWidth(b.thermalWidth || '80mm');
          setTermsAndConditions(b.termsAndConditions || '');
        }
      })
      .catch(() => {});
  }, []);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      const res = await fetch('/api/business', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: business?.id,
          userName,
          name,
          legalName,
          type,
          gstin,
          pan,
          state,
          stateCode,
          address,
          phone,
          email,
          upiId,
          upiName,
          bankName,
          bankAccountNo,
          bankIfsc,
          bankBranch,
          invoicePrefix,
          thermalWidth,
          termsAndConditions,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setSavedSuccess(true);
        setTimeout(() => setSavedSuccess(false), 3000);
      } else {
        alert('Failed: ' + data.error);
      }
    } catch (err: any) {
      alert('Error: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSaveSettings} className="space-y-4 sm:space-y-6 max-w-5xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm transition-colors duration-150">
        <div>
          <h1 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-2">
            <Settings className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <span>Business & Billing Settings</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 sm:mt-1">
            Configure GSTIN, UPI QR payments, bank details, and invoice print formats
          </p>
        </div>
        <div className="flex items-center gap-3">
          {savedSuccess && (
            <span className="flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-3 py-1.5 rounded-xl border border-emerald-200 dark:border-emerald-800">
              <CheckCircle2 className="w-4 h-4" />
              <span>Saved Successfully</span>
            </span>
          )}
          <button
            type="submit"
            disabled={saving}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-600/30 transition-all active:scale-95"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Saving...' : 'Save Settings'}</span>
          </button>
        </div>
      </div>

      {/* 1. General Business Profile */}
      <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4 text-xs transition-colors duration-150">
        <h3 className="font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-2">
          <Building2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          <span>General Business Profile</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 sm:gap-4">
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Owner / Operator Name</label>
            <input
              type="text"
              required
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              placeholder="e.g. Rahul"
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 font-semibold"
            />
          </div>
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Business Trade Name</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 font-semibold"
            />
          </div>
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Legal Registered Name</label>
            <input
              type="text"
              value={legalName}
              onChange={(e) => setLegalName(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100"
            />
          </div>
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Business Category</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-medium text-slate-900 dark:text-slate-100"
            >
              <option value="Retail">Retail Store / Kirana</option>
              <option value="Wholesale">Wholesaler / Trader</option>
              <option value="Distributor">Distributor / Agency</option>
              <option value="Manufacturing">Manufacturing / Production</option>
              <option value="Pharmacy">Pharmacy / Medical Store</option>
              <option value="Services">Services / Consulting</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">GSTIN Number</label>
            <input
              type="text"
              value={gstin}
              onChange={(e) => {
                const val = e.target.value.toUpperCase();
                setGstin(val);
                if (val.length >= 2) {
                  const sc = val.substring(0, 2);
                  setStateCode(sc);
                  const st = INDIAN_STATES.find((s) => s.code === sc);
                  if (st) setState(st.name);
                }
              }}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono uppercase font-bold text-slate-900 dark:text-slate-100"
            />
          </div>
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">PAN Number</label>
            <input
              type="text"
              value={pan}
              onChange={(e) => setPan(e.target.value.toUpperCase())}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono uppercase text-slate-900 dark:text-slate-100"
            />
          </div>
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">State & State Code</label>
            <select
              value={state}
              onChange={(e) => {
                const st = INDIAN_STATES.find((s) => s.name === e.target.value);
                if (st) {
                  setState(st.name);
                  setStateCode(st.code);
                }
              }}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-medium text-slate-900 dark:text-slate-100"
            >
              {INDIAN_STATES.map((s) => (
                <option key={s.code} value={s.name}>
                  {s.code} - {s.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Phone / WhatsApp</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
          <div className="sm:col-span-2">
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Full Shop / Office Address</label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100"
            />
          </div>
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100"
            />
          </div>
        </div>
      </div>

      {/* 2. Bank & UPI Details */}
      <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4 text-xs transition-colors duration-150">
        <h3 className="font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-2">
          <CreditCard className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <span>Bank Account & Instant UPI Setup</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">UPI ID (VPA for QR Code)</label>
            <input
              type="text"
              placeholder="e.g. yourbusiness@icici"
              value={upiId}
              onChange={(e) => setUpiId(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono font-bold text-blue-600 dark:text-blue-400"
            />
          </div>
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">UPI Payee Display Name</label>
            <input
              type="text"
              placeholder="e.g. RAHUL JEE TRADING COMPANY"
              value={upiName}
              onChange={(e) => setUpiName(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Bank Name</label>
            <input
              type="text"
              placeholder="e.g. HDFC Bank Ltd"
              value={bankName}
              onChange={(e) => setBankName(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100"
            />
          </div>
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Account Number</label>
            <input
              type="text"
              value={bankAccountNo}
              onChange={(e) => setBankAccountNo(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono text-slate-900 dark:text-slate-100"
            />
          </div>
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">IFSC Code</label>
            <input
              type="text"
              value={bankIfsc}
              onChange={(e) => setBankIfsc(e.target.value.toUpperCase())}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono uppercase text-slate-900 dark:text-slate-100"
            />
          </div>
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Branch Name</label>
            <input
              type="text"
              value={bankBranch}
              onChange={(e) => setBankBranch(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100"
            />
          </div>
        </div>
      </div>

      {/* 3. Invoice & Print Preferences */}
      <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4 text-xs transition-colors duration-150">
        <h3 className="font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-2">
          <FileText className="w-4 h-4 text-amber-600 dark:text-amber-500" />
          <span>Invoice Customization & Print Format</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Invoice Prefix Series</label>
            <input
              type="text"
              value={invoicePrefix}
              onChange={(e) => setInvoicePrefix(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono text-slate-900 dark:text-slate-100"
            />
          </div>
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Default Thermal Printer Slip Width</label>
            <select
              value={thermalWidth}
              onChange={(e) => setThermalWidth(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-slate-900 dark:text-slate-100"
            >
              <option value="80mm">80mm (Standard POS Desktop)</option>
              <option value="58mm">58mm (Compact Mobile Handheld)</option>
              <option value="A4">A4 / A5 Standard Laser/Inkjet Sheet</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Default Terms & Conditions</label>
          <textarea
            rows={3}
            value={termsAndConditions}
            onChange={(e) => setTermsAndConditions(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100"
          />
        </div>
      </div>
    </form>
  );
}
