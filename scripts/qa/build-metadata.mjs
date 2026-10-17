#!/usr/bin/env node
// Validate build provenance without making any hosted requests.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const metadata = JSON.parse(readFileSync('dist/version.json', 'utf8'));
const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
const expectedCommit = process.env.VERCEL_GIT_COMMIT_SHA || process.env.COMMIT_REF || process.env.GITHUB_SHA;
assert.equal(metadata.version, pkg.version, 'Built metadata must match the package version');
assert.match(expectedCommit ?? '', /^[a-f0-9]{40}(?:[a-f0-9]{24})?$/i, 'CI must identify the build commit');
assert.equal(metadata.commit, expectedCommit, 'Built metadata must identify this exact source commit');
assert.equal(new Date(metadata.buildTime).toISOString(), metadata.buildTime, 'Build time must be canonical ISO metadata');
console.log('Built version.json matches package version and CI source commit');

