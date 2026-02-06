# UNO Core System Design — Implementation Spec
## Admin Marketing Center L1 + User State Machine + Events Schema + Post-Landing Flows

Version: 2.0 | Date: 2026-02-06
Status: Implementation-ready

---

## SYSTEM OVERVIEW

```
                AD / SEO / PARTNER
                       │
                       ▼
              ┌─────────────────┐
              │  LANDING LAYER  │  5 entry points, zero nav
              │  landing_id +   │  UTM → campaign_id
              │  session_id     │
              └────────┬────────┘
                       │ primary_cta_click
                       ▼
              ┌─────────────────┐
              │   UNO CORE      │  Vertical pages, booking flows
              │   Silent auth   │  Progressive feature unlock
              │   user_id born  │
              └────────┬────────┘
                       │ events stream (all events)
          ┌────────────┼────────────┐
          ▼            ▼            ▼
   ┌────────────┐ ┌──────────┐ ┌──────────────┐
   │ STATE      │ │ AUTO-    │ │ ADMIN L1     │
   │ MACHINE    │ │ MATION   │ │ CONTROL      │
   │ (derived)  │ │ ENGINE   │ │ TOWER        │
   └─────┬──────┘ └────┬─────┘ └──────────────┘
         │              │
         └──────┬───────┘
                ▼
         ┌────────────┐
         │ MESSAGING  │  push / email / in-app / whatsapp
         └────────────┘
```

Four layers. One data stream. One admin.

---

## 1️⃣ ADMIN MARKETING CENTER — LEVEL 1

### Dashboard Sections

| Section | Purpose | Data Source |
|---|---|---|
| **Pulse** | 4 headline KPIs, period selector | Aggregated events |
| **Funnel Board** | Per-landing funnel: view → click → action → revenue | Events by landing_id |
| **State Map** | User state distribution, pie + trend | Derived user_state |
| **Revenue Attribution** | Revenue by landing_id, campaign_id, service_type | Completed bookings |
| **Drop-off Radar** | Gap between intent_started and first_service_completed | Event pair analysis |
| **Controls Panel** | All operator switches | Config tables |

### KPI Definitions

| # | KPI | Formula | Granularity |
|---|---|---|---|
| 1 | **Landing Traffic** | COUNT(landing_view) | Per landing_id, daily |
| 2 | **CTA Rate** | primary_cta_click / landing_view | Per landing_id |
| 3 | **Intent Rate** | intent_started / primary_cta_click | Per landing_id |
| 4 | **Completion Rate** | first_service_completed / intent_started | Per landing_id |
| 5 | **Silent Account Rate** | accounts_created / intent_started | Per landing_id |
| 6 | **Revenue per Landing** | SUM(booking.total_amount) WHERE source_landing_id = X | Per landing_id, daily |
| 7 | **Cross-Vertical Rate** | COUNT(user WHERE verticals_used >= 2) / total_active | Weekly |
| 8 | **CAC** | campaign_spend / first_service_completed | Per campaign_id |
| 9 | **Churn Rate** | COUNT(state = dormant) / total_identified | Weekly |
| 10 | **Second Action Rate** | second_service_started / first_service_completed | Per landing_id |

### Control Switches

| Control | Type | Effect | Scope |
|---|---|---|---|
| Landing toggle | on/off | Enables/disables landing route | Per landing_id |
| Hero copy variant | A/B select | Swaps headline + subheadline | Per landing_id |
| CTA label variant | A/B select | Swaps button text | Per landing_id |
| Next Best Action config | ordered list (max 2) | Controls success screen suggestions | Per landing_id × user_state |
| Push rules | rule list | state + timing → template | Per user_state |
| Email triggers | rule list | event → email template | Per event type |
| Service visibility | matrix | Which services user_state can see | Per user_state |
| WhatsApp send | manual button | Admin-only, per-user | Per user |
| Campaign UTM mapping | config | UTM params → campaign_id | Per campaign |
| Delayed trigger timing | hours config | When +24h/+7d triggers fire | Per landing_id |

---

## 2️⃣ USER STATE MACHINE

### State Definitions

