import { z } from 'zod';
import { isMonthKey } from '@/lib/calendar';
import { amountToCents } from '@/lib/money';

export const billSchema = z.object({
  name: z.string().trim().min(1, 'Give this bill a name.').max(100, 'Keep the name under 101 characters.'),
  amount: z.string().trim().regex(/^\d{1,10}(\.\d{1,2})?$/, 'Enter a positive amount with at most two decimal places.').refine(value => {
    try { return amountToCents(value) > 0; } catch { return false; }
  }, 'Amount must be greater than zero.'),
  due_day: z.coerce.number().int('Use a whole day.').min(1, 'Due day must be 1–31.').max(31, 'Due day must be 1–31.'),
  is_recurring: z.boolean(),
  month: z.string().refine(isMonthKey, 'Choose a valid month.'),
});

export const paymentSchema = z.object({
  billId: z.uuid(), month: z.string().refine(isMonthKey), status: z.enum(['paid', 'unpaid']),
});
