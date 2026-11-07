#!/usr/bin/env bash
# `just blow-light <video>...`: is the light of a video under control?
#
# For every frame, ffmpeg counts the share of pixels that are near white
# (luma above HOT, of 255) and the share that glow (luma above GLOW). A
# frame burns when the first passes HOT_MAX % or the second GLOW_MAX %:
# a lamp's halo or a window's glare that has spread over the frame, the
# white-out the owner saw (7 November 2026). The video fails when any
# frame burns, and the worst frames are named with their time.
#
# Thin bright strokes (the HUD's letters, a label's text, an outline) are
# not a burn: two erosions take them out before the count, so only bright
# areas are counted.
#
# It reads what ffmpeg decodes: an .mp4, a .jpg or a .png. An animated
# .webp it cannot decode, so check the .mp4 the .webp is cut from.
# `just record` runs it on docs/record/room.mp4 and fails when it fails.
# The limits can be set from the environment, e.g. HOT=240 blow_light.sh x.mp4
set -euo pipefail

HOT=${HOT:-230} HOT_MAX=${HOT_MAX:-0.25}
GLOW=${GLOW:-200} GLOW_MAX=${GLOW_MAX:-1.0}

[ $# -gt 0 ] || { echo "usage: blow_light.sh <video|image>..." >&2; exit 2; }
command -v ffmpeg >/dev/null || { echo "blow_light.sh needs ffmpeg (just doctor)" >&2; exit 2; }

# the share of pixels above a luma, frame by frame, as "time share" lines;
# the luma is full range (0 to 255), whatever range the file was encoded in
share() {
  ffmpeg -hide_banner -nostats -i "$1" -an -vf \
    "scale=in_range=auto:out_range=full,format=gray,erosion,erosion,geq=lum='gt(lum(X\,Y)\,$2)*255',signalstats,metadata=print:key=lavfi.signalstats.YAVG:file=-" \
    -f null - 2>/dev/null |
    awk '/pts_time/ { split($0, a, "pts_time:"); t = a[2] + 0 } /YAVG=/ { split($0, b, "="); printf "%.2f %.4f\n", t, b[2] / 2.55 }'
}

fail=0
for f in "$@"; do
  [ -f "$f" ] || { echo "✗ $f: no such file" >&2; fail=1; continue; }
  report=$(paste -d' ' <(share "$f" "$HOT") <(share "$f" "$GLOW" | cut -d' ' -f2) |
    awk -v hm="$HOT_MAX" -v gm="$GLOW_MAX" -v f="$f" -v H="$HOT" -v G="$GLOW" '
      { n++; if ($2 > wh) { wh = $2; th = $1 } if ($3 > wg) { wg = $3; tg = $1 }
        if ($2 > hm || $3 > gm) { bad++; if (bad <= 5) worst = worst sprintf("\n    %6.2f s: %.2f %% above %d, %.2f %% above %d", $1, $2, H, $3, G) } }
      END {
        if (n == 0) { print "✗ " f ": no frames read"; exit 1 }
        if (bad) { printf "✗ %s: %d of %d frames burn (above %d: worst %.2f %% at %.2f s, limit %s %%; above %d: worst %.2f %% at %.2f s, limit %s %%)%s\n", f, bad, n, H, wh, th, hm, G, wg, tg, gm, worst; exit 1 }
        printf "✓ %s: %d frames, the light is under control (above %d: at most %.2f %%, limit %s; above %d: at most %.2f %%, limit %s)\n", f, n, H, wh, hm, G, wg, gm }') && echo "$report" || { echo "$report"; fail=1; }
done
exit $fail
