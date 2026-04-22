> ARCHIVED: 2026-04-20
> Superseded by: project.md (§14 known gaps extracted), docs/DATABASE.md, docs/ENVIRONMENT.md
> Reason: April 2026 snapshot superseded by project.md + targeted canonical docs; PART 7 extracted

# MyUNO — Complete System Snapshot

Factual snapshot of the platform as it exists today. No recommendations or audit — what is here and how it works.

---

## PART 1: TECH STACK & ARCHITECTURE

### Frontend

| Layer | Technology |
|-------|------------|
| Framework | React 18 |
| Language | TypeScript |
| Build | Vite 5 |
| Routing | react-router-dom v6 |
| State | React Context (9+ providers) + TanStack React Query v5 |
| UI | shadcn/ui, Radix UI primitives, Tailwind CSS (semantic tokens), Framer Motion |
| Forms | react-hook-form, @hookform/resolvers, Zod |
| Charts | Recharts |
| PDF/Excel | jspdf, jspdf-autotable, exceljs |
| PWA | vite-plugin-pwa (injectManifest), service worker in `src/sw.ts` |
| Maps | Google Maps (Maps JavaScript API + Places API) via `@react-google-maps/api` |

**Structure:**  
- `src/components/` — UI by domain (admin, vendor, owner, booking, market, property, etc.).  
- `src/pages/` — Route pages; lazy-loaded via `pageRegistry.ts` except Index, Auth, NotFound.  
- `src/hooks/` — 230+ hooks (data, CRUD, vertical-specific).  
- `src/contexts/` — Auth, Cart, Language, Currency, Location, Theme, Maintenance, PWAInstall, LifeSituation, GoogleMaps.  
- `src/lib/` — utils, config, taxonomies, adapters, `verticals.ts` (canonical vertical registry).  
- `src/types/` — auth, orders, property, vendor.  
- `src/integrations/supabase/` — auto-generated client and types (DO NOT EDIT).

### Backend / Database

| Component | Technology |
|-----------|------------|
| Backend | Lovable Cloud (Supabase) |
| Database | PostgreSQL (public schema) |
| API | Supabase REST + Realtime; RLS on most tables |
| Serverless | Supabase Edge Functions (Deno), 60+ functions in `supabase/functions/` |
| Auth | Supabase Auth (email/password, OAuth if configured) |

### Mobile

- **Capacitor** is present (`@capacitor/core`, `@capacitor/android`, `@capacitor/ios`) in `package.json`.  
- No separate native app build scripts in the listed npm scripts; dev/build are Vite-only.  
- **PWA** is the primary “app” surface: standalone display, install banner, offline precache for assets.  
- Install tracking distinguishes `ios` | `android` | `desktop` (e.g. in `usePWATracking.ts`, `InstallBanner.tsx`).

### Deployment

- No custom CI/CD or Docker files found in the described structure.  
- Standard Vite build: `npm run build` → static output; preview via `npm run preview`.  
- Supabase project is referenced by `VITE_SUPABASE_URL` / `VITE_SUPABASE_PROJECT_ID` (e.g. `erfwtoavipwjqmylpizt.supabase.co`).

### Environment Variables

