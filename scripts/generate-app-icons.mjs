// Technical export of the generated ImageGen master; no artwork is redrawn.
// Requires ImageMagick 7 (`magick`). The PWA identity remains unchanged.
import { spawnSync } from 'node:child_process';
import { copyFileSync } from 'node:fs';
const master = 'design/brand/myuno-app-icon-master.png';
function convert(args) {
  const result = spawnSync('magick', [master, '-alpha', 'off', '-strip', ...args], { stdio: 'inherit' });
  if (result.status !== 0) throw new Error('ImageMagick export failed');
}
for (const size of [16, 32, 72, 120, 152, 180, 192, 512]) {
  const output = `public/icons/myuno-v2-${size}.png`;
  convert(['-resize', `${size}x${size}`, output]);
  if (size >= 72) {
    copyFileSync(output, `public/icons/icon-${size}x${size}.png`);
    convert(['-resize', `${size}x${size}`, '-quality', '90', `public/icons/icon-${size}x${size}.webp`]);
  }
}
for (const size of [192, 512]) {
  // The master deliberately keeps the U and sun inside the maskable safe circle.
  copyFileSync(`public/icons/myuno-v2-${size}.png`, `public/icons/myuno-maskable-v2-${size}.png`);
  copyFileSync(`public/icons/myuno-v2-${size}.png`, `public/icons/icon-maskable-${size}.png`);
}
copyFileSync('public/icons/myuno-v2-180.png', 'public/icons/apple-touch-180.png');
convert(['-define', 'icon:auto-resize=64,48,32,16', 'public/favicon.ico']);
