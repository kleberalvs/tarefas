/* Foco (Pomodoro e cronômetro) com estatísticas, e Hábitos com sequências e calendário. */
'use strict';
/* ---------- foco ---------- */
let FS = { mode: 'focus', run: false, end: 0, left: null, start: 0, task: null, n: 0, began: 0 };
try { Object.assign(FS, JSON.parse(localStorage.getItem('tt_focus') || '{}')); } catch (e) {}
const saveFS = () => { try { localStorage.setItem('tt_focus', JSON.stringify(FS)); } catch (e) {} };
const FMODES = { focus: 'Foco', short: 'Pausa curta', long: 'Pausa longa', watch: 'Cronômetro' };
const fTotal = () => modeLen(FS.mode) + (FS.extra || 0);
const modeLen = m => (m === 'focus' ? db.s.pomo.focus : m === 'short' ? db.s.pomo.short : m === 'long' ? db.s.pomo.long : 0) * 60;
function fLeft() {
  if (FS.mode === 'watch') return FS.run ? Math.floor((Date.now() - FS.start) / 1000) : (FS.left || 0);
  if (FS.run) return Math.max(0, Math.round((FS.end - Date.now()) / 1000));
  return FS.left != null ? FS.left : modeLen(FS.mode);
}
const mmss = s => (s >= 3600 ? Math.floor(s / 3600) + ':' + pad(Math.floor(s % 3600 / 60)) : pad(Math.floor(s / 60))) + ':' + pad(s % 60);
function fStart() {
  if (FS.run) return;
  if (FS.mode === 'watch') { FS.start = Date.now() - (FS.left || 0) * 1000; }
  else FS.end = Date.now() + fLeft() * 1000;
  if (!FS.began) FS.began = Date.now();
  FS.run = true; saveFS(); askNotify(); syncTimer(); ambientFollow(); render(true);
}
function fPause() { if (!FS.run) return; FS.left = fLeft(); FS.run = false; saveFS(); syncTimer(); ambientFollow(); render(true); }
function fStop(log) {
  if (log && FS.began) {
    const secs = FS.mode === 'watch' ? fLeft() : fTotal() - fLeft();
    if ((FS.mode === 'focus' || FS.mode === 'watch') && secs >= 60) { put('p', Object.assign({ id: uid(), start: FS.began, end: Date.now(), dur: Math.round(secs / 60), task: FS.task, type: FS.mode }, FS.mode === 'focus' && fLeft() > 0 ? { ab: 1 } : {})); setTimeout(() => typeof fxAfterSession === 'function' && fxAfterSession(), 400); }
  }
  FS.run = false; FS.left = null; FS.began = 0; FS.start = 0; FS.extra = 0; saveFS(); syncTimer(); ambientFollow(); render(true);
}
function fSet(m) { if (FS.run && !confirm('Interromper a sessão atual?')) return; if (FS.run || FS.began) fStop(true); FS.mode = m; FS.left = null; saveFS(); render(true); }
function fFinish() {
  const was = FS.mode;
  if (was === 'focus') { put('p', { id: uid(), start: FS.began || Date.now() - fTotal() * 1000, end: Date.now(), dur: Math.round(fTotal() / 60), task: FS.task, type: 'focus' }); FS.n = (FS.n || 0) + 1; setTimeout(() => typeof fxAfterSession === 'function' && fxAfterSession(), 600); }
  const next = was === 'focus' ? (FS.n % (db.s.pomo.every || 4) === 0 ? 'long' : 'short') : 'focus';
  notify(was === 'focus' ? 'Sessão de foco concluída' : 'Pausa encerrada', was === 'focus' ? 'Hora de uma ' + FMODES[next].toLowerCase() + '.' : 'Vamos voltar ao foco?');
  playAlarm();
  FS.mode = next; FS.run = false; FS.left = null; FS.began = 0; FS.extra = 0; saveFS(); syncTimer();
  if (db.s.pomo.auto) fStart(); else { ambientFollow(); render(true); }
}
function startFocusOn(id) { if (FS.run) fStop(true); FS.task = id; FS.mode = 'focus'; FS.left = null; saveFS(); go('focus'); setTimeout(fStart, 50); }
function beep(n = 1) {
  if (!db.s.pomo.sound) return;
  try { const a = new (window.AudioContext || window.webkitAudioContext)(); for (let i = 0; i < n; i++) { const o = a.createOscillator(), g = a.createGain(), t = a.currentTime + i * .32; o.frequency.value = 784; g.gain.setValueAtTime(.08, t); g.gain.exponentialRampToValueAtTime(.0001, t + .28); o.connect(g); g.connect(a.destination); o.start(t); o.stop(t + .3); } } catch (e) {}
}
setInterval(() => {
  if (!FS.run) return;
  const s = fLeft();
  if (FS.mode !== 'watch' && s <= 0) { fFinish(); return; }
  const t = $('#ftime'); if (t) t.textContent = mmss(s);
  const ring = $('#fring'); if (ring && FS.mode !== 'watch') ring.style.strokeDashoffset = (2 * Math.PI * 118 * (1 - s / fTotal())).toFixed(1);
  const mini = $('#fmini'); if (mini) mini.textContent = mmss(s);
  fExtPaint(s);
  document.title = mmss(s) + ' · ' + FMODES[FS.mode];
}, 1000);
function focusStats() {
  const T = today(), ps = db.p;
  const by = d => ps.filter(p => ymd(new Date(p.start)) === d);
  const todayP = by(T);
  const week = [...Array(7)].map((_, i) => { const d = addD(T, i - 6); return { d, m: by(d).reduce((s, p) => s + (p.dur || 0), 0) }; });
  const total = ps.reduce((s, p) => s + (p.dur || 0), 0);
  const perTask = {};
  ps.forEach(p => { if (p.task) perTask[p.task] = (perTask[p.task] || 0) + (p.dur || 0); });
  return { todayN: todayP.filter(p => p.type === 'focus').length, todayM: todayP.reduce((s, p) => s + (p.dur || 0), 0), week, total, count: ps.length, perTask };
}
VIEWS.focus = main => {
  const s = fLeft(), len = fTotal(), C = 2 * Math.PI * 118;
  const t = FS.task && get('t', FS.task);
  const st = focusStats(), wmax = Math.max(30, ...st.week.map(w => w.m));
  const recent = db.p.slice().sort((a, b) => b.start - a.start).slice(0, 12);
  const top = Object.entries(st.perTask).sort((a, b) => b[1] - a[1]).slice(0, 6);
  main.innerHTML = headHtml('Foco', '', `<button class="ib" data-act="fset" aria-label="Ajustes do Pomodoro">${ic('gear')}</button>`) + `<div class="scroll"><div class="focus">
    <div class="fcard">
      <div class="seg">${Object.entries(FMODES).map(([k, n]) => `<button class="${FS.mode === k ? 'on' : ''}" data-act="fmode" data-m="${k}">${n}</button>`).join('')}</div>
      <div class="fxpick" role="radiogroup" aria-label="Animação do foco">${FX_ANIMS.map(([k, e, n]) => `<button class="${fxAnim() === k ? 'on' : ''}" data-act="fxanim" data-k="${k}" role="radio" aria-checked="${fxAnim() === k}"><span>${e}</span>${n}</button>`).join('')}</div>
      ${fxAnim() !== 'ring' ? fxSceneHtml().replace(/<\/div>$/, `<div class="fxtime"><span id="ftime" role="timer" aria-live="off">${mmss(s)}</span><small>${FS.run ? (FS.mode === 'focus' || FS.mode === 'watch' ? (fxAnim() === 'forest' ? 'Sua árvore está crescendo' : fxAnim() === 'room' ? 'Trabalhando' : 'Focando') : 'Descansando') : FS.began ? 'Pausado' : 'Pronto'}</small>${FS.mode === 'watch' ? '' : `<div class="fxbar"><i id="fxbar" style="width:${Math.round(fxFrac() * 100)}%"></i></div>`}</div></div>`) : `<div class="fring m-${FS.mode}">
        <svg viewBox="0 0 260 260" aria-hidden="true"><circle cx="130" cy="130" r="118" class="rbg"/>${FS.mode === 'watch' ? '' : `<circle id="fring" cx="130" cy="130" r="118" class="rfg" stroke-dasharray="${C.toFixed(1)}" style="stroke-dashoffset:${(C * (1 - s / len)).toFixed(1)}" transform="rotate(-90 130 130)"/>`}</svg>
        <div class="fin"><span id="ftime" role="timer" aria-live="off">${mmss(s)}</span><span class="mut">${FS.run ? (FS.mode === 'focus' || FS.mode === 'watch' ? 'Focando' : 'Descansando') : 'Pronto'}</span></div>
      </div>`}
      <button class="ftask" data-act="fpick">${t ? `<span class="chk sm p${t.prio || 0}"><span>${ic('check', 10)}</span></span><span>${esc(t.title)}</span>` : `${ic('todo', 18)}<span class="mut">Escolher tarefa para focar</span>`}${ic('chevd', 14)}</button>
      ${fDurHtml()}
      <div class="fbtns">
        ${FS.run ? `<button class="btn big ghost" data-act="fpause">${ic('pause', 20)}Pausar</button>` : `<button class="btn big red" data-act="fstart">${ic('play', 20)}${FS.began ? 'Continuar' : 'Iniciar'}</button>`}
        ${FS.began ? `<button class="btn big ghost" data-act="fstop">${ic('stop', 18)}${FS.mode === 'watch' ? 'Encerrar' : 'Parar'}</button>` : ''}
        ${FS.mode !== 'watch' && !FS.run ? `<button class="ib" data-act="fskip" aria-label="Pular para a próxima etapa">${ic('right')}</button>` : ''}
        ${t && !t.done ? `<button class="btn big ghost" data-act="fdone">${ic('check', 18)}Concluir tarefa</button>` : ''}
      </div>
      ${fxAnim() === 'cats' ? `<button class="link fxdeco" data-act="fxdecor">🛋️ Decorar a casa dos gatinhos</button>` : fxAnim() === 'room' ? `<button class="link fxdeco" data-act="rmcustom">🎨 Personalizar o quartinho</button>` : fxAnim() === 'forest' ? `<p class="hint fxhint">Cada sessão planta uma árvore: curtas viram arbustos, 45 min+ viram árvores grandes e 90 min+ um ipê florido. Desistir no meio deixa uma árvore seca.</p>` : ''}
    </div>
    <div class="fstats">
      <div class="stat"><b>${st.todayN}</b><span>pomodoros hoje</span></div>
      <div class="stat"><b>${fmtDur(st.todayM)}</b><span>de foco hoje</span></div>
      <div class="stat"><b>${fmtDur(st.total)}</b><span>no total</span></div>
    </div>
    <section class="fsec"><h3>Últimos 7 dias</h3><div class="bars">${st.week.map(w => `<div class="bar"><span class="bv" style="height:${Math.round(w.m / wmax * 100)}%" title="${fmtDur(w.m)}"></span><span class="bl">${wdShort[pd(w.d).getDay()]}</span><span class="bn">${w.m ? fmtDur(w.m) : ''}</span></div>`).join('')}</div></section>
    <section class="fsec sounds"><h3>${ic('music', 18)}Som ambiente</h3>
      <div class="ambs">${AMBIENTS.map(a => `<button class="amb${(db.s.pomo.amb || 'none') === a.k ? ' on' : ''}" data-act="famb" data-k="${a.k}"><span>${a.e}</span>${a.n}</button>`).join('')}</div>
      <div class="srow"><span>Volume</span><input type="range" min="0" max="100" value="${db.s.pomo.vol ?? 60}" data-fvol aria-label="Volume" class="vol"></div>
      <label class="srow"><span>Tocar só durante as sessões de foco</span><span class="sw-t"><input type="checkbox" data-fonly ${db.s.pomo.ambOnly !== false ? 'checked' : ''}><span></span></span></label>
      <div class="srow"><span>${AMB_PREVIEW ? 'Tocando agora' : 'Ouvir o som escolhido agora'}</span><button class="btn ghost sm" data-act="fprev">${AMB_PREVIEW ? ic('pause', 16) + 'Parar' : ic('play', 16) + 'Ouvir'}</button></div>
      <div class="srow"><span>Som do alarme</span><span class="row"><select class="in sm" data-falarm>${ALARMS.map(a => `<option value="${a.k}" ${(db.s.pomo.alarm || 'bell') === a.k ? 'selected' : ''}>${a.n}</option>`).join('')}</select><button class="ib" data-act="falarm" aria-label="Ouvir alarme">${ic('play', 16)}</button></span></div>
    </section>
    ${top.length ? `<section class="fsec"><h3>Tarefas com mais foco</h3>${top.map(([id, m]) => { const x = get('t', id); return x ? `<button class="frow" data-act="topen" data-id="${id}"><span>${esc(x.title)}</span><b>${fmtDur(m)}</b></button>` : ''; }).join('')}</section>` : ''}
    ${recent.length ? `<section class="fsec"><h3>Sessões recentes</h3>${recent.map(p => { const x = p.task && get('t', p.task); return `<div class="frow"><span>${esc(fmtDay(ymd(new Date(p.start))))} ${hm(new Date(p.start))} · ${esc(x ? x.title : FMODES[p.type] || 'Foco')}</span><b>${fmtDur(p.dur)}</b></div>`; }).join('')}<button class="link" data-act="fexport">Exportar sessões (CSV)</button></section>` : ''}
  </div></div>`;
  bindFocusSounds(main);
  if (fxAnim() !== 'ring') fxStart();
  if (!houseCfg().seen) fxAfterSession();
};
function bindFocusSounds(main) {
  const v = main.querySelector('[data-fvol]'); if (v) v.oninput = () => { setVolume(+v.value); saveVol(); };
  const o = main.querySelector('[data-fonly]'); if (o) o.onchange = () => { db.s.pomo.ambOnly = o.checked; put('s', db.s); ambientFollow(); };
  const a = main.querySelector('[data-falarm]'); if (a) a.onchange = () => { db.s.pomo.alarm = a.value; put('s', db.s); playAlarm(a.value); };
}
const saveVol = debounce(() => put('s', db.s), 500);
Object.assign(ACTS, {
  famb: b => { db.s.pomo.amb = b.dataset.k; put('s', db.s); if (b.dataset.k !== 'none' && !FS.run) AMB_PREVIEW = true; if (b.dataset.k === 'none') AMB_PREVIEW = false; SND.cur = '__'; ambientFollow(); },
  fprev: () => { AMB_PREVIEW = !AMB_PREVIEW; if (AMB_PREVIEW && (db.s.pomo.amb || 'none') === 'none') { db.s.pomo.amb = 'rain'; put('s', db.s); } SND.cur = AMB_PREVIEW ? '__' : SND.cur; ambientFollow(); render(true); },
  falarm: () => playAlarm(db.s.pomo.alarm || 'bell'),
  fmode: b => fSet(b.dataset.m),
  fstart: fStart, fpause: fPause,
  fstop: () => fStop(true),
  fskip: () => { if (FS.mode === 'focus') { FS.n = (FS.n || 0) + 1; FS.mode = FS.n % (db.s.pomo.every || 4) === 0 ? 'long' : 'short'; } else FS.mode = 'focus'; FS.left = null; FS.began = 0; saveFS(); render(true); },
  fpick: () => pickItem('t', db.t.filter(t => t.done || t.del).map(t => t.id), id => { FS.task = id; saveFS(); render(true); }),
  fdone: () => { const t = get('t', FS.task); if (t) { checkTask(t.id); fStop(true); } },
  fset: () => {
    const p = db.s.pomo;
    const el = modal(`<h2>Ajustes do Pomodoro</h2><form class="fsets">
      <label class="lab">Foco (minutos)<input class="in" type="number" min="1" max="180" name="focus" value="${p.focus}"></label>
      <label class="lab">Pausa curta<input class="in" type="number" min="1" max="60" name="short" value="${p.short}"></label>
      <label class="lab">Pausa longa<input class="in" type="number" min="1" max="90" name="long" value="${p.long}"></label>
      <label class="lab">Pausa longa a cada<input class="in" type="number" min="2" max="10" name="every" value="${p.every}"></label>
      <label class="chkl"><input type="checkbox" name="auto" ${p.auto ? 'checked' : ''}> Iniciar a próxima etapa automaticamente</label>
      <label class="chkl"><input type="checkbox" name="sound" ${p.sound ? 'checked' : ''}> Sons</label>
      <div class="row end"><button type="button" class="btn ghost" data-x>Cancelar</button><button class="btn red">Salvar</button></div></form>`);
    el.querySelector('[data-x]').onclick = closeModal;
    el.querySelector('form').onsubmit = e => { e.preventDefault(); const f = e.target; ['focus', 'short', 'long', 'every'].forEach(k => p[k] = clamp(+f[k].value || p[k], 1, 180)); p.auto = f.auto.checked; p.sound = f.sound.checked; put('s', db.s); closeModal(); };
  },
  fexport: () => { const rows = [['Início', 'Fim', 'Minutos', 'Tipo', 'Tarefa']].concat(db.p.slice().sort((a, b) => a.start - b.start).map(p => [new Date(p.start).toLocaleString('pt-BR'), new Date(p.end).toLocaleString('pt-BR'), p.dur, FMODES[p.type] || p.type, p.task && get('t', p.task) ? get('t', p.task).title : ''])); download('sessoes-de-foco.csv', '﻿' + toCsv(rows), 'text/csv'); },
});

