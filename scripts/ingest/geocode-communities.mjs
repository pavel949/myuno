#!/usr/bin/env node
// Geocode top-20 communities via Google Places API (New) text search through Lovable gateway.
// Writes lat/lng/google_place_id/address back into public.communities.
import pg from 'pg';

const GATEWAY = 'https://connector-gateway.lovable.dev/google_maps';
const LOVABLE_API_KEY = process.env.LOVABLE_API_KEY;
const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY;
if (!LOVABLE_API_KEY || !GOOGLE_MAPS_API_KEY) {
  console.error('Missing LOVABLE_API_KEY or GOOGLE_MAPS_API_KEY');
  process.exit(1);
}

// Curated top-20: 11 Phuket religious + 1 Phuket consulate + 8 key Bangkok embassies.
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

async function geocode(query) {
  const res = await fetch(`${GATEWAY}/places/v1/places:searchText`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${LOVABLE_API_KEY}`,
      'X-Connection-Api-Key': GOOGLE_MAPS_API_KEY,
      'Content-Type': 'application/json',
      'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress,places.location',
    },
    body: JSON.stringify({ textQuery: query, maxResultCount: 1, regionCode: 'TH' }),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`);
  const data = await res.json();
  return data.places?.[0] ?? null;
}

const client = new pg.Client();
await client.connect();

let ok = 0, fail = 0;
for (const t of TARGETS) {
  try {
    const place = await geocode(t.query);
    if (!place?.location) { console.warn(`✗ ${t.slug}: no result`); fail++; continue; }
    const { latitude: lat, longitude: lng } = place.location;
    const addr = place.formattedAddress || null;
    const pid = place.id || null;
    const r = await client.query(
      `UPDATE public.communities
         SET lat = $1, lng = $2, google_place_id = $3,
             address = COALESCE(address, $4),
             verified_at = COALESCE(verified_at, now())
       WHERE slug = $5
       RETURNING id`,
      [lat, lng, pid, addr, t.slug]
    );
    if (r.rowCount === 0) { console.warn(`✗ ${t.slug}: slug not found`); fail++; continue; }
    console.log(`✓ ${t.slug}  ${lat.toFixed(5)}, ${lng.toFixed(5)}`);
    ok++;
    await new Promise(r => setTimeout(r, 150));
  } catch (e) {
    console.error(`✗ ${t.slug}: ${e.message}`);
    fail++;
  }
}
await client.end();
console.log(`\nDone: ${ok} ok, ${fail} failed`);
