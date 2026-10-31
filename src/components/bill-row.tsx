'use client';

import { useState, useTransition } from 'react';
import { Check, Circle, Ellipsis, LoaderCircle, Pencil, Repeat2, Trash2 } from 'lucide-react';
import { setBillPayment } from '@/app/actions';
import { displayStatus, type MonthlyBill } from '@/lib/bills';
import { shortDueDate } from '@/lib/calendar';
import { formatMoney } from '@/lib/money';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

export function BillRow({ bill, month, today, onEdit, onDelete }: { bill: MonthlyBill; month: string; today: string; onEdit: () => void; onDelete: () => void }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const status = displayStatus(bill.paymentStatus, bill.dueDate, today);
  const paid = status === 'paid', overdue = status === 'overdue';
  const statusLabel = paid ? 'Paid' : overdue ? 'Overdue' : 'Unpaid';
  return <li className="overflow-hidden rounded-xl border bg-card transition-colors">
    <div className="flex items-center pr-2">
      <button type="button" disabled={pending} aria-label={`${bill.name}, ${formatMoney(bill.cents)}, ${statusLabel}. Mark ${paid ? 'unpaid' : 'paid'}`} aria-pressed={paid} aria-busy={pending} className="flex min-w-0 flex-1 items-center gap-3 rounded-xl p-4 text-left transition-colors hover:bg-muted/50 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring disabled:opacity-60 sm:gap-4 sm:p-5" onClick={() => {
        setError(null);
        startTransition(async () => {
          try { const result = await setBillPayment(bill.id, month, paid ? 'unpaid' : 'paid'); setError(result.error); }
          catch { setError('Could not update payment status. Please try again.'); }
        });
      }}>
        <span className={cn('flex size-9 shrink-0 items-center justify-center rounded-full', paid ? 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300' : overdue ? 'bg-red-50 text-red-600 dark:bg-red-950/60 dark:text-red-300' : 'bg-muted text-muted-foreground')} aria-hidden="true">{pending ? <LoaderCircle className="size-4 animate-spin" /> : paid ? <Check className="size-4" /> : <Circle className="size-4" />}</span>
        <span className="min-w-0 flex-1"><span className={cn('block truncate text-sm font-semibold', overdue && 'text-destructive')}>{bill.name}</span><span className={cn('mt-1 flex items-center gap-1.5 text-[11px] text-muted-foreground', overdue && 'text-destructive')}><span>Due {shortDueDate(bill.dueDate)}</span>{bill.is_recurring && <Repeat2 className="size-3 shrink-0" aria-label="Recurring monthly" />}</span></span>
        <span className="min-w-0 text-right"><span className={cn('tabular-money block break-all text-sm font-semibold sm:text-base', overdue && 'text-destructive')}>{formatMoney(bill.cents)}</span><Badge variant="secondary" className={cn('mt-1.5 rounded-full border-0 px-2 py-0.5 text-[10px] font-medium', paid ? 'bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300' : overdue ? 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300' : 'bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200')}>{statusLabel}</Badge></span>
      </button>
      <DropdownMenu><DropdownMenuTrigger asChild><Button id={`bill-menu-${bill.id}`} variant="ghost" size="icon-lg" aria-label={`Options for ${bill.name}`} disabled={pending}><Ellipsis className="size-4" /></Button></DropdownMenuTrigger><DropdownMenuContent align="end"><DropdownMenuItem onSelect={onEdit}><Pencil className="size-4" />Edit bill</DropdownMenuItem><DropdownMenuItem onSelect={onDelete} className="text-destructive focus:text-destructive"><Trash2 className="size-4" />Delete bill</DropdownMenuItem></DropdownMenuContent></DropdownMenu>
    </div>
    {error && <p role="alert" className="px-4 pb-4 text-xs leading-5 text-destructive">{error}</p>}
  </li>;
}
