# SpendWise Project Architecture

## 1. Project Overview

SpendWise is a Next.js finance application with three main layers:

1. Public marketing pages for product presentation and contact
2. Authentication pages backed by Supabase Auth
3. A protected dashboard workspace for personal finance workflows

The current codebase is a mix of implemented backend-connected features and planned finance modules:

- **Implemented now**
  - marketing pages
  - login and registration
  - email confirmation flow
  - protected dashboard access
  - user profile loading from Supabase
  - income persistence in Supabase
- **Planned next**
  - database-backed budgets
  - database-backed expenses
  - database-backed savings goals and contributions
  - unified recent transactions
  - fully database-driven analytics and reports

### Main stack

| Layer | Technology |
| --- | --- |
| App framework | Next.js 16 App Router |
| UI | React 19 |
| Styling | Tailwind CSS, custom components, shadcn-style UI primitives |
| Auth | Supabase Auth |
| Database | Supabase Postgres |
| Server mutations | Next.js Server Actions |

## 2. Route and Page Structure

### Public and auth routes

| Route | Purpose | Access |
| --- | --- | --- |
| `/` | Marketing landing page | Public |
| `/contact` | Contact and inquiry page | Public |
| `/login` | User login page | Public |
| `/register` | User registration page | Public |
| `/auth/confirm` | Email confirmation status page | Public |
| `/auth/confirm/verify` | Confirmation token verification route | Public |
| `/auth/signout` | Logout route | Authenticated user session |
| `/dashboard` | Protected finance workspace | Authenticated |

### Dashboard page structure

The dashboard is currently a single protected Next.js route:

- `/dashboard`

Inside that route, the finance sections are rendered as **client-side subviews** inside `components/spendwise-dashboard.tsx`:

- Dashboard
- Income
- Budgets
- Expenses
- Savings
- Analytics
- Reports
- Settings

Important:

- These are **not** separate filesystem routes yet
- Navigation between them is local component state
- The sidebar changes the active subview without leaving `/dashboard`

## 3. User Journey and Page Interconnection

### End-to-end flow

```txt
Visitor -> Landing Page -> Register or Login
Register -> Supabase Auth Signup -> Email Confirmation -> Login -> Dashboard
Login -> Session Created -> Dashboard
Dashboard -> Sidebar / Quick Actions -> Finance Subviews and Mutations
```

### Public to auth flow

1. A visitor lands on `/`
2. They can move to `/register` or `/login`
3. The auth layout blocks logged-in users from staying on auth pages
4. Authenticated users are redirected to `/dashboard`

### Signup and confirmation flow

1. User submits the register form
2. Server action calls Supabase `signUp`
3. Signup metadata includes `first_name` and `last_name`
4. Supabase creates `auth.users`
5. Database trigger creates the matching `public.profiles` row
6. Supabase sends a confirmation email
7. User opens `/auth/confirm`
8. `/auth/confirm/verify` exchanges the token and finalizes the session
9. User continues into `/dashboard`

### Dashboard as the central hub

Once the user is inside `/dashboard`, all finance pages are interconnected through the dashboard shell:

- sidebar navigation changes the active page
- quick actions open finance modals
- finance data affects totals, charts, transactions, and reports

### Quick action interconnection

| Action | Current behavior | Intended connected effect |
| --- | --- | --- |
| Add Income | Saves to `public.incomes` | Updates total income, dashboard analytics, and recent transactions |
| Create Budget | Local-only modal state | Should later create a budget record and affect budget progress |
| Add Expense | Local-only modal state | Should later create expense records, reduce budget remaining, and affect charts |
| Add Savings | Local-only modal state | Should later create savings goal or contribution records and affect savings progress |
| View Report | Local dashboard report view | Should later summarize persisted monthly finance data |

## 4. Current Application Logic

## 4.1 Auth logic

**Implemented now**

- `app/(auth)/actions.ts` contains the register and login server actions
- register action:
  - reads form data
  - calls Supabase `auth.signUp`
  - sends `first_name` and `last_name` as metadata
  - sets `emailRedirectTo`
- login action:
  - calls Supabase `auth.signInWithPassword`
  - redirects to `/dashboard?login=success`
- `app/(auth)/layout.tsx` redirects authenticated users away from `/login` and `/register`
- `app/dashboard/page.tsx` redirects unauthenticated users to `/login`

## 4.2 Dashboard logic

**Implemented now**

