/* Animações do Foco: Casa dos gatinhos (decorada com móveis ganhos a cada sessão) e Floresta (uma árvore por sessão).
   Tudo em pixel art numa cena de 192×120 ampliada. As conquistas vêm das sessões de foco já registradas (db.p),
   então valem em todos os aparelhos e não dá para ganhar o mesmo presente duas vezes. */
'use strict';
const FXW = 192, FXH = 120;
const FX = { t: 0, loop: null, month: null, poses: {}, nextPose: 0 };
const fxCfg = () => Object.assign({ anim: 'cats' }, db.s.fx || {});
const fxAnim = () => fxCfg().anim;
const houseCfg = () => Object.assign({ wall: 'creme', floor: 'madeira', hide: [], seen: null }, db.s.house || {});

/* ---------- sessões que contam ---------- */
const fxEarned = p => !p.ab && (p.type === 'focus' || p.type === 'watch') && (p.dur || 0) >= 15;
function fxCounts() { let s = 0, l = 0; db.p.forEach(p => { if (fxEarned(p)) { s++; if (p.dur >= 45) l++; } }); return { s, l }; }

/* ---------- catálogo da casa ---------- */
const HOUSE_ITEMS = [
  { id: 'bed', n: 'Caminha', need: 0, box: [130, 90, 36, 20] },
  { id: 'bowl', n: 'Pote de ração', need: 0, box: [172, 98, 20, 14] },
  { id: 'yarn', n: 'Novelo de lã', need: 1, box: [114, 100, 24, 14] },
  { id: 'winPlant', n: 'Vaso na janela', need: 2, box: [14, 34, 24, 20] },
  { id: 'rug', n: 'Tapete', need: 3, box: [54, 92, 86, 24] },
  { id: 'pic', n: 'Quadro', need: 5, box: [70, 14, 34, 26] },
  { id: 'shelf', n: 'Prateleira com livros', need: 7, box: [108, 14, 44, 22] },
  { id: 'cushion', n: 'Almofadão', need: 9, box: [34, 86, 30, 18] },
  { id: 'lamp', n: 'Luminária', need: 12, box: [152, 38, 30, 52] },
  { id: 'sofa', n: 'Sofá', need: 15, box: [58, 54, 70, 36] },
  { id: 'plant', n: 'Planta grande', need: 19, box: [0, 56, 20, 50] },
  { id: 'clock', n: 'Relógio de parede', need: 24, box: [154, 4, 26, 26] },
  { id: 'fishbowl', n: 'Aquário', need: 30, box: [136, 14, 18, 20] },
  { id: 'tree', n: 'Arranhador torre', rare: 1, need: 1, box: [14, 48, 42, 52] },
  { id: 'hammock', n: 'Rede na janela', rare: 1, need: 3, box: [24, 34, 36, 18] },
  { id: 'radio', n: 'Vitrola', rare: 1, need: 6, box: [124, 60, 30, 30] },
  { id: 'lights', n: 'Varal de luzinhas', rare: 1, need: 10, box: [0, 0, 192, 16] },
];
const HOUSE_WALLS = [
  { id: 'creme', n: 'Creme listrado', need: 0, c: ['#F3E3CF', '#E9D3BA'], p: 'stripe' },
  { id: 'azul', n: 'Listras azuis', need: 4, c: ['#DCE9F5', '#C3D7EC'], p: 'stripe' },
  { id: 'salvia', n: 'Verde-sálvia', need: 8, c: ['#D7E4D2', '#C6D7C0'], p: 'plain' },
  { id: 'rosa', n: 'Rosa com bolinhas', need: 14, c: ['#F6DCE2', '#E8B9C4'], p: 'dots' },
  { id: 'tijolo', n: 'Tijolinho', need: 20, c: ['#C9775A', '#B5654A'], p: 'brick' },
  { id: 'estrelas', n: 'Céu estrelado', rare: 1, need: 2, c: ['#28305A', '#F7E7A1'], p: 'stars' },
];
const HOUSE_FLOORS = [
  { id: 'madeira', n: 'Madeira', need: 0, c: ['#C68D58', '#B07A4B', '#9C6A3E'], p: 'plank' },
  { id: 'escura', n: 'Madeira escura', need: 6, c: ['#7A5038', '#6A4430', '#553424'], p: 'plank' },
  { id: 'xadrez', n: 'Piso xadrez', need: 11, c: ['#EDEAE4', '#3D3B40'], p: 'check' },
  { id: 'carpete', n: 'Carpete azul', need: 17, c: ['#5874A8', '#4E699B'], p: 'carpet' },
  { id: 'marmore', n: 'Mármore', rare: 1, need: 5, c: ['#F1EFEC', '#D9D4CE'], p: 'marble' },
];
const fxHas = (it, c = fxCounts()) => it.rare ? c.l >= it.need : c.s >= it.need;
const fxNeedTxt = it => it.rare ? `${it.need} sessão(ões) longa(s) de 45 min+` : `${it.need} sessão(ões) de foco`;
function houseUnlocked(c = fxCounts()) { return [...HOUSE_ITEMS.map(i => ['i', i]), ...HOUSE_WALLS.map(i => ['w', i]), ...HOUSE_FLOORS.map(i => ['f', i])].filter(([, it]) => fxHas(it, c)).map(([k, it]) => k + ':' + it.id); }

/* ---------- desenho ---------- */
const fR = (x, a, b, w, h, col) => { x.fillStyle = col; x.fillRect(Math.round(a), Math.round(b), Math.round(w), Math.round(h)); };
const fP = (x, a, b, col) => fR(x, a, b, 1, 1, col);
function fEll(x, cx, cy, rx, ry, col) { x.fillStyle = col; for (let j = -ry; j <= ry; j++) { const w = Math.floor(rx * Math.sqrt(Math.max(0, 1 - (j * j) / (ry * ry + .3)))); x.fillRect(Math.round(cx - w), Math.round(cy + j), w * 2 + 1, 1); } }
function sprig(x, bx, by, h, ph, col, hi) { for (let k = 0; k < h; k++) { const sx = Math.round(bx + Math.sin(k / 3 + ph) * 1.4); fR(x, sx, by - k, 2, 1, col); if (k % 4 === 0) fP(x, sx + 2, by - k, hi); if (k % 5 === 2) fP(x, sx - 1, by - k, hi); } }
const isNight = () => { const h = new Date().getHours(); return h >= 18 || h < 6; };
let fxSeed = 1; const fxRnd = () => { fxSeed = (fxSeed * 9301 + 49297) % 233280; return fxSeed / 233280; };
const hashS = s => { let h = 2166136261; for (const ch of String(s)) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); } h ^= h >>> 16; h = Math.imul(h, 0x85ebca6b); h ^= h >>> 13; h = Math.imul(h, 0xc2b2ae35); h ^= h >>> 16; return (h >>> 0) / 4294967296; };

