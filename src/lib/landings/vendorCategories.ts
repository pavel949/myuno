/**
 * Vendor category landing configs — data-driven /for/vendor/:category landings.
 * Supports the platform's 3 languages: ru, en, th.
 */
import type { Language } from '@/i18n';

export type VendorCategoryId =
  | 'cleaning' | 'beauty' | 'fitness' | 'medical' | 'restaurants'
  | 'transport' | 'pets' | 'flowers' | 'education' | 'babysitter'
  | 'wellness' | 'yachts' | 'events';

export type LocalizedText<T> = Record<Language, T>;

export interface ValueProp {
  iconName: 'TrendingUp' | 'Users' | 'CreditCard' | 'ShieldCheck' | 'Zap' | 'Star';
  text: LocalizedText<{ title: string; desc: string }>;
}

export interface FaqItem {
  q: LocalizedText<string>;
  a: LocalizedText<string>;
}

export interface VendorCategoryConfig {
  id: VendorCategoryId;
  emoji: string;
  hero: LocalizedText<{ eyebrow: string; title: string; subtitle: string }>;
  commissionPct: number;
  audience: LocalizedText<string>;
  valueProps: ValueProp[];
  faq: FaqItem[];
}

/** Pick localized field with EN→RU fallback if Thai not provided. */
export function pickLocale<T>(lang: Language, record: LocalizedText<T>): T {
  return record[lang] ?? record.en ?? record.ru;
}

const DEFAULT_VPS: ValueProp[] = [
  {
    iconName: 'Users',
    text: {
      ru: { title: 'Поток клиентов', desc: 'Иностранцы на Пхукете уже ищут вас в myUNO — без затрат на рекламу.' },
      en: { title: 'Customer flow', desc: 'Foreigners on Phuket already search for you inside myUNO — no ad spend needed.' },
      th: { title: 'กระแสลูกค้า', desc: 'ชาวต่างชาติบนภูเก็ตกำลังค้นหาคุณใน myUNO อยู่แล้ว — ไม่ต้องเสียค่าโฆษณา' },
    },
  },
  {
    iconName: 'CreditCard',
    text: {
      ru: { title: 'Выплаты через Stripe', desc: 'Автоматические выплаты на банковский счёт раз в неделю. Никаких ручных переводов.' },
      en: { title: 'Stripe payouts', desc: 'Weekly automatic payouts to your bank account. No manual transfers.' },
      th: { title: 'จ่ายเงินผ่าน Stripe', desc: 'โอนเงินอัตโนมัติเข้าบัญชีธนาคารทุกสัปดาห์ ไม่ต้องโอนเงินด้วยตนเอง' },
    },
  },
  {
    iconName: 'ShieldCheck',
    text: {
      ru: { title: 'Доверие через ClearView™', desc: 'Верифицированный профиль с бейджем повышает конверсию в 2-3 раза.' },
      en: { title: 'ClearView™ trust badge', desc: 'A verified profile with the badge converts 2-3× better.' },
      th: { title: 'ตรา ClearView™', desc: 'โปรไฟล์ที่ได้รับการยืนยันพร้อมตรารับรองช่วยเพิ่มอัตราการจองได้ 2-3 เท่า' },
    },
  },
  {
    iconName: 'Zap',
    text: {
      ru: { title: 'Регистрация за 5 минут', desc: 'Без бюрократии. Загрузите 3 фото, опишите услугу — и вы в эфире.' },
      en: { title: '5-minute signup', desc: 'No paperwork. Upload 3 photos, describe a service — and you are live.' },
      th: { title: 'สมัครใน 5 นาที', desc: 'ไม่ยุ่งยาก อัปโหลดรูป 3 รูป อธิบายบริการของคุณ แล้วเริ่มรับงานได้ทันที' },
    },
  },
];

