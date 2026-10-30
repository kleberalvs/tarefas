/* Telas de tarefas: listas, listas inteligentes, quadro (kanban), matriz, busca, concluídas e lixeira. */
'use strict';
let GMAP = {};            /* grupo -> { set, ids } da última renderização (usado no arrastar) */
const OPEN_SUBS = new Set();
const SHUT_GROUPS = new Set();
let QA = null;            /* grupo com o campo de adicionar aberto */

function viewCfg(id) {
  db.s.views = db.s.views || {};
  const def = { sort: 'date', group: null, showDone: false };
  return Object.assign(def, db.s.views[id] || {});
}
function setViewCfg(id, k, v) { db.s.views = db.s.views || {}; db.s.views[id] = Object.assign(viewCfg(id), { [k]: v }); put('s', db.s); }
function scopeInfo(id) {
  if (id.startsWith('tag:')) { const g = get('g', id.slice(4)); return { kind: 'tag', name: g ? '#' + g.name : 'Etiqueta', color: g && g.color, f: t => (t.tags || []).includes(id.slice(4)), def: { tags: [id.slice(4)] }, group: 'list' }; }
  if (SMART[id] && id !== 'inbox') {
    const s = SMART[id];
    const def = id === 'today' ? { due: today() } : id === 'tomorrow' ? { due: addD(today(), 1) } : {};
    return { kind: 'smart', name: s.name, icon: s.icon, f: s.f, def, group: { today: 'date', tomorrow: 'none', week: 'date', all: 'list', done: 'done', trash: 'none' }[id] };
  }
  const l = get('l', id);
  if (!l) return null;
  return { kind: 'list', list: l, name: l.name, color: l.color, f: t => t.list === id, def: { list: id }, group: 'sec' };
}
function groupsFor(id, info, tasks, mode) {
  const G = [];
  const add = (key, name, items, set, extra = {}) => G.push(Object.assign({ key, name, items, set }, extra));
  if (mode === 'sec' && info.list) {
    const l = info.list, secs = l.sec || [];
    const none = tasks.filter(t => !t.sec || !secs.some(s => s.id === t.sec));
    if (none.length || !secs.length) add('sec:', secs.length ? 'Sem seção' : '', none, { list: l.id, sec: null });
    secs.forEach(s => add('sec:' + s.id, s.name, tasks.filter(t => t.sec === s.id), { list: l.id, sec: s.id }, { sec: s }));
    if (G.length > 1 && !G[0].items.length && G[0].key === 'sec:') G.shift();
  } else if (mode === 'date') {
    const T = today(), buckets = new Map();
    const over = tasks.filter(t => tDate(t) && tDate(t) < T && !(id === 'today' && t.start && dOnly(t.start) <= T && t.due && dOnly(t.due) >= T));
    if (over.length) add('over', 'Atrasadas', over, { due: T }, { red: true, resched: true });
    const rest = tasks.filter(t => !over.includes(t));
    rest.forEach(t => { const d = tDate(t) && tDate(t) < T ? T : (tDate(t) || ''); if (!buckets.has(d)) buckets.set(d, []); buckets.get(d).push(t); });
    const days = id === 'today' ? [T] : id === 'week' ? [0, 1, 2, 3, 4, 5, 6].map(i => addD(T, i)) : [...buckets.keys()].filter(Boolean).sort();
    days.forEach(d => add('d:' + d, dayLabel(d), buckets.get(d) || [], { due: d }, { date: d }));
    if (buckets.get('') && buckets.get('').length) add('d:', 'Sem data', buckets.get(''), { due: null });
  } else if (mode === 'prio') {
    [3, 2, 1, 0].forEach(p => add('p:' + p, 'Prioridade ' + PRIO[p].n.toLowerCase(), tasks.filter(t => (t.prio || 0) === p), { prio: p }, { color: PRIO[p].c }));
  } else if (mode === 'list') {
    const ls = db.l.filter(l => !l.arch).sort((a, b) => (a.id === 'inbox' ? -1 : b.id === 'inbox' ? 1 : (a.o || 0) - (b.o || 0)));
    ls.forEach(l => { const it = tasks.filter(t => t.list === l.id); if (it.length) add('l:' + l.id, l.name, it, { list: l.id, sec: null }, { color: l.color }); });
  } else add('all', '', tasks, {});
  return G;
}
function dayLabel(d) {
  const x = pd(d), n = diffD(today(), d), base = `${wdShort[x.getDay()]}, ${x.getDate()} ${monShort[x.getMonth()]}`;
  return n === 0 ? 'Hoje · ' + base : n === 1 ? 'Amanhã · ' + base : cap(wdNames[x.getDay()]) + ' · ' + x.getDate() + ' ' + monShort[x.getMonth()];
}
function tasksForScope(id, info) {
  return db.t.filter(t => !t.del && !t.par && info.f(t));
}

