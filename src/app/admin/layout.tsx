'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Users,
  Lock,
  ArrowLeft,
  Crown,
  LayoutDashboard,
  Menu,
  X
} from 'lucide-react';
import { clsx } from 'clsx';
import { ThemeToggle } from '@/components/theme/ThemeToggle';

const adminNav = [
  { name: 'Admin Overview', href: '/admin', icon: LayoutDashboard },
  { name: 'Users & Roles Management', href: '/admin/users', icon: Users, badge: 'RBAC' },
  { name: 'Permissions Matrix', href: '/admin/roles', icon: Lock },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const sidebarContent = (
    <div className="w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col h-full shrink-0 z-30 transition-colors duration-150">
      {/* Brand Header */}
      <div className="p-4 flex items-center justify-between border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/60">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-purple-500/30 font-black text-xl">
            <Crown className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-slate-900 dark:text-white text-base tracking-tight">Super Admin</span>
            </div>
            <p className="text-[10px] text-purple-600 dark:text-purple-400 font-bold uppercase tracking-wider">
              Platform Control Panel
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsMobileOpen(false)}
          className="lg:hidden p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Navigation List */}
      <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
        <div className="px-3 text-[10px] font-bold tracking-wider text-slate-400 dark:text-slate-500 uppercase mb-2">
          ADMINISTRATION
        </div>
        {adminNav.map((item) => {
          const Icon = item.icon;
          const isActive =
            item.href === '/admin'
              ? pathname === '/admin'
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.name}
              href={item.href}
              onClick={() => setIsMobileOpen(false)}
              className={clsx(
                'flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all group',
                isActive
                  ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30 font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/80'
              )}
            >
              <div className="flex items-center gap-3">
                <Icon
                  className={clsx(
                    'w-4 h-4 shrink-0 transition-colors',
                    isActive ? 'text-white' : 'text-slate-500 dark:text-slate-400 group-hover:text-purple-600 dark:group-hover:text-purple-400'
                  )}
                />
                <span>{item.name}</span>
              </div>
              {item.badge && (
                <span
                  className={clsx(
                    'text-[9px] font-bold px-1.5 py-0.5 rounded',
                    isActive
                      ? 'bg-white/20 text-white'
                      : 'bg-purple-500/10 dark:bg-purple-500/20 text-purple-600 dark:text-purple-300 border border-purple-500/20 dark:border-purple-500/30'
                  )}
                >
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </div>

      {/* Back to SaaS Workspace button */}
      <div className="p-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/60 space-y-2">
        <Link
          href="/app"
          className="w-full flex items-center justify-center gap-2 py-2.5 bg-blue-50 dark:bg-blue-600/20 hover:bg-blue-100 dark:hover:bg-blue-600/30 text-blue-700 dark:text-blue-300 rounded-xl text-xs font-bold border border-blue-200 dark:border-blue-500/30 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return to SaaS App</span>
        </Link>
        <div className="flex items-center justify-between px-2 text-[10px] text-slate-500 dark:text-slate-400">
          <span>Security: <strong className="text-emerald-600 dark:text-emerald-400">Strict RBAC</strong></span>
          <span>Auth: <strong className="text-slate-700 dark:text-slate-300">SuperAdmin</strong></span>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen overflow-hidden bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100 selection:bg-purple-600 selection:text-white transition-colors duration-150">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex shrink-0 min-h-screen z-30">
        {sidebarContent}
      </aside>

      {/* Mobile Slide-Over Drawer */}
      {isMobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm"
            onClick={() => setIsMobileOpen(false)}
          />
          <div className="relative flex-1 flex max-w-xs w-full">
            {sidebarContent}
          </div>
        </div>
      )}

      {/* Main Content Workspace */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-slate-100 dark:bg-slate-950 transition-colors duration-150">
        {/* Top bar */}
        <header className="h-16 bg-white/90 dark:bg-slate-900/90 border-b border-slate-200 dark:border-slate-800 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-20 backdrop-blur-md transition-colors duration-150">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsMobileOpen(true)}
              className="lg:hidden p-2 rounded-xl text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-1.5 sm:gap-2">
              <span className="hidden sm:inline text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Control Panel &bull;
              </span>
              <span className="text-xs font-bold text-purple-600 dark:text-purple-400 truncate">
                Role-Based Access Control (RBAC)
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <ThemeToggle />

            <Link
              href="/app"
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-700 transition-all"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Back to Billing</span>
            </Link>

            <div className="w-8 h-8 rounded-full bg-purple-600 text-white font-bold flex items-center justify-center text-xs shadow-md shadow-purple-500/30">
              SA
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-3 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
