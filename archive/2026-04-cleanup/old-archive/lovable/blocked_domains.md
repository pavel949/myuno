> ARCHIVED: 2026-04-20
> Superseded by: CLAUDE.md, DESIGN.md, current codebase
> Reason: Lovable AI session artifact from Jan-Feb 2026, superseded by implemented code

# Blocked Domains
## Human-Only Operations

Generated: 2026-01-30
Source: UNO System Passport v1.0

---

## B. BLOCKED FOR AI AUTOMATION

### 1. Payment Processing

| Attribute | Value |
|-----------|-------|
| Domain | payments_stripe |
| Reason | **MONEY RISK** |
| Tables | `payment_intents` |
| Edge Functions | `create-order-checkout`, `stripe-webhook` |

**What AI CANNOT Do:**
- Create payment intents
- Modify payment amounts
- Trigger refunds
- Change payment status

**What AI CAN Do:**
- Analyze payment patterns (read-only)
- Alert on anomalies
- Generate payment reports

**Missing to Unblock:**
- Not recommended to unblock
- Payment creation must remain human-initiated

---

### 2. Ledger & Wallet Operations

| Attribute | Value |
|-----------|-------|
| Domain | ledger_wallets |
| Reason | **MONEY RISK / ACCOUNTING INTEGRITY** |
| Tables | `ledger_accounts`, `ledger_entries`, `wallets`, `wallet_transactions` |

**What AI CANNOT Do:**
- Create ledger entries
- Modify balances
- Transfer funds
- Adjust wallet amounts

**What AI CAN Do:**
- Analyze ledger for anomalies (read-only)
- Generate financial reports
- Reconciliation assistance

**Missing to Unblock:**
- Not recommended to unblock
- Double-entry accounting requires human oversight

---

### 3. Vendor Payouts

| Attribute | Value |
|-----------|-------|
| Domain | vendor_payouts |
| Reason | **MONEY RISK / NO AUTOMATED FLOW** |
| Tables | `provider_payout_methods` |
| Current Status | MANUAL |

**What AI CANNOT Do:**
- Initiate payouts
- Approve payout requests
- Modify payout amounts

**What AI CAN Do:**
- Calculate pending payouts (read-only)
- Generate payout reports
- Alert on payout thresholds

**Missing to Unblock:**
- Stripe Connect integration
- Automated payout approval workflow
- Compliance verification system

---

### 4. Refund Processing

| Attribute | Value |
|-----------|-------|
| Domain | refunds |
| Reason | **MONEY RISK / NO SYSTEM EXISTS** |
| Tables | None |
| Current Status | NOT_AVAILABLE |

**What AI CANNOT Do:**
- Process refunds (no system exists)

**What AI CAN Do:**
- Nothing currently

**Missing to Unblock:**
- Refund request table
- Stripe refund integration
- Refund policy engine
- Approval workflow

---

### 5. Security & RLS Configuration

| Attribute | Value |
|-----------|-------|
| Domain | security_rls |
| Reason | **SECURITY RISK** |
| Tables | Supabase auth schema |

**What AI CANNOT Do:**
- Modify RLS policies
- Change auth settings
- Alter security configurations
- Modify user permissions

**What AI CAN Do:**
- Audit RLS coverage (read-only)
- Flag security gaps
- Generate compliance reports

**Missing to Unblock:**
- Not recommended to unblock
- Security changes require human review

---

### 6. Admin Approval Decisions

| Attribute | Value |
|-----------|-------|
| Domain | admin_operations |
| Reason | **BUSINESS RISK / LEGAL** |
| Tables | All tables with `approval_status` |

**What AI CANNOT Do:**
- Approve listings
- Reject listings
- Ban users
- Override moderation decisions

**What AI CAN Do:**
- Suggest approval/rejection
- Pre-screen content
- Flag policy violations
- Prioritize review queue

**Missing to Unblock:**
- AI confidence thresholds
- Appeal workflow
- Human override system
- Audit trail for AI decisions

---

## Summary Table

| Domain | Block Reason | Risk Level | Unblock Priority |
|--------|--------------|------------|------------------|
| Payments | Money Risk | CRITICAL | Never |
| Ledger | Accounting Integrity | CRITICAL | Never |
| Vendor Payouts | Money Risk + No Flow | HIGH | P0 (Stripe Connect) |
| Refunds | No System | HIGH | P1 |
| Security/RLS | Security Risk | CRITICAL | Never |
| Admin Approvals | Legal/Business | MEDIUM | P2 (with guardrails) |