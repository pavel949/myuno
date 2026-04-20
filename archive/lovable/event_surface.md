> ARCHIVED: 2026-04-20
> Superseded by: CLAUDE.md, DESIGN.md, current codebase
> Reason: Lovable AI session artifact from Jan-Feb 2026, superseded by implemented code

# Event Surface
## Real Events That Can Trigger AI

Generated: 2026-01-30
Source: UNO System Passport v1.0

---

## Event Inventory

### Order Events

| Event | Source | Reliability | AI Usage |
|-------|--------|-------------|----------|
| `order.created` | UI → Edge Function | HIGH | **observe** - Log and analyze |
| `order.paid` | Stripe Webhook | HIGH | **observe** - Update analytics |
| `order.confirmed` | Admin/System | HIGH | **suggest** - Recommend upsells |
| `order.completed` | Admin/Provider | HIGH | **act** - Trigger review request |
| `order.cancelled` | User/Admin | HIGH | **observe** - Analyze patterns |

**Evidence:**
- `stripe-webhook/index.ts` handles `checkout.session.completed`
- `order_status_history` table tracks all changes
- `send-order-email` triggers on status changes

---

### Property Events

| Event | Source | Reliability | AI Usage |
|-------|--------|-------------|----------|
| `property.submitted` | Owner UI | HIGH | **observe** - Queue for moderation |
| `property.approved` | Admin Action | HIGH | **act** - Notify owner, publish |
| `property.rejected` | Admin Action | HIGH | **suggest** - Improvement tips |
| `property.booking.created` | Guest UI | HIGH | **observe** - Analytics |
| `property.booking.confirmed` | Owner Action | HIGH | **act** - Send confirmation |

**Evidence:**
- `property-moderation-email` edge function
- `AdminContentModeration.tsx` component
- `owner_properties.approval_status` column

---

### Vendor Events

| Event | Source | Reliability | AI Usage |
|-------|--------|-------------|----------|
| `vendor.onboarded` | Vendor UI | HIGH | **observe** - Welcome sequence |
| `vendor.subscription.created` | Stripe Webhook | HIGH | **observe** - Track MRR |
| `vendor.subscription.cancelled` | Stripe Webhook | HIGH | **suggest** - Win-back campaign |
| `vendor.listing.submitted` | Vendor UI | HIGH | **observe** - Moderation queue |
| `vendor.payout.pending` | System Calc | MEDIUM | **observe** - Report only |

**Evidence:**
- `create-vendor-subscription` edge function
- `stripe-webhook` handles subscription events
- `vendor_subscriptions` table

---

### Review Events

| Event | Source | Reliability | AI Usage |
|-------|--------|-------------|----------|
| `review.created` | User UI | HIGH | **analyze** - Sentiment, flag fake |
| `review.flagged` | AI/Admin | MEDIUM | **suggest** - Review action |
| `review.helpful.voted` | User UI | HIGH | **observe** - Quality signal |

**Evidence:**
- `reviews` table with triggers
- `review_helpful` table for votes

---

### Support Events

| Event | Source | Reliability | AI Usage |
|-------|--------|-------------|----------|
| `support_ticket.created` | User UI | HIGH | **act** - Auto-classify, draft response |
| `support_ticket.updated` | Agent Action | HIGH | **observe** - Track resolution |
| `support_ticket.resolved` | Agent Action | HIGH | **observe** - CSAT trigger |

**Evidence:**
- `support_tickets` table
- `ticket_messages` for conversation

---

### User Events

| Event | Source | Reliability | AI Usage |
|-------|--------|-------------|----------|
| `user.signed_up` | Auth System | HIGH | **act** - Personalization, wallet creation |
| `user.role.added` | Role System | HIGH | **observe** - Segment update |
| `user.search.performed` | UI | MEDIUM | **analyze** - Intent mapping |
| `user.favorite.added` | UI | HIGH | **observe** - Recommendation signal |

**Evidence:**
- DB triggers: `handle_new_user_profile`, `handle_new_user_wallet`
- `user_roles` table
- `favorites` table

---

### Notification Events

| Event | Source | Reliability | AI Usage |
|-------|--------|-------------|----------|
| `notification.created` | System/AI | HIGH | **act** - AI can create |
| `notification.read` | User Action | HIGH | **observe** - Engagement metric |

**Evidence:**
- `notifications` table
- Push via `push_subscriptions`

---

### Payment Events

| Event | Source | Reliability | AI Usage |
|-------|--------|-------------|----------|
| `payment.succeeded` | Stripe Webhook | HIGH | **observe** - Revenue tracking |
| `payment.failed` | Stripe Webhook | HIGH | **observe** - Alert admin |
| `wallet.topup` | Stripe Webhook | HIGH | **observe** - Balance update |

**Evidence:**
- `stripe-webhook` handles all payment events
- Idempotency checks in place

---

## Event Reliability Definitions

| Level | Definition |
|-------|------------|
| **HIGH** | System-generated, guaranteed delivery, audit trail exists |
| **MEDIUM** | UI-triggered, may have timing variations, logged |
| **LOW** | External dependency, potential for missing events |

---

## AI Usage Definitions

| Action | Description | Risk Level |
|--------|-------------|------------|
| **observe** | Read event, log, analyze - no side effects | LOW |
| **suggest** | Generate recommendation for human review | LOW |
| **act** | Execute automated action (e.g., send notification) | MEDIUM |
| **blocked** | Event exists but AI cannot respond | N/A |

---

## Implementation Notes

### Current Event Sources

1. **DB Triggers** (most reliable)
   - `handle_new_user_profile()` - on `auth.users` insert
   - `handle_new_user_wallet()` - on `profiles` insert
   - Status change triggers on various tables

2. **Edge Functions** (reliable)
   - `stripe-webhook` - payment events
   - `create-order-checkout` - order creation
   - `property-moderation-email` - moderation events

3. **UI Actions** (reliable but async)
   - Form submissions
   - Button clicks
   - Navigation events

### Recommended Event Pipeline

```
Event Source → DB Table → DB Trigger/Function → Edge Function → AI Agent
```

For AI agents to reliably respond to events:
1. Events should be logged to a table
2. DB trigger should call edge function
3. Edge function should invoke AI agent if needed