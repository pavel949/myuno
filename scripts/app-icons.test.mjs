import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
test('PWA icons are opaque, correctly sized and retain the installed app identity', () => {
  const manifest = JSON.parse(readFileSync('public/manifest.webmanifest', 'utf8'));
  assert.equal(manifest.id, '/myuno-pwa-2025');
  assert.equal(manifest.start_url, '/?source=pwa');
  for (const icon of manifest.icons) {
    const png = readFileSync('public' + icon.src);
    const size = Number(icon.sizes.split('x')[0]);
    assert.equal(png.subarray(1, 4).toString(), 'PNG');
    assert.equal(png.readUInt32BE(16), size); assert.equal(png.readUInt32BE(20), size);
    assert.ok(![4, 6].includes(png[25]), 'App icon must not have an alpha channel');
    assert.ok(icon.src.includes('v2-'), 'Changed artwork needs a fresh manifest URL');
    assert.ok(readFileSync('vite.config.ts', 'utf8').includes(icon.src), 'Vite and static manifest must use the same icons');
  }
  const html = readFileSync('index.html', 'utf8');
  assert.ok(html.includes('/icons/myuno-v2-180.png')); assert.ok(html.includes('/icons/myuno-v2-32.png'));
});
