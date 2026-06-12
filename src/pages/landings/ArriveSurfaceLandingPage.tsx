import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { LandingLayout } from '@/components/miniapp/LandingLayout';
import { Plane, Car, Wifi, Landmark, MapPin, Hotel, Compass, ArrowRight } from 'lucide-react';
import { tokenColor } from '@/lib/utils/hslAlpha';
import { SEOHead } from '@/components/seo';
import { APP_ROUTES } from '@/lib/config/routes';
import { getWhatsAppUrl } from '@/lib/config/contacts';

const SERVICES = [
  { icon: Car, labelEn: 'Airport transfer', labelRu: 'Трансфер из аэропорта', descEn: 'Sedan ฿800, minivan ฿1,200 — fixed price', descRu: 'Седан ฿800, минивэн ฿1 200 — фикс', path: APP_ROUTES.TRANSPORT, color: 'cluster-arrive' },
  { icon: Wifi, labelEn: 'eSIM in 5 min', labelRu: 'eSIM за 5 минут', descEn: '4G island-wide, RU/EN support', descRu: '4G по острову, поддержка RU/EN', path: '/sim', color: 'accent-cyan' },
  { icon: Landmark, labelEn: 'Cash & exchange', labelRu: 'Наличные и обмен', descEn: 'SuperRich map, ATM fees', descRu: 'Карта SuperRich, комиссии ATM', path: '/exchange', color: 'cluster-invest' },
  { icon: Hotel, labelEn: 'First-week stay', labelRu: 'Жильё на первую неделю', descEn: 'Verified condos & hotels, no scams', descRu: 'Проверенные кондо и отели', path: `${APP_ROUTES.PROPERTY_BROWSE}?tenancy=short`, color: 'primary' },
  { icon: MapPin, labelEn: 'Area guide', labelRu: 'Гид по районам', descEn: 'Patong, Kamala, Surin, Laguna, Rawai', descRu: 'Патонг, Камала, Сурин, Лагуна, Раваи', path: '/guide/areas', color: 'accent-purple' },
  { icon: Compass, labelEn: 'First tour', labelRu: 'Первая экскурсия', descEn: 'Phi Phi, Phang Nga, James Bond', descRu: 'Пхи-Пхи, Пханг-Нга, Джеймс Бонд', path: '/tours', color: 'accent-amber' },
];

const STATS = [
  { numRu: '72 ч', numEn: '72 hrs', labelEn: 'First days plan', labelRu: 'План первых дней' },
  { numRu: '฿800', numEn: '฿800', labelEn: 'Transfer fixed', labelRu: 'Фикс трансфер' },
  { numRu: '24/7', numEn: '24/7', labelEn: 'RU concierge', labelRu: 'Консьерж RU' },
];

export default function ArriveSurfaceLandingPage() {
  const { language } = useLanguage();
  const t = language === 'ru';
  const navigate = useNavigate();
  const whatsappUrl = getWhatsAppUrl(t ? 'Здравствуйте! Прилетаю на Пхукет, нужна помощь с прибытием' : 'Hello! I am arriving on Phuket, need help with arrival');

  return (
    <>
      <SEOHead
        title={t ? 'Прибытие на Пхукет — трансфер, eSIM, заселение · myUNO' : 'Arrive on Phuket — transfer, eSIM, check-in · myUNO'}
        description={t ? 'Первые 72 часа на Пхукете: трансфер из аэропорта, eSIM, наличные THB, заселение и ориентация по районам.' : 'First 72 hours on Phuket: airport transfer, eSIM, THB cash, check-in and area orientation.'}
        url="https://www.myuno.app/for/arrive"
      />
      <LandingLayout
        icon={Plane}
        title={t ? 'Прибытие на Пхукет' : 'Arrive on Phuket'}
        subtitle={t ? 'Первые 72 часа без стресса: трансфер, связь, деньги, заселение, ориентация' : 'First 72 hours without stress: transfer, connectivity, money, check-in, orientation'}
        gradient="from-cluster-arrive via-primary to-accent"
        heroCta={{ label: t ? 'Открыть чек-лист' : 'Open checklist', onClick: () => navigate('/guide/areas') }}
        whatsappUrl={whatsappUrl}
        whatsappLabel={t ? 'Связаться с консьержем' : 'Talk to concierge'}
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
            {t ? 'Шесть шагов прибытия' : 'Six steps to land smoothly'}
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
          <p className="text-sm text-muted-foreground mb-2">{t ? 'Пакет «Мягкая посадка»' : 'Soft-landing pack'}</p>
          <p className="text-3xl font-bold font-display text-foreground tabular-nums">฿3,500 — ฿9,500</p>
          <p className="text-xs text-muted-foreground mt-2 max-w-sm mx-auto">
            {t ? 'Встреча, SIM, обмен, заселение, тур по району. Договор RU+EN.' : 'Meet & greet, SIM, exchange, check-in, neighbourhood tour. Contract EN+RU.'}
          </p>
        </div>
      </LandingLayout>
    </>
  );
}
