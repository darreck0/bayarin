import type { Bill, BillPayment, PaymentStatus } from './database.types';
import { dueDate } from './calendar';
import { amountToCents } from './money';

export type DisplayStatus = 'paid' | 'unpaid' | 'overdue';
export type MonthlyBill = Bill & { cents: number; dueDate: string; paymentStatus: PaymentStatus };

export function isActiveInMonth(bill: Pick<Bill, 'start_month' | 'is_recurring'>, month: string) {
  const start = bill.start_month.slice(0, 7);
  return bill.is_recurring ? month >= start : month === start;
}

export function displayStatus(payment: PaymentStatus, due: string, today: string): DisplayStatus {
  return payment === 'paid' ? 'paid' : due < today ? 'overdue' : 'unpaid';
}

export function buildMonthBills(bills: Bill[], payments: BillPayment[], month: string): MonthlyBill[] {
  const status = new Map(payments.filter(p => p.month.slice(0, 7) === month).map(p => [p.bill_id, p.status]));
  return bills.filter(b => isActiveInMonth(b, month)).map(bill => ({
    ...bill, cents: amountToCents(bill.amount), dueDate: dueDate(month, bill.due_day),
    paymentStatus: status.get(bill.id) ?? 'unpaid' as PaymentStatus,
  })).sort((a, b) => a.dueDate.localeCompare(b.dueDate) || a.name.localeCompare(b.name, 'en') || a.id.localeCompare(b.id));
}

export function summarize(bills: MonthlyBill[]) {
  const total = bills.reduce((sum, b) => sum + b.cents, 0);
  const paid = bills.reduce((sum, b) => sum + (b.paymentStatus === 'paid' ? b.cents : 0), 0);
  const paidCount = bills.filter(b => b.paymentStatus === 'paid').length;
  return { total, paid, remaining: total - paid, progress: total ? paid / total * 100 : 0, paidCount };
}
