import { AppLayout } from '@/components/layout/AppLayout';
import { PageContainer } from '@/components/uno/PageContainer';
import { PageHeader } from '@/components/uno/PageHeader';
import { SectionCard } from '@/components/uno/SectionCard';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { 
  Shield, Users, Globe, Heart, Award, Target, CheckCircle2, BadgeCheck, 
  ClipboardCheck, FileCheck, Home, Car, Compass, Waves, Sparkles, 
  UtensilsCrossed, Dumbbell, Stethoscope, GraduationCap, Ticket, 
  Flower2, ShoppingBag, Wrench, Scale, Ship, ArrowRight, Building2,
  MapPin, Phone, Mail, TrendingUp, Zap, Clock, Star, Laptop,
  PhoneCall, Users2, Briefcase, AlertTriangle, Hammer, LineChart,
  Headphones, MapPinned, Smartphone, HandshakeIcon
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { QuickInstallButton } from '@/components/pwa/QuickInstallButton';
import { COMPANY_CONTACTS, getTelLink } from '@/lib/config/contacts';

export default function AboutPage() {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const isRu = language === 'ru';
  const isTh = language === 'th';

  // Core values
  const values = [
    {
      icon: Shield,
      title: isRu ? 'Доверие' : isTh ? 'ความไว้วางใจ' : 'Trust',
      description: isRu 
        ? 'Каждый партнёр проходит многоуровневую верификацию G-Trust. 100% гарантия возврата средств при неоказании услуги.'
        : isTh 
        ? 'พันธมิตรทุกรายผ่านการตรวจสอบ G-Trust หลายระดับ รับประกันคืนเงิน 100% หากบริการไม่ได้รับ'
        : 'Every partner undergoes multi-level G-Trust verification. 100% money-back guarantee if service is not provided.',
    },
    {
      icon: Users,
      title: isRu ? 'Сообщество' : isTh ? 'ชุมชน' : 'Community',
      description: isRu 
        ? 'Объединяем путешественников, экспатов, владельцев недвижимости и местных предпринимателей в единую экосистему.'
        : isTh 
        ? 'เชื่อมต่อนักท่องเที่ยว ชาวต่างชาติ เจ้าของทรัพย์สิน และผู้ประกอบการท้องถิ่นในระบบนิเวศเดียว'
        : 'Connecting travelers, expats, property owners and local entrepreneurs in a unified ecosystem.',
    },
    {
      icon: Globe,
      title: isRu ? 'Доступность' : isTh ? 'การเข้าถึง' : 'Accessibility',
      description: isRu 
        ? 'Все сервисы на нескольких языках. Локальная поддержка понимает ваш контекст и культуру.'
        : isTh 
        ? 'บริการทั้งหมดหลายภาษา ฝ่ายสนับสนุนท้องถิ่นเข้าใจบริบทและวัฒนธรรมของคุณ'
        : 'All services in multiple languages. Local support understands your context and culture.',
    },
    {
      icon: Heart,
      title: isRu ? 'Забота' : isTh ? 'การดูแล' : 'Care',
      description: isRu 
        ? 'Поддержка 24/7, SOS-кнопка для экстренных ситуаций, персональный менеджер для VIP-клиентов.'
        : isTh 
        ? 'สนับสนุน 24/7 ปุ่ม SOS สำหรับสถานการณ์ฉุกเฉิน ผู้จัดการส่วนตัวสำหรับลูกค้า VIP'
        : '24/7 support, SOS button for emergencies, personal manager for VIP clients.',
    },
  ];

  // Statistics
  const stats = [
    { value: '500+', label: isRu ? 'Верифицированных партнёров' : isTh ? 'พันธมิตรที่ได้รับการยืนยัน' : 'Verified Partners' },
    { value: '50K+', label: isRu ? 'Активных пользователей' : isTh ? 'ผู้ใช้งานที่ใช้งานอยู่' : 'Active Users' },
    { value: '100K+', label: isRu ? 'Успешных бронирований' : isTh ? 'การจองที่สำเร็จ' : 'Successful Bookings' },
    { value: '15+', label: isRu ? 'Категорий услуг' : isTh ? 'หมวดหมู่บริการ' : 'Service Categories' },
  ];

  // What is myUNO - Three Pillars
  const infrastructurePillars = [
    {
      icon: Smartphone,
      title: isRu ? 'Цифровая платформа' : isTh ? 'แพลตฟอร์มดิจิทัล' : 'Digital Platform',
      features: isRu 
        ? ['15+ категорий сервисов', 'Онлайн бронирование 24/7', 'Управление объектами', 'Финансовая аналитика']
        : isTh 
        ? ['15+ หมวดหมู่บริการ', 'จองออนไลน์ 24/7', 'จัดการทรัพย์สิน', 'การวิเคราะห์ทางการเงิน']
        : ['15+ service categories', 'Online booking 24/7', 'Property management', 'Financial analytics'],
      color: 'from-blue-500 to-cyan-500'
    },
    {
      icon: Users2,
      title: isRu ? 'Оффлайн поддержка' : isTh ? 'การสนับสนุนออฟไลน์' : 'Offline Support',
      features: isRu 
        ? ['Команда на местах', 'SOS-выезд 24/7', 'Личная помощь', 'Решение задач вживую']
        : isTh 
        ? ['ทีมในท้องถิ่น', 'SOS ออกบริการ 24/7', 'ช่วยเหลือส่วนตัว', 'แก้ปัญหาด้วยตนเอง']
        : ['Local team on-site', 'SOS dispatch 24/7', 'Personal assistance', 'Real-world problem solving'],
      color: 'from-green-500 to-emerald-500'
    },
    {
      icon: HandshakeIcon,
      title: isRu ? 'Экспертная сеть' : isTh ? 'เครือข่ายผู้เชี่ยวชาญ' : 'Expert Network',
      features: isRu 
        ? ['500+ проверенных партнёров', 'Все проверены G-Trust', 'Многоязычная поддержка', 'Локальная экспертиза']
        : isTh 
        ? ['500+ พันธมิตรที่ได้รับการยืนยัน', 'ทุกคนผ่าน G-Trust', 'สนับสนุนหลายภาษา', 'ความเชี่ยวชาญท้องถิ่น']
        : ['500+ verified partners', 'All G-Trust certified', 'Multilingual support', 'Local expertise'],
      color: 'from-amber-500 to-orange-500'
    },
  ];

  // User segments (updated - no Russian-specific focus)
  const userSegments = [
    {
      icon: Compass,
      title: isRu ? 'Путешественники' : isTh ? 'นักเดินทาง' : 'Travelers',
      description: isRu 
        ? 'Краткосрочный визит в страну — отпуск, бизнес-поездка, транзит'
        : isTh 
        ? 'การเยือนระยะสั้น — วันหยุด, ธุรกิจ, การเดินทาง'
        : 'Short-term visits — vacation, business trip, transit',
      tasks: isRu 
        ? ['Жильё на отпуск', 'Туры и экскурсии', 'Трансфер из аэропорта', 'Рестораны и развлечения']
        : isTh 
        ? ['ที่พักวันหยุด', 'ทัวร์และทริป', 'รับส่งสนามบิน', 'ร้านอาหารและความบันเทิง']
        : ['Vacation rental', 'Tours & excursions', 'Airport transfer', 'Restaurants & entertainment'],
      color: 'bg-info/10 border-info/20',
      iconColor: 'text-info'
    },
    {
      icon: Home,
      title: isRu ? 'Резиденты и экспаты' : isTh ? 'ผู้อยู่อาศัยและชาวต่างชาติ' : 'Residents & Expats',
      description: isRu 
        ? 'Живут за рубежом постоянно или длительный срок'
        : isTh 
        ? 'อาศัยอยู่ต่างประเทศอย่างถาวรหรือระยะยาว'
        : 'Living abroad permanently or long-term',
      tasks: isRu 
        ? ['Медицина и клиники', 'Визовые услуги', 'Образование для детей', 'Бытовые услуги']
        : isTh 
        ? ['การแพทย์และคลินิก', 'บริการวีซ่า', 'การศึกษาสำหรับเด็ก', 'บริการบ้าน']
        : ['Medical care', 'Visa services', 'Kids education', 'Home services'],
      color: 'bg-success/10 border-success/20',
      iconColor: 'text-success'
    },
    {
      icon: Building2,
      title: isRu ? 'Владельцы недвижимости' : isTh ? 'เจ้าของทรัพย์สิน' : 'Property Owners',
      description: isRu 
        ? 'Объект за границей, сами там не живут — сложности с управлением'
        : isTh 
        ? 'ทรัพย์สินในต่างประเทศ ไม่ได้อาศัยอยู่ — ความยากลำบากในการจัดการ'
        : 'Property abroad, don\'t live there — management challenges',
      tasks: isRu 
        ? ['Управление арендой', 'Уборка и ремонт', 'Контроль расходов', 'Юридическое сопровождение']
        : isTh 
        ? ['การจัดการเช่า', 'ทำความสะอาดและซ่อมแซม', 'การควบคุมค่าใช้จ่าย', 'การสนับสนุนทางกฎหมาย']
        : ['Rental management', 'Cleaning & repairs', 'Expense control', 'Legal support'],
      color: 'bg-accent-purple/10 border-accent-purple/20',
      iconColor: 'text-accent-purple'
    },
    {
      icon: Laptop,
      title: isRu ? 'Digital Nomads' : isTh ? 'Digital Nomads' : 'Digital Nomads',
      description: isRu 
        ? 'Работают удалённо из разных стран мира'
        : isTh 
        ? 'ทำงานระยะไกลจากประเทศต่างๆ ทั่วโลก'
        : 'Working remotely from different countries',
      tasks: isRu 
        ? ['Коворкинги', 'Связь и интернет', 'Банкинг', 'Нетворкинг']
        : isTh 
        ? ['พื้นที่ทำงานร่วม', 'การเชื่อมต่อ', 'ธนาคาร', 'เครือข่าย']
        : ['Coworking spaces', 'Connectivity', 'Banking', 'Networking'],
      color: 'bg-accent-amber/10 border-accent-amber/20',
      iconColor: 'text-accent-amber'
    },
  ];

  // Task spectrum - from simple to complex
  const taskSpectrum = [
    {
      icon: Car,
      title: isRu ? 'Спустило колесо' : isTh ? 'ยางแบน' : 'Flat tire',
      time: isRu ? '30 мин' : isTh ? '30 นาที' : '30 min',
      description: isRu ? 'SOS-вызов помощи' : isTh ? 'เรียก SOS' : 'SOS call',
      complexity: 1
    },
    {
      icon: Flower2,
      title: isRu ? 'Доставка цветов' : isTh ? 'ส่งดอกไม้' : 'Flower delivery',
      time: isRu ? '2 часа' : isTh ? '2 ชั่วโมง' : '2 hours',
      description: isRu ? 'Выбор и доставка' : isTh ? 'เลือกและจัดส่ง' : 'Selection & delivery',
      complexity: 2
    },
    {
      icon: Sparkles,
      title: isRu ? 'Уборка квартиры' : isTh ? 'ทำความสะอาดอพาร์ตเมนต์' : 'Apartment cleaning',
      time: isRu ? '1 день' : isTh ? '1 วัน' : '1 day',
      description: isRu ? 'Регулярный сервис' : isTh ? 'บริการประจำ' : 'Regular service',
      complexity: 3
    },
    {
      icon: Hammer,
      title: isRu ? 'Ремонт и обслуживание' : isTh ? 'ซ่อมแซมและบำรุงรักษา' : 'Repairs & maintenance',
      time: isRu ? '1-7 дней' : isTh ? '1-7 วัน' : '1-7 days',
      description: isRu ? 'Мелкий и капитальный' : isTh ? 'เล็กและใหญ่' : 'Minor and major',
      complexity: 4
    },
    {
      icon: Home,
      title: isRu ? 'Долгосрочная аренда' : isTh ? 'เช่าระยะยาว' : 'Long-term rental',
      time: isRu ? 'Сезон' : isTh ? 'ฤดูกาล' : 'Season',
      description: isRu ? 'Поиск и проверка' : isTh ? 'ค้นหาและตรวจสอบ' : 'Search & verification',
      complexity: 5
    },
    {
      icon: LineChart,
      title: isRu ? 'Инвест. портфель' : isTh ? 'พอร์ตการลงทุน' : 'Investment portfolio',
      time: isRu ? 'Годы' : isTh ? 'ปี' : 'Years',
      description: isRu ? 'Консалтинг + управление' : isTh ? 'ที่ปรึกษา + การจัดการ' : 'Consulting + management',
      complexity: 6
    },
  ];

  // Property owner pain points
  const propertyOwnerPains = [
    { text: isRu ? 'Сложно найти надёжного управляющего' : isTh ? 'หาผู้จัดการที่เชื่อถือได้ยาก' : 'Hard to find reliable property manager' },
    { text: isRu ? 'Не понимаете особенности местного рынка' : isTh ? 'ไม่เข้าใจตลาดท้องถิ่น' : 'Don\'t understand local market specifics' },
    { text: isRu ? 'Языковой барьер с подрядчиками' : isTh ? 'อุปสรรคด้านภาษากับผู้รับเหมา' : 'Language barrier with contractors' },
    { text: isRu ? 'Нет контроля, когда вы далеко' : isTh ? 'ไม่มีการควบคุมเมื่อคุณอยู่ไกล' : 'No control when you\'re far away' },
    { text: isRu ? 'Непрозрачные расходы и комиссии' : isTh ? 'ค่าใช้จ่ายและค่าคอมมิชชั่นไม่โปร่งใส' : 'Opaque expenses and commissions' },
  ];

  const propertyOwnerSolutions = [
    { text: isRu ? 'Верифицированные партнёры (G-Trust)' : isTh ? 'พันธมิตรที่ได้รับการยืนยัน (G-Trust)' : 'Verified partners (G-Trust)' },
    { text: isRu ? 'Единый кабинет управления' : isTh ? 'แดชบอร์ดการจัดการเดียว' : 'Unified management dashboard' },
    { text: isRu ? 'Прозрачная финансовая аналитика' : isTh ? 'การวิเคราะห์ทางการเงินที่โปร่งใส' : 'Transparent financial analytics' },
    { text: isRu ? 'Команда на месте для оперативных задач' : isTh ? 'ทีมในพื้นที่สำหรับงานเร่งด่วน' : 'On-site team for urgent tasks' },
    { text: isRu ? 'Мультиязычная поддержка 24/7' : isTh ? 'สนับสนุนหลายภาษา 24/7' : 'Multilingual support 24/7' },
  ];

  // Ecosystem verticals
  const verticals = [
    { icon: Home, name: isRu ? 'Недвижимость' : isTh ? 'อสังหาริมทรัพย์' : 'Real Estate', color: 'from-accent-teal to-success' },
    { icon: Ship, name: isRu ? 'Яхты' : isTh ? 'เรือยอร์ช' : 'Yachts', color: 'from-accent-cyan to-info' },
    { icon: Car, name: isRu ? 'Транспорт' : isTh ? 'ขนส่ง' : 'Transport', color: 'from-primary to-info' },
    { icon: Compass, name: isRu ? 'Туры' : isTh ? 'ทัวร์' : 'Tours', color: 'from-accent-amber to-warning' },
    { icon: Waves, name: isRu ? 'Водный спорт' : isTh ? 'กีฬาทางน้ำ' : 'Water Sports', color: 'from-info to-accent-cyan' },
    { icon: UtensilsCrossed, name: isRu ? 'Рестораны' : isTh ? 'ร้านอาหาร' : 'Restaurants', color: 'from-warning to-destructive' },
    { icon: Sparkles, name: isRu ? 'Красота и СПА' : isTh ? 'ความงามและสปา' : 'Beauty & Spa', color: 'from-accent-purple to-primary' },
    { icon: Stethoscope, name: isRu ? 'Медицина' : isTh ? 'การแพทย์' : 'Medical', color: 'from-success to-accent-teal' },
    { icon: Dumbbell, name: isRu ? 'Фитнес' : isTh ? 'ฟิตเนส' : 'Fitness', color: 'from-info to-accent-cyan' },
    { icon: GraduationCap, name: isRu ? 'Образование' : isTh ? 'การศึกษา' : 'Education', color: 'from-warning to-accent-amber' },
    { icon: Scale, name: isRu ? 'Бизнес-услуги' : isTh ? 'บริการธุรกิจ' : 'Business Services', color: 'from-primary to-info' },
    { icon: Wrench, name: isRu ? 'Домашние услуги' : isTh ? 'บริการบ้าน' : 'Home Services', color: 'from-muted-foreground to-secondary-foreground' },
    { icon: Flower2, name: isRu ? 'Цветы' : isTh ? 'ดอกไม้' : 'Flowers', color: 'from-destructive to-accent-purple' },
    { icon: ShoppingBag, name: isRu ? 'Маркетплейс' : isTh ? 'มาร์เก็ตเพลส' : 'Marketplace', color: 'from-accent-amber to-warning' },
    { icon: Ticket, name: isRu ? 'События' : isTh ? 'กิจกรรม' : 'Events', color: 'from-accent-purple to-primary' },
  ];

  // Verification system
  const verificationSteps = [
    {
      icon: ClipboardCheck,
      title: isRu ? 'Проверка документов' : isTh ? 'การตรวจสอบเอกสาร' : 'Document Verification',
      description: isRu 
        ? 'Лицензии, сертификаты, регистрация бизнеса, страховка'
        : isTh 
        ? 'ใบอนุญาต ใบรับรอง การจดทะเบียนธุรกิจ ประกันภัย'
        : 'Licenses, certificates, business registration, insurance',
    },
    {
      icon: BadgeCheck,
      title: isRu ? 'Оценка качества' : isTh ? 'การประเมินคุณภาพ' : 'Quality Assessment',
      description: isRu 
        ? 'Соответствие стандартам обслуживания и безопасности'
        : isTh 
        ? 'ความสอดคล้องกับมาตรฐานบริการและความปลอดภัย'
        : 'Compliance with service and safety standards',
    },
    {
      icon: FileCheck,
      title: isRu ? 'Физический аудит' : isTh ? 'การตรวจสอบทางกายภาพ' : 'Physical Audit',
      description: isRu 
        ? 'Проверка локации, оборудования, персонала'
        : isTh 
        ? 'การตรวจสอบสถานที่ อุปกรณ์ บุคลากร'
        : 'Location, equipment, personnel inspection',
    },
    {
      icon: CheckCircle2,
      title: isRu ? 'Постоянный мониторинг' : isTh ? 'การติดตามอย่างต่อเนื่อง' : 'Continuous Monitoring',
      description: isRu 
        ? 'Анализ отзывов, регулярные проверки, Trust Score'
        : isTh 
        ? 'การวิเคราะห์รีวิว การตรวจสอบปกติ Trust Score'
        : 'Review analysis, regular audits, Trust Score',
    },
  ];

  // Roadmap
  const roadmap = [
    {
      phase: '2024',
      title: isRu ? 'Запуск на Пхукете' : isTh ? 'เปิดตัวที่ภูเก็ต' : 'Phuket Launch',
      items: [
        isRu ? 'Базовые вертикали (жильё, транспорт, туры)' : isTh ? 'แนวดิ่งพื้นฐาน (ที่พัก ขนส่ง ทัวร์)' : 'Core verticals (housing, transport, tours)',
        isRu ? 'Система G-Trust' : isTh ? 'ระบบ G-Trust' : 'G-Trust system',
        isRu ? '500+ партнёров' : isTh ? '500+ พันธมิตร' : '500+ partners',
      ],
      status: 'completed',
    },
    {
      phase: '2025',
      title: isRu ? 'Расширение экосистемы' : isTh ? 'ขยายระบบนิเวศ' : 'Ecosystem Expansion',
      items: [
        isRu ? 'Полный набор из 15+ вертикалей' : isTh ? 'ชุดเต็ม 15+ แนวดิ่ง' : 'Full set of 15+ verticals',
        isRu ? 'Кабинет владельца недвижимости' : isTh ? 'แดชบอร์ดเจ้าของทรัพย์สิน' : 'Property owner dashboard',
        isRu ? 'UNO Team для координации' : isTh ? 'ทีม UNO สำหรับการประสานงาน' : 'UNO Team for coordination',
      ],
      status: 'current',
    },
    {
      phase: '2026',
      title: isRu ? 'Масштабирование' : isTh ? 'การขยายขนาด' : 'Scaling',
      items: [
        isRu ? 'Бангкок, Паттайя, Самуи' : isTh ? 'กรุงเทพฯ พัทยา สมุย' : 'Bangkok, Pattaya, Samui',
        isRu ? 'AI-рекомендации' : isTh ? 'คำแนะนำ AI' : 'AI recommendations',
        isRu ? 'Финансовые сервисы' : isTh ? 'บริการทางการเงิน' : 'Financial services',
      ],
      status: 'upcoming',
    },
  ];

  return (
    <AppLayout>
      <PageContainer>
        <PageHeader 
          title={isRu ? 'О нас' : isTh ? 'เกี่ยวกับเรา' : 'About Us'} 
          showBack 
        />

        {/* Hero Section - New Positioning */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <SectionCard className="text-center bg-gradient-to-br from-primary/10 via-background to-accent/10 border-primary/20">
            <div className="w-20 h-20 mx-auto mb-6 rounded-3xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shadow-lg">
              <Globe className="w-10 h-10 text-primary-foreground" />
            </div>
            <h1 className="text-2xl md:text-3xl font-display font-bold mb-4 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              {isRu ? 'Чувствуйте себя дома — где бы вы ни были' : isTh ? 'รู้สึกเหมือนอยู่บ้าน — ไม่ว่าคุณจะอยู่ที่ไหน' : 'Feel at Home — Wherever You Are'}
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-6">
              {isRu 
                ? 'Единая инфраструктура для жизни за рубежом. От бытовых задач до управления инвестициями — онлайн и оффлайн.'
                : isTh 
                ? 'โครงสร้างพื้นฐานเดียวสำหรับการใช้ชีวิตในต่างประเทศ จากงานประจำวันไปจนถึงการจัดการการลงทุน — ออนไลน์และออฟไลน์'
                : 'A unified infrastructure for living abroad. From everyday tasks to investment management — online and offline.'}
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <QuickInstallButton />
              <Button onClick={() => navigate('/')} variant="outline" className="gap-2">
                {isRu ? 'Начать' : isTh ? 'เริ่มต้น' : 'Get Started'}
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </SectionCard>
        </motion.div>

        {/* Stats */}
        <motion.div 
          className="grid grid-cols-2 md:grid-cols-4 gap-3"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          {stats.map((stat, index) => (
            <SectionCard key={index} className="text-center p-4">
              <div className="text-2xl md:text-3xl font-bold text-primary">{stat.value}</div>
              <div className="text-xs text-muted-foreground mt-1">{stat.label}</div>
            </SectionCard>
          ))}
        </motion.div>

        {/* What is myUNO - Three Pillars */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
        >
          <SectionCard>
            <div className="text-center mb-6">
              <h2 className="text-xl font-bold mb-2">
                {isRu ? 'Что такое myUNO?' : isTh ? 'myUNO คืออะไร?' : 'What is myUNO?'}
              </h2>
              <p className="text-muted-foreground">
                {isRu 
                  ? 'myUNO — это не просто приложение. Это инфраструктура для комфортной жизни за рубежом.'
                  : isTh 
                  ? 'myUNO ไม่ใช่แค่แอป มันคือโครงสร้างพื้นฐานสำหรับชีวิตที่สะดวกสบายในต่างประเทศ'
                  : 'myUNO is not just an app. It\'s an infrastructure for comfortable life abroad.'}
              </p>
            </div>
            <div className="grid md:grid-cols-3 gap-4">
              {infrastructurePillars.map((pillar, index) => {
                const Icon = pillar.icon;
                return (
                  <div key={index} className="p-4 rounded-xl border bg-card hover:shadow-md transition-shadow">
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${pillar.color} flex items-center justify-center mb-3`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="font-semibold mb-2">{pillar.title}</h3>
                    <ul className="space-y-1">
                      {pillar.features.map((feature, i) => (
                        <li key={i} className="text-xs text-muted-foreground flex items-center gap-1.5">
                          <CheckCircle2 className="w-3 h-3 text-success shrink-0" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </div>
          </SectionCard>
        </motion.div>

        {/* Who is myUNO for - User Segments */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <h2 className="text-lg font-semibold mb-4">{isRu ? 'Для кого myUNO?' : isTh ? 'myUNO สำหรับใคร?' : 'Who is myUNO for?'}</h2>
          <div className="grid md:grid-cols-2 gap-4">
            {userSegments.map((segment, index) => {
              const Icon = segment.icon;
              return (
                <SectionCard key={index} className={`${segment.color} border`}>
                  <div className="flex items-start gap-3">
                    <div className={`w-10 h-10 rounded-lg bg-background flex items-center justify-center shrink-0`}>
                      <Icon className={`w-5 h-5 ${segment.iconColor}`} />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold mb-1">{segment.title}</h3>
                      <p className="text-xs text-muted-foreground mb-2">{segment.description}</p>
                      <div className="flex flex-wrap gap-1">
                        {segment.tasks.map((task, i) => (
                          <span key={i} className="px-2 py-0.5 rounded-full bg-background text-[10px] text-muted-foreground">
                            {task}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </SectionCard>
              );
            })}
          </div>
        </motion.div>

        {/* Task Spectrum - Simple to Complex */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.25 }}
        >
          <SectionCard>
            <div className="flex items-center gap-2 mb-4">
              <Zap className="w-5 h-5 text-primary" />
              <h2 className="text-lg font-semibold">
                {isRu ? 'Задачи любого масштаба' : isTh ? 'งานทุกขนาด' : 'Tasks of Any Scale'}
              </h2>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              {isRu 
                ? 'От экстренной помощи на дороге до формирования инвестиционного портфеля — мы решаем задачи любой сложности.'
                : isTh 
                ? 'ตั้งแต่ความช่วยเหลือฉุกเฉินบนถนนไปจนถึงการสร้างพอร์ตการลงทุน — เราแก้ปัญหาทุกความซับซ้อน'
                : 'From roadside emergency assistance to building an investment portfolio — we solve tasks of any complexity.'}
            </p>
            
            {/* Complexity gradient */}
            <div className="relative mb-4">
              <div className="flex justify-between text-[10px] text-muted-foreground mb-2">
                <span>{isRu ? 'ПРОСТЫЕ' : isTh ? 'ง่าย' : 'SIMPLE'}</span>
                <span>{isRu ? 'СЛОЖНЫЕ' : isTh ? 'ซับซ้อน' : 'COMPLEX'}</span>
              </div>
              <div className="h-1.5 rounded-full bg-gradient-to-r from-success via-warning to-accent-purple" />
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
              {taskSpectrum.map((task, index) => {
                const Icon = task.icon;
                const bgOpacity = 10 + (task.complexity * 5);
                return (
                  <div 
                    key={index}
                    className="p-3 rounded-xl border bg-card hover:shadow-sm transition-shadow text-center"
                  >
                    <Icon className="w-6 h-6 mx-auto mb-2 text-primary" />
                    <h4 className="text-xs font-medium mb-0.5 line-clamp-1">{task.title}</h4>
                    <p className="text-[10px] text-muted-foreground mb-1">{task.description}</p>
                    <span className="inline-block px-2 py-0.5 rounded-full bg-primary/10 text-[10px] text-primary font-medium">
                      {task.time}
                    </span>
                  </div>
                );
              })}
            </div>
          </SectionCard>
        </motion.div>

        {/* Property Owner Pain Points */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <SectionCard className="bg-gradient-to-br from-accent-purple/5 to-accent-purple/10 border-accent-purple/20">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-accent-purple/20 flex items-center justify-center">
                <Building2 className="w-6 h-6 text-accent-purple" />
              </div>
              <div>
                <h2 className="text-lg font-semibold">
                  {isRu ? 'Владеете недвижимостью за рубежом?' : isTh ? 'เป็นเจ้าของอสังหาริมทรัพย์ในต่างประเทศ?' : 'Own property abroad?'}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {isRu ? 'Мы понимаем ваши сложности' : isTh ? 'เราเข้าใจความท้าทายของคุณ' : 'We understand your challenges'}
                </p>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              {/* Pain points */}
              <div className="p-4 rounded-xl bg-destructive/5 border border-destructive/20">
                <h3 className="font-medium text-sm mb-3 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-destructive" />
                  {isRu ? 'Знакомые проблемы?' : isTh ? 'ปัญหาที่คุ้นเคย?' : 'Familiar problems?'}
                </h3>
                <ul className="space-y-2">
                  {propertyOwnerPains.map((pain, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                      <span className="text-destructive mt-0.5">✗</span>
                      {pain.text}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Solutions */}
              <div className="p-4 rounded-xl bg-success/5 border border-success/20">
                <h3 className="font-medium text-sm mb-3 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-success" />
                  {isRu ? 'myUNO решает эти задачи' : isTh ? 'myUNO แก้ปัญหาเหล่านี้' : 'myUNO solves these'}
                </h3>
                <ul className="space-y-2">
                  {propertyOwnerSolutions.map((solution, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                      <span className="text-success mt-0.5">✓</span>
                      {solution.text}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <Button 
              variant="outline" 
              className="w-full mt-4 gap-2 border-accent-purple/30 hover:bg-accent-purple/10"
              onClick={() => navigate('/owner')}
            >
              <Home className="w-4 h-4" />
              {isRu ? 'Узнать о Property Care' : isTh ? 'เรียนรู้เกี่ยวกับ Property Care' : 'Learn about Property Care'}
            </Button>
          </SectionCard>
        </motion.div>

        {/* Ecosystem Verticals */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.35 }}
        >
          <SectionCard>
            <div className="flex items-center gap-2 mb-4">
              <Zap className="w-5 h-5 text-primary" />
              <h2 className="text-lg font-semibold">{isRu ? 'Экосистема из 15+ вертикалей' : isTh ? 'ระบบนิเวศ 15+ แนวดิ่ง' : 'Ecosystem of 15+ Verticals'}</h2>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              {isRu 
                ? 'Все сервисы для жизни в одном приложении. От аренды виллы до вызова врача на дом.'
                : isTh 
                ? 'บริการทั้งหมดสำหรับการใช้ชีวิตในแอปเดียว จากการเช่าวิลล่าไปจนถึงการเรียกแพทย์มาบ้าน'
                : 'All life services in one app. From villa rental to home doctor visits.'}
            </p>
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
              {verticals.map((vertical, index) => {
                const Icon = vertical.icon;
                return (
                  <div 
                    key={index}
                    className="flex flex-col items-center p-3 rounded-xl bg-muted/50 hover:bg-muted transition-colors cursor-pointer"
                  >
                    <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${vertical.color} flex items-center justify-center mb-2`}>
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                    <span className="text-[10px] text-center text-muted-foreground leading-tight">{vertical.name}</span>
                  </div>
                );
              })}
            </div>
          </SectionCard>
        </motion.div>

        {/* G-Trust Verification System */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <SectionCard className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
                <Shield className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h2 className="text-lg font-semibold">{isRu ? 'Система верификации G-Trust' : isTh ? 'ระบบตรวจสอบ G-Trust' : 'G-Trust Verification System'}</h2>
                <p className="text-sm text-muted-foreground">
                  {isRu ? '100% гарантия возврата средств' : isTh ? 'รับประกันคืนเงิน 100%' : '100% money-back guarantee'}
                </p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              {isRu 
                ? 'Каждый партнёр проходит многоступенчатую проверку. Мы гарантируем, что все сервисы на платформе соответствуют высочайшим требованиям.'
                : isTh 
                ? 'พันธมิตรทุกรายผ่านการตรวจสอบหลายขั้นตอน เรารับประกันว่าบริการทั้งหมดบนแพลตฟอร์มตรงตามมาตรฐานสูงสุด'
                : 'Every partner undergoes multi-stage verification. We guarantee that all services on the platform meet the highest standards.'}
            </p>
            <div className="grid grid-cols-2 gap-3 mb-4">
              {verificationSteps.map((step, index) => {
                const Icon = step.icon;
                return (
                  <div key={index} className="flex items-start gap-2 p-3 rounded-lg bg-background/50">
                    <Icon className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                    <div>
                      <h4 className="text-sm font-medium">{step.title}</h4>
                      <p className="text-[11px] text-muted-foreground">{step.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>
            <Button variant="outline" className="w-full gap-2" onClick={() => navigate('/g-trust')}>
              <BadgeCheck className="w-4 h-4" />
              {isRu ? 'Подробнее о G-Trust' : isTh ? 'เพิ่มเติมเกี่ยวกับ G-Trust' : 'Learn more about G-Trust'}
            </Button>
          </SectionCard>
        </motion.div>

        {/* Values */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.45 }}
        >
          <h2 className="text-lg font-semibold mb-4">{isRu ? 'Наши ценности' : isTh ? 'คุณค่าของเรา' : 'Our Values'}</h2>
          <div className="grid grid-cols-2 gap-3">
            {values.map((value, index) => {
              const Icon = value.icon;
              return (
                <SectionCard key={index} className="p-4">
                  <Icon className="w-8 h-8 text-primary mb-3" />
                  <h3 className="font-semibold mb-1">{value.title}</h3>
                  <p className="text-xs text-muted-foreground">{value.description}</p>
                </SectionCard>
              );
            })}
          </div>
        </motion.div>

        {/* Roadmap */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
        >
          <SectionCard>
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-5 h-5 text-primary" />
              <h2 className="text-lg font-semibold">{isRu ? 'Дорожная карта' : isTh ? 'แผนงาน' : 'Roadmap'}</h2>
            </div>
            <div className="space-y-4">
              {roadmap.map((phase, index) => (
                <div 
                  key={index}
                  className={`p-4 rounded-xl border ${
                    phase.status === 'current' 
                      ? 'border-primary bg-primary/5' 
                      : phase.status === 'completed'
                      ? 'border-success/30 bg-success/5'
                      : 'border-border bg-muted/30'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                      phase.status === 'current' 
                        ? 'bg-primary text-primary-foreground' 
                        : phase.status === 'completed'
                        ? 'bg-success text-success-foreground'
                        : 'bg-muted text-muted-foreground'
                    }`}>
                      {phase.phase}
                    </span>
                    <h3 className="font-semibold text-sm">{phase.title}</h3>
                    {phase.status === 'completed' && (
                      <CheckCircle2 className="w-4 h-4 text-success ml-auto" />
                    )}
                    {phase.status === 'current' && (
                      <Clock className="w-4 h-4 text-primary ml-auto" />
                    )}
                  </div>
                  <ul className="space-y-1">
                    {phase.items.map((item, i) => (
                      <li key={i} className="text-xs text-muted-foreground flex items-center gap-2">
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          phase.status === 'completed' ? 'bg-success' : 'bg-muted-foreground/50'
                        }`} />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </SectionCard>
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.55 }}
        >
          <SectionCard className="text-center bg-gradient-to-br from-primary/10 to-accent/10 border-primary/20">
            <Star className="w-12 h-12 text-primary mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">
              {isRu ? 'Присоединяйтесь к myUNO' : isTh ? 'เข้าร่วม myUNO' : 'Join myUNO'}
            </h2>
            <p className="text-sm text-muted-foreground mb-4">
              {isRu 
                ? 'Станьте частью экосистемы, которая делает жизнь за рубежом комфортной и безопасной'
                : isTh 
                ? 'เป็นส่วนหนึ่งของระบบนิเวศที่ทำให้ชีวิตในต่างประเทศสะดวกสบายและปลอดภัย'
                : 'Become part of the ecosystem that makes life abroad comfortable and safe'}
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <Button onClick={() => navigate('/')}>
                {isRu ? 'Исследовать сервисы' : isTh ? 'สำรวจบริการ' : 'Explore Services'}
              </Button>
              <Button variant="outline" onClick={() => navigate('/partners')}>
                {isRu ? 'Для бизнеса' : isTh ? 'สำหรับธุรกิจ' : 'For Business'}
              </Button>
            </div>
          </SectionCard>
        </motion.div>

        {/* Contact */}
        <SectionCard>
          <h2 className="font-semibold mb-3">{isRu ? 'Связаться с нами' : isTh ? 'ติดต่อเรา' : 'Contact Us'}</h2>
          <div className="space-y-2">
            <a href="mailto:assist@myuno.app" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors">
              <Mail className="w-4 h-4" />
              assist@myuno.app
            </a>
            <a href={getTelLink()} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors">
              <Phone className="w-4 h-4" />
              {COMPANY_CONTACTS.phone.display}
            </a>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="w-4 h-4" />
              Phuket, Thailand
            </div>
          </div>
        </SectionCard>
      </PageContainer>
    </AppLayout>
  );
}
