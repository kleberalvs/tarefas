/* Documentos: editor de blocos com menu "/", menções com "@", estilos de página e de bloco, subpáginas e vínculos. */
'use strict';
const BCOL = ['gray', 'brown', 'orange', 'yellow', 'green', 'blue', 'purple', 'pink', 'red'];
const BCOL_N = { gray: 'Cinza', brown: 'Marrom', orange: 'Laranja', yellow: 'Amarelo', green: 'Verde', blue: 'Azul', purple: 'Roxo', pink: 'Rosa', red: 'Vermelho' };
const PBG = { plain: 'Padrão', paper: 'Papel', gray: 'Cinza', sand: 'Areia', mint: 'Menta', sky: 'Céu', lavender: 'Lavanda', rose: 'Rosa', night: 'Noite' };
const COVERS = { none: 'Sem capa', sunset: 'Pôr do sol', ocean: 'Oceano', forest: 'Floresta', sand: 'Areia', berry: 'Frutas vermelhas', graphite: 'Grafite', aurora: 'Aurora' };
const FONTS = { sans: 'Sem serifa', serif: 'Serifada', mono: 'Monoespaçada', rounded: 'Arredondada' };
const EMOJI = '📄📘📗📕📒📓📝✏️📌📎🗂️📁📅🗓️⏰✅☑️⭐🌟💡🔥🚀🎯🏁🏆💼🏠🛒🍽️☕🏋️🚶❤️💰💳📈📊🧾🎓📚🔧🛠️🎨🎵✈️🌎🌱🐾😊🤔⚠️❗❓🔒🔑'.match(/\p{Extended_Pictographic}️?/gu);
const BTYPES = [
  { k: 'ai', n: 'Escrever com IA', i: 'spark', kw: 'ia ai inteligencia artificial escrever gerar texto assistente ideias resumir melhorar corrigir traduzir' },
  { k: 'p', n: 'Texto', i: 'text', kw: 'texto paragrafo normal' },
  { k: 'h1', n: 'Título grande', i: 'h1', kw: 'titulo h1 cabecalho' },
  { k: 'h2', n: 'Título médio', i: 'h2', kw: 'titulo h2 subtitulo' },
  { k: 'h3', n: 'Título pequeno', i: 'h3', kw: 'titulo h3' },
  { k: 'ul', n: 'Lista com marcadores', i: 'ul', kw: 'lista marcadores bullet topicos' },
  { k: 'ol', n: 'Lista numerada', i: 'ol', kw: 'lista numerada numeros' },
  { k: 'todo', n: 'Lista de verificação', i: 'todo', kw: 'checklist caixa verificacao todo afazer' },
  { k: 'toggle', n: 'Recolher (alternar)', i: 'toggle', kw: 'toggle recolher expandir alternar' },
  { k: 'quote', n: 'Citação', i: 'quote', kw: 'citacao aspas quote' },
  { k: 'callout', n: 'Destaque', i: 'callout', kw: 'destaque callout aviso nota caixa' },
  { k: 'code', n: 'Código', i: 'code', kw: 'codigo code' },
  { k: 'hr', n: 'Divisor', i: 'line', kw: 'divisor linha separador' },
  { k: 'pb', n: 'Quebra de página', i: 'pagebreak', kw: 'quebra pagina nova folha a4' },
  { k: 'table', n: 'Tabela', i: 'table', kw: 'tabela grade colunas' },
  { k: 'img', n: 'Imagem', i: 'img', kw: 'imagem foto figura' },
  { k: 'draw', n: 'Escrita à mão', i: 'pen', kw: 'escrita mao caneta desenho desenhar rabisco pencil' },
  { k: 'file', n: 'Arquivo', i: 'clip', kw: 'arquivo anexo pdf' },
  { k: 'task', n: 'Tarefa (cria no app)', i: 'todo', kw: 'tarefa task criar' },
  { k: 'linktask', n: 'Vincular tarefa existente', i: 'link', kw: 'vincular tarefa existente' },
  { k: 'page', n: 'Subpágina', i: 'page', kw: 'subpagina pagina documento filho' },
  { k: 'linkdoc', n: 'Link para documento', i: 'doc', kw: 'link documento pagina' },
  { k: 'date', n: 'Data de hoje', i: 'today', kw: 'data hoje dia' },
];
const SLG = { ai: 'Inteligência artificial', p: 'Básico', h1: 'Básico', h2: 'Básico', h3: 'Básico', quote: 'Básico', callout: 'Básico', code: 'Básico', hr: 'Básico', pb: 'Básico', ul: 'Listas', ol: 'Listas', todo: 'Listas', toggle: 'Listas', table: 'Listas', img: 'Mídia', draw: 'Mídia', file: 'Mídia', task: 'Tarefas e páginas', linktask: 'Tarefas e páginas', page: 'Tarefas e páginas', linkdoc: 'Tarefas e páginas', date: 'Tarefas e páginas' };
const SLD = { ai: 'Gerar, melhorar, resumir ou traduzir', p: 'Parágrafo comum', h1: 'Título de seção', h2: 'Subtítulo', h3: 'Título menor', quote: 'Trecho em destaque', callout: 'Caixa colorida com ícone', code: 'Texto em fonte de código', hr: 'Linha separadora', pb: 'Começa uma nova folha A4', ul: 'Itens com marcador', ol: 'Itens numerados', todo: 'Itens para marcar', toggle: 'Conteúdo que abre e fecha', table: 'Linhas e colunas', img: 'Envie uma foto', draw: 'Escreva ou desenhe com caneta ou dedo', file: 'Anexe um arquivo', task: 'Cria uma tarefa no app', linktask: 'Mostra uma tarefa existente', page: 'Página dentro deste documento', linkdoc: 'Atalho para outro documento', date: 'Insere a data de hoje' };
const TEXTY = new Set(['p', 'h1', 'h2', 'h3', 'ul', 'ol', 'todo', 'toggle', 'quote', 'callout', 'code']);
let ED = { doc: null, caret: null };
const IMG_URL = new Map();

function newDoc(o = {}) {
  const d = Object.assign({ id: uid(), title: '', icon: '📄', par: null, fav: false, c: Date.now(), style: { bg: 'plain', pat: 'none', font: 'sans', width: 'normal', cover: 'none', size: 'm' }, b: [{ id: uid(), type: 'p', text: '' }] }, o);
  put('d', d);
  return d;
}
const docKids = id => db.d.filter(d => !d.del && d.par === id).sort((a, b) => (a.o || a.c) - (b.o || b.c));
function docPath(d) { const p = []; let x = d, k = 0; while (x && x.par && k++ < 20) { x = get('d', x.par); if (x) p.unshift(x); } return p; }

