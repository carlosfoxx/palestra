# Kit da palestra — Automatização de Processos na Prática

**Público:** iniciantes / não técnicos
**Duração:** 60 min (flex 45–60; roteiro com cortes marcados)
**Ferramentas do exercício:** oficina publicada no Render (plano A), simulador local (plano B) ou n8n
**Demo de IA:** app separado no Render com Gemini (plano B automático: classificador por regras)
**Formato:** 3 exemplos reais → demo de regras no n8n → demo de IA ao vivo → exercício em duplas

---

## O que tem aqui

| Arquivo | Para quê |
|---|---|
| `roteiro-palestra.md` | Roteiro minuto a minuto, com falas prontas, ações na tela e planos B |
| `slides.html` | Deck completo (25 slides). Abra com duplo clique. Navegue com ← → |
| `simulador/index.html` | **Simulador em tempo real**: arquivo único, offline, sem instalar nada |
| `simulador/README.md` | Como distribuir, gabarito das regras e roteiro de 12 min em aula |
| `oficina/` | **Oficina real**: app Node com webhook público, regras no servidor, alerta externo e painel — publica no Render |
| `ia/` | **Demo de IA**: app Node separado que classifica mensagens com Gemini, resume, rascunha resposta e mostra confiança |
| `render.yaml` | Blueprint do Render com **dois** serviços: `oficina-automacao` e `triagem-ia` |
| `oficina/README.md` | Deploy no GitHub + Render, roteiro de 15 min e limitações do free tier |
| `ia/README.md` | Chave do Gemini, deploy, roteiro de 6–8 min, custo e limitações |
| `brincadeiras/aprovacao.py` | Brincadeira de encerramento: "prevê" se o aluno vai passar (offline, determinístico) |
| `exercicio/guia-do-aluno.md` | Handout do exercício (imprima ou distribua o link) |
| `exercicio/gabarito-instrutor.md` | Solução passo a passo, rubrica e erros comuns |
| `workflows/01-demo.json` | Workflow da demo (importar no n8n) |
| `workflows/02-exercicio-base.json` | Ponto de partida do exercício (só o formulário) |
| `workflows/03-exercicio-solucao.json` | Gabarito importável do exercício |

> **Ordem de importação no n8n:** `01-demo.json` para a demo e `02-exercicio-base.json` para a turma.
> Guarde o `03-exercicio-solucao.json` só para você (ou para a dupla que precisar de resgate).

---

## Agenda (60 min)

| Tempo | Bloco | Slide |
|---|---|---|
| 0:00–0:05 | Abertura + provocação (custo do trabalho repetitivo) | 1–2 |
| 0:05–0:12 | O que é (e o que não é) automação + anatomia | 3–4 |
| 0:12–0:21 | 3 exemplos reais (WhatsApp 24/7, triagem, relatório) | 5–8 |
| 0:21–0:30 | Demo ao vivo no n8n (regras) | 9–14 |
| 0:30–0:38 | **Demo de IA ao vivo**: cronômetro, triagem e confiança | 15–17 |
| 0:38–0:45 | Erros comuns + como escolher a primeira automação | 18–20 |
| 0:45–0:55 | Exercício em duplas (10 min): oficina no Render ou simulador | 21–22 |
| 0:55–0:58 | Compartilhar resultados | 23 |
| 0:58–1:00 | Desafio de 7 dias + fechamento | 24–25 |

**Se você tiver só 45 min:** corte o Case 3 (slide 8), reduza a demo do n8n para 6 min, a demo de IA
para 5 min, o exercício para 8 min e o compartilhar para 2 min.

---

## Checklist de preparação

### Na véspera (30 min)

- [ ] Instalar/abrir o n8n e rodar a demo uma vez do início ao fim
- [ ] Abrir `simulador/index.html`, rodar os 3 cenários e conferir o placar
- [ ] Publicar `oficina/` no Render e abrir o link no celular (teste de verdade)
- [ ] Criar a chave do Gemini no Google AI Studio e configurar `GEMINI_API_KEY` no serviço `triagem-ia`
- [ ] Abrir o app de IA (`ia/`) e enviar uma mensagem real; conferir o badge **IA real**
- [ ] Rodar `/demo` com as 5 amostras e conferir o telão `/triagem` (inclusive a mensagem ambígua)
- [ ] Ensaiar o cronômetro: fazer a versão humana de uma mensagem em ~3 min
- [ ] Gerar o QR do app de IA para o slide 17 (e o QR da oficina para o slide 21)
- [ ] Rodar o "dia completo" nos 3 cenários da oficina e conferir nota 100 com as regras ideais
- [ ] Abrir `/painel` no projetor e conferir o ranking
- [ ] Enviar o `simulador/index.html` para você mesmo por WhatsApp/e-mail (teste real de distribuição)
- [ ] Criar uma URL em https://webhook.site e deixar a aba aberta no navegador
- [ ] Importar `workflows/01-demo.json` e `workflows/02-exercicio-solucao.json`
- [ ] Testar o formulário da demo no celular (mesma rede ou túnel)
- [ ] Imprimir o guia do aluno (1 por dupla) ou preparar o link
- [ ] Abrir `slides.html` no navegador e testar as setas
- [ ] Testar o projetor: fonte grande, contraste, som (se for usar vídeo)

