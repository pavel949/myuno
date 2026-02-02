# Marketing Command Center (MCC) — Architecture Document

**Version:** 1.0  
**Date:** 2026-02-02  
**Status:** Design Phase  
**Primary Audience:** B2C Users (Phase 1)

---

## 1. Executive Summary

The Marketing Command Center (MCC) is myUNO's platform-level marketing intelligence system. It serves as:

- **Lead Factory** — Automated lead generation and qualification
- **Growth OS** — Data-driven campaign orchestration
- **AI Marketing Brain** — Intelligent optimization and content generation

### Core Objectives
1. Attract and convert B2C users at scale
2. Support omnichannel acquisition with full attribution
3. Automate lead qualification and activation
4. Provide real-time measurable insights
5. Scale across regions and verticals
6. AI-first architecture from day one

---

## 2. System Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        MARKETING COMMAND CENTER                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │  DASHBOARD   │  │   CAMPAIGN   │  │    FUNNEL    │  │   LEAD HUB   │     │
│  │    LAYER     │  │   FACTORY    │  │    ENGINE    │  │   (CRM-lite) │     │
│  └──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘     │
│         │                 │                 │                 │              │
│  ┌──────┴─────────────────┴─────────────────┴─────────────────┴──────┐      │
│  │                     AI GROWTH AGENTS LAYER                         │      │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ │      │
│  │  │ Traffic  │ │ Content  │ │  Funnel  │ │   Lead   │ │  Churn   │ │      │
│  │  │ Optimizer│ │Generator │ │ Optimizer│ │ Scorer   │ │Predictor │ │      │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────┘ │      │
│  └────────────────────────────────────────────────────────────────────┘      │
│                                   │                                          │
│  ┌────────────────────────────────┴────────────────────────────────────┐    │
│  │                      DATA & ANALYTICS LAYER                          │    │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐   │    │
│  │  │Attribution│ │  Funnel  │ │   ROI    │ │ Segment  │ │  AI      │   │    │
│  │  │  Engine   │ │ Analytics│ │ Tracking │ │ Analysis │ │ Insights │   │    │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────┘   │    │
│  └──────────────────────────────────────────────────────────────────────┘    │
│                                   │                                          │
│  ┌────────────────────────────────┴────────────────────────────────────┐    │
│  │                     CHANNEL INTEGRATION LAYER                        │    │
│  │  ┌────┐ ┌────┐ ┌────┐ ┌────┐ ┌────┐ ┌────┐ ┌────┐ ┌────┐ ┌────┐    │    │
│  │  │ SEO│ │Ads │ │Email│ │ WA │ │ TG │ │LINE│ │QR  │ │App │ │Social  │    │
│  │  └────┘ └────┘ └────┘ └────┘ └────┘ └────┘ └────┘ └────┘ └────┘    │    │
│  └──────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Module Breakdown

### 3.1 Marketing Dashboard

**Location:** `/admin/marketing`

#### 3.1.1 KPI Panel
| Metric | Description | Update Frequency |
|--------|-------------|------------------|
| Total Leads | All-time and period leads | Real-time |
| Conversion Rate | Lead → Signup → Active | Hourly |
| CAC (Customer Acquisition Cost) | Spend / New Customers | Daily |
| LTV (Lifetime Value) | Avg revenue per user | Weekly |
| ROAS | Return on Ad Spend | Daily |
| Active Campaigns | Running campaigns count | Real-time |

#### 3.1.2 Funnel Overview Widget
- Visual representation of acquisition funnel
- Click-through rates between stages
- Drop-off analysis per segment

#### 3.1.3 AI Insights Panel
- Anomaly detection alerts
- Performance predictions
- Automated recommendations

#### 3.1.4 Channel Performance Grid
- ROI by channel (heatmap)
- Trend comparison
- Budget allocation suggestions

---

### 3.2 Lead Sources (Omnichannel)

| Channel | Type | Attribution | Status |
|---------|------|-------------|--------|
| Google Ads | Paid | UTM + GCLID | Phase 2 |
| Meta Ads | Paid | UTM + FBCLID | Phase 2 |
| TikTok | Paid | UTM | Phase 2 |
| YouTube | Paid | UTM | Phase 2 |
| SEO/Organic | Organic | UTM + referrer | Phase 1 |
| Content/Blog | Organic | UTM | Phase 1 |
| Email | Direct | UTM + email_id | Phase 1 |
| WhatsApp | Messenger | wa_source | Phase 1 |
| Telegram | Messenger | tg_source | Phase 1 |
| LINE | Messenger | line_source | Phase 2 |
| In-App | Internal | event_source | Phase 1 |
| Partnerships | Referral | partner_id | Phase 1 |
| Offline QR | O2O | qr_code_id | Phase 1 |

