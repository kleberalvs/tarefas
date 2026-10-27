/* Sincronização com a nuvem (Supabase): login, envio só do que mudou, recebimento em tempo real.
   Cada tarefa, lista, pasta, etiqueta, documento, hábito e sessão de foco é um registro; cada conta só enxerga os seus. */
'use strict';
const CFG = window.TT_CFG || {};
const CLOUD = !!(CFG.url && CFG.key && window.supabase);
const APPV = '2026.10.27-1';
const TABLE = 'tarefas_registros';
let SB = null, SES = null, WHO = '', synced = {}, pushing = false, again = false, ptmr = null, chan = null;
const SYNC = { cls: 'local', txt: 'Modo local: dados só neste aparelho', icon: 'wifi' };
try { synced = JSON.parse(localStorage.getItem('tt_synced') || '{}'); } catch (e) { synced = {}; }
const persistSynced = () => { try { localStorage.setItem('tt_synced', JSON.stringify(synced)); } catch (e) {} };
function cj(o) {
  if (o === null || typeof o !== 'object') return JSON.stringify(o);
  if (Array.isArray(o)) return '[' + o.map(cj).join(',') + ']';
  return '{' + Object.keys(o).filter(k => o[k] !== undefined).sort().map(k => JSON.stringify(k) + ':' + cj(o[k])).join(',') + '}';
}
function recs() { const m = {}; KINDS.forEach(k => db[k].forEach(x => m[k + ':' + x.id] = x)); m['s:cfg'] = db.s; return m; }
const getRec = k => k === 's:cfg' ? db.s : get(k[0], k.slice(2));
function place(d, kind, x) {
  if (kind === 's') { const keep = { side: d.s.side, theme: d.s.theme }; d.s = Object.assign(DEF_S(), x); if (d === db) Object.assign(d.s, keep); return; }
  if (!d[kind]) return;
  const i = d[kind].findIndex(q => q.id === x.id);
  if (i >= 0) d[kind][i] = x; else d[kind].push(x);
}
function drop(d, kind, id) { if (d[kind] && kind !== 's') d[kind] = d[kind].filter(q => q.id !== id); }
function setSync(s, t) {
  const map = { local: ['local', 'Modo local: dados só neste aparelho', 'wifi'], ok: ['ok', 'Sincronizado', 'check'], busy: ['busy', 'Sincronizando…', 'sync'], pend: ['pend', 'Alterações pendentes', 'sync'], off: ['off', 'Sem internet: salvo no aparelho', 'wifi'], err: ['err', 'Falha ao sincronizar', 'info'] }[s];
  SYNC.cls = map[0]; SYNC.txt = t || map[1]; SYNC.icon = map[2];
  const e = $('#sync'); if (e) { e.className = 'sync ' + SYNC.cls; e.title = SYNC.txt; e.innerHTML = ic(SYNC.icon, 16); }
  const e2 = $('#syncline'); if (e2) e2.textContent = SYNC.txt;
}
function schedPush() {
  if (!CLOUD || !SES) return;
  setSync(navigator.onLine ? 'pend' : 'off');
  clearTimeout(ptmr); ptmr = setTimeout(push, 1000);
}
async function push() {
  if (!CLOUD || !SES) return;
  if (!navigator.onLine) { setSync('off'); return; }
  if (pushing) { again = true; return; }
  pushing = true; setSync('busy');
  try {
    const cur = recs(), up = [], js = {};
    for (const k in cur) { const j = cj(cur[k]); if (synced[k] !== j) { up.push(k); js[k] = j; } }
    const del = Object.keys(synced).filter(k => !(k in cur));
    for (let i = 0; i < up.length; i += 100) {
      const ch = up.slice(i, i + 100);
      const { error } = await SB.from(TABLE).upsert(ch.map(k => ({ user_id: SES.user.id, kind: k[0], id: k.slice(2), data: cur[k] })), { onConflict: 'user_id,kind,id' });
      if (error) throw error;
      ch.forEach(k => synced[k] = js[k]);
    }
    const by = {};
    del.forEach(k => (by[k[0]] = by[k[0]] || []).push(k.slice(2)));
    for (const kd in by) for (let i = 0; i < by[kd].length; i += 100) {
      const ids = by[kd].slice(i, i + 100);
      const { error } = await SB.from(TABLE).delete().eq('user_id', SES.user.id).eq('kind', kd).in('id', ids);
      if (error) throw error;
      ids.forEach(id => delete synced[kd + ':' + id]);
    }
    persistSynced(); setSync('ok');
  } catch (e) {
    console.warn('push', e);
    setSync('err', /relation|does not exist|schema cache/i.test(e.message || '') ? 'Banco não configurado: rode o arquivo SQL no Supabase' : 'Falha ao enviar · tentando de novo');
    setTimeout(schedPush, 15000);
  } finally { pushing = false; if (again) { again = false; schedPush(); } }
}
async function fetchAll() {
  let all = [], from = 0;
  for (;;) {
    const { data, error } = await SB.from(TABLE).select('kind,id,data').eq('user_id', SES.user.id).order('kind').order('id').range(from, from + 999);
    if (error) throw error;
    all = all.concat(data);
    if (data.length < 1000) break;
    from += 1000;
  }
  return all;
}
async function pull() {
  const rows = await fetchAll(), rm = {};
  rows.forEach(r => rm[r.kind + ':' + r.id] = r.data);
  const first = !Object.keys(synced).length;
  if (first && rows.length) {
    /* primeiro acesso neste aparelho: dados de exemplo saem, o resto é mesclado (vale o mais recente) */
    KINDS.forEach(k => db[k] = db[k].filter(x => !x.sd));
    rows.forEach(r => { const k = r.kind + ':' + r.id, l = getRec(k); if (!l || r.kind === 's' || (r.data.u || 0) >= (l.u || 0)) place(db, r.kind, r.data); synced[k] = cj(r.data); });
    if (!db.l.some(l => l.id === 'inbox')) db.l.unshift({ id: 'inbox', name: 'Caixa de entrada', color: '#808080', view: 'list', sec: [], o: -1, u: 0 });
    persistSynced(); IX = null; saveLocal(); render(true); schedPush(); return;
  }
  if (first) { KINDS.forEach(k => db[k].forEach(x => { if (x.sd) delete x.sd; })); }
  const cur = recs(), cjl = {};
  for (const k in cur) cjl[k] = cj(cur[k]);
  for (const k in rm) {
    const rj = cj(rm[k]), lj = cjl[k];
    if (lj === rj) { synced[k] = rj; continue; }
    if (lj === undefined) { if (synced[k] === undefined) { place(db, k[0], rm[k]); synced[k] = rj; } continue; }
    if (synced[k] === lj) { place(db, k[0], rm[k]); synced[k] = rj; }
  }
  for (const k in synced) {
    if (k in rm) continue;
    if (k in cjl) { if (synced[k] === cjl[k]) { drop(db, k[0], k.slice(2)); delete synced[k]; } }
    else delete synced[k];
  }
  persistSynced(); IX = null; saveLocal(); render(); schedPush();
}
function subscribe() {
  if (chan) return;
  chan = SB.channel('tt-' + SES.user.id).on('postgres_changes', { event: '*', schema: 'public', table: TABLE, filter: 'user_id=eq.' + SES.user.id }, onRemote).subscribe(st => { if (st === 'SUBSCRIBED') pullSafe(); });
}
function onRemote(pl) {
  let ch = false;
  if (pl.eventType === 'DELETE') {
    const o = pl.old || {}; if (o.user_id && o.user_id !== SES.user.id) return;
    const k = o.kind + ':' + o.id, l = o.kind ? getRec(k) : null;
    if (l && (synced[k] === undefined || cj(l) === synced[k])) { drop(db, o.kind, o.id); ch = true; }
    delete synced[k];
  } else {
    const r = pl.new; if (!r || r.user_id !== SES.user.id) return;
    const k = r.kind + ':' + r.id, l = getRec(k), rj = cj(r.data);
    if (l && cj(l) === rj) { synced[k] = rj; persistSynced(); return; }
    if (l && synced[k] !== undefined && cj(l) !== synced[k]) return;   /* editado aqui e ainda não enviado: vale a edição local */
    place(db, r.kind, r.data); synced[k] = rj; ch = true;
  }
  persistSynced();
  if (ch) { IX = null; saveLocal(); if (r_isOpenDocEditing(pl)) return; render(); }
}
function r_isOpenDocEditing(pl) {
  const r = pl.new || pl.old || {};
  if (r.kind === 'd' && R.v === 'doc' && R.id === r.id) {
    const a = document.activeElement;
    if (a && a.closest && a.closest('#blocks, .ptitle')) return true;
    if (r.data) ED.doc = get('d', r.id);
  }
  return false;
}
async function pullSafe() { try { await pull(); setSync('ok'); } catch (e) { console.warn('pull', e); setSync(navigator.onLine ? 'err' : 'off', /relation|does not exist|schema cache/i.test(e.message || '') ? 'Banco não configurado: rode o arquivo SQL no Supabase' : null); } }
const unlock = () => document.documentElement.classList.remove('lock');
async function startSync() {
  if (!CLOUD) { unlock(); setSync('local'); return; }
  SB = window.supabase.createClient(CFG.url, CFG.key, { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false, storageKey: 'tt-auth' } });
  let s = null;
  try { s = (await SB.auth.getSession()).data.session; } catch (e) {}
  if (s) return enter(s);
  if (localStorage.getItem('tt_local') === '1') { unlock(); setSync('local'); return; }
  if (!navigator.onLine && localStorage.getItem('tt_who')) { WHO = localStorage.getItem('tt_who'); unlock(); setSync('off'); return; }
  showLogin();
}
async function enter(s) {
  SES = s; WHO = (s.user && s.user.email) || '';
  try { localStorage.setItem('tt_who', WHO); localStorage.removeItem('tt_local'); } catch (e) {}
  const prev = localStorage.getItem('tt_uid');
  if (prev && prev !== s.user.id) { synced = {}; persistSynced(); }
  localStorage.setItem('tt_uid', s.user.id);
  unlock(); const l = $('#login'); if (l) l.remove();
  setSync('busy');
  try { subscribe(); } catch (e) { console.warn('realtime', e); }
  await pullSafe();
  schedPush();
  FILES.flush().catch(() => {});
  SB.auth.onAuthStateChange((ev, ses) => { if (ses) SES = ses; if (ev === 'SIGNED_OUT') { SES = null; } });
  render(true);
}
function showLogin() {
  if ($('#login')) return;
  const d = document.createElement('div'); d.id = 'login';
  d.innerHTML = `<form class="lcard"><div class="lic">${ic('check', 34)}</div><h1>Tarefas</h1><p class="mut">Entre para sincronizar seu celular e seu computador.</p>
    <label class="lab">E-mail<input class="in" type="email" id="lg_e" autocomplete="username" required></label>
    <label class="lab">Senha<input class="in" type="password" id="lg_s" autocomplete="current-password" required></label>
    <button class="btn red big" id="lg_b">Entrar</button><p id="lg_m" class="err"></p>
    <button type="button" class="link" id="lg_local">Usar sem conta (só neste aparelho)</button></form>`;
  document.body.appendChild(d);
  d.querySelector('#lg_local').onclick = () => { localStorage.setItem('tt_local', '1'); d.remove(); unlock(); setSync('local'); render(true); };
  d.querySelector('form').onsubmit = async ev => {
    ev.preventDefault();
    const b = $('#lg_b'); b.disabled = true; b.textContent = 'Entrando…'; $('#lg_m').textContent = '';
    try {
      const { data, error } = await SB.auth.signInWithPassword({ email: $('#lg_e').value.trim(), password: $('#lg_s').value });
      if (error) throw error;
      await enter(data.session);
    } catch (e) {
      b.disabled = false; b.textContent = 'Entrar';
      $('#lg_m').textContent = /invalid|credentials/i.test(e.message || '') ? 'E-mail ou senha incorretos.' : navigator.onLine ? 'Não foi possível entrar: ' + (e.message || 'erro') : 'Sem conexão com a internet.';
    }
  };
}
async function signOut() {
  if (!(await confirmBox('Sair da conta?', 'Os dados continuam na nuvem. Neste aparelho, o app volta para a tela de entrada.', 'Sair'))) return;
  try { await SB.auth.signOut(); } catch (e) {}
  if (chan) { SB.removeChannel(chan); chan = null; }
  SES = null; WHO = ''; synced = {}; persistSynced();
  localStorage.removeItem('tt_who'); localStorage.removeItem('tt_db'); localStorage.removeItem('tt_uid');
  location.reload();
}
function goLogin() { localStorage.removeItem('tt_local'); if (!SB) location.reload(); else showLogin(); }
addEventListener('online', () => { if (SES) { pullSafe(); schedPush(); FILES.flush().catch(() => {}); } });
addEventListener('offline', () => { if (SES) setSync('off'); });
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible' && SES) pullSafe(); });
