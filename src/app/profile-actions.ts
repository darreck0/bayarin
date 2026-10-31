'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { requireUser } from '@/lib/supabase/server';
import type { ActionState } from '@/lib/action-state';

const nameSchema = z.string().trim()
  .min(1, 'Enter the name you want to use.')
  .max(60, 'Keep your name to 60 characters or fewer.');

export async function saveDisplayName(form: FormData): Promise<ActionState> {
  const { supabase } = await requireUser();
  const parsed = nameSchema.safeParse(form.get('display_name'));
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  try {
    const { data, error } = await supabase.auth.updateUser({ data: { display_name: parsed.data } });
    if (error || !data.user) return { error: 'Could not save your name. Please try again.' };
  } catch { return { error: 'Could not reach Supabase. Please try again.' }; }

  revalidatePath('/');
  return { error: null };
}
