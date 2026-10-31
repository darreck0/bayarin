'use client';

import { useActionState } from 'react';
import { LogOut, LoaderCircle } from 'lucide-react';
import { Brand } from '@/components/brand';
import { ThemeToggle } from '@/components/theme-toggle';
import { Button } from '@/components/ui/button';
import { signOut } from '@/app/login/actions';
import { initialActionState } from '@/lib/action-state';

export function AppHeader() {
  const [state, action, pending] = useActionState(signOut, initialActionState);
  return <header className="border-b border-border/70">
    <div className="mx-auto flex max-w-3xl items-center justify-between px-5 py-5 sm:px-8">
      <Brand />
      <div className="flex items-center gap-1"><ThemeToggle /><form action={action}><Button type="submit" variant="ghost" size="icon" aria-label="Sign out" disabled={pending}>{pending ? <LoaderCircle className="size-4 animate-spin" /> : <LogOut className="size-4" />}</Button></form></div>
    </div>
    {state.error && <p role="alert" className="mx-auto max-w-3xl px-5 pb-3 text-sm text-destructive">{state.error}</p>}
  </header>;
}
