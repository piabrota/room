# Credits

## The idea

The idea of a personal site that is a 3D room, with camera shots, things to hover and VHS
tapes that play on a TV, comes from **Felix Rieseberg**, who built one for his own site and
wrote about how he made it. He works on Claude at Anthropic: his own site's description read
"I work on Claude at Anthropic." on 10 November 2026. This repository is a separate work: no
code, model, texture, sound or text of his is used here.

The room says this on screen too, from `config.credits`: the credits button and its card, the
brass plate on the wall, and the credits of the LOFI page (`AGENTS.md`, invariant 2).


## The playlist

The mixtape on the sill and the ♫ playlist button open **GREAT RESET**, a playlist by
Leonardo AL aracyla (the owner, 10 November 2026) on [Spotify](https://open.spotify.com/playlist/2hsuqvhCouatM8DtmKKl7U), in
Spotify's Embed player (`src/player.js`; `AGENTS.md`, invariants 1 and 7). The music belongs
to its artists and their labels. It is streamed by Spotify, under Spotify's terms, and no
audio, cover or logo of it is copied into this repository. Without a Spotify login in the
browser, Spotify plays 30-second previews.

The tracks, as Spotify's Embed player listed them on 10 November 2026 at 20:12 UTC:

| # | Track | Artists |
|---|---|---|
| 1 | Brasileiro | Puro Suco, BEATDOMK |
| 2 | I Only Smoke When I Drink | nimino |
| 3 | NASCI PELADO, TÔ VESTIDO | Brone, Jamé |
| 4 | Deus Do Furdunço | Leo Gandelman, Machine Series, BK |
| 5 | Julius | BK, El Lif Beatz |
| 6 | O Jeito | Flora Matos |
| 7 | Bora Dançar | Flora Matos |
| 8 | Sonhos Gangsta | Flora Matos |
| 9 | Reunião | Sain, Luccas Carlos, Akira Presidente, Bril, CHS, JXNV$, BK, Pirâmide Perdida |
| 10 | Avanço | Nectar Gang |
| 11 | I THINK | Tyler, The Creator |
| 12 | NEW MAGIC WAND | Tyler, The Creator |
| 13 | EARFQUAKE | Tyler, The Creator |
| 14 | Stronger | Kanye West |
| 15 | California Uber Alles | Dead Kennedys |
| 16 | Me Toca | Marina Sena |
| 17 | Pelejei | Marina Sena |
| 18 | Voltei Pra Mim | Marina Sena |
| 19 | Amiúde | Marina Sena |
| 20 | Seu Olhar | Marina Sena |
| 21 | Coisas Naturais | Marina Sena |
| 22 | Sem Lei | Marina Sena |
| 23 | SENSEI | Marina Sena |
| 24 | CARNAVAL | Marina Sena |
| 25 | Sinais de fogo | Preta Gil |
| 26 | O Vento | Los Hermanos |
| 27 | ROMPEU O COURO. | Marcelo D2, Juçara Marçal, BK, Baco Exu do Blues, Anelis Assumpção |
| 28 | The Search | NF |
| 29 | Desenho | Filipe Ret, Mãolee |
| 30 | SPINE | WesGhost |
| 31 | Ta Faltando Um | Wealstarcks |
| 32 | LOVE IN RIO | Wealstarcks |
| 33 | Copacabana 89 | Wealstarcks |
| 34 | Quente ! | Akira Presidente, BK, Paulo DK, Abud |
| 35 | Asa | Djavan |
| 36 | Melhoria Gang | Akira Presidente, El Lif Beatz |
| 37 | a última dança | Link do Zap, pluglip |
| 38 | It's The End Of The World As We Know It (And I Feel Fine) | R.E.M. |
| 39 | Human | Apashe, Wasiu |
| 40 | Libertários Não Morrem | Filipe Ret, IbraBeats, Funkero |
| 41 | Música | Alternativo Ponto de Vista, Luiz Barata, Hariel Malay |
| 42 | The Real Slim Shady | Eminem |
| 43 | Asas | Luedji Luna |
| 44 | Um Corpo no Mundo | Luedji Luna |
| 45 | Acalanto | Luedji Luna |
| 46 | Banho de Folhas | Luedji Luna |
| 47 | West Coast | The Neighbourhood |
| 48 | TOKYO HEAT | C.H.A.Y. |
| 49 | The Cruel Angel's Thesis (Director's Edit Version) | 高橋 洋子 |
| 50 | O Samba Morreu | Link do Zap |
| 51 | Pseudosocial | Froid |
| 52 | Babylon By Gus | Black Alien |
| 53 | Luv (sic) | Nujabes |
| 54 | Rio | Ugovhb, EF |
| 55 | Mar | pumapjl, Babidi |
| 56 | Gypsy Woman | Levi.Sct |
| 57 | Zoom Zoom | Polo & Pan |
| 58 | São Paulo Sunset | Saib |
| 59 | FESTA DE ADEUS | Julio Secchin |
| 60 | Preciso Me Encontrar | Cartola |

