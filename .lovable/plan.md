

# Plan: Connect Google Maps Key from system_config to Frontend

## Problem
The `GOOGLE_MAPS_API_KEY` is configured as a backend secret but the frontend has no access to it. The `system_config` table exists but no code reads the key from it. All map components check `VITE_GOOGLE_MAPS_API_KEY` which is empty.

## Solution
Two-step approach:

### 1. Seed the Google Maps key into `system_config`
- Create an edge function call or use the admin panel to copy the backend `GOOGLE_MAPS_API_KEY` value into `system_config`
- Add a new edge function `sync-maps-key` that reads the secret and writes it to `system_config` (admin-only, one-time operation)

### 2. Make the frontend read from `system_config` dynamically
- **Modify `src/lib/googleMaps.ts`**: Add an async function `fetchGoogleMapsKey()` that queries `system_config` for `GOOGLE_MAPS_API_KEY`, with fallback to `VITE_GOOGLE_MAPS_API_KEY`
- **Modify `src/contexts/GoogleMapsContext.tsx`**: On mount, fetch the key from `system_config` before calling `useJsApiLoader`. Store it in state. Only load the Google Maps script once the key is available
- **Result**: `useGoogleGeocode`, `usePlacesDetails`, `ProjectLocationPicker`, `AddressPickerInput` — all work automatically since they consume the context and the shared key

### Files to Modify

| File | Change |
|------|--------|
| `src/lib/googleMaps.ts` | Add `fetchGoogleMapsKey()` that reads from `system_config`, export mutable key getter |
| `src/contexts/GoogleMapsContext.tsx` | Fetch key on mount from DB, then load Google Maps script |
| `src/hooks/useGoogleGeocode.ts` | Use dynamic key getter instead of static import |
| `src/hooks/usePlacesDetails.ts` | Use dynamic key getter instead of static import |
| `src/pages/owner/AddProperty.tsx` | Use dynamic key for static map preview |
| `supabase/functions/sync-maps-key/index.ts` | Create: admin-only function that copies `GOOGLE_MAPS_API_KEY` secret → `system_config` row |

### How It Works End-to-End
1. Admin hits "Sync" button (or we auto-call the edge function) → backend secret value gets written to `system_config` table
2. On app load, `GoogleMapsProvider` fetches key from `system_config`
3. Once key is available, Google Maps JS script loads
4. Property creation → `ProjectLocationPicker` opens → map renders → click/search → address auto-fills via geocoding

