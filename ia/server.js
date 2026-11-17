'use strict';

/* ============================================================
   Triagem com IA — demo ao vivo da palestra
   ------------------------------------------------------------
   Um app Node sem dependências que recebe mensagens de trabalho
   (do celular da turma), chama o Gemini com schema fixo e mostra
   no telão: categoria, urgência, resumo, rascunho de resposta,
   próximo passo e confiança.

   Sem chave configurada, cai num classificador por regras para a
   aula nunca travar. O modo usado aparece sempre na tela.
   ============================================================ */

const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

const PORT = Number(process.env.PORT || 3000);
const PUBLIC = path.join(__dirname, 'public');

const GEMINI_KEY = (process.env.GEMINI_API_KEY || '').trim();
const GEMINI_MODEL = (process.env.GEMINI_MODEL || 'gemini-2.5-flash').trim();
const PROVIDER = (process.env.IA_PROVIDER || 'auto').toLowerCase();
const DEMO_TOKEN = (process.env.DEMO_TOKEN || '').trim();

const PRICE_IN = Number(process.env.PRICE_IN || 0.3); // US$ por 1M tokens de entrada
const PRICE_OUT = Number(process.env.PRICE_OUT || 2.5); // US$ por 1M tokens de saída

const LIMITS = {
  text: 800,
  name: 40,
  messages: 200,
  total: Number(process.env.MAX_TOTAL || 600),
  ratePerMin: Number(process.env.RATE_PER_MIN || 12),
  concurrency: Number(process.env.MAX_CONCURRENCY || 6),
  timeoutMs: Number(process.env.AI_TIMEOUT_MS || 12000),
  humanMin: Number(process.env.HUMAN_MIN || 4),
};

const CATEGORIAS = ['suporte', 'financeiro', 'comercial', 'rh', 'operacao', 'outro'];
const URGENCIAS = ['critica', 'alta', 'media', 'baixa'];
const SENTIMENTOS = ['irritado', 'neutro', 'satisfeito'];

const URG_LABEL = { critica: 'Crítica', alta: 'Alta', media: 'Média', baixa: 'Baixa' };
const CAT_LABEL = {
  suporte: 'Suporte',
  financeiro: 'Financeiro',
  comercial: 'Comercial',
  rh: 'RH',
  operacao: 'Operação',
  outro: 'Outro',
};

/* ============================================================
   Amostras da demo controlada (/demo)
   ============================================================ */

const SAMPLES = [
  {
    id: 'pix',
    label: 'Pix sumiu',
    hint: 'Financeiro + crítico + cliente irritado',
    name: 'Cliente (WhatsApp)',
    text:
      'Bom dia, fiz um pix de 1.200 ontem e o pedido nao aparece no sistema!! ja paguei e ninguem resolve, ' +
      'isso é um absurdo, preciso do produto ainda essa semana',
  },
  {
    id: 'sistema',
    label: 'Sistema caiu',
    hint: 'Suporte + crítico + equipe parada',
    name: 'Gerente da loja',
    text:
      'o sistema caiu de novo, terceira vez essa semana. a equipe toda parada sem conseguir abrir caixa. ' +
      'ja reiniciei o roteador e nada',
  },
  {
    id: 'orcamento',
    label: 'Cotação com prazo',
    hint: 'Comercial + médio + oportunidade',
    name: 'Prospect',
    text:
      'oi! queria saber se vocês têm o modelo X na cor azul, quantas unidades em estoque e se entrega até sexta? ' +
      'é pra um presente, então o prazo importa bastante',
  },
  {
    id: 'relatorio',
    label: 'Relatório para o conselho',
    hint: 'Operação + alta + prazo amanhã',
    name: 'Diretoria',
    text:
      'preciso do relatorio de vendas de outubro com a comparacao do trimestre pro conselho amanha as 9h, ' +
      'consegue me mandar ate o fim do dia?',
  },
  {
    id: 'ambiguo',
    label: 'Mensagem ambígua',
    hint: 'Confiança baixa: a IA pergunta em vez de inventar',
    name: 'Colega',
    text:
      'bom dia! tudo bem? poderia me enviar aquele documento que conversamos? obrigado',
  },
];

