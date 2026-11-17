# Kit da palestra — Automatização de Processos na Prática

**Público:** iniciantes / não técnicos
**Duração:** 45–60 min (roteiro calibrado para 55 min, com cortes marcados)
**Ferramenta do exercício:** n8n (no-code, roda local, sem cartão de crédito)
**Formato:** 3 exemplos reais → demo ao vivo → exercício em duplas

---

## O que tem aqui

| Arquivo | Para quê |
|---|---|
| `roteiro-palestra.md` | Roteiro minuto a minuto, com falas prontas, ações na tela e planos B |
| `slides.html` | Deck completo. Abra com duplo clique. Navegue com ← → |
| `exercicio/guia-do-aluno.md` | Handout do exercício (imprima ou distribua o link) |
| `exercicio/gabarito-instrutor.md` | Solução passo a passo, rubrica e erros comuns |
| `workflows/01-demo.json` | Workflow da demo (importar no n8n) |
| `workflows/02-exercicio-base.json` | Ponto de partida do exercício (só o formulário) |
| `workflows/03-exercicio-solucao.json` | Gabarito importável do exercício |

> **Ordem de importação no n8n:** `01-demo.json` para a demo e `02-exercicio-base.json` para a turma.
> Guarde o `03-exercicio-solucao.json` só para você (ou para a dupla que precisar de resgate).

---

## Agenda (55 min)

| Tempo | Bloco | Slide |
|---|---|---|
| 0:00–0:05 | Abertura + provocação (custo do trabalho repetitivo) | 1–2 |
| 0:05–0:12 | O que é (e o que não é) automação + anatomia | 3–4 |
| 0:12–0:22 | 3 exemplos reais (WhatsApp 24/7, triagem, relatório) | 5–8 |
| 0:22–0:33 | Demo ao vivo no n8n | 9–14 |
| 0:33–0:41 | Erros comuns + como escolher a primeira automação | 15–17 |
| 0:41–0:53 | Exercício em duplas (12 min) | 18–19 |
| 0:53–0:57 | Compartilhar resultados | 20 |
| 0:57–1:00 | Desafio de 7 dias + fechamento | 21–22 |

**Se você tiver só 45 min:** corte o Case 3 (slide 8), reduza o exercício para 8 min e o compartilhar para 2 min.

---

## Checklist de preparação

### Na véspera (30 min)

- [ ] Instalar/abrir o n8n e rodar a demo uma vez do início ao fim
- [ ] Criar uma URL em https://webhook.site e deixar a aba aberta no navegador
- [ ] Importar `workflows/01-demo.json` e `workflows/02-exercicio-solucao.json`
- [ ] Testar o formulário da demo no celular (mesma rede ou túnel)
- [ ] Imprimir o guia do aluno (1 por dupla) ou preparar o link
- [ ] Abrir `slides.html` no navegador e testar as setas
- [ ] Testar o projetor: fonte grande, contraste, som (se for usar vídeo)

### No dia (10 min antes)

- [ ] n8n rodando em `http://localhost:5678`
- [ ] Aba do webhook.site aberta e visível
- [ ] Deck aberto (tecla `F` para tela cheia)
- [ ] Celular com internet para mostrar o "alerta chegando"
- [ ] Água. Sim, isso conta como preparação.

### Plano B (sem internet ou n8n travou)

1. A demo tem prints no deck — continue a explicação pelos slides 11–14.
2. O exercício vira "monte no papel": cada dupla desenha os 4 blocos (gatilho → condição → ação → registro) do processo que escolher.
3. Peça a uma dupla que já usou Zapier/Make/Power Automate para contar a experiência.

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

## Gerar PDF do deck (opcional)

Abra `slides.html` no Chrome/Edge → **Ctrl+P** → **Paisagem** → **Margens: nenhuma** →
ative **Gráficos de plano de fundo** → salvar como PDF. Cada slide vira uma página A4.

O deck também abre só com duplo clique, **sem internet** — não depende de CDN.

---

## Personalização rápida

Antes de apresentar, troque:

- No `slides.html`: `[SEU NOME]`, `[EMPRESA/INSTITUIÇÃO]`, `[DATA]` (slide 1) e o bloco de contato (slide 22).
- No `roteiro-palestra.md`: os trechos entre `[...]`.
- Nos números dos cases: use os seus, se tiver. Número real > número redondo.

---

## Mensagem central da palestra

> Automação não é sobre substituir pessoas. É sobre tirar da pessoa aquilo que não precisa de pessoa:
> tarefa repetitiva, baseada em regra, que não dá prazer nem aprendizado.

Se a turma sair sabendo identificar **gatilho, condição, ação e registro** em qualquer processo, a palestra cumpriu o objetivo.
