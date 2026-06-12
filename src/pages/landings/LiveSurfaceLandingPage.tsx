import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { LandingLayout } from '@/components/miniapp/LandingLayout';
import { Sunset, Home, GraduationCap, Stethoscope, Landmark, Wifi, ShoppingBag, Car, ArrowRight } from 'lucide-react';
import { tokenColor } from '@/lib/utils/hslAlpha';
import { SEOHead } from '@/components/seo';
import { buildSurfaceSeo } from '@/lib/landings/surfaceLandingSeo';
import { APP_ROUTES } from '@/lib/config/routes';
import { getWhatsAppUrl } from '@/lib/config/contacts';

const SERVICES = [
  { icon: Home, labelEn: 'Long-stay housing', labelRu: 'Долгосрочная аренда', descEn: 'Condos & villas 1–12 months', descRu: 'Кондо и виллы 1–12 месяцев', path: `${APP_ROUTES.PROPERTY_BROWSE}?mode=rent&tenancy=long`, color: 'primary', external: false },
  { icon: Landmark, labelEn: 'Thai bank account', labelRu: 'Тайский счёт', descEn: 'Bangkok Bank, Kasikorn, SCB', descRu: 'Bangkok Bank, Kasikorn, SCB', path: APP_ROUTES.BANKING, color: 'cluster-invest', external: false },
  { icon: GraduationCap, labelEn: 'Schools & kindergartens', labelRu: 'Школы и сады', descEn: '15+ international schools', descRu: '15+ международных школ', path: APP_ROUTES.SCHOOL_FINDER, color: 'accent-amber', external: false },
  { icon: Stethoscope, labelEn: 'Medical & insurance', labelRu: 'Медицина и страховка', descEn: 'Bangkok Hospital cashless', descRu: 'Bangkok Hospital cashless', path: APP_ROUTES.MEDICAL, color: 'destructive', external: false },
  { icon: Car, labelEn: 'Transport & licence', labelRu: 'Транспорт и права', descEn: 'Lease, buy, Thai licence', descRu: 'Аренда, покупка, тайские права', path: APP_ROUTES.TRANSPORT, color: 'cluster-arrive', external: false },
  { icon: Wifi, labelEn: 'Home internet', labelRu: 'Домашний интернет', descEn: '500 Mbps fibre from ฿790/mo', descRu: '500 Mbps fiber от ฿790/мес', path: APP_ROUTES.DELIVERY, color: 'accent-cyan', external: true },
  { icon: ShoppingBag, labelEn: 'Furniture & delivery', labelRu: 'Мебель и доставка', descEn: 'IKEA, Index, local makers', descRu: 'IKEA, Index, локальные мастера', path: APP_ROUTES.DELIVERY, color: 'accent-purple', external: false },
];

const STATS = [
  { numRu: '฿35–80K', numEn: '฿35–80K', labelEn: 'Long-stay rent/mo', labelRu: 'Аренда/мес' },
  { numRu: '฿1,200/мес', numEn: '$1,200/mo', labelEn: 'Family cost-of-living', labelRu: 'Семейный бюджет' },
  { numRu: '15+', numEn: '15+', labelEn: 'Int. schools', labelRu: 'Межд. школ' },
];

export default function LiveSurfaceLandingPage() {
  const { language } = useLanguage();
  const t = language === 'ru';
  const navigate = useNavigate();
  const whatsappUrl = getWhatsAppUrl(t ? 'Здравствуйте! Планирую переезд и жизнь на Пхукете' : 'Hello! I plan to live on Phuket long-term');

  return (
    <>
      <SEOHead
        title={t ? 'Жизнь на Пхукете — переезд, школа, банк · myUNO' : 'Life on Phuket — relocation, school, bank · myUNO'}
        description={t ? 'Долгосрочная жизнь на Пхукете: жильё, банк, школа, страховка, транспорт. Чек-листы и сервисы в одном месте.' : 'Long-term life on Phuket: housing, banking, schools, insurance, transport. Checklists and services in one place.'}
        url="https://www.myuno.app/for/live"
      />
      <LandingLayout
        icon={Sunset}
        title={t ? 'Жизнь на Пхукете' : 'Live on Phuket'}
        subtitle={t ? 'Дом, школа, банк, страховка, права — всё, что нужно для долгой жизни на острове' : 'Home, school, bank, insurance, licence — everything you need for the long haul'}
        gradient="from-primary via-cluster-arrive to-accent"
        heroCta={{ label: t ? 'Спланировать переезд' : 'Plan my move', onClick: () => navigate(APP_ROUTES.RELOCATE) }}
        whatsappUrl={whatsappUrl}
        whatsappLabel={t ? 'Обсудить с координатором' : 'Talk to a coordinator'}
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
            {t ? 'Всё для жизни — в одном месте' : 'Everything for living — in one place'}
          </h2>
          {SERVICES.map((s, i) => {
            const Icon = s.icon;
            const onClick = () => {
              // Internet provisioning flow not yet built — route to WhatsApp coordinator.
              if (s.external) window.open(whatsappUrl, '_blank');
              else navigate(s.path);
            };
            return (
              <button key={i} onClick={onClick} className="w-full flex items-center gap-4 p-4 rounded-none border border-border bg-card text-left transition-all hover:[box-shadow:var(--shadow-elevation-2)]">
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
          <p className="text-sm text-muted-foreground mb-2">{t ? 'Полный пакет переезда' : 'Full relocation pack'}</p>
          <p className="text-3xl font-bold font-display text-foreground tabular-nums">฿15,000 — ฿50,000</p>
          <p className="text-xs text-muted-foreground mt-2 max-w-sm mx-auto">
            {t ? 'Координатор, виза, банк, школа, страховка — под ключ. Договор RU+EN.' : 'Coordinator, visa, bank, school, insurance — turnkey. Contract in EN+RU.'}
          </p>
        </div>
      </LandingLayout>
    </>
  );
}
