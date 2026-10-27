# Tarefas — registro do projeto

Criado em 27/10/2026 na conversa com o Claude, a partir de uma amostra visual. Uso pessoal do Kleber.

## Arquitetura
- PWA estático (HTML, CSS e JavaScript sem etapa de build), hospedado no GitHub Pages.
- Scripts em ordem: `core.js` (dados, datas, texto inteligente, repetição) → `ui.js` (rotas, barra lateral, menus, seletor de datas, arrastar) → `files.js` (anexos) → `tasks.js` (listas, quadro, matriz, busca) → `detail.js` (detalhe da tarefa) → `cal.js` (calendário e Google) → `docs.js` (editor de documentos) → `focus.js` (foco, hábitos, lembretes) → `export.js` (exportações e importações) → `sync.js` (Supabase) → `app.js` (configurações e início).
- Dados em `localStorage` (`tt_db`): `t` tarefas, `l` listas, `f` pastas, `g` etiquetas, `d` documentos, `h` hábitos, `p` sessões de foco, `s` configurações.
- Nuvem: tabela `tarefas_registros` (chave `user_id, kind, id`), RLS por dono, Realtime ligado. Envia só o que mudou; conflito: vale a última gravação.
- Anexos: IndexedDB no aparelho + bucket privado `tarefas-anexos` (pasta por conta).
- Google Agenda: Google Identity Services (token de 1 hora) + Calendar API v3 direto do navegador. Tarefas com data viram eventos marcados com `extendedProperties.private.ttask`; mudanças feitas no Google voltam para a tarefa.
- Service worker `sw.js` (rede primeiro, cache offline). Cada versão nova muda `VERSAO` em `sw.js` e `APPV` em `js/sync.js`.

## Testes feitos
Chromium (Playwright) em tamanho de computador (1366×860) e de celular (390×844): todas as telas, texto inteligente, adicionar e concluir tarefas, repetição, arrastar para outra lista, editor de documentos (blocos, "/", "@", tabelas, tarefas no documento), estilos de página, exportação Word/Excel/Markdown/HTML (Word e Excel conferidos no LibreOffice) e sincronização entre dois aparelhos com servidor simulado. Não testado: Supabase real (depende do SQL), Google Agenda real (depende do ID do cliente), iPhone/Safari reais.
