'use strict';

/* ============================================================
   Oficina de Automação — front
   ============================================================ */

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
const LS_KEY = 'oficina-automacao/v1';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const S = {
  meta: null,
  saved: readSaved(),
  pick: null,
  session: null, // { id, key }
  state: null,
  renderedMax: 0,
  alertSeen: new Set(),
  dirty: false,
  sending: false,
  polling: false,
  fastUntil: 0,
  lastPoll: 0,
};

/* ============================================================
   utilidades
   ============================================================ */

function esc(v) {
  return String(v == null ? '' : v)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function readSaved() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return null;
    const v = JSON.parse(raw);
    if (!v || !v.id || !v.key) return null;
    return v;
  } catch (e) {
    return null;
  }
}

function writeSaved(v) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(v));
  } catch (e) {
    /* modo privado: segue sem persistir */
  }
}

function clearSaved() {
  try {
    localStorage.removeItem(LS_KEY);
  } catch (e) {
    /* ignore */
  }
  S.saved = null;
}

function when(ts) {
  if (!ts) return 'agora';
  const diff = Date.now() - ts;
  if (diff < 60000) return 'agora há pouco';
  if (diff < 3600000) return 'há ' + Math.floor(diff / 60000) + ' min';
  return 'há ' + Math.floor(diff / 3600000) + ' h';
}

function colorFor(score) {
  if (score >= 90) return '#16a34a';
  if (score >= 75) return '#0ea5e9';
  if (score >= 50) return '#d97706';
  return '#dc2626';
}

let toastTimer = null;
function toast(msg) {
  const el = $('#toast');
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), 2800);
}

async function copyText(txt, okMsg) {
  try {
    await navigator.clipboard.writeText(txt);
    toast(okMsg || 'Copiado.');
  } catch (e) {
    const ta = document.createElement('textarea');
    ta.value = txt;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    try {
      document.execCommand('copy');
      toast(okMsg || 'Copiado.');
    } catch (e2) {
      toast('Não consegui copiar. Selecione o texto e copie manualmente.');
    }
    ta.remove();
  }
}

/* ============================================================
   API
   ============================================================ */

async function api(path, opts = {}) {
  const headers = Object.assign({}, opts.headers || {});
  if (opts.body !== undefined) headers['content-type'] = 'application/json';
  if (opts.key) headers['x-key'] = opts.key;

  const res = await fetch(path, {
    method: opts.method || 'GET',
    headers,
    body: opts.body === undefined ? undefined : JSON.stringify(opts.body),
  });

  const text = await res.text();
  let data = {};
  try {
    data = text ? JSON.parse(text) : {};
  } catch (e) {
    data = { error: text || 'Resposta inválida do servidor.' };
  }

  if (!res.ok) {
    const err = new Error(data.error || 'Falha na requisição (' + res.status + ').');
    err.status = res.status;
    throw err;
  }
  return data;
}

/* ============================================================
   bootstrap
   ============================================================ */

async function boot() {
  try {
    S.meta = await api('/api/meta');
  } catch (e) {
    toast('Não consegui falar com o servidor. Recarregue a página.');
    return;
  }

  S.pick = Object.keys(S.meta.scenarios)[0];
  renderScenarioPick();
  renderResume();
  bindStatic();
  startPolling();
}

