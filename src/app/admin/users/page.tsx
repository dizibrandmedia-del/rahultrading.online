'use client';

import React, { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import {
  Users,
  UserPlus,
  Search,
  ShieldCheck,
  Crown,
  Edit,
  Trash2,
  Lock,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

const AVAILABLE_ROLES = [
  { id: 'SUPER_ADMIN', name: 'Super Admin', desc: 'Full platform & multi-business control', color: 'bg-purple-500/20 text-purple-300 border-purple-500/30' },
  { id: 'ADMIN', name: 'Admin', desc: 'Full business management & settings', color: 'bg-blue-500/20 text-blue-300 border-blue-500/30' },
  { id: 'MANAGER', name: 'Manager', desc: 'Sales, purchases, inventory & approvals', color: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30' },
  { id: 'ACCOUNTANT', name: 'Accountant', desc: 'Ledgers, Day Book, GST & Financial reports', color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' },
  { id: 'SALESMAN', name: 'Salesman', desc: 'POS billing, sales invoicing & customer collections', color: 'bg-amber-500/20 text-amber-300 border-amber-500/30' },
  { id: 'CASHIER', name: 'Cashier', desc: 'Express POS & payment receipts', color: 'bg-teal-500/20 text-teal-300 border-teal-500/30' },
  { id: 'VIEWER', name: 'Viewer', desc: 'Read-only access to dashboard and reports', color: 'bg-slate-700 text-slate-300 border-slate-600' },
];

const MODULE_PERMISSIONS = [
  { id: 'pos_billing', label: 'Express POS Billing' },
  { id: 'sales_invoices', label: 'Sales & Tax Invoices' },
  { id: 'purchase_bills', label: 'Purchase Inward Bills' },
  { id: 'inventory_adjust', label: 'Inventory & Stock Adjustments' },
  { id: 'accounting_reports', label: 'Accounting (Daybook, P&L, Balance Sheet)' },
  { id: 'gst_filing', label: 'GST Reports & Return Exports' },
  { id: 'settings_config', label: 'Business & Bank Settings' },
  { id: 'user_management', label: 'Manage Users & Permissions' },
];

export default function AdminUsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');

  // Add User Modal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addName, setAddName] = useState('');
  const [addPhone, setAddPhone] = useState('');
  const [addEmail, setAddEmail] = useState('');
  const [addRole, setAddRole] = useState('SALESMAN');
  const [addPermissions, setAddPermissions] = useState<string[]>(['pos_billing', 'sales_invoices']);
  const [savingAdd, setSavingAdd] = useState(false);

  // Edit Role Modal
  const [editingUser, setEditingUser] = useState<any>(null);
  const [editRole, setEditRole] = useState('');
  const [editPermissions, setEditPermissions] = useState<string[]>([]);
  const [savingEdit, setSavingEdit] = useState(false);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/users');
      const data = await res.json();
      if (data.success) {
        setUsers(data.users);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSavingAdd(true);
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: addName,
          phone: addPhone,
          email: addEmail,
          role: addRole,
          permissions: addPermissions,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setIsAddModalOpen(false);
        setAddName('');
        setAddPhone('');
        setAddEmail('');
        fetchUsers();
      } else {
        alert('Failed: ' + data.error);
      }
    } catch (err: any) {
      alert('Error: ' + err.message);
    } finally {
      setSavingAdd(false);
    }
  };

  const handleOpenEditRole = (user: any) => {
    setEditingUser(user);
    setEditRole(user.role);
    setEditPermissions(user.permissions || []);
  };

  const handleSaveRole = async () => {
    if (!editingUser) return;
    try {
      setSavingEdit(true);
      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: editingUser.id,
          businessId: editingUser.businessId,
          role: editRole,
          permissions: editPermissions,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setEditingUser(null);
        fetchUsers();
      } else {
        alert('Failed to update role: ' + data.error);
      }
    } catch (err: any) {
      alert('Error: ' + err.message);
    } finally {
      setSavingEdit(false);
    }
  };

  const handleDeleteUser = async (userId: string, name: string) => {
    if (!confirm(`Are you sure you want to remove user "${name}" from the system?`)) return;
    try {
      const res = await fetch(`/api/admin/users?userId=${userId}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        fetchUsers();
      } else {
        alert('Failed: ' + data.error);
      }
    } catch (err: any) {
      alert('Error: ' + err.message);
    }
  };

  const togglePermission = (permId: string, isAdd: boolean) => {
    if (isAdd) {
      setAddPermissions((prev) =>
        prev.includes(permId) ? prev.filter((p) => p !== permId) : [...prev, permId]
      );
    } else {
      setEditPermissions((prev) =>
        prev.includes(permId) ? prev.filter((p) => p !== permId) : [...prev, permId]
      );
    }
  };

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.phone.includes(search) ||
      (u.email && u.email.toLowerCase().includes(search.toLowerCase()));
    const matchesRole = roleFilter === 'ALL' || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl transition-colors duration-150">
        <div>
          <h1 className="text-xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <Users className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            <span>User & Employee Role Management</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Assign Super Admin, Admin, Accountant, Manager, and Salesman roles with granular permission matrices
          </p>
        </div>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center gap-2 px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold shadow-lg shadow-purple-600/30 transition-all"
        >
          <UserPlus className="w-4 h-4" />
          <span>Add New User</span>
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4 shadow-md transition-colors duration-150">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by name, phone or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>

        {/* Role Filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto">
          {['ALL', 'SUPER_ADMIN', 'ADMIN', 'MANAGER', 'ACCOUNTANT', 'SALESMAN', 'CASHIER'].map((r) => (
            <button
              key={r}
              onClick={() => setRoleFilter(r)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-all ${
                roleFilter === r
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {r.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Users Data Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xl transition-colors duration-150">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-950 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase border-b border-slate-200 dark:border-slate-800">
                <th className="py-3.5 px-4">User Name</th>
                <th className="py-3.5 px-4">Contact (Phone/Email)</th>
                <th className="py-3.5 px-4">Business Assignment</th>
                <th className="py-3.5 px-4 text-center">Assigned Role</th>
                <th className="py-3.5 px-4 text-center">Permissions</th>
                <th className="py-3.5 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400 dark:text-slate-500">
                    Loading users directory...
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400 dark:text-slate-500">
                    No users found matching your filters.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => {
                  const roleObj = AVAILABLE_ROLES.find((r) => r.id === u.role) || AVAILABLE_ROLES[6];

                  return (
                    <tr key={u.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-purple-50 dark:bg-slate-800 text-purple-600 dark:text-purple-400 font-bold flex items-center justify-center border border-purple-100 dark:border-slate-700 text-xs">
                            {u.name.substring(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 dark:text-white">{u.name}</p>
                            <p className="text-[10px] text-slate-400 dark:text-slate-500">ID: {u.id.substring(0, 8)}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <p className="font-mono text-slate-800 dark:text-slate-300 font-semibold">{u.phone}</p>
                        {u.email && <p className="text-[10px] text-slate-400 dark:text-slate-500">{u.email}</p>}
                      </td>
                      <td className="py-3.5 px-4 text-slate-700 dark:text-slate-300">
                        <span className="bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-lg text-[11px] border border-slate-200 dark:border-slate-700">
                          {u.businessName}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-extrabold border ${roleObj.color}`}
                        >
                          {u.role === 'SUPER_ADMIN' && <Crown className="w-3 h-3 text-purple-500 dark:text-purple-300" />}
                          {u.role === 'ADMIN' && <ShieldCheck className="w-3 h-3 text-blue-500 dark:text-blue-300" />}
                          <span>{roleObj.name}</span>
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className="text-[11px] font-mono font-bold text-slate-500 dark:text-slate-400">
                          {u.permissions?.length || 0} Modules
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleOpenEditRole(u)}
                            className="flex items-center gap-1 px-3 py-1 bg-purple-50 dark:bg-purple-600/20 hover:bg-purple-100 dark:hover:bg-purple-600/30 text-purple-700 dark:text-purple-300 rounded-lg text-xs font-bold border border-purple-200 dark:border-purple-500/30 transition-colors"
                            title="Change User Role & Permissions"
                          >
                            <Edit className="w-3.5 h-3.5" />
                            <span>Change Role</span>
                          </button>

                          <button
                            onClick={() => handleDeleteUser(u.id, u.name)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                            title="Delete User"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
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

      {/* Add User Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add New Business User"
        subtitle="Assign role, login credentials, and module permissions"
        maxWidth="lg"
      >
        <form onSubmit={handleAddUser} className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Full Name</label>
              <input
                type="text"
                required
                placeholder="e.g. Amit Kumar"
                value={addName}
                onChange={(e) => setAddName(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Mobile Phone (Login ID)</label>
              <input
                type="tel"
                required
                placeholder="e.g. 9811223344"
                value={addPhone}
                onChange={(e) => setAddPhone(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Email Address (Optional)</label>
            <input
              type="email"
              placeholder="e.g. amit@shreeganesh.com"
              value={addEmail}
              onChange={(e) => setAddEmail(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
            />
          </div>

          {/* Role selection */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1.5">Designated Role</label>
            <div className="grid grid-cols-2 gap-2">
              {AVAILABLE_ROLES.map((r) => (
                <div
                  key={r.id}
                  onClick={() => setAddRole(r.id)}
                  className={`p-2.5 rounded-xl border cursor-pointer transition-all ${
                    addRole === r.id
                      ? 'bg-purple-50 border-purple-600 text-purple-900 ring-2 ring-purple-500/20 font-bold'
                      : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <p className="font-bold text-xs">{r.name}</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">{r.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Module permissions */}
          <div className="pt-2 border-t border-slate-100">
            <label className="block font-semibold text-slate-700 mb-1.5">Granular Module Permissions</label>
            <div className="grid grid-cols-2 gap-2">
              {MODULE_PERMISSIONS.map((perm) => {
                const isChecked = addPermissions.includes(perm.id);
                return (
                  <label
                    key={perm.id}
                    className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 border border-slate-200 cursor-pointer text-slate-700 hover:bg-slate-100"
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => togglePermission(perm.id, true)}
                      className="rounded text-purple-600 focus:ring-purple-500"
                    />
                    <span className="text-[11px] font-medium">{perm.label}</span>
                  </label>
                );
              })}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-3">
            <button
              type="button"
              onClick={() => setIsAddModalOpen(false)}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={savingAdd}
              className="flex items-center gap-2 px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold shadow-md shadow-purple-600/30"
            >
              <UserPlus className="w-4 h-4" />
              <span>{savingAdd ? 'Adding...' : 'Create User'}</span>
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Role Modal */}
      <Modal
        isOpen={!!editingUser}
        onClose={() => setEditingUser(null)}
        title={`Change Role: ${editingUser?.name}`}
        subtitle={`Switch role hierarchy and module permissions for ${editingUser?.phone}`}
        maxWidth="lg"
      >
        <div className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-slate-700 mb-2">Select New Role for {editingUser?.name}:</label>
            <div className="grid grid-cols-2 gap-2">
              {AVAILABLE_ROLES.map((r) => (
                <div
                  key={r.id}
                  onClick={() => setEditRole(r.id)}
                  className={`p-3 rounded-xl border cursor-pointer transition-all ${
                    editRole === r.id
                      ? 'bg-purple-50 border-purple-600 text-purple-900 ring-2 ring-purple-500/20 font-bold'
                      : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <p className="font-bold text-xs">{r.name}</p>
                    {editRole === r.id && <CheckCircle2 className="w-4 h-4 text-purple-600" />}
                  </div>
                  <p className="text-[10px] text-slate-500 mt-0.5">{r.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Permissions checkboxes */}
          <div className="pt-2 border-t border-slate-100">
            <label className="block font-semibold text-slate-700 mb-1.5">Custom Module Permissions:</label>
            <div className="grid grid-cols-2 gap-2">
              {MODULE_PERMISSIONS.map((perm) => {
                const isChecked = editPermissions.includes(perm.id);
                return (
                  <label
                    key={perm.id}
                    className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 border border-slate-200 cursor-pointer text-slate-700 hover:bg-slate-100"
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => togglePermission(perm.id, false)}
                      className="rounded text-purple-600 focus:ring-purple-500"
                    />
                    <span className="text-[11px] font-medium">{perm.label}</span>
                  </label>
                );
              })}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-3">
            <button
              type="button"
              onClick={() => setEditingUser(null)}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSaveRole}
              disabled={savingEdit}
              className="flex items-center gap-2 px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold shadow-md shadow-purple-600/30"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{savingEdit ? 'Updating...' : 'Save Role Change'}</span>
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
