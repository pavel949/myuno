import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { LandingLayout } from '@/components/miniapp/LandingLayout';
import { Plane, Car, Wifi, Landmark, MapPin, Hotel, Compass, ArrowRight } from 'lucide-react';
import { tokenColor } from '@/lib/utils/hslAlpha';
import { SEOHead } from '@/components/seo';
import { buildSurfaceSeo } from '@/lib/landings/surfaceLandingSeo';
import { APP_ROUTES } from '@/lib/config/routes';
import { getWhatsAppUrl } from '@/lib/config/contacts';

const SERVICES = [
  { icon: Car, labelEn: 'Airport transfer', labelRu: 'Трансфер из аэропорта', labelTh: 'รถรับส่งสนามบิน', descEn: 'Sedan ฿800, minivan ฿1,200 — fixed price', descRu: 'Седан ฿800, минивэн ฿1 200 — фикс', descTh: 'เก๋ง ฿800, มินิแวน ฿1,200 — ราคาคงที่', path: APP_ROUTES.TRANSPORT, color: 'cluster-arrive' },
  { icon: Wifi, labelEn: 'eSIM in 5 min', labelRu: 'eSIM за 5 минут', labelTh: 'eSIM ใน 5 นาที', descEn: '4G island-wide, RU/EN support', descRu: '4G по острову, поддержка RU/EN', descTh: '4G ทั่วเกาะ รองรับ RU/EN', path: '/sim', color: 'accent-cyan' },
  { icon: Landmark, labelEn: 'Cash & exchange', labelRu: 'Наличные и обмен', labelTh: 'เงินสดและแลกเปลี่ยน', descEn: 'SuperRich map, ATM fees', descRu: 'Карта SuperRich, комиссии ATM', descTh: 'แผนที่ SuperRich ค่าธรรมเนียม ATM', path: '/exchange', color: 'cluster-invest' },
  { icon: Hotel, labelEn: 'First-week stay', labelRu: 'Жильё на первую неделю', labelTh: 'ที่พักสัปดาห์แรก', descEn: 'Verified condos & hotels, no scams', descRu: 'Проверенные кондо и отели', descTh: 'คอนโดและโรงแรมที่ตรวจสอบแล้ว ไม่มีหลอกลวง', path: `${APP_ROUTES.PROPERTY_BROWSE}?tenancy=short`, color: 'primary' },
  { icon: MapPin, labelEn: 'Area guide', labelRu: 'Гид по районам', labelTh: 'คู่มือย่านต่าง ๆ', descEn: 'Patong, Kamala, Surin, Laguna, Rawai', descRu: 'Патонг, Камала, Сурин, Лагуна, Раваи', descTh: 'ป่าตอง กมลา สุรินทร์ ลากูน่า ราไวย์', path: '/guide/areas', color: 'accent-purple' },
  { icon: Compass, labelEn: 'First tour', labelRu: 'Первая экскурсия', labelTh: 'ทัวร์แรก', descEn: 'Phi Phi, Phang Nga, James Bond', descRu: 'Пхи-Пхи, Пханг-Нга, Джеймс Бонд', descTh: 'พีพี พังงา เกาะเจมส์บอนด์', path: '/tours', color: 'accent-amber' },
];

const STATS = [
  { numRu: '72 ч', numEn: '72 hrs', numTh: '72 ชม.', labelEn: 'First days plan', labelRu: 'План первых дней', labelTh: 'แผนช่วงแรก' },
  { numRu: '฿800', numEn: '฿800', numTh: '฿800', labelEn: 'Transfer fixed', labelRu: 'Фикс трансфер', labelTh: 'รถรับส่งราคาคงที่' },
  { numRu: '24/7', numEn: '24/7', numTh: '24/7', labelEn: 'RU concierge', labelRu: 'Консьерж RU', labelTh: 'คอนเซียร์จ RU' },
];

