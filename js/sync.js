/* Sincronização com a nuvem (Supabase): login, envio só do que mudou, recebimento em tempo real.
   Cada tarefa, lista, pasta, etiqueta, documento, hábito e sessão de foco é um registro; cada conta só enxerga os seus. */
'use strict';
const CFG = window.TT_CFG || {};
const CLOUD = !!(CFG.url && CFG.key && window.supabase);
const APPV = '2026.10.30-105';
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
  if (d === db && typeof snapSet === 'function') snapSet(kind, x);
  if (kind === 's') { const keep = { side: d.s.side }; d.s = Object.assign(DEF_S(), x); if (d === db) { Object.assign(d.s, keep); if (typeof applyTheme === 'function') applyTheme(); if (typeof petsSync === 'function') setTimeout(petsSync); } return; }
  if (!d[kind]) return;
  const i = d[kind].findIndex(q => q.id === x.id);
  if (i >= 0) d[kind][i] = x; else d[kind].push(x);
}
function drop(d, kind, id) { if (d === db && typeof snapDel === 'function') snapDel(kind, id); if (d[kind] && kind !== 's') d[kind] = d[kind].filter(q => q.id !== id); }
function setSync(s, t) {
  const map = { local: ['local', 'Modo local: dados só neste aparelho', 'wifi'], ok: ['ok', 'Sincronizado', 'check'], busy: ['busy', 'Sincronizando…', 'sync'], pend: ['pend', 'Alterações pendentes', 'sync'], off: ['off', 'Sem internet: salvo no aparelho', 'wifi'], err: ['err', 'Falha ao sincronizar', 'info'] }[s];
  SYNC.cls = map[0]; SYNC.txt = t || map[1]; SYNC.icon = map[2];
  const e = $('#sync'); if (e) { e.className = 'sdot ' + SYNC.cls; e.title = SYNC.txt; }
  ['#syncline', '#syncline2'].forEach(x => { const e2 = $(x); if (e2) e2.textContent = SYNC.txt; });
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
    const m = (e && (e.message || e.code)) || 'erro';
    setSync('err', (/relation|does not exist|schema cache/i.test(m) ? 'Banco não configurado' : 'Falha ao enviar · tentando de novo') + ' (' + String(m).slice(0, 140) + ')');
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
    persistSynced(); IX = null; saveLocal(); if (typeof initSnap === 'function') initSnap(); render(true); schedPush(); return;
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
async function pullSafe() { try { await pull(); setSync('ok'); } catch (e) { console.warn('pull', e); const m = (e && (e.message || e.code)) || 'erro'; setSync(navigator.onLine ? 'err' : 'off', (/relation|does not exist|schema cache/i.test(m) ? 'Banco não configurado' : 'Falha ao sincronizar') + ' (' + String(m).slice(0, 140) + ')'); } }
const unlock = () => document.documentElement.classList.remove('lock');
async function startSync() {
  if (!CLOUD) { unlock(); setSync('local'); return; }
  const recovery = /type=recovery/.test(location.hash);
  SB = window.supabase.createClient(CFG.url, CFG.key, { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true, flowType: 'implicit', storageKey: 'tt-auth2' } });
  SB.auth.onAuthStateChange((ev, ses) => { if (ev === 'PASSWORD_RECOVERY') { unlock(); showNewPassword(); } if (ses) SES = ses; });
  let s = null;
  try { s = (await SB.auth.getSession()).data.session; } catch (e) {}
  if (recovery) { unlock(); showNewPassword(); return; }
  if (/error_description=/.test(location.hash)) { const m = decodeURIComponent((location.hash.match(/error_description=([^&]+)/) || [])[1] || '').replace(/\+/g, ' '); history.replaceState(null, '', location.pathname); showLogin(/expired|invalid/i.test(m) ? 'O link expirou. Peça um novo em "Esqueceu a senha?".' : m); return; }
  if (s) return enter(s);
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
  checkAdmin();
  if (typeof pushRefresh === 'function') pushRefresh();
  render(true);
}
const LOGO_SVG = '<svg class="lgmark" viewBox="0 0 64 64" aria-hidden="true"><rect x="4" y="4" width="56" height="56" rx="15" class="lgbg"/><g transform="translate(32 32) scale(.875) translate(-32 -32)"><circle cx="32" cy="32" r="17" class="lgtrk"/><path d="M32 15a17 17 0 1 1-17 17" class="lgarc"/><path d="M25.5 32.5l4.5 4.5 9-10" class="lgchk"/></g></svg>';
function loginShell(inner) {
  let d = $('#login');
  if (!d) { d = document.createElement('div'); d.id = 'login'; document.body.appendChild(d); }
  d.innerHTML = `<div class="lhero"><div class="lhin">${LOGO_SVG}<h2>Tarefas</h2><p>Seu dia organizado, com calma.</p></div><span class="lorb o1"></span><span class="lorb o2"></span><span class="lorb o3"></span></div><div class="lform"><div class="lcard">${inner}</div></div>`;
  return d;
}
function showLogin(msg) {
  const d = loginShell(`<h1>Bem-vindo de volta</h1><p class="mut">Entre com seu e-mail e senha.</p>
    <form id="lgf"><label class="lab">E-mail<input class="in" type="email" id="lg_e" autocomplete="username" required value="${esc(localStorage.getItem('tt_who') || '')}"></label>
    <label class="lab">Senha<span class="pwbox"><input class="in" type="password" id="lg_s" autocomplete="current-password" required><button type="button" class="mini" data-eye aria-label="Mostrar senha">${ic('eye', 16)}</button></span></label>
    <button class="btn red big" id="lg_b">Entrar</button><p id="lg_m" class="err">${esc(msg || '')}</p></form>
    <button type="button" class="link" id="lg_forgot">Esqueceu a senha?</button>`);
  d.querySelector('[data-eye]').onclick = () => { const i = $('#lg_s'); i.type = i.type === 'password' ? 'text' : 'password'; };
  d.querySelector('#lg_forgot').onclick = () => showForgot($('#lg_e').value);
  d.querySelector('form').onsubmit = async ev => {
    ev.preventDefault();
    const b = $('#lg_b'); b.disabled = true; b.textContent = 'Entrando…'; $('#lg_m').textContent = '';
    try {
      const { data, error } = await SB.auth.signInWithPassword({ email: $('#lg_e').value.trim(), password: $('#lg_s').value });
      if (error) throw error;
      await enter(data.session);
    } catch (e) {
      b.disabled = false; b.textContent = 'Entrar';
      const m = e.message || '';
      $('#lg_m').textContent = /invalid|credentials/i.test(m) ? 'E-mail ou senha incorretos.' : /banned/i.test(m) ? 'Este acesso está bloqueado. Fale com o administrador.' : navigator.onLine ? 'Não foi possível entrar: ' + m : 'Sem conexão com a internet.';
    }
  };
}
function showForgot(email) {
  const d = loginShell(`<h1>Recuperar senha</h1><p class="mut">Informe seu e-mail. Vamos enviar um link para você criar uma senha nova.</p>
    <form><label class="lab">E-mail<input class="in" type="email" id="fg_e" required value="${esc(email || '')}"></label>
    <button class="btn red big" id="fg_b">Enviar link</button><p id="fg_m" class="err"></p></form>
    <button type="button" class="link" id="fg_back">Voltar para entrar</button>`);
  d.querySelector('#fg_back').onclick = () => showLogin();
  d.querySelector('form').onsubmit = async ev => {
    ev.preventDefault();
    const b = $('#fg_b'); b.disabled = true; b.textContent = 'Enviando…';
    try {
      const { error } = await SB.auth.resetPasswordForEmail($('#fg_e').value.trim(), { redirectTo: location.origin + location.pathname });
      if (error) throw error;
      d.querySelector('.lcard').innerHTML = `<div class="lic">${ic('check', 34)}</div><h1>Verifique seu e-mail</h1><p class="mut">Se esse e-mail tiver acesso, você vai receber um link em alguns minutos. Abra o link neste aparelho para criar a senha nova.</p><button class="btn red big" id="fg_ok">Voltar</button>`;
      $('#fg_ok').onclick = () => showLogin();
    } catch (e) { b.disabled = false; b.textContent = 'Enviar link'; $('#fg_m').textContent = /rate|limit/i.test(e.message || '') ? 'Muitos pedidos seguidos. Aguarde alguns minutos e tente de novo.' : 'Não foi possível enviar: ' + (e.message || 'erro'); }
  };
}
function showNewPassword() {
  const d = loginShell(`<h1>Crie uma senha nova</h1><p class="mut">Use pelo menos 8 caracteres.</p>
    <form><label class="lab">Senha nova<input class="in" type="password" id="np_1" autocomplete="new-password" minlength="8" required></label>
    <label class="lab">Repita a senha<input class="in" type="password" id="np_2" autocomplete="new-password" minlength="8" required></label>
    <button class="btn red big" id="np_b">Salvar senha</button><p id="np_m" class="err"></p></form>`);
  d.querySelector('form').onsubmit = async ev => {
    ev.preventDefault();
    if ($('#np_1').value !== $('#np_2').value) { $('#np_m').textContent = 'As senhas não são iguais.'; return; }
    const b = $('#np_b'); b.disabled = true;
    const { error } = await SB.auth.updateUser({ password: $('#np_1').value });
    if (error) { b.disabled = false; $('#np_m').textContent = 'Não foi possível salvar: ' + error.message; return; }
    history.replaceState(null, '', location.pathname + '#/l/today');
    const s = (await SB.auth.getSession()).data.session;
    toast('Senha alterada'); if (s) enter(s); else showLogin('Senha alterada. Entre com a senha nova.');
  };
}
async function changePassword() {
  const el = modal(`<h2>Alterar minha senha</h2><form><label class="lab">Senha nova<input class="in" type="password" name="a" minlength="8" required autocomplete="new-password" autofocus></label><label class="lab">Repita a senha nova<input class="in" type="password" name="b" minlength="8" required autocomplete="new-password"></label><p class="err" data-m></p><div class="row end"><button type="button" class="btn ghost" data-x>Cancelar</button><button class="btn red">Salvar</button></div></form>`);
  el.querySelector('[data-x]').onclick = closeModal;
  el.querySelector('form').onsubmit = async e => {
    e.preventDefault(); const f = e.target;
    if (f.a.value !== f.b.value) { el.querySelector('[data-m]').textContent = 'As senhas não são iguais.'; return; }
    const { error } = await SB.auth.updateUser({ password: f.a.value });
    if (error) { el.querySelector('[data-m]').textContent = 'Não foi possível alterar: ' + error.message; return; }
    closeModal(); toast('Senha alterada');
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
let IS_ADMIN = false, ADMIN_FREE = false, ADMIN_ERR = '';
async function checkAdmin() {
  ADMIN_ERR = '';
  try {
    const { data, error } = await SB.rpc('tarefas_sou_admin');
    if (error) { ADMIN_ERR = (/function|does not exist|schema cache|not find/i.test(error.message || '') ? 'O Supabase não encontrou as funções do app. ' : '') + 'Detalhe: ' + (error.message || error.code || 'erro'); throw error; }
    IS_ADMIN = !!data;
    if (!IS_ADMIN) { const r = await SB.rpc('tarefas_admin_livre'); ADMIN_FREE = !r.error && !!r.data; }
  } catch (e) { IS_ADMIN = false; ADMIN_FREE = false; }
  render();
}
addEventListener('online', () => { if (SES) { pullSafe(); schedPush(); FILES.flush().catch(() => {}); } });
addEventListener('offline', () => { if (SES) setSync('off'); });
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible' && SES) pullSafe(); });