/* ============================================================
   Estado em memória
   ============================================================ */

const store = {
  list: [],
  seq: 0,
  total: 0,
  msSum: 0,
  cost: 0,
  byUrgency: { critica: 0, alta: 0, media: 0, baixa: 0 },
  byProvider: { gemini: 0, regra: 0, fake: 0 },
  cache: new Map(),
  startedAt: Date.now(),
};

let active = 0;
const rate = new Map();

/* ============================================================
   Utilidades
   ============================================================ */

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function clip(s, n) {
  const t = String(s == null ? '' : s).replace(/\s+/g, ' ').trim();
  return t.length > n ? t.slice(0, n - 1).trimEnd() + '…' : t;
}

function hash(s) {
  return crypto.createHash('sha1').update(s).digest('hex');
}

function nowTime() {
  try {
    return new Date().toLocaleTimeString('pt-BR', {
      timeZone: 'America/Sao_Paulo',
      hour12: false,
    });
  } catch (e) {
    return new Date().toISOString().slice(11, 19);
  }
}

function prepareText(v) {
  if (typeof v !== 'string') return '';
  return v.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '').replace(/[ \t]+/g, ' ').trim().slice(0, LIMITS.text);
}

function prepareName(v) {
  if (typeof v !== 'string') return '';
  return v.replace(/[\u0000-\u001F]/g, '').replace(/\s+/g, ' ').trim().slice(0, LIMITS.name);
}

function providerMode() {
  if (PROVIDER === 'fake') return 'fake';
  if (PROVIDER === 'regra') return 'regra';
  if (PROVIDER === 'gemini') return GEMINI_KEY ? 'gemini' : 'regra';
  return GEMINI_KEY ? 'gemini' : 'regra';
}

function shortErr(e) {
  const msg = String((e && e.message) || e || 'erro');
  return clip(msg.replace(/key=[^&\s]+/gi, 'key=***').replace(/x-goog-api-key[^,;]*/gi, ''), 90);
}

/* ============================================================
   Gemini
   ============================================================ */

const SYSTEM_PROMPT = [
  'Você é um assistente de triagem de mensagens de trabalho de uma empresa brasileira.',
  'Receba a mensagem de um cliente ou colega e devolva SOMENTE o JSON do schema pedido.',
  '',
  'Regras:',
  '- categoria: a área que resolve o assunto (suporte, financeiro, comercial, rh, operacao ou outro).',
  '- urgencia: critica = operação parada, dinheiro em risco ou prazo hoje; alta = precisa de resposta hoje;',
  '  media = próximos dias; baixa = informativo.',
  '- sentimento: o tom de quem escreveu.',
  '- resumo: uma linha, no máximo 90 caracteres, sem repetir saudação.',
  '- rascunho: resposta pronta em português do Brasil, cordial e objetiva, no máximo 320 caracteres.',
  '  Não prometa prazo, valor ou política que não esteja na mensagem. Se faltar informação essencial,',
  '  pergunte o mínimo necessário. Assine apenas como "Equipe".',
  '- proximo_passo: ação interna, no máximo 80 caracteres, começando com um verbo.',
  '- confianca: número de 0 a 1. Use abaixo de 0.6 quando a mensagem for ambígua, faltar dado essencial',
  '  ou houver risco de a resposta sair errada.',
  '- Nunca invente números de pedido, valores, prazos ou políticas. Se não estiver escrito, pergunte.',
  '- Se a mensagem não for uma solicitação de trabalho, use categoria "outro" e confiança baixa.',
].join('\n');

