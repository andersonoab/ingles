# -*- coding: utf-8 -*-
"""
REFINO COM CMUdict (etapa "depois", qualidade alta).

Como usar:
  1) Baixe o CMUdict (1 arquivo, dominio publico):
       https://github.com/cmusphinx/cmudict/raw/master/cmudict.dict
     Salve como  cmudict.dict  nesta mesma pasta.
  2) Coloque  frases_dicionario.js  (o gerado offline) nesta pasta.
  3) Rode:  python refinar_com_cmudict.py
  4) Saida:  frases_dicionario.js  atualizado, com pronuncia refinada.
     As palavras que NAO estiverem no CMUdict caem no gerador offline.

CMUdict mapeia palavra -> fonemas ARPABET. Aqui converto ARPABET -> respelling
PT-BR (estilo do projeto). A vogal com marca de tonica (1) recebe o acento.
"""
import re, json, os, sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from gerar_pronuncia import pronounce as pronounce_offline

CMUDICT = "cmudict.dict"
DATA = "frases_dicionario.js"

# ARPABET -> PT. Vogais tem versao tonica (acentuada) e atona.
VOGAIS = {
    "AA": ("á", "a"), "AE": ("é", "e"), "AH": ("â", "a"), "AO": ("ó", "o"),
    "AW": ("áu", "au"), "AY": ("ái", "ai"), "EH": ("é", "e"), "ER": ("ér", "er"),
    "EY": ("êi", "ei"), "IH": ("í", "i"), "IY": ("í", "i"), "OW": ("ôu", "ou"),
    "OY": ("ói", "oi"), "UH": ("ú", "u"), "UW": ("ú", "u"),
}
CONS = {
    "B": "b", "CH": "tch", "D": "d", "DH": "d", "F": "f", "G": "g",
    "HH": "r", "JH": "dj", "K": "c", "L": "l", "M": "m", "N": "n",
    "NG": "ng", "P": "p", "R": "r", "S": "s", "SH": "sh", "T": "t",
    "TH": "t", "V": "v", "W": "u", "Y": "i", "Z": "z", "ZH": "j",
}


def arpabet_to_pt(phones):
    out = []
    for ph in phones:
        m = re.match(r"([A-Z]+)(\d?)", ph)
        if not m:
            continue
        base, stress = m.group(1), m.group(2)
        if base in VOGAIS:
            out.append(VOGAIS[base][0] if stress == "1" else VOGAIS[base][1])
        elif base in CONS:
            out.append(CONS[base])
    return "".join(out)


def carregar_cmudict(path):
    lex = {}
    with open(path, encoding="utf-8") as f:
        for line in f:
            line = line.split("#")[0].strip()
            if not line:
                continue
            parts = line.split()
            word = parts[0].lower()
            word = re.sub(r"\(\d+\)$", "", word)  # variantes word(2)
            if word in lex:
                continue  # mantem a 1a pronuncia
            lex[word] = parts[1:]
    return lex


def pronounce_cmu(sentence, lex):
    palavras = re.findall(r"[A-Za-z]+(?:'[A-Za-z]+)?", sentence)
    saida = []
    for w in palavras:
        low = w.lower()
        if low in lex:
            saida.append(arpabet_to_pt(lex[low]))
        else:
            saida.append(pronounce_offline(w))  # fallback offline
    res = " ".join(saida)
    return res[:1].upper() + res[1:] if res else res


def main():
    if not os.path.exists(CMUDICT):
        print("Arquivo cmudict.dict nao encontrado.")
        print("Baixe em: https://github.com/cmusphinx/cmudict/raw/master/cmudict.dict")
        print("Salve como cmudict.dict nesta pasta e rode de novo.")
        return
    if not os.path.exists(DATA):
        print(f"{DATA} nao encontrado nesta pasta.")
        return

    lex = carregar_cmudict(CMUDICT)
    print(f"CMUdict carregado: {len(lex)} palavras.")

    src = open(DATA, encoding="utf-8").read()
    m = re.search(r"window\.DICIONARIO_JSON\s*=\s*(\[.*\]);", src, re.S)
    itens = json.loads(m.group(1))

    refinadas = 0
    for it in itens:
        nova = pronounce_cmu(it["en"], lex)
        if nova and nova != it.get("pronunciation"):
            it["pronunciation"] = nova
            refinadas += 1

    novo = (
        src[:m.start(1)]
        + json.dumps(itens, ensure_ascii=False, indent=0).replace("\n", "")
        + src[m.end(1):]
    )
    open(DATA, "w", encoding="utf-8").write(novo)
    print(f"Frases refinadas: {refinadas}/{len(itens)}")
    print(f"{DATA} atualizado.")


if __name__ == "__main__":
    main()
