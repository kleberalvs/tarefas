/* Configurações, instalação, atualização do app e inicialização. */
'use strict';
let INSTALL = null;
addEventListener('beforeinstallprompt', e => { e.preventDefault(); INSTALL = e; render(); });
async function installApp() {
  if (INSTALL) { INSTALL.prompt(); const r = await INSTALL.userChoice.catch(() => null); INSTALL = null; if (r && r.outcome === 'accepted') toast('App instalado'); render(); return; }
  modal(`<h2>Instalar o app</h2><p><b>iPhone/iPad (Safari):</b> toque em Compartilhar ${ic('export', 16)} e depois em <b>Adicionar à Tela de Início</b>.</p><p><b>Android (Chrome):</b> menu ⋮ → <b>Instalar app</b>.</p><p><b>Computador (Chrome ou Edge):</b> clique no ícone de instalar na barra de endereço, ou menu ⋮ → <b>Instalar Tarefas</b>.</p><div class="row end"><button class="btn red" onclick="closeModal()">Entendi</button></div>`);
}
const standalone = () => matchMedia('(display-mode: standalone)').matches || navigator.standalone;

VIEWS.settings = main => {
  const s = db.s, notif = 'Notification' in window ? Notification.permission : 'unsupported';
  const cals = GC.cals || [];
  main.innerHTML = headHtml('Configurações') + `<div class="scroll"><div class="sets">
  <section class="sgrp"><h2>${ic('sync', 18)}Conta e sincronização</h2>
    <div class="srow"><div class="row">${avatarHtml('md')}<div><b>${esc(s.name || 'Sem nome')}</b><p class="mut sm">Nome e foto do topo da barra lateral</p></div></div><button class="btn ghost sm" data-act="profile">Editar</button></div>
    ${CLOUD && SES ? `<div class="srow"><div><b>${esc(WHO)}</b><p class="mut sm" id="syncline">${esc(SYNC.txt)}</p></div><div class="row"><button class="btn ghost sm" data-act="chpass">${ic('key', 15)}Alterar senha</button><button class="btn ghost sm" data-act="logout">Sair</button></div></div>
      ${IS_ADMIN ? `<div class="srow"><div><b>Usuários</b><p class="mut sm">Você é o administrador: crie e gerencie acessos.</p></div><button class="btn ghost sm" data-act="go" data-to="users">Abrir</button></div>` : ADMIN_ERR ? `<div class="srow"><div><b>Administrador</b><p class="err">${esc(ADMIN_ERR)}</p></div><button class="btn ghost sm" data-act="admrecheck">Verificar de novo</button></div>` : ADMIN_FREE ? `<div class="srow"><div><b>Administrador</b><p class="mut sm">Ainda não há administrador. Assuma para poder criar usuários.</p></div><button class="btn red sm" data-act="claimadmin">Tornar-me administrador</button></div>` : ''}
      <p class="hint">Tudo o que você faz aqui aparece nos outros aparelhos em segundos. Sem internet, o app continua funcionando e envia depois.</p>`
    : CLOUD ? `<div class="srow"><div><b>Modo local</b><p class="mut sm">Os dados ficam só neste aparelho.</p></div><button class="btn red sm" data-act="login">Entrar</button></div>`
    : `<p class="mut">Nuvem não configurada: os dados ficam só neste aparelho.</p>`}
  </section>
  <section class="sgrp"><h2>${ic('sun', 18)}Aparência</h2>
    <div class="srow"><span>Tema</span><div class="seg">${[['auto', 'Automático'], ['light', 'Claro'], ['dark', 'Escuro']].map(([k, n]) => `<button class="${s.theme === k ? 'on' : ''}" data-act="sset" data-k="theme" data-v="${k}">${n}</button>`).join('')}</div></div>
    <div class="srow"><span>Semana começa</span><div class="seg">${[[0, 'Domingo'], [1, 'Segunda']].map(([k, n]) => `<button class="${s.weekStart === k ? 'on' : ''}" data-act="sset" data-k="weekStart" data-v="${k}" data-num="1">${n}</button>`).join('')}</div></div>
    <label class="srow"><span>Ao abrir o app, mostrar</span><select class="in sm" data-sk="start"><option value="home" ${(s.start || 'home') === 'home' ? 'selected' : ''}>Painel</option><option value="l/today" ${s.start === 'l/today' ? 'selected' : ''}>Hoje</option><option value="l/inbox" ${s.start === 'l/inbox' ? 'selected' : ''}>Caixa de entrada</option><option value="cal" ${s.start === 'cal' ? 'selected' : ''}>Calendário</option><option value="docs" ${s.start === 'docs' ? 'selected' : ''}>Documentos</option></select></label>
    <div class="srow"><span>Tamanho das letras <span class="mut sm">(neste aparelho)</span></span><span class="row fsrow"><button class="ib" data-act="fsz" data-d="-5" aria-label="Diminuir letras">A−</button><b id="fsv">${Math.round(fontScale() * 100)}%</b><button class="ib" data-act="fsz" data-d="5" aria-label="Aumentar letras">A+</button><button class="link" data-act="fsz" data-d="0">Padrão</button></span></div>
    <div class="srow"><span>Gatinhos pela tela <span class="mut sm">(<a href="#/pets">escolher</a>)</span></span><span class="sw-t"><input type="checkbox" data-petson ${petCfg().on ? 'checked' : ''}><span></span></span></div>
    <label class="srow"><span>Visual compacto</span><span class="sw-t"><input type="checkbox" data-sk="compact" ${s.compact ? 'checked' : ''}><span></span></span></label>
  </section>
  <section class="sgrp"><h2>${ic('palette', 18)}Estilo de cores</h2>
    <div class="skins">${SKINS.map(([k, n, d, a, sd, bg, tx]) => `<button class="skin${(s.skin || 'classico') === k ? ' on' : ''}" data-act="skin" data-k="${k}" style="--ka:${a};--ks:${sd};--kb:${bg};--kt:${tx}"><span class="sk"><span class="sks"><b></b><b></b><b></b><b></b></span><span class="skm"><span></span><span></span><span></span><em></em></span></span><span class="skn">${n}<small>${d}</small></span></button>`).join('')}</div>
  </section>
  <section class="sgrp"><h2>${ic('menu', 18)}Menu lateral</h2>
    <p class="hint">Por padrão, os ícones seguem a cor do estilo escolhido. Para mudar a cor de um item, use o seletor ao lado dele (↺ volta à cor do tema). Também dá para clicar com o botão direito (ou tocar nos três pontinhos) em qualquer item do menu.</p>
    ${[...NAV_TOP, ...NAV_LOW].map(id => { const p = navPref(id), [, icon, name] = NAVS[id]; return `<div class="navset"><span class="nic" style="--nc:${esc(p.c || 'var(--red)')}">${p.emoji ? `<span class="nemo">${esc(p.emoji)}</span>` : ic(icon, 18)}</span><span class="f1">${esc(p.name || name)}</span><input type="color" value="${esc(p.c || accentHex())}" data-navc="${id}" aria-label="Cor de ${esc(name)}" title="${p.c ? 'Cor personalizada' : 'Segue a cor do tema'}">${p.c ? `<button class="mini" data-act="navcreset" data-id="${id}" title="Voltar à cor do tema" aria-label="Voltar à cor do tema">↺</button>` : ''}<button class="ib" data-act="navmore" data-id="${id}" aria-label="Mais opções de ${esc(name)}">${ic('more', 18)}</button><span class="sw-t"><input type="checkbox" data-navshow="${id}" ${p.hide ? '' : 'checked'} aria-label="Mostrar ${esc(name)}"><span></span></span></div>`; }).join('')}
    <div class="row"><button class="btn ghost sm" data-act="navreset">Restaurar o menu padrão</button></div>
  </section>
  <section class="sgrp"><h2>${ic('todo', 18)}Tarefas</h2>
    <label class="srow"><span>Lista padrão para novas tarefas</span><select class="in sm" data-sk="defList">${db.l.filter(l => !l.arch).map(l => `<option value="${l.id}" ${s.defList === l.id ? 'selected' : ''}>${esc(l.name)}</option>`).join('')}</select></label>
    <label class="srow"><span>Manter no título o texto reconhecido (datas, #etiquetas…)</span><span class="sw-t"><input type="checkbox" data-sk="keepText" ${s.keepText ? 'checked' : ''}><span></span></span></label>
    <details class="help"><summary>Como funciona o texto inteligente</summary>
      <p>Ao digitar uma tarefa, o app reconhece:</p>
      <ul><li><b>Datas:</b> hoje, amanhã, depois de amanhã, sexta, próxima segunda, dia 15, 15/11, 3 de dezembro, em 3 dias, semana que vem, fim do mês</li>
      <li><b>Horários:</b> às 15h, 9h30, 14:00, meio-dia, de manhã, à tarde, à noite, das 14h às 16h, por 30 min</li>
      <li><b>Repetição:</b> todo dia, dias úteis, toda segunda e quarta, toda semana, todo dia 10, todo mês, a cada 2 semanas, todo ano</li>
      <li><b>Prioridade:</b> !alta, !média, !baixa (ou !1, !2, !3)</li>
      <li><b>Etiquetas:</b> #trabalho · <b>Lista:</b> ~compras · <b>Lembrete:</b> lembrar 30 min antes</li></ul>
      <p>Nos documentos, digite <b>@</b> para inserir datas, tarefas e outros documentos, e <b>/</b> para inserir blocos.</p></details>
  </section>
  <section class="sgrp"><h2>${ic('google', 18)}Google Agenda</h2>
    ${s.gClient ? `
      <div class="srow"><div><b>${gOn() ? 'Conectado' : GC.status === 'exp' ? 'Sessão expirada' : 'Não conectado'}</b><p class="mut sm">${gOn() ? 'Eventos aparecem no calendário e tarefas com data vão para a sua agenda.' : 'Toque em conectar para entrar com sua conta Google.'}</p></div>${gOn() ? `<button class="btn ghost sm" data-act="gdisc">Desconectar</button>` : `<button class="btn red sm" data-act="gconn">${ic('google', 16)}Conectar</button>`}</div>
      ${gOn() && cals.length ? `<p class="lab">Agendas exibidas no calendário</p><div class="cals">${cals.map(c => `<label class="calc"><input type="checkbox" data-gcal="${esc(c.id)}" ${(s.gCals || []).includes(c.id) ? 'checked' : ''}><span class="ldot" style="background:${esc(c.color || '#888')}"></span>${esc(c.name)}</label>`).join('')}</div>
        <label class="srow"><span>Agenda onde as tarefas são criadas</span><select class="in sm" data-sk="gTaskCal">${cals.filter(c => c.rw).map(c => `<option value="${esc(c.id)}" ${s.gTaskCal === c.id ? 'selected' : ''}>${esc(c.name)}</option>`).join('')}</select></label>` : ''}
      <label class="srow"><span>Enviar automaticamente tarefas com data</span><span class="sw-t"><input type="checkbox" data-sk="gPush" ${s.gPush ? 'checked' : ''}><span></span></span></label>
      <p class="hint">Alterações feitas no Google (mudar horário ou título de uma tarefa) voltam para o app quando o calendário é atualizado.</p>
      <details class="help"><summary>Trocar o ID do cliente</summary><div class="row"><input class="in" id="gcid" value="${esc(s.gClient)}"><button class="btn ghost sm" data-act="gsave">Salvar</button></div></details>`
    : `<p>Para ligar o Google Agenda, crie um "ID do cliente OAuth" gratuito no Google Cloud (passo a passo no arquivo LEIA-ME do projeto) e cole aqui:</p>
      <div class="row"><input class="in" id="gcid" placeholder="000000000000-xxxxxxxx.apps.googleusercontent.com"><button class="btn red sm" data-act="gsave">Salvar</button></div>
      <p class="hint">Origem autorizada a cadastrar no Google: <b>${esc(location.origin)}</b></p>`}
  </section>
  <section class="sgrp"><h2>${ic('bell', 18)}Notificações</h2>
    <div class="srow"><div><b>${PUSH.on ? 'Ativadas neste aparelho' : 'Desativadas neste aparelho'}</b><p class="mut sm">${PUSH.on ? 'Lembretes de tarefas, hábitos e fim do Pomodoro chegam mesmo com o app fechado.' : PUSH.supported ? 'Ative para receber lembretes mesmo com o app fechado.' : isIOS() ? 'No iPhone, primeiro instale o app na Tela de Início (Compartilhar → Adicionar à Tela de Início) e abra por lá.' : 'Este navegador não suporta notificações.'}</p>${PUSH.err ? `<p class="err">${esc(PUSH.err)}</p>` : ''}</div>${PUSH.on ? `<div class="row"><button class="btn ghost sm" data-act="pushtest">Testar</button><button class="btn ghost sm" data-act="pushoff">Desativar</button></div>` : PUSH.supported ? `<button class="btn red sm" data-act="pushon" ${PUSH.busy ? 'disabled' : ''}>${PUSH.busy ? 'Ativando…' : 'Ativar'}</button>` : ''}</div>
    <p class="hint">Ative em cada aparelho: celular e computador. ${notif === 'denied' ? '<b>As notificações estão bloqueadas para este site:</b> libere nas configurações do navegador ou do aparelho.' : ''}</p>
    <label class="srow"><span>Sons</span><span class="sw-t"><input type="checkbox" data-pk="sound" ${s.pomo.sound ? 'checked' : ''}><span></span></span></label>
  </section>
  <section class="sgrp"><h2>${ic('export', 18)}Dados</h2>
    <div class="row wrap"><button class="btn ghost sm" data-act="expall">${ic('dl', 16)}Exportar…</button><button class="btn ghost sm" data-act="impb">${ic('up', 16)}Importar backup</button><button class="btn ghost sm" data-act="imptt">${ic('up', 16)}Importar do TickTick</button></div>
    <p class="hint">No TickTick: Configurações → Conta → Gerar backup (CSV). Depois importe o arquivo aqui.</p>
    <p class="mut sm">${plural(db.t.filter(t => !t.del).length, 'tarefa', 'tarefas')} · ${plural(db.l.length, 'lista', 'listas')} · ${plural(db.d.filter(d => !d.del).length, 'documento', 'documentos')} · ${plural(db.h.length, 'hábito', 'hábitos')}</p>
  </section>
  <section class="sgrp"><h2>${ic('dl', 18)}App</h2>
    <div class="srow"><div><b>${standalone() ? 'Instalado neste aparelho' : 'Instalar no celular ou computador'}</b><p class="mut sm">Abre em tela própria, funciona sem internet e recebe atualizações automaticamente.</p></div>${standalone() ? '' : '<button class="btn ghost sm" data-act="install">Instalar</button>'}</div>
    <details class="help hide-m"><summary>Atalhos de teclado</summary><ul><li><b>Q</b> ou <b>N</b> nova tarefa</li><li><b>/</b> buscar</li><li><b>H</b> Hoje · <b>C</b> Calendário · <b>D</b> Documentos</li><li><b>Esc</b> fechar</li><li>Nos documentos: <b>/</b> blocos, <b>@</b> menções, <b>Tab</b> recuar, <b>Ctrl+Enter</b> marcar item</li></ul></details>
    <p class="mut sm">Versão ${APPV} · <button class="link" data-act="checkupd">Procurar atualização</button></p>
  </section>
  </div></div>`;
  main.querySelectorAll('[data-sk]').forEach(i => i.onchange = () => { s[i.dataset.sk] = i.type === 'checkbox' ? i.checked : i.value; put('s', s); if (i.dataset.sk === 'gTaskCal') toast('Novas tarefas irão para essa agenda'); });
  main.querySelectorAll('[data-navc]').forEach(i => i.onchange = () => { db.s.nav = db.s.nav || {}; db.s.nav[i.dataset.navc] = Object.assign({}, navPref(i.dataset.navc), { c: i.value }); put('s', s); });
  main.querySelectorAll('[data-navshow]').forEach(i => i.onchange = () => { db.s.nav = db.s.nav || {}; const p = Object.assign({}, navPref(i.dataset.navshow)); if (i.checked) delete p.hide; else p.hide = 1; db.s.nav[i.dataset.navshow] = p; put('s', s); });
  main.querySelectorAll('[data-pk]').forEach(i => i.onchange = () => { s.pomo[i.dataset.pk] = i.checked; put('s', s); });
  main.querySelectorAll('[data-gcal]').forEach(i => i.onchange = () => { const id = i.dataset.gcal; s.gCals = (s.gCals || []).filter(x => x !== id); if (i.checked) s.gCals.push(id); GC.loaded = ''; put('s', s); });
};
Object.assign(ACTS, {
  sset: b => { db.s[b.dataset.k] = b.dataset.num ? +b.dataset.v : b.dataset.v; put('s', db.s); if (b.dataset.k === 'theme') applyTheme(); },
  logout: () => signOut(),
  skin: b => { db.s.skin = b.dataset.k; put('s', db.s); applyTheme(); },
  navmore: b => navMenu(b.dataset.id, b),
  fsz: b => { const d = +b.dataset.d; const v = d ? clamp(Math.round((fontScale() * 100 + d)) / 100, .8, 1.4) : 1; try { localStorage.setItem('tt_fs', v); } catch (e) {} applyFontScale(); const e = $('#fsv'); if (e) e.textContent = Math.round(v * 100) + '%'; },
  navcreset: b => { const p = Object.assign({}, navPref(b.dataset.id)); delete p.c; db.s.nav[b.dataset.id] = p; put('s', db.s); },
  navreset: () => { db.s.nav = {}; put('s', db.s); toast('Menu restaurado'); },
  admrecheck: async () => { await checkAdmin(); render(true); toast(IS_ADMIN ? 'Você é o administrador' : ADMIN_FREE ? 'Pronto: já pode se tornar administrador' : ADMIN_ERR || 'Ainda não há permissão de administrador'); },
  login: () => goLogin(),
  gdisc: () => gDisconnect(),
  gsave: () => { const v = ($('#gcid').value || '').trim(); if (v && !/\.apps\.googleusercontent\.com$/.test(v)) { toast('Esse não parece um ID de cliente do Google'); return; } db.s.gClient = v; GC.client = null; put('s', db.s); if (v) gConnect(); },
  notif: () => { if ('Notification' in window) Notification.requestPermission().then(() => render(true)); },
  expall: b => exportMenu(b, { kind: 'all' }),
  impb: () => importFile('backup'),
  imptt: () => importFile('ticktick'),
  install: () => installApp(),
  checkupd: async () => { const r = await navigator.serviceWorker?.getRegistration(); if (r) { await r.update(); toast(r.waiting ? 'Nova versão disponível' : 'Você já está na versão mais recente'); if (r.waiting) showUpdate(r); } },
});

