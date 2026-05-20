/**
 * Playwright globalSetup / globalTeardown for marketplace e2e tests.
 *
 * Seeds 1 listing per bookable vertical into `public.listings` (or vertical-
 * specific tables for `properties` / `events`) with metadata flag
 * `e2e_seed=true` + `e2e_run_id=<unique>` for safe cleanup.
 *
 * IMPORTANT: gracefully no-ops when SUPABASE_SERVICE_ROLE_KEY is missing,
 * so the existing non-marketplace e2e suite keeps running locally.
 */
import type { FullConfig } from '@playwright/test';
import { getServiceClient } from './serviceClient';
import { BOOKABLE_VERTICALS, E2E_RUN_ID, E2E_SEED_MARKER } from './marketplaceVerticals';
import { TEST_USERS } from './testUsers';

const VENDOR_ID = TEST_USERS.vendor.id;

interface SeedResult {
  vertical: string;
  table: string;
  id: string;
}

async function seedListing(spec: typeof BOOKABLE_VERTICALS[number]): Promise<SeedResult | null> {
  const supabase = getServiceClient();
  const metadata = {
    [E2E_SEED_MARKER]: true,
    e2e_run_id: E2E_RUN_ID,
    e2e_vertical: spec.id,
  };

  // PROPERTY → properties table
  if (spec.id === 'property') {
    const { data, error } = await supabase
      .from('properties')
      .insert({
        name: `E2E Test Property ${E2E_RUN_ID}`,
        slug: `e2e-property-${Date.now()}`,
        owner_id: VENDOR_ID,
        property_type: 'apartment',
        status: 'active',
        is_published: true,
        base_price: 2500,
        currency: 'THB',
        bedrooms: 1,
        bathrooms: 1,
        max_guests: 2,
        address: 'E2E Seed Address, Phuket',
        latitude: 7.8804,
        longitude: 98.3923,
        metadata,
      })
      .select('id')
      .single();
    if (error) {
      console.warn(`[seed] property failed: ${error.message}`);
      return null;
    }
    return { vertical: 'property', table: 'properties', id: data.id };
  }

  // EVENT → events table
  if (spec.id === 'event') {
    const start = new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString();
    const { data, error } = await supabase
      .from('events')
      .insert({
        title: `E2E Event ${E2E_RUN_ID}`,
        slug: `e2e-event-${Date.now()}`,
        organizer_id: VENDOR_ID,
        status: 'published',
        start_at: start,
        venue_name: 'E2E Venue',
        capacity: 50,
        ticket_price: 500,
        currency: 'THB',
        metadata,
      })
      .select('id')
      .single();
    if (error) {
      console.warn(`[seed] event failed: ${error.message}`);
      return null;
    }
    return { vertical: 'event', table: 'events', id: data.id };
  }

  // All other verticals → unified `listings` table
  const { data, error } = await supabase
    .from('listings')
    .insert({
      vertical: spec.id,
      vendor_id: VENDOR_ID,
      title_en: `E2E ${spec.labelEn} ${E2E_RUN_ID}`,
      title_ru: `E2E ${spec.labelRu} ${E2E_RUN_ID}`,
      description_en: 'E2E seed listing — safe to delete',
      description_ru: 'Тестовый листинг — безопасно удалить',
      status: 'active',
      is_published: true,
      base_price: 1000,
      currency: 'THB',
      latitude: 7.88 + Math.random() * 0.05,
      longitude: 98.39 + Math.random() * 0.05,
      attributes: { e2e: true },
      metadata,
    })
    .select('id')
    .single();
  if (error) {
    console.warn(`[seed] listing ${spec.id} failed: ${error.message}`);
    return null;
  }
  return { vertical: spec.id, table: 'listings', id: data.id };
}

export default async function globalSetup(_config: FullConfig) {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.warn('[e2e] SUPABASE_SERVICE_ROLE_KEY not set — skipping marketplace seed');
    process.env.E2E_SEED_SKIPPED = '1';
    return;
  }
  process.env.E2E_RUN_ID = E2E_RUN_ID;
  const results: SeedResult[] = [];
  for (const spec of BOOKABLE_VERTICALS) {
    const r = await seedListing(spec);
    if (r) results.push(r);
  }
  console.log(`[e2e] Seeded ${results.length}/${BOOKABLE_VERTICALS.length} listings (run_id=${E2E_RUN_ID})`);
  process.env.E2E_SEED_RESULTS = JSON.stringify(results);
}
