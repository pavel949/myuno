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
  { icon: Calendar, labelEn: 'Calendar & channels', labelRu: 'Календарь и каналы', labelTh: 'ปฏิทินและช่องทาง', descEn: 'Airbnb, Booking, Agoda — single inbox', descRu: 'Airbnb, Booking, Agoda — один календарь', descTh: 'Airbnb, Booking, Agoda — ปฏิทินเดียว', path: '/mc/calendar', color: 'primary' },
  { icon: Users, labelEn: 'Guest experience', labelRu: 'Гость и сервис', labelTh: 'ประสบการณ์ของแขก', descEn: 'AI-chat RU/EN, lifecycle messaging', descRu: 'AI-чат RU/EN, lifecycle-рассылки', descTh: 'แชต AI RU/EN ข้อความตามวงจรการเข้าพัก', path: '/mc/guests', color: 'accent-cyan' },
  { icon: Wrench, labelEn: 'Cleaning & maintenance', labelRu: 'Уборка и техника', labelTh: 'ทำความสะอาดและซ่อมบำรุง', descEn: 'Auto-tasks, preventive schedule', descRu: 'Авто-задачи, профилактика', descTh: 'งานอัตโนมัติ ตารางบำรุงรักษาเชิงป้องกัน', path: '/mc/operations', color: 'cluster-arrive' },
  { icon: Receipt, labelEn: 'Owner P&L', labelRu: 'Отчёт собственнику', labelTh: 'งบกำไรขาดทุนเจ้าของ', descEn: 'Monthly statement, tax-ready', descRu: 'Ежемесячный отчёт, готовый для налогов', descTh: 'รายงานรายเดือน พร้อมยื่นภาษี', path: '/mc/financials', color: 'cluster-invest' },
  { icon: BarChart3, labelEn: 'Dynamic pricing', labelRu: 'Динамические цены', labelTh: 'ราคาแบบไดนามิก', descEn: 'Season + override, channel sync', descRu: 'Сезон + ручное, синк по каналам', descTh: 'ตามฤดูกาล + ปรับเอง ซิงก์ทุกช่องทาง', path: '/mc/pricing', color: 'accent-amber' },
  { icon: ClipboardCheck, labelEn: 'Portfolio health', labelRu: 'Здоровье портфеля', labelTh: 'สุขภาพพอร์ต', descEn: '8 checks per property, 0–100%', descRu: '8 проверок по объекту, 0–100%', descTh: 'ตรวจสอบ 8 รายการต่อทรัพย์ 0–100%', path: '/mc/health', color: 'cluster-manage' },
];

const STATS = [
  { numRu: '$25/мес', numEn: '$25/mo', numTh: '$25/เดือน', labelEn: 'PMS per property', labelRu: 'PMS за объект', labelTh: 'PMS ต่อทรัพย์' },
  { numRu: '10–15%', numEn: '10–15%', numTh: '10–15%', labelEn: 'Management fee', labelRu: 'Комиссия PM', labelTh: 'ค่าบริหารจัดการ' },
  { numRu: '24/7', numEn: '24/7', numTh: '24/7', labelEn: 'Guest support', labelRu: 'Поддержка гостей', labelTh: 'ดูแลแขก' },
];

export default function ManageSurfaceLandingPage() {
  const { language } = useLanguage();
  const t = language === 'ru';
  const navigate = useNavigate();
  const whatsappUrl = getWhatsAppUrl(language === 'ru' ? 'Здравствуйте! Хочу обсудить управление недвижимостью' : language === 'th' ? 'สวัสดีครับ/ค่ะ ผม/ดิฉันต้องการปรึกษาเรื่องการบริหารจัดการอสังหาริมทรัพย์' : 'Hello! I want to discuss property management');

  const seo = buildSurfaceSeo('manage', t ? 'ru' : 'en');

  return (
    <>
      <SEOHead title={seo.title} description={seo.description} url={seo.url} jsonLd={seo.jsonLd} />
      <LandingLayout
        icon={Building2}
        title={language === 'ru' ? 'Управление недвижимостью' : language === 'th' ? 'บริหารจัดการอสังหาริมทรัพย์' : 'Manage your property'}
        subtitle={language === 'ru' ? 'PMS, channel manager, гости, уборка и отчёты — один продукт вместо пяти подрядчиков' : language === 'th' ? 'PMS, channel manager, แขก, ทำความสะอาด และรายงาน — ผลิตภัณฑ์เดียวแทนผู้รับเหมาห้าราย' : 'PMS, channel manager, guests, cleaning and reports — one product instead of five vendors'}
        gradient="from-cluster-manage via-primary to-accent"
        heroCta={{ label: language === 'ru' ? 'Завести объект' : language === 'th' ? 'เพิ่มทรัพย์สิน' : 'Add a property', onClick: () => navigate('/owner/onboarding') }}
        whatsappUrl={whatsappUrl}
        whatsappLabel={language === 'ru' ? 'Поговорить с MC' : language === 'th' ? 'พูดคุยกับทีม MC' : 'Talk to MC team'}
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
            {language === 'ru' ? 'Что входит в управление' : language === 'th' ? 'การบริหารจัดการครอบคลุมอะไรบ้าง' : 'What management covers'}
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
          <p className="text-sm text-muted-foreground mb-2">{language === 'ru' ? 'Полное управление' : language === 'th' ? 'การบริหารจัดการเต็มรูปแบบ' : 'Full management'}</p>
          <p className="text-3xl font-bold font-display text-foreground tabular-nums">10–15%</p>
          <p className="text-xs text-muted-foreground mt-2 max-w-sm mx-auto">
            {language === 'ru' ? 'Канал-менеджер, гости, уборка, отчёты. Договор RU+EN, ежемесячный P&L.' : language === 'th' ? 'channel manager แขก ทำความสะอาด รายงาน สัญญา EN+RU งบกำไรขาดทุนรายเดือน' : 'Channel manager, guests, cleaning, reports. Contract EN+RU, monthly P&L.'}
          </p>
        </div>
      </LandingLayout>
    </>
  );
}
