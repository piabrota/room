; The band of piabrota RADIO's lofi station, in Csound: a grand piano,
; an upright bass, a flute, an electric piano and a jazz kit, played
; through a worn tape: a low-pass on the piano, wow and flutter, soft
; saturation, a room, the kick ducking the rest, and a little vinyl dust.
;
; The pieces are the scores beside this file (`*.sco`); `just lofi`
; renders each one with this orchestra. The instruments are the General
; MIDI samples of FluidR3 GM (Frank Wen, MIT), read with the sf opcodes;
; the path of the .sf2 file comes in as the macro SF (--omacro:SF=...).
;
; A score talks to five players, in beats (the score's `t` line and the
; `set` line give the same tempo):
;
;   i "pn" beat dur note vel          the piano, one note
;   i "ch" beat dur vel n1 n2 n3 n4 n5   the piano, a chord rolled from the bottom (0 = no note)
;   i "ar" beat step vel n1 ... n8    the piano, up to eight notes one after another, `step` beats apart (0 = a rest)
;   i "ep" beat dur note vel          the electric piano
;   i "bs" beat dur note vel          the upright bass
;   i "fl" beat dur note vel          the flute
;   i "dr" beat 0   note vel          the kit (36 kick, 37 rim, 38 snare, 42 hat, 46 open hat, 51 ride)
;
; and to the desk:
;
;   i 1 0 0 bpm swing cut             `set`: the tempo, how late the off sixteenths are (0 to 0.33), the piano's low-pass in Hz
;   i "filt" beat dur from to         moves the piano's low-pass
;   i "desk" 0 beats                  the mix, for the whole piece; it fades the last eight beats
;
; Every player is a little late and a little uneven, from one seed, so a
; render is the same every time.

sr = 44100
ksmps = 16
nchnls = 2
0dbfs = 1

seed 8611

gisf     sfload "$SF"
giPiano  sfpreset 0, 0, gisf, 0
giRhodes sfpreset 4, 0, gisf, 1
giBass   sfpreset 32, 0, gisf, 2
giFlute  sfpreset 73, 0, gisf, 3
giKit    sfpreset 32, 128, gisf, 4

gibeat  init 60 / 86
giswing init 0.14
gkcut   init 4200
gkduck  init 0

gaPnL init 0
gaPnR init 0
gaEpL init 0
gaEpR init 0
gaBs  init 0
gaFlL init 0
gaFlR init 0
gaDrL init 0
gaDrR init 0
gaRvL init 0
gaRvR init 0

; how late a note that starts at `it` seconds is played: the off sixteenths swing
opcode Late, i, i
  it xin
  i16 = it / (gibeat / 4)
  inear = round(i16)
  ilate = (abs(i16 - inear) < 0.05 && (inear % 2) == 1) ? giswing * gibeat / 4 : 0
  xout ilate
endop

instr 1 ; set
  gibeat = 60 / p4
  giswing = p5
  gkcut init p6
endin

; ---- the players the score calls: each one humanizes and hands the note on

instr pn
  ihum random 0, 0.014
  ivar random -6, 6
  schedule "piano", Late(p2) + ihum, p3, p4, p5 + ivar
endin

instr ch
  ilate = Late(p2)
  icount = 0
  ilast = p9
  indx = 5
  while indx <= 9 do
    inote = p(indx)
    if inote > 0 then
      ihum random 0, 0.008
      ivar random -5, 5
      schedule "piano", ilate + icount * 0.017 + ihum, p3, inote, p4 + ivar
      icount += 1
    endif
    indx += 1
  od
endin

instr ar
  ilast = p12
  indx = 5
  while indx <= 12 do
    inote = p(indx)
    iat = (indx - 5) * p3
    if inote > 0 then
      ihum random 0, 0.012
      ivar random -6, 4
      iacc = (indx == 5) ? 8 : 0
      schedule "piano", iat + Late(p2 + iat) + ihum, p3 * 1.7, inote, p4 + ivar + iacc
    endif
    indx += 1
  od
endin

instr ep
  ihum random 0, 0.012
  schedule "rhodes", Late(p2) + ihum, p3, p4, p5
endin

instr bs
  ihum random 0.004, 0.016
  ivar random -4, 4
  schedule "bass", Late(p2) + ihum, p3, p4, p5 + ivar
endin

instr fl
  ihum random 0.01, 0.03
  schedule "flute", Late(p2) + ihum, p3, p4, p5
endin

instr dr
  ihum random 0, 0.009
  ivar random -7, 7
  ilazy = (p4 == 38 || p4 == 37) ? 0.012 : 0 ; the backbeat sits behind
  schedule "kit", Late(p2) + ihum + ilazy, 1.2, p4, p5 + ivar
endin

instr filt
  gkcut expseg p4, p3, p5
endin

; ---- the voices

instr piano
  ivel = limit(p5, 1, 127)
  iamp = (ivel / 127) ^ 1.5 * 0.00012
  a1, a2 sfplay3 ivel, p4, iamp, cpsmidinn(p4), giPiano, 1
  aenv linsegr 1, p3, 1, 0.3, 0
  ipan = 0.5 + (p4 - 64) / 110
  gaPnL += (a1 * (1 - ipan) * 1.4 + a2 * 0.1) * aenv
  gaPnR += (a2 * ipan * 1.4 + a1 * 0.1) * aenv
