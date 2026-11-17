'use strict';

const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const PORT = Number(process.env.PORT || 3000);
const PUBLIC = path.join(__dirname, 'public');
const TTL_MS = 3 * 60 * 60 * 1000;
const MAX_SESSIONS = 300;
const MAX_EVENTS = 600;
const MAX_BODY = 32 * 1024;

/* ============================================================
   1. Cenários, regras e dados de demonstração
   ============================================================ */

const RAW_WHATS = [
  ['Maria', 'Estou com dor forte, preciso de atendimento hoje', 'alta', false],
  ['João', 'Qual o horário de funcionamento?', 'baixa', false],
  ['Ana', 'Vocês atendem Unimed?', 'normal', false],
  ['Pedro', 'O convênio não autorizou e minha consulta é amanhã', 'alta', true],
  ['Carla', 'Queria remarcar minha consulta', 'normal', false],
  ['Lucas', 'Bom dia!', 'baixa', false],
  ['Beatriz', 'Minha filha está com febre alta, conseguem encaixe hoje?', 'alta', false],
  ['Rafael', 'Obrigado pelo atendimento!', 'baixa', false],
  ['Juliana', 'Como faço para pegar o resultado do exame?', 'normal', true],
  ['Marcos', 'Preciso cancelar a consulta de amanhã, é urgente', 'alta', false],
  ['Fernanda', 'Vocês têm estacionamento?', 'baixa', false],
  ['Bruno', 'Quanto custa a consulta particular?', 'normal', false],
  ['Camila', 'Tomei o remédio errado, o que faço?', 'alta', true],
  ['Diego', 'Qual o endereço da clínica?', 'baixa', false],
  ['Larissa', 'Meu plano cobre fisioterapia?', 'normal', false],
  ['Paulo', 'A cirurgia é amanhã e não recebi a autorização', 'alta', false],
  ['Sofia', 'Podem me enviar o recibo por e-mail?', 'normal', true],
  ['Tiago', 'Boa tarde, tudo bem?', 'baixa', false],
].map(([name, message, urgency, unknown], i) => ({
  name, message, urgency, unknown, time: hhmm(8 * 60 + i * 3),
}));

const RAW_TRI = [
  ['Ana', 'Financeiro', 'Um', 'Nota fiscal com valor errado'],
  ['Bruno', 'Comercial', 'Parte', 'Planilha de metas desatualizada'],
  ['Carla', 'Suporte', 'Todos', 'Sistema de atendimento fora do ar'],
  ['Diego', 'Financeiro', 'Parte', 'Fechamento do mês travado'],
  ['Elisa', 'Comercial', 'Todos', 'CRM não carrega para ninguém'],
  ['Fábio', 'Suporte', 'Um', 'Impressora do 2º andar sem toner'],
  ['Gisele', 'Financeiro', 'Todos', 'Pagamentos não estão conciliando'],
  ['Hugo', 'Comercial', 'Um', 'Dúvida sobre desconto de um cliente'],
  ['Inês', 'Suporte', 'Parte', 'Lentidão no acesso remoto'],
  ['João', 'Financeiro', 'Um', 'Relatório de fluxo de caixa desatualizado'],
  ['Karina', 'Comercial', 'Parte', 'Proposta com formatação quebrada'],
  ['Luis', 'Suporte', 'Todos', 'Queda de internet no escritório todo'],
  ['Marta', 'Financeiro', 'Parte', 'Aprovações de compra paradas'],
  ['Nilo', 'Comercial', 'Todos', 'Base de leads sem acesso'],
  ['Olga', 'Suporte', 'Um', 'Headset com defeito'],
  ['Pedro', 'Financeiro', 'Todos', 'Erro no cálculo da folha'],
].map(([who, sector, impact, desc], i) => ({
  who, sector, impact, desc, time: hhmm(9 * 60 + i * 2),
}));

const RAW_REL = [
  [1, -18, false], [2, 4, false], [3, 12, true], [4, -24, false],
  [5, 8, false], [6, 15, false], [7, -6, false], [8, 22, false],
  [9, 3, true], [10, -11, false], [11, 9, false], [12, -2, false],
].map(([day, variation, failed]) => ({ day, variation, failed, time: 'Dia ' + day }));

