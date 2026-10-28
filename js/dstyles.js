/* Estilos prontos para documentos: mais de 100 combinações de cor, fundo e tipografia, agrupadas por humor.
   Trocar o estilo muda só a aparência — a estrutura (blocos, títulos, listas) continua igual. */
'use strict';
const DS_MOODS = [['minimal', 'Minimalista'], ['ousado', 'Ousado'], ['criativo', 'Criativo'], ['sereno', 'Sereno'], ['classico', 'Clássico']];
const DS_PAT = {
  dots: 'radial-gradient(color-mix(in srgb,var(--ink) 16%,transparent) 1px,transparent 1.3px) 0 0/22px 22px',
  grid: 'linear-gradient(color-mix(in srgb,var(--ink) 6%,transparent) 1px,transparent 1px) 0 0/24px 24px,linear-gradient(90deg,color-mix(in srgb,var(--ink) 6%,transparent) 1px,transparent 1px) 0 0/24px 24px',
  lined: 'linear-gradient(transparent 29px,color-mix(in srgb,var(--acc) 22%,transparent) 30px) 0 8px/100% 30px',
  confetti: 'radial-gradient(circle at 20% 30%,color-mix(in srgb,var(--acc) 30%,transparent) 2px,transparent 3px) 0 0/70px 70px,radial-gradient(circle at 70% 60%,rgba(80,160,230,.28) 2px,transparent 3px) 0 0/90px 90px,radial-gradient(circle at 40% 80%,rgba(250,190,60,.35) 2px,transparent 3px) 0 0/60px 60px',
  geo: 'linear-gradient(135deg,color-mix(in srgb,var(--acc) 10%,transparent) 25%,transparent 25%) 0 0/44px 44px,linear-gradient(225deg,rgba(250,190,60,.12) 25%,transparent 25%) 0 0/44px 44px',
  blobs: 'radial-gradient(50% 40% at 10% 0%,color-mix(in srgb,var(--acc) 22%,transparent),transparent 70%),radial-gradient(45% 35% at 95% 30%,rgba(120,180,255,.22),transparent 70%),radial-gradient(50% 40% at 30% 100%,rgba(255,210,120,.25),transparent 70%)',
  lines: 'repeating-linear-gradient(90deg,color-mix(in srgb,var(--acc) 7%,transparent) 0 2px,transparent 2px 46px)',
  glow: 'radial-gradient(70% 45% at 50% 0%,color-mix(in srgb,var(--acc) 25%,transparent),transparent 70%)',
};
const DS_PAL = {
  minimal: [['Branco', '#FFFFFF', '#1F1F1F', '#2F6FEB'], ['Papel', '#FBF8F1', '#2A2723', '#B5651D'], ['Névoa', '#F3F5F7', '#22272E', '#4A6FA5'], ['Neve', '#FAFBFC', '#1B1F24', '#0E9F6E'],
    ['Concreto', '#EEEEEC', '#2B2B2B', '#6B6B6B'], ['Grafite', '#1E1F22', '#E8E8E6', '#9AA0A6'], ['Areia', '#F5F0E8', '#3A3328', '#A07850'], ['Pedra', '#ECEAE6', '#2E2C29', '#7A6E62']],
  ousado: [['Neon', '#12101A', '#F2EEFF', '#FF3EA5', 'glow'], ['Vermelho', '#FFFFFF', '#141414', '#E5312B'], ['Pop', '#FFF4B8', '#1A1A1A', '#E5312B'], ['Brasa', '#1A1714', '#F7EFE6', '#FF7A1A', 'glow'],
    ['Elétrico', '#F2F6FF', '#0B1B3F', '#2251FF'], ['Ácido', '#121512', '#EAF7E3', '#9BEA2B', 'grid'], ['Contraste', '#000000', '#FFFFFF', '#FFD400'], ['Púrpura', '#2A0F3D', '#F6EAFE', '#C77DFF', 'glow']],
  criativo: [['Confete', '#FFFDF7', '#2A2430', '#F05A7E', 'confetti'], ['Pastel', '#FDF6FF', '#3A2E45', '#9A6BD8', 'dots'], ['Retrô', '#F6E9D3', '#4A2E1F', '#D9662B', 'lines'], ['Memphis', '#FFFFFF', '#1E1E2A', '#18A999', 'geo'],
    ['Doce', '#FFF0F5', '#4A2235', '#E9578B', 'dots'], ['Aquarela', '#FFFFFF', '#2D3142', '#4F9DDE', 'blobs'], ['Tropical', '#F2FBF5', '#123828', '#F2994A', 'blobs'], ['Caderno', '#FFFEF8', '#22304A', '#D64545', 'lined']],
  sereno: [['Sálvia', '#EEF3EC', '#2E3B2F', '#6B8F71'], ['Oceano', '#EEF5F8', '#1F3440', '#3E8EAF', 'blobs'], ['Lavanda', '#F4F1FA', '#3A3350', '#8A78C8'], ['Lua', '#1C2230', '#DCE3F0', '#9DB4E0', 'glow'],
    ['Bruma', '#F1F2F4', '#3B4048', '#8892A0'], ['Chá verde', '#F4F7EC', '#33402A', '#8DA651'], ['Praia', '#FBF6EE', '#3D3428', '#E0A86E'], ['Amanhecer', '#FFF6F0', '#41302B', '#E88D72', 'glow']],
  classico: [['Corporativo', '#FFFFFF', '#1C2433', '#1F4E8C'], ['Jornal', '#F7F4ED', '#1A1A1A', '#8B0000'], ['Acadêmico', '#FFFFFF', '#202020', '#5B3A8E'], ['Biblioteca', '#F3EDE2', '#2B2118', '#7A4E2D'], ['Executivo', '#14181F', '#E6E9EE', '#C9A86A']],
};
const DS_TYPO = {
  minimal: [['Sans', 'Inter', 'Inter', 700, '-.02em', 'none'], ['Suíço', 'Inter', 'Inter', 800, '.06em', 'uppercase', .82], ['Mono', 'Source Code Pro', 'Inter', 600, '0', 'none']],
  ousado: [['Impacto', 'Montserrat', 'Inter', 800, '.01em', 'uppercase'], ['Display', 'Playfair Display', 'Inter', 800, '-.01em', 'none', 1.12, 1], ['Pesado', 'Inter', 'Inter', 900, '-.045em', 'none', 1.08, 1]],
  criativo: [['Arredondado', 'Nunito', 'Nunito', 800, '0', 'none'], ['À mão', 'Caveat', 'Nunito', 700, '0', 'none', 1.35, 1], ['Slab', 'Roboto Slab', 'Inter', 700, '0', 'none']],
  sereno: [['Serifa suave', 'Lora', 'Lora', 600, '0', 'none'], ['Leve', 'Inter', 'Inter', 500, '-.01em', 'none'], ['Calmo', 'Nunito', 'Nunito', 700, '0', 'none']],
  classico: [['Clássico', 'Georgia', 'Georgia', 700, '0', 'none'], ['Editorial', 'Playfair Display', 'Lora', 700, '0', 'none', 1.08], ['Tradicional', 'Merriweather', 'Merriweather', 700, '0', 'none']],
};
const DSTYLES = [];
DS_MOODS.forEach(([mood]) => DS_PAL[mood].forEach((p, i) => DS_TYPO[mood].forEach((ty, j) => {
  const [pn, bg, ink, acc, pat] = p, [tn, hf, bf, hw, hls, htt, hs, hacc] = ty;
  DSTYLES.push({ id: `${mood}-${i}-${j}`, mood, name: `${pn} · ${tn}`, bg, ink, acc, pat: pat || '', hf, bf, hw, hls, htt, hs: hs || 1, hacc: !!hacc, dark: hexLum(bg) < .35 });
})));
function hexLum(h) { const [r, g, b] = hex2(h); return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255; }
const dsGet = id => DSTYLES.find(x => x.id === id);
function dsVars(t) {
  const mix = (a, b, k) => rgbS(mixC(hex2(a), hex2(b), k));
  return [`--pbg:${t.bg}`, `--ink:${t.ink}`, `--acc:${t.acc}`, `--mink:${mix(t.ink, t.bg, .45)}`, `--cbg:${mix(t.acc, t.bg, .88)}`, `--rule:${mix(t.ink, t.bg, .85)}`,
    `--hfont:'${t.hf}',Inter,sans-serif`, `--bfont:'${t.bf}',Inter,sans-serif`, `--hw:${t.hw}`, `--hls:${t.hls}`, `--htt:${t.htt}`, `--hs:${t.hs}`, `--hcol:${t.hacc ? t.acc : t.ink}`,
    `--ppat:${t.pat ? DS_PAT[t.pat] : 'none'}`].join(';');
}
/* miniatura do estilo */
function dsThumb(t, sel) {
  return `<button class="dsth${sel ? ' on' : ''}" data-ds="${t.id}" style="${esc(dsVars(t))}" title="${esc(t.name)}">
    <span class="dspg"><b>Aa</b><i class="l1"></i><i class="l2"></i><i class="l3"></i><em></em></span><span class="dsn">${esc(t.name)}</span></button>`;
}
function stylePicker(onPick, cur) {
  loadDocFonts();
  let mood = cur && dsGet(cur) ? dsGet(cur).mood : 'all', q = '';
  const el = modal(`<div class="dspick"><div class="dshead"><div><h2>${ic('palette', 20)}Estilos prontos</h2><p class="mut sm">${DSTYLES.length} estilos. Escolha um antes de escrever ou troque depois — a estrutura do documento continua igual.</p></div><button class="btn ghost sm" data-dsr>🎲 Surpreenda-me</button></div>
    <div class="dsbar"><div class="seg dsmood">${[['all', 'Todos'], ...DS_MOODS].map(([k, n]) => `<button data-m="${k}" class="${mood === k ? 'on' : ''}">${n}</button>`).join('')}</div><input class="in sm" placeholder="Buscar estilo" data-dsq></div>
    <div class="dsgrid"></div>
    <div class="row end"><button class="btn ghost" data-dsn>Sem estilo</button><button class="btn red" data-x>Concluir</button></div></div>`, { cls: 'dsmodal' });
  const grid = el.querySelector('.dsgrid');
  const draw = () => { const list = DSTYLES.filter(t => (mood === 'all' || t.mood === mood) && (!q || norm(t.name).includes(norm(q)))); grid.innerHTML = list.map(t => dsThumb(t, t.id === cur)).join('') || '<p class="hint">Nenhum estilo encontrado.</p>'; };
  draw();
  el.querySelectorAll('[data-m]').forEach(b => b.onclick = () => { mood = b.dataset.m; el.querySelectorAll('[data-m]').forEach(x => x.classList.toggle('on', x === b)); draw(); });
  el.querySelector('[data-dsq]').oninput = e => { q = e.target.value; draw(); };
  grid.onclick = e => { const b = e.target.closest('[data-ds]'); if (!b) return; cur = b.dataset.ds; grid.querySelectorAll('.dsth').forEach(x => x.classList.toggle('on', x === b)); onPick(cur); };
  el.querySelector('[data-dsr]').onclick = () => { const t = DSTYLES[Math.floor(Math.random() * DSTYLES.length)]; cur = t.id; mood = 'all'; draw(); onPick(cur); const b = grid.querySelector(`[data-ds="${cur}"]`); b && b.scrollIntoView({ block: 'center', behavior: 'smooth' }); };
  el.querySelector('[data-dsn]').onclick = () => { cur = null; onPick(null); closeModal(); };
  el.querySelector('[data-x]').onclick = () => closeModal();
}

const DS_FEAT = ['minimal-0-0', 'minimal-1-2', 'sereno-0-0', 'sereno-3-1', 'criativo-0-0', 'criativo-7-1', 'ousado-0-1', 'ousado-6-0', 'classico-1-1', 'classico-4-1'];
