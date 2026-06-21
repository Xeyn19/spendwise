# SpendWise Project Architecture

## 1. Overview

SpendWise is a Next.js 16 App Router application for personal finance tracking. The project combines:

- a public marketing site
- Supabase-backed authentication
- a protected dashboard workspace
- database-backed finance modules for incomes, budgets, expenses, and savings
- backend-computed analytics and monthly reports

The current architecture is intentionally hybrid:

- **implemented and persisted**
  - authentication
  - profile storage
  - incomes
  - budgets
  - expenses
  - savings goals
  - savings entries
- **implemented as derived views**
  - dashboard summaries
  - budget progress
  - recent transactions
  - analytics cards
  - monthly report view

## 2. Stack

| Layer | Technology |
| --- | --- |
| Framework | Next.js 16 App Router |
| Rendering | React 19 |
| Styling | Tailwind CSS 4 |
| UI primitives | shadcn-style local components + Radix primitives |
| Authentication | Supabase Auth |
| Database | Supabase Postgres |
| Server data writes | Next.js Server Actions |
| Charts | Recharts |
| PDF export | jsPDF + jspdf-autotable |
| Notifications | Sonner |

## 3. High-Level System Design

SpendWise is split into three major runtime areas:

1. **Marketing surface**
   - public landing page and contact page
   - no authentication required

2. **Auth surface**
   - register, login, confirm-email flow
   - session creation and protected redirects

3. **Dashboard surface**
   - authenticated-only finance workspace
   - all finance subpages currently live inside one `/dashboard` route as client-side views

At runtime, Supabase handles identity and row ownership, while the app handles:

- session-aware rendering
- server-side loading of protected finance data
- form validation
- mutation orchestration
- derived metrics and visualizations

## 4. Route Architecture

### Public routes

| Route | Purpose |
| --- | --- |
| `/` | Marketing landing page |
| `/contact` | Contact page |

### Auth routes

| Route | Purpose |
| --- | --- |
| `/login` | Sign in |
| `/register` | Sign up |
| `/auth/confirm` | Confirmation status page |
| `/auth/confirm/verify` | OTP verification endpoint |
| `/auth/signout` | Sign out route |

### Protected routes

| Route | Purpose |
| --- | --- |
| `/dashboard` | Authenticated finance workspace |

### Important routing note

The dashboard is a single filesystem route today. The sidebar pages are not independent route segments yet. These sections are rendered inside `components/spendwise-dashboard.tsx`:

- Dashboard
- Income
- Budgets
- Expenses
- Savings
- Analytics
- Reports
- Settings

This keeps the current implementation simple, but it also means:

- page state is local to the dashboard component
- there is no deep-linking per finance subpage yet
- server data for all current finance views is loaded through `/dashboard`

## 5. Authentication Architecture

### Authentication model

SpendWise uses Supabase Auth with email/password authentication.

The model is:

- `auth.users`
  - authentication identity
- `public.profiles`
  - app-facing profile data

### Auth request flow

#### Register

1. User submits the register form.
2. `app/(auth)/actions.ts` calls `supabase.auth.signUp`.
3. Signup metadata includes:
   - `first_name`
   - `last_name`
4. `emailRedirectTo` is derived from request headers so the correct base URL is used in local or deployed environments.
5. Supabase creates the auth user.
6. Database trigger inserts a matching `public.profiles` row.
7. Supabase sends a confirmation email.

#### Confirm email

1. User opens `/auth/confirm?...`.
2. The page renders the confirmation UI.
3. The client posts to `/auth/confirm/verify`.
4. The route handler calls `supabase.auth.verifyOtp`.
5. On success, session cookies are established and the user can continue to the dashboard.

#### Login

1. User submits the login form.
2. `loginAction` calls `supabase.auth.signInWithPassword`.
3. On success, the user is redirected to `/dashboard?login=success`.

### Session management

Session refresh and cookie synchronization are handled by:

- [proxy.ts](/E:/my-codes/spendwise/proxy.ts:1)
- [lib/supabase/proxy.ts](/E:/my-codes/spendwise/lib/supabase/proxy.ts:1)

This proxy layer:

- builds a Supabase server client per request
- reads incoming cookies
- writes updated auth cookies back to the response
- refreshes claims through `supabase.auth.getClaims()`

### Auth access control

- `app/(auth)/layout.tsx` redirects authenticated users away from `/login` and `/register`
- `app/dashboard/page.tsx` redirects unauthenticated users to `/login`
- all finance server actions verify auth claims before reading or mutating user data