const SCENARIOS = {
  whatsapp: {
    id: 'whatsapp',
    label: 'Atendimento WhatsApp',
    icon: '💬',
    mission: 'Uma clínica recebe 18 mensagens em uma hora. A IA já responde o que está na base. Sua missão: interromper o time só quando importa e chamar um humano só quando a IA travar.',
    hint: 'Urgência alta é risco clínico. "A IA não sabe" é diferente de "é urgente".',
    total: RAW_WHATS.length,
    demo: RAW_WHATS,
    rules: [
      { id: 'alertWhen', label: 'Alertar o time quando a urgência for', type: 'select', def: 'todas', ideal: 'alta',
        options: [['todas', 'Todas as mensagens'], ['alta_normal', 'Alta ou Normal'], ['alta', 'Só Alta'], ['nunca', 'Nunca alertar']] },
      { id: 'transferWhen', label: 'Chamar um humano quando', type: 'select', def: 'sempre', ideal: 'incerto',
        options: [['sempre', 'Sempre'], ['incerto', 'Só quando a IA não souber'], ['nunca', 'Nunca']] },
      { id: 'record', label: 'Registrar a conversa no histórico', type: 'toggle', def: false, ideal: true },
    ],
    form: [
      { id: 'name', label: 'Nome do cliente', type: 'text', def: 'Maria' },
      { id: 'message', label: 'Mensagem', type: 'textarea', def: 'Estou com dor forte, preciso de atendimento hoje' },
      { id: 'urgency', label: 'Urgência', type: 'select', def: 'alta', options: [['alta', 'Alta'], ['normal', 'Normal'], ['baixa', 'Baixa']] },
      { id: 'unknown', label: 'A IA não tem essa resposta', type: 'toggle', def: false },
    ],
    view(ev) {
      return {
        title: ev.name,
        text: '"' + ev.message + '"',
        tag: ev.urgency === 'alta' ? 'ALTA' : ev.urgency === 'normal' ? 'NORMAL' : 'BAIXA',
        alertTitle: 'Mensagem urgente',
        alertBody: ev.name + ': ' + ev.message,
      };
    },
  },
  triagem: {
    id: 'triagem',
    label: 'Triagem de solicitações',
    icon: '🗂️',
    mission: '16 solicitações chegam ao suporte. O financeiro atrasa o fechamento quando algo trava. Sua missão: acertar a prioridade sem afogar o time em alertas.',
    hint: 'Financeiro tem regra própria: qualquer coisa parada lá atrasa o fechamento do mês.',
    total: RAW_TRI.length,
    demo: RAW_TRI,
    rules: [
      { id: 'highWhen', label: 'Prioridade ALTA quando o impacto for', type: 'select', def: 'qualquer', ideal: 'todos',
        options: [['todos', '"Todos" apenas'], ['todos_parte', '"Todos" ou "Parte"'], ['qualquer', 'Qualquer impacto'], ['nenhum', 'Nenhum (sempre normal)']] },
      { id: 'finance', label: 'Pedidos do Financeiro são sempre críticos', type: 'toggle', def: false, ideal: true },
      { id: 'protocol', label: 'Gerar protocolo automático', type: 'toggle', def: false, ideal: true },
    ],
    form: [
      { id: 'who', label: 'Solicitante', type: 'text', def: 'Ana' },
      { id: 'sector', label: 'Setor', type: 'select', def: 'Financeiro', options: [['Financeiro', 'Financeiro'], ['Comercial', 'Comercial'], ['Suporte', 'Suporte']] },
      { id: 'impact', label: 'Impacto', type: 'select', def: 'Todos', options: [['Todos', 'Todos'], ['Parte', 'Parte'], ['Um', 'Um']] },
      { id: 'desc', label: 'Descrição', type: 'textarea', def: 'Sistema de atendimento fora do ar' },
    ],
    view(ev) {
      return {
        title: ev.who,
        text: ev.sector + ': ' + ev.desc,
        tag: 'ALTA',
        alertTitle: 'Solicitação crítica',
        alertBody: ev.who + ' · ' + ev.sector + ': ' + ev.desc,
      };
    },
  },
  relatorio: {
    id: 'relatorio',
    label: 'Relatório diário',
    icon: '📊',
    mission: 'A diretoria espera o fechamento às 8h. A fonte de dados falha de vez em quando. Sua missão: entregar no prazo, avisar o que importa e nunca falhar em silêncio.',
    hint: 'Variação de 10% ou mais merece aviso separado. Falha da fonte não é "dia sem novidades".',
    total: RAW_REL.length,
    demo: RAW_REL,
    rules: [
      { id: 'sendAt', label: 'Horário do envio automático', type: 'select', def: '12', ideal: '08',
        options: [['08', '08:00'], ['09', '09:00'], ['12', '12:00']] },
      { id: 'threshold', label: 'Avisar a diretoria quando a variação passar de', type: 'select', def: 'nunca', ideal: '10',
        options: [['5', '5%'], ['10', '10%'], ['20', '20%'], ['nunca', 'Nunca avisar']] },
      { id: 'recipients', label: 'Quem recebe o relatório', type: 'select', def: 'todos', ideal: 'diretoria',
        options: [['diretoria', 'Só a diretoria'], ['todos', 'Toda a empresa'], ['ninguem', 'Ninguém']] },
      { id: 'failAlert', label: 'Avisar quando a fonte de dados falhar', type: 'toggle', def: false, ideal: true },
    ],
    form: [
      { id: 'day', label: 'Dia do mês', type: 'number', def: 13 },
      { id: 'variation', label: 'Variação (%)', type: 'number', def: -15 },
      { id: 'failed', label: 'A fonte de dados falhou', type: 'toggle', def: false },
    ],
    view(ev) {
      return {
        title: 'Dia ' + ev.day,
        text: 'variação ' + signed(ev.variation) + '%' + (ev.failed ? ' · fonte falhou' : ''),
        tag: ev.failed ? 'FALHA' : Math.abs(ev.variation) >= 10 ? '10%+' : 'AVISO',
        alertTitle: 'Alerta do fechamento',
        alertBody: ev.failed ? 'Fonte de dados falhou — relatório não enviado' : 'Dia ' + ev.day + ': variação ' + signed(ev.variation) + '%',
      };
    },
  },
};

