---
name: room-assets
description: Bring a 3D model, a texture or a photo into the room small enough for a phone - glTF-Transform, meshopt, WebP, the full and lite files, the licence and the credit. Use when adding or re-encoding anything in public/models or public/textures, or when a file is over budget.
---

# An asset for the room

Invariant 1 first: only CC0 models (Poly Haven, the Khronos sample assets marked CC0), or the
owner's own, with a row in `CREDITS.md` in the same commit. Nothing is hotlinked.

## The two files

Every model is written twice into `public/models/`, and the room picks one per device
(`src/quality.js`, `files`):

| File | For | Textures | Mesh |
|---|---|---|---|
| `<name>.glb` | a laptop with a large screen | 1024 px WebP (512 for a small prop) | as made, or thinned a little |
| `<name>.lite.glb` | a phone, a small screen, a slow line | 512 px colour, 256 px normals | thinned more |

The same goes for a photo (`rio-night.jpg` and `rio-night.lite.jpg`, 1280 px) and a surface
(`<id>_diff.jpg` and `<id>_diff.lite.jpg`, 512 px, with no normal or roughness map).

## How to make them

- **Poly Haven:** add the id to `scripts/models.json` and run `just models <id>`. It fetches,
  keeps the parts you `pick`, thins (`ratio`, `liteRatio`), re-encodes the textures, packs with
  meshopt and writes the row of `CREDITS.md`.
- **Another CC0 source:** a small script in the shape of `scripts/fish.mjs` (`just fish`): pin the
  source to a commit, keep the download in `node_modules/.models/`, write both files, add the row
  by hand.
- The order matters with glTF-Transform: `dedup`, `prune`, `weld`, then `simplify`, then the
  textures, and `meshopt` last. Any step after `meshopt` that reads the file decodes it again.
- Drop what the room does not use: metal-roughness and occlusion maps on a matte prop, a normal
  map on the lite file, cameras and lights in the file.
- Textures: WebP in a model, JPEG (mozjpeg) for a surface. KTX2 would stay compressed in GPU
  memory, but its files are no smaller and its transcoder is 260 kB more; AVIF made from the WebP
  is no smaller at a quality that does not show (the `room-load` skill has the numbers). Add
  either only with a measurement in the pull request.
- A file of `public/` is asked for through `asset(path)` (`src/files.js`) or `image(path)`
  (`src/first.js`), never by its bare path: the address then carries the file's hash, and the
  host lets the browser keep it. A changed model needs no new name.

## Budgets (invariant 9)

A model file well under 1 MB (the furniture is 70 to 700 kB), an image at most 2 MB, `public/`
at most 25 MB without the radio. Check before you commit:

```sh
du -sh public public/models public/textures
just check
```

## In the room

- Furniture: `F.place(key, parent, { at, rot, fit })` in `src/room.js`, sizes in metres, a
  stand-in until the file comes. A small prop is `phone: false` in `config.models.files`.
- Anything else from a file (the fish): `F.load(key)`, which waits until the room is on screen.
- Nothing is fetched before the room shows (`room.furnish()` in `src/app.js`): check it with
  `just mobile --load --bytes`, which lists what was downloaded before. A picture the first frame
  shows goes in `firstFiles` (`src/first.js`), and `just check` counts it against the budget.
- Look at it with `just peek --shot <name>` and `--lite`.
