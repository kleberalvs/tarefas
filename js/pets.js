/* Pets: até dois gatinhos pixelados que andam, sentam, deitam e cochilam pela tela.
   O gato é montado por formas (corpo, cabeça, patas, cauda) numa grade pequena e pintado pixel a pixel,
   o que permite poses e transições suaves sem perder o visual pixelado. Arraste para mudar de lugar; toque para fazer carinho. */
'use strict';
const CW = 44, CH = 32, CG = 29;
const CATS = {
  laranja: { n: 'Laranja', stripe: 1, white: 1, c: { o: '#4A2A12', b: '#EE9A45', l: '#F8B871', s: '#C97A2E', d: '#C9661C', w: '#FCEBD5', p: '#F2A0A6', E: '#8CC63F' } },
  frajola: { n: 'Frajola', white: 1, paws: 1, c: { o: '#0B0B0E', b: '#2C2D35', l: '#41434E', s: '#1E1F25', d: '#2C2D35', w: '#F5F5F3', p: '#EE96A3', E: '#9CCB4B' } },
  preto: { n: 'Pretinho', c: { o: '#08080A', b: '#25252C', l: '#3A3A46', s: '#18181D', d: '#25252C', w: '#25252C', p: '#D9808E', E: '#F2C230' } },
  cinza: { n: 'Cinza rajado', stripe: 1, white: 1, paws: 1, c: { o: '#353C45', b: '#9AA6B4', l: '#B7C1CC', s: '#7C8896', d: '#5F6A78', w: '#E4E9EE', p: '#F0A0AC', E: '#F0B93A' } },
  branco: { n: 'Branquinho', c: { o: '#8F877B', b: '#F8F6F1', l: '#FFFFFF', s: '#E2DCD0', d: '#F8F6F1', w: '#FFFFFF', p: '#F5A9B6', E: '#5AA9E6' } },
  siames: { n: 'Siamês', points: 1, c: { o: '#3E2C24', b: '#F1E5CC', l: '#FAF3E4', s: '#DBC9A6', d: '#F1E5CC', w: '#F1E5CC', x: '#5E4334', p: '#C98890', E: '#4A90E2' } },
  tricolor: { n: 'Tricolor', calico: 1, c: { o: '#4A3A2E', b: '#FBF7F0', l: '#FFFFFF', s: '#E6DED2', d: '#FBF7F0', w: '#FFFFFF', x: '#E58C3A', y: '#2E2A28', p: '#F2A1AC', E: '#C8A23A' } },
  marrom: { n: 'Marrom rajado', stripe: 1, white: 1, c: { o: '#33241A', b: '#A27852', l: '#BA9068', s: '#845F3E', d: '#5E4129', w: '#EADBC6', p: '#E79CA0', E: '#8CB83A' } },
};
const CAT_NAMES = ['Mingau', 'Pipoca', 'Nina', 'Tom', 'Luna', 'Paçoca', 'Frida', 'Simba', 'Mel', 'Bolinha'];
/* poses (gato virado para a direita; o chão fica na linha CG) */
const POSES = {
  stand: { b: [21, 18.5, 9.5, 4.6, -3], ha: [14.5, 19, 5, 5], h: [31.5, 12.5, 0], nk: [27, 17, 30.5, 13.5], fn: [27.5, 20, 28, 24.5, 28, 28], ff: [25.5, 20, 25.5, 24.5, 25.5, 28], hn: [14, 21, 12.5, 24.5, 14, 28], hf: [16, 21, 15, 24.5, 16.5, 28], tb: [11, 16.5], ta: [200, 215, 235, 255, 270, 285, 300], eye: 1 },
  sit: { b: [22, 19.5, 7.2, 4.8, -72], ha: [18, 24, 7, 5], h: [26, 9.5, 0], nk: [23.5, 15, 25.5, 11], fn: [24.5, 19, 25, 24, 25.5, 28], ff: [23, 19, 23, 24, 23.5, 28], hn: [17, 25, 20, 27, 21.5, 28], hf: [16, 25, 19, 27, 20, 28], tb: [12, 26.5], ta: [180, 180, 182, 186, 195, 215, 245], eye: 1 },
  lie: { b: [20, 24.2, 10.5, 4.2, 0], ha: [13.5, 24.5, 5.2, 4.2], h: [30, 18.5, 0], nk: [26, 23, 29, 20], fn: [26, 26, 29, 27.5, 32.5, 28.2], ff: [25, 26, 28, 27.6, 31, 28.3], hn: [14, 26, 16, 27.5, 18, 28.3], hf: [15, 26, 17, 27.6, 19, 28.3], tb: [10, 25], ta: [185, 185, 188, 190, 195, 200, 210], eye: 1 },
  sleep: { b: [20, 24.4, 10.5, 4.1, 0], ha: [13.5, 24.6, 5.2, 4.1], h: [29.5, 23, 12], nk: [25.5, 24, 28, 23], fn: [26, 26, 28.5, 27.6, 31, 28.3], ff: [25, 26, 27.5, 27.6, 29.5, 28.3], hn: [14, 26, 16, 27.5, 18, 28.3], hf: [15, 26, 17, 27.6, 19, 28.3], tb: [10, 25.5], ta: [175, 170, 160, 150, 120, 80, 40], eye: 0 },
  groom: { b: [22, 19.5, 7.2, 4.8, -72], ha: [18, 24, 7, 5], h: [26.5, 11, 18], nk: [23.5, 15, 25.5, 12], fn: [24.5, 19, 27, 17.5, 28.5, 14.5], ff: [23, 19, 23, 24, 23.5, 28], hn: [17, 25, 20, 27, 21.5, 28], hf: [16, 25, 19, 27, 20, 28], tb: [12, 26.5], ta: [180, 180, 182, 186, 195, 215, 245], eye: 0 },
  stretch: { b: [22, 21, 9.5, 4.3, 14], ha: [14.5, 18.5, 5, 5], h: [33, 20, -8], nk: [28, 22, 31.5, 20.5], fn: [28, 23.5, 32, 27, 35, 28.3], ff: [27, 23.5, 31, 27, 33.5, 28.3], hn: [14, 21, 13, 25, 14, 28], hf: [16, 21, 15, 25, 16, 28], tb: [10.5, 15], ta: [235, 250, 265, 275, 285, 290, 295], eye: 0 },
  hang: { b: [21, 17, 9.5, 4.6, -3], ha: [14.5, 17.5, 5, 5], h: [31.5, 11, 0], nk: [27, 15.5, 30.5, 12], fn: [27.5, 19, 27.6, 24, 27.6, 29], ff: [25.5, 19, 25.5, 24, 25.4, 28.6], hn: [14, 20, 14, 24.5, 14.2, 29], hf: [16, 20, 16, 24.5, 16.2, 28.6], tb: [11, 16.5], ta: [120, 110, 100, 95, 90, 88, 85], eye: 1 },
};
const cloneP = o => JSON.parse(JSON.stringify(o));
function lerpP(a, b, t) { if (typeof a === 'number') return a + (b - a) * t; if (Array.isArray(a)) return a.map((v, i) => lerpP(v, b[i], t)); const o = {}; for (const k in a) o[k] = k in b ? lerpP(a[k], b[k], t) : a[k]; return o; }
/* desenho: as formas são rasterizadas numa grade 1,5× maior, com luz de cima à esquerda,
   4 tons por cor (com pontilhado, como pelo), contorno colorido e bigodes */