function bindStatic() {
  $('#createBtn').addEventListener('click', createSession);

  $('#scenarioPick').addEventListener('click', (ev) => {
    const btn = ev.target.closest('[data-scenario]');
    if (!btn) return;
    S.pick = btn.dataset.scenario;
    renderScenarioPick();
  });

  $('#wsName').addEventListener('keydown', (ev) => {
    if (ev.key === 'Enter') createSession();
  });

  $('#resumeOpen').addEventListener('click', resumeSession);
  $('#resumeNew').addEventListener('click', () => {
    clearSaved();
    renderResume();
    $('#wsName').focus();
  });

  $('#saveBtn').addEventListener('click', () => saveRules(false));
  $('#resetRules').addEventListener('click', resetRulesToDefault);
  $('#sendOne').addEventListener('click', sendOne);
  $('#sendDay').addEventListener('click', sendDay);
  $('#resetRun').addEventListener('click', resetRun);
  $('#copyHook').addEventListener('click', () => copyText($('#hookUrl').textContent, 'Endereço do webhook copiado.'));
  $('#codeBtn').addEventListener('click', () => copyText($('#codeTxt').textContent, 'Código do espaço copiado.'));
  $('#helpBtn').addEventListener('click', () => $('#help').classList.add('open'));
  $('#leaveBtn').addEventListener('click', leaveWorkspace);

  $('#scoreCard').addEventListener('click', () => {
    if (S.state && S.state.score != null) openResult();
  });

  $('#rulesForm').addEventListener('input', markDirty);
  $('#rulesForm').addEventListener('change', markDirty);
  $('#outbound').addEventListener('input', markDirty);
  $('#outbound').addEventListener('change', saveOutboundHint);

  $$('.modal').forEach((m) => {
    m.addEventListener('click', (ev) => {
      if (ev.target === m) m.classList.remove('open');
    });
  });

  document.addEventListener('click', (ev) => {
    const closer = ev.target.closest('[data-act="close"]');
    if (closer) {
      const m = closer.closest('.modal');
      if (m) m.classList.remove('open');
    }
  });

  document.addEventListener('keydown', (ev) => {
    if (ev.key === 'Escape') $$('.modal.open').forEach((m) => m.classList.remove('open'));
  });
}

/* ============================================================
   landing
   ============================================================ */

function renderScenarioPick() {
  if (!S.meta) return;
  $('#scenarioPick').innerHTML = Object.values(S.meta.scenarios)
    .map(
      (sc) =>
        '<button type="button" class="scenario' + (sc.id === S.pick ? ' on' : '') + '" data-scenario="' + esc(sc.id) + '">' +
        '<span class="ico">' + esc(sc.icon) + '</span>' +
        '<b>' + esc(sc.label) + '</b>' +
        '<small>' + esc(sc.total) + ' eventos no dia completo</small>' +
        '</button>'
    )
    .join('');
}

function renderResume() {
  const card = $('#resumeCard');
  if (!S.saved) {
    card.hidden = true;
    return;
  }
  const sc = S.meta && S.meta.scenarios[S.saved.scenario];
  card.hidden = false;
  $('#resumeName').textContent = S.saved.name || 'Meu robô';
  $('#resumeMeta').textContent = (sc ? sc.icon + ' ' + sc.label : 'processo') + ' · salvo ' + when(S.saved.savedAt);
}

async function resumeSession() {
  if (!S.saved) return;
  const btn = $('#resumeOpen');
  btn.disabled = true;
  btn.textContent = 'Abrindo…';
  try {
    const out = await api('/api/sessions/' + S.saved.id, { key: S.saved.key });
    S.session = { id: S.saved.id, key: S.saved.key };
    openWorkspace(out.state);
    toast('Espaço retomado.');
  } catch (e) {
    clearSaved();
    renderResume();
    toast(e.status === 404 ? 'Esse espaço expirou. Crie um novo.' : e.message);
  } finally {
    btn.disabled = false;
    btn.textContent = 'Continuar →';
  }
}

async function createSession() {
  const btn = $('#createBtn');
  const name = $('#wsName').value.trim();
  btn.disabled = true;
  btn.textContent = 'Criando…';
  try {
    const out = await api('/api/sessions', {
      method: 'POST',
      body: { name, scenario: S.pick },
    });
    S.session = { id: out.id, key: out.key };
    writeSaved({
      id: out.id,
      key: out.key,
      name: out.state.name,
      scenario: out.state.scenario,
      savedAt: Date.now(),
    });
    openWorkspace(out.state);
    toast('Espaço criado. Agora ajuste as regras.');
  } catch (e) {
    toast(e.message);
  } finally {
    btn.disabled = false;
    btn.textContent = 'Criar meu robô →';
  }
}

/* ============================================================
   workspace
   ============================================================ */

function openWorkspace(state) {
  S.state = state;
  S.session = { id: state.id, key: S.session.key };
  S.renderedMax = 0;
  S.alertSeen.clear();
  S.dirty = false;

  $('#landing').hidden = true;
  $('#app').hidden = false;
  $('#sessionHead').hidden = false;
  $('#leaveBtn').hidden = false;
  $('#whoName').textContent = state.name;
  $('#codeTxt').textContent = state.id;
  document.title = state.name + ' — Oficina de Automação';

  $('#rulesForm').innerHTML = '';
  $('#testForm').innerHTML = '';
  applyScenarioUi(state);
  renderHook();
  renderState(state);
  updateProgressFromState(state);
  setSaveState('ok', 'regras salvas');
  window.scrollTo(0, 0);
}