/* ---------- casa ---------- */
function drawRoom(x, o) {
  const night = o.night, has = id => o.items.has(id);
  const wall = HOUSE_WALLS.find(w => w.id === o.wall) || HOUSE_WALLS[0], floor = HOUSE_FLOORS.find(f => f.id === o.floor) || HOUSE_FLOORS[0];
  /* parede */
  fR(x, 0, 0, FXW, 86, wall.c[0]);
  if (wall.p === 'stripe') for (let i = 0; i < FXW; i += 12) fR(x, i, 0, 6, 86, wall.c[1]);
  if (wall.p === 'dots') for (let j = 4; j < 80; j += 8) for (let i = (j / 8 % 2) * 6; i < FXW; i += 12) fR(x, i, j, 2, 2, wall.c[1]);
  if (wall.p === 'brick') for (let j = 0; j < 80; j += 6) { fR(x, 0, j, FXW, 1, wall.c[1]); for (let i = (j / 6 % 2) * 8; i < FXW; i += 16) fR(x, i, j, 1, 6, wall.c[1]); }
  if (wall.p === 'stars') { fxSeed = 3; for (let i = 0; i < 60; i++) { const a = fxRnd() * FXW, b = fxRnd() * 76; fP(x, a, b, wall.c[1]); if (i % 7 === 0) { fP(x, a - 1, b, wall.c[1]); fP(x, a + 1, b, wall.c[1]); fP(x, a, b - 1, wall.c[1]); fP(x, a, b + 1, wall.c[1]); } } }
  fR(x, 0, 80, FXW, 6, 'rgba(0,0,0,.08)'); fR(x, 0, 80, FXW, 1, 'rgba(255,255,255,.35)');
  /* chão */
  for (let j = 86; j < FXH; j++) {
    if (floor.p === 'plank') fR(x, 0, j, FXW, 1, j % 6 === 0 ? floor.c[2] : floor.c[0]);
    else if (floor.p === 'check') for (let i = 0; i < FXW; i += 8) fR(x, i, j, 8, 1, ((i / 8 | 0) + ((j - 86) / 6 | 0)) % 2 ? floor.c[1] : floor.c[0]);
    else if (floor.p === 'carpet') fR(x, 0, j, FXW, 1, j % 2 ? floor.c[0] : floor.c[1]);
    else fR(x, 0, j, FXW, 1, floor.c[0]);
  }
  if (floor.p === 'plank') for (let i = 0; i < FXW; i += 23) for (let j = 86; j < FXH; j += 6) fP(x, i + (j % 12 ? 10 : 0), j + 1, floor.c[2]);
  if (floor.p === 'marble') { fxSeed = 9; for (let k = 0; k < 14; k++) { let a = fxRnd() * FXW, b = 87 + fxRnd() * 30; for (let s = 0; s < 12; s++) { fP(x, a, b, floor.c[1]); a += 1; b += fxRnd() < .5 ? 0 : (fxRnd() < .5 ? 1 : -1); } } }
  fR(x, 0, 86, FXW, 1, 'rgba(0,0,0,.12)');
  /* varal de luzinhas */
  if (has('lights')) { for (let i = 0; i < FXW; i++) fP(x, i, 5 + Math.round(Math.abs(Math.sin(i / 16)) * 6), 'rgba(60,50,40,.55)'); ['#FFD54A', '#FF7A90', '#7CD4FF', '#9BE36A'].forEach((c, k) => { for (let i = 6 + k * 8; i < FXW; i += 32) { const y = 6 + Math.round(Math.abs(Math.sin(i / 16)) * 6); const on = !night || (Math.floor(FX.t / 6) + i) % 3; fR(x, i, y, 2, 2, on ? c : 'rgba(0,0,0,.25)'); if (night && on) { x.fillStyle = c.replace(')', ',.18)').replace('#', '#'); } } }); }
  /* janela */
  fR(x, 14, 14, 44, 36, '#6B4A2E'); fR(x, 16, 16, 40, 32, night ? '#14183A' : '#9ED8F5');
  if (night) { [[22, 20], [30, 26], [44, 19], [50, 30], [26, 34]].forEach(([a, b], i) => fP(x, a, b, (FX.t + i * 3) % 14 < 11 ? '#FFF6C8' : '#8a8fb8')); fEll(x, 48, 23, 3, 3, '#FFF1B8'); fEll(x, 49, 22, 2, 2, '#14183A');
    for (let i = 16; i < 56; i += 4) { const hh = 6 + (i * 7 % 9); fR(x, i, 48 - hh, 4, hh, '#232848'); if (i % 8 === 0) fP(x, i + 1, 48 - hh + 2, '#FFD36E'); } }
  else { const cx = ((FX.t / 4) % 60) - 10; fEll(x, 16 + cx, 24, 4, 2, '#fff'); fEll(x, 20 + cx, 23, 4, 3, '#fff'); fEll(x, 46, 30, 5, 2, '#fff'); for (let i = 16; i < 56; i += 5) { const hh = 5 + (i * 7 % 8); fR(x, i, 48 - hh, 5, hh, '#7FA9C9'); } fR(x, 14, 14, 2, 36, '#6B4A2E'); fR(x, 56, 14, 2, 36, '#6B4A2E'); }
  fR(x, 35, 16, 2, 32, '#6B4A2E'); fR(x, 16, 31, 40, 2, '#6B4A2E');
  fR(x, 10, 12, 52, 3, '#A0423A'); for (let j = 15; j < 54; j++) { fR(x, 10, j, 6 - (j > 40 ? 1 : 0), 1, '#C2524A'); fR(x, 56 + (j > 40 ? 1 : 0), j, 6, 1, '#C2524A'); }
  fR(x, 12, 50, 48, 3, '#8A5A36');
  if (has('winPlant')) { fR(x, 20, 45, 6, 5, '#C0623B'); sprig(x, 21, 45, 7, 1, '#3E8E4A', '#7CC46B'); }
  if (has('hammock')) { fR(x, 28, 34, 1, 6, '#ddd'); fR(x, 54, 34, 1, 6, '#ddd'); for (let i = 28; i <= 54; i++) { const y = 40 + Math.round(Math.sin((i - 28) / 26 * Math.PI) * 4); fR(x, i, y, 1, 2, '#E8A34A'); fP(x, i, y + 2, '#C07F2E'); } }
  /* quadro */
  if (has('pic')) { fR(x, 74, 18, 26, 18, '#5A3A22'); fR(x, 76, 20, 22, 14, night ? '#C79A62' : '#F8C27A'); fEll(x, 84, 26, 4, 3, '#E86F4A'); fR(x, 76, 30, 22, 4, '#7DB36A'); fP(x, 91, 23, '#fff'); }
  /* relógio */
  if (has('clock')) { fEll(x, 166, 16, 7, 7, '#5A3A22'); fEll(x, 166, 16, 6, 6, '#FBF6EC'); const d = new Date(), hA = (d.getHours() % 12 + d.getMinutes() / 60) / 12 * 2 * Math.PI, mA = d.getMinutes() / 60 * 2 * Math.PI; for (let k = 1; k <= 3; k++) fP(x, 166 + Math.round(Math.sin(hA) * k), 16 - Math.round(Math.cos(hA) * k), '#333'); for (let k = 1; k <= 5; k++) fP(x, 166 + Math.round(Math.sin(mA) * k), 16 - Math.round(Math.cos(mA) * k), '#333'); fP(x, 166, 16, '#C2524A'); }
  /* prateleira */
  if (has('shelf')) { fR(x, 112, 30, 36, 3, '#7A5132'); [['#D9534F', 5], ['#4A90D9', 4], ['#F2C94C', 6], ['#5CB85C', 5]].forEach(([c, h], i) => fR(x, 114 + i * 4, 30 - h - 1, 3, h + 1, c)); fR(x, 132, 25, 6, 5, '#E9E1D3'); sprig(x, 133, 25, 6, 2, '#3E8E4A', '#7CC46B'); }
  if (has('fishbowl')) { fR(x, 138, 33, 12, 2, '#7A5132'); fR(x, 140, 35, 2, 46, '#7A5132'); fR(x, 146, 35, 2, 46, '#7A5132'); fEll(x, 144, 27, 6, 5, 'rgba(160,220,255,.55)'); fR(x, 139, 24, 11, 1, 'rgba(255,255,255,.6)'); const fx = 141 + Math.round(Math.sin(FX.t / 5) * 2.5); fR(x, fx, 28, 3, 2, '#F57C1F'); fP(x, fx - 1, 28, '#E0601A'); fP(x, 144, 31, '#2E9D5B'); fP(x, 145, 30, '#2E9D5B'); }
  /* luminária */
  if (has('lamp')) { fR(x, 166, 50, 2, 34, '#3a3a3a'); fR(x, 162, 84, 10, 2, '#3a3a3a'); fR(x, 159, 42, 16, 9, '#F2D7A6'); fR(x, 159, 42, 16, 1, '#fff2d0');
    if (night) { x.fillStyle = 'rgba(255,220,140,.13)'; x.beginPath(); x.moveTo(159, 51); x.lineTo(175, 51); x.lineTo(190, 110); x.lineTo(144, 110); x.fill(); } }
  /* planta grande */
  if (has('plant')) { fR(x, 3, 90, 12, 12, '#C0623B'); fR(x, 2, 89, 14, 2, '#A4522F'); [[6, 1], [9, 2.2], [12, 3.1], [8, 4]].forEach(([b, ph], i) => sprig(x, b, 89, 22 + i * 4, ph, i % 2 ? '#2F7D3E' : '#3E8E4A', '#7CC46B')); }
  /* tapete */
  if (has('rug')) { fEll(x, 96, 104, 38, 9, '#B85C7A'); fEll(x, 96, 104, 33, 7, '#D77D98'); fEll(x, 96, 104, 26, 5, '#B85C7A'); }
  /* vitrola */
  if (has('radio')) { fR(x, 128, 72, 20, 14, '#8A5A36'); fR(x, 128, 72, 20, 1, '#A87048'); fR(x, 131, 76, 6, 6, '#6B4428'); fR(x, 139, 76, 6, 6, '#6B4428'); fR(x, 129, 86, 2, 3, '#3a2a20'); fR(x, 145, 86, 2, 3, '#3a2a20');
    fR(x, 129, 66, 18, 6, '#4A3326'); fEll(x, 137, 68, 5, 2, '#1d1d1f'); fP(x, 137, 68, '#E2557A'); fR(x, 143, 64, 1, 4, '#ccc');
    if (o.music) { const k = FX.t % 12; ['#fff', '#FFE27A'].forEach((c, i) => { const yy = 60 - ((k + i * 6) % 12), xx = 140 + i * 5 + (yy % 3); fR(x, xx, yy, 1, 3, c); fR(x, xx - 2, yy + 2, 2, 2, c); }); } }
  /* sofá */
  if (has('sofa')) { fR(x, 66, 64, 54, 18, '#4F7CAC'); fR(x, 66, 60, 54, 8, '#5E8BBD'); fR(x, 62, 66, 8, 18, '#3F6A98'); fR(x, 116, 66, 8, 18, '#3F6A98'); fR(x, 70, 70, 23, 8, '#6F9CCB'); fR(x, 93, 70, 23, 8, '#6F9CCB'); fR(x, 66, 82, 3, 4, '#3a2a20'); fR(x, 117, 82, 3, 4, '#3a2a20'); fR(x, 72, 63, 9, 7, '#F2C94C'); fR(x, 105, 63, 9, 7, '#E86F4A'); }
  /* arranhador */
  if (has('tree')) { fR(x, 22, 92, 22, 6, '#C9B79A'); fR(x, 29, 56, 7, 37, '#D8C39E'); for (let j = 58; j < 92; j += 3) fR(x, 29, j, 7, 1, '#B9A37E'); fR(x, 18, 52, 28, 6, '#A87FC0'); fR(x, 18, 52, 28, 1, '#c6a3dc'); fR(x, 38, 68, 14, 5, '#A87FC0'); fR(x, 42, 73, 3, 20, '#D8C39E'); const sw = Math.round(Math.sin(FX.t / 4)); fR(x, 47 + sw, 73, 1, 8, '#ddd'); fEll(x, 47 + sw, 83, 2, 2, '#F2C94C'); }
  /* almofadão */
  if (has('cushion')) { fEll(x, 48, 96, 11, 4, '#6BA368'); fEll(x, 48, 95, 9, 3, '#86C083'); }
  /* caminha */
  if (has('bed')) { fEll(x, 148, 100, 16, 6, '#8E5A3C'); fEll(x, 148, 99, 13, 4, '#F4D9B8'); }
  /* novelo */
  if (has('yarn')) { fEll(x, 124, 108, 3, 3, '#E2557A'); fP(x, 123, 107, '#ff9ab5'); fR(x, 127, 109, 6, 1, '#E2557A'); }
  /* pote */
  if (has('bowl')) { fR(x, 178, 104, 10, 4, '#4AA3A2'); fR(x, 179, 103, 8, 1, '#8B5A2B'); }
  if (night) fR(x, 0, 0, FXW, FXH, has('lamp') ? 'rgba(15,12,40,.16)' : 'rgba(10,10,30,.28)');
}
/* lugares onde os gatos ficam (pés do gato) */
function catSpots(items, sleeping) {
  const S = [];
  if (sleeping) { if (items.has('bed')) S.push([148, 103]); if (items.has('tree')) S.push([31, 54]); if (items.has('sofa')) S.push([93, 72]); if (items.has('hammock')) S.push([42, 42]); if (items.has('cushion')) S.push([48, 97]); S.push([96, 106]); return S; }
  S.push([92, 108], [60, 110]); if (items.has('tree')) S.push([31, 54]); if (items.has('sofa')) S.push([88, 72]); if (items.has('rug')) S.push([110, 105]); S.push([40, 52]);
  return S;
}
const CAT_BREATH = (() => { if (typeof POSES === 'undefined') return null; const a = cloneP(POSES.sleep); a.B[3] += .45; a.Hq[3] += .3; return a; })();
function drawCatAt(x, k, poseName, fx, fy, flip, eyes, t) {
  const c = FX.cc || (FX.cc = document.createElement('canvas'));
  let P = POSES[poseName] || POSES.sit;
  if (poseName === 'sleep' && CAT_BREATH) P = lerpP(POSES.sleep, CAT_BREATH, (Math.sin(t / 4) + 1) / 2);
  paintCat(c, k, P, { eyes });
  const px = Math.round(fx - 20), py = Math.round(fy - 26);
  x.save(); if (flip) { x.translate(px * 2 + 40, 0); x.scale(-1, 1); } x.drawImage(c, px, py); x.restore();
}
function zzzAt(x, a, b, t) { const k = t % 18; [[0, 5], [6, 4], [12, 3]].forEach(([d, s], i) => { const ph = (k + i * 6) % 18; if (ph > 14) return; const u = a + i * 5 + Math.round(Math.sin(ph / 3)), v = b - ph; fR(x, u, v, s, 1, '#fff'); for (let q = 1; q < s - 1; q++) fP(x, u + s - 1 - q, v + q, '#fff'); fR(x, u, v + s - 1, s, 1, '#fff'); }); }
function fxCats() { const c = petCfg().cats; return (c.length ? c : [{ k: 'laranja', n: 'Mingau' }, { k: 'pretobranco', n: 'Pipoca' }]).slice(0, 2); }
function houseItemsSet(c = fxCounts()) { const hc = houseCfg(); return new Set(HOUSE_ITEMS.filter(i => fxHas(i, c) && !hc.hide.includes(i.id)).map(i => i.id)); }
function drawHouseScene(x, sleeping) {
  const hc = houseCfg(), items = houseItemsSet(), night = isNight() || sleeping && isNight();
  drawRoom(x, { night, wall: hc.wall, floor: hc.floor, items, music: !sleeping && !FS.run && false });
  const cats = fxCats(), spots = catSpots(items, sleeping);
  if (Date.now() > FX.nextPose || !FX.poses.sig || FX.poses.sig !== (sleeping ? 's' : 'a') + spots.length) {
    const pick = (i) => { const sp = spots[(i + Math.floor(Date.now() / 60000)) % spots.length]; return { sp: sleeping ? spots[i % spots.length] : sp, pose: sleeping ? 'sleep' : ['sit', 'lie', 'groom', 'sit', 'stretch'][Math.floor(Math.random() * 5)], flip: Math.random() < .5 }; };
    FX.poses = { sig: (sleeping ? 's' : 'a') + spots.length, list: cats.map((_, i) => pick(i)) };
    if (!sleeping && FX.poses.list[1] && FX.poses.list[0].sp === FX.poses.list[1].sp) FX.poses.list[1].sp = spots[(spots.indexOf(FX.poses.list[0].sp) + 1) % spots.length];
    FX.nextPose = Date.now() + (sleeping ? 1e9 : 7000 + Math.random() * 5000);
  }
  const order = cats.map((c, i) => [c, FX.poses.list[i]]).sort((a, b) => a[1].sp[1] - b[1].sp[1]);
  order.forEach(([c, s], i) => {
    const pose = s.pose, ey = sleeping ? 'closed' : (FX.t + i * 7) % 40 < 2 ? 'closed' : 'open';
    drawCatAt(x, c.k, pose === 'stretch' && (FX.t % 30) > 15 ? 'sit' : pose, s.sp[0], s.sp[1], s.flip, ey, FX.t + i * 5);
    if (sleeping) zzzAt(x, s.sp[0] + (s.flip ? -14 : 10), s.sp[1] - 14, FX.t + i * 9);
  });
}

