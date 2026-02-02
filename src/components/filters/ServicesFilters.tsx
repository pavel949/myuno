import { FilterConfig, FilterOption } from './UniversalFilter';
import { 
  ALL_SERVICE_CATEGORIES, 
  SERVICE_DOMAINS,
  PROVIDER_TYPE_OPTIONS 
} from '@/lib/config/homeServicesTaxonomy';

// ====== SERVICE CATEGORIES (from centralized taxonomy) ======
export const serviceCategoryOptions: FilterOption[] = ALL_SERVICE_CATEGORIES.map(cat => ({
  id: cat.id,
  labelEn: cat.labelEn,
  labelRu: cat.labelRu,
  icon: cat.icon,
}));

// ====== SERVICE DOMAINS ======
export const serviceDomainOptions: FilterOption[] = SERVICE_DOMAINS.map(domain => ({
  id: domain.id,
  labelEn: domain.labelEn,
  labelRu: domain.labelRu,
  icon: domain.icon,
}));

// ====== PROVIDER TYPE ======
export const providerTypeOptions: FilterOption[] = PROVIDER_TYPE_OPTIONS.filter(o => o.id !== 'all').map(opt => ({
  id: opt.id,
  labelEn: opt.labelEn,
  labelRu: opt.labelRu,
  icon: opt.icon,
}));

// ====== SERVICE FEATURES ======
export const serviceFeatureOptions: FilterOption[] = [
  { id: 'verified', labelEn: 'Verified', labelRu: 'Проверенные', icon: '✅' },
  { id: 'insured', labelEn: 'Insured', labelRu: 'Застрахованы', icon: '🛡️' },
  { id: 'guaranteed', labelEn: 'Guaranteed', labelRu: 'Гарантия работ', icon: '💯' },
  { id: 'fast-response', labelEn: 'Fast Response', labelRu: 'Быстрый отклик', icon: '⚡' },
  { id: 'english', labelEn: 'English Speaking', labelRu: 'Говорят по-английски', icon: '🇬🇧' },
  { id: 'russian', labelEn: 'Russian Speaking', labelRu: 'Говорят по-русски', icon: '🇷🇺' },
];

// ====== BOOKING TYPE ======
export const bookingTypeOptions: FilterOption[] = [
  { id: 'hourly', labelEn: 'Hourly', labelRu: 'Почасовая', icon: '⏰' },
  { id: 'fixed', labelEn: 'Fixed Price', labelRu: 'Фикс цена', icon: '💵' },
  { id: 'subscription', labelEn: 'Subscription', labelRu: 'Подписка', icon: '🔄' },
];

// ====== COMPLETE SERVICES FILTER CONFIG ======
export const servicesFilterConfig: FilterConfig = {
  sections: [
    {
      id: 'providerType',
      titleEn: 'Provider Type',
      titleRu: 'Тип исполнителя',
      type: 'single',
      options: providerTypeOptions,
    },
    {
      id: 'priceLevel',
      titleEn: 'Price Level',
      titleRu: 'Уровень цен',
      type: 'price-level',
      options: [],
    },
    {
      id: 'category',
      titleEn: 'Service Type',
      titleRu: 'Тип услуги',
      type: 'multi',
      options: serviceCategoryOptions,
    },
    {
      id: 'bookingType',
      titleEn: 'Pricing',
      titleRu: 'Оплата',
      type: 'single',
      options: bookingTypeOptions,
    },
    {
      id: 'features',
      titleEn: 'Features',
      titleRu: 'Особенности',
      type: 'multi',
      options: serviceFeatureOptions,
    },
  ],
};
