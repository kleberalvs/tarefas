/* Núcleo: utilitários, datas, ícones, dados locais, repetição e texto inteligente. */
'use strict';
const $ = (s, r) => (r || document).querySelector(s);
const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
const esc = s => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const debounce = (fn, ms) => { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; };
const norm = s => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
const slug = s => norm(s).replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const plural = (n, a, b) => n + ' ' + (n === 1 ? a : b);
const isMobile = () => matchMedia('(max-width: 759px)').matches;
const isWide = () => matchMedia('(min-width: 1100px)').matches;
const stripHtml = h => { const d = document.createElement('div'); d.innerHTML = h || ''; return (d.textContent || '').replace(/\s+/g, ' ').trim(); };

/* ---------- ícones (traço) ---------- */
const IC = {
  inbox: '<path d="M4 13l2.2-7.2A1 1 0 0 1 7.2 5h9.6a1 1 0 0 1 1 .8L20 13v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1z"/><path d="M4 13h4.5l1.2 2.2h4.6l1.2-2.2H20"/>',
  today: '<rect x="4" y="5" width="16" height="15" rx="2.5"/><path d="M4 9.5h16M8.5 3v4M15.5 3v4"/><text x="12" y="17.6" text-anchor="middle" font-size="7.5" font-weight="700" stroke="none" fill="currentColor" font-family="system-ui">{d}</text>',
  week: '<rect x="4" y="5" width="16" height="15" rx="2.5"/><path d="M4 9.5h16M8.5 3v4M15.5 3v4M8 13h2M11 13h2M14 13h2M8 16h2M11 16h2"/>',
  tomorrow: '<circle cx="12" cy="12" r="4"/><path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M5.6 18.4L7 17M17 7l1.4-1.4"/>',
  all: '<path d="M9 6h11M9 12h11M9 18h11"/><circle cx="4.5" cy="6" r="1"/><circle cx="4.5" cy="12" r="1"/><circle cx="4.5" cy="18" r="1"/>',
  done: '<circle cx="12" cy="12" r="8.5"/><path d="M8.3 12.3l2.5 2.5 5-5.3"/>',
  trash: '<path d="M5 7h14M10 7V5h4v2M7 7l1 12h8l1-12"/>',
  cal: '<rect x="4" y="5" width="16" height="15" rx="2.5"/><path d="M4 9.5h16M8.5 3v4M15.5 3v4"/>',
  matrix: '<rect x="4" y="4" width="7" height="7" rx="1.5"/><rect x="13" y="4" width="7" height="7" rx="1.5"/><rect x="4" y="13" width="7" height="7" rx="1.5"/><rect x="13" y="13" width="7" height="7" rx="1.5"/>',
  focus: '<circle cx="12" cy="13" r="7.5"/><path d="M12 9.5V13l2.3 1.6M10 2.8h4M18.5 6.5l1.2-1.2"/>',
  habit: '<path d="M4 17l4.5-4.5 3.5 3.5L19 9"/><path d="M14.5 9H19v4.5"/>',
  doc: '<path d="M7 3.5h7l4 4V20a.5.5 0 0 1-.5.5h-10A.5.5 0 0 1 7 20z" transform="translate(-.5 0)"/><path d="M13.5 3.5V8h4M9.5 12h6M9.5 15.5h6"/>',
  search: '<circle cx="11" cy="11" r="6.5"/><path d="M20 20l-4.2-4.2"/>',
  gear: '<circle cx="12" cy="12" r="3"/><path d="M12 2.8v2.4M12 18.8v2.4M4.2 7.5l2.1 1.2M17.7 15.3l2.1 1.2M4.2 16.5l2.1-1.2M17.7 8.7l2.1-1.2"/><circle cx="12" cy="12" r="7"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  x: '<path d="M6 6l12 12M18 6L6 18"/>',
  check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
  menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
  side: '<rect x="3.5" y="4.5" width="17" height="15" rx="2.5"/><path d="M9.5 4.5v15"/>',
  more: '<circle cx="5" cy="12" r="1.3" fill="currentColor"/><circle cx="12" cy="12" r="1.3" fill="currentColor"/><circle cx="19" cy="12" r="1.3" fill="currentColor"/>',
  chev: '<path d="M9 6l6 6-6 6"/>',
  chevd: '<path d="M6 9l6 6 6-6"/>',
  left: '<path d="M15 6l-6 6 6 6"/>',
  right: '<path d="M9 6l6 6-6 6"/>',
  flag: '<path d="M6 21V4M6 4.5h10.5l-1.8 4 1.8 4H6"/>',
  tag: '<path d="M3.5 12.2V4.5a1 1 0 0 1 1-1h7.7l8.3 8.3a1 1 0 0 1 0 1.4l-7.1 7.1a1 1 0 0 1-1.4 0z"/><circle cx="8" cy="8" r="1.4"/>',
  folder: '<path d="M3.5 7a1.5 1.5 0 0 1 1.5-1.5h4.2l2 2.2H19a1.5 1.5 0 0 1 1.5 1.5V17a1.5 1.5 0 0 1-1.5 1.5H5A1.5 1.5 0 0 1 3.5 17z"/>',
  list: '<path d="M9 6h11M9 12h11M9 18h11M4.5 6h.01M4.5 12h.01M4.5 18h.01"/>',
  hash: '<path d="M9.5 4L8 20M16 4l-1.5 16M4.5 9h15M4 15h15"/>',
  board: '<rect x="3.5" y="4.5" width="5" height="15" rx="1.5"/><rect x="9.5" y="4.5" width="5" height="10" rx="1.5"/><rect x="15.5" y="4.5" width="5" height="12.5" rx="1.5"/>',
  sort: '<path d="M7 4v16M4 7l3-3 3 3M17 20V4M14 17l3 3 3-3"/>',
  repeat: '<path d="M4 11V9a3 3 0 0 1 3-3h11M15 3l3 3-3 3M20 13v2a3 3 0 0 1-3 3H6M9 21l-3-3 3-3"/>',
  bell: '<path d="M6 16V11a6 6 0 0 1 12 0v5l1.5 2h-15z"/><path d="M10 20.5a2 2 0 0 0 4 0"/>',
  clip: '<path d="M20 11.5l-7.8 7.8a4.6 4.6 0 0 1-6.5-6.5l8.1-8.1a3 3 0 0 1 4.3 4.3l-8 8a1.5 1.5 0 0 1-2.2-2.1l7.4-7.4"/>',
  link: '<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1"/><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/>',
  sub: '<path d="M6 4v9a3 3 0 0 0 3 3h9M15 13l3 3-3 3"/>',
  clock: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>',
  play: '<path d="M8 5.5v13l10.5-6.5z" fill="currentColor"/>',
  pause: '<path d="M8 5.5v13M16 5.5v13" stroke-width="3"/>',
  stop: '<rect x="6.5" y="6.5" width="11" height="11" rx="2" fill="currentColor"/>',
  dl: '<path d="M12 4v11M7.5 10.5L12 15l4.5-4.5M5 19.5h14"/>',
  up: '<path d="M12 20V9M7.5 13.5L12 9l4.5 4.5M5 4.5h14"/>',
  edit: '<path d="M4 20h4L19 9a2.1 2.1 0 0 0-3-3L5 17z"/><path d="M14.5 7.5l3 3"/>',
  copy: '<rect x="8.5" y="8.5" width="11" height="11" rx="2"/><path d="M15.5 8.5V6a1.5 1.5 0 0 0-1.5-1.5H6A1.5 1.5 0 0 0 4.5 6v8A1.5 1.5 0 0 0 6 15.5h2.5"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M5.3 18.7l1.4-1.4M17.3 6.7l1.4-1.4"/>',
  moon: '<path d="M19.5 14.5A7.5 7.5 0 0 1 9.5 4.5a7.5 7.5 0 1 0 10 10z"/>',
  star: '<path d="M12 3.8l2.5 5.2 5.7.8-4.1 4 1 5.7-5.1-2.7-5.1 2.7 1-5.7-4.1-4 5.7-.8z"/>',
  pin: '<path d="M9 4h6l-1 5 3 3v1.5H7V12l3-3zM12 13.5V20"/>',
  google: '<path d="M20.5 12.2c0-.6-.1-1.2-.2-1.8H12v3.4h4.8a4.1 4.1 0 0 1-1.8 2.7v2.2h2.9c1.7-1.6 2.6-3.9 2.6-6.5z" fill="#4285F4" stroke="none"/><path d="M12 21c2.4 0 4.4-.8 5.9-2.2L15 16.5c-.8.5-1.8.9-3 .9-2.3 0-4.3-1.6-5-3.7H4v2.3A9 9 0 0 0 12 21z" fill="#34A853" stroke="none"/><path d="M7 13.7a5.4 5.4 0 0 1 0-3.4V8H4a9 9 0 0 0 0 8z" fill="#FBBC05" stroke="none"/><path d="M12 6.6c1.3 0 2.5.5 3.4 1.3L18 5.4A9 9 0 0 0 4 8l3 2.3c.7-2.1 2.7-3.7 5-3.7z" fill="#EA4335" stroke="none"/>',
  sync: '<path d="M20 12a8 8 0 0 1-14 5.3M4 12a8 8 0 0 1 14-5.3"/><path d="M18 3v4h-4M6 21v-4h4"/>',
  out: '<path d="M14 4.5h4.5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1H14M10 16l4-4-4-4M14 12H4"/>',
  img: '<rect x="3.5" y="4.5" width="17" height="15" rx="2.5"/><circle cx="9" cy="10" r="1.8"/><path d="M20.5 16l-5-5-8.5 8.5"/>',
  file: '<path d="M7 3.5h7l4 4V20a.5.5 0 0 1-.5.5H7a.5.5 0 0 1-.5-.5V4a.5.5 0 0 1 .5-.5z"/><path d="M13.5 3.5V8h4.5"/>',
  quote: '<path d="M6 17c-1-1-1.5-2.3-1.5-4 0-3 2-5.5 5-6.5l.5 1.2c-1.8.9-2.8 2.2-3 3.8h3V17zM14 17c-1-1-1.5-2.3-1.5-4 0-3 2-5.5 5-6.5l.5 1.2c-1.8.9-2.8 2.2-3 3.8h3V17z"/>',
  code: '<path d="M8.5 8L4.5 12l4 4M15.5 8l4 4-4 4M13.5 5.5l-3 13"/>',
  table: '<rect x="3.5" y="4.5" width="17" height="15" rx="2"/><path d="M3.5 9.5h17M3.5 14.5h17M9.5 9.5v10M15 9.5v10"/>',
  line: '<path d="M4 12h16"/>',
  toggle: '<path d="M8 6l6 6-6 6" />',
  h1: '<path d="M4 6v12M12 6v12M4 12h8M16.5 9l2.5-2v11"/>',
  h2: '<path d="M4 6v12M11 6v12M4 12h7M15 9.5a2.4 2.4 0 0 1 4.6 1c0 2.5-4.6 4-4.6 7.5h5"/>',
  h3: '<path d="M4 6v12M11 6v12M4 12h7M15.2 7.5h4.3l-2.6 3.6a2.6 2.6 0 1 1-2 4.6"/>',
  text: '<path d="M5 6.5V5h14v1.5M12 5v14M9.5 19h5"/>',
  ul: '<path d="M10 6h10M10 12h10M10 18h10"/><circle cx="5" cy="6" r="1.2" fill="currentColor"/><circle cx="5" cy="12" r="1.2" fill="currentColor"/><circle cx="5" cy="18" r="1.2" fill="currentColor"/>',
  ol: '<path d="M10 6h10M10 12h10M10 18h10M4 5l1.5-1v4.5M3.8 14a1.4 1.4 0 0 1 2.6.6c0 1-2.6 1.6-2.6 3h2.8"/>',
  todo: '<rect x="4" y="4" width="16" height="16" rx="4"/><path d="M8.5 12l2.5 2.5 4.5-5"/>',
  callout: '<rect x="3.5" y="5" width="17" height="13" rx="3"/><path d="M8 18v3l3-3"/><path d="M8 10h8M8 13.5h5"/>',
  page: '<path d="M7 3.5h7l4 4V20a.5.5 0 0 1-.5.5H7a.5.5 0 0 1-.5-.5V4a.5.5 0 0 1 .5-.5z"/><path d="M13.5 3.5V8h4.5M10 14h6M13 11v6"/>',
  palette: '<path d="M12 20.5a8.5 8.5 0 1 1 8.5-8.5c0 2-1.6 3-3.5 3h-2a1.8 1.8 0 0 0-1.3 3.1c.6.6.3 2.4-1.7 2.4z"/><circle cx="7.5" cy="11.5" r="1.2" fill="currentColor"/><circle cx="10.5" cy="7.5" r="1.2" fill="currentColor"/><circle cx="15" cy="8" r="1.2" fill="currentColor"/>',
  drag: '<circle cx="9" cy="6" r="1.2" fill="currentColor"/><circle cx="15" cy="6" r="1.2" fill="currentColor"/><circle cx="9" cy="12" r="1.2" fill="currentColor"/><circle cx="15" cy="12" r="1.2" fill="currentColor"/><circle cx="9" cy="18" r="1.2" fill="currentColor"/><circle cx="15" cy="18" r="1.2" fill="currentColor"/>',
  export: '<path d="M12 15V4M7.5 8.5L12 4l4.5 4.5M5 13v6a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-6"/>',
  undo: '<path d="M9 7L4.5 11.5 9 16"/><path d="M5 11.5h9.5a5 5 0 0 1 0 10H11"/>',
  eye: '<path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z"/><circle cx="12" cy="12" r="3"/>',
  wifi: '<path d="M5 12.5a10 10 0 0 1 14 0M8 15.5a5.5 5.5 0 0 1 8 0M12 19h.01"/>',
  bold: '<path d="M7 5h6a3.5 3.5 0 0 1 0 7H7zM7 12h7a3.5 3.5 0 0 1 0 7H7z" stroke-width="2.4"/>',
  italic: '<path d="M10 5h8M6 19h8M14 5l-4 14"/>',
  under: '<path d="M7 4.5v7a5 5 0 0 0 10 0v-7M5 20h14"/>',
  strike: '<path d="M4 12h16M16.5 7.5c-.6-1.8-2.4-3-4.5-3-2.5 0-4.5 1.5-4.5 3.5 0 1.3.8 2.4 2.5 3M7.5 16.5c.6 1.8 2.4 3 4.5 3 2.6 0 4.5-1.5 4.5-3.5 0-.8-.3-1.5-.8-2"/>',
  highlight: '<path d="M14.5 5l4.5 4.5-8 8H6.5V13z"/><path d="M4 21h16"/>',
  timer: '<circle cx="12" cy="13.5" r="7"/><path d="M12 10v3.5M9.5 3h5"/>',
  info: '<circle cx="12" cy="12" r="8.5"/><path d="M12 11v5.5M12 7.8h.01"/>',
  arch: '<rect x="3.5" y="4.5" width="17" height="4.5" rx="1.2"/><path d="M5.5 9v9.5a1 1 0 0 0 1 1h11a1 1 0 0 0 1-1V9M10 13h4"/>',
};
const ic = (n, s = 20, extra = '') => `<svg class="i" width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" ${extra}>${(IC[n] || '').replace('{d}', new Date().getDate())}</svg>`;