/* ============================================================
   2. Helpers
   ============================================================ */

function hhmm(min) {
  return String(Math.floor(min / 60)).padStart(2, '0') + ':' + String(min % 60).padStart(2, '0');
}
function signed(v) {
  return (v > 0 ? '+' : '') + v;
}
function clamp(v, a, b) {
  return Math.max(a, Math.min(b, v));
}
function avg(a) {
  return a.length ? a.reduce((s, v) => s + v, 0) / a.length : null;
}
function f1score(tp, fp, fn) {
  const p = tp + fp ? tp / (tp + fp) : 0;
  const r = tp + fn ? tp / (tp + fn) : 0;
  return p + r ? (2 * p * r) / (p + r) : 0;
}
function fmtSec(s) {
  if (s == null) return '—';
  if (s < 60) return Math.round(s) + ' s';
  return Math.round(s / 60) + ' min';
}
function pctTxt(n, d) {
  return d ? Math.round((n / d) * 100) + '%' : '—';
}
function labelRecipients(v) {
  return v === 'diretoria' ? 'diretoria' : v === 'todos' ? 'toda a empresa' : 'ninguém';
}

/* ============================================================
   3. Decisão (o cérebro da automação)
   ============================================================ */

function decideWhats(ev, r) {
  const alert =
    r.alertWhen === 'todas' ||
    (r.alertWhen === 'alta_normal' && ev.urgency !== 'baixa') ||
    (r.alertWhen === 'alta' && ev.urgency === 'alta');
  const transfer = r.transferWhen === 'sempre' || (r.transferWhen === 'incerto' && ev.unknown);
  const unresolved = ev.unknown && !transfer;
  const responseSec = unresolved ? null : transfer ? 45 : 3;
  const bits = [];
  if (alert) bits.push('alerta o time');
  bits.push(unresolved ? 'sem resposta' : transfer ? 'humano assume (45 s)' : 'IA responde (3 s)');
  return {
    alert, transfer, record: !!r.record, unresolved, responseSec,
    idealAlert: ev.urgency === 'alta', idealTransfer: ev.unknown,
    condTxt: 'urgência ' + ev.urgency + ' → ' + (alert ? 'alerta' : 'silêncio'),
    actionTxt: bits.join(' + '),
    recordTxt: r.record ? 'conversa salva no histórico' : 'nada registrado',
  };
}

function decideTri(ev, r) {
  const base =
    r.highWhen === 'qualquer' ||
    (r.highWhen === 'todos_parte' && ev.impact !== 'Um') ||
    (r.highWhen === 'todos' && ev.impact === 'Todos');
  const high = base || (!!r.finance && ev.sector === 'Financeiro');
  const idealHigh = ev.impact === 'Todos' || ev.sector === 'Financeiro';
  return {
    high, idealHigh, alert: high, record: !!r.protocol, protocol: !!r.protocol,
    sector: ev.sector, responseSec: 5, idealAlert: idealHigh,
    condTxt: 'impacto ' + ev.impact + ' · ' + ev.sector + ' → ' + (high ? 'ALTA' : 'normal'),
    actionTxt: (high ? 'alerta responsável + ' : '') + 'encaminha ' + ev.sector,
    recordTxt: r.protocol ? 'protocolo gerado e salvo' : 'sem protocolo',
  };
}

