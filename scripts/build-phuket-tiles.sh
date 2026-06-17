#!/usr/bin/env bash
# Build offline vector tiles for Phuket and convert to a single .pmtiles file.
#
# Output: dist-tiles/phuket.pmtiles (~25–40 MB, z6–z14)
#
# Pipeline:
#   Geofabrik thailand-latest.osm.pbf
#     ↓ osmium extract (Phuket bbox)
#   phuket.osm.pbf (~15 MB)
#     ↓ tilemaker (OpenMapTiles schema)
#   phuket.mbtiles
#     ↓ pmtiles convert
#   phuket.pmtiles
#
# Run once locally or in CI. Upload the result to Supabase Storage
# (bucket: map-tiles, public) and set in your .env:
#   VITE_PHUKET_PMTILES_URL=https://<project>.supabase.co/storage/v1/object/public/map-tiles/phuket.pmtiles
#
# Requires (install via nix or your package manager):
#   - osmium-tool
#   - tilemaker
#   - go-pmtiles  (https://github.com/protomaps/go-pmtiles)
#   - curl
#
# Usage:
#   bash scripts/build-phuket-tiles.sh

set -euo pipefail

OUT_DIR="${OUT_DIR:-dist-tiles}"
mkdir -p "$OUT_DIR"
cd "$OUT_DIR"

# 1. Download Thailand extract (≈700 MB, cached locally).
if [ ! -f thailand-latest.osm.pbf ]; then
  echo "→ Downloading thailand-latest.osm.pbf from Geofabrik (~700 MB)…"
  curl -L -o thailand-latest.osm.pbf https://download.geofabrik.de/asia/thailand-latest.osm.pbf
fi

# 2. Crop to Phuket bbox (lon_min,lat_min,lon_max,lat_max).
echo "→ Extracting Phuket bbox…"
osmium extract \
  --bbox 98.20,7.70,98.55,8.25 \
  --strategy complete_ways \
  -o phuket.osm.pbf \
  --overwrite \
  thailand-latest.osm.pbf

# 3. Build vector mbtiles using tilemaker's default OpenMapTiles profile.
echo "→ Building vector tiles (z6–z14)…"
tilemaker \
  --input phuket.osm.pbf \
  --output phuket.mbtiles \
  --bbox 98.20,7.70,98.55,8.25

# 4. Convert mbtiles → pmtiles (single file, HTTP range-requestable).
echo "→ Converting to pmtiles…"
pmtiles convert phuket.mbtiles phuket.pmtiles --force

echo
echo "✅ Done: $(pwd)/phuket.pmtiles"
ls -lh phuket.pmtiles
echo
echo "Next: upload to Supabase Storage bucket 'map-tiles' (public),"
echo "then set VITE_PHUKET_PMTILES_URL in your .env."
