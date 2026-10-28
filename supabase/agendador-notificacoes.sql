-- Tarefas · agendador das notificações (roda a cada minuto)
-- Antes: publique a função "tarefas" e cadastre os segredos (veja o LEIA-ME).
-- Troque COLE_AQUI_O_CRON_SECRET pelo mesmo valor do segredo CRON_SECRET da função.
create extension if not exists pg_cron;
create extension if not exists pg_net;
select cron.unschedule(jobid) from cron.job where jobname = 'tarefas-notificacoes';
select cron.schedule('tarefas-notificacoes', '* * * * *', $job$
  select net.http_post(
    url := 'https://yirauybpwrkhhubkvril.supabase.co/functions/v1/tarefas',
    headers := jsonb_build_object('Content-Type', 'application/json', 'x-cron', 'COLE_AQUI_O_CRON_SECRET',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlpcmF1eWJwd3JraGh1Ymt2cmlsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTMxMjU1ODMsImV4cCI6MjEwODcwMTU4M30.s6VT9GWd2wBFebnTBSNtxtHVzd7Enr_I_h184UtMGD8'),
    body := '{"action":"push.tick"}'::jsonb
  );
$job$);
