#!/usr/bin/env bash
# `just lofi [names]`: renders the lofi of piabrota RADIO, written in
# Csound (music/lofi.orc is the band and its tape, music/<name>.sco is a
# piece), into public/audio/radio/<name>.mp3, normalized to -18 LUFS.
#
# It needs csound, ffmpeg and the FluidR3 GM soundfont (Frank Wen, MIT),
# whose path is ROOM_SF2. `nix develop` gives the three. On macOS without
# Nix: `brew install csound ffmpeg`, and ROOM_SF2=/path/to/FluidR3_GM.sf2.
set -euo pipefail
cd "$(dirname "$0")/.."

command -v csound >/dev/null || { echo "csound missing: nix develop, or brew install csound" >&2; exit 1; }
command -v ffmpeg >/dev/null || { echo "ffmpeg missing: nix develop, or brew install ffmpeg" >&2; exit 1; }
sf="${ROOM_SF2:-}"
if [ -z "$sf" ]; then
  for f in /usr/share/sounds/sf2/FluidR3_GM.sf2 /usr/share/soundfonts/FluidR3_GM.sf2 /usr/share/soundfonts/FluidR3_GM2-2.sf2; do
    [ -f "$f" ] && sf="$f" && break
  done
fi
[ -f "$sf" ] || { echo "the FluidR3 GM soundfont is missing: set ROOM_SF2 to FluidR3_GM.sf2 (nix develop sets it)" >&2; exit 1; }

names=("$@")
if [ ${#names[@]} -eq 0 ]; then
  for f in music/*.sco; do n="$(basename "$f" .sco)"; [ "$n" = kit ] || names+=("$n"); done
fi

tmp="$(mktemp -d)"; trap 'rm -rf "$tmp"' EXIT
mkdir -p public/audio/radio
for n in "${names[@]}"; do
  [ -f "music/$n.sco" ] || { echo "no piece music/$n.sco" >&2; exit 1; }
  # from music/, so a score finds kit.sco beside it
  (cd music && csound --omacro:SF="$sf" -d -m0 -W -f -o "$tmp/$n.wav" lofi.orc "$n.sco") >"$tmp/$n.log" 2>&1 \
    || { cat "$tmp/$n.log" >&2; exit 1; }
  ffmpeg -hide_banner -loglevel error -y -i "$tmp/$n.wav" -af loudnorm=I=-18:TP=-1.5:LRA=11 \
    -ar 44100 -c:a libmp3lame -b:a 128k -map_metadata -1 -fflags +bitexact -flags:a +bitexact "public/audio/radio/$n.mp3"
  ls -lh "public/audio/radio/$n.mp3" | awk '{ print $9, $5 }'
done
