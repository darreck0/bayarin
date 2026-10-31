import Link from 'next/link';
import { ChevronLeft, ChevronRight, CalendarDays } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { monthLabel, shiftMonth } from '@/lib/calendar';

export function MonthSwitcher({ month, currentMonth }: { month: string; currentMonth: string }) {
  const prev = shiftMonth(month, -1), next = shiftMonth(month, 1);
  return <nav aria-label="Choose month" className="mb-5 flex items-center justify-between rounded-xl border bg-card px-2 py-2">
    {prev ? <Button asChild variant="ghost" size="icon-lg"><Link href={`/?month=${prev}`} prefetch={false} aria-label="Previous month"><ChevronLeft className="size-5" /></Link></Button> : <Button variant="ghost" size="icon-lg" disabled aria-label="Previous month"><ChevronLeft /></Button>}
    <div className="flex items-center gap-2.5"><CalendarDays className="hidden size-4 text-muted-foreground min-[360px]:block" aria-hidden="true" /><span className="text-base font-semibold tracking-tight">{monthLabel(month)}</span>{month === currentMonth && <span className="hidden rounded-full bg-secondary px-2 py-1 text-[10px] font-medium text-secondary-foreground sm:inline">This month</span>}</div>
    {next ? <Button asChild variant="ghost" size="icon-lg"><Link href={`/?month=${next}`} prefetch={false} aria-label="Next month"><ChevronRight className="size-5" /></Link></Button> : <Button variant="ghost" size="icon-lg" disabled aria-label="Next month"><ChevronRight /></Button>}
  </nav>;
}
