import React, { createContext, useContext, useEffect, useState } from 'react';
import { storage } from '@/lib/storage';

type Theme = 'light' | 'dark' | 'system';

interface AccentColor {
  name: string;
  h: number;
  s: number;
  l: number;
}

export const ACCENT_COLORS: AccentColor[] = [
  { name: 'Green', h: 142, s: 71, l: 45 },
  { name: 'Blue', h: 217, s: 91, l: 60 },
  { name: 'Purple', h: 270, s: 70, l: 55 },
  { name: 'Pink', h: 330, s: 80, l: 55 },
  { name: 'Orange', h: 25, s: 95, l: 53 },
  { name: 'Red', h: 0, s: 84, l: 60 },
  { name: 'Cyan', h: 185, s: 80, l: 45 },
  { name: 'Yellow', h: 48, s: 96, l: 53 },
];

interface ThemeContextType {
  theme: Theme;
  resolvedTheme: 'light' | 'dark';
  setTheme: (theme: Theme) => void;
  accentColor: AccentColor;
  setAccentColor: (color: AccentColor) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme] = useState<Theme>('dark'); // Force dark for this app
  const resolvedTheme = 'dark' as const;

  const [accentColor, setAccentColorState] = useState<AccentColor>(() => {
    const saved = localStorage.getItem('muse-accent');
    if (saved) {
      try { return JSON.parse(saved); } catch {}
    }
    return ACCENT_COLORS[0];
  });

  const setTheme = () => {}; // Dark only
  const setAccentColor = (color: AccentColor) => {
    setAccentColorState(color);
    localStorage.setItem('muse-accent', JSON.stringify(color));
  };

  useEffect(() => {
    document.documentElement.classList.add('dark');
    document.documentElement.classList.remove('light');
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--accent-h', String(accentColor.h));
    root.style.setProperty('--accent-s', `${accentColor.s}%`);
    root.style.setProperty('--accent-l', `${accentColor.l}%`);
  }, [accentColor]);

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme, accentColor, setAccentColor }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}