/* ---------- floresta ---------- */
function treeKind(p) { if (p.ab) return 'dead'; const d = p.dur || 0, h = hashS(p.id); if (d < 15) return 'sprout'; if (d < 25) return 'bush'; if (d < 45) return h < .5 ? 'round' : 'pine'; if (d < 90) return 'big'; return h < .5 ? 'ipe' : 'ipeY'; }
const TREE_PAL = {
  round: ['#2F7D3E', '#3E9A4E', '#6CC46E', '#7A4E2C'], pine: ['#1F5E3A', '#2A7A4A', '#4FA36A', '#6A4428'], big: ['#2B6E3A', '#3B8C4A', '#71BE62', '#6E4526'],
  bush: ['#3B8740', '#4FA556', '#86D27E', '#6A4428'], ipe: ['#B83E7A', '#DA5C99', '#F6A3C8', '#6E4526'], ipeY: ['#C99A12', '#E8B923', '#FFE27A', '#6E4526'], dead: ['#6E5A48', '#8A7360', '#A08A74', '#5A4636'],
};
function drawTree(x, cx, by, kind, s = 1, sd = .3) {
  const P = TREE_PAL[kind] || TREE_PAL.round, S = v => Math.max(1, Math.round(v * s));
  if (kind === 'sprout') { fR(x, cx, by - S(5), 1, S(5), '#4E8B3A'); fEll(x, cx - S(2), by - S(5), S(2), S(1), '#6CC46E'); fEll(x, cx + S(2), by - S(6), S(2), S(1), '#86D27E'); fEll(x, cx, by, S(3), 1, 'rgba(60,40,20,.35)'); return; }
  if (kind === 'dead') { fR(x, cx - S(1), by - S(16), S(2), S(16), P[0]); fR(x, cx - S(5), by - S(12), S(5), 1, P[0]); fR(x, cx + 1, by - S(9), S(5), 1, P[0]); fR(x, cx - S(5), by - S(14), 1, S(3), P[0]); fR(x, cx + S(5), by - S(11), 1, S(3), P[0]); fEll(x, cx, by, S(4), 1, 'rgba(60,40,20,.3)'); return; }
  fEll(x, cx, by, S(kind === 'big' ? 9 : 6), Math.max(1, S(1.5)), 'rgba(20,40,20,.28)');
  if (kind === 'bush') { fEll(x, cx, by - S(4), S(6) + 1, S(4) + 1, 'rgba(15,40,20,.75)'); fEll(x, cx, by - S(4), S(6), S(4), P[1]); fEll(x, cx - S(2), by - S(5), S(3), S(2), P[2]); [[-3, -5], [2, -6], [4, -3], [-1, -2]].forEach(([a, b], i) => fP(x, cx + S(a), by + S(b), i % 2 ? '#FFD54A' : '#FF8FB1')); return; }
  if (kind === 'pine') { const h = S(26); fR(x, cx - S(1), by - S(5), S(2), S(5), P[3]); for (let j = 0; j < h; j++) { const w = Math.round((j / h) * S(8)) + 1; fR(x, cx - w - 1, by - S(4) - h + j, w * 2 + 3, 1, 'rgba(10,30,20,.8)'); } for (let j = 0; j < h; j++) { const w = Math.round((j / h) * S(8)); fR(x, cx - w, by - S(4) - h + j, w * 2 + 1, 1, j % S(6) < S(2) ? P[0] : P[1]); fP(x, cx - w, by - S(4) - h + j, P[2]); } return; }
  const big = kind === 'big' || kind === 'ipe' || kind === 'ipeY';
  const th = S(big ? 16 : 11), cr = S(big ? 11 : 8);
  fR(x, cx - S(1.5), by - th, S(3), th, P[3]); fR(x, cx + S(.5), by - th, 1, th, 'rgba(0,0,0,.25)');
  if (big) { fR(x, cx - S(5), by - th + S(3), S(4), 1, P[3]); fR(x, cx + S(2), by - th + S(5), S(4), 1, P[3]); }
  const cy = by - th - cr + S(3);
  const blobs = big ? [[0, 0, cr, cr * .8], [-cr * .7, cr * .25, cr * .6, cr * .5], [cr * .7, cr * .2, cr * .6, cr * .55], [0, -cr * .45, cr * .7, cr * .5]] : [[0, 0, cr, cr * .85], [-cr * .5, cr * .3, cr * .55, cr * .45], [cr * .5, cr * .3, cr * .55, cr * .45]];
  blobs.forEach(([a, b, rx, ry]) => fEll(x, cx + a, cy + b, Math.round(rx) + 1, Math.round(ry) + 1, 'rgba(15,35,20,.8)'));
  blobs.forEach(([a, b, rx, ry]) => fEll(x, cx + a, cy + b, Math.round(rx), Math.round(ry), P[1]));
  blobs.forEach(([a, b, rx, ry]) => fEll(x, cx + a + Math.round(rx * .25), cy + b + Math.round(ry * .35), Math.round(rx * .6), Math.round(ry * .45), P[0]));
  fEll(x, cx - Math.round(cr * .35), cy - Math.round(cr * .3), Math.round(cr * .35), Math.round(cr * .25), P[2]);
  if (kind === 'ipe' || kind === 'ipeY') { fxSeed = Math.floor(sd * 1000) + 1; for (let i = 0; i < 10; i++) fP(x, cx + (fxRnd() - .5) * cr * 2.2, cy + (fxRnd() - .5) * cr * 1.4, '#fff8'); }
  if (kind === 'round' && sd > .6) [[-3, -2], [3, 1], [0, 3]].forEach(([a, b]) => fP(x, cx + S(a), cy + S(b), '#E5484D'));
}
function forestSessions(month) { return db.p.filter(p => (p.type === 'focus' || p.type === 'watch') && (p.dur || 0) >= 5 && ymd(new Date(p.start)).slice(0, 7) === month); }
function drawForestScene(x, month, grow) {
  const night = isNight(), h = new Date().getHours(), dusk = h >= 17 && h < 19;
  /* céu */
  for (let j = 0; j < 70; j++) { const t = j / 70; fR(x, 0, j, FXW, 1, night ? `rgb(${12 + 14 * t | 0},${18 + 22 * t | 0},${44 + 30 * t | 0})` : dusk ? `rgb(${120 + 120 * t | 0},${110 + 60 * t | 0},${170 - 40 * t | 0})` : `rgb(${120 + 70 * t | 0},${190 + 40 * t | 0},${240 + 10 * t | 0})`); }
  if (night) { fxSeed = 4; for (let i = 0; i < 40; i++) fP(x, fxRnd() * FXW, fxRnd() * 50, (i + FX.t) % 23 ? '#FFF6C8' : '#8a8fb8'); fEll(x, 160, 16, 5, 5, '#FFF1B8'); fEll(x, 162, 15, 4, 4, night ? '#1c2a4a' : '#fff'); }
  else { fEll(x, 160, 16, 6, 6, dusk ? '#FFB36B' : '#FFE27A'); const cx = (FX.t / 3) % 230 - 30; fEll(x, cx, 20, 6, 2, '#fff'); fEll(x, cx + 5, 19, 5, 3, '#fff'); fEll(x, (cx + 110) % 230 - 20, 30, 7, 2, 'rgba(255,255,255,.9)'); }
  /* morros */
  for (let i = 0; i < FXW; i++) { const y1 = 52 + Math.round(Math.sin(i / 22) * 5 + Math.sin(i / 9) * 2); fR(x, i, y1, 1, 70 - y1, night ? '#1E3A33' : '#7FB98A'); }
  for (let i = 0; i < FXW; i++) { const y2 = 62 + Math.round(Math.sin(i / 30 + 2) * 4); fR(x, i, y2, 1, 80 - y2, night ? '#21452F' : '#5FA765'); }
  /* chão */
  for (let j = 66; j < FXH; j++) fR(x, 0, j, FXW, 1, night ? (j % 5 ? '#24502F' : '#204829') : (j % 5 ? '#6DBB5C' : '#63B053'));
  fxSeed = 12; for (let i = 0; i < 160; i++) { const a = fxRnd() * FXW, b = 68 + fxRnd() * 52; fP(x, a, b, night ? '#2E6239' : '#86CF6E'); if (i % 9 === 0) fP(x, a, b - 1, night ? '#2E6239' : '#9BDB7F'); }
  /* trilha */
  for (let j = 70; j < FXH; j++) { const w = 3 + (j - 70) * .35, c = 96 + Math.sin(j / 7) * 6; fR(x, c - w, j, w * 2, 1, night ? '#5A4A36' : '#D9C08A'); }
  /* árvores do mês */
  const ss = forestSessions(month).map(p => { const a = hashS(p.id), b = hashS(p.id + 'y'); let px = 6 + a * (FXW - 12); const py = 72 + b * 44; const pc = 96 + Math.sin(py / 7) * 6, pw = 3 + (py - 70) * .35 + 5; if (Math.abs(px - pc) < pw) px = px < pc ? pc - pw : pc + pw; if (grow && py < 96 && Math.abs(px - 96) < 22) px = px < 96 ? 74 - (96 - px) * .3 : 118 + (px - 96) * .3; return { p, x: px, y: py }; });
  ss.sort((a, b) => a.y - b.y).forEach(o => {
    const s = .55 + (o.y - 72) / 44 * .65;
    if (o.grow) drawGrowing(x, o.x, o.y, o.grow);
    else drawTree(x, Math.round(o.x), Math.round(o.y), treeKind(o.p), s, hashS(o.p.id + 's'));
  });
  if (grow) drawGrowing(x, 96, 86, grow);
  if (night) for (let i = 0; i < 9; i++) { const a = (hashS('f' + i) * FXW + Math.sin((FX.t + i * 10) / 9) * 6) % FXW, b = 74 + hashS('g' + i) * 40 + Math.cos((FX.t + i * 7) / 7) * 3; if ((FX.t + i * 4) % 16 < 10) { fP(x, a, b, '#F5FF8A'); fP(x, a + 1, b, 'rgba(245,255,138,.4)'); } }
  return ss.filter(o => o.p).length;
}
function drawGrowing(x, cx, by, g) {
  const f = g.f, kind = g.kind;
  /* brilho em volta da árvore que está crescendo */
  x.fillStyle = 'rgba(255,240,170,.10)'; fEll(x, cx, by - 14, 22, 20, 'rgba(255,240,170,.08)');
  fEll(x, cx, by + 1, 12, 3, '#7A5232'); fEll(x, cx, by, 10, 2, '#946640');
  if (f < .12) { fEll(x, cx, by - 2, 3, 2, '#C79A5B'); fP(x, cx - 1, by - 3, '#E7C38A'); }
  else if (f < .3) drawTree(x, cx, by - 1, 'sprout', 1.4 + f * 3);
  else if (f < .55) drawTree(x, cx, by - 1, 'bush', 1 + (f - .3) * 1.6);
  else drawTree(x, cx, by - 1, kind, 1 + (f - .55) * 1.1);
  if (FS.run) [[-14, -10], [13, -16], [-9, -26], [10, -4]].forEach(([a, b], i) => { if ((FX.t + i * 5) % 20 < 12) { const yy = by + b - ((FX.t + i * 5) % 20) / 3; fP(x, cx + a, yy, '#FFF4B0'); } });
}

