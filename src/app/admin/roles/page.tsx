'use client';

import React from 'react';
import Link from 'next/link';
import {
  Lock,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Crown,
  Users,
  ArrowRight
} from 'lucide-react';

const ROLES = [
  { id: 'SUPER_ADMIN', name: 'Super Admin', color: 'text-purple-400 bg-purple-500/10' },
  { id: 'ADMIN', name: 'Admin', color: 'text-blue-400 bg-blue-500/10' },
  { id: 'MANAGER', name: 'Manager', color: 'text-indigo-400 bg-indigo-500/10' },
  { id: 'ACCOUNTANT', name: 'Accountant', color: 'text-emerald-400 bg-emerald-500/10' },
  { id: 'SALESMAN', name: 'Salesman', color: 'text-amber-400 bg-amber-500/10' },
  { id: 'CASHIER', name: 'Cashier', color: 'text-teal-400 bg-teal-500/10' },
  { id: 'VIEWER', name: 'Viewer', color: 'text-slate-400 bg-slate-800' },
];

const CAPABILITIES = [
  {
    module: 'Sales & POS Billing',
    items: [
      { name: 'Create Express POS Bills', access: [true, true, true, false, true, true, false] },
      { name: 'Create A4 GST Tax Invoices', access: [true, true, true, false, true, false, false] },
      { name: 'Apply Custom Discounts on Billing', access: [true, true, true, false, true, false, false] },
      { name: 'Cancel / Delete Invoices', access: [true, true, false, false, false, false, false] },
    ],
  },
  {
    module: 'Purchases & Inventory',
    items: [
      { name: 'Create Vendor Purchase Inward', access: [true, true, true, false, false, false, false] },
      { name: 'Modify Product Stock & Rates', access: [true, true, true, false, false, false, false] },
      { name: 'View Stock Purchase Valuations', access: [true, true, true, true, false, false, true] },
    ],
  },
  {
    module: 'Accounting & GST Compliance',
    items: [
      { name: 'View Day Book & Ledgers', access: [true, true, true, true, false, false, true] },
      { name: 'View Profit & Loss / Balance Sheet', access: [true, true, false, true, false, false, false] },
      { name: 'Export GSTR-1, GSTR-3B for Filing', access: [true, true, false, true, false, false, false] },
    ],
  },
  {
    module: 'Security & Administration',
    items: [
      { name: 'Modify Business & Bank / UPI Settings', access: [true, true, false, false, false, false, false] },
      { name: 'Add / Delete Users and Switch Roles', access: [true, true, false, false, false, false, false] },
      { name: 'Platform-wide Multi-tenant Access', access: [true, false, false, false, false, false, false] },
    ],
  },
];

export default function AdminRolesMatrixPage() {
  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl transition-colors duration-150">
        <div>
          <h1 className="text-xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <Lock className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            <span>Role-Based Access Control (RBAC) Matrix</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Standard hierarchical permission definitions across all 7 platform roles
          </p>
        </div>
        <Link
          href="/admin/users"
          className="flex items-center gap-2 px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold shadow-lg shadow-purple-600/30 transition-all"
        >
          <Users className="w-4 h-4" />
          <span>Manage User Roles</span>
        </Link>
      </div>

      {/* Matrix Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xl transition-colors duration-150">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-950 text-[11px] font-bold text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                <th className="py-4 px-4 w-72">Operational Capabilities</th>
                {ROLES.map((r) => (
                  <th key={r.id} className="py-4 px-3 text-center">
                    <span className={`px-2 py-1 rounded-lg text-[10px] font-extrabold uppercase ${r.color}`}>
                      {r.name}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
              {CAPABILITIES.map((group, gIdx) => (
                <React.Fragment key={gIdx}>
                  <tr className="bg-purple-50/50 dark:bg-slate-950/70 border-b border-purple-100 dark:border-slate-800/80">
                    <td
                      colSpan={8}
                      className="py-2.5 px-4 font-black text-[11px] text-purple-700 dark:text-purple-300 uppercase tracking-wider"
                    >
                      {group.module}
                    </td>
                  </tr>
                  {group.items.map((item, iIdx) => (
                    <tr key={iIdx} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-4 text-xs font-medium text-slate-800 dark:text-slate-200">
                        {item.name}
                      </td>
                      {item.access.map((hasAccess, rIdx) => (
                        <td key={rIdx} className="py-3 px-3 text-center">
                          {hasAccess ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 mx-auto" />
                          ) : (
                            <XCircle className="w-4 h-4 text-slate-300 dark:text-slate-600 mx-auto" />
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