function decideRel(ev, r) {
  const th = r.threshold === 'nunca' ? Infinity : Number(r.threshold);
  const varAlert = Math.abs(ev.variation) >= th;
  const failAlert = !!r.failAlert && ev.failed;
  const alert = varAlert || failAlert;
  const idealAlert = ev.failed || Math.abs(ev.variation) >= 10;
  const punct = r.sendAt === '08' ? 1 : r.sendAt === '09' ? 0.6 : 0.2;
  const audience = r.recipients === 'diretoria' ? 1 : r.recipients === 'todos' ? 0.5 : 0;
  const delivered = !ev.failed && r.recipients !== 'ninguem';
  return {
    alert, idealAlert, punct, audience, delivered,
    detected: ev.failed && !!r.failAlert,
    record: delivered, responseSec: 0,
    condTxt: (ev.failed ? 'fonte falhou' : 'variação ' + signed(ev.variation) + '%') + ' → ' + (alert ? 'aviso' : 'só registro'),
    actionTxt: ev.failed
      ? (r.failAlert ? 'avisa falha (não envia dado errado)' : 'envia relatório mesmo assim')
      : 'envia para ' + labelRecipients(r.recipients),
    recordTxt: delivered ? 'envio registrado' : 'sem entrega registrada',
  };
}

const DECIDERS = { whatsapp: decideWhats, triagem: decideTri, relatorio: decideRel };

/* ============================================================
   4. Placar e indicadores
   ============================================================ */

function scoreWhats(evs) {
  const n = evs.length;
  if (!n) return { score: 0, parts: [], counts: {} };
  const answered = evs.filter((e) => e.dec.responseSec != null);
  const sla = answered.filter((e) => e.dec.responseSec <= 120).length / n;
  const tp = evs.filter((e) => e.dec.alert && e.dec.idealAlert).length;
  const fp = evs.filter((e) => e.dec.alert && !e.dec.idealAlert).length;
  const fn = evs.filter((e) => !e.dec.alert && e.dec.idealAlert).length;
  const f = f1score(tp, fp, fn);
  const rec = evs.filter((e) => e.dec.record).length / n;
  const transfers = evs.filter((e) => e.dec.transfer).length;
  const idealT = evs.filter((e) => e.dec.idealTransfer).length;
  const load = 1 - Math.min(1, Math.abs(transfers - idealT) / n);
  return {
    score: Math.round(40 * sla + 30 * f + 20 * rec + 10 * load),
    parts: [
      { label: 'Resposta em até 2 min', v: sla, w: 40 },
      { label: 'Alertas certos (F1)', v: f, w: 30 },
      { label: 'Conversas registradas', v: rec, w: 20 },
      { label: 'Carga humana equilibrada', v: load, w: 10 },
    ],
    counts: { tp, fp, fn, transfers, idealT, answered: answered.length },
  };
}

function scoreTri(evs) {
  const n = evs.length;
  if (!n) return { score: 0, parts: [], counts: {} };
  const acc = evs.filter((e) => e.dec.high === e.dec.idealHigh).length / n;
  const prot = evs.filter((e) => e.dec.record).length / n;
  const tp = evs.filter((e) => e.dec.alert && e.dec.idealAlert).length;
  const fp = evs.filter((e) => e.dec.alert && !e.dec.idealAlert).length;
  const fn = evs.filter((e) => !e.dec.alert && e.dec.idealAlert).length;
  const f = f1score(tp, fp, fn);
  return {
    score: Math.round(45 * acc + 30 * f + 25 * prot),
    parts: [
      { label: 'Prioridade correta', v: acc, w: 45 },
      { label: 'Alertas certos (F1)', v: f, w: 30 },
      { label: 'Protocolos gerados', v: prot, w: 25 },
    ],
    counts: { tp, fp, fn },
  };
}

function scoreRel(evs) {
  const n = evs.length;
  if (!n) return { score: 0, parts: [], counts: {} };
  const punct = avg(evs.map((e) => e.dec.punct));
  const tp = evs.filter((e) => e.dec.alert && e.dec.idealAlert).length;
  const fp = evs.filter((e) => e.dec.alert && !e.dec.idealAlert).length;
  const fn = evs.filter((e) => !e.dec.alert && e.dec.idealAlert).length;
  const f = f1score(tp, fp, fn);
  const okDays = evs.filter((e) => !e.payload.failed);
  const audience = okDays.length ? avg(okDays.map((e) => e.dec.audience)) : 1;
  const fails = evs.filter((e) => e.payload.failed);
  const detected = fails.filter((e) => e.dec.detected).length;
  const failScore = fails.length ? detected / fails.length : 1;
  const delivery = okDays.length ? okDays.filter((e) => e.dec.delivered).length / okDays.length : 1;
  return {
    score: Math.round(30 * punct + 25 * f + 20 * audience + 15 * failScore + 10 * delivery),
    parts: [
      { label: 'Relatório às 8h', v: punct, w: 30 },
      { label: 'Avisos certos (F1)', v: f, w: 25 },
      { label: 'Público certo', v: audience, w: 20 },
      { label: 'Falhas detectadas', v: failScore, w: 15 },
      { label: 'Entregas concluídas', v: delivery, w: 10 },
    ],
    counts: { tp, fp, fn, detected, fails: fails.length },
  };
}