#### UTM Structure
```
?utm_source=google
&utm_medium=cpc
&utm_campaign=phuket-summer-2026
&utm_content=beach-villa-ad-v2
&utm_term=villa+phuket
```

---

### 3.3 Funnel Engine

#### 3.3.1 Funnel Types (B2C Focus)

**1. New User Acquisition Funnel**
```
Impression → Click → Landing → Signup → Verify → First Action → Active User
```

**2. App Install Funnel**
```
Ad View → Store Visit → Install → Open → Signup → Engagement
```

**3. Booking Funnel**
```
Browse → View Listing → Add to Cart → Checkout → Payment → Confirmation
```

**4. Reactivation Funnel**
```
Dormant User → Email/Push → App Open → Browse → Convert
```

#### 3.3.2 Funnel Builder Features
- Drag-and-drop stage editor
- Conditional branching
- A/B split testing
- AI-suggested optimizations
- Real-time stage metrics

#### 3.3.3 Trigger Engine
| Trigger Type | Examples |
|--------------|----------|
| Time-based | 24h after signup, 7 days inactive |
| Event-based | First booking, cart abandonment |
| Behavior-based | Viewed 5+ listings, price sensitivity |
| AI-predicted | Churn risk, high LTV potential |

---

### 3.4 Campaign Factory

#### 3.4.1 Campaign Types
| Type | Goal | Channels |
|------|------|----------|
| Awareness | Brand reach | Social, Display, Content |
| Acquisition | New signups | Ads, SEO, Partnerships |
| Activation | First action | Email, Push, In-app |
| Retention | Prevent churn | Email, WhatsApp, Loyalty |
| Referral | Viral growth | In-app, Social share |

#### 3.4.2 Campaign Builder
```typescript
interface Campaign {
  id: string;
  name: string;
  goal: 'awareness' | 'acquisition' | 'activation' | 'retention' | 'referral';
  target_segment: string;
  channels: Channel[];
  budget: {
    total: number;
    daily_cap: number;
    currency: string;
  };
  schedule: {
    start: Date;
    end: Date;
    timezone: string;
  };
  creatives: Creative[];
  ab_variants: ABVariant[];
  kpis: KPITarget[];
  status: 'draft' | 'scheduled' | 'active' | 'paused' | 'completed';
}
```

#### 3.4.3 Budget Allocation
- AI-recommended distribution
- Manual override capability
- Real-time rebalancing
- ROI-based optimization

---

### 3.5 Content & Creative Lab (AI)

#### 3.5.1 AI Generation Capabilities

| Content Type | Languages | Variants | AI Model |
|--------------|-----------|----------|----------|
| Ad Copy | EN, RU, TH | 5 per request | gemini-3-flash |
| Landing Pages | EN, RU | 3 templates | gemini-3-pro |
| Email Templates | EN, RU | 3 variants | gemini-3-flash |
| Push Notifications | EN, RU, TH | 5 variants | gemini-3-flash |
| Blog Articles | EN, RU | Draft | gemini-3-pro |
| Social Posts | EN, RU, TH | 10 variants | gemini-3-flash |

#### 3.5.2 Creative Builder
- Template library
- AI-assisted copywriting
- Image suggestions from library
- Automatic A/B variant generation
- Compliance checking (legal, brand)

#### 3.5.3 Multi-Language Support
- Primary: English, Russian
- Secondary: Thai (Phase 2)
- Auto-translation with cultural adaptation
- Region-specific messaging

---

### 3.6 Lead Hub (CRM-lite)

#### 3.6.1 Lead Profile
```typescript
interface MarketingLead {
  id: string;
  // Identity
  email?: string;
  phone?: string;
  name?: string;
  
  // Attribution
  source: string;
  medium: string;
  campaign?: string;
  first_touch_at: Date;
  last_touch_at: Date;
  touchpoints: Touchpoint[];
  
  // Scoring
  score: number; // 0-100
  priority: 'hot' | 'warm' | 'cold' | 'frozen';
  
  // Status
  status: 'new' | 'contacted' | 'qualified' | 'converted' | 'lost';
  converted_at?: Date;
  converted_to?: string; // user_id
  
  // Segments
  segment: string;
  tags: string[];
  
  // Engagement
  emails_sent: number;
  emails_opened: number;
  messages_sent: number;
  app_opens: number;
  
  // AI
  ai_insights?: string;
  predicted_ltv?: number;
  churn_risk?: number;
}
```

