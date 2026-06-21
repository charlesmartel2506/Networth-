-- ============================================================
-- Networth App — fonctionnalités : salaire (prévisions) + dépenses
-- ============================================================

-- ----------------------------------------------------------------
-- TABLE : pay_settings (paramètres de paie, 1 ligne par utilisateur)
-- ----------------------------------------------------------------
create table if not exists public.pay_settings (
  user_id            uuid primary key references auth.users (id) on delete cascade,
  hourly_rate        numeric(10,2) not null default 0,
  hours_per_paycheck numeric(8,2)  not null default 0,
  frequency_days     int           not null default 14, -- 7=hebdo, 14=aux 2 semaines, etc.
  next_payday        date,
  updated_at         timestamptz   not null default now()
);

alter table public.pay_settings enable row level security;

drop policy if exists "pay_select_own" on public.pay_settings;
create policy "pay_select_own" on public.pay_settings
  for select using (user_id = auth.uid());

drop policy if exists "pay_insert_own" on public.pay_settings;
create policy "pay_insert_own" on public.pay_settings
  for insert with check (user_id = auth.uid());

drop policy if exists "pay_update_own" on public.pay_settings;
create policy "pay_update_own" on public.pay_settings
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ----------------------------------------------------------------
-- TABLE : expenses (dépenses, privées à chaque utilisateur)
-- ----------------------------------------------------------------
create table if not exists public.expenses (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users (id) on delete cascade,
  amount     numeric(12,2) not null,
  category   text,
  note       text,
  spent_at   date not null default current_date,
  created_at timestamptz not null default now()
);

create index if not exists expenses_user_idx
  on public.expenses (user_id, spent_at desc);

alter table public.expenses enable row level security;

drop policy if exists "expenses_select_own" on public.expenses;
create policy "expenses_select_own" on public.expenses
  for select using (user_id = auth.uid());

drop policy if exists "expenses_insert_own" on public.expenses;
create policy "expenses_insert_own" on public.expenses
  for insert with check (user_id = auth.uid());

drop policy if exists "expenses_update_own" on public.expenses;
create policy "expenses_update_own" on public.expenses
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "expenses_delete_own" on public.expenses;
create policy "expenses_delete_own" on public.expenses
  for delete using (user_id = auth.uid());
