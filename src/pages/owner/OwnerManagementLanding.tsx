/**
 * OwnerManagementLanding — /owner/management-landing
 *
 * Marketing landing for property owners considering full management.
 * Submits into consultation_requests via useUniversalLead. Routes power-users
 * to /mc/full-management for the in-depth wizard.
 */
import { useNavigate } from 'react-router-dom';
import {
  TrendingUp,
  Users,
  Brush,
  Shield,
  ArrowRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LandingShell, LandingChecklist } from '@/components/landings/LandingShell';
import { LandingLeadForm } from '@/components/landings/LandingLeadForm';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { APP_ROUTES } from '@/lib/config/routes';


export default function OwnerManagementLanding() {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const { user } = useAuth();
  const isRu = language === 'ru';
  const t = <T,>(p: { ru: T; en: T }): T => (isRu ? p.ru : p.en);


  return (
    <LandingShell
      eyebrow={{ ru: 'Для собственников', en: 'For property owners' }}
      title={{
        ru: 'Full Management — ваша вилла или кондо в надёжных руках',
        en: 'Full Management — your villa or condo in safe hands',
      }}
      subtitle={{
        ru: 'Мы находим гостей, встречаем, убираем, обслуживаем и платим. Вы получаете прозрачный отчёт и доход на счёт ежемесячно.',
        en: 'We find guests, check them in, clean, maintain and pay. You receive a transparent monthly report and a clean payout.',
      }}
      badges={[
        { ru: '70% / 30% после расходов', en: '70% / 30% after expenses' },
        { ru: 'Без скрытых платежей', en: 'No hidden fees' },
        { ru: 'Загрузка 80%+ в сезон', en: '80%+ occupancy in season' },
      ]}
      benefits={[
        {
          icon: TrendingUp,
          title: { ru: 'Рост доходности', en: 'Higher yield' },
          desc: {
            ru: 'Динамические цены, прямые продажи и работа с каналами повышают доходность на 20–40%.',
            en: 'Dynamic pricing, direct sales and channel ops lift yield by 20–40%.',
          },
        },
        {
          icon: Users,
          title: { ru: 'Поток гостей', en: 'Guest pipeline' },
          desc: {
            ru: 'Booking, Airbnb, Agoda, прямые продажи myUNO и русскоязычные каналы.',
            en: 'Booking, Airbnb, Agoda, direct myUNO sales and Russian-speaking channels.',
          },
        },
        {
          icon: Brush,
          title: { ru: 'Эксплуатация', en: 'Operations' },
          desc: {
            ru: 'Уборка, бельё, мелкий ремонт, чек-ин 24/7, бассейн и сад — всё на нас.',
            en: 'Cleaning, linen, minor repairs, 24/7 check-in, pool and garden — handled.',
          },
        },
        {
          icon: Shield,
          title: { ru: 'Прозрачные финансы', en: 'Transparent finance' },
          desc: {
            ru: 'Каждое движение — в кабинете собственника. Месячный P&L и выплаты по графику.',
            en: 'Every entry visible in the owner portal. Monthly P&L and on-schedule payouts.',
          },
        },
      ]}
      formSlot={
        <LandingLeadForm
          variant="universal"
          verticalId="properties"
          universalRequestType="full_management"
          entryPoint="/owner/management-landing"
          leadSource="cta"
          topicField={{
            key: 'property_type',
            label: { ru: 'Тип объекта', en: 'Property type' },
            options: [
              { value: 'villa', label: { ru: 'Вилла', en: 'Villa' } },
              { value: 'condo', label: { ru: 'Кондо', en: 'Condo' } },
              { value: 'apartment', label: { ru: 'Апартаменты', en: 'Apartment' } },
              { value: 'townhouse', label: { ru: 'Таунхаус', en: 'Townhouse' } },
              { value: 'multiple', label: { ru: 'Несколько объектов', en: 'Multiple units' } },
            ],
          }}
          messagePlaceholder={{
            ru: 'Адрес / комплекс, кол-во спален, текущая загрузка…',
            en: 'Address / complex, bedrooms, current occupancy…',
          }}
          successText={{
            ru: 'Менеджер свяжется в течение 24 часов с расчётом доходности.',
            en: 'Our manager will reach out within 24 hours with a yield estimate.',
          }}
          submitLabel={{ ru: 'Получить расчёт доходности', en: 'Get yield estimate' }}
        />
      }
      seoTitle={{
        ru: 'Управление виллами и кондо на Пхукете — Full Management myUNO',
        en: 'Villa and condo management in Phuket — myUNO Full Management',
      }}
      seoDescription={{
        ru: 'Полное управление недвижимостью на Пхукете: гости, эксплуатация, финансы. 70/30 после расходов, прозрачный отчёт, выплаты по графику.',
        en: 'End-to-end Phuket property management: guests, operations, finance. 70/30 after expenses, transparent reporting, scheduled payouts.',
      }}
    >
      <div className="rounded-none border border-border bg-card p-6">
        <h2 className="text-xl font-semibold mb-4">
          {t({ ru: 'Что входит в Full Management', en: 'What full management includes' })}
        </h2>
        <LandingChecklist
          items={[
            { ru: 'Поиск и проверка гостей', en: 'Guest sourcing and screening' },
            { ru: 'Каналы: Booking, Airbnb, Agoda, myUNO', en: 'Channels: Booking, Airbnb, Agoda, myUNO' },
            { ru: 'Чек-ин / чек-аут 24/7', en: '24/7 check-in / check-out' },
            { ru: 'Уборка и смена белья', en: 'Cleaning and linen' },
            { ru: 'Мелкий ремонт и эксплуатация', en: 'Minor repairs and ops' },
            { ru: 'Динамические цены и каналы продаж', en: 'Dynamic pricing and sales channels' },
            { ru: 'Финансовый отчёт и выплаты', en: 'Financial reporting and payouts' },
            { ru: 'Поддержка владельца на русском', en: 'Russian-speaking owner support' },
          ]}
        />
        <div className="mt-6 flex flex-wrap gap-3">
          <Button
            onClick={() => {
              if (user) {
                navigate(`${APP_ROUTES.AUTH_ACCOUNT_TYPE}?redirect=/mc/full-management`);
              } else {
                navigate(`/auth?redirect=${encodeURIComponent(APP_ROUTES.AUTH_ACCOUNT_TYPE)}`);
              }
            }}
          >
            {t({ ru: 'Стать собственником / УК', en: 'Become owner / MC' })}
            <ArrowRight className="h-4 w-4 ml-1" />
          </Button>
          <Button variant="outline" onClick={() => navigate('/mc/full-management')}>
            {t({ ru: 'Заполнить детальную заявку', en: 'Submit detailed request' })}
          </Button>
          <Button variant="ghost" onClick={() => navigate('/pricing')}>
            {t({ ru: 'Тарифы и подписки', en: 'Pricing & subscriptions' })}
          </Button>
        </div>

      </div>
    </LandingShell>
  );
}
