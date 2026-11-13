---
name: room-load
description: Keep the time until the room shows short - what loads before the first frame, what waits, fonts, caching, compression and the device's share. Use when someone says the site is slow to open, or a change adds a file, a font or a dependency that loads at start.
---

# How fast the room opens

The visitor sees the LOFI text at once (`src/main.js`), and the 3D room when `#loading` gets the
class `done` and `performance.mark('room:shown')` runs (`src/app.js`). Everything before that mark
is time the visitor waits. By then one whole frame has been drawn behind the cover, so the room
is on the screen the moment the cover lifts.

## Measure

```sh
just build
just load-budget                  # no browser: what loads before the room shows, against scripts/budget.json
just mobile --load --bytes        # phone and laptop in a browser: bytes, requests, when each part arrived
just mobile --load --net 4g       # on a 4G line (`slow4g` too); --runs 3 gives the spread
just mobile --load --budget       # fails when more was downloaded than the budget allows
just mobile --load --again --host today   # and a second visit, on the host as nix-os has it (`--host proposed`, the default: Brotli, `?v=` kept for good)
just mobile --url https://room.piabrota.art/   # the live site
```

Put the line before and after your change in the pull request. The clock here is mostly
software drawing, and other jobs share the machine: trust, in this order, the bytes, the
requests, when the code and the first pictures arrived on a throttled line, and the processor's
seconds. A wall-clock time needs three runs and its spread.

## What may load before the room shows

1. **What the room waits for** (`waits` in the budget, about 590 kB): the page, the room's
   JavaScript (`app`, three.js, `config`), the seven fonts the canvases draw with, and the
   surfaces' small colours (`quickFiles` in `src/first.js`, 80 kB, at most 0.8 s of waiting).
2. **What it shows as it comes**: the surfaces' full maps on a large screen (1.4 MB) and the night
   or the day photo. Until a map is here its texture is one neutral pixel (`pbr` in `src/room.js`),
   so nothing is ever drawn black; the full map then takes the small one's place.
3. **Nothing else.** After the mark: the glTF loader's chunk, the furniture (`room.furnish()`, four
   files at a time, what the camera sees first), the fish, the ▲ grid chart's mesh (`room:shown`
   event, stroked in a worker). On a click: tapes, Spotify's iframe, the radio's tracks, the door's
   lock. On the pointer reaching the grid's button: MapLibre and the grid's files (`grid.warm()`).
4. A new file over 200 kB that the first frame does not need loads after the mark, or on the click
   that needs it. `just check` fails when the budget is passed: move the file, or raise the limit
   with `just load-budget --write` and say why in the pull request.

## How the start is ordered

The browser can only fetch what it knows of. Left alone it learns of the room's files one after
the other: the page, then `main.js`, then `app.js`, then the fonts, then the pictures. So:

- **The page's head asks for the room's code and fonts at once** (`firstLoad` in
  `vite.config.js`): `modulepreload` for the chunk of `src/app.js` and what it imports, `preload`
  for the `.woff2` files (with `crossorigin`, or they are fetched twice). Only when the 3D room
  will show: `?lofi` and a kept choice of LOFI download none of it. The lines of that script repeat
  the first lines of `src/main.js`; change both together.
- **`src/main.js` asks for the first frame's pictures** (`warm(firstFiles(...))`), while the room's
  code is still on its way. `src/first.js` is the one list of them; the room takes the same
  `<img>` elements through `image()`, so each is downloaded once. A new picture of the first frame
  goes in `firstFiles`.
- **No question to the host that the build can answer.** `missing(path)` (`src/files.js`) is true
  for a file the build did not find: no `HEAD` for a `room.glb` that is not there, no request for a
  sound still to be recorded.

## Shaders: compile once, for the right buffer

three.js makes a program for where its picture goes. Drawn to the screen it carries the tone
mapping and the sRGB output; drawn into the post-processing chain's HDR buffer it carries
neither. `renderer.compileAsync(scene, camera)` with no buffer set makes every program for the
screen: the room made 48 that way, never used one, and made 47 more in its first frame.
Always compile through `post.compile(what)` (`src/post.js`), which sets the chain's buffer first.
A model that arrives later is compiled the same way before it takes its stand-in's place
(`prepare` in `src/furniture.js`). Check with `renderer.info.programs.length` when the room shows
and a few frames later: the two numbers must be equal.

## Caching and compression (with nix-os)

- **Vite hashes everything under `/assets/`**: nix-os serves it `immutable` for a year. three.js is
  a chunk of its own, so it stays in the browser's cache when the room's code changes.
- **A file in `public/` keeps its name**, so the room asks for it as `asset(path)`
  (`src/files.js`): `/models/sofa.glb?v=1a2b3c4d`, the first 8 hex digits of its SHA-256, which the
  build puts in `__ROOM_FILES__`. nix-os serves an address with `?v=` as `immutable`; a changed
  file has a new address. Every load of a file of `public/` goes through `asset()` or `image()`.