export default function ArriveSurfaceLandingPage() {
  const { language } = useLanguage();
  const t = language === 'ru';
  const navigate = useNavigate();
  const whatsappUrl = getWhatsAppUrl(language === 'ru' ? 'Здравствуйте! Прилетаю на Пхукет, нужна помощь с прибытием' : language === 'th' ? 'สวัสดีครับ/ค่ะ ผม/ดิฉันกำลังจะเดินทางถึงภูเก็ต ต้องการความช่วยเหลือเรื่องการมาถึง' : 'Hello! I am arriving in Phuket, need help with arrival');

  const seo = buildSurfaceSeo('arrive', t ? 'ru' : 'en');

  return (
    <>
      <SEOHead title={seo.title} description={seo.description} url={seo.url} jsonLd={seo.jsonLd} />
      <LandingLayout
        icon={Plane}
        title={language === 'ru' ? 'Прибытие на Пхукет' : language === 'th' ? 'มาถึงภูเก็ต' : 'Arrive in Phuket'}
        subtitle={language === 'ru' ? 'Первые 72 часа без стресса: трансфер, связь, деньги, заселение, ориентация' : language === 'th' ? '72 ชั่วโมงแรกแบบไร้ความเครียด: รถรับส่ง อินเทอร์เน็ต เงิน เช็คอิน และการปรับตัว' : 'First 72 hours without stress: transfer, connectivity, money, check-in, orientation'}
        gradient="from-cluster-arrive via-primary to-accent"
        heroCta={{ label: language === 'ru' ? 'Открыть чек-лист' : language === 'th' ? 'เปิดเช็กลิสต์' : 'Open checklist', onClick: () => navigate('/guide/areas') }}
        whatsappUrl={whatsappUrl}
        whatsappLabel={language === 'ru' ? 'Связаться с консьержем' : language === 'th' ? 'ติดต่อคอนเซียร์จ' : 'Talk to concierge'}
      >
        <div className="px-4 py-8 grid grid-cols-3 gap-3 max-w-lg mx-auto">
          {STATS.map((s, i) => (
            <div key={i} className="text-center">
              <p className="text-base font-bold font-display text-foreground tabular-nums">{language === 'ru' ? s.numRu : language === 'th' ? s.numTh : s.numEn}</p>
              <p className="text-[11px] text-muted-foreground mt-1 leading-tight">{language === 'ru' ? s.labelRu : language === 'th' ? s.labelTh : s.labelEn}</p>
            </div>
          ))}
        </div>

        <div className="px-4 py-6 max-w-lg mx-auto space-y-3">
          <h2 className="text-xl font-bold font-display text-foreground mb-4 text-center">
            {language === 'ru' ? 'Шесть шагов прибытия' : language === 'th' ? 'หกขั้นตอนสู่การมาถึงอย่างราบรื่น' : 'Six steps to land smoothly'}
          </h2>
          {SERVICES.map((s, i) => {
            const Icon = s.icon;
            return (
              <button key={i} onClick={() => navigate(s.path)} className="w-full flex items-center gap-4 p-4 rounded-none border border-border bg-card text-left transition-all hover:[box-shadow:var(--shadow-elevation-2)]">
                <div className="w-11 h-11 rounded-none flex items-center justify-center shrink-0" style={{ background: tokenColor(s.color, 0.15) }}>
                  <Icon className="w-5 h-5" style={{ color: tokenColor(s.color) }} />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-sm text-foreground">{language === 'ru' ? s.labelRu : language === 'th' ? s.labelTh : s.labelEn}</h3>
                  <p className="text-xs text-muted-foreground">{language === 'ru' ? s.descRu : language === 'th' ? s.descTh : s.descEn}</p>
                </div>
                <ArrowRight className="w-4 h-4 text-muted-foreground shrink-0" />
              </button>
            );
          })}
        </div>

        <div className="px-4 py-10 text-center bg-muted/30">
          <p className="text-sm text-muted-foreground mb-2">{language === 'ru' ? 'Пакет «Мягкая посадка»' : language === 'th' ? 'แพ็กเกจ Soft-landing' : 'Soft-landing pack'}</p>
          <p className="text-3xl font-bold font-display text-foreground tabular-nums">฿3,500 — ฿9,500</p>
          <p className="text-xs text-muted-foreground mt-2 max-w-sm mx-auto">
            {language === 'ru' ? 'Встреча, SIM, обмен, заселение, тур по району. Договор RU+EN.' : language === 'th' ? 'รับที่สนามบิน SIM แลกเงิน เช็คอิน ทัวร์ย่านที่พัก สัญญา EN+RU' : 'Meet & greet, SIM, exchange, check-in, neighbourhood tour. Contract EN+RU.'}
          </p>
        </div>
      </LandingLayout>
    </>
  );
}