/* ---------- tela ---------- */
const FX_ANIMS = [['cats', '🐱', 'Gatinhos'], ['room', '🏠', 'Quartinho'], ['forest', '🌳', 'Floresta'], ['ring', '⏱️', 'Clássico']];
const fxSize = a => a === 'room' ? [RMW, RMH] : [FXW, FXH];
const RM_ACT = { desk: 'Trabalhando no computador', coffee: 'Pausa para o café', read: 'Lendo um pouco', sleep: 'Dormindo', music: 'Ouvindo música' };
function fxFrac() { const s = fLeft(), len = modeLen(FS.mode); return FS.mode === 'watch' ? Math.min(1, s / (25 * 60)) : len ? 1 - s / len : 0; }
function fxPlannedKind() { const m = FS.mode === 'watch' ? 25 : db.s.pomo.focus; return m < 15 ? 'bush' : m < 25 ? 'bush' : m < 45 ? (hashS(FS.began + '') < .5 ? 'round' : 'pine') : m < 90 ? 'big' : 'ipe'; }
function fxNextGift() {
  const c = fxCounts();
  const n = (fxAnim() === 'room' ? ROOM_ITEMS : [...HOUSE_ITEMS, ...HOUSE_WALLS, ...HOUSE_FLOORS]).filter(i => !i.rare && !fxHas(i, c)).sort((a, b) => a.need - b.need)[0];
  return n ? { it: n, left: n.need - c.s } : null;
}
function fxSceneHtml() {
  const a = fxAnim();
  if (a === 'ring') return '';
  const focusing = FS.mode === 'focus' || FS.mode === 'watch';
  const mon = FX.month || today().slice(0, 7), d = pd(mon + '-01');
  const cnt = a === 'forest' ? forestSessions(mon).length : 0;
  const ng = fxNextGift();
  const top = a === 'room' ? `<span class="fxchip">🏠 Meu quartinho · ${esc(RM_ACT[rmActivity()] || '')}</span>${ng ? `<span class="fxchip mut">🎁 ${esc(ng.it.n)} em ${plural(ng.left, 'sessão', 'sessões')}</span>` : ''}`
    : a === 'cats'
    ? `<span class="fxchip">${FS.run && focusing ? '🌙 Silêncio, estão dormindo' : `🏠 Casa dos gatinhos · ${houseItemsSet().size} itens`}</span>${ng ? `<span class="fxchip mut">🎁 ${esc(ng.it.n)} em ${plural(ng.left, 'sessão', 'sessões')}</span>` : ''}`
    : `<span class="fxchip">${FS.run ? '' : `<button class="fxnav" data-act="fxmon" data-d="-1" aria-label="Mês anterior">‹</button>`}🌳 ${esc(cap(monNames[d.getMonth()]))}${d.getFullYear() !== new Date().getFullYear() ? ' ' + d.getFullYear() : ''} · ${plural(cnt, 'árvore', 'árvores')}${FS.run || mon >= today().slice(0, 7) ? '' : `<button class="fxnav" data-act="fxmon" data-d="1" aria-label="Próximo mês">›</button>`}</span>`;
  const [cw, ch] = fxSize(a);
  return `<div class="fxwrap a-${a}${FS.run ? ' run' : ''}"><canvas id="fxcv" class="fxcv" width="${cw}" height="${ch}" aria-hidden="true"></canvas><div class="fxtop">${top}</div><button class="fxexp" data-act="fxfull" aria-label="Expandir animação para a tela cheia" title="Tela cheia">${ic('expand', 18)}</button></div>`;
}
function fxDraw() {
  const cvs = [...document.querySelectorAll('canvas.fxcv')]; if (!cvs.length) return false;
  const a = fxAnim(), focusing = FS.run && (FS.mode === 'focus' || FS.mode === 'watch');
  cvs.forEach(cv => fxDrawOn(cv, a, focusing));
  const b = $('#fxbar'); if (b) b.style.width = Math.round(fxFrac() * 100) + '%';
  fxFullTick();
  return true;
}
function fxDrawOn(cv, a, focusing) {
  const [cw, ch] = fxSize(a); if (cv.width !== cw || cv.height !== ch) { cv.width = cw; cv.height = ch; }
  const x = cv.getContext('2d'); x.imageSmoothingEnabled = false;
  try {
    if (a === 'room') drawRoomScene(x, FX.t);
    else if (a === 'cats') drawHouseScene(x, focusing);
    else if (a === 'forest') {
      const mon = FX.month || today().slice(0, 7);
      drawForestScene(x, mon, (FS.mode === 'focus' || FS.mode === 'watch') && FS.began && mon === today().slice(0, 7) ? { f: fxFrac(), kind: fxPlannedKind() } : null);
    }
  } catch (e) { console.warn('fx', e); }
}
function fxStart() { clearInterval(FX.loop); FX.loop = setInterval(() => { if ((R.v !== 'focus' && !$('#fxfull')) || document.hidden) return; FX.t++; if (!fxDraw()) { clearInterval(FX.loop); FX.loop = null; } }, 200); fxDraw(); }

