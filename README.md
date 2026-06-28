# Lousa da Fluência — Ponte PT + EN v9

Projeto para GitHub Pages com foco em fala para brasileiros.

## Ideia central

A frase errada ou misturada não é descartada. Ela vira ponte:

1. erro real do aluno;
2. português claro;
3. frase português/inglês;
4. blocos de fala;
5. inglês natural.

Exemplo:

- Erro real: `I want falar with you.`
- Português: `Eu quero falar com você.`
- Ponte: `I want falar with you.`
- Inglês natural: `I want to talk to you.`

## Funções principais

- Lousa principal por etapas.
- Dicionário importado do projeto antigo `aprenderIngles`.
- Leitura de TXT no padrão `English | Português`.
- Importação JSON.
- Glossário com busca.
- Frases personalizadas.
- Erros capturados e transformados em frases.
- Progresso salvo no navegador.
- PWA simples para GitHub Pages.

## Funções restauradas da lousa original

A v9 consolida o que existia no projeto original e no v8:

- Modo caminhada com leitura contínua.
- Tentativa de Wake Lock para manter a tela ativa.
- Áudio silencioso de apoio para reduzir pausa/suspensão em alguns navegadores.
- Resumer do `speechSynthesis` para retomar fala pausada pelo navegador.
- Leitura guiada: inglês natural, inglês devagar, português, frase ponte e inglês final.
- Modo escuro visual durante caminhada.
- Tocar palavra, bloco ou frase ao passar o mouse, tocar na tela ou pressionar Enter/Espaço.

## Arquivos importantes

- `index.html`: estrutura da aplicação.
- `style.css`: visual e modo caminhada.
- `app.js`: lógica da lousa, dicionário, fala e progresso.
- `data/frases.json`: frases base do método ponte.
- `data/frases_dicionario.txt`: dicionário importado do projeto antigo.
- `data/frases_dicionario.js`: versão embutida para funcionar mesmo em `file://`.
- `sw.js`: service worker.
- `manifest.webmanifest`: PWA.

## Publicação no GitHub Pages

Suba todos os arquivos na raiz do repositório e habilite:

Settings > Pages > Branch `main` > `/root`.