/* ---------- linha de tarefa ---------- */
const SHOW_KEYS = [['date', 'Data e horário'], ['rep', 'Repetição e lembrete'], ['prog', 'Itens e subtarefas'], ['icons', 'Anexos, vínculos e descrição'], ['tags', 'Etiquetas'], ['list', 'Nome da lista'], ['cover', 'Foto de capa'], ['prio', 'Cor da prioridade'], ['notes', 'Prévia da descrição']];
const SHOW_DEF = { date: 1, rep: 1, prog: 1, icons: 1, tags: 1, list: 1, cover: 1, prio: 1, notes: 0 };
const showFor = id => Object.assign({}, SHOW_DEF, db.s.showDef || {}, (id && viewCfg(id).show) || {});
function displayMenu(anchor, id) {
  const sh = showFor(id), own = !!viewCfg(id).show;
  const el = pop(anchor, `<div class="dispm"><div class="mtitle">Detalhes exibidos nas tarefas</div>
    ${SHOW_KEYS.map(([k, n]) => `<label class="srow"><span>${n}</span><span class="sw-t"><input type="checkbox" data-k="${k}" ${sh[k] ? 'checked' : ''}><span></span></span></label>`).join('')}
    <div class="row"><button class="btn ghost sm" data-all>Usar em todas as listas</button>${own ? '<button class="btn ghost sm" data-reset>Voltar ao padrão</button>' : ''}</div></div>`, { cls: 'dispwrap', right: 1 });
  el.addEventListener('change', e => {
    const k = e.target.dataset.k; if (!k) return;
    const c = viewCfg(id); c.show = Object.assign({}, showFor(id), { [k]: e.target.checked ? 1 : 0 });
    db.s.views = db.s.views || {}; db.s.views[id] = c; put('s', db.s);
  });
  el.querySelector('[data-all]').onclick = () => { db.s.showDef = showFor(id); Object.values(db.s.views || {}).forEach(v => delete v.show); put('s', db.s); closePop(); toast('Aplicado a todas as listas'); };
  const r = el.querySelector('[data-reset]'); if (r) r.onclick = () => { const c = viewCfg(id); delete c.show; db.s.views[id] = c; put('s', db.s); closePop(); };
}
function metaHtml(t, opts = {}) {
  const m = [], sh = opts.show || SHOW_DEF;
  const d = sh.date ? (t.due || t.start) : null;
  if (d) {
    const od = overdue(t), dd = dOnly(t.due || t.start), cls = od ? 'red' : dd === today() ? 'today' : dd === addD(today(), 1) ? 'tom' : '';
    let txt = fmtWhen(t.start && t.due && dOnly(t.start) === dOnly(t.due) ? t.start : d);
    if (t.start && t.due && tOnly(t.start) && dOnly(t.start) === dOnly(t.due)) txt += '–' + tOnly(t.due);
    else if (t.start && t.due && dOnly(t.start) !== dOnly(t.due)) txt = fmtDay(dOnly(t.start)) + ' → ' + fmtDay(dOnly(t.due));
    m.push(`<span class="md ${cls}">${ic('cal', 13)}${esc(txt)}</span>`);
  }
  if (sh.rep && t.rep) m.push(`<span class="md" title="${esc(repText(t.rep))}">${ic('repeat', 13)}</span>`);
  if (sh.rep && (t.rem || []).length && tOnly(t.due || t.start)) m.push(`<span class="md">${ic('bell', 13)}</span>`);
  const ck = t.chk || [];
  if (sh.prog && ck.length) m.push(`<span class="md">${ic('todo', 13)}${ck.filter(c => c.done).length}/${ck.length}</span>`);
  const subs = subsOf(t.id);
  if (sh.prog && subs.length) m.push(`<span class="md">${ic('sub', 13)}${subs.filter(s => s.done).length}/${subs.length}</span>`);
  if (sh.icons && (t.att || []).length) m.push(`<span class="md">${ic('clip', 13)}${t.att.length}</span>`);
  const lk = (t.ln && (t.ln.d.length + t.ln.t.length)) || 0;
  if (sh.icons && (t.cm || []).length) m.push(`<span class="md" title="Comentários">${ic('chat', 13)}${t.cm.length}</span>`);
  if (sh.icons && lk) m.push(`<span class="md">${ic('link', 13)}${lk}</span>`);
  if (sh.icons && !sh.notes && t.notes && stripHtml(t.notes)) m.push(`<span class="md">${ic('doc', 13)}</span>`);
  if (sh.icons && t.gc) m.push(`<span class="md" title="No Google Agenda">${ic('google', 13)}</span>`);
  if (sh.tags) (t.tags || []).forEach(gid => { const g = get('g', gid); if (g) m.push(`<span class="mtag" style="--c:${esc(g.color)}">${g.emoji ? esc(g.emoji) + ' ' : '#'}${esc(g.name)}</span>`); });
  if (opts.showList && sh.list) { const l = listOf(t); m.push(`<span class="mlist">${esc(l.name)}<span class="ldot" style="background:${esc(l.color || '#808080')}"></span></span>`); }
  return m.join('');
}
function rowHtml(t, opts = {}) {
  const subs = subsOf(t.id), open = OPEN_SUBS.has(t.id);
  const lvl = opts.lvl || 0;
  const sh = opts.show || SHOW_DEF;
  const cov = t.cover && sh.cover ? (opts.card ? `<div class="ccov" data-act="topen" data-id="${t.id}"><img alt="" data-timg="${esc(t.cover.id)}" data-tid="${t.id}"></div>` : `<span class="rthumb" data-act="topen" data-id="${t.id}"><img alt="" data-timg="${esc(t.cover.id)}" data-tid="${t.id}"></span>`) : '';
  return `<div class="trow p${sh.prio ? t.prio || 0 : 0}${t.done ? ' done' : ''}${R.sel === t.id ? ' sel' : ''}${opts.card ? ' card' : ''}${cov && opts.card ? ' hascov' : ''}" style="--lvl:${lvl}" data-drag="t:${t.id}" data-drop="row:${t.id}" data-ctx="task:${t.id}">${opts.card ? cov : ''}
    ${subs.length && !opts.card ? `<button class="caret${open ? ' open' : ''}" data-act="subs" data-id="${t.id}" aria-label="${open ? 'Ocultar' : 'Mostrar'} subtarefas">${ic('chev', 14)}</button>` : ''}
    ${t.note ? `<button class="notemark" data-act="topen" data-id="${t.id}" aria-label="Anotação: ${esc(t.title)}" title="Anotação">${ic('doc', 16)}</button>` : `<button class="chk" data-act="tcheck" data-id="${t.id}" role="checkbox" aria-checked="${t.done}" aria-label="${t.done ? 'Reabrir' : 'Concluir'}: ${esc(t.title)}"><span>${ic('check', 12)}</span></button>`}
    <div class="tmain" data-act="topen" data-id="${t.id}"><div class="ttl">${linkifyText(t.title, { short: 1 }) || '<span class="mut">Sem título</span>'}</div>${sh.notes && t.notes && stripHtml(t.notes) ? `<div class="tnote">${linkifyText(stripHtml(t.notes).slice(0, 160), { short: 1 })}</div>` : ''}${opts.noMeta ? '' : `<div class="tmeta">${metaHtml(t, opts)}</div>`}</div>${opts.card ? '' : cov}
    ${opts.trash ? `<div class="tact on"><button class="btn ghost sm" data-act="restore" data-id="${t.id}">Restaurar</button><button class="ib" data-act="purge" data-id="${t.id}" aria-label="Excluir definitivamente">${ic('trash', 18)}</button></div>` :
      `<div class="tact"><button class="ib" data-act="tdate" data-id="${t.id}" aria-label="Definir data">${ic('cal', 18)}</button><button class="ib" data-act="tmore" data-id="${t.id}" aria-label="Mais opções">${ic('more', 18)}</button></div>`}
  </div>${subs.length && open && !opts.card ? subs.sort((a, b) => (a.o || 0) - (b.o || 0)).filter(s => !s.done || opts.withDone).map(s => rowHtml(s, Object.assign({}, opts, { lvl: lvl + 1 }))).join('') : ''}`;
}
function qaHtml(gkey, ph) {
  const nl = R.v === 'list' && (get('l', R.id) || {}).kind === 'notes';
  if (QA !== gkey) return `<button class="qa-open" data-act="qa" data-g="${esc(gkey)}">${ic('plus', 18)}<span>${nl ? 'Adicionar anotação' : 'Adicionar tarefa'}</span></button>`;
  return `<div class="qa" data-keep data-g="${esc(gkey)}">
    <input class="qin" placeholder="${esc(ph || 'Ex.: Dentista amanhã às 15h #saúde !alta')}" aria-label="Nova tarefa" autocomplete="off" enterkeyhint="done">
    <input class="qnote" placeholder="Descrição" aria-label="Descrição">
    <div class="qtok"></div>
    <div class="qbar"><button class="chipb" data-qa="date" data-pop>${ic('cal', 16)}<span>Data</span></button><button class="chipb" data-qa="prio" data-pop>${ic('flag', 16)}<span>Prioridade</span></button><button class="chipb" data-qa="tag" data-pop>${ic('tag', 16)}<span>Etiqueta</span></button>
    <span class="sp"></span><button class="btn ghost sm" data-qa="cancel">Cancelar</button><button class="btn red sm" data-qa="add">Adicionar</button></div></div>`;
}

