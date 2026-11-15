import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { verifyDependencyAudits } from './dependency-audit-gate.mjs';
const policy=JSON.parse(readFileSync('docs/security/dependency-audit-policy.json','utf8'));
const report=vulnerabilities=>({metadata:{vulnerabilities:{total:Object.keys(vulnerabilities).length}},vulnerabilities});
const known=report({deepmerge:{severity:'low',via:[{url:policy.advisory,severity:'low'}]}}),clear=report({});
test('accepts only the reviewed build callsite with a clean production graph',()=>{assert.deepEqual(verifyDependencyAudits(known,clear,policy,readFileSync),{production:0,reviewedBuildOnlyNodes:1});});
test('rejects a production advisory, even the reviewed development dependency',()=>{assert.throws(()=>verifyDependencyAudits(known,known,policy,readFileSync),/Production/);});
test('rejects elevated severity, unrelated low advisories and missing reports',()=>{
 for(const bad of [{},{metadata:{vulnerabilities:{total:1}},vulnerabilities:{}},report({deepmerge:{severity:'moderate',via:['deepmerge']}}),report({unreviewed:{severity:'low',via:['deepmerge']}}),report({deepmerge:{severity:'low',via:[{url:'https://synthetic.invalid/new',severity:'low'}]}})])assert.throws(()=>verifyDependencyAudits(bad,clear,policy,readFileSync));
});
test('requires renewed review when the actual consumer changes',()=>{assert.throws(()=>verifyDependencyAudits(known,clear,policy,()=>Buffer.from('changed')),/consumer changed/);});
