

# Import Real Phuket Property Projects from FazWaz

## Overview
Insert 7 verified property projects scraped from FazWaz.com into the `property_projects` table, along with their associated developers in the `developers` table. All data comes from individual FazWaz project pages with real descriptions, photos, amenities, coordinates, and pricing.

## Data Collected (7 Projects)

| Project | District | Developer | Status | Units | Floors | Price From (USD) |
|---------|----------|-----------|--------|-------|--------|-----------------|
| The VIP Mercury - Wyndham La Vita Phuket | Rawai | VIP Thailand | Completed (Mar 2022) | 516 | 7 | $78,900 |
| The Deck Patong | Patong | Sansiri | Completed (Aug 2015) | 270 | 7 | $152,000 |
| 6th Avenue Surin | Choeng Thale (Surin) | Ocean Group Asia | Completed (Feb 2016) | 137 | 8 | $78,600 |
| Zcape I | Choeng Thale (Laguna) | Tri Property Co., Ltd. | Completed (Jan 2014) | 198 | 8 | $67,900 |
| The Title V | Rawai | Rhom Bho Property PLC | Completed (May 2021) | 228 | 5 | $126,000 |
| Bellevue Beachfront Condo | Choeng Thale (Layan) | Bell Land Development | Off Plan (Aug 2026) | 645 | 5 | $148,000 |
| Skypark Celeste Laguna | Choeng Thale (Laguna) | Banyan Group Residences | Completed (Sep 2025) | 384 | 7 | $158,000 |

## Implementation Steps

### Step 1: Insert Developers
Insert 6 developers into the `developers` table (with ON CONFLICT skip to avoid duplicates):
- **VIP Thailand** -- developer of Wyndham La Vita, VIP Tropika
- **Sansiri** -- one of Thailand's largest developers
- **Ocean Group Asia** -- developer of 6th Avenue, Surin Sands
- **Tri Property Co., Ltd.** -- developer of Zcape series
- **Rhom Bho Property PLC** -- developer of The Title series
- **Bell Land Development** -- developer of Bellevue projects
- **Banyan Group Residences** -- Laguna Phuket ecosystem developer

Each developer will include: name (EN/RU), logo URL from FazWaz CDN, website link, and FazWaz developer page link.

### Step 2: Insert Property Projects
Insert 7 projects into `property_projects` with full data:

For each project:
- **name_en / name_ru**: English name + Russian translation
- **description_en / description_ru**: Full marketing descriptions from FazWaz pages
- **district**: Rawai, Patong, Choeng Thale, etc.
- **address**: Full address from FazWaz (e.g., "81 Rat U Thit 200 Pee Road, Patong, Kathu, Phuket")
- **lat / lng**: Extracted from Google Street View links on FazWaz (e.g., 7.7738059, 98.3178938)
- **developer_id**: FK to developers table
- **developer_name**: Denormalized developer name
- **year_built**: Completion year
- **total_units**: Exact unit count (516, 270, 137, etc.)
- **cover_image**: High-res cover from FazWaz CDN (2850x1515px)
- **images**: Array of 4-6 gallery photos from FazWaz CDN
- **amenities**: Real amenities arrays (Pool, Gym, CCTV, Parking, etc.)
- **project_status**: 'completed' or 'offplan'
- **completion_date**: Exact date (e.g., '2022-03-01')
- **price_from / price_to**: USD prices converted to THB (1 USD ~ 35 THB)
- **is_active**: true
- **is_featured**: true for premium projects (Wyndham, Skypark)

### Step 3: Insert Data Provenance
Add `data_provenance` records for each project linking to the exact FazWaz project URL.

## Technical Details

- **Coordinates source**: Extracted from Google Maps Street View links embedded in each FazWaz project page (e.g., `viewpoint=7.9029867,98.3007747`)
- **Images**: Using FazWaz CDN URLs (publicly served at cdn.fazwaz.com)
- **Pricing**: Converting USD to THB at ~35 THB/USD for `price_from` / `price_to`
- **No code changes needed**: The existing `usePropertyProjects`, `useOffplanProjects`, and project detail pages already support all populated fields
- **Existing placeholder data**: The 6 existing projects (Patong Tower, Laguna Park, Kamala Hills, Chalong Bay, Rawai Beachfront, Title Legendary) will be kept -- new projects are additive

## Expected Result
- 7 new real property projects visible in the Complexes catalog and property search
- Each project card shows real FazWaz photos, real developer names, real pricing
- Off-plan filter will show Bellevue Beachfront (completing Aug 2026)
- Map pins will appear at correct GPS coordinates for all 7 projects
- Developer profiles linked for future developer detail pages

