import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import type { Database } from '@/lib/database.types';
import { getSupabaseConfig } from '@/lib/env';

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });
  response.headers.set('Cache-Control', 'private, no-store');
  function redirectToLogin() {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.search = '';
    const redirected = NextResponse.redirect(url);
    response.cookies.getAll().forEach(cookie => redirected.cookies.set(cookie));
    redirected.headers.set('Cache-Control', 'private, no-store');
    return redirected;
  }
  const config = getSupabaseConfig();
  if (!config) return request.nextUrl.pathname === '/login' ? response : redirectToLogin();

  const supabase = createServerClient<Database>(config.url, config.key, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll(cookiesToSet, headers) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        Object.entries(headers).forEach(([key, value]) => response.headers.set(key, value));
        response.headers.set('Cache-Control', 'private, no-store');
      },
    },
  });

  const { data, error } = await supabase.auth.getClaims();
  if ((!data?.claims || error) && request.nextUrl.pathname !== '/login') {
    return redirectToLogin();
  }
  return response;
}

export const config = { matcher: ['/', '/login'] };
