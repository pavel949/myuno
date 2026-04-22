

# Plan — Property page polish + Airbnb-style onboarding

Two parallel tracks: (1) finish the 4 property-page improvements from last round; (2) rebuild auth/onboarding to match the Airbnb pattern (phone-first bottom-sheet, OTP, social), adapted to MyUNO.

---

## Track A — Public property page (P3 polish)

**A1. Hero specifics line.** Add a sub-title under property title: `1 queen bed · Shared bathroom · Sleeps 4`. Composes from `bedrooms`, `beds`, `bathrooms`, `max_guests`. Bilingual via taxonomy. File: `src/pages/property/PropertyDetail.tsx` + new `src/components/property/detail/PropertyHeroFacts.tsx`.

**A2. "Guest favorite" 🏆 badge.** Show on PropertyCard + PropertyDetail header when `rating ≥ 4.8 AND reviews_count ≥ 10`. Pure derived flag, no DB change. New `src/components/property/GuestFavoriteBadge.tsx`; consumed in `PropertyCard.tsx`, `PropertyListingCard.tsx`, `PropertyDetail.tsx`.

**A3. Price markers on Similar map.** In `SimilarProperties.tsx` map view: render small pill markers showing total price for the selected dates (or nightly fallback) instead of generic pins. Highlight hovered/active card ↔ marker. No new lib.

**A4. Move pay-now toggle to checkout.** Remove `PaymentStageSelector` / pay-now-vs-arrival toggle from `PropertyBookingCard.tsx`. Pass intent to checkout (`/checkout/property/:id`); render toggle there as the last step before Stripe. Keeps detail page clean per Airbnb pattern.

---

## Track B — Auth & Onboarding (Airbnb-style)

Current state: `src/pages/Auth.tsx` is a 797-line monolith with email + password + signup wizard + role selector. Airbnb's flow is **bottom-sheet, phone-first, OTP, no password by default, social fallback**. We adapt — not copy — keeping email+password as a fallback because MyUNO has admin/MC users who need stable credentials.

### B1. New shell — `AuthSheet`

- Mobile (≤768): full-height bottom sheet with rounded top + grab handle + close `×` (matches Airbnb screen 02-03).
- Desktop: centered modal/card, same content.
- Single component `src/components/auth/AuthSheet.tsx` used by both `/auth` route and any inline "Sign in" trigger across the app (MessageHostButton, Booking CTA, etc.) — replaces today's full-page navigate-to-`/auth` round-trip for in-context logins.

### B2. Step 1 — "Log in or sign up"

- Title: **Log in or sign up** / **Войти или зарегистрироваться**.
- Country picker (default Russia +7, remembers last choice in localStorage) + phone input. Uses `react-phone-number-input` (already a peer of shadcn) or our existing `Phone` lucide + simple regex — pick existing `phoneSchema`.
- Primary CTA "Continue" — disabled until phone valid; gradient button on focus (Airbnb screen 03 pattern, MyUNO mint `#00D68F`).
- Helper line: "We'll text you a code. Standard rates apply." (RU/EN).
- OAuth divider + 4 buttons in canonical Airbnb order: **Email · Apple · Google · Facebook**. Email opens step "Continue with email" (B5). Apple/Google use existing OAuth via `supabase.auth.signInWithOAuth`. Facebook hidden behind `feature_flag:auth_facebook` (off by default).

### B3. Step 2 — SMS OTP

- 6-digit underlined inputs (Airbnb screens 04-05).
- "We sent a code to +7 9XX..." with **Edit** link → back to step 1.
- "Didn't get an SMS? Send again" with 30s cooldown.
- "More options" link → Email fallback.
- Backend: new edge function `auth-phone-otp` (Deno) wrapping `supabase.auth.signInWithOtp({ phone })` and `verifyOtp` — Supabase already supports phone OTP; we just wire it.

### B4. Step 3 — Profile completion (only first time)

After successful OTP, if `profiles.first_name` is null → small follow-up sheet:
- First name (required), last name (optional), birthday (optional, used by Visa/Legal vertical), email (optional but recommended for receipts).
- Persona/role chips deferred to in-app `OnboardingModal` (already exists) — do not block auth.

### B5. Email fallback path

Keeps current email + password flow but condensed into the sheet. Removes the 5-step signup wizard — collapse to 1 screen: email + password + name. Email confirmation handling already fixed in prior round; we just reuse `EmailVerificationBanner`.

### B6. Cleanup

- Delete password-strength wizard step, role-selection wizard step, "Gift" promo block — moved out of auth.
- `AccountTypeSelection.tsx` (218 lines, "Are you a guest, owner, MC, vendor?") — **delete**. Role is derived from actions (becoming an owner = visit `/list-property` → guard prompts upgrade). Matches Airbnb (no role choice at signup).
- `PinLogin` kept (used by returning users with PIN); surfaced as "Use PIN" link inside the sheet when device has a stored refresh token.

### B7. Trust + i18n

- Footer micro-copy: "By continuing, you agree to Terms & Privacy" with links — keep `AuthTrustFooter`.
- Both languages from day 1 (`useLanguage`).
- Telemetry: emit `auth_step_view`, `auth_otp_sent`, `auth_otp_failed`, `auth_completed` to existing analytics hook for funnel measurement.

---

## What MyUNO gains vs today

| Pain today | After |
|---|---|
| Full-page navigation to `/auth` breaks booking context | Bottom-sheet keeps user on property page |
| 797-line component, 5-step wizard | ~300-line sheet, 2 steps for 90% of users |
| Email+password mandatory | Phone OTP default; email fallback for power users |
| Role choice at signup confuses guests | No role choice — derive from action |
| No SMS path → Russian users abandon (no Apple ID, blocked Google) | Phone+SMS works for the actual target audience |
| Password reset flows are dead-ends | OTP → no passwords for 90% of accounts |

---

## Out of scope (future)

- Social proof carousel on the empty Auth screen (Airbnb screen 01 brand splash).
- Magic-link email (we already have OTP via phone; revisit if needed).
- Phone-number portability between accounts (rare; merge tool can come later).

---

## Technical notes

- **No DB migration** for Track A. Track B requires enabling Phone provider in Supabase Auth dashboard + a Twilio/MessageBird SMS provider. Surface as a Cloud setting question; if the user can't enable SMS, we ship Track B with email-only and keep the new sheet UX (phone field hidden behind `feature_flag:auth_phone`).
- New routes: none. `/auth` keeps working but renders `AuthSheet` standalone for direct-link compatibility.
- Files removed: `src/pages/auth/AccountTypeSelection.tsx`, signup-wizard internals inside `Auth.tsx`.
- Files added: `AuthSheet.tsx`, `PhoneStep.tsx`, `OtpStep.tsx`, `EmailFallbackStep.tsx`, `ProfileCompletionStep.tsx`, `useAuthSheet.ts` (global context to open sheet from anywhere), `supabase/functions/auth-phone-otp/index.ts`.
- `MessageHostButton` and booking CTAs switch from `navigate('/auth?...')` to `openAuthSheet({ onSuccess })`.

---

## Order of execution

1. Track A (A1-A4) — small, no blockers, ~1 day.
2. Confirm Phone OTP provider availability (ask user once before starting B2/B3).
3. Track B shell + email path (B1, B5, B6) — works immediately even without SMS.
4. Track B phone path (B2, B3) — when SMS provider confirmed.
5. B4 profile completion + analytics.

