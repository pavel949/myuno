

# myUNO Bible v2.0 — Full Gap Closure Plan

## Overview

The Bible envisions 40 micro-apps across 6 clusters. The current app is a monolith with strong B2B (MC/CRM/Admin) but weak B2C consumer flows. This plan closes every gap, ordered by Bible phases.

---

## Phase 1: Beachhead (Weeks 1-8) — Close Revenue Gaps

### 1.1 Fix End-to-End Happy Paths (3 verticals)
**Goal**: Real Stripe payment → WhatsApp confirmation → review request

**Transfers** (`/transport/airport-transfer`):
- Wire up `create-checkout` with `order_type: 'transfer'`
- After Stripe success → trigger `notify-transfer-booking` + WhatsApp confirmation to driver and guest
- Add success page at `/transport/transfer-success` with booking details
- Post-stay: trigger review request via `booking-reminders`

**Yachts** (`/yachts`):
- Verify 50% deposit flow works end-to-end with `create-event-checkout`
- Add WhatsApp notification to captain/provider via `notify-vendor-order`
- Verify `check_yacht_availability` RPC prevents double-booking

**Flowers** (`/flowers`):
- Verify cart → `create-flowers-checkout` → Stripe → delivery confirmation
- Add WhatsApp order notification to flower vendor
- Add delivery tracking status on `/flowers/order/:id`

**Files**: Edge functions already exist. Main work is wiring WhatsApp confirmations and verifying Stripe webhook handles all `order_type` values correctly in `stripe-webhook`.

### 1.2 WhatsApp Cloud API Integration
**Goal**: Transactional WhatsApp messages (not just UltraMSG for CRM drips)

- Create `supabase/functions/_shared/whatsapp-cloud.ts` — shared utility for WhatsApp Cloud API (Meta Business)
- Requires secrets: `WHATSAPP_ACCESS_TOKEN`, `WHATSAPP_PHONE_ID`
- Create `send-booking-whatsapp` edge function: booking confirmation, check-in instructions, review request
- Template messages: transfer confirmation (RU/EN), yacht booking (RU/EN), flower delivery ETA (RU/EN)
- Hook into `stripe-webhook` post-payment flow and `booking-reminders` for follow-ups

### 1.3 Hub Landing Page Redesign
**Goal**: Bible's hub wireframe — 6 cluster cards, not overwhelming app grid

- Redesign `src/pages/Index.tsx` to match Bible wireframe:
  - Hero: "Один аккаунт — весь Пхукет"
  - 6 cluster cards (Приехать / Жить / Легально / Купить / Управлять / Девелоперам)
  - Each card links to cluster category page
  - Featured listings section (newest properties, upcoming events)
  - Testimonial section
- Mobile: bottom nav (Home, Search, Bookings, Profile) per Bible spec

### 1.4 SEO Foundation
**Goal**: Meta tags, JSON-LD, per-vertical landing pages

- Extend existing `SEOHead` component with per-vertical structured data
- Add JSON-LD schemas: `LocalBusiness` for services, `Product` for listings, `Event` for events
- Create SEO-optimized landing pages:
  - `/transfer` — already exists, enhance with SEO meta
  - `/yacht-charter` — new landing page
  - `/flower-delivery` — already exists, enhance
- Add `<link rel="canonical">` to all pages
- Generate `sitemap.xml` via existing `generate-sitemap` edge function — verify it includes all public routes

---

## Phase 2: ARRIVE Cluster — First Day Apps (5 apps)

### 2.1 SIMstart (`/sim`)
- New page: SIM card comparison table (AIS, DTAC, True, eSIM options)
- Data: static JSON or simple DB table `sim_plans` with columns: provider, plan_name, data_gb, price_thb, duration_days, esim_available
- UI: filter by duration, data amount. "Buy Now" links to provider (referral)
- Monetization: referral links with UTM tracking

### 2.2 ExchangeBot (`/exchange`)
- New page: live exchange rates display (THB/RUB, THB/USD, THB/EUR)
- Data source: free API (exchangerate-api.com or similar) via edge function `get-exchange-rates`
- Map of exchangers in Phuket (Google Maps integration already exists)
- Alert feature: "Notify me when RUB/THB reaches X" — store in `exchange_alerts` table

### 2.3 BankPass (`/banking`)
- Page already exists (`src/pages/expat/BankingPage.tsx`)
- Enhance with: comparison table of banks accepting foreigners (Bangkok Bank, Kasikorn, SCB)
- Requirements checklist per bank
- Referral links to bank appointment booking

### 2.4 CarRent Enhancement (`/transport`)
- Transport page exists with vehicles
- Add: daily/weekly rental pricing, insurance options
- Add booking flow using existing `create-checkout` pattern
- Scooter rental category

---

## Phase 3: STAY LEGAL Cluster — 6 Apps (NEW)

### 3.1 VisaTrack (`/visa`)
- Page partially exists (`VisaImmigrationPage.tsx`)
- New features:
  - Visa status tracker: user enters visa type, entry date, expiry date
  - Dashboard showing days remaining, renewal deadlines
  - Document upload for visa copies (Supabase Storage)
  - Push/email reminders at 30/14/7 days before expiry
  - DB: `visa_records` table (user_id, visa_type, entry_date, expiry_date, status, document_url)
