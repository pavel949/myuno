> ARCHIVED: 2026-04-20
> Superseded by: CLAUDE.md, DESIGN.md, current codebase
> Reason: Lovable AI session artifact from Jan-Feb 2026, superseded by implemented code

# Deployment and Rollback Plan — Phase H

**Date**: 2026-01-30  
**Deployment Strategy**: Observe → Limited Enable → Evaluate → Expand  
**Risk Level**: LOW (advisory-only agents)

---

## Pre-Deployment Checklist

### Infrastructure

- [ ] `ai_artifacts` table created and migrated
- [ ] RLS policies active (admin-only)
- [ ] Helper functions deployed (`get_latest_ai_artifact`, `get_ai_artifacts_for_review`)
- [ ] Indexes created for performance

### Agent Configuration

- [ ] `listing-quality-analyzer` entry in `ai_agents` table
- [ ] `review-quality-scorer` entry in `ai_agents` table
- [ ] Knowledge versions created in `ai_agent_knowledge`
- [ ] Knowledge versions published (`is_published = true`)

### Feature Flags

```env
# .env or Supabase secrets
VITE_FEATURE_AI_LISTING_QUALITY=false    # Frontend display
VITE_FEATURE_AI_REVIEW_QUALITY=false     # Frontend display

# Database flags (feature_flags table if exists, or ai_agents.is_active)
AI_LISTING_QUALITY_ENABLED=false
AI_REVIEW_QUALITY_ENABLED=false
```

### Monitoring

- [ ] Logging verified (`ai_agent_logs` receiving entries)
- [ ] Error alerting configured
- [ ] KPI queries tested
- [ ] Admin notification channel ready

---

## Deployment Steps

### Phase 1: Schema & Infrastructure (Day 0)

```bash
# 1. Apply migration
supabase db push ai_artifact_schemas.sql

# 2. Verify table
SELECT * FROM ai_artifacts LIMIT 1;

# 3. Verify RLS
SELECT * FROM pg_policies WHERE tablename = 'ai_artifacts';
```

### Phase 2: Agent 1 — Listing Quality Analyzer (Day 1-3)

#### Day 1: Database Setup

```sql
-- Insert agent
INSERT INTO ai_agents (
  slug, name_en, name_ru, 
  model, temperature, max_tokens,
  target_audience, tone, is_active
) VALUES (
  'listing-quality-analyzer',
  'Listing Quality Analyzer',
  'Анализатор качества листингов',
  'google/gemini-3-flash-preview',
  0.3,
  1500,
  ARRAY['admin'],
  'analytical',
  false  -- Start disabled
);

-- Insert knowledge
INSERT INTO ai_agent_knowledge (
  agent_id, version, system_prompt, knowledge_base, is_published
) VALUES (
  (SELECT id FROM ai_agents WHERE slug = 'listing-quality-analyzer'),
  1,
  'You are a listing quality analyzer for the UNO marketplace platform.
   
   TASK: Analyze the provided listing and generate a quality report.
   
   OUTPUT FORMAT: Return valid JSON matching this schema:
   {
     "overall_score": 0-100,
     "completeness": { field checks },
     "issues": [{ severity, code, message_en, message_ru }],
     "recommendations": [{ action, impact }],
     "ai_confidence": 0.0-1.0
   }
   
   SCORING RULES:
   - Missing images: -20 points
   - Missing description (any language): -15 points
   - No price: -25 points
   - Short title (<10 chars): -10 points
   - No location data: -10 points
   
   Be factual. Do not invent issues.',
  '{{KNOWLEDGE_BASE}}',
  true
);
```

#### Day 2: Frontend Integration

1. Deploy UI components (badge, drawer, batch button)
2. Keep feature flag `VITE_FEATURE_AI_LISTING_QUALITY=false`
3. Test internally with admin accounts

#### Day 3: Limited Rollout

```sql
-- Enable agent
UPDATE ai_agents SET is_active = true 
WHERE slug = 'listing-quality-analyzer';
```

```env
# Enable frontend
VITE_FEATURE_AI_LISTING_QUALITY=true
```

**Scope**: Only pending listings analyzed on-demand (no auto-analysis yet)

---

### Phase 3: Agent 2 — Review Quality Scorer (Day 4-6)

#### Day 4: Database Setup

