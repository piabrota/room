# room

[English](README.md) · Português (Brasil)

Um site pessoal que é um quarto em 3D. Troque de plano de câmera, passe o mouse sobre as coisas
para ver o que são, ponha uma fita no videocassete para vê-la na TV e escute o quarto. Feito com
[three.js](https://threejs.org) e [Vite](https://vite.dev), em arquivos estáticos.

A ideia de um quarto assim vem de **Felix Rieseberg** (`felixrieseberg` no GitHub), que fez um
como seu site pessoal. O nome e o login dele estão escritos como texto, sem link
([`AGENTS.md`](AGENTS.md), invariante 2). Este é um trabalho à parte, com seus próprios assets,
assinatura, sons e interações ([`CREDITS.md`](CREDITS.md)).

![o quarto de noite: a parede do fundo com a mesa, a TV e a janela sobre o Rio, depois a parede da esquerda com os projetos, a da direita com o mar e a da frente com o loop e a porta, cinco segundos ou mais cada, o ponteiro passando sobre as coisas e clicando](docs/record/room.webp)

## Replay: como foi feito

O quarto foi feito a partir de prompts, num projeto do Claude, em cerca de duas horas de trabalho
de agente ao longo de um dia. Um coordenador (Claude Fable 5.1) lia cada prompt e abria uma
thread para ele; cada thread (Claude Opus 5.5, contexto de 1M, no Claude Code) fazia o trabalho e
abria o pull request. Só os prompts do dono aparecem, em inglês, com os erros de digitação corrigidos; as
respostas ficam de fora. Os dois primeiros estão em arquivos, para ler por inteiro:

- [`prompts/PROMPT_1.txt`](prompts/PROMPT_1.txt): entender o quarto de referência, começar um esqueleto
- [`prompts/PROMPT_2.txt`](prompts/PROMPT_2.txt): o repositório e suas dez invariantes ([`AGENTS.md`](AGENTS.md))

Para montar o mesmo projeto do Claude para o seu fork, sem o Claude Code CLI, siga o
[`docs/CLAUDE_PROJECT.pt-BR.md`](docs/CLAUDE_PROJECT.pt-BR.md): o nome, os repositórios, as instruções e os modelos.

Horários em UTC. "Levou" vai do prompt até o pull request ficar pronto para revisão.

| # | Prompt (UTC) | Resultado | Levou |
|---|---|---|---|
| 1 | 4 nov 21:20 | um esqueleto inicial, fora deste repositório | 7 min |
| 2 | 5 nov 14:35 | [#1](https://github.com/piabrota/room/pull/1) esqueleto, `AGENTS.md`, just e Nix | 7 min |
| 3 | 5 nov 16:51 | [#2](https://github.com/piabrota/room/pull/2) o botão LOFI/HIFI | 4 min |
| 4 | 5 nov 19:17 | o deploy em room.piabrota.art, em [piabrota/nix-os#146](https://github.com/piabrota/nix-os/pull/146) (no ar às 22:11) | 4 min |
| 5 | 5 nov 22:28 | [#3](https://github.com/piabrota/room/pull/3) a fita piabrota e `just compose`; [#4](https://github.com/piabrota/room/pull/4) movimentos suaves, pós-processamento | 11 e 22 min |
| 6 | 5 nov 22:51 | [#5](https://github.com/piabrota/room/pull/5) `just record`, a parede da direita e o teto | 17 min |
| 7 | 5 nov 23:21 | [#6](https://github.com/piabrota/room/pull/6) o quarto em 360°, a janela para o Rio, a piabrota RADIO | 50 min |
| 8 | 6 nov 00:33 | [#7](https://github.com/piabrota/room/pull/7) o orçamento próprio da rádio; [#12](https://github.com/piabrota/room/pull/12) 40 faixas na rádio em duas estações e a contagem de ouvintes, dia e noite, o botão da chuva, o slipbox, o quadro de letras, o favicon | 3 e 45 min |
| 9 | 6 nov 00:50 | este README | |
| 10 | 6 nov 01:24 | [#13](https://github.com/piabrota/room/pull/13) as configurações do projeto, em [`docs/CLAUDE_PROJECT.pt-BR.md`](docs/CLAUDE_PROJECT.pt-BR.md) | 6 min |
| 11 | 6 nov 01:40 | [#15](https://github.com/piabrota/room/pull/15) a janela larga no meio, uma porta trancada, seus pés quando você olha para baixo, madeira fotografada, um computador bege, fitas VHS com etiquetas retrô, as fitas do CV, marola.dev e ouroboric-dev, um fax, os cartões de Pirsig e do pirsig, a pasta closed source | 35 min |
| 12 | 6 nov 03:38 | [#16](https://github.com/piabrota/room/pull/16) um levantamento, [`docs/SURVEY.md`](docs/SURVEY.md): outros quartos, frameworks, animação, nossos próprios shaders, um `just record` mais rápido, a vista ▲ grid com o WW3 em triângulos, e por que o dia estoura em branco | 42 min |
| 13 | 6 nov 04:07 | [#16](https://github.com/piabrota/room/pull/16), segundo commit: o dia não estoura mais em branco (bloom de dia e de noite, AgX, a luminária mais fraca de dia), `just light`, um `just record` mais rápido e `just stills`, vidro de CRT na TV, poeira na luz da janela, e cinco skills do Claude em `.claude/skills/` | 26 min |
| 14 | 5 nov 23:23 | [#17](https://github.com/piabrota/room/pull/17) o LOFI como página de leitura: início, sobre, trabalho, posts em Markdown, online, assinar por RSS (feito em 6 nov) | 15 min |
| 15 | 6 nov 04:29 | [#18](https://github.com/piabrota/room/pull/18) ▲ grid, a décima vista na tecla 0: uma carta na parede que abre um mapa da costa brasileira em 22 366 triângulos, com 24 h de vento do GFS e o mar que ele levanta; a luz da TV segue a fita, chuva no vidro, folhas que balançam, Vite 6 | 52 min |
| 16 | 6 nov 05:15 | [#19](https://github.com/piabrota/room/pull/19) ▲ grid: a temperatura do mar do Copernicus Marine (OSTIA, lida do seu repositório zarr aberto) como segunda camada, e partículas que fluem para onde as ondas vão, no lugar dos traços do vento | 30 min |
| 17 | 7 nov 18:24 | [#20](https://github.com/piabrota/room/pull/20) o vídeo do README, só de noite, as quatro paredes cinco segundos ou mais cada, também como `docs/record/room.webp`; o mesmo no perfil do h0ffmann ([h0ffmann/h0ffmann#144](https://github.com/h0ffmann/h0ffmann/pull/144)) | 30 min |
| 18 | 7 nov 18:53 | [#21](https://github.com/piabrota/room/pull/21) a noite não estoura mais em branco na mesa (a luminária a 0,7 de noite, um bloom mais suave), e `scripts/blow_light.sh` (`just blow-light`), que reprova um vídeo quando um quadro estoura; o `just record` o roda. Os dois vídeos de novo no perfil ([h0ffmann/h0ffmann#145](https://github.com/h0ffmann/h0ffmann/pull/145)) | 45 min |
| 19 | 9 nov 05:50 | [#23](https://github.com/piabrota/room/pull/23) ▲ grid ocupa a janela inteira: a assinatura e os botões saem do caminho enquanto o mapa está aberto, o painel se dobra no título, na hora e na legenda (`+` para o resto), um botão ⛶ para a tela cheia, as fontes num ⓘ no canto, e a costa enquadrada ao lado do painel | 30 min |
| 20 | 9 nov 06:23 | [#24](https://github.com/piabrota/room/pull/24) um botão ♫ playlist ao lado do do rádio, e uma fita cassete no parapeito ao lado do rádio, os dois abrindo a playlist do dono no Spotify; a playlist também na lista online do LOFI | 30 min |
| 21 | 9 nov 06:50 | [#25](https://github.com/piabrota/room/pull/25) as invariantes 1, 5 e 7 deixam entrar o player do Spotify; [#26](https://github.com/piabrota/room/pull/26) a fita e o botão ♫ abrem a playlist no player do Spotify sobre a sala, as 37 faixas e seus artistas creditados no `CREDITS.md` e ao lado do player, e um "open in Spotify" que toca tudo em qualquer navegador | 25 min |
| 22 | 9 nov 11:18 | [#28](https://github.com/piabrota/room/pull/28) ▲ grid no seu próprio nome, grid.piabrota.art: lá (ou com `?grid`) a sala abre direto no mapa, e Esc ou "back to the room" entra na sala, onde o portão do som espera; servido por [piabrota/nix-os#186](https://github.com/piabrota/nix-os/pull/186) | 40 min |
| 23 | 9 nov 16:54 | [#29](https://github.com/piabrota/room/pull/29) vistas do ▲ grid: uma fileira de botões no painel do mapa (Brasil, Rio de Janeiro, Bahia, Salvador) que ajusta o mapa a cada caixa de `config.grid.presets`, suave, ou de uma vez com movimento reduzido; uma checagem das caixas; `just record-grid` para os stills e o clipe delas | 15 min |
| 24 | 9 nov 10:56 | [#27](https://github.com/piabrota/room/pull/27) uma lousa ao lado do mural das pessoas para o tyler-durden-bot, o GitHub App que resume um pull request grande: sua marca desenhada em código (a cabeça de um robô partida em duas), seu nome e uma fita zebrada que diz "work in progress"; ela leva ao pull request dele no piabrota/agents | 35 min |
| 25 | 9 nov 19:43 | [#30](https://github.com/piabrota/room/pull/30) a sala no celular: um visual `lite` para celulares, tablets e máquinas fracas (razão de pixels de no máximo 1,25, 30 quadros por segundo, sem oclusão de ambiente, mapas de sombra menores), o mar do grid e a foto do dia carregados só quando precisa (3,1 MB → 1,8 MB antes de a sala aparecer), `just mobile` para medir, e duas skills, `room-mobile` e `room-phone-test`; a fechadura de código da porta, com os quatro dígitos contados na sala; uma guarda de tela (preto no PrintScreen e enquanto a janela está fora de foco, as palavras da fechadura não selecionáveis); Nash, um gato preto que passeia do tapete à estante; o quadro grande do tyler-durden-bot na parede da frente, o retrato em pixels do dono num anel de lâmpadas vermelhas que piscam à noite (com a #27) | 55 min |
| 26 | 9 nov 21:54 | [#31](https://github.com/piabrota/room/pull/31) o quadro do tyler-durden-bot quadrado, acima da estante das obras com DOI, o retrato do dono como ele é; o plano do loop mostra a porta; a porta pede um email antes da fechadura, guardado no próprio servidor da sala (`POST /live/door`) | 60 min |
| 27 | 9 nov 22:48 | [#32](https://github.com/piabrota/room/pull/32) o Nash no computador: ele lê a sala uma vez (os triângulos dela cortados em células do chão e voxels), anda por caminhos A* arredondados em volta dos pés da mesa, da cadeira e da planta, acelerando e freando, vira antes de sair, senta onde o corpo cabe (não mais dentro do rádio ou do teclado) e pula em parábolas testadas contra a sala; no celular ele segue com a vida barata. O miado agora é de um gato de verdade, uma gravação em domínio público | 40 min |
| 28 | 9 nov 23:13 | [#33](https://github.com/piabrota/room/pull/33) um botão "lyrics" no player da playlist que diz onde estão as letras (no app do Spotify) e não mostra nenhuma, porque a sala não tem licença para elas; as faixas e os artistas da playlist lidos de novo do player do Spotify, 37 faixas e 42 artistas, no `CREDITS.md` e ao lado do player | 25 min |
| 29 | 10 nov 00:03 | [#34](https://github.com/piabrota/room/pull/34) o quarto como um apartamento antigo, em tamanho real: paredes de reboco, sanca e florão no teto, rodapé alto, janela de madeira de duas folhas num vão fundo, cortinas, taco e um tapete desenhado; 24 móveis e objetos do Poly Haven (CC0) pelo `just models`, cada um com um arquivo mais leve para o celular; fitas VHS em capas de papelão, em duas pilhas, e um videocassete para onde elas voam, em tamanho real; a noite iluminada pelas suas lâmpadas; um botão de créditos, o seu cartão e uma placa de latão que dão o nome de Felix Rieseberg; `just peek` para olhar uma mudança e contar as draw calls | 3 h 55 min |
| 30 | 10 nov 12:48 | [#36](https://github.com/piabrota/room/pull/36) o quarto abre mais rápido: nada espera mais pelos móveis (eles chegam depois do primeiro quadro, quatro arquivos por vez), os arquivos têm o tamanho do aparelho (os pequenos no celular, numa tela pequena ou numa conexão lenta), a malha do mapa da grade espera também; assim um laptop baixa 2,3 MB antes de o quarto aparecer, em vez de 9,5, e um celular 0,8 em vez de 2,6; a parede da marola pintada com listras azuis de canto a canto; a água flutuante virou um aquário, com areia, pedras, plantas, bolhas, um cardume de peixinhos e o Barramundi da Microsoft (CC0) nadando; no celular, os botões em duas fileiras que rolam sob o polegar e dicas para o dedo; três skills, `room-threejs-perf`, `room-assets` e `room-load` | 2 h 25 min |
| 31 | 10 nov 20:07 | [#37](https://github.com/piabrota/room/pull/37) a playlist agora creditada a Leonardo AL aracyla, a quem ela pertence, ao lado do player e no `CREDITS.md`; as faixas e os artistas lidos de novo do player do Spotify, 60 faixas e 63 artistas; o que toca agora ao lado do player (título, artistas, tempo, barras que dançam) e as bobinas da fita cassete girando, lidos das mensagens que o player do Spotify manda, com as capas deixadas no player do Spotify; um botão da janela que põe Copacabana ao vivo (a webcam da Homes in Rio no Posto 6, YouTube, sem som) atrás do vidro, com a esquadria na frente, e a invariante 1 aberta para isso; "how I read", dez ebooks na estante embaixo das obras com DOI, cada um uma lombada nas cores da sua capa e um link para a sua página no Leanpub | 1 h 50 min |
| 32 | 11 nov 05:24 | [#39](https://github.com/piabrota/room/pull/39) um balão d'água pendurado sobre o aquário: um clique estoura o balão e o 1,4 litro dele cai no tanque, simulado em metros e segundos (a borracha que se recolhe, a queda, a cratera, a coroa lançada para cima e deixada à gravidade, gotas com o arrasto do ar, o jato de Worthington, bolhas, os anéis de Cauchy e Poisson que voltam do vidro, o balanço lento do tanque, as boias que flutuam neles, anéis de luz na areia, os peixes assustados), com a água desenhada como uma lente que dobra uma imagem do quarto; feito por um construtor e um crítico separado que tira as próprias capturas de tela e dá nota, do jeito de um vídeo do canal AI Search, em três rodadas que tiveram 6, 5,5 e 6 de 10, e por isso não passou com 8; [O balão d'água](#o-balão-dágua) tem a física, e o que é calculado e o que é ajustado; `just record-splash` e `just peek --click` | 4 h 25 min |

**1.** [`PROMPT_1.txt`](prompts/PROMPT_1.txt)

```text
user> '[the address of Felix Rieseberg's room] Check the website of this Anthropic Engineer. It is
not something professional, is his personal website. I just want to understand structure,
frameworks, and try to build one on my own, with my assets, my signature, my sounds, my
interaction'
```

**2.** [`PROMPT_2.txt`](prompts/PROMPT_2.txt)

```text
user> 'I have added piabrota/room. Create the first PR, with AGENTS.md 10 invariants, derive
the invariants based on the first prompts (including threads). Idea must be credited to
original creator, but don't link any external repo or issue. Consider this will be tested with
macOS or Nix with just and Claude Code assistance'
```

**3.**

```text
user> 'merged, now add a LOFI HIFI button for switching between 3D rendered view vs plain text'
```

**4.**

```text
user> 'please create a new PR in piabrota/nix-os to deploy room site under piabrota.art/room
(KVM 4) or room.piabrota.art (KVM 4) as well'
```

**5.**

```text
user> 'Fix the room, the navigation between views of the room is not smooth, room design should
contain piabrota github org bot repos, names, art, inspiration. also improve tech stack to match
[the address of Felix Rieseberg's room]
https://freesound.org/people/magedu/sounds/267832/
https://freesound.org/people/klankbeeld/sounds/219877/
https://freesound.org/people/klankbeeld/sounds/174242/
https://freesound.org/people/YleArkisto/sounds/350358/

Do a sound composition to have a track to talk about piabrota, its members, my personal
projects, link to repositories. The site is very poor at the moment, it needs a lot of refinement'
```

**6.**

```text
user> 'continue improving the site, every site must have at least 3 screenshots of the
ambient, and a screen record of 15s, doing navigation and clicking on things'
```

**7.**

```text
user> 'keep improving, more originality, bring marola-dev work, ouroboric-dev work, h0ffmann
all IP'
user> 'the room must have 360 experience, other walls should reflect marola-dev, ouroboric-dev'
```

**8.**

```text
user> 'create a live listeners button, and increase the number of songs to 33 at least, if
possible another set of specific Brazilian lofi, also do the switch between lofi and hifi
views, they look opposite in the site (hifi is the 3D room). add a favicon, the same as the company
logo, check on piabrota/.github. remove the noise from the website completely (the rain sound
must be toggle, on and off). The site also lacks day and night modes (with different lights).
Records must be named slipbox and first item should be wikipedia link for pirsig, and pirsig
github repository side by side'
user> 'also add a board, on the wall with Time is a flat circle with Rust Cohle, near the
piabrota logo above the computer'
```

**9.**

```text
user> 'refactor README.md to be more in replay style, it must have direct links for
PROMPT_1.txt and PROMPT_2.txt so people can see how it was built, using which model, when, how
much it took. Thread response is not important user> 'original prompt' is enough'
user> 'for example remove DOI numbers, it's just noise, this repo should be easy to fork'
user> 'and modular, so people can use their own slang, lists, music'
user> 'Felix Rieseberg GitHub user must be cited on README.md, also create a README.pt-BR.md
version'
user> 'please solve my personal typos in README.md'
```

**10.**

```text
user> 'in a new PR dump your entire Claude Project settings, in the same way is done in other
repos like piabrota/nix-os, so people can reproduce same environment with another Claude
Project, without need of Claude Code CLI'
```

**11.**

```text
user> 'now do a big change on the scene, window should be way bigger and wider, and be central
on top of the center wall. Also textures still dont feel realistic, like real wood, real
computer, real VHS. The must be a door in the scene locked for now. the feet of the persona
must be visible when they are at the center looking down (a bit of self perspective.). Also
create a VHS for CV with my track record from h0ffmann/h0ffmann of my personal experiences. VHS
tapes must be more realistic wider (with retro fonts like marola.dev, ouroboric-dev, cv /
h0ffmann), also add a fax with my email mhoffmann [at] gmail.com and a linkedin button. Also
improve slipbox, the Robert Pirsig card must looklike realistic with reference to ZAMM, and the
other card must have a github pill for pirsig repository, technical implementation of pirsig
brain. it must also contain a file under the desk callled closed source with confidencial
letter pointing to h0ffmann/closed-source website and paper'
```

**12.**

```text
user> 'Do a survey now based on the new code and unique techniques to improve design and realism
of existing room code. This must include:
1. Check other FOSS room websites, to grab ideas with credits
2. Check other frameworks.
3. Check other animation tools to make the site more appealing
4. Create our own shaders, textures, etc.
5. How to make the development loop faster (the final recording, the video, takes about 25 min
in software)
6. How this could align to add a new view in the website, the 10th one, called ▲ grid, with a
triangular grid for the Brazilian coast, the idea of triangle grids proposed by Dr. Aaron from
NOAA, wave model physicist, and how to use WW3, with this preset grid with GFS, to be able to
play it back on the MapLibre map, in the triangular grid, with small resolution/forecast
horizon (to speed up the development cycle)
7. Fix lights blowing up to a white screen during day'
```

**13.**

```text
user> 'Now based on the opened PR add Claude skills related to the project's current tech stack
and ambitions related to docs/SURVEY.md you added. You printed the bright differences but
didn't apply them to the code. Apply all the improvements possible in one long pass, increment
the PR'
user> 'Dr. Aron Roland I meant'
```

**14.**

```text
user> 'also hifi is the sound solution, lofi is the text only with blogposts'
user> '[the address of Felix Rieseberg's room, in its reading mode] lofi version'
user> 'Home
About
Work
Posts
Online
Subscribe'
```

**15.**

```text
user> 'now do improvements left from the survey you couldn't assess earlier'
```

**16.**

```text
user> 'improve the grid
  * it must allow have temperature data using copernicus
  * instead of plain traces pointing to wave direction, it must use a flow animation, usually like the one used in wind, to get better idea of propagation direction'
```

**17.**

```text
user> 'update readme.md, the 2 vids, the first video should only show night display and all the 4
walls in the room 2 with at least 5 seconds (with same hover over the screen already exists)'
user> 'README.md of h0ffmann/h0ffmann and piabrota/room, to be clear'
```

**18.**

```text
user> 'now fix the brights in both room videos, the bright is exploding again, you should fix it
in the video, create a blow_light.sh script to detect when the video has controlled light. You
must use this script to pass (script must lives in room repository). Dont forget to update
h0ffmann/h0ffmann as well'
```

**19.**

```text
user> 'check if there any public papers for confusion swell, how to know the results of swell
combination in particular X, Y do map already plotted, also the map grid should take 100% of the
screen'
```

**20.**

```text
user> 'https://open.spotify.com/playlist/2hsuqvhCouatM8DtmKKl7U eu queria uma versão com um
botão pro meu Spotify pra essa playlist'
```

**21.**

```text
user> 'qq it wont cause any issues with spotify directly, right?'
user> 'There is any right way to do that, I would like to embed in my site'
user> 'doing proper citation of artist etc'
user> 'Visitors who aren't logged in to Spotify only hear 30-second previews. Logged-in visitors
hear the full tracks. make this work consistently on all browsers'
```

**22.**

```text
user> 'also promote grid to grid.piabrota.art
this my require a new pr'
```

**23.**

```text
user> 'https://room.piabrota.art/ the grid in the website must have presets for Rio de Janeiro,
Bahia and Salvador.'
```

**24.**

```text
user> 'add tyler-durden-bot representation in the website, add one more board in the room, with
tyler-durden bot logo in the piabrota room (work in progress)'
```

**25.**

```text
user> 'please address the mobile experience, it is terrible, super heavy, maybe on mobile we should
use less resolution'
user> 'in the same PR add a puzzle behind the door of the first space'
user> 'add skills related to mobile-3d'
user> 'in the same PR, this website should not allow printscreen, like platforms like UFC do: if
you printscreen you just get a black screen. Some texts should also not be selectable, especially
the ones related to the new section, the puzzle'
user> 'make a cat in the room, it should be a black cat called nash, just a cat, he should move
randomly (but naturally), over the things, especially the shelf, etc'
user> 'also the scene is missing a big board on the wall with the tyler-durden-bot icon, with hover'
user> 'in the scene, it should blink randomly with red lights'
user> 'durden blink should only happen at night'
```

**26.**

```text
user> 'you did not use the right image, also this square should be above the book shelf, with
the DOIs'
user> 'was mobile optimized? where is the puzzle in the room? the puzzle must be enabled on the
door, locked before. Only users submitting an email form will be able to play the game, after
the door'
```

**27.**

```text
user> 'cat collision is horrible, the cat seems to float in objects very often, you need smoother
animation (only in a real browser, not on mobile)'
user> 'also the cat sound is not realistic'
```

**28.**

```text
user> 'check if is possible to add lyrics toggle in the website'
user> 'with Flora Matos · Sain · Luccas Carlos · Akira Presidente · Bril · CHS · JXNV$ · BK · Pirâmide
Perdida · El Lif Beatz · Nectar Gang · Tyler, The Creator · Kanye West · Marina Sena ·
Çantamarta · Supercombo · Vitor Kley · Elana Dara · Preta Gil

Inaccurate, fix it. in the same lyrics pr'
```

**29.**

```text
user> 'now create a big PR to improve realism of objects, proportion, quality of assets, quality of
textures, this must look like an old fashioned apartment, a credits hover is still missing to give
credits to Felix from Anthropic. Review his site again, our quality compared to theirs is sub
poor. For example his VHS tapes have way more quality. Do these huge improvements with Fable 5.2.
No big time constraint, so you can use sub agents'
```

**30.**

```text
user> 'now optimize the site, it is taking too much to load. In the same PR the marola wall needs to
be refactored, the blue strips need to fill all the wall. Change the water floating to real
aquarium with realistic fishes. In the same PR optimize the experience for mobile users. Grab more
skills from github that you feel can help maintain this 3d complex project'
user> 'would be good if the size of the things could depend on the device of the user'
```

**31.**

```text
user> 'fix playlist ownership, Leonardo AI aracyla now owns it'
user> 'https://open.spotify.com/playlist/2hsuqvhCouatM8DtmKKl7U also update playlist text, with current cast'
user> 'in the same PR
* Add music thumbnail to site if possible
* Also add music animation in website related to the music being played on spotify'
user> 'I mean, the specific photo used by every track'
user> 'in the same PR allow users to change the window to a youtube 24/7 feed in copacabana I know exists'
user> 'https://www.youtube.com/watch?v=Bz9Hkrk1NcY'
user> 'it should be after the window, for better realism'
user> 'Leonardo AL'
user> 'in the same PR, add this to the shelf in the website, with according colors and leanpub links'
```

**32.**

```text
user> 'https://www.youtube.com/watch?v=S7lpCyZSdJQ improve the room with Fable 5.2 high using this
technique, use transcripts. It has harness instructions on how to make you draw water particles
after a boon splash'
user> 'add the details of the physics simulation in the README.md and the URL to the video link'
```

A transcrição do vídeo, colada embaixo do primeiro prompt, ficou de fora. "boon splash" foi lido
como o respingo de um balão d'água, o teste que o vídeo faz.

O endereço do quarto de referência foi tirado dos prompts: este repositório credita Felix
Rieseberg pelo nome e não linka nenhuma página dele ([`AGENTS.md`](AGENTS.md), invariante 2).

| Visão geral | Janela | Parede do mar |
|---|---|---|
| ![visão geral](docs/record/shot-overview.jpg) | ![janela](docs/record/shot-window.jpg) | ![mar](docs/record/shot-sea.jpg) |

O vídeo do topo, de noite, as quatro paredes uma a uma, com o ponteiro e os cliques: [`docs/record/room.mp4`](docs/record/room.mp4).

## O balão d'água

Um balão d'água fica pendurado sobre o aquário, na parede do mar. Clique nele e ele estoura: a
água cai no tanque e espirra. O respingo é simulado enquanto você olha, em metros e segundos, na
velocidade da água que cai de verdade ([`src/splash.js`](src/splash.js)). O clipe
[`docs/record/splash.mp4`](docs/record/splash.mp4) mostra em velocidade real, visto da parede do
mar, e depois de perto, quatro vezes mais devagar (`just record-splash`).

![o balão d'água recém-estourado: a coroa em volta da cratera, gotas no ar](docs/record/shot-splash.jpg)

### De onde vem a técnica

O jeito de trabalhar vem de [um vídeo do canal AI Search](https://www.youtube.com/watch?v=S7lpCyZSdJQ)
(YouTube), no capítulo sobre física (19:52), em que o teste é um balão d'água furado por
uma bala. Duas coisas vêm de lá: pedir que a simulação seja "as realistic and physically accurate
as possible", e ter um crítico separado que julga cada tentativa. O construtor escreve a
simulação; um crítico que não a construiu tira as próprias capturas de tela, de vários pontos de
vista e distâncias, dá uma nota de 0 a 10 ao que vê e devolve uma lista de defeitos em ordem de
gravidade; o construtor tenta de novo. Passa com 8 ou mais, e para depois de três rodadas.

Aqui o ciclo rodou as três rodadas e não passou: os críticos deram 6, 5,5 e 6 de 10. Cada
crítico era um agente novo, que não sabia nada de como o respingo é feito e tirou as próprias
capturas (216 na primeira rodada, 163 na última).

| Rodada | Física | Aparência | Geral | Os primeiros defeitos que o crítico achou | O que o construtor fez depois |
|---|---|---|---|---|---|
| 1 | 6 | 6 | 6 | as gotas eram cápsulas de vidro iguais; a coroa e o jato sumiam em vez de cair de volta; a coroa atravessava coisas sólidas; o respingo era fraco demais para a água que caiu | gotas de vários tamanhos, borradas por um obturador; a coroa cortada onde fica o vidro do tanque; anéis que voltam do vidro e um tanque que balança; manchas molhadas onde as gotas caem |
| 2 | 6 | 5,5 | 5,5 | um fantasma do balão inteiro ficava no passe de oclusão de ambiente; a coroa caía mais depressa que a gravidade e a água dela sumia; a água era uma casca colorida, não uma lente | o balão, o trapo e o enchimento como malhas de verdade; a coroa lançada para cima e deixada à gravidade, e a lâmina rasgada segue como gotas; a água dobra uma imagem do quarto |
| 3 | 6,5 | 6 | 6 | de perto, a água que afunda ficava preta por um quadro; a água do primeiro quadro mostrava o próprio balão; o trapo velho aparecia embaixo do balão novo | esses três estão corrigidos, e os peixes ficam longe por mais tempo; essas últimas correções não foram julgadas de novo |

O que o último crítico ainda achou, na ordem dele: a coroa fica em pé demais, como um copo, e
quebra em cacos e não em furos, fios e gotas; o tanque recebe 1,4 l com calma demais (a água não
sobe pelo vidro, as boias quase não são empurradas); a água que cai é lisa demais e entra como um
sólido; a cratera parece porcelana vista de baixo; há pouco ar e pouca espuma; o jato é certinho
demais; as gotas grandes são anéis; a borracha mais se dissolve do que rasga. Ele achou certos a
ordem, os tempos e os tamanhos, e o respingo convincente de onde o visitante fica (uns 7 de 10),
menos de perto (uns 5).

### O que é simulado

Nada aqui resolve as equações de um fluido (nem Navier–Stokes, nem partículas que se empurram).
É uma cadeia de modelos pequenos, cada um o mais simples que dá os tamanhos, as velocidades e a
ordem certa dos acontecimentos. Uns são integrados a partir de forças; outros são curvas
ajustadas ao que uma câmera rápida mostra. A tabela diz qual é qual.

| Etapa | Modelo | Números | Tipo |
|---|---|---|---|
| O estouro | a borracha rasga a partir do ponto clicado e a borda do rasgo corre em volta do balão até o nó; um borrifo fino sai da pele da água por onde a borda passa. Sobra um trapo de borracha grossa no barbante, que chicoteia e para | 55 ms para a pele inteira | ajustado |
| A queda | um corpo só, em queda livre, `y = y₀ − ½ g t²`; a forma relaxa de pera para bola e balança em três lobos lentos; a cauda solta algumas gotas | raio de 7 cm, cerca de 1,4 l; 0,50 m em 0,32 s; chega a 3,1 m/s | calculado (o caminho), ajustado (a forma) |
| A cratera | uma bacia de fundo redondo se abre onde a água cai, `−2 r₀ (1 − (r/0,9 r_borda)²)^0,7`, e a borda corre para fora: `r_borda(t) = r₀ (1 + 1,1 (1 − e^(−t/0,12)))` | r₀ = 6,3 cm; 12,6 cm de fundo aos 0,13 s, fechada aos 0,32 s; a borda para em 13 cm | ajustado |
| A coroa | uma lâmina d'água fica em pé sobre a borda. O topo é lançado para cima, mais forte aqui e menos ali, e daí em diante sobe e cai como qualquer coisa: `h(t) = v t − ½ g t²`. Ela se inclina para fora 0,2 h, se rasga em furos redondos e depois em fios quando chega perto do alto, e desce | v = 2,0 m/s × (0,72 a 1,28) ao redor do anel; por isso tem de 11 a 33 cm de altura e fica de 0,29 a 0,52 s no ar | calculado (o voo), ajustado (o lançamento, o rasgo) |
| As gotas | no começo a borda lança gotas à frente dela; depois, onde a lâmina se rasga, o que ela era segue como gotas com a velocidade que a lâmina tinha ali, e a água da coroa chove de volta. Cada uma é um corpo sob a gravidade e o arrasto do ar: `a = −g ŷ − (3/8) C_d (ρ_ar/ρ_água) |v| v / r` | até 2000 ao mesmo tempo; raio de 0,5 a 5,5 mm, a maioria abaixo de 1 mm; C_d = 0,47; ρ_ar/ρ_água = 1,2/1000 | calculado |
| O que a gota encontra | um vidro: fica nele e escorre. A água: some; uma com mais de 1,2 mm levanta gotinhas, e uma com mais de 2,6 mm deixa anéis. A barra da lâmpada, o aparador, a parede, o chão: uma mancha molhada que seca | a gota escorre a até 0,22 m/s; a mancha dura de 7 a 12 s | calculado (onde), ajustado (o que acontece depois) |
| O jato | quando a cratera fecha, uma coluna sobe do meio (o jato de Worthington): `z(t) = 2,25 t − ½ g t²`. Ela afina (Rayleigh e Plateau), solta a ponta e cai de volta no montinho em que está de pé, que manda mais um anel | começa 0,30 s depois da queda; 26 cm de altura aos 0,23 s, no chão aos 0,46 s; a gota da ponta tem 8,5 mm de raio | calculado (a ponta), ajustado (a forma) |
| O ar | um pouco de ar desce com a queda, a maior parte fica presa quando a cratera se fecha sobre si mesma, e mais um pouco onde a coroa desce. Bolhas finas, lançadas para baixo a até 1,2 m/s, freadas pela água até a velocidade de subida de cada uma, as maiores mais depressa; borbulham na superfície | bolhas de 0,4 a 3,4 mm sobem a 0,15 a 0,36 m/s e não passam da metade do tanque | calculado, com arrasto linear |
| Os anéis | as ondas de Cauchy e Poisson em água funda. Um tempo τ depois de algo cair, a onda à distância r tem o número de onda `k = g τ² / 4 r²` e a fase `k r`: as ondas longas vão na frente, as curtas atrás. A altura é `A (k/k₀) e^(1 − k/k₀) cos(k r) √(0,05/(r + 0,05)) e^(−τ/T)` | o balão: A = 2 cm, k₀ = 46 rad/m (uma onda de 14 cm), T = 3,2 s. Uma gota: até 4 mm, 190 rad/m, 0,9 s. A volta do jato: 7 mm, 95 rad/m, 1,6 s | calculado (a dispersão), ajustado (as alturas) |
| O vidro | os anéis voltam dos quatro vidros: quatro imagens espelhadas da queda, com 0,8 da altura | dez fontes de anéis ao todo: a queda, as quatro imagens, o jato, quatro gotas | calculado |
| O tanque | o tanque inteiro balança nas duas ondas mais lentas que a queda consegue começar, `ω² = g k tanh(k d)`: meia onda na largura (k = π/0,5 m) e uma onda inteira no comprimento (k = 2π/1,6 m), em água de 0,36 m de fundo | períodos de 0,81 s e 1,08 s; 5 mm de altura; some em uns 4,5 s | calculado (os períodos), ajustado (a altura) |
| As boias | flutuam na mesma soma de ondas, em JavaScript, e se inclinam com a inclinação dela. A água que a cratera empurra levanta uma ondulação que corre à frente dos anéis e ergue as boias, e as leva junto, `u(r) = ṙ_borda · r_borda / r`; depois elas voltam devagar | a ondulação tem 2 cm de altura e corre a 0,75 m/s; a borda começa a 0,6 m/s; uma boia a 12 cm da queda vai parar a uns 17 cm | calculado (a flutuação), ajustado (a ondulação) |
| A areia | uma crista junta a luz da lâmpada na areia embaixo dela, um vale espalha: brilho `1 − d (n − 1)/n ∇²h` | d (n − 1)/n = 0,094 m | calculado, nos vértices da areia |
| A espuma, os peixes | a água fica branca e revolta onde a queda foi, por um ou dois segundos; os peixes fogem e voltam | | ajustado |

A queda a 3,1 m/s de uma bola de 14 cm tem número de Weber perto de 19 000 e número de Froude
perto de 7: com esses números a coroa é grossa e irregular, se desfaz logo e lança muitas gotas
pequenas, e é isso que os ajustes procuram.

Tudo anda em passos fixos de 1/180 s (primeiro a velocidade, depois a posição), com um dado de
semente fixa, pelo relógio do próprio quarto. Assim o mesmo clique dá o mesmo respingo, e o
`just record` filma sempre o mesmo.

### Como é desenhado

Seis draw calls no máximo: o suporte, o barbante com o nó, e o balão ou o trapo dele, sempre; a
água que cai, a coroa com o jato (duas superfícies de revolução moldadas num vertex shader) e um
conjunto só de quadrados para cada gota, bolha, escorrido e mancha, enquanto duram.

A água é desenhada como o que ela é, uma lente. Enquanto o respingo dura, uns dois segundos, um laptop
desenha o quarto mais uma vez a cada quadro, na metade do tamanho e sem o respingo, e a água
mostra essa imagem dobrada: um ponto da água com a normal n, vista nos eixos da câmera, mostra o
que está `1,6 R n_xy` para o lado (nunca mais que um oitavo da imagem), sendo R o raio da lente ali (7 cm para a água que cai, o raio
da própria coluna para o jato, 3,5 cm para a lâmina da coroa, o próprio raio para uma gota). Por
isso uma bola d'água mostra a parede atrás dela de cabeça para baixo e menor, como uma de
verdade, escura perto da borda, com os brilhos da lâmpada do tanque e da lâmpada do quarto. A
gota é esticada ao longo da velocidade por um obturador de 3,5 ms e oscila entre achatada e
comprida, mais depressa quanto menor; uma mais fina que um pixel é desenhada mais fraca, e quase
só aparece pelo brilho. A superfície toma a inclinação dos anéis em cada pixel num laptop e nos
vértices num celular.

### O que ela não faz

- O volume não se conserva de uma etapa para a outra: a coroa, o jato e as gotas não são
  cortados dos 1,4 l que caíram.
- As gotas não se encontram, e não molham as boias nem as plantas.
- Os anéis usam ondas de água funda, sem tensão superficial; o tanque tem 0,36 m de fundo, então
  ondas com mais de uns 0,7 m sairiam erradas, e a queda não faz nenhuma tão longa.
- O som do estouro e do respingo é sintetizado, não gravado.
- Um celular recebe um quarto das gotas e não tem a imagem dobrada do quarto: a água dele
  espelha um quarto inventado. Com movimento reduzido, o clique só deixa a água descer:
  o balão some, os anéis se espalham, nada voa.

Para mudar, edite `sea.balloon` em [`src/config.js`](src/config.js): as palavras, as cores dos
balões em sequência, `radius`, `height` (altura sobre a água), `across` (onde ele fica entre o
vidro da frente e o de trás), `refill` (segundos até o próximo), `drops` e `liteDrops`, `shutter`
(segundos) e `speed` (1 é tempo real; 0,25 é quatro vezes mais devagar).

## Rodar

Com Nix:

```sh
nix develop      # ou: direnv allow
just setup
just dev         # http://localhost:5173
```

No macOS sem Nix: `brew install node just ffmpeg`, depois as mesmas receitas `just`.
`just check` roda as verificações do [`AGENTS.md`](AGENTS.md) e um build; `just build` escreve o
site em `dist/`, pronto para qualquer hospedagem estática. `just light` mede o brilho de cada
plano de noite e de dia, e `just stills` e `just record` fazem as imagens que um pull request leva.
`just peek` faz uma imagem de qualquer plano, sem build, e conta as draw calls; `just models`
baixa os móveis do Poly Haven e os empacota para o laptop e para o celular.
As skills em [`.claude/skills/`](.claude/skills/) ensinam essas regras ao Claude Code num fork também.

## Faça um fork, faça o seu

Faça um fork do repositório e mude [`src/config.js`](src/config.js). É o único arquivo com o que
faz deste quarto o da piabrota, e nenhum outro arquivo nomeia uma pessoa, um link ou um som.
Cada parte é um export próprio, então dá para trocar uma e manter o resto:

| Export | O que é | Para fazer o seu |
|---|---|---|
| `signature`, `place` | o nome, o slogan, os links, a cidade e seu fuso | seu nome, suas palavras, seus links |
| `theme` | as cores | sua paleta (e a fonte em `src/style.css`) |
| `shots`, `startShot` | os planos de câmera nomeados | suas vistas, ou câmeras `shot_*` do Blender |
| `ui` | as palavras dos botões | sua língua, suas gírias |
| `radio` | as estações da rádio e suas faixas | sua música, CC0 ou CC BY, cada uma com uma linha no `CREDITS.md` |
| `ambience`, `sfx` | o botão da chuva e os cliques | suas gravações (`just audio take.wav <nome>`) |
| `outside` | a vista da janela, de dia e de noite | sua cidade, duas fotos creditadas no `CREDITS.md` |
| `tapes` | o que o videocassete toca | suas fitas, um arquivo cada em `src/tapes/` |
| `projects`, `bots`, `wip`, `people`, `works` | as paredes, a mesa, a lousa do que ainda está sendo feito, o quadro, a estante | suas listas |
| `sea`, `loop`, `slipbox` | as outras três paredes | suas coleções, ou tire-as |
| `reading`, `posts/` | a página LOFI: sobre, online, assinar; os posts | suas palavras, seus perfis; seus posts, um arquivo Markdown cada |
| `door`, `cat`, `guard` | a fechadura de código da porta e suas pistas; Nash, o gato preto, e onde ele senta; a guarda de tela | seu enigma, seu gato (ou nenhum), `guard: { screenshots: false }` |
| `shell`, `models` | a tinta, a madeira, o pano e o tapete do apartamento; os móveis e objetos que são arquivos (`just models`) | suas cores; outros modelos CC0, cada um com uma linha no `CREDITS.md` |
| `stack`, `deck` | as pilhas de capas de VHS e a frente do videocassete | suas pilhas, sua marca no aparelho |
| `credits` | o botão de créditos, o seu cartão e a placa na parede | mantenha a linha da ideia; liste o que o seu quarto usa de outros |
| `hotspots` | o que pode ser clicado, e o que faz | seus rótulos, suas palavras, seus links |

Enquanto não houver um modelo do quarto inteiro nem gravações, o quarto é montado em código em
volta dos arquivos dos móveis, uma peça que falta vira uma caixa simples e os sons são
sintetizados, então um fork roda desde o primeiro commit.

1. **Modelo.** Monte o quarto no Blender em escala real, nomeie as malhas (`screen`, `vcr`,
   `lamp`, `tape_<id>`, hotspots) e as câmeras (`shot_desk`, ...), faça o bake da luz e exporte
   `public/models/room.glb` (no máximo 10 MB).
2. **Sons.** Grave o som do ambiente e alguns cliques, depois `just audio take.wav ambience`.
3. **Fitas.** Copie `src/tapes/hello.js`; uma fita desenha no canvas da TV e pode ser um CV,
   uma apresentação, um jogo ou um instrumento.
4. **Replay.** Guarde seus próprios prompts em `prompts/`, e o quarto conta como foi feito.

O botão LOFI/HIFI no canto alterna entre o quarto em 3D (HIFI) e o mesmo conteúdo em texto puro
(LOFI). `?lofi` no endereço abre a vista em texto; sem WebGL, LOFI é a única vista.

## Licença

[MPL-2.0](LICENSE). Os assets em `public/` são do dono, salvo o que o `CREDITS.md` disser.
