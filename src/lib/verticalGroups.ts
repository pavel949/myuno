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
    id: 'transport',
    labelEn: 'Transport & Mobility',
    labelRu: 'Транспорт и мобильность',
    icon: '🚗',
    items: [
      { verticalId: 'transfer' },
      { verticalId: 'vehicle' },
      { route: '/transport/fast-track', icon: '✈️', labelEn: 'Fast Track', labelRu: 'Фаст-трек' },
    ],
  },
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
      { route: '/banking', icon: '🌍', labelEn: 'Relocation Services', labelRu: 'Релокация' },
    ],
  },
  {
    id: 'leisure',
    labelEn: 'Leisure & Lifestyle',
    labelRu: 'Досуг и стиль жизни',
    icon: '🎯',
    items: [
      { verticalId: 'experience' },
      { verticalId: 'event' },
      { verticalId: 'water_activity' },
      { verticalId: 'yacht' },
      { verticalId: 'fitness' },
      { verticalId: 'beauty' },
      { verticalId: 'restaurant' },
      { verticalId: 'flower' },
    ],
  },
  {
    id: 'health',
    labelEn: 'Health & Administration',
    labelRu: 'Здоровье и документы',
    icon: '🏥',
    items: [
      { verticalId: 'medical' },
      { route: '/pharmacy', icon: '💊', labelEn: 'Pharmacy', labelRu: 'Аптека' },
      { verticalId: 'insurance' },
      { verticalId: 'legal' },
      { verticalId: 'education' },
    ],
  },
  {
    id: 'premium',
    labelEn: 'Premium & Assistance',
    labelRu: 'Премиум и помощь',
    icon: '⭐',
    items: [
      { route: '/vip-concierge', icon: '🎩', labelEn: 'Concierge', labelRu: 'Консьерж' },
      { route: '/sos', icon: '🆘', labelEn: 'Emergency Help', labelRu: 'Экстренная помощь' },
    ],
  },
];
