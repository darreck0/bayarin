// Parse decimal text directly to centavos; avoid binary floating-point addition.
export function amountToCents(value: string | number): number {
  const text = String(value).trim();
  if (!/^\d{1,10}(\.\d{1,2})?$/.test(text)) throw new Error('Enter an amount with up to two decimal places.');
  const [whole, fraction = ''] = text.split('.');
  return Number(whole) * 100 + Number(fraction.padEnd(2, '0'));
}

export function centsToAmount(cents: number): string {
  if (!Number.isSafeInteger(cents) || cents < 0) throw new Error('Invalid amount');
  return `${Math.floor(cents / 100)}.${String(cents % 100).padStart(2, '0')}`;
}

export function formatMoney(cents: number): string {
  return new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(cents / 100);
}
