# Brincadeiras

Extras leves para quebrar o gelo ou fechar a palestra. Nada aqui é usado nos
apps publicados — são scripts de terminal, sem dependências e sem internet.

## Oráculo Acadêmico 3000 (`aprovacao.py`)

Recebe o nome de um aluno e "prevê" se ele vai passar, com boletim fictício,
barras de progresso e veredito bem-humorado.

```bash
python aprovacao.py
python aprovacao.py --nome "Maria Silva"
python aprovacao.py --nome "João" --repetir
```

- **Determinístico:** o mesmo nome sempre gera o mesmo boletim. O "destino" é
  um hash SHA-256 do nome, não um sorteio.
- **Zero dependências:** só a biblioteca padrão do Python 3.8+.
- **Windows:** o script liga cores ANSI e UTF-8 sozinho. Se o terminal não
  colaborar, rode com `NO_COLOR=1` (PowerShell: `$env:NO_COLOR='1'`).
- **Piada para a palestra:** "o hash não sabe nada sobre o aluno — mas é
  consistente, rápido e não pede aumento. É exatamente a diferença entre uma
  regra e uma previsão de verdade."

> É uma brincadeira. Não vale nota, não vale recurso e não previu nada.

## Quiz do Destino 3000 (`quiz_aprovacao.py`)

Versão interativa: o aluno digita o nome, responde **6 perguntas sorteadas** (de
um banco de 10, com as opções embaralhadas) e recebe uma nota e um veredito.

```bash
python quiz_aprovacao.py
python quiz_aprovacao.py --nome "Maria Silva"
```

- **Cada rodada é diferente:** perguntas e ordem das opções são sorteadas.
- **A nota vem das respostas:** 0 a 3 pontos por pergunta, mais um pequeno
  "ajuste do destino" de −2 a +2 pontos.
- **Simples de editar:** para trocar ou acrescentar perguntas, basta mexer na
  lista `PERGUNTAS`; para mudar os vereditos, na lista `VEREDITOS`.
- **Sem dependências:** só a biblioteca padrão, roda offline.

> Também é brincadeira. O destino não cabe em um `if`, mas a risada cabe.

