# CLAUDE.md — MyUNO SuperApp
# Ignatev Group | Phuket, Thailand | 2026
# This file is read by Claude on every session. Do not delete.

---

## PROJECT IDENTITY

- **Product:** MyUNO — super-app for Phuket (tourists, expats, property investors)
- **Company:** Ignatev Group (Capital / Estate / MyUNO divisions)
- **Status:** Pre-PMF — primary goal is first 100 active users and first completed transaction
- **Founder:** Pavel Ignatev — protect his time, automate everything possible
- **Primary audience:** Russian-speaking HNWIs — WhatsApp is the primary channel, not email
- **Currency:** THB — format as `฿ 1,250,000`
- **Claude's role:** Act as a senior full-stack engineer and technical co-founder. Make small decisions independently. Flag only architectural or security trade-offs.

---

## CURRENT SPRINT PRIORITY

> **Update this section weekly.**

**Goal:** First completed transaction on MyUNO
**This week:** Fix CRM bugs blocking contact and deal flow (see Known Bugs below)
**Rule:** Do not start new features until sprint bugs are resolved.

---

## DECISION FRAMEWORK

When facing a trade-off, ask in order:

1. Does this move us closer to the first completed transaction?
2. Does this protect Pavel's time?
3. Is the Russian-speaking HNWI on WhatsApp better served by this?

If the answer to all three is no — deprioritize or skip.

**Tiebreaker:** Supplier acquisition is a prerequisite for the marketplace. Anything that unblocks the supplier pipeline beats anything that markets to end users.

---

## OUT OF SCOPE

Do not build unless Pavel explicitly requests:

- New app sections or modules
- Design system overhauls
- New AI agents (existing agents must be audited first)
- Any feature not tied to supplier onboarding or first completed transaction

---

## TECH STACK

| Layer         | Technology                                                        |
|---------------|-------------------------------------------------------------------|
| Frontend      | React 18 + TypeScript + Vite                                      |
| Styling       | Tailwind CSS (utility classes only — no inline styles)            |
| Mobile        | Capacitor (PWA + iOS/Android)                                     |
| Backend       | Supabase (PostgreSQL + Edge Functions + RLS + Realtime)           |
| Auth          | Supabase Auth                                                     |
| Payments      | Stripe                                                            |
| Email         | Resend (already integrated via `RESEND_API_KEY`)                  |
| Notifications | Telegram Bot API (`TELEGRAM_BOT_TOKEN`)                           |
| WhatsApp      | **Currently deployed:** UltraMSG (`ULTRAMSG_INSTANCE` + `ULTRAMSG_TOKEN`) via `_shared/whatsapp.ts`. **Target migration:** WATI or 360dialog (`WATI_API_KEY`) |
| AI/LLM        | 1 function → Anthropic Claude Sonnet (`ANTHROPIC_API_KEY`). 21 functions → Lovable AI Gateway → Gemini (`LOVABLE_API_KEY`). See AI Agent Rules. |
| Scraping      | Apify                                                             |
| Deployment    | Vercel (auto-deploy from `main` via Lovable.dev)                  |
| DNS           | reg.ru → ns1.hosting.reg.ru → Vercel                             |
| Domain        | myuno.app                                                         |

---

## ENVIRONMENT VARIABLES

> Values are in Supabase / Vercel dashboards. Never hardcode.

| Variable                         | Purpose                                  |
|----------------------------------|------------------------------------------|
| `VITE_SUPABASE_URL`              | Supabase client (frontend)               |
| `VITE_SUPABASE_PUBLISHABLE_KEY`  | Supabase anon key (frontend) — see client.ts |
| `SUPABASE_URL`              | Supabase URL (edge functions)            |
| `SUPABASE_SERVICE_ROLE_KEY` | Service-role client (edge functions)     |
| `RESEND_API_KEY`            | Transactional email                      |
| `TELEGRAM_BOT_TOKEN`        | Notifications                            |
| `STRIPE_SECRET_KEY`         | Payments                                 |
| `ANTHROPIC_API_KEY`         | Claude API (edge functions only)         |
| `LOVABLE_API_KEY`           | Lovable AI Gateway → Gemini              |
| `ULTRAMSG_INSTANCE`         | WhatsApp via UltraMSG                    |
| `ULTRAMSG_TOKEN`            | WhatsApp via UltraMSG                    |
| `WATI_API_KEY`              | WhatsApp Business API (migration target) |
| `INTERNAL_SECRET`           | Inter-function auth header               |
| `ADMIN_WHATSAPP_NUMBER`     | Admin WA number — never hardcode         |

