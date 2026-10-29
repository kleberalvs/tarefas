/* Quartinho: um quarto isométrico em pixel art (estilo diorama) com o seu personagem e um pet.
   Animação do Foco: o personagem trabalha no computador durante o foco, toma café na pausa, lê ou dorme quando o app está parado.
   Personalizável (papel de parede, piso, personagem, pet) e com móveis desbloqueados pelas sessões de foco (mesma contagem da Casa dos gatinhos). */
'use strict';
const RMW = 336, RMH = 210;
const RM = { cache: null, key: '', pet: { x: 26, y: 30, tx: 26, ty: 30, wait: 0, dir: 1 } };
const ROOM_DEF = { wall: 'creme', floor: 'carvalho', hair: 'castanho', style: 'curto', skin: 'morena', shirt: 'azul', beard: true, glasses: false, pet: 'gato', petColor: 'laranja', hide: [] };
const roomCfg = () => Object.assign({}, ROOM_DEF, db.s.room || {});
const RM_WALLS = { creme: ['Creme', '#F4E2C6', '#E7CFAE'], menta: ['Menta', '#D3EBDD', '#BFDCCB'], ceu: ['Azul-céu', '#D6E6F6', '#C0D5EC'], rosa: ['Rosa', '#F6DCE3', '#EBC4CF'], lavanda: ['Lavanda', '#E3DCF4', '#D1C7EC'], noite: ['Azul-noite', '#3A4470', '#323B63'], verde: ['Verde-oliva', '#C9D3A4', '#B8C390'] };
const RM_FLOORS = { carvalho: ['Carvalho', '#D9A46B'], nogueira: ['Nogueira', '#9C6A44'], clara: ['Madeira clara', '#E8C79A'], cinza: ['Cinza', '#B7B4B0'], verde: ['Carpete verde', '#7FA77A'] };
const RM_HAIR = { castanho: '#2B1D16', preto: '#16110F', loiro: '#E3B35B', ruivo: '#B5512A', grisalho: '#A9A5A0', rosa: '#E58FB3', azul: '#5B7FD6' };
const RM_SKIN = { clara: '#F2CBA8', media: '#E2AF84', morena: '#C98E62', escura: '#8A5A3C' };
const RM_SHIRT = { azul: '#3D5A80', vermelha: '#C2524A', verde: '#4E8A5A', amarela: '#E0B33A', preta: '#2C2C34', branca: '#EDEAE4', roxa: '#7B5BB5' };
const RM_STYLES = { curto: 'Curto', longo: 'Longo', coque: 'Coque', careca: 'Careca', cacheado: 'Cacheado' };
const ROOM_ITEMS = [
  { id: 'rug', n: 'Tapete redondo', need: 1 }, { id: 'plant', n: 'Planta', need: 2 }, { id: 'mug', n: 'Caneca de café', need: 3 },
  { id: 'shelf', n: 'Prateleira com livros', need: 4 }, { id: 'picture', n: 'Quadro', need: 6 }, { id: 'lamp', n: 'Abajur de chão', need: 8 },
  { id: 'pouf', n: 'Pufe', need: 10 }, { id: 'lights', n: 'Varal de luzinhas', need: 13 }, { id: 'clock', n: 'Relógio de parede', need: 16 },
  { id: 'poster', n: 'Pôster', need: 20 }, { id: 'books', n: 'Pilha de livros', need: 25 },
  { id: 'guitar', n: 'Violão', rare: 1, need: 1 }, { id: 'vinyl', n: 'Vitrola', rare: 1, need: 3 }, { id: 'fishbowl', n: 'Aquário', rare: 1, need: 6 },
];
const roomHas = (cfg, c) => { const s = new Set(); ROOM_ITEMS.forEach(i => { if (fxHas(i, c) && !cfg.hide.includes(i.id)) s.add(i.id); }); return s; };

/* ---------- desenho isométrico ---------- */
const RO = { ox: 168, oy: 100 };
const isoP = (a, b, c) => [RO.ox + (a - b) * 2, RO.oy + (a + b) - c * 2];
function rmShade(h, k) { const n = parseInt(h.slice(1), 16), f = v => Math.max(0, Math.min(255, Math.round(v * k))); return '#' + [n >> 16, n >> 8 & 255, n & 255].map(v => f(v).toString(16).padStart(2, '0')).join(''); }
function rmMix(a, b, t) { const A = parseInt(a.slice(1), 16), B = parseInt(b.slice(1), 16); const c = [16, 8, 0].map(s => Math.round(((A >> s) & 255) * (1 - t) + ((B >> s) & 255) * t)); return '#' + c.map(v => v.toString(16).padStart(2, '0')).join(''); }
function rmCtx(x) {
  const px = (a, b, col) => { x.fillStyle = col; x.fillRect(Math.round(a), Math.round(b), 1, 1); };
  const fill = (pts, col) => {
    const xs = pts.map(p => p[0]), ys = pts.map(p => p[1]);
    const x0 = Math.floor(Math.min(...xs)), x1 = Math.ceil(Math.max(...xs)), y0 = Math.floor(Math.min(...ys)), y1 = Math.ceil(Math.max(...ys));
    x.fillStyle = col;
    for (let j = y0; j <= y1; j++) { let run = -1; for (let i = x0; i <= x1 + 1; i++) { let ins = false; if (i <= x1) { const cx = i + .5, cy = j + .5; let pos = 0, neg = 0; for (let k = 0; k < pts.length; k++) { const [ax, ay] = pts[k], [bx, by] = pts[(k + 1) % pts.length]; const cr = (bx - ax) * (cy - ay) - (by - ay) * (cx - ax); if (cr > .001) pos++; else if (cr < -.001) neg++; } ins = !pos || !neg; } if (ins && run < 0) run = i; if (!ins && run >= 0) { x.fillRect(run, j, i - run, 1); run = -1; } } }
  };
  const line = (a, b, col) => { let [x0, y0] = a.map(Math.round), [x1, y1] = b.map(Math.round); const dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0), sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1; let e = dx + dy; x.fillStyle = col; for (let k = 0; k < 600; k++) { x.fillRect(x0, y0, 1, 1); if (x0 === x1 && y0 === y1) break; const e2 = 2 * e; if (e2 >= dy) { e += dy; x0 += sx; } if (e2 <= dx) { e += dx; y0 += sy; } } };
  const quad = (pts, col, edge) => { fill(pts, col); if (edge) for (let k = 0; k < pts.length; k++) line(pts[k], pts[(k + 1) % pts.length], edge); };
  /* caixa com 3 faces; luz vindo da esquerda: topo claro, face esquerda média, face direita escura; contorno em tom escuro da própria cor */
  const box = (a0, b0, c0, da, db, dc, col, o = {}) => {
    const a1 = a0 + da, b1 = b0 + db, c1 = c0 + dc, top = o.top || rmShade(col, 1.12), L = o.left || rmShade(col, .9), Rr = o.right || rmShade(col, .72), ed = o.edge || rmShade(col, .45);
    quad([isoP(a1, b0, c0), isoP(a1, b1, c0), isoP(a1, b1, c1), isoP(a1, b0, c1)], Rr, ed);
    quad([isoP(a0, b1, c0), isoP(a1, b1, c0), isoP(a1, b1, c1), isoP(a0, b1, c1)], L, ed);
    quad([isoP(a0, b0, c1), isoP(a1, b0, c1), isoP(a1, b1, c1), isoP(a0, b1, c1)], top, ed);
    if (!o.noHi) { line(isoP(a0, b1, c1), isoP(a1, b1, c1), rmShade(col, 1.28)); }
  };
  const disc = (a, b, c, r, col, k = .03) => { for (let u = -1; u <= 1; u += k) for (let v = -1; v <= 1; v += k) if (u * u + v * v <= 1) { const p = isoP(a + u * r, b + v * r, c); px(p[0], p[1], col); } };
  return { px, fill, line, quad, box, disc };
}

