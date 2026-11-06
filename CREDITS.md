# Credits

## The idea

The idea of a personal site that is a 3D room, with camera shots, things to hover and VHS
tapes that play on a TV, comes from **Felix Rieseberg**, who built one for his own site and
wrote about how he made it. This repository is a separate work: no code, model, texture,
sound or text of his is used here.

## Assets

Everything in `public/` is the owner's own, unless a row below says otherwise. A third-party
asset gets a row here in the same commit that adds it.

| File | Author | Source | Licence |
|---|---|---|---|
| `public/audio/ambience.mp3` | klankbeeld, with the owner's edit | "city hum 3am winter 140217_0090" (freesound 219877) and "traffic along flat LONG 130104_00" (freesound 174242), cut, mixed, looped and normalized by `just compose` | CC BY 4.0 |
| `public/audio/rain.mp3` | YleArkisto, with the owner's edit | "Sade ikkunalaudalle / Rain on a metal windowsill" (freesound 350358), cut, looped and normalized | CC BY 4.0 |
| `public/audio/eject.mp3` | magedu, with the owner's edit | "video_recorder_eject_cassette" (freesound 267832), trimmed and normalized | CC BY 4.0 |
| `public/audio/insert.mp3` | magedu, with the owner's edit | the same recording, reversed | CC BY 4.0 |
| `public/audio/tape-piabrota.mp3` | the owner; klankbeeld, YleArkisto and magedu | the score of `src/score.js`, mixed with freesound 350358, 219877 and 267832 by `just compose` | CC BY 4.0 |
| `public/textures/rio-night.jpg`, the view from the window | Wilfredor | "Rio de Janeiro at night from above, Rio de Janeiro.jpg" on [Wikimedia Commons](https://commons.wikimedia.org/wiki/File:Rio_de_Janeiro_at_night_from_above,_Rio_de_Janeiro.jpg), resized to 1920 px | CC0 1.0 |
| `public/audio/radio/ocean-memory.mp3`, on piabrota RADIO | HoliznaCC0 | "Ocean Memory" on [Free Music Archive](https://freemusicarchive.org/music/holiznacc0/ocean-memory-lo-fi-chill/ocean-memory/), normalized to -18 LUFS and encoded at 96 kb/s | CC0 1.0 |
| `public/audio/radio/washed-up.mp3`, on piabrota RADIO | HoliznaCC0 | "Washed Up" on [Free Music Archive](https://freemusicarchive.org/music/holiznacc0/ocean-memory-lo-fi-chill/washed-up/), normalized to -18 LUFS and encoded at 96 kb/s | CC0 1.0 |
| `public/audio/radio/ease-into-night.mp3`, on piabrota RADIO | HoliznaCC0 | "Ease into Night" on [Free Music Archive](https://freemusicarchive.org/music/holiznacc0/public-domain-lofi/ease-into-night-lofi-relax-chill/), normalized to -18 LUFS and encoded at 96 kb/s | CC0 1.0 |
| `public/audio/radio/moon-unit.mp3`, on piabrota RADIO | HoliznaCC0 | "Moon Unit" on [Free Music Archive](https://freemusicarchive.org/music/holiznacc0/public-domain-lofi/moon-unit-lofi-reflection-dreamy/), normalized to -18 LUFS and encoded at 96 kb/s | CC0 1.0 |
| `public/audio/radio/roof-tops.mp3`, on piabrota RADIO | HoliznaCC0 | "Roof Tops" on [Free Music Archive](https://freemusicarchive.org/music/holiznacc0/summer-air-lo-fi/roof-tops/), normalized to -18 LUFS and encoded at 96 kb/s | CC0 1.0 |
| Fjalla One (titles), bundled from `@fontsource/fjalla-one` | Sorkin Type | [Fontsource](https://fontsource.org/fonts/fjalla-one) | OFL-1.1 |
| JetBrains Mono (interface), bundled from `@fontsource/jetbrains-mono` | JetBrains | [Fontsource](https://fontsource.org/fonts/jetbrains-mono) | OFL-1.1 |
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
