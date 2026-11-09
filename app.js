/* ==========================================================
   LEMBRARR!! =   Estado, fórmulas e interface. Os dados do sistema ficam em data.js.
   ========================================================== */
(() => {
'use strict';
const L = window.LUPIN;

/* ---------- umas utilidades pra usar por aqui ---------- */
const $ = (s, r = document) => r.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
const uid = () => Math.random().toString(36).slice(2, 9);
const sg = n => (n >= 0 ? '+' : '−') + Math.abs(n);
const tip = t => ` data-tip="${esc(t)}"`;

/* ---------- dados derivados do sistema  */
const AREA = k => L.AREAS.find(a => a.key === k);
const FIELDS = L.AREAS.flatMap(a => a.campos.map((f, i) => ({ ...f, id: `${a.key}.${i}`, area: a.key, areaNome: a.nome })));
const FBY = id => FIELDS.find(f => f.id === id);
const EQ = id => L.EQUIP.find(e => e.id === id);
const nucleoItems = a => a.nucleo.split(' · ').map(s => { const m = s.match(/^(.*?) \((.*)\)\.?$/); return { n: m ? m[1] : s, d: m ? m[2] : '' }; });

/* -------- estado e salvamento, por aqui --------- */
const KEY = 'lupin.ficha.v1';
const blank = () => ({
  id: uid(), nome: '', idade: '', origem: 'DEIC', conceito: '', formacao: '', modo: 'criacao',
  area: 'inteligencia', principal: 'inteligencia.0',
  attrs: { FOR: 1, DES: 1, CON: 1, PER: 1, INT: 1, CAR: 1 },
  lvl: { 'inteligencia.0': 2 }, pre: {}, pxTotal: L.CRIACAO.px,
  cargo: 1, meritos: 0, dano: 0, estresse: 0, cred: 5, abalado: false, recursosUsados: 0,
  motivacao: '', vinculo: '', aspectos: [], contatos: [{ nome: '', nota: '', usado: false }, { nome: '', nota: '', usado: false }],
  equip: {}, notas: '', segredos: [], sessoes: [], rolls: [], portrait: null
});
const normalize = c => {
  const b = blank(), n = Object.assign(b, c);
  n.attrs = Object.assign(b.attrs, c.attrs || {});
  if (!AREA(n.area)) n.area = 'inteligencia';
  if (!FBY(n.principal)) n.principal = `${n.area}.0`;
  return n;
};
let DB = (() => {
  try {
    const d = JSON.parse(localStorage.getItem(KEY));
    if (d && d.chars && d.chars[d.active]) { Object.keys(d.chars).forEach(k => d.chars[k] = normalize(d.chars[k])); return d; }
  } catch (e) { /* sem armazenamento: segue em memória */ }
  const c = blank();
  return { active: c.id, chars: { [c.id]: c } };
})();
let C = DB.chars[DB.active];
let saveT;
const save = () => {
  clearTimeout(saveT);
  saveT = setTimeout(() => {
    try { localStorage.setItem(KEY, JSON.stringify(DB)); $('#status').textContent = 'Salvo neste aparelho'; }
    catch (e) { $('#status').textContent = 'Sem armazenamento: exporte o arquivo'; }
  }, 200);
};

/* -------- FÓRMULAS ---------- */
const free = (c, id) => Math.max(id === c.principal ? 2 : 0, c.pre[id] || 0);
const lvl = (c, id) => Math.max(free(c, id), c.lvl[id] || 0);
const mult = (c, f) => f.area === c.area ? 1 : 2;
const costOf = (c, f, m) => L.CUSTO[m - 1] * mult(c, f);
const spent = c => FIELDS.reduce((s, f) => { let t = 0; for (let m = free(c, f.id) + 1; m <= lvl(c, f.id); m++) t += costOf(c, f, m); return s + t; }, 0);
const pxLeft = c => c.pxTotal - spent(c);
const nuc = c => Math.min(5, 1 + AREA(c.area).campos.filter((f, i) => lvl(c, `${c.area}.${i}`) >= 3).length);
const attrSum = c => Object.values(c.attrs).reduce((a, b) => a + b, 0);
const attrCap = c => c.modo === 'criacao' ? L.CRIACAO.teto : L.CRIACAO.tetoJogo;
const poolLeft = c => L.CRIACAO.base + L.CRIACAO.pontos - attrSum(c);
const marcosTotal = c => FIELDS.reduce((s, f) => s + lvl(c, f.id), 0);
const especialistas = c => FIELDS.filter(f => lvl(c, f.id) === 5);
const credFaixa = v => L.CRED.find(f => v >= f.min && v <= f.max);
const derive = c => {
  const a = c.attrs, cg = L.CARGOS[c.cargo];
  return { saudeMax: 5 + a.CON, defesa: 6 + a.DES, res: 6 + a.CAR, ini: a.DES + a.PER, recMax: cg.rec, aut: cg.aut, estMax: 6 };
};
const hpNow = c => clamp(derive(c).saudeMax - c.dano, 0, derive(c).saudeMax);
const hpEstado = c => {
  const m = derive(c).saudeMax, h = hpNow(c);
  if (h <= 0) return { k: 'fora', n: 'Fora de combate', d: 'Inconsciente. Teste de CON (Dif. 9) por rodada para estabilizar.' };
  if (h <= 2) return { k: 'critico', n: 'Crítico', d: '−2 em todos os testes. Teste de CON (Dif. 9) por cena para não desmaiar.' };
  if (h <= m / 2) return { k: 'ferido', n: 'Ferido', d: '−1 em todos os testes físicos.' };
  return { k: 'sao', n: 'Saudável', d: 'Sem penalidades.' };
};
const armadura = c => Math.max(0, ...L.EQUIP.filter(e => e.tipo === 'prot' && c.equip[e.id]).map(e => e.red));
const canBuyIn = (c, ak) => AREA(ak).campos.some((f, i) => { const id = `${ak}.${i}`, l = lvl(c, id); return l < 5 && pxLeft(c) >= costOf(c, FBY(id), l + 1); });
const promoOk = c => c.cargo < 5 && c.meritos >= L.CARGOS[c.cargo + 1].mer;
const judge = (total, dif) => {
  if (total >= dif) { const m = total - dif; return m >= 8 ? { n: 'Sucesso brilhante', bad: false, m, d: 'Detalhe extra e uma vantagem para a próxima ação da equipe.' } : m >= 4 ? { n: 'Sucesso forte', bad: false, m, d: 'Faz o que pretendia e ganha um detalhe extra.' } : { n: 'Sucesso simples', bad: false, m, d: 'Faz o que pretendia. Nada mais.' }; }
  const m = dif - total;
  return m >= 4 ? { n: 'Falha grave', bad: true, m: -m, d: 'Complicação grave. O relógio do Lupin pode avançar.' } : { n: 'Falha leve', bad: true, m: -m, d: 'Complicação leve: atraso, Estresse ou testemunha desconfiada.' };
};

/* -------- interface: estado das abas fica aqui ------- */
const TABS = [
  { id: 'agente',   n: 'Agente',      subs: [['ident', 'Identidade'], ['attr', 'Atributos'], ['vitais', 'Vitais']] },
  { id: 'pericias', n: 'Perícias',    subs: L.AREAS.map(a => [a.key, a.nome]) },
  { id: 'funcao',   n: 'Função',      subs: [['cargo', 'Cargo e Méritos'], ['aspectos', 'Aspectos'], ['contatos', 'Contatos']] },
  { id: 'equip',    n: 'Equipamento', subs: [['catalogo', 'Catálogo'], ['mochila', 'Mochila e Combate']] },
  { id: 'dados',    n: 'Dados',       subs: [['teste', 'Fazer teste'], ['historico', 'Histórico']] },
  { id: 'diario',   n: 'Diário',      subs: [['notas', 'Notas'], ['segredos', 'Segredos'], ['sessoes', 'Sessões e PX']] },
  { id: 'opcoes',   n: 'Opções',      subs: [['arquivo', 'Arquivo'], ['regras', 'Regras rápidas']] }
];
const ui = {
  tab: 'agente', sub: {}, fold: {}, pop: null, bump: null,
  roll: { attr: 'INT', campo: '', aspecto: false, ajuda: 0, circ: 0, equip: 0, tipo: 'ger', modo: 'n', dif: 9, golpe: false },
  last: null, sess: { obj: true, pista: false, dec: false, compel: 0, nota: '' }, segTxt: ''
};
const tabDef = () => TABS.find(t => t.id === ui.tab);
const curSub = () => ui.sub[ui.tab] || (ui.tab === 'pericias' ? C.area : tabDef().subs[0][0]);
const subIndex = () => Math.max(0, tabDef().subs.findIndex(s => s[0] === curSub()));

/* ------- retrato (um rascunho a lápis, bem simples) ---------- */
const portraitSVG = () => `<svg viewBox="0 0 300 372" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Retrato a lápis de um detetive">
<defs><filter id="pen"><feTurbulence type="fractalNoise" baseFrequency=".04" numOctaves="2" seed="7"/><feDisplacementMap in="SourceGraphic" scale="3"/></filter>
<pattern id="hatch" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(40)"><line x1="0" y1="0" x2="0" y2="6" stroke="#3b3128" stroke-width="1.1" opacity=".55"/></pattern></defs>
<rect width="300" height="372" fill="#efe6cd"/>
<g filter="url(#pen)" fill="none" stroke="#2a2118" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round">
<path d="M14 372C26 312 66 292 112 280L188 280C234 292 274 312 286 372Z" fill="url(#hatch)"/>
<path d="M112 280L150 338L188 280"/><path d="M126 280L150 326L174 280Z" fill="#efe6cd"/>
<path d="M144 298L156 298L160 346L150 358L140 346Z" fill="#8e1f17"/>
<path d="M126 248L126 284Q150 300 174 284L174 248" fill="#efe6cd"/>
<path d="M104 168C102 218 124 260 150 264C176 260 198 218 196 168Z" fill="#f3ead2"/>
<path d="M104 188q-12 6-6 22q4 8 8 4"/><path d="M196 188q12 6 6 22q-4 8-8 4"/>
<path d="M120 186q12-7 24-1"/><path d="M158 185q12-6 24 1"/>
<path d="M124 197q8-5 16 0q-8 4-16 0Z" fill="#2a2118"/><path d="M160 197q8-5 16 0q-8 4-16 0Z" fill="#2a2118"/>
<path d="M150 194q-6 22-10 28q8 5 20 0"/><path d="M134 240q16 6 32 0"/>
<path d="M112 224C120 260 180 260 188 224C176 244 124 244 112 224Z" fill="url(#hatch)" stroke="none"/>
<path d="M68 166C80 148 120 140 150 140C180 140 220 148 232 166C200 174 100 174 68 166Z" fill="#efe6cd"/>
<path d="M98 158C98 106 120 82 150 82C182 82 202 106 202 158C180 150 120 150 98 158Z" fill="url(#hatch)"/>
<path d="M100 148C130 140 170 140 200 148L201 136C170 128 130 128 99 136Z" fill="#2a2118"/>
<path d="M124 88C140 98 162 98 178 88"/>
<path d="M106 168C130 180 170 180 194 168L194 182C170 190 130 190 106 182Z" fill="#2a2118" opacity=".5" stroke="none"/>
</g></svg>`;

/* ---------- helpers pra montar os títulos ------- */
const head = (chap, title, sub) => `<div class="chapno">${chap}</div><h1>${title}</h1><p class="sub">${sub}</p>`;
const pips = (n, on, key, cls = '') => Array.from({ length: n }, (_, i) =>
  `<button class="pip ${cls} ${i < on ? 'on' : ''} ${ui.pop === key + (i + 1) ? 'new' : ''}" data-act="pip" data-k="${key}" data-v="${i + 1}" aria-label="${key} ${i + 1}"></button>`).join('');

function derivedGrid() {
  const d = derive(C), a = C.attrs, cg = L.CARGOS[C.cargo], cf = credFaixa(C.cred);
  const items = [
    ['Saúde máx.', d.saudeMax, `5 + CON ${a.CON}`, 'Saúde|5 + CON\n5 + ' + a.CON + ' = ' + d.saudeMax + '\nZero é fora de combate.'],
    ['Defesa', d.defesa, `6 + DES ${a.DES}`, 'Defesa|6 + DES\n6 + ' + a.DES + ' = ' + d.defesa + '\nDificuldade para ser acertado em combate.'],
    ['Resist. social', d.res, `6 + CAR ${a.CAR}`, 'Resistência social|6 + CAR\n6 + ' + a.CAR + ' = ' + d.res + '\nDificuldade para ser pressionado ou enganado.'],
    ['Iniciativa', d.ini, `DES ${a.DES} + PER ${a.PER}`, 'Iniciativa|DES + PER\n' + a.DES + ' + ' + a.PER + ' = ' + d.ini + '\nMaior age primeiro (se ninguém surpreendeu).'],
    ['Autoridade', d.aut, `Cargo ${cg.n}`, 'Autoridade|Igual ao número do Cargo.\nSoma-se a testes de ordem, requisição e acesso.'],
    ['Recursos', d.recMax, `Cargo ${cg.n}`, 'Recursos Institucionais|Reserva igual ao valor do Cargo.\nRecuperam ao fim de cada ato.'],
    ['Estresse', d.estMax, 'limite fixo', 'Estresse|Todos têm limite 6.\nAo chegar em 6 há colapso.'],
    ['Credibilidade', C.cred, cf.n, 'Credibilidade|De 0 a 10, começa em 5.\n' + cf.d]
  ];
  return `<div class="derived">${items.map(i => `<div class="dv" tabindex="0"${tip(i[3])}><b>${i[0]}</b><span>${i[1]}</span><small>${i[2]}</small></div>`).join('')}</div>`;
}

/* ==========================================================
   PÁGINA ESQUERD - retrato e vitais
   ========================================================== */
function renderLeft() {
  const d = derive(C), a = AREA(C.area), cg = L.CARGOS[C.cargo], hp = hpNow(C), he = hpEstado(C), cf = credFaixa(C.cred);
  const px = pxLeft(C), esp = especialistas(C).length;
  const est = C.estresse >= 6 ? 'Colapso! Resolva em Vitais.' : C.abalado ? 'Abalado (−1 em tudo)' : 'Sob controle';
  $('#pageL').innerHTML = `
  <button class="polaroid" data-act="portrait"${tip('Retrato|Clique para enviar uma foto.\nEla vira um rascunho a lápis.')}>
    <i class="tape"></i><div class="ph">${C.portrait ? `<img src="${C.portrait}" alt="Retrato do agente">` : portraitSVG()}</div>
    <span class="cap">${esc(a.nome)} · 2001</span>
  </button>
  <div class="who">
    <h2>${esc(C.nome || 'Agente sem nome')}</h2>
    <p>${esc(C.conceito || '“Quem é você antes do caso?”')}</p>
    <div class="chips">
      <span class="chip"${tip('Órgão de origem')}>${esc(C.origem)}</span>
      <span class="chip o"${tip('Área|' + a.desc)}>${esc(a.nome)}</span>
      <span class="chip"${tip('Cargo ' + cg.n + '|Autoridade ' + cg.aut + ' · Recursos ' + cg.rec)}>${esc(C.origem === 'FBI' ? cg.fbi : cg.deic)}</span>
      <span class="chip ${px > 0 ? 'g' : ''}"${tip('PX disponíveis|Total ' + C.pxTotal + ' − gastos ' + spent(C) + ' = ' + px)}>${px} PX</span>
      ${esp ? `<span class="chip r"${tip('Especialista|Campo(s) a 100%: ' + especialistas(C).map(f => f.nome).join(', '))}>Especialista ×${esp}</span>` : ''}
    </div>
  </div>
  <div class="meters">
    <div class="meter"><div class="meter-h"><b>Saúde</b><span>${hp}/${d.saudeMax}</span></div>
      <div class="pips">${pips(d.saudeMax, hp, 'saude', 'r')}</div><small>${he.n}</small></div>
    <div class="meter"><div class="meter-h"><b>Estresse</b><span>${C.estresse}/6</span></div>
      <div class="pips">${pips(6, C.estresse, 'estresse', 'o')}</div><small>${est}</small></div>
    <div class="meter"><div class="meter-h"><b>Credibilidade</b><span>${C.cred}/10</span></div>
      <div class="pips">${pips(10, C.cred, 'cred', '')}</div><small>${cf.n}${cf.mod ? ' (' + sg(cf.mod) + ' social)' : ''}</small></div>
  </div>`;
}

/* ==========================================================
   PÁGINA DIREITA conteúdo de cada seção
   ========================================================== */
function rIdent() {
  const a = AREA(C.area);
  return head('Passo 1 e 3 · Conceito e Área', 'Identidade', 'Quem era seu agente antes do caso, e o que ele sabe fazer. Idade e tempo de serviço são história, não pontos.') + `
  <div class="grid2">
    <label class="fl"><span>Nome</span><input class="in" data-bind="nome" value="${esc(C.nome)}" autocomplete="off" placeholder="Helena Prado"></label>
    <label class="fl"><span>Idade</span><input class="in" data-bind="idade" value="${esc(C.idade)}" inputmode="numeric" placeholder="34"></label>
    <label class="fl"><span>Órgão de origem</span><select class="sel" data-bind="origem"><option ${C.origem === 'DEIC' ? 'selected' : ''}>DEIC</option><option ${C.origem === 'FBI' ? 'selected' : ''}>FBI</option></select></label>
    <label class="fl"><span>Modo da ficha</span><select class="sel" data-bind="modo"><option value="criacao" ${C.modo === 'criacao' ? 'selected' : ''}>Criação (10 pontos, máx. 4)</option><option value="jogo" ${C.modo === 'jogo' ? 'selected' : ''}>Em jogo (máx. 5)</option></select></label>
  </div>
  <label class="fl"><span>Frase que resume o agente</span><input class="in" data-bind="conceito" value="${esc(C.conceito)}" placeholder="Provar que os números mentem menos do que as pessoas."></label>
  <label class="fl"><span>O que estudou ou viveu (formação)</span><textarea class="ta" data-bind="formacao" placeholder="Estatística, seis anos em análise de fraudes antes do DEIC...">${esc(C.formacao)}</textarea></label>
  <h2 class="tape">Área e Campo Principal</h2>
  <div class="grid2">
    <label class="fl"><span>Área (sua classe)</span><select class="sel" data-on="area">${L.AREAS.map(x => `<option value="${x.key}" ${x.key === C.area ? 'selected' : ''}>${x.no}. ${x.nome}</option>`).join('')}</select></label>
    <label class="fl"><span>Campo Principal</span><select class="sel" data-on="principal">${a.campos.map((f, i) => `<option value="${a.key}.${i}" ${C.principal === `${a.key}.${i}` ? 'selected' : ''}>${f.nome}</option>`).join('')}</select></label>
  </div>
  <div class="bracket"><p><b>${esc(a.nome)}.</b> ${esc(a.desc)}</p></div>
  <div class="note"><b>Regra.</b> O Campo Principal começa no Marco 2 (40%) sem custo de PX. Ele é combinado com o mestre a partir da sua formação. Você recebe ${L.CRIACAO.px} PX iniciais para comprar outros marcos (veja a aba Perícias).</div>`;
}

function rAttr() {
  const left = poolLeft(C), crit = C.modo === 'criacao';
  const pool = crit ? `<div class="pool ${left === 0 ? 'ok' : left < 0 ? 'bad' : ''}"><span>Pontos para distribuir: ${Math.max(0, left)} de ${L.CRIACAO.pontos}</span><span>Total ${attrSum(C)} / ${L.CRIACAO.base + L.CRIACAO.pontos}</span></div>`
    : `<div class="pool"><span>Modo em jogo: sem reserva de pontos, teto ${attrCap(C)}.</span><span>Total ${attrSum(C)}</span></div>`;
  const html = head('Passo 2 · Atributos', 'Atributos', 'Seis números que dizem o que o corpo e a cabeça do agente aguentam. Todos começam em 1.') + pool + `
  <div class="attrs">${L.ATTRS.map(t => {
    const v = C.attrs[t.k], cp = attrCap(C), b = ui.bump === t.k ? 'bump' : '';
    return `<div class="attr" tabindex="0"${tip(t.n + '|' + t.d)}>
      <div class="sg">${t.k}</div><div class="nm">${t.n}</div><div class="vl ${b}">${v}</div>
      <div class="ctl"><button class="btn sm ico" data-act="attr" data-k="${t.k}" data-d="-1" aria-label="Diminuir ${t.n}">−</button><button class="btn sm ico" data-act="attr" data-k="${t.k}" data-d="1" aria-label="Aumentar ${t.n}">+</button></div>
      <div class="mini">${[1, 2, 3, 4, 5].map(i => `<i class="${i <= v ? 'on' : ''} ${i > cp ? 'cap' : ''}"></i>`).join('')}</div></div>`;
  }).join('')}</div>
  <h2 class="tape">Valores derivados</h2>${derivedGrid()}
  <div class="note"><b>Dica.</b> Passe o mouse (ou toque) em qualquer valor para ver a fórmula com os seus números.</div>`;
  ui.bump = null;
  return html;
}

function rVitais() {
  const d = derive(C), he = hpEstado(C), cf = credFaixa(C.cred), hp = hpNow(C);
  return head('Passo 7 · Trilhas', 'Vitais', 'Corpo, cabeça e nome. Três barras que medem o que o caso cobra de você.') + `
  <div class="grid3">
    <div class="card"><h4>Saúde ${hp}/${d.saudeMax}</h4><p class="typed">${he.n}</p><div class="row"><button class="btn sm ico" data-act="vit" data-k="dano" data-d="1" aria-label="Sofrer dano">−</button><button class="btn sm ico" data-act="vit" data-k="dano" data-d="-1" aria-label="Curar">+</button></div></div>
    <div class="card"><h4>Estresse ${C.estresse}/6</h4><p class="typed">${C.abalado ? 'Abalado' : 'Estável'}</p><div class="row"><button class="btn sm ico" data-act="vit" data-k="estresse" data-d="1" aria-label="Mais estresse">+</button><button class="btn sm ico" data-act="vit" data-k="estresse" data-d="-1" aria-label="Menos estresse">−</button></div></div>
    <div class="card"><h4>Credibilidade ${C.cred}/10</h4><p class="typed">${cf.n}</p><div class="row"><button class="btn sm ico" data-act="vit" data-k="cred" data-d="-1" aria-label="Perder credibilidade">−</button><button class="btn sm ico" data-act="vit" data-k="cred" data-d="1" aria-label="Ganhar credibilidade">+</button></div></div>
  </div>
  ${C.estresse >= 6 ? `<div class="note warn"><b>Colapso.</b> A próxima ação falha com complicação grave e o agente fica Abalado (−1 em tudo) até uma cena de descanso. Depois, o Estresse volta a 3.<div class="row" style="margin-top:8px"><button class="btn red" data-act="colapso">Registrar colapso</button></div></div>` : ''}
  <h2 class="tape">Descanso e recuperação</h2>
  <div class="row">
    <button class="btn" data-act="rest" data-r="noite"${tip('Noite de descanso|+1 ponto de Saúde.')}>Noite (+1 Saúde)</button>
    <button class="btn" data-act="rest" data-r="hospital"${tip('Hospital|+3 pontos de Saúde.')}>Hospital (+3 Saúde)</button>
    <button class="btn" data-act="rest" data-r="cena"${tip('Cena de descanso|Remove 2 de Estresse e o estado Abalado.')}>Cena de descanso (−2 Estresse)</button>
    <button class="btn" data-act="rest" data-r="folga"${tip('Folga completa|Zera o Estresse e remove Abalado.')}>Folga completa</button>
  </div>
  <h2 class="tape">Estado do corpo</h2>
  <div class="tw"><table class="t"><thead><tr><th>Estado</th><th>Quando</th><th>Efeito</th></tr></thead><tbody>
    ${[['sao', 'Saudável', 'Mais da metade', 'Sem penalidades.'], ['ferido', 'Ferido', 'Metade ou menos', '−1 em testes físicos.'], ['critico', 'Crítico', '2 ou menos', '−2 em todos os testes; CON Dif. 9 por cena.'], ['fora', 'Fora de combate', '0', 'Inconsciente; CON Dif. 9 por rodada.']].map(r => `<tr class="${he.k === r[0] ? 'cur' : ''}"><td>${r[1]}</td><td>${r[2]}</td><td>${r[3]}</td></tr>`).join('')}</tbody></table></div>
  <h2 class="tape">Faixas de credibilidade</h2>
  <div class="tw"><table class="t"><thead><tr><th>Faixa</th><th>Pontos</th><th>Efeito</th></tr></thead><tbody>
    ${L.CRED.map(f => `<tr class="${f === cf ? 'cur' : ''}"><td>${f.n}</td><td>${f.min} a ${f.max}</td><td>${f.d}</td></tr>`).join('')}</tbody></table></div>
  <div class="note"><b>Credibilidade zero:</b> o agente é afastado por uma sessão (sem Cargo, Recursos nem arquivos) e volta com 3.</div>`;
}

function fieldHTML(f) {
  const lv = lvl(C, f.id), fr = free(C, f.id), own = f.area === C.area, px = pxLeft(C);
  const open = ui.fold[f.id] ?? (lv > 0 || f.id === C.principal);
  const dots = [1, 2, 3, 4, 5].map(m => `<i class="${m <= lv ? (m === 5 ? 'sp' : 'on') : ''}"></i>`).join('');
  const rows = f.marcos.map((mk, i) => {
    const m = i + 1; let cls = 'lock', meta = '', t = '';
    const cost = costOf(C, f, m), x2 = mult(C, f) === 2 ? ' (×2: outra Área)' : '';
    if (m <= lv) { cls = 'own' + (m <= fr ? ' fr' : '') + (m === 5 ? ' spec' : ''); meta = `${L.PCT[i]}% · ${m <= fr ? 'liberado de graça' : 'comprado (' + cost + ' PX)'}`; t = m <= fr ? 'Marco liberado pelo mestre.' : 'Clique no marco mais alto para desfazer e recuperar os PX.'; }
    else if (m === lv + 1) { cls = px >= cost ? 'av' : 'lock'; meta = `${L.PCT[i]}% · ${cost} PX${x2}`; t = px >= cost ? `Comprar marco ${m}|Custa ${cost} PX. Você tem ${px}.` : `PX insuficientes|Custa ${cost} PX e você tem ${px}.`; }
    else { meta = `${L.PCT[i]}% · ${cost} PX${x2}`; t = 'Bloqueado|Compre os marcos em ordem.'; }
    return `<button class="mk ${cls}" data-act="mk" data-f="${f.id}" data-m="${m}"${tip(t)}>
      <span class="nd">${m}</span><span class="mk-t"><b>${esc(mk.nome)}</b><small>${meta}</small><span>${esc(mk.efeito)}</span></span><span class="mk-a"></span></button>`;
  }).join('');
  const pre = own && f.id !== C.principal ? `<label class="pre"${tip('Pré-liberação|O mestre pode liberar até 2 marcos soltos em outros Campos da sua Área, se a sua história justificar. Máximo de 2 Campos.')}>Pré-liberado <select data-on="pre" data-f="${f.id}">${[0, 1, 2].map(n => `<option ${((C.pre[f.id] || 0) === n) ? 'selected' : ''}>${n}</option>`).join('')}</select></label>` : '';
  return `<div class="field ${open ? 'open' : ''}">
    <button class="fh" data-act="fold" data-f="${f.id}" aria-expanded="${open}">
      <span class="fn"><b>${esc(f.nome)}${lv === 5 ? '<span class="spbadge">Especialista</span>' : ''}${f.id === C.principal ? ' ★' : ''}</b><small>${esc(f.resumo)} · ${f.attr}</small></span>
      <span class="mini5">${dots}</span><span class="lvl">${lv}</span><span class="arrow">▼</span></button>
    <div class="fold"><div>
      <div class="fmeta"><span>Atributo-chave: <b>${f.attr}</b> (${C.attrs[f.attr]}) · bônus no teste ${sg(C.attrs[f.attr] + lv)}</span>${pre}</div>
      ${rows}</div></div></div>`;
}

function rArea(key) {
  const a = AREA(key), own = key === C.area, items = nucleoItems(a);
  return `<div class="areahead"><div class="no">${a.no}</div><div><h1>${esc(a.nome)}</h1><p>${esc(a.desc)}</p><p class="typed" style="color:#cfc4a7">${own ? 'Sua Área: custo normal.' : 'Outra Área: custo dobrado.'}</p></div></div>
  <div class="px"><span class="chip g">Disponíveis ${pxLeft(C)} PX</span><span class="chip">Gastos ${spent(C)}</span><span class="chip">Total ${C.pxTotal}</span><span class="chip o"${tip('Marcos|' + marcosTotal(C) + ' de ' + FIELDS.length * 5 + ' marcos liberados.')}>${marcosTotal(C)}/${FIELDS.length * 5} marcos</span></div>
  <h3>Núcleo da Área ${own ? '' : '<small>(só vale na sua Área)</small>'}</h3>
  <div class="nuc">${items.map(n => `<div class="card"${tip('Núcleo|Nível 1, mais 1 para cada Campo da Área no Marco 3 ou mais. Teto 5.')}><span class="lv">${own ? 'Nível ' + nuc(C) : '—'}</span><h4>${esc(n.n)}</h4><p>${esc(n.d)}</p></div>`).join('')}</div>
  <h3>Campos</h3>${a.campos.map((f, i) => fieldHTML(FBY(`${a.key}.${i}`))).join('')}
  <div class="note"><b>Como comprar.</b> Toque no marco com o anel vermelho para comprar. Marcos vão em ordem, do 1 ao 5. Para desfazer, toque no marco mais alto que você comprou. Fora da sua Área o custo dobra: ${L.CUSTO.map((c, i) => `${c}${i < 4 ? ' · ' : ''}`).join('')} PX viram ${L.CUSTO.map((c, i) => `${c * 2}${i < 4 ? ' · ' : ''}`).join('')}.</div>`;
}

function rCargo() {
  const cg = L.CARGOS[C.cargo], nx = L.CARGOS[C.cargo + 1], d = derive(C);
  const pct = nx ? clamp((C.meritos / nx.mer) * 100, 0, 100) : 100;
  return head('Dimensão 3 · Cargo', 'Cargo e Méritos', 'Sua posição na força-tarefa. Sobe por Méritos, não por PX.') + `
  <div class="derived" style="grid-template-columns:repeat(4,minmax(0,1fr))">
    <div class="dv" tabindex="0"${tip('Cargo|' + cg.nome)}><b>Cargo</b><span>${cg.n}</span><small>${esc(C.origem === 'FBI' ? cg.fbi : cg.deic)}</small></div>
    <div class="dv" tabindex="0"${tip('Autoridade|Soma-se a testes de ordem, requisição e acesso institucional.\nCargo 3+: ordena agentes NPC.\nCargo 4+: mandados de urgência.')}><b>Autoridade</b><span>${d.aut}</span><small>= Cargo</small></div>
    <div class="dv" tabindex="0"${tip('Recursos|Reserva igual ao Cargo. Recuperam no fim de cada ato.')}><b>Recursos</b><span>${d.recMax - C.recursosUsados}/${d.recMax}</span><small>disponíveis</small></div>
    <div class="dv" tabindex="0"${tip('Méritos|Acumulam e não se perdem ao subir de Cargo.')}><b>Méritos</b><span>${C.meritos}</span><small>${nx ? 'próx. ' + nx.mer : 'máximo'}</small></div>
  </div>
  <div class="prog"${tip('Progresso|' + (nx ? C.meritos + ' de ' + nx.mer + ' Méritos para o Cargo ' + nx.n : 'Cargo máximo'))}><i style="width:${pct}%"></i></div>
  <div class="row"><button class="btn red ${promoOk(C) ? '' : 'off'}" data-act="cargo" data-d="1">Promover</button><button class="btn sm ${C.cargo > 1 ? '' : 'off'}" data-act="cargo" data-d="-1">Rebaixar</button></div>
  ${C.cargo >= 4 ? '<div class="note"><b>Escrutínio.</b> Nos Cargos 4 e 5, toda perda de Credibilidade custa 1 ponto a mais.</div>' : ''}
  <h2 class="tape">Registrar Méritos</h2>
  <div class="row">${L.MERITOS.map((m, i) => `<button class="btn sm ${m[1] < 0 ? 'red' : ''}" data-act="merito" data-i="${i}">${m[0]} ${sg(m[1])}</button>`).join('')}</div>
  <h2 class="tape">Recursos Institucionais</h2>
  <p class="typed">Gaste 1 para mandado rápido, apoio aéreo, equipe de apoio, laboratório, veículo extra ou arquivo restrito.</p>
  <div class="pips">${pips(d.recMax, d.recMax - C.recursosUsados, 'rec', 'sq')}</div>
  <div class="row" style="margin-top:6px"><button class="btn sm" data-act="fimato"${tip('Fim do ato|Recupera os Recursos e libera os Contatos usados.')}>Fim do ato</button></div>
  <h2 class="tape">Tabela de Cargos</h2>
  <div class="tw"><table class="t"><thead><tr><th>Cargo</th><th>${C.origem}</th><th>Aut.</th><th>Rec.</th><th>Méritos</th></tr></thead><tbody>
  ${L.CARGOS.slice(1).map(c => `<tr class="${c.n === C.cargo ? 'cur' : ''}"><td>${c.n} · ${c.nome}</td><td>${esc(C.origem === 'FBI' ? c.fbi : c.deic)}</td><td>${c.aut}</td><td>${c.rec}</td><td>${c.mer || '—'}</td></tr>`).join('')}</tbody></table></div>`;
}

function rAspectos() {
  return head('Passo 8 · Aspectos', 'Aspectos e vínculos', 'Frases curtas que dizem o que move seu agente. Valem como Aspectos em jogo.') + `
  <label class="fl"><span>Motivação (o que o move)</span><textarea class="ta" style="min-height:80px" data-bind="motivacao" placeholder="Provar que os números mentem menos do que as pessoas.">${esc(C.motivacao)}</textarea></label>
  <label class="fl"><span>Vínculo (quem ou o que o prende ao caso)</span><textarea class="ta" style="min-height:80px" data-bind="vinculo" placeholder="O antigo chefe, que sumiu depois de assinar um relatório.">${esc(C.vinculo)}</textarea></label>
  <h2 class="tape">Outros aspectos</h2>
  ${C.aspectos.map((x, i) => `<div class="item"><input class="in" data-bind="aspectos.${i}" value="${esc(x)}" aria-label="Aspecto ${i + 1}"><button class="btn sm red" data-act="delasp" data-i="${i}" aria-label="Remover">✕</button></div>`).join('')}
  <button class="btn sm" data-act="addasp">+ Novo aspecto</button>
  <h2 class="tape">Como usar</h2>
  <div class="grid3">
    <div class="card"><h4>Invocar</h4><p>Uma vez por cena, quando o Aspecto ajuda: <b>+2</b> no teste.</p></div>
    <div class="card"><h4>Compel</h4><p>O mestre oferece uma complicação. Se aceitar, <b>+1 PX</b> (até 2 por sessão).</p></div>
    <div class="card"><h4>Vivência</h4><p>Narrar um passado coerente com um Campo pode render <b>+1 PX</b> bônus.</p></div>
  </div>`;
}

function rContatos() {
  return head('Equipamento · Contatos', 'Contatos e favores', 'Cada agente começa com 2 Contatos nomeados. Um Contato pode ser acionado uma vez por ato.') +
  C.contatos.map((c, i) => `<div class="item"><div><input class="in" data-bind="contatos.${i}.nome" value="${esc(c.nome)}" placeholder="Nome (ex.: Ernesto Gaia, jornalista)" aria-label="Nome do contato"><input class="in" data-bind="contatos.${i}.nota" value="${esc(c.nota)}" placeholder="O que ele pode oferecer" aria-label="Nota"><label class="chk"><input type="checkbox" data-bind="contatos.${i}.usado" ${c.usado ? 'checked' : ''}> Usado neste ato</label></div><button class="btn sm red" data-act="delcon" data-i="${i}" aria-label="Remover">✕</button></div>`).join('') + `
  <button class="btn sm" data-act="addcon">+ Novo contato</button>
  <div class="note"><b>Regra.</b> Ajuda concreta: informação, passagem, mensagem a um terceiro, uma noite de esconderijo. Pedidos grandes geram dívida, que o mestre cobra depois. Campos como Inteligência de Fontes e Rua e Pesquisa criam Contatos novos.</div>`;
}

function rCatalogo() {
  const d = derive(C), left = d.recMax - C.recursosUsados;
  return head('Cap. 11 · Equipamento', 'Catálogo', 'Equipamento ajuda, mas não substitui perícia. O bônus total de itens em um teste é de no máximo +2.') + `
  <div class="pool ${left < 0 ? 'bad' : ''}"><span>Recursos disponíveis: ${left} de ${d.recMax}</span><span>Comum 0 · Requisitado 1 · Especial 2 (Cargo 3+)</span></div><div style="height:12px"></div>
  ${L.EQUIP.map(e => { const has = !!C.equip[e.id], cost = L.DISP[e.disp]; return `<div class="item"><div><b style="font:600 16px var(--f-head);letter-spacing:.08em;text-transform:uppercase">${esc(e.nome)}</b> <span class="chip ${e.disp === 'Especial' ? 'r' : e.disp === 'Requisitado' ? 'o' : ''}">${e.disp}${cost ? ' · ' + cost + ' Rec.' : ''}</span><p class="typed" style="margin:4px 0 0">${esc(e.efeito)}</p></div><button class="btn sm ${has ? 'red' : ''}" data-act="eq" data-id="${e.id}">${has ? 'Devolver' : 'Levar'}</button></div>`; }).join('')}
  <div class="note"><b>2001.</b> Não há smartphone, GPS de bolso nem câmera em cada esquina. Se pedirem algo que só existe depois, o mestre transforma o pedido em uma tarefa da equipe.</div>`;
}

function rMochila() {
  const a = C.attrs, arm = armadura(C), d = derive(C);
  const armas = L.EQUIP.filter(e => e.tipo === 'arma' && C.equip[e.id]);
  const tools = L.EQUIP.filter(e => e.tipo !== 'arma' && C.equip[e.id]);
  const atk = (attr, id) => { const lv = lvl(C, id); return { v: a[attr] + lv, f: `d10 + ${attr} ${a[attr]} + Nível ${lv}` }; };
  const des = atk('FOR', 'forca-tatica.1');
  return head('Cap. 10 · Combate', 'Mochila e combate', 'Tiroteios são raros e letais. Seus números de combate, já calculados.') + `
  <div class="derived">
    <div class="dv" tabindex="0"${tip('Defesa|6 + DES\n6 + ' + a.DES + ' = ' + d.defesa + '\nCobertura leve +2, pesada +4.')}><b>Defesa</b><span>${d.defesa}</span><small>6 + DES</small></div>
    <div class="dv" tabindex="0"${tip('Redução de dano|Maior proteção que você leva.\nDano final = dano da arma − redução.')}><b>Redução</b><span>${arm}</span><small>colete</small></div>
    <div class="dv" tabindex="0"${tip('Saúde|' + hpNow(C) + ' de ' + d.saudeMax)}><b>Saúde</b><span>${hpNow(C)}</span><small>de ${d.saudeMax}</small></div>
    <div class="dv" tabindex="0"${tip('Iniciativa|DES + PER = ' + d.ini)}><b>Iniciativa</b><span>${d.ini}</span><small>DES + PER</small></div>
  </div>
  <h2 class="tape">Ataques</h2>
  <div class="tw"><table class="t"><thead><tr><th>Arma</th><th>Ataque</th><th>Dano</th></tr></thead><tbody>
    <tr><td>Desarmado</td><td>${des.f} = <b>${sg(des.v)}</b></td><td>1 (pode ser não letal)</td></tr>
    ${armas.map(w => { const r = atk(w.attr, w.skill); return `<tr><td>${esc(w.nome)}</td><td>${r.f} = <b>${sg(r.v)}</b></td><td>${w.dano}</td></tr>`; }).join('')}</tbody></table></div>
  <div class="formula">d10 + DES (ou FOR) + Nível do Campo <em>≥ Defesa do alvo</em></div>
  <p class="typed">Margem de 4 ou mais: +1 de dano. Dano final = dano da arma − armadura do alvo. Armas de fogo usam Armas e Tiro; corpo a corpo usa Combate e Captura.</p>
  <h2 class="tape">Na mochila</h2>
  ${tools.length || armas.length || arm ? `<ul>${L.EQUIP.filter(e => C.equip[e.id]).map(e => `<li><b>${esc(e.nome)}.</b> ${esc(e.efeito)}</li>`).join('')}</ul>` : '<p class="typed">Nada ainda. Vá ao Catálogo.</p>'}`;
}

function rowCalc() {
  const r = ui.roll, a = C.attrs[r.attr]; let lv = 0, label = 'Sem perícia', unl = true;
  if (r.campo.startsWith('nuc')) { lv = nuc(C); label = 'Núcleo: ' + nucleoItems(AREA(C.area))[+r.campo.slice(3)].n; }
  else if (r.campo) { const f = FBY(r.campo); lv = lvl(C, f.id); label = f.nome; unl = lv > 0; }
  const mods = [], est = hpEstado(C), cf = credFaixa(C.cred);
  if (!unl) mods.push(['Perícia não liberada', -2]);
  if (r.aspecto) mods.push(['Aspecto', 2]);
  if (+r.ajuda) mods.push(['Ajuda de aliado', +r.ajuda]);
  if (+r.circ) mods.push(['Circunstância', +r.circ]);
  if (+r.equip) mods.push(['Equipamento', +r.equip]);
  if (est.k === 'critico') mods.push(['Crítico', -2]); else if (est.k === 'ferido' && r.tipo === 'fis') mods.push(['Ferido', -1]);
  if (C.abalado) mods.push(['Abalado', -1]);
  if (r.tipo === 'soc' && cf.mod) mods.push(['Credibilidade ' + cf.n, cf.mod]);
  const mod = mods.reduce((s, m) => s + m[1], 0);
  return { a, lv, label, mods, mod, base: a + lv + mod, unl };
}

function rTeste() {
  const r = ui.roll, k = rowCalc(), f = r.campo && !r.campo.startsWith('nuc') ? FBY(r.campo) : null;
  const spec = f && lvl(C, f.id) === 5;
  const opts = `<option value="">— sem perícia (nível 0) —</option>
    <optgroup label="Núcleo da sua Área">${nucleoItems(AREA(C.area)).map((n, i) => `<option value="nuc${i}" ${r.campo === 'nuc' + i ? 'selected' : ''}>${esc(n.n)} (nível ${nuc(C)})</option>`).join('')}</optgroup>
    ${L.AREAS.map(ar => `<optgroup label="${esc(ar.nome)}">${ar.campos.map((fl, i) => { const id = `${ar.key}.${i}`; return `<option value="${id}" ${r.campo === id ? 'selected' : ''}>${esc(fl.nome)} (nível ${lvl(C, id)})</option>`; }).join('')}</optgroup>`).join('')}`;
  const seg = (key, arr) => `<div class="seg">${arr.map(o => `<button data-act="roll" data-rk="${key}" data-rv="${o[0]}" class="${String(r[key]) === String(o[0]) ? 'on' : ''}">${o[1]}</button>`).join('')}</div>`;
  const sel = (key, arr) => `<select class="sel" data-on="roll" data-rk="${key}">${arr.map(o => `<option value="${o[0]}" ${String(r[key]) === String(o[0]) ? 'selected' : ''}>${o[1]}</option>`).join('')}</select>`;
  const modo = spec && r.golpe ? 'v' : r.modo;
  return head('Cap. 7 · O teste', 'Fazer um teste', 'd10 + Atributo + Nível do Campo, contra a dificuldade da cena.') + `
  <div class="rollgrid">
    <label class="fl"><span>Atributo</span>${sel('attr', L.ATTRS.map(t => [t.k, `${t.k} · ${t.n} (${C.attrs[t.k]})`]))}</label>
    <label class="fl"><span>Perícia ou Campo</span><select class="sel" data-on="roll" data-rk="campo">${opts}</select></label>
    <label class="fl"><span>Dificuldade</span>${sel('dif', L.DIFS.map(x => [x.v, `${x.v} · ${x.n}`]))}</label>
    <label class="fl"><span>Tipo de teste</span>${sel('tipo', [['ger', 'Geral'], ['fis', 'Físico'], ['soc', 'Social ou institucional']])}</label>
    <label class="fl"><span>Ajuda de aliado</span>${sel('ajuda', [[0, 'Nenhuma'], [1, '+1'], [2, '+2 (máximo)']])}</label>
    <label class="fl"><span>Circunstância</span>${sel('circ', [[-2, '−2'], [-1, '−1'], [0, 'Neutra'], [1, '+1'], [2, '+2']])}</label>
    <label class="fl"><span>Equipamento (máx. +2)</span>${sel('equip', [[0, 'Nenhum'], [1, '+1'], [2, '+2']])}</label>
    <label class="fl"><span>Dados</span>${seg('modo', [['d', 'Desvant.'], ['n', 'Normal'], ['v', 'Vantagem']])}</label>
  </div>
  <div class="row" style="margin-bottom:6px">
    <label class="chk"><input type="checkbox" data-on="roll" data-rk="aspecto" ${r.aspecto ? 'checked' : ''}> Invocar Aspecto (+2)</label>
    ${spec ? `<label class="chk"${tip('Golpe de Mestre|Especialista: uma vez por cena, role 2d10 e fique com o maior.')}><input type="checkbox" data-on="roll" data-rk="golpe" ${r.golpe ? 'checked' : ''}> Golpe de Mestre</label>` : ''}
  </div>
  <div class="formula">d10${modo === 'n' ? '' : modo === 'v' ? ' (2d10, maior)' : ' (2d10, menor)'} + <em>${r.attr} ${k.a}</em> + <em>Nível ${k.lv}</em>${k.mods.map(m => ` ${m[1] >= 0 ? '+' : '−'} <em>${Math.abs(m[1])}</em>`).join('')} <br>= d10 ${sg(k.base)} <em>≥ ${r.dif}</em></div>
  ${k.mods.length ? `<p class="typed">${k.mods.map(m => `${m[0]} ${sg(m[1])}`).join(' · ')}</p>` : ''}
  ${!k.unl ? '<div class="note warn"><b>Perícia não liberada.</b> −2 no teste e sem direito a pista garantida.</div>' : ''}
  <div class="row"><button class="btn red big" data-act="dorolar">Rolar dado</button></div>
  ${resultHTML()}`;
}

function resultHTML() {
  const x = ui.last; if (!x) return '';
  const total = x.d + x.k.base + x.extra, j = judge(total, x.dif);
  const cls = x.anim ? 'rolling' : x.d === 10 ? 'n10' : x.d === 1 ? 'n1' : '';
  if (x.anim) return `<div class="result"><div class="die rolling" id="die">…</div><div><h3>Rolando…</h3></div></div>`;
  return `<div class="result"><div class="die ${cls}" id="die">${x.d}</div><div>
    <span class="stamp ${j.bad ? 'bad' : ''}">${j.n}</span>
    <h3>Total ${total} <small style="font-size:16px">vs ${x.dif}</small></h3>
    <p>${x.dice.length > 1 ? 'Dados: ' + x.dice.join(' e ') + ' → ' + x.d + '. ' : ''}d10 ${x.d} ${sg(x.k.base)}${x.extra ? ' ' + sg(x.extra) + ' (reforço)' : ''} = ${total} · margem ${sg(j.m)}</p>
    <p>${j.d}${x.d === 10 ? ' <b>Destaque!</b> Adicione um detalhe ao resultado.' : ''}${x.d === 1 ? ' <b>Tropeço!</b> O mestre introduz uma complicação leve.' : ''}</p>
    <div class="row" style="margin-top:8px"><button class="btn sm ${x.esf || C.estresse >= 6 ? 'off' : ''}" data-act="esforco"${tip('Esforço|Gaste 1 de Estresse para somar +2 depois de ver o dado.')}>Esforço +2 (1 Estresse)</button><button class="btn sm ${x.cr || C.cred < 1 ? 'off' : ''}" data-act="credgasto"${tip('Favor|Uma vez por cena, gaste 1 de Credibilidade para +2 em teste social ou institucional.')}>Favor +2 (1 Credib.)</button></div></div></div>`;
}

function rHist() {
  return head('Registro', 'Histórico de testes', 'Os últimos 30 testes deste agente.') + (C.rolls.length ? `<ul class="hist">${C.rolls.map(h => `<li><span>${esc(h.label)} · ${h.attr}</span><span><b>${h.total}</b> vs ${h.dif} · ${esc(h.res)}</span></li>`).join('')}</ul><div class="row" style="margin-top:12px"><button class="btn sm red" data-act="limparhist">Limpar</button></div>` : '<p class="typed">Nenhum teste ainda.</p>');
}

function rNotas() {
  return head('Diário', 'Notas do caso', 'Pistas, suspeitos, frases que o mestre deixou escapar. Escreva como se fosse o seu caderno.') + `<textarea class="ta hand" data-bind="notas" aria-label="Notas" placeholder="Hoje descobri que...">${esc(C.notas)}</textarea>`;
}

function rSegredos() {
  const g = C.segredos.filter(s => s.dest === 'guardar').length;
  return head('Cap. 8 · Saber demais', 'Segredos', 'Cada verdade inconveniente da Trilha de Ouro vira um Segredo. Revelar, guardar ou negociar tem preço.') + `
  <div class="row"><input class="in" id="segTxt" placeholder="Descreva o Segredo" style="flex:1 1 220px" value="${esc(ui.segTxt)}"><button class="btn sm" data-act="addseg">+ Adicionar</button></div><div style="height:12px"></div>
  ${C.segredos.map((s, i) => `<div class="item"><div><input class="in" data-bind="segredos.${i}.txt" value="${esc(s.txt)}" aria-label="Segredo"><select class="sel" data-bind="segredos.${i}.dest" aria-label="Destino"><option value="guardar" ${s.dest === 'guardar' ? 'selected' : ''}>Guardar (+1 Estresse por ato)</option><option value="revelar" ${s.dest === 'revelar' ? 'selected' : ''}>Revelar (Credib. −1, +2 Méritos se houver prova)</option><option value="negociar" ${s.dest === 'negociar' ? 'selected' : ''}>Negociar (favor; Credib. −1 se descoberto)</option></select></div><button class="btn sm red" data-act="delseg" data-i="${i}" aria-label="Remover">✕</button></div>`).join('')}
  <div class="note ${g ? 'warn' : ''}"><b>Peso dos segredos.</b> Guardados: ${g}. Estresse extra a cada ato: <b>+${g}</b>.</div>`;
}

function rSessoes() {
  const s = ui.sess, tot = Math.min(9, 5 + (s.obj ? 1 : 0) + (s.pista ? 1 : 0) + (s.dec ? 1 : 0) + (+s.compel));
  const ck = (k, t) => `<label class="chk"><input type="checkbox" data-on="sess" data-sk="${k}" ${s[k] ? 'checked' : ''}> ${t}</label>`;
  return head('Cap. 4 · Experiência', 'Sessões e PX', 'Ao fim de cada sessão, some os PX e aplique à ficha.') + `
  <div class="px"><span class="chip g">Disponíveis ${pxLeft(C)} PX</span><span class="chip">Total ganho ${C.pxTotal}</span><span class="chip">Gastos ${spent(C)}</span></div>
  <div class="card"><h4>Calculadora da sessão</h4>
    <p class="typed">Base 5 PX</p>
    <div class="row" style="flex-direction:column;align-items:flex-start;gap:8px">${ck('obj', '+1 Objetivo da sessão cumprido')}${ck('pista', '+1 Pista central descoberta com uma boa ideia')}${ck('dec', '+1 Decisão difícil tomada em personagem')}
    <label class="fl" style="margin:0"><span>Compel aceito (+1 cada, até 2)</span><select class="sel" data-on="sess" data-sk="compel">${[0, 1, 2].map(n => `<option ${+s.compel === n ? 'selected' : ''}>${n}</option>`).join('')}</select></label></div>
    <div class="formula">5 ${s.obj ? '+ 1' : ''} ${s.pista ? '+ 1' : ''} ${s.dec ? '+ 1' : ''} ${+s.compel ? '+ ' + s.compel : ''} = <em>${tot} PX</em> ${5 + (s.obj ? 1 : 0) + (s.pista ? 1 : 0) + (s.dec ? 1 : 0) + (+s.compel) > 9 ? '(limite 9)' : ''}</div>
    <input class="in" id="sessNota" placeholder="Nota da sessão (opcional)" value="${esc(s.nota)}"><div class="row" style="margin-top:10px"><button class="btn red" data-act="aplicarsessao">Aplicar ${tot} PX à ficha</button></div></div>
  <h2 class="tape">Registro</h2>
  ${C.sessoes.length ? `<ul class="hist">${C.sessoes.map(x => `<li><span>Sessão ${x.n} · ${esc(x.nota || 'sem nota')}</span><span><b>+${x.pts} PX</b></span></li>`).join('')}</ul>` : '<p class="typed">Nenhuma sessão registrada.</p>'}
  <div class="note"><b>Ritmo esperado.</b> Um Campo completo custa 45 PX: de 7 a 9 sessões de dedicação total. Uma campanha de 12 a 16 sessões deve produzir de 1 a 2 Especialistas por equipe.</div>`;
}

function rArquivo() {
  const ids = Object.keys(DB.chars);
  return head('Arquivo', 'Agentes e arquivo', 'Tudo fica salvo neste aparelho. Exporte para levar a ficha a outro.') + `
  <h3>Seus agentes</h3>
  ${ids.map(id => { const c = DB.chars[id]; return `<div class="item"><div><b>${esc(c.nome || 'Agente sem nome')}</b><p class="typed" style="margin:2px 0 0">${esc(AREA(c.area).nome)} · Cargo ${c.cargo} · ${c.origem}${id === DB.active ? ' · <span style="color:var(--red)">em uso</span>' : ''}</p></div><div class="row"><button class="btn sm ${id === DB.active ? 'off' : ''}" data-act="troca" data-id="${id}">Abrir</button><button class="btn sm red ${ids.length < 2 ? 'off' : ''}" data-act="delchar" data-id="${id}" aria-label="Excluir">✕</button></div></div>`; }).join('')}
  <div class="row" style="margin:14px 0"><button class="btn" data-act="novo">+ Novo agente</button><button class="btn" data-act="export">Exportar (JSON)</button><button class="btn" data-act="import">Importar</button><button class="btn red" data-act="print">Imprimir ficha</button></div>
  ${C.portrait ? '<button class="btn sm" data-act="rmportrait">Remover retrato</button>' : ''}
  <div class="note"><b>Instalar como app.</b> No celular, abra o menu do navegador e escolha "Adicionar à tela inicial". A ficha funciona sem internet depois da primeira visita.</div>`;
}

function rRegras() {
  return head('Referência', 'Regras rápidas', 'Tudo o que você consulta mais de uma vez por sessão.') + `
  <div class="formula">d10 + Atributo + Nível do Campo <em>≥ Dificuldade</em></div>
  <h3>Dificuldades</h3><div class="tw"><table class="t"><tbody>${L.DIFS.map(x => `<tr><td><b>${x.n}</b></td><td>${x.v}</td></tr>`).join('')}</tbody></table></div>
  <h3>Margem de sucesso</h3><div class="grid3"><div class="card"><h4>0 a 3</h4><p>Simples. Faz o que pretendia.</p></div><div class="card"><h4>4 a 7</h4><p>Forte. Detalhe extra.</p></div><div class="card"><h4>8 ou mais</h4><p>Brilhante. Detalhe e vantagem.</p></div></div>
  <h3>Falha</h3><p class="typed">1 a 3 abaixo: complicação leve. 4 ou mais abaixo: grave. 10 natural: Destaque. 1 natural: Tropeço.</p>
  <h3>Custo de marcos (PX)</h3><div class="tw"><table class="t"><thead><tr><th>Marco</th><th>%</th><th>Sua Área</th><th>Outra Área</th></tr></thead><tbody>${L.CUSTO.map((c, i) => `<tr><td>${i + 1}</td><td>${L.PCT[i]}%</td><td>${c}</td><td>${c * 2}</td></tr>`).join('')}</tbody></table></div>
  <h3>Fórmulas</h3><ul class="typed"><li>Saúde = 5 + CON</li><li>Defesa = 6 + DES</li><li>Resistência social = 6 + CAR</li><li>Iniciativa = DES + PER</li><li>Estresse máximo = 6</li><li>Autoridade = Cargo · Recursos = valor do Cargo</li><li>Núcleo = 1 + Campos da Área no Marco 3+ (teto 5)</li></ul>`;
}

/* -------- hora de montar a página da direita ---------- */
function renderRight() {
  const sub = curSub();
  let html = ui.tab === 'pericias' ? rArea(sub) : ({
    'agente.ident': rIdent, 'agente.attr': rAttr, 'agente.vitais': rVitais, 'funcao.cargo': rCargo, 'funcao.aspectos': rAspectos,
    'funcao.contatos': rContatos, 'equip.catalogo': rCatalogo, 'equip.mochila': rMochila, 'dados.teste': rTeste, 'dados.historico': rHist,
    'diario.notas': rNotas, 'diario.segredos': rSegredos, 'diario.sessoes': rSessoes, 'opcoes.arquivo': rArquivo, 'opcoes.regras': rRegras
  }[`${ui.tab}.${sub}`])();
  const n = tabDef().subs.length, i = subIndex();
  html += `<div class="row" style="justify-content:space-between;margin-top:22px"><button class="btn sm ${i === 0 ? 'off' : ''}" data-act="page" data-d="-1">◀ Anterior</button><button class="btn sm ${i === n - 1 ? 'off' : ''}" data-act="page" data-d="1">Próxima ▶</button></div><div class="pageno">${i + 1} / ${n}</div>`;
  ui.pop = null;
  $('#pageR').innerHTML = html;
}

function renderTabs() {
  const pend = {
    agente: (C.modo === 'criacao' && poolLeft(C) > 0) || C.estresse >= 6,
    pericias: L.AREAS.some(a => canBuyIn(C, a.key)),
    funcao: promoOk(C)
  };
  $('#tabs').innerHTML = TABS.map(t => `<button class="tab ${t.id === ui.tab ? 'on' : ''}" role="tab" aria-selected="${t.id === ui.tab}" data-act="tab" data-id="${t.id}">${t.n}${pend[t.id] ? '<i class="dia"></i>' : ''}</button>`).join('');
}
function renderSide() {
  const t = tabDef(), cur = curSub(), esp = especialistas(C).length, tm = FIELDS.length * 5, mt = marcosTotal(C);
  $('#side').innerHTML = `<h3 class="side-h">${t.n}</h3><div class="side-rule"></div>
  <div class="side-list" role="tablist">${t.subs.map((s, i) => `<button class="si ${s[0] === cur ? 'on' : ''}" data-act="sub" data-i="${i}">${s[1]}${ui.tab === 'pericias' && canBuyIn(C, s[0]) ? '<i class="dia"></i>' : ''}</button>`).join('')}</div>
  <div class="side-stat"><b>PX disponíveis</b><span class="big">${pxLeft(C)}</span>
    <b>Marcos liberados</b>${mt} / ${tm}<div class="bar"><i style="width:${(mt / tm) * 100}%"></i></div>
    <b>Especialista</b>${esp ? esp + ' Campo' + (esp > 1 ? 's' : '') + ' a 100%' : 'nenhum ainda'}</div>`;
}
function render() {
  renderTabs(); renderSide(); renderLeft(); renderRight();
  document.title = `${C.nome || 'Agente'} · Caça ao Lupin`;
}
const commit = () => { save(); render(); };
function turn(back) {
  const p = $('#pageR'); p.classList.remove('turn', 'back'); void p.offsetWidth;
  p.classList.add('turn'); if (back) p.classList.add('back');
}

/* ---------- ações da ficha ---------- */
let toastT;
const toast = m => { const t = $('#toast'); t.textContent = m; t.classList.add('on'); clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('on'), 2600); };
const setStress = v => { const was = C.estresse; C.estresse = clamp(v, 0, 6); if (C.estresse >= 6 && was < 6) toast('Colapso! A próxima ação falha com complicação grave.'); };
const setTab = (id, back) => { if (id === ui.tab) return; ui.tab = id; commit(); turn(back); };
const setSub = (i, back) => { const s = tabDef().subs[clamp(i, 0, tabDef().subs.length - 1)][0]; ui.sub[ui.tab] = s; render(); turn(back); window.scrollTo({ top: 0, behavior: 'smooth' }); };

const act = {
  tab: t => { const ids = TABS.map(x => x.id); setTab(t.dataset.id, ids.indexOf(t.dataset.id) < ids.indexOf(ui.tab)); },
  sub: t => setSub(+t.dataset.i, +t.dataset.i < subIndex()),
  page: t => setSub(subIndex() + +t.dataset.d, +t.dataset.d < 0),
  pip: t => {
    const k = t.dataset.k, v = +t.dataset.v, d = derive(C); ui.pop = k + v;
    if (k === 'saude') { const cur = hpNow(C); C.dano = d.saudeMax - (cur === v ? v - 1 : v); }
    else if (k === 'estresse') setStress(C.estresse === v ? v - 1 : v);
    else if (k === 'cred') C.cred = C.cred === v ? v - 1 : v;
    else if (k === 'rec') { const avail = d.recMax - C.recursosUsados; C.recursosUsados = d.recMax - (avail === v ? v - 1 : v); ui.pop = null; }
    commit();
  },
  vit: t => {
    const k = t.dataset.k, dl = +t.dataset.d;
    if (k === 'dano') C.dano = clamp(C.dano + dl, 0, derive(C).saudeMax);
    else if (k === 'estresse') setStress(C.estresse + dl);
    else C.cred = clamp(C.cred + dl, 0, 10);
    if (k === 'cred' && C.cred === 0) toast('Credibilidade zero: o agente é afastado por uma sessão.');
    commit();
  },
  rest: t => {
    const r = t.dataset.r;
    if (r === 'noite') C.dano = Math.max(0, C.dano - 1);
    if (r === 'hospital') C.dano = Math.max(0, C.dano - 3);
    if (r === 'cena') { C.estresse = Math.max(0, C.estresse - 2); C.abalado = false; }
    if (r === 'folga') { C.estresse = 0; C.abalado = false; }
    toast('Descanso registrado.'); commit();
  },
  colapso: () => { C.estresse = 3; C.abalado = true; toast('Colapso registrado: Estresse 3 e Abalado.'); commit(); },
  attr: t => {
    const k = t.dataset.k, d = +t.dataset.d, v = C.attrs[k] + d, cp = attrCap(C);
    if (v < 1) return;
    if (v > cp) return toast(`Limite ${cp} ${C.modo === 'criacao' ? 'na criação' : 'em jogo'}.`);
    if (d > 0 && C.modo === 'criacao' && poolLeft(C) <= 0) return toast('Sem pontos: você já distribuiu os 10.');
    C.attrs[k] = v; ui.bump = k; commit();
  },
  fold: t => { const id = t.dataset.f, cur = ui.fold[id] ?? (lvl(C, id) > 0 || id === C.principal); ui.fold[id] = !cur; renderRight(); },
  mk: t => {
    const f = FBY(t.dataset.f), m = +t.dataset.m, lv = lvl(C, f.id), fr = free(C, f.id);
    if (m === lv + 1) {
      const cost = costOf(C, f, m);
      if (pxLeft(C) < cost) return toast(`PX insuficientes: custa ${cost} e você tem ${pxLeft(C)}.`);
      C.lvl[f.id] = m; ui.fold[f.id] = true; toast(m === 5 ? `Especialista em ${f.nome}!` : `${f.marcos[m - 1].nome} liberado.`);
    } else if (m === lv && lv > fr) { C.lvl[f.id] = lv - 1; toast('Marco desfeito. PX devolvidos.'); }
    else if (m <= fr) return toast('Esse marco foi liberado de graça pelo mestre.');
    else if (m < lv) return toast('Desfaça primeiro o marco mais alto.');
    else return toast('Compre os marcos em ordem.');
    commit();
  },
  cargo: t => {
    const d = +t.dataset.d;
    if (d > 0) { if (!promoOk(C)) return toast('Méritos insuficientes para a promoção.'); C.cargo++; toast(`Promovido: Cargo ${C.cargo}.`); }
    else if (C.cargo > 1) { C.cargo--; C.recursosUsados = Math.min(C.recursosUsados, L.CARGOS[C.cargo].rec); }
    commit();
  },
  merito: t => { const m = L.MERITOS[+t.dataset.i]; C.meritos = Math.max(0, C.meritos + m[1]); toast(`${m[0]}: ${sg(m[1])} Mérito.`); commit(); },
  fimato: () => { C.recursosUsados = 0; C.contatos.forEach(c => c.usado = false); toast('Novo ato: Recursos e Contatos recuperados.'); commit(); },
  addasp: () => { C.aspectos.push(''); commit(); },
  delasp: t => { C.aspectos.splice(+t.dataset.i, 1); commit(); },
  addcon: () => { C.contatos.push({ nome: '', nota: '', usado: false }); commit(); },
  delcon: t => { C.contatos.splice(+t.dataset.i, 1); commit(); },
  eq: t => {
    const it = EQ(t.dataset.id), cost = L.DISP[it.disp], rec = L.CARGOS[C.cargo].rec;
    if (!C.equip[it.id]) {
      if (it.disp === 'Especial' && C.cargo < 3) return toast('Item Especial exige Cargo 3 ou mais.');
      if (C.recursosUsados + cost > rec) return toast('Recursos insuficientes para requisitar este item.');
      C.equip[it.id] = true; C.recursosUsados += cost;
    } else { delete C.equip[it.id]; C.recursosUsados = Math.max(0, C.recursosUsados - cost); }
    commit();
  },
  roll: t => { const k = t.dataset.rk; ui.roll[k] = t.dataset.rv; renderRight(); },
  dorolar: () => {
    const k = rowCalc(), r = ui.roll, f = r.campo && !r.campo.startsWith('nuc') ? FBY(r.campo) : null;
    const modo = f && lvl(C, f.id) === 5 && r.golpe ? 'v' : r.modo, n = modo === 'n' ? 1 : 2;
    const dice = Array.from({ length: n }, () => 1 + Math.floor(Math.random() * 10));
    const d = modo === 'd' ? Math.min(...dice) : Math.max(...dice);
    ui.last = { anim: true, dice, d, k, dif: +r.dif, extra: 0, esf: false, cr: false };
    renderRight();
    const el = $('#die'), iv = setInterval(() => { if (el) el.textContent = 1 + Math.floor(Math.random() * 10); }, 70);
    setTimeout(() => {
      clearInterval(iv); ui.last.anim = false;
      const total = d + k.base, j = judge(total, +r.dif);
      C.rolls.unshift({ label: k.label, attr: r.attr, total, dif: +r.dif, res: j.n }); C.rolls = C.rolls.slice(0, 30);
      save(); renderRight();
    }, 650);
  },
  esforco: () => { const x = ui.last; if (!x || x.esf || C.estresse >= 6) return; x.esf = true; x.extra += 2; setStress(C.estresse + 1); syncHist(); commit(); },
  credgasto: () => { const x = ui.last; if (!x || x.cr || C.cred < 1) return; x.cr = true; x.extra += 2; C.cred--; syncHist(); commit(); },
  limparhist: () => { C.rolls = []; commit(); },
  addseg: () => { const v = $('#segTxt').value.trim(); if (!v) return toast('Descreva o Segredo.'); C.segredos.push({ txt: v, dest: 'guardar' }); ui.segTxt = ''; commit(); },
  delseg: t => { C.segredos.splice(+t.dataset.i, 1); commit(); },
  aplicarsessao: () => {
    const s = ui.sess, pts = Math.min(9, 5 + (s.obj ? 1 : 0) + (s.pista ? 1 : 0) + (s.dec ? 1 : 0) + (+s.compel));
    C.pxTotal += pts; C.sessoes.unshift({ n: C.sessoes.length + 1, pts, nota: s.nota }); ui.sess = { obj: true, pista: false, dec: false, compel: 0, nota: '' };
    toast(`+${pts} PX aplicados.`); commit();
  },
  portrait: () => $('#filePortrait').click(),
  rmportrait: () => { C.portrait = null; commit(); },
  novo: () => { const c = blank(); DB.chars[c.id] = c; DB.active = c.id; C = c; ui.sub = {}; ui.tab = 'agente'; ui.last = null; toast('Novo agente criado.'); commit(); },
  troca: t => { DB.active = t.dataset.id; C = DB.chars[DB.active]; ui.sub = {}; ui.last = null; commit(); },
  delchar: t => {
    if (Object.keys(DB.chars).length < 2) return;
    if (!confirm('Excluir este agente? Esta ação não pode ser desfeita.')) return;
    delete DB.chars[t.dataset.id];
    if (DB.active === t.dataset.id) { DB.active = Object.keys(DB.chars)[0]; C = DB.chars[DB.active]; ui.sub = {}; }
    commit();
  },
  export: () => {
    const blob = new Blob([JSON.stringify(C, null, 2)], { type: 'application/json' }), a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = `agente-${(C.nome || 'sem-nome').toLowerCase().replace(/[^a-z0-9]+/g, '-')}.json`;
    document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 500); toast('Ficha exportada.');
  },
  import: () => $('#fileImport').click(),
  print: () => { buildPrint(); window.print(); }
};
function syncHist() { const h = C.rolls[0], x = ui.last; if (h && x) { h.total = x.d + x.k.base + x.extra; h.res = judge(h.total, x.dif).n; } }

