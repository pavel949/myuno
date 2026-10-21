import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { LandingLayout } from '@/components/miniapp/LandingLayout';
import { Building2, Calendar, Wrench, Receipt, Users, BarChart3, ClipboardCheck, ArrowRight } from 'lucide-react';
import { tokenColor } from '@/lib/utils/hslAlpha';
import { SEOHead } from '@/components/seo';
import { buildSurfaceSeo } from '@/lib/landings/surfaceLandingSeo';
import { APP_ROUTES } from '@/lib/config/routes';
import { getWhatsAppUrl } from '@/lib/config/contacts';

const SERVICES = [
  { icon: Calendar, labelEn: 'Calendar & channels', labelRu: 'Календарь и каналы', descEn: 'Airbnb, Booking, Agoda — single inbox', descRu: 'Airbnb, Booking, Agoda — один календарь', path: '/mc/calendar', color: 'primary' },
  { icon: Users, labelEn: 'Guest experience', labelRu: 'Гость и сервис', descEn: 'AI-chat RU/EN, lifecycle messaging', descRu: 'AI-чат RU/EN, lifecycle-рассылки', path: '/mc/guests', color: 'accent-cyan' },
  { icon: Wrench, labelEn: 'Cleaning & maintenance', labelRu: 'Уборка и техника', descEn: 'Auto-tasks, preventive schedule', descRu: 'Авто-задачи, профилактика', path: '/mc/operations', color: 'cluster-arrive' },
  { icon: Receipt, labelEn: 'Owner P&L', labelRu: 'Отчёт собственнику', descEn: 'Monthly statement, tax-ready', descRu: 'Ежемесячный отчёт, готовый для налогов', path: '/mc/financials', color: 'cluster-invest' },
  { icon: BarChart3, labelEn: 'Dynamic pricing', labelRu: 'Динамические цены', descEn: 'Season + override, channel sync', descRu: 'Сезон + ручное, синк по каналам', path: '/mc/pricing', color: 'accent-amber' },
  { icon: ClipboardCheck, labelEn: 'Portfolio health', labelRu: 'Здоровье портфеля', descEn: '8 checks per property, 0–100%', descRu: '8 проверок по объекту, 0–100%', path: '/mc/health', color: 'cluster-manage' },
];

const STATS = [
  { numRu: '$25/мес', numEn: '$25/mo', labelEn: 'PMS per property', labelRu: 'PMS за объект' },
  { numRu: '10–15%', numEn: '10–15%', labelEn: 'Management fee', labelRu: 'Комиссия PM' },
  { numRu: '24/7', numEn: '24/7', labelEn: 'Guest support', labelRu: 'Поддержка гостей' },
];

export default function ManageSurfaceLandingPage() {
  const { language } = useLanguage();
  const t = language === 'ru';
  const navigate = useNavigate();
  const whatsappUrl = getWhatsAppUrl(t ? 'Здравствуйте! Хочу обсудить управление недвижимостью' : 'Hello! I want to discuss property management');

  const seo = buildSurfaceSeo('manage', t ? 'ru' : 'en');

  return (
    <>
      <SEOHead title={seo.title} description={seo.description} url={seo.url} jsonLd={seo.jsonLd} />
      <LandingLayout
        icon={Building2}
        title={t ? 'Управление недвижимостью' : 'Manage your property'}
        subtitle={t ? 'PMS, channel manager, гости, уборка и отчёты — один продукт вместо пяти подрядчиков' : 'PMS, channel manager, guests, cleaning and reports — one product instead of five vendors'}
        gradient="from-cluster-manage via-primary to-accent"
        heroCta={{ label: t ? 'Завести объект' : 'Add a property', onClick: () => navigate('/owner/onboarding') }}
        whatsappUrl={whatsappUrl}
        whatsappLabel={t ? 'Поговорить с MC' : 'Talk to MC team'}
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
            {t ? 'Что входит в управление' : 'What management covers'}
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
          <p className="text-sm text-muted-foreground mb-2">{t ? 'Полное управление' : 'Full management'}</p>
          <p className="text-3xl font-bold font-display text-foreground tabular-nums">10–15%</p>
          <p className="text-xs text-muted-foreground mt-2 max-w-sm mx-auto">
            {t ? 'Канал-менеджер, гости, уборка, отчёты. Договор RU+EN, ежемесячный P&L.' : 'Channel manager, guests, cleaning, reports. Contract EN+RU, monthly P&L.'}
          </p>
        </div>
      </LandingLayout>
    </>
  );
}
