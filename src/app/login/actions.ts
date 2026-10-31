'use server';

import { redirect } from 'next/navigation';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import type { ActionState } from '@/lib/action-state';
import { getSupabaseConfig } from '@/lib/env';

export async function signIn(_previous: ActionState, form: FormData): Promise<ActionState> {
  if (!getSupabaseConfig()) return { error: 'Finish the Supabase setup in README.md before signing in.' };
  const parsed = z.object({
    email: z.email().max(254), password: z.string().min(1).max(1024),
  }).safeParse({ email: String(form.get('email') ?? '').trim(), password: form.get('password') });
  if (!parsed.success) return { error: 'Enter your email address and password.' };
  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.signInWithPassword(parsed.data);
    if (error) return { error: 'Could not sign in. Check your email and password, then try again.' };
  } catch { return { error: 'Could not reach Supabase. Please try again.' }; }
  redirect('/');
}

export async function signOut(): Promise<ActionState> {
  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.signOut();
    if (error) return { error: 'Could not sign out. Please try again.' };
  } catch { return { error: 'Could not sign out. Please try again.' }; }
  redirect('/login');
}
