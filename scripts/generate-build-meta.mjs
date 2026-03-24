import { execSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';

function getGitSha() {
  try {
    return execSync('git rev-parse --short HEAD', { encoding: 'utf8' }).trim();
  } catch {
    return 'nogit';
  }
}

const buildTime = new Date().toISOString();
const sha = getGitSha();
const version = `3.40.0+${sha}.${buildTime.replace(/[-:TZ.]/g, '').slice(0, 14)}`;

const root = process.cwd();
const buildMetaPath = join(root, '.build-meta.json');
const publicVersionPath = join(root, 'public', 'version.json');

const payload = { version, buildTime, sha };
const content = `${JSON.stringify(payload, null, 2)}\n`;

writeFileSync(buildMetaPath, content, 'utf8');
writeFileSync(publicVersionPath, `${JSON.stringify({ version, buildTime }, null, 2)}\n`, 'utf8');

console.log(`[build-meta] version=${version}`);
