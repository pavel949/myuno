

# Safe, High-Impact Feature Improvements

Based on a thorough audit of the myUNO codebase, here are features that build on existing infrastructure, use data already available, and carry zero risk of breaking anything.

---

## 1. Wallet Spending Insights Widget

**What it does**: Shows a compact monthly spending breakdown by category (payments, top-ups, cashback earned) directly on the Wallet page -- above the transaction list.

**Why it's safe**: Uses existing `wallet_transactions` data. Pure frontend aggregation, no new tables or edge functions needed.

**What changes**:
- New component: `src/components/wallet/SpendingInsights.tsx` -- groups transactions by type for current month, shows simple bar/donut summary
- Add it to `src/pages/Wallet.tsx` between Quick Actions and Transaction History

---

## 2. Guest Self-Check-In Status Tracker

**What it does**: On the Guest "My Stay" dashboard, show a visual progress stepper: Booked -> Check-in Submitted -> Verified -> Checked In. Currently the check-in page exists but the dashboard doesn't reflect status.

**Why it's safe**: Reads existing `guest_check_in` and `property_bookings` data. No writes, no new tables.

**What changes**:
- New component: `src/components/guest/dashboard/CheckInStatusStepper.tsx`
- Update `src/pages/guest/MyStay.tsx` to render the stepper above the stay card

---

## 3. Proactive Smart Tips -- Expand Coverage

**What it does**: Add 2 new tip categories to `LifecycleSmartTip.tsx`:
- **"family" situation**: school enrollment, pediatrician, family-friendly restaurants
- **"digital_nomad" situation**: coworking spaces, fast internet spots, visa runs

**Why it's safe**: Purely additive -- new entries in the existing `TIPS_BY_SITUATION` map. No logic changes.

**What changes**:
- Edit `src/components/home/LifecycleSmartTip.tsx` to add `family` and `digital_nomad` tip arrays

---

## 4. Offline Emergency Card

**What it does**: A compact "Emergency Info" card cached via existing Service Worker that shows key contacts (police, ambulance, embassy numbers) even when offline. Currently `cacheSOS` exists but there's no pre-rendered emergency card component for offline viewing.

**Why it's safe**: Uses existing SW `CACHE_SOS` mechanism and `useOfflineStatus` hook. Static data, no API calls.

**What changes**:
- New component: `src/components/home/OfflineEmergencyCard.tsx` -- renders hardcoded emergency numbers
- Show it on the SOS page and optionally on the home page when offline is detected

---

## 5. Recent Activity Feed on Home (for logged-out users)

**What it does**: Replace the empty space for non-logged-in users with a "Popular on UNO" section showing top-rated services/experiences from public data. Currently logged-out users see `TodayEventsFeed` + `PropertyTourBanner` only.

**Why it's safe**: Reads from existing public tables (`services`, `experiences`) with no auth required. Additive only.

**What changes**:
- New component: `src/components/home/PopularServicesStrip.tsx`
- Add to `src/pages/Index.tsx` in the non-logged-in branch

---

## Technical Details

| Feature | New Files | Modified Files | DB Changes | Risk |
|---------|-----------|----------------|------------|------|
| Spending Insights | 1 component | Wallet.tsx | None | None |
| Check-in Stepper | 1 component | MyStay.tsx | None | None |
| Smart Tips expansion | 0 | LifecycleSmartTip.tsx | None | None |
| Offline Emergency Card | 1 component | SOS.tsx, Index.tsx | None | None |
| Popular Services Strip | 1 component | Index.tsx | None | None |

All features are purely additive. No existing logic is modified, no database migrations, no edge functions. Each can be implemented and tested independently.

