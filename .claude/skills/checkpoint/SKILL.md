---
name: checkpoint
description: >
  Save or resume work progress for myUNO sessions. Use to checkpoint state
  before a context reset / end of session, or to resume from a prior checkpoint.
  Triggers: checkpoint, save progress, "where were we", resume, pick up where I
  left off, snapshot state.
---

# Checkpoint — Save & Resume Progress

Preserve enough state that work can resume cleanly after a context reset or in a
fresh ephemeral container (the repo is re-cloned each session — only committed/
pushed work survives).

## Save a checkpoint
1. **Capture git state:** `git status`, `git branch --show-current`, `git log
   --oneline -5`, and whether changes are committed/pushed. Uncommitted work
   only survives if committed — offer to commit/push (see the `ship` skill).
2. **Write a checkpoint note** to
   `.claude/checkpoints/CHECKPOINT-<YYYY-MM-DD-HHMM>.md` containing:
   - Goal / task and the branch (`claude/...`).
   - What's done, what's in progress, what's next (ordered).
   - Key files touched (`file:line`) and decisions made.
   - Open questions / blockers (esp. anything needing Pavel).
   - Exact next command to run on resume.
3. Keep it concise and factual — no invented status.

## Resume
1. Read the latest `.claude/checkpoints/CHECKPOINT-*.md`.
2. Reconcile against reality: `git log`, `git status`, current branch — the
   checkpoint may be behind the actual repo.
3. Restate the plan from the "what's next" list and continue.

## Output
On save: the checkpoint file path + a 3-line summary. On resume: the recovered
plan and the immediate next step. Note that only pushed commits are durable.