/* ---------- datas ---------- */
const pad = n => String(n).padStart(2, '0');
const ymd = d => d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
const hm = d => pad(d.getHours()) + ':' + pad(d.getMinutes());
const pd = s => { if (!s) return null; const [a, b] = s.split('T'); const [y, m, d] = a.split('-').map(Number); const dt = new Date(y, m - 1, d); if (b) { const [h, mi] = b.split(':').map(Number); dt.setHours(h, mi || 0, 0, 0); } return dt; };
const today = () => ymd(new Date());
const addD = (s, n) => { const d = pd(s.slice(0, 10)); d.setDate(d.getDate() + n); return ymd(d); };
const addM = (s, n) => { const d = pd(s.slice(0, 10)); const day = d.getDate(); d.setDate(1); d.setMonth(d.getMonth() + n); const last = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate(); d.setDate(Math.min(day, last)); return ymd(d); };
const dOnly = s => s ? s.slice(0, 10) : '';
const tOnly = s => s && s.length > 10 ? s.slice(11, 16) : '';
const withT = (date, time) => time ? date + 'T' + time : date;
const diffD = (a, b) => Math.round((pd(dOnly(b)) - pd(dOnly(a))) / 864e5);
const wdNames = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado'];
const wdShort = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'];
const monNames = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
const monShort = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
const cap = s => s ? s[0].toUpperCase() + s.slice(1) : s;
const weekStart = () => (db && db.s && db.s.weekStart != null) ? db.s.weekStart : 0;
const sow = s => { const d = pd(s); const w = (d.getDay() - weekStart() + 7) % 7; return addD(s, -w); };
function fmtDay(s, long) {
  if (!s) return '';
  const t = today(), n = diffD(t, s), d = pd(s);
  if (n === 0) return 'Hoje';
  if (n === 1) return 'Amanhã';
  if (n === -1) return 'Ontem';
  if (n > 1 && n < 7) return cap(wdNames[d.getDay()]);
  const same = d.getFullYear() === new Date().getFullYear();
  return long ? `${cap(wdShort[d.getDay()])}, ${d.getDate()} de ${monNames[d.getMonth()]}${same ? '' : ' de ' + d.getFullYear()}`
    : `${d.getDate()} ${monShort[d.getMonth()]}${same ? '' : ' ' + d.getFullYear()}`;
}
const fmtWhen = s => s ? fmtDay(dOnly(s)) + (tOnly(s) ? ' ' + tOnly(s) : '') : '';
const fmtLong = s => { const d = pd(s); return `${cap(wdNames[d.getDay()])}, ${d.getDate()} de ${monNames[d.getMonth()]} de ${d.getFullYear()}`; };
const fmtSize = b => b < 1024 ? b + ' B' : b < 1048576 ? (b / 1024).toFixed(0) + ' KB' : (b / 1048576).toFixed(1) + ' MB';
const fmtDur = m => { m = Math.round(m); const h = Math.floor(m / 60); return h ? h + 'h' + (m % 60 ? ' ' + (m % 60) + 'min' : '') : (m % 60) + 'min'; };

