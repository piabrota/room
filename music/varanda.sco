; Varanda, duas da manhã
; D minor, 86 beats a minute. Eight bars that go down by steps,
; Bbmaj9, Am9, Gm9, C13, twice, and come home to Dm9 the second time.
; The piano opens alone, as if from under a blanket; the flute answers it.

#include "kit.sco"

t 0 86
i 1 0 0 86 0.16 4200
i "desk" 0 232
i "filt" 0 30 700 4200

; the left hand and the chords, eight bars
#define HANDS(B) #
b $B
i "pn" 0    2    46 66
i "pn" 1.5  1    53 52
i "pn" 2.5  1.5  46 60
i "ch" 0    1.5  58 57 60 62 65 0
i "ch" 2.5  1.25 50 57 60 62 65 0
i "pn" 4    2    45 66
i "pn" 5.5  1    52 52
i "pn" 6.5  1.5  45 60
i "ch" 4    1.5  56 55 59 60 64 0
i "ch" 6.5  1.25 50 55 59 60 64 0
i "pn" 8    2    43 66
i "pn" 9.5  1    50 52
i "pn" 10.5 1.5  43 60
i "ch" 8    1.5  58 53 57 58 62 0
i "ch" 10.5 1.25 50 53 57 58 62 0
i "pn" 12   2    48 66
i "pn" 13.5 1    55 52
i "pn" 14.5 1.5  48 60
i "ch" 12   1.5  56 52 57 58 62 0
i "ch" 14.5 1.25 50 52 57 58 62 0
i "pn" 16   2    46 66
i "pn" 17.5 1    53 52
i "pn" 18.5 1.5  46 60
i "ch" 16   1.5  58 57 60 62 65 0
i "ch" 18.5 1.25 50 57 60 62 65 0
i "pn" 20   2    45 66
i "pn" 21.5 1    52 52
i "pn" 22.5 1.5  45 60
i "ch" 20   1.5  56 55 59 60 64 0
i "ch" 22.5 1.25 50 55 59 60 64 0
i "pn" 24   2    50 66
i "pn" 25.5 1    57 52
i "pn" 26.5 1.5  50 60
i "ch" 24   1.5  58 53 57 60 64 0
i "ch" 26.5 1.25 50 53 57 60 64 0
i "pn" 28   2    50 64
i "pn" 30.5 1.5  45 60
i "ch" 28   1.5  54 53 57 60 64 0
i "ch" 30.5 1.25 54 55 61 65 0 0
#

; the tune
#define TUNE(B) #
b $B
i "pn" 0    0.75 69 78
i "pn" 0.75 0.75 72 80
i "pn" 1.5  1    74 88
i "pn" 2.5  0.5  77 84
i "pn" 3    0.5  74 76
i "pn" 3.5  0.5  72 74
i "pn" 4    1.5  76 86
i "pn" 5.5  0.5  74 74
i "pn" 6    0.75 72 78
i "pn" 6.75 1.25 69 72
i "pn" 8    0.75 74 78
i "pn" 8.75 0.75 77 82
i "pn" 9.5  1    81 90
i "pn" 10.5 0.5  79 82
i "pn" 11   0.5  77 78
i "pn" 11.5 0.5  74 74
i "pn" 12   1.5  76 86
i "pn" 13.5 0.5  74 74
i "pn" 14   0.75 72 78
i "pn" 14.75 0.75 67 70
i "pn" 15.5 0.5  69 72
i "pn" 16   0.75 69 78
i "pn" 16.75 0.75 72 80
i "pn" 17.5 0.5  74 84
i "pn" 18   0.5  77 84
i "pn" 18.5 1    81 90
i "pn" 19.5 0.5  79 80
i "pn" 20   1    76 84
i "pn" 21   0.5  79 80
i "pn" 21.5 0.5  76 78
i "pn" 22   0.75 74 76
i "pn" 22.75 0.75 72 76
i "pn" 23.5 0.5  69 70
i "pn" 24   0.75 77 84
i "pn" 24.75 0.75 76 80
i "pn" 25.5 1    74 84
i "pn" 26.5 1.5  69 72
i "pn" 29   0.5  72 70
i "pn" 29.5 1    74 78
i "pn" 30.5 0.5  77 80
i "pn" 31   0.5  76 78
i "pn" 31.5 0.5  73 74
#

