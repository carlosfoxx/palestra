# Roteiro da palestra — Automatização de Processos na Prática

> **Formato:** 60 min (flex 45–60) · **Público:** iniciantes · **Demos:** n8n (regras) + triagem com IA · **Exercício:** oficina no Render (planos B: simulador local; C: n8n)
> Legenda: 🎤 fala · 🖥️ ação na tela · ⏱️ tempo · 🅿️ plano B
> Falas em bloco de citação são sugestões — adapte ao seu jeito de falar.

---

## 0:00–0:05 · Abertura e provocação

🎤 **Fala de abertura (30 s):**

> "Bom dia. Antes de eu falar de automação, eu quero fazer uma pergunta honesta:
> quantas vezes essa semana você copiou um dado de um lugar para outro?
> Colou uma informação da planilha no e-mail? Mandou a mesma mensagem para dez pessoas?
>
> Não precisa responder em voz alta. Só levanta a mão quem fez isso **hoje**."

🖥️ Slide 1 (capa). Espere as mãos subirem. Comente: "Olha o tamanho disso."

🎤 **A conta que ninguém faz:**

> "Dez minutos por dia nessa brincadeira dá **44 horas por ano** — quase seis dias úteis.
> Trinta minutos por dia dá **132 horas** — mais de três semanas de trabalho.
> Você não está sem tempo. Você está com tempo agendado para tarefas que não precisam de você."

🖥️ Slide 2 (números grandes).

🎤 **Promessa da sessão (30 s):**

> "Em 50 minutos eu vou mostrar três automações reais, montar uma ao vivo, colocar uma IA para
> triar mensagens na frente de vocês, e no final **vocês vão montar a sua** — sem escrever uma linha de código.
> O que eu peço é só uma coisa: pensem numa tarefa chata da rotina de vocês. Guardem ela.
> Vamos precisar no fim."

**Transição:** "Mas antes: automação não é o que vocês estão pensando."

---

## 0:05–0:12 · O que é (e o que não é) automação

🖥️ Slide 3 (é / não é).

🎤 **Desconstruir o mito:**

> "Quando falo automação, muita gente imagina um robô com IA que pensa por você e substitui
> metade da equipe. Não é isso.
>
> Automação é mais simples e mais poderosa: é você escrever uma regra **uma vez** e o computador
> executar essa regra **sempre**, do mesmo jeito, sem esquecer, sem cansar, sem segunda-feira.
>
> IA é ótima para o que é ambíguo: entender um texto, resumir, classificar. Automação é para o que
> é determinístico: se chegou X, faça Y. As duas se completam — mas hoje o foco é a segunda."

**Frase-âncora (repita 2–3 vezes na palestra):**

> "**Se você consegue explicar a regra em uma frase, dá para automatizar.**"

🖥️ Slide 4 (anatomia).

🎤 **Os 4 blocos — peça interação:**

> "Toda automação, de uma cafeteira a um sistema de banco, tem quatro partes.
>
> **Gatilho:** o que faz começar. 'Chegou um formulário', 'deu 8 da manhã', 'entrou um pagamento'.
> **Condição:** o caminho. 'É urgente?', 'o valor é maior que 500?', 'é cliente novo?'.
> **Ação:** o que o robô faz. 'Avisa o responsável', 'grava na planilha', 'responde o cliente'.
> **Registro:** onde isso fica. Sem registro, você tem mágica — não processo.
>
> Guardem esses quatro nomes. Vou usar eles a palestra inteira — e vocês vão usar no exercício."

🎤 **Exemplo relâmpago do cotidiano:**

> "Alarme do celular: gatilho é o horário. Ação é tocar. Condição é 'só de segunda a sexta'.
> Registro é o histórico de alarmes. Vocês já automatizam coisas — só não chamam assim."

**Transição:** "Agora, três exemplos reais. Do mais complexo ao mais simples — e um deles vocês vão construir hoje."

---

## 0:12–0:21 · Três exemplos reais