- **The build writes `<file>.br` and `<file>.gz`** beside every file that shrinks (`precompress` in
  `vite.config.js`): the code, and the models and the grid's files too. nginx sends them in the
  file's place (`gzip_static`, and `brotli_static` once nix-os has Brotli on). A meshopt-packed
  `.glb` is made to be compressed once more on its way: its geometry shrinks, its pictures do not.
- **No service worker.** A worker that keeps the site can show an old site after a deploy; the
  hashed and versioned addresses give a second visit the same speed with no such risk.

## The device's share (`src/quality.js`)

The look (`full`, `lite`) and the files (`files`: `full`, `lite`) are chosen apart. A phone takes
the lite look and the small files; a laptop with a short side under 1000 device pixels, or on a
2G or 3G line, takes the full look with the small files. `?small` and `?large` force the files.
A new asset that has a size gets both files (the `room-assets` skill) and reads `quality.files`.

## Rules

- **Fonts**: only the `latin-400` subsets, as `woff2`. A new face costs 20 to 60 kB before the
  room, and the budget counts it. The CJK glyphs of the frames are the visitor's system fonts
  (`CJK` in `src/art.js`): nothing is downloaded for them.
- **No new dependency in the room's start path** without its size in the pull request
  (`just build` prints each chunk). Heavy libraries are `import()`ed on use, as MapLibre and the
  glTF loader are.
- **A long job on a canvas goes to a worker** when it can (the chart's mesh,
  `src/chart.worker.js`), with the page's own drawing as the fallback and under `?record`.
- **`just record` and `just peek` wait for everything** (`?record`, `room.settled`): the stills and
  the video show the furnished room, so they do not show what a visitor sees in the first
  seconds. Say so when it matters.
- **A texture format is chosen by measuring.** KTX2 keeps a texture compressed in the GPU's
  memory, but its files are no smaller than WebP's (UASTC is larger), and its transcoder is 260 kB
  more (gzip); AVIF made from the room's WebP textures is no smaller at a quality that does not show
  (measured 13 November 2026: 40 dB against the WebP needs as many bytes). Neither is in the room.

## Where the techniques come from

Ideas only; no text or code is copied from any of them.

| Technique | Source | Licence of the source |
|---|---|---|
| Preload what the browser discovers late (fonts with `crossorigin` and `type`, critical chunks), and only that | web.dev, "Preload critical assets to improve loading speed", https://web.dev/articles/preload-critical-assets | CC BY 4.0 (text), Apache-2.0 (samples) |
| A budget in bytes for what loads at the start (JavaScript, fonts, images), checked by a script | Addy Osmani, web-quality-skills (agent skills: performance, core-web-vitals), https://github.com/addyosmani/web-quality-skills | MIT |
| Which texture format for which use: WebP or AVIF for the smallest download, KTX2 (ETC1S, UASTC) for GPU memory; an image is decompressed before upload whatever its file format | Don McCurdy, "Choosing texture formats for WebGL and WebGPU applications", https://www.donmccurdy.com/2024/02/11/web-texture-formats/ | all rights reserved (read, not copied) |
| WebP files are smaller than their ETC1S KTX2; KTX2 is for VRAM | three.js forum, "WebP vs KTX2 for web textures", https://discourse.threejs.org/t/webp-vs-ktx2-for-web-textures/58651 | forum posts (read, not copied) |
| A meshopt-compressed file should still be compressed (deflate) by the server: the codecs are made for it | meshoptimizer, gltfpack's README, https://github.com/zeux/meshoptimizer/blob/master/gltf/README.md | MIT |
| A list of three.js rules for agents (loading and assets, disposal, shaders), read as a checklist | emalorenzo, three-agent-skills (the skill three-best-practices), https://github.com/emalorenzo/three-agent-skills | MIT |
| `brotli_static`, `gzip_static` and what NixOS's `recommendedBrotliSettings` turns on | nixpkgs, `nixos/modules/services/web-servers/nginx/default.nix`, https://github.com/NixOS/nixpkgs/blob/nixos-unstable/nixos/modules/services/web-servers/nginx/default.nix | MIT |
| Brotli in nginx on NixOS | "Brotlifying Nginx under NixOS", https://dee.underscore.world/blog/brotlifying-nginx/ | not stated (read, not copied) |
| A program is compiled for its render target's colour space and tone mapping; `compileAsync` | three.js r170's own source, `WebGLRenderer.compile` and `WebGLPrograms.getParameters` (`node_modules/three`) | MIT |

Then `room-mobile` for the frame on a phone and `room-pr` for the pull request.
