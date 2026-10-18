import { APP_ROUTES as R } from '@/lib/config/routes';
import type { LangValues } from '@/lib/i18n/pickLang';

/** Public navigation only: no new domain state, catalogue, prices or availability. */
export const homeCopy = {
  place: { ru: 'Пхукет.', en: 'Phuket.', th: 'ภูเก็ต' },
  headline: { ru: 'Вы дома.', en: 'You’re home.', th: 'บ้านของคุณ' },
  lead: { ru: 'Жильё, отдых и повседневные дела — с местной командой myUNO.', en: 'Homes, holidays and everyday life — with your local myUNO team.', th: 'ที่พัก วันพักผ่อน และชีวิตประจำวัน พร้อมทีม myUNO ในพื้นที่' },
  plans: { ru: 'Какие у вас планы?', en: 'What brings you here?', th: 'คุณมีแผนอะไรบ้าง?' },
  plansLead: { ru: 'Начните с того, что важно сейчас.', en: 'Start with what matters today.', th: 'เริ่มจากสิ่งที่สำคัญในวันนี้' },
  discover: { ru: 'Место, куда хочется возвращаться', en: 'Somewhere you’ll want to return to', th: 'สถานที่ที่คุณอยากกลับมาอีก' },
  discoverLead: { ru: 'Найдите свой формат отдыха и жизни на острове.', en: 'Find your way to stay and live on the island.', th: 'ค้นหาที่พักและรูปแบบชีวิตบนเกาะที่เหมาะกับคุณ' },
  browse: { ru: 'Смотреть жильё', en: 'Explore homes', th: 'ดูที่พัก' },
  help: { ru: 'Помощь', en: 'Help', th: 'ความช่วยเหลือ' },
  owners: { ru: 'Собственникам', en: 'For owners', th: 'สำหรับเจ้าของ' },
  signIn: { ru: 'Войти', en: 'Sign in', th: 'เข้าสู่ระบบ' },
  housing: { ru: 'Жильё', en: 'Homes', th: 'ที่พัก' },
  experiences: { ru: 'Впечатления', en: 'Experiences', th: 'ประสบการณ์' },
  services: { ru: 'Услуги', en: 'Services', th: 'บริการ' },
  closing: { ru: 'Планы меняются.\nМы остаёмся рядом.', en: 'Plans change.\nWe’re still here for you.', th: 'แผนเปลี่ยนได้\nเรายังอยู่เคียงข้างคุณ' },
  contact: { ru: 'Связаться с командой', en: 'Talk to our team', th: 'ติดต่อทีมงาน' },
  urgent: { ru: 'Экстренная помощь и телефоны служб', en: 'Emergency help and useful numbers', th: 'ความช่วยเหลือฉุกเฉินและหมายเลขติดต่อ' },
  business: { ru: 'Инвестиции и бизнес', en: 'Investment and business', th: 'การลงทุนและธุรกิจ' },
  partners: { ru: 'Стать партнёром', en: 'Become a partner', th: 'ร่วมเป็นพาร์ทเนอร์' },
} satisfies Record<string, LangValues>;

export const homeJourneys = [
  { id: 'holiday', icon: 'holiday', href: R.TRIP_PLANNER,
    title: { ru: 'Приехать на отдых', en: 'Plan a holiday', th: 'วางแผนวันหยุด' },
    description: { ru: 'Жильё и всё для поездки', en: 'A home and everything for your trip', th: 'ที่พักและทุกอย่างสำหรับการเดินทาง' } },
  { id: 'relocate', icon: 'home', href: R.GOAL_LIVE,
    title: { ru: 'Переехать жить', en: 'Make the move', th: 'ย้ายมาอยู่' },
    description: { ru: 'Районы, школы, подготовка переезда', en: 'Areas, schools and your move', th: 'ย่าน โรงเรียน และการเตรียมย้าย' } },
  { id: 'services', icon: 'service', href: R.GOAL_SERVICES,
    title: { ru: 'Найти услугу', en: 'Find a service', th: 'ค้นหาบริการ' },
    description: { ru: 'Транспорт, уборка и повседневные дела', en: 'Transport, cleaning and everyday needs', th: 'การเดินทาง ทำความสะอาด และชีวิตประจำวัน' } },
  { id: 'owner', icon: 'key', href: R.FOR_OWNERS,
    title: { ru: 'Позаботиться о недвижимости', en: 'Care for your property', th: 'ดูแลอสังหาริมทรัพย์ของคุณ' },
    description: { ru: 'Аренда, управление и обслуживание', en: 'Letting, management and maintenance', th: 'ปล่อยเช่า จัดการ และบำรุงรักษา' } },
] satisfies { id: string; icon: string; href: string; title: LangValues; description: LangValues }[];