/* ---------- lista de documentos ---------- */
let DQ = '';
function docCard(d) {
  const st = d.style || {}, c = st.cover, th = st.th && typeof dsGet === 'function' ? dsGet(st.th) : null;
  const cov = c && c.file ? `<span class="kcov img"><img alt="" data-cimg="${esc(c.file.id)}" data-doc="${d.id}"></span>` : (typeof c === 'string' && c !== 'none' ? `<span class="kcov band cov-${esc(c)}"></span>` : '');
  const words = (d.b || []).reduce((n, b) => n + stripHtml(b.text).split(/\s+/).filter(Boolean).length, 0);
  let n = 0;
  const prev = (d.b || []).filter(b => (b.text && stripHtml(b.text).trim()) || ['img', 'table', 'hr'].includes(b.type)).slice(0, 9).map(b => {
    const t = esc(stripHtml(b.text || '').slice(0, 160));
    if (/^h[123]$/.test(b.type)) return `<p class="kh">${t}</p>`;
    if (b.type === 'ul') return `<p class="kli"><i>•</i>${t}</p>`;
    if (b.type === 'ol') return `<p class="kli"><i>${++n}.</i>${t}</p>`;
    if (b.type === 'todo') return `<p class="kli${b.checked ? ' kdone' : ''}"><span class="kbox${b.checked ? ' on' : ''}"></span>${t}</p>`;
    if (b.type === 'quote') return `<p class="kq">${t}</p>`;
    if (b.type === 'callout') return `<p class="kc">${esc(b.emoji || '💡')} ${t}</p>`;
    if (b.type === 'img') return `<p class="kx">${ic('img', 14)} Imagem</p>`;
    if (b.type === 'table') return `<p class="kx">${ic('table', 14)} Tabela</p>`;
    if (b.type === 'hr') return '<hr>';
    return `<p>${t}</p>`;
  }).join('');
  const style = th ? dsVars(th) : '';
  return `<a class="dcard kd${th ? ' themed' : ` pbg-${esc(st.bg || 'plain')}`}" href="#/doc/${d.id}" data-ctx="doc:${d.id}" data-drag="dd:${d.id}" data-drop="dtree:${d.id}" style="${esc(style)}">${cov}
    <span class="kin"><span class="khead"><span class="dic">${esc(d.icon || '📄')}</span><b class="kt">${esc(d.title || 'Sem título')}</b></span>
    ${prev ? `<span class="kprev">${prev}</span>` : '<span class="kprev"><p class="mut">Documento vazio</p></span>'}
    <span class="kfoot mut sm">${esc(fmtDay(ymd(new Date(d.u || d.c)), true))} · ${plural(words, 'palavra', 'palavras')}${d.fav ? `<span class="dfav">${ic('star', 13)}</span>` : ''}</span></span></a>`;
}
function folderCard(f) {
  const n = db.d.filter(d => !d.del && d.folder === f.id).length, sub = folderKids(f.id, 'd').length;
  return `<a class="fcard" href="#/docs/${f.id}" data-drop="dfold:${f.id}" data-drag="f:${f.id}" data-ctx="folder:${f.id}"><span class="fic" style="--fc:${esc(f.color || '#E8A400')}">${f.emoji ? `<span class="nemo big">${esc(f.emoji)}</span>` : ic('folder', 30)}</span><b>${esc(f.name)}</b><span class="mut sm">${plural(n, 'documento', 'documentos')}${sub ? ' · ' + plural(sub, 'subpasta', 'subpastas') : ''}</span></a>`;
}
async function loadCardImgs(root) {
  root.querySelectorAll('img[data-cimg]').forEach(async img => {
    const d = get('d', img.dataset.doc), m = d && d.style && d.style.cover && d.style.cover.file;
    if (!m) return;
    try { if (!IMG_URL.has(m.id)) IMG_URL.set(m.id, await FILES.url(m)); img.src = IMG_URL.get(m.id); } catch (e) {}
  });
}
VIEWS.docs = main => {
  const fid = R.id && get('f', R.id) ? R.id : null, fol = fid ? get('f', fid) : null;
  const all = db.d.filter(d => !d.del);
  const q = norm(DQ);
  const here = all.filter(d => (d.folder || null) === fid && (!d.par || !get('d', d.par) || get('d', d.par).del)).sort((a, b) => (b.u || b.c) - (a.u || a.c));
  const subs = folderKids(fid, 'd');
  const crumbs = fol ? `<nav class="crumbs"><a href="#/docs" data-drop="dfold:">Documentos</a>${folderAncestors(fid).reverse().map(id => { const f = get('f', id); return `<span>/</span><a href="#/docs/${id}" data-drop="dfold:${id}">${esc((f.emoji ? f.emoji + ' ' : '') + f.name)}</a>`; }).join('')}</nav>` : '';
  const res = q ? all.filter(d => norm(d.title + ' ' + (d.b || []).map(b => stripHtml(b.text)).join(' ')).includes(q)) : null;
  const fav = !fid ? all.filter(d => d.fav) : [];
  main.innerHTML = headHtml(fol ? (fol.emoji ? fol.emoji + ' ' : '') + fol.name : 'Documentos', fol ? '' : plural(all.length, 'documento', 'documentos'), `<button class="ib" data-act="dimport" aria-label="Importar Markdown ou texto">${ic('up')}</button><button class="btn ghost sm" data-act="newfolder" data-k="d" data-par="${fid || ''}">${ic('folder', 16)}<span class="hide-s">Nova pasta</span></button><button class="btn red sm" data-act="dnew">${ic('plus', 16)}<span>Novo<span class="hide-s"> documento</span></span></button>`, { pre: crumbs }) +
    `<div class="scroll"><div class="docs">
      <div class="sbox" data-keep>${ic('search', 20)}<input id="dq" class="in" type="search" placeholder="Buscar em todos os documentos" value="${esc(DQ)}"></div>
      ${res ? `<h2 class="dsh">Resultados</h2><div class="dgrid">${res.map(docCard).join('') || '<p class="hint">Nada encontrado.</p>'}</div>` : `
      ${fav.length ? `<h2 class="dsh">${ic('star', 18)}Favoritos</h2><div class="dgrid">${fav.map(docCard).join('')}</div>` : ''}
      ${subs.length ? `<h2 class="dsh">${ic('folder', 18)}Pastas</h2><div class="fgrid">${subs.map(folderCard).join('')}</div>` : ''}
      <h2 class="dsh">${ic('doc', 18)}${fid ? 'Nesta pasta' : 'Documentos'} <span class="mut sm">arraste um documento sobre uma pasta para guardá-lo; sobre outro documento para virar subpágina</span></h2>
      <div class="dgrid" data-drop="dfold:${fid || ''}">${here.map(docCard).join('') || `<div class="empty sm"><p class="mut">${fid ? 'Pasta vazia.' : 'Nenhum documento ainda.'}</p><button class="btn red sm" data-act="dnew">${ic('plus', 16)}Novo documento</button></div>`}</div>`}
    </div></div><button class="fab" data-act="dnew" aria-label="Novo documento">${ic('plus', 26)}</button>`;
  loadCardImgs(main);
  const inp = $('#dq'); inp.oninput = debounce(() => { DQ = inp.value; render(true); setTimeout(() => { const i = $('#dq'); if (i) { i.focus(); i.setSelectionRange(i.value.length, i.value.length); } }, 0); }, 250);
};
/* ---------- documento ---------- */
const DFONTS = { '': 'Fonte', 'Inter': 'Inter', 'Georgia': 'Georgia', 'Merriweather': 'Merriweather', 'Lora': 'Lora', 'Playfair Display': 'Playfair Display', 'Montserrat': 'Montserrat', 'Nunito': 'Nunito', 'Roboto Slab': 'Roboto Slab', 'Source Code Pro': 'Source Code Pro', 'Caveat': 'Caveat (manuscrita)', 'Times New Roman': 'Times New Roman', 'Arial': 'Arial' };
const DSIZES = ['10', '11', '12', '14', '16', '18', '20', '24', '28', '32', '40', '48'];
const MARGINS = { s: [12.7, 12.7], n: [20, 22], l: [30, 30] };
function loadDocFonts() {
  if (loadDocFonts.done) return; loadDocFonts.done = 1;
  const l = document.createElement('link'); l.rel = 'stylesheet';
  l.href = 'https://fonts.googleapis.com/css2?family=Caveat:wght@500&family=Inter:wght@400;600;700&family=Lora:ital,wght@0,400;0,700;1,400&family=Merriweather:ital,wght@0,400;0,700;1,400&family=Montserrat:wght@400;600;700&family=Nunito:wght@400;700&family=Playfair+Display:wght@400;700&family=Roboto+Slab:wght@400;700&family=Source+Code+Pro:wght@400;600&display=swap';
  document.head.appendChild(l);
}
function toolbarHtml() {
  const B = (k, i, n) => `<button data-tb="${k}" aria-label="${n}" title="${n}">${ic(i, 18)}</button>`;
  return `<div class="dtool" role="toolbar" aria-label="Formatação">
    ${B('undo', 'undo', 'Desfazer (Ctrl+Z)')}<button data-tb="redo" aria-label="Refazer" title="Refazer (Ctrl+Shift+Z)" class="flip">${ic('undo', 18)}</button><i class="tsep"></i>
    <select data-ts="type" aria-label="Estilo do parágrafo" title="Estilo do parágrafo"><option value="p">Texto</option><option value="h1">Título 1</option><option value="h2">Título 2</option><option value="h3">Título 3</option><option value="quote">Citação</option><option value="callout">Destaque</option><option value="code">Código</option></select>
    <select data-ts="font" aria-label="Fonte" title="Fonte do texto selecionado">${Object.entries(DFONTS).map(([k, n]) => `<option value="${esc(k)}" ${k ? `style="font-family:'${esc(k)}'"` : ''}>${esc(n)}</option>`).join('')}</select>
    <select data-ts="size" aria-label="Tamanho" title="Tamanho do texto selecionado" class="sz"><option value="">Tam.</option>${DSIZES.map(z => `<option value="${z}">${z}</option>`).join('')}</select><i class="tsep"></i>
    ${B('bold', 'bold', 'Negrito (Ctrl+B)')}${B('italic', 'italic', 'Itálico (Ctrl+I)')}${B('underline', 'under', 'Sublinhado (Ctrl+U)')}${B('strikeThrough', 'strike', 'Tachado')}${B('superscript', 'sup', 'Sobrescrito')}${B('subscript', 'subsc', 'Subscrito')}${B('code', 'code', 'Código')}
    ${B('color', 'palette', 'Cor do texto')}${B('hilite', 'highlight', 'Marca-texto')}<i class="tsep"></i>
    ${B('al-l', 'alignl', 'Alinhar à esquerda')}${B('al-c', 'alignc', 'Centralizar')}${B('al-r', 'alignr', 'Alinhar à direita')}${B('al-j', 'alignj', 'Justificar')}<i class="tsep"></i>
    ${B('ul', 'ul', 'Lista com marcadores')}${B('ol', 'ol', 'Lista numerada')}${B('todo', 'todo', 'Lista de verificação')}${B('outdent', 'outdent', 'Diminuir recuo')}${B('indent', 'indent', 'Aumentar recuo')}<i class="tsep"></i>
    ${B('link', 'link', 'Inserir link')}${B('ai', 'spark', 'Escrever com IA')}${B('draw', 'pen', 'Escrita à mão')}${B('ins', 'plus', 'Inserir…')}${B('clear', 'x', 'Limpar formatação')}${B('find', 'search', 'Localizar e substituir')}
  </div>`;
}
VIEWS.doc = main => {
  const d = get('d', R.id);
  if (!d || d.del) { main.innerHTML = headHtml('Documento') + '<div class="scroll"><div class="empty"><p>Documento não encontrado.</p><a class="btn" href="#/docs">Ver documentos</a></div></div>'; return; }
  if (!d.b || !d.b.length) d.b = [{ id: uid(), type: 'p', text: '' }];
  d.style = Object.assign({ bg: 'plain', pat: 'none', font: 'sans', width: 'normal', cover: 'none', size: 'm', page: 'web', margin: 'n', lh: '1.6', coverY: 50, coverH: 'm' }, d.style || {});
  if (ED.doc !== d || HIST.id !== d.id) { HIST.id = d.id; HIST.st = []; HIST.i = -1; }
  ED.doc = d;
  loadDocFonts();
  const s = d.style, a4 = s.page === 'a4', mg = MARGINS[s.margin] || MARGINS.n;
  const path = docPath(d);
  const linkedT = db.t.filter(t => !t.del && t.ln && t.ln.d.includes(d.id));
  const backD = db.d.filter(x => !x.del && x.id !== d.id && (x.b || []).some(b => b.ref === d.id || (b.text || '').includes('data-ref="' + d.id + '"')));
  const fol = d.folder && get('f', d.folder);
  const pre = `<nav class="crumbs"><a href="#/docs">Documentos</a>${fol ? folderAncestors(fol.id).reverse().map(id => { const f = get('f', id); return `<span>/</span><a href="#/docs/${id}">${esc((f.emoji ? f.emoji + ' ' : '') + f.name)}</a>`; }).join('') : ''}${path.map(p => `<span>/</span><a href="#/doc/${p.id}">${esc(p.icon || '')} ${esc(p.title || 'Sem título')}</a>`).join('')}</nav>`;
  const right = `<button class="ib${d.fav ? ' on-star' : ''}" data-act="dfav" aria-label="${d.fav ? 'Remover dos favoritos' : 'Favoritar'}">${ic('star')}</button><button class="btn ghost sm" data-act="dpage" title="Alternar entre página contínua e folha A4">${ic('file', 16)}<span class="hide-s">${a4 ? 'Folha A4' : 'Página'}</span></button><button class="btn ghost sm dsbtn" data-act="dthemes">${ic('spark', 16)}<span class="hide-s">Estilos</span></button><button class="btn ghost sm" data-act="dstyle" data-pop>${ic('palette', 16)}<span class="hide-s">Ajustes</span></button><button class="btn ghost sm" data-act="dexport" data-pop>${ic('export', 16)}<span class="hide-s">Exportar</span></button><button class="ib" data-act="dmenu" aria-label="Mais opções">${ic('more')}</button>`;
  const TH = s.th && dsGet(s.th);
  main.className = a4 ? 'pbg-a4' : TH ? 'themed' : 'pbg-' + s.bg;
  if (TH) main.setAttribute('style', dsVars(TH)); else main.removeAttribute('style');
  const cov = hasCover(d);
  const pageStyle = [s.accent ? '--acc:' + s.accent : '', '--lh:' + (s.lh || '1.6'), a4 ? `--mt:${mg[0]}mm;--mx:${mg[1]}mm` : ''].filter(Boolean).join(';');
  main.innerHTML = headHtml('', '', right, { pre }) + toolbarHtml() + `<div class="scroll docscroll ${a4 ? 'a4wrap' : TH ? 'pthemed' : `pbg-${esc(s.bg)} pat-${esc(s.pat)}`}"><article class="page font-${esc(s.font)} w-${esc(s.width)} sz-${esc(s.size)}${TH ? ' themed' : ''}${a4 ? ` a4 ${TH ? 'pthemed' : `pbg-${esc(s.bg)} pat-${esc(s.pat)}`}` : ''}${s.coverFull && cov ? ' cfull' : ''}${cov ? ' hascov' : ''}" style="${esc(pageStyle)}">
    ${(() => {
      const ph = `<div class="phead">
      ${cov ? '' : `<button class="link addcov" data-act="dcover">${ic('cover', 15)} Adicionar capa</button>`}
      <button class="picon" data-act="dicon" aria-label="Trocar ícone">${esc(d.icon || '📄')}</button>
      <textarea class="ptitle" data-keep rows="1" placeholder="Sem título" aria-label="Título do documento">${esc(d.title)}</textarea>
      <div class="pmeta mut sm"><span>Editado ${esc(fmtDay(ymd(new Date(d.u || d.c)), true).toLowerCase())} às ${hm(new Date(d.u || d.c))}</span><span id="wcount"></span>${linkedT.length ? `<button class="link" data-act="dlinked">${ic('link', 14)} ${plural(linkedT.length, 'tarefa vinculada', 'tarefas vinculadas')}</button>` : ''}<button class="link" data-act="dlinktask">${ic('plus', 14)} vincular tarefa</button></div>
    </div>`;
      return s.coverFull && cov ? coverHtml(d, ph) : coverHtml(d) + ph;
    })()}
    <div class="blocks" id="blocks"></div>
    <div class="ptail" data-act="dtail"></div>
    ${docKids(d.id).length || backD.length || linkedT.length ? `<footer class="pfoot">
      ${docKids(d.id).length ? `<h4>Subpáginas</h4>${docKids(d.id).map(k => `<a class="pref" href="#/doc/${k.id}">${esc(k.icon || '📄')} ${esc(k.title || 'Sem título')}</a>`).join('')}` : ''}
      ${linkedT.length ? `<h4>Tarefas vinculadas</h4>${linkedT.map(t => rowHtml(t, { showList: 1 })).join('')}` : ''}
      ${backD.length ? `<h4>Mencionado em</h4>${backD.map(k => `<a class="pref" href="#/doc/${k.id}">${esc(k.icon || '📄')} ${esc(k.title || 'Sem título')}</a>`).join('')}` : ''}
    </footer>` : ''}
  </article></div>`;
  const ti = main.querySelector('.ptitle');
  const fit = () => { ti.style.height = 'auto'; ti.style.height = ti.scrollHeight + 'px'; };
  fit(); requestAnimationFrame(fit);
  ti.oninput = () => { fit(); d.title = ti.value.replace(/\n/g, ' '); saveDoc(); histLater(); };
  ti.onkeydown = e => { if (e.key === 'Enter' || e.key === 'ArrowDown') { e.preventDefault(); focusBlock(d.b[0].id, 0); } };
  drawBlocks();
  bindEditor(main.querySelector('#blocks'));
  bindToolbar(main.querySelector('.dtool'));
  pushHist();
  const cy = main.querySelector('[data-covy]');
  if (cy) { cy.onmousedown = e => e.stopPropagation(); cy.oninput = () => { const im = main.querySelector('.pcover img'); if (im) im.style.objectPosition = `50% ${cy.value}%`; d.style.coverY = +cy.value; saveDoc(); }; }
  if (ED.caret) { const c = ED.caret; ED.caret = null; setTimeout(() => focusBlock(c.id, c.off), 0); }
  else if (!d.title && !(d.b || []).some(b => stripHtml(b.text)) && !isMobile()) setTimeout(() => ti.focus(), 0);
};
const hasCover = d => { const c = d.style.cover; return !!(c && (c.file || (typeof c === 'string' && c !== 'none'))); };
function coverHtml(d, inner = '') {
  const c = d.style.cover, s = d.style;
  const btns = `<div class="cbtns"><button class="btn ghost sm" data-act="dcover">${ic('cover', 15)}Capa</button>${c && c.file ? `<label class="btn ghost sm">${ic('sort', 15)}Posição<input type="range" min="0" max="100" value="${+s.coverY || 50}" data-covy aria-label="Posição vertical da capa"></label>` : ''}</div>`;
  if (c && c.file) return `<div class="pcover img ch-${esc(s.coverH || 'm')}"><img alt="" data-img="${esc(c.file.id)}" style="object-position:50% ${+s.coverY || 50}%">${btns}${inner}</div>`;
  if (!c || c === 'none') return '';
  return `<div class="pcover cov-${esc(c)} ch-${esc(s.coverH || 'm')}">${btns}${inner}</div>`;
}
/* menu da capa */
function coverMenu(anchor) {
  const d = ED.doc, s = d.style;
  const el = pop(anchor, `<div class="stypop">
    <div class="sty"><span class="lab">Imagem</span><div class="row"><label class="btn red sm filebtn">${ic('img', 16)}Enviar foto<input type="file" accept="image/*" hidden data-cov></label>${hasCover(d) ? `<button class="btn ghost sm" data-rm>Remover capa</button>` : ''}</div></div>
    <div class="sty"><span class="lab">Ou um gradiente</span><div class="stys covs">${Object.entries(COVERS).filter(([k]) => k !== 'none').map(([k, n]) => `<button class="covs-${k}${s.cover === k ? ' on' : ''}" data-g="${k}" title="${esc(n)}" aria-label="${esc(n)}"><span>${esc(n)}</span></button>`).join('')}</div></div>
    <div class="sty"><span class="lab">Altura</span><div class="stys">${[['s', 'Baixa'], ['m', 'Média'], ['l', 'Alta']].map(([k, n]) => `<button class="${(s.coverH || 'm') === k ? 'on' : ''}" data-h="${k}">${n}</button>`).join('')}</div></div>
    <label class="srow"><span>Folha de rosto (capa ocupa a primeira página inteira, com o título por cima)</span><span class="sw-t"><input type="checkbox" data-full ${s.coverFull ? 'checked' : ''}><span></span></span></label>
  </div>`, { cls: 'stywrap', right: 1 });
  const redraw = () => { put('d', d); pushHist(); render(true); };
  el.onclick = e => {
    const g = e.target.closest('[data-g]'), h = e.target.closest('[data-h]');
    if (g) { const old = s.cover; s.cover = g.dataset.g; if (old && old.file) FILES.remove(old.file); closePop(); redraw(); }
    if (h) { s.coverH = h.dataset.h; closePop(); redraw(); }
    if (e.target.closest('[data-rm]')) { const old = s.cover; s.cover = 'none'; s.coverFull = false; if (old && old.file) FILES.remove(old.file); closePop(); redraw(); }
  };
  el.querySelector('[data-full]').onchange = e => { s.coverFull = e.target.checked; if (s.coverFull && !hasCover(d)) s.cover = 'sunset'; closePop(); redraw(); };
  el.querySelector('[data-cov]').onchange = async e => { const f = e.target.files[0]; if (!f) return; try { toast('Enviando capa…', null, null, 1200); const m = await FILES.add(await shrinkImage(f, 2400)); const old = s.cover; s.cover = { file: m }; s.coverY = 50; if (old && old.file) FILES.remove(old.file); closePop(); redraw(); } catch (er) { toast(er.message); } };
}
/* marcadores de página no modo A4 */
let PAGE_PX = 0;
function pageMarkers() {
  const pg = $('.page.a4'); if (!pg) return;
  if (!PAGE_PX) { const m = document.createElement('div'); m.style.cssText = 'position:absolute;visibility:hidden;height:297mm'; document.body.appendChild(m); PAGE_PX = m.offsetHeight; m.remove(); }
  pg.querySelectorAll('.pmark').forEach(x => x.remove());
  pg.style.minHeight = '';
  const H = pg.scrollHeight, n = Math.max(1, Math.ceil((H - 2) / PAGE_PX));
  pg.style.minHeight = (n * PAGE_PX) + 'px';
  for (let k = 1; k < n; k++) { const m = document.createElement('div'); m.className = 'pmark'; m.style.top = (k * PAGE_PX) + 'px'; m.innerHTML = `<span>Página ${k + 1}</span>`; pg.appendChild(m); }
  const wc = $('#wcount'); if (wc) wc.textContent = docStats() + ' · ' + plural(n, 'página', 'páginas');
}
function docStats() { const d = ED.doc; const w = (d.b || []).reduce((n, b) => n + stripHtml(b.text).split(/\s+/).filter(Boolean).length + (b.rows || []).flat().reduce((m, c) => m + stripHtml(c).split(/\s+/).filter(Boolean).length, 0), 0); return plural(w, 'palavra', 'palavras'); }
const updStats = debounce(() => { if (R.v !== 'doc') return; if ($('.page.a4')) pageMarkers(); else { const wc = $('#wcount'); if (wc) wc.textContent = docStats(); } }, 500);
/* desfazer e refazer do documento */
const HIST = { id: null, st: [], i: -1 };
function snapDoc() { const d = ED.doc; return JSON.stringify({ t: d.title, b: d.b, s: d.style }); }
function pushHist() { if (!ED.doc) return; const j = snapDoc(); if (HIST.st[HIST.i] === j) return; HIST.st = HIST.st.slice(0, HIST.i + 1); HIST.st.push(j); if (HIST.st.length > 120) HIST.st.shift(); HIST.i = HIST.st.length - 1; }
let HT = 0;
const histLater = () => { clearTimeout(HT); HT = setTimeout(pushHist, 900); };
function applyHist(dir) {
  const ae = document.activeElement; if (ae && ae.closest && ae.closest('#blocks, .ptitle')) ae.blur();
  clearTimeout(HT); pushHist();
  const i = HIST.i + dir; if (i < 0 || i >= HIST.st.length) { toast(dir < 0 ? 'Nada para desfazer' : 'Nada para refazer', null, null, 1200); return; }
  HIST.i = i; const o = JSON.parse(HIST.st[i]), d = ED.doc;
  d.title = o.t; d.b = o.b; d.style = o.s; put('d', d); render(true);
}
/* barra de ferramentas */
let LAST_RANGE = null;
document.addEventListener('selectionchange', () => { const s = getSelection(); if (s.rangeCount) { const n = s.getRangeAt(0).startContainer; const el = n.nodeType === 1 ? n : n.parentElement; if (el && el.closest && el.closest('#blocks .bx')) LAST_RANGE = s.getRangeAt(0).cloneRange(); } });
function restoreRange() { if (!LAST_RANGE || !LAST_RANGE.startContainer.isConnected) return null; const s = getSelection(); s.removeAllRanges(); s.addRange(LAST_RANGE); const n = LAST_RANGE.startContainer; const el = (n.nodeType === 1 ? n : n.parentElement).closest('.bx'); if (el) el.focus({ preventScroll: true }); s.removeAllRanges(); s.addRange(LAST_RANGE); return el; }
function curBlock() { const el = restoreRange(); return el ? { el, b: blkOf(el) } : null; }
function styleSel(prop, val) {
  const el = restoreRange(); if (!el) { toast('Clique no texto primeiro'); return; }
  const sel = getSelection(), r = sel.getRangeAt(0);
  if (!el.contains(r.endContainer)) { toast('Selecione o texto dentro de um mesmo parágrafo'); return; }
  if (r.collapsed) r.selectNodeContents(el);
  const frag = r.extractContents();
  frag.querySelectorAll('span').forEach(sp => { sp.style[prop] = ''; if (!sp.getAttribute('style') && !sp.attributes.length) sp.replaceWith(...sp.childNodes); });
  const sp = document.createElement('span'); if (val) sp.style[prop] = val; sp.appendChild(frag);
  r.insertNode(sp);
  const nr = document.createRange(); nr.selectNodeContents(sp); sel.removeAllRanges(); sel.addRange(nr); LAST_RANGE = nr.cloneRange();
  syncOne(el); histLater();
}
function bindToolbar(tb) {
  if (!tb) return;
  tb.addEventListener('mousedown', e => { if (e.target.closest('button')) e.preventDefault(); });
  tb.addEventListener('click', e => {
    const b = e.target.closest('[data-tb]'); if (!b) return;
    const k = b.dataset.tb;
    if (k === 'undo') return applyHist(-1);
    if (k === 'redo') return applyHist(1);
    if (k === 'find') return findReplace();
    if (k === 'ai') { const cb0 = curBlock(); const bl = cb0 && cb0.b ? cb0.b : ED.doc.b[ED.doc.b.length - 1]; ED.ctx = { b: bl, off: 0, empty: !stripHtml(bl.text || '').trim() }; applyType('ai'); return; }
    if (k === 'draw' && !(curBlock() || {}).b) { const lb = ED.doc.b[ED.doc.b.length - 1]; ED.ctx = { b: lb, off: 0, empty: false }; applyType('draw'); return; }
    const cb = curBlock(); if (!cb || !cb.b) { toast('Clique no texto primeiro'); return; }
    const { el, b: blk } = cb;
    if (['bold', 'italic', 'underline', 'strikeThrough', 'superscript', 'subscript'].includes(k)) { document.execCommand('styleWithCSS', false, false); document.execCommand(k); syncOne(el); histLater(); return; }
    if (k === 'code' || k === 'color' || k === 'hilite' || k === 'link' || k === 'clear') { if (k === 'clear') { document.execCommand('removeFormat'); const s2 = getSelection(); if (s2.isCollapsed) { el.innerHTML = esc(el.textContent); } syncOne(el); histLater(); return; } fmt(k, b); return; }
    if (k.startsWith('al-')) { const v = { l: null, c: 'center', r: 'right', j: 'justify' }[k[3]]; if (v) blk.align = v; else delete blk.align; restructure(blk.id, caretOff(el)); return; }
    if (k === 'ul' || k === 'ol' || k === 'todo') { blk.type = blk.type === k ? 'p' : k; restructure(blk.id, caretOff(el)); return; }
    if (k === 'indent' || k === 'outdent') { blk.lvl = clamp((blk.lvl || 0) + (k === 'indent' ? 1 : -1), 0, 6); restructure(blk.id, caretOff(el)); return; }
  if (k === 'draw') { ED.ctx = { b: blk, off: caretOff(el), empty: !el.textContent.trim() }; applyType('draw'); return; }
    if (k === 'ins') {
      ED.ctx = { b: blk, off: caretOff(el), empty: !el.textContent.trim() };
      menu(b, ['img', 'draw', 'table', 'hr', 'pb', 'callout', 'toggle', 'task', 'linktask', 'page', 'linkdoc', 'file', 'date'].map(t => { const x = BTYPES.find(y => y.k === t); return x && { label: x.n, icon: x.i, act: () => applyType(t) }; }));
    }
  });
  tb.addEventListener('change', e => {
    const sl = e.target.closest('[data-ts]'); if (!sl) return;
    const v = sl.value, k = sl.dataset.ts;
    if (k === 'type') { const cb = curBlock(); if (cb && cb.b) { cb.b.type = v; if (v === 'callout') { cb.b.emoji = cb.b.emoji || '💡'; cb.b.bg = cb.b.bg || 'yellow'; } restructure(cb.b.id, caretOff(cb.el)); } }
    if (k === 'font') { styleSel('fontFamily', v ? `'${v}'` : ''); sl.value = ''; }
    if (k === 'size') { styleSel('fontSize', v ? v + 'px' : ''); sl.value = ''; }
  });
}
/* localizar e substituir */
function findReplace() {
  const el = modal(`<h2>Localizar e substituir</h2><label class="lab">Localizar<input class="in" name="f" autofocus></label><label class="lab">Substituir por<input class="in" name="r"></label><label class="chkl"><input type="checkbox" name="cs"> Diferenciar maiúsculas</label><p class="mut sm" data-n></p><div class="row end"><button class="btn ghost" data-x>Fechar</button><button class="btn red" data-go>Substituir tudo</button></div>`);
  const f = el.querySelector('[name=f]'), r = el.querySelector('[name=r]'), cs = el.querySelector('[name=cs]'), n = el.querySelector('[data-n]');
  const rx = () => f.value ? new RegExp(f.value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), cs.checked ? 'g' : 'gi') : null;
  const count = () => { const x = rx(); if (!x) { n.textContent = ''; return; } let c = 0; ED.doc.b.forEach(b => { c += (stripHtml(b.text).match(x) || []).length; (b.rows || []).flat().forEach(t => c += (stripHtml(t).match(x) || []).length); }); n.textContent = plural(c, 'ocorrência encontrada', 'ocorrências encontradas'); };
  f.oninput = count; cs.onchange = count;
  el.querySelector('[data-x]').onclick = closeModal;
  el.querySelector('[data-go]').onclick = () => {
    const x = rx(); if (!x) return;
    const rep = h => { const t = document.createElement('template'); t.innerHTML = h || ''; const w = document.createTreeWalker(t.content, NodeFilter.SHOW_TEXT); let nd; while ((nd = w.nextNode())) nd.textContent = nd.textContent.replace(x, r.value); const dv = document.createElement('div'); dv.appendChild(t.content); return dv.innerHTML; };
    ED.doc.b.forEach(b => { if (b.text) b.text = rep(b.text); if (b.rows) b.rows = b.rows.map(row => row.map(rep)); });
    closeModal(); restructure(); toast('Substituição feita');
  };
}
const saveDoc = debounce(() => { if (ED.doc) put('d', ED.doc); }, 400);
function saveNow() { if (ED.doc) put('d', ED.doc); }