function applyScenarioUi(state) {
  const sc = S.meta.scenarios[state.scenario];
  $('#scenePill').textContent = sc.icon + ' ' + sc.label;
  $('#missionText').textContent = sc.mission;
  $('#hintText').textContent = sc.hint;
  renderRules(state);
  renderForm(state);
  $('#outbound').value = state.outbound || '';
  $('#outboundState').textContent = state.outbound
    ? 'destino externo ativo — alertas geram POST real.'
    : 'sem destino externo: o alerta fica na tela.';
}

function renderRules(state) {
  const sc = S.meta.scenarios[state.scenario];
  $('#rulesForm').innerHTML = sc.rules
    .map((r) => {
      const val = state.rules[r.id];
      if (r.type === 'toggle') {
        return (
          '<div class="rule"><label class="toggle">' +
          '<input type="checkbox" data-rule="' + esc(r.id) + '"' + (val ? ' checked' : '') + '>' +
          '<span class="tr"><i></i></span><span>' + esc(r.label) + '</span></label></div>'
        );
      }
      return (
        '<div class="rule"><label for="rule-' + esc(r.id) + '">' + esc(r.label) + '</label>' +
        '<select id="rule-' + esc(r.id) + '" data-rule="' + esc(r.id) + '">' +
        (r.options || [])
          .map(([v, label]) => '<option value="' + esc(v) + '"' + (v === val ? ' selected' : '') + '>' + esc(label) + '</option>')
          .join('') +
        '</select></div>'
      );
    })
    .join('');
}

function renderForm(state) {
  const sc = S.meta.scenarios[state.scenario];
  $('#testForm').innerHTML = sc.form
    .map((f) => {
      if (f.type === 'toggle') {
        return (
          '<div class="fld wide"><label class="toggle">' +
          '<input type="checkbox" data-field="' + esc(f.id) + '" data-type="toggle"' + (f.def ? ' checked' : '') + '>' +
          '<span class="tr"><i></i></span><span>' + esc(f.label) + '</span></label></div>'
        );
      }
      if (f.type === 'textarea') {
        return (
          '<div class="fld wide"><label for="fld-' + esc(f.id) + '">' + esc(f.label) + '</label>' +
          '<textarea class="input" id="fld-' + esc(f.id) + '" data-field="' + esc(f.id) + '" data-type="text" rows="2">' +
          esc(f.def) + '</textarea></div>'
        );
      }
      if (f.type === 'select') {
        return (
          '<div class="fld"><label for="fld-' + esc(f.id) + '">' + esc(f.label) + '</label>' +
          '<select class="input" id="fld-' + esc(f.id) + '" data-field="' + esc(f.id) + '" data-type="text">' +
          (f.options || [])
            .map(([v, label]) => '<option value="' + esc(v) + '"' + (v === f.def ? ' selected' : '') + '>' + esc(label) + '</option>')
            .join('') +
          '</select></div>'
        );
      }
      return (
        '<div class="fld"><label for="fld-' + esc(f.id) + '">' + esc(f.label) + '</label>' +
        '<input class="input" id="fld-' + esc(f.id) + '" type="' + (f.type === 'number' ? 'number' : 'text') + '" ' +
        'data-field="' + esc(f.id) + '" data-type="' + esc(f.type) + '" value="' + esc(f.def) + '"></div>'
      );
    })
    .join('');
}

function collectRules() {
  const out = {};
  $$('#rulesForm [data-rule]').forEach((el) => {
    out[el.dataset.rule] = el.type === 'checkbox' ? el.checked : el.value;
  });
  return out;
}

function collectPayload() {
  const out = {};
  $$('#testForm [data-field]').forEach((el) => {
    let v = el.type === 'checkbox' ? el.checked : el.value;
    if (el.dataset.type === 'number') v = Number(v);
    out[el.dataset.field] = v;
  });
  return out;
}

function markDirty() {
  if (S.dirty) return;
  S.dirty = true;
  setSaveState('dirty', 'alterações não salvas');
}

function setSaveState(cls, txt) {
  const el = $('#saveState');
  el.className = 'save-state' + (cls ? ' ' + cls : '');
  el.textContent = txt;
}

