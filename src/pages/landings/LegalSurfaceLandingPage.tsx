import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { LandingLayout } from '@/components/miniapp/LandingLayout';
import { Scale, Stamp, FileText, Building2, Heart, ShieldAlert, BookOpen, ArrowRight } from 'lucide-react';
import { tokenColor } from '@/lib/utils/hslAlpha';
import { SEOHead } from '@/components/seo';
import { buildSurfaceSeo } from '@/lib/landings/surfaceLandingSeo';
import { APP_ROUTES } from '@/lib/config/routes';
import { getWhatsAppUrl } from '@/lib/config/contacts';

const SERVICES = [
  { icon: Stamp, labelEn: 'Visa & immigration', labelRu: 'Виза и иммиграция', labelTh: 'วีซ่าและตรวจคนเข้าเมือง', descEn: 'DTV, LTR, Education, Retirement, Elite', descRu: 'DTV, LTR, Education, Retirement, Elite', descTh: 'DTV, LTR, Education, Retirement, Elite', path: APP_ROUTES.VISA_IMMIGRATION, color: 'primary' },
  { icon: FileText, labelEn: 'Lawyer consultation', labelRu: 'Юридическая консультация', labelTh: 'ปรึกษาทนายความ', descEn: '฿2,000 / 60 min, RU+EN lawyer', descRu: '฿2 000 / 60 мин, юрист RU+EN', descTh: '฿2,000 / 60 นาที ทนาย RU+EN', path: APP_ROUTES.LEGAL, color: 'cluster-invest' },
  { icon: Building2, labelEn: 'Thai company setup', labelRu: 'Открытие тайской компании', labelTh: 'จัดตั้งบริษัทไทย', descEn: 'Co Ltd, BOI, work permit', descRu: 'Co Ltd, BOI, work permit', descTh: 'บริษัทจำกัด BOI ใบอนุญาตทำงาน', path: `${APP_ROUTES.LEGAL}?topic=company`, color: 'accent-purple' },
  { icon: Heart, labelEn: 'Family law', labelRu: 'Семейное право', labelTh: 'กฎหมายครอบครัว', descEn: 'Marriage, divorce, child custody', descRu: 'Брак, развод, опека', descTh: 'การสมรส การหย่า สิทธิเลี้ยงดูบุตร', path: `${APP_ROUTES.LEGAL}?topic=family`, color: 'destructive' },
  { icon: ShieldAlert, labelEn: 'Disputes & insurance', labelRu: 'Споры и страхование', labelTh: 'ข้อพิพาทและประกันภัย', descEn: 'Accident, contract breach, refunds', descRu: 'ДТП, нарушение договора, возвраты', descTh: 'อุบัติเหตุ ผิดสัญญา การคืนเงิน', path: `${APP_ROUTES.LEGAL}?topic=disputes`, color: 'accent-amber' },
  { icon: BookOpen, labelEn: 'Tax & accounting', labelRu: 'Налоги и бухгалтерия', labelTh: 'ภาษีและบัญชี', descEn: 'Personal income tax, payroll, VAT', descRu: 'НДФЛ, зарплата, VAT', descTh: 'ภาษีเงินได้บุคคล เงินเดือน VAT', path: `${APP_ROUTES.LEGAL}?topic=tax`, color: 'cluster-manage' },
];

const STATS = [
  { numRu: '฿2,000', numEn: '฿2,000', numTh: '฿2,000', labelEn: 'Consultation 60 min', labelRu: 'Консультация 60 мин', labelTh: 'ปรึกษา 60 นาที' },
  { numRu: 'RU+EN', numEn: 'EN+RU', numTh: 'EN+RU', labelEn: 'Lawyer languages', labelRu: 'Языки юриста', labelTh: 'ภาษาของทนาย' },
  { numRu: '48 ч', numEn: '48 hrs', numTh: '48 ชม.', labelEn: 'First answer', labelRu: 'Первый ответ', labelTh: 'ตอบกลับครั้งแรก' },
];

export default function LegalSurfaceLandingPage() {
  const { language } = useLanguage();
  const t = language === 'ru';
  const navigate = useNavigate();
  const whatsappUrl = getWhatsAppUrl(language === 'ru' ? 'Здравствуйте! Нужна юридическая помощь на Пхукете' : language === 'th' ? 'สวัสดีครับ/ค่ะ ผม/ดิฉันต้องการความช่วยเหลือด้านกฎหมายที่ภูเก็ต' : 'Hello! I need legal help in Phuket');

  const seo = buildSurfaceSeo('legal', t ? 'ru' : 'en');

  return (
    <>
      <SEOHead title={seo.title} description={seo.description} url={seo.url} jsonLd={seo.jsonLd} />
      <LandingLayout
        icon={Scale}
        title={language === 'ru' ? 'Юридическая помощь' : language === 'th' ? 'ความช่วยเหลือด้านกฎหมาย' : 'Legal help'}
        subtitle={language === 'ru' ? 'Виза, компания, семья, споры и налоги — юристы RU+EN с фиксированной ценой и SLA на ответ' : language === 'th' ? 'วีซ่า บริษัท ครอบครัว ข้อพิพาท และภาษี — ทนาย EN+RU ราคาคงที่พร้อม SLA การตอบกลับ' : 'Visa, company, family, disputes and tax — EN+RU lawyers with fixed price and answer SLA'}
        gradient="from-cluster-legal via-primary to-accent"
        heroCta={{ label: language === 'ru' ? 'Подобрать визу' : language === 'th' ? 'จับคู่วีซ่า' : 'Match a visa', onClick: () => navigate(APP_ROUTES.VISA_QUIZ) }}
        whatsappUrl={whatsappUrl}
        whatsappLabel={language === 'ru' ? 'Связаться с юристом' : language === 'th' ? 'ติดต่อทนายความ' : 'Contact a lawyer'}
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
            {language === 'ru' ? 'Шесть направлений' : language === 'th' ? 'หกด้านกฎหมาย' : 'Six legal tracks'}
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
          <p className="text-sm text-muted-foreground mb-2">{language === 'ru' ? 'Первая консультация' : language === 'th' ? 'การปรึกษาครั้งแรก' : 'First consultation'}</p>
          <p className="text-3xl font-bold font-display text-foreground tabular-nums">฿2,000</p>
          <p className="text-xs text-muted-foreground mt-2 max-w-sm mx-auto">
            {language === 'ru' ? '60 минут с юристом RU+EN. Договор RU+EN. Оплата картой или переводом.' : language === 'th' ? '60 นาทีกับทนาย EN+RU สัญญา EN+RU ชำระด้วยบัตรหรือโอนเงิน' : '60 minutes with an EN+RU lawyer. Contract EN+RU. Card or bank transfer.'}
          </p>
        </div>
      </LandingLayout>
    </>
  );
}
