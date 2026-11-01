import { beforeEach, expect, it, vi } from 'vitest';
import { fetchMonth, saveBill, setPayment, saveName } from '../mobile/src/lib/api';

const owner = 'a0000000-0000-4000-8000-000000000001';
const billId = 'b0000000-0000-4000-8000-000000000001';
const mocks = vi.hoisted(() => ({ getUser: vi.fn(), updateUser: vi.fn(), from: vi.fn() }));
vi.mock('../mobile/src/lib/supabase', () => ({ supabase: { auth: { getUser: mocks.getUser, updateUser: mocks.updateUser }, from: mocks.from } }));
const query = { eq: vi.fn(), lte: vi.fn(), select: vi.fn(), maybeSingle: vi.fn(), insert: vi.fn(), update: vi.fn(), upsert: vi.fn() };

beforeEach(() => {
  vi.resetAllMocks();
  mocks.getUser.mockResolvedValue({ data: { user: { id: owner } }, error: null });
  mocks.from.mockReturnValue(query);
  for (const fn of [query.eq, query.lte, query.select, query.update]) fn.mockReturnValue(query);
  query.maybeSingle.mockResolvedValue({ data: { id: billId, start_month: '2026-11-01', is_recurring: true }, error: null });
  query.insert.mockResolvedValue({ error: null });
  query.upsert.mockResolvedValue({ error: null });
});

it('native reads and mutations require a verified account before accessing tables', async () => {
  mocks.getUser.mockResolvedValue({ data: { user: null }, error: { message: 'expired token' } });
  await expect(fetchMonth('2026-11')).rejects.toThrow(/verify your account/);
  await expect(setPayment(billId, '2026-11', 'paid')).rejects.toThrow(/verify your account/);
  expect(mocks.from).not.toHaveBeenCalled();
});
it('a caller cannot override the owner or start month of a new native bill', async () => {
  const input = { name: 'Internet', amount: '1499.50', due_day: '15', is_recurring: true, month: '2026-11', user_id: 'someone-else', start_month: '2020-01-01' };
  await saveBill(input);
  expect(query.insert).toHaveBeenCalledWith({ name: 'Internet', amount: 1499.5, due_day: 15, is_recurring: true, user_id: owner, start_month: '2026-11-01' });
});
it('native payment writes keep explicit status and the selected month', async () => {
  await setPayment(billId, '2026-11', 'unpaid');
  expect(query.eq).toHaveBeenCalledWith('user_id', owner);
  expect(query.upsert).toHaveBeenCalledWith({ bill_id: billId, user_id: owner, month: '2026-11-01', status: 'unpaid', paid_at: null }, { onConflict: 'bill_id,month' });
});
it('a one-time bill cannot be marked paid in another month', async () => {
  query.maybeSingle.mockResolvedValue({ data: { id: billId, start_month: '2026-11-01', is_recurring: false }, error: null });
  await expect(setPayment(billId, '2026-12', 'paid')).rejects.toThrow(/unavailable/);
  expect(query.upsert).not.toHaveBeenCalled();
});
it('a failed native write is never reported as a saved payment', async () => {
  query.upsert.mockResolvedValue({ error: { message: 'internal provider detail' } });
  await expect(setPayment(billId, '2026-11', 'paid')).rejects.toThrow('Payment status was not saved. Please try again.');
});
it('native name edits update only display metadata and reject blank input', async () => {
  await expect(saveName('  ')).rejects.toThrow(/Enter your name/);
  expect(mocks.updateUser).not.toHaveBeenCalled();
  mocks.updateUser.mockResolvedValue({ data: { user: { id: owner } }, error: null });
  await saveName('  Alex  ');
  expect(mocks.updateUser).toHaveBeenCalledWith({ data: { display_name: 'Alex' } });
});
