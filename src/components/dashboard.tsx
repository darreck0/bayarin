'use client';

import { useEffect, useState } from 'react';
import { AlertCircle, Plus, ReceiptText, ShieldCheck } from 'lucide-react';
import { AppHeader } from '@/components/app-header';
import { Greeting } from '@/components/greeting';
import { MonthSwitcher } from '@/components/month-switcher';
import { SummaryCard } from '@/components/summary-card';
import { BillRow } from '@/components/bill-row';
import { BillForm } from '@/components/bill-form';
import { DeleteBillDialog } from '@/components/delete-bill-dialog';
import { Button } from '@/components/ui/button';
import { displayStatus, type MonthlyBill } from '@/lib/bills';
import { manilaDate } from '@/lib/calendar';

export function Dashboard({ month, bills, initialToday, displayName }: { month: string; bills: MonthlyBill[]; initialToday: string; displayName: string }) {
  const [today, setToday] = useState(initialToday);
  const [editor, setEditor] = useState<MonthlyBill | 'new' | null>(null);
  const [deleting, setDeleting] = useState<MonthlyBill | null>(null);
  useEffect(() => {
    const update = () => setToday(manilaDate());
    const timer = window.setInterval(update, 30000);
    window.addEventListener('focus', update);
    document.addEventListener('visibilitychange', update);
    return () => { window.clearInterval(timer); window.removeEventListener('focus', update); document.removeEventListener('visibilitychange', update); };
  }, []);
  const overdue = bills.filter(bill => displayStatus(bill.paymentStatus, bill.dueDate, today) === 'overdue').length;

  return <>
    <AppHeader />
    <main className="mx-auto max-w-7xl px-5 pb-32 pt-10 sm:px-8 lg:px-10 lg:pt-12">
      <div className="mb-8 lg:mb-10">
        <Greeting displayName={displayName} />
        <h1 className="text-3xl leading-tight font-semibold tracking-tight sm:text-4xl lg:text-[42px]">A clearer view of <span className="text-primary">your bills.</span></h1>
        <p className="mt-3 text-sm leading-6 text-muted-foreground sm:text-base">Less mental clutter. A little more peace of mind.</p>
      </div>
      <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] lg:gap-10">
        <aside aria-label="Monthly overview" className="min-w-0">
          <MonthSwitcher month={month} currentMonth={today.slice(0, 7)} />
          <SummaryCard bills={bills} />
        </aside>
        <section aria-labelledby="bills-heading" className="min-w-0">
          <div className="mb-5 flex min-h-10 items-center justify-between gap-4">
            <h2 id="bills-heading" className="flex items-center gap-2.5 text-lg font-semibold">Your bills<span className="flex size-6 items-center justify-center rounded-full bg-secondary text-xs font-medium text-secondary-foreground">{bills.length}</span></h2>
            <span className="text-xs text-muted-foreground">By due date</span>
          </div>
          {overdue > 0 && <p className="mb-4 flex items-center gap-2 text-xs text-destructive"><AlertCircle className="size-3.5 shrink-0" aria-hidden="true" />{overdue} {overdue === 1 ? 'bill needs' : 'bills need'} your attention.</p>}
          {bills.length ? <>
            <ul className="space-y-4">{bills.map(bill => <BillRow key={bill.id} bill={bill} month={month} today={today} onEdit={() => setEditor(bill)} onDelete={() => setDeleting(bill)} />)}</ul>
            <p className="mt-5 text-center text-xs text-muted-foreground">Tap a bill to mark it paid or unpaid.</p>
          </> : <div className="rounded-3xl border border-dashed bg-card px-5 py-14 text-center">
            <span className="mx-auto mb-5 flex size-16 items-center justify-center rounded-2xl bg-secondary"><ReceiptText className="size-7 text-primary" aria-hidden="true" /></span>
            <h3 className="text-base font-semibold">A clean slate.</h3>
            <p className="mx-auto mt-2 max-w-xs text-sm leading-6 text-muted-foreground">No bills for this month yet. Add one to start keeping track.</p>
            <Button variant="outline" className="mt-5 rounded-full" onClick={() => setEditor('new')}><Plus className="size-4" />Add your first bill</Button>
          </div>}
        </section>
      </div>
      <footer className="mt-10 flex items-center justify-center gap-1.5 text-xs text-muted-foreground lg:mt-12"><ShieldCheck className="size-3.5" aria-hidden="true" />Your space. Your pace.</footer>
    </main>
    <Button id="add-bill" aria-label="Add bill" className="fixed z-20 size-14 rounded-full shadow-lg shadow-primary/20 sm:w-auto sm:px-6" style={{ right: 'max(1.25rem, calc((100vw - 75rem) / 2))', bottom: 'max(1.5rem, env(safe-area-inset-bottom))' }} onClick={() => setEditor('new')}><Plus className="size-6" /><span className="hidden sm:inline">Add bill</span></Button>
    {editor && <BillForm key={editor === 'new' ? 'new' : editor.id} month={month} bill={editor === 'new' ? undefined : editor} onClose={() => setEditor(null)} />}
    {deleting && <DeleteBillDialog bill={deleting} onClose={() => setDeleting(null)} />}
  </>;
}
