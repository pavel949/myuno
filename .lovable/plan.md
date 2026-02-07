

# Airbnb-style Address Autocomplete for Airport Transfer

## Problem
The current `AddressAutocomplete` only searches a small list of local property projects and 8 hardcoded areas. Users can't find their specific hotel, villa, or address -- making the transfer booking incomplete.

## Solution
Replace with a Mapbox Geocoding-powered autocomplete (like Airbnb/Grab), proxied through a backend function to keep the API token secure.

## Architecture

```text
User types "Hilton Pat..."
       |
       v
AddressAutocomplete (debounced 300ms)
       |
       v
Edge Function: geocode-address
  - Calls Mapbox Geocoding API
  - Scoped to Phuket (proximity + bbox)
  - Returns top 5 results
       |
       v
Dropdown: Mapbox results + DB projects + popular areas
```

## Implementation Steps

### 1. Create Edge Function `geocode-address`
- Accepts `query` param and optional `language` (en/ru)
- Calls `https://api.mapbox.com/geocoding/v5/mapbox.places/{query}.json` with:
  - `proximity=98.3923,7.8804` (Phuket center)
  - `bbox=98.2,7.7,98.5,8.2` (Phuket bounds)
  - `types=poi,address,place` (hotels, addresses, areas)
  - `limit=5`
  - `language` param
- Returns simplified results: `{ id, name, address, lat, lng, type }`
- Rate-limited using existing `_shared/rate-limit.ts`

### 2. Rebuild `AddressAutocomplete` Component
- **Debounced input** (300ms) triggers the edge function when query >= 2 chars
- **Three result sections** in dropdown:
  1. Mapbox geocoding results (hotels, addresses, POIs)
  2. Property projects from DB (existing `usePropertyProjects`)
  3. Popular areas (static fallback, shown when empty)
- **"Use my location" button** -- reverse geocodes via the same edge function
- **Manual typing allowed** -- user can just type a free-text address and submit without selecting a suggestion
- Icons: MapPin for geocoded places, Building2 for DB projects, Navigation for "my location"

### 3. Update AirportTransferBooking
- Swap old `AddressAutocomplete` import for the rebuilt version (same file, no import changes needed)
- The `destinationAddress` state continues to work as-is

## Technical Details

### Edge Function Response Shape
```typescript
interface GeocodeSuggestion {
  id: string;
  name: string;      // "Hilton Phuket Arcadia"
  address: string;   // "333 Patak Rd, Karon, Phuket"
  lat: number;
  lng: number;
  type: 'poi' | 'address' | 'place';
}
```

### Debounce Strategy
- < 2 characters: show popular areas + DB projects only (no API call)
- >= 2 characters: fire geocoding request after 300ms idle
- Loading spinner in input while fetching

### Mobile UX
- Dropdown uses `max-h-[60vh]` with `overflow-y-auto touch-pan-y`
- Large touch targets (48px rows)
- Keyboard-friendly: dropdown closes on blur outside