/* ---------- hábitos ---------- */
const HS = { day: today(), month: today().slice(0, 7) };
const hDue = (h, d) => !h.freq || h.freq.t === 'daily' || h.freq.t === 'times' ? true : (h.freq.wd || []).includes(pd(d).getDay());
const hVal = (h, d) => (h.log || {})[d] || 0;
const hDone = (h, d) => hVal(h, d) >= (h.goal || 1);
function hStreak(h) {
  if (h.freq && h.freq.t === 'times') {
    let w = sow(today()), n = 0;
    const weekOk = ws => [...Array(7)].reduce((s, _, i) => s + (hDone(h, addD(ws, i)) ? 1 : 0), 0) >= (h.freq.n || 1);
    if (!weekOk(w)) w = addD(w, -7);
    for (let k = 0; k < 520 && weekOk(w); k++) { n++; w = addD(w, -7); }
    return { cur: n, unit: n === 1 ? 'semana' : 'semanas' };
  }
  let d = today(), n = 0;
  if (!hDone(h, d)) d = addD(d, -1);
  for (let k = 0; k < 3650; k++) { if (hDue(h, d)) { if (hDone(h, d)) n++; else break; } d = addD(d, -1); if (h.c && ymd(new Date(h.c)) > d) break; }
  return { cur: n, unit: n === 1 ? 'dia' : 'dias' };
}
function hBest(h) {
  const days = Object.keys(h.log || {}).filter(d => hDone(h, d)).sort();
  if (!days.length) return 0;
  let best = 0, cur = 0, prev = null;
  let d = days[0]; const end = today();
  for (let k = 0; d <= end && k < 3650; k++, d = addD(d, 1)) { if (!hDue(h, d)) continue; if (hDone(h, d)) { cur++; best = Math.max(best, cur); } else if (d !== end) cur = 0; }
  return best;
}
function freqText(h) { const f = h.freq || { t: 'daily' }; return f.t === 'daily' ? 'Todo dia' : f.t === 'times' ? `${f.n || 1}x por semana` : (f.wd || []).map(w => wdShort[w]).join(', '); }
VIEWS.habits = main => {
  const hs = db.h.filter(h => !h.arch).sort((a, b) => (a.o || 0) - (b.o || 0));
  const ws = sow(HS.day), days = [...Array(7)].map((_, i) => addD(ws, i));
  const dueToday = hs.filter(h => hDue(h, HS.day));
  const doneN = dueToday.filter(h => hDone(h, HS.day)).length;
  main.innerHTML = headHtml('Hábitos', `${doneN} de ${dueToday.length} feitos ${HS.day === today() ? 'hoje' : 'em ' + fmtDay(HS.day, true).toLowerCase()}`, `<button class="ib" data-act="hexport" aria-label="Exportar">${ic('export')}</button><button class="btn red sm" data-act="hnew">${ic('plus', 16)}<span>Novo</span></button>`) + `<div class="scroll"><div class="habits">
    <div class="hweek"><button class="ib" data-act="hwk" data-d="-7" aria-label="Semana anterior">${ic('left', 18)}</button>${days.map(d => { const due = hs.filter(h => hDue(h, d)), ok = due.length && due.every(h => hDone(h, d)); return `<button class="hday${d === HS.day ? ' on' : ''}${d === today() ? ' today' : ''}${d > today() ? ' fut' : ''}" data-act="hday" data-d="${d}"><span>${wdShort[pd(d).getDay()]}</span><b>${+d.slice(8)}</b><i class="${ok ? 'ok' : due.some(h => hVal(h, d)) ? 'part' : ''}"></i></button>`; }).join('')}<button class="ib" data-act="hwk" data-d="7" aria-label="Próxima semana" ${addD(ws, 7) > today() ? 'disabled' : ''}>${ic('right', 18)}</button></div>
    <div class="hlist">${hs.map(h => {
      const due = hDue(h, HS.day), v = hVal(h, HS.day), g = h.goal || 1, done = v >= g, st = hStreak(h);
      return `<div class="hcard${done ? ' done' : ''}${due ? '' : ' off'}" style="--hc:${esc(h.color || '#DB4035')}" data-ctx="habit:${h.id}">
        <button class="hmain" data-act="hopen" data-id="${h.id}"><span class="hemo">${esc(h.emoji || '✅')}</span><span class="htx"><b>${esc(h.name)}</b><span class="mut sm">${due ? (g > 1 ? `${v}/${g} ${esc(h.unit || '')} · ` : '') : 'Não previsto neste dia · '}${st.cur ? '🔥 ' + st.cur + ' ' + st.unit : esc(freqText(h))}</span></span></button>
        ${g > 1 && v > 0 ? `<button class="ib" data-act="hminus" data-id="${h.id}" aria-label="Diminuir">−</button>` : ''}
        <button class="hchk${done ? ' on' : ''}" data-act="hcheck" data-id="${h.id}" aria-label="${done ? 'Desmarcar' : 'Marcar'} ${esc(h.name)}" ${HS.day > today() ? 'disabled' : ''}>${g > 1 && !done ? `<svg viewBox="0 0 36 36" class="hprog" aria-hidden="true"><circle cx="18" cy="18" r="15"/><circle cx="18" cy="18" r="15" class="hp" stroke-dasharray="94.2" stroke-dashoffset="${(94.2 * (1 - v / g)).toFixed(1)}" transform="rotate(-90 18 18)"/></svg><span>+</span>` : ic('check', 20)}</button>
      </div>`;
    }).join('') || `<div class="empty"><div class="eic">${ic('habit', 44)}</div><p><b>Crie seu primeiro hábito</b></p><p class="mut">Acompanhe rotinas como beber água, ler ou caminhar.</p></div>`}</div>
    ${db.h.some(h => h.arch) ? `<details class="harch"><summary>Arquivados (${db.h.filter(h => h.arch).length})</summary>${db.h.filter(h => h.arch).map(h => `<div class="frow"><span>${esc(h.emoji || '')} ${esc(h.name)}</span><button class="link" data-act="hunarch" data-id="${h.id}">Restaurar</button></div>`).join('')}</details>` : ''}
  </div></div><button class="fab" data-act="hnew" aria-label="Novo hábito">${ic('plus', 26)}</button>`;
};
function editHabit(h) {
  const isNew = !h;
  h = h || { id: uid(), name: '', emoji: '✅', color: COLORS[db.h.length % COLORS.length], goal: 1, unit: '', freq: { t: 'daily' }, log: {}, c: Date.now(), o: db.h.length + 1 };
  const f0 = h.freq || { t: 'daily' };
  const el = modal(`<h2>${isNew ? 'Novo hábito' : 'Editar hábito'}</h2><form class="hform">
    <div class="row"><button type="button" class="picon sm" data-emo data-pop>${esc(h.emoji || '✅')}</button><input class="in f1" name="n" value="${esc(h.name)}" placeholder="Ex.: Beber água" required maxlength="60" autofocus></div>
    <span class="lab">Cor</span>${colorRow(h.color)}
    <label class="lab">Frequência<select class="in" name="ft"><option value="daily">Todo dia</option><option value="week">Dias específicos</option><option value="times">Vezes por semana</option></select></label>
    <div class="wds" data-w>${[0, 1, 2, 3, 4, 5, 6].map(i => { const w = (i + weekStart()) % 7; return `<label class="wd"><input type="checkbox" name="wd" value="${w}" ${(f0.wd || []).includes(w) ? 'checked' : ''}><span>${wdShort[w]}</span></label>`; }).join('')}</div>
    <label class="lab" data-t>Quantas vezes por semana<input class="in" type="number" min="1" max="7" name="tn" value="${f0.n || 3}"></label>
    <div class="row"><label class="lab f1">Meta por dia<input class="in" type="number" min="1" max="100" name="g" value="${h.goal || 1}"></label><label class="lab f1">Unidade (opcional)<input class="in" name="u" value="${esc(h.unit || '')}" placeholder="copos, páginas…"></label></div>
    <label class="lab">Lembrete (enquanto o app estiver aberto)<input class="in" type="time" name="rem" value="${h.rem || ''}"></label>
    <div class="row end">${isNew ? '' : '<button type="button" class="btn ghost danger" data-del>Excluir</button><button type="button" class="btn ghost" data-arch>Arquivar</button><span class="sp"></span>'}<button type="button" class="btn ghost" data-x>Cancelar</button><button class="btn red">Salvar</button></div></form>`);
  const f = el.querySelector('form');
  f.ft.value = f0.t;
  const sync = () => { el.querySelector('[data-w]').style.display = f.ft.value === 'week' ? '' : 'none'; el.querySelector('[data-t]').style.display = f.ft.value === 'times' ? '' : 'none'; };
  sync(); f.ft.onchange = sync;
  el.querySelector('[data-emo]').onclick = e => emojiPick(e.currentTarget, em => { h.emoji = em; el.querySelector('[data-emo]').textContent = em; });
  el.querySelector('[data-x]').onclick = closeModal;
  const dl = el.querySelector('[data-del]'); if (dl) dl.onclick = async () => { closeModal(); if (await confirmBox('Excluir o hábito "' + h.name + '"?', 'O histórico também será apagado.')) hardDel('h', h.id); };
  const ar = el.querySelector('[data-arch]'); if (ar) ar.onclick = () => { h.arch = true; put('h', h); closeModal(); toast('Hábito arquivado'); };
  f.onsubmit = e => {
    e.preventDefault();
    h.name = f.n.value.trim(); h.color = (new FormData(f)).get('color') || h.color; h.goal = clamp(+f.g.value || 1, 1, 100); h.unit = f.u.value.trim(); h.rem = f.rem.value || null;
    const t = f.ft.value;
    h.freq = t === 'week' ? { t, wd: $$('input[name=wd]:checked', f).map(x => +x.value) } : t === 'times' ? { t, n: clamp(+f.tn.value || 1, 1, 7) } : { t: 'daily' };
    if (t === 'week' && !h.freq.wd.length) h.freq = { t: 'daily' };
    put('h', h); closeModal();
  };
}
function habitStats(h) {
  const [y, m] = HS.month.split('-').map(Number);
  const first = HS.month + '-01', start = sow(first), cells = [...Array(42)].map((_, i) => addD(start, i));
  const monthDays = cells.filter(d => d.slice(0, 7) === HS.month && d <= today() && hDue(h, d));
  const rate = monthDays.length ? Math.round(monthDays.filter(d => hDone(h, d)).length / monthDays.length * 100) : 0;
  const total = Object.keys(h.log || {}).filter(d => hDone(h, d)).length;
  const st = hStreak(h);
  const el = modal(`<div class="hstat" style="--hc:${esc(h.color)}"><div class="row"><span class="hemo big">${esc(h.emoji || '✅')}</span><div class="f1"><h2>${esc(h.name)}</h2><p class="mut sm">${esc(freqText(h))}${h.goal > 1 ? ' · meta ' + h.goal + ' ' + esc(h.unit || '') : ''}</p></div><button class="ib" data-edit aria-label="Editar">${ic('edit')}</button></div>
    <div class="fstats"><div class="stat"><b>${st.cur}</b><span>sequência atual (${st.unit})</span></div><div class="stat"><b>${hBest(h)}</b><span>melhor sequência</span></div><div class="stat"><b>${total}</b><span>dias concluídos</span></div><div class="stat"><b>${rate}%</b><span>neste mês</span></div></div>
    <div class="dmh"><button class="ib" data-mm="-1" aria-label="Mês anterior">${ic('left', 18)}</button><b>${cap(monNames[m - 1])} ${y}</b><button class="ib" data-mm="1" aria-label="Próximo mês">${ic('right', 18)}</button></div>
    <div class="hcal">${[0, 1, 2, 3, 4, 5, 6].map(i => `<span class="dwd">${wdShort[(i + weekStart()) % 7][0].toUpperCase()}</span>`).join('')}${cells.map(d => `<button class="hc${d.slice(0, 7) !== HS.month ? ' out' : ''}${hDone(h, d) ? ' on' : hVal(h, d) ? ' part' : ''}${hDue(h, d) ? '' : ' nd'}${d === today() ? ' today' : ''}" data-hd="${d}" ${d > today() ? 'disabled' : ''} aria-label="${fmtLong(d)}">${+d.slice(8)}</button>`).join('')}</div>
    <p class="hint">Toque num dia para marcar ou desmarcar.</p><div class="row end"><button class="btn ghost" data-x>Fechar</button></div></div>`, { cls: 'wide' });
  el.querySelector('[data-x]').onclick = closeModal;
  el.querySelector('[data-edit]').onclick = () => editHabit(h);
  el.onclick = e => {
    const mm = e.target.closest('[data-mm]'), hd = e.target.closest('[data-hd]');
    if (mm) { HS.month = addM(HS.month + '-01', +mm.dataset.mm).slice(0, 7); habitStats(h); }
    if (hd) { h.log = h.log || {}; const d = hd.dataset.hd; h.log[d] = hDone(h, d) ? 0 : (h.goal || 1); if (!h.log[d]) delete h.log[d]; put('h', h); habitStats(h); }
  };
}
Object.assign(ACTS, {
  hnew: () => editHabit(),
  hday: b => { HS.day = b.dataset.d; render(true); },
  hwk: b => { HS.day = addD(HS.day, +b.dataset.d); if (HS.day > today()) HS.day = today(); render(true); },
  hcheck: b => { const h = get('h', b.dataset.id); h.log = h.log || {}; const d = HS.day, g = h.goal || 1, v = hVal(h, d); h.log[d] = v >= g ? 0 : v + 1; if (!h.log[d]) delete h.log[d]; put('h', h); if (hDone(h, d)) { playDone(); const s = hStreak(h); if (s.cur > 1 && d === today()) toast(`🔥 ${s.cur} ${s.unit} seguidos!`); } },
  hminus: b => { const h = get('h', b.dataset.id); const d = HS.day; h.log[d] = Math.max(0, hVal(h, d) - 1); if (!h.log[d]) delete h.log[d]; put('h', h); },
  hopen: b => { HS.month = HS.day.slice(0, 7); habitStats(get('h', b.dataset.id)); },
  hunarch: b => { const h = get('h', b.dataset.id); h.arch = false; put('h', h); },
  hexport: b => exportMenu(b, { kind: 'habits' }),
});
const _ctx3 = ctxMenu;
ctxMenu = function (spec, anchor, at) {
  if (spec.startsWith('habit:')) { const h = get('h', spec.slice(6)); if (!h) return; menu(anchor, [{ label: 'Estatísticas', icon: 'habit', act: () => habitStats(h) }, { label: 'Editar', icon: 'edit', act: () => editHabit(h) }, { label: 'Arquivar', icon: 'arch', act: () => { h.arch = true; put('h', h); } }], { at }); return; }
  _ctx3(spec, anchor, at);
};

