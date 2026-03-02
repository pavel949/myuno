import { useLanguage } from "@/contexts/LanguageContext";
import { AppLayout } from "@/components/layout/AppLayout";
import { PageContainer } from "@/components/uno/PageContainer";
import { PageHeader } from "@/components/uno/PageHeader";
import { SectionCard } from "@/components/uno/SectionCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Shield, ShieldCheck, CheckCircle2, Lock, CreditCard, 
  Users, Building2, Briefcase, Star, Clock, Award,
  RefreshCcw, HeadphonesIcon, Eye, FileCheck, BadgeCheck,
  Wallet, Home, UserCheck, TrendingUp, MessageSquare,
  ArrowRight, Sparkles, Scale, Search, ThumbsUp, Repeat,
  BarChart3, GraduationCap, Camera, Heart
} from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

const GTrustPage = () => {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const isTh = language === 'th';

  // Three Pillars of Trust
  const threePillars = [
    {
      id: 'legal',
      icon: Scale,
      title: isRu ? 'Юридическое соответствие' : isTh ? 'การปฏิบัติตามกฎหมาย' : 'Legal Compliance',
      subtitle: isRu ? 'Pillar 1' : 'Pillar 1',
      weight: '30%',
      color: 'from-blue-500 to-indigo-500',
      bgColor: 'bg-blue-500/10 border-blue-500/20',
      items: isRu 
        ? [
            'Регистрация бизнеса (DBD / MOC Thailand)',
            'Налоговый статус и VAT',
            'Лицензии по типу деятельности (TAT, DLT, FDA, Hotel)',
            'Страхование ответственности',
            'Соответствие трудовому законодательству',
            'PDPA Compliance (защита данных)'
          ]
        : isTh 
        ? [
            'การจดทะเบียนธุรกิจ (DBD / MOC Thailand)',
            'สถานะภาษีและ VAT',
            'ใบอนุญาตตามประเภทธุรกิจ (TAT, DLT, FDA, Hotel)',
            'ประกันความรับผิด',
            'การปฏิบัติตามกฎหมายแรงงาน',
            'การปฏิบัติตาม PDPA (การคุ้มครองข้อมูล)'
          ]
        : [
            'Business registration (DBD / MOC Thailand)',
            'Tax status and VAT',
            'Activity-specific licenses (TAT, DLT, FDA, Hotel)',
            'Liability insurance',
            'Labor law compliance',
            'PDPA Compliance (data protection)'
          ]
    },
    {
      id: 'quality',
      icon: GraduationCap,
      title: isRu ? 'Модель качества' : isTh ? 'แบบจำลองคุณภาพ' : 'Quality Model',
      subtitle: isRu ? 'Pillar 2' : 'Pillar 2',
      weight: '40%',
      color: 'from-green-500 to-emerald-500',
      bgColor: 'bg-green-500/10 border-green-500/20',
      items: isRu 
        ? [
            'Первичный аудит при онбординге',
            'Mystery Shopping (тайные покупатели)',
            'SLA-метрики: время отклика < 15 мин',
            'Confirmation Rate > 95%',
            'Completion Rate > 98%',
            'Регулярные ре-аудиты (каждые 6 мес)'
          ]
        : isTh 
        ? [
            'การตรวจสอบเบื้องต้นเมื่อเริ่มต้น',
            'Mystery Shopping (ลูกค้าปริศนา)',
            'SLA-metrics: เวลาตอบกลับ < 15 นาที',
            'Confirmation Rate > 95%',
            'Completion Rate > 98%',
            'การตรวจสอบซ้ำเป็นประจำ (ทุก 6 เดือน)'
          ]
        : [
            'Initial audit during onboarding',
            'Mystery Shopping (secret shoppers)',
            'SLA metrics: response time < 15 min',
            'Confirmation Rate > 95%',
            'Completion Rate > 98%',
            'Regular re-audits (every 6 months)'
          ]
    },
    {
      id: 'social',
      icon: Heart,
      title: isRu ? 'Социальная верификация' : isTh ? 'การยืนยันทางสังคม' : 'Social Verification',
      subtitle: isRu ? 'Pillar 3' : 'Pillar 3',
      weight: '30%',
      color: 'from-pink-500 to-rose-500',
      bgColor: 'bg-pink-500/10 border-pink-500/20',
      items: isRu 
        ? [
            'Верифицированные отзывы (только от клиентов)',
            'Фото и видео от реальных пользователей',
            'Repeat Booking Rate (% повторных заказов)',
            'Net Promoter Score (NPS)',
            'Рекомендации от других партнёров',
            'Клиентские истории успеха'
          ]
        : isTh 
        ? [
            'รีวิวที่ได้รับการยืนยัน (จากลูกค้าเท่านั้น)',
            'รูปภาพและวิดีโอจากผู้ใช้จริง',
            'Repeat Booking Rate (% การจองซ้ำ)',
            'Net Promoter Score (NPS)',
            'คำแนะนำจากพันธมิตรอื่น',
            'เรื่องราวความสำเร็จของลูกค้า'
          ]
        : [
            'Verified reviews (only from customers)',
            'Photos and videos from real users',
            'Repeat Booking Rate (% of repeat orders)',
            'Net Promoter Score (NPS)',
            'Recommendations from other partners',
            'Customer success stories'
          ]
    },
  ];

  // Verification Levels - Updated with new structure
  const verificationLevels = [
    {
      level: isRu ? 'Basic' : 'Basic',
      badge: '🔵',
      color: 'bg-slate-500',
      legal: isRu ? '✓ Базовая проверка' : isTh ? '✓ การตรวจสอบเบื้องต้น' : '✓ Basic check',
      quality: '—',
      social: '—',
      requirements: isRu 
        ? ['Регистрация бизнеса', 'Контактные данные'] 
        : isTh 
        ? ['การจดทะเบียนธุรกิจ', 'ข้อมูลติดต่อ']
        : ['Business registration', 'Contact details']
    },
    {
      level: isRu ? 'Verified' : 'Verified',
      badge: '🔷',
      color: 'bg-blue-500',
      legal: isRu ? '✓ Полная проверка' : isTh ? '✓ การตรวจสอบเต็มรูปแบบ' : '✓ Full verification',
      quality: isRu ? '✓ Первичный аудит' : isTh ? '✓ การตรวจสอบเบื้องต้น' : '✓ Initial audit',
      social: '—',
      requirements: isRu 
        ? ['Лицензии и страховка', 'Прошёл аудит качества'] 
        : isTh 
        ? ['ใบอนุญาตและประกัน', 'ผ่านการตรวจสอบคุณภาพ']
        : ['Licenses & insurance', 'Passed quality audit']
    },
    {
      level: isRu ? 'Trusted' : 'Trusted',
      badge: '✅',
      color: 'bg-green-500',
      legal: isRu ? '✓ Полная проверка' : isTh ? '✓ การตรวจสอบเต็มรูปแบบ' : '✓ Full verification',
      quality: isRu ? '✓ Регулярный аудит' : isTh ? '✓ การตรวจสอบเป็นประจำ' : '✓ Regular audit',
      social: isRu ? '✓ Рейтинг 4.5+' : isTh ? '✓ เรตติ้ง 4.5+' : '✓ Rating 4.5+',
      requirements: isRu 
        ? ['Рейтинг 4.5+ звёзд', '50+ отзывов', '6+ мес на платформе'] 
        : isTh 
        ? ['เรตติ้ง 4.5+ ดาว', '50+ รีวิว', '6+ เดือนบนแพลตฟอร์ม']
        : ['4.5+ star rating', '50+ reviews', '6+ months on platform']
    },
    {
      level: isRu ? 'Premium' : 'Premium',
      badge: '⭐',
      color: 'bg-amber-500',
      legal: isRu ? '✓ Полная проверка' : isTh ? '✓ การตรวจสอบเต็มรูปแบบ' : '✓ Full verification',
      quality: isRu ? '✓ Mystery Shopping' : isTh ? '✓ Mystery Shopping' : '✓ Mystery Shopping',
      social: isRu ? '✓ Рейтинг 4.8+' : isTh ? '✓ เรตติ้ง 4.8+' : '✓ Rating 4.8+',
      requirements: isRu 
        ? ['Рейтинг 4.8+ звёзд', '100+ отзывов', 'Repeat Rate > 40%'] 
        : isTh 
        ? ['เรตติ้ง 4.8+ ดาว', '100+ รีวิว', 'Repeat Rate > 40%']
        : ['4.8+ star rating', '100+ reviews', 'Repeat Rate > 40%']
    },
  ];

  // Main Guarantees
  const mainGuarantees = [
    {
      icon: RefreshCcw,
      title: isRu ? "100% возврат средств" : isTh ? "คืนเงิน 100%" : "100% Money Back",
      description: isRu 
        ? "Полный возврат оплаты, если услуга не была оказана или не соответствует описанию"
        : isTh 
        ? "คืนเงินเต็มจำนวนหากบริการไม่ได้รับหรือไม่ตรงกับคำอธิบาย"
        : "Full refund if the service was not provided or doesn't match the description",
      color: "text-green-600"
    },
    {
      icon: ShieldCheck,
      title: isRu ? "Защита от мошенничества" : isTh ? "การป้องกันการฉ้อโกง" : "Fraud Protection",
      description: isRu 
        ? "Все платежи защищены. Средства переводятся исполнителю только после подтверждения оказания услуги"
        : isTh 
        ? "การชำระเงินทั้งหมดได้รับการคุ้มครอง เงินจะถูกโอนให้ผู้ให้บริการหลังจากยืนยันบริการแล้วเท่านั้น"
        : "All payments are protected. Funds are released to providers only after service confirmation",
      color: "text-blue-600"
    },
    {
      icon: HeadphonesIcon,
      title: isRu ? "Поддержка 24/7" : isTh ? "สนับสนุน 24/7" : "24/7 Support",
      description: isRu 
        ? "Круглосуточная поддержка на русском, английском и тайском языках"
        : isTh 
        ? "สนับสนุนตลอด 24 ชั่วโมงเป็นภาษารัสเซีย อังกฤษ และไทย"
        : "Round-the-clock support in Russian, English, and Thai",
      color: "text-purple-600"
    },
    {
      icon: Eye,
      title: isRu ? "Прозрачные цены" : isTh ? "ราคาโปร่งใส" : "Transparent Pricing",
      description: isRu 
        ? "Никаких скрытых комиссий. Цена, которую вы видите — это финальная цена"
        : isTh 
        ? "ไม่มีค่าธรรมเนียมซ่อนเร้น ราคาที่คุณเห็นคือราคาสุดท้าย"
        : "No hidden fees. The price you see is the final price",
      color: "text-amber-600"
    }
  ];

  // Guarantees by user type
  const guestGuarantees = [
    { icon: RefreshCcw, title: isRu ? "100% возврат" : isTh ? "คืนเงิน 100%" : "100% Refund", desc: isRu ? "При неоказании услуги" : isTh ? "หากไม่ได้รับบริการ" : "If service not provided" },
    { icon: Lock, title: isRu ? "Escrow защита" : isTh ? "การคุ้มครอง Escrow" : "Escrow Protection", desc: isRu ? "Деньги в безопасности" : isTh ? "เงินปลอดภัย" : "Money is safe" },
    { icon: BadgeCheck, title: isRu ? "Проверенные партнёры" : isTh ? "พันธมิตรที่ได้รับการยืนยัน" : "Verified Partners", desc: isRu ? "G-Trust верификация" : isTh ? "การยืนยัน G-Trust" : "G-Trust verified" },
    { icon: HeadphonesIcon, title: isRu ? "Поддержка 24/7" : isTh ? "สนับสนุน 24/7" : "24/7 Support", desc: isRu ? "Всегда на связи" : isTh ? "พร้อมเสมอ" : "Always available" },
    { icon: Eye, title: isRu ? "Честные цены" : isTh ? "ราคายุติธรรม" : "Fair Prices", desc: isRu ? "Без скрытых комиссий" : isTh ? "ไม่มีค่าธรรมเนียมซ่อนเร้น" : "No hidden fees" },
    { icon: Camera, title: isRu ? "Реальные отзывы" : isTh ? "รีวิวจริง" : "Real Reviews", desc: isRu ? "Фото от клиентов" : isTh ? "รูปจากลูกค้า" : "Photos from customers" }
  ];

  const ownerGuarantees = [
    { icon: UserCheck, title: isRu ? "Проверенные гости" : isTh ? "แขกที่ได้รับการยืนยัน" : "Verified Guests", desc: isRu ? "Верификация паспорта" : isTh ? "การยืนยันพาสปอร์ต" : "Passport verification" },
    { icon: Shield, title: isRu ? "Защита имущества" : isTh ? "การคุ้มครองทรัพย์สิน" : "Property Protection", desc: isRu ? "Страхование до $10,000" : isTh ? "ประกันสูงสุด $10,000" : "Insurance up to $10,000" },
    { icon: Wallet, title: isRu ? "Быстрые выплаты" : isTh ? "การจ่ายเงินรวดเร็ว" : "Fast Payouts", desc: isRu ? "В течение 24 часов" : isTh ? "ภายใน 24 ชั่วโมง" : "Within 24 hours" },
    { icon: Clock, title: isRu ? "Быстрые споры" : isTh ? "ข้อพิพาทรวดเร็ว" : "Fast Disputes", desc: isRu ? "Решение за 48 часов" : isTh ? "แก้ไขใน 48 ชั่วโมง" : "Resolution in 48 hours" }
  ];

  const vendorGuarantees = [
    { icon: CreditCard, title: isRu ? "Гарантия платежей" : isTh ? "รับประกันการชำระเงิน" : "Payment Guarantee", desc: isRu ? "Без задержек" : isTh ? "ไม่มีความล่าช้า" : "No delays" },
    { icon: Shield, title: isRu ? "Защита от отмен" : isTh ? "การป้องกันการยกเลิก" : "Cancellation Protection", desc: isRu ? "Компенсация < 24ч" : isTh ? "ชดเชย < 24 ชม." : "Compensation < 24h" },
    { icon: Star, title: isRu ? "Честная модерация" : isTh ? "การดูแลที่ยุติธรรม" : "Fair Moderation", desc: isRu ? "Проверка отзывов" : isTh ? "การตรวจสอบรีวิว" : "Review verification" },
    { icon: TrendingUp, title: isRu ? "Маркетинг" : isTh ? "การตลาด" : "Marketing", desc: isRu ? "Продвижение партнёров" : isTh ? "โปรโมทพันธมิตร" : "Partner promotion" }
  ];

  // Trust Score Criteria
  const trustScoreCriteria = [
    { label: isRu ? "Юридическое соответствие" : isTh ? "การปฏิบัติตามกฎหมาย" : "Legal Compliance", weight: "30%", color: "bg-blue-500" },
    { label: isRu ? "Модель качества" : isTh ? "แบบจำลองคุณภาพ" : "Quality Model", weight: "40%", color: "bg-green-500" },
    { label: isRu ? "Социальная верификация" : isTh ? "การยืนยันทางสังคม" : "Social Verification", weight: "30%", color: "bg-pink-500" }
  ];

  // Trust Score Levels
  const trustScoreLevels = [
    { range: "90-100%", label: isRu ? "Превосходно" : isTh ? "ยอดเยี่ยม" : "Excellent", color: "text-green-600", bg: "bg-green-500" },
    { range: "75-89%", label: isRu ? "Отлично" : isTh ? "ดีมาก" : "Great", color: "text-blue-600", bg: "bg-blue-500" },
    { range: "60-74%", label: isRu ? "Хорошо" : isTh ? "ดี" : "Good", color: "text-amber-600", bg: "bg-amber-500" },
    { range: "<60%", label: isRu ? "Требует улучшения" : isTh ? "ต้องปรับปรุง" : "Needs Improvement", color: "text-red-600", bg: "bg-red-500" }
  ];

  const SectionHeader = ({ icon: Icon, title }: { icon: React.ComponentType<{ className?: string }>, title: string }) => (
    <div className="flex items-center gap-2 mb-4">
      <Icon className="w-5 h-5 text-primary" />
      <h3 className="font-semibold text-lg">{title}</h3>
    </div>
  );

  return (
    <AppLayout>
      <PageContainer className="pb-24">
        <PageHeader 
          title={isRu ? "G-Trust Гарантии" : isTh ? "การรับประกัน G-Trust" : "G-Trust Guarantees"}
          showBack
        />

        {/* Hero Section */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-amber-500 via-amber-600 to-orange-600 p-6 md:p-8 text-white mb-6"
        >
          <div className="absolute top-0 right-0 opacity-10">
            <Shield className="w-48 h-48 -mr-12 -mt-12" />
          </div>
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                <ShieldCheck className="w-8 h-8" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold">G-Trust</h1>
                <p className="text-white/80 text-sm">
                  {isRu ? "Три столпа доверия" : isTh ? "สามเสาหลักแห่งความไว้วางใจ" : "Three Pillars of Trust"}
                </p>
              </div>
            </div>
            <h2 className="text-xl md:text-2xl font-semibold mb-2">
              {isRu ? "Комплексная система проверки партнёров" : isTh ? "ระบบตรวจสอบพันธมิตรที่ครอบคลุม" : "Comprehensive Partner Verification System"}
            </h2>
            <p className="text-white/90 text-sm md:text-base max-w-lg">
              {isRu 
                ? "Legal Compliance + Quality Model + Social Verification = 100% защита ваших покупок"
                : isTh 
                ? "Legal Compliance + Quality Model + Social Verification = การคุ้มครองการซื้อของคุณ 100%"
                : "Legal Compliance + Quality Model + Social Verification = 100% protection for your purchases"}
            </p>
          </div>
        </motion.div>

        {/* Three Pillars of Trust */}
        <SectionCard className="mb-6">
          <SectionHeader icon={Shield} title={isRu ? "Три столпа G-Trust" : isTh ? "สามเสาหลัก G-Trust" : "Three Pillars of G-Trust"} />
          <div className="space-y-4">
            {threePillars.map((pillar, index) => {
              const Icon = pillar.icon;
              return (
                <motion.div
                  key={pillar.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.15 }}
                  className={`p-4 rounded-xl border ${pillar.bgColor}`}
                >
                  <div className="flex items-start gap-4">
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${pillar.color} flex items-center justify-center shrink-0`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline" className="text-[10px]">{pillar.subtitle}</Badge>
                        <Badge className="text-[10px] bg-primary">{pillar.weight}</Badge>
                      </div>
                      <h4 className="font-semibold mb-2">{pillar.title}</h4>
                      <ul className="grid grid-cols-1 md:grid-cols-2 gap-1">
                        {pillar.items.map((item, i) => (
                          <li key={i} className="text-xs text-muted-foreground flex items-start gap-1.5">
                            <CheckCircle2 className="w-3 h-3 text-green-500 mt-0.5 shrink-0" />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </SectionCard>

        {/* Verification Levels Table */}
        <SectionCard className="mb-6">
          <SectionHeader icon={BadgeCheck} title={isRu ? "Уровни верификации" : isTh ? "ระดับการยืนยัน" : "Verification Levels"} />
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-2 font-medium">{isRu ? "Уровень" : isTh ? "ระดับ" : "Level"}</th>
                  <th className="text-center py-2 px-2 font-medium text-blue-600">Legal</th>
                  <th className="text-center py-2 px-2 font-medium text-green-600">Quality</th>
                  <th className="text-center py-2 px-2 font-medium text-pink-600">Social</th>
                </tr>
              </thead>
              <tbody>
                {verificationLevels.map((level, index) => (
                  <tr key={index} className="border-b last:border-0">
                    <td className="py-3 px-2">
                      <div className="flex items-center gap-2">
                        <span className={`w-6 h-6 rounded-full ${level.color} flex items-center justify-center text-white text-xs`}>
                          {level.badge}
                        </span>
                        <span className="font-medium">{level.level}</span>
                      </div>
                    </td>
                    <td className="py-3 px-2 text-center text-xs">{level.legal}</td>
                    <td className="py-3 px-2 text-center text-xs">{level.quality}</td>
                    <td className="py-3 px-2 text-center text-xs">{level.social}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </SectionCard>

        {/* Trust Score Calculator Visual */}
        <SectionCard className="mb-6">
          <SectionHeader icon={BarChart3} title={isRu ? "Trust Score — Формула доверия" : isTh ? "Trust Score — สูตรความไว้วางใจ" : "Trust Score — Trust Formula"} />
          <p className="text-sm text-muted-foreground mb-4">
            {isRu 
              ? "Trust Score рассчитывается на основе трёх столпов G-Trust с учётом веса каждого компонента:"
              : isTh 
              ? "Trust Score คำนวณจากสามเสาหลัก G-Trust โดยคำนึงถึงน้ำหนักของแต่ละองค์ประกอบ:"
              : "Trust Score is calculated based on three G-Trust pillars with weight for each component:"}
          </p>
          
          {/* Weight visualization */}
          <div className="flex gap-1 mb-4 h-8 rounded-lg overflow-hidden">
            {trustScoreCriteria.map((criteria, index) => (
              <div 
                key={index}
                className={`${criteria.color} flex items-center justify-center text-white text-xs font-medium`}
                style={{ width: criteria.weight }}
              >
                {criteria.weight}
              </div>
            ))}
          </div>
          
          <div className="grid grid-cols-3 gap-2 mb-6">
            {trustScoreCriteria.map((criteria, index) => (
              <div key={index} className="text-center">
                <div className={`w-3 h-3 rounded-full ${criteria.color} mx-auto mb-1`} />
                <p className="text-[10px] text-muted-foreground">{criteria.label}</p>
              </div>
            ))}
          </div>

          {/* Score levels */}
          <h4 className="text-sm font-medium mb-3">{isRu ? "Уровни Trust Score:" : isTh ? "ระดับ Trust Score:" : "Trust Score Levels:"}</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {trustScoreLevels.map((level, index) => (
              <div key={index} className="p-3 rounded-lg border bg-card text-center">
                <div className={`w-8 h-8 rounded-full ${level.bg} mx-auto mb-2 flex items-center justify-center`}>
                  <span className="text-white text-xs font-bold">{level.range.split('-')[0] || level.range.replace('<', '')}</span>
                </div>
                <p className="text-xs font-medium">{level.range}</p>
                <p className={`text-[10px] ${level.color}`}>{level.label}</p>
              </div>
            ))}
          </div>
        </SectionCard>

        {/* Main Guarantees */}
        <SectionCard className="mb-6">
          <SectionHeader icon={Shield} title={isRu ? "Главные гарантии" : isTh ? "การรับประกันหลัก" : "Main Guarantees"} />
          <div className="grid gap-4">
            {mainGuarantees.map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex gap-4 p-4 rounded-xl bg-muted/50 border"
              >
                <div className={`p-3 rounded-xl bg-background ${item.color}`}>
                  <item.icon className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">{item.title}</h3>
                  <p className="text-sm text-muted-foreground">{item.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </SectionCard>

        {/* For Guests & Buyers */}
        <SectionCard className="mb-6">
          <SectionHeader icon={Users} title={isRu ? "Для гостей и покупателей" : isTh ? "สำหรับแขกและผู้ซื้อ" : "For Guests & Buyers"} />
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {guestGuarantees.map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
                className="p-4 rounded-xl bg-green-500/10 border border-green-500/20 text-center"
              >
                <item.icon className="w-6 h-6 mx-auto mb-2 text-green-600" />
                <h4 className="font-medium text-sm mb-1">{item.title}</h4>
                <p className="text-xs text-muted-foreground">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </SectionCard>

        {/* For Property Owners */}
        <SectionCard className="mb-6">
          <SectionHeader icon={Home} title={isRu ? "Для собственников недвижимости" : isTh ? "สำหรับเจ้าของทรัพย์สิน" : "For Property Owners"} />
          <div className="grid gap-3">
            {ownerGuarantees.map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex gap-3 p-3 rounded-lg bg-blue-500/10 border border-blue-500/20"
              >
                <item.icon className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-medium text-sm">{item.title}</h4>
                  <p className="text-xs text-muted-foreground">{item.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </SectionCard>

        {/* For Vendors & Partners */}
        <SectionCard className="mb-6">
          <SectionHeader icon={Briefcase} title={isRu ? "Для поставщиков и партнёров" : isTh ? "สำหรับผู้ขายและพันธมิตร" : "For Vendors & Partners"} />
          <div className="grid gap-3">
            {vendorGuarantees.map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex gap-3 p-3 rounded-lg bg-purple-500/10 border border-purple-500/20"
              >
                <item.icon className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-medium text-sm">{item.title}</h4>
                  <p className="text-xs text-muted-foreground">{item.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </SectionCard>

        {/* CTA Section */}
        <SectionCard className="text-center bg-gradient-to-br from-amber-500/10 to-orange-500/10 border-amber-500/20">
          <ShieldCheck className="w-12 h-12 text-amber-600 mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">
            {isRu ? "Ваша безопасность — наш приоритет" : isTh ? "ความปลอดภัยของคุณคือสิ่งสำคัญของเรา" : "Your Safety is Our Priority"}
          </h2>
          <p className="text-sm text-muted-foreground mb-4 max-w-md mx-auto">
            {isRu 
              ? "G-Trust защищает каждую транзакцию на платформе myUNO. Остались вопросы?"
              : isTh 
              ? "G-Trust ปกป้องทุกธุรกรรมบนแพลตฟอร์ม myUNO มีคำถามหรือไม่?"
              : "G-Trust protects every transaction on the myUNO platform. Have questions?"}
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Button asChild>
              <Link to="/support" className="gap-2">
                <HeadphonesIcon className="w-4 h-4" />
                {isRu ? "Связаться с поддержкой" : isTh ? "ติดต่อฝ่ายสนับสนุน" : "Contact Support"}
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/refund-policy" className="gap-2">
                <RefreshCcw className="w-4 h-4" />
                {isRu ? "Политика возврата" : isTh ? "นโยบายการคืนเงิน" : "Refund Policy"}
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/partners" className="gap-2">
                <Briefcase className="w-4 h-4" />
                {isRu ? "Стать партнёром" : isTh ? "เป็นพันธมิตร" : "Become a Partner"}
              </Link>
            </Button>
          </div>
        </SectionCard>
      </PageContainer>
    </AppLayout>
  );
};

export default GTrustPage;
