# Admin UI Integration Plan — Phase H

**Date**: 2026-01-30  
**Objective**: Embed AI outputs into existing admin workflows without disruption

---

## Design Principles

1. **AI is advisory** — All outputs require human action
2. **Non-intrusive** — Enhance existing pages, don't replace them
3. **Glanceable** — Quick visual indicators for busy admins
4. **Actionable** — Clear next steps from every AI insight

---

## Agent 1: `listing-quality-analyzer`

### Target Page: `/admin/content-moderation`

**Current State**: Admins manually review listings by type and approval status.

**AI Enhancement**:

#### A. Quality Score Badge (per listing row)

```
Location: Listing table row, after status badge
Visual: Circular score indicator
  - 80-100: Green ✓
  - 60-79:  Yellow ⚠
  - 0-59:   Red ⚠
Interaction: Hover → tooltip with top issues
Click: Expand inline panel
```

#### B. Issues Drawer (expandable per listing)

```
Location: Below listing row (accordion style)
Content:
  - Completeness checklist (visual checkmarks)
  - Issues list with severity badges
  - AI recommendations with impact level
  - "Dismiss" and "Request Fixes" buttons
```

#### C. Batch Analysis Button (page header)

```
Location: Content Moderation page header
Label: "🤖 Analyze Quality" / "🤖 Проанализировать качество"
Behavior:
  1. Click → confirm dialog
  2. Analyze all pending listings
  3. Show progress indicator
  4. Refresh table with new scores
```

#### D. Filter by Quality Score

```
Location: Filter bar (alongside type/status filters)
Options:
  - All
  - Needs attention (score < 60)
  - Good quality (score ≥ 80)
```

### Admin Actions

| Action | Meaning | Effect |
|--------|---------|--------|
| Acknowledge | Admin reviewed, issues noted | `is_reviewed = true`, `admin_action = 'acknowledged'` |
| Dismiss | AI assessment incorrect | `is_reviewed = true`, `admin_action = 'dismissed'` |
| Request Fixes | Valid issues, return to vendor | Navigate to rejection flow |

---

## Agent 2: `review-quality-scorer`

### Target Page: `/admin/reviews` (new dedicated page)

**Current State**: No dedicated review moderation page exists.

**New Page Design**:

#### A. Reviews Queue

```
Layout: Card-based list
Each card shows:
  - Review content (truncated)
  - Rating stars
  - AI Verdict badge:
    - "approve" → Green "Auto-approve" 
    - "review" → Yellow "Needs Review"
    - "suspicious" → Orange "Suspicious"
    - "reject_recommend" → Red "Likely Fake"
  - Authenticity score (0-100)
  - Flags (expandable)
```

#### B. Review Detail Panel

```
Location: Right panel (or full page on mobile)
Sections:
  1. Review Content
     - Title, content, pros/cons
     - Visit date, verified purchase badge
  2. AI Analysis
     - Authenticity score gauge
     - Quality score gauge
     - Sentiment badge
     - Themes extracted
     - Flags with evidence
  3. Reviewer Profile
     - Other reviews by this user
     - Account age
  4. Provider Context
     - Provider rating
     - Total reviews
     - Recent review pattern
```

#### C. Quick Actions

```
Location: Top of detail panel
Buttons:
  - ✓ Approve (is_approved = true)
  - ✗ Reject (is_approved = false)
  - ⏭ Skip (move to next)
  - 🚩 Escalate (flag for senior review)
```

#### D. Feedback Loop

```
Location: Bottom of AI Analysis section
Widget:
  - "Was this assessment helpful?"
  - 👍 / 👎 buttons
  - Optional comment field
  - Stored with correlation_id
```

### Dashboard Widget

Add to `/admin` dashboard:

```
Location: Below KPI grid
Widget: "Reviews Pending AI Review"
Content:
  - Count by verdict (approve/review/suspicious/reject_recommend)
  - Link to reviews page
```

---

## Shared UI Components

### 1. AI Insight Badge

```tsx
<AIInsightBadge 
  score={78} 
  verdict="review"
  size="sm" | "md"
/>
```

### 2. AI Analysis Panel

```tsx
<AIAnalysisPanel 
  artifactId={uuid}
  onAcknowledge={() => {}}
  onDismiss={() => {}}
  onFeedback={(rating, comment) => {}}
/>
```

### 3. Batch Analysis Button

```tsx
<BatchAnalysisButton
  entityType="listing" | "review"
  onComplete={(results) => {}}
/>
```

---

## Integration Checklist

### Content Moderation Page

- [ ] Add quality score column to listing table
- [ ] Add issues drawer component
- [ ] Add batch analysis button
- [ ] Add quality filter dropdown
- [ ] Hook up admin actions to ai_artifacts table

### Reviews Page (New)

- [ ] Create `/admin/reviews` route
- [ ] Add to admin navigation
- [ ] Build reviews queue component
- [ ] Build review detail panel
- [ ] Hook up approve/reject actions
- [ ] Add feedback widget

### Dashboard Widget

- [ ] Add "Reviews Pending" widget to AdminDashboard
- [ ] Show verdict distribution
- [ ] Link to reviews page

---

## Accessibility & UX

1. **Keyboard navigation** — All actions accessible via Tab/Enter
2. **Screen reader support** — ARIA labels on badges and scores
3. **Mobile responsive** — Drawer becomes full screen, actions at bottom
4. **Loading states** — Skeleton loaders during AI analysis
5. **Error handling** — Toast notifications for failures

---

## Localization

All labels must support Russian (`isRu`) toggle:

| English | Russian |
|---------|---------|
| Quality Score | Оценка качества |
| Needs Review | Требует проверки |
| Suspicious | Подозрительно |
| Likely Fake | Вероятно фейк |
| Acknowledge | Принять |
| Dismiss | Отклонить |
| Was this helpful? | Было полезно? |
