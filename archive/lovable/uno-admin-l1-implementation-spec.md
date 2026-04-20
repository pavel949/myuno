> ARCHIVED: 2026-04-20
> Superseded by: CLAUDE.md, DESIGN.md, current codebase
> Reason: Lovable AI session artifact from Jan-Feb 2026, superseded by implemented code

# UNO Admin Marketing Center L1 — Implementation-Ready Specification
## Control Tower + SQL Schema + AI Assistant

Version: 1.0 | Date: 2026-02-06
Status: Implementation-ready

---

## IMPLEMENTATION STATUS MAP

| Component | Status | Location |
|---|---|---|
| MCC Dashboard shell | ✅ Built | `MarketingDashboard.tsx` (9 tabs) |
| Overview KPIs | ✅ Built | `MCCOverviewTab.tsx` (leads, CAC, conversion, ROAS, campaigns) |
| Campaign Factory | ✅ Built | `MCCCampaignsTab.tsx` + `useCampaignFactory.ts` |
| Lead Hub | ✅ Built | `MCCLeadsTab.tsx` + `useLeadHub.ts` |
| Funnels | ✅ Built | `MCCFunnelsTab.tsx` |
| Content Lab | ✅ Built | `MCCContentLabTab.tsx` |
| Analytics | ✅ Built | `MCCAnalyticsTab.tsx` |
| Automation | ✅ Built | `MCCAutomationTab.tsx` |
| Landing Control | ✅ Built | `MCCLandingControlTab.tsx` + `useLandingRegistry.ts` |
| User States | ✅ Built | `MCCUserStatesTab.tsx` + `useLandingRegistry.ts` |
| DB: `mcc_landing_registry` | ✅ Created | 5 landings seeded |
| DB: `mcc_user_states` | ✅ Created | Event-derived state model |
| DB: `mcc_landing_events` | ✅ Created | Append-only event log |
| DB: `mcc_ab_tests` | ✅ Created | Per-landing A/B tests |
| DB: `mcc_campaigns` (extended) | ✅ Extended | `landing_id` column added |
| DB: `mcc_automation_rules` (extended) | ✅ Extended | `user_state_filter`, `landing_filter` added |
| DB: `mcc_transition_user_state()` | ✅ Created | Programmatic state transitions |
| **Control Tower Dashboard** | ❌ NOT built | Admin L1 main screen (this spec) |
| **AI Assistant Panel** | ❌ NOT built | Anomaly detection + recommendations |
| **Landing Performance Analytics** | ❌ NOT built | Per-landing funnel + revenue |
| **State → Revenue correlation** | ❌ NOT built | Revenue by user_state |
| **Event stream → KPI pipeline** | ❌ NOT built | Real-time event aggregation |
| **Campaign → Landing attribution** | ❌ NOT built | campaign_id → landing_id → revenue |

---

## PART 1: ADMIN L1 MAIN DASHBOARD

### 1.1 SCREEN LAYOUT

