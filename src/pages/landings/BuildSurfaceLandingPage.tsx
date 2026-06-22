import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { LandingLayout } from '@/components/miniapp/LandingLayout';
import { HardHat, MapPin, FileSignature, Ruler, Hammer, ShieldCheck, KeyRound, ArrowRight } from 'lucide-react';
import { tokenColor } from '@/lib/utils/hslAlpha';
import { SEOHead } from '@/components/seo';
import { buildSurfaceSeo } from '@/lib/landings/surfaceLandingSeo';
import { getWhatsAppUrl } from '@/lib/config/contacts';
import { APP_ROUTES } from '@/lib/config/routes';

const STEPS = [
  { icon: MapPin, labelEn: 'Land plot search', labelRu: 'Подбор земли', labelTh: 'ค้นหาที่ดิน', descEn: 'Chanote / Nor Sor 3 Gor — clean title only', descRu: 'Chanote / Nor Sor 3 Gor — только чистый титул', descTh: 'โฉนด / น.ส.3 ก. — เฉพาะกรรมสิทธิ์ที่สะอาด', path: '/property/browse?type=land', color: 'primary', external: false },
  { icon: FileSignature, labelEn: 'Title & ownership', labelRu: 'Титул и оформление', labelTh: 'กรรมสิทธิ์และการถือครอง', descEn: 'Thai company, lease 30+30+30, due diligence', descRu: 'Тайская компания, lease 30+30+30, due diligence', descTh: 'บริษัทไทย เช่า 30+30+30 ตรวจสอบสถานะ', path: APP_ROUTES.LEGAL, color: 'accent-purple', external: false },
  { icon: Ruler, labelEn: 'Architect & permits', labelRu: 'Архитектор и разрешения', labelTh: 'สถาปนิกและใบอนุญาต', descEn: 'EIA, building permit, utility hookup', descRu: 'EIA, building permit, подключение коммуникаций', descTh: 'EIA ใบอนุญาตก่อสร้าง การเชื่อมต่อสาธารณูปโภค', path: APP_ROUTES.LEGAL, color: 'cluster-arrive', external: true },
  { icon: Hammer, labelEn: 'Build & contractor', labelRu: 'Строительство и подрядчик', labelTh: 'ก่อสร้างและผู้รับเหมา', descEn: 'Vetted contractors, milestone escrow', descRu: 'Проверенные подрядчики, эскроу по этапам', descTh: 'ผู้รับเหมาที่คัดสรร เอสโครว์ตามงวดงาน', path: APP_ROUTES.LEGAL, color: 'accent-amber', external: true },
  { icon: ShieldCheck, labelEn: 'Independent supervision', labelRu: 'Независимый надзор', labelTh: 'การควบคุมงานอิสระ', descEn: 'Inspector on site, photo report monthly', descRu: 'Инспектор на стройке, ежемесячный фото-отчёт', descTh: 'ผู้ตรวจประจำไซต์งาน รายงานภาพถ่ายรายเดือน', path: APP_ROUTES.LEGAL, color: 'cluster-manage', external: true },
  { icon: KeyRound, labelEn: 'Handover & PM', labelRu: 'Сдача и управление', labelTh: 'ส่งมอบและบริหารจัดการ', descEn: 'Snag list, warranty, then we run the rentals', descRu: 'Snag list, гарантия, затем сдача в управление', descTh: 'รายการแก้ไข การรับประกัน แล้วเราดูแลการปล่อยเช่า', path: '/mc', color: 'cluster-invest', external: false },
];

const STATS = [
  { numRu: '฿35–60K', numEn: '฿35–60K', numTh: '฿35–60K', labelEn: 'THB / sqm build', labelRu: 'Стройка ฿/м²', labelTh: 'ค่าก่อสร้าง ฿/ตร.ม.' },
  { numRu: '14–18 мес', numEn: '14–18 mo', numTh: '14–18 เดือน', labelEn: 'Villa cycle', labelRu: 'Цикл виллы', labelTh: 'ระยะเวลาสร้างวิลล่า' },
  { numRu: '5% / сделка', numEn: '5% / deal', numTh: '5% / ดีล', labelEn: 'Land commission', labelRu: 'Комиссия по земле', labelTh: 'ค่าคอมมิชชันที่ดิน' },
];

