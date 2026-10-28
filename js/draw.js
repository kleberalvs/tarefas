/* Escrita à mão: tela para escrever ou desenhar com caneta (Apple Pencil, S Pen), dedo ou mouse. Salva como imagem. */
'use strict';
function openDraw(onSave, opts = {}) {
  const COLS = ['#1F1B1B', '#2563EB', '#DC2626', '#16A34A', '#9333EA', '#EA580C', '#FFFFFF'];
  const st = { col: COLS[0], w: 3, tool: 'pen', paper: opts.paper || 'pautado', strokes: [], redo: [], cur: null, penOnly: false };
  const el = document.createElement('div'); el.className = 'draw';
  el.innerHTML = `<div class="dwbar">
      <button class="ib" data-dw="x" aria-label="Cancelar">${ic('x', 20)}</button>
      <div class="dwtools">
        <button class="dwt on" data-tool="pen" title="Caneta">${ic('pen', 19)}</button>
        <button class="dwt" data-tool="mark" title="Marca-texto">${ic('mark', 19)}</button>
        <button class="dwt" data-tool="erase" title="Borracha">${ic('eraser', 19)}</button>
        <i class="tsep"></i>
        ${COLS.map((c, i) => `<button class="dwc${i ? '' : ' on'}" data-col="${c}" style="--c:${c}" aria-label="Cor"></button>`).join('')}
        <i class="tsep"></i>
        ${[2, 3.5, 6, 10].map((w, i) => `<button class="dws${i === 1 ? ' on' : ''}" data-w="${w}" aria-label="Espessura"><i style="width:${w + 2}px;height:${w + 2}px"></i></button>`).join('')}
        <i class="tsep"></i>
        <button class="ib" data-dw="undo" title="Desfazer">${ic('undo', 19)}</button>
        <button class="ib" data-dw="redo" title="Refazer">${ic('redo', 19)}</button>
        <button class="ib" data-dw="paper" title="Papel">${ic('doc', 19)}</button>
        <button class="ib" data-dw="clear" title="Limpar">${ic('trash', 19)}</button>
      </div>
      <button class="btn red sm" data-dw="ok">Salvar</button>
    </div>
    <div class="dwstage"><canvas></canvas></div>
    <p class="dwhint">Escreva com a caneta, o dedo ou o mouse. Com caneta, o toque da mão é ignorado.</p>`;
  document.body.appendChild(el); requestAnimationFrame(() => el.classList.add('on'));
  const cv = el.querySelector('canvas'), stage = el.querySelector('.dwstage'), c = cv.getContext('2d');
  let W = 0, H = 0, dpr = 1;
  const size = () => { const r = stage.getBoundingClientRect(); dpr = Math.min(3, devicePixelRatio || 1); W = r.width; H = r.height; cv.width = W * dpr; cv.height = H * dpr; cv.style.width = W + 'px'; cv.style.height = H + 'px'; redraw(); };
  const paper = (ctx, w, h) => {
    ctx.fillStyle = '#FFFDF8'; ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = 'rgba(70,110,200,.18)'; ctx.lineWidth = 1;
    if (st.paper === 'pautado') for (let y = 40; y < h; y += 32) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke(); }
    if (st.paper === 'quadriculado') { for (let y = 24; y < h; y += 24) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke(); } for (let x = 24; x < w; x += 24) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke(); } }
    if (st.paper === 'pontilhado') { ctx.fillStyle = 'rgba(70,90,140,.28)'; for (let y = 24; y < h; y += 24) for (let x = 24; x < w; x += 24) { ctx.beginPath(); ctx.arc(x, y, 1.1, 0, 7); ctx.fill(); } }
  };
  const drawStroke = (ctx, s) => {
    const p = s.p; if (!p.length) return;
    ctx.save(); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    if (s.tool === 'erase') ctx.globalCompositeOperation = 'destination-out';
    ctx.strokeStyle = s.tool === 'mark' ? s.col + '55' : s.col; ctx.fillStyle = ctx.strokeStyle;
    if (p.length === 1) { ctx.beginPath(); ctx.arc(p[0][0], p[0][1], s.w * (p[0][2] || .5) * (s.tool === 'mark' ? 3 : 1), 0, 7); ctx.fill(); ctx.restore(); return; }
    for (let i = 1; i < p.length; i++) {
      const a = p[i - 1], b = p[i], m0 = i > 1 ? [(p[i - 2][0] + a[0]) / 2, (p[i - 2][1] + a[1]) / 2] : a, m1 = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
      ctx.lineWidth = s.tool === 'mark' ? s.w * 3.2 : s.tool === 'erase' ? s.w * 4 : Math.max(.6, s.w * (.35 + (b[2] || .5) * 1.3));
      ctx.beginPath(); ctx.moveTo(m0[0], m0[1]); ctx.quadraticCurveTo(a[0], a[1], m1[0], m1[1]); ctx.stroke();
    }
    ctx.restore();
  };
  const ink = document.createElement('canvas');
  const redraw = () => {
    ink.width = cv.width; ink.height = cv.height; const ic2 = ink.getContext('2d'); ic2.setTransform(dpr, 0, 0, dpr, 0, 0);
    st.strokes.forEach(s => drawStroke(ic2, s)); if (st.cur) drawStroke(ic2, st.cur);
    c.setTransform(1, 0, 0, 1, 0, 0); c.clearRect(0, 0, cv.width, cv.height); c.setTransform(dpr, 0, 0, dpr, 0, 0); paper(c, W, H); c.setTransform(1, 0, 0, 1, 0, 0); c.drawImage(ink, 0, 0);
  };
  let raf = 0; const later = () => { if (!raf) raf = requestAnimationFrame(() => { raf = 0; redraw(); }); };
  const pt = e => { const r = cv.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top, e.pointerType === 'pen' ? (e.pressure || .5) : .5]; };
  cv.addEventListener('pointerdown', e => {
    if (e.pointerType === 'pen') st.penOnly = true;
    if (st.penOnly && e.pointerType === 'touch') return;
    e.preventDefault(); cv.setPointerCapture(e.pointerId);
    st.cur = { tool: st.tool, col: st.col, w: st.w, p: [pt(e)], id: e.pointerId }; st.redo = []; later();
  });
  cv.addEventListener('pointermove', e => {
    if (!st.cur || st.cur.id !== e.pointerId) return;
    const evs = e.getCoalescedEvents ? e.getCoalescedEvents() : [e];
    evs.forEach(ev => st.cur.p.push(pt(ev))); later();
  });
  const end = e => { if (!st.cur || st.cur.id !== e.pointerId) return; st.strokes.push(st.cur); st.cur = null; later(); };
  cv.addEventListener('pointerup', end); cv.addEventListener('pointercancel', end);
  cv.addEventListener('touchmove', e => e.preventDefault(), { passive: false });
  const close = () => { el.classList.remove('on'); removeEventListener('resize', size); setTimeout(() => el.remove(), 220); };
  el.addEventListener('click', async e => {
    const t = e.target.closest('[data-tool]'), col = e.target.closest('[data-col]'), w = e.target.closest('[data-w]'), b = e.target.closest('[data-dw]');
    if (t) { st.tool = t.dataset.tool; el.querySelectorAll('[data-tool]').forEach(x => x.classList.toggle('on', x === t)); }
    if (col) { st.col = col.dataset.col; if (st.tool === 'erase') { st.tool = 'pen'; el.querySelectorAll('[data-tool]').forEach(x => x.classList.toggle('on', x.dataset.tool === 'pen')); } el.querySelectorAll('[data-col]').forEach(x => x.classList.toggle('on', x === col)); }
    if (w) { st.w = +w.dataset.w; el.querySelectorAll('[data-w]').forEach(x => x.classList.toggle('on', x === w)); }
    if (!b) return;
    const a = b.dataset.dw;
    if (a === 'x') { if (st.strokes.length && !(await confirmBox('Descartar a escrita?', '', 'Descartar'))) return; close(); }
    if (a === 'undo' && st.strokes.length) { st.redo.push(st.strokes.pop()); redraw(); }
    if (a === 'redo' && st.redo.length) { st.strokes.push(st.redo.pop()); redraw(); }
    if (a === 'clear' && st.strokes.length) { st.redo = st.strokes.slice().reverse(); st.strokes = []; redraw(); }
    if (a === 'paper') menu(b, [['pautado', 'Pautado'], ['quadriculado', 'Quadriculado'], ['pontilhado', 'Pontilhado'], ['liso', 'Liso']].map(([k, n]) => ({ label: n, on: st.paper === k, act: () => { st.paper = k; redraw(); } })));
    if (a === 'ok') {
      if (!st.strokes.length) { close(); return; }
      /* recorta só a área usada (com margem) */
      let x0 = 1e9, y0 = 1e9, x1 = 0, y1 = 0; st.strokes.forEach(s => s.p.forEach(([x, y]) => { x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); }));
      const pad = 24; x0 = Math.max(0, x0 - pad); y0 = Math.max(0, y0 - pad); x1 = Math.min(W, x1 + pad); y1 = Math.min(H, y1 + pad);
      if (opts.full) { x0 = 0; y0 = 0; x1 = W; y1 = H; }
      const out = document.createElement('canvas'), k = 2; out.width = (x1 - x0) * k; out.height = (y1 - y0) * k;
      const o = out.getContext('2d'); o.setTransform(k, 0, 0, k, -x0 * k, -y0 * k); paper(o, W, H); const tmp = document.createElement('canvas'); tmp.width = W * k; tmp.height = H * k; const t2 = tmp.getContext('2d'); t2.setTransform(k, 0, 0, k, 0, 0); st.strokes.forEach(s => drawStroke(t2, s)); o.setTransform(1, 0, 0, 1, 0, 0); o.drawImage(tmp, x0 * k, y0 * k, (x1 - x0) * k, (y1 - y0) * k, 0, 0, out.width, out.height);
      out.toBlob(async blob => { const f = new File([blob], `Escrita ${new Date().toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }).replace(/[/:]/g, '-')}.png`, { type: 'image/png' }); close(); try { await onSave(f); } catch (er) { toast(er.message || 'Não foi possível salvar'); } }, 'image/png');
    }
  });
  addEventListener('resize', size); setTimeout(size, 30);
}
