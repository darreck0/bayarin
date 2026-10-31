'use client';

import { ThemeProvider } from 'next-themes';

export function Providers({ children }: { children: React.ReactNode }) {
  // The refreshed design starts in light mode, including browsers with the old green theme saved.
  return <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange storageKey="bayarin-theme-v2">{children}</ThemeProvider>;
}
