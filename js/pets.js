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
function rastCat(P, m = {}) {
  const g = new Array(CW * CH).fill('');
  const set = (x, y, c) => { if (x >= 0 && y >= 0 && x < CW && y < CH) g[y * CW + x] = c; };
  const ell = (cx, cy, rx, ry, rot, c) => {
    const r = rot * Math.PI / 180, co = Math.cos(r), si = Math.sin(r), R = Math.max(rx, ry) + 1;
    for (let y = Math.floor(cy - R); y <= cy + R; y++) for (let x = Math.floor(cx - R); x <= cx + R; x++) { const dx = x + .5 - cx, dy = y + .5 - cy, u = dx * co + dy * si, v = -dx * si + dy * co; if (u * u / (rx * rx) + v * v / (ry * ry) <= 1) set(x, y, c); }
  };
  const cap = (x1, y1, x2, y2, r, c) => {
    const vx = x2 - x1, vy = y2 - y1, L = vx * vx + vy * vy || 1;
    for (let y = Math.floor(Math.min(y1, y2) - r - 1); y <= Math.max(y1, y2) + r + 1; y++) for (let x = Math.floor(Math.min(x1, x2) - r - 1); x <= Math.max(x1, x2) + r + 1; x++) {
      const px = x + .5, py = y + .5, t = Math.max(0, Math.min(1, ((px - x1) * vx + (py - y1) * vy) / L)), dx = px - (x1 + vx * t), dy = py - (y1 + vy * t);
      if (dx * dx + dy * dy <= r * r) set(x, y, c);
    }
  };
  const tri = (a, b, d, c) => {
    const s = (p, q, r) => (p[0] - r[0]) * (q[1] - r[1]) - (q[0] - r[0]) * (p[1] - r[1]);
    for (let y = Math.floor(Math.min(a[1], b[1], d[1])); y <= Math.max(a[1], b[1], d[1]); y++) for (let x = Math.floor(Math.min(a[0], b[0], d[0])); x <= Math.max(a[0], b[0], d[0]); x++) {
      const p = [x + .5, y + .5], d1 = s(p, a, b), d2 = s(p, b, d), d3 = s(p, d, a);
      if (!((d1 < 0 || d2 < 0 || d3 < 0) && (d1 > 0 || d2 > 0 || d3 > 0))) set(x, y, c);
    }
  };
  const leg = (L, c) => { cap(L[0], L[1], L[2], L[3], 1.4, c); cap(L[2], L[3], L[4], L[5], 1.15, c); ell(L[4] + .7, L[5] + .25, 1.75, 1.05, 0, c === 'F' ? 'F' : 'P'); };
  const [bx, by, brx, bry, brot] = P.b, [hx, hy, hr] = P.h;
  leg(P.ff, 'F'); leg(P.hf, 'F');
  let tx = P.tb[0], ty = P.tb[1];
  P.ta.forEach((a, i) => { const r = a * Math.PI / 180, nx = tx + Math.cos(r) * 1.8, ny = Math.min(CG - .6, ty + Math.sin(r) * 1.8); cap(tx, ty, nx, ny, 1.3 - i * .05, 'T'); tx = nx; ty = ny; });
  ell(P.ha[0], P.ha[1], P.ha[2], P.ha[3], 0, 'b');
  ell(bx, by, brx, bry, brot, 'b');
  cap(P.nk[0], P.nk[1], P.nk[2], P.nk[3], 3, 'b');
  ell((P.nk[0] + P.nk[2]) / 2 + 1.6, (P.nk[1] + P.nk[3]) / 2 + 1.6, 2.2, 2.8, 0, 'C');
  leg(P.hn, 'L'); leg(P.fn, 'L');
  const hrr = hr * Math.PI / 180, hp = (u, v) => [hx + u * Math.cos(hrr) - v * Math.sin(hrr), hy + u * Math.sin(hrr) + v * Math.cos(hrr)];
  tri(hp(-3.9, -1.6), hp(-.7, -3.4), hp(-3.1, -7), 'R');
  ell(hx, hy, 4.6, 4, hr, 'H');
  tri(hp(-1.3, -2.8), hp(2.5, -2.7), hp(.3, -7.3), 'R');
  tri(hp(-.3, -3.3), hp(1.5, -3.2), hp(.3, -5.9), 'p');
  ell(...hp(3.5, 1.4), 2.1, 1.7, hr, 'M');
  const [ex, ey] = hp(2, -.9), ix = Math.floor(ex), iy = Math.floor(ey);
  if (P.eye > .5 && !m.blink) { set(ix, iy, 'E'); set(ix + 1, iy, 'k'); set(ix, iy + 1, 'E'); set(ix + 1, iy + 1, 'k'); }
  else { set(ix, iy + 1, 'o'); set(ix + 1, iy + 1, 'o'); }
  const [nx, ny] = hp(5.5, .4); set(Math.floor(nx), Math.floor(ny), 'n');
  if (m.mouth) { const [mx, my] = hp(4.2, 2.7); set(Math.floor(mx), Math.floor(my), 'k'); set(Math.floor(mx) + 1, Math.floor(my), 'k'); set(Math.floor(mx), Math.floor(my) + 1, 'p'); }
  if (m.tongue) { const [mx, my] = hp(5, 2.6); set(Math.floor(mx), Math.floor(my), 'p'); }
  return g;
}
function paintCat(cv, k, P, m) {
  const g = rastCat(P, m), B = CATS[k] || CATS.laranja, pal = Object.assign({ k: '#121212', n: B.c.p }, B.c);
  const at = (x, y) => (x < 0 || y < 0 || x >= CW || y >= CH) ? '' : g[y * CW + x];
  const out = new Array(CW * CH).fill(null);
  const by = P.b[1], bry = P.b[3], hx = P.h[0], hy = P.h[1];
  for (let y = 0; y < CH; y++) for (let x = 0; x < CW; x++) {
    const c = g[y * CW + x];
    if (!c) { if (at(x - 1, y) || at(x + 1, y) || at(x, y - 1) || at(x, y + 1)) out[y * CW + x] = pal.o; continue; }
    let col;
    const base = () => {
      if (B.calico) {
        if (c === 'b' && x < 18 && y < by + .5) return pal.x;
        if (c === 'b' && x >= 19 && x < 24 && y < by - 1) return pal.y;
        if ((c === 'H' || c === 'R') && x < hx - .5 && y < hy + 1) return pal.x;
        if (c === 'R' && x >= hx - .5) return pal.y;
        if (c === 'T') return x < 9 ? pal.y : pal.x;
      }
      if (B.points && 'HRLTM'.includes(c)) return pal.x;
      if (B.stripe) {
        if (c === 'b' && (x + (y >> 1)) % 4 === 0 && y < by + 1) return pal.d;
        if (c === 'H' && y < hy - 1.5 && x % 2 === 0 && x < hx + 1) return pal.d;
        if (c === 'T' && (x + y) % 3 === 0) return pal.d;
        if (c === 'L' && y % 3 === 0 && y < CG - 1) return pal.d;
      }
      const up = at(x, y - 1);
      if ((c === 'b' || c === 'H') && (!up)) return pal.l;
      if (c === 'b' && (y > by + bry * .4 || at(x - 1, y) === 'L' || at(x + 1, y) === 'L' || at(x, y - 1) === 'H')) return pal.s;
      return pal.b;
    };
    if (c === 'E') col = pal.E; else if (c === 'k') col = pal.k; else if (c === 'p') col = pal.p; else if (c === 'n') col = pal.n; else if (c === 'o') col = pal.o;
    else if (c === 'F') col = B.points ? pal.x : pal.s;
    else if (c === 'P') col = B.paws ? pal.w : B.points ? pal.x : pal.b;
    else if (c === 'M' || c === 'C') col = B.white ? pal.w : (B.points && c === 'M') ? pal.x : c === 'C' ? base.call(null) : pal.b;
    else col = base();
    if (c === 'M' && B.calico) col = pal.w;
    out[y * CW + x] = col;
  }
  const ctx = cv.getContext('2d'), img = ctx.createImageData(CW, CH);
  out.forEach((h, i) => { if (!h) return; const n = parseInt(h.slice(1), 16); img.data[i * 4] = n >> 16; img.data[i * 4 + 1] = (n >> 8) & 255; img.data[i * 4 + 2] = n & 255; img.data[i * 4 + 3] = 255; });
  ctx.putImageData(img, 0, 0);
}
function catCanvas(k, pose = 'sit', cls = '') { const cv = document.createElement('canvas'); cv.width = CW; cv.height = CH; cv.className = 'petcv ' + cls; paintCat(cv, k, POSES[typeof pose === 'string' ? pose : 'sit'], {}); return cv; }
function catImg(k, pose, size = 88) { const cv = catCanvas(k, pose); return `<img class="petimg" src="${cv.toDataURL()}" width="${size}" height="${Math.round(size * CH / CW)}" alt="">`; }

