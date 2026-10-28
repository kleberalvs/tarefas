/* Exportar o documento exatamente como aparece no app (mesmo estilo, cores, capa e fontes):
   PDF em folhas A4 e imagem PNG. Tudo é gerado no próprio aparelho, sem enviar o documento para lugar nenhum. */
'use strict';
const SHOT_W = 794; /* largura de uma folha A4 em pixels de tela */
function loadVendor(src, global) {
  if (window[global]) return Promise.resolve(window[global]);
  return new Promise((res, rej) => {
    const s = document.createElement('script'); s.src = src;
    s.onload = () => window[global] ? res(window[global]) : rej(new Error('biblioteca não carregou'));
    s.onerror = () => rej(new Error('sem conexão para carregar o exportador'));
    document.head.appendChild(s);
  });
}
/* garante que o documento está aberto na tela (o retrato é feito a partir dele) */
async function shotOpen(d) {
  if (!(R.v === 'doc' && ED.doc && ED.doc.id === d.id && document.querySelector('#main article.page'))) { go('doc/' + d.id); await sleep(700); }
  if (document.fonts && document.fonts.ready) await document.fonts.ready;
  await sleep(120);
}
/* monta uma cópia limpa do documento (sem botões de edição), fora da tela, na largura de uma folha */
function shotStage(d) {
  const main = $('#main'), sc = main.querySelector('.docscroll'), art = sc && sc.querySelector('article.page');
  if (!art) throw new Error('Abra o documento para exportar');
  const host = document.createElement('div');
  host.className = (main.className || '').replace(/\bvin\b/g, '');
  host.setAttribute('style', (main.getAttribute('style') || '') + `;position:fixed;left:-30000px;top:0;width:${SHOT_W}px;height:auto;overflow:visible;pointer-events:none;z-index:-1;contain:none`);
  host.setAttribute('aria-hidden', 'true');
  const frame = document.createElement('div');
  frame.className = 'shotframe';
  const scc = sc.cloneNode(false);
  scc.classList.remove('scroll');
  scc.setAttribute('style', 'overflow:visible;height:auto;max-height:none;padding:0;margin:0');
  const a = art.cloneNode(true);
  const a4 = a.classList.contains('a4');
  if (a4) {
    scc.style.background = getComputedStyle(art).background;
    a.style.cssText += ';width:auto;max-width:none;margin:0;box-shadow:none;min-height:0;border-radius:0';
  }
  /* tira o que é só de edição */
  a.querySelectorAll('.cbtns,.addrow,.addcov,.ptail,.bh,.pmeta button,.pmeta #wcount,.bmenu,.slash,[data-act=dcover]').forEach(x => x.remove());
  a.querySelectorAll('.pbreak').forEach(x => { x.innerHTML = ''; x.style.cssText = 'height:0;margin:0;padding:0;border:0'; });
  a.querySelectorAll('[contenteditable]').forEach(x => x.removeAttribute('contenteditable'));
  a.querySelectorAll('.picon').forEach(x => { if (!x.textContent.trim()) x.remove(); });
  const ta = art.querySelector('textarea.ptitle'), tc = a.querySelector('textarea.ptitle');
  if (tc) {
    const t = document.createElement('div'); t.className = tc.className; t.textContent = ta ? ta.value || 'Sem título' : (d.title || 'Sem título');
    t.style.cssText = 'white-space:pre-wrap;word-break:break-word;height:auto';
    tc.replaceWith(t);
  }
  a.querySelectorAll('textarea,input').forEach(x => { const s = document.createElement('div'); s.textContent = x.value; s.className = x.className; x.replaceWith(s); });
  scc.appendChild(a); frame.appendChild(scc); host.appendChild(frame); document.body.appendChild(host);
  /* imagens copiadas usam o mesmo endereço local: espera carregarem */
  return { host, frame, scc, art: a };
}
/* mede a posição de cada bloco como ele fica NO RETRATO (pode diferir alguns pixels da tela) */
async function shotLayout(MS, st) {
  st.art.querySelectorAll('.phead,.pcover,.blk').forEach((b, i) => { b.dataset.shotk = i; if (b.classList.contains('t-pb')) b.dataset.shotpb = 1; });
  const svg = await MS.domToForeignObjectSvg(st.frame, { width: SHOT_W, fetch: { requestInit: { cache: 'force-cache' } }, timeout: 15000 });
  const box = document.createElement('div');
  box.style.cssText = `position:fixed;left:-40000px;top:0;width:${SHOT_W}px;pointer-events:none;z-index:-1`;
  box.appendChild(svg); document.body.appendChild(box);
  await sleep(60);
  const fo = svg.querySelector('foreignObject'), rootEl = fo && fo.firstElementChild;
  const top = (rootEl || svg).getBoundingClientRect().top;
  const els = [...svg.querySelectorAll('[data-shotk]')];
  const out = {
    total: Math.ceil(Math.max(rootEl ? rootEl.getBoundingClientRect().height : 0, rootEl ? rootEl.scrollHeight : 0, ...els.map(e => e.getBoundingClientRect().bottom - top))),
    cuts: els.filter(e => !/\bt-h[123]\b/.test(e.className)).map(e => Math.round(e.getBoundingClientRect().bottom - top)).filter(y => y > 0).sort((a, b) => a - b),
    last: Math.round(Math.max(0, ...els.map(e => e.getBoundingClientRect().bottom - top))),
    breaks: els.filter(e => e.dataset.shotpb).map(e => Math.round(e.getBoundingClientRect().bottom - top)),
  };
  box.remove();
  if (!out.total) out.total = Math.ceil(st.frame.getBoundingClientRect().height);
  return out;
}
async function shotImgs(root) { await Promise.all([...root.querySelectorAll('img')].map(i => i.complete ? null : new Promise(r => { i.onload = i.onerror = r; setTimeout(r, 4000); }))); }
function shotBg(el) {
  const c = getComputedStyle(el).backgroundColor;
  return c && c !== 'rgba(0, 0, 0, 0)' && c !== 'transparent' ? c : getComputedStyle(document.body).backgroundColor || '#ffffff';
}
async function shotCanvas(MS, node, w, h, scale, bg) {
  return MS.domToCanvas(node, { width: w, height: h, scale, backgroundColor: bg, fetch: { requestInit: { cache: 'force-cache' } }, timeout: 15000 });
}
/* ---------- imagem ---------- */
async function docImage(d) {
  toast('Gerando imagem…', null, null, 5000);
  let st;
  try {
    const MS = await loadVendor('vendor/modern-screenshot.js', 'modernScreenshot');
    await shotOpen(d);
    st = shotStage(d); await shotImgs(st.host); await sleep(80);
    const L = await shotLayout(MS, st), h = Math.min(L.total, L.last + 56), bg = shotBg(st.scc);
    st.frame.style.height = h + 'px'; st.frame.style.overflow = 'hidden';
    const scale = Math.max(1, Math.min(2, Math.sqrt(15e6 / (SHOT_W * h)))); /* limite de tamanho de imagem do iPhone */
    const cv = await shotCanvas(MS, st.frame, SHOT_W, h, scale, bg);
    const blob = await new Promise(r => cv.toBlob(r, 'image/png'));
    await shareOrSave(blob, safeName(d.title || 'documento') + '.png');
  } catch (e) { console.error(e); toast('Não foi possível gerar a imagem: ' + (e.message || e)); }
  finally { st && st.host.remove(); }
}
/* ---------- PDF (A4) ---------- */
async function docPdfLook(d) {
  toast('Gerando PDF…', null, null, 6000);
  let st;
  try {
    const [MS] = await Promise.all([loadVendor('vendor/modern-screenshot.js', 'modernScreenshot'), loadVendor('vendor/jspdf.umd.min.js', 'jspdf')]);
    await shotOpen(d);
    st = shotStage(d); await shotImgs(st.host); await sleep(80);
    const L = await shotLayout(MS, st), { cuts, breaks } = L;
    const total = Math.min(L.total, L.last + 40); /* sem folha em branco no final */
    const pageH = Math.round(SHOT_W * 297 / 210), mg = Math.round(SHOT_W * 12 / 210); /* margem de 12 mm em cima e embaixo */
    /* pontos de corte: entre blocos, nunca no meio de uma linha */
    const pages = []; let y = 0, first = true;
    while (y < total - 4) {
      const avail = pageH - (first ? 0 : mg) - mg;
      let end = Math.min(total, y + avail);
      const forced = breaks.find(b => b > y + 20 && b <= end);
      if (forced) end = forced;
      else if (L.last <= y + avail + 12) end = total; /* o resto cabe nesta folha */
      else if (end < total) { const c = cuts.filter(c => c > y + avail * .35 && c <= end).pop(); if (c) end = c; }
      pages.push([y, end, first]); y = end; first = false;
    }
    const bg = shotBg(st.scc), scale = 2;
    const pdf = new window.jspdf.jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait', compress: true });
    const inner = st.scc;
    st.frame.style.overflow = 'hidden'; st.frame.style.position = 'relative';
    for (let i = 0; i < pages.length; i++) {
      const [a, b, isFirst] = pages[i], h = b - a;
      st.frame.style.height = h + 'px'; inner.style.transform = `translateY(${-a}px)`;
      await sleep(30);
      const part = await shotCanvas(window.modernScreenshot, st.frame, SHOT_W, h, scale, bg);
      const pc = document.createElement('canvas'); pc.width = SHOT_W * scale; pc.height = pageH * scale;
      const g = pc.getContext('2d'); g.fillStyle = bg; g.fillRect(0, 0, pc.width, pc.height);
      g.drawImage(part, 0, (isFirst ? 0 : mg) * scale);
      if (i) pdf.addPage('a4', 'portrait');
      pdf.addImage(pc.toDataURL('image/jpeg', .92), 'JPEG', 0, 0, 210, 297, undefined, 'FAST');
    }
    const blob = pdf.output('blob');
    await shareOrSave(blob, safeName(d.title || 'documento') + '.pdf');
  } catch (e) { console.error(e); toast('Não foi possível gerar o PDF: ' + (e.message || e)); }
  finally { st && st.host.remove(); }
}
/* no celular abre a folha de compartilhar (salvar em Arquivos/Fotos, WhatsApp…); no computador baixa */
async function shareOrSave(blob, name) {
  const file = new File([blob], name, { type: blob.type });
  if (isMobile() && navigator.canShare && navigator.canShare({ files: [file] })) {
    try { await navigator.share({ files: [file], title: name }); toast('Pronto'); return; } catch (e) { if (e.name === 'AbortError') return; }
  }
  download(name, blob); toast(name.endsWith('.pdf') ? 'PDF baixado' : 'Imagem baixada');
}
