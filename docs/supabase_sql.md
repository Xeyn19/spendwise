# Supabase SQL for SpendWise

This file contains the SQL you need to run in the Supabase SQL Editor for the SpendWise auth setup.

Use it together with [supabase.md](/E:/my-codes/spendwise/docs/supabase.md).

## Recommended Order

Run the sections in this order if you want to execute them step by step:

1. Create the `profiles` table
2. Create the `updated_at` trigger function
3. Create the automatic profile-insert trigger
4. Enable Row Level Security
5. Create the RLS policies
6. Create the domain tables and policies in sections 7 through 26
7. Create the unified finance transaction view in section 27

If you prefer, you can skip to the final section and run the **full combined SQL block** in one shot.

## 1. Create the `profiles` Table

```sql
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text unique,
  first_name text,
  last_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

## 2. Create the `updated_at` Trigger Function

```sql
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_profiles_updated_at on public.profiles;

create trigger set_profiles_updated_at
before update on public.profiles
for each row
execute function public.set_updated_at();
```

## 3. Create the Automatic Profile-Insert Trigger

```sql
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (
    id,
    email,
    first_name,
    last_name
  )
  values (
    new.id,
    new.email,
    new.raw_user_meta_data ->> 'first_name',
    new.raw_user_meta_data ->> 'last_name'
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
after insert on auth.users
for each row
execute function public.handle_new_user();
```

## 4. Enable Row Level Security

```sql
alter table public.profiles enable row level security;
```

## 5. Create RLS Policies

### 5.1 Allow users to view only their own profile

```sql
drop policy if exists "Users can view own profile" on public.profiles;

create policy "Users can view own profile"
on public.profiles
for select
to authenticated
using ((select auth.uid()) = id);
```

### 5.2 Allow users to update only their own profile

```sql
drop policy if exists "Users can update own profile" on public.profiles;

create policy "Users can update own profile"
on public.profiles
for update
to authenticated
using ((select auth.uid()) = id)
with check ((select auth.uid()) = id);
```

## 6. Full Combined SQL Block

Run this if you want to execute the whole setup at once:

```sql
create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text unique,
  first_name text,
  last_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_profiles_updated_at on public.profiles;

create trigger set_profiles_updated_at
before update on public.profiles
for each row
execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (
    id,
    email,
    first_name,
    last_name
  )
  values (
    new.id,
    new.email,
    new.raw_user_meta_data ->> 'first_name',
    new.raw_user_meta_data ->> 'last_name'
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
after insert on auth.users
for each row
execute function public.handle_new_user();

drop policy if exists "Users can view own profile" on public.profiles;
create policy "Users can view own profile"
on public.profiles
for select
to authenticated
using ((select auth.uid()) = id);

drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile"
on public.profiles
for update
to authenticated
using ((select auth.uid()) = id)
with check ((select auth.uid()) = id);
```

## 7. Create the `incomes` Table

```sql
create extension if not exists pgcrypto;

create table if not exists public.incomes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  source text not null,
  amount numeric(12, 2) not null,
  received_on date not null,
  note text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint incomes_source_not_blank check (btrim(source) <> ''),
  constraint incomes_amount_positive check (amount > 0)
);

create index if not exists idx_incomes_user_received_on_desc
  on public.incomes (user_id, received_on desc, created_at desc);
```

## 8. Attach the `updated_at` Trigger to `incomes`

This reuses the existing `public.set_updated_at()` function from section 2.

```sql
drop trigger if exists set_incomes_updated_at on public.incomes;

create trigger set_incomes_updated_at
before update on public.incomes
for each row
execute function public.set_updated_at();
```

## 9. Enable Row Level Security for `incomes`

```sql
alter table public.incomes enable row level security;
```

## 10. Create RLS Policies for `incomes`

### 10.1 Allow users to view only their own income rows

```sql
drop policy if exists "Users can view own incomes" on public.incomes;

create policy "Users can view own incomes"
on public.incomes
for select
to authenticated
using ((select auth.uid()) = user_id);
```

### 10.2 Allow users to insert only their own income rows

```sql
drop policy if exists "Users can insert own incomes" on public.incomes;

create policy "Users can insert own incomes"
on public.incomes
for insert
to authenticated
with check ((select auth.uid()) = user_id);
```

### 10.3 Allow users to update only their own income rows

```sql
drop policy if exists "Users can update own incomes" on public.incomes;

create policy "Users can update own incomes"
on public.incomes
for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);
```

### 10.4 Allow users to delete only their own income rows

```sql
drop policy if exists "Users can delete own incomes" on public.incomes;

