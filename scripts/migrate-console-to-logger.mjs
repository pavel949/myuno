/**
 * Replace console.* with logger.* and add import { logger } from '@/lib/logger'.
 * Run: node scripts/migrate-console-to-logger.mjs
 *
 * Skips: logger, errorHandler, __test_run__, sw (service worker), test files, src/test
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');

const DIRS = [
  path.join(root, 'src', 'hooks'),
  path.join(root, 'src', 'lib'),
  path.join(root, 'src', 'pages'),
  path.join(root, 'src', 'components'),
  path.join(root, 'src', 'contexts'),
];

const SKIP_BASENAMES = new Set(['logger.ts', 'errorHandler.ts', '__test_run__.ts', 'sw.ts']);

function shouldSkipFile(fullPath) {
  const rel = path.relative(root, fullPath).replace(/\\/g, '/');
  const bn = path.basename(fullPath);
  if (SKIP_BASENAMES.has(bn)) return true;
  if (rel.includes('/src/test/')) return true;
  if (/\.(test|spec)\.(tsx?)$/.test(bn)) return true;
  return false;
}

function walk(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name);
    const st = fs.statSync(full);
    if (st.isDirectory()) {
      if (name === 'node_modules' || name === 'dist') continue;
      walk(full, out);
    } else if (/\.(ts|tsx)$/.test(name)) {
      out.push(full);
    }
  }
  return out;
}

function hasLoggerImport(s) {
  return /from\s+['"]@\/lib\/logger['"]/.test(s);
}

function processFile(filePath) {
  if (shouldSkipFile(filePath)) return false;

  let s = fs.readFileSync(filePath, 'utf8');
  if (!/console\.(log|warn|error|info|debug)\s*\(/.test(s)) return false;

  const hadLogger = hasLoggerImport(s);
  let next = s
    .replace(/\bconsole\.error\b/g, 'logger.error')
    .replace(/\bconsole\.warn\b/g, 'logger.warn')
    .replace(/\bconsole\.log\b/g, 'logger.log')
    .replace(/\bconsole\.info\b/g, 'logger.info')
    .replace(/\bconsole\.debug\b/g, 'logger.debug');

  if (next === s) return false;

  const needsImport = /logger\.(log|warn|error|info|debug)\s*\(/.test(next);
  if (needsImport && !hasLoggerImport(next)) {
    const m = next.match(/^import\s+.+$/m);
    if (m) {
      next = next.replace(m[0], `${m[0]}\nimport { logger } from '@/lib/logger';`);
    } else {
      next = `import { logger } from '@/lib/logger';\n\n${next}`;
    }
  }

  fs.writeFileSync(filePath, next);
  return true;
}

let n = 0;
for (const dir of DIRS) {
  for (const f of walk(dir)) {
    if (shouldSkipFile(f)) continue;
    if (processFile(f)) {
      console.log('Updated:', path.relative(root, f));
      n++;
    }
  }
}
console.log(`Done. ${n} files updated.`);
