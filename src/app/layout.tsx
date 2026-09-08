import type { Metadata } from 'next';
import './globals.css';
import { ThemeProvider } from '@/components/theme/ThemeProvider';
import { AutoSelectNumberInputs } from '@/components/layout/AutoSelectNumberInputs';

export const metadata: Metadata = {
  title: 'RAHUL JEE TRADING COMPANY — Complete GST Billing, Accounting & Inventory Platform',
  description: 'Fast, modern, Indian business management software for retail, wholesale, distributors & supermarkets with complete GST compliance, POS and double-entry accounting.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0, viewport-fit=cover" />
        <meta name="theme-color" content="#0f172a" />
      </head>
      <body className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 selection:bg-blue-500 selection:text-white transition-colors duration-150">
        <ThemeProvider>
          <AutoSelectNumberInputs />
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