function saveOutboundHint() {
  const v = $('#outbound').value.trim();
  $('#outboundState').textContent = v
    ? 'será validado ao salvar (precisa ser https://).'
    : 'sem destino externo: o alerta fica na tela.';
}

function resetRulesToDefault() {
  if (!S.state) return;
  const sc = S.meta.scenarios[S.state.scenario];
  sc.rules.forEach((r) => {
    const el = $('#rulesForm [data-rule="' + r.id + '"]');
    if (!el) return;
    if (r.type === 'toggle') el.checked = !!r.def;
    else el.value = r.def;
  });
  markDirty();
  toast('Padrão restaurado. Clique em salvar regras.');
}

async function saveRules(silent) {
  if (!S.session) return false;
  const btn = $('#saveBtn');
  btn.disabled = true;
  setSaveState('', 'salvando…');
  try {
    const out = await api('/api/sessions/' + S.session.id, {
      method: 'PATCH',
      key: S.session.key,
      body: { rules: collectRules(), outbound: $('#outbound').value.trim() },
    });
    S.state = out.state;
    S.dirty = false;
    setSaveState('ok', 'salvo agora');
    $('#outbound').value = out.state.outbound || '';
    $('#outboundState').textContent = out.state.outbound
      ? 'destino externo ativo — alertas geram POST real.'
      : 'sem destino externo: o alerta fica na tela.';
    if (!silent) {
      toast('Regras salvas. Valem para os próximos eventos.');
      renderState(out.state);
    }
    return true;
  } catch (e) {
    setSaveState('error', 'não salvou');
    toast(e.message);
    if (e.status === 404 || e.status === 403) lostSession();
    return false;
  } finally {
    btn.disabled = false;
  }
}

async function ensureSaved() {
  if (!S.dirty) return true;
  return saveRules(true);
}

/* ============================================================
   envio de eventos
   ============================================================ */

function setBusy(busy) {
  ['#sendOne', '#sendDay', '#resetRun', '#saveBtn'].forEach((sel) => {
    const el = $(sel);
    if (el) el.disabled = busy;
  });
}

function setRunState(cls, txt) {
  const el = $('#runState');
  el.className = 'run-state' + (cls ? ' ' + cls : '');
  el.textContent = txt;
}

function fastFor(ms) {
  S.fastUntil = Math.max(S.fastUntil, Date.now() + ms);
}

function setProgress(n, total) {
  $('#progressBar').style.width = (total ? Math.min(100, (n / total) * 100) : 0) + '%';
  $('#progressTxt').textContent = n + ' de ' + total + ' eventos';
}

async function sendOne() {
  if (S.sending || !S.session) return;
  if (!(await ensureSaved())) return;

  S.sending = true;
  setBusy(true);
  setRunState('sending', 'enviando…');
  try {
    const out = await api('/api/hook/' + S.session.id, { method: 'POST', body: collectPayload() });
    toast(out.alert ? 'Evento entregue. O robô decidiu alertar.' : 'Evento entregue. O robô decidiu não alertar.');
    fastFor(2200);
    await pollNow();
    setRunState('', 'pronto');
  } catch (e) {
    toast(e.message);
    setRunState('error', 'falhou');
  } finally {
    S.sending = false;
    setBusy(false);
    if (S.state) updateProgressFromState(S.state);
  }
}

async function sendDay() {
  if (S.sending || !S.session) return;
  if (!(await ensureSaved())) return;

  const sc = S.meta.scenarios[S.state.scenario];
  const demo = sc.demo;
  S.sending = true;
  setBusy(true);
  setRunState('sending', 'enviando o dia…');
  setProgress(0, demo.length);

  let sent = 0;
  try {
    for (const item of demo) {
      await api('/api/hook/' + S.session.id, { method: 'POST', body: item });
      sent += 1;
      setProgress(sent, demo.length);
      fastFor(1500);
      await sleep(100);
    }

    toast('Dia completo entregue: ' + demo.length + ' requisições HTTP reais.');
    fastFor(5000);
    await sleep(500);
    await pollNow();
    await sleep(900);
    await pollNow();
    await sleep(900);
    await pollNow();
  } catch (e) {
    toast('Parou no evento ' + (sent + 1) + ': ' + e.message);
    setRunState('error', 'interrompido');
    await pollNow();
  } finally {
    S.sending = false;
    setBusy(false);
    if (S.state) updateProgressFromState(S.state);
  }

  if (S.state && S.state.score != null) openResult();
}