| Variable | Where used | Purpose |
|----------|------------|---------|
| `VITE_SUPABASE_URL` | Client, some edge calls | Supabase project URL |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Client | Supabase anon/public key (RLS applies) |
| `VITE_SUPABASE_PROJECT_ID` | Client (e.g. CRM web forms) | Project identifier |
| `VITE_GOOGLE_MAPS_API_KEY` | Client | Google Maps JS + Places API |
| `VITE_DEMO_MODE` | `lib/config/defaults.ts` | Demo mode flag |
| `VITE_SIMULATION_MODE` | `lib/simulation/simulationMode.ts` | Simulation mode |
| Backend (Edge) | Supabase injects | `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_ANON_KEY` |
| Backend secrets | Edge functions | `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `RESEND_API_KEY`, `FIRECRAWL_API_KEY`, `LOVABLE_API_KEY`, `GOOGLE_API_KEY` (e.g. Drive in extract-images) |

---

## PART 2: DATABASE — FULL DATA MODEL

Tables are in `public` schema. TypeScript types in `src/integrations/supabase/types.ts` (auto-generated). **~100 tables** present in types; grouped below by domain.

### Users & Platform

| Table | Purpose | Key columns / relationships |
|-------|---------|-----------------------------|
| `profiles` | User profiles (extends auth.users) | user_id, display_name, avatar, etc. |
| `user_roles` | Platform roles per user | user_id, role (app_role enum) |
| `user_active_context` | Current role/org for context switching | user_id, active_role, active_org_id, mode, entity_id |
| `user_events` | User behavior / analytics | — |
| `achievement_definitions` | Gamification achievement catalog | code, name_en/ru, bonus_amount, category |
| `admin_audit_logs` | Admin action audit | admin_id, action, entity_type, entity_id, old_data, new_data |

### Orgs & Providers

| Table | Purpose | Key columns / relationships |
|-------|---------|-----------------------------|
| `orgs` | Organizations (vendor, owner, operator, platform) | org_type, name, name_ru, metadata |
| `org_members` | User–org membership | org_id, user_id, role (owner, admin, manager, staff) |
| `providers` | Service provider accounts (legacy + Clean Core link) | user_id, name, business_category, marketplace_vendor_id, approval_status |
| `partner_applications` | Partner signup applications | user_id, business_name, business_category, status, reviewed_by |

### Bookings & Orders

| Table | Purpose | Key columns / relationships |
|-------|---------|-----------------------------|
| `bookings` | Generic booking records | user_id, provider_id, service_id, status, booking_type |
| `booking_addresses` | Addresses for bookings | — |
| `booking_items` | Line items for bookings | — |
| `booking_payments` | Payment records for bookings | — |
| `booking_vouchers` | QR/voucher for bookings | — |
| `booking_operations` | Check-in/out, deposits, cleaning | — |
| `booking_meter_readings` | Utility meter readings | — |
| `booking_inventory_reports` | Inventory condition reports | — |
| `booking_status_history` | Status change audit | — |
| `booking_notifications_log` | Notification delivery log | — |
| `booking_messages` | In-booking chat (realtime) | — |
| `booking_message_rules` | Auto-message rules | — |
| `booking_scheduled_messages` | Scheduled messages | — |
| `booking_participants` | Participants in bookings | — |
| `booking_cross_sell_offers` | Cross-sell offers for bookings | — |
| `property_bookings` | Property rental bookings | (referenced in docs; may live in migrations) |
| `order_payment_stages` | Payment stages for orders | — |
| `orders` | Unified order records | — |
| `cart_items` | Shopping cart (user sync) | — |

### Airport & Transport

| Table | Purpose | Key columns / relationships |
|-------|---------|-----------------------------|
| `airport_bookings` | Airport service bookings | — |
| `airport_booking_addons` | Add-ons for airport bookings | — |
| `airport_passengers` | Passenger details | — |
| `airport_services` | Airport service catalog | — |
| `airport_suppliers` | Airport service suppliers | — |

### Properties & Real Estate

| Table | Purpose | Key columns / relationships |
|-------|---------|-----------------------------|
| `properties` | Property listings | type, district, bedrooms, provider_id, management_company_id, approval_status |
| `property_projects` | Projects/complexes | — |
| `developers` | Property developers | — |
| `cancellation_policies` | Cancellation policy definitions | — |
| `cancellation_policy_rules` | Rules per policy | — |
| `damage_reports` | Damage reports for properties | — |

### Verticals (entity tables per service type)

| Table | Vertical | Key links |
|-------|----------|-----------|
| `restaurants` | Dining | provider_id |
| `salons` | Beauty & Spa | provider_id |
| `clinics` | Healthcare | provider_id |
| `doctors` | Doctors | — |
| `gyms` | Fitness | provider_id |
| `events` | Events | provider_id |
| `event_occurrences` | Event occurrences | — |
| `event_bookings` | Event bookings | — |
| `water_activities` | Water sports | provider_id |
| `tours` | Tours (legacy; experiences used in app) | provider_id |
| `experiences` | Experiences (tours + activities) | provider_id |
| `experience_categories` | Experience taxonomy | — |
| `experience_media` | Media for experiences | experience_id |
| `experience_pricing` | Pricing for experiences | experience_id |
| `education_providers` | Education | provider_id |
| `legal_services` | Legal | provider_id |
| `cleaning_services` | Home cleaning | provider_id |
| `babysitters` | Childcare | provider_id |
| `pet_services` | Pet care | provider_id |
| `flower_shops` | Flower delivery | provider_id |
| `bouquets` | Flower products | — |
| `flower_addons` | Flower order add-ons | — |
| `insurance_providers` | Insurance | provider_id |
| `pharmacies` | Pharmacy | provider_id |
| `vehicles` | Car/bike rental | provider_id |
| `yachts` | Yacht charter | provider_id |

### Marketplace

| Table | Purpose | Key columns / relationships |
|-------|---------|-----------------------------|
| `marketplace_vendors` | Marketplace vendor stores | slug, name_en/ru, approval_status |
| `marketplace_products` | Products | vendor/catalog link, approval_status |
| `marketplace_categories` | Product categories | — |
| `bundle_offers` | Bundle/discount offers | — |
| `stores` | Legacy stores (if still used) | — |
| `products` | Legacy products (if still used) | — |

### CRM (Management Company / Owner)

| Table | Purpose | Key columns / relationships |
|-------|---------|-----------------------------|
| `crm_contacts` | Contacts | company_id (MC), pipelines |
| `crm_companies` | Companies | — |
| `crm_activities` | Activities (calls, emails, etc.) | — |
| `crm_tasks` | Tasks | — |
| `crm_pipelines` | Deal pipelines | — |
| `crm_pipeline_stages` | Stages per pipeline | — |
| `crm_quotes` | Quotes | — |
| `crm_meetings` | Meetings | — |
| `crm_emails` | Email log | — |
| `crm_sequences` | Email/automation sequences | — |
| `crm_sequence_steps` | Steps in sequence | — |
| `crm_sequence_enrollments` | Contact enrollments | — |
| `crm_workflows` | Workflow definitions | — |
| `crm_workflow_actions` | Workflow actions | — |
| `crm_web_forms` | Web forms | — |
| `crm_web_form_submissions` | Form submissions | — |
| `crm_contact_notes` | Notes on contacts | — |
| `crm_documents` | Documents | — |
| `crm_custom_fields` | Custom field definitions | — |
| `crm_custom_field_values` | Custom field values | — |
| `crm_custom_options` | Options for custom fields | — |
| `crm_assignment_rules` | Assignment rules | — |
| `crm_scoring_rules` | Lead scoring rules | — |
| `crm_score_log` | Score history | — |
| `crm_comm_templates` | Communication templates | — |
| `crm_access_log` | CRM access log | — |
| `agent_deals` | Deals (agent/CRM) | — |
| `agent_deal_activities` | Deal activity log | — |
| `deal_pipeline_stages` | Deal stages | — |
| `deal_field_changes` | Deal field change log | — |
| `deal_scheduled_activities` | Scheduled activities for deals | — |

### Management Companies (УК)

| Table | Purpose | Key columns / relationships |
|-------|---------|-----------------------------|
| `management_companies` | Management companies | — |
| `management_company_members` | MC membership (owner/staff) | user_id, company_id, role |
| `owner_service_vendors` | Owner’s vendor directory (поставщики УК) | owner_id, name, category |
| `vendor_documents` | Documents for owner vendors | — |
| `vendor_property_assignments` | Vendor–property assignments | — |
| `financial_categories` | Finance categories per MC | company_id |

### Catalog & Taxonomy

| Table | Purpose | Key columns / relationships |
|-------|---------|-----------------------------|
| `categories` | Global categories | — |
| `category_groups` | Category grouping | — |
| `lookup_values` | Dynamic lookup/taxonomy (referenced in docs) | — |
| `cities` | Cities | — |
| `catalog_facet_definitions` | Facet definitions for catalog | — |
| `catalog_hygiene_log` | Catalog hygiene log | — |
| `catalog_life_map` | Life map (LifeOS) | — |
| `company_category_settings` | Per-company category settings | — |
| `company_storefronts` | Storefronts per company | — |

### AI & Automation

| Table | Purpose | Key columns / relationships |
|-------|---------|-----------------------------|
| `ai_agents` | AI agent configurations | — |
| `ai_agent_knowledge` | Knowledge bases / prompts | — |
| `ai_agent_logs` | Agent usage analytics | — |
| `ai_artifacts` | AI-generated content | — |
| `ai_intake_sessions` | Bulk intake sessions | — |
| `entity_classification_hints` | Classification hints | — |

### Support & Moderation

| Table | Purpose | Key columns / relationships |
|-------|---------|-----------------------------|
| `chat_message_flags` | Chat moderation flags | — |
| `chat_violation_history` | Violation history | — |
| `consultation_requests` | Consultation/lead requests | — |
| `category_suggestions` | User category suggestions | — |
| `disputes` | Disputes | — |
| `document_reminders` | Document reminder scheduling | — |
| `checklist_completions` | Checklist completion tracking | — |

### Finance & Analytics

| Table | Purpose | Key columns / relationships |
|-------|---------|-----------------------------|
| `currencies` | Currency definitions | — |
| `currency_rates` | Exchange rates | — |
| `cohort_metrics` | Cohort metrics | — |
| `cohort_analytics` | Cohort analytics | — |
| `cross_sell_metrics` | Cross-sell metrics | — |
| `analytics_events` | Analytics events | — |
| `cashback_settings` | Cashback configuration | — |

### Other / Config

| Table | Purpose | Key columns / relationships |
|-------|---------|-----------------------------|
| `contact_tags` | Tags for contacts | — |
| `data_provenance` | Data provenance | — |
| `data_quality_issues` | Data quality issues | — |
| `featured_listings` | Featured listing promotions | provider_id, entity_id, entity_type |
| `favorites` | User favorites | user_id, item_id, item_type |
| `calendar_sync_logs` | Calendar sync log | — |

**Note:** Exact row counts are not in the codebase; they would require running queries against the live DB. Many tables use `is_active`, `approval_status`, and soft-delete patterns.

---

## PART 3: FEATURES & MODULES

### Public / End-user

| Module | What it does | Key screens | Intended user |
|--------|----------------|-------------|----------------|
| **Home / Discover** | Landing, catalog, discovery | `/`, `/discover`, `/catalog`, `/map`, `/search` | All |
| **Auth** | Login, signup, password reset, account type | `/auth`, `/auth/forgot-password`, `/auth/reset-password`, `/auth/account-type` | Guest → User |
| **Profile & Account** | Profile, settings, notifications, referral | `/profile`, `/profile/edit`, `/profile/settings`, `/account`, `/profile/referral`, `/profile/notifications` | User |
| **Bookings & Orders** | List bookings, detail, order tracking | `/bookings`, `/bookings/:id`, `/orders/:id/tracking`, `/booking/advance-requested` | User |
| **Favorites, Cart, Wallet** | Favorites, cart, wallet, cards, transaction history | `/favorites`, `/cart`, `/wallet`, `/wallet/history`, `/wallet/cards` | User |
| **Support & SOS** | Support tickets, SOS, VIP concierge | `/support`, `/support/new-ticket`, `/support/tickets`, `/sos`, `/vip-concierge` | User |
| **Messages & Trips** | Messages, trip detail, history | `/messages`, `/trip/:id`, `/history` | User |
| **Property Hub** | Search, map, projects, offplan, developers, invest, my property, detail, inquiry | `/property`, `/property/search`, `/property/map`, `/property/project/:id`, `/property/offplan`, `/property/developers`, `/property/invest`, `/property/my`, `/property/:id`, `/property/:id/inquiry`, `/company/:slug` | User |
| **Restaurants** | List, map, detail, reserve, delivery, set menu | `/restaurants`, `/restaurants/map`, `/restaurants/:id`, `/restaurants/:id/reserve`, `/restaurants/:id/delivery`, `/restaurants/:id/experience/:setId` | User |
| **Transport** | Vehicles, airport transfer, taxi, fast-track, rental landing | `/transport`, `/transport/vehicle/:id`, `/transport/booking/:id`, `/transport/airport-transfer`, `/transport/taxi`, `/transport/fast-track`, `/transfer`, `/flower-delivery`, `/rent-phuket` | User |
| **Beauty & Spa** | List, salon detail, booking, services, map | `/beauty`, `/beauty/salon/:id`, `/beauty/booking/:id`, `/beauty/services`, `/beauty/map` | User |
| **Fitness** | List, gym detail, booking | `/fitness`, `/fitness/gym/:id`, `/fitness/booking/:id` | User |
| **Medical** | List, clinic detail, appointment | `/medical`, `/medical/clinic/:id`, `/medical/appointment/:id` | User |
| **Events** | List, detail, booking, venues | `/events`, `/events/:id`, `/events/booking/:id`, `/venues/:id` | User |
| **Education** | List, course/tutor detail, booking | `/education`, `/education/course/:id`, `/education/tutor/:id`, `/education/booking/:id` | User |
| **Flowers** | List, bouquet/shop detail, order, success | `/flowers`, `/flowers/bouquet/:id`, `/flowers/shop/:id`, `/flowers/order`, `/flowers/success` | User |
| **Home Services** | List, provider detail, booking, map, order | `/services`, `/services/provider/:id`, `/services/booking/:id`, `/services/map`, `/services/order/:functionId` | User |
| **Legal** | List, provider/visa detail, booking | `/legal`, `/legal/provider/:id`, `/legal/visa/:id`, `/legal/booking/:id`, `/visa` | User |
| **Insurance** | List, travel, plan detail, quote | `/insurance`, `/insurance/travel`, `/insurance/plan/:planId`, `/insurance/:id`, `/insurance/:id/quote` | User |
| **Experiences** | List, detail, book (tours/water under same UX) | `/experiences`, `/experiences/:id`, `/experiences/:id/book` | User |
| **Pharmacy, Pets, Cleaning, Babysitter** | Index, detail, booking where applicable | `/pharmacy`, `/pets`, `/cleaning`, `/babysitter` + detail/booking routes | User |
| **Market** | Catalog, category, product, vendor, wishlist, checkout, sell | `/market`, `/market/category/:categoryId`, `/market/product/:productId`, `/market/vendor/:slug`, `/market/wishlist`, `/market/checkout`, `/sell` | User |
| **Classifieds** | List, sell, detail | `/classifieds`, `/classifieds/sell`, `/classifieds/:id` | User |
| **LifeOS** | Life flow, trip planner, list with us | `/life-flow/:code`, `/trip-planner`, `/list-with-us` | User |
| **Info & Legal** | About, FAQ, partners, privacy, terms, contact, cookies, refund, dispute, guide | `/about`, `/faq`, `/partners`, `/privacy`, `/terms`, `/contact`, `/cookies`, `/refund-policy`, `/dispute-resolution`, `/guide/:token` | All |
| **Storefront** | Public storefront by slug | `/b/:slug` | All |
| **Referral** | Referral landing | `/ref/:code` | All |
| **Install** | PWA install prompt | `/install` | All |

### Guest (authenticated, booking context)

| Module | What it does | Key screens | Intended user |
|--------|----------------|-------------|----------------|
| **My Stay** | Current stay overview | `/my-stay` | Guest |
| **Check-in / Guidebook** | Check-in flow, guidebook | `/guest/check-in/:bookingId`, `/guest/guidebook/:propertyId` | Guest |

### Vendor (provider / supplier)

| Module | What it does | Key screens | Intended user |
|--------|----------------|-------------|----------------|
| **Vendor onboarding** | First-time vendor signup | `/vendor/onboarding`, `/provider/onboarding` | Prospective vendor |
| **Vendor dashboard** | Dashboard, bookings, services, analytics, payouts, subscription, settings | `/vendor`, `/vendor/bookings`, `/vendor/services`, `/vendor/analytics`, `/vendor/payouts`, `/vendor/subscription`, `/vendor/settings` | Vendor |
| **Vendor verticals** | Properties, experiences, yachts, transport, beauty, fitness, clinics, restaurants, events, education, legal, pets, cleaning, babysitters, flowers, locations, products, orders, messages | `/vendor/properties`, `/vendor/experiences`, `/vendor/yachts`, `/vendor/transport`, etc. | Vendor |

Access: `VendorGuard` (role `vendor` or `admin`); fallback `/vendor/onboarding`.

### MC (Management Company / Owner)

| Module | What it does | Key screens | Intended user |
|--------|----------------|-------------|----------------|
| **MC onboarding** | First-time MC setup | `/mc/onboarding` | Prospective MC |
| **MC dashboard** | Dashboard, modules, properties, calendar, operations, finance, staff, sales, contacts, CRM, vendors, inventory, documents, marketing, vault, rates, reviews, insurance, owners, portfolio, guide, setup, service request, inspection, full management | `/mc`, `/mc/modules`, `/mc/properties`, `/mc/calendar`, `/mc/operations`, `/mc/finance`, `/mc/staff`, `/mc/sales`, `/mc/contacts`, `/mc/crm-dashboard`, `/mc/vendors`, `/mc/inventory`, `/mc/documents`, `/mc/marketing`, `/mc/vault`, `/mc/rates`, `/mc/reviews-management`, `/mc/insurance`, `/mc/owners`, `/mc/portfolio`, `/mc/guide`, `/mc/setup`, `/mc/service-request`, `/mc/inspection`, `/mc/full-management`, plus settings, help, subscription | MC (owner/staff) |

Access: `MCGuard` (membership in `management_company_members` or equivalent); layout `MCLayout` with `ActiveCompanyProvider`.

### Owner portal (read-only property owner)

| Module | What it does | Key screens | Intended user |
|--------|----------------|-------------|----------------|
| **My property** | Owner view of own property | `/my-property`, `/my-property/:propertyId` | Property owner |

### Admin

| Module | What it does | Key screens | Intended user |
|--------|----------------|-------------|----------------|
| **Admin dashboard** | Overview, control center | `/admin`, `/admin/control` | Admin |
| **Users & access** | User/role management | `/admin/users` | Admin |
| **Catalog** | Unified catalog, trash | `/admin/catalog`, `/admin/trash` | Admin |
| **Vendor content** | Create content on behalf of vendors | `/admin/vendor-content` | Admin |
| **Providers & services** | Providers, provider detail, services | `/admin/providers`, `/admin/providers/:id`, `/admin/services` | Admin |
| **Partner applications** | Review/approve partner applications | `/admin/partner-applications` | Admin |
| **Operations** | Moderation, leads (redirects) | `/admin/operations` | Admin |
| **Verticals** | Yachts, activities, properties, projects, investments, developers, PM companies, contracts, restaurants, salons, clinics, gyms, vehicles, events, education, legal, pets, cleaning, babysitters, flowers, pharmacies, stores, insurance, water activities, experiences | `/admin/yachts`, `/admin/activities`, `/admin/properties`, … | Admin |
| **Consultations, tickets** | Consultations, support tickets | `/admin/consultations`, `/admin/tickets`, `/admin/tickets/:ticketId` | Admin |
| **Finance, disputes** | Finance, disputes | `/admin/finance`, `/admin/disputes` | Admin |
| **Settings & config** | System settings, cities, translations, location knowledge, lookups, taxonomy | `/admin/settings`, `/admin/cities`, `/admin/translations`, `/admin/location-knowledge`, `/admin/lookups`, `/admin/taxonomy` | Admin |
| **Intake & leads** | Intake, intake configs, lead configs, vendor prospects | `/admin/intake`, `/admin/intake-configs`, `/admin/lead-configs`, `/admin/vendor-prospects` | Admin |
| **CRM, marketing** | CRM, marketing dashboard | `/admin/crm`, `/admin/marketing` | Admin |
| **LifeOS, legal, QA** | Life situations, legal documents, QA test runner | `/admin/life-situations`, `/admin/legal-documents`, `/admin/qa-test-runner` | Admin |
| **AI** | AI agents, AI ops | `/admin/ai-agents`, `/admin/ai-agents/:id`, `/admin/ai-ops` | Admin |
| **Data import** | Data import | `/admin/data-import` | Admin |
| **Acquisition & investor** | Acquisition metrics, investor metrics | `/admin/acquisition-metrics`, `/admin/investor-metrics` | Admin |

Access: `AdminGuard` (role `admin`).

### Staff

| Module | What it does | Key screens | Intended user |
|--------|----------------|-------------|----------------|
| **Staff dashboard** | Staff home | `/staff` | Staff |

Access: `StaffGuard`.

### Team (UNO Team)

| Module | What it does | Key screens | Intended user |
|--------|----------------|-------------|----------------|
| **Team dashboard** | Dashboard, content, chat, leaderboard, profile, inbox, support, leads, moderation | `/team`, `/team/content`, `/team/chat`, `/team/leaderboard`, `/team/my-profile`, `/team/inbox`, `/team/support`, `/team/leads`, `/team/moderation` | UNO Team |

Access: `TeamGuard` (role `uno_team` or `admin`).

**Implementation status:** Most modules have full UI and hooks; some admin or niche verticals may be partial or UI-only. No explicit “broken” flag in code; status would require manual testing per screen.

---

## PART 4: INTEGRATIONS

| Service | Use | Method | Status (from code) |
|---------|-----|--------|--------------------|
| **Supabase** | Auth, DB, Realtime, Storage, Edge Functions | Client SDK + Edge env (URL, anon key, service role) | Active |
| **Google Maps** | Maps, Places (address, rating, photo), geocoding, static maps | `@react-google-maps/api`, Maps JavaScript API + Places API, key in `VITE_GOOGLE_MAPS_API_KEY` | Active |
| **Stripe** | Checkout sessions, webhooks, vendor/MC subscriptions | Edge: create-checkout*, stripe-webhook, create-mc-subscription, create-vendor-subscription, check-*-subscription | Configured; requires STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET |
| **Resend** | Transactional email (order, booking, signup, lead, property report, etc.) | Edge: send-email, notify-*, send-order-email, send-property-report, etc. | Configured; requires RESEND_API_KEY |
| **Lovable AI** | Descriptions, search, translation, moderation, intake, support chat, image enhance, concierge, legal assistant, business card scan, content planner, platform intelligence, etc. | Edge functions call Lovable API with LOVABLE_API_KEY | Configured; requires LOVABLE_API_KEY |
| **Firecrawl** | Web scraping (OTA, Airbnb sync, etagi, extract-images, vendor-acquisition) | Edge: firecrawl-scrape, firecrawl-map, airbnb-sync, etagi-scrape-projects, extract-images-from-url, vendor-acquisition | Configured; requires FIRECRAWL_API_KEY |
| **Google Drive** | Image extraction from Drive links (in extract-images-from-url) | Edge; GOOGLE_API_KEY | Optional (fallback to Firecrawl) |
| **Lovable Cloud Auth** | Optional cloud auth (package present) | `@lovable.dev/cloud-auth-js` | Present in package.json; usage not fully traced in this snapshot |

---

## PART 5: USER ROLES & ACCESS

### Roles (from `src/types/auth.ts` and DB `app_role`)

| Role | Description | Default path |
|------|-------------|--------------|
| `guest` | Unauthenticated | — |
| `user` | Authenticated client | `/` |
| `tourist` / `resident` | Personas | `/` |
| `partner` | Partner (post-approval) | `/vendor` |
| `owner` | Property owner | `/owner` (redirects to `/mc`) |
| `property_manager` | MC (УК) | `/owner` |
| `vendor` | Service provider | `/vendor` |
| `staff` | Staff | `/admin` |
| `uno_team` | UNO Team | `/team` |
| `admin` | Admin | `/admin` |
| `ombudsman` | Ombudsman | `/admin` |
| `finance` / `support` / `sales` | Specialized platform | Admin paths |
| `investor` | Investor | `/investor` |

### Where roles come from

- **user_roles** — Stored in DB; admin can manage all.
- **org_members** — Membership in `orgs` (e.g. vendor org) grants effective role (e.g. vendor).
- **management_company_members** — MC membership grants owner/property_manager access.

`useUserContext` merges: `user_roles`, `org_members` (org_type → role), `management_company_members` (→ owner). `hasRole(role)` and `availableRoles` drive UI and guards.

### Route guards

| Guard | Allowed roles | Fallback |
|-------|----------------|----------|
| `AdminGuard` | admin | — |
| `VendorGuard` | vendor, admin | `/vendor/onboarding` |
| `OwnerGuard` | owner, property_manager, admin | `/owner/onboarding` |
| `MCGuard` | MC member (owner context) | — |
| `StaffGuard` | staff (and likely admin) | — |
| `TeamGuard` | uno_team, admin | `/` |
| `AuthGuard` | Any authenticated | redirect to `/auth` |

### Multi-tenant / workspace

- **Orgs:** Users can belong to multiple orgs (`org_members`); `org_type` = vendor, owner, operator, platform. Active context stored in `user_active_context` (active_role, active_org_id, mode, entity_id).
- **Management companies:** Each MC is a tenant; `management_company_members` scopes data by `company_id`. MC sidebar and routes are scoped to the active company (e.g. via `ActiveCompanyProvider`).

---

## PART 6: CURRENT DATA STATE

- **Row counts:** Not available from the codebase; would require direct DB queries (e.g. `SELECT count(*)` on key tables).
- **Data nature:** Mix of seed/demo data (e.g. from migrations and fixtures) and real usage; cannot be determined from repo alone.
- **Data source:** Migrations and seed scripts in `supabase/migrations/`; some edge functions (e.g. bulk-import, etagi-scrape-projects, airbnb-sync) populate or sync data.

---

## PART 7: KNOWN GAPS & INCOMPLETE AREAS

- **Tables/views without UI:** Some tables (e.g. analytics, cohort, cross_sell_metrics, data_provenance, catalog_hygiene_log) may have no or minimal UI; would need screen-by-screen check.
- **Placeholder / TODO in code:** Grep for “placeholder” mostly finds UI placeholder text. No systematic list of “TODO”/“FIXME” was produced; recommended to run a project-wide TODO/FIXME grep for planning.
- **Partner → Vendor flow:** Now implemented: approving a partner application creates a provider, org, org_members, and user_roles.vendor via RPC `create_vendor_from_partner_application` (migration `20260304130000`), called from Partner Applications admin.
- **Property moderation:** Operations moderation tab sets `approval_status` for properties; public property lists filter by `approval_status = 'approved'`.
- **Deprecated / optional:** Mapbox references may remain in edge (e.g. `get-mapbox-token`, `geocode-address`); frontend uses Google Maps. Capacitor is present but no native build scripts in the listed npm scripts; PWA is the main install path.
- **Integrations:** Stripe, Resend, Lovable, Firecrawl are wired in code; “active” vs “partial” depends on env and usage in production.

---

*Document generated for strategic planning. When something is unclear from the code, it is stated explicitly. Table list is derived from `src/integrations/supabase/types.ts` and grouped by domain; for exact column lists and relationships, refer to types and migrations.*