/* ---------- mudanças que vêm do formulário ---------- */
const chg = {
  area: v => {
    const old = C.principal;
    if (lvl(C, old) > free(C, old)) { toast('Reembolse os marcos pagos do Campo Principal antes de trocar de Área.'); return renderRight(); }
    C.lvl[old] = C.pre[old] || 0; C.area = v; C.principal = `${v}.0`; C.lvl[C.principal] = Math.max(C.lvl[C.principal] || 0, 2); ui.sub.pericias = v; commit();
  },
  principal: v => {
    const old = C.principal;
    if (lvl(C, old) > free(C, old)) { toast('Reembolse os marcos pagos do Campo Principal atual antes de trocar.'); return renderRight(); }
    C.lvl[old] = C.pre[old] || 0; C.principal = v; C.lvl[v] = Math.max(C.lvl[v] || 0, 2); commit();
  },
  pre: (v, el) => {
    const id = el.dataset.f, n = +v, others = Object.keys(C.pre).filter(k => k !== id && C.pre[k] > 0 && FBY(k).area === C.area).length;
    if (lvl(C, id) > free(C, id)) { toast('Reembolse os marcos pagos deste Campo antes de mudar a pré-liberação.'); return renderRight(); }
    if (n > 0 && others >= 2) { toast('O mestre pré-libera no máximo 2 Campos.'); return renderRight(); }
    C.pre[id] = n; C.lvl[id] = free(C, id); commit();
  },
  roll: (v, el) => { ui.roll[el.dataset.rk] = el.type === 'checkbox' ? el.checked : (isNaN(+v) || v === '' ? v : (el.dataset.rk === 'campo' ? v : +v)); renderRight(); },
  sess: (v, el) => { ui.sess[el.dataset.sk] = el.type === 'checkbox' ? el.checked : +v; renderRight(); }
};
const setPath = (o, path, val) => { const p = path.split('.'); for (let i = 0; i < p.length - 1; i++) o = o[p[i]]; o[p[p.length - 1]] = val; };

