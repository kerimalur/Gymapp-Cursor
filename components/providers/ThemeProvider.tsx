'use client';

import { createContext, useContext } from 'react';

// Only light mode - no dark mode support
interface ThemeContextType {
  theme: 'light';
  resolvedTheme: 'light';
}

const ThemeContext = createContext<ThemeContextType>({
  theme: 'light',
  resolvedTheme: 'light'
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <ThemeContext.Provider value={{ theme: 'light', resolvedTheme: 'light' }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
