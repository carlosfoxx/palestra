# Simulador de Automação — ao vivo

Um arquivo, zero instalação. Os participantes abrem o `index.html`, ajustam regras e veem a automação
decidindo em tempo real: alertas chegando, fila crescendo, KPIs mudando e um placar no final.

É o exercício da palestra sem depender de n8n, internet ou conta em nuvem.

---

## Como abrir

1. Dê **duplo clique** em `index.html`.
2. Abre no navegador padrão (Chrome, Edge ou Firefox). Funciona **offline**.

> Se o duplo clique abrir no bloco de notas ou em outro app, clique com o botão direito →
> **Abrir com** → Chrome/Edge.

## Como distribuir na sala

- Mande o **arquivo único** `index.html` por WhatsApp, e-mail, Teams ou pendrive.
- Ou compacte a pasta `simulador/` e distribua o `.zip`.
- Cada participante abre **o próprio arquivo**: as regras e o placar ficam salvos no navegador
  de cada um (`localStorage`), não em um servidor.
- Não precisa de internet. Não precisa instalar. Não precisa criar conta.

> Dica: renomeie para `simulador-automacao.html` antes de enviar. Fica mais fácil de achar na
> pasta de downloads.

---

## O que a turma faz

Não é arrastar blocos. É **tomar decisões de processo** — exatamente o que um analista faria antes
de automatizar:

1. Escolhe um dos **3 cenários**.
2. Ajusta de 3 a 4 **regras** (quem alertar, quando transferir, o que registrar, horário, público).
3. Clica em **Testar estas regras**.
4. Vê o robô processar os eventos, os quatro blocos acendendo, a fila, os KPIs e o placar.
5. Lê o diagnóstico, ajusta e testa de novo.

Cada rodada leva ~20 segundos em velocidade 1x. O mesmo dia de trabalho é entregue a todos —
a diferença no placar vem das regras, não da sorte.

---

## Os 3 cenários

### 💬 Atendimento WhatsApp (18 mensagens)

Uma clínica recebe mensagens em uma hora. A IA já responde o que está na base.

| Regra | Opções | Ideal |
|---|---|---|
| Alertar o time quando a urgência for | Todas · Alta ou Normal · **Só Alta** · Nunca | `Só Alta` |
| Chamar um humano quando | Sempre · **Só quando a IA não souber** · Nunca | `Só quando a IA não souber` |
| Registrar a conversa no histórico | liga/desliga | `ligado` |

**Conceito:** alerta demais interrompe o time; alerta de menos perde risco clínico. E "a IA não sabe"
é diferente de "é urgente".

### 🗂️ Triagem de solicitações (16 pedidos)

Financeiro, Comercial e Suporte mandam pedidos com impacto "Todos", "Parte" ou "Um".

| Regra | Opções | Ideal |
|---|---|---|
| Prioridade ALTA quando o impacto for | **"Todos" apenas** · "Todos" ou "Parte" · Qualquer · Nenhum | `"Todos" apenas` |
| Pedidos do Financeiro são sempre críticos | liga/desliga | `ligado` |
| Gerar protocolo automático | liga/desliga | `ligado` |

**Conceito:** a regra combina impacto **e** setor. Sem protocolo, o pedido existe — mas ninguém
consegue provar.

### 📊 Relatório diário (12 dias)

A diretoria espera o fechamento às 8h. A fonte de dados falha de vez em quando.

| Regra | Opções | Ideal |
|---|---|---|
| Horário do envio automático | **08:00** · 09:00 · 12:00 | `08:00` |
| Avisar quando a variação passar de | 5% · **10%** · 20% · Nunca | `10%` |
| Quem recebe o relatório | **Só a diretoria** · Toda a empresa · Ninguém | `Só a diretoria` |
| Avisar quando a fonte falhar | liga/desliga | `ligado` |

**Conceito:** automação que falha em silêncio é pior que processo manual. A última regra é a que
separa automação de aposta.

---

## O placar

| Faixa | Leitura |
|---|---|
| 90–100 | Automação de gente grande — pronta para produção |
| 75–89 | Boa — um ou dois ajustes |
| 50–74 | Funciona, mas gera ruído |
| 0–49 | Volte ao mapa do processo |

