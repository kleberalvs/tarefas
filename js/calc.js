/* Fórmulas: em qualquer campo de texto do app (título e descrição de tarefas, notas, documentos…),
   digite uma conta e "=" que o resultado aparece na hora. Ex.: 2*1555= → 3.110 · 25+10= → 35 · 1.500*10%= → 150.
   Aceita + − * x × / ÷ ^ % e parênteses, números no formato brasileiro (1.555,50) e as palavras
   "mais", "menos", "vezes", "dividido por". */
'use strict';
function calcNum(s) {
  s = s.trim();
  if (s.includes(',')) return parseFloat(s.replace(/\./g, '').replace(',', '.'));
  if (/^\d{1,3}(\.\d{3})+$/.test(s)) return parseFloat(s.replace(/\./g, ''));
  return parseFloat(s);
}
function calcEval(src) {
  const toks = []; let i = 0;
  const s = src.replace(/[×xX]/g, '*').replace(/[÷:]/g, '/').replace(/[−–]/g, '-');
  while (i < s.length) {
    const c = s[i];
    if (/\s/.test(c)) { i++; continue; }
    const m = s.slice(i).match(/^\d[\d.,]*/);
    if (m) { const v = calcNum(m[0]); if (isNaN(v)) return null; toks.push({ n: v }); i += m[0].length; continue; }
    if ('+-*/^%()'.includes(c)) { toks.push({ o: c }); i++; continue; }
    return null;
  }
  let p = 0;
  const peek = () => toks[p], take = () => toks[p++];
  const prim = () => {
    const t = take(); if (!t) throw 0;
    if (t.o === '-') return -prim();
    if (t.o === '+') return prim();
    if (t.o === '(') { const v = add(); if (!peek() || peek().o !== ')') throw 0; p++; return post(v); }
    if (t.n != null) return post(t.n);
    throw 0;
  };
  const post = v => { while (peek() && peek().o === '%') { p++; v = v / 100; } return v; };
  const pow = () => { let v = prim(); if (peek() && peek().o === '^') { p++; v = Math.pow(v, pow()); } return v; };
  const mul = () => { let v = pow(); while (peek() && (peek().o === '*' || peek().o === '/')) { const o = take().o, r = pow(); v = o === '*' ? v * r : v / r; } return v; };
  const add = () => { let v = mul(); while (peek() && (peek().o === '+' || peek().o === '-')) { const o = take().o, r = mul(), pct = toks[p - 1] && toks[p - 1].o === '%'; v = pct ? v * (o === '+' ? 1 + r : 1 - r) : o === '+' ? v + r : v - r; } return v; };
  try { const v = add(); if (p !== toks.length || !isFinite(v)) return null; if (!toks.some(t => t.o && t.o !== '(' && t.o !== ')')) return null; return v; } catch (e) { return null; }
}
/* pega a conta que termina logo antes do "=" e devolve o resultado formatado */
function calcFrom(before) {
  let t = before.split('\n').pop();
  t = t.replace(/\s+dividido\s+por\s+/gi, ' / ').replace(/\s+vezes\s+/gi, ' * ').replace(/\s+mais\s+/gi, ' + ').replace(/\s+menos\s+/gi, ' - ');
  const m = t.match(/[\d(][\d\s.,+\-−–*xX×/÷^%()]*$/);
  if (!m) return null;
  let ex = m[0].replace(/^[\s*xX×/÷^%+]+/, '');
  if (!/\d/.test(ex) || !/[+\-−–*xX×/÷^%]/.test(ex.replace(/^-/, ''))) return null;
  const v = calcEval(ex); if (v == null) return null;
  const money = /\d,\d{2}(?!\d)/.test(ex) && Math.round(v * 100) === Math.round(v * 1e6) / 1e4;
  return v.toLocaleString('pt-BR', money ? { minimumFractionDigits: 2, maximumFractionDigits: 2 } : { maximumFractionDigits: 6 });
}
document.addEventListener('input', e => {
  if (!e.inputType || !e.inputType.startsWith('insert')) return;
  const el = e.target;
  if (el.closest && el.closest('[data-nocalc]')) return;
  if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
    if (el.tagName === 'INPUT' && !/^(text|search|)$/.test(el.type || '')) return;
    const pos = el.selectionStart; if (pos == null || el.value[pos - 1] !== '=') return;
    if (el.value.slice(pos).trim()) return;
    const r = calcFrom(el.value.slice(0, pos - 1)); if (r == null) return;
    el.setRangeText(r, pos, pos, 'end');
    el.dispatchEvent(new Event('input', { bubbles: true }));
    return;
  }
  const ed = el.isContentEditable ? el : null; if (!ed) return;
  const sel = getSelection(); if (!sel.rangeCount) return;
  const rg = sel.getRangeAt(0), n = rg.startContainer;
  if (n.nodeType !== 3 || rg.startOffset < 1 || n.nodeValue[rg.startOffset - 1] !== '=') return;
  const r = calcFrom(n.nodeValue.slice(0, rg.startOffset - 1)); if (r == null) return;
  document.execCommand('insertText', false, r);
}, true);
