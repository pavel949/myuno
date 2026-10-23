import React from 'react';
import {afterEach,describe,it,expect,vi} from 'vitest';
import {render,screen,fireEvent,cleanup,waitFor} from '@testing-library/react';
import {QueryClient,QueryClientProvider} from '@tanstack/react-query';
import {ModerationDetailDialog} from './ModerationDetailDialog';
const state=vi.hoisted(()=>({actor:'admin-a',read:vi.fn()}));
vi.mock('@/contexts/AuthContext',()=>({useAuth:()=>({user:{id:state.actor}})}));
vi.mock('@/contexts/LanguageContext',()=>({useLanguage:()=>({language:'en'})}));
vi.mock('@/lib/adminModeration',()=>({fetchModerationDetail:(...args:unknown[])=>state.read(...args)}));
afterEach(()=>{cleanup();vi.clearAllMocks();state.actor='admin-a';});
const record=(type:string,id:string)=>({type,id,name_en:`${type} persisted`,name_ru:null,description_en:'Actual stored description',description_ru:null,images:[],price:0,currency:null,approval_status:'pending',is_active:false,updated_at:'revision'});
function setup(){const client=new QueryClient({defaultOptions:{queries:{retry:false}}});return({children}:React.PropsWithChildren)=><QueryClientProvider client={client}>{children}</QueryClientProvider>;}
describe('exact read-only moderation dialog',()=>{
 it('separates identical IDs by type and never carries old content through a pending read',async()=>{
  state.read.mockImplementation(async(type,id)=>record(type,id));const wrapper=setup();
  const view=render(<ModerationDetailDialog selection={{id:'same',type:'listing',actorId:'admin-a'}} onClose={()=>{}}/>,{wrapper});
  expect(await screen.findByText('listing persisted')).toBeInTheDocument();
  state.read.mockReturnValue(new Promise(()=>{}));view.rerender(<ModerationDetailDialog selection={{id:'same',type:'service',actorId:'admin-a'}} onClose={()=>{}}/>);
  expect(screen.queryByText('listing persisted')).not.toBeInTheDocument();expect(screen.getByRole('status')).toHaveTextContent('Loading');
  expect(state.read).toHaveBeenLastCalledWith('service','same');
 });
 it('shows refusal and retries exact selection without writes',async()=>{
  state.read.mockRejectedValueOnce(Error('denied')).mockResolvedValue(record('product','one'));
  render(<ModerationDetailDialog selection={{id:'one',type:'product',actorId:'admin-a'}} onClose={()=>{}}/>,{wrapper:setup()});
  expect(await screen.findByRole('alert')).toHaveTextContent('Exact record could not be loaded');
  fireEvent.click(screen.getByRole('button',{name:'Retry'}));expect(await screen.findByText('product persisted')).toBeInTheDocument();expect(state.read.mock.calls).toEqual([['product','one'],['product','one']]);
 });
 it('hides previous actor content immediately on account change',async()=>{
  state.read.mockResolvedValue(record('service','one'));const view=render(<ModerationDetailDialog selection={{id:'one',type:'service',actorId:'admin-a'}} onClose={()=>{}}/>,{wrapper:setup()});
  await screen.findByText('service persisted');state.actor='admin-b';view.rerender(<ModerationDetailDialog selection={{id:'one',type:'service',actorId:'admin-a'}} onClose={()=>{}}/>);
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();expect(state.read).toHaveBeenCalledTimes(1);
 });
 it('Escape closes and restores the review control focus',async()=>{
  state.read.mockResolvedValue(record('listing','one'));const focus=vi.fn();
  function Harness(){const[open,setOpen]=React.useState(true);return <ModerationDetailDialog selection={open?{id:'one',type:'listing',actorId:'admin-a'}:null} onClose={()=>setOpen(false)} onReturnFocus={focus}/>;}
  render(<Harness/>,{wrapper:setup()});await screen.findByText('listing persisted');fireEvent.keyDown(screen.getByRole('dialog'),{key:'Escape'});
  await waitFor(()=>expect(screen.queryByRole('dialog')).not.toBeInTheDocument());expect(focus).toHaveBeenCalled();
 });
});
