import { Wallet } from 'lucide-react';

export function Brand() {
  return <div className="flex items-center gap-2.5"><span className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground"><Wallet className="size-5" aria-hidden="true" /></span><span className="text-xl font-bold tracking-tight">bayarin<span className="text-primary">.</span></span></div>;
}