/* ---------- tela cheia ---------- */
function fxFullOpen() {
  if ($('#fxfull')) return;
  const a = fxAnim() === 'ring' ? 'cats' : fxAnim(), [cw, ch] = fxSize(a);
  const el = document.createElement('div'); el.id = 'fxfull'; el.className = 'a-' + a;
  el.innerHTML = `<canvas class="fxcv" width="${cw}" height="${ch}" aria-hidden="true"></canvas>
    <div class="fxfbar" role="toolbar" aria-label="Foco"><svg class="fxfring" viewBox="0 0 32 32" aria-hidden="true"><circle cx="16" cy="16" r="13" class="bg"/><circle cx="16" cy="16" r="13" class="fg" stroke-dasharray="81.7" stroke-dashoffset="81.7" transform="rotate(-90 16 16)"/></svg><span class="fxftxt"><span class="fxclock" role="timer">${mmss(fLeft())}</span><span class="fxflabel"></span></span>
    <button class="fxfb" data-fx="play" aria-label="Iniciar ou pausar"></button><button class="fxfb" data-fx="close" aria-label="Sair da tela cheia" title="Reduzir (Esc)">${ic('shrink', 18)}</button></div>`;
  document.body.appendChild(el); document.body.classList.add('fxfull-on');
  el.addEventListener('click', e => { const b = e.target.closest('[data-fx]'); if (!b) return; if (b.dataset.fx === 'close') fxFullClose(); else { FS.run ? fPause() : fStart(); fxFullTick(); } });
  let hide; const wake = () => { el.classList.remove('idle'); clearTimeout(hide); hide = setTimeout(() => el.classList.add('idle'), 3500); };
  el.addEventListener('pointermove', wake); el.addEventListener('pointerdown', wake); wake();
  if (!isMobile() && document.documentElement.requestFullscreen) document.documentElement.requestFullscreen().catch(() => {});
  if (!FX.loop) fxStart(); fxDraw();
}
function fxFullClose() {
  const el = $('#fxfull'); if (!el) return;
  el.classList.add('out'); document.body.classList.remove('fxfull-on'); setTimeout(() => el.remove(), 200);
  if (document.fullscreenElement && document.exitFullscreen) document.exitFullscreen().catch(() => {});
}
function fxFullTick() {
  const el = $('#fxfull'); if (!el) return;
  const c = el.querySelector('.fxclock'); if (c) c.textContent = mmss(fLeft());
  const t = FS.task && get('t', FS.task), focusing = FS.mode === 'focus' || FS.mode === 'watch';
  const rg = el.querySelector('.fxfring .fg'); if (rg) rg.setAttribute('stroke-dashoffset', (81.7 * (1 - fxFrac())).toFixed(1));
  el.classList.toggle('brk', FS.mode === 'short' || FS.mode === 'long');
  const lb = el.querySelector('.fxflabel'), txt = t ? t.title : (FS.run ? (focusing ? 'Focando' : 'Pausa') : FS.began ? 'Pausado' : 'Pronto');
  if (lb && lb.textContent !== txt) lb.textContent = txt;
  const pb = el.querySelector('[data-fx=play]'), want = FS.run ? 'pause' : 'play'; if (pb && pb.dataset.ic !== want) { pb.dataset.ic = want; pb.innerHTML = ic(want, 18); }
  const cv = el.querySelector('canvas'); if (cv && (FX.t % 10 === 0 || !el.dataset.bg)) { el.dataset.bg = 1; try { const g = cv.getContext('2d'), p1 = g.getImageData(1, 1, 1, 1).data, p2 = g.getImageData(1, cv.height - 2, 1, 1).data; el.style.background = `linear-gradient(rgb(${p1[0]},${p1[1]},${p1[2]}),rgb(${p2[0]},${p2[1]},${p2[2]}))`; } catch (e) {} }
}
document.addEventListener('keydown', e => { if (e.key === 'Escape' && $('#fxfull')) fxFullClose(); });
document.addEventListener('fullscreenchange', () => { if (!document.fullscreenElement && $('#fxfull') && !isMobile()) fxFullClose(); });

