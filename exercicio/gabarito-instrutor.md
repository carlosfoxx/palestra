# Gabarito do instrutor — Exercício de triagem

**Duração:** 12 min de exercício + 4 min de compartilhar
**Objetivo real:** a turma sair sabendo identificar gatilho, condição, ação e registro — não decorar o n8n.

---

## Antes da aula (10 min de preparação)

1. **Abra o n8n** e importe `workflows/02-exercicio-base.json` e `workflows/03-exercicio-solucao.json`.
2. **Crie uma URL no webhook.site** e deixe a aba aberta. Ela será a sua referência na projeção.
3. **Rode a solução uma vez** com “Todos” e uma com “Parte”. Confira o JSON chegando.
4. **Distribua o guia** (`exercicio/guia-do-aluno.md`) impresso (1 por dupla) ou por link/QR.
5. Salve o `03-exercicio-solucao.json` em um lugar fácil: duplas que travarem muito podem importar o
   gabarito e comparar — mas só depois de tentar.

> **Dica de logística:** se a turma não tem n8n instalado, você pode rodar o exercício em “modo espelho”:
> projete o seu n8n, a turma acompanha e dita as decisões, e cada dupla monta no papel o fluxo
> (4 blocos + regra). Funciona bem e não depende de instalação.

---

## Solução nó a nó

### Nó 1 — Form Trigger (já vem no arquivo base)

| Campo | Valor |
|---|---|
| Título | `Solicitacao de suporte` |
| Campo 1 | `Solicitante` (texto, obrigatório) |
| Campo 2 | `Setor` (dropdown: Financeiro / Comercial / Suporte) |
| Campo 3 | `Descricao` (texto longo, obrigatório) |
| Campo 4 | `Impacto` (dropdown: Todos / Parte / Um) |

### Nó 2 — Edit Fields · `2. Protocolo`

| Config | Valor |
|---|---|
| Mode | Manual Mapping |
| Field `protocolo` | `{{ 'SOL-' + $now.format('yyyyMMdd-HHmmss') }}` |
| Include Other Input Fields | **ligado** |

### Nó 3 — If · `3. E urgente?`

| Config | Valor |
|---|---|
| Left value (expression) | `{{ $json.Impacto }}` |
| Operator | String → **is equal to** |
| Right value | `Todos` |

### Nó 3a — Edit Fields · `3a. Alta` (saída true)

| Config | Valor |
|---|---|
| Field `prioridade` | `Alta` |
| Field `prazo` | `1 hora` |
| Include Other Input Fields | **ligado** |

### Nó 3b — Edit Fields · `3b. Normal` (saída false)

| Config | Valor |
|---|---|
| Field `prioridade` | `Normal` |
| Field `prazo` | `24 horas` |
| Include Other Input Fields | **ligado** |

### Nó 4 — HTTP Request · `4. Alerta`

| Config | Valor |
|---|---|
| Method | `POST` |
| URL | `https://webhook.site/<URL-da-sua-sala>` |
| Send Body | ligado |
| Body Content Type | `JSON` |
| JSON (expression) | `{{ JSON.stringify($json) }}` |

**Conexões finais:**

```text
1. Formulario → 2. Protocolo → 3. E urgente?
                                    ├── true  → 3a. Alta   ─┐
                                    └── false → 3b. Normal ─┴→ 4. Alerta
```

---

## Resultado esperado

**Envio com Impacto = Todos** (no webhook.site, em segundos):

```json
{
  "Solicitante": "Maria",
  "Setor": "Suporte",
  "Descricao": "Sistema caiu",
  "Impacto": "Todos",
  "protocolo": "SOL-20261117-094233",
  "prioridade": "Alta",
  "prazo": "1 hora"
}
```

**Envio com Impacto = Parte:**

```json
{
  "...": "...",
  "protocolo": "SOL-20261117-094510",
  "prioridade": "Normal",
  "prazo": "24 horas"
}
```

O que observar no n8n: no primeiro teste, `3a. Alta` fica verde e `3b. Normal` cinza. No segundo, o contrário.

