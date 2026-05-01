/**
 * StorefrontDemoLanding — /owner/storefront-demo
 *
 * Marketing landing for MC Private Storefront feature (`/b/:slug`).
 * Lead pipeline: useUniversalLead (vertical='properties').
 */
import { useNavigate } from 'react-router-dom';
import {
  Globe,
  Palette,
  CalendarCheck,
  BarChart3,
  ArrowRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LandingShell, LandingChecklist } from '@/components/landings/LandingShell';
import { LandingLeadForm } from '@/components/landings/LandingLeadForm';
import { APP_ROUTES } from '@/lib/config/routes';
import { useLanguage } from '@/contexts/LanguageContext';

export default function StorefrontDemoLanding() {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const t = <T,>(p: { ru: T; en: T }): T => (isRu ? p.ru : p.en);

  return (
    <LandingShell
      eyebrow={{ ru: 'Для управляющих компаний', en: 'For management companies' }}
      title={{
        ru: 'Брендированная витрина — ваш сайт за 1 день',
        en: 'Branded storefront — your site in 1 day',
      }}
      subtitle={{
        ru: 'Получите публичный сайт со своим доменом, логотипом и каталогом объектов. Бронирования идут напрямую к вам, синхронизированы с PMS myUNO.',
        en: 'Get a public site with your own domain, logo and inventory. Bookings flow directly to you, synced with myUNO PMS.',
      }}
      badges={[
        { ru: '0% комиссии за прямые брони', en: '0% commission on direct bookings' },
        { ru: 'iCal/Channel Manager', en: 'iCal / Channel Manager' },
        { ru: 'RU + EN', en: 'RU + EN' },
      ]}
      benefits={[
        {
          icon: Globe,
          title: { ru: 'Свой домен и бренд', en: 'Your domain and brand' },
          desc: {
            ru: 'Подключите вашdomain.com или используйте myuno.app/b/your-brand. Логотип, цвета, шрифты — ваши.',
            en: 'Connect yourdomain.com or use myuno.app/b/your-brand. Logo, colours and fonts — yours.',
          },
        },
        {
          icon: Palette,
          title: { ru: 'Каталог из PMS', en: 'Catalog from PMS' },
          desc: {
            ru: 'Объекты, цены, доступность подтягиваются из вашего myUNO PMS автоматически.',
            en: 'Properties, pricing and availability pull from your myUNO PMS automatically.',
          },
        },
        {
          icon: CalendarCheck,
          title: { ru: 'Прямые бронирования', en: 'Direct bookings' },
          desc: {
            ru: 'Гость бронирует прямо у вас — без комиссии Booking/Airbnb. Оплата через Stripe.',
            en: 'Guests book directly with you — no Booking/Airbnb fee. Stripe payments built-in.',
          },
        },
        {
          icon: BarChart3,
          title: { ru: 'Аналитика и SEO', en: 'Analytics and SEO' },
          desc: {
            ru: 'Google Analytics, sitemap, мета-теги. Изолированно от других MC.',
            en: 'Google Analytics, sitemap, meta tags. Isolated from other MCs.',
          },
        },
      ]}
      formSlot={
        <LandingLeadForm
          variant="universal"
          verticalId="properties"
          universalRequestType="storefront_demo"
          entryPoint="/owner/storefront-demo"
          topicField={{
            key: 'inventory_size',
            label: { ru: 'Размер портфеля', en: 'Portfolio size' },
            options: [
              { value: '1-5', label: { ru: '1–5 объектов', en: '1–5 properties' } },
              { value: '6-20', label: { ru: '6–20 объектов', en: '6–20 properties' } },
              { value: '21-50', label: { ru: '21–50 объектов', en: '21–50 properties' } },
              { value: '50+', label: { ru: '50+ объектов', en: '50+ properties' } },
            ],
          }}
          successText={{
            ru: 'Покажем демо и развернём вашу витрину за 1 день.',
            en: 'We will demo and spin up your storefront in 1 day.',
          }}
          submitLabel={{ ru: 'Запросить демо', en: 'Request demo' }}
        />
      }
      seoTitle={{
        ru: 'Брендированная витрина для управляющих компаний — myUNO',
        en: 'Branded storefront for management companies — myUNO',
      }}
      seoDescription={{
        ru: 'Публичный сайт под вашим брендом, синхронизированный с PMS myUNO. Прямые брони без комиссии, RU+EN, домен.',
        en: 'Public branded site synced with myUNO PMS. Direct commission-free bookings, RU+EN, custom domain.',
      }}
    >
      <div className="rounded-none border border-border bg-card p-6">
        <h2 className="text-xl font-semibold mb-4">
          {t({ ru: 'Что вы получаете', en: 'What you get' })}
        </h2>
        <LandingChecklist
          items={[
            { ru: 'Поддомен myuno.app/b/your-brand или свой домен', en: 'Subdomain myuno.app/b/your-brand or own domain' },
            { ru: 'Логотип, фирменные цвета, шрифты', en: 'Logo, brand colours, fonts' },
            { ru: 'Каталог объектов с фильтрами и картой', en: 'Inventory catalog with filters and map' },
            { ru: 'Stripe-чекаут для прямых броней', en: 'Stripe checkout for direct bookings' },
            { ru: 'Изоляция от других MC (RLS)', en: 'Isolation from other MCs (RLS)' },
            { ru: 'iCal-sync с Booking, Airbnb, Agoda', en: 'iCal sync with Booking, Airbnb, Agoda' },
          ]}
        />
        <div className="mt-6 flex flex-wrap gap-3">
          <Button onClick={() => navigate(APP_ROUTES.FOR_MANAGEMENT_COMPANIES)}>
            {t({ ru: 'Полный обзор для MC', en: 'Full MC overview' })}
            <ArrowRight className="h-4 w-4 ml-1" />
          </Button>
          <Button variant="outline" onClick={() => navigate(APP_ROUTES.OWNER_MANAGEMENT_LANDING)}>
            {t({ ru: 'Доверить управление myUNO', en: 'Outsource management to myUNO' })}
          </Button>
        </div>
      </div>
    </LandingShell>
  );
}