/* ---------- fundo da cena ---------- */
function rmBackground(x, night, t) {
  const g = x.createLinearGradient(0, 0, 0, RMH);
  if (night) { g.addColorStop(0, '#1B2147'); g.addColorStop(1, '#2E2A5C'); } else { g.addColorStop(0, '#FFE9B8'); g.addColorStop(1, '#F7CF86'); }
  x.fillStyle = g; x.fillRect(0, 0, RMW, RMH);
  if (night) { let s = 5; const r = () => (s = (s * 9301 + 49297) % 233280) / 233280; for (let i = 0; i < 70; i++) { const a = r() * RMW, b = r() * RMH; x.fillStyle = (i + Math.floor(t / 3)) % 11 ? 'rgba(255,246,200,.75)' : 'rgba(255,246,200,.25)'; x.fillRect(a | 0, b | 0, 1, 1); if (i % 13 === 0) { x.fillRect((a | 0) - 1, b | 0, 3, 1); x.fillRect(a | 0, (b | 0) - 1, 1, 3); } } }
  else { x.fillStyle = 'rgba(255,255,255,.35)'; for (let i = 0; i < 4; i++) { const cx = ((t * .25 + i * 97) % (RMW + 60)) - 30, cy = 18 + i * 41 % 140; x.fillRect(cx | 0, cy, 22, 3); x.fillRect((cx | 0) + 5, cy - 3, 12, 3); } }
}