| State | Code | Entry Condition | Exit Condition |
|---|---|---|---|
| **Anonymous** | `anonymous` | Landing page view (no identity) | Form submitted |
| **Identified** | `identified` | Form submitted with phone/email, no completed action | First service completed |
| **First Action** | `first_action` | One booking/request completed in one vertical | Uses second vertical OR 30d inactive |
| **Returning** | `returning` | 2nd session within 14 days (same vertical) | Uses second vertical OR 30d inactive |
| **Multi-Vertical** | `multi_vertical` | Completed actions in 2+ different verticals | 30d inactive |
| **Expat Candidate** | `expat_candidate` | rental inquiry + 2 other service actions | 30d inactive |
| **Investor Candidate** | `investor_candidate` | DD requested OR 3+ project page views in 7 days | 30d inactive |
| **Dormant** | `dormant` | No activity for 30+ days from any active state | Session started (→ returning) OR 90d (→ churned) |
| **Churned** | `churned` | No activity for 90+ days | Session started (→ returning) |

### State Transition Rules (event-driven only)

```
EVENT: landing_view
  IF no user_id → state = anonymous

EVENT: form_submitted (phone or email collected)
  anonymous → identified
  SET source_landing_id = landing_id

EVENT: first_service_completed
  identified → first_action
  SET first_vertical = vertical_type

EVENT: session_started (day > 1, within 14 days)
  first_action → returning

EVENT: service_completed (different vertical than first_vertical)
  any_active → multi_vertical

EVENT: service_completed WHERE (verticals_used >= 3 AND includes 'rental')
  any_active → expat_candidate

EVENT: dd_requested OR (project_views >= 3 in 7d)
  any_active → investor_candidate

CRON: daily at 03:00 UTC
  IF last_activity_at < now() - 30d AND state NOT IN (dormant, churned)
    → dormant
  IF last_activity_at < now() - 90d AND state = dormant
    → churned

EVENT: session_started
  dormant → returning
  churned → returning
```

### State → Allowed Services Matrix

| Service | anon | identified | first_action | returning | multi | expat | investor |
|---|---|---|---|---|---|---|---|
| Landing page (any) | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Same-vertical browsing | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Booking flow | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Booking history | ❌ | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Second vertical suggestion | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ | ❌ |
| Favorites | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ | ✅ |
| Wallet / cashback | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ |
| Concierge chat | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ |
| Investment Hub | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| Full UNO nav | ❌ | ❌ | minimal | minimal | full | full | full |

### State → Marketing Eligibility Matrix

| Message Type | anon | identified | first_action | returning | multi | expat | investor | dormant |
|---|---|---|---|---|---|---|---|---|
| Transactional (confirmation) | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| Same-vertical push (+24h) | ❌ | ❌ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| Cross-vertical push | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ | ❌ | ❌ |
| Re-engagement push | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| Monthly digest email | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ | ❌ |
| DD report email | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ |
| WhatsApp (admin only) | ❌ | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| In-app card | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ | ✅ | ❌ |

---

## 3️⃣ EVENT & DATA SCHEMA (Supabase-ready)

### Tables

#### `mcc_landing_registry`
```sql
id              UUID PK DEFAULT gen_random_uuid()
landing_id      TEXT UNIQUE NOT NULL        -- 'transfer', 'flowers', etc.
name_en         TEXT NOT NULL
name_ru         TEXT
is_active       BOOLEAN DEFAULT true
route_path      TEXT NOT NULL               -- '/transfer'
target_path     TEXT NOT NULL               -- '/transport/airport-transfer'
hero_variant    TEXT DEFAULT 'A'            -- 'A' or 'B'
cta_variant     TEXT DEFAULT 'A'
next_actions    JSONB DEFAULT '[]'          -- [{action_id, label_en, label_ru, target}]
created_at      TIMESTAMPTZ DEFAULT now()
updated_at      TIMESTAMPTZ DEFAULT now()
```

#### `mcc_user_states`
```sql
id              UUID PK DEFAULT gen_random_uuid()
user_id         UUID NOT NULL               -- references profiles.id
state           TEXT NOT NULL               -- enum: anonymous, identified, first_action, etc.
previous_state  TEXT
source_landing  TEXT                        -- first landing_id that created this user
first_vertical  TEXT                        -- first vertical used
verticals_used  TEXT[] DEFAULT '{}'
transitioned_at TIMESTAMPTZ DEFAULT now()
created_at      TIMESTAMPTZ DEFAULT now()
updated_at      TIMESTAMPTZ DEFAULT now()
```