document.addEventListener('click', e => {
  const t = e.target.closest('[data-act]'); if (!t || t.classList.contains('off')) return;
  act[t.dataset.act]?.(t, e);
});
document.addEventListener('input', e => {
  const el = e.target;
  if (el.id === 'segTxt') ui.segTxt = el.value;
  else if (el.id === 'sessNota') ui.sess.nota = el.value;
  else if (el.dataset.bind && el.type !== 'checkbox' && el.tagName !== 'SELECT') { setPath(C, el.dataset.bind, el.value); save(); renderLeft(); document.title = `${C.nome || 'Agente'} · Caça ao Lupin`; }
});
document.addEventListener('change', e => {
  const el = e.target;
  if (el.dataset.on) return chg[el.dataset.on]?.(el.type === 'checkbox' ? el.checked : el.value, el);
  if (el.dataset.bind && (el.type === 'checkbox' || el.tagName === 'SELECT')) { setPath(C, el.dataset.bind, el.type === 'checkbox' ? el.checked : el.value); commit(); }
});

/* retrato: reduz a foto antes de guardar */
$('#filePortrait').addEventListener('change', e => {
  const f = e.target.files[0]; if (!f) return;
  const img = new Image(), url = URL.createObjectURL(f);
  img.onload = () => {
    const s = Math.min(1, 520 / Math.max(img.width, img.height)), cv = document.createElement('canvas');
    cv.width = img.width * s; cv.height = img.height * s; cv.getContext('2d').drawImage(img, 0, 0, cv.width, cv.height);
    C.portrait = cv.toDataURL('image/jpeg', .82); URL.revokeObjectURL(url); commit(); toast('Retrato atualizado.');
  };
  img.src = url; e.target.value = '';
});
/* importação de arquivo, sem mistério */
$('#fileImport').addEventListener('change', e => {
  const f = e.target.files[0]; if (!f) return;
  f.text().then(txt => {
    try {
      const j = JSON.parse(txt), list = j.chars ? Object.values(j.chars) : [j]; let last;
      list.forEach(c => { if (!c.attrs) throw 0; const n = normalize(c); n.id = uid(); DB.chars[n.id] = n; last = n; });
      DB.active = last.id; C = last; ui.sub = {}; commit(); toast(`${list.length} agente(s) importado(s).`);
    } catch (err) { toast('Arquivo inválido: use um JSON exportado por esta ficha.'); }
  });
  e.target.value = '';
});

