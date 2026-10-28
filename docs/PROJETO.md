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

## Versão 2026.10.28-1 (14 melhorias pedidas em 27/10)
- Visual redesenhado (fonte Inter, ícones coloridos, cartões, animações), ajustes para iPhone/Android (áreas seguras, campos de 16px, gestos de deslizar, barra inferior translúcida).
- Perfil (nome + foto recortada no centro) no topo da barra lateral; emojis em listas, pastas e etiquetas (`js/emoji.js`).
- Capa nas tarefas (mostrada no quadro) e nos documentos (com posição, altura e folha de rosto).
- Pastas e subpastas (`f.kind` = 'l' listas ou 'd' documentos, `f.par` = pasta mãe); arrastar listas, pastas e documentos.
- Documentos: barra de formatação (fonte, tamanho, cores, alinhamento, listas, recuo, sobrescrito, inserir, localizar e substituir), desfazer/refazer, modo folha A4 com margens e marcadores de página, quebra de página, PDF A4 (impressão e download via html2pdf).
- Histórico (`js/log.js`, registros `a`), com restaurar e desfazer.
- Login sem "usar sem conta", com "Esqueceu a senha", "Crie uma senha nova" e "Alterar minha senha".
- Usuários (`js/users.js`) via Edge Function `tarefas` (service role só no servidor); tabela `tarefas_admins`; usuários "só Tarefas" (`app_metadata.somente_tarefas`) não acessam o painel.
- Notificações push (`js/push.js` + função `tarefas` + pg_cron a cada minuto); criptografia Web Push (RFC 8291/8292) feita com WebCrypto e testada contra um decodificador independente. Timer do Pomodoro na nuvem (registro `z:timer`).
- Sons ambientes e alarmes gerados com Web Audio (`js/sounds.js`).
