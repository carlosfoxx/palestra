# Triagem com IA — o "momento uau" da palestra

Aplicação Node **sem dependências** que recebe mensagens de trabalho escritas pela turma (do celular),
chama o **Gemini** com um formato de saída fixo e mostra no telão, em segundos:

- **categoria** (suporte, financeiro, comercial, RH, operação, outro)
- **urgência** (crítica, alta, média, baixa) e **tom** de quem escreveu
- **resumo em uma linha**
- **rascunho de resposta** pronto para alguém aprovar
- **próximo passo** interno
- **confiança** de 0 a 1 — abaixo de 0,7 a tela marca **revisar**

Não é chat. É a IA no meio de um processo: ela prepara o trabalho, uma pessoa decide.

```
celular da turma ──POST /api/messages──▶ servidor Node ──▶ Gemini (schema fixo)
        ▲                                     │                    │
        │                                     ▼                    ▼
   resposta pronta                     fila no telão  ◀──── JSON estruturado
```

---

## O que a turma vê

| Tela | Para quem | O que mostra |
|---|---|---|
| `/` | turma (celular) | campo de nome + mensagem; devolve a classificação, o resumo, o rascunho e a confiança |
| `/triagem` | projetor | "o que chegou × o que a IA entregou", fila priorizada, KPIs de tempo devolvido e custo |
| `/demo` | instrutor | 5 mensagens prontas, cronômetro da versão humana, envio em sequência e reset |

**Modo sempre visível:** o badge no topo diz se está em **IA real (Gemini)**, **modo regra** (sem chave)
ou **modo ensaio**. A aula nunca fica sem resposta.

---

## A chave do Gemini (gratuita)

1. Abra https://aistudio.google.com/apikey e crie uma chave.
2. **Não** coloque a chave no código nem no repositório. Ela vai só como variável de ambiente.
3. No Render, preencha `GEMINI_API_KEY` no painel do serviço (o `render.yaml` já pede o valor no deploy).

Sem chave, o app funciona em **modo regra** (classificador determinístico) — útil para ensaiar, mas sem
o "uau" da IA real.

---

## Rodar localmente

Precisa só de Node 20+. Não há `npm install`.

```bash
cd ia
npm start
```

- Envio da turma: http://localhost:3000
- Telão: http://localhost:3000/triagem
- Demo do instrutor: http://localhost:3000/demo
- Saúde: http://localhost:3000/healthz

### Modos de ensaio

```bash
# 1) Sem chamada externa, latência simulada (ótimo para testar a aula sem gastar cota)
IA_PROVIDER=fake node server.js

# 2) Forçar o classificador por regras
IA_PROVIDER=regra node server.js

# 3) IA real (precisa da chave)
GEMINI_API_KEY=sua_chave node server.js
```

### Teste rápido da API

```bash
curl -X POST http://localhost:3000/api/messages \
  -H "content-type: application/json" \
  -d '{"name":"Ana","text":"fiz o pix de 1200 ontem e o pedido nao aparece, preciso essa semana"}'
```

Resposta (`201`) traz `message.result` com os sete campos e `message.meta` com provedor, tempo e custo.

---

## Publicar no GitHub + Render

O `render.yaml` da raiz cria **dois** serviços no mesmo repositório: `oficina-automacao` e `triagem-ia`.

### 1. GitHub

```bash
# na raiz do kit (palestra-automacao)
git add .
git commit -m "Demo de triagem com IA"
git remote add origin https://github.com/SEU_USUARIO/palestra-automacao.git
git push -u origin main
```

### 2. Render (Blueprint)

1. https://dashboard.render.com → **New** → **Blueprint** → conecte o repositório.
2. O Render lê o `render.yaml` e mostra os dois serviços. Ao aplicar, ele pede o valor de
   `GEMINI_API_KEY` e `DEMO_TOKEN` (marcados com `sync: false`).
3. Aguarde o deploy. O link fica em `https://triagem-ia.onrender.com` (o nome pode variar).

**Alternativa sem Blueprint:** **New** → **Web Service** → repositório → Root Directory `ia`,
Runtime **Node**, Build `npm install --omit=dev`, Start `npm start`, Health Check `/healthz`,
Plan **Free**. Depois adicione `GEMINI_API_KEY` em **Environment**.

### 3. Depois do deploy

- Abra `/` no celular e envie uma mensagem de teste.
- Abra `/triagem` no projetor (F11) e confirme o badge **IA real · gemini-2.5-flash**.
- Gere o QR do link de envio e coloque no slide.
- Se usar `DEMO_TOKEN`, abra `/demo`, cole o token no campo e clique em **Usar token** antes da aula.

---

## Roteiro de 6 a 8 minutos em aula

