// Função "tarefas" (Supabase Edge Function)
// 1) Administração de usuários (só para administradores do app)
// 2) Notificações push: o agendador chama esta função a cada minuto e ela avisa os aparelhos
//    sobre lembretes de tarefas, hábitos, fim do Pomodoro e reuniões da agenda — mesmo com o app fechado.
// 3) Google Agenda pelo link secreto (iCal): baixa o arquivo da agenda para o app (o navegador não pode baixar direto).
// Segredos necessários (Edge Functions → Secrets): VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT, CRON_SECRET
import { createClient } from 'npm:@supabase/supabase-js@2';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-cron',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};
const json = (o: unknown, status = 200) => new Response(JSON.stringify(o), { status, headers: { ...CORS, 'Content-Type': 'application/json' } });
const env = (k: string) => Deno.env.get(k) || '';

/* ===== Web Push (RFC 8291 / 8292) com WebCrypto — sem bibliotecas externas ===== */
// [PUSH-INICIO]
const te = new TextEncoder();
function b64uDec(s: string) { s = s.replace(/-/g, '+').replace(/_/g, '/'); while (s.length % 4) s += '='; const b = atob(s); const u = new Uint8Array(b.length); for (let i = 0; i < b.length; i++) u[i] = b.charCodeAt(i); return u; }
function b64uEnc(u: Uint8Array) { let s = ''; for (let i = 0; i < u.length; i++) s += String.fromCharCode(u[i]); return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''); }
function cat(...a: Uint8Array[]) { const o = new Uint8Array(a.reduce((n, x) => n + x.length, 0)); let i = 0; for (const x of a) { o.set(x, i); i += x.length; } return o; }
async function hkdf(salt: Uint8Array, ikm: Uint8Array, info: Uint8Array, len: number) {
  const k = await crypto.subtle.importKey('raw', ikm, 'HKDF', false, ['deriveBits']);
  return new Uint8Array(await crypto.subtle.deriveBits({ name: 'HKDF', hash: 'SHA-256', salt, info }, k, len * 8));
}
async function encryptPayload(p256dh: string, authSecret: string, payload: Uint8Array) {
  const uaPub = b64uDec(p256dh), auth = b64uDec(authSecret);
  const as = await crypto.subtle.generateKey({ name: 'ECDH', namedCurve: 'P-256' }, true, ['deriveBits']) as CryptoKeyPair;
  const asPub = new Uint8Array(await crypto.subtle.exportKey('raw', as.publicKey));
  const uaKey = await crypto.subtle.importKey('raw', uaPub, { name: 'ECDH', namedCurve: 'P-256' }, false, []);
  const shared = new Uint8Array(await crypto.subtle.deriveBits({ name: 'ECDH', public: uaKey }, as.privateKey, 256));
  const ikm = await hkdf(auth, shared, cat(te.encode('WebPush: info\0'), uaPub, asPub), 32);
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const cek = await hkdf(salt, ikm, te.encode('Content-Encoding: aes128gcm\0'), 16);
  const nonce = await hkdf(salt, ikm, te.encode('Content-Encoding: nonce\0'), 12);
  const key = await crypto.subtle.importKey('raw', cek, 'AES-GCM', false, ['encrypt']);
  const ct = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv: nonce }, key, cat(payload, new Uint8Array([2]))));
  const head = new Uint8Array(21); head.set(salt, 0); new DataView(head.buffer).setUint32(16, 4096); head[20] = asPub.length;
  return cat(head, asPub, ct);
}
async function vapidAuth(endpoint: string, pub: string, priv: string, subject: string) {
  const p = b64uDec(pub);
  const jwk = { kty: 'EC', crv: 'P-256', d: priv, x: b64uEnc(p.slice(1, 33)), y: b64uEnc(p.slice(33, 65)), ext: true };
  const key = await crypto.subtle.importKey('jwk', jwk, { name: 'ECDSA', namedCurve: 'P-256' }, false, ['sign']);
  const u = new URL(endpoint);
  const h = b64uEnc(te.encode(JSON.stringify({ typ: 'JWT', alg: 'ES256' })));
  const c = b64uEnc(te.encode(JSON.stringify({ aud: u.protocol + '//' + u.host, exp: Math.floor(Date.now() / 1000) + 12 * 3600, sub: subject })));
  const sig = new Uint8Array(await crypto.subtle.sign({ name: 'ECDSA', hash: 'SHA-256' }, key, te.encode(h + '.' + c)));
  return `vapid t=${h}.${c}.${b64uEnc(sig)}, k=${pub}`;
}
async function buildPush(sub: { endpoint: string; p256dh: string; auth: string }, msg: unknown, keys: { pub: string; priv: string; subject: string }) {
  const body = await encryptPayload(sub.p256dh, sub.auth, te.encode(JSON.stringify(msg)));
  return { url: sub.endpoint, init: { method: 'POST', body, headers: { Authorization: await vapidAuth(sub.endpoint, keys.pub, keys.priv, keys.subject), 'Content-Encoding': 'aes128gcm', 'Content-Type': 'application/octet-stream', TTL: '86400', Urgency: 'high' } } };
}
// [PUSH-FIM]

