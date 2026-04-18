/**
 * @module VerticalGroups
 * @description Journey-based grouping of verticals for the Services Hub and footer.
 *
 * Structure follows USER LIFE SITUATIONS, not service types:
 *   arrive  → first hours/days on Phuket
 *   live    → daily life (cleaning, childcare, pets)
 *   enjoy   → leisure, food, activities
 *   health  → medical, beauty, wellness
 *   settle  → visa, banking, school — one-time setup
 *   invest  → real estate buy/rent/invest
 *   maintain → home repair & maintenance
 *   help    → concierge & emergency
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
    id: 'arrive',
    labelEn: 'Arrival & Setup',
    labelRu: 'Прибытие и старт',
    icon: '🛬',
    items: [
      { verticalId: 'transfer' },
      { route: '/transport/fast-track', icon: '✈️', labelEn: 'Fast Track VIP', labelRu: 'Фаст-трек' },
      { verticalId: 'vehicle' },
      { route: '/sim', icon: '📱', labelEn: 'SIM Card', labelRu: 'SIM-карта' },
      { route: '/exchange', icon: '💱', labelEn: 'Currency Exchange', labelRu: 'Обмен валюты' },
    ],
  },
  {
    id: 'live',
    labelEn: 'Home & Daily Life',
    labelRu: 'Быт и дом',
    icon: '🏠',
    items: [
      { verticalId: 'property' },
      { verticalId: 'cleaning' },
      { route: '/services?category=laundry', icon: '👕', labelEn: 'Laundry', labelRu: 'Прачечная' },
      { verticalId: 'babysitter' },
      { verticalId: 'pet_service' },
      { verticalId: 'flower' },
    ],
  },
  {
    id: 'enjoy',
    labelEn: 'Leisure & Activities',
    labelRu: 'Досуг и развлечения',
    icon: '🎭',
    items: [
      { verticalId: 'restaurant' },
      { verticalId: 'yacht' },
      { verticalId: 'experience' },
      { verticalId: 'water_activity' },
      { verticalId: 'fitness' },
      { verticalId: 'event' },
      { route: '/market', icon: '🛒', labelEn: 'Market', labelRu: 'Маркет' },
      { route: '/kids', icon: '🎈', labelEn: 'Kids Activities', labelRu: 'Детям' },
      { route: '/wedding', icon: '💍', labelEn: 'Weddings', labelRu: 'Свадьбы' },
    ],
  },
  {
    id: 'health',
    labelEn: 'Health & Beauty',
    labelRu: 'Здоровье и красота',
    icon: '💆',
    items: [
      { verticalId: 'beauty' },
      { verticalId: 'medical' },
      { route: '/pharmacy', icon: '💊', labelEn: 'Pharmacy', labelRu: 'Аптека' },
      { route: '/veterinary', icon: '🐕‍🦺', labelEn: 'Veterinary', labelRu: 'Ветеринары' },
      { verticalId: 'fitness' },
      { verticalId: 'insurance' },
    ],
  },
  {
    id: 'settle',
    labelEn: 'Settle & Documents',
    labelRu: 'Переезд и документы',
    icon: '📋',
    items: [
      { route: '/visa', icon: '🌍', labelEn: 'Visa & Immigration', labelRu: 'Визы и иммиграция' },
      { route: '/banking', icon: '🏦', labelEn: 'Banking & Finance', labelRu: 'Банки и финансы' },
      { route: '/tax', icon: '📑', labelEn: 'Taxes', labelRu: 'Налоги' },
      { verticalId: 'legal' },
      { route: '/relocate', icon: '🧳', labelEn: 'Relocation', labelRu: 'Переезд' },
      { route: '/school-finder', icon: '🏫', labelEn: 'School Finder', labelRu: 'Школы' },
      { verticalId: 'education' },
    ],
  },
  {
    id: 'invest',
    labelEn: 'Real Estate & Invest',
    labelRu: 'Недвижимость и инвестиции',
    icon: '🏢',
    items: [
      { route: '/property/rent/short-term', icon: '🔑', labelEn: 'Short-term Rent', labelRu: 'Аренда краткосрочная' },
      { route: '/property/rent/long-term', icon: '🏡', labelEn: 'Long-term Rent', labelRu: 'Аренда долгосрочная' },
      { route: '/property/resale', icon: '🏘️', labelEn: 'Buy Property', labelRu: 'Покупка недвижимости' },
      { route: '/property/offplan', icon: '🏗️', labelEn: 'Offplan & New Builds', labelRu: 'Офплан / Новостройки' },
      { route: '/property/invest', icon: '📈', labelEn: 'Investments & ROI', labelRu: 'Инвестиции и ROI' },
      { route: '/property/developers', icon: '🏢', labelEn: 'Developers', labelRu: 'Застройщики' },
    ],
  },
  {
    id: 'maintain',
    labelEn: 'Home Maintenance',
    labelRu: 'Обслуживание дома',
    icon: '🔧',
    items: [
      { route: '/services?category=ac-repair', icon: '❄️', labelEn: 'AC Repair', labelRu: 'Кондиционеры' },
      { route: '/services?category=plumbing', icon: '🔧', labelEn: 'Plumbing', labelRu: 'Сантехника' },
      { route: '/services?category=electrical', icon: '⚡', labelEn: 'Electrical', labelRu: 'Электрика' },
      { route: '/services?category=handyman', icon: '🛠️', labelEn: 'Handyman', labelRu: 'Мастер на час' },
      { route: '/services?category=gardening', icon: '🌿', labelEn: 'Gardening', labelRu: 'Сад и озеленение' },
      { route: '/services?category=pest-control', icon: '🐜', labelEn: 'Pest Control', labelRu: 'Дезинсекция' },
      { route: '/services?category=locksmith', icon: '🔑', labelEn: 'Locksmith', labelRu: 'Замки и ключи' },
    ],
  },
  {
    id: 'help',
    labelEn: 'Help & Support',
    labelRu: 'Помощь',
    icon: '🆘',
    items: [
      { route: '/vip-concierge', icon: '🎩', labelEn: 'VIP Concierge', labelRu: 'VIP Консьерж' },
      { route: '/sos', icon: '🆘', labelEn: 'Emergency Help', labelRu: 'Экстренная помощь' },
    ],
  },
];
