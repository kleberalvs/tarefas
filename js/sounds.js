/* Sons do Pomodoro: ambientes relaxantes e alarmes, todos gerados no aparelho (funcionam sem internet). */
'use strict';
const AMBIENTS = [
  { k: 'none', n: 'Silêncio', e: '🔇' }, { k: 'rain', n: 'Chuva', e: '🌧️' }, { k: 'storm', n: 'Tempestade', e: '⛈️' }, { k: 'ocean', n: 'Ondas do mar', e: '🌊' },
  { k: 'stream', n: 'Riacho', e: '🏞️' }, { k: 'forest', n: 'Floresta', e: '🌳' }, { k: 'fire', n: 'Lareira', e: '🔥' }, { k: 'wind', n: 'Vento', e: '🌬️' },
  { k: 'night', n: 'Noite de verão', e: '🦗' }, { k: 'white', n: 'Ruído branco', e: '⚪' }, { k: 'pink', n: 'Ruído rosa', e: '🌸' }, { k: 'brown', n: 'Ruído marrom', e: '🟤' },
  { k: 'clock', n: 'Relógio', e: '🕰️' }, { k: 'alpha', n: 'Ondas alfa (fones)', e: '🎧' },
];
const ALARMS = [{ k: 'bell', n: 'Sino' }, { k: 'chime', n: 'Carrilhão suave' }, { k: 'marimba', n: 'Marimba' }, { k: 'digital', n: 'Digital' }, { k: 'birds', n: 'Pássaros' }, { k: 'bowl', n: 'Taça tibetana' }, { k: 'none', n: 'Sem som' }];
const SND = { ctx: null, master: null, nodes: [], timers: [], cur: 'none' };
function actx() {
  if (!SND.ctx) { SND.ctx = new (window.AudioContext || window.webkitAudioContext)(); SND.master = SND.ctx.createGain(); SND.master.connect(SND.ctx.destination); }
  if (SND.ctx.state === 'suspended') SND.ctx.resume();
  return SND.ctx;
}
function noiseBuf(type) {
  const c = actx(), len = c.sampleRate * 6, b = c.createBuffer(2, len, c.sampleRate);
  for (let ch = 0; ch < 2; ch++) {
    const d = b.getChannelData(ch); let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0, last = 0;
    for (let i = 0; i < len; i++) {
      const w = Math.random() * 2 - 1;
      if (type === 'pink') { b0 = .99886 * b0 + w * .0555179; b1 = .99332 * b1 + w * .0750759; b2 = .969 * b2 + w * .153852; b3 = .8665 * b3 + w * .3104856; b4 = .55 * b4 + w * .5329522; b5 = -.7616 * b5 - w * .016898; d[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + w * .5362) * .11; b6 = w * .115926; }
      else if (type === 'brown') { last = (last + .02 * w) / 1.02; d[i] = last * 3.5; }
      else d[i] = w * .5;
    }
  }
  return b;
}
const BUFS = {};
function src(type) { const c = actx(); const s = c.createBufferSource(); s.buffer = BUFS[type] || (BUFS[type] = noiseBuf(type)); s.loop = true; s.start(); SND.nodes.push(s); return s; }
function flt(type, f, q = .7) { const x = actx().createBiquadFilter(); x.type = type; x.frequency.value = f; x.Q.value = q; return x; }
function gain(v) { const g = actx().createGain(); g.gain.value = v; return g; }
function lfo(freq, depth, target, offset) { const c = actx(), o = c.createOscillator(), g = c.createGain(); o.frequency.value = freq; g.gain.value = depth; o.connect(g); g.connect(target); if (offset != null) target.value = offset; o.start(); SND.nodes.push(o); return o; }
function chain(...n) { for (let i = 0; i < n.length - 1; i++) n[i].connect(n[i + 1]); return n[n.length - 1]; }
function every(minMs, maxMs, fn) { const t = { stop: false }; const run = () => { if (t.stop) return; fn(); t.id = setTimeout(run, minMs + Math.random() * (maxMs - minMs)); }; t.id = setTimeout(run, minMs * Math.random()); SND.timers.push(t); }
function blip(freq, dur, vol, type = 'sine', at = 0, out) {
  const c = actx(), o = c.createOscillator(), g = c.createGain(), t = c.currentTime + at;
  o.type = type; o.frequency.setValueAtTime(freq, t); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + .01); g.gain.exponentialRampToValueAtTime(.0001, t + dur);
  o.connect(g); g.connect(out || SND.master); o.start(t); o.stop(t + dur + .05); return o;
}
function burst(dur, vol, f1, f2, out) {
  const c = actx(), s = c.createBufferSource(); s.buffer = BUFS.white || (BUFS.white = noiseBuf('white'));
  const bp = flt('bandpass', f1 + Math.random() * (f2 - f1), 1.2), g = c.createGain(), t = c.currentTime;
  g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(.0001, t + dur);
  s.connect(bp); bp.connect(g); g.connect(out || SND.master); s.start(t, Math.random() * 4); s.stop(t + dur + .02);
}
function chirp(out) { const c = actx(), base = 2200 + Math.random() * 2400, n = 2 + Math.floor(Math.random() * 4); for (let i = 0; i < n; i++) { const o = c.createOscillator(), g = c.createGain(), t = c.currentTime + i * (.09 + Math.random() * .05); o.frequency.setValueAtTime(base, t); o.frequency.exponentialRampToValueAtTime(base * (1.2 + Math.random() * .5), t + .06); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(.05, t + .01); g.gain.exponentialRampToValueAtTime(.0001, t + .08); o.connect(g); g.connect(out || SND.master); o.start(t); o.stop(t + .1); } }
function stopAmbient() {
  SND.timers.forEach(t => { t.stop = true; clearTimeout(t.id); }); SND.timers = [];
  SND.nodes.forEach(n => { try { n.stop(); } catch (e) {} try { n.disconnect(); } catch (e) {} }); SND.nodes = [];
  SND.cur = 'none';
}
function playAmbient(k) {
  stopAmbient();
  if (!k || k === 'none') return;
  const c = actx(), out = gain(1); out.connect(SND.master); SND.nodes.push({ stop() {}, disconnect() { out.disconnect(); } });
  SND.master.gain.setTargetAtTime((db.s.pomo.vol ?? 60) / 100, c.currentTime, .05);
  SND.cur = k;
  if (k === 'white' || k === 'pink' || k === 'brown') chain(src(k), gain(k === 'white' ? .35 : .7), out);
  if (k === 'rain' || k === 'storm') {
    chain(src('pink'), flt('highpass', 400), flt('lowpass', 7000), gain(.55), out);
    every(25, 90, () => burst(.03 + Math.random() * .04, .06 + Math.random() * .08, 2500, 7000, out));
    if (k === 'storm') {
      chain(src('brown'), flt('lowpass', 300), gain(.5), out);
      every(9000, 22000, () => { const s = c.createBufferSource(); s.buffer = BUFS.brown || (BUFS.brown = noiseBuf('brown')); const lp = flt('lowpass', 140), g = c.createGain(), t = c.currentTime; g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(1.6, t + .25); g.gain.exponentialRampToValueAtTime(.001, t + 4 + Math.random() * 3); s.connect(lp); lp.connect(g); g.connect(out); s.start(t); s.stop(t + 8); });
    }
  }
  if (k === 'ocean') {
    const g = gain(.5), lp = flt('lowpass', 900); chain(src('pink'), lp, g, out);
    lfo(.09, .38, g.gain, .45); lfo(.09, 450, lp.frequency, 900);
    chain(src('brown'), flt('lowpass', 250), gain(.35), out);
  }
  if (k === 'stream') {
    const bp = flt('bandpass', 1800, .6), g = gain(.45); chain(src('white'), bp, g, out);
    lfo(6.5, .08, g.gain, .4); lfo(.3, 500, bp.frequency, 1800);
    chain(src('brown'), flt('lowpass', 500), gain(.4), out);
    every(60, 220, () => blip(600 + Math.random() * 900, .05, .012, 'sine', 0, out));
  }
  if (k === 'wind' || k === 'forest') {
    const bp = flt('bandpass', 600, .8), g = gain(k === 'forest' ? .25 : .55); chain(src('pink'), bp, g, out);
    lfo(.06, 380, bp.frequency, 600); lfo(.11, .2, g.gain, k === 'forest' ? .22 : .5);
    if (k === 'forest') { chain(src('brown'), flt('lowpass', 400), gain(.2), out); every(1800, 6500, () => chirp(out)); }
  }
  if (k === 'fire') {
    chain(src('brown'), flt('lowpass', 600), gain(.8), out);
    every(40, 380, () => burst(.006 + Math.random() * .02, .15 + Math.random() * .35, 1500, 6000, out));
    every(1500, 5000, () => burst(.2, .08, 200, 500, out));
  }
  if (k === 'night') {
    chain(src('brown'), flt('lowpass', 300), gain(.25), out);
    every(380, 900, () => { for (let i = 0; i < 3; i++) blip(4300 + Math.random() * 200, .035, .02, 'sine', i * .055, out); });
    every(5000, 12000, () => blip(320 + Math.random() * 40, .5, .03, 'triangle', 0, out));
  }
  if (k === 'clock') { let tic = true; every(1000, 1000, () => { blip(tic ? 1800 : 1500, .03, .2, 'square', 0, out); tic = !tic; }); }
  if (k === 'alpha') {
    const m = c.createChannelMerger(2); m.connect(out);
    [200, 210].forEach((f, i) => { const o = c.createOscillator(); o.frequency.value = f; const g = gain(.12); o.connect(g); g.connect(m, 0, i); o.start(); SND.nodes.push(o); });
    chain(src('pink'), gain(.12), out);
  }
}
function setVolume(v) { db.s.pomo.vol = v; if (SND.ctx) SND.master.gain.setTargetAtTime(v / 100, SND.ctx.currentTime, .05); }
function playAlarm(k) {
  k = k || db.s.pomo.alarm || 'bell';
  if (k === 'none' || !db.s.pomo.sound) return;
  const c = actx(), o = gain(Math.max(.25, (db.s.pomo.vol ?? 60) / 100)); o.connect(c.destination);
  const bell = (f, at, dur = 2.4, v = .22) => [1, 2.76, 5.4, 8.9].forEach((m, i) => blip(f * m, dur / (i + 1), v / (i + 1.5), 'sine', at, o));
  if (k === 'bell') { bell(660, 0); bell(660, 1.4); }
  if (k === 'chime') [523, 659, 784, 1047].forEach((f, i) => bell(f, i * .28, 1.8, .16));
  if (k === 'marimba') [523, 659, 784, 659, 1047].forEach((f, i) => { blip(f, .5, .3, 'sine', i * .16, o); blip(f * 4, .12, .06, 'sine', i * .16, o); });
  if (k === 'digital') for (let r = 0; r < 3; r++) for (let i = 0; i < 4; i++) blip(1760, .07, .12, 'square', r * .7 + i * .11, o);
  if (k === 'birds') for (let i = 0; i < 4; i++) setTimeout(() => chirp(o), i * 420);
  if (k === 'bowl') { [220, 221.5].forEach(f => blip(f, 6, .25, 'sine', 0, o)); blip(586, 4, .08, 'sine', 0, o); blip(1180, 2.5, .03, 'sine', 0, o); }
}
/* tocar o ambiente conforme o estado do foco */
function ambientFollow() {
  const want = db.s.pomo.amb || 'none';
  const onlyFocus = db.s.pomo.ambOnly !== false;
  const should = want !== 'none' && (AMB_PREVIEW || (FS.run && (!onlyFocus || FS.mode === 'focus' || FS.mode === 'watch')));
  if (should && SND.cur !== want) playAmbient(want);
  if (!should && SND.cur !== 'none') stopAmbient();
}
let AMB_PREVIEW = false;
