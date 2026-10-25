import{fireEvent,render,screen,cleanup}from'@testing-library/react';
import{afterEach,describe,expect,it,vi}from'vitest';
import{UniversalFilter}from'../UniversalFilter';
import{propertyPriceLevelDescriptions}from'@/lib/propertyCatalogServerFilters';
vi.mock('@/contexts/LanguageContext',()=>({useLanguage:()=>({language:'en'})}));
afterEach(cleanup);
describe('accessible budget selection',()=>{
 it('announces the selected canonical range and toggles selection without implying a listing price',()=>{render(<UniversalFilter config={{sections:[{id:'priceLevel',titleEn:'Budget',titleRu:'Бюджет',type:'price-level',options:[],priceLevelDescriptions:propertyPriceLevelDescriptions('rent','en')}]}} values={{priceLevel:'1'}} onChange={()=>{}}/>);fireEvent.click(screen.getByRole('button',{name:/Filters/}));const selected=screen.getByRole('button',{name:'฿: THB ≤ 3,000 · per night'});expect(selected).toHaveAttribute('aria-pressed','true');expect(screen.getByText('THB ≤ 3,000 · per night')).toBeVisible();fireEvent.click(selected);expect(selected).toHaveAttribute('aria-pressed','false');expect(screen.queryByText('THB ≤ 3,000 · per night')).toBeNull();const other=screen.getByRole('button',{name:'฿฿: THB 3,000–8,000 · per night'});fireEvent.click(other);expect(other).toHaveAttribute('aria-pressed','true');});
 it('does not invent property ranges for unrelated verticals',()=>{render(<UniversalFilter config={{sections:[{id:'priceLevel',titleEn:'Budget',titleRu:'Бюджет',type:'price-level',options:[]}]}} values={{priceLevel:'2'}} onChange={()=>{}}/>);fireEvent.click(screen.getByRole('button',{name:/Filters/}));expect(screen.getByRole('button',{name:'฿฿'})).toHaveAttribute('aria-pressed','true');expect(screen.queryByText(/THB/)).toBeNull();});
});
