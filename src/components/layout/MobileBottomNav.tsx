'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Zap, PlusCircle, Users, Menu } from 'lucide-react';
import { clsx } from 'clsx';

interface MobileBottomNavProps {
  onOpenMenu: () => void;
}

export function MobileBottomNav({ onOpenMenu }: MobileBottomNavProps) {
  const pathname = usePathname();

  const navItems = [
    { name: 'Dashboard', href: '/app', icon: LayoutDashboard },
    { name: 'POS', href: '/app/pos', icon: Zap, highlight: true },
    { name: 'New Sale', href: '/app/sales/new', icon: PlusCircle, primary: true },
    { name: 'Parties', href: '/app/parties', icon: Users },
  ];

  return (
    <nav
      aria-label="Mobile Bottom Navigation"
      className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 px-2 py-1.5 shadow-lg pb-safe"
    >
      <div className="flex items-center justify-around max-w-md mx-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          if (item.primary) {
            return (
              <Link
                key={item.name}
                href={item.href}
                className="flex flex-col items-center justify-center -mt-5 group"
              >
                <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-lg shadow-blue-500/40 active:scale-95 transition-transform">
                  <Icon className="w-6 h-6" />
                </div>
                <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 mt-1">
                  {item.name}
                </span>
              </Link>
            );
          }

          return (
            <Link
              key={item.name}
              href={item.href}
              className={clsx(
                'flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-colors active:scale-95',
                isActive
                  ? 'text-blue-600 dark:text-blue-400 font-bold'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
              )}
            >
              <Icon
                className={clsx(
                  'w-5 h-5 transition-transform',
                  isActive && 'scale-110',
                  item.highlight && !isActive && 'text-amber-500'
                )}
              />
              <span className="text-[10px] font-medium mt-0.5">{item.name}</span>
            </Link>
          );
        })}

        {/* More / Menu Drawer Toggle */}
        <button
          type="button"
          onClick={onOpenMenu}
          aria-label="Open Full Menu"
          className="flex flex-col items-center justify-center py-1 px-3 rounded-xl text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 active:scale-95 transition-colors"
        >
          <Menu className="w-5 h-5" />
          <span className="text-[10px] font-medium mt-0.5">Menu</span>
        </button>
      </div>
    </nav>
  );
}
