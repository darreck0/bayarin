import { redirect } from 'next/navigation';
import { LockKeyhole } from 'lucide-react';
import { Brand } from '@/components/brand';
import { LoginForm } from '@/components/login-form';
import { ThemeToggle } from '@/components/theme-toggle';
import { getSupabaseConfig } from '@/lib/env';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export default async function LoginPage() {
  const configured = !!getSupabaseConfig();
  if (configured) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) redirect('/');
  }
  return <div className="mx-auto flex min-h-svh w-full max-w-5xl flex-col px-5 sm:px-8">
    <header className="flex items-center justify-between py-6"><Brand /><ThemeToggle /></header>
    <main className="flex flex-1 items-center justify-center py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8"><p className="eyebrow mb-3">A LITTLE CLARITY, EVERY MONTH</p><h1 className="text-4xl font-semibold tracking-tight">Welcome back.</h1><p className="mt-3 text-sm leading-6 text-muted-foreground">Your bills, a little more under control.<br />Sign in to pick up where you left off.</p></div>
        {!configured && <div role="status" className="mb-6 rounded-xl border border-amber-300/60 bg-amber-50 p-4 text-sm leading-6 text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200"><strong>One quick setup step.</strong><br />Add your Supabase URL and publishable key to <code>.env.local</code>, then restart the app. The README walks you through it.</div>}
        <LoginForm configured={configured} />
        <p className="mt-6 flex items-center justify-center gap-2 text-xs text-muted-foreground"><LockKeyhole className="size-3.5" aria-hidden="true" />A private space. Just for you.</p>
      </div>
    </main>
    <footer className="pb-6 text-center text-xs text-muted-foreground">One month at a time.</footer>
  </div>;
}