```
┌─────────────────────────────────────────────────────────┐
│                   ABOVE THE FOLD                        │
├─────────────────────────────────────────────────────────┤
│ [A] PULSE BAR  (4 KPIs, period toggle: today / 7d / MTD)│
│ ┌──────────┬──────────┬──────────┬──────────┐           │
│ │ Traffic  │ Revenue  │ Conv %   │ Active   │           │
│ │ 1,234    │ ฿45.2K   │ 8.3%     │ 89       │           │
│ │ ▲ +12%   │ ▲ +5.1%  │ ▼ -0.7%  │ ▲ +3     │           │
│ └──────────┴──────────┴──────────┴──────────┘           │
│                                                         │
│ [B] ALERTS STRIP  (red/yellow only, max 3 visible)      │
│ ┌───────────────────────────────────────────────────┐   │
│ │ 🔴 Transfer landing: 0 CTA clicks last 2h        │   │
│ │ 🟡 Flowers conversion dropped 40% vs yesterday   │   │
│ └───────────────────────────────────────────────────┘   │
│                                                         │
│ [C] FUNNEL BOARD  (one row per landing)                 │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ Landing    │ Views │ Clicks │ Intents │ Complete │ Rev│ │
│ │ Transfer   │ 420   │ 89     │ 34      │ 12     │฿18K│ │
│ │ Flowers    │ 310   │ 67     │ 45      │ 31     │฿24K│ │
│ │ Vehicle    │ 180   │ 23     │ 8       │ 3      │฿9K │ │
│ │ Rental     │ 95    │ 18     │ 12      │ 2      │฿40K│ │
│ │ NewDev     │ 45    │ 12     │ 5       │ 1      │฿0  │ │
│ └─────────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────┤
│                   BELOW THE FOLD                        │
├─────────────────────────────────────────────────────────┤
│ [D] STATE MAP             │ [E] AI ASSISTANT            │
│ ┌──────────────────────┐  │ ┌──────────────────────────┐│
│ │ anonymous    ████ 45 │  │ │ 🤖 3 recommendations     ││
│ │ identified   ███  28 │  │ │                          ││
│ │ first_action ██   15 │  │ │ 1. Pause /vehicle -      ││
│ │ returning    █     8 │  │ │    CTA rate 3.2% (<5%)   ││
│ │ multi        █     4 │  │ │    → Expected: save ฿2K  ││
│ │ dormant      ██   12 │  │ │                          ││
│ └──────────────────────┘  │ │ 2. Flowers: switch to    ││
│                           │ │    variant B — +12% CTR  ││
│ [F] DROP-OFF RADAR        │ │                          ││
│ ┌──────────────────────┐  │ │ 3. 8 dormant users from  ││
│ │ Transfer: intent→done│  │ │    rental — trigger push ││
│ │ 34 → 12 (65% drop)  │  │ │    "New listings nearby" ││
│ │ Flowers: OK (31%)    │  │ │                          ││
│ │ Vehicle: 8→3 (63%)   │  │ │ [Apply] [Dismiss] [Why?]││
│ └──────────────────────┘  │ └──────────────────────────┘│
│                           │                             │
│ [G] TOP SERVICES          │ [H] CAMPAIGN PERFORMANCE    │
│ ┌──────────────────────┐  │ ┌──────────────────────────┐│
│ │ 1. Airport Transfer  │  │ │ Camp.1: Google/Transfer  ││
│ │    ฿18K (12 bookings)│  │ │ Spend: ฿5K | Leads: 34  ││
│ │ 2. Flowers Premium   │  │ │ CAC: ฿147 | ROAS: 3.6x  ││
│ │    ฿14K (22 orders)  │  │ │                          ││
│ │ 3. Property Viewing  │  │ │ Camp.2: Meta/Flowers     ││
│ │    ฿40K (2 deals)    │  │ │ Spend: ฿3K | Leads: 67  ││
│ └──────────────────────┘  │ │ CAC: ฿45  | ROAS: 8.0x  ││
│                           │ └──────────────────────────┘│
└─────────────────────────────────────────────────────────┘
```

### 1.1 KPI DEFINITIONS

| # | KPI | Formula | Source Table | Period | Thresholds |
|---|---|---|---|---|---|
| 1 | **Traffic** | `COUNT(*) FROM mcc_landing_events WHERE event_name = 'landing_view'` | `mcc_landing_events` | today / 7d / MTD | 🟢 >100/day, 🟡 50-100, 🔴 <50 |
| 2 | **Revenue** | `SUM(total_amount) FROM bookings WHERE created_at IN period` | `bookings` | today / 7d / MTD | 🟢 >฿10K/day, 🟡 ฿5-10K, 🔴 <฿5K |
| 3 | **Conversion %** | `first_service_completed / landing_view * 100` per landing | `mcc_landing_events` | 7d rolling | 🟢 >8%, 🟡 5-8%, 🔴 <5% |
| 4 | **Active Users** | `COUNT(*) FROM mcc_user_states WHERE state NOT IN ('dormant','churned')` | `mcc_user_states` | current | 🟢 growing, 🟡 flat, 🔴 shrinking |
| 5 | **CTA Rate** | `primary_cta_click / landing_view * 100` | `mcc_landing_events` | 7d per landing | 🟢 >15%, 🟡 10-15%, 🔴 <10% |
| 6 | **Intent Rate** | `intent_started / primary_cta_click * 100` | `mcc_landing_events` | 7d per landing | 🟢 >30%, 🟡 15-30%, 🔴 <15% |
| 7 | **Second Action Rate** | `second_service_started / first_service_completed * 100` | `mcc_landing_events` | 30d | 🟢 >20%, 🟡 10-20%, 🔴 <10% |
| 8 | **CAC** | `campaign.spend / first_service_completed` | `mcc_campaigns` + events | per campaign | 🟢 <฿200, 🟡 ฿200-500, 🔴 >฿500 |
| 9 | **ROAS** | `attributed_revenue / campaign.spend` | `bookings` + campaigns | per campaign | 🟢 >3x, 🟡 1-3x, 🔴 <1x |
| 10 | **Churn Rate** | `COUNT(state='dormant') / total_active * 100` | `mcc_user_states` | weekly | 🟢 <10%, 🟡 10-20%, 🔴 >20% |

