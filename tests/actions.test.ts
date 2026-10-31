import { beforeEach, describe, expect, it, vi } from 'vitest';
import { deleteBill, saveBill, setBillPayment } from '../src/app/actions';

const owner = 'a0000000-0000-4000-8000-000000000001';
const billId = 'b0000000-0000-4000-8000-000000000001';
const mocks = vi.hoisted(() => ({ requireUser: vi.fn(), from: vi.fn(), revalidate: vi.fn() }));
vi.mock('@/lib/supabase/server', () => ({ requireUser: mocks.requireUser }));
vi.mock('next/cache', () => ({ revalidatePath: mocks.revalidate }));
const query = { eq: vi.fn(), select: vi.fn(), maybeSingle: vi.fn(), insert: vi.fn(), update: vi.fn(), delete: vi.fn(), upsert: vi.fn() };

function form(edit = false) {
  const data = new FormData();
  for (const [key, value] of Object.entries({ name: 'Internet', amount: '1499.50', due_day: '31', is_recurring: 'true', month: '2026-11' })) data.set(key, value);
  if (edit) data.set('bill_id', billId);
  return data;
}
beforeEach(() => {
  vi.clearAllMocks();
  mocks.requireUser.mockResolvedValue({ user: { id: owner }, supabase: { from: mocks.from } });
  mocks.from.mockReturnValue(query);
  for (const fn of [query.eq, query.select, query.update, query.delete]) fn.mockReturnValue(query);
  query.maybeSingle.mockResolvedValue({ data: { id: billId, start_month: '2026-11-01', is_recurring: true }, error: null });
  query.insert.mockResolvedValue({ error: null }); query.upsert.mockResolvedValue({ error: null });
});
describe('bill mutations', () => {
  it('uses the verified owner and selected month on creation', async () => {
    expect(await saveBill(form())).toEqual({ error: null });
    expect(query.insert).toHaveBeenCalledWith({ name: 'Internet', amount: 1499.5, due_day: 31, is_recurring: true, user_id: owner, start_month: '2026-11-01' });
    expect(mocks.revalidate).toHaveBeenCalledWith('/');
  });
  it('keeps ownership and start month out of edit payloads and scopes the update', async () => {
    expect((await saveBill(form(true))).error).toBeNull();
    expect(query.update).toHaveBeenCalledWith({ name: 'Internet', amount: 1499.5, due_day: 31, is_recurring: true });
    expect(query.eq).toHaveBeenCalledWith('user_id', owner);
    expect(query.eq).toHaveBeenCalledWith('id', billId);
  });
  it('does not write or revalidate invalid input', async () => {
    const invalid = form(); invalid.set('amount', '0');
    expect((await saveBill(invalid)).error).toBeTruthy();
    expect(query.insert).not.toHaveBeenCalled(); expect(mocks.revalidate).not.toHaveBeenCalled();
  });
  it('keeps failures visible and does not report a failed save as success', async () => {
    query.insert.mockResolvedValue({ error: { message: 'private database detail' } });
    expect((await saveBill(form())).error).toBe('Could not add this bill. Please try again.');
    expect(mocks.revalidate).not.toHaveBeenCalled();
    query.insert.mockRejectedValue(new Error('offline'));
    expect((await saveBill(form())).error).toMatch(/not confirmed/);
  });
  it('reports a missing/deleted row and scopes deletion to its verified owner', async () => {
    query.maybeSingle.mockResolvedValue({ data: null, error: null });
    expect((await saveBill(form(true))).error).toMatch(/no longer exists/);
    expect((await deleteBill(billId)).error).toMatch(/no longer exists/);
    expect(query.eq).toHaveBeenCalledWith('user_id', owner);
    expect(mocks.revalidate).not.toHaveBeenCalled();
  });
  it('sets explicit paid/unpaid state and a unique monthly upsert key', async () => {
    expect((await setBillPayment(billId, '2026-11', 'paid')).error).toBeNull();
    expect(query.upsert).toHaveBeenLastCalledWith({ bill_id: billId, user_id: owner, month: '2026-11-01', status: 'paid', paid_at: expect.any(String) }, { onConflict: 'bill_id,month' });
    expect((await setBillPayment(billId, '2026-11', 'unpaid')).error).toBeNull();
    expect(query.upsert).toHaveBeenLastCalledWith({ bill_id: billId, user_id: owner, month: '2026-11-01', status: 'unpaid', paid_at: null }, { onConflict: 'bill_id,month' });
  });
  it('refuses a payment for a bill outside its active months', async () => {
    query.maybeSingle.mockResolvedValue({ data: { id: billId, start_month: '2026-11-01', is_recurring: false }, error: null });
    expect((await setBillPayment(billId, '2026-12', 'paid')).error).toMatch(/unavailable/);
    expect(query.upsert).not.toHaveBeenCalled();
  });
  it('returns payment write failures and does not revalidate', async () => {
    query.upsert.mockResolvedValue({ error: { message: 'offline' } });
    expect((await setBillPayment(billId, '2026-11', 'paid')).error).toMatch(/not saved/);
    expect(mocks.revalidate).not.toHaveBeenCalled();
  });
  it('requires authentication for direct calls to every bill action', async () => {
    mocks.requireUser.mockRejectedValue(new Error('REDIRECT:/login'));
    await expect(saveBill(form())).rejects.toThrow('REDIRECT:/login');
    await expect(deleteBill(billId)).rejects.toThrow('REDIRECT:/login');
    await expect(setBillPayment(billId, '2026-11', 'paid')).rejects.toThrow('REDIRECT:/login');
    expect(mocks.from).not.toHaveBeenCalled();
  });
});
