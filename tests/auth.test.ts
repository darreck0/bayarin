import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { signIn, signOut } from '../src/app/login/actions';

const mocks = vi.hoisted(() => ({ signInWithPassword: vi.fn(), signOut: vi.fn() }));
vi.mock('@/lib/supabase/server', () => ({ createClient: async () => ({ auth: mocks }) }));
vi.mock('next/navigation', () => ({ redirect: (path: string) => { throw new Error(`REDIRECT:${path}`); } }));

function credentials(email = 'owner@example.com', password = 'existing-password') {
  const form = new FormData(); form.set('email', email); form.set('password', password); return form;
}
describe('password login actions', () => {
  beforeEach(() => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://example.supabase.co');
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY', 'sb_publishable_test');
    mocks.signInWithPassword.mockReset(); mocks.signOut.mockReset();
  });
  afterEach(() => vi.unstubAllEnvs());
  it('rejects malformed input before calling Auth', async () => {
    expect((await signIn({ error: null }, credentials('invalid', ''))).error).toBeTruthy();
    expect(mocks.signInWithPassword).not.toHaveBeenCalled();
  });
  it('reports invalid credentials without leaking provider details', async () => {
    mocks.signInWithPassword.mockResolvedValue({ error: { message: 'internal provider detail' } });
    expect(await signIn({ error: null }, credentials())).toEqual({ error: 'Could not sign in. Check your email and password, then try again.' });
  });
  it('redirects only after successful sign-in and preserves password whitespace', async () => {
    mocks.signInWithPassword.mockResolvedValue({ error: null });
    await expect(signIn({ error: null }, credentials(' owner@example.com ', '  secret  '))).rejects.toThrow('REDIRECT:/');
    expect(mocks.signInWithPassword).toHaveBeenCalledWith({ email: 'owner@example.com', password: '  secret  ' });
  });
  it('returns a recoverable connection error', async () => {
    mocks.signInWithPassword.mockRejectedValue(new Error('network offline'));
    expect((await signIn({ error: null }, credentials())).error).toMatch(/reach Supabase/);
  });
  it('handles missing configuration without a network call', async () => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', '');
    expect((await signIn({ error: null }, credentials())).error).toMatch(/setup/);
    expect(mocks.signInWithPassword).not.toHaveBeenCalled();
  });
  it('redirects on successful sign-out and reports failed sign-out', async () => {
    mocks.signOut.mockResolvedValue({ error: { message: 'offline' } });
    expect((await signOut()).error).toBeTruthy();
    mocks.signOut.mockResolvedValue({ error: null });
    await expect(signOut()).rejects.toThrow('REDIRECT:/login');
  });
});
