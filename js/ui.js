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
  else { R.v = 'list'; R.id = 'today'; }
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
  if (force || !busy(main)) {
    const sc = main.querySelector('.scroll'), top = sc ? sc.scrollTop : 0, key = R.v + ':' + R.id;
    const fn = VIEWS[R.v] || VIEWS.list;
    main.className = '';
    try { fn(main); } catch (e) { console.error(e); main.innerHTML = `<div class="empty"><p>Algo deu errado ao abrir esta tela.</p><p class="mut">${esc(e.message)}</p></div>`; }
    const sc2 = main.querySelector('.scroll'); if (sc2 && main.dataset.key === key) sc2.scrollTop = top;
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
function navItem(href, icon, name, opts = {}) {
  const on = opts.on;
  const cnt = opts.count ? `<span class="cnt${opts.red ? ' red' : ''}">${opts.count}</span>` : '';
  const dot = opts.color ? `<span class="ldot" style="background:${esc(opts.color)}"></span>` : ic(icon, 20);
  return `<a class="nav${on ? ' on' : ''}" href="#/${href}" ${opts.drop ? `data-drop="${opts.drop}"` : ''} ${opts.ctx ? `data-ctx="${opts.ctx}"` : ''}>${dot}<span class="nm">${esc(name)}</span>${cnt}${opts.ctx ? `<button class="mini more" data-act="ctx" data-ctx="${opts.ctx}" aria-label="Opções de ${esc(name)}">${ic('more', 16)}</button>` : ''}</a>`;
}
function sideHtml() {
  const cur = R.v === 'list' ? R.id : R.v;
  const ov = db.t.filter(overdue).length;
  const lists = db.l.filter(l => l.id !== 'inbox' && !l.arch).sort((a, b) => (a.o || 0) - (b.o || 0));
  const folders = db.f.slice().sort((a, b) => (a.o || 0) - (b.o || 0));
  const li = l => navItem('l/' + l.id, 'list', l.name, { on: cur === l.id, count: countFor(l.id), color: l.color || '#808080', drop: 'list:' + l.id, ctx: 'list:' + l.id });
  let lh = '';
  folders.forEach(f => {
    const ch = lists.filter(l => l.folder === f.id);
    lh += `<div class="fold${f.open === false ? ' shut' : ''}"><div class="fhead" data-ctx="folder:${f.id}"><button class="mini" data-act="fold" data-id="${f.id}" aria-label="${f.open === false ? 'Abrir' : 'Fechar'} pasta ${esc(f.name)}">${ic('chev', 14)}</button>${ic('folder', 18)}<span class="nm">${esc(f.name)}</span><button class="mini more" data-act="ctx" data-ctx="folder:${f.id}" aria-label="Opções da pasta">${ic('more', 16)}</button></div><div class="fbody">${ch.map(li).join('') || '<p class="hint">Pasta vazia</p>'}</div></div>`;
  });
  lh += lists.filter(l => !l.folder || !get('f', l.folder)).map(li).join('');
  const tags = db.g.slice().sort((a, b) => a.name.localeCompare(b.name, 'pt'));
  return `
  <div class="shead">
    <button class="who" data-act="account">${ic('check', 18)}<span>${esc(WHO ? WHO.split('@')[0] : 'Tarefas')}</span></button>
    <span id="sync" class="sync ${esc(SYNC.cls)}" title="${esc(SYNC.txt)}">${ic(SYNC.icon, 16)}</span>
    <button class="ib" data-act="go" data-to="search" aria-label="Buscar">${ic('search')}</button>
    <button class="ib hide-m" data-act="side" aria-label="Recolher barra lateral">${ic('side')}</button>
  </div>
  <button class="addbtn" data-act="quick">${ic('plus', 18)}<span>Adicionar tarefa</span></button>
  <nav class="snav">
    ${navItem('l/inbox', 'inbox', 'Caixa de entrada', { on: cur === 'inbox', count: countFor('inbox'), drop: 'list:inbox' })}
    ${navItem('l/today', 'today', 'Hoje', { on: cur === 'today', count: countFor('today'), red: ov > 0, drop: 'smart:today' })}
    ${navItem('l/tomorrow', 'tomorrow', 'Amanhã', { on: cur === 'tomorrow', count: countFor('tomorrow'), drop: 'smart:tomorrow' })}
    ${navItem('l/week', 'week', 'Próximos 7 dias', { on: cur === 'week', count: countFor('week') })}
    ${navItem('cal', 'cal', 'Calendário', { on: cur === 'cal' })}
    ${navItem('matrix', 'matrix', 'Matriz de prioridades', { on: cur === 'matrix' })}
    ${navItem('focus', 'focus', 'Foco', { on: cur === 'focus' })}
    ${navItem('habits', 'habit', 'Hábitos', { on: cur === 'habits' })}
    ${navItem('docs', 'doc', 'Documentos', { on: cur === 'docs' || cur === 'doc' })}
  </nav>
  <div class="sgroup"><div class="sgh"><span>Listas</span><button class="mini" data-act="newlist" aria-label="Nova lista">${ic('plus', 16)}</button><button class="mini" data-act="newfolder" aria-label="Nova pasta">${ic('folder', 16)}</button></div>${lh || '<p class="hint">Nenhuma lista ainda</p>'}</div>
  <div class="sgroup"><div class="sgh"><span>Etiquetas</span><button class="mini" data-act="newtag" aria-label="Nova etiqueta">${ic('plus', 16)}</button></div>
    ${tags.map(g => `<a class="nav${cur === 'tag:' + g.id ? ' on' : ''}" href="#/tag/${g.id}" data-drop="tag:${g.id}" data-ctx="tag:${g.id}"><span class="tagic" style="color:${esc(g.color)}">${ic('tag', 18)}</span><span class="nm">${esc(g.name)}</span><span class="cnt">${countFor('tag:' + g.id) || ''}</span><button class="mini more" data-act="ctx" data-ctx="tag:${g.id}" aria-label="Opções da etiqueta">${ic('more', 16)}</button></a>`).join('') || '<p class="hint">Use #etiqueta ao digitar uma tarefa</p>'}
  </div>
  <nav class="snav low">
    ${navItem('l/all', 'all', 'Todas', { on: cur === 'all' })}
    ${navItem('l/done', 'done', 'Concluídas', { on: cur === 'done' })}
    ${navItem('l/trash', 'trash', 'Lixeira', { on: cur === 'trash', drop: 'trash' })}
    ${navItem('settings', 'gear', 'Configurações', { on: cur === 'settings' })}
  </nav>`;
}
function tabsHtml() {
  const t = R.v, isT = t === 'list' || t === 'matrix';
  const b = (to, icon, name, on) => `<button class="tab${on ? ' on' : ''}" data-act="go" data-to="${to}">${ic(icon, 23)}<span>${name}</span></button>`;
  return b('l/' + (R.v === 'list' ? R.id : (db.s.lastList || 'today')), 'todo', 'Tarefas', isT) + b('cal', 'cal', 'Calendário', t === 'cal') + b('docs', 'doc', 'Documentos', t === 'docs' || t === 'doc') + b('focus', 'focus', 'Foco', t === 'focus') + `<button class="tab${['habits', 'search', 'settings'].includes(t) ? ' on' : ''}" data-act="more-tabs">${ic('more', 23)}<span>Mais</span></button>`;
}
/* cabeçalho padrão das telas */
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
function modal(html, opts = {}) {
  closeModal();
  const m = $('#modal');
  m.innerHTML = `<div class="mbox ${opts.cls || ''}" role="dialog" aria-modal="true">${html}</div>`;
  m.classList.add('on');
  const f = m.querySelector('[autofocus]') || m.querySelector('input,textarea,select');
  if (f && !isMobile()) setTimeout(() => f.focus(), 30);
  return m.firstChild;
}
function closeModal() { const m = $('#modal'); m.classList.remove('on'); m.innerHTML = ''; }
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
function editList(l) {
  const isNew = !l;
  l = l || { id: uid(), name: '', color: COLORS[db.l.length % COLORS.length], view: 'list', sec: [], o: db.l.length + 1 };
  const el = modal(`<h2>${isNew ? 'Nova lista' : 'Editar lista'}</h2><form>
    <label class="lab">Nome<input class="in" name="n" value="${esc(l.name)}" required maxlength="80" autofocus></label>
    <span class="lab">Cor</span>${colorRow(l.color)}
    <label class="lab">Pasta<select class="in" name="f"><option value="">Sem pasta</option>${db.f.map(f => `<option value="${f.id}" ${l.folder === f.id ? 'selected' : ''}>${esc(f.name)}</option>`).join('')}</select></label>
    <label class="lab">Visualização<select class="in" name="v"><option value="list" ${l.view !== 'board' ? 'selected' : ''}>Lista</option><option value="board" ${l.view === 'board' ? 'selected' : ''}>Quadro (kanban)</option></select></label>
    <div class="row end"><button type="button" class="btn ghost" data-x>Cancelar</button><button class="btn red">${isNew ? 'Criar' : 'Salvar'}</button></div></form>`);
  el.querySelector('[data-x]').onclick = closeModal;
  el.querySelector('form').onsubmit = e => {
    e.preventDefault();
    const f = new FormData(e.target);
    l.name = f.get('n').trim(); l.color = f.get('color') || l.color; l.folder = f.get('f') || null; l.view = f.get('v');
    if (l.view === 'board' && !(l.sec || []).length) l.sec = [{ id: uid(), name: 'A fazer' }, { id: uid(), name: 'Em andamento' }, { id: uid(), name: 'Feito' }];
    put('l', l); closeModal();
    if (isNew) go('l/' + l.id);
  };
}
async function newFolder() { const n = await ask('Nova pasta', '', { ph: 'Ex.: Projetos' }); if (n) put('f', { id: uid(), name: n, o: db.f.length + 1, open: true }); }
function editTag(g) {
  const isNew = !g;
  g = g || { id: uid(), name: '', color: COLORS[db.g.length % COLORS.length] };
  const el = modal(`<h2>${isNew ? 'Nova etiqueta' : 'Editar etiqueta'}</h2><form><label class="lab">Nome<input class="in" name="n" value="${esc(g.name)}" required maxlength="40" autofocus></label><span class="lab">Cor</span>${colorRow(g.color)}<div class="row end"><button type="button" class="btn ghost" data-x>Cancelar</button><button class="btn red">Salvar</button></div></form>`);
  el.querySelector('[data-x]').onclick = closeModal;
  el.querySelector('form').onsubmit = e => { e.preventDefault(); const f = new FormData(e.target); g.name = f.get('n').trim().replace(/^#/, '').replace(/\s+/g, '-'); g.color = f.get('color') || g.color; put('g', g); closeModal(); };
}
function ctxMenu(spec, anchor, at) {
  const [k, id] = spec.split(':');
  if (k === 'list') {
    const l = get('l', id); if (!l) return;
    menu(anchor, [
      { label: 'Editar lista', icon: 'edit', act: () => editList(l) },
      { label: 'Exportar…', icon: 'export', act: () => exportMenu(anchor, { kind: 'list', id }) },
      { label: 'Duplicar', icon: 'copy', act: () => { const n = clone(l); n.id = uid(); n.name += ' (cópia)'; put('l', n, { silent: true }); db.t.filter(t => t.list === id && !t.del).forEach(t => { const c = clone(t); c.id = uid(); c.list = n.id; c.gc = null; put('t', c, { silent: true }); }); changed(); toast('Lista duplicada'); } },
      { label: 'Arquivar', icon: 'arch', act: () => { l.arch = true; put('l', l); toast('Lista arquivada', 'Desfazer', () => { l.arch = false; put('l', l); }); } },
      { sep: 1 },
      { label: 'Excluir lista', icon: 'trash', danger: 1, act: async () => { if (await confirmBox('Excluir a lista "' + l.name + '"?', 'As tarefas dela vão para a Lixeira.')) { db.t.filter(t => t.list === id).forEach(t => { t.del = Date.now(); t.list = 'inbox'; put('t', t, { silent: true }); }); hardDel('l', id); if (R.id === id) go('l/today'); } } },
    ], { at });
  } else if (k === 'folder') {
    const f = get('f', id); if (!f) return;
    menu(anchor, [
      { label: 'Renomear', icon: 'edit', act: async () => { const n = await ask('Renomear pasta', f.name); if (n) { f.name = n; put('f', f); } } },
      { label: 'Nova lista nesta pasta', icon: 'plus', act: () => { editList(); setTimeout(() => { const s = $('#modal select[name=f]'); if (s) s.value = id; }, 20); } },
      { sep: 1 },
      { label: 'Desfazer pasta', icon: 'trash', danger: 1, act: () => { db.l.filter(l => l.folder === id).forEach(l => { l.folder = null; put('l', l, { silent: true }); }); hardDel('f', id); } },
    ], { at });
  } else if (k === 'tag') {
    const g = get('g', id); if (!g) return;
    menu(anchor, [
      { label: 'Editar etiqueta', icon: 'edit', act: () => editTag(g) },
      { sep: 1 },
      { label: 'Excluir etiqueta', icon: 'trash', danger: 1, act: () => { db.t.forEach(t => { if ((t.tags || []).includes(id)) { t.tags = t.tags.filter(x => x !== id); put('t', t, { silent: true }); } }); hardDel('g', id); if (R.id === 'tag:' + id) go('l/today'); } },
    ], { at });
  }
}

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
        <label class="drow${v.time ? '' : ' dim'}">${ic('timer', 18)}<span>Até</span><input type="time" class="in sm" data-f="end" value="${v.end || ''}" ${v.time ? '' : 'disabled'}></label>
        ${opts.noStart ? '' : `<label class="drow">${ic('sub', 18)}<span>Início</span><input type="date" class="in sm" data-f="sdate" value="${v.sdate || ''}"></label>`}
        <label class="drow">${ic('bell', 18)}<span>Lembrete</span><select class="in sm" data-f="rem"><option value="">Nenhum</option>${remOpts.map(o => `<option value="${o[0]}" ${(v.rem || [])[0] === o[0] ? 'selected' : ''}>${o[1]}</option>`).join('')}</select></label>
        <label class="drow">${ic('repeat', 18)}<span>Repetir</span><select class="in sm" data-f="rep">${repOpts.map(o => `<option value="${o[0]}" ${repKey(v.rep) === o[0] ? 'selected' : ''}>${o[1]}</option>`).join('')}</select></label>
        ${v.rep ? `<p class="rept">${esc(repText(v.rep))}</p>` : ''}
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
    if (!src || e.button > 0 || e.target.closest('button:not([data-handle]),input,textarea,select,a[href],[contenteditable=true]')) return;
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
  document.addEventListener('click', e => { if (DND.justDropped && Date.now() - DND.justDropped < 300) { e.preventDefault(); e.stopPropagation(); } }, true);
  document.addEventListener('contextmenu', e => { if (DND.on || (st && st.touch)) e.preventDefault(); });
}

/* ---------- ações globais (delegação de cliques) ---------- */
const ACTS = {
  go: b => go(b.dataset.to),
  side: () => { if (isMobile()) { R.drawer = !R.drawer; render(); } else { db.s.side = !db.s.side; put('s', db.s); } },
  drawer: () => { R.drawer = !R.drawer; render(); },
  fold: b => { const f = get('f', b.dataset.id); f.open = f.open === false; put('f', f); },
  newlist: () => editList(),
  newfolder: () => newFolder(),
  newtag: () => editTag(),
  ctx: (b, e) => { e.preventDefault(); e.stopPropagation(); ctxMenu(b.dataset.ctx, b); },
  quick: () => { R.drawer = false; render(); quickAdd(); },
  account: b => menu(b, [
    { head: WHO || 'Modo local (sem conta)' },
    { label: 'Configurações', icon: 'gear', act: () => go('settings') },
    { label: 'Tema: ' + { auto: 'automático', light: 'claro', dark: 'escuro' }[db.s.theme], icon: 'moon', act: cycleTheme },
    { label: 'Exportar tudo…', icon: 'export', act: () => exportMenu(b, { kind: 'all' }) },
    INSTALL ? { label: 'Instalar o app', icon: 'dl', act: installApp } : null,
    CLOUD && SES ? { label: 'Sair', icon: 'out', danger: 1, act: signOut } : null,
  ]),
  'more-tabs': b => menu(b, [
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
function applyTheme() {
  let t = db.s.theme || 'auto';
  if (t === 'auto') t = matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  document.documentElement.dataset.theme = t;
  const m = $('meta[name=theme-color]'); if (m) m.content = t === 'dark' ? '#1f1f1f' : '#ffffff';
  try { localStorage.setItem('tt_theme', db.s.theme); } catch (e) {}
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
  $('#modal').addEventListener('click', e => { if (e.target.id === 'modal') closeModal(); });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') { if (POP) closePop(); else if ($('#modal').classList.contains('on')) closeModal(); else if (R.sel) closeTask(); else if (R.drawer) { R.drawer = false; render(); } return; }
    const a = document.activeElement, typing = a && (/INPUT|TEXTAREA|SELECT/.test(a.tagName) || a.isContentEditable);
    if (typing || e.metaKey || e.ctrlKey || e.altKey) return;
    if (e.key === 'q' || e.key === 'n') { e.preventDefault(); quickAdd(); }
    else if (e.key === '/') { e.preventDefault(); go('search'); }
    else if (e.key === 'h') go('l/today');
    else if (e.key === 'c') go('cal');
    else if (e.key === 'd') go('docs');
  });
  initDnd();
}