/* ---------- tela de lista ---------- */
VIEWS.list = main => {
  const id = R.id;
  if (id === 'done') return renderDone(main);
  if (id === 'trash') return renderTrash(main);
  const info = scopeInfo(id);
  if (!info) { main.innerHTML = headHtml('Lista não encontrada') + '<div class="scroll"><div class="empty"><p>Esta lista não existe mais.</p><a class="btn" href="#/l/today">Ir para Hoje</a></div></div>'; return; }
  db.s.lastList = id;
  if (info.list && info.list.kind === 'notes') return renderNoteList(main, info);
  const cfg = viewCfg(id);
  const mode = cfg.group || info.group;
  const board = info.list && info.list.view === 'board';
  const all = tasksForScope(id, info);
  const liveT = all.filter(t => !t.done);
  const doneT = all.filter(t => t.done).sort((a, b) => (b.dt || 0) - (a.dt || 0));
  const sorter = (a, b) => sortTasks(a, b, cfg.sort);
  const groups = groupsFor(id, info, liveT, board && mode === 'sec' ? 'sec' : mode).map(g => (g.items.sort(sorter), g));
  GMAP = {};
  groups.forEach(g => GMAP[g.key] = { set: Object.assign({}, info.def, g.set), ids: g.items.map(t => t.id) });
  let sub = '';
  if (id === 'today') {
    const h = new Date().getHours(), nm = (db.s.name || '').trim().split(' ')[0];
    const doneToday = db.t.filter(t => !t.del && !t.par && t.done && t.dt && ymd(new Date(t.dt)) === today()).length + db.t.reduce((n, t) => n + (t.hist || []).filter(x => ymd(new Date(x.at)) === today()).length, 0);
    const tot = doneToday + liveT.length, pct = tot ? Math.round(doneToday / tot * 100) : 0;
    sub = `${h < 12 ? 'Bom dia' : h < 18 ? 'Boa tarde' : 'Boa noite'}${nm ? ', ' + esc(nm) : ''} · ${esc(fmtLong(today()))}<span class="tprog" title="${doneToday} de ${tot} concluídas hoje"><i style="width:${pct}%"></i></span><span class="tpct">${doneToday}/${tot}</span>`;
  }
  const right = `${info.list ? `<button class="ib" data-act="vboard" aria-label="${board ? 'Ver como lista' : 'Ver como quadro'}" title="${board ? 'Lista' : 'Quadro'}">${ic(board ? 'list' : 'board')}</button>` : ''}
    <button class="ib" data-act="vshow" aria-label="Detalhes exibidos" title="Detalhes exibidos">${ic('eye')}</button>
    <button class="ib" data-act="vsort" aria-label="Ordenar e agrupar">${ic('sort')}</button>
    <button class="ib" data-act="vmore" aria-label="Mais opções">${ic('more')}</button>`;
  const pre = info.color ? `<span class="ldot big" style="background:${esc(info.color)}"></span>` : '';
  let body = '';
  const showList = info.kind !== 'list', show = showFor(id);
  if (board) {
    body = `<div class="board">${groups.map(g => `<section class="bcol" data-drop="grp:${esc(g.key)}">
      <header class="bch" ${g.sec ? `data-act="secmenu" data-sec="${g.sec.id}"` : ''}><b>${esc(g.name || 'Tarefas')}</b><span class="cnt">${g.items.length}</span>${g.sec ? `<button class="mini" data-act="secmenu" data-sec="${g.sec.id}" aria-label="Opções da seção">${ic('more', 16)}</button>` : ''}</header>
      <div class="cards">${g.items.map(t => rowHtml(t, { card: 1, showList, show })).join('')}${qaHtml(g.key)}</div></section>`).join('')}
      ${info.list ? `<button class="bcol addcol" data-act="addsec" title="Nova seção" aria-label="Nova seção">${ic('plus', 18)}<span>Nova seção</span></button>` : ''}</div>`;
  } else {
    body = groups.map(g => {
      const shut = SHUT_GROUPS.has(id + g.key);
      const head = g.name ? `<div class="gh${g.red ? ' red' : ''}" data-drop="grp:${esc(g.key)}"><button class="caret${shut ? '' : ' open'}" data-act="gtoggle" data-g="${esc(id + g.key)}" aria-label="${shut ? 'Abrir' : 'Fechar'} grupo">${ic('chev', 14)}</button><b>${esc(g.name)}</b><span class="cnt">${g.items.length}</span><span class="sp"></span>${g.resched ? `<button class="link" data-act="resched">Reagendar</button>` : ''}${g.sec ? `<button class="mini" data-act="secmenu" data-sec="${g.sec.id}" aria-label="Opções da seção">${ic('more', 16)}</button>` : ''}</div>` : '';
      return `<section class="grp" data-drop="grp:${esc(g.key)}">${head}${shut ? '' : g.items.map(t => rowHtml(t, { showList, show })).join('') + (g.key === 'over' ? '' : qaHtml(g.key))}</section>`;
    }).join('');
    if (info.list) body += `<button class="addsec" data-act="addsec">${ic('plus', 16)}<span>Adicionar seção</span></button>`;
    if (!liveT.length && !doneT.length) body += emptyHtml(id);
    if (doneT.length) {
      const sh = cfg.showDone;
      body += `<section class="grp donegrp"><div class="gh"><button class="caret${sh ? ' open' : ''}" data-act="showdone" aria-label="${sh ? 'Ocultar' : 'Mostrar'} concluídas">${ic('chev', 14)}</button><b>Concluídas</b><span class="cnt">${doneT.length}</span></div>${sh ? doneT.slice(0, 200).map(t => rowHtml(t, { showList, show })).join('') : ''}</section>`;
    }
  }
  if (id === 'inbox') { const dg = dupGroups(); if (dg.length) body = `<div class="dupbar">${ic('copy', 18)}<span class="f1"><b>${plural(dg.reduce((n, g) => n + g.drop.length, 0), 'tarefa repetida', 'tarefas repetidas')}</b> aqui também ${dg.some(g => g.keep.list !== 'inbox') ? 'estão em outras listas' : 'aparecem duas vezes'}.</span><button class="btn sm red" data-act="dupfix">Revisar</button></div>` + body; }
  main.innerHTML = headHtml(info.name, sub, right, { pre }) + `<div class="scroll${board ? ' hscroll' : ''}"><div class="tlist${board ? ' isboard' : ''}">${body}</div></div><button class="fab" data-act="quick" aria-label="Adicionar tarefa">${ic('plus', 26)}</button>`;
  bindOpenQa(main);
};
function emptyHtml(id) {
  const msg = { today: ['Dia livre', 'Nada para hoje. Aproveite ou adicione algo novo.'], week: ['Semana tranquila', 'Nenhuma tarefa nos próximos 7 dias.'], tomorrow: ['Nada para amanhã', ''], inbox: ['Caixa de entrada vazia', 'Tudo organizado.'] }[id] || ['Sem tarefas', 'Adicione a primeira tarefa desta lista.'];
  return `<div class="empty"><div class="eic">${ic('done', 44)}</div><p><b>${msg[0]}</b></p><p class="mut">${msg[1]}</p></div>`;
}
function renderDone(main) {
  const done = db.t.filter(t => t.done && !t.del).sort((a, b) => (b.dt || 0) - (a.dt || 0));
  const rep = [];
  db.t.forEach(t => (t.hist || []).forEach(h => rep.push({ t, at: h.at })));
  const items = done.map(t => ({ t, at: t.dt || 0 })).concat(rep).sort((a, b) => b.at - a.at).slice(0, 500);
  const by = new Map();
  items.forEach(x => { const d = ymd(new Date(x.at || 0)); if (!by.has(d)) by.set(d, []); by.get(d).push(x); });
  let h = '';
  by.forEach((arr, d) => {
    h += `<section class="grp"><div class="gh"><b>${esc(fmtDay(d, true))}</b><span class="cnt">${arr.length}</span></div>${arr.map(x => x.t.done && x.at === x.t.dt ? rowHtml(x.t, { showList: 1 }) : `<div class="trow done ghostrow"><span class="chk on"><span>${ic('check', 12)}</span></span><div class="tmain" data-act="topen" data-id="${x.t.id}"><div class="ttl">${esc(x.t.title)}</div><div class="tmeta"><span class="md">${ic('repeat', 13)}ocorrência concluída às ${hm(new Date(x.at))}</span></div></div></div>`).join('')}</section>`;
  });
  main.innerHTML = headHtml('Concluídas', plural(items.length, 'tarefa concluída', 'tarefas concluídas'), `<button class="ib" data-act="exportdone" aria-label="Exportar">${ic('export')}</button>`) + `<div class="scroll"><div class="tlist">${h || '<div class="empty"><p class="mut">Nada concluído ainda.</p></div>'}</div></div>`;
}
function renderTrash(main) {
  const tr = db.t.filter(t => t.del && !t.par).sort((a, b) => b.del - a.del);
  const docs = db.d.filter(d => d.del).sort((a, b) => b.del - a.del);
  main.innerHTML = headHtml('Lixeira', 'Itens são apagados de vez após 30 dias', (tr.length || docs.length) ? `<button class="btn ghost sm" data-act="emptytrash">Esvaziar</button>` : '') +
    `<div class="scroll"><div class="tlist">${tr.length ? `<section class="grp"><div class="gh"><b>Tarefas</b><span class="cnt">${tr.length}</span></div>${tr.map(t => rowHtml(t, { trash: 1, showList: 1 })).join('')}</section>` : ''}
    ${docs.length ? `<section class="grp"><div class="gh"><b>Documentos</b><span class="cnt">${docs.length}</span></div>${docs.map(d => `<div class="trow"><span class="dicon">${esc(d.icon || '📄')}</span><div class="tmain"><div class="ttl">${esc(d.title || 'Sem título')}</div></div><div class="tact on"><button class="btn ghost sm" data-act="drestore" data-id="${d.id}">Restaurar</button><button class="ib" data-act="dpurge" data-id="${d.id}" aria-label="Excluir definitivamente">${ic('trash', 18)}</button></div></div>`).join('')}</section>` : ''}
    ${!tr.length && !docs.length ? '<div class="empty"><div class="eic">' + ic('trash', 44) + '</div><p class="mut">A lixeira está vazia.</p></div>' : ''}</div></div>`;
}

/* ---------- matriz de prioridades ---------- */
const QUADS = [{ p: 3, n: 'Urgente e importante', h: 'Faça agora', c: '#DB4035' }, { p: 2, n: 'Importante, não urgente', h: 'Planeje', c: '#E8803A' }, { p: 1, n: 'Urgente, não importante', h: 'Delegue ou faça rápido', c: '#3B7DD8' }, { p: 0, n: 'Nem urgente nem importante', h: 'Deixe para depois', c: '#808080' }];
VIEWS.matrix = main => {
  const liveT = db.t.filter(t => live(t) && !t.par);
  GMAP = {};
  main.innerHTML = headHtml('Matriz de prioridades', 'Arraste as tarefas entre os quadrantes para mudar a prioridade') + `<div class="scroll mtxwrap"><div class="matrix">${QUADS.map(q => {
    const it = liveT.filter(t => (t.prio || 0) === q.p).sort((a, b) => sortTasks(a, b, 'date'));
    GMAP['q:' + q.p] = { set: { prio: q.p }, ids: it.map(t => t.id) };
    return `<section class="quad" style="--qc:${q.c}" data-drop="grp:q:${q.p}"><header><b>${q.n}</b><span class="mut">${q.h}</span><span class="cnt">${it.length}</span></header><div class="qlist">${it.map(t => rowHtml(t, { showList: 1 })).join('') || '<p class="hint">Nenhuma tarefa</p>'}${qaHtml('q:' + q.p)}</div></section>`;
  }).join('')}</div></div>`;
  bindOpenQa(main);
};

