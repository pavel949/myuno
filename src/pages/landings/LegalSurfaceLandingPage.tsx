import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { LandingLayout } from '@/components/miniapp/LandingLayout';
import { Scale, Stamp, FileText, Building2, Heart, ShieldAlert, BookOpen, ArrowRight } from 'lucide-react';
import { tokenColor } from '@/lib/utils/hslAlpha';
import { SEOHead } from '@/components/seo';
import { buildSurfaceSeo } from '@/lib/landings/surfaceLandingSeo';
import { APP_ROUTES } from '@/lib/config/routes';
import { getWhatsAppUrl } from '@/lib/config/contacts';

const SERVICES = [
  { icon: Stamp, labelEn: 'Visa & immigration', labelRu: 'Виза и иммиграция', descEn: 'DTV, LTR, Education, Retirement, Elite', descRu: 'DTV, LTR, Education, Retirement, Elite', path: APP_ROUTES.VISA_IMMIGRATION, color: 'primary' },
  { icon: FileText, labelEn: 'Lawyer consultation', labelRu: 'Юридическая консультация', descEn: '฿2,000 / 60 min, RU+EN lawyer', descRu: '฿2 000 / 60 мин, юрист RU+EN', path: APP_ROUTES.LEGAL, color: 'cluster-invest' },
  { icon: Building2, labelEn: 'Thai company setup', labelRu: 'Открытие тайской компании', descEn: 'Co Ltd, BOI, work permit', descRu: 'Co Ltd, BOI, work permit', path: `${APP_ROUTES.LEGAL}?topic=company`, color: 'accent-purple' },
  { icon: Heart, labelEn: 'Family law', labelRu: 'Семейное право', descEn: 'Marriage, divorce, child custody', descRu: 'Брак, развод, опека', path: `${APP_ROUTES.LEGAL}?topic=family`, color: 'destructive' },
  { icon: ShieldAlert, labelEn: 'Disputes & insurance', labelRu: 'Споры и страхование', descEn: 'Accident, contract breach, refunds', descRu: 'ДТП, нарушение договора, возвраты', path: `${APP_ROUTES.LEGAL}?topic=disputes`, color: 'accent-amber' },
  { icon: BookOpen, labelEn: 'Tax & accounting', labelRu: 'Налоги и бухгалтерия', descEn: 'Personal income tax, payroll, VAT', descRu: 'НДФЛ, зарплата, VAT', path: `${APP_ROUTES.LEGAL}?topic=tax`, color: 'cluster-manage' },
];

const STATS = [
  { numRu: '฿2,000', numEn: '฿2,000', labelEn: 'Consultation 60 min', labelRu: 'Консультация 60 мин' },
  { numRu: 'RU+EN', numEn: 'EN+RU', labelEn: 'Lawyer languages', labelRu: 'Языки юриста' },
  { numRu: '48 ч', numEn: '48 hrs', labelEn: 'First answer', labelRu: 'Первый ответ' },
];

export default function LegalSurfaceLandingPage() {
  const { language } = useLanguage();
  const t = language === 'ru';
  const navigate = useNavigate();
  const whatsappUrl = getWhatsAppUrl(t ? 'Здравствуйте! Нужна юридическая помощь на Пхукете' : 'Hello! I need legal help on Phuket');

  const seo = buildSurfaceSeo('legal', t ? 'ru' : 'en');

  return (
    <>
      <SEOHead title={seo.title} description={seo.description} url={seo.url} jsonLd={seo.jsonLd} />
      <LandingLayout
        icon={Scale}
        title={t ? 'Юридическая помощь' : 'Legal help'}
        subtitle={t ? 'Виза, компания, семья, споры и налоги — юристы RU+EN с фиксированной ценой и SLA на ответ' : 'Visa, company, family, disputes and tax — EN+RU lawyers with fixed price and answer SLA'}
        gradient="from-cluster-legal via-primary to-accent"
        heroCta={{ label: t ? 'Подобрать визу' : 'Match a visa', onClick: () => navigate(APP_ROUTES.VISA_QUIZ) }}
        whatsappUrl={whatsappUrl}
        whatsappLabel={t ? 'Связаться с юристом' : 'Contact a lawyer'}
      >
        <div className="px-4 py-8 grid grid-cols-3 gap-3 max-w-lg mx-auto">
          {STATS.map((s, i) => (
            <div key={i} className="text-center">
              <p className="text-base font-bold font-display text-foreground tabular-nums">{t ? s.numRu : s.numEn}</p>
              <p className="text-[11px] text-muted-foreground mt-1 leading-tight">{t ? s.labelRu : s.labelEn}</p>
            </div>
          ))}
        </div>

        <div className="px-4 py-6 max-w-lg mx-auto space-y-3">
          <h2 className="text-xl font-bold font-display text-foreground mb-4 text-center">
            {t ? 'Шесть направлений' : 'Six legal tracks'}
          </h2>
          {SERVICES.map((s, i) => {
            const Icon = s.icon;
            return (
              <button key={i} onClick={() => navigate(s.path)} className="w-full flex items-center gap-4 p-4 rounded-none border border-border bg-card text-left transition-all hover:[box-shadow:var(--shadow-elevation-2)]">
                <div className="w-11 h-11 rounded-none flex items-center justify-center shrink-0" style={{ background: tokenColor(s.color, 0.15) }}>
                  <Icon className="w-5 h-5" style={{ color: tokenColor(s.color) }} />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-sm text-foreground">{t ? s.labelRu : s.labelEn}</h3>
                  <p className="text-xs text-muted-foreground">{t ? s.descRu : s.descEn}</p>
                </div>
                <ArrowRight className="w-4 h-4 text-muted-foreground shrink-0" />
              </button>
            );
          })}
        </div>

        <div className="px-4 py-10 text-center bg-muted/30">
          <p className="text-sm text-muted-foreground mb-2">{t ? 'Первая консультация' : 'First consultation'}</p>
          <p className="text-3xl font-bold font-display text-foreground tabular-nums">฿2,000</p>
          <p className="text-xs text-muted-foreground mt-2 max-w-sm mx-auto">
            {t ? '60 минут с юристом RU+EN. Договор RU+EN. Оплата картой или переводом.' : '60 minutes with an EN+RU lawyer. Contract EN+RU. Card or bank transfer.'}
          </p>
        </div>
      </LandingLayout>
    </>
  );
}
