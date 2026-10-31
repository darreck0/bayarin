import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { expect, it, vi } from 'vitest';
import { Dashboard } from '../src/components/dashboard';
import { LoginForm } from '../src/components/login-form';
import { buildMonthBills } from '../src/lib/bills';
import type { Bill } from '../src/lib/database.types';

vi.mock('@/app/actions', () => ({ saveBill: vi.fn(), deleteBill: vi.fn(), setBillPayment: vi.fn() }));
vi.mock('@/app/login/actions', () => ({ signIn: vi.fn(), signOut: vi.fn() }));

function render(bills: Bill[], today = '2026-11-02') {
  return renderToStaticMarkup(createElement(Dashboard, { month: '2026-11', initialToday: today, bills: buildMonthBills(bills, [], '2026-11') }));
}
it('renders empty dashboard with zero totals and an accessible add action', () => {
  const html = render([]);
  expect(html).toContain('A clean slate.');
  expect(html).toContain('₱0.00');
  expect(html).toContain('aria-label="Add bill"');
  expect(html).toContain('month=2026-10');
  expect(html).toContain('month=2026-12');
});
it('renders bill payment buttons and separate edit menus with overdue labels', () => {
  const html = render([{ id: 'bill1', user_id: 'owner', name: 'ATOME', amount: 1671, due_day: 1, is_recurring: true, start_month: '2026-11-01', created_at: '2026-10-31T00:00:00Z' }]);
  expect(html).toContain('₱1,671.00');
  expect(html).toContain('Overdue');
  expect(html).toContain('aria-pressed="false"');
  expect(html).toContain('aria-label="Options for ATOME"');
  expect(html).toContain('Mark paid');
  expect(html).toContain('1 bill needs');
});
it('disables unconfigured login and does not expose public registration', () => {
  const html = renderToStaticMarkup(createElement(LoginForm, { configured: false }));
  expect(html).toContain('autoComplete="current-password"');
  expect(html).toContain('disabled=""');
  expect(html.toLowerCase()).not.toContain('sign up');
});
