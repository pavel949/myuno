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
  MapPin, Phone, Mail, TrendingUp, Zap, Clock, Star
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

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
        ? 'Объединяем туристов, экспатов, владельцев недвижимости и местных предпринимателей в единую экосистему.'
        : isTh 
        ? 'เชื่อมต่อนักท่องเที่ยว ชาวต่างชาติ เจ้าของทรัพย์สิน และผู้ประกอบการท้องถิ่นในระบบนิเวศเดียว'
        : 'Connecting tourists, expats, property owners and local entrepreneurs in a unified ecosystem.',
    },
    {
      icon: Globe,
      title: isRu ? 'Доступность' : isTh ? 'การเข้าถึง' : 'Accessibility',
      description: isRu 
        ? 'Все сервисы на русском, английском и тайском. Локальная поддержка понимает ваш контекст.'
        : isTh 
        ? 'บริการทั้งหมดเป็นภาษารัสเซีย อังกฤษ และไทย ฝ่ายสนับสนุนท้องถิ่นเข้าใจบริบทของคุณ'
        : 'All services in Russian, English and Thai. Local support understands your context.',
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

  // Ecosystem verticals
  const verticals = [
    { icon: Home, name: isRu ? 'Недвижимость' : isTh ? 'อสังหาริมทรัพย์' : 'Real Estate', color: 'from-teal-500 to-emerald-500' },
    { icon: Ship, name: isRu ? 'Яхты' : isTh ? 'เรือยอร์ช' : 'Yachts', color: 'from-cyan-500 to-blue-500' },
    { icon: Car, name: isRu ? 'Транспорт' : isTh ? 'ขนส่ง' : 'Transport', color: 'from-indigo-500 to-blue-500' },
    { icon: Compass, name: isRu ? 'Туры' : isTh ? 'ทัวร์' : 'Tours', color: 'from-amber-500 to-orange-500' },
    { icon: Waves, name: isRu ? 'Водный спорт' : isTh ? 'กีฬาทางน้ำ' : 'Water Sports', color: 'from-blue-500 to-cyan-500' },
    { icon: UtensilsCrossed, name: isRu ? 'Рестораны' : isTh ? 'ร้านอาหาร' : 'Restaurants', color: 'from-orange-500 to-red-500' },
    { icon: Sparkles, name: isRu ? 'Красота и СПА' : isTh ? 'ความงามและสปา' : 'Beauty & Spa', color: 'from-pink-500 to-purple-500' },
    { icon: Stethoscope, name: isRu ? 'Медицина' : isTh ? 'การแพทย์' : 'Medical', color: 'from-emerald-500 to-green-500' },
    { icon: Dumbbell, name: isRu ? 'Фитнес' : isTh ? 'ฟิตเนส' : 'Fitness', color: 'from-blue-500 to-cyan-500' },
    { icon: GraduationCap, name: isRu ? 'Образование' : isTh ? 'การศึกษา' : 'Education', color: 'from-yellow-500 to-orange-500' },
    { icon: Scale, name: isRu ? 'Бизнес-услуги' : isTh ? 'บริการธุรกิจ' : 'Business Services', color: 'from-indigo-500 to-blue-600' },
    { icon: Wrench, name: isRu ? 'Домашние услуги' : isTh ? 'บริการบ้าน' : 'Home Services', color: 'from-slate-500 to-zinc-600' },
    { icon: Flower2, name: isRu ? 'Цветы' : isTh ? 'ดอกไม้' : 'Flowers', color: 'from-rose-500 to-pink-500' },
    { icon: ShoppingBag, name: isRu ? 'Маркетплейс' : isTh ? 'มาร์เก็ตเพลส' : 'Marketplace', color: 'from-amber-500 to-yellow-500' },
    { icon: Ticket, name: isRu ? 'События' : isTh ? 'กิจกรรม' : 'Events', color: 'from-purple-500 to-pink-500' },
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

  // User types
  const userTypes = [
    {
      icon: Compass,
      title: isRu ? 'Для туристов' : isTh ? 'สำหรับนักท่องเที่ยว' : 'For Tourists',
      description: isRu 
        ? 'Всё для отдыха в одном приложении: жильё, туры, транспорт, рестораны. Бронируйте за минуты.'
        : isTh 
        ? 'ทุกอย่างสำหรับการพักผ่อนในแอปเดียว: ที่พัก ทัวร์ ขนส่ง ร้านอาหาร จองได้ในไม่กี่นาที'
        : 'Everything for vacation in one app: housing, tours, transport, restaurants. Book in minutes.',
      features: [
        isRu ? 'Верифицированные партнёры' : isTh ? 'พันธมิตรที่ได้รับการยืนยัน' : 'Verified partners',
        isRu ? 'Кэшбек до 10%' : isTh ? 'คืนเงินสูงสุด 10%' : 'Up to 10% cashback',
        isRu ? 'SOS-кнопка 24/7' : isTh ? 'ปุ่ม SOS 24/7' : '24/7 SOS button',
      ],
    },
    {
      icon: Home,
      title: isRu ? 'Для экспатов' : isTh ? 'สำหรับชาวต่างชาติ' : 'For Expats',
      description: isRu 
        ? 'Инфраструктура для комфортной жизни: медицина, визы, образование, домашний сервис.'
        : isTh 
        ? 'โครงสร้างพื้นฐานสำหรับชีวิตที่สะดวกสบาย: การแพทย์ วีซ่า การศึกษา บริการบ้าน'
        : 'Infrastructure for comfortable life: medical, visas, education, home services.',
      features: [
        isRu ? 'Поддержка на русском' : isTh ? 'การสนับสนุนเป็นภาษารัสเซีย' : 'Russian support',
        isRu ? 'Проверенные специалисты' : isTh ? 'ผู้เชี่ยวชาญที่ได้รับการตรวจสอบ' : 'Verified specialists',
        isRu ? 'История бронирований' : isTh ? 'ประวัติการจอง' : 'Booking history',
      ],
    },
    {
      icon: Building2,
      title: isRu ? 'Для владельцев недвижимости' : isTh ? 'สำหรับเจ้าของทรัพย์สิน' : 'For Property Owners',
      description: isRu 
        ? 'Управляйте объектами, бронированиями и финансами в едином кабинете. Делегируйте уход.'
        : isTh 
        ? 'จัดการทรัพย์สิน การจอง และการเงินในแดชบอร์ดเดียว มอบหมายการดูแล'
        : 'Manage properties, bookings and finances in one dashboard. Delegate care.',
      features: [
        isRu ? 'Синхронизация с Airbnb' : isTh ? 'ซิงค์กับ Airbnb' : 'Airbnb sync',
        isRu ? 'Управление командой' : isTh ? 'การจัดการทีม' : 'Team management',
        isRu ? 'Аналитика и отчёты' : isTh ? 'การวิเคราะห์และรายงาน' : 'Analytics & reports',
      ],
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

        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <SectionCard className="text-center bg-gradient-to-br from-primary/10 via-background to-accent/10 border-primary/20">
            <div className="w-20 h-20 mx-auto mb-6 rounded-3xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shadow-lg">
              <Target className="w-10 h-10 text-primary-foreground" />
            </div>
            <h1 className="text-2xl md:text-3xl font-display font-bold mb-4 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              {isRu ? 'UNO — Дом там, где UNO' : isTh ? 'UNO — บ้านอยู่ที่ไหน UNO อยู่ที่นั่น' : 'UNO — Home is where UNO is'}
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-6">
              {isRu 
                ? 'Единая экосистема из 15+ категорий сервисов для комфортной жизни за рубежом. Всё проверено, прозрачно и удобно.'
                : isTh 
                ? 'ระบบนิเวศเดียวที่มี 15+ หมวดหมู่บริการสำหรับชีวิตที่สะดวกสบายในต่างประเทศ ทุกอย่างได้รับการตรวจสอบ โปร่งใส และสะดวก'
                : 'A unified ecosystem of 15+ service categories for comfortable life abroad. Everything verified, transparent and convenient.'}
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <Button onClick={() => navigate('/')} className="gap-2">
                {isRu ? 'Начать' : isTh ? 'เริ่มต้น' : 'Get Started'}
                <ArrowRight className="w-4 h-4" />
              </Button>
              <Button variant="outline" onClick={() => navigate('/partners')}>
                {isRu ? 'Стать партнёром' : isTh ? 'เป็นพันธมิตร' : 'Become a Partner'}
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

        {/* Mission */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <SectionCard>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <Award className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h2 className="text-lg font-semibold">{isRu ? 'Наша миссия' : isTh ? 'ภารกิจของเรา' : 'Our Mission'}</h2>
                <p className="text-sm text-muted-foreground">
                  {isRu ? 'Быть рядом, когда вы далеко от дома' : isTh ? 'อยู่เคียงข้างคุณเมื่อคุณอยู่ห่างบ้าน' : 'Be there when you\'re far from home'}
                </p>
              </div>
            </div>
            <p className="text-muted-foreground mb-4">
              {isRu 
                ? 'Мы создаём инфраструктуру доверия для русскоязычного сообщества в Таиланде. UNO — это не просто приложение, это экосистема, которая объединяет все аспекты жизни: от поиска жилья до юридических услуг, от бронирования яхты до вызова сантехника. Каждый партнёр проходит верификацию, каждая транзакция защищена.'
                : isTh 
                ? 'เราสร้างโครงสร้างพื้นฐานความไว้วางใจสำหรับชุมชนที่พูดภาษารัสเซียในประเทศไทย UNO ไม่ใช่แค่แอป แต่เป็นระบบนิเวศที่รวมทุกแง่มุมของชีวิต: จากการหาที่พักไปจนถึงบริการทางกฎหมาย จากการจองเรือยอร์ชไปจนถึงการเรียกช่างประปา พันธมิตรทุกรายได้รับการตรวจสอบ ทุกธุรกรรมได้รับการคุ้มครอง'
                : 'We build a trust infrastructure for the Russian-speaking community in Thailand. UNO is not just an app, it\'s an ecosystem that unites all aspects of life: from finding housing to legal services, from booking a yacht to calling a plumber. Every partner is verified, every transaction is protected.'}
            </p>
            <div className="p-4 rounded-xl bg-muted/50 border border-border/50">
              <p className="text-sm italic text-muted-foreground">
                🇹🇭 {isRu 
                  ? 'Сегодня — Пхукет. Завтра — весь Таиланд. Наша цель — стать главной платформой для экспатов и туристов в Юго-Восточной Азии.'
                  : isTh 
                  ? 'วันนี้ — ภูเก็ต พรุ่งนี้ — ทั่วประเทศไทย เป้าหมายของเราคือการเป็นแพลตฟอร์มหลักสำหรับชาวต่างชาติและนักท่องเที่ยวในเอเชียตะวันออกเฉียงใต้'
                  : 'Today — Phuket. Tomorrow — all of Thailand. Our goal is to become the main platform for expats and tourists in Southeast Asia.'}
              </p>
            </div>
          </SectionCard>
        </motion.div>

        {/* User Types */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <h2 className="text-lg font-semibold mb-4">{isRu ? 'Для кого UNO?' : isTh ? 'UNO สำหรับใคร?' : 'Who is UNO for?'}</h2>
          <div className="space-y-4">
            {userTypes.map((type, index) => {
              const Icon = type.icon;
              return (
                <SectionCard key={index} className="relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-primary/5 to-transparent rounded-bl-full" />
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                      <Icon className="w-6 h-6 text-primary" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold mb-1">{type.title}</h3>
                      <p className="text-sm text-muted-foreground mb-3">{type.description}</p>
                      <div className="flex flex-wrap gap-2">
                        {type.features.map((feature, i) => (
                          <span key={i} className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-primary/10 text-xs text-primary">
                            <CheckCircle2 className="w-3 h-3" />
                            {feature}
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

        {/* Ecosystem Verticals */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
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
          transition={{ duration: 0.5, delay: 0.5 }}
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
          transition={{ duration: 0.5, delay: 0.6 }}
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
          transition={{ duration: 0.5, delay: 0.7 }}
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
                      ? 'border-green-500/30 bg-green-500/5'
                      : 'border-border bg-muted/30'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                      phase.status === 'current' 
                        ? 'bg-primary text-primary-foreground' 
                        : phase.status === 'completed'
                        ? 'bg-green-500 text-white'
                        : 'bg-muted text-muted-foreground'
                    }`}>
                      {phase.phase}
                    </span>
                    <h3 className="font-semibold text-sm">{phase.title}</h3>
                    {phase.status === 'completed' && (
                      <CheckCircle2 className="w-4 h-4 text-green-500 ml-auto" />
                    )}
                    {phase.status === 'current' && (
                      <Clock className="w-4 h-4 text-primary ml-auto" />
                    )}
                  </div>
                  <ul className="space-y-1">
                    {phase.items.map((item, i) => (
                      <li key={i} className="text-xs text-muted-foreground flex items-center gap-2">
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          phase.status === 'completed' ? 'bg-green-500' : 'bg-muted-foreground/50'
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
          transition={{ duration: 0.5, delay: 0.8 }}
        >
          <SectionCard className="text-center bg-gradient-to-br from-primary/10 to-accent/10 border-primary/20">
            <Star className="w-12 h-12 text-primary mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">
              {isRu ? 'Присоединяйтесь к UNO' : isTh ? 'เข้าร่วม UNO' : 'Join UNO'}
            </h2>
            <p className="text-sm text-muted-foreground mb-4">
              {isRu 
                ? 'Станьте частью экосистемы, которая меняет жизнь экспатов в Таиланде'
                : isTh 
                ? 'เป็นส่วนหนึ่งของระบบนิเวศที่เปลี่ยนชีวิตชาวต่างชาติในประเทศไทย'
                : 'Become part of the ecosystem that is changing expat life in Thailand'}
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
            <a href="tel:+66922407355" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors">
              <Phone className="w-4 h-4" />
              +66 92 240 7355
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