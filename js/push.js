/* Notificações push: este aparelho recebe lembretes mesmo com o app fechado (via função "tarefas" no Supabase). */
'use strict';
const PUSH = { supported: 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window, on: false, busy: false, err: '' };
const pushOn = () => PUSH.on;
const isIOS = () => /iPhone|iPad|iPod/.test(navigator.userAgent);
const b64uToU8 = s => { s = s.replace(/-/g, '+').replace(/_/g, '/'); while (s.length % 4) s += '='; const b = atob(s), u = new Uint8Array(b.length); for (let i = 0; i < b.length; i++) u[i] = b.charCodeAt(i); return u; };
async function pushRefresh() {
  if (!PUSH.supported) return;
  try {
    const reg = await navigator.serviceWorker.getRegistration();
    const sub = reg && await reg.pushManager.getSubscription();
    PUSH.on = !!sub && Notification.permission === 'granted';
    try { localStorage.setItem('tt_push', PUSH.on ? '1' : '0'); } catch (e) {}
    if (sub && SB && SES) await savePushSub(sub);
  } catch (e) { PUSH.on = false; }
  if (R.v === 'settings') render(true);
}
async function savePushSub(sub) {
  const j = sub.toJSON();
  const { error } = await SB.from('tarefas_push').upsert({ endpoint: j.endpoint, user_id: SES.user.id, p256dh: j.keys.p256dh, auth: j.keys.auth, tz: Intl.DateTimeFormat().resolvedOptions().timeZone, aparelho: deviceName() }, { onConflict: 'endpoint' });
  if (error) throw error;
}
async function enablePush() {
  if (!PUSH.supported) { toast(isIOS() ? 'No iPhone, instale o app na Tela de Início primeiro (Compartilhar → Adicionar à Tela de Início) e abra por lá.' : 'Este navegador não suporta notificações.'); return; }
  if (!CFG.vapid) { toast('Chave de notificações não configurada'); return; }
  if (!SB || !SES) { toast('Entre na sua conta para ativar'); return; }
  PUSH.busy = true; render(true);
  try {
    const perm = await Notification.requestPermission();
    if (perm !== 'granted') throw new Error(perm === 'denied' ? 'As notificações estão bloqueadas nas configurações do aparelho/navegador para este site.' : 'Permissão não concedida.');
    const reg = await navigator.serviceWorker.ready;
    let sub = await reg.pushManager.getSubscription();
    if (!sub) sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: b64uToU8(CFG.vapid) });
    await savePushSub(sub);
    PUSH.on = true; PUSH.err = ''; localStorage.setItem('tt_push', '1');
    toast('Notificações ativadas neste aparelho');
  } catch (e) { PUSH.err = /relation|does not exist|schema/i.test(e.message || '') ? 'Falta rodar o SQL da atualização 2 no Supabase.' : e.message; toast(PUSH.err); }
  PUSH.busy = false; render(true);
}
async function disablePush() {
  try {
    const reg = await navigator.serviceWorker.getRegistration();
    const sub = reg && await reg.pushManager.getSubscription();
    if (sub) { if (SB && SES) await SB.from('tarefas_push').delete().eq('endpoint', sub.endpoint); await sub.unsubscribe(); }
  } catch (e) {}
  PUSH.on = false; localStorage.setItem('tt_push', '0'); toast('Notificações desativadas neste aparelho'); render(true);
}
async function testPush() {
  try { const r = await fnCall('push.test'); toast(r.ok ? 'Notificação de teste enviada' : 'Nenhum aparelho recebeu. Ative as notificações primeiro.'); }
  catch (e) { toast(e.message); }
}
/* o timer do Pomodoro vai para a nuvem, para avisar o fim mesmo com o app fechado */
function syncTimer() {
  if (typeof put !== 'function' || !db) return;
  const run = FS.run && FS.mode !== 'watch';
  const cur = get('z', 'timer');
  const val = { id: 'timer', end: run ? FS.end : 0, mode: FS.mode };
  if (cur && cur.end === val.end && cur.mode === val.mode) return;
  put('z', val, { nolog: true });
}
Object.assign(ACTS, { pushon: enablePush, pushoff: disablePush, pushtest: testPush });
