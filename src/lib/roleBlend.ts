import type { UserPersona } from '@/hooks/useUserPersonas';

export const ROLE_META: Record<UserPersona, { short: string; glyph: string; color: string; label: string; labelRu: string }> = {
  tourist:                 { short: 'Tourist',   glyph: 'T', color: '#4E7BFF', label: 'Visiting Phuket',    labelRu: 'Турист' },
  resident:                { short: 'Resident',  glyph: 'R', color: '#00D68F', label: 'Living in Phuket',   labelRu: 'Резидент' },
  property_owner:          { short: 'Owner',     glyph: 'O', color: '#16BDCA', label: 'Property owner',     labelRu: 'Собственник' },
  investor:                { short: 'Investor',  glyph: 'I', color: '#A78BFA', label: 'Investor',           labelRu: 'Инвестор' },
  real_estate_developer:   { short: 'Developer', glyph: 'D', color: '#EF4444', label: 'Property developer', labelRu: 'Застройщик' },
  local_services_provider: { short: 'Provider',  glyph: 'P', color: '#F59E0B', label: 'Local business',     labelRu: 'Поставщик' },
  family:                  { short: 'Family',    glyph: 'F', color: '#EC4899', label: 'Family',             labelRu: 'Семья' },
  couple:                  { short: 'Couple',    glyph: 'C', color: '#F43F5E', label: 'Couple',             labelRu: 'Пара' },
  nightlife:               { short: 'Night',     glyph: 'N', color: '#D946EF', label: 'Nightlife',          labelRu: 'Ночная жизнь' },
  active:                  { short: 'Active',    glyph: 'A', color: '#F97316', label: 'Active',             labelRu: 'Спорт' },
  business:                { short: 'Business',  glyph: 'B', color: '#64748B', label: 'Business',           labelRu: 'Бизнес' },
  nomad:                   { short: 'Nomad',     glyph: 'M', color: '#14B8A6', label: 'Nomad',              labelRu: 'Номад' },
  pet_owner:               { short: 'Pets',      glyph: 'X', color: '#FB923C', label: 'Pet owner',          labelRu: 'С питомцем' },
  relocation:              { short: 'Relocate',  glyph: 'L', color: '#6366F1', label: 'Relocating',         labelRu: 'Переезд' },
};

export type ClusterId = 'live' | 'manage' | 'invest' | 'legal' | 'arrive' | 'build';