## The live window

The window's button puts **Copacabana, Posto 6, live** behind the glass in place of the two
photographs of Rio: the webcam of Homes in Rio,
"[Panorama Webcam Rio de Janeiro - Copacabana beach - Posto 6](https://www.youtube.com/watch?v=Bz9Hkrk1NcY)",
streamed by YouTube in its privacy-enhanced embed, under YouTube's terms, and muted
(`src/live.js`; `AGENTS.md`, invariants 1 and 7). Nothing of the stream is copied into this
repository; the room names the channel beside the button while it plays.

## Assets

Everything in `public/` is the owner's own, unless a row below says otherwise. A third-party
asset gets a row here in the same commit that adds it.

| File | Author | Source | Licence |
|---|---|---|---|
| `public/audio/ambience.mp3` | klankbeeld, with the owner's edit | "city hum 3am winter 140217_0090" (freesound 219877) and "traffic along flat LONG 130104_00" (freesound 174242), cut, mixed, looped and normalized by `just compose` | CC BY 4.0 |
| `public/audio/rain.mp3`, the rain toggle | cori | "Rain against the Window" (pdsounds.org, 2008) on [Wikimedia Commons](https://commons.wikimedia.org/wiki/File:Rain_against_the_window.ogg), looped with a crossfade at the seam and normalized to -18 LUFS. `just compose` can replace it with YleArkisto's "Rain on a metal windowsill" (freesound 350358, CC BY 4.0) | public domain |
| `public/audio/meow.mp3`, Nash's meow | Heismark | "Meow of a pleading cat" (2010) on [Wikimedia Commons](https://commons.wikimedia.org/wiki/File:Meow_of_a_pleading_cat.oga), the second of its four meows, cut, denoised, band-passed (220 Hz to 3.8 kHz) and normalized to -18 LUFS | public domain |
| `public/audio/eject.mp3` | magedu, with the owner's edit | "video_recorder_eject_cassette" (freesound 267832), trimmed and normalized | CC BY 4.0 |
| `public/audio/insert.mp3` | magedu, with the owner's edit | the same recording, reversed | CC BY 4.0 |
| `public/audio/tape-piabrota.mp3` | the owner; klankbeeld, YleArkisto and magedu | the score of `src/score.js`, mixed with freesound 350358, 219877 and 267832 by `just compose` | CC BY 4.0 |
| `public/textures/pbr/herringbone_parquet_*.jpg`, the floor | Sergej Majboroda (photography), Jenelle van Heerden (processing) | "Herringbone Parquet" on [Poly Haven](https://polyhaven.com/a/herringbone_parquet), 1k, re-encoded | CC0 1.0 |
| `public/textures/pbr/american_walnut_veneer_*.jpg`, the desk | Jenelle van Heerden | "American Walnut Veneer" on [Poly Haven](https://polyhaven.com/a/american_walnut_veneer), 1k, re-encoded | CC0 1.0 |
| `public/textures/pbr/rosewood_veneer1_*.jpg`, the door, the window, the skirting | Jenelle van Heerden | "Rosewood Veneer1" on [Poly Haven](https://polyhaven.com/a/rosewood_veneer1), 1k, re-encoded by `just models` | CC0 1.0 |
| `public/textures/pbr/beige_wall_001_*.jpg`, the grain of the plaster on the walls and the ceiling (normal and roughness only) | Dimitrios Savva (photography), Rico Cilliers (processing) | "Beige Wall 001" on [Poly Haven](https://polyhaven.com/a/beige_wall_001), 1k, re-encoded by `just models` | CC0 1.0 |
| `public/textures/pbr/cotton_jersey_*.jpg`, the weave of the curtains (normal and roughness only) | colormass (photography), Rico Cilliers (processing) | "Cotton Jersey" on [Poly Haven](https://polyhaven.com/a/cotton_jersey), 1k, re-encoded by `just models` | CC0 1.0 |
| `public/textures/rio-day.jpg` (and `rio-day.lite.jpg`, 1280 px, for small screens), the view from the window by day | Arian Zwegers | "Rio de Janeiro, Pão de Açúcar from Cristo Redentor" on [Wikimedia Commons](https://commons.wikimedia.org/wiki/File:Rio_de_Janeiro,_P%C3%A3o_de_A%C3%A7%C3%BAcar_from_Cristo_Redentor_(15744316848).jpg), resized to 1920 px | CC BY 2.0 |
| `public/textures/rio-night.jpg` (and `rio-night.lite.jpg`, 1280 px, for small screens), the view from the window at night | Wilfredor | "Rio de Janeiro at night from above, Rio de Janeiro.jpg" on [Wikimedia Commons](https://commons.wikimedia.org/wiki/File:Rio_de_Janeiro_at_night_from_above,_Rio_de_Janeiro.jpg), resized to 1920 px | CC0 1.0 |
| `public/models/fish.glb` (and `fish.lite.glb`), the big fish in the aquarium | Microsoft (2017) | "Barramundi Fish" in the Khronos Group's [glTF sample assets](https://github.com/KhronosGroup/glTF-Sample-Assets/tree/8f492390ddc7a2ae221a1369ef560589cf8c70fb/Models/BarramundiFish), at that commit; its textures cut to 512 px WebP (256 px, the colour alone, in the lite file), its metal and occlusion maps left out, packed with meshopt by `just fish` | CC0 1.0 |
| `public/textures/tyler-durden-bot.png`, the board above the bookshelf | the owner | tyler-durden-bot's logo, a pixel portrait, given in the project on 9 November 2026, as it is | the owner's own |
| `public/grid/land.json`, the land on the ▲ grid map | Natural Earth | "Land", 1:50m, from [natural-earth-vector](https://github.com/nvkelso/natural-earth-vector), clipped to the domain by `just grid` | public domain |
| `public/grid/mesh.bin`, the triangle mesh of the coast | the owner | made by `just grid` (`scripts/grid.mjs`) from Natural Earth's coastline, with [delaunator](https://github.com/mapbox/delaunator) (ISC). Triangle grids for WAVEWATCH III are the work of Dr. Aron Roland, with Fabrice Ardhuin; at NOAA, Dr. Ali Abdolali carried them further | public domain (Natural Earth); the mesh is the owner's |
| `public/grid/sst.bin`, the sea's surface temperature on the mesh, one day | Met Office (OSTIA), E.U. Copernicus Marine Service | "Global Ocean OSTIA Sea Surface Temperature and Sea Ice Analysis", `SST_GLO_SST_L4_NRT_OBSERVATIONS_010_001`, dataset `METOFFICE-GLO-SST-L4-NRT-OBS-SST-V2`, [doi:10.48670/moi-00165](https://doi.org/10.48670/moi-00165), its latest day read from the service's public ARCO zarr store and sampled at the nodes by `just grid`. Generated using E.U. Copernicus Marine Service information; these data were provided by GHRSST and Met Office | the Copernicus Marine Service licence: free use, with this acknowledgement |
| `public/grid/frames.bin`, `public/grid/run.json`, 24 h of wind and sea on the mesh | NOAA (GFS), Open-Meteo | the GFS 0.25° forecast's 10 m wind, fetched through the [Open-Meteo API](https://open-meteo.com) (data under CC BY 4.0), interpolated to the mesh by `just grid`; the sea is estimated from it (Pierson and Moskowitz, 1964), not modelled | GFS: US government work, public domain; Open-Meteo: CC BY 4.0 |
| `public/audio/radio/varanda.mp3`, on piabrota RADIO | the owner; the instruments are FluidR3 GM, by Frank Wen | "Varanda, duas da manhã", written in Csound for the room (`music/varanda.sco`, played by `music/lofi.orc`) and rendered by `just lofi` with the samples of the FluidR3 GM soundfont (MIT; `soundfont-fluid` in nixpkgs), normalized to -18 LUFS, 128 kb/s | CC BY 4.0 |
| `public/audio/radio/carta.mp3`, on piabrota RADIO | the owner; the instruments are FluidR3 GM, by Frank Wen | "Carta para o mar", written in Csound for the room (`music/carta.sco`, played by `music/lofi.orc`) and rendered by `just lofi` with the samples of the FluidR3 GM soundfont (MIT; `soundfont-fluid` in nixpkgs), normalized to -18 LUFS, 128 kb/s | CC BY 4.0 |
| `public/audio/radio/corredor.mp3`, on piabrota RADIO | the owner; the instruments are FluidR3 GM, by Frank Wen | "Flauta no corredor", written in Csound for the room (`music/corredor.sco`, played by `music/lofi.orc`) and rendered by `just lofi` with the samples of the FluidR3 GM soundfont (MIT; `soundfont-fluid` in nixpkgs), normalized to -18 LUFS, 128 kb/s | CC BY 4.0 |
| `public/audio/radio/fita.mp3`, on piabrota RADIO | the owner; the instruments are FluidR3 GM, by Frank Wen | "Última fita", written in Csound for the room (`music/fita.sco`, played by `music/lofi.orc`) and rendered by `just lofi` with the samples of the FluidR3 GM soundfont (MIT; `soundfont-fluid` in nixpkgs), normalized to -18 LUFS, 128 kb/s | CC BY 4.0 |
| `public/audio/radio/metro.mp3`, on piabrota RADIO | the owner; the instruments are FluidR3 GM, by Frank Wen | "Depois do metrô", written in Csound for the room (`music/metro.sco`, played by `music/lofi.orc`) and rendered by `just lofi` with the samples of the FluidR3 GM soundfont (MIT; `soundfont-fluid` in nixpkgs), normalized to -18 LUFS, 128 kb/s | CC BY 4.0 |
| `public/audio/radio/chuva.mp3`, on piabrota RADIO | the owner; the instruments are FluidR3 GM, by Frank Wen | "Chuva fina no Catete", written in Csound for the room (`music/chuva.sco`, played by `music/lofi.orc`) and rendered by `just lofi` with the samples of the FluidR3 GM soundfont (MIT; `soundfont-fluid` in nixpkgs), normalized to -18 LUFS, 128 kb/s | CC BY 4.0 |
| `public/audio/radio/cafe.mp3`, on piabrota RADIO | the owner; the instruments are FluidR3 GM, by Frank Wen | "Café coado", written in Csound for the room (`music/cafe.sco`, played by `music/lofi.orc`) and rendered by `just lofi` with the samples of the FluidR3 GM soundfont (MIT; `soundfont-fluid` in nixpkgs), normalized to -18 LUFS, 128 kb/s | CC BY 4.0 |
| `public/audio/radio/janela.mp3`, on piabrota RADIO | the owner; the instruments are FluidR3 GM, by Frank Wen | "Janela acesa", written in Csound for the room (`music/janela.sco`, played by `music/lofi.orc`) and rendered by `just lofi` with the samples of the FluidR3 GM soundfont (MIT; `soundfont-fluid` in nixpkgs), normalized to -18 LUFS, 128 kb/s | CC BY 4.0 |
| `public/audio/radio/bilhete.mp3`, on piabrota RADIO | the owner; the instruments are FluidR3 GM, by Frank Wen | "Bilhete na geladeira", written in Csound for the room (`music/bilhete.sco`, played by `music/lofi.orc`) and rendered by `just lofi` with the samples of the FluidR3 GM soundfont (MIT; `soundfont-fluid` in nixpkgs), normalized to -18 LUFS, 128 kb/s | CC BY 4.0 |
| `public/audio/radio/domingo.mp3`, on piabrota RADIO | the owner; the instruments are FluidR3 GM, by Frank Wen | "Domingo sem pressa", written in Csound for the room (`music/domingo.sco`, played by `music/lofi.orc`) and rendered by `just lofi` with the samples of the FluidR3 GM soundfont (MIT; `soundfont-fluid` in nixpkgs), normalized to -18 LUFS, 128 kb/s | CC BY 4.0 |
| Fjalla One (titles), bundled from `@fontsource/fjalla-one` | Sorkin Type | [Fontsource](https://fontsource.org/fonts/fjalla-one) | OFL-1.1 |
| JetBrains Mono (interface), bundled from `@fontsource/jetbrains-mono` | JetBrains | [Fontsource](https://fontsource.org/fonts/jetbrains-mono) | OFL-1.1 |
| Permanent Marker (tape labels by hand), bundled from `@fontsource/permanent-marker` | Font Diner | [Fontsource](https://fontsource.org/fonts/permanent-marker) | Apache-2.0 |
| Monoton (the neon tape labels, the marola.dev tape), bundled from `@fontsource/monoton` | Vernon Adams | [Fontsource](https://fontsource.org/fonts/monoton) | OFL-1.1 |
| Press Start 2P (the pixel tape labels, the ouroboric-dev tape), bundled from `@fontsource/press-start-2p` | CodeMan38 | [Fontsource](https://fontsource.org/fonts/press-start-2p) | OFL-1.1 |
| VT323 (the terminal tape labels, the CV tape, the VCR clock), bundled from `@fontsource/vt323` | Peter Hull | [Fontsource](https://fontsource.org/fonts/vt323) | OFL-1.1 |
| Special Elite (the typed paper: the fax, the letter, the door's tag), bundled from `@fontsource/special-elite` | Astigmatic | [Fontsource](https://fontsource.org/fonts/special-elite) | Apache-2.0 |
| `public/favicon.svg`, the tab's icon: the piabrota eye | piabrota | `docs/drawings/eye.svg` of [piabrota/mu](https://github.com/piabrota/mu), the org's logo | the org's mark, not licensed for other uses (mu's `TRADEMARKS.md`) |
| The piabrota eye on the sign, drawn in code (`src/art.js`) after `docs/drawings/eye.svg` | piabrota | [piabrota/mu](https://github.com/piabrota/mu) | the org's mark, not licensed for other uses (mu's `TRADEMARKS.md`) |

### The furniture and the props

Photographed models from [Poly Haven](https://polyhaven.com), all under CC0 1.0. `just models`
(`scripts/models.mjs`, from the list in `scripts/models.json`) fetches each one, keeps the parts
the room uses, thins its mesh, re-encodes its textures as WebP and packs it with meshopt; the
`.lite.glb` beside each file is the smaller one the phone's look loads. The table is written by
`just models`.

<!-- models:start (written by `just models`) -->
| File (and its `.lite.glb`) | Author | Source | Licence |
|---|---|---|---|
| `public/models/television_02.glb` | Benny Weimer | "Television 02" on [Poly Haven](https://polyhaven.com/a/television_02) | CC0 1.0 |
| `public/models/desk_lamp_arm_01.glb` | Yann Kervran, Kuutti Siitonen | "Desk Lamp Arm 01" on [Poly Haven](https://polyhaven.com/a/desk_lamp_arm_01) | CC0 1.0 |
| `public/models/boombox.glb` | Thomas Paul Mouilleron | "Boombox" on [Poly Haven](https://polyhaven.com/a/boombox) | CC0 1.0 |
| `public/models/GreenChair_01.glb` | Kirill Sannikov | "Green Chair 01" on [Poly Haven](https://polyhaven.com/a/GreenChair_01) | CC0 1.0 |
| `public/models/wooden_bookshelf_worn.glb` | Ulan Cabanilla | "Wooden Bookshelf Worn" on [Poly Haven](https://polyhaven.com/a/wooden_bookshelf_worn) | CC0 1.0 |
| `public/models/modern_wooden_cabinet.glb` | Patrik Pangerl | "Modern Wooden Cabinet" on [Poly Haven](https://polyhaven.com/a/modern_wooden_cabinet) | CC0 1.0 |
| `public/models/Sofa_01.glb` | Kirill Sannikov | "Sofa 01" on [Poly Haven](https://polyhaven.com/a/Sofa_01) | CC0 1.0 |
| `public/models/throw_pillows_01.glb` | Serhii Khromov | "Throw Pillows 01" on [Poly Haven](https://polyhaven.com/a/throw_pillows_01) | CC0 1.0 |
| `public/models/vintage_grandfather_clock_01.glb` | Yann Kervran, James Ray Cock | "Vintage Grandfather Clock 01" on [Poly Haven](https://polyhaven.com/a/vintage_grandfather_clock_01) | CC0 1.0 |
| `public/models/Chandelier_02.glb` | Kirill Sannikov | "Chandelier 02" on [Poly Haven](https://polyhaven.com/a/Chandelier_02) | CC0 1.0 |
| `public/models/fern_02.glb` | Rob Tuytel, Rico Cilliers | "Fern 02" on [Poly Haven](https://polyhaven.com/a/fern_02) | CC0 1.0 |
| `public/models/potted_plant_02.glb` | Rico Cilliers | "Potted Plant 02" on [Poly Haven](https://polyhaven.com/a/potted_plant_02) | CC0 1.0 |
| `public/models/potted_plant_04.glb` | James Ray Cock | "Potted Plant 04" on [Poly Haven](https://polyhaven.com/a/potted_plant_04) | CC0 1.0 |
| `public/models/planter_pot_clay.glb` | Amal Kumar | "Planter Pot Clay" on [Poly Haven](https://polyhaven.com/a/planter_pot_clay) | CC0 1.0 |
| `public/models/book_encyclopedia_set_01.glb` | John Malcolm | "Book Encyclopedia Set 01" on [Poly Haven](https://polyhaven.com/a/book_encyclopedia_set_01) | CC0 1.0 |
| `public/models/pencil_cup.glb`, `public/models/pens.glb` | Mateusz Sadek | "Stationery Supplies" on [Poly Haven](https://polyhaven.com/a/stationery_supplies) | CC0 1.0 |
| `public/models/fancy_picture_frame_01.glb` | Rob Tuytel, Rico Cilliers | "Fancy Picture Frame 01" on [Poly Haven](https://polyhaven.com/a/fancy_picture_frame_01) | CC0 1.0 |
| `public/models/vintage_suitcase.glb` | Maximilian Schuster | "Vintage Suitcase" on [Poly Haven](https://polyhaven.com/a/vintage_suitcase) | CC0 1.0 |
| `public/models/Ukulele_01.glb` | Joseph Burgan | "Ukulele 01" on [Poly Haven](https://polyhaven.com/a/Ukulele_01) | CC0 1.0 |
| `public/models/cardboard_box_01.glb` | Rahul Chaudhary | "Cardboard Box 01" on [Poly Haven](https://polyhaven.com/a/cardboard_box_01) | CC0 1.0 |
| `public/models/side_table_tall_01.glb` | James Ray Cock | "Side Table Tall 01" on [Poly Haven](https://polyhaven.com/a/side_table_tall_01) | CC0 1.0 |
| `public/models/alarm_clock_01.glb` | Yann Kervran, James Ray Cock | "Alarm Clock 01" on [Poly Haven](https://polyhaven.com/a/alarm_clock_01) | CC0 1.0 |
| `public/models/ceramic_vase_01.glb` | James Ray Cock | "Ceramic Vase 01" on [Poly Haven](https://polyhaven.com/a/ceramic_vase_01) | CC0 1.0 |
<!-- models:end -->

The four recordings are on freesound.org, under Creative Commons Attribution 4.0
(creativecommons.org/licenses/by/4.0): 219877 and 174242 by klankbeeld, 350358 by YleArkisto
(Yle, the Finnish broadcasting company's archive), 267832 by magedu. They are not in this
repository; `just compose` reads them from `samples/` (see `scripts/compose.mjs`). The words and
links of the piabrota tape come from piabrota's own GitHub pages (sources in `src/config.js`).

The project glyphs on the frames (む, 道場, 無, 代理, 无) are typed characters standing for the
drawings in each project's repository; no drawing is copied here. The projects, the bots, the
people and the works on the shelf are described in our own words from the org's public READMEs.

## Libraries

- [three.js](https://threejs.org), MIT.
- [Vite](https://vite.dev), MIT.
- [MapLibre GL JS](https://maplibre.org), BSD-3-Clause: the ▲ grid map, loaded only when it opens.
- [delaunator](https://github.com/mapbox/delaunator), ISC: the triangulation of `just grid` (a build tool; not shipped).
- [glTF Transform](https://gltf-transform.dev), MIT, [meshoptimizer](https://github.com/zeux/meshoptimizer), MIT, and [sharp](https://sharp.pixelplumbing.com), Apache-2.0: the packing of `just models` (build tools; not shipped). three.js's own meshopt decoder reads the models in the browser.

## The water balloon

The splash of the water balloon over the aquarium (`src/splash.js`) is written for this room. Its
way of working, a builder and a separate critic that scores each attempt from its own
screenshots until it passes or three rounds are spent, comes from
[a video by AI Search](https://www.youtube.com/watch?v=S7lpCyZSdJQ) (YouTube), whose physics test
is a water balloon. No code, picture or sound of the video is
used. The physics is textbook: Cauchy and Poisson's waves from a splash on deep water,
Worthington's jet, Rayleigh and Plateau's breaking of a column of water, the drag of a sphere.
`README.md`, "The water balloon", says what is computed and what is fitted. The two sounds, the
burst and the splash, are synthesized in `src/audio.js`.

## Agent skills

Three skills in `.claude/skills/` (`room-threejs-perf`, `room-assets`, `room-load`) are written for
this room, in its own words, from what these public skill collections teach. No text of theirs is
copied; they are named here as the sources of the ideas.

- [CloudAI-X/threejs-skills](https://github.com/CloudAI-X/threejs-skills) at `0e18186`, MIT:
  `threejs-performance` and `threejs-asset-pipeline` (draw calls, double-sided blending, transmission,
  shader stalls, the order of glTF-Transform's steps).
- [addyosmani/web-quality-skills](https://github.com/addyosmani/web-quality-skills) at `afa8da9`, MIT:
  `performance` and `core-web-vitals` (what may load before the first paint, caching, budgets).
