-- Tarefas · banco de dados na nuvem (Supabase)
-- Usa o mesmo projeto do painel da equipe, mas com tabela própria.
-- Cada conta só enxerga e altera os PRÓPRIOS dados (tarefas, documentos, hábitos...).
-- Execute UMA vez: Supabase > SQL Editor > New query > cole tudo > Run. Pode rodar de novo sem problema.

-- 1) Registros do app (tarefa, lista, pasta, etiqueta, documento, hábito, sessão de foco, configurações)
create table if not exists public.tarefas_registros (
  user_id     uuid        not null default auth.uid() references auth.users(id) on delete cascade,
  kind        text        not null,
  id          text        not null,
  data        jsonb       not null,
  updated_at  timestamptz not null default now(),
  primary key (user_id, kind, id)
);

alter table public.tarefas_registros enable row level security;

drop policy if exists "dono le e altera" on public.tarefas_registros;
create policy "dono le e altera" on public.tarefas_registros
  for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create or replace function public.tarefas_touch() returns trigger
language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end $$;

drop trigger if exists tarefas_registros_touch on public.tarefas_registros;
create trigger tarefas_registros_touch before insert or update on public.tarefas_registros
  for each row execute function public.tarefas_touch();

-- Atualização em tempo real entre celular e computador
do $$
begin
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'tarefas_registros') then
    alter publication supabase_realtime add table public.tarefas_registros;
  end if;
end $$;

-- 2) Anexos (arquivos das tarefas e imagens dos documentos)
-- Cada arquivo fica numa pasta com o código da conta; ninguém mais consegue abrir.
insert into storage.buckets (id, name, public, file_size_limit)
values ('tarefas-anexos', 'tarefas-anexos', false, 52428800)
on conflict (id) do nothing;

drop policy if exists "tarefas anexos: ver os proprios" on storage.objects;
create policy "tarefas anexos: ver os proprios" on storage.objects
  for select to authenticated
  using (bucket_id = 'tarefas-anexos' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "tarefas anexos: enviar os proprios" on storage.objects;
create policy "tarefas anexos: enviar os proprios" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'tarefas-anexos' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "tarefas anexos: trocar os proprios" on storage.objects;
create policy "tarefas anexos: trocar os proprios" on storage.objects
  for update to authenticated
  using (bucket_id = 'tarefas-anexos' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "tarefas anexos: apagar os proprios" on storage.objects;
create policy "tarefas anexos: apagar os proprios" on storage.objects
  for delete to authenticated
  using (bucket_id = 'tarefas-anexos' and (storage.foldername(name))[1] = auth.uid()::text);
