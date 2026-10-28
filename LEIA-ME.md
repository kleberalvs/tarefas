# Tarefas

App pessoal de tarefas, calendário, documentos, foco e hábitos. Funciona no celular e no computador, instala como aplicativo, abre sem internet e sincroniza os aparelhos em tempo real.

## O que tem

- **Tarefas** com listas, pastas, seções, etiquetas, prioridades, subtarefas, itens de verificação, data de início e fim, repetição e lembretes.
- **Texto inteligente**: digite "Dentista amanhã às 15h #saúde !alta" e o app entende data, hora, etiqueta e prioridade. Também entende "toda segunda", "dias úteis", "dia 15", "das 14h às 16h", "~lista" e "lembrar 30 min antes".
- **Visões**: Caixa de entrada, Hoje, Amanhã, Próximos 7 dias, Todas, Concluídas, Lixeira, lista ou quadro (kanban) e Matriz de prioridades. Arraste para reordenar, mudar de seção, de lista ou de data.
- **Detalhe da tarefa**: descrição com formatação, anexos, vínculos com documentos e outras tarefas, histórico de foco.
- **Calendário**: mês, semana, 3 dias, dia e agenda; arraste tarefas sem data para o calendário; sincroniza com o Google Agenda nos dois sentidos.
- **Documentos**: editor de blocos com menu "/" (títulos, listas, tarefas, tabelas, citações, destaques, código, imagens, arquivos, subpáginas), menções com "@" (datas, tarefas, documentos), cores de texto e de fundo, estilos de bloco, fundo, textura, fonte, largura e capa da página.
- **Foco**: Pomodoro e cronômetro com estatísticas.
- **Hábitos**: metas diárias, dias da semana ou vezes por semana, sequências e calendário.
- **Exportação**: PDF (folha A4, inclusive download direto), Word (.docx), Markdown, HTML, texto, CSV, Excel (.xlsx), calendário (.ics), JSON e ZIP; backup completo e importação do TickTick.
- **Perfil**: nome e foto no topo da barra lateral; emojis em listas, pastas e etiquetas; pastas e subpastas para listas e documentos (arraste para organizar).
- **Capas**: foto de capa nas tarefas (aparece no cartão do quadro) e nos documentos (inclusive folha de rosto de página inteira).
- **Histórico**: tudo o que foi criado, alterado, concluído ou excluído, com restaurar e desfazer.
- **Usuários**: o administrador cria, edita, bloqueia e exclui acessos dentro do app.
- **Notificações**: lembretes de tarefas, hábitos e fim do Pomodoro mesmo com o app fechado.
- **Sons**: 13 sons ambientes para o Pomodoro (chuva, mar, floresta, lareira, ruídos...) e 6 alarmes.

## Primeira configuração (uma vez só)

### 1. Banco de dados (Supabase)
No Supabase, abra **SQL Editor → New query** e rode, um de cada vez:
1. `supabase/schema.sql` (tabela do app e anexos);
2. `supabase/atualizacao-2.sql` (administrador, notificações e proteção do painel da equipe).

### 2. Publicação (GitHub Pages)
No repositório: **Settings → Pages → Deploy from a branch → main / (root) → Save**. Endereço: https://kleberalvs.github.io/tarefas/

### 3. "Esqueceu a senha"
Supabase → **Authentication → URL Configuration → Redirect URLs → Add URL** → `https://kleberalvs.github.io/tarefas/` → Save.
Observação: sem um servidor de e-mail próprio, o Supabase envia poucos e-mails por hora.

### 4. Usuários e notificações com o app fechado (função "tarefas")
1. Supabase → **Edge Functions → Deploy a new function → Via Editor**. Nome: `tarefas`. Apague o conteúdo de exemplo, cole todo o arquivo `supabase/functions/tarefas/index.ts` e clique em **Deploy**.
2. **Edge Functions → Secrets** (ou Manage secrets): cadastre `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT` (ex.: `mailto:seu@email.com`) e `CRON_SECRET`. Os valores das chaves foram entregues na conversa com o Claude; a chave privada nunca fica no GitHub.
3. **Database → Extensions**: ative `pg_cron` e `pg_net`.
4. SQL Editor: rode `supabase/agendador-notificacoes.sql`, trocando `COLE_AQUI_O_CRON_SECRET` pelo mesmo valor do segredo `CRON_SECRET`.
5. No app: **Configurações → Tornar-me administrador** (só o primeiro usuário vê esse botão) e **Notificações → Ativar** em cada aparelho.

No iPhone, as notificações só funcionam com o app instalado na Tela de Início (iOS 16.4 ou mais recente).

### 5. Google Agenda (opcional)
1. Acesse **console.cloud.google.com** e crie um projeto (ex.: "Tarefas").
2. Em **APIs e serviços → Biblioteca**, ative a **Google Calendar API**.
3. Em **Google Auth Platform** (ou "Tela de consentimento OAuth"): **Externo**, nome do app e seu e-mail; em **Público-alvo**, adicione o seu Gmail como **usuário de teste**.
4. Em **Clientes** (ou **Credenciais → ID do cliente OAuth**): **Aplicativo da Web**, origem autorizada `https://kleberalvs.github.io`. Copie o **ID do cliente**.
5. No app: **Configurações → Google Agenda** → cole o ID → **Salvar** → **Conectar**.

## Instalar como app
- **iPhone (Safari):** Compartilhar → Adicionar à Tela de Início.
- **Android (Chrome):** menu ⋮ → Instalar app.
- **Computador (Chrome ou Edge):** ícone de instalar na barra de endereço.

## Como atualizar
1. Peça a mudança ao Claude, que edita o código e envia ao GitHub.
2. O GitHub Pages republica em 1 a 2 minutos.
3. Os aparelhos mostram "Nova versão disponível" → Atualizar.

## Limitações conhecidas
- No iPhone, notificações só funcionam com o app instalado na Tela de Início (iOS 16.4 ou mais recente).
- O PDF direto precisa de internet para carregar o gerador; sem internet, use "PDF pela impressão".
- O visual segue um estilo limpo de lista com cinza e vermelho, com layout, ícones e cores próprios.