/* ---------- busca ---------- */
let SQ = { q: '', f: 'all' };
VIEWS.search = main => {
  main.innerHTML = headHtml('Buscar') + `<div class="scroll"><div class="tlist"><div class="sbox" data-keep>${ic('search', 20)}<input id="sq" class="in" type="search" placeholder="Tarefas, notas, documentos, etiquetas…" value="${esc(SQ.q)}" autocomplete="off"></div>
    <div class="chips">${[['all', 'Tudo'], ['t', 'Tarefas'], ['d', 'Documentos'], ['done', 'Concluídas']].map(([k, n]) => `<button class="chip${SQ.f === k ? ' on' : ''}" data-act="sf" data-f="${k}">${n}</button>`).join('')}</div>
    <div id="sres"></div></div></div>`;
  const inp = $('#sq');
  inp.oninput = () => { SQ.q = inp.value; drawResults(); };
  drawResults();
  if (!isMobile()) inp.focus();
};
function drawResults() {
  const box = $('#sres'); if (!box) return;
  const q = norm(SQ.q.trim());
  if (!q) { box.innerHTML = '<p class="hint pad">Dica: busque por palavras, por <b>#etiqueta</b> ou por uma data como <b>hoje</b>.</p>'; return; }
  const terms = q.split(/\s+/);
  const hit = s => terms.every(w => s.includes(w));
  let h = '';
  if (SQ.f !== 'd') {
    const ts = db.t.filter(t => !t.del && (SQ.f === 'done' ? t.done : SQ.f === 't' ? !t.done : true)).filter(t => {
      const s = norm([t.title, stripHtml(t.notes), (t.chk || []).map(c => c.t).join(' '), (t.tags || []).map(g => '#' + (get('g', g) || {}).name).join(' '), listOf(t).name, t.due ? fmtDay(dOnly(t.due)) : ''].join(' '));
      return hit(s);
    }).sort((a, b) => (a.done - b.done) || sortTasks(a, b, 'date')).slice(0, 150);
    if (ts.length) h += `<section class="grp"><div class="gh"><b>Tarefas</b><span class="cnt">${ts.length}</span></div>${ts.map(t => rowHtml(t, { showList: 1 })).join('')}</section>`;
  }
  if (SQ.f === 'all' || SQ.f === 'd') {
    const ds = db.d.filter(d => !d.del && hit(norm(d.title + ' ' + (d.b || []).map(b => stripHtml(b.text) + ' ' + (b.rows || []).flat().join(' ')).join(' ')))).slice(0, 80);
    if (ds.length) h += `<section class="grp"><div class="gh"><b>Documentos</b><span class="cnt">${ds.length}</span></div>${ds.map(d => `<a class="trow" href="#/doc/${d.id}"><span class="dicon">${esc(d.icon || '📄')}</span><div class="tmain"><div class="ttl">${esc(d.title || 'Sem título')}</div><div class="tmeta"><span class="md">${esc(snippet(d, terms))}</span></div></div></a>`).join('')}</section>`;
  }
  box.innerHTML = h || '<div class="empty"><p class="mut">Nada encontrado.</p></div>';
}
function snippet(d, terms) {
  const txt = (d.b || []).map(b => stripHtml(b.text)).join(' · ');
  const i = norm(txt).indexOf(terms[0]);
  return i < 0 ? txt.slice(0, 90) : (i > 30 ? '…' : '') + txt.slice(Math.max(0, i - 30), i + 70);
}

/* ---------- adicionar rápido ---------- */
function bindOpenQa(main) {
  if (!QA) return;
  const box = main.querySelector('.qa[data-g]');
  if (!box) { QA = null; return; }
  const g = box.dataset.g;
  bindQa(box, () => (GMAP[g] || {}).set || {});
  const inp = box.querySelector('.qin'), nt = box.querySelector('.qnote');
  if (QA_DRAFT && QA_DRAFT.g === g) { inp.value = QA_DRAFT.v; if (nt) nt.value = QA_DRAFT.n || ''; inp.dispatchEvent(new Event('input')); }
  QA_DRAFT = null;
  inp.focus();
  /* tocar fora do campo de adicionar fecha (o texto digitado pode ser recuperado em "Desfazer") */
  const out = e => {
    if (!document.body.contains(box)) { document.removeEventListener('pointerdown', out, true); return; }
    const tg = e.target;
    if (box.contains(tg) || tg.closest('.pop,#modal,.dp,.dpick,.toast,#toast')) return;
    document.removeEventListener('pointerdown', out, true);
    const v = inp.value.trim(), n = nt ? nt.value.trim() : '';
    QA = null; render(true);
    if (v) toast('Rascunho fechado', 'Desfazer', () => { QA_DRAFT = { g, v, n }; QA = g; render(true); }, 5000);
  };
  setTimeout(() => document.addEventListener('pointerdown', out, true), 0);
}
let QA_DRAFT = null;
function bindQa(box, base) {
  const inp = box.querySelector('.qin'), note = box.querySelector('.qnote'), tok = box.querySelector('.qtok');
  const extra = { prio: null, tags: [], dp: null };
  const upd = () => {
    const p = parseSmart(inp.value);
    let h = smartTokensHtml(p);
    if (extra.dp && extra.dp.date) h += `<span class="tok date">${ic('cal', 14)}${esc(fmtDay(extra.dp.date))}${extra.dp.time ? ' ' + extra.dp.time : ''}</span>`;
    if (extra.prio) h += `<span class="tok p${extra.prio}">${ic('flag', 14)}${PRIO[extra.prio].n}</span>`;
    extra.tags.forEach(g => { const t = get('g', g); if (t) h += `<span class="tok tag">${ic('tag', 14)}${esc(t.name)}</span>`; });
    tok.innerHTML = h;
    tok.classList.toggle('on', !!h);
  };
  const submit = () => {
    const txt = inp.value.trim();
    if (!txt) return;
    const t = taskFromSmart(txt, Object.assign({}, base()));
    if (extra.dp) dpToTask(t, extra.dp);
    if (extra.prio) t.prio = extra.prio;
    if (extra.tags.length) t.tags = [...new Set([...(t.tags || []), ...extra.tags])];
    if (note && note.value.trim()) t.notes = esc(note.value.trim());
    const ids = (GMAP[box.dataset.g] || {}).ids || [];
    const last = ids.length ? get('t', ids[ids.length - 1]) : null;
    t.o = last ? (last.o || 0) + 1 : Date.now();
    put('t', t);
    if (typeof gcalPushTask === 'function') gcalPushTask(t);
    inp.value = ''; if (note) note.value = ''; extra.prio = null; extra.tags = []; extra.dp = null; upd();
    toast('Tarefa adicionada' + (t.due ? ' para ' + fmtWhen(t.due).toLowerCase() : ''), 'Abrir', () => openTask(t.id), 2600);
    return t;
  };
  inp.addEventListener('input', upd);
  inp.addEventListener('keydown', e => {
    if (e.key === 'Enter' && !e.isComposing) { e.preventDefault(); if (submit()) close(); }
    if (e.key === 'Escape') { e.stopPropagation(); close(); }
  });
  const close = () => { if (box.closest('#modal')) closeModal(); else { QA = null; render(true); } };
  box.addEventListener('click', e => {
    const b = e.target.closest('[data-qa]'); if (!b) return;
    const k = b.dataset.qa;
    if (k === 'add') { if (submit()) close(); else inp.focus(); }
    if (k === 'cancel') close();
    if (k === 'date') datePicker(b, extra.dp || { date: base().due ? dOnly(base().due) : null }, v => { extra.dp = v; upd(); inp.focus(); });
    if (k === 'prio') menu(b, [3, 2, 1, 0].map(p => ({ label: 'Prioridade ' + PRIO[p].n.toLowerCase(), color: PRIO[p].c, on: extra.prio === p, act: () => { extra.prio = p || null; upd(); inp.focus(); } })));
    if (k === 'tag') tagMenu(b, extra.tags, ids => { extra.tags = ids; upd(); });
    if (k === 'list') menu(b, db.l.filter(l => !l.arch).map(l => ({ label: l.name, color: l.color, act: () => { extra.list = l.id; b.querySelector('span').textContent = l.name; } })));
  });
  upd();
  return { submit };
}
function quickAdd(preset = {}) {
  const id = R.v === 'list' ? R.id : '';
  const info = id ? scopeInfo(id) : null;
  const base = Object.assign({}, info && info.def ? info.def : {}, preset);
  const el = modal(`<h2>Nova tarefa</h2><div class="qa big" data-keep data-g="">
    <input class="qin" placeholder="Ex.: Dentista amanhã às 15h #saúde !alta" aria-label="Nova tarefa" autocomplete="off" enterkeyhint="done">
    <input class="qnote" placeholder="Descrição" aria-label="Descrição">
    <div class="qtok"></div>
    <div class="qbar"><button class="chipb" data-qa="date" data-pop>${ic('cal', 16)}<span>Data</span></button><button class="chipb" data-qa="prio" data-pop>${ic('flag', 16)}<span>Prioridade</span></button><button class="chipb" data-qa="tag" data-pop>${ic('tag', 16)}<span>Etiqueta</span></button><button class="chipb" data-qa="list" data-pop>${ic('list', 16)}<span>${esc((get('l', base.list) || get('l', db.s.defList) || get('l', 'inbox')).name)}</span></button>
    <span class="sp"></span><button class="btn ghost sm" data-qa="cancel">Cancelar</button><button class="btn red sm" data-qa="add">Adicionar</button></div>
    <p class="hint">Dicas: <b>amanhã 9h</b>, <b>toda segunda</b>, <b>dia 15</b>, <b>das 14h às 16h</b>, <b>#etiqueta</b>, <b>~lista</b>, <b>!alta</b>, <b>lembrar 30 min antes</b></p></div>`, { cls: 'qmodal' });
  const box = el.querySelector('.qa');
  const extraList = { v: null };
  const api = bindQa(box, () => Object.assign({}, base, extraList.v ? { list: extraList.v, sec: null } : {}));
  const lb = box.querySelector('[data-qa=list]');
  lb.addEventListener('click', e => {
    e.stopImmediatePropagation();
    const nm = l => (l.folder && get('f', l.folder) ? folderPathName(get('f', l.folder)) + ' / ' : '') + (l.emoji ? l.emoji + ' ' : '') + l.name;
    menu(lb, [{ head: 'Adicionar em' }, ...db.l.filter(l => !l.arch).sort((a, b) => nm(a).localeCompare(nm(b))).map(l => ({ label: nm(l), color: l.color, on: (extraList.v || base.list || db.s.defList || 'inbox') === l.id, act: () => { extraList.v = l.id; lb.querySelector('span').textContent = l.name; } }))]);
  }, true);
  setTimeout(() => box.querySelector('.qin').focus(), 50);
  return api;
}
function tagMenu(anchor, sel, done) {
  sel = [...sel];
  const draw = () => menu(anchor, [
    ...db.g.map(g => ({ label: g.name, color: g.color, on: sel.includes(g.id), keep: 1, act: () => { sel = sel.includes(g.id) ? sel.filter(x => x !== g.id) : sel.concat(g.id); done(sel); draw(); } })),
    { sep: 1 },
    { label: 'Nova etiqueta…', icon: 'plus', act: async () => { const n = await ask('Nova etiqueta', '', { ph: 'Ex.: casa' }); if (n) { const id = tagIdsFromNames([n])[0]; changed(); sel.push(id); done(sel); } } },
  ]);
  draw();
}

