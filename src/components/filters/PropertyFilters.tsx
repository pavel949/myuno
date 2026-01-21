import { FilterConfig, FilterOption } from './UniversalFilter';

// ====== PROPERTY TYPES ======
export const propertyTypeOptions: FilterOption[] = [
  { id: 'villa', labelEn: 'Villa', labelRu: 'Вилла', icon: '🏡' },
  { id: 'apartment', labelEn: 'Apartment', labelRu: 'Квартира', icon: '🏢' },
  { id: 'condo', labelEn: 'Condo', labelRu: 'Кондо', icon: '🏬' },
  { id: 'house', labelEn: 'House', labelRu: 'Дом', icon: '🏠' },
  { id: 'penthouse', labelEn: 'Penthouse', labelRu: 'Пентхаус', icon: '🌆' },
  { id: 'townhouse', labelEn: 'Townhouse', labelRu: 'Таунхаус', icon: '🏘️' },
];

// ====== BEDROOMS ======
export const bedroomOptions: FilterOption[] = [
  { id: 'studio', labelEn: 'Studio', labelRu: 'Студия', icon: '🛏️' },
  { id: '1', labelEn: '1 Bedroom', labelRu: '1 спальня', icon: '1️⃣' },
  { id: '2', labelEn: '2 Bedrooms', labelRu: '2 спальни', icon: '2️⃣' },
  { id: '3', labelEn: '3 Bedrooms', labelRu: '3 спальни', icon: '3️⃣' },
  { id: '4+', labelEn: '4+ Bedrooms', labelRu: '4+ спальни', icon: '4️⃣' },
];

// ====== AMENITIES ======
export const propertyAmenityOptions: FilterOption[] = [
  { id: 'pool', labelEn: 'Pool', labelRu: 'Бассейн', icon: '🏊' },
  { id: 'sea-view', labelEn: 'Sea View', labelRu: 'Вид на море', icon: '🌊' },
  { id: 'gym', labelEn: 'Gym', labelRu: 'Тренажерный зал', icon: '🏋️' },
  { id: 'parking', labelEn: 'Parking', labelRu: 'Парковка', icon: '🅿️' },
  { id: 'security', labelEn: '24h Security', labelRu: 'Охрана 24ч', icon: '🔒' },
  { id: 'garden', labelEn: 'Garden', labelRu: 'Сад', icon: '🌳' },
  { id: 'wifi', labelEn: 'WiFi', labelRu: 'WiFi', icon: '📶' },
  { id: 'ac', labelEn: 'Air Conditioning', labelRu: 'Кондиционер', icon: '❄️' },
  { id: 'furnished', labelEn: 'Furnished', labelRu: 'С мебелью', icon: '🛋️' },
  { id: 'pet-friendly', labelEn: 'Pet Friendly', labelRu: 'Можно с животными', icon: '🐕' },
];

// ====== DISTRICTS ======
export const phuketDistrictOptions: FilterOption[] = [
  { id: 'patong', labelEn: 'Patong', labelRu: 'Патонг', icon: '🏖️' },
  { id: 'kata', labelEn: 'Kata', labelRu: 'Ката', icon: '🌴' },
  { id: 'karon', labelEn: 'Karon', labelRu: 'Карон', icon: '🌊' },
  { id: 'rawai', labelEn: 'Rawai', labelRu: 'Равай', icon: '🐚' },
  { id: 'kamala', labelEn: 'Kamala', labelRu: 'Камала', icon: '🌅' },
  { id: 'surin', labelEn: 'Surin', labelRu: 'Сурин', icon: '🏝️' },
  { id: 'bang-tao', labelEn: 'Bang Tao', labelRu: 'Банг Тао', icon: '⛱️' },
  { id: 'phuket-town', labelEn: 'Phuket Town', labelRu: 'Пхукет Таун', icon: '🏙️' },
];

// ====== LISTING TYPE ======
export const listingTypeOptions: FilterOption[] = [
  { id: 'rent', labelEn: 'For Rent', labelRu: 'Аренда', icon: '🔑' },
  { id: 'sale', labelEn: 'For Sale', labelRu: 'Продажа', icon: '🏷️' },
];

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
