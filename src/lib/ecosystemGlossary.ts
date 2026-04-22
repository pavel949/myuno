/**
 * Ecosystem naming SSOT — canonical RU / EN / TH labels for journey groups and app entries.
 * Other modules (verticalGroups, appRegistry, clusterCatalog, footer, i18n) align with this vocabulary.
 */
import type { Language } from '@/i18n';

export type LocalizedTriplet = { ru: string; en: string; th: string };

/** Journey blocks (VERTICAL_GROUPS ids) */
export const ECOSYSTEM_JOURNEY_GROUP_TRIPLET: Record<
  'arrive' | 'live' | 'enjoy' | 'health' | 'settle' | 'invest' | 'maintain' | 'help',
  LocalizedTriplet
> = {
  arrive: {
    ru: 'Планирование и прилёт',
    en: 'Arrival & setup',
    th: 'วางแผนการเดินทาง',
  },
  live: {
    ru: 'Быт и дом',
    en: 'Home & daily life',
    th: 'บ้านและชีวิตประจำวัน',
  },
  enjoy: {
    ru: 'Досуг и развлечения',
    en: 'Leisure & activities',
    th: 'กิจกรรมและบันเทิง',
  },
  health: {
    ru: 'Здоровье и красота',
    en: 'Health & beauty',
    th: 'สุขภาพและความงาม',
  },
  settle: {
    ru: 'Переезд и документы',
    en: 'Settle & documents',
    th: 'ย้ายถิ่นและเอกสาร',
  },
  invest: {
    ru: 'Недвижимость и инвестиции',
    en: 'Real estate & invest',
    th: 'อสังหาฯและการลงทุน',
  },
  maintain: {
    ru: 'Обслуживание дома',
    en: 'Home maintenance',
    th: 'ซ่อมบำรุงบ้าน',
  },
  help: {
    ru: 'Помощь',
    en: 'Help & support',
    th: 'ช่วยเหลือ',
  },
};

/**
 * Navigator-style cluster chips (Auth value panel, role blend) — six public clusters + legal alias.
 * Wording matches journey language, not uppercase marketing headers.
 */
/**
 * `/discover` & drawer — short cluster section headers (8 blocks).
 * Distinct from auth chip wording; matches life-stage groupings in clusterCatalog.
 */
export const ECOSYSTEM_CLUSTER_HEADER_TRIPLET: Record<string, LocalizedTriplet> = {
  /** First hours / days: airport, money, sim — short chip & section titles */
  arrive: { ru: 'Прибытие и старт', en: 'Arrival', th: 'การเดินทาง' },
  /** Daily home & local services (not “live” as slang) */
  live: { ru: 'Дом и сервисы', en: 'Home & services', th: 'บ้านและบริการ' },
  enjoy: { ru: 'Досуг', en: 'Leisure', th: 'กิจกรรม' },
  legal: { ru: 'Визы и право', en: 'Visa & legal', th: 'วีซ่าและกฎหมาย' },
  /** Property search & invest (distinct from retail “buy”) */
  invest: { ru: 'Недвижимость', en: 'Property', th: 'อสังหาริมทรัพย์' },
  family: { ru: 'Семья и дети', en: 'Family & kids', th: 'ครอบครัว' },
  /** Host & MC workspace */
  manage: { ru: 'Операции', en: 'Operations', th: 'ปฏิบัติการ' },
  build: { ru: 'Застройщикам', en: 'Developers', th: 'ผู้พัฒนา' },
};

export const ECOSYSTEM_NAV_CLUSTER_TRIPLET: Record<
  'arrive' | 'live' | 'manage' | 'invest' | 'legal' | 'build',
  LocalizedTriplet
> = {
  arrive: {
    ru: 'Планирование и прилёт',
    en: 'Plan & arrive',
    th: 'วางแผนและเดินทาง',
  },
  live: {
    ru: 'Жильё',
    en: 'Housing',
    th: 'ที่พักอาศัย',
  },
  manage: {
    ru: 'Управление недвижимостью',
    en: 'Property management',
    th: 'จัดการอสังหาฯ',
  },
  invest: {
    ru: 'Инвестиции',
    en: 'Invest',
    th: 'การลงทุน',
  },
  legal: {
    ru: 'Право и документы',
    en: 'Legal & documents',
    th: 'กฎหมายและเอกสาร',
  },
  build: {
    ru: 'Для застройщиков',
    en: 'For developers',
    th: 'สำหรับผู้พัฒนา',
  },
};

