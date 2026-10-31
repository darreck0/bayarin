import { PGlite } from '@electric-sql/pglite';
import { readFileSync } from 'node:fs';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

const owner = 'a0000000-0000-4000-8000-000000000001';
const other = 'a0000000-0000-4000-8000-000000000002';
const bill = 'b0000000-0000-4000-8000-000000000001';
const migration = readFileSync(new URL('../supabase/migrations/202610310001_bayarin.sql', import.meta.url), 'utf8');
let db: PGlite;

async function asUser(user: string, sql: string) {
  await db.exec(`set role authenticated; select set_config('request.jwt.claim.sub', '${user}', false);`);
  try { return await db.query(sql); }
  finally { await db.exec('reset role;'); }
}

describe('migration on disposable PostgreSQL', () => {
  beforeAll(async () => {
    db = new PGlite();
    await db.exec(`
      create role anon nologin; create role authenticated nologin;
      create schema auth;
      create table auth.users (id uuid primary key);
      create function auth.uid() returns uuid language sql stable as
        $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
      grant usage on schema public, auth to anon, authenticated;
      grant execute on function auth.uid() to anon, authenticated;
      insert into auth.users values ('${owner}');
    `);
    await db.exec(migration);
    await db.exec(`insert into auth.users values ('${other}');`);
  }, 30000);
  afterAll(async () => { await db?.close(); });

  it('seeds three November recurring bills totaling 9802 and unpaid payments', async () => {
    const result = await asUser(owner, 'select count(*)::int as count, sum(amount)::text as total from bills');
    expect(result.rows).toEqual([{ count: 3, total: '9802.00' }]);
    expect((await asUser(owner, "select * from bill_payments where month = '2026-11-01' and status = 'unpaid' and paid_at is null")).rows).toHaveLength(3);
  });
  it('denies anonymous access on both tables', async () => {
    await db.exec('set role anon');
    try {
      await expect(db.query('select * from bills')).rejects.toThrow(/permission denied/);
      await expect(db.query('select * from bill_payments')).rejects.toThrow(/permission denied/);
    } finally { await db.exec('reset role'); }
  });
  it('hides both tables from another user and blocks mutations of owner rows', async () => {
    expect((await asUser(other, 'select * from bills')).rows).toHaveLength(0);
    expect((await asUser(other, 'select * from bill_payments')).rows).toHaveLength(0);
    expect((await asUser(other, `update bills set name='intruder' where id='${bill}' returning id`)).rows).toHaveLength(0);
    expect((await asUser(other, `delete from bills where id='${bill}' returning id`)).rows).toHaveLength(0);
    expect((await asUser(other, `update bill_payments set status='paid', paid_at=now() where bill_id='${bill}' returning id`)).rows).toHaveLength(0);
    expect((await asUser(other, `delete from bill_payments where bill_id='${bill}' returning id`)).rows).toHaveLength(0);
    await expect(asUser(other, `insert into bills(user_id,name,amount,due_day,start_month) values('${owner}','bad',1,1,'2026-11-01')`)).rejects.toThrow(/row-level security/);
    await expect(asUser(other, `insert into bill_payments(bill_id,user_id,month) values('${bill}','${owner}','2026-12-01')`)).rejects.toThrow(/row-level security/);
  });
  it('rejects ownership spoofing, including another user attaching their payment to an owner bill', async () => {
    await expect(asUser(owner, `update bills set user_id='${other}' where id='${bill}'`)).rejects.toThrow(/row-level security/);
    await expect(asUser(owner, `update bill_payments set user_id='${other}' where bill_id='${bill}'`)).rejects.toThrow(/row-level security/);
    await expect(asUser(other, `insert into bill_payments(bill_id,user_id,month) values('${bill}','${other}','2026-12-01')`)).rejects.toThrow(/foreign key/);
  });
  it('enforces money, due-day, month and status constraints', async () => {
    for (const [amount, day, month] of [['0', '1', '2026-11-01'], ["'NaN'", '1', '2026-11-01'], ['1', '32', '2026-11-01'], ['1', '1', '2026-11-02']]) {
      await expect(asUser(owner, `insert into bills(user_id,name,amount,due_day,start_month) values('${owner}','bad',${amount},${day},'${month}')`)).rejects.toThrow(/check constraint/);
    }
    await expect(asUser(owner, `insert into bill_payments(bill_id,user_id,month,status) values('${bill}','${owner}','2026-12-01','overdue')`)).rejects.toThrow(/check constraint/);
    await expect(asUser(owner, `insert into bill_payments(bill_id,user_id,month,status) values('${bill}','${owner}','2026-12-01','paid')`)).rejects.toThrow(/check constraint/);
    await expect(asUser(owner, `insert into bill_payments(bill_id,user_id,month) values('${bill}','${owner}','2026-12-02')`)).rejects.toThrow(/check constraint/);
  });
  it('allows owner CRUD, isolates month status, and upserts without duplicate payments', async () => {
    await asUser(owner, `insert into bill_payments(bill_id,user_id,month,status,paid_at) values('${bill}','${owner}','2026-12-01','paid',now()) on conflict(bill_id,month) do update set status=excluded.status,paid_at=excluded.paid_at`);
    expect((await asUser(owner, `select status from bill_payments where bill_id='${bill}' order by month`)).rows).toEqual([{ status: 'unpaid' }, { status: 'paid' }]);
    await asUser(owner, `insert into bill_payments(bill_id,user_id,month,status,paid_at) values('${bill}','${owner}','2026-12-01','unpaid',null) on conflict(bill_id,month) do update set status=excluded.status,paid_at=excluded.paid_at`);
    expect((await asUser(owner, `select * from bill_payments where bill_id='${bill}' and month='2026-12-01'`)).rows).toHaveLength(1);
    await expect(asUser(owner, `insert into bill_payments(bill_id,user_id,month) values('${bill}','${owner}','2026-11-01')`)).rejects.toThrow(/unique constraint/);
    const added = await asUser(owner, `insert into bills(user_id,name,amount,due_day,start_month) values('${owner}','Disposable',100,31,'2026-11-01') returning id`);
    const id = (added.rows[0] as { id: string }).id;
    await asUser(owner, `update bills set amount=200 where id='${id}'`);
    await asUser(owner, `insert into bill_payments(bill_id,user_id,month) values('${id}','${owner}','2026-11-01')`);
    await asUser(owner, `delete from bills where id='${id}'`);
    expect((await asUser(owner, `select * from bill_payments where bill_id='${id}'`)).rows).toHaveLength(0);
  });
});

it('aborts setup transaction when no sole account exists', async () => {
  const empty = new PGlite();
  try {
    await empty.exec(`create role anon; create role authenticated; create schema auth; create table auth.users(id uuid primary key); create function auth.uid() returns uuid language sql as $$ select null::uuid $$;`);
    await expect(empty.exec(migration)).rejects.toThrow(/exactly one Auth user/);
    await empty.exec('rollback');
    expect((await empty.query("select to_regclass('public.bills') as name")).rows).toEqual([{ name: null }]);
    await empty.exec(`insert into auth.users values('${owner}'), ('${other}');`);
    await expect(empty.exec(migration)).rejects.toThrow(/exactly one Auth user/);
    await empty.exec('rollback');
  } finally { await empty.close(); }
}, 30000);
