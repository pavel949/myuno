/**
 * E2E consistency test for intake verticals
 * Verifies that table names are aligned across:
 * 1. INTAKE_VERTICALS (static frontend config)
 * 2. PROVIDER_ID_MAPPING (frontend FK mapping)
 * 3. ALLOWED_TABLES in bulk-import edge function
 * 4. STATIC_VERTICALS in intake-listing-agent edge function
 */

import { describe, it, expect } from 'vitest';
import { INTAKE_VERTICALS } from '@/lib/intakeVerticals';
import { PROVIDER_ID_MAPPING, VALID_INTAKE_TABLES, isValidIntakeTable, getProviderIdField } from '@/lib/providerIdMapping';

// Mirror of STATIC_VERTICALS from intake-listing-agent edge function
// Keep in sync with supabase/functions/intake-listing-agent/index.ts lines 17-38
const EDGE_FUNCTION_STATIC_VERTICALS = [
  { id: 'yachts', table: 'yachts' },
  { id: 'properties', table: 'properties' },
  { id: 'owner_properties', table: 'owner_properties' },
  { id: 'tours', table: 'tours' },
  { id: 'water_activities', table: 'water_activities' },
  { id: 'restaurants', table: 'restaurants' },
  { id: 'salons', table: 'salons' },
  { id: 'clinics', table: 'clinics' },
  { id: 'gyms', table: 'gyms' },
  { id: 'vehicles', table: 'vehicles' },
  { id: 'events', table: 'events' },
  { id: 'babysitters', table: 'babysitters' },
  { id: 'cleaning_services', table: 'cleaning_providers' },
  { id: 'legal_services', table: 'lawyers' },
  { id: 'pet_services', table: 'pet_services' },
  { id: 'education_providers', table: 'education_centers' },
  { id: 'flower_shops', table: 'flower_shops' },
  { id: 'providers', table: 'providers' },
  { id: 'marketplace_products', table: 'marketplace_products' },
  { id: 'marketplace_vendors', table: 'marketplace_vendors' },
];

// Mirror of ALLOWED_TABLES from bulk-import edge function
const BULK_IMPORT_ALLOWED_TABLES = [
  'providers',
  'marketplace_products',
  'marketplace_vendors',
  'vendor_services',
  'yachts',
  'tours',
  'water_activities',
  'restaurants',
  'salons',
  'clinics',
  'gyms',
  'vehicles',
  'babysitters',
  'cleaning_providers',
  'pet_services',
  'lawyers',
  'education_centers',
  'properties',
  'owner_properties',
  'flower_shops',
  'bouquets',
  'user_listings',
  'listings',
  'services',
  'crm_contacts',
];

describe('Intake Vertical Consistency', () => {
  describe('Edge function STATIC_VERTICALS → PROVIDER_ID_MAPPING', () => {
    it.each(EDGE_FUNCTION_STATIC_VERTICALS)(
      '$id (table: $table) must exist in PROVIDER_ID_MAPPING or be "providers"/"marketplace_vendors"/"events"',
      ({ id, table }) => {
        // These tables don't need provider_id mapping (they ARE provider tables or are special)
        const exemptTables = ['providers', 'marketplace_vendors', 'events'];
        if (exemptTables.includes(table)) return;

        expect(
          PROVIDER_ID_MAPPING[table],
          `Table "${table}" (vertical "${id}") missing from PROVIDER_ID_MAPPING`
        ).toBeDefined();
      }
    );
  });

  describe('Edge function STATIC_VERTICALS → bulk-import ALLOWED_TABLES', () => {
    it.each(EDGE_FUNCTION_STATIC_VERTICALS)(
      '$id (table: $table) must be in bulk-import ALLOWED_TABLES',
      ({ id, table }) => {
        // Events table doesn't exist yet — skip
        if (table === 'events') return;

        expect(
          BULK_IMPORT_ALLOWED_TABLES.includes(table),
          `Table "${table}" (vertical "${id}") missing from bulk-import ALLOWED_TABLES`
        ).toBe(true);
      }
    );
  });

  describe('PROVIDER_ID_MAPPING → isValidIntakeTable', () => {
    const tables = Object.keys(PROVIDER_ID_MAPPING);
    it.each(tables)('"%s" in PROVIDER_ID_MAPPING must pass isValidIntakeTable', (table) => {
      expect(isValidIntakeTable(table)).toBe(true);
    });
  });

  describe('Every PROVIDER_ID_MAPPING entry has a valid field', () => {
    const validFields = ['provider_id', 'vendor_id', 'owner_id', 'user_id', 'shop_id'];
    const entries = Object.entries(PROVIDER_ID_MAPPING);

    it.each(entries)('%s has a valid provider field', (table, config) => {
      expect(validFields).toContain(config.field);
      expect(getProviderIdField(table)).toBe(config.field);
    });
  });

  describe('INTAKE_VERTICALS static config consistency', () => {
    it('every vertical has a non-empty id and table', () => {
      for (const v of INTAKE_VERTICALS) {
        expect(v.id).toBeTruthy();
        expect(v.table).toBeTruthy();
      }
    });

    it('no duplicate vertical IDs', () => {
      const ids = INTAKE_VERTICALS.map(v => v.id);
      expect(new Set(ids).size).toBe(ids.length);
    });

    it('every vertical has at least one keyword', () => {
      for (const v of INTAKE_VERTICALS) {
        expect(v.keywords.length, `Vertical "${v.id}" has no keywords`).toBeGreaterThan(0);
      }
    });
  });

  describe('Cross-source ID alignment', () => {
    it('edge function vertical IDs should match INTAKE_VERTICALS IDs', () => {
      const edgeIds = new Set(EDGE_FUNCTION_STATIC_VERTICALS.map(v => v.id));
      const frontendIds = new Set(INTAKE_VERTICALS.map(v => v.id));

      // Every edge function vertical should exist in frontend (or be in an exempt list)
      for (const id of edgeIds) {
        if (id === 'events') continue; // events not in frontend yet
        expect(
          frontendIds.has(id),
          `Edge function vertical "${id}" missing from INTAKE_VERTICALS`
        ).toBe(true);
      }
    });
  });
});
