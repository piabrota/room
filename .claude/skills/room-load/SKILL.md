---
name: room-load
description: Keep the time until the room shows short - what loads before the first frame, what waits, fonts, caching and the device's share. Use when someone says the site is slow to open, or a change adds a file, a font or a dependency that loads at start.
---

# How fast the room opens

The visitor sees the LOFI text at once (`src/main.js`), and the 3D room when `#loading` gets the
class `done` and `performance.mark('room:shown')` runs (`src/app.js`). Everything before that mark
is time the visitor waits.

## Measure

```sh
just build
just mobile --bytes          # phone and laptop: the look, the files, the MB before the room shows, the 12 biggest files
just mobile --url https://room.piabrota.art/   # the live site
```

Put the line before and after your change in the pull request. Times here are software
rendering: compare builds, not devices.

## What may load before the room shows

1. The page, the room's JavaScript (`app` and three.js), the fonts the canvases draw with, the
   surfaces of the walls and the floor at the device's size, and the night or the day photo.
2. Nothing else. After the mark: the furniture (`room.furnish()`, four files at a time), the fish,
   the ▲ grid chart's mesh (`room:shown` event). On a click: tapes, MapLibre, Spotify's iframe,
   the radio's tracks, the door's lock.
3. A new file over 200 kB that the first frame does not need loads after the mark, or on the click
   that needs it.

## The device's share (`src/quality.js`)

The look (`full`, `lite`) and the files (`files`: `full`, `lite`) are chosen apart. A phone takes
the lite look and the small files; a laptop with a short side under 1000 device pixels, or on a
2G or 3G line, takes the full look with the small files. `?small` and `?large` force the files.
A new asset that has a size gets both files (the `room-assets` skill) and reads `quality.files`.

## Rules

- **Vite hashes everything under `/assets/`**: nix-os serves it `immutable` for a year. A file in
  `public/` keeps its name, so a changed model needs a new name or it may be served stale.
- **Fonts**: only the `latin-400` subsets, as `woff2`. A new face costs 20 to 60 kB before the room.
- **No new dependency in the room's start path** without its size in the pull request
  (`just build` prints each chunk). Heavy libraries are `import()`ed on use, as MapLibre is.
- **The first frame compiles every shader** (`compileAsync`): a material that only exists later
  should be made later, too.
- **`just record` waits for everything** (`?record`): the stills and the video show the furnished
  room, so they do not show what a visitor sees in the first seconds. Say so when it matters.

Then `room-mobile` for the frame on a phone and `room-pr` for the pull request.
