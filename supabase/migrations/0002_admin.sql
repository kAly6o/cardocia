-- ============================================================================
-- Cardocia — Migration 0002 : espace d'administration
-- Ajout du rôle administrateur (profiles.is_admin) + protection anti-promotion.
-- ============================================================================

-- 1. Colonne de rôle administrateur.
alter table public.profiles
  add column if not exists is_admin boolean not null default false;

-- 2. Protection : seul un appel "service_role" (sans session utilisateur) peut
--    modifier is_admin. Empêche un utilisateur de se promouvoir lui-même via la
--    clé anon (la politique RLS "profiles_update_own" autorise sinon la mise à
--    jour de sa propre ligne).
create or replace function public.prevent_role_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.is_admin is distinct from old.is_admin then
    if auth.uid() is not null then
      raise exception 'Modification du rôle administrateur interdite.';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_prevent_role_change on public.profiles;
create trigger trg_prevent_role_change
  before update on public.profiles
  for each row execute function public.prevent_role_change();

-- ---------------------------------------------------------------------------
-- Activation du premier administrateur (à exécuter une seule fois, avec votre
-- propre adresse e-mail) :
--
--   update public.profiles set is_admin = true where email = 'vous@exemple.com';
-- ---------------------------------------------------------------------------