/* ---------- impressão (pra quando precisar) ---------- */
function buildPrint() {
  const d = derive(C), a = AREA(C.area), cg = L.CARGOS[C.cargo];
  const rows = FIELDS.filter(f => lvl(C, f.id) > 0).map(f => `<tr><td>${esc(f.areaNome)}</td><td>${esc(f.nome)}</td><td>${lvl(C, f.id)}</td><td>${f.marcos.slice(0, lvl(C, f.id)).map(m => esc(m.nome)).join(', ')}</td></tr>`).join('');
  $('#printSheet').innerHTML = `<h1>Caça ao Lupin · Ficha de Agente</h1>
  <p><b>${esc(C.nome || 'Sem nome')}</b> · ${esc(C.origem)} · ${esc(a.nome)} · Cargo ${cg.n} (${esc(C.origem === 'FBI' ? cg.fbi : cg.deic)}) · Idade ${esc(C.idade || '—')}</p>
  <p><i>${esc(C.conceito)}</i></p><p>${esc(C.formacao)}</p>
  <h3>Atributos</h3><div class="cols" style="grid-template-columns:repeat(6,1fr)">${L.ATTRS.map(t => `<div class="box"><b>${t.k}</b><span>${C.attrs[t.k]}</span></div>`).join('')}</div>
  <h3>Valores derivados</h3><div class="cols" style="grid-template-columns:repeat(6,1fr)">${[['Saúde', d.saudeMax], ['Estresse', 6], ['Defesa', d.defesa], ['Res. social', d.res], ['Iniciativa', d.ini], ['Credib.', C.cred]].map(x => `<div class="box"><b>${x[0]}</b><span>${x[1]}</span></div>`).join('')}</div>
  <h3>Perícias (PX disponíveis: ${pxLeft(C)} · gastos: ${spent(C)})</h3><table><tr><th>Área</th><th>Campo</th><th>Nível</th><th>Marcos liberados</th></tr>${rows}</table>
  <p>Núcleo (${esc(a.nome)}): nível ${nuc(C)} · ${nucleoItems(a).map(n => esc(n.n)).join(' e ')}</p>
  <h3>Aspectos</h3><p><b>Motivação:</b> ${esc(C.motivacao)}<br><b>Vínculo:</b> ${esc(C.vinculo)}<br>${C.aspectos.map(esc).join(' · ')}</p>
  <h3>Contatos</h3><p>${C.contatos.filter(c => c.nome).map(c => esc(c.nome) + (c.nota ? ' (' + esc(c.nota) + ')' : '')).join(' · ') || '—'}</p>
  <h3>Equipamento</h3><p>${L.EQUIP.filter(e => C.equip[e.id]).map(e => esc(e.nome)).join(' · ') || '—'}</p>
  <h3>Notas</h3><p style="white-space:pre-wrap">${esc(C.notas)}</p>`;
}
window.addEventListener('beforeprint', buildPrint);

