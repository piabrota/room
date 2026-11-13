---
name: room-mobile
description: Keep the 3D room light and smooth on phones, tablets and weak laptops. Use for any change to the renderer, post-processing, shadows, textures, per-frame work or what loads at start, and whenever someone says the room is slow, hot or heavy on mobile.
---

# The room on a phone

A phone draws three device pixels to each CSS pixel, on a GPU that shares its power budget with
the radio and the screen, and it slows itself down when it gets hot. Drawn like a laptop's, the room
was 780×1688 pixels through five passes, 60 times a second. Every rule here comes from that.

## The two looks (`src/quality.js`)

- `pick()` gives `lite` to a touch-only screen, a screen whose short side is 600 CSS px or less, a
  device with 2 GB or 2 cores or fewer, or the data saver; `full` to the rest. `?lite` and `?full`
  force one; `?record` is always `full`, so `just record` films the laptop.
- `lite`: pixel ratio 1.25 at most (stepping down to 0.75), 30 frames a second (`quality.fps`, the
  loop in `src/app.js` skips the others), no GTAO, 2× MSAA, 512 shadow maps with plain PCF,
  anisotropy 2, 150 motes of dust, a frame budget of 1/24 s.
- The adaptive quality in `src/post.js` steps down from where the look starts when the average
  frame passes `quality.budget`: occlusion, then pixel ratio, then bloom, then the grade. It never
  steps back up; a phone that got hot stays cool.
- `document.body.dataset.quality` says which look is on, for CSS and for a screenshot.

## Rules for a change

1. **Price it in pixels × passes.** A full-screen pass on a phone costs as much as the whole scene.
   A new pass is `full` only, or it runs at half resolution, or it replaces one.
2. **Nothing new every frame.** A canvas texture uploaded each frame (`needsUpdate = true`) costs a
   phone a few ms each time: redraw at 10 fps at most, as the drawn city does (`src/outside.js`), or
   on a change only. Shadows draw again only on `redrawShadows()`.
3. **Load what the visitor sees.** Heavy things load on the click that needs them: the tapes
   (`module: () => import(...)`), the grid's MapLibre, Spotify's iframe, the day photo by night
   (`want` in `src/outside.js`). A new asset over 200 kB loads lazily or has a reason in the PR.
4. **A new quality knob goes in both looks**, in `FULL` and `LITE`, with a line in the comment at
   the top of `src/quality.js`, and is read from `quality`, never from `devicePixelRatio` or
   `navigator` directly.
5. **Touch is not hover.** A tap must do what a hover and a click do (invariant 8); buttons are at
   least 44 px tall in an overlay (see `#lock .keys`).

## Measure

`just mobile` opens the built room as a phone (390×844, ratio 3, touch, CPU slowed 4×) and as a
laptop (1280×720, ratio 2) and prints, for each, the look, the bytes and the requests before the
room shows, when its code and its first pictures arrived, the time until it shows and until every
model is in, the size of the drawing buffer and the median time of a frame with the GPU's work in
it (`--load` leaves the frames out, `--net 4g` slows the line; the `room-load` skill). In this container the GPU is software (SwiftShader), so compare builds with each
other on the same machine, never with a phone. Put the before and after lines in the pull request.
`just mobile --device phone` measures one; `--url https://room.piabrota.art/` the live site.

For a real phone, see the `room-phone-test` skill.