| Tempo | O que fazer | O que dizer |
|---|---|---|
| 0–1 min | Mostre uma mensagem real no slide | "Quanto tempo você levaria para ler, classificar e responder isso?" |
| 1–3 min | Cronometre você mesmo no `/demo` | Leia em voz alta, classifique, escreva a resposta. Pare o cronômetro e deixe o número na tela. |
| 3–4 min | Envie as 5 mensagens | "Agora o mesmo trabalho, cinco vezes." Abra `/triagem` no projetor. |
| 4–5 min | Aponte o hero da última mensagem | Categoria, urgência, resumo, rascunho e confiança — sem ninguém programar regra. |
| 5–6 min | Mostre a mensagem **ambígua** | "Confiança baixa: ela prefere perguntar a inventar. Isso vai para uma pessoa." |
| 6–8 min | Abra o QR e peça uma mensagem da turma | A mensagem de alguém da sala aparece no telão em segundos. |

### Dicas de condução

- **Reset antes de começar:** no `/demo`, clique em **Limpar a demo**.
- **Cronômetro é o argumento:** o número humano (3–5 min) contra o da IA (~2 s) vale mais que qualquer slide.
- **A conta no fim:** o KPI **Tempo devolvido** usa 4 min por mensagem como estimativa de trabalho humano.
  Multiplique por mensagens/dia × dias/ano para chegar em horas por ano.
- **Não esconda o erro:** se a IA errar a categoria, use isso. "Ela erra — por isso a confiança existe e
  alguém revisa."
- **Se o Gemini falhar ao vivo**, o app cai sozinho no modo regra e a tela avisa. Continue a aula.

---

## Variáveis de ambiente

| Variável | Padrão | Para quê |
|---|---|---|
| `PORT` | `3000` | porta HTTP |
| `GEMINI_API_KEY` | — | chave do Google AI Studio (só no Render, nunca no repo) |
| `GEMINI_MODEL` | `gemini-2.5-flash` | modelo usado |
| `IA_PROVIDER` | `auto` | `auto` (Gemini se houver chave), `gemini`, `regra` ou `fake` |
| `DEMO_TOKEN` | — | opcional: protege `/demo`, `/api/demo` e `/api/reset` |
| `MAX_TOTAL` | `600` | teto de mensagens por execução do servidor |
| `RATE_PER_MIN` | `12` | limite de mensagens por aparelho/minuto |
| `MAX_CONCURRENCY` | `6` | chamadas simultâneas à IA (acima disso usa regras) |
| `AI_TIMEOUT_MS` | `12000` | tempo máximo de uma chamada à IA |
| `HUMAN_MIN` | `4` | minutos de trabalho humano por mensagem (base do KPI) |
| `PRICE_IN` / `PRICE_OUT` | `0.3` / `2.5` | US$ por 1M de tokens, só para estimar custo |

---

## Custo e limites (free tier)

- **Gemini free tier:** suficiente para uma aula. Cada mensagem gasta poucos milhares de tokens;
  o KPI de custo no telão mostra o valor estimado (normalmente **menos de US$ 0,01** para a aula toda).
- **Cache por texto:** mensagens repetidas não chamam a IA de novo.
- **Render free:** o serviço dorme após ~15 min sem acesso e acorda em ~50 s. **Não há disco** —
  mensagens ficam só na memória e somem em restart/deploy. Abra o link 2 min antes da aula.
- **Limites de proteção:** 600 mensagens no total, 12 por minuto por aparelho, 6 chamadas simultâneas.
  Acima disso, o app responde com o classificador por regras em vez de travar.

---

## Privacidade e segurança

- Sem login, sem banco, sem cookies e sem rastreamento.
- As mensagens ficam **apenas na memória** do servidor e desaparecem no restart.
- O nome e o texto aparecem no telão: avise a turma para **não digitar dados sensíveis reais**.
- A chave da IA fica só em variável de ambiente no Render; o navegador nunca a vê.
- `/demo` e `/api/reset` podem ser protegidos com `DEMO_TOKEN` para evitar que alguém da rede limpe a demo.

---

## API

| Método | Rota | Descrição |
|---|---|---|
| `GET` | `/api/meta` | amostras da demo, limites e estatísticas |
| `GET` | `/api/messages` | mensagens da fila + estatísticas (o telão consulta a cada 1,5 s) |
| `POST` | `/api/messages` | recebe `{name, text}` e devolve a análise |
| `POST` | `/api/demo` | envia uma amostra `{sample}` (protegido por `DEMO_TOKEN`, se configurado) |
| `POST` | `/api/reset` | limpa a fila e os KPIs (protegido por `DEMO_TOKEN`, se configurado) |
| `GET` | `/healthz` | health check do Render |

Com `DEMO_TOKEN` ativo, envie o header `x-demo-token: SEU_TOKEN` ou o parâmetro `?t=SEU_TOKEN`.

---

## Estrutura

```
ia/
├── server.js          # HTTP, chamada ao Gemini, plano B por regras, limites e KPIs
├── public/
│   ├── index.html     # envio da turma (mobile-first)
│   ├── triagem.html   # telão ao vivo (tema escuro)
│   ├── demo.html      # painel do instrutor + cronômetro
│   └── styles.css     # estilos compartilhados
├── package.json
├── Dockerfile
└── README.md
render.yaml            # blueprint: oficina-automacao + triagem-ia
```

Sem dependências, sem build. `node server.js` é tudo.
