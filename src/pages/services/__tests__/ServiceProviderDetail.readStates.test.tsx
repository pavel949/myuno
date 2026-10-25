import React, { useState } from 'react';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
const state=vi.hoisted(()=>({ language:'en',data:{} as Record<string,Record<string,unknown>>,refetch:vi.fn(),cart:vi.fn() }));
vi.mock('@/hooks/useProviderDetails',()=>({useProviderDetails:(id:string)=>({provider:null,services:[],isLoading:false,isFetching:false,error:null,servicesError:null,refetch:state.refetch,...state.data[id]})}));
vi.mock('@/contexts/LanguageContext',()=>({useLanguage:()=>({language:state.language})}));
vi.mock('@/contexts/CartContext',()=>({useCart:()=>({items:[],addItem:state.cart,removeItem:vi.fn()})}));
vi.mock('@/hooks/useCartToast',()=>({useCartToast:()=>({showAddedToast:vi.fn()})}));
vi.mock('@/hooks/useReviews',()=>({useReviews:()=>({reviews:[],stats:{average:0,total:0},isLoading:false})}));
vi.mock('@/components/layout/AppLayout',()=>({AppLayout:({children}:{children:React.ReactNode})=><main>{children}</main>}));
vi.mock('@/components/services/ServiceBookingSheet',()=>({ServiceBookingSheet:({service,open}:{service:{id:string;providerId:string}|null;open:boolean})=>{const[draft,setDraft]=useState('');return open&&service?<div role="region" aria-label="Synthetic booking"><output>{service.providerId}:{service.id}</output><input aria-label="Booking draft" value={draft} onChange={e=>setDraft(e.target.value)}/></div>:null;}}));
import ServiceProviderDetail from '../ServiceProviderDetail';
const loaded=(id:string)=>({provider:{id,name:`Provider ${id}`,is_active:true,is_verified:false,created_at:'2026-01-01',logo_url:'/synthetic.svg'},services:[{id:`service-${id}`,name_en:`Service ${id}`,name_ru:`Услуга ${id}`,price:100,currency:'THB',is_active:true}]});
function Boundary(){const navigate=useNavigate(),location=useLocation();return <><button onClick={()=>navigate('/services/provider/B?returnTo=%2Fdiscover%2Fservices%3Fq%3Dcleaning')}>Next provider</button><output data-testid="route">{location.pathname+location.search}</output></>;}
function Harness(){return <MemoryRouter initialEntries={['/services/provider/A?returnTo=%2Fdiscover%2Fservices%3Fq%3Dcleaning']}><Boundary/><Routes><Route path="/services/provider/:id" element={<ServiceProviderDetail/>}/><Route path="/discover/services" element={<h1>Catalogue</h1>}/></Routes></MemoryRouter>;}
beforeEach(()=>{state.language='en';state.data={A:loaded('A'),B:{isLoading:true}};vi.clearAllMocks();});afterEach(cleanup);
it.each([['en','Provider could not be loaded'],['ru','Не удалось загрузить специалиста'],['th','ไม่สามารถโหลดผู้ให้บริการได้']])('reports failed reads truthfully in %s', (language,title)=>{
 state.language=language;state.data.A={error:'Synthetic failure'};render(<Harness/>);expect(screen.getByRole('alert')).toHaveTextContent(title);expect(screen.queryByText('Provider not found')).toBeNull();expect(screen.queryByRole('button',{name:'Book Now'})).toBeNull();
});
it('retries a failed read without changing the canonical route/query and distinguishes confirmed missing',()=>{
 state.data.A={error:'Synthetic failure'};const view=render(<Harness/>);fireEvent.click(screen.getByRole('button',{name:'Try again'}));expect(state.refetch).toHaveBeenCalledOnce();expect(screen.getByTestId('route')).toHaveTextContent('returnTo=%2Fdiscover%2Fservices%3Fq%3Dcleaning');
 state.data.A={};view.rerender(<Harness/>);expect(screen.getByText('Provider not found')).toBeVisible();expect(screen.queryByRole('alert')).toBeNull();fireEvent.click(screen.getByRole('button',{name:'Browse providers'}));expect(screen.getByRole('heading',{name:'Catalogue'})).toBeVisible();expect(screen.getByTestId('route')).toHaveTextContent('/discover/services?q=cleaning');
});
it('does not describe a service-read error as a successful empty catalogue',()=>{
 state.data.A={...loaded('A'),services:[],servicesError:'Synthetic service failure'};const view=render(<Harness/>);expect(screen.getByRole('alert')).toHaveTextContent('Services could not be loaded');expect(screen.queryByText('No services yet')).toBeNull();expect(screen.queryByRole('button',{name:'Add'})).toBeNull();
 state.data.A={...loaded('A'),services:[]};view.rerender(<Harness/>);expect(screen.getByText('No services yet')).toBeVisible();expect(screen.queryByRole('alert')).toBeNull();
});
it('keeps a same-provider booking draft through background error, retry and success',()=>{
 const view=render(<Harness/>);fireEvent.click(screen.getByRole('button',{name:'Book'}));const draft=screen.getByLabelText('Booking draft');fireEvent.change(draft,{target:{value:'Keep my notes'}});
 state.data.A={...loaded('A'),error:'Refresh failure'};view.rerender(<Harness/>);expect(screen.getByRole('alert')).toHaveTextContent('last loaded profile');expect(screen.getByLabelText('Booking draft')).toBe(draft);expect(draft).toHaveValue('Keep my notes');
 fireEvent.click(screen.getByRole('button',{name:'Try again'}));expect(state.refetch).toHaveBeenCalledOnce();state.data.A={...loaded('A'),error:'Refresh failure',isFetching:true};view.rerender(<Harness/>);expect(screen.getByRole('button',{name:'Try again'})).toBeDisabled();expect(screen.getByText('Refreshing provider…')).toHaveAttribute('role','status');
 state.data.A=loaded('A');view.rerender(<Harness/>);expect(screen.getByLabelText('Booking draft')).toBe(draft);expect(draft).toHaveValue('Keep my notes');
});
it('suppresses the previous booking selection on provider switch and uses only B service/ID payloads',()=>{
 const view=render(<Harness/>);fireEvent.click(screen.getByRole('button',{name:'Book'}));expect(screen.getByRole('region',{name:'Synthetic booking'})).toHaveTextContent('A:service-A');fireEvent.click(screen.getByRole('button',{name:'Next provider'}));expect(screen.queryByRole('region',{name:'Synthetic booking'})).toBeNull();expect(screen.queryByRole('heading',{name:'Provider A'})).toBeNull();
 state.data.B=loaded('B');view.rerender(<Harness/>);fireEvent.click(screen.getByRole('button',{name:'Add'}));expect(state.cart).toHaveBeenCalledWith(expect.objectContaining({id:'service-B',providerId:'B',providerName:'Provider B'}));fireEvent.click(screen.getByRole('button',{name:'Book'}));expect(screen.getByRole('region',{name:'Synthetic booking'})).toHaveTextContent('B:service-B');
});
