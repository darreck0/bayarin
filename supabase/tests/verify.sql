-- Read-only checks. Run in the Supabase SQL editor immediately after setup.
-- RLS isolation and write/constraint tests run against disposable Postgres via npm test.
select name, amount, due_day, is_recurring, start_month from public.bills order by name;
select count(*) = 3 as three_seed_bills, sum(amount) = 9802.00 as correct_seed_total
from public.bills;
select count(*) = 3 as three_unpaid_november_payments
from public.bill_payments where month = '2026-11-01' and status = 'unpaid' and paid_at is null;
select tablename, rowsecurity from pg_tables
where schemaname = 'public' and tablename in ('bills', 'bill_payments');
select tablename, policyname, roles, cmd, qual, with_check from pg_policies
where schemaname = 'public' and tablename in ('bills', 'bill_payments');

-- Simulate an anonymous API role; table access must be denied.
begin;
set local role anon;
do $$
begin
  begin
    perform * from public.bills;
    raise exception 'FAIL: anon can read bills';
  exception when insufficient_privilege then
    raise notice 'PASS: anonymous bill access denied';
  end;
  begin
    perform * from public.bill_payments;
    raise exception 'FAIL: anon can read bill_payments';
  exception when insufficient_privilege then
    raise notice 'PASS: anonymous payment access denied';
  end;
end $$;
rollback;
