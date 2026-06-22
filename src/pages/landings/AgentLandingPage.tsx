import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { LandingLayout } from '@/components/miniapp/LandingLayout';
import { Handshake, Users, Percent, FileSignature, LayoutDashboard, MessageSquare, ArrowRight, Award } from 'lucide-react';
import { tokenColor } from '@/lib/utils/hslAlpha';
import { SEOHead } from '@/components/seo';
import { getWhatsAppUrl } from '@/lib/config/contacts';

const STEPS = [
  { icon: Users, labelEn: 'Bring your buyers', labelRu: 'Приводите своих клиентов', labelTh: 'พาลูกค้าของคุณมา', descEn: 'Investors, second-home, relocators', descRu: 'Инвесторы, вторые дома, релоканты', descTh: 'นักลงทุน บ้านหลังที่สอง ผู้ย้ายถิ่นฐาน', path: '/agent/join', color: 'primary' },
  { icon: Percent, labelEn: '50/50 commission split', labelRu: 'Делёжка комиссии 50/50', labelTh: 'แบ่งค่าคอมมิชชัน 50/50', descEn: 'Half of our 5% goes to you', descRu: 'Половина нашей 5% — вам', descTh: 'ครึ่งหนึ่งของ 5% เป็นของคุณ', path: '/agent/join#commission', color: 'cluster-invest' },
  { icon: FileSignature, labelEn: 'We close the deal', labelRu: 'Закрытие сделки — на нас', labelTh: 'เราปิดดีลให้', descEn: 'Legal, escrow, due diligence', descRu: 'Юрист, эскроу, due diligence', descTh: 'กฎหมาย เอสโครว์ ตรวจสอบสถานะ', path: '/legal', color: 'accent-purple' },
  { icon: LayoutDashboard, labelEn: 'Agent dashboard', labelRu: 'Кабинет агента', labelTh: 'แดชบอร์ดเอเจนต์', descEn: 'Track leads, deals, payouts', descRu: 'Лиды, сделки, выплаты', descTh: 'ติดตามลีด ดีล และยอดจ่าย', path: '/agent/dashboard', color: 'cluster-manage' },
  { icon: MessageSquare, labelEn: 'Co-marketing assets', labelRu: 'Маркетинговые материалы', labelTh: 'สื่อการตลาดร่วม', descEn: 'Listings, decks, RU+EN content', descRu: 'Листинги, презентации, RU+EN', descTh: 'ลิสติ้ง พรีเซนเทชัน คอนเทนต์ RU+EN', path: '/agent/resources', color: 'accent-amber' },
  { icon: Award, labelEn: 'Verified Partner badge', labelRu: 'Бейдж Verified Partner', labelTh: 'ตราพาร์ตเนอร์ที่ได้รับการยืนยัน', descEn: 'Boost trust with your clients', descRu: 'Повышает доверие клиентов', descTh: 'เพิ่มความน่าเชื่อถือกับลูกค้าของคุณ', path: '/g-trust', color: 'cluster-arrive' },
];

const STATS = [
  { numRu: '50/50', numEn: '50/50', numTh: '50/50', labelEn: 'Commission split', labelRu: 'Доля комиссии', labelTh: 'การแบ่งค่าคอมมิชชัน' },
  { numRu: '14 дн', numEn: '14 days', numTh: '14 วัน', labelEn: 'Payout window', labelRu: 'Срок выплаты', labelTh: 'ระยะเวลาจ่าย' },
  { numRu: '500+', numEn: '500+', numTh: '500+', labelEn: 'Listings', labelRu: 'Листингов', labelTh: 'รายการ' },
];

export default function AgentLandingPage() {
  const { language } = useLanguage();
  const t = language === 'ru';
  const navigate = useNavigate();
  const whatsappUrl = getWhatsAppUrl(language === 'ru' ? 'Здравствуйте! Я агент и хочу сотрудничать с myUNO' : language === 'th' ? 'สวัสดีครับ/ค่ะ ผม/ดิฉันเป็นเอเจนต์และต้องการร่วมงานกับ myUNO' : 'Hello! I am an agent and I want to partner with myUNO');

  return (
    <>
      <SEOHead
        title={language === 'ru' ? 'Для агентов недвижимости — myUNO Partners' : language === 'th' ? 'สำหรับเอเจนต์อสังหาริมทรัพย์ — myUNO Partners' : 'For property agents — myUNO Partners'}
        description={language === 'ru' ? 'Приводите клиентов на Пхукет — делим комиссию 50/50. Закрытие сделки, юрист, эскроу — на нас.' : language === 'th' ? 'พาลูกค้ามาภูเก็ต — เราแบ่งค่าคอมมิชชัน 50/50 ปิดดีล กฎหมาย เอสโครว์ ให้เราจัดการ' : 'Bring buyers to Phuket — we split 5% commission 50/50. Closing, legal, escrow — on us.'}
        url="https://www.myuno.app/for/agent"
      />
      <LandingLayout
        icon={Handshake}
        title={language === 'ru' ? 'Для агентов недвижимости' : language === 'th' ? 'สำหรับเอเจนต์อสังหาริมทรัพย์' : 'For property agents'}
        subtitle={language === 'ru' ? 'Приводите клиента — закрываем сделку — делим комиссию 50/50' : language === 'th' ? 'พาลูกค้ามา — เราปิดดีล — แบ่งค่าคอมมิชชัน 50/50' : 'Bring the client — we close the deal — split commission 50/50'}
        gradient="from-primary via-accent to-cluster-invest"
        heroCta={{ label: language === 'ru' ? 'Стать партнёром' : language === 'th' ? 'เป็นพาร์ตเนอร์' : 'Become a partner', onClick: () => navigate('/agent/join') }}
        whatsappUrl={whatsappUrl}
        whatsappLabel={language === 'ru' ? 'Обсудить условия' : language === 'th' ? 'พูดคุยเงื่อนไข' : 'Discuss terms'}
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
            {language === 'ru' ? 'Как мы работаем с агентами' : language === 'th' ? 'เราทำงานกับเอเจนต์อย่างไร' : 'How we work with agents'}
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
          <p className="text-sm text-muted-foreground mb-2">{language === 'ru' ? 'Пример выплаты с типичной сделки $400K' : language === 'th' ? 'ตัวอย่างยอดจ่ายจากดีลทั่วไปมูลค่า $400K' : 'Sample payout on a $400K deal'}</p>
          <p className="text-3xl font-bold font-display text-foreground tabular-nums">$10,000</p>
          <p className="text-xs text-muted-foreground mt-2 max-w-sm mx-auto">
            {language === 'ru' ? 'Сделка $400K × 5% = $20,000 → ваша доля 50% = $10,000.' : language === 'th' ? 'ดีล $400K × 5% = $20,000 → ส่วนแบ่ง 50% ของคุณ = $10,000' : 'Deal $400K × 5% = $20,000 → your 50% share = $10,000.'}
          </p>
        </div>
      </LandingLayout>
    </>
  );
}
