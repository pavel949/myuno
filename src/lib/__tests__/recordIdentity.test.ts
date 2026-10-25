import { expect, it } from 'vitest';
import { sameRecordId } from '../recordIdentity';
const id='aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee';
it.each([
  ['unit','unit',true],['Unit','unit',false],[id,id,true],[id,id.toUpperCase(),true],
  [id,'aaaaaaaa-bbbb-4ccc-8ddd-ffffffffffff',false],['','',false],
  [undefined,undefined,false],[null,id,false],[12,'12',false],['not-a-UUID','NOT-A-UUID',false],
])('compares route/DTO identity %s / %s without broad case folding', (left,right,expected) => {
  expect(sameRecordId(left,right)).toBe(expected);
});
