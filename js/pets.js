/* Pets: até dois gatinhos em pixel art que andam, sentam, deitam, dormem e reagem ao toque.
   Cada quadro é desenhado pixel a pixel numa grade pequena (40×30) a partir de uma pose (corpo, peito, quadril,
   cabeça, patas e cauda). Entre uma pose e outra os números são interpolados, o que gera quadros intermediários
   de verdade — as transições ficam suaves sem perder o visual pixelado. Contorno de 1 pixel automático. */
'use strict';
const PW = 40, PH = 30;
const CAT_NAMES = ['Mingau', 'Pipoca', 'Nina', 'Tom', 'Luna', 'Paçoca', 'Frida', 'Simba', 'Mel', 'Bolinha'];
const hex2 = h => { const n = parseInt(h.slice(1), 16); return [n >> 16, (n >> 8) & 255, n & 255]; };
const mixC = (a, b, t) => a.map((v, i) => Math.round(v + (b[i] - v) * t));
const rgbS = (c, a = 1) => `rgba(${c[0]},${c[1]},${c[2]},${a})`;
const cloneP = o => JSON.parse(JSON.stringify(o));
const hexOf = c => '#' + c.map(v => v.toString(16).padStart(2, '0')).join('');

/* pelagens: b = pelo, d = listras/sombra forte, l = branco/claro, e = olhos, o = contorno */
const CATS = {
  laranja: { n: 'Laranja rajado', b: '#F3A24F', d: '#CF7230', l: '#FFF3E2', e: '#3A2820', o: '#3D2216', stripes: 1, belly: 1 },
  marrom: { n: 'Marrom rajado', b: '#A0754B', d: '#5F3F24', l: '#F5E7D2', e: '#2A1C14', o: '#26170D', stripes: 1, belly: 1 },
  cinza: { n: 'Cinza rajado', b: '#A6A6B2', d: '#6E6E79', l: '#F3F3F6', e: '#2A2A31', o: '#26262D', stripes: 1, belly: 1 },
  preto: { n: 'Preto', b: '#3B3638', d: '#2A2628', l: '#4D4649', e: '#F2C84B', o: '#100E0F', dark: 1 },
  pretobranco: { n: 'Frajola', b: '#383335', d: '#252123', l: '#F8F3EB', e: '#A7CB4D', o: '#121011', tux: 1, dark: 1 },
  brancopreto: { n: 'Branco', b: '#F7F3ED', d: '#D9D0C4', l: '#FFFFFF', e: '#4A8FDB', o: '#6A5E55' },
  siames: { n: 'Siamês', b: '#F1E2CB', d: '#5A4232', l: '#FFF8EC', e: '#4C98EA', o: '#36271D', points: 1 },
  tricolor: { n: 'Tricolor', b: '#FAF5EC', d: '#DDD2C2', l: '#FFFFFF', e: '#5E9342', o: '#3A2D26', calico: ['#EE9845', '#3A3436'] },
};
const catKey = k => CATS[k] ? k : ({ frajola: 'pretobranco', branco: 'brancopreto' })[k] || 'laranja';
function catPal(k) {
  const c = CATS[catKey(k)], B = hex2(c.b), D = hex2(c.d), L = hex2(c.l);
  return {
    b: c.b, s: hexOf(mixC(B, D, c.dark ? .6 : .42)), h: hexOf(mixC(B, [255, 255, 255], c.dark ? .14 : .22)), d: c.d, l: c.l,
    ls: hexOf(mixC(L, D, .18)), e: c.e, o: c.o, p: c.dark ? '#D9878F' : '#F39AA3', k: c.dark ? 'rgba(0,0,0,0)' : '#F6B3B0', m: '#9B3B45', w: '#FFFFFF',
    x: c.calico ? c.calico[0] : c.d, y: c.calico ? c.calico[1] : c.d,
  };
}

/* cabeça (11×9) — . vazio, b pelo, p rosa, l claro, k bochecha. Os olhos são desenhados à parte */
const HEAD = [
  '.b.......b.',
  '.bp.....pb.',
  '.bbbbbbbbb.',
  'bbbbbbbbbbb',
  'bbbbbbbbbbb',
  'bbbbbbbbbbb',
  'bkbllpllbkb',
  '.bblllllbb.',
  '..bbbbbbb..',
];

/* poses (gato olhando para a direita). B/C/Hq = elipses [cx, cy, rx, ry]; H = centro da cabeça;
   pernas = [x do topo, y do topo, x do pé, y do pé]; T = cauda [x, y, ângulo, curva, tamanho] */