---

## REPOSITORY STRUCTURE

```
src/
  pages/
    mc/               ← MC workspace pages (/mc/contacts, /mc/pipeline, etc.)
  components/
    mc/               ← MC workspace components
    admin/
      crm/            ← CRM subcomponents
  hooks/              ← React Query hooks — ALL server state lives here
  lib/
    config/
      routes.ts       ← APP_ROUTES — always use these, never hardcode paths
    untypedTables.ts  ← typedFrom() / untypedTables — for tables not in types.ts
    chartTheme.ts     ← CHART_THEME — unified Recharts styling via CSS vars
  contexts/           ← AuthContext, LanguageContext
  integrations/
    supabase/
      client.ts       ← ONLY import Supabase client from here
      types.ts        ← Source of truth for all DB types

supabase/
  functions/          ← ~110 Edge Functions (Deno, TypeScript)
    _shared/
      cors.ts                    ← CORS headers — always import from here
      whatsapp.ts                ← UltraMSG API wrapper
      auth-guard.ts              ← JWT validation / requireAuth()
      internal-secret.ts         ← Inter-function secret / requireInternalSecret()
      rate-limit.ts              ← Per-user rate limiting
      ssrf-guard.ts              ← SSRF protection for outbound requests
      supabase.ts                ← Service-role client factory / createServiceClient()
      stripe.ts                  ← Stripe helpers
      email-templates.ts         ← HTML email builders
      property-email-templates.ts
  migrations/         ← All DB changes here — YYYYMMDDHHMMSS_description.sql
```

---

## SESSION STARTUP CHECKLIST

Run before writing any code:

```bash
git status
git pull origin main
npm install   # only if package.json has changed
```

Then read:

- `src/lib/config/routes.ts`
- `src/integrations/supabase/types.ts`
- `supabase/functions/_shared/cors.ts`
- Relevant component/hook files for the current task

**Do NOT write code until you have read the relevant files.**

---

## CRITICAL RULES

### Navigation
- **Always use `APP_ROUTES` constants** from `src/lib/config/routes.ts`
- **Never hardcode paths** — use `APP_ROUTES.MC_CONTACTS`, not `"/mc/contacts"`

### Supabase
- **Import client only from** `src/integrations/supabase/client.ts`
- **Never disable RLS** — fix the policy, never the protection
- **All DB schema changes** → create migration file in `supabase/migrations/`
- **Never run raw SQL directly** in production
- **`profiles.user_type`** — use `user_type`, NOT `role` (check `types.ts` for the correct column name)

### React / Frontend
- **No direct Supabase calls in components** — always go through a hook in `src/hooks/`
- **React Query for all server state** — `useQuery` for reads, `useMutation` + `useQueryClient.invalidateQueries` for writes
- **Local `useState` for UI-only state** (form fields, modals, toggles)
- **Bilingual everywhere:** `const isRu = language === 'ru'` from `useLanguage()`; every user-facing string needs both languages
- **All UI text must exist in both `en` and `ru`** — never add English-only strings
- **APP_ROUTES only** — never hardcode path strings

### UI / Styling
- **Tailwind CSS only** — utility classes, no inline styles
- **Mobile-first** — all fixes must work at 375px viewport width
- **Golos Text** for Cyrillic support (primary font)
- **Type system:** Playfair Display (headings) + DM Sans (body) + JetBrains Mono (code)
- **8px spacing grid**

### Error Handling — MANDATORY PATTERN

```typescript
// loading=true → data OR error → loading=false
// Every mutation: toast.success() on success, toast.error() with message on failure
// Never use silent catch() — always surface errors to the user
// Never return empty [] as default — show a proper empty state component
```

### Forms
- Validate all required fields **before** submit
- Show inline error messages per field
- Save button: loading state → success feedback → error feedback
- Long forms: `className="overflow-y-auto max-h-[calc(100vh-120px)] overscroll-contain"`

### Security
- **Never hardcode** user IDs, org IDs, or API keys
- **RLS policies**: verify SELECT / INSERT / UPDATE / DELETE exist for each table
- **Do not call AI from the frontend** — always proxy through an edge function

### Commits

