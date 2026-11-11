# room: every task is a recipe. Same commands on macOS and in `nix develop`.

set shell := ["bash", "-euo", "pipefail", "-c"]

# list the recipes
default:
    @just --list

# check the tools: node 20 or newer, npm, and (optionally) ffmpeg
doctor:
    @node -e 'const [m] = process.versions.node.split("."); if (m < 20) { console.error("node " + process.version + ": need 20 or newer"); process.exit(1) } console.log("node " + process.version)'
    @npm --version | sed 's/^/npm /'
    @command -v ffmpeg >/dev/null && echo "ffmpeg ok" || echo "ffmpeg missing: only \`just audio\` needs it"
    @command -v csound >/dev/null && echo "csound ok" || echo "csound missing: only \`just lofi\` needs it"

# install the locked dependencies
setup: doctor
    npm ci

# run the room at http://localhost:5173
dev: _deps
    npx vite

# build the static site into dist/
build: _deps
    npx vite build

# serve dist/ as it will be hosted
preview: build
    npx vite preview

# the checks a pull request must pass: invariants, then a clean build
check: _deps
    node scripts/check.mjs
    npx vite build --logLevel warn
    @echo "✓ just check"

# the ▲ grid view's files in public/grid/: the coast's triangle mesh and 24 h of GFS wind and sea (just grid --offline reuses the fetched wind)
grid *args: _deps
    node scripts/grid.mjs {{args}}

# the brightness of every shot, by night and by day; fails when one burns to white (just light day desk)
light *args: build
    node scripts/light.mjs {{args}}

# the furniture and props in public/models/ and the surfaces in public/textures/pbr/, from Poly Haven (CC0): fetched, made small, credited (just models boombox; just models --list)
models *args: _deps
    node scripts/models.mjs {{args}}

# only the stills of every shot into docs/record/ (fast; the video stays as it is)
stills: build
    node scripts/record.mjs --stills

# one still from a shot or from any camera, with the draw calls and triangles of the frame (just peek --shot desk --out /tmp/desk.jpg)
peek *args: _deps
    node scripts/peek.mjs {{args}}

# stills of every shot and a video of the four walls by night into docs/record/ (headless Chrome, ffmpeg); every pull request carries them
record: build
    node scripts/record.mjs

# the aquarium's fish into public/models/ (fish.glb and fish.lite.glb): Microsoft's Barramundi from the Khronos glTF sample assets, CC0, pinned to a commit
fish: _deps
    node scripts/fish.mjs

# only the ▲ grid's stills and a clip that clicks each of its views into docs/record/ (headless Chrome, ffmpeg)
record-grid: build
    node scripts/record.mjs --grid

# only the clip of the water balloon's burst over the aquarium, at real speed and four times slower, into docs/record/splash.mp4
record-splash: build
    node scripts/record.mjs --splash

# what the room costs a phone and a laptop: bytes, time to show, pixels drawn, ms a frame (just mobile --device phone)
mobile *args: build
    node scripts/mobile.mjs {{args}}

# is the light of a video or a still under control? (no frame burns to white)
blow-light +files="docs/record/room.mp4":
    scripts/blow_light.sh {{files}}

# normalize a sound into public/audio (loop beds at -18 LUFS): just audio in.wav ambience
audio src name lufs="-18":
    ffmpeg -hide_banner -y -i "{{src}}" -af loudnorm=I={{lufs}}:TP=-1.5:LRA=11 -ar 44100 -c:a libmp3lame -q:a 3 "public/audio/{{name}}.mp3"
    @ls -lh "public/audio/{{name}}.mp3"

# make the room's sounds and the piabrota tape from the freesound recordings in <samples> (CREDITS.md)
compose samples="samples" out="public/audio":
    node scripts/compose.mjs "{{samples}}" "{{out}}"

# render the lofi of piabrota RADIO from its Csound scores (music/*.sco) into public/audio/radio; needs csound and ROOM_SF2 (just lofi varanda)
lofi *names:
    scripts/lofi.sh {{names}}

# the live listeners count of piabrota RADIO on :8787 (`just dev` passes /live/ to it)
listeners:
    node scripts/listeners.mjs

# remove build output
clean:
    rm -rf dist

_deps:
    @[ -d node_modules ] || npm ci