/* ---------- gatos na tela ---------- */
const PETS = { box: null, list: [], tick: null };
function petCfg() { const p = db.s.pets || {}; return { on: !!p.on, cats: Array.isArray(p.cats) ? p.cats.slice(0, 2) : [] }; }
function savePets(p) { db.s.pets = p; put('s', db.s); petsSync(); }
function petScale() { return isMobile() ? 2 : 3; }
function petPos() { try { return JSON.parse(localStorage.getItem('tt_petpos') || '{}'); } catch (e) { return {}; } }
function savePos() { const m = {}; PETS.list.forEach(p => { const [W, H] = p.room(); m[p.slot] = { x: W ? p.X / W : 0, y: H ? p.Y / H : 0 }; }); try { localStorage.setItem('tt_petpos', JSON.stringify(m)); } catch (e) {} }
function petsSync() {
  const cfg = petCfg(), want = cfg.on ? cfg.cats : [];
  const sig = JSON.stringify(want.map(c => c.k + '|' + (c.n || '')));
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
  const cv = document.createElement('canvas'); cv.width = CW; cv.height = CH; cv.className = 'petcv'; el.querySelector('.petb').appendChild(cv);
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
      p.X += p.dir * (SC === 3 ? 1.5 : 1.05); place();
      const [W] = room(); w.left -= SC === 3 ? 1.5 : 1.05;
      if (w.left <= 0 || p.X <= 0 || p.X >= W) { p.walk = null; savePos(); w.done(); }
    }
    if (p.pose === 'groom') { P.fn[5] += Math.sin(t * .55) * 1.1; P.fn[3] += Math.sin(t * .55) * .6; p.m.tongue = Math.sin(t * .55) > .2; }
    paintCat(cv, p.k, P, Object.assign({}, p.m, { blink: p.m.blink || (P.eye > .5 && !p.walk && (t % 47 === 0 || t % 47 === 1)) }));
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
  petsreset: () => { petsReset(); toast('Gatos de volta ao canto'); },
  petstoggle: () => { const p = petCfg(); p.on = !p.on; if (p.on && !p.cats.length) p.cats = [{ k: 'laranja', n: 'Mingau' }]; savePets(p); toast(p.on ? 'Gatinhos à vista 🐈' : 'Gatinhos guardados'); if (R.v === 'pets' || R.v === 'settings' || R.v === 'me') render(); },
});
document.addEventListener('change', e => { if (e.target.matches && e.target.matches('[data-petson]')) { const p = petCfg(); p.on = e.target.checked; if (p.on && !p.cats.length) p.cats = [{ k: 'laranja', n: 'Mingau' }]; savePets(p); if (R.v === 'pets') render(); } });
