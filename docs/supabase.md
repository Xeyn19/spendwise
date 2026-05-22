# Supabase Setup for SpendWise

This is the full setup guide for using **Supabase as the database and authentication provider** for this project.

It is written for the current state of the app:

- Next.js App Router (`next@16`)
- `/register` already collects:
  - first name
  - last name
  - email
  - password
- `/login` already collects:
  - email
  - password
- the UI exists and is ready to be wired to Supabase Auth
- `@supabase/supabase-js` and `@supabase/ssr` are already installed

This guide covers the whole backend setup:

1. create and fill environment variables
2. configure Supabase Auth in the dashboard
3. create the database table
4. enable RLS
5. add policies
6. create the signup trigger
7. manually verify everything before wiring code

## Goal

Use:

- **Supabase Auth** for email/password register and login
- a **`public.profiles`** table for app-level user data
- **email confirmation enabled**
- **RLS** so each user can only access their own profile row

## Recommended Data Model

Use this split:

- `auth.users`
  - owned by Supabase Auth
  - stores the real auth identity
- `public.profiles`
  - stores first name, last name, email, and future user profile fields

Why this is the right fit for your app:

- your register form needs `first_name` and `last_name`
- those fields should not live only in UI state
- keeping them in a `profiles` table gives you a clean place for future settings, avatar, currency preference, etc.

## Step 1. Prepare Environment Variables

Supabase now prefers:

- **publishable key** for public app usage
- **secret key** for protected server-only admin usage

Legacy keys still exist:

- `anon`
- `service_role`

For this project, prefer the newer names.

### 1.1 Fill `.env.local`

Open [`.env.local`](/E:/my-codes/spendwise/.env.local) and replace the placeholders with the values from your Supabase project.

Use:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-supabase-publishable-key
SUPABASE_SECRET_KEY=your-supabase-secret-key
```

If your dashboard only gives you legacy keys and you want to use those for now, the equivalent values are:

```env
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
```

### 1.2 Which keys matter for register/login?

For normal register/login:

- you need the **Project URL**
- you need the **publishable key** on the client
- you do **not** need the secret/service role key for browser auth

Important:

- `NEXT_PUBLIC_*` values are safe to expose to the browser
- `SUPABASE_SECRET_KEY` and `SUPABASE_SERVICE_ROLE_KEY` must stay server-only
- never put the secret/service-role key in a client component

### 1.3 Keep `.env.example` as placeholders only

The committed template file is [`.env.example`](/E:/my-codes/spendwise/.env.example).

It should never contain real credentials.

## Step 2. Get the Correct Values from Supabase

In the Supabase dashboard:

1. open your project
2. go to **Project Settings**
3. go to **API Keys**

Collect:

- **Project URL**
- **Publishable key**
- **Secret key**

If you are still using legacy keys, you can also copy:

- **anon**
- **service_role**

Official reference:

- Supabase API keys guide: https://supabase.com/docs/guides/getting-started/api-keys

## Step 3. Configure Supabase Auth

Go to:

- `Authentication`
- `Providers`
- `Email`

Make sure:

- Email provider is enabled
- Email/password signup is enabled

### 3.1 Keep email confirmation enabled

For this project, keep **Confirm email** turned on.

Expected behavior:

1. user signs up
2. Supabase creates the auth record
3. Supabase sends a confirmation email
4. user confirms email
5. user can then log in normally

Official reference:

- Password auth guide: https://supabase.com/docs/guides/auth/passwords
- General auth configuration: https://supabase.com/docs/guides/auth/general-configuration

### 3.2 Update the confirm-signup email template for SSR

Because the app now verifies confirmation links through `/auth/confirm`, update the Supabase email template:

1. Go to `Authentication`
2. Open `Email Templates`
3. Select `Confirm signup`
4. Replace:

```txt
{{ .ConfirmationURL }}
```

with:

```txt
{{ .RedirectTo }}/auth/confirm?token_hash={{ .TokenHash }}&type=email
```

This is required for the confirmation page to exchange the confirmation token correctly.

Use `{{ .RedirectTo }}`, not `{{ .SiteURL }}`, when you want both localhost and Vercel production to work. `{{ .RedirectTo }}` uses the URL passed by the app during signup, so local signups can confirm through `http://localhost:3000` and production signups can confirm through your Vercel domain.

If you are editing the full HTML email template, use this link target on the confirmation button:

```html
<a href="{{ .RedirectTo }}/auth/confirm?token_hash={{ .TokenHash }}&type=email">
  Confirm your email
</a>
```

The app shows a branded `/auth/confirm` status page. That page verifies the token through `/auth/confirm/verify`, stores the Supabase session cookies, and then shows a dashboard button when confirmation succeeds.

### 3.3 Important email note

Supabase includes a default email sender for testing, but it is limited.

If confirmation emails do not reliably arrive, check:

- spam folder
- sender limits on the default Supabase test mailer
- whether you need a custom SMTP setup later

For local and early testing this is usually enough, but for production you should plan to configure SMTP.

## Step 4. Configure Site URL and Redirect URLs

