-- Détail des actifs / dettes par catégorie (stocké en JSONB).
-- Les colonnes `assets` et `liabilities` restent les totaux (et `amount`
-- = assets - liabilities continue d'alimenter le classement).
alter table public.net_worth_entries
  add column if not exists asset_breakdown     jsonb not null default '{}'::jsonb,
  add column if not exists liability_breakdown jsonb not null default '{}'::jsonb;