#### `mcc_events` (append-only event log)
```sql
id              UUID PK DEFAULT gen_random_uuid()
event_name      TEXT NOT NULL               -- from defined event list
user_id         UUID                        -- nullable for anonymous
temp_id         TEXT                        -- cookie/fingerprint for anonymous
session_id      TEXT NOT NULL
landing_id      TEXT                        -- which landing originated this
campaign_id     TEXT                        -- from UTM mapping
vertical        TEXT                        -- 'transfer', 'flowers', etc.
payload         JSONB DEFAULT '{}'          -- event-specific data
created_at      TIMESTAMPTZ DEFAULT now()
```

#### `mcc_campaigns`
Already exists — extend with:
```sql
landing_id      TEXT                        -- link campaign to landing
```

#### `mcc_automation_rules`
Already exists — extend with:
```sql
user_state_filter TEXT[]                    -- which states this rule applies to
landing_filter    TEXT[]                    -- which landing origins
```

#### `mcc_ab_tests`
```sql
id              UUID PK DEFAULT gen_random_uuid()
landing_id      TEXT NOT NULL
test_type       TEXT NOT NULL               -- 'hero' | 'cta'
variant_a       JSONB NOT NULL              -- {headline_en, headline_ru, ...}
variant_b       JSONB NOT NULL
traffic_split   NUMERIC DEFAULT 0.5
is_active       BOOLEAN DEFAULT true
started_at      TIMESTAMPTZ DEFAULT now()
ended_at        TIMESTAMPTZ
winner          TEXT                        -- 'A' | 'B' | null
created_at      TIMESTAMPTZ DEFAULT now()
```

### Event Schema

| Event Name | Required Payload Fields | Triggers State Transition? |
|---|---|---|
| `landing_view` | `{landing_id, utm_source, utm_campaign, device, locale}` | No (sets anonymous if no user_id) |
| `primary_cta_click` | `{landing_id, cta_variant, target_path}` | No |
| `intent_started` | `{landing_id, vertical, form_type}` | No |
| `form_submitted` | `{landing_id, vertical, fields_collected: []}` | anonymous → identified |
| `first_service_completed` | `{landing_id, vertical, service_type, amount, currency}` | identified → first_action |
| `second_service_started` | `{vertical_new, vertical_original}` | — |
| `second_service_completed` | `{vertical_new, vertical_original}` | → multi_vertical (if different vertical) |
| `account_confirmed` | `{method: 'magic_link' | 'otp'}` | No (unlocks features) |
| `session_started` | `{days_since_last, landing_id}` | dormant → returning |
| `inactivity_detected` | `{days_inactive, last_vertical}` | → dormant (30d) |
| `churn_risk_flagged` | `{days_inactive, total_actions, last_landing}` | → churned (90d) |
| `dd_requested` | `{project_id, landing_id}` | → investor_candidate |
| `push_delivered` | `{template_id, campaign_id}` | No |
| `push_opened` | `{template_id, campaign_id}` | No |

### Event → State Transition Map

```
landing_view (no user_id)           → SET state = anonymous
form_submitted                      → anonymous → identified
first_service_completed             → identified → first_action
session_started (day > 1, < 14d)    → first_action → returning
service_completed (new vertical)    → any → multi_vertical
rental + 2 others                   → any → expat_candidate
dd_requested                        → any → investor_candidate
30d no events                       → any_active → dormant
90d no events                       → dormant → churned
session_started (from dormant)      → dormant → returning
```

### Event → Admin Analytics Usage

| Event | Dashboard Section | Metric |
|---|---|---|
| landing_view | Pulse + Funnel Board | Traffic volume |
| primary_cta_click | Funnel Board | CTA rate |
| intent_started | Funnel Board | Intent rate |
| form_submitted | Funnel Board | Account creation rate |
| first_service_completed | Revenue Attribution | Conversion + revenue |
| second_service_completed | Cross-Vertical Rate | Upsell effectiveness |
| inactivity_detected | Drop-off Radar | Churn prediction |
| push_delivered + push_opened | Campaign perf panel | Engagement rate |

### Event → Automation Usage

