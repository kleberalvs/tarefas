/* Painel inicial: resumo do dia, números, gráficos e próximas tarefas. */
'use strict';
let HOME_RANGE = 14, HOME_EDIT = false;
/* blocos do painel: nome e largura padrão (em colunas de 4 no computador; 2 no celular) */
const HB_DEF = {
  hero: { n: 'Saudação e progresso', w: 4 }, aisum: { n: 'Resumo do dia (IA)', w: 4 },
  k_over: { n: 'Atrasadas (número)', w: 1 }, k_today: { n: 'Para hoje (número)', w: 1 }, k_week: { n: 'Próximos 7 dias (número)', w: 1 }, k_open: { n: 'Em aberto (número)', w: 1 },
  k_done: { n: 'Concluídas na semana', w: 1 }, k_habits: { n: 'Hábitos hoje (número)', w: 1 }, k_focus: { n: 'Foco hoje', w: 1 },
  chart: { n: 'Gráfico de concluídas', w: 4 }, lists: { n: 'Em aberto por lista', w: 2 }, prio: { n: 'Por prioridade', w: 2 },
  overdue: { n: 'Tarefas atrasadas', w: 2 }, today: { n: 'Tarefas de hoje', w: 2 }, week: { n: 'Próximos dias', w: 2 }, habits: { n: 'Hábitos de hoje', w: 2 },
};
const HB_ORDER = ['hero', 'aisum', 'k_over', 'k_today', 'k_week', 'k_open', 'k_done', 'k_habits', 'k_focus', 'chart', 'lists', 'prio', 'overdue', 'today', 'week', 'habits'];
/* um arranjo para o celular e outro para telas grandes; sincroniza entre aparelhos */
function homeLayout() {
  const key = isMobile() ? 'm' : 'd', all = (db.s.home = db.s.home && typeof db.s.home === 'object' ? db.s.home : {});
  const L = all[key] = all[key] || {};
  L.order = Array.isArray(L.order) ? L.order.filter(id => HB_DEF[id]) : HB_ORDER.slice();
  HB_ORDER.forEach(id => { if (!L.order.includes(id)) L.order.push(id); });
  L.w = L.w || {}; L.h = L.h || {}; L.hidden = Array.isArray(L.hidden) ? L.hidden : [];
  return L;
}
function homeSave() { put('s', db.s, { silent: true }); }
function homeEditBind(main, cols) {
  const grid = main.querySelector('.hgx'); if (!grid) return;
  const L = homeLayout();
  const metrics = () => { const cs = getComputedStyle(grid), gap = parseFloat(cs.columnGap) || 16, W = grid.clientWidth; return { gap, colW: (W - gap * (cols - 1)) / cols }; };
  /* mover: arrasta pelo título; os outros blocos abrem espaço */
  grid.querySelectorAll('[data-hbdrag]').forEach(h => h.addEventListener('pointerdown', e => {
    e.preventDefault();
    const card = h.closest('.hb'), r = card.getBoundingClientRect();
    const ghost = card.cloneNode(true); ghost.classList.add('hbghost');
    Object.assign(ghost.style, { width: r.width + 'px', height: r.height + 'px', left: r.left + 'px', top: r.top + 'px' });
    document.body.appendChild(ghost); card.classList.add('hbph');
    const ox = e.clientX - r.left, oy = e.clientY - r.top, sc = main.querySelector('.scroll');
    let raf = 0, lastY = e.clientY;
    const scrollLoop = () => { const sr = sc.getBoundingClientRect(); if (lastY < sr.top + 60) sc.scrollTop -= 12; else if (lastY > sr.bottom - 60) sc.scrollTop += 12; raf = requestAnimationFrame(scrollLoop); };
    raf = requestAnimationFrame(scrollLoop);
    const move = ev => {
      lastY = ev.clientY;
      ghost.style.left = ev.clientX - ox + 'px'; ghost.style.top = ev.clientY - oy + 'px';
      const over = [...grid.children].find(c => { if (c === card) return false; const b = c.getBoundingClientRect(); return ev.clientX >= b.left && ev.clientX <= b.right && ev.clientY >= b.top && ev.clientY <= b.bottom; });
      if (!over) return;
      const b = over.getBoundingClientRect(), before = (ev.clientY - b.top) / b.height < .5 && (ev.clientX - b.left) / b.width < .75 || (ev.clientX - b.left) / b.width < .35;
      const ref = before ? over : over.nextSibling;
      if (ref !== card && ref !== card.nextSibling) grid.insertBefore(card, ref);
    };
    const up = () => {
      removeEventListener('pointermove', move); removeEventListener('pointerup', up); removeEventListener('pointercancel', up);
      cancelAnimationFrame(raf); ghost.remove(); card.classList.remove('hbph');
      const seen = [...grid.children].map(c => c.dataset.hb);
      L.order = [...seen, ...L.order.filter(id => !seen.includes(id))]; homeSave();
    };
    addEventListener('pointermove', move); addEventListener('pointerup', up); addEventListener('pointercancel', up);
  }));
  /* redimensionar: puxa o canto (largura em colunas, altura livre) */
  grid.querySelectorAll('[data-hbres]').forEach(hd => hd.addEventListener('pointerdown', e => {
    e.preventDefault(); e.stopPropagation();
    const card = hd.closest('.hb'), id = card.dataset.hb, r = card.getBoundingClientRect(), { gap, colW } = metrics();
    const inner = card.querySelector('.hbin'), natural = inner.scrollHeight;
    card.classList.add('hbres-on');
    const sx = e.clientX, sy = e.clientY;
    let w = Math.min(cols, L.w[id] || HB_DEF[id].w), hpx = r.height;
    const move = ev => {
      const nw = Math.max(1, Math.min(cols, Math.round((r.width + ev.clientX - sx + gap) / (colW + gap))));
      hpx = Math.max(72, Math.round((r.height + ev.clientY - sy) / 8) * 8);
      if (nw !== w) { w = nw; card.style.gridColumn = 'span ' + w; }
      card.style.height = hpx + 'px';
      card.dataset.size = w + ' × ' + hpx + 'px';
    };
    const up = () => {
      removeEventListener('pointermove', move); removeEventListener('pointerup', up); removeEventListener('pointercancel', up);
      card.classList.remove('hbres-on'); delete card.dataset.size;
      L.w[id] = w;
      /* perto da altura natural do conteúdo = altura automática */
      if (Math.abs(hpx - natural) < 24) { delete L.h[id]; card.style.height = ''; } else L.h[id] = hpx;
      homeSave(); render(true);
    };
    addEventListener('pointermove', move); addEventListener('pointerup', up); addEventListener('pointercancel', up);
  }));
}
function doneEvents() {
  const ev = [];
  db.t.forEach(t => {
    if (t.del) return;
    if (t.done && t.dt) ev.push({ t, at: t.dt });
    (t.hist || []).forEach(h => ev.push({ t, at: h.at }));
  });
  return ev;
}
function svgBars(data, opts = {}) {
  const W = opts.w || 640, H = 200, pl = 28, pb = 26, pt = 16, n = data.length, max = Math.max(1, ...data.map(d => d.v));
  const step = Math.ceil(max / 4) || 1, top = step * 4, bw = (W - pl - 8) / n;
  let g = '';
  for (let i = 0; i <= 4; i++) { const y = pt + (H - pt - pb) * (1 - i / 4); g += `<line x1="${pl}" x2="${W}" y1="${y}" y2="${y}" class="grid"/><text x="${pl - 6}" y="${y + 4}" class="ax" text-anchor="end">${step * i}</text>`; }
  data.forEach((d, i) => {
    const h = (H - pt - pb) * d.v / top, x = pl + i * bw + bw * .18, w = bw * .64, y = H - pb - h;
    g += `<g class="bar${d.today ? ' tdy' : ''}"><title>${esc(d.title)}: ${d.v}</title><rect x="${x}" y="${y}" width="${w}" height="${Math.max(h, d.v ? 3 : 0)}" rx="${Math.min(5, w / 3)}"/>${d.v ? `<text x="${x + w / 2}" y="${y - 4}" text-anchor="middle" class="bv">${d.v}</text>` : ''}<text x="${x + w / 2}" y="${H - 8}" text-anchor="middle" class="ax">${esc(d.label)}</text></g>`;
  });
  return `<svg viewBox="0 0 ${W} ${H}" class="chart" role="img" aria-label="${esc(opts.aria || '')}" >${g}</svg>`;
}
function svgDonut(parts, center, sub) {
  const tot = parts.reduce((s, p) => s + p.v, 0), R = 54, C = 2 * Math.PI * R;
  let off = 0, arcs = '';
  if (tot) parts.forEach(p => { if (!p.v) return; const len = C * p.v / tot; arcs += `<circle r="${R}" cx="70" cy="70" fill="none" stroke="${p.c}" stroke-width="18" stroke-dasharray="${len - 2} ${C - len + 2}" stroke-dashoffset="${-off}" transform="rotate(-90 70 70)"><title>${esc(p.n)}: ${p.v}</title></circle>`; off += len; });
  else arcs = `<circle r="${R}" cx="70" cy="70" fill="none" stroke="var(--line)" stroke-width="18"/>`;
  return `<svg viewBox="0 0 140 140" class="donut" role="img" aria-label="${esc(sub)}">${arcs}<text x="70" y="68" text-anchor="middle" class="dn">${center}</text><text x="70" y="88" text-anchor="middle" class="ds">${esc(sub)}</text></svg>`;
}
VIEWS.home = main => {
  const T = today(), now = new Date(), h = now.getHours(), nm = (db.s.name || '').trim().split(' ')[0];
  const open = db.t.filter(t => live(t) && !t.par);
  const over = open.filter(overdue).sort((a, b) => sortTasks(a, b));
  const todayT = open.filter(t => { const d = tDate(t); return d === T || (t.start && dOnly(t.start) <= T && t.due && dOnly(t.due) >= T); }).sort((a, b) => sortTasks(a, b));
  const week = open.filter(t => { const d = tDate(t); return d && d > T && d <= addD(T, 6); }).sort((a, b) => sortTasks(a, b));
  const nodate = open.filter(t => !tDate(t));
  const ev = doneEvents();
  const dayOf = e => ymd(new Date(e.at));
  const doneToday = ev.filter(e => dayOf(e) === T).length;
  const ws = sow(T), doneWeek = ev.filter(e => dayOf(e) >= ws).length;
  const prevWeek = ev.filter(e => dayOf(e) >= addD(ws, -7) && dayOf(e) < ws).length;
  const planned = doneToday + todayT.length + over.length, pct = planned ? Math.round(doneToday / planned * 100) : 0;
  const focusMin = db.p.filter(p => ymd(new Date(p.start)) === T).reduce((s, p) => s + (p.dur || 0), 0);
  const habs = db.h.filter(x => !x.arch && hDue(x, T)), habsOk = habs.filter(x => hDone(x, T)).length;
  /* gráfico: concluídas por dia */
  const days = [...Array(HOME_RANGE)].map((_, i) => addD(T, i - HOME_RANGE + 1));
  const bars = days.map(d => ({ v: ev.filter(e => dayOf(e) === d).length, label: HOME_RANGE > 14 ? (pd(d).getDate() % 5 === 0 || d === T ? String(pd(d).getDate()) : '') : (HOME_RANGE === 7 ? wdShort[pd(d).getDay()] : String(pd(d).getDate())), title: fmtDay(d, true), today: d === T }));
  /* em aberto por lista */
  const byList = db.l.filter(l => !l.arch).map(l => ({ l, n: open.filter(t => t.list === l.id).length })).filter(x => x.n).sort((a, b) => b.n - a.n).slice(0, 7);
  const maxL = Math.max(1, ...byList.map(x => x.n));
  /* prioridade */
  const pr = [3, 2, 1, 0].map(p => ({ n: PRIO[p].n, v: open.filter(t => (t.prio || 0) === p).length, c: p ? PRIO[p].c : 'var(--line2)' }));
  const trend = doneWeek - prevWeek;
  const kpi = (n, label, cls, to, sub) => `<button class="kpi ${cls || ''}" ${to ? `data-act="go" data-to="${to}"` : ''}><b>${n}</b><span>${label}</span>${sub ? `<small>${sub}</small>` : ''}</button>`;
  const mini = (arr, empty, max = 6) => arr.length ? arr.slice(0, max).map(t => rowHtml(t, { showList: 1, show: Object.assign({}, SHOW_DEF, { cover: 0 }) })).join('') + (arr.length > max ? `<p class="hint pad">+ ${arr.length - max} tarefa(s)</p>` : '') : `<p class="hint pad">${empty}</p>`;
  const ringHtml = `<div class="ring"><svg viewBox="0 0 120 120" role="img" aria-label="Progresso de hoje: ${pct}%"><circle cx="60" cy="60" r="50" class="rbg"/><circle cx="60" cy="60" r="50" class="rfg" stroke-dasharray="${(2 * Math.PI * 50).toFixed(1)}" stroke-dashoffset="${(2 * Math.PI * 50 * (1 - pct / 100)).toFixed(1)}" transform="rotate(-90 60 60)"/></svg><div><b>${pct}%</b><span>do dia</span></div></div>`;
  const L = homeLayout(), cols = isMobile() ? 2 : 4, gw = Math.min(1120, (main.clientWidth || 900)) - (isMobile() ? 28 : 64);
  const wOf = id => Math.min(cols, L.w[id] || HB_DEF[id].w);
  const chartW = Math.max(300, Math.round(gw * wOf('chart') / cols) - 40);
  const B = {
    hero: `<section class="hero"><div><h2>${h < 12 ? 'Bom dia' : h < 18 ? 'Boa tarde' : 'Boa noite'}${nm ? `, ${esc(nm)}` : ''}</h2><p class="hdate">${esc(fmtLong(T))}</p>
        <p class="herotx">${over.length ? `Você tem <b class="red">${plural(over.length, 'tarefa atrasada', 'tarefas atrasadas')}</b> e ` : 'Você tem '}<b>${plural(todayT.length, 'tarefa', 'tarefas')} para hoje</b>.${doneToday ? ` Já concluiu ${doneToday} hoje.` : ''}</p></div>${ringHtml}</section>`,
    aisum: aisumHtml(),
    k_over: kpi(over.length, 'Atrasadas', over.length ? 'warn' : '', 'l/today'),
    k_today: kpi(todayT.length, 'Para hoje', '', 'l/today'),
    k_week: kpi(week.length, 'Próximos 7 dias', '', 'l/week'),
    k_open: kpi(open.length, 'Em aberto', '', 'l/all', nodate.length ? nodate.length + ' sem data' : ''),
    k_done: kpi(doneWeek, 'Concluídas na semana', 'ok', 'l/done', prevWeek || doneWeek ? (trend >= 0 ? '▲ ' : '▼ ') + Math.abs(trend) + ' vs. semana passada' : ''),
    k_habits: kpi(habs.length ? habsOk + '/' + habs.length : '—', 'Hábitos hoje', '', 'habits'),
    k_focus: kpi(focusMin ? fmtDur(focusMin) : '0min', 'Foco hoje', '', 'focus'),
    chart: `<section class="hcardx"><header><h3>Tarefas concluídas</h3><div class="seg">${[7, 14, 30].map(n => `<button class="${HOME_RANGE === n ? 'on' : ''}" data-act="hrange" data-n="${n}">${n} dias</button>`).join('')}</div></header>${svgBars(bars, { aria: 'Tarefas concluídas por dia', w: chartW })}<p class="hint">Total no período: <b>${bars.reduce((s, b) => s + b.v, 0)}</b> · média de ${(bars.reduce((s, b) => s + b.v, 0) / HOME_RANGE).toFixed(1)} por dia</p></section>`,
    lists: `<section class="hcardx"><header><h3>Em aberto por lista</h3></header>${byList.length ? `<div class="hbars">${byList.map(x => `<button class="hbar" data-act="go" data-to="l/${x.l.id}"><span class="hbn">${x.l.emoji ? esc(x.l.emoji) + ' ' : `<i class="ldot" style="background:${esc(x.l.color || '#888')}"></i>`}${esc(x.l.name)}</span><span class="hbt"><i style="width:${Math.round(x.n / maxL * 100)}%;background:${esc(x.l.color || 'var(--red)')}"></i></span><b>${x.n}</b></button>`).join('')}</div>` : '<p class="hint pad">Nenhuma tarefa em aberto.</p>'}</section>`,
    prio: `<section class="hcardx"><header><h3>Por prioridade</h3></header><div class="donutw">${svgDonut(pr, open.length, 'em aberto')}<ul class="leg">${pr.map(p => `<li><i style="background:${p.c}"></i>${esc(p.n)}<b>${p.v}</b></li>`).join('')}</ul></div></section>`,
    overdue: over.length ? `<section class="hcardx"><header><h3 class="red">Atrasadas</h3><button class="link" data-act="resched">Reagendar para hoje</button></header>${mini(over, '')}</section>` : (HOME_EDIT ? `<section class="hcardx"><header><h3>Atrasadas</h3></header><p class="hint pad">Nada atrasado — este bloco só aparece quando houver.</p></section>` : ''),
    today: `<section class="hcardx"><header><h3>Hoje</h3><button class="link" data-act="go" data-to="l/today">Ver tudo</button></header>${mini(todayT, 'Nada para hoje. Aproveite! 🎉')}</section>`,
    week: `<section class="hcardx"><header><h3>Próximos dias</h3><button class="link" data-act="go" data-to="l/week">Ver tudo</button></header>${mini(week, 'Nada nos próximos 7 dias.')}</section>`,
    habits: habs.length ? `<section class="hcardx"><header><h3>Hábitos de hoje</h3><button class="link" data-act="go" data-to="habits">Abrir</button></header><div class="hhabs">${habs.map(x => `<button class="hhab${hDone(x, T) ? ' on' : ''}" style="--hc:${esc(x.color || '#DB4035')}" data-act="hcheckhome" data-id="${x.id}"><span>${esc(x.emoji || '✅')}</span>${esc(x.name)}${(x.goal || 1) > 1 ? ` <small>${hVal(x, T)}/${x.goal}</small>` : ''}</button>`).join('')}</div></section>` : (HOME_EDIT ? `<section class="hcardx"><header><h3>Hábitos de hoje</h3></header><p class="hint pad">Sem hábitos para hoje.</p></section>` : ''),
  };
  const right = HOME_EDIT
    ? `<button class="btn ghost sm" data-act="hbadd">${ic('plus', 16)}<span class="hide-s">Blocos</span></button><button class="btn ghost sm" data-act="hbreset">${ic('undo', 16)}<span class="hide-s">Padrão</span></button><button class="btn red sm" data-act="hbedit">${ic('check', 16)}<span>Concluir</span></button>`
    : `<button class="ib" data-act="hbedit" aria-label="Personalizar painel" title="Personalizar painel">${ic('board')}</button><button class="btn red sm" data-act="quick">${ic('plus', 16)}<span>Tarefa</span></button>`;
  const blocks = L.order.filter(id => B[id] && !L.hidden.includes(id)).map(id => {
    const w = wOf(id), hh = L.h[id];
    return `<div class="hb${HOME_EDIT ? ' edit' : ''}" data-hb="${id}" style="grid-column:span ${w};${hh ? `height:${hh}px` : ''}">${HOME_EDIT ? `<div class="hbtools"><span class="hbdrag" data-hbdrag title="Arraste para mover">${ic('drag', 16)}<b>${esc(HB_DEF[id].n)}</b></span><button class="hbx" data-act="hbhide" data-id="${id}" aria-label="Ocultar bloco">${ic('eye', 15)}</button></div><span class="hbres" data-hbres title="Arraste para redimensionar"></span>` : ''}<div class="hbin">${B[id]}</div></div>`;
  }).join('');
  main.innerHTML = headHtml('Painel', HOME_EDIT ? 'Arraste pelo título para mover · puxe o canto para redimensionar' : '', right) + `<div class="scroll"><div class="home${HOME_EDIT ? ' editing' : ''}"><div class="hgx" style="--hcols:${cols}">${blocks}</div></div></div>`;
  if (HOME_EDIT) homeEditBind(main, cols);
  aisumAuto();
};
/* resumo do dia feito pela IA: gerado uma vez por dia (sincroniza entre aparelhos) e pode ser refeito a qualquer momento */
let AISUM_BUSY = false, AISUM_ERR = '';
function aisumData() {
  const T = today(), open = db.t.filter(t => live(t) && !t.par);
  const desc = t => { const l = listOf(t), d = tDate(t), tm = t.due && tOnly(t.due); return `- ${t.title}${t.prio ? ' [prioridade ' + PRIO[t.prio].n.toLowerCase() + ']' : ''}${tm ? ' às ' + tm : ''}${d && d !== T ? ' (' + fmtDay(d, true).toLowerCase() + ')' : ''}${l ? ' — lista ' + l.name : ''}${subsOf(t.id).length ? ' — ' + subsOf(t.id).filter(x => !x.done).length + ' subtarefa(s) pendente(s)' : ''}`; };
  const over = open.filter(overdue).sort(sortTasks), todayT = open.filter(t => tDate(t) === T && !overdue(t)).sort(sortTasks);
  const week = open.filter(t => { const d = tDate(t); return d && d > T && d <= addD(T, 6); }).sort(sortTasks);
  const ev = doneEvents(), y = addD(T, -1);
  const doneY = ev.filter(e => ymd(new Date(e.at)) === y).length, doneT = ev.filter(e => ymd(new Date(e.at)) === T).length;
  const habs = db.h.filter(x => !x.arch && hDue(x, T)).map(x => x.name);
  const ag = (typeof GC !== 'undefined' && Array.isArray(GC.ev) ? GC.ev : []).filter(e => e.start && String(e.start).slice(0, 10) === T).map(e => `- ${e.title || 'Evento'}${e.start.length > 10 ? ' às ' + String(e.start).slice(11, 16) : ''}`);
  return [`Hoje é ${fmtLong(T)}. Agora são ${hm(new Date())}.`,
    `Atrasadas (${over.length}):\n${over.slice(0, 15).map(desc).join('\n') || 'nenhuma'}`,
    `Para hoje (${todayT.length}):\n${todayT.slice(0, 20).map(desc).join('\n') || 'nenhuma'}`,
    `Próximos 7 dias (${week.length}):\n${week.slice(0, 12).map(desc).join('\n') || 'nenhuma'}`,
    ag.length ? `Agenda de hoje:\n${ag.join('\n')}` : '',
    habs.length ? `Hábitos de hoje: ${habs.join(', ')}` : '',
    `Concluídas ontem: ${doneY}. Concluídas hoje até agora: ${doneT}. Em aberto no total: ${open.length}.`].filter(Boolean).join('\n\n');
}
function aisumHtml() {
  const S = db.s.aisum, T = today(), ok = S && S.d === T && S.tx;
  const nm = (db.s.name || '').trim().split(' ')[0];
  return `<section class="aisum${ok ? '' : ' load'}" id="aisum"><header><h3><span class="aisp">✨</span>Resumo do dia</h3><span class="mut aiwhen">${ok ? 'feito às ' + hm(new Date(S.at)) : ''}</span><span class="sp"></span><button class="ib" data-act="aisumre" aria-label="Refazer resumo" title="Refazer resumo">${ic('undo', 17)}</button></header>
    <div class="aibody">${ok ? aiFmt(S.tx) : AISUM_ERR ? `<p class="err">${esc(AISUM_ERR)}</p><p class="mut sm">Toque em ↻ para tentar de novo.</p>` : '<span class="sk"></span><span class="sk"></span><span class="sk"></span>'}</div></section>`;
}
function aisumAuto() { const S = db.s.aisum; if (!(S && S.d === today() && S.tx) && !AISUM_ERR) aisumMake(); }
async function aisumMake() {
  if (AISUM_BUSY || typeof aiGen !== 'function') return;
  AISUM_BUSY = true; AISUM_ERR = '';
  const nm = (db.s.name || '').trim().split(' ')[0];
  const prompt = `Faça o resumo do dia das minhas tarefas${nm ? ' (meu nome é ' + nm + ')' : ''}, como um assistente pessoal objetivo. Escreva em português do Brasil, no máximo 110 palavras, em 3 a 5 itens começando com "- ". Destaque em **negrito** o que é mais importante. Inclua: o foco principal do dia, o que está atrasado e merece atenção, uma ordem sugerida para começar e, se fizer sentido, um alerta sobre os próximos dias. Se não houver nada pendente, dê uma mensagem curta e positiva. Não invente tarefas que não estão na lista.\n\nMinhas tarefas:\n${aisumData()}`;
  const el = () => document.getElementById('aisum');
  try {
    let shown = false;
    const tx = (await aiGen(prompt, t => { const b = el() && el().querySelector('.aibody'); if (b && t.trim()) { b.innerHTML = aiFmt(t); if (!shown) { el().classList.remove('load'); shown = true; } } })).trim();
    if (!tx) throw new Error('A IA não respondeu agora.');
    db.s.aisum = { d: today(), tx, at: Date.now() }; put('s', db.s);
  } catch (e) {
    AISUM_ERR = (e && e.message) || 'Não foi possível gerar o resumo agora.';
  }
  AISUM_BUSY = false;
  if (R.v === 'home') render(true);
}
Object.assign(ACTS, {
  hbedit: () => { HOME_EDIT = !HOME_EDIT; if (!HOME_EDIT) toast('Painel salvo'); render(true); },
  hbhide: b => { const L = homeLayout(); if (!L.hidden.includes(b.dataset.id)) L.hidden.push(b.dataset.id); homeSave(); render(true); toast('Bloco oculto', 'Desfazer', () => { L.hidden = L.hidden.filter(x => x !== b.dataset.id); homeSave(); render(true); }); },
  hbadd: b => {
    const L = homeLayout();
    menu(b, [{ head: 'Mostrar ou ocultar blocos' }, ...HB_ORDER.map(id => ({ label: HB_DEF[id].n, on: !L.hidden.includes(id), act: () => { if (L.hidden.includes(id)) { L.hidden = L.hidden.filter(x => x !== id); L.order = [...L.order.filter(x => x !== id), id]; } else L.hidden.push(id); homeSave(); render(true); } }))], { right: 1 });
  },
  hbreset: async () => { if (!(await confirmBox('Voltar o painel para o arranjo padrão?'))) return; const key = isMobile() ? 'm' : 'd'; if (db.s.home) delete db.s.home[key]; homeSave(); render(true); toast('Painel no arranjo padrão'); },
  aisumre: () => { AISUM_ERR = ''; const b = document.querySelector('#aisum .aibody'); if (b) { b.parentElement.classList.add('load'); b.innerHTML = '<span class="sk"></span><span class="sk"></span><span class="sk"></span>'; } aisumMake(); },
  hrange: b => { HOME_RANGE = +b.dataset.n; render(true); },
  hcheckhome: b => { HS.day = today(); ACTS.hcheck(b); },
});
