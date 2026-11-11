; Bilhete na geladeira
; A minor, 94 beats a minute, the quickest. The chords go round by
; fifths, Dm9, G13, Cmaj9, Fmaj9, Bm7b5, E7b9, Am9, and A7 pushes back to
; the start. The piano stabs them and plays a riff on top; a vibraphone
; walks beside it in half notes.

#include "kit.sco"

t 0 94
i 1 0 0 94 0.2 4600
i "desk" 0 264
i "filt" 0 16 900 4600

#define COMP(B) #
b $B
i "pn" 0    1    50 68
i "pn" 2.5  1    45 58
i "ch" 0    0.5  62 53 57 60 64 0
i "ch" 1.5  1    56 53 57 60 64 0
i "ch" 3    0.5  52 53 57 60 64 0
i "pn" 4    1    43 68
i "pn" 6.5  1    50 58
i "ch" 4    0.5  62 53 57 59 64 0
i "ch" 5.5  1    56 53 57 59 64 0
i "ch" 7    0.5  52 53 57 59 64 0
i "pn" 8    1    48 68
i "pn" 10.5 1    43 58
i "ch" 8    0.5  62 52 55 59 62 0
i "ch" 9.5  1    56 52 55 59 62 0
i "ch" 11   0.5  52 52 55 59 62 0
i "pn" 12   1    41 68
i "pn" 14.5 1    48 58
i "ch" 12   0.5  62 52 55 57 60 0
i "ch" 13.5 1    56 52 55 57 60 0
i "ch" 15   0.5  52 52 55 57 60 0
i "pn" 16   1    47 68
i "pn" 18.5 1    41 58
i "ch" 16   0.5  62 57 62 65 0 0
i "ch" 17.5 1    56 57 62 65 0 0
i "ch" 19   0.5  52 57 62 65 0 0
i "pn" 20   1    40 68
i "pn" 22.5 1    47 58
i "ch" 20   0.5  62 56 62 65 0 0
i "ch" 21.5 1    56 56 62 65 0 0
i "ch" 23   0.5  52 56 62 65 0 0
i "pn" 24   1    45 68
i "pn" 26.5 1    52 58
i "ch" 24   0.5  62 55 59 60 64 0
i "ch" 25.5 1    56 55 59 60 64 0
i "ch" 27   0.5  52 55 59 60 64 0
i "pn" 28   1    45 68
i "pn" 30.5 1    49 58
i "ch" 28   0.5  62 55 61 65 0 0
i "ch" 29.5 1    56 55 61 65 0 0
i "ch" 31   0.5  52 55 61 65 0 0
#

#define RIFF(B) #
b $B
i "pn" 0    0.5  69 78
i "pn" 0.5  0.5  74 80
i "pn" 1    0.5  77 84
i "pn" 1.5  1    76 84
i "pn" 2.5  0.5  72 76
i "pn" 3    1    74 80
i "pn" 4    0.5  71 78
i "pn" 4.5  0.5  74 80
i "pn" 5    0.5  76 82
i "pn" 5.5  1    77 84
i "pn" 6.5  0.5  76 78
i "pn" 7    0.5  74 76
i "pn" 7.5  0.5  71 74
i "pn" 8    0.5  72 78
i "pn" 8.5  0.5  76 80
i "pn" 9    0.5  79 84
i "pn" 9.5  1.5  83 90
i "pn" 11   1    79 80
i "pn" 12   1    81 86
i "pn" 13   0.5  79 78
i "pn" 13.5 1    76 80
i "pn" 14.5 0.5  72 76
i "pn" 15   1    69 74
i "pn" 16   0.5  74 78
i "pn" 16.5 0.5  77 80
i "pn" 17   1.5  81 88
i "pn" 18.5 0.5  77 78
i "pn" 19   1    74 76
i "pn" 20   1    80 86
i "pn" 21   0.5  77 80
i "pn" 21.5 1    76 80
i "pn" 22.5 0.5  74 76
i "pn" 23   1    71 74
i "pn" 24   0.5  72 78
i "pn" 24.5 0.5  76 80
i "pn" 25   0.5  81 86
i "pn" 25.5 1.5  83 90
i "pn" 27   0.5  81 80
i "pn" 27.5 0.5  76 76
i "pn" 28   1    79 84
i "pn" 29   0.5  77 80
i "pn" 29.5 0.5  76 78
i "pn" 30   1    73 80
i "pn" 31   1    69 74
#

