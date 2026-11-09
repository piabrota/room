# AGENTS.md

Guidance for AI coding agents (Claude Code first) working in this repository.

## What this is

A personal site that is a 3D room. The visitor switches between camera shots, hovers over
things to see what they are, puts a VHS tape into a VCR to play it on a TV, and hears the room.
It is built with Vite and three.js, as plain JavaScript modules, and ships as static files.

The idea comes from Felix Rieseberg (see [`CREDITS.md`](CREDITS.md)). The goal of this
repository, in the owner's words: understand how such a room is made, and build one "on my
own, with my assets, my signature, my sounds, my interaction".

## Invariants

These ten hold on every commit. A change that needs to break one changes this list first, in
its own pull request, and only the owner approves that. `just check` tests what a script can
test (`scripts/check.mjs`); the rest is on the reviewer.

1. **Every asset is the owner's own, or credited.** Models, textures, sounds, fonts and text
   in `public/` and `src/` are made by the owner, or come from a source whose licence allows
   it, with a row in [`CREDITS.md`](CREDITS.md) in the same commit. Nothing is copied from the
   reference room: not its code, its models, its sounds or its words. Assets ship with the
   site and load from `public/`; nothing is hotlinked from another host. The one exception
   is Spotify's Embed player for the owner's playlist (`config.playlist`): an iframe from
   `open.spotify.com/embed/`, made only after the visitor clicks for it, with the playlist's
   artists credited in `CREDITS.md` and on screen beside it. Nothing else of Spotify's loads,
   not its iFrame API script (the owner, 9 November 2026).
2. **The idea is credited to Felix Rieseberg, by name, in text only.** `README.md` and
   `CREDITS.md` name him as the origin of the idea. No file links to his site, his
   repositories or his issues, and no issue or pull request here links them either.
3. **`src/config.js` is the one file that makes the room someone's.** The signature (name,
   tagline, links), the camera shots, the tapes, the hotspots and the sounds are declared
   there. No other file hardcodes a name, a link, a label or a sound path. The signature is
   rendered as text (`src/signature.js`), never through `innerHTML`.
4. **Cameras are named shots, and the visitor is never lost.** Every view is a shot in
   `config.shots` or a Blender camera named `shot_*`, reachable from its button and its number
   key (1 to 9, and 0 for the tenth; at most ten shots, the owner, 6 November 2026). `Esc`
   always returns to `startShot`. Moves between shots are eased; there is
   no free orbit that can leave the room.
5. **Whatever can be clicked says so on hover.** Every interactive object is registered
   through `src/interact.js`: it shows a label and a glow on hover, and does one thing on
   click. A hotspot action is one of `shot`, `link`, `sfx`, `toggleLamp`, `toggleRadio`,
   `playlist` (opens the Spotify player of invariant 1), `door` (the lock's keypad, `src/lock.js`;
   the open door shuts on a click), `cat` (Nash stops, looks at you and meows); a new action is
   added to `src/app.js` and to the check together.
6. **A tape is a module with the tape contract.** Each tape is one file in `src/tapes/`,
   loaded lazily through `config.tapes`, with a unique `id`, a label, a colour and a mesh
   named `tape_<id>`. It exports `default { mount, frame, input?, stop? }` and draws only on
   the TV canvas it is given. `stop` releases everything the tape made (timers, audio nodes,
   listeners), so ejecting it leaves the room as it was.
7. **Sound starts only after the visitor asks, and never breaks the room.** Nothing plays
   before the click on "enter the room". The sound button mutes and unmutes everything,
   tapes included (they play through `audio.bus()`). The Spotify player plays its own sound,
   out of the room's reach, so it opens only on a click, the room's radio pauses while it is
   open, and the sound button off or `Esc` closes it and removes its iframe. Every sound in config has a synthesized
   `fallback`, so a missing or broken file is never an error. Loop beds are normalized to
   about -18 LUFS (`just audio`).
8. **The room always opens, on any device.** Without `room.glb` the placeholder room is
   built. Without WebGL, or with `?static`, the visitor gets the signature and the links as a
   plain page (`src/main.js`). With `prefers-reduced-motion` the camera cuts between shots and
   does not drift. The site works at phone width, and a tap does what a hover and a click do.
9. **The room stays light.** `room.glb` is at most 10 MB (bake the lighting, compress with
   Draco or meshopt), a sound at most 4 MB (`.mp3` or `.ogg`, no `.wav`), an image at most
   2 MB, and `public/` at most 25 MB. The radio's tracks (`public/audio/radio/`) do not count
   toward those 25 MB: they have their own 100 MB, each still at most 4 MB (the owner,
   6 November 2026). Keep draw calls under 100 and the frame rate smooth on a laptop; lighting
   is baked into textures and only meshes named `*_live` are lit in real time.