/* ---------- presente ao concluir ---------- */
function fxAfterSession() {
  if (typeof ROOM_ITEMS !== 'undefined') { const c = fxCounts(), got = ROOM_ITEMS.filter(i => fxHas(i, c)).map(i => i.id), seen = db.s.roomSeen; if (!seen) db.s.roomSeen = got; else { const fresh = got.filter(k => !seen.includes(k)); if (fresh.length) { db.s.roomSeen = got; if (fxAnim() === 'room') { put('s', db.s); toast('🎁 Novo no seu quartinho: ' + fresh.map(k => ROOM_ITEMS.find(i => i.id === k).n).join(', '), 'Ver', () => roomCustom(), 8000); return; } } } }
  const hc = houseCfg(), now = houseUnlocked();
  if (!hc.seen) { db.s.house = Object.assign(hc, { seen: now }); put('s', db.s, { silent: true }); return; }
  const fresh = now.filter(k => !hc.seen.includes(k));
  if (!fresh.length) { if (fxAnim() === 'forest') toast('🌳 Uma árvore nova foi plantada na sua floresta'); return; }
  db.s.house = Object.assign(hc, { seen: now }); put('s', db.s);
  if (fxAnim() === 'forest') { toast(`🌳 Árvore plantada · e a casa dos gatinhos ganhou: ${fresh.map(fxLabel).join(', ')}`); return; }
  fxGift(fresh);
}
const fxFind = k => { const [t, id] = k.split(':'); return (t === 'i' ? HOUSE_ITEMS : t === 'w' ? HOUSE_WALLS : HOUSE_FLOORS).find(i => i.id === id); };
const fxLabel = k => { const it = fxFind(k); return it ? it.n : k; };
function fxThumb(k, w = 150, h = 110) {
  const cv = document.createElement('canvas'); cv.width = FXW; cv.height = FXH; const x = cv.getContext('2d'); x.imageSmoothingEnabled = false;
  const [t, id] = k.split(':'), hc = houseCfg(), items = houseItemsSet(); items.add(id);
  drawRoom(x, { night: false, wall: t === 'w' ? id : hc.wall, floor: t === 'f' ? id : hc.floor, items });
  const it = fxFind(k); let [bx, by, bw, bh] = t === 'i' ? it.box : t === 'w' ? [60, 0, 80, 60] : [40, 84, 100, 36];
  const asp = w / h; if (bw / bh < asp) { const nw = bh * asp; bx -= (nw - bw) / 2; bw = nw; } else { const nh = bw / asp; by -= (nh - bh) / 2; bh = nh; }
  bx = Math.max(0, Math.min(FXW - bw, bx)); by = Math.max(0, Math.min(FXH - bh, by));
  const out = document.createElement('canvas'); out.width = w * 2; out.height = h * 2; const o = out.getContext('2d'); o.imageSmoothingEnabled = false; o.drawImage(cv, bx, by, bw, bh, 0, 0, w * 2, h * 2);
  return out.toDataURL();
}
function fxGift(keys) {
  const k = keys[0], it = fxFind(k), more = keys.length - 1;
  const el = modal(`<div class="fxgift"><div class="mut sm">Sessão de foco concluída</div><h2>Você ganhou um presente! 🎁</h2>
    <img class="fxgimg" src="${fxThumb(k)}" alt="">
    <p><b>${esc(it.n)}</b>${it.rare ? ' · <span class="fxrare">raro ✨</span>' : ''}${k[0] === 'w' ? ' · papel de parede' : k[0] === 'f' ? ' · piso' : ''}${more ? `<br><span class="mut sm">e mais ${more}: ${esc(keys.slice(1).map(fxLabel).join(', '))}</span>` : ''}</p>
    <div class="row end"><button class="btn ghost" data-x>Depois</button><button class="btn red" data-go>${k[0] === 'i' ? 'Ver na casa' : 'Usar agora'}</button></div></div>`, { cls: 'fxgiftm' });
  el.querySelector('[data-x]').onclick = () => closeModal();
  el.querySelector('[data-go]').onclick = () => { const hc = houseCfg(); if (k[0] === 'w') hc.wall = it.id; if (k[0] === 'f') hc.floor = it.id; db.s.house = hc; put('s', db.s); closeModal(); if (R.v !== 'focus') go('focus'); };
}

