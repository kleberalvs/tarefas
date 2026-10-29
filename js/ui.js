/* Casca do app: rotas, barra lateral, abas do celular, menus, janelas, seletor de datas e arrastar-e-soltar. */
'use strict';
const R = { v: 'list', id: 'today', sel: null, drawer: false, q: '' };
const VIEWS = {};
const DROPS = [];

/* ---------- rotas ---------- */
function parseHash() {
  const h = location.hash.replace(/^#\/?/, '').split('/');
  const v = h[0] || '';
  if (v === 'l') { R.v = 'list'; R.id = decodeURIComponent(h[1] || 'today'); }
  else if (v === 'tag') { R.v = 'list'; R.id = 'tag:' + decodeURIComponent(h[1] || ''); }
  else if (v === 'doc') { R.v = 'doc'; R.id = decodeURIComponent(h[1] || ''); }
  else if (VIEWS[v]) { R.v = v; R.id = decodeURIComponent(h[1] || ''); }
  else { R.v = 'home'; R.id = ''; }
}
function go(path) {
  if (location.hash !== '#/' + path) location.hash = '#/' + path;
  else { parseHash(); render(true); }
  R.drawer = false;
}
addEventListener('hashchange', () => { parseHash(); R.drawer = false; closePop(); render(true); const m = $('#main .scroll'); if (m) m.scrollTop = 0; });

/* ---------- renderização ---------- */
let rq = 0;
function render(force) {
  if (force === true) { cancelAnimationFrame(rq); rq = 0; doRender(true); return; }
  if (rq) return;
  rq = requestAnimationFrame(() => { rq = 0; doRender(false); });
}
function busy(region) {
  const a = document.activeElement;
  return a && a !== document.body && region.contains(a) && a.closest('[data-keep]');
}
function doRender(force) {
  document.body.classList.toggle('side-off', !db.s.side);
  document.body.classList.toggle('drawer', !!R.drawer);
  document.body.classList.toggle('has-detail', !!R.sel && !!get('t', R.sel));
  document.body.classList.toggle('compact', !!db.s.compact);
  const side = $('#side'), main = $('#main'), det = $('#detail');
  if (force || !busy(side)) side.innerHTML = sideHtml();
  document.body.classList.toggle('side-rail', !side.querySelector('.spanel'));
  if (force || !busy(main)) {
    const sc = main.querySelector('.scroll'), top = sc ? sc.scrollTop : 0, key = R.v + ':' + R.id;
    const fn = VIEWS[R.v] || VIEWS.list;
    main.className = ''; main.removeAttribute('style');
    try { fn(main); } catch (e) { console.error(e); main.innerHTML = `<div class="empty"><p>Algo deu errado ao abrir esta tela.</p><p class="mut">${esc(e.message)}</p></div>`; }
    const sc2 = main.querySelector('.scroll'); if (sc2 && main.dataset.key === key) sc2.scrollTop = top;
    if (main.dataset.key !== key && !matchMedia('(prefers-reduced-motion: reduce)').matches) { main.classList.add('vin'); clearTimeout(main._vt); main._vt = setTimeout(() => main.classList.remove('vin'), 700); }
    main.dataset.key = key;
  }
  if (typeof renderDetail === 'function' && (force || !busy(det))) renderDetail(det);
  $('#tabbar').innerHTML = tabsHtml();
  if (typeof afterRender === 'function') afterRender();
}

/* ---------- barra lateral ---------- */
function countFor(id) {
  if (id.startsWith('tag:')) { const g = id.slice(4); return db.t.filter(t => live(t) && (t.tags || []).includes(g)).length; }
  const sm = SMART[id];
  if (sm && sm.f) return db.t.filter(t => live(t) && !t.par && sm.f(t)).length;
  return db.t.filter(t => live(t) && !t.par && t.list === id).length;
}
const NAVC = { home: '#DC4C3E', inbox: '#3B7DD8', today: '#2E9E6B', tomorrow: '#E8A400', week: '#9150C8', cal: '#DB4035', matrix: '#E8803A', focus: '#DB4035', habits: '#2E9E6B', docs: '#5B5BD6', all: '#808080', done: '#2E9E6B', trash: '#808080', log: '#8A6A55', users: '#3B7DD8', settings: '#808080' };
/* itens fixos do menu: cada um pode ter cor própria e ser ocultado */
const NAVS = {
  home: ['home', 'home', 'Painel', {}],
  inbox: ['l/inbox', 'inbox', 'Caixa de entrada', { drop: 'list:inbox', cnt: 'inbox' }], today: ['l/today', 'today', 'Hoje', { drop: 'smart:today', cnt: 'today' }],
  tomorrow: ['l/tomorrow', 'tomorrow', 'Amanhã', { drop: 'smart:tomorrow', cnt: 'tomorrow' }], week: ['l/week', 'week', 'Próximos 7 dias', { cnt: 'week' }],
  cal: ['cal', 'cal', 'Calendário', {}], matrix: ['matrix', 'matrix', 'Matriz de prioridades', {}], focus: ['focus', 'focus', 'Foco', {}],
  habits: ['habits', 'habit', 'Hábitos', {}], docs: ['docs', 'doc', 'Documentos', { drop: 'dfold:' }], notes: ['notes', 'note', 'Notas rápidas', {}], meet: ['meet', 'mic', 'Reuniões', {}],
  all: ['l/all', 'all', 'Todas', {}], done: ['l/done', 'done', 'Concluídas', {}], log: ['log', 'clock', 'Histórico', {}], trash: ['l/trash', 'trash', 'Lixeira', { drop: 'trash' }],
};
const NAV_TOP = ['home', 'inbox', 'today', 'tomorrow', 'week', 'cal', 'matrix', 'focus', 'habits', 'docs', 'notes', 'meet'], NAV_LOW = ['all', 'done', 'log', 'trash'];
const navPref = id => (db.s.nav || {})[id] || {};
function NV(id, cur, ov) {
  const p = navPref(id); if (p.hide) return '';
  const [href, icon, name, o] = NAVS[id];
  const on = id === 'docs' ? ((cur === 'docs' && !R.id) || cur === 'doc') : cur === id;
  return navItem(href, icon, p.name || name, { on, count: o.cnt && !p.nocnt ? countFor(o.cnt) : 0, red: id === 'today' && ov > 0, drop: o.drop, nc: p.c || 'var(--txt2)', emoji: p.emoji, ctx: 'nav:' + id });
}
function navMenu(id, anchor, at) {
  const p = navPref(id), set = (k, v) => { db.s.nav = db.s.nav || {}; db.s.nav[id] = Object.assign({}, navPref(id), { [k]: v }); if (v == null) delete db.s.nav[id][k]; put('s', db.s); };
  menu(anchor, [
    { html: `<div class="mtitle">Cor do ícone</div><div class="navcols">${['', ...COLORS, '#1D1D1F'].map(c => `<button class="swb${(p.c || '') === c ? ' on' : ''}" data-nc="${c}" style="--c:${c || 'var(--red)'}" aria-label="${c ? 'Cor ' + c : 'Cor do tema'}" title="${c ? '' : 'Cor do tema'}">${c ? '' : '↺'}</button>`).join('')}</div>` },
    { label: p.emoji ? 'Trocar emoji' : 'Usar um emoji no lugar do ícone', icon: 'star', act: () => emojiPicker(anchor, e => set('emoji', e || null), { none: 1 }) },
    { label: 'Renomear…', icon: 'edit', act: async () => { const n = await ask('Nome no menu', p.name || NAVS[id][2]); if (n !== null) set('name', n === NAVS[id][2] ? null : n); } },
    NAVS[id][3].cnt ? { label: p.nocnt ? 'Mostrar contador' : 'Ocultar contador', icon: 'hash', act: () => set('nocnt', p.nocnt ? null : 1) } : null,
    { sep: 1 },
    { label: 'Ocultar do menu', icon: 'eye', act: () => { set('hide', 1); toast('Oculto. Para mostrar de novo: Configurações → Menu lateral', 'Desfazer', () => set('hide', null)); } },
  ], { at });
  if (POP) POP.addEventListener('click', e => { const b = e.target.closest('[data-nc]'); if (b) { set('c', b.dataset.nc || null); closePop(); } });
}
function navItem(href, icon, name, opts = {}) {
  const cnt = opts.count ? `<span class="cnt${opts.red ? ' red' : ''}">${opts.count}</span>` : '';
  const lead = opts.emoji ? `<span class="nemo">${esc(opts.emoji)}</span>` : opts.color ? `<span class="ldot" style="background:${esc(opts.color)}"></span>` : `<span class="nic" style="--nc:${opts.nc || 'var(--mut)'}">${ic(icon, 19)}</span>`;
  return `<a class="nav${opts.on ? ' on' : ''}" href="#/${href}" style="--lvl:${opts.lvl || 0}" ${opts.drop ? `data-drop="${opts.drop}"` : ''} ${opts.drag ? `data-drag="${opts.drag}"` : ''} ${opts.ctx ? `data-ctx="${opts.ctx}"` : ''}>${lead}<span class="nm">${esc(name)}</span>${cnt}${opts.ctx ? `<button class="mini more" data-act="ctx" data-ctx="${opts.ctx}" aria-label="Opções de ${esc(name)}">${ic('more', 16)}</button>` : ''}</a>`;
}
const folderKids = (id, kind) => db.f.filter(f => (f.kind || 'l') === kind && (f.par || null) === id).sort((a, b) => (a.o || 0) - (b.o || 0));
function avatarHtml(cls = '') {
  const s = db.s, nm = (s.name || (WHO ? WHO.split('@')[0] : '') || 'Eu').trim();
  const ini = nm.split(/\s+/).map(w => w[0]).slice(0, 2).join('').toUpperCase();
  return `<span class="avatar ${cls}">${s.avatar ? `<img src="${esc(s.avatar)}" alt="">` : `<span>${esc(ini)}</span>`}</span>`;
}
function sideHtml() {
  const cur = R.v === 'list' ? R.id : R.v;
  const ov = db.t.filter(overdue).length;
  const lists = db.l.filter(l => l.id !== 'inbox' && !l.arch).sort((a, b) => (a.o || 0) - (b.o || 0));
  const li = (l, lvl) => navItem('l/' + l.id, 'list', l.name, { on: cur === l.id, count: countFor(l.id), color: l.emoji ? null : (l.color || '#808080'), emoji: l.emoji, drop: 'list:' + l.id, drag: 'l:' + l.id, ctx: 'list:' + l.id, lvl });
  const fold = (f, lvl, kind) => {
    const subs = folderKids(f.id, kind);
    const items = kind === 'l' ? lists.filter(l => l.folder === f.id) : [];
    const nDocs = kind === 'd' ? db.d.filter(d => !d.del && d.folder === f.id).length : 0;
    const on = kind === 'd' && R.v === 'docs' && R.id === f.id;
    const inner = subs.map(x => fold(x, lvl + 1, kind)).join('') + items.map(l => li(l, lvl + 1)).join('');
    return `<div class="fold${f.open === false ? ' shut' : ''}"><div class="fhead${on ? ' on' : ''}" style="--lvl:${lvl}" data-ctx="folder:${f.id}" data-drop="${kind === 'd' ? 'dfold' : 'folder'}:${f.id}" data-drag="f:${f.id}">
      <button class="mini fcar" data-act="fold" data-id="${f.id}" aria-label="${f.open === false ? 'Abrir' : 'Fechar'} pasta ${esc(f.name)}">${ic('chev', 14)}</button>
      ${f.emoji ? `<span class="nemo">${esc(f.emoji)}</span>` : `<span class="nic" style="--nc:${esc(f.color || 'var(--mut)')}">${ic('folder', 19)}</span>`}
      ${kind === 'd' ? `<span class="nm" data-act="go" data-to="docs/${f.id}">${esc(f.name)}</span>` : `<span class="nm" data-act="fold" data-id="${f.id}">${esc(f.name)}</span>`}${nDocs ? `<span class="cnt">${nDocs}</span>` : ''}
      <button class="mini more" data-act="ctx" data-ctx="folder:${f.id}" aria-label="Opções da pasta">${ic('more', 16)}</button></div>
      <div class="fbody">${inner || `<p class="hint" style="--lvl:${lvl + 1}">${kind === 'd' ? 'Arraste documentos para cá' : 'Arraste listas para cá'}</p>`}</div></div>`;
  };
  const lh = folderKids(null, 'l').map(f => fold(f, 0, 'l')).join('') + lists.filter(l => !l.folder || !get('f', l.folder)).map(l => li(l, 0)).join('');
  const dh = folderKids(null, 'd').map(f => fold(f, 0, 'd')).join('');
  const tags = db.g.slice().sort((a, b) => a.name.localeCompare(b.name, 'pt'));
  const sec = sideSection();
  /* trilho de ícones (à esquerda) */
  const RB = (id, icon, label, to, on) => { const p = NAVS[id] ? navPref(id) : {}; if (p.hide) return ''; return `<a class="rbtn${on ? ' on' : ''}" href="#/${to}" title="${esc(p.name || label)}" aria-label="${esc(p.name || label)}"${NAVS[id] ? ` data-ctx="nav:${id}"` : ''} style="--nc:${p.c || 'var(--red)'}">${p.emoji ? `<span class="nemo">${esc(p.emoji)}</span>` : ic(icon, 22)}${id === 'tasks' && ov ? '<i class="rdot"></i>' : ''}</a>`; };
  const rail = `<div class="rail">
    <button class="ravatar" data-act="profmenu" aria-label="Perfil, conquistas e configurações" title="${esc((db.s.name || WHO || 'Perfil').trim())}">${avatarHtml('sm')}<i class="sdot ${esc(SYNC.cls)}" id="sync" title="${esc(SYNC.txt)}"></i></button>
    ${RB('home', 'home', 'Painel', 'home', cur === 'home')}
    ${RB('tasks', 'todo', 'Tarefas', 'l/' + (db.s.lastList || 'today'), sec === 'tasks')}
    ${RB('cal', 'cal', 'Calendário', 'cal', cur === 'cal')}
    ${RB('matrix', 'matrix', 'Matriz de prioridades', 'matrix', cur === 'matrix')}
    ${RB('focus', 'focus', 'Foco', 'focus', cur === 'focus')}
    ${RB('habits', 'habit', 'Hábitos', 'habits', cur === 'habits')}
    ${RB('docs', 'doc', 'Documentos', 'docs', sec === 'docs')}
    ${RB('notes', 'note', 'Notas rápidas', 'notes', cur === 'notes')}
    ${RB('meet', 'mic', 'Reuniões', 'meet', cur === 'meet')}
    ${RB('search', 'search', 'Buscar', 'search', cur === 'search')}
    <span class="rsp"></span>
  </div>`;
  const head = (title, btns) => `<div class="sphead"><b>${title}</b><span class="sp"></span>${btns}<button class="ib hide-m" data-act="side" aria-label="Recolher painel" title="Recolher painel">${ic('side', 18)}</button></div>`;
  const tasksPanel = `${head('Tarefas', `<button class="ib" data-act="quick" aria-label="Adicionar tarefa" title="Adicionar tarefa (Q)">${ic('plus', 19)}</button>`)}
    <nav class="snav">${['today', 'tomorrow', 'week', 'inbox'].map(n => NV(n, cur, ov)).join('')}</nav>
    <hr class="sdiv">
    <div class="sgroup${sgShut('lists') ? ' shut' : ''}" data-drop="folder:">${sgHead('lists', 'Listas', `<button class="mini" data-act="newlist" aria-label="Nova lista" title="Nova lista">${ic('plus', 16)}</button><button class="mini" data-act="newfolder" data-k="l" aria-label="Nova pasta" title="Nova pasta">${ic('folder', 16)}</button>`)}<div class="sgbody">${lh || '<p class="hint">Crie listas para organizar suas tarefas</p>'}</div></div>
    <div class="sgroup${sgShut('tags') ? ' shut' : ''}">${sgHead('tags', 'Etiquetas', `<button class="mini" data-act="newtag" aria-label="Nova etiqueta">${ic('plus', 16)}</button>`)}<div class="sgbody">
      ${tags.length ? tags.map(g => `<a class="nav${cur === 'tag:' + g.id ? ' on' : ''}" href="#/tag/${g.id}" data-drop="tag:${g.id}" data-ctx="tag:${g.id}">${g.emoji ? `<span class="nemo">${esc(g.emoji)}</span>` : `<span class="nic" style="--nc:${esc(g.color || '#808080')}">${ic('tag', 19)}</span>`}<span class="nm">${esc(g.name)}</span><span class="cnt">${db.t.filter(t => live(t) && (t.tags || []).includes(g.id)).length || ''}</span><button class="mini more" data-act="ctx" data-ctx="tag:${g.id}" aria-label="Opções da etiqueta ${esc(g.name)}">${ic('more', 16)}</button></a>`).join('') : '<p class="hint">Use #etiqueta ao criar uma tarefa</p>'}
    </div></div>
    <nav class="snav low">${NAV_LOW.map(n => NV(n, cur, ov)).join('')}</nav>`;
  const docsPanel = `${head('Documentos', `<button class="ib" data-act="dnew" aria-label="Novo documento" title="Novo documento (D)">${ic('plus', 19)}</button>`)}
    <nav class="snav">${navItem('docs', 'doc', 'Todos os documentos', { on: cur === 'docs' && !R.id, nc: 'var(--red)', drop: 'dfold:' })}${navItem('notes', 'note', 'Notas rápidas', { on: cur === 'notes', nc: 'var(--red)' })}</nav>
    <hr class="sdiv">
    <div class="sgroup${sgShut('dfolds') ? ' shut' : ''}" data-drop="dfold:">${sgHead('dfolds', 'Pastas', `<button class="mini" data-act="newfolder" data-k="d" aria-label="Nova pasta de documentos" title="Nova pasta">${ic('plus', 16)}</button>`)}<div class="sgbody">${dh || '<p class="hint">Crie pastas para organizar documentos</p>'}</div></div>`;
  const panel = sec === 'docs' ? docsPanel : sec === 'tasks' || isMobile() ? tasksPanel : '';
  return rail + (panel ? `<div class="spanel">${panel}</div>` : '');
}
/* grupos do menu que abrem e fecham (Listas, Etiquetas, Pastas) */
const sgShut = g => !!((db.s.sgc || {})[g]);
const sgHead = (g, title, btns) => `<div class="sgh"><button class="sgt" data-act="sgtog" data-g="${g}" aria-expanded="${!sgShut(g)}">${ic('chev', 13)}<span>${title}</span></button>${btns}</div>`;
/* seção do menu: tarefas (listas e filtros) ou documentos mostram o painel ao lado do trilho */
function sideSection() {
  if (R.v === 'list' || R.v === 'tag' || R.v === 'log') return 'tasks';
  if (R.v === 'docs' || R.v === 'doc') return 'docs';
  return '';
}
/* perfil: nome e foto (recortada no centro) */
function editProfile() {
  const s = db.s;
  let img = null, zoom = 1, ox = 0, oy = 0, data = s.avatar || null;
  const el = modal(`<h2>Seu perfil</h2><div class="profed">
    <div class="avbox"><canvas width="240" height="240" aria-label="Pré-visualização da foto"></canvas></div>
    <div class="avctl">
      <label class="btn ghost sm filebtn">${ic('img', 16)}Escolher foto<input type="file" accept="image/*" hidden></label>
      <label class="lab">Zoom<input type="range" min="1" max="3" step="0.01" value="1" data-z></label>
      <label class="lab">Posição horizontal<input type="range" min="-1" max="1" step="0.01" value="0" data-x></label>
      <label class="lab">Posição vertical<input type="range" min="-1" max="1" step="0.01" value="0" data-y></label>
      <button class="link" data-rm>Remover foto</button>
    </div></div>
    <label class="lab">Nome que aparece no topo<input class="in" name="nm" value="${esc(s.name || '')}" maxlength="40" placeholder="Ex.: Kleber"></label>
    <div class="row end"><button class="btn ghost" data-cancel>Cancelar</button><button class="btn red" data-save>Salvar</button></div>`);
  const cv = el.querySelector('canvas'), cx = cv.getContext('2d');
  const draw = () => {
    cx.clearRect(0, 0, 240, 240);
    cx.save(); cx.beginPath(); cx.arc(120, 120, 120, 0, Math.PI * 2); cx.clip();
    if (img) {
      const sc = Math.max(240 / img.width, 240 / img.height) * zoom, w = img.width * sc, h = img.height * sc;
      const mx = (w - 240) / 2, my = (h - 240) / 2;
      cx.drawImage(img, -mx + ox * mx, -my + oy * my, w, h);
    } else { cx.fillStyle = '#DB4035'; cx.fillRect(0, 0, 240, 240); cx.fillStyle = '#fff'; cx.font = '700 90px system-ui'; cx.textAlign = 'center'; cx.textBaseline = 'middle'; cx.fillText(((el.querySelector('[name=nm]').value || 'Eu').trim()[0] || 'E').toUpperCase(), 120, 126); }
    cx.restore();
  };
  if (data) { img = new Image(); img.onload = draw; img.src = data; } else draw();
  el.querySelector('input[type=file]').onchange = e => { const f = e.target.files[0]; if (!f) return; const r = new FileReader(); r.onload = () => { img = new Image(); img.onload = () => { zoom = 1; ox = oy = 0; el.querySelector('[data-z]').value = 1; el.querySelector('[data-x]').value = 0; el.querySelector('[data-y]').value = 0; draw(); }; img.src = r.result; }; r.readAsDataURL(f); };
  el.querySelector('[data-z]').oninput = e => { zoom = +e.target.value; draw(); };
  el.querySelector('[data-x]').oninput = e => { ox = -e.target.value; draw(); };
  el.querySelector('[data-y]').oninput = e => { oy = -e.target.value; draw(); };
  el.querySelector('[name=nm]').oninput = () => { if (!img) draw(); };
  el.querySelector('[data-rm]').onclick = () => { img = null; draw(); };
  el.querySelector('[data-cancel]').onclick = closeModal;
  el.querySelector('[data-save]').onclick = () => {
    s.name = el.querySelector('[name=nm]').value.trim();
    if (img) { const out = document.createElement('canvas'); out.width = out.height = 256; const o = out.getContext('2d'); o.drawImage(cv, 0, 0, 240, 240, 0, 0, 256, 256); s.avatar = out.toDataURL('image/jpeg', .86); }
    else s.avatar = null;
    put('s', s); closeModal(); toast('Perfil atualizado');
  };
}
function tabsHtml() {
  const t = R.v, isT = t === 'list' || t === 'matrix';
  const b = (to, icon, name, on) => `<button class="tab${on ? ' on' : ''}" data-act="go" data-to="${to}">${ic(icon, 23)}<span>${name}</span></button>`;
  return b('home', 'home', 'Painel', t === 'home') + b('l/' + (R.v === 'list' ? R.id : (db.s.lastList || 'today')), 'todo', 'Tarefas', isT) + b('cal', 'cal', 'Calendário', t === 'cal') + b('docs', 'doc', 'Documentos', t === 'docs' || t === 'doc') + `<button class="tab${['habits', 'search', 'settings', 'focus', 'log', 'users', 'me', 'ach', 'pets', 'notes', 'meet'].includes(t) ? ' on' : ''}" data-act="more-tabs">${ic('more', 23)}<span>Mais</span></button>`;
}
/* cabeçalho padrão das telas */
/* "- " + espaço vira "• "; Enter continua a lista; Enter num item vazio encerra */
const BUL_RE = /^[\-–—*][ \u00a0]$/;
function bulletArea(ta) {
  ta.addEventListener('input', e => {
    const p = ta.selectionStart, ls = ta.value.lastIndexOf('\n', p - 1) + 1;
    if (BUL_RE.test(ta.value.slice(ls, p))) { ta.value = ta.value.slice(0, ls) + '• ' + ta.value.slice(p); ta.setSelectionRange(ls + 2, ls + 2); ta.dispatchEvent(new Event('input')); }
  });
  ta.addEventListener('keydown', e => {
    if (e.key !== 'Enter' || e.shiftKey || e.isComposing) return;
    const p = ta.selectionStart, ls = ta.value.lastIndexOf('\n', p - 1) + 1, line = ta.value.slice(ls, p);
    if (!line.startsWith('• ')) return;
    e.preventDefault();
    if (line.trim() === '•') { ta.value = ta.value.slice(0, ls) + ta.value.slice(p); ta.setSelectionRange(ls, ls); }
    else { ta.value = ta.value.slice(0, p) + '\n• ' + ta.value.slice(ta.selectionEnd); ta.setSelectionRange(p + 3, p + 3); }
    ta.dispatchEvent(new Event('input'));
  });
}
function bulletRich(el) {
  el.addEventListener('input', () => {
    const s = getSelection(); if (!s.rangeCount) return; const r = s.getRangeAt(0), n = r.startContainer;
    if (n.nodeType !== 3) return;
    const before = n.textContent.slice(0, r.startOffset), prev = n.previousSibling;
    const lineStart = !prev || prev.nodeName === 'BR' || prev.nodeName === 'DIV' || prev.nodeName === 'P';
    if (lineStart && BUL_RE.test(before)) { n.textContent = '• ' + n.textContent.slice(r.startOffset); const nr = document.createRange(); nr.setStart(n, 2); nr.collapse(true); s.removeAllRanges(); s.addRange(nr); }
  });
  el.addEventListener('keydown', e => {
    if (e.key !== 'Enter' || e.shiftKey || e.isComposing) return;
    const s = getSelection(); if (!s.rangeCount) return; const n = s.getRangeAt(0).startContainer;
    const txt = (n.nodeType === 3 ? n.textContent : n.textContent || '');
    if (!txt.startsWith('• ')) return;
    if (txt.trim() === '•') { e.preventDefault(); n.textContent = ''; return; }
    setTimeout(() => document.execCommand('insertText', false, '• '), 0);
  });
}
function folderPathName(f) { const p = []; let x = f, k = 0; while (x && k++ < 12) { p.unshift((x.emoji ? x.emoji + ' ' : '') + x.name); x = x.par ? get('f', x.par) : null; } return p.join(' / '); }
function headHtml(title, sub, right = '', opts = {}) {
  return `<header class="vhead">
    <button class="ib show-m" data-act="drawer" aria-label="Abrir menu">${ic('menu')}</button>
    <button class="ib side-btn" data-act="side" aria-label="Mostrar barra lateral">${ic('side')}</button>
    <div class="vt">${opts.pre || ''}<h1>${esc(title)}</h1>${sub ? `<p class="mut">${sub}</p>` : ''}</div>
    <div class="vr">${right}</div>
  </header>`;
}

/* ---------- menus, janelas e diálogos ---------- */
let POP = null;
function closePop() { if (POP) { POP.remove(); POP = null; } $('#scrim').classList.remove('on'); }
function placePop(el, anchor, opts = {}) {
  document.body.appendChild(el);
  POP = el;
  if (isMobile() && !opts.inline) {
    el.classList.add('sheet');
    $('#scrim').classList.add('on');
    sheetDrag(el, el, () => closePop());
    return;
  }
  const r = anchor && anchor.getBoundingClientRect ? anchor.getBoundingClientRect() : { left: innerWidth / 2 - 150, right: innerWidth / 2 + 150, top: innerHeight / 3, bottom: innerHeight / 3 };
  const w = el.offsetWidth, h = el.offsetHeight;
  let x = opts.right ? r.right - w : r.left, y = r.bottom + 6;
  if (opts.at) { x = opts.at.x; y = opts.at.y; }
  if (x + w > innerWidth - 8) x = innerWidth - w - 8;
  if (x < 8) x = 8;
  if (y + h > innerHeight - 8) y = Math.max(8, (opts.at ? opts.at.y : r.top) - h - 6);
  el.style.left = x + 'px'; el.style.top = y + 'px';
}
function menu(anchor, items, opts = {}) {
  closePop();
  const el = document.createElement('div');
  el.className = 'pop menu';
  el.setAttribute('role', 'menu');
  el.innerHTML = (opts.title ? `<div class="mtitle">${esc(opts.title)}</div>` : '') + items.filter(Boolean).map((it, i) => it.sep ? '<hr>' : it.head ? `<div class="mhead">${esc(it.head)}</div>` : it.html ? it.html :
    `<button role="menuitem" class="mi${it.danger ? ' danger' : ''}${it.on ? ' on' : ''}" data-i="${i}" ${it.disabled ? 'disabled' : ''}>${it.color ? `<span class="ldot" style="background:${esc(it.color)}"></span>` : it.icon ? ic(it.icon, 18) : '<span class="i0"></span>'}<span class="ml">${esc(it.label)}</span>${it.hint ? `<span class="mh">${esc(it.hint)}</span>` : ''}${it.on ? ic('check', 16) : ''}</button>`).join('');
  el.addEventListener('click', e => {
    const b = e.target.closest('[data-i]'); if (!b) return;
    const it = items.filter(Boolean)[+b.dataset.i];
    if (!it.keep) closePop();
    it.act && it.act(b);
  });
  placePop(el, anchor, opts);
  return el;
}
function pop(anchor, html, opts = {}) {
  closePop();
  const el = document.createElement('div');
  el.className = 'pop ' + (opts.cls || '');
  el.innerHTML = html;
  placePop(el, anchor, opts);
  return el;
}
/* folhas no celular: arrastar para baixo fecha (pela alça ou quando o conteúdo está no topo) */
function sheetDrag(el, target, onClose) {
  let y0 = null, dy = 0, t0 = 0, ok = false;
  el.addEventListener('touchstart', e => {
    const tg = e.target, top = target.getBoundingClientRect().top, onHandle = e.touches[0].clientY - top < 34;
    const sc = tg.closest && tg.closest('.nbgs,.dsgrid,.mtx,.aiout,textarea,input,[contenteditable],.lbstage');
    let n = tg, scrolled = false; while (n && n !== el.parentNode) { if (n.scrollTop > 0) { scrolled = true; break; } n = n.parentNode; }
    ok = onHandle || (!sc && !scrolled);
    if (!ok) return; y0 = e.touches[0].clientY; dy = 0; t0 = Date.now(); target.style.transition = 'none';
  }, { passive: true });
  el.addEventListener('touchmove', e => {
    if (y0 == null) return; dy = e.touches[0].clientY - y0;
    if (dy > 0) { target.style.transform = `translateY(${dy}px)`; if (e.cancelable) e.preventDefault(); } else if (dy < -8) { y0 = null; target.style.transform = ''; }
  }, { passive: false });
  el.addEventListener('touchend', () => {
    if (y0 == null) return; y0 = null;
    const fast = dy > 40 && Date.now() - t0 < 250;
    target.style.transition = 'transform .22s var(--ease)';
    if (dy > 110 || fast) { target.style.transform = 'translateY(110%)'; setTimeout(onClose, 180); }
    else target.style.transform = '';
  });
}
function modal(html, opts = {}) {
  closeModal(true);
  const m = $('#modal');
  m.innerHTML = `<div class="mbox ${opts.cls || ''}" role="dialog" aria-modal="true">${html}</div>`;
  m.classList.add('on');
  if (isMobile()) { const bx = m.firstChild; sheetDrag(bx, bx, () => { if (typeof NE !== 'undefined' && NE) closeNote(); else closeModal(true); }); }
  const f = m.querySelector('[autofocus]') || m.querySelector('input,textarea,select');
  if (f && !isMobile()) setTimeout(() => f.focus(), 30);
  return m.firstChild;
}
function closeModal(instant) {
  const m = $('#modal'); clearTimeout(m._ct);
  if (instant === true || !m.classList.contains('on') || matchMedia('(prefers-reduced-motion: reduce)').matches) { m.classList.remove('on', 'closing'); m.innerHTML = ''; return; }
  m.classList.add('closing'); m._ct = setTimeout(() => { m.classList.remove('on', 'closing'); m.innerHTML = ''; }, 190);
}
function ask(title, value = '', opts = {}) {
  return new Promise(res => {
    const el = modal(`<h2>${esc(title)}</h2>${opts.sub ? `<p class="mut">${esc(opts.sub)}</p>` : ''}<form><input class="in" value="${esc(value)}" placeholder="${esc(opts.ph || '')}" autofocus maxlength="200"><div class="row end"><button type="button" class="btn ghost" data-x>Cancelar</button><button class="btn red">${esc(opts.ok || 'Salvar')}</button></div></form>`);
    const inp = el.querySelector('input');
    el.querySelector('[data-x]').onclick = () => { closeModal(); res(null); };
    el.querySelector('form').onsubmit = e => { e.preventDefault(); const v = inp.value.trim(); closeModal(); res(v || null); };
    setTimeout(() => { inp.focus(); inp.select(); }, 40);
  });
}
function confirmBox(title, sub, ok = 'Excluir') {
  return new Promise(res => {
    const el = modal(`<h2>${esc(title)}</h2>${sub ? `<p class="mut">${esc(sub)}</p>` : ''}<div class="row end"><button class="btn ghost" data-x>Cancelar</button><button class="btn red" data-ok>${esc(ok)}</button></div>`);
    el.querySelector('[data-x]').onclick = () => { closeModal(); res(false); };
    el.querySelector('[data-ok]').onclick = () => { closeModal(); res(true); };
  });
}
function colorRow(cur, name = 'color') {
  return `<div class="colors">${COLORS.map(c => `<label class="sw" style="--c:${c}"><input type="radio" name="${name}" value="${c}" ${c === cur ? 'checked' : ''} aria-label="Cor ${c}"><span></span></label>`).join('')}</div>`;
}

/* ---------- listas, pastas e etiquetas ---------- */
/* campo de ícone (emoji) usado nos formulários */
function iconField(cur) { return `<div class="row"><button type="button" class="emobtn" data-emo data-pop>${cur ? esc(cur) : ic('plus', 18)}</button><span class="mut sm">Ícone (emoji) — opcional</span><input type="hidden" name="emoji" value="${esc(cur || '')}"></div>`; }
function bindIconField(el) {
  const b = el.querySelector('[data-emo]'); if (!b) return;
  b.onclick = () => emojiPicker(b, e => { el.querySelector('[name=emoji]').value = e || ''; b.innerHTML = e ? esc(e) : ic('plus', 18); }, { none: 1 });
}
function folderOptions(kind, sel, exclude) {
  const out = [];
  const walk = (par, lvl) => folderKids(par, kind).forEach(f => { if (exclude && (f.id === exclude)) return; out.push(`<option value="${f.id}" ${sel === f.id ? 'selected' : ''}>${'  '.repeat(lvl)}${esc((f.emoji ? f.emoji + ' ' : '') + f.name)}</option>`); walk(f.id, lvl + 1); });
  walk(null, 0);
  return out.join('');
}
function editList(l, preset = {}) {
  const isNew = !l;
  l = l || Object.assign({ id: uid(), name: '', color: COLORS[db.l.length % COLORS.length], view: 'list', sec: [], o: db.l.length + 1 }, preset);
  const el = modal(`<h2>${isNew ? 'Nova lista' : 'Editar lista'}</h2><form>
    <label class="lab">Nome<input class="in" name="n" value="${esc(l.name)}" required maxlength="80" autofocus placeholder="Ex.: Casa, Estudos 📚"></label>
    <span class="lab">Ícone</span>${iconField(l.emoji)}
    <span class="lab">Cor</span>${colorRow(l.color)}
    <label class="lab">Pasta<select class="in" name="f"><option value="">Sem pasta</option>${folderOptions('l', l.folder)}</select></label>
    <label class="lab">Visualização<select class="in" name="v"><option value="list" ${l.view !== 'board' ? 'selected' : ''}>Lista</option><option value="board" ${l.view === 'board' ? 'selected' : ''}>Quadro (kanban)</option></select></label>
    <div class="row end"><button type="button" class="btn ghost" data-x>Cancelar</button><button class="btn red">${isNew ? 'Criar' : 'Salvar'}</button></div></form>`);
  bindIconField(el);
  el.querySelector('[data-x]').onclick = closeModal;
  el.querySelector('form').onsubmit = e => {
    e.preventDefault();
    const f = new FormData(e.target);
    l.name = f.get('n').trim(); l.color = f.get('color') || l.color; l.folder = f.get('f') || null; l.view = f.get('v'); l.emoji = f.get('emoji') || null;
    if (l.view === 'board' && !(l.sec || []).length) l.sec = [{ id: uid(), name: 'A fazer' }, { id: uid(), name: 'Em andamento' }, { id: uid(), name: 'Feito' }];
    put('l', l); closeModal();
    if (isNew) go('l/' + l.id);
  };
}
function editFolder(f, kind = 'l', par = null) {
  const isNew = !f;
  f = f || { id: uid(), name: '', kind, par, o: db.f.length + 1, open: true };
  kind = f.kind || 'l';
  const el = modal(`<h2>${isNew ? (kind === 'd' ? 'Nova pasta de documentos' : 'Nova pasta de listas') : 'Editar pasta'}</h2><form>
    <label class="lab">Nome<input class="in" name="n" value="${esc(f.name)}" required maxlength="60" autofocus placeholder="Ex.: Projetos"></label>
    <span class="lab">Ícone</span>${iconField(f.emoji)}
    <span class="lab">Cor do ícone</span>${colorRow(f.color || '')}
    <label class="lab">Dentro de<select class="in" name="p"><option value="">Nenhuma (raiz)</option>${folderOptions(kind, f.par, f.id)}</select></label>
    <div class="row end"><button type="button" class="btn ghost" data-x>Cancelar</button><button class="btn red">${isNew ? 'Criar' : 'Salvar'}</button></div></form>`);
  bindIconField(el);
  el.querySelector('[data-x]').onclick = closeModal;
  el.querySelector('form').onsubmit = e => {
    e.preventDefault();
    const d = new FormData(e.target), p = d.get('p') || null;
    if (p && folderAncestors(p).includes(f.id)) { toast('Não dá para colocar a pasta dentro dela mesma'); return; }
    f.name = d.get('n').trim(); f.emoji = d.get('emoji') || null; f.color = d.get('color') || null; f.par = p;
    put('f', f); closeModal();
    if (isNew && kind === 'd') go('docs/' + f.id);
  };
}
function folderAncestors(id) { const out = []; let x = get('f', id), k = 0; while (x && k++ < 30) { out.push(x.id); x = x.par ? get('f', x.par) : null; } return out; }
async function newFolder(kind = 'l', par = null) { editFolder(null, kind, par); }
function editTag(g) {
  const isNew = !g;
  g = g || { id: uid(), name: '', color: COLORS[db.g.length % COLORS.length] };
  const el = modal(`<h2>${isNew ? 'Nova etiqueta' : 'Editar etiqueta'}</h2><form><label class="lab">Nome<input class="in" name="n" value="${esc(g.name)}" required maxlength="40" autofocus></label><span class="lab">Ícone</span>${iconField(g.emoji)}<span class="lab">Cor</span>${colorRow(g.color)}<div class="row end"><button type="button" class="btn ghost" data-x>Cancelar</button><button class="btn red">Salvar</button></div></form>`);
  bindIconField(el);
  el.querySelector('[data-x]').onclick = closeModal;
  el.querySelector('form').onsubmit = e => { e.preventDefault(); const f = new FormData(e.target); g.name = f.get('n').trim().replace(/^#/, '').replace(/\s+/g, '-'); g.color = f.get('color') || g.color; g.emoji = f.get('emoji') || null; put('g', g); closeModal(); };
}
function ctxMenu(spec, anchor, at) {
  const [k, id] = spec.split(':');
  if (k === 'nav') return navMenu(id, anchor, at);
  if (k === 'doc') { const d = get('d', id); if (!d) return; menu(anchor, [{ label: 'Mudar estilo', icon: 'spark', act: () => docStyle(d) }, { label: 'Abrir', icon: 'doc', act: () => go('doc/' + d.id) }, { label: d.fav ? 'Remover dos favoritos' : 'Favoritar', icon: 'star', act: () => { d.fav = !d.fav; put('d', d); } }], { at }); return; }
  if (k === 'list') {
    const l = get('l', id); if (!l) return;
    menu(anchor, [
      { label: 'Editar lista', icon: 'edit', act: () => editList(l) },
      { label: 'Trocar ícone…', icon: 'star', act: () => emojiPicker(anchor, e => { l.emoji = e; put('l', l); }, { none: 1 }) },
      { label: 'Mover para pasta…', icon: 'folder', act: () => menu(anchor, [{ label: 'Sem pasta', on: !l.folder, act: () => { l.folder = null; put('l', l); } }, ...db.f.filter(f => (f.kind || 'l') === 'l').map(f => ({ label: (f.emoji ? f.emoji + ' ' : '') + f.name, icon: 'folder', on: l.folder === f.id, act: () => { l.folder = f.id; put('l', l); } }))], { at }) },
      { label: 'Exportar…', icon: 'export', act: () => exportMenu(anchor, { kind: 'list', id }) },
      { label: 'Duplicar', icon: 'copy', act: () => { const n = clone(l); n.id = uid(); n.name += ' (cópia)'; put('l', n, { silent: true }); db.t.filter(t => t.list === id && !t.del).forEach(t => { const c = clone(t); c.id = uid(); c.list = n.id; c.gc = null; put('t', c, { silent: true }); }); changed(); toast('Lista duplicada'); } },
      { label: 'Arquivar', icon: 'arch', act: () => { l.arch = true; put('l', l); toast('Lista arquivada', 'Desfazer', () => { l.arch = false; put('l', l); }); } },
      { sep: 1 },
      { label: 'Excluir lista', icon: 'trash', danger: 1, act: async () => { if (await confirmBox('Excluir a lista "' + l.name + '"?', 'As tarefas dela vão para a Lixeira.')) { db.t.filter(t => t.list === id).forEach(t => { t.del = Date.now(); t.list = 'inbox'; put('t', t, { silent: true }); }); hardDel('l', id); if (R.id === id) go('l/today'); } } },
    ], { at });
  } else if (k === 'folder') {
    const f = get('f', id); if (!f) return;
    const kind = f.kind || 'l';
    menu(anchor, [
      { label: 'Editar pasta', icon: 'edit', act: () => editFolder(f) },
      { label: 'Nova subpasta', icon: 'folder', act: () => editFolder(null, kind, id) },
      kind === 'l' ? { label: 'Nova lista nesta pasta', icon: 'plus', act: () => editList(null, { folder: id }) } : { label: 'Novo documento nesta pasta', icon: 'plus', act: () => { const d = newDoc({ folder: id, o: Date.now() }); go('doc/' + d.id); } },
      { sep: 1 },
      { label: 'Excluir pasta (mantém o conteúdo)', icon: 'trash', danger: 1, act: async () => {
        if (!await confirmBox('Excluir a pasta "' + f.name + '"?', 'O que estiver dentro vai para a pasta de cima.')) return;
        db.l.filter(l => l.folder === id).forEach(l => { l.folder = f.par || null; put('l', l, { silent: true }); });
        db.d.filter(d => d.folder === id).forEach(d => { d.folder = f.par || null; put('d', d, { silent: true }); });
        db.f.filter(x => x.par === id).forEach(x => { x.par = f.par || null; put('f', x, { silent: true }); });
        hardDel('f', id);
      } },
    ], { at });
  } else if (k === 'tag') {
    const g = get('g', id); if (!g) return;
    menu(anchor, [
      { html: `<div class="mtitle">Cor da etiqueta</div><div class="navcols">${COLORS.concat(['#1D1D1F']).map(c => `<button class="swb${(g.color || '') === c ? ' on' : ''}" data-tc="${c}" style="--c:${c}" aria-label="Cor ${c}"></button>`).join('')}</div>` },
      { label: g.emoji ? 'Trocar emoji' : 'Usar um emoji', icon: 'star', act: () => emojiPicker(anchor, e => { g.emoji = e || null; put('g', g); }, { none: 1 }) },
      { label: 'Editar etiqueta', icon: 'edit', act: () => editTag(g) },
      { sep: 1 },
      { label: 'Excluir etiqueta', icon: 'trash', danger: 1, act: () => { db.t.forEach(t => { if ((t.tags || []).includes(id)) { t.tags = t.tags.filter(x => x !== id); put('t', t, { silent: true }); } }); hardDel('g', id); if (R.id === 'tag:' + id) go('l/today'); } },
    ], { at });
    if (POP) POP.addEventListener('click', e => { const b = e.target.closest('[data-tc]'); if (b) { g.color = b.dataset.tc; put('g', g); closePop(); } });
  }
}
/* arrastar listas e pastas */
DROPS.push((src, dst, before) => {
  const [sk, sid] = [src.slice(0, src.indexOf(':')), src.slice(src.indexOf(':') + 1)];
  const [dk, did] = [dst.slice(0, dst.indexOf(':')), dst.slice(dst.indexOf(':') + 1)];
  if (sk === 'l') {
    const l = get('l', sid); if (!l) return true;
    if (dk === 'folder') { l.folder = did || null; put('l', l); toast(did ? 'Lista movida para ' + get('f', did).name : 'Lista fora das pastas'); return true; }
    if (dk === 'list' && did !== sid && did !== 'inbox') {
      const t = get('l', did); l.folder = t.folder || null;
      const sib = db.l.filter(x => x.id !== sid && (x.folder || null) === (l.folder || null)).sort((a, b) => (a.o || 0) - (b.o || 0));
      const i = sib.indexOf(t); sib.splice(before ? i : i + 1, 0, l);
      sib.forEach((x, k) => { x.o = k + 1; put('l', x, { silent: true }); }); changed(); return true;
    }
    return true;
  }
  if (sk === 'f') {
    const f = get('f', sid); if (!f) return true;
    if ((dk === 'folder' || dk === 'dfold')) {
      if ((dk === 'dfold') !== ((f.kind || 'l') === 'd')) { toast('Pastas de listas e de documentos ficam separadas'); return true; }
      if (did && folderAncestors(did).includes(f.id)) { toast('Não dá para colocar a pasta dentro dela mesma'); return true; }
      f.par = did || null; put('f', f); return true;
    }
    return true;
  }
});
/* ---------- seletor de data ----------
   v = { date:'YYYY-MM-DD'|null, time:'HH:MM'|null, end:'HH:MM'|null, sdate: início, rep, rem:[min] } */
function datePicker(anchor, v, onSave, opts = {}) {
  v = Object.assign({ date: null, time: null, end: null, sdate: null, rep: null, rem: [] }, clone(v));
  let month = (v.date || today()).slice(0, 7);
  const el = pop(anchor, '', { cls: 'dp', right: opts.right });
  const T = today();
  const quick = [['Hoje', T, 'today'], ['Amanhã', addD(T, 1), 'tomorrow'], ['Próx. semana', addD(sow(T), 7 + (weekStart() === 0 ? 1 : 0)), 'week'], ['Sem data', null, 'x']];
  const remOpts = [[0, 'Na hora'], [5, '5 min antes'], [15, '15 min antes'], [30, '30 min antes'], [60, '1 hora antes'], [1440, '1 dia antes']];
  const repOpts = [['', 'Não repetir'], ['d', 'Todo dia'], ['wd', 'Dias úteis'], ['w', 'Toda semana'], ['m', 'Todo mês'], ['y', 'Todo ano'], ['custom', 'Personalizar…']];
  const repKey = r => !r ? '' : r.f === 'w' && r.wd && r.wd.join() === '1,2,3,4,5' && (r.n || 1) === 1 ? 'wd' : (r.n || 1) === 1 && !(r.f === 'w' && r.wd && r.wd.length > 1) && !r.until ? r.f : 'custom';
  const draw = () => {
    const [y, m] = month.split('-').map(Number);
    const first = `${month}-01`, start = sow(first), cells = [];
    for (let i = 0; i < 42; i++) cells.push(addD(start, i));
    el.innerHTML = `
      <div class="dq">${quick.map(q => `<button class="dqb${(q[1] === v.date || (!q[1] && !v.date)) ? ' on' : ''}" data-q="${q[1] || ''}">${ic(q[2] === 'x' ? 'x' : q[2], 18)}<span>${q[0]}</span></button>`).join('')}</div>
      <div class="dmh"><button class="ib" data-m="-1" aria-label="Mês anterior">${ic('left', 18)}</button><b>${cap(monNames[m - 1])} ${y}</b><button class="ib" data-m="1" aria-label="Próximo mês">${ic('right', 18)}</button></div>
      <div class="dgrid">${[0, 1, 2, 3, 4, 5, 6].map(i => `<span class="dwd">${wdShort[(i + weekStart()) % 7][0].toUpperCase()}</span>`).join('')}
      ${cells.map(c => `<button class="dd${c.slice(0, 7) !== month ? ' out' : ''}${c === T ? ' today' : ''}${c === v.date ? ' sel' : ''}${v.sdate && c >= v.sdate && v.date && c <= v.date && c !== v.date ? ' rng' : ''}" data-d="${c}" aria-label="${fmtLong(c)}">${+c.slice(8)}</button>`).join('')}</div>
      <div class="dopts">
        <label class="drow">${ic('clock', 18)}<span>Horário</span><input type="time" class="in sm" data-f="time" value="${v.time || ''}"></label>
        ${opts.simple ? '' : `
        <label class="drow${v.time ? '' : ' dim'}">${ic('timer', 18)}<span>Até</span><input type="time" class="in sm" data-f="end" value="${v.end || ''}" ${v.time ? '' : 'disabled'}></label>
        ${opts.noStart ? '' : `<label class="drow">${ic('sub', 18)}<span>Início</span><input type="date" class="in sm" data-f="sdate" value="${v.sdate || ''}"></label>`}
        <label class="drow">${ic('bell', 18)}<span>Lembrete</span><select class="in sm" data-f="rem"><option value="">Nenhum</option>${remOpts.map(o => `<option value="${o[0]}" ${(v.rem || [])[0] === o[0] ? 'selected' : ''}>${o[1]}</option>`).join('')}</select></label>
        <label class="drow">${ic('repeat', 18)}<span>Repetir</span><select class="in sm" data-f="rep">${repOpts.map(o => `<option value="${o[0]}" ${repKey(v.rep) === o[0] ? 'selected' : ''}>${o[1]}</option>`).join('')}</select></label>
        ${v.rep ? `<p class="rept">${esc(repText(v.rep))}</p>` : ''}`}
      </div>
      <div class="row end"><button class="btn ghost sm" data-x>Limpar</button><button class="btn red sm" data-ok>OK</button></div>`;
  };
  draw();
  el.addEventListener('click', e => {
    const q = e.target.closest('[data-q]'), d = e.target.closest('[data-d]'), mm = e.target.closest('[data-m]');
    if (q) { v.date = q.dataset.q || null; if (!v.date) { v.time = v.end = null; v.rep = null; } if (q.dataset.q !== undefined) { save(); return; } }
    if (d) { v.date = d.dataset.d; month = v.date.slice(0, 7); if (v.sdate && v.sdate > v.date) v.sdate = null; draw(); }
    if (mm) { const [y, m] = month.split('-').map(Number); const dt = new Date(y, m - 1 + (+mm.dataset.m), 1); month = ymd(dt).slice(0, 7); draw(); }
    if (e.target.closest('[data-x]')) { v = { date: null, time: null, end: null, sdate: null, rep: null, rem: [] }; save(); }
    if (e.target.closest('[data-ok]')) save();
  });
  el.addEventListener('change', e => {
    const f = e.target.dataset.f; if (!f) return;
    const val = e.target.value;
    if (f === 'time') { v.time = val || null; if (!v.time) v.end = null; if (v.time && !v.date) v.date = T; if (v.time && !(v.rem || []).length) v.rem = [0]; }
    if (f === 'end') v.end = val || null;
    if (f === 'sdate') v.sdate = val || null;
    if (f === 'rem') v.rem = val === '' ? [] : [+val];
    if (f === 'rep') {
      const base = v.date || T; if (!v.date) v.date = T;
      if (val === '') v.rep = null;
      else if (val === 'wd') v.rep = { f: 'w', n: 1, wd: [1, 2, 3, 4, 5] };
      else if (val === 'w') v.rep = { f: 'w', n: 1, wd: [pd(base).getDay()] };
      else if (val === 'm') v.rep = { f: 'm', n: 1, md: pd(base).getDate() };
      else if (val === 'custom') { repEditor(v.rep, base, r => { v.rep = r; draw(); }); return; }
      else v.rep = { f: val, n: 1 };
    }
    draw();
  });
  function save() { closePop(); onSave(v); }
  return el;
}
function repEditor(rep, base, done) {
  rep = clone(rep || { f: 'w', n: 1, wd: [pd(base).getDay()] });
  const el = modal(`<h2>Repetição personalizada</h2><form class="rep">
    <div class="row"><span>A cada</span><input class="in sm" type="number" min="1" max="99" name="n" value="${rep.n || 1}" style="width:72px"><select class="in sm" name="f"><option value="d">dia(s)</option><option value="w">semana(s)</option><option value="m">mês(es)</option><option value="y">ano(s)</option></select></div>
    <div class="wds">${[0, 1, 2, 3, 4, 5, 6].map(i => { const w = (i + weekStart()) % 7; return `<label class="wd"><input type="checkbox" name="wd" value="${w}" ${(rep.wd || []).includes(w) ? 'checked' : ''}><span>${wdShort[w]}</span></label>`; }).join('')}</div>
    <label class="lab">Contar a partir de<select class="in" name="from"><option value="due">Data da tarefa</option><option value="done" ${rep.from === 'done' ? 'selected' : ''}>Data de conclusão</option></select></label>
    <label class="lab">Termina em (opcional)<input class="in" type="date" name="until" value="${rep.until || ''}"></label>
    <div class="row end"><button type="button" class="btn ghost" data-x>Cancelar</button><button class="btn red">Salvar</button></div></form>`);
  const f = el.querySelector('form');
  f.f.value = rep.f;
  const sync = () => el.querySelector('.wds').style.display = f.f.value === 'w' ? '' : 'none';
  sync(); f.f.onchange = sync;
  el.querySelector('[data-x]').onclick = closeModal;
  f.onsubmit = e => {
    e.preventDefault();
    const r = { f: f.f.value, n: clamp(+f.n.value || 1, 1, 99) };
    if (r.f === 'w') { r.wd = $$('input[name=wd]:checked', f).map(x => +x.value); if (!r.wd.length) r.wd = [pd(base).getDay()]; }
    if (r.f === 'm') r.md = pd(base).getDate();
    if (f.from.value === 'done') r.from = 'done';
    if (f.until.value) r.until = f.until.value;
    closeModal(); done(r);
  };
}
/* converte entre a tarefa e o seletor */
const taskToDp = t => ({ date: dOnly(t.due || t.start), time: tOnly(t.start && t.due && dOnly(t.start) === dOnly(t.due) ? t.start : t.due) || null, end: t.start && t.due && tOnly(t.start) && dOnly(t.start) === dOnly(t.due) ? tOnly(t.due) : null, sdate: t.start && dOnly(t.start) !== dOnly(t.due || '') ? dOnly(t.start) : null, rep: t.rep, rem: t.rem || [] });
function dpToTask(t, v) {
  if (!v.date) { t.due = null; t.start = null; t.rep = null; t.rem = []; return t; }
  if (v.time && v.end) { t.start = v.date + 'T' + v.time; t.due = v.date + 'T' + v.end; }
  else { t.due = withT(v.date, v.time); t.start = v.sdate && v.sdate < v.date ? v.sdate : null; }
  t.rep = v.rep || null; t.rem = v.rem || [];
  return t;
}

/* ---------- arrastar e soltar (mouse e toque) ---------- */
const DND = { on: false };
function initDnd() {
  let st = null, timer = null;
  const begin = (e, src) => {
    DND.on = true; DND.src = src.dataset.drag; DND.el = src;
    const r = src.getBoundingClientRect();
    const g = src.cloneNode(true); g.className += ' dghost'; g.style.width = Math.min(r.width, 420) + 'px';
    document.body.appendChild(g); DND.g = g; DND.dx = e.clientX - r.left; DND.dy = e.clientY - r.top;
    src.classList.add('dragging'); document.body.classList.add('dnd');
    if (navigator.vibrate) try { navigator.vibrate(12); } catch (x) {}
    move(e);
  };
  const move = e => {
    if (!DND.on) return;
    DND.px = e.clientX; DND.py = e.clientY;
    DND.g.style.transform = `translate(${e.clientX - DND.dx}px, ${e.clientY - DND.dy}px)`;
    const t = document.elementFromPoint(e.clientX, e.clientY);
    const d = t && t.closest('[data-drop]');
    $$('.dropon,.drop-before,.drop-after').forEach(x => x.classList.remove('dropon', 'drop-before', 'drop-after'));
    DND.dst = null;
    if (d && d !== DND.el) {
      const r = d.getBoundingClientRect(), before = e.clientY < r.top + r.height / 2;
      DND.dst = d.dataset.drop; DND.before = before;
      d.classList.add(d.dataset.drop.startsWith('row:') || d.dataset.drop.startsWith('blk:') ? (before ? 'drop-before' : 'drop-after') : 'dropon');
    }
    const sc = t && t.closest('.scroll, .bcol .cards, .sside');
    if (sc) { const r = sc.getBoundingClientRect(); if (e.clientY < r.top + 50) sc.scrollTop -= 12; else if (e.clientY > r.bottom - 50) sc.scrollTop += 12; }
    const bd = t && t.closest('.board'); if (bd) { const r = bd.getBoundingClientRect(); if (e.clientX < r.left + 50) bd.scrollLeft -= 14; else if (e.clientX > r.right - 50) bd.scrollLeft += 14; }
  };
  const end = () => {
    clearTimeout(timer); timer = null; st = null;
    if (!DND.on) return;
    const { src, dst, before } = DND;
    DND.g.remove(); DND.el.classList.remove('dragging'); document.body.classList.remove('dnd');
    $$('.dropon,.drop-before,.drop-after').forEach(x => x.classList.remove('dropon', 'drop-before', 'drop-after'));
    DND.on = false; DND.justDropped = Date.now();
    if (dst) for (const h of DROPS) { if (h(src, dst, before) !== undefined) break; }
  };
  document.addEventListener('pointerdown', e => {
    const src = e.target.closest('[data-drag]');
    if (!src || e.button > 0 || e.target.closest('button:not([data-handle]),input,textarea,select,a[href]:not([data-drag]),[contenteditable=true]')) return;
    st = { x: e.clientX, y: e.clientY, src, touch: e.pointerType !== 'mouse', handle: !!e.target.closest('[data-handle]') };
    if (st.touch) timer = setTimeout(() => { if (st) begin(st.e || e, src); }, st.handle ? 120 : 420);
  });
  document.addEventListener('pointermove', e => {
    if (DND.on) { e.preventDefault(); move(e); return; }
    if (!st) return;
    st.e = e;
    const d = Math.hypot(e.clientX - st.x, e.clientY - st.y);
    if (st.touch) { if (d > 9) { clearTimeout(timer); st = null; } }
    else if (d > 6) begin(e, st.src);
  });
  document.addEventListener('pointerup', end);
  document.addEventListener('pointercancel', () => { if (!DND.on) { clearTimeout(timer); st = null; } else end(); });
  document.addEventListener('touchmove', e => { if (DND.on) e.preventDefault(); }, { passive: false });
  document.addEventListener('dragstart', e => { if (e.target.closest && e.target.closest('[data-drag], #blocks')) e.preventDefault(); });
  document.addEventListener('click', e => { if (DND.justDropped && Date.now() - DND.justDropped < 300) { e.preventDefault(); e.stopPropagation(); } }, true);
  document.addEventListener('contextmenu', e => { if (DND.on || (st && st.touch)) e.preventDefault(); });
}

/* ---------- ações globais (delegação de cliques) ---------- */
const ACTS = {
  go: b => go(b.dataset.to),
  sgtog: b => { const g = b.dataset.g; db.s.sgc = Object.assign({}, db.s.sgc || {}, { [g]: !sgShut(g) }); put('s', db.s); },
  profmenu: b => {
    const nm = (db.s.name || '').trim();
    menu(b, [
      { html: `<div class="pmhead">${avatarHtml('md')}<div><b>${esc(nm || 'Seu nome')}</b><span>${esc(WHO || 'Modo local (sem conta)')}</span><small><i class="sdot ${esc(SYNC.cls)}"></i>${esc(SYNC.txt)}</small></div></div>` },
      { label: 'Perfil', icon: 'users', act: () => go('me') },
      { label: 'Editar foto e nome', icon: 'img', act: () => editProfile() },
      { label: 'Conquistas', icon: 'star', act: () => go('ach') },
      { label: 'Pets', icon: 'smile', act: () => go('pets') },
      { sep: 1 },
      { label: 'Configurações', icon: 'gear', act: () => go('settings') },
      typeof IS_ADMIN !== 'undefined' && IS_ADMIN ? { label: 'Usuários', icon: 'users', act: () => go('users') } : null,
    ].filter(Boolean));
  },
  side: () => { if (isMobile()) { R.drawer = !R.drawer; render(); } else { db.s.side = !db.s.side; put('s', db.s); } },
  drawer: () => { R.drawer = !R.drawer; render(); },
  fold: b => { const f = get('f', b.dataset.id); f.open = f.open === false; put('f', f); },
  newlist: () => editList(),
  newfolder: b => newFolder(b.dataset.k || 'l', b.dataset.par || null),
  profile: () => editProfile(),
  newtag: () => editTag(),
  ctx: (b, e) => { e.preventDefault(); e.stopPropagation(); ctxMenu(b.dataset.ctx, b); },
  quick: () => { R.drawer = false; render(); quickAdd(); },
  account: b => menu(b, [
    { head: WHO || 'Modo local (sem conta)' },
    { label: 'Configurações', icon: 'gear', act: () => go('settings') },
    { label: 'Pets: ' + (petCfg().on ? 'ligados 🐈' : 'desligados'), icon: 'habit', act: () => ACTS.petstoggle() },
    { label: 'Tema: ' + { auto: 'automático', light: 'claro', dark: 'escuro' }[db.s.theme], icon: 'moon', act: cycleTheme },
    { label: 'Exportar tudo…', icon: 'export', act: () => exportMenu(b, { kind: 'all' }) },
    INSTALL ? { label: 'Instalar o app', icon: 'dl', act: installApp } : null,
    CLOUD && SES ? { label: 'Sair', icon: 'out', danger: 1, act: signOut } : null,
  ]),
  'more-tabs': b => menu(b, [
    { label: 'Perfil', icon: 'users', act: () => go('me') },
    { label: 'Notas rápidas', icon: 'note', act: () => go('notes') },
    { label: 'Reuniões (ata com IA)', icon: 'mic', act: () => go('meet') },
    { label: 'Conquistas', icon: 'star', act: () => go('ach') },
    { label: 'Pets: ' + (petCfg().on ? 'ligados 🐈' : 'desligados'), icon: 'habit', act: () => ACTS.petstoggle() },
    { label: 'Foco', icon: 'focus', act: () => go('focus') },
    { label: 'Hábitos', icon: 'habit', act: () => go('habits') },
    { label: 'Matriz de prioridades', icon: 'matrix', act: () => go('matrix') },
    { label: 'Buscar', icon: 'search', act: () => go('search') },
    { label: 'Todas as listas', icon: 'menu', act: () => { R.drawer = true; render(); } },
    { label: 'Concluídas', icon: 'done', act: () => go('l/done') },
    { label: 'Lixeira', icon: 'trash', act: () => go('l/trash') },
    { label: 'Configurações', icon: 'gear', act: () => go('settings') },
  ]),
};
function cycleTheme() { db.s.theme = { auto: 'light', light: 'dark', dark: 'auto' }[db.s.theme] || 'auto'; put('s', db.s); applyTheme(); }
const SKINS = [
  ['classico', 'Clássico', 'vermelho e cinza', '#DC4C3E', '#FAF8F6', '#FFFFFF', '#202020'],
  ['cupertino', 'Cupertino', 'azul, estilo Apple', '#007AFF', '#F5F5F7', '#FFFFFF', '#1D1D1F'],
  ['grafite', 'Grafite', 'monocromático', '#1D1D1F', '#F5F5F7', '#FFFFFF', '#1D1D1F'],
  ['salvia', 'Sálvia', 'verde suave', '#4E7D63', '#F3F6F2', '#FFFFFF', '#1F2A23'],
  ['oceano', 'Oceano', 'azul petróleo', '#0B7A8F', '#F1F6F7', '#FFFFFF', '#1A2628'],
  ['lavanda', 'Lavanda', 'violeta delicado', '#6D5BD0', '#F6F4FC', '#FFFFFF', '#221F2E'],
  ['champanhe', 'Champanhe', 'dourado e marfim', '#A27A45', '#F8F4EC', '#FFFEFB', '#2A241B'],
  ['rose', 'Rosé', 'rosa elegante', '#D2557A', '#FBF4F6', '#FFFFFF', '#2B1F23'],
  ['noite', 'Meia-noite', 'escuro com dourado', '#C9A86A', '#14171D', '#0E1014', '#ECE8E0'],
];
function applyTheme() {
  const skin = db.s.skin || 'classico';
  let t = db.s.theme || 'auto';
  if (t === 'auto') t = matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  if (skin === 'noite') t = 'dark';
  document.documentElement.dataset.theme = t;
  document.documentElement.dataset.skin = skin;
  requestAnimationFrame(() => { const m = $('meta[name=theme-color]'); if (m) m.content = getComputedStyle(document.body).backgroundColor || (t === 'dark' ? '#1f1f1f' : '#ffffff'); });
  try { localStorage.setItem('tt_theme', db.s.theme); localStorage.setItem('tt_skin', skin); } catch (e) {}
}
matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => applyTheme());
function initUi() {
  document.addEventListener('click', e => {
    const b = e.target.closest('[data-act]');
    if (b && ACTS[b.dataset.act]) { ACTS[b.dataset.act](b, e); return; }
    if (POP && e.target.isConnected && !POP.contains(e.target) && !e.target.closest('[data-pop]')) closePop();
    const a = e.target.closest('a.nav'); if (a && isMobile()) { R.drawer = false; }
  });
  document.addEventListener('contextmenu', e => {
    const c = e.target.closest('[data-ctx]');
    if (c && !isMobile()) { e.preventDefault(); ctxMenu(c.dataset.ctx, c, { x: e.clientX, y: e.clientY }); }
  });
  $('#scrim').onclick = () => { closePop(); };
  $('#dscrim').onclick = () => { R.drawer = false; render(); };
  $('#modal').addEventListener('click', e => { if (e.target.id === 'modal') { if (typeof NE !== 'undefined' && NE) closeNote(); else closeModal(); } });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') { if (POP) closePop(); else if ($('#modal').classList.contains('on')) { if (typeof NE !== 'undefined' && NE) closeNote(); else closeModal(); } else if (R.sel) closeTask(); else if (R.drawer) { R.drawer = false; render(); } return; }
    const a = document.activeElement, typing = a && (/INPUT|TEXTAREA|SELECT/.test(a.tagName) || a.isContentEditable);
    if (typing || e.metaKey || e.ctrlKey || e.altKey) return;
    if (e.key === 'q' || e.key === 'n') { e.preventDefault(); quickAdd(); }
    else if (e.key === '/') { e.preventDefault(); go('search'); }
    else if (e.key === 'h') go('l/today');
    else if (e.key === 'c') go('cal');
    else if (e.key === 'd') { e.preventDefault(); ACTS.dnew(); }
    else if (e.key === 'k') openNote(null);
  });
  initDnd();
  initSwipe();
}
/* celular: deslizar a tarefa para a direita conclui; para a esquerda abre data (ou exclui, se for longe) */
function initSwipe() {
  let s = null;
  document.addEventListener('touchstart', e => {
    const row = e.target.closest('.tlist .trow:not(.card):not(.ghostrow)');
    if (!row || e.touches.length > 1 || e.target.closest('button,input,[contenteditable=true]') || !row.querySelector('[data-act=tcheck]')) return;
    s = { row, x: e.touches[0].clientX, y: e.touches[0].clientY, dx: 0, on: false };
  }, { passive: true });
  document.addEventListener('touchmove', e => {
    if (!s || DND.on) return;
    const t = e.touches[0], dx = t.clientX - s.x, dy = t.clientY - s.y;
    if (!s.on) { if (Math.abs(dy) > 10) { s = null; return; } if (Math.abs(dx) > 14) { s.on = true; s.row.classList.add('swiping'); } else return; }
    s.dx = dx;
    s.row.style.transform = `translateX(${Math.max(-220, Math.min(160, dx))}px)`;
    s.row.dataset.sw = dx > 70 ? 'done' : dx < -150 ? 'del' : dx < -70 ? 'date' : '';
  }, { passive: true });
  document.addEventListener('touchend', () => {
    if (!s) return;
    const { row, dx, on } = s; s = null;
    if (!on) return;
    const act = row.dataset.sw, id = row.querySelector('[data-act=tcheck]').dataset.id;
    row.style.transition = 'transform .18s'; row.style.transform = ''; row.classList.remove('swiping'); row.dataset.sw = '';
    setTimeout(() => { row.style.transition = ''; }, 200);
    DND.justDropped = Date.now();
    if (act === 'done') checkTask(id, row);
    else if (act === 'del') deleteTask(get('t', id));
    else if (act === 'date') { const t = get('t', id); datePicker(row, taskToDp(t), v => { dpToTask(t, v); put('t', t); gcalPushTask(t); }); }
  });
}
/* celular: segurar o dedo numa lista, pasta ou etiqueta do menu abre as opções (cor, nome, excluir…) */
(() => {
  let tm = null, fired = false, sx = 0, sy = 0;
  document.addEventListener('touchstart', e => {
    const c = e.target.closest && e.target.closest('#side [data-ctx]'); if (!c || e.touches.length > 1) return;
    fired = false; sx = e.touches[0].clientX; sy = e.touches[0].clientY;
    tm = setTimeout(() => { fired = true; if (navigator.vibrate) navigator.vibrate(12); ctxMenu(c.dataset.ctx, c); }, 480);
  }, { passive: true });
  document.addEventListener('touchmove', e => { if (tm && Math.hypot(e.touches[0].clientX - sx, e.touches[0].clientY - sy) > 8) { clearTimeout(tm); tm = null; } }, { passive: true });
  document.addEventListener('touchend', () => { clearTimeout(tm); tm = null; });
  document.addEventListener('click', e => { if (fired && e.target.closest && e.target.closest('#side [data-ctx]')) { e.preventDefault(); e.stopPropagation(); fired = false; } }, true);
  document.addEventListener('contextmenu', e => { if (isMobile() && e.target.closest && e.target.closest('#side [data-ctx]')) e.preventDefault(); });
})();
/* painel da tarefa/documento à direita: arraste a borda esquerda para aumentar ou diminuir (duplo clique volta ao padrão) */
(() => {
  const KEY = 'tt_detw';
  const apply = w => { if (w) document.documentElement.style.setProperty('--det-w', w + 'px'); else document.documentElement.style.removeProperty('--det-w'); };
  try { const w = +localStorage.getItem(KEY); if (w) apply(w); } catch (e) {}
  const maxW = () => Math.max(420, Math.min(innerWidth - 420, Math.round(innerWidth * .75)));
  const ensure = () => {
    const det = document.getElementById('detail'); if (!det || det.querySelector(':scope > .detres')) return;
    const h = document.createElement('div'); h.className = 'detres'; h.title = 'Arraste para ajustar a largura (duplo clique: padrão)'; h.setAttribute('role', 'separator'); h.setAttribute('aria-orientation', 'vertical');
    det.prepend(h);
    h.addEventListener('pointerdown', e => {
      if (isMobile()) return; e.preventDefault(); h.setPointerCapture(e.pointerId);
      document.body.classList.add('detresizing');
      const move = ev => { const w = Math.round(Math.min(maxW(), Math.max(360, innerWidth - ev.clientX))); apply(w); };
      const up = () => { h.removeEventListener('pointermove', move); h.removeEventListener('pointerup', up); document.body.classList.remove('detresizing'); try { localStorage.setItem(KEY, parseInt(getComputedStyle(document.documentElement).getPropertyValue('--det-w'))); } catch (er) {} };
      h.addEventListener('pointermove', move); h.addEventListener('pointerup', up);
    });
    h.addEventListener('dblclick', () => { apply(null); try { localStorage.removeItem(KEY); } catch (er) {} });
  };
  const start = () => { const det = document.getElementById('detail'); if (!det) return setTimeout(start, 300); ensure(); new MutationObserver(ensure).observe(det, { childList: true }); };
  start();
})();