/* ---------- repetição ----------
   rep = { f:'d'|'w'|'m'|'y', n:1, wd:[0..6], md: dia do mês, until:'YYYY-MM-DD', from:'due'|'done' } */
function nextOcc(rep, s) {
  if (!rep) return null;
  const n = Math.max(1, rep.n || 1), base = dOnly(s);
  let r;
  if (rep.f === 'd') r = addD(base, n);
  else if (rep.f === 'w') {
    if (rep.wd && rep.wd.length) {
      const d = pd(base), wd = d.getDay(), sorted = [...rep.wd].sort((a, b) => a - b);
      const nx = sorted.find(x => x > wd);
      if (nx != null) r = addD(base, nx - wd);
      else r = addD(base, 7 * (n - 1) + (7 - wd) + sorted[0]);
    } else r = addD(base, 7 * n);
  } else if (rep.f === 'm') {
    r = addM(base, n);
    if (rep.md) { const d = pd(r); const last = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate(); d.setDate(Math.min(rep.md, last)); r = ymd(d); }
  } else if (rep.f === 'y') r = addM(base, 12 * n);
  if (!r) return null;
  if (rep.until && r > rep.until) return null;
  return r + (s.length > 10 ? s.slice(10) : '');
}
function firstOcc(rep, s) { /* primeira data válida a partir de s (inclusive) */
  if (rep && rep.f === 'w' && rep.wd && rep.wd.length && !rep.wd.includes(pd(s).getDay())) return nextOcc(rep, s);
  return s;
}
function repText(rep) {
  if (!rep) return '';
  const n = rep.n || 1;
  const u = { d: ['dia', 'dias'], w: ['semana', 'semanas'], m: ['mês', 'meses'], y: ['ano', 'anos'] }[rep.f];
  let t;
  if (rep.f === 'w' && rep.wd && rep.wd.length) {
    const s = [...rep.wd].sort().join(',');
    if (s === '1,2,3,4,5' && n === 1) t = 'Dias úteis';
    else t = (n === 1 ? 'Toda semana' : `A cada ${n} semanas`) + ': ' + [...rep.wd].sort().map(w => wdShort[w]).join(', ');
  } else if (rep.f === 'm' && rep.md) t = (n === 1 ? 'Todo mês' : `A cada ${n} meses`) + ` no dia ${rep.md}`;
  else t = n === 1 ? { d: 'Todo dia', w: 'Toda semana', m: 'Todo mês', y: 'Todo ano' }[rep.f] : `A cada ${n} ${u[1]}`;
  if (rep.until) t += ' até ' + fmtDay(rep.until);
  return t;
}

