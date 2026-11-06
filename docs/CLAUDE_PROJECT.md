# A Claude project for the room

[Português (Brasil)](CLAUDE_PROJECT.pt-BR.md)

This page tells how to set up a Claude Project on claude.ai that works on this repository, or on
your fork of it, the way the room was built (see the replay in [`README.md`](../README.md)). The
project opens pull requests on the repository; nothing here needs the Claude Code CLI on your
machine. Copy each code block whole into the field that the line above it names.

The steps that only you can do (on claude.ai or GitHub) have the mark **manual**. A Claude
session cannot create a project, add a repository to a project or connect an account.

> **Who this file is for.** A person who sets up or restores a Claude Project. An agent that works
> in this repository does not read this file and does not follow it. The rules for changes to the
> repository are in [`AGENTS.md`](../AGENTS.md). Where the two files disagree, `AGENTS.md` wins.

Read on **2026-11-06**, from the project that built `piabrota/room`.

## 0. First: your fork

1. **Manual.** Fork `piabrota/room`, or work on it directly if you can push to it. The room
   deploys from `piabrota/nix-os` (`room.nix` there); a fork can deploy anywhere that serves
   static files (`just build` writes `dist/`).

## 1. Set up the project

1. **Manual, claude.ai.** Connect GitHub at https://claude.ai/connect-github. Then install the
   Claude GitHub App on your repositories (https://github.com/apps/claude/installations/select_target).
   A session can push only where your GitHub account can push.
2. **Manual, claude.ai.** Create a **private** project:

   | Field | Value |
   |---|---|
   | **Name** | Site Room |
   | **Topic** | Build site with 3D view/models, so user change change cameras, hover on content, like tapes, hear sounds, like scape room from a produced ambient `[the address of the reference room]` |

   The topic is the owner's text as typed. It ends with the address of Felix Rieseberg's room,
   which this repository does not write ([`AGENTS.md`](../AGENTS.md), invariant 2); put back the
   address of the room that inspires yours, or leave it out.

3. **Manual, claude.ai.** In **Project settings > Repositories**, add:

   | Repository | What for |
   |---|---|
   | `https://github.com/piabrota/room` | this repository: the project works on it |
   | `https://github.com/piabrota/nix-os` | the VPS that serves room.piabrota.art (`room.nix`); the deploy PRs go there |
   | `https://github.com/h0ffmann/h0ffmann` | the owner's profile: the projects, works and DOIs that the room's walls show |
   | `https://github.com/piabrota/skills` | the organisation's skills |

   On a fork, replace `piabrota/room` with yours and keep only the others you use. A session
   cannot reach a repository that the project does not list.

4. **Manual, claude.ai.** In **Project settings > Instructions**, paste the block of §2.
5. **Manual, claude.ai.** In **Project settings > Cloud environment**, select or create an
   environment (§3).
6. **Manual, claude.ai.** Select the models: the threads ran on **Claude Opus 5.5, 1M context**,
   and the coordinator (the project chat) on **Claude Fable 5.1**. Memory was on in the project;
   it follows the owner's own Claude memory setting. Tasks stay off.

## 2. The project instructions

Paste the block as it is:

```text
Every PR that changes the room site must include at least 3 screenshots of the ambient and a 15-second screen recording showing navigation and clicking on things.

Every PR to piabrota/room must keep the replay method in README.md and README.pt-BR.md up to date: add a row for the prompt that drove it (prompt text, time, model, duration), and link any new PROMPT_N.txt files.
```

`AGENTS.md` says the same in "Working here"; `just record` makes the screenshots and the video.
On a fork, replace `piabrota/room` with yours. If you change one of these rules in `AGENTS.md`,
change this block too.

## 3. The cloud environment

A session cannot read the setup script, the variables or the secrets of an environment, so this
file does not record them. The room needs no secret.

On 2026-11-06, a session found Ubuntu 24.04, Node 22, npm 10, `ffmpeg` 6.1, `nix` 2.34, `gh` and
Chromium with Playwright (which `just record` uses). `just` was missing; the sessions ran its
recipes by hand (`npm ci`, `node scripts/check.mjs`, `npx vite build`). To run `just` in a
session, put this in the setup script:

```bash
#!/usr/bin/env bash
set -euo pipefail
sudo apt-get update -qq
sudo apt-get install -y -qq just
```

⚠ This script has not run in a session.

## 4. Connectors, tasks and routines

- **Connectors.** GitHub only.
- **Tasks.** Off.
- **Routines.** The project has none.

## 5. The project files

The project's shared files hold what the first prompt made, before this repository existed:

- `room-starter/` and `room-starter.zip`: the first Vite and three.js scaffold (`index.html`,
  `package.json`, `vite.config.js`, `src/` with `audio`, `cameras`, `config`, `interact`, `main`,
  `room`, `tv`, `style.css` and the tapes `clock`, `hello`, `synth`, and two previews);
- `room-record/`, `room-pr6/`, `room-pr12/`: copies of the stills and videos of `just record`.

You do not need them: the starter became [#1](https://github.com/piabrota/room/pull/1), and the
recordings are in `docs/record/`. The starter's README links the reference room, so it is not
copied here (invariant 2).

## 6. What stays out

- the project's memory, chats and artifacts;
- the environment's setup script, variables and secrets;
- account, session, thread and routine ids, and e-mail addresses.

## 7. Keeping it current

When a project setting changes, read the value again on claude.ai and change this file and
[`CLAUDE_PROJECT.pt-BR.md`](CLAUDE_PROJECT.pt-BR.md) in the same PR, with the new date at the top.
