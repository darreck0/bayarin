# Supabase → GitHub → Vercel → live

## 1. Supabase

1. Create a dedicated Supabase Free project and wait for provisioning.
2. In **Authentication → Users → Add user → Create new user**, manually create your sole email/password account. Ensure its email is confirmed (use auto-confirm if offered). Keep passwords out of SQL and Git.
3. In Authentication configuration, turn **Allow new users to sign up** **off**. Keep email/password enabled; leave anonymous and social sign-in disabled. This is a separate Dashboard setting, not part of SQL. [Official configuration guide](https://supabase.com/docs/guides/auth/general-configuration).
4. In **SQL Editor**, run [`supabase/migrations/202610310001_bayarin.sql`](supabase/migrations/202610310001_bayarin.sql) **once**. With zero or multiple Auth users, setup fails and rolls back; correct account setup before retrying. After success, do not rerun it.
5. Run [`supabase/tests/verify.sql`](supabase/tests/verify.sql). Initially the three seed checks should be `true`, both `rowsecurity` values `true`, and notices should confirm anonymous access is denied.
6. Copy the project URL and **publishable** key from **Connect** or API settings into `.env.local`, following the README. Do not use a service-role/secret key.
7. Set the Auth **Site URL** to `http://localhost:3000` for local development. Password login needs no email callback route.

The SQL Editor normally bypasses RLS. The verification script explicitly checks the anonymous role. `npm run test:db` also checks owner/other-user isolation in disposable PostgreSQL; it creates no real extra Supabase accounts.

## 2. Check locally

Run `npm ci`, configure `.env.local`, then run `npm test`, `npm run typecheck`, `npm run lint`, and `npm run build` individually. Start with `npm run dev`, or `npm run start` after building.

- Signed-out `/` opens login; an incorrect password shows an error. Correct login survives a reload. Sign-out blocks access to bills.
- `/?month=2026-11` shows Total ₱9,802.00, Paid ₱0.00, Remaining ₱9,802.00.
- Mark ATOME paid: Paid ₱1,671.00, Remaining ₱8,131.00, about 17% progress. Reload to verify persistence; toggle back afterward.
- December shows the three recurring bills with independent unpaid statuses. October has no seed bills.
- Create a disposable one-time bill; confirm it appears in only that month. Edit and delete it through the confirmation dialog. Check a recurring bill in later months too.
- Check day 31 in February/November, due-today unpaid status, older unpaid bills in red, a phone viewport, keyboard/modal behavior, and both themes.

If connectivity fails during creation, refresh before retrying: a write whose result was not confirmed may already have reached the database.

## 3. GitHub

The app's public source repository is [darreck0/bayarin](https://github.com/darreck0/bayarin). To work from another laptop:

```sh
git clone https://github.com/darreck0/bayarin.git
cd bayarin
npm ci
```

Configure `.env.local` as described in the README. To upload later source changes from a checkout:

```sh
git add .
git commit -m "Update Bayarin"
git push origin main
```

Include `package-lock.json`; exclude `.env.local`, `.next`, and `node_modules`. The downloadable source archive has no Git metadata. GitHub stores the app code; it does not host your Supabase database or replace Vercel hosting.

## 4. Vercel

1. **Add New → Project**, import the repository, select **Next.js**, and use **Node.js 24.x**.
2. Use the project root. If you pushed the larger parent workspace, select `outputs/bayarin` as Root Directory.
3. Add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` to Production environment variables. Preview is optional; previews using the same Supabase project share real data.
4. Keep the framework-managed defaults and `npm run build`; deploy on Hobby.
5. Set the Supabase Auth Site URL to your returned Vercel HTTPS URL. If keeping local development, add `http://localhost:3000` as an allowed development redirect URL.
6. Repeat login/reload, month navigation, disposable bill CRUD, and sign-out on the live URL. Keep public Supabase signups disabled.

Pushes to `main` redeploy automatically. Redeploy after changing environment variables. The live login page is reachable at the deployment URL; bill data requires authentication. [Official Next.js deployment guide](https://vercel.com/docs/frameworks/full-stack/nextjs).
