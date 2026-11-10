---
name: room-threejs-perf
description: Find and fix what makes the room's three.js frame slow - draw calls, transparent and double-sided materials, shadows, shader stalls, per-frame work. Use when a shot is slow, a change adds meshes or materials, or `just peek` shows more than 100 draw calls.
---

# The room's frame

The room runs three.js r170 (`package.json`), so ignore advice written for r180 and later
(`THREE.Timer`, WebGPU counters). Measure first, change one thing, measure again.

## Measure

- `just peek --shot <name>` prints the draw calls of the room's own pass and of all passes, the
  triangles and the textures of one frame. `--calls` lists them thing by thing; `--lite` is the
  phone's look. The budget is under 100 draw calls in the room's pass (invariant 9).
- `just mobile` gives the median time of a frame with the GPU's work in it, for a phone and a
  laptop. In this container the GPU is software: compare builds, never absolute numbers.
- `window.__room.renderer.info.render` after a frame, in the console, for a quick look. Its
  counters reset at each `render()`; read them after it.

## What costs a draw call, and what to do

1. **One mesh, one call; one call per material group.** Static things of one material are merged
   (`part()` in `src/room.js` merges by material at the end). Use it for anything that never moves.
2. **Repeats are one `InstancedMesh`.** The fish, the school, the bubbles (`src/aquarium.js`). Move
   them with `setMatrixAt` and `instanceMatrix.needsUpdate`. An instanced mesh culls as one sphere:
   set `frustumCulled = false` when the instances move outside the first box.
3. **A blended material with `side: DoubleSide` draws twice** (back faces, then front). Give it
   `forceSinglePass: true` when the order inside one mesh does not matter (glass, water).
4. **`transmission > 0` draws every opaque thing again.** `src/furniture.js` turns a model's
   glass into a plain blended sheet for this reason. Never use transmission in the room.
5. **Each shadow-casting light draws its casters again.** `renderer.shadowMap.autoUpdate` is off:
   call `redrawShadows()` after a thing moves for good. A small prop does not cast (`shadow: false`).
6. **A new light recompiles every lit material.** Prefer an emissive surface. If a light is needed,
   reuse the room's or add it once at build time, never at run time.
7. **Moving vertices in a shader** (`onBeforeCompile`, the plants, the fish's wiggle) leaves the
   CPU's bounding sphere as it was: set `frustumCulled = false` on that mesh only.

## Per frame

- No `new` in `update(t)`: keep vectors, matrices and quaternions outside the loop.
- Time comes from the room's clock (`update(elapsed)`), never `performance.now()`, so
  `just record` films the same frame each time.
- A canvas texture uploaded every frame costs a phone milliseconds: redraw at 10 fps at most.
- `ui.update()` raycasts against the whole room. Mark an invisible helper `raycast = () => {}`
  (glass, water, a wall painting) or `userData.proxy` (a hit box).

## Shader stalls

`src/app.js` compiles every material with `renderer.compileAsync` and uploads every texture
before the first frame. A material made later (a model that arrives, a tape) compiles on its
first draw. Give each `onBeforeCompile` material a `customProgramCacheKey`, so materials that
share the hook share one program.

## Memory

A texture costs width × height × 4 bytes on the GPU, a third more with mipmaps, whatever its
file size. Size it to the screen it lands on (the `.lite` files, `src/quality.js`), and dispose
geometries and textures of a thing that leaves for good.

Then the `room-mobile` skill for the phone, and `room-pr` for the pull request.
