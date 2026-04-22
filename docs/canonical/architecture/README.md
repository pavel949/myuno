# myUNO — Handoff Package

Drop-in files for your repo. Everything in this folder is ready to be copied into `myuno/`.

## What's here

| File | Destination in your repo | Purpose |
|---|---|---|
| `ARCHITECTURE_V2.md` | `myuno/docs/ARCHITECTURE_V2.md` | Target architecture — roles, clusters, surfaces, agents |
| `FEASIBILITY.md` | `myuno/docs/FEASIBILITY.md` | Current-state assessment + migration path + Claude Code prompts |
| `CLAUDE_PATCH.md` | Merge into `myuno/CLAUDE.md` section 1.5 | Makes Claude Code load the blueprint every session |
| `README.md` | (this file — don't copy) | Instructions |

## One-time setup (5 min)

```bash
cd C:\Users\pavel\OneDrive\Apps\myUNO\myuno

# 1. Copy the architecture docs
mkdir -p docs
cp ../../handoff/ARCHITECTURE_V2.md docs/
cp ../../handoff/FEASIBILITY.md docs/

# 2. Optional: copy visual references
mkdir -p docs/visual
cp ../../home.html docs/visual/
cp ../../architecture.html docs/visual/
cp ../../feasibility.html docs/visual/

# 3. Patch CLAUDE.md
# Open handoff/CLAUDE_PATCH.md, paste the "1.5 · Architecture source of truth (v2)"
# block into CLAUDE.md after section 1.

# 4. Commit
git checkout -b docs/architecture-v2
git add docs/ CLAUDE.md
git commit -m "docs: add architecture v2 blueprint + feasibility"
git push
```

## First Claude Code session

After setup:

```bash
cd myuno
claude
```

Then paste:

```
Read docs/ARCHITECTURE_V2.md and docs/FEASIBILITY.md carefully.

Then run the "Audit" prompt from FEASIBILITY.md §07:
Audit src/pages against ARCHITECTURE_V2.md §06 Route tree.
List every route that doesn't fit /app/:cluster/:vertical or one of
the 6 surfaces. Output a redirect table as Markdown. Save as
docs/AUDIT_ROUTES.md.
```

That produces a concrete migration checklist, non-destructive. Review the output. Then run the Phase 1 prompt.

## Working rhythm

1. **Design iteration in the design environment** → produces MD artifacts
2. **You copy MD into `docs/`** → one `git commit`
3. **Claude Code reads docs + writes code** → opens PR
4. **You review + merge**
5. **Bring screenshots/questions back to design** for visual iteration

Rinse and repeat per phase.

## FAQ

**Q: Can I skip the architecture docs and just use the visual HTML?**
A: You can — Claude Code reads HTML fine. But MD is diffable in PRs, survives in git history, and is easier for Claude Code to reference by `§section`. Strongly recommend the MD versions.

**Q: Do I need to run all 6 phases?**
A: No. Phases 1–2 alone (role stack + home) deliver the visible transformation — roughly 2 sprints. Phases 3–4 (clusters + /operate) deliver the backend consolidation. Phase 5 (Investor) and Phase 6 (cleanup) are optional.

**Q: What if Claude Code pushes back on an instruction?**
A: It shouldn't if the docs are in the repo. If it does, paste the relevant section from `ARCHITECTURE_V2.md` into the prompt explicitly. The "hard rules" in §13 are non-negotiable.

**Q: Can I edit the blueprint?**
A: Yes — it's your architecture. Bring changes back to the design environment so we can update the visual docs in sync, or edit the MD directly.
