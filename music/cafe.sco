; Café coado
; F major, 88 beats a minute. A nylon guitar comps in short chords that
; move twice in some bars, Fmaj9, Em7b5 to A7, Dm9, Cm7 to F13, Bbmaj9,
; Bbm6, Am7 to D7, Gm9 to C13; the piano has the tune and its left hand
; only marks the roots.

#include "kit.sco"

t 0 88
i 1 0 0 88 0.18 4400
i "desk" 0 264
i "filt" 0 16 900 4400

; the guitar, eight bars
#define GUITAR(B) #
b $B
i "gc" 0    0.75 66 57 60 64 67 0
i "gc" 1.5  0.5  56 57 60 64 67 0
i "gc" 2.5  0.75 62 57 60 64 67 0
i "gc" 3.5  0.5  54 57 60 64 67 0
i "gc" 4    0.75 66 55 58 62 0 0
i "gc" 5.5  0.5  56 55 58 62 0 0
i "gc" 6    0.75 64 55 58 61 64 0
i "gc" 7.5  0.5  54 55 58 61 64 0
i "gc" 8    0.75 66 53 57 60 64 0
i "gc" 9.5  0.5  56 53 57 60 64 0
i "gc" 10.5 0.75 62 53 57 60 64 0
i "gc" 11.5 0.5  54 53 57 60 64 0
i "gc" 12   0.75 66 55 58 63 0 0
i "gc" 13.5 0.5  56 55 58 63 0 0
i "gc" 14   0.75 64 57 63 67 0 0
i "gc" 15.5 0.5  54 57 63 67 0 0
i "gc" 16   0.75 66 57 60 62 65 0
i "gc" 17.5 0.5  56 57 60 62 65 0
i "gc" 18.5 0.75 62 57 60 62 65 0
i "gc" 19.5 0.5  54 57 60 62 65 0
i "gc" 20   0.75 66 55 58 61 65 0
i "gc" 21.5 0.5  56 55 58 61 65 0
i "gc" 22.5 0.75 62 55 58 61 65 0
i "gc" 23.5 0.5  54 55 58 61 65 0
i "gc" 24   0.75 66 55 60 64 0 0
i "gc" 25.5 0.5  56 55 60 64 0 0
i "gc" 26   0.75 64 54 60 63 0 0
i "gc" 27.5 0.5  54 54 60 63 0 0
i "gc" 28   0.75 66 53 57 58 62 0
i "gc" 29.5 0.5  56 53 57 58 62 0
i "gc" 30   0.75 64 52 57 58 62 0
i "gc" 31.5 0.5  54 52 57 58 62 0
#

; the piano's left hand: the roots
#define ROOTS(B) #
b $B
i "pn" 0    2.5  41 62
i "pn" 4    1.8  40 60
i "pn" 6    1.8  45 60
i "pn" 8    2.5  50 62
i "pn" 12   1.8  48 60
i "pn" 14   1.8  41 60
i "pn" 16   2.5  46 62
i "pn" 20   2.5  46 60
i "pn" 24   1.8  45 60
i "pn" 26   1.8  50 60
i "pn" 28   1.8  43 60
i "pn" 30   1.8  48 60
#

#define TUNE(B) #
b $B
i "pn" 0    0.5  69 78
i "pn" 0.5  0.5  72 80
i "pn" 1    1.5  76 88
i "pn" 2.5  0.5  79 84
i "pn" 3    0.5  76 78
i "pn" 3.5  0.5  72 74
i "pn" 4    1.5  74 84
i "pn" 5.5  0.5  70 74
i "pn" 6    0.75 73 80
i "pn" 6.75 0.75 76 82
i "pn" 7.5  0.5  79 80
i "pn" 8    1    77 84
i "pn" 9    0.5  76 76
i "pn" 10   1    81 88
i "pn" 11   0.5  77 78
i "pn" 11.5 0.5  74 74
i "pn" 12   1    75 82
i "pn" 13   0.5  79 80
i "pn" 13.5 0.5  82 84
i "pn" 14   1    81 84
i "pn" 15   0.5  79 78
i "pn" 15.5 0.5  75 76
i "pn" 16   0.5  74 78
i "pn" 16.5 0.5  77 80
i "pn" 17   1.5  81 88
i "pn" 18.5 0.5  84 88
i "pn" 19   1    81 80
i "pn" 20   1.5  79 84
i "pn" 21.5 0.5  77 76
i "pn" 22   1    73 78
i "pn" 23   1    70 74
i "pn" 24   0.5  72 78
i "pn" 24.5 0.5  76 80
i "pn" 25   1    79 84
i "pn" 26   0.5  78 82
i "pn" 26.5 0.5  75 78
i "pn" 27   0.5  74 76
i "pn" 27.5 0.5  72 74
i "pn" 28   0.5  70 78
i "pn" 28.5 0.5  74 80
i "pn" 29   1    81 86
i "pn" 30   0.5  79 80
i "pn" 30.5 0.5  76 78
i "pn" 31   0.5  74 76
i "pn" 31.5 0.5  70 74
#

