

# Real Estate Block: Deep Audit + New Developments & Resale Implementation Plan

## PHASE 1: AUDIT FINDINGS

### 1.1 Database Architecture

**Existing property-related tables:**

| Table | Purpose | Has Data |
|-------|---------|----------|
| `properties` | Unified property table (rent + sale) | Yes (26+ active) |
| `property_projects` | Development projects (offplan) | Yes (has schema with muUNO scoring, developer_id, price_from/to, units) |
| `property_rate_seasons` | Seasonal pricing rules | Yes |
| `property_inquiries` | Simple inquiry table (name, phone, property_id, dates) | Exists, minimal schema |
| `consultation_requests` | Rich lead/inquiry system with AI scoring, budget, districts, purpose, status pipeline | Yes — this is the REAL lead system |
| `property_bookings` | Rental booking records | Yes |
| `booking_operations`, `booking_meter_readings`, etc. | PMS operations | Yes |

**Tables that DO NOT exist yet:**
- `new_developments` — NOT needed, `property_projects` already serves this purpose with: `project_status`, `price_from`, `price_to`, `roi_projected`, `muuno_score`, `construction_progress`, `completion_date`, `developer_id`, `total_units`, `units_sold`, `units_available`, `investment_enabled`
- `development_units` — NOT exists. Would be useful for floor plan configs per project
- `resale_properties` — NOT exists. Currently, resale/sale listings use `properties` with `listing_type = 'sale'`

### 1.2 Price = 0 Bug Analysis

**Root cause (previously partially fixed):**
- `properties.price` column often NULL for rental listings
- `properties.price_per_night` holds the actual nightly rate
- The `PROPERTY_LIST_COLUMNS` query now includes `price_per_night` (was fixed)
- `PropertyListingCard` line 70: `const unitPrice = property.price_per_night || property.price || 0` — correctly falls back
- **Remaining issue**: The SQL backfill only ran once. New properties added without `price` populated would still show 0 if `price_per_night` is also null. The fix is correct architecturally.

### 1.3 Frontend Pages Assessment

| Page | Route | Data Source | Price Display | UX Score | Issues |
|------|-------|------------|---------------|----------|--------|
| PropertyIndex (catalog) | `/property` | `usePropertiesInfinite` → `properties` | ✅ Fixed (price_per_night fallback) | 7/10 | Good Airbnb-style. Filters work. |
| PropertyDetail | `/property/:id` | `usePropertyWithRentalTerms` → `properties` + `property_projects` | ✅ `pricePerNight = rentalTerms?.price_per_night \|\| property.price \|\| 0` | 8/10 | Full detail with booking card, amenities, calendar |
| PropertyInquiry | `/property/:id/inquiry` | Creates order via `useOrders` | ✅ Stripe-connected | 7/10 | Full booking flow with deposit |
| OffplanIndex | `/property/offplan` | `useOffplanProjects` → `property_projects` | ✅ `priceFrom/priceTo` | 7/10 | Has filters, developer info, muUNO scores |
| OffplanDetail | `/property/offplan/:id` | Same hook + `useDeveloper` | ✅ | 7/10 | Gallery, scoring, CTA with `UniversalLeadForm` |
| DevelopersIndex | `/property/developers` | `useDevelopers` | N/A | 6/10 | Basic list |
| ProjectsIndex | `/property/projects` | `property_projects` | ✅ | 6/10 | Lists complexes |
| **Resale page** | — | — | — | — | **DOES NOT EXIST** |

### 1.4 Booking & Inquiry Flow

| Step | Status | Details |
|------|--------|---------|
| User finds property | ✅ | Catalog with filters, search, categories |
| User clicks "Book" | ✅ | Opens date picker → navigates to `/property/:id/inquiry` |
| Inquiry/booking form | ✅ | Full form with dates, guests, deposit calc, Stripe |
| Creates DB record | ✅ | Uses `create_order_atomic` RPC → `orders` table |
| Admin notification | ⚠️ | `booking_message_rules` exist but depend on edge function trigger |
| Save favorites | ✅ | `FavoriteButton` component works |
| Comparison | ✅ | `CompareProvider` + `CompareButton` exists |
| Lead form (offplan) | ✅ | `UniversalLeadForm` → `consultation_requests` with AI scoring |

### 1.5 Critical Assessment

| Area | Score | Critical Issues | Quick Wins |
|------|-------|-----------------|------------|
| Property catalog (STR) | 7/10 | Price=0 for properties missing both price fields | Backfill + validation on save |
| Property detail page | 8/10 | None critical | — |
| Search & filters | 7/10 | Works well with taxonomy | — |
| Booking flow | 8/10 | Stripe-connected, deposit model | — |
| New developments | 7/10 | `property_projects` exists with offplan pages | Needs unit types table, more data |
| **Resale / secondary** | **1/10** | **NO dedicated page, no resale schema** | **Build resale catalog** |
| Investment tools | 6/10 | muUNO scoring exists, ROI calc | Add more sample data |
| Map integration | 6/10 | PropertyMap page exists | — |
| Mobile experience | 7/10 | Airbnb-style responsive | — |
| Admin management | 7/10 | AdminProjects page with CRUD | Add resale admin |

