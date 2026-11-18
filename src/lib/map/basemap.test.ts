import { describe, expect, it } from 'vitest';
import { isPmtilesArchiveUrl, resolvePmtilesUrl, isValidMapPosition, isInPhuketMapCoverage } from './basemap';

describe('basemap source admission', () => {
  it('preserves the byte-verified bundled PMTiles archive despite its ZIP suffix', () => {
    expect(resolvePmtilesUrl(undefined, '/__l5e/assets-v1/archive/phuket.zip')).toBe('/__l5e/assets-v1/archive/phuket.zip');
  });
  it('admits actual archive paths with query parameters', () => {
    expect(resolvePmtilesUrl('https://cdn.example/phuket.pmtiles?v=2', '/old.zip')).toBe('https://cdn.example/phuket.pmtiles?v=2');
    expect(isPmtilesArchiveUrl('/map/phuket.pmtiles')).toBe(true);
  });
  it('rejects unsafe protocols and empty configuration', () => {
    for (const value of ['', null, 'javascript:alert(1)', 'data:application/octet-stream;base64,AA==']) {
      expect(isPmtilesArchiveUrl(value)).toBe(false);
    }
  });
  it('validates coordinate bounds without inventing a position', () => {
    expect(isValidMapPosition(7.98, 98.31)).toBe(true);
    for (const [lat, lng] of [[NaN, 98], [7, Infinity], [91, 98], [7, 181], [0, 0]]) {
      expect(isValidMapPosition(lat, lng)).toBe(false);
    }
  });
  it('uses the real Phuket archive bounds, excluding Bangkok without relocating it', () => {
    expect(isInPhuketMapCoverage(7.7, 98.2)).toBe(true);
    expect(isInPhuketMapCoverage(8.25, 98.55)).toBe(true);
    expect(isInPhuketMapCoverage(7.98, 98.31)).toBe(true);
    expect(isInPhuketMapCoverage(13.75, 100.52)).toBe(false);
    expect(isInPhuketMapCoverage(8.251, 98.4)).toBe(false);
    expect(isInPhuketMapCoverage(NaN, 98.4)).toBe(false);
  });

});
