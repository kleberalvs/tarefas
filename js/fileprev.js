/* Pré-visualização de arquivos: miniatura pequena para qualquer anexo (imagem, PDF, vídeo, áudio, texto,
   Word, Excel, PowerPoint…) e, ao tocar, um visualizador em tela cheia com a versão maior.
   Tudo é gerado no próprio aparelho, a partir do arquivo guardado no app. */
'use strict';
const FP_CACHE = new Map();
function fileKind(m) {
  const n = String((m && m.name) || '').toLowerCase(), t = String((m && m.type) || '').toLowerCase();
  if (/^image\//.test(t) || /\.(jpe?g|png|gif|webp|heic|heif|bmp|avif|svg)$/.test(n)) return 'img';
  if (t === 'application/pdf' || n.endsWith('.pdf')) return 'pdf';
  if (/^video\//.test(t) || /\.(mp4|mov|m4v|webm|3gp)$/.test(n)) return 'video';
  if (/^audio\//.test(t) || /\.(mp3|m4a|wav|ogg|oga|aac|webm|opus)$/.test(n)) return 'audio';
  if (/\.(docx|xlsx|pptx)$/.test(n)) return 'office';
  if (/^text\//.test(t) || /json|xml|csv/.test(t) || /\.(txt|md|csv|json|log|xml|html?|ics|tsv)$/.test(n)) return 'text';
  return 'other';
}
const fileExt = m => ((String(m.name || '').match(/\.([a-z0-9]{1,5})$/i) || [])[1] || '').toUpperCase();
const KIND_IC = { pdf: 'file', video: 'play', audio: 'music', text: 'text', office: 'doc', other: 'clip', img: 'img' };
const KIND_COL = { pdf: '#E5484D', video: '#8E6CEF', audio: '#E8A33D', text: '#6B7280', office: '#2F80ED', other: '#808080', img: '#2EA66B' };
const officeKind = m => { const e = fileExt(m); return e === 'DOCX' ? 'word' : e === 'XLSX' ? 'excel' : e === 'PPTX' ? 'ppt' : ''; };

/* ---------- leitura de .docx/.xlsx/.pptx (são arquivos zip) ---------- */
async function unzipText(blob, want) {
  const buf = new Uint8Array(await blob.arrayBuffer()), dv = new DataView(buf.buffer);
  let eocd = -1; for (let i = buf.length - 22; i >= Math.max(0, buf.length - 70000); i--) if (dv.getUint32(i, true) === 0x06054b50) { eocd = i; break; }
  if (eocd < 0) throw new Error('arquivo zip inválido');
  const count = dv.getUint16(eocd + 10, true); let p = dv.getUint32(eocd + 16, true);
  const dec = new TextDecoder(), out = {};
  for (let k = 0; k < count; k++) {
    if (dv.getUint32(p, true) !== 0x02014b50) break;
    const method = dv.getUint16(p + 10, true), csize = dv.getUint32(p + 20, true), nlen = dv.getUint16(p + 28, true), xlen = dv.getUint16(p + 30, true), clen = dv.getUint16(p + 32, true), off = dv.getUint32(p + 42, true);
    const name = dec.decode(buf.subarray(p + 46, p + 46 + nlen)); p += 46 + nlen + xlen + clen;
    if (!want(name)) continue;
    const lnl = dv.getUint16(off + 26, true), lxl = dv.getUint16(off + 28, true), data = buf.subarray(off + 30 + lnl + lxl, off + 30 + lnl + lxl + csize);
    let bytes = data;
    if (method === 8) { const ds = new DecompressionStream('deflate-raw'); bytes = new Uint8Array(await new Response(new Blob([data]).stream().pipeThrough(ds)).arrayBuffer()); }
    out[name] = dec.decode(bytes);
  }
  return out;
}
const xmlTxt = s => s.replace(/<[^>]+>/g, '').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&amp;/g, '&');
/* devolve [{ h: título opcional, p: [parágrafos] }] */
async function officeText(m, blob) {
  const k = officeKind(m);
  if (k === 'word') {
    const f = await unzipText(blob, n => n === 'word/document.xml'), x = f['word/document.xml'] || '';
    const paras = (x.match(/<w:p[ >][\s\S]*?<\/w:p>/g) || []).map(p => xmlTxt(p.replace(/<w:tab\/>/g, '\t').replace(/<w:br\/>/g, '\n'))).filter(t => t.trim());
    return [{ p: paras }];
  }
  if (k === 'excel') {
    const f = await unzipText(blob, n => n === 'xl/sharedStrings.xml' || /^xl\/worksheets\/sheet1\.xml$/.test(n));
    const ss = (f['xl/sharedStrings.xml'] || '').match(/<si>[\s\S]*?<\/si>/g) || [], strs = ss.map(xmlTxt);
    const sh = f['xl/worksheets/sheet1.xml'] || '', rows = [];
    (sh.match(/<row[\s\S]*?<\/row>/g) || []).slice(0, 200).forEach(r => {
      const cells = (r.match(/<c [^>]*?(?:\/>|>[\s\S]*?<\/c>)/g) || []).map(c => { const v = (c.match(/<v>([\s\S]*?)<\/v>/) || [])[1] || (c.match(/<t[^>]*>([\s\S]*?)<\/t>/) || [])[1] || ''; return / t="s"/.test(c) ? strs[+v] || '' : xmlTxt(v); });
      rows.push(cells);
    });
    return [{ table: rows }];
  }
  if (k === 'ppt') {
    const f = await unzipText(blob, n => /^ppt\/slides\/slide\d+\.xml$/.test(n));
    return Object.keys(f).sort((a, b) => +a.match(/(\d+)\.xml/)[1] - +b.match(/(\d+)\.xml/)[1]).map((n, i) => ({ h: 'Slide ' + (i + 1), p: (f[n].match(/<a:p>[\s\S]*?<\/a:p>/g) || []).map(xmlTxt).filter(t => t.trim()) }));
  }
  return [];
}
/* ---------- PDF (pdf.js, carregado só quando precisa) ---------- */
let PDFJS = null;
async function pdfLib() {
  if (PDFJS) return PDFJS;
  const base = new URL('vendor/pdfjs/', location.href).href;
  PDFJS = await import(base + 'pdf.min.mjs');
  PDFJS.GlobalWorkerOptions.workerSrc = base + 'pdf.worker.min.mjs';
  return PDFJS;
}
async function pdfOpen(blob) { const lib = await pdfLib(); return lib.getDocument({ data: new Uint8Array(await blob.arrayBuffer()), isEvalSupported: false }).promise; }
async function pdfPageCanvas(doc, n, width) {
  const page = await doc.getPage(n), v1 = page.getViewport({ scale: 1 }), dpr = Math.min(2, devicePixelRatio || 1);
  const scale = width / v1.width, vp = page.getViewport({ scale: scale * dpr });
  const cv = document.createElement('canvas'); cv.width = Math.round(vp.width); cv.height = Math.round(vp.height); cv.style.width = Math.round(vp.width / dpr) + 'px';
  await page.render({ canvasContext: cv.getContext('2d'), viewport: vp }).promise;
  return cv;
}

/* ---------- miniatura ---------- */
function fileTile(m, i, opts = {}) {
  const k = fileKind(m), ext = fileExt(m);
  return `<div class="ftile k-${k}" style="--fc:${KIND_COL[k]}"><button class="ftbtn" data-act="${opts.act || 'fview'}" data-i="${i}" aria-label="Abrir ${esc(m.name || 'arquivo')}" title="${esc(m.name || '')}">
    <span class="fthumb" data-fthumb="${i}"><span class="ftph">${ic(KIND_IC[k], 26)}${ext ? `<b>${esc(ext)}</b>` : ''}</span></span>
    ${k === 'img' ? '' : `<span class="ftname">${esc(m.name || 'Arquivo')}</span>`}
  </button>${opts.del ? `<button class="attx" data-act="${opts.del}" data-i="${i}" aria-label="Remover ${esc(m.name || 'arquivo')}">${ic('x', 13)}</button>` : ''}</div>`;
}
async function fillThumb(box, m) {
  const k = fileKind(m), key = m.id + ':' + k;
  try {
    if (FP_CACHE.has(key)) { box.innerHTML = FP_CACHE.get(key); return; }
    if (m.pending && !(await FILES.blob(m).catch(() => null))) return;
    let html = '';
    if (k === 'img') html = `<img alt="" src="${await FILES.url(m)}">`;
    else if (k === 'video') html = `<video muted playsinline preload="metadata" src="${await FILES.url(m)}#t=0.5"></video><span class="ftplay">${ic('play', 16)}</span>`;
    else if (k === 'pdf') { const doc = await pdfOpen(await FILES.blob(m)); const cv = await pdfPageCanvas(doc, 1, 220); html = `<img alt="" src="${cv.toDataURL('image/jpeg', .8)}"><span class="ftbadge">PDF${doc.numPages > 1 ? ' · ' + doc.numPages + ' p.' : ''}</span>`; doc.destroy && doc.destroy(); }
    else if (k === 'text') { const t = (await (await FILES.blob(m)).text()).slice(0, 600); html = `<span class="ftpage"><span>${esc(t)}</span></span>`; }
    else if (k === 'office') {
      const parts = await officeText(m, await FILES.blob(m)), ok = officeKind(m);
      const txt = parts.map(s => s.table ? s.table.slice(0, 12).map(r => r.join('  ·  ')).join('\n') : [s.h, ...(s.p || [])].filter(Boolean).join('\n')).join('\n\n').slice(0, 600);
      html = `<span class="ftpage ${ok}"><span>${esc(txt || 'Documento')}</span></span><span class="ftbadge">${fileExt(m)}</span>`;
    }
    else if (k === 'audio') html = `<span class="ftph aud">${ic('music', 26)}<i class="ftwave"><i></i><i></i><i></i><i></i><i></i><i></i><i></i></i></span>`;
    if (!html) return;
    if (k !== 'video') FP_CACHE.set(key, html);
    box.innerHTML = html;
  } catch (e) { /* fica o ícone */ }
}
function loadFileThumbs(root, files) { root.querySelectorAll('[data-fthumb]').forEach(b => { const m = files[+b.dataset.fthumb]; if (m) fillThumb(b, m); }); }

/* ---------- visualizador em tela cheia ---------- */
async function fileViewer(list, i = 0) {
  list = (Array.isArray(list) ? list : [list]).filter(Boolean); if (!list.length) return;
  const v = document.createElement('div'); v.className = 'fview'; v.setAttribute('role', 'dialog'); v.setAttribute('aria-modal', 'true');
  v.innerHTML = `<div class="fvbar"><button class="ib" data-fv="x" aria-label="Fechar">${ic('x', 20)}</button><span class="fvname"></span><span class="sp"></span>
    ${navigator.share ? `<button class="ib" data-fv="share" aria-label="Compartilhar">${ic('share', 19)}</button>` : ''}<button class="ib" data-fv="dl" aria-label="Baixar">${ic('dl', 19)}</button></div>
    <div class="fvbody"></div>${list.length > 1 ? `<button class="fvnav l" data-fv="prev" aria-label="Anterior">${ic('left', 22)}</button><button class="fvnav r" data-fv="next" aria-label="Próximo">${ic('right', 22)}</button>` : ''}`;
  document.body.appendChild(v); requestAnimationFrame(() => v.classList.add('on'));
  const body = v.querySelector('.fvbody'); let cur = i, token = 0, urls = [];
  const close = () => { v.classList.remove('on'); removeEventListener('keydown', key, true); setTimeout(() => { v.remove(); urls.forEach(u => URL.revokeObjectURL(u)); }, 200); };
  const show = async n => {
    cur = (n + list.length) % list.length; const m = list[cur], k = fileKind(m), my = ++token;
    v.querySelector('.fvname').innerHTML = `<b>${esc(m.name || 'Arquivo')}</b><small>${list.length > 1 ? `${cur + 1} de ${list.length} · ` : ''}${fmtSize(m.size || 0)}</small>`;
    body.className = 'fvbody k-' + k; body.innerHTML = '<div class="fvload"><span class="aidots"><i></i><i></i><i></i></span></div>';
    try {
      const blob = await FILES.blob(m); if (my !== token) return;
      const url = URL.createObjectURL(blob); urls.push(url);
      if (k === 'img') body.innerHTML = `<img class="fvimg" alt="${esc(m.name || '')}" src="${url}">`;
      else if (k === 'video') body.innerHTML = `<video controls playsinline autoplay src="${url}"></video>`;
      else if (k === 'audio') body.innerHTML = `<div class="fvaud">${ic('music', 40)}<b>${esc(m.name || '')}</b><audio controls autoplay src="${url}"></audio></div>`;
      else if (k === 'pdf') {
        const doc = await pdfOpen(blob); if (my !== token) return;
        body.innerHTML = `<div class="fvpdf"></div>`; const box = body.querySelector('.fvpdf'), W = Math.min(900, body.clientWidth - 24);
        for (let p = 1; p <= Math.min(doc.numPages, 60); p++) { if (my !== token) return; const cv = await pdfPageCanvas(doc, p, W); cv.className = 'fvpg'; box.appendChild(cv); }
        if (doc.numPages > 60) box.insertAdjacentHTML('beforeend', `<p class="hint">Mostrando 60 de ${doc.numPages} páginas. Baixe o arquivo para ver tudo.</p>`);
      }
      else if (k === 'text') { const t = await blob.text(); body.innerHTML = `<pre class="fvtext">${esc(t.slice(0, 400000))}</pre>`; }
      else if (k === 'office') {
        const parts = await officeText(m, blob); if (my !== token) return;
        body.innerHTML = `<article class="fvdoc">${parts.map(s => s.table ? `<div class="fvtbl"><table>${s.table.map((r, ri) => `<tr>${r.map(c => ri === 0 ? `<th>${esc(c)}</th>` : `<td>${esc(c)}</td>`).join('')}</tr>`).join('')}</table></div>` : `<section>${s.h ? `<h3>${esc(s.h)}</h3>` : ''}${(s.p || []).map(p => `<p>${esc(p).replace(/\n/g, '<br>')}</p>`).join('') || '<p class="mut">(sem texto)</p>'}</section>`).join('')}<p class="hint">Pré-visualização só do texto. Para ver com a formatação original, baixe o arquivo.</p></article>`;
      }
      else body.innerHTML = `<div class="fvother">${ic('clip', 44)}<b>${esc(m.name || 'Arquivo')}</b><span class="mut">${fmtSize(m.size || 0)} · sem pré-visualização para este tipo</span><button class="btn red" data-fv="dl">${ic('dl', 17)}Baixar</button></div>`;
    } catch (e) { if (my === token) body.innerHTML = `<div class="fvother">${ic('clip', 44)}<b>${esc(m.name || 'Arquivo')}</b><span class="mut">${m.pending ? 'Este arquivo ainda está só no aparelho onde foi anexado.' : 'Não foi possível mostrar este arquivo aqui.'}</span><button class="btn" data-fv="dl">${ic('dl', 17)}Baixar</button></div>`; }
  };
  const dl = async () => { const m = list[cur]; try { const bl = await FILES.blob(m), u = URL.createObjectURL(bl), a = document.createElement('a'); a.href = u; a.download = m.name || 'arquivo'; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(u), 8000); } catch (e) { toast('Não foi possível baixar'); } };
  const share = async () => { const m = list[cur]; try { const bl = await FILES.blob(m); const f = new File([bl], m.name || 'arquivo', { type: bl.type || m.type || '' }); if (navigator.canShare && navigator.canShare({ files: [f] })) await navigator.share({ files: [f], title: m.name }); else dl(); } catch (e) { if (e.name !== 'AbortError') dl(); } };
  v.addEventListener('click', e => { const b = e.target.closest('[data-fv]'); if (!b) { if (e.target === v) close(); return; } const a = b.dataset.fv; if (a === 'x') close(); if (a === 'prev') show(cur - 1); if (a === 'next') show(cur + 1); if (a === 'dl') dl(); if (a === 'share') share(); });
  const key = e => { if (e.key === 'Escape') { e.stopPropagation(); close(); } if (list.length > 1 && e.key === 'ArrowLeft') show(cur - 1); if (list.length > 1 && e.key === 'ArrowRight') show(cur + 1); };
  addEventListener('keydown', key, true);
  /* deslizar para os lados troca de arquivo (fora do PDF, que rola) */
  let sx = null; v.addEventListener('touchstart', e => { sx = e.touches.length === 1 ? e.touches[0].clientX : null; }, { passive: true });
  v.addEventListener('touchend', e => { if (sx == null || list.length < 2) return; const dx = e.changedTouches[0].clientX - sx; if (Math.abs(dx) > 70 && !e.target.closest('.fvpdf,.fvtbl,video,audio')) show(cur + (dx < 0 ? 1 : -1)); sx = null; }, { passive: true });
  show(i);
}
