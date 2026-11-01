export type Bill = {
  id: string; user_id: string; name: string; amount: number; due_day: number;
  is_recurring: boolean; start_month: string; created_at: string;
};
export type PaymentStatus = 'unpaid' | 'paid';
export type BillPayment = {
  id: string; bill_id: string; user_id: string; month: string;
  status: PaymentStatus; paid_at: string | null;
};

type BillInsert = Omit<Bill, 'id' | 'created_at'> & { id?: string; created_at?: string };
type PaymentInsert = Omit<BillPayment, 'id' | 'paid_at' | 'status'> & {
  id?: string; status?: PaymentStatus; paid_at?: string | null;
};
export type Database = {
  public: {
    Tables: {
      bills: { Row: Bill; Insert: BillInsert; Update: Partial<BillInsert>; Relationships: [] };
      bill_payments: { Row: BillPayment; Insert: PaymentInsert; Update: Partial<PaymentInsert>; Relationships: [] };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
