/**
 * @module HomeServicesTaxonomy
 * @deprecated Import from '@/lib/taxonomies' instead of this file directly.
 * This file is a FALLBACK data source. The database (lookup_values) is the source of truth.
 */

export type ServiceDomain = 'maintenance' | 'cleaning' | 'outdoor' | 'logistics';
export type ProviderType = 'individual' | 'company';

export interface ServiceCategory {
  id: string;
  labelEn: string;
  labelRu: string;
  icon: string;
  domain: ServiceDomain;
}

export interface ServiceDomainConfig {
  id: ServiceDomain;
  labelEn: string;
  labelRu: string;
  icon: string;
  categories: ServiceCategory[];
}

// ====== DOMAINS ======
export const SERVICE_DOMAINS: ServiceDomainConfig[] = [
  {
    id: 'maintenance',
    labelEn: 'Repair',
    labelRu: 'Ремонт',
    icon: '🏠',
    categories: [
      { id: 'handyman', labelEn: 'Handyman', labelRu: 'Мастер на час', icon: '🔨', domain: 'maintenance' },
      { id: 'plumbing', labelEn: 'Plumbing', labelRu: 'Сантехник', icon: '🚿', domain: 'maintenance' },
      { id: 'electrical', labelEn: 'Electrical', labelRu: 'Электрик', icon: '⚡', domain: 'maintenance' },
      { id: 'ac-repair', labelEn: 'AC Service', labelRu: 'Кондиционеры', icon: '❄️', domain: 'maintenance' },
      { id: 'repair', labelEn: 'Appliance Repair', labelRu: 'Ремонт техники', icon: '🔧', domain: 'maintenance' },
      { id: 'security', labelEn: 'Security', labelRu: 'Безопасность', icon: '🔒', domain: 'maintenance' },
    ],
  },
  {
    id: 'cleaning',
    labelEn: 'Cleaning',
    labelRu: 'Уборка',
    icon: '✨',
    categories: [
      { id: 'cleaning', labelEn: 'Home Cleaning', labelRu: 'Уборка', icon: '🏠', domain: 'cleaning' },
      { id: 'laundry', labelEn: 'Laundry', labelRu: 'Прачечная', icon: '👔', domain: 'cleaning' },
      { id: 'pest-control', labelEn: 'Pest Control', labelRu: 'Дезинсекция', icon: '🐜', domain: 'cleaning' },
    ],
  },
  {
    id: 'outdoor',
    labelEn: 'Outdoor',
    labelRu: 'Двор',
    icon: '🌿',
    categories: [
      { id: 'gardening', labelEn: 'Gardening', labelRu: 'Садовник', icon: '🌱', domain: 'outdoor' },
      { id: 'pool', labelEn: 'Pool Service', labelRu: 'Бассейн', icon: '🏊', domain: 'outdoor' },
      { id: 'exterior', labelEn: 'Exterior Wash', labelRu: 'Мойка фасадов', icon: '🏢', domain: 'outdoor' },
    ],
  },
  {
    id: 'logistics',
    labelEn: 'Moving',
    labelRu: 'Переезд',
    icon: '🚚',
    categories: [
      { id: 'moving', labelEn: 'Moving', labelRu: 'Переезд', icon: '📦', domain: 'logistics' },
      { id: 'water-delivery', labelEn: 'Water Delivery', labelRu: 'Доставка воды', icon: '💧', domain: 'logistics' },
      { id: 'road-assistance', labelEn: 'Road Assistance', labelRu: 'Авто помощь', icon: '🚗', domain: 'logistics' },
    ],
  },
];

// ====== FLAT CATEGORY LIST ======
export const ALL_SERVICE_CATEGORIES: ServiceCategory[] = SERVICE_DOMAINS.flatMap(d => d.categories);

// ====== CATEGORY ID TO CATEGORY MAP ======
export const CATEGORY_MAP: Record<string, ServiceCategory> = Object.fromEntries(
  ALL_SERVICE_CATEGORIES.map(cat => [cat.id, cat])
);

// ====== DOMAIN ID TO DOMAIN MAP ======
export const DOMAIN_MAP: Record<ServiceDomain, ServiceDomainConfig> = Object.fromEntries(
  SERVICE_DOMAINS.map(d => [d.id, d])
) as Record<ServiceDomain, ServiceDomainConfig>;

// ====== CATEGORY IDS FOR DB QUERIES ======
export const HOME_SERVICE_CATEGORY_IDS = ALL_SERVICE_CATEGORIES.map(c => c.id);

// ====== LEGACY MAPPING — mirrors public.canonical_provider_category() in DB ======
// Migration 2026-06-18: providers.business_category was normalised to match
// categories.slug. Old code paths passing legacy slugs get resolved to the
// canonical SSOT slug here so both client and DB agree.
export const LEGACY_CATEGORY_MAP: Record<string, string> = {
  // AC
  'hvac': 'ac-repair',
  'ac': 'ac-repair',
  'ac-service': 'ac-repair',
  // Repair
  'tech': 'repair',
  // Outdoor
  'garden': 'gardening',
  // Cleaning
  'pest': 'pest-control',
  'home-cleaning': 'cleaning',
  'home_cleaning': 'cleaning',
  'deep-cleaning': 'cleaning',
  'deep_cleaning': 'cleaning',
  // Catalog-wide (non-home but used elsewhere)
  'yacht_charter': 'yacht',
  'yacht-charter': 'yacht',
  'events': 'event',
  'transport': 'vehicle',
  'water': 'water-delivery',
  'property_management': 'property-management',
};

// ====== PROVIDER TYPE OPTIONS ======
export const PROVIDER_TYPE_OPTIONS = [
  { id: 'all', labelEn: 'All', labelRu: 'Все', icon: '👥' },
  { id: 'individual', labelEn: 'Masters', labelRu: 'Мастера', icon: '👤' },
  { id: 'company', labelEn: 'Companies', labelRu: 'Компании', icon: '🏢' },
] as const;

// ====== HELPER FUNCTIONS ======
export function getCategoryById(id: string): ServiceCategory | undefined {
  const normalized = LEGACY_CATEGORY_MAP[id] || id;
  return CATEGORY_MAP[normalized];
}

export function getDomainByCategory(categoryId: string): ServiceDomainConfig | undefined {
  const category = getCategoryById(categoryId);
  if (!category) return undefined;
  return DOMAIN_MAP[category.domain];
}

export function getCategoriesByDomain(domainId: ServiceDomain): ServiceCategory[] {
  return DOMAIN_MAP[domainId]?.categories || [];
}

export function normalizeCategory(categoryId: string): string {
  return LEGACY_CATEGORY_MAP[categoryId] || categoryId;
}