### 1.1 ALERT RULES

| Alert | Condition | Severity | Action |
|---|---|---|---|
| Landing zero clicks | 0 `primary_cta_click` in last 2h (if `is_active=true`) | 🔴 Critical | Check landing page, verify route |
| Conversion drop | Conversion rate drops >30% vs previous 7d average | 🟡 Warning | Review funnel, check form errors |
| Revenue anomaly | Revenue <50% of same-day-of-week average | 🟡 Warning | Check bookings pipeline |
| High churn spike | >5 users transitioned to dormant in 24h | 🟡 Warning | Review re-engagement triggers |
| Campaign overspend | Campaign spend >90% of budget | 🟡 Warning | Pause or adjust budget |
| A/B test conclusive | One variant >20% better with >100 samples | 🟢 Info | Apply winner |

---

### 1.2 LANDING CONTROL SCREEN

**Already built in `MCCLandingControlTab.tsx`.** Enhancement needed:

#### Current capabilities:
- ✅ Toggle landing on/off
- ✅ Switch hero/CTA variant
- ✅ View routes, next actions, forbidden elements

#### Missing (to build):

| Addition | Description | Data Source |
|---|---|---|
| **Traffic column** | Views / Clicks / Intents per landing (7d) | `mcc_landing_events` aggregated |
| **Conversion column** | `first_service_completed / landing_view` per landing | `mcc_landing_events` |
| **Revenue column** | `SUM(bookings.total_amount)` attributed to landing | `bookings` + event correlation |
| **Impact warning** | "Disabling this landing affects X active users, Y in-progress intents" | `mcc_user_states` + events |
| **A/B test results** | Show conversion per variant with sample size | `mcc_ab_tests` + events |

#### Control Switches (complete list):

| Switch | Type | Current | Effect |
|---|---|---|---|
| `is_active` | Toggle | ✅ Built | Disables landing route |
| `hero_variant` | A/B select | ✅ Built | Switches headline |
| `cta_variant` | A/B select | ✅ Built | Switches CTA text |
| `next_actions` | Editable list | Displayed only | Configures success screen NBA |
| `forbidden_elements` | Tag list | Displayed only | Blocks specific UI elements |
| `delayed_triggers` | Timing config | ❌ Not built | Sets +24h, +7d push timing |
| `allowed_services` | Checkbox matrix | ❌ Not built | Per-landing post-action service filter |

---

### 1.3 USER STATE MONITOR

**Already built in `MCCUserStatesTab.tsx`.** Enhancement needed:

#### Current capabilities:
- ✅ State distribution grid (9 states)
- ✅ State funnel bar chart
- ✅ States by source landing table
- ✅ Transition rules reference

#### Missing (to build):

| Addition | Description |
|---|---|
| **State transitions over time** | Line chart: daily count per state (7d / 30d) |
| **Revenue per state** | `SUM(bookings.total_amount)` grouped by user's current state |
| **Admin actions per state** | Buttons: "Trigger campaign for this state", "Adjust service visibility" |
| **Churn risk flagging** | Highlight dormant users with high historical revenue |

#### Admin Actions Per State:

| State | Available Actions |
|---|---|
| `anonymous` | View traffic sources, nothing to act on |
| `identified` | View incomplete intents, trigger reminder push |
| `first_action` | View users, trigger contextual push, configure NBA |
| `returning` | View users, enable cross-vertical suggestions |
| `multi_vertical` | View users, enable wallet/cashback |
| `expat_candidate` | View users, assign concierge |
| `investor_candidate` | View users, queue DD report, send market update |
| `dormant` | View users, trigger re-engagement campaign |
| `churned` | View users, consider win-back email (max 1) |