/* ---------- dicas no hover e foco, essas coisinhas ---------- */
const tipEl = $('#tip'); let tipFor = null;
function showTip(el) {
  const raw = el.getAttribute('data-tip'); if (!raw) return;
  const i = raw.indexOf('|'), title = i > 0 ? raw.slice(0, i) : '', body = i > 0 ? raw.slice(i + 1) : raw;
  tipEl.innerHTML = (title ? `<b>${esc(title)}</b>` : '') + esc(body).replace(/\n/g, '<br>');
  tipEl.classList.add('on'); tipFor = el;
  const r = el.getBoundingClientRect(), w = tipEl.offsetWidth, h = tipEl.offsetHeight;
  let y = r.top - h - 10; if (y < 8) y = r.bottom + 10;
  tipEl.style.left = clamp(r.left + r.width / 2 - w / 2, 8, innerWidth - w - 8) + 'px';
  tipEl.style.top = clamp(y, 8, innerHeight - h - 8) + 'px';
}
const hideTip = () => { tipEl.classList.remove('on'); tipFor = null; };
document.addEventListener('mouseover', e => { const t = e.target.closest('[data-tip]'); if (!t) return hideTip(); if (t !== tipFor) showTip(t); });
document.addEventListener('focusin', e => { const t = e.target.closest('[data-tip]'); t ? showTip(t) : hideTip(); });
document.addEventListener('focusout', hideTip);
document.addEventListener('click', () => setTimeout(() => { if (tipFor && !document.contains(tipFor)) hideTip(); }, 0));
window.addEventListener('scroll', hideTip, { passive: true });

/* ---------- teclado: atalhos daqui ---------- */
document.addEventListener('keydown', e => {
  if (e.ctrlKey || e.metaKey || e.altKey || /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName)) return;
  const ids = TABS.map(t => t.id), i = ids.indexOf(ui.tab), k = e.key.toLowerCase();
  if (k === 'q') setTab(ids[(i + ids.length - 1) % ids.length], true);
  else if (k === 'e') setTab(ids[(i + 1) % ids.length], false);
  else if (e.key === 'ArrowRight' && subIndex() < tabDef().subs.length - 1) setSub(subIndex() + 1, false);
  else if (e.key === 'ArrowLeft' && subIndex() > 0) setSub(subIndex() - 1, true);
});

/* ---------- início ---------- */
render();
if ('serviceWorker' in navigator && /^https?:/.test(location.protocol)) navigator.serviceWorker.register('sw.js').catch(() => {});
})();
