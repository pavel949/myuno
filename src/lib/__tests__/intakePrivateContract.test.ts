import { describe, expect, it } from 'vitest';
import { makeIntakePath, parseIntakePaths, publicIntakeImages, hasPrivateIntakeReference, validateIntakeFileMetadata, validateIntakeBytes } from '../../../supabase/functions/_shared/intake-private-contract';

const actor = '11111111-1111-4111-8111-111111111111';
const other = '22222222-2222-4222-8222-222222222222';
const file = '33333333-3333-4333-8333-333333333333';
describe('private intake contract', () => {
  it('uses opaque actor-owned paths without original names', () => {
    const path = makeIntakePath(actor, file, 'png');
    expect(parseIntakePaths(actor, [path])).toEqual([path]);
    expect(() => parseIntakePaths(other, [path])).toThrow();
    expect(() => parseIntakePaths(actor, [path, path])).toThrow();
  });
  it.each(['https://example.test/x.png', actor + '/../x.png', actor + '/a.png', actor + '/' + file + '.pdf', actor + '/' + file + '.constructor', actor + '/' + file + '.png?token=a'])('rejects unsafe path %s', (path) => {
    expect(() => parseIntakePaths(actor, [path])).toThrow();
  });
  it('rejects unsupported files and oversized batches before upload', () => {
    expect(validateIntakeFileMetadata([{ name: 'example.CSV', size: 20 }])).toEqual(['csv']);
    expect(() => validateIntakeFileMetadata([{ name: 'file.pdf', size: 10 }])).toThrow();
    expect(() => validateIntakeFileMetadata([{ name: 'file.png', size: 0 }])).toThrow();
    expect(() => validateIntakeFileMetadata(Array.from({ length: 5 }, () => ({ name: 'file.png', size: 5 * 1024 * 1024 })))).toThrow();
  });
  it('rejects invalid bytes and accepts supported content signatures', () => {
    expect(() => validateIntakeBytes('image/png', new Uint8Array([137,80,78,71,13,10,26,10]))).not.toThrow();
    expect(() => validateIntakeBytes('image/png', new TextEncoder().encode('not an image'))).toThrow();
    expect(() => validateIntakeBytes('text/plain', new Uint8Array([255,0,255]))).toThrow();
    expect(() => validateIntakeBytes('text/csv', new TextEncoder().encode('name,price\nVilla,10'))).not.toThrow();
  });
  it('never admits legacy or signed intake URLs as listing media', () => {
    const legacy = 'https://project.test/storage/v1/object/public/intake-uploads/intake/test.jpg';
    const signed = 'https://project.test/storage/v1/object/sign/intake%252Duploads/file?token=redacted';
    expect(publicIntakeImages([legacy, signed, 'https://project.test/storage/v1/object/public/property-images/ok.jpg'])).toEqual(['https://project.test/storage/v1/object/public/property-images/ok.jpg']);
    expect(hasPrivateIntakeReference({ images: [signed] })).toBe(true);
    expect(hasPrivateIntakeReference('intake-private:' + actor + '/' + file + '.png')).toBe(true);
    expect(hasPrivateIntakeReference('data:image/png;base64,AAAA')).toBe(true);
    expect(hasPrivateIntakeReference(actor + '/' + file + '.png')).toBe(true);
  });
});