/** App registry id → localized names (keep in sync with APP_REGISTRY keys). */
export const ECOSYSTEM_APP_TRIPLET: Record<string, LocalizedTriplet> = {
  property: { ru: 'Недвижимость', en: 'Real estate', th: 'อสังหาริมทรัพย์' },
  cleaning: { ru: 'Клининг', en: 'Home cleaning', th: 'ทำความสะอาดบ้าน' },
  babysitter: { ru: 'Присмотр за детьми', en: 'Childcare', th: 'พี่เลี้ยงเด็ก' },
  pets: { ru: 'Уход за питомцами', en: 'Pet care', th: 'ดูแลสัตว์เลี้ยง' },
  flowers: { ru: 'Доставка цветов', en: 'Flower delivery', th: 'ส่งดอกไม้' },
  transfer: { ru: 'Трансферы', en: 'Airport & city transfers', th: 'รับส่งสนามบินและในเมือง' },
  vehicle: { ru: 'Аренда авто и байков', en: 'Car & bike rental', th: 'เช่ารถและมอเตอร์ไซค์' },
  'fast-track': { ru: 'Фаст-трек в аэропорту', en: 'Airport fast track', th: 'ฟาสต์แทร็กสนามบิน' },
  restaurant: { ru: 'Рестораны', en: 'Restaurants', th: 'ร้านอาหาร' },
  experience: { ru: 'Впечатления', en: 'Experiences', th: 'ทริปและกิจกรรม' },
  'water-activity': { ru: 'Водный спорт', en: 'Water sports', th: 'กีฬาทางน้ำ' },
  event: { ru: 'Концерты и мероприятия', en: 'Concerts & events', th: 'คอนเสิร์ตและอีเวนต์' },
  fitness: { ru: 'Фитнес и залы', en: 'Fitness & gyms', th: 'ฟิตเนส' },
  beauty: { ru: 'Красота и велнес', en: 'Beauty & wellness', th: 'ความงามและสปา' },
  medical: { ru: 'Медицина', en: 'Medical', th: 'การแพทย์' },
  pharmacy: { ru: 'Аптеки', en: 'Pharmacy', th: 'ร้านยา' },
  veterinary: { ru: 'Ветеринары', en: 'Veterinary', th: 'สัตวแพทย์' },
  insurance: { ru: 'Страхование', en: 'Insurance', th: 'ประกัน' },
  legal: { ru: 'Юридические услуги', en: 'Legal services', th: 'บริการกฎหมาย' },
  education: { ru: 'Образование', en: 'Education & courses', th: 'การศึกษา' },
  banking: { ru: 'Банки и финансы', en: 'Banking & finance', th: 'ธนาคารและการเงิน' },
  visa: { ru: 'Визы и иммиграция', en: 'Visa & immigration', th: 'วีซ่าและตรวจคนเข้าเมือง' },
  relocate: { ru: 'Переезд', en: 'Relocation', th: 'ย้ายถิ่น' },
  tax: { ru: 'Налоги', en: 'Taxes', th: 'ภาษี' },
  'contract-ai': { ru: 'ContractAI', en: 'ContractAI', th: 'ContractAI' },
  knowledge: { ru: 'База знаний', en: 'Knowledge hub', th: 'ศูนย์ความรู้' },
  services: { ru: 'Услуги для дома', en: 'Home services', th: 'บริการในบ้าน' },
  'services-laundry': { ru: 'Прачечная', en: 'Laundry', th: 'ซักรีด' },
  'services-plumbing': { ru: 'Сантехника', en: 'Plumbing', th: 'ประปา' },
  'services-electrical': { ru: 'Электрика', en: 'Electrical', th: 'ไฟฟ้า' },
  'services-ac': { ru: 'Кондиционеры', en: 'AC repair', th: 'แอร์' },
  'services-gardening': { ru: 'Сад и озеленение', en: 'Gardening', th: 'สวน' },
  'services-pest': { ru: 'Дезинсекция', en: 'Pest control', th: 'กำจัดแมลง' },
  'services-handyman': { ru: 'Мастер на час', en: 'Handyman', th: 'ช่างซ่อม' },
  'services-locksmith': { ru: 'Замки и ключи', en: 'Locksmith', th: 'ช่างกุญแจ' },
  'vip-concierge': { ru: 'VIP Консьерж', en: 'VIP Concierge', th: 'วีไอพี คอนเซียร์จ' },
  sos: { ru: 'Экстренная помощь', en: 'Emergency help', th: 'ช่วยเหลือฉุกเฉิน' },
  sim: { ru: 'SIM-карты', en: 'SIM cards', th: 'ซิมการ์ด' },
  exchange: { ru: 'Курсы валют', en: 'Exchange rates', th: 'อัตราแลกเปลี่ยน' },
  market: { ru: 'Маркет', en: 'Market', th: 'มาร์เก็ต' },
  offplan: { ru: 'Новостройки', en: 'New developments', th: 'โครงการใหม่' },
  resale: { ru: 'Вторичка', en: 'Resale', th: 'มือสอง' },
  developers: { ru: 'Застройщики', en: 'Developers', th: 'ผู้พัฒนาโครงการ' },
  'invest-hub': { ru: 'ROI / инвестиции', en: 'ROI & invest hub', th: 'ศูนย์ลงทุน' },
  mc: { ru: 'Кабинет MC', en: 'MC dashboard', th: 'แดชบอร์ด MC' },
  'mc-calendar': { ru: 'Календарь', en: 'Calendar', th: 'ปฏิทิน' },
  'mc-finance': { ru: 'Финансы', en: 'Finances', th: 'การเงิน' },
  'mc-reports': { ru: 'Отчёты', en: 'Reports', th: 'รายงาน' },
  'mc-crm': { ru: 'CRM', en: 'CRM', th: 'CRM' },
  'developer-portal': { ru: 'Портал', en: 'Portal', th: 'พอร์ทัล' },
  'for-developers': { ru: 'Застройщикам', en: 'Developer program', th: 'สำหรับผู้พัฒนา' },
  newbuilds: { ru: 'Витрина новостроек', en: 'Newbuilds showcase', th: 'โชว์รูมโครงการใหม่' },
  consultation: { ru: 'Консультация', en: 'Advisory', th: 'ปรึกษา' },
  delivery: { ru: 'Доставка', en: 'Delivery', th: 'เดลิเวอรี่' },
  'mc-tasks': { ru: 'Задачи', en: 'Tasks', th: 'งาน' },
  'school-finder': { ru: 'Поиск школы', en: 'School finder', th: 'ค้นหาโรงเรียน' },
  wedding: { ru: 'Свадьбы', en: 'Weddings', th: 'งานแต่ง' },
  kids: { ru: 'Детям', en: 'Kids activities', th: 'กิจกรรมเด็ก' },
  yacht: { ru: 'Яхт-чартер', en: 'Yacht charter', th: 'เรือยอชต์' },
  /** Property hub / footer (aligned with invest journey row) */
  'property-rent-short': {
    ru: 'Аренда краткосрочная',
    en: 'Short-term rent',
    th: 'เช่าระยะสั้น',
  },
  'property-rent-long': {
    ru: 'Аренда долгосрочная',
    en: 'Long-term rent',
    th: 'เช่าระยะยาว',
  },
  'property-purchase': {
    ru: 'Покупка недвижимости',
    en: 'Buy property',
    th: 'ซื้ออสังหาฯ',
  },
  'property-offplan-combo': {
    ru: 'Офплан / новостройки',
    en: 'Offplan & new builds',
    th: 'ออฟแพลน/โครงการใหม่',
  },
  'property-invest-roi': {
    ru: 'Инвестиции и ROI',
    en: 'Investments & ROI',
    th: 'การลงทุนและอัตราผลตอบแทน',
  },
  /** Shorter “Invest” link in marketing footer (column) */
  'property-invest-footer': {
    ru: 'Инвестиции',
    en: 'Investments',
    th: 'การลงทุน',
  },
};

