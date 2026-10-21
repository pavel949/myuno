import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, useLocation, useNavigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { OperationsBookingsTab } from './OperationsBookingsTab';

const state = vi.hoisted(() => ({error:false, many:false, noCount:false, reads:[] as {column:string;value:unknown}[]}));
vi.mock('@/contexts/LanguageContext', () => ({useLanguage:()=>({language:'en',t:(key:string)=>key})}));
vi.mock('./AdminOrderDetailSheet', () => ({AdminOrderDetailSheet:()=>null}));
vi.mock('@/integrations/supabase/client', () => ({supabase:{from:(table:string)=>{
  let rows = table==='profiles' ? [] : [
    {id:'older',order_number:'Older order',status:'pending',created_at:'2026-10-18T00:00:00.000Z',deleted_at:null,order_items:[],order_participants:[]},
    {id:'newer',order_number:'Newer order',status:'pending',created_at:'2026-10-20T00:00:00.000Z',deleted_at:null,order_items:[],order_participants:[]},
    {id:'deleted',order_number:'Deleted order',status:'pending',created_at:'2026-10-18T00:00:00.000Z',deleted_at:'deleted',order_items:[],order_participants:[]},
  ];
  if(state.many&&table==='orders') rows=Array.from({length:101},(_,index)=>({...rows[0],id:`row-${index}`,order_number:`Queue order ${index}`}));
  let start=0,end=999;
  const query = {
    select:()=>query,order:()=>query,limit:()=>query,
    range:(from:number,to:number)=>{start=from;end=to;return query;},
    is:(column:string,value:unknown)=>{state.reads.push({column,value}); rows=rows.filter(row=>row[column as keyof typeof row]===value);return query;},
    eq:(column:string,value:unknown)=>{state.reads.push({column,value}); rows=rows.filter(row=>row[column as keyof typeof row]===value);return query;},
    lt:(column:string,value:string)=>{state.reads.push({column,value});rows=rows.filter(row=>String(row[column as keyof typeof row])<value);return query;},
    in:()=>query,
    then:(resolve:(value:unknown)=>unknown)=>Promise.resolve({data:state.error?null:rows.slice(start,end+1),count:state.noCount?null:rows.length,error:state.error?new Error('Synthetic read failure'):null}).then(resolve),
  };return query;
}}}));
function Boundary() {
  const location=useLocation(),navigate=useNavigate();
  return <><output data-testid="location">{location.search}</output><button onClick={()=>navigate(-1)}>Back fixture</button><button onClick={()=>navigate(1)}>Forward fixture</button></>;
}
function setup() {
  state.reads=[];
  render(<QueryClientProvider client={new QueryClient({defaultOptions:{queries:{retry:false,gcTime:0}}})}><MemoryRouter initialEntries={['/admin/operations?tab=bookings&status=pending&created_before=2026-10-19T00%3A00%3A00.000Z&source=dashboard']} future={{v7_startTransition:true,v7_relativeSplatPath:true}}><OperationsBookingsTab/><Boundary/></MemoryRouter></QueryClientProvider>);
}
afterEach(()=>{cleanup();state.error=false;state.many=false;state.noCount=false;});
describe('actual operations order queue URL',()=>{
  it('opens exact nondeleted pending cutoff records and restores filters through reset and history',async()=>{
    setup();
    expect(await screen.findByText('Older order')).toBeInTheDocument();
    expect(screen.queryByText('Newer order')).not.toBeInTheDocument();
    expect(screen.queryByText('Deleted order')).not.toBeInTheDocument();
    expect(state.reads).toContainEqual({column:'deleted_at',value:null});
    expect(state.reads).toContainEqual({column:'status',value:'pending'});
    expect(state.reads).toContainEqual({column:'created_at',value:'2026-10-19T00:00:00.000Z'});
    fireEvent.click(screen.getByRole('button',{name:'Reset filters'}));
    expect(await screen.findByText('Newer order')).toBeInTheDocument();
    expect(screen.getByTestId('location')).toHaveTextContent('?tab=bookings&source=dashboard');
    fireEvent.click(screen.getByRole('button',{name:'Back fixture'}));
    await waitFor(()=>expect(screen.queryByText('Newer order')).not.toBeInTheDocument());
    expect(screen.getByTestId('location')).toHaveTextContent('created_before=');
    fireEvent.click(screen.getByRole('button',{name:'Forward fixture'}));
    expect(await screen.findByText('Newer order')).toBeInTheDocument();
  });
  it('shows source failure with retry and does not report no matching records or zero stats',async()=>{
    state.error=true;setup();
    expect(await screen.findByRole('alert')).toHaveTextContent('Could not load orders');
    expect(screen.queryByText('admin.orders.stats.pending')).not.toBeInTheDocument();
    state.error=false;
    fireEvent.click(screen.getByRole('button',{name:'Retry'}));
    expect(await screen.findByText('Older order')).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
  it('keeps all exact-count records reachable through URL pages',async()=>{
    state.many=true;setup();
    expect(await screen.findByText('Queue order 99')).toBeInTheDocument();
    expect(screen.queryByText('Queue order 100')).not.toBeInTheDocument();
    expect(screen.getByText(/^Matching orders:/)).toHaveTextContent('Matching orders: 101');
    fireEvent.click(screen.getByRole('button',{name:'Next'}));
    expect(await screen.findByText('Queue order 100')).toBeInTheDocument();
    expect(screen.getByTestId('location')).toHaveTextContent('order_page=1');
    expect(screen.getByRole('button',{name:'Next'})).toBeDisabled();
    fireEvent.click(screen.getByRole('button',{name:'Previous'}));
    expect(await screen.findByText('Queue order 99')).toBeInTheDocument();
  }, 15000); // Three real 100-row table renders can exceed the default 5s on the shared Windows executor.
  it('shows an unavailable exact count and disables unproven next pages',async()=>{
    state.noCount=true;setup();
    expect(await screen.findByText('Older order')).toBeInTheDocument();
    expect(screen.getByText(/^Matching orders:/)).toHaveTextContent('Count unavailable');
    expect(screen.getByRole('button',{name:'Next'})).toBeDisabled();
  });
});
