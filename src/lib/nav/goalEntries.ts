/**
 * @module goalEntries
 * @description Goal-first entry model for the "Phuket One-Stop Platform" IA.
 *
 * Four public entry points (Stay · Live · Buy · Services) sit on top of the
 * EXISTING verticals. Every link below points at a route already mounted in
 * the router — no new data sources, no parallel truth. The unit test in
 * `__tests__/goalEntries.test.ts` fails the build if a link drifts.
 */
import {
  BedDouble, Home, Building2, Wrench, Plane, Car, Stethoscope, Scale,
  KeyRound, Hammer, Map, Sparkles, ShieldCheck, Landmark, Truck, Users,
} from 'lucide-react';
import { APP_ROUTES } from '@/lib/config/routes';

export type GoalId = 'stay' | 'live' | 'buy' | 'services';

export interface GoalLink {
  path: string;
  icon: React.ComponentType<{ className?: string }>;
  en: string;
  ru: string;
  th: string;
  descEn: string;
  descRu: string;
  descTh: string;
}

export interface GoalEntry {
  id: GoalId;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
  en: string;
  ru: string;
  th: string;
  leadEn: string;
  leadRu: string;
  leadTh: string;
  primary: GoalLink[];
  more: GoalLink[];
}

const L = (
  path: string,
  icon: GoalLink['icon'],
  en: string, ru: string, th: string,
  descEn: string, descRu: string, descTh: string,
): GoalLink => ({ path, icon, en, ru, th, descEn, descRu, descTh });

