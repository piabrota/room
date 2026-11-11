; Última fita
; C major leaning on A minor, 76 beats a minute, the slowest of the five.
; Fmaj9, Em7, Dm9, G13, then Fmaj9, E7b9 and home to Am9. The piano rolls
; each chord once and leaves room; an electric piano holds it underneath.

#include "kit.sco"

t 0 76
i 1 0 0 76 0.1 3600
i "desk" 0 200
i "filt" 0 24 600 3600

; the rolled chords and the left hand, eight bars
#define CHORDS(B) #
b $B
i "pn" 0    3.5  41 64
i "ch" 0    3.5  56 53 57 60 64 67
i "pn" 2.5  1    48 50
i "pn" 4    3.5  40 64
i "ch" 4    3.5  56 52 55 59 62 0
i "pn" 6.5  1    47 50
i "pn" 8    3.5  38 64
i "ch" 8    3.5  56 50 53 57 60 64
i "pn" 10.5 1    45 50
i "pn" 12   3.5  43 64
i "ch" 12   3.5  56 53 57 59 64 0
i "pn" 14.5 1    50 50
i "pn" 16   3.5  41 64
i "ch" 16   3.5  56 53 57 60 64 67
i "pn" 18.5 1    48 50
i "pn" 20   3.5  40 64
i "ch" 20   3.5  56 56 59 62 65 0
i "pn" 22.5 1    47 50
i "pn" 24   3.5  45 64
i "ch" 24   3.5  56 55 59 60 64 0
i "pn" 26.5 1    52 50
i "pn" 28   1.9  43 62
i "ch" 28   1.9  54 53 58 62 0 0
i "pn" 30   1.9  48 62
i "ch" 30   1.9  54 52 58 62 0 0
#

#define TUNE(B) #
b $B
i "pn" 0    1    76 80
i "pn" 1    0.5  79 80
i "pn" 1.5  2    81 88
i "pn" 3.5  0.5  79 74
i "pn" 4    1.5  83 86
i "pn" 5.5  0.5  79 76
i "pn" 6    1    76 78
i "pn" 7    1    74 74
i "pn" 8    1    77 82
i "pn" 9    0.5  76 76
i "pn" 9.5  1.5  72 78
i "pn" 11   0.5  69 70
i "pn" 11.5 0.5  72 74
i "pn" 12   2    76 84
i "pn" 14   0.5  74 74
i "pn" 14.5 1.5  71 74
i "pn" 16   0.5  76 78
i "pn" 16.5 0.5  79 80
i "pn" 17   0.5  81 82
i "pn" 17.5 2    84 90
i "pn" 19.5 0.5  81 76
i "pn" 20   1.5  80 86
i "pn" 21.5 0.5  77 78
i "pn" 22   0.5  76 76
i "pn" 22.5 0.5  74 74
i "pn" 23   1    71 72
i "pn" 24   1    72 78
i "pn" 25   0.5  76 80
i "pn" 25.5 1    83 86
i "pn" 26.5 1.5  81 80
i "pn" 29   0.5  79 76
i "pn" 29.5 0.5  77 76
i "pn" 30   0.5  74 74
i "pn" 30.5 0.5  76 76
i "pn" 31   0.5  79 78
i "pn" 31.5 0.5  82 80
#

; the tune's echo: what is left of it, for the quiet eight bars
#define ECHO(B) #
b $B
i "pn" 1.5  2    81 74
i "pn" 4    1.5  83 72
i "pn" 7    1    74 66
i "pn" 9.5  1.5  72 70
i "pn" 12   2    76 72
i "pn" 17.5 2    84 76
i "pn" 20   1.5  80 74
i "pn" 23   1    71 66
i "pn" 25.5 1    83 74
i "pn" 26.5 1.5  81 70
i "pn" 31   0.5  79 68
i "pn" 31.5 0.5  82 70
#

