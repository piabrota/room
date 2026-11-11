; Flauta no corredor
; E dorian, 90 beats a minute. Em9 and A13 back and forth, then down
; through Cmaj9, Bm7, Am9 to B7. The piano comps in short stabs and has a
; small hook of its own; the flute, somewhere down the hall, has the tune.

#include "kit.sco"

t 0 90
i 1 0 0 90 0.18 4400
i "desk" 0 264
i "filt" 0 16 800 4400

; the stabs: left hand and chord, eight bars
#define COMP(B) #
b $B
i "pn" 0    1    40 68
i "pn" 2.5  1    40 60
i "ch" 0    0.5  62 55 59 62 66 0
i "ch" 1.5  1    56 55 59 62 66 0
i "ch" 2.75 0.5  50 55 59 62 66 0
i "pn" 4    1    45 68
i "pn" 6.5  1    45 60
i "ch" 4    0.5  62 55 59 61 66 0
i "ch" 5.5  1    56 55 59 61 66 0
i "ch" 7.5  0.5  50 55 59 61 66 0
i "pn" 8    1    40 68
i "pn" 10.5 1    40 60
i "ch" 8    0.5  62 55 59 62 66 0
i "ch" 9.5  1    56 55 59 62 66 0
i "ch" 10.75 0.5 50 55 59 62 66 0
i "pn" 12   1    45 68
i "pn" 14.5 1    45 60
i "ch" 12   0.5  62 55 59 61 66 0
i "ch" 13.5 1    56 55 59 61 66 0
i "ch" 15.5 0.5  50 55 59 61 66 0
i "pn" 16   1    48 68
i "pn" 18.5 1    48 60
i "ch" 16   0.5  62 52 55 59 62 0
i "ch" 17.5 1    56 52 55 59 62 0
i "ch" 18.75 0.5 50 52 55 59 62 0
i "pn" 20   1    47 68
i "pn" 22.5 1    47 60
i "ch" 20   0.5  62 54 57 62 66 0
i "ch" 21.5 1    56 54 57 62 66 0
i "ch" 23.5 0.5  50 54 57 62 66 0
i "pn" 24   1    45 68
i "pn" 26.5 1    45 60
i "ch" 24   0.5  62 55 59 60 64 0
i "ch" 25.5 1    56 55 59 60 64 0
i "ch" 26.75 0.5 50 55 59 60 64 0
i "pn" 28   1    47 68
i "pn" 30.5 1    47 60
i "ch" 28   0.5  62 57 63 67 0 0
i "ch" 29.5 1    56 57 63 67 0 0
i "ch" 31.5 0.5  52 57 63 67 0 0
#

; the piano's hook
#define HOOK(B) #
b $B
i "pn" 0    0.5  71 78
i "pn" 0.5  0.5  74 80
i "pn" 1    1    76 86
i "pn" 2.5  0.5  79 84
i "pn" 3    0.5  76 78
i "pn" 3.5  0.5  74 74
i "pn" 4    1.5  73 84
i "pn" 5.5  0.5  71 74
i "pn" 6    0.5  69 74
i "pn" 6.5  1.5  71 76
i "pn" 8    0.5  71 78
i "pn" 8.5  0.5  74 80
i "pn" 9    1    76 86
i "pn" 10.5 0.5  79 84
i "pn" 11   0.5  81 86
i "pn" 11.5 0.5  79 78
i "pn" 12   1.5  78 84
i "pn" 13.5 0.5  76 76
i "pn" 14   0.5  73 76
i "pn" 14.5 1.5  76 76
i "pn" 16   0.5  76 80
i "pn" 16.5 0.5  79 82
i "pn" 17   1.5  83 90
i "pn" 18.5 0.5  81 82
i "pn" 19   1    79 80
i "pn" 20   1.5  78 84
i "pn" 21.5 0.5  74 76
i "pn" 22   0.5  71 74
i "pn" 22.5 0.5  74 76
i "pn" 23   1    78 80
i "pn" 24   0.5  72 78
i "pn" 24.5 0.5  76 80
i "pn" 25   1    79 84
i "pn" 26   0.5  83 86
i "pn" 26.5 0.5  81 82
i "pn" 27   0.5  79 80
i "pn" 27.5 0.5  76 76
i "pn" 28   1.5  75 84
i "pn" 29.5 0.5  78 80
i "pn" 30   1    81 84
i "pn" 31   0.5  79 80
i "pn" 31.5 0.5  78 76
#

