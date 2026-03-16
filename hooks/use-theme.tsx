import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';

import type { ReactNode } from 'react';

import { useColorScheme } from '@/hooks/use-color-scheme';

type ThemeMode = 'light' | 'dark';

interface ThemeContextType {
  isDark: boolean;
  theme: ThemeMode;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const systemScheme = useColorScheme();
  const [theme, setTheme] = useState<ThemeMode>(systemScheme === 'dark' ? 'dark' : 'light');
  const [hasUserSelected, setHasUserSelected] = useState(false);

  useEffect(() => {
    if (hasUserSelected) {
      return;
    }
    if (systemScheme === 'dark' || systemScheme === 'light') {
      setTheme(systemScheme);
    }
  }, [systemScheme, hasUserSelected]);

  const toggleTheme = useCallback(() => {
    setHasUserSelected(true);
    setTheme((currentTheme) => (currentTheme === 'light' ? 'dark' : 'light'));
  }, []);

  const value: ThemeContextType = {
    isDark: theme === 'dark',
    theme,
    toggleTheme,
  };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
}
