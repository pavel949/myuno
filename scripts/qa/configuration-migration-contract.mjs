import { readFileSync, existsSync } from 'node:fs';
import assert from 'node:assert/strict';
const journal = JSON.parse(readFileSync('drizzle/migrations/meta/_journal.json', 'utf8')).entries;
for (const field of ['idx','tag','when']) assert.equal(new Set(journal.map(row => row[field])).size, journal.length, 'Duplicate migration ' + field);
const suffixes = ['operating_space_setup','staff_company_member_link','management_terms_configuration'];
const rows = suffixes.map(suffix => { const matches = journal.filter(row => row.tag.endsWith('_' + suffix)); assert.equal(matches.length, 1, suffix); return matches[0]; });
for (const row of rows) {
  assert(existsSync('drizzle/migrations/' + row.tag + '.sql'), row.tag);
  assert(existsSync('docs/hardening/rollback/' + row.tag + '.sql'), 'Missing rollback: ' + row.tag);
  const number = row.tag.split('_')[0];
  const snapshot = JSON.parse(readFileSync('drizzle/migrations/meta/' + number + '_snapshot.json','utf8'));
  const previous = JSON.parse(readFileSync('drizzle/migrations/meta/' + String(Number(number)-1).padStart(4,'0') + '_snapshot.json','utf8'));
  assert.equal(snapshot.prevId, previous.id, 'Broken snapshot chain: ' + row.tag);
}
for(let i=1;i<rows.length;i++) { assert(rows[i].idx>rows[i-1].idx); assert(rows[i].when>rows[i-1].when); }
console.log('Configuration migration order, files, rollback and snapshot chain: PASS');
