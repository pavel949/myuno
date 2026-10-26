import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import OwnerPortalDashboard from './OwnerPortalDashboard';
const state = vi.hoisted(() => ({ user: {id:'owner-a'}, failSettings: false, failCounts: false, failTable: '', missingCount: false, empty: false, filters: [] as string[] }));
vi.mock('@/contexts/AuthContext', () => ({ useAuth: () => ({user:state.user}) }));
vi.mock('@/contexts/LanguageContext', () => ({useLanguage:()=>({language:'en'})}));
vi.mock('@/integrations/supabase/client', () => ({supabase:{from:(table:string)=>{
 let owner=''; const q={select:()=>q,eq:(field:string,value:string)=>{if(field.endsWith('user_id')){owner=value;state.filters.push(value);}return q;},
 then:(resolve:(value:unknown)=>unknown)=>Promise.resolve(resolve(table==='owner_portal_settings'
 ? {data:state.empty?[]:[{id:owner,property_id:owner,properties:{id:owner,title:`Property ${owner}`}}],error:state.failSettings?new Error('settings failed'):null}
 : {count:state.missingCount?null:owner==='owner-a'?7:2,error:(state.failCounts||state.failTable===table)?new Error('counts failed'):null}))};return q;
}}}));
beforeEach(()=>{state.user={id:'owner-a'};state.failSettings=false;state.failCounts=false;state.failTable='';state.missingCount=false;state.empty=false;state.filters=[];});
afterEach(cleanup);
function mount(){const client=new QueryClient({defaultOptions:{queries:{retry:false}}});const view=()=> <QueryClientProvider client={client}><MemoryRouter><OwnerPortalDashboard/></MemoryRouter></QueryClientProvider>;return {...render(view()),view,client};}
it('shows settings failure with retry, never the empty state',async()=>{
 state.failSettings=true;const {client}=mount();
 await screen.findByText('Unable to load your properties.');
 expect(screen.queryByText(/You don't have any properties/)).toBeNull();
 state.failSettings=false;fireEvent.click(screen.getByRole('button',{name:'Retry'}));
 await screen.findByText('Property owner-a');client.clear();
});
it('distinguishes successful empty settings from failure',async()=>{state.empty=true;mount();await screen.findByText(/You don't have any properties/);});
it('shows failed counts as unavailable and retries both',async()=>{
 state.failCounts=true;mount();await screen.findByText('Property owner-a');
 await waitFor(()=>expect(screen.getAllByText('Count unavailable')).toHaveLength(2));
 state.failCounts=false;fireEvent.click(screen.getByRole('button',{name:'Retry counts'}));
 await screen.findByText('7 for approval');await screen.findByText('7 to sign');
});
it('switches property and count queries to the new identity',async()=>{
 const {rerender,view}=mount();await screen.findByText('Property owner-a');await screen.findByText('7 for approval');
 await act(async()=>{state.user={id:'owner-b'};rerender(view());});
 expect(screen.queryByText('Property owner-a')).toBeNull();expect(screen.queryByText('7 for approval')).toBeNull();
 await screen.findByText('Property owner-b');await screen.findByText('2 for approval');expect(state.filters).toContain('owner-b');
});

it('shows loading before settings resolve without an empty-state flash',async()=>{mount();expect(screen.getByRole('status',{name:'Loading'})).toBeVisible();expect(screen.queryByText(/You don't have any properties/)).toBeNull();await screen.findByText('Property owner-a');});

it('keeps a missing exact count unavailable rather than treating it as zero',async()=>{state.missingCount=true;mount();await screen.findByText('Property owner-a');await waitFor(()=>expect(screen.getAllByText('Count unavailable')).toHaveLength(2));});

it('suppresses cached counts after a background error while preserving the properties',async()=>{
 const {client}=mount();await screen.findByText('7 for approval');await screen.findByText('7 to sign');
 state.failCounts=true;
 await act(async()=>{await Promise.all([
  client.refetchQueries({queryKey:['owner-portal-pending-statements','owner-a']}),
  client.refetchQueries({queryKey:['owner-portal-pending-signatures','owner-a']}),
 ]);});
 await waitFor(()=>expect(screen.getAllByText('Count unavailable')).toHaveLength(2));
 expect(screen.queryByText('7 for approval')).toBeNull();expect(screen.queryByText('7 to sign')).toBeNull();
 expect(screen.queryAllByText('7')).toHaveLength(0);expect(screen.getByText('Property owner-a')).toBeVisible();
});
it.each([
 ['owner_statement_approvals','7 to sign','7 for approval'],
 ['signature_request_signers','7 for approval','7 to sign'],
])('isolates a failure in %s from the other successful count',async(table,healthy,failed)=>{
 state.failTable=table;mount();await screen.findByText('Count unavailable');
 expect(screen.getAllByText('Count unavailable')).toHaveLength(1);
 expect(await screen.findByText(healthy)).toBeVisible();expect(screen.queryByText(failed)).toBeNull();
 expect(screen.getByText('Property owner-a')).toBeVisible();
});