/* ---------- lembretes e notificações (enquanto o app está aberto) ---------- */
function askNotify() { if ('Notification' in window && Notification.permission === 'default') Notification.requestPermission().catch(() => {}); }
function notify(title, body, tag) {
  toast(title + (body ? ' — ' + body : ''));
  if (typeof pushOn === 'function' && pushOn()) return;   /* este aparelho já recebe pelo push */
  try {
    if (!('Notification' in window) || Notification.permission !== 'granted') return;
    if (navigator.serviceWorker && navigator.serviceWorker.controller) navigator.serviceWorker.ready.then(r => r.showNotification(title, { body, tag, icon: 'assets/icon-v4-192.png', badge: 'assets/icon-v4-192.png' })).catch(() => new Notification(title, { body, tag }));
    else new Notification(title, { body, tag });
  } catch (e) {}
}
let FIRED = {};
try { FIRED = JSON.parse(localStorage.getItem('tt_fired') || '{}'); } catch (e) {}
function checkReminders() {
  const now = Date.now(), T = today(), keep = {};
  db.t.forEach(t => {
    if (!live(t) || !(t.rem || []).length) return;
    const at = t.start && tOnly(t.start) ? t.start : t.due;
    if (!at || !tOnly(at)) return;
    t.rem.forEach(m => {
      const when = pd(at).getTime() - m * 60000, key = t.id + '|' + at + '|' + m;
      if (when <= now && now - when < 6 * 3600000) { if (!FIRED[key] && now - when < 15 * 60000) { notify(t.title, (m ? fmtDur(m) + ' para começar · ' : 'Agora · ') + fmtWhen(at), key); playAlarm('chime'); } keep[key] = 1; }
    });
  });
  db.h.forEach(h => {
    if (h.arch || !h.rem || !hDue(h, T) || hDone(h, T)) return;
    const when = pd(T + 'T' + h.rem).getTime(), key = 'h|' + h.id + '|' + T;
    if (when <= now && now - when < 6 * 3600000) { if (!FIRED[key]) notify((h.emoji || '') + ' ' + h.name, 'Lembrete do hábito', key); keep[key] = 1; }
  });
  FIRED = keep; try { localStorage.setItem('tt_fired', JSON.stringify(FIRED)); } catch (e) {}
}

