import React from 'react';
import type { MarketplaceService } from '@/hooks/useServiceMarketplace';
const state = vi.hoisted(() => ({ data: [] as MarketplaceService[] }));
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { MarketplaceServiceGrid } from '../MarketplaceServiceGrid';
import type { LocalizedServiceFunction } from '@/hooks/useServiceFunctions';
import { ServiceFunctionCard } from '../ServiceFunctionCard';
vi.mock('@/contexts/LanguageContext',()=>({useLanguage:()=>({language:'en'})}));
vi.mock('@/hooks/useServiceMarketplace',()=>({useMarketplaceServices:()=>({data:state.data,isLoading:false,isError:false,refetch:vi.fn()})}));
vi.mock('../ServiceBookingSheet',()=>({ServiceBookingSheet:()=>null}));
beforeEach(() => { state.data = []; });
afterEach(cleanup);
describe('request versus online booking',()=>{
 it('explains the request alternative when providers are absent', () => {
   render(<MarketplaceServiceGrid />);
   expect(screen.getByRole('status')).toHaveTextContent(
     'Online booking is not available yet. You can request a service below.',
   );
 });
 it('distinguishes unmatched search from an empty marketplace',()=>{state.data = [{ id: 'fixture', name_en: 'Cleaning' } as MarketplaceService];render(<MarketplaceServiceGrid search="missing"/>);expect(screen.getByText(/No services match your search/)).toBeInTheDocument();expect(screen.queryByText(/Online booking is not available yet/)).not.toBeInTheDocument();});
 it('labels catalogue actions as requests rather than confirmed orders',()=>{render(<ServiceFunctionCard fn={{id:'test',name:'Cleaning',includes:[],currency:'THB',basePrice:800,estimatedTime:'1 hour',icon:'',category:'cleaning',description:'',sortOrder:0,raw:{} as LocalizedServiceFunction['raw']}}/>);expect(screen.getByRole('button',{name:'Request service'})).toBeInTheDocument();expect(screen.queryByRole('button',{name:'Order'})).not.toBeInTheDocument();});
});
