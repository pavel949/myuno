# Lead Intelligence v1 — implement PROJECT.md §11

Scope is the single P0 item from the prior audit: deterministic event-weighted lead scoring with a `Ready` (86–100) tier and an automatic WhatsApp alert to Pavel. No bigger refactor, no new pages.

## What gets built

### 1 · Database (one migration — the user approves it via the in-app prompt)

**New tables**

- `public.lead_score_events` — config (`event_key` PK, `weight`, `label_ru`, `label_en`, `description`, `is_active`). Seeded with the six §11 events:
  - `read_3_articles_buying` +15
  - `contract_uploaded` +20
  - `duediligence_run` +30
  - `concierge_question_fet` +25
  - `property_viewed_3x` +35
  - `investment_calculator` +20
- `public.lead_score_events_log` — audit row per increment (`contact_id` FK to `crm_contacts`, `event_key`, `weight_applied`, `score_before/after`, `temperature_before/after`, `source`, `meta`, `created_by`, `created_at`).

**RLS**

- `lead_score_events`: SELECT to all authenticated; INSERT/UPDATE/DELETE only `has_role(auth.uid(), 'admin'::app_role)`.
- `lead_score_events_log`: SELECT gated by an `EXISTS` against `crm_contacts` (so the existing company-membership policies on contacts decide visibility); direct INSERT only by admins (the engine runs through the SECURITY DEFINER RPC).

**Helper + RPC**

- `lead_temperature_from_score(int) -> text` — returns `cold` (≤25), `warm` (≤60), `hot` (≤85), `ready` (≥86). `IMMUTABLE`, `SET search_path = public`.
- `apply_lead_score_event(p_contact_id uuid, p_event_key text, p_source text, p_meta jsonb)` — `SECURITY DEFINER`, `SET search_path = public`. Locks the contact row, adds the event's weight (clamped to 0–100), updates `lead_score`, `lead_temperature`, `last_activity_at`, `updated_at`, writes the audit row, and returns `(contact_id, score_before, score_after, temperature_before, temperature_after, crossed_ready)`. `crossed_ready = (temp_before <> 'ready' AND temp_after = 'ready')`. Execute granted to `authenticated, service_role`.

### 2 · Edge function `supabase/functions/score-lead/index.ts`

- Auth-guarded with the existing `requireAuth` helper.
- `GET /events` — returns the active scoring events config (for surfacing in admin UI).
- `POST /` — body `{ contact_id, event_key, source?, meta? }`. Validates inputs in-line (UUID + `^[a-z0-9_]{2,64}$`); invokes the RPC via `createServiceClient`; on `crossed_ready === true` sends a WhatsApp alert to `getAdminWhatsApp()` via the existing `sendWhatsApp` helper, with a templated message including name, score delta, trigger key, contact phone, and a deep link to the contact page. Alert failures never fail the score update.
- CORS uses the standard headers; OPTIONS handled.

### 3 · Frontend — minimal UI changes only

- `src/hooks/useLeadsFactory.ts`
  - Extend `LeadScoreResult.priority` from `'hot' | 'warm' | 'cold'` to `'ready' | 'hot' | 'warm' | 'cold'`.
  - `getPriorityColor`: add a `ready` branch → strong red on red surface using semantic tokens (e.g. `text-danger bg-danger-bg`).
  - `getScoreColor`: add `if (score >= 86) return 'text-danger';` branch above the existing 70/40 thresholds.
  - Add a small `useLeadScoreEvents()` query that fetches `GET /events` (cached) so future call sites can list available events.
  - Add a `useApplyLeadScoreEvent()` mutation that posts to `score-lead` and invalidates `crm-contacts` queries on success.
- `src/components/admin/leads/LeadAIInsights.tsx`
  - Replace the ternary picking the icon with a small `priorityMeta` map: `ready → Flame (filled, danger)`, `hot → Flame`, `warm → Thermometer`, `cold → Snowflake`.
  - Update the badge label so `ready` renders "Готов" (RU) / "Ready" (EN). Existing labels untouched.
  - Increase score visual weight when `aiScore >= 86` (uses the new `getScoreColor` branch).

No other components are touched in this pass. Existing `leads-factory` LLM scorer is left untouched — it scores `consultation_requests`; this new engine scores `crm_contacts`. They are complementary, not duplicate.

### 4 · Wiring callers (deliberately deferred to a follow-up)

The §11 events fire in six places (article reader, ContractAI, DueDiligence, concierge intent classifier, property views aggregator, ROI calculator). Wiring those call sites is mechanical but cross-cuts six features. **Out of scope for this loop** — this loop ships the engine + UI tier so call sites can be wired one-by-one without re-deploying the engine. The plan after this is to wire `property_viewed_3x` first (highest-weight event, clearest signal) in a separate small PR.

## What does NOT change

- No edits to `src/integrations/supabase/types.ts`, `client.ts`, `.env`, `supabase/config.toml`.
- No changes to `consultation_requests` or the `leads-factory` function.
- No new routes, no new pages, no new components beyond the icon-map change inside `LeadAIInsights`.
- No data backfill — existing contacts keep their current `lead_score`/`lead_temperature` until an event fires.

## Verification after build

1. Lint check — confirm RLS is on for both new tables and no new warnings appear.
2. `supabase--curl_edge_functions GET /score-lead/events` — should return the 6 seeded rows.
3. `POST /score-lead` against a real test contact with `event_key=property_viewed_3x` and assert `score_after = score_before + 35`, `crossed_ready` correctly flips when crossing 86.
4. `LeadAIInsights` renders the new "Готов"/"Ready" badge for any contact with `aiPriority='ready'`.

## Open question (for after build)

The WhatsApp alert template is in Russian by design (Pavel's primary channel). Confirm the deep-link target `https://myuno.app/owner/contacts/:id` is the canonical contact page — if Pavel uses a different inbox URL, swap the template constant.