const RS = 1.5, GW = CW * RS, GH = CH * RS;
const LIGHT = (() => { const v = [-.45, -.75, .55], n = Math.hypot(...v); return v.map(x => x / n); })();
function rastCat(P, m = {}, RS = 1.5, hs = 1) {
  const GW = CW * RS, GH = CH * RS;
  const N = GW * GH, g = new Array(N).fill(''), lum = new Float32Array(N);
  const set = (x, y, c, l) => { if (x >= 0 && y >= 0 && x < GW && y < GH) { g[y * GW + x] = c; lum[y * GW + x] = l; } };
  const shade = (nx, ny, nz) => Math.max(0, nx * LIGHT[0] + ny * LIGHT[1] + nz * LIGHT[2]);
  const ell = (cx, cy, rx, ry, rot, c, k = 1) => {
    cx *= RS; cy *= RS; rx *= RS; ry *= RS;
    const r = rot * Math.PI / 180, co = Math.cos(r), si = Math.sin(r), R = Math.max(rx, ry) + 1;
    for (let y = Math.floor(cy - R); y <= cy + R; y++) for (let x = Math.floor(cx - R); x <= cx + R; x++) {
      const dx = x + .5 - cx, dy = y + .5 - cy, u = (dx * co + dy * si) / rx, v = (-dx * si + dy * co) / ry, q = u * u + v * v;
      if (q <= 1) { const nx = u * co - v * si, ny = u * si + v * co; set(x, y, c, shade(nx * .8, ny * .8, Math.sqrt(1 - q)) * k); }
    }
  };
  const cap = (x1, y1, x2, y2, r, c, k = 1) => {
    x1 *= RS; y1 *= RS; x2 *= RS; y2 *= RS; r *= RS;
    const vx = x2 - x1, vy = y2 - y1, L = vx * vx + vy * vy || 1;
    for (let y = Math.floor(Math.min(y1, y2) - r - 1); y <= Math.max(y1, y2) + r + 1; y++) for (let x = Math.floor(Math.min(x1, x2) - r - 1); x <= Math.max(x1, x2) + r + 1; x++) {
      const px = x + .5, py = y + .5, t = Math.max(0, Math.min(1, ((px - x1) * vx + (py - y1) * vy) / L)), dx = px - (x1 + vx * t), dy = py - (y1 + vy * t), d2 = (dx * dx + dy * dy) / (r * r);
      if (d2 <= 1) { const d = Math.sqrt(d2) || 1e-6; set(x, y, c, shade(dx / r * .9, dy / r * .9, Math.sqrt(1 - d2)) * k); }
    }
  };
  const tri = (a, b, d, c, l) => {
    a = a.map(v => v * RS); b = b.map(v => v * RS); d = d.map(v => v * RS);
    const s = (p, q, r) => (p[0] - r[0]) * (q[1] - r[1]) - (q[0] - r[0]) * (p[1] - r[1]);
    for (let y = Math.floor(Math.min(a[1], b[1], d[1])); y <= Math.max(a[1], b[1], d[1]); y++) for (let x = Math.floor(Math.min(a[0], b[0], d[0])); x <= Math.max(a[0], b[0], d[0]); x++) {
      const p = [x + .5, y + .5], d1 = s(p, a, b), d2 = s(p, b, d), d3 = s(p, d, a);
      if (!((d1 < 0 || d2 < 0 || d3 < 0) && (d1 > 0 || d2 > 0 || d3 > 0))) set(x, y, c, l);
    }
  };
  const leg = (L, c, k) => { cap(L[0], L[1], L[2], L[3], 1.3, c, k); cap(L[2], L[3], L[4], L[5], 1.02, c, k); ell(L[4] + .6, L[5] + .3, 1.6, .95, 0, c === 'F' ? 'F' : 'P', k); };
  const [bx, by, brx, bry, brot] = P.b, [hx, hy, hr] = P.h;
  leg(P.ff, 'F', .55); leg(P.hf, 'F', .55);
  let tx = P.tb[0], ty = P.tb[1];
  P.ta.forEach((a, i) => { const r = a * Math.PI / 180, nx = tx + Math.cos(r) * 1.8, ny = Math.min(CG - .6, ty + Math.sin(r) * 1.8); cap(tx, ty, nx, ny, 1.25 - i * .04, 'T'); tx = nx; ty = ny; });
  ell(P.ha[0], P.ha[1], P.ha[2], P.ha[3], 0, 'b');
  ell(bx, by, brx, bry, brot, 'b');
  cap(P.nk[0], P.nk[1], P.nk[2], P.nk[3], 2.8, 'b');
  ell((P.nk[0] + P.nk[2]) / 2 + 1.5, (P.nk[1] + P.nk[3]) / 2 + 1.7, 2, 2.6, 0, 'C');
  leg(P.hn, 'L', 1); leg(P.fn, 'L', 1);
  const hrr = hr * Math.PI / 180, hp = (u, v) => { u *= hs; v *= hs; return [hx + u * Math.cos(hrr) - v * Math.sin(hrr), hy + u * Math.sin(hrr) + v * Math.cos(hrr)]; };
  tri(hp(-3.7, -1.4), hp(-.8, -3.2), hp(-3, -6.8), 'R', .25);
  ell(hx, hy, 4.3 * hs, 3.8 * hs, hr, 'H');
  ell(...hp(-1.2, 1.3), 2.6 * hs, 2.2 * hs, hr, 'H');
  tri(hp(-1.3, -2.6), hp(2.3, -2.6), hp(.2, -7), 'R', .7);
  tri(hp(-.4, -3.1), hp(1.4, -3.1), hp(.2, -5.6), 'p', .6);
  ell(...hp(3.3, 1.3), 1.9 * hs, 1.5 * hs, hr, 'M');
  const G = (u, v) => { const [x, y] = hp(u, v); return [Math.floor(x * RS), Math.floor(y * RS)]; };
  const [ex, ey] = G(1.6, -.9);
  if (P.eye > .5 && !m.blink) { set(ex, ey, 'E', .9); set(ex + 1, ey, 'k', 0); set(ex + 2, ey, 'E', .5); set(ex, ey + 1, 'E', .6); set(ex + 1, ey + 1, 'k', 0); set(ex + 2, ey + 1, 'E', .4); set(ex + 2, ey - 1 < 0 ? ey : ey, 'h', 1); }
  else { set(ex, ey + 1, 'c', 0); set(ex + 1, ey + 1, 'c', 0); set(ex + 2, ey + 1, 'c', 0); }
  const [nx, ny] = G(5.1, .3); set(nx, ny, 'n', .7); set(nx - 1, ny, 'n', .5);
  const [mx, my] = G(4.4, 2.1);
  if (m.mouth) { [[13, 15], [13, 16], [18, 15], [18, 16], [14, 17], [15, 17], [16, 17], [17, 17]].forEach(([x, y]) => S(x, y, 'm')); [14, 15, 16, 17].forEach(x => { S(x, 15, 'k2'); S(x, 16, 'k2'); }); S(15, 16, 'p'); S(16, 16, 'p'); }
  if (m.tongue) { S(15, 16, 'p'); S(16, 16, 'p'); S(15, 17, 'p'); S(16, 17, 'p'); S(14, 17, 'm'); S(17, 17, 'm'); S(15, 18, 'm'); S(16, 18, 'm'); }
  const wh = [G(4.2, 1.2), G(4.4, 1.8)];
  return { g, lum, wh, by: by * RS, bry: bry * RS, hx: hx * RS, hy: hy * RS };
}
const hex2 = h => { const n = parseInt(h.slice(1), 16); return [n >> 16, (n >> 8) & 255, n & 255]; };
const mixC = (a, b, t) => a.map((v, i) => Math.round(v + (b[i] - v) * t));
const SHD = hex2('#2A1E3A'), HIL = hex2('#FFF4DC'), TONES = {};
function tones(h) { return TONES[h] || (TONES[h] = (() => { const c = hex2(h); return [mixC(c, SHD, .36), mixC(c, SHD, .17), c, mixC(c, HIL, .26)]; })()); }
const BAYER = [0, .5, .75, .25];
function paintCat(cv, k, P, m) {
  const R = rastCat(P, m), g = R.g, B = CATS[k] || CATS.laranja, pal = B.c;
  const at = (x, y) => (x < 0 || y < 0 || x >= GW || y >= GH) ? '' : g[y * GW + x];
  const baseOf = (c, x, y) => {
    if (c === 'E') return pal.E; if (c === 'k' || c === 'c') return '#121212'; if (c === 'p') return pal.p; if (c === 'n') return pal.n || pal.p; if (c === 'h') return '#FFFFFF';
    if (B.calico) {
      if (c === 'M' || c === 'C' || c === 'P') return pal.w;
      if (c === 'b' && x < 26 && y < R.by + 1) return pal.x;
      if (c === 'b' && x >= 28 && x < 35 && y < R.by - 2) return pal.y;
      if ((c === 'H' || c === 'R') && x < R.hx - 1 && y < R.hy + 2) return pal.x;
      if (c === 'R' && x >= R.hx - 1) return pal.y;
      if (c === 'T') return x < 13 ? pal.y : pal.x;
      return pal.b;
    }
    if (c === 'P') return B.paws ? pal.w : B.points ? pal.x : pal.b;
    if (c === 'M' || c === 'C') return B.white ? pal.w : (B.points && c === 'M') ? pal.x : pal.b;
    if (B.points && 'HRLTF'.includes(c)) return pal.x;
    if (B.stripe) {
      if (c === 'b' && Math.sin((x + Math.sin(y * .45) * 2.2) * .62) > .55 && y < R.by + R.bry * .2) return pal.d;
      if (c === 'H' && y < R.hy - 2 && Math.sin(x * 1.3) > .5 && x < R.hx + 2) return pal.d;
      if ((c === 'T' || c === 'L' || c === 'F') && Math.sin((x + y) * .9) > .6) return pal.d;
    }
    return pal.b;
  };
  const ctx = cv.getContext('2d'), img = ctx.createImageData(GW, GH), D = img.data, base = new Array(GW * GH);
  const put = (i, rgb, a = 255) => { D[i * 4] = rgb[0]; D[i * 4 + 1] = rgb[1]; D[i * 4 + 2] = rgb[2]; D[i * 4 + 3] = a; };
  for (let y = 0; y < GH; y++) for (let x = 0; x < GW; x++) {
    const i = y * GW + x, c = g[i]; if (!c) continue;
    const b0 = baseOf(c, x, y); base[i] = b0;
    if ('Ekchn'.includes(c) && c !== 'n') { put(i, c === 'E' ? mixC(hex2(b0), [255, 255, 255], R.lum[i] > .7 ? .25 : 0) : hex2(b0)); continue; }
    const v = R.lum[i] * 3.4 + .45 + (BAYER[(x & 1) + (y & 1) * 2] - .375) * .7;
    put(i, tones(b0)[Math.max(0, Math.min(3, Math.floor(v)))]);
  }
  for (let y = 0; y < GH; y++) for (let x = 0; x < GW; x++) {
    const i = y * GW + x; if (g[i]) continue;
    const nb = [[x, y + 1], [x - 1, y], [x + 1, y], [x, y - 1]].find(([a, b]) => at(a, b));
    if (nb) { const j = nb[1] * GW + nb[0]; put(i, mixC(hex2(base[j]), [20, 12, 16], .62)); }
  }
  if (P.eye !== undefined) R.wh.forEach(([wx, wy], n) => { for (let s = 1; s <= 4; s++) { const x = wx + s + 1, y = wy + Math.round((n ? .35 : -.25) * s); if (x < GW && y >= 0 && y < GH && !g[y * GW + x]) put(y * GW + x, [235, 232, 226], 150 - s * 25); } });
  ctx.putImageData(img, 0, 0);
}
/* ---------- estilo realista: desenho suave, com volume, pelagem e olhos detalhados ---------- */
const rgbS = (c, a = 1) => `rgba(${c[0]},${c[1]},${c[2]},${a})`;
const lit = (h, t) => rgbS(mixC(hex2(h), [255, 248, 235], t));
const drk = (h, t) => rgbS(mixC(hex2(h), [28, 18, 30], t));
function seeded(n) { let s = n; return () => (s = (s * 16807) % 2147483647) / 2147483647; }
const FUR = (() => { const r = seeded(7), a = []; for (let i = 0; i < 420; i++) a.push([r() * CW, r() * CH, (r() - .5) * .9, r()]); return a; })();
function paintCatReal(cv, k, P, m = {}) {
  const B = CATS[k] || CATS.laranja, pal = B.c, K = cv.width / CW;
  const lay = cv._lay || (cv._lay = document.createElement('canvas')); lay.width = cv.width; lay.height = cv.height;
  const c = lay.getContext('2d'); c.setTransform(K, 0, 0, K, 0, 0); c.lineJoin = 'round';
  const [bx, by, brx, bry, brot] = P.b, [hx, hy, hr] = P.h;
  const hrr = hr * Math.PI / 180, hp = (u, v) => [hx + u * Math.cos(hrr) - v * Math.sin(hrr), hy + u * Math.sin(hrr) + v * Math.cos(hrr)];
  const pt = B.points ? pal.x : pal.b;
  const grad = (x, y, r, col, dark = 0) => { const g = c.createLinearGradient(x - r * .6, y - r, x + r * .5, y + r); g.addColorStop(0, lit(col, .22)); g.addColorStop(.45, drk(col, dark)); g.addColorStop(1, drk(col, .32 + dark)); return g; };
  const ell = (x, y, rx, ry, rot, fill) => { c.beginPath(); c.ellipse(x, y, rx, ry, rot * Math.PI / 180, 0, Math.PI * 2); c.fillStyle = fill; c.fill(); };
  const legP = (L, col, dark, w1, w2) => {
    c.lineCap = 'round';
    const g = c.createLinearGradient(L[0] - 1.5, L[1], L[0] + 1.5, L[5]); g.addColorStop(0, lit(col, .12)); g.addColorStop(1, drk(col, .3 + dark));
    c.strokeStyle = g; c.lineWidth = w1; c.beginPath(); c.moveTo(L[0], L[1]); c.lineTo(L[2], L[3]); c.stroke();
    c.lineWidth = w2; c.beginPath(); c.moveTo(L[2], L[3]); c.lineTo(L[4], L[5]); c.stroke();
    ell(L[4] + .55, L[5] + .25, 1.45, .9, 0, B.paws ? drk(pal.w, dark + .05) : drk(col, dark + .08));
  };
  /* camadas de trás para a frente */
  legP(P.ff, B.points ? pal.x : pal.b, .32, 2.5, 2); legP(P.hf, B.points ? pal.x : pal.b, .32, 2.7, 2);
  let tx = P.tb[0], ty = P.tb[1]; c.lineCap = 'round';
  const tc = B.calico ? pal.y : pt;
  P.ta.forEach((a, i) => { const r = a * Math.PI / 180, nx = tx + Math.cos(r) * 1.8, ny = Math.min(CG - .6, ty + Math.sin(r) * 1.8); c.strokeStyle = i > 3 && B.calico ? pal.x : i % 2 && B.stripe ? drk(tc, .08) : tc; c.lineWidth = 2.5 - i * .1; c.beginPath(); c.moveTo(tx, ty); c.lineTo(nx, ny); c.stroke(); tx = nx; ty = ny; });
  ell(P.ha[0], P.ha[1], P.ha[2], P.ha[3], 0, grad(P.ha[0], P.ha[1], P.ha[3], pal.b, .04));
  ell(bx, by, brx, bry, brot, grad(bx, by, bry, pal.b));
  c.lineCap = 'round'; c.strokeStyle = grad(P.nk[2], P.nk[3], 3, pal.b); c.lineWidth = 5.6; c.beginPath(); c.moveTo(P.nk[0], P.nk[1]); c.lineTo(P.nk[2], P.nk[3]); c.stroke();
  legP(P.hn, B.points ? pal.x : pal.b, 0, 2.7, 2.05); legP(P.fn, B.points ? pal.x : pal.b, 0, 2.5, 2.05);
  /* orelhas e cabeça */
  const tri = (a, b, d, fill) => { c.beginPath(); c.moveTo(...a); c.quadraticCurveTo(...hp(-2.3, -4.2), ...b); c.lineTo(...d); c.closePath(); c.fillStyle = fill; c.fill(); };
  const earCol = B.calico ? pal.y : pt;
  c.beginPath(); c.moveTo(...hp(-3.7, -1.4)); c.lineTo(...hp(-3.1, -6.8)); c.lineTo(...hp(-.8, -3.2)); c.closePath(); c.fillStyle = drk(earCol, .3); c.fill();
  ell(hx, hy, 4.3, 3.8, hr, grad(hx, hy, 3.8, B.points ? pal.x : B.calico ? pal.b : pal.b));
  ell(...hp(-1.2, 1.3), 2.6, 2.2, hr, grad(hx - 1, hy + 1.3, 2.2, B.points ? pal.x : pal.b, .04));
  c.beginPath(); c.moveTo(...hp(-1.4, -2.6)); c.lineTo(...hp(.2, -7.1)); c.lineTo(...hp(2.4, -2.6)); c.closePath(); c.fillStyle = grad(hx, hy - 5, 2.5, B.calico ? pal.x : pt); c.fill();
  const ig = c.createLinearGradient(...hp(.3, -6.4), ...hp(.4, -3)); ig.addColorStop(0, drk(pal.p, .25)); ig.addColorStop(1, lit(pal.p, .1));
  c.beginPath(); c.moveTo(...hp(-.4, -3.1)); c.lineTo(...hp(.2, -5.9)); c.lineTo(...hp(1.5, -3.1)); c.closePath(); c.fillStyle = ig; c.fill();
  /* manchas, listras e partes brancas (só por cima do que já foi desenhado) */
  c.globalCompositeOperation = 'source-atop';
  if (B.calico) {
    ell(bx - 3, by - 1.5, 4.5, 3, -10, pal.x); ell(bx + 3.5, by - 2.2, 2.6, 2, 15, pal.y); ell(P.ha[0] - 1, P.ha[1] - 1, 3.6, 3, 0, pal.x);
    ell(...hp(-1.8, -1.6), 2.6, 2.2, 0, pal.x);
  }
  if (B.stripe) {
    c.strokeStyle = rgbS(hex2(pal.d), .5); c.lineCap = 'round'; c.shadowColor = rgbS(hex2(pal.d), .6); c.shadowBlur = K * .5;
    const br = brot * Math.PI / 180;
    for (let i = -3; i <= 3; i++) { const u = i * brx / 3.6, x0 = bx + u * Math.cos(br), y0 = by + u * Math.sin(br); c.lineWidth = .55 + ((i * 7 + 9) % 4) * .12; c.beginPath(); c.moveTo(x0 - Math.sin(br) * -bry, y0 + Math.cos(br) * -bry - .2); c.quadraticCurveTo(x0 + 1, y0, x0 + .3 - Math.sin(br) * bry * .2, y0 + Math.cos(br) * bry * .2); c.stroke(); }
    for (let i = 0; i < 3; i++) { c.lineWidth = .45; c.beginPath(); c.moveTo(...hp(-1 + i * .9, -3.6)); c.lineTo(...hp(-.6 + i * .7, -1.6)); c.stroke(); }
    c.lineWidth = .7; ['fn', 'hn', 'ff', 'hf'].forEach(kk => { const L = P[kk]; for (let j = 1; j < 3; j++) { const t = j / 3, x = L[2] + (L[4] - L[2]) * t, y = L[3] + (L[5] - L[3]) * t; c.beginPath(); c.moveTo(x - 1, y); c.lineTo(x + 1, y + .2); c.stroke(); } });
  }
  if (B.white || B.calico) {
    const wg = (x, y, r) => { const g = c.createRadialGradient(x - r * .3, y - r * .3, 0, x, y, r * 1.1); g.addColorStop(0, '#FFFFFF'); g.addColorStop(.55, pal.w); g.addColorStop(1, rgbS(hex2(pal.w), 0)); return g; };
    const cx = (P.nk[0] + P.nk[2]) / 2 + 1.5, cy = (P.nk[1] + P.nk[3]) / 2 + 1.7; ell(cx, cy, 2.4, 3, 0, wg(cx, cy, 2.6));
    if (B.calico) { ell(bx + 1, by + bry * .55, brx * .8, bry * .55, brot, wg(bx, by + bry, bry)); }
  }
  c.shadowBlur = 0;
  /* luz geral e textura de pelo */
  const lg = c.createLinearGradient(0, 4, 0, CG); lg.addColorStop(0, 'rgba(255,250,235,.10)'); lg.addColorStop(.55, 'rgba(0,0,0,0)'); lg.addColorStop(1, 'rgba(20,10,30,.22)');
  c.fillStyle = lg; c.fillRect(0, 0, CW, CH);
  c.lineCap = 'round'; c.lineWidth = .16;
  FUR.forEach(([x, y, a, r]) => { c.strokeStyle = r < .5 ? 'rgba(255,255,255,.16)' : 'rgba(0,0,0,.14)'; c.beginPath(); c.moveTo(x, y); c.lineTo(x - .7, y + a * .7); c.stroke(); });
  c.globalCompositeOperation = 'source-over';
  /* focinho branco, nariz, boca, olho e bigodes */
  const [mx, my] = hp(3.3, 1.3);
  if (B.white || B.calico) { const g = c.createRadialGradient(mx - .4, my - .4, 0, mx, my, 2.2); g.addColorStop(0, '#FFFFFF'); g.addColorStop(1, drk(pal.w, .12)); ell(mx, my, 1.95, 1.5, hr, g); }
  else ell(mx, my, 1.95, 1.5, hr, grad(mx, my, 1.5, B.points ? pal.x : pal.b, -.05));
  const [nx, ny] = hp(5.05, .5); c.beginPath(); c.moveTo(nx + .25, ny - .3); c.lineTo(nx - .7, ny - .45); c.lineTo(nx - .35, ny + .35); c.closePath(); c.fillStyle = pal.p; c.fill();
  c.strokeStyle = 'rgba(30,20,20,.7)'; c.lineWidth = .18; c.beginPath(); c.moveTo(...hp(4.7, .9)); c.quadraticCurveTo(...hp(4.6, 1.9), ...hp(3.9, 2.1)); c.stroke();
  if (m.mouth) { c.beginPath(); c.ellipse(...hp(4.2, 2.3), .55, .45, hrr, 0, Math.PI * 2); c.fillStyle = '#3A1A1E'; c.fill(); c.beginPath(); c.ellipse(...hp(4.25, 2.55), .35, .2, hrr, 0, Math.PI * 2); c.fillStyle = pal.p; c.fill(); }
  if (m.tongue) { c.beginPath(); c.ellipse(...hp(4.9, 2.4), .45, .28, hrr + .4, 0, Math.PI * 2); c.fillStyle = pal.p; c.fill(); }
  const [ex, ey] = hp(2.1, -.6);
  if (P.eye > .5 && !m.blink) {
    c.save(); c.translate(ex, ey); c.rotate(hrr - .12);
    c.beginPath(); c.ellipse(0, 0, .95, .62, 0, 0, Math.PI * 2); c.fillStyle = '#1A1412'; c.fill();
    const g = c.createRadialGradient(-.1, .1, 0, 0, 0, .8); g.addColorStop(0, lit(pal.E, .35)); g.addColorStop(.7, pal.E); g.addColorStop(1, drk(pal.E, .4));
    c.beginPath(); c.ellipse(0, 0, .8, .5, 0, 0, Math.PI * 2); c.fillStyle = g; c.fill();
    c.beginPath(); c.ellipse(.15, 0, .16, .46, 0, 0, Math.PI * 2); c.fillStyle = '#0B0808'; c.fill();
    c.beginPath(); c.arc(-.3, -.2, .16, 0, Math.PI * 2); c.fillStyle = 'rgba(255,255,255,.95)'; c.fill();
    c.restore();
  } else { c.strokeStyle = '#1A1412'; c.lineWidth = .22; c.beginPath(); c.moveTo(ex - .9, ey + .05); c.quadraticCurveTo(ex, ey + .45, ex + .9, ey); c.stroke(); }
  c.strokeStyle = 'rgba(255,255,255,.75)'; c.lineWidth = .1; c.lineCap = 'round';
  [[-.5, .2], [0, .5], [.4, .95]].forEach(([d, e]) => { const [x0, y0] = hp(4, 1.3 + d * .5); const [x1, y1] = hp(8, 1.3 + d * 1.8 + e); const [qx, qy] = hp(6.2, 1.1 + d); c.beginPath(); c.moveTo(x0, y0); c.quadraticCurveTo(qx, qy, x1, y1); c.stroke(); });
  /* resultado com borda suave */
  const o = cv.getContext('2d'); o.setTransform(1, 0, 0, 1, 0, 0); o.clearRect(0, 0, cv.width, cv.height);
  o.shadowColor = 'rgba(20,12,16,.35)'; o.shadowBlur = K * .35; o.drawImage(lay, 0, 0); o.shadowBlur = 0;
}
/* ---------- estilo fofo: pixels grandes, contorno preto, cabeça grande, rosto e barriga cremes ---------- */
const CUTE = {
  laranja: { b: '#E8963E', s: '#C4732A', w: '#FBEBD3', v: '#E9CDA8', d: '#C96A22', stripe: 1 },
  frajola: { b: '#34353D', s: '#24252B', w: '#F7F4EE', v: '#DCD6CB' },
  preto: { b: '#2B2B32', s: '#1D1D22', w: '#2B2B32', v: '#1D1D22', eye: '#F2C230', dark: 1 },
  cinza: { b: '#9AA5B1', s: '#7A8592', w: '#EEF0F2', v: '#CFD4DA', d: '#6E7987', stripe: 1 },
  branco: { b: '#FBF8F2', s: '#E4DDD0', w: '#FFFFFF', v: '#EAE4D9' },
  siames: { b: '#F2E6CF', s: '#DCCBA9', w: '#F8F1E3', v: '#E3D6BE', x: '#5E4334', xs: '#46312A', points: 1, eye: '#4A90E2' },
  tricolor: { b: '#FBF3E6', s: '#E9DAC3', w: '#FFF9F0', v: '#EBDDC8', x: '#DE8A34', xs: '#B96C22', y: '#5A463A', ys: '#43342A', calico: 1 },
  marrom: { b: '#A47A52', s: '#835D3B', w: '#F1E2CC', v: '#D8C2A3', d: '#6A4A2E', stripe: 1 },
};
/* metade esquerda do gato sentado de frente (a coluna 9 é o centro); o lado direito é espelhado */
/* gato fofo, sempre de frente: metade esquerda (colunas 0–15), espelhada para a direita */
const KH = [ /* cabeça: 19 linhas */
  '...oo...........', '..obbo..........', '..obpbo.........', '..obppbo........', '.obpppbo........', '.obpppbboooooooo',
  '.obppbbbbbbbbbbb', 'obbbbbbbbbbbbbbb', 'obbbbbbbbbbbbbbb', 'obbbbbbbbbbbbbbb', 'obbbbkkbbbbbbbbb', 'obbbkhkkbbbbbbbb',
  'obbbkkkkbbbbbbbb', 'obbbkkkhbbbbbbbb', 'obbbbkkbbbbbwwwn', 'obqqbbbbbbbwmwwm', 'obqqbbbbbbbwwmmw', '.obbbbbbbbbbwwww', '..oobbbbbbbbbbbb',
];
const KB_SIT = [ /* corpo sentado: 10 linhas */
  '....obbbwwwwwwww', '...obbbbwwwwwwww', '...obbbbbwwwwwww', '..obbbbbbwwwwwww', '..obbbbbbwwwwwww',
  '..obsbbbbowwwwww', '..obssbbbowwwwww', '..obssbbbowwwwwo', '..ossssbowwvwwvo', '...ooooooooooooo',
];
const KB_LOAF = [ /* corpo deitado (pãozinho): 7 linhas */
  '...obbbbwwwwwwww', '..obbbbbbwwwwwww', '.obbbbbbbbwwwwww', 'obsbbbbbbbbbbbbb', 'obssbbbbowwwwobb', 'osssssbbowvwvobb', '.ooooooooooooooo',
];
const KTAIL = { /* cauda do lado direito, colunas 28–37 */
  sit: [[18, ['.......oo.', '......obbo', '......obbo', '.......obo', '.......obo', '.......obo', '......obbo', '.....obbo.', '...oobbo..', '..obbbo...', '..obbo....', '..ooo.....']],
        [18, ['........oo', '.......obo', '.......obo', '.......obo', '.......obo', '......obbo', '......obo.', '.....obbo.', '...oobbo..', '..obbbo...', '..obbo....', '..ooo.....']]],
  loaf: [[26, ['..........', '......oo..', '..ooooobo.', '.obbbbbbo.', 'oooooooo..']], [26, ['........o.', '.......obo', '..ooooobo.', '.obbbbbbo.', 'oooooooo..']]],
};
const CUTE_FACE = { blush: '#F6A3AE' };
function kawaiiGrid(m = {}) {
  const loaf = m.fmode === 'loaf', W = 38, H = 32, g = Array.from({ length: H }, () => Array(W).fill('.'));
  const rows = KH.concat(loaf ? KB_LOAF : KB_SIT), oy = H - 2 - rows.length + 1 + (loaf ? 0 : 0);
  rows.forEach((r, i) => [...r].forEach((ch, x) => { const y = oy + i; if (y < 0 || y >= H) return; g[y][x] = ch; g[y][31 - x] = ch; }));
  const S = (x, y, c) => { y += oy; if (g[y] && x >= 0 && x < W) g[y][x] = c; };
  /* brilho dos olhos sempre do mesmo lado */
  S(25, 11, 'h'); S(26, 11, 'k'); S(24, 13, 'k'); S(27, 13, 'h');
  /* cauda */
  const tl = KTAIL[loaf ? 'loaf' : 'sit'][m.tail ? 1 : 0];
  tl[1].forEach((r, i) => [...r].forEach((ch, x) => { if (ch === '.') return; const y = loaf ? oy + 21 + i : tl[0] + i + oy - 2; const X = 28 + x; if (!g[y] || X >= W) return; if (g[y][X] === '.') g[y][X] = ch === 'b' ? 't' : ch; }));
  /* olhos */
  const eye = (x0, rows) => rows.forEach((r, i) => [...r].forEach((ch, j) => { if (ch !== ' ') S(x0 + j, 10 + i, ch); }));
  const both = (L, R) => { eye(4, L); eye(24, R || L.map(r => [...r].reverse().join(''))); };
  const ex = m.eyes;
  if (m.blink || ex === 'closed') both(['bbbb', 'bbbb', 'kbbk', 'bkkb', 'bbbb']);
  else if (ex === 'happy') both(['bbbb', 'bkkb', 'kbbk', 'bbbb', 'bbbb']);
  else if (ex === 'sleepy') both(['bbbb', 'bbbb', 'kkkk', 'bkkb', 'bbbb']);
  else if (ex === 'wide') both(['bkkb', 'khhk', 'khhk', 'kkkk', 'bkkb']);
  else if (ex === 'wink') { eye(24, ['bbbb', 'bkkb', 'kbbk', 'bbbb', 'bbbb']); }
  if (ex === 'happy' || ex === 'closed') { S(1, 15, 'q'); S(30, 15, 'q'); }
  /* boca */
  if (m.mouth) { [[13, 15], [14, 15], [17, 15], [18, 15], [13, 16], [18, 16], [14, 17], [17, 17], [15, 18], [16, 18]].forEach(([x, y]) => S(x, y, 'm')); [[14, 16], [15, 16], [16, 16], [17, 16], [15, 15], [16, 15]].forEach(([x, y]) => S(x, y, 'k2')); S(15, 17, 'p'); S(16, 17, 'p'); }
  if (m.tongue) { S(15, 16, 'p'); S(16, 16, 'p'); S(15, 17, 'p'); S(16, 17, 'p'); S(14, 17, 'm'); S(17, 17, 'm'); S(15, 18, 'm'); S(16, 18, 'm'); }
  /* patinha levantada (lambendo) */
  if (m.paw && !loaf) { ['.oooo.', 'owvwvo', 'owwwwo', 'owwwwo', '.owwo.', '.owwo.', '.owwo.', '.owwo.'].forEach((r, i) => [...r].forEach((ch, j) => { if (ch !== '.') S(8 + j, 16 + i, ch); })); }
  /* passinhos ao andar */
  if (m.walkf && !loaf) { const up = m.walkf === 1 ? [9, 14] : [17, 22]; for (let x = up[0]; x <= up[1]; x++) { S(x, 28, '.'); if (g[oy + 27][x] !== '.' && g[oy + 27][x] !== 'o') S(x, 27, 'o'); } }
  return g;
}
function cuteColor2(k, ch, x, y) {
  const C = CUTE[k] || CUTE.laranja;
  if (ch === 'o' || ch === 'm') return '#2A1E1E'; if (ch === 'h') return '#FFFFFF'; if (ch === 'p') return '#F28C9B'; if (ch === 'q') return CUTE_FACE.blush; if (ch === 'k2') return '#6E2B33';
  if (ch === 'n') return '#F5939F';
  if (ch === 'E' || ch === 'k' || ch === 'g') return C.dark ? (ch === 'g' ? '#FFFFFF' : C.eye) : ch === 'g' ? '#7A6A6A' : '#2A1E1E';
  const sh = ch === 's' || ch === 'v';
  if (C.calico) {
    if ((ch === 'b' || ch === 's') && y <= 12 && x <= 12) return sh ? C.xs : C.x;
    if ((ch === 'b' || ch === 's') && y <= 9 && x >= 20) return sh ? C.ys : C.y;
    if ((ch === 'b' || ch === 's') && y >= 21 && x >= 20) return sh ? C.ys : C.y;
    if (ch === 't') return y < 24 ? C.y : C.x;
  }
  if (C.points && (ch === 'b' || ch === 's') && y <= 19) return sh ? C.xs : C.x;
  if (C.points && ch === 't') return C.x;
  if (C.stripe && ch === 'b' && ((y >= 7 && y <= 9 && (x === 12 || x === 19 || (x === 15 || x === 16) && y <= 8)) || (y >= 22 && y % 2 === 1 && (x <= 5 || x >= 26)))) return C.d;
  if (C.stripe && ch === 't' && y % 2 === 0) return C.d;
  if (ch === 'w') return C.dark ? C.b : C.w; if (ch === 'v') return C.dark ? C.s : C.v; if (ch === 's') return C.s;
  return C.b;
}
function paintCute(cv, k, P, m = {}) {
  const ctx = cv.getContext('2d'); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, cv.width, cv.height);
  const img = ctx.createImageData(cv.width, cv.height), D = img.data, Wc = cv.width;
  const g = kawaiiGrid(m), ox = Math.round(Wc / 2 - 16), oy = (m.bob || 0) - 1;
  g.forEach((r, y) => r.forEach((ch, x) => {
    if (ch === '.') return; const X = ox + x, Y = oy + y; if (X < 0 || Y < 0 || X >= Wc || Y >= cv.height) return;
    const n = parseInt(cuteColor2(k, ch, x, y).slice(1), 16), i = (Y * Wc + X) * 4; D[i] = n >> 16; D[i + 1] = (n >> 8) & 255; D[i + 2] = n & 255; D[i + 3] = 255;
  }));
  ctx.putImageData(img, 0, 0);
}


