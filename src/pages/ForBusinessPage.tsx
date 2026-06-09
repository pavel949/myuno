/**
 * Public landing — myUNO for Local Business.
 * B2B services menu for local Phuket businesses (F&B, salons, clinics, schools, venues)
 * that want to become "foreign-ready": menu localization, websites, booking systems,
 * marketing to expats, capital & restructuring, staff & visas, concierge distribution.
 */
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Helmet } from 'react-helmet-async';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';
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
  titleRu: string;
  titleEn: string;
  descRu: string;
  descEn: string;
  bulletsRu: string[];
  bulletsEn: string[];
}

const SERVICES: ServicePack[] = [
  {
    key: 'menu_localization',
    icon: Languages,
    titleRu: 'Локализация меню и контента',
    titleEn: 'Menu & content localization',
    descRu: 'Перевод и адаптация меню, прайс-листов, табличек, скриптов сервиса на RU / EN / CN.',
    descEn: 'Translation and adaptation of menus, price-lists, signage, and service scripts in RU / EN / CN.',
    bulletsRu: ['Меню в PDF + QR', 'Адаптация под вкусы иностранцев', 'Аллергены и halal/veg маркировка'],
    bulletsEn: ['PDF + QR menus', 'Adapted to foreign palate', 'Allergens & halal/veg labels'],
  },
  {
    key: 'website_builder',
    icon: Globe,
    titleRu: 'Сайт под ключ',
    titleEn: 'Website built for you',
    descRu: 'Двухъязычный сайт с фото, картой, отзывами и онлайн-заявкой. Хостинг и SEO включены.',
    descEn: 'Bilingual website with photos, map, reviews and online inquiries. Hosting & SEO included.',
    bulletsRu: ['Домен и SSL', 'Google Business + TripAdvisor', 'Аналитика и формы лидов'],
    bulletsEn: ['Domain & SSL', 'Google Business + TripAdvisor', 'Analytics & lead forms'],
  },
  {
    key: 'booking_system',
    icon: CalendarCheck,
    titleRu: 'Система бронирования',
    titleEn: 'Booking system setup',
    descRu: 'Онлайн-бронь столов, услуг, кабинетов с напоминаниями в WhatsApp и оплатой.',
    descEn: 'Online booking of tables, services and rooms with WhatsApp reminders and payments.',
    bulletsRu: ['Календарь и расписание', 'Подтверждения в WhatsApp', 'Депозиты через Stripe'],
    bulletsEn: ['Calendar & schedules', 'WhatsApp confirmations', 'Stripe deposits'],
  },
  {
    key: 'foreign_ready_audit',
    icon: ShieldCheck,
    titleRu: 'Foreign-Ready аудит',
    titleEn: 'Foreign-Ready audit',
    descRu: 'Проверим заведение глазами иностранца: язык, оплата, гигиена, навигация, ожидания.',
    descEn: 'We audit your venue through a foreigner\'s eyes: language, payment, hygiene, signage, expectations.',
    bulletsRu: ['Mystery-визит и отчёт', 'План исправлений за 30 дней', 'Чек-лист стандартов'],
    bulletsEn: ['Mystery visit & report', '30-day fix plan', 'Standards checklist'],
  },
  {
    key: 'marketing_to_expats',
    icon: Megaphone,
    titleRu: 'Маркетинг для иностранцев',
    titleEn: 'Marketing to expats & tourists',
    descRu: 'Контент, фото, таргет в RU/EN сегменты, работа с лидерами мнений и Google Maps.',
    descEn: 'Content, photo, paid ads in RU/EN segments, influencer outreach and Google Maps optimization.',
    bulletsRu: ['Контент-план RU + EN', 'Фото- и видеосессия', 'Telegram / Instagram кампании'],
    bulletsEn: ['RU + EN content plan', 'Photo & video shoot', 'Telegram / Instagram campaigns'],
  },
  {
    key: 'capital_restructuring',
    icon: Banknote,
    titleRu: 'Капитал и реструктуризация',
    titleEn: 'Capital & restructuring',
    descRu: 'Привлечение инвестиций, антикризис, feasibility, выход из долгов, продажа доли.',
    descEn: 'Raising investment, turnaround, feasibility, debt restructuring, equity sale.',
    bulletsRu: ['Financial review за 2 недели', 'Подготовка к инвестору', 'M&A и club sales'],
    bulletsEn: ['2-week financial review', 'Investor-ready package', 'M&A and club sales'],
  },
  {
    key: 'staff_visas',
    icon: Users,
    titleRu: 'Персонал и визы',
    titleEn: 'Staff & visas',
    descRu: 'Work permit и BOI, найм русско/англоязычного персонала, обучение сервису для иностранцев.',
    descEn: 'Work permit & BOI, hiring RU/EN-speaking staff, foreigner-service training.',
    bulletsRu: ['Work permit для экспатов', 'Подбор персонала', 'Сервис-стандарты для иностранцев'],
    bulletsEn: ['Expat work permits', 'Recruitment', 'Foreigner service standards'],
  },
  {
    key: 'concierge_distribution',
    icon: Sparkles,
    titleRu: 'Дистрибуция через myUNO',
    titleEn: 'Distribution via myUNO',
    descRu: 'Витрина в супераппе, маршрутизация консьержа, отзывы, повторные клиенты, реферальная сеть.',
    descEn: 'Storefront in the super-app, concierge routing, reviews, repeat customers, referral network.',
    bulletsRu: ['Профиль на myUNO', 'Лиды от консьержа', 'Программа лояльности'],
    bulletsEn: ['myUNO profile', 'Concierge-routed leads', 'Loyalty program'],
  },
];