const SCORERS = { whatsapp: scoreWhats, triagem: scoreTri, relatorio: scoreRel };

function kpisWhats(evs) {
  const n = evs.length;
  const answered = evs.filter((e) => e.dec.responseSec != null);
  const avgS = answered.length ? avg(answered.map((e) => e.dec.responseSec)) : null;
  const sla = evs.filter((e) => e.dec.responseSec != null && e.dec.responseSec <= 120).length;
  const tp = evs.filter((e) => e.dec.alert && e.dec.idealAlert).length;
  const fp = evs.filter((e) => e.dec.alert && !e.dec.idealAlert).length;
  const fn = evs.filter((e) => !e.dec.alert && e.dec.idealAlert).length;
  return [
    { label: '1ª resposta (média)', value: fmtSec(avgS) },
    { label: 'Dentro de 2 min', value: pctTxt(sla, n), bar: sla / n },
    { label: 'Alertas certos', value: tp + fp ? pctTxt(tp, tp + fp) : '—', bar: tp + fp ? tp / (tp + fp) : 0 },
    { label: 'Urgentes perdidos', value: fn, bad: fn > 0 },
  ];
}

function kpisTri(evs) {
  const n = evs.length;
  const acc = evs.filter((e) => e.dec.high === e.dec.idealHigh).length;
  const prot = evs.filter((e) => e.dec.record).length;
  const tp = evs.filter((e) => e.dec.alert && e.dec.idealAlert).length;
  const fp = evs.filter((e) => e.dec.alert && !e.dec.idealAlert).length;
  const fn = evs.filter((e) => !e.dec.alert && e.dec.idealAlert).length;
  return [
    { label: 'Prioridade correta', value: pctTxt(acc, n), bar: acc / n },
    { label: 'Protocolos gerados', value: pctTxt(prot, n), bar: prot / n },
    { label: 'Alertas certos', value: tp + fp ? pctTxt(tp, tp + fp) : '—', bar: tp + fp ? tp / (tp + fp) : 0 },
    { label: 'Críticos perdidos', value: fn, bad: fn > 0 },
  ];
}

function kpisRel(evs) {
  const punct = avg(evs.map((e) => e.dec.punct));
  const tp = evs.filter((e) => e.dec.alert && e.dec.idealAlert).length;
  const fp = evs.filter((e) => e.dec.alert && !e.dec.idealAlert).length;
  const fn = evs.filter((e) => !e.dec.alert && e.dec.idealAlert).length;
  const f = f1score(tp, fp, fn);
  const fails = evs.filter((e) => e.payload.failed);
  const det = fails.filter((e) => e.dec.detected).length;
  return [
    { label: 'Relatórios no prazo', value: Math.round(punct * 100) + '%', bar: punct },
    { label: 'Avisos certos', value: Math.round(f * 100) + '%', bar: f },
    { label: 'Falhas detectadas', value: fails.length ? det + ' / ' + fails.length : '—', bad: fails.length > 0 && det < fails.length },
    { label: 'Dias entregues', value: pctTxt(evs.filter((e) => e.dec.delivered).length, evs.filter((e) => !e.payload.failed).length) },
  ];
}

const KPIS = { whatsapp: kpisWhats, triagem: kpisTri, relatorio: kpisRel };

function grade(v) {
  if (v >= 90) return { short: 'excelente', long: 'Automação de gente grande', desc: 'Regras limpas, sem ruído. Isso está pronto para produção.' };
  if (v >= 75) return { short: 'boa', long: 'Boa — dá para produção', desc: 'Um ou dois ajustes e o time para de ser interrompido à toa.' };
  if (v >= 50) return { short: 'com ruído', long: 'Funciona, mas gera ruído', desc: 'A automação roda, mas ainda interrompe quem não devia ou perde o que importa.' };
  return { short: 'rever', long: 'Volte ao mapa do processo', desc: 'O fluxo executa, mas as regras ainda não representam o processo real.' };
}

/* ============================================================
   5. Sessões (memória — free tier, sem banco)
   ============================================================ */

const sessions = new Map();

function defaultsFor(scenarioId) {
  const out = {};
  SCENARIOS[scenarioId].rules.forEach((r) => (out[r.id] = r.def));
  return out;
}

function sanitizeRules(scenarioId, input, base) {
  const out = {};
  SCENARIOS[scenarioId].rules.forEach((r) => {
    const v = input ? input[r.id] : undefined;
    if (r.type === 'toggle') out[r.id] = typeof v === 'boolean' ? v : base[r.id];
    else out[r.id] = r.options.some((o) => o[0] === v) ? v : base[r.id];
  });
  return out;
}

