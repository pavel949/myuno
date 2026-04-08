import { AppLayout } from '@/components/layout/AppLayout';
import { PageContainer } from '@/components/uno/PageContainer';
import { PageHeader } from '@/components/uno/PageHeader';
import { SectionCard } from '@/components/uno/SectionCard';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { motion } from 'framer-motion';
import { 
  Search, Shield, CreditCard, Star, ArrowRight, CheckCircle2, 
  Smartphone, UserCircle, Calendar, MessageCircle, Wallet,
  Home, Building2, Ship, Users, Settings, BarChart3, Clock,
  Zap, Heart, BadgeCheck, Gift, Bell, MapPin
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function HowItWorksPage() {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const isRu = language === 'ru';
  const isTh = language === 'th';

  // Guest Journey Steps
  const guestSteps = [
    {
      icon: Search,
      number: '01',
      title: isRu ? 'Найдите сервис' : isTh ? 'ค้นหาบริการ' : 'Find a Service',
      description: isRu 
        ? 'Выберите категорию: жильё, транспорт, туры, медицина, рестораны или другие услуги. Используйте фильтры по цене, рейтингу и локации.'
        : isTh 
        ? 'เลือกหมวดหมู่: ที่พัก ขนส่ง ทัวร์ การแพทย์ ร้านอาหาร หรือบริการอื่นๆ ใช้ตัวกรองตามราคา คะแนน และสถานที่'
        : 'Choose a category: housing, transport, tours, medical, restaurants or other services. Use filters by price, rating and location.',
      tip: isRu ? 'Используйте поиск на главной для быстрого доступа' : isTh ? 'ใช้การค้นหาบนหน้าหลักเพื่อเข้าถึงอย่างรวดเร็ว' : 'Use the search on the main page for quick access',
    },
    {
      icon: Shield,
      number: '02',
      title: isRu ? 'Проверьте партнёра' : isTh ? 'ตรวจสอบพันธมิตร' : 'Check the Partner',
      description: isRu 
        ? 'Все партнёры проходят верификацию G-Trust. Читайте реальные отзывы, смотрите Trust Score и галерею фото. Значок ✓ означает полную проверку.'
        : isTh 
        ? 'พันธมิตรทุกรายผ่านการตรวจสอบ G-Trust อ่านรีวิวจริง ดู Trust Score และแกลเลอรีรูปภาพ เครื่องหมาย ✓ หมายถึงการตรวจสอบเต็มรูปแบบ'
        : 'All partners are G-Trust verified. Read real reviews, check Trust Score and photo gallery. The ✓ badge means full verification.',
      tip: isRu ? 'Trust Score выше 80% — отличный выбор' : isTh ? 'Trust Score สูงกว่า 80% — ตัวเลือกที่ยอดเยี่ยม' : 'Trust Score above 80% is an excellent choice',
    },
    {
      icon: Calendar,
      number: '03',
      title: isRu ? 'Забронируйте' : isTh ? 'จอง' : 'Book It',
      description: isRu 
        ? 'Выберите дату, время и опции. Заполните контактные данные. Подтвердите бронирование — всё занимает 2 минуты.'
        : isTh 
        ? 'เลือกวันที่ เวลา และตัวเลือก กรอกข้อมูลติดต่อ ยืนยันการจอง — ทั้งหมดใช้เวลา 2 นาที'
        : 'Select date, time and options. Fill in contact details. Confirm booking — it all takes 2 minutes.',
      tip: isRu ? 'Получите мгновенное подтверждение на email' : isTh ? 'รับการยืนยันทันทีทางอีเมล' : 'Get instant confirmation by email',
    },
    {
      icon: CreditCard,
      number: '04',
      title: isRu ? 'Оплатите удобно' : isTh ? 'ชำระเงินสะดวก' : 'Pay Conveniently',
      description: isRu 
        ? 'Выберите способ оплаты: карта (Visa, Mastercard), UNO Кошелёк с кэшбеком или наличные партнёру. Все платежи защищены escrow.'
        : isTh 
        ? 'เลือกวิธีชำระเงิน: บัตร (Visa, Mastercard) กระเป๋า UNO พร้อมเงินคืน หรือเงินสดให้พันธมิตร การชำระเงินทั้งหมดได้รับการคุ้มครอง escrow'
        : 'Choose payment method: card (Visa, Mastercard), UNO Wallet with cashback or cash to partner. All payments are escrow protected.',
      tip: isRu ? 'Кэшбек до 10% при оплате через UNO Кошелёк' : isTh ? 'เงินคืนสูงสุด 10% เมื่อชำระผ่านกระเป๋า UNO' : 'Up to 10% cashback with UNO Wallet payment',
    },
    {
      icon: Star,
      number: '05',
      title: isRu ? 'Получите услугу' : isTh ? 'รับบริการ' : 'Get the Service',
      description: isRu 
        ? 'Получите услугу в назначенное время. При любых проблемах — кнопка SOS для мгновенной поддержки. Оставьте отзыв и помогите сообществу.'
        : isTh 
        ? 'รับบริการตามเวลาที่นัดหมาย หากมีปัญหาใดๆ — ปุ่ม SOS สำหรับการสนับสนุนทันที เขียนรีวิวและช่วยเหลือชุมชน'
        : 'Receive service at the scheduled time. For any issues — SOS button for instant support. Leave a review and help the community.',
      tip: isRu ? 'Отзывы помогают улучшить экосистему' : isTh ? 'รีวิวช่วยปรับปรุงระบบนิเวศ' : 'Reviews help improve the ecosystem',
    },
  ];

  // Owner Journey Steps
  const ownerSteps = [
    {
      icon: Building2,
      number: '01',
      title: isRu ? 'Добавьте объект' : isTh ? 'เพิ่มทรัพย์สิน' : 'Add Property',
      description: isRu 
        ? 'Заполните информацию об объекте: фото, описание, удобства, цены. Загрузите документы для верификации.'
        : isTh 
        ? 'กรอกข้อมูลทรัพย์สิน: รูปภาพ คำอธิบาย สิ่งอำนวยความสะดวก ราคา อัปโหลดเอกสารสำหรับการตรวจสอบ'
        : 'Fill property information: photos, description, amenities, prices. Upload documents for verification.',
      tip: isRu ? 'Качественные фото увеличивают бронирования на 40%' : isTh ? 'รูปภาพคุณภาพเพิ่มการจอง 40%' : 'Quality photos increase bookings by 40%',
    },
    {
      icon: BadgeCheck,
      number: '02',
      title: isRu ? 'Пройдите верификацию' : isTh ? 'ผ่านการตรวจสอบ' : 'Get Verified',
      description: isRu 
        ? 'Наша команда проверит документы и объект. После верификации вы получите значок G-Trust и приоритет в поиске.'
        : isTh 
        ? 'ทีมของเราจะตรวจสอบเอกสารและทรัพย์สิน หลังการตรวจสอบ คุณจะได้รับเครื่องหมาย G-Trust และลำดับความสำคัญในการค้นหา'
        : 'Our team will verify documents and property. After verification you\'ll get G-Trust badge and search priority.',
      tip: isRu ? 'Верификация занимает 1-3 рабочих дня' : isTh ? 'การตรวจสอบใช้เวลา 1-3 วันทำการ' : 'Verification takes 1-3 business days',
    },
    {
      icon: Calendar,
      number: '03',
      title: isRu ? 'Настройте календарь' : isTh ? 'ตั้งค่าปฏิทิน' : 'Set Up Calendar',
      description: isRu 
        ? 'Синхронизируйте с Airbnb, Booking.com через iCal. Управляйте доступностью, ценами по сезонам и минимальным сроком.'
        : isTh 
        ? 'ซิงค์กับ Airbnb, Booking.com ผ่าน iCal จัดการความพร้อม ราคาตามฤดูกาล และระยะเวลาขั้นต่ำ'
        : 'Sync with Airbnb, Booking.com via iCal. Manage availability, seasonal prices and minimum stay.',
      tip: isRu ? 'Автоматическая синхронизация исключает двойные бронирования' : isTh ? 'การซิงค์อัตโนมัติป้องกันการจองซ้ำ' : 'Auto-sync prevents double bookings',
    },
    {
      icon: Users,
      number: '04',
      title: isRu ? 'Делегируйте задачи' : isTh ? 'มอบหมายงาน' : 'Delegate Tasks',
      description: isRu 
        ? 'Добавьте команду: управляющих, агентов, уборщиков. Настройте права доступа. Закажите услуги через экосистему UNO.'
        : isTh 
        ? 'เพิ่มทีม: ผู้จัดการ ตัวแทน พนักงานทำความสะอาด ตั้งค่าสิทธิ์การเข้าถึง สั่งบริการผ่านระบบนิเวศ UNO'
        : 'Add team: managers, agents, cleaners. Configure access rights. Order services through UNO ecosystem.',
      tip: isRu ? 'Заказывайте уборку прямо из карточки объекта' : isTh ? 'สั่งทำความสะอาดโดยตรงจากการ์ดทรัพย์สิน' : 'Order cleaning directly from property card',
    },
    {
      icon: BarChart3,
      number: '05',
      title: isRu ? 'Анализируйте и зарабатывайте' : isTh ? 'วิเคราะห์และทำเงิน' : 'Analyze & Earn',
      description: isRu 
        ? 'Отслеживайте доходы, заполняемость, отзывы в едином дашборде. Получайте выплаты на банковский счёт или криптокошелёк.'
        : isTh 
        ? 'ติดตามรายได้ อัตราการเข้าพัก รีวิวในแดชบอร์ดเดียว รับเงินโอนเข้าบัญชีธนาคารหรือกระเป๋าคริปโต'
        : 'Track income, occupancy, reviews in one dashboard. Receive payouts to bank account or crypto wallet.',
      tip: isRu ? 'Конкурентные условия — выгоднее Airbnb' : isTh ? 'เงื่อนไขการแข่งขัน — ดีกว่า Airbnb' : 'Competitive terms — better than Airbnb',
    },
  ];

  // Key benefits
  const benefits = [
    {
      icon: Shield,
      title: isRu ? 'Защита G-Trust' : isTh ? 'การคุ้มครอง G-Trust' : 'G-Trust Protection',
      description: isRu ? '100% возврат при проблемах' : isTh ? 'คืนเงิน 100% เมื่อมีปัญหา' : '100% refund for issues',
    },
    {
      icon: Wallet,
      title: isRu ? 'Кэшбек до 10%' : isTh ? 'เงินคืนสูงสุด 10%' : 'Up to 10% Cashback',
      description: isRu ? 'На каждое бронирование' : isTh ? 'สำหรับทุกการจอง' : 'On every booking',
    },
    {
      icon: MessageCircle,
      title: isRu ? 'Поддержка 24/7' : isTh ? 'สนับสนุน 24/7' : '24/7 Support',
      description: isRu ? 'На русском и английском' : isTh ? 'ภาษารัสเซียและอังกฤษ' : 'In Russian and English',
    },
    {
      icon: Zap,
      title: isRu ? 'SOS-кнопка' : isTh ? 'ปุ่ม SOS' : 'SOS Button',
      description: isRu ? 'Экстренная помощь' : isTh ? 'ความช่วยเหลือฉุกเฉิน' : 'Emergency assistance',
    },
    {
      icon: Gift,
      title: isRu ? 'Реферальная программа' : isTh ? 'โปรแกรมแนะนำ' : 'Referral Program',
      description: isRu ? 'Бонусы за приглашения' : isTh ? 'โบนัสสำหรับการเชิญ' : 'Bonuses for invitations',
    },
    {
      icon: Bell,
      title: isRu ? 'Умные уведомления' : isTh ? 'การแจ้งเตือนอัจฉริยะ' : 'Smart Notifications',
      description: isRu ? 'Статус бронирования в реальном времени' : isTh ? 'สถานะการจองแบบเรียลไทม์' : 'Real-time booking status',
    },
  ];

  // Quick start checklist
  const quickStart = [
    { 
      step: isRu ? 'Скачайте приложение или откройте сайт' : isTh ? 'ดาวน์โหลดแอปหรือเปิดเว็บไซต์' : 'Download app or open website',
      time: '1 min',
    },
    { 
      step: isRu ? 'Зарегистрируйтесь (email или телефон)' : isTh ? 'ลงทะเบียน (อีเมลหรือโทรศัพท์)' : 'Sign up (email or phone)',
      time: '30 sec',
    },
    { 
      step: isRu ? 'Выберите категорию услуг' : isTh ? 'เลือกหมวดหมู่บริการ' : 'Choose service category',
      time: '30 sec',
    },
    { 
      step: isRu ? 'Забронируйте первую услугу' : isTh ? 'จองบริการแรก' : 'Book your first service',
      time: '2 min',
    },
  ];

  return (
    <AppLayout>
      <PageContainer>
        <PageHeader 
          title={isRu ? 'Как это работает' : isTh ? 'มันทำงานอย่างไร' : 'How It Works'} 
          showBack 
        />

        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <SectionCard className="text-center bg-gradient-to-br from-primary/10 to-accent/10 border-primary/20">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
              <Smartphone className="w-8 h-8 text-primary-foreground" />
            </div>
            <h1 className="text-2xl font-display font-bold mb-3">
              {isRu ? 'Всё просто!' : isTh ? 'ง่ายมาก!' : 'It\'s Simple!'}
            </h1>
            <p className="text-muted-foreground max-w-lg mx-auto">
              {isRu 
                ? 'UNO объединяет 15+ категорий сервисов в одном приложении. Найдите, забронируйте и получите услугу за несколько минут — с гарантией качества и кэшбеком.'
                : isTh 
                ? 'UNO รวม 15+ หมวดหมู่บริการในแอปเดียว ค้นหา จอง และรับบริการในไม่กี่นาที — พร้อมรับประกันคุณภาพและเงินคืน'
                : 'UNO brings together 15+ service categories in one app. Find, book and get service in minutes — with quality guarantee and cashback.'}
            </p>
          </SectionCard>
        </motion.div>

        {/* Tabs: Guest vs Owner */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <Tabs defaultValue="guest" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="guest" className="gap-2">
                <UserCircle className="w-4 h-4" />
                {isRu ? 'Для гостей' : isTh ? 'สำหรับแขก' : 'For Guests'}
              </TabsTrigger>
              <TabsTrigger value="owner" className="gap-2">
                <Home className="w-4 h-4" />
                {isRu ? 'Для собственников' : isTh ? 'สำหรับเจ้าของ' : 'For Owners'}
              </TabsTrigger>
            </TabsList>

            {/* Guest Journey */}
            <TabsContent value="guest" className="space-y-4">
              {guestSteps.map((step, index) => {
                const Icon = step.icon;
                return (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                    className="relative"
                  >
                    <SectionCard className="flex gap-4">
                      <div className="flex-shrink-0">
                        <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center relative">
                          <Icon className="w-7 h-7 text-primary" />
                          <span className="absolute -top-2 -left-2 w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center">
                            {step.number}
                          </span>
                        </div>
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold mb-1">{step.title}</h3>
                        <p className="text-sm text-muted-foreground mb-2">{step.description}</p>
                        <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-primary/10 text-xs text-primary">
                          <Zap className="w-3 h-3" />
                          {step.tip}
                        </div>
                      </div>
                    </SectionCard>
                    {index < guestSteps.length - 1 && (
                      <div className="absolute left-7 top-full h-4 w-0.5 bg-gradient-to-b from-primary/50 to-transparent" />
                    )}
                  </motion.div>
                );
              })}
            </TabsContent>

            {/* Owner Journey */}
            <TabsContent value="owner" className="space-y-4">
              {ownerSteps.map((step, index) => {
                const Icon = step.icon;
                return (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                    className="relative"
                  >
                    <SectionCard className="flex gap-4">
                      <div className="flex-shrink-0">
                        <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-accent/20 to-accent/10 flex items-center justify-center relative">
                          <Icon className="w-7 h-7 text-accent-foreground" />
                          <span className="absolute -top-2 -left-2 w-6 h-6 rounded-full bg-accent text-accent-foreground text-xs font-bold flex items-center justify-center">
                            {step.number}
                          </span>
                        </div>
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold mb-1">{step.title}</h3>
                        <p className="text-sm text-muted-foreground mb-2">{step.description}</p>
                        <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-accent/10 text-xs text-accent-foreground">
                          <Zap className="w-3 h-3" />
                          {step.tip}
                        </div>
                      </div>
                    </SectionCard>
                    {index < ownerSteps.length - 1 && (
                      <div className="absolute left-7 top-full h-4 w-0.5 bg-gradient-to-b from-accent/50 to-transparent" />
                    )}
                  </motion.div>
                );
              })}
            </TabsContent>
          </Tabs>
        </motion.div>

        {/* Benefits Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <h2 className="text-lg font-semibold mb-4">
            {isRu ? 'Преимущества UNO' : isTh ? 'ข้อดีของ UNO' : 'UNO Advantages'}
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {benefits.map((benefit, index) => {
              const Icon = benefit.icon;
              return (
                <SectionCard key={index} className="p-4 text-center">
                  <div className="w-10 h-10 mx-auto mb-2 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Icon className="w-5 h-5 text-primary" />
                  </div>
                  <h3 className="font-medium text-sm mb-1">{benefit.title}</h3>
                  <p className="text-xs text-muted-foreground">{benefit.description}</p>
                </SectionCard>
              );
            })}
          </div>
        </motion.div>

        {/* Quick Start Checklist */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <SectionCard className="bg-gradient-to-br from-success/10 to-success/5 border-success/20">
            <div className="flex items-center gap-2 mb-4">
              <Clock className="w-5 h-5 text-success" />
              <h2 className="font-semibold">
                {isRu ? 'Быстрый старт: 4 минуты' : isTh ? 'เริ่มต้นอย่างรวดเร็ว: 4 นาที' : 'Quick Start: 4 minutes'}
              </h2>
            </div>
            <div className="space-y-3">
              {quickStart.map((item, index) => (
                <div key={index} className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-success text-white flex items-center justify-center text-xs font-bold">
                    {index + 1}
                  </div>
                  <span className="flex-1 text-sm">{item.step}</span>
                  <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
                    {item.time}
                  </span>
                </div>
              ))}
            </div>
          </SectionCard>
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
        >
          <SectionCard className="text-center bg-primary/5 border-primary/20">
            <Heart className="w-10 h-10 text-primary mx-auto mb-3" />
            <h2 className="text-lg font-semibold mb-2">
              {isRu ? 'Готовы начать?' : isTh ? 'พร้อมที่จะเริ่มต้น?' : 'Ready to Start?'}
            </h2>
            <p className="text-sm text-muted-foreground mb-4">
              {isRu 
                ? 'Присоединяйтесь к 50,000+ пользователей, которые уже используют UNO'
                : isTh 
                ? 'เข้าร่วมกับผู้ใช้ 50,000+ รายที่ใช้ UNO อยู่แล้ว'
                : 'Join 50,000+ users who are already using UNO'}
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <Button onClick={() => navigate('/')} className="gap-2">
                {isRu ? 'Исследовать сервисы' : isTh ? 'สำรวจบริการ' : 'Explore Services'}
                <ArrowRight className="w-4 h-4" />
              </Button>
              <Button variant="outline" onClick={() => navigate('/owner')}>
                {isRu ? 'Разместить объект' : isTh ? 'ลงประกาศทรัพย์สิน' : 'List Property'}
              </Button>
            </div>
          </SectionCard>
        </motion.div>

        {/* Help */}
        <SectionCard className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center">
            <MessageCircle className="w-6 h-6 text-muted-foreground" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold">{isRu ? 'Остались вопросы?' : isTh ? 'มีคำถามเหลืออยู่?' : 'Still have questions?'}</h3>
            <p className="text-sm text-muted-foreground">
              {isRu ? 'Наша поддержка работает 24/7' : isTh ? 'ฝ่ายสนับสนุนของเราทำงาน 24/7' : 'Our support works 24/7'}
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={() => navigate('/faq')}>
            FAQ
          </Button>
        </SectionCard>
      </PageContainer>
    </AppLayout>
  );
}