endin

instr rhodes
  ivel = limit(p5, 1, 127)
  iamp = (ivel / 127) ^ 1.3 * 0.000022
  a1, a2 sfplay3 ivel, p4, iamp, cpsmidinn(p4), giRhodes, 1
  aenv linsegr 0, 0.02, 1, p3, 1, 0.5, 0
  ktrem oscili 0.35, 3.1
  gaEpL += a1 * aenv * (1 + ktrem)
  gaEpR += a2 * aenv * (1 - ktrem)
endin

instr bass
  ivel = limit(p5, 1, 127)
  iamp = (ivel / 127) ^ 1.2 * 0.0001
  a1, a2 sfplay3 ivel, p4, iamp, cpsmidinn(p4), giBass, 1
  aenv linsegr 1, p3, 1, 0.09, 0
  gaBs += (a1 + a2) * 0.5 * aenv
endin

instr flute
  ivel = limit(p5, 1, 127)
  iamp = (ivel / 127) * 0.000024
  kdep linseg 0, 0.25, 0, 0.4, 0.0045, p3, 0.0045 ; the vibrato comes in late
  kvib oscili kdep, 5.1
  a1, a2 sfplay3 ivel, p4, iamp, cpsmidinn(p4) * (1 + kvib), giFlute, 1
  aenv linsegr 0, 0.06, 1, p3, 0.85, 0.18, 0
  gaFlL += a1 * aenv
  gaFlR += a2 * aenv
endin

instr kit
  ivel = limit(p5, 1, 127)
  iamp = (ivel / 127) ^ 1.4 * 0.00015
  a1, a2 sfplay3 ivel, p4, iamp, 1, giKit, 0
  ilen = (p4 == 42) ? 0.09 : ((p4 == 46) ? 0.4 : 1)
  aenv linseg 1, ilen, 1, 0.08, 0, 1, 0
  gaDrL += a1 * aenv
  gaDrR += a2 * aenv
  if p4 == 36 then
    kd expseg 1, 0.28, 0.001, 1, 0.001
    gkduck = max(gkduck, kd * ivel / 110)
  endif
endin

; ---- the desk: the tape, the room, the mix

instr desk
  ; the piano through the tape: wow and flutter, the low-pass, saturation
  awow  oscili 1.1, 0.43
  aflut oscili 0.18, 5.7
  adel  = 14 + awow + aflut
  apL vdelay3 gaPnL, adel, 40
  apR vdelay3 gaPnR, adel, 40
  kcut port gkcut, 0.05
  apL butterlp apL, kcut
  apR butterlp apR, kcut
  apL butterhp apL, 110
  apR butterhp apR, 110
  apL = tanh(apL * 1.6) / 1.6
  apR = tanh(apR * 1.6) / 1.6

  aeL butterlp gaEpL, 2600
  aeR butterlp gaEpR, 2600

  ab butterlp gaBs, 900
  ab = tanh(ab * 1.8) / 1.8

  afL butterlp gaFlL, 4200
  afR butterlp gaFlR, 4200
  ; an echo for the flute, a dotted eighth away
  afeL delay afL, gibeat * 0.75
  afeR delay afR, gibeat * 0.76
  afL = afL + afeR * 0.22
  afR = afR + afeL * 0.22

  adL butterlp gaDrL, 7500
  adR butterlp gaDrR, 7500
  adL = tanh(adL * 2.2) / 2.2
  adR = tanh(adR * 2.2) / 2.2

  ; vinyl: a few clicks a second, and a low rumble of dust
  aclk dust2 0.04, 4
  aclk butterbp aclk, 2800, 2400
  adst dust2 0.006, 70
  adst butterlp adst, 5000
  avin = aclk + adst

  ; the room
  gaRvL = apL * 0.22 + afL * 0.4 + aeL * 0.25 + adL * 0.06
  gaRvR = apR * 0.22 + afR * 0.4 + aeR * 0.25 + adR * 0.06
  arL, arR reverbsc gaRvL, gaRvR, 0.78, 5500

  ; the kick pushes the piano, the electric piano and the room down
  kduck port 1 - 0.3 * gkduck, 0.006
  aL = (apL + aeL + arL) * kduck + ab * 0.9 + afL + adL + avin
  aR = (apR + aeR + arR) * kduck + ab * 0.9 + afR + adR + avin * 0.9

  aL butterhp aL, 32
  aR butterhp aR, 32
  aL butterlp aL, 11000
  aR butterlp aR, 11000
  ifade = gibeat * 8
  kfade linseg 0, 0.05, 1, p3 - ifade - 0.05, 1, ifade, 0, 1, 0
  outs tanh(aL * 1.2) * 0.8 * kfade, tanh(aR * 1.2) * 0.8 * kfade

  gkduck = 0
  clear gaPnL, gaPnR, gaEpL, gaEpR, gaBs, gaFlL, gaFlR, gaDrL, gaDrR
endin
