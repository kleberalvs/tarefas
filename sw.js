/* Service worker: abre sem internet, busca sempre a versão mais nova e mostra as notificações push. */
const VERSAO = '2026.10.29-81';
const CACHE = 'tarefas-' + VERSAO;
const ARQUIVOS = ['./', 'index.html', 'config.js', 'css/app.css', 'assets/fonts/inter-latin-wght-normal.woff2', 'assets/fonts/inter-latin-ext-wght-normal.woff2', 'js/core.js', 'js/emoji.js', 'js/ui.js', 'js/files.js', 'js/fileprev.js', 'js/links.js', 'js/tasks.js', 'js/home.js', 'js/detail.js', 'js/cal.js', 'js/ics.js', 'js/docs.js', 'js/focus.js', 'js/sounds.js', 'js/export.js', 'js/docshot.js', 'js/log.js', 'js/ach.js', 'js/pets.js', 'js/notes.js', 'js/draw.js', 'js/ai.js', 'js/dstyles.js', 'js/meet.js', 'js/users.js', 'js/push.js', 'js/sync.js', 'js/app.js',
  'vendor/supabase.js', 'manifest.webmanifest', 'assets/icon-v4-192.png', 'assets/apple-touch-icon-v4.png', 'assets/icon-v4-512.png', 'assets/badge-96.png'];
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(ARQUIVOS))); });
self.addEventListener('message', e => { if (e.data === 'skip') self.skipWaiting(); });
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k.startsWith('tarefas-') && k !== CACHE && k !== 'tarefas-fontes').map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const r = e.request, u = new URL(r.url);
  if (r.method !== 'GET') return;
  /* fontes do Google: guardadas para funcionar sem internet */
  if (u.host === 'fonts.googleapis.com' || u.host === 'fonts.gstatic.com') {
    e.respondWith(caches.open('tarefas-fontes').then(c => c.match(r).then(m => m || fetch(r).then(res => { if (res.ok || res.type === 'opaque') c.put(r, res.clone()); return res; }))));
    return;
  }
  if (u.origin !== location.origin) return;
  e.respondWith(
    fetch(r, { cache: 'no-cache' }).then(res => {
      if (res.ok) { const cp = res.clone(); caches.open(CACHE).then(c => c.put(r, cp)); }
      return res;
    }).catch(() => caches.match(r).then(m => m || caches.match('index.html')))
  );
});
self.addEventListener('push', e => {
  let d = {};
  try { d = e.data ? e.data.json() : {}; } catch (x) { d = { title: 'Tarefas', body: e.data ? e.data.text() : '' }; }
  const actions = d.meet ? [{ action: 'meet', title: 'Entrar no Meet' }, { action: 'rec', title: 'Gravar e resumir' }] : d.rec ? [{ action: 'rec', title: 'Gravar e resumir' }] : [];
  e.waitUntil(self.registration.showNotification(d.title || 'Tarefas', { body: d.body || '', tag: d.tag || undefined, renotify: !!d.tag, icon: 'assets/icon-v4-192.png', badge: 'assets/badge-96.png', vibrate: [80, 40, 80], actions, data: { url: d.url || './', meet: d.meet || '', rec: d.rec || '' } }));
});
self.addEventListener('notificationclick', e => {
  e.notification.close();
  const nd = e.notification.data || {};
  if (e.action === 'meet' && nd.meet) { e.waitUntil(self.clients.openWindow(nd.meet)); return; }
  const url = e.action === 'rec' && nd.rec ? './?rec=' + encodeURIComponent(nd.rec) + '#/meet' : (nd.url || './');
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(cs => {
    for (const c of cs) { if ('focus' in c) { c.navigate && c.navigate(url).catch(() => {}); return c.focus(); } }
    return self.clients.openWindow(url);
  }));
});