/* ---------- estilo Ilustrado: os desenhos do Kleber, animados por partes (patas, rabo, cabeça, respiração, piscar) ---------- */
const CHB = { marrom: { n: 'Marrom e branco' }, pretobranco: { n: 'Preto e branco' }, cinza: { n: 'Cinza' }, laranja: { n: 'Laranja' }, preto: { n: 'Preto' }, brancopreto: { n: 'Branco e preto' } };
const CHB_MAP = { frajola: 'pretobranco', branco: 'brancopreto', siames: 'cinza', tricolor: 'laranja' };
const chbKey = k => CHB[k] ? k : CHB_MAP[k] || 'laranja';
const SPR_FACE = { deitado: -1, deitado_b: -1, lat_esq: -1 };
const SPR = {};
function sprImg(k, pose) {
  const id = chbKey(k) + '/' + pose;
  if (!SPR[id]) { const im = new Image(); im.onerror = () => { im.bad = 1; }; im.src = 'assets/pets/' + id + '.png'; SPR[id] = im; }
  return SPR[id];
}
const sprOk = im => im && im.complete && im.naturalWidth && !im.bad;
function sprPreload(k) { ['frente', 'frente_b', 'sentado', 'lat_dir', 'lat_dir_b', 'lat_esq', 'deitado', 'deitado_b', 'andando', 'andando_b', 'carinho', 'costas'].forEach(p => sprImg(k, p)); }
const SPW = 280, SPH = 204;
function paintSprite(cv, k, m = {}) {
  if (cv.width !== SPW) { cv.width = SPW; cv.height = SPH; }
  const c = cv.getContext('2d'); c.setTransform(1, 0, 0, 1, 0, 0); c.globalAlpha = 1;
  let pose = m.sp || 'frente';
  const nowT = performance.now();
  if (cv._base !== pose) { if (cv._base) { const f = cv._fade || (cv._fade = document.createElement('canvas')); f.width = SPW; f.height = SPH; f.getContext('2d').drawImage(cv, 0, 0); cv._ft = nowT; } cv._base = pose; }
  c.clearRect(0, 0, SPW, SPH);
  const fa = cv._ft ? 1 - (nowT - cv._ft) / 240 : 0;
  if (fa > 0) { c.save(); c.globalAlpha = fa; c.drawImage(cv._fade, 0, 0); c.restore(); c.globalAlpha = 1 - fa * .6; }
  if (m.closed && sprOk(sprImg(k, pose + '_b'))) pose += '_b';
  let im = sprImg(k, pose);
  if (!sprOk(im)) { im = sprImg(k, 'frente'); pose = 'frente'; if (!sprOk(im)) return; }
  const ref = sprImg(k, 'frente'), sc = 150 / (sprOk(ref) ? ref.naturalHeight : 150);
  const W = im.naturalWidth, H = im.naturalHeight, w = W * sc, h = H * sc, base = pose.replace('_b', '');
  c.imageSmoothingEnabled = true; c.imageSmoothingQuality = 'high';
  c.translate(SPW / 2, SPH - 8 + (m.dy || 0));
  if (m.rot) c.rotate(m.rot);
  c.scale((SPR_FACE[pose] || 1) * (m.sx || 1), m.sy || 1);
  c.translate(-w / 2, -h);
  const part = (sx, sy, sw, sh, dx = 0, dy = 0) => c.drawImage(im, sx, sy, sw, sh, sx * sc + dx, sy * sc + dy, sw * sc, sh * sc);
  if (base === 'andando') {
    /* rabo balança em volta da base; patas dão passos (cisalhamento alternado) */
    const tw = Math.round(W * .27), th = Math.round(H * .6), lt = Math.round(H * .68), split = Math.round(W * .55), ph = m.step || 0;
    const A = 4.2 * Math.sin(ph), liftF = 2.2 * Math.max(0, Math.cos(ph)), liftB = 2.2 * Math.max(0, -Math.cos(ph));
    for (let y = lt - 2; y < H; y++) {
      const f = Math.max(0, (y - lt) / (H - lt));
      c.drawImage(im, 0, y, split + 2, 1, -A * f, y * sc - liftB * f, (split + 2) * sc, sc + .9);
      c.drawImage(im, split, y, W - split, 1, split * sc + A * f, y * sc - liftF * f, (W - split) * sc, sc + .9);
    }
    c.save(); c.translate(tw * sc * .9, th * sc * .95); c.rotate(m.tail || 0); c.translate(-tw * sc * .9, -th * sc * .95); part(0, 0, tw + 4, th + 4); c.restore();
    c.save(); c.beginPath(); c.rect(tw * sc, -2, w, (lt + 1) * sc + 2); c.rect(-2, th * sc, tw * sc + 2, (lt + 1 - th) * sc); c.clip(); c.drawImage(im, 0, 0, w, h); c.restore();
    return;
  }
  if (base === 'frente' || base === 'sentado') {
    /* cabeça inclina levemente sobre o pescoço */
    const ny = Math.round(H * .53);
    c.save(); c.beginPath(); c.rect(-5, ny * sc - 3, w + 10, h); c.clip(); c.drawImage(im, 0, 0, w, h); c.restore();
    c.save(); c.translate(w / 2, ny * sc + 6); c.rotate(m.tilt || 0); c.translate(-w / 2, -(ny * sc + 6)); part(0, 0, W, ny + 2); c.restore();
    return;
  }
  c.drawImage(im, 0, 0, w, h);
}