#define BASS(B) #
b $B
i "bs" 0    1    28 94
i "bs" 1.5  0.5  28 80
i "bs" 2.5  0.5  35 82
i "bs" 3    0.5  40 78
i "bs" 3.5  0.5  31 76
i "bs" 4    1    33 94
i "bs" 5.5  0.5  33 80
i "bs" 6.5  0.5  40 82
i "bs" 7    0.5  37 78
i "bs" 7.5  0.5  30 76
i "bs" 8    1    28 94
i "bs" 9.5  0.5  28 80
i "bs" 10.5 0.5  35 82
i "bs" 11   0.5  40 78
i "bs" 11.5 0.5  31 76
i "bs" 12   1    33 94
i "bs" 13.5 0.5  33 80
i "bs" 14.5 1    40 82
i "bs" 15.5 0.5  35 76
i "bs" 16   1    36 94
i "bs" 17.5 0.5  36 80
i "bs" 18.5 0.5  43 82
i "bs" 19   0.5  40 78
i "bs" 19.5 0.5  36 76
i "bs" 20   1    35 94
i "bs" 21.5 0.5  35 80
i "bs" 22.5 0.5  42 82
i "bs" 23   0.5  38 78
i "bs" 23.5 0.5  35 76
i "bs" 24   1    33 94
i "bs" 25.5 0.5  33 80
i "bs" 26.5 0.5  40 82
i "bs" 27   0.5  36 78
i "bs" 27.5 0.5  34 76
i "bs" 28   1    35 94
i "bs" 29.5 0.5  35 80
i "bs" 30.5 0.5  42 82
i "bs" 31   0.5  39 78
i "bs" 31.5 0.5  35 76
#

; the flute's tune
#define FLUTE(B) #
b $B
i "fl" 0    1.5  83 76
i "fl" 1.5  0.5  81 68
i "fl" 2    0.5  79 68
i "fl" 2.5  1.5  76 70
i "fl" 4    1    78 72
i "fl" 5    0.5  81 70
i "fl" 5.5  2    85 76
i "fl" 8    0.5  83 72
i "fl" 8.5  0.5  86 74
i "fl" 9    1.5  88 78
i "fl" 10.5 0.5  86 70
i "fl" 11   1    83 70
i "fl" 12   2.5  81 74
i "fl" 14.5 0.5  78 66
i "fl" 15   1    76 68
i "fl" 16   1    79 72
i "fl" 17   0.5  83 72
i "fl" 17.5 1.5  86 78
i "fl" 19   0.5  84 70
i "fl" 19.5 0.5  83 68
i "fl" 20   1    81 72
i "fl" 21   0.5  78 68
i "fl" 21.5 1.5  74 68
i "fl" 24   0.5  76 70
i "fl" 24.5 0.5  79 70
i "fl" 25   0.5  81 72
i "fl" 25.5 0.5  83 72
i "fl" 26   1.5  84 78
i "fl" 27.5 0.5  83 70
i "fl" 28   0.5  81 72
i "fl" 28.5 0.5  79 70
i "fl" 29   2    78 74
i "fl" 31   1    75 68
#

; ---- the piece

$COMP(0)
$HOOK(0)
$RIM(16)
$RIM(24)
$FILL(31)

$COMP(32)
$HOOK(32)
$BASS(32)
$BEAT(32)
$BEAT2(40)
$BEAT(48)
$BEAT2(56)

$COMP(64)
$BASS(64)
$FLUTE(64)
$BEAT(64)
$BEAT2(72)
$BEAT(80)
$BEAT2(88)
$FILL(95)

$COMP(96)
$HOOK(96)
$BASS(96)
$BEAT(96)
$RIDE(96)
$BEAT2(104)
$RIDE(104)
$BEAT(112)
$RIDE(112)
$BEAT2(120)
$RIDE(120)

; bass and flute alone with the rim
$BASS(128)
$FLUTE(128)
$RIM(128)
$RIM(136)
$RIM(144)
$RIM(152)
$FILL(159)

$COMP(160)
$HOOK(160)
$BASS(160)
$BEAT(160)
$BEAT2(168)
$BEAT(176)
$BEAT2(184)

$COMP(192)
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

$COMP(224)
$HOOK(224)
$BASS(224)
$RIM(224)
$RIM(232)
$RIM(240)
$RIM(248)
b 256
i "ch" 0 8 60 40 55 59 62 66
i "bs" 0 6 28 86
e
