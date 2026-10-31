/* Metas e porquinhos: cada meta é um cofrinho (valores fictícios que espelham o que você guardou de verdade).
   Registro: kind 'm' → { id, name, target (centavos), due (aaaa-mm-dd, opcional), skin, dep: [{ id, d, at, v, note }], real: { v, at }, arch, c, u }
   v positivo = guardou; negativo = retirou. Tudo sincroniza junto com as tarefas. */
'use strict';
/* porquinhos em 3D (renderizados com luz de estúdio; um arquivo por cor em assets/pigs) */
const PIGS = {
  laranja: { n: 'Laranja', g: 'c' }, rosa: { n: 'Rosa', g: 'c' }, azul: { n: 'Azul', g: 'c' }, menta: { n: 'Menta', g: 'c' }, lilas: { n: 'Lilás', g: 'c' },
  vermelho: { n: 'Vermelho', g: 'c' }, grafite: { n: 'Grafite', g: 'c' }, perola: { n: 'Pérola', g: 'c' }, dourado: { n: 'Dourado', g: 'c' }, prata: { n: 'Prata', g: 'c' },
  bolinhas: { n: 'Bolinhas', g: 'e' }, marinheiro: { n: 'Marinheiro', g: 'e' }, galaxia: { n: 'Galáxia', g: 'e' }, melancia: { n: 'Melancia', g: 'e' },
  vaca: { n: 'Vaquinha', g: 'e' }, marmore: { n: 'Mármore', g: 'e' }, onca: { n: 'Oncinha', g: 'e' }, arcoiris: { n: 'Arco-íris', g: 'e' },
  rei: { n: 'Rei', g: 'a' }, laco: { n: 'Lacinho', g: 'a' }, oculos: { n: 'Descolado', g: 'a' }, festa: { n: 'Festa', g: 'a' },
  natal: { n: 'Natal', g: 'a' }, dj: { n: 'DJ', g: 'a' }, chique: { n: 'Chique', g: 'a' }, vidro: { n: 'Vidro com moedas', g: 'a' },
};
const PIG_GROUPS = [['c', 'Cores'], ['e', 'Estampas'], ['a', 'Acessórios e especiais']];
const GOAL_IDEAS = [['✈️', 'Viagem'], ['🛟', 'Reserva de emergência'], ['🚗', 'Carro'], ['🏠', 'Casa própria'], ['🎓', 'Estudos'], ['💻', 'Notebook novo'], ['🎁', 'Presentes de Natal'], ['💍', 'Casamento'], ['📱', 'Celular novo'], ['🏖️', 'Férias']];
const PIG_OLD = { ouro: 'dourado', porcelana: 'perola', noite: 'grafite', melancia: 'vermelho', vaca: 'perola', robo: 'prata', vidro: 'azul', cafe: 'laranja' };
const PIG_SLOT = [35.7, 21.9], PIG_AR = 539 / 560;
const pigKey = k => PIGS[k] ? k : PIG_OLD[k] || 'laranja';
const brl = c => ((c || 0) / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const brlS = c => (c < 0 ? '−' : '+') + brl(Math.abs(c));
function parseBRL(s) {
  s = String(s || '').replace(/[^\d,.\-]/g, '');
  if (!s) return NaN;
  if (s.includes(',')) s = s.replace(/\./g, '').replace(',', '.');
  else if (/^\d{1,3}(\.\d{3})+$/.test(s)) s = s.replace(/\./g, '');
  return Math.round(parseFloat(s) * 100);
}
const gSaved = g => (g.dep || []).reduce((a, x) => a + (x.v || 0), 0);
const gPct = g => g.target ? Math.max(0, Math.min(1, gSaved(g) / g.target)) : 0;
const gDeps = g => (g.dep || []).slice().sort((a, b) => a.d === b.d ? (a.at || 0) - (b.at || 0) : a.d < b.d ? -1 : 1);
const ymOf = d => d.slice(0, 7);
const ymLabel = (ym, short) => { const [y, m] = ym.split('-').map(Number); return short ? `${monShort[m - 1]}${y !== new Date().getFullYear() ? '/' + String(y).slice(2) : ''}` : `${cap(monNames[m - 1])} de ${y}`; };
function ymAdd(ym, n) { const [y, m] = ym.split('-').map(Number), d = new Date(y, m - 1 + n, 1); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0'); }
function ymDiff(a, b) { const [y1, m1] = a.split('-').map(Number), [y2, m2] = b.split('-').map(Number); return (y2 - y1) * 12 + (m2 - m1); }

/* ---------- o porquinho (SVG desenhado à mão) ---------- */
function pigSvg(skin, pct = 0, size = 120, opts = {}) {
  const k = pigKey(skin);
  return `<span class="pigw${opts.cls ? ' ' + opts.cls : ''}${pct >= 1 ? ' full' : ''}" style="width:${size}px;--sx:${PIG_SLOT[0]}%;--sy:${PIG_SLOT[1]}%"><img src="assets/pigs/${k}.webp" width="${size}" height="${Math.round(size * PIG_AR)}" alt="" draggable="false" decoding="async">${pct >= 1 ? '<i class="pgs s1">✦</i><i class="pgs s2">✦</i><i class="pgs s3">✦</i>' : ''}</span>`;
}

/* ---------- telas ---------- */
const GS = { tab: 'hist' };
function goalsAll() { return db.m.filter(g => !g.del); }
VIEWS.goals = main => {
  if (R.id) return goalDetail(main, get('m', R.id));
  const gs = goalsAll().filter(g => !g.arch).sort((a, b) => (a.o || a.c || 0) - (b.o || b.c || 0));
  const arch = goalsAll().filter(g => g.arch);
  const all = goalsAll(), tot = all.reduce((a, g) => a + gSaved(g), 0), ym = ymOf(today());
  const monthDeps = all.flatMap(g => (g.dep || []).filter(x => ymOf(x.d) === ym));
  const mon = monthDeps.reduce((a, x) => a + x.v, 0);
  main.innerHTML = headHtml('Metas', all.length ? `${brl(tot)} guardados em ${all.length} ${all.length === 1 ? 'porquinho' : 'porquinhos'}` : 'Seus porquinhos de reserva', `<button class="btn red sm" data-act="gnew">${ic('plus', 16)}<span>Nova meta</span></button>`) + `<div class="scroll"><div class="goals">
    ${all.length ? `<div class="gsum">
      <div class="gkpi"><span class="mut sm">Total guardado</span><b>${brl(tot)}</b></div>
      <div class="gkpi"><span class="mut sm">Em ${monNames[new Date().getMonth()]}</span><b class="${mon < 0 ? 'neg' : 'pos'}">${mon ? brlS(mon) : brl(0)}</b></div>
      <div class="gkpi"><span class="mut sm">Depósitos no mês</span><b>${monthDeps.filter(x => x.v > 0).length}</b></div>
    </div>` : ''}
    <div class="ggrid">${gs.map(goalCard).join('')}${gs.length ? `<button class="gcard gadd" data-act="gnew">${ic('plus', 28)}<span>Nova meta</span></button>` : ''}</div>
    ${!gs.length ? `<div class="empty gempty">${pigSvg('laranja', .35, 190, { cls: 'bob' })}<p><b>Crie seu primeiro porquinho</b></p><p class="mut">Defina uma meta (uma viagem, uma reserva, um presente) e registre cada valor que você guardar de verdade. O app acompanha o total, os meses e quanto falta.</p><button class="btn red" data-act="gnew">${ic('plus', 16)}Nova meta</button></div>` : ''}
    ${gs.length ? `<p class="hint gtip">Você pode ter quantos porquinhos quiser, um para cada objetivo. Toque em <b>Nova meta</b> para criar outro.</p>` : ''}
    ${arch.length ? `<details class="harch"><summary>Arquivadas e concluídas (${arch.length})</summary><div class="ggrid sm">${arch.map(goalCard).join('')}</div></details>` : ''}
  </div></div><button class="fab" data-act="gnew" aria-label="Nova meta">${ic('plus', 26)}</button>`;
};
function goalCard(g) {
  const s = gSaved(g), p = gPct(g), last = (g.dep || []).reduce((a, x) => !a || x.d > a.d ? x : a, null);
  const sub = p >= 1 ? '🎉 Meta alcançada' : g.due ? `Prazo: ${fmtDay(g.due)}` : last ? `Último: ${fmtDay(last.d)}` : 'Nenhum depósito ainda';
  return `<a class="gcard${p >= 1 ? ' full' : ''}" href="#/goals/${g.id}">
    <div class="gpig">${pigSvg(g.skin, p, 132)}</div>
    <b class="gname">${esc(g.name)}</b>
    <span class="gval"><b>${brl(s)}</b>${g.target ? `<span class="mut"> de ${brl(g.target)}</span>` : ''}</span>
    ${g.target ? `<span class="gbar"><i style="width:${(p * 100).toFixed(1)}%"></i></span>` : ''}
    <span class="mut sm">${g.target ? Math.floor(p * 100) + '% · ' : ''}${esc(sub)}</span>
  </a>`;
}
function goalStats(g) {
  const ds = gDeps(g), s = gSaved(g), now = ymOf(today());
  const first = ds.length ? ymOf(ds[0].d) : now, months = Math.max(1, ymDiff(first, now) + 1);
  const avg = s / months, left = Math.max(0, (g.target || 0) - s);
  let need = null, eta = null;
  if (g.due && left > 0) { const m = Math.max(1, ymDiff(now, ymOf(g.due)) + (g.due >= today() ? 1 : 0)); need = left / m; }
  if (left > 0 && avg > 0) eta = ymAdd(now, Math.ceil(left / avg));
  const pos = ds.filter(x => x.v > 0);
  return { s, months, avg, left, need, eta, n: pos.length, big: pos.reduce((a, x) => Math.max(a, x.v), 0), mean: pos.length ? pos.reduce((a, x) => a + x.v, 0) / pos.length : 0, out: ds.filter(x => x.v < 0).reduce((a, x) => a - x.v, 0) };
}
function goalDetail(main, g) {
  if (!g || g.del) { main.innerHTML = headHtml('Metas') + `<div class="empty"><p>Esta meta não existe mais.</p><a class="btn ghost" href="#/goals">Ver metas</a></div>`; return; }
  const st = goalStats(g), p = gPct(g), ds = gDeps(g);
  /* histórico por mês com saldo acumulado */
  let run = 0; const rows = ds.map(x => { run += x.v; return Object.assign({ run }, x); }).reverse();
  const byM = []; rows.forEach(x => { const k = ymOf(x.d); let m = byM[byM.length - 1]; if (!m || m.k !== k) byM.push(m = { k, items: [], sum: 0 }); m.items.push(x); m.sum += x.v; });
  const real = g.real && g.real.v != null ? g.real : null, diff = real ? real.v - st.s : 0;
  main.innerHTML = headHtml(g.name, '', `<button class="ib" data-act="gskin" data-id="${g.id}" aria-label="Trocar porquinho" title="Trocar porquinho">${ic('star', 19)}</button><button class="ib" data-act="gedit" data-id="${g.id}" aria-label="Editar meta" title="Editar meta">${ic('edit', 19)}</button>`, { pre: `<nav class="crumbs gcrumb"><a href="#/goals">Metas</a><span>/</span></nav>` }) + `<div class="scroll"><div class="goals gdet">
    <nav class="gtabs">${goalsAll().filter(x => !x.arch).sort((a, b) => (a.o || a.c || 0) - (b.o || b.c || 0)).map(x => `<a class="gtab${x.id === g.id ? ' on' : ''}" href="#/goals/${x.id}"><img src="assets/pigs/${pigKey(x.skin)}.webp" alt="" width="34" height="${Math.round(34 * PIG_AR)}"><span>${esc(x.name)}</span></a>`).join('')}<button class="gtab add" data-act="gnew">${ic('plus', 16)}<span>Nova meta</span></button></nav>
    <section class="ghero">
      <button class="gbig" data-act="gtap" aria-label="Porquinho">${pigSvg(g.skin, p, 230, { cls: 'bob' })}</button>
      <div class="ghinfo">
        <span class="mut sm">Guardado</span>
        <b class="gtotal" data-count="${st.s}">${brl(st.s)}</b>
        ${g.target ? `<span class="mut">de ${brl(g.target)} · ${Math.floor(p * 100)}%</span><span class="gbar lg"><i style="width:${(p * 100).toFixed(1)}%"></i></span>` : '<span class="mut">Sem valor-alvo definido</span>'}
        <div class="gfacts">
          ${g.target ? (st.left > 0 ? `<span>Faltam <b>${brl(st.left)}</b></span>` : '<span>🎉 <b>Meta alcançada!</b></span>') : ''}
          ${st.need != null ? `<span>Para o prazo (${fmtDay(g.due)}): <b>${brl(Math.ceil(st.need))}/mês</b></span>` : ''}
          ${st.eta ? `<span>No seu ritmo (${brl(Math.round(st.avg))}/mês) chega em <b>${ymLabel(st.eta)}</b></span>` : ''}
        </div>
        <div class="row gbtns"><button class="btn red" data-act="gdep" data-id="${g.id}">${ic('plus', 16)}Guardar</button><button class="btn ghost" data-act="gdep" data-id="${g.id}" data-out="1">${ic('minus', 16)}Retirar</button></div>
      </div>
    </section>
    <div class="gstats">
      <div class="gkpi"><span class="mut sm">Depósitos</span><b>${st.n}</b></div>
      <div class="gkpi"><span class="mut sm">Média por depósito</span><b>${brl(Math.round(st.mean))}</b></div>
      <div class="gkpi"><span class="mut sm">Maior depósito</span><b>${brl(st.big)}</b></div>
      <div class="gkpi"><span class="mut sm">Meses guardando</span><b>${ds.length ? st.months : 0}</b></div>
      ${st.out ? `<div class="gkpi"><span class="mut sm">Retirado</span><b class="neg">${brl(st.out)}</b></div>` : ''}
    </div>
    <section class="gcmp">
      <div class="f1"><b>Conferir com a vida real</b><p class="mut sm">${real ? `No banco/carteira: <b>${brl(real.v)}</b> (conferido ${fmtDay(real.d || today()).toLowerCase()}). ${diff === 0 ? '<span class="pos">✓ Bate com o porquinho.</span>' : diff > 0 ? `<span class="pos">Você tem ${brl(diff)} a mais do que registrou.</span>` : `<span class="neg">Faltam ${brl(-diff)} na vida real em relação ao porquinho.</span>`}` : 'Informe quanto você tem de verdade guardado para esta meta e veja se bate com o porquinho.'}</p></div>
      <button class="btn ghost sm" data-act="greal" data-id="${g.id}">${real ? 'Atualizar' : 'Informar saldo real'}</button>
      ${real && diff ? `<button class="btn ghost sm" data-act="gfix" data-id="${g.id}">Ajustar porquinho</button>` : ''}
    </section>
    <section class="gchart"><div class="gh"><b>Evolução</b><span class="sp"></span><span class="mut sm">barras = guardado no mês · linha = total</span></div>${goalChart(g)}</section>
    <section class="ghist"><div class="gh"><b>Histórico</b><span class="sp"></span><span class="mut sm">${ds.length} ${ds.length === 1 ? 'registro' : 'registros'}</span></div>
      ${byM.map(m => `<div class="gmon"><div class="gmh"><b>${ymLabel(m.k)}</b><span class="${m.sum < 0 ? 'neg' : 'pos'}">${brlS(m.sum)}</span></div>
        ${m.items.map(x => { const d = pd(x.d); return `<div class="gdep"><span class="gday"><b>${d.getDate()}</b><span>${wdShort[d.getDay()]}</span></span><span class="f1" data-act="gdepedit" data-id="${g.id}" data-d="${x.id}"><b class="${x.v < 0 ? 'neg' : 'pos'}">${brlS(x.v)}</b>${x.note ? `<span class="mut sm">${esc(x.note)}</span>` : ''}</span><span class="mut sm grun">total ${brl(x.run)}</span><button class="ib hide-m" data-act="gdepedit" data-id="${g.id}" data-d="${x.id}" aria-label="Editar registro">${ic('edit', 16)}</button><button class="ib" data-act="gdepdel" data-id="${g.id}" data-d="${x.id}" aria-label="Excluir registro">${ic('trash', 16)}</button></div>`; }).join('')}</div>`).join('') || '<p class="hint pad">Nenhum registro ainda. Toque em <b>Guardar</b> para colocar o primeiro valor no porquinho.</p>'}
    </section>
  </div></div>`;
  if (GS.anim && GS.anim.id === g.id) { const a = GS.anim; GS.anim = null; requestAnimationFrame(() => pigCoinAnim(main, a)); }
}
function goalChart(g) {
  const ds = gDeps(g), now = ymOf(today());
  if (!ds.length) return '<p class="hint pad">O gráfico aparece depois do primeiro depósito.</p>';
  const first = ymOf(ds[0].d), n = Math.min(24, Math.max(6, ymDiff(first, now) + 1)), start = ymAdd(now, -(n - 1));
  const months = [...Array(n)].map((_, i) => ymAdd(start, i));
  let base = ds.filter(x => ymOf(x.d) < start).reduce((a, x) => a + x.v, 0);
  const net = months.map(m => ds.filter(x => ymOf(x.d) === m).reduce((a, x) => a + x.v, 0));
  const cum = net.map(v => base += v);
  const W = 640, H = 210, L = 8, Rr = 8, T = 16, B = 26, cw = (W - L - Rr) / n;
  const mx = Math.max(1, ...net.map(Math.abs)), mc = Math.max(1, g.target || 0, ...cum);
  const y0 = H - B, bh = (H - T - B) * .55;
  const bars = net.map((v, i) => { const h = Math.abs(v) / mx * bh, x = L + i * cw + cw * .22; return `<rect x="${x.toFixed(1)}" y="${(v >= 0 ? y0 - h : y0).toFixed(1)}" width="${(cw * .56).toFixed(1)}" height="${Math.max(v ? 2 : 0, h).toFixed(1)}" rx="3" class="${v < 0 ? 'gbn' : 'gbp'}"><title>${ymLabel(months[i])}: ${brlS(v)}</title></rect>`; }).join('');
  const pts = cum.map((v, i) => [L + i * cw + cw / 2, y0 - Math.max(0, v) / mc * (H - T - B)]);
  const line = pts.map((p, i) => (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join('');
  const tgt = g.target ? `<line x1="${L}" x2="${W - Rr}" y1="${(y0 - g.target / mc * (H - T - B)).toFixed(1)}" y2="${(y0 - g.target / mc * (H - T - B)).toFixed(1)}" class="gtl"/><text x="${W - Rr}" y="${(y0 - g.target / mc * (H - T - B) - 4).toFixed(1)}" text-anchor="end" class="gtt">meta ${brl(g.target)}</text>` : '';
  const lab = months.map((m, i) => (n <= 12 || i % 2 === (n - 1) % 2) ? `<text x="${(L + i * cw + cw / 2).toFixed(1)}" y="${H - 8}" text-anchor="middle" class="gax">${ymLabel(m, 1)}</text>` : '').join('');
  return `<svg class="gsvg" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" role="img" aria-label="Gráfico de evolução da meta">
    <line x1="${L}" x2="${W - Rr}" y1="${y0}" y2="${y0}" class="gax0"/>${tgt}${bars}
    <path d="${line}" class="gline"/>${pts.map((p, i) => `<circle cx="${p[0].toFixed(1)}" cy="${p[1].toFixed(1)}" r="3.4" class="gdot"><title>${ymLabel(months[i])}: total ${brl(cum[i])}</title></circle>`).join('')}${lab}</svg>`;
}

/* ---------- animação da moeda caindo no cofrinho ---------- */
function pigCoinAnim(main, a) {
  const box = main.querySelector('.gbig'); if (!box) return;
  const svg = box.querySelector('.pigw');
  if (a.v > 0) {
    const n = Math.min(5, 1 + Math.floor(Math.log10(Math.max(1, a.v / 100)) * 1.5));
    for (let i = 0; i < n; i++) {
      const c = document.createElement('span'); c.className = 'gcoin'; c.style.animationDelay = (i * .14) + 's';
      c.innerHTML = '<svg viewBox="0 0 24 24" width="30" height="30"><circle cx="12" cy="12" r="10" fill="#F4C651" stroke="#B9862A" stroke-width="1.6"/><circle cx="12" cy="12" r="6.5" fill="none" stroke="#FFE59A" stroke-width="1.2"/><text x="12" y="15.6" text-anchor="middle" font-size="9" font-weight="800" fill="#9A6B12" font-family="system-ui">$</text></svg>';
      svg.appendChild(c); setTimeout(() => c.remove(), 1400 + i * 140);
    }
    setTimeout(() => { svg.classList.remove('bob'); svg.classList.add('gulp'); coinSound(n); }, 520);
    setTimeout(() => { svg.classList.remove('gulp'); svg.classList.add('bob'); }, 1100 + n * 140);
  } else { svg.classList.remove('bob'); svg.classList.add('shake'); setTimeout(() => { svg.classList.remove('shake'); svg.classList.add('bob'); }, 700); }
  const t = main.querySelector('.gtotal'); if (t) { const to = +t.dataset.count, from = to - a.v, t0 = performance.now(); const f = now => { const k = Math.min(1, (now - t0) / 900), e = 1 - Math.pow(1 - k, 3); t.textContent = brl(Math.round(from + (to - from) * e)); if (k < 1) requestAnimationFrame(f); }; requestAnimationFrame(f); }
  if (a.done) setTimeout(() => goalConfetti(box), 900);
}
function coinSound(n = 1) {
  if (!db.s.pomo || !db.s.pomo.sound) return;
  try { const c = actx(); for (let i = 0; i < Math.min(n, 3); i++) { const t = c.currentTime + i * .14; [1568, 2093].forEach((f, j) => { const o = c.createOscillator(), g = c.createGain(); o.type = 'triangle'; o.frequency.setValueAtTime(f, t + j * .07); g.gain.setValueAtTime(0, t + j * .07); g.gain.linearRampToValueAtTime(.07, t + j * .07 + .01); g.gain.exponentialRampToValueAtTime(.0001, t + j * .07 + .35); o.connect(g); g.connect(c.destination); o.start(t + j * .07); o.stop(t + j * .07 + .4); }); } } catch (e) {}
}
function goalConfetti(box) {
  for (let i = 0; i < 30; i++) { const c = document.createElement('i'); c.className = 'conf'; c.style.cssText = `--x:${(Math.random() * 2 - 1) * 200}px;--y:${-80 - Math.random() * 180}px;--r:${Math.random() * 720}deg;--d:${.8 + Math.random() * .6}s;background:${['#F4C651', 'var(--red)', '#3B7DD8', '#2E9E6B', '#F7A8B8'][i % 5]};left:50%;top:40%`; box.appendChild(c); setTimeout(() => c.remove(), 1600); }
}

/* ---------- formulários ---------- */
function skinGrid(cur, pct = .45) {
  return PIG_GROUPS.map(([gk, gn]) => `<span class="gskh">${gn}</span><div class="gskins">${Object.entries(PIGS).filter(([, P]) => P.g === gk).map(([k, P]) => `<label class="gskin"><input type="radio" name="skin" value="${k}" ${k === pigKey(cur) ? 'checked' : ''}><span>${pigSvg(k, pct >= 1 ? .9 : pct, 92)}<i>${esc(P.n)}</i></span></label>`).join('')}</div>`).join('');
}
function editGoal(g) {
  const isNew = !g;
  g = g || { id: uid(), name: '', target: 0, due: '', skin: Object.keys(PIGS)[goalsAll().length % 10], dep: [], c: Date.now() };
  const el = modal(`<h2>${isNew ? 'Nova meta' : 'Editar meta'}</h2><form class="gform">
    ${isNew ? `<div class="gideas">${GOAL_IDEAS.map(([e, n]) => `<button type="button" class="fchip" data-idea="${esc(n)}">${e} ${esc(n)}</button>`).join('')}</div>` : ''}
    <label class="lab">Nome da meta<input class="in" name="n" value="${esc(g.name)}" placeholder="Ex.: Viagem de férias, Reserva de emergência" maxlength="60" required autofocus></label>
    <div class="row"><label class="lab f1">Valor da meta (R$)<input class="in" name="t" inputmode="decimal" data-nocalc value="${g.target ? (g.target / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : ''}" placeholder="Ex.: 5.000,00"></label>
    <label class="lab f1">Prazo (opcional)<input class="in" type="date" name="d" value="${esc(g.due || '')}"></label></div>
    ${isNew ? `<label class="lab">Já tenho guardado (opcional)<input class="in" name="i" inputmode="decimal" data-nocalc placeholder="R$ 0,00"></label>` : ''}
    <span class="lab">Escolha o porquinho</span>${skinGrid(g.skin)}
    <div class="row end">${isNew ? '' : '<button type="button" class="btn ghost danger" data-del>Excluir</button><button type="button" class="btn ghost" data-arch>' + (g.arch ? 'Desarquivar' : 'Arquivar') + '</button><span class="sp"></span>'}<button type="button" class="btn ghost" data-x>Cancelar</button><button class="btn red">${isNew ? 'Criar porquinho' : 'Salvar'}</button></div>
  </form>`, { cls: 'wide' });
  const f = el.querySelector('form');
  el.querySelector('[data-x]').onclick = () => closeModal();
  el.querySelectorAll('[data-idea]').forEach(b => b.onclick = () => { f.n.value = b.dataset.idea; el.querySelectorAll('[data-idea]').forEach(x => x.classList.toggle('on', x === b)); f.t.focus(); });
  f.onsubmit = e => {
    e.preventDefault();
    const t = parseBRL(f.t.value);
    g.name = f.n.value.trim() || 'Meta'; g.target = isNaN(t) ? 0 : Math.max(0, t); g.due = f.d.value || null; g.skin = (f.querySelector('[name=skin]:checked') || {}).value || g.skin;
    if (isNew) { const i = f.i ? parseBRL(f.i.value) : NaN; if (i > 0) g.dep.push({ id: uid(), d: today(), at: Date.now(), v: i, note: 'Saldo inicial' }); g.o = Date.now(); }
    put('m', g); closeModal();
    if (isNew) go('goals/' + g.id);
  };
  const del = el.querySelector('[data-del]');
  if (del) del.onclick = async () => { closeModal(true); if (!await confirmBox('Excluir esta meta?', 'O porquinho e todo o histórico de depósitos serão apagados.')) return; const before = clone(g); g.del = Date.now(); put('m', g); go('goals'); toast('Meta excluída', 'Desfazer', () => { Object.assign(g, before); delete g.del; put('m', g); }); };
  const ar = el.querySelector('[data-arch]');
  if (ar) ar.onclick = () => { g.arch = !g.arch; put('m', g); closeModal(); toast(g.arch ? 'Meta arquivada' : 'Meta de volta'); };
}
function depositBox(g, out, dep) {
  const isEdit = !!dep;
  out = isEdit ? dep.v < 0 : !!out;
  const el = modal(`<h2>${isEdit ? 'Editar registro' : out ? 'Retirar do porquinho' : 'Guardar no porquinho'}</h2><form class="gdepf">
    <div class="gdephead">${pigSvg(g.skin, gPct(g), 76)}<span class="mut sm">${esc(g.name)}<br><b>${brl(gSaved(g))}</b> guardados</span></div>
    ${isEdit ? `<div class="seg gio"><button type="button" data-io="in" class="${out ? '' : 'on'}">Guardei</button><button type="button" data-io="out" class="${out ? 'on' : ''}">Retirei</button></div>` : ''}
    <label class="lab">Valor<input class="in gin" name="v" inputmode="decimal" data-nocalc placeholder="R$ 0,00" value="${isEdit ? (Math.abs(dep.v) / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : ''}" autocomplete="off" required></label>
    ${isEdit ? '' : `<div class="gquick">${[10, 20, 50, 100, 200, 500].map(v => `<button type="button" class="fchip" data-q="${v}">+${v}</button>`).join('')}</div>`}
    <div class="row"><label class="lab f1">Dia<input class="in" type="date" name="d" value="${esc(isEdit ? dep.d : today())}" max="${addD(today(), 0)}"></label>
    <label class="lab f1">Observação (opcional)<input class="in" name="o" value="${esc(isEdit ? dep.note || '' : '')}" maxlength="80" placeholder="${out ? 'Ex.: imprevisto' : 'Ex.: sobra do mês'}"></label></div>
    <div class="row end"><button type="button" class="btn ghost" data-x>Cancelar</button><button class="btn red">${isEdit ? 'Salvar' : out ? 'Retirar' : 'Guardar'}</button></div>
  </form>`);
  const f = el.querySelector('form'), vi = f.v;
  let io = out;
  el.querySelectorAll('[data-io]').forEach(b => b.onclick = () => { io = b.dataset.io === 'out'; el.querySelectorAll('[data-io]').forEach(x => x.classList.toggle('on', x === b)); });
  el.querySelectorAll('[data-q]').forEach(b => b.onclick = () => { const cur = parseBRL(vi.value) || 0; vi.value = ((cur + +b.dataset.q * 100) / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 }); vi.focus(); });
  el.querySelector('[data-x]').onclick = () => closeModal();
  setTimeout(() => vi.focus(), 60);
  f.onsubmit = e => {
    e.preventDefault();
    const v = parseBRL(vi.value); if (!(v > 0)) { vi.focus(); toast('Informe um valor'); return; }
    const sv = io ? -v : v, wasFull = gPct(g) >= 1;
    if (isEdit) { const before = clone(dep); Object.assign(dep, { v: sv, d: f.d.value || today(), note: f.o.value.trim() }); put('m', g); closeModal(); toast('Registro atualizado', 'Desfazer', () => { Object.assign(dep, before); put('m', g); }); return; }
    const x = { id: uid(), d: f.d.value || today(), at: Date.now(), v: sv, note: f.o.value.trim() };
    g.dep = (g.dep || []).concat([x]);
    GS.anim = { id: g.id, v: sv, done: !wasFull && gPct(g) >= 1 };
    put('m', g); closeModal();
    if (R.v !== 'goals' || R.id !== g.id) go('goals/' + g.id);
    toast(sv > 0 ? `${brl(sv)} no porquinho 🐷` : `${brl(-sv)} retirados`, 'Desfazer', () => { g.dep = g.dep.filter(y => y.id !== x.id); put('m', g); });
    if (GS.anim.done) setTimeout(() => toast('🎉 Meta alcançada! Parabéns!'), 1300);
  };
}
function realBox(g) {
  const el = modal(`<h2>Saldo real</h2><p class="mut">Quanto você tem de verdade (no banco, poupança ou carteira) separado para <b>${esc(g.name)}</b>?</p><form>
    <label class="lab">Valor real<input class="in" name="v" inputmode="decimal" data-nocalc placeholder="R$ 0,00" value="${g.real && g.real.v != null ? (g.real.v / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : ''}" required></label>
    <div class="row end">${g.real ? '<button type="button" class="btn ghost danger" data-clr>Limpar</button><span class="sp"></span>' : ''}<button type="button" class="btn ghost" data-x>Cancelar</button><button class="btn red">Salvar</button></div></form>`);
  const f = el.querySelector('form');
  el.querySelector('[data-x]').onclick = () => closeModal();
  const clr = el.querySelector('[data-clr]'); if (clr) clr.onclick = () => { g.real = null; put('m', g); closeModal(); };
  setTimeout(() => f.v.focus(), 60);
  f.onsubmit = e => { e.preventDefault(); const v = parseBRL(f.v.value); if (isNaN(v)) return; g.real = { v, d: today() }; put('m', g); closeModal(); };
}
function skinBox(g) {
  const el = modal(`<h2>Escolha o porquinho</h2>${skinGrid(g.skin, gPct(g))}<div class="row end"><button class="btn ghost" data-x>Fechar</button></div>`, { cls: 'wide' });
  el.querySelector('[data-x]').onclick = () => closeModal();
  el.querySelectorAll('[name=skin]').forEach(r => r.onchange = () => { g.skin = r.value; put('m', g); toast('Porquinho ' + PIGS[r.value].n); });
}
Object.assign(ACTS, {
  gnew: () => editGoal(),
  gedit: b => editGoal(get('m', b.dataset.id)),
  gskin: b => skinBox(get('m', b.dataset.id)),
  gdep: b => depositBox(get('m', b.dataset.id), !!b.dataset.out),
  gdepedit: b => { const g = get('m', b.dataset.id), d = g && (g.dep || []).find(x => x.id === b.dataset.d); if (d) depositBox(g, false, d); },
  gdepdel: b => { const g = get('m', b.dataset.id); if (!g) return; const i = (g.dep || []).findIndex(x => x.id === b.dataset.d); if (i < 0) return; const [x] = g.dep.splice(i, 1); put('m', g); toast('Registro excluído', 'Desfazer', () => { g.dep.splice(i, 0, x); put('m', g); }); },
  greal: b => realBox(get('m', b.dataset.id)),
  gfix: b => { const g = get('m', b.dataset.id); if (!g || !g.real) return; const d = g.real.v - gSaved(g); if (!d) return; const x = { id: uid(), d: today(), at: Date.now(), v: d, note: 'Ajuste com o saldo real' }; g.dep = (g.dep || []).concat([x]); GS.anim = { id: g.id, v: d }; put('m', g); toast('Porquinho ajustado ao saldo real', 'Desfazer', () => { g.dep = g.dep.filter(y => y.id !== x.id); put('m', g); }); },
  gtap: b => { const s = b.querySelector('.pigw'); if (!s) return; s.classList.remove('bob', 'shake'); void s.getBoundingClientRect(); s.classList.add('shake'); coinSound(1); setTimeout(() => { s.classList.remove('shake'); s.classList.add('bob'); }, 650); },
});
