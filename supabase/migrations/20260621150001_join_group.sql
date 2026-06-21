-- Fonction pour rejoindre un groupe via son code d'invitation.
-- SECURITY DEFINER car un non-membre ne peut pas SELECT le groupe
-- (bloqué par la RLS) avant d'en faire partie.
create or replace function public.join_group_by_code(code text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  gid uuid;
begin
  select id into gid
  from public.groups
  where invite_code = upper(trim(code));

  if gid is null then
    raise exception 'Code d''invitation invalide';
  end if;

  insert into public.group_members (group_id, user_id)
  values (gid, auth.uid())
  on conflict do nothing;

  return gid;
end;
$$;
