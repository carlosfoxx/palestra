#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Adivinha se o aluno vai passar — brincadeira de palestra.

O resultado é determinístico: o mesmo nome sempre recebe a mesma sentença.
Não usa IA, não usa banco, não usa internet. É só um hash bem-humorado.

Uso:
    python aprovacao.py
    python aprovacao.py --nome "Maria Silva"
    python aprovacao.py --nome "João" --repetir
"""

import argparse
import hashlib
import os
import re
import sys
import textwrap


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
UNICODE_OK = suporta("┌─│└├┤█░")
EMOJI_OK = suporta("🎓🎉✅")


# ---------------------------------------------------------------- cores ANSI

VERDE = "\033[92m"
AMARELO = "\033[93m"
VERMELHO = "\033[91m"
AZUL = "\033[96m"
NEGRITO = "\033[1m"
FRACO = "\033[2m"
RESET = "\033[0m"

if UNICODE_OK:
    CAIXA = {
        "tl": "┌", "tr": "┐", "bl": "└", "br": "┘",
        "h": "─", "v": "│", "ml": "├", "mr": "┤",
        "cheio": "█", "vazio": "░",
    }
else:
    CAIXA = {
        "tl": "+", "tr": "+", "bl": "+", "br": "+",
        "h": "-", "v": "|", "ml": "+", "mr": "+",
        "cheio": "#", "vazio": ".",
    }


def colorir(texto: str, cor: str) -> str:
    if not USAR_COR:
        return texto
    return f"{cor}{texto}{RESET}"


# ---------------------------------------------------------------- o "modelo"

VEREDITOS = [
    {
        "minimo": 8.5,
        "titulo": "APROVADO COM FOLGA",
        "emoji": "🎉",
        "cor": VERDE,
        "fala": "Pode rasgar o rascunho. O professor já está pensando em te convidar para monitoria.",
    },
    {
        "minimo": 7.0,
        "titulo": "APROVADO",
        "emoji": "✅",
        "cor": VERDE,
        "fala": "Passou. Não foi lendário, mas ninguém vai perguntar a nota no churrasco.",
    },
    {
        "minimo": 6.0,
        "titulo": "APROVADO POR UM FIO",
        "emoji": "🫠",
        "cor": AMARELO,
        "fala": "Faltou pouco para a recuperação. Respire fundo e agradeça àquele trabalho entregue às 23h59.",
    },
    {
        "minimo": 5.0,
        "titulo": "RECUPERAÇÃO",
        "emoji": "📚",
        "cor": AMARELO,
        "fala": "Nos vemos em janeiro. Traga café, caneta e uma relação nova com a matéria.",
    },
    {
        "minimo": 4.0,
        "titulo": "REPROVADO POR 0,1",
        "emoji": "😬",
        "cor": VERMELHO,
        "fala": "A banca reuniu, discutiu e decidiu: faltou participar da aula. Só isso. Nada pessoal.",
    },
    {
        "minimo": 0.0,
        "titulo": "A BANCA VAI TE LIGAR",
        "emoji": "☎️",
        "cor": AZUL,
        "fala": "Nota histórica. A coordenação quer conversar pessoalmente — leve os slides, todos eles.",
    },
]


def hash_do_nome(nome: str) -> int:
    """Devolve um número estável de 0 a 100 para o nome."""
    limpo = " ".join(nome.strip().lower().split())
    digest = hashlib.sha256(limpo.encode("utf-8")).digest()
    return int.from_bytes(digest[:4], "big") % 101


def calcular(nome: str) -> dict:
    """Monta o boletim fictício e determinístico do aluno."""
    semente = hash_do_nome(nome)

    # três "critérios" que somam a nota final
    presenca = 40 + (semente * 7) % 61          # 40–100
    trabalhos = 30 + (semente * 13) % 71        # 30–100
    prova = 20 + (semente * 17) % 81            # 20–100

    nota = round((presenca * 0.5 + trabalhos * 0.3 + prova * 0.2) / 10, 1)
    nota = min(10.0, nota)

    # o veredito sai da mesma nota, para o boletim não se contradizer
    veredito = next(v for v in VEREDITOS if nota >= v["minimo"])

    return {
        "nome": nome.strip(),
        "semente": semente,
        "presenca": presenca,
        "trabalhos": trabalhos,
        "prova": prova,
        "nota": nota,
        "veredito": veredito,
    }


# ---------------------------------------------------------------- a tela


def barra(valor: int, largura: int = 22) -> str:
    cheio = round(valor / 100 * largura)
    return CAIXA["cheio"] * cheio + CAIXA["vazio"] * (largura - cheio)


def linha_caixa(conteudo: str, largura: int = 62) -> str:
    """Monta uma linha da caixa alinhada, ignorando os códigos de cor."""
    visivel = re.sub(r"\033\[[0-9;]*m", "", conteudo)
    preenchimento = max(0, largura - len(visivel))
    return colorir(CAIXA["v"], FRACO) + conteudo + " " * preenchimento + colorir(CAIXA["v"], FRACO)


def exibir(resultado: dict) -> None:
    v = resultado["veredito"]
    nome = resultado["nome"]
    nome_curto = nome.upper() if len(nome) <= 39 else nome.upper()[:38].rstrip() + "…"
    nota_txt = f"{resultado['nota']:.1f}"

    print()
    print(colorir(CAIXA["tl"] + CAIXA["h"] * 62 + CAIXA["tr"], FRACO))
    print(linha_caixa(f"  BOLETIM PROFÉTICO DE {colorir(nome_curto, NEGRITO)}"))
    print(colorir(CAIXA["ml"] + CAIXA["h"] * 62 + CAIXA["mr"], FRACO))
    print(linha_caixa(f"  Presença ....... {resultado['presenca']:>3}/100  {barra(resultado['presenca'])}"))
    print(linha_caixa(f"  Trabalhos ...... {resultado['trabalhos']:>3}/100  {barra(resultado['trabalhos'])}"))
    print(linha_caixa(f"  Prova .......... {resultado['prova']:>3}/100  {barra(resultado['prova'])}"))
    print(colorir(CAIXA["ml"] + CAIXA["h"] * 62 + CAIXA["mr"], FRACO))
    print(linha_caixa(f"  Nota final ..... {colorir(nota_txt, NEGRITO)}"))
    print(colorir(CAIXA["bl"] + CAIXA["h"] * 62 + CAIXA["br"], FRACO))

    print()
    emoji = f"{v['emoji']}  " if EMOJI_OK else ""
    print("  " + colorir(f"{emoji}{v['titulo']}", v["cor"] + NEGRITO))
    for linha in textwrap.wrap(v["fala"], width=66):
        print("     " + linha)
    print()
    print(
        colorir(
            f"  (semente do destino: {resultado['semente']} — o mesmo nome dá sempre o mesmo resultado)",
            FRACO,
        )
    )
    print()


def perguntar_nome() -> str:
    while True:
        nome = input("  Nome do aluno: ").strip()
        if nome:
            return nome
        print("  Digite pelo menos um nome. O destino precisa de um alvo. 🙂")


# ---------------------------------------------------------------- principal


def main() -> None:
    parser = argparse.ArgumentParser(description="Diz se o aluno vai passar. Brincadeira.")
    parser.add_argument("--nome", help="nome do aluno (sem aspas se não tiver espaço)")
    parser.add_argument("--repetir", action="store_true", help="pergunta outro nome depois do resultado")
    args = parser.parse_args()

    print()
    emoji = "🎓  " if EMOJI_OK else ""
    print(colorir(f"  {emoji}ORÁCULO ACADÊMICO 3000", NEGRITO + AZUL))
    print(colorir("  Uma brincadeira. Não vale nota, não vale recurso e não previu nada.", FRACO))
    print()

    nome = args.nome or perguntar_nome()

    while True:
        exibir(calcular(nome))
        if not args.repetir:
            break
        nome = perguntar_nome()

    print(colorir("  Fim. Estude, porque o hash não faz prova por você.", FRACO))
    print()


if __name__ == "__main__":
    try:
        main()
    except (KeyboardInterrupt, EOFError):
        print("\n  Até a próxima. Boa sorte na vida real, que é sem hash.\n")
