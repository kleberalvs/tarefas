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
  det.innerHTML = `<div class="dwrap">
  <header class="dtop">
    <button class="ib show-m" data-act="dclose" aria-label="Voltar">${ic('left')}</button>
    <button class="chk big p${t.prio || 0}${t.done ? ' on' : ''}" data-act="dcheck" role="checkbox" aria-checked="${t.done}" aria-label="${t.done ? 'Reabrir' : 'Concluir'} tarefa"><span>${ic('check', 14)}</span></button>
    <button class="chipb dlist" data-act="dlist">${'<span class="ldot" style="background:' + esc(l.color || '#808080') + '"></span>'}<span>${esc(l.name)}${t.sec && secs.find(s => s.id === t.sec) ? ' / ' + esc(secs.find(s => s.id === t.sec).name) : ''}</span>${ic('chevd', 14)}</button>
    <span class="sp"></span>
    <button class="ib" data-act="dprio" aria-label="Prioridade" style="color:${PRIO[t.prio || 0].c}">${ic('flag')}</button>
    <button class="ib" data-act="dfocus" aria-label="Iniciar foco">${ic('focus')}</button>
    <button class="ib" data-act="dmore" aria-label="Mais opções">${ic('more')}</button>
    <button class="ib hide-m" data-act="dclose" aria-label="Fechar">${ic('x')}</button>
  </header>
  <div class="dscroll">
    ${t.cover ? `<div class="tcover"><img alt="Capa da tarefa" data-timg="${esc(t.cover.id)}" data-tid="${t.id}"><div class="tcbtns"><label class="btn ghost sm">${ic('img', 16)}Trocar<input type="file" accept="image/*" hidden data-f="cover"></label><button class="btn ghost sm" data-act="tcovrm">Remover</button></div></div>` : ''}
    ${t.par ? `<button class="link dparent" data-act="topen" data-id="${t.par}">${ic('left', 14)} ${esc((get('t', t.par) || {}).title || 'Tarefa principal')}</button>` : ''}
    <textarea class="dtitle" data-keep rows="1" placeholder="Título da tarefa" aria-label="Título">${esc(t.title)}</textarea>
    <div class="dnotes rich" data-keep contenteditable="true" data-ph="Descrição, ideias, links…" aria-label="Descrição">${clean(t.notes)}</div>

    <div class="props">
      ${t.cover ? '' : `<div class="prop"><span class="pl">${ic('cover', 18)}Capa</span><div class="pv"><label class="chipb filebtn">${ic('img', 14)}<span>Adicionar foto de capa</span><input type="file" accept="image/*" hidden data-f="cover"></label></div></div>`}
      <div class="prop"><span class="pl">${ic('sub', 18)}Início</span><div class="pv"><input type="date" class="in sm" data-keep data-f="sD" value="${sD}" aria-label="Data de início"><input type="time" class="in sm" data-keep data-f="sT" value="${sT}" aria-label="Hora de início" ${sD ? '' : 'disabled'}></div></div>
      <div class="prop"><span class="pl">${ic('cal', 18)}Fim / prazo</span><div class="pv"><input type="date" class="in sm${overdue(t) ? ' red' : ''}" data-keep data-f="eD" value="${eD}" aria-label="Data de fim"><input type="time" class="in sm" data-keep data-f="eT" value="${eT}" aria-label="Hora de fim" ${eD ? '' : 'disabled'}></div></div>
      <div class="prop"><span class="pl">${ic('repeat', 18)}Repetir</span><div class="pv"><button class="chipb" data-act="drep">${esc(t.rep ? repText(t.rep) : 'Não repete')}</button></div></div>
      <div class="prop"><span class="pl">${ic('bell', 18)}Lembrete</span><div class="pv"><select class="in sm" data-keep data-f="rem" ${tOnly(t.due || t.start) || eD || sD ? '' : 'disabled'}><option value="">Nenhum</option>${REM_OPTS.map(o => `<option value="${o[0]}" ${(t.rem || [])[0] === o[0] ? 'selected' : ''}>${o[1]}</option>`).join('')}</select></div></div>
      <div class="prop"><span class="pl">${ic('flag', 18)}Prioridade</span><div class="pv prios">${[3, 2, 1, 0].map(p => `<button class="pbtn${(t.prio || 0) === p ? ' on' : ''}" data-act="dsetprio" data-p="${p}" style="--pc:${PRIO[p].c}">${ic('flag', 16)}<span>${PRIO[p].n}</span></button>`).join('')}</div></div>
      <div class="prop"><span class="pl">${ic('tag', 18)}Etiquetas</span><div class="pv wrap">${(t.tags || []).map(g => { const x = get('g', g); return x ? `<span class="mtag" style="--c:${esc(x.color)}">#${esc(x.name)}<button class="mini" data-act="duntag" data-g="${g}" aria-label="Remover etiqueta ${esc(x.name)}">${ic('x', 12)}</button></span>` : ''; }).join('')}<button class="chipb" data-act="dtags">${ic('plus', 14)}<span>Etiqueta</span></button></div></div>
      ${typeof gcalReady === 'function' && db.s.gClient ? `<div class="prop"><span class="pl">${ic('google', 18)}Google Agenda</span><div class="pv"><label class="sw-t"><input type="checkbox" data-f="gc" ${t.gc || (t.gcOn !== false && db.s.gPush && (t.due || t.start)) ? 'checked' : ''} ${t.due || t.start ? '' : 'disabled'}><span></span></label><span class="mut sm">${t.gc ? 'Sincronizada' : t.due || t.start ? 'Enviar para a agenda' : 'Defina uma data'}</span></div></div>` : ''}
    </div>

    <section class="dsec"><h3>${ic('todo', 18)}Itens <span class="cnt">${chk.length ? chk.filter(c => c.done).length + '/' + chk.length : ''}</span></h3>
      ${chk.length ? `<div class="prog"><span style="width:${Math.round(chk.filter(c => c.done).length / chk.length * 100)}%"></span></div>` : ''}
      <div class="chklist">${chk.map((c, i) => `<div class="ck${c.done ? ' done' : ''}" data-drag="ck:${t.id}:${c.id}" data-drop="ck:${c.id}"><button class="cbox${c.done ? ' on' : ''}" data-act="ckt" data-i="${i}" role="checkbox" aria-checked="${c.done}" aria-label="Item ${esc(c.t)}">${ic('check', 12)}</button><input class="ckin" data-keep data-i="${i}" value="${esc(c.t)}" aria-label="Texto do item"><button class="mini" data-act="ckdel" data-i="${i}" aria-label="Remover item">${ic('x', 14)}</button></div>`).join('')}</div>
      <div class="addline" data-keep>${ic('plus', 16)}<input class="ckadd" placeholder="Adicionar item" aria-label="Adicionar item"></div>
    </section>

    ${t.par ? '' : `<section class="dsec"><h3>${ic('sub', 18)}Subtarefas <span class="cnt">${subs.length ? subs.filter(s => s.done).length + '/' + subs.length : ''}</span></h3>
      <div class="subl">${subs.map(s => rowHtml(s, { lvl: 0, withDone: 1 })).join('')}</div>
      <div class="addline addsub" data-keep>${ic('plus', 16)}<input placeholder="Adicionar subtarefa (aceita texto inteligente)" aria-label="Adicionar subtarefa"></div>
    </section>`}

    <section class="dsec"><h3>${ic('clip', 18)}Anexos <span class="cnt">${(t.att || []).length || ''}</span></h3>
      <div class="atts">${(t.att || []).map((m, i) => `<div class="att"><button class="attm" data-act="aopen" data-i="${i}">${ic(fileIcon(m), 22)}<span class="an">${esc(m.name)}</span><span class="mut sm">${fmtSize(m.size)}${m.pending ? ' · só neste aparelho' : ''}</span></button><button class="mini" data-act="adel" data-i="${i}" aria-label="Remover anexo">${ic('trash', 16)}</button></div>`).join('')}</div>
      <label class="btn ghost sm filebtn">${ic('up', 16)}Anexar arquivos<input type="file" multiple hidden data-f="files"></label>
    </section>

    <section class="dsec"><h3>${ic('link', 18)}Vínculos</h3>
      <div class="links">
        ${ln.d.map(id => { const d = get('d', id); return d ? `<div class="lnk"><a href="#/doc/${d.id}" class="lnkm"><span class="dicon">${esc(d.icon || '📄')}</span><span>${esc(d.title || 'Sem título')}</span></a><button class="mini" data-act="unlink" data-k="d" data-id="${id}" aria-label="Desvincular">${ic('x', 14)}</button></div>` : ''; }).join('')}
        ${ln.t.map(id => { const x = get('t', id); return x ? `<div class="lnk"><button class="lnkm" data-act="topen" data-id="${x.id}"><span class="chk sm p${x.prio || 0}${x.done ? ' on' : ''}"><span>${ic('check', 10)}</span></span><span>${esc(x.title)}</span>${x.due ? `<span class="mut sm">${esc(fmtWhen(x.due))}</span>` : ''}</button><button class="mini" data-act="unlink" data-k="t" data-id="${id}" aria-label="Desvincular">${ic('x', 14)}</button></div>` : ''; }).join('')}
        ${back.map(x => `<div class="lnk back"><button class="lnkm" data-act="topen" data-id="${x.id}">${ic('link', 14)}<span>${esc(x.title)}</span><span class="mut sm">vinculou esta</span></button></div>`).join('')}
        ${docRefs.map(d => `<div class="lnk back"><a class="lnkm" href="#/doc/${d.id}"><span class="dicon">${esc(d.icon || '📄')}</span><span>${esc(d.title || 'Sem título')}</span><span class="mut sm">menciona esta tarefa</span></a></div>`).join('')}
      </div>
      <div class="row"><button class="btn ghost sm" data-act="link" data-k="d">${ic('doc', 16)}Vincular documento</button><button class="btn ghost sm" data-act="link" data-k="t">${ic('todo', 16)}Vincular tarefa</button><button class="btn ghost sm" data-act="newdocfor">${ic('plus', 16)}Novo documento</button></div>
    </section>

    <footer class="dfoot mut sm">
      ${focusMin ? `<span>${ic('focus', 14)} ${fmtDur(focusMin)} de foco</span>` : ''}
      <span>Criada ${esc(fmtDay(ymd(new Date(t.c || Date.now())), true).toLowerCase())}</span>
      ${t.done && t.dt ? `<span>Concluída ${esc(fmtDay(ymd(new Date(t.dt)), true).toLowerCase())} às ${hm(new Date(t.dt))}</span>` : ''}
      ${(t.hist || []).length ? `<span>${plural(t.hist.length, 'ocorrência concluída', 'ocorrências concluídas')}</span>` : ''}
    </footer>
  </div></div>`;
  bindDetail(det, t);
  loadTaskImgs(det);
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
  ti.oninput = () => { fit(); saveTitle(); };
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
  const no = det.querySelector('.dnotes');
  const saveNotes = debounce(() => { t.notes = clean(no.innerHTML); put('t', t); }, 500);
  no.oninput = saveNotes;
  no.onblur = () => { t.notes = clean(no.innerHTML); put('t', t); gcalPushTask(t); };
  no.addEventListener('paste', e => { e.preventDefault(); const h = e.clipboardData.getData('text/html'), tx = e.clipboardData.getData('text/plain'); document.execCommand('insertHTML', false, h ? clean(h) : esc(tx).replace(/\n/g, '<br>')); });
  det.querySelectorAll('[data-f]').forEach(inp => inp.addEventListener('change', async () => {
    const f = inp.dataset.f, v = inp.value;
    const sD = det.querySelector('[data-f=sD]').value, sT = det.querySelector('[data-f=sT]').value, eD = det.querySelector('[data-f=eD]').value, eT = det.querySelector('[data-f=eT]').value;
    if (['sD', 'sT', 'eD', 'eT'].includes(f)) {
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
  ca.onkeydown = e => { if (e.key === 'Enter' && ca.value.trim()) { e.preventDefault(); t.chk = (t.chk || []).concat({ id: uid(), t: ca.value.trim(), done: false }); put('t', t); render(true); const n = $('#detail .ckadd'); if (n) n.focus(); } };
  const sa = det.querySelector('.addsub input');
  if (sa) sa.onkeydown = e => { if (e.key === 'Enter' && sa.value.trim()) { e.preventDefault(); const s = taskFromSmart(sa.value.trim(), { list: t.list, sec: t.sec, par: t.id, o: Date.now() }); put('t', s); OPEN_SUBS.add(t.id); render(true); const n = $('#detail .addsub input'); if (n) n.focus(); } };
}
Object.assign(ACTS, {
  dclose: () => closeTask(),
  tcovrm: () => { const t = get('t', R.sel); if (t && t.cover) { const m = t.cover; t.cover = null; put('t', t); FILES.remove(m); } },
  dcheck: b => checkTask(R.sel),
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
