; Janela acesa
; E flat major, 74 beats a minute, a ballad. The left hand opens each
; chord in eighth notes, Ebmaj9, Cm9, Abmaj9, Bb13sus to Bb7b9, then
; Gm7, Cm9, Fm9, Bb13, and the right hand takes its time. A vibraphone
; holds one note a bar.

#include "kit.sco"

t 0 74
i 1 0 0 74 0.1 3600
i "desk" 0 200
i "filt" 0 22 600 3600

#define HAND(B) #
b $B
i "ar" 0  0.5 54 39 46 53 55 58 55 53 46
i "ar" 4  0.5 54 48 55 58 62 63 62 58 55
i "ar" 8  0.5 54 44 51 55 58 60 58 55 51
i "ar" 12 0.5 54 46 53 56 60 46 50 56 59
i "ar" 16 0.5 54 43 50 53 58 62 58 53 50
i "ar" 20 0.5 54 48 55 58 62 63 62 58 55
i "ar" 24 0.5 54 41 48 55 56 60 56 55 48
i "ar" 28 0.5 54 46 53 56 62 67 62 56 53
#

#define TUNE(B) #
b $B
i "pn" 0    2    79 84
i "pn" 2    0.5  77 76
i "pn" 2.5  0.5  75 76
i "pn" 3    1    74 78
i "pn" 4    1.5  75 82
i "pn" 5.5  0.5  74 74
i "pn" 6    2    70 76
i "pn" 8    1    72 78
i "pn" 9    1    75 80
i "pn" 10   1.5  79 86
i "pn" 11.5 0.5  77 76
i "pn" 12   2    75 82
i "pn" 14   1    74 78
i "pn" 15   1    71 76
i "pn" 16   1    70 78
i "pn" 17   1    74 80
i "pn" 18   1.5  77 84
i "pn" 19.5 0.5  74 74
i "pn" 20   1    75 80
i "pn" 21   1    79 82
i "pn" 22   2    82 88
i "pn" 24   1.5  80 84
i "pn" 25.5 0.5  79 76
i "pn" 26   1    77 78
i "pn" 27   1    72 74
i "pn" 28   1    74 78
i "pn" 29   1    77 80
i "pn" 30   2    79 82
#

; the answer, higher and with more air
#define TUNE2(B) #
b $B
i "pn" 0    2    82 80
i "pn" 2    2    79 76
i "pn" 4    1.5  79 80
i "pn" 5.5  0.5  77 74
i "pn" 6    2    75 76
i "pn" 8    1    75 78
i "pn" 9    1    79 80
i "pn" 10   2    84 86
i "pn" 12   2    82 80
i "pn" 14   1    80 78
i "pn" 15   1    77 76
i "pn" 16   1.5  86 84
i "pn" 17.5 0.5  82 76
i "pn" 18   2    77 78
i "pn" 20   1    79 78
i "pn" 21   1    82 80
i "pn" 22   2    86 86
i "pn" 24   1.5  84 82
i "pn" 25.5 0.5  80 76
i "pn" 26   2    79 78
i "pn" 28   1    77 78
i "pn" 29   1    80 80
i "pn" 30   2    82 80
#

#define BASS(B) #
b $B
i "bs" 0    2.5  39 90
i "bs" 3    1    34 78
i "bs" 4    2.5  36 90
i "bs" 7    1    31 78
i "bs" 8    2.5  32 90
i "bs" 11   1    39 78
i "bs" 12   2    34 90
i "bs" 14   1.5  34 84
i "bs" 15.5 0.5  32 74
i "bs" 16   2.5  31 90
i "bs" 19   1    38 78
i "bs" 20   2.5  36 90
i "bs" 23   1    31 78
i "bs" 24   2.5  29 90
i "bs" 27   1    36 78
i "bs" 28   2.5  34 90
i "bs" 31   1    38 78
#

; the vibraphone, one note a bar
#define VIBES(B) #
b $B
i "vb" 0  3.8 74 64
i "vb" 4  3.8 74 62
i "vb" 8  3.8 72 64
i "vb" 12 3.8 68 62
i "vb" 16 3.8 70 64
i "vb" 20 3.8 74 62
i "vb" 24 3.8 72 64
i "vb" 28 3.8 74 62
#

; ---- the piece

$HAND(0)
$TUNE(0)

$HAND(32)
$TUNE(32)
$VIBES(32)
$BASS(32)
$RIM(32)
$RIM(40)
$RIM(48)
$RIM(56)

$HAND(64)
$TUNE2(64)
$VIBES(64)
$BASS(64)
$BEAT(64)
$BEAT(72)
$BEAT(80)
$BEAT2(88)

; the left hand and the vibraphone, nothing else
b 0
i "filt" 96 4 3600 1300
i "filt" 120 8 1300 3600
$HAND(96)
$VIBES(96)
$BASS(96)
$FILL(127)

$HAND(128)
$TUNE(128)
$VIBES(128)
$BASS(128)
$BEAT(128)
$RIDE(128)
$BEAT(136)
$RIDE(136)
$BEAT(144)
$RIDE(144)
$BEAT2(152)
$RIDE(152)

$HAND(160)
$TUNE2(160)
$VIBES(160)
$BASS(160)
$RIM(160)
$RIM(168)
$RIM(176)
$RIM(184)
b 192
i "ch" 0 8 56 39 55 58 62 65
i "vb" 0.5 6 79 62
i "bs" 0 6 39 84
e
