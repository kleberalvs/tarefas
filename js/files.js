/* Arquivos anexados: guardados no aparelho (IndexedDB) e na nuvem (Supabase Storage, pasta própria de cada conta). */
'use strict';
const FILES = (() => {
  const BUCKET = 'tarefas-anexos', MAX = 50 * 1048576;
  let dbp = null;
  const idb = () => dbp || (dbp = new Promise((res, rej) => { const r = indexedDB.open('tt_files', 1); r.onupgradeneeded = () => r.result.createObjectStore('f'); r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); }));
  const tx = async (mode, fn) => { const d = await idb(); return new Promise((res, rej) => { const t = d.transaction('f', mode), s = t.objectStore('f'); const r = fn(s); t.oncomplete = () => res(r && r.result); t.onerror = () => rej(t.error); }); };
  const lput = (k, b) => tx('readwrite', s => s.put(b, k));
  const lget = k => tx('readonly', s => s.get(k));
  const ldel = k => tx('readwrite', s => s.delete(k));
  const cloudOk = () => typeof CLOUD !== 'undefined' && CLOUD && SB && SES;
  const path = m => SES.user.id + '/' + m.id + '/' + safeName(m.name).replace(/[^\w.\-]+/g, '_');
  async function add(file) {
    if (file.size > MAX) throw new Error('Arquivo maior que 50 MB');
    const m = { id: uid(), name: file.name || 'arquivo', size: file.size, type: file.type || '', at: Date.now() };
    await lput(m.id, file);
    if (cloudOk()) {
      m.path = path(m);
      const { error } = await SB.storage.from(BUCKET).upload(m.path, file, { contentType: m.type || 'application/octet-stream', upsert: true });
      if (error) { console.warn('upload', error); m.path = null; m.pending = true; toast('Anexo salvo só neste aparelho por enquanto (falha no envio)'); }
    } else m.pending = true;
    return m;
  }
  async function blob(m) {
    let b = await lget(m.id).catch(() => null);
    if (b) return b;
    if (cloudOk() && m.path) {
      const { data, error } = await SB.storage.from(BUCKET).download(m.path);
      if (error) throw error;
      await lput(m.id, data).catch(() => {});
      return data;
    }
    throw new Error('Arquivo não disponível neste aparelho');
  }
  async function url(m) { return URL.createObjectURL(await blob(m)); }
  async function remove(m) {
    await ldel(m.id).catch(() => {});
    if (cloudOk() && m.path) await SB.storage.from(BUCKET).remove([m.path]).catch(() => {});
  }
  /* envia anexos que ficaram só no aparelho (ex.: criados offline) */
  async function flush() {
    if (!cloudOk()) return;
    const owners = [...db.n.map(n => ['n', n, [...(n.img || []), ...(n.aud || []), ...(n.bgImg ? [n.bgImg] : [])]]), ...db.t.map(t => ['t', t, t.att || []]), ...db.d.map(d => ['d', d, (d.b || []).filter(b => b.file).map(b => b.file)])];
    for (const [k, o, list] of owners) {
      let ch = false;
      for (const m of list) {
        if (!m.pending) continue;
        const b = await lget(m.id).catch(() => null); if (!b) continue;
        m.path = path(m);
        const { error } = await SB.storage.from(BUCKET).upload(m.path, b, { contentType: m.type || 'application/octet-stream', upsert: true });
        if (!error) { delete m.pending; ch = true; } else m.path = null;
      }
      if (ch) put(k, o, { silent: true });
    }
    changed();
  }
  return { add, blob, url, remove, flush };
})();
async function openFile(m) {
  try {
    const u = await FILES.url(m);
    if (/^image\/|^application\/pdf|^text\//.test(m.type) && !/iPhone|iPad/.test(navigator.userAgent)) window.open(u, '_blank');
    else { const a = document.createElement('a'); a.href = u; a.download = m.name; document.body.appendChild(a); a.click(); a.remove(); }
  } catch (e) { toast(e.message || 'Não foi possível abrir o arquivo'); }
}
const fileIcon = m => /^image\//.test(m.type) ? 'img' : 'file';
