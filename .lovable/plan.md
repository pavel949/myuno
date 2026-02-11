

# Restructuring Property Search for Real Phuket Use Cases

## Problem

The current search UI uses generic Airbnb-style categories (Tropical, Rooftop, Garden, Mountain) that don't match how people actually search for property in Phuket. Based on your input, the real search mental model is:

**Type** (Villa/Condo/Hotel) -> **Specs** (bedrooms, guests) -> **Beach/Area** -> **Project** -> **Unit**

Key differentiators that matter but are missing or buried:
- Walk to beach (vs. drive)
- Private pool (villa) vs. shared pool (condo)
- Washing machine in unit
- Kid-friendly infrastructure
- Pet-friendly
- Sea view

## Changes

### 1. Replace Category Ribbon with Real Differentiators

Remove irrelevant categories (Tropical, Mountain, Rooftop, Garden, Gym, Kitchen, WiFi, New Build) and replace with what actually drives decisions:

| Current (remove)     | New (add)              |
|----------------------|------------------------|
| Tropical             | Walk to Beach          |
| Mountain             | Private Pool           |
| Rooftop              | Washer                 |
| Garden               | Condo w/ Pool          |
| New Build            | Family-friendly        |
| Kitchen              | --                     |
| Gym                  | --                     |

New ribbon order (priority-based):
1. Beachfront (keep)
2. Walk to Beach (new)
3. Sea View (keep)
4. Private Pool (new)
5. Pool (keep - shared/condo pool)
6. Washer (new)
7. Pet Friendly (keep)
8. Kids (keep)
9. Parking (keep)
10. WiFi (keep)
11. Luxury (keep)

### 2. Restructure Mobile Search Flow Tabs

Current: **Where | When | Property | Who**

New: **Type | Beach | Dates | Details**

- **Type** tab: Villa / Condo / Apartment / House / Penthouse / Bungalow (large tappable cards, single-select primary + multi for "show all")
- **Beach** tab: Replace "district" label with "Beach / Area". Group popular beaches at top (Bangtao, Surin, Kamala, Kata, Karon, Patong, Nai Harn, Layan). Less popular below a divider. Multi-select.
- **Dates** tab: Keep as-is (calendar + flexible options)
- **Details** tab: Merge bedrooms + guests + key amenities. Bedrooms selector at top, guest counter below, then toggle chips for key differentiators (private pool, walk to beach, washer, pets, kids, instant booking)

### 3. Update matchesCategory Logic

Update `PropertyCategoryIcons.tsx` `matchesCategory()` to handle new categories:
- `walk_to_beach`: check highlights for "walking_to_beach" or "beach_close"
- `private_pool`: check highlights for "private_pool" or amenities containing "private pool"
- `washer`: check amenities for "washer" or equipment array
- `condo_pool`: property_type === "condo" AND amenities includes "pool"

### 4. Sync Ribbon Categories with Database

Add missing `property_highlight` values to `lookup_values` if not already present:
- `walk_to_beach` (already exists as "walking_to_beach")
- `private_pool` (already exists)
- `washer` (exists in amenities as "washer")

No new DB records needed -- just map the ribbon to existing data.

### 5. Search Bar Summary Text

Update the collapsed pill to show the most relevant info:
- "Villa in Bangtao" instead of generic "Anywhere in Phuket"
- "2 BR, pool, beachfront" as subtitle when filters selected

## Technical Details

### Files to modify:
- `src/components/property/PropertyCategoryIcons.ribbon.tsx` -- new category list + icons
- `src/components/property/PropertyCategoryIcons.tsx` -- update `matchesCategory()` function
- `src/components/property/AirbnbSearchBar.tsx` -- restructure mobile tabs, rename "Location" to "Beach / Area", reorder property tab, update summary text
- `src/pages/property/PropertyIndex.tsx` -- minor label updates

### No database changes required
All filtering data already exists in the `properties` table (amenities, highlights, property_type, district) and `lookup_values` table.

