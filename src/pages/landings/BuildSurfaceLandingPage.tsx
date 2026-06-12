import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { LandingLayout } from '@/components/miniapp/LandingLayout';
import { HardHat, MapPin, FileSignature, Ruler, Hammer, ShieldCheck, KeyRound, ArrowRight } from 'lucide-react';
import { tokenColor } from '@/lib/utils/hslAlpha';
import { SEOHead } from '@/components/seo';
import { getWhatsAppUrl } from '@/lib/config/contacts';
import { APP_ROUTES } from '@/lib/config/routes';

const STEPS = [
  { icon: MapPin, labelEn: 'Land plot search', labelRu: 'Подбор земли', descEn: 'Chanote / Nor Sor 3 Gor — clean title only', descRu: 'Chanote / Nor Sor 3 Gor — только чистый титул', path: '/property/browse?type=land', color: 'primary', external: false },
  { icon: FileSignature, labelEn: 'Title & ownership', labelRu: 'Титул и оформление', descEn: 'Thai company, lease 30+30+30, due diligence', descRu: 'Тайская компания, lease 30+30+30, due diligence', path: APP_ROUTES.LEGAL, color: 'accent-purple', external: false },
  { icon: Ruler, labelEn: 'Architect & permits', labelRu: 'Архитектор и разрешения', descEn: 'EIA, building permit, utility hookup', descRu: 'EIA, building permit, подключение коммуникаций', path: APP_ROUTES.LEGAL, color: 'cluster-arrive', external: true },
  { icon: Hammer, labelEn: 'Build & contractor', labelRu: 'Строительство и подрядчик', descEn: 'Vetted contractors, milestone escrow', descRu: 'Проверенные подрядчики, эскроу по этапам', path: APP_ROUTES.LEGAL, color: 'accent-amber', external: true },
  { icon: ShieldCheck, labelEn: 'Independent supervision', labelRu: 'Независимый надзор', descEn: 'Inspector on site, photo report monthly', descRu: 'Инспектор на стройке, ежемесячный фото-отчёт', path: APP_ROUTES.LEGAL, color: 'cluster-manage', external: true },
  { icon: KeyRound, labelEn: 'Handover & PM', labelRu: 'Сдача и управление', descEn: 'Snag list, warranty, then we run the rentals', descRu: 'Snag list, гарантия, затем сдача в управление', path: '/mc', color: 'cluster-invest', external: false },
];

const STATS = [
  { numRu: '฿35–60K', numEn: '฿35–60K', labelEn: 'THB / sqm build', labelRu: 'Стройка ฿/м²' },
  { numRu: '14–18 мес', numEn: '14–18 mo', labelEn: 'Villa cycle', labelRu: 'Цикл виллы' },
  { numRu: '5% / сделка', numEn: '5% / deal', labelEn: 'Land commission', labelRu: 'Комиссия по земле' },
];

export default function BuildSurfaceLandingPage() {
  const { language } = useLanguage();
  const t = language === 'ru';
  const navigate = useNavigate();
  const whatsappUrl = getWhatsAppUrl(t ? 'Здравствуйте! Хочу построить виллу на Пхукете' : 'Hello! I want to build a villa on Phuket');

  return (
    <>
      <SEOHead
        title={t ? 'Строительство виллы на Пхукете — myUNO' : 'Custom villa build on Phuket — myUNO'}
        description={t ? 'Земля, титул, архитектор, подрядчик, надзор, сдача — полный цикл строительства виллы с эскроу по этапам.' : 'Land, title, architect, contractor, supervision, handover — full villa build cycle with milestone escrow.'}
        url="https://www.myuno.app/for/build"
      />
      <LandingLayout
        icon={HardHat}
        title={t ? 'Построить виллу на Пхукете' : 'Build a villa on Phuket'}
        subtitle={t ? 'Земля → титул → стройка → сдача → сдача в аренду. Один контракт, один координатор, понятная цена.' : 'Land → title → build → handover → rentals. One contract, one coordinator, transparent pricing.'}
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
            {t ? 'Этапы — от земли до ключей' : 'Stages — from land to keys'}
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
          <p className="text-sm text-muted-foreground mb-2">{t ? 'Бюджет типовой 3BR виллы под ключ' : 'Typical 3BR turnkey villa budget'}</p>
          <p className="text-3xl font-bold font-display text-foreground tabular-nums">$350K — $1.2M</p>
          <p className="text-xs text-muted-foreground mt-2 max-w-sm mx-auto">
            {t ? 'Эскроу по этапам, фиксированная смета, независимый надзор, гарантия 1 год.' : 'Milestone escrow, fixed quote, independent supervision, 1-year warranty.'}
          </p>
        </div>
      </LandingLayout>
    </>
  );
}
