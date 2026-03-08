

# Vendor Onboarding UX — Fast First Listing with Progressive Completion

## Research: How Top Platforms Do It

| Platform | Pattern | Time-to-First-Listing |
|----------|---------|----------------------|
| **Airbnb** | 3-screen wizard: Type → Location → Photo. Profile filled later. Go live in ~5 min | ~5 min |
| **Grab Merchant** | Phone + OTP → Business Name + Category → Menu item. 2 min to first entry | ~2 min |
| **Glovo Partners** | Name + Category → 1 product with photo + price → Done. Details later via dashboard checklist | ~3 min |
| **Uber Eats** | Express signup: Name → Menu category → 1 dish → live (with "incomplete" badge until verified) | ~4 min |

**Common pattern**: Minimal barrier to first listing (name + category + 1 item), then a dashboard checklist drives progressive completion (photos, hours, bank details, verification docs).

## Current State Analysis

**What exists:**
- `VendorOnboarding.tsx` — single long form: business name, categories (15 checkboxes), description, phone, email, website, address → creates provider + org + marketplace_vendor. **No first listing created.**
- `VendorOnboardingChecklist.tsx` — dashboard widget with 3 items (profile, first listing, photos). Already follows the progressive pattern but is disconnected from onboarding.
- `UnifiedVendorWizard.tsx` — full 4-step wizard for creating listings. Already works in vendor dashboard.
- `ListingWizard` at `/list-with-us` — 7-step wizard for public listing applications. Separate flow.

**Core problem:** After completing onboarding, vendor lands on empty dashboard. Must discover how to create their first listing separately. **Drop-off point.**

## Proposed UX: "3-Screen Fast Start"

```text
Screen 1: WHO ARE YOU?          Screen 2: YOUR FIRST LISTING       Screen 3: DONE!
┌──────────────────┐           ┌──────────────────┐              ┌──────────────────┐
│ Business Name *  │           │ Service/Product   │              │  ✅ You're Live!  │
│ [____________]   │           │ Name *            │              │                  │
│                  │           │ [____________]    │              │  Your listing is │
│ Category *       │           │                   │              │  pending review  │
│ [🍽 Restaurant▾]│           │ Price *            │              │                  │
│                  │           │ [____] THB        │              │  Complete your   │
│ Phone / WhatsApp │           │                   │              │  profile to get  │
│ [+66 ________]   │           │ Photo (optional)  │              │  verified faster │
│                  │           │ [📷 Upload]       │              │                  │
│         [Next →] │           │                   │              │  [→ Dashboard]   │
└──────────────────┘           │ Brief description │              └──────────────────┘
                               │ [____________]    │
                               │         [List →]  │
                               └──────────────────┘
```

**Required fields total: 4** (business name, category, service name, price)
Everything else: progressive completion via existing `VendorOnboardingChecklist`.

## Implementation Plan

### 1. Refactor VendorOnboarding into 3-step wizard
Replace the current single-form `VendorOnboarding.tsx` with a 3-screen flow:
- **Screen 1 — Business Info**: Business name, primary category (single select, not 15 checkboxes), phone/WhatsApp (one field). Remove: description, email, website, address, Russian name — all deferred to profile settings.
- **Screen 2 — First Listing**: Service/product name, price + currency, optional photo, optional one-line description. Uses existing `vendor_services` table via `useVendorServices.createService`.
- **Screen 3 — Success**: Confirmation with profile completeness score and CTA to dashboard. Shows what to do next (from checklist).

### 2. Update VendorOnboardingChecklist
Expand from 3 to 6 progressive items:
- ✅ Create account (auto-complete)
- ✅ Add first listing (auto-complete from step 2)
- ○ Add business description
- ○ Upload logo / cover photo
- ○ Add working hours
- ○ Add payment details

Each item links to the relevant settings section.

### 3. Wire the data flow
- Screen 1 calls existing `createProfile()` from `useVendorProfile` — but with reduced payload (name + category + phone only)
- Screen 2 calls `createService()` from `useVendorServices` with the newly created provider ID
- No new tables or migrations needed — uses existing `providers`, `vendor_services`, `orgs`, `org_members`

### 4. Update entry points
- `/vendor/onboarding` → renders new 3-step wizard
- `BecomePartnerCTA`, `PartnersPage`, `VendorSection` links remain unchanged (they already point to `/vendor/onboarding`)

### Technical Details
- Reuse existing `OnboardingLayout` component for step progress UI
- Reuse `UnifiedMediaUploader` for photo upload in step 2
- Category select: reuse `availableVerticals` array but render as `Select` dropdown instead of checkbox grid
- No new DB tables or migrations required
- No new Edge Functions required

