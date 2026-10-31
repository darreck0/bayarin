import { Brand } from '@/components/brand';
import { Skeleton } from '@/components/ui/skeleton';

export default function Loading() {
  return <div role="status" aria-label="Loading bills" className="mx-auto max-w-3xl px-5 py-5 sm:px-8"><Brand /><div className="mt-12 space-y-5"><Skeleton className="h-8 w-3/4" /><Skeleton className="h-14 w-full rounded-xl" /><Skeleton className="h-64 w-full rounded-2xl" />{[1, 2, 3].map(id => <Skeleton key={id} className="h-24 w-full rounded-xl" />)}</div><span className="sr-only">Loading your bills…</span></div>;
}