const POSES = {
  stand: { B: [19.5, 18.6, 8.6, 4.5], C: [26, 18.2, 3.7, 4.2], Hq: [13, 19, 4.3, 4.6], H: [30, 11], fn: [26, 20, 26, 26], ff: [23.5, 20, 23.5, 26], bn: [13, 21, 13, 26], bf: [15.5, 21, 15.5, 26], T: [10.5, 16.5, -150, 13, 8] },
  sit: { B: [21, 19.6, 5, 6], C: [24, 18, 3.7, 4.9], Hq: [18, 22.6, 5.6, 4.2], H: [26, 9], fn: [24.5, 20, 24.5, 26], ff: [22.5, 20, 22.5, 26], bn: [19.5, 24, 21.5, 26], bf: [17, 24, 18.5, 26], T: [13.2, 24.6, 178, 7, 10] },
  lie: { B: [19, 22.6, 9, 4], C: [25.5, 22.8, 4, 3.6], Hq: [13, 22.5, 4.6, 4.1], H: [30, 17], fn: [27, 24, 30, 26], ff: [26, 24, 29, 26], bn: [14.5, 25, 15.5, 26], bf: [12.5, 25, 13.5, 26], T: [9.6, 24, 176, 12, 9] },
  sleep: { B: [19, 22.8, 8.6, 4.1], C: [24, 23.4, 4, 3.3], Hq: [14, 22.3, 5, 4.4], H: [28, 20.2], fn: [25, 25, 27, 26], ff: [24, 25, 26, 26], bn: [15, 25, 16, 26], bf: [13, 25, 14, 26], T: [9.8, 24.4, 172, 17, 9] },
  hang: { B: [20, 16.6, 4.6, 6.4], C: [20, 13.6, 4, 3.5], Hq: [20, 21, 4.6, 3.6], H: [20, 6], fn: [22.5, 13, 24, 20], ff: [16.5, 13, 15, 20], bn: [22, 22, 23, 27], bf: [17, 22, 16, 27], T: [20, 24, 92, 5, 7] },
  groom: { B: [21, 19.6, 5, 6], C: [24, 18, 3.7, 4.9], Hq: [18, 22.6, 5.6, 4.2], H: [26, 9.5], fn: [24.5, 19, 27, 15], ff: [22.5, 20, 22.5, 26], bn: [19.5, 24, 21.5, 26], bf: [17, 24, 18.5, 26], T: [13.2, 24.6, 178, 7, 10] },
  stretch: { B: [19.5, 18.6, 8.2, 4.2], C: [27, 21.6, 3.8, 3.3], Hq: [13, 18.6, 4.4, 4.6], H: [32, 17.5], fn: [28, 23, 33, 26], ff: [27, 23, 32, 26], bn: [13, 21, 13, 26], bf: [15.5, 21, 15.8, 26], T: [11, 15, -110, 4, 8] },
};
function lerpP(a, b, t) { if (typeof a === 'number') return a + (b - a) * t; if (Array.isArray(a)) return a.map((v, i) => lerpP(v, b[i], t)); const o = {}; for (const k in a) o[k] = k in b ? lerpP(a[k], b[k], t) : a[k]; return o; }

