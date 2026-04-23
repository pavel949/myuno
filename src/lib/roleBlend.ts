import type { UserPersona } from '@/hooks/useUserPersonas';

/**
 * ROLE_META — canonical visual + textual metadata for every persona.
 *
 * `descRu` / `descEn` come from design package v5 (`screens-core.jsx · S03_Roles`)
 * and are surfaced in `RoleSheet` as a sub-line under each role name. One
 * sentence each: nominal phrases describing the user's life-context, not
 * promises. Keep < 40 chars where possible to fit single-line on 375px.
 */
export const ROLE_META: Record<UserPersona, {
  short: string;
  glyph: string;
  color: string;
  label: string;
  labelRu: string;
  descEn: string;
  descRu: string;
}> = {
  tourist:                 { short: 'Tourist',   glyph: 'T', color: '#4E7BFF', label: 'Visiting Phuket',    labelRu: 'Турист',        descEn: 'Arrival, stays, experiences',           descRu: 'Прилёт, аренда, впечатления' },
  resident:                { short: 'Resident',  glyph: 'R', color: '#00D68F', label: 'Living in Phuket',   labelRu: 'Резидент',      descEn: 'Visa, housing, daily services',         descRu: 'Виза, жильё, ежедневные сервисы' },
  property_owner:          { short: 'Owner',     glyph: 'O', color: '#16BDCA', label: 'Property owner',     labelRu: 'Собственник',   descEn: 'Property and income management',        descRu: 'Управление недвижимостью и доходом' },
  investor:                { short: 'Investor',  glyph: 'I', color: '#A78BFA', label: 'Investor',           labelRu: 'Инвестор',      descEn: 'Pipeline, partners, capital',           descRu: 'Pipeline, партнёры, капитал' },
  real_estate_developer:   { short: 'Developer', glyph: 'D', color: '#EF4444', label: 'Property developer', labelRu: 'Застройщик',    descEn: 'Projects, reservations, sales',         descRu: 'Проекты, бронирования, продажи' },
  local_services_provider: { short: 'Provider',  glyph: 'P', color: '#F59E0B', label: 'Local business',     labelRu: 'Поставщик',     descEn: 'Storefront, bookings, payouts',         descRu: 'Витрина, брони, выплаты' },
  family:                  { short: 'Family',    glyph: 'F', color: '#EC4899', label: 'Family',             labelRu: 'Семья',         descEn: 'Schools, clinics, family logistics',    descRu: 'Школы, клиники, семейная логистика' },
  couple:                  { short: 'Couple',    glyph: 'C', color: '#F43F5E', label: 'Couple',             labelRu: 'Пара',          descEn: 'Restaurants, getaways, moments',        descRu: 'Рестораны, выезды, моменты' },
  nightlife:               { short: 'Night',     glyph: 'N', color: '#D946EF', label: 'Nightlife',          labelRu: 'Ночная жизнь',  descEn: 'Clubs, bars, late-night transfers',     descRu: 'Клубы, бары, ночной трансфер' },
  active:                  { short: 'Active',    glyph: 'A', color: '#F97316', label: 'Active',             labelRu: 'Спорт',         descEn: 'Training, gear, sports facilities',     descRu: 'Тренировки, экипировка, спортзалы' },
  business:                { short: 'Business',  glyph: 'B', color: '#64748B', label: 'Business',           labelRu: 'Бизнес',        descEn: 'Companies, accounting, contracts',      descRu: 'Компании, бухгалтерия, договоры' },
  nomad:                   { short: 'Nomad',     glyph: 'M', color: '#14B8A6', label: 'Nomad',              labelRu: 'Номад',         descEn: 'Co-working, SIM, long-term housing',    descRu: 'Коворкинг, SIM, долгосрочное жильё' },
  pet_owner:               { short: 'Pets',      glyph: 'X', color: '#FB923C', label: 'Pet owner',          labelRu: 'С питомцем',    descEn: 'Vets, pet-friendly housing, transfer',  descRu: 'Ветеринар, жильё с животными, перевозка' },
  relocation:              { short: 'Relocate',  glyph: 'L', color: '#6366F1', label: 'Relocating',         labelRu: 'Переезд',       descEn: 'Visa, housing search, paperwork',       descRu: 'Виза, поиск жилья, документы' },
};

