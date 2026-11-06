---
name: room-pr
description: Open or update a pull request on piabrota/room the way the owner asks - just check, stills and a video from just record, the replay row in both READMEs. Use before every pull request that changes the site.
---

# A pull request on the room

The owner's rules (`AGENTS.md`, "Working here", and the project's instructions):

1. **`just check` passes** (`scripts/check.mjs`, then a build). It tests the invariants a script
   can test; the rest is on the reviewer, so read the ten invariants in `AGENTS.md` against the diff.
2. **Pictures.** A pull request that changes the site carries at least three screenshots of the
   room and a video of about 15 s of navigating and clicking. `just record` makes both in
   `docs/record/`; commit them and show them in the pull request.
   - While working, use `just stills` (stills only, a minute or two).
   - Record the video once, at the end. On macOS it uses the GPU (Metal) at 1280×720 and should take
     a few minutes (not yet measured). On Linux without a GPU it draws in software (SwiftShader) at 960×540 with
     ambient occlusion off (`?record`): about 0.7 s a frame, 13 min for the 35 s video (it was 25). `RECORD_SIZE=1280x720` and
     `RECORD_GPU=1` override.
   - The video's moves are in `scripts/record.mjs`; keep them deterministic (the room is stepped
     by `window.__room.step(1/30)`, never by wall time).
   - A light change: also run `just light` and quote its table (see the `room-light` skill).
3. **The replay.** Add the prompt that drove the pull request to `README.md` and
   `README.pt-BR.md`: a row in the table (prompt time in UTC, the pull request and what it did,
   how long it took, from the prompt to ready for review) and the prompt as typed, typos fixed,
   in a `text` block under its number. The Portuguese row is translated; the prompt stays in
   English. Never put the reference room's address in a prompt (invariant 2).
4. **The description** says what was asked, what changed, the proof (commands and their
   output), and what was not checked (how it looks on a real screen, how it sounds).
5. Work on a branch, never on `main`. Credit Felix Rieseberg by name only; link none of his pages,
   repositories or issues anywhere, the pull request included.
