# Supabase Guide for SpendWise

## 1. Purpose

This document explains how Supabase is used in SpendWise and how to set it up correctly for local development and deployment.

It covers:

- required environment variables
- Supabase Auth configuration
- confirmation email setup
- redirect URL setup
- the database tables used by the app
- row-level security expectations
- how the app talks to Supabase at runtime

Use this guide together with:

- [docs/supabase_sql.md](/E:/my-codes/spendwise/docs/supabase_sql.md:1)
- [docs/PROJECT_ARCHITECTURE.md](/E:/my-codes/spendwise/docs/PROJECT_ARCHITECTURE.md:1)

## 2. What Supabase Does in This Project

Supabase currently provides two major capabilities:

### Authentication

- email/password sign-up
- email confirmation
- sign-in
- sign-out
- request-scoped session cookies

### Database

- profile storage
- income storage
- budget storage
- expense storage
- row-level security per authenticated user

## 3. Current Supabase-Backed Data Model

The current app uses these database tables:

- `public.profiles`
- `public.incomes`
- `public.budgets`
- `public.expenses`
- `public.savings_goals`
- `public.savings_entries`

The read-only `public.finance_transactions` view normalizes income, expense,
and savings entry rows for the dashboard transaction feed. It uses invoker
security so the underlying table RLS policies continue to enforce ownership.

Auth identity itself lives in:

- `auth.users`

Savings is persisted as goals plus dated entries. Saved totals are derived from
`public.savings_entries`, not stored directly on the goal row.

## 4. Required Environment Variables

## 4.1 Minimum local environment

Open [`.env.local`](/E:/my-codes/spendwise/.env.local:1) and define:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-supabase-publishable-key
```

The app also supports the legacy publishable variable:

```env
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

The current server and browser helpers use:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- fallback `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## 4.2 Optional server-only key

You may also keep a server-only admin key for future tasks:

```env
SUPABASE_SECRET_KEY=your-supabase-secret-key
```

Important:

- the current application code does not require the secret key for normal auth or dashboard usage
- never expose the secret key in client code

## 4.3 Environment file references

Relevant files:

- [`.env.example`](/E:/my-codes/spendwise/.env.example:1)
- [`.env.local`](/E:/my-codes/spendwise/.env.local:1)
- [lib/supabase/config.ts](/E:/my-codes/spendwise/lib/supabase/config.ts:1)

## 5. Supabase Dashboard Configuration

## 5.1 Enable email/password auth

In the Supabase dashboard:

1. Open `Authentication`
2. Open `Providers`
3. Open `Email`
4. Ensure email/password auth is enabled

## 5.2 Keep email confirmation enabled

SpendWise is built around confirmed email accounts.

Expected flow:

1. user signs up
2. Supabase sends confirmation email
3. user opens the confirmation link
4. the app verifies the token
5. the user can continue to the dashboard

## 5.3 Configure the confirm-signup email template

SpendWise does not use the raw `{{ .ConfirmationURL }}` link directly.

Update the `Confirm signup` template so it points to the app confirmation page:

```txt
{{ .RedirectTo }}/auth/confirm?token_hash={{ .TokenHash }}&type=email
```

If you edit the HTML template:

```html
<a href="{{ .RedirectTo }}/auth/confirm?token_hash={{ .TokenHash }}&type=email">
  Confirm your email
</a>
```

Why this matters:

- the app shows a dedicated confirmation page
- the app posts to `/auth/confirm/verify`
- the app then stores session cookies correctly through the SSR flow

## 5.4 Configure Site URL and Redirect URLs

In Supabase:

1. Open `Authentication`
2. Open `URL Configuration`

Recommended local values:

- Site URL: `http://localhost:3000`

Recommended local redirect URLs:

- `http://localhost:3000`
- `http://localhost:3000/`
- `http://localhost:3000/login`
- `http://localhost:3000/register`
- `http://localhost:3000/auth/confirm`
- `http://localhost:3000/dashboard`

Recommended production redirect URLs:

- `https://your-domain`
- `https://your-domain/`
- `https://your-domain/login`
- `https://your-domain/register`
- `https://your-domain/auth/confirm`
- `https://your-domain/dashboard`

## 6. SQL Setup Order

Run the SQL from [docs/supabase_sql.md](/E:/my-codes/spendwise/docs/supabase_sql.md:1) in this order:

1. profiles
2. shared `updated_at` trigger function
3. automatic profile creation trigger
4. incomes
5. budgets
6. expenses
7. savings goals
8. savings entries
9. unified finance transaction view

Recommended section checkpoints:

- profiles combined setup: sections `1` to `6`
- income schema: sections `7` to `11`
- budget schema: sections `12` to `16`
- expense schema: sections `17` to `21`
- savings schema: sections `22` to `26`
- unified transaction view: section `27`

## 7. Runtime Supabase Integration

## 7.1 Browser client

File:

- [lib/supabase/client.ts](/E:/my-codes/spendwise/lib/supabase/client.ts:1)

Uses:

- `createBrowserClient`

Purpose:

- browser-safe client creation

## 7.2 Server client

File:

- [lib/supabase/server.ts](/E:/my-codes/spendwise/lib/supabase/server.ts:1)

Uses:

- `createServerClient`
- `next/headers` cookies

Purpose:

- server actions
- protected server rendering
- request-scoped auth access

## 7.3 Session refresh proxy

Files:

