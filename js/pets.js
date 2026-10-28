/* Pets: até dois gatinhos pixelados que andam, sentam, deitam e cochilam pela tela.
   O gato é montado por formas (corpo, cabeça, patas, cauda) numa grade pequena e pintado pixel a pixel,
   o que permite poses e transições suaves sem perder o visual pixelado. Arraste para mudar de lugar; toque para fazer carinho. */
'use strict';
const CW = 44, CH = 32, CG = 29;
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
const hex2 = h => { const n = parseInt(h.slice(1), 16); return [n >> 16, (n >> 8) & 255, n & 255]; };
const mixC = (a, b, t) => a.map((v, i) => Math.round(v + (b[i] - v) * t));
const rgbS = (c, a = 1) => `rgba(${c[0]},${c[1]},${c[2]},${a})`;
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
  const rx = 3.4 * s, ry = 3.85 * s;
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
  c.fillStyle = 'rgba(255,255,255,.10)'; c.beginPath(); c.ellipse(hx - 6 * s, hy - 7 * s, 7 * s, 3.6 * s, -.35, 0, Math.PI * 2); c.fill();
  c.fillStyle = 'rgba(40,20,30,.07)'; c.beginPath(); c.ellipse(hx, hy + 11 * s, 14 * s, 4 * s, 0, 0, Math.PI * 2); c.fill();
  c.restore();
  rigFace(c, C, hx, hy, s, m.eyes, m);
}
/* ---- gato de frente (sentado ou deitado em pãozinho) ---- */
function rigFront(c, C, m) {
  const R = rigCtx(c), cx = RW / 2, L = m.loaf || 0, br = m.br || 0;
  const by = RG - 15 + L * 6, bh = 17 - L * 7 + br * .5, bw = 14.5 + L * 10;
  const hy = 41 + L * 15 + (m.bob || 0), hx = cx + (m.hx || 0);
  /* rabo: sai de trás e se enrola na frente das patas; a ponta balança */
  const sw = m.sway || 0, tp = [cx + bw * .95, RG - 6];
  const tailPts = [[cx + bw * 1.15, RG - 3.2], [cx + bw * .7, RG - 1.8], [cx + 2, RG - 1.6], [cx - bw * .5, RG - 2.4]];
  tailPts.forEach(q => tp.push(q[0], q[1]));
  const tipA = (-110 + sw * 28) * Math.PI / 180, tipB = (-150 + sw * 40) * Math.PI / 180;
  const t1 = [tp[tp.length - 2] + Math.cos(tipA) * 4.2, tp[tp.length - 1] + Math.sin(tipA) * 4.2]; tp.push(...t1, t1[0] + Math.cos(tipB) * 3.2, t1[1] + Math.sin(tipB) * 3.2);
  const drawTail = () => { R.cap(tp, 6.2, C.patch || C.b); R.flush(); if (C.stripe) { c.save(); c.strokeStyle = C.d; c.lineWidth = 6.2; c.lineCap = 'butt'; for (let i = 2; i < tp.length - 2; i += 4) { c.beginPath(); c.moveTo(tp[i], tp[i + 1]); c.lineTo(tp[i + 2], tp[i + 3]); c.stroke(); } c.restore(); } };
  /* coxas e corpo */
  R.ell(cx - bw * .78, RG - 7 + L * 1.5, 8.5 - L * 2, 7.5 - L * 2.5, 0, C.b); R.ell(cx + bw * .78, RG - 7 + L * 1.5, 8.5 - L * 2, 7.5 - L * 2.5, 0, C.b);
  R.ell(cx, by, bw, bh, 0, C.b); R.ell(cx, by - bh * .7, bw * .62, 7, 0, C.b);
  R.flush();
  c.save(); c.beginPath(); c.ellipse(cx, by, bw, bh, 0, 0, Math.PI * 2); c.clip();
  if (C.patch) { c.fillStyle = C.patch; c.beginPath(); c.ellipse(cx + bw * .6, by - bh * .4, bw * .6, bh * .7, .3, 0, Math.PI * 2); c.fill(); }
  if (C.stripe) { c.strokeStyle = C.d; c.lineWidth = 1.8; c.lineCap = 'round'; [-1, 1].forEach(d => [0, 4.5, 9].forEach(o => { c.beginPath(); c.moveTo(cx + d * (bw - .5), by - bh * .5 + o); c.lineTo(cx + d * (bw - 5), by - bh * .4 + o + 1); c.stroke(); })); }
  if (C.white) { c.fillStyle = C.w; c.beginPath(); c.ellipse(cx, by + 2 - L * 2, bw * .52, bh * .95, 0, 0, Math.PI * 2); c.fill(); }
  c.fillStyle = 'rgba(40,20,30,.10)'; c.beginPath(); c.ellipse(cx, by + bh * .85, bw * .9, bh * .4, 0, 0, Math.PI * 2); c.fill();
  c.fillStyle = 'rgba(255,255,255,.10)'; c.beginPath(); c.ellipse(cx - bw * .35, by - bh * .55, bw * .35, bh * .25, -.4, 0, Math.PI * 2); c.fill();
  c.restore();
  /* patas da frente (curtinhas e fofas); "amassar pãozinho" alterna as patas */
  const pc = C.white ? C.w : C.b;
  const lift = m.paw || 0, kn = m.knead || 0, kl = Math.max(0, Math.sin(kn)) * 2.4, kr = Math.max(0, -Math.sin(kn)) * 2.4;
  R.ell(cx - bw * .8 - 2, RG - 1.8, 4.4, 2.7, 0, pc); R.ell(cx + bw * .8 + 2, RG - 1.8, 4.4, 2.7, 0, pc); R.flush();
  drawTail();
  const paws = [];
  if (L < .5) {
    R.cap([cx - 4.4, by + 3, cx - 4.4 + lift * 2, RG - 3.4 - lift * 21 - kl], 7.4, pc); R.ell(cx - 4.4 + lift * 2, RG - 2.4 - lift * 21 - kl, 4.7, 3.3, 0, pc); paws.push([cx - 4.4 + lift * 2, RG - 2.4 - lift * 21 - kl]);
    R.cap([cx + 4.4, by + 3, cx + 4.4, RG - 3.4 - kr], 7.4, pc); R.ell(cx + 4.4, RG - 2.4 - kr, 4.7, 3.3, 0, pc); paws.push([cx + 4.4, RG - 2.4 - kr]);
  } else { R.ell(cx - 6.2, RG - 2.4 - kl, 5.2, 3.2, 0, pc); R.ell(cx + 6.2, RG - 2.4 - kr, 5.2, 3.2, 0, pc); paws.push([cx - 6.2, RG - 2.4 - kl], [cx + 6.2, RG - 2.4 - kr]); }
  R.flush();
  c.strokeStyle = rgbS(hex2(RO), .55); c.lineWidth = .7; c.lineCap = 'round'; paws.forEach(([x, y]) => { c.beginPath(); c.moveTo(x - 1.4, y + .2); c.lineTo(x - 1.4, y + 2.4); c.moveTo(x + 1.4, y + .2); c.lineTo(x + 1.4, y + 2.4); c.stroke(); });
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

function petBreedName(k) { return RIG[rigKey(k)].n; }
function petStyle() { return 'animado'; }
function drawPet(cv, k, P, m) { paintRig(cv, k, m); cv.classList.toggle('real', !(db.s.pets && db.s.pets.px)); }
function catImg(k, pose, size = 88) { const cv = document.createElement('canvas'); paintRig(cv, k, { view: 'front', eyes: '', loaf: pose === 'lie' ? 1 : 0 }); return `<img class="petimg" src="${cv.toDataURL()}" width="${size}" height="${Math.round(size * RH / RW)}" style="image-rendering:${db.s.pets && db.s.pets.px ? 'pixelated' : 'auto'}" alt="">`; }

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
  want.forEach((c, i) => PETS.list.push(makePet(c, i, pos[i])));
  const smooth = true; let last = performance.now(), acc = 0;
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
  const cv = document.createElement('canvas'); cv.width = RW; cv.height = RH; cv.className = 'petcv'; cv._sc = SC; el.querySelector('.petb').appendChild(cv);
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
      const S = p.cs || (p.cs = { loaf: 0, paw: 0, st: 0, w: 0, tilt: 0, look: 0, lookY: 0, knA: 0, kn: 0, mouth: 0, rot: 0, dy: 0, ph: 0 });
      const ez = (key, target, sp) => { S[key] += (target - S[key]) * Math.min(1, sp * k); return S[key]; };
      if (!p.nb || now > p.nb) { p.bu = now + 130; p.nb = now + 2200 + Math.random() * 3800; if (Math.random() < .25) p.bu2 = now + 320; }
      if (!p.ne || now > p.ne) { p.eu = now + 160; p.ne = now + 4000 + Math.random() * 6000; }
      const blink = p.m.blink || now < p.bu || (p.bu2 && now > p.bu2 && now < p.bu2 + 120);
      if (p.walk) S.ph = p.walk.ph;
      ez('loaf', p.pose === 'lie' || sl ? 1 : 0, .1); ez('paw', p.pose === 'groom' ? .55 + Math.sin(t * .5) * .35 : 0, .25); ez('st', p.pose === 'stretch' ? 1 : 0, .08); ez('w', p.walk ? 1 : 0, .2);
      ez('tilt', p.m.tilt != null ? p.m.tilt : Math.sin(t * .035) * .05, .12); const pr = PETS.ptr, r0 = el.getBoundingClientRect(), pcx = r0.left + r0.width / 2, pcy = r0.top + r0.height * .4;
      const follow = pr && now - pr.t < 2500 && !side && Math.hypot(pr.x - pcx, pr.y - pcy) < 420 && !p.m.look;
      ez('look', follow ? Math.max(-1, Math.min(1, (pr.x - pcx) / 140)) * (p.dir < 0 ? -1 : 1) : p.m.look || Math.sin(t * .021) * .35, .12);
      ez('lookY', follow ? Math.max(-1, Math.min(1, (pr.y - pcy) / 160)) * .8 : p.pose === 'hang' ? -.6 : 0, .12);
      S.kn = (S.kn || 0) + (p.m.knead ? .22 * k : 0); ez('knA', p.m.knead ? 1 : 0, .15);
      ez('mouth', p.m.mouth ? 1 : p.pose === 'stretch' ? .8 : 0, .3);
      ez('rot', p.pose === 'hang' ? Math.sin(t * .45) * .12 : p.m.happy ? Math.sin(t * .5) * .05 : 0, .3);
      ez('dy', p.m.happy ? -Math.abs(Math.sin(t * .45)) * 5 : 0, .45);
      const eyes = p.m.happy ? 'happy' : sl || p.pose === 'groom' || (p.pose === 'stretch' && S.st > .5) || blink ? 'closed' : p.pose === 'lie' && Math.sin(t * .02) > .45 ? 'sleepy' : '';
      const br = Math.sin(t * (sl ? .07 : .11));
      drawPet(cv, p.k, P, { view: side ? 'side' : 'front', t, ph: S.ph, walk: S.w, stretch: S.st, loaf: S.loaf, paw: S.paw, tongue: p.pose === 'groom' ? Math.max(0, Math.sin(t * .5)) : 0, eyes, mouth: S.mouth > .05 ? S.mouth : 0, tilt: S.tilt, look: S.look, lookY: S.lookY || 0, knead: S.knA > .05 ? S.kn : 0, nod: S.w > .1 ? Math.sin(S.ph * 2) * .9 : 0, sway: Math.sin(t * (sl ? .05 : p.pose === 'hang' ? .3 : .11)), br, bob: br * .5, earR: now < p.eu ? 1 : 0, blush: p.m.happy, rot: S.rot, dy: S.dy, sy: 1 + br * (sl ? .02 : .012), sx: 1 - br * .004 });
      return;
    }
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
        if (petStyle() === 'animado') { const g = Math.random(); if (g < .28) { p.m.knead = 1; return wait(2600 + Math.random() * 2000, () => { p.m.knead = 0; wait(900, next); }); } if (g < .45) { p.m.tilt = (Math.random() < .5 ? -1 : 1) * .2; return wait(1500 + Math.random() * 1500, () => { p.m.tilt = null; wait(800, next); }); } const o = other(); p.m.look = o ? (o.X < p.X ? -1 : 1) * p.dir : (Math.random() < .5 ? -1 : 1); return wait(1600 + Math.random() * 2200, () => { p.m.look = 0; wait(900, next); }); }
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
    p.m.blink = false; p.m.eyes = 'happy'; p.m.happy = true; p.m.view = null; fx('♥', 'heart'); setTimeout(() => fx('♥', 'heart h2'), 220); if (p.n) fx(esc(p.n), 'name');
    el.classList.add('purr'); T(() => { el.classList.remove('purr'); p.m.blink = false; p.m.eyes = undefined; p.m.happy = false; }, 1300);
  };
  el.addEventListener('pointerup', up); el.addEventListener('pointercancel', up);
  p.kill = () => { p.dead = true; p.timers.forEach(clearTimeout); el.remove(); };
  p.step();
  return p;
}
addEventListener('resize', () => PETS.list.forEach(p => p.place()));
addEventListener('pointermove', e => { if (PETS.list.length) PETS.ptr = { x: e.clientX, y: e.clientY, t: performance.now() }; }, { passive: true });

