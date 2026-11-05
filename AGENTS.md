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
   site and load from `public/`; nothing is hotlinked from another host.
2. **The idea is credited to Felix Rieseberg, by name, in text only.** `README.md` and
   `CREDITS.md` name him as the origin of the idea. No file links to his site, his
   repositories or his issues, and no issue or pull request here links them either.
3. **`src/config.js` is the one file that makes the room someone's.** The signature (name,
   tagline, links), the camera shots, the tapes, the hotspots and the sounds are declared
   there. No other file hardcodes a name, a link, a label or a sound path. The signature is
   rendered as text (`src/signature.js`), never through `innerHTML`.
4. **Cameras are named shots, and the visitor is never lost.** Every view is a shot in
   `config.shots` or a Blender camera named `shot_*`, reachable from its button and its number
   key (1 to 9). `Esc` always returns to `startShot`. Moves between shots are eased; there is
   no free orbit that can leave the room.
5. **Whatever can be clicked says so on hover.** Every interactive object is registered
   through `src/interact.js`: it shows a label and a glow on hover, and does one thing on
   click. A hotspot action is one of `shot`, `link`, `sfx`, `toggleLamp`; a new action is
   added to `src/app.js` and to the check together.
6. **A tape is a module with the tape contract.** Each tape is one file in `src/tapes/`,
   loaded lazily through `config.tapes`, with a unique `id`, a label, a colour and a mesh
   named `tape_<id>`. It exports `default { mount, frame, input?, stop? }` and draws only on
   the TV canvas it is given. `stop` releases everything the tape made (timers, audio nodes,
   listeners), so ejecting it leaves the room as it was.
7. **Sound starts only after the visitor asks, and never breaks the room.** Nothing plays
   before the click on "enter the room". The sound button mutes and unmutes everything,
   tapes included (they play through `audio.bus()`). Every sound in config has a synthesized
   `fallback`, so a missing or broken file is never an error. Loop beds are normalized to
   about -18 LUFS (`just audio`).
8. **The room always opens, on any device.** Without `room.glb` the placeholder room is
   built. Without WebGL, or with `?static`, the visitor gets the signature and the links as a
   plain page (`src/main.js`). With `prefers-reduced-motion` the camera cuts between shots and
   does not drift. The site works at phone width, and a tap does what a hover and a click do.
9. **The room stays light.** `room.glb` is at most 10 MB (bake the lighting, compress with
   Draco or meshopt), a sound at most 4 MB (`.mp3` or `.ogg`, no `.wav`), an image at most
   2 MB, and `public/` at most 25 MB. Keep draw calls under 100 and the frame rate smooth on a
   laptop; lighting is baked into textures and only meshes named `*_live` are lit in real
   time.
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
| `just audio <file> <name>` | normalizes a sound into `public/audio/<name>.mp3` |

On Nix, `nix develop` (or `direnv allow`, with `.envrc`) gives Node 22, just and ffmpeg. On
macOS without Nix, `brew install node just ffmpeg`.

## Files

| File | Job |
|---|---|
| `src/config.js` | the signature, shots, tapes, hotspots and sounds (invariant 3) |
| `src/main.js` | entry: WebGL check, then the room or the static page (invariant 8) |
| `src/app.js` | wires the room: renderer, shots, tapes, hotspots, the enter gate, the loop |
| `src/room.js` | loads `public/models/room.glb`, or builds the placeholder room |
| `src/cameras.js` | named shots, eased moves, mouse parallax, `shot_*` cameras from the GLB |
| `src/interact.js` | raycast hover and click, labels and glow |
| `src/tv.js` | the TV canvas and the tape contract |
| `src/tapes/*.js` | one tape each |
| `src/audio.js` | ambience, one-shot sounds, the tape bus, synthesized fallbacks |
| `src/signature.js` | renders the signature as text |
| `scripts/check.mjs` | what `just check` tests |

Mesh names the code looks for in `room.glb`: `screen`, `vcr`, `lamp`, `tape_<id>` for each
tape, the `name` of each hotspot, and cameras `shot_<name>`.

## Working here

- Read `src/config.js` first; most changes start and end there.
- A new tape: copy `src/tapes/hello.js`, add it to `config.tapes`, add a `tape_<id>` mesh (the
  placeholder room makes one for each tape by itself), run `just check`.
- A new sound: `just audio recording.wav <name>`, then add it to `config.ambience` or
  `config.sfx` with a `fallback`.
- A new model: export from Blender as glTF binary to `public/models/room.glb`, with the mesh
  names above. Check the size before you commit it.
- After a change you cannot see from the terminal (look, motion, sound), say so in the pull
  request, or check it in a headless browser and attach a screenshot.
- Work on a branch and open a pull request; do not push to `main`.
