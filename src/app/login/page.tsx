'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Zap,
  ArrowRight,
  Sparkles
} from 'lucide-react';
import { ThemeToggle } from '@/components/theme/ThemeToggle';

export default function LoginPage() {
  const router = useRouter();
  const [phone, setPhone] = useState('8887754821');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);

  const handleDemoLogin = () => {
    router.push('/app');
  };

  const handlePhoneSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpSent) {
      setOtpSent(true);
    } else {
      router.push('/app');
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 flex flex-col justify-center py-10 px-4 sm:px-6 lg:px-8 relative overflow-hidden transition-colors duration-150">
      {/* Top right Theme Toggle */}
      <div className="absolute top-4 right-4 z-20">
        <ThemeToggle showLabel />
      </div>

      {/* Background glow effects */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-blue-600/10 dark:bg-blue-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-80 h-80 bg-indigo-600/10 dark:bg-indigo-600/15 rounded-full blur-3xl pointer-events-none" />

      {/* Brand Header */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center relative z-10">
        <Link href="/app" className="inline-flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white font-black text-2xl shadow-xl shadow-blue-500/30">
            R
          </div>
          <span className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">RAHUL JEE TRADING COMPANY</span>
        </Link>
        <h2 className="mt-4 text-xl font-extrabold text-slate-900 dark:text-white">
          Sign In to Your Business Workspace
        </h2>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          Indian GST Billing, POS, Inventory & Automated Accounting
        </p>
      </div>

      {/* Card */}
      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="bg-white dark:bg-slate-900/90 backdrop-blur-xl py-8 px-6 sm:px-10 shadow-2xl border border-slate-200 dark:border-slate-800 rounded-3xl space-y-6">
          {/* Quick Demo Account Button */}
          <div className="p-4 bg-gradient-to-r from-blue-500/10 to-indigo-500/10 dark:from-blue-600/20 dark:to-indigo-600/20 border border-blue-500/20 dark:border-blue-500/30 rounded-2xl space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  Instant Demo Sandbox
                </span>
              </div>
              <span className="text-[10px] font-bold bg-blue-100 dark:bg-blue-500/30 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded-full">
                Pre-Loaded
              </span>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300">
              Access <strong className="text-slate-900 dark:text-white">RAHUL JEE TRADING COMPANY</strong> with pre-populated GST invoices, stock items, customer ledgers, and live POS terminal.
            </p>

            <button
              onClick={handleDemoLogin}
              className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-blue-600/30 transition-all transform active:scale-95"
            >
              <Zap className="w-4 h-4 fill-current" />
              <span>Launch Demo Business (1-Click)</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          <div className="relative flex items-center justify-center">
            <div className="border-t border-slate-200 dark:border-slate-800 w-full" />
            <span className="bg-white dark:bg-slate-900 px-3 text-[11px] text-slate-400 font-semibold uppercase">
              Or Sign In With Phone
            </span>
          </div>

          {/* Phone / OTP Form */}
          <form onSubmit={handlePhoneSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Mobile Number
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-mono font-bold text-slate-400">
                  +91
                </span>
                <input
                  type="tel"
                  required
                  placeholder="8887754821"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full pl-12 pr-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {otpSent && (
              <div className="animate-in fade-in">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Enter 6-Digit OTP (Use: 123456)
                </label>
                <input
                  type="text"
                  required
                  placeholder="123456"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl text-center text-sm font-mono font-black tracking-widest text-blue-600 dark:text-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            )}

            <button
              type="submit"
              className="w-full py-2.5 bg-slate-800 dark:bg-slate-700 hover:bg-slate-700 dark:hover:bg-slate-600 text-white rounded-xl text-xs font-bold transition-colors"
            >
              {otpSent ? 'Verify & Continue' : 'Send OTP via SMS'}
            </button>
          </form>

          {/* New to BusinessOS */}
          <div className="pt-2 text-center text-xs text-slate-500 dark:text-slate-400">
            <span>New Indian business? </span>
            <Link href="/onboarding" className="text-blue-600 dark:text-blue-400 hover:underline font-bold">
              Create New Business (60s Setup)
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