### 0:12–0:15 · Case 1 — Atendimento no WhatsApp 24/7 (o mais impressionante)

🖥️ Slide 6. Se o sistema estiver rodando, mostre a tela real por 20 s — o painel vale mais que o slide.

🎤 **Problema (primeiro o problema, sempre):**

> "Uma empresa pequena recebe mensagem no WhatsApp o dia inteiro. Fora do horário, ninguém responde.
> No dia seguinte, o cliente já comprou do concorrente. E o dono nem sabe que perdeu."

🎤 **O que roda:**

> "Quando chega uma mensagem, o sistema: cria o contato, verifica se é cliente novo, consulta uma
> base de conhecimento da empresa, e responde com IA em segundos. Se o assunto precisa de humano,
> ele identifica o setor — financeiro, suporte, comercial — e transfere **com o histórico** para o
> atendente certo. O atendente entra e continua de onde a IA parou.
>
> Reparem na anatomia: **gatilho** é a mensagem. **Condição** é 'a IA sabe responder? precisa de
> humano?'. **Ação** é responder ou transferir. **Registro** é a conversa no banco."

🎤 **Resultado:**

> "Resposta em segundos, 24 horas por dia, 7 dias por semana. E Consistency: o cliente recebe a
> mesma informação correta sempre — não a resposta de quem pegou o plantão de mau humor."

💡 **Se perguntarem 'isso é seu produto?'** — seja transparente: "É um sistema que eu desenvolvi e
opera hoje. Usei como exemplo porque eu conheço os números por dentro — mas os outros dois casos são
de processos comuns, que qualquer um aqui pode replicar."

### 0:15–0:18 · Case 2 — Triagem de solicitações (o que a turma vai montar)

🖥️ Slide 7 (antes × depois).

🎤 **Narrar o antes, devagar:**

> "Chega uma solicitação no e-mail ou no grupo. Alguém lê. Decide se é urgente. Procura quem é o
> responsável. Encaminha. Esquece. Alguém cobra. Alguém anota em algum lugar — ou não anota.
>
> Dezessete minutos por solicitação, com dez solicitações por dia: quase três horas.
> E o pior não é o tempo. É que **nada garante que foi feito igual**. Uma vai para o financeiro,
> outra some no grupo."

🎤 **O depois:**

> "Formulário único. O robô lê o impacto, gera um protocolo, define o prazo, avisa o responsável em
> segundos e registra tudo. Quarenta segundos. E 100% auditável."

> "Esse é o que vocês vão montar daqui a pouco. Guardem: formulário, condição, alerta, registro."

### 0:18–0:21 · Case 3 — Relatório diário das 8h

🖥️ Slide 8.

🎤 **Curto e direto:**

> "Toda manhã alguém abre a planilha, copia os números, monta o resumo, manda para a diretoria.
> Quarenta minutos. Todo dia. Se der erro na fórmula, ninguém percebe até a reunião.
>
> Automação: às 8h em ponto, o robô lê a planilha, calcula, monta o resumo, envia e registra o envio.
> Zero minutos humanos. E se falhar, **ele avisa que falhou** — isso é a parte que quase todo mundo
> esquece e eu vou cobrar de vocês no exercício."

🎤 **Fechamento do bloco:**

> "Três casos, mesma anatomia. O que muda é a ferramenta. E é sobre ela que a gente fala agora."

---

## 0:21–0:30 · Demo ao vivo no n8n

🖥️ Slide 9 (ferramentas) — 60 s, sem se alongar.

🎤 **Por que n8n:**

> "Existem várias: Power Automate para quem vive no Microsoft 365, Make e Zapier na nuvem,
> Apps Script para planilhas. Eu escolhi o n8n para hoje por três motivos: roda no computador de
> vocês, é gratuito para testar e é visual — cada bloco é uma caixinha que vocês arrastam.
>
> E não se preocupem com a ferramenta: o raciocínio é o mesmo em todas. Quem aprende um, aprende o outro."

🖥️ Slide 10 (divisória "AO VIVO"). Abra o n8n em tela cheia.

