import {beforeEach,describe,expect,it,vi} from 'vitest';
import {fetchModerationDetail} from './adminModeration';
const state=vi.hoisted(()=>({from:vi.fn(),select:vi.fn(),eq:vi.fn(),single:vi.fn()}));
vi.mock('@/integrations/supabase/client',()=>({supabase:{from:state.from}}));
beforeEach(()=>{vi.clearAllMocks();const chain={select:state.select,eq:state.eq,single:state.single};state.from.mockReturnValue(chain);state.select.mockReturnValue(chain);state.eq.mockReturnValue(chain);state.single.mockResolvedValue({data:{id:'same',name_en:'Stored',images:[]},error:null});});
describe('exact moderation reader existing RLS transport',()=>{
 it.each([['listing','listings'],['service','services'],['product','marketplace_products']] as const)('binds %s to its own table and exact identity',async(type,table)=>{
  const result=await fetchModerationDetail(type,'same');expect(result.type).toBe(type);expect(result.id).toBe('same');expect(state.from).toHaveBeenCalledWith(table);expect(state.eq).toHaveBeenCalledWith('id','same');
  const fields=state.select.mock.calls[0][0] as string;expect(fields).not.toContain('*');expect(fields).not.toMatch(/email|phone|commission|reviewed_by|seller_id/);
 });
 it('propagates RLS denial without another table or public fallback',async()=>{state.single.mockResolvedValue({data:null,error:Error('denied')});await expect(fetchModerationDetail('service','same')).rejects.toThrow('denied');expect(state.from).toHaveBeenCalledTimes(1);});
 it('refuses a different returned identity',async()=>{state.single.mockResolvedValue({data:{id:'foreign'},error:null});await expect(fetchModerationDetail('product','same')).rejects.toThrow('Exact moderation record unavailable');});
});