/* ---------- quarto estático (paredes, chão e móveis) ---------- */
function rmStatic(x, cfg, items, night) {
  const D = rmCtx(x), { box, quad, line, px, disc } = D, X = 48, Y = 48, Z = 34;
  const N = night ? .7 : 1, nc = c => rmShade(c, N);
  const wall = RM_WALLS[cfg.wall] || RM_WALLS.creme, floorC = (RM_FLOORS[cfg.floor] || RM_FLOORS.carvalho)[1];
  /* sombra da maquete */
  x.fillStyle = 'rgba(80,50,20,.18)'; const s0 = isoP(X + 4, Y + 4, -6); x.beginPath(); x.ellipse(RO.ox, s0[1] - 46, 104, 30, 0, 0, Math.PI * 2); x.fill();
  /* base */
  box(-3, -3, -5, X + 3, Y + 3, 5, nc('#8C5A3C'), { top: nc('#A06C48') });
  for (let a = 0; a < X; a += 6) line(isoP(a, Y, -5), isoP(a, Y, -.3), nc('#6E4428'));
  for (let b = 0; b < Y; b += 6) line(isoP(X, b, -5), isoP(X, b, -.3), nc('#5A3820'));
  /* paredes grossas */
  box(-3, 0, 0, 3, Y, Z, nc(wall[1]), { top: nc(rmShade(wall[1], 1.15)), right: nc(wall[1]), left: nc(rmShade(wall[1], .82)) });
  box(-3, -3, 0, X + 3, 3, Z, nc(wall[1]), { top: nc(rmShade(wall[1], 1.15)), left: nc(rmShade(wall[1], .93)), right: nc(rmShade(wall[1], .75)) });
  /* papel de parede: listras suaves + rodapé + moldura de teto */
  for (let b = 3; b < Y; b += 4) quad([isoP(0, b, 2), isoP(0, b + 2, 2), isoP(0, b + 2, Z), isoP(0, b, Z)], nc(rmMix(wall[1], wall[2], .55)));
  for (let a = 3; a < X; a += 4) quad([isoP(a, 0, 2), isoP(a + 2, 0, 2), isoP(a + 2, 0, Z), isoP(a, 0, Z)], nc(rmMix(rmShade(wall[1], .93), wall[2], .6)));
  quad([isoP(0, 0, 0), isoP(0, Y, 0), isoP(0, Y, 2.2), isoP(0, 0, 2.2)], nc('#FFF6E8')); line(isoP(0, 0, 2.2), isoP(0, Y, 2.2), nc('#D8C4A8'));
  quad([isoP(0, 0, 0), isoP(X, 0, 0), isoP(X, 0, 2.2), isoP(0, 0, 2.2)], nc('#EFE3D0')); line(isoP(0, 0, 2.2), isoP(X, 0, 2.2), nc('#CDB898'));
  /* chão de tacos */
  quad([isoP(0, 0, 0), isoP(X, 0, 0), isoP(X, Y, 0), isoP(0, Y, 0)], nc(floorC));
  const wood = cfg.floor !== 'cinza' && cfg.floor !== 'verde';
  for (let b = 0; b < Y; b += 4) { line(isoP(0, b, 0), isoP(X, b, 0), nc(rmShade(floorC, .84))); if (wood) for (let a = (b / 4 % 2) * 8 + 4; a < X; a += 16) line(isoP(a, b, 0), isoP(a, b + 4, 0), nc(rmShade(floorC, .84))); if (wood && b % 8 === 0) for (let a = 6; a < X; a += 16) line(isoP(a, b + 1.5, 0), isoP(a + 5, b + 1.5, 0), nc(rmShade(floorC, 1.08))); }
  if (!wood && cfg.floor === 'cinza') for (let a = 0; a < X; a += 8) line(isoP(a, 0, 0), isoP(a, Y, 0), nc(rmShade(floorC, .88)));
  /* sombra de contato parede-chão */
  line(isoP(.5, 0, 0), isoP(.5, Y, 0), nc(rmShade(floorC, .7))); line(isoP(0, .5, 0), isoP(X, .5, 0), nc(rmShade(floorC, .7)));
  /* janela grande (parede esquerda) */
  const w0 = 27, w1 = 43, z0 = 10, z1 = 29;
  quad([isoP(0, w0 - 1.5, z0 - 1.5), isoP(0, w1 + 1.5, z0 - 1.5), isoP(0, w1 + 1.5, z1 + 1.5), isoP(0, w0 - 1.5, z1 + 1.5)], nc('#FFFFFF'), nc('#CBB89C'));
  quad([isoP(0, w0, z0), isoP(0, w1, z0), isoP(0, w1, z1), isoP(0, w0, z1)], night ? '#1A2253' : '#9FDAF5');
  if (night) { [[30, 26], [34, 22], [39, 27], [36, 15], [31, 14], [41, 18], [29, 20]].forEach(([b, c]) => { const p = isoP(0, b, c); px(p[0], p[1], '#FFF4C0'); }); const m = isoP(0, 39, 24); x.fillStyle = '#FFF1B8'; x.fillRect(m[0] - 2, m[1] - 3, 5, 5); x.fillStyle = '#1A2253'; x.fillRect(m[0], m[1] - 4, 4, 4);
    for (let b = w0; b < w1; b += 2) { const h = 3 + (b * 7 % 6); quad([isoP(0, b, z0), isoP(0, b + 2, z0), isoP(0, b + 2, z0 + h), isoP(0, b, z0 + h)], '#252C5E'); if (b % 4 === 1) { const p = isoP(0, b + 1, z0 + h - 1.5); px(p[0], p[1], '#FFD36E'); } } }
  else { for (let b = w0; b < w1; b += 2) { const h = 3 + (b * 7 % 6); quad([isoP(0, b, z0), isoP(0, b + 2, z0), isoP(0, b + 2, z0 + h), isoP(0, b, z0 + h)], '#86B6D2'); } [[31, 25], [33, 25.6], [35, 25]].forEach(([b, c]) => { const p = isoP(0, b, c); x.fillStyle = '#fff'; x.fillRect(p[0] - 3, p[1] - 1, 7, 2); }); }
  line(isoP(.1, (w0 + w1) / 2, z0), isoP(.1, (w0 + w1) / 2, z1), '#FFFFFF'); line(isoP(.1, w0, (z0 + z1) / 2), isoP(.1, w1, (z0 + z1) / 2), '#FFFFFF');
  box(0, w0 - 2, z0 - 3, 3, w1 - w0 + 4, 1.4, nc('#FFFFFF'), { edge: nc('#BBA88C') });
  /* cortinas com dobras */
  [[w0 - 4.5, w0 - .5], [w1 + .5, w1 + 4.5]].forEach(([b0, b1]) => { for (let b = b0; b < b1; b += 1) quad([isoP(.4, b, z0 - 4), isoP(.4, b + 1, z0 - 4), isoP(.4, b + 1, z1 + 3), isoP(.4, b, z1 + 3)], nc(Math.round(b) % 2 ? '#E57F7F' : '#D46A6A')); line(isoP(.4, b0, z0 - 4), isoP(.4, b1, z0 - 4), nc('#A84848')); });
  line(isoP(.6, w0 - 6, z1 + 3.5), isoP(.6, w1 + 6, z1 + 3.5), nc('#6B4428'));
  /* pôster acima da mesa */
  if (items.has('poster')) { quad([isoP(0, 8, 18), isoP(0, 18, 18), isoP(0, 18, 30), isoP(0, 8, 30)], nc('#2E3A5A'), nc('#1B2238')); const p = isoP(0, 13, 25); x.fillStyle = nc('#F2C94C'); x.fillRect(p[0] - 3, p[1] - 3, 7, 6); x.fillStyle = nc('#E86F4A'); x.fillRect(p[0] - 1, p[1] + 3, 3, 4); }
  /* relógio de parede (parede direita) */
  /* quadro */
  if (items.has('picture')) { quad([isoP(27, 0, 17), isoP(40, 0, 17), isoP(40, 0, 28), isoP(27, 0, 28)], nc('#6B4428'), nc('#3E2616')); quad([isoP(28, 0, 18), isoP(39, 0, 18), isoP(39, 0, 27), isoP(28, 0, 27)], nc('#F8D08A')); quad([isoP(28, 0, 18), isoP(39, 0, 18), isoP(39, 0, 21.5), isoP(28, 0, 21.5)], nc('#76B06A')); quad([isoP(30, 0, 21.5), isoP(34, 0, 21.5), isoP(32, 0, 25.5)], nc('#5C8E50')); const p = isoP(36, 0, 25); x.fillStyle = nc('#F7F3E8'); x.fillRect(p[0] - 1, p[1] - 1, 3, 2); }
  /* prateleira com livros */
  if (items.has('shelf')) {
    box(5, 0, 21, 16, 3.5, 1.2, nc('#8A5A36'));
    [['#D9534F', 5], ['#4A90D9', 4], ['#F2C94C', 6], ['#5CB85C', 4.5], ['#8E6BC7', 5.5]].forEach(([c, h], i) => box(6 + i * 1.8, .6, 22.2, 1.5, 2.6, h, nc(c), { noHi: 1 }));
    box(16, .6, 22.2, 3.5, 2.6, 2.4, nc('#EEE6D6')); const p = isoP(17.6, 1.9, 24.6); x.fillStyle = nc('#4FA85A'); x.fillRect(p[0] - 2, p[1] - 3, 5, 3); x.fillRect(p[0] - 1, p[1] - 5, 3, 2); x.fillStyle = nc('#7CC46B'); x.fillRect(p[0], p[1] - 5, 1, 1);
  }
  /* luzinhas */
  if (items.has('lights')) { for (let a = 0; a <= X; a += 1) { const p = isoP(a, 0, Z - 2.5 - Math.abs(Math.sin(a / 8)) * 2.5); px(p[0], p[1], nc('#5a4a3c')); } for (let b = 0; b <= Y; b += 1) { const p = isoP(0, b, Z - 2.5 - Math.abs(Math.sin(b / 8)) * 2.5); px(p[0], p[1], nc('#5a4a3c')); } }
  /* tapete */
  if (items.has('rug')) { for (let u = -1; u <= 1; u += .015) for (let v = -1; v <= 1; v += .015) { const d = u * u + v * v; if (d > 1) continue; const p = isoP(27 + u * 11, 30 + v * 11, 0); px(p[0], p[1], nc(d > .8 ? '#3E6FA8' : d > .62 ? '#F4E3C3' : d > .3 ? '#5B8CC6' : '#6E9DD2')); } }
  /* abajur */
  if (items.has('lamp')) { box(1, 1, 0, 3, 3, .8, nc('#3a3a3a')); box(2.2, 2.2, .8, .7, .7, 15, nc('#444')); box(.4, .4, 15.8, 4.2, 4.2, 4.2, night ? '#FFE3A8' : nc('#F2D7A6'), { edge: nc('#B49A6A') }); }
  /* violão encostado */
  if (items.has('guitar')) { const p = isoP(23.5, 2, 0); x.fillStyle = nc('#6B3F22'); x.fillRect(p[0] - 1, p[1] - 30, 3, 14); x.fillStyle = nc('#C98B4A'); for (let j = 0; j < 14; j++) { const w = j < 6 ? 4 : 5; x.fillRect(p[0] - w + 1, p[1] - 16 + j, w * 2 - 1, 1); } x.fillStyle = nc('#3a2210'); x.fillRect(p[0], p[1] - 10, 2, 2); x.fillStyle = nc('#2a1a10'); x.fillRect(p[0] - 1, p[1] - 32, 3, 3); }
  /* mesa com computador (parede esquerda) */
  [[1, 6], [8, 6], [1, 22], [8, 22]].forEach(([a, b]) => box(a, b, 0, 1.2, 1.2, 10, nc('#7A4E2E'), { noHi: 1 }));
  box(7, 14, 4, 2.2, 8, 6, nc('#8F6038')); line(isoP(9.2, 15, 7.2), isoP(9.2, 21, 7.2), nc('#5E3B20'));
  box(0, 5, 10, 10, 19, 1.4, nc('#B47A45'), { top: nc('#C68A52') });
  for (let b = 6; b < 24; b += 3) line(isoP(1, b, 11.4), isoP(9, b + .5, 11.4), nc('#B07443'));
  box(1, 10, 11.4, 1.6, 8, 8.5, nc('#34343E'));
  box(1.6, 13.5, 11.4, 1.2, 1.2, 1.2, nc('#2a2a30'), { noHi: 1 });
  box(4, 10.5, 11.4, 2.6, 6.5, .6, nc('#DADAE4'));
  box(4.3, 18.5, 11.4, 1.8, 2.4, .5, nc('#C9C9D4'));
  /* cama (parede direita, cabeceira atrás) */
  box(27, 0, 0, 21, 15, 4.5, nc('#9C6A44'));
  box(27, .5, 4.5, 20.5, 14, 3, nc('#F7F2EA'));
  box(26, 0, 0, 1.4, 15, 15, nc('#8A5A36'));
  box(28, 2, 7.5, 5.5, 11, 2.2, nc('#FFFFFF'), { edge: nc('#C9C2B4') });
  box(33.5, -.2, 7.4, 14.3, 15.4, 1.4, nc(cfg.blanket || '#5B8CC6'));
  for (let a = 35; a < 47; a += 3) line(isoP(a, 15.2, 8.8), isoP(a, 15.2, 7.4), nc('#4A78AE'));
  box(47.2, 0, 0, .9, 15, 8, nc('#8A5A36'));
  /* vitrola */
  if (items.has('vinyl')) { box(0, 42, 0, 6, 6, 7, nc('#8A5A36')); box(.8, 42.8, 7, 4.4, 4.4, 1, nc('#2E2E34')); disc(3, 45, 8.1, 1.8, '#111'); const p = isoP(3, 45, 8.1); px(p[0], p[1], '#E2557A'); }
  /* planta grande */
  if (items.has('plant')) { box(41, 19, 0, 5, 5, 5, nc('#C0623B'), { top: nc('#6B4428') }); const p = isoP(43.5, 21.5, 5); const L = [[0, -12, 6, '#3E8E4A'], [-6, -8, 5, '#4FA85A'], [6, -7, 5, '#3E8E4A'], [-3, -18, 4, '#4FA85A'], [4, -16, 4, '#5DB866'], [0, -22, 3, '#3E8E4A']]; L.forEach(([a, b, r]) => { for (let j = -r - 1; j <= r + 1; j++) for (let i = -r - 1; i <= r + 1; i++) if (i * i + j * j <= (r + 1) * (r + 1)) px(p[0] + a + i, p[1] + b + j, nc('#1F4A28')); }); L.forEach(([a, b, r, c]) => { for (let j = -r; j <= r; j++) for (let i = -r; i <= r; i++) if (i * i + j * j <= r * r) px(p[0] + a + i, p[1] + b + j, nc(c)); }); [[-2, -14], [4, -18], [-6, -10], [2, -9]].forEach(([a, b]) => px(p[0] + a, p[1] + b, nc('#8AD27A'))); }
  /* pufe */
  if (items.has('pouf')) { for (let hh = 0; hh < 6; hh++) disc(41, 41, hh * .6, 4, nc(hh === 5 ? '#F2C94C' : hh === 0 ? '#9C7420' : '#D9A72E'), .05); }
  /* pilha de livros */
  if (items.has('books')) { [['#C2524A', 0], ['#4A90D9', 1.1], ['#5CB85C', 2.2]].forEach(([c, z], i) => box(13 + i * .3, 40 - i * .2, z, 4, 3, 1.1, nc(c), { noHi: 1 })); }
}
function rmKey(cfg, items, night) { return JSON.stringify([cfg.wall, cfg.floor, cfg.blanket, [...items].sort(), night]); }