---

### 1.4 CAMPAIGN & MESSAGE CENTER (L1)

**Already built in `MCCCampaignsTab.tsx` + `MCCAutomationTab.tsx`.** Enhancement needed:

#### Campaign Creation Flow (current → enhanced):

```
Step 1: Define campaign
  - Name, channels (Google, Meta, WhatsApp, Email)
  - Budget + daily cap
  - Landing_id (which landing this campaign drives to)  ← EXISTS (landing_id column)
  
Step 2: Target audience  ← NEEDS ENHANCEMENT
  - User state filter: select states this campaign targets
  - Landing filter: select source landings
  - Exclusion: states to exclude (e.g., exclude churned from all)
  
Step 3: Message config  ← NEEDS ENHANCEMENT
  - Template selection (from Content Lab)
  - Trigger event: which event fires this message
  - Delay: immediate, +1h, +24h, +7d
  - Channel: push / email / in-app
  
Step 4: Safety rules
  - Max sends per user per 48h: 1
  - Quiet hours: 22:00-08:00 local
  - Dedup: no repeat message if user already acted
```

#### Message Priority Rules:

| Priority | Message Type | Max Frequency | Quiet Hours |
|---|---|---|---|
| P0 | Transactional (confirmation, receipt) | Unlimited | None |
| P1 | Action-triggered (NBA, follow-up) | 1 per 24h | Respected |
| P2 | Behavioral (re-engagement, cross-sell) | 1 per 48h | Respected |
| P3 | Digest (weekly summary, market update) | 1 per 7d | Respected |

#### Anti-Spam Safety Limits:

| Rule | Value | Enforcement |
|---|---|---|
| Max pushes per user per 48h | 1 (excluding P0) | `mcc_events` WHERE event_name='push_delivered' |
| Max emails per user per 7d | 2 (excluding P0) | Same |
| No messages to `anonymous` | Always | State check before send |
| No messages to `churned` | Except 1 win-back | Counter per user |
| Quiet hours | 22:00-08:00 user local time | Timezone from session data |
| No duplicate content | Same template not sent twice to same user | Hash check |

---

## PART 2: SUPABASE SQL SCHEMA + EVENT MODEL

### 2.1 CORE TABLES

#### Tables already existing in UNO (relevant to MCC):

| Table | Key Fields | Role in MCC |
|---|---|---|
| `profiles` | `id`, `phone`, `email`, `created_at` | User identity |
| `bookings` | `id`, `user_id`, `provider_id`, `total_amount`, `currency`, `status`, `booking_type` | Revenue attribution |
| `providers` | `id`, `name_en`, `is_active` | Service supply |
| `services` | `id`, `provider_id`, `name_en`, `price` | Service catalog |

#### MCC-specific tables (already created):

| Table | Key Fields | Purpose |
|---|---|---|
| `mcc_landing_registry` | `landing_id`, `is_active`, `route_path`, `target_path`, `hero_variant`, `cta_variant`, `next_actions`, `forbidden_elements` | Landing configuration |
| `mcc_user_states` | `user_id`, `state`, `previous_state`, `source_landing`, `first_vertical`, `verticals_used`, `transitioned_at` | Derived user state |
| `mcc_landing_events` | `event_name`, `user_id`, `session_id`, `landing_id`, `campaign_id`, `vertical`, `payload` | Append-only event log |
| `mcc_ab_tests` | `landing_id`, `test_type`, `variant_a`, `variant_b`, `traffic_split`, `is_active`, `winner` | A/B test config |
| `mcc_campaigns` | `name`, `channels`, `status`, `budget`, `landing_id`, `target_audience` | Campaign management |
| `mcc_leads` | `name`, `source`, `priority`, `status`, `ai_score` | Lead management |
| `mcc_automation_rules` | `trigger_event`, `condition`, `action_type`, `user_state_filter`, `landing_filter` | Automation config |

#### Tables NEEDED (not yet created):