function cleanOutbound(v) {
  if (!v) return '';
  let u;
  try {
    u = new URL(String(v).trim());
  } catch (e) {
    return { error: 'URL inválida. Use algo como https://webhook.site/....' };
  }
  if (u.protocol !== 'https:') return { error: 'Por segurança, o destino precisa ser https://' };
  const host = u.hostname.toLowerCase().replace(/\.$/, '');
  const literalIp = /^\d{1,3}(\.\d{1,3}){3}$/.test(host) || /^\d+$/.test(host) || host.startsWith('[');
  if (
    host === 'localhost' ||
    host.endsWith('.localhost') ||
    host.endsWith('.local') ||
    host.endsWith('.internal') ||
    literalIp
  ) {
    return { error: 'Esse destino não é permitido. Use um endereço público (ex.: webhook.site).' };
  }
  return { url: u.toString().slice(0, 500) };
}

function createSession(name, scenarioId) {
  if (!SCENARIOS[scenarioId]) return null;
  const id = crypto.randomBytes(5).toString('hex');
  const key = crypto.randomBytes(16).toString('hex');
  const s = {
    id,
    key,
    name: String(name || '').trim().slice(0, 40) || 'Meu robô',
    scenario: scenarioId,
    rules: defaultsFor(scenarioId),
    outbound: '',
    events: [],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
  sessions.set(id, s);
  enforceLimit();
  return s;
}

function enforceLimit() {
  if (sessions.size <= MAX_SESSIONS) return;
  const list = [...sessions.values()].sort((a, b) => a.updatedAt - b.updatedAt);
  while (sessions.size > MAX_SESSIONS && list.length) sessions.delete(list.shift().id);
}

function cleanupSessions() {
  const cut = Date.now() - TTL_MS;
  sessions.forEach((s, id) => {
    if (s.updatedAt < cut) sessions.delete(id);
  });
}

/* ============================================================
   6. Entrada de eventos (o webhook real)
   ============================================================ */

function normalizePayload(scenarioId, raw) {
  const p = raw && typeof raw === 'object' ? raw : {};
  const str = (v, max) => String(v == null ? '' : v).trim().slice(0, max);

  if (scenarioId === 'whatsapp') {
    const urgency = str(p.urgency, 10).toLowerCase();
    if (!['alta', 'normal', 'baixa'].includes(urgency)) {
      return { error: 'Campo "urgency" deve ser "alta", "normal" ou "baixa".' };
    }
    return {
      payload: {
        name: str(p.name, 60) || 'Cliente',
        message: str(p.message, 400) || '(sem mensagem)',
        urgency,
        unknown: p.unknown === true || p.unknown === 'true',
        time: str(p.time, 10),
      },
    };
  }

  if (scenarioId === 'triagem') {
    const impact = str(p.impact, 10);
    if (!['Todos', 'Parte', 'Um'].includes(impact)) {
      return { error: 'Campo "impact" deve ser "Todos", "Parte" ou "Um".' };
    }
    return {
      payload: {
        who: str(p.who, 60) || 'Solicitante',
        sector: str(p.sector, 30) || 'Suporte',
        impact,
        desc: str(p.desc, 400) || '(sem descrição)',
        time: str(p.time, 10),
      },
    };
  }

  const day = Number(p.day);
  const variation = Number(p.variation);
  if (!Number.isFinite(day) || day < 1 || day > 31) {
    return { error: 'Campo "day" deve ser um número de 1 a 31.' };
  }
  if (!Number.isFinite(variation) || variation < -100 || variation > 100) {
    return { error: 'Campo "variation" deve ser um número entre -100 e 100.' };
  }
  return {
    payload: {
      day: Math.round(day),
      variation: Math.round(variation * 10) / 10,
      failed: p.failed === true || p.failed === 'true',
      time: str(p.time, 10) || 'Dia ' + Math.round(day),
    },
  };
}

function processEvent(session, payload) {
  const sc = SCENARIOS[session.scenario];
  const dec = DECIDERS[session.scenario](payload, session.rules);
  const view = sc.view(payload);
  const ev = {
    n: session.events.length + 1,
    at: new Date().toISOString(),
    time: payload.time || new Date().toISOString().slice(11, 16),
    payload,
    dec,
    view,
  };
  session.events.push(ev);
  if (session.events.length > MAX_EVENTS) {
    session.events.splice(0, session.events.length - MAX_EVENTS);
  }
  session.updatedAt = Date.now();
  if (dec.alert && session.outbound) sendOutbound(session, ev);
  return ev;
}

function sendOutbound(session, ev) {
  const started = Date.now();
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 3500);
  const body = JSON.stringify({
    alerta: 'NOVA SOLICITAÇÃO',
    cenario: SCENARIOS[session.scenario].label,
    titulo: ev.view.alertTitle,
    texto: ev.view.alertBody,
    quando: ev.at,
    dados: ev.payload,
  });
  fetch(session.outbound, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body,
    signal: ctrl.signal,
  })
    .then((r) => {
      ev.delivery = { status: r.status, ms: Date.now() - started };
    })
    .catch((err) => {
      ev.delivery = { status: 0, ms: Date.now() - started, error: String((err && err.message) || err).slice(0, 120) };
    })
    .finally(() => clearTimeout(timer));
}