- the dashboard page loads the authenticated user profile from `public.profiles`
- the dashboard page loads the user income rows from `public.incomes`
- recent income transactions are derived server-side from income rows
- the dashboard client component renders all finance subviews
- summary cards, charts, tables, and report metrics are computed in the dashboard component

### Current state split

| Module | Current source of truth |
| --- | --- |
| Auth session | Supabase Auth |
| User profile | `public.profiles` |
| Income | `public.incomes` |
| Recent income transactions | Derived from `public.incomes` |
| Budgets | Local client state |
| Expenses | Local client state |
| Savings goals | Local client state |
| Savings contributions | Local client state |
| Most analytics and reports | Derived from mixed data, mostly local state |

### Important implementation truth

The dashboard is currently in a transitional state:

- income is real database-backed data
- most other finance modules are still dashboard-local demo state

That means some numbers shown together on the dashboard come from different sources:

- income comes from Supabase
- budgets, expenses, and savings are still mock/local values unless replaced in future work

## 5. Database Architecture

## 5.1 Current tables

### `auth.users`

Managed by Supabase Auth.

Purpose:

- stores the actual authentication identity
- powers login session ownership

### `public.profiles`

Purpose:

- stores app-level user profile information
- extends the auth identity with business-facing fields

Relationship:

- one-to-one with `auth.users`

Main columns:

| Column | Meaning |
| --- | --- |
| `id` | Same UUID as `auth.users.id` |
| `email` | User email |
| `first_name` | First name from signup metadata |
| `last_name` | Last name from signup metadata |
| `created_at` | Creation timestamp |
| `updated_at` | Last update timestamp |

Security:

- RLS enabled
- users can only select and update their own profile row

### `public.incomes`

Purpose:

- stores one row per income entry
- supports the current Income page and total income calculation

Relationship:

- one-to-many from user to income rows

Main columns:

| Column | Meaning |
| --- | --- |
| `id` | Income row UUID |
| `user_id` | Owner user id |
| `source` | Free-text income source |
| `amount` | Positive income amount |
| `received_on` | Income date |
| `note` | Optional note stored as text |
| `created_at` | Creation timestamp |
| `updated_at` | Last update timestamp |

Constraints:

- `source` cannot be blank
- `amount` must be greater than `0`

Security:

- RLS enabled
- users can select, insert, update, and delete only their own income rows

## 5.2 Shared functions and triggers

### `public.set_updated_at()`

Purpose:

- automatically updates `updated_at` before row updates

Current usage:

- attached to `public.profiles`
- attached to `public.incomes`

### `public.handle_new_user()`

Purpose:

- creates the matching `public.profiles` row after a new Supabase auth user is created

Current trigger flow:

- insert into `auth.users`
- trigger fires
- insert into `public.profiles`

## 5.3 Current indexing and uniqueness

| Object | Type | Reason |
| --- | --- | --- |
| `profiles.id` | Primary key | One profile per auth user |
| `profiles.email` | Unique | No duplicate profile email values |
| `incomes.id` | Primary key | Unique income row identity |
| `idx_incomes_user_received_on_desc` | Composite index | Fast user income listing by newest date |

### Why `incomes` has no business unique index

This is intentional.

SpendWise currently does **not** enforce uniqueness on combinations like:

- `user_id + source + amount + received_on`

Reason:

- duplicate income entries can be valid
- a user may receive two payments with the same amount on the same date
- split salary deposits and repeated freelance payments are legitimate

So for income:

- `id` is the only required unique key
- business duplication is allowed

## 6. Current Data Flow

## 6.1 Signup flow

```txt
Register form
-> registerAction
-> Supabase auth.signUp
-> auth.users row created
-> handle_new_user trigger
-> profiles row created
-> confirmation email sent
```

## 6.2 Login flow

```txt
Login form
-> loginAction
-> Supabase auth.signInWithPassword
-> session cookie stored
-> redirect /dashboard?login=success
```

## 6.3 Dashboard load flow

```txt
Request /dashboard
-> verify auth claims
-> load profile from profiles
-> load incomes from incomes
-> derive recent income transactions
-> pass data into SpendWiseDashboard
-> render active dashboard subview
```

## 6.4 Add income flow

**Implemented now**

1. User opens the Add Income modal
2. User fills source, amount, date, and note
3. Client validates required fields
4. `createIncomeAction` runs on the server
5. Server inserts the income row into `public.incomes`
6. `/dashboard` is revalidated
7. Client state appends the created income row
8. Income table and totals update in the dashboard

