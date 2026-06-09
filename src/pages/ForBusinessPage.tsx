/**
 * Public landing — myUNO for Local Business.
 * B2B services menu for local Phuket businesses (F&B, salons, clinics, schools, venues)
 * that want to become "foreign-ready": menu localization, websites, booking systems,
 * marketing to expats, capital & restructuring, staff & visas, concierge distribution.
 *
 * Trilingual: RU / EN / TH — all user-facing strings are picked by `useLanguage()`.
 */
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Helmet } from 'react-helmet-async';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useLanguage, type Language } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { AppLayout } from '@/components/layout/AppLayout';
import { LandingChrome } from '@/components/landings';
import { APP_ROUTES } from '@/lib/config/routes';
import {
  Building2, Languages, Globe, CalendarCheck, ShieldCheck, Megaphone,
  Banknote, Users, Sparkles, ArrowRight, Send,
} from 'lucide-react';

type Tri = { ru: string; en: string; th: string };
type TriList = { ru: string[]; en: string[]; th: string[] };

/** Pick localized value by current language, falling back to EN then RU. */
function pick<T>(value: { ru: T; en: T; th: T }, lang: Language): T {
  return value[lang] ?? value.en ?? value.ru;
}

type ServiceKey =
  | 'menu_localization'
  | 'website_builder'
  | 'booking_system'
  | 'foreign_ready_audit'
  | 'marketing_to_expats'
  | 'capital_restructuring'
  | 'staff_visas'
  | 'concierge_distribution';

interface ServicePack {
  key: ServiceKey;
  icon: React.ComponentType<{ className?: string }>;
  title: Tri;
  desc: Tri;
  bullets: TriList;
}

