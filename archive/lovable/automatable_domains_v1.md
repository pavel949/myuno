> ARCHIVED: 2026-04-20
> Superseded by: CLAUDE.md, DESIGN.md, current codebase
> Reason: Lovable AI session artifact from Jan-Feb 2026, superseded by implemented code

# Automatable Domains v1
## Safe for AI Automation

Generated: 2026-01-30
Source: UNO System Passport v1.0

---

## A. SAFE FOR AI AUTOMATION

### 1. Listings & Catalog Analysis

| Attribute | Value |
|-----------|-------|
| Domain | listings_catalog |
| Tables | `tours`, `yachts`, `restaurants`, `salons`, `clinics`, `gyms`, `vehicles`, `events`, `properties`, `owner_properties`, + 20 more |
| Risk Level | **LOW** |
| Allowed AI Actions | `read`, `analyze`, `classify`, `recommend`, `generate_description`, `flag_quality_issues` |

**Use Cases:**
- Generate SEO descriptions for listings
- Classify listings by category/quality
- Recommend similar listings
- Flag incomplete or low-quality listings
- Analyze pricing patterns

---

### 2. Orders Analysis (Read-Only)

| Attribute | Value |
|-----------|-------|
| Domain | orders_canonical |
| Tables | `orders`, `order_items`, `order_status_history` |
| Risk Level | **LOW** |
| Allowed AI Actions | `read`, `analyze`, `report`, `predict`, `alert` |

**Use Cases:**
- Analyze order patterns
- Predict demand by vertical
- Generate revenue reports
- Alert on anomalies (unusual order patterns)
- Customer behavior analysis

---

### 3. User & Role Analysis

| Attribute | Value |
|-----------|-------|
| Domain | auth_roles |
| Tables | `profiles`, `user_roles`, `orgs`, `org_members` |
| Risk Level | **LOW** |
| Allowed AI Actions | `read`, `analyze`, `segment`, `personalize` |

**Use Cases:**
- User segmentation
- Personalized recommendations
- Churn prediction
- Onboarding flow optimization

---

### 4. Property Management Intelligence

| Attribute | Value |
|-----------|-------|
| Domain | property_management |
| Tables | `owner_properties`, `property_bookings`, `property_financials`, `property_meters` |
| Risk Level | **LOW** |
| Allowed AI Actions | `read`, `analyze`, `forecast`, `suggest_pricing`, `alert` |

**Use Cases:**
- Occupancy forecasting
- Dynamic pricing suggestions
- Maintenance scheduling
- Revenue optimization insights
- Seasonal trend analysis

---

### 5. Messaging & Support Draft

| Attribute | Value |
|-----------|-------|
| Domain | messaging_support |
| Tables | `support_tickets`, `ticket_messages`, `notifications` |
| Risk Level | **MEDIUM** |
| Allowed AI Actions | `read`, `classify`, `draft_response`, `prioritize`, `route` |

**Restrictions:**
- AI drafts ONLY - human must approve send
- No auto-send without explicit user action
- Sentiment analysis for prioritization

**Use Cases:**
- Draft ticket responses
- Classify ticket urgency
- Route to appropriate team
- Summarize conversation history

---

### 6. Reviews & Trust Analysis

| Attribute | Value |
|-----------|-------|
| Domain | reviews_trust |
| Tables | `reviews`, `trust_badges`, `provider_badges` |
| Risk Level | **LOW** |
| Allowed AI Actions | `read`, `analyze`, `summarize`, `flag`, `calculate_score` |

**Use Cases:**
- Sentiment analysis
- Fake review detection
- Provider quality scoring
- Review summarization for listings

---

### 7. Analytics & Metrics

| Attribute | Value |
|-----------|-------|
| Domain | analytics_metrics |
| Tables | `platform_metrics`, `page_views`, `cohort_analytics`, `funnel_analytics` |
| Risk Level | **LOW** |
| Allowed AI Actions | `read`, `analyze`, `report`, `visualize`, `predict` |

**Use Cases:**
- Generate executive dashboards
- Cohort analysis
- Funnel optimization insights
- Predictive analytics

---

### 8. AI Agent Management

| Attribute | Value |
|-----------|-------|
| Domain | ai_infrastructure |
| Tables | `ai_agents`, `ai_agent_knowledge`, `ai_agent_logs` |
| Risk Level | **LOW** |
| Allowed AI Actions | `read`, `log`, `analyze_performance`, `suggest_improvements` |

**Use Cases:**
- Track agent performance
- Analyze conversation quality
- Suggest prompt improvements
- A/B test prompts

---

### 9. Vendor Subscription Status (Read-Only)

| Attribute | Value |
|-----------|-------|
| Domain | vendor_subscriptions |
| Tables | `vendor_subscriptions`, `subscription_plans` |
| Risk Level | **LOW** |
| Allowed AI Actions | `read`, `analyze`, `alert_expiry`, `suggest_upgrade` |

**Use Cases:**
- Subscription status monitoring
- Churn prediction
- Upgrade recommendations
- Renewal reminders

---

### 10. Content Moderation Assist

| Attribute | Value |
|-----------|-------|
| Domain | admin_operations |
| Tables | Listings with `approval_status` |
| Risk Level | **MEDIUM** |
| Allowed AI Actions | `read`, `classify`, `flag`, `suggest_action` |

**Restrictions:**
- AI suggests approval/rejection
- Admin must execute decision
- No auto-approve/reject

**Use Cases:**
- Pre-screen new listings
- Flag policy violations
- Suggest moderation actions
- Quality scoring