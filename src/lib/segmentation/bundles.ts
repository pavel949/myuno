/**
 * @module bundles
 * @description Service Bundles (segmentation-framework § 10) — proven
 * service combos per key persona. Frontend SSOT; surfaced on persona
 * landing pages. CTA routes into the existing lead/concierge flow — no
 * checkout of its own (lead-first, per platform model).
 *
 * Pure data + selector, no React/Supabase deps (mirrors recommendServices).
 */

import type { PersonaCode } from '@/types/canonical';

export interface ServiceBundle {
  id: string;
  /** Personas this bundle is built for (canonical § 10 "Для кого"). */
  personaCodes: PersonaCode[];
  icon: string;
  name: { en: string; ru: string };
  /** Composition — one line per included service. */
  items: Array<{ en: string; ru: string }>;
  /** Display price (free-form — fixed, range, %, or per-unit). */
  price: { en: string; ru: string };
}

/** Canonical § 10 bundle table. */
export const SERVICE_BUNDLES: readonly ServiceBundle[] = [
  {
    id: 'welcome-pack',
    personaCodes: ['P1'],
    icon: '🛬',
    name: { en: 'Welcome Pack', ru: 'Welcome Pack' },
    items: [
      { en: 'Airport transfer', ru: 'Трансфер из аэропорта' },
      { en: 'SIM card', ru: 'SIM-карта' },
      { en: 'Currency exchange', ru: 'Обмен валюты' },
      { en: 'SOS access', ru: 'Доступ к SOS' },
      { en: 'AI guide', ru: 'AI-гид' },
    ],
    price: { en: '฿1,499', ru: '฿1,499' },
  },
  {
    id: 'snowbird-winter-pack',
    personaCodes: ['P5'],
    icon: '❄️',
    name: { en: 'Snowbird Winter Pack', ru: 'Snowbird Winter Pack' },
    items: [
      { en: 'LTR visa', ru: 'LTR-виза' },
      { en: 'Home for 3–6 months', ru: 'Жильё на 3–6 месяцев' },
      { en: 'Medical insurance', ru: 'Медстраховка' },
      { en: 'VIP transfers', ru: 'VIP-трансферы' },
    ],
    price: { en: '฿15,000–35,000', ru: '฿15,000–35,000' },
  },
  {
    id: 'new-expat-90-days',
    personaCodes: ['P6'],
    icon: '🏡',
    name: { en: 'New Expat · 90 Days', ru: 'New Expat · 90 дней' },
    items: [
      { en: 'RentMatch', ru: 'RentMatch' },
      { en: 'ContractAI', ru: 'ContractAI' },
      { en: 'BankPass', ru: 'BankPass' },
      { en: 'TaxNav', ru: 'TaxNav' },
      { en: 'WhatsApp priority', ru: 'WhatsApp-приоритет' },
    ],
    price: { en: '฿8,999', ru: '฿8,999' },
  },
  {
    id: 'family-settle',
    personaCodes: ['P7'],
    icon: '👨‍👩‍👧',
    name: { en: 'Family Settle', ru: 'Family Settle' },
    items: [
      { en: 'School Match', ru: 'School Match' },
      { en: 'Nanny', ru: 'Няня' },
      { en: 'Paediatrician', ru: 'Педиатр' },
      { en: 'Family Hub premium', ru: 'Family Hub premium' },
    ],
    price: { en: '฿12,999', ru: '฿12,999' },
  },
  {
    id: 'nomad-setup',
    personaCodes: ['P4'],
    icon: '💻',
    name: { en: 'Nomad Setup', ru: 'Nomad Setup' },
    items: [
      { en: 'DTV visa', ru: 'DTV-виза' },
      { en: 'BankPass', ru: 'BankPass' },
      { en: 'Coworking', ru: 'Коворкинг' },
      { en: 'TaxNav', ru: 'TaxNav' },
      { en: '2-month accommodation', ru: 'Жильё на 2 месяца' },
    ],
    price: { en: '฿11,999', ru: '฿11,999' },
  },
  {
    id: 'investor-due-diligence',
    personaCodes: ['P8'],
    icon: '📊',
    name: { en: 'Investor Due Diligence', ru: 'Investor Due Diligence' },
    items: [
      { en: 'DueDiligence AI', ru: 'DueDiligence AI' },
      { en: 'FloodScore', ru: 'FloodScore' },
      { en: 'ContractAI', ru: 'ContractAI' },
      { en: 'Legal review', ru: 'Юридическая проверка' },
    ],
    price: { en: '฿7,500', ru: '฿7,500' },
  },
  {
    id: 'hnw-full-stack',
    personaCodes: ['P9'],
    icon: '🏦',
    name: { en: 'HNW Full Stack', ru: 'HNW Full Stack' },
    items: [
      { en: 'Mandate', ru: 'Мандат' },
      { en: 'Full compliance', ru: 'Полный compliance' },
      { en: 'Property management', ru: 'Управление недвижимостью' },
      { en: 'FinanceGuide', ru: 'FinanceGuide' },
    ],
    price: { en: '1–2% annual', ru: '1–2% в год' },
  },
  {
    id: 'operator-saas',
    personaCodes: ['P10'],
    icon: '🏨',
    name: { en: 'Operator SaaS', ru: 'Operator SaaS' },
    items: [
      { en: 'StaySync', ru: 'StaySync' },
      { en: 'ComplianceTrack', ru: 'ComplianceTrack' },
      { en: 'PM Dashboard', ru: 'PM Dashboard' },
      { en: 'AI Guest', ru: 'AI Guest' },
    ],
    price: { en: '฿1,499 / property / mo', ru: '฿1,499 / объект / мес' },
  },
  {
    id: 'pet-arrival-pack',
    personaCodes: ['P13'],
    icon: '🐾',
    name: { en: 'Pet Arrival Pack', ru: 'Pet Arrival Pack' },
    items: [
      { en: 'Pet import', ru: 'Ввоз питомца' },
      { en: 'Vet setup', ru: 'Подбор ветеринара' },
      { en: 'Pet-friendly home', ru: 'Pet-friendly жильё' },
      { en: 'Pet-sitter', ru: 'Pet-sitter' },
    ],
    price: { en: '฿25,000–45,000', ru: '฿25,000–45,000' },
  },
  {
    id: 'destination-wedding',
    personaCodes: ['P15'],
    icon: '💒',
    name: { en: 'Destination Wedding', ru: 'Destination Wedding' },
    items: [
      { en: 'Planner', ru: 'Планировщик' },
      { en: 'Venue', ru: 'Площадка' },
      { en: 'Photo & video', ru: 'Фото и видео' },
      { en: 'Catering', ru: 'Кейтеринг' },
      { en: 'Guest accommodation', ru: 'Размещение гостей' },
      { en: 'Legal registration', ru: 'Юридическая регистрация' },
    ],
    price: { en: '10% of budget (from ฿200K)', ru: '10% от бюджета (от ฿200K)' },
  },
  {
    id: 'medical-tourism-pack',
    personaCodes: ['P14'],
    icon: '🏥',
    name: { en: 'Medical Tourism Pack', ru: 'Medical Tourism Pack' },
    items: [
      { en: 'Clinic match', ru: 'Подбор клиники' },
      { en: 'Visa', ru: 'Виза' },
      { en: 'Accommodation', ru: 'Жильё' },
      { en: 'Translator', ru: 'Переводчик' },
      { en: 'Escort', ru: 'Сопровождение' },
    ],
    price: { en: '฿15,000–50,000 + clinic %', ru: '฿15,000–50,000 + % клиники' },
  },
  {
    id: 'fighter-camp-30d',
    personaCodes: ['P16'],
    icon: '🏋️',
    name: { en: 'Fighter Camp · 30D', ru: 'Fighter Camp · 30 дней' },
    items: [
      { en: 'Gym membership', ru: 'Абонемент в зал' },
      { en: 'Accommodation', ru: 'Жильё' },
      { en: 'Nutrition', ru: 'Питание' },
      { en: 'Recovery', ru: 'Восстановление' },
      { en: 'Visa', ru: 'Виза' },
    ],
    price: { en: '฿29,999', ru: '฿29,999' },
  },
  {
    id: 'halal-traveller-pack',
    personaCodes: ['P17'],
    icon: '🕌',
    name: { en: 'Halal Traveller Pack', ru: 'Halal Traveller Pack' },
    items: [
      { en: 'Halal-friendly home', ru: 'Halal-friendly жильё' },
      { en: 'Mosque map', ru: 'Карта мечетей' },
      { en: 'Halal food', ru: 'Халяль-еда' },
      { en: 'Guide', ru: 'Гид' },
    ],
    price: { en: '฿3,999', ru: '฿3,999' },
  },
  {
    id: 'retirement-pack',
    personaCodes: ['P20'],
    icon: '🎓',
    name: { en: 'Retirement Pack', ru: 'Retirement Pack' },
    items: [
      { en: 'Retirement visa', ru: 'Пенсионная виза' },
      { en: 'Medical insurance', ru: 'Медстраховка' },
      { en: 'Community', ru: 'Сообщество' },
      { en: 'Home setup', ru: 'Обустройство дома' },
    ],
    price: { en: '฿35,000', ru: '฿35,000' },
  },
] as const;

/**
 * First bundle built for the given persona code, or `undefined`.
 * Accepts a plain string so callers don't need the `PersonaCode` type.
 */
export function getBundleForPersona(personaCode: string): ServiceBundle | undefined {
  return SERVICE_BUNDLES.find((b) =>
    (b.personaCodes as readonly string[]).includes(personaCode),
  );
}