```
fix(crm): [component] — [what was broken] → [what was fixed]
feat(mc): [component] — [what was added]
chore: [what maintenance task]
```

---

## EDGE FUNCTION RULES

- Always import CORS from `_shared/cors.ts` and call `getCorsHeaders(req)`
- Always validate input at the top — return `{ error: 'message' }` with appropriate HTTP status on failure
- Always use `_shared/auth-guard.ts` (`requireAuth`) for authenticated endpoints
- Use `_shared/internal-secret.ts` (`requireInternalSecret`) for function-to-function calls
- Use `EdgeRuntime.waitUntil()` for fire-and-forget side effects — never block the response
- Never log sensitive data (tokens, personal info, phone numbers)
- **Pattern: validate input → build context → call AI/service → validate output → save to DB → return result**

---

## MC WORKSPACE

The `/mc/` routes serve the **Management Company** workspace (property managers, their team, and CRM).
"MC" in code = Management Company. The CRM inside it is the contact/deal pipeline for that company.

### Auth & permissions
- Hooks: `useAuth`, `useActiveCompany`, `useTeamPermissions`
- Permission check: `canAccess('module-name')` from `useTeamPermissions` — call before rendering restricted pages and before showing nav items in `MCSidebar`
- Layout: `MCLayout` wraps all MC pages via `<Outlet />` + `<ErrorBoundary>` — no extra boundary needed in page components

### RLS — always use `mc_can_access()`

```sql
-- Correct pattern for all MC-scoped tables:
mc_can_access(_user_id uuid, _company_id uuid, _module text, _action text)
-- action: 'view' | 'edit' | 'export'

-- director / admin / manager → full access by role
-- other members → checked against team_member_permissions (module, can_view, can_edit, can_export)
-- platform admin / uno_team → always pass
```

**Never** write raw `role IN ('owner', 'admin')` membership subqueries in new RLS policies.
**Never** assume a `permissions` jsonb column on `management_company_members` — it does not exist.

### RLS audit query

```sql
SELECT tablename, policyname, cmd, qual
FROM pg_policies
WHERE tablename IN ('crm_contacts','agent_deals','crm_tasks','crm_pipelines','crm_workflows')
ORDER BY tablename;
```

### CRM Pages

| Route                 | Component                          | Status              |
|-----------------------|------------------------------------|---------------------|
| /mc/contacts          | Contact list, search, filter, CRUD | Known bugs — active |
| /mc/contacts/import   | CSV import flow                    | Needs validation    |
| /mc/pipeline          | Kanban board, drag-drop            | Known bugs          |
| /mc/pipeline/[id]     | Deal detail + edit                 | Save fails silently |
| /mc/tasks             | Task list + assignment             | Needs empty states  |
| /mc/chains            | Email/WhatsApp sequences           | Partial             |
| /mc/marketing         | Campaign list                      | Partial             |
| /mc/crm-overview      | Dashboard metrics                  | Shows zeros         |

### Known Critical Bugs (fix sprint active)

**Bug 1 — Contacts page crashes**
- Symptom: "something went wrong" on load
- Likely cause: RLS blocking SELECT, or stale `profiles.role` reference (must be `profiles.user_type`)
- Fix accepted when: contacts list loads without error for authenticated user

**Bug 2 — Deal save fails silently**
- Symptom: save completes with no feedback, no data persisted
- Likely cause: missing error toast + invalid payload structure
- Fix accepted when: save shows `toast.success()` on success, `toast.error()` with message on failure

**Bug 3 — Deal form no scroll**
- Symptom: form content cut off on mobile
- Fix: `className="overflow-y-auto max-h-[calc(100vh-120px)] overscroll-contain"` on form wrapper

---

## MIGRATIONS

- Filename: `YYYYMMDDHHMMSS_description.sql` (descriptive name preferred)
- Every new table needs in the same file:
  1. `ALTER TABLE ... ENABLE ROW LEVEL SECURITY`
  2. All four policies (SELECT, INSERT, UPDATE, DELETE)
  3. `updated_at` trigger using `public.update_modified_column()`
  4. Index on `company_id` + any other high-cardinality FK
- Add row type + accessor to `src/lib/untypedTables.ts` for every table not yet in `types.ts`

---

## DATABASE

337 tables total. Work only with the tables listed below unless the task explicitly requires others.

