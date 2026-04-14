/**
 * Public landing — local service providers (vendors on myUNO marketplace).
 */
import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { APP_ROUTES } from '@/lib/config/routes';
import {
  Store, CalendarDays, Banknote, ShieldCheck, ArrowRight, Wrench,
} from 'lucide-react';

const benefits = [
  {
    icon: Store,
    titleEn: 'Your storefront on myUNO',
    titleRu: 'Витрина на myUNO',
    descEn: 'Services, pricing, and booking-ready listings for residents and tourists.',
    descRu: 'Услуги, цены и бронирование для резидентов и туристов.',
  },
  {
    icon: CalendarDays,
    titleEn: 'Orders & calendar',
    titleRu: 'Заказы и календарь',
    descEn: 'Accept jobs, sync availability, and reduce WhatsApp chaos.',
    descRu: 'Приём заказов, доступность, меньше хаоса в WhatsApp.',
  },
  {
    icon: Banknote,
    titleEn: 'Payouts & transparency',
    titleRu: 'Выплаты и прозрачность',
    descEn: 'Track earnings and platform fees in one vendor dashboard.',
    descRu: 'Доходы и комиссии платформы в одной панели.',
  },
  {
    icon: ShieldCheck,
    titleEn: 'Trust & quality',
    titleRu: 'Доверие и качество',
    descEn: 'Reviews, repeat customers, and concierge referrals.',
    descRu: 'Отзывы, повторные клиенты и рефералы консьержа.',
  },
];

export default function ForLocalServices() {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const isRu = language === 'ru';

  return (
    <>
      <Helmet>
        <title>
          {isRu
            ? 'Локальным сервисам Пхукета — myUNO | Партнёрская программа'
            : 'Local services Phuket — myUNO | Partner program'}
        </title>
        <meta
          name="description"
          content={
            isRu
              ? 'Подключайте клининг, ремонт, туры и другие услуги к маркетплейсу myUNO. Заявка и онбординг партнёра.'
              : 'Connect cleaning, repairs, tours and more to the myUNO marketplace. Partner application and onboarding.'
          }
        />
      </Helmet>

      <div className="min-h-screen bg-background">
        <section className="relative overflow-hidden py-16 md:py-24 px-4">
          <div className="absolute inset-0 bg-gradient-to-br from-accent/10 via-background to-primary/10" />
          <div className="relative max-w-3xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45 }}
            >
              <Badge variant="secondary" className="mb-4 gap-1">
                <Wrench className="w-3.5 h-3.5" />
                {isRu ? 'Для поставщиков услуг' : 'For service providers'}
              </Badge>
              <h1 className="text-3xl md:text-5xl font-bold font-display tracking-tight mb-4">
                {isRu
                  ? 'Клиенты из супераппа — на ваш календарь'
                  : 'Super-app customers — on your calendar'}
              </h1>
              <p className="text-muted-foreground text-base md:text-lg mb-8">
                {isRu
                  ? 'Резиденты, туристы и консьерж маршрутизируют запросы в проверенных партнёров.'
                  : 'Residents, tourists, and concierge route requests to verified partners.'}
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button size="lg" className="gap-2" onClick={() => navigate(APP_ROUTES.VENDOR_JOIN)}>
                  {isRu ? 'Стать партнёром' : 'Become a partner'}
                  <ArrowRight className="w-4 h-4" />
                </Button>
                <Button size="lg" variant="outline" onClick={() => navigate(APP_ROUTES.BECOME_PARTNER)}>
                  {isRu ? 'Корпоративное партнёрство' : 'Corporate partnership'}
                </Button>
              </div>
            </motion.div>
          </div>
        </section>

        <section className="max-w-5xl mx-auto px-4 pb-16 grid sm:grid-cols-2 gap-4">
          {benefits.map((b, i) => (
            <motion.div
              key={b.titleEn}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 * i, duration: 0.35 }}
            >
              <Card className="h-full border-border/80">
                <CardContent className="pt-6">
                  <b.icon className="w-8 h-8 text-primary mb-3" />
                  <h2 className="font-display font-semibold text-lg mb-1">
                    {isRu ? b.titleRu : b.titleEn}
                  </h2>
                  <p className="text-sm text-muted-foreground">{isRu ? b.descRu : b.descEn}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </section>

        <section className="max-w-3xl mx-auto px-4 pb-20 text-center space-y-4">
          <Button variant="secondary" onClick={() => navigate(APP_ROUTES.LIST_WITH_US)}>
            {isRu ? 'Разместить объект или услугу' : 'List a property or service'}
          </Button>
          <p className="text-xs text-muted-foreground">
            {isRu
              ? 'Уже есть аккаунт — войдите и откройте панель вендора из профиля.'
              : 'Already have an account — sign in and open the vendor panel from your profile.'}
          </p>
        </section>
      </div>
    </>
  );
}