export type ClusterId = 'live' | 'manage' | 'invest' | 'legal' | 'arrive' | 'build';

export const CLUSTERS = [
  // Service-cabinet tone (см. mem://style/gov-tone-standard).
  // Имя раздела + перечисление сервисов внутри. Без обещаний, без жаргона, аббревиатуры расшифрованы.
  { id: 'arrive' as ClusterId, labelEn: 'Arrival',     labelRu: 'Прибытие',     sub: 'Transfer, SIM card, currency exchange, check-in',                       subRu: 'Трансфер, SIM-карта, обмен валюты, заселение',                                  accent: '#00D68F', route: '/life/arrival',     items: '5'  },
  { id: 'live'   as ClusterId, labelEn: 'Daily life',  labelRu: 'Повседневные сервисы', sub: 'Cleaning, delivery, schools, clinics, vet care',                subRu: 'Уборка, доставка, школы, клиники, ветеринария',                                 accent: '#4E7BFF', route: '/discover',         items: '14' },
  { id: 'manage' as ClusterId, labelEn: 'Property management', labelRu: 'Управление объектом', sub: 'Bookings, housekeeping, owner statements, payouts',     subRu: 'Бронирования, обслуживание, отчёты собственнику, выплаты',                      accent: '#16BDCA', route: '/mc',               items: '9'  },
  { id: 'invest' as ClusterId, labelEn: 'Investments', labelRu: 'Инвестиции',   sub: 'Properties under construction, yield models, exit timelines',           subRu: 'Объекты на стадии строительства, модели доходности, сроки выхода',              accent: '#A78BFA', route: '/invest',           items: '7'  },
  { id: 'legal'  as ClusterId, labelEn: 'Documents',   labelRu: 'Документы',    sub: 'Visa, place-of-stay notice (TM30), contracts, annual filings',         subRu: 'Виза, уведомление о месте пребывания (TM30), договоры, годовая отчётность',     accent: '#F59E0B', route: '/life/relocation',  items: '6'  },
  { id: 'build'  as ClusterId, labelEn: 'Development', labelRu: 'Размещение проектов', sub: 'Project listing, inbound applications, applicant analytics',    subRu: 'Размещение проекта, входящие заявки, аналитика по заявкам',                     accent: '#EF4444', route: '/property/offplan', items: '4' },
];

const CLUSTER_SCORES: Record<UserPersona, Record<ClusterId, number>> = {
  tourist:                 { arrive: 5, live: 4, legal: 1, manage: 0, invest: 0, build: 0 },
  resident:                { live: 5, legal: 4, manage: 3, arrive: 1, invest: 2, build: 0 },
  property_owner:          { manage: 5, invest: 4, legal: 3, live: 2, build: 1, arrive: 0 },
  investor:                { invest: 5, legal: 3, manage: 2, build: 2, live: 1, arrive: 0 },
  real_estate_developer:   { build: 5, invest: 4, legal: 3, manage: 2, live: 1, arrive: 0 },
  local_services_provider: { live: 5, manage: 4, legal: 2, invest: 1, build: 1, arrive: 0 },
  family:                  { live: 4, legal: 3, arrive: 2, manage: 1, invest: 0, build: 0 },
  couple:                  { live: 5, arrive: 3, legal: 1, manage: 0, invest: 0, build: 0 },
  nightlife:               { live: 5, arrive: 2, legal: 0, manage: 0, invest: 0, build: 0 },
  active:                  { live: 4, arrive: 3, legal: 1, manage: 0, invest: 0, build: 0 },
  business:                { live: 3, legal: 4, manage: 3, invest: 2, build: 1, arrive: 0 },
  nomad:                   { live: 4, legal: 3, arrive: 2, manage: 0, invest: 0, build: 0 },
  pet_owner:               { live: 5, manage: 2, legal: 1, arrive: 1, invest: 0, build: 0 },
  relocation:              { arrive: 5, legal: 4, live: 3, manage: 2, invest: 1, build: 0 },
};

export const SIGNAL_ROUTE: Record<UserPersona, string> = {
  tourist:                 '/life/arrival',
  resident:                '/life/relocation',
  property_owner:          '/mc',
  investor:                '/invest',
  real_estate_developer:   '/property/offplan',
  local_services_provider: '/vendor',
  family:                  '/discover',
  couple:                  '/discover',
  nightlife:               '/discover',
  active:                  '/discover',
  business:                '/discover',
  nomad:                   '/discover',
  pet_owner:               '/discover',
  relocation:              '/life/relocation',
};