/* ============================================================
   7. Estado e API
   ============================================================ */

function stateOf(s) {
  const evs = s.events;
  const res = evs.length ? SCORERS[s.scenario](evs) : null;
  const g = res ? grade(res.score) : null;
  return {
    id: s.id,
    name: s.name,
    scenario: s.scenario,
    rules: s.rules,
    outbound: s.outbound,
    total: SCENARIOS[s.scenario].total,
    events: evs.slice(-250),
    score: res ? res.score : null,
    grade: g,
    parts: res ? res.parts : [],
    counts: res ? res.counts : {},
    kpis: evs.length ? KPIS[s.scenario](evs) : [],
    createdAt: s.createdAt,
    updatedAt: s.updatedAt,
  };
}

function sendJson(res, code, obj) {
  const body = JSON.stringify(obj);
  res.writeHead(code, {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store',
    'x-content-type-options': 'nosniff',
    'content-length': Buffer.byteLength(body),
  });
  res.end(body);
}

function sendText(res, code, text) {
  res.writeHead(code, {
    'content-type': 'text/plain; charset=utf-8',
    'cache-control': 'no-store',
    'x-content-type-options': 'nosniff',
  });
  res.end(text);
}

function readJson(req) {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];
    req.on('data', (c) => {
      size += c.length;
      if (size > MAX_BODY) {
        reject(Object.assign(new Error('Corpo muito grande'), { status: 413 }));
        req.destroy();
        return;
      }
      chunks.push(c);
    });
    req.on('end', () => {
      if (!chunks.length) return resolve({});
      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString('utf8')));
      } catch (e) {
        reject(Object.assign(new Error('JSON inválido'), { status: 400 }));
      }
    });
    req.on('error', reject);
  });
}

function authorized(req, s) {
  return !!(s && req.headers['x-key'] && req.headers['x-key'] === s.key);
}

function cors(res) {
  res.setHeader('access-control-allow-origin', '*');
  res.setHeader('access-control-allow-methods', 'POST, OPTIONS');
  res.setHeader('access-control-allow-headers', 'content-type');
  res.setHeader('access-control-max-age', '86400');
}

