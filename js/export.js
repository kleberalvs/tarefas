/* Exportação e importação: PDF, Word, Markdown, HTML, texto, CSV, Excel, ICS, JSON, ZIP; backup e importação do TickTick. */
'use strict';
const enc = new TextEncoder();
const xml = s => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '');
function toCsv(rows) { return rows.map(r => r.map(c => { const s = String(c ?? ''); return /[",;\n\r]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; }).join(',')).join('\r\n'); }

/* ---------- ZIP (sem compressão) ---------- */
function crc32(u) { let t = crc32.t; if (!t) { t = crc32.t = []; for (let n = 0, c; n < 256; n++) { c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } } let r = -1; for (let i = 0; i < u.length; i++) r = t[(r ^ u[i]) & 255] ^ (r >>> 8); return (r ^ -1) >>> 0; }
function zip(files) {
  const parts = [], cd = []; let off = 0;
  const now = new Date(), dt = ((now.getHours() << 11) | (now.getMinutes() << 5) | (now.getSeconds() >> 1)) & 0xffff, dd = (((now.getFullYear() - 1980) << 9) | ((now.getMonth() + 1) << 5) | now.getDate()) & 0xffff;
  for (const f of files) {
    const nm = enc.encode(f.name), data = typeof f.data === 'string' ? enc.encode(f.data) : f.data, crc = crc32(data);
    const h = new DataView(new ArrayBuffer(30));
    h.setUint32(0, 0x04034b50, true); h.setUint16(4, 20, true); h.setUint16(6, 0x0800, true); h.setUint16(8, 0, true); h.setUint16(10, dt, true); h.setUint16(12, dd, true);
    h.setUint32(14, crc, true); h.setUint32(18, data.length, true); h.setUint32(22, data.length, true); h.setUint16(26, nm.length, true);
    parts.push(new Uint8Array(h.buffer), nm, data);
    const c = new DataView(new ArrayBuffer(46));
    c.setUint32(0, 0x02014b50, true); c.setUint16(4, 20, true); c.setUint16(6, 20, true); c.setUint16(8, 0x0800, true); c.setUint16(12, dt, true); c.setUint16(14, dd, true);
    c.setUint32(16, crc, true); c.setUint32(20, data.length, true); c.setUint32(24, data.length, true); c.setUint16(28, nm.length, true); c.setUint32(42, off, true);
    cd.push(new Uint8Array(c.buffer), nm);
    off += 30 + nm.length + data.length;
  }
  const cdl = cd.reduce((s, x) => s + x.length, 0), e = new DataView(new ArrayBuffer(22));
  e.setUint32(0, 0x06054b50, true); e.setUint16(8, files.length, true); e.setUint16(10, files.length, true); e.setUint32(12, cdl, true); e.setUint32(16, off, true);
  return new Blob([...parts, ...cd, new Uint8Array(e.buffer)], { type: 'application/zip' });
}

/* ---------- HTML de linha → outros formatos ---------- */
function frag(html) { const d = document.createElement('div'); d.innerHTML = clean(html || ''); return d; }
function mentionText(n) { const k = n.dataset.kind, r = n.dataset.ref; if (k === 'date') return fmtDay(r, true); if (k === 'task') { const t = get('t', r); return (t && t.done ? '☑ ' : '☐ ') + (t ? t.title : n.textContent.replace(/^☐\s*/, '')); } if (k === 'doc') { const d = get('d', r); return d ? d.title || 'Sem título' : n.textContent; } return n.textContent; }
function inlineMd(html) {
  const walk = n => Array.from(n.childNodes).map(c => {
    if (c.nodeType === 3) return c.textContent.replace(/([*_`~\[\]])/g, '\\$1');
    if (c.nodeType !== 1) return '';
    if (c.classList && c.classList.contains('mention')) return mentionText(c);
    const inner = walk(c);
    switch (c.tagName) {
      case 'B': case 'STRONG': return inner.trim() ? `**${inner}**` : inner;
      case 'I': case 'EM': return inner.trim() ? `*${inner}*` : inner;
      case 'S': case 'STRIKE': return `~~${inner}~~`;
      case 'CODE': return '`' + c.textContent + '`';
      case 'A': return `[${inner}](${c.getAttribute('href')})`;
      case 'BR': return '  \n';
      case 'MARK': return `==${inner}==`;
      default: return inner;
    }
  }).join('');
  return walk(frag(html)).replace(/\u00a0/g, ' ');
}
function inlineTxt(html) { const d = frag(html); d.querySelectorAll('.mention').forEach(m => m.replaceWith(mentionText(m))); d.querySelectorAll('br').forEach(b => b.replaceWith('\n')); return d.textContent.replace(/\u00a0/g, ' '); }
function inlineHtml(html) { const d = frag(html); d.querySelectorAll('.mention').forEach(m => { const s = document.createElement('span'); s.className = 'mention'; s.textContent = mentionText(m); m.replaceWith(s); }); return d.innerHTML; }

/* ---------- documentos ---------- */
function docToMd(d, imgName) {
  const out = [`# ${d.icon && d.icon !== '📄' ? d.icon + ' ' : ''}${d.title || 'Sem título'}`, ''];
  let n = 0;
  (d.b || []).forEach((b, i, arr) => {
    const ind = '  '.repeat(b.lvl || 0), t = inlineMd(b.text);
    n = b.type === 'ol' ? (i && arr[i - 1].type === 'ol' && (arr[i - 1].lvl || 0) === (b.lvl || 0) ? n + 1 : 1) : 0;
    const last = out[out.length - 1];
    const sep = () => { if (last !== '' && !['ul', 'ol', 'todo'].includes(b.type)) out.push(''); };
    switch (b.type) {
      case 'h1': sep(); out.push('# ' + t, ''); break;
      case 'h2': sep(); out.push('## ' + t, ''); break;
      case 'h3': sep(); out.push('### ' + t, ''); break;
      case 'ul': out.push(ind + '- ' + t); break;
      case 'ol': out.push(ind + n + '. ' + t); break;
      case 'todo': out.push(ind + (b.checked ? '- [x] ' : '- [ ] ') + t); break;
      case 'toggle': out.push(ind + '- ▸ ' + t); break;
      case 'quote': sep(); out.push('> ' + t, ''); break;
      case 'callout': sep(); out.push(`> ${b.emoji || '💡'} ${t}`, ''); break;
      case 'code': sep(); out.push('```', inlineTxt(b.text), '```', ''); break;
      case 'hr': sep(); out.push('---', ''); break;
      case 'img': sep(); out.push(b.file ? `![${inlineTxt(b.text) || b.file.name}](${imgName ? imgName(b.file) : b.file.name})` : '', ''); break;
      case 'file': sep(); out.push(b.file ? `📎 ${b.file.name}` : '', ''); break;
      case 'task': { const x = get('t', b.ref); out.push(ind + (x && x.done ? '- [x] ' : '- [ ] ') + (x ? x.title + (x.due ? ` (📅 ${fmtWhen(x.due)})` : '') : 'Tarefa excluída')); break; }
      case 'page': { const p = get('d', b.ref); out.push(`📄 ${p ? p.title || 'Sem título' : ''}`); break; }
      case 'table': { sep(); const r = b.rows || []; if (r.length) { out.push('| ' + r[0].map(c => inlineMd(c).replace(/\|/g, '\\|')).join(' | ') + ' |', '| ' + r[0].map(() => '---').join(' | ') + ' |'); r.slice(1).forEach(row => out.push('| ' + row.map(c => inlineMd(c).replace(/\|/g, '\\|')).join(' | ') + ' |')); } out.push(''); break; }
      default: sep(); out.push(ind + t, '');
    }
  });
  return out.join('\n').replace(/\n{3,}/g, '\n\n').trim() + '\n';
}
function docToTxt(d) {
  const out = [(d.title || 'Sem título').toUpperCase(), ''];
  let n = 0;
  (d.b || []).forEach((b, i, arr) => {
    const ind = '   '.repeat(b.lvl || 0), t = inlineTxt(b.text);
    n = b.type === 'ol' ? (i && arr[i - 1].type === 'ol' ? n + 1 : 1) : 0;
    if (b.type === 'ul') out.push(ind + '• ' + t);
    else if (b.type === 'ol') out.push(ind + n + '. ' + t);
    else if (b.type === 'todo') out.push(ind + (b.checked ? '[x] ' : '[ ] ') + t);
    else if (/^h/.test(b.type)) out.push('', t.toUpperCase(), '');
    else if (b.type === 'hr') out.push('—'.repeat(30));
    else if (b.type === 'task') { const x = get('t', b.ref); out.push(ind + (x && x.done ? '[x] ' : '[ ] ') + (x ? x.title : '')); }
    else if (b.type === 'table') (b.rows || []).forEach(r => out.push(r.map(inlineTxt).join('\t')));
    else if (b.type === 'img' || b.type === 'file') out.push(b.file ? '[' + b.file.name + ']' : '');
    else if (b.type === 'page') { const p = get('d', b.ref); out.push('→ ' + (p ? p.title : '')); }
    else if (b.type === 'callout') out.push((b.emoji || '') + ' ' + t);
    else out.push(ind + t);
  });
  return out.join('\n').replace(/\n{3,}/g, '\n\n').trim() + '\n';
}
const blobToDataUrl = b => new Promise(r => { const f = new FileReader(); f.onload = () => r(f.result); f.onerror = () => r(''); f.readAsDataURL(b); });
const PCOLS = { gray: ['#787774', '#f1f1ef'], brown: ['#9f6b53', '#f4eeee'], orange: ['#d9730d', '#fbecdd'], yellow: ['#b8860b', '#fbf3db'], green: ['#448361', '#edf3ec'], blue: ['#337ea9', '#e7f3f8'], purple: ['#9065b0', '#f6f3f9'], pink: ['#c14c8a', '#faf1f5'], red: ['#d44c47', '#fdebec'] };
const PBGC = { plain: '#ffffff', paper: '#fbf8f1', gray: '#f4f4f2', sand: '#f6efe3', mint: '#eef7f1', sky: '#eef4fb', lavender: '#f3f0fa', rose: '#fbf0f2', night: '#1f2023' };
const PFONT = { sans: "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif", serif: "'Iowan Old Style','Palatino Linotype',Palatino,Georgia,'Times New Roman',serif", mono: "'SF Mono',Menlo,Consolas,'Liberation Mono',monospace", rounded: "ui-rounded,'SF Pro Rounded','Nunito','Segoe UI',system-ui,sans-serif" };
const COVER_CSS = { sunset: 'linear-gradient(120deg,#ff9a76,#f6416c 55%,#a83279)', ocean: 'linear-gradient(120deg,#43c6ac,#2f80ed 60%,#1f3b73)', forest: 'linear-gradient(120deg,#a8e063,#3c8d40 55%,#134e2a)', sand: 'linear-gradient(120deg,#f8e1b4,#e7b980 55%,#c58a55)', berry: 'linear-gradient(120deg,#f5a3c7,#c2185b 55%,#6a1b4d)', graphite: 'linear-gradient(120deg,#8e9eab,#4b5563 55%,#1f2937)', aurora: 'linear-gradient(120deg,#00c9a7,#845ec2 50%,#ff6f91)' };
const FONT_LINK = '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Caveat:wght@500&family=Inter:wght@400;600;700&family=Lora:ital,wght@0,400;0,700;1,400&family=Merriweather:ital,wght@0,400;0,700;1,400&family=Montserrat:wght@400;600;700&family=Nunito:wght@400;700&family=Playfair+Display:wght@400;700&family=Roboto+Slab:wght@400;700&family=Source+Code+Pro:wght@400;600&display=swap">';
async function docToHtml(d, forPrint, opts = {}) {
  const s = Object.assign({ bg: 'plain', font: 'sans', size: 'm', lh: '1.6', margin: 'n' }, d.style || {});
  const a4 = forPrint || s.page === 'a4', mg = (typeof MARGINS !== 'undefined' && MARGINS[s.margin]) || [20, 22];
  const imgs = {};
  for (const b of (d.b || [])) if (b.type === 'img' && b.file) { try { imgs[b.file.id] = await blobToDataUrl(await FILES.blob(b.file)); } catch (e) {} }
  let coverBg = '';
  const c = s.cover;
  if (c && c.file) { try { coverBg = `url(${await blobToDataUrl(await FILES.blob(c.file))}) center ${+s.coverY || 50}%/cover no-repeat`; } catch (e) {} }
  else if (typeof c === 'string' && COVER_CSS[c]) coverBg = COVER_CSS[c];
  const full = !!(s.coverFull && coverBg);
  let body = '', n = 0, listOpen = null;
  const close = () => { if (listOpen) { body += `</${listOpen}>`; listOpen = null; } };
  (d.b || []).forEach((b, i, arr) => {
    const st = (b.color ? `color:${PCOLS[b.color][0]};` : '') + (b.bg ? `background:${PCOLS[b.bg][1]};padding:4px 8px;border-radius:6px;` : '') + (b.lvl ? `margin-left:${b.lvl * 24}px;` : '') + (b.align ? `text-align:${b.align};` : '');
    const t = inlineHtml(b.text), A = st ? ` style="${st}"` : '';
    const lt = b.type === 'ul' || b.type === 'todo' || b.type === 'task' ? 'ul' : b.type === 'ol' ? 'ol' : null;
    if (lt !== listOpen) { close(); if (lt) { body += `<${lt}${lt === 'ul' && (b.type === 'todo' || b.type === 'task') ? ' class="todo"' : ''}>`; listOpen = lt; } }
    switch (b.type) {
      case 'h1': case 'h2': case 'h3': body += `<${b.type}${A}>${t}</${b.type}>`; break;
      case 'ul': case 'ol': body += `<li${A}>${t}</li>`; break;
      case 'todo': body += `<li${A} class="${b.checked ? 'ok' : ''}"><span class="box">${b.checked ? '☑' : '☐'}</span> ${t}</li>`; break;
      case 'task': { const x = get('t', b.ref); body += `<li class="${x && x.done ? 'ok' : ''}"><span class="box">${x && x.done ? '☑' : '☐'}</span> ${esc(x ? x.title : '')}${x && x.due ? ` <small>📅 ${esc(fmtWhen(x.due))}</small>` : ''}</li>`; break; }
      case 'toggle': body += `<p${A}>▸ ${t}</p>`; break;
      case 'quote': body += `<blockquote${A}>${t}</blockquote>`; break;
      case 'callout': body += `<div class="callout" style="background:${PCOLS[b.bg || 'yellow'][1]}">${esc(b.emoji || '💡')} <span>${t}</span></div>`; break;
      case 'code': body += `<pre><code>${b.text || ''}</code></pre>`; break;
      case 'hr': body += '<hr>'; break;
      case 'pb': body += '<div class="pb"></div>'; break;
      case 'img': body += b.file && imgs[b.file.id] ? `<figure class="isz-${esc(b.size || 'l')}"><img src="${imgs[b.file.id]}" alt=""><figcaption>${t}</figcaption></figure>` : ''; break;
      case 'file': body += b.file ? `<p>📎 ${esc(b.file.name)} <small>(${fmtSize(b.file.size)})</small></p>` : ''; break;
      case 'page': { const p = get('d', b.ref); body += `<p>📄 ${esc(p ? p.title || 'Sem título' : '')}</p>`; break; }
      case 'table': body += `<table>${(b.rows || []).map((r, ri) => `<tr>${r.map(c2 => ri === 0 && b.head !== false ? `<th>${inlineHtml(c2)}</th>` : `<td>${inlineHtml(c2)}</td>`).join('')}</tr>`).join('')}</table>`; break;
      default: body += `<p${A}>${t || '&nbsp;'}</p>`;
    }
    if (b.st === 'card' || b.st === 'focus') body = body.replace(/<(p|h\d|blockquote)([^>]*)>([^]*)<\/\1>$/, `<div class="${b.st}"><$1$2>$3</$1></div>`);
  });
  close();
  const dark = s.bg === 'night' && !forPrint, fs = { s: 13.5, m: 15, l: 17 }[s.size] || 15;
  const pageBg = forPrint ? '#fff' : (PBGC[s.bg] || '#fff');
  const title = `${d.icon && d.icon !== '📄' ? esc(d.icon) + ' ' : ''}${esc(d.title || 'Sem título')}`;
  const head = full ? `<section class="fcover" style="background:${coverBg}"><div class="fct"><h1>${title}</h1><p>${new Date(d.u || d.c).toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' })}</p></div></section>`
    : `${coverBg ? `<div class="cover ch-${esc(s.coverH || 'm')}" style="background:${coverBg}"></div>` : ''}<h1 class="title">${title}</h1><div class="meta">Atualizado em ${new Date(d.u || d.c).toLocaleString('pt-BR')}</div>`;
  return `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(d.title || 'Documento')}</title>${FONT_LINK}<style>
  @page{size:A4;margin:${mg[0]}mm ${mg[1]}mm}
  ${full ? '@page:first{margin:0}' : ''}
  *{box-sizing:border-box}
  html,body{margin:0;background:${a4 && !forPrint ? '#e9e8e5' : pageBg};-webkit-print-color-adjust:exact;print-color-adjust:exact}
  body{color:${dark ? '#e8e8e8' : '#202020'};font:${fs}px/${s.lh || 1.6} ${PFONT[s.font] || PFONT.sans}}
  main{${a4 && !forPrint ? `width:210mm;min-height:297mm;margin:24px auto;padding:${mg[0]}mm ${mg[1]}mm;background:${pageBg};box-shadow:0 4px 24px rgba(0,0,0,.12)` : forPrint ? 'padding:0' : `max-width:${s.width === 'wide' ? 900 : s.width === 'narrow' ? 600 : 720}px;margin:0 auto;padding:48px 24px`}}
  .cover{height:${{ s: 28, m: 42, l: 62 }[s.coverH || 'm']}mm;border-radius:8px;margin:0 0 6mm}
  .fcover{height:297mm;width:210mm;margin:${forPrint ? '0' : `-${mg[0]}mm -${mg[1]}mm ${mg[0]}mm`};position:relative;break-after:page;page-break-after:always;display:flex;align-items:flex-end}
  .fcover .fct{width:100%;padding:24mm 22mm;background:linear-gradient(to top,rgba(0,0,0,.6),transparent);color:#fff}
  .fcover h1{font-size:34pt;line-height:1.1;margin:0 0 4mm;text-shadow:0 2px 12px rgba(0,0,0,.35)}.fcover p{margin:0;font-size:12pt;opacity:.9}
  h1.title{font-size:2.1em;line-height:1.2;margin:.2em 0 .3em}h1{font-size:1.7em;margin:1.1em 0 .4em;break-after:avoid}h2{font-size:1.38em;margin:1em 0 .3em;break-after:avoid}h3{font-size:1.15em;margin:.9em 0 .3em;break-after:avoid}
  p{margin:.35em 0}blockquote{border-left:3px solid ${s.accent || '#DB4035'};margin:.8em 0;padding:.2em 0 .2em 1em;color:#555;font-style:italic}
  .callout{display:flex;gap:.6em;padding:.8em 1em;border-radius:10px;margin:.8em 0;break-inside:avoid}
  pre{background:#f5f5f4;border-radius:8px;padding:12px 14px;font:.86em/1.5 ${PFONT.mono};white-space:pre-wrap;break-inside:avoid}code{font-family:${PFONT.mono};background:#f1f1ef;padding:.1em .3em;border-radius:4px;font-size:.9em}pre code{background:none;padding:0}
  ul.todo{list-style:none;padding-left:.2em}ul.todo li.ok{color:#8a8a8a;text-decoration:line-through}.box{font-size:1.1em}
  table{border-collapse:collapse;width:100%;margin:.8em 0;font-size:.95em;break-inside:auto}tr{break-inside:avoid}th,td{border:1px solid #ddd;padding:6px 10px;text-align:left;vertical-align:top}th{background:#f6f6f4}
  figure{margin:1em 0;text-align:center;break-inside:avoid}figure img{max-width:100%;border-radius:6px}figure.isz-s img{max-width:45%}figure.isz-m img{max-width:75%}figcaption{color:#777;font-size:.85em}
  hr{border:0;border-top:1px solid #ddd;margin:1.4em 0}a{color:${s.accent || '#DB4035'}}.mention{background:#f3f3f1;border-radius:4px;padding:0 .3em}
  .card{border:1px solid #e5e5e5;border-radius:10px;padding:.6em 1em;margin:.6em 0;break-inside:avoid}.focus{font-size:1.25em;font-weight:600}
  .pb{break-after:page;page-break-after:always;height:0}
  small{color:#888}.meta{color:#888;font-size:.85em;margin-bottom:1.6em}
  </style></head><body><main>${head}${body}</main>${opts.tail || ''}</body></html>`;
}
/* PDF de verdade, gerado no próprio aparelho (A4), sem a janela de impressão */
async function downloadPdf(d) {
  toast('Gerando PDF…', null, null, 4000);
  const mg = (MARGINS[(d.style || {}).margin] || MARGINS.n);
  const name = safeName(d.title || 'documento') + '.pdf';
  const full = !!(d.style && d.style.coverFull && hasCover(d));
  const script = `<script src="https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js"><\/script><script>
    window.onload=function(){setTimeout(function(){
      var m=document.querySelector('main');
      html2pdf().set({margin:[${mg[0]},${mg[1]},${mg[0]},${mg[1]}],filename:${JSON.stringify(name)},image:{type:'jpeg',quality:.95},html2canvas:{scale:2,useCORS:true,backgroundColor:null},jsPDF:{unit:'mm',format:'a4',orientation:'portrait'},pagebreak:{mode:['css','legacy'],before:'.pbb',after:['.pb','.fcover'],avoid:['figure','tr','.callout','pre','.card']}}).from(m).save().then(function(){parent.postMessage('pdf-ok','*')}).catch(function(e){parent.postMessage('pdf-err:'+e,'*')});
    },600)};<\/script>`;
  let html = await docToHtml(d, true, { tail: script });
  if (full) html = html.replace('.fcover{height:297mm;width:210mm;margin:0', `.fcover{height:${297 - 2 * mg[0]}mm;width:auto;margin:0`);
  const f = document.createElement('iframe');
  f.style.cssText = `position:fixed;left:-10000px;top:0;width:${210 - 2 * mg[1]}mm;height:297mm;border:0`;
  document.body.appendChild(f);
  const done = e => { if (typeof e.data === 'string' && e.data.startsWith('pdf-')) { removeEventListener('message', done); setTimeout(() => f.remove(), 1500); toast(e.data === 'pdf-ok' ? 'PDF baixado' : 'Não foi possível gerar o PDF aqui. Use “PDF (imprimir)”.'); } };
  addEventListener('message', done);
  f.srcdoc = html;
  setTimeout(() => { if (f.isConnected) { f.remove(); removeEventListener('message', done); toast('Sem conexão para gerar o PDF. Use “PDF (imprimir)”.'); } }, 45000);
}
function printHtml(html) {
  const f = document.createElement('iframe');
  f.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0';
  document.body.appendChild(f);
  f.srcdoc = html;
  f.onload = () => { setTimeout(() => { try { f.contentWindow.focus(); f.contentWindow.print(); } catch (e) { download('impressao.html', html, 'text/html'); } setTimeout(() => f.remove(), 60000); }, 350); };
  toast('Na janela de impressão, escolha “Salvar como PDF”');
}

/* ---------- Word (.docx) ---------- */
function runsXml(html, base = {}) {
  const out = [];
  const walk = (n, st) => Array.from(n.childNodes).forEach(c => {
    if (c.nodeType === 3) { if (c.textContent) out.push(runXml(c.textContent, st)); return; }
    if (c.nodeType !== 1) return;
    if (c.classList && c.classList.contains('mention')) { out.push(runXml(mentionText(c), Object.assign({}, st, { shade: 'F1F1EF' }))); return; }
    const s = Object.assign({}, st);
    if (/^(B|STRONG)$/.test(c.tagName)) s.b = 1;
    if (/^(I|EM)$/.test(c.tagName)) s.i = 1;
    if (c.tagName === 'U') s.u = 1;
    if (/^(S|STRIKE)$/.test(c.tagName)) s.s = 1;
    if (c.tagName === 'CODE') s.code = 1;
    if (c.tagName === 'A') { s.u = 1; s.color = 'DB4035'; }
    if (c.tagName === 'BR') { out.push('<w:r><w:br/></w:r>'); return; }
    const style = c.getAttribute && c.getAttribute('style') || '';
    const col = style.match(/(?:^|;)\s*color:\s*([^;]+)/i), bg = style.match(/background(?:-color)?:\s*([^;]+)/i);
    const fz = style.match(/font-size:\s*([\d.]+)(px|pt)/i), ff = style.match(/font-family:\s*'?([^;',]+)/i);
    if (col) s.color = cssHex(col[1]); if (bg) s.shade = cssHex(bg[1]);
    if (fz) s.sz = Math.round((fz[2] === 'pt' ? +fz[1] : +fz[1] * .75) * 2);
    if (ff) s.font = ff[1].trim();
    if (c.tagName === 'SUP') s.va = 'superscript'; if (c.tagName === 'SUB') s.va = 'subscript';
    walk(c, s);
  });
  walk(frag(html), base);
  return out.join('');
}
function cssHex(c) { c = c.trim(); let m = c.match(/^#([0-9a-f]{6})/i); if (m) return m[1].toUpperCase(); m = c.match(/^#([0-9a-f]{3})$/i); if (m) return m[1].split('').map(x => x + x).join('').toUpperCase(); m = c.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/); if (m) return [m[1], m[2], m[3]].map(x => (+x).toString(16).padStart(2, '0')).join('').toUpperCase(); return null; }
function runXml(t, s) {
  let p = '';
  if (s.b) p += '<w:b/>'; if (s.i) p += '<w:i/>'; if (s.u) p += '<w:u w:val="single"/>'; if (s.s) p += '<w:strike/>';
  if (s.code) p += '<w:rFonts w:ascii="Consolas" w:hAnsi="Consolas"/>';
  else if (s.font) p += `<w:rFonts w:ascii="${xml(s.font)}" w:hAnsi="${xml(s.font)}"/>`;
  if (s.color) p += `<w:color w:val="${s.color}"/>`;
  if (s.shade && s.shade !== '000000') p += `<w:shd w:val="clear" w:color="auto" w:fill="${s.shade}"/>`;
  if (s.sz) p += `<w:sz w:val="${s.sz}"/>`;
  if (s.va) p += `<w:vertAlign w:val="${s.va}"/>`;
  return `<w:r>${p ? `<w:rPr>${p}</w:rPr>` : ''}<w:t xml:space="preserve">${xml(t.replace(/\u00a0/g, ' '))}</w:t></w:r>`;
}
const pXml = (runs, o = {}) => `<w:p><w:pPr>${o.style ? `<w:pStyle w:val="${o.style}"/>` : ''}${o.ind ? `<w:ind w:left="${o.ind}" w:hanging="${o.hang || 0}"/>` : ''}${o.shade ? `<w:shd w:val="clear" w:color="auto" w:fill="${o.shade}"/>` : ''}${o.align ? `<w:jc w:val="${o.align}"/>` : ''}</w:pPr>${runs}</w:p>`;
async function imgInfo(blob) { return new Promise(res => { const u = URL.createObjectURL(blob), im = new Image(); im.onload = () => { res({ w: im.naturalWidth, h: im.naturalHeight }); URL.revokeObjectURL(u); }; im.onerror = () => res({ w: 600, h: 400 }); im.src = u; }); }
async function docToDocx(d) {
  const media = [], rels = [];
  let body = '';
  const addImg = async (blob, ext, maxIn = 6.2) => {
    const { w, h } = await imgInfo(blob), max = maxIn * 914400, cx = Math.min(max, w * 9525), cy = Math.round(cx * h / w), k = media.length + 1, rid = 'rIdImg' + k;
    media.push({ name: `word/media/image${k}.${ext}`, data: new Uint8Array(await blob.arrayBuffer()) });
    rels.push(`<Relationship Id="${rid}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/image${k}.${ext}"/>`);
    return `<w:p><w:pPr><w:jc w:val="center"/></w:pPr><w:r><w:drawing><wp:inline distT="0" distB="0" distL="0" distR="0"><wp:extent cx="${cx}" cy="${cy}"/><wp:docPr id="${k}" name="Imagem ${k}"/><a:graphic xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:pic xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:nvPicPr><pic:cNvPr id="${k}" name="image${k}.${ext}"/><pic:cNvPicPr/></pic:nvPicPr><pic:blipFill><a:blip r:embed="${rid}"/><a:stretch><a:fillRect/></a:stretch></pic:blipFill><pic:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="${cx}" cy="${cy}"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></pic:spPr></pic:pic></a:graphicData></a:graphic></wp:inline></w:drawing></w:r></w:p>`;
  };
  const cv = d.style && d.style.cover;
  if (cv && cv.file) { try { const bl = await FILES.blob(cv.file); const ext = (cv.file.type.split('/')[1] || 'jpg').replace('jpeg', 'jpg'); if (['png', 'jpg', 'gif'].includes(ext)) body += await addImg(bl, ext, 6.3); } catch (e) {} }
  body += pXml(runXml((d.icon && d.icon !== '📄' ? d.icon + ' ' : '') + (d.title || 'Sem título'), {}), { style: 'Title' });
  if (d.style && d.style.coverFull) body += '<w:p><w:r><w:br w:type="page"/></w:r></w:p>';
  let n = 0;
  for (let i = 0; i < (d.b || []).length; i++) {
    const b = d.b[i], arr = d.b, base = b.color ? { color: cssHex(PCOLS[b.color][0]) } : {};
    const sh = b.bg ? cssHex(PCOLS[b.bg][1]) : null, ind = (b.lvl || 0) * 360, al = b.align ? { center: 'center', right: 'right', justify: 'both' }[b.align] : null;
    if (b.type === 'pb') { body += '<w:p><w:r><w:br w:type="page"/></w:r></w:p>'; continue; }
    n = b.type === 'ol' ? (i && arr[i - 1].type === 'ol' ? n + 1 : 1) : 0;
    switch (b.type) {
      case 'h1': body += pXml(runsXml(b.text, base), { style: 'Heading1', shade: sh, align: al }); break;
      case 'h2': body += pXml(runsXml(b.text, base), { style: 'Heading2', shade: sh, align: al }); break;
      case 'h3': body += pXml(runsXml(b.text, base), { style: 'Heading3', shade: sh, align: al }); break;
      case 'ul': body += pXml(runXml('•\t', {}) + runsXml(b.text, base), { ind: 360 + ind, hang: 360, shade: sh }); break;
      case 'ol': body += pXml(runXml(n + '.\t', {}) + runsXml(b.text, base), { ind: 360 + ind, hang: 360, shade: sh }); break;
      case 'todo': body += pXml(runXml((b.checked ? '☑' : '☐') + '\t', {}) + runsXml(b.text, Object.assign({}, base, b.checked ? { s: 1, color: '8A8A8A' } : {})), { ind: 360 + ind, hang: 360 }); break;
      case 'task': { const x = get('t', b.ref); body += pXml(runXml((x && x.done ? '☑' : '☐') + '\t' + (x ? x.title : ''), x && x.done ? { s: 1, color: '8A8A8A' } : {}) + (x && x.due ? runXml('  📅 ' + fmtWhen(x.due), { color: '888888', sz: 18 }) : ''), { ind: 360 + ind, hang: 360 }); break; }
      case 'quote': body += pXml(runsXml(b.text, Object.assign({ i: 1 }, base)), { style: 'Quote' }); break;
      case 'callout': body += pXml(runXml((b.emoji || '💡') + '  ', {}) + runsXml(b.text, base), { shade: cssHex(PCOLS[b.bg || 'yellow'][1]) }); break;
      case 'code': inlineTxt(b.text).split('\n').forEach(l => { body += pXml(runXml(l || ' ', { code: 1 }), { style: 'Code' }); }); break;
      case 'hr': body += '<w:p><w:pPr><w:pBdr><w:bottom w:val="single" w:sz="6" w:space="1" w:color="CCCCCC"/></w:pBdr></w:pPr></w:p>'; break;
      case 'toggle': body += pXml(runXml('▸ ', {}) + runsXml(b.text, base), { ind }); break;
      case 'page': { const p = get('d', b.ref); body += pXml(runXml('📄 ' + (p ? p.title || 'Sem título' : ''), { b: 1 })); break; }
      case 'file': if (b.file) body += pXml(runXml('📎 ' + b.file.name + ' (' + fmtSize(b.file.size) + ')', { color: '666666' })); break;
      case 'img': {
        if (!b.file) break;
        try {
          const blob = await FILES.blob(b.file), ext = (b.file.type.split('/')[1] || 'png').replace('jpeg', 'jpg').replace(/[^a-z]/g, '') || 'png';
          if (!['png', 'jpg', 'gif', 'bmp'].includes(ext)) { body += pXml(runXml('[Imagem: ' + b.file.name + ']', { i: 1 })); break; }
          const { w, h } = await imgInfo(blob), max = 6.2 * 914400, cx = Math.min(max, w * 9525), cy = Math.round(cx * h / w), k = media.length + 1, rid = 'rIdImg' + k;
          media.push({ name: `word/media/image${k}.${ext}`, data: new Uint8Array(await blob.arrayBuffer()) });
          rels.push(`<Relationship Id="${rid}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/image${k}.${ext}"/>`);
          body += `<w:p><w:pPr><w:jc w:val="center"/></w:pPr><w:r><w:drawing><wp:inline distT="0" distB="0" distL="0" distR="0"><wp:extent cx="${cx}" cy="${cy}"/><wp:docPr id="${k}" name="Imagem ${k}"/><a:graphic xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:pic xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:nvPicPr><pic:cNvPr id="${k}" name="image${k}.${ext}"/><pic:cNvPicPr/></pic:nvPicPr><pic:blipFill><a:blip r:embed="${rid}"/><a:stretch><a:fillRect/></a:stretch></pic:blipFill><pic:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="${cx}" cy="${cy}"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></pic:spPr></pic:pic></a:graphicData></a:graphic></wp:inline></w:drawing></w:r></w:p>`;
          if (stripHtml(b.text)) body += pXml(runsXml(b.text, { i: 1, color: '777777' }), { align: 'center' });
        } catch (e) { body += pXml(runXml('[Imagem indisponível: ' + b.file.name + ']', { i: 1 })); }
        break;
      }
      case 'table': {
        const rows = b.rows || [];
        body += `<w:tbl><w:tblPr><w:tblStyle w:val="TableGrid"/><w:tblW w:w="5000" w:type="pct"/><w:tblBorders>${['top', 'left', 'bottom', 'right', 'insideH', 'insideV'].map(s => `<w:${s} w:val="single" w:sz="4" w:space="0" w:color="CCCCCC"/>`).join('')}</w:tblBorders></w:tblPr>` +
          rows.map((r, ri) => `<w:tr>${r.map(c => `<w:tc><w:tcPr>${ri === 0 && b.head !== false ? '<w:shd w:val="clear" w:color="auto" w:fill="F2F2F0"/>' : ''}</w:tcPr>${pXml(runsXml(c, ri === 0 && b.head !== false ? { b: 1 } : {}) || runXml(' ', {}))}</w:tc>`).join('')}</w:tr>`).join('') + '</w:tbl>' + pXml('');
        break;
      }
      default: body += pXml(runsXml(b.text, base), { ind, shade: sh, style: b.st === 'focus' ? 'Subtitle' : null, align: al });
    }
  }
  return buildDocx(body, rels, media);
}
function buildDocx(body, rels = [], media = []) {
  const W = 'xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture"';
  const doc = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document ${W}><w:body>${body}<w:sectPr><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="1134" w:right="1134" w:bottom="1134" w:left="1134" w:header="708" w:footer="708" w:gutter="0"/></w:sectPr></w:body></w:document>`;
  const sty = (id, name, rpr, ppr = '') => `<w:style w:type="paragraph" w:styleId="${id}"><w:name w:val="${name}"/><w:basedOn w:val="Normal"/><w:next w:val="Normal"/><w:qFormat/><w:pPr>${ppr}</w:pPr><w:rPr>${rpr}</w:rPr></w:style>`;
  const styles = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:docDefaults><w:rPrDefault><w:rPr><w:rFonts w:ascii="Calibri" w:hAnsi="Calibri" w:eastAsia="Calibri" w:cs="Calibri"/><w:sz w:val="22"/><w:lang w:val="pt-BR"/></w:rPr></w:rPrDefault><w:pPrDefault><w:pPr><w:spacing w:after="100" w:line="276" w:lineRule="auto"/></w:pPr></w:pPrDefault></w:docDefaults>
<w:style w:type="paragraph" w:default="1" w:styleId="Normal"><w:name w:val="Normal"/><w:qFormat/></w:style>
${sty('Title', 'Title', '<w:b/><w:sz w:val="44"/>', '<w:spacing w:after="240"/>')}${sty('Subtitle', 'Subtitle', '<w:b/><w:sz w:val="28"/>')}${sty('Heading1', 'heading 1', '<w:b/><w:sz w:val="34"/>', '<w:keepNext/><w:spacing w:before="320" w:after="120"/><w:outlineLvl w:val="0"/>')}${sty('Heading2', 'heading 2', '<w:b/><w:sz w:val="28"/>', '<w:keepNext/><w:spacing w:before="260" w:after="100"/><w:outlineLvl w:val="1"/>')}${sty('Heading3', 'heading 3', '<w:b/><w:sz w:val="24"/>', '<w:keepNext/><w:spacing w:before="200" w:after="80"/><w:outlineLvl w:val="2"/>')}${sty('Quote', 'Quote', '<w:i/><w:color w:val="555555"/>', '<w:ind w:left="360"/><w:pBdr><w:left w:val="single" w:sz="18" w:space="8" w:color="DB4035"/></w:pBdr>')}${sty('Code', 'Code', '<w:rFonts w:ascii="Consolas" w:hAnsi="Consolas"/><w:sz w:val="19"/>', '<w:spacing w:after="0"/><w:shd w:val="clear" w:color="auto" w:fill="F5F5F4"/>')}
<w:style w:type="table" w:styleId="TableGrid"><w:name w:val="Table Grid"/><w:tblPr><w:tblCellMar><w:top w:w="60" w:type="dxa"/><w:left w:w="100" w:type="dxa"/><w:bottom w:w="60" w:type="dxa"/><w:right w:w="100" w:type="dxa"/></w:tblCellMar></w:tblPr></w:style></w:styles>`;
  const ct = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Default Extension="png" ContentType="image/png"/><Default Extension="jpg" ContentType="image/jpeg"/><Default Extension="gif" ContentType="image/gif"/><Default Extension="bmp" ContentType="image/bmp"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/><Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/><Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/></Types>`;
  const root = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/></Relationships>`;
  const drels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rIdSt" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>${rels.join('')}</Relationships>`;
  const core = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"><dc:creator>Tarefas</dc:creator><dcterms:created xsi:type="dcterms:W3CDTF">${new Date().toISOString().slice(0, 19)}Z</dcterms:created></cp:coreProperties>`;
  return zip([{ name: '[Content_Types].xml', data: ct }, { name: '_rels/.rels', data: root }, { name: 'word/document.xml', data: doc }, { name: 'word/styles.xml', data: styles }, { name: 'word/_rels/document.xml.rels', data: drels }, { name: 'docProps/core.xml', data: core }, ...media]);
}

/* ---------- Excel (.xlsx) ---------- */
function colName(i) { let s = ''; i++; while (i) { const m = (i - 1) % 26; s = String.fromCharCode(65 + m) + s; i = Math.floor((i - 1) / 26); } return s; }
function xlsx(sheets) {
  const ws = sheets.map(sh => {
    const widths = sh.rows[0].map((_, c) => Math.min(60, Math.max(8, ...sh.rows.map(r => String(r[c] ?? '').length + 2))));
    return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetViews><sheetView workbookViewId="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews><cols>${widths.map((w, i) => `<col min="${i + 1}" max="${i + 1}" width="${w}" customWidth="1"/>`).join('')}</cols><sheetData>${sh.rows.map((r, ri) => `<row r="${ri + 1}">${r.map((c, ci) => { const ref = colName(ci) + (ri + 1); if (typeof c === 'number' && isFinite(c)) return `<c r="${ref}"${ri === 0 ? ' s="1"' : ''}><v>${c}</v></c>`; return `<c r="${ref}" t="inlineStr"${ri === 0 ? ' s="1"' : ''}><is><t xml:space="preserve">${xml(c)}</t></is></c>`; }).join('')}</row>`).join('')}</sheetData>${sh.rows.length > 1 ? `<autoFilter ref="A1:${colName(sh.rows[0].length - 1)}${sh.rows.length}"/>` : ''}</worksheet>`;
  });
  const wb = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets>${sheets.map((s, i) => `<sheet name="${xml(s.name.slice(0, 31).replace(/[\\/?*\[\]:]/g, ''))}" sheetId="${i + 1}" r:id="rId${i + 1}"/>`).join('')}</sheets></workbook>`;
  const wbr = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${sheets.map((s, i) => `<Relationship Id="rId${i + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${i + 1}.xml"/>`).join('')}<Relationship Id="rIdS" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>`;
  const st = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><fonts count="2"><font><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="11"/><color rgb="FFFFFFFF"/><name val="Calibri"/></font></fonts><fills count="3"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FFDB4035"/><bgColor indexed="64"/></patternFill></fill></fills><borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="2"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/><xf numFmtId="0" fontId="1" fillId="2" borderId="0" xfId="0" applyFont="1" applyFill="1"/></cellXfs><cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>`;
  const ct = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>${sheets.map((s, i) => `<Override PartName="/xl/worksheets/sheet${i + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`).join('')}</Types>`;
  const rr = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>`;
  return zip([{ name: '[Content_Types].xml', data: ct }, { name: '_rels/.rels', data: rr }, { name: 'xl/workbook.xml', data: wb }, { name: 'xl/_rels/workbook.xml.rels', data: wbr }, { name: 'xl/styles.xml', data: st }, ...ws.map((w, i) => ({ name: `xl/worksheets/sheet${i + 1}.xml`, data: w }))]);
}

/* ---------- tarefas ---------- */
const TCOLS = ['Título', 'Lista', 'Seção', 'Prioridade', 'Etiquetas', 'Início', 'Fim / prazo', 'Repetição', 'Status', 'Concluída em', 'Itens', 'Subtarefa de', 'Descrição', 'Criada em'];
const fdt = s => s ? (pd(s).toLocaleDateString('pt-BR') + (tOnly(s) ? ' ' + tOnly(s) : '')) : '';
function taskRow(t) {
  const l = listOf(t), sec = (l.sec || []).find(s => s.id === t.sec);
  return [t.title, l.name, sec ? sec.name : '', PRIO[t.prio || 0].n, (t.tags || []).map(g => (get('g', g) || {}).name).filter(Boolean).join(', '), fdt(t.start), fdt(t.due), repText(t.rep), t.del ? 'Na lixeira' : t.done ? 'Concluída' : overdue(t) ? 'Atrasada' : 'Pendente', t.dt ? new Date(t.dt).toLocaleString('pt-BR') : '', (t.chk || []).map(c => (c.done ? '[x] ' : '[ ] ') + c.t).join(' | '), t.par ? (get('t', t.par) || {}).title || '' : '', stripHtml(t.notes), new Date(t.c || Date.now()).toLocaleDateString('pt-BR')];
}
function scopeTasks(id) {
  if (id === 'done') return db.t.filter(t => t.done && !t.del);
  if (id === 'trash') return db.t.filter(t => t.del);
  if (id === 'all*') return db.t.filter(t => !t.del);
  const info = scopeInfo(id); if (!info) return [];
  const top = db.t.filter(t => !t.del && !t.par && info.f(t));
  const ids = new Set(top.map(t => t.id));
  return top.concat(db.t.filter(t => !t.del && t.par && ids.has(t.par))).sort((a, b) => (a.done - b.done) || sortTasks(a, b, viewCfg(id).sort));
}
function scopeName(id) { return id === 'done' ? 'Concluídas' : id === 'trash' ? 'Lixeira' : id === 'all*' ? 'Todas as tarefas' : (scopeInfo(id) || { name: 'Tarefas' }).name.replace(/^#/, ''); }
function tasksMd(name, list) {
  const out = ['# ' + name, ''];
  const tops = list.filter(t => !t.par || !list.some(x => x.id === t.par));
  const line = (t, lvl) => {
    const ind = '  '.repeat(lvl), meta = [t.due || t.start ? '📅 ' + fmtWhen(t.due || t.start) : '', t.rep ? '🔁 ' + repText(t.rep) : '', t.prio ? '❗' + PRIO[t.prio].n : '', ...(t.tags || []).map(g => '#' + ((get('g', g) || {}).name || ''))].filter(Boolean).join(' · ');
    out.push(`${ind}- [${t.done ? 'x' : ' '}] ${t.title}${meta ? ' — ' + meta : ''}`);
    if (stripHtml(t.notes)) out.push(ind + '  > ' + stripHtml(t.notes));
    (t.chk || []).forEach(c => out.push(`${ind}  - [${c.done ? 'x' : ' '}] ${c.t}`));
    list.filter(x => x.par === t.id).forEach(x => line(x, lvl + 1));
  };
  tops.forEach(t => line(t, 0));
  return out.join('\n') + '\n';
}
function tasksHtml(name, list) {
  const rows = list.map(t => `<tr class="${t.done ? 'ok' : ''}"><td>${t.done ? '☑' : '☐'}</td><td>${t.par ? '↳ ' : ''}<b>${esc(t.title)}</b>${stripHtml(t.notes) ? `<div class="n">${esc(stripHtml(t.notes))}</div>` : ''}${(t.chk || []).length ? `<div class="n">${t.chk.map(c => (c.done ? '☑ ' : '☐ ') + esc(c.t)).join('<br>')}</div>` : ''}</td><td>${esc(listOf(t).name)}</td><td>${esc(fdt(t.due || t.start))}</td><td style="color:${PRIO[t.prio || 0].c.startsWith('#') ? PRIO[t.prio || 0].c : '#888'}">${esc(PRIO[t.prio || 0].n)}</td><td>${esc((t.tags || []).map(g => '#' + ((get('g', g) || {}).name || '')).join(' '))}</td></tr>`).join('');
  return `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>${esc(name)}</title><style>@page{margin:14mm}body{font:13px/1.45 -apple-system,'Segoe UI',Roboto,Arial,sans-serif;color:#202020;margin:24px}h1{font-size:22px;margin:0 0 4px}p.m{color:#888;margin:0 0 16px}table{border-collapse:collapse;width:100%}th{background:#DB4035;color:#fff;text-align:left;padding:7px 8px;font-size:12px}td{border-bottom:1px solid #e6e6e6;padding:7px 8px;vertical-align:top}tr.ok td{color:#999}tr.ok b{text-decoration:line-through}.n{color:#777;font-size:12px;margin-top:3px}th,td{-webkit-print-color-adjust:exact;print-color-adjust:exact}</style></head><body><h1>${esc(name)}</h1><p class="m">${list.length} tarefas · exportado em ${new Date().toLocaleString('pt-BR')}</p><table><tr><th></th><th>Tarefa</th><th>Lista</th><th>Data</th><th>Prioridade</th><th>Etiquetas</th></tr>${rows}</table></body></html>`;
}
function tasksDocx(name, list) {
  const P = s => pXml(runXml(s, {}));
  let body = pXml(runXml(name, {}), { style: 'Title' }) + pXml(runXml(list.length + ' tarefas · ' + new Date().toLocaleDateString('pt-BR'), { color: '888888' }));
  list.forEach(t => {
    body += pXml(runXml((t.done ? '☑' : '☐') + '\t', {}) + runXml(t.title, t.done ? { s: 1, color: '8A8A8A', b: 1 } : { b: 1 }), { ind: (t.par ? 720 : 360), hang: 360 });
    const meta = [listOf(t).name, fdt(t.due || t.start), t.prio ? 'Prioridade ' + PRIO[t.prio].n.toLowerCase() : '', repText(t.rep)].filter(Boolean).join(' · ');
    if (meta) body += pXml(runXml(meta, { color: '777777', sz: 18 }), { ind: t.par ? 720 : 360 });
    if (stripHtml(t.notes)) body += pXml(runsXml(t.notes, { color: '555555' }), { ind: t.par ? 720 : 360 });
    (t.chk || []).forEach(c => body += pXml(runXml((c.done ? '☑ ' : '☐ ') + c.t, { sz: 20 }), { ind: (t.par ? 1080 : 720) }));
  });
  return buildDocx(body);
}
function ics(items, name) {
  const fold = s => s.replace(/(.{70})/g, '$1\r\n ');
  const e = s => String(s || '').replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');
  const dt = s => tOnly(s) ? `;TZID=${Intl.DateTimeFormat().resolvedOptions().timeZone}:` + dOnly(s).replace(/-/g, '') + 'T' + tOnly(s).replace(':', '') + '00' : ';VALUE=DATE:' + dOnly(s).replace(/-/g, '');
  const stamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d+/, '');
  const out = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Tarefas//PT-BR', 'CALSCALE:GREGORIAN', 'X-WR-CALNAME:' + e(name)];
  items.forEach(t => {
    if (!(t.due || t.start)) return;
    let s = t.start || t.due, en = t.due || t.start;
    if (!t.start && tOnly(en)) { const d = pd(en); d.setMinutes(d.getMinutes() + 30); en = ymd(d) + 'T' + hm(d); }
    else if (!tOnly(en)) en = addD(dOnly(en), 1);
    if (tOnly(s) && !tOnly(en)) s = dOnly(s);
    const ev = ['BEGIN:VEVENT', 'UID:' + t.id + '@tarefas', 'DTSTAMP:' + stamp, 'DTSTART' + dt(s), 'DTEND' + dt(en), 'SUMMARY:' + e((t.done ? '✓ ' : '') + t.title)];
    if (stripHtml(t.notes)) ev.push('DESCRIPTION:' + e(stripHtml(t.notes)));
    if (t.rep && t.rep.from !== 'done') { let r = 'RRULE:FREQ=' + { d: 'DAILY', w: 'WEEKLY', m: 'MONTHLY', y: 'YEARLY' }[t.rep.f] + ';INTERVAL=' + (t.rep.n || 1); if (t.rep.wd && t.rep.f === 'w') r += ';BYDAY=' + t.rep.wd.map(w => ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'][w]).join(','); if (t.rep.until) r += ';UNTIL=' + t.rep.until.replace(/-/g, ''); ev.push(r); }
    (t.rem || []).forEach(m => { if (tOnly(s)) ev.push('BEGIN:VALARM', 'ACTION:DISPLAY', 'DESCRIPTION:' + e(t.title), 'TRIGGER:-PT' + m + 'M', 'END:VALARM'); });
    if (t.prio) ev.push('PRIORITY:' + { 3: 1, 2: 5, 1: 9 }[t.prio]);
    ev.push('END:VEVENT');
    out.push(...ev.map(fold));
  });
  out.push('END:VCALENDAR');
  return out.join('\r\n');
}
async function exportScope(id, f) {
  const name = scopeName(id), list = scopeTasks(id), fn = safeName(name);
  if (f === 'csv') download(fn + '.csv', '\ufeff' + toCsv([TCOLS, ...list.map(taskRow)]), 'text/csv');
  if (f === 'xlsx') download(fn + '.xlsx', xlsx([{ name, rows: [TCOLS, ...list.map(taskRow)] }]));
  if (f === 'md') download(fn + '.md', tasksMd(name, list), 'text/markdown');
  if (f === 'txt') download(fn + '.txt', tasksMd(name, list).replace(/^# /, '').replace(/- \[x\]/g, '☑').replace(/- \[ \]/g, '☐'), 'text/plain');
  if (f === 'html') download(fn + '.html', tasksHtml(name, list), 'text/html');
  if (f === 'pdf') printHtml(tasksHtml(name, list));
  if (f === 'docx') download(fn + '.docx', tasksDocx(name, list));
  if (f === 'ics') download(fn + '.ics', ics(list, name), 'text/calendar');
  if (f === 'json') download(fn + '.json', JSON.stringify({ app: 'tarefas', tipo: 'lista', nome: name, tarefas: list }, null, 1), 'application/json');
  if (f === 'copy') { await navigator.clipboard.writeText(tasksMd(name, list)); toast('Copiado como Markdown'); }
}
async function exportDoc(d, f) {
  const fn = safeName(d.title || 'documento');
  try {
    if (f === 'md') download(fn + '.md', docToMd(d), 'text/markdown');
    if (f === 'mdzip') {
      const files = [], seen = {};
      const nameOf = m => { const n = 'imagens/' + safeName(m.name).replace(/\s+/g, '_'); seen[m.id] = n; return n; };
      const md = docToMd(d, nameOf);
      for (const b of d.b) if (b.file && seen[b.file.id]) { try { files.push({ name: seen[b.file.id], data: new Uint8Array(await (await FILES.blob(b.file)).arrayBuffer()) }); } catch (e) {} }
      download(fn + '.zip', zip([{ name: fn + '.md', data: md }, ...files]));
    }
    if (f === 'txt') download(fn + '.txt', docToTxt(d), 'text/plain');
    if (f === 'html') download(fn + '.html', await docToHtml(d), 'text/html');
    if (f === 'pdf') printHtml(await docToHtml(d, true));
    if (f === 'docx') { toast('Gerando Word…', null, null, 1200); download(fn + '.docx', await docToDocx(d)); }
    if (f === 'json') download(fn + '.json', JSON.stringify({ app: 'tarefas', tipo: 'documento', documento: d }, null, 1), 'application/json');
    if (f === 'copy') { await navigator.clipboard.writeText(docToMd(d)); toast('Copiado como Markdown'); }
    if (f === 'copytxt') { await navigator.clipboard.writeText(docToTxt(d)); toast('Texto copiado'); }
  } catch (e) { console.error(e); toast('Falha ao exportar: ' + e.message); }
}
function habitsRows() {
  const days = new Set(); db.h.forEach(h => Object.keys(h.log || {}).forEach(d => days.add(d)));
  const ds = [...days].sort();
  return [['Data', ...db.h.map(h => h.name)], ...ds.map(d => [pd(d).toLocaleDateString('pt-BR'), ...db.h.map(h => (h.log || {})[d] || 0)])];
}
async function exportAll(f) {
  const stamp = today();
  if (f === 'json') download(`tarefas-backup-${stamp}.json`, JSON.stringify({ app: 'tarefas', tipo: 'backup', versao: APPV, em: new Date().toISOString(), dados: Object.assign({}, db, { s: Object.assign({}, db.s, { gClient: db.s.gClient }) }) }), 'application/json');
  if (f === 'xlsx') download(`tarefas-${stamp}.xlsx`, xlsx([
    { name: 'Tarefas', rows: [TCOLS, ...db.t.filter(t => !t.del).sort((a, b) => (a.done - b.done) || sortTasks(a, b)).map(taskRow)] },
    { name: 'Listas', rows: [['Lista', 'Pasta', 'Seções', 'Pendentes', 'Concluídas'], ...db.l.map(l => [l.name, (get('f', l.folder) || {}).name || '', (l.sec || []).map(s => s.name).join(', '), db.t.filter(t => t.list === l.id && live(t)).length, db.t.filter(t => t.list === l.id && t.done && !t.del).length])] },
    { name: 'Hábitos', rows: habitsRows() },
    { name: 'Foco', rows: [['Início', 'Minutos', 'Tipo', 'Tarefa'], ...db.p.map(p => [new Date(p.start).toLocaleString('pt-BR'), p.dur, FMODES[p.type] || p.type, p.task && get('t', p.task) ? get('t', p.task).title : ''])] },
    { name: 'Documentos', rows: [['Título', 'Criado', 'Atualizado', 'Blocos'], ...db.d.filter(d => !d.del).map(d => [d.title || 'Sem título', new Date(d.c).toLocaleDateString('pt-BR'), new Date(d.u || d.c).toLocaleDateString('pt-BR'), (d.b || []).length])] },
  ]));
  if (f === 'ics') download(`tarefas-${stamp}.ics`, ics(db.t.filter(t => !t.del), 'Tarefas'), 'text/calendar');
  if (f === 'docs') {
    toast('Preparando documentos…', null, null, 1500);
    const files = [];
    for (const d of db.d.filter(d => !d.del)) {
      const base = safeName(d.title || 'Sem título') + '-' + d.id.slice(-4), seen = {};
      const md = docToMd(d, m => (seen[m.id] = base + '_imagens/' + safeName(m.name).replace(/\s+/g, '_')));
      files.push({ name: base + '.md', data: md });
      for (const b of d.b || []) if (b.file && seen[b.file.id]) { try { files.push({ name: seen[b.file.id], data: new Uint8Array(await (await FILES.blob(b.file)).arrayBuffer()) }); } catch (e) {} }
    }
    download(`documentos-${stamp}.zip`, zip(files));
  }
  if (f === 'tasksmd') download(`tarefas-${stamp}.md`, db.l.filter(l => !l.arch).map(l => tasksMd(l.name, scopeTasks(l.id))).join('\n'), 'text/markdown');
}
/* ---------- menu de exportação ---------- */
function exportMenu(anchor, o) {
  const F = (label, icon, fn, hint) => ({ label, icon, act: fn, hint });
  let items = [];
  if (o.kind === 'doc') { const d = get('d', o.id); items = [{ head: 'Exportar documento' }, F('Baixar PDF (folha A4)', 'dl', () => downloadPdf(d), '.pdf'), F('PDF pela impressão', 'print', () => exportDoc(d, 'pdf'), '.pdf'), F('Word', 'doc', () => exportDoc(d, 'docx'), '.docx'), F('Markdown', 'hash', () => exportDoc(d, 'md'), '.md'), F('Markdown + imagens', 'img', () => exportDoc(d, 'mdzip'), '.zip'), F('Página web', 'eye', () => exportDoc(d, 'html'), '.html'), F('Texto simples', 'text', () => exportDoc(d, 'txt'), '.txt'), F('JSON', 'code', () => exportDoc(d, 'json'), '.json'), { sep: 1 }, F('Copiar como Markdown', 'copy', () => exportDoc(d, 'copy')), F('Copiar como texto', 'copy', () => exportDoc(d, 'copytxt'))]; }
  else if (o.kind === 'task') { const t = get('t', o.id); const one = [t, ...subsOf(t.id)]; items = [{ head: 'Exportar tarefa' }, F('Markdown', 'hash', () => download(safeName(t.title) + '.md', tasksMd(t.title, one), 'text/markdown'), '.md'), F('PDF (imprimir)', 'file', () => printHtml(tasksHtml(t.title, one)), '.pdf'), F('Word', 'doc', () => download(safeName(t.title) + '.docx', tasksDocx(t.title, one)), '.docx'), F('Calendário', 'cal', () => download(safeName(t.title) + '.ics', ics(one, t.title), 'text/calendar'), '.ics'), F('Copiar como texto', 'copy', () => navigator.clipboard.writeText(tasksMd(t.title, one)).then(() => toast('Copiado')))]; }
  else if (o.kind === 'list' || o.kind === 'scope') { const id = o.id; items = [{ head: 'Exportar ' + scopeName(id) }, F('Excel', 'table', () => exportScope(id, 'xlsx'), '.xlsx'), F('CSV', 'table', () => exportScope(id, 'csv'), '.csv'), F('PDF (imprimir)', 'file', () => exportScope(id, 'pdf'), '.pdf'), F('Word', 'doc', () => exportScope(id, 'docx'), '.docx'), F('Markdown', 'hash', () => exportScope(id, 'md'), '.md'), F('Página web', 'eye', () => exportScope(id, 'html'), '.html'), F('Texto', 'text', () => exportScope(id, 'txt'), '.txt'), F('Calendário', 'cal', () => exportScope(id, 'ics'), '.ics'), F('JSON', 'code', () => exportScope(id, 'json'), '.json'), { sep: 1 }, F('Copiar como Markdown', 'copy', () => exportScope(id, 'copy'))]; }
  else if (o.kind === 'cal') items = [{ head: 'Exportar calendário' }, F('Arquivo de calendário', 'cal', () => exportAll('ics'), '.ics'), F('Excel (todas as tarefas)', 'table', () => exportScope('all*', 'xlsx'), '.xlsx'), F('PDF da agenda', 'file', () => printHtml(tasksHtml('Agenda', db.t.filter(t => live(t) && (t.due || t.start)).sort((a, b) => sortTasks(a, b)))), '.pdf')];
  else if (o.kind === 'habits') items = [{ head: 'Exportar hábitos' }, F('Excel', 'table', () => download('habitos.xlsx', xlsx([{ name: 'Hábitos', rows: habitsRows() }])), '.xlsx'), F('CSV', 'table', () => download('habitos.csv', '\ufeff' + toCsv(habitsRows()), 'text/csv'), '.csv'), F('JSON', 'code', () => download('habitos.json', JSON.stringify(db.h, null, 1), 'application/json'), '.json')];
  else items = [{ head: 'Exportar tudo' }, F('Backup completo', 'dl', () => exportAll('json'), '.json'), F('Planilha completa', 'table', () => exportAll('xlsx'), '.xlsx'), F('Todos os documentos', 'doc', () => exportAll('docs'), '.zip'), F('Todas as tarefas', 'hash', () => exportAll('tasksmd'), '.md'), F('Calendário', 'cal', () => exportAll('ics'), '.ics'), { sep: 1 }, F('Importar backup…', 'up', () => importFile('backup')), F('Importar do TickTick (CSV)…', 'up', () => importFile('ticktick'))];
  menu(anchor, items, { right: 1 });
}

/* ---------- importação ---------- */
function importFile(kind) {
  const i = document.createElement('input'); i.type = 'file'; i.accept = kind === 'backup' ? '.json,application/json' : '.csv,text/csv';
  i.onchange = async () => { const f = i.files[0]; if (!f) return; const txt = await f.text(); try { if (kind === 'backup') await importBackup(txt); else importTickTick(txt); } catch (e) { console.error(e); toast('Não foi possível importar: ' + e.message); } };
  i.click();
}
async function importBackup(txt) {
  const j = JSON.parse(txt);
  const data = j.dados || (j.t && j.l ? j : null);
  if (j.tipo === 'documento' && j.documento) { const d = j.documento; d.id = uid(); put('d', d); go('doc/' + d.id); toast('Documento importado'); return; }
  if (!data) throw new Error('arquivo não reconhecido');
  const mode = await new Promise(res => { const el = modal(`<h2>Importar backup</h2><p class="mut">${plural((data.t || []).length, 'tarefa', 'tarefas')}, ${plural((data.d || []).length, 'documento', 'documentos')}, ${plural((data.h || []).length, 'hábito', 'hábitos')}.</p><div class="row end"><button class="btn ghost" data-m="">Cancelar</button><button class="btn ghost" data-m="merge">Mesclar</button><button class="btn red" data-m="replace">Substituir tudo</button></div>`); el.onclick = e => { const b = e.target.closest('[data-m]'); if (b) { closeModal(); res(b.dataset.m); } }; });
  if (!mode) return;
  if (mode === 'replace') { KINDS.forEach(k => db[k] = data[k] || []); db.s = Object.assign(DEF_S(), data.s || {}); }
  else KINDS.forEach(k => (data[k] || []).forEach(o => { const cur = get(k, o.id); if (!cur || (o.u || 0) > (cur.u || 0)) put(k, o, { silent: true, keepU: true }); }));
  KINDS.forEach(k => db[k].forEach(o => o.u = Date.now()));
  changed(); render(true); toast('Backup importado');
}
function parseCsv(txt) {
  const rows = []; let row = [], cell = '', q = false;
  for (let i = 0; i < txt.length; i++) {
    const c = txt[i];
    if (q) { if (c === '"') { if (txt[i + 1] === '"') { cell += '"'; i++; } else q = false; } else cell += c; }
    else if (c === '"') q = true;
    else if (c === ',') { row.push(cell); cell = ''; }
    else if (c === '\n' || c === '\r') { if (c === '\r' && txt[i + 1] === '\n') i++; row.push(cell); rows.push(row); row = []; cell = ''; }
    else cell += c;
  }
  if (cell || row.length) { row.push(cell); rows.push(row); }
  return rows;
}
function importTickTick(txt) {
  const rows = parseCsv(txt.replace(/^\ufeff/, ''));
  const hi = rows.findIndex(r => r.includes('Title') && r.includes('List Name'));
  if (hi < 0) throw new Error('não parece um backup CSV do TickTick');
  const H = rows[hi], col = n => H.indexOf(n);
  const g = (r, n) => (col(n) >= 0 ? r[col(n)] || '' : '').trim();
  const lists = {}, idmap = {}, pend = [];
  let n = 0;
  const conv = (s, allDay) => { if (!s) return null; const d = new Date(s.replace(/([+-]\d{2})(\d{2})$/, '$1:$2')); if (isNaN(d)) return null; return allDay ? ymd(d) : ymd(d) + 'T' + hm(d); };
  rows.slice(hi + 1).forEach(r => {
    if (r.length < 3 || !g(r, 'Title')) return;
    if (/note/i.test(g(r, 'Kind'))) return;
    const ln = g(r, 'List Name') || 'Importadas', fn = g(r, 'Folder Name');
    let l = lists[ln] || db.l.find(x => x.name === ln);
    if (!l) { let fid = null; if (fn) { let f = db.f.find(x => x.name === fn); if (!f) f = put('f', { id: uid(), name: fn, o: db.f.length + 1, open: true }, { silent: true }); fid = f.id; } l = put('l', { id: uid(), name: ln, color: COLORS[db.l.length % COLORS.length], view: /kanban/i.test(g(r, 'View Mode')) ? 'board' : 'list', sec: [], o: db.l.length + 1, folder: fid }, { silent: true }); }
    lists[ln] = l;
    let sec = null; const cn = g(r, 'Column Name'); if (cn) { let s = (l.sec || []).find(x => x.name === cn); if (!s) { s = { id: uid(), name: cn }; l.sec = (l.sec || []).concat(s); } sec = s.id; }
    const allDay = /true/i.test(g(r, 'Is All Day'));
    const content = g(r, 'Content'), isChk = /^y/i.test(g(r, 'Is Check list'));
    const t = newTask({ title: g(r, 'Title'), list: l.id, sec, prio: { '0': 0, '1': 1, '3': 2, '5': 3 }[g(r, 'Priority')] || 0, start: conv(g(r, 'Start Date'), allDay), due: conv(g(r, 'Due Date'), allDay), notes: isChk ? '' : esc(content).replace(/\n/g, '<br>'), chk: isChk ? content.split('\n').filter(Boolean).map(x => ({ id: uid(), t: x.replace(/^[▪︎☐☑✓▫◦•\-\s]+/, ''), done: /^[☑✓]/.test(x) })) : [], tags: g(r, 'Tags') ? tagIdsFromNames(g(r, 'Tags').split(/[,，]\s*/).filter(Boolean)) : [], done: /^[12]$/.test(g(r, 'Status')), o: n++ });
    if (t.start && t.due && t.start === t.due) t.start = null;
    if (t.done) t.dt = Date.parse(g(r, 'Completed Time')) || Date.now();
    const rr = g(r, 'Repeat'); if (rr) { const m = rr.match(/FREQ=(\w+)/), iv = rr.match(/INTERVAL=(\d+)/), bd = rr.match(/BYDAY=([\w,]+)/); if (m) { t.rep = { f: { DAILY: 'd', WEEKLY: 'w', MONTHLY: 'm', YEARLY: 'y' }[m[1]] || 'd', n: iv ? +iv[1] : 1 }; if (bd) t.rep.wd = bd[1].split(',').map(x => ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'].indexOf(x.slice(-2))).filter(x => x >= 0); } }
    if (g(r, 'Reminder') && t.due && tOnly(t.due)) t.rem = [0];
    idmap[g(r, 'taskId')] = t.id;
    if (g(r, 'parentId')) pend.push([t, g(r, 'parentId')]);
    put('t', t, { silent: true });
  });
  pend.forEach(([t, p]) => { if (idmap[p]) t.par = idmap[p]; });
  Object.values(lists).forEach(l => put('l', l, { silent: true }));
  changed(); render(true);
  toast(plural(n, 'tarefa importada', 'tarefas importadas') + ' do TickTick');
}
