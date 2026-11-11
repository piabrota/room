; The drummer's patterns, shared by the pieces: each is a macro that plays
; two bars (or one, for the fills) from beat B. The off sixteenths are
; written straight; the orchestra swings them.

; boom bap: kick on one and the and of three, snare on two and four
#define BEAT(B) #
b $B
i "dr" 0    0 36 108
i "dr" 2.5  0 36 94
i "dr" 1    0 38 98
i "dr" 3    0 38 102
i "dr" 0    0 42 62
i "dr" 0.5  0 42 44
i "dr" 1    0 42 58
i "dr" 1.5  0 42 46
i "dr" 2    0 42 60
i "dr" 2.5  0 42 44
i "dr" 3    0 42 58
i "dr" 3.5  0 42 48
i "dr" 3.75 0 42 34
i "dr" 4    0 36 108
i "dr" 5.75 0 36 72
i "dr" 6.5  0 36 96
i "dr" 5    0 38 100
i "dr" 7    0 38 102
i "dr" 7.75 0 38 38
i "dr" 4    0 42 62
i "dr" 4.5  0 42 44
i "dr" 5    0 42 58
i "dr" 5.5  0 42 46
i "dr" 6    0 42 60
i "dr" 6.5  0 42 44
i "dr" 7    0 42 58
i "dr" 7.5  0 46 50
#

; the same with a busier kick, for the second half of a phrase
#define BEAT2(B) #
b $B
i "dr" 0    0 36 108
i "dr" 1.75 0 36 70
i "dr" 2.5  0 36 96
i "dr" 1    0 38 98
i "dr" 3    0 38 102
i "dr" 0    0 42 62
i "dr" 0.5  0 42 44
i "dr" 1    0 42 58
i "dr" 1.5  0 42 46
i "dr" 2    0 42 60
i "dr" 2.5  0 42 44
i "dr" 3    0 42 58
i "dr" 3.5  0 42 48
i "dr" 4    0 36 108
i "dr" 4.75 0 36 66
i "dr" 6.25 0 36 84
i "dr" 6.75 0 36 78
i "dr" 5    0 38 100
i "dr" 7    0 38 104
i "dr" 4    0 42 62
i "dr" 4.5  0 42 44
i "dr" 5    0 42 58
i "dr" 5.5  0 42 46
i "dr" 5.75 0 42 34
i "dr" 6    0 42 60
i "dr" 6.5  0 42 44
i "dr" 7    0 42 58
i "dr" 7.5  0 42 48
#

; quiet: a rim on two and four, a soft kick, hats on the beat
#define RIM(B) #
b $B
i "dr" 0    0 36 84
i "dr" 2.5  0 36 70
i "dr" 1    0 37 78
i "dr" 3    0 37 82
i "dr" 0    0 42 50
i "dr" 1    0 42 46
i "dr" 2    0 42 50
i "dr" 3    0 42 46
i "dr" 3.5  0 42 36
i "dr" 4    0 36 84
i "dr" 6.5  0 36 72
i "dr" 5    0 37 78
i "dr" 7    0 37 84
i "dr" 4    0 42 50
i "dr" 5    0 42 46
i "dr" 5.5  0 42 34
i "dr" 6    0 42 50
i "dr" 7    0 42 46
#

; a ride over two bars, on top of BEAT
#define RIDE(B) #
b $B
i "dr" 0    0 51 46
i "dr" 1    0 51 52
i "dr" 1.75 0 51 34
i "dr" 2    0 51 46
i "dr" 3    0 51 52
i "dr" 4    0 51 46
i "dr" 5    0 51 52
i "dr" 5.75 0 51 34
i "dr" 6    0 51 46
i "dr" 7    0 51 52
i "dr" 7.75 0 51 34
#

; a fill on the last beat of a bar: B is that beat
#define FILL(B) #
b $B
i "dr" 0    0 38 72
i "dr" 0.25 0 38 48
i "dr" 0.5  0 38 84
i "dr" 0.75 0 38 60
#
