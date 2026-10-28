/* Painel inicial: resumo do dia, números, gráficos e próximas tarefas. */
'use strict';
let HOME_RANGE = 14;
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
  main.innerHTML = headHtml('Painel', '', `<button class="btn red sm" data-act="quick">${ic('plus', 16)}<span>Tarefa</span></button>`) + `<div class="scroll"><div class="home">
    <section class="hero">
      <div><p class="hdate">${esc(fmtLong(T))}</p><h2>${h < 12 ? 'Bom dia' : h < 18 ? 'Boa tarde' : 'Boa noite'}${nm ? `, ${esc(nm)}` : ''}</h2>
        <p class="herotx">${over.length ? `Você tem <b class="red">${plural(over.length, 'tarefa atrasada', 'tarefas atrasadas')}</b> e ` : 'Você tem '}<b>${plural(todayT.length, 'tarefa', 'tarefas')} para hoje</b>.${doneToday ? ` Já concluiu ${doneToday} hoje.` : ''}</p></div>
      <div class="ring"><svg viewBox="0 0 120 120" role="img" aria-label="Progresso de hoje: ${pct}%"><circle cx="60" cy="60" r="50" class="rbg"/><circle cx="60" cy="60" r="50" class="rfg" stroke-dasharray="${(2 * Math.PI * 50).toFixed(1)}" stroke-dashoffset="${(2 * Math.PI * 50 * (1 - pct / 100)).toFixed(1)}" transform="rotate(-90 60 60)"/></svg><div><b>${pct}%</b><span>do dia</span></div></div>
    </section>
    <section class="kpis">
      ${kpi(over.length, 'Atrasadas', over.length ? 'warn' : '', 'l/today')}
      ${kpi(todayT.length, 'Para hoje', '', 'l/today')}
      ${kpi(week.length, 'Próximos 7 dias', '', 'l/week')}
      ${kpi(open.length, 'Em aberto', '', 'l/all', nodate.length ? nodate.length + ' sem data' : '')}
      ${kpi(doneWeek, 'Concluídas na semana', 'ok', 'l/done', prevWeek || doneWeek ? (trend >= 0 ? '▲ ' : '▼ ') + Math.abs(trend) + ' vs. semana passada' : '')}
      ${kpi(habs.length ? habsOk + '/' + habs.length : '—', 'Hábitos hoje', '', 'habits')}
      ${kpi(focusMin ? fmtDur(focusMin) : '0min', 'Foco hoje', '', 'focus')}
    </section>
    <section class="hcardx wide"><header><h3>Tarefas concluídas</h3><div class="seg">${[7, 14, 30].map(n => `<button class="${HOME_RANGE === n ? 'on' : ''}" data-act="hrange" data-n="${n}">${n} dias</button>`).join('')}</div></header>${svgBars(bars, { aria: 'Tarefas concluídas por dia', w: Math.max(300, Math.min(1060, (main.clientWidth || 800) - (isMobile() ? 60 : 110))) })}<p class="hint">Total no período: <b>${bars.reduce((s, b) => s + b.v, 0)}</b> · média de ${(bars.reduce((s, b) => s + b.v, 0) / HOME_RANGE).toFixed(1)} por dia</p></section>
    <div class="hgrid">
      <section class="hcardx"><header><h3>Em aberto por lista</h3></header>${byList.length ? `<div class="hbars">${byList.map(x => `<button class="hbar" data-act="go" data-to="l/${x.l.id}"><span class="hbn">${x.l.emoji ? esc(x.l.emoji) + ' ' : `<i class="ldot" style="background:${esc(x.l.color || '#888')}"></i>`}${esc(x.l.name)}</span><span class="hbt"><i style="width:${Math.round(x.n / maxL * 100)}%;background:${esc(x.l.color || 'var(--red)')}"></i></span><b>${x.n}</b></button>`).join('')}</div>` : '<p class="hint pad">Nenhuma tarefa em aberto.</p>'}</section>
      <section class="hcardx"><header><h3>Por prioridade</h3></header><div class="donutw">${svgDonut(pr, open.length, 'em aberto')}<ul class="leg">${pr.map(p => `<li><i style="background:${p.c}"></i>${esc(p.n)}<b>${p.v}</b></li>`).join('')}</ul></div></section>
    </div>
    <div class="hgrid">
      ${over.length ? `<section class="hcardx"><header><h3 class="red">Atrasadas</h3><button class="link" data-act="resched">Reagendar para hoje</button></header>${mini(over, '')}</section>` : ''}
      <section class="hcardx"><header><h3>Hoje</h3><button class="link" data-act="go" data-to="l/today">Ver tudo</button></header>${mini(todayT, 'Nada para hoje. Aproveite! 🎉')}</section>
      <section class="hcardx"><header><h3>Próximos dias</h3><button class="link" data-act="go" data-to="l/week">Ver tudo</button></header>${mini(week, 'Nada nos próximos 7 dias.')}</section>
      ${habs.length ? `<section class="hcardx"><header><h3>Hábitos de hoje</h3><button class="link" data-act="go" data-to="habits">Abrir</button></header><div class="hhabs">${habs.map(x => `<button class="hhab${hDone(x, T) ? ' on' : ''}" style="--hc:${esc(x.color || '#DB4035')}" data-act="hcheckhome" data-id="${x.id}"><span>${esc(x.emoji || '✅')}</span>${esc(x.name)}${(x.goal || 1) > 1 ? ` <small>${hVal(x, T)}/${x.goal}</small>` : ''}</button>`).join('')}</div></section>` : ''}
    </div>
  </div></div>`;
};
Object.assign(ACTS, {
  hrange: b => { HOME_RANGE = +b.dataset.n; render(true); },
  hcheckhome: b => { HS.day = today(); ACTS.hcheck(b); },
});
