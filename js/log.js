/* Histórico: registra criações, alterações, conclusões, exclusões e restaurações, com desfazer e restaurar. */
'use strict';
const SNAP = new Map();
const LOG_SKIP = new Set(['u', 'o', 'gc', 'gcDirty', 'gcOn', 'sd', 'c']);
const KN = { t: 'tarefa', l: 'lista', f: 'pasta', g: 'etiqueta', d: 'documento', h: 'hábito', n: 'nota' };
const FN = { title: 'título', name: 'nome', notes: 'descrição', due: 'prazo', start: 'início', prio: 'prioridade', list: 'lista', sec: 'seção', tags: 'etiquetas', chk: 'itens', rep: 'repetição', rem: 'lembrete', att: 'anexos', cover: 'capa', ln: 'vínculos', par: 'posição', b: 'conteúdo', style: 'estilo', icon: 'ícone', emoji: 'ícone', color: 'cor', folder: 'pasta', view: 'visualização', arch: 'arquivamento', fav: 'favorito', log: 'marcações', goal: 'meta', freq: 'frequência', open: 'aberta/fechada', kind: 'tipo', del: 'lixeira', done: 'conclusão', hist: 'ocorrências', body: 'texto', img: 'imagens', aud: 'áudios', pin: 'fixação', bg: 'fundo', bgImg: 'foto de fundo', items: 'itens', font: 'letra', big: 'tamanho' };
function deviceName() { const u = navigator.userAgent; return /iPhone/.test(u) ? 'iPhone' : /iPad/.test(u) ? 'iPad' : /Android/.test(u) ? 'Android' : /Mac/.test(u) ? 'Mac' : /Windows/.test(u) ? 'Windows' : 'Computador'; }
function initSnap() { SNAP.clear(); KINDS.forEach(k => { if (k === 'a' || k === 'p') return; db[k].forEach(x => SNAP.set(k + ':' + x.id, JSON.stringify(x))); }); }
function snapSet(k, x) { if (k === 'a' || k === 'p' || k === 's') return; if (x) SNAP.set(k + ':' + x.id, JSON.stringify(x)); }
function snapDel(k, id) { SNAP.delete(k + ':' + id); }
const titleOf = (k, o) => (o && (o.title || o.name)) || (k === 'd' ? 'Sem título' : '');
function logChange(k, cur, gone) {
  if (!KN[k]) return;
  const o = cur || gone, key = k + ':' + o.id;
  const prevJ = SNAP.get(key), prev = prevJ ? JSON.parse(prevJ) : null;
  if (cur) SNAP.set(key, JSON.stringify(cur)); else SNAP.delete(key);
  let op, ch = [], old = null, snap = null;
  if (!cur) { op = 'del'; snap = prev || gone; }
  else if (!prev) { if (cur.sd) return; op = 'add'; }
  else {
    const keys = new Set([...Object.keys(prev), ...Object.keys(cur)]);
    keys.forEach(f => { if (!LOG_SKIP.has(f) && JSON.stringify(prev[f] ?? null) !== JSON.stringify(cur[f] ?? null)) ch.push(f); });
    if (!ch.length) return;
    if (k === 't' && ch.includes('del')) op = cur.del ? 'trash' : 'restore';
    else if (k === 'd' && ch.includes('del')) op = cur.del ? 'trash' : 'restore';
    else if (k === 't' && ch.includes('done')) op = cur.done ? 'done' : 'undone';
    else if (k === 't' && ch.includes('hist') && (cur.hist || []).length > (prev.hist || []).length) op = 'done';
    else if (k === 'h' && ch.length === 1 && ch[0] === 'log') op = 'habit';
    else op = 'edit';
    if (op === 'trash') snap = prev;
    old = {}; ch.forEach(f => old[f] = prev[f] ?? null);
    if (JSON.stringify(old).length > 80000) old = null;
  }
  const now = Date.now(), title = titleOf(k, cur || prev || gone);
  /* junta edições seguidas do mesmo item (até 3 minutos) num registro só */
  if (op === 'edit' || op === 'habit') {
    const last = logChange.last && get('a', logChange.last);
    if (last && last.ref === o.id && last.op === op && now - last.at < 180000) {
      last.ch = [...new Set([...(last.ch || []), ...ch])];
      if (last.old && old) Object.keys(old).forEach(f => { if (!(f in last.old)) last.old[f] = old[f]; });
      if (JSON.stringify(last.old || {}).length > 80000) last.old = null;
      last.at = now; last.title = title;
      put('a', last, { nolog: true, silent: true });
      return;
    }
  }
  const e = { id: uid(), at: now, op, k, ref: o.id, title, ch, who: deviceName() };
  if (old) e.old = old;
  if (snap) e.snap = snap;
  if (k === 't' && (cur || prev)) e.list = (cur || prev).list;
  put('a', e, { nolog: true, silent: true });
  logChange.last = e.id;
}
function pruneLog() {
  const lim = Date.now() - 180 * 864e5;
  const keep = db.a.filter(e => e.at >= lim).sort((a, b) => b.at - a.at).slice(0, 3000);
  if (keep.length !== db.a.length) { db.a = keep; IX = null; saveLocal(); }
}
const OPS = { add: ['criou', 'plus', '#2E9E6B'], edit: ['alterou', 'edit', '#3B7DD8'], del: ['excluiu', 'trash', '#DB4035'], trash: ['moveu para a lixeira', 'trash', '#E8803A'], restore: ['restaurou', 'undo', '#2E9E6B'], done: ['concluiu', 'check', '#2E9E6B'], undone: ['reabriu', 'undo', '#E8803A'], habit: ['marcou', 'habit', '#9150C8'] };
let LQ = { f: 'all', q: '' };
VIEWS.log = main => {
  const q = norm(LQ.q);
  const all = db.a.slice().sort((a, b) => b.at - a.at);
  const flt = all.filter(e => (LQ.f === 'all' || (LQ.f === 'del' ? ['del', 'trash'].includes(e.op) : LQ.f === 'lf' ? ['l', 'f', 'g'].includes(e.k) : e.k === LQ.f)) && (!q || norm(e.title + ' ' + (KN[e.k] || '')).includes(q))).slice(0, 400);
  const by = new Map();
  flt.forEach(e => { const d = ymd(new Date(e.at)); if (!by.has(d)) by.set(d, []); by.get(d).push(e); });
  let h = '';
  by.forEach((arr, d) => {
    h += `<section class="grp"><div class="gh"><b>${esc(fmtDay(d, true))}</b><span class="cnt">${arr.length}</span></div>${arr.map(e => {
      const [verb, icon, col] = OPS[e.op] || ['alterou', 'edit', '#888'];
      const exists = get(e.k, e.ref);
      const fields = e.op === 'edit' && e.ch && e.ch.length ? e.ch.map(f => FN[f] || f).join(', ') : '';
      const canRestore = (e.op === 'del' && !exists && e.snap) || (e.op === 'trash' && exists && exists.del);
      const canUndo = e.op === 'edit' && e.old && exists;
      return `<div class="logrow"><span class="logic" style="--lc:${col}">${ic(icon, 16)}</span><div class="logtx"><div><b>${esc(cap(verb))}</b> ${KN[e.k] || ''} <span class="logt">${esc(e.title || '')}</span></div><div class="mut sm">${hm(new Date(e.at))} · ${esc(e.who || '')}${fields ? ' · ' + esc(fields) : ''}</div></div>
        <div class="logact">${exists && !exists.del && (e.k === 't' || e.k === 'd') ? `<button class="btn ghost sm" data-act="logopen" data-id="${e.id}">Abrir</button>` : ''}${canRestore ? `<button class="btn ghost sm" data-act="logrestore" data-id="${e.id}">Restaurar</button>` : ''}${canUndo ? `<button class="btn ghost sm" data-act="logundo" data-id="${e.id}">Desfazer</button>` : ''}</div></div>`;
    }).join('')}</section>`;
  });
  main.innerHTML = headHtml('Histórico', 'Tudo o que foi criado, alterado ou excluído nos últimos 180 dias', `<button class="ib" data-act="logexport" aria-label="Exportar histórico">${ic('export')}</button><button class="ib" data-act="logclear" aria-label="Limpar histórico">${ic('trash')}</button>`) +
    `<div class="scroll"><div class="tlist"><div class="sbox" data-keep>${ic('search', 20)}<input id="lq" class="in" type="search" placeholder="Buscar no histórico" value="${esc(LQ.q)}"></div>
    <div class="chips">${[['all', 'Tudo'], ['t', 'Tarefas'], ['d', 'Documentos'], ['lf', 'Listas e pastas'], ['h', 'Hábitos'], ['del', 'Exclusões']].map(([k, n]) => `<button class="chip${LQ.f === k ? ' on' : ''}" data-act="logf" data-f="${k}">${n}</button>`).join('')}</div>
    ${h || `<div class="empty"><div class="eic">${ic('clock', 44)}</div><p class="mut">Nenhum registro ainda. As próximas alterações vão aparecer aqui.</p></div>`}</div></div>`;
  const i = $('#lq'); i.oninput = debounce(() => { LQ.q = i.value; render(true); setTimeout(() => { const x = $('#lq'); if (x) { x.focus(); x.setSelectionRange(x.value.length, x.value.length); } }, 0); }, 300);
};
Object.assign(ACTS, {
  logf: b => { LQ.f = b.dataset.f; render(true); },
  logopen: b => { const e = get('a', b.dataset.id); if (e.k === 't') openTask(e.ref); else if (e.k === 'd') go('doc/' + e.ref); },
  logrestore: b => {
    const e = get('a', b.dataset.id); if (!e) return;
    if (e.op === 'del' && e.snap) { const o = clone(e.snap); if (e.k === 't' && !get('l', o.list)) o.list = 'inbox'; put(e.k, o); toast(cap(KN[e.k]) + ' restaurada(o)'); }
    else if (e.op === 'trash') { const o = get(e.k, e.ref); o.del = null; if (e.k === 't' && !get('l', o.list)) o.list = 'inbox'; put(e.k, o); toast('Restaurado da lixeira'); }
  },
  logundo: async b => {
    const e = get('a', b.dataset.id), o = e && get(e.k, e.ref); if (!o || !e.old) return;
    if (!await confirmBox('Desfazer esta alteração?', 'Volta ' + e.ch.map(f => FN[f] || f).join(', ') + ' para como estava antes.', 'Desfazer')) return;
    Object.keys(e.old).forEach(f => { if (e.old[f] === null) delete o[f]; else o[f] = e.old[f]; });
    put(e.k, o); if (e.k === 't') gcalPushTask(o); toast('Alteração desfeita');
  },
  logexport: () => download('historico.csv', '﻿' + toCsv([['Data', 'Hora', 'Ação', 'Tipo', 'Item', 'Campos', 'Aparelho'], ...db.a.slice().sort((a, b) => b.at - a.at).map(e => [new Date(e.at).toLocaleDateString('pt-BR'), hm(new Date(e.at)), (OPS[e.op] || [''])[0], KN[e.k] || '', e.title || '', (e.ch || []).map(f => FN[f] || f).join(', '), e.who || ''])]), 'text/csv'),
  logclear: async () => { if (await confirmBox('Limpar todo o histórico?', 'Os registros serão apagados em todos os aparelhos. Tarefas e documentos não são afetados.', 'Limpar')) { db.a.slice().forEach(e => hardDel('a', e.id, { nolog: true })); toast('Histórico limpo'); } },
});
