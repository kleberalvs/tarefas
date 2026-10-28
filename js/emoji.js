/* Seletor de emojis com categorias, busca e recentes. */
'use strict';
const EMO_CATS = [
  ['Recentes', '🕘', []],
  ['Rostos', '😀', '😀 😃 😄 😁 😆 😅 😂 🤣 😊 😇 🙂 🙃 😉 😌 😍 🥰 😘 😗 😙 😚 😋 😛 😝 😜 🤪 🤨 🧐 🤓 😎 🥸 🤩 🥳 😏 😒 😞 😔 😟 😕 🙁 😣 😖 😫 😩 🥺 😢 😭 😤 😠 😡 🤯 😳 🥵 🥶 😱 😨 😰 😥 😓 🤗 🤔 🫡 🤭 🤫 🤥 😶 😐 😑 😬 🙄 😯 😦 😧 😮 😲 🥱 😴 🤤 😪 😵 🤐 🥴 🤢 🤮 🤧 😷 🤒 🤕 🤑 🤠 😈 👻 💀 🤖 👽 💩 😺 😸 😻'.split(' ')],
  ['Pessoas', '👋', '👋 🤚 ✋ 🖖 👌 🤌 ✌️ 🤞 🫶 🤟 🤘 🤙 👈 👉 👆 👇 ☝️ 👍 👎 ✊ 👊 👏 🙌 👐 🤲 🤝 🙏 ✍️ 💪 🧠 👀 👂 👃 👶 🧒 👦 👧 🧑 👨 👩 🧓 👴 👵 👮 👷 💂 🕵️ 👩‍⚕️ 👨‍⚕️ 👩‍🎓 👨‍🎓 👩‍🏫 👨‍🏫 👩‍⚖️ 👩‍🌾 👩‍🍳 👨‍🍳 👩‍🔧 👩‍💼 👨‍💼 👩‍💻 👨‍💻 👩‍🎨 🧑‍🚀 🦸 🧙 🤷 🙋 🙆 🙅 💁 🙇 🧘 🏃 🚶 💃 🕺 👫 👪 🤰'.split(' ')],
  ['Natureza', '🌿', '🐶 🐱 🐭 🐹 🐰 🦊 🐻 🐼 🐨 🐯 🦁 🐮 🐷 🐸 🐵 🐔 🐧 🐦 🐤 🦆 🦅 🦉 🐴 🦄 🐝 🦋 🐌 🐞 🐢 🐍 🐙 🐠 🐟 🐬 🐳 🦈 🐊 🐘 🦒 🐕 🐈 🐾 🌵 🎄 🌲 🌳 🌴 🌱 🌿 ☘️ 🍀 🍃 🍂 🍁 🍄 🌾 💐 🌷 🌹 🥀 🌺 🌸 🌼 🌻 🌞 🌝 🌙 🌎 🪐 ⭐ 🌟 ✨ ⚡ ☄️ 💥 🔥 🌈 ☀️ 🌤️ ⛅ 🌧️ ⛈️ 🌩️ ❄️ ☃️ 🌬️ 💨 💧 💦 🌊'.split(' ')],
  ['Comida', '🍎', '🍏 🍎 🍐 🍊 🍋 🍌 🍉 🍇 🍓 🫐 🍈 🍒 🍑 🥭 🍍 🥥 🥝 🍅 🍆 🥑 🥦 🥬 🥒 🌶️ 🌽 🥕 🧄 🧅 🥔 🍠 🥐 🍞 🥖 🧀 🥚 🍳 🥞 🧇 🥓 🥩 🍗 🍖 🌭 🍔 🍟 🍕 🥪 🌮 🌯 🥗 🍝 🍜 🍲 🍛 🍣 🍱 🥟 🍤 🍙 🍚 🍰 🎂 🧁 🥧 🍫 🍬 🍭 🍮 🍯 🍩 🍪 🥜 ☕ 🍵 🧃 🥤 🧋 🍺 🍻 🥂 🍷 🍸 🍹 🧉 🍾 🥛 💧'.split(' ')],
  ['Atividades', '⚽', '⚽ 🏀 🏈 ⚾ 🎾 🏐 🏉 🥏 🎱 🏓 🏸 🥊 🥋 ⛳ 🎣 🤿 🎽 🛹 ⛸️ 🎿 🏋️ 🤸 🚴 🏊 🧗 🏆 🥇 🥈 🥉 🏅 🎖️ 🎗️ 🎫 🎟️ 🎭 🎨 🎬 🎤 🎧 🎼 🎹 🥁 🎷 🎺 🎸 🎻 🎲 ♟️ 🎯 🎳 🎮 🧩 🎰 🎁 🎈 🎉 🎊 🪅'.split(' ')],
  ['Viagem', '✈️', '🚗 🚕 🚙 🚌 🏎️ 🚓 🚑 🚒 🚚 🚜 🛵 🏍️ 🚲 🛴 🚨 🚆 🚇 🚊 ✈️ 🛫 🛬 🚁 🚀 🛸 ⛵ 🚤 🛳️ ⚓ ⛽ 🚧 🗺️ 🧭 🏔️ ⛰️ 🌋 🏕️ 🏖️ 🏝️ 🏜️ 🏟️ 🏛️ 🏗️ 🏘️ 🏠 🏡 🏢 🏬 🏣 🏥 🏦 🏨 🏪 🏫 🏛️ ⛪ 🕌 🗼 🗽 🎡 🎢 🌅 🌄 🌇 🌃 🌉'.split(' ')],
  ['Objetos', '💡', '⌚ 📱 💻 ⌨️ 🖥️ 🖨️ 🖱️ 💾 💿 📷 📹 🎥 📞 ☎️ 📺 📻 🎙️ ⏰ ⏱️ ⏳ ⌛ 📡 🔋 🔌 💡 🔦 🕯️ 🧯 🛢️ 💸 💵 💴 💶 💷 🪙 💰 💳 💎 ⚖️ 🧰 🔧 🔨 ⚒️ 🛠️ ⛏️ 🪛 🔩 ⚙️ 🧱 ⛓️ 🧲 🔫 💣 🔪 🗡️ ⚔️ 🛡️ 🔮 🧿 💈 ⚗️ 🔭 🔬 🩺 💊 💉 🩹 🧬 🦠 🧪 🌡️ 🧹 🧺 🧻 🚽 🛁 🧼 🪥 🧽 🛎️ 🔑 🗝️ 🚪 🛋️ 🛏️ 🧸 🖼️ 🛍️ 🛒 🎁 ✉️ 📩 📨 📧 💌 📮 📦 🏷️ 📪 📫 📬 📭 📜 📃 📄 📑 🧾 📊 📈 📉 🗒️ 🗓️ 📆 📅 🗑️ 📇 🗃️ 🗳️ 🗄️ 📋 📁 📂 🗂️ 🗞️ 📰 📓 📔 📒 📕 📗 📘 📙 📚 📖 🔖 🧷 🔗 📎 🖇️ 📐 📏 🧮 📌 📍 ✂️ 🖊️ 🖋️ ✒️ 🖌️ 🖍️ 📝 ✏️ 🔍 🔎 🔏 🔐 🔒 🔓'.split(' ')],
  ['Símbolos', '❤️', '❤️ 🧡 💛 💚 💙 💜 🖤 🤍 🤎 💔 ❣️ 💕 💞 💓 💗 💖 💘 💝 ☮️ ✝️ ☯️ 🕉️ ♈ ♉ ♊ ♋ ♌ ♍ ♎ ♏ ♐ ♑ ♒ ♓ ⛎ 🆔 ⚛️ 🉑 ☢️ ☣️ 📴 📳 ✴️ 🆚 💮 🅰️ 🅱️ 🆎 🆑 🅾️ 🆘 ❌ ⭕ 🛑 ⛔ 📛 🚫 💯 💢 ♨️ 🚷 🚯 🚳 🚱 🔞 📵 🚭 ❗ ❕ ❓ ❔ ‼️ ⁉️ 🔅 🔆 〽️ ⚠️ 🚸 🔱 ⚜️ 🔰 ♻️ ✅ 🈯 💹 ❇️ ✳️ ❎ 🌐 💠 Ⓜ️ 🌀 💤 🏧 🚾 ♿ 🅿️ 🚹 🚺 🚼 🚻 🚮 🎦 📶 🔣 ℹ️ 🔤 🔡 🔠 🆖 🆗 🆙 🆒 🆕 🆓 0️⃣ 1️⃣ 2️⃣ 3️⃣ 4️⃣ 5️⃣ 6️⃣ 7️⃣ 8️⃣ 9️⃣ 🔟 🔢 #️⃣ *️⃣ ▶️ ⏸️ ⏯️ ⏹️ ⏺️ ⏭️ ⏮️ ⏩ ⏪ 🔀 🔁 🔂 ◀️ 🔼 🔽 ➡️ ⬅️ ⬆️ ⬇️ ↗️ ↘️ ↙️ ↖️ ↕️ ↔️ ↪️ ↩️ ⤴️ ⤵️ 🔃 🔄 ➕ ➖ ➗ ✖️ ♾️ 💲 💱 ™️ ©️ ®️ 〰️ ➰ ➿ 🔚 🔙 🔛 🔝 🔜 ✔️ ☑️ 🔘 🔴 🟠 🟡 🟢 🔵 🟣 ⚫ ⚪ 🟤 🔺 🔻 🔸 🔹 🔶 🔷 🔳 🔲 ▪️ ▫️ ◾ ◽ ◼️ ◻️ 🟥 🟧 🟨 🟩 🟦 🟪 ⬛ ⬜ 🟫 🔈 🔇 🔉 🔊 🔔 🔕 📣 📢 💬 💭 🗯️ ♠️ ♣️ ♥️ ♦️ 🃏 🎴 🀄 🕐 🕑 🕒 🕓 🕔 🕕 🕖 🕗 🕘 🕙 🕚 🕛'.split(' ')],
  ['Bandeiras', '🏁', '🏁 🚩 🎌 🏴 🏳️ 🏳️‍🌈 🇧🇷 🇵🇹 🇺🇸 🇬🇧 🇪🇸 🇫🇷 🇮🇹 🇩🇪 🇦🇷 🇨🇱 🇺🇾 🇵🇾 🇨🇴 🇲🇽 🇨🇦 🇯🇵 🇨🇳 🇰🇷 🇮🇳 🇦🇺 🇿🇦 🇳🇱 🇨🇭 🇸🇪 🇳🇴 🇮🇪'.split(' ')],
];
/* palavras-chave em português para a busca */
const EMO_KW = {
  '📅': 'calendario data agenda', '🗓️': 'calendario agenda', '📆': 'calendario', '⏰': 'alarme despertador hora', '✅': 'feito ok check concluido', '⭐': 'estrela favorito', '❤️': 'coracao amor', '🔥': 'fogo urgente quente', '💡': 'ideia lampada', '📌': 'fixar alfinete', '📎': 'clipe anexo', '📝': 'nota anotar escrever', '✏️': 'lapis editar', '📚': 'livros estudo', '📖': 'livro leitura ler', '💼': 'trabalho maleta', '🏠': 'casa lar', '🛒': 'compras mercado carrinho', '💰': 'dinheiro financas', '💳': 'cartao pagamento', '🏋️': 'academia treino', '🏃': 'correr corrida', '🚶': 'caminhar andar', '🍎': 'fruta maca saude', '💊': 'remedio saude', '🩺': 'medico saude', '✈️': 'viagem aviao', '🚗': 'carro', '🎯': 'meta objetivo alvo', '🚀': 'foguete projeto lancamento', '🎉': 'festa comemorar', '🎂': 'aniversario bolo', '🎁': 'presente', '📊': 'grafico relatorio', '📈': 'grafico crescimento', '💻': 'computador notebook', '📱': 'celular telefone', '📞': 'telefone ligar', '✉️': 'email carta', '📧': 'email', '🔒': 'cadeado seguro privado', '🔑': 'chave senha', '⚠️': 'aviso atencao', '❗': 'importante exclamacao', '❓': 'pergunta duvida', '🧹': 'limpeza faxina', '🐶': 'cachorro pet', '🐱': 'gato pet', '🌱': 'planta crescimento', '☕': 'cafe', '🍽️': 'comida refeicao', '🎵': 'musica', '🎧': 'musica fone', '🎨': 'arte desenho', '🛠️': 'ferramentas manutencao', '🔧': 'chave ferramenta manutencao', '🧾': 'recibo nota conta', '🏦': 'banco', '🏥': 'hospital', '🏫': 'escola', '🎓': 'formatura estudo', '👨‍👩‍👧': 'familia', '👪': 'familia', '💤': 'dormir sono', '🧘': 'meditar yoga', '📦': 'caixa pacote entrega', '🗂️': 'pasta arquivo', '📁': 'pasta', '📂': 'pasta aberta', '🏆': 'trofeu conquista', '💬': 'conversa mensagem', '🙏': 'obrigado orar', '👍': 'positivo joinha', '😀': 'feliz sorriso', '😂': 'rindo', '😍': 'apaixonado', '😎': 'legal oculos', '🤔': 'pensando', '😴': 'dormindo', '🇧🇷': 'brasil'
};
function emojiPicker(anchor, done, opts = {}) {
  let rec = [];
  try { rec = JSON.parse(localStorage.getItem('tt_emo') || '[]'); } catch (e) {}
  EMO_CATS[0][2] = rec;
  let cat = rec.length ? 0 : 1, q = '';
  const el = pop(anchor, `<div class="emop"><div class="emos"><input class="in sm" placeholder="Buscar emoji (ex.: casa, dinheiro)" aria-label="Buscar emoji">${opts.none ? `<button class="btn ghost sm" data-none>Sem ícone</button>` : ''}</div><div class="emtabs">${EMO_CATS.map((c, i) => `<button data-c="${i}" title="${c[0]}" aria-label="${c[0]}">${c[1]}</button>`).join('')}</div><div class="emgrid"></div><div class="row"><input class="in sm f1" placeholder="Ou cole/digite qualquer emoji" maxlength="8" data-own aria-label="Emoji personalizado"><button class="btn sm" data-ok>Usar</button></div></div>`, { cls: 'emopop', right: opts.right });
  const grid = el.querySelector('.emgrid'), inp = el.querySelector('.emos input');
  const draw = () => {
    let list;
    if (q) { const n = norm(q); const all = [...new Set(EMO_CATS.slice(1).flatMap(c => c[2]))]; list = all.filter(e => (EMO_KW[e] || '').includes(n)); if (!list.length) list = all.filter(e => norm(EMO_KW[e] || '').split(' ').some(w => w.startsWith(n))); }
    else list = EMO_CATS[cat][2];
    grid.innerHTML = list.length ? list.map(e => `<button data-e="${e}">${e}</button>`).join('') : `<p class="hint pad">${q ? 'Nada encontrado. Cole o emoji no campo abaixo.' : 'Nenhum emoji recente.'}</p>`;
    el.querySelectorAll('[data-c]').forEach(b => b.classList.toggle('on', !q && +b.dataset.c === cat));
  };
  const pick = e => { rec = [e, ...rec.filter(x => x !== e)].slice(0, 32); try { localStorage.setItem('tt_emo', JSON.stringify(rec)); } catch (x) {} closePop(); done(e); };
  draw();
  inp.oninput = () => { q = inp.value.trim(); draw(); };
  el.addEventListener('click', e => {
    const c = e.target.closest('[data-c]'), b = e.target.closest('[data-e]');
    if (c) { cat = +c.dataset.c; q = ''; inp.value = ''; draw(); }
    if (b) pick(b.dataset.e);
    if (e.target.closest('[data-none]')) { closePop(); done(null); }
    if (e.target.closest('[data-ok]')) { const v = el.querySelector('[data-own]').value.trim(); if (v) pick(v); }
  });
  if (!isMobile()) setTimeout(() => inp.focus(), 30);
  return el;
}