const SCHEMA = {
  type: 'object',
  properties: {
    categoria: { type: 'string', enum: CATEGORIAS },
    urgencia: { type: 'string', enum: URGENCIAS },
    sentimento: { type: 'string', enum: SENTIMENTOS },
    resumo: { type: 'string' },
    rascunho: { type: 'string' },
    proximo_passo: { type: 'string' },
    confianca: { type: 'number' },
  },
  required: ['categoria', 'urgencia', 'sentimento', 'resumo', 'rascunho', 'proximo_passo', 'confianca'],
};

function normResult(raw) {
  const r = raw && typeof raw === 'object' ? raw : {};
  const cat = CATEGORIAS.includes(r.categoria) ? r.categoria : 'outro';
  const urg = URGENCIAS.includes(r.urgencia) ? r.urgencia : 'media';
  const sen = SENTIMENTOS.includes(r.sentimento) ? r.sentimento : 'neutro';
  let conf = Number(r.confianca);
  if (!Number.isFinite(conf)) conf = 0.5;
  if (conf > 1) conf = conf / 100;
  conf = Math.max(0, Math.min(1, conf));
  return {
    categoria: cat,
    urgencia: urg,
    sentimento: sen,
    resumo: clip(r.resumo, 120) || '—',
    rascunho: clip(r.rascunho, 420) || '—',
    proximo_passo: clip(r.proximo_passo, 100) || '—',
    confianca: Math.round(conf * 100) / 100,
  };
}

async function callGemini(text, name) {
  const url =
    'https://generativelanguage.googleapis.com/v1beta/models/' +
    encodeURIComponent(GEMINI_MODEL) +
    ':generateContent';

  const generationConfig = {
    temperature: 0.2,
    maxOutputTokens: 900,
    responseMimeType: 'application/json',
    responseSchema: SCHEMA,
  };
  // Modelos 2.5+ pensam por padrão; para demo ao vivo queremos resposta em ~2 s.
  if (/gemini-(2\.5|3)/i.test(GEMINI_MODEL)) {
    generationConfig.thinkingConfig = { thinkingBudget: 0 };
  }

  const body = {
    systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
    contents: [
      {
        role: 'user',
        parts: [
          {
            text:
              'Nome de quem escreveu: ' +
              (name || 'não informado') +
              '\nMensagem:\n"""\n' +
              text +
              '\n"""',
          },
        ],
      },
    ],
    generationConfig,
  };

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), LIMITS.timeoutMs);
  let res;
  let data;
  try {
    res = await fetch(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-goog-api-key': GEMINI_KEY },
      body: JSON.stringify(body),
      signal: ctrl.signal,
    });
    data = await res.json().catch(() => null);
  } finally {
    clearTimeout(timer);
  }

  if (!res.ok) {
    const msg = data && data.error && data.error.message ? data.error.message : '';
    throw new Error('HTTP ' + res.status + (msg ? ': ' + msg : ''));
  }

  const cand = data && data.candidates && data.candidates[0];
  const parts = (cand && cand.content && cand.content.parts) || [];
  const raw = parts.map((p) => p.text || '').join('').trim();
  if (!raw) {
    const reason = cand && cand.finishReason ? ' (' + cand.finishReason + ')' : '';
    throw new Error('resposta vazia' + reason);
  }

  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch (e) {
    const m = raw.match(/\{[\s\S]*\}/);
    if (!m) throw new Error('JSON inválido');
    parsed = JSON.parse(m[0]);
  }

  const usage = data.usageMetadata || {};
  const tin = Number(usage.promptTokenCount || 0);
  const tout = Number(usage.candidatesTokenCount || 0);
  const cost = (tin / 1e6) * PRICE_IN + (tout / 1e6) * PRICE_OUT;

  return { result: normResult(parsed), usage: { in: tin, out: tout }, cost };
}

/* ============================================================
   Plano B: classificador por regras (sem IA)
   ============================================================ */