/* ---------- estilo Animado: gatos próprios, montados como bonecos articulados (vetor) e opcionalmente pixelados ---------- */
const RIG = {
  marrom: { n: 'Marrom e branco', b: '#8C6542', s: '#6C4B2F', d: '#4A3220', w: '#F8EEDD', e: '#7DBB6C', stripe: 1, white: 1 },
  pretobranco: { n: 'Preto e branco', b: '#34302F', s: '#221F1F', w: '#F8F0E4', e: '#A2C64C', white: 1, blaze: 1 },
  cinza: { n: 'Cinza', b: '#8E8E96', s: '#6F6F78', d: '#54545C', w: '#F5F0E8', e: '#B9CC4E', stripe: 1, white: 1 },
  laranja: { n: 'Laranja', b: '#EF9645', s: '#D07732', d: '#C2621D', w: '#FDF3E5', e: '#7FC08A', stripe: 1, white: 1 },
  preto: { n: 'Preto', b: '#2F2C2E', s: '#1F1D1F', w: '#2F2C2E', e: '#F2C03E' },
  brancopreto: { n: 'Branco e preto', b: '#F8F0E4', s: '#E3D7C5', w: '#FFFFFF', e: '#A9C953', patch: '#34302F', white: 1 },
};
const RIG_MAP = { frajola: 'pretobranco', branco: 'brancopreto', siames: 'cinza', tricolor: 'laranja' };
const rigKey = k => RIG[k] ? k : RIG_MAP[k] || 'laranja';
const RO = '#2A211F', RPINK = '#F09AA0', RNOSE = '#E8858C', RBLUSH = 'rgba(246,140,150,.55)';
const RW = 120, RH = 90, RG = 82;
function rigCtx(c) {
  const O = 1.7;
  const circ = (x, y, r) => { c.beginPath(); c.arc(x, y, r, 0, Math.PI * 2); };
  const api = {
    O,
    /* cada forma: contorno (mais grosso, escuro) e depois cor */
    shapes: [],
    circle(x, y, r, col) { api.shapes.push({ t: 'c', x, y, r, col }); },
    ell(x, y, rx, ry, rot, col) { api.shapes.push({ t: 'e', x, y, rx, ry, rot, col }); },
    cap(pts, w, col) { api.shapes.push({ t: 'l', pts, w, col }); },
    poly(pts, col) { api.shapes.push({ t: 'p', pts, col }); },
    flush(outline = true) {
      const draw = (s, grow, col) => {
        c.fillStyle = col; c.strokeStyle = col;
        if (s.t === 'c') { circ(s.x, s.y, s.r + grow); c.fill(); }
        else if (s.t === 'e') { c.beginPath(); c.ellipse(s.x, s.y, s.rx + grow, s.ry + grow, s.rot || 0, 0, Math.PI * 2); c.fill(); }
        else if (s.t === 'l') { c.lineCap = 'round'; c.lineJoin = 'round'; c.lineWidth = s.w + grow * 2; c.beginPath(); c.moveTo(s.pts[0], s.pts[1]); for (let i = 2; i < s.pts.length; i += 2) c.lineTo(s.pts[i], s.pts[i + 1]); c.stroke(); }
        else if (s.t === 'p') { c.lineJoin = 'round'; c.beginPath(); c.moveTo(s.pts[0], s.pts[1]); for (let i = 2; i < s.pts.length; i += 2) c.lineTo(s.pts[i], s.pts[i + 1]); c.closePath(); if (grow) { c.lineWidth = grow * 2; c.stroke(); } c.fill(); }
      };
      if (outline) api.shapes.forEach(s => draw(s, O, RO));
      api.shapes.forEach(s => draw(s, 0, s.col));
      api.shapes = [];
    },
  };
  return api;
}
/* olho grande e expressivo */
function rigEye(c, x, y, s, C, st, look, lookY) {
  c.lineCap = 'round';
  if (st === 'closed' || st === 'happy' || st === 'sleepy') {
    c.strokeStyle = RO; c.lineWidth = 1.5;
    c.beginPath();
    if (st === 'happy') c.arc(x, y + 1.6 * s, 2.6 * s, 1.15 * Math.PI, 1.85 * Math.PI);
    else if (st === 'closed') c.arc(x, y - 1.2 * s, 2.6 * s, .18 * Math.PI, .82 * Math.PI);
    if (st !== 'sleepy') { c.stroke(); return; }
  }
  const rx = 3.1 * s, ry = 3.5 * s;
  c.save(); c.beginPath(); c.ellipse(x, y, rx + .9, ry + .9, 0, 0, Math.PI * 2); c.fillStyle = RO; c.fill();
  c.beginPath(); c.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2); c.clip();
  const g = c.createRadialGradient(x, y + ry * .4, .5, x, y, ry * 1.2); g.addColorStop(0, '#FFFFFF'); g.addColorStop(.25, C.e); g.addColorStop(1, rgbS(mixC(hex2(C.e), [30, 40, 20], .35)));
  c.fillStyle = g; c.fillRect(x - rx - 1, y - ry - 1, rx * 2 + 2, ry * 2 + 2);
  c.beginPath(); c.ellipse(x + look * 1.1 * s, y + (lookY || 0) * s + .3, 1.9 * s, 2.6 * s, 0, 0, Math.PI * 2); c.fillStyle = '#16100F'; c.fill();
  c.beginPath(); c.arc(x - 1.1 * s + look * .6 * s, y - 1.4 * s, 1.15 * s, 0, Math.PI * 2); c.fillStyle = '#FFF'; c.fill();
  c.beginPath(); c.arc(x + 1.2 * s + look * .6 * s, y + 1.2 * s, .55 * s, 0, Math.PI * 2); c.fill();
  if (st === 'sleepy') { c.fillStyle = C.b; c.fillRect(x - rx - 1, y - ry - 1, rx * 2 + 2, ry * 1.05); }
  c.restore();
  if (st === 'sleepy') { c.strokeStyle = RO; c.lineWidth = 1.3; c.beginPath(); c.moveTo(x - rx - .5, y - ry * .05); c.lineTo(x + rx + .5, y - ry * .05); c.stroke(); }
}
function rigFace(c, C, hx, hy, s, st, m) {
  const ex = 6.6 * s;
  rigEye(c, hx - ex + (m.turn || 0) * 1.5, hy + .6 * s, s, C, st, m.look || 0, m.lookY);
  rigEye(c, hx + ex + (m.turn || 0) * 2.2, hy + .6 * s, s * (1 - Math.abs(m.turn || 0) * .12), C, st, m.look || 0, m.lookY);
  if (st === 'happy' || m.blush) { c.fillStyle = RBLUSH; [-1, 1].forEach(d => { c.beginPath(); c.ellipse(hx + d * 10 * s + (m.turn || 0) * 2, hy + 5.4 * s, 2.6 * s, 1.4 * s, 0, 0, Math.PI * 2); c.fill(); }); }
  const nx = hx + (m.turn || 0) * 3, ny = hy + 4.6 * s;
  c.fillStyle = RNOSE; c.beginPath(); c.moveTo(nx - 1.6 * s, ny - .8 * s); c.lineTo(nx + 1.6 * s, ny - .8 * s); c.lineTo(nx, ny + .9 * s); c.closePath(); c.fill();
  c.strokeStyle = RO; c.lineWidth = 1.1; c.lineCap = 'round';
  if (m.mouth) {
    c.beginPath(); c.ellipse(nx, ny + 3.3 * s, 2.1 * s, 2.2 * s * m.mouth, 0, 0, Math.PI * 2); c.fillStyle = '#5A2328'; c.fill(); c.stroke();
    c.beginPath(); c.ellipse(nx, ny + 4.4 * s, 1.3 * s, .9 * s * m.mouth, 0, 0, Math.PI * 2); c.fillStyle = '#F07F8C'; c.fill();
  } else {
    c.beginPath(); c.moveTo(nx, ny + .8 * s); c.lineTo(nx, ny + 1.9 * s); c.stroke();
    c.beginPath(); c.arc(nx - 1.3 * s, ny + 1.9 * s, 1.3 * s, .1 * Math.PI, .9 * Math.PI); c.stroke();
    c.beginPath(); c.arc(nx + 1.3 * s, ny + 1.9 * s, 1.3 * s, .1 * Math.PI, .9 * Math.PI); c.stroke();
    if (m.tongue) { c.beginPath(); c.ellipse(nx, ny + 3.5 * s, 1.2 * s, 1.4 * s * m.tongue, 0, 0, Math.PI * 2); c.fillStyle = '#F07F8C'; c.fill(); c.stroke(); }
  }
  c.strokeStyle = rgbS(hex2(RO), .55); c.lineWidth = .7;
  [-1, 1].forEach(d => [-1, 1.2].forEach(v => { c.beginPath(); c.moveTo(nx + d * 6 * s, ny + .8 * s + v * .7 * s); c.quadraticCurveTo(nx + d * 10.5 * s, ny + v * 1.4 * s, nx + d * 14 * s, ny - .2 * s + v * 2.6 * s); c.stroke(); }));
}
function rigHead(R, c, C, hx, hy, s, m) {
  const tw = m.ear || 0;
  const ear = (d, t) => {
    const bx = hx + d * 9.6 * s, by = hy - 9.2 * s;
    const tip = [hx + d * (13.4 - t * 2) * s, hy - (21.5 - t * 3) * s];
    R.poly([hx + d * 3.4 * s, hy - 13 * s, ...tip, hx + d * 16 * s, hy - 4 * s], C.patch && d < 0 ? C.patch : C.patch ? C.patch : C.b);
    return [bx, by, tip];
  };
  const e1 = ear(-1, m.earL || 0), e2 = ear(1, (m.earR || 0) + tw);
  R.ell(hx, hy, 16.5 * s, 14.2 * s, 0, C.b);
  R.ell(hx - 13.2 * s, hy + 5 * s, 4.6 * s, 3.8 * s, .5, C.b); R.ell(hx + 13.2 * s, hy + 5 * s, 4.6 * s, 3.8 * s, -.5, C.b);
  R.flush();
  /* dentro das orelhas */
  [[-1, e1, m.earL || 0], [1, e2, (m.earR || 0) + tw]].forEach(([d, , t]) => { c.fillStyle = RPINK; c.beginPath(); c.moveTo(hx + d * 6 * s, hy - 12.2 * s); c.lineTo(hx + d * (12.6 - t * 1.8) * s, hy - (18.6 - t * 2.6) * s); c.lineTo(hx + d * 13.6 * s, hy - 7.6 * s); c.closePath(); c.fill(); });
  /* marcas */
  c.save(); c.beginPath(); c.ellipse(hx, hy, 16.5 * s, 14.2 * s, 0, 0, Math.PI * 2); c.ellipse(hx - 13.2 * s, hy + 5 * s, 4.6 * s, 3.8 * s, .5, 0, Math.PI * 2); c.ellipse(hx + 13.2 * s, hy + 5 * s, 4.6 * s, 3.8 * s, -.5, 0, Math.PI * 2); c.clip();
  if (C.patch) { c.fillStyle = C.patch; c.beginPath(); c.ellipse(hx - 9 * s, hy - 9 * s, 12 * s, 9 * s, -.3, 0, Math.PI * 2); c.fill(); c.beginPath(); c.ellipse(hx + 11 * s, hy - 10 * s, 9 * s, 7 * s, .3, 0, Math.PI * 2); c.fill(); }
  if (C.stripe) { c.strokeStyle = C.d; c.lineCap = 'round'; c.lineWidth = 1.5 * s; [[-3, -13.5, -2.2, -8.5], [0, -14.2, 0, -8.6], [3, -13.5, 2.2, -8.5]].forEach(([a, b, d2, e]) => { c.beginPath(); c.moveTo(hx + a * s, hy + b * s); c.lineTo(hx + d2 * s, hy + e * s); c.stroke(); }); [[-16, -1, -11, 0], [-16.5, 2.2, -12, 2.6], [16, -1, 11, 0], [16.5, 2.2, 12, 2.6]].forEach(([a, b, d2, e]) => { c.beginPath(); c.moveTo(hx + a * s, hy + b * s); c.lineTo(hx + d2 * s, hy + e * s); c.stroke(); }); }
  if (C.white) {
    c.fillStyle = C.w;
    c.beginPath(); c.ellipse(hx + (m.turn || 0) * 3, hy + 7.4 * s, 9.6 * s, 6.6 * s, 0, 0, Math.PI * 2); c.fill();
    if (C.blaze) { c.beginPath(); c.moveTo(hx + (m.turn || 0) * 2, hy - 13 * s); c.quadraticCurveTo(hx - 4.6 * s, hy + 2 * s, hx - 5 * s, hy + 4 * s); c.lineTo(hx + 5 * s, hy + 4 * s); c.quadraticCurveTo(hx + 4.6 * s, hy + 2 * s, hx + (m.turn || 0) * 2, hy - 13 * s); c.fill(); }
  }
  c.restore();
  rigFace(c, C, hx, hy, s, m.eyes, m);
}
/* ---- gato de frente (sentado ou deitado em pãozinho) ---- */
function rigFront(c, C, m) {
  const R = rigCtx(c), cx = RW / 2, L = m.loaf || 0, br = m.br || 0;
  const by = RG - 15 + L * 6, bh = 17 - L * 7 + br * .5, bw = 14.5 + L * 10;
  const hy = 41 + L * 15 + (m.bob || 0), hx = cx + (m.hx || 0);
  /* rabo */
  const sw = m.sway || 0, tb = [cx + bw * .7, RG - 4];
  const tp = [tb[0], tb[1]];
  for (let i = 1; i <= 7; i++) { const a = (-20 - i * (L ? 4 : 17) + sw * i * (L ? 3 : 6)) * Math.PI / 180; tp.push(tp[tp.length - 2] + Math.cos(a) * (L ? 4.2 : 3.4), Math.max(tp[1] - 40, tp[tp.length - 1] + Math.sin(a) * (L ? 1.4 : 3.4))); }
  R.cap(tp, 6.4, C.patch || C.b); R.flush();
  if (C.stripe) { c.save(); c.strokeStyle = C.d; c.lineWidth = 6.4; c.lineCap = 'butt'; for (let i = 2; i < tp.length - 2; i += 4) { c.beginPath(); c.moveTo(tp[i], tp[i + 1]); c.lineTo(tp[i + 2], tp[i + 3]); c.stroke(); } c.restore(); }
  /* coxas e corpo */
  R.ell(cx - bw * .78, RG - 7 + L * 1.5, 8.5 - L * 2, 7.5 - L * 2.5, 0, C.b); R.ell(cx + bw * .78, RG - 7 + L * 1.5, 8.5 - L * 2, 7.5 - L * 2.5, 0, C.b);
  R.ell(cx, by, bw, bh, 0, C.b); R.ell(cx, by - bh * .7, bw * .62, 7, 0, C.b);
  R.flush();
  c.save(); c.beginPath(); c.ellipse(cx, by, bw, bh, 0, 0, Math.PI * 2); c.clip();
  if (C.patch) { c.fillStyle = C.patch; c.beginPath(); c.ellipse(cx + bw * .6, by - bh * .4, bw * .6, bh * .7, .3, 0, Math.PI * 2); c.fill(); }
  if (C.stripe) { c.strokeStyle = C.d; c.lineWidth = 1.8; c.lineCap = 'round'; [-1, 1].forEach(d => [0, 4.5, 9].forEach(o => { c.beginPath(); c.moveTo(cx + d * (bw - .5), by - bh * .5 + o); c.lineTo(cx + d * (bw - 5), by - bh * .4 + o + 1); c.stroke(); })); }
  if (C.white) { c.fillStyle = C.w; c.beginPath(); c.ellipse(cx, by + 2 - L * 2, bw * .52, bh * .95, 0, 0, Math.PI * 2); c.fill(); }
  c.fillStyle = 'rgba(40,20,30,.10)'; c.beginPath(); c.ellipse(cx, by + bh * .85, bw * .9, bh * .4, 0, 0, Math.PI * 2); c.fill();
  c.restore();
  /* patas da frente */
  const pc = C.white && !C.patch ? C.w : C.white ? C.w : C.b;
  const lift = m.paw || 0;
  if (L < .5) {
    R.cap([cx - 4.6, by + 1, cx - 4.6 + lift * 2, RG - 3 - lift * 22], 6.6, pc); R.ell(cx - 4.6 + lift * 2, RG - 2 - lift * 22, 4.2, 3, 0, pc);
    R.cap([cx + 4.6, by + 1, cx + 4.6, RG - 3], 6.6, pc); R.ell(cx + 4.6, RG - 2, 4.2, 3, 0, pc);
  } else { R.ell(cx - 6, RG - 2.2, 5, 3, 0, pc); R.ell(cx + 6, RG - 2.2, 5, 3, 0, pc); }
  R.ell(cx - bw * .8 - 2, RG - 1.8, 4.2, 2.6, 0, pc); R.ell(cx + bw * .8 + 2, RG - 1.8, 4.2, 2.6, 0, pc);
  R.flush();
  c.strokeStyle = rgbS(hex2(RO), .6); c.lineWidth = .7; [[cx - 4.6 + lift * 2, RG - 2 - lift * 22], [cx + 4.6, RG - 2]].forEach(([x, y]) => { if (L >= .5) return; c.beginPath(); c.moveTo(x - 1.2, y - 1); c.lineTo(x - 1.2, y + 2); c.moveTo(x + 1.2, y - 1); c.lineTo(x + 1.2, y + 2); c.stroke(); });
  /* cabeça */
  c.save(); c.translate(hx, hy + 12); c.rotate(m.tilt || 0); c.translate(-hx, -(hy + 12));
  rigHead(R, c, C, hx, hy, 1, m);
  c.restore();
}
/* ---- gato de lado (em pé, andando, espreguiçando) ---- */
function rigSide(c, C, m) {
  const R = rigCtx(c), ph = m.ph || 0, w = m.walk || 0, st = m.stretch || 0, br = m.br || 0;
  const cx = RW / 2 - 4, L1 = 8.6, L2 = 8.8;
  const bob = w * Math.abs(Math.sin(ph)) * 1.6;
  const sh = [cx + 13, RG - 21 + st * 7 - bob], hp = [cx - 12, RG - 21 - st * 4 - bob];
  const leg = (j, a, k) => { const kx = j[0] + Math.sin(a) * L1, ky = j[1] + Math.cos(a) * L1, fx = kx + Math.sin(a + k) * L2, fy = Math.min(RG - 2, ky + Math.cos(a + k) * L2); return [j[0], j[1], kx, ky, fx, fy]; };
  const gait = o => [Math.sin(ph + o) * .52 * w, Math.max(0, Math.cos(ph + o)) * .9 * w];
  const fnA = gait(0), hfA = gait(0), ffA = gait(Math.PI), hnA = gait(Math.PI);
  const fl = (j, g, front, extra = 0) => leg(j, g[0] + (front ? -st * .9 : st * .15) + extra, front ? g[1] + st * .9 : -g[1] * .9);
  const FF = fl([sh[0] - 2, sh[1]], ffA, 1), HF = fl([hp[0] + 2, hp[1]], hfA, 0);
  const FN = fl([sh[0] + 1, sh[1] + 1], fnA, 1), HN = fl([hp[0] - 1, hp[1] + 1], hnA, 0);
  const pc = C.white && !C.patch ? C.w : C.b, fc = C.patch ? C.s : C.s;
  /* rabo */
  const tb = [hp[0] - 9, hp[1] - 4], tp = [...tb];
  for (let i = 1; i <= 8; i++) { const a = (-150 + i * (12 - st * 4) + Math.sin((m.t || 0) * .1 - i * .45) * (8 + w * 6)) * Math.PI / 180; tp.push(tp[tp.length - 2] + Math.cos(a) * 3.4, tp[tp.length - 1] + Math.sin(a) * 3.4); }
  R.cap(tp, 6.2, C.patch || C.b); R.flush();
  if (C.stripe) { c.save(); c.strokeStyle = C.d; c.lineWidth = 6.2; for (let i = 2; i < tp.length - 2; i += 4) { c.beginPath(); c.moveTo(tp[i], tp[i + 1]); c.lineTo(tp[i + 2], tp[i + 3]); c.stroke(); } c.restore(); }
  /* patas de trás do lado de lá */
  [FF, HF].forEach(Lg => { R.cap(Lg.slice(0, 4), 6.4, fc); R.cap(Lg.slice(2), 5.6, fc); R.ell(Lg[4] + 1.2, Lg[5] + .4, 3.6, 2.3, 0, C.white ? mixHex(C.w, '#998877', .2) : fc); });
  R.flush();
  /* corpo */
  const ang = Math.atan2(sh[1] - hp[1], sh[0] - hp[0]);
  R.circle(sh[0], sh[1] - 3 + br * .3, 10.2, C.b); R.circle(hp[0], hp[1] - 3 + br * .3, 11, C.b);
  R.cap([hp[0], hp[1] - 4.5, sh[0], sh[1] - 4.5], 19 + br * .5, C.b);
  const hx = sh[0] + 9 + st * 4, hy = sh[1] - 15 + st * 10 - bob * .6 + (m.nod || 0);
  R.cap([sh[0] - 1, sh[1] - 6, hx - 2, hy + 6], 13, C.b);
  R.flush();
  c.save(); c.beginPath(); c.arc(sh[0], sh[1] - 3, 10.2, 0, 7); c.arc(hp[0], hp[1] - 3, 11, 0, 7); c.rect(hp[0], Math.min(hp[1], sh[1]) - 14, sh[0] - hp[0], 22); c.clip();
  if (C.patch) { c.fillStyle = C.patch; c.beginPath(); c.ellipse((sh[0] + hp[0]) / 2 - 3, (sh[1] + hp[1]) / 2 - 11, 14, 8, ang, 0, Math.PI * 2); c.fill(); }
  if (C.stripe) { c.strokeStyle = C.d; c.lineWidth = 2; c.lineCap = 'round'; for (let i = -2; i <= 2; i++) { const x = (sh[0] + hp[0]) / 2 + i * 5.2; const y = (sh[1] + hp[1]) / 2 - 13; c.beginPath(); c.moveTo(x - 1, y); c.quadraticCurveTo(x + 1.5, y + 5, x + .5, y + 9); c.stroke(); } }
  if (C.white) { c.fillStyle = C.w; c.beginPath(); c.ellipse((sh[0] + hp[0]) / 2 + 4, (sh[1] + hp[1]) / 2 + 5, 15, 6, ang, 0, Math.PI * 2); c.fill(); }
  c.fillStyle = 'rgba(40,20,30,.10)'; c.beginPath(); c.ellipse((sh[0] + hp[0]) / 2, (sh[1] + hp[1]) / 2 + 7, 22, 5, ang, 0, Math.PI * 2); c.fill();
  c.restore();
  /* patas do lado de cá */
  [HN, FN].forEach(Lg => { R.cap(Lg.slice(0, 4), 6.8, pc === C.w ? C.b : pc); R.cap(Lg.slice(2), 5.8, pc); R.ell(Lg[4] + 1.3, Lg[5] + .4, 3.9, 2.5, 0, C.white ? C.w : pc); R.flush(); });
  /* cabeça */
  c.save(); c.translate(hx, hy + 10); c.rotate((m.tilt || 0) + st * .12); c.translate(-hx, -(hy + 10));
  rigHead(R, c, C, hx, hy, .88, Object.assign({}, m, { turn: .55 }));
  c.restore();
}
function mixHex(a, b, t) { return rgbS(mixC(hex2(a), hex2(b), t)); }
const RIG_LOW = 1.25;
function paintRig(cv, k, m) {
  const C = RIG[rigKey(k)], px = !!(db.s.pets && db.s.pets.px);
  const S = px ? RIG_LOW : 2.6, W = Math.round(RW * S), H = Math.round(RH * S);
  const off = cv._roff || (cv._roff = document.createElement('canvas'));
  if (off.width !== W || off.height !== H) { off.width = W; off.height = H; }
  const c = off.getContext('2d'); c.setTransform(1, 0, 0, 1, 0, 0); c.clearRect(0, 0, W, H); c.setTransform(S, 0, 0, S, 0, 0);
  c.translate(RW / 2, RG); c.rotate(m.rot || 0); c.scale(m.sx || 1, m.sy || 1); c.translate(-RW / 2, -RG + (m.dy || 0));
  if (m.view === 'side') rigSide(c, C, m); else rigFront(c, C, m);
  if (px) {
    const img = c.getImageData(0, 0, W, H), D = img.data;
    for (let i = 3; i < D.length; i += 4) D[i] = D[i] > 110 ? 255 : 0;
    c.setTransform(1, 0, 0, 1, 0, 0); c.putImageData(img, 0, 0);
  }
  const OW = px ? W * 2 : W, OH = px ? H * 2 : H;
  if (cv.width !== OW || cv.height !== OH) { cv.width = OW; cv.height = OH; }
  const o = cv.getContext('2d'); o.setTransform(1, 0, 0, 1, 0, 0); o.globalAlpha = 1;
  const now = performance.now();
  if (cv._rv !== m.view) { if (cv._rv) { const f = cv._rf || (cv._rf = document.createElement('canvas')); f.width = OW; f.height = OH; f.getContext('2d').drawImage(cv, 0, 0); cv._rft = now; } cv._rv = m.view; }
  o.clearRect(0, 0, OW, OH);
  const fa = cv._rft ? 1 - (now - cv._rft) / 260 : 0;
  if (fa > 0 && cv._rf && cv._rf.width === OW) { o.globalAlpha = fa; o.drawImage(cv._rf, 0, 0); o.globalAlpha = 1 - fa * .5; }
  o.imageSmoothingEnabled = !px; o.drawImage(off, 0, 0, OW, OH); o.globalAlpha = 1;
}

