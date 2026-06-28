# Lousa da Fluência — Ponte PT + EN (v9)

Aplicativo leve para treinar **fala em inglês** voltado a brasileiros. Single-file
em JavaScript puro, roda em GitHub Pages, como PWA instalável e até abrindo o
`index.html` direto do disco (`file://`). Sem framework, sem build, sem servidor.

## Ideia central: o erro vira ponte

A frase errada ou misturada não é descartada — ela vira a ponte entre o português
e o inglês natural. Cada frase é treinada em cinco etapas, reveladas de forma
progressiva (o inglês natural só aparece quando você decide conferir):

1. erro real do aluno;
2. português claro;
3. frase português/inglês (a ponte);
4. blocos de fala;
5. inglês natural.

Exemplo:

- Erro real: `I want falar with you.`
- Português: `Eu quero falar com você.`
- Ponte: `I want falar with you.`
- Inglês natural: `I want to talk to you.`
- Pronúncia aproximada: `Ai uónt tchu tók tchu iu`

## Funções principais

- Lousa principal por etapas, com revelação progressiva do inglês.
- Autoavaliação **Acertei / Quase / Errei**, com auto-avanço cancelável.
- Pronúncia aproximada PT-BR em **todas** as frases (ver seção própria).
- Áudio: ouvir inglês, ouvir devagar, leitura guiada e treino de fala por voz.
- Treino de fala com reconhecimento e **diferença palavra a palavra** (verde =
  acertou, riscado = faltou).
- Dicionário embutido com mais de 2.000 frases, com pronúncia já gravada.
- Importação de TXT no padrão `English | Português` e de JSON.
- Glossário com busca, criação de frases próprias e banco de erros.
- Progresso salvo no navegador, com **exportar e importar** progresso.
- Barra de progresso por trilha.
- PWA instalável para GitHub Pages.

## Modo caminhada e recursos de áudio

- Modo caminhada com leitura contínua e tema escuro.
- Tentativa de Wake Lock para manter a tela ativa.
- Áudio silencioso de apoio para reduzir pausa/suspensão em alguns navegadores.
- Retomada do `speechSynthesis` quando o navegador pausa a fala.
- Leitura guiada: inglês natural, inglês devagar, português, ponte e inglês final.
- Tocar palavra, bloco ou frase ao passar o mouse, tocar na tela ou pressionar
  Enter/Espaço sobre o item.

## Atalhos de teclado

Funcionam quando o foco não está em um campo de texto:

- `Espaço`: ouvir o inglês
- `S`: ouvir devagar
- `1` / `2` / `3`: Acertei / Quase / Errei
- `N`: nova frase
- `R`: revisar
- `F`: favoritar
- `E`: revelar o inglês
- `P`: treinar a fala

## Acessibilidade e usabilidade (v9)

- Região `aria-live` que anuncia o resultado da autoavaliação e da fala.
- Notificações por toast no lugar de `alert`/`confirm` bloqueantes.
- Foco movido para o título ao trocar de frase.
- Botões de ícone com `aria-label` e estado (`aria-pressed`, `aria-current`).
- Respeito a `prefers-reduced-motion`.
- Cabeçalho que recolhe ao rolar no celular.
- Onboarding leve e dispensável na primeira execução.

## Pronúncia aproximada

A pronúncia aproximada (respelling à brasileira, no estilo `Ai uónt tchu tók tchu
iu`) fica gravada no campo `pronunciation` de cada frase, em
`data/frases_dicionario.js` (objeto `window.DICIONARIO_JSON`). O app lê isso
direto: nada é calculado em runtime e nenhuma biblioteca é embarcada, mantendo a
PWA leve.

A geração tem dois estágios, ambos opcionais (o app já vem com a pronúncia
gravada). Os scripts estão em `ferramentas/pronuncia/`:

- **Offline (aplicado):** `gerar_pronuncia.py` transliterador inglês→PT com léxico
  das palavras mais frequentes mais regras grafema→PT, sem dependências. Boa
  qualidade nas frases comuns; aproximada nas palavras raras.
- **Alta qualidade (opcional):** `refinar_com_cmudict.py` usa o CMU Pronouncing
  Dictionary (134 mil palavras, domínio público) como fonte palavra→fonema
  (ARPABET) e converte ARPABET→PT, caindo no offline para palavras fora do
  dicionário. Instruções no `ferramentas/pronuncia/LEIA-ME.md`.

## Formato dos dados

- **Frases-base** (`data/frases.json` e `window.FRASES_BASE`): objetos ricos com
  `en`, `pt`, `mix`, `error`, `blocks`, `pronunciation`, `usage`, `tip`.
- **Dicionário** (`window.DICIONARIO_JSON`): lista de objetos
  `{ en, pt, pronunciation }`. A ponte, os blocos e a trilha são inferidos ao
  carregar.
- **Importação manual**: TXT com uma frase por linha no padrão
  `English | Português`, ou JSON (lista de frases ou objeto com a chave
  `phrases` / `customPhrases`).

## Estrutura de arquivos

- `index.html`: estrutura da aplicação.
- `style.css`: visual, modo caminhada e componentes de UX.
- `app.js`: lógica da lousa, dicionário, fala, pronúncia e progresso.
- `data/frases.json`: frases-base do método ponte.
- `data/frases_dicionario.js`: dicionário embutido com pronúncia (à prova de `file://`).
- `data/frases_dicionario.txt`: dicionário em texto (origem histórica; não usado
  quando o JSON embutido existe).
- `ferramentas/pronuncia/`: scripts e instruções de geração da pronúncia.
- `sw.js`: service worker.
- `manifest.webmanifest`: PWA.

## Como rodar

- **Local rápido:** abrir o `index.html` direto no navegador (`file://`). O
  dicionário embutido garante que tudo funcione offline.
- **Servidor local:** `python -m http.server` na raiz e abrir `http://localhost:8000`.
- **GitHub Pages:** subir os arquivos na raiz do repositório e habilitar em
  `Settings > Pages > Branch main > /root`.

## Notas técnicas

- Estado persistido em `localStorage` (progresso, erros, frases próprias,
  dicionário importado, preferências).
- `dedupePhrases` mantém a primeira ocorrência por chave, então as frases-base
  vencem duplicatas do dicionário.
- O service worker é network-first; o nome do cache é versionado para forçar
  re-cache a cada atualização de assets.
