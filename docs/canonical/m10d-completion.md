# M10d · AI Concierge Intent Routing — Completion Report

**Date:** 2026-04-24
**Scope:** IPP.md §18 (Seven Doors) + §19.3 step M10d
**Principle:** CONNECT BEFORE CREATE — reused FloatingConcierge FAB, `/discover?ai=1` link, Lovable AI Gateway.

---

## What was done

### 1. Edge function `concierge-intent` (NEW)

Free-text → single best route, with multi-turn conversation memory.

- **Input:** `{ messages: [{role,content}], language, persona? }`
- **Output:** `{ reply, route, route_label: {en,ru}, cluster, model }`
- **Model:** `google/gemini-2.5-flash` via Lovable AI Gateway (no key needed from user)
- **Tool calling:** `recommend_intent` with strict JSON schema (route enum from whitelist)
- **Whitelist:** 21 routes across 6 clusters (arrive/live/manage/invest/legal/build)
- **Validation:** drops model-invented routes; cluster always derived from whitelist
- **Graceful degradation:** 429 → friendly throttle msg, 402 → credits msg, network err → fallback to `/discover`
- **CORS + public** (no JWT) so guests can use it

### 2. `useConciergeIntent` hook (NEW)

- Maintains in-memory conversation (last 20 turns sent each call per chatbot best-practices)
- Sends `language` + `detectedPersona` (from `useCanonicalProfile`) for context
- Resets on demand; not persisted (guest-friendly)
- Pure React state, no React Query (chat is ephemeral)

### 3. `ConciergeIntentChat` component (NEW)

- Mounts on `/discover?ai=1` (existing FloatingConcierge FAB already points here)
- Markdown rendering via `react-markdown` (already installed)
- Internal route links in markdown intercepted → `navigate()` (no full reload)
- Per-turn CTA button using `route_label` from the AI
- 4 starter prompts (RU/EN) when conversation is empty
- Auto-scroll, loading indicator, "Start over" reset
- Bilingual, semantic tokens, 44px touch targets

### 4. Wiring

- `Discover.tsx` reads `?ai=1` from `useSearchParams`, mounts chat above the regular catalog
- No changes to `FloatingConcierge` (already navigates to `/discover?ai=1`) → **CONNECT achieved**
- `supabase/config.toml`: registered `concierge-intent` with `verify_jwt = false`

---

## Files changed

- ➕ `supabase/functions/concierge-intent/index.ts` — edge function (~280 LOC)
- ➕ `src/hooks/useConciergeIntent.ts` — chat state hook
- ➕ `src/components/concierge/ConciergeIntentChat.tsx` — chat UI
- ✏️ `src/pages/Discover.tsx` — `?ai=1` mode mounts chat
- ✏️ `supabase/config.toml` — register function
- ➕ `docs/canonical/m10d-completion.md` — this report

**No DB migration. No new tables. No new top-level routes. No new shells.**

---

## Architecture decisions

1. **Single route per turn**, not 3-5 — IPP §18.3 says "one door at a time, never paralysis of choice". Existing `concierge-route` function (returning 3-5) is kept for `/start` onboarding, where multiple options make sense.
2. **No persistence** — chat is ephemeral. If we add `concierge_conversations` later for analytics, it's additive (M10f).
3. **Cluster always wins from whitelist** — model can hallucinate cluster value, so we override from `KNOWN_ROUTES` table.
4. **Persona context optional** — works for guests too. When detected, AI gets it as soft signal in system prompt.

---

## Acceptance checklist

- [x] Free-text input → routed answer with markdown reply
- [x] Multi-turn conversation (history sent each turn)
- [x] Route whitelist enforced server-side
- [x] Bilingual RU/EN throughout
- [x] Graceful 429/402/error handling
- [x] FloatingConcierge → opens chat (no new FAB created)
- [x] Markdown links navigate via React Router (no reload)
- [x] `tsc --noEmit` passes
- [x] No new top-level routes (ARCHITECTURE_V2 §13.1)
- [x] Lovable AI Gateway used (no user API key required)

---

## Open items

1. **No telemetry yet** — wire `track('concierge_intent_routed', {cluster, route, persona})` in M10f.
2. **No persistence** — if Pavel wants per-user history, add `concierge_conversations` table in M10f.
3. **Whitelist is hand-curated** — when M10g lands `/property/urgent`, add to `KNOWN_ROUTES`.
4. **`ai-concierge` function** (separate, dashboard suggestions) is untouched — different feature.

---

## Next milestone: M10e

Per IPP.md §19.3: **M10e — Lead scoring + ClearView Full Report flow** (P8 conversion trigger).

---

*Owner: Pavel Ignatev. AI executor: Lovable. M10d closed.*
