import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Home, Car, Utensils, Heart, Shield, Sparkles, 
  MapPin, Clock, CreditCard, MessageCircle, Star, 
  Users, Gift, Headphones, CheckCircle, ArrowRight,
  Building2, Plane, Baby, Stethoscope, Flower2, ShoppingBag
} from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageContainer } from '@/components/uno/PageContainer';
import { PageHeader } from '@/components/uno/PageHeader';
import { SectionCard } from '@/components/uno/SectionCard';
import { PremiumButton } from '@/components/uno/PremiumButton';
import { useLanguage } from '@/contexts/LanguageContext';
import { motion } from 'framer-motion';

const translations = {
  en: {
    title: 'How It Works',
    subtitle: 'Your complete guide to living abroad',
    heroTitle: 'Everything you need in one app',
    heroDescription: 'myUNO is your personal assistant for comfortable living in Thailand. From housing to services — we handle everything so you can enjoy life.',
    
    categoriesTitle: 'What you can do',
    categories: [
      { icon: Home, title: 'Rent Property', desc: 'Verified villas, condos, and apartments with honest reviews and transparent pricing' },
      { icon: Car, title: 'Rent Transport', desc: 'Cars, bikes, and scooters from trusted providers with insurance included' },
      { icon: Utensils, title: 'Order Food', desc: 'Restaurants, cafes, and home delivery from your favorite places' },
      { icon: Baby, title: 'Find Babysitter', desc: 'Verified nannies and babysitters speaking your language' },
      { icon: Stethoscope, title: 'Medical Services', desc: 'Clinics, doctors, and emergency help with English-speaking staff' },
      { icon: Flower2, title: 'Send Flowers', desc: 'Beautiful bouquets with same-day delivery across the city' },
    ],

    benefitsTitle: 'Why choose myUNO',
    benefits: [
      { icon: Shield, title: 'Verified Providers', desc: 'Every partner is checked and verified. Read real reviews from real users.' },
      { icon: MessageCircle, title: 'AI Support 24/7', desc: 'Our smart assistant answers questions instantly in your language.' },
      { icon: CreditCard, title: 'Secure Payments', desc: 'Pay safely with cards, crypto, or cash. All transactions protected.' },
      { icon: Gift, title: 'Cashback & Bonuses', desc: 'Earn up to 10% cashback on every booking. Invite friends, get rewards.' },
      { icon: MapPin, title: 'Local Expertise', desc: 'We know Thailand inside out. Get insider tips and recommendations.' },
      { icon: Clock, title: 'Save Your Time', desc: 'No more endless searches. Find what you need in seconds.' },
    ],

    howItWorksTitle: 'Getting started is easy',
    steps: [
      { number: '1', title: 'Create Account', desc: 'Sign up in 30 seconds with email or social media' },
      { number: '2', title: 'Browse Services', desc: 'Explore categories or use AI search to find exactly what you need' },
      { number: '3', title: 'Book & Pay', desc: 'Reserve instantly and pay securely through the app' },
      { number: '4', title: 'Enjoy & Review', desc: 'Use the service and share your experience to help others' },
    ],

    rolesTitle: 'For everyone',
    roles: [
      { icon: Users, title: 'For Tourists', desc: 'Short-term rentals, tours, and essential services for your vacation' },
      { icon: Plane, title: 'For Digital Nomads', desc: 'Monthly housing, coworking, visas, and everything for remote work' },
      { icon: Building2, title: 'For Property Owners', desc: 'List your property, manage bookings, and grow your income' },
      { icon: ShoppingBag, title: 'For Service Providers', desc: 'Reach thousands of customers and scale your business' },
    ],

    ctaTitle: 'Ready to start?',
    ctaDescription: 'Join thousands of happy users who simplified their life abroad',
    ctaButton: 'Get Started',
    ctaSecondary: 'Contact Support',
  },
  ru: {
    title: 'Как это работает',
    subtitle: 'Ваш полный гид по жизни за рубежом',
    heroTitle: 'Всё необходимое в одном приложении',
    heroDescription: 'myUNO — ваш персональный помощник для комфортной жизни в Таиланде. От жилья до услуг — мы берём всё на себя, чтобы вы могли наслаждаться жизнью.',
    
    categoriesTitle: 'Что вы можете',
    categories: [
      { icon: Home, title: 'Арендовать жильё', desc: 'Проверенные виллы, кондо и апартаменты с честными отзывами и прозрачными ценами' },
      { icon: Car, title: 'Арендовать транспорт', desc: 'Автомобили, мотоциклы и скутеры от надёжных прокатов со страховкой' },
      { icon: Utensils, title: 'Заказать еду', desc: 'Рестораны, кафе и доставка на дом из любимых заведений' },
      { icon: Baby, title: 'Найти няню', desc: 'Проверенные няни и бебиситтеры, говорящие на вашем языке' },
      { icon: Stethoscope, title: 'Медицинские услуги', desc: 'Клиники, врачи и экстренная помощь с англо- и русскоговорящим персоналом' },
      { icon: Flower2, title: 'Отправить цветы', desc: 'Красивые букеты с доставкой в тот же день по всему городу' },
    ],

    benefitsTitle: 'Почему выбирают myUNO',
    benefits: [
      { icon: Shield, title: 'Проверенные партнёры', desc: 'Каждый провайдер проверен и верифицирован. Читайте реальные отзывы.' },
      { icon: MessageCircle, title: 'AI-поддержка 24/7', desc: 'Умный ассистент мгновенно отвечает на вопросы на вашем языке.' },
      { icon: CreditCard, title: 'Безопасные платежи', desc: 'Платите картой, криптой или наличными. Все транзакции защищены.' },
      { icon: Gift, title: 'Кэшбэк и бонусы', desc: 'Получайте до 10% кэшбэка с каждого бронирования. Приглашайте друзей — получайте награды.' },
      { icon: MapPin, title: 'Локальная экспертиза', desc: 'Мы знаем Таиланд изнутри. Получите инсайдерские советы и рекомендации.' },
      { icon: Clock, title: 'Экономьте время', desc: 'Никаких бесконечных поисков. Находите нужное за секунды.' },
    ],

    howItWorksTitle: 'Как начать за 4 шага',
    steps: [
      { number: '1', title: 'Создайте аккаунт', desc: 'Регистрация за 30 секунд через email или соцсети' },
      { number: '2', title: 'Найдите услуги', desc: 'Изучите категории или используйте AI-поиск' },
      { number: '3', title: 'Бронируйте и платите', desc: 'Мгновенное бронирование и безопасная оплата' },
      { number: '4', title: 'Пользуйтесь и оценивайте', desc: 'Получите услугу и поделитесь опытом с другими' },
    ],

    rolesTitle: 'Для всех',
    roles: [
      { icon: Users, title: 'Для туристов', desc: 'Краткосрочная аренда, туры и необходимые услуги для отпуска' },
      { icon: Plane, title: 'Для цифровых кочевников', desc: 'Помесячное жильё, коворкинги, визы и всё для удалённой работы' },
      { icon: Building2, title: 'Для собственников недвижимости', desc: 'Размещайте объекты, управляйте бронированиями, увеличивайте доход' },
      { icon: ShoppingBag, title: 'Для поставщиков услуг', desc: 'Охватите тысячи клиентов и масштабируйте бизнес' },
    ],

    ctaTitle: 'Готовы начать?',
    ctaDescription: 'Присоединяйтесь к тысячам довольных пользователей, которые упростили свою жизнь за рубежом',
    ctaButton: 'Начать',
    ctaSecondary: 'Связаться с поддержкой',
  },
  th: {
    title: 'วิธีการใช้งาน',
    subtitle: 'คู่มือฉบับสมบูรณ์สำหรับการใช้ชีวิตในต่างแดน',
    heroTitle: 'ทุกสิ่งที่คุณต้องการในแอปเดียว',
    heroDescription: 'myUNO คือผู้ช่วยส่วนตัวของคุณเพื่อการใช้ชีวิตอย่างสบายในประเทศไทย ตั้งแต่ที่พักไปจนถึงบริการต่างๆ เราดูแลให้ทั้งหมด เพื่อให้คุณได้เพลิดเพลินกับชีวิต',

    categoriesTitle: 'สิ่งที่คุณทำได้',
    categories: [
      { icon: Home, title: 'เช่าที่พัก', desc: 'วิลล่า คอนโด และอพาร์ตเมนต์ที่ผ่านการตรวจสอบ พร้อมรีวิวจริงและราคาโปร่งใส' },
      { icon: Car, title: 'เช่ายานพาหนะ', desc: 'รถยนต์ มอเตอร์ไซค์ และสกู๊ตเตอร์จากผู้ให้บริการที่เชื่อถือได้ พร้อมประกันภัย' },
      { icon: Utensils, title: 'สั่งอาหาร', desc: 'ร้านอาหาร คาเฟ่ และบริการส่งถึงบ้านจากร้านโปรดของคุณ' },
      { icon: Baby, title: 'หาพี่เลี้ยงเด็ก', desc: 'พี่เลี้ยงและพี่เลี้ยงเด็กที่ผ่านการตรวจสอบ พูดภาษาของคุณได้' },
      { icon: Stethoscope, title: 'บริการทางการแพทย์', desc: 'คลินิก แพทย์ และความช่วยเหลือฉุกเฉิน พร้อมเจ้าหน้าที่ที่พูดภาษาอังกฤษได้' },
      { icon: Flower2, title: 'ส่งดอกไม้', desc: 'ช่อดอกไม้สวยงาม จัดส่งภายในวันเดียวทั่วเมือง' },
    ],

    benefitsTitle: 'ทำไมต้องเลือก myUNO',
    benefits: [
      { icon: Shield, title: 'พาร์ทเนอร์ที่ผ่านการตรวจสอบ', desc: 'พาร์ทเนอร์ทุกรายผ่านการตรวจสอบและยืนยัน อ่านรีวิวจริงจากผู้ใช้จริง' },
      { icon: MessageCircle, title: 'AI ช่วยเหลือตลอด 24 ชั่วโมง', desc: 'ผู้ช่วยอัจฉริยะของเราตอบคำถามทันทีในภาษาของคุณ' },
      { icon: CreditCard, title: 'ชำระเงินปลอดภัย', desc: 'ชำระเงินอย่างปลอดภัยด้วยบัตร คริปโต หรือเงินสด ทุกธุรกรรมได้รับการคุ้มครอง' },
      { icon: Gift, title: 'เงินคืนและโบนัส', desc: 'รับเงินคืนสูงสุด 10% ทุกการจอง ชวนเพื่อนรับรางวัล' },
      { icon: MapPin, title: 'ความเชี่ยวชาญในท้องถิ่น', desc: 'เรารู้จักประเทศไทยอย่างถ่องแท้ รับเคล็ดลับและคำแนะนำจากคนใน' },
      { icon: Clock, title: 'ประหยัดเวลาของคุณ', desc: 'ไม่ต้องค้นหานานอีกต่อไป เจอสิ่งที่ต้องการได้ในไม่กี่วินาที' },
    ],

    howItWorksTitle: 'เริ่มต้นใช้งานง่ายๆ',
    steps: [
      { number: '1', title: 'สร้างบัญชี', desc: 'สมัครภายใน 30 วินาที ด้วยอีเมลหรือโซเชียลมีเดีย' },
      { number: '2', title: 'เลือกดูบริการ', desc: 'สำรวจหมวดหมู่หรือใช้การค้นหาด้วย AI เพื่อหาสิ่งที่คุณต้องการ' },
      { number: '3', title: 'จองและชำระเงิน', desc: 'จองได้ทันทีและชำระเงินอย่างปลอดภัยผ่านแอป' },
      { number: '4', title: 'ใช้บริการและรีวิว', desc: 'ใช้บริการและแบ่งปันประสบการณ์ของคุณเพื่อช่วยเหลือผู้อื่น' },
    ],

    rolesTitle: 'สำหรับทุกคน',
    roles: [
      { icon: Users, title: 'สำหรับนักท่องเที่ยว', desc: 'ที่พักระยะสั้น ทัวร์ และบริการที่จำเป็นสำหรับวันหยุดของคุณ' },
      { icon: Plane, title: 'สำหรับดิจิทัลโนแมด', desc: 'ที่พักรายเดือน โคเวิร์กกิ้ง วีซ่า และทุกสิ่งสำหรับการทำงานทางไกล' },
      { icon: Building2, title: 'สำหรับเจ้าของอสังหาริมทรัพย์', desc: 'ลงประกาศทรัพย์สิน จัดการการจอง และเพิ่มรายได้ของคุณ' },
      { icon: ShoppingBag, title: 'สำหรับผู้ให้บริการ', desc: 'เข้าถึงลูกค้าหลายพันราย และขยายธุรกิจของคุณ' },
    ],

    ctaTitle: 'พร้อมเริ่มต้นแล้วหรือยัง?',
    ctaDescription: 'ร่วมกับผู้ใช้นับพันที่มีความสุข ซึ่งทำให้ชีวิตในต่างแดนง่ายขึ้น',
    ctaButton: 'เริ่มต้นใช้งาน',
    ctaSecondary: 'ติดต่อฝ่ายสนับสนุน',
  }
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};

