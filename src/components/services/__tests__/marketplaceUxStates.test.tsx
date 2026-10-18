import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { MarketplaceServiceGrid } from '../MarketplaceServiceGrid';
import type { LocalizedServiceFunction } from '@/hooks/useServiceFunctions';
import { ServiceFunctionCard } from '../ServiceFunctionCard';
vi.mock('@/contexts/LanguageContext',()=>({useLanguage:()=>({language:'en'})}));
vi.mock('@/hooks/useServiceMarketplace',()=>({useMarketplaceServices:()=>({data:[],isLoading:false,isError:false,refetch:vi.fn()})}));
vi.mock('../ServiceBookingSheet',()=>({ServiceBookingSheet:()=>null}));
afterEach(cleanup);
describe('request versus online booking',()=>{
 it('explains the request alternative when providers are absent',()=>{render(<MarketplaceServiceGrid/>);expect(screen.getByText(/Online booking is not available yet/)).toHaveTextContent('request a specialist');});
 it('distinguishes unmatched search from an empty marketplace',()=>{render(<MarketplaceServiceGrid search="missing"/>);expect(screen.getByText(/No services match your search/)).toBeInTheDocument();expect(screen.queryByText(/Online booking is not available yet/)).not.toBeInTheDocument();});
 it('labels catalogue actions as requests rather than confirmed orders',()=>{render(<ServiceFunctionCard fn={{id:'test',name:'Cleaning',includes:[],currency:'THB',basePrice:800,estimatedTime:'1 hour',icon:'',category:'cleaning',description:'',sortOrder:0,raw:{} as LocalizedServiceFunction['raw']}}/>);expect(screen.getByRole('button',{name:'Request service'})).toBeInTheDocument();expect(screen.queryByRole('button',{name:'Order'})).not.toBeInTheDocument();});
});
