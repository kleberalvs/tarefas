/* Pets: até dois gatinhos pixelados que ficam pela tela fazendo gestos. Arraste para mudar de lugar, toque para fazer carinho. */
'use strict';
const PET_W = 18, PET_H = 16, PET_SC = 4;
/* corpo sentado de frente (12 colunas); a cauda é desenhada à parte */
const CAT_BODY = [
  '.o........o.',
  'obo......obo',
  'obpo....opbo',
  'obbboooobbbo',
  'obbbdbbdbbbo',
  'obEhbbbbEhbo',
  'obkkbbbbkkbo',
  'obbbwppwbbbo',
  'obbwwwwwwbbo',
  '.obbbbbbbbo.',
  '.obbwwwwbbo.',
  'odbbwwwwbbdo',
  'obbbwwwwbbbo',
  'odbbbwwbbbdo',
  'obwwbbbbwwbo',
  '.oooooooooo.',
];
const CAT_TAILS = [
  { y: 6, r: ['...oo.', '..obbo', '..obo.', '.odo..', '.obo..', 'odo...', 'obo...', 'bo....'] },
  { y: 6, r: ['....oo', '...obo', '..obo.', '..odo.', '.obo..', 'odo...', 'obo...', 'bo....'] },
  { y: 12, r: ['....o.', 'oooobo', 'bdbdbo', 'ooooo.'] },
];
const CATS = {
  laranja: { n: 'Laranja', c: { o: '#5A3418', b: '#EE9A45', d: '#C9681E', w: '#FCEBD5', p: '#F29AA0', E: '#7DBB3C' } },
  frajola: { n: 'Frajola', c: { o: '#0E0E12', b: '#2F3038', d: '#2F3038', w: '#F7F7F7', p: '#EE96A3', E: '#9CCB4B' } },
  preto: { n: 'Pretinho', c: { o: '#0B0B0E', b: '#26262E', d: '#1C1C22', w: '#26262E', p: '#E58A97', E: '#F2C230' } },
  cinza: { n: 'Cinza rajado', c: { o: '#3A414A', b: '#9AA6B4', d: '#6C7886', w: '#E2E7ED', p: '#F0A0AC', E: '#F0B93A' } },
  branco: { n: 'Branquinho', c: { o: '#8F877B', b: '#FAF8F3', d: '#ECE6DB', w: '#FFFFFF', p: '#F5A9B6', E: '#5AA9E6' } },
  siames: { n: 'Siamês', c: { o: '#45322A', b: '#F1E5CC', d: '#6E5040', w: '#F8F0E0', p: '#D9909A', E: '#4A90E2' }, points: 1 },
  tricolor: { n: 'Tricolor', c: { o: '#4F3E31', b: '#FBF7F0', d: '#FBF7F0', w: '#FFFFFF', p: '#F2A1AC', E: '#C8A23A', x: '#E58C3A', y: '#2E2A28' }, patch: [[1, 1, 'x'], [1, 2, 'x'], [1, 3, 'x'], [2, 3, 'x'], [1, 4, 'x'], [2, 4, 'x'], [3, 4, 'x'], [9, 3, 'y'], [10, 3, 'y'], [10, 4, 'y'], [9, 4, 'y'], [10, 1, 'y'], [10, 2, 'y'], [1, 11, 'y'], [2, 11, 'y'], [2, 12, 'y'], [1, 12, 'y'], [9, 12, 'x'], [10, 12, 'x'], [10, 13, 'x'], [9, 13, 'x'], [10, 11, 'x']] },
  marrom: { n: 'Marrom rajado', c: { o: '#3B2A1E', b: '#A27852', d: '#6B4A30', w: '#EADBC6', p: '#E79CA0', E: '#8CB83A' } },
};
const CAT_NAMES = ['Mingau', 'Pipoca', 'Nina', 'Tom', 'Luna', 'Paçoca', 'Frida', 'Simba', 'Mel', 'Bolinha'];
function petCfg() { const p = db.s.pets || {}; return { on: !!p.on, cats: Array.isArray(p.cats) ? p.cats.slice(0, 2) : [] }; }
function savePets(p) { db.s.pets = p; put('s', db.s); petsSync(); }
function catGrid(k, pose = {}) {
  const g = Array.from({ length: PET_H }, () => Array(PET_W).fill('.'));
  CAT_BODY.forEach((r, y) => [...r].forEach((ch, x) => { g[y][x] = ch; }));
  const tl = CAT_TAILS[pose.tail || 0];
  tl.r.forEach((r, i) => [...r].forEach((ch, x) => { if (ch !== '.' && g[tl.y + i]) g[tl.y + i][12 + x] = ch; }));
  const S = (x, y, ch) => { if (g[y]) g[y][x] = ch; };
  const eyes = (a, b, c, d) => [2, 8].forEach(x => { S(x, 5, a); S(x + 1, 5, b); S(x, 6, c); S(x + 1, 6, d); });
  if (pose.eyes === 'closed') eyes('b', 'b', 'o', 'o');
  if (pose.eyes === 'happy') { eyes('o', 'o', 'b', 'b'); S(1, 7, 'p'); S(10, 7, 'p'); }
  if (pose.eyes === 'left') eyes('h', 'E', 'k', 'k');
  if (pose.eyes === 'right') eyes('E', 'h', 'k', 'k');
  if (pose.eyes === 'wide') eyes('h', 'k', 'k', 'k');
  if (pose.mouth) { S(5, 8, 'k'); S(6, 8, 'k'); }
  if (pose.tongue) { S(5, 8, 'p'); }
  if (pose.ear) { S(1, 0, '.'); S(0, 1, '.'); S(1, 1, 'o'); S(2, 1, 'o'); }
  if (pose.paw) { ['.obwwbbbbbo.', '.owwwwwwbbo.'].forEach((r, i) => [...r].forEach((ch, x) => S(x, 9 + i, ch))); S(2, 14, 'b'); S(3, 14, 'b'); }
  const cat = CATS[k] || CATS.laranja;
  if (cat.points) {
    for (let y = 0; y < 4; y++) for (let x = 0; x < 12; x++) if (g[y][x] === 'b') g[y][x] = 'd';
    for (let y = 6; y < 16; y++) for (let x = 12; x < 18; x++) if (g[y][x] === 'b') g[y][x] = 'd';
    [[1, 7], [2, 7], [9, 7], [10, 7], [2, 8], [9, 8]].forEach(([x, y]) => { if (g[y][x] === 'b') g[y][x] = 'd'; });
    [2, 3, 8, 9].forEach(x => { if (g[14][x] === 'w') g[14][x] = 'd'; });
  }
  (cat.patch || []).forEach(([x, y, c]) => { if (g[y][x] === 'b' || g[y][x] === 'd') g[y][x] = c; });
  return g;
}
function drawCat(cv, k, pose) {
  const c = cv.getContext('2d'), pal = Object.assign({ h: '#FFFFFF', k: '#141414' }, (CATS[k] || CATS.laranja).c);
  c.clearRect(0, 0, cv.width, cv.height);
  catGrid(k, pose).forEach((r, y) => r.forEach((ch, x) => { if (ch !== '.' && pal[ch]) { c.fillStyle = pal[ch]; c.fillRect(x, y, 1, 1); } }));
}
function catCanvas(k, pose, cls = '') { const cv = document.createElement('canvas'); cv.width = PET_W; cv.height = PET_H; cv.className = 'petcv ' + cls; drawCat(cv, k, pose || {}); return cv; }
function catImg(k, pose, size = 72) { const cv = catCanvas(k, pose); return `<img class="petimg" src="${cv.toDataURL()}" width="${size}" height="${Math.round(size * PET_H / PET_W)}" alt="">`; }

