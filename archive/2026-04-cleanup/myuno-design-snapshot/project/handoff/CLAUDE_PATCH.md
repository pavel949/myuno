# CLAUDE.md — patch block

Add this block near the top of `myuno/CLAUDE.md` (after section 1, before section 2):

---

## 1.5 · Architecture source of truth (v2)

**Before any structural change, read:**
1. `docs/ARCHITECTURE_V2.md` — target architecture (roles · clusters · surfaces · agents)
2. `docs/FEASIBILITY.md` — migration path from current codebase

**Visual references** (in `docs/visual/`):
- `home.html` — Home hub mockup (blended role feed)
- `architecture.html` — blueprint in visual form
- `feasibility.html` — this assessment in visual form

### Hard rules (from ARCHITECTURE_V2.md §13)

1. **Never add a new top-level route.** Put it under `/app/:cluster/:vertical` or `/operate/*`.
2. **Never create a new shell.** Use `MiniAppLayout` or the Operate shell.
3. **Never hardcode a hex colour.** Use `tokens.css` variables.
4. **Never import across L5 cluster boundaries.** Use L4 primitives or L3 services.
5. **Never auto-execute money moves from an agent.** Always user-confirmed intent.
6. **Every money-moving screen must show audit marker** (tx id + ledger entry id + timestamp).
7. **Every new feature gated behind `feature_flag:*`** in `system_settings` until GA.

### Current migration phase

<!-- Update this line as phases progress -->
**Active phase:** P1·01 — Role stack in DB + AuthContext

### Glossary

- **Surface** — one of 6 long-lived canvases: Home · Discover · Operate · Wallet · Me · Admin
- **Cluster** — one of 6 colour-locked groups: Arrive · Live · Manage · Invest · Legal · Build
- **Role stack** — `profiles.roles_stack` jsonb + `primary_role`, weighted `primary·3 + secondary·2 + tertiary·1`
- **Company** — formal entity for Agency / Developer / Provider / MC (new)
- **Intent** — AI agent output, user-confirmed via one-tap accept/later

---
