import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, useLocation, useNavigate } from 'react-router-dom';
import PartnerApplicationsAdmin from '../PartnerApplicationsAdmin';

const state=vi.hoisted(()=>({admin:true,error:false,reads:vi.fn(),write:vi.fn(()=>{throw Error('Unexpected business write');})}));
vi.mock('@/contexts/LanguageContext',()=>({useLanguage:()=>({language:'en'})}));
vi.mock('@/contexts/AuthContext',()=>({useAuth:()=>({user:{id:'synthetic-admin'}})}));
vi.mock('@/hooks/useIsAdmin',()=>({useIsAdmin:()=>({isAdmin:state.admin,isLoading:false})}));
vi.mock('framer-motion',()=>({motion:{div:({children,initial,animate,exit,transition,...props}:React.PropsWithChildren<Record<string,unknown>>)=><div {...props}>{children}</div>},AnimatePresence:({children}:React.PropsWithChildren)=>children}));
vi.mock('@/integrations/supabase/client',()=>({supabase:{from:(table:string)=>{
  state.reads(table);
  return{select:()=>({order:()=>Promise.resolve({data:state.error?null:[
    {id:'pending',status:'pending',business_name:'Pending fixture business',business_category:'services',contact_name:'Contact',contact_email:'fixture@example.invalid',created_at:'2026-10-20T00:00:00.000Z'},
    {id:'approved',status:'approved',business_name:'Approved fixture business',business_category:'services',contact_name:'Contact',contact_email:'fixture@example.invalid',created_at:'2026-10-20T00:00:00.000Z'},
  ],error:state.error?Error('Synthetic read failure'):null})}),update:state.write};
},functions:{invoke:state.write}}}));
function Boundary(){const location=useLocation(),navigate=useNavigate();return<><output data-testid="location">{location.search}</output><button onClick={()=>navigate(-1)}>Back fixture</button><button onClick={()=>navigate(1)}>Forward fixture</button></>;}
function setup(search='status=pending&source=dashboard'){render(<MemoryRouter initialEntries={['/admin/partner-applications?'+search]} future={{v7_startTransition:true,v7_relativeSplatPath:true}}><PartnerApplicationsAdmin/><Boundary/></MemoryRouter>);}
afterEach(()=>{cleanup();state.admin=true;state.error=false;vi.clearAllMocks();});
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
