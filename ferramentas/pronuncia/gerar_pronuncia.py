# -*- coding: utf-8 -*-
"""
Gerador de pronuncia aproximada (respelling a brasileira) para ingles.
Estrategia offline: lexico das palavras mais frequentes (estilo do projeto)
+ regras grafema->PT para a cauda longa. Sem dependencias externas.

O mesmo pipeline aceita, depois, um lexico vindo do CMUdict (ARPABET->PT)
para elevar a qualidade sem mudar o resto.
"""
import re

# ---------------------------------------------------------------------------
# 1) LEXICO MANUAL (alta frequencia / palavras irregulares)
#    Convencoes do projeto: h->r, th(voiced)->d, th(voiceless)->t, w->u,
#    vogal tonica acentuada, -ing->in, -tion->shion.
# ---------------------------------------------------------------------------
LEXICON = {
    # funcao
    "i": "ai", "the": "dê", "to": "tchu", "you": "iu", "a": "a", "an": "an",
    "we": "uí", "it": "it", "this": "dis", "for": "fór", "me": "mi", "in": "in",
    "that": "dét", "is": "iz", "on": "ón", "can": "quén", "was": "uóz",
    "with": "uíd", "what": "uót", "let": "lét", "have": "rév", "my": "mai",
    "of": "óv", "he": "rí", "and": "end", "please": "pliz", "all": "ól",
    "see": "si", "there": "dér", "not": "nát", "be": "bi", "are": "ar",
    "just": "djâst", "they": "dêi", "could": "cud", "about": "abáut",
    "out": "áut", "now": "náu", "like": "laik", "how": "ráu", "get": "guét",
    "back": "bék", "one": "uân", "make": "meik", "would": "uúd", "know": "nôu",
    "right": "rait", "want": "uónt", "no": "nôu", "here": "rír", "send": "send",
    "some": "sâm", "up": "âp", "when": "uén", "from": "fróm", "sure": "shúr",
    "think": "tínk", "after": "áfter", "call": "cól", "made": "meid",
    "help": "rélp", "had": "réd", "been": "bin", "go": "gôu", "will": "uíl",
    "where": "uér", "at": "ét", "give": "guív", "work": "uôrk", "thank": "ténk",
    "his": "riz", "came": "queim", "as": "éz", "next": "nékst", "into": "íntchu",
    "but": "bât", "more": "mór", "by": "bai", "him": "rim", "around": "aráund",
    "if": "if", "those": "dôuz", "through": "trú", "look": "lúk", "best": "bést",
    "keep": "kip", "hope": "rôup", "come": "câm", "any": "êni", "saw": "só",
    "ready": "rédi", "built": "bilt", "very": "véri", "first": "fôrst",
    "left": "léft", "still": "stíl", "only": "ôunli", "ask": "ésk", "did": "did",
    "feel": "fíl", "talk": "tók", "sense": "séns", "agree": "agrí", "tell": "tél",
    "say": "sêi", "before": "bifór", "great": "greit", "new": "niú",
    "horse": "rórs", "kept": "képt", "real": "ríol", "maybe": "mêibi",
    "point": "póint", "better": "béter", "them": "dém", "day": "dêi",
    "start": "stárt", "got": "gát", "should": "shúd", "stop": "stóp",
    "so": "sôu", "much": "mâtch", "done": "dân", "over": "ôuver", "move": "muv",
    "find": "faind", "value": "véliu", "use": "iuz", "mind": "maind",
    "found": "fáund", "long": "lóng", "own": "ôun", "every": "évri", "two": "tu",
    "stay": "stêi", "support": "sapórt", "correct": "corékt", "bell": "bél",
    "were": "uér", "she": "shi", "college": "cólidj", "human": "riúman",
    "never": "néver", "lost": "lóst", "am": "ém", "too": "tu", "down": "dáun",
    "strong": "stróng", "fix": "fiks", "story": "stóri", "far": "fár",
    "care": "kér", "sorry": "sóri", "end": "end", "room": "rum", "miss": "mis",
    "do": "du", "your": "iór", "our": "áuer", "your's": "iórs",
    "need": "nid", "team": "tim", "data": "dêita", "check": "tchéc",
    "take": "teik", "moment": "môument", "issue": "íshu", "people": "pípol",
    "meeting": "mítin", "system": "sístem", "report": "ripórt",
    "email": "iméiu", "compliance": "compláians", "confirm": "confôrm",
    "deadline": "dédlain", "business": "bíznes", "finance": "fáinens",
    "forward": "fóruord", "understand": "ândersténd", "review": "riviú",
    "operations": "operêishons", "together": "tuguéder", "minute": "mínit",
    "update": "âpdeit", "process": "próuses", "decision": "disíjon",
    "question": "quéstchion", "models": "mádels", "performance": "perfórmans",
    "accuracy": "ékiurasi", "available": "avéilabol", "became": "biqueim",
    "table": "têibol", "plan": "plén", "quick": "quík", "good": "gúd",
    "things": "tíngs", "thing": "tín", "everything": "êvritín",
    "looking": "lúkin", "working": "uôrkin", "going": "gôuin",
    "reporting": "ripórtin", "supported": "sapórtid", "improved": "imprúvd",
    "handled": "rândeld", "worked": "uôrkt", "walked": "uókt",
    "managed": "ménedjd", "started": "stártid", "wanted": "uóntid",
    "helped": "rélpt", "stayed": "steid", "reviewed": "riviúd",
    "reduced": "ridiúst", "updated": "âpdeitid", "focused": "fôucast",
    "belongs": "bilóngz", "knocked": "nókt", "ensured": "enshúrd",
    "aligned": "alaind", "appreciate": "apríshieit", "felt": "félt",
    "value": "véliu", "operational": "operéishonal", "across": "acrós",
    "life": "laif", "way": "uêi", "again": "aguén", "hold": "rôuld",
    "follow": "fólôu", "makes": "meiks", "teams": "tims", "days": "dêiz",
    "systems": "sístems", "others": "âders", "employee": "emploií",
    "file": "faiou", "hr": "êitch ár", "payroll": "pêiroul", "money": "mâni",
    "time": "taim", "today": "tchudêi", "later": "lêiter", "give": "guív",
    "learn": "lêrn", "learning": "lêrnin", "english": "Ínglish",
    "under": "ânder", "bus": "bâs", "repeat": "ripít",
    # contracoes
    "i'm": "aim", "don't": "dont", "it's": "its", "i'll": "ail",
    "can't": "ként", "didn't": "dídent", "that's": "déts", "let's": "léts",
    "i've": "aiv", "we're": "uír", "you're": "iór", "he's": "riz",
    "she's": "shiz", "they're": "dér", "isn't": "ízent", "won't": "uont",
    "we'll": "uíl", "i'd": "aid", "you'll": "iúl", "they'll": "dêil",
    "wasn't": "uózent", "doesn't": "dâzent", "wouldn't": "uúdent",
    "couldn't": "cúdent", "there's": "dérs", "what's": "uóts",
    "who's": "rúz", "haven't": "révent", "aren't": "arent",
}