```sql
-- Insert agent
INSERT INTO ai_agents (
  slug, name_en, name_ru, 
  model, temperature, max_tokens,
  target_audience, tone, is_active
) VALUES (
  'review-quality-scorer',
  'Review Quality Scorer',
  'Оценка качества отзывов',
  'google/gemini-3-flash-preview',
  0.3,
  1200,
  ARRAY['admin'],
  'analytical',
  false
);

-- Insert knowledge
INSERT INTO ai_agent_knowledge (
  agent_id, version, system_prompt, knowledge_base, is_published
) VALUES (
  (SELECT id FROM ai_agents WHERE slug = 'review-quality-scorer'),
  1,
  'You are a review authenticity analyzer for the UNO marketplace platform.
   
   TASK: Analyze the provided review and score its authenticity and quality.
   
   OUTPUT FORMAT: Return valid JSON matching this schema:
   {
     "authenticity_score": 0-100,
     "quality_score": 0-100,
     "sentiment": "positive|neutral|negative|mixed",
     "flags": [{ type, confidence, evidence }],
     "verdict": "approve|review|suspicious|reject_recommend",
     "themes": ["theme1", "theme2"],
     "actionable_feedback": "summary",
     "ai_confidence": 0.0-1.0
   }
   
   RED FLAGS:
   - Generic template language
   - Excessive punctuation/caps
   - Competitor mentions
   - Incentivized signals ("got discount for review")
   - Unrelated content
   - Duplicate patterns
   
   Be factual. Evidence must reference actual text.',
  '{{KNOWLEDGE_BASE}}',
  true
);
```

#### Day 5: Frontend Integration

1. Create `/admin/reviews` page
2. Deploy review queue and detail components
3. Add dashboard widget
4. Keep feature flag `VITE_FEATURE_AI_REVIEW_QUALITY=false`

#### Day 6: Limited Rollout

```sql
-- Enable agent
UPDATE ai_agents SET is_active = true 
WHERE slug = 'review-quality-scorer';
```

```env
VITE_FEATURE_AI_REVIEW_QUALITY=true
```

---

## Rollback Procedures

### Immediate Rollback (< 5 minutes)

**Scenario**: Critical error, wrong outputs, system impact

```sql
-- Disable agent immediately
UPDATE ai_agents SET is_active = false 
WHERE slug = 'listing-quality-analyzer';

-- OR for review scorer
UPDATE ai_agents SET is_active = false 
WHERE slug = 'review-quality-scorer';
```

Frontend will gracefully hide AI features when agent is inactive.

### Feature Flag Rollback (< 1 minute)

```env
# Disable frontend without touching DB
VITE_FEATURE_AI_LISTING_QUALITY=false
VITE_FEATURE_AI_REVIEW_QUALITY=false
```

Redeploy frontend or use runtime config if available.

### Full Rollback (artifacts + agent)

Only if needed after evaluation:

```sql
-- Archive artifacts (don't delete)
UPDATE ai_artifacts SET expires_at = now() 
WHERE agent_slug = 'listing-quality-analyzer';

-- Disable agent
UPDATE ai_agents SET is_active = false 
WHERE slug = 'listing-quality-analyzer';
```

---

## Monitoring Queries

### Health Check (run hourly)

```sql
-- Agent status
SELECT slug, is_active, 
  (SELECT COUNT(*) FROM ai_agent_logs WHERE agent_id = a.id AND created_at > now() - interval '1 hour') as last_hour_calls,
  (SELECT COUNT(*) FROM ai_agent_logs WHERE agent_id = a.id AND created_at > now() - interval '1 hour' AND response_time_ms IS NULL) as errors
FROM ai_agents a
WHERE slug IN ('listing-quality-analyzer', 'review-quality-scorer');
```

### Artifact Creation Rate

```sql
SELECT 
  date_trunc('hour', created_at) as hour,
  artifact_type,
  COUNT(*) as created,
  AVG(primary_score) as avg_score,
  COUNT(*) FILTER (WHERE is_reviewed) as reviewed
FROM ai_artifacts
WHERE created_at > now() - interval '24 hours'
GROUP BY 1, 2
ORDER BY 1 DESC;
```

### Error Log

```sql
SELECT 
  created_at,
  agent_id,
  correlation_id,
  response_time_ms,
  error_code
FROM ai_agent_logs
WHERE error_code IS NOT NULL
  AND created_at > now() - interval '24 hours'
ORDER BY created_at DESC
LIMIT 50;
```

---

## Communication Plan

### Day 0: Pre-Deployment

- Notify Pavel: "Deploying AI quality analysis. Will be invisible until Day 3."

### Day 3: Listing Analyzer Active

- Notify Pavel: "Listing Quality Analyzer is now live in Content Moderation."
- Send usage guide link

### Day 6: Review Scorer Active

- Notify Pavel: "Review Quality Scorer is now live at /admin/reviews."
- Send usage guide link

### Day 7: Midpoint Report

- Send automated KPI report
- Flag any concerns

### Day 14: Final Report

- Send evaluation report
- Recommend: KEEP / ADJUST / DISABLE

---

## Escalation Contacts

| Issue | Contact | Method |
|-------|---------|--------|
| System down | On-call engineer | Slack #ops |
| Wrong AI outputs | AI team lead | Slack #ai-team |
| Business impact | Pavel | Direct message |