export const GOAL_ENTRIES: Record<GoalId, GoalEntry> = {
  stay: {
    id: 'stay', path: APP_ROUTES.GOAL_STAY, icon: BedDouble,
    en: 'Stay', ru: 'Аренда жилья', th: 'ที่พัก',
    leadEn: 'Villas and apartments for a few nights or a few months, checked by our team.',
    leadRu: 'Виллы и квартиры для посуточной и долгосрочной аренды.',
    leadTh: 'วิลล่าและอพาร์ตเมนต์สำหรับไม่กี่คืนหรือหลายเดือน ตรวจสอบโดยทีมของเรา',
    primary: [
      L(APP_ROUTES.PROPERTY_RENT_SHORT, BedDouble, 'Short-term rentals', 'Посуточная аренда', 'เช่าระยะสั้น',
        'Nightly and weekly stays', 'Жильё на несколько дней или недель', 'รายคืนและรายสัปดาห์'),
      L(APP_ROUTES.PROPERTY_RENT_LONG, KeyRound, 'Monthly rentals', 'Долгосрочная аренда', 'เช่ารายเดือน',
        'From one month and longer', 'Жильё на срок от одного месяца', 'ตั้งแต่หนึ่งเดือนขึ้นไป'),
      L(APP_ROUTES.PROPERTY_MAP, Map, 'Map of homes', 'Жильё на карте', 'แผนที่ที่พัก',
        'Pick the area first', 'Сначала выберите район', 'เลือกพื้นที่ก่อน'),
    ],
    more: [
      L(APP_ROUTES.TRANSPORT, Car, 'Transfers & cars', 'Трансферы и аренда автомобилей', 'รถรับส่งและรถเช่า',
        'Airport pickup, rentals', 'Встреча в аэропорту и аренда автомобиля', 'รับสนามบิน เช่ารถ'),
      L(APP_ROUTES.EXPERIENCES, Sparkles, 'Things to do', 'Отдых и экскурсии', 'กิจกรรม',
        'Tours and experiences', 'Экскурсии и другие варианты отдыха', 'ทัวร์และประสบการณ์'),
      L(APP_ROUTES.BOOKINGS, ShieldCheck, 'My bookings', 'Мои бронирования', 'การจองของฉัน',
        'Vouchers and trip details', 'Подтверждения бронирований и сведения о поездке', 'บัตรกำนัลและรายละเอียด'),
    ],
  },
  live: {
    id: 'live', path: APP_ROUTES.GOAL_LIVE, icon: Home,
    en: 'Live', ru: 'Переезд и проживание', th: 'ใช้ชีวิต',
    leadEn: 'Moving to Phuket or already here: visas, schools, doctors and everyday help.',
    leadRu: 'Визы, школы, медицинская помощь и бытовые услуги для тех, кто переезжает или живёт на Пхукете.',
    leadTh: 'ย้ายมาภูเก็ตหรืออยู่แล้ว: วีซ่า โรงเรียน แพทย์ และความช่วยเหลือในชีวิตประจำวัน',
    primary: [
      L(APP_ROUTES.RELOCATE, Plane, 'Relocation', 'Переезд', 'การย้ายถิ่น',
        'A step-by-step moving plan', 'Пошаговый план переезда', 'แผนการย้ายทีละขั้น'),
      L(APP_ROUTES.LIVE_CLUSTER, Home, 'Everyday life', 'Жизнь на острове', 'ชีวิตประจำวัน',
        'Home, family, health, leisure', 'Дом, семья, здоровье, досуг', 'บ้าน ครอบครัว สุขภาพ'),
      L(APP_ROUTES.PROPERTY_RENT_LONG, KeyRound, 'Find a home', 'Найти жильё', 'หาบ้าน',
        'Long-term rentals', 'Долгосрочная аренда', 'เช่าระยะยาว'),
    ],
    more: [
      L(APP_ROUTES.MEDICAL, Stethoscope, 'Doctors & clinics', 'Врачи и клиники', 'แพทย์และคลินิก',
        'Russian and English speaking', 'Говорят по-русски и по-английски', 'พูดรัสเซียและอังกฤษ'),
      L(APP_ROUTES.LEGAL, Scale, 'Visas & legal', 'Визы и юридическая помощь', 'วีซ่าและกฎหมาย',
        'Documents and advice', 'Документы и консультации', 'เอกสารและคำปรึกษา'),
      L(APP_ROUTES.INSURANCE, ShieldCheck, 'Insurance', 'Страхование', 'ประกันภัย',
        'Health, home, car', 'Страхование здоровья, жилья и автомобиля', 'สุขภาพ บ้าน รถยนต์'),
    ],
  },
  buy: {
    id: 'buy', path: APP_ROUTES.GOAL_BUY, icon: Building2,
    en: 'Buy', ru: 'Покупка недвижимости', th: 'ซื้อ',
    leadEn: 'Resale homes and new projects with clear ratings, documents and a calm process.',
    leadRu: 'Готовое жильё и новостройки: сведения об объектах, рейтинги и консультации по покупке.',
    leadTh: 'บ้านมือสองและโครงการใหม่ พร้อมเรตติ้ง เอกสาร และขั้นตอนที่ชัดเจน',
    primary: [
      L(APP_ROUTES.PROPERTY_BROWSE, Building2, 'Homes for sale', 'Продажа жилья', 'บ้านขาย',
        'Villas and condos', 'Виллы и квартиры', 'วิลล่าและคอนโด'),
      L(APP_ROUTES.OFFPLAN, Hammer, 'New projects', 'Новостройки', 'โครงการใหม่',
        'Off-plan with ClearView ratings', 'С рейтингами ClearView', 'พร้อมเรตติ้ง ClearView'),
      L(APP_ROUTES.PROPERTY_CONSULTATION, Users, 'Talk to an advisor', 'Консультация', 'ปรึกษาที่ปรึกษา',
        'A calm, no-pressure call', 'Ответы на вопросы о покупке недвижимости', 'พูดคุยโดยไม่กดดัน'),
    ],
    more: [
      L(APP_ROUTES.INVEST, Landmark, 'Investing', 'Инвестиции', 'การลงทุน',
        'Yields and due diligence', 'Оценка доходности и проверка объектов', 'ผลตอบแทนและการตรวจสอบ'),
      L(APP_ROUTES.SELL, KeyRound, 'Sell or list', 'Продать или сдать', 'ขายหรือลงประกาศ',
        'For owners', 'Для собственников', 'สำหรับเจ้าของ'),
      L(APP_ROUTES.LEGAL, Scale, 'Legal checks', 'Юридическая проверка', 'ตรวจสอบกฎหมาย',
        'Title and contracts', 'Право собственности и договоры', 'โฉนดและสัญญา'),
    ],
  },
  services: {
    id: 'services', path: APP_ROUTES.GOAL_SERVICES, icon: Wrench,
    en: 'Services', ru: 'Услуги', th: 'บริการ',
    leadEn: 'Verified specialists for home, family and business — in your language.',
    leadRu: 'Услуги для дома, семьи и бизнеса. Выберите специалиста и оформите заказ.',
    leadTh: 'ผู้เชี่ยวชาญที่ผ่านการตรวจสอบ สำหรับบ้าน ครอบครัว และธุรกิจ',
    primary: [
      L(APP_ROUTES.SERVICES, Wrench, 'All services', 'Все услуги', 'บริการทั้งหมด',
        'Repairs, cleaning, handymen', 'Ремонт, уборка и помощь по дому', 'ซ่อม ทำความสะอาด ช่าง'),
      L(APP_ROUTES.THAI_SERVICES, Users, 'Local Thai businesses', 'Местные компании и специалисты', 'ธุรกิจท้องถิ่น',
        'Chat with auto-translation', 'Переписка с автоматическим переводом', 'แชทพร้อมแปลอัตโนมัติ'),
      L(APP_ROUTES.CLEANING, Sparkles, 'Cleaning', 'Уборка', 'ทำความสะอาด',
        'One-off or regular', 'Разово или регулярно', 'ครั้งเดียวหรือประจำ'),
    ],
    more: [
      L(APP_ROUTES.TRANSPORT, Truck, 'Transport', 'Транспорт', 'การขนส่ง',
        'Transfers and delivery', 'Трансферы и доставка', 'รถรับส่งและจัดส่ง'),
      L(APP_ROUTES.SERVICES_MAP, Map, 'Services on the map', 'Услуги на карте', 'บริการบนแผนที่',
        'Near you', 'Рядом с вами', 'ใกล้คุณ'),
      L(APP_ROUTES.DISCOVER, ShieldCheck, 'Guided help', 'Подбор по ситуации', 'ช่วยเลือกตามสถานการณ์',
        'Tell us your situation', 'Расскажите о ситуации', 'บอกสถานการณ์ของคุณ'),
    ],
  },
};

export const GOAL_ORDER: GoalId[] = ['stay', 'live', 'buy', 'services'];

export function isGoalId(v: string | undefined): v is GoalId {
  return !!v && (GOAL_ORDER as string[]).includes(v);
}
