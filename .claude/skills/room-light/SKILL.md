---
name: room-light
description: Tune the room's light, bloom, tone mapping or day/night look without burning it to white. Use for any change to lights, exposure, bloom, emissive materials or src/post.js.
---

# The room's light

The chain, in `src/post.js` and `src/app.js`: the scene renders into a half-float MSAA buffer →
GTAO → outline → **bloom (`UnrealBloomPass`)** → `OutputPass` (tone mapping and sRGB) → a film
grade. Read `docs/SURVEY.md`, section 7, before changing any of it.

## What to know

- **Bloom sees linear light, before tone mapping.** Anything above its threshold glows. At night
  only emissive things pass 0.92. By day a lit white wall is 2 to 4, so the threshold rises with
  the day: `BLOOM.day` in `src/post.js`, applied by `post.setDay(on)`. Never lower the day
  threshold below about 2.5.
- **`toneMapped: false` does nothing here.** three tone-maps only when it draws to the screen;
  in the composer, `OutputPass` tone-maps the whole buffer. To keep something out of tone
  mapping, draw it after `OutputPass`.
- **Tone mapping is AgX at exposure 1.1**, day and night. The day is brighter because of its
  lights, not the camera. ACES in three divides exposure by 0.6, so do not compare exposures
  across tone mappers.
- **Lights are physical** (three r155+): a point light's intensity is in candela, and a
  directional light's in lux-like units. Day and night light sets are `DAY` and `NIGHT` in
  `src/room.js`. The desk lamp runs at 35 % by day (`lamp.userData.full`); the lamp button
  respects it.
- Invariant 9: lighting should end up baked in Blender (`useBakedLighting`), with only `*_live`
  meshes lit in real time. Real-time light tuning is for the placeholder room.

## How to work

1. Change one thing at a time.
2. `just light` (or `just light day desk slipbox`): every shot at 960×540, night and day, with
   the mean brightness (0 to 255) and the share of pixels burnt to white. It fails above 1 %.
   Frames land in `node_modules/.light/`: open them, numbers are not taste.
3. Keep night means around 30 to 75 and day means around 70 to 100 (as of 6 November 2026).
4. A light change changes the site: the pull request carries `just record`'s stills and video
   (see the `room-pr` skill) and says that it was judged in headless Chrome, not on a real screen.
