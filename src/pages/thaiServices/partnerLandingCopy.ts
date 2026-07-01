/**
 * Trilingual copy for the public Thai-business acquisition landing (/thai-business).
 *
 * Audience: Thai small-business owners. Primary language Thai, with English and
 * Russian toggles (Russian also lets the myUNO team review/edit). Kept out of
 * the page component so the TSX stays lean and copy edits don't touch logic.
 */

export type PartnerLang = 'th' | 'en' | 'ru';

export const PARTNER_LANGS: { code: PartnerLang; label: string }[] = [
  { code: 'th', label: 'ไทย' },
  { code: 'en', label: 'EN' },
  { code: 'ru', label: 'RU' },
];

interface Item {
  title: string;
  desc: string;
}
interface Offer {
  key: string;
  title: string;
  desc: string;
}
interface Opt {
  key: string;
  label: string;
}

export interface PartnerCopy {
  metaTitle: string;
  metaDescription: string;
  nav: { apply: string };
  hero: { eyebrow: string; title: string; subtitle: string; cta: string; chips: string[] };
  painsTitle: string;
  pains: Item[];
  offerTitle: string;
  offerSubtitle: string;
  offers: Offer[];
  stepsTitle: string;
  steps: Item[];
  form: {
    title: string;
    subtitle: string;
    name: string;
    business: string;
    phone: string;
    email: string;
    category: string;
    categoryPlaceholder: string;
    interests: string;
    message: string;
    submit: string;
    submitting: string;
    successTitle: string;
    successBody: string;
    errorMsg: string;
    requiredNote: string;
  };
  categories: Opt[];
  footer: string;
}

/** Service keys shared by the offer cards and the interest checkboxes. */
export const OFFER_KEYS = ['menu', 'website', 'promotion', 'automation', 'payments', 'translation'] as const;