const DEFAULT_FAQ: FaqItem[] = [
  {
    q: {
      ru: 'Сколько стоит регистрация?',
      en: 'How much does it cost to register?',
      th: 'การสมัครมีค่าใช้จ่ายเท่าไหร่?',
    },
    a: {
      ru: 'Регистрация и базовое размещение — бесплатно. Платите только комиссию с фактических продаж.',
      en: 'Registration and basic listing are free. You only pay commission on actual sales.',
      th: 'การสมัครและลงประกาศพื้นฐานฟรี คุณจ่ายเฉพาะค่าคอมมิชชั่นจากยอดขายจริงเท่านั้น',
    },
  },
  {
    q: {
      ru: 'Когда я получу первую выплату?',
      en: 'When do I receive my first payout?',
      th: 'ฉันจะได้รับเงินก้อนแรกเมื่อไหร่?',
    },
    a: {
      ru: 'Выплаты идут каждую среду через Stripe. Первая — после прохождения KYC и первой завершённой брони.',
      en: 'Payouts run every Wednesday via Stripe. The first one — after KYC verification and the first completed booking.',
      th: 'โอนเงินทุกวันพุธผ่าน Stripe ครั้งแรกหลังยืนยันตัวตน (KYC) และจองสำเร็จครั้งแรก',
    },
  },
  {
    q: {
      ru: 'Нужны ли тайские документы?',
      en: 'Do I need Thai paperwork?',
      th: 'ต้องใช้เอกสารของไทยหรือไม่?',
    },
    a: {
      ru: 'Для приёма платежей через Stripe Connect — да, нужен тайский банковский счёт или ИП/компания. Поможем с оформлением через нашего юриста.',
      en: 'To receive Stripe Connect payouts — yes, a Thai bank account or sole proprietor/company. Our legal team can help set it up.',
      th: 'หากต้องการรับเงินผ่าน Stripe Connect ต้องมีบัญชีธนาคารไทย หรือจดทะเบียนบุคคล/บริษัทไทย ทีมกฎหมายของเราช่วยจัดการให้ได้',
    },
  },
];

