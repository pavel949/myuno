/**
 * CapitalAdvisoryLanding — /invest/capital-advisory
 *
 * High-net-worth investor landing. Submits into capital_intro_requests via
 * useCapitalIntroRequest with request_type='capital_advisory'.
 */
import { useNavigate } from 'react-router-dom';
import {
  ShieldCheck,
  Compass,
  Handshake,
  TrendingUp,
  ArrowRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LandingShell, LandingChecklist } from '@/components/landings/LandingShell';
import { LandingLeadForm } from '@/components/landings/LandingLeadForm';
import { APP_ROUTES } from '@/lib/config/routes';
import { useLanguage } from '@/contexts/LanguageContext';

export default function CapitalAdvisoryLanding() {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const t = <T,>(p: { ru: T; en: T }): T => (isRu ? p.ru : p.en);

  return (
    <LandingShell
      eyebrow={{ ru: 'Для капитала от $2M', en: 'For capital from $2M' }}
      title={{
        ru: 'Capital Advisory — частный канал сделок на Пхукете',
        en: 'Capital Advisory — private deal channel in Phuket',
      }}
      subtitle={{
        ru: 'Подбираем 5–8 проверенных объектов под ваш мандат. Юрист, налоговый консультант и asset-manager — на одном договоре.',
        en: 'We curate 5–8 vetted opportunities for your mandate. Lawyer, tax advisor and asset manager — under a single engagement.',
      }}
      badges={[
        { ru: 'NDA до раскрытия', en: 'NDA before disclosure' },
        { ru: 'First Look 7–14 дней', en: 'First Look 7–14 days' },
        { ru: 'ClearView рейтинг', en: 'ClearView rating' },
      ]}
      benefits={[
        {
          icon: Compass,
          title: { ru: 'Шорт-лист под ваш мандат', en: 'Shortlist for your mandate' },
          desc: {
            ru: '5–8 объектов, отобранных вручную под чёткие критерии доходности и риска.',
            en: '5–8 opportunities hand-picked against clear yield and risk criteria.',
          },
        },
        {
          icon: ShieldCheck,
          title: { ru: 'Due diligence под ключ', en: 'Turnkey due diligence' },
          desc: {
            ru: 'Юридическая проверка, KYC застройщика, ClearView рейтинг проекта.',
            en: 'Legal review, developer KYC, ClearView project rating.',
          },
        },
        {
          icon: Handshake,
          title: { ru: 'Один договор — вся команда', en: 'One engagement — full team' },
          desc: {
            ru: 'Юрист, налоговый консультант, asset-manager работают как единая команда.',
            en: 'Lawyer, tax advisor and asset manager act as a single team.',
          },
        },
        {
          icon: TrendingUp,
          title: { ru: 'Прозрачная структура', en: 'Transparent structure' },
          desc: {
            ru: 'Понимание налогов, выходов и денежного потока до подписания.',
            en: 'Clear view of taxes, exits and cashflow before you sign.',
          },
        },
      ]}
      formSlot={
        <LandingLeadForm
          variant="capital"
          capitalRequestType="capital_advisory"
          entryPoint="/invest/capital-advisory"
          showBudgetField
          showTimelineField
          topicField={{
            key: 'asset_class',
            label: { ru: 'Класс актива', en: 'Asset class' },
            options: [
              {
                value: 'residential',
                label: { ru: 'Жилая недвижимость', en: 'Residential' },
              },
              { value: 'hotel', label: { ru: 'Гостиничный', en: 'Hotel' } },
              { value: 'commercial', label: { ru: 'Коммерческий', en: 'Commercial' } },
              { value: 'land', label: { ru: 'Земля / девелопмент', en: 'Land / development' } },
              { value: 'mixed', label: { ru: 'Смешанный портфель', en: 'Mixed portfolio' } },
            ],
          }}
          successText={{
            ru: 'Мы свяжемся в течение 24 часов и пришлём NDA.',
            en: 'We will reach out within 24 hours and send the NDA.',
          }}
          submitLabel={{ ru: 'Запросить шорт-лист', en: 'Request shortlist' }}
        />
      }
      seoTitle={{
        ru: 'Capital Advisory на Пхукете — частный канал инвестиционных сделок',
        en: 'Capital Advisory in Phuket — private investment deal channel',
      }}
      seoDescription={{
        ru: 'Закрытый канал сделок недвижимости Пхукета для частного капитала от $2M. Шорт-лист, due diligence, налоги и юрист — под ключ.',
        en: 'Private Phuket real-estate deal channel for capital from $2M. Shortlist, due diligence, tax and legal — turnkey.',
      }}
    >
      <div className="rounded-none border border-border bg-card p-6">
        <h2 className="text-xl font-semibold mb-4">
          {t({ ru: 'Что входит в работу', en: 'What is included' })}
        </h2>
        <LandingChecklist
          items={[
            { ru: 'Бриф 60 минут с инвестиционным директором', en: '60-min brief with investment director' },
            { ru: 'NDA и pre-screening 5–8 объектов', en: 'NDA and pre-screening of 5–8 opportunities' },
            { ru: 'Юридическая проверка по выбранному объекту', en: 'Legal review on the chosen asset' },
            { ru: 'Структурирование сделки и налогов', en: 'Deal and tax structuring' },
            { ru: 'Сопровождение до закрытия', en: 'Support through closing' },
            { ru: 'Подключение к Deal Room myUNO', en: 'Access to myUNO Deal Room' },
          ]}
        />
        <div className="mt-6 flex flex-wrap gap-3">
          <Button variant="outline" onClick={() => navigate('/property/mandate')}>
            {t({ ru: 'Узнать про Deal Room', en: 'Learn about Deal Room' })}
            <ArrowRight className="h-4 w-4 ml-1" />
          </Button>
          <Button variant="outline" onClick={() => navigate(APP_ROUTES.CAPITAL_DEAL_INTAKE)}>
            {t({ ru: 'Подать сделку $200K+', en: 'Submit deal $200K+' })}
          </Button>
        </div>
      </div>
    </LandingShell>
  );
}
