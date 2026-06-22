import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { LandingLayout } from '@/components/miniapp/LandingLayout';
import { TrendingUp, ShieldCheck, FileSearch, Coins, Building, Briefcase, BarChart3, ArrowRight } from 'lucide-react';
import { tokenColor } from '@/lib/utils/hslAlpha';
import { SEOHead } from '@/components/seo';
import { buildSurfaceSeo } from '@/lib/landings/surfaceLandingSeo';
import { APP_ROUTES } from '@/lib/config/routes';
import { getWhatsAppUrl } from '@/lib/config/contacts';

const SERVICES = [
  { icon: Building, labelEn: 'Off-plan & new builds', labelRu: 'Off-plan и новостройки', labelTh: 'Off-plan และโครงการใหม่', descEn: 'Vetted developers, ClearView AAA–CCC', descRu: 'Проверенные девелоперы, ClearView AAA–CCC', descTh: 'นักพัฒนาที่คัดสรร ClearView AAA–CCC', path: '/newbuilds', color: 'primary' },
  { icon: ShieldCheck, labelEn: 'ClearView rating', labelRu: 'Рейтинг ClearView', labelTh: 'เรตติ้ง ClearView', descEn: '8 criteria, independent score', descRu: '8 критериев, независимая оценка', descTh: '8 เกณฑ์ คะแนนอิสระ', path: '/clearview', color: 'cluster-invest' },
  { icon: FileSearch, labelEn: 'Due diligence', labelRu: 'Юридический due diligence', labelTh: 'การตรวจสอบสถานะ', descEn: 'Title, EIA, developer track record', descRu: 'Титул, EIA, история девелопера', descTh: 'กรรมสิทธิ์ EIA ประวัตินักพัฒนา', path: APP_ROUTES.LEGAL, color: 'accent-purple' },
  { icon: Coins, labelEn: 'Capital deals', labelRu: 'Capital-сделки', labelTh: 'ดีลทุน (Capital)', descEn: 'Mandate-based, $2M+ tickets', descRu: 'Mandate-режим, чеки от $2M', descTh: 'แบบมอบหมาย เริ่มต้น $2M+', path: APP_ROUTES.INVEST_DEALS_BOARD, color: 'accent-amber' },
  { icon: Briefcase, labelEn: 'Business investment', labelRu: 'Бизнес-инвестиции', labelTh: 'การลงทุนในธุรกิจ', descEn: 'F&B, hospitality, SaaS deals', descRu: 'F&B, hospitality, SaaS сделки', descTh: 'ดีล F&B โรงแรม SaaS', path: APP_ROUTES.INVEST_BUSINESS, color: 'cluster-arrive' },
  { icon: BarChart3, labelEn: 'Investor dashboard', labelRu: 'Личный кабинет инвестора', labelTh: 'แดชบอร์ดนักลงทุน', descEn: 'P&L, milestones, escrow tracker', descRu: 'P&L, этапы, эскроу-трекер', descTh: 'P&L งวดงาน ติดตามเอสโครว์', path: APP_ROUTES.INVEST_DASHBOARD, color: 'cluster-manage' },
];

const STATS = [
  { numRu: 'AAA–CCC', numEn: 'AAA–CCC', numTh: 'AAA–CCC', labelEn: 'ClearView scale', labelRu: 'Шкала ClearView', labelTh: 'สเกล ClearView' },
  { numRu: '6–9%', numEn: '6–9%', numTh: '6–9%', labelEn: 'Net yield p.a.', labelRu: 'Чистая доходность', labelTh: 'ผลตอบแทนสุทธิต่อปี' },
  { numRu: '$200K+', numEn: '$200K+', numTh: '$200K+', labelEn: 'Ticket from', labelRu: 'Чек от', labelTh: 'เริ่มต้นที่' },
];

export default function InvestSurfaceLandingPage() {
  const { language } = useLanguage();
  const t = language === 'ru';
  const navigate = useNavigate();
  const whatsappUrl = getWhatsAppUrl(language === 'ru' ? 'Здравствуйте! Рассматриваю инвестиции в Пхукет' : language === 'th' ? 'สวัสดีครับ/ค่ะ ผม/ดิฉันกำลังพิจารณาการลงทุนที่ภูเก็ต' : 'Hello! I am considering investing in Phuket');

  const seo = buildSurfaceSeo('invest', t ? 'ru' : 'en');

  return (
    <>
      <SEOHead title={seo.title} description={seo.description} url={seo.url} jsonLd={seo.jsonLd} />
      <LandingLayout
        icon={TrendingUp}
        title={language === 'ru' ? 'Инвестиции на Пхукете' : language === 'th' ? 'ลงทุนที่ภูเก็ต' : 'Invest in Phuket'}
        subtitle={language === 'ru' ? 'Недвижимость, бизнес, capital-сделки — с независимым ClearView-рейтингом и юридической чистотой' : language === 'th' ? 'อสังหาริมทรัพย์ ธุรกิจ และดีลทุน — พร้อมเรตติ้ง ClearView อิสระและโครงสร้างทางกฎหมายที่สะอาด' : 'Real estate, business and capital deals — with independent ClearView ratings and clean legal structure'}
        gradient="from-cluster-invest via-primary to-accent"
        heroCta={{ label: language === 'ru' ? 'Подобрать объект' : language === 'th' ? 'จับคู่ดีล' : 'Match a deal', onClick: () => navigate(APP_ROUTES.INVEST_QUIZ) }}
        whatsappUrl={whatsappUrl}
        whatsappLabel={language === 'ru' ? 'Поговорить с advisor' : language === 'th' ? 'พูดคุยกับที่ปรึกษา' : 'Talk to an advisor'}
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
            {language === 'ru' ? 'Инвестиционный стек' : language === 'th' ? 'ชุดเครื่องมือการลงทุน' : 'The investment stack'}
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
          <p className="text-sm text-muted-foreground mb-2">{language === 'ru' ? 'Комиссия по сделке' : language === 'th' ? 'ค่าคอมมิชชันต่อดีล' : 'Deal commission'}</p>
          <p className="text-3xl font-bold font-display text-foreground tabular-nums">3–5%</p>
          <p className="text-xs text-muted-foreground mt-2 max-w-sm mx-auto">
            {language === 'ru' ? 'Эскроу по этапам, отчёт собственнику ежемесячно. WorldCheck для российских паспортов.' : language === 'th' ? 'เอสโครว์ตามงวดงาน รายงานเจ้าของรายเดือน ใช้ WorldCheck สำหรับผู้ถือหนังสือเดินทางรัสเซีย' : 'Milestone escrow, monthly owner report. WorldCheck applied for Russian passport holders.'}
          </p>
        </div>
      </LandingLayout>
    </>
  );
}