/* ---------- desenho dos blocos ---------- */
function blockHtml(b, i, arr, num) {
  const cls = `blk t-${b.type}${b.color ? ' tc-' + b.color : ''}${b.bg ? ' bc-' + b.bg : ''}${b.st ? ' st-' + b.st : ''}${b.checked ? ' checked' : ''}${b.align ? ' al-' + b.align : ''}`;
  const head = `<div class="bh"><button class="bplus" data-bact="plus" aria-label="Inserir bloco abaixo">${ic('plus', 16)}</button><button class="bdrag" data-handle data-bact="menu" aria-label="Opções do bloco">${ic('drag', 16)}</button></div>`;
  const bx = (ph, extra = '') => `<div class="bx" data-keep contenteditable="true" spellcheck="true" data-ph="${esc(ph)}" ${extra}>${b.text || ''}</div>`;
  let inner = '';
  switch (b.type) {
    case 'ul': inner = `<span class="bul">•</span>${bx('Item')}`; break;
    case 'ol': inner = `<span class="bnum">${num}.</span>${bx('Item')}`; break;
    case 'todo': inner = `<button class="cbox${b.checked ? ' on' : ''}" data-bact="check" role="checkbox" aria-checked="${!!b.checked}" aria-label="Marcar item">${ic('check', 12)}</button>${bx('Tarefa')}`; break;
    case 'toggle': inner = `<button class="tgl${b.open !== false ? ' open' : ''}" data-bact="toggle" aria-label="${b.open !== false ? 'Recolher' : 'Expandir'}">${ic('chev', 14)}</button>${bx('Título que recolhe o conteúdo abaixo (recuado)')}`; break;
    case 'callout': inner = `<button class="cemo" data-bact="emoji" aria-label="Trocar ícone">${esc(b.emoji || '💡')}</button>${bx('Destaque')}`; break;
    case 'code': inner = `<div class="bx code" data-keep contenteditable="true" spellcheck="false" data-ph="Código">${b.text || ''}</div>`; break;
    case 'hr': inner = '<hr>'; break;
    case 'pb': inner = `<div class="pbreak"><span>Quebra de página</span></div>`; break;
    case 'img': inner = b.file ? `<figure class="bimg sz-${esc(b.size || 'l')}"><img alt="${esc(stripHtml(b.text) || b.file.name)}" data-img="${esc(b.file.id)}"><figcaption class="bx" data-keep contenteditable="true" data-ph="Legenda">${b.text || ''}</figcaption></figure>` : `<label class="bup">${ic('img', 20)}Escolher imagem<input type="file" accept="image/*" hidden data-bup="img"></label>`; break;
    case 'file': inner = b.file ? `<button class="bfile" data-bact="openfile">${ic('file', 22)}<span><b>${esc(b.file.name)}</b><span class="mut sm">${fmtSize(b.file.size)}</span></span>${ic('dl', 18)}</button>` : `<label class="bup">${ic('clip', 20)}Escolher arquivo<input type="file" hidden data-bup="file"></label>`; break;
    case 'task': {
      const t = get('t', b.ref);
      inner = t ? `<button class="chk p${t.prio || 0}${t.done ? ' on' : ''}" data-bact="tcheck" role="checkbox" aria-checked="${t.done}" aria-label="Concluir tarefa"><span>${ic('check', 12)}</span></button><div class="bx ttask${t.done ? ' done' : ''}" data-keep contenteditable="true" data-ph="Tarefa">${esc(t.title)}</div><button class="tinfo" data-bact="topen">${t.due ? `<span class="md${overdue(t) ? ' red' : ''}">${ic('cal', 13)}${esc(fmtWhen(t.due))}</span>` : ''}<span class="md">${esc(listOf(t).name)}</span>${ic('chev', 14)}</button>`
        : `<span class="mut">Tarefa excluída</span>`;
      break;
    }
    case 'page': { const p = get('d', b.ref); inner = p && !p.del ? `<a class="bpage" href="#/doc/${p.id}"><span class="dicon">${esc(p.icon || '📄')}</span><span>${esc(p.title || 'Sem título')}</span>${ic('chev', 14)}</a>` : '<span class="mut">Documento excluído</span>'; break; }
    case 'table': {
      const rows = b.rows || [['', ''], ['', '']];
      inner = `<div class="btable"><table>${rows.map((r, ri) => `<tr>${r.map((c, ci) => `<${ri === 0 && b.head !== false ? 'th' : 'td'} class="bx tc" data-keep contenteditable="true" data-r="${ri}" data-c="${ci}">${c || ''}</${ri === 0 && b.head !== false ? 'th' : 'td'}>`).join('')}</tr>`).join('')}</table><div class="tbtools"><button data-bact="trow" aria-label="Adicionar linha">${ic('plus', 14)} linha</button><button data-bact="tcol" aria-label="Adicionar coluna">${ic('plus', 14)} coluna</button></div></div>`;
      break;
    }
    default: inner = bx(b.type === 'h1' ? 'Título' : b.type === 'h2' ? 'Subtítulo' : b.type === 'h3' ? 'Título pequeno' : b.type === 'quote' ? 'Citação' : i === 0 && arr.length === 1 ? "Digite '/' para comandos ou '@' para mencionar" : '');
  }
  return `<div class="${cls}" data-id="${b.id}" style="--lvl:${b.lvl || 0}" data-drag="blk:${b.id}" data-drop="blk:${b.id}">${head}<div class="bc">${inner}</div></div>`;
}
function drawBlocks() {
  const box = $('#blocks'), d = ED.doc; if (!box || !d) return;
  let h = '', num = 0, hideBelow = null;
  d.b.forEach((b, i, arr) => {
    const lvl = b.lvl || 0;
    if (hideBelow != null) { if (lvl > hideBelow) return; hideBelow = null; }
    num = b.type === 'ol' ? ((i > 0 && arr[i - 1].type === 'ol' && (arr[i - 1].lvl || 0) === lvl) ? num + 1 : 1) : 0;
    h += blockHtml(b, i, arr, num);
    if (b.type === 'toggle' && b.open === false) hideBelow = lvl;
  });
  box.innerHTML = h;
  box.querySelectorAll('img[data-img]').forEach(loadImg);
  const cv = $('.pcover img[data-img]'); if (cv) loadImg(cv);
  setTimeout(updStats, 60);
}
async function loadImg(img) {
  const id = img.dataset.img;
  const d = ED.doc, m = (d.b.find(b => b.file && b.file.id === id) || {}).file || (d.style.cover && d.style.cover.file && d.style.cover.file.id === id ? d.style.cover.file : null);
  if (!m) return;
  try { if (!IMG_URL.has(id)) IMG_URL.set(id, await FILES.url(m)); img.src = IMG_URL.get(id); } catch (e) { img.alt = 'Imagem indisponível neste aparelho'; img.closest('figure,.pcover') && img.closest('figure,.pcover').classList.add('noimg'); }
}

