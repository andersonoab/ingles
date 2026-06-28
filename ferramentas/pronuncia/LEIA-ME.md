# Pronúncia aproximada — geração e refino

A pronúncia aproximada PT-BR já está gravada no campo `pronunciation` de cada
frase em `data/frases_dicionario.js` (objeto `window.DICIONARIO_JSON`). O app
carrega isso direto, sem depender de internet nem de biblioteca em runtime.

São dois estágios, ambos opcionais (o app já funciona com o que está gravado):

## 1. Offline — `gerar_pronuncia.py` (já aplicado)

Transliterador inglês → respelling à brasileira, sem dependências:

- Léxico manual das palavras mais frequentes, no estilo do projeto
  (`h→r`, `th→d`, `w→u`, vogal tônica acentuada, `-ing→in`, `-tion→shion`).
- Regras grafema→PT para a cauda longa (palavras fora do léxico).

Qualidade: alta nas frases comuns (validado contra as 12 frases-base feitas à
mão, ~7/8 idênticas); aproximada nas palavras raras. É o estágio "agora".

Rodar de novo (ex.: depois de adicionar frases):
```
python gerar_pronuncia.py        # roda a auto-validação contra as frases-base
```

## 2. Alta qualidade — `refinar_com_cmudict.py` (estágio "depois")

Usa o CMU Pronouncing Dictionary (134 mil palavras, domínio público) como fonte
palavra→fonema (ARPABET) e converte ARPABET→PT. Palavras fora do CMUdict caem
no gerador offline.

Passos:
1. Baixe 1 arquivo:
   https://github.com/cmusphinx/cmudict/raw/master/cmudict.dict
   Salve como `cmudict.dict` nesta pasta.
2. Copie `data/frases_dicionario.js` para esta pasta.
3. Rode:
   ```
   python refinar_com_cmudict.py
   ```
4. Substitua `data/frases_dicionario.js` pelo arquivo atualizado.

A tabela ARPABET→PT fica no topo de `refinar_com_cmudict.py` e é o único ponto
a ajustar se quiser calibrar o estilo (ex.: `TH` voiceless como `t` ou `f`).

## Por que não embutir a biblioteca no app

O CMUdict inteiro tem ~3-4 MB; seu corpus usa só ~1.930 palavras únicas. Então
o certo é gerar a pronúncia uma vez (build-time) e gravar no dado — o runtime
continua leve e sem dependência, fiel ao padrão single-file da PWA.
