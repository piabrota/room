; Domingo sem pressa
; D major, 80 beats a minute, the bright one. A nylon guitar opens each
; chord in eighth notes, Dmaj9, Bm9, Gmaj9, A13, then F#m7, Bm9, Em9 and
; A; the piano lays one soft chord a bar under its tune, and the flute
; comes by.

#include "kit.sco"

t 0 80
i 1 0 0 80 0.14 4200
i "desk" 0 232
i "filt" 0 24 800 4200

#define GUITAR(B) #
b $B
i "ga" 0  0.5 62 50 57 61 64 66 64 61 57
i "ga" 4  0.5 62 47 54 57 61 62 61 57 54
i "ga" 8  0.5 62 43 50 54 57 59 57 54 50
i "ga" 12 0.5 62 45 52 55 61 66 61 55 52
i "ga" 16 0.5 62 42 49 52 57 61 57 52 49
i "ga" 20 0.5 62 47 54 57 61 62 61 57 54
i "ga" 24 0.5 62 40 47 54 55 59 55 54 47
i "ga" 28 0.5 62 45 52 55 62 45 52 55 61
#

; the piano's chords, one a bar
#define CHORDS(B) #
b $B
i "ch" 0  3.5 50 54 57 61 64 0
i "ch" 4  3.5 50 54 57 61 62 0
i "ch" 8  3.5 50 54 57 59 62 0
i "ch" 12 3.5 50 55 59 61 66 0
i "ch" 16 3.5 50 52 57 61 64 0
i "ch" 20 3.5 50 54 57 61 62 0
i "ch" 24 3.5 50 54 55 59 62 0
i "ch" 28 1.9 50 55 59 62 66 0
i "ch" 30 1.9 50 55 61 64 0 0
#

#define TUNE(B) #
b $B
i "pn" 0    1    78 82
i "pn" 1    0.5  76 76
i "pn" 1.5  1.5  81 88
i "pn" 3    0.5  78 78
i "pn" 3.5  0.5  76 74
i "pn" 4    1.5  74 82
i "pn" 5.5  0.5  73 74
i "pn" 6    0.5  74 76
i "pn" 6.5  1.5  78 82
i "pn" 8    0.5  71 76
i "pn" 8.5  0.5  74 78
i "pn" 9    1    78 82
i "pn" 10   1.5  81 88
i "pn" 11.5 0.5  78 76
i "pn" 12   2    76 84
i "pn" 14   1    73 78
i "pn" 15   1    71 74
i "pn" 16   0.5  69 76
i "pn" 16.5 0.5  73 78
i "pn" 17   1.5  76 84
i "pn" 18.5 0.5  78 80
i "pn" 19   1    81 84
i "pn" 20   1.5  83 90
i "pn" 21.5 0.5  81 80
i "pn" 22   1    78 80
i "pn" 23   1    74 76
i "pn" 24   1    79 84
i "pn" 25   0.5  78 78
i "pn" 25.5 1.5  76 80
i "pn" 27   0.5  71 74
i "pn" 27.5 0.5  74 76
i "pn" 28   2    74 80
i "pn" 30   1    73 78
i "pn" 31   0.5  76 78
i "pn" 31.5 0.5  79 80
#

#define BASS(B) #
b $B
i "bs" 0    1.5  38 92
i "bs" 2.5  0.75 38 82
i "bs" 3.5  0.5  33 74
i "bs" 4    1.5  35 92
i "bs" 6.5  0.75 35 82
i "bs" 7.5  0.5  30 74
i "bs" 8    1.5  31 92
i "bs" 10.5 0.75 31 82
i "bs" 11.5 0.5  38 74
i "bs" 12   1.5  33 92
i "bs" 14.5 0.5  40 82
i "bs" 15   0.5  33 76
i "bs" 15.5 0.5  31 76
i "bs" 16   1.5  30 92
i "bs" 18.5 0.75 30 82
i "bs" 19.5 0.5  37 74
i "bs" 20   1.5  35 92
i "bs" 22.5 0.75 35 82
i "bs" 23.5 0.5  30 74
i "bs" 24   1.5  40 92
i "bs" 26.5 0.75 40 82
i "bs" 27.5 0.5  35 74
i "bs" 28   1.5  33 92
i "bs" 30   1    33 84
i "bs" 31   0.5  33 76
i "bs" 31.5 0.5  37 76
#

#define FLUTE(B) #
b $B
i "fl" 2    2    86 70
i "fl" 4    1.5  85 70
i "fl" 5.5  0.5  83 64
i "fl" 6    2    81 68
i "fl" 9    1    83 68
i "fl" 10   2    86 72
i "fl" 12   2    85 70
i "fl" 14   1    83 66
i "fl" 15   1    81 64
i "fl" 18   0.5  76 64
i "fl" 18.5 0.5  78 66
i "fl" 19   1    81 68
i "fl" 20   3    78 68
i "fl" 24   1    79 68
i "fl" 25   1    83 70
i "fl" 26   2    86 72
i "fl" 28   2    86 70
i "fl" 30   2    85 68
#

; ---- the piece

$GUITAR(0)

$GUITAR(32)
$CHORDS(32)
$TUNE(32)
$BASS(32)
$RIM(32)
$RIM(40)
$RIM(48)
$RIM(56)
$FILL(63)

$GUITAR(64)
$CHORDS(64)
$TUNE(64)
$BASS(64)
$FLUTE(64)
$BEAT(64)
$BEAT2(72)
$BEAT(80)
$BEAT2(88)

; guitar and flute
$GUITAR(96)
$BASS(96)
$FLUTE(96)
$BEAT(96)
$RIDE(96)
$BEAT2(104)
$RIDE(104)
$BEAT(112)
$RIDE(112)
$BEAT2(120)
$RIDE(120)

; the piano alone with the bass
b 0
i "filt" 128 4 4200 1500
i "filt" 152 8 1500 4200
$CHORDS(128)
$TUNE(128)
$BASS(128)
$FILL(159)

$GUITAR(160)
$CHORDS(160)
$TUNE(160)
$BASS(160)
$FLUTE(160)
$BEAT(160)
$RIDE(160)
$BEAT2(168)
$RIDE(168)
$BEAT(176)
$RIDE(176)
$BEAT2(184)
$RIDE(184)

$GUITAR(192)
$CHORDS(192)
$TUNE(192)
$BASS(192)
$RIM(192)
$RIM(200)
$RIM(208)
$RIM(216)
b 224
i "gc" 0 8 60 50 57 61 64 66
i "ch" 0.5 7 50 54 57 61 64 0
i "bs" 0 6 38 86
e
