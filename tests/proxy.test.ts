import { NextRequest } from 'next/server';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { proxy } from '../src/proxy';

const auth = vi.hoisted(() => ({ claims: null as null | { sub: string }, refresh: false }));
vi.mock('@supabase/ssr', () => ({
  createServerClient: (_url: string, _key: string, options: { cookies: { setAll: (cookies: { name: string; value: string; options: { path: string } }[], headers: Record<string, string>) => void } }) => ({
    auth: { getClaims: async () => {
      if (auth.refresh) options.cookies.setAll([{ name: 'sb-test-token', value: 'refreshed', options: { path: '/' } }], { 'Cache-Control': 'private, no-store', Pragma: 'no-cache' });
      return { data: { claims: auth.claims }, error: null };
    } },
  }),
}));
beforeEach(() => {
  vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://example.supabase.co');
  vi.stubEnv('NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY', 'sb_publishable_test');
  auth.claims = null; auth.refresh = false;
});
afterEach(() => vi.unstubAllEnvs());

it('redirects signed-out or expired sessions to login', async () => {
  const response = await proxy(new NextRequest('http://localhost/?month=2026-11'));
  expect(response.status).toBe(307);
  expect(response.headers.get('location')).toBe('http://localhost/login');
  expect(response.headers.get('Cache-Control')).toContain('no-store');
});
it('permits login while signed out', async () => {
  expect((await proxy(new NextRequest('http://localhost/login'))).status).toBe(200);
});
it('redirects an unconfigured dashboard before rendering while allowing setup on login', async () => {
  vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', '');
  expect((await proxy(new NextRequest('http://localhost/'))).status).toBe(307);
  expect((await proxy(new NextRequest('http://localhost/login'))).status).toBe(200);
});
it('carries refreshed cookies and cache headers to the browser', async () => {
  auth.claims = { sub: 'owner' }; auth.refresh = true;
  const request = new NextRequest('http://localhost/');
  const response = await proxy(request);
  expect(response.status).toBe(200);
  expect(response.cookies.get('sb-test-token')?.value).toBe('refreshed');
  expect(request.cookies.get('sb-test-token')?.value).toBe('refreshed');
  expect(response.headers.get('Pragma')).toBe('no-cache');
  expect(response.headers.get('Cache-Control')).toContain('no-store');
});
it('preserves cookie cleanup on a redirect', async () => {
  auth.refresh = true;
  const response = await proxy(new NextRequest('http://localhost/'));
  expect(response.status).toBe(307);
  expect(response.cookies.get('sb-test-token')?.value).toBe('refreshed');
});