const RULES = [
  {
    cat: 'financeiro',
    words: ['pix', 'boleto', 'cobrança', 'cobranca', 'pagamento', 'paguei', 'fatura', 'nota fiscal', 'reembolso', 'estorno', 'cartão', 'cartao', 'cobrado', 'débito', 'debito', 'valor errado'],
  },
  {
    cat: 'suporte',
    words: ['caiu', 'fora do ar', 'não funciona', 'nao funciona', 'erro', 'bug', 'travou', 'travando', 'parado', 'parada', 'instável', 'instavel', 'não abre', 'nao abre', 'sistema', 'reiniciei'],
  },
  {
    cat: 'comercial',
    words: ['preço', 'preco', 'orçamento', 'orcamento', 'cotação', 'cotacao', 'estoque', 'comprar', 'pedido', 'desconto', 'modelo', 'entrega até', 'entrega ate', 'prazo'],
  },
  {
    cat: 'rh',
    words: ['currículo', 'curriculo', 'vaga', 'férias', 'ferias', 'holerite', 'contratação', 'contratacao', 'entrevista', 'admissão', 'admissao'],
  },
  {
    cat: 'operacao',
    words: ['relatório', 'relatorio', 'planilha', 'fechamento', 'conselho', 'diretoria', 'reunião', 'reuniao', 'amanhã', 'amanha', 'trimestre'],
  },
];

const ANGRY = ['absurdo', 'péssimo', 'pessimo', 'ninguém', 'ninguem', 'reclamação', 'reclamacao', 'insatisfeito', 'de novo', 'terceira vez', 'já paguei', 'ja paguei', 'urgente'];
const HAPPY = ['obrigado', 'obrigada', 'parabéns', 'parabens', 'ótimo', 'otimo', 'adorei'];
const HOT = ['hoje', 'agora', 'urgente', 'parado', 'parada', 'caiu', 'absurdo', 'ainda essa semana', 'até o fim do dia', 'ate o fim do dia'];

function ruleAnalyze(text, name, polished) {
  const t = text.toLowerCase();
  let best = { cat: 'outro', hits: 0 };
  for (const r of RULES) {
    const hits = r.words.filter((w) => t.includes(w)).length;
    if (hits > best.hits) best = { cat: r.cat, hits };
  }

  const hot = HOT.some((w) => t.includes(w));
  const angry = ANGRY.some((w) => t.includes(w));
  const happy = HAPPY.some((w) => t.includes(w));

  let urg = 'baixa';
  if (best.hits >= 2 || t.length > 160) urg = 'media';
  if (best.cat === 'financeiro' || best.cat === 'suporte') urg = 'alta';
  if (hot) urg = 'alta';
  if (hot && (angry || best.cat === 'suporte' || best.cat === 'financeiro')) urg = 'critica';
  if (best.cat === 'outro' && !hot) urg = 'baixa';

  const who = name ? name.split(' ')[0] : '';
  const oi = who ? 'Olá, ' + who + '.' : 'Olá.';

  const drafts = {
    financeiro:
      oi + ' Recebi sua mensagem sobre o pagamento e já encaminhei para o financeiro conferir. ' +
      'Pode me enviar a data e o comprovante? Retorno com a posição assim que possível.',
    suporte:
      oi + ' Sinto muito pela instabilidade. Já acionei o time técnico e aviso assim que normalizar. ' +
      'Se puder, diga desde quando o problema começou e quantas pessoas estão afetadas.',
    comercial:
      oi + ' Obrigado pelo contato. Vou confirmar disponibilidade, quantidade em estoque e prazo de entrega ' +
      'com o time comercial e te respondo ainda hoje.',
    rh:
      oi + ' Recebi sua mensagem. Encaminhei para o time de pessoas, que vai te responder com os próximos passos.',
    operacao:
      oi + ' Recebi o pedido. Vou levantar os dados e confirmar o prazo de envio ainda hoje.',
    outro:
      oi + ' Recebi sua mensagem. Para te ajudar direito, pode me dizer qual documento e de qual assunto se trata?',
  };

  const steps = {
    financeiro: 'Conferir o pagamento no extrato e responder com o comprovante',
    suporte: 'Abrir chamado crítico e verificar o serviço afetado',
    comercial: 'Checar estoque e prazo com o comercial',
    rh: 'Encaminhar para o time de pessoas',
    operacao: 'Levantar os números e montar o relatório',
    outro: 'Pedir contexto antes de encaminhar',
  };

  const firstLine = clip(text.split(/[.!?\n]/)[0], 84) || clip(text, 84);
  const conf = best.hits >= 2 ? 0.55 : best.cat === 'outro' ? 0.32 : 0.45;

  return {
    categoria: best.cat,
    urgencia: urg,
    sentimento: angry ? 'irritado' : happy ? 'satisfeito' : 'neutro',
    resumo: polished ? clip(firstLine.charAt(0).toUpperCase() + firstLine.slice(1), 90) : clip(firstLine, 90),
    rascunho: drafts[best.cat],
    proximo_passo: steps[best.cat],
    confianca: conf,
  };
}