---

## Como avaliar (rubrica rápida)

Dê 1 ponto por item — não é prova, é diagnóstico:

| Item | O que observar |
|---|---|
| **Gatilho** | O fluxo começa no formulário e recebe os 4 campos |
| **Regra** | “Todos” e “Parte” seguem caminhos diferentes |
| **Ação** | O alerta chega no webhook.site com os dados certos |
| **Registro** | O protocolo aparece e é único por envio |
| **Explicação** | A dupla consegue nomear os 4 blocos sem olhar o slide |

**Leitura do resultado:**
- 5/5 → entendeu. Desafio extra: prazo por setor.
- 3–4 → entendeu o raciocínio, travou em configuração. Normal. Aponte o guia.
- 0–2 → provavelmente não conectou o conceito. Sente com a dupla e refaça só o If, falando em voz alta.

---

## Erros mais comuns (e a correção em 1 frase)

| Erro | O que aconteceu | Fala que destrava |
|---|---|---|
| Campos somem depois do Edit Fields | `Include Other Input Fields` desligado | “Liga o ‘incluir outros campos’ — senão ele joga fora o que recebeu.” |
| If sempre `false` | Texto diferente (`todos`, `Todos `, `TODO`) | “Compara exatamente com o que o formulário manda. Abre o output do nó anterior e copia.” |
| Alerta não chega | URL incompleta ou webhook.site expirado | “Gera uma URL nova e cola de novo. Testa no navegador primeiro.” |
| Nó cinza, execução para | Falta conexão | “Arrasta do pontinho de saída até o próximo nó — a linha tem que existir.” |
| Só o primeiro nó roda | Testou o nó em vez do fluxo | “Clica em Execute workflow, não em Test step.” |
| HTTP 404 | URL com espaço ou caractere faltando | “Copia a URL inteira, do https até o fim.” |
| Expressão aparece como texto | Campo está em modo fixo, não expressão | “Clica no `{{ }}` e cola dentro da expressão.” |
| n8n não instala | Node antigo | “Usa Node 22 LTS ou a opção Docker do guia.” |

---

## Roteiro de fala durante os 12 minutos

| Minuto | O que fazer |
|---|---|
| 0–2 | Repetir a missão e o critério de sucesso. Confirmar que todos abriram o workflow base. |
| 2–5 | Circular. Perguntar “onde vocês estão?”, não “deu certo?”. Não pegar o mouse sem pedir. |
| 5–8 | Se 3+ duplas travarem no mesmo ponto, parar tudo e projetar a correção em 60 s. |
| 8–11 | Quem terminou: apontar desafio extra. Quem travou: reduzir para “só o If funcionando”. |
| 11–12 | Avisar: “1 minuto para rodar o último teste”. |
| 12 | Parar. “Mãos fora do teclado. Vamos ouvir três duplas.” |

---

## Perguntas que costumam aparecer

**“Por que o não-urgente também alerta aqui?”**
Porque no exercício optamos por mudar a prioridade, não por silenciar. Na demo, o não-urgente só era
registrado. As duas são válidas — o critério é a regra ser **explícita e igual para todos**.

**“Isso funciona com WhatsApp/e-mail de verdade?”**
Sim: o nó HTTP vira um nó de WhatsApp, Gmail, Slack ou planilha. A lógica (gatilho → condição → ação)
não muda. Só troca a caixinha da ação.

**“Preciso deixar o computador ligado?”**
Para rodar local, sim. Em produção, o n8n roda num servidor (ou na nuvem) e fica 24/7.

**“E se duas pessoas enviarem ao mesmo tempo?”**
O n8n executa uma execução por evento; protocolos com data/hora podem colidir no mesmo segundo.
Em produção, use um contador no banco ou UUID. É um ótimo gancho para “quando chamar um dev”.

**“Quanto custa para valer?”**
Self-hosted: infraestrutura (um servidor pequeno) + tempo de manutenção. n8n Cloud: a partir de
~US$ 24/mês. O custo real é mapear e manter o processo.
