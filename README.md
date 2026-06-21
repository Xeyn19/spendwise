# SpendWise

SpendWise is a Next.js 16 personal finance application with:

- a marketing website
- Supabase authentication
- a protected dashboard
- persisted income, budget, and expense tracking
- persisted savings goals and entries
- reporting features that are still being completed

## Current Status

### Implemented

- marketing pages
- contact page
- registration and login
- email confirmation flow
- protected dashboard access
- Supabase profile storage
- income CRUD flow used by the dashboard
- budget CRUD flow used by the dashboard
- expense create/delete flow used by the dashboard
- savings goal create/delete flow used by the dashboard
- savings contribution/withdrawal flow used by the dashboard
- budget-to-income validation
- expense-to-budget derived matching

### Not fully completed yet

- fully unified transactions data source
- fully server-driven reporting
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
| Notifications | Sonner |

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

- [app/dashboard/page.tsx](/E:/my-codes/spendwise/app/dashboard/page.tsx:1)
- [app/dashboard/actions.ts](/E:/my-codes/spendwise/app/dashboard/actions.ts:1)
- [components/spendwise-dashboard.tsx](/E:/my-codes/spendwise/components/spendwise-dashboard.tsx:1)
- [app/(auth)/actions.ts](/E:/my-codes/spendwise/app/(auth)/actions.ts:1)
- [lib/supabase/server.ts](/E:/my-codes/spendwise/lib/supabase/server.ts:1)
- [docs/PROJECT_ARCHITECTURE.md](/E:/my-codes/spendwise/docs/PROJECT_ARCHITECTURE.md:1)
- [docs/supabase.md](/E:/my-codes/spendwise/docs/supabase.md:1)
- [docs/supabase_sql.md](/E:/my-codes/spendwise/docs/supabase_sql.md:1)

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

## Local Development

## 1. Install dependencies

```bash
npm install
```

## 2. Configure environment variables

Create or update [`.env.local`](/E:/my-codes/spendwise/.env.local:1):

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

- [docs/supabase.md](/E:/my-codes/spendwise/docs/supabase.md:1)

Then run the SQL from:

- [docs/supabase_sql.md](/E:/my-codes/spendwise/docs/supabase_sql.md:1)

Recommended order:

1. profiles
2. incomes
3. budgets
4. expenses

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
```

## Current Routes

| Route | Purpose |
| --- | --- |
| `/` | Landing page |
| `/contact` | Contact page |
| `/login` | Login |
| `/register` | Register |
| `/auth/confirm` | Email confirmation page |
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

## Documentation

Project docs:

- [docs/PROJECT_ARCHITECTURE.md](/E:/my-codes/spendwise/docs/PROJECT_ARCHITECTURE.md:1)
- [docs/supabase.md](/E:/my-codes/spendwise/docs/supabase.md:1)
- [docs/supabase_sql.md](/E:/my-codes/spendwise/docs/supabase_sql.md:1)
- [docs/flowchart.md](/E:/my-codes/spendwise/docs/flowchart.md:1)

## Deployment Notes

For Vercel deployment:

- add the same public Supabase environment variables in Vercel
- add your production domain in Supabase redirect URLs
- update the Supabase confirm-signup email template to use:

```txt
{{ .RedirectTo }}/auth/confirm?token_hash={{ .TokenHash }}&type=email
```

## Next Recommended Work

1. Unify transactions on the server
2. Move reports fully to persisted data
3. Add edit/delete support for individual savings entries
4. Split dashboard subviews into route-level pages if needed