async function resetRun() {
  if (S.sending || !S.session) return;
  if (!confirm('Limpar as execuções deste espaço? As regras continuam.')) return;
  try {
    const out = await api('/api/sessions/' + S.session.id + '/reset', {
      method: 'POST',
      key: S.session.key,
    });
    S.state = out.state;
    S.renderedMax = 0;
    S.alertSeen.clear();
    setProgress(0, out.state.total);
    setRunState('', 'pronto');
    renderState(out.state);
    toast('Execuções limpas.');
  } catch (e) {
    toast(e.message);
    if (e.status === 404 || e.status === 403) lostSession();
  }
}

/* ============================================================
   polling + render
   ============================================================ */

function startPolling() {
  setInterval(async () => {
    if (!S.session || $('#app').hidden || S.polling) return;
    const fast = S.sending || Date.now() < S.fastUntil;
    if (!fast && Date.now() - S.lastPoll < 2000) return;
    await pollNow();
  }, 350);
}

async function pollNow() {
  if (!S.session || S.polling) return;
  S.polling = true;
  try {
    const out = await api('/api/sessions/' + S.session.id, { key: S.session.key });
    S.state = out.state;
    S.lastPoll = Date.now();
    renderState(out.state);
  } catch (e) {
    if (e.status === 404 || e.status === 403) lostSession();
  } finally {
    S.polling = false;
  }
}

function lostSession() {
  clearSaved();
  S.session = null;
  S.state = null;
  $$('.modal.open').forEach((m) => m.classList.remove('open'));
  $('#app').hidden = true;
  $('#sessionHead').hidden = true;
  $('#leaveBtn').hidden = true;
  $('#landing').hidden = false;
  document.title = 'Oficina de Automação — ao vivo';
  renderResume();
  toast('Este espaço expirou (3 h sem uso). Crie um novo para continuar.');
}

function leaveWorkspace() {
  if (!confirm('Sair deste espaço? O histórico deste robô será perdido.')) return;
  clearSaved();
  S.session = null;
  location.href = '/';
}

function renderState(state) {
  const events = state.events || [];
  const alerts = events.filter((e) => e.dec.alert).length;
  const registered = events.filter((e) => e.dec.record).length;

  $('#pCount1').textContent = events.length + (events.length === 1 ? ' evento' : ' eventos');
  $('#pCount2').textContent = events.length + (events.length === 1 ? ' decisão' : ' decisões');
  $('#pCount3').textContent = alerts + (alerts === 1 ? ' alerta' : ' alertas');
  $('#pCount4').textContent = registered + (registered === 1 ? ' salvo' : ' salvos');

  renderTrace(events);
  renderAlerts(events);
  renderScore(state);
  renderKpis(state);
  updateProgressFromState(state);
}

function renderTrace(events) {
  const box = $('#trace');
  if (!events.length) {
    box.innerHTML =
      '<div class="empty">Envie um evento para ver o robô decidir.<br>Ou clique em <b>Enviar o dia completo</b>.</div>';
    S.renderedMax = 0;
    $('#lastAt').textContent = '—';
    return;
  }

  const atBottom = box.scrollHeight - box.scrollTop - box.clientHeight < 80;
  const freshFrom = S.renderedMax;
  box.innerHTML = events.map((e) => lineHtml(e, e.n > freshFrom)).join('');
  S.renderedMax = events[events.length - 1].n;
  if (atBottom) box.scrollTop = box.scrollHeight;
  $('#lastAt').textContent = 'último: ' + events[events.length - 1].time;
}

function lineHtml(e, fresh) {
  const failedOut = e.delivery && e.delivery.error;
  const tag = failedOut ? 'erro' : e.dec.alert ? 'alerta' : 'regra';
  const tagTxt = failedOut ? 'HTTP' : e.dec.alert ? 'alerta' : 'regra';

  let dlv = '';
  if (e.delivery) {
    dlv = e.delivery.status
      ? '<span class="dlv">· webhook externo ' + e.delivery.status + ' · ' + e.delivery.ms + ' ms</span>'
      : '<span class="dlv fail">· webhook externo falhou (' + esc(e.delivery.error || 'erro') + ')</span>';
  }

  return (
    '<div class="line' + (fresh ? ' fresh' : '') + '">' +
    '<span class="ltime">' + esc(e.time) + '</span>' +
    '<span class="ltag ' + tag + '">' + tagTxt + '</span>' +
    '<span class="ltxt"><b>' + esc(e.view.title) + '</b> · ' + esc(e.view.text) +
    '<small>' + esc(e.dec.condTxt) + ' → ' + esc(e.dec.actionTxt) + ' · ' + esc(e.dec.recordTxt) + ' ' + dlv + '</small>' +
    '</span></div>'
  );
}

