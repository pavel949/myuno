/**
 * Guards the property taxonomy single-source-of-truth.
 *
 * The marketplace property vertical spec (`vertical-specs/property.ts`) must derive
 * its property-type and amenity options from the canonical sources
 * (`propertyTaxonomy.PROPERTY_TYPES` + `propertyAttributeRegistry`), not from local
 * literals. This test fails if anyone re-introduces a divergent hardcoded list.
 */

import { describe, it, expect } from 'vitest';
import { propertySpec } from '@/lib/vertical-specs/property';
import { PROPERTY_TYPES } from '@/lib/propertyTaxonomy';
import { ALL_LISTING_AMENITY_UI_ITEMS } from '@/lib/propertyAttributeRegistry';
import type { FieldSpec } from '@/lib/vertical-specs/types';

/** Find the first field with `key` across onboarding steps and editor tabs. */
function findField(key: string): FieldSpec | undefined {
  const onboardingFields = propertySpec.onboarding.flatMap((s) =>
    s.groups.flatMap((g) => g.fields),
  );
  const editorFields = propertySpec.editorTabs.flatMap((t) =>
    t.groups.flatMap((g) => g.fields),
  );
  return [...onboardingFields, ...editorFields].find((f) => f.key === key);
}

describe('Property taxonomy unification', () => {
  it('property_type options match the canonical PROPERTY_TYPES', () => {
    const field = findField('property_type');
    expect(field, 'property_type field missing from spec').toBeDefined();

    const specValues = (field!.options ?? []).map((o) => o.value).sort();
    const canonicalValues = PROPERTY_TYPES.map((t) => t.id).sort();
    expect(specValues).toEqual(canonicalValues);
  });

  it('amenities options match the canonical registry', () => {
    const field = findField('amenities');
    expect(field, 'amenities field missing from spec').toBeDefined();

    const specValues = (field!.options ?? []).map((o) => o.value).sort();
    const canonicalValues = ALL_LISTING_AMENITY_UI_ITEMS.map((a) => a.id).sort();
    expect(specValues).toEqual(canonicalValues);
  });

  it('canonical PROPERTY_TYPES has no duplicate ids', () => {
    const ids = PROPERTY_TYPES.map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
