import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { LandingLayout } from '@/components/miniapp/LandingLayout';
import { Handshake, Users, Percent, FileSignature, LayoutDashboard, MessageSquare, ArrowRight, Award } from 'lucide-react';
import { tokenColor } from '@/lib/utils/hslAlpha';
import { SEOHead } from '@/components/seo';
import { getWhatsAppUrl } from '@/lib/config/contacts';

const STEPS = [
  { icon: Users, labelEn: 'Bring your buyers', labelRu: 'Приводите своих клиентов', descEn: 'Investors, second-home, relocators', descRu: 'Инвесторы, вторые дома, релоканты', path: '/agent/join', color: 'primary' },
  { icon: Percent, labelEn: '50/50 commission split', labelRu: 'Делёжка комиссии 50/50', descEn: 'Half of our 5% goes to you', descRu: 'Половина нашей 5% — вам', path: '/agent/join#commission', color: 'cluster-invest' },
  { icon: FileSignature, labelEn: 'We close the deal', labelRu: 'Закрытие сделки — на нас', descEn: 'Legal, escrow, due diligence', descRu: 'Юрист, эскроу, due diligence', path: '/legal', color: 'accent-purple' },
  { icon: LayoutDashboard, labelEn: 'Agent dashboard', labelRu: 'Кабинет агента', descEn: 'Track leads, deals, payouts', descRu: 'Лиды, сделки, выплаты', path: '/agent/dashboard', color: 'cluster-manage' },
  { icon: MessageSquare, labelEn: 'Co-marketing assets', labelRu: 'Маркетинговые материалы', descEn: 'Listings, decks, RU+EN content', descRu: 'Листинги, презентации, RU+EN', path: '/agent/resources', color: 'accent-amber' },
  { icon: Award, labelEn: 'Verified Partner badge', labelRu: 'Бейдж Verified Partner', descEn: 'Boost trust with your clients', descRu: 'Повышает доверие клиентов', path: '/g-trust', color: 'cluster-arrive' },
];

const STATS = [
  { numRu: '50/50', numEn: '50/50', labelEn: 'Commission split', labelRu: 'Доля комиссии' },
  { numRu: '14 дн', numEn: '14 days', labelEn: 'Payout window', labelRu: 'Срок выплаты' },
  { numRu: '500+', numEn: '500+', labelEn: 'Listings', labelRu: 'Листингов' },
];

export default function AgentLandingPage() {
  const { language } = useLanguage();
  const t = language === 'ru';
  const navigate = useNavigate();
  const whatsappUrl = getWhatsAppUrl(t ? 'Здравствуйте! Я агент и хочу сотрудничать с myUNO' : 'Hello! I am an agent and I want to partner with myUNO');

  return (
    <>
      <SEOHead
        title={t ? 'Для агентов недвижимости — myUNO Partners' : 'For property agents — myUNO Partners'}
        description={t ? 'Приводите клиентов на Пхукет — делим комиссию 50/50. Закрытие сделки, юрист, эскроу — на нас.' : 'Bring buyers to Phuket — we split 5% commission 50/50. Closing, legal, escrow — on us.'}
        url="https://www.myuno.app/for/agent"
      />
      <LandingLayout
        icon={Handshake}
        title={t ? 'Для агентов недвижимости' : 'For property agents'}
        subtitle={t ? 'Приводите клиента — закрываем сделку — делим комиссию 50/50' : 'Bring the client — we close the deal — split commission 50/50'}
        gradient="from-primary via-accent to-cluster-invest"
        heroCta={{ label: t ? 'Стать партнёром' : 'Become a partner', onClick: () => navigate('/agent/join') }}
        whatsappUrl={whatsappUrl}
        whatsappLabel={t ? 'Обсудить условия' : 'Discuss terms'}
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
            {t ? 'Как мы работаем с агентами' : 'How we work with agents'}
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
          <p className="text-sm text-muted-foreground mb-2">{t ? 'Пример выплаты с типичной сделки $400K' : 'Sample payout on a $400K deal'}</p>
          <p className="text-3xl font-bold font-display text-foreground tabular-nums">$10,000</p>
          <p className="text-xs text-muted-foreground mt-2 max-w-sm mx-auto">
            {t ? 'Сделка $400K × 5% = $20,000 → ваша доля 50% = $10,000.' : 'Deal $400K × 5% = $20,000 → your 50% share = $10,000.'}
          </p>
        </div>
      </LandingLayout>
    </>
  );
}
