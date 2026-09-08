'use client';

import React, { useState, useEffect } from 'react';
import { formatINR } from '@/lib/currency';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { INDIAN_STATES } from '@/types';
import {
  Users,
  Plus,
  Search,
  Share2,
  ArrowDownLeft,
  ArrowUpRight
} from 'lucide-react';

export default function PartiesPage() {
  const [parties, setParties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<'ALL' | 'CUSTOMER' | 'SUPPLIER'>('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  // New Party Form
  const [name, setName] = useState('');
  const [type, setType] = useState('CUSTOMER');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [gstin, setGstin] = useState('');
  const [state, setState] = useState('Delhi');
  const [stateCode, setStateCode] = useState('07');
  const [openingBalance, setOpeningBalance] = useState<number>(0);
  const [creditLimit, setCreditLimit] = useState<number>(50000);
  const [creditDays, setCreditDays] = useState<number>(30);

  const fetchParties = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/parties');
      const data = await res.json();
      if (data.success) {
        setParties(data.parties);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchParties();
  }, []);

  const handleCreateParty = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      const res = await fetch('/api/parties', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          type,
          phone,
          email,
          gstin,
          state,
          stateCode,
          openingBalance,
          creditLimit,
          creditDays,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setIsModalOpen(false);
        fetchParties();
        setName('');
        setPhone('');
        setEmail('');
        setGstin('');
      } else {
        alert('Failed: ' + data.error);
      }
    } catch (e: any) {
      alert('Error: ' + e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleWhatsAppReminder = (party: any) => {
    const text = `Namaste ${party.name},\nThis is a polite reminder regarding your pending balance of ${formatINR(
      party.currentBalance
    )} with RAHUL JEE TRADING COMPANY.\nPlease settle at your earliest convenience.\nThank you!`;

    const phoneNum = party.phone ? party.phone.replace(/[^0-9]/g, '') : '';
    const url = phoneNum
      ? `https://wa.me/91${phoneNum}?text=${encodeURIComponent(text)}`
      : `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  const safeParties = Array.isArray(parties) ? parties : [];

  const filteredParties = safeParties.filter((p) => {
    const matchesSearch =
      (p?.name || '').toLowerCase().includes(search.toLowerCase()) ||
      (p?.phone && p.phone.includes(search)) ||
      (p?.gstin && p.gstin.toLowerCase().includes(search.toLowerCase()));
    const matchesType = typeFilter === 'ALL' || p?.type === typeFilter;
    return matchesSearch && matchesType;
  });

  const totalReceivables = safeParties
    .filter((p) => Number(p?.currentBalance || 0) > 0)
    .reduce((acc, p) => acc + Number(p?.currentBalance || 0), 0);

  const totalPayables = safeParties
    .filter((p) => Number(p?.currentBalance || 0) < 0)
    .reduce((acc, p) => acc + Math.abs(Number(p?.currentBalance || 0)), 0);

  return (
    <div className="space-y-4 sm:space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm transition-colors duration-150">
        <div>
          <h1 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <span>Parties Directory (Customers & Suppliers)</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 sm:mt-1">
            Track customer receivables, supplier payables, credit limits, and send WhatsApp reminders
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-600/30 transition-all active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Party (F4)</span>
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 p-4 rounded-2xl flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-emerald-800 dark:text-emerald-300 uppercase tracking-wider">
              Total Customer Receivables
            </p>
            <h3 className="text-xl font-black text-emerald-950 dark:text-emerald-100 font-mono mt-1">
              {formatINR(totalReceivables)}
            </h3>
          </div>
          <div className="p-3 bg-emerald-600 text-white rounded-xl shadow-sm">
            <ArrowDownLeft className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 p-4 rounded-2xl flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-rose-800 dark:text-rose-300 uppercase tracking-wider">
              Total Supplier Payables
            </p>
            <h3 className="text-xl font-black text-rose-950 dark:text-rose-100 font-mono mt-1">
              {formatINR(totalPayables)}
            </h3>
          </div>
          <div className="p-3 bg-rose-600 text-white rounded-xl shadow-sm">
            <ArrowUpRight className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="bg-white dark:bg-slate-900 p-3 sm:p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4 transition-colors duration-150">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search party by name, phone or GSTIN..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          />
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          {[
            { id: 'ALL', label: 'All Parties' },
            { id: 'CUSTOMER', label: 'Customers' },
            { id: 'SUPPLIER', label: 'Suppliers' },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setTypeFilter(t.id as any)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
                typeFilter === t.id
                  ? 'bg-slate-900 dark:bg-blue-600 text-white shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Parties Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden transition-colors duration-150">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/60 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase border-b border-slate-200 dark:border-slate-800">
                <th className="py-3 px-4 whitespace-nowrap">Party Name</th>
                <th className="py-3 px-4 whitespace-nowrap">Type</th>
                <th className="py-3 px-4 whitespace-nowrap">Contact</th>
                <th className="py-3 px-4 whitespace-nowrap">GSTIN & State</th>
                <th className="py-3 px-4 text-right whitespace-nowrap">Credit Limit</th>
                <th className="py-3 px-4 text-right whitespace-nowrap">Current Balance</th>
                <th className="py-3 px-4 text-center whitespace-nowrap">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    Loading parties...
                  </td>
                </tr>
              ) : filteredParties.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    No parties found matching your search.
                  </td>
                </tr>
              ) : (
                filteredParties.map((p) => {
                  const isReceivable = p.currentBalance > 0;
                  const isPayable = p.currentBalance < 0;

                  return (
                    <tr key={p.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-slate-100 whitespace-nowrap">
                        {p.name}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <Badge
                          variant={
                            p.type === 'CUSTOMER'
                              ? 'primary'
                              : p.type === 'SUPPLIER'
                              ? 'warning'
                              : 'neutral'
                          }
                        >
                          {p.type}
                        </Badge>
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 dark:text-slate-400 whitespace-nowrap">
                        <p>{p.phone || 'No phone'}</p>
                        {p.email && <p className="text-[10px] text-slate-400 dark:text-slate-500">{p.email}</p>}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <p className="font-mono font-semibold text-slate-800 dark:text-slate-200">
                          {p.gstin || 'Unregistered'}
                        </p>
                        <p className="text-[10px] text-slate-400 dark:text-slate-500">{p.state} ({p.stateCode})</p>
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono text-slate-600 dark:text-slate-400 whitespace-nowrap">
                        {formatINR(p.creditLimit)}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-black text-sm whitespace-nowrap">
                        {isReceivable ? (
                          <span className="text-emerald-600 dark:text-emerald-400">+{formatINR(p.currentBalance)}</span>
                        ) : isPayable ? (
                          <span className="text-rose-600 dark:text-rose-400">-{formatINR(Math.abs(p.currentBalance))}</span>
                        ) : (
                          <span className="text-slate-400 dark:text-slate-500">₹0.00</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <button
                          onClick={() => handleWhatsAppReminder(p)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 rounded-lg text-xs font-bold border border-emerald-200 dark:border-emerald-800 transition-colors"
                          title="Share balance statement / reminder on WhatsApp"
                        >
                          <Share2 className="w-3.5 h-3.5" />
                          <span>WhatsApp</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Party Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Add New Customer or Supplier"
        subtitle="Maintain verified GSTIN, state code, and credit controls"
        maxWidth="lg"
      >
        <form onSubmit={handleCreateParty} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Party Type</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-slate-900 dark:text-slate-100"
              >
                <option value="CUSTOMER">Customer (Buyer)</option>
                <option value="SUPPLIER">Supplier (Vendor)</option>
                <option value="BOTH">Both (Customer & Vendor)</option>
              </select>
            </div>
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Party / Business Name</label>
              <input
                type="text"
                required
                placeholder="e.g. Rahul Kirana Store"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Mobile / WhatsApp</label>
              <input
                type="tel"
                placeholder="e.g. 9811223344"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 font-mono"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Email (Optional)</label>
              <input
                type="email"
                placeholder="e.g. rahul@gmail.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">GSTIN (Optional)</label>
              <input
                type="text"
                placeholder="07AAAAA0000A1Z5"
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
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono uppercase text-slate-900 dark:text-slate-100"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">State</label>
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
          </div>

          <div className="grid grid-cols-3 gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Opening Bal (₹)</label>
              <input
                type="number"
                step="any"
                value={openingBalance}
                onChange={(e) => setOpeningBalance(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono text-slate-900 dark:text-slate-100"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Credit Limit (₹)</label>
              <input
                type="number"
                step="any"
                value={creditLimit}
                onChange={(e) => setCreditLimit(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono text-slate-900 dark:text-slate-100"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Credit Days</label>
              <input
                type="number"
                value={creditDays}
                onChange={(e) => setCreditDays(parseInt(e.target.value) || 30)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono text-slate-900 dark:text-slate-100"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-3">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-600/30 active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>{saving ? 'Creating...' : 'Save Party'}</span>
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
