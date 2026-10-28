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
function rastCat(P, m = {}) {
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
  const hrr = hr * Math.PI / 180, hp = (u, v) => [hx + u * Math.cos(hrr) - v * Math.sin(hrr), hy + u * Math.sin(hrr) + v * Math.cos(hrr)];
  tri(hp(-3.7, -1.4), hp(-.8, -3.2), hp(-3, -6.8), 'R', .25);
  ell(hx, hy, 4.3, 3.8, hr, 'H');
  ell(...hp(-1.2, 1.3), 2.6, 2.2, hr, 'H');
  tri(hp(-1.3, -2.6), hp(2.3, -2.6), hp(.2, -7), 'R', .7);
  tri(hp(-.4, -3.1), hp(1.4, -3.1), hp(.2, -5.6), 'p', .6);
  ell(...hp(3.3, 1.3), 1.9, 1.5, hr, 'M');
  const G = (u, v) => { const [x, y] = hp(u, v); return [Math.floor(x * RS), Math.floor(y * RS)]; };
  const [ex, ey] = G(1.6, -.9);
  if (P.eye > .5 && !m.blink) { set(ex, ey, 'E', .9); set(ex + 1, ey, 'k', 0); set(ex + 2, ey, 'E', .5); set(ex, ey + 1, 'E', .6); set(ex + 1, ey + 1, 'k', 0); set(ex + 2, ey + 1, 'E', .4); set(ex + 2, ey - 1 < 0 ? ey : ey, 'h', 1); }
  else { set(ex, ey + 1, 'c', 0); set(ex + 1, ey + 1, 'c', 0); set(ex + 2, ey + 1, 'c', 0); }
  const [nx, ny] = G(5.1, .3); set(nx, ny, 'n', .7); set(nx - 1, ny, 'n', .5);
  const [mx, my] = G(4.4, 2.1);
  if (m.mouth) { set(mx, my, 'k', 0); set(mx + 1, my, 'k', 0); set(mx, my + 1, 'p', .5); set(mx + 1, my + 1, 'k', 0); }
  if (m.tongue) { const [qx, qy] = G(5, 2.5); set(qx, qy, 'p', .8); set(qx, qy + 1, 'p', .5); }
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
function petStyle() { return (db.s.pets && db.s.pets.style) || 'real'; }
function drawPet(cv, k, P, m) { if (petStyle() === 'pixel') { if (cv.width !== GW) { cv.width = GW; cv.height = GH; } paintCat(cv, k, P, m); } else { const K = Math.round(CW * Math.min(8, Math.max(4, (cv._sc || 3) * Math.min(2, devicePixelRatio || 1)))); if (cv.width !== K) { cv.width = K; cv.height = Math.round(K * CH / CW); } paintCatReal(cv, k, P, m); } cv.classList.toggle('real', petStyle() !== 'pixel'); }
function catCanvas(k, pose = 'sit', cls = '') { const cv = document.createElement('canvas'); cv.width = GW; cv.height = GH; cv.className = 'petcv ' + cls; cv._sc = 2; drawPet(cv, k, POSES[typeof pose === 'string' ? pose : 'sit'], {}); return cv; }
function catImg(k, pose, size = 88) { const cv = catCanvas(k, pose); return `<img class="petimg" src="${cv.toDataURL()}" width="${size}" height="${Math.round(size * CH / CW)}" alt="">`; }

/* ---------- gatos na tela ---------- */
const PETS = { box: null, list: [], tick: null };
function petCfg() { const p = db.s.pets || {}; return { on: !!p.on, style: p.style || 'real', cats: Array.isArray(p.cats) ? p.cats.slice(0, 2) : [] }; }
function savePets(p) { db.s.pets = p; put('s', db.s); petsSync(); }
function petScale() { return isMobile() ? 2.5 : 3; }
function petPos() { try { return JSON.parse(localStorage.getItem('tt_petpos') || '{}'); } catch (e) { return {}; } }
function savePos() { const m = {}; PETS.list.forEach(p => { const [W, H] = p.room(); m[p.slot] = { x: W ? p.X / W : 0, y: H ? p.Y / H : 0 }; }); try { localStorage.setItem('tt_petpos', JSON.stringify(m)); } catch (e) {} }
function petsSync() {
  const cfg = petCfg(), want = cfg.on ? cfg.cats : [];
  const sig = petStyle() + JSON.stringify(want.map(c => c.k + '|' + (c.n || '')));
  if (PETS.sig === sig) return;
  PETS.sig = sig;
  PETS.list.forEach(p => p.kill()); PETS.list = [];
  clearInterval(PETS.tick); PETS.tick = null;
  if (!want.length) { if (PETS.box) PETS.box.remove(); PETS.box = null; return; }
  if (!PETS.box) { PETS.box = document.createElement('div'); PETS.box.id = 'pets'; document.body.appendChild(PETS.box); }
  const pos = petPos();
  want.forEach((c, i) => PETS.list.push(makePet(c, i, pos[i])));
  PETS.tick = setInterval(() => { if (document.hidden) return; PETS.list.forEach(p => p.step()); }, 90);
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
  p.step = () => {
    p.t++;
    if (p.tw) { const tw = p.tw; tw.t++; const e = tw.t / tw.n, k = e < .5 ? 2 * e * e : 1 - Math.pow(-2 * e + 2, 2) / 2; p.P = lerpP(tw.from, tw.to, Math.min(1, k)); if (tw.t >= tw.n) p.tw = null; }
    const P = cloneP(p.P), t = p.t;
    const sleeping = p.pose === 'sleep', held = p.pose === 'hang';
    if (!p.walk && !held) { const br = Math.sin(t * (sleeping ? .07 : .11)) * (sleeping ? .3 : .18); P.b[3] += br; P.ha[3] += br * .6; P.h[1] += br * .5; }
    const amp = sleeping ? 3 : p.pose === 'lie' ? 5 : held ? 10 : p.pose === 'sit' ? 9 : 12, sp = sleeping ? .05 : held ? .3 : .13;
    P.ta = P.ta.map((a, i) => a + Math.sin(t * sp - i * .5) * amp * (i / 6));
    if (p.walk) {
      const w = p.walk; w.ph += .48;
      const legs = [['fn', 0], ['hf', 0], ['ff', Math.PI], ['hn', Math.PI]];
      legs.forEach(([k, o]) => { const s = Math.sin(w.ph + o), lift = Math.max(0, Math.cos(w.ph + o)); P[k][4] += s * 2.3; P[k][5] -= lift * 1.3; P[k][2] += s * 1.1; });
      const bob = Math.abs(Math.sin(w.ph)) * .45; P.b[1] -= bob; P.ha[1] -= bob; P.h[1] -= bob * .7; P.nk[1] -= bob; P.nk[3] -= bob;
      p.X += p.dir * SC * .5; place();
      const [W] = room(); w.left -= SC * .5;
      if (w.left <= 0 || p.X <= 0 || p.X >= W) { p.walk = null; savePos(); w.done(); }
    }
    if (p.pose === 'groom') { P.fn[5] += Math.sin(t * .55) * 1.1; P.fn[3] += Math.sin(t * .55) * .6; p.m.tongue = Math.sin(t * .55) > .2; }
    drawPet(cv, p.k, P, Object.assign({}, p.m, { blink: p.m.blink || (P.eye > .5 && !p.walk && (t % 47 === 0 || t % 47 === 1)) }));
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
      if (r < .58) { p.dir = -p.dir; place(); return wait(1800, next); }
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
    p.m.blink = true; fx('♥', 'heart'); setTimeout(() => fx('♥', 'heart h2'), 220); if (p.n) fx(esc(p.n), 'name');
    el.classList.add('purr'); T(() => { el.classList.remove('purr'); p.m.blink = false; }, 1300);
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
    <div class="srow petsw"><span class="f1"><b>Estilo</b><span class="mut sm">Realista tem volume, pelagem e olhos detalhados. Pixelado é o estilo de videogame.</span></span><div class="seg">${[['real', 'Realista'], ['pixel', 'Pixelado']].map(([k, n]) => `<button class="${petStyle() === k ? 'on' : ''}" data-act="petstyle" data-v="${k}">${n}</button>`).join('')}</div></div>
    <section class="sgrp"><h2>🐈 Escolha até dois gatos</h2>
      <div class="petgrid">${Object.entries(CATS).map(([k, c]) => { const i = sel.indexOf(k); return `<button class="petcard${i >= 0 ? ' on' : ''}" data-act="petpick" data-k="${k}">${i >= 0 ? `<span class="petnum">${i + 1}</span>` : ''}${catImg(k, 'sit', 92)}<span>${esc(c.n)}</span></button>`; }).join('')}</div>
    </section>
    ${cfg.cats.length ? `<section class="sgrp"><h2>Nomes</h2>${cfg.cats.map((c, i) => `<div class="srow"><span class="row">${catImg(c.k, 'sit', 44)}<span class="mut sm">${esc(CATS[c.k] ? CATS[c.k].n : '')}</span></span><input class="in sm" data-petname="${i}" value="${esc(c.n || '')}" maxlength="20" placeholder="Nome"></div>`).join('')}</section>` : ''}
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
document.addEventListener('change', e => { if (e.target.matches && e.target.matches('[data-petson]')) { const p = petCfg(); p.on = e.target.checked; if (p.on && !p.cats.length) p.cats = [{ k: 'laranja', n: 'Mingau' }]; savePets(p); if (R.v === 'pets') render(); } });
