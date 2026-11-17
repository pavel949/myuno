import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { LandingLayout } from '@/components/miniapp/LandingLayout';
import { TrendingUp, ShieldCheck, FileSearch, Coins, Building, Briefcase, BarChart3, ArrowRight } from 'lucide-react';
import { tokenColor } from '@/lib/utils/hslAlpha';
import { SEOHead } from '@/components/seo';
import { buildSurfaceSeo } from '@/lib/landings/surfaceLandingSeo';
import { APP_ROUTES } from '@/lib/config/routes';
import { getWhatsAppUrl } from '@/lib/config/contacts';

const SERVICES = [
  { icon: Building, labelEn: 'Off-plan & new builds', labelRu: 'Off-plan и новостройки', descEn: 'Explore published projects and their details', descRu: 'Опубликованные проекты и сведения о них', path: '/newbuilds', color: 'primary' },
  { icon: ShieldCheck, labelEn: 'ClearView rating', labelRu: 'Рейтинг ClearView', descEn: 'Review available project assessments', descRu: 'Изучите доступные оценки проектов', path: '/clearview', color: 'cluster-invest' },
  { icon: FileSearch, labelEn: 'Due diligence', labelRu: 'Юридический due diligence', descEn: 'Title, EIA, developer track record', descRu: 'Титул, EIA, история девелопера', path: APP_ROUTES.LEGAL, color: 'accent-purple' },
  { icon: Coins, labelEn: 'Capital deals', labelRu: 'Capital-сделки', descEn: 'Review opportunities and discuss eligibility', descRu: 'Изучите возможности и условия участия', path: APP_ROUTES.INVEST_DEALS_BOARD, color: 'accent-amber' },
  { icon: Briefcase, labelEn: 'Business investment', labelRu: 'Бизнес-инвестиции', descEn: 'F&B, hospitality, SaaS deals', descRu: 'F&B, hospitality, SaaS сделки', path: APP_ROUTES.INVEST_BUSINESS, color: 'cluster-arrive' },
  { icon: BarChart3, labelEn: 'Investor dashboard', labelRu: 'Личный кабинет инвестора', descEn: 'P&L, milestones, escrow tracker', descRu: 'P&L, этапы, эскроу-трекер', path: APP_ROUTES.INVEST_DASHBOARD, color: 'cluster-manage' },
];

const STATS = [
  { numRu: 'Проекты', numEn: 'Projects', labelEn: 'Published opportunities', labelRu: 'Опубликованные предложения' },
  { numRu: 'Проверка', numEn: 'Review', labelEn: 'Assess the details and risks', labelRu: 'Изучите сведения и риски' },
  { numRu: 'Условия', numEn: 'Terms', labelEn: 'Discuss each opportunity', labelRu: 'Обсуждаются по предложению' },
];

export default function InvestSurfaceLandingPage() {
  const { language } = useLanguage();
  const t = language === 'ru';
  const navigate = useNavigate();
  const whatsappUrl = getWhatsAppUrl(t ? 'Здравствуйте! Рассматриваю инвестиции в Пхукет' : 'Hello! I am considering investing in Phuket');

  const seo = buildSurfaceSeo('invest', t ? 'ru' : 'en');

  return (
    <>
      <SEOHead title={seo.title} description={seo.description} url={seo.url} jsonLd={seo.jsonLd} />
      <LandingLayout
        icon={TrendingUp}
        title={t ? 'Инвестиции на Пхукете' : 'Invest in Phuket'}
        subtitle={t ? 'Изучите опубликованные проекты и сведения о них, затем обсудите условия и необходимые проверки.' : 'Explore published projects and their details, then discuss terms and the checks you need.'}
        heroCta={{ label: t ? 'Подобрать объект' : 'Match a deal', onClick: () => navigate(APP_ROUTES.INVEST_QUIZ) }}
        whatsappUrl={whatsappUrl}
        whatsappLabel={t ? 'Поговорить с advisor' : 'Talk to an advisor'}
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
            {t ? 'Инвестиционный стек' : 'The investment stack'}
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
          <p className="text-sm text-muted-foreground mb-2">{t ? 'Обсуждение условий' : 'Discuss the terms'}</p>
          <p className="text-3xl font-bold font-display text-foreground tabular-nums">{t ? 'Индивидуальные условия' : 'Individual terms'}</p>
          <p className="text-xs text-muted-foreground mt-2 max-w-sm mx-auto">
            {t ? 'Стоимость сопровождения и условия сделки обсуждаются отдельно. Доходность не гарантируется; изучите документы и риски до принятия решения.' : 'Advisory fees and transaction terms are discussed separately. Returns are not guaranteed; review the documents and risks before deciding.'}
          </p>
        </div>
      </LandingLayout>
    </>
  );
}
