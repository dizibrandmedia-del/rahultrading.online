'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Search,
  Plus,
  Zap,
  Building2,
  Calendar,
  Crown,
  Menu
} from 'lucide-react';
import { CommandPalette } from './CommandPalette';
import { ThemeToggle } from '@/components/theme/ThemeToggle';

interface HeaderProps {
  onOpenMobileNav?: () => void;
}

export function Header({ onOpenMobileNav }: HeaderProps) {
  const [isCommandOpen, setIsCommandOpen] = useState(false);
  const [userName, setUserName] = useState('Rahul');
  const router = useRouter();

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

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsCommandOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <>
      <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-3 sm:px-6 flex items-center justify-between sticky top-0 z-20 shadow-xs transition-colors duration-150">
        {/* Left: Mobile Hamburger Trigger + Global Search */}
        <div className="flex items-center gap-2 sm:gap-4 flex-1 max-w-md">
          {onOpenMobileNav && (
            <button
              type="button"
              onClick={onOpenMobileNav}
              aria-label="Open Navigation Menu"
              className="lg:hidden p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <Menu className="w-5 h-5" />
            </button>
          )}

          <button
            onClick={() => setIsCommandOpen(true)}
            className="w-full flex items-center justify-between px-3 py-2 bg-slate-100/90 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-xs text-slate-500 dark:text-slate-400 border border-slate-200/80 dark:border-slate-700 transition-all group"
          >
            <div className="flex items-center gap-2">
              <Search className="w-4 h-4 text-slate-400 dark:text-slate-500 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors shrink-0" />
              <span className="truncate">Search invoices, items, actions...</span>
            </div>
            <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-mono font-semibold text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-900 rounded border border-slate-200 dark:border-slate-700 shadow-xs">
              <span>Ctrl</span>+<span>K</span>
            </kbd>
          </button>
        </div>

        {/* Right: Quick Actions, Theme Toggle, Business Info, User Profile */}
        <div className="flex items-center gap-1.5 sm:gap-3">
          {/* Quick POS Launch Button (Desktop & Tablet) */}
          <Link
            href="/app/pos"
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white rounded-xl text-xs font-bold shadow-sm shadow-amber-500/20 transition-all active:scale-95"
          >
            <Zap className="w-3.5 h-3.5 fill-current" />
            <span>POS Billing</span>
          </Link>

          {/* Quick New Sale Invoice Button */}
          <Link
            href="/app/sales/new"
            className="flex items-center gap-1.5 px-2.5 sm:px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-sm shadow-blue-600/30 transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">New Sale</span>
            <span className="sm:hidden">Sale</span>
          </Link>

          {/* Theme Toggle Button */}
          <ThemeToggle />

          <div className="h-6 w-px bg-slate-200 dark:bg-slate-800 mx-0.5 sm:mx-1 hidden md:block" />

          {/* Financial Year Badge */}
          <div className="hidden xl:flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 dark:bg-slate-800 rounded-lg text-[11px] font-medium text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <span>FY 2026-27</span>
          </div>

          {/* Business Pill */}
          <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
            <Building2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <div className="text-left">
              <p className="text-xs font-bold text-slate-800 dark:text-slate-200 leading-none">RAHUL JEE TRADING COMPANY</p>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 font-mono mt-0.5">09DMCPG4193P1ZG</p>
            </div>
          </div>

          {/* Admin Panel Quick Link */}
          <Link
            href="/admin"
            className="hidden sm:flex items-center gap-1 px-2.5 py-1.5 bg-purple-50 dark:bg-purple-950/40 hover:bg-purple-100 dark:hover:bg-purple-900/40 text-purple-700 dark:text-purple-300 rounded-xl text-xs font-bold border border-purple-200 dark:border-purple-800 transition-all"
            title="Open Super Admin Panel"
          >
            <Crown className="w-3.5 h-3.5" />
            <span>Admin</span>
          </Link>

          {/* User Profile */}
          <Link
            href="/login"
            className="flex items-center gap-2 p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors text-xs text-slate-700 dark:text-slate-300 font-semibold"
            title={`User Profile (${userName || 'Rahul'})`}
          >
            <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 font-bold flex items-center justify-center border border-blue-200 dark:border-blue-700 text-xs">
              {(userName || 'Rahul').charAt(0).toUpperCase()}
            </div>
          </Link>
        </div>
      </header>

      {/* Command Palette Modal */}
      <CommandPalette isOpen={isCommandOpen} onClose={() => setIsCommandOpen(false)} />
    </>
  );
}
