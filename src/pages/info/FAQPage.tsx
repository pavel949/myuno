import { useRef, useState } from 'react';
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
import { ArrowDown, HelpCircle, MessageCircle, Shield, Building2, Users2, CreditCard, Scale, GraduationCap, Heart, Lock, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Link } from 'react-router-dom';
import { APP_ROUTES } from '@/lib/config/routes';

export default function FAQPage() {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const isTh = language === 'th';
  const label = (en: string, ru: string, th: string) => isRu ? ru : isTh ? th : en;
  const [query, setQuery] = useState('');
  const searchInput = useRef<HTMLInputElement>(null);
  const pickQuery = (value: string) => {
    setQuery(value);
    searchInput.current?.focus();
  };

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
            ? 'В меню myUNO можно выбрать русский, английский или тайский язык.'
            : isTh 
            ? 'คุณสามารถเลือกภาษารัสเซีย อังกฤษ หรือไทยได้จากเมนู myUNO'
            : 'Choose Russian, English or Thai from the myUNO menu.',
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
          q: isRu ? 'Как запросить возврат средств?' : isTh ? 'ฉันจะขอเงินคืนได้อย่างไร?' : 'How do I request a refund?',
          a: isRu 
            ? 'Откройте бронирование и проверьте условия отмены. Если нужна помощь с возвратом, напишите в поддержку и укажите номер бронирования.'
            : isTh 
            ? 'เปิดการจองเพื่อตรวจสอบเงื่อนไขการยกเลิก หากต้องการความช่วยเหลือเรื่องเงินคืน โปรดแจ้งหมายเลขการจองแก่ฝ่ายสนับสนุน'
            : 'Open your booking and check its cancellation policy. If you need help with a refund, contact support with your booking reference.',
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
            ? 'Через myUNO вы можете заказать регулярную или разовую уборку с любой точки мира. Все клининг-партнёры проверены G-Trust. Вы получите фото-отчёт после уборки. Команда myUNO Team может проконтролировать качество на месте.'
            : isTh 
            ? 'ผ่าน myUNO คุณสามารถสั่งทำความสะอาดประจำหรือครั้งเดียวจากที่ไหนก็ได้ในโลก พันธมิตรทำความสะอาดทั้งหมดได้รับการตรวจสอบ G-Trust คุณจะได้รับรายงานรูปถ่ายหลังทำความสะอาด ทีม myUNO Team สามารถตรวจสอบคุณภาพในพื้นที่ได้'
            : 'Through myUNO you can order regular or one-time cleaning from anywhere in the world. All cleaning partners are G-Trust verified. You\'ll receive a photo report after cleaning. myUNO Team can verify quality on-site.',
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
            ? 'Порядок работы с ущербом, условия выплат и доступная защита указаны в договоре управления вашим объектом. Эти условия можно уточнить у команды myUNO.'
            : isTh 
            ? 'ดูขั้นตอนกรณีเกิดความเสียหาย เงื่อนไขการจ่ายเงิน และความคุ้มครองที่มีในสัญญาบริหารทรัพย์สิน หรือติดต่อทีม myUNO เพื่อสอบถาม'
            : 'Your property management agreement explains how damage is handled, when payouts are made, and what protection is available. Contact the myUNO team for details.',
        },
      ],
    },
    {
      title: isRu ? 'Оффлайн поддержка' : isTh ? 'การสนับสนุนออฟไลน์' : 'Offline Support',
      icon: Users2,
      items: [
        {
          q: isRu ? 'Что такое myUNO Team?' : isTh ? 'myUNO Team คืออะไร?' : 'What is myUNO Team?',
          a: isRu 
            ? 'myUNO Team — это наша команда на местах в Таиланде. Они обеспечивают оффлайн-поддержку: физическая проверка партнёров, SOS-выезд при экстренных ситуациях, личное сопровождение VIP-клиентов, контроль качества услуг, помощь с документами.'
            : isTh 
            ? 'myUNO Team คือทีมของเราในพื้นที่ในประเทศไทย พวกเขาให้การสนับสนุนออฟไลน์: การตรวจสอบพันธมิตรทางกายภาพ, SOS ออกบริการในสถานการณ์ฉุกเฉิน, การดูแลส่วนตัวสำหรับลูกค้า VIP, การควบคุมคุณภาพบริการ, ช่วยเหลือเรื่องเอกสาร'
            : 'myUNO Team is our on-the-ground team in Thailand. They provide offline support: physical partner verification, SOS dispatch in emergencies, personal VIP client assistance, service quality control, document assistance.',
        },
        {
          q: isRu ? 'Как работает SOS-кнопка?' : isTh ? 'ปุ่ม SOS ทำงานอย่างไร?' : 'How does the SOS button work?',
          a: isRu 
            ? 'Используйте контакты в разделе «Помощь» для вопросов по поездке. Если нужна экстренная помощь в Таиланде, звоните напрямую в экстренные службы.'
            : isTh 
            ? 'สำหรับคำถามเกี่ยวกับการเดินทาง โปรดใช้ช่องทางติดต่อในหน้าความช่วยเหลือ หากเกิดเหตุฉุกเฉินในประเทศไทย ให้โทรหาหน่วยฉุกเฉินโดยตรง'
            : 'Use the contact options in Help for trip assistance. For emergencies in Thailand, call emergency services directly.',
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
            ? 'Способы оплаты зависят от услуги. Доступные варианты появятся при оформлении заказа или в предложении.'
            : isTh 
            ? 'วิธีชำระเงินขึ้นอยู่กับบริการ ระบบจะแสดงตัวเลือกที่ใช้ได้ในขั้นตอนชำระเงินหรือในใบเสนอราคา'
            : 'Payment methods vary by service. The available options appear at checkout or in your quote.',
        },
        {
          q: isRu ? 'Где посмотреть условия оплаты?' : isTh ? 'ดูเงื่อนไขการชำระเงินได้ที่ไหน?' : 'Where can I check the payment terms?',
          a: isRu 
            ? 'Доступные способы оплаты и сумму к оплате можно проверить при оформлении заказа или в полученном предложении.'
            : isTh 
            ? 'ตรวจสอบวิธีชำระเงินที่ใช้ได้และยอดชำระในขั้นตอนชำระเงินหรือในใบเสนอราคาที่ได้รับ'
            : 'Check the available payment methods and amount due at checkout or in the quote you received.',
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
            ? 'В Политике конфиденциальности описано, как myUNO обрабатывает персональные данные и куда обратиться с вопросом о них.'
            : isTh 
            ? 'นโยบายความเป็นส่วนตัวอธิบายวิธีที่ myUNO จัดการข้อมูลส่วนบุคคลและช่องทางติดต่อเมื่อมีคำถามเกี่ยวกับข้อมูล'
            : 'The Privacy Policy explains how myUNO handles personal data and where to send a question about your data.',
        },
        {
          q: isRu ? 'Что делать в экстренной ситуации?' : isTh ? 'จะทำอย่างไรในสถานการณ์ฉุกเฉิน?' : 'What to do in an emergency?',
          a: isRu 
            ? 'В Таиланде звоните 1669 для экстренной медицинской помощи или 191 для вызова полиции.'
            : isTh 
            ? 'ในประเทศไทย โทร 1669 สำหรับการแพทย์ฉุกเฉิน หรือ 191 สำหรับตำรวจ'
            : 'In Thailand, call 1669 for emergency medical help or 191 for police.',
        },
      ],
    },
  ];

  const words = query.normalize('NFKC').toLocaleLowerCase().trim().split(/\s+/u).filter(Boolean);
  const isSearching = words.length > 0;
  const matchingCategories = faqCategories.map((category, categoryIndex) => ({
    ...category,
    categoryIndex,
    items: category.items.map((item, itemIndex) => ({ ...item, itemIndex })).filter(item => {
      if (!isSearching) return true;
      const searchableText = `${category.title} ${item.q} ${item.a}`.normalize('NFKC').toLocaleLowerCase();
      return words.every(word => searchableText.includes(word));
    }),
  })).filter(category => category.items.length > 0);
  const resultCount = matchingCategories.reduce((sum, category) => sum + category.items.length, 0);
  const commonSearches = [
    { title: label('Refund', 'Возврат', 'เงินคืน'), query: label('refund', 'возврат', 'เงินคืน') },
    { title: label('Cancellation', 'Отмена', 'การยกเลิก'), query: label('cancel', 'отмен', 'การยกเลิก') },
    { title: label('Payment', 'Оплата', 'ชำระเงิน'), query: label('payment', 'оплат', 'ชำระเงิน') },
  ];

  return (
    <AppLayout usePageContainer={false}>
      <PageContainer className="max-w-4xl">
        <PageHeader 
          title={label('Help centre', 'Центр помощи', 'ศูนย์ช่วยเหลือ')}
          showBack 
        />

        <SectionCard className="space-y-2">
          <label className="font-medium" htmlFor="help-search">
            {label('Search help', 'Поиск по центру помощи', 'ค้นหาความช่วยเหลือ')}
          </label>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-3 h-5 w-5 text-muted-foreground" aria-hidden="true" />
            <Input
              ref={searchInput}
              id="help-search"
              type="search"
              className="min-h-11 pl-10"
              placeholder={label('Try booking, payment or account', 'Например, бронирование или оплата', 'เช่น การจอง การชำระเงิน หรือบัญชี')}
              value={query}
              onChange={event => setQuery(event.currentTarget.value)}
              aria-controls="help-results"
            />
          </div>
          {!isSearching && (
            <div className="flex flex-wrap gap-2" role="group" aria-label={label('Common searches', 'Частые запросы', 'คำค้นหาที่ใช้บ่อย')}>
              {commonSearches.map(topic => (
                <Button key={topic.query} variant="outline" className="min-h-11" onClick={() => pickQuery(topic.query)}>
                  {topic.title}
                </Button>
              ))}
            </div>
          )}
          <p role="status" className="text-sm text-muted-foreground">
            {isSearching && label(
              `Answers found: ${resultCount}`,
              `Найдено ответов: ${resultCount}`,
              `พบคำตอบ ${resultCount} รายการ`,
            )}
          </p>
        </SectionCard>

        {!isSearching && (
          <nav aria-labelledby="help-topics" className="space-y-3">
            <h2 id="help-topics" className="font-semibold">
              {label('Browse by topic', 'Темы помощи', 'เรียกดูตามหัวข้อ')}
            </h2>
            <div className="grid gap-2 sm:grid-cols-2">
              {faqCategories.map((category, index) => {
                const Icon = category.icon;
                return (
                  <a key={category.title} href={`#help-topic-${index}`} className="ds-focus flex min-h-11 items-center gap-3 border border-border bg-card px-3 py-2 text-sm font-medium hover:bg-muted">
                    <Icon className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                    <span className="flex-1">{category.title}</span>
                    <ArrowDown className="h-4 w-4 shrink-0" aria-hidden="true" />
                  </a>
                );
              })}
            </div>
          </nav>
        )}

        {/* Quick Links */}
        <div className="grid grid-cols-2 gap-3 my-4">
          <Button variant="outline" asChild className="h-auto py-3 flex-col gap-1">
            <Link to="/g-trust">
              <Shield className="w-5 h-5 text-accent" />
              <span className="text-xs">G-Trust</span>
            </Link>
          </Button>
          <Button variant="outline" asChild className="h-auto py-3 flex-col gap-1">
            <Link to="/partners">
              <Building2 className="w-5 h-5 text-primary" />
              <span className="text-xs">{isRu ? 'Партнёрам' : isTh ? 'สำหรับพันธมิตร' : 'For Partners'}</span>
            </Link>
          </Button>
        </div>

        <div id="help-results" className="space-y-4">
        {resultCount === 0 && (
          <SectionCard className="space-y-2">
            <p>{label('No answers match your search.', 'Ответы по вашему запросу не найдены.', 'ไม่พบคำตอบที่ตรงกับการค้นหา')}</p>
            <Button variant="outline" onClick={() => pickQuery('')}>
              {label('Clear search', 'Очистить поиск', 'ล้างการค้นหา')}
            </Button>
          </SectionCard>
        )}
        {matchingCategories.map(({ categoryIndex, ...category }) => {
          const CategoryIcon = category.icon;
          return (
            <section key={categoryIndex} aria-labelledby={`help-topic-${categoryIndex}`}>
              <div className="mb-2 flex items-center gap-2">
                <CategoryIcon className="h-4 w-4 text-primary" aria-hidden="true" />
                <h2 id={`help-topic-${categoryIndex}`} className="scroll-mt-24 font-semibold">
                  {category.title}
                </h2>
              </div>
              <SectionCard noPadding>
                <Accordion type="single" collapsible className="w-full">
                  {category.items.map(item => (
                    <AccordionItem 
                      key={item.itemIndex}
                      value={String(item.itemIndex)}
                      className="border-b last:border-b-0"
                    >
                      <AccordionTrigger className="min-h-14 px-4 text-left font-sans text-sm leading-relaxed hover:no-underline">
                        {item.q}
                      </AccordionTrigger>
                      <AccordionContent className="px-4 pb-4 text-sm text-muted-foreground">
                        {item.a}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </SectionCard>
            </section>
          );
        })}
        </div>

        {/* Contact Support */}
        <SectionCard className="text-center mt-6">
          <MessageCircle className="mx-auto mb-3 h-8 w-8 text-primary" aria-hidden="true" />
          <h2 className="mb-1 font-semibold">
            {label('Talk to the myUNO team', 'Свяжитесь с командой myUNO', 'ติดต่อทีม myUNO')}
          </h2>
          <p className="text-sm text-muted-foreground mb-4">
            {label('Send us a question about a booking, request or your account.', 'Напишите нам о бронировании, заявке или вашем аккаунте.', 'ส่งคำถามเกี่ยวกับการจอง คำขอ หรือบัญชีของคุณ')}
          </p>
          <Button className="w-full sm:w-auto" asChild>
            <Link to={APP_ROUTES.SUPPORT}>
              {isRu ? 'Написать в поддержку' : isTh ? 'ติดต่อฝ่ายสนับสนุน' : 'Contact Support'}
            </Link>
          </Button>
          <Button variant="link" className="w-full sm:w-auto" asChild>
            <Link to={APP_ROUTES.PRIVACY}>{label('Privacy Policy', 'Политика конфиденциальности', 'นโยบายความเป็นส่วนตัว')}</Link>
          </Button>
        </SectionCard>
      </PageContainer>
    </AppLayout>
  );
}