/* ---------- gatos na tela ---------- */
const PETS = { box: null, list: [] };
function petPos() { try { return JSON.parse(localStorage.getItem('tt_petpos') || '{}'); } catch (e) { return {}; } }
function savePos() { const m = {}; PETS.list.forEach(p => m[p.slot] = { x: p.x, y: p.y }); try { localStorage.setItem('tt_petpos', JSON.stringify(m)); } catch (e) {} }
function petsSync() {
  const cfg = petCfg(), want = cfg.on ? cfg.cats : [];
  const sig = JSON.stringify(want.map(c => c.k + '|' + (c.n || '')));
  if (PETS.sig === sig) return;
  PETS.sig = sig;
  PETS.list.forEach(p => p.kill()); PETS.list = [];
  if (!want.length) { if (PETS.box) PETS.box.remove(); PETS.box = null; return; }
  if (!PETS.box) { PETS.box = document.createElement('div'); PETS.box.id = 'pets'; document.body.appendChild(PETS.box); }
  const pos = petPos();
  want.forEach((c, i) => PETS.list.push(makePet(c, i, pos[i])));
}
function petsReset() { try { localStorage.removeItem('tt_petpos'); } catch (e) {} PETS.sig = null; petsSync(); }
function clampPet(p) {
  const W = innerWidth, H = innerHeight, w = PET_W * PET_SC, h = PET_H * PET_SC;
  p.x = Math.min(Math.max(p.x, 0), 1); p.y = Math.min(Math.max(p.y, 0), 1);
  p.el.style.transform = `translate(${Math.round(p.x * (W - w))}px,${Math.round(p.y * (H - h))}px)`;
}
function makePet(c, slot, saved) {
  const el = document.createElement('div'); el.className = 'pet'; el.setAttribute('role', 'img'); el.setAttribute('aria-label', 'Gatinho ' + (c.n || ''));
  el.innerHTML = `<div class="petb"><div class="petin"></div></div><span class="petsh"></span><span class="petfx"></span>`;
  const cv = catCanvas(c.k, {}); el.querySelector('.petin').appendChild(cv);
  const p = { slot, k: c.k, n: c.n, el, cv, x: saved ? saved.x : (slot ? .74 : .9), y: saved ? saved.y : (isMobile() ? .84 : .9), pose: {}, timers: [], state: 'idle', dead: false };
  PETS.box.appendChild(el); clampPet(p);
  const T = (fn, ms) => { const id = setTimeout(() => { if (!p.dead) fn(); }, ms); p.timers.push(id); return id; };
  const set = pose => { p.pose = pose; drawCat(cv, p.k, pose); };
  const fx = (html, cls) => { const s = document.createElement('span'); s.className = 'pfx ' + (cls || ''); s.innerHTML = html; el.querySelector('.petfx').appendChild(s); setTimeout(() => s.remove(), 1800); };
  const other = () => PETS.list.find(q => q !== p);
  const actions = {
    blink: () => { set(Object.assign({}, p.pose, { eyes: 'closed' })); T(() => set(Object.assign({}, p.pose, { eyes: undefined })), 160); return 300; },
    wag: () => { let i = 0; const step = () => { set({ tail: i % 2 ? 1 : 0 }); if (++i < 8) T(step, 230); }; step(); return 2000; },
    look: () => { const o = other(); const dir = o ? (o.x < p.x ? 'left' : 'right') : (Math.random() < .5 ? 'left' : 'right'); set({ eyes: dir, tail: 1 }); T(() => set({}), 1600); return 1900; },
    meow: () => { set({ mouth: 1 }); fx(Math.random() < .5 ? 'miau' : 'miau~', 'say'); T(() => set({}), 700); return 1500; },
    groom: () => { let i = 0; const step = () => { set({ paw: 1, eyes: 'closed', tongue: i % 2 }); if (++i < 8) T(step, 260); else T(() => set({}), 260); }; step(); return 2500; },
    ear: () => { set({ ear: 1 }); T(() => set({}), 220); T(() => set({ ear: 1 }), 420); T(() => set({}), 600); return 900; },
    sleep: () => { p.state = 'sleep'; el.classList.add('zz'); set({ eyes: 'closed', tail: 2 }); const z = () => { if (p.state !== 'sleep') return; fx('z', 'z'); T(z, 1400); }; z(); const d = 9000 + Math.random() * 14000; T(() => { if (p.state === 'sleep') wake(); }, d); return d + 400; },
  };
  const wake = () => { p.state = 'idle'; el.classList.remove('zz'); set({ eyes: 'wide' }); T(() => set({}), 500); };
  const loop = () => {
    if (p.state === 'held') return T(loop, 800);
    if (p.state === 'sleep') return T(loop, 1500);
    const r = Math.random();
    const a = r < .3 ? 'blink' : r < .48 ? 'wag' : r < .62 ? 'look' : r < .72 ? 'ear' : r < .82 ? 'groom' : r < .9 ? 'meow' : 'sleep';
    const d = actions[a]();
    T(loop, d + 1500 + Math.random() * 3500);
  };
  T(loop, 900 + slot * 1300 + Math.random() * 1500);
  T(() => actions.blink(), 400);
  /* toque e arraste */
  let sx = 0, sy = 0, ox = 0, oy = 0, moved = false, down = false;
  el.addEventListener('pointerdown', e => {
    e.preventDefault(); down = true; moved = false; sx = e.clientX; sy = e.clientY;
    const r = el.getBoundingClientRect(); ox = e.clientX - r.left; oy = e.clientY - r.top;
    try { el.setPointerCapture(e.pointerId); } catch (er) {}
  });
  el.addEventListener('pointermove', e => {
    if (!down) return;
    if (!moved && Math.hypot(e.clientX - sx, e.clientY - sy) < 6) return;
    if (!moved) { moved = true; p.state = 'held'; el.classList.remove('zz', 'land'); el.classList.add('held'); set({ eyes: 'wide', tail: 1 }); }
    const W = innerWidth, H = innerHeight, w = PET_W * PET_SC, h = PET_H * PET_SC;
    p.x = (e.clientX - ox) / (W - w); p.y = (e.clientY - oy) / (H - h); clampPet(p);
  });
  const up = () => {
    if (!down) return; down = false;
    if (moved) { el.classList.remove('held'); el.classList.add('land'); setTimeout(() => el.classList.remove('land'), 420); p.state = 'idle'; set({}); savePos(); return; }
    /* carinho */
    if (p.state === 'sleep') wake();
    set({ eyes: 'happy', tail: 1 });
    fx('♥', 'heart'); setTimeout(() => fx('♥', 'heart h2'), 220); if (p.n) fx(esc(p.n), 'name');
    el.classList.add('purr'); T(() => { el.classList.remove('purr'); set({}); }, 1300);
  };
  el.addEventListener('pointerup', up); el.addEventListener('pointercancel', up);
  p.kill = () => { p.dead = true; p.timers.forEach(clearTimeout); el.remove(); };
  return p;
}
addEventListener('resize', () => PETS.list.forEach(clampPet));