export const VENDOR_CATEGORIES: Record<VendorCategoryId, VendorCategoryConfig> = {
  cleaning: {
    id: 'cleaning', emoji: '🧹', commissionPct: 10,
    hero: {
      ru: { eyebrow: 'КЛИНИНГ · ПХУКЕТ', title: 'Клининговые компании — приглашаем в myUNO', subtitle: 'Регулярные клиенты из апартаментов и вилл управляющих компаний. Один заказ через приложение — без звонков и торга.' },
      en: { eyebrow: 'CLEANING · PHUKET', title: 'Cleaning companies — join myUNO', subtitle: 'Repeat clients from villas and condos managed by professional MCs. One-tap booking — no calls, no haggling.' },
      th: { eyebrow: 'ทำความสะอาด · ภูเก็ต', title: 'บริษัททำความสะอาด — เข้าร่วม myUNO', subtitle: 'ลูกค้าประจำจากวิลล่าและคอนโดที่บริหารโดย MC มืออาชีพ จองงานผ่านแอปคลิกเดียว — ไม่ต้องโทร ไม่ต้องต่อรอง' },
    },
    audience: {
      ru: 'Клининговые компании, частные клинеры, прачечные',
      en: 'Cleaning companies, private cleaners, laundry services',
      th: 'บริษัททำความสะอาด แม่บ้านอิสระ ร้านซักรีด',
    },
    valueProps: DEFAULT_VPS, faq: DEFAULT_FAQ,
  },
  beauty: {
    id: 'beauty', emoji: '💅', commissionPct: 10,
    hero: {
      ru: { eyebrow: 'BEAUTY · ПХУКЕТ', title: 'Салоны красоты — добавьте 30% к загрузке', subtitle: 'Туристы и резиденты бронируют маникюр, массаж, парикмахера через myUNO. Прозрачные слоты — без No-show.' },
      en: { eyebrow: 'BEAUTY · PHUKET', title: 'Beauty salons — fill 30% more slots', subtitle: 'Tourists and residents book nails, massage and hair via myUNO. Transparent slots — zero no-shows.' },
      th: { eyebrow: 'บิวตี้ · ภูเก็ต', title: 'ร้านเสริมสวย — เพิ่มคิวอีก 30%', subtitle: 'นักท่องเที่ยวและผู้พำนักจองทำเล็บ นวด ทำผม ผ่าน myUNO คิวชัดเจน — ลูกค้าไม่เบี้ยวนัด' },
    },
    audience: {
      ru: 'Салоны, мастера на дом, барбершопы, SPA',
      en: 'Salons, mobile stylists, barbershops, SPAs',
      th: 'ร้านเสริมสวย ช่างนอกสถานที่ บาร์เบอร์ สปา',
    },
    valueProps: DEFAULT_VPS, faq: DEFAULT_FAQ,
  },
  fitness: {
    id: 'fitness', emoji: '💪', commissionPct: 10,
    hero: {
      ru: { eyebrow: 'FITNESS · ПХУКЕТ', title: 'Фитнес-клубы и тренеры — клиенты на день и абонементы', subtitle: 'Иностранцы ищут day-pass и персональные тренировки. myUNO продаёт пакеты без комиссии Airbnb-style.' },
      en: { eyebrow: 'FITNESS · PHUKET', title: 'Gyms & coaches — day-passes and memberships', subtitle: 'Foreigners search for day passes and PT sessions. myUNO sells packages without Airbnb-style fees.' },
      th: { eyebrow: 'ฟิตเนส · ภูเก็ต', title: 'ยิมและเทรนเนอร์ — ขายเดย์พาสและสมาชิก', subtitle: 'ชาวต่างชาติมองหาเดย์พาสและคลาสส่วนตัว myUNO ขายแพ็กเกจให้คุณโดยไม่คิดค่าธรรมเนียมแบบ Airbnb' },
    },
    audience: {
      ru: 'Тренажёрные залы, муай-тай, йога, персональные тренеры',
      en: 'Gyms, Muay Thai, yoga studios, personal trainers',
      th: 'ยิม ค่ายมวยไทย สตูดิโอโยคะ เทรนเนอร์ส่วนตัว',
    },
    valueProps: DEFAULT_VPS, faq: DEFAULT_FAQ,
  },
  medical: {
    id: 'medical', emoji: '🏥', commissionPct: 8,
    hero: {
      ru: { eyebrow: 'MEDICAL · ПХУКЕТ', title: 'Клиники и доктора — медицинский туризм 2.0', subtitle: 'Русскоязычные пациенты ищут стоматологию, чек-апы, эстетику. Запись через приложение с переводом.' },
      en: { eyebrow: 'MEDICAL · PHUKET', title: 'Clinics & doctors — medical tourism 2.0', subtitle: 'Russian-speaking patients search for dentistry, check-ups and aesthetics. In-app booking with built-in translation.' },
      th: { eyebrow: 'การแพทย์ · ภูเก็ต', title: 'คลินิกและแพทย์ — ท่องเที่ยวเชิงการแพทย์ 2.0', subtitle: 'คนไข้ต่างชาติมองหาทันตกรรม ตรวจสุขภาพ และความงาม จองนัดผ่านแอปพร้อมระบบแปลภาษา' },
    },
    audience: {
      ru: 'Клиники, стоматологи, врачи, эстетическая медицина',
      en: 'Clinics, dentists, doctors, aesthetic medicine',
      th: 'คลินิก ทันตแพทย์ แพทย์ทั่วไป ความงาม',
    },
    valueProps: DEFAULT_VPS, faq: DEFAULT_FAQ,
  },
  restaurants: {
    id: 'restaurants', emoji: '🍜', commissionPct: 10,
    hero: {
      ru: { eyebrow: 'RESTAURANTS · ПХУКЕТ', title: 'Рестораны — резервы и доставка через myUNO', subtitle: 'Гости отелей и владельцы вилл бронируют стол, кейтеринг и доставку напрямую. Без агрегаторских 30%.' },
      en: { eyebrow: 'RESTAURANTS · PHUKET', title: 'Restaurants — reservations and delivery', subtitle: 'Hotel guests and villa owners book tables, catering and delivery directly. No 30% aggregator fees.' },
      th: { eyebrow: 'ร้านอาหาร · ภูเก็ต', title: 'ร้านอาหาร — จองโต๊ะและเดลิเวอรี่ผ่าน myUNO', subtitle: 'แขกโรงแรมและเจ้าของวิลล่าจองโต๊ะ จัดเลี้ยง และเดลิเวอรี่โดยตรง ไม่ต้องเสีย 30% ให้แอปกลาง' },
    },
    audience: {
      ru: 'Рестораны, кафе, бары, кейтеринг, частные шефы',
      en: 'Restaurants, cafes, bars, catering, private chefs',
      th: 'ร้านอาหาร คาเฟ่ บาร์ จัดเลี้ยง เชฟส่วนตัว',
    },
    valueProps: DEFAULT_VPS, faq: DEFAULT_FAQ,
  },
  transport: {
    id: 'transport', emoji: '🚗', commissionPct: 12,
    hero: {
      ru: { eyebrow: 'TRANSPORT · ПХУКЕТ', title: 'Трансферы, аренда авто и байков', subtitle: 'Гости со всего острова бронируют airport pickup, аренду и водителей. Календарь — у вас в кармане.' },
      en: { eyebrow: 'TRANSPORT · PHUKET', title: 'Transfers, car & bike rentals', subtitle: 'Guests across the island book airport pickups, rentals and drivers. Calendar in your pocket.' },
      th: { eyebrow: 'ขนส่ง · ภูเก็ต', title: 'รถรับส่ง เช่ารถยนต์และมอเตอร์ไซค์', subtitle: 'แขกทั่วเกาะจองรถรับสนามบิน เช่ารถ และคนขับ ปฏิทินอยู่ในมือคุณ' },
    },
    audience: {
      ru: 'Прокат авто/байков, водители, операторы трансферов',
      en: 'Car/bike rentals, drivers, transfer operators',
      th: 'ร้านเช่ารถ/มอเตอร์ไซค์ คนขับ ผู้ให้บริการรถรับส่ง',
    },
    valueProps: DEFAULT_VPS, faq: DEFAULT_FAQ,
  },
  pets: {
    id: 'pets', emoji: '🐾', commissionPct: 10,
    hero: {
      ru: { eyebrow: 'PETS · ПХУКЕТ', title: 'Ветклиники, груминг, передержка', subtitle: 'Экспаты везут питомцев на Пхукет. Найдут вас в myUNO раньше, чем загуглят.' },
      en: { eyebrow: 'PETS · PHUKET', title: 'Vets, grooming and pet-sitting', subtitle: 'Expats bring pets to Phuket. They will find you in myUNO before they Google.' },
      th: { eyebrow: 'สัตว์เลี้ยง · ภูเก็ต', title: 'คลินิกสัตว์ ตัดขน รับฝากเลี้ยง', subtitle: 'ชาวต่างชาตินำสัตว์เลี้ยงมาภูเก็ต และจะเจอคุณใน myUNO ก่อนจะไปค้นกูเกิล' },
    },
    audience: {
      ru: 'Ветклиники, груминг, dog walkers, передержка',
      en: 'Vet clinics, grooming, dog walkers, boarding',
      th: 'คลินิกสัตว์ ตัดขน พาสุนัขเดิน รับฝากเลี้ยง',
    },
    valueProps: DEFAULT_VPS, faq: DEFAULT_FAQ,
  },
  flowers: {
    id: 'flowers', emoji: '💐', commissionPct: 10,
    hero: {
      ru: { eyebrow: 'FLOWERS · ПХУКЕТ', title: 'Цветочные магазины — доставка букетов и оформление', subtitle: 'Свадьбы, романтика, бизнес-подарки. Доставка в день заказа через единое приложение.' },
      en: { eyebrow: 'FLOWERS · PHUKET', title: 'Flower shops — bouquet delivery & decor', subtitle: 'Weddings, romance, business gifts. Same-day delivery through one app.' },
      th: { eyebrow: 'ดอกไม้ · ภูเก็ต', title: 'ร้านดอกไม้ — ส่งช่อดอกไม้และตกแต่ง', subtitle: 'งานแต่ง โรแมนติก ของขวัญธุรกิจ ส่งภายในวันเดียวผ่านแอปเดียว' },
    },
    audience: {
      ru: 'Цветочные магазины, флористы, декораторы',
      en: 'Flower shops, florists, event decorators',
      th: 'ร้านดอกไม้ ฟลอริสต์ นักจัดตกแต่งงาน',
    },
    valueProps: DEFAULT_VPS, faq: DEFAULT_FAQ,
  },
  education: {
    id: 'education', emoji: '🎓', commissionPct: 8,
    hero: {
      ru: { eyebrow: 'EDUCATION · ПХУКЕТ', title: 'Школы и репетиторы', subtitle: 'Семьи-экспаты выбирают международные школы и репетиторов через myUNO. Заявки идут в CRM.' },
      en: { eyebrow: 'EDUCATION · PHUKET', title: 'Schools and tutors', subtitle: 'Expat families pick international schools and tutors via myUNO. Leads land in your CRM.' },
      th: { eyebrow: 'การศึกษา · ภูเก็ต', title: 'โรงเรียนและติวเตอร์', subtitle: 'ครอบครัวชาวต่างชาติเลือกโรงเรียนนานาชาติและติวเตอร์ผ่าน myUNO ลูกค้าใหม่เข้า CRM ของคุณโดยตรง' },
    },
    audience: {
      ru: 'Международные школы, репетиторы, языковые курсы',
      en: 'International schools, tutors, language courses',
      th: 'โรงเรียนนานาชาติ ติวเตอร์ คอร์สภาษา',
    },
    valueProps: DEFAULT_VPS, faq: DEFAULT_FAQ,
  },
  babysitter: {
    id: 'babysitter', emoji: '👶', commissionPct: 10,
    hero: {
      ru: { eyebrow: 'BABYSITTER · ПХУКЕТ', title: 'Няни и детские центры', subtitle: 'Родители ищут проверенных нянь с английским и русским. Профиль — в первой пятёрке выдачи.' },
      en: { eyebrow: 'BABYSITTER · PHUKET', title: 'Babysitters and kids clubs', subtitle: 'Parents look for vetted sitters with English & Russian. Be in the top 5 of results.' },
      th: { eyebrow: 'พี่เลี้ยงเด็ก · ภูเก็ต', title: 'พี่เลี้ยงและเนิร์สเซอรี่', subtitle: 'พ่อแม่มองหาพี่เลี้ยงที่ผ่านการตรวจสอบและพูดอังกฤษ/รัสเซียได้ ติดอันดับ 5 อันดับแรกในผลค้นหา' },
    },
    audience: {
      ru: 'Няни, гувернантки, детские центры, аниматоры',
      en: 'Babysitters, nannies, kids clubs, entertainers',
      th: 'พี่เลี้ยง เนิร์สเซอรี่ ศูนย์เด็ก พี่ๆ จัดกิจกรรม',
    },
    valueProps: DEFAULT_VPS, faq: DEFAULT_FAQ,
  },
  wellness: {
    id: 'wellness', emoji: '🧘', commissionPct: 10,
    hero: {
      ru: { eyebrow: 'WELLNESS · ПХУКЕТ', title: 'SPA, йога, holistic-практики', subtitle: 'Wellness-туристы тратят в среднем $300/день. myUNO приводит их к вам через AI-рекомендации.' },
      en: { eyebrow: 'WELLNESS · PHUKET', title: 'SPAs, yoga, holistic practitioners', subtitle: 'Wellness tourists spend $300/day on average. myUNO sends them via AI recommendations.' },
      th: { eyebrow: 'เวลเนส · ภูเก็ต', title: 'สปา โยคะ และผู้เชี่ยวชาญด้านสุขภาพองค์รวม', subtitle: 'นักท่องเที่ยวเชิงสุขภาพใช้จ่ายเฉลี่ย $300 ต่อวัน myUNO ส่งลูกค้ามาให้คุณผ่านระบบแนะนำ AI' },
    },
    audience: {
      ru: 'SPA, йога-студии, ретриты, holistic-практики',
      en: 'SPAs, yoga studios, retreats, holistic practitioners',
      th: 'สปา สตูดิโอโยคะ รีทรีต ผู้เชี่ยวชาญสุขภาพองค์รวม',
    },
    valueProps: DEFAULT_VPS, faq: DEFAULT_FAQ,
  },
  yachts: {
    id: 'yachts', emoji: '⛵', commissionPct: 12,
    hero: {
      ru: { eyebrow: 'YACHTS · ПХУКЕТ', title: 'Яхты и лодки — чартеры с прозрачным календарём', subtitle: 'Двухсторонняя синхронизация с iCal. Гости видят только реально свободные дни.' },
      en: { eyebrow: 'YACHTS · PHUKET', title: 'Yachts & boats — charters with a clean calendar', subtitle: '2-way iCal sync. Guests only see truly available dates.' },
      th: { eyebrow: 'เรือยอชต์ · ภูเก็ต', title: 'เรือยอชต์และสปีดโบ๊ท — ปฏิทินจองโปร่งใส', subtitle: 'ซิงค์ iCal สองทิศทาง ลูกค้าเห็นเฉพาะวันที่ว่างจริงเท่านั้น' },
    },
    audience: {
      ru: 'Чартерные компании, частные капитаны, спидбоат-операторы',
      en: 'Charter companies, private captains, speedboat operators',
      th: 'บริษัทเช่าเรือ กัปตันส่วนตัว ผู้ให้บริการสปีดโบ๊ท',
    },
    valueProps: DEFAULT_VPS, faq: DEFAULT_FAQ,
  },
  events: {
    id: 'events', emoji: '🎉', commissionPct: 10,
    hero: {
      ru: { eyebrow: 'EVENTS · ПХУКЕТ', title: 'Организаторы мероприятий и площадки', subtitle: 'Свадьбы, корпоративы, дни рождения. Билеты и заявки через единый чекаут.' },
      en: { eyebrow: 'EVENTS · PHUKET', title: 'Event organisers and venues', subtitle: 'Weddings, corporates, birthdays. Tickets and inquiries through one checkout.' },
      th: { eyebrow: 'อีเวนต์ · ภูเก็ต', title: 'ผู้จัดงานและสถานที่จัดงาน', subtitle: 'งานแต่ง งานเลี้ยงบริษัท วันเกิด ขายตั๋วและรับสอบถามผ่านระบบเช็คเอาท์เดียว' },
    },
    audience: {
      ru: 'Event-агентства, площадки, артисты, DJ, кейтеринг',
      en: 'Event agencies, venues, performers, DJs, catering',
      th: 'เอเจนซี่จัดงาน สถานที่ ศิลปิน ดีเจ จัดเลี้ยง',
    },
    valueProps: DEFAULT_VPS, faq: DEFAULT_FAQ,
  },
};

export const VENDOR_CATEGORY_IDS = Object.keys(VENDOR_CATEGORIES) as VendorCategoryId[];

export function getVendorCategory(id: string | undefined): VendorCategoryConfig | null {
  if (!id) return null;
  return (VENDOR_CATEGORIES as Record<string, VendorCategoryConfig>)[id] ?? null;
}
