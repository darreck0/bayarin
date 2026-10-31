import 'server-only';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import type { Database } from '@/lib/database.types';
import { getSupabaseConfig } from '@/lib/env';

export async function createClient() {
  const config = getSupabaseConfig();
  if (!config) throw new Error('Supabase is not configured. Follow the setup steps in README.md.');
  const store = await cookies();
  return createServerClient<Database>(config.url, config.key, {
    cookies: {
      getAll: () => store.getAll(),
      setAll(cookiesToSet) {
        try { cookiesToSet.forEach(({ name, value, options }) => store.set(name, value, options)); }
        catch { /* Server Components cannot set cookies; Proxy handles refresh. */ }
      },
    },
  });
}

export async function requireUser() {
  const supabase = await createClient();
  // Verify against Auth, never trust a user read only from a session cookie.
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) redirect('/login');
  return { supabase, user };
}