/* ---------- atualização do app ---------- */
function showUpdate(reg) {
  if ($('#upd')) return;
  const d = document.createElement('div'); d.id = 'upd';
  d.innerHTML = `<span>Nova versão disponível</span><button class="btn red sm">Atualizar</button>`;
  d.querySelector('button').onclick = () => { if (reg.waiting) reg.waiting.postMessage('skip'); else location.reload(); };
  document.body.appendChild(d);
}
function initSw() {
  if (!('serviceWorker' in navigator) || location.protocol === 'file:') return;
  navigator.serviceWorker.register('sw.js').then(reg => {
    if (reg.waiting && navigator.serviceWorker.controller) showUpdate(reg);
    reg.addEventListener('updatefound', () => { const w = reg.installing; w && w.addEventListener('statechange', () => { if (w.state === 'installed' && navigator.serviceWorker.controller) showUpdate(reg); }); });
    setInterval(() => reg.update().catch(() => {}), 30 * 60000);
    document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') reg.update().catch(() => {}); });
  }).catch(e => console.warn('sw', e));
  let reloading = false; const hadCtrl = !!navigator.serviceWorker.controller;
  navigator.serviceWorker.addEventListener('controllerchange', () => { if (hadCtrl && !reloading) { reloading = true; location.reload(); } });
}

