import {describe,expect,it}from'vitest';
import{propertyPriceLevelDescriptions,priceLevelToPriceRange}from'../propertyCatalogServerFilters';
describe('existing property budget band explanations',()=>{
 it('describes every nightly band from canonical limits',()=>{expect(propertyPriceLevelDescriptions('rent','en')).toEqual({'1':'THB ≤ 3,000 · per night','2':'THB 3,000–8,000 · per night','3':'THB 8,000–25,000 · per night','4':'THB ≥ 25,000 · per night'});});
 it('keeps sale asking bands separate and localizes basis',()=>{expect(propertyPriceLevelDescriptions('sale','ru')['1']).toBe('THB ≤ 5,000,000 · цена продажи');expect(propertyPriceLevelDescriptions('rent','th')['4']).toBe('THB ≥ 25,000 · ต่อคืน');expect(priceLevelToPriceRange('2','sale')).toEqual({minPrice:5000000,maxPrice:15000000});});
});