### Roteiro da demo (8–9 min) — ensaie duas vezes

**1. O gatilho (2 min)**

🖥️ Novo workflow, nome `Triagem em 5 minutos`. Arraste o nó **On form submission**.

🎤 Enquanto configura:

> "Gatilho: formulário. Título... quatro campos: nome, e-mail, mensagem e urgência — alta ou baixa.
> Reparem que eu não estou programando. Estou **descrevendo o processo**."

Clique em **Test step** / **Execute step** e abra a URL do formulário.

**2. Simular um cliente (1 min)**

🖥️ Preencha no telão (ou peça a alguém da plateia para ditar): nome "Maria", mensagem
"Sistema caiu, não consigo emitir nota", urgência **Alta**. Envie.

🎤 "Olha o dado chegando do outro lado. O gatilho disparou."

**3. A regra (2 min)**

🖥️ Adicione **Edit Fields** (antigo "Set"): `resumo` = `{{ $json.Nome }} | {{ $json.Urgencia }} | {{ $json.Mensagem }}`.

🖥️ Adicione **If**: `Urgencia` **equals** `Alta`.

🎤 **Ponto pedagógico:**

> "O robô não decide o que é urgente. **Você** decide. Ele só obedece — sempre igual.
> É por isso que a regra precisa estar clara antes de automatizar. Regra confusa vira erro em escala."

**4. A ação (2 min)**

🖥️ Na saída **true**, adicione **HTTP Request**: método POST, URL = a do webhook.site (já aberta na
outra aba), corpo JSON com `resumo` e `recebidoEm`.

🎤 "Ação é qualquer coisa que tenha uma porta de entrada: WhatsApp, e-mail, planilha, Slack, ERP.
Aqui eu mando para uma página que mostra a requisição chegando — é o meu 'celular do gerente'."

**5. O teste que impressiona (2 min)**

🖥️ Execute o workflow. Volte para a aba do webhook.site. **Deixe o JSON aparecer no telão.**

🎤 "Do envio do formulário até aqui: segundos. Nenhuma linha de código."

🖥️ Agora envie uma solicitação com urgência **Baixa**. Mostre que **nada chega** no webhook — só o
registro no n8n.

🎤 "Urgente alerta. Não urgente entra na fila. Duas regras, um fluxo. É isso que vocês vão fazer."

🖥️ Slide 14 (resultado) para consolidar.

🅿️ **Se a internet cair:** pule para os slides 11–14 e narre pelos prints. Não peça desculpa duas
vezes — uma frase e siga.

💡 **Versão de 60 s com o simulador:** abra `simulador/index.html`, deixe rodar 5 segundos, desligue a
Automação (a fila manual cresce na tela) e ligue de novo (a fila drena em segundos). É a mesma lição
da demo — com zero dependência de rede.

**Transição:** "Isso é o que a regra resolve. Agora a parte que a regra não resolve."

---

## 0:30–0:38 · IA ao vivo: o que a regra não resolve (8 min)

🖥️ Slide 15 (divisória): **"Regra decide o previsível. IA decide o ambíguo."**

🎤 **A virada:**

> "Tudo o que vocês viram até agora é regra: se X, então Y. Funciona lindamente para o que se repete.
> Mas a maior parte do trabalho não chega assim. Chega como mensagem de cliente: mal escrita, com
> três assuntos juntos, com um prazo escondido no meio e um tom de irritação que ninguém programou.
>
> A regra pergunta 'é urgente?'. A IA lê a mensagem e entende **o que está por trás**: o dinheiro em
> risco, o prazo que não foi dito com todas as letras, o cliente que já pagou e está perdendo a paciência.
>
> E o mais importante: a IA **não responde sozinha**. Ela prepara a resposta, mostra a confiança e
> deixa a decisão para uma pessoa. Regra para o previsível, IA para o ambíguo, humano para o que importa."

🖥️ Slide 16 (a conta). Aponte os números, não leia a tabela.

