/* Calendário (mês, semana, 3 dias, dia e agenda) e sincronização com o Google Agenda. */
'use strict';
const CAL = { mode: null, date: today(), sel: today(), side: true };
const HOUR = 52;

/* ---------- Google Agenda ---------- */
const GC = { token: null, exp: 0, cals: [], ev: [], loaded: '', status: 'off', busy: false, client: null, q: new Map() };
try { const s = JSON.parse(localStorage.getItem('tt_gtok') || 'null'); if (s && s.exp > Date.now() + 60000) { GC.token = s.token; GC.exp = s.exp; GC.status = 'on'; } } catch (e) {}
const gcalReady = () => !!db.s.gClient;
const gOn = () => !!GC.token && GC.exp > Date.now() + 30000;
function loadGis() {
  if (window.google && google.accounts && google.accounts.oauth2) return Promise.resolve();
  return new Promise((res, rej) => { const s = document.createElement('script'); s.src = 'https://accounts.google.com/gsi/client'; s.async = true; s.onload = res; s.onerror = () => rej(new Error('Sem acesso ao Google')); document.head.appendChild(s); });
}
async function gConnect(silent) {
  if (!db.s.gClient) { if (!silent) go('settings'); return; }
  try { await loadGis(); } catch (e) { toast(e.message); return; }
  if (!GC.client) GC.client = google.accounts.oauth2.initTokenClient({
    client_id: db.s.gClient.trim(),
    scope: 'https://www.googleapis.com/auth/calendar',
    callback: async r => {
      if (r.error) { GC.status = 'err'; toast('Google: ' + (r.error_description || r.error)); render(); return; }
      GC.token = r.access_token; GC.exp = Date.now() + (r.expires_in || 3600) * 1000; GC.status = 'on';
      try { localStorage.setItem('tt_gtok', JSON.stringify({ token: GC.token, exp: GC.exp })); } catch (e) {}
      await gLoadCals(); GC.loaded = ''; toast('Google Agenda conectado'); render(true);
      gFlush();
    },
    error_callback: e => { GC.status = 'err'; if (!silent) toast('Não foi possível conectar ao Google (' + (e.type || 'erro') + ')'); render(); },
  });
  GC.client.requestAccessToken({ prompt: GC.token || localStorage.getItem('tt_gok') ? '' : 'consent' });
  try { localStorage.setItem('tt_gok', '1'); } catch (e) {}
}
function gDisconnect() {
  try { if (GC.token && window.google) google.accounts.oauth2.revoke(GC.token, () => {}); } catch (e) {}
  GC.token = null; GC.exp = 0; GC.status = 'off'; GC.ev = []; GC.cals = []; GC.loaded = '';
  localStorage.removeItem('tt_gtok'); localStorage.removeItem('tt_gok'); render(true);
}
async function gApi(path, opt = {}) {
  if (!gOn()) { GC.status = GC.token ? 'exp' : 'off'; throw new Error('Google desconectado'); }
  const r = await fetch('https://www.googleapis.com/calendar/v3' + path, Object.assign({}, opt, { headers: Object.assign({ Authorization: 'Bearer ' + GC.token, 'Content-Type': 'application/json' }, opt.headers || {}) }));
  if (r.status === 401) { GC.token = null; GC.status = 'exp'; localStorage.removeItem('tt_gtok'); render(); throw new Error('Sessão do Google expirou'); }
  if (r.status === 204 || r.status === 410) return null;
  const j = await r.json().catch(() => null);
  if (!r.ok) throw new Error((j && j.error && j.error.message) || 'Erro do Google ' + r.status);
  return j;
}
async function gLoadCals() {
  const j = await gApi('/users/me/calendarList?minAccessRole=reader&maxResults=250');
  GC.cals = (j.items || []).map(c => ({ id: c.id, name: c.summaryOverride || c.summary, color: c.backgroundColor, prim: !!c.primary, rw: /owner|writer/.test(c.accessRole), on: c.selected !== false }));
  if (!db.s.gCals) { db.s.gCals = GC.cals.filter(c => c.on).map(c => c.id); put('s', db.s); }
  if (!db.s.gTaskCal) { const p = GC.cals.find(c => c.prim); if (p) { db.s.gTaskCal = p.id; put('s', db.s); } }
}
const tzOff = d => { const o = -d.getTimezoneOffset(), s = o >= 0 ? '+' : '-'; return s + pad(Math.floor(Math.abs(o) / 60)) + ':' + pad(Math.abs(o) % 60); };
const toRfc = s => { const d = pd(s); return ymd(d) + 'T' + hm(d) + ':00' + tzOff(d); };
const fromG = g => g.date ? g.date : (() => { const d = new Date(g.dateTime); return ymd(d) + 'T' + hm(d); })();
async function gLoadEvents(from, to, force) {
  if (!gOn()) return;
  const key = from + to + (db.s.gCals || []).join();
  if (!force && GC.loaded === key && Date.now() - (GC.at || 0) < 300000) return;
  if (GC.busy) return;
  GC.busy = true;
  try {
    if (!GC.cals.length) await gLoadCals();
    const sel = GC.cals.filter(c => (db.s.gCals || []).includes(c.id));
    const out = [];
    await Promise.all(sel.map(async c => {
      let page = '';
      for (let i = 0; i < 5; i++) {
        const j = await gApi(`/calendars/${encodeURIComponent(c.id)}/events?singleEvents=true&orderBy=startTime&maxResults=2500&timeMin=${encodeURIComponent(toRfc(from))}&timeMax=${encodeURIComponent(toRfc(addD(to, 1)))}${page ? '&pageToken=' + page : ''}`);
        (j.items || []).forEach(e => {
          if (e.status === 'cancelled') return;
          const tt = e.extendedProperties && e.extendedProperties.private && e.extendedProperties.private.ttask;
          if (tt) { gPullTask(tt, e, c.id); return; }
          const allDay = !!e.start.date;
          out.push({ kind: 'g', id: e.id, cal: c.id, rw: c.rw, title: e.summary || '(sem título)', start: fromG(e.start), end: allDay ? addD(e.end.date, -1) : fromG(e.end), allDay, color: e.backgroundColor || c.color || '#3B7DD8', loc: e.location || '', desc: e.description || '', link: e.htmlLink, rec: !!e.recurringEventId, meet: e.hangoutLink || '' });
        });
        if (!j.nextPageToken) break; page = j.nextPageToken;
      }
    }));
    GC.ev = out; GC.loaded = key; GC.at = Date.now(); GC.status = 'on';
  } catch (e) { console.warn('google', e); if (GC.status !== 'exp') GC.status = 'err'; }
  finally { GC.busy = false; render(); }
}
/* mudança feita no Google num evento que espelha uma tarefa: traz para o app */
function gPullTask(tid, e, cal) {
  const t = get('t', tid); if (!t || t.del) return;
  const upd = Date.parse(e.updated || 0);
  if (!t.gc || upd <= (t.u || 0) + 5000 || e.recurringEventId) return;
  const allDay = !!e.start.date;
  const s = fromG(e.start), en = allDay ? addD(e.end.date, -1) : fromG(e.end);
  let ch = false;
  const title = (e.summary || '').replace(/^✓\s*/, '');
  if (title && title !== t.title) { t.title = title; ch = true; }
  if (allDay) { const nd = en; if (t.due !== nd || (t.start && t.start !== (s !== en ? s : null))) { t.due = nd; t.start = s !== en ? s : null; ch = true; } }
  else {
    const mins = (pd(en) - pd(s)) / 60000;
    if (mins <= 30 && !t.start) { if (t.due !== s) { t.due = s; ch = true; } }
    else if (t.start !== s || t.due !== en) { t.start = s; t.due = en; ch = true; }
  }
  if (ch) { t.gc = { id: e.id, cal }; put('t', t, { keepU: false }); }
}
function taskToEvent(t) {
  const ev = { summary: (t.done ? '✓ ' : '') + t.title, description: stripHtml(t.notes || '') + ((t.chk || []).length ? '\n\n' + t.chk.map(c => (c.done ? '☑ ' : '☐ ') + c.t).join('\n') : ''), extendedProperties: { private: { ttask: t.id } } };
  const s = t.start || t.due, e = t.due || t.start;
  if (tOnly(s) || tOnly(e)) {
    let st = tOnly(s) ? s : dOnly(s) + 'T09:00', en = tOnly(e) ? e : dOnly(e) + 'T09:30';
    if (st === en || !t.start) { const d = pd(st); d.setMinutes(d.getMinutes() + 30); en = ymd(d) + 'T' + hm(d); }
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    ev.start = { dateTime: toRfc(st), timeZone: tz }; ev.end = { dateTime: toRfc(en), timeZone: tz };
  } else { ev.start = { date: dOnly(s) }; ev.end = { date: addD(dOnly(e), 1) }; }
  if (t.rep && t.rep.from !== 'done') {
    const R_ = t.rep, F = { d: 'DAILY', w: 'WEEKLY', m: 'MONTHLY', y: 'YEARLY' }[R_.f];
    let r = 'RRULE:FREQ=' + F + ';INTERVAL=' + (R_.n || 1);
    if (R_.f === 'w' && R_.wd && R_.wd.length) r += ';BYDAY=' + R_.wd.map(w => ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'][w]).join(',');
    if (R_.f === 'm' && R_.md) r += ';BYMONTHDAY=' + R_.md;
    if (R_.until) r += ';UNTIL=' + R_.until.replace(/-/g, '') + 'T235959Z';
    ev.recurrence = [r];
  } else ev.recurrence = [];
  if (t.done) ev.colorId = '8';
  ev.reminders = (t.rem || []).length && (tOnly(s) || tOnly(e)) ? { useDefault: false, overrides: t.rem.map(m => ({ method: 'popup', minutes: m })) } : { useDefault: false, overrides: [] };
  return ev;
}
const wantsG = t => !t.del && (t.due || t.start) && (t.gcOn === true || (t.gcOn !== false && db.s.gPush));
function gcalPushTask(t, force) {
  if (!t || !gcalReady()) return;
  if (!force && !wantsG(t) && !t.gc) return;
  if (!gOn()) { if (wantsG(t) || t.gc) { t.gcDirty = true; put('t', t, { silent: true, keepU: true }); } return; }
  clearTimeout(GC.q.get(t.id));
  GC.q.set(t.id, setTimeout(() => gPushNow(t.id), 1200));
}
async function gPushNow(id) {
  const t = get('t', id); if (!t) return;
  try {
    if (!(t.due || t.start) || t.del || t.gcOn === false) { if (t.gc) { await gcalDeleteTask(t); delete t.gc; put('t', t, { keepU: true }); } return; }
    const cal = (t.gc && t.gc.cal) || db.s.gTaskCal || 'primary', body = taskToEvent(t);
    let r;
    if (t.gc) {
      try { r = await gApi(`/calendars/${encodeURIComponent(cal)}/events/${encodeURIComponent(t.gc.id)}`, { method: 'PATCH', body: JSON.stringify(body) }); }
      catch (e) { if (/not found|404|deleted/i.test(e.message)) { t.gc = null; } else throw e; }
    }
    if (!t.gc) r = await gApi(`/calendars/${encodeURIComponent(cal)}/events`, { method: 'POST', body: JSON.stringify(body) });
    if (r && r.id) t.gc = { id: r.id, cal };
    delete t.gcDirty;
    put('t', t, { keepU: true });
  } catch (e) { console.warn('gpush', e); t.gcDirty = true; put('t', t, { silent: true, keepU: true }); }
}
async function gcalDeleteTask(t) {
  if (!t || !t.gc || !gOn()) return;
  try { await gApi(`/calendars/${encodeURIComponent(t.gc.cal)}/events/${encodeURIComponent(t.gc.id)}`, { method: 'DELETE' }); } catch (e) { console.warn(e); }
}
function gcalAfterComplete(t) { if (t.gc || wantsG(t)) gcalPushTask(t); }
async function gFlush() { for (const t of db.t.filter(t => t.gcDirty || (wantsG(t) && !t.gc && !t.done))) await gPushNow(t.id); }
/* eventos do Google: criar, editar e excluir */
function editGEvent(ev, preset) {
  const isNew = !ev;
  const cals = GC.cals.filter(c => c.rw);
  ev = ev || { title: '', start: preset.start, end: preset.end, allDay: preset.allDay, cal: db.s.gTaskCal || (cals[0] && cals[0].id), loc: '', desc: '' };
  const sd = dOnly(ev.start), st = tOnly(ev.start), ed = dOnly(ev.end), et = tOnly(ev.end);
  const el = modal(`<h2>${isNew ? 'Novo evento' : 'Evento'} ${ic('google', 18)}</h2><form class="gev">
    <input class="in big" name="t" value="${esc(ev.title)}" placeholder="Título" required ${ev.rw === false ? 'disabled' : ''} autofocus>
    <label class="chkl"><input type="checkbox" name="ad" ${ev.allDay ? 'checked' : ''}> Dia inteiro</label>
    <div class="row"><label class="lab f1">Início<input class="in" type="date" name="sd" value="${sd}" required></label><label class="lab tm">Hora<input class="in" type="time" name="st" value="${st || '09:00'}"></label></div>
    <div class="row"><label class="lab f1">Fim<input class="in" type="date" name="ed" value="${ed || sd}" required></label><label class="lab tm">Hora<input class="in" type="time" name="et" value="${et || '10:00'}"></label></div>
    <label class="lab">Local<input class="in" name="loc" value="${esc(ev.loc)}"></label>
    <label class="lab">Descrição<textarea class="in" name="desc" rows="3">${esc(stripHtml(ev.desc))}</textarea></label>
    ${isNew ? `<label class="lab">Agenda<select class="in" name="cal">${cals.map(c => `<option value="${esc(c.id)}" ${c.id === ev.cal ? 'selected' : ''}>${esc(c.name)}</option>`).join('')}</select></label>` : `<p class="mut sm">${esc((GC.cals.find(c => c.id === ev.cal) || {}).name || '')}${ev.rec ? ' · evento repetido (altera só esta ocorrência)' : ''}</p>`}
    ${ev.meet ? `<a class="btn ghost sm" href="${esc(ev.meet)}" target="_blank" rel="noopener">Entrar na reunião</a>` : ''}
    <div class="row end">${!isNew ? `<button type="button" class="btn ghost danger" data-del>Excluir</button><button type="button" class="btn ghost" data-totask>Virar tarefa</button>` : ''}<span class="sp"></span><button type="button" class="btn ghost" data-x>Cancelar</button>${ev.rw === false ? '' : '<button class="btn red">Salvar</button>'}</div></form>`);
  const f = el.querySelector('form');
  const syncAd = () => { f.st.disabled = f.et.disabled = f.ad.checked; };
  syncAd(); f.ad.onchange = syncAd;
  el.querySelector('[data-x]').onclick = closeModal;
  const del = el.querySelector('[data-del]');
  if (del) del.onclick = async () => { if (!await confirmBox('Excluir este evento do Google Agenda?')) return; try { await gApi(`/calendars/${encodeURIComponent(ev.cal)}/events/${encodeURIComponent(ev.id)}`, { method: 'DELETE' }); GC.ev = GC.ev.filter(x => x.id !== ev.id); toast('Evento excluído'); render(); } catch (e) { toast(e.message); } };
  const tt = el.querySelector('[data-totask]');
  if (tt) tt.onclick = () => { const t = newTask({ title: ev.title, notes: esc(stripHtml(ev.desc)), due: ev.allDay ? ev.end : ev.start, start: !ev.allDay && ev.end !== ev.start ? ev.start : null }); if (!ev.allDay) { t.start = ev.start; t.due = ev.end; } put('t', t); closeModal(); openTask(t.id); };
  f.onsubmit = async e => {
    e.preventDefault();
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const body = { summary: f.t.value.trim(), location: f.loc.value, description: f.desc.value };
    if (f.ad.checked) { body.start = { date: f.sd.value }; body.end = { date: addD(f.ed.value < f.sd.value ? f.sd.value : f.ed.value, 1) }; }
    else { let s = f.sd.value + 'T' + f.st.value, en = f.ed.value + 'T' + f.et.value; if (en <= s) { const d = pd(s); d.setHours(d.getHours() + 1); en = ymd(d) + 'T' + hm(d); } body.start = { dateTime: toRfc(s), timeZone: tz }; body.end = { dateTime: toRfc(en), timeZone: tz }; }
    try {
      const cal = isNew ? f.cal.value : ev.cal;
      if (isNew) await gApi(`/calendars/${encodeURIComponent(cal)}/events`, { method: 'POST', body: JSON.stringify(body) });
      else await gApi(`/calendars/${encodeURIComponent(cal)}/events/${encodeURIComponent(ev.id)}`, { method: 'PATCH', body: JSON.stringify(body) });
      closeModal(); toast('Evento salvo no Google Agenda'); GC.loaded = ''; calRange(true);
    } catch (er) { toast(er.message); }
  };
}

/* ---------- itens do calendário ---------- */
function calItems(from, to) {
  const items = [];
  db.t.filter(t => !t.del && (t.due || t.start)).forEach(t => {
    occurrences(t, from, to).forEach(o => {
      const at = o.at, st = o.start;
      const allDay = !tOnly(at) && !tOnly(st || '');
      let s, e;
      if (st && at) { s = st; e = at; } else if (tOnly(at)) { s = at; const d = pd(at); d.setMinutes(d.getMinutes() + 30); e = ymd(d) + 'T' + hm(d); } else { s = st || at; e = at; }
      items.push({ kind: 't', id: t.id, t, title: t.title, start: s, end: e, allDay, color: t.done ? 'var(--mut2)' : PRIO[t.prio || 0].p ? '' : (listOf(t).color || '#808080'), lc: listOf(t).color || '#808080', done: t.done || (o.virt && false), virt: o.virt, prio: t.prio || 0 });
    });
  });
  if (gOn()) GC.ev.forEach(e => { if (dOnly(e.end) >= from && dOnly(e.start) <= to) items.push(e); });
  return items;
}
const onDay = (it, d) => dOnly(it.start) <= d && dOnly(it.end || it.start) >= d;
function chipHtml(it, small) {
  if (it.kind === 'g') return `<button class="cchip g" style="--c:${esc(it.color)}" data-act="gopen" data-id="${esc(it.id)}" ${it.rw ? `data-drag="g:${esc(it.id)}"` : ''}>${!it.allDay && !small ? `<span class="ctm">${tOnly(it.start)}</span>` : ''}<span class="cnm">${esc(it.title)}</span></button>`;
  return `<button class="cchip t p${it.prio}${it.t.done ? ' done' : ''}" style="--c:${esc(it.lc)}" data-act="topen" data-id="${it.id}" ${it.virt ? '' : `data-drag="t:${it.id}"`}><span class="cdot"></span>${!it.allDay && !small ? `<span class="ctm">${tOnly(it.start)}</span>` : ''}<span class="cnm">${esc(it.title)}</span>${it.t.rep ? ic('repeat', 11) : ''}</button>`;
}
function calRange(force) {
  const m = CAL.mode, d = CAL.date;
  let from, to;
  if (m === 'month') { const f = d.slice(0, 7) + '-01'; from = sow(f); to = addD(from, 41); }
  else if (m === 'week') { from = sow(d); to = addD(from, 6); }
  else if (m === '3day') { from = d; to = addD(d, 2); }
  else if (m === 'day') { from = to = d; }
  else { from = d; to = addD(d, 30); }
  if (gOn()) gLoadEvents(from, to, force);
  return { from, to };
}

/* ---------- tela ---------- */
VIEWS.cal = main => {
  if (!CAL.mode) CAL.mode = isMobile() ? 'month' : (db.s.calMode || 'month');
  const { from, to } = calRange();
  const items = calItems(from, to);
  const m = CAL.mode, d = pd(CAL.date);
  let title;
  if (m === 'month') title = cap(monNames[d.getMonth()]) + ' ' + d.getFullYear();
  else if (m === 'day') title = fmtDay(CAL.date, true);
  else title = `${pd(from).getDate()} ${monShort[pd(from).getMonth()]} – ${pd(to).getDate()} ${monShort[pd(to).getMonth()]}`;
  const gbtn = !gcalReady() ? `<button class="btn ghost sm" data-act="go" data-to="settings">${ic('google', 16)}<span class="hide-s">Conectar Google</span></button>`
    : gOn() ? `<button class="ib" data-act="gmenu" aria-label="Google Agenda" title="Google Agenda conectado">${ic('google')}</button>`
    : `<button class="btn ghost sm" data-act="gconn">${ic('google', 16)}<span>${GC.status === 'exp' ? 'Reconectar' : 'Conectar'}</span></button>`;
  const right = `<div class="seg">${[['month', 'Mês'], ['week', 'Semana'], ['3day', '3 dias'], ['day', 'Dia'], ['agenda', 'Agenda']].map(([k, n]) => `<button class="${m === k ? 'on' : ''}${k === 'week' ? ' hide-s' : ''}" data-act="cmode" data-m="${k}">${n}</button>`).join('')}</div>${gbtn}<button class="ib" data-act="cexport" aria-label="Exportar calendário">${ic('export')}</button>`;
  const nav = `<div class="cnav"><button class="ib" data-act="cnav" data-d="-1" aria-label="Anterior">${ic('left')}</button><button class="btn ghost sm" data-act="ctoday">Hoje</button><button class="ib" data-act="cnav" data-d="1" aria-label="Próximo">${ic('right')}</button><b class="ctitle">${esc(title)}</b>${GC.busy ? `<span class="mut sm spin">${ic('sync', 14)}</span>` : ''}</div>`;
  let body = '';
  if (m === 'month') body = monthHtml(from, items);
  else if (m === 'agenda') body = agendaHtml(from, to, items);
  else body = gridHtml(m === 'week' ? 7 : m === '3day' ? 3 : 1, from, items);
  const unsched = db.t.filter(t => live(t) && !t.par && !t.due && !t.start).sort((a, b) => b.prio - a.prio || (a.o || 0) - (b.o || 0));
  const side = !isMobile() && CAL.side && m !== 'agenda' ? `<aside class="cside"><header><b>Sem data</b><span class="cnt">${unsched.length}</span><button class="mini" data-act="cside" aria-label="Fechar painel">${ic('x', 14)}</button></header><p class="hint">Arraste para o calendário</p><div class="sside">${unsched.map(t => rowHtml(t, { card: 1, noMeta: 0, showList: 1 })).join('') || '<p class="hint">Todas as tarefas têm data.</p>'}</div></aside>` : '';
  main.innerHTML = headHtml('Calendário', '', right) + `<div class="calwrap">${nav}<div class="calbody${side ? ' with-side' : ''}"><div class="calmain">${body}</div>${side}${!side && !isMobile() && m !== 'agenda' ? `<button class="sidetab" data-act="cside">Sem data (${unsched.length})</button>` : ''}</div></div><button class="fab" data-act="cadd" aria-label="Adicionar">${ic('plus', 26)}</button>`;
  const g = main.querySelector('.tgrid .tscroll');
  if (g) { if (CAL.scroll == null) { const now = new Date(); CAL.scroll = Math.max(0, (CAL.date === today() ? now.getHours() - 2 : 7) * HOUR); } g.scrollTop = CAL.scroll; g.onscroll = () => { CAL.scroll = g.scrollTop; }; }
};
function monthHtml(from, items) {
  const T = today(), mon = CAL.date.slice(0, 7);
  const days = [...Array(42)].map((_, i) => addD(from, i));
  const max = isMobile() ? 0 : 3;
  let h = `<div class="month${isMobile() ? ' mob' : ''}"><div class="mwd">${[0, 1, 2, 3, 4, 5, 6].map(i => `<span>${wdShort[(i + weekStart()) % 7]}</span>`).join('')}</div><div class="mgrid">`;
  days.forEach(d => {
    const its = items.filter(it => onDay(it, d)).sort((a, b) => (b.allDay - a.allDay) || (a.start < b.start ? -1 : 1));
    h += `<div class="mcell${d.slice(0, 7) !== mon ? ' out' : ''}${d === T ? ' today' : ''}${d === CAL.sel ? ' sel' : ''}" data-drop="day:${d}" data-act="cday" data-d="${d}"><span class="mnum">${+d.slice(8)}</span>${max ? its.slice(0, max).map(it => chipHtml(it, 1)).join('') + (its.length > max ? `<button class="more-n" data-act="cdayopen" data-d="${d}">+${its.length - max}</button>` : '') : `<span class="dots">${its.slice(0, 4).map(it => `<i style="background:${esc(it.kind === 'g' ? it.color : it.lc)}"></i>`).join('')}</span>`}</div>`;
  });
  h += '</div></div>';
  if (isMobile()) {
    const its = items.filter(it => onDay(it, CAL.sel)).sort((a, b) => (b.allDay - a.allDay) || (a.start < b.start ? -1 : 1));
    h += `<div class="dayl"><div class="gh"><b>${esc(fmtDay(CAL.sel, true))}</b><span class="sp"></span><button class="link" data-act="cadd">Adicionar</button></div>${its.map(it => it.kind === 't' ? rowHtml(it.t, { showList: 1 }) : `<button class="trow gev" data-act="gopen" data-id="${esc(it.id)}"><span class="gbar" style="background:${esc(it.color)}"></span><div class="tmain"><div class="ttl">${esc(it.title)}</div><div class="tmeta"><span class="md">${it.allDay ? 'Dia inteiro' : tOnly(it.start) + '–' + tOnly(it.end)}</span>${it.loc ? `<span class="md">${esc(it.loc)}</span>` : ''}</div></div></button>`).join('') || '<p class="hint pad">Nada neste dia.</p>'}</div>`;
  }
  return h;
}
function gridHtml(n, from, items) {
  const days = [...Array(n)].map((_, i) => addD(from, i)), T = today();
  const now = new Date(), nowMin = now.getHours() * 60 + now.getMinutes();
  let h = `<div class="tgrid" style="--n:${n}"><div class="thead"><span class="tgut"></span>${days.map(d => `<button class="tdh${d === T ? ' today' : ''}" data-act="cgoday" data-d="${d}"><span>${wdShort[pd(d).getDay()]}</span><b>${+d.slice(8)}</b></button>`).join('')}</div>`;
  h += `<div class="tall"><span class="tgut sm">dia todo</span>${days.map(d => `<div class="tallc" data-drop="day:${d}">${items.filter(it => it.allDay && onDay(it, d)).map(it => chipHtml(it, 1)).join('')}</div>`).join('')}</div>`;
  h += `<div class="tscroll"><div class="tbody" style="height:${24 * HOUR}px"><div class="thours">${[...Array(24)].map((_, i) => `<span style="top:${i * HOUR}px">${i ? pad(i) + ':00' : ''}</span>`).join('')}</div>`;
  days.forEach(d => {
    const its = items.filter(it => !it.allDay && onDay(it, d)).map(it => {
      const s = dOnly(it.start) < d ? 0 : pd(it.start).getHours() * 60 + pd(it.start).getMinutes();
      const e = dOnly(it.end) > d ? 1440 : Math.max(s + 20, pd(it.end).getHours() * 60 + pd(it.end).getMinutes());
      return { it, s, e };
    }).sort((a, b) => a.s - b.s || b.e - a.e);
    /* colunas para eventos sobrepostos */
    const cols = [];
    its.forEach(x => { let c = cols.findIndex(end => end <= x.s); if (c < 0) { c = cols.length; cols.push(0); } cols[c] = x.e; x.c = c; });
    its.forEach(x => { x.w = 1 + Math.max(...its.filter(y => y.s < x.e && y.e > x.s).map(y => y.c)); });
    h += `<div class="tcol${d === T ? ' today' : ''}" data-drop="col:${d}" data-act="cslot" data-d="${d}">${[...Array(24)].map((_, i) => `<i style="top:${i * HOUR}px"></i>`).join('')}
      ${its.map(x => { const it = x.it, top = x.s / 60 * HOUR, ht = Math.max(18, (x.e - x.s) / 60 * HOUR - 2); const w = 100 / x.w;
        return `<button class="tev ${it.kind}${ht < 34 ? ' short' : ''}${it.kind === 't' ? ' p' + it.prio : ''}${it.kind === 't' && it.t.done ? ' done' : ''}" style="top:${top}px;height:${ht}px;left:calc(${x.c * w}% + 2px);width:calc(${w}% - 4px);--c:${esc(it.kind === 'g' ? it.color : it.lc)}" data-act="${it.kind === 't' ? 'topen' : 'gopen'}" data-id="${esc(it.id)}" ${it.kind === 't' && !it.virt ? `data-drag="t:${it.id}"` : it.kind === 'g' && it.rw ? `data-drag="g:${esc(it.id)}"` : ''}><b>${esc(it.title)}</b><span>${tOnly(it.start) || ''}${it.end && tOnly(it.end) ? '–' + tOnly(it.end) : ''}</span></button>`; }).join('')}
      ${d === T ? `<span class="now" style="top:${nowMin / 60 * HOUR}px"></span>` : ''}</div>`;
  });
  h += '</div></div></div>';
  return h;
}
function agendaHtml(from, to, items) {
  let h = '<div class="tlist agenda">';
  for (let d = from; d <= to; d = addD(d, 1)) {
    const its = items.filter(it => onDay(it, d)).sort((a, b) => (b.allDay - a.allDay) || (a.start < b.start ? -1 : 1));
    if (!its.length && d !== today()) continue;
    h += `<section class="grp" data-drop="day:${d}"><div class="gh${d === today() ? ' tdy' : ''}"><b>${esc(fmtDay(d, true))}</b><span class="cnt">${its.length || ''}</span></div>${its.map(it => it.kind === 't' ? rowHtml(it.t, { showList: 1 }) : `<button class="trow gev" data-act="gopen" data-id="${esc(it.id)}"><span class="gbar" style="background:${esc(it.color)}"></span><div class="tmain"><div class="ttl">${esc(it.title)}</div><div class="tmeta"><span class="md">${ic('google', 13)}${it.allDay ? 'Dia inteiro' : tOnly(it.start) + '–' + tOnly(it.end)}</span>${it.loc ? `<span class="md">${esc(it.loc)}</span>` : ''}</div></div></button>`).join('') || '<p class="hint pad">Nada para hoje.</p>'}</section>`;
  }
  return h + '</div>';
}
function newAt(anchor, date, time) {
  const opts = [
    { label: 'Nova tarefa' + (time ? ' às ' + time : ''), icon: 'todo', act: () => quickAddAt(date, time) },
    gOn() ? { label: 'Novo evento no Google', icon: 'google', act: () => { const e = time ? (() => { const d = pd(date + 'T' + time); d.setHours(d.getHours() + 1); return ymd(d) + 'T' + hm(d); })() : date; editGEvent(null, { start: time ? date + 'T' + time : date, end: e, allDay: !time }); } } : null,
  ];
  if (!opts[1]) return quickAddAt(date, time);
  menu(anchor, opts, { at: anchor && anchor.x != null ? anchor : undefined });
}
function quickAddAt(date, time) {
  quickAdd({ due: withT(date, time) });
  const box = $('#modal .qa');
  if (box) { const tok = box.querySelector('.qtok'); tok.innerHTML = `<span class="tok date">${ic('cal', 14)}${esc(fmtDay(date))}${time ? ' ' + time : ''}</span>`; tok.classList.add('on'); }
}
Object.assign(ACTS, {
  cmode: b => { CAL.mode = b.dataset.m; db.s.calMode = CAL.mode; CAL.scroll = null; put('s', db.s); },
  cnav: b => { const n = +b.dataset.d, m = CAL.mode; CAL.date = m === 'month' ? addM(CAL.date, n) : m === 'week' ? addD(CAL.date, 7 * n) : m === '3day' ? addD(CAL.date, 3 * n) : m === 'agenda' ? addD(CAL.date, 30 * n) : addD(CAL.date, n); if (m === 'month') CAL.sel = CAL.date.slice(0, 7) === today().slice(0, 7) ? today() : CAL.date.slice(0, 7) + '-01'; render(true); },
  ctoday: () => { CAL.date = CAL.sel = today(); CAL.scroll = null; render(true); },
  cday: (b, e) => {
    if (e.target.closest('.cchip,.more-n')) return;
    const d = b.dataset.d;
    if (isMobile()) { CAL.sel = d; render(true); return; }
    if (CAL.sel === d && Date.now() - (CAL.clk || 0) < 450) { CAL.mode = 'day'; CAL.date = d; render(true); return; }
    CAL.sel = d; CAL.clk = Date.now();
    $$('.mcell.sel').forEach(x => x.classList.remove('sel')); b.classList.add('sel');
    newAt({ x: e.clientX, y: e.clientY }, d);
  },
  cdayopen: b => { CAL.mode = 'day'; CAL.date = b.dataset.d; render(true); },
  cgoday: b => { CAL.mode = 'day'; CAL.date = b.dataset.d; render(true); },
  cslot: (b, e) => { if (e.target.closest('.tev')) return; const r = b.getBoundingClientRect(); const min = Math.floor((e.clientY - r.top) / HOUR * 60 / 30) * 30; newAt({ x: e.clientX, y: e.clientY }, b.dataset.d, pad(Math.floor(min / 60)) + ':' + pad(min % 60)); },
  cadd: b => newAt(b, CAL.mode === 'month' ? CAL.sel : CAL.date),
  cside: () => { CAL.side = !CAL.side; render(true); },
  gconn: () => gConnect(),
  gopen: b => { const ev = GC.ev.find(e => e.id === b.dataset.id); if (ev) editGEvent(ev); },
  gmenu: b => menu(b, [
    { head: 'Google Agenda' },
    { label: 'Atualizar agora', icon: 'sync', act: () => { GC.loaded = ''; calRange(true); gFlush(); } },
    { label: 'Escolher agendas…', icon: 'cal', act: () => go('settings') },
    { label: 'Desconectar', icon: 'out', danger: 1, act: gDisconnect },
  ], { right: 1 }),
  cexport: b => exportMenu(b, { kind: 'cal' }),
});
/* soltar no calendário */
DROPS.push((src, dst) => {
  const [k, v] = [dst.slice(0, dst.indexOf(':')), dst.slice(dst.indexOf(':') + 1)];
  if (k !== 'day' && k !== 'col') return;
  let minute = null;
  if (k === 'col') { const el = $(`[data-drop="col:${v}"]`); if (el) { const r = el.getBoundingClientRect(); minute = clamp(Math.round((DND.py - r.top) / HOUR * 60 / 15) * 15, 0, 1425); } }
  const time = minute != null ? pad(Math.floor(minute / 60)) + ':' + pad(minute % 60) : null;
  if (src.startsWith('t:')) {
    const t = get('t', src.slice(2)); if (!t) return true;
    if (time) {
      const span = t.start && t.due && tOnly(t.start) && tOnly(t.due) ? pd(t.due) - pd(t.start) : 0;
      if (span) { t.start = v + 'T' + time; const e = new Date(pd(t.start).getTime() + span); t.due = ymd(e) + 'T' + hm(e); }
      else { t.due = v + 'T' + time; t.start = null; }
      if (!(t.rem || []).length) t.rem = [0];
    } else {
      if (t.start && t.due && dOnly(t.start) !== dOnly(t.due)) { const n = diffD(dOnly(t.due), v); t.start = addD(dOnly(t.start), n) + (tOnly(t.start) ? 'T' + tOnly(t.start) : ''); }
      else if (t.start && tOnly(t.start)) t.start = v + 'T' + tOnly(t.start);
      t.due = v + (tOnly(t.due) ? 'T' + tOnly(t.due) : '');
    }
    put('t', t); gcalPushTask(t); return true;
  }
  if (src.startsWith('g:')) {
    const ev = GC.ev.find(e => e.id === src.slice(2)); if (!ev) return true;
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone; let body;
    if (ev.allDay && !time) { const len = diffD(dOnly(ev.start), dOnly(ev.end)); body = { start: { date: v }, end: { date: addD(v, len + 1) } }; }
    else { const dur = ev.allDay ? 3600000 : pd(ev.end) - pd(ev.start); const s = v + 'T' + (time || tOnly(ev.start) || '09:00'); const e = new Date(pd(s).getTime() + dur); body = { start: { dateTime: toRfc(s), timeZone: tz }, end: { dateTime: toRfc(ymd(e) + 'T' + hm(e)), timeZone: tz } }; }
    gApi(`/calendars/${encodeURIComponent(ev.cal)}/events/${encodeURIComponent(ev.id)}`, { method: 'PATCH', body: JSON.stringify(body) }).then(() => { GC.loaded = ''; calRange(true); toast('Evento movido'); }).catch(e => toast(e.message));
    return true;
  }
});
setInterval(() => { if (R.v === 'cal' && gOn()) { GC.loaded = ''; calRange(); } }, 300000);