const SERVICES: ServicePack[] = [
  {
    key: 'menu_localization',
    icon: Languages,
    title: {
      ru: 'Локализация меню и контента',
      en: 'Menu & content localization',
      th: 'แปลเมนูและคอนเทนต์',
    },
    desc: {
      ru: 'Перевод и адаптация меню, прайс-листов, табличек, скриптов сервиса на RU / EN / CN.',
      en: 'Translation and adaptation of menus, price-lists, signage, and service scripts in RU / EN / CN.',
      th: 'แปลและปรับเมนู ราคา ป้าย และสคริปต์บริการเป็น RU / EN / CN',
    },
    bullets: {
      ru: ['Меню в PDF + QR', 'Адаптация под вкусы иностранцев', 'Аллергены и halal/veg маркировка'],
      en: ['PDF + QR menus', 'Adapted to foreign palate', 'Allergens & halal/veg labels'],
      th: ['เมนู PDF + QR', 'ปรับให้ถูกปากชาวต่างชาติ', 'ติดป้ายสารก่อภูมิแพ้ / halal / มังสวิรัติ'],
    },
  },
  {
    key: 'website_builder',
    icon: Globe,
    title: {
      ru: 'Сайт под ключ',
      en: 'Website built for you',
      th: 'สร้างเว็บไซต์ครบวงจร',
    },
    desc: {
      ru: 'Двухъязычный сайт с фото, картой, отзывами и онлайн-заявкой. Хостинг и SEO включены.',
      en: 'Bilingual website with photos, map, reviews and online inquiries. Hosting & SEO included.',
      th: 'เว็บไซต์สองภาษา พร้อมรูป แผนที่ รีวิว และฟอร์มจอง รวมโฮสติ้งและ SEO',
    },
    bullets: {
      ru: ['Домен и SSL', 'Google Business + TripAdvisor', 'Аналитика и формы лидов'],
      en: ['Domain & SSL', 'Google Business + TripAdvisor', 'Analytics & lead forms'],
      th: ['โดเมนและ SSL', 'Google Business + TripAdvisor', 'อนาลิติกส์และฟอร์มลีด'],
    },
  },
  {
    key: 'booking_system',
    icon: CalendarCheck,
    title: {
      ru: 'Система бронирования',
      en: 'Booking system setup',
      th: 'ระบบจองออนไลน์',
    },
    desc: {
      ru: 'Онлайн-бронь столов, услуг, кабинетов с напоминаниями в WhatsApp и оплатой.',
      en: 'Online booking of tables, services and rooms with WhatsApp reminders and payments.',
      th: 'จองโต๊ะ บริการ และห้อง ออนไลน์ พร้อมแจ้งเตือนผ่าน WhatsApp และรับชำระเงิน',
    },
    bullets: {
      ru: ['Календарь и расписание', 'Подтверждения в WhatsApp', 'Депозиты через Stripe'],
      en: ['Calendar & schedules', 'WhatsApp confirmations', 'Stripe deposits'],
      th: ['ปฏิทินและตารางเวลา', 'ยืนยันผ่าน WhatsApp', 'มัดจำผ่าน Stripe'],
    },
  },
  {
    key: 'foreign_ready_audit',
    icon: ShieldCheck,
    title: {
      ru: 'Foreign-Ready аудит',
      en: 'Foreign-Ready audit',
      th: 'ตรวจประเมิน Foreign-Ready',
    },
    desc: {
      ru: 'Проверим заведение глазами иностранца: язык, оплата, гигиена, навигация, ожидания.',
      en: "We audit your venue through a foreigner's eyes: language, payment, hygiene, signage, expectations.",
      th: 'ตรวจร้านของคุณผ่านมุมมองชาวต่างชาติ: ภาษา การชำระเงิน สุขอนามัย ป้าย ความคาดหวัง',
    },
    bullets: {
      ru: ['Mystery-визит и отчёт', 'План исправлений за 30 дней', 'Чек-лист стандартов'],
      en: ['Mystery visit & report', '30-day fix plan', 'Standards checklist'],
      th: ['Mystery visit พร้อมรายงาน', 'แผนแก้ไขใน 30 วัน', 'เช็คลิสต์มาตรฐาน'],
    },
  },
  {
    key: 'marketing_to_expats',
    icon: Megaphone,
    title: {
      ru: 'Маркетинг для иностранцев',
      en: 'Marketing to expats & tourists',
      th: 'การตลาดสำหรับชาวต่างชาติ',
    },
    desc: {
      ru: 'Контент, фото, таргет в RU/EN сегменты, работа с лидерами мнений и Google Maps.',
      en: 'Content, photo, paid ads in RU/EN segments, influencer outreach and Google Maps optimization.',
      th: 'คอนเทนต์ ภาพถ่าย โฆษณากลุ่ม RU/EN ทำงานกับอินฟลูเอนเซอร์ และเพิ่มอันดับ Google Maps',
    },
    bullets: {
      ru: ['Контент-план RU + EN', 'Фото- и видеосессия', 'Telegram / Instagram кампании'],
      en: ['RU + EN content plan', 'Photo & video shoot', 'Telegram / Instagram campaigns'],
      th: ['แผนคอนเทนต์ RU + EN', 'ถ่ายภาพและวิดีโอ', 'แคมเปญ Telegram / Instagram'],
    },
  },
  {
    key: 'capital_restructuring',
    icon: Banknote,
    title: {
      ru: 'Капитал и реструктуризация',
      en: 'Capital & restructuring',
      th: 'เงินทุนและปรับโครงสร้าง',
    },
    desc: {
      ru: 'Привлечение инвестиций, антикризис, feasibility, выход из долгов, продажа доли.',
      en: 'Raising investment, turnaround, feasibility, debt restructuring, equity sale.',
      th: 'ระดมทุน ฟื้นฟูธุรกิจ ศึกษาความเป็นไปได้ ปรับโครงสร้างหนี้ และขายหุ้นบางส่วน',
    },
    bullets: {
      ru: ['Financial review за 2 недели', 'Подготовка к инвестору', 'M&A и club sales'],
      en: ['2-week financial review', 'Investor-ready package', 'M&A and club sales'],
      th: ['ตรวจการเงินใน 2 สัปดาห์', 'แพ็กเกจพร้อมเสนอนักลงทุน', 'M&A และ club sales'],
    },
  },
  {
    key: 'staff_visas',
    icon: Users,
    title: {
      ru: 'Персонал и визы',
      en: 'Staff & visas',
      th: 'พนักงานและวีซ่า',
    },
    desc: {
      ru: 'Work permit и BOI, найм русско/англоязычного персонала, обучение сервису для иностранцев.',
      en: 'Work permit & BOI, hiring RU/EN-speaking staff, foreigner-service training.',
      th: 'Work permit และ BOI จ้างพนักงานพูด RU/EN และฝึกอบรมบริการชาวต่างชาติ',
    },
    bullets: {
      ru: ['Work permit для экспатов', 'Подбор персонала', 'Сервис-стандарты для иностранцев'],
      en: ['Expat work permits', 'Recruitment', 'Foreigner service standards'],
      th: ['Work permit สำหรับชาวต่างชาติ', 'จัดหาพนักงาน', 'มาตรฐานบริการสำหรับชาวต่างชาติ'],
    },
  },
  {
    key: 'concierge_distribution',
    icon: Sparkles,
    title: {
      ru: 'Дистрибуция через myUNO',
      en: 'Distribution via myUNO',
      th: 'จัดจำหน่ายผ่าน myUNO',
    },
    desc: {
      ru: 'Витрина в супераппе, маршрутизация консьержа, отзывы, повторные клиенты, реферальная сеть.',
      en: 'Storefront in the super-app, concierge routing, reviews, repeat customers, referral network.',
      th: 'หน้าร้านในซูเปอร์แอป ส่งลูกค้าจากคอนเซียร์จ รีวิว ลูกค้าซ้ำ และเครือข่ายแนะนำ',
    },
    bullets: {
      ru: ['Профиль на myUNO', 'Лиды от консьержа', 'Программа лояльности'],
      en: ['myUNO profile', 'Concierge-routed leads', 'Loyalty program'],
      th: ['โปรไฟล์บน myUNO', 'ลีดจากคอนเซียร์จ', 'โปรแกรมสะสมแต้ม'],
    },
  },
];

