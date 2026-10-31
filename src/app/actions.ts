'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { requireUser } from '@/lib/supabase/server';
import { billSchema, paymentSchema } from '@/lib/validation';
import { amountToCents, centsToAmount } from '@/lib/money';
import { isActiveInMonth } from '@/lib/bills';
import type { ActionState } from '@/lib/action-state';
import type { PaymentStatus } from '@/lib/database.types';

export async function saveBill(form: FormData): Promise<ActionState> {
  const { supabase, user } = await requireUser();
  const parsed = billSchema.safeParse({
    name: form.get('name'), amount: form.get('amount'), due_day: form.get('due_day'),
    is_recurring: form.get('is_recurring') === 'true', month: form.get('month'),
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const id = form.get('bill_id');
  if (id !== null && !z.uuid().safeParse(id).success) return { error: 'Invalid bill. Refresh and try again.' };
  const values = {
    name: parsed.data.name, amount: Number(centsToAmount(amountToCents(parsed.data.amount))),
    due_day: parsed.data.due_day, is_recurring: parsed.data.is_recurring,
  };
  try {
    if (typeof id === 'string') {
      // Start month and ownership are immutable through the edit form.
      const { data, error } = await supabase.from('bills').update(values).eq('id', id).eq('user_id', user.id).select('id').maybeSingle();
      if (error) return { error: 'Could not save this bill. Please try again.' };
      if (!data) return { error: 'This bill no longer exists. Refresh and try again.' };
    } else {
      const { error } = await supabase.from('bills').insert({ ...values, user_id: user.id, start_month: `${parsed.data.month}-01` });
      if (error) return { error: 'Could not add this bill. Please try again.' };
    }
  } catch { return { error: 'Could not reach Supabase. Your changes were not confirmed; please try again.' }; }
  revalidatePath('/');
  return { error: null };
}

export async function deleteBill(id: string): Promise<ActionState> {
  const { supabase, user } = await requireUser();
  if (!z.uuid().safeParse(id).success) return { error: 'Invalid bill. Refresh and try again.' };
  try {
    const { data, error } = await supabase.from('bills').delete().eq('id', id).eq('user_id', user.id).select('id').maybeSingle();
    if (error) return { error: 'Could not delete this bill. Please try again.' };
    if (!data) return { error: 'This bill no longer exists. Refresh to update the list.' };
  } catch { return { error: 'Could not reach Supabase. Please try again.' }; }
  revalidatePath('/');
  return { error: null };
}

export async function setBillPayment(billId: string, month: string, status: PaymentStatus): Promise<ActionState> {
  const { supabase, user } = await requireUser();
  const parsed = paymentSchema.safeParse({ billId, month, status });
  if (!parsed.success) return { error: 'Invalid bill or month. Refresh and try again.' };
  try {
    const { data: bill, error: billError } = await supabase.from('bills').select('*').eq('id', billId).eq('user_id', user.id).maybeSingle();
    if (billError) return { error: 'Could not load this bill. Please try again.' };
    if (!bill || !isActiveInMonth(bill, month)) return { error: 'This bill is unavailable for the selected month. Refresh the list.' };
    const { error } = await supabase.from('bill_payments').upsert({
      bill_id: billId, user_id: user.id, month: `${month}-01`, status,
      paid_at: status === 'paid' ? new Date().toISOString() : null,
    }, { onConflict: 'bill_id,month' });
    if (error) return { error: 'Payment status was not saved. Please try again.' };
  } catch { return { error: 'Could not reach Supabase. Payment status was not confirmed; please try again.' }; }
  revalidatePath('/');
  return { error: null };
}
