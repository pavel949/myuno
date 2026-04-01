/**
 * @module VerticalGroups
 * @description Canonical grouping of verticals for the Services Hub.
 * 
 * Synced with category_groups / categories DB tables (2026-03-07).
 * Items with `verticalId` reference VERTICALS registry entries.
 * Items with `route` (no verticalId) are standalone screens.
 */

export interface VerticalGroupItem {
  /** References VERTICALS[x].id — if set, icon/label come from verticals.ts */
  verticalId?: string;
  /** Direct route for standalone screens (not in VERTICALS) */
  route?: string;
  /** Override icon (emoji) for standalone screens */
  icon?: string;
  /** EN label for standalone screens */
  labelEn?: string;
  /** RU label for standalone screens */
  labelRu?: string;
}

export interface VerticalGroup {
  id: string;
  labelEn: string;
  labelRu: string;
  icon: string;
  items: VerticalGroupItem[];
}

export const VERTICAL_GROUPS: VerticalGroup[] = [
  {
    id: 'home',
    labelEn: 'Home & Living',
    labelRu: 'Дом и быт',
    icon: '🏠',
    items: [
      { verticalId: 'property' },
      { verticalId: 'cleaning' },
      { verticalId: 'babysitter' },
      { verticalId: 'pet_service' },
      { verticalId: 'flower' },
    ],
  },
  {
    id: 'transport',
    labelEn: 'Transport',
    labelRu: 'Транспорт',
    icon: '🚗',
    items: [
      { verticalId: 'transfer' },
      { verticalId: 'vehicle' },
      { route: '/transport/fast-track', icon: '✈️', labelEn: 'Fast Track', labelRu: 'Фаст-трек' },
    ],
  },
  {
    id: 'leisure',
    labelEn: 'Leisure & Activities',
    labelRu: 'Досуг и развлечения',
    icon: '🎯',
    items: [
      { verticalId: 'restaurant' },
      { verticalId: 'experience' },
      { verticalId: 'yacht' },
      { verticalId: 'water_activity' },
      { verticalId: 'event' },
      { route: '/food-delivery', icon: '🛵', labelEn: 'Food Delivery', labelRu: 'Доставка еды' },
    ],
  },
  {
    id: 'wellness',
    labelEn: 'Health & Wellness',
    labelRu: 'Здоровье и красота',
    icon: '🏥',
    items: [
      { verticalId: 'beauty' },
      { verticalId: 'medical' },
      { route: '/pharmacy', icon: '💊', labelEn: 'Pharmacy', labelRu: 'Аптека' },
      { verticalId: 'fitness' },
      { route: '/veterinary', icon: '🐕‍🦺', labelEn: 'Veterinary', labelRu: 'Ветеринары' },
      { verticalId: 'insurance' },
    ],
  },
  {
    id: 'admin',
    labelEn: 'Life Admin',
    labelRu: 'Документы и финансы',
    icon: '📋',
    items: [
      { verticalId: 'legal' },
      { verticalId: 'education' },
      { route: '/banking', icon: '🏦', labelEn: 'Banking & Finance', labelRu: 'Банки и финансы' },
      { route: '/visa', icon: '🌍', labelEn: 'Visa & Immigration', labelRu: 'Визы и иммиграция' },
      { route: '/relocate', icon: '🧳', labelEn: 'Relocation', labelRu: 'Переезд' },
    ],
  },
  {
    id: 'maintenance',
    labelEn: 'Home Maintenance',
    labelRu: 'Обслуживание дома',
    icon: '🔧',
    items: [
      { route: '/services/laundry', icon: '👕', labelEn: 'Laundry', labelRu: 'Прачечная' },
      { route: '/services/plumbing', icon: '🔧', labelEn: 'Plumbing', labelRu: 'Сантехника' },
      { route: '/services/electrical', icon: '⚡', labelEn: 'Electrical', labelRu: 'Электрика' },
      { route: '/services/ac-repair', icon: '❄️', labelEn: 'AC Repair', labelRu: 'Кондиционеры' },
      { route: '/services/gardening', icon: '🌿', labelEn: 'Gardening', labelRu: 'Сад и озеленение' },
      { route: '/services/pest-control', icon: '🐜', labelEn: 'Pest Control', labelRu: 'Дезинсекция' },
      { route: '/services/handyman', icon: '🛠️', labelEn: 'Handyman', labelRu: 'Мастер на час' },
      { route: '/services/locksmith', icon: '🔑', labelEn: 'Locksmith', labelRu: 'Замки и ключи' },
    ],
  },
  {
    id: 'help',
    labelEn: 'Help',
    labelRu: 'Помощь',
    icon: '🆘',
    items: [
      { route: '/vip-concierge', icon: '🎩', labelEn: 'Concierge', labelRu: 'Консьерж' },
      { route: '/sos', icon: '🆘', labelEn: 'Emergency Help', labelRu: 'Экстренная помощь' },
    ],
  },
];
