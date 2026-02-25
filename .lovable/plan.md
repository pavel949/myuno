

# myUNO Professional Services in Owner Recommendations

## What We're Building

Instead of a separate "Services Hub" page, we embed myUNO professional services (inventory audit, photo shoot, inspection, management audit, etc.) directly into the **"Your Day"** feed as smart recommendation cards for property owners. Clicking a card opens WhatsApp with a pre-filled message AND creates an internal lead (`consultation_requests`) for tracking.

## How It Works

```text
Owner Dashboard -> "Your Day" Feed -> "myUNO Recommendations" section
                                          |
                                          v
                              [Inventory Audit] [Photo Shoot] [Inspection] ...
                                          |
                                    Click card
                                          |
                       +------------------+------------------+
                       |                                     |
              Creates consultation_request           Opens WhatsApp with
              (lead tracking, admin notified)        pre-filled service message
```

## Services to Recommend

| Service | Icon | WhatsApp Message |
|---------|------|------------------|
| Property Inventory | ClipboardList | "I'd like to order a property inventory audit" |
| Professional Photo Shoot | Camera | "I'd like to order a professional photo session" |
| Property Inspection | Search | "I'd like to order a property inspection" |
| Management Audit | BarChart3 | "I'd like to order a management audit" |
| 3D Tour / Virtual Tour | Box | "I'd like to order a 3D virtual tour" |
| Smart Home Sensors | Wifi | "I'd like to discuss smart home sensors installation" |
| Insurance Consultation | ShieldCheck | "I'd like to consult about property insurance" |
| Property Sale Assistance | DollarSign | "I'd like to discuss selling my property" |

## Implementation Steps

### 1. New Component: `OwnerServiceRecommendations`
**File**: `src/components/owner/dashboard/OwnerServiceRecommendations.tsx`

A horizontal scroll carousel of service cards, styled consistently with the "Your Day" feed. Each card:
- Shows icon + title (bilingual) + short description + price indicator (e.g. "from 3,000 THB")
- On click: (1) fires `useUniversalLead` to create a `consultation_request` with `vertical_id: 'property_services'` and `request_type` matching the service; (2) opens WhatsApp via `getWhatsAppUrl()` with a pre-filled message including the service name

### 2. Integrate into `useDayBriefing.ts`
Add a new item type `myuno_service` to `DayItemType`. For owner roles, inject 2-3 rotating service recommendations into `sectionOrder: ORDER.recommendations` alongside existing platform recommendations. These are hardcoded service definitions (not from DB) -- rotated based on day-of-week or random seed so owners see different services each day.

### 3. Update `YourDayFeed.tsx`
- Add `myuno_service` to the icon mapping (use `Sparkles` or service-specific icons)
- Add a special rendering path for `myuno_service` items: instead of standard `DayItemCard`, render as compact service cards with a "Request" CTA button
- The click handler calls `useUniversalLead.submitLead()` + `window.open(whatsappUrl)`

### 4. Alternative: Standalone Section Below "Your Day"
If embedding into the feed feels crowded, add `OwnerServiceRecommendations` as a **standalone widget** in the Owner Dashboard (new `DashboardWidgetKey: 'myuno_services'`), rendered right after the "Your Day" feed. This keeps the feed clean and gives services their own visual space.

## Technical Details

### New/Modified Files:

1. **`src/components/owner/dashboard/OwnerServiceRecommendations.tsx`** (NEW)
   - Static service catalog array with bilingual titles, icons, descriptions, price ranges
   - Daily rotation logic (show 3-4 of 8 services per day)
   - `useUniversalLead` integration for lead creation on click
   - `getWhatsAppUrl` for WhatsApp deep link
   - Horizontal scroll layout matching existing UI patterns

2. **`src/hooks/useDayBriefing.ts`** (EDIT)
   - Add `myuno_service` to `DayItemType`
   - For owner roles: inject 2-3 service recommendation `DayItem`s with `sectionOrder: ORDER.recommendations`

3. **`src/components/shared/YourDayFeed.tsx`** (EDIT)
   - Add `myuno_service` to icon mapping and style mapping
   - Add special card rendering for service items (with "Request" badge and WhatsApp icon)

4. **`src/pages/owner/OwnerDashboard.tsx`** (EDIT)
   - Add `myuno_services` widget key
   - Render `OwnerServiceRecommendations` as fallback/standalone section

5. **`src/lib/businessRoles.ts`** (EDIT)
   - Add `myuno_services` to `DashboardWidgetKey` type and owner widget list

### Lead Flow:
- `vertical_id`: `'property_services'`
- `request_type`: specific service (e.g., `'inventory_audit'`, `'photo_shoot'`)
- `lead_source`: `'dashboard_recommendation'`
- `entry_point`: `'owner_dashboard_your_day'`
- Triggers existing `notify-admin-order` edge function for admin WhatsApp/email alerts

### No Database Changes Required
- Uses existing `consultation_requests` table
- Uses existing `useUniversalLead` hook
- Service catalog is hardcoded (not a new table) -- this keeps it simple and allows fine-tuning without migrations