/* hora local (sem fuso) → instante UTC, no fuso do usuário */
function zoned(dateStr: string, timeStr: string, tz: string) {
  const [y, m, d] = dateStr.split('-').map(Number), [hh, mm] = timeStr.split(':').map(Number);
  const guess = Date.UTC(y, m - 1, d, hh, mm);
  const off = (t: number) => { const p = Object.fromEntries(new Intl.DateTimeFormat('en-US', { timeZone: tz, hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }).formatToParts(new Date(t)).map(x => [x.type, x.value])); return Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour, +p.minute) - t; };
  let t = guess - off(guess); t = guess - off(t); return t;
}
function todayIn(tz: string, t = Date.now()) { const p = Object.fromEntries(new Intl.DateTimeFormat('en-US', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(new Date(t)).map(x => [x.type, x.value])); return `${p.year}-${p.month}-${p.day}`; }
const fmtMin = (m: number) => m >= 1440 ? `${Math.round(m / 1440)} dia(s)` : m >= 60 ? `${Math.round(m / 60)}h` : `${m} min`;

async function pushTick(admin: any) {
  const keys = { pub: env('VAPID_PUBLIC_KEY'), priv: env('VAPID_PRIVATE_KEY'), subject: env('VAPID_SUBJECT') || 'mailto:admin@example.com' };
  if (!keys.pub || !keys.priv) return { ok: false, error: 'VAPID não configurado' };
  const { data: subs } = await admin.from('tarefas_push').select('*');
  if (!subs || !subs.length) return { ok: true, sent: 0 };
  const byUser: Record<string, any[]> = {};
  subs.forEach((s: any) => (byUser[s.user_id] = byUser[s.user_id] || []).push(s));
  const now = Date.now(), from = now - 150000;
  let sent = 0;
  for (const uid of Object.keys(byUser)) {
    const tz = byUser[uid][0].tz || 'America/Sao_Paulo';
    const T = todayIn(tz);
    const { data: rows } = await admin.from('tarefas_registros').select('kind,id,data').eq('user_id', uid).in('kind', ['t', 'h', 'z', 's']);
    const due: { key: string; title: string; body: string; url: string; meet?: string; rec?: string }[] = [];
    for (const r of rows || []) {
      const x = r.data || {};
      if (r.kind === 't') {
        if (x.done || x.del || !Array.isArray(x.rem) || !x.rem.length) continue;
        const at = x.start && String(x.start).length > 10 ? x.start : x.due;
        if (!at || String(at).length <= 10) continue;
        const [dd, tt] = String(at).split('T');
        if (dd < todayIn(tz, now - 2 * 864e5)) continue;
        const base = zoned(dd, tt, tz);
        for (const m of x.rem) {
          const fire = base - (+m || 0) * 60000;
          if (fire > from && fire <= now) due.push({ key: `${uid}|t|${x.id}|${at}|${m}`, title: x.title || 'Tarefa', body: (+m ? `Começa em ${fmtMin(+m)} · ` : 'Agora · ') + tt.slice(0, 5), url: './#/l/today' });
        }
      } else if (r.kind === 'h') {
        if (x.arch || !x.rem) continue;
        const f = x.freq || { t: 'daily' };
        const wd = new Date(T + 'T12:00:00Z').getUTCDay();
        if (f.t === 'week' && !(f.wd || []).includes(wd)) continue;
        if (((x.log || {})[T] || 0) >= (x.goal || 1)) continue;
        const fire = zoned(T, x.rem, tz);
        if (fire > from && fire <= now) due.push({ key: `${uid}|h|${x.id}|${T}`, title: `${x.emoji || ''} ${x.name}`.trim(), body: 'Lembrete do hábito', url: './#/habits' });
      } else if (r.kind === 's' && Array.isArray(x.gUp)) {
        const rem = x.gIcsRem ?? 10;
        if (!rem) continue;
        for (const e of x.gUp) {
          const fire = (+e.at || 0) - rem * 60000;
          if (fire > from && fire <= now) {
            const hh = new Intl.DateTimeFormat('pt-BR', { timeZone: tz, hour: '2-digit', minute: '2-digit' }).format(new Date(+e.at));
            due.push({ key: `${uid}|g|${e.k}|${e.at}`, title: e.t || 'Reunião', body: `Começa em ${fmtMin(rem)} · ${hh}${e.m ? ' · toque para entrar' : ''}`, url: './#/meet', meet: e.m || '', rec: e.k || '' });
          }
        }
      } else if (r.kind === 'z' && x.end) {
        if (x.end > from && x.end <= now) due.push({ key: `${uid}|z|${x.end}`, title: x.mode === 'focus' ? 'Sessão de foco concluída' : 'Pausa encerrada', body: x.mode === 'focus' ? 'Hora de descansar um pouco.' : 'Vamos voltar ao foco?', url: './#/focus' });
      }
    }
    for (const n of due) {
      const { data: ins } = await admin.from('tarefas_push_enviados').insert({ chave: n.key }).select('chave');
      if (!ins || !ins.length) continue;
      for (const s of byUser[uid]) {
        try {
          const p = await buildPush(s, { title: n.title, body: n.body, tag: n.key, url: n.url, meet: n.meet || '', rec: n.rec || '' }, keys);
          const res = await fetch(p.url, p.init);
          if (res.status === 404 || res.status === 410) await admin.from('tarefas_push').delete().eq('endpoint', s.endpoint);
          else if (res.ok) sent++;
        } catch (_) { /* segue para o próximo */ }
      }
    }
  }
  await admin.from('tarefas_push_enviados').delete().lt('em', new Date(now - 4 * 864e5).toISOString());
  return { ok: true, sent };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  const admin = createClient(env('SUPABASE_URL'), env('SUPABASE_SERVICE_ROLE_KEY'), { auth: { persistSession: false } });
  const body = await req.json().catch(() => ({}));
  try {
    if (body.action === 'push.tick') {
      if (!env('CRON_SECRET') || req.headers.get('x-cron') !== env('CRON_SECRET')) return json({ error: 'não autorizado' }, 401);
      return json(await pushTick(admin));
    }
    const token = (req.headers.get('Authorization') || '').replace(/^Bearer\s+/i, '');
    const { data: ud } = await admin.auth.getUser(token);
    const me = ud && ud.user;
    if (!me) return json({ error: 'Entre na sua conta' }, 401);

    if (body.action === 'push.test') {
      const keys = { pub: env('VAPID_PUBLIC_KEY'), priv: env('VAPID_PRIVATE_KEY'), subject: env('VAPID_SUBJECT') || 'mailto:admin@example.com' };
      if (!keys.pub || !keys.priv) return json({ error: 'Faltam os segredos VAPID na função' });
      const { data: subs } = await admin.from('tarefas_push').select('*').eq('user_id', me.id);
      let ok = 0;
      for (const s of subs || []) { const p = await buildPush(s, { title: 'Tarefas', body: 'Notificações funcionando neste aparelho ✅', tag: 'teste', url: './' }, keys); const r = await fetch(p.url, p.init); if (r.ok) ok++; else if (r.status === 404 || r.status === 410) await admin.from('tarefas_push').delete().eq('endpoint', s.endpoint); }
      return json({ ok, total: (subs || []).length });
    }

    if (body.action === 'ical') {
      let u: URL;
      try { u = new URL(String(body.url || '').replace(/^webcal:\/\//i, 'https://')); } catch (_) { return json({ error: 'Endereço inválido' }); }
      if (u.protocol !== 'https:' || !/^(calendar\.google\.com|www\.google\.com|outlook\.office365\.com|outlook\.live\.com|outlook\.office\.com|p\d+-caldav\.icloud\.com)$/i.test(u.hostname)) return json({ error: 'Só aceito links de agenda do Google, Outlook ou iCloud' });
      const r = await fetch(u.toString(), { headers: { 'User-Agent': 'Tarefas/1.0' }, redirect: 'follow' });
      if (!r.ok) return json({ error: r.status === 404 ? 'O Google não encontrou essa agenda (o link secreto pode ter sido trocado)' : 'O Google respondeu com erro ' + r.status });
      const text = await r.text();
      if (!/BEGIN:VCALENDAR/.test(text.slice(0, 2000))) return json({ error: 'Esse link não devolveu uma agenda (.ics)' });
      if (text.length > 15_000_000) return json({ error: 'Agenda grande demais' });
      return json({ text });
    }

    const { data: adm } = await admin.from('tarefas_admins').select('user_id');
    const admins = new Set((adm || []).map((a: any) => a.user_id));
    if (!admins.has(me.id)) return json({ error: 'Só o administrador pode fazer isso' }, 403);

    if (body.action === 'users.list') {
      const { data, error } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
      if (error) throw error;
      const users = data.users.map((u: any) => ({ id: u.id, email: u.email, name: (u.user_metadata || {}).name || '', created: u.created_at, last: u.last_sign_in_at, banned: !!(u.banned_until && new Date(u.banned_until) > new Date()), admin: admins.has(u.id), painel: !(u.app_metadata || {}).somente_tarefas }));
      users.sort((a: any, b: any) => (a.name || a.email).localeCompare(b.name || b.email));
      return json({ users });
    }
    if (body.action === 'users.create') {
      if (!body.email || !body.password || String(body.password).length < 8) return json({ error: 'Informe e-mail e senha com pelo menos 8 caracteres' });
      const { data, error } = await admin.auth.admin.createUser({ email: body.email, password: body.password, email_confirm: true, user_metadata: { name: body.name || '' }, app_metadata: { somente_tarefas: !body.painel } });
      if (error) return json({ error: error.message });
      if (body.admin) await admin.from('tarefas_admins').insert({ user_id: data.user.id });
      return json({ ok: true, id: data.user.id });
    }
    if (body.action === 'users.update') {
      if (!body.id) return json({ error: 'Usuário não informado' });
      const upd: any = { user_metadata: { name: body.name || '' }, app_metadata: { somente_tarefas: !body.painel } };
      if (body.password) { if (String(body.password).length < 8) return json({ error: 'A senha precisa ter pelo menos 8 caracteres' }); upd.password = body.password; }
      if (body.id !== me.id) upd.ban_duration = body.ban ? '876000h' : 'none';
      const { error } = await admin.auth.admin.updateUserById(body.id, upd);
      if (error) return json({ error: error.message });
      if (body.id !== me.id) {
        if (body.admin && !admins.has(body.id)) await admin.from('tarefas_admins').insert({ user_id: body.id });
        if (!body.admin && admins.has(body.id)) await admin.from('tarefas_admins').delete().eq('user_id', body.id);
      }
      return json({ ok: true });
    }
    if (body.action === 'users.delete') {
      if (!body.id || body.id === me.id) return json({ error: 'Você não pode excluir o próprio acesso' });
      const { error } = await admin.auth.admin.deleteUser(body.id);
      if (error) return json({ error: error.message });
      return json({ ok: true });
    }
    return json({ error: 'Ação desconhecida' }, 400);
  } catch (e) {
    return json({ error: (e as Error).message || String(e) }, 500);
  }
});