/* ---------- cursor ---------- */
function caretOff(el) {
  const s = getSelection(); if (!s.rangeCount) return 0;
  const r = s.getRangeAt(0), pre = r.cloneRange();
  pre.selectNodeContents(el); pre.setEnd(r.startContainer, r.startOffset);
  return pre.toString().length;
}
function setCaret(el, off) {
  el.focus();
  const s = getSelection(), r = document.createRange();
  if (off == null || off < 0) off = 0;
  let n, rem = off;
  const w = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
  while ((n = w.nextNode())) { if (rem <= n.length) { r.setStart(n, rem); r.collapse(true); s.removeAllRanges(); s.addRange(r); return; } rem -= n.length; }
  r.selectNodeContents(el); r.collapse(false); s.removeAllRanges(); s.addRange(r);
}
function focusBlock(id, off) {
  const el = $(`#blocks .blk[data-id="${CSS.escape(id)}"] .bx`);
  if (!el) return;
  setCaret(el, off === 'end' ? 1e9 : off);
  const r = el.getBoundingClientRect(); if (r.bottom > innerHeight - 80 || r.top < 80) el.scrollIntoView({ block: 'center' });
}
const blkOf = el => { const w = el.closest('.blk'); return w && ED.doc.b.find(b => b.id === w.dataset.id); };
const idxOf = b => ED.doc.b.indexOf(b);
function restructure(focusId, off) { saveNow(); drawBlocks(); if (focusId) focusBlock(focusId, off); pushHist(); }
function insertAfter(b, nb) { ED.doc.b.splice(idxOf(b) + 1, 0, nb); return nb; }