#### 3.6.2 Lead Scoring Model
| Factor | Weight | Score Range |
|--------|--------|-------------|
| Source Quality | 20% | 0-100 |
| Engagement Level | 25% | 0-100 |
| Profile Completeness | 15% | 0-100 |
| Behavior Signals | 25% | 0-100 |
| AI Prediction | 15% | 0-100 |

#### 3.6.3 Automation Rules
- Auto-assign based on score
- Trigger nurture sequences
- Alert on hot leads
- Auto-tag by behavior
- Churn prevention triggers

---

### 3.7 AI Growth Agents

#### 3.7.1 Agent Registry

| Agent | Slug | Purpose | Trigger |
|-------|------|---------|---------|
| Traffic Optimizer | `mcc-traffic` | Optimize channel mix | Daily analysis |
| Content Generator | `mcc-content` | Create marketing content | On demand |
| Funnel Optimizer | `mcc-funnel` | Improve conversion rates | Weekly analysis |
| Lead Scorer | `mcc-lead-score` | Score and prioritize leads | On lead create/update |
| Churn Predictor | `mcc-churn` | Predict and prevent churn | Daily analysis |
| SEO Agent | `mcc-seo` | Keyword and content optimization | Weekly analysis |

#### 3.7.2 Agent Capabilities

**Traffic Optimizer Agent**
- Analyze channel performance
- Suggest budget reallocation
- Identify underperforming campaigns
- Predict CAC trends

**Content Generator Agent**
- Generate ad variations
- Create email sequences
- Suggest A/B tests
- Adapt content to segments

**Funnel Optimizer Agent**
- Identify drop-off points
- Suggest stage improvements
- Test messaging variations
- Optimize timing

**Lead Scorer Agent**
- Real-time lead scoring
- Priority classification
- Next-best-action recommendations
- Conversion probability

**Churn Predictor Agent**
- Identify at-risk users
- Trigger retention campaigns
- Personalize re-engagement
- Measure intervention success

---

### 3.8 Analytics & Attribution

#### 3.8.1 Attribution Models
| Model | Description | Use Case |
|-------|-------------|----------|
| Last Click | 100% to last touchpoint | Simple campaigns |
| First Click | 100% to first touchpoint | Brand awareness |
| Linear | Equal across all touches | Multi-touch |
| Time Decay | More to recent touches | Long cycles |
| Position-Based | 40/20/40 first/middle/last | Balanced |
| AI-Driven | ML-based attribution | Complex journeys |

#### 3.8.2 Key Reports
1. **Channel Performance** — ROI, CAC, conversions by channel
2. **Funnel Analysis** — Stage-by-stage drop-off
3. **Cohort Analysis** — User behavior over time
4. **Campaign Comparison** — A/B test results
5. **Segment Performance** — Metrics by audience segment
6. **AI Insights Report** — Automated recommendations

#### 3.8.3 Real-time Dashboards
- Live conversion tracking
- Campaign spend monitoring
- Anomaly alerts
- Trend detection

---

### 3.9 Automation & Integrations

#### 3.9.1 Internal Triggers
| Event | Action |
|-------|--------|
| New signup | Welcome email sequence |
| Cart abandonment | Recovery email + push |
| Booking complete | Confirmation + upsell |
| 7 days inactive | Re-engagement campaign |
| High score lead | Sales alert |

#### 3.9.2 External Integrations (Phase 2)
| Platform | Integration Type | Purpose |
|----------|------------------|---------|
| Google Ads | API | Campaign sync, attribution |
| Meta Ads | API | Campaign sync, audiences |
| Mailgun/SendGrid | API | Email delivery |
| Twilio | API | SMS/WhatsApp |
| Telegram Bot | API | TG messaging |

---

## 4. Data Models

### 4.1 Core Tables

