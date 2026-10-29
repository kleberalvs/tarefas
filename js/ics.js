/* Google Agenda pelo link secreto (iCal): só leitura, sem login no Google e sem expirar.
   Os eventos entram no calendário, no Painel e em Reuniões (mesma lista usada pela conexão com login: GC.ev).
   A busca do arquivo passa pela função "tarefas" do Supabase (o navegador não pode baixar direto do Google). */
'use strict';
const ICS = { busy: false, err: '', at: 0, items: [], names: {} };
const ICS_HOSTS = /^(calendar\.google\.com|www\.google\.com|outlook\.office365\.com|outlook\.live\.com|outlook\.office\.com|p\d+-caldav\.icloud\.com)$/i;
const icsSrcs = () => (db.s.gIcs || []).filter(x => x && x.url);
const icsOn = () => icsSrcs().some(x => x.on !== false);
try { const c = JSON.parse(localStorage.getItem('tt_ics') || 'null'); if (c && Array.isArray(c.items)) { ICS.items = c.items; ICS.at = c.at || 0; ICS.names = c.names || {}; } } catch (e) {}

/* ---------- leitura do arquivo .ics ---------- */
function icsUnesc(v) { return String(v || '').replace(/\\n/gi, '\n').replace(/\\([,;\\])/g, '$1'); }
function icsParse(text) {
  const lines = String(text).replace(/\r\n?/g, '\n').replace(/\n[ \t]/g, '').split('\n');
  const evs = []; let cur = null, depth = 0, calName = '', calTz = '';
  for (const ln of lines) {
    if (ln === 'BEGIN:VEVENT') { cur = { ex: [] }; continue; }
    if (ln === 'END:VEVENT') { if (cur) evs.push(cur); cur = null; continue; }
    if (/^BEGIN:VALARM/.test(ln)) { depth++; continue; }
    if (/^END:VALARM/.test(ln)) { depth--; continue; }
    const i = ln.indexOf(':'); if (i < 1) continue;
    const head = ln.slice(0, i), val = ln.slice(i + 1);
    const [name, ...ps] = head.split(';'); const P = {};
    ps.forEach(p => { const j = p.indexOf('='); if (j > 0) P[p.slice(0, j).toUpperCase()] = p.slice(j + 1).replace(/^"|"$/g, ''); });
    const N = name.toUpperCase();
    if (!cur) { if (N === 'X-WR-CALNAME') calName = icsUnesc(val); if (N === 'X-WR-TIMEZONE') calTz = val.trim(); continue; }
    if (depth) continue;
    if (N === 'DTSTART' || N === 'DTEND' || N === 'RECURRENCE-ID') cur[N] = { v: val.trim(), tz: P.TZID || '', date: P.VALUE === 'DATE' || /^\d{8}$/.test(val.trim()) };
    else if (N === 'EXDATE') val.split(',').forEach(v => cur.ex.push({ v: v.trim(), tz: P.TZID || '', date: P.VALUE === 'DATE' || /^\d{8}$/.test(v.trim()) }));
    else if (N === 'ATTENDEE') (cur.att = cur.att || []).push({ n: P.CN || val.replace(/^mailto:/i, '').split('@')[0], e: val.replace(/^mailto:/i, '') });
    else if (['UID', 'SUMMARY', 'DESCRIPTION', 'LOCATION', 'RRULE', 'DURATION', 'STATUS', 'URL', 'X-GOOGLE-CONFERENCE'].includes(N)) cur[N] = N === 'RRULE' || N === 'DURATION' ? val.trim() : icsUnesc(val);
  }
  return { evs, calName, calTz };
}
/* hora "de parede" num fuso → instante (ms) */
function icsZoned(y, mo, d, h, mi, s, tz) {
  const guess = Date.UTC(y, mo - 1, d, h, mi, s || 0);
  if (!tz) return new Date(y, mo - 1, d, h, mi, s || 0).getTime();
  try {
    const f = new Intl.DateTimeFormat('en-US', { timeZone: tz, hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const off = t => { const p = Object.fromEntries(f.formatToParts(new Date(t)).map(x => [x.type, x.value])); return Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour % 24, +p.minute, +p.second) - t; };
    let t = guess - off(guess); t = guess - off(t); return t;
  } catch (e) { return new Date(y, mo - 1, d, h, mi, s || 0).getTime(); }
}
/* {v, tz, date} → { date:'AAAA-MM-DD' } (dia inteiro) ou { ms } */
function icsTime(x, defTz) {
  const m = String(x.v).match(/^(\d{4})(\d{2})(\d{2})(?:T(\d{2})(\d{2})(\d{2})?(Z)?)?/); if (!m) return null;
  if (x.date || !m[4]) return { date: `${m[1]}-${m[2]}-${m[3]}`, y: +m[1], mo: +m[2], d: +m[3] };
  const p = [+m[1], +m[2], +m[3], +m[4], +m[5], +(m[6] || 0)];
  return { ms: m[7] ? Date.UTC(p[0], p[1] - 1, p[2], p[3], p[4], p[5]) : icsZoned(...p, x.tz || defTz), y: p[0], mo: p[1], d: p[2], h: p[3], mi: p[4], s: p[5], tz: m[7] ? 'UTC' : (x.tz || defTz) };
}
const icsLocal = ms => { const d = new Date(ms); return ymd(d) + 'T' + hm(d); };
function icsDur(s) {
  const m = String(s || '').match(/^([+-])?P(?:(\d+)W)?(?:(\d+)D)?(?:T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?)?$/); if (!m) return 0;
  return ((+m[2] || 0) * 7 * 864e5 + (+m[3] || 0) * 864e5 + (+m[4] || 0) * 36e5 + (+m[5] || 0) * 6e4 + (+m[6] || 0) * 1e3) * (m[1] === '-' ? -1 : 1);
}
const WDN = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'];
/* datas (ano, mês, dia) das ocorrências de uma regra RRULE, a partir do início */
function icsRuleDates(st, rule, untilMs, maxEnd) {
  const R_ = Object.fromEntries(rule.split(';').map(p => p.split('=')).map(([k, v]) => [k.toUpperCase(), v]));
  const F = R_.FREQ, I = Math.max(1, +R_.INTERVAL || 1), count = +R_.COUNT || 0;
  let until = untilMs;
  if (R_.UNTIL) { const u = icsTime({ v: R_.UNTIL, tz: '', date: /^\d{8}$/.test(R_.UNTIL) }, st.tz); if (u) until = Math.min(until, u.ms != null ? u.ms : Date.UTC(u.y, u.mo - 1, u.d, 23, 59, 59)); }
  const byday = (R_.BYDAY || '').split(',').filter(Boolean).map(s => { const m = s.match(/^([+-]?\d+)?(SU|MO|TU|WE|TH|FR|SA)$/); return m ? { n: m[1] ? +m[1] : 0, wd: WDN.indexOf(m[2]) } : null; }).filter(Boolean);
  const bymd = (R_.BYMONTHDAY || '').split(',').filter(Boolean).map(Number);
  const bymo = (R_.BYMONTH || '').split(',').filter(Boolean).map(Number);
  const out = []; const D0 = new Date(Date.UTC(st.y, st.mo - 1, st.d));
  const key = d => d.getTime();
  const push = d => { if (d < D0) return true; const at = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()); if (at > until) return false; out.push([d.getUTCFullYear(), d.getUTCMonth() + 1, d.getUTCDate()]); return !(count && out.length >= count) && at <= maxEnd; };
  const dim = (y, m) => new Date(Date.UTC(y, m, 0)).getUTCDate();
  const nthWd = (y, m, n, wd) => { if (n > 0) { const f = new Date(Date.UTC(y, m - 1, 1)); const d = 1 + ((wd - f.getUTCDay() + 7) % 7) + (n - 1) * 7; return d <= dim(y, m) ? d : 0; } const L = dim(y, m), l = new Date(Date.UTC(y, m - 1, L)); const d = L - ((l.getUTCDay() - wd + 7) % 7) + (n + 1) * 7; return d >= 1 ? d : 0; };
  for (let i = 0, guard = 0; guard < 4000; i++, guard++) {
    let cands = [];
    if (F === 'DAILY') { const d = new Date(D0); d.setUTCDate(d.getUTCDate() + i * I); if (bymo.length && !bymo.includes(d.getUTCMonth() + 1)) { if (key(d) > maxEnd) break; continue; } if (byday.length && !byday.some(b => b.wd === d.getUTCDay())) { if (key(d) > maxEnd) break; continue; } cands = [d]; }
    else if (F === 'WEEKLY') { const ws = new Date(D0); ws.setUTCDate(ws.getUTCDate() - ((ws.getUTCDay() + 6) % 7) + i * 7 * I); const days = byday.length ? byday.map(b => b.wd) : [D0.getUTCDay()]; cands = days.map(wd => { const d = new Date(ws); d.setUTCDate(d.getUTCDate() + ((wd + 6) % 7)); return d; }).sort((a, b) => a - b); }
    else if (F === 'MONTHLY') { const y = st.y + Math.floor((st.mo - 1 + i * I) / 12), m = (st.mo - 1 + i * I) % 12 + 1; let ds = []; if (bymd.length) ds = bymd.map(x => x < 0 ? dim(y, m) + x + 1 : x).filter(x => x >= 1 && x <= dim(y, m)); else if (byday.length) byday.forEach(b => { if (b.n) { const d = nthWd(y, m, b.n, b.wd); if (d) ds.push(d); } else for (let d = 1; d <= dim(y, m); d++) if (new Date(Date.UTC(y, m - 1, d)).getUTCDay() === b.wd) ds.push(d); }); else if (st.d <= dim(y, m)) ds = [st.d]; cands = ds.sort((a, b) => a - b).map(d => new Date(Date.UTC(y, m - 1, d))); }
    else if (F === 'YEARLY') { const y = st.y + i * I; const ms = bymo.length ? bymo : [st.mo]; ms.forEach(m => { if (byday.length) byday.forEach(b => { const d = b.n ? nthWd(y, m, b.n, b.wd) : 0; if (d) cands.push(new Date(Date.UTC(y, m - 1, d))); }); else { const dd = bymd.length ? bymd[0] : st.d; if (dd <= dim(y, m)) cands.push(new Date(Date.UTC(y, m - 1, dd))); } }); cands.sort((a, b) => a - b); }
    else { out.push([st.y, st.mo, st.d]); break; }
    let go = true;
    for (const d of cands) { if (!push(d)) { go = false; break; } }
    if (!go) break;
    const last = cands.length ? key(cands[cands.length - 1]) : key(D0) + i * 864e5;
    if (last > maxEnd || last > until) break;
  }
  return out;
}
const MEET_RE = /https:\/\/(?:meet\.google\.com\/[a-z0-9-]+|[\w.-]*zoom\.us\/j\/[^\s"<>]+|teams\.microsoft\.com\/l\/meetup-join\/[^\s"<>]+)/i;
/* eventos do arquivo → itens do calendário entre "from" e "to" (datas AAAA-MM-DD) */
function icsExpand(parsed, src, from, to) {
  const fromMs = pd(from).getTime(), toMs = pd(addD(to, 1)).getTime();
  const defTz = parsed.calTz || '';
  const over = {}; /* exceções de eventos repetidos: UID + início original */
  parsed.evs.forEach(e => { if (e['RECURRENCE-ID'] && e.UID) { const t = icsTime(e['RECURRENCE-ID'], defTz); if (t) over[e.UID + '|' + (t.ms != null ? t.ms : t.date)] = e; } });
  const items = [];
  const mk = (e, s, en, allDay, origKey) => {
    if ((e.STATUS || '').toUpperCase() === 'CANCELLED') return;
    const meet = (e['X-GOOGLE-CONFERENCE'] && /^https/.test(e['X-GOOGLE-CONFERENCE']) ? e['X-GOOGLE-CONFERENCE'] : ((String(e.DESCRIPTION || '') + ' ' + String(e.LOCATION || '')).match(MEET_RE) || [])[0]) || '';
    items.push({ kind: 'g', ics: true, src: src.id, id: 'ics_' + (e.UID || Math.random().toString(36).slice(2)) + '_' + origKey, cal: src.id, rw: false, title: e.SUMMARY || '(sem título)', start: s, end: en, allDay, color: src.color || '#3B7DD8', loc: e.LOCATION || '', desc: e.DESCRIPTION || '', link: e.URL || '', rec: !!e.RRULE, meet, att: (e.att || []).map(a => ({ n: a.n, e: a.e, self: !!(WHO && a.e && a.e.toLowerCase() === WHO.toLowerCase()) })) });
  };
  parsed.evs.forEach(e => {
    if (e['RECURRENCE-ID'] || !e.DTSTART) return;
    const st = icsTime(e.DTSTART, defTz); if (!st) return;
    const enT = e.DTEND ? icsTime(e.DTEND, defTz) : null;
    const allDay = st.date != null && st.ms == null;
    const durMs = allDay ? ((enT && enT.date ? (Date.UTC(enT.y, enT.mo - 1, enT.d) - Date.UTC(st.y, st.mo - 1, st.d)) : 864e5) || 864e5) : enT && enT.ms != null ? enT.ms - st.ms : icsDur(e.DURATION) || 0;
    const ex = new Set(e.ex.map(x => { const t = icsTime(x, defTz); return t ? (t.ms != null ? t.ms : t.date) : ''; }));
    const occ = e.RRULE ? icsRuleDates(st, e.RRULE, toMs + 864e5, toMs + 864e5) : [[st.y, st.mo, st.d]];
    occ.forEach(([y, mo, d]) => {
      let sMs, key;
      if (allDay) { key = `${y}-${pad(mo)}-${pad(d)}`; }
      else { sMs = icsZoned(y, mo, d, st.h, st.mi, st.s, st.tz === 'UTC' ? 'UTC' : st.tz); key = sMs; }
      if (ex.has(key)) return;
      const o = e.UID && over[e.UID + '|' + key];
      if (o) {
        const os = icsTime(o.DTSTART, defTz), oe = o.DTEND ? icsTime(o.DTEND, defTz) : null; if (!os) return;
        if (os.ms == null) { const sd = os.date, ed = oe && oe.date ? addD(oe.date, -1) : sd; if (ed >= from && sd <= to) mk(o, sd, ed < sd ? sd : ed, true, key); }
        else { const oen = oe && oe.ms != null ? oe.ms : os.ms + durMs; if (oen > fromMs && os.ms < toMs) mk(o, icsLocal(os.ms), icsLocal(Math.max(oen, os.ms)), false, key); }
        return;
      }
      if (allDay) { const sd = key, ed = addD(sd, Math.max(1, Math.round(durMs / 864e5)) - 1); if (ed >= from && sd <= to) mk(e, sd, ed, true, key); }
      else { const enMs = sMs + durMs; if (enMs >= fromMs && sMs < toMs) mk(e, icsLocal(sMs), icsLocal(enMs), false, key); }
    });
  });
  return items;
}

