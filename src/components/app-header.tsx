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
  return <header className="border-b border-border/80 bg-card/80">
    <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5 sm:px-8 lg:px-10">
      <Brand />
      <div className="flex items-center gap-2"><span className="mr-3 hidden rounded-full bg-muted px-4 py-2 text-xs font-medium text-muted-foreground sm:block">Your personal dashboard</span><ThemeToggle /><form action={action}><Button type="submit" variant="ghost" size="icon" aria-label="Sign out" disabled={pending}>{pending ? <LoaderCircle className="size-4 animate-spin" /> : <LogOut className="size-4" />}</Button></form></div>
    </div>
    {state.error && <p role="alert" className="mx-auto max-w-7xl px-5 pb-3 text-sm text-destructive sm:px-8 lg:px-10">{state.error}</p>}
  </header>;
}