#define BASS(B) #
b $B
i "bs" 0    2    29 90
i "bs" 2.5  1    36 80
i "bs" 3.5  0.5  29 72
i "bs" 4    2    28 90
i "bs" 6.5  1    35 80
i "bs" 7.5  0.5  28 72
i "bs" 8    2    38 90
i "bs" 10.5 1    33 80
i "bs" 11.5 0.5  38 72
i "bs" 12   2    31 90
i "bs" 14.5 0.5  38 80
i "bs" 15   0.5  35 76
i "bs" 15.5 0.5  31 72
i "bs" 16   2    29 90
i "bs" 18.5 1    36 80
i "bs" 19.5 0.5  29 72
i "bs" 20   2    28 90
i "bs" 22.5 0.5  35 80
i "bs" 23   1    32 78
i "bs" 24   2    33 90
i "bs" 26.5 1    40 80
i "bs" 27.5 0.5  33 72
i "bs" 28   1.5  31 88
i "bs" 30   1    36 84
i "bs" 31   1    28 78
#

#define PAD(B) #
b $B
i "ep" 0  3.8 57 50
i "ep" 0  3.8 60 50
i "ep" 0  3.8 64 50
i "ep" 4  3.8 55 50
i "ep" 4  3.8 59 50
i "ep" 4  3.8 62 50
i "ep" 8  3.8 57 50
i "ep" 8  3.8 60 50
i "ep" 8  3.8 65 50
i "ep" 12 3.8 57 50
i "ep" 12 3.8 59 50
i "ep" 12 3.8 64 50
i "ep" 16 3.8 57 50
i "ep" 16 3.8 60 50
i "ep" 16 3.8 64 50
i "ep" 20 3.8 56 50
i "ep" 20 3.8 62 50
i "ep" 20 3.8 65 50
i "ep" 24 3.8 55 50
i "ep" 24 3.8 60 50
i "ep" 24 3.8 64 50
i "ep" 28 1.9 58 48
i "ep" 28 1.9 62 48
i "ep" 28 1.9 65 48
i "ep" 30 1.9 58 48
i "ep" 30 1.9 62 48
i "ep" 30 1.9 64 48
#

#define FLUTE(B) #
b $B
i "fl" 2    2    84 68
i "fl" 4    2    83 66
i "fl" 9    1    81 64
i "fl" 10   2    77 66
i "fl" 12   1    76 64
i "fl" 13   3    74 66
i "fl" 18   1.5  88 72
i "fl" 19.5 0.5  84 64
i "fl" 20   2    83 68
i "fl" 22   2    80 66
i "fl" 24   1    81 66
i "fl" 25   1    84 68
i "fl" 26   2    88 72
i "fl" 28   2    86 68
i "fl" 30   0.5  84 64
i "fl" 30.5 1.5  82 66
#

; ---- the piece

$CHORDS(0)
$TUNE(0)

$CHORDS(32)
$TUNE(32)
$PAD(32)
$BASS(32)
$RIM(32)
$RIM(40)
$RIM(48)
$RIM(56)

$CHORDS(64)
$TUNE(64)
$PAD(64)
$BASS(64)
$FLUTE(64)
$BEAT(64)
$BEAT(72)
$BEAT(80)
$BEAT2(88)

; the quiet eight bars
b 0
i "filt" 96 4 3600 1300
i "filt" 120 8 1300 3600
$CHORDS(96)
$ECHO(96)
$PAD(96)
$BASS(96)
$FILL(127)

$CHORDS(128)
$TUNE(128)
$PAD(128)
$BASS(128)
$FLUTE(128)
$BEAT(128)
$RIDE(128)
$BEAT(136)
$RIDE(136)
$BEAT(144)
$RIDE(144)
$BEAT2(152)
$RIDE(152)

$CHORDS(160)
$TUNE(160)
$PAD(160)
$BASS(160)
$RIM(160)
$RIM(168)
$RIM(176)
$RIM(184)
b 192
i "ch" 0 8 56 41 53 57 60 64
i "bs" 0 6 29 84
e