/* ---------- texto inteligente (português) ----------
   Ex.: "Reunião com fornecedor amanhã às 15h #compras !alta toda segunda" */
const NLP_WD = { domingo: 0, dom: 0, segunda: 1, seg: 1, terca: 2, ter: 2, quarta: 3, qua: 3, quinta: 4, qui: 4, sexta: 5, sex: 5, sabado: 6, sab: 6 };
const NLP_MON = { janeiro: 0, fevereiro: 1, marco: 2, abril: 3, maio: 4, junho: 5, julho: 6, agosto: 7, setembro: 8, outubro: 9, novembro: 10, dezembro: 11, jan: 0, fev: 1, mar: 2, abr: 3, mai: 4, jun: 5, jul: 6, ago: 7, set: 8, out: 9, nov: 10, dez: 11 };
const WDRX = '(domingo|segunda|ter[cç]a|quarta|quinta|sexta|s[aá]bado)(?:s)?(?:-feira(?:s)?)?';
function parseSmart(text, opts = {}) {
  const T = today();
  const r = { title: text, date: null, time: null, end: null, rep: null, prio: null, tags: [], list: null, remind: null, dur: null, tokens: [] };
  if (!text || !text.trim()) return r;
  let s = ' ' + text + ' ';
  const B = '(?<=[\\s,(])', E = '(?=[\\s,.;!?)])';
  const take = (rx, fn, kind) => {
    const re = new RegExp(B + rx + E, 'iu');
    const m = s.match(re);
    if (!m) return false;
    const ok = fn(m);
    if (ok === false) return false;
    r.tokens.push({ kind, text: m[0].trim() });
    s = s.slice(0, m.index) + ' ' + s.slice(m.index + m[0].length);
    return true;
  };
  const wdNum = w => NLP_WD[norm(w).replace(/s$/, '').replace('-feira', '').replace(/-feiras$/, '')];
  const nextWd = (w, strict) => { const d = pd(T).getDay(); let k = (w - d + 7) % 7; if (k === 0 && strict) k = 7; return addD(T, k); };

  /* prioridade */
  take('(?:!|p)(1|2|3|alta|m[eé]dia|baixa)', m => { const v = norm(m[1]); r.prio = { '1': 3, alta: 3, '2': 2, media: 2, '3': 1, baixa: 1 }[v]; }, 'prio');
  take('prioridade (alta|m[eé]dia|baixa)', m => { r.prio = { alta: 3, media: 2, baixa: 1 }[norm(m[1])]; }, 'prio');
  /* etiquetas e lista */
  let guard = 0;
  while (guard++ < 10 && take('#([\\p{L}\\p{N}_\\-/]+)', m => { r.tags.push(m[1]); }, 'tag'));
  take('[~^]([\\p{L}\\p{N}_\\-]+)', m => { r.list = m[1]; }, 'list');
  /* lembrete e duração */
  take('lembrar (\\d+) ?(min|minutos?|h|horas?|dias?) antes', m => { const k = norm(m[2])[0]; r.remind = +m[1] * (k === 'h' ? 60 : k === 'd' ? 1440 : 1); }, 'remind');
  take('por (\\d+) ?(min|minutos?|h|horas?)', m => { r.dur = +m[1] * (norm(m[2])[0] === 'h' ? 60 : 1); }, 'dur');
  /* repetição */
  take('(?:todos os |todo )?dias [uú]teis|de segunda a sexta', () => { r.rep = { f: 'w', n: 1, wd: [1, 2, 3, 4, 5] }; }, 'rep');
  take('a cada (\\d+) (dias?|semanas?|m[eê]s(?:es)?|anos?)', m => { const k = norm(m[2])[0]; r.rep = { f: { d: 'd', s: 'w', m: 'm', a: 'y' }[k], n: +m[1] }; }, 'rep');
  take('tod[ao]s? (?:as |os )?' + WDRX + '((?:(?:,| e) ?' + WDRX + ')*)', m => {
    const all = (m[0].match(new RegExp(WDRX, 'giu')) || []).map(wdNum).filter(x => x != null);
    if (!all.length) return false;
    r.rep = { f: 'w', n: 1, wd: [...new Set(all)].sort() };
  }, 'rep');
  take('todo dia (\\d{1,2})', m => { const d = +m[1]; if (d < 1 || d > 31) return false; r.rep = { f: 'm', n: 1, md: d }; const cur = pd(T); let dt = new Date(cur.getFullYear(), cur.getMonth(), d); if (ymd(dt) < T) dt = new Date(cur.getFullYear(), cur.getMonth() + 1, d); r.date = ymd(dt); }, 'rep');
  take('todos os dias|todo dia|diariamente|cada dia', () => { r.rep = { f: 'd', n: 1 }; }, 'rep');
  take('toda semana|todas as semanas|semanalmente', () => { r.rep = { f: 'w', n: 1 }; }, 'rep');
  take('todo m[eê]s|todos os meses|mensalmente', () => { r.rep = { f: 'm', n: 1 }; }, 'rep');
  take('todo ano|todos os anos|anualmente', () => { r.rep = { f: 'y', n: 1 }; }, 'rep');
  /* horários */
  const tm = (h, mi) => { h = +h; mi = +(mi || 0); if (h > 23 || mi > 59) return null; return pad(h) + ':' + pad(mi); };
  take('(?:d[ao]s? |de )?(\\d{1,2})(?:[:h](\\d{2}))?h? ?(?:[àa]s|at[eé]|-|a) ?(\\d{1,2})(?:[:h](\\d{2}))?h', m => {
    const a = tm(m[1], m[2]), b = tm(m[3], m[4]); if (!a || !b) return false; r.time = a; r.end = b;
  }, 'time');
  if (!r.time) take('(?:[àaá]s |a partir das )?(\\d{1,2})(?::(\\d{2})|h(\\d{2})?(?:min)?)', m => { const a = tm(m[1], m[2] || m[3]); if (!a) return false; r.time = a; }, 'time');
  if (!r.time) take('[àaá]s (\\d{1,2})', m => { const a = tm(m[1]); if (!a) return false; r.time = a; }, 'time');
  if (!r.time) take('meio[- ]dia', () => { r.time = '12:00'; }, 'time');
  if (!r.time) take('meia[- ]noite', () => { r.time = '00:00'; }, 'time');
  if (!r.time) take('(?:de|pela|na|[àa]) manh[aã]', () => { r.time = '09:00'; }, 'time');
  if (!r.time) take('(?:de|pela|na|[àa]) tarde', () => { r.time = '15:00'; }, 'time');
  if (!r.time) take('(?:de|pela|na|[àa]) noite', () => { r.time = '20:00'; }, 'time');
  /* datas */
  if (!r.date) take('depois de amanh[aã]', () => { r.date = addD(T, 2); }, 'date');
  if (!r.date) take('amanh[aã]', () => { r.date = addD(T, 1); }, 'date');
  if (!r.date) take('hoje', () => { r.date = T; }, 'date');
  if (!r.date) take('(?:em|daqui a|daqui) (\\d+) (dias?|semanas?|m[eê]s(?:es)?)', m => { const k = norm(m[2])[0]; r.date = k === 'd' ? addD(T, +m[1]) : k === 's' ? addD(T, 7 * m[1]) : addM(T, +m[1]); }, 'date');
  if (!r.date) take('(?:na )?(?:semana que vem|pr[oó]xima semana)', () => { r.date = addD(sow(T), 7 + (weekStart() === 0 ? 1 : 0)); }, 'date');
  if (!r.date) take('(?:no )?(?:m[eê]s que vem|pr[oó]ximo m[eê]s)', () => { r.date = addM(T, 1); }, 'date');
  if (!r.date) take('(?:no )?(?:fim de semana|fds)', () => { r.date = nextWd(6, false); }, 'date');
  if (!r.date) take('(?:no )?fim do m[eê]s', () => { const d = pd(T); r.date = ymd(new Date(d.getFullYear(), d.getMonth() + 1, 0)); }, 'date');
  if (!r.date) take('(?:dia )?(\\d{1,2})/(\\d{1,2})(?:/(\\d{2,4}))?', m => {
    const d = +m[1], mo = +m[2] - 1; if (d < 1 || d > 31 || mo < 0 || mo > 11) return false;
    let y = m[3] ? +m[3] : pd(T).getFullYear(); if (y < 100) y += 2000;
    let dt = new Date(y, mo, d); if (!m[3] && ymd(dt) < T) dt = new Date(y + 1, mo, d); r.date = ymd(dt);
  }, 'date');
  if (!r.date) take('(?:dia )?(\\d{1,2}) de (janeiro|fevereiro|mar[cç]o|abril|maio|junho|julho|agosto|setembro|outubro|novembro|dezembro)(?: de (\\d{4}))?', m => {
    const d = +m[1], mo = NLP_MON[norm(m[2])]; let y = m[3] ? +m[3] : pd(T).getFullYear();
    let dt = new Date(y, mo, d); if (!m[3] && ymd(dt) < T) dt = new Date(y + 1, mo, d); r.date = ymd(dt);
  }, 'date');
  if (!r.date) take('(?:(?:na|no|nesta|neste|pr[oó]xim[ao]|n[ao] pr[oó]xim[ao]) )?' + WDRX + '( que vem)?', m => {
    const w = wdNum(m[1]); if (w == null) return false; r.date = nextWd(w, true); if (m[2]) { /* "sexta que vem" */ if (diffD(T, r.date) < 7 && /que vem/.test(m[0]) && pd(T).getDay() < w) r.date = addD(r.date, 7); }
  }, 'date');
  if (!r.date) take('dia (\\d{1,2})', m => { const d = +m[1]; if (d < 1 || d > 31) return false; const c = pd(T); let dt = new Date(c.getFullYear(), c.getMonth(), d); if (ymd(dt) < T) dt = new Date(c.getFullYear(), c.getMonth() + 1, d); r.date = ymd(dt); }, 'date');

  /* combinações */
  if (r.rep && !r.date) {
    if (r.rep.f === 'w' && r.rep.wd && r.rep.wd.length) r.date = firstOcc(r.rep, T);
    else r.date = T;
  }
  if (r.rep && r.rep.f === 'w' && !r.rep.wd && r.date) r.rep.wd = [pd(r.date).getDay()];
  if (r.rep && r.rep.f === 'w' && r.rep.wd && r.rep.wd.length && r.date && !r.rep.wd.includes(pd(r.date).getDay())) r.date = firstOcc(r.rep, r.date);
  if ((r.time || r.end) && !r.date) r.date = T;
  if (r.dur && r.time && !r.end) { const d = pd(r.date + 'T' + r.time); d.setMinutes(d.getMinutes() + r.dur); r.end = hm(d); }
  r.title = s.replace(/\s{2,}/g, ' ').trim();
  if (!r.title) r.title = text.trim();
  return r;
}
function smartTokensHtml(p) {
  const out = [];
  if (p.date) out.push(`<span class="tok date">${ic('cal', 14)}${esc(fmtDay(p.date))}${p.time ? ' ' + p.time : ''}${p.end ? '–' + p.end : ''}</span>`);
  else if (p.time) out.push(`<span class="tok date">${ic('clock', 14)}${p.time}</span>`);
  if (p.rep) out.push(`<span class="tok rep">${ic('repeat', 14)}${esc(repText(p.rep))}</span>`);
  if (p.prio) out.push(`<span class="tok p${p.prio}">${ic('flag', 14)}${['', 'Baixa', 'Média', 'Alta'][p.prio]}</span>`);
  p.tags.forEach(t => out.push(`<span class="tok tag">${ic('tag', 14)}${esc(t)}</span>`));
  if (p.list) out.push(`<span class="tok list">${ic('list', 14)}${esc(p.list)}</span>`);
  if (p.remind) out.push(`<span class="tok">${ic('bell', 14)}${fmtDur(p.remind)} antes</span>`);
  return out.join('');
}