| Event | Automation Action |
|---|---|
| first_service_completed (transfer) | Schedule push: "Need a ride back?" +0h |
| first_service_completed (transfer) | Schedule push: "Rent a bike?" +24h |
| first_service_completed (flowers) | Schedule push: "Birthday coming up?" +7d |
| first_service_completed (vehicle) | Schedule push: "Rental ends soon. Extend?" +72h |
| first_service_completed (rental) | Schedule push: "New listings in your area" +7d |
| dd_requested | Schedule email: "Report ready" +3d |
| inactivity_detected (30d) | Schedule push: vertical-specific re-engagement |
| inactivity_detected (90d) | Schedule email: account summary |

---

## 4️⃣ POST-LANDING FLOWS

### Transfer

```
[Landing: /transfer]
  │
  ▼ primary_cta_click
[Core: /transport/airport-transfer]
  │
  ▼ form_submitted (name + phone + flight)
  │  → silent account created
  │  → state: identified
  │
  ▼ booking confirmed
  │  → EVENT: first_service_completed
  │  → state: first_action
  │
  ▼ SUCCESS SCREEN:
     "Your driver: [Name], [Car]"
     "WhatsApp: +66..."
     ├── NBA #1 (immediate): "Book return transfer"
     └── NBA #2 (contextual): —
  
  DELAYED:
     +24h PUSH: "Settled in? Rent a bike for ฿200/day"
       CONDITION: state = first_action, source = transfer
     +7d PUSH: "Need anything else in Phuket?"
       CONDITION: state = first_action, no second action

  FORBIDDEN:
     - Dashboard
     - Other verticals on success screen
     - "Explore UNO" prompts
     - Wallet / rewards mention
```

### Flowers

```
[Landing: /flower-delivery]
  │
  ▼ primary_cta_click
[Core: /flowers]
  │
  ▼ form_submitted (name + phone + address)
  │  → silent account
  │  → state: identified
  │
  ▼ order placed
  │  → EVENT: first_service_completed
  │  → state: first_action
  │
  ▼ SUCCESS SCREEN:
     "Delivery by [time]. Photo before delivery."
     ├── NBA #1 (immediate): "Save this address"
     └── NBA #2: —
  
  DELAYED:
     +7d PUSH: "Someone's birthday coming up?"
       CONDITION: state = first_action, source = flowers
     +30d PUSH: "Reorder your last bouquet in one tap"
       CONDITION: state = returning, source = flowers

  FORBIDDEN:
     - Cross-selling non-floral services
     - Mentioning other verticals
     - Bundle/deal promotions
```

### Vehicle Rental

```
[Landing: /vehicle-rental]
  │
  ▼ primary_cta_click
[Core: /transport?type=rental]
  │
  ▼ form_submitted (name + phone + dates)
  │  → silent account
  │  → state: identified
  │
  ▼ request confirmed
  │  → EVENT: first_service_completed
  │  → state: first_action
  │
  ▼ SUCCESS SCREEN:
     "Confirmed. Pickup at [location], [date]"
     ├── NBA #1 (immediate): "Browse other vehicles"
     └── NBA #2: —
  
  DELAYED:
     +72h before rental end PUSH: "Rental ends soon. Extend?"
       CONDITION: booking.end_date - 3d
     +7d after rental end PUSH: "Need a transfer to airport?"
       CONDITION: state = first_action, no second action

  FORBIDDEN:
     - Insurance upsells on success screen
     - Tour packages
     - Price comparison language
```

### Property Rental

```
[Landing: /rent-phuket]
  │
  ▼ primary_cta_click
[Core: /property?mode=rent]
  │
  ▼ viewing requested (name + phone/email)
  │  → silent account
  │  → state: identified
  │
  ▼ viewing confirmed by agent
  │  → EVENT: first_service_completed
  │  → state: first_action
  │
  ▼ SUCCESS SCREEN:
     "Viewing request sent. Agent replies within 24h."
     ├── NBA #1 (immediate): "Browse more in [district]"
     └── NBA #2: —
  
  DELAYED:
     +7d PUSH: "12 new verified listings in your area"
       CONDITION: state = first_action, source = rental
     +14d PUSH: "Still looking? Save your search filters"
       CONDITION: state = identified, no completed action
     +30d PUSH: "Your rental review is due"
       CONDITION: state = first_action, booking active

  FORBIDDEN:
     - Short-term stays
     - Tourist-oriented deals
     - "Cheap" framing
     - Investment pitches
```

