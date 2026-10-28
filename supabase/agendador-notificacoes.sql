-- Tarefas · agendador das notificações (roda a cada minuto)
-- Antes: publique a função "tarefas" e cadastre os segredos (veja o LEIA-ME).
-- Troque COLE_AQUI_O_CRON_SECRET pelo mesmo valor do segredo CRON_SECRET da função.
create extension if not exists pg_cron;
create extension if not exists pg_net;
select cron.unschedule(jobid) from cron.job where jobname = 'tarefas-notificacoes';
select cron.schedule('tarefas-notificacoes', '* * * * *', $job$
  select net.http_post(
    url := 'https://rpivtflokzakcxknbzzy.supabase.co/functions/v1/tarefas',
    headers := jsonb_build_object('Content-Type', 'application/json', 'x-cron', 'COLE_AQUI_O_CRON_SECRET',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJwaXZ0Zmxva3pha2N4a25ienp5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTMxNDMyMzgsImV4cCI6MjEwODcxOTIzOH0.3Yh9xmI6Q7kyZRWoWrGCfT4XjqoPkEIdlEuRlXJ1DeE'),
    body := '{"action":"push.tick"}'::jsonb
  );
$job$);
