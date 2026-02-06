# UNO Landing System Architecture
## Entry Layer → Core Product → Admin Control

---

## 1. LANDING REGISTRY

| landing_id | Intent (JTBD) | Primary CTA | Allowed Next Actions | Forbidden |
|---|---|---|---|---|
| `transfer` | "Get from airport to hotel safely" | Book My Transfer | Track booking, Save driver contact | Menu, Other services, Dashboard |
| `flowers` | "Send flowers without disappointment" | Choose a Bouquet | Track delivery, Reorder | Menu, Other services, Bundles |
| `vehicle` | "Rent a car/bike without scams" | View Vehicles | Browse fleet, Request booking | Menu, Insurance upsells, Tours |
| `rental` | "Find honest long-term housing" | View Verified Rentals | Browse listings, Request viewing | Menu, Short-term stays, Deals |
| `newdev` | "Evaluate a project before buying" | View Rated Projects | Browse ratings, Request DD | Menu, "Buy now", Return promises |

### Landing → Core Transition Rules

```
RULE 1: Landing pages have NO global navigation
RULE 2: UNO brand = small "powered by myUNO" footer only
RULE 3: CTA leads to vertical-specific page inside core app
RULE 4: After first action complete → user is "inside UNO" (nav appears)
RULE 5: landing_id is persisted in session + user record forever
```

### Route Map

```
/transfer           → CTA → /transport/airport-transfer
/flower-delivery    → CTA → /flowers
/vehicle-rental     → CTA → /transport?type=rental
/rent-phuket        → CTA → /property?mode=rent
/new-developments   → CTA → /property?mode=buy&type=offplan
```

---

## 2. SILENT ACCOUNT FORMATION

### Account Creation Triggers

| Trigger Point | Method | What Happens |
|---|---|---|
| Booking confirmation (transfer, flowers) | Phone + name collected in booking form | Account created silently, session started |
| Viewing request (rental) | Phone or email in request form | Account created, no "welcome" screen |
| DD request (newdev) | Email required for report delivery | Account created, report linked |
| Vehicle booking | Phone + name in booking form | Account created silently |
| Return visit (any landing) | Cookie/fingerprint match | Session resumed, no re-auth |

### Required vs Optional Fields by Landing

| Field | transfer | flowers | vehicle | rental | newdev |
|---|---|---|---|---|---|
| name | ✅ required | ✅ required | ✅ required | ✅ required | ✅ required |
| phone | ✅ required | ✅ required | ✅ required | ✅ required | optional |
| email | optional | optional | optional | optional | ✅ required |
| password | ❌ never | ❌ never | ❌ never | ❌ never | ❌ never |

```
RULE: Password is NEVER collected at first interaction.
RULE: Account confirmation = magic link sent after first action.
RULE: No "Welcome to UNO" screen. Ever.
RULE: user_id assigned at first form submission, shared across all landings.
```

---

## 3. POST-LANDING FLOWS

### Transfer Landing

```
[Book Transfer] → [Confirmation Screen]
                      ├── "Your driver: [Name], [Car], [Plate]"
                      ├── "Save driver's WhatsApp" (immediate)
                      └── Next Best Actions:
                           ├── +0h: "Need a ride back to airport?" (return transfer)
                           └── +24h: [Push] "Settled in? Rent a bike for the week"
```

### Flowers Landing

```
[Choose Bouquet] → [Order Placed Screen]
                      ├── "Delivery by [time]. We'll send a photo before delivery."
                      └── Next Best Actions:
                           ├── +0h: "Save this address for next time"
                           └── +7d: [Push] "Someone's birthday coming up?"
```

### Vehicle Rental Landing

```
[View Vehicles] → [Request Sent Screen]
                      ├── "We'll confirm availability within 1 hour"
                      └── Next Best Actions:
                           ├── +0h: "Browse other vehicles while you wait"
                           └── +72h: [Push] "Your rental ends soon. Extend?"
```

### Rental Landing

```
[View Rentals] → [Viewing Requested Screen]
                      ├── "Agent will contact you within 24h"
                      └── Next Best Actions:
                           ├── +0h: "Browse more listings in [district]"
                           └── +7d: [Push] "New verified listings in your area"
```

### New Developments Landing

```
[View Projects] → [DD Requested Screen]
                      ├── "Report will be sent to [email] within 3 business days"
                      └── Next Best Actions:
                           ├── +0h: "Compare with other rated projects"
                           └── +14d: [Email] "Your DD report is ready"
```

### UNO Feature Unlock Timeline

```
After 1st action  → Booking history visible
After 2nd action  → "Your UNO" tab appears in nav
After 3rd action  → Favorites, saved addresses enabled
After 7 days      → Wallet promo shown (if relevant)
After 30 days     → Full UNO profile suggested
```

---

## 4. USER STATE MACHINE