> "Cinco pessoas gastando trinta minutos por dia nessa triagem são duas horas e meia por dia.
> Em um ano, são quase **oitenta dias úteis** de trabalho. Não é 'uma coisinha legal' — é um mês e meio
> de uma pessoa. E o custo de fazer isso com IA é uma fração de centavo por mensagem."

### A demo (6 min) — o cronômetro é o argumento

**1. A versão humana (2–3 min)**

🖥️ Abra `/demo` no seu notebook (não no telão ainda) e **inicie o cronômetro**.

🎤 Leia em voz alta a mensagem **"Pix sumiu"** e faça o trabalho na frente da turma:

> "Vou fazer o que qualquer um de vocês faz: ler, decidir se é urgente, descobrir para quem mandar e
> escrever a resposta. Podem cronometrar comigo."

Classifique em voz alta, escreva uma resposta curta e **pare o cronômetro**. Deixe o número na tela.

> "Quanto deu? Três minutos? Quatro? Agora imaginem isso vezes as mensagens de amanhã."

**2. A mesma tarefa com IA (1 min)**

🖥️ Abra `/triagem` no projetor. Volte ao `/demo` e clique em **Enviar as 5 em sequência**.

🎤 Enquanto as mensagens chegam:

> "Cinco mensagens. Reparem no relógio do telão: cada uma leva cerca de dois segundos. E não é só
> classificar — ela devolve resumo, rascunho de resposta, próximo passo e confiança."

**3. O que a IA entregou (1 min)**

🖥️ Aponte o hero da última mensagem (a "Mensagem ambígua").

> "Olha o que ela entendeu: categoria, urgência, tom, resumo em uma linha e uma resposta pronta.
> Ninguém escreveu 'se falar pix, é financeiro'. Ela leu."

**4. O momento de honestidade (1 min)**

🖥️ Aponte a barra de confiança em **32%** e o selo **revisar**.

> "Agora o slide mais importante da palestra: a mensagem ambígua. 'Me manda aquele documento' — qual
> documento? A IA não inventou. Ela deu confiança baixa e **preferiu perguntar**. Isso não é falha;
> é o que permite usar IA em trabalho de verdade. Se ela desse 95% de confiança em tudo, vocês não
> poderiam confiar em nada."

**5. A turma entra (1–2 min)**

🖥️ Slide 17 (o que ela erra) — deixe o **QR do app de IA** visível.

> "Agora é com vocês. Escaneiem o QR, escrevam uma mensagem de trabalho — de mentira, sem dado
> sensível — e mandem. A mensagem de vocês vai aparecer aqui no telão."

🖥️ Volte ao `/triagem` e deixe a fila enchendo. Comente **uma** mensagem da turma em voz alta.

🅿️ **Se a IA falhar ao vivo:** o app cai sozinho no modo regra e o badge muda. Diga: "ela trocou para o
plano B na frente de vocês — é assim que um sistema sério se comporta" e siga. A aula não trava.
🅿️ **Sem internet:** use os slides 15–17 e narre a demo pelos prints. O cronômetro pode ser feito no
celular, sem servidor.
🅿️ **Antes de começar:** no `/demo`, clique em **Limpar a demo**; se houver `DEMO_TOKEN`, cole no campo
e clique em **Usar token**.

**Transição:** "Antes de vocês colocarem a mão, cinco minutos sobre o que dá errado — inclusive com IA."

---

## 0:38–0:45 · Erros comuns e como escolher a primeira automação

🖥️ Slide 18 (5 erros). Leia só os títulos e comente 1 frase em cada. Não leia a lista inteira.

🎤 **Os dois que mais importam:**

> "Primeiro: **não automatize processo bagunçado**. Automação não conserta bagunça — ela acelera.
> Se hoje a informação vai para o lugar errado, amanhã ela vai mais rápido para o lugar errado.
>
> Segundo: **automação sem tratamento de erro é armadilha**. Se o robô falha e ninguém sabe, o
> processo morre em silêncio — e você descobre uma semana depois. Toda automação precisa de um
> caminho de 'deu errado, avisa alguém'. É a primeira coisa que eu olho num fluxo."

