
# Plan: Import Real Estate Projects from FazWaz

## Overview

Scrape all real estate development projects from FazWaz for 6 priority Phuket districts, extract full details (name, developer, description, amenities, prices, GPS, images), and import them into our `property_projects` and `developers` tables with proper relationships.

## Target Districts (north to south)

| Priority | District | FazWaz URL path |
|----------|----------|-----------------|
| 1 | Bang Tao | `/thalang/choeng-thale` + `/thalang/si-sunthon` (Bang Tao overlaps both) |
| 2 | Surin / Kamala | `/thalang/choeng-thale` (Surin area) + `/kathu/kamala` |
| 3 | Patong | `/kathu/patong` |
| 4 | Ko Kaew | `/phuket-town/ko-kaew` |
| 5 | Nai Yang | `/thalang/sakhu` |
| 6 | Mai Khao | `/thalang/mai-khao` |

## Current State

- **67 projects** already exist in DB (mostly from prior FazWaz import)
- **12 developers** in `developers` table
- FazWaz blocks direct fetch but works via Firecrawl (confirmed)
- Firecrawl connector is active with API key configured

## Architecture: 3-Phase Edge Function Pipeline

### Phase 1: Discovery -- `fazwaz-discover-projects`
- Scrape project directory pages for each district via Firecrawl
- Extract project URLs from the listing pages (pattern: `/projects/thailand/phuket/{amphoe}/{tambon}/{slug}`)
- Deduplicate against existing projects in DB (match by name)
- Output: list of new project URLs to scrape

### Phase 2: Scrape & Extract -- `fazwaz-scrape-project`
- For each discovered project URL, scrape the detail page via Firecrawl
- Use AI (Gemini Flash) to parse the scraped markdown into structured JSON:
  - Project name (EN)
  - Developer name
  - Location (district, address, GPS)
  - Property types available (condo, villa, house)
  - Total units, completion date, project status
  - Price range (min/max in THB)
  - Description
  - Amenities & facilities
  - Cover image URL + gallery image URLs
- Rate-limited: process 5 projects at a time with delays

### Phase 3: Insert -- `fazwaz-import-projects`
- For each extracted project:
  1. **Developer resolution**: Check if developer exists in `developers` table by name match. If not, create new developer record
  2. **Project insertion**: Insert into `property_projects` with `developer_id` FK
  3. **Image caching**: Download cover image to `project-images` storage bucket (reuse existing infrastructure)
  4. **Russian translation**: Generate `name_ru` and `description_ru` via AI translate

## Data Mapping

```text
FazWaz Field            -> DB Column (property_projects)
------------------------------------------------------
Project Name            -> name_en
Developer               -> developer_name + developer_id (FK)
Location/District       -> district, address
GPS Coordinates         -> lat, lng
Completion Date         -> completion_date
Status (Off Plan/etc)   -> project_status ('offplan'|'under_construction'|'completed')
Total Units             -> total_units
Price Range             -> price_from, price_to
Description             -> description_en
Facilities              -> amenities[]
Cover Photo             -> cover_image (cached to storage)
Gallery Photos          -> images[]
```

## Deduplication Strategy

Before inserting, check for existing projects by:
1. Normalized name match (lowercase, strip spaces)
2. Same district
3. If match found, update rather than insert (merge new data)

## Estimated Volume

Based on FazWaz directory pages for these districts:
- Bang Tao / Choeng Thale: ~80-120 projects
- Surin / Kamala: ~30-50 projects
- Patong: ~40-60 projects
- Ko Kaew: ~10-20 projects
- Nai Yang / Sakhu: ~10-20 projects
- Mai Khao: ~5-10 projects
- **Total estimate: 175-280 new projects**

## Execution Plan

Since Firecrawl has rate limits and edge functions have 60s timeouts, the process will be batched:

1. Run discovery function per district (6 calls) -- collect all project URLs
2. Process scraping in batches of 5 projects per function call
3. Each batch: scrape -> extract -> insert -> cache images
4. Track progress in a temporary `import_progress` record or return results

## Technical Details

### Files to create:
1. `supabase/functions/fazwaz-discover-projects/index.ts` -- Phase 1: discover project URLs from directory pages
2. `supabase/functions/fazwaz-scrape-project/index.ts` -- Phase 2+3: scrape detail page, extract data, upsert into DB

### Files to modify:
- None (new edge functions only)

### Dependencies:
- Firecrawl API (connector already configured)
- Lovable AI (Gemini Flash for markdown-to-JSON extraction and EN->RU translation)
- Existing `project-images` storage bucket for image caching

### Safeguards:
- Deduplication by project name + district
- Maximum 300 projects per import run
- Error logging for failed scrapes
- Dry-run mode to preview extracted data before inserting