/* ---------- dados ----------
   t tarefas · l listas · f pastas · g etiquetas · d documentos · h hábitos · p sessões de foco · s configurações */
const KINDS = ['t', 'l', 'f', 'g', 'd', 'h', 'p'];
const COLORS = ['#DB4035', '#E8803A', '#D9A21B', '#7EA04D', '#2E9E6B', '#1E8E9E', '#3B7DD8', '#5B5BD6', '#9150C8', '#C84E9C', '#8A6A55', '#808080'];
const PRIO = [{ n: 'Nenhuma', c: 'var(--mut)' }, { n: 'Baixa', c: '#3B7DD8' }, { n: 'Média', c: '#E8803A' }, { n: 'Alta', c: '#DB4035' }];
const DEF_S = () => ({ id: 'cfg', theme: 'auto', weekStart: 0, defList: 'inbox', keepText: false, side: true, pomo: { focus: 25, short: 5, long: 15, every: 4, auto: false, sound: true }, gClient: '', gCals: null, gTaskCal: '', gPush: true, hideDone: true, compact: false, u: 0 });
let db = null;
function blank() { return { t: [], l: [], f: [], g: [], d: [], h: [], p: [], s: DEF_S(), v: 1 }; }
function loadDb() {
  try { db = JSON.parse(localStorage.getItem('tt_db') || 'null'); } catch (e) { db = null; }
  if (!db) { db = blank(); seed(); KINDS.forEach(k => db[k].forEach(x => x.sd = 1)); }
  KINDS.forEach(k => db[k] = db[k] || []);
  db.s = Object.assign(DEF_S(), db.s || {});
  db.s.pomo = Object.assign(DEF_S().pomo, db.s.pomo || {});
  if (!db.l.some(l => l.id === 'inbox')) db.l.unshift({ id: 'inbox', name: 'Caixa de entrada', color: '#808080', view: 'list', sec: [], o: -1, u: 0 });
  purgeTrash();
  IX = null;
}
const saveLocal = debounce(() => { try { localStorage.setItem('tt_db', JSON.stringify(db)); } catch (e) { toast('Armazenamento do aparelho cheio'); } }, 250);
const listeners = [];
const onData = fn => listeners.push(fn);
let IX = null;
function ix() {
  if (IX) return IX;
  IX = {};
  KINDS.forEach(k => { const m = new Map(); db[k].forEach(x => m.set(x.id, x)); IX[k] = m; });
  return IX;
}
const get = (k, id) => ix()[k].get(id);
function changed(local = true) { IX = null; saveLocal(); listeners.forEach(f => { try { f(local); } catch (e) { console.error(e); } }); }
function put(k, o, opt = {}) {
  if (!o.id) o.id = uid();
  if (!opt.keepU) o.u = Date.now();
  if (k === 's') { db.s = o; changed(); return o; }
  const arr = db[k], i = arr.findIndex(x => x.id === o.id);
  if (i >= 0) arr[i] = o; else arr.push(o);
  if (!opt.silent) changed();
  return o;
}
function putMany(k, list) { list.forEach(o => put(k, o, { silent: true })); changed(); }
function hardDel(k, id) { db[k] = db[k].filter(x => x.id !== id); changed(); }
const clone = o => JSON.parse(JSON.stringify(o));
function purgeTrash() {
  const lim = Date.now() - 30 * 864e5;
  db.t = db.t.filter(t => !(t.del && t.del < lim));
  db.d = db.d.filter(d => !(d.del && d.del < lim));
}