🖥️ Slide 19 (matriz). Peça: "Quem tem uma tarefa que é alto impacto e fácil?" — 2 respostas rápidas.

🎤 **Filtro dos 3 S:**

> "Repete? Segue regra? Se der erro, custa caro? Se as três respostas são 'sim', automatize primeiro.
> Se a regra é 'depende', ainda não é automação — é julgamento humano. E julgamento humano é o
> último lugar que a gente automatiza."

🖥️ Slide 20 (mapa em 20 min).

🎤 **O passo que todo mundo pula:**

> "Antes de abrir a ferramenta, escreva o processo em cinco passos no papel. Marque o que é regra.
> Escolha o gatilho. Defina quem é avisado quando dá erro. Rode manual por uma semana e **meça o antes**.
> Se você não mede o antes, não consegue provar o depois — e a automação vira 'uma coisa legal que a
> gente fez' em vez de resultado."

**Transição:** "Chega de teoria. Agora é com vocês."

---

## 0:45–0:55 · Exercício em duplas (10 min)

> **Qual exercício usar?** O **plano A é a oficina publicada no Render** (`oficina/`): a turma abre um
> link ou QR, cria um espaço e recebe eventos por um webhook real, com regras no servidor e placar.
> Não instala nada. O **plano B é o simulador** (`simulador/index.html`): abre com duplo clique, roda
> offline, mesmas regras e mesmo placar. O **plano C é o n8n**, para quando a sala já tem a ferramenta
> e você quer mostrar os nós reais. O raciocínio cobrado é o mesmo: gatilho → condição → ação → registro.

🖥️ Slide 21 (briefing).

🎤 **Instruções — fale devagar e repita o critério de sucesso:**

> "Em duplas, dez minutos. Abram o link que está no slide (ou o QR). Criem um espaço com o nome da
> dupla e escolham um processo: atendimento, triagem ou relatório.
>
> Missão: ajustar as regras de um processo real e ver o robô decidindo de verdade. A cada evento, o
> navegador faz um POST para o webhook do seu espaço, o servidor aplica as suas regras e devolve a
> decisão. Quem quiser ver a ação sair do servidor abre o webhook.site e cola a URL em 'destino real'.
>
> O critério de sucesso é o mesmo em qualquer versão: **o alerta tem que chegar quando importa, não
> pode chegar quando não importa — e tudo tem que ficar registrado.** Quando terminarem, cliquem em
> **Enviar o dia completo**.
>
> O guia está com vocês. Eu vou passar nas duplas. Não me chamem antes de rodar uma vez — o erro faz
> parte."

🖥️ Slide 22 (5 passos) fica no telão. Deixe o **link/QR visível** e o **painel da turma** (`/painel`)
aberto em outra aba para projetar no fim. Se estiver no simulador, deixe-o projetado e use o slide 22
só como referência.

🎤 **Enquanto circula (não fique no palco):**
- Pergunte "onde vocês estão?" em vez de "deu certo?"
- Se uma dupla travou 3+ min no mesmo ponto, sente e faça a pergunta que destrava, não a correção.
- Se uma dupla terminou cedo: peça outro processo no modal de resultado e meta de 90+.
- Se metade da sala travou no mesmo ponto (regra do webhook, escolha de regra): pare tudo, projete e
  resolva em 60 s.

🅿️ **Se a oficina no Render não abrir:** o free tier dorme após ~15 min e leva ~50 s para acordar —
recarregue e espere. Se continuar fora, troque para o `simulador/index.html`, que tem as mesmas
regras e o mesmo placar.
🅿️ **Se o n8n não abrir na máquina de alguém:** troque para o simulador ou pareie com a dupla vizinha;
ninguém fica de fora.
🅿️ **Sem internet:** o simulador continua rodando. Se nem arquivo local abrir, exercício no papel —
desenhe os 4 blocos + a regra + o "deu erro, avisa quem".

---

## 0:55–0:58 · Compartilhar

