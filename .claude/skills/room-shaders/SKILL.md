---
name: room-shaders
description: Write the room's own shaders, materials, textures and small animations (CRT glass, dust, rain on glass, baked light) within its budgets. Use when making the room look or move more real.
---

# Our own shaders and materials

Read `docs/SURVEY.md`, sections 3 and 4, for the options and their licences. What already exists
to copy from:

- `src/tv.js`, `crt()`: extends three's own material with `onBeforeCompile`, replacing
  `#include <map_fragment>`. This keeps lighting, fog and tone mapping and adds a few lines.
  Prefer this (or THREE-CustomShaderMaterial, MIT) over a bare `ShaderMaterial`.
- `src/room.js`, `buildDust()`: a `Points` cloud animated in the vertex shader from one `time`
  uniform. One draw call.
- `src/outside.js`: the twinkling city lights, the same pattern.
- `src/art.js`, `src/textures.js`: textures drawn on canvases from config.
- `public/textures/pbr/`: photographed wood from Poly Haven (CC0), colour, normal, roughness.

## Rules

1. **Time comes from the room's clock** (`room.update(elapsed)`), never `performance.now()`, so
   `just record` films the same frame every run.
2. **Reduced motion** (invariant 8): anything that drifts stays still under
   `prefers-reduced-motion: reduce`.
3. **Budgets** (invariant 9): under 100 draw calls, an image at most 2 MB, `public/` at most
   25 MB. Merge static geometry by material (the placeholder room does), compress textures to
   KTX2 with glTF-Transform when a model arrives.
4. **Bloom**: an emissive that should glow at night must be above 0.92 in linear light; by day
   only above 3 glows (the `room-light` skill). Keep particles and decals well under that.
5. **Assets** are the owner's or credited in `CREDITS.md` in the same commit (invariant 1). Our
   own photographs of real surfaces (a desk, a VHS label) make the best textures: shoot flat, in
   shade, with a grey card, and build the PBR set in Material Maker (MIT).
6. Baking in Blender is the long-term answer for realism (invariant 9): bake a night and a day
   into the base colour, mix them with a `uDay` uniform, keep only `*_live` meshes lit.

7. **`pow()` never takes a base that can be negative.** GLSL leaves it undefined. The software
   renderer of `just peek` and `just record` answers it kindly, so the still looks right;
   Direct3D and Metal answer "not a number", and one such pixel or vertex is black on the
   visitor's screen and spreads through the bloom and the occlusion (the water balloon's crater,
   11 November 2026). Write a square as a product (`x * x`, never `pow(x, 2.0)`; `just check`
   refuses it), and clamp what goes into the others: `pow(max(x, 0.0), y)`, and
   `clamp(dot(n, v), 0.0, 1.0)` before a Fresnel term, because the dot of two unit vectors can
   pass 1 by a rounding. Keep the edges of `smoothstep` in order, and an alpha at most 1.
   `just peek --strict` draws as such a GPU does and fails when a pixel is not a number: run it
   on every new shader, at the moments it is on screen.

After a visible change: `just light` for brightness, `just stills` to look, and the `room-pr`
skill for the pull request.
