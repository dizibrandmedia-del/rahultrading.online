'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { formatINR } from '@/lib/currency';
import { Badge } from '@/components/ui/Badge';
import { INDIAN_STATES } from '@/types';
import {
  Users,
  Building2,
  Receipt,
  TrendingUp,
  ShieldCheck,
  Crown,
  Activity,
  ArrowRight,
  UserPlus,
  Edit2,
  Trash2,
  X,
  Save,
  CheckCircle2,
  ExternalLink,
  Settings
} from 'lucide-react';

export default function AdminDashboardPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Edit Modal State
  const [editingBusiness, setEditingBusiness] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const fetchStats = () => {
    fetch('/api/admin/stats')
      .then((r) => r.json())
      .then((res) => {
        if (res.success) setData(res);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const handleEditClick = (b: any) => {
    setEditingBusiness({
      id: b.id,
      name: b.name || '',
      legalName: b.legalName || '',
      type: b.type || 'Retail',
      gstin: b.gstin || '',
      pan: b.pan || '',
      state: b.state || 'Delhi',
      stateCode: b.stateCode || '07',
      address: b.address || '',
      phone: b.phone || '',
      email: b.email || '',
    });
    setSaveSuccess(false);
  };

  const handleSaveBusiness = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBusiness) return;

    try {
      setSaving(true);
      const res = await fetch(`/api/admin/businesses/${editingBusiness.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingBusiness),
      });

      const result = await res.json();
      if (result.success) {
        setSaveSuccess(true);
        fetchStats();
        setTimeout(() => {
          setEditingBusiness(null);
          setSaveSuccess(false);
        }, 800);
      } else {
        alert('Failed to update business: ' + result.error);
      }
    } catch (err: any) {
      alert('Error updating business: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteBusiness = async (businessId: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/businesses/${businessId}`, {
        method: 'DELETE',
      });
      const result = await res.json();
      if (result.success) {
        alert(`Business "${name}" removed successfully.`);
        fetchStats();
      } else {
        alert('Failed to delete business: ' + result.error);
      }
    } catch (err: any) {
      alert('Error deleting business: ' + err.message);
    }
  };

  if (loading || !data) {
    return (
      <div className="py-20 text-center text-xs text-slate-400">
        <Activity className="w-8 h-8 mx-auto animate-pulse text-purple-500 mb-2" />
        Loading Super Admin platform metrics...
      </div>
    );
  }

  const { stats, businesses = [], recentAuditLogs = [] } = data;

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl relative overflow-hidden transition-colors duration-150">
        <div className="space-y-1 relative z-10">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 bg-purple-500/10 dark:bg-purple-500/20 border border-purple-500/20 dark:border-purple-500/30 text-purple-600 dark:text-purple-300 text-[10px] font-extrabold uppercase rounded-full">
              Super Admin Control Plane
            </span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            System & User Management Portal
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Manage multi-tenant enterprises, staff permissions, and role-based access control across India
          </p>
        </div>

        <div className="flex items-center gap-3 relative z-10">
          <Link
            href="/app/settings"
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-700 transition-all"
          >
            <Settings className="w-4 h-4 text-slate-500 dark:text-slate-400" />
            <span>App Business Settings</span>
          </Link>
          <Link
            href="/admin/users"
            className="flex items-center gap-2 px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold shadow-lg shadow-purple-600/30 transition-all"
          >
            <UserPlus className="w-4 h-4" />
            <span>Manage Users & Roles</span>
          </Link>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-1 transition-colors duration-150">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Total Users</span>
            <Users className="w-4 h-4 text-purple-600 dark:text-purple-400" />
          </div>
          <h3 className="text-2xl font-black text-slate-900 dark:text-white font-mono mt-2">{stats.totalUsers}</h3>
          <p className="text-[11px] text-purple-600 dark:text-purple-400">Across all business workspaces</p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-1 transition-colors duration-150">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Active Businesses</span>
            <Building2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          </div>
          <h3 className="text-2xl font-black text-slate-900 dark:text-white font-mono mt-2">{stats.totalBusinesses}</h3>
          <p className="text-[11px] text-blue-600 dark:text-blue-400">Retail, Wholesale & Multi-store</p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-1 transition-colors duration-150">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Invoices Created</span>
            <Receipt className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <h3 className="text-2xl font-black text-slate-900 dark:text-white font-mono mt-2">{stats.totalInvoices}</h3>
          <p className="text-[11px] text-emerald-600 dark:text-emerald-400">GST Sales & Purchase Bills</p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-1 transition-colors duration-150">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">System Billing Volume</span>
            <TrendingUp className="w-4 h-4 text-amber-600 dark:text-amber-400" />
          </div>
          <h3 className="text-2xl font-black text-slate-900 dark:text-white font-mono mt-2">{formatINR(stats.totalBillingVolume)}</h3>
          <p className="text-[11px] text-amber-600 dark:text-amber-400">Total transaction value processed</p>
        </div>
      </div>

      {/* Businesses Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xl transition-colors duration-150">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-slate-300">
              Registered Businesses Directory
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              Click &quot;Edit&quot; on any business below to change name, category, GSTIN, phone, or address
            </p>
          </div>
          <span className="text-xs font-mono text-purple-600 dark:text-purple-400 font-bold">{businesses.length} Tenants</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-950 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase border-b border-slate-200 dark:border-slate-800">
                <th className="py-3 px-4">Business Name</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">GSTIN & State</th>
                <th className="py-3 px-4 text-center">Users</th>
                <th className="py-3 px-4 text-center">Invoices</th>
                <th className="py-3 px-4 text-center">Products</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
              {businesses.map((b: any) => (
                <tr key={b.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                  <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white">
                    <div>{b.name}</div>
                    {b.phone && <div className="text-[10px] text-slate-500 dark:text-slate-400 font-normal">Ph: {b.phone}</div>}
                  </td>
                  <td className="py-3.5 px-4 text-slate-600 dark:text-slate-400">{b.type}</td>
                  <td className="py-3.5 px-4 font-mono text-slate-700 dark:text-slate-300">
                    {b.gstin || 'Unregistered'} ({b.state})
                  </td>
                  <td className="py-3.5 px-4 text-center font-mono font-bold text-purple-600 dark:text-purple-400">
                    {b.users?.length || 1}
                  </td>
                  <td className="py-3.5 px-4 text-center font-mono font-semibold text-slate-800 dark:text-slate-200">
                    {b._count?.sales || 0}
                  </td>
                  <td className="py-3.5 px-4 text-center font-mono font-semibold text-slate-800 dark:text-slate-200">
                    {b._count?.products || 0}
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20 dark:border-emerald-500/30">
                      ACTIVE
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleEditClick(b)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-purple-50 dark:bg-purple-600/20 hover:bg-purple-100 dark:hover:bg-purple-600/40 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-500/30 rounded-lg text-xs font-semibold transition-colors"
                        title="Edit Business Details"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                        <span>Edit</span>
                      </button>
                      {(b._count?.sales === 0 && businesses.length > 1) && (
                        <button
                          onClick={() => handleDeleteBusiness(b.id, b.name)}
                          className="inline-flex items-center p-1.5 bg-rose-500/10 hover:bg-rose-500/25 text-rose-600 dark:text-rose-400 border border-rose-500/20 rounded-lg text-xs transition-colors"
                          title="Delete Unused Business"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Security Audit Feed */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xl transition-colors duration-150">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-slate-300 flex items-center gap-2">
            <Activity className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            <span>Platform Security & Role Audit Trail</span>
          </h3>
        </div>

        <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-60 overflow-y-auto">
          {recentAuditLogs.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-500">
              No recent audit events logged.
            </div>
          ) : (
            recentAuditLogs.map((log: any) => (
              <div key={log.id} className="p-3.5 hover:bg-slate-50 dark:hover:bg-slate-800/40 flex items-center justify-between text-xs transition-colors">
                <div className="flex items-center gap-3">
                  <span className="font-mono font-bold text-[11px] bg-purple-500/10 dark:bg-purple-500/20 text-purple-700 dark:text-purple-300 px-2 py-0.5 rounded border border-purple-500/20 dark:border-purple-500/30">
                    {log.action}
                  </span>
                  <span className="text-slate-600 dark:text-slate-300">
                    Target: <strong className="text-slate-900 dark:text-white">{log.entityType}</strong>
                  </span>
                </div>
                <span className="text-slate-500 text-[10px] font-mono">
                  {new Date(log.createdAt).toLocaleString('en-IN', {
                    dateStyle: 'medium',
                    timeStyle: 'short',
                  })}
                </span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Edit Business Modal */}
      {editingBusiness && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden transition-colors duration-150">
            {/* Header */}
            <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-950">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-purple-500/10 dark:bg-purple-600/20 text-purple-600 dark:text-purple-400 border border-purple-500/20 dark:border-purple-500/30">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">Edit Business Details</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Update organization profile in directory</p>
                </div>
              </div>
              <button
                onClick={() => setEditingBusiness(null)}
                className="p-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSaveBusiness} className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Business Display Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={editingBusiness.name}
                    onChange={(e) =>
                      setEditingBusiness({ ...editingBusiness, name: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-bold focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="e.g. RAHUL JEE TRADING COMPANY"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Business Category / Type
                  </label>
                  <select
                    value={editingBusiness.type}
                    onChange={(e) =>
                      setEditingBusiness({ ...editingBusiness, type: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="Retail">Retail</option>
                    <option value="Wholesale">Wholesale</option>
                    <option value="Retail & Wholesale">Retail & Wholesale</option>
                    <option value="Distributor">Distributor</option>
                    <option value="Manufacturing">Manufacturing</option>
                    <option value="Pharmacy">Pharmacy</option>
                    <option value="Services">Services</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">GSTIN Number</label>
                  <input
                    type="text"
                    value={editingBusiness.gstin}
                    onChange={(e) =>
                      setEditingBusiness({ ...editingBusiness, gstin: e.target.value.toUpperCase() })
                    }
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-mono uppercase focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="e.g. 07AAAAA0000A1Z5"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">State</label>
                  <select
                    value={editingBusiness.state}
                    onChange={(e) => {
                      const sel = INDIAN_STATES.find((s) => s.name === e.target.value);
                      setEditingBusiness({
                        ...editingBusiness,
                        state: e.target.value,
                        stateCode: sel ? sel.code : '07',
                      });
                    }}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    {INDIAN_STATES.map((s) => (
                      <option key={s.code} value={s.name}>
                        {s.code} - {s.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Contact Phone</label>
                  <input
                    type="text"
                    value={editingBusiness.phone}
                    onChange={(e) =>
                      setEditingBusiness({ ...editingBusiness, phone: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="e.g. 8887754821"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Business Address / Location
                  </label>
                  <textarea
                    rows={2}
                    value={editingBusiness.address}
                    onChange={(e) =>
                      setEditingBusiness({ ...editingBusiness, address: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="e.g. Shop No. 42, Commercial Complex, Delhi"
                  />
                </div>
              </div>

              {saveSuccess && (
                <div className="p-3 bg-emerald-500/10 dark:bg-emerald-500/20 border border-emerald-500/20 dark:border-emerald-500/30 rounded-xl text-emerald-700 dark:text-emerald-300 flex items-center gap-2 font-bold text-xs">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Business updated successfully!</span>
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingBusiness(null)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center gap-2 px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl shadow-lg shadow-purple-600/30 transition-all disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  <span>{saving ? 'Saving...' : 'Save Changes'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