Go to:

- `Authentication`
- `URL Configuration`

For local-only testing, you can set:

- **Site URL**: `http://localhost:3000`

For Vercel production testing, set:

- **Site URL**: `https://your-production-domain`

Add these **Redirect URLs**:

- `http://localhost:3000`
- `http://localhost:3000/`
- `http://localhost:3000/login`
- `http://localhost:3000/register`
- `http://localhost:3000/auth/confirm`

Then add your production domain too:

- `https://your-production-domain`
- `https://your-production-domain/`
- `https://your-production-domain/login`
- `https://your-production-domain/register`
- `https://your-production-domain/auth/confirm`

Replace `https://your-production-domain` with your Vercel production URL, for example `https://spendwise.vercel.app`.

Important:

- a localhost confirmation link only works on the same computer running `npm run dev`
- a Vercel confirmation link works from your phone or another device because it is public
- if you register locally, the email link should point to localhost
- if you register on Vercel, the email link should point to the Vercel domain

### 4.1 Add Vercel environment variables

In your Vercel project settings, add:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-supabase-publishable-key
```

Use the same values as `.env.local` while you are testing with one shared Supabase project.

Only add `SUPABASE_SECRET_KEY` to Vercel if you later add server-only admin operations. The current register/login flow does not need the secret key in browser code.

Official Next.js/Supabase SSR reference:

- https://supabase.com/docs/guides/auth/quickstarts/nextjs
- https://supabase.com/docs/guides/auth/server-side/creating-a-client

## Step 5. Create the `profiles` Table

Open:

- `SQL Editor`

Run section **1. Create the `profiles` Table** from [supabase_sql.md](/E:/my-codes/spendwise/supabase_sql.md).

### What this table does

- `id`
  - matches `auth.users.id`
  - one profile row per auth user
- `email`
  - useful for app queries and admin review
- `first_name`, `last_name`
  - populated from signup metadata
- `created_at`, `updated_at`
  - good defaults for future account management

## Step 6. Create the `updated_at` Trigger

Run section **2. Create the `updated_at` Trigger Function** from [supabase_sql.md](/E:/my-codes/spendwise/supabase_sql.md).

### Why this matters

Whenever you update the profile later, `updated_at` will refresh automatically.

## Step 7. Create the Automatic Profile-Insert Trigger

This is the key part that connects Auth signup to your app data.

When a user signs up, you want:

- Supabase Auth to create the account
- your app database to create the matching `profiles` row automatically

Run section **3. Create the Automatic Profile-Insert Trigger** from [supabase_sql.md](/E:/my-codes/spendwise/supabase_sql.md).

### Why metadata matters

Later, your register code must send:

```ts
options: {
  data: {
    first_name: firstName,
    last_name: lastName,
  },
}
```

That is exactly what this trigger reads:

- `new.raw_user_meta_data ->> 'first_name'`
- `new.raw_user_meta_data ->> 'last_name'`

## Step 8. Enable Row Level Security

Now secure the table.

Run section **4. Enable Row Level Security** from [supabase_sql.md](/E:/my-codes/spendwise/supabase_sql.md).

Without RLS, your table is not protected correctly for app users.

Official background:

- https://supabase.com/docs/guides/auth

## Step 9. Create RLS Policies

### 9.1 Allow users to view only their own profile

Run section **5.1 Allow users to view only their own profile** from [supabase_sql.md](/E:/my-codes/spendwise/supabase_sql.md).

### 9.2 Allow users to update only their own profile

Run section **5.2 Allow users to update only their own profile** from [supabase_sql.md](/E:/my-codes/spendwise/supabase_sql.md).

### 9.3 Do you need an insert policy?

For this setup, **no direct user insert policy is required** for `profiles`, because:

- the row is created by the database trigger
- the trigger runs as the function owner through `security definer`

That means your app user does not need direct insert access to `public.profiles` during signup.

## Step 10. Full SQL Block in One Place

If you want to run everything in one shot, use section **6. Full Combined SQL Block** from [supabase_sql.md](/E:/my-codes/spendwise/supabase_sql.md).

## Step 11. Verify the Table and Trigger

After running the SQL:

1. go to **Table Editor**
2. confirm `profiles` exists
3. confirm columns exist:
   - `id`
   - `email`
   - `first_name`
   - `last_name`
   - `created_at`
   - `updated_at`

Then check:

1. go to **Database**
2. inspect **Functions**
3. make sure these functions exist:
   - `public.set_updated_at`
   - `public.handle_new_user`

Then inspect triggers if you want:

- `set_profiles_updated_at`
- `on_auth_user_created`

## Step 12. Manual Signup Test in Supabase

Before wiring app code, you should still verify the backend works.

You have 2 practical options:

### Option A: Wait until app integration

You can skip this for now and test only after `/register` is connected.

### Option B: Temporary test from code or script

Once you wire signup later, register a test user with:

- first name: `Test`
- last name: `User`
- email: your real test email
- password: a valid test password

Expected result:

1. the user appears in `Authentication > Users`
2. the `profiles` table gets a row automatically
3. `first_name` = `Test`
4. `last_name` = `User`
5. `email` is populated

## Step 13. What the Future Register Request Must Send

When you wire the current `/register` form later, the signup payload should look like:

```ts
const { data, error } = await supabase.auth.signUp({
  email,
  password,
  options: {
    emailRedirectTo: "http://localhost:3000",
    data: {
      first_name: firstName,
      last_name: lastName,
    },
  },
})
```

Why this matters:

- `email` and `password` create the auth account
- `data.first_name` and `data.last_name` feed the `profiles` trigger
- `emailRedirectTo` controls which base URL `{{ .RedirectTo }}` uses in the confirmation email
- the email template appends `/auth/confirm?token_hash=...&type=email`

## Step 14. What the Future Login Request Must Do

When you wire `/login` later, the base call should be:

```ts
const { data, error } = await supabase.auth.signInWithPassword({
  email,
  password,
})
```

Expected behavior:

- confirmed user: login succeeds
- unconfirmed user: login stays blocked until email is confirmed

Your login UI should show a clear message when confirmation is still pending.

## Step 15. Recommended Future File Structure

When you move from setup into implementation, add these files:

- `lib/supabase/client.ts`
- `lib/supabase/server.ts`
- optional auth server actions

Recommended split:

- **browser client**
  - for register/login actions in the UI
- **server client**
  - for server-side session and protected work
- **secret key**
  - only for backend/admin work
  - not for normal client auth

Official SSR reference:

- https://supabase.com/docs/guides/auth/server-side
- https://supabase.com/docs/guides/auth/server-side/creating-a-client

## Step 16. Troubleshooting

### Signup succeeds but no profile row appears

Check:

- `public.handle_new_user()` exists
- `on_auth_user_created` trigger exists
- signup metadata contains:
  - `first_name`
  - `last_name`

### User cannot log in after signup

Check:

- email confirmation is enabled
- the user confirmed the email
- the email/password pair is correct

### No confirmation email arrives

Check:

- spam folder
- Supabase default email sender limits
- whether you need custom SMTP for more reliable delivery

### Profile query fails for authenticated user

Check:

- RLS is enabled
- `select` policy exists
- the request is being made under the logged-in user session

### Profile update fails

Check:

- `update` policy exists
- you are updating only the currently authenticated user's row

### Redirect lands on the wrong page

Check:

- `Site URL`
- `Redirect URLs`
- `emailRedirectTo`
- the confirm-signup email template uses `{{ .RedirectTo }}`, not `{{ .SiteURL }}`

### Confirmation link says it cannot connect

Check:

- if the link starts with `http://localhost:3000`, open it on the same computer running `npm run dev`
- if you want to open the link from your phone, register from the Vercel production URL so the email uses the public domain
- if a production link still fails, confirm the Vercel domain is listed in Supabase Redirect URLs

