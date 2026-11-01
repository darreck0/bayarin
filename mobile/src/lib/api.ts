import { z } from 'zod';
import { supabase } from './supabase';
import { buildMonthBills, isActiveInMonth } from './bills';
import { billSchema, paymentSchema } from './validation';
import { amountToCents, centsToAmount } from './money';
import type { PaymentStatus } from './database.types';

async function authenticated() {
  if (!supabase) throw new Error('Supabase is not configured.');
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) throw new Error('Could not verify your account. Check your connection or sign in again.');
  return { client: supabase, user };
}

export async function fetchMonth(month: string) {
  const { client, user } = await authenticated();
  const [bills, payments] = await Promise.all([
    client.from('bills').select('*').eq('user_id', user.id).lte('start_month', `${month}-01`),
    client.from('bill_payments').select('*').eq('user_id', user.id).eq('month', `${month}-01`),
  ]);
  if (bills.error || payments.error) throw new Error('Could not load your bills. Pull down to try again.');
  return buildMonthBills(bills.data ?? [], payments.data ?? [], month);
}

export type BillInput = { id?: string; name: string; amount: string; due_day: string; is_recurring: boolean; month: string };
export async function saveBill(input: BillInput) {
  const { client, user } = await authenticated();
  const parsed = billSchema.safeParse(input);
  if (!parsed.success) throw new Error(parsed.error.issues[0].message);
  if (input.id && !z.uuid().safeParse(input.id).success) throw new Error('Invalid bill. Refresh and try again.');
  const values = { name: parsed.data.name, amount: Number(centsToAmount(amountToCents(parsed.data.amount))), due_day: parsed.data.due_day, is_recurring: parsed.data.is_recurring };
  if (input.id) {
    const { data, error } = await client.from('bills').update(values).eq('id', input.id).eq('user_id', user.id).select('id').maybeSingle();
    if (error) throw new Error('Could not save this bill. Please try again.');
    if (!data) throw new Error('This bill no longer exists. Refresh the list.');
  } else {
    const { error } = await client.from('bills').insert({ ...values, user_id: user.id, start_month: `${parsed.data.month}-01` });
    if (error) throw new Error('Could not add this bill. Refresh before retrying if your connection dropped.');
  }
}

export async function removeBill(id: string) {
  const { client, user } = await authenticated();
  if (!z.uuid().safeParse(id).success) throw new Error('Invalid bill.');
  const { data, error } = await client.from('bills').delete().eq('id', id).eq('user_id', user.id).select('id').maybeSingle();
  if (error) throw new Error('Could not delete this bill. Please try again.');
  if (!data) throw new Error('This bill no longer exists. Refresh the list.');
}

export async function setPayment(billId: string, month: string, status: PaymentStatus) {
  const { client, user } = await authenticated();
  if (!paymentSchema.safeParse({ billId, month, status }).success) throw new Error('Invalid bill or month.');
  const { data: bill, error: lookupError } = await client.from('bills').select('*').eq('id', billId).eq('user_id', user.id).maybeSingle();
  if (lookupError) throw new Error('Could not load this bill. Try again.');
  if (!bill || !isActiveInMonth(bill, month)) throw new Error('This bill is unavailable for the selected month.');
  const { error } = await client.from('bill_payments').upsert({ bill_id: billId, user_id: user.id, month: `${month}-01`, status, paid_at: status === 'paid' ? new Date().toISOString() : null }, { onConflict: 'bill_id,month' });
  if (error) throw new Error('Payment status was not saved. Please try again.');
}

export async function saveName(value: string) {
  const { client } = await authenticated();
  const parsed = z.string().trim().min(1, 'Enter your name.').max(60, 'Use 60 characters or fewer.').safeParse(value);
  if (!parsed.success) throw new Error(parsed.error.issues[0].message);
  const { data, error } = await client.auth.updateUser({ data: { display_name: parsed.data } });
  if (error || !data.user) throw new Error('Could not save your name. Please try again.');
  return data.user;
}

export function errorMessage(error: unknown) { return error instanceof Error ? error.message : 'Something went wrong. Please try again.'; }