O placar nunca é sobre "acertar o gabarito": o modal mostra **por critério** onde o fluxo perdeu
pontos e qual é o próximo passo. Duas duplas com placares diferentes conseguem discutir *por quê*.

As melhores pontuações ficam salvas por cenário no navegador de cada participante.

---

## Demo de 60 segundos (a que impressiona)

Durante a palestra, antes de liberar o exercício:

1. Com a **Automação ON**, clique em **Iniciar**. Deixe rodar ~5 segundos.
2. Clique no botão **Automação ON** para desligar. A caixa vermelha **Fila manual** aparece e o
   número sobe: cada caso agora custa ~17 minutos de uma pessoa.
3. Deixe a fila crescer por 10–15 segundos.
4. Ligue de novo. A fila **drena em segundos** e os alertas voltam a chegar.

Fala sugerida: *"Olha a diferença entre o trabalho esperando alguém e o trabalho esperando uma regra."*

---

## Roteiro de 12 minutos em aula

| Minuto | O que fazer |
|---|---|
| 0–2 | Projete o simulador, escolha **Atendimento WhatsApp** e leia a missão em voz alta |
| 2–3 | Mostre as 3 regras e pergunte à sala: "quem alertaria em tudo? quem só no urgente?" |
| 3–5 | Rode com as regras padrão e mostre o placar baixo + o diagnóstico |
| 5–9 | Cada um ajusta e testa no seu arquivo. Circule perguntando "o que você mudou e por quê?" |
| 9–12 | Peça 2–3 placares. Comparem **critérios**, não números. Feche com "regra explícita > sorte" |
| Bônus | Quem chegar a 90+ muda para **Triagem** ou **Relatório diário** |

Se a sala não puder abrir arquivos (tablet restrito, política de TI), projete o seu e conduza
a turma por votação: "alerta em tudo ou só no urgente?" — funciona igual.

---

## Atalhos

| Tecla | Ação |
|---|---|
| `Espaço` | iniciar / pausar |
| `R` | reiniciar |
| `A` | automação ON/OFF |
| `1` `2` `3` | trocar de cenário |
| `?` | ajuda |

Botão de velocidade alterna **1x → 2x → 4x** (útil no fim da aula ou para testar rápido).

---

## Dúvidas e problemas

**O placar ficou salvo de outra turma. Como zerar?**
Abra o DevTools (`F12`) → Console → cole e pressione Enter:

```js
localStorage.removeItem('simulador.best.v1'); location.reload();
```

Para apagar também as regras ajustadas:

```js
localStorage.clear(); location.reload();
```

**O arquivo não abre em um computador da empresa.**
Algumas políticas bloqueiam arquivos locais. Nesse caso: abra em um navegador portátil (Chrome/Edge
portable no pendrive) ou projete o seu e faça a turma votar nas regras.

**As regras não mudam o resultado já processado?**
Correto — e é de propósito. Cada teste usa as regras do momento em que você clicou em
**Testar estas regras**. Mudar regra no meio não reescreve o passado (como na vida real).

**Por que dois cenários mostram alertas "à toa"?**
Porque a regra escolhida alerta demais. O modal mostra exatamente quantos e o critério afetado.

---

## Detalhes técnicos

- HTML único, CSS e JS inline. Sem build, sem dependência, sem CDN, sem telemetria.
- Estado em memória; persistência só de regras e melhores placares (`localStorage`, com `try/catch`
  para funcionar também em `file://`).
- Eventos fixos e determinísticos: todos veem o mesmo dia de trabalho.
- Motor: `gatilho → condição → ação → registro`, com trace ao vivo, fila manual, KPIs e placar.
- Testado em Chrome/Edge (desktop) e em viewport de 912×670. Em telas estreitas o layout empilha.

Se for editar o arquivo, o JavaScript está em três blocos comentados: helpers/dados/decisões,
motor de execução e interface. Os eventos de cada cenário ficam em `RAW_WHATS`, `RAW_TRI` e
`RAW_REL` — trocar esses arrays muda o "dia de trabalho" de todos.