create policy "Users can delete own incomes"
on public.incomes
for delete
to authenticated
using ((select auth.uid()) = user_id);
```

## 11. Income-Only SQL Block

Run this after the existing profile setup if you want only the income schema:

```sql
create extension if not exists pgcrypto;

create table if not exists public.incomes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  source text not null,
  amount numeric(12, 2) not null,
  received_on date not null,
  note text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint incomes_source_not_blank check (btrim(source) <> ''),
  constraint incomes_amount_positive check (amount > 0)
);

create index if not exists idx_incomes_user_received_on_desc
  on public.incomes (user_id, received_on desc, created_at desc);

alter table public.incomes enable row level security;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_incomes_updated_at on public.incomes;

create trigger set_incomes_updated_at
before update on public.incomes
for each row
execute function public.set_updated_at();

drop policy if exists "Users can view own incomes" on public.incomes;
create policy "Users can view own incomes"
on public.incomes
for select
to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "Users can insert own incomes" on public.incomes;
create policy "Users can insert own incomes"
on public.incomes
for insert
to authenticated
with check ((select auth.uid()) = user_id);

drop policy if exists "Users can update own incomes" on public.incomes;
create policy "Users can update own incomes"
on public.incomes
for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

drop policy if exists "Users can delete own incomes" on public.incomes;
create policy "Users can delete own incomes"
on public.incomes
for delete
to authenticated
using ((select auth.uid()) = user_id);
```

## 12. Create the `budgets` Table

```sql
create extension if not exists pgcrypto;
create extension if not exists btree_gist;

create table if not exists public.budgets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  category text not null,
  category_key text generated always as (lower(btrim(category))) stored,
  icon text not null,
  allocated_amount numeric(12, 2) not null,
  period_start date not null,
  period_end date not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint budgets_category_not_blank check (btrim(category) <> ''),
  constraint budgets_icon_not_blank check (btrim(icon) <> ''),
  constraint budgets_amount_positive check (allocated_amount > 0),
  constraint budgets_period_valid check (period_end >= period_start),
  constraint budgets_no_category_overlap exclude using gist (
    user_id with =,
    category_key with =,
    daterange(period_start, period_end, '[]') with &&
  )
);

create index if not exists idx_budgets_user_period_start_desc
  on public.budgets (user_id, period_start desc, created_at desc);
```

## 13. Attach the `updated_at` Trigger to `budgets`

This reuses the existing `public.set_updated_at()` function from section 2.

```sql
drop trigger if exists set_budgets_updated_at on public.budgets;

create trigger set_budgets_updated_at
before update on public.budgets
for each row
execute function public.set_updated_at();
```

## 14. Enable Row Level Security for `budgets`

```sql
alter table public.budgets enable row level security;
```

## 15. Create RLS Policies for `budgets`

### 15.1 Allow users to view only their own budget rows

```sql
drop policy if exists "Users can view own budgets" on public.budgets;

create policy "Users can view own budgets"
on public.budgets
for select
to authenticated
using ((select auth.uid()) = user_id);
```

### 15.2 Allow users to insert only their own budget rows

```sql
drop policy if exists "Users can insert own budgets" on public.budgets;

