; Depois do metrô
; B flat minor, 92 beats a minute, the one that nods its head. Four bars
; that climb, Gbmaj9, Ab6/9, Bbm11, and four that turn back through
; Dbmaj9 and F7#9. The piano plays a riff on the minor pentatonic over
; pushed chords.

#include "kit.sco"

t 0 92
i 1 0 0 92 0.2 4600
i "desk" 0 264
i "filt" 0 16 900 4600

#define COMP(B) #
b $B
i "pn" 0    1    42 68
i "pn" 2.5  1    42 60
i "ch" 0    0.75 62 58 61 65 68 0
i "ch" 1.5  0.5  54 58 61 65 68 0
i "ch" 2.5  1    58 58 61 65 68 0
i "pn" 4    1    44 68
i "pn" 6.5  1    44 60
i "ch" 4    0.75 62 58 60 63 65 0
i "ch" 5.5  0.5  54 58 60 63 65 0
i "ch" 6.5  1    58 58 60 63 65 0
i "pn" 8    1    46 68
i "pn" 10.5 1    46 60
i "ch" 8    0.75 62 56 61 63 65 0
i "ch" 9.5  0.5  54 56 61 63 65 0
i "ch" 10.5 1    58 56 61 63 65 0
i "pn" 12   1    46 68
i "pn" 14.5 1    41 60
i "ch" 12   0.75 62 56 61 63 65 0
i "ch" 13.5 0.5  54 56 61 63 65 0
i "ch" 14.5 1    58 56 60 63 0 0
i "pn" 16   1    42 68
i "pn" 18.5 1    42 60
i "ch" 16   0.75 62 58 61 65 68 0
i "ch" 17.5 0.5  54 58 61 65 68 0
i "ch" 18.5 1    58 58 61 65 68 0
i "pn" 20   1    44 68
i "pn" 22.5 1    44 60
i "ch" 20   0.75 62 58 60 63 65 0
i "ch" 21.5 0.5  54 58 60 63 65 0
i "ch" 22.5 1    58 58 60 63 65 0
i "pn" 24   1    49 68
i "pn" 26.5 1    49 60
i "ch" 24   0.75 62 53 56 60 63 0
i "ch" 25.5 0.5  54 53 56 60 63 0
i "ch" 26.5 1    58 53 56 60 63 0
i "pn" 28   1    41 68
i "pn" 30.5 1    41 60
i "ch" 28   0.75 62 57 63 68 0 0
i "ch" 29.5 0.5  54 57 63 68 0 0
i "ch" 30.5 1    58 57 63 68 0 0
#

#define RIFF(B) #
b $B
i "pn" 0    0.5  77 80
i "pn" 0.5  0.5  80 82
i "pn" 1    0.75 82 88
i "pn" 1.75 0.25 80 72
i "pn" 2    0.5  77 80
i "pn" 2.5  0.5  73 76
i "pn" 3    1    75 80
i "pn" 4    0.5  75 78
i "pn" 4.5  0.5  77 80
i "pn" 5    1    72 80
i "pn" 6    0.5  75 78
i "pn" 6.5  1.5  77 82
i "pn" 8    0.5  77 80
i "pn" 8.5  0.5  80 82
i "pn" 9    0.75 82 88
i "pn" 9.75 0.75 85 88
i "pn" 10.5 0.5  82 82
i "pn" 11   0.5  80 78
i "pn" 11.5 0.5  77 76
i "pn" 12   1.5  73 82
i "pn" 13.5 0.5  75 76
i "pn" 14   2    77 82
i "pn" 16   0.5  77 80
i "pn" 16.5 0.5  80 82
i "pn" 17   0.75 82 88
i "pn" 17.75 0.25 80 72
i "pn" 18   0.5  77 80
i "pn" 18.5 0.5  73 76
i "pn" 19   1    75 80
i "pn" 20   0.5  75 78
i "pn" 20.5 0.5  77 80
i "pn" 21   1    80 84
i "pn" 22   0.5  84 86
i "pn" 22.5 0.5  82 82
i "pn" 23   1    80 80
i "pn" 24   1    77 82
i "pn" 25   0.5  75 76
i "pn" 25.5 1    72 78
i "pn" 26.5 0.5  68 72
i "pn" 27   0.5  72 74
i "pn" 27.5 0.5  75 76
i "pn" 28   1.5  80 86
i "pn" 29.5 0.5  77 78
i "pn" 30   0.5  75 76
i "pn" 30.5 0.5  72 74
i "pn" 31   1    69 76
#

#define BASS(B) #
b $B
i "bs" 0    0.75 30 94
i "bs" 1.5  0.5  30 80
i "bs" 2.5  0.5  30 84
i "bs" 3    0.5  37 78
i "bs" 3.5  0.5  30 74
i "bs" 4    0.75 32 94
i "bs" 5.5  0.5  32 80
i "bs" 6.5  0.5  32 84
i "bs" 7    0.5  39 78
i "bs" 7.5  0.5  33 76
i "bs" 8    0.75 34 94
i "bs" 9.5  0.5  34 80
i "bs" 10.5 0.5  34 84
i "bs" 11   0.5  41 78
i "bs" 11.5 0.5  34 74
i "bs" 12   0.75 34 94
i "bs" 13.5 0.5  34 80
i "bs" 14.5 0.5  41 84
i "bs" 15   0.5  32 78
i "bs" 15.5 0.5  31 76
i "bs" 16   0.75 30 94
i "bs" 17.5 0.5  30 80
i "bs" 18.5 0.5  30 84
i "bs" 19   0.5  37 78
i "bs" 19.5 0.5  30 74
i "bs" 20   0.75 32 94
i "bs" 21.5 0.5  32 80
i "bs" 22.5 0.5  32 84
i "bs" 23   0.5  39 78
i "bs" 23.5 0.5  36 76
i "bs" 24   0.75 37 94
i "bs" 25.5 0.5  37 80
i "bs" 26.5 0.5  37 84
i "bs" 27   0.5  44 78
i "bs" 27.5 0.5  30 76
i "bs" 28   0.75 29 94
i "bs" 29.5 0.5  29 80
i "bs" 30.5 0.5  29 84
i "bs" 31   0.5  36 78
i "bs" 31.5 0.5  29 74
#

#define FLUTE(B) #
b $B
i "fl" 0    2    85 72
i "fl" 2    2    82 68
i "fl" 4    3    84 70
i "fl" 9    0.5  77 66
i "fl" 9.5  0.5  80 68
i "fl" 10   2    82 72
i "fl" 12   1    80 68
i "fl" 13   3    77 68
i "fl" 16   1.5  85 72
i "fl" 17.5 0.5  87 72
i "fl" 18   2    89 76
i "fl" 20   2    87 72
i "fl" 22   2    84 68
i "fl" 24   1    80 68
i "fl" 25   1    84 70
i "fl" 26   2    87 74
i "fl" 28   2    84 70
i "fl" 30   2    81 68
#

; ---- the piece

$COMP(0)
$RIFF(0)
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
$FLUTE(64)
$BEAT(64)
$RIDE(64)
$BEAT2(72)
$RIDE(72)
$BEAT(80)
$RIDE(80)
$BEAT2(88)
$RIDE(88)
$FILL(95)

; the chords and the flute, no riff
$COMP(96)
$BASS(96)
$FLUTE(96)
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
$RIFF(224)
$BASS(224)
$RIM(224)
$RIM(232)
$RIM(240)
$RIM(248)
b 256
i "ch" 0 8 60 46 56 61 63 65
i "bs" 0 6 34 86
e
