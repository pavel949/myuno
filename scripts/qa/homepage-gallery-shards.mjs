// Same full matrix, bounded independent jobs; the aggregate rejects omissions.
import { spawnSync } from 'node:child_process';
export function runGalleryShard(language, output) {
  if (!['en', 'ru', 'th'].includes(language)) throw Error('Unknown gallery language shard');
  const env = { ...process.env, HOME_GALLERY_SHARD: language, HOME_GALLERY_OUTPUT: output };
  delete env.HOME_GALLERY_WIDTHS;
  const result = spawnSync(process.execPath, ['scripts/qa/homepage-galleries-ui.mjs'], { env, stdio: 'inherit' });
  process.exitCode = result.status ?? 1;
}