export const CLUSTERS = [
  // Each cluster: 1 clear benefit + concrete examples. No overlaps between clusters.
  // Arrive = first 7 days. Live = daily life. Manage = your property. Invest = capital.
  // Legal = paperwork only. Build = for developers.
  { id: 'arrive' as ClusterId, labelEn: 'Arrive', labelRu: 'Прибытие',   sub: 'Land smoothly: transfer, SIM, eSIM, first-week setup',  subRu: 'Трансфер, SIM-карта, обмен валюты, заселение',           accent: '#00D68F', route: '/life/arrival',    items: '5' },
  { id: 'live'   as ClusterId, labelEn: 'Live',   labelRu: 'Жизнь',      sub: 'Daily essentials: cleaning, food, beauty, kids, pets',  subRu: 'Уборка, доставка еды, салоны, школы, ветеринар',         accent: '#4E7BFF', route: '/discover',        items: '14' },
  { id: 'manage' as ClusterId, labelEn: 'Manage', labelRu: 'Управление', sub: 'Earn from your villa: PMS, calendar, cleaning, payouts',subRu: 'Доход с виллы: бронирования, уход, отчёты, выплаты',     accent: '#16BDCA', route: '/mc',              items: '9' },
  { id: 'invest' as ClusterId, labelEn: 'Invest', labelRu: 'Инвестиции', sub: 'Buy off-plan with verified ROI, yield and exit data',   subRu: 'Новостройки с проверенной доходностью и сроком выхода',  accent: '#A78BFA', route: '/invest',          items: '7' },
  { id: 'legal'  as ClusterId, labelEn: 'Legal',  labelRu: 'Документы',  sub: 'Stay legal: visa renewal, TM30, contracts, tax filing', subRu: 'Продление визы, регистрация TM30, договоры, налоги',     accent: '#F59E0B', route: '/life/relocation', items: '6' },
  { id: 'build'  as ClusterId, labelEn: 'Build',  labelRu: 'Стройка',    sub: 'For developers: launch projects, leads, sales analytics',subRu: 'Застройщикам: запуск проектов, заявки, аналитика продаж',accent: '#EF4444', route: '/property/offplan', items: '4' },
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
  tourist:                 { lead: 'Transfer tomorrow',  leadRu: 'Трансфер завтра',    value: '08:40',        tail: 'HKT → Kata · Confirmed',            tailRu: 'HKT → Ката · Подтверждён',       state: 'live' },
  resident:                { lead: 'Visa',               leadRu: 'Виза',               value: '48 days left', tail: 'Non-Imm O · Extension available',   tailRu: 'Non-Imm O · Доступно продление', state: 'warn' },
  property_owner:          { lead: 'Your property',      leadRu: 'Ваш объект',         value: 'Occupied',     tail: 'Guest check-out at 14:00',           tailRu: 'Гость выезжает в 14:00',          state: 'live' },
  investor:                { lead: 'Portfolio',          leadRu: 'Портфель',           value: '฿ 24.8M',      tail: 'Active deals · 2 pending',           tailRu: 'Активные сделки · 2 в ожидании', state: 'active' },
  real_estate_developer:   { lead: 'Project',            leadRu: 'Проект',             value: '42 / 120',     tail: 'Phase I closes Friday',              tailRu: 'Фаза I — срок в пятницу',        state: 'live' },
  local_services_provider: { lead: 'Today',              leadRu: 'Сегодня',            value: '6 bookings',   tail: '฿ 18,900 · 3 awaiting response',     tailRu: '฿ 18 900 · 3 ожидают ответа',   state: 'active' },
  family:                  { lead: 'School',             leadRu: 'Школа',              value: 'Term 2',       tail: 'Next event Thursday',                tailRu: 'Следующее мероприятие — четверг', state: 'active' },
  couple:                  { lead: 'Booking',            leadRu: 'Бронь',              value: 'Tonight',      tail: 'Suay Restaurant · 19:00 · Party of 2', tailRu: 'Suay · 19:00 · 2 персоны',      state: 'live' },
  nightlife:               { lead: 'Tonight',            leadRu: 'Сегодня вечером',    value: 'Illuzion',     tail: 'Patong · Doors open 22:00',          tailRu: 'Патонг · Вход с 22:00',          state: 'live' },
  active:                  { lead: 'Training',           leadRu: 'Тренировка',         value: '07:00',        tail: 'Muay Thai · Tiger Gym',              tailRu: 'Муай-тай · Tiger Gym',           state: 'live' },
  business:                { lead: 'Company',            leadRu: 'Компания',           value: 'Active',       tail: 'Renewal due in 45 days',             tailRu: 'Продление через 45 дней',        state: 'warn' },
  nomad:                   { lead: 'SIM',                leadRu: 'SIM',                value: '12 GB left',   tail: 'AIS · Top-up available',             tailRu: 'AIS · Доступно пополнение',      state: 'active' },
  pet_owner:               { lead: 'Vet appointment',   leadRu: 'Визит к ветеринару', value: 'Friday 15:00', tail: 'Dr. Amara · Phuket Animal Hospital', tailRu: 'Д-р Амара · Животная больница', state: 'active' },
  relocation:              { lead: 'Visa',               leadRu: 'Виза',               value: 'In review',    tail: 'Siam Legal · Submit docs in 3 days', tailRu: 'Siam Legal · Документы через 3 дня', state: 'warn' },
};