### State Definitions

| State | Trigger | Description |
|---|---|---|
| `anonymous` | Landing page view | No identity yet |
| `identified` | First form submitted | Has phone/email, no completed action |
| `first_action` | First booking/request completed | Single-vertical user |
| `returning` | 2nd visit within 14 days | Shows engagement |
| `multi_vertical` | Used 2+ different verticals | Cross-platform user |
| `expat_candidate` | Rental inquiry + 2 other services | Likely long-term resident |
| `investor_candidate` | DD request OR project browsing > 3 | Capital-aware user |
| `dormant` | No activity for 30+ days | Churn risk |
| `churned` | No activity for 90+ days | Lost user |

### State Transition Rules

```
anonymous       → identified         ON form_submitted
identified      → first_action       ON first_action_completed
first_action    → returning          ON session_started (day > 1)
returning       → multi_vertical     ON second_vertical_used
first_action    → expat_candidate    ON (landing=rental + actions >= 3)
first_action    → investor_candidate ON (landing=newdev + dd_requested)
any_active      → dormant            ON (no_activity, 30d)
dormant         → churned            ON (no_activity, 90d)
dormant         → returning          ON session_started
```

### State → Feature Visibility Matrix

| Feature | anonymous | identified | first_action | returning | multi_vertical | expat | investor |
|---|---|---|---|---|---|---|---|
| Landing page | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Vertical page | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Booking history | ❌ | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Bottom nav | ❌ | ❌ | minimal | full | full | full | full |
| Favorites | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ | ✅ |
| Wallet | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ |
| Concierge | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ |
| Investment Hub | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| Cross-sell push | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ | ❌ |

---

## 5. MARKETING CENTER (ADMIN L1)

### Dashboard Structure

```
┌─────────────────────────────────────────────────────┐
│  MARKETING COMMAND CENTER                           │
├─────────────────────────────────────────────────────┤
│                                                     │
│  [Today] [7d] [30d] [Custom]                        │
│                                                     │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐   │
│  │ Landing  │ │ CTA     │ │ First   │ │ Revenue │   │
│  │ Views    │ │ Clicks  │ │ Actions │ │ (THB)   │   │
│  │ 12,340   │ │ 2,180   │ │ 892     │ │ 1.2M    │   │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘   │
│                                                     │
│  FUNNEL BY LANDING                                  │
│  ┌────────────────────────────────────────────┐      │
│  │ transfer  ████████████████░░░ 41% conv     │      │
│  │ flowers   ██████████████░░░░░ 35% conv     │      │
│  │ vehicle   ████████░░░░░░░░░░ 22% conv     │      │
│  │ rental    ██████░░░░░░░░░░░░ 18% conv     │      │
│  │ newdev    ████░░░░░░░░░░░░░░ 12% conv     │      │
│  └────────────────────────────────────────────┘      │
│                                                     │
│  USER STATE DISTRIBUTION                            │
│  anonymous: 8,200 | identified: 2,100               │
│  first_action: 892 | returning: 340                  │
│  multi_vertical: 89 | expat: 23 | investor: 12      │
│                                                     │
│  CONTROLS                                           │
│  ┌──────────────────────────────────────┐            │
│  │ Landing toggles     [on/off per ID] │            │
│  │ A/B hero variants   [A|B per ID]    │            │
│  │ Next actions config [edit per flow] │            │
│  │ Push triggers       [edit rules]    │            │
│  │ Campaign links      [assign UTMs]   │            │
│  └──────────────────────────────────────┘            │
│                                                     │
└─────────────────────────────────────────────────────┘
```

### Core KPIs

| KPI | Source | Granularity |
|---|---|---|
| Landing views | `landing_view` event | Per landing_id, daily |
| CTA click rate | `primary_cta_click` / views | Per landing_id |
| First action rate | `first_action_completed` / clicks | Per landing_id |
| Silent account rate | accounts created / clicks | Per landing_id |
| Cross-vertical rate | `multi_vertical` state count | Weekly |
| Revenue per landing | Sum of completed bookings | Per landing_id |
| Churn risk count | `dormant` state users | Daily |
| CAC by landing | Ad spend / first_action | Per campaign_id |

### Admin Switches & Controls

| Control | Type | Effect |
|---|---|---|
| Landing active/inactive | Toggle | Enables/disables route |
| Hero copy variant | A/B selector | Swaps headline + subhead |
| CTA text variant | A/B selector | Swaps button label |
| Post-action next steps | Config list | Controls what appears on success screen |
| Push notification rules | Rule editor | State + timing → message template |
| WhatsApp trigger | Manual button | Admin-initiated per user |

---

## 6. MARKETING AUTOMATION

### Campaign Logic Map

