import { APP_ROUTES as R } from '@/lib/config/routes';
import type { LangValues } from '@/lib/i18n/pickLang';

/** Public navigation only: no new domain state, catalogue, prices or availability. */
export const homeCopy = {
  place: { ru: 'Остановитесь на Пхукете.', en: 'Stay in Phuket.', th: 'พักที่ภูเก็ต' },
  headline: { ru: 'С остальным поможем.', en: 'We’ll help with the rest.', th: 'เราช่วยดูแลเรื่องอื่นให้' },
  lead: { ru: 'Жильё для отпуска и переезда, местные услуги и поддержка команды на острове.', en: 'Homes for holidays and longer stays, local services, and support from our team on the island.', th: 'ที่พักสำหรับวันหยุดหรือการอยู่อาศัยระยะยาว บริการท้องถิ่น และทีมงานที่พร้อมช่วยเหลือบนเกาะ' },
  stays: { ru: 'Где остановиться', en: 'Places to stay', th: 'ที่พักสำหรับคุณ' },
  staysLead: { ru: 'Посмотрите доступные варианты и откройте карточку, чтобы узнать подробности и выбрать даты.', en: 'Browse real listings, then open a home to see details and choose your dates.', th: 'ดูที่พักที่ลงประกาศ แล้วเปิดรายละเอียดเพื่อเลือกวันเข้าพัก' },
  layantara: { ru: 'Layantara Villas', en: 'Layantara Villas', th: 'Layantara Villas' },
  layantaraLead: { ru: 'Уточните у команды свободные даты и подходящий вариант.', en: 'Ask our team about available dates and the right villa for your stay.', th: 'ติดต่อทีมงานเพื่อสอบถามวันที่ว่างและวิลล่าที่เหมาะกับการเข้าพัก' },
  layantaraAction: { ru: 'Уточнить даты', en: 'Ask about dates', th: 'สอบถามวันที่ว่าง' },
  emptyHomes: { ru: 'Пока нет опубликованных вариантов. Посмотрите весь каталог жилья.', en: 'There are no published homes to show here yet. Browse the full catalogue.', th: 'ยังไม่มีที่พักที่เผยแพร่ในขณะนี้ ดูที่พักทั้งหมด' },
  loadHomesError: { ru: 'Не удалось загрузить варианты. Каталог жилья доступен по ссылке ниже.', en: 'Homes could not be loaded. Use the link below to open the catalogue.', th: 'โหลดที่พักไม่สำเร็จ ใช้ลิงก์ด้านล่างเพื่อเปิดแค็ตตาล็อก' },
  ownersPrompt: { ru: 'У вас есть недвижимость на Пхукете?', en: 'Do you own property in Phuket?', th: 'คุณเป็นเจ้าของอสังหาริมทรัพย์ในภูเก็ตหรือไม่' },
  ownersPromptLead: { ru: 'Помогаем со сдачей, управлением и обслуживанием объекта.', en: 'Get help with renting, managing and maintaining your property.', th: 'เราช่วยเรื่องปล่อยเช่า จัดการ และดูแลอสังหาริมทรัพย์ของคุณ' },
  forOwners: { ru: 'Решения для собственников', en: 'Property owner support', th: 'บริการสำหรับเจ้าของอสังหาริมทรัพย์' },
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
    title: { ru: 'Планирую отпуск', en: 'Planning a holiday', th: 'กำลังวางแผนวันหยุด' },
    description: { ru: 'Подберите жильё и подготовьтесь к поездке.', en: 'Find a place to stay and get ready for your trip.', th: 'หาที่พักและเตรียมตัวสำหรับการเดินทาง' } },
  { id: 'relocate', icon: 'home', href: R.GOAL_LIVE,
    title: { ru: 'Переезжаю или уже живу здесь', en: 'Moving here or living here', th: 'กำลังย้ายมาหรืออาศัยอยู่ที่นี่' },
    description: { ru: 'Жильё, районы и помощь с повседневными делами.', en: 'Homes, neighbourhoods and help with everyday needs.', th: 'ที่พัก ย่านต่าง ๆ และความช่วยเหลือในชีวิตประจำวัน' } },
  { id: 'services', icon: 'service', href: R.GOAL_SERVICES,
    title: { ru: 'Мне нужна услуга', en: 'I need a service', th: 'ฉันกำลังมองหาบริการ' },
    description: { ru: 'Трансфер, уборка, отдых и другие услуги.', en: 'Transfers, cleaning, experiences and more.', th: 'รถรับส่ง ทำความสะอาด กิจกรรม และบริการอื่น ๆ' } },
] satisfies { id: string; icon: string; href: string; title: LangValues; description: LangValues }[];