const BUSINESS_TYPES = [
  { value: 'restaurant', ru: 'Ресторан / бар', en: 'Restaurant / bar' },
  { value: 'salon', ru: 'Салон / СПА', en: 'Salon / spa' },
  { value: 'clinic', ru: 'Клиника', en: 'Clinic' },
  { value: 'school', ru: 'Школа / детсад', en: 'School / kindergarten' },
  { value: 'venue', ru: 'Венье / отель', en: 'Venue / hotel' },
  { value: 'retail', ru: 'Магазин / ритейл', en: 'Retail' },
  { value: 'service', ru: 'Услуга', en: 'Service' },
  { value: 'other', ru: 'Другое', en: 'Other' },
];

export default function ForBusinessPage() {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const isRu = language === 'ru';

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
      toast.error(isRu ? 'Заполните название, имя и контакт (email или телефон).' : 'Fill business, name and a contact (email or phone).');
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
        language: isRu ? 'ru' : 'en',
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

      toast.success(
        isRu
          ? 'Заявка отправлена. Свяжемся в течение рабочего дня.'
          : 'Inquiry sent. We will reach out within one business day.',
      );
      setForm({ business_name: '', business_type: '', contact_name: '', contact_email: '', contact_phone: '', note: '' });
      setSelected(new Set());
    } catch (err) {
      console.error('[ForBusiness] submit failed', err);
      toast.error(isRu ? 'Не удалось отправить заявку. Попробуйте ещё раз.' : 'Could not send inquiry. Please retry.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AppLayout showHeader={false}>
      <Helmet>
        <title>
          {isRu
            ? 'myUNO для бизнеса Пхукета — Foreign-Ready услуги | myUNO'
            : 'myUNO for Phuket Business — Foreign-Ready services | myUNO'}
        </title>
        <meta
          name="description"
          content={
            isRu
              ? 'Подготовим ваш ресторан, салон, клинику или венье к работе с иностранцами: меню, сайт, бронирование, маркетинг, капитал, реструктуризация, визы и дистрибуция через myUNO.'
              : 'We make your restaurant, salon, clinic or venue foreign-ready: menus, website, bookings, marketing, capital, restructuring, visas and distribution via myUNO.'
          }
        />
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
                {isRu ? 'Для локального бизнеса Пхукета' : 'For Phuket local business'}
              </Badge>
              <h1 className="text-3xl md:text-5xl font-bold font-display tracking-tight mb-4">
                {isRu
                  ? 'Готовим ваш бизнес к иностранному клиенту'
                  : 'Get your business foreign-ready'}
              </h1>
              <p className="text-muted-foreground text-base md:text-lg mb-8">
                {isRu
                  ? 'Меню, сайты, бронирование, маркетинг, капитал, визы и дистрибуция — один партнёр на весь цикл.'
                  : 'Menus, websites, bookings, marketing, capital, visas and distribution — one partner end-to-end.'}
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button size="lg" className="gap-2" onClick={scrollToForm}>
                  {isRu ? 'Оставить заявку' : 'Send inquiry'}
                  <ArrowRight className="w-4 h-4" />
                </Button>
                <Button size="lg" variant="outline" onClick={() => navigate(APP_ROUTES.FOR_LOCAL_SERVICE_PROVIDERS)}>
                  {isRu ? 'Стать партнёром маркетплейса' : 'Become a marketplace partner'}
                </Button>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Services menu */}
        <section className="max-w-6xl mx-auto px-4 pb-12">
          <h2 className="text-2xl md:text-3xl font-display font-semibold mb-2 text-center">
            {isRu ? 'Меню услуг' : 'Services menu'}
          </h2>
          <p className="text-center text-muted-foreground mb-8 text-sm">
            {isRu
              ? 'Отметьте интересующие — мы соберём индивидуальное предложение.'
              : 'Pick what you need — we will tailor a proposal.'}
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {SERVICES.map((s, i) => {
              const isOn = selected.has(s.key);
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
                        <Checkbox checked={isOn} onCheckedChange={() => toggle(s.key)} aria-label={isRu ? s.titleRu : s.titleEn} />
                      </div>
                      <div>
                        <h3 className="font-display font-semibold text-base mb-1">
                          {isRu ? s.titleRu : s.titleEn}
                        </h3>
                        <p className="text-xs text-muted-foreground mb-2">
                          {isRu ? s.descRu : s.descEn}
                        </p>
                        <ul className="text-xs text-muted-foreground space-y-1">
                          {(isRu ? s.bulletsRu : s.bulletsEn).map((b) => (
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
                {isRu ? 'Заявка на консультацию' : 'Request a consultation'}
              </h2>
              <p className="text-sm text-muted-foreground mb-5">
                {isRu
                  ? `Выбрано услуг: ${selected.size}. Заполните контакты — свяжемся в течение рабочего дня.`
                  : `Services selected: ${selected.size}. Leave your contacts — we reply within one business day.`}
              </p>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="biz-name">{isRu ? 'Название бизнеса *' : 'Business name *'}</Label>
                    <Input
                      id="biz-name"
                      value={form.business_name}
                      onChange={(e) => setForm({ ...form, business_name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="biz-type">{isRu ? 'Тип бизнеса' : 'Business type'}</Label>
                    <select
                      id="biz-type"
                      className="flex h-10 w-full border border-input bg-background px-3 py-2 text-sm"
                      value={form.business_type}
                      onChange={(e) => setForm({ ...form, business_type: e.target.value })}
                    >
                      <option value="">{isRu ? 'Выберите...' : 'Select...'}</option>
                      {BUSINESS_TYPES.map((t) => (
                        <option key={t.value} value={t.value}>
                          {isRu ? t.ru : t.en}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="contact-name">{isRu ? 'Ваше имя *' : 'Your name *'}</Label>
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
                    <Label htmlFor="contact-phone">{isRu ? 'Телефон / WhatsApp' : 'Phone / WhatsApp'}</Label>
                    <Input
                      id="contact-phone"
                      type="tel"
                      value={form.contact_phone}
                      onChange={(e) => setForm({ ...form, contact_phone: e.target.value })}
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="note">{isRu ? 'Комментарий' : 'Comment'}</Label>
                  <Textarea
                    id="note"
                    rows={3}
                    value={form.note}
                    onChange={(e) => setForm({ ...form, note: e.target.value })}
                    placeholder={isRu ? 'Коротко о задаче...' : 'Briefly describe your task...'}
                  />
                </div>
                <Button type="submit" size="lg" className="w-full gap-2" disabled={submitting}>
                  <Send className="w-4 h-4" />
                  {submitting
                    ? isRu ? 'Отправляем...' : 'Sending...'
                    : isRu ? 'Отправить заявку' : 'Send inquiry'}
                </Button>
                <p className="text-[11px] text-muted-foreground text-center">
                  {isRu
                    ? 'Отправляя заявку, вы соглашаетесь с обработкой данных согласно политике конфиденциальности.'
                    : 'By submitting, you agree to our privacy policy.'}
                </p>
              </form>
            </CardContent>
          </Card>
        </section>
      </div>
    </AppLayout>
  );
}
