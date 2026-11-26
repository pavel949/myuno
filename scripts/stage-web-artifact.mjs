#!/usr/bin/env node

import { createHash } from 'node:crypto';
import { constants } from 'node:fs';
import {
  chmod, copyFile, lstat, mkdir, mkdtemp, readFile, readdir, realpath, rename, rm, writeFile,
} from 'node:fs/promises';
import { basename, dirname, isAbsolute, join, relative, resolve, sep } from 'node:path';

const isJsMap = (path) => /\.[cm]?js\.map$/i.test(path);
const sha256 = (data) => createHash('sha256').update(data).digest('hex');
const nested = (base, target) => {
  const rel = relative(base, target);
  return rel === '' || (!isAbsolute(rel) && rel !== '..' && !rel.startsWith(`..${sep}`));
};
const overlap = (a, b) => nested(a, b) || nested(b, a);

async function assertAbsent(path) {
  try { await lstat(path); } catch (err) {
    if (err.code === 'ENOENT') return;
    throw err;
  }
  throw new Error(`Output already exists: ${path}`);
}

async function outputPath(input) {
  const path = resolve(input);
  const parent = await realpath(dirname(path));
  if (!(await lstat(parent)).isDirectory()) throw new Error('Output parent must be a directory');
  return join(parent, basename(path));
}

async function copyVerified(build, target, entry, mode = null) {
  const dest = join(target, entry.path);
  await mkdir(dirname(dest), { recursive: true, mode: mode === null ? 0o755 : 0o700 });
  await copyFile(join(build, entry.path), dest, constants.COPYFILE_EXCL);
  if (mode !== null) await chmod(dest, mode);
  if (sha256(await readFile(dest)) !== entry.sha256) throw new Error(`Build changed during staging: ${entry.path}`);
}

async function inspect(build, path = '') {
  const files = [];
  for (const file of (await readdir(join(build, path), { withFileTypes: true })).sort((a, b) => a.name.localeCompare(b.name, 'en'))) {
    const next = path ? `${path}/${file.name}` : file.name;
    if (file.isDirectory()) files.push(...await inspect(build, next));
    else if (file.isFile()) {
      const bytes = await readFile(join(build, next));
      files.push({ path: next, bytes: bytes.length, sha256: sha256(bytes) });
    } else throw new Error(`Build contains a link or non-regular file: ${next}`);
  }
  return files;
}

async function checkedText(build, entry) {
  const bytes = await readFile(join(build, entry.path));
  if (sha256(bytes) !== entry.sha256) throw new Error(`Build changed during staging: ${entry.path}`);
  return bytes.toString('utf8');
}

async function stageWebArtifact(input, output, privateDestination) {
  if (typeof process.getuid !== 'function') throw new Error('Private staging requires a POSIX filesystem');
  const inputStat = await lstat(resolve(input));
  if (!inputStat.isDirectory() || inputStat.isSymbolicLink()) throw new Error('Build must be a real directory');
  const [build, publicOut, privateOut, repo] = await Promise.all([
    realpath(input), outputPath(output), outputPath(privateDestination), realpath('.'),
  ]);
  if (overlap(build, publicOut) || overlap(build, privateOut) || overlap(publicOut, privateOut) ||
      nested(repo, privateOut)) throw new Error('Paths must be disjoint; private output must be outside the working directory');
  const privateParent = await lstat(dirname(privateOut));
  if ((privateParent.mode & 0o077) !== 0 || privateParent.uid !== process.getuid()) {
    throw new Error('Private parent must already be owned by the runner and have no group or other permissions');
  }
  await Promise.all([assertAbsent(publicOut), assertAbsent(privateOut)]);

  const files = await inspect(build);
  const byPath = new Map(files.map(entry => [entry.path, entry]));
  for (const path of ['index.html', 'version.json', 'sw.js']) {
    if (!byPath.has(path)) throw new Error(`Build missing required file: ${path}`);
  }
  const version = JSON.parse(await checkedText(build, byPath.get('version.json')));
  if (typeof version.version !== 'string' || !version.version || !Number.isFinite(Date.parse(version.buildTime))) {
    throw new Error('Build metadata lacks a usable version or buildTime');
  }

  const maps = files.filter(entry => isJsMap(entry.path));
  if (!maps.length) throw new Error('No JS source maps found; use the original immutable build');
  for (const entry of maps) {
    if (!byPath.has(entry.path.slice(0, -4))) throw new Error(`Source map lacks its generated JavaScript: ${entry.path}`);
  }
  // Workbox appends a DevTools-only comment. Do not ship if the worker's code,
  // including its precache manifest, actually refers to a removed JS map.
  for (const entry of files.filter(entry => /^(?:sw|workbox-[^/]+)\.js$/.test(entry.path))) {
    const code = (await checkedText(build, entry)).replace(/^\s*\/\/[#@]\s*sourceMappingURL=.*$/gm, '');
    if (/\.[cm]?js\.map\b/i.test(code)) throw new Error(`Worker may depend on a JS source map: ${entry.path}`);
  }
  const retained = files.filter(entry => !isJsMap(entry.path));
  const manifest = {
    build: version,
    buildFingerprint: sha256(JSON.stringify(files)),
    maps,
    publicFiles: retained,
  };

  const privateTmp = await mkdtemp(join(dirname(privateOut), '.myuno-private-'));
  let publicTmp = null;
  try {
    await chmod(privateTmp, 0o700);
    for (const entry of maps) await copyVerified(build, privateTmp, entry, 0o600);
    await writeFile(join(privateTmp, 'artifact-integrity.json'), `${JSON.stringify(manifest, null, 2)}\n`, { flag: 'wx', mode: 0o600 });
    await assertAbsent(privateOut);
    await rename(privateTmp, privateOut);
    // No public output is created until the exact build's map bytes exist in
    // the private destination and have passed their integrity checks.
    publicTmp = await mkdtemp(join(dirname(publicOut), '.myuno-public-'));
    for (const entry of retained) await copyVerified(build, publicTmp, entry);
    await chmod(publicTmp, 0o755);
    await assertAbsent(publicOut);
    await rename(publicTmp, publicOut);
    publicTmp = null;
  } finally {
    await rm(privateTmp, { recursive: true, force: true });
    if (publicTmp) await rm(publicTmp, { recursive: true, force: true });
  }
  const mapBytes = maps.reduce((sum, entry) => sum + entry.bytes, 0);
  const publicBytes = retained.reduce((sum, entry) => sum + entry.bytes, 0);
  console.log(JSON.stringify({
    buildFingerprint: manifest.buildFingerprint,
    originalBytes: mapBytes + publicBytes,
    publicBytes,
    privateMapBytes: mapBytes,
    publicFiles: retained.length,
    privateMapFiles: maps.length,
  }));
}

const args = process.argv.slice(2);
if (args.length !== 3 || args.some(arg => !arg || arg.startsWith('-'))) {
  console.error('Usage: npm run stage:web -- <build-dir> <new-public-dir> <new-private-dir>');
  process.exitCode = 2;
} else {
  await stageWebArtifact(...args).catch(err => {
    console.error(`[stage-web] ${err.message}`);
    process.exitCode = 1;
  });
}
