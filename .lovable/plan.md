

# Audit & Fix: Tours & Experiences Data Integrity

## Summary of Problems Found

### 1. Orphan Records (Critical)
- **75 of 86 experiences** have no `provider_id` -- not linked to any real operator
- **All 29 tours** (legacy `tours` table) have no `provider_id`
- These are generic placeholder entries like "Scuba Diving Adventure", "Sunset Yacht Cruise" with no real operator behind them

### 2. Massive Duplicates
- "Elephant Sanctuary Visit" appears 3 times
- "Thai Cooking Class" -- 2 times  
- "Phi Phi Islands Day Trip" -- 2 times
- "Scuba Diving Adventure" -- 2 times
- "PADI Open Water Course" -- 2 times
- And many more

### 3. Only 11 Real Experiences Exist
Linked to 6 verified providers:
| Provider | Experiences |
|----------|-------------|
| Phuket Elephant Sanctuary | 1 |
| Phuket Elephant Nature Reserve | 1 |
| Hanuman World | 3 (Zipline, Roller Zipline, Skywalk) |
| John Gray's Sea Canoe | 1 |
| Phuket Sail Tours | 3 |
| Phuket Thai Cooking Academy | 2 |

### 4. Provider Contact Data Missing
All 6 providers have `phone: null` and `email: null` -- only websites are filled.

### 5. Admin Email Incorrect
`notify-admin-order` edge function sends to `admin@uno.ae` instead of `pavel@ignatevestate.com`.

### 6. Legacy `tours` Table Still Active
`ToursSection` on the homepage queries the old `tours` table (separate from `experiences`). These 29 tours are all orphan records with no providers.

---

## Implementation Plan

### Step 1: Clean Up Orphan Data
- Deactivate (`is_active = false`) all 75 experiences without `provider_id`
- Deactivate all 29 tours in the legacy `tours` table that have no provider
- This ensures only the 11 verified, provider-linked experiences show in the app

### Step 2: Enrich Provider Contact Info
Research and add real contact data for all 6 providers:
- Phone numbers
- Email addresses  
- WhatsApp numbers (if available)

### Step 3: Fix Admin Email
Update `notify-admin-order` edge function:
- Change `ADMIN_EMAIL` from `admin@uno.ae` to `pavel@ignatevestate.com`
- Confirm `ADMIN_WHATSAPP` is already correct (`66922407355`)

### Step 4: Homepage Section Fix
Update `ToursSection` to either:
- Point to the `experiences` table (filtering by `experience_type = 'tour'`) instead of the legacy `tours` table, OR
- Hide the section if no active tours with providers exist

### Step 5: Seed More Real Experiences (Optional, Recommended)
Add 10-15 more verified Phuket operators to reach a minimum viable catalog:
- Andamanda Water Park
- Blue Tree Phuket  
- Tiger Kingdom
- Siam Niramit
- Phi Phi boat operators (with real booking URLs)
- Similan Island licensed operators
- ATV/Zipline verified providers

Each entry would include: real provider record, booking URL, source page URL, GPS coordinates, pricing from operator website.

---

## Technical Details

### Database Changes (SQL)
1. `UPDATE experiences SET is_active = false WHERE provider_id IS NULL`
2. `UPDATE tours SET is_active = false WHERE provider_id IS NULL`
3. `UPDATE providers SET phone = '...', email = '...' WHERE id IN (...)`

### Edge Function Update
- File: `supabase/functions/notify-admin-order/index.ts`
- Line 32: Change `admin@uno.ae` -> `pavel@ignatevestate.com`

### Frontend Change
- File: `src/components/home/ToursSection.tsx`
- Switch from `useTours()` hook (legacy `tours` table) to `useExperiences()` hook with `experience_type: 'tour'` filter, ensuring only provider-linked tours display