#define BASS(B) #
b $B
i "bs" 0    1.5  29 92
i "bs" 2.5  0.5  29 82
i "bs" 3    0.5  36 78
i "bs" 3.5  0.5  29 74
i "bs" 4    1.5  28 92
i "bs" 6    1    33 86
i "bs" 7    0.5  33 76
i "bs" 7.5  0.5  37 76
i "bs" 8    1.5  38 92
i "bs" 10.5 0.5  38 82
i "bs" 11   0.5  33 78
i "bs" 11.5 0.5  38 74
i "bs" 12   1.5  36 92
i "bs" 14   1    29 86
i "bs" 15   0.5  29 76
i "bs" 15.5 0.5  33 76
i "bs" 16   1.5  34 92
i "bs" 18.5 0.5  34 82
i "bs" 19   0.5  41 78
i "bs" 19.5 0.5  34 74
i "bs" 20   1.5  34 92
i "bs" 22.5 0.5  34 82
i "bs" 23   0.5  37 78
i "bs" 23.5 0.5  34 74
i "bs" 24   1.5  33 92
i "bs" 26   1    38 86
i "bs" 27   0.5  38 76
i "bs" 27.5 0.5  30 76
i "bs" 28   1.5  31 92
i "bs" 30   1    36 86
i "bs" 31   0.5  36 76
i "bs" 31.5 0.5  28 76
#

#define FLUTE(B) #
b $B
i "fl" 1    2    84 70
i "fl" 3    1    81 64
i "fl" 4    2    82 70
i "fl" 6    1    81 66
i "fl" 7    1    79 64
i "fl" 8    1    77 66
i "fl" 9    1    81 68
i "fl" 10   2    84 72
i "fl" 12   2    82 70
i "fl" 14   2    81 68
i "fl" 18   0.5  77 64
i "fl" 18.5 0.5  81 66
i "fl" 19   1    86 72
i "fl" 20   2    85 72
i "fl" 22   2    82 68
i "fl" 24   2    84 70
i "fl" 26   1    81 68
i "fl" 27   1    78 66
i "fl" 28   2    81 70
i "fl" 30   1    79 66
i "fl" 31   1    76 64
#

; ---- the piece

; the guitar alone, then with the rim
$GUITAR(0)
$RIM(16)
$RIM(24)
$FILL(31)

$GUITAR(32)
$ROOTS(32)
$TUNE(32)
$BASS(32)
$BEAT(32)
$BEAT2(40)
$BEAT(48)
$BEAT2(56)

$GUITAR(64)
$ROOTS(64)
$TUNE(64)
$BASS(64)
$FLUTE(64)
$BEAT(64)
$BEAT2(72)
$BEAT(80)
$BEAT2(88)
$FILL(95)

; guitar and flute, the piano rests
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

; the tune over the bass, no guitar
$ROOTS(128)
$TUNE(128)
$BASS(128)
$RIM(128)
$RIM(136)
$RIM(144)
$RIM(152)
$FILL(159)

$GUITAR(160)
$ROOTS(160)
$TUNE(160)
$BASS(160)
$BEAT(160)
$BEAT2(168)
$BEAT(176)
$BEAT2(184)

$GUITAR(192)
$ROOTS(192)
$TUNE(192)
$BASS(192)
$FLUTE(192)
$BEAT(192)
$RIDE(192)
$BEAT2(200)
$RIDE(200)
$BEAT(208)
$RIDE(208)
$BEAT2(216)
$RIDE(216)

$GUITAR(224)
$ROOTS(224)
$BASS(224)
$RIM(224)
$RIM(232)
$RIM(240)
$RIM(248)
b 256
i "gc" 0 8 60 53 57 60 64 67
i "pn" 0 8 41 60
i "bs" 0 6 29 86
e