### Secret key was exposed in frontend code

If that happened:

1. remove it from client code immediately
2. rotate the secret/service-role key in Supabase
3. replace the environment variable locally

## Step 17. Exact Next Step After This Guide

Once you finish the dashboard and SQL steps above, your next implementation step in this project should be:

1. create Supabase client helpers
2. wire `/register` to `supabase.auth.signUp`
3. wire `/login` to `supabase.auth.signInWithPassword`
4. replace the current mock success states with real auth results
5. redirect authenticated users into the app

At that point, the existing UI will be fully connected to real Supabase authentication.

## Step 18. Add the First Finance Table: `incomes`

After auth is working, the first finance module to persist should be `public.incomes`.

Use section **7. Create the `incomes` Table** through section **11. Income-Only SQL Block** from [supabase_sql.md](/E:/my-codes/spendwise/supabase_sql.md).

Recommended v1 shape:

- one row per income entry
- `source` stays free-text for now
- no unique business key on amount/date/source, because duplicate entries can be legitimate
- one composite index on:
  - `user_id`
  - `received_on desc`
  - `created_at desc`

That index fits the current app behavior:

- dashboard loads the signed-in user's incomes
- Income page lists the newest rows first
- recent transactions can reuse the same order

### Why no unique index yet

It would be unsafe to enforce uniqueness on combinations like:

- `user_id + source + amount + received_on`

because two valid income rows can share those same values, for example:

- two freelance payments on one day
- split salary deposits
- repeated cash entries with the same amount

For v1, rely on:

- `id` as the only unique key
- validation for non-empty `source`
- validation for `amount > 0`

### How this connects to the other pages

The pages do need to connect through shared finance data, but they should not all write the same table.

Recommended direction:

- `incomes`
  - drives total income
- `budgets`
  - later stores planned limits per category and date period
- `expenses`
  - later stores actual spend and links into budget logic
- `savings_goals` and `savings_contributions`
  - later store goals and deposits toward those goals

For the current dashboard flow, `Recent Transactions` should eventually become a query that combines:

- incomes
- expenses
- savings contributions

Do not create a duplicate catch-all transactions table yet unless you later need an event ledger by design.