# ---------------------------------------------------------------------------
# 2) REGRAS GRAFEMA->PT (fallback para palavras fora do lexico)
#    Ordem importa: digrafos antes de letras isoladas.
# ---------------------------------------------------------------------------
DIGRAPHS = [
    ("tion", "shion"), ("sion", "jon"), ("ough", "óf"), ("augh", "áf"),
    ("eigh", "êi"), ("igh", "ai"), ("tch", "tch"), ("dge", "dj"),
    ("ck", "c"), ("qu", "qu"), ("ph", "f"), ("sh", "sh"), ("ch", "tch"),
    ("th", "d"), ("wh", "u"), ("ng", "ng"), ("ear", "êr"), ("eer", "ír"),
    ("ee", "i"), ("ea", "i"),
    ("oo", "u"), ("ou", "au"), ("ow", "au"), ("ay", "êi"), ("ai", "êi"),
    ("oa", "ôu"), ("oy", "ói"), ("oi", "ói"), ("ey", "i"), ("ie", "ai"),
    ("ar", "ar"), ("er", "er"), ("ir", "ôr"), ("or", "ór"), ("ur", "ôr"),
    ("oW", "ôu"),
]
SINGLE = {
    "a": "é", "e": "é", "i": "i", "o": "ó", "u": "â",
    "y": "i", "w": "u", "h": "r", "c": "c", "g": "g", "j": "dj",
    "x": "ks", "z": "z", "q": "qu", "r": "r", "v": "v",
    "b": "b", "d": "d", "f": "f", "k": "c", "l": "l", "m": "m",
    "n": "n", "p": "p", "s": "s", "t": "t",
}


def respell_rules(word):
    w = word.lower()
    # 'e' final mudo (make, time) -> remove mas marca vogal longa antes
    silent_e = len(w) > 2 and w.endswith("e") and w[-2] not in "aeiou"
    if silent_e:
        w = w[:-1]
    out = []
    i = 0
    while i < len(w):
        matched = False
        for dig, rep in DIGRAPHS:
            if w[i:i + len(dig)] == dig:
                out.append(rep)
                i += len(dig)
                matched = True
                break
        if matched:
            continue
        ch = w[i]
        out.append(SINGLE.get(ch, ch))
        i += 1
    res = "".join(out)
    # -ing -> in (apos transliterar o radical normalmente)
    if word.lower().endswith("ing"):
        res = re.sub(r"in(?:g)?$", "in", res)
    return res


def respell_word(token):
    low = token.lower()
    if low in LEXICON:
        return LEXICON[low]
    # plurais/regulares simples derivados do lexico
    if low.endswith("s") and low[:-1] in LEXICON:
        base = LEXICON[low[:-1]]
        return base + ("s" if base[-1] not in "sz" else "is")
    if low.endswith("ing") and low[:-3] in LEXICON:
        return LEXICON[low[:-3]].rstrip("e") + "in"
    if low.endswith("ed") and low[:-2] in LEXICON:
        return LEXICON[low[:-2]] + "d"
    return respell_rules(token)


WORD_RE = re.compile(r"[A-Za-z]+(?:'[A-Za-z]+)?")


def pronounce(sentence):
    sentence = sentence.replace("\u2019", "'").replace("\u2018", "'")
    parts = []
    for m in WORD_RE.finditer(sentence):
        parts.append(respell_word(m.group(0)))
    res = " ".join(parts)
    return res[:1].upper() + res[1:] if res else res


if __name__ == "__main__":
    # validacao rapida contra as 12 frases-base feitas a mao
    testes = [
        ("I want to talk to you.", "Ai uónt tchu tók tchu iu"),
        ("They stay under overpasses.", "Dêi stei ânder ôuverpéssis"),
        ("I am learning English.", "Ai ém lêrnin Ínglish"),
        ("Can you repeat, please?", "Quén iu ripít pliz"),
        ("I need to send the report today.", "Ai nid tchu send dê ripórt tchudêi"),
        ("I have a question.", "Ai rév a quéstchion"),
        ("I work with payroll.", "Ai uôrk uíd pêiroul"),
        ("I need to take the bus.", "Ai nid tchu teik dê bâs"),
    ]
    for en, esperado in testes:
        print(f"EN : {en}")
        print(f"MEU: {pronounce(en)}")
        print(f"MÃO: {esperado}")
        print()
