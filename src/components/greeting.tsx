'use client';

import { useState, useTransition, type FormEvent } from 'react';
import { LoaderCircle, Pencil } from 'lucide-react';
import { saveDisplayName } from '@/app/profile-actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

export function Greeting({ displayName }: { displayName: string }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(displayName);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setError(null);
    startTransition(async () => {
      try {
        const result = await saveDisplayName(form);
        if (result.error) setError(result.error); else setOpen(false);
      } catch { setError('Could not save your name. Please try again.'); }
    });
  }

  return <Dialog open={open} onOpenChange={nextOpen => {
    if (pending) return;
    if (nextOpen) { setName(displayName); setError(null); }
    setOpen(nextOpen);
  }}>
    <div className="mb-3 flex max-w-full flex-wrap items-center gap-2">
      <p className="min-w-0 text-base font-medium break-words text-primary sm:text-lg">{displayName ? `Hello, ${displayName}!` : 'Hello!'}</p>
      <DialogTrigger asChild>
        <Button type="button" variant="ghost" size={displayName ? 'icon-sm' : 'sm'} className="shrink-0 rounded-full text-muted-foreground" aria-label={displayName ? 'Edit your name' : 'Add your name'} title={displayName ? 'Edit your name' : 'Add your name'}>
          <Pencil className="size-3.5" aria-hidden="true" />{!displayName && <span>Add your name</span>}
        </Button>
      </DialogTrigger>
    </div>
    <DialogContent className="rounded-2xl" showCloseButton={!pending}>
      <DialogHeader>
        <DialogTitle>What should we call you?</DialogTitle>
        <DialogDescription>Choose the name you want to see in your greeting.</DialogDescription>
      </DialogHeader>
      <form onSubmit={submit} className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="display-name">Your name</Label>
          <Input id="display-name" name="display_name" placeholder="e.g. Alex" autoComplete="nickname" value={name} onChange={event => setName(event.target.value)} minLength={1} maxLength={60} required disabled={pending} aria-describedby={error ? 'display-name-error' : undefined} aria-invalid={!!error} />
        </div>
        {error && <p id="display-name-error" role="alert" className="text-sm text-destructive">{error}</p>}
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" disabled={pending} onClick={() => setOpen(false)}>Cancel</Button>
          <Button type="submit" disabled={pending}>{pending && <LoaderCircle className="size-4 animate-spin" />}{pending ? 'Saving…' : 'Save name'}</Button>
        </div>
      </form>
    </DialogContent>
  </Dialog>;
}
