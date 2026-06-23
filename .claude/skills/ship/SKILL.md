---
name: ship
description: >
  Ship myUNO changes safely: commit, push to the feature branch, and (only when
  explicitly asked) open a PR. Triggers: ship, deploy, push, "create a PR",
  "open a pull request", release this, land it.
---

# Ship — Commit, Push, (optional) PR

Get verified work onto the remote feature branch cleanly.

## Pre-flight (do not skip)
1. `git status` + `git diff` — know exactly what's changing.
2. **Quality gates:** `npm run lint` and `npx tsc --noEmit`. If fonts/tokens or
   service tags changed, run the relevant `npm run validate:*`. Do not ship red
   — report failures instead.
3. Run the `review` skill (or `code-reviewer` agent) if the change is
   non-trivial.

## Branch & commit rules
- **Work on the designated feature branch** (e.g. `claude/*`). Never push to
  `main` without explicit permission. Create the branch locally if needed.
- **Conventional commits, English:** `feat:`, `fix:`, `refactor:`, `chore:`,
  `design:`, `build:`. Clear, descriptive subject; body explains the why.
- Commit only when the user asked to commit/ship.

## Push
- `git push -u origin <branch-name>`.
- On **network** failure only, retry up to 4× with exponential backoff
  (2s, 4s, 8s, 16s). Do not retry on real errors (rejected, auth) — surface
  them.

## Pull requests
- **Do NOT create a PR unless the user explicitly asks.** Use the GitHub MCP
  tools (`mcp__github__*`) for the `pavel949/myuno` repo — no `gh` CLI here.
- If asked for a PR: concise title (conventional style) + body covering what
  changed, why, test evidence, and risk. End the body with the required
  Generated-with footer.
- After creating a PR, offer to watch it (`subscribe_pr_activity`) for CI /
  review events.

## Output
The commit SHA(s), branch, push result, gate results, and the PR link if one was
requested. Be honest if any gate was skipped or failed.