#define BASS(B) #
b $B
i "bs" 0    1    38 94
i "bs" 1.5  0.5  38 80
i "bs" 2.5  0.5  33 82
i "bs" 3.5  0.5  32 76
i "bs" 4    1    31 94
i "bs" 5.5  0.5  31 80
i "bs" 6.5  0.5  38 82
i "bs" 7.5  0.5  35 76
i "bs" 8    1    36 94
i "bs" 9.5  0.5  36 80
i "bs" 10.5 0.5  43 82
i "bs" 11.5 0.5  40 76
i "bs" 12   1    29 94
i "bs" 13.5 0.5  29 80
i "bs" 14.5 0.5  36 82
i "bs" 15.5 0.5  34 76
i "bs" 16   1    35 94
i "bs" 17.5 0.5  35 80
i "bs" 18.5 0.5  41 82
i "bs" 19.5 0.5  29 76
i "bs" 20   1    28 94
i "bs" 21.5 0.5  28 80
i "bs" 22.5 0.5  35 82
i "bs" 23.5 0.5  32 76
i "bs" 24   1    33 94
i "bs" 25.5 0.5  33 80
i "bs" 26.5 0.5  40 82
i "bs" 27.5 0.5  33 76
i "bs" 28   1    33 94
i "bs" 29.5 0.5  33 80
i "bs" 30.5 0.5  37 82
i "bs" 31.5 0.5  40 76
#

#define VIBES(B) #
b $B
i "vb" 0  2 76 70
i "vb" 2  2 77 68
i "vb" 4  2 76 70
i "vb" 6  2 74 68
i "vb" 8  2 79 70
i "vb" 10 2 76 68
i "vb" 12 2 76 70
i "vb" 14 2 72 68
i "vb" 16 2 81 72
i "vb" 18 2 77 68
i "vb" 20 2 80 72
i "vb" 22 2 83 70
i "vb" 24 2 84 72
i "vb" 26 2 83 70
i "vb" 28 2 81 70
i "vb" 30 2 85 72
#

; ---- the piece

$COMP(0)
$RIM(16)
$RIM(24)
$FILL(31)

$COMP(32)
$RIFF(32)
$BASS(32)
$BEAT(32)
$BEAT2(40)
$BEAT(48)
$BEAT2(56)

$COMP(64)
$RIFF(64)
$BASS(64)
$VIBES(64)
$BEAT(64)
$RIDE(64)
$BEAT2(72)
$RIDE(72)
$BEAT(80)
$RIDE(80)
$BEAT2(88)
$RIDE(88)
$FILL(95)

; the chords and the vibraphone, no riff
$COMP(96)
$BASS(96)
$VIBES(96)
$BEAT(96)
$BEAT2(104)
$BEAT(112)
$BEAT2(120)

; the riff alone on the bass, the tape closing
b 0
i "filt" 128 4 4600 1600
i "filt" 152 8 1600 4600
$RIFF(128)
$BASS(128)
$RIM(144)
$RIM(152)
$FILL(159)

$COMP(160)
$RIFF(160)
$BASS(160)
$BEAT(160)
$BEAT2(168)
$BEAT(176)
$BEAT2(184)

$COMP(192)
$RIFF(192)
$BASS(192)
$VIBES(192)
$BEAT(192)
$RIDE(192)
$BEAT2(200)
$RIDE(200)
$BEAT(208)
$RIDE(208)
$BEAT2(216)
$RIDE(216)

$COMP(224)
$RIFF(224)
$BASS(224)
$RIM(224)
$RIM(232)
$RIM(240)
$RIM(248)
b 256
i "ch" 0 8 60 50 53 57 60 64
i "vb" 0.5 6 76 64
i "bs" 0 6 38 86
e
