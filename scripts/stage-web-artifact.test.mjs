import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { chmod, lstat, mkdir, mkdtemp, readFile, readdir, rm, symlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const cli = fileURLToPath(new URL('./stage-web-artifact.mjs', import.meta.url));
const fixtures = {
  'index.html': '<html><script type="module" src="/assets/app.js"></script></html>',
  'version.json': '{"version":"3.55.5","buildTime":"2026-11-26T00:00:00Z"}\n',
  'sw.js': "workbox.precacheAndRoute([{url:'index.html'}]);\n//# sourceMappingURL=sw.js.map\n",
  'sw.js.map': '{"file":"sw.js","version":3}',
  'assets/app.js': 'console.log("hello");',
  'assets/app.js.map': '{"file":"app.js","version":3}',
  'assets/module.mjs': 'export const x = 1;',
  'assets/module.mjs.map': '{"file":"module.mjs","version":3}',
  'assets/map-tile.map': 'a runtime asset, not a source map',
  'assets/style.css.map': '{"file":"style.css","version":3}',
  'nested/other.txt': 'leave intact',
};

async function fixture(t) {
  const root = await mkdtemp(join(tmpdir(), 'myuno-artifact-test-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  const build = join(root, 'dist'), out = join(root, 'public'), parent = join(root, 'private');
  await mkdir(parent, { mode: 0o700 });
  for (const [file, value] of Object.entries(fixtures)) {
    const path = join(build, file);
    await mkdir(dirname(path), { recursive: true });
    await writeFile(path, value);
  }
  return { build, out, parent, diagnostic: join(parent, 'release') };
}

function run(f, ...args) {
  return spawnSync(process.execPath, [cli, ...(args.length ? args : [f.build, f.out, f.diagnostic])], { encoding: 'utf8' });
}

test('CLI retains byte-identical public files and privately archives only JS maps with exact hashes', async t => {
  const f = await fixture(t);
  const r = run(f);
  assert.equal(r.status, 0, r.stderr);
  const report = JSON.parse(r.stdout);
  assert.equal(report.privateMapFiles, 3);
  assert.equal(report.publicFiles, 8);
  const manifest = JSON.parse(await readFile(join(f.diagnostic, 'artifact-integrity.json'), 'utf8'));
  assert.equal(manifest.buildFingerprint, report.buildFingerprint);
  assert.equal((await lstat(f.diagnostic)).mode & 0o777, 0o700);
  assert.equal((await lstat(join(f.diagnostic, 'artifact-integrity.json'))).mode & 0o777, 0o600);
  for (const [path, value] of Object.entries(fixtures)) {
    assert.equal(await readFile(join(f.build, path), 'utf8'), value);
    const isMap = /\.[cm]?js\.map$/.test(path);
    const actual = join(isMap ? f.diagnostic : f.out, path);
    assert.equal(await readFile(actual, 'utf8'), value);
    await assert.rejects(lstat(join(isMap ? f.out : f.diagnostic, path)), { code: 'ENOENT' });
    const entry = (isMap ? manifest.maps : manifest.publicFiles).find(e => e.path === path);
    assert.equal(entry.sha256, createHash('sha256').update(value).digest('hex'));
    if (isMap) assert.equal((await lstat(actual)).mode & 0o777, 0o600);
  }
});

test('CLI refuses a non-private archive parent before creating public output', async t => {
  const f = await fixture(t);
  await chmod(f.parent, 0o755);
  const r = run(f);
  assert.equal(r.status, 1);
  assert.match(r.stderr, /Private parent/);
  await assert.rejects(lstat(f.out), { code: 'ENOENT' });
  assert.deepEqual(await readdir(f.parent), []);
});

test('CLI refuses overlaps and does not clobber an existing output', async t => {
  const f = await fixture(t);
  const overlapping = run(f, f.build, join(f.build, 'new'), f.diagnostic);
  assert.equal(overlapping.status, 1);
  assert.match(overlapping.stderr, /disjoint/);
  await mkdir(f.out);
  await writeFile(join(f.out, 'sentinel'), 'existing data');
  const exists = run(f);
  assert.equal(exists.status, 1);
  assert.match(exists.stderr, /already exists/);
  assert.equal(await readFile(join(f.out, 'sentinel'), 'utf8'), 'existing data');
  assert.deepEqual(await readdir(f.parent), []);
});

test('CLI fails closed for a real PWA dependency on a JS map', async t => {
  const f = await fixture(t);
  await writeFile(join(f.build, 'sw.js'), "workbox.precacheAndRoute([{url:'assets/app.js.map'}]);");
  const r = run(f);
  assert.equal(r.status, 1);
  assert.match(r.stderr, /Worker may depend/);
  await assert.rejects(lstat(f.out), { code: 'ENOENT' });
  assert.deepEqual(await readdir(f.parent), []);
});

test('CLI rejects staging builds containing links or missing a paired JS payload', async t => {
  const f = await fixture(t);
  const link = join(f.build, 'nested/link');
  await symlink(join(f.build, 'version.json'), link);
  const linked = run(f);
  assert.equal(linked.status, 1);
  assert.match(linked.stderr, /link or non-regular file/);
  await rm(link);
  await rm(join(f.build, 'assets/app.js'));
  const broken = run(f);
  assert.equal(broken.status, 1);
  assert.match(broken.stderr, /lacks its generated JavaScript/);
  await assert.rejects(lstat(f.out), { code: 'ENOENT' });
  assert.deepEqual(await readdir(f.parent), []);
});
