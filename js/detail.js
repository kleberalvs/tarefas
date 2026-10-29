/* Detalhe da tarefa: título, descrição, itens, subtarefas, início e fim, prioridade, anexos e vínculos. */
'use strict';
function openTask(id) {
  if (!get('t', id)) return;
  const was = R.sel;
  R.sel = id;
  if (isMobile() && !was) history.pushState({ sel: id }, '');
  render(true);
  setTimeout(() => { const d = $('#detail .dscroll'); if (d) d.scrollTop = 0; }, 0);
}
function closeTask() {
  if (!R.sel) return;
  if (history.state && history.state.sel) { history.back(); return; }
  R.sel = null; render(true);
}
addEventListener('popstate', () => { if (R.sel && !(history.state && history.state.sel)) { R.sel = null; render(true); } });

const REM_OPTS = [[0, 'Na hora'], [5, '5 min antes'], [15, '15 min antes'], [30, '30 min antes'], [60, '1 hora antes'], [120, '2 horas antes'], [1440, '1 dia antes']];
const DET_OPEN = new Set();
function renderDetail(det) {
  const t = R.sel && get('t', R.sel);
  if (!t) { det.innerHTML = ''; det.dataset.id = ''; return; }
  const l = listOf(t), secs = l.sec || [];
  const subs = subsOf(t.id).sort((a, b) => (a.o || 0) - (b.o || 0));
  const chk = t.chk || [];
  const sD = t.start ? dOnly(t.start) : '', sT = tOnly(t.start), eD = t.due ? dOnly(t.due) : '', eT = tOnly(t.due);
  const focusMin = db.p.filter(p => p.task === t.id).reduce((s, p) => s + (p.dur || 0), 0);
  const back = db.t.filter(x => x.id !== t.id && !x.del && x.ln && x.ln.t.includes(t.id));
  const docRefs = db.d.filter(d => !d.del && (d.b || []).some(b => (b.ref === t.id) || (b.text && b.text.includes('data-ref="' + t.id + '"'))));
  const ln = t.ln || { d: [], t: [] };
  det.dataset.id = t.id;
  const op = k => DET_OPEN.has(t.id + ':' + k);
  const dLabel = (d, tm) => d ? `${cap(fmtDay(d, true))}${tm ? ', ' + tm : ''}` : '';
  const when = eD ? dLabel(eD, eT) : sD ? 'Início: ' + dLabel(sD, sT) : '';
  const remTxt = (t.rem || []).length ? (REM_OPTS.find(o => o[0] === t.rem[0]) || [0, fmtDur(t.rem[0]) + ' antes'])[1] : '';
  const tagsH = (t.tags || []).map(g => { const x = get('g', g); return x ? `<span class="ptag" style="--c:${esc(x.color)}">${x.emoji ? esc(x.emoji) + ' ' : '#'}${esc(x.name)}<button data-act="duntag" data-g="${g}" aria-label="Remover etiqueta ${esc(x.name)}">${ic('x', 11)}</button></span>` : ''; }).join('');
  const showChk = chk.length || op('chk'), showSubs = !t.par && (subs.length || op('subs')), showAtt = (t.att || []).length || op('att');
  const showLn = ln.d.length || ln.t.length || back.length || docRefs.length || op('ln'), showCm = (t.cm || []).length || op('cm');
  det.innerHTML = `<div class="dwrap dclean${t.note ? ' isnote' : ''}">
  <header class="dtop">
    <button class="ib show-m" data-act="dclose" aria-label="Voltar">${ic('left')}</button>
    ${t.note ? `<span class="notemark big" title="Anotação">${ic('doc', 18)}</span>` : `<button class="chk sq p${t.prio || 0}${t.done ? ' on' : ''}" data-act="dcheck" role="checkbox" aria-checked="${t.done}" aria-label="${t.done ? 'Reabrir' : 'Concluir'} tarefa"><span>${ic('check', 13)}</span></button>`}
    <i class="dvsep"></i>
    <button class="ddate${overdue(t) ? ' red' : ''}${when ? ' set' : ''}" data-act="dpdue">${ic('cal', 17)}<span>${when ? esc(when) : 'Dia do vencimento'}</span>${t.rep ? ic('repeat', 14) : ''}${remTxt ? ic('bell', 14) : ''}</button>
    ${eD ? `<button class="pclr" data-act="pclr" data-k="due" aria-label="Limpar data">${ic('x', 12)}</button>` : ''}
    <span class="sp"></span>
    <button class="ib" data-act="dprio" aria-label="Prioridade" title="Prioridade" style="color:${t.prio ? PRIO[t.prio].c : 'var(--mut)'}">${ic('flag', 19)}</button>
    <button class="ib hide-m" data-act="dclose" aria-label="Fechar">${ic('x', 19)}</button>
  </header>
  <div class="dscroll">
    ${t.cover ? `<div class="tcover"><img alt="Capa da tarefa" data-act="covopen" data-timg="${esc(t.cover.id)}" data-tid="${t.id}"><div class="tcbtns"><label class="btn ghost sm">${ic('img', 16)}Trocar<input type="file" accept="image/*" hidden data-f="cover"></label><button class="btn ghost sm" data-act="tcovrm">Remover</button></div></div>` : ''}
    ${t.par ? `<button class="link dparent" data-act="topen" data-id="${t.par}">${ic('left', 14)} ${esc((get('t', t.par) || {}).title || 'Tarefa principal')}</button>` : ''}
    <div class="dtrow"><textarea class="dtitle" data-keep rows="1" placeholder="Título" aria-label="Título">${esc(t.title)}</textarea><button class="ib dtchk" data-act="dopen" data-k="chk" title="Lista de itens" aria-label="Adicionar lista de itens">${ic('ul', 18)}</button></div>
    <div class="dtlinks">${linkChips(findLinks(t.title))}</div>
    ${tagsH || t.rep || remTxt || sD && eD ? `<div class="dchips">${tagsH}${t.rep ? `<button class="dchip" data-act="drep">${ic('repeat', 13)}${esc(repText(t.rep))}</button>` : ''}${remTxt ? `<button class="dchip" data-act="drem">${ic('bell', 13)}${esc(remTxt)}</button>` : ''}${sD && eD ? `<button class="dchip" data-act="dpstart">${ic('startd', 13)}Início: ${esc(dLabel(sD, sT))}</button>` : ''}</div>` : ''}
    <div class="dnotes rich" data-keep contenteditable="true" data-ph="Digite o conteúdo…" aria-label="Conteúdo">${linkifyHtml(clean(t.notes))}</div>

    ${showChk ? `<section class="dsec"><h3>${ic('todo', 16)}Itens <span class="cnt">${chk.length ? chk.filter(c => c.done).length + '/' + chk.length : ''}</span></h3>
      ${chk.length ? `<div class="prog"><span style="width:${Math.round(chk.filter(c => c.done).length / chk.length * 100)}%"></span></div>` : ''}
      <div class="chklist">${chk.map((c, i) => `<div class="ck${c.done ? ' done' : ''}" data-drag="ck:${t.id}:${c.id}" data-drop="ck:${c.id}"><button class="cbox${c.done ? ' on' : ''}" data-act="ckt" data-i="${i}" role="checkbox" aria-checked="${c.done}" aria-label="Item ${esc(c.t)}">${ic('check', 12)}</button><input class="ckin" data-keep data-i="${i}" value="${esc(c.t)}" aria-label="Texto do item"><button class="mini" data-act="ckdel" data-i="${i}" aria-label="Remover item">${ic('x', 14)}</button></div>`).join('')}</div>
      <div class="addline" data-keep>${ic('plus', 16)}<input class="ckadd" placeholder="Adicionar item" aria-label="Adicionar item"></div>
    </section>` : ''}

    ${showSubs ? `<section class="dsec"><h3>${ic('sub', 16)}Subtarefas <span class="cnt">${subs.length ? subs.filter(s => s.done).length + '/' + subs.length : ''}</span></h3>
      <div class="subl">${subs.map(s => rowHtml(s, { lvl: 0, withDone: 1 })).join('')}</div>
      <div class="addline addsub" data-keep>${ic('plus', 16)}<input placeholder="Adicionar subtarefa" aria-label="Adicionar subtarefa"></div>
    </section>` : ''}

    ${showAtt ? `<section class="dsec"><h3>${ic('clip', 16)}Anexos <span class="cnt">${(t.att || []).length || ''}</span></h3>
      <div class="atts">${(t.att || []).map((m, i) => `<div class="att"><button class="attm" data-act="aopen" data-i="${i}">${ic(fileIcon(m), 22)}<span class="an">${esc(m.name)}</span><span class="mut sm">${fmtSize(m.size)}${m.pending ? ' · só neste aparelho' : ''}</span></button><button class="mini" data-act="adel" data-i="${i}" aria-label="Remover anexo">${ic('trash', 16)}</button></div>`).join('')}</div>
      <label class="btn ghost sm filebtn">${ic('up', 16)}Anexar arquivos<input type="file" multiple hidden data-f="files"></label>
    </section>` : `<input type="file" multiple hidden data-f="files" id="dfiles">`}
    ${t.cover ? '' : `<input type="file" accept="image/*" hidden data-f="cover" id="dcover">`}

    ${showLn ? `<section class="dsec"><h3>${ic('link', 16)}Vínculos</h3>
      <div class="links">
        ${ln.d.map(id => { const d = get('d', id); return d ? `<div class="lnk"><a href="#/doc/${d.id}" class="lnkm"><span class="dicon">${esc(d.icon || '📄')}</span><span>${esc(d.title || 'Sem título')}</span></a><button class="mini" data-act="unlink" data-k="d" data-id="${id}" aria-label="Desvincular">${ic('x', 14)}</button></div>` : ''; }).join('')}
        ${ln.t.map(id => { const x = get('t', id); return x ? `<div class="lnk"><button class="lnkm" data-act="topen" data-id="${x.id}"><span class="chk sm p${x.prio || 0}${x.done ? ' on' : ''}"><span>${ic('check', 10)}</span></span><span>${esc(x.title)}</span>${x.due ? `<span class="mut sm">${esc(fmtWhen(x.due))}</span>` : ''}</button><button class="mini" data-act="unlink" data-k="t" data-id="${id}" aria-label="Desvincular">${ic('x', 14)}</button></div>` : ''; }).join('')}
        ${back.map(x => `<div class="lnk back"><button class="lnkm" data-act="topen" data-id="${x.id}">${ic('link', 14)}<span>${esc(x.title)}</span><span class="mut sm">vinculou esta</span></button></div>`).join('')}
        ${docRefs.map(d => `<div class="lnk back"><a class="lnkm" href="#/doc/${d.id}"><span class="dicon">${esc(d.icon || '📄')}</span><span>${esc(d.title || 'Sem título')}</span><span class="mut sm">menciona esta tarefa</span></a></div>`).join('')}
      </div>
      <div class="row"><button class="btn ghost sm" data-act="link" data-k="d">${ic('doc', 16)}Vincular documento</button><button class="btn ghost sm" data-act="link" data-k="t">${ic('todo', 16)}Vincular tarefa</button><button class="btn ghost sm" data-act="newdocfor">${ic('plus', 16)}Novo documento</button></div>
    </section>` : ''}

    ${showCm ? `<section class="dsec dcms"><h3>${ic('chat', 16)}Comentários <span class="cnt">${(t.cm || []).length || ''}</span></h3>
      <div class="cms">${cmList(t)}</div>
      <form class="cmform"><span class="cmav">${esc(cmInitial())}</span><div class="cmbox"><textarea class="in cmin" rows="1" placeholder="Escreva um comentário…" maxlength="4000"></textarea><div class="cmbar"><span class="hint">${isMobile() ? '' : 'Ctrl + Enter para enviar'}</span><button class="btn red sm" type="submit" disabled>${ic('send', 15)}Comentar</button></div></div></form>
    </section>` : ''}
  </div>
  <footer class="dbot">
    <button class="dlistb" data-act="dlist" title="Mover para outra lista">${l.emoji ? `<span class="nemo">${esc(l.emoji)}</span>` : `<span class="ldot" style="background:${esc(l.color || '#808080')}"></span>`}<span>${esc(l.name)}${t.sec && secs.find(s => s.id === t.sec) ? ' / ' + esc(secs.find(s => s.id === t.sec).name) : ''}</span></button>
    <span class="sp"></span>
    ${focusMin ? `<span class="mut sm dfmin" title="Tempo de foco">${ic('focus', 14)}${fmtDur(focusMin)}</span>` : ''}
    <button class="ib" data-act="dfocus" title="Iniciar foco" aria-label="Iniciar foco">${ic('focus', 18)}</button>
    <button class="ib" data-act="dopen" data-k="cm" title="Comentários" aria-label="Comentários">${ic('chat', 18)}${(t.cm || []).length ? `<i class="dbadge">${t.cm.length}</i>` : ''}</button>
    <button class="ib" data-act="dmore2" title="Mais opções" aria-label="Mais opções">${ic('more', 18)}</button>
  </footer></div>`;
  bindDetail(det, t);
  bindComments(det, t);
  loadTaskImgs(det);
}
/* comentários */
function cmInitial() { return ((db.s.name || 'Você').trim()[0] || 'V').toUpperCase(); }
function cmText(s) { return linkifyText(s).replace(/\n/g, '<br>'); }
function cmWhen(at) {
  const d = new Date(at), m = Math.round((Date.now() - at) / 60000);
  if (m < 1) return 'agora'; if (m < 60) return `há ${m} min`;
  const k = ymd(d); if (k === today()) return 'hoje às ' + hm(d); if (k === addD(today(), -1)) return 'ontem às ' + hm(d);
  return fmtDay(k, true).toLowerCase() + ' às ' + hm(d);
}
function cmList(t) {
  const nm = (db.s.name || 'Você').trim().split(' ')[0] || 'Você';
  return (t.cm || []).map(c => `<div class="cm" data-cid="${c.id}"><span class="cmav">${esc(cmInitial())}</span><div class="cmb"><div class="cmh"><b>${esc(nm)}</b><span class="mut sm">${esc(cmWhen(c.at))}${c.ed ? ' · editado' : ''}</span><span class="sp"></span><button class="mini" data-act="cmedit" data-cid="${c.id}" aria-label="Editar comentário">${ic('edit', 15)}</button><button class="mini" data-act="cmdel" data-cid="${c.id}" aria-label="Apagar comentário">${ic('trash', 15)}</button></div><div class="cmt">${cmText(c.tx)}</div></div></div>`).join('');
}
function bindComments(det, t) {
  const f = det.querySelector('.cmform'); if (!f) return;
  const ta = f.querySelector('.cmin'), bt = f.querySelector('[type=submit]');
  const fit = () => { ta.style.height = 'auto'; ta.style.height = Math.min(ta.scrollHeight, 220) + 'px'; bt.disabled = !ta.value.trim(); };
  ta.oninput = fit;
  if (typeof bulletArea === 'function') bulletArea(ta);
  ta.onkeydown = e => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); f.requestSubmit(); } };
  f.onsubmit = e => {
    e.preventDefault(); const tx = ta.value.trim(); if (!tx) return;
    t.cm = [...(t.cm || []), { id: uid(), tx, at: Date.now() }]; put('t', t);
    ta.value = ''; fit();
    det.querySelector('.cms').innerHTML = cmList(t);
    det.querySelector('.dcms .cnt').textContent = t.cm.length;
    const last = det.querySelector('.cms .cm:last-child'); if (last) { last.classList.add('cmnew'); last.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); }
  };
}
/* imagens de capa das tarefas (detalhe, quadro e lista) */
async function loadTaskImgs(root) {
  root.querySelectorAll('img[data-timg]').forEach(async img => {
    const t = get('t', img.dataset.tid), m = t && t.cover; if (!m) return;
    try { if (!IMG_URL.has(m.id)) IMG_URL.set(m.id, await FILES.url(m)); img.src = IMG_URL.get(m.id); } catch (e) { img.closest('.tcover,.ccov,.rthumb') && img.closest('.tcover,.ccov,.rthumb').classList.add('noimg'); }
  });
}
/* reduz fotos grandes antes de enviar (economiza espaço e dados) */
function shrinkImage(file, max = 1600) {
  return new Promise(res => {
    if (!/^image\/(jpeg|png|webp)/.test(file.type) || file.size < 400000) return res(file);
    const u = URL.createObjectURL(file), im = new Image();
    im.onload = () => {
      const k = Math.min(1, max / Math.max(im.width, im.height)), c = document.createElement('canvas');
      c.width = Math.round(im.width * k); c.height = Math.round(im.height * k);
      c.getContext('2d').drawImage(im, 0, 0, c.width, c.height); URL.revokeObjectURL(u);
      c.toBlob(b => res(b ? new File([b], file.name.replace(/\.\w+$/, '') + '.jpg', { type: 'image/jpeg' }) : file), 'image/jpeg', .86);
    };
    im.onerror = () => res(file); im.src = u;
  });
}
function bindDetail(det, t) {
  const ti = det.querySelector('.dtitle');
  const fit = () => { ti.style.height = 'auto'; ti.style.height = ti.scrollHeight + 'px'; };
  fit(); requestAnimationFrame(fit); setTimeout(fit, 250);
  const saveTitle = debounce(() => { t.title = ti.value.replace(/\n/g, ' '); put('t', t); }, 350);
  ti.oninput = () => { fit(); saveTitle(); const lk = det.querySelector('.dtlinks'); if (lk) lk.innerHTML = linkChips(findLinks(ti.value)); };
  ti.onkeydown = e => { if (e.key === 'Enter') { e.preventDefault(); ti.blur(); } };
  ti.onblur = () => {
    const p = parseSmart(ti.value);
    if (p.tokens.length && (p.date || p.rep || p.prio || p.tags.length)) {
      const n = taskFromSmart(ti.value, {});
      t.title = n.title;
      if (n.due || n.start) { t.due = n.due; t.start = n.start; t.rem = n.rem; }
      if (n.rep) t.rep = n.rep;
      if (p.prio) t.prio = n.prio;
      if (n.tags.length) t.tags = [...new Set([...(t.tags || []), ...n.tags])];
      if (p.list) t.list = n.list;
      put('t', t); gcalPushTask(t); render(true);
    } else { t.title = ti.value.trim(); put('t', t); gcalPushTask(t); }
  };
  const no = det.querySelector('.dnotes'); if (no) bulletRich(no);
  const saveNotes = debounce(() => { t.notes = clean(no.innerHTML); put('t', t); }, 500);
  no.oninput = saveNotes;
  autoLinkEditable(no, saveNotes);
  no.onblur = () => { t.notes = clean(no.innerHTML); put('t', t); gcalPushTask(t); };
  no.addEventListener('paste', e => { e.preventDefault(); const h = e.clipboardData.getData('text/html'), tx = e.clipboardData.getData('text/plain'); document.execCommand('insertHTML', false, h ? clean(h) : esc(tx).replace(/\n/g, '<br>')); });
  det.querySelectorAll('[data-f]').forEach(inp => inp.addEventListener('change', async () => {
    const f = inp.dataset.f, v = inp.value;
    if (['sD', 'sT', 'eD', 'eT'].includes(f)) {
      const val = k => { const e = det.querySelector(`[data-f=${k}]`); return e ? e.value : ''; };
      const sD = val('sD'), sT = val('sT'), eD = val('eD'), eT = val('eT');
      t.start = sD ? withT(sD, sT) : null;
      t.due = eD ? withT(eD, eT) : null;
      if (t.start && t.due && t.start > t.due) { if (f === 'sD' || f === 'sT') t.due = t.start; else t.start = t.due; }
      if (!t.start && !t.due) { t.rep = null; }
      if ((sT || eT) && !(t.rem || []).length) t.rem = [0];
      put('t', t); gcalPushTask(t); render(true);
    }
    if (f === 'rem') { t.rem = v === '' ? [] : [+v]; put('t', t); }
    if (f === 'gc') { if (inp.checked) { t.gcOn = true; put('t', t); gcalPushTask(t, true); } else { t.gcOn = false; await gcalDeleteTask(t); delete t.gc; put('t', t); render(true); } }
    if (f === 'cover') {
      const file = inp.files && inp.files[0]; if (!file) return;
      if (!/^image\//.test(file.type)) { toast('Escolha uma imagem'); return; }
      try { toast('Enviando capa…', null, null, 1200); const small = await shrinkImage(file, 1600); const m = await FILES.add(small); const old = t.cover; t.cover = m; put('t', t); if (old) FILES.remove(old); render(true); } catch (e) { toast(e.message || 'Falha ao enviar'); }
      return;
    }
    if (f === 'files') {
      const list = Array.from(inp.files || []);
      if (!list.length) return;
      toast('Anexando ' + plural(list.length, 'arquivo', 'arquivos') + '…', null, null, 1500);
      for (const file of list) { try { const m = await FILES.add(file); t.att = (t.att || []).concat(m); put('t', t); } catch (e) { toast(e.message || 'Falha ao anexar'); } }
      render(true);
    }
  }));
  det.querySelectorAll('.ckin').forEach(inp => {
    inp.onchange = () => { const c = t.chk[+inp.dataset.i]; if (c) { c.t = inp.value; put('t', t); } };
    inp.onkeydown = e => { if (e.key === 'Enter') { e.preventDefault(); const i = +inp.dataset.i; t.chk.splice(i + 1, 0, { id: uid(), t: '', done: false }); t.chk[i].t = inp.value; put('t', t); render(true); const n = $$('#detail .ckin')[i + 1]; if (n) n.focus(); } if (e.key === 'Backspace' && !inp.value) { e.preventDefault(); const i = +inp.dataset.i; t.chk.splice(i, 1); put('t', t); render(true); const p = $$('#detail .ckin')[i - 1]; if (p) p.focus(); } };
  });
  const ca = det.querySelector('.ckadd');
  if (ca) ca.onkeydown = e => { if (e.key === 'Enter' && ca.value.trim()) { e.preventDefault(); t.chk = (t.chk || []).concat({ id: uid(), t: ca.value.trim(), done: false }); put('t', t); render(true); const n = $('#detail .ckadd'); if (n) n.focus(); } };
  const sa = det.querySelector('.addsub input');
  if (sa) sa.onkeydown = e => { if (e.key === 'Enter' && sa.value.trim()) { e.preventDefault(); const s = taskFromSmart(sa.value.trim(), { list: t.list, sec: t.sec, par: t.id, o: Date.now() }); put('t', s); OPEN_SUBS.add(t.id); render(true); const n = $('#detail .addsub input'); if (n) n.focus(); } };
}
Object.assign(ACTS, {
  cmdel: b => {
    const t = get('t', R.sel); if (!t) return; const id = b.dataset.cid, old = (t.cm || []).slice();
    t.cm = (t.cm || []).filter(c => c.id !== id); put('t', t); render(true);
    toast('Comentário apagado', 'Desfazer', () => { t.cm = old; put('t', t); render(true); });
  },
  cmedit: b => {
    const t = get('t', R.sel); if (!t) return; const c = (t.cm || []).find(x => x.id === b.dataset.cid); if (!c) return;
    const box = b.closest('.cm').querySelector('.cmt');
    box.innerHTML = `<textarea class="in cmin" rows="2">${esc(c.tx)}</textarea><div class="cmbar"><span class="sp"></span><button class="btn ghost sm" data-x>Cancelar</button><button class="btn red sm" data-ok>Salvar</button></div>`;
    const ta = box.querySelector('textarea'); ta.style.height = ta.scrollHeight + 'px'; ta.focus(); ta.setSelectionRange(ta.value.length, ta.value.length);
    box.querySelector('[data-x]').onclick = () => render(true);
    box.querySelector('[data-ok]').onclick = () => { const v = ta.value.trim(); if (!v) return; if (v !== c.tx) { c.tx = v; c.ed = Date.now(); put('t', t); } render(true); };
    ta.onkeydown = e => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); box.querySelector('[data-ok]').click(); } if (e.key === 'Escape') { e.stopPropagation(); render(true); } };
  },
  dclose: () => closeTask(),
  covopen: () => { const t = get('t', R.sel); if (t && t.cover) lightbox(t.cover); },
  tcovrm: () => { const t = get('t', R.sel); if (t && t.cover) { const m = t.cover; t.cover = null; put('t', t); FILES.remove(m); } },
  dcheck: b => checkTask(R.sel),
  dpdue: b => { const t = get('t', R.sel); datePicker(b, { date: dOnly(t.due || '') || null, time: tOnly(t.due) || null }, v => { if (!v.date) { t.due = null; if (!t.start) t.rep = null; } else { t.due = withT(v.date, v.time); if (t.start && t.start > t.due) t.start = null; if (v.time && !(t.rem || []).length) t.rem = [0]; } put('t', t); gcalPushTask(t); }, { simple: 1 }); },
  dpstart: b => { const t = get('t', R.sel); datePicker(b, { date: dOnly(t.start || '') || null, time: tOnly(t.start) || null }, v => { if (!v.date) t.start = null; else { t.start = withT(v.date, v.time); if (t.due && t.start > t.due) t.due = t.start; } put('t', t); gcalPushTask(t); }, { simple: 1 }); },
  pclr: b => { const t = get('t', R.sel); if (b.dataset.k === 'due') t.due = null; else t.start = null; if (!t.due && !t.start) t.rep = null; put('t', t); gcalPushTask(t); },
  drem: b => { const t = get('t', R.sel); if (!tOnly(t.due || t.start)) { toast('Defina um horário no prazo ou no início para usar lembrete'); return; } menu(b, [{ label: 'Nenhum', on: !(t.rem || []).length, act: () => { t.rem = []; put('t', t); } }, ...REM_OPTS.map(o => ({ label: o[1], icon: 'bell', on: (t.rem || [])[0] === o[0], act: () => { t.rem = [o[0]]; put('t', t); } }))]); },
  dprio: b => { const t = get('t', R.sel); menu(b, [3, 2, 1, 0].map(p => ({ label: 'Prioridade ' + PRIO[p].n.toLowerCase(), color: PRIO[p].c, on: (t.prio || 0) === p, act: () => { t.prio = p; put('t', t); } })), { right: 1 }); },
  dsetprio: b => { const t = get('t', R.sel); t.prio = +b.dataset.p; put('t', t); },
  dlist: b => {
    const t = get('t', R.sel), items = [];
    db.l.filter(l => !l.arch).forEach(l => { items.push({ label: l.name, color: l.color, on: t.list === l.id && !t.sec, act: () => { t.list = l.id; t.sec = null; put('t', t); } }); (l.sec || []).forEach(s => items.push({ label: '   ' + s.name, icon: 'sub', on: t.sec === s.id, act: () => { t.list = l.id; t.sec = s.id; put('t', t); } })); });
    menu(b, items);
  },
  drep: b => { const t = get('t', R.sel); const base = dOnly(t.due || t.start) || today(); menu(b, [
    { label: 'Não repetir', on: !t.rep, act: () => { t.rep = null; put('t', t); gcalPushTask(t); } },
    { label: 'Todo dia', act: () => setRep(t, { f: 'd', n: 1 }) },
    { label: 'Dias úteis (seg–sex)', act: () => setRep(t, { f: 'w', n: 1, wd: [1, 2, 3, 4, 5] }) },
    { label: 'Toda semana (' + wdShort[pd(base).getDay()] + ')', act: () => setRep(t, { f: 'w', n: 1, wd: [pd(base).getDay()] }) },
    { label: 'Todo mês (dia ' + pd(base).getDate() + ')', act: () => setRep(t, { f: 'm', n: 1, md: pd(base).getDate() }) },
    { label: 'Todo ano', act: () => setRep(t, { f: 'y', n: 1 }) },
    { label: 'Personalizar…', icon: 'edit', act: () => repEditor(t.rep, base, r => setRep(t, r)) },
  ]); },
  dtags: b => { const t = get('t', R.sel); tagMenu(b, t.tags || [], ids => { t.tags = ids; put('t', t); }); },
  duntag: b => { const t = get('t', R.sel); t.tags = (t.tags || []).filter(x => x !== b.dataset.g); put('t', t); },
  dfocus: () => startFocusOn(R.sel),
  dmore: b => taskMenu(get('t', R.sel), b),
  dopen: b => {
    const t = get('t', R.sel); if (!t) return; const k = b.dataset.k; DET_OPEN.add(t.id + ':' + k); render(true);
    setTimeout(() => { const f = { chk: '#detail .ckadd', subs: '#detail .addsub input', cm: '#detail .cmin' }[k]; const el = f && $(f); if (el) { el.scrollIntoView({ block: 'center', behavior: 'smooth' }); el.focus(); } }, 60);
  },
  dmore2: b => {
    const t = get('t', R.sel); if (!t) return;
    const lnk = t.ln || { d: [], t: [] };
    menu(b, [
      { html: `<div class="mprio">${[3, 2, 1, 0].map(p => `<button class="pbtn${(t.prio || 0) === p ? ' on' : ''}" data-p="${p}" style="color:${PRIO[p].c}" aria-label="Prioridade ${PRIO[p].n}">${ic('flag', 20)}</button>`).join('')}</div>` },
      { sep: 1 },
      { label: t.start ? 'Alterar data de início' : 'Data de início', icon: 'startd', act: () => ACTS.dpstart(b) },
      { label: t.rep ? 'Repetição: ' + repText(t.rep) : 'Repetir', icon: 'repeat', act: () => ACTS.drep(b) },
      { label: 'Lembrete', icon: 'bell', act: () => ACTS.drem(b) },
      { label: 'Etiquetas', icon: 'tag', act: () => ACTS.dtags(b) },
      { sep: 1 },
      { label: 'Lista de itens', icon: 'todo', act: () => ACTS.dopen({ dataset: { k: 'chk' } }) },
      t.par ? null : { label: 'Subtarefa', icon: 'sub', act: () => ACTS.dopen({ dataset: { k: 'subs' } }) },
      { label: 'Anexar arquivo', icon: 'clip', act: () => { const i = $('#detail [data-f=files]'); i && i.click(); } },
      t.cover ? null : { label: 'Foto de capa', icon: 'cover', act: () => { const i = $('#detail #dcover'); i && i.click(); } },
      { label: 'Vincular documento ou tarefa', icon: 'link', act: () => ACTS.dopen({ dataset: { k: 'ln' } }) },
      { label: 'Criar documento desta tarefa', icon: 'doc', act: () => ACTS.newdocfor() },
      { sep: 1 },
      { label: t.note ? 'Converter em tarefa' : 'Converter em anotação', icon: t.note ? 'todo' : 'doc', act: () => toggleNote(t) },
      { label: 'Duplicar', icon: 'copy', act: () => { duplicateTask(t); toast('Tarefa duplicada'); } },
      { label: 'Exportar…', icon: 'export', act: () => exportMenu(b, { kind: 'task', id: t.id }) },
      { sep: 1 },
      { html: `<div class="dminfo">Criada ${esc(fmtDay(ymd(new Date(t.c || Date.now())), true).toLowerCase())}${t.done && t.dt ? ` · concluída ${esc(fmtDay(ymd(new Date(t.dt)), true).toLowerCase())} às ${hm(new Date(t.dt))}` : ''}${(t.hist || []).length ? ` · ${plural(t.hist.length, 'ocorrência concluída', 'ocorrências concluídas')}` : ''}</div>` },
      { label: 'Excluir', icon: 'trash', danger: 1, act: () => deleteTask(t) },
    ].filter(Boolean), { right: 1 });
    if (POP) POP.querySelectorAll('[data-p]').forEach(x => x.onclick = () => { t.prio = +x.dataset.p; put('t', t); closePop(); });
  },
  ckt: b => { const t = get('t', R.sel), c = t.chk[+b.dataset.i]; c.done = !c.done; put('t', t); if (c.done && t.chk.every(x => x.done)) toast('Todos os itens concluídos', 'Concluir tarefa', () => checkTask(t.id)); },
  ckdel: b => { const t = get('t', R.sel); t.chk.splice(+b.dataset.i, 1); put('t', t); },
  aopen: b => openFile(get('t', R.sel).att[+b.dataset.i]),
  adel: async b => { const t = get('t', R.sel), m = t.att[+b.dataset.i]; if (await confirmBox('Remover o anexo "' + m.name + '"?')) { t.att.splice(+b.dataset.i, 1); put('t', t); FILES.remove(m); } },
  link: b => { const t = get('t', R.sel); pickItem(b.dataset.k, [t.id], id => { t.ln = t.ln || { d: [], t: [] }; const arr = t.ln[b.dataset.k]; if (!arr.includes(id)) arr.push(id); put('t', t); }); },
  unlink: b => { const t = get('t', R.sel); t.ln[b.dataset.k] = t.ln[b.dataset.k].filter(x => x !== b.dataset.id); put('t', t); },
  newdocfor: () => { const t = get('t', R.sel); const d = newDoc({ title: t.title, b: [{ id: uid(), type: 'task', ref: t.id, text: '' }, { id: uid(), type: 'p', text: '' }] }); t.ln = t.ln || { d: [], t: [] }; t.ln.d.push(d.id); put('t', t); go('doc/' + d.id); },
});
function setRep(t, r) { if (!t.due && !t.start) t.due = today(); t.rep = r; if (r.f === 'w' && r.wd) { const f = firstOcc(r, dOnly(t.due || t.start)); if (t.due) t.due = f + (tOnly(t.due) ? 'T' + tOnly(t.due) : ''); } put('t', t); gcalPushTask(t); }
/* seletor de tarefa ou documento para vincular */
function pickItem(kind, exclude, done) {
  const el = modal(`<h2>${kind === 'd' ? 'Vincular documento' : 'Vincular tarefa'}</h2><input class="in" placeholder="Buscar…" autofocus><div class="plist"></div><div class="row end"><button class="btn ghost" data-x>Fechar</button></div>`, { cls: 'pick' });
  const inp = el.querySelector('input'), box = el.querySelector('.plist');
  const draw = () => {
    const q = norm(inp.value);
    const items = kind === 'd' ? db.d.filter(d => !d.del && !exclude.includes(d.id) && norm(d.title).includes(q)).slice(0, 60).map(d => `<button class="pi" data-id="${d.id}"><span class="dicon">${esc(d.icon || '📄')}</span><span>${esc(d.title || 'Sem título')}</span></button>`)
      : db.t.filter(t => !t.del && !exclude.includes(t.id) && norm(t.title).includes(q)).sort((a, b) => (a.done - b.done) || sortTasks(a, b)).slice(0, 80).map(t => `<button class="pi" data-id="${t.id}"><span class="chk sm p${t.prio || 0}${t.done ? ' on' : ''}"><span>${ic('check', 10)}</span></span><span>${esc(t.title)}</span><span class="mut sm">${esc(listOf(t).name)}${t.due ? ' · ' + esc(fmtWhen(t.due)) : ''}</span></button>`);
    box.innerHTML = items.join('') || '<p class="hint pad">Nada encontrado.</p>';
  };
  inp.oninput = draw; draw();
  box.onclick = e => { const b = e.target.closest('[data-id]'); if (b) { closeModal(); done(b.dataset.id); } };
  el.querySelector('[data-x]').onclick = closeModal;
}
/* reordenar itens da lista de verificação */
DROPS.push((src, dst, before) => {
  if (!src.startsWith('ck:') || !dst.startsWith('ck:')) return;
  const [, tid, cid] = src.split(':'), t = get('t', tid); if (!t) return true;
  const from = t.chk.findIndex(c => c.id === cid), it = t.chk.splice(from, 1)[0];
  let to = t.chk.findIndex(c => c.id === dst.slice(3)); if (to < 0) { t.chk.splice(from, 0, it); return true; }
  if (!before) to++;
  t.chk.splice(to, 0, it); put('t', t); return true;
});

/* anotação: item da lista sem "concluir" (ícone de documento no lugar da bolinha) */
function toggleNote(t, quiet) {
  t.note = !t.note; if (t.note) { t.done = false; t.dt = null; } put('t', t);
  if (!quiet) toast(t.note ? 'Convertida em anotação' : 'Convertida em tarefa', 'Desfazer', () => { t.note = !t.note; put('t', t); });
}
