'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Search,
  Receipt,
  ShoppingCart,
  Zap,
  Users,
  Package,
  CreditCard,
  FileSpreadsheet,
  Calculator,
  Settings
} from 'lucide-react';

interface CommandItem {
  id: string;
  name: string;
  category: string;
  icon: React.ComponentType<{ className?: string }>;
  href: string;
  shortcut?: string;
}

const commands: CommandItem[] = [
  { id: '1', name: 'Create GST Sales Invoice', category: 'Sales', icon: Receipt, href: '/app/sales/new', shortcut: 'F1' },
  { id: '2', name: 'Open Express POS Billing', category: 'POS', icon: Zap, href: '/app/pos', shortcut: 'Alt+P' },
  { id: '3', name: 'Record Purchase Bill', category: 'Purchases', icon: ShoppingCart, href: '/app/purchases', shortcut: 'F2' },
  { id: '4', name: 'Record Payment In (Customer)', category: 'Payments', icon: CreditCard, href: '/app/payments', shortcut: 'F6' },
  { id: '5', name: 'Add New Customer / Supplier', category: 'Parties', icon: Users, href: '/app/parties', shortcut: 'F4' },
  { id: '6', name: 'Add New Product / Item', category: 'Inventory', icon: Package, href: '/app/items', shortcut: 'F5' },
  { id: '7', name: 'Double-Entry Accounting & Ledgers', category: 'Accounting', icon: Calculator, href: '/app/accounting' },
  { id: '8', name: 'GSTR-1 & GSTR-3B Tax Filing Reports', category: 'GST', icon: FileSpreadsheet, href: '/app/gst' },
  { id: '9', name: 'Business & Invoice Settings', category: 'Settings', icon: Settings, href: '/app/settings' },
];

export function CommandPalette({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const router = useRouter();

  const filtered = commands.filter(
    (c) =>
      c.name.toLowerCase().includes(query.toLowerCase()) ||
      c.category.toLowerCase().includes(query.toLowerCase())
  );

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev < filtered.length - 1 ? prev + 1 : 0));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : filtered.length - 1));
      } else if (e.key === 'Enter' && filtered[selectedIndex]) {
        e.preventDefault();
        router.push(filtered[selectedIndex].href);
        onClose();
      } else if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, filtered, selectedIndex, router, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 p-3 sm:p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden transition-colors duration-150">
        {/* Search Bar */}
        <div className="flex items-center px-4 py-3.5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/50">
          <Search className="w-5 h-5 text-slate-400 mr-3 shrink-0" />
          <input
            type="text"
            placeholder="Type a command or search (e.g. 'New Sale', 'POS', 'GST')..."
            className="w-full bg-transparent text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
          />
          <kbd className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-mono text-slate-400 bg-slate-100 dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700">
            ESC
          </kbd>
        </div>

        {/* Results List */}
        <div className="max-h-80 overflow-y-auto p-2">
          {filtered.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-500 dark:text-slate-400">
              No matching actions found for &quot;{query}&quot;
            </div>
          ) : (
            <div className="space-y-1">
              {filtered.map((item, index) => {
                const Icon = item.icon;
                const isSelected = index === selectedIndex;
                return (
                  <div
                    key={item.id}
                    onClick={() => {
                      router.push(item.href);
                      onClose();
                    }}
                    onMouseEnter={() => setSelectedIndex(index)}
                    className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-blue-600 text-white'
                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`p-1.5 rounded-lg ${
                          isSelected
                            ? 'bg-blue-500 text-white'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="font-semibold">{item.name}</p>
                        <p
                          className={`text-[10px] ${
                            isSelected ? 'text-blue-100' : 'text-slate-400 dark:text-slate-500'
                          }`}
                        >
                          {item.category}
                        </p>
                      </div>
                    </div>
                    {item.shortcut && (
                      <kbd
                        className={`text-[10px] font-mono px-2 py-0.5 rounded ${
                          isSelected
                            ? 'bg-blue-700 text-white'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        {item.shortcut}
                      </kbd>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