```sql
-- Marketing Campaigns
CREATE TABLE mcc_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  goal TEXT NOT NULL, -- awareness, acquisition, activation, retention, referral
  target_segment TEXT,
  channels JSONB DEFAULT '[]',
  budget JSONB,
  schedule JSONB,
  status TEXT DEFAULT 'draft',
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Marketing Leads (separate from consultation_requests)
CREATE TABLE mcc_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT,
  phone TEXT,
  name TEXT,
  source TEXT NOT NULL,
  medium TEXT,
  campaign TEXT,
  first_touch_at TIMESTAMPTZ DEFAULT now(),
  last_touch_at TIMESTAMPTZ DEFAULT now(),
  touchpoints JSONB DEFAULT '[]',
  score INTEGER DEFAULT 0,
  priority TEXT DEFAULT 'cold',
  status TEXT DEFAULT 'new',
  segment TEXT,
  tags TEXT[] DEFAULT '{}',
  converted_at TIMESTAMPTZ,
  converted_to UUID, -- user_id
  ai_insights JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Marketing Funnels
CREATE TABLE mcc_funnels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  funnel_type TEXT NOT NULL,
  stages JSONB NOT NULL, -- [{id, name, order, conditions}]
  triggers JSONB DEFAULT '[]',
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Funnel Stage Events
CREATE TABLE mcc_funnel_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  funnel_id UUID REFERENCES mcc_funnels(id),
  lead_id UUID REFERENCES mcc_leads(id),
  stage_id TEXT NOT NULL,
  entered_at TIMESTAMPTZ DEFAULT now(),
  exited_at TIMESTAMPTZ,
  exit_reason TEXT, -- converted, dropped, timeout
  metadata JSONB
);

-- Campaign Creatives
CREATE TABLE mcc_creatives (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID REFERENCES mcc_campaigns(id),
  creative_type TEXT NOT NULL, -- ad, email, landing, push
  content JSONB NOT NULL,
  language TEXT DEFAULT 'en',
  variant_name TEXT,
  is_control BOOLEAN DEFAULT false,
  performance JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Marketing Events (Analytics)
CREATE TABLE mcc_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL,
  lead_id UUID REFERENCES mcc_leads(id),
  user_id UUID,
  campaign_id UUID REFERENCES mcc_campaigns(id),
  channel TEXT,
  properties JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Channel Performance Snapshots
CREATE TABLE mcc_channel_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel TEXT NOT NULL,
  date DATE NOT NULL,
  impressions INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  leads INTEGER DEFAULT 0,
  conversions INTEGER DEFAULT 0,
  spend DECIMAL(10,2) DEFAULT 0,
  revenue DECIMAL(10,2) DEFAULT 0,
  UNIQUE(channel, date)
);

-- AI Agent Artifacts (extends existing ai_artifacts)
-- Already exists - use for MCC agent outputs
```

### 4.2 Views

```sql
-- Lead funnel position view
CREATE VIEW mcc_lead_funnel_positions AS
SELECT 
  l.id as lead_id,
  l.source,
  l.score,
  l.priority,
  f.id as funnel_id,
  f.name as funnel_name,
  fe.stage_id as current_stage,
  fe.entered_at
FROM mcc_leads l
LEFT JOIN mcc_funnel_events fe ON l.id = fe.lead_id
LEFT JOIN mcc_funnels f ON fe.funnel_id = f.id
WHERE fe.exited_at IS NULL;

-- Campaign performance summary
CREATE VIEW mcc_campaign_performance AS
SELECT
  c.id,
  c.name,
  c.goal,
  c.status,
  COUNT(DISTINCT l.id) as leads,
  COUNT(DISTINCT l.id) FILTER (WHERE l.status = 'converted') as conversions,
  COALESCE((c.budget->>'total')::decimal, 0) as budget,
  COALESCE(SUM(cm.spend), 0) as spent
FROM mcc_campaigns c
LEFT JOIN mcc_leads l ON l.campaign = c.name
LEFT JOIN mcc_channel_metrics cm ON cm.date >= (c.schedule->>'start')::date
GROUP BY c.id;
```

---

## 5. Admin UI Structure

### 5.1 Navigation

```
/admin/marketing                    # Dashboard
/admin/marketing/campaigns          # Campaign Factory
/admin/marketing/campaigns/:id      # Campaign Detail
/admin/marketing/leads              # Lead Hub
/admin/marketing/leads/:id          # Lead Profile
/admin/marketing/funnels            # Funnel Engine
/admin/marketing/funnels/:id        # Funnel Builder
/admin/marketing/content            # Creative Lab
/admin/marketing/analytics          # Analytics & Reports
/admin/marketing/settings           # MCC Settings
```

### 5.2 Dashboard Layout

