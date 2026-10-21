#!/usr/bin/env node
// Geocode top-20 communities via Google Places API (New) text search.
// Uses Referer: https://myuno.app/ to satisfy the referrer-restricted API key.
import { execFileSync } from 'node:child_process';

const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY;
if (!GOOGLE_MAPS_API_KEY) { console.error('Missing GOOGLE_MAPS_API_KEY'); process.exit(1); }

const TARGETS = [
  { slug: 'wat-chalong', query: 'Wat Chalong, Phuket, Thailand' },
  { slug: 'big-buddha-phuket', query: 'Big Buddha Phuket, Thailand' },
  { slug: 'wat-phra-thong', query: 'Wat Phra Thong, Thalang, Phuket, Thailand' },
  { slug: 'wat-srisoonthorn', query: 'Wat Srisoonthorn, Thalang, Phuket, Thailand' },
  { slug: 'jui-tui-shrine', query: 'Jui Tui Shrine, Phuket Town, Thailand' },
  { slug: 'cathedral-immaculate-conception-phuket', query: 'Immaculate Conception Cathedral, Phuket Town, Thailand' },
  { slug: 'phuket-christian-centre', query: 'Phuket Christian Centre, Phuket, Thailand' },
  { slug: 'rcc-phuket', query: 'Russian Orthodox Parish Holy Trinity, Phuket, Thailand' },
  { slug: 'masjid-mukaram-phuket-town', query: 'Masjid Mukaram, Phuket Town, Thailand' },
  { slug: 'masjid-mukaram-bangtao', query: 'Masjid Mukaram, Bang Tao, Phuket, Thailand' },
  { slug: 'masjid-nurul-iman-kamala', query: 'Masjid Nurul Iman, Kamala, Phuket, Thailand' },
  { slug: 'consulate-au-phuket', query: 'Australian Consulate Phuket, Thailand' },
  { slug: 'embassy-ru-bangkok', query: 'Embassy of Russia in Bangkok, Thailand' },
  { slug: 'embassy-cn-bangkok', query: 'Embassy of China in Bangkok, Thailand' },
  { slug: 'embassy-us-bangkok', query: 'Embassy of the United States in Bangkok, Thailand' },
  { slug: 'embassy-gb-bangkok', query: 'British Embassy Bangkok, Thailand' },
  { slug: 'embassy-de-bangkok', query: 'Embassy of Germany in Bangkok, Thailand' },
  { slug: 'embassy-fr-bangkok', query: 'Embassy of France in Bangkok, Thailand' },
  { slug: 'embassy-in-bangkok', query: 'Embassy of India in Bangkok, Thailand' },
  { slug: 'embassy-jp-bangkok', query: 'Embassy of Japan in Bangkok, Thailand' },
];

function geocode(query) {
  const body = JSON.stringify({ textQuery: query, maxResultCount: 1, regionCode: 'TH' });
  const out = execFileSync('curl', [
    '-s', '-X', 'POST', 'https://places.googleapis.com/v1/places:searchText',
    '-H', `X-Goog-Api-Key: ${GOOGLE_MAPS_API_KEY}`,
    '-H', 'Content-Type: application/json',
    '-H', 'Referer: https://myuno.app/',
    '-H', 'X-Goog-FieldMask: places.id,places.formattedAddress,places.location',
    '--data-binary', body,
  ], { encoding: 'utf8' });
  const data = JSON.parse(out);
  if (data.error) throw new Error(data.error.message);
  return data.places?.[0] ?? null;
}

const esc = (s) => s == null ? 'NULL' : `'${String(s).replace(/'/g, "''")}'`;
const rows = [];
let ok = 0, fail = 0;
for (const t of TARGETS) {
  try {
    const place = geocode(t.query);
    if (!place?.location) { console.warn(`✗ ${t.slug}: no result`); fail++; continue; }
    const { latitude: lat, longitude: lng } = place.location;
    rows.push(`(${esc(t.slug)}, ${lat}, ${lng}, ${esc(place.id)}, ${esc(place.formattedAddress)})`);
    console.log(`✓ ${t.slug}  ${lat.toFixed(5)}, ${lng.toFixed(5)}`);
    ok++;
  } catch (e) {
    console.error(`✗ ${t.slug}: ${e.message}`);
    fail++;
  }
}
if (rows.length) {
  const sql = `
WITH v(slug, lat, lng, place_id, addr) AS (VALUES ${rows.join(',\n')})
UPDATE public.communities c
   SET lat = v.lat::numeric,
       lng = v.lng::numeric,
       google_place_id = v.place_id,
       address = COALESCE(c.address, v.addr),
       verified_at = COALESCE(c.verified_at, now())
  FROM v WHERE c.slug = v.slug;`;
  execFileSync('psql', ['-v', 'ON_ERROR_STOP=1', '-c', sql], { stdio: 'inherit' });
}
console.log(`\nDone: ${ok} ok, ${fail} failed`);
