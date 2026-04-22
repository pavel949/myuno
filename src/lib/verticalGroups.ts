import {
  ECOSYSTEM_JOURNEY_GROUP_TRIPLET,
  ECOSYSTEM_APP_TRIPLET,
  pickTriplet,
  type LocalizedTriplet,
} from '@/lib/ecosystemGlossary';
import { APP_ROUTES } from '@/lib/config/routes';
import type { Language } from '@/i18n';

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
  /** TH label for standalone screens */
  labelTh?: string;
}

export interface VerticalGroup {
  id: string;
  ru: string;
  en: string;
  th: string;
  icon: string;
  items: VerticalGroupItem[];
}

function g(id: keyof typeof ECOSYSTEM_JOURNEY_GROUP_TRIPLET): LocalizedTriplet {
  return ECOSYSTEM_JOURNEY_GROUP_TRIPLET[id];
}

export const VERTICAL_GROUPS: VerticalGroup[] = [
  {
    id: 'arrive',
    ...g('arrive'),
    icon: '🛬',
    items: [
      { verticalId: 'transfer' },
      {
        route: '/transport/fast-track',
        icon: '✈️',
        labelEn: 'Airport fast track',
        labelRu: 'Фаст-трек в аэропорту',
        labelTh: 'ฟาสต์แทร็กสนามบิน',
      },
      {
        route: '/transport',
        icon: '🚗',
        labelEn: 'Car & bike rental',
        labelRu: 'Аренда авто и байков',
        labelTh: 'เช่ารถและมอเตอร์ไซค์',
      },
      { route: '/sim', icon: '📱', labelEn: 'SIM cards', labelRu: 'SIM-карты', labelTh: 'ซิมการ์ด' },
      {
        route: '/exchange',
        icon: '💱',
        labelEn: 'Exchange rates',
        labelRu: 'Курсы валют',
        labelTh: 'อัตราแลกเปลี่ยน',
      },
    ],
  },
  {
    id: 'live',
    ...g('live'),
    icon: '🏠',
    items: [
      {
        route: APP_ROUTES.SERVICES,
        labelEn: ECOSYSTEM_APP_TRIPLET.services.en,
        labelRu: ECOSYSTEM_APP_TRIPLET.services.ru,
        labelTh: ECOSYSTEM_APP_TRIPLET.services.th,
      },
      { verticalId: 'cleaning' },
      {
        route: '/services?category=laundry',
        icon: '👕',
        labelEn: ECOSYSTEM_APP_TRIPLET['services-laundry'].en,
        labelRu: ECOSYSTEM_APP_TRIPLET['services-laundry'].ru,
        labelTh: ECOSYSTEM_APP_TRIPLET['services-laundry'].th,
      },
      { verticalId: 'babysitter' },
      { verticalId: 'pet_service' },
      { verticalId: 'flower' },
    ],
  },
  {
    id: 'enjoy',
    ...g('enjoy'),
    icon: '🎭',
    items: [
      { verticalId: 'restaurant' },
      { verticalId: 'yacht' },
      { verticalId: 'experience' },
      { verticalId: 'fitness' },
      { verticalId: 'event' },
      {
        route: '/market',
        icon: '🛒',
        labelEn: ECOSYSTEM_APP_TRIPLET.market.en,
        labelRu: ECOSYSTEM_APP_TRIPLET.market.ru,
        labelTh: ECOSYSTEM_APP_TRIPLET.market.th,
      },
      {
        route: '/kids',
        icon: '🎈',
        labelEn: ECOSYSTEM_APP_TRIPLET.kids.en,
        labelRu: ECOSYSTEM_APP_TRIPLET.kids.ru,
        labelTh: ECOSYSTEM_APP_TRIPLET.kids.th,
      },
      {
        route: '/wedding',
        icon: '💍',
        labelEn: ECOSYSTEM_APP_TRIPLET.wedding.en,
        labelRu: ECOSYSTEM_APP_TRIPLET.wedding.ru,
        labelTh: ECOSYSTEM_APP_TRIPLET.wedding.th,
      },
    ],
  },
  {
    id: 'health',
    ...g('health'),
    icon: '💆',
    items: [
      { verticalId: 'beauty' },
      { verticalId: 'medical' },
      {
        route: '/pharmacy',
        icon: '💊',
        labelEn: ECOSYSTEM_APP_TRIPLET.pharmacy.en,
        labelRu: ECOSYSTEM_APP_TRIPLET.pharmacy.ru,
        labelTh: ECOSYSTEM_APP_TRIPLET.pharmacy.th,
      },
      {
        route: '/veterinary',
        icon: '🐕‍🦺',
        labelEn: ECOSYSTEM_APP_TRIPLET.veterinary.en,
        labelRu: ECOSYSTEM_APP_TRIPLET.veterinary.ru,
        labelTh: ECOSYSTEM_APP_TRIPLET.veterinary.th,
      },
      { verticalId: 'fitness' },
      { verticalId: 'insurance' },
    ],
  },
  {
    id: 'settle',
    ...g('settle'),
    icon: '📋',
    items: [
      {
        route: '/visa',
        icon: '🌍',
        labelEn: ECOSYSTEM_APP_TRIPLET.visa.en,
        labelRu: ECOSYSTEM_APP_TRIPLET.visa.ru,
        labelTh: ECOSYSTEM_APP_TRIPLET.visa.th,
      },
      {
        route: '/banking',
        icon: '🏦',
        labelEn: ECOSYSTEM_APP_TRIPLET.banking.en,
        labelRu: ECOSYSTEM_APP_TRIPLET.banking.ru,
        labelTh: ECOSYSTEM_APP_TRIPLET.banking.th,
      },
      {
        route: '/tax',
        icon: '📑',
        labelEn: ECOSYSTEM_APP_TRIPLET.tax.en,
        labelRu: ECOSYSTEM_APP_TRIPLET.tax.ru,
        labelTh: ECOSYSTEM_APP_TRIPLET.tax.th,
      },
      { verticalId: 'legal' },
      {
        route: '/relocate',
        icon: '🧳',
        labelEn: ECOSYSTEM_APP_TRIPLET.relocate.en,
        labelRu: ECOSYSTEM_APP_TRIPLET.relocate.ru,
        labelTh: ECOSYSTEM_APP_TRIPLET.relocate.th,
      },
      {
        route: '/school-finder',
        icon: '🏫',
        labelEn: ECOSYSTEM_APP_TRIPLET['school-finder'].en,
        labelRu: ECOSYSTEM_APP_TRIPLET['school-finder'].ru,
        labelTh: ECOSYSTEM_APP_TRIPLET['school-finder'].th,
      },
      { verticalId: 'education' },
    ],
  },
  {
    id: 'invest',
    ...g('invest'),
    icon: '🏢',
    items: [
      {
        route: '/property/rent/short-term',
        icon: '🔑',
        labelEn: ECOSYSTEM_APP_TRIPLET['property-rent-short'].en,
        labelRu: ECOSYSTEM_APP_TRIPLET['property-rent-short'].ru,
        labelTh: ECOSYSTEM_APP_TRIPLET['property-rent-short'].th,
      },
      {
        route: '/property/rent/long-term',
        icon: '🏡',
        labelEn: ECOSYSTEM_APP_TRIPLET['property-rent-long'].en,
        labelRu: ECOSYSTEM_APP_TRIPLET['property-rent-long'].ru,
        labelTh: ECOSYSTEM_APP_TRIPLET['property-rent-long'].th,
      },
      {
        route: '/property/resale',
        icon: '🏘️',
        labelEn: ECOSYSTEM_APP_TRIPLET['property-purchase'].en,
        labelRu: ECOSYSTEM_APP_TRIPLET['property-purchase'].ru,
        labelTh: ECOSYSTEM_APP_TRIPLET['property-purchase'].th,
      },
      {
        route: '/property/offplan',
        icon: '🏗️',
        labelEn: ECOSYSTEM_APP_TRIPLET['property-offplan-combo'].en,
        labelRu: ECOSYSTEM_APP_TRIPLET['property-offplan-combo'].ru,
        labelTh: ECOSYSTEM_APP_TRIPLET['property-offplan-combo'].th,
      },
      {
        route: '/property/invest',
        icon: '📈',
        labelEn: ECOSYSTEM_APP_TRIPLET['property-invest-roi'].en,
        labelRu: ECOSYSTEM_APP_TRIPLET['property-invest-roi'].ru,
        labelTh: ECOSYSTEM_APP_TRIPLET['property-invest-roi'].th,
      },
      {
        route: '/property/developers',
        icon: '🏢',
        labelEn: ECOSYSTEM_APP_TRIPLET.developers.en,
        labelRu: ECOSYSTEM_APP_TRIPLET.developers.ru,
        labelTh: ECOSYSTEM_APP_TRIPLET.developers.th,
      },
    ],
  },
  {
    id: 'maintain',
    ...g('maintain'),
    icon: '🔧',
    items: [
      {
        route: '/services?category=ac-repair',
        icon: '❄️',
        labelEn: ECOSYSTEM_APP_TRIPLET['services-ac'].en,
        labelRu: ECOSYSTEM_APP_TRIPLET['services-ac'].ru,
        labelTh: ECOSYSTEM_APP_TRIPLET['services-ac'].th,
      },
      {
        route: '/services?category=plumbing',
        icon: '🔧',
        labelEn: ECOSYSTEM_APP_TRIPLET['services-plumbing'].en,
        labelRu: ECOSYSTEM_APP_TRIPLET['services-plumbing'].ru,
        labelTh: ECOSYSTEM_APP_TRIPLET['services-plumbing'].th,
      },
      {
        route: '/services?category=electrical',
        icon: '⚡',
        labelEn: ECOSYSTEM_APP_TRIPLET['services-electrical'].en,
        labelRu: ECOSYSTEM_APP_TRIPLET['services-electrical'].ru,
        labelTh: ECOSYSTEM_APP_TRIPLET['services-electrical'].th,
      },
      {
        route: '/services?category=handyman',
        icon: '🛠️',
        labelEn: ECOSYSTEM_APP_TRIPLET['services-handyman'].en,
        labelRu: ECOSYSTEM_APP_TRIPLET['services-handyman'].ru,
        labelTh: ECOSYSTEM_APP_TRIPLET['services-handyman'].th,
      },
      {
        route: '/services?category=gardening',
        icon: '🌿',
        labelEn: ECOSYSTEM_APP_TRIPLET['services-gardening'].en,
        labelRu: ECOSYSTEM_APP_TRIPLET['services-gardening'].ru,
        labelTh: ECOSYSTEM_APP_TRIPLET['services-gardening'].th,
      },
      {
        route: '/services?category=pest-control',
        icon: '🐜',
        labelEn: ECOSYSTEM_APP_TRIPLET['services-pest'].en,
        labelRu: ECOSYSTEM_APP_TRIPLET['services-pest'].ru,
        labelTh: ECOSYSTEM_APP_TRIPLET['services-pest'].th,
      },
      {
        route: '/services?category=locksmith',
        icon: '🔑',
        labelEn: ECOSYSTEM_APP_TRIPLET['services-locksmith'].en,
        labelRu: ECOSYSTEM_APP_TRIPLET['services-locksmith'].ru,
        labelTh: ECOSYSTEM_APP_TRIPLET['services-locksmith'].th,
      },
    ],
  },
  {
    id: 'help',
    ...g('help'),
    icon: '🆘',
    items: [
      {
        route: '/vip-concierge',
        icon: '🎩',
        labelEn: ECOSYSTEM_APP_TRIPLET['vip-concierge'].en,
        labelRu: ECOSYSTEM_APP_TRIPLET['vip-concierge'].ru,
        labelTh: ECOSYSTEM_APP_TRIPLET['vip-concierge'].th,
      },
      {
        route: '/sos',
        icon: '🆘',
        labelEn: ECOSYSTEM_APP_TRIPLET.sos.en,
        labelRu: ECOSYSTEM_APP_TRIPLET.sos.ru,
        labelTh: ECOSYSTEM_APP_TRIPLET.sos.th,
      },
    ],
  },
];

/** Footer / marketing — localized section title. */
export function getVerticalGroupTitle(group: VerticalGroup, lang: Language): string {
  return pickTriplet(
    { ru: group.ru, en: group.en, th: group.th },
    lang
  );
}

/** Item label: registry vertical, or RU/EN/TH on the item. */
export function getVerticalGroupItemLabel(
  item: VerticalGroupItem,
  opts: { labelRu: string; labelEn: string; labelTh: string } | null,
  lang: Language
): string {
  if (opts) return pickTriplet(opts, lang);
  if (item.labelRu && item.labelEn) {
    return pickTriplet(
      { ru: item.labelRu, en: item.labelEn, th: item.labelTh ?? item.labelEn },
      lang
    );
  }
  return '';
}