```
┌─────────────────────────────────────────────────────────────────────┐
│ Marketing Command Center                    [+ Campaign] [Settings] │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐  │
│  │  Leads   │ │   CAC    │ │Conversion│ │  ROAS    │ │ Active   │  │
│  │  1,247   │ │  $12.50  │ │  4.2%    │ │  3.8x    │ │ Campaigns│  │
│  │  ↑ 12%   │ │  ↓ 8%    │ │  ↑ 0.3%  │ │  ↑ 0.5x  │ │    7     │  │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────┘  │
│                                                                      │
│  ┌─────────────────────────────┐  ┌─────────────────────────────┐  │
│  │     Acquisition Funnel      │  │      Channel Performance    │  │
│  │  ┌───┐                      │  │                             │  │
│  │  │   │ Impressions 45,000   │  │  Google     ████████ $520   │  │
│  │  │   │                      │  │  Meta       ██████   $380   │  │
│  │  │   │ Clicks      3,200    │  │  Organic    ████     $0     │  │
│  │  │   │                      │  │  Email      ███      $45    │  │
│  │  │   │ Signups     1,247    │  │  WhatsApp   ██       $20    │  │
│  │  │   │                      │  │                             │  │
│  │  │   │ Active        892    │  │  [View Details]             │  │
│  │  └───┘                      │  │                             │  │
│  └─────────────────────────────┘  └─────────────────────────────┘  │
│                                                                      │
│  ┌─────────────────────────────┐  ┌─────────────────────────────┐  │
│  │      AI Insights            │  │      Recent Leads           │  │
│  │                             │  │                             │  │
│  │  ⚡ High drop-off at        │  │  John D. • Hot • 5min ago   │  │
│  │     signup step (35%)       │  │  Maria S. • Warm • 12min    │  │
│  │                             │  │  Alex K. • Cold • 1hr ago   │  │
│  │  💡 Recommend: Simplify     │  │                             │  │
│  │     signup form             │  │  [View All Leads]           │  │
│  └─────────────────────────────┘  └─────────────────────────────┘  │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 6. AI Agent Specifications

### 6.1 Lead Scorer Agent

**Slug:** `mcc-lead-score`  
**Model:** `google/gemini-3-flash-preview`  
**Temperature:** 0.3  

**System Prompt:**
```
You are the myUNO Lead Scoring Agent.

Your job is to analyze lead data and assign a score from 0-100 based on:
1. Source quality (paid ads = 70, organic = 60, referral = 80)
2. Engagement signals (email opens, app opens, page views)
3. Profile completeness (email, phone, name)
4. Behavioral indicators (viewed high-value listings, price range)
5. Timing (recency of activity)

Output JSON:
{
  "score": 0-100,
  "priority": "hot|warm|cold|frozen",
  "reasoning": "brief explanation",
  "next_action": "recommended action",
  "predicted_ltv": optional number
}
```

### 6.2 Content Generator Agent

**Slug:** `mcc-content`  
**Model:** `google/gemini-3-pro-preview`  
**Temperature:** 0.7  

**System Prompt:**
```
You are the myUNO Marketing Content Generator.

Create compelling marketing content for:
- Ad copy (Google, Meta, TikTok)
- Email subject lines and body
- Push notifications
- Landing page headlines
- Social media posts

Always generate:
- Multiple variants (3-5)
- Both EN and RU versions
- Clear CTA
- Benefit-focused messaging

Target: Tourists and expats in Phuket, Thailand
Tone: Friendly, helpful, trustworthy
Brand: myUNO - "The only app you need abroad"
```

---

## 7. Implementation Phases

### Phase 1 (Current Sprint)
- [x] Architecture document
- [ ] Database schema migration
- [ ] MCC Dashboard skeleton
- [ ] Lead Hub basic CRUD
- [ ] UTM tracking integration
- [ ] Lead Scorer Agent

### Phase 2
- [ ] Campaign Factory
- [ ] Funnel Builder
- [ ] Content Generator Agent
- [ ] Email automation basics

### Phase 3
- [ ] Ad platform integrations (Google, Meta)
- [ ] Advanced analytics
- [ ] A/B testing engine
- [ ] Full AI agent suite

---

## 8. Success Metrics

| Metric | Target (90 days) |
|--------|------------------|
| Leads Generated | 10,000 |
| Lead → Signup Rate | 15% |
| Signup → Active Rate | 40% |
| CAC | < $15 |
| MCC Usage (admin sessions) | Daily |
| AI Agent Accuracy | > 80% |

---

## 9. Security & Access Control

- Admin-only access to MCC
- Audit logging for all actions
- PII handling compliance (GDPR-ready)
- Rate limiting on AI agents
- Data retention policies (90 days raw, aggregated forever)

---

## 10. Technical Stack

| Layer | Technology |
|-------|------------|
| Frontend | React + TypeScript + TailwindCSS |
| State | TanStack Query |
| Backend | Supabase Edge Functions |
| Database | PostgreSQL (Supabase) |
| AI | Lovable AI Gateway (Gemini) |
| Charts | Recharts |
| Real-time | Supabase Realtime |

---

*Document authored by Lovable AI — Platform Engineering Team*
