/* Assistente de escrita com IA (gratuito).
   Ordem: IA embutida do navegador (quando existe, roda no aparelho) → Google Gemini com a chave gratuita do Kleber (se configurada) → serviço público gratuito (sem chave, mais limitado). */
'use strict';
const AI_SYS = 'Você é um assistente de escrita em português do Brasil, dentro de um app pessoal de tarefas e notas. Responda só com o texto pedido, pronto para colar, sem comentários antes ou depois. Use listas com "- " quando fizer sentido e títulos com "## " apenas se ajudar.';
const AI_ACTS = [
  { k: 'free', n: 'Pedir algo…', e: '✨' },
  { k: 'cont', n: 'Continuar escrevendo', e: '✍️', p: 'Continue o texto abaixo de forma natural, no mesmo tom, com mais um ou dois parágrafos:\n\n' },
  { k: 'improve', n: 'Melhorar a escrita', e: '🪄', p: 'Reescreva o texto abaixo deixando-o mais claro e bem escrito, mantendo o sentido:\n\n', need: 1 },
  { k: 'fix', n: 'Corrigir ortografia e gramática', e: '✅', p: 'Corrija ortografia, acentuação, pontuação e gramática do texto abaixo, sem mudar o estilo:\n\n', need: 1 },
  { k: 'short', n: 'Deixar mais curto', e: '✂️', p: 'Reescreva o texto abaixo de forma mais curta e direta:\n\n', need: 1 },
  { k: 'long', n: 'Deixar mais completo', e: '➕', p: 'Desenvolva e detalhe melhor o texto abaixo:\n\n', need: 1 },
  { k: 'formal', n: 'Tom mais formal', e: '👔', p: 'Reescreva o texto abaixo em tom formal e profissional:\n\n', need: 1 },
  { k: 'simple', n: 'Tom mais simples', e: '🙂', p: 'Reescreva o texto abaixo em linguagem simples e amigável:\n\n', need: 1 },
  { k: 'sum', n: 'Resumir', e: '📝', p: 'Resuma o texto abaixo em poucos tópicos curtos:\n\n', need: 1 },
  { k: 'tasks', n: 'Extrair tarefas', e: '☑️', p: 'Liste, como itens "- ", as tarefas e próximos passos que aparecem no texto abaixo:\n\n', need: 1 },
  { k: 'ideas', n: 'Lista de ideias', e: '💡', p: 'Crie uma lista de 8 ideias curtas e úteis sobre o tema abaixo:\n\n' },
  { k: 'en', n: 'Traduzir para inglês', e: '🇺🇸', p: 'Traduza para o inglês:\n\n', need: 1 },
  { k: 'title', n: 'Sugerir um título', e: '🏷️', p: 'Sugira um único título curto (sem aspas) para o texto abaixo:\n\n', need: 1 },
];
/* modelos gratuitos em ordem de preferência; se um estiver sobrecarregado (503) ou no limite (429), tenta o próximo */
const AI_MODELS = ['gemini-flash-latest', 'gemini-2.5-flash', 'gemini-flash-lite-latest', 'gemini-2.5-flash-lite'];
const sleep = ms => new Promise(r => setTimeout(r, ms));
async function gFetch(path, body, signal) {
  const key = (aiCfg().key || '').trim(), first = aiCfg().model, models = [...new Set([first, ...AI_MODELS].filter(Boolean))];
  let last = '';
  for (let round = 0; round < 2; round++) for (const m of models) {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(m)}:${path}${path.includes('?') ? '&' : '?'}key=${encodeURIComponent(key)}`, { method: 'POST', signal, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    if (res.ok) { if (aiCfg().model !== m) aiCfg().okModel = m; return res; }
    const t = await res.text().catch(() => '');
    if (res.status === 400 && /API key/i.test(t) || res.status === 403) throw new Error('A chave do Gemini foi recusada. Confira se colou a chave inteira.');
    if (res.status === 404) { last = 'modelo indisponível'; continue; }
    if ([429, 500, 502, 503, 504].includes(res.status)) { last = res.status === 429 ? 'limite gratuito atingido' : 'Google sobrecarregado'; await sleep(600 + round * 1500); continue; }
    throw new Error('Gemini: erro ' + res.status + ' ' + t.slice(0, 140));
  }
  throw new Error(last === 'limite gratuito atingido' ? 'Limite gratuito do Gemini atingido por agora. Tente de novo em alguns minutos.' : 'Os servidores do Gemini estão muito ocupados agora. Tente de novo em alguns instantes.');
}
function aiCfg() { return (db.s.ai = db.s.ai || {}); }
async function aiLocal() {
  try {
    const LM = window.LanguageModel || (window.ai && window.ai.languageModel);
    if (!LM) return null;
    const av = LM.availability ? await LM.availability() : (await LM.capabilities()).available;
    if (av !== 'available' && av !== 'readily') return null;
    return LM;
  } catch (e) { return null; }
}
/* gera texto; onTok recebe o texto acumulado (para mostrar escrevendo) */
async function aiGen(prompt, onTok, signal) {
  const cfg = aiCfg();
  const LM = await aiLocal();
  if (LM) {
    const s = await LM.create({ initialPrompts: [{ role: 'system', content: AI_SYS }], systemPrompt: AI_SYS });
    if (s.promptStreaming) { let acc = ''; for await (const ch of s.promptStreaming(prompt, { signal })) { acc = ch.startsWith(acc) ? ch : acc + ch; onTok && onTok(acc); } return acc; }
    const r = await s.prompt(prompt); onTok && onTok(r); return r;
  }
  if (cfg.key) {
    const res = await gFetch('streamGenerateContent?alt=sse', { systemInstruction: { parts: [{ text: AI_SYS }] }, contents: [{ role: 'user', parts: [{ text: prompt }] }], generationConfig: { temperature: .7 } }, signal);
    const rd = res.body.getReader(), dec = new TextDecoder(); let buf = '', acc = '';
    for (;;) {
      const { value, done } = await rd.read(); if (done) break;
      buf += dec.decode(value, { stream: true });
      let i; while ((i = buf.indexOf('\n')) >= 0) {
        const line = buf.slice(0, i).trim(); buf = buf.slice(i + 1);
        if (!line.startsWith('data:')) continue;
        try { const j = JSON.parse(line.slice(5)); const t = (((j.candidates || [])[0] || {}).content || {}).parts; if (t) { acc += t.map(p => p.text || '').join(''); onTok && onTok(acc); } } catch (e) {}
      }
    }
    return acc;
  }
  /* sem chave: serviço público gratuito */
  const url = 'https://text.pollinations.ai/' + encodeURIComponent(prompt.slice(0, 3500)) + '?system=' + encodeURIComponent(AI_SYS) + '&model=openai';
  const res = await fetch(url, { signal });
  if (!res.ok) throw new Error('O serviço gratuito sem chave não respondeu agora. Para usar sempre, coloque uma chave gratuita do Google Gemini em Configurações → Assistente de IA.');
  const t = await res.text(); onTok && onTok(t); return t;
}
/* painel do assistente. ctx = { text: texto atual/selecionado, all: texto todo, insert(md), replace(md) } */
function aiPanel(ctx, act) {
  const has = !!(ctx.text || '').trim();
  let ctrl = null, out = '';
  const el = modal(`<div class="aip">
    <h2><span class="aisp">✨</span>Assistente de escrita</h2>
    <form class="aiq"><input class="in" name="q" placeholder="${has ? 'Peça algo sobre o texto… ex.: transforme em e-mail' : 'O que você quer escrever? ex.: lista de compras para churrasco'}" autocomplete="off" maxlength="600"><button class="btn red sm">${ic('send', 16)}</button></form>
    <div class="aiacts">${AI_ACTS.filter(a => a.k !== 'free' && (!a.need || has)).map(a => `<button class="aiact" data-a="${a.k}"><span>${a.e}</span>${a.n}</button>`).join('')}</div>
    <div class="aiout" hidden><div class="aitxt"></div></div>
    <div class="row end aibtns" hidden><button class="btn ghost sm" data-ai="again">${ic('undo', 15)}Tentar de novo</button><button class="btn ghost sm" data-ai="copy">${ic('copy', 15)}Copiar</button>${has && ctx.replace ? `<button class="btn ghost sm" data-ai="rep">Substituir</button>` : ''}<button class="btn red sm" data-ai="ins">Inserir</button></div>
    <p class="hint aiwho"></p>
  </div>`, { cls: 'aimodal' });
  const q = el.querySelector('[name=q]'), box = el.querySelector('.aiout'), txt = el.querySelector('.aitxt'), btns = el.querySelector('.aibtns');
  aiLocal().then(l => { el.querySelector('.aiwho').textContent = l ? 'Usando a IA do próprio navegador (funciona no aparelho).' : aiCfg().key ? 'Usando o Google Gemini com a sua chave gratuita.' : 'Usando um serviço gratuito sem chave (pode ficar lento). Para mais qualidade, configure a chave gratuita do Gemini em Configurações.'; });
  let last = null;
  const run = async prompt => {
    last = prompt; if (ctrl) ctrl.abort(); ctrl = new AbortController();
    box.hidden = false; btns.hidden = true; txt.innerHTML = '<span class="aidots"><i></i><i></i><i></i></span>'; out = '';
    try {
      await aiGen(prompt, t => { out = t; txt.innerHTML = aiFmt(t) + '<span class="aicur"></span>'; box.scrollTop = box.scrollHeight; }, ctrl.signal);
      out = out.trim(); txt.innerHTML = aiFmt(out) || '<p class="mut">Sem resposta.</p>'; btns.hidden = !out;
    } catch (e) { if (e.name !== 'AbortError') txt.innerHTML = `<p class="err">${esc(/fetch|network|load failed/i.test(e.message || '') ? 'Sem conexão com a IA agora. Verifique a internet e tente de novo.' : e.message || 'Não foi possível gerar o texto')}</p>`; }
  };
  const ask = k => { const a = AI_ACTS.find(x => x.k === k); if (!a) return; run(a.p + (has ? ctx.text : (ctx.all || q.value || 'organização pessoal'))); };
  el.querySelector('.aiq').onsubmit = e => { e.preventDefault(); const v = q.value.trim(); if (!v) return; run(has ? v + '\n\nTexto de referência:\n' + ctx.text : (ctx.all ? v + '\n\nContexto (texto atual):\n' + ctx.all.slice(0, 4000) : v)); };
  el.querySelectorAll('[data-a]').forEach(b => b.onclick = () => ask(b.dataset.a));
  el.querySelector('[data-ai=again]').onclick = () => last && run(last);
  el.querySelector('[data-ai=copy]').onclick = () => { navigator.clipboard && navigator.clipboard.writeText(out); toast('Copiado'); };
  el.querySelector('[data-ai=ins]').onclick = () => { closeModal(); ctx.insert(out); };
  const rb = el.querySelector('[data-ai=rep]'); if (rb) rb.onclick = () => { closeModal(); ctx.replace(out); };
  if (act && act !== 'free') ask(act); else setTimeout(() => q.focus(), 60);
}
function aiFmt(t) {
  return esc(t).split('\n').map(l => /^\s*[-*•]\s+/.test(l) ? `<p class="aili">• ${l.replace(/^\s*[-*•]\s+/, '')}</p>` : /^#{1,3}\s+/.test(l) ? `<p><b>${l.replace(/^#{1,3}\s+/, '')}</b></p>` : l.trim() ? `<p>${l}</p>` : '').join('').replace(/\*\*(.+?)\*\*/g, '<b>$1</b>');
}
/* texto simples (notas): "- " vira "• " e ** some */
const aiPlain = t => t.replace(/\*\*(.+?)\*\*/g, '$1').replace(/^#{1,3}\s+/gm, '').replace(/^\s*[-*]\s+/gm, '• ').trim();