/* ---------- tela de escolha ---------- */
VIEWS.pets = main => {
  const cfg = petCfg(), sel = cfg.cats.map(c => c.k);
  main.innerHTML = headHtml('Pets') + `<div class="scroll"><div class="me pets">
    <nav class="crumbs"><a href="#/me">Perfil</a><span>/</span><span>Pets</span></nav>
    <label class="srow petsw"><span class="f1"><b>Mostrar gatinhos no app</b><span class="mut sm">Eles ficam parados pela tela, piscando, abanando o rabo, se lambendo e até cochilando.</span></span><span class="sw-t"><input type="checkbox" data-petson ${cfg.on ? 'checked' : ''}><span></span></span></label>
    <section class="sgrp"><h2>🐈 Escolha até dois gatos</h2>
      <div class="petgrid">${Object.entries(CATS).map(([k, c]) => { const i = sel.indexOf(k); return `<button class="petcard${i >= 0 ? ' on' : ''}" data-act="petpick" data-k="${k}">${i >= 0 ? `<span class="petnum">${i + 1}</span>` : ''}${catImg(k, {}, 72)}<span>${esc(c.n)}</span></button>`; }).join('')}</div>
    </section>
    ${cfg.cats.length ? `<section class="sgrp"><h2>Nomes</h2>${cfg.cats.map((c, i) => `<div class="srow"><span class="row">${catImg(c.k, {}, 36)}<span class="mut sm">${esc(CATS[c.k] ? CATS[c.k].n : '')}</span></span><input class="in sm" data-petname="${i}" value="${esc(c.n || '')}" maxlength="20" placeholder="Nome"></div>`).join('')}</section>` : ''}
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