create policy "Users can insert own budgets"
on public.budgets
for insert
to authenticated
with check ((select auth.uid()) = user_id);
```

### 15.3 Allow users to update only their own budget rows

```sql
drop policy if exists "Users can update own budgets" on public.budgets;

create policy "Users can update own budgets"
on public.budgets
for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);
```

### 15.4 Allow users to delete only their own budget rows

```sql
drop policy if exists "Users can delete own budgets" on public.budgets;

create policy "Users can delete own budgets"
on public.budgets
for delete
to authenticated
using ((select auth.uid()) = user_id);
```

## 16. Budget-Only SQL Block

Run this after the existing profile and income setup if you want only the budget schema:

```sql
create extension if not exists pgcrypto;
create extension if not exists btree_gist;

create table if not exists public.budgets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  category text not null,
  category_key text generated always as (lower(btrim(category))) stored,
  icon text not null,
  allocated_amount numeric(12, 2) not null,
  period_start date not null,
  period_end date not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint budgets_category_not_blank check (btrim(category) <> ''),
  constraint budgets_icon_not_blank check (btrim(icon) <> ''),
  constraint budgets_amount_positive check (allocated_amount > 0),
  constraint budgets_period_valid check (period_end >= period_start),
  constraint budgets_no_category_overlap exclude using gist (
    user_id with =,
    category_key with =,
    daterange(period_start, period_end, '[]') with &&
  )
);

create index if not exists idx_budgets_user_period_start_desc
  on public.budgets (user_id, period_start desc, created_at desc);

alter table public.budgets enable row level security;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_budgets_updated_at on public.budgets;

create trigger set_budgets_updated_at
before update on public.budgets
for each row
execute function public.set_updated_at();

drop policy if exists "Users can view own budgets" on public.budgets;
create policy "Users can view own budgets"
on public.budgets
for select
to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "Users can insert own budgets" on public.budgets;
create policy "Users can insert own budgets"
on public.budgets
for insert
to authenticated
with check ((select auth.uid()) = user_id);

drop policy if exists "Users can update own budgets" on public.budgets;
create policy "Users can update own budgets"
on public.budgets
for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

drop policy if exists "Users can delete own budgets" on public.budgets;
create policy "Users can delete own budgets"
on public.budgets
for delete
to authenticated
using ((select auth.uid()) = user_id);
```

## 17. Create the `expenses` Table

```sql
create extension if not exists pgcrypto;

create table if not exists public.expenses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  category text not null,
  category_key text generated always as (lower(btrim(category))) stored,
  amount numeric(12, 2) not null,
  spent_on date not null,
  note text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint expenses_category_not_blank check (btrim(category) <> ''),
  constraint expenses_amount_positive check (amount > 0)
);

create index if not exists idx_expenses_user_spent_on_desc
  on public.expenses (user_id, spent_on desc, created_at desc);

create index if not exists idx_expenses_user_category_key_spent_on
  on public.expenses (user_id, category_key, spent_on desc);
```

## 18. Attach the `updated_at` Trigger to `expenses`

This reuses the existing `public.set_updated_at()` function from section 2.

```sql
drop trigger if exists set_expenses_updated_at on public.expenses;

create trigger set_expenses_updated_at
before update on public.expenses
for each row
execute function public.set_updated_at();
```

## 19. Enable Row Level Security for `expenses`

```sql
alter table public.expenses enable row level security;
```

## 20. Create RLS Policies for `expenses`

### 20.1 Allow users to view only their own expense rows

```sql
drop policy if exists "Users can view own expenses" on public.expenses;

create policy "Users can view own expenses"
on public.expenses
for select
to authenticated
using ((select auth.uid()) = user_id);
```

### 20.2 Allow users to insert only their own expense rows

```sql
drop policy if exists "Users can insert own expenses" on public.expenses;

create policy "Users can insert own expenses"
on public.expenses
for insert
to authenticated
with check ((select auth.uid()) = user_id);
```

### 20.3 Allow users to update only their own expense rows

```sql
drop policy if exists "Users can update own expenses" on public.expenses;

