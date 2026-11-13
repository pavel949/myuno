import { describe, expect, it } from 'vitest';
import { driveImportContentHash, normalizeDriveUnit, normalizeDriveUnits } from '../../../supabase/functions/_shared/drive-import-normalization';

const source = { id: 'drive-file-1', name: 'synthetic-price.pdf', modifiedTime: '2026-11-12T00:00:00Z', webViewLink: 'https://example.invalid/source' };

describe('Drive unit normalization', () => {
  it('keeps a missing status unknown and requires manual review', () => {
    const unit = normalizeDriveUnit({ unit_code: 'A-01', unit_type: '1BR', price: 5000000, currency: 'THB' }, source);
    expect(unit.status).toBe('unknown');
    expect(unit.needs_review).toBe(true);
    expect(unit.review_reasons).toContain('missing_status');
    expect(unit._source_file_id).toBe('drive-file-1');
  });

  it('does not turn an unrecognized source status into availability', () => {
    const unit = normalizeDriveUnit({ unit_code: 'A-01', unit_type: '1BR', status: 'contact us' }, source);
    expect(unit.status).toBe('unknown');
    expect(unit.review_reasons).toContain('unrecognized_status');
  });

  it('retains explicit statuses without marking them for status review', () => {
    for (const status of ['available', 'reserved', 'sold', 'held']) {
      const unit = normalizeDriveUnit({ unit_code: 'A-01', unit_type: '1BR', status }, source);
      expect(unit.status).toBe(status);
      expect(unit.needs_review).toBe(false);
    }
  });

  it('quarantines duplicate codes and missing currency instead of inventing values', () => {
    const units = normalizeDriveUnits([
      { unit_code: 'a-01', unit_type: '1BR', status: 'available', price: 100 },
      { unit_code: 'A-01', unit_type: '2BR', status: 'sold', price: 200 },
    ], source);
    expect(units.every(unit => unit.review_reasons.includes('duplicate_unit_code'))).toBe(true);
    expect(units.every(unit => unit.review_reasons.includes('missing_or_invalid_currency'))).toBe(true);
    expect(units.every(unit => unit.currency === null)).toBe(true);
  });

  it('produces stable hashes independent of object key order', async () => {
    await expect(driveImportContentHash({ b: 2, a: 1 })).resolves.toBe(await driveImportContentHash({ a: 1, b: 2 }));
  });
});