/* ---------- rasterização ---------- */
function catGrid(k, P, m = {}) {
  const C = CATS[catKey(k)], g = new Array(PW * PH).fill(null), id = new Array(PW * PH).fill(0);
  const at = (x, y) => (x < 0 || y < 0 || x >= PW || y >= PH) ? -1 : y * PW + x;
  const set = (x, y, r, part) => { const i = at(x, y); if (i < 0) return; g[i] = r; id[i] = part; };
  const ell = (e, part, fn) => {
    const [cx, cy, rx, ry] = e;
    for (let y = Math.floor(cy - ry - 1); y <= Math.ceil(cy + ry + 1); y++) for (let x = Math.floor(cx - rx - 1); x <= Math.ceil(cx + rx + 1); x++) {
      const dx = (x + .5 - cx) / rx, dy = (y + .5 - cy) / ry;
      if (dx * dx + dy * dy <= 1) set(x, y, fn ? fn(x, y, dx, dy) : 'b', part);
    }
  };
  /* listras e manchas acompanham o corpo */
  const coat = (x, y, dx, dy, ox) => {
    if (C.calico) { const cx = Math.floor((x - ox + 40) / 4), cy = Math.floor((y + 40) / 4), v = (cx * 7 + cy * 13 + cx * cy * 3) % 9; if (v < 2) return 'x'; if (v === 4) return 'y'; }
    if (C.stripes && dy < -.15 && ((Math.round(x - ox) + 60) % 3 === 0)) return 'd';
    if (C.points && dy > .55) return 's';
    return dy > .5 ? 's' : dy < -.55 ? 'h' : 'b';
  };
  const leg = (L, part, far) => {
    const [x0, y0, x1, y1] = L, n = Math.max(1, Math.ceil(Math.hypot(x1 - x0, y1 - y0) * 1.5));
    for (let i = 0; i <= n; i++) {
      const t = i / n, x = Math.round(x0 + (x1 - x0) * t - .5), y = Math.round(y0 + (y1 - y0) * t);
      const low = t > .55, r = far ? 's' : (C.points && low) ? 'd' : (C.tux && low) ? 'l' : 'b';
      set(x, y, r, part); set(x + 1, y, far ? 's' : r === 'b' ? 'b' : r, part);
    }
    /* patinha */
    const px = Math.round(x1 - .5), py = Math.round(y1);
    const pr = C.tux || C.calico ? 'l' : C.points ? 'd' : far ? 's' : 'b';
    set(px - (x1 > x0 + 1 ? 0 : 0), py, pr, part); set(px + 1, py, pr, part); set(px + 2, py, far ? 's' : pr, part);
  };
  const tail = T => {
    const [bx, by, a0, curl, len] = T, wv = m.tailWave || 0;
    let x = bx, y = by, a = a0 * Math.PI / 180;
    for (let i = 0; i <= len; i++) {
      const tip = i >= len - 1;
      const r = C.points ? 'd' : C.stripes && i % 3 === 1 ? 'd' : C.calico && i > len - 3 ? 'y' : tip && C.tux ? 'b' : 'b';
      set(Math.round(x - .5), Math.round(y - .5), r, 1); set(Math.round(x + .5), Math.round(y - .5), r, 1);
      set(Math.round(x - .5), Math.round(y + .5), r === 'b' ? 's' : r, 1);
      a += (curl + Math.sin((m.t || 0) * .16 - i * .7) * wv * (i / len)) * Math.PI / 180;
      x += Math.cos(a) * 1.25; y += Math.sin(a) * 1.25;
    }
  };
  /* ordem: cauda, pernas de trás (longe), corpo, quadril, peito, pernas da frente (perto), cabeça */
  if (!m.tailFront) tail(P.T);
  leg(P.bf, 2, true); leg(P.ff, 2, true);
  ell(P.B, 3, (x, y, dx, dy) => coat(x, y, dx, dy, P.B[0]));
  ell(P.Hq, 3, (x, y, dx, dy) => coat(x, y, dx, dy, P.B[0]));
  ell(P.C, 3, (x, y, dx, dy) => (C.belly || C.tux) && dx > -.2 && dy > -.35 ? (dy > .55 ? 'ls' : 'l') : coat(x, y, dx, dy, P.B[0]));
  leg(P.bn, 4); if (!m.pawUp) leg(P.fn, 5);
  if (m.tailFront) tail(P.T);
  /* cabeça */
  const hx = Math.round(P.H[0]) - 5, hy = Math.round(P.H[1]) - 4;
  HEAD.forEach((row, r) => [...row].forEach((ch, c) => {
    if (ch === '.') return;
    let role = ch === 'b' ? (r <= 2 ? 'h' : r >= 7 ? 's' : 'b') : ch;
    if (C.stripes && ((r === 2 && (c === 4 || c === 6)) || (r === 3 && c === 5) || (r === 4 && (c === 0 || c === 10)))) role = 'd';
    if (C.points && ch !== 'p' && (r <= 1 || (r >= 4 && r <= 7 && c >= 3 && c <= 7 && !(r === 7 && (c === 3 || c === 7))))) role = 'd';
    if (C.points && ch !== 'p' && r >= 3 && r <= 6 && (c === 2 || c === 8)) role = 's';
    if (C.tux && (ch === 'l' || (r === 8 && c >= 3 && c <= 7))) role = 'l';
    if (C.calico) { if (r <= 3 && c <= 4 && ch !== 'p') role = 'x'; if (r <= 3 && c >= 7 && ch !== 'p') role = 'y'; }
    set(hx + c, hy + r, role, 6);
  }));
  /* olhos */
  const lk = Math.max(-1, Math.min(1, Math.round(m.look || 0))), ey = hy + 4 + (m.lookY > .4 ? 1 : 0);
  const E = m.eyes || 'open';
  [[hx + 3 + lk], [hx + 7 + lk]].forEach(([ex]) => {
    if (E === 'open') { set(ex, ey, 'e', 6); set(ex, ey + 1, 'e', 6); }
    else if (E === 'big') { set(ex, ey, 'e', 6); set(ex, ey + 1, 'e', 6); set(ex + 1, ey, 'w', 6); set(ex + 1, ey + 1, 'e', 6); }
    else if (E === 'happy') { set(ex - 1, ey + 1, 'o', 6); set(ex, ey, 'o', 6); set(ex + 1, ey + 1, 'o', 6); }
    else { set(ex - 1, ey + 1, 'o', 6); set(ex, ey + 1, 'o', 6); set(ex + 1, ey + 1, 'o', 6); } /* fechados */
  });
  if (m.pawUp) leg(P.fn, 5);
  if (m.mouth) { set(hx + 5, hy + 7, 'm', 6); if (m.mouth > 1) set(hx + 5, hy + 8, 'm', 6); }
  if (m.blush) { set(hx + 1, hy + 6, 'k', 6); set(hx + 9, hy + 6, 'k', 6); }
  /* contornos internos: queixo sobre o corpo, patas da frente e corpo sobre a cauda */
  const seam = (part, dirs, against) => {
    for (let i = 0; i < g.length; i++) if (id[i] === part && g[i] !== 'o') {
      const x = i % PW, y = (i / PW) | 0;
      dirs.forEach(([ddx, ddy]) => { const j = at(x + ddx, y + ddy); if (j >= 0 && g[j] && id[j] !== part && against.includes(id[j])) g[j] = 'o'; });
    }
  };
  seam(6, [[0, 1], [-1, 0], [1, 0]], [3, 5, 2, 4]);
  seam(5, [[-1, 0]], [3]);
  seam(4, [[1, 0]], [3]);
  seam(3, [[0, -1], [-1, 0], [1, 0], [0, 1]], [1, 2]);
  /* contorno externo */
  const out = g.slice();
  for (let y = 0; y < PH; y++) for (let x = 0; x < PW; x++) {
    const i = y * PW + x; if (g[i]) continue;
    if ([[1, 0], [-1, 0], [0, 1], [0, -1]].some(([a, b]) => { const j = at(x + a, y + b); return j >= 0 && g[j] && g[j] !== 'o'; })) out[i] = 'o';
  }
  return out;
}
function paintCat(cv, k, P, m) {
  if (cv.width !== PW || cv.height !== PH) { cv.width = PW; cv.height = PH; }
  const c = cv.getContext('2d'), pal = catPal(k), g = catGrid(k, P, m);
  c.clearRect(0, 0, PW, PH);
  for (let i = 0; i < g.length; i++) if (g[i]) { c.fillStyle = pal[g[i]] || pal.b; c.fillRect(i % PW, (i / PW) | 0, 1, 1); }
}
function petBreedName(k) { return CATS[catKey(k)].n; }
function catImg(k, pose, size = 88) {
  const cv = document.createElement('canvas'); paintCat(cv, k, POSES[pose === 'lie' ? 'lie' : 'sit'], { eyes: 'open' });
  return `<img class="petimg" src="${cv.toDataURL()}" width="${size}" height="${Math.round(size * PH / PW)}" alt="" style="image-rendering:pixelated">`;
}