/* ---------- busca e atualização ---------- */
function icsUrl(u) { return String(u || '').trim().replace(/^webcal:\/\//i, 'https://'); }
function icsValid(u) { try { const x = new URL(icsUrl(u)); return x.protocol === 'https:' && ICS_HOSTS.test(x.hostname); } catch (e) { return false; } }
async function icsFetch(url) {
  if (!SB || !SES) throw new Error('Entre na sua conta para ver a agenda (a busca passa pelo seu servidor).');
  const { data, error } = await SB.functions.invoke('tarefas', { body: { action: 'ical', url: icsUrl(url) } });
  if (error) { let m = error.message || ''; try { const j = await error.context.json(); m = j.error || m; } catch (e) {} if (/desconhecida/i.test(m)) m = 'Falta atualizar a função "tarefas" no Supabase (veja Configurações → Google Agenda).'; throw new Error(m || 'Não foi possível baixar a agenda'); }
  if (data && data.error) throw new Error(data.error);
  return (data && data.text) || '';
}
async function icsRefresh(force) {
  if (!icsOn() || ICS.busy) return;
  if (!SB || !SES) { if (force) { ICS.err = 'Entre na sua conta para buscar a agenda.'; render(); } icsApply(); return; }
  if (!force && Date.now() - ICS.at < 10 * 60000 && ICS.items.length) { icsApply(); return; }
  ICS.busy = true; ICS.err = ''; if (R.v === 'cal' || R.v === 'settings') render();
  const from = addD(today(), -60), to = addD(today(), 200);
  const all = []; const names = {};
  try {
    for (const src of icsSrcs().filter(x => x.on !== false)) {
      try { const p = icsParse(await icsFetch(src.url)); names[src.id] = p.calName; all.push(...icsExpand(p, src, from, to)); }
      catch (e) { ICS.err = e.message || String(e); const old = ICS.items.filter(x => x.src === src.id); all.push(...old); names[src.id] = ICS.names[src.id]; }
    }
    all.sort((a, b) => a.start.localeCompare(b.start));
    ICS.items = all; ICS.names = names; if (!ICS.err) ICS.at = Date.now();
    try { localStorage.setItem('tt_ics', JSON.stringify({ at: ICS.at, items: all, names })); } catch (e) { try { localStorage.setItem('tt_ics', JSON.stringify({ at: ICS.at, items: all.filter(x => x.end >= addD(today(), -7)), names })); } catch (er) {} }
    icsApply(); icsUpcoming();
  } finally { ICS.busy = false; render(); }
}
/* coloca os eventos do link na lista usada pelo app (se o login do Google não estiver ativo) */
function icsApply() {
  if (typeof gOn === 'function' && gOn()) return;
  if (!icsOn()) { if (GC.src === 'ics') { GC.ev = []; GC.src = ''; } return; }
  const on = new Set(icsSrcs().filter(x => x.on !== false).map(x => x.id));
  GC.ev = ICS.items.filter(x => on.has(x.src)).map(x => Object.assign({}, x, { color: (icsSrcs().find(s => s.id === x.src) || {}).color || x.color }));
  GC.src = 'ics';
}
/* próximas reuniões vão para a sua conta, para o servidor avisar mesmo com o app fechado */
function icsUpcoming() {
  const now = Date.now(), lim = now + 3 * 864e5;
  const up = (GC.ev || []).filter(e => !e.allDay).map(e => ({ k: e.id.slice(-60), t: (e.title || '').slice(0, 120), at: pd(e.start).getTime(), m: e.meet || '' })).filter(e => e.at > now && e.at < lim).sort((a, b) => a.at - b.at).slice(0, 40);
  if (JSON.stringify(up) === JSON.stringify(db.s.gUp || [])) return;
  db.s.gUp = up; put('s', db.s, { silent: true });
}
setInterval(() => { if (icsOn() && !document.hidden) icsRefresh(); }, 15 * 60000);
document.addEventListener('visibilitychange', () => { if (!document.hidden && icsOn()) icsRefresh(); });

/* ---------- detalhes de um evento do link (só leitura) ---------- */
function icsOpen(ev) {
  const when = ev.allDay ? (ev.end && ev.end !== ev.start ? `${fmtDay(ev.start, true)} – ${fmtDay(ev.end, true)}` : fmtDay(ev.start, true) + ' · dia inteiro')
    : `${fmtDay(dOnly(ev.start), true)} · ${tOnly(ev.start)}–${tOnly(ev.end)}`;
  const src = icsSrcs().find(s => s.id === ev.src);
  const past = !ev.allDay && pd(ev.end).getTime() < Date.now() - 10 * 60000;
  const desc = stripHtml(String(ev.desc || '').replace(/<br\s*\/?>/gi, '\n')).trim();
  const el = modal(`<div class="icsev"><div class="icshd"><span class="ldot" style="background:${esc(ev.color)}"></span><h2>${esc(ev.title)}</h2></div>
    <p class="icsw">${ic('cal', 16)}<span>${esc(when)}${ev.rec ? ' · repete' : ''}</span></p>
    ${ev.loc && !MEET_RE.test(ev.loc) ? `<p class="icsw">${ic('pin', 16)}<span>${linkifyText(ev.loc)}</span></p>` : ''}
    ${(ev.att || []).length ? `<p class="icsw">${ic('users', 16)}<span>${esc(ev.att.map(a => a.n).slice(0, 12).join(', '))}${ev.att.length > 12 ? ` +${ev.att.length - 12}` : ''}</span></p>` : ''}
    ${!past && (!ev.allDay || ev.meet) ? `<div class="icsbtns">${ev.meet ? `<a class="btn red" href="${esc(ev.meet)}" target="_blank" rel="noopener">${ic('video', 17)}${/meet\.google/.test(ev.meet) ? 'Entrar no Meet' : 'Entrar na chamada'}</a>` : ''}${!ev.allDay ? `<button class="btn ${ev.meet ? 'ghost' : 'red'}" data-rec>${ic('mic', 16)}Gravar e resumir</button>` : ''}</div>` : ''}
    ${desc ? `<div class="icsdesc">${linkifyText(desc.slice(0, 4000)).replace(/\n/g, '<br>')}</div>` : ''}
    <p class="mut sm icsfoot">${ic('google', 13)} ${esc((src && src.name) || ICS.names[ev.src] || 'Google Agenda')} · só leitura — para editar, abra no Google Agenda</p>
    <div class="row end"><button class="btn ghost" data-totask>Virar tarefa</button><span class="sp"></span><button class="btn ghost" data-x>Fechar</button></div></div>`, { cls: 'icsmodal' });
  el.querySelector('[data-x]').onclick = () => closeModal();
  const rb = el.querySelector('[data-rec]'); if (rb) rb.onclick = () => { closeModal(true); if (ev.meet) window.open(ev.meet, '_blank', 'noopener'); meetStart(ev); };
  el.querySelector('[data-totask]').onclick = () => { const t = newTask({ title: ev.title, notes: esc(desc).replace(/\n/g, '<br>'), due: ev.allDay ? ev.end : ev.end, start: ev.allDay ? (ev.end !== ev.start ? ev.start : null) : ev.start }); put('t', t); closeModal(); openTask(t.id); };
}

/* ---------- configurações ---------- */
function icsSettingsHtml() {
  const L = db.s.gIcs || [];
  const st = ICS.busy ? 'Atualizando…' : ICS.err ? `<span class="redt">${esc(ICS.err)}</span>` : ICS.at ? `Atualizado ${new Date(ICS.at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })} · ${ICS.items.filter(x => x.start >= today()).length} evento(s) daqui pra frente` : '';
  return `<p class="mut sm">Seus eventos do Google aparecem no calendário, no Painel e em Reuniões, com o botão de entrar no Meet e de gravar a ata. Só leitura, atualiza sozinho a cada 15 minutos.</p>
    ${L.map(x => `<div class="icsrow"><input type="color" value="${esc(x.color || '#3B7DD8')}" data-icscolor="${esc(x.id)}" aria-label="Cor"><div class="f1"><b>${esc(x.name || ICS.names[x.id] || 'Agenda')}</b><p class="mut sm">${esc(icsUrl(x.url).replace(/(\/ical\/[^/]{6})[^/]*(\/private-)[^/]{4}[^/]*/, '$1…$2…'))}</p></div><span class="sw-t"><input type="checkbox" data-icson="${esc(x.id)}" ${x.on !== false ? 'checked' : ''}><span></span></span><button class="ib" data-act="icsdel" data-id="${esc(x.id)}" aria-label="Remover">${ic('trash', 17)}</button></div>`).join('')}
    <div class="row"><input class="in" id="icsurl" placeholder="Cole aqui o endereço secreto no formato iCal" autocomplete="off"><button class="btn red sm" data-act="icsadd">Adicionar</button></div>
    ${L.length ? `<div class="srow"><span class="mut sm">${st}</span><button class="btn ghost sm" data-act="icsnow">${ic('sync', 15)}Atualizar agora</button></div>
    <label class="srow"><span>Avisar antes de cada reunião <span class="mut sm">(notificação, mesmo com o app fechado)</span></span><select class="in sm" data-icsrem>${[[0, 'Não avisar'], [1, '1 min'], [5, '5 min'], [10, '10 min'], [15, '15 min'], [30, '30 min']].map(([v, n]) => `<option value="${v}" ${(db.s.gIcsRem ?? 10) === v ? 'selected' : ''}>${n}</option>`).join('')}</select></label>` : ''}
    <details class="help"><summary>Onde pego esse endereço?</summary><ol>
      <li>No <b>computador</b>, abra <a href="https://calendar.google.com/calendar/r/settings" target="_blank" rel="noopener">calendar.google.com → Configurações</a>.</li>
      <li>À esquerda, em <b>Configurações das minhas agendas</b>, clique na sua agenda (o seu nome).</li>
      <li>Desça até <b>Integrar agenda</b> e copie o <b>Endereço secreto no formato iCal</b> (termina em <i>basic.ics</i>).</li>
      <li>Cole acima e toque em <b>Adicionar</b>. Repita para outras agendas, se quiser.</li></ol>
      <p class="mut sm">Esse endereço dá acesso de leitura à sua agenda: não compartilhe com ninguém. Ele fica guardado só na sua conta.</p></details>`;
}
Object.assign(ACTS, {
  icsadd: async () => {
    const i = $('#icsurl'), u = icsUrl(i && i.value);
    if (!u) return;
    if (!icsValid(u)) { toast('Esse endereço não parece um link iCal do Google Agenda'); return; }
    db.s.gIcs = (db.s.gIcs || []).filter(x => icsUrl(x.url) !== u).concat({ id: 'c' + Date.now().toString(36), url: u, name: '', color: ['#3B7DD8', '#0B8043', '#8E24AA', '#E67C73', '#F6BF26'][(db.s.gIcs || []).length % 5], on: true });
    put('s', db.s); toast('Agenda adicionada — buscando eventos…');
    await icsRefresh(true);
    const last = db.s.gIcs[db.s.gIcs.length - 1]; if (last && !last.name && ICS.names[last.id]) { last.name = ICS.names[last.id]; put('s', db.s); }
    if (!ICS.err) toast(`${ICS.items.filter(x => x.start >= today()).length} evento(s) encontrados`);
  },
  icsdel: async b => { if (!await confirmBox('Remover esta agenda do app?', 'Os eventos dela deixam de aparecer. Nada é apagado no Google.', 'Remover')) return; db.s.gIcs = (db.s.gIcs || []).filter(x => x.id !== b.dataset.id); ICS.items = ICS.items.filter(x => x.src !== b.dataset.id); put('s', db.s); icsApply(); icsUpcoming(); render(true); },
  icsnow: () => icsRefresh(true),
});
function icsBindSettings(main) {
  main.querySelectorAll('[data-icson]').forEach(c => c.onchange = () => { const x = (db.s.gIcs || []).find(s => s.id === c.dataset.icson); if (x) { x.on = c.checked; put('s', db.s); icsApply(); icsUpcoming(); if (c.checked) icsRefresh(true); } });
  main.querySelectorAll('[data-icscolor]').forEach(c => c.onchange = () => { const x = (db.s.gIcs || []).find(s => s.id === c.dataset.icscolor); if (x) { x.color = c.value; put('s', db.s); icsApply(); } });
  const r = main.querySelector('[data-icsrem]'); if (r) r.onchange = () => { db.s.gIcsRem = +r.value; put('s', db.s); };
  const u = main.querySelector('#icsurl'); if (u) u.onkeydown = e => { if (e.key === 'Enter') ACTS.icsadd(); };
}
/* reunião aberta pela notificação ("Gravar e resumir") */
function icsFromLaunch() {
  const q = new URLSearchParams(location.search), id = q.get('rec');
  if (!id) return;
  history.replaceState(null, '', location.pathname + location.hash);
  const tryOpen = n => { const e = (GC.ev || []).find(x => x.id.endsWith(id)); if (e) meetStart(e); else if (n > 0) setTimeout(() => tryOpen(n - 1), 800); else meetStart(null); };
  setTimeout(() => tryOpen(8), 600);
}

/* ---------- feriados (calculados para qualquer ano) ---------- */
const HOL_TYPES = { n: ['Feriado nacional', '#D93025'], e: ['Feriado estadual (Pernambuco)', '#E8710A'], m: ['Feriado municipal (Recife)', '#9334E6'], f: ['Ponto facultativo', '#80868B'] };
function easter(y) { const a = y % 19, b = Math.floor(y / 100), c = y % 100, d = Math.floor(b / 4), e = b % 4, f = Math.floor((b + 8) / 25), g = Math.floor((b - f + 1) / 3), h = (19 * a + b - d - g + 15) % 30, i = Math.floor(c / 4), k = c % 4, l = (32 + 2 * e + 2 * i - h - k) % 7, m = Math.floor((a + 11 * h + 22 * l) / 451), mo = Math.floor((h + l - 7 * m + 114) / 31), dd = ((h + l - 7 * m + 114) % 31) + 1; return `${y}-${pad(mo)}-${pad(dd)}`; }
function holidaysOf(y) {
  const P = easter(y), L = [];
  const add = (d, t, k) => L.push({ d, t, k });
  add(`${y}-01-01`, 'Confraternização Universal', 'n');
  add(addD(P, -48), 'Carnaval', 'f'); add(addD(P, -47), 'Carnaval', 'f'); add(addD(P, -46), 'Quarta-feira de Cinzas', 'f');
  add(`${y}-03-06`, 'Data Magna de Pernambuco', 'e');
  add(addD(P, -2), 'Paixão de Cristo', 'n'); add(P, 'Páscoa', 'n');
  add(`${y}-04-21`, 'Tiradentes', 'n');
  add(`${y}-05-01`, 'Dia do Trabalho', 'n');
  add(addD(P, 60), 'Corpus Christi', 'f');
  add(`${y}-06-24`, 'São João', 'm');
  add(`${y}-07-16`, 'Nossa Senhora do Carmo (padroeira do Recife)', 'm');
  add(`${y}-09-07`, 'Independência do Brasil', 'n');
  add(`${y}-10-12`, 'Nossa Senhora Aparecida', 'n');
  add(`${y}-11-02`, 'Finados', 'n');
  add(`${y}-11-15`, 'Proclamação da República', 'n');
  if (y >= 2024) add(`${y}-11-20`, 'Dia Nacional de Zumbi e da Consciência Negra', 'n');
  add(`${y}-12-08`, 'Nossa Senhora da Conceição', 'm');
  add(`${y}-12-25`, 'Natal', 'n');
  return L;
}
const holCfg = () => Object.assign({ n: true, e: true, m: true, f: true }, db.s.hol || {});
function holItems(from, to) {
  const c = holCfg(); if (!c.n && !c.e && !c.m && !c.f) return [];
  const out = [];
  for (let y = +from.slice(0, 4); y <= +to.slice(0, 4); y++) holidaysOf(y).forEach(h => {
    if (!c[h.k] || h.d < from || h.d > to || (h.k === 'n' && h.t === 'Páscoa')) return;
    out.push({ kind: 'g', hol: h.k, ics: true, rw: false, id: 'hol_' + h.d + '_' + h.k, title: h.t, start: h.d, end: h.d, allDay: true, color: HOL_TYPES[h.k][1], src: 'hol', desc: '', meet: '', att: [] });
  });
  return out;
}
function holOpen(id) {
  const [, d, k] = id.split('_'); const h = holidaysOf(+d.slice(0, 4)).find(x => x.d === d && x.k === k); if (!h) return;
  modal(`<div class="icsev"><div class="icshd"><span class="ldot" style="background:${HOL_TYPES[k][1]}"></span><h2>${esc(h.t)}</h2></div>
    <p class="icsw">${ic('cal', 16)}<span>${esc(fmtDay(d, true))}</span></p>
    <p class="icsw">${ic('flag', 16)}<span>${esc(HOL_TYPES[k][0])}</span></p>
    <p class="mut sm">Para mostrar ou esconder tipos de feriado: Configurações → Google Agenda e feriados.</p>
    <div class="row end"><button class="btn ghost" data-x>Fechar</button></div></div>`, { cls: 'icsmodal' }).querySelector('[data-x]').onclick = () => closeModal();
}
function holSettingsHtml() {
  const c = holCfg();
  return `<p class="lab" style="margin-top:16px">Feriados no calendário</p>${Object.entries({ n: 'Nacionais', e: 'Estaduais de Pernambuco (Data Magna, 6/3)', m: 'Municipais do Recife (São João, N. Sra. do Carmo, N. Sra. da Conceição)', f: 'Pontos facultativos (Carnaval, Cinzas, Corpus Christi)' }).map(([k, n]) => `<label class="srow"><span><span class="ldot" style="display:inline-block;width:10px;height:10px;border-radius:3px;margin-right:8px;background:${HOL_TYPES[k][1]}"></span>${n}</span><span class="sw-t"><input type="checkbox" data-hol="${k}" ${c[k] ? 'checked' : ''}><span></span></span></label>`).join('')}`;
}
document.addEventListener('change', e => { const k = e.target && e.target.dataset && e.target.dataset.hol; if (!k) return; db.s.hol = Object.assign(holCfg(), { [k]: e.target.checked }); put('s', db.s); });