/* ---------- tarefas ---------- */
const listOf = t => get('l', t.list) || get('l', 'inbox');
const tDate = t => dOnly(t.due || t.start || '');
const live = t => !t.del && !t.done;
const overdue = t => live(t) && t.due && dOnly(t.due) < today();
const subsOf = id => db.t.filter(x => x.par === id && !x.del);
function newTask(o = {}) {
  const T = Object.assign({ id: uid(), title: '', notes: '', list: db.s.defList || 'inbox', sec: null, prio: 0, tags: [], start: null, due: null, rep: null, rem: [], chk: [], par: null, att: [], ln: { d: [], t: [] }, done: false, dt: null, del: null, c: Date.now(), o: Date.now(), hist: [] }, o);
  if (!get('l', T.list)) T.list = 'inbox';
  return T;
}
function tagIdsFromNames(names) {
  return names.map(n => {
    let g = db.g.find(x => norm(x.name) === norm(n));
    if (!g) g = put('g', { id: uid(), name: n.replace(/^#/, ''), color: COLORS[db.g.length % COLORS.length] }, { silent: true });
    return g.id;
  });
}
function listIdFromName(n) {
  if (!n) return null;
  const s = slug(n);
  const l = db.l.find(x => !x.arch && slug(x.name) === s) || db.l.find(x => !x.arch && slug(x.name).startsWith(s));
  return l ? l.id : null;
}
function taskFromSmart(text, base = {}) {
  const p = parseSmart(text);
  const o = Object.assign({}, base);
  o.title = db.s.keepText ? text.trim() : p.title;
  if (p.date) {
    if (p.end && p.time) { o.start = p.date + 'T' + p.time; o.due = p.date + 'T' + p.end; }
    else o.due = withT(p.date, p.time);
  }
  if (p.rep) o.rep = p.rep;
  if (p.prio) o.prio = p.prio;
  if (p.tags.length) o.tags = [...new Set([...(o.tags || []), ...tagIdsFromNames(p.tags)])];
  const lid = listIdFromName(p.list); if (lid) o.list = lid;
  if (p.remind != null) o.rem = [p.remind];
  else if (o.due && tOnly(o.due) && !(o.rem && o.rem.length)) o.rem = [0];
  return newTask(o);
}
function completeTask(t, val = !t.done) {
  const before = clone(t);
  if (val && t.rep && (t.due || t.start)) {
    const base = t.rep.from === 'done' ? today() + (tOnly(t.due) ? 'T' + tOnly(t.due) : '') : (t.due || t.start);
    const nx = nextOcc(t.rep, base);
    t.hist = (t.hist || []).concat([{ d: tDate(t), at: Date.now() }]);
    if (nx) {
      const span = t.start && t.due ? pd(t.due) - pd(t.start) : 0;
      if (t.due) t.due = nx; else t.start = nx;
      if (t.start && span) { const s = pd(t.due); s.setTime(s.getTime() - span); t.start = tOnly(t.start) ? ymd(s) + 'T' + hm(s) : ymd(s); }
      t.chk = (t.chk || []).map(c => Object.assign(c, { done: false }));
      put('t', t);
      return { repeated: true, before, next: nx };
    }
  }
  t.done = val; t.dt = val ? Date.now() : null;
  put('t', t);
  if (val) subsOf(t.id).forEach(s => { if (!s.done) { s.done = true; s.dt = Date.now(); put('t', s, { silent: true }); } });
  return { before };
}
function sortTasks(a, b, mode) {
  mode = mode || 'date';
  const da = tDate(a) || '9999', db_ = tDate(b) || '9999';
  if (mode === 'prio' && a.prio !== b.prio) return b.prio - a.prio;
  if (mode === 'title') return a.title.localeCompare(b.title, 'pt');
  if (mode === 'manual') return (a.o || 0) - (b.o || 0);
  if (mode === 'created') return (b.c || 0) - (a.c || 0);
  if (da !== db_) return da < db_ ? -1 : 1;
  const ta = tOnly(a.due || a.start) || '99', tb = tOnly(b.due || b.start) || '99';
  if (ta !== tb) return ta < tb ? -1 : 1;
  if (a.prio !== b.prio) return b.prio - a.prio;
  return (a.o || 0) - (b.o || 0);
}
/* visões inteligentes */
const SMART = {
  inbox: { name: 'Caixa de entrada', icon: 'inbox', f: t => t.list === 'inbox' },
  today: { name: 'Hoje', icon: 'today', f: t => { const d = tDate(t); return d && d <= today() || (t.start && dOnly(t.start) <= today() && t.due && dOnly(t.due) >= today()); } },
  tomorrow: { name: 'Amanhã', icon: 'tomorrow', f: t => tDate(t) === addD(today(), 1) },
  week: { name: 'Próximos 7 dias', icon: 'week', f: t => { const d = tDate(t); return d && d <= addD(today(), 6); } },
  all: { name: 'Todas', icon: 'all', f: () => true },
  done: { name: 'Concluídas', icon: 'done', f: null },
  trash: { name: 'Lixeira', icon: 'trash', f: null },
};
/* ocorrências para o calendário (repetições expandidas) */
function occurrences(t, from, to) {
  const out = [], first = t.due || t.start;
  if (!first) return out;
  const span = t.start && t.due ? pd(t.due) - pd(t.start) : 0;
  let cur = t.due || t.start, k = 0;
  while (cur && dOnly(cur) <= to && k++ < 400) {
    if (dOnly(cur) >= from || (span && dOnly(cur) >= from)) out.push({ t, at: cur, start: span ? (() => { const s = pd(cur); s.setTime(s.getTime() - span); return tOnly(cur) ? ymd(s) + 'T' + hm(s) : ymd(s); })() : (t.start && !t.due ? cur : null), virt: k > 1 });
    if (!t.rep || t.done) break;
    cur = nextOcc(t.rep, cur);
  }
  return out;
}

/* ---------- interface básica compartilhada ---------- */
function toast(msg, act, fn, ms = 4200) {
  const el = $('#toast');
  el.innerHTML = `<span>${esc(msg)}</span>${act ? `<button class="tbtn">${esc(act)}</button>` : ''}`;
  el.classList.add('on');
  if (act) el.querySelector('button').onclick = () => { el.classList.remove('on'); fn(); };
  clearTimeout(toast.t); toast.t = setTimeout(() => el.classList.remove('on'), ms);
}
function download(name, data, type) {
  const blob = data instanceof Blob ? data : new Blob([data], { type: type || 'application/octet-stream' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob); a.download = name;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 8000);
}
const safeName = s => (String(s || 'arquivo').replace(/[\\/:*?"<>|]+/g, '').trim() || 'arquivo').slice(0, 80);

/* HTML seguro para notas e documentos */
const OK_TAGS = new Set(['B', 'STRONG', 'I', 'EM', 'U', 'S', 'STRIKE', 'CODE', 'A', 'SPAN', 'MARK', 'BR', 'SUB', 'SUP']);
function clean(html) {
  const tpl = document.createElement('template');
  tpl.innerHTML = String(html || '');
  const walk = n => {
    Array.from(n.childNodes).forEach(c => {
      if (c.nodeType === 3) return;
      if (c.nodeType !== 1) { c.remove(); return; }
      walk(c);
      if (c.tagName === 'DIV' || c.tagName === 'P') { c.after(document.createElement('br')); }
      if (!OK_TAGS.has(c.tagName)) { c.replaceWith(...c.childNodes); return; }
      const keep = {};
      if (c.tagName === 'A') { const h = c.getAttribute('href') || ''; if (/^(https?:|mailto:|tel:|#)/i.test(h)) keep.href = h; }
      if (c.tagName === 'SPAN' || c.tagName === 'MARK') {
        const st = c.getAttribute('style') || '', o = [];
        const col = st.match(/(?:^|;)\s*color:\s*([#a-z0-9(),.\s%]+)/i), bg = st.match(/background(?:-color)?:\s*([#a-z0-9(),.\s%]+)/i);
        if (col) o.push('color:' + col[1].trim()); if (bg) o.push('background:' + bg[1].trim());
        if (o.length) keep.style = o.join(';');
        ['data-date', 'data-ref', 'data-kind', 'class'].forEach(a => { const v = c.getAttribute(a); if (v && /^[\w\- :T]+$/.test(v)) keep[a] = v; });
        if (c.getAttribute('contenteditable') === 'false') keep.contenteditable = 'false';
      }
      Array.from(c.attributes).forEach(a => c.removeAttribute(a.name));
      Object.keys(keep).forEach(k => c.setAttribute(k, keep[k]));
      if (c.tagName === 'A') { c.setAttribute('target', '_blank'); c.setAttribute('rel', 'noopener'); }
    });
  };
  walk(tpl.content);
  const d = document.createElement('div'); d.appendChild(tpl.content);
  return d.innerHTML.replace(/(<br>)+$/, '');
}

/* dados de exemplo no primeiro uso */
function seed() {
  const T = today();
  db.l = [
    { id: 'inbox', name: 'Caixa de entrada', color: '#808080', view: 'list', sec: [], o: -1 },
    { id: 'l_pess', name: 'Pessoal', color: '#DB4035', view: 'list', sec: [], o: 1, folder: 'f_vida' },
    { id: 'l_casa', name: 'Casa', color: '#E8803A', view: 'board', sec: [{ id: 'k1', name: 'A fazer' }, { id: 'k2', name: 'Em andamento' }, { id: 'k3', name: 'Feito' }], o: 2, folder: 'f_vida' },
    { id: 'l_comp', name: 'Compras', color: '#2E9E6B', view: 'list', sec: [], o: 3, folder: 'f_vida' },
    { id: 'l_trab', name: 'Trabalho', color: '#3B7DD8', view: 'list', sec: [{ id: 's1', name: 'Esta semana' }, { id: 's2', name: 'Depois' }], o: 4 },
  ];
  db.f = [{ id: 'f_vida', name: 'Vida', o: 1, open: true }];
  db.g = [{ id: 'g1', name: 'urgente', color: '#DB4035' }, { id: 'g2', name: 'ligar', color: '#2E9E6B' }];
  const mk = o => db.t.push(newTask(Object.assign({ c: Date.now(), o: db.t.length }, o)));
  mk({ title: 'Bem-vindo! Toque numa tarefa para abrir os detalhes', list: 'inbox', notes: 'Experimente digitar: <b>Dentista amanhã às 15h #ligar !alta</b> no campo de adicionar tarefa.', due: T, prio: 2 });
  mk({ title: 'Pagar conta de energia', list: 'l_pess', due: addD(T, 3), prio: 3, tags: ['g1'] });
  mk({ title: 'Revisar orçamento do mês', list: 'l_pess', due: T + 'T20:00', rep: { f: 'm', n: 1, md: pd(T).getDate() }, prio: 2, rem: [0] });
  mk({ title: 'Marcar consulta de rotina', list: 'l_pess', due: addD(T, 1), tags: ['g2'] });
  mk({ title: 'Trocar filtro da geladeira', list: 'l_casa', sec: 'k1', due: addD(T, 2), prio: 1 });
  mk({ title: 'Organizar o armário', list: 'l_casa', sec: 'k2', prio: 2, chk: [{ id: 'c1', t: 'Separar roupas para doação', done: true }, { id: 'c2', t: 'Dobrar e guardar', done: false }] });
  mk({ title: 'Café', list: 'l_comp' });
  mk({ title: 'Frutas da semana', list: 'l_comp', rep: { f: 'w', n: 1, wd: [6] }, due: firstOcc({ f: 'w', n: 1, wd: [6] }, T) });
  mk({ title: 'Responder e-mails pendentes', list: 'l_trab', sec: 's1', due: T, prio: 2 });
  db.h = [
    { id: 'h1', name: 'Beber água', emoji: '💧', color: '#3B7DD8', goal: 8, unit: 'copos', freq: { t: 'daily' }, log: {}, c: Date.now(), o: 1 },
    { id: 'h2', name: 'Ler 20 minutos', emoji: '📖', color: '#2E9E6B', goal: 1, freq: { t: 'daily' }, log: {}, c: Date.now(), o: 2 },
    { id: 'h3', name: 'Caminhar', emoji: '🚶', color: '#E8803A', goal: 1, freq: { t: 'week', wd: [1, 3, 5] }, log: {}, c: Date.now(), o: 3 },
  ];
  db.d = [{
    id: 'd_guia', title: 'Guia rápido', icon: '📘', par: null, fav: true, c: Date.now(),
    style: { bg: 'paper', pat: 'none', font: 'sans', width: 'normal', cover: 'sunset' },
    b: [
      { id: 'b1', type: 'p', text: 'Este é um documento. Digite <b>/</b> em qualquer linha para inserir títulos, listas, tarefas, citações, destaques, tabelas, imagens e mais.' },
      { id: 'b2', type: 'h2', text: 'Experimente' },
      { id: 'b3', type: 'todo', text: 'Marcar este item como feito', checked: false },
      { id: 'b4', type: 'callout', text: 'Use @ para inserir datas, tarefas e outros documentos.', emoji: '💡', bg: 'yellow' },
      { id: 'b5', type: 'ul', text: 'Mude o fundo da página, a fonte e a capa no botão <b>Estilo</b>.' },
      { id: 'b6', type: 'ul', text: 'Exporte em PDF, Word, Markdown, HTML ou texto no botão <b>Exportar</b>.' },
    ]
  }];
}