function petBreedName(k) { return petStyle() === 'animado' ? RIG[rigKey(k)].n : petStyle() === 'ilustrado' ? CHB[chbKey(k)].n : CATS[k] ? CATS[k].n : (CHB[k] && CHB[k].n) || ''; }
function petStyle() { return (db.s.pets && db.s.pets.style) || 'animado'; }
function drawPet(cv, k, P, m) { if (petStyle() === 'animado') { paintRig(cv, k, m); cv.classList.toggle('real', !(db.s.pets && db.s.pets.px)); return; } if (petStyle() === 'ilustrado') { paintSprite(cv, k, m); cv.classList.add('real'); return; } k = { pretobranco: 'frajola', brancopreto: 'frajola' }[k] || k; if (petStyle() === 'fofo') { if (cv.width !== CW) { cv.width = CW; cv.height = CH; } paintCute(cv, k, P, m); cv.classList.remove('real'); return; } if (petStyle() === 'pixel') { if (cv.width !== GW) { cv.width = GW; cv.height = GH; } paintCat(cv, k, P, m); } else { const K = Math.round(CW * Math.min(8, Math.max(4, (cv._sc || 3) * Math.min(2, devicePixelRatio || 1)))); if (cv.width !== K) { cv.width = K; cv.height = Math.round(K * CH / CW); } paintCatReal(cv, k, P, m); } cv.classList.toggle('real', petStyle() !== 'pixel'); }
function catCanvas(k, pose = 'sit', cls = '') { const cv = document.createElement('canvas'); cv.width = GW; cv.height = GH; cv.className = 'petcv ' + cls; cv._sc = 2; drawPet(cv, k, POSES[typeof pose === 'string' ? pose : 'sit'], { fmode: pose === 'lie' || pose === 'sleep' ? 'loaf' : 'sit', blush: 1 }); return cv; }
function catImg(k, pose, size = 88) { if (petStyle() === 'animado') { const cv = document.createElement('canvas'); paintRig(cv, k, { view: 'front', eyes: '', loaf: pose === 'lie' ? 1 : 0 }); return `<img class="petimg" src="${cv.toDataURL()}" width="${size}" height="${Math.round(size * RH / RW)}" style="image-rendering:${db.s.pets && db.s.pets.px ? 'pixelated' : 'auto'}" alt="">`; } if (petStyle() === 'ilustrado') { return `<img class="petimg" src="assets/pets/${chbKey(k)}/frente.png" style="height:${Math.round(size * .78)}px;width:auto" alt="">`; } const cv = catCanvas(k, pose); return `<img class="petimg" src="${cv.toDataURL()}" width="${size}" height="${Math.round(size * CH / CW)}" alt="">`; }

