/* Service worker: abre sem internet e, com internet, sempre busca a versão mais nova. */
const VERSAO = '2026.10.27-1';
const CACHE = 'tarefas-' + VERSAO;
const ARQUIVOS = ['./', 'index.html', 'config.js', 'css/app.css', 'js/core.js', 'js/ui.js', 'js/files.js', 'js/tasks.js', 'js/detail.js', 'js/cal.js', 'js/docs.js', 'js/focus.js', 'js/export.js', 'js/sync.js', 'js/app.js',
  'vendor/supabase.js', 'manifest.webmanifest', 'assets/icon-192.png', 'assets/apple-touch-icon.png'];
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(ARQUIVOS))); });
self.addEventListener('message', e => { if (e.data === 'skip') self.skipWaiting(); });
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k.startsWith('tarefas-') && k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const r = e.request;
  if (r.method !== 'GET' || new URL(r.url).origin !== location.origin) return;
  e.respondWith(
    fetch(r, { cache: 'no-cache' }).then(res => {
      if (res.ok) { const cp = res.clone(); caches.open(CACHE).then(c => c.put(r, cp)); }
      return res;
    }).catch(() => caches.match(r).then(m => m || caches.match('index.html')))
  );
});
self.addEventListener('notificationclick', e => {
  e.notification.close();
  e.waitUntil(self.clients.matchAll({ type: 'window' }).then(cs => cs.length ? cs[0].focus() : self.clients.openWindow('./')));
});
