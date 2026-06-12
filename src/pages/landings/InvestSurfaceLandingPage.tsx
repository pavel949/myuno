import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { LandingLayout } from '@/components/miniapp/LandingLayout';
import { TrendingUp, ShieldCheck, FileSearch, Coins, Building, Briefcase, BarChart3, ArrowRight } from 'lucide-react';
import { tokenColor } from '@/lib/utils/hslAlpha';
import { SEOHead } from '@/components/seo';
import { APP_ROUTES } from '@/lib/config/routes';
import { getWhatsAppUrl } from '@/lib/config/contacts';

const SERVICES = [
  { icon: Building, labelEn: 'Off-plan & new builds', labelRu: 'Off-plan и новостройки', descEn: 'Vetted developers, ClearView AAA–CCC', descRu: 'Проверенные девелоперы, ClearView AAA–CCC', path: '/newbuilds', color: 'primary' },
  { icon: ShieldCheck, labelEn: 'ClearView rating', labelRu: 'Рейтинг ClearView', descEn: '8 criteria, independent score', descRu: '8 критериев, независимая оценка', path: '/clearview', color: 'cluster-invest' },
  { icon: FileSearch, labelEn: 'Due diligence', labelRu: 'Юридический due diligence', descEn: 'Title, EIA, developer track record', descRu: 'Титул, EIA, история девелопера', path: APP_ROUTES.LEGAL, color: 'accent-purple' },
  { icon: Coins, labelEn: 'Capital deals', labelRu: 'Capital-сделки', descEn: 'Mandate-based, $2M+ tickets', descRu: 'Mandate-режим, чеки от $2M', path: APP_ROUTES.INVEST_DEALS_BOARD, color: 'accent-amber' },
  { icon: Briefcase, labelEn: 'Business investment', labelRu: 'Бизнес-инвестиции', descEn: 'F&B, hospitality, SaaS deals', descRu: 'F&B, hospitality, SaaS сделки', path: APP_ROUTES.INVEST_BUSINESS, color: 'cluster-arrive' },
  { icon: BarChart3, labelEn: 'Investor dashboard', labelRu: 'Личный кабинет инвестора', descEn: 'P&L, milestones, escrow tracker', descRu: 'P&L, этапы, эскроу-трекер', path: APP_ROUTES.INVEST_DASHBOARD, color: 'cluster-manage' },
];

const STATS = [
  { numRu: 'AAA–CCC', numEn: 'AAA–CCC', labelEn: 'ClearView scale', labelRu: 'Шкала ClearView' },
  { numRu: '6–9%', numEn: '6–9%', labelEn: 'Net yield p.a.', labelRu: 'Чистая доходность' },
  { numRu: '$200K+', numEn: '$200K+', labelEn: 'Ticket from', labelRu: 'Чек от' },
];

export default function InvestSurfaceLandingPage() {
  const { language } = useLanguage();
  const t = language === 'ru';
  const navigate = useNavigate();
  const whatsappUrl = getWhatsAppUrl(t ? 'Здравствуйте! Рассматриваю инвестиции в Пхукет' : 'Hello! I am considering investing in Phuket');

  return (
    <>
      <SEOHead
        title={t ? 'Инвестиции в Пхукет — недвижимость, бизнес, capital · myUNO' : 'Invest in Phuket — real estate, business, capital · myUNO'}
        description={t ? 'Off-plan и готовая недвижимость, ClearView-рейтинг, due diligence, capital-сделки $2M+. Прозрачная доходность 6–9% годовых.' : 'Off-plan and resale property, ClearView ratings, due diligence, $2M+ capital deals. Transparent 6–9% net yield.'}
        url="https://www.myuno.app/for/invest"
      />
      <LandingLayout
        icon={TrendingUp}
        title={t ? 'Инвестиции на Пхукете' : 'Invest on Phuket'}
        subtitle={t ? 'Недвижимость, бизнес, capital-сделки — с независимым ClearView-рейтингом и юридической чистотой' : 'Real estate, business and capital deals — with independent ClearView ratings and clean legal structure'}
        gradient="from-cluster-invest via-primary to-accent"
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
          <p className="text-sm text-muted-foreground mb-2">{t ? 'Комиссия по сделке' : 'Deal commission'}</p>
          <p className="text-3xl font-bold font-display text-foreground tabular-nums">3–5%</p>
          <p className="text-xs text-muted-foreground mt-2 max-w-sm mx-auto">
            {t ? 'Эскроу по этапам, отчёт собственнику ежемесячно. WorldCheck для российских паспортов.' : 'Milestone escrow, monthly owner report. WorldCheck applied for Russian passport holders.'}
          </p>
        </div>
      </LandingLayout>
    </>
  );
}