```sql
-- 1. Sessions table for session tracking
CREATE TABLE IF NOT EXISTS mcc_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT NOT NULL UNIQUE,
  user_id UUID,                            -- null for anonymous
  temp_id TEXT,                            -- fingerprint/cookie for anon
  landing_id TEXT,                         -- entry landing
  campaign_id TEXT,                        -- from UTM
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  device TEXT,                             -- mobile/desktop/tablet
  locale TEXT,                             -- en/ru
  started_at TIMESTAMPTZ DEFAULT now(),
  last_activity_at TIMESTAMPTZ DEFAULT now(),
  page_views INT DEFAULT 1,
  events_count INT DEFAULT 0
);

-- 2. State transition history (audit trail)
CREATE TABLE IF NOT EXISTS mcc_state_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  from_state TEXT,
  to_state TEXT NOT NULL,
  trigger_event TEXT,                      -- which event caused this
  trigger_event_id UUID,                   -- reference to mcc_landing_events.id
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Message log (anti-spam enforcement)
CREATE TABLE IF NOT EXISTS mcc_message_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  campaign_id UUID,
  template_id TEXT,
  channel TEXT NOT NULL,                   -- push/email/in-app/whatsapp
  priority TEXT NOT NULL,                  -- P0/P1/P2/P3
  content_hash TEXT,                       -- dedup check
  sent_at TIMESTAMPTZ DEFAULT now(),
  delivered_at TIMESTAMPTZ,
  opened_at TIMESTAMPTZ,
  clicked_at TIMESTAMPTZ,
  error TEXT
);

-- 4. AI recommendations log
CREATE TABLE IF NOT EXISTS mcc_ai_recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recommendation_type TEXT NOT NULL,       -- pause_landing, change_nba, trigger_campaign, etc.
  target_entity TEXT,                      -- landing_id, state, campaign_id
  what_happened TEXT NOT NULL,             -- observation
  why_it_matters TEXT NOT NULL,            -- impact
  what_to_do TEXT NOT NULL,                -- action
  expected_impact TEXT,                    -- prediction
  confidence NUMERIC NOT NULL,            -- 0.0-1.0
  data_points JSONB DEFAULT '{}',         -- supporting data
  status TEXT DEFAULT 'pending',          -- pending/applied/dismissed
  applied_at TIMESTAMPTZ,
  dismissed_at TIMESTAMPTZ,
  dismissed_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### 2.2 EVENT MODEL

#### Event Specification Table:

| # | Event Name | Required Payload | State Transition | Admin KPI Fed |
|---|---|---|---|---|
| 1 | `landing_view` | `{landing_id, utm_source, utm_campaign, device, locale}` | Sets `anonymous` if no user_id | Traffic, CTA Rate denominator |
| 2 | `primary_cta_click` | `{landing_id, cta_variant, target_path}` | — | CTA Rate numerator |
| 3 | `intent_started` | `{landing_id, vertical, form_type}` | — | Intent Rate numerator |
| 4 | `form_submitted` | `{landing_id, vertical, fields: [phone\|email]}` | `anonymous → identified` | Silent Account Rate |
| 5 | `first_service_completed` | `{landing_id, vertical, service_type, amount, currency, booking_id}` | `identified → first_action` | Completion Rate, Revenue |
| 6 | `second_service_started` | `{vertical_new, vertical_original}` | — | Second Action Rate |
| 7 | `second_service_completed` | `{vertical_new, vertical_original, amount}` | `→ multi_vertical` (if diff vertical) | Cross-Vertical Rate, Revenue |
| 8 | `account_confirmed` | `{method: magic_link\|otp}` | — (unlocks features) | — |
| 9 | `session_started` | `{days_since_last, landing_id, referrer}` | `dormant → returning` | Active Users |
| 10 | `inactivity_detected` | `{days_inactive, last_vertical, last_landing}` | `→ dormant` (30d) | Churn Rate |
| 11 | `churn_risk_flagged` | `{days_inactive, total_actions, lifetime_revenue}` | `→ churned` (90d) | Churn Rate |
| 12 | `dd_requested` | `{project_id, landing_id}` | `→ investor_candidate` | — |
| 13 | `push_delivered` | `{template_id, campaign_id, channel}` | — | Campaign performance |
| 14 | `push_opened` | `{template_id, campaign_id}` | — | Campaign engagement |

#### Event → State Transition Map:

```
landing_view (no user_id)           → SET state = anonymous
form_submitted                      → anonymous → identified
first_service_completed             → identified → first_action
session_started (day > 1, < 14d)    → first_action → returning
service_completed (new vertical)    → any_active → multi_vertical
rental + 2 others completed         → any_active → expat_candidate
dd_requested                        → any_active → investor_candidate
30d no events (CRON)                → any_active → dormant
90d no events (CRON)                → dormant → churned
session_started (from dormant)      → dormant → returning
session_started (from churned)      → churned → returning
```

#### Event → Dashboard Usage Map:

| Dashboard Section | Events Used | Aggregation |
|---|---|---|
| Pulse: Traffic | `landing_view` | COUNT per period |
| Pulse: Revenue | `first_service_completed`, `second_service_completed` | SUM(payload.amount) |
| Pulse: Conversion | `landing_view`, `first_service_completed` | Ratio per landing |
| Pulse: Active Users | All events | DISTINCT user_id where state active |
| Funnel Board | `landing_view`, `primary_cta_click`, `intent_started`, `first_service_completed` | COUNT per landing per stage |
| State Map | `mcc_user_states` | GROUP BY state |
| Drop-off Radar | `intent_started`, `first_service_completed` | Gap analysis per landing |
| Revenue Attribution | `first_service_completed` | SUM(amount) per landing, campaign |
| Campaign Performance | `push_delivered`, `push_opened` | Delivery & open rates |

### 2.3 DERIVED USER STATE LOGIC

#### Pseudocode:

```typescript
function deriveUserState(userId: string, event: MCCEvent): string {
  const currentState = getCurrentState(userId);
  const history = getUserEventHistory(userId);
  
  switch (event.event_name) {
    case 'landing_view':
      if (!userId) return 'anonymous';
      break;
      
    case 'form_submitted':
      if (currentState === 'anonymous') {
        return 'identified';
      }
      break;
      
    case 'first_service_completed':
      if (currentState === 'identified') {
        setFirstVertical(userId, event.vertical);
        return 'first_action';
      }
      break;
      
    case 'session_started':
      if (currentState === 'dormant' || currentState === 'churned') {
        return 'returning';
      }
      if (currentState === 'first_action') {
        const daysSinceFirst = getDaysSince(history.firstActionDate);
        if (daysSinceFirst >= 1 && daysSinceFirst <= 14) {
          return 'returning';
        }
      }
      break;
      
    case 'first_service_completed':
    case 'second_service_completed':
      const verticals = getVerticalsUsed(userId);
      if (verticals.length >= 2) {
        if (verticals.includes('rental') && verticals.length >= 3) {
          return 'expat_candidate';
        }
        return 'multi_vertical';
      }
      break;
      
    case 'dd_requested':
      return 'investor_candidate';
  }
  
  return currentState; // no change
}

