import { Brand } from '@/components/brand';
import { Skeleton } from '@/components/ui/skeleton';

export default function Loading() {
  return <div role="status" aria-label="Loading bills" className="mx-auto max-w-7xl px-5 py-5 sm:px-8 lg:px-10"><Brand /><div className="mt-12 space-y-8"><Skeleton className="h-10 w-3/4 max-w-xl" /><div className="grid gap-8 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] lg:gap-10"><div className="space-y-5"><Skeleton className="h-16 w-full rounded-2xl" /><Skeleton className="h-80 w-full rounded-3xl" /></div><div className="space-y-4">{[1, 2, 3].map(id => <Skeleton key={id} className="h-24 w-full rounded-2xl" />)}</div></div></div><span className="sr-only">Loading your bills…</span></div>;
}
