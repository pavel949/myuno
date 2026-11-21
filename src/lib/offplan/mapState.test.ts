import { describe, expect, it } from 'vitest';
import { offplanProjectMapPosition, parseOffplanMapViewport, serializeOffplanMapViewport } from './mapState';

describe('off-plan map state', () => {
  it('round trips a bounded viewport with stable precision', () => {
    const encoded = serializeOffplanMapViewport({ lat: 8.01001, lng: 98.30002, zoom: 13.54 });
    expect(encoded).toBe('8.01001,98.30002,13.54');
    expect(parseOffplanMapViewport(encoded!)).toEqual({ lat: 8.01001, lng: 98.30002, zoom: 13.54 });
  });
  it.each([null, '', '8,98.3,23', '8,98.3,-1', '0,0,12', '8,99,13', '8,,13', '8,98.3,NaN', '8,98.3,1e1', '8,98.3,10,14'])('ignores invalid URLs: %s', raw => {
    expect(parseOffplanMapViewport(raw)).toBeUndefined();
  });
  it('rejects incomplete, out-of-coverage and non-finite recorded coordinates', () => {
    expect(offplanProjectMapPosition({ lat: 8, lng: 98.34 })).toEqual({ lat: 8, lng: 98.34 });
    for (const project of [{ lat: 8 }, { lat: null, lng: 98.34 }, { lat: 0, lng: 0 }, { lat: 9, lng: 98.3 }, { lat: Infinity, lng: 98.3 }]) {
      expect(offplanProjectMapPosition(project)).toBeUndefined();
    }
    expect(serializeOffplanMapViewport({ lat: 8, lng: 98.34, zoom: Infinity })).toBeUndefined();
  });
});