/* ---------- escolher a duração e estender o foco ---------- */
const DUR_KEY = { focus: 'focus', short: 'short', long: 'long' };
function fDurHtml() {
  if (FS.mode === 'watch') return '';
  const k = DUR_KEY[FS.mode], m = db.s.pomo[k];
  if (!FS.began) {
    const pres = FS.mode === 'focus' ? [15, 25, 45, 60, 90] : FS.mode === 'short' ? [3, 5, 10, 15] : [10, 15, 20, 30];
    return `<div class="fdur" role="group" aria-label="Duração"><div class="fdstep"><button class="ib" data-act="fdur" data-d="-5" aria-label="Menos 5 minutos">${ic('minus', 18)}</button><b>${m} min</b><button class="ib" data-act="fdur" data-d="5" aria-label="Mais 5 minutos">${ic('plus', 18)}</button></div><div class="fdpre">${pres.map(v => `<button class="${v === m ? 'on' : ''}" data-act="fdur" data-v="${v}">${v}</button>`).join('')}</div></div>`;
  }
  return `<div class="fext" id="fext" role="group" aria-label="Estender"><span class="fexl">Estender</span>${[5, 10, 25, 50].map(v => `<button data-act="fext" data-v="${v}">+${v} min</button>`).join('')}</div>`;
}
function fExtend(min) {
  if (FS.mode === 'watch' || !FS.began) return;
  FS.extra = (FS.extra || 0) + min * 60;
  if (FS.run) FS.end += min * 60000; else FS.left = fLeft() + min * 60;
  saveFS(); syncTimer && syncTimer();
  toast(`+${min} min · termina às ${new Date(Date.now() + fLeft() * 1000).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`);
  render(true);
}
/* nos últimos 3 minutos os botões de estender ficam em destaque */
function fExtPaint(s) { const e = $('#fext'); if (e) e.classList.toggle('soon', FS.mode !== 'watch' && s <= 180); const f = $('#fxfull'); if (f) f.classList.toggle('soon', FS.mode !== 'watch' && FS.began && s <= 180); }
Object.assign(ACTS, {
  fdur: b => { const k = DUR_KEY[FS.mode]; if (!k || FS.began) return; const p = db.s.pomo; p[k] = clamp(b.dataset.v ? +b.dataset.v : p[k] + (+b.dataset.d), 1, 180); FS.left = null; put('s', db.s); },
  fext: b => fExtend(+b.dataset.v),
});
