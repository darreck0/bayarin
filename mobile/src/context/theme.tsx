import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const light = {
  background: '#f8f7f5', foreground: '#252320', card: '#ffffff', primary: '#c64b05', onPrimary: '#ffffff',
  muted: '#716a63', mutedBackground: '#f0eeeb', border: '#e8e3dc', secondary: '#fff0df',
  summaryFrom: '#fff6e9', summaryTo: '#ffe0b5', summaryText: '#3b2414', summaryMuted: '#795535', summaryLine: '#eec99b',
  paidBg: '#dbeafe', paidText: '#1e40af', unpaidBg: '#fef3c7', unpaidText: '#92400e', overdueBg: '#fee2e2', overdueText: '#b91c1c',
  danger: '#bd3838', overlay: '#00000070',
};
export type Palette = typeof light;
const dark: Palette = {
  background: '#191715', foreground: '#f5f0e9', card: '#24211e', primary: '#ffb16b', onPrimary: '#2e180a',
  muted: '#b7aba0', mutedBackground: '#302b26', border: '#41372e', secondary: '#3a2c20',
  summaryFrom: '#33271c', summaryTo: '#49301c', summaryText: '#fff1df', summaryMuted: '#e3be98', summaryLine: '#6d4929',
  paidBg: '#172554', paidText: '#93c5fd', unpaidBg: '#451a03', unpaidText: '#fde68a', overdueBg: '#450a0a', overdueText: '#fca5a5',
  danger: '#f28b82', overlay: '#00000090',
};
const ThemeContext = createContext({ colors: light, mode: 'light' as 'light' | 'dark', toggle: () => {} });

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<'light' | 'dark'>('light');
  useEffect(() => {
    let mounted = true;
    AsyncStorage.getItem('bayarin-native-theme').then(value => { if (mounted && (value === 'light' || value === 'dark')) setMode(value); }).catch(() => {});
    return () => { mounted = false; };
  }, []);
  const toggle = useCallback(() => {
    const next = mode === 'light' ? 'dark' : 'light';
    setMode(next);
    void AsyncStorage.setItem('bayarin-native-theme', next).catch(() => {});
  }, [mode]);
  return <ThemeContext.Provider value={{ mode, colors: mode === 'dark' ? dark : light, toggle }}>{children}</ThemeContext.Provider>;
}

export const useTheme = () => useContext(ThemeContext);
