import { test } from 'node:test';
import assert from 'node:assert/strict';
import { scanPrimitiveImports } from './design-system-adoption-register.mjs';
test('counts aliased rendered JSX, not comments, unused imports or unrelated identically named components',()=>{
 const rows=scanPrimitiveImports('sample.tsx',`import { Button as Action, Input } from '@/components/ui/button';import { Card } from './private-card';// <Action />\nexport const Sample=()=> <><Action>Save</Action><Action/><Card/></>;`);
 assert.deepEqual(rows.map(({name,instances})=>({name,instances})),[{name:'Button',instances:2}]);
});
test('does not promote type-only references into rendered adoption',()=>{
 assert.deepEqual(scanPrimitiveImports('sample.tsx',`import type { SectionHeader } from '@/components/ds';type Header=typeof SectionHeader;`),[]);
});