export const PARTNER_COPY: Record<PartnerLang, PartnerCopy> = {
  th: {
    metaTitle: 'myUNO สำหรับธุรกิจไทย — เข้าถึงลูกค้าต่างชาติในภูเก็ต',
    metaDescription:
      'myUNO ช่วยธุรกิจไทยให้พร้อมรับลูกค้าต่างชาติ: เมนูหลายภาษา เว็บไซต์ การตลาดออนไลน์ และระบบจอง/ชำระเงินอัตโนมัติ',
    nav: { apply: 'สมัครเข้าร่วม' },
    hero: {
      eyebrow: 'สำหรับธุรกิจไทยในภูเก็ต',
      title: 'พาธุรกิจของคุณเข้าถึงลูกค้าต่างชาติในภูเก็ต',
      subtitle:
        'myUNO ช่วยธุรกิจไทยให้พร้อมรับนักท่องเที่ยวและชาวต่างชาติ — เมนูหลายภาษา เว็บไซต์ การตลาดออนไลน์ และระบบจองและชำระเงินอัตโนมัติ',
      cta: 'สมัครเข้าร่วม / ปรึกษาฟรี',
      chips: ['เมนูหลายภาษา', 'เว็บไซต์', 'การตลาดออนไลน์', 'ระบบจอง'],
    },
    painsTitle: 'ปัญหาที่ธุรกิจไทยเจอ',
    pains: [
      { title: 'ลูกค้าต่างชาติหาคุณไม่เจอ', desc: 'ไม่มีตัวตนออนไลน์เป็นภาษาอังกฤษหรือรัสเซีย' },
      { title: 'สื่อสารกับลูกค้าต่างชาติยาก', desc: 'เมนูและข้อมูลมีแค่ภาษาไทย' },
      { title: 'รับจองและชำระเงินไม่สะดวก', desc: 'ไม่มีช่องทางที่นักท่องเที่ยวคุ้นเคย' },
    ],
    offerTitle: 'สิ่งที่ myUNO ทำให้คุณได้',
    offerSubtitle: 'เราจัดการให้ครบ ตั้งแต่ภาษา การตลาด ไปจนถึงระบบจองและชำระเงิน',
    offers: [
      { key: 'menu', title: 'เมนู/แค็ตตาล็อกหลายภาษา', desc: 'แปลเมนูและบริการเป็นอังกฤษ รัสเซีย และอื่นๆ' },
      { key: 'website', title: 'เว็บไซต์ & แลนดิ้งเพจ', desc: 'หน้าเว็บมืออาชีพ พร้อมแผนที่และปุ่มติดต่อ' },
      { key: 'promotion', title: 'การตลาดและโปรโมตออนไลน์', desc: 'โปรโมตในโซเชียลและในแพลตฟอร์ม myUNO ถึงชาวต่างชาติ' },
      { key: 'automation', title: 'ระบบจองและทำงานอัตโนมัติ', desc: 'รับการจอง จัดตารางคิว และแจ้งเตือนอัตโนมัติ' },
      { key: 'payments', title: 'รับชำระเงินจากต่างชาติ', desc: 'บัตรเครดิตและช่องทางที่นักท่องเที่ยวใช้' },
      { key: 'translation', title: 'แชทแปลภาษาอัตโนมัติ', desc: 'คุยกับลูกค้าต่างชาติ ระบบแปลให้ทันที' },
    ],
    stepsTitle: 'เริ่มต้นง่ายๆ 3 ขั้นตอน',
    steps: [
      { title: 'ส่งข้อมูลธุรกิจของคุณ', desc: 'กรอกแบบฟอร์มสั้นๆ ใช้เวลาไม่ถึง 2 นาที' },
      { title: 'เราเตรียมทุกอย่างให้', desc: 'ทีมงาน myUNO สร้างหน้าเพจ เมนู และระบบให้คุณ' },
      { title: 'เริ่มรับลูกค้าต่างชาติ', desc: 'ธุรกิจของคุณพร้อมออนไลน์และรับการจอง' },
    ],
    form: {
      title: 'สมัครเข้าร่วม myUNO',
      subtitle: 'กรอกข้อมูล แล้วเราจะติดต่อกลับทาง WhatsApp',
      name: 'ชื่อของคุณ',
      business: 'ชื่อธุรกิจ',
      phone: 'เบอร์โทร / WhatsApp',
      email: 'อีเมล (ไม่บังคับ)',
      category: 'ประเภทธุรกิจ',
      categoryPlaceholder: 'เลือกประเภท',
      interests: 'สนใจบริการใดบ้าง',
      message: 'ข้อความถึงเรา (ไม่บังคับ)',
      submit: 'ส่งใบสมัคร',
      submitting: 'กำลังส่ง…',
      successTitle: 'ขอบคุณ! ได้รับใบสมัครแล้ว',
      successBody: 'ทีมงาน myUNO จะติดต่อกลับเร็วๆ นี้ทาง WhatsApp',
      errorMsg: 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง',
      requiredNote: '* จำเป็นต้องกรอก',
    },
    categories: [
      { key: 'car_rental', label: 'เช่ารถยนต์' },
      { key: 'bike_rental', label: 'เช่ามอเตอร์ไซค์' },
      { key: 'car_service', label: 'ศูนย์บริการรถ' },
      { key: 'car_wash', label: 'คาร์แคร์ / ล้างรถ' },
      { key: 'cafe', label: 'คาเฟ่' },
      { key: 'restaurant', label: 'ร้านอาหาร' },
      { key: 'flowers', label: 'ร้านดอกไม้' },
      { key: 'delivery', label: 'เดลิเวอรี' },
      { key: 'other_services', label: 'บริการอื่นๆ' },
    ],
    footer: 'myUNO · ภูเก็ต ประเทศไทย',
  },

  en: {
    metaTitle: 'myUNO for Thai Business — reach foreign customers in Phuket',
    metaDescription:
      'myUNO helps Thai businesses get ready for international clients: multilingual menus, websites, online marketing, and automated booking & payments.',
    nav: { apply: 'Apply' },
    hero: {
      eyebrow: 'For Thai businesses in Phuket',
      title: "Bring your business to Phuket's foreign customers",
      subtitle:
        'myUNO helps Thai businesses get ready for international clients, multilingual menus, websites, online marketing, and automated booking & payments.',
      cta: 'Apply / Free consultation',
      chips: ['Multilingual menus', 'Website', 'Online marketing', 'Bookings'],
    },
    painsTitle: 'Challenges Thai businesses face',
    pains: [
      { title: "Foreign customers can't find you", desc: 'No online presence in English or Russian' },
      { title: 'Hard to communicate', desc: 'Your menu and info are only in Thai' },
      { title: 'Bookings & payments are painful', desc: "None of the channels tourists are used to" },
    ],
    offerTitle: 'What myUNO does for you',
    offerSubtitle: 'We handle it all — from language and marketing to bookings and payments.',
    offers: [
      { key: 'menu', title: 'Multilingual menu & catalogue', desc: 'Translate your menu and services into English, Russian and more' },
      { key: 'website', title: 'Website & landing page', desc: 'A professional page with map and contact buttons' },
      { key: 'promotion', title: 'Online marketing & promotion', desc: 'Promotion on social media and inside myUNO to foreign audiences' },
      { key: 'automation', title: 'Booking & automation', desc: 'Take bookings, manage your schedule, automatic reminders' },
      { key: 'payments', title: 'Accept foreign payments', desc: 'Cards and the payment methods tourists actually use' },
      { key: 'translation', title: 'Auto-translated chat', desc: 'Talk to foreign customers; we translate instantly' },
    ],
    stepsTitle: 'Get started in 3 steps',
    steps: [
      { title: 'Send us your business info', desc: 'Fill a short form — under 2 minutes' },
      { title: 'We set everything up', desc: 'The myUNO team builds your page, menu and tools' },
      { title: 'Start getting foreign customers', desc: 'Your business goes online and takes bookings' },
    ],
    form: {
      title: 'Apply to join myUNO',
      subtitle: "Leave your details and we'll contact you on WhatsApp",
      name: 'Your name',
      business: 'Business name',
      phone: 'Phone / WhatsApp',
      email: 'Email (optional)',
      category: 'Business type',
      categoryPlaceholder: 'Choose type',
      interests: 'Which services interest you?',
      message: 'Message (optional)',
      submit: 'Submit',
      submitting: 'Sending…',
      successTitle: 'Thank you! We received your application',
      successBody: 'The myUNO team will contact you soon on WhatsApp',
      errorMsg: 'Something went wrong, please try again',
      requiredNote: '* required',
    },
    categories: [
      { key: 'car_rental', label: 'Car rental' },
      { key: 'bike_rental', label: 'Motorbike rental' },
      { key: 'car_service', label: 'Car service' },
      { key: 'car_wash', label: 'Car wash / detailing' },
      { key: 'cafe', label: 'Cafe' },
      { key: 'restaurant', label: 'Restaurant' },
      { key: 'flowers', label: 'Flower shop' },
      { key: 'delivery', label: 'Delivery' },
      { key: 'other_services', label: 'Other services' },
    ],
    footer: 'myUNO · Phuket, Thailand',
  },

  ru: {
    metaTitle: 'myUNO для тайского бизнеса — клиенты-иностранцы на Пхукете',
    metaDescription:
      'myUNO помогает тайскому бизнесу выйти на рынок иностранцев: многоязычные меню, сайты, онлайн-продвижение и приём броней и платежей.',
    nav: { apply: 'Оставить заявку' },
    hero: {
      eyebrow: 'Для тайского бизнеса на Пхукете',
      title: 'Приведите клиентов-иностранцев в ваш бизнес на Пхукете',
      subtitle:
        'myUNO помогает тайскому бизнесу выйти на рынок иностранцев — многоязычные меню, сайты, онлайн-продвижение и приём броней и платежей.',
      cta: 'Оставить заявку / Бесплатная консультация',
      chips: ['Многоязычные меню', 'Сайт', 'Онлайн-продвижение', 'Брони'],
    },
    painsTitle: 'С чем сталкивается тайский бизнес',
    pains: [
      { title: 'Иностранцы вас не находят', desc: 'Нет онлайн-присутствия на английском и русском' },
      { title: 'Сложно общаться', desc: 'Меню и информация только на тайском' },
      { title: 'Неудобно принимать брони и оплаты', desc: 'Нет привычных туристам каналов' },
    ],
    offerTitle: 'Что myUNO делает для вас',
    offerSubtitle: 'Берём на себя всё — от языка и продвижения до броней и платежей.',
    offers: [
      { key: 'menu', title: 'Многоязычное меню и каталог', desc: 'Перевод меню и услуг на английский, русский и др.' },
      { key: 'website', title: 'Сайт и лендинг', desc: 'Профессиональная страница с картой и кнопками связи' },
      { key: 'promotion', title: 'Онлайн-продвижение', desc: 'Продвижение в соцсетях и внутри myUNO для иностранцев' },
      { key: 'automation', title: 'Брони и автоматизация', desc: 'Приём броней, расписание, авто-напоминания' },
      { key: 'payments', title: 'Приём платежей от иностранцев', desc: 'Карты и привычные туристам способы оплаты' },
      { key: 'translation', title: 'Чат с авто-переводом', desc: 'Общайтесь с иностранцами — переводим мгновенно' },
    ],
    stepsTitle: 'Старт в 3 шага',
    steps: [
      { title: 'Пришлите данные о бизнесе', desc: 'Короткая форма — меньше 2 минут' },
      { title: 'Мы всё настроим', desc: 'Команда myUNO сделает страницу, меню и инструменты' },
      { title: 'Получайте клиентов-иностранцев', desc: 'Бизнес онлайн и принимает брони' },
    ],
    form: {
      title: 'Оставьте заявку в myUNO',
      subtitle: 'Оставьте контакты — свяжемся с вами в WhatsApp',
      name: 'Ваше имя',
      business: 'Название бизнеса',
      phone: 'Телефон / WhatsApp',
      email: 'Email (необязательно)',
      category: 'Тип бизнеса',
      categoryPlaceholder: 'Выберите тип',
      interests: 'Какие услуги интересны?',
      message: 'Сообщение (необязательно)',
      submit: 'Отправить',
      submitting: 'Отправляем…',
      successTitle: 'Спасибо! Заявка получена',
      successBody: 'Команда myUNO скоро свяжется с вами в WhatsApp',
      errorMsg: 'Что-то пошло не так, попробуйте ещё раз',
      requiredNote: '* обязательно',
    },
    categories: [
      { key: 'car_rental', label: 'Аренда авто' },
      { key: 'bike_rental', label: 'Аренда байков' },
      { key: 'car_service', label: 'Автосервис' },
      { key: 'car_wash', label: 'Автомойка / детейлинг' },
      { key: 'cafe', label: 'Кафе' },
      { key: 'restaurant', label: 'Ресторан' },
      { key: 'flowers', label: 'Цветы' },
      { key: 'delivery', label: 'Доставка' },
      { key: 'other_services', label: 'Другие услуги' },
    ],
    footer: 'myUNO · Пхукет, Таиланд',
  },
};
