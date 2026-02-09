

## Ignatev Estate Rental Properties Import Pipeline

### Overview
Build a dedicated Edge Function that scrapes all rental listings from ignatevestate.ru, extracts structured property data (title, price, bedrooms, bathrooms, area, amenities, images, district, description), and imports them into the unified `properties` table. The management company (Ignatev Estate) will be linked as a provider.

### Discovery Phase Results

From scraping the site, I identified **~15+ rental listings** accessible via `https://www.ignatevestate.ru/listings?type=1`. The listing URLs follow the pattern:
```
/listings/{slug}-{id}
```

Each listing page contains rich data:
- Title, description, property type (Villa, Condo, Apartment)
- Price in THB/USD, bedrooms, bathrooms, area (sqm)
- District/location, address
- Gallery images (8-20 photos per listing)
- Amenities (pool, security, CCTV, garden, parking, etc.)
- IE reference code (e.g. IE-RNT-195)
- Unit/floor plan details

Management company: **Ignatev Estate** (info@ignatev-estate.com, +66 92 240 7355, WhatsApp, Telegram, LinkedIn, Instagram, Facebook)

### Implementation Plan

#### Phase 1: Create/Verify Provider Record
- Ensure "Ignatev Estate" exists in the `providers` table as an active provider
- Store contact details (email, phone, social links)

#### Phase 2: New Edge Function `ignatev-scrape-rentals`

The function will:

1. **Discover rental URLs** -- Scrape the listings index page (`/listings?type=1`) via Firecrawl to collect all rental listing URLs
2. **Scrape each listing** -- Use Firecrawl to get full markdown + links for each detail page
3. **AI Extraction** -- Use Gemini Flash to parse markdown into structured JSON:
   - `title_en`, `description_en` (from page content)
   - `property_type` (villa/condo/apartment)
   - `bedrooms`, `bathrooms`, `area_sqm`
   - `price`, `currency` (THB or USD)
   - `district`, `address`
   - `amenities[]`
   - `images[]` (gallery URLs)
   - `ie_reference_code` (IE-RNT-xxx)
4. **Russian Translation** -- Auto-translate title and description to Russian via Gemini Flash Lite
5. **Deduplication** -- Match by title (ilike) to avoid duplicates with existing properties
6. **Upsert into `properties`** -- Insert new or update existing records with:
   - `listing_type: 'rent'`
   - `listing_modes: ['rent']`
   - `provider_id` linked to Ignatev Estate provider
   - `approval_status: 'approved'`
   - `is_active: true`

#### Phase 3: Image Caching
- Download cover images from ignatevestate.ru and store in Supabase Storage to avoid hotlinking issues
- Use the existing `proxy-image` function pattern

### Data Mapping

```text
Ignatev Estate Field       -->  properties Column
----------------------------------------------------
Title                      -->  title_en / title_ru
Description                -->  description_en / description_ru
Property Type (Villa, etc) -->  property_type
Bedrooms                   -->  bedrooms
Bathrooms                  -->  bathrooms
Area (sqm)                 -->  area_sqm
Price                      -->  price
Currency (THB/USD)         -->  currency
Price period               -->  price_period ('month')
District                   -->  district
Address                    -->  address
Amenities                  -->  amenities[]
Gallery images             -->  images[]
Cover image                -->  cover_image
IE Reference               -->  internal_name
Listing type               -->  listing_type ('rent')
```

### Technical Details

- Reuses existing patterns from `fazwaz-scrape-project` Edge Function (Firecrawl + Gemini extraction + Russian translation)
- Batch processing with rate limiting (max 5 concurrent scrapes)
- Dry-run mode available for testing before actual import
- Provider/management company metadata stored alongside properties

### Files to Create/Modify

| Action | File |
|--------|------|
| Create | `supabase/functions/ignatev-scrape-rentals/index.ts` |
| Modify | Database: ensure Ignatev Estate provider record exists |

### Estimated Rental Listings to Import
Based on the index page scrape: ~15-20 rental properties including villas in Layan, Rawai, Patong, Pasak, Cherng Thale, Paklok, Kamala, Bang Tao, and condominiums in various districts.

