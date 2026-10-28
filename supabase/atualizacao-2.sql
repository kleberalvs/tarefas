-- Tarefas · atualização 2: administrador, notificações push e proteção do painel
-- Execute uma vez no SQL Editor (Run). Pode rodar de novo sem problema.

-- 1) Administradores do app
create table if not exists public.tarefas_admins (user_id uuid primary key references auth.users(id) on delete cascade);
alter table public.tarefas_admins enable row level security;
drop policy if exists tt_admin_ve on public.tarefas_admins;
create policy tt_admin_ve on public.tarefas_admins for select to authenticated using (user_id = auth.uid());

create or replace function public.tarefas_sou_admin() returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.tarefas_admins where user_id = auth.uid()) $$;
create or replace function public.tarefas_admin_livre() returns boolean language sql stable security definer set search_path = public as $$
  select not exists (select 1 from public.tarefas_admins) $$;
create or replace function public.tarefas_virar_admin() returns boolean language plpgsql security definer set search_path = public as $$
begin
  if exists (select 1 from public.tarefas_admins) then return false; end if;
  insert into public.tarefas_admins (user_id) values (auth.uid());
  return true;
end $$;
revoke all on function public.tarefas_sou_admin() from public;
revoke all on function public.tarefas_admin_livre() from public;
revoke all on function public.tarefas_virar_admin() from public;
grant execute on function public.tarefas_sou_admin() to authenticated;
grant execute on function public.tarefas_admin_livre() to authenticated;
grant execute on function public.tarefas_virar_admin() to authenticated;

-- 2) Aparelhos que recebem notificações
create table if not exists public.tarefas_push (
  endpoint   text primary key,
  user_id    uuid not null default auth.uid() references auth.users(id) on delete cascade,
  p256dh     text not null,
  auth       text not null,
  tz         text,
  aparelho   text,
  criado_em  timestamptz not null default now()
);
alter table public.tarefas_push enable row level security;
drop policy if exists tt_push_dono on public.tarefas_push;
create policy tt_push_dono on public.tarefas_push for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

create table if not exists public.tarefas_push_enviados (chave text primary key, em timestamptz not null default now());
alter table public.tarefas_push_enviados enable row level security;

-- 3) Proteção do painel da equipe: quem foi criado "só para o Tarefas" não enxerga os dados do painel
do $$ begin
  if to_regclass('public.records') is not null then
    drop policy if exists "equipe autenticada" on public.records;
    create policy "equipe autenticada" on public.records for all to authenticated
      using (coalesce((auth.jwt() -> 'app_metadata' ->> 'somente_tarefas')::boolean, false) = false)
      with check (coalesce((auth.jwt() -> 'app_metadata' ->> 'somente_tarefas')::boolean, false) = false);
  end if;
  if to_regclass('public.shares') is not null then
    drop policy if exists shares_auth on public.shares;
    create policy shares_auth on public.shares for all to authenticated
      using (coalesce((auth.jwt() -> 'app_metadata' ->> 'somente_tarefas')::boolean, false) = false)
      with check (coalesce((auth.jwt() -> 'app_metadata' ->> 'somente_tarefas')::boolean, false) = false);
  end if;
end $$;
