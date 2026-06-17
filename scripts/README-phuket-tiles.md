# Phuket offline vector tiles

The `/map` route renders via [MapLibre GL JS](https://maplibre.org). It has two tile sources:

| Mode | Source | Offline? |
| --- | --- | --- |
| **Default** (no env var) | [OpenFreeMap Liberty](https://openfreemap.org) — free public MapLibre vector tiles, no API key, no Google | Online only |
| **Offline-ready** | Self-hosted `phuket.pmtiles` from Supabase Storage | Yes (browser HTTP cache + future PWA precache) |

## How to enable offline mode

1. **Build the tiles** (one-off, requires `osmium-tool`, `tilemaker`, `go-pmtiles`):

   ```bash
   bash scripts/build-phuket-tiles.sh
   ```

   Output: `dist-tiles/phuket.pmtiles` (~25–40 MB, zoom 6–14, covers the whole island down to street level).

2. **Upload to Supabase Storage**:
   - Create a **public** bucket named `map-tiles`
   - Upload `phuket.pmtiles` to the root
   - Copy the public URL: `https://<project-ref>.supabase.co/storage/v1/object/public/map-tiles/phuket.pmtiles`

3. **Set the env var**:

   ```env
   VITE_PHUKET_PMTILES_URL=https://kakkwibljrjsawxgnupk.supabase.co/storage/v1/object/public/map-tiles/phuket.pmtiles
   ```

4. **Rebuild**. MapLibre will switch to the local style backed by pmtiles via HTTP range requests, and the browser will cache the file. The current service worker is a kill-switch worker, so true PWA precache for tiles will land when we re-introduce an app-shell SW; range-request browser cache already gives offline behaviour after the first visit.

## Why pmtiles, not raw mbtiles

`mbtiles` is a SQLite file — it needs a server to convert SQL queries into tile responses. `pmtiles` is a single binary that browsers fetch in slices via HTTP range requests, so any static host (Supabase Storage, S3, Cloudflare R2) works.

## License

Tiles are derived from OpenStreetMap data, licensed under [ODbL](https://www.openstreetmap.org/copyright). The attribution `© OpenStreetMap contributors` is rendered on the map.
