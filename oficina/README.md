# Oficina de Automação — o "ato 2" da palestra

Aplicação Node **sem dependências** que coloca a turma para executar uma automação de verdade:
um webhook público recebe um evento, o servidor aplica as regras que o aluno configurou, dispara
um alerta (na tela e, opcionalmente, num POST externo) e registra tudo — com placar.

Não é simulação de tela: cada clique em **Enviar evento** é uma requisição HTTP que sai do
navegador, passa pela internet e é processada no servidor.

```
navegador  ──POST /api/hook/:id──▶  servidor Node (Render)  ──POST https──▶  webhook.site (opcional)
    ▲                                      │
    └────────── GET estado ◀───────────────┘
```

---

## O que a turma vê

1. **Landing** para criar um espaço (nome + processo). Sem login, sem instalação.
2. **Regras** do processo: quando alertar, quando chamar humano, o que registrar.
3. **Webhook real** com endereço único e exemplo de `curl`.
4. **Disparar eventos**: um evento manual ou o "dia completo" (12–18 requisições reais).
5. **Execuções ao vivo**, alertas no "celular", KPIs e placar de 0 a 100.
6. **Painel da turma** (`/painel`) com o ranking para projetar.

### Os 3 processos

| Processo | Eventos | A pergunta central |
|---|---|---|
| 💬 Atendimento WhatsApp | 18 mensagens | Quando interromper o time? |
| 🗂️ Triagem de solicitações | 16 pedidos | O que é crítico de verdade? |
| 📊 Relatório diário | 12 dias | Como não falhar em silêncio? |

Regras ideais chegam a **100 pontos** nos três. As mesmas regras e o mesmo placar do
`../simulador/index.html`, para a turma comparar o simulador (offline) com a oficina (servidor real).

---

## Rodar localmente

Precisa só de Node 20+ — não há `npm install`.

```bash
cd oficina
npm start
# ou: node server.js
```

- Oficina: http://localhost:3000
- Painel: http://localhost:3000/painel
- Saúde: http://localhost:3000/healthz

### Teste rápido do webhook

Crie um espaço na interface, copie o endereço e rode:

```bash
curl -X POST http://localhost:3000/api/hook/SEU_ID \
  -H "content-type: application/json" \
  -d '{"name":"Maria","message":"Estou com dor forte","urgency":"alta","unknown":false}'
```

Resposta esperada (`202`):

```json
{
  "ok": true,
  "n": 1,
  "alert": true,
  "decision": { "condTxt": "urgência alta → alerta", "actionTxt": "alerta o time + IA responde (3 s)", "recordTxt": "conversa salva no histórico" },
  "view": { "title": "Maria", "text": "\"Estou com dor forte\"", "tag": "ALTA" }
}
```

### Teste de ação externa (opcional)

1. Abra https://webhook.site e copie sua URL única.
2. Na oficina, abra **Destino real do alerta (opcional)**, cole e salve.
3. Dispare um evento com urgência alta.
4. O webhook.site mostra o POST feito **pelo servidor** (com status e latência no log da oficina).

---

## Publicar no GitHub + Render

O repositório já tem `render.yaml` na raiz apontando para `rootDir: oficina`.

### 1. GitHub

```bash
# na raiz do kit (palestra-automacao)
git add .
git commit -m "Oficina de automacao ao vivo"
# crie o repo vazio no GitHub e rode:
git remote add origin https://github.com/SEU_USUARIO/palestra-automacao.git
git push -u origin main
```

### 2. Render (Blueprint)

1. https://dashboard.render.com → **New** → **Blueprint**.
2. Conecte o repositório `palestra-automacao`.
3. O Render lê o `render.yaml`, encontra o serviço `oficina-automacao` e pede **Apply**.
4. Aguarde o deploy. O link fica em `https://oficina-automacao.onrender.com` (o nome pode variar).

**Alternativa sem Blueprint:** **New** → **Web Service** → repositório → Root Directory `oficina`,
Runtime **Node**, Build `npm install --omit=dev`, Start `npm start`, Health Check `/healthz`,
Plan **Free**.

