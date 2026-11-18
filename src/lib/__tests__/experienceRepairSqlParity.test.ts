import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { describe, it, expect } from 'vitest';
const folder='docs/hardening/operational-repairs/experience-publication-20261118';
const source='scripts/qa/fixtures/experience-security';
const read=(p:string)=>readFileSync(p,'utf8');
describe('manual repair exactly matches runtime-tested SQL fixtures',()=>{
  const hashes=JSON.parse(read(`${folder}/fixture-sha256.json`)) as Record<string,string>;
  const apply=read(`${folder}/apply.sql`);
  for(const [name,hash] of Object.entries(hashes)) it(name,()=>{
    const fixture=read(`${source}/${name}`);
    expect(createHash('sha256').update(fixture).digest('hex')).toBe(hash);
    expect(apply.split(`-- BEGIN FIXTURE ${name}\n`)[1]?.split(`\n-- END FIXTURE ${name}`)[0]).toBe(fixture.split('BEGIN;')[1].split('COMMIT;')[0].trim());
  });
  it('has only one atomic transaction and preserves tested containment',()=>{
    expect(apply.match(/^BEGIN;$/gm)).toHaveLength(1);
    expect(apply.match(/^COMMIT;$/gm)).toHaveLength(1);
    expect(read(`${folder}/containment.sql`)).toBe(read(`${source}/listings-provider-update-containment.sql`));
  });
});