/* ---------- motor ---------- */
const PETS = { box: null, list: [], tick: null };
function petCfg() { const p = db.s.pets || {}; return { on: !!p.on, cats: Array.isArray(p.cats) ? p.cats.slice(0, 2) : [] }; }
function savePets(p) { db.s.pets = p; put('s', db.s); petsSync(); }
function petScale() { return isMobile() ? 2.6 : 3.2; }
function petPos() { try { return JSON.parse(localStorage.getItem('tt_petpos') || '{}'); } catch (e) { return {}; } }
function savePos() { const m = {}; PETS.list.forEach(p => { const [W, H] = p.room(); m[p.slot] = { x: W ? p.X / W : 0, y: H ? p.Y / H : 0 }; }); try { localStorage.setItem('tt_petpos', JSON.stringify(m)); } catch (e) {} }
function petsSync() {
  const cfg = petCfg(), want = cfg.on ? cfg.cats : [];
  const sig = 'px2' + JSON.stringify(want.map(c => c.k + '|' + (c.n || '')));
  if (PETS.sig === sig) return;
  PETS.sig = sig;
  PETS.list.forEach(p => p.kill()); PETS.list = [];
  if (PETS.ball) { PETS.ball.kill(); PETS.ball = null; }
  cancelAnimationFrame(PETS.tick); PETS.tick = null;
  if (!want.length) { if (PETS.box) PETS.box.remove(); PETS.box = null; return; }
  if (!PETS.box) { PETS.box = document.createElement('div'); PETS.box.id = 'pets'; document.body.appendChild(PETS.box); }
  const pos = petPos();
  want.forEach((c, i) => PETS.list.push(makePet(c, i, pos[i])));
  let last = performance.now(), acc = 0;
  const loop = ts => {
    if (!PETS.tick) return; PETS.tick = requestAnimationFrame(loop);
    const dt = Math.min(150, ts - last); last = ts; if (document.hidden) return;
    PETS.list.forEach(p => p.glide(dt));
    if (PETS.ball) PETS.ball.glide(dt);
    acc += dt;
    if (acc >= 83) { const n = Math.min(3, Math.floor(acc / 83)); acc -= n * 83; for (let i = 0; i < n; i++) PETS.list.forEach(p => p.step()); PETS.list.forEach(p => p.draw()); }
  };
  PETS.tick = requestAnimationFrame(loop);
  PETS.ball = makeBall();
}
function petsReset() { try { localStorage.removeItem('tt_petpos'); } catch (e) {} PETS.sig = null; petsSync(); }
function makePet(c, slot, saved) {
  const SC = petScale(), EW = PW * SC, EH = PH * SC;
  const el = document.createElement('div'); el.className = 'pet'; el.style.width = EW + 'px'; el.style.height = EH + 'px'; el.style.setProperty('--sc', SC);
  el.setAttribute('role', 'img'); el.setAttribute('aria-label', 'Gatinho ' + (c.n || ''));
  el.innerHTML = `<span class="petsh"></span><div class="petb"></div><span class="petfx"></span>`;
  const cv = document.createElement('canvas'); cv.width = PW; cv.height = PH; cv.className = 'petcv'; el.querySelector('.petb').appendChild(cv);
  PETS.box.appendChild(el);
  const room = () => [Math.max(0, innerWidth - EW), Math.max(0, innerHeight - EH)];
  const p = { slot, k: c.k, n: c.n, el, cv, room, dead: false, timers: [], t: 0, dir: slot ? -1 : 1, pose: 'sit', P: cloneP(POSES.sit), tw: null, walk: null, m: {} };
  { const [W, H] = room(); p.X = saved ? saved.x * W : W - 40 - slot * (EW + 10); p.Y = saved ? saved.y * H : H * (isMobile() ? .86 : .92); }
  const place = () => { const [W, H] = room(); p.X = Math.min(Math.max(p.X, 0), W); p.Y = Math.min(Math.max(p.Y, 0), H); el.style.transform = `translate(${Math.round(p.X)}px,${Math.round(p.Y)}px)`; cv.style.transform = p.dir < 0 ? 'scaleX(-1)' : ''; };
  p.place = place; place();
  const T = (fn, ms) => { const id = setTimeout(() => { if (!p.dead) fn(); }, ms); p.timers.push(id); if (p.timers.length > 40) p.timers = p.timers.slice(-20); return id; };
  const clearT = () => { p.timers.forEach(clearTimeout); p.timers = []; };
  const fx = (html, cls) => { const s = document.createElement('span'); s.className = 'pfx ' + (cls || ''); s.innerHTML = html; el.querySelector('.petfx').appendChild(s); setTimeout(() => s.remove(), 1800); };
  const other = () => PETS.list.find(q => q !== p);
  /* transição: interpola a pose em N quadros (cada quadro = 83 ms) */
  const toPose = (name, frames = 6) => { p.tw = { from: cloneP(p.P), to: POSES[name], f: 0, n: Math.max(1, frames) }; p.pose = name; };
  p.step = () => {
    p.t++;
    if (p.tw) { const tw = p.tw; tw.f++; const e = tw.f / tw.n, k = e < .5 ? 2 * e * e : 1 - Math.pow(-2 * e + 2, 2) / 2; p.P = lerpP(tw.from, tw.to, Math.min(1, k)); if (tw.f >= tw.n) p.tw = null; }
  };
  /* andar: o deslocamento na tela é contínuo (suave); o desenho troca de quadro como pixel art */
  p.glide = dt => {
    if (p.chase) return chaseStep(dt);
    if (!p.walk) return;
    const w = p.walk, d = SC * .34 * dt / 16.7 * (w.run ? 2 : 1);
    p.X += p.dir * d; w.left -= d; place();
    const [W] = room();
    if (w.left <= 0 || p.X <= 0 || p.X >= W) { const done = w.done; p.walk = null; savePos(); done && done(); }
  };
  p.draw = () => {
    const P = cloneP(p.P), t = p.t, now = performance.now();
    const sl = p.pose === 'sleep', held = p.pose === 'hang';
    /* respiração */
    const br = Math.sin(t * (sl ? .16 : .26));
    if (!p.walk && !held) { P.B[3] += br * .28; P.C[3] += br * .18; P.Hq[3] += br * .12; }
    /* passos: pares diagonais alternados */
    if (p.walk) {
      const ph = t * (p.walk.run ? 1.15 : .78);
      [['fn', 0], ['bf', 0], ['ff', Math.PI], ['bn', Math.PI]].forEach(([k, o]) => { const s = Math.sin(ph + o), lift = Math.max(0, Math.cos(ph + o)); P[k][2] += s * 2.1; P[k][3] -= lift * 1.3; P[k][0] += s * .5; });
      const bob = Math.round(Math.abs(Math.sin(ph))) * .6; ['B', 'C', 'Hq'].forEach(k => P[k][1] -= bob); P.H[1] -= bob;
    }
    if (p.pose === 'groom') { const g2 = Math.sin(t * .9); P.fn[2] += g2 * .8; P.fn[3] += g2 * .9; P.H[1] += g2 > .3 ? .6 : 0; }
    if (held) { const sw = Math.sin(t * .45); ['fn', 'ff', 'bn', 'bf'].forEach((k, i) => { P[k][2] += sw * (i % 2 ? 1 : -1) * .8; }); }
    if (p.m.hop) { const hp = p.m.hop; const h = Math.sin(Math.min(1, hp / 5) * Math.PI) * 3; ['B', 'C', 'Hq'].forEach(k => P[k][1] -= h); P.H[1] -= h; ['fn', 'ff', 'bn', 'bf'].forEach(k => { P[k][1] -= h; P[k][3] -= h * .6; }); p.m.hop++; if (p.m.hop > 5) p.m.hop = 0; }
    /* piscar e olhar para o dedo/mouse */
    if (!p.nb || now > p.nb) { p.bu = now + 140; p.nb = now + 2200 + Math.random() * 3800; }
    const blink = now < p.bu;
    const pr = PETS.ptr, r0 = el.getBoundingClientRect();
    let look = 0, lookY = 0;
    if (pr && now - pr.t < 2500 && !p.walk) { look = (pr.x - (r0.left + r0.width * .6)) / 120 * p.dir; lookY = (pr.y - r0.top) / 160; }
    const eyes = p.m.eyes || (sl || p.pose === 'groom' ? 'closed' : p.pose === 'stretch' && p.tw == null ? 'closed' : blink ? 'closed' : 'open');
    paintCat(cv, p.k, P, { pawUp: p.pose === 'groom' && !p.tw, t, eyes, look, lookY, mouth: p.m.mouth || (p.pose === 'stretch' ? 2 : 0), blush: !!p.m.happy, tailWave: sl ? 3 : held ? 16 : p.pose === 'lie' ? 7 : p.walk ? 9 : p.pose === 'sit' ? 10 : 12 });
  };
  /* comportamento */
  const wait = (ms, fn) => T(fn, ms);
  const walkTo = (dist, run, done) => {
    const [W] = room(), o = other();
    let dir = o && Math.random() < .3 ? (o.X < p.X ? -1 : 1) : (Math.random() < .5 ? -1 : 1);
    if (p.X < 40) dir = 1; if (p.X > W - 40) dir = -1;
    p.dir = dir; place(); p.walk = { left: dist, run, done };
  };
  const next = () => {
    if (p.dead || p.pose === 'hang') return;
    const r = Math.random();
    if (p.pose === 'sit') {
      if (r < .26) return wait(2500 + Math.random() * 3500, next);
      if (r < .4) { toPose('groom', 5); return wait(3000, () => { toPose('sit', 5); wait(1200, next); }); }
      if (r < .48) { p.m.mouth = 1; fx(Math.random() < .5 ? 'miau' : 'mrrr~', 'say'); return wait(700, () => { p.m.mouth = 0; wait(1500, next); }); }
      if (r < .55) { p.dir = -p.dir; place(); return wait(1800, next); }
      if (r < .8) { toPose('stand', 6); return wait(700, next); }
      toPose('lie', 8); return wait(2600, next);
    }
    if (p.pose === 'stand' || p.pose === 'stretch') {
      if (p.pose === 'stand' && r < .62) { return walkTo(50 + Math.random() * 170, Math.random() < .12, () => { wait(600, next); }); }
      if (p.pose === 'stand' && r < .78) { toPose('stretch', 8); return wait(1900, () => { toPose('stand', 7); wait(900, next); }); }
      toPose('sit', 6); return wait(2000, next);
    }
    if (p.pose === 'lie') {
      if (r < .45) { toPose('sleep', 12); return wait(1500, () => { const zz = () => { if (p.pose !== 'sleep' || p.dead) return; fx('z', 'z'); T(zz, 1700); }; zz(); wait(12000 + Math.random() * 18000, () => { if (p.pose === 'sleep') { toPose('lie', 10); wait(2000, next); } }); }); }
      if (r < .75) { toPose('sit', 8); return wait(1800, next); }
      if (r < .87) { p.dir = -p.dir; place(); }
      return wait(2500 + Math.random() * 3000, next);
    }
    wait(1500, next);
  };
  p.next = next;
  /* brincar com a bolinha: corre atrás, dá o bote ou uma patada, e repete até cansar */
  const SW = SC * 3.2, FOOT = 27 * SC;
  const front = () => p.X + (p.dir > 0 ? EW * .82 : EW * .18);
  const chaseStep = dt => {
    const b = PETS.ball; if (!b) { p.chase = null; p.walk = null; return; }
    const tx = b.X + b.S / 2, dx = tx - front();
    const fy = b.Y + b.S - FOOT; p.Y += (fy - p.Y) * Math.min(1, dt / 260);
    if (Math.abs(dx) < SW && b.h < SC * 4) { const r = p.chase.reach; p.chase = null; p.walk = null; place(); r(); return; }
    if (Math.abs(dx) > SC * 5 || Math.sign(dx) === p.dir) p.dir = Math.sign(dx) || p.dir;
    p.X += p.dir * SC * (p.rush ? 1.25 : .78) * dt / 16.7; place();
  };
  const chase = () => {
    if (p.dead || !p.playing) return;
    if (Date.now() > (PETS.ball && PETS.ball.play ? PETS.ball.play.until : 0)) return endPlay();
    p.m = { eyes: 'big' }; toPose('stand', 2);
    p.walk = { left: Infinity, run: true }; p.chase = { reach: swat };
  };
  const swat = () => {
    p.rush = false;
    const b = PETS.ball; if (!b || !p.playing) return endPlay();
    const away = Math.random() < .72 ? p.dir : -p.dir, kick = () => { b.kick(away * (3 + Math.random() * 5.5), 1.5 + Math.random() * 4.5); };
    if (Math.random() < .5) { toPose('stretch', 3); wait(380 + Math.random() * 380, () => { p.m.hop = 1; toPose('stand', 2); wait(160, kick); wait(700 + Math.random() * 500, again); }); }
    else { toPose('sit', 3); wait(260, () => { toPose('groom', 2); wait(150, () => { kick(); toPose('sit', 2); }); wait(650 + Math.random() * 450, again); }); }
  };
  const again = () => {
    if (!p.playing) return;
    if (Math.random() < .22) { toPose('sit', 4); p.m = { eyes: 'big' }; return wait(900 + Math.random() * 1400, chase); }
    chase();
  };
  const endPlay = () => {
    if (!p.playing) return; p.playing = false; p.chase = null; p.walk = null;
    p.m = { eyes: 'happy', happy: 1 }; toPose('sit', 5); if (Math.random() < .6) fx('♥', 'heart');
    savePos(); wait(1600, () => { p.m = {}; wait(1200, next); });
    ballMaybeDone();
  };
  p.joinPlay = rush => {
    if (p.playing && !rush) return;
    clearT(); p.walk = null; p.chase = null; p.playing = true; p.rush = !!rush;
    if (p.pose === 'lie' || p.pose === 'sleep') toPose('stand', rush ? 3 : 4);
    p.m = { eyes: 'big' }; fx('!', 'say');
    wait(rush ? 120 + Math.random() * 200 + slot * 120 : 500 + Math.random() * 700 + slot * 400, chase);
  };
  wait(800 + slot * 1500 + Math.random() * 1500, next);
  /* toque e arraste */
  let sx = 0, sy = 0, ox = 0, oy = 0, moved = false, down = false, taps = [];
  el.addEventListener('pointerdown', e => {
    e.preventDefault(); down = true; moved = false; sx = e.clientX; sy = e.clientY; ox = e.clientX - p.X; oy = e.clientY - p.Y;
    try { el.setPointerCapture(e.pointerId); } catch (er) {}
  });
  el.addEventListener('pointermove', e => {
    if (!down) return;
    if (!moved && Math.hypot(e.clientX - sx, e.clientY - sy) < 6) return;
    if (!moved) { moved = true; clearT(); p.walk = null; p.chase = null; if (p.playing) { p.playing = false; ballMaybeDone(); } p.m = { eyes: 'big' }; el.classList.add('held'); toPose('hang', 3); fx('!', 'say'); }
    p.X = e.clientX - ox; p.Y = e.clientY - oy; place();
  });
  const up = () => {
    if (!down) return; down = false;
    if (moved) { el.classList.remove('held'); el.classList.add('land'); setTimeout(() => el.classList.remove('land'), 420); p.m = {}; toPose('stand', 3); savePos(); wait(900, next); return; }
    /* carinho */
    const now = Date.now(); taps = taps.filter(x => now - x < 1200); taps.push(now);
    clearT(); p.walk = null; p.chase = null; if (p.playing) { p.playing = false; ballMaybeDone(); }
    if (p.pose === 'sleep') { p.m = { eyes: 'big' }; fx('!', 'say'); toPose('lie', 4); wait(700, () => { p.m = {}; toPose('sit', 6); wait(1500, next); }); return; }
    if (taps.length >= 3) { taps = []; p.m = { eyes: 'happy', happy: 1, mouth: 1 }; toPose('stand', 3); wait(260, () => { p.m.hop = 1; fx('♥', 'heart'); setTimeout(() => fx('♥', 'heart h2'), 160); setTimeout(() => fx('♥', 'heart h3'), 320); }); wait(1400, () => { p.m = {}; toPose('sit', 5); wait(1600, next); }); return; }
    if (p.pose === 'stand' || p.pose === 'stretch') toPose('sit', 5);
    p.m = { eyes: 'happy', happy: 1 }; fx('♥', 'heart'); setTimeout(() => fx('♥', 'heart h2'), 220); if (p.n && Math.random() < .5) fx(esc(p.n), 'name'); else if (Math.random() < .5) fx('purr', 'say');
    el.classList.add('purr'); T(() => { el.classList.remove('purr'); p.m = {}; wait(1200, next); }, 1400);
  };
  el.addEventListener('pointerup', up); el.addEventListener('pointercancel', up);
  p.kill = () => { p.dead = true; clearT(); el.remove(); };
  p.draw();
  return p;
}
addEventListener('resize', () => PETS.list.forEach(p => p.place()));
addEventListener('pointermove', e => { if (PETS.list.length) PETS.ptr = { x: e.clientX, y: e.clientY, t: performance.now() }; }, { passive: true });
addEventListener('pointerdown', e => { if (PETS.list.length) PETS.ptr = { x: e.clientX, y: e.clientY, t: performance.now() }; }, { passive: true });

