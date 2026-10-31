import { describe, expect, it } from 'vitest';
import { dueDate, isMonthKey, manilaDate, monthLabel, shiftMonth } from '../src/lib/calendar';
import { amountToCents, centsToAmount, formatMoney } from '../src/lib/money';
import { billSchema } from '../src/lib/validation';
import { buildMonthBills, displayStatus, isActiveInMonth, summarize } from '../src/lib/bills';
import type { Bill, BillPayment } from '../src/lib/database.types';

const owner = 'a0000000-0000-4000-8000-000000000001';
function bill(overrides: Partial<Bill> = {}): Bill {
  return { id: 'b0000000-0000-4000-8000-000000000001', user_id: owner, name: 'ATOME', amount: 1671, due_day: 1, is_recurring: true, start_month: '2026-11-01', created_at: '2026-10-31T00:00:00Z', ...overrides };
}
function payment(overrides: Partial<BillPayment> = {}): BillPayment {
  return { id: 'c0000000-0000-4000-8000-000000000001', bill_id: bill().id, user_id: owner, month: '2026-11-01', status: 'paid', paid_at: '2026-11-01T00:00:00Z', ...overrides };
}
describe('calendar dates in Manila', () => {
  it('changes the date and month at Manila midnight', () => {
    expect(manilaDate(new Date('2026-10-31T15:59:59Z'))).toBe('2026-10-31');
    expect(manilaDate(new Date('2026-10-31T16:00:00Z'))).toBe('2026-11-01');
  });
  it('navigates year boundaries and refuses out-of-range months', () => {
    expect(shiftMonth('2026-12', 1)).toBe('2027-01');
    expect(shiftMonth('2026-01', -1)).toBe('2025-12');
    expect(shiftMonth('1000-01', -1)).toBeNull();
    expect(shiftMonth('9999-12', 1)).toBeNull();
  });
  it('validates month URLs, including repeated or malformed query values', () => {
    for (const invalid of ['2026-1', '2026-13', '0000-01', '2026-11-01', ['2026-11'], null]) expect(isMonthKey(invalid)).toBe(false);
    expect(isMonthKey('2026-11')).toBe(true);
    expect(monthLabel('2026-11')).toBe('November 2026');
  });
  it('clamps due day 31 to short months and handles leap centuries', () => {
    expect(dueDate('2026-11', 31)).toBe('2026-11-30');
    expect(dueDate('2026-02', 31)).toBe('2026-02-28');
    expect(dueDate('2028-02', 31)).toBe('2028-02-29');
    expect(dueDate('2000-02', 29)).toBe('2000-02-29');
    expect(dueDate('2100-02', 29)).toBe('2100-02-28');
    expect(() => dueDate('2026-11', 0)).toThrow();
    expect(() => dueDate('bad', 1)).toThrow();
  });
});
describe('money and validation', () => {
  it('formats PHP and adds cents without floating-point drift', () => {
    expect(formatMoney(980200)).toBe('₱9,802.00');
    expect(amountToCents('0.10') + amountToCents('0.20')).toBe(30);
    expect(centsToAmount(amountToCents('9999999999.99'))).toBe('9999999999.99');
    expect(amountToCents(1671)).toBe(167100);
  });
  it('rejects invalid precision, negatives, exponent notation and invalid bill fields', () => {
    for (const value of ['1.001', '-1', '1e3', 'NaN', '', '10000000000']) expect(() => amountToCents(value)).toThrow();
    const valid = { name: ' Internet ', amount: '1499.50', due_day: '31', is_recurring: true, month: '2026-11' };
    expect(billSchema.parse(valid).name).toBe('Internet');
    expect(billSchema.safeParse({ ...valid, amount: '0' }).success).toBe(false);
    expect(billSchema.safeParse({ ...valid, due_day: '1.5' }).success).toBe(false);
    expect(billSchema.safeParse({ ...valid, name: '  ' }).success).toBe(false);
  });
});
describe('monthly bill projection', () => {
  it('starts recurrence at the selected month and confines one-time bills to that month', () => {
    expect(isActiveInMonth(bill(), '2026-10')).toBe(false);
    expect(isActiveInMonth(bill(), '2026-11')).toBe(true);
    expect(isActiveInMonth(bill(), '2027-12')).toBe(true);
    expect(isActiveInMonth(bill({ is_recurring: false }), '2026-11')).toBe(true);
    expect(isActiveInMonth(bill({ is_recurring: false }), '2026-12')).toBe(false);
  });
  it('keeps each month independent and defaults missing records to unpaid', () => {
    expect(buildMonthBills([bill()], [payment()], '2026-11')[0].paymentStatus).toBe('paid');
    expect(buildMonthBills([bill()], [payment()], '2026-12')[0].paymentStatus).toBe('unpaid');
    expect(buildMonthBills([bill()], [], '2026-10')).toEqual([]);
  });
  it('sorts by actual due date with stable alphabetical ties', () => {
    const result = buildMonthBills([bill({ id: 'z', name: 'Z', due_day: 31 }), bill({ id: 'a', name: 'A', due_day: 30 }), bill({ id: 'b', name: 'B', due_day: 3 })], [], '2026-11');
    expect(result.map(b => b.name)).toEqual(['B', 'A', 'Z']);
  });
  it('derives overdue without storing a third payment state; due today is unpaid', () => {
    expect(displayStatus('unpaid', '2026-11-01', '2026-11-01')).toBe('unpaid');
    expect(displayStatus('unpaid', '2026-11-01', '2026-11-02')).toBe('overdue');
    expect(displayStatus('paid', '2026-11-01', '2026-11-02')).toBe('paid');
    expect(displayStatus('unpaid', '2026-11-01', '2026-10-31')).toBe('unpaid');
  });
  it('calculates amount-weighted progress and zero-safe empty totals', () => {
    const rows = buildMonthBills([bill(), bill({ id: 'maribank', name: 'MARIBANK', amount: 4354 }), bill({ id: 'sloan', name: 'SLOAN', amount: 3777 })], [payment()], '2026-11');
    expect(summarize(rows)).toMatchObject({ total: 980200, paid: 167100, remaining: 813100, paidCount: 1 });
    expect(summarize(rows).progress).toBeCloseTo(1671 / 9802 * 100);
    expect(summarize([])).toEqual({ total: 0, paid: 0, remaining: 0, progress: 0, paidCount: 0 });
  });
});
