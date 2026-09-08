'use client';

import React, { useState, useEffect } from 'react';
import { formatINR } from '@/lib/currency';
import { Modal } from '@/components/ui/Modal';
import {
  ArrowUpRight,
  Plus,
  Search,
  Receipt,
  DollarSign
} from 'lucide-react';

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form State
  const [title, setTitle] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [amount, setAmount] = useState<number>(0);
  const [gstRate, setGstRate] = useState<number>(0);
  const [paymentMode, setPaymentMode] = useState('CASH');
  const [vendorName, setVendorName] = useState('');
  const [vendorGstin, setVendorGstin] = useState('');
  const [notes, setNotes] = useState('');

  const fetchExpenses = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/expenses');
      const data = await res.json();
      if (data.success) {
        setExpenses(data.expenses);
        setCategories(data.categories);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, []);

  const handleCreateExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (amount <= 0) {
      alert('Please enter a valid expense amount.');
      return;
    }

    try {
      setSaving(true);
      const res = await fetch('/api/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          categoryId: categoryId || null,
          amount,
          gstRate,
          paymentMode,
          vendorName,
          vendorGstin,
          notes,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setIsModalOpen(false);
        setTitle('');
        setAmount(0);
        setVendorName('');
        setVendorGstin('');
        fetchExpenses();
      } else {
        alert('Failed: ' + data.error);
      }
    } catch (err: any) {
      alert('Error: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const safeExpenses = Array.isArray(expenses) ? expenses : [];

  const filteredExpenses = safeExpenses.filter(
    (e) =>
      (e?.title || '').toLowerCase().includes(search.toLowerCase()) ||
      (e?.vendorName && e.vendorName.toLowerCase().includes(search.toLowerCase())) ||
      (e?.category?.name && e.category.name.toLowerCase().includes(search.toLowerCase()))
  );

  const totalExpense = safeExpenses.reduce((acc, e) => acc + (Number(e?.amount) || 0), 0);
  const totalTaxCredit = safeExpenses.reduce((acc, e) => acc + (Number(e?.taxAmount) || 0), 0);

  return (
    <div className="space-y-4 sm:space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm transition-colors duration-150">
        <div>
          <h1 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-2">
            <ArrowUpRight className="w-5 h-5 text-rose-600 dark:text-rose-400" />
            <span>Operating & Shop Expenses</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 sm:mt-1">
            Track electricity, rent, salaries, and input GST deductions for business expenditure
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-md shadow-rose-600/30 transition-all active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>Record Expense</span>
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        <div className="bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 p-4 rounded-2xl flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-rose-800 dark:text-rose-300 uppercase tracking-wider">
              Total Expenses Recorded
            </p>
            <h3 className="text-xl font-black text-rose-950 dark:text-rose-100 font-mono mt-1">
              {formatINR(totalExpense)}
            </h3>
          </div>
          <div className="p-3 bg-rose-600 text-white rounded-xl shadow-sm">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/60 p-4 rounded-2xl flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-blue-800 dark:text-blue-300 uppercase tracking-wider">
              GST Tax Input Credit on Expenses
            </p>
            <h3 className="text-xl font-black text-blue-950 dark:text-blue-100 font-mono mt-1">
              {formatINR(totalTaxCredit)}
            </h3>
          </div>
          <div className="p-3 bg-blue-600 text-white rounded-xl shadow-sm">
            <Receipt className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white dark:bg-slate-900 p-3 sm:p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between transition-colors duration-150">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search expenses by title or vendor..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500/20"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden transition-colors duration-150">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/60 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase border-b border-slate-200 dark:border-slate-800">
                <th className="py-3 px-4 whitespace-nowrap">Date</th>
                <th className="py-3 px-4 whitespace-nowrap">Expense Title</th>
                <th className="py-3 px-4 whitespace-nowrap">Category</th>
                <th className="py-3 px-4 whitespace-nowrap">Vendor / Party</th>
                <th className="py-3 px-4 whitespace-nowrap">Mode</th>
                <th className="py-3 px-4 text-right whitespace-nowrap">Tax (GST)</th>
                <th className="py-3 px-4 text-right whitespace-nowrap">Total Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    Loading expenses...
                  </td>
                </tr>
              ) : filteredExpenses.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    No expense records found.
                  </td>
                </tr>
              ) : (
                filteredExpenses.map((exp) => (
                  <tr key={exp.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-4 text-slate-500 dark:text-slate-400 whitespace-nowrap">
                      {new Date(exp.expenseDate).toLocaleDateString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-slate-100 whitespace-nowrap">
                      {exp.title}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 dark:text-slate-400 whitespace-nowrap">
                      {exp.category?.name || 'General Expense'}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 dark:text-slate-400 whitespace-nowrap">
                      <p>{exp.vendorName || '-'}</p>
                      {exp.vendorGstin && (
                        <p className="font-mono text-[10px] text-slate-400 dark:text-slate-500">GST: {exp.vendorGstin}</p>
                      )}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-[11px] text-slate-600 dark:text-slate-400 whitespace-nowrap">
                      {exp.paymentMode}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-medium text-slate-600 dark:text-slate-400 whitespace-nowrap">
                      {exp.gstRate > 0 ? (
                        <span>
                          {formatINR(exp.taxAmount)} ({exp.gstRate}%)
                        </span>
                      ) : (
                        '₹0.00'
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-black text-rose-600 dark:text-rose-400 text-sm whitespace-nowrap">
                      {formatINR(exp.amount)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Expense Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Record Shop Expense"
        subtitle="Deduct expenditure from cash/bank accounts with GST input credit"
        maxWidth="md"
      >
        <form onSubmit={handleCreateExpense} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Expense Title / Description</label>
            <input
              type="text"
              required
              placeholder="e.g. Shop Electricity Bill - BSES"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Category</label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100"
              >
                <option value="">-- General Expense --</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Total Amount (₹)</label>
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
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Payment Mode</label>
              <select
                value={paymentMode}
                onChange={(e) => setPaymentMode(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-slate-900 dark:text-slate-100"
              >
                <option value="CASH">Cash in Hand</option>
                <option value="UPI">UPI</option>
                <option value="BANK">Bank Account</option>
                <option value="CARD">Card</option>
              </select>
            </div>
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">GST Tax Rate</label>
              <select
                value={gstRate}
                onChange={(e) => setGstRate(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-blue-600 dark:text-blue-400"
              >
                <option value="0">0% (Non-GST Expense)</option>
                <option value="5">5% GST</option>
                <option value="12">12% GST</option>
                <option value="18">18% GST</option>
                <option value="28">28% GST</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Vendor Name (Optional)</label>
              <input
                type="text"
                placeholder="e.g. BSES Yamuna Ltd"
                value={vendorName}
                onChange={(e) => setVendorName(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Vendor GSTIN (Optional)</label>
              <input
                type="text"
                placeholder="07AAACP9999P1Z1"
                value={vendorGstin}
                onChange={(e) => setVendorGstin(e.target.value.toUpperCase())}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono uppercase text-slate-900 dark:text-slate-100"
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
              className="flex items-center gap-2 px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-md shadow-rose-600/30 active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>{saving ? 'Recording...' : 'Record Expense'}</span>
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
