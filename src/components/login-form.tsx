'use client';

import { useActionState } from 'react';
import { ArrowRight, LoaderCircle } from 'lucide-react';
import { signIn } from '@/app/login/actions';
import { initialActionState } from '@/lib/action-state';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export function LoginForm({ configured }: { configured: boolean }) {
  const [state, action, pending] = useActionState(signIn, initialActionState);
  return <form action={action} className="space-y-5">
    <div className="space-y-2"><Label htmlFor="email">Email address</Label><Input id="email" name="email" type="email" placeholder="you@example.com" autoComplete="username" required maxLength={254} disabled={!configured || pending} /></div>
    <div className="space-y-2"><Label htmlFor="password">Password</Label><Input id="password" name="password" type="password" autoComplete="current-password" required maxLength={1024} disabled={!configured || pending} /></div>
    {state.error && <p role="alert" className="text-sm text-destructive">{state.error}</p>}
    <Button type="submit" className="h-11 w-full" disabled={!configured || pending}>{pending ? <><LoaderCircle className="size-4 animate-spin" />Signing in…</> : <>Sign in<ArrowRight className="size-4" /></>}</Button>
  </form>;
}