### No dia (10 min antes)

- [ ] n8n rodando em `http://localhost:5678`
- [ ] Oficina aberta no projetor (`/painel`) e link/QR pronto para a turma
- [ ] App de IA aberto em `/triagem` no projetor e `/demo` no notebook (com `DEMO_TOKEN`, se houver)
- [ ] `simulador/index.html` aberto em outra aba (se for usar na sala)
- [ ] Aba do webhook.site aberta e visível
- [ ] Deck aberto (tecla `F` para tela cheia)
- [ ] Celular com internet para mostrar o "alerta chegando"
- [ ] Água. Sim, isso conta como preparação.

### Plano B (sem internet ou n8n travou)

1. **A demo tem prints no deck** — continue a explicação pelos slides 11–14.
2. **Se a oficina no Render dormir**, o primeiro acesso leva ~50 s: abra o link 2 min antes e deixe
   uma aba já acordada. Se a internet cair de vez, troque para o simulador.
3. **Se o app de IA falhar**, ele cai sozinho no modo regra e o badge muda na tela — siga a demo.
   Sem internet, use os slides 15–17 e o cronômetro do celular.
4. **O exercício continua com o simulador** (`simulador/index.html`), que roda offline e não depende
   do n8n nem do Render. Cada dupla configura as regras e compara o placar.