/* ---------- tela de escolha ---------- */
VIEWS.pets = main => {
  const cfg = petCfg(), sel = cfg.cats.map(c => c.k);
  main.innerHTML = headHtml('Pets') + `<div class="scroll"><div class="me pets">
    <nav class="crumbs"><a href="#/me">Perfil</a><span>/</span><span>Pets</span></nav>
    <label class="srow petsw"><span class="f1"><b>Mostrar gatinhos no app</b><span class="mut sm">Eles ficam parados pela tela, piscando, abanando o rabo, se lambendo e até cochilando.</span></span><span class="sw-t"><input type="checkbox" data-petson ${cfg.on ? 'checked' : ''}><span></span></span></label>
    ${1 ? `<label class="srow petsw"><span class="f1"><b>Visual pixelado</b><span class="mut sm">Deixa o desenho com cara de videogame.</span></span><span class="sw-t"><input type="checkbox" data-petpx ${db.s.pets && db.s.pets.px ? 'checked' : ''}><span></span></span></label>` : ''}
    <section class="sgrp"><h2>🐈 Escolha até dois gatos</h2>
      <div class="petgrid">${Object.entries(RIG).map(([k, c]) => { const i = sel.indexOf(k); return `<button class="petcard${i >= 0 ? ' on' : ''}" data-act="petpick" data-k="${k}">${i >= 0 ? `<span class="petnum">${i + 1}</span>` : ''}${catImg(k, 'sit', 92)}<span>${esc(c.n)}</span></button>`; }).join('')}</div>
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
  petsreset: () => { petsReset(); toast('Gatos de volta ao canto'); },
  petstoggle: () => { const p = petCfg(); p.on = !p.on; if (p.on && !p.cats.length) p.cats = [{ k: 'laranja', n: 'Mingau' }]; savePets(p); toast(p.on ? 'Gatinhos à vista 🐈' : 'Gatinhos guardados'); if (R.v === 'pets' || R.v === 'settings' || R.v === 'me') render(); },
});
document.addEventListener('change', e => { if (e.target.matches && e.target.matches('[data-petpx]')) { const p = petCfg(); p.px = e.target.checked; db.s.pets = p; PETS.sig = null; petsSync(); put('s', db.s); render(); return; } if (e.target.matches && e.target.matches('[data-petson]')) { const p = petCfg(); p.on = e.target.checked; if (p.on && !p.cats.length) p.cats = [{ k: 'laranja', n: 'Mingau' }]; savePets(p); if (R.v === 'pets') render(); } });