// CRON job: daily at 03:00 UTC
function checkInactivity() {
  // Users with no events in 30+ days → dormant
  UPDATE mcc_user_states 
  SET state = 'dormant', previous_state = state, transitioned_at = now()
  WHERE state NOT IN ('dormant', 'churned', 'anonymous')
  AND updated_at < now() - INTERVAL '30 days';
  
  // Dormant users with no events in 90+ days → churned
  UPDATE mcc_user_states 
  SET state = 'churned', previous_state = state, transitioned_at = now()
  WHERE state = 'dormant'
  AND updated_at < now() - INTERVAL '90 days';
}
```

#### SQL Implementation (already deployed):

```sql
-- Function: mcc_transition_user_state(user_uuid, new_state, trigger_event)
-- Already created in migration
-- Handles: previous_state recording, transitioned_at update
-- Called by: edge functions processing events
```

---

## PART 3: AI ASSISTANT FOR ADMIN (OPERATOR MODE)

### 3.1 AI INPUTS (Signals Observed)

| # | Signal | Data Source | Query Pattern |
|---|---|---|---|
| 1 | **Landing traffic trend** | `mcc_landing_events` | COUNT per landing, 7d rolling vs prior 7d |
| 2 | **CTA rate change** | `mcc_landing_events` | `cta_click / view` per landing, daily |
| 3 | **Conversion drop** | `mcc_landing_events` | `completed / view` per landing vs 7d avg |
| 4 | **Revenue anomaly** | `bookings` | Daily revenue vs same-DOW 4-week avg |
| 5 | **State stagnation** | `mcc_user_states` | Users stuck in `identified` > 7 days |
| 6 | **Churn spike** | `mcc_user_states` | `dormant` transitions per day vs avg |
| 7 | **A/B test significance** | `mcc_ab_tests` + events | Chi-squared test on conversion per variant |
| 8 | **Campaign ROI decline** | `mcc_campaigns` | CAC trending up or ROAS trending down |
| 9 | **Drop-off hotspot** | `mcc_landing_events` | Largest gap between funnel stages |
| 10 | **Unused budget** | `mcc_campaigns` | Budget utilization < 50% at > 50% of duration |

### 3.2 AI OUTPUTS (Recommendation Templates)

#### Template 1: Pause Landing

```json
{
  "type": "pause_landing",
  "what_happened": "Landing '{landing_id}' CTA rate dropped to {cta_rate}% (was {prev_rate}%). {views} views in last 7 days, only {clicks} clicks.",
  "why_it_matters": "Below 5% CTA rate means traffic is wasted. At current spend of ฿{spend}/day, this burns ฿{waste} weekly with {conversions} conversions.",
  "what_to_do": "Pause landing and investigate. Check: (1) page load speed, (2) hero copy relevance, (3) CTA visibility on mobile.",
  "expected_impact": "Saves ฿{weekly_spend} per week. Redirecting traffic to {best_landing} could yield {projected_conversions} additional conversions.",
  "confidence": 0.85
}
```

#### Template 2: Switch A/B Variant

```json
{
  "type": "apply_ab_winner",
  "what_happened": "A/B test on '{landing_id}' hero: Variant {winner} has {winner_rate}% conversion vs {loser_rate}% ({samples} total samples).",
  "why_it_matters": "Statistical confidence: {confidence}%. Estimated additional {delta_conversions} conversions/week if applied.",
  "what_to_do": "Apply Variant {winner} as default. End test.",
  "expected_impact": "+{delta_conversions} conversions/week, +฿{delta_revenue} estimated revenue.",
  "confidence": 0.92
}
```

#### Template 3: Trigger Campaign for State

```json
{
  "type": "trigger_state_campaign",
  "what_happened": "{count} users in state '{state}' from landing '{source_landing}'. {stagnant_count} have been in this state for {avg_days} days.",
  "why_it_matters": "Users in '{state}' for >{threshold} days have {churn_probability}% probability of becoming dormant. Historical revenue from this segment: ฿{segment_revenue}.",
  "what_to_do": "Send contextual push: '{suggested_template}'. Target: {state} users from {source_landing}, last active {days_range} days ago.",
  "expected_impact": "Based on similar campaigns: {expected_open_rate}% open rate, {expected_reactivation}% reactivation.",
  "confidence": 0.78
}
```

#### Template 4: Investigate Funnel Drop-off

```json
{
  "type": "investigate_dropoff",
  "what_happened": "Landing '{landing_id}': {intent_count} intents started but only {complete_count} completed ({dropoff_pct}% drop-off). This is {vs_avg} vs platform average.",
  "why_it_matters": "Each lost completion = ฿{avg_order_value} lost revenue. Total missed: ฿{missed_revenue} in last 7 days.",
  "what_to_do": "Check: (1) form error logs for this landing, (2) payment step completion rate, (3) mobile vs desktop split. Consider A/B testing a simplified form.",
  "expected_impact": "Reducing drop-off by 10% = +{projected_conversions} conversions/week.",
  "confidence": 0.72
}
```

#### Template 5: Adjust Service Visibility

```json
{
  "type": "adjust_services",
  "what_happened": "{count} users in state '{state}' are seeing {service_type} suggestions, but 0 have clicked in {days} days.",
  "why_it_matters": "Irrelevant suggestions reduce trust and increase churn probability. These users came from '{source_landing}' — they expect {expected_context}.",
  "what_to_do": "Remove '{service_type}' from allowed services for state '{state}'. Replace with '{suggested_service}' which has {click_rate}% CTR in similar contexts.",
  "expected_impact": "Expected CTR improvement: {current_ctr}% → {projected_ctr}%.",
  "confidence": 0.70
}
```

### 3.3 AI SAFETY RULES (GUARDRAILS)

| # | Rule | Implementation |
|---|---|---|
| 1 | **No action without data** | Minimum 50 events AND 7 days of data before any recommendation |
| 2 | **Confidence threshold** | Only surface recommendations with confidence ≥ 0.65 |
| 3 | **No repeated alerts** | Same recommendation type + same target_entity: max 1 per 72h |
| 4 | **No vague language** | Every recommendation must have specific numbers (%, ฿, count) |
| 5 | **Never auto-act** | All recommendations are `status: pending` until admin clicks [Apply] |
| 6 | **Explain reasoning** | Every recommendation has `what_happened` + `why_it_matters` |
| 7 | **Max 5 active recommendations** | Older unacted recommendations auto-expire after 7 days |
| 8 | **Dismiss tracking** | Dismissed recommendations stored with reason for learning |
| 9 | **No contradictions** | Cannot recommend "pause landing" AND "increase budget" for same landing |
| 10 | **Seasonal awareness** | Adjust thresholds for known low-traffic periods (flag, don't alert) |

#### Confidence Calculation:

```
confidence = base_confidence × data_volume_factor × recency_factor

