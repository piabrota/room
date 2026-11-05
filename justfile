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

# normalize a sound into public/audio (loop beds at -18 LUFS): just audio in.wav ambience
audio src name lufs="-18":
    ffmpeg -hide_banner -y -i "{{src}}" -af loudnorm=I={{lufs}}:TP=-1.5:LRA=11 -ar 44100 -c:a libmp3lame -q:a 3 "public/audio/{{name}}.mp3"
    @ls -lh "public/audio/{{name}}.mp3"

# remove build output
clean:
    rm -rf dist

_deps:
    @[ -d node_modules ] || npm ci
