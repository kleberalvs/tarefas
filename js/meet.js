/* Assistente de reuniões (Gemini): acompanha a agenda, grava a reunião, transcreve marcando quem falou,
   e no fim gera a ata com resumo, decisões, próximos passos e insights — salva como documento. */
'use strict';
const MT = { s: null, prompted: new Set() };
const MEET_SEG = 4 * 60 * 1000; /* cada trecho de 4 min é transcrito durante a reunião */
const meetKey = () => (aiCfg().key || '').trim();
async function gemini(parts, opts = {}) {
  const key = meetKey(); if (!key) throw new Error('Para o assistente de reuniões, coloque a chave gratuita do Google Gemini em Configurações → Assistente de IA.');
  const res = await gFetch('generateContent', { systemInstruction: opts.sys ? { parts: [{ text: opts.sys }] } : undefined, contents: [{ role: 'user', parts }], generationConfig: { temperature: opts.temp ?? .3 } }, opts.signal);
  const j = await res.json();
  return ((((j.candidates || [])[0] || {}).content || {}).parts || []).map(p => p.text || '').join('').trim();
}
/* áudio → WAV 16 kHz mono (formato que o Gemini sempre aceita) */
async function toWav(blob) {
  const buf = await blob.arrayBuffer();
  const ac = new (window.AudioContext || window.webkitAudioContext)();
  const audio = await new Promise((res, rej) => ac.decodeAudioData(buf, res, rej)); ac.close && ac.close();
  const rate = 16000, len = Math.ceil(audio.duration * rate);
  const off = new OfflineAudioContext(1, len, rate); const src = off.createBufferSource(); src.buffer = audio; src.connect(off.destination); src.start();
  const r = await off.startRendering(), d = r.getChannelData(0);
  const out = new DataView(new ArrayBuffer(44 + d.length * 2));
  const w = (o, s) => [...s].forEach((c, i) => out.setUint8(o + i, c.charCodeAt(0)));
  w(0, 'RIFF'); out.setUint32(4, 36 + d.length * 2, true); w(8, 'WAVE'); w(12, 'fmt '); out.setUint32(16, 16, true); out.setUint16(20, 1, true); out.setUint16(22, 1, true); out.setUint32(24, rate, true); out.setUint32(28, rate * 2, true); out.setUint16(32, 2, true); out.setUint16(34, 16, true); w(36, 'data'); out.setUint32(40, d.length * 2, true);
  for (let i = 0; i < d.length; i++) out.setInt16(44 + i * 2, Math.max(-1, Math.min(1, d[i])) * 0x7fff, true);
  return { blob: new Blob([out], { type: 'audio/wav' }), dur: audio.duration };
}
const b64 = blob => new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(String(r.result).split(',')[1]); r.onerror = rej; r.readAsDataURL(blob); });
/* ---------- tela de reuniões ---------- */
VIEWS.meet = main => {
  const T = today(), now = Date.now();
  const gok = typeof GC !== 'undefined' && (GC.ev.length || gOn());
  const evs = (gok ? GC.ev : []).filter(e => !e.allDay && dOnly(e.start) === T).sort((a, b) => a.start.localeCompare(b.start));
  const atas = db.d.filter(d => !d.del && d.meet).sort((a, b) => (b.c || 0) - (a.c || 0));
  const st = e => { const s = new Date(e.start.replace(' ', 'T')).getTime(), en = new Date((e.end || e.start).replace(' ', 'T')).getTime(); return now > en ? 'past' : now >= s - 5 * 60000 ? 'live' : 'next'; };
  main.innerHTML = headHtml('Reuniões', 'Atas automáticas com o Gemini', `<button class="btn red sm" data-act="meetnow">${ic('mic', 16)}<span>Iniciar agora</span></button>`) + `<div class="scroll"><div class="meetv">
    ${meetKey() ? '' : `<div class="mwarn">${ic('spark', 18)}<div><b>Falta só a chave gratuita do Gemini</b><p class="mut sm">O assistente de reuniões usa o Google Gemini para entender o áudio. Crie a chave em <a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener">aistudio.google.com/apikey</a> e cole em Configurações → Assistente de IA.</p></div><button class="btn sm" data-act="go" data-to="settings">Configurar</button></div>`}
    <section class="msec"><h3>Hoje na sua agenda</h3>
      ${gok ? (evs.length ? evs.map(e => `<div class="mev ${st(e)}"><div class="mt"><b>${tOnly(e.start)}</b><span>${tOnly(e.end) || ''}</span></div><div class="f1"><b>${esc(e.title)}</b><p class="mut sm">${(e.att || []).length ? esc(e.att.map(a => a.n).slice(0, 6).join(', ')) + (e.att.length > 6 ? ` +${e.att.length - 6}` : '') : 'Sem participantes listados'}</p></div>${st(e) === 'live' ? '<span class="mlive">agora</span>' : ''}${e.meet ? `<a class="ib" href="${esc(e.meet)}" target="_blank" rel="noopener" title="Entrar na chamada">${ic('link', 18)}</a>` : ''}<button class="btn ${st(e) === 'live' ? 'red' : 'ghost'} sm" data-act="meetev" data-id="${esc(e.id)}">${ic('mic', 15)}Gravar ata</button></div>`).join('') : '<p class="hint">Nenhuma reunião com horário hoje.</p>') : `<p class="hint">Conecte o Google Agenda (Configurações → Google) para eu acompanhar suas reuniões e avisar quando cada uma começar.</p>`}
    </section>
    <section class="msec"><h3>Atas</h3>${atas.length ? `<div class="dgrid docs-mini">${atas.map(docCard).join('')}</div>` : '<p class="hint">As atas que eu fizer aparecem aqui e também em Documentos → Atas de reunião.</p>'}</section>
    <p class="hint">Como funciona: eu ouço a reunião pelo microfone (no computador também dá para captar o som da aba da chamada), transcrevo a cada poucos minutos marcando quem falou e, ao encerrar, gero a ata com resumo, decisões, próximos passos e insights. Deixe o app aberto durante a reunião.</p>
  </div></div>`;
  loadCardImgs && loadCardImgs(main);
};
Object.assign(ACTS, {
  meetnow: () => meetStart(null),
  meetev: b => { const e = GC.ev.find(x => x.id === b.dataset.id); meetStart(e || null); },
});
/* avisa quando uma reunião da agenda começa */
setInterval(() => {
  if (typeof GC === 'undefined' || !GC.ev.length || MT.s) return;
  const now = Date.now();
  GC.ev.forEach(e => {
    if (e.allDay || MT.prompted.has(e.id)) return;
    const s = new Date(e.start.replace(' ', 'T')).getTime();
    if (now >= s - 60000 && now <= s + 5 * 60000) {
      MT.prompted.add(e.id);
      toast(`“${e.title}” está começando. Faço a ata?`, 'Gravar ata', () => meetStart(e), 15000);
      try { if (Notification.permission === 'granted' && document.hidden) new Notification('Reunião começando', { body: `${e.title} — abra o app para eu fazer a ata`, icon: 'assets/icon-192.png' }); } catch (er) {}
    }
  });
}, 30000);
/* ---------- gravação ---------- */
async function meetStart(ev) {
  if (MT.s) { toast('Já há uma reunião sendo gravada'); return; }
  if (!meetKey()) { toast('Coloque a chave gratuita do Gemini em Configurações → Assistente de IA'); go('settings'); return; }
  const me = (db.s.name || 'Eu').trim();
  const people = [...new Set([me, ...((ev && ev.att) || []).filter(a => !a.self).map(a => a.n)])];
  const canTab = !!(navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia) && !isMobile();
  const el = modal(`<div class="mstart"><h2>${ic('mic', 20)}${ev ? esc(ev.title) : 'Nova reunião'}</h2>
    <p class="mut sm">Vou gravar, transcrever com o nome de cada pessoa e, no fim, montar a ata.</p>
    <label class="mlabel">Título<input class="in" name="t" value="${esc(ev ? ev.title : 'Reunião ' + new Date().toLocaleDateString('pt-BR'))}"></label>
    <label class="mlabel">Participantes <span class="mut sm">(separe por vírgula — ajuda a reconhecer quem fala)</span><input class="in" name="p" value="${esc(people.join(', '))}"></label>
    <p class="mlabel">Ouvir de onde?</p>
    <div class="msrc"><label><input type="radio" name="src" value="mic" checked><span>${ic('mic', 18)}<b>Microfone</b><small>Reunião presencial ou chamada no viva-voz</small></span></label>
    ${canTab ? `<label><input type="radio" name="src" value="tab"><span>${ic('link', 18)}<b>Microfone + som da chamada</b><small>Para Meet/Zoom/Teams no navegador: escolha a aba e marque “compartilhar áudio”</small></span></label>` : ''}</div>
    <div class="row end"><button class="btn ghost" data-x>Cancelar</button><button class="btn red" data-go>${ic('mic', 16)}Começar a gravar</button></div></div>`, { cls: 'mmodal' });
  el.querySelector('[data-x]').onclick = () => closeModal();
  el.querySelector('[data-go]').onclick = async () => {
    const title = el.querySelector('[name=t]').value.trim() || 'Reunião', ppl = el.querySelector('[name=p]').value.split(',').map(s => s.trim()).filter(Boolean), src = (el.querySelector('[name=src]:checked') || {}).value || 'mic';
    closeModal(true);
    try { await meetRecord({ ev, title, ppl, src }); } catch (e) { toast(e.message || 'Não foi possível acessar o microfone'); meetCleanup(); }
  };
}
async function meetRecord(o) {
  const mic = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true } });
  const ac = new (window.AudioContext || window.webkitAudioContext)(), dest = ac.createMediaStreamDestination(), an = ac.createAnalyser(); an.fftSize = 512;
  const streams = [mic];
  ac.createMediaStreamSource(mic).connect(dest);
  if (o.src === 'tab') {
    try {
      const d = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
      d.getVideoTracks().forEach(t => t.stop());
      if (d.getAudioTracks().length) { ac.createMediaStreamSource(new MediaStream(d.getAudioTracks())).connect(dest); streams.push(d); }
      else toast('A aba foi escolhida sem áudio — vou usar só o microfone');
    } catch (e) { toast('Sem o som da aba — vou usar só o microfone'); }
  }
  ac.createMediaStreamSource(dest.stream).connect(an);
  const s = MT.s = { ...o, ac, an, streams, stream: dest.stream, t0: Date.now(), paused: 0, pauseAt: 0, segs: [], lines: [], pending: 0, rec: null, chunks: [], live: '', sr: null, wake: null };
  try { s.wake = await navigator.wakeLock.request('screen'); } catch (e) {}
  meetUI();
  meetSegStart();
  s.cut = setInterval(() => { if (!s.pauseAt) meetSegCut(); }, MEET_SEG);
  /* legenda ao vivo (não identifica pessoas; a transcrição com nomes vem do Gemini) */
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (SR) { try { const r = new SR(); r.lang = 'pt-BR'; r.continuous = true; r.interimResults = true; r.onresult = e => { let t = ''; for (let i = e.resultIndex; i < e.results.length; i++) t += e.results[i][0].transcript; s.live = t; const l = $('#mlive'); if (l) l.textContent = t; }; r.onend = () => { if (MT.s === s && !s.pauseAt && !s.ending) try { r.start(); } catch (er) {} }; r.start(); s.sr = r; } catch (e) {} }
}
function meetSegStart() {
  const s = MT.s; if (!s) return;
  const type = ['audio/webm;codecs=opus', 'audio/mp4', 'audio/webm'].find(t => window.MediaRecorder && MediaRecorder.isTypeSupported && MediaRecorder.isTypeSupported(t)) || '';
  const rec = new MediaRecorder(s.stream, Object.assign(type ? { mimeType: type } : {}, { audioBitsPerSecond: 32000 }));
  const chunks = [], t0 = Date.now() - s.t0;
  rec.ondataavailable = e => e.data.size && chunks.push(e.data);
  rec.onstop = () => { const blob = new Blob(chunks, { type: rec.mimeType || 'audio/webm' }); if (blob.size > 2000) meetTranscribe(blob, t0); };
  rec.start(1000); s.rec = rec;
}
function meetSegCut() { const s = MT.s; if (!s || !s.rec) return; if (s.rec.state !== 'inactive') s.rec.stop(); if (!s.ending) meetSegStart(); }
const fmtT = ms => { const x = Math.floor(ms / 1000); return (x >= 3600 ? Math.floor(x / 3600) + ':' : '') + String(Math.floor(x / 60) % 60).padStart(2, '0') + ':' + String(x % 60).padStart(2, '0'); };
async function meetTranscribe(blob, t0) {
  const s = MT.s; if (!s) return;
  const idx = s.segs.length; s.segs.push({ t0, blob, text: null }); s.pending++; meetDraw();
  try {
    const wav = await toWav(blob);
    const prev = s.lines.slice(-8).map(l => `${l.who}: ${l.txt}`).join('\n');
    const prompt = `Transcreva este trecho de uma reunião em português do Brasil.
Participantes conhecidos: ${s.ppl.join(', ') || '(não informados)'}.
Regras:
- Uma fala por linha, no formato "Nome: texto".
- Identifique quem fala pela voz e pelo contexto (ex.: quando alguém é chamado pelo nome). Use os nomes da lista quando tiver segurança; se não, use "Participante 1", "Participante 2"… e mantenha o mesmo rótulo para a mesma voz.
- Mantenha os mesmos nomes/rótulos usados no trecho anterior para as mesmas vozes.
- Não invente falas; ignore silêncio e ruído. Se não houver fala, responda apenas: (sem fala)
${prev ? `Trecho anterior (para manter os nomes):\n${prev}` : ''}`;
    const txt = await gemini([{ text: prompt }, { inline_data: { mime_type: 'audio/wav', data: await b64(wav.blob) } }], { temp: .1 });
    s.segs[idx].text = txt;
    if (!/^\(sem fala\)/i.test(txt)) txt.split('\n').map(l => l.trim()).filter(Boolean).forEach(l => { const m = l.match(/^\**([^:*]{1,40})\**\s*:\s*(.+)$/); s.lines.push(m ? { who: m[1].trim(), txt: m[2].trim(), t: t0 } : { who: '', txt: l, t: t0 }); });
  } catch (e) { s.segs[idx].err = e.message || 'falhou'; toast('Transcrição: ' + (e.message || 'falhou')); }
  s.pending--; meetDraw();
  if (s.ending && !s.pending) meetFinish();
}
/* ---------- interface durante a reunião ---------- */
function meetUI() {
  const s = MT.s;
  const el = document.createElement('div'); el.className = 'mrec'; el.id = 'mrec';
  el.innerHTML = `<div class="mrbar"><span class="mrdot"></span><div class="f1"><b>${esc(s.title)}</b><span class="mut sm" id="mstat">Gravando…</span></div><b class="mtime" id="mtime">00:00</b>
    <button class="ib" data-m="min" title="Minimizar">${ic('down', 20)}</button></div>
    <canvas class="mwave" id="mwave" width="600" height="60"></canvas>
    <div class="mppl">${s.ppl.map(p => `<span>${esc(p)}</span>`).join('')}</div>
    <div class="mtx" id="mtx"></div>
    <p class="mcap mut sm" id="mlive"></p>
    <div class="mrfoot"><button class="btn ghost" data-m="pause">${ic('pause', 16)}<span>Pausar</span></button><button class="btn ghost" data-m="mark">${ic('flag', 16)}Marcar momento</button><span class="f1"></span><button class="btn ghost" data-m="cancel">Descartar</button><button class="btn red" data-m="end">${ic('check', 16)}Encerrar e gerar ata</button></div>
    <button class="mpill" data-m="max"><span class="mrdot"></span><b id="mtime2">00:00</b> Gravando reunião</button>`;
  document.body.appendChild(el); requestAnimationFrame(() => el.classList.add('on'));
  el.addEventListener('click', async e => {
    const b = e.target.closest('[data-m]'); if (!b) return; const a = b.dataset.m;
    if (a === 'min') el.classList.add('mini'); if (a === 'max') el.classList.remove('mini');
    if (a === 'pause') { if (s.pauseAt) { s.paused += Date.now() - s.pauseAt; s.pauseAt = 0; s.rec && s.rec.state === 'paused' && s.rec.resume(); try { s.sr && s.sr.start(); } catch (er) {} } else { s.pauseAt = Date.now(); s.rec && s.rec.state === 'recording' && s.rec.pause(); try { s.sr && s.sr.stop(); } catch (er) {} } meetDraw(); }
    if (a === 'mark') { s.lines.push({ who: '📌', txt: 'Momento marcado', t: Date.now() - s.t0 - s.paused, mark: 1 }); toast('Momento marcado'); meetDraw(); }
    if (a === 'cancel') { if (await confirmBox('Descartar esta gravação?', 'Nada será salvo.', 'Descartar')) meetCleanup(); }
    if (a === 'end') meetEnd();
  });
  const tick = () => {
    if (MT.s !== s) return;
    const el2 = $('#mtime'), ms = (s.pauseAt || Date.now()) - s.t0 - s.paused; if (el2) { el2.textContent = fmtT(ms); $('#mtime2').textContent = fmtT(ms); }
    const cv = $('#mwave'); if (cv) { const c = cv.getContext('2d'), d = new Uint8Array(s.an.frequencyBinCount); s.an.getByteTimeDomainData(d); c.clearRect(0, 0, 600, 60); c.strokeStyle = s.pauseAt ? '#999' : '#F0455A'; c.lineWidth = 2.5; c.lineCap = 'round'; c.beginPath(); for (let i = 0; i < 60; i++) { const v = Math.abs(d[Math.floor(i * d.length / 60)] - 128) / 128, h = 4 + v * 110; c.moveTo(i * 10 + 5, 30 - h / 2); c.lineTo(i * 10 + 5, 30 + h / 2); } c.stroke(); }
    requestAnimationFrame(tick);
  };
  tick(); meetDraw();
}
const MCOL = ['#E8455A', '#2F80ED', '#27AE60', '#F2994A', '#9B51E0', '#00A3A3', '#C0392B', '#8E6E53'];
function meetDraw() {
  const s = MT.s; if (!s) return;
  const who = [...new Set(s.lines.map(l => l.who).filter(Boolean))];
  const box = $('#mtx'); if (!box) return;
  const near = box.scrollHeight - box.scrollTop - box.clientHeight < 60;
  box.innerHTML = s.lines.length ? s.lines.map(l => l.mark ? `<p class="mmark">📌 ${fmtT(l.t)} — momento marcado</p>` : `<p><b style="color:${MCOL[who.indexOf(l.who) % MCOL.length]}">${esc(l.who || '—')}</b> ${esc(l.txt)}</p>`).join('') : `<p class="mut">A transcrição com o nome de quem falou aparece aqui a cada ${MEET_SEG / 60000} minutos. Enquanto isso, a legenda ao vivo fica logo abaixo.</p>`;
  if (near) box.scrollTop = box.scrollHeight;
  const st = $('#mstat'); if (st) st.textContent = s.ending ? `Gerando a ata… (${s.pending} trecho(s) em transcrição)` : s.pauseAt ? 'Pausado' : s.pending ? `Gravando · transcrevendo ${s.pending} trecho(s)…` : 'Gravando…';
  const pb = $('#mrec [data-m=pause] span'); if (pb) pb.textContent = s.pauseAt ? 'Continuar' : 'Pausar';
  $('#mrec') && $('#mrec').classList.toggle('paused', !!s.pauseAt);
}
function meetEnd() {
  const s = MT.s; if (!s || s.ending) return;
  s.ending = true; clearInterval(s.cut);
  try { s.sr && s.sr.stop(); } catch (e) {}
  if (s.rec && s.rec.state !== 'inactive') s.rec.stop();
  s.streams.forEach(st => st.getTracks().forEach(t => t.stop()));
  meetDraw();
  setTimeout(() => { if (MT.s === s && !s.pending) meetFinish(); }, 600);
}
function meetCleanup() {
  const s = MT.s; if (!s) { const e = $('#mrec'); e && e.remove(); return; }
  clearInterval(s.cut); try { s.sr && s.sr.stop(); } catch (e) {}
  try { if (s.rec && s.rec.state !== 'inactive') { s.rec.onstop = null; s.rec.stop(); } } catch (e) {}
  s.streams.forEach(st => st.getTracks().forEach(t => t.stop())); try { s.ac.close(); } catch (e) {}
  try { s.wake && s.wake.release(); } catch (e) {}
  MT.s = null; const el = $('#mrec'); if (el) { el.classList.remove('on'); setTimeout(() => el.remove(), 250); }
}
async function meetFinish() {
  const s = MT.s; if (!s || s.finishing) return; s.finishing = true;
  const transcript = s.lines.filter(l => !l.mark).map(l => `[${fmtT(l.t)}] ${l.who ? l.who + ': ' : ''}${l.txt}`).join('\n');
  const marks = s.lines.filter(l => l.mark).map(l => fmtT(l.t)).join(', ');
  const st = $('#mstat'); if (st) st.textContent = 'Escrevendo a ata com o Gemini…';
  let ata = '';
  if (transcript.trim()) {
    try {
      ata = await gemini([{ text: `Você é um secretário executivo. Com base na transcrição abaixo, escreva a ATA da reunião em português do Brasil, em Markdown, com estas seções (use "## " nos títulos):
## Resumo — 3 a 6 frases.
## Participantes — lista "- Nome" (use os nomes que aparecem; se houver "Participante N", mantenha).
## Principais pontos — lista com o que foi discutido, indicando quem levantou cada ponto.
## Decisões — lista.
## Próximos passos — lista no formato "- [ ] Responsável: ação (prazo, se citado)".
## Insights — 3 a 5 observações úteis: riscos, oportunidades, pontos sem dono, divergências, sugestões para a próxima reunião.
## Perguntas em aberto — lista (se houver).
Seja fiel à transcrição; não invente fatos.
Reunião: ${s.title}. Participantes informados: ${s.ppl.join(', ')}. ${marks ? 'Momentos marcados pelo usuário: ' + marks + '.' : ''}

TRANSCRIÇÃO:
${transcript.slice(0, 900000)}` }], { temp: .3 });
    } catch (e) { toast('Ata: ' + (e.message || 'falhou')); }
  }
  meetSave(s, ata, transcript);
  meetCleanup();
}
function meetSave(s, ata, transcript) {
  let fol = db.f.find(f => f.kind === 'd' && f.name === 'Atas de reunião');
  if (!fol) { fol = { id: uid(), kind: 'd', name: 'Atas de reunião', emoji: '🎙️', par: null, o: Date.now() }; put('f', fol); }
  const when = new Date(s.t0), dur = fmtT(Date.now() - s.t0 - s.paused);
  const parsed = ata ? mdToDoc(ata) : { b: [] };
  const b = [{ id: uid(), type: 'callout', emoji: '🗓️', bg: 'blue', text: `${esc(when.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' }))} · ${when.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })} · duração ${dur}` }];
  if (parsed.title) b.push({ id: uid(), type: 'h2', text: esc(parsed.title) });
  b.push(...parsed.b.filter(x => x.type !== 'p' || x.text));
  if (!ata) b.push({ id: uid(), type: 'p', text: transcript ? 'Não consegui gerar o resumo agora. A transcrição completa está abaixo.' : 'Não houve fala transcrita nesta gravação.' });
  if (transcript) {
    b.push({ id: uid(), type: 'hr', text: '' }, { id: uid(), type: 'toggle', open: false, text: '<b>Transcrição completa</b>' });
    s.lines.filter(l => !l.mark).forEach(l => b.push({ id: uid(), type: 'p', lvl: 1, text: `<span style="color:var(--mut)">${fmtT(l.t)}</span> ${l.who ? `<b>${esc(l.who)}:</b> ` : ''}${esc(l.txt)}` }));
  }
  const d = newDoc({ title: 'Ata — ' + s.title, icon: '🎙️', folder: fol.id, o: Date.now(), meet: { ev: s.ev ? s.ev.id : null, at: s.t0, ppl: s.ppl }, b });
  d.style.th = 'classico-0-0'; put('d', d);
  const todos = b.filter(x => x.type === 'todo');
  toast('Ata pronta ✨', todos.length ? `Criar ${todos.length} tarefa(s)` : null, todos.length ? () => { todos.forEach(x => { const t = stripHtml(x.text); put('t', { id: uid(), title: t, list: db.s.defList || 'inbox', c: Date.now(), o: Date.now(), notes: `Da reunião: ${s.title}`, ln: { d: [d.id], t: [] } }); }); toast(`${todos.length} tarefa(s) criada(s)`); } : null, 12000);
  go('doc/' + d.id);
}
