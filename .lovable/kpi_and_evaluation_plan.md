# KPI and Evaluation Plan — Phase H

**Date**: 2026-01-30  
**Evaluation Period**: 14 days from activation  
**Decision Points**: Day 7 (midpoint review), Day 14 (final decision)

---

## Measurement Framework

### Data Collection

| Source | What | How |
|--------|------|-----|
| `ai_agent_logs` | Invocation count, response time, errors | Automatic |
| `ai_artifacts` | Artifacts created, verdicts, scores | Automatic |
| `ai_artifacts` | Admin actions (acknowledge/dismiss) | Admin workflow |
| `ai_artifacts` | Feedback (thumbs up/down) | Feedback widget |
| Manual tracking | Time-to-moderation before/after | Stopwatch sampling |

---

## Agent 1: `listing-quality-analyzer`

### Primary KPIs

| KPI | Definition | Target | Measurement |
|-----|------------|--------|-------------|
| **Coverage** | % of new listings analyzed before approval | ≥ 80% | `artifacts / submissions` |
| **Catch Rate** | % of low-quality listings flagged (score < 60) that admin rejects | ≥ 70% | Cross-reference actions |
| **False Positive Rate** | % of flagged listings dismissed by admin | < 25% | `dismissed / flagged` |
| **Time Savings** | Reduction in avg moderation time per listing | ≥ 30% | Manual sampling |

### Secondary Metrics

| Metric | Definition |
|--------|------------|
| Avg quality score | Mean score across all analyzed listings |
| Issue distribution | Count by issue type (missing images, bad description, etc.) |
| Admin engagement | % of artifacts with admin action taken |
| Feedback sentiment | Thumbs up vs thumbs down ratio |

### Queries

```sql
-- Coverage
SELECT 
  COUNT(*) FILTER (WHERE artifact_type = 'listing_quality_report') as analyzed,
  COUNT(*) FILTER (WHERE created_at >= '2026-01-30') as new_listings
FROM ai_artifacts a
CROSS JOIN (
  SELECT COUNT(*) FROM yachts WHERE created_at >= '2026-01-30'
  UNION ALL
  SELECT COUNT(*) FROM tours WHERE created_at >= '2026-01-30'
  -- ... other verticals
) listings;

-- False Positive Rate
SELECT 
  COUNT(*) FILTER (WHERE admin_action = 'dismissed') as false_positives,
  COUNT(*) as total_flagged
FROM ai_artifacts
WHERE artifact_type = 'listing_quality_report'
  AND primary_score < 60
  AND is_reviewed = true;
```

### Success Criteria (Day 14)

| Outcome | Criteria | Action |
|---------|----------|--------|
| ✅ **KEEP** | Coverage ≥ 80%, FP rate < 25%, feedback positive | Continue, consider auto-run |
| ⚠️ **ADJUST** | Coverage ≥ 60%, FP rate < 40% | Tune thresholds, improve prompts |
| ❌ **DISABLE** | Coverage < 50% OR FP rate > 50% | Disable, investigate |

---

## Agent 2: `review-quality-scorer`

### Primary KPIs

| KPI | Definition | Target | Measurement |
|-----|------------|--------|-------------|
| **Coverage** | % of new reviews scored | 100% | `scored_reviews / new_reviews` |
| **Suspicious Catch Rate** | % of admin-rejected reviews that were flagged suspicious | ≥ 90% | Cross-reference rejections |
| **False Positive Rate** | % of "suspicious" verdicts overturned by admin | < 15% | `approved / flagged_suspicious` |
| **Time Savings** | Reduction in avg review moderation time | ≥ 40% | Manual sampling |

### Secondary Metrics

| Metric | Definition |
|--------|------------|
| Verdict distribution | Count by verdict (approve/review/suspicious/reject_recommend) |
| Avg authenticity score | Mean authenticity across all reviews |
| Flag frequency | Which flags appear most often |
| Sentiment distribution | Positive/neutral/negative breakdown |

### Queries

