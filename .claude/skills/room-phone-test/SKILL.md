---
name: room-phone-test
description: Check the room on a phone, in emulation or on a real device - frame rate, layout at phone width, taps, the lock's keypad. Use before a pull request that changes how the room looks, moves or loads on mobile, or when a bug only shows on a phone.
---

# Testing the room on a phone

Headless Chrome in this container draws in software. It tells you the layout, the taps and the
relative cost of a frame; it cannot tell you how hot a phone gets or its real frame rate. Say which
of the two you did in the pull request (invariant 10: what was not checked).

## In emulation (here)

- `just mobile`: the numbers (see `room-mobile`).
- A screenshot at phone width with Playwright: `devices['iPhone 13']` (do not set
  `deviceScaleFactor` yourself, the device sets it), the URL `?hifi&night&lite&record`, wait for
  `#loading.done`, click `#enter button`. `?record` turns the screen guard off (`src/guard.js`).
- Taps: `page.tap(selector)` or `page.touchscreen.tap(x, y)` on the canvas, then read
  `#tooltip.on`: a tap shows the label like a hover does (`src/interact.js`).
- The lock: tap the door (shot `loop` looks at the front wall), check that `#lock` is visible, tap
  the keys, and read `.status`. Each digit of `config.door.lock.code` counts a list of
  `src/config.js`, so the test reads the code from there, never hardcodes it.
- `window.__room.quality.name` is `lite` on the phone, `full` on the laptop.

## On a real phone (the owner's)

- Android: Chrome → `chrome://inspect` on the computer, USB debugging on the phone; the
  Performance panel records real frames. iPhone: Safari → Develop → the phone, with Web Inspector
  on in the phone's Safari settings; the Timelines tab.
- Run `npx vite --host` (the dev server, open to the LAN) and open the printed LAN address on the phone, or open the pull
  request's preview if there is one.
- Look for: the frame rate after two minutes (a phone slows when hot), the time until the room
  shows on a 4G connection, text that cannot be read at 390 px, a button under a thumb that is
  smaller than 44 px.