/* ---------- bolinha de lã ----------
   De vez em quando (a cada 6–15 min) os gatos resolvem brincar: a bolinha aparece rolando (na 1ª vez)
   ou eles vão até onde ela ficou, correm atrás, dão botes e patadas por uns 15–25 s e depois ela fica
   parada no chão até a próxima brincadeira. Tocar na bolinha faz ela rolar um pouco. */
const BALL_G = 9;
function ballLoad() { try { return JSON.parse(localStorage.getItem('tt_petball') || '{}'); } catch (e) { return {}; } }
function makeBall() {
  const SC = petScale(), S = BALL_G * SC, st = ballLoad();
  const el = document.createElement('div'); el.className = 'petball'; el.style.width = el.style.height = S + 'px';
  el.innerHTML = '<span class="pbsh"></span>';
  const cv = document.createElement('canvas'); cv.width = cv.height = BALL_G; el.appendChild(cv);
  PETS.box.appendChild(el);
  const room = () => [Math.max(0, innerWidth - S), Math.max(0, innerHeight - S)];
  const b = { el, cv, S, room, X: 0, Y: 0, vx: 0, h: 0, vh: 0, roll: 0, has: !!st.has, next: st.next && st.next < Date.now() + 16 * 6e4 ? st.next : Date.now() + (1 + Math.random() * 2.5) * 6e4, play: null, chk: 0, moving: false };
  { const [W, H] = room(); b.X = (st.x || .5) * W; b.Y = (st.y || .9) * H; }
  b.save = () => { const [W, H] = room(); try { localStorage.setItem('tt_petball', JSON.stringify({ x: W ? b.X / W : .5, y: H ? b.Y / H : .9, next: b.next, has: b.has ? 1 : 0 })); } catch (e) {} };
  b.draw = () => {
    const c = cv.getContext('2d'), ph = ((Math.floor(b.roll / (SC * 1.6)) % 3) + 3) % 3;
    c.clearRect(0, 0, BALL_G, BALL_G);
    const col = { o: '#5A1E2A', b: '#E8556B', d: '#B83248', l: '#FF9BAA' };
    for (let y = 0; y < BALL_G; y++) for (let x = 0; x < BALL_G; x++) {
      const dx = x + .5 - 4.5, dy = y + .5 - 4.5, d = Math.hypot(dx, dy);
      if (d > 4.5) continue;
      let k = d > 3.6 ? 'o' : ((x + y + ph) % 3 === 0) ? 'd' : (dx + dy < -2.6 && d < 3.2) ? 'l' : 'b';
      if (k !== 'o' && ((x - y + 9 + ph) % 4 === 0) && d < 3) k = 'd';
      c.fillStyle = col[k]; c.fillRect(x, y, 1, 1);
    }
    c.fillStyle = col.d; c.fillRect(7, 8, 2, 1);
  };
  b.place = () => {
    const [W, H] = room(); b.X = Math.min(Math.max(b.X, 0), W); b.Y = Math.min(Math.max(b.Y, 0), H);
    el.style.transform = `translate(${Math.round(b.X)}px,${Math.round(b.Y - b.h)}px)`;
    el.style.setProperty('--h', Math.min(1, b.h / (SC * 12))); el.style.setProperty('--hp', Math.round(b.h) + 'px');
    el.classList.toggle('off', !b.has);
  };
  b.kick = (vx, vh) => { b.vx = vx; b.vh = vh; if (b.h <= 0) b.h = .01; b.moving = true; };
  b.glide = dt => {
    const f = dt / 16.7;
    if (b.moving) {
      b.X += b.vx * f; b.roll += b.vx * f; b.vx *= Math.pow(.975, f);
      const [W] = room(); if (b.X <= 0 || b.X >= W) { b.vx = -b.vx * .6; b.X = Math.min(Math.max(b.X, 0), W); }
      if (b.h > 0 || b.vh) { b.vh -= .45 * f; b.h += b.vh * f; if (b.h <= 0) { b.h = 0; b.vh = Math.abs(b.vh) > 1.4 ? -b.vh * .42 : 0; } }
      if (Math.abs(b.vx) < .06 && !b.h && !b.vh) { b.vx = 0; b.moving = false; b.save(); }
      b.draw(); b.place();
    }
    b.chk += dt;
    if (b.chk > 4000) { b.chk = 0; if (!b.play && Date.now() > b.next && !document.hidden && !document.body.classList.contains('v-focus')) ballPlay(); }
  };
  /* tocar = chuta de leve; segurar e arrastar = carrega a bolinha; soltar em movimento = arremessa na direção do gesto */
  let hold = null;
  el.addEventListener('pointerdown', e => {
    e.preventDefault(); e.stopPropagation();
    try { el.setPointerCapture(e.pointerId); } catch (er) {}
    hold = { sx: e.clientX, sy: e.clientY, ox: e.clientX - b.X, oy: e.clientY - b.Y, moved: false, pts: [{ x: e.clientX, y: e.clientY, t: performance.now() }] };
  });
  el.addEventListener('pointermove', e => {
    if (!hold) return;
    const now = performance.now();
    hold.pts.push({ x: e.clientX, y: e.clientY, t: now }); while (hold.pts.length > 2 && now - hold.pts[0].t > 90) hold.pts.shift();
    if (!hold.moved && Math.hypot(e.clientX - hold.sx, e.clientY - hold.sy) < 6) return;
    if (!hold.moved) { hold.moved = true; el.classList.add('held'); b.moving = false; b.vx = b.vh = 0; b.h = 0; }
    b.X = e.clientX - hold.ox; b.Y = e.clientY - hold.oy; b.roll += (e.movementX || 0); b.draw(); b.place();
    PETS.ptr = { x: e.clientX, y: e.clientY, t: now };
  });
  const drop = e => {
    if (!hold) return; const h = hold; hold = null; el.classList.remove('held');
    if (!h.moved) { b.kick((Math.random() < .5 ? -1 : 1) * (3 + Math.random() * 3), 2.5 + Math.random() * 2); ballPlay(true); return; }
    const a0 = h.pts[0], a1 = h.pts[h.pts.length - 1], dt = Math.max(16, a1.t - a0.t);
    const vx = Math.max(-22, Math.min(22, (a1.x - a0.x) / dt * 16.7)), vy = (a1.y - a0.y) / dt * 16.7;
    const vh = Math.max(0, Math.min(13, -vy * .8));
    if (Math.abs(vx) < .4 && vh < .5) { b.save(); ballPlay(true); return; }
    b.kick(vx, vh); ballPlay(true);
  };
  el.addEventListener('pointerup', drop); el.addEventListener('pointercancel', drop);
  b.kill = () => { b.save(); el.remove(); };
  b.draw(); b.place();
  return b;
}
function ballPlay(rush) {
  const b = PETS.ball; if (!b) return;
  const free = p => !p.dead && p.pose !== 'hang' && !p.el.classList.contains('held');
  /* tocou na bolinha: todo mundo corre para brincar (até quem estava dormindo) */
  if (rush) {
    const until = Date.now() + 15000 + Math.random() * 10000;
    b.play = { until: Math.max(until, b.play ? b.play.until : 0) };
    PETS.list.filter(free).forEach(p => p.joinPlay(true));
    return;
  }
  if (b.play) return;
  const cats = PETS.list.filter(p => free(p) && (p.pose !== 'sleep' || Math.random() < .35));
  if (!cats.length) { b.next = Date.now() + 3 * 6e4; b.save(); return; }
  b.play = { until: Date.now() + 18000 + Math.random() * 17000 };
  if (!b.has) {
    /* primeira vez: a bolinha chega rolando pela lateral, na altura do gato */
    const lead = cats[0], [W] = b.room(), fromR = lead.X < innerWidth / 2;
    b.has = true; b.Y = lead.Y + 27 * petScale() - b.S; b.X = fromR ? W : 0; b.kick(fromR ? -7.5 : 7.5, 3);
  }
  cats.forEach(p => p.joinPlay());
}
function ballMaybeDone() {
  const b = PETS.ball; if (!b || !b.play) return;
  if (PETS.list.some(p => p.playing)) return;
  b.play = null; b.next = Date.now() + (6 + Math.random() * 9) * 6e4; b.save();
}
addEventListener('resize', () => { if (PETS.ball) PETS.ball.place(); });