function renderAlerts(events) {
  const box = $('#alerts');
  const alerts = events.filter((e) => e.dec.alert).slice(-6).reverse();
  if (!alerts.length) {
    box.innerHTML = '<div class="no-alert">Nenhum alerta ainda</div>';
    return;
  }

  box.innerHTML = alerts
    .map((e) => {
      const fresh = !S.alertSeen.has(e.n);
      S.alertSeen.add(e.n);

      let status = '';
      if (e.delivery) {
        status = e.delivery.status
          ? '<span class="ok">enviado ' + e.delivery.status + '</span>'
          : '<span class="fail">falhou</span>';
      } else if (S.state && S.state.outbound) {
        status = '<span>enviando…</span>';
      }

      return (
        '<div class="alert' + (fresh ? ' fresh' : '') + '">' +
        '<div class="at"><span>' + esc(e.time) + '</span>' + status + '</div>' +
        '<b>' + esc(e.view.alertTitle) + '</b>' +
        '<p>' + esc(e.view.alertBody) + '</p></div>'
      );
    })
    .join('');
}

function renderScore(state) {
  const ring = $('#ring');
  if (state.score == null) {
    ring.style.background = 'conic-gradient(#cbd5e1 0 0%, #e8edf2 0 100%)';
    $('#scoreNum').textContent = '—';
    $('#scoreGrade').textContent = 'aguardando';
    $('#scoreMsg').textContent = 'envie eventos para pontuar';
    return;
  }
  const color = colorFor(state.score);
  ring.style.background =
    'conic-gradient(' + color + ' 0 ' + state.score + '%, #e8edf2 ' + state.score + '% 100%)';
  $('#scoreNum').textContent = state.score;
  $('#scoreGrade').textContent = state.grade ? state.grade.long : '';
  $('#scoreMsg').textContent = state.grade ? state.grade.desc : '';
}

function renderKpis(state) {
  const box = $('#kpis');
  const kpis = state.kpis || [];
  if (!kpis.length) {
    box.innerHTML = '';
    return;
  }
  box.innerHTML = kpis
    .map((k) => {
      const pct = k.bar == null ? null : Math.max(0, Math.min(1, k.bar)) * 100;
      return (
        '<div class="kpi"><div class="kh"><span>' + esc(k.label) + '</span>' +
        '<b class="kv' + (k.bad ? ' bad' : '') + '">' + esc(k.value) + '</b></div>' +
        (pct == null ? '' : '<div class="bar"><i style="width:' + pct + '%"></i></div>') +
        '</div>'
      );
    })
    .join('');
}

function updateProgressFromState(state) {
  if (S.sending) return;
  const total = state.total || 0;
  const n = (state.events || []).length;
  const shown = Math.min(n, total);

  $('#progressBar').style.width = (total ? (shown / total) * 100 : 0) + '%';
  $('#progressTxt').textContent =
    n > total ? n + ' eventos no histórico (o dia completo tem ' + total + ')' : shown + ' de ' + total + ' eventos';

  const run = $('#runState');
  if (run.classList.contains('error')) return;
  if (n >= total) setRunState('done', 'dia completo');
  else if (n > 0) setRunState('', 'em andamento');
  else setRunState('', 'pronto');
}

/* ============================================================
   webhook / curl
   ============================================================ */

function renderHook() {
  if (!S.session || !S.state) return;
  const sc = S.meta.scenarios[S.state.scenario];
  const url = location.origin + '/api/hook/' + S.session.id;
  $('#hookUrl').textContent = url;
  $('#srvInfo').textContent = ' · servidor ' + location.host;

  const example = {};
  sc.form.forEach((f) => {
    example[f.id] = f.def;
  });

  $('#curlBox').textContent =
    'curl -X POST ' + url + ' \\\n' +
    '  -H "content-type: application/json" \\\n' +
    "  -d '" + JSON.stringify(example) + "'";
}

