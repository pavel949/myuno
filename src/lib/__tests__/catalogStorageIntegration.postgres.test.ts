import { describe, expect, it } from 'vitest';
import { execFileSync } from 'node:child_process';
import { chmodSync, chownSync, mkdtempSync, realpathSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';

describe('catalog and Storage 0042–0044 — disposable socket-only PostgreSQL', () => {
  it('runs real migrations and staged intake assertions with no remote connection', () => {
    const pgBin = dirname(realpathSync(execFileSync('which', ['postgres'], { encoding: 'utf8' }).trim()));
    const directory = mkdtempSync(join(tmpdir(), 'myuno-344-345-'));
    const root = process.getuid?.() === 0;
    const env = { PATH: process.env.PATH, HOME: process.env.HOME, LANG: 'C', PGHOST: directory, PGPORT: '55442', PGDATABASE: 'myuno_344_345_test' };
    const run = (bin: string, args: string[]) => root
      ? execFileSync('runuser', ['-u', 'nobody', '--', join(pgBin, bin), ...args], { env, encoding: 'utf8' })
      : execFileSync(join(pgBin, bin), args, { env, encoding: 'utf8' });
    let started = false;
    try {
      chmodSync(directory, 0o700);
      if (root) chownSync(directory, 65534, 65534);
      run('initdb', ['-D', join(directory, 'data'), '-A', 'trust', '--no-locale']);
      run('pg_ctl', ['-D', join(directory, 'data'), '-l', join(directory, 'server.log'), '-o', `-k ${directory} -h '' -p 55442`, '-w', 'start']);
      started = true;
      run('createdb', ['-h', directory, '-p', '55442', 'myuno_344_345_test']);
      const output = run('psql', ['-X', '-h', directory, '-p', '55442', '-d', 'myuno_344_345_test', '-v', 'ON_ERROR_STOP=1', '-f', resolve('docs/hardening/344-345/isolated_regression.sql')]);
      expect(output).toContain('Synthetic SQL assertions passed');
    } finally {
      if (started) run('pg_ctl', ['-D', join(directory, 'data'), '-m', 'immediate', '-w', 'stop']);
      rmSync(directory, { recursive: true, force: true });
    }
  }, 60000);
});
