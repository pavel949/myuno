import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { LandingLayout } from '@/components/miniapp/LandingLayout';
import { Home, Sun, Plane, Shield, Wrench, FileCheck, Wallet, ArrowRight, Key } from 'lucide-react';
import { tokenColor } from '@/lib/utils/hslAlpha';
import { SEOHead } from '@/components/seo';
import { APP_ROUTES } from '@/lib/config/routes';
import { getWhatsAppUrl } from '@/lib/config/contacts';

const STEPS = [
  { icon: Home, labelEn: 'Find your home', labelRu: 'Подобрать дом', labelTh: 'ค้นหาบ้านของคุณ', descEn: 'Vetted villas & condos $200K–$500K', descRu: 'Проверенные виллы и кондо $200–500K', descTh: 'วิลล่าและคอนโดที่ผ่านการคัดสรร $200K–$500K', path: APP_ROUTES.PROPERTY_BROWSE + '?mode=buy', color: 'primary' },
  { icon: FileCheck, labelEn: 'Legal & ownership', labelRu: 'Юристы и оформление', labelTh: 'กฎหมายและการถือครอง', descEn: 'Freehold, leasehold, due diligence', descRu: 'Freehold, leasehold, due diligence', descTh: 'Freehold, leasehold และการตรวจสอบสถานะ', path: APP_ROUTES.LEGAL, color: 'accent-purple' },
  { icon: Wrench, labelEn: 'Property management', labelRu: 'Управление недвижимостью', labelTh: 'การบริหารทรัพย์สิน', descEn: 'We take care while you are away', descRu: 'Заботимся, пока вас нет', descTh: 'เราดูแลให้ขณะที่คุณไม่อยู่', path: '/owner/landing', color: 'cluster-manage' },
  { icon: Key, labelEn: 'Rental income (optional)', labelRu: 'Аренда (опционально)', labelTh: 'รายได้จากการปล่อยเช่า (ทางเลือก)', descEn: 'Cover expenses with seasonal lets', descRu: 'Покрыть расходы сезонной арендой', descTh: 'ชดเชยค่าใช้จ่ายด้วยการปล่อยเช่าตามฤดูกาล', path: '/owner/landing#rental', color: 'cluster-invest' },
  { icon: Plane, labelEn: 'Concierge on arrival', labelRu: 'Консьерж по прилёту', labelTh: 'คอนเซียร์จเมื่อเดินทางถึง', descEn: 'Airport, transport, your home ready', descRu: 'Аэропорт, трансфер, дом готов', descTh: 'สนามบิน รถรับส่ง และบ้านพร้อมเข้าอยู่', path: APP_ROUTES.LANDING_AIRPORT_TRANSFER, color: 'cluster-arrive' },
  { icon: Shield, labelEn: 'Insurance & safety', labelRu: 'Страховка и безопасность', labelTh: 'ประกันภัยและความปลอดภัย', descEn: 'Property + medical coverage', descRu: 'Имущество и медстраховка', descTh: 'ความคุ้มครองทรัพย์สินและสุขภาพ', path: APP_ROUTES.INSURANCE, color: 'destructive' },
];

const TRUST = [
  { numRu: '$200–500K', numEn: '$200–500K', numTh: '$200–500K', labelEn: 'Typical budget', labelRu: 'Типичный бюджет', labelTh: 'งบประมาณโดยทั่วไป' },
  { numRu: '60–120 дн/год', numEn: '60–120 days/yr', numTh: '60–120 วัน/ปี', labelEn: 'You stay', labelRu: 'Вы живёте', labelTh: 'คุณพักอาศัย' },
  { numRu: '5% / сделка', numEn: '5% / deal', numTh: '5% / ดีล', labelEn: 'Transparent commission', labelRu: 'Прозрачная комиссия', labelTh: 'ค่าคอมมิชชั่นโปร่งใส' },
];

