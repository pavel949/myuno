import { FilterConfig, FilterOption } from './UniversalFilter';
import { 
  PROPERTY_TYPES, 
  PHUKET_DISTRICTS, 
  BEDROOM_OPTIONS, 
  LISTING_TYPES,
  ALL_AMENITIES 
} from '@/lib/propertyTaxonomy';

// ====== PROPERTY TYPES - from taxonomy ======
export const propertyTypeOptions: FilterOption[] = PROPERTY_TYPES.map(t => ({
  id: t.id,
  labelEn: t.labelEn,
  labelRu: t.labelRu,
  icon: t.icon,
}));

// ====== BEDROOMS - from taxonomy ======
export const bedroomOptions: FilterOption[] = BEDROOM_OPTIONS.map(b => ({
  id: b.id,
  labelEn: b.labelEn,
  labelRu: b.labelRu,
  icon: b.icon,
}));

// ====== AMENITIES - from taxonomy ======
export const propertyAmenityOptions: FilterOption[] = ALL_AMENITIES.map(a => ({
  id: a.id,
  labelEn: a.labelEn,
  labelRu: a.labelRu,
  icon: a.icon,
}));

// ====== DISTRICTS - from taxonomy ======
export const phuketDistrictOptions: FilterOption[] = PHUKET_DISTRICTS.map(d => ({
  id: d.id,
  labelEn: d.labelEn,
  labelRu: d.labelRu,
  icon: d.icon,
}));

// ====== LISTING TYPE - from taxonomy ======
export const listingTypeOptions: FilterOption[] = LISTING_TYPES.map(l => ({
  id: l.id,
  labelEn: l.labelEn,
  labelRu: l.labelRu,
  icon: l.icon,
}));

// ====== COMPLETE PROPERTY FILTER CONFIG ======
export const propertyFilterConfig: FilterConfig = {
  sections: [
    {
      id: 'priceLevel',
      titleEn: 'Price Level',
      titleRu: 'Уровень цен',
      type: 'price-level',
      options: [],
    },
    {
      id: 'listingType',
      titleEn: 'Listing Type',
      titleRu: 'Тип объявления',
      type: 'single',
      options: listingTypeOptions,
    },
    {
      id: 'propertyType',
      titleEn: 'Property Type',
      titleRu: 'Тип недвижимости',
      type: 'multi',
      options: propertyTypeOptions,
    },
    {
      id: 'bedrooms',
      titleEn: 'Bedrooms',
      titleRu: 'Спальни',
      type: 'multi',
      options: bedroomOptions,
    },
    {
      id: 'district',
      titleEn: 'District',
      titleRu: 'Район',
      type: 'multi',
      options: phuketDistrictOptions,
    },
    {
      id: 'amenities',
      titleEn: 'Amenities',
      titleRu: 'Удобства',
      type: 'multi',
      options: propertyAmenityOptions,
    },
  ],
};
