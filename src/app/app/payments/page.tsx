'use client';

import React, { useState, useEffect } from 'react';
import { formatINR } from '@/lib/currency';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import {
  CreditCard,
  ArrowDownLeft,
  ArrowUpRight,
  Search,
  CheckCircle2
} from 'lucide-react';

export default function PaymentsPage() {
  const [payments, setPayments] = useState<any[]>([]);
  const [parties, setParties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form State
  const [type, setType] = useState<'PAYMENT_IN' | 'PAYMENT_OUT'>('PAYMENT_IN');
  const [partyId, setPartyId] = useState('');
  const [partyName, setPartyName] = useState('');
  const [amount, setAmount] = useState<number>(0);
  const [paymentMode, setPaymentMode] = useState('UPI');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [notes, setNotes] = useState('');

  const loadData = async () => {
    try {
      setLoading(true);
      const [payRes, partyRes] = await Promise.all([
        fetch('/api/payments').then((r) => r.json()).catch(() => ({ payments: [] })),
        fetch('/api/parties').then((r) => r.json()).catch(() => ({ parties: [] })),
      ]);

      if (payRes.success && payRes.payments) setPayments(payRes.payments);
      if (partyRes.success && partyRes.parties) setParties(partyRes.parties);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handlePartySelect = (pId: string) => {
    setPartyId(pId);
    const p = parties.find((item) => item.id === pId);
    if (p) {
      setPartyName(p.name);
      if (p.currentBalance > 0 && type === 'PAYMENT_IN') {
        setAmount(p.currentBalance);
      } else if (p.currentBalance < 0 && type === 'PAYMENT_OUT') {
        setAmount(Math.abs(p.currentBalance));
      }
    }
  };

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (amount <= 0) {
      alert('Please enter a valid payment amount greater than 0.');
      return;
    }

    try {
      setSaving(true);
      const res = await fetch('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type,
          partyId: partyId || null,
          partyName: partyName || 'Cash Party',
          amount,
          paymentMode,
          referenceNumber,
          notes,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setIsModalOpen(false);
        setAmount(0);
        setReferenceNumber('');
        setNotes('');
        loadData();
      } else {
        alert('Failed: ' + data.error);
      }
    } catch (err: any) {
      alert('Error: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const safePayments = Array.isArray(payments) ? payments : [];

  const filteredPayments = safePayments.filter(
    (p) =>
      (p?.paymentNumber || '').toLowerCase().includes(search.toLowerCase()) ||
      (p?.partyName || '').toLowerCase().includes(search.toLowerCase()) ||
      (p?.referenceNumber && p.referenceNumber.toLowerCase().includes(search.toLowerCase()))
  );

  const totalIn = safePayments
    .filter((p) => p?.type === 'PAYMENT_IN')
    .reduce((acc, p) => acc + (Number(p?.amount) || 0), 0);

  const totalOut = safePayments
    .filter((p) => p?.type === 'PAYMENT_OUT')
    .reduce((acc, p) => acc + (Number(p?.amount) || 0), 0);

  return (
    <div className="space-y-4 sm:space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm transition-colors duration-150">
        <div>
          <h1 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <span>Payments In & Out</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 sm:mt-1">
            Record customer collections, vendor settlements, and reconcile outstanding ledgers
          </p>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={() => {
              setType('PAYMENT_IN');
              setIsModalOpen(true);
            }}
            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-600/30 transition-all active:scale-95"
          >
            <ArrowDownLeft className="w-4 h-4" />
            <span>+ Payment In</span>
          </button>
          <button
            onClick={() => {
              setType('PAYMENT_OUT');
              setIsModalOpen(true);
            }}
            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-md shadow-rose-600/30 transition-all active:scale-95"
          >
            <ArrowUpRight className="w-4 h-4" />
            <span>- Payment Out</span>
          </button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 p-4 rounded-2xl flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-emerald-800 dark:text-emerald-300 uppercase tracking-wider">
              Total Collections (Payment In)
            </p>
            <h3 className="text-xl font-black text-emerald-950 dark:text-emerald-100 font-mono mt-1">
              {formatINR(totalIn)}
            </h3>
          </div>
          <div className="p-3 bg-emerald-600 text-white rounded-xl shadow-sm">
            <ArrowDownLeft className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 p-4 rounded-2xl flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-rose-800 dark:text-rose-300 uppercase tracking-wider">
              Total Vendor Payouts (Payment Out)
            </p>
            <h3 className="text-xl font-black text-rose-950 dark:text-rose-100 font-mono mt-1">
              {formatINR(totalOut)}
            </h3>
          </div>
          <div className="p-3 bg-rose-600 text-white rounded-xl shadow-sm">
            <ArrowUpRight className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white dark:bg-slate-900 p-3 sm:p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between transition-colors duration-150">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by receipt #, party or ref..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden transition-colors duration-150">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/60 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase border-b border-slate-200 dark:border-slate-800">
                <th className="py-3 px-4 whitespace-nowrap">Receipt No</th>
                <th className="py-3 px-4 whitespace-nowrap">Date</th>
                <th className="py-3 px-4 whitespace-nowrap">Type</th>
                <th className="py-3 px-4 whitespace-nowrap">Party</th>
                <th className="py-3 px-4 whitespace-nowrap">Mode & Ref</th>
                <th className="py-3 px-4 text-right whitespace-nowrap">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    Loading payments...
                  </td>
                </tr>
              ) : filteredPayments.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    No payment entries recorded yet.
                  </td>
                </tr>
              ) : (
                filteredPayments.map((p) => {
                  const isIn = p.type === 'PAYMENT_IN';

                  return (
                    <tr key={p.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-900 dark:text-slate-100 whitespace-nowrap">
                        {p.paymentNumber}
                      </td>
                      <td className="py-3.5 px-4 text-slate-500 dark:text-slate-400 whitespace-nowrap">
                        {new Date(p.paymentDate).toLocaleDateString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <Badge variant={isIn ? 'success' : 'danger'}>
                          {isIn ? 'Payment In (Received)' : 'Payment Out (Paid)'}
                        </Badge>
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-slate-900 dark:text-slate-100 whitespace-nowrap">
                        {p.partyName}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 dark:text-slate-400 whitespace-nowrap">
                        <span className="font-mono font-bold">{p.paymentMode}</span>
                        {p.referenceNumber && (
                          <span className="text-[10px] text-slate-400 dark:text-slate-500 ml-1.5 font-mono">
                            (Ref: {p.referenceNumber})
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-black text-sm whitespace-nowrap">
                        <span className={isIn ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}>
                          {isIn ? '+' : '-'}{formatINR(p.amount)}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Record Payment Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={type === 'PAYMENT_IN' ? 'Record Customer Collection (Payment In)' : 'Record Supplier Payout (Payment Out)'}
        subtitle="Updates double-entry cash/bank ledger and party outstanding automatically"
        maxWidth="md"
      >
        <form onSubmit={handleRecordPayment} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Select Party</label>
            <select
              value={partyId}
              onChange={(e) => handlePartySelect(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-medium text-slate-900 dark:text-slate-100"
            >
              <option value="">-- Choose Customer or Supplier --</option>
              {parties.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} (Bal: {formatINR(p.currentBalance)})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Amount (₹)</label>
            <input
              type="number"
              step="any"
              required
              min="1"
              value={amount}
              onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono font-black text-base text-slate-900 dark:text-slate-100"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Payment Mode</label>
              <select
                value={paymentMode}
                onChange={(e) => setPaymentMode(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-slate-900 dark:text-slate-100"
              >
                <option value="UPI">UPI (GPay/PhonePe/Paytm)</option>
                <option value="BANK">Bank Account (NEFT/RTGS)</option>
                <option value="CASH">Cash in Hand</option>
                <option value="CHEQUE">Cheque</option>
              </select>
            </div>
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Reference / UTR No.</label>
              <input
                type="text"
                placeholder="e.g. UPI Ref #402910"
                value={referenceNumber}
                onChange={(e) => setReferenceNumber(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono text-slate-900 dark:text-slate-100"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Remarks / Narration</label>
            <input
              type="text"
              placeholder="e.g. Received for March bill clearing"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100"
            />
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
              className={`flex items-center gap-2 px-5 py-2 text-white rounded-xl text-xs font-bold shadow-md active:scale-95 ${
                type === 'PAYMENT_IN'
                  ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/30'
                  : 'bg-rose-600 hover:bg-rose-700 shadow-rose-600/30'
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{saving ? 'Posting...' : 'Post Payment Entry'}</span>
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