/* ---------- ações das tarefas ---------- */
function checkTask(id, el) {
  const t = get('t', id); if (!t || t.note) return;
  const row = el && el.closest('.trow');
  const go = () => {
    const r = completeTask(t);
    if (typeof gcalAfterComplete === 'function') gcalAfterComplete(t, r);
    if (r.repeated) toast('Próxima: ' + fmtWhen(r.next), 'Desfazer', () => { put('t', Object.assign(t, r.before)); });
    else if (t.done) { toast('Tarefa concluída', 'Desfazer', () => { Object.assign(t, r.before); put('t', t); }); playDone(); }
  };
  if (row && !t.done) { row.classList.add('checking'); setTimeout(() => { row.classList.add('leaving'); setTimeout(go, 280); }, 320); } else go();
}
function playDone() {
  if (!db.s.pomo.sound) return;
  try { const a = new (window.AudioContext || window.webkitAudioContext)(), o = a.createOscillator(), g = a.createGain(); o.type = 'sine'; o.frequency.setValueAtTime(880, a.currentTime); o.frequency.exponentialRampToValueAtTime(1320, a.currentTime + .09); g.gain.setValueAtTime(.06, a.currentTime); g.gain.exponentialRampToValueAtTime(.0001, a.currentTime + .25); o.connect(g); g.connect(a.destination); o.start(); o.stop(a.currentTime + .26); } catch (e) {}
}
function deleteTask(t) {
  const before = clone(t);
  t.del = Date.now(); put('t', t);
  subsOf(t.id).forEach(s => { s.del = t.del; put('t', s, { silent: true }); });
  if (R.sel === t.id) closeTask();
  if (typeof gcalDeleteTask === 'function') gcalDeleteTask(t);
  toast('Tarefa movida para a Lixeira', 'Desfazer', () => { Object.assign(t, before); put('t', t); db.t.filter(s => s.par === t.id && s.del === before.del).forEach(s => { s.del = null; put('t', s, { silent: true }); }); changed(); });
}
function duplicateTask(t) {
  const c = clone(t); c.id = uid(); c.title += ' (cópia)'; c.gc = null; c.done = false; c.dt = null; c.hist = []; c.c = Date.now(); c.o = (t.o || 0) + 0.5;
  put('t', c);
  subsOf(t.id).forEach(s => { const x = clone(s); x.id = uid(); x.par = c.id; x.gc = null; put('t', x, { silent: true }); });
  changed();
  return c;
}
function taskMenu(t, anchor, at) {
  menu(anchor, [
    { html: `<div class="mprio">${[3, 2, 1, 0].map(p => `<button class="pbtn${(t.prio || 0) === p ? ' on' : ''}" data-p="${p}" style="color:${PRIO[p].c}" aria-label="Prioridade ${PRIO[p].n}">${ic('flag', 20)}</button>`).join('')}</div>` },
    { sep: 1 },
    { label: 'Abrir', icon: 'eye', act: () => openTask(t.id) },
    { label: 'Data e repetição…', icon: 'cal', act: () => datePicker(anchor, taskToDp(t), v => { dpToTask(t, v); put('t', t); if (typeof gcalPushTask === 'function') gcalPushTask(t); }) },
    { label: 'Hoje', icon: 'today', act: () => { t.due = today() + (tOnly(t.due) ? 'T' + tOnly(t.due) : ''); t.start = null; put('t', t); gcalPushTask && gcalPushTask(t); } },
    { label: 'Amanhã', icon: 'tomorrow', act: () => { t.due = addD(today(), 1) + (tOnly(t.due) ? 'T' + tOnly(t.due) : ''); t.start = null; put('t', t); gcalPushTask && gcalPushTask(t); } },
    { label: 'Mover para…', icon: 'list', act: () => menu(anchor, db.l.filter(l => !l.arch).map(l => ({ label: l.name, color: l.color, on: t.list === l.id, act: () => { t.list = l.id; t.sec = null; put('t', t); toast('Movida para ' + l.name); } })), { at }) },
    { label: 'Etiquetas…', icon: 'tag', act: () => tagMenu(anchor, t.tags || [], ids => { t.tags = ids; put('t', t); }) },
    { label: 'Adicionar subtarefa', icon: 'sub', act: () => { openTask(t.id); setTimeout(() => { const i = $('#detail .addsub input'); if (i) i.focus(); }, 80); } },
    { label: 'Iniciar foco', icon: 'focus', act: () => { startFocusOn(t.id); } },
    { label: t.note ? 'Converter em tarefa' : 'Converter em anotação', icon: t.note ? 'todo' : 'doc', act: () => toggleNote(t) },
    { label: 'Duplicar', icon: 'copy', act: () => { duplicateTask(t); toast('Tarefa duplicada'); } },
    { label: 'Exportar…', icon: 'export', act: () => exportMenu(anchor, { kind: 'task', id: t.id }) },
    { sep: 1 },
    { label: 'Excluir', icon: 'trash', danger: 1, act: () => deleteTask(t) },
  ], { at });
  const m = POP;
  m.querySelectorAll('[data-p]').forEach(b => b.onclick = () => { t.prio = +b.dataset.p; put('t', t); closePop(); });
}
Object.assign(ACTS, {
  tcheck: b => { if (SELM) return selToggle(b.dataset.id); checkTask(b.dataset.id, b); },
  topen: b => { if (SELM && b.closest('#main')) return selToggle(b.dataset.id); openTask(b.dataset.id); },
  subs: b => { const id = b.dataset.id; OPEN_SUBS.has(id) ? OPEN_SUBS.delete(id) : OPEN_SUBS.add(id); render(true); },
  gtoggle: b => { const k = b.dataset.g; SHUT_GROUPS.has(k) ? SHUT_GROUPS.delete(k) : SHUT_GROUPS.add(k); render(true); },
  tdate: b => { const t = get('t', b.dataset.id); datePicker(b, taskToDp(t), v => { dpToTask(t, v); put('t', t); if (typeof gcalPushTask === 'function') gcalPushTask(t); }, { right: 1 }); },
  tmore: (b, e) => { e.stopPropagation(); taskMenu(get('t', b.dataset.id), b); },
  qa: b => { QA = b.dataset.g; render(true); },
  showdone: () => setViewCfg(R.id, 'showDone', !viewCfg(R.id).showDone),
  vboard: () => { const l = get('l', R.id); l.view = l.view === 'board' ? 'list' : 'board'; if (l.view === 'board' && !(l.sec || []).length) l.sec = [{ id: uid(), name: 'A fazer' }, { id: uid(), name: 'Em andamento' }, { id: uid(), name: 'Feito' }]; put('l', l); },
  vsort: b => {
    const c = viewCfg(R.id), info = scopeInfo(R.id), cur = c.group || info.group;
    menu(b, [
      { head: 'Ordenar por' },
      ...[['date', 'Data'], ['prio', 'Prioridade'], ['title', 'Título'], ['created', 'Criação'], ['manual', 'Personalizada (arrastar)']].map(([k, n]) => ({ label: n, on: c.sort === k, act: () => setViewCfg(R.id, 'sort', k) })),
      { head: 'Agrupar por' },
      ...[info.list ? ['sec', 'Seção'] : null, ['date', 'Data'], ['prio', 'Prioridade'], ['list', 'Lista'], ['none', 'Sem agrupamento']].filter(Boolean).map(([k, n]) => ({ label: n, on: cur === k, act: () => setViewCfg(R.id, 'group', k) })),
    ], { right: 1 });
  },
  vshow: b => displayMenu(b, R.id),
  vmore: b => {
    const info = scopeInfo(R.id), c = viewCfg(R.id);
    menu(b, [
      { label: 'Selecionar várias…', icon: 'todo', act: () => selStart() },
      { label: c.showDone ? 'Ocultar concluídas' : 'Mostrar concluídas', icon: 'done', act: () => setViewCfg(R.id, 'showDone', !c.showDone) },
      { label: 'Detalhes exibidos…', icon: 'eye', act: () => displayMenu(b, R.id) },
      { label: 'Exportar…', icon: 'export', act: () => exportMenu(b, { kind: 'scope', id: R.id }) },
      { label: 'Imprimir / PDF', icon: 'file', act: () => exportScope(R.id, 'pdf') },
      info.list ? { label: 'Editar lista', icon: 'edit', act: () => editList(info.list) } : null,
      info.list ? { label: 'Converter todas em anotações', icon: 'doc', act: () => { const ts = db.t.filter(x => live(x) && x.list === info.list.id && !x.note && !x.done); if (!ts.length) { toast('Nada para converter'); return; } ts.forEach(x => { x.note = true; put('t', x, { silent: true }); }); changed(); toast(plural(ts.length, 'tarefa convertida', 'tarefas convertidas') + ' em anotação', 'Desfazer', () => { ts.forEach(x => { x.note = false; put('t', x, { silent: true }); }); changed(); }); } } : null,
      info.list ? { label: 'Adicionar seção', icon: 'plus', act: () => ACTS.addsec() } : null,
      info.kind === 'tag' ? { label: 'Editar etiqueta', icon: 'edit', act: () => editTag(get('g', R.id.slice(4))) } : null,
    ], { right: 1 });
  },
  addsec: async () => { const l = get('l', R.id); if (!l) return; const n = await ask('Nova seção', '', { ph: 'Ex.: Em andamento' }); if (n) { l.sec = (l.sec || []).concat({ id: uid(), name: n }); put('l', l); } },
  secmenu: (b, e) => {
    e.stopPropagation();
    const l = get('l', R.id); const s = l && (l.sec || []).find(x => x.id === b.dataset.sec); if (!s) return;
    const i = l.sec.indexOf(s);
    menu(b, [
      { label: 'Renomear', icon: 'edit', act: async () => { const n = await ask('Renomear seção', s.name); if (n) { s.name = n; put('l', l); } } },
      i > 0 ? { label: 'Mover para cima/esquerda', icon: 'left', act: () => { l.sec.splice(i, 1); l.sec.splice(i - 1, 0, s); put('l', l); } } : null,
      i < l.sec.length - 1 ? { label: 'Mover para baixo/direita', icon: 'right', act: () => { l.sec.splice(i, 1); l.sec.splice(i + 1, 0, s); put('l', l); } } : null,
      { sep: 1 },
      { label: 'Excluir seção', icon: 'trash', danger: 1, act: async () => { if (await confirmBox('Excluir a seção "' + s.name + '"?', 'As tarefas continuam na lista, sem seção.')) { db.t.filter(t => t.sec === s.id).forEach(t => { t.sec = null; put('t', t, { silent: true }); }); l.sec = l.sec.filter(x => x !== s); put('l', l); } } },
    ]);
  },
  resched: b => datePicker(b, { date: today() }, v => { db.t.filter(overdue).forEach(t => { dpToTask(t, Object.assign({}, taskToDp(t), { date: v.date, time: v.time || taskToDp(t).time })); put('t', t, { silent: true }); }); changed(); toast('Tarefas atrasadas reagendadas'); }, { noStart: 1 }),
  restore: b => { const t = get('t', b.dataset.id); t.del = null; if (!get('l', t.list)) t.list = 'inbox'; put('t', t); db.t.filter(s => s.par === t.id).forEach(s => { s.del = null; put('t', s, { silent: true }); }); changed(); toast('Tarefa restaurada'); },
  purge: b => { const id = b.dataset.id; db.t = db.t.filter(t => t.id !== id && t.par !== id); changed(); },
  drestore: b => { const d = get('d', b.dataset.id); d.del = null; put('d', d); toast('Documento restaurado'); },
  dpurge: b => hardDel('d', b.dataset.id),
  emptytrash: async () => { if (await confirmBox('Esvaziar a lixeira?', 'Os itens serão apagados definitivamente.', 'Esvaziar')) { db.t = db.t.filter(t => !t.del); db.d = db.d.filter(d => !d.del); changed(); } },
  exportdone: b => exportMenu(b, { kind: 'scope', id: 'done' }),
  sf: b => { SQ.f = b.dataset.f; render(true); },
});
/* menu de contexto (botão direito) nas tarefas */
const _ctx = ctxMenu;
ctxMenu = function (spec, anchor, at) { if (spec.startsWith('task:')) { const t = get('t', spec.slice(5)); if (t && !t.del) taskMenu(t, anchor, at); return; } _ctx(spec, anchor, at); };