const BUSINESS_TYPES: Array<{ value: string; label: Tri }> = [
  { value: 'restaurant', label: { ru: 'Ресторан / бар', en: 'Restaurant / bar', th: 'ร้านอาหาร / บาร์' } },
  { value: 'salon', label: { ru: 'Салон / СПА', en: 'Salon / spa', th: 'ซาลอน / สปา' } },
  { value: 'clinic', label: { ru: 'Клиника', en: 'Clinic', th: 'คลินิก' } },
  { value: 'school', label: { ru: 'Школа / детсад', en: 'School / kindergarten', th: 'โรงเรียน / อนุบาล' } },
  { value: 'venue', label: { ru: 'Венье / отель', en: 'Venue / hotel', th: 'สถานที่ / โรงแรม' } },
  { value: 'retail', label: { ru: 'Магазин / ритейл', en: 'Retail', th: 'ร้านค้าปลีก' } },
  { value: 'service', label: { ru: 'Услуга', en: 'Service', th: 'บริการ' } },
  { value: 'other', label: { ru: 'Другое', en: 'Other', th: 'อื่นๆ' } },
];

// ── UI string bundles (RU / EN / TH) ───────────────────────────────────────
const UI = {
  metaTitle: {
    ru: 'myUNO для бизнеса Пхукета — Foreign-Ready услуги | myUNO',
    en: 'myUNO for Phuket Business — Foreign-Ready services | myUNO',
    th: 'myUNO สำหรับธุรกิจภูเก็ต — บริการ Foreign-Ready | myUNO',
  },
  metaDesc: {
    ru: 'Подготовим ваш ресторан, салон, клинику или венье к работе с иностранцами: меню, сайт, бронирование, маркетинг, капитал, реструктуризация, визы и дистрибуция через myUNO.',
    en: 'We make your restaurant, salon, clinic or venue foreign-ready: menus, website, bookings, marketing, capital, restructuring, visas and distribution via myUNO.',
    th: 'เตรียมร้านอาหาร ซาลอน คลินิก หรือสถานที่ของคุณให้พร้อมต้อนรับชาวต่างชาติ: เมนู เว็บไซต์ ระบบจอง การตลาด เงินทุน ปรับโครงสร้าง วีซ่า และจัดจำหน่ายผ่าน myUNO',
  },
  heroBadge: {
    ru: 'Для локального бизнеса Пхукета',
    en: 'For Phuket local business',
    th: 'สำหรับธุรกิจท้องถิ่นภูเก็ต',
  },
  heroTitle: {
    ru: 'Готовим ваш бизнес к иностранному клиенту',
    en: 'Get your business foreign-ready',
    th: 'เตรียมธุรกิจของคุณให้พร้อมรับลูกค้าต่างชาติ',
  },
  heroDesc: {
    ru: 'Меню, сайты, бронирование, маркетинг, капитал, визы и дистрибуция — один партнёр на весь цикл.',
    en: 'Menus, websites, bookings, marketing, capital, visas and distribution — one partner end-to-end.',
    th: 'เมนู เว็บไซต์ ระบบจอง การตลาด เงินทุน วีซ่า และการจัดจำหน่าย — พาร์ทเนอร์เดียวครบวงจร',
  },
  ctaInquiry: { ru: 'Оставить заявку', en: 'Send inquiry', th: 'ส่งคำขอ' },
  ctaPartner: {
    ru: 'Стать партнёром маркетплейса',
    en: 'Become a marketplace partner',
    th: 'เป็นพาร์ทเนอร์มาร์เก็ตเพลส',
  },
  servicesTitle: { ru: 'Меню услуг', en: 'Services menu', th: 'รายการบริการ' },
  servicesHint: {
    ru: 'Отметьте интересующие — мы соберём индивидуальное предложение.',
    en: 'Pick what you need — we will tailor a proposal.',
    th: 'เลือกรายการที่สนใจ — เราจะจัดข้อเสนอเฉพาะให้คุณ',
  },
  formTitle: { ru: 'Заявка на консультацию', en: 'Request a consultation', th: 'ขอคำปรึกษา' },
  formHint: (n: number): Tri => ({
    ru: `Выбрано услуг: ${n}. Заполните контакты — свяжемся в течение рабочего дня.`,
    en: `Services selected: ${n}. Leave your contacts — we reply within one business day.`,
    th: `เลือกบริการ: ${n} รายการ กรอกข้อมูลติดต่อ เราจะตอบกลับภายใน 1 วันทำการ`,
  }),
  bizName: { ru: 'Название бизнеса *', en: 'Business name *', th: 'ชื่อธุรกิจ *' },
  bizType: { ru: 'Тип бизнеса', en: 'Business type', th: 'ประเภทธุรกิจ' },
  bizSelect: { ru: 'Выберите...', en: 'Select...', th: 'เลือก...' },
  contactName: { ru: 'Ваше имя *', en: 'Your name *', th: 'ชื่อของคุณ *' },
  contactPhone: { ru: 'Телефон / WhatsApp', en: 'Phone / WhatsApp', th: 'โทรศัพท์ / WhatsApp' },
  note: { ru: 'Комментарий', en: 'Comment', th: 'หมายเหตุ' },
  notePh: {
    ru: 'Коротко о задаче...',
    en: 'Briefly describe your task...',
    th: 'อธิบายงานสั้นๆ...',
  },
  sending: { ru: 'Отправляем...', en: 'Sending...', th: 'กำลังส่ง...' },
  send: { ru: 'Отправить заявку', en: 'Send inquiry', th: 'ส่งคำขอ' },
  privacy: {
    ru: 'Отправляя заявку, вы соглашаетесь с обработкой данных согласно политике конфиденциальности.',
    en: 'By submitting, you agree to our privacy policy.',
    th: 'การส่งคำขอถือว่าคุณยอมรับนโยบายความเป็นส่วนตัวของเรา',
  },
  errFields: {
    ru: 'Заполните название, имя и контакт (email или телефон).',
    en: 'Fill business, name and a contact (email or phone).',
    th: 'กรุณากรอกชื่อธุรกิจ ชื่อ และช่องทางติดต่อ (อีเมลหรือโทรศัพท์)',
  },
  okSent: {
    ru: 'Заявка отправлена. Свяжемся в течение рабочего дня.',
    en: 'Inquiry sent. We will reach out within one business day.',
    th: 'ส่งคำขอแล้ว เราจะติดต่อกลับภายใน 1 วันทำการ',
  },
  errSend: {
    ru: 'Не удалось отправить заявку. Попробуйте ещё раз.',
    en: 'Could not send inquiry. Please retry.',
    th: 'ส่งคำขอไม่สำเร็จ กรุณาลองอีกครั้ง',
  },
} as const;