base_confidence:
  - Statistical test passed (p < 0.05): 0.90
  - Clear trend (3+ consecutive data points): 0.80
  - Single anomaly detected: 0.70
  - Pattern match from history: 0.65

data_volume_factor:
  - >500 events: 1.0
  - 100-500 events: 0.9
  - 50-100 events: 0.8
  - <50 events: 0.0 (suppress recommendation)

recency_factor:
  - Data from last 24h: 1.0
  - Data from last 7d: 0.95
  - Data from last 30d: 0.85
```

---

## FINAL VALIDATION

| Check | Status | How |
|---|---|---|
| Admin traces user from ad → landing → revenue | ✅ | `campaign_id → landing_id → user_id → booking.total_amount` via events |
| All actions reversible | ✅ | Toggle back on, switch variant back, unpause campaign |
| No manual analytics | ✅ | All KPIs computed from `mcc_landing_events` + `bookings` |
| Scales to new landings | ✅ | Add row to `mcc_landing_registry`, define events, deploy |
| Anti-spam enforced | ✅ | `mcc_message_log` + frequency checks before any send |
| AI never auto-acts | ✅ | All recommendations require explicit [Apply] click |
| State is derived, never manual | ✅ | `mcc_transition_user_state()` called only by event handlers |
| Single user_id across landings | ✅ | Phone/email dedup at `form_submitted` event |

---

## IMPLEMENTATION PRIORITY

| # | Task | Effort | Impact | Dependencies |
|---|---|---|---|---|
| 1 | Create `mcc_sessions`, `mcc_state_history`, `mcc_message_log`, `mcc_ai_recommendations` tables | 1d | Foundation | None |
| 2 | Build Control Tower Dashboard component (Pulse + Funnel Board + Alerts) | 2d | High | #1 |
| 3 | Build event ingestion edge function (`/mcc-track-event`) | 1d | Critical | #1 |
| 4 | Enhance Landing Control with traffic/conversion/revenue columns | 1d | High | #3 |
| 5 | Build AI Assistant panel with recommendation display | 1d | Medium | #1 |
| 6 | Build AI recommendation engine edge function | 2d | Medium | #3, #5 |
| 7 | Add state transitions over time chart | 0.5d | Medium | #1 |
| 8 | Add revenue per state display | 0.5d | Medium | #1 |
| 9 | Implement message priority + anti-spam in automation | 1d | High | #1 |
| 10 | CRON: daily inactivity checker | 0.5d | Medium | #1 |

---

*This spec is the single source of truth for Admin L1 implementation.*
*Reference tables: mcc_landing_registry, mcc_user_states, mcc_landing_events, mcc_ab_tests, mcc_campaigns, mcc_leads, mcc_automation_rules.*
*New tables needed: mcc_sessions, mcc_state_history, mcc_message_log, mcc_ai_recommendations.*