import { describe, expect, it } from 'vitest';
import { parseUserRequest, userMutationDenial } from '../../../supabase/functions/_shared/admin-user-policy';
const actor='00000000-0000-4000-8000-0000000000aa';
const other='00000000-0000-4000-8000-0000000000bb';
const input=(action:string,user_id=other,role?:string,hard_delete=false)=>parseUserRequest({action,user_id,role,hard_delete})!;
describe('administrative lifecycle and protected role admission',()=>{
 it.each(['suspend','activate','deactivate','delete'])('rejects self and peer admin %s',action=>{
  expect(userMutationDenial(input(action,actor.toUpperCase()),actor,false)).toBeTruthy();
  expect(userMutationDenial(input(action),actor,true)).toBeTruthy();
  expect(userMutationDenial(input(action),actor,false)).toBeNull();
 });
 it.each(['add_role','remove_role'])('rejects both protected roles for %s',action=>{
  for(const role of ['admin','uno_team']) expect(userMutationDenial(input(action,other,role),actor,false)).toBeTruthy();
  expect(userMutationDenial(input(action,other,'owner'),actor,false)).toBeNull();
 });
 it('rejects hard delete',()=>expect(userMutationDenial(input('delete',other,undefined,true),actor,false)).toBeTruthy());
 it.each([null,[],{}, {action:'delete',user_id:other,hard_delete:'false'}, {action:'add_role',user_id:other,role:'superadmin'}, {action:'delete',user_id:'invalid'}])('rejects malformed input %#',value=>expect(parseUserRequest(value)).toBeNull());
});
