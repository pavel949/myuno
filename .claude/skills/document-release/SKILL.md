---
name: document-release
description: >
  Update myUNO docs after shipping a feature. Use when work has landed and the
  docs need to catch up: CLAUDE.md status, version bumps, canonical docs,
  CHANGELOG. Triggers: update docs, document the release, "docs after shipping",
  bump version, changelog.
---

# Document Release — Sync Docs to Shipped Code

Bring documentation back in line with what actually shipped. Delegate substantive
writing to the **documentation-specialist** agent; this skill is the routine.

## Verify before writing (no invented facts)
- `git log --oneline -10` for the real recent commits.
- Confirm version agreement across `src/lib/appVersion.ts`,
  `public/version.json`, and the `<meta name="version">` tag in `index.html`.

## Update targets
1. **`/CLAUDE.md`** — version, branch, "Last sync" stamp, the "last 10 commits"
   list, "Текущие работы" (current works), and any changed file counts/stack.
2. **Version bump** (if the release warrants) — update all three version
   locations together so cache-busting works.
3. **`docs/canonical/*`** — if behavior changed in a canonical area
   (segmentation, catalogue, schema, IA, design, ClearView), update the relevant
   doc, then add an entry to `docs/canonical/CHANGELOG.md`.
4. **`DESIGN.md` / `ENVIRONMENT.md`** — only if tokens or env truly changed.

## Rules
- **Code is truth.** When code and a doc disagree, fix the doc. If a change
  contradicts PROJECT.md or canon, stop and ask Pavel.
- Keep RU prose Russian; code/commits English; match existing tone.
- Conventional commit: `docs: ...`.

## Output
The docs updated, the facts each was verified against, and the doc commit.