/* ---------- tela de escolha ---------- */
VIEWS.pets = main => {
  const cfg = petCfg(), sel = cfg.cats.map(c => c.k);
  main.innerHTML = headHtml('Pets') + `<div class="scroll"><div class="me pets">
    <nav class="crumbs"><a href="#/me">Perfil</a><span>/</span><span>Pets</span></nav>
    <label class="srow petsw"><span class="f1"><b>Mostrar gatinhos no app</b><span class="mut sm">Gatinhos em pixel art que andam, sentam, deitam, se espreguiçam, se lambem e cochilam pela tela.</span></span><span class="sw-t"><input type="checkbox" data-petson ${cfg.on ? 'checked' : ''}><span></span></span></label>
    <section class="sgrp"><h2>🐈 Escolha até dois gatos</h2>
      <div class="petgrid">${Object.entries(CATS).map(([k, c]) => { const i = sel.indexOf(k); return `<button class="petcard${i >= 0 ? ' on' : ''}" data-act="petpick" data-k="${k}">${i >= 0 ? `<span class="petnum">${i + 1}</span>` : ''}${catImg(k, 'sit', 96)}<span>${esc(c.n)}</span></button>`; }).join('')}</div>
    </section>
    ${cfg.cats.length ? `<section class="sgrp"><h2>Nomes</h2>${cfg.cats.map((c, i) => `<div class="srow"><span class="row">${catImg(c.k, 'sit', 48)}<span class="mut sm">${esc(petBreedName(c.k))}</span></span><input class="in sm" data-petname="${i}" value="${esc(c.n || '')}" maxlength="20" placeholder="Nome"></div>`).join('')}</section>` : ''}
    <p class="hint">Toque no gatinho para fazer carinho (três toques rápidos e ele pula de alegria). Se ele estiver dormindo, acorda. Arraste para levá-lo a outro lugar — a posição fica salva em cada aparelho.</p>
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
