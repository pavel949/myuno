

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

### ✅ Cluster Landing Pages
- ArriveClusterPage (/arrive) — 6 apps: Transfers, SIM, Exchange, Car Rental, Banking, Fast Track
- LegalClusterPage (/stay-legal) — 5 apps: VisaTrack, TaxNav, ContractAI, Insurance, Legal Services
- InvestClusterPage (/invest-hub) — 5 apps: Property Search, Off-Plan, ROI Calculator, Developers, Consultation
- ClusterHub cards now link to dedicated cluster pages

### ✅ VisaTrack MVP (/visa)
- Created visa_records table with RLS (users manage own records)
- Created visa-documents storage bucket with per-user folder RLS
- Built VisaTracker component with add/edit/delete visa records
- Color-coded urgency display (green >30d, amber 14-30d, red <14d)
- Integrated as "Tracker" tab in VisaImmigrationPage
- visa-expiry-reminders edge function for 30/14/7 day email notifications + auto-expire

### ✅ ContractAI (/legal/contract-analysis)
- Upload contract text → AI analysis via ai-agent (Gemini 2.5 Pro)
- Displays: risk score (1-10), summary, red flags, key terms, recommendations
- Bilingual RU/EN output

### ✅ TaxNav (/tax)
- 4-step interactive questionnaire (residency, income sources, stay duration, filing status)
- AI-generated tax obligations summary via ai-agent (Gemini 2.5 Flash)
- "Connect with tax advisor" CTA
- Markdown-rendered results with start-over capability

### ✅ Route & Navigation Cleanup
- Added APP_ROUTES: ARRIVE_CLUSTER, LEGAL_CLUSTER, INVEST_CLUSTER, TAX_NAV, CONTRACT_ANALYSIS
- Registered all new pages in pageRegistry.ts and AnimatedRoutes.tsx
- Updated ROUTE_OWNERSHIP PUBLIC array with new routes

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
