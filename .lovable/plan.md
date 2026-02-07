
# Fix: "Use my location" button -- reverse geocoding

## Problem
The "Use my location" button sends raw coordinates (e.g., `98.39,7.88`) to the `geocode-address` edge function as a text query. The Search Box Suggest API does not support coordinate-based reverse geocoding, so the results are either empty or irrelevant.

## Solution
Add a dedicated reverse geocoding path to the `geocode-address` edge function using Mapbox Geocoding v5 reverse endpoint, and update the frontend to call it correctly.

## Changes

### 1. Edge Function: `supabase/functions/geocode-address/index.ts`
Add support for `lat` and `lng` query parameters. When both are present, use Mapbox Geocoding v5 reverse endpoint instead of Search Box:

```text
GET /geocode-address?lat=7.88&lng=98.39&language=en
  --> https://api.mapbox.com/geocoding/v5/mapbox.places/{lng},{lat}.json
  --> Returns nearest address/POI
```

- Detect reverse mode when `lat` and `lng` params are present
- Call `https://api.mapbox.com/geocoding/v5/mapbox.places/{lng},{lat}.json?types=poi,address&limit=1&language={lang}`
- Return same response shape (`{ results: [{ mapbox_id, name, address, type }] }`)

### 2. Frontend: `src/components/transport/AddressAutocomplete.tsx`
Update `handleUseLocation` to pass `lat` and `lng` as separate query params instead of stuffing coordinates into the `query` param:

```
Before: ?query=98.39,7.88
After:  ?lat=7.88&lng=98.39&language=en
```

## Technical Details

### Edge Function Changes (pseudocode)
```text
if (lat && lng params present):
  call Mapbox Geocoding v5 reverse: /geocoding/v5/mapbox.places/{lng},{lat}.json
  return first result as { mapbox_id, name, address, type }
else:
  existing Search Box suggest logic (unchanged)
```

### Frontend Change
In `handleUseLocation`, replace line 154:
```
const url = `.../geocode-address?lat=${latitude}&lng=${longitude}&language=${language}`;
```

### Files Modified
- `supabase/functions/geocode-address/index.ts` -- add reverse geocoding branch
- `src/components/transport/AddressAutocomplete.tsx` -- fix geolocation URL params