🖥️ Slide 23.

🎤 **Três perguntas, três duplas, uma resposta cada (máx. 45 s por pessoa):**

> "1. O que funcionou de primeira?
> 2. Onde vocês travaram?
> 3. Que automação da rotina de vocês fariam amanhã?"

🖥️ Se estiver na oficina, projete o **`/painel`**: o ranking se atualiza sozinho a cada 3 s. Leia dois
ou três nomes e peça a explicação da **regra**, não da nota.

🎤 **Valide o aprendizado, não o resultado:**

> "Reparem que todo mundo travou em detalhe de configuração, não no raciocínio. Isso é ótimo:
> a ferramenta se aprende em uma tarde. O raciocínio — gatilho, condição, ação, registro — é o que
> leva mais tempo. E vocês já têm."

---

## 0:58–1:00 · Desafio e fechamento

🖥️ Slide 24 (desafio 7 dias).

🎤 **Desafio:**

> "Sete dias, uma automação pequena. Escolha uma tarefa de até dez minutos que você faz toda semana.
> Mapeie a regra amanhã. Monte até quinta. Rode na sexta e meça o tempo que sobrou.
>
> Não precisa ser bonito. Precisa rodar. **Uma automação pequena que roda vale mais do que um plano
> grande que não sai do papel.**"

🖥️ Slide 25 (fechamento).

🎤 **Frase final (desacelere, faça silêncio antes):**

> "Eu vou terminar com uma frase que resume tudo o que eu acredito sobre esse assunto:
>
> **Se é repetitivo e segue uma regra, não deveria ser você fazendo.**
>
> Automação não tira o humano do processo. Ela devolve o humano para a parte que só o humano faz:
> decidir, negociar, criar, cuidar.
>
> Obrigado. Quem quiser, os arquivos e o guia estão aqui — [QR/link]. Vamos automatizar alguma coisa."

Deixe 2–3 min para perguntas. Se surgir "e o desemprego?", resposta curta: automação elimina tarefa,
não necessariamente posto — e quem sabe desenhar processos passa a valer mais, não menos.

---

## Perguntas prováveis (e respostas curtas)

| Pergunta | Resposta |
|---|---|
| "Meu processo é muito específico, dá pra automatizar?" | "Se você consegue descrever a regra em uma frase, sim. Se cada caso é um caso, ainda não — comece pelos 80% repetitivos." |
| "Preciso saber programar?" | "Para o que fizemos hoje, não. Para integrar sistemas antigos ou tratar casos complexos, um dev ajuda em 1 dia." |
| "Quanto custa?" | "n8n self-hosted: zero. Na nuvem: a partir de ~US$ 24/mês. Power Automate já vem no Microsoft 365 em muitos planos. O custo real é o tempo de mapear o processo." |
| "E a LGPD?" | "Automação não muda a regra: dado pessoal continua precisando de base legal, acesso mínimo e registro. O ponto de atenção é não espalhar dado sensível em ferramenta sem controle." |
| "Isso vai acabar com meu emprego?" | "Vai acabar com a tarefa repetitiva. Quem desenha processo e sabe usar a ferramenta fica mais valioso. O risco real é ficar fazendo à mão o que já dá para automatizar." |
| "Qual ferramenta eu escolho?" | "A que já está no ecossistema da empresa (Microsoft → Power Automate; Google → Apps Script; time técnico → n8n). Ferramenta é detalhe; processo é o difícil." |
| "E quando a IA erra?" | "Ela vai errar — por isso toda saída traz um nível de confiança e um caminho de revisão humana. Nunca use IA sem um 'quem confere isso?' definido." |
| "Quanto custa a IA?" | "Para testar, o free tier do Gemini resolve. Por mensagem, é fração de centavo. O custo real é revisão, governança e o tempo de ajustar o formato de saída." |
| "Posso mandar dado de cliente para a IA?" | "Só se a política da empresa e a LGPD permitirem. Prefira anonimizar, use provedor com contrato de tratamento e evite dado sensível no que é só demonstração." |