/* ---------- menus do editor (/ e @) ---------- */
let SL = null;
function closeSlash() { if (SL) { SL.el.remove(); SL = null; } }
function caretRect() { const s = getSelection(); if (!s.rangeCount) return null; const r = s.getRangeAt(0).cloneRange(); let rc = r.getClientRects()[0]; if (!rc) { const sp = document.createElement('span'); sp.textContent = '​'; r.insertNode(sp); rc = sp.getBoundingClientRect(); sp.remove(); } return rc; }
function openSlash(el, kind) {
  closeSlash();
  const box = document.createElement('div');
  box.className = 'pop menu slash';
  document.body.appendChild(box);
  SL = { el: box, kind, bx: el, start: caretOff(el) - 1, q: '', i: 0, items: [] };
  drawSlash();
}
function slashItems() {
  const q = norm(SL.q);
  if (SL.kind === '/') {
    const base = BTYPES.map(t => ({ label: t.n, icon: t.i, kw: t.kw, g: SLG[t.k] || 'Básico', d: SLD[t.k] || '', run: () => applyType(t.k) }));
    const GO = ['Básico', 'Listas', 'Mídia', 'Tarefas e páginas'];
    base.sort((a, b) => GO.indexOf(a.g) - GO.indexOf(b.g));
    const cols = BCOL.map(c => ({ g: 'Cores', label: 'Texto ' + BCOL_N[c].toLowerCase(), sw: c, kw: 'cor texto ' + norm(BCOL_N[c]), run: () => styleCur('color', c) }))
      .concat(BCOL.map(c => ({ g: 'Cores', label: 'Fundo ' + BCOL_N[c].toLowerCase(), swb: c, kw: 'fundo cor marca texto ' + norm(BCOL_N[c]), run: () => styleCur('bg', c) })))
      .concat([{ g: 'Cores', label: 'Estilo cartão', icon: 'callout', kw: 'estilo cartao card bloco', run: () => styleCur('st', 'card') }, { label: 'Estilo foco', icon: 'star', kw: 'estilo foco destaque grande', run: () => styleCur('st', 'focus') }, { label: 'Limpar estilo', icon: 'x', kw: 'limpar estilo cor', run: () => { styleCur('color', null); styleCur('bg', null); styleCur('st', null); } }]);
    const all = base.concat(cols);
    return (q ? all.filter(x => norm(x.label + ' ' + x.kw).includes(q)) : base.concat(cols.slice(0, 0))).slice(0, 40);
  }
  /* @ menções */
  const T = today(), out = [];
  const dates = [['Hoje', T], ['Amanhã', addD(T, 1)], ['Depois de amanhã', addD(T, 2)], ['Próxima semana', addD(sow(T), 7 + (weekStart() === 0 ? 1 : 0))]];
  const p = q ? parseSmart(SL.q) : null;
  if (p && p.date && p.tokens.length) dates.unshift([fmtDay(p.date, true), p.date]);
  dates.filter(([n]) => !q || norm(n).includes(q) || (p && p.date)).forEach(([n, v]) => out.push({ label: n, icon: 'cal', hint: fmtDay(v, true), run: () => insertMention('date', v, fmtDay(v, true)) }));
  db.t.filter(t => !t.del && (!q || norm(t.title).includes(q))).sort((a, b) => (a.done - b.done) || sortTasks(a, b)).slice(0, 6).forEach(t => out.push({ label: t.title, icon: 'todo', hint: 'tarefa', run: () => insertMention('task', t.id, t.title) }));
  db.d.filter(d => !d.del && d.id !== ED.doc.id && (!q || norm(d.title).includes(q))).slice(0, 6).forEach(d => out.push({ label: (d.icon || '') + ' ' + (d.title || 'Sem título'), icon: 'doc', hint: 'documento', run: () => insertMention('doc', d.id, d.title || 'Sem título') }));
  if (q) out.push({ label: 'Criar tarefa "' + SL.q + '"', icon: 'plus', run: () => { const t = taskFromSmart(SL.q, { ln: { d: [ED.doc.id], t: [] } }); put('t', t); gcalPushTask(t); insertMention('task', t.id, t.title); } });
  return out.slice(0, 16);
}
function drawSlash() {
  if (!SL) return;
  SL.items = slashItems();
  if (!SL.items.length) { SL.el.innerHTML = '<p class="hint pad">Nada encontrado</p>'; }
  else {
    SL.i = clamp(SL.i, 0, SL.items.length - 1);
    let lastG = null;
    SL.el.innerHTML = (SL.kind === '/' ? '' : `<div class="mtitle">Mencionar</div>`) + SL.items.map((it, i) => {
      const head = SL.kind === '/' && it.g !== lastG ? `<div class="mtitle">${esc(it.g || 'Inserir')}</div>` : '';
      lastG = it.g;
      const lead = it.sw ? `<span class="slic"><span class="swt tc-${it.sw}">A</span></span>` : it.swb ? `<span class="slic"><span class="sw-b bc-${it.swb}"></span></span>` : `<span class="slic">${ic(it.icon || 'text', 18)}</span>`;
      return `${head}<button class="mi${i === SL.i ? ' act' : ''}" data-si="${i}">${lead}<span class="sltx"><span class="ml">${esc(it.label)}</span>${it.d ? `<span class="sld">${esc(it.d)}</span>` : ''}</span>${it.hint ? `<span class="mh">${esc(it.hint)}</span>` : ''}</button>`;
    }).join('');
  }
  const rc = caretRect();
  const el = SL.el;
  if (isMobile()) { el.classList.add('sheet', 'nos'); }
  else if (rc) { let x = rc.left, y = rc.bottom + 6; const h = el.offsetHeight, w = el.offsetWidth; if (y + h > innerHeight - 8) y = rc.top - h - 6; if (x + w > innerWidth - 8) x = innerWidth - w - 8; el.style.left = Math.max(8, x) + 'px'; el.style.top = Math.max(8, y) + 'px'; }
  const a = el.querySelector('.act'); if (a) a.scrollIntoView({ block: 'nearest' });
  el.onmousedown = e => e.preventDefault();
  el.onclick = e => { const b = e.target.closest('[data-si]'); if (b) runSlash(+b.dataset.si); };
}
function stripQuery() {
  const el = SL.bx, b = blkOf(el), end = caretOff(el);
  const txt = el.textContent;
  /* remove "/consulta" do texto do bloco preservando a formatação */
  const r = document.createRange(), w = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
  let n, pos = 0, sN, sO, eN, eO;
  while ((n = w.nextNode())) { const L = n.length; if (sN == null && SL.start >= pos && SL.start <= pos + L) { sN = n; sO = SL.start - pos; } if (end >= pos && end <= pos + L) { eN = n; eO = end - pos; } pos += L; }
  if (sN && eN) { r.setStart(sN, sO); r.setEnd(eN, eO); r.deleteContents(); }
  b.text = clean(el.innerHTML);
  return { b, off: SL.start, empty: !el.textContent.trim(), txt };
}
function runSlash(i) {
  const it = SL && SL.items[i]; if (!it) return;
  const st = stripQuery();
  SL.ctx = st;
  const fn = it.run; const ctx = st;
  closeSlash();
  ED.ctx = ctx;
  fn();
}
function styleCur(k, v) { const b = ED.ctx.b; if (v == null) delete b[k]; else b[k] = v; restructure(b.id, ED.ctx.off); }
function applyType(k) {
  const { b, off, empty } = ED.ctx;
  const d = ED.doc;
  const make = (type, extra = {}) => {
    if (empty && TEXTY.has(b.type) && b.type !== 'callout') { Object.assign(b, { type }, extra); return b; }
    return insertAfter(b, Object.assign({ id: uid(), type, text: '', lvl: b.lvl || 0 }, extra));
  };
  if (TEXTY.has(k)) { const nb = empty ? Object.assign(b, { type: k }) : insertAfter(b, { id: uid(), type: k, text: '', lvl: b.lvl || 0 }); if (k === 'callout' && !nb.emoji) { nb.emoji = '💡'; nb.bg = nb.bg || 'yellow'; } if (k === 'toggle') nb.open = true; restructure(nb.id, empty ? 0 : 0); return; }
  if (k === 'hr' || k === 'pb') { const nb = make(k); const p = insertAfter(nb, { id: uid(), type: 'p', text: '' }); restructure(p.id, 0); return; }
  if (k === 'table') { const nb = make('table', { rows: [['Coluna 1', 'Coluna 2', 'Coluna 3'], ['', '', ''], ['', '', '']], head: true }); restructure(); setTimeout(() => { const c = $(`#blocks .blk[data-id="${nb.id}"] [data-r="1"][data-c="0"]`); if (c) setCaret(c, 0); }, 0); return; }
  if (k === 'ai') {
    const all = d.b.map(x => stripHtml(x.text || '')).filter(Boolean).join('\n');
    const cur = empty ? '' : stripHtml(b.text || '');
    const toBlocks = md => { const r = mdToDoc(md); const out = r.b.filter(x => x.type !== 'p' || x.text); if (r.title) out.unshift({ id: uid(), type: 'h2', text: esc(r.title) }); return out.length ? out : [{ id: uid(), type: 'p', text: esc(md) }]; };
    aiPanel({ text: cur, all, insert: md => { const nbs = toBlocks(md); let last = b; if (empty && TEXTY.has(b.type)) { Object.assign(b, nbs.shift()); b.id = b.id || uid(); } nbs.forEach(x => { last = insertAfter(last, x); }); restructure(last.id, 0); histLater(); }, replace: md => { const nbs = toBlocks(md); const first = nbs.shift(); Object.assign(b, first, { id: b.id }); let last = b; nbs.forEach(x => { last = insertAfter(last, x); }); restructure(last.id, 0); histLater(); } });
    return;
  }
  if (k === 'draw') { const nb = make('img'); restructure(); openDraw(async f => { toast('Salvando…', null, null, 1200); nb.file = await FILES.add(f); nb.text = ''; restructure(); }); return; }
  if (k === 'img' || k === 'file') { const nb = make(k); restructure(); setTimeout(() => { const i = $(`#blocks .blk[data-id="${nb.id}"] input[type=file]`); if (i) i.click(); }, 50); return; }
  if (k === 'task') {
    const title = empty ? '' : stripHtml(b.text);
    const t = taskFromSmart(title || 'Nova tarefa', { ln: { d: [d.id], t: [] } });
    put('t', t); gcalPushTask(t);
    let tb = b;
    if (empty || b.type === 'p' || b.type === 'todo') Object.assign(b, { type: 'task', ref: t.id, text: '' });
    else tb = insertAfter(b, { id: uid(), type: 'task', ref: t.id, text: '', lvl: b.lvl || 0 });
    restructure(); setTimeout(() => { const el = $(`#blocks [data-id="${tb.id}"] .ttask`); if (el) { setCaret(el, 1e9); if (!title) { const r = document.createRange(); r.selectNodeContents(el); getSelection().removeAllRanges(); getSelection().addRange(r); } } }, 0);
    return;
  }
  if (k === 'linktask') { pickItem('t', [], id => { make('task', { ref: id }); const t = get('t', id); t.ln = t.ln || { d: [], t: [] }; if (!t.ln.d.includes(d.id)) { t.ln.d.push(d.id); put('t', t); } restructure(); }); return; }
  if (k === 'page') { const kid = newDoc({ par: d.id, title: '', o: Date.now() }); make('page', { ref: kid.id }); saveNow(); go('doc/' + kid.id); return; }
  if (k === 'linkdoc') { pickItem('d', [d.id], id => { make('page', { ref: id }); restructure(); }); return; }
  if (k === 'date') { const el = $(`#blocks .blk[data-id="${b.id}"] .bx`); if (el) { setCaret(el, off); insertMention('date', today(), fmtDay(today(), true)); } return; }
}
function insertMention(kind, ref, label) {
  const { b, off } = ED.ctx || {};
  const el = b ? $(`#blocks .blk[data-id="${b.id}"] .bx`) : null;
  if (!el) return;
  setCaret(el, off);
  const html = `<span class="mention m-${kind}" data-kind="${kind}" data-ref="${esc(ref)}" contenteditable="false">${kind === 'task' ? '☐ ' : kind === 'doc' ? '↗ ' : ''}${esc(label)}</span>&nbsp;`;
  document.execCommand('insertHTML', false, html);
  b.text = clean(el.innerHTML);
  if (kind === 'task') { const t = get('t', ref); if (t) { t.ln = t.ln || { d: [], t: [] }; if (!t.ln.d.includes(ED.doc.id)) { t.ln.d.push(ED.doc.id); put('t', t, { silent: true }); } } }
  saveNow();
}

