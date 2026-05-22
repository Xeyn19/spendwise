# Supabase SQL for SpendWise

This file contains the SQL you need to run in the Supabase SQL Editor for the SpendWise auth setup.

Use it together with [supabase.md](/E:/my-codes/spendwise/supabase.md).

## Recommended Order

Run the sections in this order if you want to execute them step by step:

1. Create the `profiles` table
2. Create the `updated_at` trigger function
3. Create the automatic profile-insert trigger
4. Enable Row Level Security
5. Create the RLS policies

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
