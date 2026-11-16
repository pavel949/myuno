import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { LandingLayout } from '@/components/miniapp/LandingLayout';
import { HardHat, MapPin, FileSignature, Ruler, Hammer, ShieldCheck, KeyRound, ArrowRight } from 'lucide-react';
import { tokenColor } from '@/lib/utils/hslAlpha';
import { SEOHead } from '@/components/seo';
import { buildSurfaceSeo } from '@/lib/landings/surfaceLandingSeo';
import { getWhatsAppUrl } from '@/lib/config/contacts';
import { APP_ROUTES } from '@/lib/config/routes';

const STEPS = [
  { icon: MapPin, labelEn: 'Land plot search', labelRu: 'Подбор земли', descEn: 'Explore published land offers and their documents', descRu: 'Изучите предложения земли и документы', path: '/property/browse?type=land', color: 'primary', external: false },
  { icon: FileSignature, labelEn: 'Title & ownership', labelRu: 'Титул и оформление', descEn: 'Discuss ownership options and document checks', descRu: 'Обсудите варианты владения и проверку документов', path: APP_ROUTES.LEGAL, color: 'accent-purple', external: false },
  { icon: Ruler, labelEn: 'Architect & permits', labelRu: 'Архитектор и разрешения', descEn: 'EIA, building permit, utility hookup', descRu: 'EIA, building permit, подключение коммуникаций', path: APP_ROUTES.LEGAL, color: 'cluster-arrive', external: true },
  { icon: Hammer, labelEn: 'Build & contractor', labelRu: 'Строительство и подрядчик', descEn: 'Discuss the scope, contractor and contract terms', descRu: 'Обсудите состав работ, подрядчика и договор', path: APP_ROUTES.LEGAL, color: 'accent-amber', external: true },
  { icon: ShieldCheck, labelEn: 'Independent supervision', labelRu: 'Независимый надзор', descEn: 'Agree inspection scope and reporting frequency', descRu: 'Согласуйте объём проверок и формат отчётности', path: APP_ROUTES.LEGAL, color: 'cluster-manage', external: true },
  { icon: KeyRound, labelEn: 'Handover & PM', labelRu: 'Сдача и управление', descEn: 'Discuss handover and property management', descRu: 'Обсудите приёмку и управление объектом', path: '/mc', color: 'cluster-invest', external: false },
];

const STATS = [
  { numRu: 'Земля', numEn: 'Land', labelEn: 'Offers and documents', labelRu: 'Предложения и документы' },
  { numRu: 'Проект', numEn: 'Project', labelEn: 'Scope and required checks', labelRu: 'Задачи и необходимые проверки' },
  { numRu: 'Условия', numEn: 'Terms', labelEn: 'Agreed for your project', labelRu: 'Согласуются для проекта' },
];

export default function BuildSurfaceLandingPage() {
  const { language } = useLanguage();
  const t = language === 'ru';
  const navigate = useNavigate();
  const whatsappUrl = getWhatsAppUrl(t ? 'Здравствуйте! Хочу построить виллу на Пхукете' : 'Hello! I want to build a villa in Phuket');

  const seo = buildSurfaceSeo('build', t ? 'ru' : 'en');

  return (
    <>
      <SEOHead title={seo.title} description={seo.description} url={seo.url} jsonLd={seo.jsonLd} />
      <LandingLayout
        icon={HardHat}
        title={t ? 'Построить виллу на Пхукете' : 'Build a villa in Phuket'}
        subtitle={t ? 'Земля, документы, проект и приёмка — определите задачи и согласуйте специалистов и условия для каждого этапа.' : 'Land, documents, design and handover — define your needs and agree specialists and terms for each stage.'}
        gradient="from-primary via-accent to-cluster-manage"
        heroCta={{ label: t ? 'Обсудить проект' : 'Discuss my project', onClick: () => window.open(whatsappUrl, '_blank') }}
        whatsappUrl={whatsappUrl}
        whatsappLabel={t ? 'Связаться с advisor' : 'Talk to an advisor'}
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
            {t ? 'Этапы — от земли до ключей' : 'Stages, from land to keys'}
          </h2>
          {STEPS.map((s, i) => {
            const Icon = s.icon;
            const onClick = () => {
              // Service flow not yet implemented for some steps — route to WhatsApp advisor.
              if (s.external) window.open(whatsappUrl, '_blank');
              else navigate(s.path);
            };
            return (
              <button key={i} onClick={onClick} className="w-full flex items-center gap-4 p-4 rounded-none border border-border bg-card text-left transition-all hover:[box-shadow:var(--shadow-elevation-2)]">
                <div className="w-11 h-11 rounded-none flex items-center justify-center shrink-0 relative" style={{ background: tokenColor(s.color, 0.15) }}>
                  <Icon className="w-5 h-5" style={{ color: tokenColor(s.color) }} />
                  <span className="absolute -top-2 -left-2 w-5 h-5 rounded-full bg-foreground text-background text-[10px] font-bold flex items-center justify-center tabular-nums">{i + 1}</span>
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
          <p className="text-sm text-muted-foreground mb-2">{t ? 'Условия вашего проекта' : 'Your project terms'}</p>
          <p className="text-3xl font-bold font-display text-foreground tabular-nums">{t ? 'Индивидуальные условия' : 'Individual terms'}</p>
          <p className="text-xs text-muted-foreground mt-2 max-w-sm mx-auto">
            {t ? 'Бюджет, сроки, договоры и гарантии зависят от конкретного проекта и подтверждаются выбранными специалистами.' : 'Budget, timing, contracts and warranties depend on the project and must be confirmed with the selected specialists.'}
          </p>
        </div>
      </LandingLayout>
    </>
  );
}
