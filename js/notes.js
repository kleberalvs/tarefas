/* Notas rápidas, no estilo Google Keep: cartões em grade com prévia, cores, fundos, imagens, áudios, listas e etiquetas. */
'use strict';
const NOTE_COLORS = [
  ['', 'Padrão', '', ''], ['coral', 'Coral', '#FAAFA8', '#77172E'], ['pessego', 'Pêssego', '#F39F76', '#692B17'], ['areia', 'Areia', '#FFF8B8', '#7C4A03'],
  ['menta', 'Menta', '#E2F6D3', '#264D3B'], ['salvia', 'Sálvia', '#B4DDD3', '#0C625D'], ['nevoa', 'Névoa', '#D4E4ED', '#256377'], ['tempestade', 'Tempestade', '#AECCDC', '#284255'],
  ['lavanda', 'Lavanda', '#D3BFDB', '#472E5B'], ['flor', 'Flor', '#F6E2DD', '#6C394F'], ['argila', 'Argila', '#E9E3D4', '#4B443A'], ['giz', 'Giz', '#EFEFF1', '#232427'],
];
const svgBg = (emo, sz = 64, op = .22) => `url('data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="${sz}" height="${sz}"><text x="${sz * .12}" y="${sz * .42}" font-size="${sz * .3}" opacity="${op}">${emo}</text><text x="${sz * .58}" y="${sz * .9}" font-size="${sz * .22}" opacity="${op * .8}">${emo}</text></svg>`).replace(/'/g, '%27').replace(/\(/g, '%28').replace(/\)/g, '%29')}')`;
const svgU = (inner, w, h, extra = '') => `url('data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" ${extra}>${inner}</svg>`).replace(/'/g, '%27').replace(/\(/g, '%28').replace(/\)/g, '%29')}')`;
const NOTE_BGS2 = [
  ['listras', 'Listras', 'repeating-linear-gradient(45deg,rgba(0,0,0,.055) 0 9px,transparent 9px 18px)'],
  ['xadrez', 'Xadrez', 'linear-gradient(90deg,rgba(230,90,90,.10) 50%,transparent 50%) 0 0/26px 26px,linear-gradient(rgba(230,90,90,.10) 50%,transparent 50%) 0 0/26px 26px'],
  ['ondas', 'Ondas', svgU('<path d="M0 20 Q15 8 30 20 T60 20" fill="none" stroke="rgba(60,110,180,.18)" stroke-width="2"/>', 60, 28) + ' 0 0/60px 28px'],
  ['montanhas', 'Montanhas', svgU('<path d="M0 120 L60 50 L95 85 L150 20 L220 95 L260 60 L320 120Z" fill="rgba(70,110,150,.16)"/><path d="M0 120 L40 90 L110 110 L170 70 L240 105 L320 85 L320 120Z" fill="rgba(70,110,150,.12)"/>', 320, 120, 'preserveAspectRatio="none"') + ' bottom/100% 90px no-repeat'],
  ['colinas', 'Colinas', svgU('<path d="M0 90 C60 40 120 40 180 80 S280 50 320 70 L320 120 L0 120Z" fill="rgba(90,170,110,.18)"/><path d="M0 100 C80 70 160 110 240 85 S310 95 320 92 L320 120 L0 120Z" fill="rgba(90,170,110,.14)"/>', 320, 120, 'preserveAspectRatio="none"') + ' bottom/100% 90px no-repeat'],
  ['bolhas', 'Bolhas', svgU('<circle cx="14" cy="16" r="9" fill="rgba(240,120,150,.16)"/><circle cx="52" cy="40" r="13" fill="rgba(90,160,230,.14)"/><circle cx="30" cy="62" r="6" fill="rgba(250,190,70,.2)"/>', 72, 76)],
  ['confete', 'Confete', svgU('<rect x="8" y="10" width="7" height="3" rx="1.5" transform="rotate(30 11 11)" fill="rgba(240,90,110,.35)"/><rect x="40" y="20" width="7" height="3" rx="1.5" transform="rotate(-25 43 21)" fill="rgba(60,150,230,.35)"/><rect x="22" y="42" width="7" height="3" rx="1.5" transform="rotate(60 25 43)" fill="rgba(250,180,40,.4)"/><circle cx="54" cy="50" r="2" fill="rgba(120,200,120,.45)"/><circle cx="12" cy="56" r="1.8" fill="rgba(170,110,220,.45)"/>', 64, 64)],
  ['terrazo', 'Granilite', svgU('<path d="M8 9l6-2 2 5-5 3z" fill="rgba(230,120,90,.28)"/><path d="M40 14l7 1-2 6-6-2z" fill="rgba(90,150,200,.25)"/><path d="M25 38l5-4 4 4-4 5z" fill="rgba(240,190,80,.3)"/><path d="M52 46l6 2-3 5-5-2z" fill="rgba(120,180,130,.28)"/><circle cx="16" cy="54" r="2.4" fill="rgba(60,60,60,.18)"/><circle cx="58" cy="28" r="1.8" fill="rgba(60,60,60,.18)"/>', 68, 66)],
  ['geometrico', 'Geométrico', svgU('<path d="M0 0L20 34L40 0Z" fill="rgba(110,90,200,.07)"/><path d="M20 34L40 0L60 34Z" fill="rgba(110,90,200,.12)"/>', 40, 34)],
  ['kraft', 'Papel kraft', svgU('<filter id="n"><feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="2" stitchTiles="stitch"/><feColorMatrix values="0 0 0 0 .45 0 0 0 0 .32 0 0 0 0 .2 0 0 0 .22 0"/></filter><rect width="160" height="160" filter="url(#n)"/>', 160, 160) + ',linear-gradient(rgba(214,180,130,.35),rgba(200,160,110,.35))'],
  ['linho', 'Linho', svgU('<filter id="n"><feTurbulence type="fractalNoise" baseFrequency=".6 .02" numOctaves="2"/><feColorMatrix values="0 0 0 0 .3 0 0 0 0 .3 0 0 0 0 .3 0 0 0 .14 0"/></filter><rect width="160" height="160" filter="url(#n)"/>', 160, 160)],
  ['aquarela', 'Aquarela', 'radial-gradient(60% 50% at 15% 20%,rgba(255,150,170,.35),transparent 70%),radial-gradient(50% 50% at 85% 30%,rgba(140,190,255,.35),transparent 70%),radial-gradient(60% 60% at 50% 100%,rgba(255,220,120,.35),transparent 70%)'],
  ['malha', 'Degradê suave', 'radial-gradient(80% 80% at 0% 0%,rgba(255,170,120,.30),transparent 60%),radial-gradient(80% 80% at 100% 0%,rgba(200,120,255,.25),transparent 60%),radial-gradient(90% 90% at 50% 120%,rgba(90,200,200,.30),transparent 60%)'],
  ['arcoiris', 'Arco-íris', 'linear-gradient(120deg,rgba(255,120,120,.18),rgba(255,200,90,.18),rgba(120,220,140,.18),rgba(110,170,255,.18),rgba(190,130,255,.18))'],
  ['lua', 'Noite', 'radial-gradient(1.4px 1.4px at 20% 30%,rgba(255,255,255,.9),transparent),radial-gradient(1.2px 1.2px at 70% 20%,rgba(255,255,255,.8),transparent),radial-gradient(1.6px 1.6px at 45% 70%,rgba(255,255,255,.85),transparent),radial-gradient(1px 1px at 85% 65%,rgba(255,255,255,.8),transparent),linear-gradient(160deg,rgba(30,40,90,.55),rgba(80,40,120,.45))'],
  ['nuvens', 'Nuvens', svgBg('☁️', 80, .3)], ['gatinhos', 'Gatinhos', svgBg('🐱')], ['frutas', 'Frutas', svgBg('🍋')], ['plantas', 'Plantas', svgBg('🪴')],
  ['praia', 'Praia', svgBg('🐚')], ['livros', 'Livros', svgBg('📚')], ['viagem', 'Viagem', svgBg('✈️')], ['festa', 'Festa', svgBg('🎉')], ['luas', 'Luas', svgBg('🌙')], ['arcos', 'Arco', svgBg('🌈')],
];
const NOTE_BGS = [
  ['', 'Nenhum', ''],
  ['pontos', 'Pontinhos', 'radial-gradient(rgba(0,0,0,.13) 1.2px, transparent 1.4px) 0 0/14px 14px'],
  ['grade', 'Quadriculado', 'linear-gradient(rgba(0,0,0,.07) 1px, transparent 1px) 0 0/18px 18px, linear-gradient(90deg, rgba(0,0,0,.07) 1px, transparent 1px) 0 0/18px 18px'],
  ['pautado', 'Pautado', 'linear-gradient(transparent 23px, rgba(70,110,200,.22) 24px) 0 6px/100% 24px'],
  ['por-do-sol', 'Pôr do sol', 'linear-gradient(170deg, transparent 45%, rgba(255,160,90,.35) 75%, rgba(240,90,120,.4))'],
  ['oceano', 'Oceano', 'linear-gradient(170deg, transparent 45%, rgba(80,170,220,.32) 75%, rgba(40,110,190,.38))'],
  ['aurora', 'Aurora', 'linear-gradient(160deg, rgba(120,220,170,.28), transparent 50%, rgba(160,120,230,.3))'],
  ['patinhas', 'Patinhas', svgBg('🐾')], ['coracoes', 'Corações', svgBg('💗')], ['estrelas', 'Estrelas', svgBg('⭐')],
  ['folhas', 'Folhas', svgBg('🌿')], ['flores', 'Flores', svgBg('🌸')], ['cafe', 'Café', svgBg('☕')], ['musica', 'Música', svgBg('🎵')],
  ...NOTE_BGS2,
];
const NOTE_FONTS = [['', 'Padrão', 'inherit'], ['serif', 'Clássica', "Georgia,'Times New Roman',serif"], ['mono', 'Máquina', "ui-monospace,Menlo,Consolas,monospace"], ['mao', 'À mão', "'Caveat','Segoe Print','Bradley Hand',cursive"]];
let NF = { tab: 'notas', q: '', tag: '' };
const NOTE_URL = new Map();
const noteLive = n => !n.del;
function noteStyle(n) {
  const dark = document.documentElement.dataset.theme === 'dark';
  const col = NOTE_COLORS.find(c => c[0] === (n.color || '')) || NOTE_COLORS[0];
  const bg = NOTE_BGS.find(b => b[0] === (n.bg || ''));
  const font = NOTE_FONTS.find(f => f[0] === (n.font || ''));
  let s = '';
  if (col[0]) s += `--nc:${dark ? col[3] : col[2]};`;
  if (bg && bg[2]) s += `--nbg:${bg[2]};`;
  if (font && font[0]) s += `--nf:${font[2]};`;
  return s;
}
function noteText(n) { return [n.title, n.body, ...(n.items || []).map(i => i.t), ...(n.tags || [])].join(' ').toLowerCase(); }
function fmtAud(s) { s = Math.round(s || 0); return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); }
function noteCard(n) {
  const imgs = (n.img || []).slice(0, 4), items = n.items || [], open = items.filter(i => !i.done), done = items.length - open.length;
  return `<article class="ncard${n.color ? ' tint' : ''}${n.bg ? ' patt' : ''}${n.bgImg ? ' bgimg' : ''}${n.big ? ' big' : ''}" style="${noteStyle(n)}" data-nid="${n.id}" tabindex="0">
    ${n.bgImg ? `<img class="nbgi" data-nimg="${n.bgImg.id}" data-n="${n.id}" data-bg="1" alt="">` : ''}
    ${imgs.length ? `<div class="nimgs n${imgs.length}">${imgs.map(m => `<img data-nimg="${m.id}" data-n="${n.id}" alt="">`).join('')}</div>` : ''}
    <div class="nin">
      ${n.title ? `<h3>${esc(n.title)}</h3>` : ''}
      ${n.list ? `<ul class="nchk">${open.slice(0, 8).map(i => `<li><span class="nbox"></span>${esc(i.t)}</li>`).join('')}${open.length > 8 ? `<li class="mut">…</li>` : ''}${done ? `<li class="mut sm">+ ${done} ${done === 1 ? 'item marcado' : 'itens marcados'}</li>` : ''}</ul>` : n.body ? `<p class="nbody">${esc(n.body)}</p>` : ''}
      ${!n.title && !n.body && !items.length && !imgs.length && !(n.aud || []).length ? '<p class="mut">Nota vazia</p>' : ''}
      ${(n.aud || []).length ? `<div class="nauds">${n.aud.map(a => `<span class="naud">${ic('mic', 14)}${fmtAud(a.dur)}</span>`).join('')}</div>` : ''}
      ${(n.tags || []).length ? `<div class="ntags">${n.tags.map(t => `<span>${esc(t)}</span>`).join('')}</div>` : ''}
    </div>
    <button class="npin${n.pin ? ' on' : ''}" data-act="npin" data-id="${n.id}" title="${n.pin ? 'Desafixar' : 'Fixar'}" aria-label="Fixar">${ic('pin', 18)}</button>
    <div class="nbar">
      <button class="ib" data-act="npal" data-id="${n.id}" title="Cores e fundo" aria-label="Cores e fundo">${ic('palette', 17)}</button>
      <button class="ib" data-act="nimgadd" data-id="${n.id}" title="Adicionar imagem" aria-label="Adicionar imagem">${ic('img', 17)}</button>
      <button class="ib" data-act="narch" data-id="${n.id}" title="${n.arch ? 'Desarquivar' : 'Arquivar'}" aria-label="Arquivar">${ic('archive', 17)}</button>
      <button class="ib" data-act="nmore" data-id="${n.id}" title="Mais" aria-label="Mais opções">${ic('more', 17)}</button>
    </div>
  </article>`;
}
async function loadNoteImgs(root, note) {
  root.querySelectorAll('img[data-nimg]').forEach(async img => {
    const n = note || get('n', img.dataset.n); if (!n) return;
    const m = img.dataset.bg ? n.bgImg : (n.img || []).find(x => x.id === img.dataset.nimg); if (!m) return;
    try { if (!NOTE_URL.has(m.id)) NOTE_URL.set(m.id, await FILES.url(m)); img.src = NOTE_URL.get(m.id); } catch (e) { img.classList.add('noimg'); }
  });
}
VIEWS.notes = main => {
  const all = db.n.filter(n => NF.tab === 'lixeira' ? n.del : !n.del && (NF.tab === 'arquivo' ? n.arch : !n.arch));
  const q = NF.q.trim().toLowerCase();
  const list = all.filter(n => (!q || noteText(n).includes(q)) && (!NF.tag || (n.tags || []).includes(NF.tag))).sort((a, b) => (b.o || b.c || 0) - (a.o || a.c || 0));
  const tags = [...new Set(db.n.filter(noteLive).flatMap(n => n.tags || []))].sort();
  const pinned = list.filter(n => n.pin && NF.tab === 'notas'), rest = list.filter(n => !(n.pin && NF.tab === 'notas'));
  main.innerHTML = headHtml('Notas rápidas', '', `<button class="btn red sm" data-act="qnote">${ic('plus', 16)}<span>Nota</span></button>`) + `<div class="scroll"><div class="notes">
    <div class="ntop">
      <label class="nsearch">${ic('search', 17)}<input class="in" id="nq" placeholder="Pesquisar notas" value="${esc(NF.q)}"></label>
      <div class="seg">${[['notas', 'Notas'], ['arquivo', 'Arquivo'], ['lixeira', 'Lixeira']].map(([k, n]) => `<button class="${NF.tab === k ? 'on' : ''}" data-act="ntab" data-k="${k}">${n}</button>`).join('')}</div>
    </div>
    ${tags.length ? `<div class="ntagbar"><button class="${!NF.tag ? 'on' : ''}" data-act="ntag" data-k="">Todas</button>${tags.map(t => `<button class="${NF.tag === t ? 'on' : ''}" data-act="ntag" data-k="${esc(t)}">${ic('tag', 13)}${esc(t)}</button>`).join('')}</div>` : ''}
    ${NF.tab === 'notas' ? `<div class="ntake"><button class="ntake-t" data-act="qnote">Criar uma nota…</button><button class="ib" data-act="qnote" data-list="1" title="Nova lista" aria-label="Nova lista">${ic('done', 19)}</button><button class="ib" data-act="qnote" data-img="1" title="Nova nota com imagem" aria-label="Nova nota com imagem">${ic('img', 19)}</button><button class="ib" data-act="qnote" data-draw="1" title="Escrever à mão" aria-label="Escrever à mão">${ic('pen', 19)}</button><button class="ib" data-act="qnote" data-rec="1" title="Nova nota de voz" aria-label="Nova nota de voz">${ic('mic', 19)}</button></div>` : ''}
    ${NF.tab === 'lixeira' && list.length ? `<div class="row end"><button class="btn ghost sm" data-act="nempty">Esvaziar lixeira</button></div>` : ''}
    ${pinned.length ? `<h4 class="nsec">Fixadas</h4><div class="ngrid">${pinned.map(noteCard).join('')}</div>${rest.length ? '<h4 class="nsec">Outras</h4>' : ''}` : ''}
    <div class="ngrid">${rest.map(noteCard).join('')}</div>
    ${!list.length ? `<div class="nempty">${ic('note', 64)}<p>${q || NF.tag ? 'Nenhuma nota encontrada.' : NF.tab === 'arquivo' ? 'As notas arquivadas aparecem aqui.' : NF.tab === 'lixeira' ? 'A lixeira está vazia.' : 'As notas que você criar aparecem aqui.'}</p></div>` : ''}
  </div></div>`;
  const inp = main.querySelector('#nq');
  inp.oninput = debounce(() => { NF.q = inp.value; const pos = inp.selectionStart; render(); const i2 = $('#nq'); if (i2) { i2.focus(); i2.setSelectionRange(pos, pos); } }, 200);
  main.querySelectorAll('.ncard').forEach(c => c.addEventListener('click', e => { if (e.target.closest('button')) return; openNote(c.dataset.nid); }));
  main.querySelectorAll('.ncard').forEach(c => c.addEventListener('keydown', e => { if (e.key === 'Enter') openNote(c.dataset.nid); }));
  loadNoteImgs(main);
};
function newNote(o = {}) { const now = Date.now(); return Object.assign({ id: uid(), title: '', body: '', c: now, o: now, img: [], aud: [], tags: [] }, o); }
function noteEmpty(n) { return !n.title && !n.body && !(n.items || []).some(i => i.t) && !(n.img || []).length && !(n.aud || []).length; }
/* ---------- editor ---------- */
let NE = null;
function openNote(id, opts = {}) {
  const n = id ? cloneP(get('n', id)) : newNote(opts.list ? { list: true, items: [] } : {});
  if (!n) return;
  NE = { n, isNew: !id };
  drawNoteEditor();
  if (opts.img) setTimeout(() => ACTS.nimgadd(null, null, true), 60);
  if (opts.rec) setTimeout(() => startRec(), 120);
  if (opts.draw) setTimeout(() => NE_ACT.draw(), 120);
}
const saveNote = debounce(() => { if (!NE) return; const n = NE.n; if (NE.isNew && noteEmpty(n)) return; NE.isNew = false; n.o = n.o || Date.now(); put('n', n); }, 400);
function noteChanged() { saveNote(); }
function drawNoteEditor() {
  const n = NE.n, items = n.items || [];
  const itemRow = (i, k) => `<div class="nitem${i.done ? ' done' : ''}" data-k="${k}"><input type="checkbox" ${i.done ? 'checked' : ''} data-nck="${k}" aria-label="Marcar"><input class="nit" value="${esc(i.t)}" data-nit="${k}" placeholder="Item"><button class="ib xs" data-nrm="${k}" aria-label="Remover item">${ic('x', 15)}</button></div>`;
  const el = modal(`<div class="nedit ncard${n.color ? ' tint' : ''}${n.bg ? ' patt' : ''}${n.bgImg ? ' bgimg' : ''}${n.big ? ' big' : ''}" style="${noteStyle(n)}">
    ${n.bgImg ? `<img class="nbgi" data-nimg="${n.bgImg.id}" data-n="${n.id}" data-bg="1" alt="">` : ''}
    <div class="neimgs">${(n.img || []).map(m => `<div class="neimg"><img data-nimg="${m.id}" data-n="${n.id}" data-lbi="${m.id}" alt=""><button class="ib xs" data-nimgrm="${m.id}" aria-label="Remover imagem">${ic('trash', 15)}</button></div>`).join('')}</div>
    <div class="nin">
      <div class="nehead"><input class="ntitle" id="ne_t" placeholder="Título" value="${esc(n.title || '')}" maxlength="200"><button class="npin${n.pin ? ' on' : ''}" data-ne="pin" aria-label="Fixar">${ic('pin', 19)}</button><button class="npin nclose" data-ne="close" aria-label="Fechar a nota" title="Fechar">${ic('x', 20)}</button></div>
      ${n.list ? `<div class="nitems">${items.map((i, k) => i.done ? '' : itemRow(i, k)).join('')}<div class="nitem add">${ic('plus', 16)}<input class="nit" id="ne_add" placeholder="Item da lista"></div>${items.some(i => i.done) ? `<p class="mut sm nmk">${items.filter(i => i.done).length} marcado(s)</p>${items.map((i, k) => i.done ? itemRow(i, k) : '').join('')}` : ''}</div>`
        : `<textarea class="nbodyin" id="ne_b" placeholder="Criar uma nota…" rows="3">${esc(n.body || '')}</textarea>`}
      <div class="neauds">${(n.aud || []).map(a => `<div class="neaud"><audio controls preload="none" data-naud="${a.id}"></audio><span class="mut sm">${esc(a.name || 'Áudio')}</span><button class="ib xs" data-naudrm="${a.id}" aria-label="Remover áudio">${ic('trash', 15)}</button></div>`).join('')}</div>
      <div id="ne_rec"></div>
      ${(n.tags || []).length ? `<div class="ntags">${n.tags.map(t => `<span>${esc(t)}<button data-ntagrm="${esc(t)}" aria-label="Remover etiqueta">×</button></span>`).join('')}</div>` : ''}
      ${n.u ? `<p class="nedited">Editada ${new Date(n.u).toLocaleString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</p>` : ''}
    </div>
    <div class="nefoot">
      <button class="ib" data-pop data-ne="pal" title="Cores, fundo e letra" aria-label="Cores, fundo e letra">${ic('palette', 18)}</button>
      <button class="ib" data-pop data-ne="img" title="Adicionar imagem" aria-label="Adicionar imagem">${ic('img', 18)}</button>
      <button class="ib aib" data-pop data-ne="ai" title="Escrever com IA" aria-label="Escrever com IA">${ic('spark', 18)}</button>
      <button class="ib" data-pop data-ne="draw" title="Escrever à mão" aria-label="Escrever à mão">${ic('pen', 18)}</button>
      <button class="ib" data-pop data-ne="aud" title="Áudio" aria-label="Áudio">${ic('mic', 18)}</button>
      <button class="ib" data-pop data-ne="list" title="${n.list ? 'Ocultar caixas de seleção' : 'Mostrar caixas de seleção'}" aria-label="Lista">${ic('done', 18)}</button>
      <button class="ib" data-pop data-ne="tag" title="Etiquetas" aria-label="Etiquetas">${ic('tag', 18)}</button>
      <button class="ib" data-pop data-ne="arch" title="${n.arch ? 'Desarquivar' : 'Arquivar'}" aria-label="Arquivar">${ic('archive', 18)}</button>
      <button class="ib" data-pop data-ne="more" title="Mais" aria-label="Mais">${ic('more', 18)}</button>

    </div>
  </div>`, { cls: 'nmodal' });
  const box = el;
  const t = box.querySelector('#ne_t'); t.oninput = () => { n.title = t.value; noteChanged(); };
  const b = box.querySelector('#ne_b');
  if (b) b.addEventListener('input', e => { const p = b.selectionStart; if (b.value[p - 1] === '/' && (p === 1 || b.value[p - 2] === '\n')) { b.value = b.value.slice(0, p - 1) + b.value.slice(p); b.setSelectionRange(p - 1, p - 1); n.body = b.value; noteChanged(); menu(b, [{ head: 'Escrever com IA' }, ...AI_ACTS.filter(a => !a.need || (n.body || '').trim()).map(a => ({ label: a.e + '  ' + a.n, act: () => NE_ACT.ai(null, null, a.k) }))]); } });
  if (b) { bulletArea(b); const fit = () => { b.style.height = 'auto'; b.style.height = Math.min(innerHeight * .55, b.scrollHeight + 2) + 'px'; }; fit(); b.oninput = () => { n.body = b.value; fit(); noteChanged(); }; if (NE.isNew && !isMobile()) setTimeout(() => b.focus(), 50); }
  box.querySelectorAll('[data-nit]').forEach(i => { i.oninput = () => { n.items[+i.dataset.nit].t = i.value; noteChanged(); }; i.onkeydown = e => { if (e.key === 'Enter') { e.preventDefault(); n.items.splice(+i.dataset.nit + 1, 0, { id: uid(), t: '', done: false }); noteChanged(); drawNoteEditor(); const nx = $('#modal [data-nit="' + (+i.dataset.nit + 1) + '"]'); nx && nx.focus(); } }; });
  box.querySelectorAll('[data-nck]').forEach(c => c.onchange = () => { n.items[+c.dataset.nck].done = c.checked; noteChanged(); drawNoteEditor(); });
  box.querySelectorAll('[data-nrm]').forEach(c => c.onclick = () => { n.items.splice(+c.dataset.nrm, 1); noteChanged(); drawNoteEditor(); });
  const add = box.querySelector('#ne_add');
  if (add) { add.oninput = () => { if (!add.value) return; n.items.push({ id: uid(), t: add.value, done: false }); noteChanged(); drawNoteEditor(); const k = n.items.length - 1, nx = $('#modal [data-nit="' + k + '"]'); if (nx) { nx.focus(); nx.setSelectionRange(nx.value.length, nx.value.length); } }; if (NE.isNew && !items.length && !isMobile()) setTimeout(() => add.focus(), 50); }
  box.querySelectorAll('[data-nimgrm]').forEach(x => x.onclick = () => { const m = n.img.find(q => q.id === x.dataset.nimgrm); n.img = n.img.filter(q => q !== m); if (m) FILES.remove(m); noteChanged(); drawNoteEditor(); });
  box.querySelectorAll('[data-naudrm]').forEach(x => x.onclick = () => { const m = n.aud.find(q => q.id === x.dataset.naudrm); n.aud = n.aud.filter(q => q !== m); if (m) FILES.remove(m); noteChanged(); drawNoteEditor(); });
  box.querySelectorAll('[data-ntagrm]').forEach(x => x.onclick = () => { n.tags = n.tags.filter(q => q !== x.dataset.ntagrm); noteChanged(); drawNoteEditor(); });
  box.querySelectorAll('audio[data-naud]').forEach(async a => { const m = n.aud.find(q => q.id === a.dataset.naud); try { if (!NOTE_URL.has(m.id)) NOTE_URL.set(m.id, await FILES.url(m)); a.src = NOTE_URL.get(m.id); } catch (e) { a.replaceWith(Object.assign(document.createElement('span'), { className: 'mut sm', textContent: 'Áudio indisponível neste aparelho' })); } });
  box.querySelectorAll('[data-ne]').forEach(x => x.onclick = e => NE_ACT[x.dataset.ne](x, e));
  box.querySelectorAll('[data-lbi]').forEach(x => x.onclick = () => lightbox(n.img, n.img.findIndex(q => q.id === x.dataset.lbi)));
  loadNoteImgs(box, n);
}
function closeNote() {
  if (REC.mr) stopRec();
  if (NE) { const n = NE.n; if (!noteEmpty(n) && !NE.isNew) put('n', n); else if (NE.isNew && !noteEmpty(n)) put('n', n); NE = null; }
  closeModal(); if (R.v === 'notes') render();
}
const NE_ACT = {
  close: () => closeNote(),
  pin: () => { NE.n.pin = !NE.n.pin; noteChanged(); drawNoteEditor(); },
  arch: () => { NE.n.arch = !NE.n.arch; NE.n.pin = false; put('n', NE.n); NE.isNew = false; toast(NE.n.arch ? 'Nota arquivada' : 'Nota desarquivada'); closeNote(); },
  list: () => { const n = NE.n; if (n.list) { n.body = (n.items || []).map(i => i.t).filter(Boolean).join('\n'); n.list = false; n.items = []; } else { n.items = (n.body || '').split('\n').filter(s => s.trim()).map(t => ({ id: uid(), t, done: false })); n.list = true; n.body = ''; } noteChanged(); drawNoteEditor(); },
  ai: (x, e, act) => {
    const n = NE.n, ta = $('#ne_b');
    const sel = ta && ta.selectionStart !== ta.selectionEnd ? ta.value.slice(ta.selectionStart, ta.selectionEnd) : '';
    const body = n.list ? (n.items || []).map(i => '- ' + i.t).join('\n') : n.body || '';
    const put2 = (txt, rep) => { const p = aiPlain(txt); if (n.list) { const its = p.split('\n').map(s => s.replace(/^•\s*/, '').trim()).filter(Boolean).map(t => ({ id: uid(), t, done: false })); n.items = rep ? its : [...(n.items || []), ...its]; } else if (rep) { if (sel && ta) n.body = ta.value.slice(0, ta.selectionStart) + p + ta.value.slice(ta.selectionEnd); else n.body = p; } else { const pos = ta ? ta.selectionEnd : (n.body || '').length; n.body = (n.body || '').slice(0, pos) + ((n.body || '').slice(0, pos).trim() ? '\n' : '') + p + (n.body || '').slice(pos); } if (!n.title && act === 'title') { n.title = p.split('\n')[0]; } noteChanged(); drawNoteEditor(); };
    aiPanel({ text: sel || body, all: [n.title, body].filter(Boolean).join('\n'), insert: t => { if (act === 'title' || (!n.title && /^[^\n]{1,80}$/.test(t.trim()) && false)) { n.title = aiPlain(t); noteChanged(); drawNoteEditor(); } else put2(t, false); }, replace: t => put2(t, true) }, act);
  },
  img: () => ACTS.nimgadd(null, null, true),
  draw: () => { const n = NE.n; openDraw(async f => { const m = await FILES.add(f); n.img = [...(n.img || []), m]; noteChanged(); if (NE && NE.n === n) drawNoteEditor(); }); },
  aud: x => menu(x, [{ label: 'Gravar áudio', icon: 'mic', act: () => startRec() }, { label: 'Importar arquivo de áudio', icon: 'music', act: () => pickAudio() }]),
  tag: x => noteTagPick(x, NE.n, () => { noteChanged(); drawNoteEditor(); }),
  pal: x => notePalette(x, NE.n, () => { noteChanged(); drawNoteEditor(); }),
  more: x => menu(x, [
    { label: 'Fazer uma cópia', icon: 'copy', act: () => { const c = cloneP(NE.n); c.id = uid(); c.c = c.o = Date.now(); put('n', c); toast('Cópia criada'); } },
    { label: NE.n.big ? 'Texto normal' : 'Texto grande', icon: 'type', act: () => { NE.n.big = !NE.n.big; noteChanged(); drawNoteEditor(); } },
    { label: 'Copiar o texto', icon: 'doc', act: () => { const n = NE.n; navigator.clipboard && navigator.clipboard.writeText([n.title, n.list ? (n.items || []).map(i => (i.done ? '☑ ' : '☐ ') + i.t).join('\n') : n.body].filter(Boolean).join('\n\n')); toast('Texto copiado'); } },
    { sep: 1 },
    { label: 'Excluir nota', icon: 'trash', danger: 1, act: () => { if (NE.isNew) { NE = null; closeModal(); return; } const n = NE.n; n.del = Date.now(); put('n', n); NE = null; closeModal(); render(); toast('Nota enviada para a lixeira', 'Desfazer', () => { const x = get('n', n.id); if (x) { delete x.del; put('n', x); } }); } },
  ]),
};
function notePalette(anchor, n, done) {
  const el = pop(anchor, `<div class="npal">
    <p class="mut sm">Cor</p><div class="ncols">${NOTE_COLORS.map(([k, nm, l, d]) => `<button class="ncol${(n.color || '') === k ? ' on' : ''}" data-c="${k}" title="${nm}" style="--cc:${k ? (document.documentElement.dataset.theme === 'dark' ? d : l) : 'var(--card)'}">${k ? '' : ic('x', 14)}</button>`).join('')}</div>
    <p class="mut sm">Fundo</p><div class="nbgs">${NOTE_BGS.map(([k, nm, css]) => `<button class="nbgb${(n.bg || '') === k && !n.bgImg ? ' on' : ''}" data-b="${k}" title="${nm}" style="${css ? `background:${css},var(--card)` : ''}">${k ? '' : ic('x', 14)}</button>`).join('')}<button class="nbgb up" data-bi="1" title="Usar uma foto como fundo">${ic('img', 16)}</button></div>
    ${n.bgImg ? `<button class="link" data-bir="1">Remover foto de fundo</button>` : ''}
    <p class="mut sm">Letra</p><div class="seg">${NOTE_FONTS.map(([k, nm, f]) => `<button class="${(n.font || '') === k ? 'on' : ''}" data-f="${k}" style="font-family:${f}">${nm}</button>`).join('')}</div>
  </div>`, { cls: 'npalpop' });
  el.addEventListener('click', e => {
    const c = e.target.closest('[data-c]'), b = e.target.closest('[data-b]'), f = e.target.closest('[data-f]');
    if (c) n.color = c.dataset.c || undefined;
    else if (b) { n.bg = b.dataset.b || undefined; }
    else if (f) n.font = f.dataset.f || undefined;
    else if (e.target.closest('[data-bi]')) { closePop(); pickFiles('image/*', false, async files => { const fl = await shrinkImage(files[0], 1400); const m = await FILES.add(fl); if (n.bgImg) FILES.remove(n.bgImg); n.bgImg = m; done(); }); return; }
    else if (e.target.closest('[data-bir]')) { if (n.bgImg) FILES.remove(n.bgImg); n.bgImg = undefined; }
    else return;
    closePop(); done();
  });
}
function noteTagPick(anchor, n, done) {
  const all = [...new Set(db.n.filter(noteLive).flatMap(x => x.tags || []))].sort();
  const el = pop(anchor, `<div class="ntagpick"><input class="in sm" placeholder="Nova etiqueta e Enter" maxlength="40"><div>${all.map(t => `<label class="chk"><input type="checkbox" data-t="${esc(t)}" ${(n.tags || []).includes(t) ? 'checked' : ''}><span></span>${esc(t)}</label>`).join('')}</div></div>`, { cls: 'npalpop' });
  const inp = el.querySelector('input.in'); setTimeout(() => inp.focus(), 30);
  inp.onkeydown = e => { if (e.key === 'Enter' && inp.value.trim()) { n.tags = [...new Set([...(n.tags || []), inp.value.trim()])]; closePop(); done(); } };
  el.querySelectorAll('[data-t]').forEach(c => c.onchange = () => { const t = c.dataset.t; n.tags = c.checked ? [...new Set([...(n.tags || []), t])] : (n.tags || []).filter(x => x !== t); done(); });
}
function pickFiles(accept, multiple, cb) {
  const i = document.createElement('input'); i.type = 'file'; i.accept = accept; i.multiple = !!multiple;
  i.onchange = () => { if (i.files.length) cb([...i.files]); }; i.click();
}
function audDur(file) { return new Promise(res => { const a = new Audio(); a.preload = 'metadata'; a.onloadedmetadata = () => { res(isFinite(a.duration) ? a.duration : 0); URL.revokeObjectURL(a.src); }; a.onerror = () => res(0); a.src = URL.createObjectURL(file); }); }
function pickAudio() {
  pickFiles('audio/*', true, async files => {
    for (const f of files) { try { const dur = await audDur(f); const m = await FILES.add(f); m.dur = dur; NE.n.aud = [...(NE.n.aud || []), m]; } catch (e) { toast(e.message || 'Não foi possível importar'); } }
    noteChanged(); drawNoteEditor();
  });
}
/* gravação de voz */
const REC = { mr: null, chunks: [], t0: 0, tm: null };
async function startRec() {
  if (!navigator.mediaDevices || !window.MediaRecorder) { toast('Este aparelho não permite gravar áudio aqui'); return; }
  try {
    const st = await navigator.mediaDevices.getUserMedia({ audio: true });
    const type = ['audio/webm;codecs=opus', 'audio/mp4', 'audio/webm'].find(t => MediaRecorder.isTypeSupported && MediaRecorder.isTypeSupported(t)) || '';
    REC.mr = new MediaRecorder(st, type ? { mimeType: type } : undefined); REC.chunks = []; REC.t0 = Date.now();
    REC.mr.ondataavailable = e => e.data.size && REC.chunks.push(e.data);
    REC.mr.onstop = async () => {
      st.getTracks().forEach(t => t.stop()); clearInterval(REC.tm);
      const dur = (Date.now() - REC.t0) / 1000, mt = REC.mr.mimeType || 'audio/webm', ext = /mp4/.test(mt) ? 'm4a' : 'webm';
      const f = new File(REC.chunks, `Gravação ${new Date().toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }).replace(/[/:]/g, '-')}.${ext}`, { type: mt });
      REC.mr = null;
      if (!NE) return;
      try { const m = await FILES.add(f); m.dur = dur; NE.n.aud = [...(NE.n.aud || []), m]; noteChanged(); drawNoteEditor(); } catch (e) { toast('Não foi possível salvar a gravação'); }
    };
    REC.mr.start();
    const box = $('#ne_rec');
    if (box) { box.innerHTML = `<div class="nrec"><span class="nrecdot"></span><b id="ne_rect">0:00</b><span class="mut sm">Gravando…</span><span class="f1"></span><button class="btn red sm" id="ne_stop">Parar</button></div>`; $('#ne_stop').onclick = () => stopRec(); }
    REC.tm = setInterval(() => { const e = $('#ne_rect'); if (e) e.textContent = fmtAud((Date.now() - REC.t0) / 1000); }, 500);
  } catch (e) { toast('Sem permissão para usar o microfone'); }
}
function stopRec() { if (REC.mr && REC.mr.state !== 'inactive') REC.mr.stop(); }
Object.assign(ACTS, {
  qnote: b => { R.drawer = false; if (R.v !== 'notes' && !isMobile()) { } openNote(null, { list: b && b.dataset.list, img: b && b.dataset.img, rec: b && b.dataset.rec, draw: b && b.dataset.draw }); },
  ntab: b => { NF.tab = b.dataset.k; render(); },
  ntag: b => { NF.tag = b.dataset.k; render(); },
  npin: b => { const n = get('n', b.dataset.id); n.pin = !n.pin; put('n', n); },
  narch: b => { const n = get('n', b.dataset.id); n.arch = !n.arch; n.pin = false; put('n', n); toast(n.arch ? 'Nota arquivada' : 'Nota desarquivada', 'Desfazer', () => { n.arch = !n.arch; put('n', n); }); },
  npal: b => { const n = get('n', b.dataset.id); notePalette(b, n, () => put('n', n)); },
  nimgadd: (b, e, inEditor) => {
    const n = inEditor ? NE.n : get('n', b.dataset.id);
    pickFiles('image/*', true, async files => {
      for (const f of files) { try { const m = await FILES.add(await shrinkImage(f)); n.img = [...(n.img || []), m]; } catch (er) { toast(er.message || 'Não foi possível adicionar'); } }
      if (inEditor) { noteChanged(); drawNoteEditor(); } else put('n', n);
    });
  },
  nmore: b => {
    const n = get('n', b.dataset.id);
    menu(b, NF.tab === 'lixeira' ? [
      { label: 'Restaurar', icon: 'undo', act: () => { delete n.del; put('n', n); } },
      { label: 'Excluir para sempre', icon: 'trash', danger: 1, act: async () => { if (await confirmBox('Excluir esta nota para sempre?', 'Imagens e áudios dela também serão apagados.')) { [...(n.img || []), ...(n.aud || []), n.bgImg].filter(Boolean).forEach(m => FILES.remove(m)); hardDel('n', n.id); } } },
    ] : [
      { label: 'Abrir', icon: 'edit', act: () => openNote(n.id) },
      { label: n.pin ? 'Desafixar' : 'Fixar', icon: 'pin', act: () => { n.pin = !n.pin; put('n', n); } },
      { label: 'Fazer uma cópia', icon: 'copy', act: () => { const c = cloneP(n); c.id = uid(); c.c = c.o = Date.now(); put('n', c); } },
      { label: 'Etiquetas', icon: 'tag', act: () => noteTagPick(b, n, () => put('n', n)) },
      { sep: 1 },
      { label: 'Excluir', icon: 'trash', danger: 1, act: () => { n.del = Date.now(); put('n', n); toast('Nota enviada para a lixeira', 'Desfazer', () => { delete n.del; put('n', n); }); } },
    ]);
  },
  nempty: async () => { if (!(await confirmBox('Esvaziar a lixeira de notas?', 'As notas serão apagadas para sempre.'))) return; db.n.filter(n => n.del).forEach(n => { [...(n.img || []), ...(n.aud || []), n.bgImg].filter(Boolean).forEach(m => FILES.remove(m)); hardDel('n', n.id); }); },
});