/**
 * `VERTICALS.id` → `ECOSYSTEM_APP_TRIPLET` key when the vertical id != app registry id.
 */
export const VERTICAL_ID_TO_GLOSSARY_KEY: Record<string, string> = {
  pet_service: 'pets',
  flower: 'flowers',
  water_activity: 'water-activity',
  bank: 'banking',
};

export function getTripletForVerticalId(verticalId: string): LocalizedTriplet | undefined {
  const key = VERTICAL_ID_TO_GLOSSARY_KEY[verticalId] ?? verticalId;
  return ECOSYSTEM_APP_TRIPLET[key];
}

/** Marketing footer — section titles & company links (RU/EN/TH). */
export const ECOSYSTEM_FOOTER_UI = {
  servicesHeading: { ru: 'Сервисы', en: 'Services', th: 'บริการ' },
  realEstateHeading: { ru: 'Недвижимость', en: 'Real estate', th: 'อสังหาริมทรัพย์' },
  companyHeading: { ru: 'Компания', en: 'Company', th: 'บริษัท' },
  trustHeading: { ru: 'Гарантии', en: 'Trust & safety', th: 'ความน่าเชื่อถือ' },
  brandTagline: {
    ru: 'Ваш дом на Пхукете. Сервисы, недвижимость и жизнь на острове — в одном приложении.',
    en: 'Your home in Phuket. Services, real estate, and island life — all in one app.',
    th: 'บ้านของคุณในภูเก็ต บริการ อสังหาฯ และไลฟ์สไตล์เกาะ — ในแอปเดียว',
  },
  madeIn: {
    ru: 'Сделано с заботой на Пхукете',
    en: 'Made with care in Phuket',
    th: 'สร้างด้วยใจในภูเก็ต',
  },
  downloadApp: { ru: 'Скачать приложение', en: 'Download app', th: 'ดาวน์โหลดแอป' },
  about: { ru: 'О нас', en: 'About', th: 'เกี่ยวกับเรา' },
  faq: { ru: 'FAQ', en: 'FAQ', th: 'คำถามที่พบบ่อย' },
  support: { ru: 'Помощь', en: 'Help', th: 'ช่วยเหลือ' },
  terms: { ru: 'Условия', en: 'Terms', th: 'ข้อกำหนด' },
  privacy: { ru: 'Конфиденциальность', en: 'Privacy', th: 'ความเป็นส่วนตัว' },
  cookies: { ru: 'Cookie', en: 'Cookies', th: 'คุกกี้' },
  refunds: { ru: 'Возвраты', en: 'Refunds', th: 'การคืนเงิน' },
  trustVerified: {
    ru: 'Проверенные партнёры',
    en: 'Verified providers',
    th: 'พาร์ทเนอร์ที่ตรวจสอบแล้ว',
  },
  trust247: {
    ru: 'Поддержка 24/7',
    en: '24/7 support',
    th: 'ซัพพอร์ต 24/7',
  },
  trustData: {
    ru: 'Защита данных',
    en: 'Data protected',
    th: 'ปกป้องข้อมูล',
  },
} as const satisfies Record<string, LocalizedTriplet>;

export function pickTriplet(t: LocalizedTriplet, lang: Language): string {
  if (lang === 'ru') return t.ru;
  if (lang === 'th') return t.th;
  return t.en;
}

/** Label for an app registry entry (must have id + label fields). */
export function getAppEntryLabel(
  entry: { id: string; labelRu: string; labelEn: string; labelTh: string },
  lang: Language
): string {
  const fromGlossary = ECOSYSTEM_APP_TRIPLET[entry.id];
  if (fromGlossary) return pickTriplet(fromGlossary, lang);
  return pickTriplet({ ru: entry.labelRu, en: entry.labelEn, th: entry.labelTh }, lang);
}

export function getJourneyGroupTitle(
  groupId: keyof typeof ECOSYSTEM_JOURNEY_GROUP_TRIPLET,
  lang: Language
): string {
  return pickTriplet(ECOSYSTEM_JOURNEY_GROUP_TRIPLET[groupId], lang);
}
