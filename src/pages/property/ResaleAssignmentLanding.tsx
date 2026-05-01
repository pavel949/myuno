/**
 * ResaleAssignmentLanding — /property/resale-landing
 *
 * Marketing landing for resale & assignment market. Submits into
 * consultation_requests via useUniversalLead (vertical='properties').
 */
import { useNavigate } from 'react-router-dom';
import {
  ArrowRightLeft,
  TrendingDown,
  ShieldCheck,
  Clock,
  ArrowRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LandingShell, LandingChecklist } from '@/components/landings/LandingShell';
import { LandingLeadForm } from '@/components/landings/LandingLeadForm';
import { APP_ROUTES } from '@/lib/config/routes';
import { useLanguage } from '@/contexts/LanguageContext';

export default function ResaleAssignmentLanding() {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const t = <T,>(p: { ru: T; en: T }): T => (isRu ? p.ru : p.en);

  return (
    <LandingShell
      eyebrow={{ ru: 'Вторичный рынок и переуступки', en: 'Resale & assignments' }}
      title={{
        ru: 'Resale & Assignment — готовые объекты и переуступки на Пхукете',
        en: 'Resale & Assignment — ready units and contract assignments in Phuket',
      }}
      subtitle={{
        ru: 'Покупайте готовые объекты ниже рынка или забирайте переуступки от частных продавцов с проверенными документами.',
        en: 'Buy ready properties below market or pick up assignments from private sellers — with documents verified for you.',
      }}
      badges={[
        { ru: 'До 15% ниже первичного рынка', en: 'Up to 15% below primary' },
        { ru: 'Проверка документов', en: 'Document check' },
        { ru: 'Эскроу через юриста', en: 'Escrow via lawyer' },
      ]}
      benefits={[
        {
          icon: TrendingDown,
          title: { ru: 'Цена ниже рынка', en: 'Below-market pricing' },
          desc: {
            ru: 'Частные продавцы и переуступки часто на 5–15% дешевле первичных предложений.',
            en: 'Private sellers and assignments often run 5–15% below primary offers.',
          },
        },
        {
          icon: ArrowRightLeft,
          title: { ru: 'Переуступка контракта', en: 'Contract assignment' },
          desc: {
            ru: 'Перенимаем DPS у застройщика — юридически и финансово чисто.',
            en: 'We transfer the developer DPS for you — legally and financially clean.',
          },
        },
        {
          icon: ShieldCheck,
          title: { ru: 'Проверка документов', en: 'Document verification' },
          desc: {
            ru: 'Юрист проверяет Чанот, обременения, задолженности и историю объекта.',
            en: 'Lawyer reviews Chanote, encumbrances, debts and full ownership trail.',
          },
        },
        {
          icon: Clock,
          title: { ru: 'Быстрое заселение', en: 'Move in fast' },
          desc: {
            ru: 'Ready-to-move объекты — без 2–3 лет ожидания первички.',
            en: 'Ready-to-move stock — skip the 2–3 year primary wait.',
          },
        },
      ]}
      formSlot={
        <LandingLeadForm
          variant="universal"
          verticalId="properties"
          universalRequestType="property_purchase"
          entryPoint="/property/resale-landing"
          topicField={{
            key: 'deal_type',
            label: { ru: 'Что интересно', en: 'Interest' },
            options: [
              { value: 'resale', label: { ru: 'Вторичка (готовый объект)', en: 'Resale (ready unit)' } },
              { value: 'assignment', label: { ru: 'Переуступка контракта', en: 'Contract assignment' } },
              { value: 'either', label: { ru: 'Любой вариант', en: 'Either' } },
            ],
          }}
          successText={{
            ru: 'Менеджер пришлёт подборку в течение 24 часов.',
            en: 'A manager will send a curated list within 24 hours.',
          }}
          submitLabel={{ ru: 'Получить подборку', en: 'Get shortlist' }}
        />
      }
      seoTitle={{
        ru: 'Resale & Assignment Пхукет — вторичка и переуступки контрактов',
        en: 'Resale & Assignment Phuket — secondary market and contract assignments',
      }}
      seoDescription={{
        ru: 'Готовые объекты ниже рынка и переуступки от частных продавцов на Пхукете. Юридическая проверка и сопровождение сделки.',
        en: 'Below-market ready units and assignments from private sellers in Phuket. Legal due diligence and full transaction support.',
      }}
    >
      <div className="rounded-none border border-border bg-card p-6">
        <h2 className="text-xl font-semibold mb-4">
          {t({ ru: 'Как это работает', en: 'How it works' })}
        </h2>
        <LandingChecklist
          items={[
            { ru: '1. Заявка — параметры и бюджет', en: '1. Submit — parameters and budget' },
            { ru: '2. Подборка 5–10 объектов в течение 24ч', en: '2. Shortlist of 5–10 units within 24h' },
            { ru: '3. Просмотры — лично или онлайн', en: '3. Viewings — in person or online' },
            { ru: '4. Юридическая проверка выбранного', en: '4. Legal due diligence on chosen unit' },
            { ru: '5. Эскроу-сделка и регистрация', en: '5. Escrow transaction and registration' },
          ]}
        />
        <div className="mt-6 flex flex-wrap gap-3">
          <Button onClick={() => navigate(APP_ROUTES.RESALE)}>
            {t({ ru: 'Смотреть каталог', en: 'Browse catalog' })}
            <ArrowRight className="h-4 w-4 ml-1" />
          </Button>
          <Button variant="outline" onClick={() => navigate(APP_ROUTES.PROPERTY_CONSULTATION)}>
            {t({ ru: 'Консультация эксперта', en: 'Expert consultation' })}
          </Button>
        </div>
      </div>
    </LandingShell>
  );
}
