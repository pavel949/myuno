# Wave 5 — Dead Code Audit (2026-04-26)

## Methodology
- **Edge functions**: ripgrep across `src/`, `supabase/functions/`, `scripts/`, `index.html` for the function name; cross-ref with `cron.job.command` (`pg_cron` schedules).
- **Tables**: ripgrep for `'table_name'`, `"table_name"`, `` `table_name` `` across `src/`, `supabase/functions/`, `scripts/`.
- **Caveat**: Static cross-ref cannot detect dynamic table names, RPC-internal usage, external (non-cron) webhook callers, or admin-tool-only references.

## Edge Functions — 169 total

### Category A: Truly orphan (no codebase ref, no cron) — 30 candidates

**🟥 Recommend DELETE (legacy/superseded — explicit signals)**
| Function | Lines | Last edit | Reason |
|---|---|---|---|
| `claude-chat` | 133 | 2026-04-07 | Old Claude integration; replaced by `ai-*` agents using Lovable AI Gateway. |
| `auto-social-publish` | 75 | 2026-04-07 | Social-publish flow not active in code. |
| `firecrawl-map` | 73 | 2026-04-07 | Replaced by Firecrawl connector + `external-data-api`. |
| `firecrawl-search` | 70 | 2026-04-07 | Same as above. |
| `etagi-scrape-projects` | 350 | 2026-04-14 | Real-estate scraper — superseded by `scrape-phuket-insider` flow. |
| `process-guest-messages` | 81 | 2026-04-07 | Older guest-messaging path; lifecycle-processor is the canonical one. |
| `document-reminder-check` | 84 | 2026-04-07 | No callers; reminders go through `task-reminders` (cron). |

**🟨 INVESTIGATE before delete (likely external trigger / webhook / Stripe / Supabase auth-hook)**
| Function | Lines | Note |
|---|---|---|
| `auth-email-hook` | 304 | Supabase **Auth Hook** — configured in Supabase dashboard, not in code. **Likely active**. |
| `whatsapp-incoming-webhook` | 186 | Meta WhatsApp Cloud API webhook — configured in Meta Business Suite. **Likely active**. |
| `devmod-stripe-webhook` | 232 | Stripe webhook (test/devmod). Check Stripe dashboard webhook config. |
| `concierge-intent` | 301 | Has `verify_jwt` — possibly invoked by AI agent factory at runtime. |
| `nb-lead-notify` | 201 | Possibly invoked by DB trigger on `nb_leads` insert. Check triggers. |
| `peylaa-nurture` | 332 | Recently edited (2026-04-25). Possibly invoked by Peylaa external integration. |
| `scrape-phuket-insider` | 290 | Edited 2026-04-25. Manual admin tool? |
| `external-data-api` | 135 | Public API endpoint? |

**🟧 LIKELY INACTIVE but verify**
| Function | Lines | Reason |
|---|---|---|
| `ai-concierge` | 284 | Replaced by chat surface — but check `useConcierge` hook. |
| `create-order` | 230 | Order creation may have moved to `useCart`+`stripe-checkout`. |
| `create-refund` | 191 | Admin-only? Check admin UI. |
| `create-service-checkout` | 108 | Service checkout — likely superseded by unified `stripe-checkout`. |
| `devmod-release-holds` | 65 | DevMod tool — keep if dev-mode active. |
| `expire-manual-payments` | 70 | Manual-payment expiry — possibly cron-triggered (not in current cron list). |
| `generate-report-pdf` | 443 | PDF reports — may be admin-only. |
| `generate-sitemap` | 218 | Build-time tool? Check vercel.json. |
| `owner-monthly-digest` | 172 | Monthly digest — possibly cron candidate not yet scheduled. |
| `property-moderation-email` | 365 | DB trigger candidate. |
| `rentals-united-sync` | 332 | Channel-manager sync — not active per memory note. |
| `restaurant-order-notifications` | 158 | DB trigger candidate. |
| `remove-bouquet-backgrounds` | 177 | Admin/manual tool. |
| `utility-payment-reminders` | 97 | Cron candidate (not scheduled). |
| `visa-expiry-reminders` | 105 | Cron candidate (not scheduled). |

