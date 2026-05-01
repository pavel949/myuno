/**
 * ClearViewForDevelopersLanding — /clearview/for-developers
 *
 * B2B landing for developers/sales offices: positions ClearView as a trust
 * accelerator (independent rating + audit + buyer-facing badge).
 * Lead pipeline: useUniversalLead (vertical='properties').
 */
import { useNavigate } from 'react-router-dom';
import {
  ShieldCheck,
  BadgeCheck,
  TrendingUp,
  FileSearch,
  ArrowRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LandingShell, LandingChecklist } from '@/components/landings/LandingShell';
import { LandingLeadForm } from '@/components/landings/LandingLeadForm';
import { APP_ROUTES } from '@/lib/config/routes';
import { useLanguage } from '@/contexts/LanguageContext';

export default function ClearViewForDevelopersLanding() {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const t = <T,>(p: { ru: T; en: T }): T => (isRu ? p.ru : p.en);

  return (
    <LandingShell
      eyebrow={{ ru: 'ClearView для застройщиков', en: 'ClearView for developers' }}
      title={{
        ru: 'ClearView™ — независимый рейтинг вашего проекта',
        en: 'ClearView™ — independent rating for your project',
      }}
      subtitle={{
        ru: 'Получите независимую оценку проекта по 8 критериям и публичный бейдж AAA–CCC. Это снимает 70% возражений русскоязычного покупателя ещё до встречи.',
        en: 'Get an independent 8-criteria project rating and a public AAA–CCC badge. Removes 70% of Russian-speaking buyers’ objections before the first meeting.',
      }}
      badges={[
        { ru: 'Отчёт за 15 рабочих дней', en: 'Report in 15 business days' },
        { ru: 'Бейдж на myUNO', en: 'Badge on myUNO' },
        { ru: '8 категорий, 100 баллов', en: '8 categories, 100 points' },
      ]}
      benefits={[
        {
          icon: ShieldCheck,
          title: { ru: 'Независимая проверка', en: 'Independent verification' },
          desc: {
            ru: 'Юридический статус, девелопер, стройка, финансы, ликвидность — проверено внешним аудитором.',
            en: 'Legal status, developer, construction, finance, liquidity — verified by an external auditor.',
          },
        },
        {
          icon: BadgeCheck,
          title: { ru: 'Публичный бейдж', en: 'Public badge' },
          desc: {
            ru: 'Рейтинг AAA–CCC отображается на карточке проекта и в материалах продажников.',
            en: 'AAA–CCC rating displayed on the project card and in sales collateral.',
          },
        },
        {
          icon: TrendingUp,
          title: { ru: 'Конверсия выше', en: 'Higher conversion' },
          desc: {
            ru: 'Покупатель видит «третью сторону» — закрывает возражения по доверию до встречи.',
            en: 'Buyers see a third-party signal — trust objections close before the meeting.',
          },
        },
        {
          icon: FileSearch,
          title: { ru: 'Полный отчёт PDF', en: 'Full PDF report' },
          desc: {
            ru: 'Детальный отчёт со скорингом, замечаниями и рекомендациями для использования в продажах.',
            en: 'Detailed scoring, findings and recommendations — usable in your sales process.',
          },
        },
      ]}
      formSlot={
        <LandingLeadForm
          variant="universal"
          verticalId="properties"
          universalRequestType="clearview_developer"
          entryPoint="/clearview/for-developers"
          topicField={{
            key: 'project_stage',
            label: { ru: 'Стадия проекта', en: 'Project stage' },
            options: [
              { value: 'pre_sale', label: { ru: 'До старта продаж', en: 'Pre-sale' } },
              { value: 'selling', label: { ru: 'В продаже', en: 'Selling' } },
              { value: 'construction', label: { ru: 'На стройке', en: 'Under construction' } },
              { value: 'ready', label: { ru: 'Готовый', en: 'Ready' } },
            ],
          }}
          successText={{
            ru: 'Менеджер ClearView свяжется в течение 24 часов и пришлёт scope-документ.',
            en: 'A ClearView manager will reach out within 24 hours with the scope document.',
          }}
          submitLabel={{ ru: 'Заказать рейтинг', en: 'Request rating' }}
        />
      }
      seoTitle={{
        ru: 'ClearView для застройщиков — независимый рейтинг проектов Пхукета',
        en: 'ClearView for developers — independent project rating in Phuket',
      }}
      seoDescription={{
        ru: 'Закажите независимый рейтинг ClearView™ AAA–CCC для своего проекта. 8 категорий, отчёт за 15 дней, публичный бейдж на myUNO.',
        en: 'Order an independent ClearView™ AAA–CCC rating for your project. 8 categories, 15-day report, public badge on myUNO.',
      }}
    >
      <div className="rounded-none border border-border bg-card p-6">
        <h2 className="text-xl font-semibold mb-4">
          {t({ ru: 'Что входит в рейтинг', en: 'What the rating covers' })}
        </h2>
        <LandingChecklist
          items={[
            { ru: 'Юридический статус — 20%', en: 'Legal status — 20%' },
            { ru: 'Девелопер и репутация — 20%', en: 'Developer and track record — 20%' },
            { ru: 'Строительство — 15%', en: 'Construction — 15%' },
            { ru: 'Локация — 15%', en: 'Location — 15%' },
            { ru: 'Финансы — 10%', en: 'Financial — 10%' },
            { ru: 'ROI и доходность — 10%', en: 'ROI and yield — 10%' },
            { ru: 'Продажи — 5%', en: 'Sales — 5%' },
            { ru: 'Ликвидность — 5%', en: 'Liquidity — 5%' },
          ]}
        />
        <div className="mt-6 flex flex-wrap gap-3">
          <Button onClick={() => navigate(APP_ROUTES.CLEARVIEW)}>
            {t({ ru: 'Подробнее о методологии', en: 'See methodology' })}
            <ArrowRight className="h-4 w-4 ml-1" />
          </Button>
          <Button variant="outline" onClick={() => navigate(APP_ROUTES.DEVELOPER_PORTAL_APPLY)}>
            {t({ ru: 'Стать партнёром-застройщиком', en: 'Become developer partner' })}
          </Button>
        </div>
      </div>
    </LandingShell>
  );
}