/* ---------- decorar ---------- */
function fxDecor() {
  const c = fxCounts(), hc = houseCfg();
  const sw = (list, kind) => list.map(i => { const ok = fxHas(i, c), on = (kind === 'w' ? hc.wall : hc.floor) === i.id; return `<button class="fxsw${on ? ' on' : ''}${ok ? '' : ' lock'}" ${ok ? `data-fxset="${kind}:${i.id}"` : 'disabled'} title="${esc(ok ? i.n : 'Desbloqueia com ' + fxNeedTxt(i))}"><img src="${fxThumb(kind + ':' + i.id, 96, 64)}" alt=""><span>${esc(i.n)}${i.rare ? ' ✨' : ''}</span>${ok ? '' : `<small>🔒 ${i.rare ? i.need + ' longa(s)' : i.need + ' sessões'}</small>`}</button>`; }).join('');
  const items = HOUSE_ITEMS.map(i => { const ok = fxHas(i, c); return `<label class="fxit${ok ? '' : ' lock'}"><img src="${fxThumb('i:' + i.id, 64, 48)}" alt=""><span class="f1"><b>${esc(i.n)}${i.rare ? ' ✨' : ''}</b><small class="mut">${ok ? 'Na casa' : '🔒 ' + esc(fxNeedTxt(i))}</small></span>${ok ? `<span class="sw-t"><input type="checkbox" data-fxshow="${i.id}" ${hc.hide.includes(i.id) ? '' : 'checked'}><span></span></span>` : ''}</label>`; }).join('');
  const el = modal(`<div class="fxdec"><h2>Decorar a casa dos gatinhos</h2>
    <p class="mut sm">Você tem <b>${plural(c.s, 'sessão', 'sessões')}</b> de foco (15 min+) e <b>${plural(c.l, 'longa', 'longas')}</b> (45 min+). Cada sessão concluída aproxima um presente novo; as longas liberam os itens raros ✨.</p>
    <h3>Papel de parede</h3><div class="fxsws">${sw(HOUSE_WALLS, 'w')}</div>
    <h3>Piso</h3><div class="fxsws">${sw(HOUSE_FLOORS, 'f')}</div>
    <h3>Móveis e objetos</h3><div class="fxits">${items}</div>
    <div class="row end"><button class="btn red" data-x>Pronto</button></div></div>`, { cls: 'fxdecm' });
  el.querySelector('[data-x]').onclick = () => closeModal();
  el.querySelectorAll('[data-fxset]').forEach(b => b.onclick = () => { const [k, id] = b.dataset.fxset.split(':'); const h = houseCfg(); if (k === 'w') h.wall = id; else h.floor = id; db.s.house = h; put('s', db.s, { silent: true }); el.querySelectorAll(`[data-fxset^="${k}:"]`).forEach(x => x.classList.toggle('on', x === b)); fxDraw(); });
  el.querySelectorAll('[data-fxshow]').forEach(i => i.onchange = () => { const h = houseCfg(); h.hide = h.hide.filter(x => x !== i.dataset.fxshow); if (!i.checked) h.hide.push(i.dataset.fxshow); db.s.house = h; put('s', db.s, { silent: true }); fxDraw(); });
}
Object.assign(ACTS, {
  fxanim: b => { db.s.fx = Object.assign(fxCfg(), { anim: b.dataset.k }); put('s', db.s); },
  fxdecor: () => fxDecor(),
  fxfull: () => ($('#fxfull') ? fxFullClose() : fxFullOpen()),
  fxmon: b => { const cur = FX.month || today().slice(0, 7); const d = pd(cur + '-01'); d.setMonth(d.getMonth() + (+b.dataset.d)); const m = ymd(d).slice(0, 7); FX.month = m > today().slice(0, 7) ? null : m; render(true); },
});
