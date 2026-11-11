; Carta para o mar
; A flat major, 80 beats a minute. The left hand writes in broken chords,
; Abmaj9, Gm7b5 to C7, Fm9, Ebm9 to Ab13, Dbmaj9, Cm7, Bbm9, Eb13,
; and the right hand sings over them. An electric piano warms the middle.

#include "kit.sco"

t 0 80
i 1 0 0 80 0.12 3800
i "desk" 0 232
i "filt" 0 28 650 3800

; the left hand, eight bars of eighth notes
#define HAND(B) #
b $B
i "ar" 0  0.5 56 44 51 58 60 55 51 58 51
i "ar" 4  0.5 56 43 49 53 58 48 52 58 61
i "ar" 8  0.5 56 41 48 55 56 51 48 55 48
i "ar" 12 0.5 56 39 46 53 54 44 54 60 65
i "ar" 16 0.5 56 37 44 51 53 48 44 51 44
i "ar" 20 0.5 56 48 55 58 63 55 51 58 55
i "ar" 24 0.5 56 46 53 60 61 56 53 60 53
i "ar" 28 0.5 56 39 46 56 61 39 49 55 64
#

#define TUNE(B) #
b $B
i "pn" 0    1    72 80
i "pn" 1    0.5  75 78
i "pn" 1.5  1.5  79 88
i "pn" 3    0.5  77 78
i "pn" 3.5  0.5  75 74
i "pn" 4    1.5  73 84
i "pn" 5.5  0.5  70 72
i "pn" 6    0.75 72 78
i "pn" 6.75 0.75 76 82
i "pn" 7.5  0.5  73 74
i "pn" 8    1.5  80 88
i "pn" 9.5  0.5  79 78
i "pn" 10   0.75 75 78
i "pn" 10.75 1.25 72 74
i "pn" 12   0.5  70 74
i "pn" 12.5 0.5  73 76
i "pn" 13   1    77 84
i "pn" 14   0.5  78 82
i "pn" 14.5 0.5  77 78
i "pn" 15   0.5  75 76
i "pn" 15.5 0.5  72 72
i "pn" 16   1    77 80
i "pn" 17   0.5  80 82
i "pn" 17.5 1.5  84 90
i "pn" 19   0.5  82 80
i "pn" 19.5 0.5  80 76
i "pn" 20   1.5  79 84
i "pn" 21.5 0.5  75 74
i "pn" 22   0.5  75 74
i "pn" 22.5 0.5  79 78
i "pn" 23   1    82 82
i "pn" 24   0.75 80 82
i "pn" 24.75 0.75 77 78
i "pn" 25.5 1    73 78
i "pn" 26.5 0.5  72 72
i "pn" 27   0.5  73 74
i "pn" 27.5 0.5  77 78
i "pn" 28   2    75 80
i "pn" 30   0.5  73 74
i "pn" 30.5 0.5  70 72
i "pn" 31   0.5  67 70
i "pn" 31.5 0.5  70 72
#

; the tune again, lighter: only its long notes, an octave up in places
#define TUNE2(B) #
b $B
i "pn" 1.5  1.5  79 82
i "pn" 3.5  0.5  75 70
i "pn" 4    1.5  85 80
i "pn" 6.75 0.75 76 78
i "pn" 8    1.5  80 84
i "pn" 10   0.75 87 80
i "pn" 10.75 1.25 84 76
i "pn" 13   1    77 80
i "pn" 14   0.5  78 78
i "pn" 14.5 1.5  77 76
i "pn" 17.5 1.5  84 86
i "pn" 19   0.5  87 80
i "pn" 19.5 0.5  84 76
i "pn" 20   1.5  79 80
i "pn" 23   1    82 78
i "pn" 24   0.75 80 80
i "pn" 24.75 0.75 85 80
i "pn" 25.5 1.5  84 78
i "pn" 28   2    75 78
i "pn" 30   0.5  73 72
i "pn" 30.5 1    70 72
#

