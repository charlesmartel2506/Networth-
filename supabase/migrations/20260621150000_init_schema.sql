-- ============================================================
-- Networth App — schéma initial
-- Modèle : profils, groupes d'amis, membres, entrées de net worth
-- Visibilité : classement (les membres d'un même groupe voient
-- le net worth des autres membres).
-- ============================================================

-- ----------------------------------------------------------------
-- TABLE : profiles (1 ligne par utilisateur, lié à auth.users)
-- ----------------------------------------------------------------
create table if not exists public.profiles (
  id           uuid primary key references auth.users (id) on delete cascade,
  username     text unique,
  display_name text,
  created_at   timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- ----------------------------------------------------------------
-- TABLE : groups (un groupe d'amis qui se comparent)
-- ----------------------------------------------------------------
create table if not exists public.groups (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  invite_code text not null unique default upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8)),
  owner_id    uuid not null references auth.users (id) on delete cascade,
  created_at  timestamptz not null default now()
);

alter table public.groups enable row level security;

-- ----------------------------------------------------------------
-- TABLE : group_members (qui appartient à quel groupe)
-- ----------------------------------------------------------------
create table if not exists public.group_members (
  group_id  uuid not null references public.groups (id) on delete cascade,
  user_id   uuid not null references auth.users (id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (group_id, user_id)
);

alter table public.group_members enable row level security;

-- ----------------------------------------------------------------
-- TABLE : net_worth_entries (historique des valeurs nettes)
-- ----------------------------------------------------------------
create table if not exists public.net_worth_entries (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  assets      numeric(14,2) not null default 0,
  liabilities numeric(14,2) not null default 0,
  amount      numeric(14,2) generated always as (assets - liabilities) stored,
  note        text,
  recorded_at date not null default current_date,
  created_at  timestamptz not null default now()
);

create index if not exists net_worth_entries_user_idx
  on public.net_worth_entries (user_id, recorded_at desc);

alter table public.net_worth_entries enable row level security;

-- ============================================================
-- FONCTIONS HELPER (SECURITY DEFINER pour éviter la récursion RLS)
-- ============================================================

-- Est-ce que l'utilisateur courant est membre de ce groupe ?
create or replace function public.is_group_member(gid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.group_members
    where group_id = gid and user_id = auth.uid()
  );
$$;

-- Est-ce que l'utilisateur courant partage au moins un groupe avec `target` ?
create or replace function public.shares_group_with(target uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.group_members me
    join public.group_members other on me.group_id = other.group_id
    where me.user_id = auth.uid()
      and other.user_id = target
  );
$$;

-- ============================================================
-- POLICIES RLS
-- ============================================================

-- PROFILES : on voit son propre profil + ceux des membres de ses groupes
drop policy if exists "profiles_select" on public.profiles;
create policy "profiles_select" on public.profiles
  for select using (
    id = auth.uid() or public.shares_group_with(id)
  );

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own" on public.profiles
  for insert with check (id = auth.uid());

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
  for update using (id = auth.uid()) with check (id = auth.uid());

-- GROUPS : on voit les groupes dont on est membre (ou qu'on possède)
drop policy if exists "groups_select" on public.groups;
create policy "groups_select" on public.groups
  for select using (
    owner_id = auth.uid() or public.is_group_member(id)
  );

drop policy if exists "groups_insert_owner" on public.groups;
create policy "groups_insert_owner" on public.groups
  for insert with check (owner_id = auth.uid());

drop policy if exists "groups_update_owner" on public.groups;
create policy "groups_update_owner" on public.groups
  for update using (owner_id = auth.uid()) with check (owner_id = auth.uid());

drop policy if exists "groups_delete_owner" on public.groups;
create policy "groups_delete_owner" on public.groups
  for delete using (owner_id = auth.uid());

-- GROUP_MEMBERS : on voit les membres des groupes dont on fait partie
drop policy if exists "group_members_select" on public.group_members;
create policy "group_members_select" on public.group_members
  for select using (
    user_id = auth.uid() or public.is_group_member(group_id)
  );

-- On peut s'ajouter soi-même à un groupe (rejoindre via code d'invitation)
drop policy if exists "group_members_insert_self" on public.group_members;
create policy "group_members_insert_self" on public.group_members
  for insert with check (user_id = auth.uid());

-- On peut se retirer soi-même d'un groupe
drop policy if exists "group_members_delete_self" on public.group_members;
create policy "group_members_delete_self" on public.group_members
  for delete using (user_id = auth.uid());

-- NET_WORTH_ENTRIES : on voit ses propres entrées + celles des membres de ses groupes
drop policy if exists "nw_select" on public.net_worth_entries;
create policy "nw_select" on public.net_worth_entries
  for select using (
    user_id = auth.uid() or public.shares_group_with(user_id)
  );

drop policy if exists "nw_insert_own" on public.net_worth_entries;
create policy "nw_insert_own" on public.net_worth_entries
  for insert with check (user_id = auth.uid());

drop policy if exists "nw_update_own" on public.net_worth_entries;
create policy "nw_update_own" on public.net_worth_entries
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "nw_delete_own" on public.net_worth_entries;
create policy "nw_delete_own" on public.net_worth_entries
  for delete using (user_id = auth.uid());

-- ============================================================
-- VUE : dernier net worth par utilisateur (pour le classement)
-- security_invoker = la RLS de l'utilisateur courant s'applique
-- ============================================================
create or replace view public.latest_net_worth
with (security_invoker = on) as
  select distinct on (e.user_id)
    e.user_id,
    e.amount,
    e.assets,
    e.liabilities,
    e.recorded_at
  from public.net_worth_entries e
  order by e.user_id, e.recorded_at desc, e.created_at desc;

-- ============================================================
-- TRIGGER : créer automatiquement un profil à l'inscription
-- ============================================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, username, display_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'username', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1))
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
