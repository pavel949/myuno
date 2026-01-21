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
  // Most Popular
  { id: 'pool', labelEn: 'Pool', labelRu: 'Бассейн', icon: '🏊' },
  { id: 'sea-view', labelEn: 'Sea View', labelRu: 'Вид на море', icon: '🌊' },
  { id: 'beachfront', labelEn: 'Beachfront', labelRu: 'На пляже', icon: '🏖️' },
  { id: 'mountain-view', labelEn: 'Mountain View', labelRu: 'Вид на горы', icon: '⛰️' },
  // Comfort
  { id: 'ac', labelEn: 'Air Conditioning', labelRu: 'Кондиционер', icon: '❄️' },
  { id: 'furnished', labelEn: 'Furnished', labelRu: 'С мебелью', icon: '🛋️' },
  { id: 'wifi', labelEn: 'WiFi', labelRu: 'WiFi', icon: '📶' },
  { id: 'smart-home', labelEn: 'Smart Home', labelRu: 'Умный дом', icon: '🏠' },
  // Facilities
  { id: 'gym', labelEn: 'Gym', labelRu: 'Тренажерный зал', icon: '🏋️' },
  { id: 'parking', labelEn: 'Parking', labelRu: 'Парковка', icon: '🅿️' },
  { id: 'garden', labelEn: 'Garden', labelRu: 'Сад', icon: '🌳' },
  { id: 'rooftop', labelEn: 'Rooftop', labelRu: 'Терраса на крыше', icon: '🌅' },
  { id: 'jacuzzi', labelEn: 'Jacuzzi', labelRu: 'Джакузи', icon: '🛁' },
  { id: 'sauna', labelEn: 'Sauna', labelRu: 'Сауна', icon: '🧖' },
  // Security & Services
  { id: 'security', labelEn: '24h Security', labelRu: 'Охрана 24ч', icon: '🔒' },
  { id: 'cctv', labelEn: 'CCTV', labelRu: 'Видеонаблюдение', icon: '📹' },
  { id: 'concierge', labelEn: 'Concierge', labelRu: 'Консьерж', icon: '🛎️' },
  { id: 'maid-service', labelEn: 'Maid Service', labelRu: 'Уборка', icon: '🧹' },
  // Family & Pets
  { id: 'pet-friendly', labelEn: 'Pet Friendly', labelRu: 'Можно с животными', icon: '🐕' },
  { id: 'kids-pool', labelEn: 'Kids Pool', labelRu: 'Детский бассейн', icon: '👶' },
  { id: 'playground', labelEn: 'Playground', labelRu: 'Детская площадка', icon: '🎠' },
  // Kitchen & Dining
  { id: 'kitchen', labelEn: 'Full Kitchen', labelRu: 'Полная кухня', icon: '🍳' },
  { id: 'bbq', labelEn: 'BBQ Area', labelRu: 'Зона барбекю', icon: '🍖' },
];

// ====== DISTRICTS ======
export const phuketDistrictOptions: FilterOption[] = [
  // West Coast (Tourist)
  { id: 'patong', labelEn: 'Patong', labelRu: 'Патонг', icon: '🏖️' },
  { id: 'kata', labelEn: 'Kata', labelRu: 'Ката', icon: '🌴' },
  { id: 'karon', labelEn: 'Karon', labelRu: 'Карон', icon: '🌊' },
  { id: 'kamala', labelEn: 'Kamala', labelRu: 'Камала', icon: '🌅' },
  { id: 'surin', labelEn: 'Surin', labelRu: 'Сурин', icon: '🏝️' },
  { id: 'bang-tao', labelEn: 'Bang Tao', labelRu: 'Банг Тао', icon: '⛱️' },
  { id: 'laguna', labelEn: 'Laguna', labelRu: 'Лагуна', icon: '🏌️' },
  { id: 'layan', labelEn: 'Layan', labelRu: 'Лаян', icon: '🌿' },
  { id: 'naithon', labelEn: 'Nai Thon', labelRu: 'Най Тон', icon: '🐢' },
  { id: 'nai-harn', labelEn: 'Nai Harn', labelRu: 'Най Харн', icon: '⛵' },
  // South
  { id: 'rawai', labelEn: 'Rawai', labelRu: 'Равай', icon: '🐚' },
  { id: 'chalong', labelEn: 'Chalong', labelRu: 'Чалонг', icon: '⚓' },
  { id: 'kata-noi', labelEn: 'Kata Noi', labelRu: 'Ката Ной', icon: '🏊' },
  // Central & Town
  { id: 'phuket-town', labelEn: 'Phuket Town', labelRu: 'Пхукет Таун', icon: '🏙️' },
  { id: 'kathu', labelEn: 'Kathu', labelRu: 'Кату', icon: '🏠' },
  { id: 'cherngtalay', labelEn: 'Cherngtalay', labelRu: 'Чернгталай', icon: '🌳' },
  { id: 'thalang', labelEn: 'Thalang', labelRu: 'Таланг', icon: '🏡' },
  // East Coast
  { id: 'cape-panwa', labelEn: 'Cape Panwa', labelRu: 'Мыс Панва', icon: '🌊' },
  { id: 'ao-po', labelEn: 'Ao Po', labelRu: 'Ао По', icon: '🚤' },
  // Airport Area
  { id: 'mai-khao', labelEn: 'Mai Khao', labelRu: 'Май Кхао', icon: '✈️' },
  { id: 'nai-yang', labelEn: 'Nai Yang', labelRu: 'Най Янг', icon: '🛫' },
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