- [proxy.ts](/E:/my-codes/spendwise/proxy.ts:1)
- [lib/supabase/proxy.ts](/E:/my-codes/spendwise/lib/supabase/proxy.ts:1)

Purpose:

- refresh auth claims
- synchronize Supabase cookies with the Next.js response

## 8. Auth Flow in This App

## 8.1 Registration

File:

- [app/(auth)/actions.ts](/E:/my-codes/spendwise/app/(auth)/actions.ts:1)

`registerAction`:

- reads `firstName`, `lastName`, `email`, and `password`
- computes `emailRedirectTo` from headers
- calls `supabase.auth.signUp`
- sends metadata:
  - `first_name`
  - `last_name`

If signup returns an immediate session, the app redirects directly to `/dashboard`. Otherwise it tells the user to confirm email first.

## 8.2 Login

`loginAction`:

- calls `supabase.auth.signInWithPassword`
- redirects to `/dashboard?login=success` on success

## 8.3 Confirmation

Files:

- [app/auth/confirm/page.tsx](/E:/my-codes/spendwise/app/auth/confirm/page.tsx:1)
- [app/auth/confirm/verify/route.ts](/E:/my-codes/spendwise/app/auth/confirm/verify/route.ts:1)

The verification route:

- accepts `tokenHash` and `type`
- validates the request shape
- calls `supabase.auth.verifyOtp`
- returns a structured success/error response

## 9. Finance Data Access in This App

## 9.1 Loaders

Files:

- [lib/incomes.ts](/E:/my-codes/spendwise/lib/incomes.ts:1)
- [lib/budgets.ts](/E:/my-codes/spendwise/lib/budgets.ts:1)
- [lib/expenses.ts](/E:/my-codes/spendwise/lib/expenses.ts:1)
- [lib/savings.ts](/E:/my-codes/spendwise/lib/savings.ts:1)
- [lib/transactions.ts](/E:/my-codes/spendwise/lib/transactions.ts:1)

Each loader:

- creates a server Supabase client
- reads auth claims
- filters by `user_id`
- returns sorted rows

## 9.2 Dashboard actions

File:

- [app/dashboard/actions.ts](/E:/my-codes/spendwise/app/dashboard/actions.ts:1)

Current actions:

- create/delete income
- create/update/delete budget
- create/delete expense

Important logic:

- budgets are validated against same-period income
- overlapping budgets for the same category are blocked
- deleting income is blocked if it would invalidate existing budgets

## 10. Finance Model Rules

SpendWise uses this finance model:

- income = inflow
- budget = planned allocation
- expense = actual spending

Rules:

- expenses do not mutate stored income rows
- expenses do not mutate stored budget rows
- budget usage is derived by matching expenses to budget category + date range
- expenses with no matching budget are still allowed
- expenses can overspend a budget

This is why the database keeps:

- one table for incomes
- one table for budgets
- one table for expenses

and not a single mixed transaction table for v1.

The `public.finance_transactions` view preserves those domain tables while
providing one normalized, read-only query surface for transaction timelines.

## 11. Vercel Deployment Notes

If deployed to Vercel, define:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-supabase-publishable-key
```

Only add `SUPABASE_SECRET_KEY` if you later introduce server-only admin operations.

Also confirm:

- the production domain is added in Supabase URL configuration
- the confirmation email template uses `{{ .RedirectTo }}`

## 12. Verification Checklist

After configuration, confirm all of the following:

- signup creates a user in `auth.users`
- signup creates a matching row in `public.profiles`
- email confirmation works through `/auth/confirm`
- login redirects to `/dashboard`
- dashboard loads profile data
- dashboard loads incomes
- dashboard loads budgets
- dashboard loads expenses
- dashboard loads savings goals
- dashboard loads savings entries
- dashboard loads the unified recent transaction feed
- create/delete income works
- create/update/delete budget works
- create/delete expense works
- create/delete savings goal works
- create savings contribution works
- create savings withdrawal works

## 13. Troubleshooting

### Signup succeeds but no `profiles` row appears

Check:

- `public.handle_new_user()` exists
- `on_auth_user_created` trigger exists
- signup metadata includes `first_name` and `last_name`

### Login fails for unconfirmed user

This is expected when confirm-email is enabled.

### Confirmation page says the link is invalid

Check:

- the email template uses the custom `/auth/confirm` URL
- the token was not already used
- the URL was not truncated by the mail client

### Dashboard redirects to login even after sign-in

Check:

- proxy session refresh is active
- Supabase auth cookies are being set correctly
- environment variables are correct in the active environment

### Budget creation fails even though the amount looks valid

Check:

- same category does not overlap an existing budget period
- same-period allocated budgets do not exceed same-period income

### Expense creation works but does not look attached to a budget

Check:

- category spelling matches the intended budget category
- expense date falls inside the budget period

## 14. Project-Specific References

- [docs/supabase_sql.md](/E:/my-codes/spendwise/docs/supabase_sql.md:1)
- [docs/PROJECT_ARCHITECTURE.md](/E:/my-codes/spendwise/docs/PROJECT_ARCHITECTURE.md:1)
- [app/(auth)/actions.ts](/E:/my-codes/spendwise/app/(auth)/actions.ts:1)
- [app/dashboard/actions.ts](/E:/my-codes/spendwise/app/dashboard/actions.ts:1)
- [lib/supabase/config.ts](/E:/my-codes/spendwise/lib/supabase/config.ts:1)
- [lib/supabase/server.ts](/E:/my-codes/spendwise/lib/supabase/server.ts:1)