### 3. Depois do deploy

- Abra `https://SEU-LINK.onrender.com` no celular para confirmar.
- Gere um QR code do link (qualquer gerador) e coloque no slide 18.
- Acesse `/painel` no projetor antes de começar.

---

## Roteiro de 15 minutos em aula

| Tempo | O que fazer |
|---|---|
| 0–2 min | Mostre o link/QR. "Abram, criem um espaço com o nome da dupla." |
| 2–5 min | Cada dupla escolhe um processo e mexe nas regras. Não explique todas — deixe errar. |
| 5–8 min | **Enviar 1 evento** e ler o log juntos: gatilho → condição → ação → registro. |
| 8–11 min | **Enviar o dia completo**. O placar aparece; peça para ajustar e rodar de novo. |
| 11–14 min | Projete `/painel`. Compare critérios, não só números. |
| 14–15 min | Feche com a pergunta: "o que vocês mudariam no processo real amanhã?" |

### Dicas de condução

- Cada dupla usa um **nome de espaço diferente**; é o que aparece no painel.
- Quem termina cedo: troque de processo no modal de resultado e tente 90+.
- Se o Render estiver dormindo, o primeiro acesso demora ~50 s. Abra o link 2 min antes.
- Se a internet cair, o `../simulador/index.html` roda offline com as mesmas regras.

---

## Limitações do free tier (importante)

- O serviço **dorme após ~15 min sem acesso** e acorda em ~50 s.
- **Não há disco**: em restart/deploy os espaços e placares em memória são perdidos.
- Sessões expiram sozinhas após **3 h sem uso** (TTL), com limite de 300 espaços e 600 eventos por espaço.
- Para uma aula isso é suficiente. Para uso contínuo, use plano pago + disco, ou troque o `Map`
  de sessões por um banco.

---

## Segurança e privacidade

- Sem login e sem dados pessoais: o "código do espaço" + uma chave aleatória ficam só no
  `localStorage` do navegador.
- O webhook é público por design (é o exercício), mas o estado completo exige o header `x-key`.
- A ação externa aceita **apenas `https://`** e bloqueia `localhost`, IP literal, `.local` e `.internal`
  (mitigação simples de SSRF).
- Sem banco, sem cookies, sem rastreamento. Nada é enviado a terceiros além do destino que o aluno
  configurar.

---

## API

| Método | Rota | Descrição |
|---|---|---|
| `GET` | `/api/meta` | Processos, regras, formulário e dados de demonstração |
| `POST` | `/api/sessions` | Cria espaço `{name, scenario}` → `{id, key, state}` |
| `GET` | `/api/sessions/:id` | Estado completo (header `x-key`) |
| `PATCH` | `/api/sessions/:id` | Salva `{name?, scenario?, rules?, outbound?}` |
| `POST` | `/api/sessions/:id/reset` | Limpa execuções |
| `POST` | `/api/hook/:id` | **Webhook público** — recebe o evento e responde a decisão |
| `GET` | `/api/board` | Ranking público (30 melhores) |
| `GET` | `/healthz` | Health check do Render |

Payloads aceitos no hook:

```json
// whatsapp
{"name":"Maria","message":"...","urgency":"alta|normal|baixa","unknown":false}

// triagem
{"who":"Ana","sector":"Financeiro","impact":"Todos|Parte|Um","desc":"..."}

// relatorio
{"day":13,"variation":-15,"failed":false}
```

Campos fora do padrão retornam `400` com mensagem em português. O hook responde `202` com a decisão
já tomada, o que permite testar por `curl`, n8n, Zapier, Make ou qualquer coisa com HTTP.

---

## Estrutura

```
oficina/
├── server.js          # servidor HTTP, motor de regras, sessões e API
├── public/
│   ├── index.html     # landing + workspace
│   ├── styles.css
│   ├── app.js         # fluxo do aluno e polling
│   └── painel.html    # ranking para projetar
├── package.json
├── Dockerfile
└── README.md
render.yaml            # blueprint do Render (rootDir: oficina)
```

Sem dependências, sem build. `node server.js` é tudo.