/* ---------- barra de formatação ---------- */
let FB = null;
function showFormatBar() {
  const s = getSelection();
  if (!s.rangeCount || s.isCollapsed) { hideFormatBar(); return; }
  const r = s.getRangeAt(0), bx = r.commonAncestorContainer.nodeType === 1 ? r.commonAncestorContainer.closest('.bx') : r.commonAncestorContainer.parentElement && r.commonAncestorContainer.parentElement.closest('.bx');
  if (!bx || !bx.closest('#blocks')) { hideFormatBar(); return; }
  if (!FB) {
    FB = document.createElement('div'); FB.className = 'fbar';
    FB.innerHTML = [['bold', 'bold', 'Negrito'], ['italic', 'italic', 'Itálico'], ['underline', 'under', 'Sublinhado'], ['strikeThrough', 'strike', 'Tachado'], ['code', 'code', 'Código'], ['link', 'link', 'Link'], ['color', 'palette', 'Cor'], ['hilite', 'highlight', 'Marca-texto'], ['task', 'todo', 'Virar tarefa'], ['clear', 'x', 'Limpar formatação']].map(([k, i, n]) => `<button data-fb="${k}" aria-label="${n}" title="${n}">${ic(i, 18)}</button>`).join('');
    FB.onmousedown = e => e.preventDefault();
    FB.onclick = e => { const b = e.target.closest('[data-fb]'); if (b) fmt(b.dataset.fb, b); };
    document.body.appendChild(FB);
  }
  const rc = r.getBoundingClientRect();
  FB.classList.add('on');
  const w = FB.offsetWidth;
  FB.style.left = clamp(rc.left + rc.width / 2 - w / 2, 8, innerWidth - w - 8) + 'px';
  FB.style.top = (rc.top - 48 < 60 ? rc.bottom + 8 : rc.top - 48) + 'px';
}
function hideFormatBar() { if (FB) FB.classList.remove('on'); }
function fmt(k, btn) {
  document.execCommand('styleWithCSS', false, k === 'color' || k === 'hilite');
  if (['bold', 'italic', 'underline', 'strikeThrough'].includes(k)) document.execCommand(k);
  else if (k === 'code') { const s = getSelection(); const t = s.toString(); document.execCommand('insertHTML', false, '<code>' + esc(t) + '</code>'); }
  else if (k === 'link') { const s = getSelection(), r = s.getRangeAt(0).cloneRange(); ask('Endereço do link', 'https://').then(u => { if (!u) return; s.removeAllRanges(); s.addRange(r); document.execCommand('createLink', false, /^(https?:|mailto:)/.test(u) ? u : 'https://' + u); syncBx(); }); return; }
  else if (k === 'color' || k === 'hilite') {
    const s = getSelection(), r = s.getRangeAt(0).cloneRange();
    const pal = k === 'color' ? { padrão: '', cinza: '#7a7a7a', marrom: '#8a6a55', laranja: '#d9730d', amarelo: '#b8860b', verde: '#2e8b57', azul: '#2b6cb0', roxo: '#7b3fbf', rosa: '#c2185b', vermelho: '#d32f2f' }
      : { nenhum: 'transparent', amarelo: '#fff3a3', verde: '#d3f5d6', azul: '#d6e8ff', roxo: '#eadcff', rosa: '#ffdced', vermelho: '#ffd9d6', laranja: '#ffe3c2', cinza: '#e8e8e8' };
    const el = pop(btn, `<div class="pal">${Object.entries(pal).map(([n, c]) => `<button data-c="${c}" title="${n}" aria-label="${n}" style="${k === 'color' ? 'color:' + (c || 'inherit') : 'background:' + c}">A</button>`).join('')}</div>`, { cls: 'palpop', inline: 1 });
    el.onmousedown = e => e.preventDefault();
    el.onclick = e => { const b = e.target.closest('[data-c]'); if (!b) return; s.removeAllRanges(); s.addRange(r); document.execCommand('styleWithCSS', false, true); if (k === 'color') document.execCommand('foreColor', false, b.dataset.c || 'inherit'); else document.execCommand('hiliteColor', false, b.dataset.c); closePop(); syncBx(); };
    return;
  }
  else if (k === 'task') { const s = getSelection(), txt = s.toString().trim(); if (!txt) return; const t = taskFromSmart(txt, { ln: { d: [ED.doc.id], t: [] } }); put('t', t); gcalPushTask(t); document.execCommand('insertHTML', false, `<span class="mention m-task" data-kind="task" data-ref="${t.id}" contenteditable="false">☐ ${esc(t.title)}</span>&nbsp;`); toast('Tarefa criada', 'Abrir', () => openTask(t.id)); }
  else if (k === 'clear') document.execCommand('removeFormat');
  syncBx();
}
function syncBx() { const a = document.activeElement; if (a && a.classList.contains('bx')) syncOne(a); hideFormatBar(); }
function syncOne(el) {
  const b = blkOf(el); if (!b) return;
  if (!el.isConnected) return;
  const w = el.closest('.blk'); if (!w || !w.classList.contains('t-' + b.type)) return;
  if (el.classList.contains('tc')) { b.rows[+el.dataset.r][+el.dataset.c] = clean(el.innerHTML); }
  else if (el.classList.contains('ttask')) { const t = get('t', b.ref); if (t) { t.title = el.textContent.trim(); put('t', t, { silent: true }); saveTaskTitle(t); } return; }
  else b.text = el.classList.contains('code') ? esc(el.innerText).replace(/\n/g, '<br>') : clean(el.innerHTML);
  saveDoc();
}
const saveTaskTitle = debounce(t => { put('t', t); gcalPushTask(t); }, 600);
document.addEventListener('selectionchange', () => { if (R.v === 'doc') { clearTimeout(showFormatBar.t); showFormatBar.t = setTimeout(showFormatBar, 120); } });

