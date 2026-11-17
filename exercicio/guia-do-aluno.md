# Exercício — Robô de triagem de solicitações

**Tempo:** 12 minutos (+ desafios extras)
**Formato:** duplas · 1 computador por dupla
**Ferramenta:** n8n (já aberto pelo instrutor) **ou** a oficina online no Render
**Nível:** zero programação

> **Versão online (plano A):** se o instrutor passou um link/QR, faça o exercício na oficina
> publicada. Escolha o processo **Triagem de solicitações** — as regras e o critério de sucesso são os
> mesmos deste guia. As seções de n8n abaixo ficam como referência da versão com nós.

---

## Missão

Montar um fluxo que:

1. recebe uma solicitação por **formulário**;
2. gera um **protocolo** automático;
3. classifica pelo **impacto**;
4. **alerta o responsável** em menos de 5 segundos — mas só quando o impacto for **“Todos”**.

> Você vai usar os 4 blocos da palestra:
> **gatilho** (formulário) → **condição** (impacto) → **ação** (alerta) → **registro** (protocolo).

---

## Antes de começar (2 min)

- [ ] O n8n está aberto em `http://localhost:5678`
- [ ] A aba do **https://webhook.site** está aberta e você copiou a **URL única** dela
      (a URL aparece no topo da página, tipo `https://webhook.site/1a2b3c4d-...`)
- [ ] Você sabe com quem está pareado(a)

> **webhook.site é o nosso “celular do gerente”.** Tudo que chega lá aparece na tela em tempo real.
> Não precisa criar conta.

---

## Passo 0 · Abrir o workflow base (1 min)

1. No n8n, clique em **Workflows** (menu da esquerda).
2. Clique nos **três pontinhos** (canto superior direito) → **Import from File…**
3. Escolha o arquivo **`02-exercicio-base.json`**.
4. Renomeie o workflow para **`Dupla [seus nomes]`** (clique no título no topo).

Você deve ver uma caixinha só: **1. Formulario**.

> Não achou o arquivo? Peça ao instrutor. Também dá para colar: copie o conteúdo do `.json`,
> clique no canvas do n8n e pressione **Ctrl+V**.

---

## Passo 1 · Conhecer o gatilho (1 min)

1. Dê **duplo clique** no nó **1. Formulario**.
2. Veja os campos: **Solicitante**, **Setor**, **Descricao**, **Impacto**.
3. Feche o nó.

> O formulário já está pronto de propósito: seu trabalho é a **lógica**, não a tela.

---

## Passo 2 · Criar o protocolo (2 min)

1. Clique no **+** ao lado direito do nó do formulário.
2. Procure por **Edit Fields** (em versões antigas: **Set**) e adicione.
3. Renomeie o nó para **`2. Protocolo`** (duplo clique no nome).
4. Em **Mode**, deixe **Manual Mapping**.
5. Clique em **Add Field** → **Name:** `protocolo`
   → **Value:** clique no ícone de expressão (`{{ }}` ou “Expression”) e cole:

```text
{{ 'SOL-' + $now.format('yyyyMMdd-HHmmss') }}
```

6. Ligue a opção **Include Other Input Fields** (incluir os outros campos).
   *Sem isso, os campos do formulário somem e a próxima etapa não funciona.*
7. Feche o nó. Ele deve estar **conectado** ao formulário (linha entre os dois).

> **O que acabou de acontecer:** cada solicitação ganha um código único, tipo `SOL-20261117-094233`.
> Isso é o bloco **registro** — a prova de que o pedido existiu.

---

## Passo 3 · A regra: é urgente? (2 min)

1. Clique no **+** depois de `2. Protocolo` e adicione o nó **If**.
2. Renomeie para **`3. E urgente?`**.
3. Em **Conditions**, configure:
   - primeiro valor: clique em **Expression** e cole `{{ $json.Impacto }}`
   - operador: **String → is equal to** (é igual a)
   - segundo valor: `Todos`
4. Feche o nó. Agora ele tem **duas saídas**: `true` (verde) e `false` (cinza).

> **Atenção:** o valor tem que ser exatamente `Todos`, com T maiúsculo e sem espaço.
> Se o seu formulário usar outro texto, ajuste aqui.

---

## Passo 4 · As duas ações (3 min)

### Saída `true` — impacto “Todos” = prioridade alta

1. Clique no **+** da saída **true** → adicione **Edit Fields** → renomeie para **`3a. Alta`**.
2. **Add Field:** `prioridade` = `Alta` (texto normal, sem expressão).
3. **Add Field:** `prazo` = `1 hora`.
4. Ligue **Include Other Input Fields**.

### Saída `false` — o resto = prioridade normal

1. Clique no **+** da saída **false** → adicione **Edit Fields** → renomeie para **`3b. Normal`**.
2. **Add Field:** `prioridade` = `Normal`.
3. **Add Field:** `prazo` = `24 horas`.
4. Ligue **Include Other Input Fields**.

> Repare: são **dois caminhos**, mas o processo é o mesmo. Você acabou de escrever a regra
> que na sua empresa hoje está na cabeça de alguém.

---

## Passo 5 · A ação final: alertar (2 min)

