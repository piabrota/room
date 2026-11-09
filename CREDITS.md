# Credits

## The idea

The idea of a personal site that is a 3D room, with camera shots, things to hover and VHS
tapes that play on a TV, comes from **Felix Rieseberg**, who built one for his own site and
wrote about how he made it. This repository is a separate work: no code, model, texture,
sound or text of his is used here.


## The playlist

The mixtape on the sill and the ♫ playlist button open **GREAT RESET**, a playlist by
Matheus Hoffmann on [Spotify](https://open.spotify.com/playlist/2hsuqvhCouatM8DtmKKl7U), in
Spotify's Embed player (`src/player.js`; `AGENTS.md`, invariants 1 and 7). The music belongs
to its artists and their labels. It is streamed by Spotify, under Spotify's terms, and no
audio, cover or logo of it is copied into this repository. Without a Spotify login in the
browser, Spotify plays 30-second previews.

The tracks, as Spotify listed them on 9 November 2026:

| # | Track | Artists |
|---|---|---|
| 1 | O Jeito | Flora Matos |
| 2 | Bora Dançar | Flora Matos |
| 3 | Sonhos Gangsta | Flora Matos |
| 4 | Reunião | Sain, Luccas Carlos, Akira Presidente, Bril, CHS, JXNV$, BK, Pirâmide Perdida |
| 5 | P. D. M. V | Akira Presidente, El Lif Beatz, Nectar Gang |
| 6 | Avanço | Nectar Gang |
| 7 | I THINK | Tyler, The Creator |
| 8 | NEW MAGIC WAND | Tyler, The Creator |
| 9 | EARFQUAKE | Tyler, The Creator |
| 10 | Stronger | Kanye West |
| 11 | Me Toca | Marina Sena |
| 12 | Pelejei | Marina Sena |
| 13 | Voltei Pra Mim | Marina Sena |
| 14 | Amiúde | Marina Sena |
| 15 | Seu Olhar | Marina Sena |
| 16 | Coisas Naturais | Marina Sena |
| 17 | Sem Lei | Marina Sena |
| 18 | SENSEI | Marina Sena |
| 19 | Lua Cheia | Marina Sena |
| 20 | Combo da Sorte | Marina Sena |
| 21 | Mágico | Marina Sena |
| 22 | Doçura | Marina Sena, Çantamarta |
| 23 | CARNAVAL | Marina Sena |
| 24 | Ouro de Tolo | Marina Sena |
| 25 | Aos Poucos | Supercombo |
| 26 | Remédios | Supercombo |
| 27 | Tarde Demais | Supercombo, Vitor Kley |
| 28 | Ímã | Supercombo |
| 29 | Intervenção | Supercombo |
| 30 | O Pneu e a Lombada | Supercombo |
| 31 | Fim Do Mundo | Supercombo |
| 32 | A Baleia e o Lambari | Supercombo |
| 33 | À Primeira Vista | Supercombo |
| 34 | Estrela Do Mar | Supercombo, Elana Dara |
| 35 | Cassino | Supercombo |
| 36 | Esqueletos na Areia | Supercombo |
| 37 | Sinais de fogo | Preta Gil |

## Assets

Everything in `public/` is the owner's own, unless a row below says otherwise. A third-party
asset gets a row here in the same commit that adds it.

| File | Author | Source | Licence |
|---|---|---|---|
| `public/audio/ambience.mp3` | klankbeeld, with the owner's edit | "city hum 3am winter 140217_0090" (freesound 219877) and "traffic along flat LONG 130104_00" (freesound 174242), cut, mixed, looped and normalized by `just compose` | CC BY 4.0 |
| `public/audio/rain.mp3`, the rain toggle | cori | "Rain against the Window" (pdsounds.org, 2008) on [Wikimedia Commons](https://commons.wikimedia.org/wiki/File:Rain_against_the_window.ogg), looped with a crossfade at the seam and normalized to -18 LUFS. `just compose` can replace it with YleArkisto's "Rain on a metal windowsill" (freesound 350358, CC BY 4.0) | public domain |
| `public/audio/eject.mp3` | magedu, with the owner's edit | "video_recorder_eject_cassette" (freesound 267832), trimmed and normalized | CC BY 4.0 |
| `public/audio/insert.mp3` | magedu, with the owner's edit | the same recording, reversed | CC BY 4.0 |
| `public/audio/tape-piabrota.mp3` | the owner; klankbeeld, YleArkisto and magedu | the score of `src/score.js`, mixed with freesound 350358, 219877 and 267832 by `just compose` | CC BY 4.0 |
| `public/textures/pbr/herringbone_parquet_*.jpg`, the floor | Sergej Majboroda (photography), Jenelle van Heerden (processing) | "Herringbone Parquet" on [Poly Haven](https://polyhaven.com/a/herringbone_parquet), 1k, re-encoded | CC0 1.0 |
| `public/textures/pbr/american_walnut_veneer_*.jpg`, the desk and the door | Jenelle van Heerden | "American Walnut Veneer" on [Poly Haven](https://polyhaven.com/a/american_walnut_veneer), 1k, re-encoded | CC0 1.0 |
| `public/textures/rio-day.jpg`, the view from the window by day | Arian Zwegers | "Rio de Janeiro, Pão de Açúcar from Cristo Redentor" on [Wikimedia Commons](https://commons.wikimedia.org/wiki/File:Rio_de_Janeiro,_P%C3%A3o_de_A%C3%A7%C3%BAcar_from_Cristo_Redentor_(15744316848).jpg), resized to 1920 px | CC BY 2.0 |
| `public/textures/rio-night.jpg`, the view from the window at night | Wilfredor | "Rio de Janeiro at night from above, Rio de Janeiro.jpg" on [Wikimedia Commons](https://commons.wikimedia.org/wiki/File:Rio_de_Janeiro_at_night_from_above,_Rio_de_Janeiro.jpg), resized to 1920 px | CC0 1.0 |
| `public/textures/tyler-durden-bot.png`, the board above the bookshelf | the owner | tyler-durden-bot's logo, a pixel portrait, given in the project on 9 November 2026, as it is | the owner's own |
| `public/grid/land.json`, the land on the ▲ grid map | Natural Earth | "Land", 1:50m, from [natural-earth-vector](https://github.com/nvkelso/natural-earth-vector), clipped to the domain by `just grid` | public domain |
| `public/grid/mesh.bin`, the triangle mesh of the coast | the owner | made by `just grid` (`scripts/grid.mjs`) from Natural Earth's coastline, with [delaunator](https://github.com/mapbox/delaunator) (ISC). Triangle grids for WAVEWATCH III are the work of Dr. Aron Roland, with Fabrice Ardhuin; at NOAA, Dr. Ali Abdolali carried them further | public domain (Natural Earth); the mesh is the owner's |
| `public/grid/sst.bin`, the sea's surface temperature on the mesh, one day | Met Office (OSTIA), E.U. Copernicus Marine Service | "Global Ocean OSTIA Sea Surface Temperature and Sea Ice Analysis", `SST_GLO_SST_L4_NRT_OBSERVATIONS_010_001`, dataset `METOFFICE-GLO-SST-L4-NRT-OBS-SST-V2`, [doi:10.48670/moi-00165](https://doi.org/10.48670/moi-00165), its latest day read from the service's public ARCO zarr store and sampled at the nodes by `just grid`. Generated using E.U. Copernicus Marine Service information; these data were provided by GHRSST and Met Office | the Copernicus Marine Service licence: free use, with this acknowledgement |
| `public/grid/frames.bin`, `public/grid/run.json`, 24 h of wind and sea on the mesh | NOAA (GFS), Open-Meteo | the GFS 0.25° forecast's 10 m wind, fetched through the [Open-Meteo API](https://open-meteo.com) (data under CC BY 4.0), interpolated to the mesh by `just grid`; the sea is estimated from it (Pierson and Moskowitz, 1964), not modelled | GFS: US government work, public domain; Open-Meteo: CC BY 4.0 |
| `public/audio/radio/ocean-memory.mp3`, on piabrota RADIO | HoliznaCC0 | "Ocean Memory" on [Free Music Archive](https://freemusicarchive.org/music/holiznacc0/ocean-memory-lo-fi-chill/ocean-memory/), normalized to -18 LUFS, 96 kb/s | CC0 1.0 |
| `public/audio/radio/washed-up.mp3`, on piabrota RADIO | HoliznaCC0 | "Washed Up" on [Free Music Archive](https://freemusicarchive.org/music/holiznacc0/ocean-memory-lo-fi-chill/washed-up/), normalized to -18 LUFS, 96 kb/s | CC0 1.0 |
| `public/audio/radio/ease-into-night.mp3`, on piabrota RADIO | HoliznaCC0 | "Ease into Night" on [Free Music Archive](https://freemusicarchive.org/music/holiznacc0/public-domain-lofi/ease-into-night-lofi-relax-chill/), normalized to -18 LUFS, 96 kb/s | CC0 1.0 |
| `public/audio/radio/moon-unit.mp3`, on piabrota RADIO | HoliznaCC0 | "Moon Unit" on [Free Music Archive](https://freemusicarchive.org/music/holiznacc0/public-domain-lofi/moon-unit-lofi-reflection-dreamy/), normalized to -18 LUFS, 96 kb/s | CC0 1.0 |
| `public/audio/radio/roof-tops.mp3`, on piabrota RADIO | HoliznaCC0 | "Roof Tops" on [Free Music Archive](https://freemusicarchive.org/music/holiznacc0/summer-air-lo-fi/roof-tops/), normalized to -18 LUFS, 96 kb/s | CC0 1.0 |
| `public/audio/radio/tranquil-mindscape.mp3`, on piabrota RADIO | HoliznaCC0 | "Tranquil Mindscape" on [Free Music Archive](https://freemusicarchive.org/music/holiznacc0/public-domain-lofi/tranquil-mindscape-lofi-happy-reflection/), normalized to -18 LUFS, 96 kb/s | CC0 1.0 |
| `public/audio/radio/fractured.mp3`, on piabrota RADIO | HoliznaCC0 | "Fractured" on [Free Music Archive](https://freemusicarchive.org/music/holiznacc0/public-domain-lofi/fractured-1/), normalized to -18 LUFS, 96 kb/s | CC0 1.0 |
| `public/audio/radio/bubbles.mp3`, on piabrota RADIO | HoliznaCC0 | "Bubbles" on [Free Music Archive](https://freemusicarchive.org/music/holiznacc0/public-domain-lofi/bubbles-lofi-bright-relaxed/), normalized to -18 LUFS, 96 kb/s | CC0 1.0 |
| `public/audio/radio/still-life.mp3`, on piabrota RADIO | HoliznaCC0 | "Still Life" on [Free Music Archive](https://freemusicarchive.org/music/holiznacc0/public-domain-lofi/still-life-lofi-chill-nostalgic/), normalized to -18 LUFS, 96 kb/s | CC0 1.0 |
| `public/audio/radio/when-time-called-me-darling.mp3`, on piabrota RADIO | HoliznaCC0 | "When Time Called Me Darling" on [Free Music Archive](https://freemusicarchive.org/music/holiznacc0/public-domain-lofi/when-time-called-me-darling-lofi-relaxing-chill/), normalized to -18 LUFS, 96 kb/s | CC0 1.0 |
| `public/audio/radio/calm-currents.mp3`, on piabrota RADIO | HoliznaCC0 | "Calm Currents" on [Free Music Archive](https://freemusicarchive.org/music/holiznacc0/public-domain-lofi/calm-currents-lofi-relax-calm/), normalized to -18 LUFS, 96 kb/s | CC0 1.0 |
| `public/audio/radio/one-night-in-france.mp3`, on piabrota RADIO | HoliznaCC0 | "One Night In France" on [Free Music Archive](https://freemusicarchive.org/music/holiznacc0/public-domain-lofi/one-night-in-france-lofi-nostalgic-chill/), normalized to -18 LUFS, 96 kb/s | CC0 1.0 |
| `public/audio/radio/canon-event.mp3`, on piabrota RADIO | HoliznaCC0 | "Canon Event" on [Free Music Archive](https://freemusicarchive.org/music/holiznacc0/public-domain-lofi/canon-event-lofi-sad-reflection/), normalized to -18 LUFS, 96 kb/s | CC0 1.0 |
| `public/audio/radio/birds.mp3`, on piabrota RADIO | HoliznaCC0 | "Birds" on [Free Music Archive](https://freemusicarchive.org/music/holiznacc0/public-domain-lofi/birds-lofi-chill/), normalized to -18 LUFS, 96 kb/s | CC0 1.0 |
| `public/audio/radio/waiting-around.mp3`, on piabrota RADIO | HoliznaCC0 | "Waiting Around" on [Free Music Archive](https://freemusicarchive.org/music/holiznacc0/public-domain-lofi/waiting-around-lofi-calm/), normalized to -18 LUFS, 96 kb/s | CC0 1.0 |
| `public/audio/radio/doodles.mp3`, on piabrota RADIO | HoliznaCC0 | "Doodles" on [Free Music Archive](https://freemusicarchive.org/music/holiznacc0/public-domain-lofi/doodles-lofi-happy-mp3/), normalized to -18 LUFS, 96 kb/s | CC0 1.0 |
| `public/audio/radio/lucid.mp3`, on piabrota RADIO | HoliznaCC0 | "Lucid" on [Free Music Archive](https://freemusicarchive.org/music/holiznacc0/public-domain-lofi/lucid-lofi-dreamy-chill/), normalized to -18 LUFS, 96 kb/s | CC0 1.0 |
| `public/audio/radio/ghost-town.mp3`, on piabrota RADIO | HoliznaCC0 | "Ghost Town" on [Free Music Archive](https://freemusicarchive.org/music/holiznacc0/public-domain-lofi/ghost-town-1/), normalized to -18 LUFS, 96 kb/s | CC0 1.0 |
| `public/audio/radio/theta-frequency.mp3`, on piabrota RADIO | HoliznaCC0 | "Theta Frequency" on [Free Music Archive](https://freemusicarchive.org/music/holiznacc0/public-domain-lofi/theta-frequency-lofi-chill-calm/), normalized to -18 LUFS, 96 kb/s | CC0 1.0 |
| `public/audio/radio/tokyo-sunset.mp3`, on piabrota RADIO | HoliznaCC0 | "Tokyo Sunset" on [Free Music Archive](https://freemusicarchive.org/music/holiznacc0/public-domain-lofi/tokyo-sunset-lofi-peaceful-soft/), normalized to -18 LUFS, 96 kb/s | CC0 1.0 |
| `public/audio/radio/peaceful-drift.mp3`, on piabrota RADIO | HoliznaCC0 | "Peaceful Drift" on [Free Music Archive](https://freemusicarchive.org/music/holiznacc0/public-domain-lofi/peaceful-drift-lofi-nostalgic-calm/), normalized to -18 LUFS, 96 kb/s | CC0 1.0 |
| `public/audio/radio/reminders.mp3`, on piabrota RADIO | HoliznaCC0 | "Reminders" on [Free Music Archive](https://freemusicarchive.org/music/holiznacc0/public-domain-lofi/reminders-lofi-calm-nostalgic/), normalized to -18 LUFS, 96 kb/s | CC0 1.0 |
| `public/audio/radio/going-home.mp3`, on piabrota RADIO | HoliznaCC0 | "Going Home" on [Free Music Archive](https://freemusicarchive.org/music/holiznacc0/public-domain-lofi/going-home-2/), normalized to -18 LUFS, 96 kb/s | CC0 1.0 |
| `public/audio/radio/shimmer.mp3`, on piabrota RADIO | HoliznaCC0 | "Shimmer" on [Free Music Archive](https://freemusicarchive.org/music/holiznacc0/public-domain-lofi/shimmer-lofi-chill/), normalized to -18 LUFS, 96 kb/s | CC0 1.0 |
| `public/audio/radio/down-time.mp3`, on piabrota RADIO | HoliznaCC0 | "Down Time" on [Free Music Archive](https://freemusicarchive.org/music/holiznacc0/public-domain-lofi/down-time-lofi-peaceful-mp3/), normalized to -18 LUFS, 96 kb/s | CC0 1.0 |
| `public/audio/radio/warm-fuzz.mp3`, on piabrota RADIO | HoliznaCC0 | "Warm Fuzz" on [Free Music Archive](https://freemusicarchive.org/music/holiznacc0/public-domain-lofi/warm-fuzz-lofi-retro/), normalized to -18 LUFS, 96 kb/s | CC0 1.0 |
| `public/audio/radio/nine-to-death.mp3`, on piabrota RADIO | HoliznaCC0 | "Nine To Death" on [Free Music Archive](https://freemusicarchive.org/music/holiznacc0/public-domain-lofi/nine-to-death/), normalized to -18 LUFS, 96 kb/s | CC0 1.0 |
| `public/audio/radio/walking-away.mp3`, on piabrota RADIO | HoliznaCC0 | "Walking Away" on [Free Music Archive](https://freemusicarchive.org/music/holiznacc0/public-domain-lofi/walking-away-lofi-peaceful-motivating/), normalized to -18 LUFS, 96 kb/s | CC0 1.0 |
| `public/audio/radio/forgotten-keep-sakes.mp3`, on piabrota RADIO | HoliznaCC0 | "Forgotten Keep Sakes" on [Free Music Archive](https://freemusicarchive.org/music/holiznacc0/public-domain-lofi/forgotten-keep-sakes-lofi-sad-mp3/), normalized to -18 LUFS, 96 kb/s | CC0 1.0 |
| `public/audio/radio/when-i-was-human.mp3`, on piabrota RADIO | HoliznaCC0 | "When I Was Human" on [Free Music Archive](https://freemusicarchive.org/music/holiznacc0/public-domain-lofi/when-i-was-human-lofi-chill/), normalized to -18 LUFS, 96 kb/s | CC0 1.0 |
| `public/audio/radio/one-good-day.mp3`, on piabrota RADIO | HoliznaCC0 | "One Good Day" on [Free Music Archive](https://freemusicarchive.org/music/holiznacc0/public-domain-lofi/one-good-day/), normalized to -18 LUFS, 96 kb/s | CC0 1.0 |
| `public/audio/radio/color-of-a-soul.mp3`, on piabrota RADIO | HoliznaCC0 | "Color Of A Soul" on [Free Music Archive](https://freemusicarchive.org/music/holiznacc0/public-domain-lofi/color-of-a-soul-lofi-calm-nostalgic/), normalized to -18 LUFS, 96 kb/s | CC0 1.0 |
| `public/audio/radio/before-everything.mp3`, on piabrota RADIO | HoliznaCC0 | "Before Everything" on [Free Music Archive](https://freemusicarchive.org/music/holiznacc0/public-domain-lofi/before-everything-lofi-nostalgic-mp3/), normalized to -18 LUFS, 96 kb/s | CC0 1.0 |
| `public/audio/radio/yet-again.mp3`, on piabrota RADIO | HoliznaCC0 | "Yet Again" on [Free Music Archive](https://freemusicarchive.org/music/holiznacc0/public-domain-lofi/yet-again-lofi-peaceful/), normalized to -18 LUFS, 96 kb/s | CC0 1.0 |
| `public/audio/radio/ode-to-forgetting.mp3`, on piabrota RADIO | HoliznaCC0 | "Ode To Forgetting" on [Free Music Archive](https://freemusicarchive.org/music/holiznacc0/public-domain-lofi/ode-to-forgetting-lofi-chill-relax/), normalized to -18 LUFS, 96 kb/s | CC0 1.0 |
| `public/audio/radio/brasil-urca.mp3`, on piabrota RADIO (lofi brasil) | the owner | "Urca, depois da chuva", written in code and rendered by `just brasil` (`scripts/brasil.mjs`) | CC BY 4.0 |
| `public/audio/radio/brasil-botafogo.mp3`, on piabrota RADIO (lofi brasil) | the owner | "Botafogo às duas", written in code and rendered by `just brasil` (`scripts/brasil.mjs`) | CC BY 4.0 |
| `public/audio/radio/brasil-leme.mp3`, on piabrota RADIO (lofi brasil) | the owner | "Leme, maré baixa", written in code and rendered by `just brasil` (`scripts/brasil.mjs`) | CC BY 4.0 |
| `public/audio/radio/brasil-santa-teresa.mp3`, on piabrota RADIO (lofi brasil) | the owner | "Bonde em Santa Teresa", written in code and rendered by `just brasil` (`scripts/brasil.mjs`) | CC BY 4.0 |
| `public/audio/radio/brasil-cafezinho-com-leite.mp3`, on piabrota RADIO (lofi brasil) | Popoi | "Cafezinho com Leite", Jamendo album 455155, as archived on [archive.org](https://archive.org/details/jamendo-455155), normalized to -18 LUFS, 96 kb/s | CC BY 3.0 |
| Fjalla One (titles), bundled from `@fontsource/fjalla-one` | Sorkin Type | [Fontsource](https://fontsource.org/fonts/fjalla-one) | OFL-1.1 |
| JetBrains Mono (interface), bundled from `@fontsource/jetbrains-mono` | JetBrains | [Fontsource](https://fontsource.org/fonts/jetbrains-mono) | OFL-1.1 |
| Permanent Marker (tape labels by hand), bundled from `@fontsource/permanent-marker` | Font Diner | [Fontsource](https://fontsource.org/fonts/permanent-marker) | Apache-2.0 |
| Monoton (the neon tape labels, the marola.dev tape), bundled from `@fontsource/monoton` | Vernon Adams | [Fontsource](https://fontsource.org/fonts/monoton) | OFL-1.1 |
| Press Start 2P (the pixel tape labels, the ouroboric-dev tape), bundled from `@fontsource/press-start-2p` | CodeMan38 | [Fontsource](https://fontsource.org/fonts/press-start-2p) | OFL-1.1 |
| VT323 (the terminal tape labels, the CV tape, the VCR clock), bundled from `@fontsource/vt323` | Peter Hull | [Fontsource](https://fontsource.org/fonts/vt323) | OFL-1.1 |
| Special Elite (the typed paper: the fax, the letter, the door's tag), bundled from `@fontsource/special-elite` | Astigmatic | [Fontsource](https://fontsource.org/fonts/special-elite) | Apache-2.0 |
| `public/favicon.svg`, the tab's icon: the piabrota eye | piabrota | `docs/drawings/eye.svg` of [piabrota/mu](https://github.com/piabrota/mu), the org's logo | the org's mark, not licensed for other uses (mu's `TRADEMARKS.md`) |
| The piabrota eye on the sign, drawn in code (`src/art.js`) after `docs/drawings/eye.svg` | piabrota | [piabrota/mu](https://github.com/piabrota/mu) | the org's mark, not licensed for other uses (mu's `TRADEMARKS.md`) |

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
