import { Wallet } from 'lucide-react';

export function Brand() {
  return <div className="flex items-center gap-3"><span className="flex size-10 items-center justify-center rounded-[14px] border border-orange-300 bg-linear-to-br from-orange-400 to-orange-600 text-white shadow-[inset_0_1px_1px_#ffffff90,0_3px_8px_#e9701920]"><Wallet className="size-5" aria-hidden="true" /></span><span className="text-2xl font-bold tracking-tight">bayarin<span className="text-primary">.</span></span></div>;
}
