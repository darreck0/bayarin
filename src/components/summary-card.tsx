import { Check, CircleDashed } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { summarize, type MonthlyBill } from '@/lib/bills';
import { formatMoney } from '@/lib/money';

export function SummaryCard({ bills }: { bills: MonthlyBill[] }) {
  const summary = summarize(bills);
  return <Card aria-label="Monthly summary" className="overflow-hidden rounded-2xl border-0 bg-[#29432e] py-0 text-[#f4f7ed] shadow-none dark:bg-[#263824] dark:text-[#f4f7ed]">
    <CardContent className="p-6 sm:p-7">
      <p className="text-xs font-medium text-[#c7d8bd]">Total this month</p>
      <p className="tabular-money mt-2 break-words text-4xl font-semibold sm:text-[44px]">{formatMoney(summary.total)}</p>
      <div className="mt-6 grid grid-cols-2 gap-4 border-t border-white/15 pt-5">
        <div><p className="mb-1.5 flex items-center gap-1.5 text-xs text-[#c7d8bd]"><Check className="size-3.5" aria-hidden="true" />Paid</p><p className="tabular-money break-words text-lg font-semibold min-[360px]:text-xl">{formatMoney(summary.paid)}</p></div>
        <div className="border-l border-white/15 pl-5"><p className="mb-1.5 flex items-center gap-1.5 text-xs text-[#c7d8bd]"><CircleDashed className="size-3.5" aria-hidden="true" />Remaining</p><p className="tabular-money break-words text-lg font-semibold min-[360px]:text-xl">{formatMoney(summary.remaining)}</p></div>
      </div>
      <Progress aria-label="Percentage of bill amount paid" value={summary.progress} className="mt-6 h-1.5 bg-white/15 [&_[data-slot=progress-indicator]]:bg-[#b9d99a]" />
      <div className="mt-2.5 flex justify-between gap-2 text-[11px] text-[#c7d8bd]"><span>{summary.paidCount} of {bills.length} bills paid</span><span>{Math.round(summary.progress)}% complete</span></div>
    </CardContent>
  </Card>;
}
