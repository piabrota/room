---
name: room-content
description: Add or change what is in the room - a tape, a sound, a radio track, a texture or photo, a hotspot, a shot - keeping config.js as the one personal file and every asset credited. Use when the room gets new content.
---

# New things in the room

Start in `src/config.js`: it is the one file that makes the room someone's (invariant 3). No
other file hardcodes a name, a link, a label or a sound path.

| Adding | Steps |
|---|---|
| a tape | copy `src/tapes/hello.js` to `src/tapes/<id>.js`; it exports `default { mount, frame, input?, stop? }`, draws only on the canvas it is given, plays only through `audio.bus()`, and `stop` frees every timer, node and listener (invariant 6). Add it to `config.tapes` with `id`, `label`, `color`, `text` (for LOFI), `spine` and `module: () => import(...)`. The placeholder room makes the `tape_<id>` mesh |
| a sound | `just audio recording.wav <name>` (normalized to -18 LUFS, `.mp3`), then `config.ambience` or `config.sfx` with a synthesized `fallback` (invariant 7). At most 4 MB |
| a radio track | written in Csound: a score `music/<name>.sco` for the band of `music/lofi.orc`; `just lofi <name>` (in `nix develop`); a station's `tracks` with `fallback: 'lofi'`; a row in `CREDITS.md` (the check asks). The radio has its own 100 MB |
| a texture or photo | at most 2 MB, in `public/textures/`; a row in `CREDITS.md` naming the author, the source and the licence, in the same commit. Nothing hotlinked (invariant 1) |
| a hotspot | an entry in `config.hotspots` with `name` (the mesh), `label`, `hint` and one `action`: `shot`, `link`, `sfx`, `toggleLamp`, `toggleRadio`, `playlist`, `door`, `cat`, `credits`. A new action is added to `src/app.js` and to `scripts/check.mjs` together (invariant 5) |
| a piece of furniture or a prop | only CC0, from Poly Haven: its id in `scripts/models.json` (the parts to keep, how far to thin it, the size of its textures), `just models <id>` (it writes `<id>.glb`, `<id>.lite.glb` and the row in `CREDITS.md`), its file in `config.models.files` (`phone: false` for a small prop), and `F.place(key, g, { at, rot, fit })` in `src/room.js` with its real size in metres and a plain stand-in. Look at it with `just peek` |
| a shot | `config.shots.<name>` with `position`, `target`, `fov`. At most ten, on keys 1 to 9 and 0 (invariant 4) |

Then `just check`, and the `room-pr` skill.

Credits: the idea is Felix Rieseberg's, credited by name in `README.md` and `CREDITS.md`, never
linked. Nothing is copied from his room: not code, models, sounds or words.
