-- Run once in a new Supabase project AFTER manually creating your sole Auth user.
-- Auth signup settings are configured in the Dashboard, not by this migration.
begin;

create table public.bills (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (char_length(btrim(name)) between 1 and 100),
  amount numeric(12,2) not null check (amount > 0 and amount <> 'NaN'::numeric),
  due_day integer not null check (due_day between 1 and 31),
  is_recurring boolean not null default false,
  start_month date not null check (extract(day from start_month) = 1),
  created_at timestamptz not null default now(),
  unique (id, user_id)
);

create table public.bill_payments (
  id uuid primary key default gen_random_uuid(),
  bill_id uuid not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  month date not null check (extract(day from month) = 1),
  status text not null default 'unpaid' check (status in ('unpaid', 'paid')),
  paid_at timestamptz,
  unique (bill_id, month),
  foreign key (bill_id, user_id) references public.bills(id, user_id) on delete cascade,
  check ((status = 'paid' and paid_at is not null) or (status = 'unpaid' and paid_at is null))
);

create index bills_user_month_idx on public.bills(user_id, start_month);
create index bill_payments_user_month_idx on public.bill_payments(user_id, month);

alter table public.bills enable row level security;
alter table public.bill_payments enable row level security;

-- Explicit grants avoid relying on project-specific default privileges.
revoke all on public.bills, public.bill_payments from anon;
grant select, insert, update, delete on public.bills, public.bill_payments to authenticated;

create policy bills_owner on public.bills for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy bill_payments_owner on public.bill_payments for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

-- Resolve the sole user without putting passwords or a personal email in SQL.
do $$
declare
  owner_id uuid;
begin
  if (select count(*) from auth.users) <> 1 then
    raise exception 'Bayarin setup requires exactly one Auth user. Create your account in Authentication > Users, then run this migration again.';
  end if;
  select id into owner_id from auth.users limit 1;

  insert into public.bills (id, user_id, name, amount, due_day, is_recurring, start_month)
  values
    ('b0000000-0000-4000-8000-000000000001', owner_id, 'ATOME', 1671.00, 1, true, '2026-11-01'),
    ('b0000000-0000-4000-8000-000000000002', owner_id, 'MARIBANK', 4354.00, 1, true, '2026-11-01'),
    ('b0000000-0000-4000-8000-000000000003', owner_id, 'SLOAN', 3777.00, 1, true, '2026-11-01');

  insert into public.bill_payments (bill_id, user_id, month, status)
    select id, user_id, '2026-11-01', 'unpaid' from public.bills where user_id = owner_id;
end;
$$;

commit;