### New Developments (Rating + DD)

```
[Landing: /new-developments]
  │
  ▼ primary_cta_click
[Core: /property?mode=buy&type=offplan]
  │
  ▼ DD requested (name + email required)
  │  → silent account
  │  → state: identified
  │  → EVENT: dd_requested → state: investor_candidate
  │
  ▼ SUCCESS SCREEN:
     "Report will be sent to [email] within 3 business days."
     ├── NBA #1 (immediate): "Compare with other rated projects"
     └── NBA #2: —
  
  DELAYED:
     +3d EMAIL: "Your due diligence report is ready"
       CONDITION: dd_report_generated = true
     +14d EMAIL: "Market update: [area] price trends"
       CONDITION: state = investor_candidate
     +30d EMAIL: "New projects added to rating"
       CONDITION: state = investor_candidate

  FORBIDDEN:
     - "Buy now" language
     - Guaranteed returns
     - Urgency tactics
     - Cross-selling unrelated services
     - Price anchoring
```

### Trigger Timing Summary

| Landing | +0h | +24h | +72h | +7d | +14d | +30d |
|---|---|---|---|---|---|---|
| transfer | Return transfer | Bike rental push | — | General re-engage | — | — |
| flowers | Save address | — | — | Birthday push | — | Reorder push |
| vehicle | Browse more | — | Extend rental | Airport transfer | — | — |
| rental | Browse district | — | — | New listings | Save filters | Rental review |
| newdev | Compare projects | — | — | — | Market update | New projects |

### Feature Unlock Conditions

| Unlock | Condition | What Appears |
|---|---|---|
| Booking history | state >= first_action | "My Bookings" in nav |
| Minimal nav | state >= first_action | Bottom nav with 3 items |
| Full nav | state >= multi_vertical | Bottom nav with all items |
| Favorites | state >= returning | Heart icons on listings |
| Saved addresses | state >= returning | Address book in profile |
| Wallet | state >= multi_vertical | Wallet tab in nav |
| Concierge | state >= expat_candidate | Chat icon in header |
| Investment Hub | state >= investor_candidate | Investment tab |
| Full profile | 30+ days active | Profile completion prompt |

---

## SYSTEM VALIDATION

| Check | Pass | Implementation Note |
|---|---|---|
| Admin traces ad → landing → revenue | ✅ | campaign_id → landing_id → user_id → booking.total_amount |
| User never sees irrelevant services | ✅ | State → services matrix enforced at component level |
| One landing failure ≠ core failure | ✅ | Landings are independent routes with independent configs |
| Scalable to new landings | ✅ | Add row to mcc_landing_registry, define events, done |
| No spam | ✅ | Max 1 push/48h, behavior-only triggers, no generic blasts |
| No registration ceremony | ✅ | Silent account via action forms, magic link later |
| Single user_id across landings | ✅ | Phone/email dedup at form_submitted |
| State is derived, never self-reported | ✅ | Events → transition rules → state |
| Admin controls everything from one screen | ✅ | Controls panel in MCC L1 |
| Progressive disclosure, not information dump | ✅ | Feature unlock tied to state |

---

## LAYER SEPARATION

```
LANDING LAYER (entry)
├── Zero navigation
├── One pain, one CTA
├── "powered by myUNO" only
├── Routes: /transfer, /flower-delivery, /vehicle-rental, /rent-phuket, /new-developments
└── Controlled by: mcc_landing_registry (admin toggle, A/B, is_active)

CORE LAYER (product)
├── Vertical-specific pages
├── Progressive nav based on user_state
├── Silent account formation
├── Feature unlock via state machine
└── All events logged to mcc_events

ADMIN LAYER (control)
├── Marketing Command Center L1
├── Real-time KPIs from mcc_events
├── Controls panel (switches, A/B, triggers)
├── User state distribution
├── Campaign attribution
└── One operator, zero stitching
```

---

*This document supersedes the previous landing-system-architecture.md.*
*All implementation must reference these definitions.*
*Single source of truth for: state logic, events, admin controls, post-landing flows.*