export function blendClusters(personas: UserPersona[]) {
  const scores: Record<ClusterId, number> = { live: 0, manage: 0, invest: 0, legal: 0, arrive: 0, build: 0 };
  personas.forEach((p, i) => {
    const weight = i === 0 ? 3 : i === 1 ? 2 : 1;
    const s = CLUSTER_SCORES[p];
    if (!s) return;
    (Object.entries(s) as [ClusterId, number][]).forEach(([k, v]) => { scores[k] += v * weight; });
  });
  return [...CLUSTERS].sort((a, b) => scores[b.id] - scores[a.id]);
}

// Signal seed data per role — shown when real DB data is loading
export const SIGNAL_SEED: Record<UserPersona, { lead: string; leadRu: string; value: string; tail: string; tailRu: string; state: 'live' | 'warn' | 'active' }> = {
  tourist:                 { lead: 'Transfer',           leadRu: 'Трансфер',           value: '08:40',        tail: 'HKT → Kata · confirmed',              tailRu: 'HKT → Ката · подтверждён',           state: 'live'   },
  resident:                { lead: 'Visa',               leadRu: 'Виза',               value: '48 days',      tail: 'Non-Imm O · extension available',     tailRu: 'Non-Imm O · доступно продление',     state: 'warn'   },
  property_owner:          { lead: 'Property',           leadRu: 'Объект',             value: 'Occupied',     tail: 'Guest check-out 14:00',               tailRu: 'Гость выезжает в 14:00',             state: 'live'   },
  investor:                { lead: 'Portfolio',          leadRu: 'Портфель',           value: '฿ 24.8M',      tail: '2 deals in progress',                 tailRu: '2 сделки в работе',                  state: 'active' },
  real_estate_developer:   { lead: 'Project',            leadRu: 'Проект',             value: '42 / 120',     tail: 'Phase I closes Friday',               tailRu: 'Фаза I закрывается в пятницу',       state: 'live'   },
  local_services_provider: { lead: 'Today',              leadRu: 'Сегодня',            value: '6 bookings',   tail: '฿ 18,900 · 3 awaiting reply',         tailRu: '฿ 18 900 · 3 ждут ответа',           state: 'active' },
  family:                  { lead: 'School',             leadRu: 'Школа',              value: 'Term 2',       tail: 'Next event Thursday',                 tailRu: 'Ближайшее событие — четверг',        state: 'active' },
  couple:                  { lead: 'Booking',            leadRu: 'Бронь',              value: 'Tonight',      tail: 'Suay · 19:00 · 2 guests',             tailRu: 'Suay · 19:00 · 2 гостя',             state: 'live'   },
  nightlife:               { lead: 'Tonight',            leadRu: 'Сегодня вечером',    value: 'Illuzion',     tail: 'Patong · doors 22:00',                tailRu: 'Патонг · вход с 22:00',              state: 'live'   },
  active:                  { lead: 'Session',            leadRu: 'Тренировка',         value: '07:00',        tail: 'Muay Thai · Tiger Gym',               tailRu: 'Муай-тай · Tiger Gym',               state: 'live'   },
  business:                { lead: 'Company',            leadRu: 'Компания',           value: 'Active',       tail: 'Annual renewal in 45 days',           tailRu: 'Ежегодное продление через 45 дней',  state: 'warn'   },
  nomad:                   { lead: 'Data plan',          leadRu: 'Тариф',              value: '12 GB',        tail: 'AIS · top-up available',              tailRu: 'AIS · доступно пополнение',          state: 'active' },
  pet_owner:               { lead: 'Vet visit',          leadRu: 'Приём ветеринара',   value: 'Fri 15:00',    tail: 'Dr. Amara · Phuket Animal Hospital',  tailRu: 'Д-р Амара · Phuket Animal Hospital', state: 'active' },
  relocation:              { lead: 'Visa',               leadRu: 'Виза',               value: 'In review',    tail: 'Siam Legal · documents in 3 days',    tailRu: 'Siam Legal · документы через 3 дня', state: 'warn'   },
};