10. **One way to work: the justfile, on macOS or Nix.** Every task is a `just` recipe that
    runs the same with Node 20 or newer on macOS (Homebrew) and in `nix develop`
    ([`flake.nix`](flake.nix)). Dependencies are pinned in `package-lock.json` and installed
    with `npm ci`; nothing is installed globally. `just check` passes before every pull
    request, and the pull request says what it did not check (for example, how it looks in a
    real browser).

## Commands

| Command | What it does |
|---|---|
| `just` | lists the recipes |
| `just doctor` | checks Node, npm and ffmpeg |
| `just setup` | `npm ci` |
| `just dev` | the room at http://localhost:5173 |
| `just build` | the static site in `dist/` |
| `just preview` | serves `dist/` |
| `just check` | `scripts/check.mjs` (the invariants), then a build |
| `just record` | stills of every shot and a video of the four walls by night, each 5 s or more, navigating and clicking (`room.mp4`, and `room.webp` for the READMEs), into `docs/record/`; on the GPU on macOS, in software at 960×540 elsewhere |
| `just stills` | only the stills, into `docs/record/` (fast; use it while working) |
| `just record-grid` | only the ▲ grid's stills (the map, its temperature, each of its views) and `grid-views.mp4`, a clip that clicks each view, into `docs/record/` |
| `just light [day\|night] [shots]` | the mean brightness and the share of pixels burnt to white of every shot, by night and by day; fails above 1 % (`scripts/light.mjs`) |
| `just grid [--offline]` | the ▲ grid view's files in `public/grid/`: the coast's triangle mesh (Natural Earth, Delaunay) and 24 h of GFS wind with the sea it raises, and the sea's temperature from Copernicus Marine (OSTIA) (`scripts/grid.mjs`) |
| `just blow-light [files]` | whether the light of a video or a still is under control: fails when a frame has more than 0.25 % of its area near white (above 230) or 1 % glowing (above 200), thin text left out (`scripts/blow_light.sh`); `just record` runs it on `room.mp4` (the owner, 7 November 2026) |
| `just mobile [--device phone\|laptop] [--url <site>]` | what the room costs a phone (390×844, ratio 3, touch, CPU 4× slower) and a laptop: the look (`lite` or `full`), bytes before it shows, time to show, pixels drawn, ms a frame (`scripts/mobile.mjs`); compare builds, in software here |
| `just audio <file> <name>` | normalizes a sound into `public/audio/<name>.mp3` |
| `just brasil` | renders the "lofi brasil" station into `public/audio/radio/` (`scripts/brasil.mjs`) |
| `just listeners` | the radio's live listeners count on :8787; `just dev` passes `/live/` to it |
| `just compose [samples]` | makes the ambience, the VCR sounds and the piabrota tape from the field recordings in `samples/` (`scripts/compose.mjs`, `CREDITS.md`) |

On Nix, `nix develop` (or `direnv allow`, with `.envrc`) gives Node 22, just and ffmpeg. On
macOS without Nix, `brew install node just ffmpeg`.

## Files