/* ============================================================
   resultado
   ============================================================ */

function openResult() {
  const state = S.state;
  if (!state || state.score == null) return;

  const color = colorFor(state.score);
  const grade = state.grade || { long: '', desc: '' };

  const parts = (state.parts || [])
    .map((p) => {
      const v = Math.round((p.v || 0) * 100);
      return (
        '<div class="rpart"><span>' + esc(p.label) + '</span>' +
        '<div class="rbar"><i style="width:' + v + '%;background:' + color + '"></i></div>' +
        '<b>' + v + '%</b><small>' + p.w + ' pts</small></div>'
      );
    })
    .join('');

  const c = state.counts || {};
  const chips = [];
  if (c.tp != null) chips.push('<span class="chip">acertos <b>' + c.tp + '</b></span>');
  if (c.fp != null) chips.push('<span class="chip' + (c.fp ? ' bad' : '') + '">alarmes falsos <b>' + c.fp + '</b></span>');
  if (c.fn != null) chips.push('<span class="chip' + (c.fn ? ' bad' : '') + '">perdidos <b>' + c.fn + '</b></span>');
  if (c.transfers != null) chips.push('<span class="chip">transferências <b>' + c.transfers + '</b></span>');
  if (c.detected != null) chips.push('<span class="chip">falhas detectadas <b>' + c.detected + '</b></span>');
  chips.push('<span class="chip">requisições <b>' + (state.events || []).length + '</b></span>');

  const others = Object.values(S.meta.scenarios).filter((sc) => sc.id !== state.scenario);

  $('#sheet').innerHTML =
    '<button class="x" data-act="close" aria-label="Fechar">×</button>' +
    '<div class="eyebrow">Resultado do dia completo</div>' +
    '<h2>' + esc(state.name) + '</h2>' +
    '<div class="hero">' +
    '<div class="bigring" style="background:conic-gradient(' + color + ' 0 ' + state.score + '%, #e8edf2 ' + state.score + '% 100%)"><span>' + state.score + '</span></div>' +
    '<div><b>' + esc(grade.long) + '</b><p>' + esc(grade.desc) + '</p></div>' +
    '</div>' +
    '<h3>Como o placar foi montado</h3>' +
    '<div class="parts">' + parts + '</div>' +
    '<h3>O que aconteceu</h3>' +
    '<div class="chips">' + chips.join('') + '</div>' +
    '<h3>Quer comparar com outro processo?</h3>' +
    '<p class="note">Trocar de processo reinicia o histórico e as regras deste espaço. O placar anterior não fica salvo.</p>' +
    '<div class="chips" style="margin-top:8px">' +
    others.map((sc) => '<button class="chip" data-scenario="' + esc(sc.id) + '">' + esc(sc.icon) + ' ' + esc(sc.label) + ' →</button>').join('') +
    '</div>' +
    '<div class="modal-actions">' +
    '<a class="btn ghost" href="/painel" target="_blank" rel="noreferrer">Ver painel da turma ↗</a>' +
    '<button class="btn ghost" data-act="close">Ajustar regras</button>' +
    '</div>';

  $$('#sheet [data-scenario]').forEach((btn) => {
    btn.addEventListener('click', () => switchScenario(btn.dataset.scenario));
  });

  $('#modal').classList.add('open');
}

async function switchScenario(id) {
  if (!S.session || !S.meta.scenarios[id]) return;
  try {
    const out = await api('/api/sessions/' + S.session.id, {
      method: 'PATCH',
      key: S.session.key,
      body: { scenario: id },
    });
    $('#modal').classList.remove('open');
    S.state = out.state;
    S.renderedMax = 0;
    S.alertSeen.clear();
    S.dirty = false;
    S.fastUntil = 0;
    writeSaved({
      id: S.session.id,
      key: S.session.key,
      name: out.state.name,
      scenario: out.state.scenario,
      savedAt: Date.now(),
    });
    applyScenarioUi(out.state);
    renderHook();
    renderState(out.state);
    updateProgressFromState(out.state);
    setSaveState('ok', 'regras padrão');
    toast('Agora você está em: ' + S.meta.scenarios[id].label);
  } catch (e) {
    toast(e.message);
    if (e.status === 404 || e.status === 403) lostSession();
  }
}

/* ============================================================
   start
   ============================================================ */

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot);
} else {
  boot();
}
