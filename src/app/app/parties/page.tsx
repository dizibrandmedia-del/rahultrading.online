'use client';

import React, { useState, useEffect } from 'react';
import { formatINR } from '@/lib/currency';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { INDIAN_STATES } from '@/types';
import { normalizeWhatsAppNumber } from '@/lib/pdfGenerator';
import {
  Users,
  Plus,
  Search,
  Share2,
  ArrowDownLeft,
  ArrowUpRight,
  History,
  FileText,
  CreditCard,
  ChevronDown,
  ChevronUp,
  Loader2,
  Calendar,
  Printer,
  Package,
  ExternalLink,
  CheckCircle2,
  Clock,
  AlertCircle
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

  // Party History State
  const [selectedPartyForHistory, setSelectedPartyForHistory] = useState<any | null>(null);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyData, setHistoryData] = useState<{
    party?: any;
    metrics?: any;
    transactions?: any[];
  } | null>(null);
  const [historySearch, setHistorySearch] = useState('');
  const [directionFilter, setDirectionFilter] = useState<'ALL' | 'INBOUND' | 'OUTBOUND'>('ALL');
  const [historyTypeFilter, setHistoryTypeFilter] = useState<'ALL' | 'INVOICES' | 'PAYMENTS'>('ALL');
  const [expandedTxId, setExpandedTxId] = useState<string | null>(null);

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

    const rawPhone = party.phone;
    const phoneNum = normalizeWhatsAppNumber(rawPhone);
    const url = phoneNum
      ? `https://api.whatsapp.com/send?phone=${phoneNum}&text=${encodeURIComponent(text)}`
      : `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  const handleViewPartyHistory = async (party: any) => {
    setSelectedPartyForHistory(party);
    setHistoryLoading(true);
    setHistoryData(null);
    setHistorySearch('');
    setDirectionFilter('ALL');
    setHistoryTypeFilter('ALL');
    setExpandedTxId(null);

    try {
      const res = await fetch(`/api/parties/${party.id}/history`);
      const data = await res.json();
      if (data.success) {
        setHistoryData(data);
      } else {
        alert('Failed to load transaction history: ' + data.error);
      }
    } catch (err: any) {
      console.error('Error fetching party history:', err);
      alert('Error fetching party history: ' + err.message);
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleShareStatement = (party: any, metrics: any) => {
    const rawPhone = party.phone;
    const phone = normalizeWhatsAppNumber(rawPhone);
    const isRec = Number(party.currentBalance) > 0;
    const isPay = Number(party.currentBalance) < 0;

    const balText = isRec
      ? `Pending Due: ${formatINR(party.currentBalance)} (Receivable)`
      : isPay
      ? `Pending Balance: ${formatINR(Math.abs(party.currentBalance))} (Payable)`
      : `Account Balance: Settled (₹0.00)`;

    const text = `Namaste ${party.name},\n\nHere is your verified Account Ledger Statement with RAHUL JEE TRADING COMPANY:\n\n• ${balText}\n• Total Inbound (Goods/Payments Received): ${formatINR(metrics?.totalInbound || 0)}\n• Total Outbound (Goods Sent/Payments Made): ${formatINR(metrics?.totalOutbound || 0)}\n• Total Transactions: ${metrics?.totalTransactions || 0}\n\nPlease let us know if you need any clarification.\nThank you!`;

    const url = phone
      ? `https://api.whatsapp.com/send?phone=${phone}&text=${encodeURIComponent(text)}`
      : `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;

    window.open(url, '_blank');
  };

  const handlePrintStatement = () => {
    const prev = document.title;
    document.title = `Statement_${selectedPartyForHistory?.name || 'Party'}`;
    window.print();
    setTimeout(() => {
      document.title = prev;
    }, 1000);
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

  // History filtering inside modal
  const rawTxList = historyData?.transactions || [];
  const filteredHistory = rawTxList.filter((tx) => {
    // Direction filter
    if (directionFilter !== 'ALL' && tx.direction !== directionFilter) return false;

    // Type filter
    if (historyTypeFilter === 'INVOICES') {
      if (tx.type !== 'GST_SALE' && tx.type !== 'NON_GST_SALE' && tx.type !== 'PURCHASE') return false;
    } else if (historyTypeFilter === 'PAYMENTS') {
      if (tx.type !== 'PAYMENT_IN' && tx.type !== 'PAYMENT_OUT') return false;
    }

    // Search filter
    if (historySearch.trim()) {
      const q = historySearch.toLowerCase();
      const matchRef = (tx.referenceNumber || '').toLowerCase().includes(q);
      const matchDesc = (tx.description || '').toLowerCase().includes(q);
      const matchTitle = (tx.title || '').toLowerCase().includes(q);
      const matchItem = (tx.items || []).some((it: any) =>
        (it.productName || '').toLowerCase().includes(q)
      );
      if (!matchRef && !matchDesc && !matchTitle && !matchItem) return false;
    }

    return true;
  });

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
            Click any party name to inspect complete transaction history, sent/received breakdown, and balances
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
                <th className="py-3 px-4 whitespace-nowrap">Party Name (Click for History)</th>
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
                    <div className="flex items-center justify-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                      <span>Loading parties directory...</span>
                    </div>
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
                        <button
                          type="button"
                          onClick={() => handleViewPartyHistory(p)}
                          className="group flex items-center gap-2 text-left text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-bold transition-colors cursor-pointer"
                          title="Click to view detailed transaction history & ledger"
                        >
                          <span className="group-hover:underline underline-offset-2">{p.name}</span>
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 group-hover:bg-blue-600 group-hover:text-white transition-all">
                            <History className="w-3 h-3" />
                            <span>Ledger</span>
                          </span>
                        </button>
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
                        <p className="font-mono">{p.phone || 'No phone'}</p>
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
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleViewPartyHistory(p)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 dark:hover:bg-blue-900/60 text-blue-700 dark:text-blue-300 rounded-lg text-xs font-bold border border-blue-200 dark:border-blue-800 transition-colors cursor-pointer"
                            title="View complete transaction history & ledger"
                          >
                            <History className="w-3.5 h-3.5" />
                            <span>History</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleWhatsAppReminder(p)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 rounded-lg text-xs font-bold border border-emerald-200 dark:border-emerald-800 transition-colors cursor-pointer"
                            title="Share balance statement / reminder on WhatsApp"
                          >
                            <Share2 className="w-3.5 h-3.5" />
                            <span>WhatsApp</span>
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

      {/* Detailed Party Transaction History & Ledger Modal */}
      <Modal
        isOpen={!!selectedPartyForHistory}
        onClose={() => setSelectedPartyForHistory(null)}
        title={`Transaction History: ${selectedPartyForHistory?.name || 'Party'}`}
        subtitle="Chronological record of goods sent/received, invoices, bills, payments, and running balance"
        maxWidth="full"
      >
        <div className="space-y-4 text-xs">
          {/* Party Header Details & Quick Action Buttons */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 dark:bg-slate-800/60 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm sm:text-base font-black text-slate-900 dark:text-slate-100">
                  {selectedPartyForHistory?.name}
                </span>
                <Badge
                  variant={
                    selectedPartyForHistory?.type === 'CUSTOMER'
                      ? 'primary'
                      : selectedPartyForHistory?.type === 'SUPPLIER'
                      ? 'warning'
                      : 'neutral'
                  }
                >
                  {selectedPartyForHistory?.type}
                </Badge>
                {selectedPartyForHistory?.gstin && (
                  <span className="px-2 py-0.5 bg-slate-200 dark:bg-slate-700 rounded font-mono text-[11px] font-bold text-slate-800 dark:text-slate-200">
                    GSTIN: {selectedPartyForHistory.gstin}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-4 text-slate-500 dark:text-slate-400 text-[11px] flex-wrap">
                <span>Phone: <strong className="text-slate-700 dark:text-slate-300 font-mono">{selectedPartyForHistory?.phone || 'N/A'}</strong></span>
                <span>State: <strong className="text-slate-700 dark:text-slate-300">{selectedPartyForHistory?.state || 'Delhi'} ({selectedPartyForHistory?.stateCode || '07'})</strong></span>
                {selectedPartyForHistory?.address && (
                  <span>Address: <strong className="text-slate-700 dark:text-slate-300">{selectedPartyForHistory.address}</strong></span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-auto shrink-0 no-print">
              <button
                type="button"
                onClick={handlePrintStatement}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold shadow-sm transition-all active:scale-95 cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Ledger</span>
              </button>

              <button
                type="button"
                onClick={() =>
                  handleShareStatement(
                    selectedPartyForHistory,
                    historyData?.metrics
                  )
                }
                className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all active:scale-95 cursor-pointer"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>Share WhatsApp Statement</span>
              </button>
            </div>
          </div>

          {/* KPI Summary Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
            {/* 1. Net Balance */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3 rounded-xl shadow-xs">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Current Outstanding</p>
              <p className="text-lg sm:text-xl font-black font-mono mt-1">
                {Number(selectedPartyForHistory?.currentBalance || 0) > 0 ? (
                  <span className="text-emerald-600 dark:text-emerald-400">
                    +{formatINR(selectedPartyForHistory.currentBalance)}
                  </span>
                ) : Number(selectedPartyForHistory?.currentBalance || 0) < 0 ? (
                  <span className="text-rose-600 dark:text-rose-400">
                    -{formatINR(Math.abs(selectedPartyForHistory.currentBalance))}
                  </span>
                ) : (
                  <span className="text-slate-500">₹0.00</span>
                )}
              </p>
              <p className="text-[10px] text-slate-400 mt-0.5">
                {Number(selectedPartyForHistory?.currentBalance || 0) > 0
                  ? 'Receivable from customer'
                  : Number(selectedPartyForHistory?.currentBalance || 0) < 0
                  ? 'Payable to supplier'
                  : 'Account settled'}
              </p>
            </div>

            {/* 2. Total Inbound */}
            <div className="bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/50 p-3 rounded-xl shadow-xs">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300">
                  Total Inbound (Received)
                </p>
                <ArrowDownLeft className="w-4 h-4 text-emerald-600" />
              </div>
              <p className="text-lg sm:text-xl font-black font-mono text-emerald-950 dark:text-emerald-100 mt-1">
                {formatINR(historyData?.metrics?.totalInbound || 0)}
              </p>
              <p className="text-[10px] text-emerald-700/80 dark:text-emerald-400 mt-0.5">
                Goods received / Payments collected
              </p>
            </div>

            {/* 3. Total Outbound */}
            <div className="bg-rose-50/70 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800/50 p-3 rounded-xl shadow-xs">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-bold uppercase tracking-wider text-rose-800 dark:text-rose-300">
                  Total Outbound (Sent)
                </p>
                <ArrowUpRight className="w-4 h-4 text-rose-600" />
              </div>
              <p className="text-lg sm:text-xl font-black font-mono text-rose-950 dark:text-rose-100 mt-1">
                {formatINR(historyData?.metrics?.totalOutbound || 0)}
              </p>
              <p className="text-[10px] text-rose-700/80 dark:text-rose-400 mt-0.5">
                Goods invoiced / Payments made
              </p>
            </div>

            {/* 4. Total Records */}
            <div className="bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/50 p-3 rounded-xl shadow-xs">
              <p className="text-[10px] font-bold uppercase tracking-wider text-blue-800 dark:text-blue-300">
                Total Transactions
              </p>
              <p className="text-lg sm:text-xl font-black font-mono text-blue-950 dark:text-blue-100 mt-1">
                {historyData?.metrics?.totalTransactions || 0}
              </p>
              <p className="text-[10px] text-blue-700/80 dark:text-blue-400 mt-0.5">
                {historyData?.metrics?.salesCount || 0} GST, {historyData?.metrics?.nonGstCount || 0} Non-GST, {historyData?.metrics?.purchasesCount || 0} Pur, {historyData?.metrics?.paymentsCount || 0} Pay
              </p>
            </div>
          </div>

          {/* Filter & Search Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5 bg-slate-50 dark:bg-slate-800/40 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 no-print">
            <div className="relative w-full sm:w-72">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search invoice #, item, or note..."
                value={historySearch}
                onChange={(e) => setHistorySearch(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto">
              {/* Direction Filter */}
              <div className="flex items-center gap-1 bg-white dark:bg-slate-900 p-1 rounded-lg border border-slate-200 dark:border-slate-700">
                {[
                  { id: 'ALL', label: 'All Directions' },
                  { id: 'INBOUND', label: '⬇ Inbound (Received)' },
                  { id: 'OUTBOUND', label: '⬆ Outbound (Sent)' },
                ].map((d) => (
                  <button
                    key={d.id}
                    onClick={() => setDirectionFilter(d.id as any)}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all ${
                      directionFilter === d.id
                        ? 'bg-slate-900 dark:bg-blue-600 text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    {d.label}
                  </button>
                ))}
              </div>

              {/* Type Filter */}
              <div className="flex items-center gap-1 bg-white dark:bg-slate-900 p-1 rounded-lg border border-slate-200 dark:border-slate-700">
                {[
                  { id: 'ALL', label: 'All Types' },
                  { id: 'INVOICES', label: 'Invoices & Bills' },
                  { id: 'PAYMENTS', label: 'Payments' },
                ].map((tf) => (
                  <button
                    key={tf.id}
                    onClick={() => setHistoryTypeFilter(tf.id as any)}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all ${
                      historyTypeFilter === tf.id
                        ? 'bg-slate-900 dark:bg-blue-600 text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    {tf.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Transaction History Table */}
          <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-white dark:bg-slate-900">
            <div className="overflow-x-auto max-h-[52vh]">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="sticky top-0 bg-slate-100 dark:bg-slate-800 text-[10px] font-bold text-slate-600 dark:text-slate-300 uppercase border-b border-slate-200 dark:border-slate-700 z-10">
                  <tr>
                    <th className="py-2.5 px-3 whitespace-nowrap">Date & Time</th>
                    <th className="py-2.5 px-3 whitespace-nowrap">Type & Reference</th>
                    <th className="py-2.5 px-3 whitespace-nowrap">Direction</th>
                    <th className="py-2.5 px-4">What Was Sent / Received (Items & Details)</th>
                    <th className="py-2.5 px-3 text-right whitespace-nowrap">Amount</th>
                    <th className="py-2.5 px-3 text-center whitespace-nowrap">Payment Status</th>
                    <th className="py-2.5 px-3 text-right whitespace-nowrap">Running Bal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {historyLoading ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-400">
                        <div className="flex items-center justify-center gap-2">
                          <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                          <span className="font-medium">Loading full ledger history...</span>
                        </div>
                      </td>
                    </tr>
                  ) : filteredHistory.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-400">
                        <Package className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-600 mb-2" />
                        <p className="font-semibold text-slate-600 dark:text-slate-400">No transactions recorded</p>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          {historySearch ? 'No records match your filter search.' : 'Create an invoice, purchase, or record a payment to see transactions.'}
                        </p>
                      </td>
                    </tr>
                  ) : (
                    filteredHistory.map((tx) => {
                      const isInbound = tx.direction === 'INBOUND';
                      const isExpanded = expandedTxId === tx.id;
                      const hasItems = Array.isArray(tx.items) && tx.items.length > 0;

                      return (
                        <React.Fragment key={tx.id}>
                          <tr className="hover:bg-slate-50/90 dark:hover:bg-slate-800/40 transition-colors">
                            {/* Date */}
                            <td className="py-3 px-3 whitespace-nowrap">
                              <p className="font-bold text-slate-900 dark:text-slate-100">
                                {new Date(tx.date).toLocaleDateString('en-IN', {
                                  day: '2-digit',
                                  month: 'short',
                                  year: 'numeric',
                                })}
                              </p>
                              <p className="text-[10px] text-slate-400 font-mono">
                                {new Date(tx.date).toLocaleTimeString('en-IN', {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </p>
                            </td>

                            {/* Type & Ref */}
                            <td className="py-3 px-3 whitespace-nowrap">
                              <div className="flex items-center gap-1.5">
                                <span
                                  className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                                    tx.type === 'GST_SALE'
                                      ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                                      : tx.type === 'NON_GST_SALE'
                                      ? 'bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300'
                                      : tx.type === 'PURCHASE'
                                      ? 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300'
                                      : tx.type === 'PAYMENT_IN'
                                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                      : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                                  }`}
                                >
                                  {tx.typeLabel}
                                </span>
                              </div>
                              <p className="font-mono font-bold text-slate-800 dark:text-slate-200 mt-1">
                                #{tx.referenceNumber}
                              </p>
                            </td>

                            {/* Direction */}
                            <td className="py-3 px-3 whitespace-nowrap">
                              {isInbound ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                                  <ArrowDownLeft className="w-3 h-3 text-emerald-600" />
                                  <span>INBOUND</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
                                  <ArrowUpRight className="w-3 h-3 text-rose-600" />
                                  <span>OUTBOUND</span>
                                </span>
                              )}
                            </td>

                            {/* What was Sent / Received */}
                            <td className="py-3 px-4">
                              <p className="font-medium text-slate-800 dark:text-slate-200 line-clamp-2">
                                {tx.description}
                              </p>
                              {tx.notes && (
                                <p className="text-[10px] text-slate-400 italic mt-0.5">
                                  Note: {tx.notes}
                                </p>
                              )}
                              {hasItems && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    setExpandedTxId(isExpanded ? null : tx.id)
                                  }
                                  className="mt-1 inline-flex items-center gap-1 text-[10px] font-bold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                                >
                                  <span>
                                    {isExpanded ? 'Hide item breakdown' : `View ${tx.items.length} line item(s)`}
                                  </span>
                                  {isExpanded ? (
                                    <ChevronUp className="w-3 h-3" />
                                  ) : (
                                    <ChevronDown className="w-3 h-3" />
                                  )}
                                </button>
                              )}
                            </td>

                            {/* Amount */}
                            <td className="py-3 px-3 text-right whitespace-nowrap">
                              <p className="font-mono font-black text-sm text-slate-900 dark:text-slate-100">
                                {formatINR(tx.amount)}
                              </p>
                              {tx.balanceAmount > 0 && (
                                <p className="text-[10px] font-mono text-rose-600 dark:text-rose-400">
                                  Due: {formatINR(tx.balanceAmount)}
                                </p>
                              )}
                            </td>

                            {/* Status & Mode */}
                            <td className="py-3 px-3 text-center whitespace-nowrap">
                              <Badge
                                variant={
                                  tx.paymentStatus === 'PAID'
                                    ? 'success'
                                    : tx.paymentStatus === 'PARTIAL'
                                    ? 'warning'
                                    : 'danger'
                                }
                              >
                                {tx.paymentStatus}
                              </Badge>
                              <p className="text-[10px] text-slate-400 font-medium uppercase mt-0.5">
                                {tx.paymentMode}
                              </p>
                            </td>

                            {/* Running Balance */}
                            <td className="py-3 px-3 text-right font-mono font-bold whitespace-nowrap">
                              {tx.runningBalance > 0 ? (
                                <span className="text-emerald-600 dark:text-emerald-400">
                                  +{formatINR(tx.runningBalance)}
                                </span>
                              ) : tx.runningBalance < 0 ? (
                                <span className="text-rose-600 dark:text-rose-400">
                                  -{formatINR(Math.abs(tx.runningBalance))}
                                </span>
                              ) : (
                                <span className="text-slate-400">₹0.00</span>
                              )}
                            </td>
                          </tr>

                          {/* Expanded Item Breakdown Row */}
                          {isExpanded && hasItems && (
                            <tr className="bg-slate-50/70 dark:bg-slate-800/50">
                              <td colSpan={7} className="py-3 px-6">
                                <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
                                  <div className="flex items-center justify-between mb-2">
                                    <h4 className="text-[11px] font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                                      <Package className="w-3.5 h-3.5 text-blue-600" />
                                      <span>Detailed Items for #{tx.referenceNumber}</span>
                                    </h4>
                                    <span className="text-[10px] text-slate-400 font-mono">
                                      {tx.items.length} item(s) in this transaction
                                    </span>
                                  </div>
                                  <table className="w-full text-left text-[11px]">
                                    <thead>
                                      <tr className="text-[10px] font-bold text-slate-400 uppercase border-b border-slate-100 dark:border-slate-800">
                                        <th className="py-1.5">Product / Item</th>
                                        <th className="py-1.5 text-right">Quantity</th>
                                        <th className="py-1.5 text-right">Rate (₹)</th>
                                        <th className="py-1.5 text-right">Total (₹)</th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono">
                                      {tx.items.map((it: any, idx: number) => (
                                        <tr key={idx}>
                                          <td className="py-1.5 font-sans font-medium text-slate-800 dark:text-slate-200">
                                            {it.productName}
                                          </td>
                                          <td className="py-1.5 text-right text-slate-600 dark:text-slate-400">
                                            {it.quantity} {it.unit}
                                          </td>
                                          <td className="py-1.5 text-right text-slate-600 dark:text-slate-400">
                                            {formatINR(it.unitPrice)}
                                          </td>
                                          <td className="py-1.5 text-right font-bold text-slate-900 dark:text-slate-100">
                                            {formatINR(it.totalAmount)}
                                          </td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </Modal>

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