; the second tune, higher, for the answer
#define TUNE2(B) #
b $B
i "pn" 0    0.5  77 78
i "pn" 0.5  0.5  81 82
i "pn" 1    1.5  84 88
i "pn" 2.5  0.5  81 80
i "pn" 3    1    77 78
i "pn" 4    0.75 79 82
i "pn" 4.75 0.75 76 78
i "pn" 5.5  1    72 76
i "pn" 6.5  0.5  76 78
i "pn" 7    1    79 82
i "pn" 8    0.5  77 80
i "pn" 8.5  0.5  79 80
i "pn" 9    1    81 86
i "pn" 10   0.5  82 84
i "pn" 10.5 0.5  81 82
i "pn" 11   1    77 78
i "pn" 12   1    76 82
i "pn" 13   0.5  79 80
i "pn" 13.5 1    82 86
i "pn" 14.5 0.5  81 80
i "pn" 15   0.5  79 78
i "pn" 15.5 0.5  76 74
i "pn" 16   0.5  74 78
i "pn" 16.5 0.5  77 80
i "pn" 17   1.5  81 88
i "pn" 18.5 0.5  84 86
i "pn" 19   1    81 80
i "pn" 20   1.5  79 84
i "pn" 21.5 0.5  76 76
i "pn" 22   0.5  74 76
i "pn" 22.5 1.5  72 74
i "pn" 24   0.75 74 80
i "pn" 24.75 0.75 77 82
i "pn" 25.5 1    76 80
i "pn" 26.5 1.5  74 78
i "pn" 29   0.5  69 70
i "pn" 29.5 1    74 78
i "pn" 30.5 0.5  76 78
i "pn" 31   0.5  77 80
i "pn" 31.5 0.5  76 76
#

#define BASS(B) #
b $B
i "bs" 0    1.5  34 92
i "bs" 2.5  0.75 34 82
i "bs" 3.5  0.5  41 74
i "bs" 4    1.5  33 92
i "bs" 6.5  0.75 40 80
i "bs" 7.5  0.5  33 74
i "bs" 8    1.5  31 92
i "bs" 10.5 0.75 31 82
i "bs" 11.5 0.5  38 74
i "bs" 12   1.5  36 92
i "bs" 14.5 0.5  36 80
i "bs" 15   0.5  40 76
i "bs" 15.5 0.5  33 76
i "bs" 16   1.5  34 92
i "bs" 18.5 0.75 34 82
i "bs" 19.5 0.5  41 74
i "bs" 20   1.5  33 92
i "bs" 22.5 0.75 40 80
i "bs" 23.5 0.5  36 74
i "bs" 24   1.5  38 92
i "bs" 26.5 0.75 38 82
i "bs" 27.5 0.5  33 74
i "bs" 28   1.5  38 90
i "bs" 30.5 1    33 84
i "bs" 31.5 0.5  33 72
#

#define FLUTE(B) #
b $B
i "fl" 1    2    81 70
i "fl" 3    1    77 64
i "fl" 4    2.5  79 70
i "fl" 7    1    76 62
i "fl" 8    1    77 68
i "fl" 9    0.5  74 62
i "fl" 9.5  0.5  77 66
i "fl" 10   1.5  81 72
i "fl" 12   3    79 68
i "fl" 18   1    86 72
i "fl" 19   1    84 68
i "fl" 20   2    81 70
i "fl" 22   0.5  79 64
i "fl" 22.5 1.5  76 64
i "fl" 24   0.5  77 66
i "fl" 24.5 0.5  76 64
i "fl" 25   3    74 68
#

; ---- the piece: seven times the eight bars

$HANDS(0)
$TUNE(0)

$HANDS(32)
$TUNE(32)
$BASS(32)
$BEAT(32)
$BEAT(40)
$BEAT(48)
$BEAT2(56)

$HANDS(64)
$TUNE(64)
$BASS(64)
$FLUTE(64)
$BEAT(64)
$BEAT2(72)
$BEAT(80)
$BEAT2(88)
$FILL(95)

$HANDS(96)
$TUNE2(96)
$BASS(96)
$BEAT(96)
$RIDE(96)
$BEAT2(104)
$RIDE(104)
$BEAT(112)
$RIDE(112)
$BEAT2(120)
$RIDE(120)

; the drums step out
b 0
i "filt" 128 4 4200 1500
i "filt" 152 8 1500 4200
$HANDS(128)
$TUNE(128)
$BASS(128)
$RIM(144)
$RIM(152)
$FILL(159)

$HANDS(160)
$TUNE2(160)
$BASS(160)
$FLUTE(160)
$BEAT(160)
$BEAT2(168)
$BEAT(176)
$BEAT2(184)

$HANDS(192)
$TUNE(192)
$BASS(192)
$FLUTE(192)
$BEAT(192)
$BEAT2(200)
$BEAT(208)
$BEAT2(216)
b 224
i "ch" 0 8 60 50 57 60 64 65
i "bs" 0 6 38 86
e