export default function HowItWorks() {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const t = translations[language] || translations.en;

  return (
    <AppLayout>
      <PageContainer className="pb-32">
        <PageHeader 
          title={t.title} 
          subtitle={t.subtitle}
          showBack 
          fallbackPath="/" 
        />

        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-8"
        >
          <div className="w-20 h-20 mx-auto mb-6 rounded-none bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
            <Sparkles className="w-10 h-10 text-primary-foreground" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold mb-4">{t.heroTitle}</h1>
          <p className="text-muted-foreground max-w-md mx-auto">{t.heroDescription}</p>
        </motion.div>

        {/* Categories Grid */}
        <section>
          <h2 className="text-lg font-semibold mb-4">{t.categoriesTitle}</h2>
          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid grid-cols-1 sm:grid-cols-2 gap-3"
          >
            {t.categories.map((cat, i) => (
              <motion.div key={i} variants={itemVariants}>
                <SectionCard className="flex gap-4 items-start h-full">
                  <div className="w-12 h-12 rounded-none bg-primary/10 flex items-center justify-center shrink-0">
                    <cat.icon className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">{cat.title}</h3>
                    <p className="text-sm text-muted-foreground">{cat.desc}</p>
                  </div>
                </SectionCard>
              </motion.div>
            ))}
          </motion.div>
        </section>

        {/* Benefits */}
        <section>
          <h2 className="text-lg font-semibold mb-4">{t.benefitsTitle}</h2>
          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="space-y-3"
          >
            {t.benefits.map((benefit, i) => (
              <motion.div key={i} variants={itemVariants}>
                <SectionCard className="flex gap-4 items-start">
                  <div className="w-10 h-10 rounded-none bg-secondary flex items-center justify-center shrink-0">
                    <benefit.icon className="w-5 h-5 text-foreground" />
                  </div>
                  <div>
                    <h3 className="font-medium mb-0.5">{benefit.title}</h3>
                    <p className="text-sm text-muted-foreground">{benefit.desc}</p>
                  </div>
                </SectionCard>
              </motion.div>
            ))}
          </motion.div>
        </section>

        {/* How It Works Steps */}
        <section>
          <h2 className="text-lg font-semibold mb-4">{t.howItWorksTitle}</h2>
          <SectionCard>
            <div className="space-y-6">
              {t.steps.map((step, i) => (
                <div key={i} className="flex gap-4 items-start">
                  <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold shrink-0">
                    {step.number}
                  </div>
                  <div className="flex-1 pt-1">
                    <h3 className="font-semibold mb-1">{step.title}</h3>
                    <p className="text-sm text-muted-foreground">{step.desc}</p>
                  </div>
                  {i < t.steps.length - 1 && (
                    <CheckCircle className="w-5 h-5 text-success shrink-0 mt-2" />
                  )}
                </div>
              ))}
            </div>
          </SectionCard>
        </section>

        {/* For Everyone */}
        <section>
          <h2 className="text-lg font-semibold mb-4">{t.rolesTitle}</h2>
          <div className="grid grid-cols-2 gap-3">
            {t.roles.map((role, i) => (
              <SectionCard key={i} className="text-center p-4">
                <div className="w-12 h-12 mx-auto mb-3 rounded-none bg-secondary flex items-center justify-center">
                  <role.icon className="w-6 h-6 text-foreground" />
                </div>
                <h3 className="font-semibold text-sm mb-1">{role.title}</h3>
                <p className="text-xs text-muted-foreground">{role.desc}</p>
              </SectionCard>
            ))}
          </div>
        </section>

        {/* CTA Section */}
        <motion.section
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="mt-8"
        >
          <SectionCard className="text-center bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
            <Star className="w-12 h-12 mx-auto mb-4 text-primary" />
            <h2 className="text-xl font-bold mb-2">{t.ctaTitle}</h2>
            <p className="text-muted-foreground mb-6 max-w-sm mx-auto">{t.ctaDescription}</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <PremiumButton onClick={() => navigate('/auth')} className="gap-2">
                {t.ctaButton}
                <ArrowRight className="w-4 h-4" />
              </PremiumButton>
              <PremiumButton variant="outline" onClick={() => navigate('/support')}>
                <Headphones className="w-4 h-4 mr-2" />
                {t.ctaSecondary}
              </PremiumButton>
            </div>
          </SectionCard>
        </motion.section>
      </PageContainer>
    </AppLayout>
  );
}
