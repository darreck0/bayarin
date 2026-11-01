import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { AppState } from 'react-native';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

const SessionContext = createContext<{ session: Session | null; ready: boolean }>({ session: null, ready: false });

export function SessionProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(!supabase);

  useEffect(() => {
    if (!supabase) return;
    let mounted = true;
    let eventReceived = false;
    const client = supabase;
    const { data: { subscription } } = client.auth.onAuthStateChange((_event, nextSession) => {
      eventReceived = true;
      if (mounted) { setSession(nextSession); setReady(true); }
    });
    client.auth.getSession().then(({ data }) => {
      if (mounted && !eventReceived) setSession(data.session);
    }).catch(() => { if (mounted) setSession(null); }).finally(() => { if (mounted) setReady(true); });
    if (AppState.currentState === 'active') void client.auth.startAutoRefresh();
    const appState = AppState.addEventListener('change', state => {
      if (state === 'active') void client.auth.startAutoRefresh(); else void client.auth.stopAutoRefresh();
    });
    return () => { mounted = false; subscription.unsubscribe(); appState.remove(); void client.auth.stopAutoRefresh(); };
  }, []);

  return <SessionContext.Provider value={{ session, ready }}>{children}</SessionContext.Provider>;
}

export const useSession = () => useContext(SessionContext);