#define BASS(B) #
b $B
i "bs" 0    1.5  32 92
i "bs" 2.5  0.5  32 80
i "bs" 3    0.5  39 76
i "bs" 3.5  0.5  32 72
i "bs" 4    1.5  31 92
i "bs" 6    1.25 36 86
i "bs" 7.5  0.5  36 72
i "bs" 8    1.5  29 92
i "bs" 10.5 0.75 29 80
i "bs" 11.5 0.5  36 74
i "bs" 12   1.5  39 90
i "bs" 14   1.25 32 86
i "bs" 15.5 0.5  36 74
i "bs" 16   1.5  37 92
i "bs" 18.5 0.75 37 80
i "bs" 19.5 0.5  32 74
i "bs" 20   1.5  36 92
i "bs" 22.5 0.75 36 80
i "bs" 23.5 0.5  31 74
i "bs" 24   1.5  34 92
i "bs" 26.5 0.75 34 80
i "bs" 27.5 0.5  41 74
i "bs" 28   1.5  39 90
i "bs" 30   1    39 82
i "bs" 31   0.5  39 74
i "bs" 31.5 0.5  31 76
#

#define FLUTE(B) #
b $B
i "fl" 2    2    82 68
i "fl" 4    1    82 66
i "fl" 5    1    79 64
i "fl" 6    2    76 68
i "fl" 9    2    84 72
i "fl" 11   1    80 64
i "fl" 12   1.5  82 68
i "fl" 13.5 0.5  78 62
i "fl" 14   2    77 66
i "fl" 18   0.5  75 62
i "fl" 18.5 0.5  77 64
i "fl" 19   1    80 68
i "fl" 20   3    79 68
i "fl" 24   1    77 66
i "fl" 25   1    73 62
i "fl" 26   2    72 64
i "fl" 28   2    75 64
#

; the electric piano holds the middle of each chord
#define PAD(B) #
b $B
i "ep" 0  3.8 55 52
i "ep" 0  3.8 60 52
i "ep" 0  3.8 63 52
i "ep" 4  1.9 53 50
i "ep" 4  1.9 58 50
i "ep" 4  1.9 61 50
i "ep" 6  1.9 52 50
i "ep" 6  1.9 58 50
i "ep" 6  1.9 61 50
i "ep" 8  3.8 51 52
i "ep" 8  3.8 56 52
i "ep" 8  3.8 60 52
i "ep" 12 1.9 54 50
i "ep" 12 1.9 58 50
i "ep" 12 1.9 61 50
i "ep" 14 1.9 54 50
i "ep" 14 1.9 60 50
i "ep" 14 1.9 65 50
i "ep" 16 3.8 53 52
i "ep" 16 3.8 56 52
i "ep" 16 3.8 60 52
i "ep" 20 3.8 51 52
i "ep" 20 3.8 55 52
i "ep" 20 3.8 58 52
i "ep" 24 3.8 53 52
i "ep" 24 3.8 56 52
i "ep" 24 3.8 61 52
i "ep" 28 1.9 56 50
i "ep" 28 1.9 61 50
i "ep" 28 1.9 65 50
i "ep" 30 1.9 55 50
i "ep" 30 1.9 61 50
i "ep" 30 1.9 64 50
#

; ---- the piece

$HAND(0)
$TUNE(0)

$HAND(32)
$TUNE(32)
$BASS(32)
$RIM(32)
$RIM(40)
$RIM(48)
$RIM(56)
$FILL(63)

$HAND(64)
$TUNE(64)
$BASS(64)
$FLUTE(64)
$BEAT(64)
$BEAT2(72)
$BEAT(80)
$BEAT2(88)

$HAND(96)
$TUNE2(96)
$PAD(96)
$BASS(96)
$BEAT(96)
$BEAT2(104)
$BEAT(112)
$BEAT2(120)

; the drums step out, the tape closes a little
b 0
i "filt" 128 4 3800 1400
i "filt" 152 8 1400 3800
$HAND(128)
$PAD(128)
$TUNE2(128)
$BASS(128)
$FILL(159)

$HAND(160)
$TUNE(160)
$PAD(160)
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

$HAND(192)
$TUNE(192)
$PAD(192)
$BASS(192)
$RIM(192)
$RIM(200)
$RIM(208)
$RIM(216)
b 224
i "ch" 0 8 58 44 51 55 60 63
i "bs" 0 6 32 86
e
