; Chuva fina no Catete
; G minor, 84 beats a minute. Ebmaj9 falls to D7 and lands on Gm9; the
; second time it ends on C9, the dorian door left open. The piano has the
; tune, and a vibraphone answers it from the other side of the room.

#include "kit.sco"

t 0 84
i 1 0 0 84 0.16 4200
i "desk" 0 232
i "filt" 0 28 700 4200

; the left hand and the chords, eight bars
#define HANDS(B) #
b $B
i "pn" 0    2    39 66
i "pn" 2.5  1.5  46 58
i "ch" 0    1.5  58 55 58 62 65 0
i "ch" 1.5  0.75 50 55 58 62 65 0
i "ch" 3    0.75 52 55 58 62 65 0
i "pn" 4    2    38 66
i "pn" 6.5  1.5  45 58
i "ch" 4    1.5  58 54 60 65 0 0
i "ch" 5.5  0.75 50 54 60 65 0 0
i "ch" 7    0.75 52 54 60 65 0 0
i "pn" 8    2    43 66
i "pn" 10.5 1.5  50 58
i "ch" 8    1.5  58 53 57 58 62 0
i "ch" 9.5  0.75 50 53 57 58 62 0
i "ch" 11   0.75 52 53 57 58 62 0
i "pn" 12   2    43 66
i "pn" 14   2    46 62
i "ch" 12   1.5  58 53 57 58 62 0
i "ch" 14   1.5  56 56 62 67 0 0
i "pn" 16   2    39 66
i "pn" 18.5 1.5  46 58
i "ch" 16   1.5  58 55 58 62 65 0
i "ch" 17.5 0.75 50 55 58 62 65 0
i "ch" 19   0.75 52 55 58 62 65 0
i "pn" 20   2    38 66
i "pn" 22.5 1.5  45 58
i "ch" 20   1.5  58 54 58 60 0 0
i "ch" 21.5 0.75 50 54 58 60 0 0
i "ch" 23   0.75 52 54 58 60 0 0
i "pn" 24   2    43 66
i "pn" 26.5 1.5  50 58
i "ch" 24   1.5  58 53 58 60 62 0
i "ch" 25.5 0.75 50 53 58 60 62 0
i "ch" 27   0.75 52 53 58 60 62 0
i "pn" 28   2    48 66
i "pn" 30.5 1.5  43 58
i "ch" 28   1.5  58 52 58 62 0 0
i "ch" 29.5 0.75 50 52 58 62 0 0
i "ch" 31   0.75 52 52 58 62 0 0
#

#define TUNE(B) #
b $B
i "pn" 0    1    74 80
i "pn" 1    0.5  77 80
i "pn" 1.5  1.5  79 88
i "pn" 3    0.5  77 78
i "pn" 3.5  0.5  74 74
i "pn" 4    0.75 77 84
i "pn" 4.75 0.75 74 78
i "pn" 5.5  1    72 80
i "pn" 6.5  0.5  69 74
i "pn" 7    1    66 72
i "pn" 8    0.5  67 76
i "pn" 8.5  0.5  70 78
i "pn" 9    1    74 82
i "pn" 10   1.5  81 90
i "pn" 11.5 0.5  79 78
i "pn" 12   1    77 82
i "pn" 13   1    74 78
i "pn" 14   0.5  79 84
i "pn" 14.5 0.5  77 80
i "pn" 15   0.5  74 76
i "pn" 15.5 0.5  70 72
i "pn" 16   0.5  74 78
i "pn" 16.5 0.5  77 80
i "pn" 17   1.5  82 90
i "pn" 18.5 0.5  79 80
i "pn" 19   1    77 78
i "pn" 20   1    82 86
i "pn" 21   0.5  81 80
i "pn" 21.5 1    78 82
i "pn" 22.5 0.5  74 76
i "pn" 23   1    72 76
i "pn" 24   0.75 70 78
i "pn" 24.75 0.75 72 80
i "pn" 25.5 1.5  74 84
i "pn" 27   0.5  77 80
i "pn" 27.5 0.5  79 82
i "pn" 28   1.5  76 86
i "pn" 29.5 0.5  74 76
i "pn" 30   1    70 76
i "pn" 31   1    67 72
#

#define BASS(B) #
b $B
i "bs" 0    1.5  39 92
i "bs" 2.5  0.75 39 82
i "bs" 3.5  0.5  34 74
i "bs" 4    1.5  38 92
i "bs" 6.5  0.5  38 80
i "bs" 7    0.5  33 76
i "bs" 7.5  0.5  30 76
i "bs" 8    1.5  31 92
i "bs" 10.5 0.75 31 82
i "bs" 11.5 0.5  38 74
i "bs" 12   1.5  31 92
i "bs" 14   1    34 86
i "bs" 15   0.5  34 76
i "bs" 15.5 0.5  38 76
i "bs" 16   1.5  39 92
i "bs" 18.5 0.75 39 82
i "bs" 19.5 0.5  34 74
i "bs" 20   1.5  38 92
i "bs" 22.5 0.75 38 82
i "bs" 23.5 0.5  30 76
i "bs" 24   1.5  31 92
i "bs" 26.5 0.75 31 82
i "bs" 27.5 0.5  34 76
i "bs" 28   1.5  36 92
i "bs" 30.5 0.5  36 80
i "bs" 31   0.5  40 76
i "bs" 31.5 0.5  38 76
#

; the vibraphone's answers
#define VIBES(B) #
b $B
i "vb" 2    2    82 72
i "vb" 4    2    81 70
i "vb" 6    2    78 68
i "vb" 9    1.5  86 74
i "vb" 10.5 1.5  82 68
i "vb" 12   2    81 70
i "vb" 14   2    80 70
i "vb" 16   1    79 70
i "vb" 17   1    82 72
i "vb" 18   2    86 76
i "vb" 20   2    84 72
i "vb" 22   2    82 70
i "vb" 24   1.5  84 72
i "vb" 25.5 0.5  82 66
i "vb" 26   2    79 70
i "vb" 28   2    76 70
i "vb" 30   2    74 68
#

; ---- the piece

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
$VIBES(64)
$BEAT(64)
$BEAT2(72)
$BEAT(80)
$BEAT2(88)
$FILL(95)

; the vibraphone alone over the hands
$HANDS(96)
$VIBES(96)
$BASS(96)
$BEAT(96)
$RIDE(96)
$BEAT2(104)
$RIDE(104)
$BEAT(112)
$RIDE(112)
$BEAT2(120)
$RIDE(120)

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
$TUNE(160)
$BASS(160)
$VIBES(160)
$BEAT(160)
$BEAT2(168)
$BEAT(176)
$BEAT2(184)

$HANDS(192)
$TUNE(192)
$BASS(192)
$VIBES(192)
$RIM(192)
$RIM(200)
$RIM(208)
$RIM(216)
b 224
i "ch" 0 8 60 43 53 57 58 62
i "vb" 0.5 6 81 66
i "bs" 0 6 31 86
e