/* ============================================================
   Análise (IA real ou plano B)
   ============================================================ */

async function analyze(text, name) {
  const mode = providerMode();
  const t0 = Date.now();

  if (mode === 'gemini') {
    if (active >= LIMITS.concurrency) {
      return {
        result: ruleAnalyze(text, name),
        meta: { provider: 'regra', ms: Date.now() - t0, note: 'fila cheia, usei regras' },
      };
    }
    active += 1;
    try {
      const out = await callGemini(text, name);
      return {
        result: out.result,
        meta: { provider: 'gemini', ms: Date.now() - t0, usage: out.usage, cost: out.cost },
      };
    } catch (e) {
      return {
        result: ruleAnalyze(text, name),
        meta: { provider: 'regra', ms: Date.now() - t0, note: 'IA falhou: ' + shortErr(e) },
      };
    } finally {
      active -= 1;
    }
  }

  if (mode === 'fake') {
    const ms = 650 + Math.round(Math.random() * 900);
    await sleep(ms);
    return {
      result: ruleAnalyze(text, name, true),
      meta: { provider: 'fake', ms, note: 'modo ensaio (sem chamada externa)' },
    };
  }

  const result = ruleAnalyze(text, name);
  return { result, meta: { provider: 'regra', ms: Date.now() - t0 } };
}

/* ============================================================
   Fila e estatísticas
   ============================================================ */

function rateLimited(ip) {
  const now = Date.now();
  const cur = rate.get(ip);
  if (!cur || now > cur.resetAt) {
    rate.set(ip, { count: 1, resetAt: now + 60000 });
    return false;
  }
  cur.count += 1;
  return cur.count > LIMITS.ratePerMin;
}

function addMessage(name, text, result, meta) {
  store.seq += 1;
  const msg = {
    id: crypto.randomBytes(4).toString('hex'),
    n: store.seq,
    name: name || 'Anônimo',
    text,
    time: nowTime(),
    at: Date.now(),
    result,
    meta,
  };

  store.list.push(msg);
  if (store.list.length > LIMITS.messages) store.list.shift();

  store.total += 1;
  store.msSum += meta.ms;
  store.cost += meta.cost || 0;
  if (store.byUrgency[result.urgencia] != null) store.byUrgency[result.urgencia] += 1;
  if (store.byProvider[meta.provider] != null) store.byProvider[meta.provider] += 1;

  return msg;
}

function stats() {
  const humanMs = store.total * LIMITS.humanMin * 60000;
  const savedMs = Math.max(0, humanMs - store.msSum);
  const mode = providerMode();
  return {
    total: store.total,
    shown: store.list.length,
    avgMs: store.total ? Math.round(store.msSum / store.total) : 0,
    aiSeconds: Math.round(store.msSum / 100) / 10,
    humanMinutes: store.total * LIMITS.humanMin,
    savedHours: Math.round((savedMs / 3600000) * 100) / 100,
    savedPercent: humanMs ? Math.round((savedMs / humanMs) * 100) : 0,
    costUsd: Math.round(store.cost * 10000) / 10000,
    byUrgency: { ...store.byUrgency },
    byProvider: { ...store.byProvider },
    humanMin: LIMITS.humanMin,
    ai: {
      mode,
      live: mode === 'gemini',
      model: GEMINI_MODEL,
      hasKey: !!GEMINI_KEY,
      demoToken: !!DEMO_TOKEN,
      maxTotal: LIMITS.total,
    },
  };
}