| File | Job |
|---|---|
| `src/config.js` | the signature, the words of the buttons (`ui`), theme, shots, tapes, the rain, the radio's stations, the playlist (`playlist`: the ♫ button, the mixtape and Spotify's player, with its artists), the views from the window by day and by night, and the room's content: projects, bots, tyler-durden-bot's big board on the front wall (`wip`: its logo, its red bulbs), people, works with a DOI, the CV, the contact, the closed-source file, the door and its lock (`door`: the clues, a code counted from the lists), Nash the black cat (`cat`: his perches), the screen guard (`guard`), your feet, ▲ grid (its domain, presets, files, flow and words), hotspots, and `reading`, the words of the LOFI page (invariant 3) |
| `src/main.js` | entry: WebGL check, the LOFI/HIFI toggle, loads the room the first time HIFI shows (invariant 8); on `config.grid.host` (grid.piabrota.art) or with `?grid` the room opens on the ▲ grid map, and Esc steps into the room |
| `src/quality.js` | the two looks, `full` and `lite` (phones, tablets, weak machines): pixel ratio, frames a second, passes, shadow maps, anisotropy, dust; `?lite`, `?full` |
| `src/guard.js` | the screen guard: black on PrintScreen and while the window is away, no selection or context menu in the room, a blank print; off under `?record` and in a scripted browser |
| `src/cat.js` | Nash, the black cat: a few shapes, and a life of sitting, walking and jumping between the perches of `config.cat`, seeded so `just record` films the same walk; a click calls him. On the full look he walks rounded paths around the furniture, eased, turns before he sets off, sits where his body fits and leaps on parabolas that clear the room; on the lite look (phones) he keeps the cheap straight-line life |
| `src/catnav.js` | where Nash can go, read once from the room's triangles on the full look: the floor cells something stands on, the floor's height, the filled voxels; A* paths pulled straight, and leaps tried against the room |
| `src/lock.js` | the door's lock: a keypad over the room, the clues of `config.door.lock`, the right code opens the door |
| `src/lofi.js` | the LOFI view, a page to read: home, about, work, posts, online, subscribe, from `config.reading` and `posts/`, on hash routes (`#/posts/<slug>`) |
| `src/markdown.js` | reads a post: front matter, then Markdown into DOM nodes with `textContent`, never `innerHTML` |
| `posts/*.md` | the posts of LOFI, one file each, `YYYY-MM-DD-slug.md`, with `title`, `date` and `summary` (the check asks) |
| `scripts/feed.mjs` | the posts' RSS feed, `feed.xml` in the build (and in `just dev`) |
| `src/app.js` | wires the room: renderer, shots, tapes, hotspots, the enter gate, the loop |
| `src/room.js` | loads `public/models/room.glb` (meshopt-compressed or not), or builds the placeholder room from config, its static parts merged by material; the photographed wood of `public/textures/pbr/`; your feet under the camera (`buildBody`); the day and night light sets, the desk lamp at a third by day, the dust in the window's light, the rain on the glass, the leaves that sway |
| `src/art.js` | the placeholder room's pictures, drawn on canvases from config: frames, the eye sign, tyler-durden-bot's big board (the owner's pixel portrait, `wipBoardArt`), the window, photos, spines, the note, record sleeves and the slipbox's two cards, crates, the tape labels in their retro faces, plastic, the keyboard, the VCR's front, typed paper, the folder |
| `src/props.js` | the other walls: the marola-dev wave tank and its buoys, the ouroboric-dev crate belt, the slipbox (a crate of records, two side by side in front) |
| `src/outside.js` | Rio behind the window, in layers at their own distances: the night and day photographs of `config.outside`, the night's lights twinkling, trees in front; a drawn view when the night file is missing |
| `src/textures.js` | wood grain, floor planks and plaster, drawn on canvases |
| `src/post.js` | post-processing: MSAA HDR buffer, ambient occlusion (GTAO, off under `?record`), hover outline, bloom with a threshold for the night and one for the day (`setDay`), tone mapping (AgX, set in `src/app.js`), film grade; steps quality down when frames run long |
| `src/cameras.js` | named shots and the moves between them: quintic curves that keep the velocity when a new shot is picked mid-move, arcs, slerped turns, per-shot `fov`, damped parallax; `shot_*` cameras from the GLB |
| `src/interact.js` | raycast hover and click against the whole room (walls hide what is behind them), label cards with a hint, glow |
| `src/grid.js` | ▲ grid, the tenth view: the chart on the right wall, and the MapLibre map that opens over the room when its shot lands, the mesh drawn by a custom WebGL layer, coloured by the sea's height or its temperature, particles flowing where the waves travel, the hours played by the room's clock, and the presets: a row of buttons (`config.grid.presets`) that fit the map to Brasil, Rio de Janeiro, Bahia or Salvador |
| `src/tv.js` | the TV canvas and the tape contract; the CRT glass (bulge, corners, phosphor stripes) over it; how bright the picture is, for the TV's light |
| `src/tapes/*.js` | one tape each |
| `src/score.js` | the piabrota tape's score, played live by the tape and rendered by `just compose` |
| `src/player.js` | the owner's playlist in Spotify's Embed player, over the room: the iframe made on the click and removed on close, the artists beside it (invariants 1 and 7) |
| `src/radio.js` | piabrota RADIO: the stations of `config.radio`, one track after another through the room's sound, and the live listeners count |
| `src/audio.js` | ambience, one-shot sounds, the tape bus, synthesized fallbacks |
| `src/signature.js` | renders the signature as text |
| `scripts/check.mjs` | what `just check` tests |
| `scripts/record.mjs` | what `just record` and `just record-grid` make: the stills and the video for a pull request |
| `scripts/grid.mjs` | what `just grid` makes: `public/grid/` (land, mesh, frames, sst, run); `scripts/blosc.mjs` reads Copernicus Marine's zarr chunks (Blosc, LZ4) |
| `scripts/mobile.mjs` | what `just mobile` measures |
| `scripts/blow_light.sh` | what `just blow-light` measures, frame by frame, with ffmpeg: the share of a frame burnt or glowing white |
| `scripts/light.mjs` | what `just light` measures: how bright each shot is, and whether any burns to white |
| `scripts/brasil.mjs` | what `just brasil` makes: the four bossa-lofi pieces of the "lofi brasil" station |
| `scripts/listeners.mjs` | `just listeners`: the live listeners count, a small server with no dependency that runs beside the site (nix-os runs it on the host) |
| `docs/SURVEY.md` | a survey of 6 November 2026: other rooms, frameworks, animation, shaders, a faster `just record`, the ▲ grid view (WW3 on triangles), the day's white-out; its pictures are in `docs/survey/` |
| `.claude/skills/` | Claude skills for working here: `room-pr` (a pull request the owner's way), `room-light`, `room-content`, `room-shaders`, `ww3-grid` (the planned tenth view), `room-mobile` (the room on a phone: the two looks, the rules, `just mobile`), `room-phone-test` (checking it in emulation and on a real phone). They follow this file; where they differ, this file wins |
| `docs/CLAUDE_PROJECT.md`, `docs/CLAUDE_PROJECT.pt-BR.md` | how to set up the Claude Project that builds the room, on claude.ai; change both together. For people only: an agent working here does not act on them |

Mesh names the code looks for in `room.glb`: `screen`, `vcr`, `lamp` (and `lamp_bulb`, where the
light sits), `tape_<id>` for each tape, the `name` of each hotspot (`sign`, `note`, `window`,
`shelf`, `frame_<project>`, `bot_<id>`, `board_<wip id>`, `photo_<person>`, `book_<work>`, `tank`, `buoy_<repo>`, `cat` (Nash), `door_leaf` (the door's hinged leaf) and `door_beyond` (the light behind it),
`belt`, `crate`, `crate_<repo>`, `record_<id>`, `quote`, `radio` and its lit `radio_dial`, `mixtape` (the playlist), `door`, `fax`,
`fax_linkedin`, `folder_closed-source`, `letter_closed-source`, `chart`), and cameras
`shot_<name>`. An invisible hit box marked `userData.proxy` only counts when nothing real is under
the pointer.

The visitor moves with the shot buttons, the keys 1 to 9 and 0, `←` `→` for the next and the previous
shot, `Esc` for `startShot`, and a drag (mouse or finger) to look around from where they stand,
360° sideways and a little up and down; the next shot starts from that look, eased.

## Working here

- Read `src/config.js` first; most changes start and end there.
- A new tape: copy `src/tapes/hello.js`, add it to `config.tapes` with a `text` line for LOFI, add a `tape_<id>` mesh (the
  placeholder room makes one for each tape by itself), run `just check`.
- A new sound: `just audio recording.wav <name>`, then add it to `config.ambience` or
  `config.sfx` with a `fallback`.
- A new post: a Markdown file in `posts/`, named `YYYY-MM-DD-slug.md`, with `title`, `date` and
  `summary` in its front matter. LOFI lists it, newest first, and `feed.xml` carries it.
- A new radio track: lofi under CC0 or CC BY only. `just audio track.mp3 radio/<name>`, add it
  to a station's `tracks` in `config.radio` with `fallback: 'lofi'`, and a row to `CREDITS.md`
  (the check asks). A new station is one more entry in `config.radio.stations`.
- The room is made to be forked: a word, a list, a track or a picture that makes it someone's goes
  in `src/config.js`, never in the code.
- A new model: export from Blender as glTF binary to `public/models/room.glb`, with the mesh
  names above. Check the size before you commit it.
- Every pull request that changes the site carries at least three screenshots of the room and
  a video of about 15 seconds of navigating and clicking on things (the owner, 5 November 2026).
  `just record` makes both in `docs/record/` (headless Chrome, stepped at a fixed 1/30 s per
  frame, so the video shows the motion a visitor sees); commit them and show them in the pull
  request.
- After a change you cannot see from the terminal (look, motion, sound), say so in the pull
  request, or check it in a headless browser and attach a screenshot.
- Every pull request that changes the site adds its prompt to the replay in `README.md` and
  `README.pt-BR.md`: a row in the table (prompt time in UTC, the pull request and what it did,
  how long it took) and the prompt as typed, in a `text` block (the owner, 6 November 2026).
- Work on a branch and open a pull request; do not push to `main`.