- Edge function: `visa-expiry-reminders` — daily cron checking upcoming expirations

### 3.2 DTVready (`/visa/dtv`)
- Sub-page of VisaTrack
- DTV (Digital Nomad) visa requirements checklist
- Document preparation guide (RU/EN)
- "Apply with Partner" CTA → lead creation in CRM

### 3.3 TaxNav (`/tax`)
- New page: tax obligations navigator for foreigners
- Interactive questionnaire: residence status, income sources, duration
- Output: tax obligations summary, filing deadlines
- AI-powered: use Lovable AI (Gemini) to generate personalized tax guidance
- CTA: connect with tax advisor (lead gen)

### 3.4 ContractAI (`/legal/contract-analysis`)
- Edge function `ai-legal-assistant` already exists
- New UI: upload PDF contract → AI analysis → red flags, key terms, risk score
- Support: rental agreements, purchase contracts, service agreements
- Languages: RU/EN analysis
- Uses existing Lovable AI models (Gemini 2.5 Pro for document analysis)

### 3.5 ComplianceTrack (`/legal/compliance`)
- B2B tool for property managers
- Track: Hotel Act license status, fire safety, insurance expiry
- Per-property compliance dashboard in MC workspace
- Alerts for expiring documents
- DB: `compliance_records` table

### 3.6 LeaseBuilder (`/legal/lease-builder`)
- Edge function `legal-document-agent` already exists and generates 12 document types
- New UI: step-by-step lease agreement builder
- Template selection → fill fields → AI generates document
- Output: PDF download
- Support: Thai lease formats, bilingual (TH/EN + RU translation)

---

## Phase 4: LIVE Cluster Enhancements

### 4.1 ElectroCheck — Consumer-Facing (`/utilities`)
- `meter_readings` exists in MC but is B2B only
- New consumer page: enter meter readings, calculate estimated bill
- Payment reminder tracking
- Static utility rates table (PEA electricity, water authority)

### 4.2 PhuketFix (`/services` enhancement)
- Services page exists but lacks booking-to-payment flow
- Add: service request form → provider matching → price quote → Stripe payment
- Categories: plumber, electrician, AC repair, locksmith
- Provider notification via WhatsApp

### 4.3 HealthConnect (`/medical` enhancement)
- Medical page exists (catalog only)
- Add: appointment booking flow
- Clinic availability calendar
- Telemedicine option (video call link)
- Insurance compatibility filter

### 4.4 EatPhuket (`/restaurants` enhancement)
- Restaurant page exists (catalog only)
- Add: table reservation flow using existing `create-restaurant-checkout`
- Menu preview with prices
- Review system integration

### 4.5 EventPass (`/events` enhancement)
- Events page exists with booking flow
- Add: ticket categories (VIP, General, Early Bird)
- Group booking discounts
- Event calendar view with map

### 4.6 PhuketBazaar (`/market` enhancement)
- Market page exists
- Add: vendor-to-buyer messaging
- Delivery tracking
- Seller ratings and reviews

---

## Phase 5: INVEST Cluster Enhancements

### 5.1 PropertySearch → Capital Pipeline
- Property page exists with tabs
- Add: "Request Viewing" button → creates lead in `crm_contacts` with `source: 'property_search'`
- WhatsApp notification to Capital team
- Auto-assign to nearest available agent

### 5.2 InvestCalc Enhancement
- Investment scoring exists in `/invest`
- Add: side-by-side project comparison (up to 3)
- Rental yield calculator with seasonal adjustments
- Capital appreciation projections using `market_data`

### 5.3 MarketBrief (`/market-brief`) — NEW
- Weekly AI-generated market digest
- Data sources: `market_data` table + scraped data from `scrape-phuket-insider`
- Edge function: `generate-market-brief` using Lovable AI
- Output: email newsletter + web page
- Monetization: free summary, paid full report (฿999/month)

### 5.4 DueDiligence AI (`/property/due-diligence`) — NEW
- Upload title deed / Chanote → AI analysis
- Check: encumbrances, ownership history, land type
- Uses Lovable AI (Gemini 2.5 Pro) for document parsing
- Output: risk score + detailed report
- Monetization: ฿5-15K per report

### 5.5 DepositSafe (`/property/deposit-safe`) — NEW
- Escrow tracker for property deposits
- Timeline: deposit paid → contract signed → transfer → completion
- Status updates with Ombudsman oversight branding
- Integration with existing `payments` tracking

### 5.6 FinanceGuide (`/property/finance-guide`) — NEW
- HNWI financial guidance for Thai property
- Content pages: ownership structures (freehold vs leasehold), tax implications
- AI advisor chat using existing `ai-concierge` pattern
- Lead gen → Capital advisory

---

## Phase 6: BUILD & SELL Cluster

### 6.1 Sales Dashboard Enhancement
- `/owner/sales-pipeline` exists
- Add: absorption rate tracking, phase pricing history
- Agent commission tracking per deal
- Developer analytics: views, inquiries, conversion rate