/* ---------- gatos na tela ---------- */
const PETS = { box: null, list: [], tick: null };
function petCfg() { const p = db.s.pets || {}; return { on: !!p.on, style: p.style || 'animado', px: !!p.px, cats: Array.isArray(p.cats) ? p.cats.slice(0, 2) : [] }; }
function savePets(p) { db.s.pets = p; put('s', db.s); petsSync(); }
function petScale() { const a = petStyle() === 'animado'; return isMobile() ? (a ? 2.8 : 2.5) : (a ? 3.5 : 3); }
function petPos() { try { return JSON.parse(localStorage.getItem('tt_petpos') || '{}'); } catch (e) { return {}; } }
function savePos() { const m = {}; PETS.list.forEach(p => { const [W, H] = p.room(); m[p.slot] = { x: W ? p.X / W : 0, y: H ? p.Y / H : 0 }; }); try { localStorage.setItem('tt_petpos', JSON.stringify(m)); } catch (e) {} }
function petsSync() {
  const cfg = petCfg(), want = cfg.on ? cfg.cats : [];
  const sig = petStyle() + JSON.stringify(want.map(c => c.k + '|' + (c.n || '')));
  if (PETS.sig === sig) return;
  PETS.sig = sig;
  PETS.list.forEach(p => p.kill()); PETS.list = [];
  cancelAnimationFrame(PETS.tick); PETS.tick = null;
  if (!want.length) { if (PETS.box) PETS.box.remove(); PETS.box = null; return; }
  if (!PETS.box) { PETS.box = document.createElement('div'); PETS.box.id = 'pets'; document.body.appendChild(PETS.box); }
  const pos = petPos();
  if (petStyle() === 'ilustrado') want.forEach(c => sprPreload(c.k));
  want.forEach((c, i) => PETS.list.push(makePet(c, i, pos[i])));
  const smooth = petStyle() === 'ilustrado' || petStyle() === 'animado'; let last = performance.now(), acc = 0;
  const loop = ts => {
    if (!PETS.tick) return; PETS.tick = requestAnimationFrame(loop);
    const dt = Math.min(120, ts - last); last = ts; if (document.hidden) return;
    if (smooth) PETS.list.forEach(p => p.step(dt / 90));
    else { acc += dt; if (acc >= 90) { acc = 0; PETS.list.forEach(p => p.step(1)); } }
  };
  PETS.tick = requestAnimationFrame(loop);
}
function petsReset() { try { localStorage.removeItem('tt_petpos'); } catch (e) {} PETS.sig = null; petsSync(); }
function makePet(c, slot, saved) {
  const SC = petScale(), EW = CW * SC, EH = CH * SC;
  const el = document.createElement('div'); el.className = 'pet'; el.style.width = EW + 'px'; el.style.height = EH + 'px'; el.style.setProperty('--sc', SC);
  el.setAttribute('role', 'img'); el.setAttribute('aria-label', 'Gatinho ' + (c.n || ''));
  el.innerHTML = `<span class="petsh"></span><div class="petb"></div><span class="petfx"></span>`;
  const cv = document.createElement('canvas'); cv.width = GW; cv.height = GH; cv.className = 'petcv'; cv._sc = SC; el.querySelector('.petb').appendChild(cv);
  PETS.box.appendChild(el);
  const room = () => [Math.max(0, innerWidth - EW), Math.max(0, innerHeight - EH)];
  const p = { slot, k: c.k, n: c.n, el, cv, room, dead: false, timers: [], t: 0, dir: slot ? -1 : 1, pose: 'sit', P: cloneP(POSES.sit), tw: null, walk: null, m: {}, busy: false };
  { const [W, H] = room(); p.X = saved ? saved.x * W : W - (slot ? 150 : 40) * SC / 3 - (slot ? 60 : 0); p.Y = saved ? saved.y * H : H * (isMobile() ? .86 : .92); }
  const place = () => { const [W, H] = room(); p.X = Math.min(Math.max(p.X, 0), W); p.Y = Math.min(Math.max(p.Y, 0), H); el.style.transform = `translate(${Math.round(p.X)}px,${Math.round(p.Y)}px)`; cv.style.transform = p.dir < 0 ? 'scaleX(-1)' : ''; };
  p.place = place; place();
  const T = (fn, ms) => { const id = setTimeout(() => { if (!p.dead) fn(); }, ms); p.timers.push(id); if (p.timers.length > 40) p.timers = p.timers.slice(-20); return id; };
  const fx = (html, cls) => { const s = document.createElement('span'); s.className = 'pfx ' + (cls || ''); s.innerHTML = html; el.querySelector('.petfx').appendChild(s); setTimeout(() => s.remove(), 1800); };
  const other = () => PETS.list.find(q => q !== p);
  const toPose = (name, ms = 500) => { p.tw = { from: cloneP(p.P), to: POSES[name], t: 0, n: Math.max(1, Math.round(ms / 90)) }; p.pose = name; };
  /* desenho de cada quadro */
  p.step = (k = 1) => {
    p.t += k;
    if (p.tw) { const tw = p.tw; tw.t += k; const e = tw.t / tw.n, k = e < .5 ? 2 * e * e : 1 - Math.pow(-2 * e + 2, 2) / 2; p.P = lerpP(tw.from, tw.to, Math.min(1, k)); if (tw.t >= tw.n) p.tw = null; }
    const P = cloneP(p.P), t = p.t;
    const sleeping = p.pose === 'sleep', held = p.pose === 'hang';
    if (!p.walk && !held) { const br = Math.sin(t * (sleeping ? .07 : .11)) * (sleeping ? .3 : .18); P.b[3] += br; P.ha[3] += br * .6; P.h[1] += br * .5; }
    const amp = sleeping ? 3 : p.pose === 'lie' ? 5 : held ? 10 : p.pose === 'sit' ? 9 : 12, sp = sleeping ? .05 : held ? .3 : .13;
    P.ta = P.ta.map((a, i) => a + Math.sin(t * sp - i * .5) * amp * (i / 6));
    if (p.walk) {
      const w = p.walk; w.ph += .42 * k;
      const legs = [['fn', 0], ['hf', 0], ['ff', Math.PI], ['hn', Math.PI]];
      legs.forEach(([k, o]) => { const s = Math.sin(w.ph + o), lift = Math.max(0, Math.cos(w.ph + o)); P[k][4] += s * 2.3; P[k][5] -= lift * 1.3; P[k][2] += s * 1.1; });
      const bob = Math.abs(Math.sin(w.ph)) * .45; P.b[1] -= bob; P.ha[1] -= bob; P.h[1] -= bob * .7; P.nk[1] -= bob; P.nk[3] -= bob;
      p.X += p.dir * SC * .44 * k; place();
      const [W] = room(); w.left -= SC * .44 * k;
      if (w.left <= 0 || p.X <= 0 || p.X >= W) { p.walk = null; savePos(); w.done(); }
    }
    if (p.pose === 'groom') { P.fn[5] += Math.sin(t * .55) * 1.1; P.fn[3] += Math.sin(t * .55) * .6; p.m.tongue = Math.sin(t * .55) > .2; }
    if (petStyle() === 'animado') {
      const now = performance.now(), sl = p.pose === 'sleep', side = !!p.walk || p.pose === 'stand' || p.pose === 'stretch';
      const S = p.cs || (p.cs = { loaf: 0, paw: 0, st: 0, w: 0, tilt: 0, look: 0, mouth: 0, rot: 0, dy: 0, ph: 0 });
      const ez = (key, target, sp) => { S[key] += (target - S[key]) * Math.min(1, sp * k); return S[key]; };
      if (!p.nb || now > p.nb) { p.bu = now + 130; p.nb = now + 2200 + Math.random() * 3800; if (Math.random() < .25) p.bu2 = now + 320; }
      if (!p.ne || now > p.ne) { p.eu = now + 160; p.ne = now + 4000 + Math.random() * 6000; }
      const blink = p.m.blink || now < p.bu || (p.bu2 && now > p.bu2 && now < p.bu2 + 120);
      if (p.walk) S.ph = p.walk.ph;
      ez('loaf', p.pose === 'lie' || sl ? 1 : 0, .1); ez('paw', p.pose === 'groom' ? .55 + Math.sin(t * .5) * .35 : 0, .25); ez('st', p.pose === 'stretch' ? 1 : 0, .08); ez('w', p.walk ? 1 : 0, .2);
      ez('tilt', p.m.tilt != null ? p.m.tilt : Math.sin(t * .035) * .05, .12); ez('look', p.m.look || Math.sin(t * .021) * .35, .12);
      ez('mouth', p.m.mouth ? 1 : p.pose === 'stretch' ? .8 : 0, .3);
      ez('rot', p.pose === 'hang' ? Math.sin(t * .45) * .12 : p.m.happy ? Math.sin(t * .5) * .05 : 0, .3);
      ez('dy', p.m.happy ? -Math.abs(Math.sin(t * .45)) * 5 : 0, .45);
      const eyes = p.m.happy ? 'happy' : sl || p.pose === 'groom' || (p.pose === 'stretch' && S.st > .5) || blink ? 'closed' : p.pose === 'lie' && Math.sin(t * .02) > .45 ? 'sleepy' : '';
      const br = Math.sin(t * (sl ? .07 : .11));
      drawPet(cv, p.k, P, { view: side ? 'side' : 'front', t, ph: S.ph, walk: S.w, stretch: S.st, loaf: S.loaf, paw: S.paw, tongue: p.pose === 'groom' ? Math.max(0, Math.sin(t * .5)) : 0, eyes, mouth: S.mouth > .05 ? S.mouth : 0, tilt: S.tilt, look: S.look, lookY: p.pose === 'hang' ? -.6 : 0, sway: Math.sin(t * (sl ? .05 : p.pose === 'hang' ? .3 : .11)), br, bob: br * .5, earR: now < p.eu ? 1 : 0, blush: p.m.happy, rot: S.rot, dy: S.dy, sy: 1 + br * (sl ? .02 : .012), sx: 1 - br * .004 });
      return;
    }
    if (petStyle() === 'ilustrado') {
      const now = performance.now(), ph = p.walk ? p.walk.ph : 0, sl = p.pose === 'sleep', br = Math.sin(t * (sl ? .07 : .11));
      const sp = p.pose === 'hang' ? 'frente' : p.m.happy ? 'carinho' : p.walk || p.pose === 'stand' || p.pose === 'stretch' ? 'andando' : p.pose === 'lie' || sl ? 'deitado' : p.pose === 'groom' ? 'carinho' : (p.m.view || 'frente');
      if (!p.nb || now > p.nb) { p.bu = now + 120; p.nb = now + 2400 + Math.random() * 3600; if (Math.random() < .25) p.bu2 = now + 300; }
      const blink = p.m.blink || now < p.bu || (p.bu2 && now > p.bu2 && now < p.bu2 + 110);
      const S = p.sm || (p.sm = { tilt: 0, rot: 0, dy: 0 }), e = Math.min(1, .14 * k);
      const tTilt = p.m.tilt != null ? p.m.tilt : Math.sin(t * .04) * .03;
      const tRot = p.pose === 'hang' ? Math.sin(t * .45) * .1 : p.m.happy ? Math.sin(t * .5) * .04 : p.walk ? Math.sin(ph) * .012 : 0;
      const tDy = p.walk ? -Math.abs(Math.sin(ph)) * 3.2 : p.m.happy ? -Math.abs(Math.sin(t * .45)) * 4 : p.pose === 'groom' ? Math.sin(t * .5) * 1.5 : 0;
      S.tilt += (tTilt - S.tilt) * e; S.rot += (tRot - S.rot) * Math.min(1, .3 * k); S.dy += (tDy - S.dy) * Math.min(1, .45 * k);
      drawPet(cv, p.k, P, { sp, closed: sl || blink || (p.pose === 'lie' && Math.sin(t * .02) > .55), step: ph, tail: Math.sin(t * (p.walk ? .3 : .1)) * (p.walk ? .17 : .1), tilt: S.tilt, dy: S.dy, rot: S.rot, sy: 1 + br * (sl ? .024 : .014), sx: (p.pose === 'stretch' ? 1.07 : 1) * (1 - br * .005) });
      return;
    }
    drawPet(cv, p.k, P, Object.assign({}, p.m, { fmode: p.pose === 'lie' || p.pose === 'sleep' ? 'loaf' : 'sit', eyes: p.m.eyes || (p.pose === 'sleep' || p.pose === 'groom' || p.pose === 'stretch' ? 'closed' : p.pose === 'hang' ? 'wide' : p.pose === 'lie' && Math.sin(t * .02) > .3 ? 'sleepy' : undefined), paw: p.pose === 'groom', walkf: p.walk ? (Math.floor(p.walk.ph / 1.5) % 2) + 1 : 0, tail: Math.sin(t * (p.pose === 'sleep' ? .05 : .13)) > .35 ? 1 : 0, bob: p.walk ? (Math.floor(p.walk.ph / 1.5) % 2) : (Math.sin(t * .11) > .75 ? 1 : 0), blink: p.m.blink || (P.eye > .5 && !p.walk && (t % 47 === 0 || t % 47 === 1)) }));
  };
  /* comportamento */
  const wait = (ms, fn) => T(fn, ms);
  const next = () => {
    if (p.dead || p.pose === 'hang') return;
    const r = Math.random();
    if (p.pose === 'sit') {
      if (r < .25) return wait(2500 + Math.random() * 3500, next);
      if (r < .4) { toPose('groom', 500); return wait(3200, () => { toPose('sit', 500); p.m.tongue = false; wait(1200, next); }); }
      if (r < .5) { p.m.mouth = 1; fx(Math.random() < .5 ? 'miau' : 'miau~', 'say'); return wait(650, () => { p.m.mouth = 0; wait(1500, next); }); }
      if (r < .58) {
        if (petStyle() === 'animado') { const g = Math.random(); if (g < .45) { p.m.tilt = (Math.random() < .5 ? -1 : 1) * .2; return wait(1500 + Math.random() * 1500, () => { p.m.tilt = null; wait(800, next); }); } const o = other(); p.m.look = o ? (o.X < p.X ? -1 : 1) * p.dir : (Math.random() < .5 ? -1 : 1); return wait(1600 + Math.random() * 2200, () => { p.m.look = 0; wait(900, next); }); }
        if (petStyle() === 'ilustrado') { const g = Math.random(); if (g < .4) { p.m.tilt = (Math.random() < .5 ? -1 : 1) * .14; return wait(1600 + Math.random() * 1500, () => { p.m.tilt = null; wait(900, next); }); } const opts = ['lat_dir', 'lat_esq', 'sentado', sprOk(sprImg(p.k, 'costas')) ? 'costas' : 'sentado']; p.m.view = opts[Math.floor(Math.random() * opts.length)]; return wait(2200 + Math.random() * 3000, () => { p.m.view = null; wait(1000, next); }); }
        p.dir = -p.dir; place(); return wait(1800, next);
      }
      if (r < .82) { toPose('stand', 600); return wait(800, next); }
      toPose('lie', 900); return wait(2500, next);
    }
    if (p.pose === 'stand' || p.pose === 'stretch') {
      if (p.pose === 'stand' && r < .62) {
        const [W] = room(), o = other();
        let dir = o && Math.random() < .35 ? (o.X < p.X ? -1 : 1) : (Math.random() < .5 ? -1 : 1);
        if (p.X < 30) dir = 1; if (p.X > W - 30) dir = -1;
        p.dir = dir; place();
        p.walk = { ph: 0, left: 40 + Math.random() * 140, done: () => { toPose('stand', 300); wait(700, next); } };
        return;
      }
      if (p.pose === 'stand' && r < .78) { toPose('stretch', 900); p.m.mouth = 1; return wait(1900, () => { p.m.mouth = 0; toPose('stand', 700); wait(1000, next); }); }
      toPose('sit', 700); return wait(2000, next);
    }
    if (p.pose === 'lie') {
      if (r < .45) { toPose('sleep', 1400); return wait(1500, () => { const zz = () => { if (p.pose !== 'sleep' || p.dead) return; fx('z', 'z'); T(zz, 1500); }; zz(); wait(10000 + Math.random() * 16000, () => { if (p.pose === 'sleep') { toPose('lie', 900); wait(2500, next); } }); }); }
      if (r < .75) { toPose('sit', 900); return wait(1800, next); }
      if (r < .87) { p.dir = -p.dir; place(); }
      return wait(2500 + Math.random() * 3000, next);
    }
    wait(1500, next);
  };
  wait(800 + slot * 1500 + Math.random() * 1500, next);
  /* toque e arraste */
  let sx = 0, sy = 0, ox = 0, oy = 0, moved = false, down = false;
  el.addEventListener('pointerdown', e => {
    e.preventDefault(); down = true; moved = false; sx = e.clientX; sy = e.clientY; ox = e.clientX - p.X; oy = e.clientY - p.Y;
    try { el.setPointerCapture(e.pointerId); } catch (er) {}
  });
  el.addEventListener('pointermove', e => {
    if (!down) return;
    if (!moved && Math.hypot(e.clientX - sx, e.clientY - sy) < 6) return;
    if (!moved) { moved = true; p.timers.forEach(clearTimeout); p.timers = []; p.walk = null; p.m = {}; el.classList.add('held'); toPose('hang', 250); }
    p.X = e.clientX - ox; p.Y = e.clientY - oy; place();
  });
  const up = () => {
    if (!down) return; down = false;
    if (moved) { el.classList.remove('held'); el.classList.add('land'); setTimeout(() => el.classList.remove('land'), 420); toPose('stand', 250); savePos(); wait(900, next); return; }
    const wasSleep = p.pose === 'sleep';
    if (wasSleep) { p.timers.forEach(clearTimeout); p.timers = []; toPose('lie', 600); wait(2500, next); }
    p.m.blink = petStyle() !== 'fofo' && petStyle() !== 'ilustrado'; p.m.eyes = 'happy'; p.m.happy = true; p.m.view = null; fx('♥', 'heart'); setTimeout(() => fx('♥', 'heart h2'), 220); if (p.n) fx(esc(p.n), 'name');
    el.classList.add('purr'); T(() => { el.classList.remove('purr'); p.m.blink = false; p.m.eyes = undefined; p.m.happy = false; }, 1300);
  };
  el.addEventListener('pointerup', up); el.addEventListener('pointercancel', up);
  p.kill = () => { p.dead = true; p.timers.forEach(clearTimeout); el.remove(); };
  p.step();
  return p;
}
addEventListener('resize', () => PETS.list.forEach(p => p.place()));