export default function SecondHomeLandingPage() {
  const { language } = useLanguage();
  const t = language === 'ru';
  const th = language === 'th';
  const navigate = useNavigate();
  const whatsappUrl = getWhatsAppUrl(t ? 'Здравствуйте! Хочу второй дом на Пхукете' : th ? 'สวัสดีครับ/ค่ะ ผม/ดิฉันสนใจบ้านหลังที่สองในภูเก็ต' : 'Hello! I want a second home in Phuket');

  return (
    <>
      <SEOHead
        title={t ? 'Второй дом на Пхукете — myUNO' : th ? 'บ้านหลังที่สองในภูเก็ต — myUNO' : 'Second home in Phuket — myUNO'}
        description={t ? 'Подберём виллу или кондо $200–500K, оформим, будем управлять, пока вас нет. Прозрачная комиссия 5%.' : th ? 'เราคัดสรรวิลล่าหรือคอนโด $200K–$500K ดำเนินการถือครอง และบริหารให้ขณะที่คุณไม่อยู่ ค่าคอมมิชชั่นโปร่งใส 5%' : 'We find your villa or condo $200K–$500K, handle ownership, and manage it while you are away. Transparent 5% commission.'}
        url="https://www.myuno.app/for/second-home"
      />
      <LandingLayout
        icon={Sun}
        title={t ? 'Второй дом на Пхукете' : th ? 'บ้านหลังที่สองในภูเก็ต' : 'Second home in Phuket'}
        subtitle={t ? 'Найти, оформить, управлять — пока вы наслаждаетесь зимой без снега' : th ? 'ค้นหา ถือครอง บริหาร — ขณะที่คุณเพลิดเพลินกับฤดูหนาวที่ไร้หิมะ' : 'Find it, own it, manage it — while you enjoy winters without snow'}
        gradient="from-primary via-primary to-accent"
        heroCta={{ label: t ? 'Подобрать дом' : th ? 'ค้นหาบ้านของฉัน' : 'Find My Home', onClick: () => navigate(APP_ROUTES.PROPERTY_BROWSE + '?mode=buy') }}
        whatsappUrl={whatsappUrl}
        whatsappLabel={t ? 'Обсудить с менеджером' : th ? 'ปรึกษาที่ปรึกษา' : 'Talk to an advisor'}
      >
        <div className="px-4 py-8 grid grid-cols-3 gap-3 max-w-lg mx-auto">
          {TRUST.map((s, i) => (
            <div key={i} className="text-center">
              <p className="text-base font-bold font-display text-foreground tabular-nums">{t ? s.numRu : th ? s.numTh : s.numEn}</p>
              <p className="text-[11px] text-muted-foreground mt-1 leading-tight">{t ? s.labelRu : th ? s.labelTh : s.labelEn}</p>
            </div>
          ))}
        </div>

        <div className="px-4 py-6 max-w-lg mx-auto space-y-3">
          <h2 className="text-xl font-bold font-display text-foreground mb-4 text-center">
            {t ? 'Полный цикл — под одной крышей' : th ? 'ครบวงจร — ภายใต้หลังคาเดียว' : 'Full cycle — under one roof'}
          </h2>
          {STEPS.map((s, i) => {
            const Icon = s.icon;
            return (
              <button key={i} onClick={() => navigate(s.path)} className="w-full flex items-center gap-4 p-4 rounded-none border border-border bg-card text-left transition-all hover:[box-shadow:var(--shadow-elevation-2)]">
                <div className="w-11 h-11 rounded-none flex items-center justify-center shrink-0" style={{ background: tokenColor(s.color, 0.15) }}>
                  <Icon className="w-5 h-5" style={{ color: tokenColor(s.color) }} />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-sm text-foreground">{t ? s.labelRu : th ? s.labelTh : s.labelEn}</h3>
                  <p className="text-xs text-muted-foreground">{t ? s.descRu : th ? s.descTh : s.descEn}</p>
                </div>
                <ArrowRight className="w-4 h-4 text-muted-foreground shrink-0" />
              </button>
            );
          })}
        </div>

        <div className="px-4 py-10 text-center bg-muted/30">
          <Wallet className="w-8 h-8 mx-auto mb-3 text-accent" />
          <p className="text-sm text-muted-foreground mb-2">{t ? 'Средний чек второго дома' : th ? 'งบประมาณบ้านหลังที่สองโดยทั่วไป' : 'Typical second-home ticket'}</p>
          <p className="text-3xl font-bold font-display text-foreground tabular-nums">$200K — $500K</p>
          <p className="text-xs text-muted-foreground mt-2 max-w-sm mx-auto">
            {t ? 'Комиссия 5% за сделку, прозрачные условия, договор на нескольких языках (EN/RU/TH).' : th ? 'ค่าคอมมิชชั่น 5% ต่อดีล เงื่อนไขโปร่งใส สัญญาหลายภาษา (EN/RU/TH)' : '5% commission per deal, transparent terms, multilingual contract (EN/RU/TH).'}
          </p>
        </div>
      </LandingLayout>
    </>
  );
}
