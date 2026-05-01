/**
 * TaxStructuringLanding — /legal/tax-structuring
 *
 * Marketing landing for tax & corporate structuring consultation. Submits into
 * consultation_requests via useUniversalLead (vertical='legal'). Power users
 * are routed to the booking flow for paid consultation.
 */
import { useNavigate } from 'react-router-dom';
import {
  Calculator,
  Building2,
  Globe2,
  ShieldCheck,
  ArrowRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LandingShell, LandingChecklist } from '@/components/landings/LandingShell';
import { LandingLeadForm } from '@/components/landings/LandingLeadForm';
import { APP_ROUTES } from '@/lib/config/routes';
import { useLanguage } from '@/contexts/LanguageContext';

export default function TaxStructuringLanding() {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const t = <T,>(p: { ru: T; en: T }): T => (isRu ? p.ru : p.en);

  return (
    <LandingShell
      eyebrow={{ ru: 'Налоги и структурирование', en: 'Tax & structuring' }}
      title={{
        ru: 'Tax & Structuring — налоговая и корпоративная структура в Таиланде',
        en: 'Tax & Structuring — Thai tax and corporate setup, done right',
      }}
      subtitle={{
        ru: 'Помогаем выстроить структуру владения, оптимизировать налоги и работать в Таиланде без сюрпризов от налоговой и иммиграции.',
        en: 'We design ownership structure, optimise taxes and keep you compliant with Thai tax and immigration — no surprises.',
      }}
      badges={[
        { ru: 'Лицензированные юристы', en: 'Licensed lawyers' },
        { ru: 'Английский и русский', en: 'English & Russian' },
        { ru: 'Online или в офисе', en: 'Online or in-office' },
      ]}
      benefits={[
        {
          icon: Calculator,
          title: { ru: 'Налоговая оптимизация', en: 'Tax optimisation' },
          desc: {
            ru: 'Аренда, дивиденды, прирост капитала — структурируем под ваш кейс.',
            en: 'Rental, dividends, capital gains — structured for your specific case.',
          },
        },
        {
          icon: Building2,
          title: { ru: 'Тайская компания', en: 'Thai company setup' },
          desc: {
            ru: 'Регистрация, директора, бухгалтерия и работающая структура без номиналов.',
            en: 'Registration, directors, accounting and a real structure — no nominees.',
          },
        },
        {
          icon: Globe2,
          title: { ru: 'Международный контекст', en: 'Cross-border view' },
          desc: {
            ru: 'Учитываем ваше резидентство, валютный контроль и риски CRS.',
            en: 'We factor in your residency, FX controls and CRS exposure.',
          },
        },
        {
          icon: ShieldCheck,
          title: { ru: 'Соответствие закону', en: 'Full compliance' },
          desc: {
            ru: 'Декларации, FBAR-аналоги, отчётность — всё под лицензированным юристом.',
            en: 'Filings, FBAR analogues, reporting — under a licensed Thai lawyer.',
          },
        },
      ]}
      formSlot={
        <LandingLeadForm
          variant="universal"
          verticalId="legal"
          universalRequestType="tax_structuring"
          entryPoint="/legal/tax-structuring"
          topicField={{
            key: 'topic',
            label: { ru: 'Тема консультации', en: 'Topic' },
            options: [
              { value: 'rental_tax', label: { ru: 'Налог с аренды', en: 'Rental tax' } },
              { value: 'company_setup', label: { ru: 'Открытие компании', en: 'Company setup' } },
              { value: 'property_purchase', label: { ru: 'Покупка недвижимости', en: 'Property purchase' } },
              { value: 'residency', label: { ru: 'Налоговое резидентство', en: 'Tax residency' } },
              { value: 'crs_intl', label: { ru: 'CRS / международный', en: 'CRS / cross-border' } },
              { value: 'other', label: { ru: 'Другое', en: 'Other' } },
            ],
          }}
          messagePlaceholder={{
            ru: 'Коротко о ситуации: резидентство, активы, цель…',
            en: 'Briefly: residency, assets, goal…',
          }}
          successText={{
            ru: 'Юрист свяжется в течение 24 часов и предложит слот.',
            en: 'A lawyer will reach out within 24 hours with a consultation slot.',
          }}
          submitLabel={{ ru: 'Запросить консультацию', en: 'Request consultation' }}
        />
      }
      seoTitle={{
        ru: 'Налоговое структурирование на Пхукете — Tax & Structuring myUNO',
        en: 'Tax & Structuring in Phuket — myUNO advisory',
      }}
      seoDescription={{
        ru: 'Налоги, тайская компания, структура владения и международный контекст. Лицензированные юристы myUNO на русском и английском.',
        en: 'Tax, Thai company, ownership structure and cross-border setup. Licensed myUNO lawyers in English and Russian.',
      }}
    >
      <div className="rounded-none border border-border bg-card p-6">
        <h2 className="text-xl font-semibold mb-4">
          {t({ ru: 'Когда это нужно', en: 'When you need this' })}
        </h2>
        <LandingChecklist
          items={[
            { ru: 'Покупка недвижимости от $200K', en: 'Buying property from $200K' },
            { ru: 'Сдача в аренду — официально', en: 'Renting out — officially' },
            { ru: 'Открытие или покупка бизнеса', en: 'Opening or buying a business' },
            { ru: 'Переезд на 180+ дней в году', en: 'Relocating for 180+ days/year' },
            { ru: 'Получение Elite / LTR визы', en: 'Applying for Elite / LTR visa' },
            { ru: 'Корпоративное владение виллой', en: 'Corporate villa ownership' },
          ]}
        />
        <div className="mt-6 flex flex-wrap gap-3">
          <Button onClick={() => navigate(APP_ROUTES.LEGAL_BOOKING('tax-consultation'))}>
            {t({ ru: 'Забронировать консультацию ฿2,000', en: 'Book consultation ฿2,000' })}
            <ArrowRight className="h-4 w-4 ml-1" />
          </Button>
          <Button variant="outline" onClick={() => navigate(APP_ROUTES.TAX_NAV)}>
            {t({ ru: 'Пройти tax quiz', en: 'Take the tax quiz' })}
          </Button>
        </div>
      </div>
    </LandingShell>
  );
}
