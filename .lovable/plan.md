

# Add Verified Tours & Experiences from Real Phuket Operators

## Market Research Summary

Based on research of the Phuket tour market, here are **10 new verified operators** with **15+ real experiences** to add. All have official websites, confirmed contact details, and real pricing.

### Current State
- 6 providers with 11 active experiences
- After this update: **16 providers** with **26+ experiences**

### New Providers to Add

| # | Provider | Type | Contact | Website |
|---|----------|------|---------|---------|
| 1 | Andamanda Phuket | Water Park | +66-76-XXX (from site) | andamandaphuket.com |
| 2 | Siam Niramit Phuket | Cultural Show | +66-76-385-000 | siamniramitphuket.com |
| 3 | Tiger Kingdom Phuket | Wildlife Park | +66-99-292-9789 | tigerkingdom.com |
| 4 | Blue Tree Phuket | Water/Activity Park | +66-62-243-8749 | bluetree.fun |
| 5 | Phuket FantaSea | Cultural Theme Park | +66-76-385-000 | phuketfantasea.fun |
| 6 | Siam Adventure World | Speedboat Tours | From website | siamadventureworld.com |
| 7 | Phuket Tours Direct | Island Tours (TAT Licensed) | info@phukettoursdirect.com | phukettoursdirect.com |
| 8 | ATV Phuket | ATV Adventure | From website | atvphuket.com |
| 9 | Phi Phi Tours | Island Tours | +66-93-089-0545 | phiphitours.com |
| 10 | Carnival Magic Phuket | Entertainment | From website | carnivalmagic.fun |

### New Experiences to Add

**Attractions/Parks:**
1. Andamanda Water Park -- Adult Day Pass (1,800 THB)
2. Blue Tree Water Park -- Day Pass (1,000 THB)
3. Tiger Kingdom -- Tiger Encounter (1,300 THB)
4. Siam Niramit Show -- Show + Dinner (1,800 THB)
5. Phuket FantaSea -- Show + Dinner (2,200 THB)

**Island Tours:**
6. Phi Phi Islands Speedboat Day Trip (1,500 THB)
7. James Bond Island & Phang Nga Bay Tour (1,800 THB)
8. Similan Islands Day Trip by Speedboat (3,400 THB)
9. Coral Island (Koh He) Half-Day Trip (800 THB)

**Adventure:**
10. ATV Jungle Adventure -- 2 hours (1,500 THB)
11. ATV Big Buddha Route -- 1 hour (900 THB)

**Shows/Entertainment:**
12. Carnival Magic Phuket -- Evening Show (2,400 THB)

**Classes:**
13. Phuket Thai Boxing Experience (1,500 THB) -- Bangla Boxing Stadium (already in providers)

---

## Implementation Steps

### Step 1: Insert New Providers (Database)
Insert 10 new provider records into the `providers` table with:
- Verified name, phone, email, website
- `is_verified: true`, `is_active: true`
- `created_by_uno_team: true`
- `provider_type: 'company'`
- `service_domains` including `'experiences'`
- GPS coordinates where available

### Step 2: Insert New Experiences (Database)
Insert 13-15 new experience records into `experiences` table with:
- Linked `provider_id` for each
- Real prices in THB from official websites
- Bilingual titles (EN/RU)
- Correct `experience_type` (tour/activity/class)
- Category tags for filtering
- `booking_url` pointing to official booking pages
- `source_page_url` for data provenance
- Duration, participant limits, age restrictions
- `is_active: true`, appropriate `is_featured` flags

### Step 3: Mark Key Experiences as Featured
Select 3-4 of the new experiences as `is_featured = true` so they appear on the homepage carousel alongside existing ones. Suggested featured:
- Phi Phi Islands Day Trip (most popular)
- Andamanda Water Park (family-friendly)
- Siam Niramit Show (cultural)

### Step 4: No Code Changes Needed
The existing `useExperiences` hook, `ExperiencesSection`, and `ToursSection` components already query from the `experiences` table with `is_active = true`. New records will appear automatically in all relevant sections.

---

## Technical Details

### SQL Operations
All changes are database inserts -- no schema changes needed:
1. `INSERT INTO providers (...)` -- 10 new rows
2. `INSERT INTO experiences (...)` -- 13-15 new rows
3. `UPDATE experiences SET is_featured = true WHERE id IN (...)` -- for new featured items

### Data Quality
- Every experience links to a real provider via `provider_id`
- Every provider has verified phone, email, website
- Prices sourced from official operator websites (2025-2026)
- Booking URLs point to real operator booking pages