/* ---------- personagem ---------- */
function rmChar(cfg) { return { H: RM_HAIR[cfg.hair] || RM_HAIR.castanho, S: RM_SKIN[cfg.skin] || RM_SKIN.morena, T: RM_SHIRT[cfg.shirt] || RM_SHIRT.azul, P: '#4B4F5C', F: '#2A2A2E', beard: cfg.beard, glasses: cfg.glasses, style: cfg.style || 'curto' }; }
function rmSprite(w, h, draw, night) {
  const c = document.createElement('canvas'); c.width = w; c.height = h; const g = c.getContext('2d'); const r = (a, b, ww, hh, col) => { g.fillStyle = col; g.fillRect(a, b, ww, hh); };
  draw(r);
  const d = g.getImageData(0, 0, w, h).data, op = (i, j) => i >= 0 && j >= 0 && i < w && j < h && d[(j * w + i) * 4 + 3] > 200; g.fillStyle = '#24170F';
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) if (!op(i, j) && (op(i + 1, j) || op(i - 1, j) || op(i, j + 1) || op(i, j - 1))) g.fillRect(i, j, 1, 1);
  if (night) { g.globalCompositeOperation = 'source-atop'; g.fillStyle = 'rgba(25,20,70,.22)'; g.fillRect(0, 0, w, h); }
  return c;
}
/* cabelo de costas (3/4) */
function rmHairBack(r, C, a, b, bob) {
  const H = C.H, h2 = rmShade(H, 1.35);
  if (C.style === 'careca') { r(a, b + 1, 9, 7, C.S); r(a + 1, b + 1, 4, 1, rmShade(C.S, 1.1)); r(a, b + 5, 9, 2, rmShade(H, 1)); return; }
  r(a, b + 1, 9, 8, H); r(a + 1, b, 7, 1, H); r(a + 2, b + 1, 4, 1, h2); r(a + 1, b + 2, 2, 1, h2);
  if (C.style === 'longo') r(a, b + 8, 9, 5, H);
  if (C.style === 'coque') { r(a + 3, b - 3, 4, 3, H); r(a + 4, b - 3, 1, 1, h2); }
  if (C.style === 'cacheado') { [[-1, 1], [9, 2], [-1, 5], [9, 6], [2, -1], [6, -1]].forEach(([u, v]) => r(a + u, b + v, 1, 2, H)); r(a + 3, b + 3, 1, 1, h2); r(a + 6, b + 5, 1, 1, h2); }
}
function rmCharDesk(C, t, night) {
  return rmSprite(26, 32, r => {
    const k = Math.floor(t / 2) % 2;
    /* pernas (sentado, para a esquerda) */
    r(4, 24, 10, 3, C.P); r(4, 26, 10, 1, rmShade(C.P, .8));
    /* tronco de costas */
    r(9, 14, 10, 11, C.T); r(9, 14, 2, 11, rmShade(C.T, .8)); r(17, 15, 2, 9, rmShade(C.T, 1.15)); r(13, 14, 2, 1, rmShade(C.T, .7));
    /* braços para a mesa */
    r(5, 16, 5, 3, C.T); r(5, 18, 5, 1, rmShade(C.T, .8)); r(2, 15 + k, 3, 2, C.S); r(16, 18, 3, 3, C.T); r(13, 19, 4, 2, rmShade(C.T, .85));
    /* pescoço e cabeça */
    r(12, 12, 4, 2, rmShade(C.S, .9));
    rmHairBack(r, C, 10, 4, 0);
    if (C.style !== 'careca') { r(17, 8, 2, 3, C.S); r(17, 9, 1, 1, rmShade(C.S, .85)); }
    if (C.beard) r(16, 11, 3, 2, rmShade(C.H, 1.1));
    if (C.glasses) r(17, 7, 2, 1, '#1d1d1d');
  }, night);
}
function rmCharFront(C, t, night, o = {}) {
  return rmSprite(24, 36, r => {
    const blink = t % 40 < 2, bob = o.music ? (Math.floor(t / 3) % 2) : 0;
    r(7, 27, 4, 7, C.P); r(13, 27, 4, 7, rmShade(C.P, .85)); r(6, 33, 5, 2, C.F); r(13, 33, 5, 2, C.F);
    r(6, 15, 12, 13, C.T); r(6, 15, 2, 13, rmShade(C.T, .82)); r(10, 15, 4, 2, rmShade(C.T, .7)); r(11, 15, 2, 1, C.S);
    r(4, 16, 2, 9, C.T); r(4, 25, 2, 2, C.S);
    if (o.mug) { r(18, 16, 2, 5, C.T); r(14, 20, 6, 2, C.S); r(12, 17, 4, 5, '#EDE6D8'); r(12, 17, 4, 1, '#6B3F22'); r(16, 18, 1, 2, '#EDE6D8'); }
    else { r(18, 16, 2, 9, C.T); r(18, 25, 2, 2, C.S); }
    const hy = 5 + bob;
    r(7, hy + 1, 10, 9, C.S); r(7, hy + 7, 10, 1, rmShade(C.S, .92));
    if (C.style !== 'careca') { r(7, hy, 10, 3, C.H); r(6, hy + 1, 1, 5, C.H); r(17, hy + 1, 1, 5, C.H); r(9, hy, 4, 1, rmShade(C.H, 1.35)); }
    if (C.style === 'longo') { r(6, hy + 3, 2, 10, C.H); r(16, hy + 3, 2, 10, C.H); }
    if (C.style === 'coque') r(10, hy - 3, 4, 3, C.H);
    if (C.style === 'cacheado') { r(6, hy - 1, 12, 2, C.H); r(5, hy + 1, 1, 4, C.H); r(18, hy + 1, 1, 4, C.H); }
    if (blink || o.closed) { r(9, hy + 5, 2, 1, '#2a1a12'); r(13, hy + 5, 2, 1, '#2a1a12'); } else { r(9, hy + 4, 2, 2, '#2a1a12'); r(13, hy + 4, 2, 2, '#2a1a12'); r(9, hy + 4, 1, 1, '#fff'); r(13, hy + 4, 1, 1, '#fff'); }
    if (C.glasses) { r(8, hy + 4, 4, 1, '#1d1d1d'); r(12, hy + 4, 4, 1, '#1d1d1d'); r(8, hy + 5, 1, 1, '#1d1d1d'); r(15, hy + 5, 1, 1, '#1d1d1d'); }
    r(11, hy + 7, 2, 1, rmShade(C.S, .75));
    if (C.beard) { r(7, hy + 7, 1, 2, C.H); r(16, hy + 7, 1, 2, C.H); r(8, hy + 8, 8, 2, C.H); r(10, hy + 8, 4, 1, rmShade(C.S, .7)); }
    r(8, hy + 6, 1, 1, rmShade(C.S, 1.0)); r(15, hy + 6, 1, 1, rmShade(C.S, 1.0));
    if (o.music) { r(5, hy - 1, 14, 1, '#E2557A'); r(4, hy + 3, 2, 4, '#E2557A'); r(18, hy + 3, 2, 4, '#E2557A'); }
  }, night);
}
/* ---------- pet ---------- */
function rmPetSprite(cfg, pose, t, night) {
  const dog = cfg.pet === 'cachorro';
  const pal = dog ? { b: { caramelo: '#C98B4A', preto: '#2E2A2A', branco: '#F2EEE6', cinza: '#9A9AA4' }[cfg.petColor] || '#C98B4A' } : null;
  const cp = dog ? null : catPal(cfg.petColor || 'laranja');
  const B = dog ? pal.b : cp.b, D = dog ? rmShade(pal.b, .75) : cp.d, L = dog ? rmMix(pal.b, '#ffffff', .6) : cp.l;
  return rmSprite(18, 13, r => {
    const br = Math.floor(t / 4) % 2;
    if (pose === 'sleep') { r(3, 6 - br, 11, 5 + br, B); r(2, 8, 3, 3, B); r(11, 4 - br, 5, 5, B); r(11 + (dog ? 0 : 0), 3 - br, 1, 2, dog ? D : B); r(15, 3 - br, 1, 2, dog ? D : B); r(12, 6 - br, 1, 1, '#2a1a12'); r(14, 6 - br, 1, 1, '#2a1a12'); if (!dog) { r(5, 7 - br, 1, 3, D); r(8, 6 - br, 1, 4, D); } r(1, 10, 7, 1, B); r(12, 8 - br, 3, 1, L); return; }
    const step = pose === 'walk' ? Math.floor(t / 2) % 2 : 0;
    r(3, 5, 10, 5, B); r(4, 9, 8, 1, L);
    r(4, 10, 2, 2 + step, B); r(10, 10, 2, 3 - step, B); r(7, 10, 2, 3 - step, D); r(12, 10, 1, 2 + step, D);
    r(11, 1, 6, 6, B); r(12, 5, 4, 2, L); r(12, 3, 1, 1, '#2a1a12'); r(15, 3, 1, 1, '#2a1a12');
    if (dog) { r(10, 1, 2, 4, D); r(16, 1, 2, 4, D); r(16, 5, 2, 1, '#2a1a12'); } else { r(11, 0, 1, 2, B); r(16, 0, 1, 2, B); r(12, 0, 1, 1, cp.p || '#F39AA3'); r(15, 0, 1, 1, cp.p || '#F39AA3'); r(5, 5, 1, 4, D); r(8, 5, 1, 4, D); }
    r(1, dog ? 5 : 3 + (Math.floor(t / 5) % 2), 2, dog ? 2 : 3, B); r(0, dog ? 4 : 2 + (Math.floor(t / 5) % 2), 1, 2, B);
  }, night);
}

