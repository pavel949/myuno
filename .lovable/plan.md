

# myUNO Bible v2.0 — Full Gap Closure Plan

## Research: How Top Platforms Do It

| Platform | Pattern | Time-to-First-Listing |
|----------|---------|----------------------|
| **Airbnb** | 3-screen wizard: Type → Location → Photo. Profile filled later. Go live in ~5 min | ~5 min |
| **Grab Merchant** | Phone + OTP → Business Name + Category → Menu item. 2 min to first entry | ~2 min |
| **Glovo Partners** | Name + Category → 1 product with photo + price → Done. Details later via dashboard checklist | ~3 min |
| **Uber Eats** | Express signup: Name → Menu category → 1 dish → live (with "incomplete" badge until verified) | ~4 min |

**Common pattern**: Minimal barrier to first listing (name + category + 1 item), then a dashboard checklist drives progressive completion (photos, hours, bank details, verification docs).

---

## Implementation Progress

### ✅ Phase 1.3: Hub Landing Page
- Added ClusterHub component with 6 Bible cluster cards (ARRIVE/LIVE/LEGAL/INVEST/MANAGE/BUILD)
- Integrated into Index.tsx between QuickActions and content sections

### ✅ Phase 2.1: SIMstart (/sim)
- Built SIMstart page with AIS, DTAC/True, True Move H plan comparison
- Filters by duration and provider
- eSIM badges, price converter, referral links
- Bilingual RU/EN

### ✅ Phase 2.2: ExchangeBot (/exchange)
- Built ExchangeBot page with RUB/USD/EUR/GBP/CNY → THB rates
- Currency converter calculator
- Exchanger directory with ratings, hours, spread %
- Google Maps links for each exchanger
- Bilingual RU/EN

### ✅ Design System: Cluster Accent Colors
- Added 6 cluster HSL tokens to tokens.css (--cluster-arrive through --cluster-build)
- Added `cluster` color group to tailwind.config.ts

### 🔲 Remaining (Next Sessions)

#### P0: Fix Happy Paths
- Wire Transfers end-to-end with Stripe + WhatsApp confirmation
- Verify Yachts 50% deposit flow
- Verify Flowers cart → checkout → delivery

#### P0: WhatsApp Cloud API
- Create _shared/whatsapp-cloud.ts
- Create send-booking-whatsapp edge function
- Hook into stripe-webhook

#### P1: SEO Foundation
- JSON-LD schemas per vertical
- Canonical tags
- Sitemap verification

#### P2: VisaTrack MVP (/visa)
- visa_records table + migration
- Expiry tracker UI
- Document upload
- Reminder cron

#### P2: ContractAI UI
- Upload PDF → AI analysis frontend

#### P3+: Remaining clusters
- TaxNav, DTVready, LeaseBuilder
- MarketBrief, DueDiligence AI
- Service booking flow enhancements
- Restaurant reservation flow
- DepositSafe, FinanceGuide
- ComplianceTrack
- Construction Tracker, Pricing Intel
