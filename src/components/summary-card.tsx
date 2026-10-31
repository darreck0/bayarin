import { Check, CircleDashed } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { summarize, type MonthlyBill } from '@/lib/bills';
import { formatMoney } from '@/lib/money';

export function SummaryCard({ bills }: { bills: MonthlyBill[] }) {
  const summary = summarize(bills);
  return <Card aria-label="Monthly summary" className="summary-card gap-0 overflow-hidden rounded-3xl py-0 text-[var(--summary-foreground)] shadow-none">
    <CardContent className="p-6 sm:p-8">
      <p className="text-sm font-medium text-[var(--summary-muted)]">Total this month</p>
      <p className="tabular-money mt-3 break-words text-[40px] leading-tight font-semibold min-[400px]:text-5xl">{formatMoney(summary.total)}</p>
      <div className="mt-7 grid grid-cols-2 gap-4 border-t border-[var(--summary-divider)] pt-6">
        <div><p className="mb-2 flex items-center gap-1.5 text-xs text-[var(--summary-muted)]"><Check className="size-4" aria-hidden="true" />Paid</p><p className="tabular-money break-words text-lg font-semibold min-[360px]:text-xl">{formatMoney(summary.paid)}</p></div>
        <div className="border-l border-[var(--summary-divider)] pl-5"><p className="mb-2 flex items-center gap-1.5 text-xs text-[var(--summary-muted)]"><CircleDashed className="size-4" aria-hidden="true" />Remaining</p><p className="tabular-money break-words text-lg font-semibold min-[360px]:text-xl">{formatMoney(summary.remaining)}</p></div>
      </div>
      <Progress aria-label="Percentage of bill amount paid" value={summary.progress} className="mt-7 h-2 bg-[var(--summary-track)] [&_[data-slot=progress-indicator]]:bg-primary" />
      <div className="mt-3 flex justify-between gap-2 text-xs text-[var(--summary-muted)]"><span>{summary.paidCount} of {bills.length} bills paid</span><span>{Math.round(summary.progress)}% complete</span></div>
    </CardContent>
  </Card>;
}
