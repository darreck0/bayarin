import { beforeEach, expect, it, vi } from 'vitest';
import { saveDisplayName } from '../src/app/profile-actions';

const mocks = vi.hoisted(() => ({ requireUser: vi.fn(), updateUser: vi.fn(), revalidate: vi.fn() }));
vi.mock('@/lib/supabase/server', () => ({ requireUser: mocks.requireUser }));
vi.mock('next/cache', () => ({ revalidatePath: mocks.revalidate }));

function form(name: string) {
  const data = new FormData(); data.set('display_name', name); return data;
}
beforeEach(() => {
  vi.resetAllMocks();
  mocks.requireUser.mockResolvedValue({ user: { id: 'owner' }, supabase: { auth: { updateUser: mocks.updateUser } } });
  mocks.updateUser.mockResolvedValue({ data: { user: { id: 'owner' } }, error: null });
});

it('requires authentication before any account update', async () => {
  mocks.requireUser.mockRejectedValue(new Error('REDIRECT:/login'));
  await expect(saveDisplayName(form('Alex'))).rejects.toThrow('REDIRECT:/login');
  expect(mocks.updateUser).not.toHaveBeenCalled();
});
it('rejects blank and overlong names without changing the account', async () => {
  for (const name of ['  ', 'a'.repeat(61)]) expect((await saveDisplayName(form(name))).error).toBeTruthy();
  expect(mocks.updateUser).not.toHaveBeenCalled();
  expect(mocks.revalidate).not.toHaveBeenCalled();
});
it('updates only the current account display name and refreshes the greeting', async () => {
  expect(await saveDisplayName(form('  Alex Santos  '))).toEqual({ error: null });
  expect(mocks.updateUser).toHaveBeenCalledWith({ data: { display_name: 'Alex Santos' } });
  expect(mocks.revalidate).toHaveBeenCalledWith('/');
});
it('keeps provider errors private and does not report a failed save as success', async () => {
  mocks.updateUser.mockResolvedValue({ data: { user: null }, error: { message: 'private provider detail' } });
  expect(await saveDisplayName(form('Alex'))).toEqual({ error: 'Could not save your name. Please try again.' });
  expect(mocks.revalidate).not.toHaveBeenCalled();
});
it('returns a recoverable network error without revalidating', async () => {
  mocks.updateUser.mockRejectedValue(new Error('network offline'));
  expect((await saveDisplayName(form('Alex'))).error).toMatch(/reach Supabase/);
  expect(mocks.revalidate).not.toHaveBeenCalled();
});
