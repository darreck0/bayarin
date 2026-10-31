import { redirect } from 'next/navigation';
import { Dashboard } from '@/components/dashboard';
import { getSupabaseConfig } from '@/lib/env';
import { isMonthKey, manilaDate } from '@/lib/calendar';
import { loadBills } from '@/lib/load-bills';

export const dynamic = 'force-dynamic';
export default async function Home({ searchParams }: { searchParams: Promise<{ month?: string | string[] }> }) {
  if (!getSupabaseConfig()) redirect('/login');
  const { month: selected } = await searchParams;
  const today = manilaDate();
  if (selected !== undefined && !isMonthKey(selected)) redirect('/');
  const month = selected ?? today.slice(0, 7);
  const { bills, displayName } = await loadBills(month);
  return <Dashboard key={month} month={month} bills={bills} initialToday={today} displayName={displayName} />;
}