## 6. Supabase Client Architecture

The app uses two primary Supabase client helpers.

### Browser client

File:

- [lib/supabase/client.ts](/E:/my-codes/spendwise/lib/supabase/client.ts:1)

Purpose:

- create a browser-safe Supabase client using the project URL and publishable key

### Server client

File:

- [lib/supabase/server.ts](/E:/my-codes/spendwise/lib/supabase/server.ts:1)

Purpose:

- create a request-bound server client using Next.js cookies
- support protected server rendering and server actions

### Shared config

File:

- [lib/supabase/config.ts](/E:/my-codes/spendwise/lib/supabase/config.ts:1)

Behavior:

- requires `NEXT_PUBLIC_SUPABASE_URL`
- accepts either:
  - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
  - or fallback `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## 7. Data Model

## 7.1 Current persisted tables

### `public.profiles`

Purpose:

- stores app-facing profile information

Columns:

| Column | Meaning |
| --- | --- |
| `id` | Same UUID as `auth.users.id` |
| `email` | User email |
| `first_name` | First name |
| `last_name` | Last name |
| `created_at` | Created timestamp |
| `updated_at` | Updated timestamp |

Security:

- RLS enabled
- users can select and update only their own row

### `public.incomes`

Purpose:

- stores one row per income event

Columns:

| Column | Meaning |
| --- | --- |
| `id` | Income UUID |
| `user_id` | Owner user |
| `source` | Free-text source |
| `amount` | Positive amount |
| `received_on` | Income date |
| `note` | Optional note |
| `created_at` | Created timestamp |
| `updated_at` | Updated timestamp |

Security:

- RLS enabled
- users can select, insert, update, and delete only their own rows

### `public.budgets`

Purpose:

- stores one budget allocation per category and date range

Columns:

| Column | Meaning |
| --- | --- |
| `id` | Budget UUID |
| `user_id` | Owner user |
| `category` | Free-text category |
| `category_key` | Generated normalized category |
| `icon` | Chosen display icon |
| `allocated_amount` | Planned budget amount |
| `period_start` | Range start |
| `period_end` | Range end |
| `created_at` | Created timestamp |
| `updated_at` | Updated timestamp |

Important constraints:

- `allocated_amount > 0`
- `period_end >= period_start`
- same user cannot create overlapping budgets for the same normalized category

### `public.expenses`

Purpose:

- stores one row per actual spend event

Columns:

| Column | Meaning |
| --- | --- |
| `id` | Expense UUID |
| `user_id` | Owner user |
| `category` | Free-text category |
| `category_key` | Generated normalized category |
| `amount` | Positive expense amount |
| `spent_on` | Expense date |
| `note` | Optional note |
| `created_at` | Created timestamp |
| `updated_at` | Updated timestamp |

Security:

- RLS enabled
- users can select, insert, update, and delete only their own rows

### `public.savings_goals`

Purpose:

- stores one row per savings target

Columns:

| Column | Meaning |
| --- | --- |
| `id` | Savings goal UUID |
| `user_id` | Owner user |
| `name` | Goal name |
| `target_amount` | Target amount |
| `created_at` | Created timestamp |
| `updated_at` | Updated timestamp |

Security:

- RLS enabled
- users can select, insert, update, and delete only their own rows

### `public.savings_entries`

Purpose:

- stores dated savings contributions and withdrawals

Columns:

| Column | Meaning |
| --- | --- |
| `id` | Savings entry UUID |
| `user_id` | Owner user |
| `goal_id` | Parent savings goal |
| `type` | `contribution` or `withdrawal` |
| `amount` | Positive entry amount |
| `entry_date` | Entry date |
| `note` | Optional note |
| `created_at` | Created timestamp |
| `updated_at` | Updated timestamp |

Security:

- RLS enabled
- users can manage only entries attached to their own goals

## 7.2 Shared database functions and triggers

### `public.set_updated_at()`

Purpose:

- updates `updated_at` before row updates

Attached to:

- `public.profiles`
- `public.incomes`
- `public.budgets`
- `public.expenses`
- `public.savings_goals`
- `public.savings_entries`

### `public.handle_new_user()`

Purpose:

- automatically inserts a matching profile after a new auth user is created

## 7.3 Indexing

| Object | Type | Reason |
| --- | --- | --- |
| `profiles.id` | Primary key | One profile per auth user |
| `profiles.email` | Unique | Prevent duplicate profile email values |
| `incomes.id` | Primary key | Unique income identity |
| `idx_incomes_user_received_on_desc` | Composite index | Fast newest-first income listing |
| `budgets.id` | Primary key | Unique budget identity |
| `idx_budgets_user_period_start_desc` | Composite index | Fast budget listing by newest period |
| `expenses.id` | Primary key | Unique expense identity |
| `idx_expenses_user_spent_on_desc` | Composite index | Fast newest-first expense listing |
| `idx_expenses_user_category_key_spent_on` | Composite index | Fast category/date-based expense matching |

## 8. Finance Domain Model

SpendWise currently follows a **budget-first** finance model.

### Core meanings

- **Income** = money received
- **Budget** = planned category allocation for a date range
- **Expense** = actual spending event

### Derived logic

The app does not decrement stored income or stored budget rows directly when expenses are created.

Instead:

- `total income` = sum of income rows
- `total expenses` = sum of expense rows
- `remaining balance` = income minus expenses minus net savings entries
- `budget spent` = sum of matching expenses
- `budget remaining` = `allocated_amount - matched expense total`

### Expense-to-budget matching

An expense matches a budget when:

- the normalized category is the same
- the expense date falls inside the budget period
- the rows belong to the same user

### Allowed states

The current implementation intentionally allows:

- expenses with no matching budget
- expenses that exceed a budget's remaining amount

Those are shown as:

- **unbudgeted**
- **over budget**

### Budget validation against income

When creating or updating a budget:

- the app loads overlapping budgets
- the app loads income rows in the selected period
- the new allocation is blocked if overlapping allocations exceed same-period income

### Income deletion protection

When deleting income:

- the app checks affected budget periods
- deletion is blocked if removing the income would leave budgets exceeding recorded income for those periods

## 9. Current Runtime Data Sources

| Module | Source of truth |
| --- | --- |
| Auth session | Supabase Auth |
| Profiles | `public.profiles` |
| Incomes | `public.incomes` |
| Budgets | `public.budgets` |
| Expenses | `public.expenses` |
| Savings goals | `public.savings_goals` |
| Savings entries | `public.savings_entries` |
| Recent transactions | Derived from incomes + expenses + savings entries |
| Analytics | Live backend computation from persisted finance tables |
| Reports | Live backend computation from persisted finance tables |

## 10. Dashboard Data Flow

### Initial dashboard load

1. Request hits `/dashboard`
2. Session is verified through Supabase claims
3. Profile is loaded from `public.profiles`
4. Incomes are loaded through `listUserIncomes()`
5. Budgets are loaded through `listUserBudgets()`
6. Expenses are loaded through `listUserExpenses()`
7. Savings goals and entries are loaded through `listUserSavings()`
8. Recent transactions are derived server-side from incomes, expenses, and savings entries
9. Analytics are computed server-side from persisted finance rows
10. Reports are computed server-side from persisted finance rows
11. Data is passed into `SpendWiseDashboard`
12. Client renders totals, chart datasets, and page-level views

### Server-side loaders

Files:

- [lib/incomes.ts](/E:/my-codes/spendwise/lib/incomes.ts:1)
- [lib/budgets.ts](/E:/my-codes/spendwise/lib/budgets.ts:1)
- [lib/expenses.ts](/E:/my-codes/spendwise/lib/expenses.ts:1)
- [lib/savings.ts](/E:/my-codes/spendwise/lib/savings.ts:1)
- [lib/analytics.ts](/E:/my-codes/spendwise/lib/analytics.ts:1)
- [lib/reports.ts](/E:/my-codes/spendwise/lib/reports.ts:1)

All loaders:

- are `server-only`
- read auth claims from Supabase
- return only the signed-in user’s rows
- order newest-first for UI use

## 11. Mutation Architecture

Finance mutations live in:

- [app/dashboard/actions.ts](/E:/my-codes/spendwise/app/dashboard/actions.ts:1)

### Income actions

- `createIncomeAction`
- `deleteIncomeAction`

### Budget actions

- `createBudgetAction`
- `updateBudgetAction`
- `deleteBudgetAction`

### Expense actions

- `createExpenseAction`
- `deleteExpenseAction`

### Savings actions

- `createSavingsGoalAction`
- `deleteSavingsGoalAction`
- `createSavingsEntryAction`

### Mutation behavior

All current finance server actions:

- verify the authenticated user
- validate incoming data
- scope every mutation by `user_id`
- sanitize Supabase errors before surfacing them
- call `revalidatePath("/dashboard")`

## 12. Client Dashboard Architecture

Primary file:

- [components/spendwise-dashboard.tsx](/E:/my-codes/spendwise/components/spendwise-dashboard.tsx:1)

This component is responsible for:

- sidebar navigation
- quick action modals
- optimistic/local state integration after successful server actions
- derived finance metrics
- charts and summary cards
- savings goal and entry UI

### Derived client calculations

The dashboard derives:

- budget spent and remaining values
- recent transactions

### Backend analytics calculations

Analytics is computed through [lib/analytics.ts](/E:/my-codes/spendwise/lib/analytics.ts:1)
and shared typed helpers in [lib/analytics-shared.ts](/E:/my-codes/spendwise/lib/analytics-shared.ts:1).
The analytics layer derives monthly trends, category breakdowns, savings rate,
budget efficiency, and budget variance from persisted finance rows. The Analytics
trend chart can regroup the same persisted data by daily, weekly, monthly, or
custom date-range filters.

### Backend report calculations

Reports are computed through [lib/reports.ts](/E:/my-codes/spendwise/lib/reports.ts:1)
and shared typed helpers in [lib/reports-shared.ts](/E:/my-codes/spendwise/lib/reports-shared.ts:1).
The report layer derives month-keyed summaries from persisted incomes, expenses,
budgets, savings goals, and savings entries. Each monthly report includes
income, expenses, net savings, savings contribution/withdrawal totals, top
spending categories, budget compliance, percentage metrics, and a status note.
Report PDF export uses dynamic `jspdf` and `jspdf-autotable` imports from the
client export handler so the report renderer is not part of the initial
dashboard bundle.

### Why this matters

The dashboard is currently the application composition layer, not just a visual layer. It coordinates persisted data and derived finance views.

## 13. Current File Responsibilities

| File | Responsibility |
| --- | --- |
| [app/dashboard/page.tsx](/E:/my-codes/spendwise/app/dashboard/page.tsx:1) | Protected dashboard loader |
| [app/dashboard/actions.ts](/E:/my-codes/spendwise/app/dashboard/actions.ts:1) | Finance server actions |
| [components/spendwise-dashboard.tsx](/E:/my-codes/spendwise/components/spendwise-dashboard.tsx:1) | Main finance workspace UI |
| [lib/analytics.ts](/E:/my-codes/spendwise/lib/analytics.ts:1) | Server analytics loader |
| [lib/analytics-shared.ts](/E:/my-codes/spendwise/lib/analytics-shared.ts:1) | Shared analytics calculations and types |
| [lib/reports.ts](/E:/my-codes/spendwise/lib/reports.ts:1) | Server reports loader |
| [lib/reports-shared.ts](/E:/my-codes/spendwise/lib/reports-shared.ts:1) | Shared report calculations and types |
| [app/(auth)/actions.ts](/E:/my-codes/spendwise/app/(auth)/actions.ts:1) | Register and login actions |
| [app/(auth)/layout.tsx](/E:/my-codes/spendwise/app/(auth)/layout.tsx:1) | Redirect authenticated users away from auth pages |
| [app/auth/confirm/page.tsx](/E:/my-codes/spendwise/app/auth/confirm/page.tsx:1) | Confirm email status page |
| [app/auth/confirm/verify/route.ts](/E:/my-codes/spendwise/app/auth/confirm/verify/route.ts:1) | OTP verification route |
| [lib/supabase/server.ts](/E:/my-codes/spendwise/lib/supabase/server.ts:1) | Server Supabase client |
| [lib/supabase/client.ts](/E:/my-codes/spendwise/lib/supabase/client.ts:1) | Browser Supabase client |
| [lib/supabase/proxy.ts](/E:/my-codes/spendwise/lib/supabase/proxy.ts:1) | Session refresh proxy helper |

## 14. Current Gaps

The app is functional, but not yet a fully persisted finance platform.

Remaining gaps:

- dashboard subpages are not yet independent routes

## 15. Recommended Next Steps

1. Move recent transactions to a unified server query
2. Consider adding edit/delete support for individual savings entries
3. Consider splitting dashboard subviews into route-level pages if complexity grows

## 16. Architecture Summary

SpendWise is currently best understood as:

- a production-style auth and protected-app shell
- a database-backed personal finance dashboard for incomes, budgets, expenses, and savings
- backend-computed analytics and monthly reporting over persisted finance data

The important system invariant is:

- **income records inflow**
- **budgets record planned allocation**
- **expenses record actual spending**

Everything else in the current finance model is derived from those sources.
