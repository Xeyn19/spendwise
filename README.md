# SpendWise

SpendWise is a Next.js 16 personal finance application with:

- a marketing website
- Supabase authentication
- a protected dashboard
- persisted income, budget, and expense tracking
- persisted savings goals and entries
- backend-computed analytics and monthly reports
- client PDF export for reports

## Current Status

### Implemented

- marketing pages
- contact page
- registration and login
- email confirmation flow
- protected dashboard access
- Supabase profile storage
- income create/delete flow used by the dashboard
- budget CRUD flow used by the dashboard
- expense create/delete flow used by the dashboard
- savings goal create/delete flow used by the dashboard
- savings contribution/withdrawal flow used by the dashboard
- backend-computed analytics used by the dashboard
- backend-computed monthly reports used by the dashboard
- PDF export for the selected monthly report
- unified server transaction feed across income, expenses, and savings entries
- budget-to-income validation
- expense-to-budget derived matching
- server-side registration validation and sanitized public error messages
- application-wide browser security headers
- automated tests for auth validation and public error handling

### Not fully completed yet

- separate route-level dashboard pages

## Tech Stack

| Layer | Technology |
| --- | --- |
| Framework | Next.js 16 |
| UI | React 19 |
| Styling | Tailwind CSS 4 |
| Auth | Supabase Auth |
| Database | Supabase Postgres |
| Charts | Recharts |
| PDF export | jsPDF + jspdf-autotable |
| Notifications | Sonner |
| Tests | Vitest |

## Project Structure

```txt
app/
  (marketing)/
  (auth)/
  auth/
  dashboard/
components/
docs/
lib/
  supabase/
public/
```

Important files:

- [app/dashboard/page.tsx](app/dashboard/page.tsx)
- [app/dashboard/actions.ts](app/dashboard/actions.ts)
- [components/spendwise-dashboard.tsx](components/spendwise-dashboard.tsx)
- [lib/transactions.ts](lib/transactions.ts)
- [app/(auth)/actions.ts](<app/(auth)/actions.ts>)
- [lib/supabase/server.ts](lib/supabase/server.ts)
- [docs/PROJECT_ARCHITECTURE.md](docs/PROJECT_ARCHITECTURE.md)
- [docs/supabase.md](docs/supabase.md)
- [docs/supabase_sql.md](docs/supabase_sql.md)

## Finance Model

SpendWise currently uses this logic:

- `income` stores money received
- `budget` stores planned category allocations for a date range
- `expense` stores actual spending

Important behavior:

- expenses do not reduce stored income rows directly
- expenses do not rewrite stored budget allocations
- budget usage is derived from matching expense category + date range
- expenses without a matching budget are allowed and treated as unbudgeted
- expenses can exceed a budget and show an overspent state
- savings totals are derived from savings entries
- analytics and reports are live-computed from persisted finance rows

## Local Development

## 1. Install dependencies

```bash
npm install
```

## 2. Configure environment variables

Create or update `.env.local` using the placeholders in [`.env.example`](.env.example):

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-supabase-publishable-key
```

Legacy fallback:

```env
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

Optional server-only future use:

```env
SUPABASE_SECRET_KEY=your-supabase-secret-key
```

## 3. Configure Supabase

Read:

- [docs/supabase.md](docs/supabase.md)

Then run the SQL from:

- [docs/supabase_sql.md](docs/supabase_sql.md)

Recommended order:

1. profiles
2. incomes
3. budgets
4. expenses
5. savings goals and entries
6. unified finance transaction view
7. atomic savings-balance trigger

## 4. Start the app

```bash
npm run dev
```

Open:

- `http://localhost:3000`

## Scripts

```bash
npm run dev
npm run build
npm run start
npm run lint
npm test
```

## Current Routes

| Route | Purpose |
| --- | --- |
| `/` | Landing page |
| `/contact` | Contact page |
| `/login` | Login |
| `/register` | Register |
| `/auth/confirm` | Email confirmation page |
| `/auth/confirm/verify` | Email verification endpoint |
| `/auth/signout` | Sign out endpoint |
| `/dashboard` | Protected finance workspace |

## Dashboard Modules

Inside `/dashboard`, the current UI provides:

- Dashboard summary
- Income
- Budgets
- Expenses
- Savings
- Analytics
- Reports
- Settings

These are currently client-side sections inside one dashboard page, not separate routes.

## Data Persistence Status

| Module | Status |
| --- | --- |
| Profiles | Persisted |
| Incomes | Persisted |
| Budgets | Persisted |
| Expenses | Persisted |
| Savings goals | Persisted |
| Savings entries | Persisted |
| Recent transactions | Unified server view over persisted finance rows |
| Analytics | Backend-computed from persisted rows |
| Reports | Backend-computed from persisted rows |

## Validation Rules

### Income

- source is required
- amount must be greater than zero
- date is required

### Budget

- category is required
- icon is required
- amount must be greater than zero
- start and end dates are required
- end date must be on or after start date
- same category cannot overlap for the same user
- total same-period budgets cannot exceed same-period income

### Expense

- category is required
- amount must be greater than zero
- date is required
- unbudgeted expenses are allowed
- over-budget expenses are allowed

### Savings

- goal name and target amount are required
- target amounts and entry amounts must be greater than zero
- a date is required for each savings entry
- entries must be contributions or withdrawals
- withdrawals cannot make a savings goal balance negative

## Documentation

Project docs:

- [docs/PROJECT_ARCHITECTURE.md](docs/PROJECT_ARCHITECTURE.md)
- [docs/supabase.md](docs/supabase.md)
- [docs/supabase_sql.md](docs/supabase_sql.md)
- [docs/flowchart.md](docs/flowchart.md)

## Deployment Notes

For Vercel deployment:

- add the same public Supabase environment variables in Vercel
- add your production domain in Supabase redirect URLs
- update the Supabase confirm-signup email template to use:

```txt
{{ .RedirectTo }}/auth/confirm?token_hash={{ .TokenHash }}&type=email
```

## Next Recommended Work

1. Add edit/delete support for individual savings entries
2. Split dashboard subviews into route-level pages if needed
