import 'server-only';
import { requireUser } from '@/lib/supabase/server';
import { buildMonthBills } from '@/lib/bills';

export async function loadBills(month: string) {
  const { supabase, user } = await requireUser();
  const metadataName = [user.user_metadata.display_name, user.user_metadata.full_name, user.user_metadata.name]
    .find((value): value is string => typeof value === 'string' && value.trim().length > 0)?.trim();
  const displayName = metadataName ?? '';
  const [bills, payments] = await Promise.all([
    supabase.from('bills').select('*').eq('user_id', user.id).lte('start_month', `${month}-01`),
    supabase.from('bill_payments').select('*').eq('user_id', user.id).eq('month', `${month}-01`),
  ]);
  if (bills.error || payments.error) throw new Error('Could not load bills. Verify the database migration and try again.');
  return { bills: buildMonthBills(bills.data ?? [], payments.data ?? [], month), displayName };
}