---

## PHASE 2: IMPLEMENTATION PLAN

### What Already Exists (DO NOT rebuild):
- `property_projects` table — already serves as "new developments" with `project_status`, pricing, developer info, muUNO scores
- `OffplanIndex` + `OffplanDetail` pages — already functional new developments catalog
- `UniversalLeadForm` → `consultation_requests` — already a rich lead/inquiry system
- `AdminProjects` — already has CRUD for projects
- Property booking flow via Stripe — working

### What Needs Building:

#### 2.1 Database Changes

**a) `development_units` table** — unit configurations within a project
- Links to `property_projects` (not a new `new_developments` table)
- Fields: unit_type, area_sqm, bedrooms, bathrooms, price, floor_plan_url, views, features, available_units, status

**b) `resale_properties` table** — dedicated secondary market listings
- Separate from `properties` (which is for managed rentals)
- Includes assignment support (`is_assignment`, `assignment_premium`, `remaining_payments`)
- Links optionally to `property_projects` (development_id)
- Investment fields: current_rental_income, estimated_roi
- Legal: title_type, lease_years_remaining

**c) Extend `consultation_requests`** — add fields for resale/new-dev specific inquiries
- Already has `budget_min`, `budget_max`, `districts`, `property_types`, `purpose` — sufficient
- Add `development_project_id` and `resale_property_id` columns (nullable FKs)

**d) RLS policies** — public read for active listings, admin manage for all

#### 2.2 Frontend: Resale Catalog (NEW)

**Page: `/property/resale`** — Secondary market & assignments
- Tab filter: All | Assignments (переуступки) | Ready to move in
- Filters: type, zone, budget, area
- Card design showing: photo, badge for assignment, title, location, area, price, original price for assignments, ROI if available
- Links to detail page

**Page: `/property/resale/:id`** — Resale detail
- Photo gallery, specs, price breakdown
- For assignments: original price, premium %, remaining payments
- Legal info (title type, lease remaining)
- Investment metrics if available
- Inquiry CTA using `UniversalLeadForm`

#### 2.3 Frontend: Enhance Existing Offplan Pages

**OffplanDetail** — add unit types section
- Show `development_units` cards: unit name, sqm, beds/baths, price, floor plan, availability
- "Осталось: X" badge or "Sold Out" state

**OffplanIndex** — add ROI and ownership filters
- Add: ROI minimum filter, title type (freehold/leasehold), guaranteed yield toggle

#### 2.4 Admin: Resale Management (NEW)

**Admin page for resale listings** — CRUD with:
- List view with status, price, zone, days on market
- Add/edit form matching `resale_properties` schema
- Assignment-specific fields section

**Extend AdminProjects** — add unit type management
- Nested CRUD for `development_units` within project edit

#### 2.5 Lead Flow Enhancement

On every "Запросить показ" / "Request Viewing" button across property pages:
- Already uses `UniversalLeadForm` → `consultation_requests` — keep this
- Pass `development_project_id` or `resale_property_id` in the form context
- Existing AI scoring + status pipeline (new → contacted → qualified → viewing → proposal → closed) already works

#### 2.6 Navigation Integration

- Add "Вторичка / Resale" tab to `PropertyHub` tabs (alongside Rent, Buy, New Build, My Property)
- Add route `/property/resale` and `/property/resale/:id` to router
- Homepage: add "Resale" entry point in services grid

#### 2.7 Sample Data

Insert via SQL:
- 5 sample `property_projects` entries (if not enough data exists)
- 3-5 `development_units` per project
- 3 `resale_properties` entries including 1 assignment

---

## PHASE 3: FIXES

1. **Price=0 remaining cases** — add DB constraint or trigger: if `listing_type = 'rent'` and `price` is NULL, auto-copy from `price_per_night`
2. **All CTA buttons connected** — audit every "Book"/"Inquire" button routes to a form
3. **Mobile responsive** — all new pages use existing `AppLayout` + Tailwind mobile-first patterns
4. **Bilingual** — all new strings in RU + EN using `useLanguage()` pattern

---

## Implementation Order

1. Database migration: `development_units` + `resale_properties` + extend `consultation_requests` + RLS
2. Hooks: `useResaleProperties`, `useDevelopmentUnits`, extend `useOffplanProjects`
3. Pages: Resale catalog + detail, enhance OffplanDetail with units
4. Admin: Resale CRUD, unit type management in AdminProjects
5. Navigation: Add resale tab to PropertyHub, add routes
6. Sample data insertion
7. Price=0 backfill trigger

**Estimated scope**: ~15 files created/modified, 1 migration, 1 data insert

