/**
 * @module VerticalGroups
 * @description Canonical grouping of verticals for the Services Hub.
 * 
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
      { verticalId: 'experience' },
      { verticalId: 'yacht' },
      { verticalId: 'water_activity' },
      { verticalId: 'event' },
      { verticalId: 'restaurant' },
    ],
  },
  {
    id: 'wellness',
    labelEn: 'Health & Wellness',
    labelRu: 'Здоровье и красота',
    icon: '🏥',
    items: [
      { verticalId: 'medical' },
      { route: '/pharmacy', icon: '💊', labelEn: 'Pharmacy', labelRu: 'Аптека' },
      { verticalId: 'beauty' },
      { verticalId: 'fitness' },
      { verticalId: 'insurance' },
    ],
  },
  {
    id: 'community',
    labelEn: 'Community',
    labelRu: 'Сообщество',
    icon: '🏪',
    items: [
      { route: '/classifieds', icon: '🏪', labelEn: 'Flea Market', labelRu: 'Барахолка' },
      { route: '/market', icon: '🛒', labelEn: 'Marketplace', labelRu: 'Маркетплейс' },
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
      { route: '/banking', icon: '🌍', labelEn: 'Relocation Services', labelRu: 'Релокация' },
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
