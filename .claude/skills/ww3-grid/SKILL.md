---
name: ww3-grid
description: Build the planned tenth view "▲ grid" - WAVEWATCH III on a triangle mesh of the Brazilian coast, forced by GFS, played back on a MapLibre map. Use for any work on the grid view, the WW3 run or its export.
---

# ▲ grid

The plan is `docs/SURVEY.md`, section 6. Read it first; this is the short form.

## What exists (#18)

- `src/grid.js`: the chart on the right wall and the MapLibre map, the mesh as a custom WebGL
  layer (`meshLayer`), play, the hour slider, hover. `config.grid` holds the domain, the files and
  every word.
- `scripts/grid.mjs` (`just grid`): Natural Earth land → coast nodes every `spacing[0]` km, ocean
  nodes in bands out to `reach` km → Delaunay → `public/grid/mesh.bin`; GFS 10 m wind through
  Open-Meteo on a 1° lattice → `frames.bin` (per hour: Hs[n], speed[n], from[n], Uint8).
  `--offline` reuses the cached wind in `node_modules/.grid/`. Open-Meteo allows 600 points a
  minute; the script waits.
- The sea in `frames.bin` is an estimate, Hs = 0.21 U²/g. Replacing it with WW3's Hs keeps the
  file format, and `config.grid.note` must then change.
- `sst.bin` (#19): the latest day of OSTIA from Copernicus Marine's public ARCO zarr store
  (`timeChunked.zarr`, chunks of 1 × 1024 × 1024, int16, Blosc LZ4 with byte shuffle, read by
  `scripts/blosc.mjs`), Uint16 in 0.01 °C per node, 65535 for none; `run.json.sst` names the day.
  If the store starts to ask for an account, the script warns and the view opens without it; the
  `copernicusmarine` toolbox (Python) with `COPERNICUSMARINE_SERVICE_USERNAME` and `_PASSWORD`
  is then the way. Credit "Generated using E.U. Copernicus Marine Service information" and "These
  data were provided by GHRSST and Met Office" (`CREDITS.md`, `config.grid.sources`).
- The flow (`flowField` in `src/grid.js`): particles advected on the mesh itself (a 0.1° raster
  says which triangle holds a point; barycentric weights give the velocity), towards the wind at
  the group speed. With WW3, drive it with the mean wave direction `dir` and `cg` from `ww3_ounf`
  instead, and say so in `config.grid.words.flow`.

## Credit

Triangle (unstructured) grids in WAVEWATCH III are the work of Dr. Aron Roland (with Fabrice
Ardhuin; Roland is not at NOAA, the owner confirmed the name on 6 November 2026). At NOAA, Dr. Ali
Abdolali (NWS/NCEP EMC) led the domain decomposition and the implicit scheme on them. Credit both
in `CREDITS.md` and in the view's words in `config.grid`. When the owner's own WW3 work (ww3-gpu)
is named, cite his six works with a DOI together, as `docs/SURVEY.md` does.

## Gates, before any code

1. **Invariant 4** gives the tenth shot key `0` (the owner, 6 November 2026). It is the last key.
2. **Invariant 1** forbids hotlinking: the basemap ships in `public/` (Natural Earth, public
   domain, or an OpenStreetMap PMTiles extract, ODbL, credited), zoom 0 to 8, inside 25 MB.

## The view

- `config.shots.grid` and `config.grid` (mesh files, run, words). Nothing hardcoded (invariant 3).
- MapLibre is a dynamic `import()`, loaded the first time the shot lands; the map fades in over
  the canvas; `Esc` and every other shot fade it out (invariant 4).
- The mesh is a MapLibre `CustomLayerInterface`: node positions in Mercator, triangle indices,
  and a texture of Hs (nodes × frames). A `t` uniform blends two frames on the GPU. Edges drawn
  thin on top: the view is about the grid.
- Hover a node: depth, Hs, Tp (invariant 5). LOFI: the run's date and a still.
- Start with a tiny made-up mesh and fake Hs, so the view, play and `Esc` work and `just record`
  shows it, before any WW3 run.

## The run, small on purpose

- About 15 000 nodes (OCSMesh, CC0, or oceanmesh), 50 km offshore to 3 km at the coast, Gmsh
  `.msh` v2; GEBCO bathymetry; 24 frequencies × 24 directions; ST4; explicit `EXPFSN`;
  600 s global step; 24 h, hourly output.
- Winds: GFS 0.25°, `UGRD`/`VGRD` at 10 m, 3-hourly, from NOMADS' grib filter or AWS Open Data;
  `wgrib2 -netcdf` or `cdo`, then `ww3_prnc`.
- `ww3_grid` (grid type `'UNST'`) → `ww3_shel` → `ww3_ounf`. Take the switches from
  `regtests/ww3_tp2.6` of the WW3 version you build; they changed between releases.
- Export to `public/grid/`: `mesh.bin` (Float32 lon/lat, Uint32 triangles), `hs.bin` (Uint8, Hs in
  5 cm steps, nodes × frames, about 375 kB), `run.json` (cycle, times, scales).
- Recipes `just ww3-build`, `ww3-mesh`, `ww3-winds`, `ww3-run`, `ww3-export`, in a Nix devShell
  `ww3` (gfortran, NetCDF-Fortran, MPI, CMake), runnable on macOS too (invariant 10). Cache the
  mesh and `mod_def.ww3`; only the winds and the run change per cycle.
