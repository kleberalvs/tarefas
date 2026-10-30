/* Metas e porquinhos: cada meta é um cofrinho (valores fictícios que espelham o que você guardou de verdade).
   Registro: kind 'm' → { id, name, target (centavos), due (aaaa-mm-dd, opcional), skin, dep: [{ id, d, at, v, note }], real: { v, at }, arch, c, u }
   v positivo = guardou; negativo = retirou. Tudo sincroniza junto com as tarefas. */
'use strict';
const PIGS = {
  rosa: { n: 'Clássico', b: '#F7A8B8', s: '#E07C95', sn: '#F2879F', e: '#E7738D' },
  ouro: { n: 'Dourado', b: '#F4C651', s: '#C9952A', sn: '#E9B13A', e: '#D9A030', pat: 'spark', acc: 'crown' },
  porcelana: { n: 'Porcelana', b: '#F6F8FC', s: '#C5D3E8', sn: '#DCE6F4', e: '#C9D6EA', pat: 'flower', ink: '#2F5DA8' },
  menta: { n: 'Menta', b: '#A6E3CD', s: '#6FBFA4', sn: '#8BD4BB', e: '#7CC7AE', pat: 'dots', acc: 'bow' },
  noite: { n: 'Noite estrelada', b: '#363C74', s: '#22264E', sn: '#4D5496', e: '#2B3062', pat: 'stars', eye: '#F7E08A' },
  melancia: { n: 'Melancia', b: '#F36C6C', s: '#C94848', sn: '#F58C8C', e: '#5DAA4A', pat: 'melon' },
  vaca: { n: 'Vaquinha', b: '#FFFFFF', s: '#D8D8DE', sn: '#F6B6C2', e: '#2B2B2B', pat: 'spots' },
  robo: { n: 'Robô', b: '#BAC4CF', s: '#8493A3', sn: '#9DA9B6', e: '#7C8B9B', pat: 'robot', eye: '#3FD3FF' },
  vidro: { n: 'Vidro', b: 'rgba(210,235,255,.28)', s: 'rgba(120,170,215,.55)', sn: 'rgba(200,228,255,.6)', e: 'rgba(160,200,235,.7)', glass: 1 },
  cafe: { n: 'Café', b: '#B9845A', s: '#8A5A36', sn: '#D0A27B', e: '#93633F', pat: 'heart', acc: 'flower' },
};
const pigKey = k => PIGS[k] ? k : 'rosa';
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
let PIG_N = 0;
function pigSvg(skin, pct = 0, size = 120, opts = {}) {
  const P = PIGS[pigKey(skin)], id = 'pg' + (++PIG_N), lvl = Math.max(0, Math.min(1, pct));
  const body = 'M22 56c0-19 17-33 39-33 13 0 23 4 30 11 4-1 8 0 10 3 6 3 10 9 10 17 0 9-5 16-12 19-3 9-12 16-25 18H43C30 89 22 74 22 56z';
  const top = 86 - lvl * 63;
  let pat = '';
  if (P.pat === 'dots') pat = [[38, 44], [52, 36], [66, 42], [44, 62], [60, 58], [76, 66], [34, 72], [56, 78], [86, 50]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="3.2" fill="#fff" opacity=".85"/>`).join('');
  if (P.pat === 'stars') pat = [[36, 46, 3], [58, 38, 2.2], [72, 56, 3.4], [46, 66, 2.4], [84, 44, 2], [30, 64, 1.6], [62, 76, 2]].map(([x, y, r]) => `<path d="M${x} ${y - r * 1.6}l${r * .45} ${r * 1.1} ${r * 1.15} ${r * .1}-${r * .9} ${r * .75} ${r * .3} ${r * 1.15}-${r} -${r * .62}-${r} ${r * .62} ${r * .3}-${r * 1.15}-${r * .9}-${r * .75} ${r * 1.15}-${r * .1}z" fill="#F7E08A"/>`).join('') + '<circle cx="50" cy="50" r="1" fill="#fff"/><circle cx="78" cy="70" r="1" fill="#fff"/><circle cx="40" cy="78" r=".9" fill="#fff"/>';
  if (P.pat === 'spark') pat = [[40, 40], [70, 62], [52, 74]].map(([x, y]) => `<path d="M${x} ${y - 5}q1 4 5 5q-4 1-5 5q-1-4-5-5q4-1 5-5z" fill="#fff" opacity=".8"/>`).join('');
  if (P.pat === 'flower') pat = [[40, 50], [66, 66], [56, 38], [80, 46], [36, 74]].map(([x, y], i) => `<g transform="translate(${x} ${y}) scale(${i % 2 ? .8 : 1})">${[0, 72, 144, 216, 288].map(a => `<ellipse cx="0" cy="-4" rx="2.4" ry="3.6" fill="${P.ink}" opacity=".85" transform="rotate(${a})"/>`).join('')}<circle r="1.8" fill="#fff"/></g>`).join('') + `<path d="M28 60q8-6 14 2M70 78q8-8 16-2" stroke="${P.ink}" stroke-width="1.4" fill="none" opacity=".6"/>`;
  if (P.pat === 'melon') pat = `<path d="M18 74q40 22 96 0v20H18z" fill="#5DAA4A"/><path d="M18 71q40 22 96 0" stroke="#C9F0A5" stroke-width="3" fill="none"/>` + [[40, 46], [54, 40], [68, 48], [46, 60], [62, 62], [78, 56], [86, 42]].map(([x, y]) => `<ellipse cx="${x}" cy="${y}" rx="1.5" ry="2.6" fill="#2B1B1B" transform="rotate(20 ${x} ${y})"/>`).join('');
  if (P.pat === 'spots') pat = '<path d="M30 46c4-8 16-9 18-1s-6 12-12 11-9-4-6-10z" fill="#2B2B2B"/><path d="M60 60c6-5 16-2 15 6s-12 10-16 5-3-7 1-11z" fill="#2B2B2B"/><path d="M76 34c5-1 9 3 7 7s-8 3-9 0 0-6 2-7z" fill="#2B2B2B"/><circle cx="44" cy="76" r="4" fill="#2B2B2B"/>';
  if (P.pat === 'robot') pat = '<path d="M30 56h60M58 26v62" stroke="#7B8896" stroke-width="1.2" fill="none" opacity=".7"/>' + [[34, 50], [34, 62], [82, 50], [82, 62], [52, 32], [64, 32]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="1.6" fill="#6E7B89"/>`).join('') + '<rect x="40" y="64" width="14" height="8" rx="2" fill="#7FE3A0" opacity=".85"/><rect x="43" y="66" width="2" height="4" fill="#2F7A4A"/><rect x="47" y="66" width="2" height="4" fill="#2F7A4A"/>';
  if (P.pat === 'heart') pat = '<path d="M52 52c-5-6-14-2-11 5 2 5 11 10 11 10s9-5 11-10c3-7-6-11-11-5z" fill="#F4D6C0" opacity=".9"/>' + [[36, 70], [74, 70], [80, 42]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="2" fill="#E9C9A8" opacity=".7"/>`).join('');
  const coins = P.glass && lvl > 0 ? (() => { let h = ''; const rows = Math.ceil(lvl * 9); for (let r = 0; r < rows; r++) for (let c = 0; c < 7; c++) { const x = 30 + c * 11 + (r % 2) * 5, y = 84 - r * 6.6; h += `<ellipse cx="${x}" cy="${y}" rx="5.4" ry="3.2" fill="#F2C14E" stroke="#B9862A" stroke-width=".8"/>`; } return h; })() : '';
  const fill = !P.glass && lvl > 0 && lvl < 1 ? `<rect x="0" y="${top}" width="140" height="${100 - top}" fill="url(#${id}f)" opacity=".34"/><path d="M0 ${top}q12-3 24 0t24 0 24 0 24 0 24 0 24 0" stroke="#FFE7A0" stroke-width="1.6" fill="none" opacity=".9"/>` : '';
  const eye = P.eye || '#2A1A1F';
  const acc = P.acc === 'crown' ? '<path d="M70 18l4 7 5-9 5 9 4-7 1 12H69z" fill="#F7D461" stroke="#B9862A" stroke-width="1.2" stroke-linejoin="round"/><circle cx="79" cy="16" r="1.6" fill="#E9534B"/>'
    : P.acc === 'bow' ? '<path d="M66 26l-8-6v12zM66 26l8-6v12z" fill="#F07CA0" stroke="#C9507A" stroke-width="1"/><circle cx="66" cy="26" r="2.4" fill="#C9507A"/>'
      : P.acc === 'flower' ? `<g transform="translate(70 24)">${[0, 72, 144, 216, 288].map(a => `<ellipse cx="0" cy="-3.6" rx="2.6" ry="3.4" fill="#FFF4E8" transform="rotate(${a})"/>`).join('')}<circle r="2" fill="#F2B84B"/></g>` : '';
  const full = pct >= 1 ? '<g class="pigspark"><path d="M14 30l2 5 5 2-5 2-2 5-2-5-5-2 5-2z" fill="#F7D461"/><path d="M110 18l1.5 4 4 1.5-4 1.5-1.5 4-1.5-4-4-1.5 4-1.5z" fill="#F7D461"/></g>' : '';
  return `<svg class="pig${opts.cls ? ' ' + opts.cls : ''}" viewBox="0 0 130 100" width="${size}" height="${Math.round(size * 100 / 130)}" aria-hidden="true">
    <defs><radialGradient id="${id}g" cx=".35" cy=".3" r=".8"><stop offset="0" stop-color="#fff" stop-opacity="${P.glass ? .5 : .35}"/><stop offset=".45" stop-color="${P.b}" stop-opacity="0"/><stop offset="1" stop-color="${P.s}" stop-opacity="${P.glass ? .5 : .55}"/></radialGradient>
    <linearGradient id="${id}f" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFD866"/><stop offset="1" stop-color="#E9A21F"/></linearGradient>
    <clipPath id="${id}c"><path d="${body}"/></clipPath></defs>
    <ellipse cx="66" cy="94" rx="40" ry="4.5" fill="#000" opacity=".12"/>
    <path d="M24 54c-6-1-10 2-9 6s6 4 6 0-4-4-6-1" stroke="${P.s}" stroke-width="2.6" fill="none" stroke-linecap="round"/>
    <rect x="32" y="76" width="11" height="17" rx="4.5" fill="${P.s}"/><rect x="78" y="76" width="11" height="17" rx="4.5" fill="${P.s}"/>
    <path d="M78 29l4-14 12 11z" fill="${P.s}"/>
    <path d="${body}" fill="${P.b}" ${P.glass ? `stroke="${P.s}" stroke-width="1.6"` : ''}/>
    <g clip-path="url(#${id}c)">${coins}${pat}${fill}<path d="${body}" fill="url(#${id}g)"/></g>
    <rect x="42" y="78" width="11" height="15" rx="4.5" fill="${P.b}" ${P.glass ? `stroke="${P.s}" stroke-width="1.2"` : ''}/><rect x="88" y="78" width="11" height="15" rx="4.5" fill="${P.b}" ${P.glass ? `stroke="${P.s}" stroke-width="1.2"` : ''}/>
    <path d="M84 30l5-15 11 13c-5 1-11 2-16 2z" fill="${P.e}"/><path d="M87 27l3-8 6 7z" fill="${P.sn}" opacity=".8"/>
    <ellipse cx="110" cy="57" rx="9.5" ry="11" fill="${P.sn}" stroke="${P.s}" stroke-width="1.2"/>
    <ellipse cx="107.5" cy="54" rx="1.6" ry="2.6" fill="${P.s}"/><ellipse cx="113" cy="54" rx="1.6" ry="2.6" fill="${P.s}"/>
    <g class="pigeye"><ellipse cx="93" cy="45" rx="3.3" ry="${opts.happy ? 1 : 3.8}" fill="${eye}"/>${opts.happy ? '' : '<circle cx="94.2" cy="43.4" r="1.2" fill="#fff"/>'}</g>
    <ellipse cx="96" cy="58" rx="5" ry="3" fill="#FF6F8E" opacity="${P.glass ? .25 : .35}"/>
    <path d="M100 66q4 3 8 1" stroke="${P.s}" stroke-width="1.4" fill="none" stroke-linecap="round"/>
    <rect x="52" y="23.5" width="20" height="4.6" rx="2.3" fill="#2A1A1F" opacity=".7" transform="rotate(-3 62 26)"/>
    <path d="M30 44q8-14 24-17" stroke="#fff" stroke-width="3" fill="none" stroke-linecap="round" opacity="${P.glass ? .7 : .35}"/>
    ${acc}${full}
  </svg>`;
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
    ${!gs.length ? `<div class="empty gempty">${pigSvg('rosa', .35, 170, { cls: 'bob' })}<p><b>Crie seu primeiro porquinho</b></p><p class="mut">Defina uma meta (uma viagem, uma reserva, um presente) e registre cada valor que você guardar de verdade. O app acompanha o total, os meses e quanto falta.</p><button class="btn red" data-act="gnew">${ic('plus', 16)}Nova meta</button></div>` : ''}
    ${arch.length ? `<details class="harch"><summary>Arquivadas e concluídas (${arch.length})</summary><div class="ggrid sm">${arch.map(goalCard).join('')}</div></details>` : ''}
  </div></div>`;
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
  const svg = box.querySelector('svg');
  if (a.v > 0) {
    const n = Math.min(5, 1 + Math.floor(Math.log10(Math.max(1, a.v / 100)) * 1.5));
    for (let i = 0; i < n; i++) {
      const c = document.createElement('span'); c.className = 'gcoin'; c.style.animationDelay = (i * .14) + 's';
      c.innerHTML = '<svg viewBox="0 0 24 24" width="30" height="30"><circle cx="12" cy="12" r="10" fill="#F4C651" stroke="#B9862A" stroke-width="1.6"/><circle cx="12" cy="12" r="6.5" fill="none" stroke="#FFE59A" stroke-width="1.2"/><text x="12" y="15.6" text-anchor="middle" font-size="9" font-weight="800" fill="#9A6B12" font-family="system-ui">$</text></svg>';
      box.appendChild(c); setTimeout(() => c.remove(), 1400 + i * 140);
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
  return `<div class="gskins">${Object.entries(PIGS).map(([k, P]) => `<label class="gskin"><input type="radio" name="skin" value="${k}" ${k === pigKey(cur) ? 'checked' : ''}><span>${pigSvg(k, pct, 92)}<i>${esc(P.n)}</i></span></label>`).join('')}</div>`;
}
function editGoal(g) {
  const isNew = !g;
  g = g || { id: uid(), name: '', target: 0, due: '', skin: Object.keys(PIGS)[goalsAll().length % 6], dep: [], c: Date.now() };
  const el = modal(`<h2>${isNew ? 'Nova meta' : 'Editar meta'}</h2><form class="gform">
    <label class="lab">Nome da meta<input class="in" name="n" value="${esc(g.name)}" placeholder="Ex.: Viagem de férias, Reserva de emergência" maxlength="60" required autofocus></label>
    <div class="row"><label class="lab f1">Valor da meta (R$)<input class="in" name="t" inputmode="decimal" data-nocalc value="${g.target ? (g.target / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : ''}" placeholder="Ex.: 5.000,00"></label>
    <label class="lab f1">Prazo (opcional)<input class="in" type="date" name="d" value="${esc(g.due || '')}"></label></div>
    ${isNew ? `<label class="lab">Já tenho guardado (opcional)<input class="in" name="i" inputmode="decimal" data-nocalc placeholder="R$ 0,00"></label>` : ''}
    <span class="lab">Escolha o porquinho</span>${skinGrid(g.skin)}
    <div class="row end">${isNew ? '' : '<button type="button" class="btn ghost danger" data-del>Excluir</button><button type="button" class="btn ghost" data-arch>' + (g.arch ? 'Desarquivar' : 'Arquivar') + '</button><span class="sp"></span>'}<button type="button" class="btn ghost" data-x>Cancelar</button><button class="btn red">${isNew ? 'Criar porquinho' : 'Salvar'}</button></div>
  </form>`, { cls: 'wide' });
  const f = el.querySelector('form');
  el.querySelector('[data-x]').onclick = () => closeModal();
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
  gtap: b => { const s = b.querySelector('svg'); if (!s) return; s.classList.remove('bob', 'shake'); void s.getBoundingClientRect(); s.classList.add('shake'); coinSound(1); setTimeout(() => { s.classList.remove('shake'); s.classList.add('bob'); }, 650); },
});