/* ---------- cena completa ---------- */
function rmActivity() {
  const h = new Date().getHours(), focusing = FS.run && (FS.mode === 'focus' || FS.mode === 'watch'), resting = FS.run && !focusing;
  if (focusing) return 'desk';
  if (resting) return 'coffee';
  if (h >= 23 || h < 6) return 'sleep';
  const music = typeof db !== 'undefined' && db.s.pomo && db.s.pomo.amb && db.s.pomo.amb !== 'none' && typeof AMB_PREVIEW !== 'undefined' && AMB_PREVIEW;
  return music ? 'music' : 'read';
}
function drawRoomScene(x, t) {
  const cfg = roomCfg(), items = roomHas(cfg, fxCounts()), hNow = new Date().getHours(), night = hNow >= 18 || hNow < 6;
  rmBackground(x, night, t);
  const key = rmKey(cfg, items, night);
  if (RM.key !== key || !RM.cache) { const c = document.createElement('canvas'); c.width = RMW; c.height = RMH; const g = c.getContext('2d'); rmStatic(g, cfg, items, night); RM.cache = c; RM.key = key; }
  x.drawImage(RM.cache, 0, 0);
  const D = rmCtx(x), C = rmChar(cfg), act = rmActivity(), N = night ? .7 : 1, nc = c => rmShade(c, N);
  /* tela do computador */
  const scr = [isoP(2.7, 10.6, 12.2), isoP(2.7, 17.4, 12.2), isoP(2.7, 17.4, 19.2), isoP(2.7, 10.6, 19.2)];
  D.quad(scr, act === 'desk' ? (night ? '#5FA8FF' : '#6FB6FF') : '#22263A');
  if (act === 'desk') { for (let k = 0; k < 5; k++) D.line(isoP(2.8, 11.6, 18 - k * 1.3), isoP(2.8, 12.6 + ((k * 3 + (t >> 1)) % 5), 18 - k * 1.3), '#E6F2FF'); if (night) { x.fillStyle = 'rgba(110,170,255,.12)'; x.beginPath(); const a = isoP(2.7, 10, 12), b = isoP(18, 10, 0), c = isoP(18, 19, 0), d = isoP(2.7, 18, 19); x.moveTo(...a); x.lineTo(...b); x.lineTo(...c); x.lineTo(...d); x.fill(); } }
  /* luzinhas piscando */
  if (items.has('lights')) { const cols = ['#FFD54A', '#FF8FB1', '#7CD4FF', '#9BE36A']; for (let a = 3; a <= 47; a += 4) { const p = isoP(a, 0, 34 - 2.5 - Math.abs(Math.sin(a / 8)) * 2.5); const on = !night || (Math.floor(t / 4) + a) % 3; x.fillStyle = on ? cols[(a / 4 | 0) % 4] : 'rgba(0,0,0,.3)'; x.fillRect(p[0], p[1] + 1, 2, 2); if (night && on) { x.fillStyle = 'rgba(255,230,150,.18)'; x.fillRect(p[0] - 1, p[1], 4, 4); } } for (let b = 3; b <= 47; b += 4) { const p = isoP(0, b, 34 - 2.5 - Math.abs(Math.sin(b / 8)) * 2.5); const on = !night || (Math.floor(t / 4) + b + 1) % 3; x.fillStyle = on ? cols[((b / 4 | 0) + 2) % 4] : 'rgba(0,0,0,.3)'; x.fillRect(p[0] - 1, p[1] + 1, 2, 2); } }
  /* relógio de parede com a hora certa */
  if (items.has('clock')) { const p = isoP(0, 22, 28); x.fillStyle = nc('#6B4428'); x.fillRect(p[0] - 4, p[1] - 5, 8, 9); x.fillStyle = nc('#FBF6EC'); x.fillRect(p[0] - 3, p[1] - 4, 6, 7); const d = new Date(), hA = (d.getHours() % 12 + d.getMinutes() / 60) / 12 * 2 * Math.PI, mA = d.getMinutes() / 60 * 2 * Math.PI; x.fillStyle = '#333'; for (let k = 1; k <= 2; k++) x.fillRect(p[0] + Math.round(Math.sin(hA) * k), p[1] - Math.round(Math.cos(hA) * k), 1, 1); for (let k = 1; k <= 3; k++) x.fillRect(p[0] + Math.round(Math.sin(mA) * k), p[1] - Math.round(Math.cos(mA) * k), 1, 1); }
  /* caneca com vapor */
  if (items.has('mug')) { D.box(6.5, 21, 11.4, 1.6, 1.6, 2, nc('#EDE6D8'), { top: '#6B3F22' }); if (act === 'desk') { const p = isoP(7.3, 21.8, 13.4); for (let i = 0; i < 3; i++) { const k = (t + i * 4) % 12; if (k < 9) { x.fillStyle = 'rgba(255,255,255,.7)'; x.fillRect(p[0] + i - 1 + Math.round(Math.sin((t + i) / 2)), p[1] - k, 1, 1); } } } }
  if (items.has('fishbowl') && items.has('shelf')) { const p = isoP(21, 2, 22.2); x.fillStyle = 'rgba(150,215,255,.75)'; x.fillRect(p[0] - 3, p[1] - 6, 7, 6); x.fillStyle = 'rgba(255,255,255,.7)'; x.fillRect(p[0] - 3, p[1] - 7, 7, 1); const fx = p[0] - 2 + Math.round((Math.sin(t / 5) + 1) * 1.5); x.fillStyle = '#F57C1F'; x.fillRect(fx, p[1] - 4, 2, 1); }
  /* pet */
  const pet = RM.pet, petCfgR = cfg;
  let petPose = 'sit', pX, pY, pZ = 0;
  if (act === 'desk' || act === 'sleep') { pX = 40; pY = 8; pZ = 8.8; petPose = 'sleep'; }
  else {
    const spots = [[27, 30], [16, 36], [33, 28], [20, 28], [10, 38], [30, 40]];
    if (Date.now() > pet.wait && Math.hypot(pet.tx - pet.x, pet.ty - pet.y) < .3) { const s = spots[Math.floor(Math.random() * spots.length)]; pet.tx = s[0]; pet.ty = s[1]; pet.wait = Date.now() + 4000 + Math.random() * 5000; }
    const dx = pet.tx - pet.x, dy = pet.ty - pet.y, dist = Math.hypot(dx, dy);
    if (dist > .3 && Date.now() > pet.wait - 3000) { pet.x += dx / dist * .35; pet.y += dy / dist * .35; petPose = 'walk'; pet.dir = (dx - dy) >= 0 ? 1 : -1; } else petPose = 'sit';
    pX = pet.x; pY = pet.y;
  }
  /* personagem + cadeira */
  const drawChair = () => { D.box(14, 13, 0, 1, 1, 5.5, nc('#2E2E36'), { noHi: 1 }); D.box(11.5, 10.5, 5.5, 6, 6, 1.2, nc('#4A4A58')); D.box(17.5, 10.5, 6.7, 1.2, 6, 8, nc('#565668')); };
  const ents = [];
  ents.push({ d: 14 + 13.5, f: () => { if (act === 'desk') { const s = isoP(14.5, 13.5, 6.7); x.drawImage(rmCharDesk(C, t, night), Math.round(s[0]) - 15, Math.round(s[1]) - 27); D.box(17.5, 10.5, 6.7, 1.2, 6, 8, nc('#565668')); } else drawChair(); } });
  if (act === 'desk') { /* o assento vem antes do personagem */ D.box(14, 13, 0, 1, 1, 5.5, nc('#2E2E36'), { noHi: 1 }); D.box(11.5, 10.5, 5.5, 6, 6, 1.2, nc('#4A4A58')); }
  if (act === 'coffee') ents.push({ d: 8 + 33, f: () => { const s = isoP(7, 34, 0); x.drawImage(rmCharFront(C, t, night, { mug: true }), Math.round(s[0]) - 12, Math.round(s[1]) - 35); const m = isoP(7, 34, 0); for (let i = 0; i < 3; i++) { const k = (t + i * 4) % 12; if (k < 9) { x.fillStyle = 'rgba(255,255,255,.75)'; x.fillRect(m[0] - 2 + i + Math.round(Math.sin((t + i) / 2)), m[1] - 19 - k, 1, 1); } } } });
  if (act === 'music') ents.push({ d: 41 + 41, f: () => { const s = isoP(41, 41, 3.3); x.drawImage(rmCharFront(C, t, night, { music: true, closed: true }), Math.round(s[0]) - 12, Math.round(s[1]) - 33); const k = t % 16; ['#FFFFFF', '#FFE27A', '#FF8FB1'].forEach((c, i) => { const ph = (k + i * 5) % 16, u = s[0] + i * 6 - 4 + Math.round(Math.sin(ph / 2) * 2), v = s[1] - 36 - ph; x.fillStyle = c; x.fillRect(u, v, 1, 4); x.fillRect(u - 2, v + 3, 2, 2); x.fillRect(u + 1, v, 2, 1); }); } });
  if (act === 'read' || act === 'sleep') ents.push({ d: 30 + 8, f: () => {
    /* deitado na cama: cabeça no travesseiro, corpo sob a coberta */
    const Hh = C.H; D.box(29, 5.5, 9.4, 3.6, 4, 3.4, C.style === 'careca' ? C.S : Hh, { top: C.style === 'careca' ? C.S : Hh, noHi: 1 });
    D.box(32.4, 5.8, 9.4, 1.2, 3.4, 3, C.S, { noHi: 1 }); if (C.beard) D.box(32.6, 6.3, 9.6, 1.1, 2.4, 1.1, rmShade(Hh, 1.1), { noHi: 1 });
    D.box(33.6, 3.5, 8.8, 12, 8, 2.4, nc(cfg.blanket || '#5B8CC6'));
    if (act === 'read') { D.box(34.2, 6, 11.2, .8, 3.2, 3, '#C2524A', { right: '#F7F3E8' }); D.box(34.4, 6.4, 11.2, .4, 2.4, 2.6, '#F7F3E8', { noHi: 1 }); }
    else { const p = isoP(31, 7.5, 13); const k = t % 18; [[0, 4], [1, 3]].forEach(([i, sz]) => { const ph = (k + i * 9) % 18; if (ph > 13) return; x.fillStyle = '#fff'; const u = p[0] + i * 5, v = p[1] - 6 - ph; x.fillRect(u, v, sz, 1); x.fillRect(u + sz - 2, v + 1, 1, 1); x.fillRect(u, v + 2, sz, 1); }); }
  } });
  ents.push({ d: pX + pY + (pZ ? 4 : 0), f: () => { const s = isoP(pX, pY, pZ), spr = rmPetSprite(petCfgR, petPose, t, night); x.save(); if (pet.dir < 0 && petPose !== 'sleep') { x.translate(Math.round(s[0]) * 2, 0); x.scale(-1, 1); } x.drawImage(spr, Math.round(s[0]) - 9, Math.round(s[1]) - 12); x.restore(); if (petPose === 'sleep' && act !== 'sleep') { const k = (t + 7) % 18; if (k < 13) { x.fillStyle = '#fff'; x.fillRect(Math.round(s[0]) + 6, Math.round(s[1]) - 14 - k, 3, 1); x.fillRect(Math.round(s[0]) + 7, Math.round(s[1]) - 13 - k, 1, 1); x.fillRect(Math.round(s[0]) + 6, Math.round(s[1]) - 12 - k, 3, 1); } } } });
  ents.sort((a, b) => a.d - b.d).forEach(e => e.f());
  /* plantas e objetos da frente por cima de quem passa atrás */
  if (items.has('plant') && pX + pY > 70) { /* nada: a planta fica no canto */ }
  /* luz quente do abajur à noite */
  if (night && items.has('lamp')) { x.save(); x.globalCompositeOperation = 'lighter'; const c = isoP(2.5, 2.5, 16); const g = x.createRadialGradient(c[0], c[1] + 20, 2, c[0], c[1] + 20, 46); g.addColorStop(0, 'rgba(255,200,120,.22)'); g.addColorStop(1, 'rgba(255,200,120,0)'); x.fillStyle = g; x.fillRect(c[0] - 50, c[1] - 30, 100, 100); x.restore(); }
}

