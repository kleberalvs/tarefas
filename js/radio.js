/* Rádio lo-fi: player que fica no canto superior direito de todas as telas.
   As estações vêm do Radio Browser (diretório público e gratuito de rádios), filtradas pela etiqueta "lofi",
   com algumas estações fixas de reserva. Toca em segundo plano enquanto você navega pelo app. */
'use strict';
const RADIO = { a: null, list: [], i: 0, loading: false, tries: 0, err: '' };
const RADIO_FIXED = [
  { name: 'Chillhop · FluxFM', url: 'https://streams.fluxfm.de/Chillhop/mp3-128/streams.fluxfm.de/', tag: 'Alemanha · 128 kbps' },
  { name: 'Lo-fi · laut.fm', url: 'https://stream.laut.fm/lofi', tag: 'Alemanha' },
  { name: 'Lounge · FluxFM', url: 'https://streams.fluxfm.de/lounge/mp3-128/streams.fluxfm.de/', tag: 'Alemanha · 128 kbps' },
];
const radioCfg = () => Object.assign({ vol: .6, url: '' }, db.s.radio || {});
function radioAudio() {
  if (RADIO.a) return RADIO.a;
  const a = RADIO.a = new Audio(); a.preload = 'none'; a.crossOrigin = null; a.volume = radioCfg().vol;
  a.addEventListener('playing', () => { RADIO.tries = 0; RADIO.err = ''; radioPaint(); });
  a.addEventListener('pause', radioPaint);
  a.addEventListener('waiting', radioPaint);
  a.addEventListener('error', () => { if (!a.src || a.dataset.stop) return; if (RADIO.tries++ < 4) { toast('Estação fora do ar — indo para a próxima'); radioStep(1, true); } else { RADIO.err = 'Não consegui tocar nenhuma estação agora. Confira a internet.'; radioPaint(); } });
  return a;
}
async function radioLoad() {
  if (RADIO.list.length || RADIO.loading) return;
  RADIO.loading = true; radioPaint();
  let got = [];
  try { const c = JSON.parse(localStorage.getItem('tt_radio') || 'null'); if (c && Date.now() - c.at < 864e5 && c.list.length) got = c.list; } catch (e) {}
  if (!got.length) {
    for (const host of ['de1', 'de2', 'fi1', 'at1']) {
      try {
        const r = await fetch(`https://${host}.api.radio-browser.info/json/stations/search?tagList=lofi&hidebroken=true&order=votes&reverse=true&limit=80`);
        if (!r.ok) continue;
        const js = await r.json(), seen = new Set();
        got = js.filter(s => /^https:/.test(s.url_resolved || '') && /mp3|aac/i.test(s.codec || '') && s.lastcheckok).filter(s => { const k = s.name.trim().toLowerCase(); if (seen.has(k)) return false; seen.add(k); return true; })
          .slice(0, 40).map(s => ({ name: s.name.trim().replace(/\s+/g, ' ').slice(0, 60), url: s.url_resolved, tag: [s.country, s.bitrate ? s.bitrate + ' kbps' : ''].filter(Boolean).join(' · '), fav: s.favicon || '' }));
        if (got.length) { try { localStorage.setItem('tt_radio', JSON.stringify({ at: Date.now(), list: got })); } catch (e) {} break; }
      } catch (e) {}
    }
  }
  const urls = new Set(got.map(s => s.url));
  RADIO.list = [...RADIO_FIXED.filter(s => !urls.has(s.url)), ...got];
  const last = radioCfg().url, k = RADIO.list.findIndex(s => s.url === last); if (k >= 0) RADIO.i = k;
  RADIO.loading = false; radioPaint();
}
function radioPlay(i) {
  const a = radioAudio(); if (i != null) RADIO.i = (i + RADIO.list.length) % RADIO.list.length;
  const st = RADIO.list[RADIO.i]; if (!st) return;
  delete a.dataset.stop;
  if (a.src !== st.url) { a.src = st.url; db.s.radio = Object.assign(radioCfg(), { url: st.url }); put('s', db.s, { silent: true }); }
  a.play().catch(() => {});
  if ('mediaSession' in navigator) {
    navigator.mediaSession.metadata = new MediaMetadata({ title: st.name, artist: 'Rádio lo-fi', album: 'Tarefas', artwork: [{ src: 'assets/icon-v4-512.png', sizes: '512x512', type: 'image/png' }] });
    navigator.mediaSession.setActionHandler('play', () => radioPlay());
    navigator.mediaSession.setActionHandler('pause', () => radioPause());
    navigator.mediaSession.setActionHandler('nexttrack', () => radioStep(1));
    navigator.mediaSession.setActionHandler('previoustrack', () => radioStep(-1));
  }
  radioPaint();
}
function radioPause() { const a = radioAudio(); a.dataset.stop = 1; a.pause(); radioPaint(); }
function radioStep(d, auto) { if (!RADIO.list.length) return; if (!auto) RADIO.tries = 0; radioPlay(RADIO.i + d); }
const radioOn = () => !!(RADIO.a && !RADIO.a.paused);
function radioBtnHtml() { return `<button class="ib radiobtn${radioOn() ? ' on' : ''}" data-act="radio" data-pop aria-label="Rádio lo-fi" title="Rádio lo-fi">${radioOn() ? '<span class="eq"><i></i><i></i><i></i></span>' : ic('music', 19)}</button>`; }
function radioPaint() {
  document.querySelectorAll('.radiobtn').forEach(b => { b.classList.toggle('on', radioOn()); b.innerHTML = radioOn() ? '<span class="eq"><i></i><i></i><i></i></span>' : ic('music', 19); });
  const p = $('#radiop'); if (!p) return;
  const st = RADIO.list[RADIO.i], a = RADIO.a, on = radioOn(), buf = a && !a.paused && a.readyState < 3;
  p.querySelector('.rnow').innerHTML = RADIO.loading && !st ? '<span class="mut">Carregando estações…</span>' : st ? `<b>${esc(st.name)}</b><small>${esc(st.tag || 'lo-fi')}${buf ? ' · conectando…' : on ? ' · ao vivo' : ''}</small>` : '<span class="mut">Nenhuma estação</span>';
  p.querySelector('[data-r=play]').innerHTML = ic(on ? 'pause' : 'play', 20);
  p.querySelector('.rart').classList.toggle('on', on);
  const er = p.querySelector('.rerr'); er.textContent = RADIO.err; er.hidden = !RADIO.err;
  p.querySelectorAll('.rst').forEach(r => r.classList.toggle('cur', +r.dataset.i === RADIO.i));
  const ls = p.querySelector('.rlist'); if (ls && ls.dataset.n !== String(RADIO.list.length)) { ls.dataset.n = RADIO.list.length; ls.innerHTML = RADIO.list.map((s, i) => `<button class="rst${i === RADIO.i ? ' cur' : ''}" data-i="${i}"><span class="f1">${esc(s.name)}</span><small>${esc(s.tag || '')}</small></button>`).join(''); }
}
function radioOpen(anchor) {
  if ($('#radiop')) { radioClose(); return; }
  radioLoad();
  const p = document.createElement('div'); p.id = 'radiop'; p.className = 'radiop'; p.setAttribute('role', 'dialog'); p.setAttribute('aria-label', 'Rádio lo-fi');
  const vol = Math.round(radioCfg().vol * 100);
  p.innerHTML = `<div class="rhead"><span class="rart"><span class="eq big"><i></i><i></i><i></i><i></i></span></span><div class="rnow f1"></div><button class="ib rx" data-r="close" aria-label="Fechar">${ic('x', 16)}</button></div>
    <p class="rerr" hidden></p>
    <div class="rctl"><button class="ib" data-r="prev" aria-label="Estação anterior" title="Anterior"><svg viewBox="0 0 24 24" width="20" height="20"><path d="M6 6v12M18 6l-9 6 9 6z" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/></svg></button><button class="rplay" data-r="play" aria-label="Tocar ou pausar"></button><button class="ib" data-r="next" aria-label="Próxima estação" title="Próxima"><svg viewBox="0 0 24 24" width="20" height="20"><path d="M18 6v12M6 6l9 6-9 6z" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/></svg></button></div>
    <div class="rvol"><button class="ib" data-r="mute" aria-label="Sem som">${ic('music', 16)}</button><input type="range" min="0" max="100" value="${vol}" aria-label="Volume"><span class="rvn">${vol}%</span></div>
    <p class="rlab">Estações</p><div class="rlist"></div>
    <p class="hint rsrc">Rádios lo-fi ao vivo do diretório Radio Browser.</p>`;
  document.body.appendChild(p);
  const r = anchor.getBoundingClientRect();
  p.style.top = Math.round(r.bottom + 8) + 'px'; p.style.right = Math.max(10, Math.round(innerWidth - r.right)) + 'px';
  p.addEventListener('click', e => {
    const b = e.target.closest('[data-r]'), s = e.target.closest('.rst');
    if (s) { RADIO.tries = 0; radioPlay(+s.dataset.i); return; }
    if (!b) return; const k = b.dataset.r;
    if (k === 'close') radioClose();
    if (k === 'play') { if (radioOn()) radioPause(); else { if (!RADIO.list.length) { radioLoad().then(() => radioPlay()); } else radioPlay(); } }
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
