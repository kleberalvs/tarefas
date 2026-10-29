/* Links automáticos: endereços de sites viram links clicáveis em tarefas, documentos, notas e comentários.
   Reconhece https://…, www.… e domínios conhecidos (ex.: google.com, gov.br, site.com.br). */
'use strict';
const LINK_TLD = 'com|com\\.br|br|net|net\\.br|org|org\\.br|gov\\.br|edu|edu\\.br|io|app|dev|ai|co|me|tv|info|biz|xyz|online|site|store|shop|link|ly|gl|gg|so|to|us|uk|pt|es|de|fr|it|ca|eu|cloud|tech|digital|blog|news|page';
const LINK_RE = new RegExp(`(?:\\bhttps?:\\/\\/[^\\s<>"']+|\\bwww\\.[^\\s<>"']+|\\b(?:[a-z0-9-]+\\.)+(?:${LINK_TLD})(?::\\d+)?(?:\\/[^\\s<>"']*)?)(?![\\w@])`, 'gi');
/* tira pontuação final que não faz parte do endereço */
function linkTrim(u) {
  let t = u.replace(/[.,;:!?…]+$/, '');
  while (t.endsWith(')') && (t.match(/\(/g) || []).length < (t.match(/\)/g) || []).length) t = t.slice(0, -1);
  return t;
}
const linkHref = u => /^https?:\/\//i.test(u) ? u : 'https://' + u;
const linkLabel = u => { try { const x = new URL(linkHref(u)); return x.hostname.replace(/^www\./, '') + (x.pathname.length > 1 ? x.pathname.replace(/\/$/, '') : ''); } catch (e) { return u; } };
const linkHost = u => { try { return new URL(linkHref(u)).hostname.replace(/^www\./, ''); } catch (e) { return u; } };
/* lista de links num texto simples */
function findLinks(s) { const out = [], str = String(s || ''); str.replace(LINK_RE, (m, off) => { const u = linkTrim(m); if (u.includes('@') || str[off - 1] === '@') return m; if (!out.includes(u)) out.push(u); return m; }); return out; }
/* texto simples → HTML com links (o resto escapado) */
function linkifyText(s, opts = {}) {
  const str = String(s || ''); let out = '', last = 0;
  str.replace(LINK_RE, (m, off) => {
    const u = linkTrim(m); if (str[off - 1] === '@' || u.includes('@')) return m;
    out += esc(str.slice(last, off)) + `<a class="alink" href="${esc(linkHref(u))}" target="_blank" rel="noopener"${opts.stop ? ' data-stop' : ''}>${esc(opts.short ? linkLabel(u) : u)}</a>`;
    last = off + u.length; return m;
  });
  return out + esc(str.slice(last));
}
/* dentro de um elemento editável: transforma os endereços digitados em <a> (sem mexer nos que já são links) */
function linkifyNode(root) {
  if (!root) return false;
  const tw = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, { acceptNode: n => n.parentElement && n.parentElement.closest('a,code,pre,.mention,[contenteditable=false]') ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT });
  const nodes = []; while (tw.nextNode()) nodes.push(tw.currentNode);
  let changed = false;
  nodes.forEach(n => {
    const s = n.nodeValue; LINK_RE.lastIndex = 0; if (!LINK_RE.test(s)) return; LINK_RE.lastIndex = 0;
    const frag = document.createDocumentFragment(); let last = 0, hit = false;
    s.replace(LINK_RE, (m, off) => {
      const u = linkTrim(m); if (s[off - 1] === '@' || u.includes('@')) return m;
      frag.appendChild(document.createTextNode(s.slice(last, off)));
      const a = document.createElement('a'); a.href = linkHref(u); a.target = '_blank'; a.rel = 'noopener'; a.textContent = u; frag.appendChild(a);
      last = off + u.length; hit = true; return m;
    });
    if (!hit) return;
    frag.appendChild(document.createTextNode(s.slice(last)));
    n.replaceWith(frag); changed = true;
  });
  return changed;
}
function linkifyHtml(html) { if (!html || !LINK_RE.test(String(html).replace(/<[^>]*>/g, ' '))) { LINK_RE.lastIndex = 0; return html; } LINK_RE.lastIndex = 0; const d = document.createElement('div'); d.innerHTML = html; return linkifyNode(d) ? d.innerHTML : html; }
/* ao digitar espaço/Enter depois de um endereço, ou ao colar, vira link — mantendo o cursor no lugar */
function autoLinkEditable(el, onChange) {
  if (!el || el._autolink) return; el._autolink = 1;
  const run = () => {
    const sel = getSelection(); if (!sel.rangeCount) return;
    const r = sel.getRangeAt(0), node = r.endContainer;
    if (node.nodeType !== 3 || !el.contains(node) || (node.parentElement && node.parentElement.closest('a,code,pre'))) return;
    const off = r.endOffset, before = node.nodeValue.slice(0, off);
    const m = before.match(/(\S+)[\s ]$/); if (!m || m[1].includes('@')) return;
    const word = m[1], start = off - m[0].length, u = linkTrim(word);
    LINK_RE.lastIndex = 0; const mm = LINK_RE.exec(u); LINK_RE.lastIndex = 0;
    if (!mm || mm.index !== 0 || linkTrim(mm[0]) !== u || u.includes('@')) return;
    const rest = node.splitText(start); const after = rest.splitText(u.length);
    const a = document.createElement('a'); a.href = linkHref(u); a.target = '_blank'; a.rel = 'noopener'; a.textContent = u;
    rest.replaceWith(a);
    const nr = document.createRange(); nr.setStart(after, Math.min(after.length, word.length - u.length + 1)); nr.collapse(true); sel.removeAllRanges(); sel.addRange(nr);
    onChange && onChange();
  };
  el.addEventListener('input', e => { if (e.inputType === 'insertText' && /^[\s ]$/.test(e.data || '')) run(); });
  el.addEventListener('keyup', e => { if (e.key === 'Enter') { const prev = el; if (linkifyNode(prev)) onChange && onChange(); } });
  el.addEventListener('paste', () => setTimeout(() => { if (linkifyNode(el)) onChange && onChange(); }, 0));
  el.addEventListener('blur', () => { if (linkifyNode(el)) onChange && onChange(); });
}
/* chips com os links encontrados (para campos de texto simples, como o título da tarefa e o corpo da nota) */
function linkChips(urls) {
  return urls.length ? `<div class="lchips">${urls.slice(0, 6).map(u => `<a class="lchip" href="${esc(linkHref(u))}" target="_blank" rel="noopener" data-stop title="${esc(u)}">${ic('link', 14)}<span>${esc(linkLabel(u))}</span>${ic('export', 13)}</a>`).join('')}</div>` : '';
}
/* clique em link: abre em nova aba, mesmo dentro de texto editável ou de um cartão clicável */
document.addEventListener('click', e => {
  const a = e.target.closest && e.target.closest('a[href]'); if (!a) return;
  const ed = a.closest('[contenteditable=true]'), card = a.closest('[data-act],[data-nid],.ncard,.trow');
  if (!ed && !card && !a.hasAttribute('data-stop')) return;
  if (!/^(https?:|mailto:|tel:)/i.test(a.getAttribute('href') || '')) return;
  const s = getSelection(); if (ed && s && !s.isCollapsed && ed.contains(s.anchorNode)) return; /* selecionando texto */
  e.preventDefault(); e.stopPropagation();
  window.open(a.href, '_blank', 'noopener');
}, true);