export default function BuildSurfaceLandingPage() {
  const { language } = useLanguage();
  const t = language === 'ru';
  const navigate = useNavigate();
  const whatsappUrl = getWhatsAppUrl(language === 'ru' ? 'Здравствуйте! Хочу построить виллу на Пхукете' : language === 'th' ? 'สวัสดีครับ/ค่ะ ผม/ดิฉันต้องการสร้างวิลล่าที่ภูเก็ต' : 'Hello! I want to build a villa in Phuket');

  const seo = buildSurfaceSeo('build', t ? 'ru' : 'en');

  return (
    <>
      <SEOHead title={seo.title} description={seo.description} url={seo.url} jsonLd={seo.jsonLd} />
      <LandingLayout
        icon={HardHat}
        title={language === 'ru' ? 'Построить виллу на Пхукете' : language === 'th' ? 'สร้างวิลล่าที่ภูเก็ต' : 'Build a villa in Phuket'}
        subtitle={language === 'ru' ? 'Земля → титул → стройка → сдача → сдача в аренду. Один контракт, один координатор, понятная цена.' : language === 'th' ? 'ที่ดิน → กรรมสิทธิ์ → ก่อสร้าง → ส่งมอบ → ปล่อยเช่า สัญญาเดียว ผู้ประสานงานคนเดียว ราคาโปร่งใส' : 'Land → title → build → handover → rentals. One contract, one coordinator, transparent pricing.'}
        gradient="from-primary via-accent to-cluster-manage"
        heroCta={{ label: language === 'ru' ? 'Обсудить проект' : language === 'th' ? 'พูดคุยโครงการของฉัน' : 'Discuss my project', onClick: () => window.open(whatsappUrl, '_blank') }}
        whatsappUrl={whatsappUrl}
        whatsappLabel={language === 'ru' ? 'Связаться с advisor' : language === 'th' ? 'ติดต่อที่ปรึกษา' : 'Talk to an advisor'}
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
            {language === 'ru' ? 'Этапы — от земли до ключей' : language === 'th' ? 'ขั้นตอน — จากที่ดินถึงกุญแจบ้าน' : 'Stages — from land to keys'}
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
                  <h3 className="font-semibold text-sm text-foreground">{language === 'ru' ? s.labelRu : language === 'th' ? s.labelTh : s.labelEn}</h3>
                  <p className="text-xs text-muted-foreground">{language === 'ru' ? s.descRu : language === 'th' ? s.descTh : s.descEn}</p>
                </div>
                <ArrowRight className="w-4 h-4 text-muted-foreground shrink-0" />
              </button>
            );
          })}
        </div>

        <div className="px-4 py-10 text-center bg-muted/30">
          <p className="text-sm text-muted-foreground mb-2">{language === 'ru' ? 'Бюджет типовой 3BR виллы под ключ' : language === 'th' ? 'งบประมาณวิลล่า 3 ห้องนอนแบบครบวงจรทั่วไป' : 'Typical 3BR turnkey villa budget'}</p>
          <p className="text-3xl font-bold font-display text-foreground tabular-nums">$350K — $1.2M</p>
          <p className="text-xs text-muted-foreground mt-2 max-w-sm mx-auto">
            {language === 'ru' ? 'Эскроу по этапам, фиксированная смета, независимый надзор, гарантия 1 год.' : language === 'th' ? 'เอสโครว์ตามงวดงาน ราคาคงที่ การควบคุมงานอิสระ รับประกัน 1 ปี' : 'Milestone escrow, fixed quote, independent supervision, 1-year warranty.'}
          </p>
        </div>
      </LandingLayout>
    </>
  );
}
