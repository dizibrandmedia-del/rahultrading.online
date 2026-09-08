'use client';

import React, { useEffect, useState } from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from './ThemeProvider';
import { clsx } from 'clsx';

interface ThemeToggleProps {
  className?: string;
  showLabel?: boolean;
}

export function ThemeToggle({ className, showLabel = false }: ThemeToggleProps) {
  const { theme, toggleTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div
        className={clsx(
          'w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 animate-pulse',
          className
        )}
      />
    );
  }

  const isDark = theme === 'dark';

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
      title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
      className={clsx(
        'relative inline-flex items-center justify-center p-2 rounded-xl transition-all duration-200 select-none active:scale-95',
        isDark
          ? 'bg-slate-800 hover:bg-slate-700 text-amber-400 border border-slate-700 shadow-sm shadow-amber-500/10'
          : 'bg-slate-100 hover:bg-slate-200/80 text-slate-700 border border-slate-200/90 shadow-sm',
        showLabel && 'px-3 py-2 gap-2 text-xs font-semibold',
        className
      )}
    >
      {isDark ? (
        <Sun className="w-4 h-4 text-amber-400 transition-transform duration-300 rotate-0 hover:rotate-45" />
      ) : (
        <Moon className="w-4 h-4 text-indigo-600 transition-transform duration-300 -rotate-12 hover:rotate-0" />
      )}
      {showLabel && (
        <span className="text-xs font-semibold">{isDark ? 'Light Mode' : 'Dark Mode'}</span>
      )}
    </button>
  );
}
