/* Rádio: player no canto superior direito de todas as telas, com 5 estações escolhidas.
   Jazz (Radio Swiss Jazz, rádio pública suíça) e as demais da SomaFM (rádio independente, sem anúncios).
   Cada estação tem endereços de reserva; se um não responder, tenta o próximo. */
'use strict';
const RADIO_ST = [
  { id: 'jazz', e: '🎷', name: 'Jazz para relaxar', desc: 'Jazz clássico e tranquilo, bom para a noite', g: 'linear-gradient(135deg,#3B2A1E,#8C5A2B 60%,#D9A15A)', urls: ['https://stream.srg-ssr.ch/m/rsj/mp3_128', 'https://stream.srg-ssr.ch/m/rsj/aacp_96'] },
  { id: 'lofi', e: '🎧', name: 'Lo-fi beats', desc: 'Batidas instrumentais e relaxantes', g: 'linear-gradient(135deg,#5B3FD6,#B04FC9 55%,#F08AA8)', urls: ['https://ice1.somafm.com/fluid-128-mp3', 'https://ice2.somafm.com/fluid-128-mp3', 'https://ice1.somafm.com/groovesalad-128-mp3'] },
  { id: 'amb', e: '🌧️', name: 'Sons ambientes', desc: 'Texturas calmas para concentrar', g: 'linear-gradient(135deg,#0F3B4F,#1F7A8C 55%,#9AD1D4)', urls: ['https://ice1.somafm.com/dronezone-128-mp3', 'https://ice2.somafm.com/dronezone-128-mp3', 'https://ice1.somafm.com/deepspaceone-128-mp3'] },
  { id: 'cafe', e: '☕', name: 'Café bossa nova', desc: 'Bossa nova e samba de cafeteria', g: 'linear-gradient(135deg,#4A2C1C,#A0623A 55%,#E9C08F)', urls: ['https://ice1.somafm.com/bossa-128-mp3', 'https://ice2.somafm.com/bossa-128-mp3', 'https://ice1.somafm.com/secretagent-128-mp3'] },
  { id: 'lounge', e: '🛗', name: 'Lounge de elevador', desc: 'Easy listening e lounge clássico', g: 'linear-gradient(135deg,#2E3A59,#5C7AB8 55%,#E7C873)', urls: ['https://ice1.somafm.com/illstreet-128-mp3', 'https://ice2.somafm.com/illstreet-128-mp3', 'https://ice1.somafm.com/tikitime-128-mp3'] },
];
const RADIO = { a: null, list: RADIO_ST, i: 0, u: 0, err: '' };
const radioCfg = () => Object.assign({ vol: .6, st: '' }, (typeof db !== 'undefined' && db && db.s && db.s.radio) || {});
function radioAudio() {
  if (RADIO.a) return RADIO.a;
  const a = RADIO.a = new Audio(); a.preload = 'none'; a.volume = radioCfg().vol;
  a.addEventListener('playing', () => { RADIO.err = ''; radioPaint(); });
  ['pause', 'waiting', 'canplay'].forEach(ev => a.addEventListener(ev, radioPaint));
  a.addEventListener('error', () => {
    if (!a.src || a.dataset.stop) return;
    const st = RADIO.list[RADIO.i];
    if (st && RADIO.u < st.urls.length - 1) { RADIO.u++; radioPlay(); }
    else { RADIO.err = 'Esta estação não respondeu agora. Tente outra ou confira a internet.'; a.dataset.stop = 1; a.pause(); a.removeAttribute('src'); radioPaint(); }
  });
  return a;
}
function radioPlay(i) {
  const a = radioAudio();
  if (i != null) { RADIO.i = (i + RADIO.list.length) % RADIO.list.length; RADIO.u = 0; }
  else { const k = RADIO.list.findIndex(s => s.id === radioCfg().st); if (!a.src && k >= 0) RADIO.i = k; }
  const st = RADIO.list[RADIO.i]; RADIO.err = '';
  delete a.dataset.stop;
  const url = st.urls[RADIO.u] || st.urls[0];
  if (a.src !== url) { a.src = url; db.s.radio = Object.assign(radioCfg(), { st: st.id }); put('s', db.s, { silent: true }); }
  a.play().catch(() => {});
  if ('mediaSession' in navigator) {
    try {
      navigator.mediaSession.metadata = new MediaMetadata({ title: st.name, artist: st.desc, album: 'Rádio · Tarefas', artwork: [{ src: 'assets/icon-v4-512.png', sizes: '512x512', type: 'image/png' }] });
      navigator.mediaSession.setActionHandler('play', () => radioPlay());
      navigator.mediaSession.setActionHandler('pause', () => radioPause());
      navigator.mediaSession.setActionHandler('nexttrack', () => radioStep(1));
      navigator.mediaSession.setActionHandler('previoustrack', () => radioStep(-1));
    } catch (e) {}
  }
  radioPaint();
}
function radioPause() { const a = radioAudio(); a.dataset.stop = 1; a.pause(); radioPaint(); }
function radioStep(d) { radioPlay(RADIO.i + d); }
const radioOn = () => !!(RADIO.a && !RADIO.a.paused);
const EQ = n => `<span class="eq${n > 3 ? ' big' : ''}">${'<i></i>'.repeat(n)}</span>`;
function radioBtnHtml() { return `<button class="ib radiobtn${radioOn() ? ' on' : ''}" data-act="radio" data-pop aria-label="Rádio" title="Rádio">${radioOn() ? EQ(3) : ic('music', 19)}</button>`; }
function radioPaint() {
  document.querySelectorAll('.radiobtn').forEach(b => { b.classList.toggle('on', radioOn()); b.innerHTML = radioOn() ? EQ(3) : ic('music', 19); });
  const p = $('#radiop'); if (!p) return;
  const st = RADIO.list[RADIO.i], a = RADIO.a, on = radioOn(), buf = on && a.readyState < 3;
  p.querySelector('.rnow').innerHTML = `<b>${esc(st.name)}</b><small>${buf ? 'conectando…' : on ? 'ao vivo' : esc(st.desc)}</small>`;
  const art = p.querySelector('.rart'); art.style.background = st.g; art.classList.toggle('on', on); art.querySelector('.rae').textContent = st.e;
  p.querySelector('[data-r=play]').innerHTML = ic(on ? 'pause' : 'play', 20);
  const er = p.querySelector('.rerr'); er.textContent = RADIO.err; er.hidden = !RADIO.err;
  const ls = p.querySelector('.rlist'), sig = RADIO.i + ':' + on;
  if (ls.dataset.sig !== sig) { ls.dataset.sig = sig; ls.innerHTML = RADIO.list.map((s, i) => `<button class="rst${i === RADIO.i ? ' cur' : ''}" data-i="${i}"><span class="rse" style="background:${s.g}">${s.e}</span><span class="f1"><b>${esc(s.name)}</b><small>${esc(s.desc)}</small></span>${i === RADIO.i && on ? EQ(3) : ''}</button>`).join(''); }
}
function radioOpen(anchor) {
  if ($('#radiop')) { radioClose(); return; }
  { const k = RADIO.list.findIndex(s => s.id === radioCfg().st); if (!radioOn() && k >= 0) RADIO.i = k; }
  const p = document.createElement('div'); p.id = 'radiop'; p.className = 'radiop'; p.setAttribute('role', 'dialog'); p.setAttribute('aria-label', 'Rádio');
  const vol = Math.round(radioCfg().vol * 100);
  p.innerHTML = `<div class="rhead"><span class="rart"><span class="rae"></span>${EQ(4)}</span><div class="rnow f1"></div><button class="ib rx" data-r="close" aria-label="Fechar">${ic('x', 16)}</button></div>
    <p class="rerr" hidden></p>
    <div class="rctl"><button class="ib" data-r="prev" aria-label="Estação anterior" title="Anterior"><svg viewBox="0 0 24 24" width="20" height="20"><path d="M6 6v12M18 6l-9 6 9 6z" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/></svg></button><button class="rplay" data-r="play" aria-label="Tocar ou pausar"></button><button class="ib" data-r="next" aria-label="Próxima estação" title="Próxima"><svg viewBox="0 0 24 24" width="20" height="20"><path d="M18 6v12M6 6l9 6-9 6z" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/></svg></button></div>
    <div class="rvol"><button class="ib" data-r="mute" aria-label="Sem som">${ic('music', 16)}</button><input type="range" min="0" max="100" value="${vol}" aria-label="Volume"><span class="rvn">${vol}%</span></div>
    <div class="rlist"></div>`;
  document.body.appendChild(p);
  const r = anchor.getBoundingClientRect();
  p.style.top = Math.round(r.bottom + 8) + 'px'; p.style.right = Math.max(10, Math.round(innerWidth - r.right)) + 'px';
  p.addEventListener('click', e => {
    const b = e.target.closest('[data-r]'), s = e.target.closest('.rst');
    if (s) { radioPlay(+s.dataset.i); return; }
    if (!b) return; const k = b.dataset.r;
    if (k === 'close') radioClose();
    if (k === 'play') radioOn() ? radioPause() : radioPlay();
    if (k === 'next') radioStep(1);
    if (k === 'prev') radioStep(-1);
    if (k === 'mute') { const a = radioAudio(); a.muted = !a.muted; b.classList.toggle('on', a.muted); }
  });
  const rg = p.querySelector('input[type=range]'), vn = p.querySelector('.rvn');
  rg.oninput = () => { const v = +rg.value / 100; radioAudio().volume = v; vn.textContent = rg.value + '%'; db.s.radio = Object.assign(radioCfg(), { vol: v }); saveRadio(); };
  radioPaint();
  setTimeout(() => document.addEventListener('pointerdown', radioOut, true), 0);
}
const saveRadio = debounce(() => put('s', db.s, { silent: true }), 600);
function radioOut(e) { const p = $('#radiop'); if (!p) { document.removeEventListener('pointerdown', radioOut, true); return; } if (p.contains(e.target) || e.target.closest('.radiobtn')) return; radioClose(); }
function radioClose() { const p = $('#radiop'); if (p) p.remove(); document.removeEventListener('pointerdown', radioOut, true); }
ACTS.radio = b => radioOpen(b);
addEventListener('resize', radioClose);
