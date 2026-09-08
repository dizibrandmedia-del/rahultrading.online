'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('light');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    try {
      if (typeof window !== 'undefined') {
        const savedTheme = (localStorage.getItem('rahultraders-theme') || localStorage.getItem('dizibook-theme')) as Theme | null;
        if (savedTheme === 'dark' || savedTheme === 'light') {
          setThemeState(savedTheme);
          if (savedTheme === 'dark') {
            document.documentElement.classList.add('dark');
          } else {
            document.documentElement.classList.remove('dark');
          }
        } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
          setThemeState('dark');
          document.documentElement.classList.add('dark');
        }
      }
    } catch (_) {}
    setMounted(true);
  }, []);

  const setTheme = (newTheme: Theme) => {
    try {
      setThemeState(newTheme);
      if (typeof window !== 'undefined') {
        localStorage.setItem('rahultraders-theme', newTheme);
        if (newTheme === 'dark') {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      }
    } catch (_) {}
  };

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    return {
      theme: 'light' as Theme,
      setTheme: () => {},
      toggleTheme: () => {},
    };
  }
  return context;
}

export default ThemeProvider;
