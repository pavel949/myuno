# AI Agent Normalization Report
## Alignment with UNO Capability Map

Generated: 2026-01-30
Inputs: UNO System Passport v1.0, uno_capability_map.json, existing_ai_agents_inventory.json

---

## Executive Summary

| Metric | Value |
|--------|-------|
| Total AI Agents | 10 |
| Compliant with AI Boundary Contract | 10 (100%) |
| Money-Touching | 0 |
| Security-Touching | 0 |
| Overlapping | 3 (legacy duplicates) |
| Recommended for Deprecation | 2 |

**Assessment: ALL AGENTS ARE SAFE**

---

## Agent-by-Agent Analysis

### 1. Owner Assistant (DB-Managed)

| Check | Status |
|-------|--------|
| Domain Mapping | property_management, messaging_support |
| Boundary Compliance | ✅ PASS |
| Forbidden Actions | None detected |
| Overlap | ⚠️ OVERLAPS with ai-owner-assistant legacy |

**Classification: KEEP**

**Actions:**
- read: property info, booking data (via context)
- analyze: owner questions
- suggest: UNO services, management tips
- draft: answers to owner questions

**Domains Touched:**
- ✅ Property Management (read-only context)
- ✅ Messaging & Support (draft responses)

---

### 2. Property Search (DB-Managed)

| Check | Status |
|-------|--------|
| Domain Mapping | listings_catalog |
| Boundary Compliance | ✅ PASS |
| Forbidden Actions | None detected |
| Overlap | ⚠️ OVERLAPS with ai-property-assistant legacy |

**Classification: KEEP**

**Actions:**
- read: property market knowledge (static)
- analyze: guest preferences
- suggest: districts, property types
- draft: personalized recommendations

**Domains Touched:**
- ✅ Listings & Catalog (knowledge-based only)

---

### 3. Support Chat (DB-Managed)

| Check | Status |
|-------|--------|
| Domain Mapping | messaging_support |
| Boundary Compliance | ✅ PASS |
| Forbidden Actions | None detected |
| Overlap | ⚠️ OVERLAPS with ai-support-chat legacy |

**Classification: KEEP**

**Actions:**
- analyze: user questions
- suggest: relevant platform sections
- draft: support responses

**Domains Touched:**
- ✅ Messaging & Support (draft only)

---

### 4. Smart Search (DB-Managed)

| Check | Status |
|-------|--------|
| Domain Mapping | listings_catalog, user_lifecycle |
| Boundary Compliance | ✅ PASS |
| Forbidden Actions | None detected |
| Overlap | None |

**Classification: KEEP**

**Actions:**
- analyze: search queries
- classify: question vs keyword search
- suggest: categories, services

**Domains Touched:**
- ✅ Listings & Catalog (category mapping)

---

### 5. AI Translate (Standalone)

| Check | Status |
|-------|--------|
| Domain Mapping | N/A (utility) |
| Boundary Compliance | ✅ PASS |
| Forbidden Actions | None detected |
| Overlap | None |

**Classification: KEEP**

**Actions:**
- analyze: source text
- draft: translations

**Domains Touched:**
- None (pure utility)

---

### 6. AI Generate Description (Standalone)

| Check | Status |
|-------|--------|
| Domain Mapping | listings_catalog |
| Boundary Compliance | ✅ PASS |
| Forbidden Actions | None detected |
| Overlap | None |

**Classification: KEEP**

**Actions:**
- analyze: item metadata
- draft: marketing descriptions

**Domains Touched:**
- ✅ Listings & Catalog (content generation only)

---

### 7. AI Smart Data (Standalone)

| Check | Status |
|-------|--------|
| Domain Mapping | listings_catalog, admin_operations |
| Boundary Compliance | ✅ PASS |
| Forbidden Actions | None detected |
| Overlap | None |

**Classification: KEEP**

**Actions:**
- analyze: images, text, spreadsheets
- classify: field mappings
- extract: structured data

**Domains Touched:**
- ✅ Listings & Catalog (data extraction)
- ✅ Admin Operations (import assistance)

---

### 8. AI Personalize Home (Standalone)

| Check | Status |
|-------|--------|
| Domain Mapping | user_lifecycle |
| Boundary Compliance | ✅ PASS |
| Forbidden Actions | None detected |
| Overlap | None |

**Classification: OBSERVE**

**Note:** Despite name, this is rule-based (no AI model calls). May be renamed or deprecated.

**Actions:**
- classify: user personas
- suggest: category ordering

**Domains Touched:**
- ✅ User Lifecycle (personalization)

---

### 9. Owner Assistant Legacy (Edge Only)

| Check | Status |
|-------|--------|
| Domain Mapping | Same as DB-managed version |
| Boundary Compliance | ✅ PASS |
| Forbidden Actions | None detected |
| Overlap | ⚠️ DUPLICATE of DB-managed |

**Classification: DEPRECATE**

**Reason:** DB-managed version exists with versioned prompts. Legacy has hardcoded prompts that can't be updated without deploy.

**Migration Path:**
1. Update frontend `useOwnerAIChat.ts` to use `ai-agent` with slug `owner-assistant`
2. Remove edge function after verification

---

### 10. Property Assistant Legacy (Edge Only)

| Check | Status |
|-------|--------|
| Domain Mapping | Same as DB-managed version |
| Boundary Compliance | ✅ PASS |
| Forbidden Actions | None detected |
| Overlap | ⚠️ DUPLICATE of DB-managed |

**Classification: DEPRECATE**

**Reason:** DB-managed version exists. Prompts are identical.

**Migration Path:**
1. Update frontend `usePropertyAIChat.ts` to use `ai-agent` with slug `property-search`
2. Remove edge function after verification

---

## Overlap Matrix

| Agent A | Agent B | Type | Resolution |
|---------|---------|------|------------|
| owner-assistant (DB) | ai-owner-assistant | Duplicate | Deprecate legacy |
| property-search (DB) | ai-property-assistant | Duplicate | Deprecate legacy |
| support-chat (DB) | ai-support-chat | Duplicate | Migrate frontend |

---

## Risk Flags

### RF-001: No Active Blockers

All agents pass the AI Boundary Contract:
- ❌ No money movement
- ❌ No ledger writes
- ❌ No security changes
- ❌ No approval status changes
- ❌ No payout processing

### RF-002: Logging Gaps (LOW)

`tokens_used` field always 0. No token tracking implemented.

**Impact:** Cannot measure AI costs per agent.

**Fix:** Extract token count from AI gateway response.

### RF-003: Session Tracking Incomplete (LOW)

`session_id` rarely populated.

**Impact:** Cannot analyze multi-turn conversations.

**Fix:** Generate UUID in frontend, pass to all AI calls.

---

## Recommendations

### Immediate (P0)
1. **No action required** - All agents are safe

### Short-term (P1)
1. Migrate frontend to unified `ai-agent` endpoint
2. Deprecate legacy edge functions (2 functions)
3. Fix token tracking

### Medium-term (P2)
1. Rename `ai-personalize-home` to reflect rule-based nature
2. Add user rating collection
3. Implement A/B prompt testing

---

## Conclusion

**The UNO AI infrastructure is SAFE and WELL-DESIGNED.**

Key strengths:
- Clear separation of concerns
- No money/security touching
- Centralized knowledge management
- Rate limiting in place
- Logging infrastructure exists

Areas for improvement:
- Consolidate legacy duplicates
- Enhance observability (tokens, ratings)
- Document agent responsibilities more explicitly
