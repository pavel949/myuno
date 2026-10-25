/** Source-only SQL assembly. No database client, environment credentials or executor. */
import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
export const repositoryRoot = resolve(here, '../..');
export const manifest = JSON.parse(readFileSync(resolve(here, 'employee-publication.manifest.json'), 'utf8'));
const transactionCommands = new Set(['BEGIN', 'START', 'COMMIT', 'END', 'ROLLBACK', 'ABORT', 'SAVEPOINT', 'RELEASE', 'PREPARE']);

/**
 * Lex only statement boundaries, preserving original bytes. Dollar-quoted bodies,
 * SQL strings/identifiers and nested comments are opaque. This is deliberately
 * not a SQL executor or general SQL parser; unfamiliar wrapping fails closed.
 */
export function sqlStatementBoundaries(source) {
  const statements = [];
  let i = 0, codeStart = -1, words = [], otherTokens = false;
  const fail = detail => { throw new Error(`Unsafe SQL assembly: ${detail}`); };
  while (i < source.length) {
    const c = source[i];
    if (/\s/.test(c)) { i++; continue; }
    if (source.startsWith('--', i)) {
      const offset = source.slice(i + 2).search(/[\r\n]/);
      i = offset < 0 ? source.length : i + 2 + offset + 1;
      continue;
    }
    if (source.startsWith('/*', i)) {
      let depth = 1; i += 2;
      while (i < source.length && depth) {
        if (source.startsWith('/*', i)) { depth++; i += 2; }
        else if (source.startsWith('*/', i)) { depth--; i += 2; }
        else i++;
      }
      if (depth) fail('unterminated block comment');
      continue;
    }
    if (codeStart < 0) codeStart = i;
    if (c === '\\') fail('psql/meta commands are not accepted');
    if (c === "'" || c === '"') {
      const quote = c; otherTokens = true;
      // Only PostgreSQL E'...' strings consume backslash escapes. Ordinary
      // strings use doubled quotes; the generated transaction pins that setting.
      const escaped = quote === "'" && i > 0 && /[eE]/.test(source[i - 1])
        && (i < 2 || !/[a-zA-Z0-9_$]/.test(source[i - 2]));
      let closed = false; i++;
      while (i < source.length) {
        if (escaped && source[i] === '\\') { i += 2; continue; }
        if (source[i] === quote) {
          if (source[i + 1] === quote) { i += 2; continue; }
          i++; closed = true; break;
        }
        i++;
      }
      if (!closed) fail('unterminated string or quoted identifier');
      continue;
    }
    if (c === '$') {
      const tag = source.slice(i).match(/^\$(?:[a-zA-Z_][a-zA-Z0-9_]*)?\$/)?.[0];
      if (tag) {
        otherTokens = true;
        const end = source.indexOf(tag, i + tag.length);
        if (end < 0) fail('unterminated dollar-quoted body');
        i = end + tag.length;
        continue;
      }
    }
    if (/[a-zA-Z_]/.test(c)) {
      const word = source.slice(i).match(/^[a-zA-Z_][a-zA-Z0-9_$]*/)[0];
      words.push(word.toUpperCase()); i += word.length; continue;
    }
    if (c === ';') {
      if (!words.length) fail('empty or unrecognized statement');
      statements.push({ start: codeStart, end: i + 1, words, simpleKeyword: !otherTokens && words.length === 1 });
      codeStart = -1; words = []; otherTokens = false; i++; continue;
    }
    otherTokens = true; i++;
  }
  if (codeStart >= 0) fail('unterminated final statement');
  return statements;
}

/** Remove exactly two wrapper statements, preserving every other source byte. */
export function stripOuterTransaction(source, label = 'candidate') {
  const statements = sqlStatementBoundaries(source);
  const first = statements[0], last = statements.at(-1);
  if (statements.length < 3 || !first.simpleKeyword || first.words[0] !== 'BEGIN'
    || !last.simpleKeyword || last.words[0] !== 'COMMIT') {
    throw new Error(`${label}: exactly one BEGIN; ... COMMIT; wrapper is required`);
  }
  for (const statement of statements.slice(1, -1)) {
    if (transactionCommands.has(statement.words[0])) {
      throw new Error(`${label}: unexpected top-level transaction command ${statement.words[0]}`);
    }
  }
  return source.slice(0, first.start) + source.slice(first.end, last.start) + source.slice(last.end);
}

export function buildEmployeePublicationBundle({ rootDir = repositoryRoot, includeDelegation = false, rollback = false } = {}) {
  if (rollback && includeDelegation) throw new Error('Rollback already freezes optional delegation; do not combine flags');
  const entries = manifest[rollback ? 'rollback' : 'activation'].filter(entry => !entry.optional || includeDelegation);
  const bodies = entries.map(entry => {
    const source = readFileSync(resolve(rootDir, entry.path), 'utf8');
    const hash = createHash('sha256').update(source).digest('hex');
    if (hash !== entry.sha256) throw new Error(`${entry.path}: source checksum changed; re-review and update the manifest before assembly`);
    return `\n-- SOURCE ${entry.id}: ${entry.path}\n-- SHA256 ${hash}\n${stripOuterTransaction(source, entry.path)}\n-- END SOURCE ${entry.id}\n`;
  });
  return [
    '-- SOURCE CANDIDATE ONLY. NO DATABASE EXECUTION OR ACTIVATION AUTHORIZATION.',
    `-- Pinned input reference: ${manifest.sourceCommit}`,
    `-- Mode: ${rollback ? 'fail-closed rollback' : 'activation'}; optional admin delegation: ${includeDelegation ? 'included, separate approval required' : 'not included'}.`,
    '-- No employee, identity, membership, Space, enforcement or named-user permission seeds.',
    '-- Runtime tests, deployed equivalence and explicit exact-change approval remain required.',
    'BEGIN;',
    // Pins the lexer semantics without changing any function, policy or grant.
    'SET LOCAL standard_conforming_strings = on;',
    ...bodies,
    'COMMIT;',
    '',
  ].join('\n');
}

const direct = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (direct) {
  try {
    const args = process.argv.slice(2);
    if (args.includes('--help')) {
      process.stdout.write('Source-only assembly. No database connection.\nUsage: node scripts/source-bundles/employee-publication.mjs [--include-admin-delegation | --rollback] [--out PATH]\n');
    } else {
      let output;
      const includeDelegation = args.includes('--include-admin-delegation'), rollback = args.includes('--rollback');
      for (let i = 0; i < args.length; i++) {
        if (['--include-admin-delegation', '--rollback'].includes(args[i])) continue;
        if (args[i] === '--out' && args[i + 1] && !args[i + 1].startsWith('--')) { output = args[++i]; continue; }
        throw new Error(`Unknown or incomplete argument: ${args[i]}`);
      }
      const bundle = buildEmployeePublicationBundle({ includeDelegation, rollback });
      if (output) writeFileSync(resolve(output), bundle, { flag: 'wx' });
      else process.stdout.write(bundle);
    }
  } catch (error) {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
    process.exitCode = 1;
  }
}
