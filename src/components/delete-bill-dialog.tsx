'use client';

import { useState, useTransition } from 'react';
import { LoaderCircle } from 'lucide-react';
import { deleteBill } from '@/app/actions';
import type { Bill } from '@/lib/database.types';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

export function DeleteBillDialog({ bill, onClose }: { bill: Bill; onClose: () => void }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  return <AlertDialog open onOpenChange={open => { if (!open && !pending) onClose(); }}>
    <AlertDialogContent className="rounded-2xl" onCloseAutoFocus={event => { event.preventDefault(); document.getElementById(`bill-menu-${bill.id}`)?.focus(); }}>
      <AlertDialogHeader><AlertDialogTitle>Delete {bill.name}?</AlertDialogTitle><AlertDialogDescription>This removes the bill from every month and deletes all its payment history. This cannot be undone.</AlertDialogDescription></AlertDialogHeader>
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      <AlertDialogFooter><AlertDialogCancel disabled={pending}>Keep bill</AlertDialogCancel><AlertDialogAction variant="destructive" disabled={pending} onClick={event => {
        event.preventDefault(); setError(null);
        startTransition(async () => {
          try { const result = await deleteBill(bill.id); if (result.error) setError(result.error); else onClose(); }
          catch { setError('Could not delete this bill. Please try again.'); }
        });
      }}>{pending && <LoaderCircle className="size-4 animate-spin" />}{pending ? 'Deleting…' : 'Delete bill'}</AlertDialogAction></AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>;
}
