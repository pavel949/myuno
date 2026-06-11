import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { LandingLayout } from '@/components/miniapp/LandingLayout';
import { TrendingUp, Building2, BarChart3, ShieldCheck, FileText, Globe, ArrowRight, Briefcase } from 'lucide-react';
import { tokenColor } from '@/lib/utils/hslAlpha';
import { SEOHead } from '@/components/seo';
import { APP_ROUTES } from '@/lib/config/routes';
import { getWhatsAppUrl } from '@/lib/config/contacts';

const STEPS = [
  { icon: Building2, labelEn: 'Off-plan & resale deals', labelRu: 'Новостройки и resale', descEn: 'Curated AAA–BBB projects only', descRu: 'Только AAA–BBB по ClearView™', path: APP_ROUTES.LANDING_NEW_DEVELOPMENTS, color: 'primary' },
  { icon: BarChart3, labelEn: 'ClearView™ ratings', labelRu: 'Рейтинги ClearView™', descEn: '8-criteria honest scoring', descRu: 'Честная оценка по 8 критериям', path: '/newbuilds', color: 'cluster-invest' },
  { icon: ShieldCheck, labelEn: 'Due diligence', labelRu: 'Due diligence', descEn: 'Developer, title, escrow checks', descRu: 'Девелопер, титул, эскроу', path: APP_ROUTES.LEGAL, color: 'accent-purple' },
  { icon: FileText, labelEn: 'Tax & structuring', labelRu: 'Налоги и структура', descEn: 'Personal vs company ownership', descRu: 'На себя vs через компанию', path: '/tax', color: 'cluster-legal' },
  { icon: Briefcase, labelEn: 'Capital advisory', labelRu: 'Капитальный консалтинг', descEn: 'Portfolio sizing & exit plan', descRu: 'Размер портфеля и exit-план', path: '/invest-hub', color: 'accent-amber' },
  { icon: Globe, labelEn: 'Cross-border transfers', labelRu: 'Трансграничные переводы', descEn: 'WorldCheck-compliant payment rails', descRu: 'Платёжные рельсы с WorldCheck', path: APP_ROUTES.BANKING, color: 'cluster-arrive' },
];

const STATS = [
  { numRu: '$2M+', numEn: '$2M+', labelEn: 'Min ticket', labelRu: 'Минимальный чек' },
  { numRu: '6–8%', numEn: '6–8%', labelEn: 'Target yield', labelRu: 'Целевая доходность' },
  { numRu: 'AAA–CCC', numEn: 'AAA–CCC', labelEn: 'ClearView™ scale', labelRu: 'Шкала ClearView™' },
];

export default function InvestorLandingPage() {
  const { language } = useLanguage();
  const t = language === 'ru';
  const navigate = useNavigate();
  const whatsappUrl = getWhatsAppUrl(t ? 'Здравствуйте! Интересует инвестиционный портфель на Пхукете' : 'Hello! I am interested in a Phuket investment portfolio');

  return (
    <>
      <SEOHead
        title={t ? 'Инвестиции в Пхукет — портфель $2M+ · myUNO' : 'Phuket investments — $2M+ portfolio · myUNO'}
        description={t ? 'Капитальный консалтинг для инвесторов от $2M. Off-plan, resale, due diligence, ClearView™ рейтинги, налоговое структурирование.' : 'Capital advisory for investors from $2M. Off-plan, resale, due diligence, ClearView™ ratings, tax structuring.'}
        url="https://www.myuno.app/for/investor"
      />
      <LandingLayout
        icon={TrendingUp}
        title={t ? 'Инвесторы — Пхукет' : 'Investors — Phuket'}
        subtitle={t ? 'Капитальный консалтинг от $2M. Только проверенные проекты, прозрачная экономика, честные рейтинги.' : 'Capital advisory from $2M. Vetted projects only, transparent economics, honest ratings.'}
        gradient="from-primary via-cluster-invest to-accent"
        heroCta={{ label: t ? 'Получить портфель' : 'Request portfolio', onClick: () => window.open(whatsappUrl, '_blank') }}
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
            {t ? 'Что вы получаете' : 'What you get'}
          </h2>
          {STEPS.map((s, i) => {
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
          <p className="text-3xl font-bold font-display text-foreground tabular-nums">5%</p>
          <p className="text-xs text-muted-foreground mt-2 max-w-sm mx-auto">
            {t ? 'Прозрачно, без скрытых сборов. Полный аудит каждой сделки в Wallet.' : 'Transparent, no hidden fees. Full audit trail per deal in Wallet.'}
          </p>
        </div>
      </LandingLayout>
    </>
  );
}