### Category B: Active (139 functions)
Either referenced in code (`supabase.functions.invoke`) or scheduled via `pg_cron` (19 cron jobs). Keep.

---

## Tables — 17 candidates

| Table | Notes |
|---|---|
| `booking_participants` | Bookings adjunct — verify with multi-guest flow. |
| `cancellation_policy_rules` | Rules table — may be referenced via FK only. |
| `clearview_bundle_slots` | Pre-launch ClearView feature. |
| `clearview_scores` | Used in mem; maybe accessed via view. |
| `data_provenance` | Audit trail — may have only DB triggers writing to it. |
| `deal_parties` | Investment deals adjunct. |
| `lead_score_events_log` | Audit log — DB-only writes likely. |
| `owner_commission_tiers` | Commission config — may be admin-only. |
| `platform_fees` | Possibly read via RPC. |
| `rate_limit_log` | Edge-function-internal. |
| `simulation_entity_links` | QA/simulation. |
| `simulation_events` | QA/simulation. |
| `store_products` | Marketplace — check storefronts. |
| `task_entity_map` | Task<->entity link. |
| `user_loyalty_status` | Loyalty system not active. |
| `user_tax_profile` | Tax module candidate. |
| `vertical_life_tasks` | LifeOS taxonomy. |

**🟧 Recommendation**: For each table, run `SELECT count(*), max(updated_at) FROM <t>` to assess actual data presence. Empty + no recent writes = strong delete candidate.

---

## Recommended Action Plan

### Phase 1 (low risk, high cleanup) — **READY TO EXECUTE**
Delete 7 explicitly-superseded edge functions:
`claude-chat`, `auto-social-publish`, `firecrawl-map`, `firecrawl-search`, `etagi-scrape-projects`, `process-guest-messages`, `document-reminder-check`.
Saves ~870 lines of edge function code; reduces deploy surface.

### Phase 2 (verify with user) — **NEEDS DECISION**
- 8 webhooks/auth-hooks: confirm with user whether external systems (Stripe/Meta WhatsApp/Supabase Auth/Drive) reference them.
- 15 "likely inactive" functions: ask whether the corresponding admin/owner flow is in production.

### Phase 3 (DB cleanup) — **NEEDS DATA CHECK**
- For each of 17 candidate tables: SELECT count + last write timestamp.
- Empty tables with no writes in 90+ days → drop in next migration.

---

## ✅ Phase 1 EXECUTED (2026-04-26)

### Edge Functions Deleted (7)
Removed from `supabase/functions/` and from deployed Supabase project:
- `claude-chat` (133 LOC)
- `auto-social-publish` (75 LOC)
- `firecrawl-map` (73 LOC)
- `firecrawl-search` (70 LOC)
- `etagi-scrape-projects` (350 LOC)
- `process-guest-messages` (81 LOC)
- `document-reminder-check` (84 LOC)

**Total: 866 LOC removed.** Edge function count: 169 → 162.

### Tables Dropped (5)
Migration applied — all 5 confirmed empty (0 rows) before drop:
- `clearview_bundle_slots`
- `clearview_scores`
- `deal_parties`
- `lead_score_events_log`
- `user_tax_profile`

Public schema base tables: 417 → 412.

---

## ✅ Phase 2 EXECUTED (2026-04-26)

### Edge Functions Deleted (8)
Cross-ref method: `rg -l '<name>' src/ supabase/` — 0 matches outside config.toml.
- `ai-concierge` (284 LOC) — superseded by chat surface
- `create-order` (230 LOC) — orders now via `useCart` + `stripe-checkout`
- `create-refund` (191 LOC) — admin refund flow not in code
- `create-service-checkout` (108 LOC) — replaced by unified checkout
- `generate-report-pdf` (443 LOC) — PDF gen handled client-side
- `generate-sitemap` (218 LOC) — sitemap is static `public/sitemap.xml`
- `rentals-united-sync` (332 LOC) — Channel Manager not in prod (per memory)
- `remove-bouquet-backgrounds` (177 LOC) — admin tool not wired up

