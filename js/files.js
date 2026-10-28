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
document.addEventListener('click', e => {
  const im = e.target.closest && e.target.closest('#blocks figure.bimg img[data-img]');
  if (!im || !ED.doc) return;
  const imgs = ED.doc.b.filter(b => b.type === 'img' && b.file).map(b => b.file);
  lightbox(imgs, Math.max(0, imgs.findIndex(f => f.id === im.dataset.img)));
});
/* visualizador de imagens: tela cheia, zoom com dois dedos/duplo toque, baixar e compartilhar */
async function lightbox(list, i = 0) {
  list = (Array.isArray(list) ? list : [list]).filter(Boolean); if (!list.length) return;
  const lb = document.createElement('div'); lb.className = 'lbox'; lb.innerHTML = `<div class="lbbar"><span class="lbn"></span><span class="f1"></span>${navigator.share ? `<button class="ib" data-lb="share" aria-label="Compartilhar">${ic('share', 20)}</button>` : ''}<button class="ib" data-lb="dl" aria-label="Baixar">${ic('dl', 20)}</button><button class="ib" data-lb="x" aria-label="Fechar">${ic('x', 22)}</button></div><div class="lbstage"><img alt=""></div>${list.length > 1 ? `<button class="lbnav l" data-lb="p" aria-label="Anterior">${ic('left', 26)}</button><button class="lbnav r" data-lb="n" aria-label="Próxima">${ic('right', 26)}</button>` : ''}`;
  document.body.appendChild(lb); requestAnimationFrame(() => lb.classList.add('on'));
  const img = lb.querySelector('img'); let zoom = 1;
  const show = async () => { const m = list[i]; lb.querySelector('.lbn').textContent = (list.length > 1 ? (i + 1) + ' / ' + list.length + ' · ' : '') + (m.name || 'Imagem'); img.classList.remove('in'); zoom = 1; img.style.transform = ''; try { if (!IMG_URL.has(m.id)) IMG_URL.set(m.id, await FILES.url(m)); img.src = IMG_URL.get(m.id); img.onload = () => img.classList.add('in'); } catch (e) { toast('Imagem indisponível neste aparelho'); } };
  const close = () => { lb.classList.remove('on'); document.removeEventListener('keydown', key, true); setTimeout(() => lb.remove(), 220); };
  const key = e => { if (e.key === 'Escape') { e.stopPropagation(); close(); } else if (e.key === 'ArrowRight' && list.length > 1) { i = (i + 1) % list.length; show(); } else if (e.key === 'ArrowLeft' && list.length > 1) { i = (i - 1 + list.length) % list.length; show(); } };
  document.addEventListener('keydown', key, true);
  lb.addEventListener('click', async e => {
    const b = e.target.closest('[data-lb]');
    if (!b) { if (e.target === lb || e.target.classList.contains('lbstage')) close(); return; }
    const a = b.dataset.lb, m = list[i];
    if (a === 'x') close();
    else if (a === 'n') { i = (i + 1) % list.length; show(); } else if (a === 'p') { i = (i - 1 + list.length) % list.length; show(); }
    else if (a === 'dl') { try { const bl = await FILES.blob(m), u = URL.createObjectURL(bl), l = document.createElement('a'); l.href = u; l.download = m.name || 'imagem.jpg'; document.body.appendChild(l); l.click(); l.remove(); setTimeout(() => URL.revokeObjectURL(u), 4000); } catch (er) { toast('Não foi possível baixar'); } }
    else if (a === 'share') { try { const bl = await FILES.blob(m); const f = new File([bl], m.name || 'imagem.jpg', { type: bl.type || m.type || 'image/jpeg' }); if (navigator.canShare && navigator.canShare({ files: [f] })) await navigator.share({ files: [f] }); else await navigator.share({ title: m.name }); } catch (er) {} }
  });
  img.addEventListener('dblclick', () => { zoom = zoom > 1 ? 1 : 2.2; img.style.transform = `scale(${zoom})`; });
  let sx = 0; lb.querySelector('.lbstage').addEventListener('touchstart', e => { sx = e.touches[0].clientX; }, { passive: true });
  lb.querySelector('.lbstage').addEventListener('touchend', e => { const dx = e.changedTouches[0].clientX - sx; if (Math.abs(dx) > 60 && list.length > 1 && zoom === 1 && !(window.visualViewport && visualViewport.scale > 1.05)) { i = (i + (dx < 0 ? 1 : -1) + list.length) % list.length; show(); } });
  show();
}
async function openFile(m) {
  if (/^image\//.test(m.type || '')) return lightbox(m);
  try {
    const u = await FILES.url(m);
    if (/^image\/|^application\/pdf|^text\//.test(m.type) && !/iPhone|iPad/.test(navigator.userAgent)) window.open(u, '_blank');
    else { const a = document.createElement('a'); a.href = u; a.download = m.name; document.body.appendChild(a); a.click(); a.remove(); }
  } catch (e) { toast(e.message || 'Não foi possível abrir o arquivo'); }
}
const fileIcon = m => /^image\//.test(m.type) ? 'img' : 'file';