/* ============================================================
   HTTP
   ============================================================ */

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.json': 'application/json; charset=utf-8',
};

function sendJson(res, status, data) {
  const body = JSON.stringify(data);
  res.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store',
    'x-content-type-options': 'nosniff',
    'referrer-policy': 'no-referrer',
  });
  res.end(body);
}

function sendText(res, status, txt) {
  res.writeHead(status, {
    'content-type': 'text/plain; charset=utf-8',
    'cache-control': 'no-store',
  });
  res.end(txt);
}

function readJson(req, cap) {
  return new Promise((resolve, reject) => {
    let size = 0;
    let tooBig = false;
    const chunks = [];
    req.on('data', (c) => {
      if (tooBig) return;
      size += c.length;
      if (size > cap) {
        tooBig = true;
        chunks.length = 0;
        // não destruir o socket: o cliente precisa receber o 413.
        reject(Object.assign(new Error('Corpo grande demais'), { status: 413 }));
        return;
      }
      chunks.push(c);
    });
    req.on('end', () => {
      if (tooBig) return;
      if (!chunks.length) return resolve({});
      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString('utf8')));
      } catch (e) {
        reject(Object.assign(new Error('JSON inválido'), { status: 400 }));
      }
    });
    req.on('error', (e) => {
      if (!tooBig) reject(e);
    });
  });
}

function clientIp(req) {
  const xff = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim();
  return xff || req.socket.remoteAddress || 'desconhecido';
}

function demoAllowed(req, url) {
  if (!DEMO_TOKEN) return true;
  const header = String(req.headers['x-demo-token'] || '');
  const query = url.searchParams.get('t') || '';
  return header === DEMO_TOKEN || query === DEMO_TOKEN;
}

function serveStatic(res, pathname) {
  const name = pathname === '/' ? 'index.html' : pathname.replace(/^\/+/, '');
  if (!/^[a-z0-9._-]+$/i.test(name)) return sendText(res, 404, 'Não encontrado');

  const file = path.join(PUBLIC, name);
  if (!file.startsWith(PUBLIC)) return sendText(res, 404, 'Não encontrado');

  fs.readFile(file, (err, buf) => {
    if (err) return sendText(res, 404, 'Não encontrado');
    const ext = path.extname(file).toLowerCase();
    res.writeHead(200, {
      'content-type': MIME[ext] || 'application/octet-stream',
      'cache-control': ['.html', '.css', '.js'].includes(ext) ? 'no-cache' : 'public, max-age=300',
      'x-content-type-options': 'nosniff',
      'referrer-policy': 'no-referrer',
    });
    res.end(buf);
  });
}