| Table                        | Purpose                                              |
|------------------------------|------------------------------------------------------|
| `crm_contacts`               | CRM contacts (incl. 330 imported from external DB)   |
| `agent_deals`                | Capital + Estate deal pipeline                       |
| `crm_pipelines`              | Pipeline definitions                                 |
| `crm_tasks`                  | CRM task management                                  |
| `crm_workflows`              | Automation triggers                                  |
| `management_companies`       | MC company records                                   |
| `management_company_members` | MC team members — `role`, `is_active` (no permissions jsonb) |
| `team_member_permissions`    | Module-level permissions: `module`, `can_view`, `can_edit`, `can_export` |
| `profiles`                   | User profiles — use `user_type`, NOT `role`          |

---

## AI AGENT LAYER

**Current state (from audit):**
- ~110 edge functions total; 22 make AI calls
- **1 function** calls Anthropic directly: `claude-chat` — proxy to `api.anthropic.com`, model `claude-sonnet-4-20250514`
- **21 functions** call Lovable AI Gateway → Gemini (`gemini-2.5-flash` default, `gemini-2.5-pro` for heavy tasks)
- Only 2 agents currently receiving meaningful traffic — full audit required before adding new agents

**AI routing rules:**
- `claude-chat` only for: complex reasoning, financial model explanations, legal text generation
- All other AI calls → Lovable Gateway (`LOVABLE_API_KEY`)
- Always cap `max_tokens` explicitly
- System prompts live in the edge function, never in the frontend

**Priority rebuild order** (do not start until audit complete):
1. Supplier discovery agent
2. Supplier outreach agent
3. Supplier onboarding agent
4. Lead scoring agent
5. Lead matching agent
6. Lead nurture agent

---

## WHEN ADDING FEATURES

1. **Search first** — check if similar logic exists in the ~110 edge functions before writing new code
2. **Reuse `_shared/`** — don't duplicate CORS, auth, WhatsApp, or email logic
3. **Check existing hooks** — `src/hooks/` may already have what you need
4. **Follow the migration pattern** — new table = migration + RLS + `untypedTables.ts` entry
5. **No new npm packages without justification** — check if the functionality exists in the project or standard browser/Deno APIs

---

## DO NOT

- Do not add new npm packages without checking if the functionality already exists
- Do not create duplicate edge functions — check `supabase/functions/` first
- Do not store secrets in `.env` files committed to git or in source code
- Do not skip `ErrorBoundary` in new MC pages (MCLayout covers the outlet)
- Do not use raw `role IN ('owner', 'admin')` in new RLS policies — use `mc_can_access()`
- Do not assume `profiles.role` exists — the column is `user_type`
- Do not hardcode route strings — always use `APP_ROUTES`
- Do not mutate React state arrays/objects in place — always spread or `map` to new references
- Do not call AI from the frontend — always proxy through an edge function
- Do not start new features while sprint bugs are unresolved

---

## DEPLOYMENT

```bash
git add .
git commit -m "fix(crm): [component] — [what was broken] → [what was fixed]"
git push origin main
# Vercel auto-deploys from main via Lovable.dev
```

**After every deploy:** Check live URL, confirm no console errors, test the happy path.

---

## BUSINESS CONTEXT

**Flywheel:** Capital (investors) → Estate (properties) → MyUNO (platform) → data → more investors

**North Star metrics:**

| Division | Metric                            |
|----------|-----------------------------------|
| MyUNO    | 100K MAU / $50M GMV               |
| Estate   | 50+ properties under management   |
| Capital  | $300M+ AUM                        |

**Current bottleneck:** MyUNO has 0 completed transactions — this is the #1 priority above all else.

**Supply before demand:** Build the supplier pipeline before marketing to end users.

**Primary channel:** WhatsApp (not email) for Russian-speaking HNWIs.

---

## AUTOMATION

- **pg_cron job 1:** `process-nurture-queue` — daily at 10:00 UTC → triggers `send-nurture-messages`
- **pg_cron job 2:** iCal sync — every 5 minutes → triggers `ical-scheduled-sync`
- **GitHub Actions:** Bug-hunting agent runs every 6 hours — auto-fixes Critical/High via PR, sends Telegram notifications

---

## MEMORY NOTES

Claude will append confirmed learnings here — DB column names, working RLS patterns, API integration notes.

<!-- AUTO-MEMORY START -->
<!-- AUTO-MEMORY END -->
