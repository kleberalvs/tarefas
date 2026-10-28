/* Perfil e conquistas: medalhas por metas de tarefas, foco, hábitos, sequências e documentos. */
'use strict';
const TIERS = [
  { n: 'Bronze', a: '#E3A06B', b: '#9C5A2B' }, { n: 'Prata', a: '#E9EDF1', b: '#8E99A4' }, { n: 'Ouro', a: '#FFE08A', b: '#C8901B' },
  { n: 'Platina', a: '#D7F1F1', b: '#5FA3A8' }, { n: 'Esmeralda', a: '#A7F0C4', b: '#1E8A55' }, { n: 'Safira', a: '#B9D3FF', b: '#2D5BC4' },
  { n: 'Rubi', a: '#FFB3BE', b: '#B8203C' }, { n: 'Ametista', a: '#E3C6FF', b: '#7B3FC0' }, { n: 'Diamante', a: '#FFFFFF', b: '#6FB7E8' }, { n: 'Lendária', a: '#FFD7A1', b: '#E0532E' },
];
function achStats() {
  const ev = doneEvents(), days = new Set(ev.map(e => ymd(new Date(e.at))));
  let streak = 0, best = 0, run = 0;
  const sorted = [...days].sort();
  sorted.forEach((d, i) => { run = i && diffD(sorted[i - 1], d) === 1 ? run + 1 : 1; best = Math.max(best, run); });
  let d = days.has(today()) ? today() : addD(today(), -1);
  while (days.has(d)) { streak++; d = addD(d, -1); }
  const perDay = {}; ev.forEach(e => { const k = ymd(new Date(e.at)); perDay[k] = (perDay[k] || 0) + 1; });
  const focus = db.p.filter(p => p.type === 'focus' || p.type === 'watch');
  return {
    done: ev.length,
    high: ev.filter(e => (e.t.prio || 0) === 3).length,
    early: ev.filter(e => new Date(e.at).getHours() < 9).length,
    bestDay: Math.max(0, ...Object.values(perDay)),
    streak, best,
    focus: focus.length,
    focusH: Math.floor(db.p.reduce((s, p) => s + (p.dur || 0), 0) / 60),
    habits: db.h.reduce((s, h) => s + Object.keys(h.log || {}).filter(k => hDone(h, k)).length, 0),
    habitBest: Math.max(0, ...db.h.map(h => hBest(h))),
    docs: db.d.filter(x => !x.del).length,
    lists: db.l.filter(l => l.id !== 'inbox').length,
  };
}
const ACH = [
  { k: 'done', n: 'Tarefas concluídas', e: '✅', u: ['tarefa concluída', 'tarefas concluídas'], lv: [1, 10, 25, 50, 100, 200, 500, 1000, 2000, 5000] },
  { k: 'streak', best: 'best', n: 'Dias seguidos', e: '🔥', u: ['dia seguido concluindo tarefas', 'dias seguidos concluindo tarefas'], lv: [3, 7, 14, 30, 60, 100, 180, 365] },
  { k: 'high', n: 'Prioridade alta', e: '🚩', u: ['tarefa de prioridade alta', 'tarefas de prioridade alta'], lv: [5, 25, 50, 100, 250, 500] },
  { k: 'bestDay', n: 'Dia produtivo', e: '⚡', u: ['tarefa num único dia', 'tarefas num único dia'], lv: [5, 10, 15, 20, 30] },
  { k: 'early', n: 'Madrugador', e: '🌅', u: ['tarefa concluída antes das 9h', 'tarefas concluídas antes das 9h'], lv: [5, 25, 100, 250] },
  { k: 'focus', n: 'Sessões de foco', e: '⏱️', u: ['sessão de foco', 'sessões de foco'], lv: [1, 10, 25, 50, 100, 250, 500, 1000] },
  { k: 'focusH', n: 'Horas de foco', e: '🧠', u: ['hora de foco', 'horas de foco'], lv: [1, 10, 25, 50, 100, 250, 500] },
  { k: 'habits', n: 'Hábitos cumpridos', e: '🌱', u: ['hábito cumprido', 'hábitos cumpridos'], lv: [10, 50, 100, 250, 500, 1000] },
  { k: 'habitBest', n: 'Sequência de hábito', e: '💪', u: ['dia seguido num hábito', 'dias seguidos num hábito'], lv: [7, 21, 30, 66, 100, 365] },
  { k: 'docs', n: 'Documentos', e: '📝', u: ['documento criado', 'documentos criados'], lv: [1, 10, 25, 50, 100] },
  { k: 'lists', n: 'Organizador', e: '🗂️', u: ['lista criada', 'listas criadas'], lv: [3, 10, 25] },
];
const achId = (a, i) => a.k + ':' + a.lv[i];
const achVal = (a, st) => a.best ? Math.max(st[a.k], st[a.best]) : st[a.k];
function medalSvg(tier, emoji, locked, size = 64) {
  const t = TIERS[Math.min(tier, TIERS.length - 1)], id = 'm' + Math.random().toString(36).slice(2, 7);
  const a = locked ? '#D6D6D6' : t.a, b = locked ? '#9E9E9E' : t.b;
  return `<svg class="medal${locked ? ' lock' : ''}" width="${size}" height="${size}" viewBox="0 0 64 64" aria-hidden="true"><defs><linearGradient id="${id}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient></defs>
    <path d="M22 4h8l-6 16h-8zM34 4h8l6 16h-8z" fill="${locked ? '#C9C9C9' : 'var(--red)'}" opacity=".85"/>
    <circle cx="32" cy="38" r="22" fill="url(#${id})"/><circle cx="32" cy="38" r="17.5" fill="none" stroke="rgba(255,255,255,.55)" stroke-width="1.5"/>
    <text x="32" y="45" text-anchor="middle" font-size="19" ${locked ? 'opacity=".35"' : ''}>${emoji}</text></svg>`;
}
const fmtNum = n => n >= 1000 ? (n / 1000).toString().replace('.', ',') + ' mil' : String(n);
function achList() {
  const st = achStats(), got = db.s.ach || {}, out = [];
  ACH.forEach(a => {
    const v = achVal(a, st);
    a.lv.forEach((goal, i) => out.push({ a, i, goal, v, id: achId(a, i), ok: v >= goal, at: got[achId(a, i)] }));
  });
  return { st, list: out };
}
/* verifica novas conquistas depois de cada alteração */
let ACH_BUSY = false;
const checkAch = debounce(() => {
  if (ACH_BUSY || !db || !db.s) return;
  const { list } = achList(), got = Object.assign({}, db.s.ach || {}), first = !db.s.ach;
  const fresh = list.filter(x => x.ok && !got[x.id]);
  if (!fresh.length) { if (first) { db.s.ach = got; put('s', db.s); } return; }
  ACH_BUSY = true;
  fresh.forEach(x => got[x.id] = Date.now());
  db.s.ach = got; put('s', db.s);
  ACH_BUSY = false;
  if (!first) celebrate(fresh[fresh.length - 1], fresh.length);
}, 900);
function celebrate(x, n) {
  const t = TIERS[Math.min(x.i, TIERS.length - 1)];
  const el = document.createElement('div'); el.className = 'achpop';
  el.innerHTML = `<div class="achcard">${medalSvg(x.i, x.a.e, false, 92)}<div class="achtx"><span class="mut sm">Nova conquista${n > 1 ? ` (+${n - 1})` : ''} · ${t.n}</span><b>${esc(x.a.n)}</b><span>${fmtNum(x.goal)} ${esc(x.goal === 1 ? x.a.u[0] : x.a.u[1])}</span></div><button class="btn ghost sm" data-see>Ver</button></div>`;
  for (let i = 0; i < 26; i++) { const c = document.createElement('i'); c.className = 'conf'; c.style.cssText = `--x:${(Math.random() * 2 - 1) * 180}px;--y:${-60 - Math.random() * 160}px;--r:${Math.random() * 720}deg;--d:${.7 + Math.random() * .6}s;background:${['var(--red)', '#FFC83D', '#3B7DD8', '#2E9E6B', '#9150C8'][i % 5]}`; el.appendChild(c); }
  document.body.appendChild(el);
  el.querySelector('[data-see]').onclick = () => { el.remove(); go('me'); };
  if (db.s.pomo.sound) try { playAlarm('chime'); } catch (e) {}
  setTimeout(() => el.classList.add('out'), 5200); setTimeout(() => el.remove(), 5800);
}
let ACH_F = 'all';
VIEWS.me = main => {
  const { st, list } = achList(), got = db.s.ach || {};
  const unlocked = list.filter(x => x.ok).length;
  const level = Math.floor(Math.sqrt(st.done * 10 + st.focus * 5 + st.habits * 3) / 3) + 1;
  const nm = (db.s.name || '').trim() || (WHO ? WHO.split('@')[0] : 'Você');
  const recent = list.filter(x => x.ok).sort((a, b) => (got[b.id] || 0) - (got[a.id] || 0)).slice(0, 6);
  const cats = ACH.map(a => {
    const items = list.filter(x => x.a === a), done = items.filter(x => x.ok).length, next = items.find(x => !x.ok);
    if (ACH_F === 'got' && !done) return '';
    return `<section class="achsec"><header><span class="achemo">${a.e}</span><div class="f1"><b>${esc(a.n)}</b><span class="mut sm">${next ? `Próxima: ${fmtNum(next.goal)} ${esc(next.goal === 1 ? a.u[0] : a.u[1])}` : 'Todas desbloqueadas!'}</span></div><span class="achcnt">${done}/${items.length}</span></header>
      ${next ? `<div class="achprog"><i style="width:${Math.min(100, Math.round(next.v / next.goal * 100))}%"></i></div><p class="mut sm achp">${fmtNum(next.v)} de ${fmtNum(next.goal)}</p>` : ''}
      <div class="medals">${items.filter(x => ACH_F !== 'got' || x.ok).map(x => `<div class="mdl${x.ok ? '' : ' off'}" title="${esc(x.a.n)} · ${fmtNum(x.goal)}${x.ok && got[x.id] ? ' · conquistada em ' + new Date(got[x.id]).toLocaleDateString('pt-BR') : ''}">${medalSvg(x.i, a.e, !x.ok, 58)}<b>${fmtNum(x.goal)}</b><span>${x.ok ? TIERS[Math.min(x.i, TIERS.length - 1)].n : 'Bloqueada'}</span></div>`).join('')}</div></section>`;
  }).join('');
  main.innerHTML = headHtml('Perfil', '', `<button class="btn ghost sm" data-act="profile">${ic('edit', 15)}Editar perfil</button>`) + `<div class="scroll"><div class="me">
    <section class="mehero">${avatarHtml('xl')}<div class="f1"><h2>${esc(nm)}</h2><p class="mut">${WHO ? esc(WHO) : 'Modo local'}</p>
      <div class="lvl"><span class="lvlb">Nível ${level}</span><span class="mut sm">${unlocked} de ${list.length} medalhas</span></div><div class="achprog big"><i style="width:${Math.round(unlocked / list.length * 100)}%"></i></div></div></section>
    <section class="kpis">
      <div class="kpi"><b>${fmtNum(st.done)}</b><span>Tarefas concluídas</span></div>
      <div class="kpi"><b>${st.streak}</b><span>Dias seguidos agora</span><small>Recorde: ${st.best}</small></div>
      <div class="kpi"><b>${fmtNum(st.focus)}</b><span>Sessões de foco</span><small>${st.focusH}h no total</small></div>
      <div class="kpi"><b>${fmtNum(st.habits)}</b><span>Hábitos cumpridos</span></div>
      <div class="kpi"><b>${st.bestDay}</b><span>Recorde num dia</span></div>
    </section>
    ${recent.length ? `<section class="hcardx"><header><h3>Conquistas recentes</h3></header><div class="medals">${recent.map(x => `<div class="mdl">${medalSvg(x.i, x.a.e, false, 58)}<b>${esc(x.a.n)}</b><span>${fmtNum(x.goal)}${got[x.id] ? ' · ' + new Date(got[x.id]).toLocaleDateString('pt-BR') : ''}</span></div>`).join('')}</div></section>` : ''}
    <div class="row"><h3 class="dsh" style="margin:6px 0">Todas as medalhas</h3><span class="sp"></span><div class="seg"><button class="${ACH_F === 'all' ? 'on' : ''}" data-act="achf" data-f="all">Todas</button><button class="${ACH_F === 'got' ? 'on' : ''}" data-act="achf" data-f="got">Conquistadas</button></div></div>
    ${cats || '<p class="hint pad">Nenhuma medalha ainda: conclua sua primeira tarefa!</p>'}
  </div></div>`;
};
Object.assign(ACTS, { achf: b => { ACH_F = b.dataset.f; render(true); }, me: () => go('me') });