```sql
-- Coverage
SELECT 
  COUNT(DISTINCT entity_id) as scored_reviews,
  (SELECT COUNT(*) FROM reviews WHERE created_at >= '2026-01-30') as new_reviews
FROM ai_artifacts
WHERE artifact_type = 'review_quality_score'
  AND created_at >= '2026-01-30';

-- False Positive Rate for Suspicious
SELECT 
  COUNT(*) FILTER (WHERE admin_action = 'dismissed' OR 
    EXISTS (SELECT 1 FROM reviews r WHERE r.id = a.entity_id AND r.is_approved = true)
  ) as false_positives,
  COUNT(*) as total_suspicious
FROM ai_artifacts a
WHERE artifact_type = 'review_quality_score'
  AND verdict IN ('suspicious', 'reject_recommend')
  AND is_reviewed = true;
```

### Success Criteria (Day 14)

| Outcome | Criteria | Action |
|---------|----------|--------|
| ✅ **KEEP** | Coverage = 100%, catch rate ≥ 90%, FP rate < 15% | Continue, consider automation |
| ⚠️ **ADJUST** | Coverage ≥ 80%, catch rate ≥ 70% | Tune prompt, add more flags |
| ❌ **DISABLE** | Catch rate < 50% OR FP rate > 30% | Disable, investigate |

---

## Feedback Collection

### Feedback Widget Spec

```
Location: AI Analysis panel (both agents)
UI Elements:
  - "Was this helpful?" label
  - 👍 button (feedback_rating = 5)
  - 👎 button (feedback_rating = 1)
  - "Tell us why" textarea (optional)
  - Submit → saves to ai_artifacts
```

### Feedback Storage

```sql
UPDATE ai_artifacts SET
  feedback_rating = $1,
  feedback_comment = $2,
  feedback_at = now()
WHERE id = $artifact_id;
```

### Feedback Analysis

```sql
-- Feedback summary
SELECT 
  artifact_type,
  AVG(feedback_rating) as avg_rating,
  COUNT(*) FILTER (WHERE feedback_rating >= 4) as positive,
  COUNT(*) FILTER (WHERE feedback_rating <= 2) as negative,
  COUNT(*) FILTER (WHERE feedback_comment IS NOT NULL) as with_comments
FROM ai_artifacts
WHERE feedback_rating IS NOT NULL
GROUP BY artifact_type;
```

---

## Evaluation Reports

### Day 7: Midpoint Review

Generate report with:
- Coverage rates
- False positive rates
- Admin engagement
- Initial feedback sentiment
- Any errors or issues
- Preliminary recommendation

### Day 14: Final Decision

Generate report with:
- All KPIs vs targets
- Trend analysis (improving/declining)
- Qualitative feedback summary
- Cost estimate (API calls × token usage)
- Final recommendation: KEEP / ADJUST / DISABLE

---

## Monitoring Dashboard

Add to `/admin/ai-agents` page:

### Metrics Panel

```
┌─────────────────────────────────────────┐
│ Listing Quality Analyzer               │
│ ─────────────────────────────────────── │
│ Coverage: 87% ████████░░ ≥80% ✓        │
│ FP Rate:  18% ██░░░░░░░░ <25% ✓        │
│ Feedback: 4.2/5 ⭐⭐⭐⭐☆                │
│ Last 24h: 23 analyses                   │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│ Review Quality Scorer                   │
│ ─────────────────────────────────────── │
│ Coverage: 100% ██████████ =100% ✓      │
│ Catch:    94% █████████░ ≥90% ✓        │
│ FP Rate:  12% █░░░░░░░░░ <15% ✓        │
│ Last 24h: 8 scores                      │
└─────────────────────────────────────────┘
```

---

## Alerting

### Error Thresholds

| Condition | Alert |
|-----------|-------|
| Error rate > 10% in 1 hour | Slack notification to ops |
| Coverage drops below 50% | Email to Pavel |
| FP rate exceeds 50% | Auto-disable feature flag |

### Alert Implementation

- Use `ai_agent_logs` error counts
- Cron job or edge function check hourly
- Notify via existing notification system