create policy "Users can update own expenses"
on public.expenses
for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);
```

### 20.4 Allow users to delete only their own expense rows

```sql
drop policy if exists "Users can delete own expenses" on public.expenses;

create policy "Users can delete own expenses"
on public.expenses
for delete
to authenticated
using ((select auth.uid()) = user_id);
```

## 21. Expense-Only SQL Block

Run this after the existing profile, income, and budget setup if you want only the expense schema:

```sql
create extension if not exists pgcrypto;

create table if not exists public.expenses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  category text not null,
  category_key text generated always as (lower(btrim(category))) stored,
  amount numeric(12, 2) not null,
  spent_on date not null,
  note text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint expenses_category_not_blank check (btrim(category) <> ''),
  constraint expenses_amount_positive check (amount > 0)
);

create index if not exists idx_expenses_user_spent_on_desc
  on public.expenses (user_id, spent_on desc, created_at desc);

create index if not exists idx_expenses_user_category_key_spent_on
  on public.expenses (user_id, category_key, spent_on desc);

alter table public.expenses enable row level security;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_expenses_updated_at on public.expenses;

create trigger set_expenses_updated_at
before update on public.expenses
for each row
execute function public.set_updated_at();

drop policy if exists "Users can view own expenses" on public.expenses;
create policy "Users can view own expenses"
on public.expenses
for select
to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "Users can insert own expenses" on public.expenses;
create policy "Users can insert own expenses"
on public.expenses
for insert
to authenticated
with check ((select auth.uid()) = user_id);

drop policy if exists "Users can update own expenses" on public.expenses;
create policy "Users can update own expenses"
on public.expenses
for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

drop policy if exists "Users can delete own expenses" on public.expenses;
create policy "Users can delete own expenses"
on public.expenses
for delete
to authenticated
using ((select auth.uid()) = user_id);
```

## 22. Create the `savings_goals` Table

```sql
create extension if not exists pgcrypto;

create table if not exists public.savings_goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  target_amount numeric(12, 2) not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint savings_goals_name_not_blank check (btrim(name) <> ''),
  constraint savings_goals_target_positive check (target_amount > 0)
);

create index if not exists idx_savings_goals_user_created_at_desc
  on public.savings_goals (user_id, created_at desc);
```

## 23. Create the `savings_entries` Table

```sql
create table if not exists public.savings_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  goal_id uuid not null references public.savings_goals (id) on delete cascade,
  type text not null,
  amount numeric(12, 2) not null,
  entry_date date not null,
  note text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint savings_entries_type_valid check (type in ('contribution', 'withdrawal')),
  constraint savings_entries_amount_positive check (amount > 0)
);

create index if not exists idx_savings_entries_user_entry_date_desc
  on public.savings_entries (user_id, entry_date desc, created_at desc);

create index if not exists idx_savings_entries_user_goal_entry_date_desc
  on public.savings_entries (user_id, goal_id, entry_date desc, created_at desc);
```

## 24. Attach the `updated_at` Trigger to Savings Tables

This reuses the existing `public.set_updated_at()` function from section 2.

```sql
drop trigger if exists set_savings_goals_updated_at on public.savings_goals;

create trigger set_savings_goals_updated_at
before update on public.savings_goals
for each row
execute function public.set_updated_at();

drop trigger if exists set_savings_entries_updated_at on public.savings_entries;

create trigger set_savings_entries_updated_at
before update on public.savings_entries
for each row
execute function public.set_updated_at();
```

## 25. Enable Row Level Security for Savings Tables

```sql
alter table public.savings_goals enable row level security;
alter table public.savings_entries enable row level security;
```

## 26. Create RLS Policies for Savings Tables

### 26.1 Allow users to manage only their own savings goals

```sql
drop policy if exists "Users can view own savings goals" on public.savings_goals;
create policy "Users can view own savings goals"
on public.savings_goals
for select
to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "Users can insert own savings goals" on public.savings_goals;
create policy "Users can insert own savings goals"
on public.savings_goals
for insert
to authenticated
with check ((select auth.uid()) = user_id);