export default function ForBusinessPage() {
  const { language } = useLanguage();
  const t = (v: Tri) => pick(v, language);

  const navigate = useNavigate();

  const [selected, setSelected] = useState<Set<ServiceKey>>(new Set());
  const [form, setForm] = useState({
    business_name: '',
    business_type: '',
    contact_name: '',
    contact_email: '',
    contact_phone: '',
    note: '',
  });
  const [submitting, setSubmitting] = useState(false);

  const toggle = (k: ServiceKey) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(k)) next.delete(k);
      else next.add(k);
      return next;
    });
  };

  const scrollToForm = () => {
    document.getElementById('b2b-inquiry-form')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.business_name || !form.contact_name || (!form.contact_email && !form.contact_phone)) {
      toast.error(t(UI.errFields));
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        magnet_slug: 'b2b-local-business',
        full_name: form.contact_name,
        email: form.contact_email || null,
        phone: form.contact_phone || null,
        whatsapp: form.contact_phone || null,
        preferred_channel: form.contact_phone ? 'whatsapp' : 'email',
        language,
        landing_path: '/for-business',
        referer: document.referrer || null,
        context_type: 'b2b_local_business',
        context_payload: {
          business_name: form.business_name,
          business_type: form.business_type || 'other',
          services_requested: Array.from(selected),
          note: form.note || null,
        },
      };

      const { error } = await supabase.from('lead_magnet_submissions').insert(payload as never);
      if (error) throw error;

      toast.success(t(UI.okSent));
      setForm({ business_name: '', business_type: '', contact_name: '', contact_email: '', contact_phone: '', note: '' });
      setSelected(new Set());
    } catch (err) {
      console.error('[ForBusiness] submit failed', err);
      toast.error(t(UI.errSend));
    } finally {
      setSubmitting(false);
    }
  };

  const isRu = language === 'ru';

  return (
    <AppLayout showHeader={false}>
      <Helmet>
        <html lang={language} />
        <title>{t(UI.metaTitle)}</title>
        <meta name="description" content={t(UI.metaDesc)} />
      </Helmet>

      <div className="min-h-screen bg-background">
        <LandingChrome isRu={isRu} />

        {/* Hero */}
        <section className="relative overflow-hidden py-16 md:py-24 px-4">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-accent/10" />
          <div className="relative max-w-3xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45 }}
            >
              <Badge variant="secondary" className="mb-4 gap-1">
                <Building2 className="w-3.5 h-3.5" />
                {t(UI.heroBadge)}
              </Badge>
              <h1 className="text-3xl md:text-5xl font-bold font-display tracking-tight mb-4">
                {t(UI.heroTitle)}
              </h1>
              <p className="text-muted-foreground text-base md:text-lg mb-8">
                {t(UI.heroDesc)}
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button size="lg" className="gap-2" onClick={scrollToForm}>
                  {t(UI.ctaInquiry)}
                  <ArrowRight className="w-4 h-4" />
                </Button>
                <Button size="lg" variant="outline" onClick={() => navigate(APP_ROUTES.FOR_LOCAL_SERVICE_PROVIDERS)}>
                  {t(UI.ctaPartner)}
                </Button>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Services menu */}
        <section className="max-w-6xl mx-auto px-4 pb-12">
          <h2 className="text-2xl md:text-3xl font-display font-semibold mb-2 text-center">
            {t(UI.servicesTitle)}
          </h2>
          <p className="text-center text-muted-foreground mb-8 text-sm">
            {t(UI.servicesHint)}
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {SERVICES.map((s, i) => {
              const isOn = selected.has(s.key);
              const title = t(s.title);
              return (
                <motion.div
                  key={s.key}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.03 * i, duration: 0.3 }}
                >
                  <Card
                    onClick={() => toggle(s.key)}
                    className={`h-full cursor-pointer transition-colors border ${
                      isOn ? 'border-primary bg-primary/5' : 'border-border/80 hover:border-primary/40'
                    }`}
                  >
                    <CardContent className="pt-5 pb-5 flex flex-col gap-3">
                      <div className="flex items-start justify-between gap-2">
                        <s.icon className="w-8 h-8 text-primary" />
                        <Checkbox checked={isOn} onCheckedChange={() => toggle(s.key)} aria-label={title} />
                      </div>
                      <div>
                        <h3 className="font-display font-semibold text-base mb-1">
                          {title}
                        </h3>
                        <p className="text-xs text-muted-foreground mb-2">
                          {t(s.desc)}
                        </p>
                        <ul className="text-xs text-muted-foreground space-y-1">
                          {pick(s.bullets, language).map((b) => (
                            <li key={b} className="flex gap-1.5">
                              <span className="text-primary">•</span>
                              <span>{b}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </section>

        {/* Inquiry form */}
        <section id="b2b-inquiry-form" className="max-w-2xl mx-auto px-4 pb-20 pt-4">
          <Card className="border-border/80">
            <CardContent className="pt-6">
              <h2 className="text-xl md:text-2xl font-display font-semibold mb-1">
                {t(UI.formTitle)}
              </h2>
              <p className="text-sm text-muted-foreground mb-5">
                {t(UI.formHint(selected.size))}
              </p>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="biz-name">{t(UI.bizName)}</Label>
                    <Input
                      id="biz-name"
                      value={form.business_name}
                      onChange={(e) => setForm({ ...form, business_name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="biz-type">{t(UI.bizType)}</Label>
                    <select
                      id="biz-type"
                      className="flex h-10 w-full border border-input bg-background px-3 py-2 text-sm"
                      value={form.business_type}
                      onChange={(e) => setForm({ ...form, business_type: e.target.value })}
                    >
                      <option value="">{t(UI.bizSelect)}</option>
                      {BUSINESS_TYPES.map((b) => (
                        <option key={b.value} value={b.value}>
                          {t(b.label)}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="contact-name">{t(UI.contactName)}</Label>
                  <Input
                    id="contact-name"
                    value={form.contact_name}
                    onChange={(e) => setForm({ ...form, contact_name: e.target.value })}
                    required
                  />
                </div>
                <div className="grid sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="contact-email">Email</Label>
                    <Input
                      id="contact-email"
                      type="email"
                      value={form.contact_email}
                      onChange={(e) => setForm({ ...form, contact_email: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="contact-phone">{t(UI.contactPhone)}</Label>
                    <Input
                      id="contact-phone"
                      type="tel"
                      value={form.contact_phone}
                      onChange={(e) => setForm({ ...form, contact_phone: e.target.value })}
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="note">{t(UI.note)}</Label>
                  <Textarea
                    id="note"
                    rows={3}
                    value={form.note}
                    onChange={(e) => setForm({ ...form, note: e.target.value })}
                    placeholder={t(UI.notePh)}
                  />
                </div>
                <Button type="submit" size="lg" className="w-full gap-2" disabled={submitting}>
                  <Send className="w-4 h-4" />
                  {submitting ? t(UI.sending) : t(UI.send)}
                </Button>
                <p className="text-[11px] text-muted-foreground text-center">
                  {t(UI.privacy)}
                </p>
              </form>
            </CardContent>
          </Card>
        </section>
      </div>
    </AppLayout>
  );
}
