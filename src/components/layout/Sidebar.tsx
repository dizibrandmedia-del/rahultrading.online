'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Receipt,
  ShoppingCart,
  Users,
  Package,
  ArrowDownLeft,
  ArrowUpRight,
  Calculator,
  FileSpreadsheet,
  Settings,
  Database,
  Store,
  CreditCard,
  Zap,
  HelpCircle,
  Crown,
  X,
  Building2,
  LogOut,
  FileText,
} from 'lucide-react';
import { clsx } from 'clsx';
import { ThemeToggle } from '@/components/theme/ThemeToggle';

const navSections = [
  {
    title: 'GENERAL',
    items: [
      { name: 'Dashboard', href: '/app', icon: LayoutDashboard },
      { name: 'Express POS', href: '/app/pos', icon: Zap, badge: 'Fast' },
      { name: 'Sales & Invoices', href: '/app/sales', icon: Receipt },
      { name: 'Non-GST Invoices', href: '/app/non-gst-sales', icon: FileText },
      { name: 'Purchases', href: '/app/purchases', icon: ShoppingCart },
    ],
  },
  {
    title: 'MANAGEMENT',
    items: [
      { name: 'Parties (Customers/Vendors)', href: '/app/parties', icon: Users },
      { name: 'Items & Inventory', href: '/app/items', icon: Package },
      { name: 'Payment In & Out', href: '/app/payments', icon: CreditCard },
      { name: 'Expenses', href: '/app/expenses', icon: ArrowUpRight },
    ],
  },
  {
    title: 'ACCOUNTING & GST',
    items: [
      { name: 'Double-Entry Accounting', href: '/app/accounting', icon: Calculator },
      { name: 'GST Filing Reports', href: '/app/gst', icon: FileSpreadsheet, badge: 'GSTR' },
    ],
  },
  {
    title: 'SYSTEM & ADMIN',
    items: [
      { name: 'Admin Panel & Roles', href: '/admin', icon: Crown, badge: 'SuperAdmin' },
      { name: 'Business Settings', href: '/app/settings', icon: Settings },
      { name: 'Backup & Data Export', href: '/app/backup', icon: Database },
    ],
  },
];

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export function Sidebar({ isOpen = false, onClose }: SidebarProps) {
  const pathname = usePathname();
  const [userName, setUserName] = useState('Rahul');

  useEffect(() => {
    fetch('/api/business')
      .then((r) => r.json())
      .then((res) => {
        if (res.success && res.business?.users?.[0]?.user?.name) {
          setUserName(res.business.users[0].user.name);
        }
      })
      .catch(() => {});
  }, []);

  const sidebarContent = (
    <div className="w-64 bg-slate-900 dark:bg-slate-950 text-slate-300 flex flex-col h-full border-r border-slate-800 select-none">
      {/* Brand Header */}
      <div className="p-4 flex items-center justify-between border-b border-slate-800/80 bg-slate-950/60">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white shadow-lg shadow-blue-500/30 font-black text-xl">
            R
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-white text-xs tracking-tight truncate max-w-[125px] block" title="RAHUL JEE TRADING COMPANY">
                RAHUL JEE TRADING
              </span>
              <span className="text-[9px] uppercase font-bold bg-blue-500/20 text-blue-400 px-1 py-0.5 rounded border border-blue-500/30 shrink-0">
                PRO
              </span>
            </div>
            <p className="text-[10px] text-slate-400 truncate max-w-[130px] font-medium font-mono">
              09DMCPG4193P1ZG
            </p>
          </div>
        </div>

        {/* Mobile Close Button */}
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Close Menu"
            className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Theme Toggle in Mobile Sidebar */}
      <div className="px-3 pt-3">
        <div className="p-2 bg-slate-800/40 rounded-xl border border-slate-800 flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-400">Theme</span>
          <ThemeToggle showLabel />
        </div>
      </div>

      {/* Navigation List */}
      <div className="flex-1 overflow-y-auto py-3 px-3 space-y-5">
        {navSections.map((section) => (
          <div key={section.title} className="space-y-1">
            <div className="px-3 text-[10px] font-bold tracking-wider text-slate-400 uppercase">
              {section.title}
            </div>
            {section.items.map((item) => {
              const Icon = item.icon;
              const isActive =
                item.href === '/app'
                  ? pathname === '/app'
                  : pathname.startsWith(item.href);

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={onClose}
                  className={clsx(
                    'flex items-center justify-between px-3 py-2 rounded-xl text-sm font-medium transition-all group active:scale-[0.98]',
                    isActive
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30 font-semibold'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                  )}
                >
                  <div className="flex items-center gap-3">
                    <Icon
                      className={clsx(
                        'w-4 h-4 shrink-0 transition-colors',
                        isActive ? 'text-white' : 'text-slate-400 group-hover:text-white'
                      )}
                    />
                    <span>{item.name}</span>
                  </div>
                  {item.badge && (
                    <span
                      className={clsx(
                        'text-[10px] font-bold px-1.5 py-0.5 rounded',
                        isActive
                          ? 'bg-white/20 text-white'
                          : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                      )}
                    >
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        ))}
      </div>

      {/* Footer User Info & Support */}
      <div className="p-3 border-t border-slate-800 bg-slate-950/60 space-y-2">
        <div className="bg-slate-800/50 rounded-xl p-2.5 border border-slate-700/50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-medium text-slate-300">GST Online Ready</span>
          </div>
          <span className="text-[10px] text-slate-400 font-mono bg-slate-900 px-2 py-0.5 rounded border border-slate-700">
            v1.0
          </span>
        </div>

        <Link
          href="/login"
          onClick={onClose}
          className="flex items-center justify-between p-2 rounded-xl text-xs font-medium text-slate-400 hover:text-rose-400 hover:bg-slate-800/60 transition-colors"
        >
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-[10px]">
              {(userName || 'Rahul').charAt(0).toUpperCase()}
            </div>
            <span className="truncate max-w-[125px] font-semibold text-slate-200">{userName || 'Rahul'}</span>
          </div>
          <LogOut className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar (Permanent) */}
      <aside className="hidden lg:flex shrink-0 min-h-screen z-30">
        {sidebarContent}
      </aside>

      {/* Mobile Slide-Over Drawer with Backdrop */}
      {isOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          {/* Backdrop Blur Overlay */}
          <div
            className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm transition-opacity animate-in fade-in"
            onClick={onClose}
            aria-hidden="true"
          />

          {/* Slide-in Drawer Container */}
          <div className="relative flex-1 flex max-w-xs w-full animate-in slide-in-from-left duration-200 shadow-2xl">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
}
