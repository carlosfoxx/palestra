#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Quiz do destino — brincadeira de palestra.

O aluno digita o nome, responde 6 perguntas sorteadas e recebe um veredito
fictício no final. Não usa IA, não usa internet e não vale nota.

Uso:
    python quiz_aprovacao.py
    python quiz_aprovacao.py --nome "Maria Silva"
"""

import argparse
import hashlib
import os
import random
import sys


# ---------------------------------------------------------------- console


def preparar_console() -> None:
    """Deixa o terminal pronto para acentos, emojis e cores no Windows."""
    if os.name == "nt":
        try:
            import ctypes

            kernel32 = ctypes.windll.kernel32
            handle = kernel32.GetStdHandle(-11)  # STD_OUTPUT_HANDLE
            modo = ctypes.c_uint32()
            if kernel32.GetConsoleMode(handle, ctypes.byref(modo)):
                # ENABLE_VIRTUAL_TERMINAL_PROCESSING
                kernel32.SetConsoleMode(handle, modo.value | 0x0004)
        except Exception:
            pass

    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass


def suporta(texto: str) -> bool:
    """Diz se o terminal consegue escrever estes caracteres."""
    try:
        texto.encode(sys.stdout.encoding or "utf-8")
        return True
    except (UnicodeEncodeError, LookupError):
        return False


preparar_console()

USAR_COR = sys.stdout.isatty() and "NO_COLOR" not in os.environ
UNICODE_OK = suporta("─═│")
EMOJI_OK = suporta("🎓🏆✅🫠📚😬☎️")

VERDE = "\033[92m"
AMARELO = "\033[93m"
VERMELHO = "\033[91m"
AZUL = "\033[96m"
NEGRITO = "\033[1m"
FRACO = "\033[2m"
RESET = "\033[0m"

LINHA = "─" if UNICODE_OK else "-"


def colorir(texto: str, cor: str) -> str:
    if not USAR_COR:
        return texto
    return f"{cor}{texto}{RESET}"


def titulo(texto: str) -> None:
    print()
    print(colorir("  " + LINHA * 56, FRACO))
    print(colorir(f"  {texto}", NEGRITO))
    print(colorir("  " + LINHA * 56, FRACO))
    print()


# ---------------------------------------------------------------- perguntas


PERGUNTAS = [
    {
        "texto": "Você estudou para a prova. Como?",
        "opcoes": [
            ("Com antecedência, fazendo resumo", 3),
            ("Na véspera, com café e desespero", 2),
            ("Li o título dos slides", 1),
            ("Prova? Que prova?", 0),
        ],
    },
    {
        "texto": "O trabalho era em grupo. O que você fez?",
        "opcoes": [
            ("Fiz minha parte e ainda ajudei os outros", 3),
            ("Fiz exatamente a minha parte", 2),
            ("Fiz o grupo inteiro na madrugada", 1),
            ("Só coloquei o nome no arquivo", 0),
        ],
    },
    {
        "texto": "A aula começa às 19h. Você chega:",
        "opcoes": [
            ("18h50, com o caderno aberto", 3),
            ("19h05, disfarçando", 2),
            ("19h40, na cara de pau", 1),
            ("No intervalo, perguntando o que perdi", 0),
        ],
    },
    {
        "texto": "O professor pergunta se há dúvidas. Você:",
        "opcoes": [
            ("Pergunta sem medo", 3),
            ("Finge que entendeu", 2),
            ("Olha para o teto", 1),
            ("Acorda assustado", 0),
        ],
    },
    {
        "texto": "O prazo era sexta-feira. Você entregou:",
        "opcoes": [
            ("Quinta, com folga", 3),
            ("Sexta às 23h59", 2),
            ("Sábado, com pedido de desculpas", 1),
            ("Não entreguei, mas mandei um meme", 0),
        ],
    },
    {
        "texto": "Na véspera da prova, seu celular:",
        "opcoes": [
            ("Fica longe, no modo avião", 3),
            ("Só serve de despertador", 2),
            ("Dou uma olhada rápida nas redes", 1),
            ("Vira uma maratona de vídeos", 0),
        ],
    },
    {
        "texto": "Como você anota a matéria?",
        "opcoes": [
            ("Faço meu próprio resumo", 3),
            ("Fotografo o quadro", 2),
            ("Fotografo o caderno do colega", 1),
            ("Confio na memória", 0),
        ],
    },
    {
        "texto": "Saiu uma nota baixa. O que você faz?",
        "opcoes": [
            ("Pede revisão e estudo mais", 3),
            ("Estudo para a próxima", 2),
            ("Reclamo no grupo da turma", 1),
            ("Abro recurso alegando perseguição", 0),
        ],
    },
    {
        "texto": "Biblioteca, para você, é:",
        "opcoes": [
            ("Meu segundo lar", 3),
            ("Um lugar de silêncio", 2),
            ("Um lugar com Wi-Fi", 1),
            ("Existe uma na faculdade?", 0),
        ],
    },
    {
        "texto": "Seu caderno no fim do semestre:",
        "opcoes": [
            ("Organizado por aula e data", 3),
            ("Algumas folhas soltas", 2),
            ("Quase em branco", 1),
            ("Perdido desde março", 0),
        ],
    },
]

TOTAL_PERGUNTAS = 6
MAX_PONTOS = TOTAL_PERGUNTAS * 3


# ---------------------------------------------------------------- vereditos


VEREDITOS = [
    (
        9.0,
        "APROVADO COM LOUVOR",
        "🏆",
        VERDE,
        "A banca queria te contratar, mas você ainda tem que terminar o curso.",
    ),
    (
        7.5,
        "APROVADO",
        "✅",
        VERDE,
        "Passou sem sustos. Pode comemorar, mas leve o caderno por garantia.",
    ),
    (
        6.0,
        "APROVADO NO SUFOCO",
        "🫠",
        AMARELO,
        "Passou. O histórico escolar vai lembrar; você, talvez não.",
    ),
    (
        4.5,
        "RECUPERAÇÃO",
        "📚",
        AMARELO,
        "Nos vemos em janeiro. Traga café, caneta e uma relação nova com a matéria.",
    ),
    (
        3.5,
        "REPROVADO, MAS CABE RECURSO",
        "😬",
        VERMELHO,
        "A banca foi generosa: em vez de zero, te deu uma segunda chance de argumentar.",
    ),
    (
        0.0,
        "A BANCA QUER CONVERSAR",
        "☎️",
        AZUL,
        "Não é sobre a nota. É sobre o que aconteceu naquela prova. Leve os slides.",
    ),
]

OBSERVACOES = [
    "A banca levou quatro minutos para decidir. O café esfriou.",
    "O professor suspirou duas vezes. Uma delas foi de esperança.",
    "A ata da reunião tem uma frase que começa com 'apesar de tudo'.",
    "Alguém na sala disse 'ele tem potencial'. Ninguém sabe quem.",
    "A nota foi calculada, recontada e conferida por três estagiários.",
    "O sistema travou na hora de registrar. A banca entendeu como um sinal.",
]


# ---------------------------------------------------------------- o quiz


def perguntar_nome() -> str:
    while True:
        nome = input("  Seu nome: ").strip()
        if nome:
            return nome
        print("  O destino precisa de um nome. Tente de novo.")


def fazer_pergunta(numero: int, pergunta: dict, rng: random.Random):
    """Mostra a pergunta, embaralha as opções e devolve (texto, pontos)."""
    print(f"  {numero}. {pergunta['texto']}")
    opcoes = pergunta["opcoes"][:]
    rng.shuffle(opcoes)
    for indice, (texto, _) in enumerate(opcoes, 1):
        print(f"     {indice}) {texto}")

    while True:
        resposta = input("  Sua resposta: ").strip()
        if resposta.isdigit() and 1 <= int(resposta) <= len(opcoes):
            print()
            return opcoes[int(resposta) - 1]
        print(f"  Escolha um número de 1 a {len(opcoes)}.")


def bonus_do_destino(nome: str, respostas: list) -> int:
    """Um pequeno empurrão do destino, estável para o mesmo nome e respostas."""
    material = nome.strip().lower() + "|" + "|".join(str(p) for _, _, p in respostas)
    digest = hashlib.sha256(material.encode("utf-8")).digest()
    return digest[0] % 5 - 2  # -2 a +2


def calcular_nota(total: int) -> float:
    return round(3 + (total / MAX_PONTOS) * 7, 1)


def veredito_para(nota: float):
    return next(v for v in VEREDITOS if nota >= v[0])


def main() -> None:
    parser = argparse.ArgumentParser(description="Quiz do destino: você vai passar? Brincadeira.")
    parser.add_argument("--nome", help="pula a pergunta do nome")
    args = parser.parse_args()

    titulo("🎓  QUIZ DO DESTINO 3000" if EMOJI_OK else "QUIZ DO DESTINO 3000")
    print("  Seis perguntas aleatórias. Um veredito. Zero valor acadêmico.")
    print("  Não vale nota, não vale recurso e não previu nada.")
    print()

    nome = args.nome.strip() if args.nome else perguntar_nome()
    if not nome:
        nome = perguntar_nome()

    print()
    print(f"  Prazer, {nome}. A banca está reunida. Vamos começar.")
    print()

    rng = random.Random()
    perguntas = rng.sample(PERGUNTAS, TOTAL_PERGUNTAS)
    respostas = []

    for numero, pergunta in enumerate(perguntas, 1):
        respostas.append((pergunta, *fazer_pergunta(numero, pergunta, rng)))

    soma = sum(pontos for _, _, pontos in respostas)
    bonus = bonus_do_destino(nome, respostas)
    total = max(0, min(MAX_PONTOS, soma + bonus))
    nota = calcular_nota(total)
    _, titulo_veredito, emoji, cor, fala = veredito_para(nota)

    print()
    print(colorir(f"  RESULTADO OFICIAL — {nome.upper()}", NEGRITO))
    print(colorir("  " + LINHA * 56, FRACO))
    for pergunta, resposta, pontos in respostas:
        print(f"  • {pergunta['texto']}")
        print(f"    → {resposta}  ({pontos}/3)")
    print()
    print(f"  Pontos das respostas: {soma}/{MAX_PONTOS}")
    sinal = "+" if bonus >= 0 else ""
    print(f"  Ajuste do destino:    {sinal}{bonus}")
    print(f"  Nota final:           {colorir(f'{nota:.1f}/10', NEGRITO)}")
    print()

    emoji_txt = f"{emoji}  " if EMOJI_OK else ""
    print("  " + colorir(f"{emoji_txt}{titulo_veredito}", cor + NEGRITO))
    print("     " + fala)
    print()
    print(colorir("  Obs. da banca: " + rng.choice(OBSERVACOES), FRACO))
    print()
    print(colorir("  Rode de novo: as perguntas mudam. O destino, talvez.", FRACO))
    print()


if __name__ == "__main__":
    try:
        main()
    except (KeyboardInterrupt, EOFError):
        print("\n  A banca encerrou a sessão. Boa sorte na vida real.\n")