drop policy if exists "Users can update own savings goals" on public.savings_goals;
create policy "Users can update own savings goals"
on public.savings_goals
for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

drop policy if exists "Users can delete own savings goals" on public.savings_goals;
create policy "Users can delete own savings goals"
on public.savings_goals
for delete
to authenticated
using ((select auth.uid()) = user_id);
```

### 26.2 Allow users to manage only entries for their own goals

```sql
drop policy if exists "Users can view own savings entries" on public.savings_entries;
create policy "Users can view own savings entries"
on public.savings_entries
for select
to authenticated
using (
  (select auth.uid()) = user_id
  and exists (
    select 1
    from public.savings_goals
    where savings_goals.id = savings_entries.goal_id
      and savings_goals.user_id = (select auth.uid())
  )
);

drop policy if exists "Users can insert own savings entries" on public.savings_entries;
create policy "Users can insert own savings entries"
on public.savings_entries
for insert
to authenticated
with check (
  (select auth.uid()) = user_id
  and exists (
    select 1
    from public.savings_goals
    where savings_goals.id = savings_entries.goal_id
      and savings_goals.user_id = (select auth.uid())
  )
);

drop policy if exists "Users can update own savings entries" on public.savings_entries;
create policy "Users can update own savings entries"
on public.savings_entries
for update
to authenticated
using (
  (select auth.uid()) = user_id
  and exists (
    select 1
    from public.savings_goals
    where savings_goals.id = savings_entries.goal_id
      and savings_goals.user_id = (select auth.uid())
  )
)
with check (
  (select auth.uid()) = user_id
  and exists (
    select 1
    from public.savings_goals
    where savings_goals.id = savings_entries.goal_id
      and savings_goals.user_id = (select auth.uid())
  )
);

drop policy if exists "Users can delete own savings entries" on public.savings_entries;
create policy "Users can delete own savings entries"
on public.savings_entries
for delete
to authenticated
using (
  (select auth.uid()) = user_id
  and exists (
    select 1
    from public.savings_goals
    where savings_goals.id = savings_entries.goal_id
      and savings_goals.user_id = (select auth.uid())
  )
);
```

## 27. Create the Unified Finance Transaction View

This read-only view normalizes income, expense, and savings entry rows for the
recent transaction feed. `security_invoker = true` makes queries use the
caller's permissions and the RLS policies on the underlying tables.

```sql
create or replace view public.finance_transactions
with (security_invoker = true)
as
select
  'income-' || incomes.id::text as id,
  incomes.user_id,
  incomes.received_on as occurred_on,
  incomes.created_at,
  'Income'::text as transaction_type,
  incomes.source as category,
  incomes.amount,
  incomes.note
from public.incomes

union all

select
  'expense-' || expenses.id::text as id,
  expenses.user_id,
  expenses.spent_on as occurred_on,
  expenses.created_at,
  'Expense'::text as transaction_type,
  expenses.category,
  expenses.amount,
  expenses.note
from public.expenses

union all

select
  'savings-' || savings_entries.id::text as id,
  savings_entries.user_id,
  savings_entries.entry_date as occurred_on,
  savings_entries.created_at,
  'Savings'::text as transaction_type,
  savings_goals.name as category,
  case
    when savings_entries.type = 'withdrawal' then -savings_entries.amount
    else savings_entries.amount
  end as amount,
  coalesce(
    nullif(savings_entries.note, ''),
    case
      when savings_entries.type = 'withdrawal' then 'Savings withdrawal'
      else 'Savings contribution'
    end
  ) as note
from public.savings_entries
join public.savings_goals
  on savings_goals.id = savings_entries.goal_id
  and savings_goals.user_id = savings_entries.user_id;

revoke all on table public.finance_transactions from public, anon;
grant select on table public.finance_transactions to authenticated;
```
