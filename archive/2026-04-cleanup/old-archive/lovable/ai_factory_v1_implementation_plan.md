> ARCHIVED: 2026-04-20
> Superseded by: CLAUDE.md, DESIGN.md, current codebase
> Reason: Lovable AI session artifact from Jan-Feb 2026, superseded by implemented code

# AI Factory v1 Implementation Plan
## Phase F: Safe Extension

---

## Prerequisites

Before creating new agents:
- ✅ Canonical `ai-agent` function operational
- ✅ Observability (correlation_id, logging) in place
- ✅ Feature flags for routing
- ✅ Admin UI for agent management
- ✅ Agent contracts defined

---

## New Agent Candidates (v1)

Based on `canonical_ai_roles.json` uncovered domains:

| Candidate | Domain | Priority | Effort | Value |
|-----------|--------|----------|--------|-------|
| review-analyzer | reviews_trust | P2 | Medium | Fake review detection |
| vendor-advisor | vendor_subscriptions | P2 | High | Upsell, churn prevention |
| order-analyst | orders_canonical | P3 | Medium | Revenue insights |
| analytics-reporter | analytics_metrics | P3 | Medium | Executive dashboards |

---

## Agent 1: review-analyzer (Recommended for v1)

### Purpose
Analyze reviews for quality, sentiment, and potential fraud.

### Scope
- **READ**: `reviews`, `providers`, `profiles`
- **WRITE**: `ai_agent_logs` only
- **OUTPUT**: Structured analysis (not stored, returned to admin)

### Implementation

**Database Entry:**
```sql
INSERT INTO ai_agents (slug, name_en, name_ru, model, temperature, target_audience, tone, is_active)
VALUES (
  'review-analyzer',
  'Review Analyzer',
  'Анализатор отзывов',
  'google/gemini-2.5-flash',
  0.3,  -- Low temperature for consistency
  ARRAY['admin'],
  'analytical',
  true
);
```

**Knowledge Base:**
```markdown
# Review Analyzer

You analyze customer reviews for the UNO platform.

## Tasks
1. Sentiment analysis (positive/negative/neutral)
2. Authenticity assessment (genuine/suspicious/fake)
3. Key theme extraction
4. Actionable feedback identification

## Output Format
Return JSON:
{
  "sentiment": "positive|negative|neutral",
  "sentiment_score": 0.0-1.0,
  "authenticity": "genuine|suspicious|fake",
  "authenticity_confidence": 0.0-1.0,
  "themes": ["theme1", "theme2"],
  "actionable_feedback": "summary of actionable points",
  "flags": ["red_flag_1", "red_flag_2"]
}

## Red Flags to Detect
- Generic/template language
- Unrelated content
- Excessive punctuation/caps
- Competitor mentions
- Incentivized review signals
```

**Frontend Integration:**
- Admin-only feature in content moderation
- Bulk analysis of pending reviews
- Flagged reviews queue

---

## Agent 2: vendor-advisor (Recommended for v1)

### Purpose
Help vendors optimize their UNO presence and subscriptions.

### Scope
- **READ**: `vendor_subscriptions`, `providers`, `orders` (aggregated only)
- **WRITE**: `ai_agent_logs` only
- **OUTPUT**: Conversational advice

### Implementation

**Database Entry:**
```sql
INSERT INTO ai_agents (slug, name_en, name_ru, model, temperature, target_audience, tone, is_active)
VALUES (
  'vendor-advisor',
  'Vendor Advisor',
  'Консультант вендора',
  'google/gemini-3-flash-preview',
  0.7,
  ARRAY['vendor'],
  'consultative',
  true
);
```

**Knowledge Base:**
```markdown
# Vendor Advisor

You are a business advisor for UNO vendors (service providers).

## Your Role
- Help vendors understand their performance
- Recommend actions to increase bookings
- Explain subscription tiers and benefits
- Provide marketing tips

## Subscription Tiers
- Basic: Free listing, limited visibility
- Plus: Featured placement, priority support
- Pro: Top visibility, analytics, premium badge

## You Cannot
- Change subscription status
- Access financial details
- Guarantee specific results
- Provide legal or tax advice
```

**Frontend Integration:**
- Vendor dashboard chat widget
- Contextual tips based on performance metrics

---

## Required Artifacts Table

If agents need to store analysis results persistently:

```sql
-- Generic AI artifacts table
CREATE TABLE ai_artifacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID REFERENCES ai_agents(id),
  artifact_type TEXT NOT NULL,  -- 'review_analysis', 'vendor_insight', etc.
  entity_type TEXT,             -- 'review', 'provider', etc.
  entity_id UUID,               -- Reference to analyzed entity
  data JSONB NOT NULL,          -- Structured output
  correlation_id TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS: Admin only
ALTER TABLE ai_artifacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage artifacts"
ON ai_artifacts
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Index for entity lookups
CREATE INDEX idx_ai_artifacts_entity ON ai_artifacts(entity_type, entity_id);
```

---

## Deployment Checklist

### Before Deployment

- [ ] Agent entry created in `ai_agents`
- [ ] Knowledge version created and published
- [ ] Frontend integration ready
- [ ] Admin can test via editor
- [ ] Logging verified

### During Deployment

- [ ] Deploy frontend changes
- [ ] Monitor first 10 invocations
- [ ] Check error rates

### After Deployment

- [ ] Document in operations guide
- [ ] Train support team
- [ ] Monitor weekly metrics

---

## Rollout Schedule

### Week 1: Review Analyzer
- Day 1: Create agent in DB
- Day 2: Create knowledge base
- Day 3: Admin UI integration
- Day 4-5: Testing
- Day 6-7: Monitor

### Week 2: Vendor Advisor
- Day 1: Create agent in DB
- Day 2: Create knowledge base
- Day 3: Vendor dashboard integration
- Day 4-5: Testing
- Day 6-7: Monitor

### Week 3+: Evaluate
- Collect usage metrics
- Gather feedback
- Plan v2 agents

---

## v2 Agent Candidates (Future)

| Agent | Domain | Complexity | Prerequisite |
|-------|--------|------------|--------------|
| order-analyst | orders | High | Data warehouse |
| analytics-reporter | metrics | High | Scheduled jobs |
| content-moderator | listings | Medium | Moderation queue |
| booking-assistant | bookings | Medium | Real-time data |