/* ---------- tela de escolha ---------- */
VIEWS.pets = main => {
  const cfg = petCfg(), sel = cfg.cats.map(c => c.k);
  main.innerHTML = headHtml('Pets') + `<div class="scroll"><div class="me pets">
    <nav class="crumbs"><a href="#/me">Perfil</a><span>/</span><span>Pets</span></nav>
    <label class="srow petsw"><span class="f1"><b>Mostrar gatinhos no app</b><span class="mut sm">Eles ficam parados pela tela, piscando, abanando o rabo, se lambendo e até cochilando.</span></span><span class="sw-t"><input type="checkbox" data-petson ${cfg.on ? 'checked' : ''}><span></span></span></label>
    <div class="srow petsw"><span class="f1"><b>Estilo</b><span class="mut sm">Animado: gatos articulados com animação completa. Seus desenhos: as suas folhas. Fofo: pixels grandes. Realista: volume e pelagem. Pixelado: estilo videogame.</span></span><div class="seg">${[['animado', 'Animado'], ['ilustrado', 'Seus desenhos'], ['fofo', 'Fofo'], ['real', 'Realista'], ['pixel', 'Pixelado']].map(([k, n]) => `<button class="${petStyle() === k ? 'on' : ''}" data-act="petstyle" data-v="${k}">${n}</button>`).join('')}</div></div>
    ${petStyle() === 'animado' ? `<label class="srow petsw"><span class="f1"><b>Visual pixelado</b><span class="mut sm">Deixa o desenho com cara de videogame.</span></span><span class="sw-t"><input type="checkbox" data-petpx ${db.s.pets && db.s.pets.px ? 'checked' : ''}><span></span></span></label>` : ''}
    <section class="sgrp"><h2>🐈 Escolha até dois gatos</h2>
      <div class="petgrid">${(petStyle() === 'animado' ? Object.entries(RIG) : petStyle() === 'ilustrado' ? Object.entries(CHB) : Object.entries(CATS)).map(([k, c]) => { const i = sel.indexOf(k); return `<button class="petcard${i >= 0 ? ' on' : ''}" data-act="petpick" data-k="${k}">${i >= 0 ? `<span class="petnum">${i + 1}</span>` : ''}${catImg(k, 'sit', 92)}<span>${esc(c.n)}</span></button>`; }).join('')}</div>
    </section>
    ${cfg.cats.length ? `<section class="sgrp"><h2>Nomes</h2>${cfg.cats.map((c, i) => `<div class="srow"><span class="row">${catImg(c.k, 'sit', 44)}<span class="mut sm">${esc(petBreedName(c.k))}</span></span><input class="in sm" data-petname="${i}" value="${esc(c.n || '')}" maxlength="20" placeholder="Nome"></div>`).join('')}</section>` : ''}
    <p class="hint">Arraste um gatinho para colocá-lo onde quiser. Toque nele para fazer carinho. A posição fica salva em cada aparelho.</p>
    <div class="row"><button class="btn ghost sm" data-act="petsreset">Trazer os gatos de volta para o canto</button></div>
  </div></div>`;
  main.querySelectorAll('[data-petname]').forEach(i => i.onchange = () => { const p = petCfg(); if (p.cats[+i.dataset.petname]) { p.cats[+i.dataset.petname].n = i.value.trim(); savePets(p); } });
};
Object.assign(ACTS, {
  petpick: b => {
    const p = petCfg(), k = b.dataset.k, i = p.cats.findIndex(c => c.k === k);
    if (i >= 0) p.cats.splice(i, 1);
    else {
      if (p.cats.length >= 2) { toast('Você pode ter até dois gatos. Toque em um escolhido para tirá-lo.'); return; }
      const used = p.cats.map(c => c.n); p.cats.push({ k, n: CAT_NAMES.find(n => !used.includes(n)) || '' });
      if (!p.on) p.on = true;
    }
    savePets(p); render();
  },
  petstyle: b => { const p = petCfg(); p.style = b.dataset.v; savePets(p); render(); },
  petsreset: () => { petsReset(); toast('Gatos de volta ao canto'); },
  petstoggle: () => { const p = petCfg(); p.on = !p.on; if (p.on && !p.cats.length) p.cats = [{ k: 'laranja', n: 'Mingau' }]; savePets(p); toast(p.on ? 'Gatinhos à vista 🐈' : 'Gatinhos guardados'); if (R.v === 'pets' || R.v === 'settings' || R.v === 'me') render(); },
});
document.addEventListener('change', e => { if (e.target.matches && e.target.matches('[data-petpx]')) { const p = petCfg(); p.px = e.target.checked; db.s.pets = p; PETS.sig = null; petsSync(); put('s', db.s); render(); return; } if (e.target.matches && e.target.matches('[data-petson]')) { const p = petCfg(); p.on = e.target.checked; if (p.on && !p.cats.length) p.cats = [{ k: 'laranja', n: 'Mingau' }]; savePets(p); if (R.v === 'pets') render(); } });
