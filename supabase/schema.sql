-- Tarefas · banco de dados na nuvem (Supabase)
-- Cada conta só enxerga e altera os PRÓPRIOS dados.
-- Execute uma vez no SQL Editor (Run). Pode rodar de novo sem problema.

-- 1) Tabela, regras de acesso e tempo real
create table if not exists public.tarefas_registros (
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  kind text not null,
  id text not null,
  data jsonb not null,
  updated_at timestamptz not null default now(),
  primary key (user_id, kind, id)
);
alter table public.tarefas_registros enable row level security;
drop policy if exists tt_dono on public.tarefas_registros;
create policy tt_dono on public.tarefas_registros for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create or replace function public.tarefas_touch() returns trigger language plpgsql as $$
begin new.updated_at := now(); return new; end $$;
drop trigger if exists tt_touch on public.tarefas_registros;
create trigger tt_touch before insert or update on public.tarefas_registros
  for each row execute function public.tarefas_touch();
do $$ begin
  if not exists (select 1 from pg_publication_tables where pubname='supabase_realtime' and tablename='tarefas_registros') then
    alter publication supabase_realtime add table public.tarefas_registros;
  end if;
end $$;

-- 2) Anexos (pasta própria de cada conta)
insert into storage.buckets (id, name, public, file_size_limit)
values ('tarefas-anexos', 'tarefas-anexos', false, 52428800)
on conflict (id) do nothing;
drop policy if exists tt_anexos on storage.objects;
create policy tt_anexos on storage.objects for all to authenticated
  using (bucket_id = 'tarefas-anexos' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'tarefas-anexos' and (storage.foldername(name))[1] = auth.uid()::text);