5. Sem computador por dupla: projete o simulador e conduza a turma por votação ("alerta em tudo ou só
   no urgente?"). Depois, cada dupla desenha os 4 blocos do processo que escolher.
6. Peça a uma dupla que já usou Zapier/Make/Power Automate para contar a experiência.

---

## Como rodar o n8n (duas opções)

**Opção 1 — mais rápida (Node 20+):**

```bash
npx n8n
```

Abre em `http://localhost:5678`. Na primeira vez, crie a conta local (e-mail/senha são só locais).

**Opção 2 — Docker:**

```bash
docker run -it --rm --name n8n -p 5678:5678 -v n8n_data:/home/node/.n8n docker.n8n.io/n8nio/n8n
```

> Se `npx n8n` reclamar da versão do Node, use Node 22 LTS (nvm/fnm) ou a opção Docker.

---

## Simulador: o exercício sem instalação

`simulador/index.html` é um arquivo único que abre com duplo clique, **offline**, sem n8n e sem conta.
O participante ajusta regras e vê a automação decidindo em tempo real — alertas, fila, KPIs e placar.

**Como usar em 4 passos:**

1. Distribua o arquivo (WhatsApp, e-mail, pendrive). Cada um abre o seu.
2. Peça que leiam a missão do cenário e ajustem as regras.
3. Cada rodada leva ~20 s. O modal final mostra nota por critério e o próximo passo.
4. Compare **critérios**, não números: "por que sua pontuação de alertas foi maior que a minha?"

**Os 3 cenários:** atendimento WhatsApp (18 mensagens), triagem de solicitações (16 pedidos) e
relatório diário (12 dias). O gabarito das regras, o roteiro de 12 min e a demo de 60 s
(automação OFF → fila crescendo → ON → fila drenando) estão em `simulador/README.md`.

**n8n, oficina ou simulador?** Use a **oficina no Render** como plano A: é automação real, acessível
por link/QR, sem instalar nada. Use o **simulador** quando a internet for o gargalo. Use o **n8n**
quando quiser abrir a ferramenta de mercado e mostrar o fluxo por dentro. Os três usam o mesmo
raciocínio — dá para fazer o simulador como aquecimento e a oficina como exercício principal.

---

## Oficina real: GitHub + Render (o "ato 2")

Depois da teoria, a turma não simula: cada dupla cria um espaço, define regras e recebe eventos por um
**webhook público**. O servidor Node decide, alerta (na tela e, se configurado, num POST real para o
webhook.site) e registra — com placar e painel para projetar.

**O que é real:** requisições HTTP, regras no servidor, ação externa, log e placar.
**O que é fixo:** os eventos do "dia completo", iguais para todos compararem o mesmo cenário.

### Publicar em 5 minutos

1. Crie um repositório vazio no GitHub e envie este kit (`git remote add origin ...` e
   `git push -u origin main`).
2. No Render: **New → Blueprint** → conecte o repositório → **Apply**. O `render.yaml` cria **dois**
   serviços: `oficina-automacao` (`rootDir: oficina`) e `triagem-ia` (`rootDir: ia`), ambos no plano
   free e com health check em `/healthz`. Na criação, o Render pede `GEMINI_API_KEY` e `DEMO_TOKEN`.
3. Abra o link da oficina no celular, crie um espaço e clique em **Enviar o dia completo**.
4. Gere um QR code do link da oficina para o slide 21 e deixe `/painel` aberto no projetor.
5. Abra o link do app de IA, envie uma mensagem e confira o badge **IA real**. Gere o QR para o slide 17.

Passo a passo detalhado, API, segurança e limitações: `oficina/README.md`.

### Em aula (10–15 min)

1. **0–2 min:** projete o QR. "Abram, criem um espaço com o nome da dupla e escolham um processo."
2. **2–5 min:** cada dupla mexe nas regras. Deixe errar de propósito.
3. **5–8 min:** **Enviar 1 evento** e leia o log junto: gatilho → condição → ação → registro.
4. **8–11 min:** **Enviar o dia completo**. Ajuste as regras e rode de novo para ver o placar mudar.
5. **11–14 min:** abra `/painel` e compare critérios, não só notas.
6. **14–15 min:** "o que vocês mudariam no processo real amanhã?"

### Free tier (aceitável para aula)

O serviço dorme após ~15 min sem acesso e acorda em ~50 s; sem disco, os espaços em memória somem em
restart/deploy. Sessões duram 3 h. Para uso contínuo, use plano pago + disco ou um banco de dados.

---

## Demo de IA: o "momento uau" (ato 3)

Depois de mostrar que regra resolve o previsível, o app `ia/` mostra o que a regra **não** resolve:
a mensagem ambígua, mal escrita, com prazo escondido e tom de irritação.

**O que acontece na tela:**

1. Você cronometra a versão humana de uma mensagem real (~3 min).
2. Dispara 5 mensagens prontas; a IA devolve categoria, urgência, resumo, rascunho e confiança em ~2 s.
3. A mensagem ambígua vem com **confiança 32%** e o selo **revisar** — a IA prefere perguntar a inventar.
4. A turma escaneia o QR, manda uma mensagem de trabalho do celular e vê a própria mensagem triada no telão.

**Por que impacta:** não é "olha como a IA é legal". É a mesma tarefa, duas vezes, com cronômetro,
contra a conta de horas/ano — e com o erro aparecendo de propósito. A narrativa fica:
**regra para o previsível, IA para o ambíguo, humano para o que importa.**

**Provedor:** Gemini (free tier), chave só em variável de ambiente no Render. Sem chave, o app cai
sozinho no classificador por regras e a tela avisa — a aula nunca trava.

Roteiro detalhado, variáveis, custo e limitações: `ia/README.md`.

---

## Brincadeira de encerramento (opcional)

`brincadeiras/aprovacao.py` recebe um nome e devolve um boletim fictício com veredito.
É determinístico: o mesmo nome sempre dá o mesmo resultado — porque é um hash, não uma IA.

```bash
python brincadeiras/aprovacao.py --nome "Maria Silva"
```

Funciona offline, sem instalar nada. Uso, flags e a piada de fechamento: `brincadeiras/README.md`.

---

## Gerar PDF do deck (opcional)

Abra `slides.html` no Chrome/Edge → **Ctrl+P** → **Paisagem** → **Margens: nenhuma** →
ative **Gráficos de plano de fundo** → salvar como PDF. Cada slide vira uma página A4.

O deck também abre só com duplo clique, **sem internet** — não depende de CDN.

---

## Personalização rápida

Antes de apresentar, troque:

- No `slides.html`: `[SEU NOME]`, `[EMPRESA/INSTITUIÇÃO]`, `[DATA]` (slide 1) e o bloco de contato (slide 25).
- No `slides.html`: troque os três blocos `QR ... (substituir)` pelo QR real (app de IA no slide 17,
  oficina no slide 21 e kit/apps no fechamento).
- No `roteiro-palestra.md`: os trechos entre `[...]`.
- Nos números dos cases: use os seus, se tiver. Número real > número redondo.

---

## Mensagem central da palestra

> Automação não é sobre substituir pessoas. É sobre tirar da pessoa aquilo que não precisa de pessoa:
> tarefa repetitiva, baseada em regra, que não dá prazer nem aprendizado.

> **Regra para o previsível. IA para o ambíguo. Humano para o que importa.**

Se a turma sair sabendo identificar **gatilho, condição, ação e registro** em qualquer processo — e
souber onde entra a IA e onde entra a pessoa — a palestra cumpriu o objetivo.