/* ---------- personalização ---------- */
function roomCustom() {
  const cfg = roomCfg(), c = fxCounts();
  const opts = (k, map, label) => `<div class="rmopt"><span class="lab">${label}</span><div class="rmsw">${Object.entries(map).map(([id, v]) => { const col = Array.isArray(v) ? v[1] : v; const nm = Array.isArray(v) ? v[0] : id; return `<button class="rmc${cfg[k] === id ? ' on' : ''}" data-rmset="${k}:${id}" title="${esc(cap(nm))}" style="--c:${col}"></button>`; }).join('')}</div></div>`;
  const items = ROOM_ITEMS.map(i => { const ok = fxHas(i, c); return `<label class="fxit${ok ? '' : ' lock'}"><span class="rmico">${{ rug: '🟦', plant: '🪴', mug: '☕', shelf: '📚', picture: '🖼️', lamp: '💡', pouf: '🟡', lights: '✨', clock: '🕰️', poster: '🌅', books: '📖', guitar: '🎸', vinyl: '🎶', fishbowl: '🐠' }[i.id] || '•'}</span><span class="f1"><b>${esc(i.n)}${i.rare ? ' ✨' : ''}</b><small class="mut">${ok ? 'No quarto' : '🔒 ' + esc(fxNeedTxt(i))}</small></span>${ok ? `<span class="sw-t"><input type="checkbox" data-rmshow="${i.id}" ${cfg.hide.includes(i.id) ? '' : 'checked'}><span></span></span>` : ''}</label>`; }).join('');
  const el = modal(`<div class="fxdec rmcus"><h2>Meu quartinho</h2>
    <div class="rmprev"><canvas id="rmprev" width="${RMW}" height="${RMH}"></canvas></div>
    <div class="rmtabs seg"><button class="on" data-rmtab="q">Quarto</button><button data-rmtab="p">Personagem</button><button data-rmtab="pet">Pet</button><button data-rmtab="m">Móveis</button></div>
    <div data-rmpane="q">${opts('wall', RM_WALLS, 'Papel de parede')}${opts('floor', RM_FLOORS, 'Piso')}${opts('blanket', { '#5B8CC6': ['Azul', '#5B8CC6'], '#D9534F': ['Vermelha', '#D9534F'], '#6BA368': ['Verde', '#6BA368'], '#E0B33A': ['Amarela', '#E0B33A'], '#9B7BD0': ['Lilás', '#9B7BD0'], '#E58FB3': ['Rosa', '#E58FB3'] }, 'Coberta')}</div>
    <div data-rmpane="p" hidden>${opts('hair', RM_HAIR, 'Cor do cabelo')}<div class="rmopt"><span class="lab">Cabelo</span><div class="seg">${Object.entries(RM_STYLES).map(([k, n]) => `<button class="${cfg.style === k ? 'on' : ''}" data-rmset="style:${k}">${n}</button>`).join('')}</div></div>${opts('skin', RM_SKIN, 'Pele')}${opts('shirt', RM_SHIRT, 'Camisa')}
      <label class="srow"><span>Barba</span><span class="sw-t"><input type="checkbox" data-rmbool="beard" ${cfg.beard ? 'checked' : ''}><span></span></span></label><label class="srow"><span>Óculos</span><span class="sw-t"><input type="checkbox" data-rmbool="glasses" ${cfg.glasses ? 'checked' : ''}><span></span></span></label></div>
    <div data-rmpane="pet" hidden><div class="rmopt"><span class="lab">Bichinho</span><div class="seg"><button class="${cfg.pet !== 'cachorro' ? 'on' : ''}" data-rmset="pet:gato">🐱 Gato</button><button class="${cfg.pet === 'cachorro' ? 'on' : ''}" data-rmset="pet:cachorro">🐶 Cachorro</button></div></div>
      ${cfg.pet === 'cachorro' ? opts('petColor', { caramelo: '#C98B4A', preto: '#2E2A2A', branco: '#F2EEE6', cinza: '#9A9AA4' }, 'Pelagem') : opts('petColor', Object.fromEntries(Object.entries(CATS).map(([k, v]) => [k, [v.n, v.b]])), 'Pelagem')}</div>
    <div data-rmpane="m" hidden><p class="mut sm">Você tem <b>${plural(c.s, 'sessão', 'sessões')}</b> de foco (15 min+) e <b>${plural(c.l, 'longa', 'longas')}</b> (45 min+). Os móveis chegam com as sessões; os raros ✨ com as sessões longas.</p><div class="fxits">${items}</div></div>
    <div class="row end"><button class="btn red" data-x>Pronto</button></div></div>`, { cls: 'fxdecm' });
  const prev = el.querySelector('#rmprev'), pg = prev.getContext('2d'); pg.imageSmoothingEnabled = false;
  let tt = 0; const drawP = () => { if (!document.body.contains(prev)) { clearInterval(iv); return; } tt++; drawRoomScene(pg, tt); };
  const iv = setInterval(drawP, 200); drawP();
  el.querySelector('[data-x]').onclick = () => { clearInterval(iv); closeModal(); };
  const save = () => { db.s.room = roomCfg(); put('s', db.s, { silent: true }); RM.key = ''; };
  el.querySelectorAll('[data-rmtab]').forEach(b => b.onclick = () => { el.querySelectorAll('[data-rmtab]').forEach(x => x.classList.toggle('on', x === b)); el.querySelectorAll('[data-rmpane]').forEach(p => p.hidden = p.dataset.rmpane !== b.dataset.rmtab); });
  el.addEventListener('click', e => { const b = e.target.closest('[data-rmset]'); if (!b) return; const [k, v] = b.dataset.rmset.split(/:(.+)/); const cur = roomCfg(); cur[k] = v; if (k === 'pet') cur.petColor = v === 'cachorro' ? 'caramelo' : 'laranja'; db.s.room = cur; save(); if (k === 'pet') { const tab = 'pet'; clearInterval(iv); roomCustom(); const nb = $('#modal [data-rmtab="' + tab + '"]'); nb && nb.click(); return; } b.parentElement.querySelectorAll('[data-rmset]').forEach(x => x.classList.toggle('on', x === b)); });
  el.querySelectorAll('[data-rmbool]').forEach(i => i.onchange = () => { const cur = roomCfg(); cur[i.dataset.rmbool] = i.checked; db.s.room = cur; save(); });
  el.querySelectorAll('[data-rmshow]').forEach(i => i.onchange = () => { const cur = roomCfg(); cur.hide = cur.hide.filter(x => x !== i.dataset.rmshow); if (!i.checked) cur.hide.push(i.dataset.rmshow); db.s.room = cur; save(); });
}
Object.assign(ACTS, { rmcustom: () => roomCustom() });
