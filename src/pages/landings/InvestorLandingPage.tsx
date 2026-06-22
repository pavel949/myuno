import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { LandingLayout } from '@/components/miniapp/LandingLayout';
import { TrendingUp, Building2, BarChart3, ShieldCheck, FileText, Globe, ArrowRight, Briefcase } from 'lucide-react';
import { tokenColor } from '@/lib/utils/hslAlpha';
import { SEOHead } from '@/components/seo';
import { APP_ROUTES } from '@/lib/config/routes';
import { getWhatsAppUrl } from '@/lib/config/contacts';

const STEPS = [
  { icon: Building2, labelEn: 'Off-plan & resale deals', labelRu: 'Новостройки и resale', labelTh: 'ดีล Off-plan และขายต่อ', descEn: 'Curated AAA–CCCB projects only', descRu: 'Только AAA–CCCB по ClearView™', descTh: 'เฉพาะโครงการ AAA–CCCB ที่คัดสรร', path: APP_ROUTES.LANDING_NEW_DEVELOPMENTS, color: 'primary' },
  { icon: BarChart3, labelEn: 'ClearView™ ratings', labelRu: 'Рейтинги ClearView™', labelTh: 'เรตติ้ง ClearView™', descEn: '8-criteria honest scoring', descRu: 'Честная оценка по 8 критериям', descTh: 'คะแนนตรงไปตรงมาจาก 8 เกณฑ์', path: '/newbuilds', color: 'cluster-invest' },
  { icon: ShieldCheck, labelEn: 'Due diligence', labelRu: 'Due diligence', labelTh: 'การตรวจสอบสถานะ', descEn: 'Developer, title, escrow checks', descRu: 'Девелопер, титул, эскроу', descTh: 'ตรวจสอบนักพัฒนา กรรมสิทธิ์ เอสโครว์', path: APP_ROUTES.LEGAL, color: 'accent-purple' },
  { icon: FileText, labelEn: 'Tax & structuring', labelRu: 'Налоги и структура', labelTh: 'ภาษีและการวางโครงสร้าง', descEn: 'Personal vs company ownership', descRu: 'На себя vs через компанию', descTh: 'ถือครองในนามบุคคล vs บริษัท', path: '/tax', color: 'cluster-legal' },
  { icon: Briefcase, labelEn: 'Capital advisory', labelRu: 'Капитальный консалтинг', labelTh: 'ที่ปรึกษาด้านทุน', descEn: 'Portfolio sizing & exit plan', descRu: 'Размер портфеля и exit-план', descTh: 'การจัดขนาดพอร์ตและแผนถอนทุน', path: '/invest-hub', color: 'accent-amber' },
  { icon: Globe, labelEn: 'Cross-border transfers', labelRu: 'Трансграничные переводы', labelTh: 'การโอนเงินข้ามประเทศ', descEn: 'WorldCheck-compliant payment rails', descRu: 'Платёжные рельсы с WorldCheck', descTh: 'ช่องทางชำระเงินที่สอดคล้องกับ WorldCheck', path: APP_ROUTES.BANKING, color: 'cluster-arrive' },
];

const STATS = [
  { numRu: '$2M+', numEn: '$2M+', numTh: '$2M+', labelEn: 'Min ticket', labelRu: 'Минимальный чек', labelTh: 'ขั้นต่ำ' },
  { numRu: '6–8%', numEn: '6–8%', numTh: '6–8%', labelEn: 'Target yield', labelRu: 'Целевая доходность', labelTh: 'ผลตอบแทนเป้าหมาย' },
  { numRu: 'AAA–CCC', numEn: 'AAA–CCC', numTh: 'AAA–CCC', labelEn: 'ClearView™ scale', labelRu: 'Шкала ClearView™', labelTh: 'สเกล ClearView™' },
];

export default function InvestorLandingPage() {
  const { language } = useLanguage();
  const t = language === 'ru';
  const navigate = useNavigate();
  const whatsappUrl = getWhatsAppUrl(language === 'ru' ? 'Здравствуйте! Интересует инвестиционный портфель на Пхукете' : language === 'th' ? 'สวัสดีครับ/ค่ะ ผม/ดิฉันสนใจพอร์ตการลงทุนที่ภูเก็ต' : 'Hello! I am interested in a Phuket investment portfolio');

  return (
    <>
      <SEOHead
        title={language === 'ru' ? 'Инвестиции в Пхукет — портфель $2M+ · myUNO' : language === 'th' ? 'การลงทุนในภูเก็ต — พอร์ต $2M+ · myUNO' : 'Phuket investments — $2M+ portfolio · myUNO'}
        description={language === 'ru' ? 'Капитальный консалтинг для инвесторов от $2M. Off-plan, resale, due diligence, ClearView™ рейтинги, налоговое структурирование.' : language === 'th' ? 'ที่ปรึกษาด้านทุนสำหรับนักลงทุนตั้งแต่ $2M ขึ้นไป Off-plan ขายต่อ ตรวจสอบสถานะ เรตติ้ง ClearView™ และการวางโครงสร้างภาษี' : 'Capital advisory for investors from $2M. Off-plan, resale, due diligence, ClearView™ ratings, tax structuring.'}
        url="https://www.myuno.app/for/investor"
      />
      <LandingLayout
        icon={TrendingUp}
        title={language === 'ru' ? 'Инвесторы — Пхукет' : language === 'th' ? 'นักลงทุน — ภูเก็ต' : 'Investors — Phuket'}
        subtitle={language === 'ru' ? 'Капитальный консалтинг от $2M. Только проверенные проекты, прозрачная экономика, честные рейтинги.' : language === 'th' ? 'ที่ปรึกษาด้านทุนตั้งแต่ $2M เฉพาะโครงการที่ตรวจสอบแล้ว เศรษฐศาสตร์โปร่งใส เรตติ้งตรงไปตรงมา' : 'Capital advisory from $2M. Vetted projects only, transparent economics, honest ratings.'}
        gradient="from-primary via-cluster-invest to-accent"
        heroCta={{ label: language === 'ru' ? 'Получить портфель' : language === 'th' ? 'ขอพอร์ตการลงทุน' : 'Request portfolio', onClick: () => window.open(whatsappUrl, '_blank') }}
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
            {language === 'ru' ? 'Что вы получаете' : language === 'th' ? 'สิ่งที่คุณจะได้รับ' : 'What you get'}
          </h2>
          {STEPS.map((s, i) => {
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
          <p className="text-sm text-muted-foreground mb-2">{language === 'ru' ? 'Комиссия по сделке' : language === 'th' ? 'ค่าคอมมิชชันต่อดีล' : 'Deal commission'}</p>
          <p className="text-3xl font-bold font-display text-foreground tabular-nums">5%</p>
          <p className="text-xs text-muted-foreground mt-2 max-w-sm mx-auto">
            {language === 'ru' ? 'Прозрачно, без скрытых сборов. Полный аудит каждой сделки в Wallet.' : language === 'th' ? 'โปร่งใส ไม่มีค่าธรรมเนียมแอบแฝง บันทึกตรวจสอบครบทุกดีลใน Wallet' : 'Transparent, no hidden fees. Full audit trail per deal in Wallet.'}
          </p>
        </div>
      </LandingLayout>
    </>
  );
}
