import { AppLayout } from '@/components/layout/AppLayout';
import { PageContainer } from '@/components/uno/PageContainer';
import { PageHeader } from '@/components/uno/PageHeader';
import { SectionCard } from '@/components/uno/SectionCard';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { HelpCircle, MessageCircle, Shield, Building2, Users2, CreditCard, Scale, GraduationCap, Heart, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

export default function FAQPage() {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const isTh = language === 'th';

  const faqCategories = [
    {
      title: isRu ? 'Общие вопросы' : isTh ? 'คำถามทั่วไป' : 'General Questions',
      icon: HelpCircle,
      items: [
        {
          q: isRu ? 'Что такое myUNO?' : isTh ? 'myUNO คืออะไร?' : 'What is myUNO?',
          a: isRu 
            ? 'myUNO — это не просто приложение, это инфраструктура для комфортной жизни за рубежом. Платформа объединяет цифровые сервисы и оффлайн-поддержку: от бронирования жилья до управления инвестициями, от вызова помощи на дорогу до организации уборки вашей зарубежной квартиры.'
            : isTh 
            ? 'myUNO ไม่ใช่แค่แอป มันคือโครงสร้างพื้นฐานสำหรับชีวิตที่สะดวกสบายในต่างประเทศ แพลตฟอร์มรวมบริการดิจิทัลและการสนับสนุนออฟไลน์: ตั้งแต่การจองที่พักไปจนถึงการจัดการการลงทุน ตั้งแต่การเรียกความช่วยเหลือบนถนนไปจนถึงการจัดการทำความสะอาดอพาร์ตเมนต์ในต่างประเทศของคุณ'
            : 'myUNO is not just an app, it\'s an infrastructure for comfortable life abroad. The platform combines digital services and offline support: from booking housing to investment management, from roadside assistance to organizing cleaning for your overseas apartment.',
        },
        {
          q: isRu ? 'Для кого создан myUNO?' : isTh ? 'myUNO สร้างขึ้นเพื่อใคร?' : 'Who is myUNO created for?',
          a: isRu 
            ? 'myUNO для всех, кто хочет чувствовать себя дома, находясь за рубежом: путешественники и туристы, экспаты и резиденты, владельцы зарубежной недвижимости, digital nomads. Мы помогаем решать задачи любого масштаба — от отправки цветов до формирования инвестиционного портфеля.'
            : isTh 
            ? 'myUNO สำหรับทุกคนที่ต้องการรู้สึกเหมือนอยู่บ้านในต่างประเทศ: นักเดินทางและนักท่องเที่ยว, ชาวต่างชาติและผู้อยู่อาศัย, เจ้าของอสังหาริมทรัพย์ในต่างประเทศ, digital nomads เราช่วยแก้ปัญหาทุกขนาด — ตั้งแต่การส่งดอกไม้ไปจนถึงการสร้างพอร์ตการลงทุน'
            : 'myUNO is for everyone who wants to feel at home while abroad: travelers and tourists, expats and residents, overseas property owners, digital nomads. We help solve tasks of any scale — from sending flowers to building an investment portfolio.',
        },
        {
          q: isRu ? 'Приложение бесплатное?' : isTh ? 'แอปฟรีหรือไม่?' : 'Is the app free?',
          a: isRu 
            ? 'Да, использование приложения полностью бесплатно. Вы платите только за услуги, которые бронируете.'
            : isTh 
            ? 'ใช่ การใช้แอปฟรีทั้งหมด คุณจ่ายเฉพาะบริการที่จองเท่านั้น'
            : 'Yes, using the app is completely free. You only pay for the services you book.',
        },
        {
          q: isRu ? 'На каких языках доступен myUNO?' : isTh ? 'myUNO มีให้บริการในภาษาใดบ้าง?' : 'What languages is myUNO available in?',
          a: isRu 
            ? 'myUNO доступен на русском, английском и тайском языках. Мультиязычная поддержка 24/7 понимает ваш контекст и культуру.'
            : isTh 
            ? 'myUNO มีให้บริการเป็นภาษารัสเซีย อังกฤษ และไทย การสนับสนุนหลายภาษา 24/7 เข้าใจบริบทและวัฒนธรรมของคุณ'
            : 'myUNO is available in Russian, English and Thai. Multilingual 24/7 support understands your context and culture.',
        },
        {
          q: isRu ? 'Чем myUNO отличается от других платформ?' : isTh ? 'myUNO แตกต่างจากแพลตฟอร์มอื่นอย่างไร?' : 'How is myUNO different from other platforms?',
          a: isRu 
            ? 'myUNO — это не только цифровая платформа, но и оффлайн-инфраструктура с командой на местах. Мы решаем практические задачи: спустило колесо — вызываем помощь, нужна уборка квартиры на Пхукете пока вы в другой стране — организуем. Все партнёры проверены по системе G-Trust.'
            : isTh 
            ? 'myUNO ไม่ใช่แค่แพลตฟอร์มดิจิทัล แต่ยังเป็นโครงสร้างพื้นฐานออฟไลน์ที่มีทีมในพื้นที่ เราแก้ปัญหาในทางปฏิบัติ: ยางแบน — เราเรียกความช่วยเหลือ, ต้องการทำความสะอาดอพาร์ตเมนต์ในภูเก็ตขณะที่คุณอยู่ประเทศอื่น — เราจัดการให้ พันธมิตรทั้งหมดได้รับการตรวจสอบโดยระบบ G-Trust'
            : 'myUNO is not only a digital platform, but also an offline infrastructure with a team on the ground. We solve practical tasks: flat tire — we call for help, need apartment cleaning in Phuket while you\'re in another country — we organize it. All partners are verified by G-Trust system.',
        },
      ],
    },
    {
      title: isRu ? 'G-Trust — Три столпа доверия' : isTh ? 'G-Trust — สามเสาหลักแห่งความไว้วางใจ' : 'G-Trust — Three Pillars of Trust',
      icon: Shield,
      items: [
        {
          q: isRu ? 'Что такое G-Trust?' : isTh ? 'G-Trust คืออะไร?' : 'What is G-Trust?',
          a: isRu 
            ? 'G-Trust — это система гарантий myUNO, построенная на трёх столпах: юридическое соответствие (Legal Compliance), модель качества (Quality Model) и социальная верификация (Social Verification). Каждый партнёр проходит проверку по всем трём направлениям.'
            : isTh 
            ? 'G-Trust คือระบบการรับประกันของ myUNO ที่สร้างขึ้นบนสามเสาหลัก: การปฏิบัติตามกฎหมาย (Legal Compliance), แบบจำลองคุณภาพ (Quality Model) และการยืนยันทางสังคม (Social Verification) พันธมิตรทุกรายผ่านการตรวจสอบในทั้งสามทิศทาง'
            : 'G-Trust is myUNO\'s guarantee system built on three pillars: Legal Compliance, Quality Model, and Social Verification. Every partner is verified across all three dimensions.',
        },
        {
          q: isRu ? 'Что такое Legal Compliance?' : isTh ? 'Legal Compliance คืออะไร?' : 'What is Legal Compliance?',
          a: isRu 
            ? 'Legal Compliance (30% Trust Score) — проверка юридического соответствия: регистрация бизнеса, налоговый статус, лицензии (TAT, DLT, FDA, Hotel License), страхование, соответствие трудовому законодательству и PDPA (защита данных).'
            : isTh 
            ? 'Legal Compliance (30% Trust Score) — การตรวจสอบการปฏิบัติตามกฎหมาย: การจดทะเบียนธุรกิจ, สถานะภาษี, ใบอนุญาต (TAT, DLT, FDA, Hotel License), ประกัน, การปฏิบัติตามกฎหมายแรงงาน และ PDPA (การคุ้มครองข้อมูล)'
            : 'Legal Compliance (30% Trust Score) — verification of legal compliance: business registration, tax status, licenses (TAT, DLT, FDA, Hotel License), insurance, labor law compliance and PDPA (data protection).',
        },
        {
          q: isRu ? 'Что такое Quality Model?' : isTh ? 'Quality Model คืออะไร?' : 'What is Quality Model?',
          a: isRu 
            ? 'Quality Model (40% Trust Score) — наша оценка качества сервиса: первичный аудит при онбординге, Mystery Shopping (тайные покупатели), SLA-метрики (время отклика < 15 мин, Confirmation Rate > 95%, Completion Rate > 98%), регулярные ре-аудиты каждые 6 месяцев.'
            : isTh 
            ? 'Quality Model (40% Trust Score) — การประเมินคุณภาพบริการของเรา: การตรวจสอบเบื้องต้นเมื่อเริ่มต้น, Mystery Shopping (ลูกค้าปริศนา), SLA-metrics (เวลาตอบกลับ < 15 นาที, Confirmation Rate > 95%, Completion Rate > 98%), การตรวจสอบซ้ำเป็นประจำทุก 6 เดือน'
            : 'Quality Model (40% Trust Score) — our service quality assessment: initial audit during onboarding, Mystery Shopping (secret shoppers), SLA metrics (response time < 15 min, Confirmation Rate > 95%, Completion Rate > 98%), regular re-audits every 6 months.',
        },
        {
          q: isRu ? 'Что такое Social Verification?' : isTh ? 'Social Verification คืออะไร?' : 'What is Social Verification?',
          a: isRu 
            ? 'Social Verification (30% Trust Score) — социальное подтверждение качества: верифицированные отзывы только от реальных клиентов, фото и видео от пользователей, Repeat Booking Rate (% повторных заказов), Net Promoter Score, рекомендации от других партнёров.'
            : isTh 
            ? 'Social Verification (30% Trust Score) — การยืนยันคุณภาพทางสังคม: รีวิวที่ได้รับการยืนยันจากลูกค้าจริงเท่านั้น, รูปภาพและวิดีโอจากผู้ใช้, Repeat Booking Rate (% การจองซ้ำ), Net Promoter Score, คำแนะนำจากพันธมิตรอื่น'
            : 'Social Verification (30% Trust Score) — social quality confirmation: verified reviews only from real customers, photos and videos from users, Repeat Booking Rate, Net Promoter Score, recommendations from other partners.',
        },
        {
          q: isRu ? 'Как формируется Trust Score?' : isTh ? 'Trust Score คำนวณอย่างไร?' : 'How is Trust Score calculated?',
          a: isRu 
            ? 'Trust Score — это индекс доверия от 0 до 100%, рассчитываемый по формуле: Legal Compliance (30%) + Quality Model (40%) + Social Verification (30%). Уровни: 90-100% — Превосходно, 75-89% — Отлично, 60-74% — Хорошо, <60% — Требует улучшения.'
            : isTh 
            ? 'Trust Score คือดัชนีความไว้วางใจตั้งแต่ 0 ถึง 100% คำนวณโดยสูตร: Legal Compliance (30%) + Quality Model (40%) + Social Verification (30%) ระดับ: 90-100% — ยอดเยี่ยม, 75-89% — ดีมาก, 60-74% — ดี, <60% — ต้องปรับปรุง'
            : 'Trust Score is a trust index from 0 to 100%, calculated by formula: Legal Compliance (30%) + Quality Model (40%) + Social Verification (30%). Levels: 90-100% — Excellent, 75-89% — Great, 60-74% — Good, <60% — Needs Improvement.',
        },
        {
          q: isRu ? 'Что означают уровни верификации?' : isTh ? 'ระดับการยืนยันหมายความว่าอย่างไร?' : 'What do verification levels mean?',
          a: isRu 
            ? 'Basic (🔵) — базовая проверка документов. Verified (🔷) — полная проверка + первичный аудит. Trusted (✅) — регулярный аудит + рейтинг 4.5+. Premium (⭐) — Mystery Shopping + рейтинг 4.8+ + Repeat Rate > 40%.'
            : isTh 
            ? 'Basic (🔵) — การตรวจสอบเอกสารเบื้องต้น Verified (🔷) — การตรวจสอบเต็มรูปแบบ + การตรวจสอบเบื้องต้น Trusted (✅) — การตรวจสอบเป็นประจำ + เรตติ้ง 4.5+ Premium (⭐) — Mystery Shopping + เรตติ้ง 4.8+ + Repeat Rate > 40%'
            : 'Basic (🔵) — basic document check. Verified (🔷) — full verification + initial audit. Trusted (✅) — regular audit + rating 4.5+. Premium (⭐) — Mystery Shopping + rating 4.8+ + Repeat Rate > 40%.',
        },
        {
          q: isRu ? 'Как получить 100% возврат средств?' : isTh ? 'จะได้รับเงินคืน 100% ได้อย่างไร?' : 'How do I get a 100% refund?',
          a: isRu 
            ? 'Если услуга не была оказана, свяжитесь с поддержкой через SOS-кнопку или раздел «Помощь». Мы рассмотрим заявку в течение 24 часов. Деньги хранятся на escrow-счёте до подтверждения оказания услуги.'
            : isTh 
            ? 'หากไม่ได้รับบริการ ติดต่อฝ่ายสนับสนุนผ่านปุ่ม SOS หรือส่วน "ช่วยเหลือ" เราจะตรวจสอบคำขอภายใน 24 ชั่วโมง เงินจะถูกเก็บไว้ในบัญชี escrow จนกว่าจะยืนยันการให้บริการ'
            : 'If the service was not provided, contact support via SOS button or "Help" section. We will review your request within 24 hours. Money is held in escrow until service confirmation.',
        },
      ],
    },
    {
      title: isRu ? 'Для собственников недвижимости' : isTh ? 'สำหรับเจ้าของทรัพย์สิน' : 'For Property Owners',
      icon: Building2,
      items: [
        {
          q: isRu ? 'Как myUNO помогает владельцам зарубежной недвижимости?' : isTh ? 'myUNO ช่วยเจ้าของอสังหาริมทรัพย์ในต่างประเทศอย่างไร?' : 'How does myUNO help overseas property owners?',
          a: isRu 
            ? 'myUNO решает главные боли владельцев: единый кабинет управления, верифицированные партнёры для уборки/ремонта, прозрачная финансовая аналитика, команда на месте для оперативных задач, мультиязычная поддержка 24/7. Вы контролируете всё из приложения, даже находясь в другой стране.'
            : isTh 
            ? 'myUNO แก้ปัญหาหลักของเจ้าของ: แดชบอร์ดการจัดการเดียว, พันธมิตรที่ได้รับการยืนยันสำหรับทำความสะอาด/ซ่อมแซม, การวิเคราะห์ทางการเงินที่โปร่งใส, ทีมในพื้นที่สำหรับงานเร่งด่วน, การสนับสนุนหลายภาษา 24/7 คุณควบคุมทุกอย่างจากแอป แม้จะอยู่ในประเทศอื่น'
            : 'myUNO solves main owner pains: unified management dashboard, verified partners for cleaning/repairs, transparent financial analytics, on-site team for urgent tasks, multilingual 24/7 support. You control everything from the app, even while in another country.',
        },
        {
          q: isRu ? 'Как организовать уборку квартиры, если я не в Таиланде?' : isTh ? 'จะจัดการทำความสะอาดอพาร์ตเมนต์ได้อย่างไรถ้าฉันไม่ได้อยู่ในประเทศไทย?' : 'How do I organize apartment cleaning if I\'m not in Thailand?',
          a: isRu 
            ? 'Через myUNO вы можете заказать регулярную или разовую уборку с любой точки мира. Все клининг-партнёры проверены G-Trust. Вы получите фото-отчёт после уборки. Команда UNO Team может проконтролировать качество на месте.'
            : isTh 
            ? 'ผ่าน myUNO คุณสามารถสั่งทำความสะอาดประจำหรือครั้งเดียวจากที่ไหนก็ได้ในโลก พันธมิตรทำความสะอาดทั้งหมดได้รับการตรวจสอบ G-Trust คุณจะได้รับรายงานรูปถ่ายหลังทำความสะอาด ทีม UNO Team สามารถตรวจสอบคุณภาพในพื้นที่ได้'
            : 'Through myUNO you can order regular or one-time cleaning from anywhere in the world. All cleaning partners are G-Trust verified. You\'ll receive a photo report after cleaning. UNO Team can verify quality on-site.',
        },
        {
          q: isRu ? 'Можно ли сдавать недвижимость через myUNO?' : isTh ? 'สามารถให้เช่าอสังหาริมทรัพย์ผ่าน myUNO ได้หรือไม่?' : 'Can I rent out property through myUNO?',
          a: isRu 
            ? 'Да! Мы предлагаем полный цикл: размещение объекта, синхронизация с Airbnb/Booking, управление бронированиями, проверенные гости через G-Trust, встреча гостей, уборка между заездами, финансовая отчётность.'
            : isTh 
            ? 'ได้! เรานำเสนอวงจรเต็ม: ลงรายการทรัพย์สิน, ซิงค์กับ Airbnb/Booking, จัดการการจอง, แขกที่ได้รับการตรวจสอบผ่าน G-Trust, ต้อนรับแขก, ทำความสะอาดระหว่างการเข้าพัก, รายงานทางการเงิน'
            : 'Yes! We offer a full cycle: listing your property, sync with Airbnb/Booking, booking management, verified guests via G-Trust, guest greeting, cleaning between stays, financial reporting.',
        },
        {
          q: isRu ? 'Как защищена моя недвижимость?' : isTh ? 'ทรัพย์สินของฉันได้รับการคุ้มครองอย่างไร?' : 'How is my property protected?',
          a: isRu 
            ? 'G-Trust обеспечивает: проверку всех гостей через паспорт и контактные данные, страхование от повреждений до $10,000, гарантированные выплаты в течение 24 часов после заезда, быстрое решение споров за 48 часов.'
            : isTh 
            ? 'G-Trust ให้การ: ตรวจสอบแขกทุกคนผ่านพาสปอร์ตและข้อมูลติดต่อ, ประกันความเสียหายสูงสุด $10,000, รับประกันการจ่ายเงินภายใน 24 ชั่วโมงหลังเช็คอิน, การแก้ไขข้อพิพาทรวดเร็วภายใน 48 ชั่วโมง'
            : 'G-Trust provides: verification of all guests via passport and contact details, damage insurance up to $10,000, guaranteed payouts within 24 hours after check-in, fast dispute resolution within 48 hours.',
        },
      ],
    },
    {
      title: isRu ? 'Оффлайн поддержка' : isTh ? 'การสนับสนุนออฟไลน์' : 'Offline Support',
      icon: Users2,
      items: [
        {
          q: isRu ? 'Что такое UNO Team?' : isTh ? 'UNO Team คืออะไร?' : 'What is UNO Team?',
          a: isRu 
            ? 'UNO Team — это наша команда на местах в Таиланде. Они обеспечивают оффлайн-поддержку: физическая проверка партнёров, SOS-выезд при экстренных ситуациях, личное сопровождение VIP-клиентов, контроль качества услуг, помощь с документами.'
            : isTh 
            ? 'UNO Team คือทีมของเราในพื้นที่ในประเทศไทย พวกเขาให้การสนับสนุนออฟไลน์: การตรวจสอบพันธมิตรทางกายภาพ, SOS ออกบริการในสถานการณ์ฉุกเฉิน, การดูแลส่วนตัวสำหรับลูกค้า VIP, การควบคุมคุณภาพบริการ, ช่วยเหลือเรื่องเอกสาร'
            : 'UNO Team is our on-the-ground team in Thailand. They provide offline support: physical partner verification, SOS dispatch in emergencies, personal VIP client assistance, service quality control, document assistance.',
        },
        {
          q: isRu ? 'Как работает SOS-кнопка?' : isTh ? 'ปุ่ม SOS ทำงานอย่างไร?' : 'How does the SOS button work?',
          a: isRu 
            ? 'SOS-кнопка доступна 24/7 для экстренных ситуаций: спустило колесо, потерялись документы, нужна срочная медицинская помощь. Наша команда отреагирует в течение 15 минут и организует необходимую помощь.'
            : isTh 
            ? 'ปุ่ม SOS พร้อมใช้งาน 24/7 สำหรับสถานการณ์ฉุกเฉิน: ยางแบน, เอกสารหาย, ต้องการความช่วยเหลือทางการแพทย์เร่งด่วน ทีมของเราจะตอบกลับภายใน 15 นาทีและจัดการความช่วยเหลือที่จำเป็น'
            : 'SOS button is available 24/7 for emergencies: flat tire, lost documents, urgent medical assistance needed. Our team will respond within 15 minutes and organize necessary help.',
        },
        {
          q: isRu ? 'Можно ли получить персонального менеджера?' : isTh ? 'สามารถรับผู้จัดการส่วนตัวได้หรือไม่?' : 'Can I get a personal manager?',
          a: isRu 
            ? 'Да, для VIP-клиентов и владельцев недвижимости доступен персональный менеджер, который координирует все задачи: от организации уборки до сопровождения сделок с недвижимостью.'
            : isTh 
            ? 'ได้ สำหรับลูกค้า VIP และเจ้าของทรัพย์สินมีผู้จัดการส่วนตัวที่ประสานงานทุกงาน: ตั้งแต่การจัดการทำความสะอาดไปจนถึงการดูแลธุรกรรมอสังหาริมทรัพย์'
            : 'Yes, for VIP clients and property owners a personal manager is available who coordinates all tasks: from organizing cleaning to accompanying real estate transactions.',
        },
      ],
    },
    {
      title: isRu ? 'Бронирование' : isTh ? 'การจอง' : 'Booking',
      icon: CreditCard,
      items: [
        {
          q: isRu ? 'Как забронировать услугу?' : isTh ? 'จะจองบริการได้อย่างไร?' : 'How do I book a service?',
          a: isRu 
            ? 'Выберите категорию, найдите нужный сервис, выберите дату и время, заполните контактные данные и подтвердите бронирование. Оплата возможна онлайн или на месте.'
            : isTh 
            ? 'เลือกหมวดหมู่ ค้นหาบริการที่ต้องการ เลือกวันและเวลา กรอกข้อมูลติดต่อ และยืนยันการจอง ชำระเงินได้ทั้งออนไลน์หรือที่สถานที่'
            : 'Select a category, find the service you need, choose a date and time, fill in your contact details and confirm the booking. Payment is possible online or on-site.',
        },
        {
          q: isRu ? 'Можно ли отменить бронирование?' : isTh ? 'สามารถยกเลิกการจองได้หรือไม่?' : 'Can I cancel a booking?',
          a: isRu 
            ? 'Да, бронирование можно отменить в разделе «Мои бронирования». Условия отмены зависят от политики конкретного партнёра.'
            : isTh 
            ? 'ได้ คุณสามารถยกเลิกการจองในส่วน "การจองของฉัน" เงื่อนไขการยกเลิกขึ้นอยู่กับนโยบายของพันธมิตรแต่ละราย'
            : 'Yes, you can cancel a booking in the "My Bookings" section. Cancellation terms depend on the specific partner policy.',
        },
        {
          q: isRu ? 'Какие способы оплаты доступны?' : isTh ? 'มีวิธีการชำระเงินใดบ้าง?' : 'What payment methods are available?',
          a: isRu 
            ? 'Мы принимаем банковские карты (Visa, Mastercard), наличные при получении услуги и оплату через myUNO Кошелёк (баланс с кэшбеком).'
            : isTh 
            ? 'เรารับบัตรธนาคาร (Visa, Mastercard), เงินสดเมื่อรับบริการ และการชำระเงินผ่าน myUNO Wallet (ยอดคงเหลือพร้อมเงินคืน)'
            : 'We accept bank cards (Visa, Mastercard), cash upon service delivery and payment via myUNO Wallet (balance with cashback).',
        },
        {
          q: isRu ? 'Безопасна ли оплата?' : isTh ? 'การชำระเงินปลอดภัยหรือไม่?' : 'Is payment secure?',
          a: isRu 
            ? 'Да, все платежи защищены системой G-Trust. Деньги хранятся на escrow-счёте и переводятся партнёру только после подтверждения оказания услуги.'
            : isTh 
            ? 'ใช่ การชำระเงินทั้งหมดได้รับการคุ้มครองโดยระบบ G-Trust เงินจะถูกเก็บไว้ในบัญชี escrow และจะถูกโอนให้พันธมิตรหลังจากยืนยันการให้บริการเท่านั้น'
            : 'Yes, all payments are protected by the G-Trust system. Money is held in escrow and transferred to the partner only after service confirmation.',
        },
      ],
    },
    {
      title: isRu ? 'Безопасность и приватность' : isTh ? 'ความปลอดภัยและความเป็นส่วนตัว' : 'Security & Privacy',
      icon: Lock,
      items: [
        {
          q: isRu ? 'Как защищены мои данные?' : isTh ? 'ข้อมูลของฉันได้รับการคุ้มครองอย่างไร?' : 'How is my data protected?',
          a: isRu 
            ? 'myUNO соответствует требованиям PDPA (Thailand Personal Data Protection Act). Мы используем шифрование данных, безопасные серверы и не передаём ваши данные третьим лицам без вашего согласия.'
            : isTh 
            ? 'myUNO ปฏิบัติตามข้อกำหนด PDPA (พระราชบัญญัติคุ้มครองข้อมูลส่วนบุคคลของประเทศไทย) เราใช้การเข้ารหัสข้อมูล, เซิร์ฟเวอร์ที่ปลอดภัย และไม่ส่งต่อข้อมูลของคุณให้บุคคลที่สามโดยไม่ได้รับความยินยอมจากคุณ'
            : 'myUNO complies with PDPA (Thailand Personal Data Protection Act). We use data encryption, secure servers and do not share your data with third parties without your consent.',
        },
        {
          q: isRu ? 'Что делать в экстренной ситуации?' : isTh ? 'จะทำอย่างไรในสถานการณ์ฉุกเฉิน?' : 'What to do in an emergency?',
          a: isRu 
            ? 'Используйте SOS-кнопку в приложении — она работает 24/7. Наша команда отреагирует в течение 15 минут. Для критических ситуаций также звоните по номеру экстренных служб Таиланда: 1669 (медицина), 191 (полиция).'
            : isTh 
            ? 'ใช้ปุ่ม SOS ในแอป — ทำงาน 24/7 ทีมของเราจะตอบกลับภายใน 15 นาที สำหรับสถานการณ์วิกฤตยังสามารถโทรหาบริการฉุกเฉินของประเทศไทย: 1669 (การแพทย์), 191 (ตำรวจ)'
            : 'Use the SOS button in the app — it works 24/7. Our team will respond within 15 minutes. For critical situations also call Thailand emergency services: 1669 (medical), 191 (police).',
        },
      ],
    },
  ];

  return (
    <AppLayout>
      <PageContainer>
        <PageHeader 
          title={isRu ? 'Частые вопросы' : isTh ? 'คำถามที่พบบ่อย' : 'FAQ'} 
          showBack 
        />

        {/* Search hint */}
        <SectionCard className="flex items-center gap-3">
          <HelpCircle className="w-10 h-10 text-primary flex-shrink-0" />
          <div>
            <h2 className="font-semibold">{isRu ? 'Нужна помощь?' : isTh ? 'ต้องการความช่วยเหลือหรือไม่?' : 'Need Help?'}</h2>
            <p className="text-sm text-muted-foreground">
              {isRu 
                ? 'Найдите ответ ниже или свяжитесь с поддержкой 24/7'
                : isTh 
                ? 'ค้นหาคำตอบด้านล่างหรือติดต่อฝ่ายสนับสนุน 24/7'
                : 'Find your answer below or contact support 24/7'}
            </p>
          </div>
        </SectionCard>

        {/* Quick Links */}
        <div className="grid grid-cols-2 gap-3 my-4">
          <Button variant="outline" asChild className="h-auto py-3 flex-col gap-1">
            <Link to="/g-trust">
              <Shield className="w-5 h-5 text-amber-600" />
              <span className="text-xs">G-Trust</span>
            </Link>
          </Button>
          <Button variant="outline" asChild className="h-auto py-3 flex-col gap-1">
            <Link to="/partners">
              <Building2 className="w-5 h-5 text-blue-600" />
              <span className="text-xs">{isRu ? 'Партнёрам' : isTh ? 'สำหรับพันธมิตร' : 'For Partners'}</span>
            </Link>
          </Button>
        </div>

        {/* FAQ Sections */}
        {faqCategories.map((category, catIndex) => {
          const CategoryIcon = category.icon;
          return (
            <div key={catIndex}>
              <div className="flex items-center gap-2 mb-2 mt-4">
                <CategoryIcon className="w-4 h-4 text-primary" />
                <h3 className="font-semibold text-sm text-muted-foreground">
                  {category.title}
                </h3>
              </div>
              <SectionCard noPadding>
                <Accordion type="single" collapsible className="w-full">
                  {category.items.map((item, index) => (
                    <AccordionItem 
                      key={index} 
                      value={`${catIndex}-${index}`}
                      className="border-b last:border-b-0"
                    >
                      <AccordionTrigger className="px-4 text-left text-sm hover:no-underline">
                        {item.q}
                      </AccordionTrigger>
                      <AccordionContent className="px-4 pb-4 text-sm text-muted-foreground">
                        {item.a}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </SectionCard>
            </div>
          );
        })}

        {/* Contact Support */}
        <SectionCard className="text-center mt-6">
          <MessageCircle className="w-8 h-8 text-primary mx-auto mb-3" />
          <h3 className="font-semibold mb-1">
            {isRu ? 'Не нашли ответ?' : isTh ? 'ไม่พบคำตอบ?' : 'Didn\'t find an answer?'}
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
            {isRu ? 'Наша поддержка работает 24/7 на нескольких языках' : isTh ? 'ฝ่ายสนับสนุนของเราทำงาน 24/7 หลายภาษา' : 'Our support works 24/7 in multiple languages'}
          </p>
          <Button className="w-full" asChild>
            <Link to="/support">
              {isRu ? 'Написать в поддержку' : isTh ? 'ติดต่อฝ่ายสนับสนุน' : 'Contact Support'}
            </Link>
          </Button>
        </SectionCard>
      </PageContainer>
    </AppLayout>
  );
}
