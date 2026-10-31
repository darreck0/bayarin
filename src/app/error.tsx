'use client';

import Link from 'next/link';
import { AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <main className="mx-auto flex min-h-svh max-w-sm flex-col items-center justify-center px-5 text-center"><AlertCircle className="mb-4 size-8 text-destructive" aria-hidden="true" /><h1 className="text-xl font-semibold">Couldn’t load your bills.</h1><p className="mt-3 text-sm leading-6 text-muted-foreground">Check your connection and try again. If this is your first visit, make sure the Supabase setup in the README is complete.</p><div className="mt-6 flex gap-2"><Button onClick={reset}>Try again</Button><Button asChild variant="outline"><Link href="/login">Back to login</Link></Button></div></main>;
}
