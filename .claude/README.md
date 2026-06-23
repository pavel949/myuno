# myUNO — Claude Code Agentic System

This `.claude/` directory installs the full agentic system described in
`/CLAUDE.md` (AI Team Configuration + Skill routing), tailored to the myUNO
stack. Everything here is committed so it works in every session, including
ephemeral cloud containers.

## Subagents (`.claude/agents/`)

Invoke explicitly (`@agent-name` / the Agent tool) or let Claude auto-delegate
based on the task — each `description` says when to use it.

| Agent | Use for |
|-------|---------|
| `react-component-architect` | React/TSX components, pages, hooks, contexts |
| `tailwind-frontend-expert` | Tailwind, DS 2.1 tokens, responsive layout, motion |
| `backend-developer` | Supabase Edge Functions (Deno 2.0), migrations, payments |
| `api-architect` | RPC/endpoint contracts and integration schemas |
| `code-reviewer` | Pre-merge review / security gate (run before commit) |
| `performance-optimizer` | Bundle, chunks, TanStack Query, PWA, Lighthouse |
| `documentation-specialist` | Sync CLAUDE.md / canonical docs to the code |
| `code-archaeologist` | Read-only exploration of the large codebase |
| `tech-lead-orchestrator` | Multi-vertical features; coordinates the others |

## Skills (`.claude/skills/`)

Invoke as `/<skill-name>` or let routing pick them (see `/CLAUDE.md` → "Skill
routing"). Each has a `SKILL.md` with triggers and a process.

| Skill | Trigger |
|-------|---------|
| `office-hours` | Product ideas, "is this worth building?", brainstorming |
| `investigate` | Bugs, errors, 500s, "why is this broken?" |
| `ship` | Commit, push, (only on request) open a PR |
| `qa` | Test the site / flow, find bugs end-to-end |
| `review` | Review the current working diff before merge |
| `document-release` | Update docs after shipping |
| `retro` | Weekly / sprint retrospective |
| `design-consultation` | Design system, brand, tokens guidance |
| `design-review` | Visual audit / DS 2.1 polish pass |
| `plan-eng-review` | Architecture / engineering-plan review |
| `checkpoint` | Save / resume progress (writes to `.claude/checkpoints/`) |
| `health` | Lint / types / tests / tech-debt sweep |
| `ui-ux-pro-max` | UI/UX design intelligence (pre-existing) |

## How it maps to CLAUDE.md

- The agent table mirrors `CLAUDE.md` → "AI Team Configuration".
- The skill list mirrors `CLAUDE.md` → "Skill routing".

Every agent and skill is wired to the real myUNO rules: TypeScript-strict, the
singleton Supabase client (`public` schema only), DS 2.1 semantic tokens,
bilingual RU/EN, feature-flag gating, the Stripe→webhook→orders→ledger money
flow, and the `app_role` (18-value) authorization model.

> Note: `settings.local.json` is machine-local (permission allowlist) and not
> part of the shared system.
