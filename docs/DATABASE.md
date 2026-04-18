# Database Schema

> 📖 **For environment, project refs, URLs and keys, see [`ENVIRONMENT.md`](ENVIRONMENT.md) — single source of truth.**
>
> **PRIMARY DB:** Supabase project `kakkwibljrjsawxgnupk` (`https://kakkwibljrjsawxgnupk.supabase.co`). All frontend and edge function reads/writes go here. There is **no v2 schema** — all tables in `public`.

The database is PostgreSQL managed by Lovable Cloud (Supabase). All tables are in the `public` schema.

## Auto-Generated Files (DO NOT EDIT)

- `src/integrations/supabase/types.ts` — TypeScript types generated from the DB schema
- `src/integrations/supabase/client.ts` — Supabase client instance
- `supabase/migrations/*` — Migration history

## Key Tables

### Core / Platform

| Table | Description |
|-------|-------------|
| `profiles` | User profiles (extends `auth.users`) |
| `providers` | Service provider accounts |
| `orders` | Unified order records across all verticals |
| `bookings` | Generic booking records |
| `booking_payments` | Payment records for bookings |
| `booking_vouchers` | QR-code vouchers for bookings |
| `cart_items` | Shopping cart (synced with authenticated users) |
| `lookup_values` | Dynamic taxonomy/lookup values |
| `system_settings` | Platform-wide configuration |

### Vertical Entity Tables

Each vertical has its own entity table:

| Table | Vertical | Key Fields |
|-------|----------|------------|
| `properties` | Real Estate | type, district, bedrooms, price, ownership_form |
| `yachts` | Yacht Charter | yacht_type, capacity, price_per_day |
| `vehicles` | Car/Bike Rental | vehicle_type, transmission, fuel_type |
| `restaurants` | Dining | cuisine, features, price_range |
| `salons` | Beauty & Spa | salon_type, services |
| `clinics` | Healthcare | specialty, languages |
| `gyms` | Fitness | gym_type, amenities, membership_types |
| `events` | Events | event_type, date, venue |
| `experiences` | Tours & Activities | category, duration, difficulty |
| `water_activities` | Water Sports | activity_type, difficulty |
| `education_providers` | Education | education_type, age_group |
| `legal_services` | Legal | service_type, languages |
| `cleaning_services` | Home Cleaning | service_type, frequency |
| `babysitters` | Childcare | age_groups, languages, certifications |
| `pet_services` | Pet Care | service_type, pet_types |
| `flower_shops` | Flower Delivery | — |
| `bouquets` | Flower Products | category, occasion, price |
| `insurance_providers` | Insurance | plan_type, coverage |
| `pharmacies` | Pharmacy | category, services |

### Booking-Specific Tables

| Table | Description |
|-------|-------------|
| `property_bookings` | Property rental bookings |
| `booking_operations` | Check-in/out, deposits, cleaning |
| `booking_meter_readings` | Utility meter readings |
| `booking_inventory_reports` | Property inventory condition |
| `airport_bookings` | Airport service bookings |
| `airport_passengers` | Passenger details for airport bookings |
| `airport_services` | Airport service catalog |
| `airport_suppliers` | Airport service suppliers |
| `booking_status_history` | Booking status change audit trail |
| `booking_notifications_log` | Notification delivery log |

### Marketplace

| Table | Description |
|-------|-------------|
| `stores` | Marketplace vendor stores |
| `products` | Marketplace products |
| `product_variants` | Product size/color variants |
| `bundle_offers` | Bundle/discount offers |

### AI & Automation

| Table | Description |
|-------|-------------|
| `ai_agents` | AI agent configurations |
| `ai_agent_knowledge` | Agent knowledge bases and prompts |
| `ai_agent_logs` | Agent usage analytics |
| `ai_artifacts` | AI-generated content (reviews, descriptions) |
| `ai_intake_sessions` | Bulk intake processing sessions |

### Admin & Operations

| Table | Description |
|-------|-------------|
| `admin_audit_logs` | Admin action audit trail |
| `achievement_definitions` | Gamification achievement catalog |

## Common Patterns

### Bilingual Fields
Most entity tables have paired fields: `name_en`/`name_ru`, `description_en`/`description_ru`.

### Soft Delete / Visibility
Tables use `is_active` boolean (default `true`) instead of hard delete.

### Provider Association
Entities are linked to providers via `provider_id` FK to `providers` table.

### Approval Workflow
Vendor-submitted entities have `approval_status` (`pending` | `approved` | `rejected`), `reviewed_by`, `reviewed_at`, `rejection_reason`.

### UNO Team Content
Some tables have `created_by_uno_team` (boolean) and `uno_team_creator_id` to distinguish platform-created content.

## RLS Policies

Row-Level Security is enabled on most tables. General patterns:

- **Public read**: Most entity tables allow SELECT for all (`is_active = true`)
- **Owner write**: Users can modify their own data (`auth.uid() = user_id`)
- **Provider write**: Vendors can modify entities linked to their provider
- **Admin bypass**: Admin operations use `service_role` key in Edge Functions

## Realtime

Tables with realtime enabled (via `supabase_realtime` publication):
- `booking_messages` — Real-time chat in bookings
- `notifications` — Push notification delivery
