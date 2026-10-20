import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, useLocation, useNavigate } from 'react-router-dom';
import PartnerApplicationsAdmin from '../PartnerApplicationsAdmin';

const state=vi.hoisted(()=>({admin:true,error:false,mode:'normal',reads:vi.fn(),write:vi.fn(()=>{throw Error('Unexpected business write');})}));
vi.mock('@/contexts/LanguageContext',()=>({useLanguage:()=>({language:'en'})}));
vi.mock('@/contexts/AuthContext',()=>({useAuth:()=>({user:{id:'synthetic-admin'}})}));
vi.mock('@/hooks/useIsAdmin',()=>({useIsAdmin:()=>({isAdmin:state.admin,isLoading:false})}));
vi.mock('framer-motion',()=>({motion:{div:({children,initial,animate,exit,transition,...props}:React.PropsWithChildren<Record<string,unknown>>)=><div {...props}>{children}</div>},AnimatePresence:({children}:React.PropsWithChildren)=>children}));
vi.mock('@/integrations/supabase/client',()=>({supabase:{from:(table:string)=>{
  state.reads(table);
  let rows=[
    {id:'pending',status:'pending',business_name:'Pending fixture business',business_category:'services',contact_name:'Contact',contact_email:'fixture@example.invalid',created_at:'2026-10-20T00:00:00.000Z'},
    {id:'approved',status:'approved',business_name:'Approved fixture business',business_category:'services',contact_name:'Contact',contact_email:'fixture@example.invalid',created_at:'2026-10-20T00:00:00.000Z'},
  ];
  if(state.mode==='cap')rows=[...Array.from({length:1000},(_,i)=>({...rows[1],id:`approved-${i}`,business_name:`New approved ${i}`})),{...rows[0],id:'older',business_name:'Older pending fixture',created_at:'2026-10-18T00:00:00.000Z'}];
  if(state.mode==='ties')rows=Array.from({length:51},(_,i)=>({...rows[0],id:String(i).padStart(3,'0'),business_name:`Tie application ${String(i).padStart(3,'0')}`}));
  const sorts:{column:string;ascending:boolean}[]=[];let start=0,end=999;
  const query={select:()=>query,order:(column:string,options:{ascending:boolean})=>{sorts.push({column,ascending:options.ascending});return query;},eq:(column:string,value:string)=>{rows=rows.filter(row=>row[column as keyof typeof row]===value);return query;},or:(condition:string)=>{const term=condition.split('%')[1].toLowerCase();rows=rows.filter(row=>[row.business_name,row.contact_name,row.contact_email].some(value=>value.toLowerCase().includes(term)));return query;},range:(from:number,to:number)=>{start=from;end=to;return query;},then:(resolve:(value:unknown)=>unknown)=>{rows.sort((a,b)=>{for(const sort of sorts){const result=String(a[sort.column as keyof typeof a]).localeCompare(String(b[sort.column as keyof typeof b]));if(result)return sort.ascending?result:-result;}return 0;});return Promise.resolve({data:state.error?null:rows.slice(start,end+1),count:rows.length,error:state.error?Error('Synthetic read failure'):null}).then(resolve);},update:state.write};return query;
},functions:{invoke:state.write}}}));
function Boundary(){const location=useLocation(),navigate=useNavigate();return<><output data-testid="location">{location.search}</output><button onClick={()=>navigate(-1)}>Back fixture</button><button onClick={()=>navigate(1)}>Forward fixture</button></>;}
function setup(search='status=pending&source=dashboard'){render(<MemoryRouter initialEntries={['/admin/partner-applications?'+search]} future={{v7_startTransition:true,v7_relativeSplatPath:true}}><PartnerApplicationsAdmin/><Boundary/></MemoryRouter>);}
afterEach(()=>{cleanup();state.admin=true;state.error=false;state.mode='normal';vi.clearAllMocks();});
describe('partner application queue deep link',()=>{
  it('opens pending only and restores exact URL filter after reset/back/forward without writes',async()=>{
    setup();
    expect(await screen.findByRole('heading',{name:'Pending fixture business'})).toBeInTheDocument();
    expect(screen.queryByRole('heading',{name:'Approved fixture business'})).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button',{name:'Reset filters'}));
    expect(await screen.findByRole('heading',{name:'Approved fixture business'})).toBeInTheDocument();
    expect(screen.getByTestId('location')).toHaveTextContent('?source=dashboard');
    fireEvent.click(screen.getByRole('button',{name:'Back fixture'}));
    await waitFor(()=>expect(screen.queryByRole('heading',{name:'Approved fixture business'})).not.toBeInTheDocument());
    expect(screen.getByTestId('location')).toHaveTextContent('status=pending');
    fireEvent.click(screen.getByRole('button',{name:'Forward fixture'}));
    expect(await screen.findByRole('heading',{name:'Approved fixture business'})).toBeInTheDocument();
    expect(state.write).not.toHaveBeenCalled();
  });
  it('validates unknown status against own configuration keys',async()=>{
    setup('status=__proto__&q=Approved&source=dashboard');
    expect(await screen.findByRole('heading',{name:'Approved fixture business'})).toBeInTheDocument();
    expect(screen.getByRole('button',{name:'All statuses'})).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Search by name, email...')).toHaveValue('Approved');
    expect(state.write).not.toHaveBeenCalled();
  });
  it('reaches the older pending record behind1000newer approved applications',async()=>{state.mode='cap';setup();expect(await screen.findByRole('heading',{name:'Older pending fixture'})).toBeInTheDocument();expect(screen.queryByRole('heading',{name:'New approved 0'})).not.toBeInTheDocument();expect(screen.getByText(/^Matching applications:/)).toHaveTextContent('Matching applications: 1');expect(state.write).not.toHaveBeenCalled();});
  it('uses id ordering to paginate equal-created records without overlap',async()=>{state.mode='ties';setup();expect(await screen.findByRole('heading',{name:'Tie application 050'})).toBeInTheDocument();expect(screen.getByRole('heading',{name:'Tie application 001'})).toBeInTheDocument();expect(screen.queryByRole('heading',{name:'Tie application 000'})).not.toBeInTheDocument();fireEvent.click(screen.getByRole('button',{name:'Next'}));expect(await screen.findByRole('heading',{name:'Tie application 000'})).toBeInTheDocument();expect(screen.queryByRole('heading',{name:'Tie application 001'})).not.toBeInTheDocument();expect(screen.getByRole('button',{name:'Next'})).toBeDisabled();},15000);
  it('does not fetch or write without verified admin permission',async()=>{
    state.admin=false;setup();
    expect(await screen.findByRole('heading',{name:'Access Denied'})).toBeInTheDocument();
    expect(state.reads).not.toHaveBeenCalled();expect(state.write).not.toHaveBeenCalled();
  });
  it('shows read failure instead of an empty queue and retries without business writes',async()=>{
    state.error=true;setup();
    expect(await screen.findByRole('alert')).toHaveTextContent('Could not load partner applications');
    expect(screen.queryByText('No applications found')).not.toBeInTheDocument();
    state.error=false;fireEvent.click(screen.getByRole('button',{name:'Retry'}));
    expect(await screen.findByRole('heading',{name:'Pending fixture business'})).toBeInTheDocument();
    expect(state.write).not.toHaveBeenCalled();
  });
});
