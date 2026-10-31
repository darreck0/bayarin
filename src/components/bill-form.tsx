'use client';

import { useState, useTransition, type FormEvent } from 'react';
import { LoaderCircle, Repeat2 } from 'lucide-react';
import { saveBill } from '@/app/actions';
import type { Bill } from '@/lib/database.types';
import { monthLabel } from '@/lib/calendar';
import { amountToCents, centsToAmount } from '@/lib/money';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';

export function BillForm({ bill, month, onClose }: { bill?: Bill; month: string; onClose: () => void }) {
  const [recurring, setRecurring] = useState(bill?.is_recurring ?? false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const startMonth = bill?.start_month.slice(0, 7) ?? month;

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setError(null);
    startTransition(async () => {
      try {
        const result = await saveBill(form);
        if (result.error) setError(result.error); else onClose();
      } catch { setError('Could not save this bill. Please try again.'); }
    });
  }

  return <Dialog open onOpenChange={open => { if (!open && !pending) onClose(); }}>
    <DialogContent className="max-h-[90svh] overflow-y-auto rounded-2xl" showCloseButton={!pending} onCloseAutoFocus={event => { event.preventDefault(); document.getElementById(bill ? `bill-menu-${bill.id}` : 'add-bill')?.focus(); }}>
      <DialogHeader><DialogTitle>{bill ? 'Edit bill' : 'Add a bill'}</DialogTitle><DialogDescription>{bill ? `Changes apply to every occurrence. Start month stays ${monthLabel(startMonth)}.` : `A new bill for ${monthLabel(month)}.`}</DialogDescription></DialogHeader>
      <form onSubmit={submit} className="space-y-5">
        {bill && <input type="hidden" name="bill_id" value={bill.id} />}
        <input type="hidden" name="month" value={month} />
        <input type="hidden" name="is_recurring" value={String(recurring)} />
        <fieldset disabled={pending} className="space-y-5">
          <div className="space-y-2"><Label htmlFor="bill-name">Bill name</Label><Input id="bill-name" name="name" placeholder="e.g. Internet" defaultValue={bill?.name} required maxLength={100} /></div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2"><Label htmlFor="bill-amount">Amount (₱)</Label><Input id="bill-amount" name="amount" inputMode="decimal" type="number" min="0.01" max="9999999999.99" step="0.01" placeholder="0.00" defaultValue={bill ? centsToAmount(amountToCents(bill.amount)) : undefined} required /></div>
            <div className="space-y-2"><Label htmlFor="bill-day">Due day</Label><Input id="bill-day" name="due_day" type="number" inputMode="numeric" min="1" max="31" step="1" defaultValue={bill?.due_day ?? 1} required aria-describedby="day-help" /></div>
          </div>
          <p id="day-help" className="text-xs leading-5 text-muted-foreground">Choose a day from 1–31. Shorter months use their last day.</p>
          <div className="flex items-center justify-between gap-4 rounded-xl border bg-muted/40 p-4"><div><Label htmlFor="bill-recurring" className="flex items-center gap-2"><Repeat2 className="size-4" aria-hidden="true" />Recurring monthly</Label><p id="recurring-help" className="mt-1.5 text-xs leading-5 text-muted-foreground">{recurring ? `Every month from ${monthLabel(startMonth)}.` : `Only in ${monthLabel(startMonth)}.`}</p></div><Switch id="bill-recurring" checked={recurring} onCheckedChange={setRecurring} aria-describedby="recurring-help" disabled={pending} /></div>
        </fieldset>
        {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
        <div className="flex justify-end gap-2 pt-1"><Button type="button" variant="outline" disabled={pending} onClick={onClose}>Cancel</Button><Button type="submit" disabled={pending}>{pending && <LoaderCircle className="size-4 animate-spin" />}{pending ? 'Saving…' : bill ? 'Save changes' : 'Add bill'}</Button></div>
      </form>
    </DialogContent>
  </Dialog>;
}