1. Adicione um nó **HTTP Request** e renomeie para **`4. Alerta`**.
2. **Method:** `POST`
3. **URL:** cole a **sua** URL do webhook.site
4. Ative **Send Body** → **Body Content Type:** `JSON`
5. Em **JSON**, clique em **Expression** e cole:

```text
{{ JSON.stringify($json) }}
```

6. **Conecte as duas saídas** (`3a. Alta` e `3b. Normal`) neste mesmo nó.
   Arraste do pontinho de cada uma até o nó `4. Alerta`.

> Sim, os dois caminhos chegam no mesmo lugar. O que muda é o conteúdo:
> prioridade `Alta`/`1 hora` ou `Normal`/`24 horas`.

---

## Passo 6 · Testar (2 min)

1. Clique em **Execute workflow** (canto inferior, botão de play).
2. O n8n vai abrir o **Test URL** do formulário em uma nova aba.
3. Preencha com **Impacto = Todos** e envie.
4. Volte ao n8n: os nós devem ficar **verdes**.
5. Olhe a aba do **webhook.site**: o JSON deve aparecer **em segundos**.

**Agora o teste que prova a regra:**

6. Rode de novo (**Execute workflow**) e envie uma solicitação com **Impacto = Parte**.
7. O caminho `3b. Normal` deve ficar verde, o `3a. Alta` **não**.
8. No webhook.site, confira: chegou com `"prioridade":"Normal"` e `"prazo":"24 horas"`.

### Critérios de sucesso

- [ ] Solicitação **“Todos”** → alerta chega em menos de 5 segundos
- [ ] Solicitação **“Parte”** → alerta também chega, mas com prioridade **Normal**
- [ ] O alerta contém o **protocolo** (`SOL-...`)
- [ ] Consegui explicar em voz alta: qual é o **gatilho**, a **condição**, a **ação** e o **registro**

> **Atenção:** o critério é “chega com prioridade diferente”, não “não chega”.
> Na versão da palestra, o não-urgente não alertava. Aqui ele alerta com outra prioridade —
> as duas abordagens são válidas; o importante é a **regra ser a mesma para todos**.

---

## Cola de expressões

| O que quero | Expressão |
|---|---|
| Ler um campo do formulário | `{{ $json.Impacto }}` |
| Gerar código único com data/hora | `{{ 'SOL-' + $now.format('yyyyMMdd-HHmmss') }}` |
| Enviar tudo que chegou como JSON | `{{ JSON.stringify($json) }}` |
| Data legível | `{{ $now.format('dd/MM/yyyy HH:mm') }}` |

---

## Deu erro? Procure aqui primeiro

| Sintoma | Causa provável | Correção |
|---|---|---|
| O formulário não abre | Workflow não está em execução | Clique em **Execute workflow** de novo |
| Os nós ficam cinza e nada roda | Nó não está conectado | Arraste do pontinho de saída até o próximo nó |
| `Impacto` aparece vazio / indefinido | Nome do campo diferente | Use exatamente `Impacto` (sem acento, sem espaço) |
| O alerta nunca chega | URL do webhook.site errada, incompleta ou expirada | Gere outra URL e cole de novo |
| O nó HTTP dá erro 404 | URL inválida | Confira se copiou o endereço inteiro |
| Os campos do formulário sumiram | **Include Other Input Fields** desligado | Ligue a opção no Edit Fields |
| O If nunca dá `true` | Texto diferente de `Todos` | Confira maiúsculas e espaços |
| "Execute step" mostra dados mas não continua | Você testou só o nó do formulário | Use **Execute workflow** (play geral) |
| n8n não abre | Versão do Node | Use Node 22 LTS ou Docker |

**Regra da dupla:** tentem rodar **uma vez** antes de chamar o instrutor. Anotem a mensagem de erro
exata — ela quase sempre diz qual nó e qual campo.

---

## Terminou antes? Desafios extras

1. **Prazo inteligente:** faça o prazo depender do setor (Financeiro = 2 h, Suporte = 4 h, Comercial = 24 h).
2. **Segundo alerta:** adicione outro nó HTTP para uma segunda URL do webhook.site e compare os JSONs.
3. **Regra composta:** “Todos” **ou** setor Financeiro → prioridade Alta.
   (No If, adicione a segunda condição e mude o combinador para **OR**.)
4. **Anti-duplicidade:** adicione um nó **Filter** que descarta solicitações com descrição vazia.
5. **Registro em arquivo:** adicione **Convert to File** (JSON) → **Read/Write Files from Disk** e grave
   um arquivo no computador. É o “banco de dados” mais simples que existe.
6. **Formulário melhor:** adicione um campo de e-mail com validação e um texto de ajuda.

---

## Anotações da dupla

**A tarefa chata que eu automatizaria amanhã:**

```text
_______________________________________________________________
_______________________________________________________________
```

**Onde travamos:**

```text
_______________________________________________________________
```

**Gatilho / condição / ação / registro do nosso fluxo:**

```text
Gatilho:  ____________________________________________
Condição: ____________________________________________
Ação:     ____________________________________________
Registro: ____________________________________________
```