**Total: 1,983 LOC removed.** Edge function count: 162 → 154. config.toml cleaned.

### Tables Dropped (10)
Verification: 0 code refs, 0 incoming FKs, 0 triggers, RPC callers only in autogenerated `types.ts`.
- `task_entity_map` (662 rows, last write 2026-02-09)
- `vertical_life_tasks` (65 rows seed)
- `data_provenance` (21 rows, no writers)
- `simulation_events` (20 rows, QA)
- `simulation_entity_links` (1 row, QA)
- `cancellation_policy_rules` (5 rows)
- `owner_commission_tiers` (4 rows, replaced by ledger)
- `platform_fees` (3 rows, replaced by per-order fee logic)
- `booking_participants` (1 row, replaced by `order_participants`)
- `store_products` (1 row, replaced by `listings`)

### Database Functions Dropped (11)
RPC functions whose only references were in autogenerated types:
- 6 simulation_* (`start_simulation_run`, `get_simulation_report`, `purge_simulation_run`, `link_simulation_entity`, `log_simulation_event`, `is_simulation_entity`)
- 5 resolve_* (`resolve_verticals_for_task`, `resolve_life_tasks`, `resolve_verticals_for_situation`, `resolve_task_entities`, `resolve_tasks_for_vertical`)

### Verification
- `bunx tsc --noEmit` → ✅ green
- Public schema base tables: 412 → 402

### Kept Despite Initial Suspicion
- `rate_limit_log` — used via `check_rate_limit` RPC in `_shared/rate-limit.ts`
- `user_loyalty_status` — used via `useLoyalty` hook in Wallet UI
- `useLoyalty`-related RPCs (`recalculate_user_tier`, `get_or_create_loyalty_status`) — kept

---

## 🟨 Remaining for Future Decision

### Edge Functions — внешние webhook'и (НЕ удалять без проверки внешней системы)

Need user confirmation before deletion:

### Edge Functions — likely-but-not-confirmed dead (8)
| Function | Question |
|---|---|
| `ai-concierge` | Используется ли где-то на фронте? Не нашёл вызовов. |
| `create-order` | Активна ли? Заказы вроде идут через `useCart` + `stripe-checkout`. |
| `create-refund` | Используется в админке? |
| `create-service-checkout` | Заменена unified `stripe-checkout`? |
| `generate-report-pdf` | Где вызывается? Возможно, из админки PDF-отчётов. |
| `generate-sitemap` | Build-time? |
| `rentals-united-sync` | По memory: Channel Manager не в проде — удаляем? |
| `remove-bouquet-backgrounds` | Активный admin-tool для bouquets? |

### Edge Functions — внешние webhook'и (НЕ удалять без проверки внешней системы)
- `auth-email-hook` — Supabase Auth Hook
- `whatsapp-incoming-webhook` — Meta WhatsApp
- `devmod-stripe-webhook` — Stripe (devmod)
- `nb-lead-notify`, `concierge-intent`, `peylaa-nurture`, `scrape-phuket-insider`, `external-data-api` — могут вызываться извне

### Tables — есть данные, нужна проверка владельца (12)
| Table | Rows | Comment |
|---|---|---|
| `task_entity_map` | 662 | Активная связь задач — НЕ удалять. |
| `vertical_life_tasks` | 65 | LifeOS taxonomy — keep. |
| `data_provenance` | 21 | Audit trail — likely DB-only writes. |
| `simulation_events` | 20 | QA. |
| `cancellation_policy_rules` | 5 | Policy rules. |
| `owner_commission_tiers` | 4 | Commission tiers. |
| `user_loyalty_status` | 4 | Loyalty (per memory: not active). |
| `platform_fees` | 3 | Fee config. |
| `rate_limit_log` | 2 | Edge-function-internal. |
| `simulation_entity_links` | 1 | QA. |
| `booking_participants` | 1 | Bookings. |
| `store_products` | 1 | Marketplace. |