### 6.2 Construction Tracker (`/mc/construction`) — NEW
- Timeline view of construction milestones
- Photo documentation per milestone
- Buyer notification on milestone completion
- DB: `construction_milestones` table

### 6.3 Pricing Intelligence (`/mc/pricing`) — NEW
- Market price monitoring per zone
- Competitor pricing comparison
- AI recommendations for pricing adjustments
- Data from `market_data` table + `ai-pricing-optimizer`

---

## Phase 7: Design System Alignment

### 7.1 Typography
- Add Instrument Sans and IBM Plex Mono fonts per Bible spec
- Update `tailwind.config.ts` with font families
- Use IBM Plex Mono for prices and data displays

### 7.2 Color System — Cluster Accents
- Add cluster accent colors to Tailwind config:
  - ARRIVE: Teal `#0d9488`
  - LIVE: Amber `#d97706`
  - LEGAL: Sky `#0284c7`
  - INVEST: Blue `#1e40af`
  - MANAGE: Violet `#7c3aed`
  - BUILD: Rose `#e11d48`
- Apply cluster colors to respective section headers and navigation

### 7.3 Mobile-First Refinements
- Bottom nav bar: Home, Search, Bookings, Profile (per Bible spec)
- Listing cards: single column stack on mobile, swipeable gallery
- Filters: bottom sheet on mobile (existing pattern, verify consistency)
- Booking flow: full-screen step-by-step on mobile

---

## Phase 8: Infrastructure & Analytics

### 8.1 PostHog Analytics Integration
- Add PostHog SDK for event tracking
- Track: page views, booking funnel steps, conversion rates
- Custom events: `listing_viewed`, `booking_started`, `payment_completed`

### 8.2 Sentry Error Tracking
- Add Sentry SDK for production error monitoring
- Configure source maps upload on build
- Alert on critical errors (payment failures, auth errors)

### 8.3 Database Consolidation (Bible's 18-table vision)
- The `listings` table already exists as a unified table
- Gradually migrate vertical-specific tables into `listings` with `type`/`subtype` columns
- Keep existing tables working during migration (dual-write pattern)
- Target: reduce 100+ tables to ~30 core tables over time

---

## Implementation Priority (Bible Phase 1 alignment)

| Priority | Work Package | Effort | Bible Week |
|----------|-------------|--------|------------|
| P0 | Fix 3 happy paths (Transfer, Yacht, Flowers) | 3-4 days | 1-2 |
| P0 | WhatsApp Cloud API integration | 2 days | 2 |
| P1 | Hub landing page redesign | 2 days | 3 |
| P1 | SEO foundation (meta, JSON-LD, sitemap) | 2 days | 3 |
| P1 | SIMstart page | 1 day | 4 |
| P1 | ExchangeBot page | 1 day | 4 |
| P2 | VisaTrack MVP | 3 days | 5-6 |
| P2 | ContractAI UI | 2 days | 5-6 |
| P2 | PropertySearch → Capital pipeline | 1 day | 6 |
| P2 | Design system alignment (fonts, colors) | 1 day | 6 |
| P3 | TaxNav, DTVready, LeaseBuilder | 4 days | 7-8 |
| P3 | MarketBrief, DueDiligence AI | 3 days | 8-9 |
| P3 | Service booking flow (PhuketFix) | 2 days | 9 |
| P3 | Restaurant reservation flow | 2 days | 9 |
| P4 | DepositSafe, FinanceGuide | 3 days | 10-11 |
| P4 | ComplianceTrack | 2 days | 11 |
| P4 | Construction Tracker, Pricing Intel | 3 days | 12-14 |
| P4 | PostHog + Sentry integration | 1 day | 14 |
| P5 | ElectroCheck consumer, Medical booking | 3 days | 15-16 |
| P5 | Database consolidation (listings unification) | 5 days | 16-18 |

---

## What Already Exists and is Reusable

- **Stripe integration**: 10+ checkout edge functions, webhook handler
- **WhatsApp**: UltraMSG for CRM, `whatsapp-incoming-webhook`, `send-guest-welcome-whatsapp`
- **AI agents**: 15+ edge functions (legal, concierge, pricing, content)
- **CRM**: full pipeline with contacts, deals, sequences, web forms
- **MC workspace**: 50+ pages, team management, calendar, financials
- **Auth**: complete with role-based guards (Admin, Staff, MC)
- **Google Maps**: integrated with `GoogleMapsProvider`
- **SEO components**: `SEOHead` with JSON-LD schemas already built

## What Needs to Be Built From Scratch

- SIMstart, ExchangeBot pages (simple content+utility)
- VisaTrack dashboard (new table + UI + reminders)
- TaxNav questionnaire (new page + AI integration)
- DueDiligence AI UI (edge function exists, needs frontend)
- DepositSafe escrow tracker (new concept)
- MarketBrief newsletter system (new)
- Construction Tracker (new MC module)
- WhatsApp Cloud API shared utility (new, replacing UltraMSG for transactional)