/* ---------- soltar tarefas ---------- */
DROPS.push((src, dst, before) => {
  if (!src.startsWith('t:')) return;
  const t = get('t', src.slice(2)); if (!t) return;
  const [k, ...rest] = dst.split(':'), v = rest.join(':');
  const keepTime = d => d ? d + (tOnly(t.due) ? 'T' + tOnly(t.due) : '') : null;
  const applySet = set => {
    if ('due' in set) { if (set.due) { t.due = keepTime(set.due); if (t.start && dOnly(t.start) > dOnly(t.due)) t.start = null; } else { t.due = null; t.start = null; } }
    ['list', 'sec', 'prio'].forEach(x => { if (x in set) t[x] = set[x]; });
    if (set.tags) t.tags = [...new Set([...(t.tags || []), ...set.tags])];
  };
  if (k === 'row') {
    const target = get('t', v); if (!target || target.id === t.id) return true;
    const gk = Object.keys(GMAP).find(g => GMAP[g].ids.includes(target.id));
    if (target.par && target.par !== t.id) { t.par = target.par; t.list = target.list; }
    else if (!target.par && t.par) t.par = null;
    if (gk) applySet(GMAP[gk].set);
    const ids = gk ? GMAP[gk].ids.filter(x => x !== t.id) : [];
    const i = ids.indexOf(target.id), nb = before ? get('t', ids[i - 1]) : get('t', ids[i + 1]);
    const a = target.o || 0, b = nb ? (nb.o || 0) : a + (before ? -1 : 1);
    t.o = (a + b) / 2;
    put('t', t);
    if (R.v === 'list' && viewCfg(R.id).sort !== 'manual' && gk) { setViewCfg(R.id, 'sort', 'manual'); toast('Ordenação personalizada ativada'); }
    if (typeof gcalPushTask === 'function') gcalPushTask(t);
    return true;
  }
  if (k === 'grp') { const g = GMAP[v]; if (!g) return true; applySet(g.set); t.par = null; t.o = Date.now(); put('t', t); if (typeof gcalPushTask === 'function') gcalPushTask(t); return true; }
  if (k === 'list') { t.list = v; t.sec = null; t.par = null; put('t', t); toast('Movida para ' + get('l', v).name); return true; }
  if (k === 'smart') { t.due = keepTime(v === 'today' ? today() : addD(today(), 1)); t.start = null; put('t', t); if (typeof gcalPushTask === 'function') gcalPushTask(t); return true; }
  if (k === 'tag') { t.tags = [...new Set([...(t.tags || []), v])]; put('t', t); return true; }
  if (k === 'trash') { deleteTask(t); return true; }
});
/* quadro: a rodinha do mouse rola para os lados quando o ponteiro está fora de uma coluna com rolagem */
document.addEventListener('wheel', e => {
  const bd = e.target.closest && e.target.closest('.board'); if (!bd || e.shiftKey || Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;
  const col = e.target.closest('.cards');
  if (col && col.scrollHeight > col.clientHeight + 2) return;
  if (bd.scrollWidth <= bd.clientWidth) return;
  bd.scrollLeft += e.deltaY; e.preventDefault();
}, { passive: false });

ACTS.nlfocus = () => { const i = $('.nladdin'); if (i) { i.scrollIntoView({ block: 'center' }); i.focus(); } };
/* lista de anotações: linhas simples (estilo TickTick), sem seções e sem concluir */
function renderNoteList(main, info) {
  const l = info.list;
  if ((l.sec || []).length || l.view === 'board') {
    l.sec = []; l.view = 'list'; put('l', l, { silent: true });
    db.t.forEach(t => { if (t.list === l.id && t.sec) { t.sec = null; put('t', t, { silent: true }); } });
  }
  const items = db.t.filter(t => !t.del && t.list === l.id && !t.par).sort((a, b) => (a.o || 0) - (b.o || 0) || (b.c || 0) - (a.c || 0));
  GMAP = { notes: { set: { list: l.id }, ids: items.map(t => t.id) } };
  const tagH = t => (t.tags || []).map(g => { const x = get('g', g); return x ? `<span class="nltag" style="--c:${esc(x.color || '#808080')}">${x.emoji ? esc(x.emoji) + ' ' : ''}${esc(x.name)}</span>` : ''; }).join('');
  const rows = items.map(t => `<div class="nlrow${R.sel === t.id ? ' sel' : ''}${t.done ? ' done' : ''}" data-act="topen" data-id="${t.id}" data-drag="t:${t.id}" data-drop="row:${t.id}" data-ctx="task:${t.id}" tabindex="0">
      <span class="nlic">${ic('doc', 17)}</span>
      <span class="nlt">${linkifyText(t.title, { short: 1 }) || '<span class="mut">Sem título</span>'}</span>
      <span class="nlr">${tagH(t)}${(t.att || []).length ? `<span class="nlmi" title="${plural(t.att.length, 'anexo', 'anexos')}">${ic('clip', 14)}</span>` : ''}${t.due ? `<span class="nlmi" title="Lembrete: ${esc(fmtWhen(t.due))}">${ic('bell', 14)}</span>` : ''}</span>
    </div>`).join('');
  const right = `<button class="ib" data-act="vmore" aria-label="Mais opções">${ic('more')}</button>`;
  const pre = l.emoji ? `<span class="nemo big">${esc(l.emoji)}</span>` : `<span class="ldot big" style="background:${esc(l.color || '#808080')}"></span>`;
  main.innerHTML = headHtml(l.name, '', right, { pre }) + `<div class="scroll"><div class="nlist">
    <form class="nladd" data-keep>${ic('plus', 17)}<input class="nladdin" placeholder="Adicionar anotação" aria-label="Adicionar anotação" autocomplete="off" enterkeyhint="done"></form>
    <div class="nlrows">${rows || `<div class="empty"><p>${ic('doc', 28)}</p><p>Nenhuma anotação ainda. Escreva um título acima e aperte Enter.</p></div>`}</div>
  </div></div><button class="fab" data-act="nlfocus" aria-label="Nova anotação">${ic('plus', 26)}</button>`;
  const f = main.querySelector('.nladd'), inp = f.querySelector('input');
  f.onsubmit = e => {
    e.preventDefault(); const v = inp.value.trim(); if (!v) return;
    const t = taskFromSmart(v, { list: l.id }); t.note = true; t.o = Math.min(0, ...items.map(x => x.o || 0)) - 1; put('t', t);
    inp.value = ''; openTask(t.id);
  };
}

/* ---------- seleção em lote (excluir, concluir, mover várias de uma vez) ---------- */
let SELM = null;
function selVisibleIds() { const ids = []; $$('#main [data-drag^="t:"]').forEach(e => { const id = e.dataset.drag.slice(2); if (!ids.includes(id)) ids.push(id); }); return ids; }
function selStart(first) { SELM = { ids: new Set(first ? [first] : []), scope: R.v + ':' + R.id }; if (R.sel) closeTask(); render(true); selBar(); }
function selEnd() { SELM = null; const bar = $('#selbar'); if (bar) bar.remove(); document.body.classList.remove('selmode'); render(true); }
function selToggle(id) { if (!SELM) return; SELM.ids.has(id) ? SELM.ids.delete(id) : SELM.ids.add(id); selPaint(); }
function selPaint() {
  if (!SELM) return;
  $$('#main [data-drag^="t:"]').forEach(e => e.classList.toggle('picked', SELM.ids.has(e.dataset.drag.slice(2))));
  selBar();
}
function selBar() {
  if (!SELM) return;
  document.body.classList.add('selmode');
  let bar = $('#selbar');
  if (!bar) { bar = document.createElement('div'); bar.id = 'selbar'; bar.setAttribute('role', 'toolbar'); bar.setAttribute('aria-label', 'Ações em lote'); document.body.appendChild(bar); }
  const n = SELM.ids.size, all = selVisibleIds(), allOn = all.length && all.every(id => SELM.ids.has(id));
  const sel = [...SELM.ids].map(id => get('t', id)).filter(Boolean), anyTask = sel.some(t => !t.note);
  bar.innerHTML = `<button class="ib" data-sb="x" aria-label="Cancelar seleção" title="Cancelar">${ic('x', 19)}</button>
    <b class="sbn">${n ? plural(n, 'selecionada', 'selecionadas') : 'Toque nos itens'}</b>
    <button class="btn ghost sm" data-sb="all">${allOn ? '<span class="hide-m">Desmarcar </span>Nenhuma' : '<span class="hide-m">Selecionar </span>Todas'}</button>
    <span class="sp"></span>
    ${anyTask ? `<button class="ib" data-sb="done" ${n ? '' : 'disabled'} title="Concluir" aria-label="Concluir selecionadas">${ic('check', 19)}</button>` : ''}
    <button class="btn ghost sm" data-sb="move" ${n ? '' : 'disabled'} title="Mover para outra lista" aria-label="Mover selecionadas para outra lista">${ic('folder', 16)}<span class="hide-m">Mover</span></button>
    <button class="btn red sm" data-sb="del" ${n ? '' : 'disabled'}>${ic('trash', 16)}<span class="hide-m">Excluir</span></button>`;
  bar.onclick = async e => {
    const b = e.target.closest('[data-sb]'); if (!b) return;
    const k = b.dataset.sb, list = [...SELM.ids].map(id => get('t', id)).filter(Boolean);
    if (k === 'x') return selEnd();
    if (k === 'all') { if (allOn) SELM.ids.clear(); else all.forEach(id => SELM.ids.add(id)); return selPaint(); }
    if (!list.length) return;
    if (k === 'del') {
      if (list.length > 1 && !(await confirmBox(`Mover ${plural(list.length, 'item', 'itens')} para a Lixeira?`))) return;
      const stamp = Date.now(), prev = list.map(t => [t, t.del]);
      list.forEach(t => { t.del = stamp; put('t', t, { silent: true }); subsOf(t.id).forEach(x => { if (!x.del) { x.del = stamp; put('t', x, { silent: true }); } }); if (typeof gcalDeleteTask === 'function' && t.gc) gcalDeleteTask(t); });
      selEnd(); changed();
      toast(`${plural(list.length, 'item movido', 'itens movidos')} para a Lixeira`, 'Desfazer', () => { prev.forEach(([t, d]) => { t.del = d || null; put('t', t, { silent: true }); }); db.t.filter(x => x.del === stamp).forEach(x => { x.del = null; put('t', x, { silent: true }); }); changed(); }, 6000);
    }
    if (k === 'done') {
      const ts = list.filter(t => !t.note && !t.done); ts.forEach(t => completeTask(t, true)); selEnd(); changed();
      toast(plural(ts.length, 'tarefa concluída', 'tarefas concluídas'));
    }
    if (k === 'move') pickMoveTarget(list, (l, sec) => {
      const all = [...new Set(list.flatMap(t => [t, ...subsOf(t.id)]))], prev = all.map(t => [t, t.list, t.sec, t.note]);
      all.forEach(t => { t.list = l.id; t.sec = list.includes(t) ? (sec || null) : t.sec && (l.sec || []).some(x => x.id === t.sec) ? t.sec : null; t.note = l.kind === 'notes'; put('t', t, { silent: true }); });
      selEnd(); changed();
      const ss = sec && (l.sec || []).find(x => x.id === sec);
      toast(`${plural(list.length, 'item movido', 'itens movidos')} para ${l.name}${ss ? ' · ' + ss.name : ''}`, 'Desfazer', () => { prev.forEach(([t, li, se, no]) => { t.list = li; t.sec = se; t.note = no; put('t', t, { silent: true }); }); changed(); }, 6000);
    });
  };
}
/* sair da seleção ao trocar de tela; repintar após cada renderização */
addEventListener('hashchange', () => { if (SELM) { SELM = null; const bar = $('#selbar'); if (bar) bar.remove(); document.body.classList.remove('selmode'); } });
document.addEventListener('keydown', e => { if (e.key === 'Escape' && SELM) selEnd(); });
new MutationObserver(() => { if (SELM) { const m = $('#main'); if (m && !m.querySelector('.selhint')) selPaint(); } }).observe(document.getElementById('main') || document.body, { childList: true });

/* escolher lista (e seção) de destino para mover itens em lote */
function pickMoveTarget(items, done) {
  const cur = new Set(items.map(t => t.list));
  const lists = db.l.filter(l => !l.arch);
  const folderName = id => { const f = db.f.find(x => x.id === id); return f ? `${f.emoji ? f.emoji + ' ' : ''}${f.name}` : ''; };
  const groups = [['', lists.filter(l => l.id === 'inbox' || !l.folder)], ...db.f.filter(f => (f.kind || 'l') === 'l').map(f => [f.id, lists.filter(l => l.folder === f.id && l.id !== 'inbox')])].filter(([, ls]) => ls.length);
  const row = l => `<button class="mvrow${cur.has(l.id) && cur.size === 1 ? ' cur' : ''}" data-mv="${l.id}">${l.id === 'inbox' ? `<span class="mvic">${ic('inbox', 16)}</span>` : l.emoji ? `<span class="mvic nemo">${esc(l.emoji)}</span>` : `<span class="mvic"><span class="ldot" style="background:${esc(l.color || '#808080')}"></span></span>`}<span class="f1">${esc(l.name)}${l.kind === 'notes' ? ' <small class="mut">· notas</small>' : ''}</span>${(l.sec || []).length ? `<small class="mut">${plural(l.sec.length, 'seção', 'seções')} ${ic('right', 12)}</small>` : ''}${cur.has(l.id) && cur.size === 1 ? `<small class="mut">atual</small>` : ''}</button>`;
  const el = modal(`<div class="mvpick"><h2>Mover ${plural(items.length, 'item', 'itens')} para…</h2>
    <input class="in" id="mvq" placeholder="Buscar lista" autocomplete="off">
    <div class="mvlist">${groups.map(([fid, ls]) => `<div class="mvgrp" data-g>${fid ? `<p class="mvgh">${esc(folderName(fid))}</p>` : ''}${ls.map(row).join('')}</div>`).join('')}</div>
    <div class="row end"><button class="btn ghost" data-x>Cancelar</button></div></div>`, { cls: 'mvmodal' });
  el.querySelector('[data-x]').onclick = () => closeModal();
  const q = el.querySelector('#mvq');
  if (isMobile()) setTimeout(() => q.blur(), 30);
  q.oninput = () => { const v = q.value.trim().toLowerCase(); el.querySelectorAll('.mvrow').forEach(r => r.hidden = v && !r.textContent.toLowerCase().includes(v)); el.querySelectorAll('[data-g]').forEach(g => g.hidden = ![...g.querySelectorAll('.mvrow')].some(r => !r.hidden)); };
  q.onkeydown = e => { if (e.key === 'Enter') { const r = [...el.querySelectorAll('.mvrow')].find(x => !x.hidden); if (r) r.click(); } };
  el.querySelectorAll('[data-mv]').forEach(b => b.onclick = () => {
    const l = get('l', b.dataset.mv); if (!l) return;
    if (!(l.sec || []).length) { closeModal(); done(l, null); return; }
    el.querySelector('.mvpick').innerHTML = `<h2><button class="ib" data-back aria-label="Voltar">${ic('left', 18)}</button>${esc(l.name)}: qual seção?</h2><div class="mvlist">${[{ id: '', name: 'Sem seção' }, ...l.sec].map(x => `<button class="mvrow" data-sec="${esc(x.id)}"><span class="f1">${esc(x.name)}</span></button>`).join('')}</div><div class="row end"><button class="btn ghost" data-x2>Cancelar</button></div>`;
    el.querySelector('[data-x2]').onclick = () => closeModal();
    el.querySelector('[data-back]').onclick = () => { closeModal(true); pickMoveTarget(items, done); };
    el.querySelectorAll('[data-sec]').forEach(x => x.onclick = () => { closeModal(); done(l, x.dataset.sec || null); });
  });
}

/* tarefas repetidas: mesmo título, abertas; mantém a que está numa lista de verdade (ou a mais recente) */
const dupNorm = s => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\s+/g, ' ').trim();
function dupGroups() {
  const by = new Map();
  db.t.forEach(t => { if (t.del || t.done || t.par || t.note || !dupNorm(t.title)) return; const k = dupNorm(t.title); if (!by.has(k)) by.set(k, []); by.get(k).push(t); });
  const out = [];
  by.forEach(ts => {
    if (ts.length < 2 || !ts.some(t => t.list === 'inbox')) return;
    const score = t => (t.list !== 'inbox' ? 1e15 : 0) + ((t.att || []).length + (t.cover ? 1 : 0) + subsOf(t.id).length) * 1e13 + (t.u || t.c || 0);
    const sorted = ts.slice().sort((a, b) => score(b) - score(a)), keep = sorted[0];
    const drop = sorted.slice(1).filter(t => t.list === 'inbox');
    if (drop.length) out.push({ keep, drop });
  });
  return out;
}
function dupMerge(keep, d) {
  /* traz para a tarefa mantida o que só existe na cópia */
  if (d.notes && stripHtml(d.notes).trim() && !stripHtml(keep.notes || '').includes(stripHtml(d.notes).trim())) keep.notes = (keep.notes ? keep.notes + '<br>' : '') + d.notes;
  (d.att || []).forEach(a => { keep.att = keep.att || []; if (!keep.att.some(x => x.id === a.id)) keep.att.push(a); });
  (d.tags || []).forEach(g => { keep.tags = keep.tags || []; if (!keep.tags.includes(g)) keep.tags.push(g); });
  if (!keep.due && d.due) { keep.due = d.due; keep.start = keep.start || d.start; }
  if ((d.prio || 0) > (keep.prio || 0)) keep.prio = d.prio;
  const ks = subsOf(keep.id).map(x => dupNorm(x.title));
  subsOf(d.id).forEach(x => { if (!ks.includes(dupNorm(x.title))) { x.par = keep.id; x.list = keep.list; put('t', x, { silent: true, noCascade: true }); } });
}
ACTS.dupfix = () => {
  const gs = dupGroups(); if (!gs.length) return;
  const ln = id => (get('l', id) || {}).name || 'Caixa de entrada';
  const el = modal(`<div class="dupm"><h2>Tarefas repetidas</h2><p class="mut sm">Estas tarefas estão na Caixa de entrada e também ${gs.some(g => g.keep.list !== 'inbox') ? 'em outra lista' : 'repetidas'}. Vou manter a da lista e mandar a cópia para a Lixeira — anexos, notas, etiquetas e subtarefas que só existirem na cópia passam para a tarefa mantida.</p>
    <div class="duplist">${gs.map((g, i) => `<label class="duprow"><input type="checkbox" data-dup="${i}" checked><span class="f1"><b>${esc(g.keep.title)}</b><small class="mut">fica em <b>${esc(ln(g.keep.list))}</b> · ${plural(g.drop.length, 'cópia', 'cópias')} na Caixa de entrada sai${g.drop.length > 1 ? 'em' : ''}</small></span></label>`).join('')}</div>
    <div class="row end"><button class="btn ghost" data-x>Cancelar</button><button class="btn red" data-go>Remover cópias</button></div></div>`);
  el.querySelector('[data-x]').onclick = () => closeModal();
  el.querySelector('[data-go]').onclick = () => {
    const stamp = Date.now(), done = [];
    el.querySelectorAll('[data-dup]:checked').forEach(c => { const g = gs[+c.dataset.dup]; const before = clone(g.keep); g.drop.forEach(d => { dupMerge(g.keep, d); d.del = stamp; put('t', d, { silent: true, noCascade: true }); done.push(d); }); put('t', g.keep, { silent: true }); done.push(['keep', g.keep, before]); });
    closeModal(); changed();
    const n = done.filter(x => !Array.isArray(x)).length;
    toast(`${plural(n, 'cópia removida', 'cópias removidas')}`, 'Desfazer', () => { done.forEach(x => { if (Array.isArray(x)) { Object.assign(x[1], x[2]); put('t', x[1], { silent: true, noCascade: true }); } else { x.del = null; put('t', x, { silent: true, noCascade: true }); } }); changed(); }, 8000);
  };
};
