# Bayarin

A private monthly bills tracker using Next.js App Router, TypeScript, Tailwind CSS, shadcn/ui, Supabase Auth/Postgres, and `@supabase/ssr`.

## Run locally

Requires **Node.js 24.x** and npm. Follow [DEPLOY.md](DEPLOY.md) to create your Supabase project and sole account first.

```powershell
npm ci
Copy-Item .env.example .env.local
```

Edit `.env.local` with your project URL and **publishable** API key:

```dotenv
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-supabase-publishable-key
```

```powershell
npm run dev
```

Open [localhost:3000](http://localhost:3000). Without configuration, the login screen explains setup and disables sign-in. Restart the server after changing environment values. Never use a service-role/secret key here. `.env.local` is ignored by Git; `.env.example` is included.

## Verify before deploying

Run each command individually and fix failures before advancing:

```powershell
npm test
npm run typecheck
npm run lint
npm run build
```

After a successful build, `npm run start` runs the production server. Stop the dev server first if using the same port. See [CHECKS.md](CHECKS.md) for completed checks and remaining live verification.

## Behavior

- **Months:** `/?month=YYYY-MM`; defaults to the current Manila month. Invalid parameters redirect to the default view. Navigation supports years 1000–9999.
- **Recurrence:** bills appear from `start_month` onward without cron jobs or monthly copies. One-time bills appear only in their start month. New bills start in the selected month.
- **Payments:** a missing row means unpaid. Each toggle upserts explicit paid/unpaid status for one `(bill_id, month)`. Marking paid sets `paid_at`; unpaid clears it. Each month's status is independent.
- **Overdue:** unpaid with a due date before today in `Asia/Manila`. Due today stays unpaid. Days 29–31 clamp to the last valid day. The open app checks for date rollover and updates after returning to the tab.
- **Money:** `numeric(12,2)` in Postgres; integer centavos for validation and totals. Progress measures amount paid / total. Empty months show zero totals and 0%.
- **Edits:** name, amount, due day, and recurrence apply across applicable months. Start month stays fixed. Turning recurrence off leaves the bill only in its original start month.
- **Delete:** confirmation removes every occurrence and cascades to all payment history. Historical values are not snapshotted.
- **Access:** protected reads/actions verify Auth. RLS checks ownership for reads and writes on both tables. A composite foreign key prevents a payment from referencing another owner's bill. Proxy refreshes cookies and sets private/no-store cache headers.
- **Theme:** follows the system initially; the toggle persists light/dark preference in this browser.

Debts are monthly obligations in this version. Interest, balances, installments, partial payments, reminders, and public registration are outside scope.

## Seed

| Bill | Amount | Due day | Start | Recurring |
| --- | ---: | ---: | --- | --- |
| ATOME | ₱1,671.00 | 1 | November 2026 | Yes |
| MARIBANK | ₱4,354.00 | 1 | November 2026 | Yes |
| SLOAN | ₱3,777.00 | 1 | November 2026 | Yes |
| **Total** | **₱9,802.00** | | | |

November starts unpaid. After signing in, visit `/?month=2026-11`. The migration requires exactly one existing Auth user and resolves its ID automatically, without embedding a password or personal email.

## Folder structure

```text
bayarin/
├── src/
│   ├── app/
│   │   ├── login/            # Login page; sign-in/sign-out actions
│   │   ├── actions.ts        # Bill CRUD and payment actions
│   │   ├── page.tsx          # Protected month dashboard
│   │   ├── layout.tsx        # Metadata and theme provider
│   │   ├── loading.tsx       # Loading skeleton
│   │   ├── error.tsx         # Recoverable error page
│   │   ├── globals.css       # Tailwind and light/dark tokens
│   │   └── icon.svg
│   ├── components/
│   │   ├── ui/              # Generated shadcn/ui components
│   │   ├── dashboard.tsx
│   │   ├── bill-row.tsx
│   │   ├── bill-form.tsx
│   │   ├── delete-bill-dialog.tsx
│   │   ├── summary-card.tsx
│   │   ├── month-switcher.tsx
│   │   └── ...              # Header, brand, login, theme
│   ├── lib/
│   │   ├── supabase/        # Cookie-aware server/browser clients
│   │   ├── database.types.ts
│   │   ├── load-bills.ts
│   │   ├── bills.ts         # Recurrence, status, totals, sorting
│   │   ├── calendar.ts
│   │   ├── money.ts
│   │   └── ...              # Validation and small shared helpers
│   └── proxy.ts             # Auth cookie refresh and early redirects
├── supabase/
│   ├── migrations/202610310001_bayarin.sql
│   └── tests/verify.sql
├── tests/                   # Database, auth, actions, logic, render
├── .env.example
├── components.json
├── package.json
├── package-lock.json
├── vitest.config.ts
├── CHECKS.md
├── DEPLOY.md
└── README.md
```

The project `.npmrc` clears an inherited global CLI-only `allow-scripts` setting that otherwise breaks npm project installs. Your global npm configuration is unchanged.