async function api(req, res, pathname, url) {
  const parts = pathname.split('/').filter(Boolean); // api, ...

  if (req.method === 'OPTIONS') {
    cors(res);
    res.writeHead(204);
    return res.end();
  }

  if (pathname === '/api/meta' && req.method === 'GET') {
    const out = { scenarios: {}, limits: { maxEvents: MAX_EVENTS, ttlHours: TTL_MS / 3600000 } };
    Object.values(SCENARIOS).forEach((sc) => {
      out.scenarios[sc.id] = {
        id: sc.id, label: sc.label, icon: sc.icon, mission: sc.mission, hint: sc.hint,
        total: sc.total,
        rules: sc.rules.map((r) => ({ id: r.id, label: r.label, type: r.type, def: r.def, options: r.options || null })),
        form: sc.form,
        demo: sc.demo,
      };
    });
    return sendJson(res, 200, out);
  }

  if (pathname === '/api/sessions' && req.method === 'POST') {
    const body = await readJson(req);
    if (!SCENARIOS[body.scenario]) return sendJson(res, 400, { error: 'Cenário inválido.' });
    const s = createSession(body.name, body.scenario);
    return sendJson(res, 201, { id: s.id, key: s.key, state: stateOf(s) });
  }

  if (parts[1] === 'sessions' && parts[2]) {
    const s = sessions.get(parts[2]);
    if (!s) return sendJson(res, 404, { error: 'Espaço não encontrado. Ele expira após 3 horas sem uso.' });
    if (!authorized(req, s)) return sendJson(res, 403, { error: 'Chave de acesso inválida. Volte ao seu espaço pelo mesmo navegador.' });

    if (req.method === 'GET') return sendJson(res, 200, { state: stateOf(s) });

    if (req.method === 'PATCH') {
      const body = await readJson(req);
      if (body.name != null) s.name = String(body.name).trim().slice(0, 40) || s.name;

      if (body.scenario && body.scenario !== s.scenario) {
        if (!SCENARIOS[body.scenario]) return sendJson(res, 400, { error: 'Cenário inválido.' });
        s.scenario = body.scenario;
        s.rules = defaultsFor(body.scenario);
        s.events = [];
      }
      if (body.rules && typeof body.rules === 'object') {
        s.rules = sanitizeRules(s.scenario, body.rules, s.rules);
      }
      if (body.outbound !== undefined) {
        const checked = cleanOutbound(body.outbound);
        if (checked.error) return sendJson(res, 400, { error: checked.error });
        s.outbound = checked.url || '';
      }
      s.updatedAt = Date.now();
      return sendJson(res, 200, { state: stateOf(s) });
    }

    if (req.method === 'POST' && parts[3] === 'reset') {
      s.events = [];
      s.updatedAt = Date.now();
      return sendJson(res, 200, { state: stateOf(s) });
    }

    return sendJson(res, 405, { error: 'Método não permitido.' });
  }

  if (pathname === '/api/board' && req.method === 'GET') {
    const rows = [...sessions.values()]
      .filter((s) => s.events.length > 0)
      .map((s) => {
        const res = SCORERS[s.scenario](s.events);
        return {
          id: s.id,
          name: s.name,
          scenario: s.scenario,
          icon: SCENARIOS[s.scenario].icon,
          score: res.score,
          events: s.events.length,
          total: SCENARIOS[s.scenario].total,
          updatedAt: s.updatedAt,
        };
      })
      .sort((a, b) => b.score - a.score || b.events - a.events)
      .slice(0, 30);
    return sendJson(res, 200, { rows });
  }

  if (parts[1] === 'hook' && parts[2]) {
    cors(res);
    const s = sessions.get(parts[2]);
    if (!s) return sendJson(res, 404, { error: 'Webhook não encontrado (o espaço expirou?).' });
    if (req.method !== 'POST') return sendJson(res, 405, { error: 'Use POST.' });
    const body = await readJson(req);
    const norm = normalizePayload(s.scenario, body);
    if (norm.error) return sendJson(res, 400, { error: norm.error });
    const ev = processEvent(s, norm.payload);
    return sendJson(res, 202, {
      ok: true,
      n: ev.n,
      alert: ev.dec.alert,
      decision: { condTxt: ev.dec.condTxt, actionTxt: ev.dec.actionTxt, recordTxt: ev.dec.recordTxt },
      view: ev.view,
    });
  }

  return sendJson(res, 404, { error: 'Rota não encontrada.' });
}

/* ============================================================
   8. Arquivos estáticos e servidor
   ============================================================ */

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain; charset=utf-8',
};

function serveStatic(req, res, pathname) {
  if (req.method !== 'GET' && req.method !== 'HEAD') return sendText(res, 405, 'Método não permitido');
  let file = pathname === '/' ? 'index.html' : pathname === '/painel' ? 'painel.html' : pathname.replace(/^\/+/, '');
  if (!file || file.includes('..') || file.includes('\0')) return sendText(res, 400, 'Caminho inválido');
  const full = path.join(PUBLIC, file);
  fs.readFile(full, (err, buf) => {
    if (err) return sendText(res, 404, 'Não encontrado');
    const ext = path.extname(full).toLowerCase();
    res.writeHead(200, {
      'content-type': MIME[ext] || 'application/octet-stream',
      'cache-control': ['.html', '.css', '.js'].includes(ext) ? 'no-cache' : 'public, max-age=300',
      'x-content-type-options': 'nosniff',
      'referrer-policy': 'no-referrer',
    });
    res.end(req.method === 'HEAD' ? undefined : buf);
  });
}

const server = http.createServer((req, res) => {
  let url;
  try {
    url = new URL(req.url, 'http://' + (req.headers.host || 'localhost'));
  } catch (e) {
    return sendText(res, 400, 'Requisição inválida');
  }
  const pathname = (() => {
    try {
      return decodeURIComponent(url.pathname);
    } catch (e) {
      return null;
    }
  })();
  if (pathname === null) return sendText(res, 400, 'Caminho inválido');
  if (pathname === '/healthz') return sendText(res, 200, 'ok');
  if (pathname.startsWith('/api/')) {
    api(req, res, pathname, url).catch((err) => {
      const status = err && err.status ? err.status : 500;
      if (status === 500) console.error('[api]', err);
      if (!res.headersSent) sendJson(res, status, { error: err.message || 'Erro interno' });
      else res.end();
    });
    return;
  }
  serveStatic(req, res, pathname);
});

setInterval(cleanupSessions, 10 * 60 * 1000).unref();

server.listen(PORT, () => {
  console.log('Oficina de Automacao ouvindo em http://localhost:' + PORT);
});

process.on('SIGTERM', () => server.close(() => process.exit(0)));
process.on('SIGINT', () => server.close(() => process.exit(0)));