/* ---------- início ---------- */
function fontScale() { try { return clamp(+(localStorage.getItem('tt_fs') || 1), .8, 1.4); } catch (e) { return 1; } }
function applyFontScale() { document.documentElement.style.setProperty('--fs', fontScale()); }
function hideSplash() {
  const s = $('#splash'); if (!s) return;
  const wait = Math.max(0, 1100 - (performance.now() || 0));
  setTimeout(() => { s.classList.add('out'); setTimeout(() => s.remove(), 600); }, wait);
}
function accentHex() {
  const v = getComputedStyle(document.documentElement).getPropertyValue('--red').trim();
  if (/^#[0-9a-f]{6}$/i.test(v)) return v;
  if (/^#[0-9a-f]{3}$/i.test(v)) return '#' + v.slice(1).split('').map(x => x + x).join('');
  return '#DC4C3E';
}
function afterRender() {
  if (typeof loadTaskImgs === 'function') loadTaskImgs($('#main'));
  const fm = $('#side a[href="#/focus"] .cnt');
  if (FS.run) { const a = $('#side a[href="#/focus"]'); if (a && !a.querySelector('#fmini')) a.insertAdjacentHTML('beforeend', `<span class="cnt red" id="fmini">${mmss(fLeft())}</span>`); }
  else if (!FS.run && document.title !== 'Tarefas') document.title = 'Tarefas';
}
function boot() {
  loadDb();
  initSnap(); pruneLog(); setTimeout(checkAch, 2500);
  applyTheme(); applyFontScale();
  if (!/type=recovery|error_description=|access_token=/.test(location.hash)) { const st = db.s.start || 'home'; history.replaceState(null, '', location.pathname + '#/' + st); }
  parseHash();
  initUi();
  onData(local => { render(); if (local !== false) schedPush(); checkAch(); });
  render(true);
  hideSplash();
  petsSync();
  startSync();
  initSw();
  checkReminders();
  setInterval(checkReminders, 30000);
  if (navigator.serviceWorker) navigator.serviceWorker.ready.then(() => pushRefresh()).catch(() => {});
  if (FS.run) syncTimer();
  setInterval(() => { if (R.v === 'list' && (R.id === 'today' || R.id === 'week')) { const d = today(); if (boot.d && boot.d !== d) render(true); boot.d = d; } }, 60000);
  boot.d = today();
  if (gcalReady() && !gOn() && localStorage.getItem('tt_gok')) GC.status = 'exp';
  if (gOn()) { gLoadCals().then(() => { render(); gFlush(); }).catch(() => {}); }
}
document.addEventListener('DOMContentLoaded', boot);
