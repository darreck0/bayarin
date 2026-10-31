'use client';

import { useEffect, useState } from 'react';
import { AlertCircle, Plus, ReceiptText, ShieldCheck } from 'lucide-react';
import { AppHeader } from '@/components/app-header';
import { MonthSwitcher } from '@/components/month-switcher';
import { SummaryCard } from '@/components/summary-card';
import { BillRow } from '@/components/bill-row';
import { BillForm } from '@/components/bill-form';
import { DeleteBillDialog } from '@/components/delete-bill-dialog';
import { Button } from '@/components/ui/button';
import { displayStatus, type MonthlyBill } from '@/lib/bills';
import { manilaDate } from '@/lib/calendar';

export function Dashboard({ month, bills, initialToday }: { month: string; bills: MonthlyBill[]; initialToday: string }) {
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
    <main className="mx-auto max-w-3xl px-5 pb-32 pt-9 sm:px-8 sm:pt-12">
      <div className="mb-7"><p className="eyebrow mb-2.5">ONE MONTH AT A TIME</p><h1 className="text-[28px] font-semibold tracking-tight sm:text-3xl">A clearer view of your bills.</h1><p className="mt-2 text-sm text-muted-foreground">Less mental clutter. A little more peace of mind.</p></div>
      <MonthSwitcher month={month} currentMonth={today.slice(0, 7)} />
      <SummaryCard bills={bills} />
      <section aria-labelledby="bills-heading" className="mt-8">
        <div className="mb-4 flex items-center justify-between gap-4"><h2 id="bills-heading" className="flex items-center gap-2 text-base font-semibold">Your bills<span className="flex size-5 items-center justify-center rounded-full bg-muted text-[10px] font-medium text-muted-foreground">{bills.length}</span></h2><span className="text-[11px] text-muted-foreground">By due date</span></div>
        {overdue > 0 && <p className="mb-4 flex items-center gap-2 text-xs text-destructive"><AlertCircle className="size-3.5 shrink-0" aria-hidden="true" />{overdue} {overdue === 1 ? 'bill needs' : 'bills need'} your attention.</p>}
        {bills.length ? <><ul className="space-y-3">{bills.map(bill => <BillRow key={bill.id} bill={bill} month={month} today={today} onEdit={() => setEditor(bill)} onDelete={() => setDeleting(bill)} />)}</ul><p className="mt-5 text-center text-[11px] text-muted-foreground">Tap a bill to mark it paid or unpaid.</p></> : <div className="rounded-2xl border border-dashed px-5 py-12 text-center"><ReceiptText className="mx-auto mb-4 size-8 text-muted-foreground/60" aria-hidden="true" /><h3 className="text-sm font-semibold">A clean slate.</h3><p className="mx-auto mt-2 max-w-xs text-sm leading-6 text-muted-foreground">No bills for this month yet. Add one to start keeping track.</p><Button variant="outline" className="mt-5" onClick={() => setEditor('new')}><Plus className="size-4" />Add your first bill</Button></div>}
      </section>
      <footer className="mt-12 flex items-center justify-center gap-1.5 text-[10px] text-muted-foreground"><ShieldCheck className="size-3" aria-hidden="true" />Your space. Your pace.</footer>
    </main>
    <Button id="add-bill" aria-label="Add bill" className="fixed z-20 size-14 rounded-2xl shadow-lg shadow-primary/15 sm:w-auto sm:px-5" style={{ right: 'max(1.25rem, calc((100vw - 44rem) / 2))', bottom: 'max(1.5rem, env(safe-area-inset-bottom))' }} onClick={() => setEditor('new')}><Plus className="size-6" /><span className="hidden sm:inline">Add bill</span></Button>
    {editor && <BillForm key={editor === 'new' ? 'new' : editor.id} month={month} bill={editor === 'new' ? undefined : editor} onClose={() => setEditor(null)} />}
    {deleting && <DeleteBillDialog bill={deleting} onClose={() => setDeleting(null)} />}
  </>;
}
