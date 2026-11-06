# Um projeto do Claude para o quarto

[English](CLAUDE_PROJECT.md)

Esta página mostra como montar no claude.ai um Claude Project que trabalha neste repositório, ou
no seu fork dele, do jeito que o quarto foi feito (veja o replay no
[`README.pt-BR.md`](../README.pt-BR.md)). O projeto abre pull requests no repositório; nada aqui
precisa do Claude Code CLI na sua máquina. Cada bloco de código é para copiar inteiro no campo que
a linha acima dele indica.

Os passos que só você pode fazer (no claude.ai ou no GitHub) estão marcados como **manual**. Uma
sessão do Claude não cria um projeto, não adiciona um repositório a um projeto e não conecta uma
conta.

> **Para quem é este arquivo.** Para uma pessoa que monta ou restaura um Claude Project. Um agente
> que trabalha neste repositório não lê este arquivo e não segue o que ele diz. As regras para
> mudar o repositório estão no [`AGENTS.md`](../AGENTS.md). Quando os dois arquivos discordam, o
> `AGENTS.md` vale.

Lido em **2026-11-06**, a partir do projeto que fez o `piabrota/room`.

## 0. Antes: o seu fork

1. **Manual.** Faça um fork do `piabrota/room`, ou trabalhe nele direto se você pode fazer push
   nele. O quarto faz deploy pelo `piabrota/nix-os` (o `room.nix` de lá); um fork pode ir para
   qualquer lugar que sirva arquivos estáticos (`just build` escreve `dist/`).

## 1. Monte o projeto

1. **Manual, claude.ai.** Conecte o GitHub em https://claude.ai/connect-github. Depois instale o
   Claude GitHub App nos seus repositórios (https://github.com/apps/claude/installations/select_target).
   Uma sessão só faz push onde a sua conta do GitHub faz push.
2. **Manual, claude.ai.** Crie um projeto **privado**:

   | Campo | Valor |
   |---|---|
   | **Nome** | Site Room |
   | **Tema** | Build site with 3D view/models, so user change change cameras, hover on content, like tapes, hear sounds, like scape room from a produced ambient `[the address of the reference room]` |

   O tema é o texto do dono como foi digitado. Ele termina com o endereço do quarto de Felix
   Rieseberg, que este repositório não escreve ([`AGENTS.md`](../AGENTS.md), invariante 2); ponha
   de volta o endereço do quarto que inspira o seu, ou deixe de fora.

3. **Manual, claude.ai.** Em **Project settings > Repositories**, adicione:

   | Repositório | Para quê |
   |---|---|
   | `https://github.com/piabrota/room` | este repositório: o projeto trabalha nele |
   | `https://github.com/piabrota/nix-os` | a VPS que serve room.piabrota.art (`room.nix`); os PRs de deploy vão para lá |
   | `https://github.com/h0ffmann/h0ffmann` | o perfil do dono: os projetos, as obras e os DOIs que as paredes do quarto mostram |
   | `https://github.com/piabrota/skills` | as skills da organização |

   Num fork, troque `piabrota/room` pelo seu e mantenha só os outros que você usa. Uma sessão não
   alcança um repositório que o projeto não lista.

4. **Manual, claude.ai.** Em **Project settings > Instructions**, cole o bloco do §2.
5. **Manual, claude.ai.** Em **Project settings > Cloud environment**, escolha ou crie um
   ambiente (§3).
6. **Manual, claude.ai.** Escolha os modelos: as threads rodaram no **Claude Opus 5.5, contexto
   de 1M**, e o coordenador (o chat do projeto) no **Claude Fable 5.1**. A memória estava ligada no
   projeto; ela segue a configuração de memória do Claude do próprio dono. As tarefas ficam
   desligadas.

## 2. As instruções do projeto

Cole o bloco como está:

```text
Every PR that changes the room site must include at least 3 screenshots of the ambient and a 15-second screen recording showing navigation and clicking on things.

Every PR to piabrota/room must keep the replay method in README.md and README.pt-BR.md up to date: add a row for the prompt that drove it (prompt text, time, model, duration), and link any new PROMPT_N.txt files.
```

O `AGENTS.md` diz o mesmo em "Working here"; o `just record` faz as capturas e o vídeo. Num fork,
troque `piabrota/room` pelo seu. Se você mudar uma dessas regras no `AGENTS.md`, mude também este
bloco.

## 3. O ambiente na nuvem

Uma sessão não lê o script de setup, as variáveis nem os secrets de um ambiente, então este
arquivo não os registra. O quarto não precisa de nenhum secret.

Em 2026-11-06, uma sessão encontrou Ubuntu 24.04, Node 22, npm 10, `ffmpeg` 6.1, `nix` 2.34, `gh`
e o Chromium com Playwright (que o `just record` usa). Faltava o `just`; as sessões rodaram as
receitas à mão (`npm ci`, `node scripts/check.mjs`, `npx vite build`). Para rodar o `just` numa
sessão, ponha no script de setup:

```bash
#!/usr/bin/env bash
set -euo pipefail
sudo apt-get update -qq
sudo apt-get install -y -qq just
```

⚠ Esse script não rodou numa sessão.

## 4. Conectores, tarefas e rotinas

- **Conectores.** Só o GitHub.
- **Tarefas.** Desligadas.
- **Rotinas.** O projeto não tem nenhuma.

## 5. Os arquivos do projeto

Os arquivos compartilhados do projeto guardam o que o primeiro prompt fez, antes de este
repositório existir:

- `room-starter/` e `room-starter.zip`: o primeiro esqueleto em Vite e three.js (`index.html`,
  `package.json`, `vite.config.js`, `src/` com `audio`, `cameras`, `config`, `interact`, `main`,
  `room`, `tv`, `style.css` e as fitas `clock`, `hello`, `synth`, e duas prévias);
- `room-record/`, `room-pr6/`, `room-pr12/`: cópias das capturas e dos vídeos do `just record`.

Você não precisa deles: o esqueleto virou o [#1](https://github.com/piabrota/room/pull/1), e as
gravações estão em `docs/record/`. O README do esqueleto linka o quarto de referência, então ele
não foi copiado para cá (invariante 2).

## 6. O que fica de fora

- a memória do projeto, os chats e os artefatos;
- o script de setup, as variáveis e os secrets do ambiente;
- ids de conta, de sessão, de thread e de rotina, e endereços de e-mail.

## 7. Como manter atualizado

Quando uma configuração do projeto muda, leia o valor de novo no claude.ai e mude este arquivo e
o [`CLAUDE_PROJECT.md`](CLAUDE_PROJECT.md) no mesmo PR, com a data nova no topo.