```
Ad Platform (Google/Meta/TG)
  └── UTM: utm_source + utm_campaign + utm_content
        └── Maps to: campaign_id + landing_id
              └── User arrives at landing
                    └── Events tracked with landing_id + campaign_id
                          └── Account created → user_state assigned
                                └── State → messaging rules activated
```

### Trigger Conditions

| Trigger | Channel | Condition | Message |
|---|---|---|---|
| Booking confirmed | Push | first_action + landing=transfer | "Driver assigned. Save contact." |
| +24h after transfer | Push | state=first_action + landing=transfer | "Need a bike for the week?" |
| +7d after flowers | Push | state=first_action + landing=flowers | "Saved addresses make reordering instant." |
| +3d after rental view | Push | state=identified + landing=rental | "12 new listings in your area." |
| DD report ready | Email | landing=newdev + dd_completed | "Your report is ready. View inside UNO." |
| 14d no activity | Push | state=dormant | "[Vertical]-specific re-engagement" |
| 30d no activity | Email | state=dormant | "Your UNO account summary" |

### Messaging Priority Rules

```
1. NEVER send more than 1 push per 48 hours
2. NEVER send generic "check out our platform" messages
3. ALL messages must reference a specific user action or context
4. WhatsApp = admin-only trigger, not automated
5. Email = transactional (reports, confirmations) + monthly digest max
6. In-app = contextual cards only, no modals on first 3 sessions
```

---

## 7. EVENTS MODEL

### Core Events

| Event | Payload | Analytics Use | Automation Use |
|---|---|---|---|
| `landing_view` | landing_id, utm_*, device, locale | Funnel top, traffic source | — |
| `primary_cta_click` | landing_id, cta_variant | Conversion rate | — |
| `form_started` | landing_id, form_type | Drop-off analysis | — |
| `form_submitted` | landing_id, user_id (new) | Account creation rate | Create silent account |
| `first_action_completed` | landing_id, action_type, amount | Revenue attribution | State → first_action |
| `second_vertical_used` | landing_id_original, vertical_new | Cross-sell effectiveness | State → multi_vertical |
| `account_confirmed` | user_id, method (magic_link/otp) | Auth funnel | Unlock features |
| `session_started` | user_id, days_since_last | Retention | State transitions |
| `churn_risk_detected` | user_id, days_inactive | Retention dashboard | Trigger re-engagement |
| `push_delivered` | user_id, campaign_id, template | Campaign performance | — |
| `push_opened` | user_id, campaign_id | Engagement rate | — |

### Event → Admin Visibility

```
All events stream to:
  1. Analytics dashboard (aggregated, real-time counters)
  2. User timeline (per-user event log in admin)
  3. Campaign attribution (event → campaign_id linkage)
  4. Funnel visualization (landing → CTA → action → retention)
```

---

## 8. SYSTEM VERIFICATION CHECKLIST

| Check | Status | Notes |
|---|---|---|
| No landing leaks users outside UNO | ✅ | All CTAs route to internal pages |
| No irrelevant services shown | ✅ | State machine controls visibility |
| Admin can trace ad → revenue | ✅ | campaign_id → landing_id → user_id → booking |
| Platform complexity hidden from users | ✅ | Progressive disclosure, no dashboard on first visit |
| No registration ceremony | ✅ | Silent account via booking forms |
| No spam possible | ✅ | 48h push limit, behavior-only triggers |
| Single user_id across all landings | ✅ | Phone/email dedup at account creation |
| Landing pages are isolated | ✅ | No global nav, no cross-service links |
| Each landing has one CTA only | ✅ | Enforced by component structure |
| UNO brand is minimal on landings | ✅ | "powered by myUNO" footer only |

---

## SYSTEM ARCHITECTURE OVERVIEW

```
                    ┌──────────────────┐
                    │   AD PLATFORMS    │
                    │ Google/Meta/TG   │
                    └────────┬─────────┘
                             │ UTM params
                    ┌────────▼─────────┐
                    │  LANDING LAYER   │
                    │  (5 entry points)│
                    │  No nav, 1 CTA   │
                    └────────┬─────────┘
                             │ form_submitted → silent account
                    ┌────────▼─────────┐
                    │   UNO CORE       │
                    │  Vertical pages  │
                    │  Booking flows   │
                    │  Progressive nav │
                    └────────┬─────────┘
                             │ events stream
              ┌──────────────┼──────────────┐
              │              │              │
     ┌────────▼───┐  ┌──────▼──────┐  ┌────▼────────┐
     │  USER      │  │  MARKETING  │  │  ADMIN      │
     │  STATE     │  │  AUTOMATION │  │  COMMAND     │
     │  MACHINE   │  │  (triggers) │  │  CENTER      │
     └────────────┘  └─────────────┘  └─────────────┘
```

---

*This document is the single source of truth for the UNO landing system.*
*All implementation must reference these definitions.*
*Version: 1.0 | Date: 2026-02-06*