/* ---------- teclado e eventos do editor ---------- */
function bindEditor(box) {
  box.addEventListener('input', e => {
    const el = e.target.closest('.bx'); if (!el) return;
    const b = blkOf(el); if (!b) return;
    if (SL) {
      const off = caretOff(el);
      if (off <= SL.start) { closeSlash(); }
      else { SL.q = el.textContent.slice(SL.start + 1, off); if (/\s{2}|^\s/.test(SL.q) || SL.q.length > 40) closeSlash(); else { SL.i = 0; drawSlash(); } }
    }
    const off = caretOff(el), txt = el.textContent, ch = txt[off - 1];
    if ((ch === '/' || ch === '@') && (off === 1 || /\s/.test(txt[off - 2])) && !el.classList.contains('code') && !el.classList.contains('ttask')) { syncOne(el); openSlash(el, ch); return; }
    /* atalhos tipo markdown no início do bloco */
    if (TEXTY.has(b.type) && b.type !== 'code' && !el.classList.contains('tc') && (ch === ' ' || ch === '\u00a0')) {
      const pre = txt.slice(0, off - 1);
      const map = { '#': 'h1', '##': 'h2', '###': 'h3', '-': 'ul', '–': 'ul', '—': 'ul', '•': 'ul', '*': 'ul', '1.': 'ol', '[]': 'todo', '[ ]': 'todo', '>': 'quote', '```': 'code', '!': 'callout', '+': 'toggle' };
      if (map[pre] && off - 1 === pre.length) {
        b.type = map[pre]; if (b.type === 'callout') { b.emoji = '💡'; b.bg = b.bg || 'yellow'; }
        el.textContent = txt.slice(off); b.text = clean(el.innerHTML); restructure(b.id, 0); return;
      }
      if (txt.trim() === '---' && b.type === 'p') { b.type = 'hr'; b.text = ''; const p = insertAfter(b, { id: uid(), type: 'p', text: '' }); restructure(p.id, 0); return; }
    }
    syncOne(el); histLater(); updStats();
  });
  box.addEventListener('keydown', e => {
    if ((e.metaKey || e.ctrlKey) && !e.altKey && (e.key === 'z' || e.key === 'Z' || e.key === 'y')) { e.preventDefault(); applyHist(e.key === 'y' || e.shiftKey ? 1 : -1); return; }
    const el = e.target.closest('.bx'); if (!el) return;
    const b = blkOf(el); if (!b) return;
    if (SL) {
      if (e.key === 'ArrowDown') { e.preventDefault(); SL.i = (SL.i + 1) % Math.max(1, SL.items.length); drawSlash(); return; }
      if (e.key === 'ArrowUp') { e.preventDefault(); SL.i = (SL.i - 1 + SL.items.length) % Math.max(1, SL.items.length); drawSlash(); return; }
      if (e.key === 'Enter' || e.key === 'Tab') { e.preventDefault(); runSlash(SL.i); return; }
      if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); closeSlash(); return; }
    }
    if (el.classList.contains('tc')) return tableKeys(e, el, b);
    if (el.classList.contains('ttask')) { if (e.key === 'Enter') { e.preventDefault(); smartTaskBlock(b, el); const nb = insertAfter(b, { id: uid(), type: 'p', text: '', lvl: b.lvl || 0 }); restructure(nb.id, 0); } return; }
    const off = caretOff(el), len = el.textContent.length;
    if (e.key === 'Enter' && !e.shiftKey && !(b.type === 'code' && !e.metaKey && !e.ctrlKey)) {
      e.preventDefault();
      if (!el.textContent.trim() && ['ul', 'ol', 'todo', 'quote', 'toggle', 'callout'].includes(b.type)) { if (b.lvl) b.lvl--; else b.type = 'p'; restructure(b.id, 0); return; }
      const s = getSelection(), r = s.getRangeAt(0);
      r.deleteContents();
      const tail = document.createRange(); tail.setStart(r.startContainer, r.startOffset); tail.setEnd(el, el.childNodes.length);
      const frag = tail.extractContents(), tmp = document.createElement('div'); tmp.appendChild(frag);
      b.text = clean(el.innerHTML);
      const cont = ['ul', 'ol', 'todo'].includes(b.type) ? b.type : (b.type === 'toggle' ? 'p' : 'p');
      const nb = insertAfter(b, { id: uid(), type: cont, text: clean(tmp.innerHTML), lvl: (b.lvl || 0) + (b.type === 'toggle' ? 1 : 0) });
      if (off === 0 && len > 0) { nb.type = b.type; nb.text = clean(tmp.innerHTML); b.text = ''; b.type = TEXTY.has(b.type) && b.type.startsWith('h') ? 'p' : b.type; b.checked = false; }
      restructure(nb.id, 0); return;
    }
    if (e.key === 'Backspace' && off === 0 && getSelection().isCollapsed) {
      if (b.type !== 'p' && TEXTY.has(b.type)) { e.preventDefault(); b.type = 'p'; delete b.checked; restructure(b.id, 0); return; }
      if (b.lvl) { e.preventDefault(); b.lvl--; restructure(b.id, 0); return; }
      const i = idxOf(b), prev = ED.doc.b[i - 1];
      if (!prev) return;
      e.preventDefault();
      if (!TEXTY.has(prev.type)) { if (!el.textContent.trim()) { ED.doc.b.splice(i, 1); restructure(prev.id, 'end'); } else { const p2 = ED.doc.b[i - 1]; ED.doc.b.splice(i - 1, 1); restructure(b.id, 0); } return; }
      const at = stripHtml(prev.text).length;
      prev.text = clean((prev.text || '') + (b.text || ''));
      ED.doc.b.splice(i, 1); restructure(prev.id, at); return;
    }
    if (e.key === 'Delete' && off === len && getSelection().isCollapsed) {
      const next = ED.doc.b[idxOf(b) + 1];
      if (next && TEXTY.has(next.type)) { e.preventDefault(); b.text = clean((b.text || '') + (next.text || '')); ED.doc.b.splice(idxOf(next), 1); restructure(b.id, off); }
      return;
    }
    if (e.key === 'Tab') { e.preventDefault(); b.lvl = clamp((b.lvl || 0) + (e.shiftKey ? -1 : 1), 0, 6); restructure(b.id, off); return; }
    if ((e.key === 'ArrowUp' || e.key === 'ArrowDown') && !e.shiftKey) {
      const rc = caretRect(), er = el.getBoundingClientRect();
      if (!rc) return;
      const up = e.key === 'ArrowUp';
      if ((up && rc.top - er.top < 14) || (!up && er.bottom - rc.bottom < 14)) {
        const all = $$('#blocks .bx'), k = all.indexOf(el), nx = all[k + (up ? -1 : 1)];
        if (nx) { e.preventDefault(); setCaret(nx, up ? 1e9 : 0); }
        else if (up) { e.preventDefault(); $('.ptitle').focus(); }
      }
      return;
    }
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter' && b.type === 'todo') { e.preventDefault(); b.checked = !b.checked; restructure(b.id, off); return; }
    if ((e.metaKey || e.ctrlKey) && /^[1-3]$/.test(e.key) && e.altKey) { e.preventDefault(); b.type = 'h' + e.key; restructure(b.id, off); }
  });
  box.addEventListener('paste', e => {
    const el = e.target.closest('.bx'); if (!el) return;
    const html = e.clipboardData.getData('text/html'), txt = e.clipboardData.getData('text/plain');
    const items = Array.from(e.clipboardData.items || []).filter(i => i.kind === 'file' && /^image\//.test(i.type));
    if (items.length) { e.preventDefault(); const b = blkOf(el); items.forEach(async it => { const f = it.getAsFile(); try { const m = await FILES.add(f); insertAfter(b, { id: uid(), type: 'img', file: m, text: '' }); restructure(); } catch (er) { toast(er.message); } }); return; }
    e.preventDefault();
    if (el.classList.contains('code') || el.classList.contains('ttask') || el.classList.contains('tc')) { document.execCommand('insertText', false, txt); return; }
    const lines = txt.split(/\r?\n/);
    if (lines.length > 1 && !html) {
      const b = blkOf(el); let last = b;
      document.execCommand('insertText', false, lines[0]);
      b.text = clean(el.innerHTML);
      lines.slice(1).forEach(l => { const m = l.match(/^\s*([-*•]|\d+\.|\[ ?\]|\[x\]|#{1,3})\s+(.*)$/i); let type = b.type === 'code' ? 'code' : 'p', t = l; if (m) { t = m[2]; type = /^\d/.test(m[1]) ? 'ol' : /^\[/.test(m[1]) ? 'todo' : /^#/.test(m[1]) ? 'h' + m[1].length : 'ul'; } last = insertAfter(last, { id: uid(), type, text: esc(t), lvl: b.lvl || 0, checked: m && /x/i.test(m[1]) }); });
      restructure(last.id, 'end'); return;
    }
    document.execCommand('insertHTML', false, html ? clean(html) : esc(txt));
    syncOne(el);
  });
  box.addEventListener('focusout', e => { const el = e.target.closest('.bx'); if (el && el.isConnected && el.classList.contains('ttask')) { const b = blkOf(el); if (b && smartTaskBlock(b, el)) setTimeout(() => { if (!document.activeElement || !document.activeElement.closest('#blocks')) drawBlocks(); }, 50); } if (el && el.isConnected) { syncOne(el); saveNow(); setTimeout(() => { if (!document.activeElement || !document.activeElement.closest('#blocks')) closeSlash(); }, 150); } });
  box.addEventListener('click', e => {
    const m = e.target.closest('.mention');
    if (m) { const k = m.dataset.kind, r = m.dataset.ref; if (k === 'task' && get('t', r)) openTask(r); else if (k === 'doc' && get('d', r)) go('doc/' + r); else if (k === 'date') { CAL.date = CAL.sel = r; CAL.mode = 'day'; go('cal'); } return; }
    const a = e.target.closest('.bx a[href]');
    if (a && (e.metaKey || e.ctrlKey || !a.closest('[contenteditable=true]:focus'))) { e.preventDefault(); window.open(a.href, '_blank', 'noopener'); return; }
    const btn = e.target.closest('[data-bact]'); if (!btn) return;
    const b = blkOf(btn); if (!b) return;
    const k = btn.dataset.bact;
    if (k === 'check') { b.checked = !b.checked; restructure(); }
    if (k === 'toggle') { b.open = b.open === false; restructure(); }
    if (k === 'emoji') emojiPick(btn, em => { b.emoji = em; restructure(); });
    if (k === 'tcheck') { checkTask(b.ref); setTimeout(() => drawBlocks(), 320); }
    if (k === 'topen') openTask(b.ref);
    if (k === 'openfile') openFile(b.file);
    if (k === 'plus') { const nb = insertAfter(b, { id: uid(), type: 'p', text: '', lvl: b.lvl || 0 }); restructure(nb.id, 0); setTimeout(() => { const el = $(`#blocks .blk[data-id="${nb.id}"] .bx`); if (el) { document.execCommand('insertText', false, '/'); } }, 10); }
    if (k === 'menu') blockMenu(b, btn);
    if (k === 'trow') { b.rows.push(b.rows[0].map(() => '')); restructure(); }
    if (k === 'tcol') { b.rows.forEach((r, i) => r.push(i === 0 && b.head !== false ? 'Coluna ' + (r.length + 1) : '')); restructure(); }
  });
  box.addEventListener('change', async e => {
    const inp = e.target.closest('input[data-bup]'); if (!inp) return;
    const b = blkOf(inp), f = inp.files && inp.files[0]; if (!f) return;
    try { toast('Enviando arquivo…', null, null, 1500); b.file = await FILES.add(f); if (b.type === 'img') b.text = ''; restructure(); } catch (er) { toast(er.message); }
  });
}
function smartTaskBlock(b, el) {
  const t = get('t', b.ref); if (!t) return false;
  const txt = el.textContent.trim(), p = parseSmart(txt);
  if (!p.tokens.length) return false;
  const n = taskFromSmart(txt, {});
  t.title = n.title;
  if (n.due || n.start) { t.due = n.due; t.start = n.start; t.rem = n.rem; }
  if (n.rep) t.rep = n.rep;
  if (p.prio) t.prio = n.prio;
  if (n.tags.length) t.tags = [...new Set([...(t.tags || []), ...n.tags])];
  if (p.list) t.list = n.list;
  put('t', t); gcalPushTask(t); el.textContent = t.title;
  return true;
}
function tableKeys(e, el, b) {
  const r = +el.dataset.r, c = +el.dataset.c;
  const move = (rr, cc) => { const n = $(`#blocks .blk[data-id="${b.id}"] [data-r="${rr}"][data-c="${cc}"]`); if (n) { e.preventDefault(); setCaret(n, 1e9); return true; } };
  if (e.key === 'Tab') { e.preventDefault(); syncOne(el); const cols = b.rows[0].length; let nr = r, nc = c + (e.shiftKey ? -1 : 1); if (nc >= cols) { nc = 0; nr++; } if (nc < 0) { nc = cols - 1; nr--; } if (nr < 0) return; if (nr >= b.rows.length) { b.rows.push(b.rows[0].map(() => '')); restructure(); } move(nr, nc); }
  if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); syncOne(el); if (r === b.rows.length - 1) { b.rows.push(b.rows[0].map(() => '')); restructure(); } move(r + 1, c); }
}
function emojiPick(anchor, done) {
  const el = pop(anchor, `<div class="emo">${EMOJI.map(e => `<button data-e="${e}">${e}</button>`).join('')}</div><div class="row"><input class="in sm" placeholder="Ou cole um emoji" maxlength="4" style="flex:1"><button class="btn sm" data-ok>OK</button></div>`, { cls: 'emopop' });
  el.onclick = e => { const b = e.target.closest('[data-e]'); if (b) { closePop(); done(b.dataset.e); } if (e.target.closest('[data-ok]')) { const v = el.querySelector('input').value.trim(); if (v) { closePop(); done(v); } } };
}
function blockMenu(b, anchor) {
  const d = ED.doc, i = idxOf(b);
  const types = BTYPES.filter(t => TEXTY.has(t.k));
  menu(anchor, [
    { head: 'Bloco' },
    TEXTY.has(b.type) ? { label: 'Transformar em…', icon: 'sync', act: () => menu(anchor, types.map(t => ({ label: t.n, icon: t.i, on: b.type === t.k, act: () => { b.type = t.k; if (t.k === 'callout') { b.emoji = b.emoji || '💡'; b.bg = b.bg || 'yellow'; } restructure(b.id, 'end'); } }))) } : null,
    { label: 'Cor do texto…', icon: 'palette', act: () => menu(anchor, [{ label: 'Padrão', on: !b.color, act: () => { delete b.color; restructure(); } }, ...BCOL.map(c => ({ label: BCOL_N[c], color: 'var(--tc-' + c + ')', on: b.color === c, act: () => { b.color = c; restructure(); } }))]) },
    { label: 'Cor de fundo…', icon: 'highlight', act: () => menu(anchor, [{ label: 'Nenhuma', on: !b.bg, act: () => { delete b.bg; restructure(); } }, ...BCOL.map(c => ({ label: BCOL_N[c], color: 'var(--bc-' + c + ')', on: b.bg === c, act: () => { b.bg = c; restructure(); } }))]) },
    { label: 'Estilo: normal', on: !b.st, act: () => { delete b.st; restructure(); } },
    { label: 'Estilo: cartão', on: b.st === 'card', act: () => { b.st = 'card'; restructure(); } },
    { label: 'Estilo: foco', on: b.st === 'focus', act: () => { b.st = 'focus'; restructure(); } },
    b.type === 'img' ? { label: 'Tamanho da imagem…', icon: 'img', act: () => menu(anchor, [['s', 'Pequena'], ['m', 'Média'], ['l', 'Grande']].map(([k, n]) => ({ label: n, on: (b.size || 'l') === k, act: () => { b.size = k; restructure(); } }))) } : null,
    b.type === 'table' ? { label: b.head === false ? 'Primeira linha como cabeçalho' : 'Sem linha de cabeçalho', icon: 'table', act: () => { b.head = b.head === false; restructure(); } } : null,
    b.type === 'table' && b.rows.length > 1 ? { label: 'Remover última linha', icon: 'x', act: () => { b.rows.pop(); restructure(); } } : null,
    b.type === 'table' && b.rows[0].length > 1 ? { label: 'Remover última coluna', icon: 'x', act: () => { b.rows.forEach(r => r.pop()); restructure(); } } : null,
    TEXTY.has(b.type) && stripHtml(b.text) ? { label: 'Converter em tarefa', icon: 'todo', act: () => { ED.ctx = { b, off: 0, empty: false }; const title = stripHtml(b.text); const t = taskFromSmart(title, { ln: { d: [d.id], t: [] } }); put('t', t); gcalPushTask(t); Object.assign(b, { type: 'task', ref: t.id, text: '' }); restructure(); toast('Tarefa criada no app', 'Abrir', () => openTask(t.id)); } } : null,
    { sep: 1 },
    { label: 'Mover para cima', icon: 'up', disabled: i === 0, act: () => { d.b.splice(i, 1); d.b.splice(i - 1, 0, b); restructure(); } },
    { label: 'Mover para baixo', icon: 'dl', disabled: i === d.b.length - 1, act: () => { d.b.splice(i, 1); d.b.splice(i + 1, 0, b); restructure(); } },
    { label: 'Duplicar', icon: 'copy', act: () => { const c = clone(b); c.id = uid(); if (c.type === 'task') { const t = get('t', b.ref); if (t) { const n = duplicateTask(t); c.ref = n.id; } } insertAfter(b, c); restructure(); } },
    { label: 'Excluir bloco', icon: 'trash', danger: 1, act: () => { d.b.splice(i, 1); if (!d.b.length) d.b.push({ id: uid(), type: 'p', text: '' }); if (b.file) FILES.remove(b.file); restructure(); } },
  ]);
}

/* ---------- estilo da página ---------- */
function styleMenu(anchor) {
  const d = ED.doc, s = d.style;
  const sec = (title, key, opts, cls) => `<div class="sty"><span class="lab">${title}</span><div class="stys ${cls || ''}">${Object.entries(opts).map(([k, n]) => `<button class="${s[key] === k ? 'on' : ''} ${cls ? cls + '-' + k : ''}" data-k="${key}" data-v="${k}" title="${esc(n)}" aria-label="${esc(n)}">${cls === 'fonts' ? '<b>Aa</b>' : ''}<span>${esc(n)}</span></button>`).join('')}</div></div>`;
  const el = pop(anchor, `<div class="stypop">
    ${sec('Formato', 'page', { web: 'Página contínua', a4: 'Folha A4' })}
    ${s.page === 'a4' ? sec('Margens da folha', 'margin', { s: 'Estreitas', n: 'Normais', l: 'Largas' }) : ''}
    ${sec('Espaçamento entre linhas', 'lh', { '1.3': 'Simples', '1.6': 'Normal', '1.9': 'Amplo', '2.3': 'Duplo' })}
    ${sec('Fundo da página', 'bg', PBG, 'pbgs')}
    ${sec('Textura', 'pat', { none: 'Lisa', dots: 'Pontos', grid: 'Quadriculada', lines: 'Pautada' }, 'pats')}
    ${sec('Fonte', 'font', FONTS, 'fonts')}
    ${sec('Largura', 'width', { narrow: 'Estreita', normal: 'Normal', wide: 'Larga', full: 'Total' })}
    ${sec('Tamanho do texto', 'size', { s: 'Pequeno', m: 'Médio', l: 'Grande' })}
    <div class="sty"><span class="lab">Capa</span><button class="btn ghost sm" data-capa>${ic('cover', 16)}Escolher capa…</button></div>
    <div class="sty"><span class="lab">Cor de destaque</span><div class="colors">${['', ...COLORS].map(c => `<button class="swb${(s.accent || '') === c ? ' on' : ''}" data-acc="${c}" style="--c:${c || 'var(--red)'}" aria-label="${c || 'Padrão'}"></button>`).join('')}</div></div>
  </div>`, { cls: 'stywrap', right: 1 });
  el.onclick = e => {
    const b = e.target.closest('[data-k]'), a = e.target.closest('[data-acc]');
    if (b) { s[b.dataset.k] = b.dataset.v; put('d', d); pushHist(); render(true); styleMenu($('[data-act=dstyle]')); }
    if (a) { s.accent = a.dataset.acc || null; put('d', d); render(true); styleMenu($('[data-act=dstyle]')); }
  };
  el.querySelector('[data-capa]').onclick = () => { closePop(); coverMenu($('[data-act=dstyle]')); };
}

/* ---------- ações ---------- */
Object.assign(ACTS, {
  dnew: () => {
    R.drawer = false;
    let f = R.v === 'docs' && R.id && get('f', R.id) ? R.id : (R.v === 'doc' && ED.doc ? ED.doc.folder || null : null);
    const fols = db.f.filter(x => x.kind === 'd').map(x => [x.id, folderPathName(x)]).sort((a, b) => a[1].localeCompare(b[1]));
    const el = modal(`<h2>${ic('doc', 20)}Novo documento</h2><form class="ndoc"><input class="in" name="t" placeholder="Título (opcional)" maxlength="200" autofocus>
      <p class="mut sm">Salvar em</p><div class="fchips"><button type="button" class="fchip${!f ? ' on' : ''}" data-f="">${ic('doc', 15)}Documentos</button>${fols.map(([id, n]) => `<button type="button" class="fchip${f === id ? ' on' : ''}" data-f="${id}">${ic('folder', 15)}${esc(n)}</button>`).join('')}<button type="button" class="fchip add" data-newf="1">${ic('plus', 15)}Nova pasta</button></div>
      <p class="mut sm">Estilo <span class="mut">(pode trocar depois)</span></p><div class="dsrow"><button type="button" class="dsth none on" data-ds=""><span class="dspg"><b>Aa</b><i class="l1"></i><i class="l2"></i></span><span class="dsn">Padrão</span></button>${DS_FEAT.map(id => dsThumb(dsGet(id))).join('')}<button type="button" class="dsth more" data-dsall><span class="dspg">${ic('palette', 22)}</span><span class="dsn">Ver ${DSTYLES.length}</span></button></div>
      <div class="row end"><button type="button" class="btn ghost" data-x>Cancelar</button><button class="btn red">Criar</button></div></form>`);
    let th = null;
    el.querySelectorAll('.dsrow [data-ds]').forEach(b => { b.type = 'button'; b.onclick = () => { th = b.dataset.ds || null; el.querySelectorAll('.dsrow [data-ds]').forEach(x => x.classList.toggle('on', x === b)); }; });
    el.querySelector('[data-dsall]').onclick = () => { const d = newDoc({ o: Date.now(), folder: f, title: el.querySelector('[name=t]').value.trim() }); closeModal(true); go('doc/' + d.id); setTimeout(() => ACTS.dthemes(), 350); };
    el.querySelector('[data-x]').onclick = closeModal;
    el.querySelectorAll('[data-f]').forEach(b => b.onclick = () => { f = b.dataset.f || null; el.querySelectorAll('[data-f]').forEach(x => x.classList.toggle('on', x === b)); });
    el.querySelector('[data-newf]').onclick = async () => { const t = el.querySelector('[name=t]').value; const n = await ask('Nova pasta de documentos', '', { ph: 'Ex.: Receitas' }); if (!n) { ACTS.dnew(); return; } const nf = { id: uid(), kind: 'd', name: n, par: null, o: Date.now() }; put('f', nf); R.id = null; ACTS.dnew(); const box = $('#modal .ndoc'); if (box) { box.querySelector('[name=t]').value = t; const b = box.querySelector(`[data-f="${nf.id}"]`); b && b.click(); } };
    el.querySelector('form').onsubmit = e => { e.preventDefault(); const d = newDoc({ o: Date.now(), folder: f, title: el.querySelector('[name=t]').value.trim() }); if (th) { d.style.th = th; put('d', d); } closeModal(); go('doc/' + d.id); };
  },
  dfav: () => { const d = ED.doc; d.fav = !d.fav; put('d', d); },
  dstyle: b => styleMenu(b),
  dthemes: () => { const d = ED.doc; if (!d) return; stylePicker(id => { d.style = d.style || {}; if (id) d.style.th = id; else delete d.style.th; put('d', d); render(true); }, d.style && d.style.th); },
  dexport: b => exportMenu(b, { kind: 'doc', id: ED.doc.id }),
  dicon: b => emojiPick(b, e => { ED.doc.icon = e; put('d', ED.doc); }),
  dcover: b => coverMenu(b),
  dpage: () => { const d = ED.doc; d.style.page = d.style.page === 'a4' ? 'web' : 'a4'; put('d', d); render(true); toast(d.style.page === 'a4' ? 'Modo folha A4: as linhas tracejadas mostram onde cada página termina' : 'Modo página contínua'); },
  dtail: () => { const d = ED.doc, last = d.b[d.b.length - 1]; if (last && last.type === 'p' && !stripHtml(last.text)) focusBlock(last.id, 0); else { const nb = { id: uid(), type: 'p', text: '' }; d.b.push(nb); restructure(nb.id, 0); } },
  dlinktask: () => pickItem('t', [], id => { const t = get('t', id); t.ln = t.ln || { d: [], t: [] }; if (!t.ln.d.includes(ED.doc.id)) t.ln.d.push(ED.doc.id); put('t', t); toast('Tarefa vinculada'); }),
  dlinked: () => { const f = $('.pfoot'); if (f) f.scrollIntoView({ behavior: 'smooth' }); },
  dimport: () => { const i = document.createElement('input'); i.type = 'file'; i.accept = '.md,.markdown,.txt,text/plain,text/markdown'; i.onchange = async () => { const f = i.files[0]; if (!f) return; const txt = await f.text(); const d = newDoc(Object.assign(mdToDoc(txt), { title: f.name.replace(/\.(md|markdown|txt)$/i, '') })); go('doc/' + d.id); toast('Documento importado'); }; i.click(); },
  dmenu: b => {
    const d = ED.doc;
    menu(b, [
      { label: 'Nova subpágina', icon: 'page', act: () => { const k = newDoc({ par: d.id, o: Date.now() }); d.b.push({ id: uid(), type: 'page', ref: k.id }); put('d', d); go('doc/' + k.id); } },
      { label: 'Mover para…', icon: 'folder', act: () => menu(b, [{ label: 'Raiz (sem pai)', on: !d.par, act: () => { d.par = null; put('d', d); } }, ...db.d.filter(x => !x.del && x.id !== d.id && !docPath(x).some(p => p.id === d.id)).map(x => ({ label: (x.icon || '') + ' ' + (x.title || 'Sem título'), on: d.par === x.id, act: () => { d.par = x.id; put('d', d); } }))]) },
      { label: 'Duplicar', icon: 'copy', act: () => { const c = clone(d); c.id = uid(); c.title = (d.title || 'Sem título') + ' (cópia)'; c.c = Date.now(); c.b.forEach(x => x.id = uid()); put('d', c); go('doc/' + c.id); } },
      { label: 'Vincular a uma tarefa', icon: 'link', act: ACTS.dlinktask },
      { label: 'Criar tarefa vinculada', icon: 'todo', act: () => { const t = newTask({ title: 'Revisar ' + (d.title || 'documento'), ln: { d: [d.id], t: [] } }); put('t', t); openTask(t.id); } },
      { label: 'Imprimir / PDF', icon: 'file', act: () => exportDoc(d, 'pdf') },
      { sep: 1 },
      { label: 'Mover para a Lixeira', icon: 'trash', danger: 1, act: () => { d.del = Date.now(); put('d', d); docKids(d.id).forEach(k => { k.par = d.par; put('d', k, { silent: true }); }); changed(); go('docs'); toast('Documento na Lixeira', 'Desfazer', () => { d.del = null; put('d', d); }); } },
    ], { right: 1 });
  },
});
const _ctx2 = ctxMenu;
ctxMenu = function (spec, anchor, at) {
  if (spec.startsWith('doc:')) {
    const d = get('d', spec.slice(4)); if (!d) return;
    menu(anchor, [
      { label: d.fav ? 'Remover dos favoritos' : 'Favoritar', icon: 'star', act: () => { d.fav = !d.fav; put('d', d); } },
      { label: 'Exportar…', icon: 'export', act: () => exportMenu(anchor, { kind: 'doc', id: d.id }) },
      { label: 'Mover para a Lixeira', icon: 'trash', danger: 1, act: () => { d.del = Date.now(); put('d', d); } },
    ], { at });
    return;
  }
  _ctx2(spec, anchor, at);
};
/* arrastar blocos e documentos */
DROPS.push((src, dst, before) => {
  if (src.startsWith('blk:') && dst.startsWith('blk:')) {
    const d = ED.doc; if (!d) return true;
    const b = d.b.find(x => x.id === src.slice(4)); if (!b) return true;
    const i = d.b.indexOf(b);
    /* leva junto os blocos recuados abaixo (filhos) */
    let n = 1; while (d.b[i + n] && (d.b[i + n].lvl || 0) > (b.lvl || 0)) n++;
    const chunk = d.b.splice(i, n);
    let to = d.b.findIndex(x => x.id === dst.slice(4)); if (to < 0) { d.b.splice(i, 0, ...chunk); return true; }
    if (!before) { to++; while (d.b[to] && (d.b[to].lvl || 0) > (d.b[to - 1].lvl || 0) && d.b[to - 1].type === 'toggle') to++; }
    d.b.splice(to, 0, ...chunk);
    restructure();
    return true;
  }
  if (src.startsWith('dd:') && dst.startsWith('dfold:')) {
    const d = get('d', src.slice(3)), f = dst.slice(6) || null; if (!d) return true;
    d.folder = f; d.par = null; put('d', d); toast(f ? 'Guardado em ' + get('f', f).name : 'Movido para Documentos'); return true;
  }
  if (src.startsWith('dd:') && dst.startsWith('dtree:')) {
    const d = get('d', src.slice(3)), p = dst.slice(6);
    if (!d || d.id === p) return true;
    const pd_ = p ? get('d', p) : null;
    if (pd_ && docPath(pd_).some(x => x.id === d.id)) { toast('Não é possível mover um documento para dentro de uma subpágina dele'); return true; }
    d.par = p || null; put('d', d); toast(p ? 'Agora é subpágina de ' + (pd_.title || 'Sem título') : 'Movido para a raiz');
    return true;
  }
});
/* Markdown → blocos (importação) */
function mdToDoc(md) {
  const b = [];
  let code = null, title = '';
  const inline = s => esc(s).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>').replace(/(^|[^*])\*(?!\s)(.+?)\*/g, '$1<i>$2</i>').replace(/`([^`]+)`/g, '<code>$1</code>').replace(/\[([^\]]+)\]\((https?:[^)]+)\)/g, '<a href="$2">$1</a>').replace(/~~(.+?)~~/g, '<s>$1</s>');
  md.split(/\r?\n/).forEach(line => {
    if (code) { if (/^```/.test(line)) { b.push({ id: uid(), type: 'code', text: esc(code.join('\n')).replace(/\n/g, '<br>') }); code = null; } else code.push(line); return; }
    if (/^```/.test(line)) { code = []; return; }
    const lvl = Math.floor((line.match(/^(\s*)/)[1].replace(/\t/g, '  ').length) / 2);
    const l = line.trim();
    let m;
    if (!l) return;
    if ((m = l.match(/^(#{1,3})\s+(.*)/))) { if (m[1].length === 1 && !title && !b.length) { title = m[2]; return; } b.push({ id: uid(), type: 'h' + m[1].length, text: inline(m[2]) }); }
    else if ((m = l.match(/^[-*+]\s+\[( |x)\]\s+(.*)/i))) b.push({ id: uid(), type: 'todo', checked: m[1].toLowerCase() === 'x', text: inline(m[2]), lvl });
    else if ((m = l.match(/^[-*+•]\s+(.*)/))) b.push({ id: uid(), type: 'ul', text: inline(m[1]), lvl });
    else if ((m = l.match(/^\d+[.)]\s+(.*)/))) b.push({ id: uid(), type: 'ol', text: inline(m[1]), lvl });
    else if ((m = l.match(/^>\s?(.*)/))) b.push({ id: uid(), type: 'quote', text: inline(m[1]) });
    else if (/^(-{3,}|\*{3,}|_{3,})$/.test(l)) b.push({ id: uid(), type: 'hr', text: '' });
    else if (/^\|.*\|$/.test(l)) { if (/^\|[\s:|-]+\|$/.test(l)) return; const cells = l.slice(1, -1).split('|').map(c => inline(c.trim())); const last = b[b.length - 1]; if (last && last.type === 'table' && last._open) last.rows.push(cells); else b.push({ id: uid(), type: 'table', rows: [cells], head: true, _open: true }); }
    else b.push({ id: uid(), type: 'p', text: inline(l) });
  });
  b.forEach(x => delete x._open);
  return { title, b: b.length ? b : [{ id: uid(), type: 'p', text: '' }] };
}