const server = http.createServer(async (req, res) => {
  let url;
  try {
    url = new URL(req.url, 'http://localhost');
  } catch (e) {
    return sendJson(res, 400, { error: 'URL inválida' });
  }

  const pathname = (() => {
    try {
      return decodeURIComponent(url.pathname);
    } catch (e) {
      return null;
    }
  })();
  if (pathname === null) return sendJson(res, 400, { error: 'Caminho inválido' });

  try {
    if (req.method === 'GET' && pathname === '/healthz') return sendText(res, 200, 'ok');

    if (req.method === 'GET' && pathname === '/api/meta') {
      return sendJson(res, 200, {
        samples: SAMPLES,
        limits: LIMITS,
        stats: stats(),
      });
    }

    if (req.method === 'GET' && pathname === '/api/messages') {
      return sendJson(res, 200, {
        messages: store.list,
        stats: stats(),
        serverTime: nowTime(),
      });
    }

    if (req.method === 'POST' && pathname === '/api/messages') {
      const ip = clientIp(req);
      if (rateLimited(ip)) {
        return sendJson(res, 429, { error: 'Muitas mensagens deste aparelho. Espere um minuto.' });
      }
      if (store.total >= LIMITS.total) {
        return sendJson(res, 429, { error: 'Limite da aula atingido. Peça ao instrutor para reiniciar.' });
      }

      const body = await readJson(req, 8192);
      const text = prepareText(body.text);
      const name = prepareName(body.name);

      if (text.length < 8) {
        return sendJson(res, 400, { error: 'Escreva uma mensagem com pelo menos 8 caracteres.' });
      }

      const key = hash(text.toLowerCase());
      let result;
      let meta;

      if (store.cache.has(key)) {
        const hit = store.cache.get(key);
        result = hit.result;
        meta = { provider: hit.meta.provider, ms: 1, cached: true, cost: 0 };
      } else {
        const out = await analyze(text, name);
        result = out.result;
        meta = out.meta;
        if (meta.provider === 'gemini') {
          if (store.cache.size > 120) store.cache.clear();
          store.cache.set(key, { result, meta: { provider: 'gemini' } });
        }
      }

      const msg = addMessage(name, text, result, meta);
      return sendJson(res, 201, { message: msg, stats: stats() });
    }

    if (req.method === 'POST' && pathname === '/api/demo') {
      if (!demoAllowed(req, url)) return sendJson(res, 403, { error: 'Token da demo inválido.' });
      const body = await readJson(req, 4096);
      const sample = SAMPLES.find((s) => s.id === body.sample);
      if (!sample) return sendJson(res, 404, { error: 'Amostra não encontrada.' });
      if (store.total >= LIMITS.total) {
        return sendJson(res, 429, { error: 'Limite da aula atingido. Reinicie a demo.' });
      }

      const out = await analyze(sample.text, sample.name);
      const msg = addMessage(sample.name, sample.text, out.result, out.meta);
      return sendJson(res, 201, { message: msg, stats: stats() });
    }

    if (req.method === 'POST' && pathname === '/api/reset') {
      if (!demoAllowed(req, url)) return sendJson(res, 403, { error: 'Token da demo inválido.' });
      store.list = [];
      store.seq = 0;
      store.total = 0;
      store.msSum = 0;
      store.cost = 0;
      store.byUrgency = { critica: 0, alta: 0, media: 0, baixa: 0 };
      store.byProvider = { gemini: 0, regra: 0, fake: 0 };
      store.cache.clear();
      rate.clear();
      store.startedAt = Date.now();
      return sendJson(res, 200, { ok: true, stats: stats() });
    }

    if (req.method === 'GET' && (pathname === '/' || pathname === '/triagem' || pathname === '/demo')) {
      return serveStatic(res, pathname === '/' ? '/' : pathname + '.html');
    }

    if (req.method === 'GET' && /^\/[a-z0-9._-]+$/i.test(pathname)) {
      return serveStatic(res, pathname);
    }

    return sendJson(res, 404, { error: 'Não encontrado' });
  } catch (e) {
    const status = e && e.status ? e.status : 500;
    if (status === 500) console.error('[erro]', e);
    return sendJson(res, status, { error: e.message || 'Erro interno' });
  }
});

/* ============================================================
   Ciclo de vida
   ============================================================ */

server.listen(PORT, () => {
  const mode = providerMode();
  const label =
    mode === 'gemini'
      ? 'IA real · ' + GEMINI_MODEL
      : mode === 'fake'
        ? 'ensaio local (respostas simuladas)'
        : 'modo regra (sem GEMINI_API_KEY)';
  console.log('Triagem com IA ouvindo em http://localhost:' + PORT + ' — ' + label);
  if (DEMO_TOKEN) console.log('Demo e reset protegidos por DEMO_TOKEN.');
});

function shutdown(sig) {
  console.log('Encerrando (' + sig + ')…');
  server.close(() => process.exit(0));
  setTimeout(() => process.exit(0), 3000).unref();
}
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
