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
- **Exportação**: PDF, Word (.docx), Markdown, HTML, texto, CSV, Excel (.xlsx), calendário (.ics), JSON e ZIP; backup completo e importação do TickTick.

## Primeira configuração (uma vez só)

### 1. Banco de dados (Supabase)
Usa o mesmo projeto Supabase do painel da equipe, com tabela própria. Cada conta só vê os próprios dados.

1. Abra o Supabase → **SQL Editor** → **New query**.
2. Cole todo o conteúdo de `supabase/schema.sql` e clique em **Run**.

Para entrar, use o mesmo e-mail e senha que você já tem no Supabase.

### 2. Publicação (GitHub Pages)
No repositório: **Settings → Pages → Source: Deploy from a branch → Branch: main / (root) → Save**. Em 1 a 2 minutos o app fica no ar no endereço que o GitHub mostrar nessa tela.

### 3. Google Agenda (opcional)
1. Acesse **console.cloud.google.com** e crie um projeto (ex.: "Tarefas").
2. Em **APIs e serviços → Biblioteca**, procure **Google Calendar API** e clique em **Ativar**.
3. Em **Google Auth Platform** (ou "Tela de consentimento OAuth"): escolha **Externo**, dê um nome ao app e informe seu e-mail. Em **Público-alvo**, adicione o seu Gmail como **usuário de teste**.
4. Em **Clientes** (ou **Credenciais → Criar credenciais → ID do cliente OAuth**): tipo **Aplicativo da Web**. Em **Origens JavaScript autorizadas**, adicione `https://kleberalvs.github.io`. Crie e copie o **ID do cliente** (termina em `.apps.googleusercontent.com`).
5. No app: **Configurações → Google Agenda** → cole o ID → **Salvar** → **Conectar**.

Por segurança, o Google libera o acesso por 1 hora de cada vez. Quando expirar, o calendário mostra o botão **Reconectar** (um toque). As alterações feitas nesse intervalo ficam guardadas e são enviadas ao reconectar.

## Instalar como app
- **iPhone (Safari):** Compartilhar → Adicionar à Tela de Início.
- **Android (Chrome):** menu ⋮ → Instalar app.
- **Computador (Chrome ou Edge):** ícone de instalar na barra de endereço.

## Como atualizar
1. Peça a mudança ao Claude, que edita o código e envia ao GitHub.
2. O GitHub Pages republica em 1 a 2 minutos.
3. Os aparelhos mostram "Nova versão disponível" → Atualizar.

## Limitações conhecidas
- Os lembretes avisam enquanto o app estiver aberto (no computador, também em segundo plano). Não há servidor de notificações push.
- No iPhone, notificações só funcionam com o app instalado na Tela de Início (iOS 16.4 ou mais recente).
- O visual segue um estilo limpo de lista com cinza e vermelho, com layout, ícones e cores próprios.
