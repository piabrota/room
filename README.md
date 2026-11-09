# room

English · [Português (Brasil)](README.pt-BR.md)

A personal site that is a 3D room. Switch between camera shots, hover over things to see what
they are, put a tape into the VCR to play it on the TV, and listen to the room. Built with
[three.js](https://threejs.org) and [Vite](https://vite.dev), as static files.

The idea of a room like this comes from **Felix Rieseberg** (`felixrieseberg` on GitHub), who
made one as his own personal site. His name and login are written as text, with no link
([`AGENTS.md`](AGENTS.md), invariant 2). This is a separate build, with its own assets, signature, sounds and interactions
([`CREDITS.md`](CREDITS.md)).

![the room by night: the back wall with the desk, the TV and the window over Rio, then the left wall of projects, the right wall of the sea and the front wall with the loop and the door, five seconds or more each, the pointer hovering over things and clicking](docs/record/room.webp)

## Replay: how it was built

The room was built from prompts, in one Claude project, in about two hours of agent time
spread over a day. A coordinator (Claude Fable 5.1) read each prompt and started a thread for
it; each thread (Claude Opus 5.5, 1M context, in Claude Code) did the work and opened the pull
request. Only the owner's prompts are shown, with their typos fixed; the replies are left out. The
first two are in files, so you can read them whole:

- [`prompts/PROMPT_1.txt`](prompts/PROMPT_1.txt): understand the reference room, start a starter
- [`prompts/PROMPT_2.txt`](prompts/PROMPT_2.txt): the repository, its ten invariants ([`AGENTS.md`](AGENTS.md))

To set up the same Claude project for your fork, without the Claude Code CLI, follow
[`docs/CLAUDE_PROJECT.md`](docs/CLAUDE_PROJECT.md): its name, repositories, instructions and models.

Times are UTC. "Took" runs from the prompt to the pull request being ready for review.

| # | Prompt (UTC) | Result | Took |
|---|---|---|---|
| 1 | 4 Nov 21:20 | a starter scaffold, outside this repository | 7 min |
| 2 | 5 Nov 14:35 | [#1](https://github.com/piabrota/room/pull/1) starter, `AGENTS.md`, just and Nix | 7 min |
| 3 | 5 Nov 16:51 | [#2](https://github.com/piabrota/room/pull/2) the LOFI/HIFI toggle | 4 min |
| 4 | 5 Nov 19:17 | the deploy to room.piabrota.art, in [piabrota/nix-os#146](https://github.com/piabrota/nix-os/pull/146) (live 22:11) | 4 min |
| 5 | 5 Nov 22:28 | [#3](https://github.com/piabrota/room/pull/3) the piabrota tape and `just compose`; [#4](https://github.com/piabrota/room/pull/4) smooth moves, post-processing | 11 and 22 min |
| 6 | 5 Nov 22:51 | [#5](https://github.com/piabrota/room/pull/5) `just record`, the right wall and the ceiling | 17 min |
| 7 | 5 Nov 23:21 | [#6](https://github.com/piabrota/room/pull/6) the room in 360°, the window on Rio, piabrota RADIO | 50 min |
| 8 | 6 Nov 00:33 | [#7](https://github.com/piabrota/room/pull/7) the radio's own budget; [#12](https://github.com/piabrota/room/pull/12) 40 radio tracks in two stations and a listeners count, day and night, the rain button, the slipbox, the letter board, the favicon | 3 and 45 min |
| 9 | 6 Nov 00:50 | this README | |
| 10 | 6 Nov 01:24 | [#13](https://github.com/piabrota/room/pull/13) the project's settings, in [`docs/CLAUDE_PROJECT.md`](docs/CLAUDE_PROJECT.md) | 6 min |
| 11 | 6 Nov 01:40 | [#15](https://github.com/piabrota/room/pull/15) the wide window in the middle, a locked door, your feet when you look down, photographed wood, a beige computer, VHS tapes with retro labels, the CV, marola.dev and ouroboric-dev tapes, a fax, the Pirsig and pirsig cards, the closed-source file | 35 min |
| 12 | 6 Nov 03:38 | [#16](https://github.com/piabrota/room/pull/16) a survey, [`docs/SURVEY.md`](docs/SURVEY.md): other rooms, frameworks, animation, our own shaders, a faster `just record`, the ▲ grid view with WW3 on triangles, and why the day blows out to white | 42 min |
| 13 | 6 Nov 04:07 | [#16](https://github.com/piabrota/room/pull/16), second commit: the day no longer burns white (bloom by day and by night, AgX, the lamp dimmed by day), `just light`, a faster `just record` and `just stills`, CRT glass on the TV, dust in the window's light, and five Claude skills in `.claude/skills/` | 26 min |
| 14 | 5 Nov 23:23 | [#17](https://github.com/piabrota/room/pull/17) LOFI as a page to read: home, about, work, posts from Markdown, online, subscribe by RSS (built 6 Nov) | 15 min |
| 15 | 6 Nov 04:29 | [#18](https://github.com/piabrota/room/pull/18) ▲ grid, the tenth view on key 0: a chart on the wall that opens a map of the Brazilian coast on 22 366 triangles, with 24 h of GFS wind and the sea it raises; the TV's light follows the tape, rain on the glass, swaying leaves, Vite 6 | 52 min |
| 16 | 6 Nov 05:15 | [#19](https://github.com/piabrota/room/pull/19) ▲ grid: the sea's temperature from Copernicus Marine (OSTIA, read from its open zarr store) as a second layer, and particles that flow where the waves travel, in place of the wind's ticks | 30 min |
| 17 | 7 Nov 18:24 | [#20](https://github.com/piabrota/room/pull/20) the README's video, by night only, the four walls five seconds or more each, also as `docs/record/room.webp`; the same in h0ffmann's profile ([h0ffmann/h0ffmann#144](https://github.com/h0ffmann/h0ffmann/pull/144)) | 30 min |
| 18 | 7 Nov 18:53 | [#21](https://github.com/piabrota/room/pull/21) the night no longer burns white at the desk (the lamp at 0.7 by night, a softer bloom), and `scripts/blow_light.sh` (`just blow-light`), which fails a video when a frame burns; `just record` runs it. Both videos again in the profile ([h0ffmann/h0ffmann#145](https://github.com/h0ffmann/h0ffmann/pull/145)) | 45 min |
| 19 | 9 Nov 05:50 | [#23](https://github.com/piabrota/room/pull/23) ▲ grid fills the whole window: the signature and the switches step aside while the map is open, the panel folds to the title, the time and the legend (`+` for the rest), a ⛶ button for the whole screen, the sources in an ⓘ in the corner, and the coast fitted beside the panel | 30 min |

**1.** [`PROMPT_1.txt`](prompts/PROMPT_1.txt)

```text
user> '[the address of Felix Rieseberg's room] Check the website of this Anthropic Engineer. It is
not something professional, is his personal website. I just want to understand structure,
frameworks, and try to build one on my own, with my assets, my signature, my sounds, my
interaction'
```

**2.** [`PROMPT_2.txt`](prompts/PROMPT_2.txt)

```text
user> 'I have added piabrota/room. Create the first PR, with AGENTS.md 10 invariants, derive
the invariants based on the first prompts (including threads). Idea must be credited to
original creator, but don't link any external repo or issue. Consider this will be tested with
macOS or Nix with just and Claude Code assistance'
```

**3.**

```text
user> 'merged, now add a LOFI HIFI button for switching between 3D rendered view vs plain text'
```

**4.**

```text
user> 'please create a new PR in piabrota/nix-os to deploy room site under piabrota.art/room
(KVM 4) or room.piabrota.art (KVM 4) as well'
```

**5.**

```text
user> 'Fix the room, the navigation between views of the room is not smooth, room design should
contain piabrota github org bot repos, names, art, inspiration. also improve tech stack to match
[the address of Felix Rieseberg's room]
https://freesound.org/people/magedu/sounds/267832/
https://freesound.org/people/klankbeeld/sounds/219877/
https://freesound.org/people/klankbeeld/sounds/174242/
https://freesound.org/people/YleArkisto/sounds/350358/

Do a sound composition to have a track to talk about piabrota, its members, my personal
projects, link to repositories. The site is very poor at the moment, it needs a lot of refinement'
```

**6.**

```text
user> 'continue improving the site, every site must have at least 3 screenshots of the
ambient, and a screen record of 15s, doing navigation and clicking on things'
```

**7.**

```text
user> 'keep improving, more originality, bring marola-dev work, ouroboric-dev work, h0ffmann
all IP'
user> 'the room must have 360 experience, other walls should reflect marola-dev, ouroboric-dev'
```

**8.**

```text
user> 'create a live listeners button, and increase the number of songs to 33 at least, if
possible another set of specific Brazilian lofi, also do the switch between lofi and hifi
views, they look opposite in the site (hifi is the 3D room). add a favicon, the same as the company
logo, check on piabrota/.github. remove the noise from the website completely (the rain sound
must be toggle, on and off). The site also lacks day and night modes (with different lights).
Records must be named slipbox and first item should be wikipedia link for pirsig, and pirsig
github repository side by side'
user> 'also add a board, on the wall with Time is a flat circle with Rust Cohle, near the
piabrota logo above the computer'
```

**9.**

```text
user> 'refactor README.md to be more in replay style, it must have direct links for
PROMPT_1.txt and PROMPT_2.txt so people can see how it was built, using which model, when, how
much it took. Thread response is not important user> 'original prompt' is enough'
user> 'for example remove DOI numbers, it's just noise, this repo should be easy to fork'
user> 'and modular, so people can use their own slang, lists, music'
user> 'Felix Rieseberg GitHub user must be cited on README.md, also create a README.pt-BR.md
version'
user> 'please solve my personal typos in README.md'
```

**10.**

```text
user> 'in a new PR dump your entire Claude Project settings, in the same way is done in other
repos like piabrota/nix-os, so people can reproduce same environment with another Claude
Project, without need of Claude Code CLI'
```

**11.**

```text
user> 'now do a big change on the scene, window should be way bigger and wider, and be central
on top of the center wall. Also textures still dont feel realistic, like real wood, real
computer, real VHS. The must be a door in the scene locked for now. the feet of the persona
must be visible when they are at the center looking down (a bit of self perspective.). Also
create a VHS for CV with my track record from h0ffmann/h0ffmann of my personal experiences. VHS
tapes must be more realistic wider (with retro fonts like marola.dev, ouroboric-dev, cv /
h0ffmann), also add a fax with my email mhoffmann [at] gmail.com and a linkedin button. Also
improve slipbox, the Robert Pirsig card must looklike realistic with reference to ZAMM, and the
other card must have a github pill for pirsig repository, technical implementation of pirsig
brain. it must also contain a file under the desk callled closed source with confidencial
letter pointing to h0ffmann/closed-source website and paper'
```

**12.**

```text
user> 'Do a survey now based on the new code and unique techniques to improve design and realism
of existing room code. This must include:
1. Check other FOSS room websites, to grab ideas with credits
2. Check other frameworks.
3. Check other animation tools to make the site more appealing
4. Create our own shaders, textures, etc.
5. How to make the development loop faster (the final recording, the video, takes about 25 min
in software)
6. How this could align to add a new view in the website, the 10th one, called ▲ grid, with a
triangular grid for the Brazilian coast, the idea of triangle grids proposed by Dr. Aaron from
NOAA, wave model physicist, and how to use WW3, with this preset grid with GFS, to be able to
play it back on the MapLibre map, in the triangular grid, with small resolution/forecast
horizon (to speed up the development cycle)
7. Fix lights blowing up to a white screen during day'
```

**13.**

```text
user> 'Now based on the opened PR add Claude skills related to the project's current tech stack
and ambitions related to docs/SURVEY.md you added. You printed the bright differences but
didn't apply them to the code. Apply all the improvements possible in one long pass, increment
the PR'
user> 'Dr. Aron Roland I meant'
```

**14.**

```text
user> 'also hifi is the sound solution, lofi is the text only with blogposts'
user> '[the address of Felix Rieseberg's room, in its reading mode] lofi version'
user> 'Home
About
Work
Posts
Online
Subscribe'
```

**15.**

```text
user> 'now do improvements left from the survey you couldn't assess earlier'
```

**16.**

```text
user> 'improve the grid
  * it must allow have temperature data using copernicus
  * instead of plain traces pointing to wave direction, it must use a flow animation, usually like the one used in wind, to get better idea of propagation direction'
```

**17.**

```text
user> 'update readme.md, the 2 vids, the first video should only show night display and all the 4
walls in the room 2 with at least 5 seconds (with same hover over the screen already exists)'
user> 'README.md of h0ffmann/h0ffmann and piabrota/room, to be clear'
```

**18.**

```text
user> 'now fix the brights in both room videos, the bright is exploding again, you should fix it
in the video, create a blow_light.sh script to detect when the video has controlled light. You
must use this script to pass (script must lives in room repository). Dont forget to update
h0ffmann/h0ffmann as well'
```

**19.**

```text
user> 'check if there any public papers for confusion swell, how to know the results of swell
combination in particular X, Y do map already plotted, also the map grid should take 100% of the
screen'
```

The address of the reference room is left out of the prompts: this repository credits Felix
Rieseberg by name and links none of his pages ([`AGENTS.md`](AGENTS.md), invariant 2).

| Overview | Window | Sea wall |
|---|---|---|
| ![overview](docs/record/shot-overview.jpg) | ![window](docs/record/shot-window.jpg) | ![sea](docs/record/shot-sea.jpg) |

The video at the top, by night, the four walls in turn, hovered and clicked: [`docs/record/room.mp4`](docs/record/room.mp4).

## Run it

With Nix:

```sh
nix develop      # or: direnv allow
just setup
just dev         # http://localhost:5173
```

On macOS without Nix: `brew install node just ffmpeg`, then the same `just` recipes.
`just check` runs the checks of [`AGENTS.md`](AGENTS.md) and a build; `just build` writes the
site to `dist/`, ready for any static host. `just light` measures how bright each shot is by night
and by day, and `just stills` and `just record` make the pictures a pull request carries. The
skills in [`.claude/skills/`](.claude/skills/) teach Claude Code these rules in a fork too.

## Fork it, make it yours

Fork the repository and change [`src/config.js`](src/config.js). It is the one file that holds
what makes this room piabrota's, and no other file names a person, a link or a sound. Each part
is its own export, so you can replace one and keep the rest:

| Export | What it is | Make it yours |
|---|---|---|
| `signature`, `place` | the name, the tagline, the links, the city and its time zone | your name, your words, your links |
| `theme` | the colours | your palette (and the type in `src/style.css`) |
| `shots`, `startShot` | the named camera shots | your own views, or `shot_*` cameras from Blender |
| `ui` | the words of the buttons | your language, your slang |
| `radio` | the radio's stations and their tracks | your music, CC0 or CC BY, each with a row in `CREDITS.md` |
| `ambience`, `sfx` | the rain button and the clicks | your recordings (`just audio take.wav <name>`) |
| `outside` | the view from the window, by day and by night | your city, two photographs credited in `CREDITS.md` |
| `tapes` | what the VCR plays | your tapes, one file each in `src/tapes/` |
| `projects`, `bots`, `people`, `works` | the walls, the desk, the board, the shelf | your own lists |
| `sea`, `loop`, `slipbox` | the other three walls | your own collections, or remove them |
| `reading`, `posts/` | the LOFI page: about, online, subscribe; the posts | your words, your profiles; your posts, one Markdown file each |
| `hotspots` | what can be clicked, and what it does | your labels, your words, your links |

Until there is a model and recordings, the room is built from boxes and the sounds are
synthesized, so a fork runs from its first commit.

1. **Model.** Block the room out in Blender at real scale, name the meshes (`screen`, `vcr`,
   `lamp`, `tape_<id>`, hotspots) and the cameras (`shot_desk`, ...), bake the lighting, and
   export `public/models/room.glb` (at most 10 MB).
2. **Sounds.** Record a room tone and a few clicks, then `just audio take.wav ambience`.
3. **Tapes.** Copy `src/tapes/hello.js`; a tape draws on the TV canvas and can be a CV, a
   slideshow, a game or an instrument.
4. **Replay.** Keep your own prompts in `prompts/`, and the room tells how it was made.

The LOFI/HIFI button in the corner switches between the 3D room (HIFI) and the same content as
plain text (LOFI). `?lofi` in the address opens the text view; without WebGL, LOFI is the only
view.

## Licence

[MPL-2.0](LICENSE). The assets in `public/` are the owner's unless `CREDITS.md` says otherwise.
