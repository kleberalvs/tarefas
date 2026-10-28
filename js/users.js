/* Usuários: o administrador cria, edita, bloqueia e exclui acessos (pela função segura "tarefas" do Supabase). */
'use strict';
let USERS = null, USERS_ERR = '';
async function fnCall(action, payload = {}) {
  if (!SB || !SES) throw new Error('Entre na sua conta primeiro');
  const { data, error } = await SB.functions.invoke('tarefas', { body: Object.assign({ action }, payload) });
  if (error) {
    let msg = error.message || 'erro';
    try { const j = await error.context.json(); if (j && j.error) msg = j.error; } catch (e) {}
    if (/Failed to send|not found|404|FunctionsFetchError|FunctionsRelayError/i.test(msg)) msg = 'A função "tarefas" ainda não foi publicada no Supabase (veja o passo a passo em Configurações → Usuários).';
    throw new Error(msg);
  }
  if (data && data.error) throw new Error(data.error);
  return data;
}
async function loadUsers() {
  USERS_ERR = '';
  try { USERS = (await fnCall('users.list')).users || []; } catch (e) { USERS = null; USERS_ERR = e.message; }
  if (R.v === 'users') render(true);
}
VIEWS.users = main => {
  if (!IS_ADMIN) {
    main.innerHTML = headHtml('Usuários') + `<div class="scroll"><div class="sets"><section class="sgrp"><h2>${ic('users', 18)}Administração</h2>
      ${ADMIN_FREE ? `<p>Ainda não existe administrador. Como você é o primeiro, pode assumir esse papel agora.</p><button class="btn red" data-act="claimadmin">Tornar-me administrador</button>` : `<p class="mut">Só o administrador pode criar e gerenciar usuários.</p>`}
    </section></div></div>`;
    return;
  }
  if (USERS === null && !USERS_ERR) { loadUsers(); }
  const list = USERS || [];
  const fmt = s => s ? new Date(s).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'nunca';
  main.innerHTML = headHtml('Usuários', 'Crie e gerencie quem pode entrar no app', `<button class="ib" data-act="ureload" aria-label="Atualizar">${ic('sync')}</button><button class="btn red sm" data-act="unew">${ic('plus', 16)}<span>Novo usuário</span></button>`) + `<div class="scroll"><div class="sets">
    ${USERS_ERR ? `<section class="sgrp warn"><h2>${ic('info', 18)}Falta um passo</h2><p>${esc(USERS_ERR)}</p></section>` : ''}
    ${USERS === null && !USERS_ERR ? '<p class="hint pad">Carregando…</p>' : ''}
    <div class="ulist">${list.map(u => `<div class="ucard${u.banned ? ' off' : ''}">
      <span class="avatar sm"><span>${esc(((u.name || u.email || '?').trim()[0] || '?').toUpperCase())}</span></span>
      <div class="f1"><b>${esc(u.name || u.email)}</b>${u.admin ? ' <span class="badge">Admin</span>' : ''}${u.banned ? ' <span class="badge red">Bloqueado</span>' : ''}${u.painel === false ? ' <span class="badge gray">Só Tarefas</span>' : ''}<div class="mut sm">${esc(u.email)}${u.id === SES.user.id ? ' · você' : ''}</div><div class="mut sm">Último acesso: ${fmt(u.last)} · criado em ${fmt(u.created).slice(0, 10)}</div></div>
      <button class="btn ghost sm" data-act="uedit" data-id="${u.id}">Gerenciar</button></div>`).join('')}</div>
    <p class="hint">Cada usuário tem as próprias tarefas, documentos e hábitos. Ninguém vê os dados dos outros, nem o administrador.</p>
  </div></div>`;
};
function userForm(u) {
  const isNew = !u;
  u = u || { email: '', name: '', admin: false, painel: false, banned: false };
  const self = !isNew && SES && u.id === SES.user.id;
  const el = modal(`<h2>${isNew ? 'Novo usuário' : 'Gerenciar usuário'}</h2><form autocomplete="off">
    <label class="lab">Nome<input class="in" name="name" value="${esc(u.name || '')}" maxlength="60"></label>
    <label class="lab">E-mail<input class="in" type="email" name="email" value="${esc(u.email)}" ${isNew ? 'required' : 'disabled'}></label>
    <label class="lab">${isNew ? 'Senha (mínimo 8 caracteres)' : 'Nova senha (deixe em branco para manter)'}<span class="pwbox"><input class="in" type="text" name="pw" minlength="8" ${isNew ? 'required' : ''} autocomplete="new-password" value="${isNew ? esc(genPassword()) : ''}"><button type="button" class="mini" data-gen title="Gerar senha" aria-label="Gerar senha">${ic('sync', 16)}</button></span></label>
    <label class="srow"><span>Administrador (pode gerenciar usuários)</span><span class="sw-t"><input type="checkbox" name="admin" ${u.admin ? 'checked' : ''} ${self ? 'disabled' : ''}><span></span></span></label>
    <label class="srow"><span>Também pode entrar no painel da equipe</span><span class="sw-t"><input type="checkbox" name="painel" ${u.painel !== false ? 'checked' : ''}><span></span></span></label>
    ${!isNew ? `<label class="srow"><span>Acesso bloqueado</span><span class="sw-t"><input type="checkbox" name="ban" ${u.banned ? 'checked' : ''} ${self ? 'disabled' : ''}><span></span></span></label>` : ''}
    <p class="err" data-m></p>
    <div class="row end">${!isNew && !self ? '<button type="button" class="btn ghost danger" data-del>Excluir</button><span class="sp"></span>' : ''}<button type="button" class="btn ghost" data-x>Cancelar</button><button class="btn red">${isNew ? 'Criar usuário' : 'Salvar'}</button></div></form>
    ${isNew ? '<p class="hint">Anote ou copie a senha para passar à pessoa. Ela pode trocar depois em Configurações → Alterar minha senha.</p>' : ''}`);
  const f = el.querySelector('form'), m = el.querySelector('[data-m]');
  el.querySelector('[data-gen]').onclick = () => { f.pw.value = genPassword(); };
  el.querySelector('[data-x]').onclick = closeModal;
  const del = el.querySelector('[data-del]');
  if (del) del.onclick = async () => { if (!await confirmBox('Excluir o acesso de ' + (u.name || u.email) + '?', 'A pessoa não vai mais conseguir entrar e os dados dela serão apagados.')) return; try { await fnCall('users.delete', { id: u.id }); toast('Usuário excluído'); loadUsers(); } catch (e) { toast(e.message); } };
  f.onsubmit = async e => {
    e.preventDefault(); m.textContent = '';
    const p = { name: f.name.value.trim(), admin: f.admin.checked, painel: f.painel.checked };
    if (f.pw.value) p.password = f.pw.value;
    const btn = f.querySelector('.btn.red'); btn.disabled = true;
    try {
      if (isNew) { p.email = f.email.value.trim(); await fnCall('users.create', p); }
      else { p.id = u.id; p.ban = f.ban ? f.ban.checked : false; await fnCall('users.update', p); }
      closeModal(); toast(isNew ? 'Usuário criado' : 'Usuário atualizado'); loadUsers();
    } catch (er) { btn.disabled = false; m.textContent = /already|registered|exists/i.test(er.message) ? 'Já existe um usuário com esse e-mail.' : er.message; }
  };
}
function genPassword() { const c = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789'; const a = crypto.getRandomValues(new Uint32Array(12)); return Array.from(a, x => c[x % c.length]).join('').replace(/(.{4})(.{4})/, '$1-$2-'); }
Object.assign(ACTS, {
  unew: () => userForm(),
  uedit: b => userForm((USERS || []).find(u => u.id === b.dataset.id)),
  ureload: () => { USERS = null; loadUsers(); render(true); },
  claimadmin: async () => { const { data, error } = await SB.rpc('tarefas_virar_admin'); if (error || !data) { toast('Não foi possível: ' + (error ? error.message : 'já existe um administrador')); return; } IS_ADMIN = true; ADMIN_FREE = false; toast('Agora você é o administrador'); render(true); },
  chpass: () => changePassword(),
});