## 6.5 Delete income flow

**Implemented now**

1. User confirms delete on the Income page
2. `deleteIncomeAction` runs on the server
3. Matching income row is deleted from `public.incomes`
4. `/dashboard` is revalidated
5. Client state removes the income row

## 6.6 Error handling flow

**Implemented now**

- income fetch errors are caught on dashboard load
- dashboard falls back to an empty income list instead of crashing
- Supabase mutation errors are sanitized before they are shown to the UI

## 7. Planned Finance Module Interconnection

This section describes the intended system behavior from `flowchart.md`. It is the target architecture, not the completed implementation.

## 7.1 Planned next modules

### Budgets

**Planned next**

Future purpose:

- define spending limits by category and period
- feed budget progress and budget remaining logic

Intended connection:

- income establishes how much money is available overall
- budgets define how that money is allocated across categories

### Expenses

**Planned next**

Future purpose:

- store actual spend events
- connect expense categories to budget usage

Intended connection:

- expenses should reduce remaining balance
- expenses should increase spent values inside the matching budget
- expenses should update charts and recent transactions

### Savings goals

**Planned next**

Future purpose:

- store user savings targets such as emergency fund or vacation fund

Intended connection:

- goals provide target amounts and progress displays
- savings progress becomes part of dashboard summaries

### Savings contributions

**Planned next**

Future purpose:

- store each deposit toward a savings goal

Intended connection:

- contributions should update savings goal progress
- contributions should reduce remaining available balance
- contributions should appear in recent transactions

### Recent transactions

**Planned next**

Target behavior:

- become a unified query or view across all finance modules

Expected combined sources:

- incomes
- expenses
- savings contributions

Important:

- the current app does **not** have a final unified transactions table
- current recent transactions are transitional

### Analytics and reports

**Planned next**

Future purpose:

- aggregate persisted finance data across time periods
- show month summaries, category breakdowns, trends, and budget efficiency

Expected dependencies:

- incomes
- budgets
- expenses
- savings goals
- savings contributions

## 7.2 Intended project logic from the flowchart

The target finance workflow is:

1. user logs in
2. dashboard loads all finance records
3. analytics are calculated
4. user navigates through finance pages
5. quick actions create or change finance data
6. dashboard cards, charts, and recent transactions refresh from shared data

In the finished architecture:

- Add Income should refresh income totals and recent transactions
- Create Budget should enforce allocation rules and feed budget progress
- Add Expense should match a budget category and update both expense totals and budget consumption
- Add Savings should update goal progress and savings totals
- Analytics and Reports should summarize all persisted modules together

## 8. Current Gaps and Next Build Steps

### Current gaps

- budgets are not persisted yet
- expenses are not persisted yet
- savings goals are not persisted yet
- savings contributions are not persisted yet
- recent transactions are not yet fully unified
- analytics and reports still depend on local dashboard state for non-income data

### Recommended next implementation order

1. Create database-backed budget tables and server actions
2. Create database-backed expense tables and budget linkage
3. Create savings goal and savings contribution tables
4. Replace local recent transactions with a unified server query
5. Move analytics and reporting calculations fully to persisted finance data

### Route-level architectural note

The dashboard subpages can remain client-side views for now, but later they may need to become separate routes if the app grows in:

- complexity
- query volume
- deep-linking requirements
- page-specific server loading needs

## 9. Source Files Worth Knowing

These files are the main anchors for understanding the current system:

| File | Why it matters |
| --- | --- |
| `app/(auth)/actions.ts` | Register and login server actions |
| `app/dashboard/page.tsx` | Protected dashboard loader and server-side income/profile fetch |
| `app/dashboard/actions.ts` | Income create/delete server actions |
| `components/spendwise-dashboard.tsx` | Main dashboard shell, subviews, local finance state, charts, and modals |
| `supabase.md` | Backend setup and architecture notes |
| `supabase_sql.md` | SQL schema, triggers, indexes, and RLS policies |
| `flowchart.md` | Intended end-to-end finance workflow |

## 10. Final Architecture Summary

SpendWise already has:

- a working public site
- working authentication
- email confirmation
- protected dashboard access
- profile storage
- income storage

SpendWise is still evolving toward a fully interconnected finance system where:

- all finance modules are database-backed
- all dashboard metrics come from shared persisted data
- all pages participate in one consistent financial model

Right now, the project should be understood as:

- **implemented auth + implemented income**
- **planned full finance platform**

That distinction is important for future development, testing, and database design.
