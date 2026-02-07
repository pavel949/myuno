

# Populate Yachts Vertical with Real Provider Data

## Overview
Replace the 20 existing placeholder yacht records (which have no images, no real descriptions, and no source URLs) with verified, real-world data scraped from actual Phuket charter providers. The data includes exact specs, seasonal pricing, real photos, amenities, and source URLs.

## Data Sources (Verified via Live Scraping)

### Provider 1: Tiger Marine Charter (tigermarinecharter.com)
6 vessels with complete data:

| Vessel | Type | Length | Guests | Cabins | Half-Day (THB) | Full-Day (THB) | Overnight (THB) |
|--------|------|--------|--------|--------|---------------|----------------|------------------|
| Shangani 70ft | Luxury Catamaran | 21.3m | 60 | 6 | 98,000 | 135,000-165,000 | 180,000-195,000 |
| Zambezia 53ft | Power Catamaran | 16.15m | 30 | 4 | 69,500 | 93,000-109,000 | 142,000-158,000 |
| Sanyati 51ft | Speed Catamaran | 15.5m | 25 | 3 | 66,000 | 83,000-99,000 | 132,000-148,000 |
| Shashani 43ft | Power Catamaran | 13.1m | 15 | 3 | 59,000 | 73,000-89,000 | 112,000-128,000 |
| Shibuli 40ft | Speed Catamaran | 12.1m | 15 | 3 | 59,000 | 73,000-89,000 | 112,000-128,000 |
| Limpopo 28ft | Speedboat (Axopar) | 8.5m | 4 | 0 | 17,000 | 39,500 | N/A |

Each has 8-10 real photos, detailed amenities, and seasonal pricing.

### Provider 2: Simba Sea Trips (simbaseatrips.com)
3 charter types with real pricing:
- Speedboat Phang Nga Bay: from 33,800 THB (8h)
- Speedboat Phi Phi Sunrise: from 33,800 THB (8h)
- Speedboat Coral Delight: from 30,100 THB (7h)
- MotorYacht Phang Nga Bay: from 58,600 THB (8h)
- MotorYacht Sunset: from 48,000 THB (4.5h)
- Locals Island Tour: from 13,000 THB (4h)
- Krabi Classics: from 34,700 THB (9h)

## Implementation Steps

### Step 1: Database Migration -- Clear Old Placeholder Data and Insert Real Records
A single SQL migration that:

1. **Deletes** the 20 existing yacht records (all have `cover_image: null` -- clearly placeholder data)
2. **Inserts Tiger Marine Charter** as a provider in the `providers` table (if not already present by exact name match)
3. **Inserts Simba Sea Trips** as a provider
4. **Inserts 6 Tiger Marine vessels** with:
   - Real photo URLs from tigermarinecharter.com (cover + gallery of 8-10 images each)
   - Exact specs (length, guests, cabins)
   - Low-season pricing as `price_half_day` and `price_full_day`
   - High-season pricing as `price_overnight`
   - Real EN descriptions from website
   - RU translations
   - `features_en` array: snorkeling, kayak, SUP, fishing, WiFi, bluetooth speakers, AC cabins, hotel transfer, welcome drinks, lunch included
   - `source_urls` array pointing to exact boat pages
   - `location_name`: "Royal Phuket Marina, Phuket"
   - `has_crew: true`, `has_catering: true`
   - `yacht_type`: "catamaran" or "speedboat"
   - `is_active: true`, `is_verified: true`, `is_featured` for Shangani
5. **Inserts 4 Simba Sea Trips vessels** (speedboat + motoryacht) with:
   - Real photos from simbaseatrips.com CDN
   - Real pricing in THB
   - Source URLs
   - Descriptions from their website

### Step 2: Data Provenance Records
Insert `data_provenance` entries for each yacht linking back to the exact source URL, scrape timestamp, and provider verification status.

## Technical Notes

- **Photos**: Using direct image URLs from provider websites (hotlinked). These are publicly served images from their CDNs.
- **Pricing**: Using low-season prices as the default `price_half_day` / `price_full_day`. Seasonal variation noted in description.
- **No code changes needed**: The existing `useYachts`, `useYacht`, yacht detail page, and booking flow already support all the fields being populated.
- **Provider linkage**: Each yacht will have `provider_id` set to the corresponding provider UUID.

## Expected Result
- 10 real yacht/boat listings with professional photos, real pricing, real specs
- Each yacht card in the app will display a real cover image, real price, and accurate capacity
- Yacht detail pages will show full photo galleries, specs, and amenities
- Booking flow will use real pricing
- All data traceable to source via `source_urls` and `data_provenance`

