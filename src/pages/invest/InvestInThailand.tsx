import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useLanguage } from '@/contexts/LanguageContext';
import { MiniAppLayout } from '@/components/miniapp';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, Globe2, Building2, Plane, Banknote, ShieldCheck, ArrowRight, Briefcase, BookOpen } from 'lucide-react';
import { APP_ROUTES } from '@/lib/config/routes';
import { ConciergeHelpCTA } from '@/components/concierge/ConciergeHelpCTA';

const MACRO = [
  { icon: TrendingUp, key: 'gdp', en: 'GDP growth +3% (2024)', ru: 'Рост ВВП +3% (2024)', th: 'GDP เติบโต +3% (2024)' },
  { icon: Plane, key: 'tour', en: '40M+ tourists/year', ru: '40M+ туристов в год', th: 'นักท่องเที่ยว 40M+ ต่อปี' },
  { icon: Banknote, key: 'thb', en: 'Stable THB, low inflation', ru: 'Стабильный THB, низкая инфляция', th: 'THB มั่นคง เงินเฟ้อต่ำ' },
  { icon: ShieldCheck, key: 'safe', en: 'Top-30 safest in SEA', ru: 'Топ-30 безопасных в ЮВА', th: 'Top-30 ปลอดภัยที่สุดในเอเชียตะวันออกเฉียงใต้' },
];

const INDUSTRIES = [
  { icon: '🏨', en: 'Hospitality & Hotels', ru: 'Гостеприимство', th: 'การโรงแรมและที่พัก', tic: '20-100M ฿', roi: '8-14%' },
  { icon: '🍽️', en: 'F&B / Restaurants', ru: 'F&B / Рестораны', th: 'F&B / ร้านอาหาร', tic: '5-30M ฿', roi: '15-25%' },
  { icon: '🏗️', en: 'Real Estate Dev', ru: 'Девелопмент', th: 'พัฒนาอสังหาริมทรัพย์', tic: '50-500M ฿', roi: '20-40%' },
  { icon: '🛍️', en: 'Retail / E-com', ru: 'Ритейл / E-com', th: 'ค้าปลีก / E-com', tic: '3-20M ฿', roi: '12-30%' },
  { icon: '⚓', en: 'Marine / Yachts', ru: 'Marine / Яхты', th: 'เรือ / ยอชต์', tic: '10-100M ฿', roi: '10-20%' },
  { icon: '🚢', en: 'Import / Export', ru: 'Импорт / Экспорт', th: 'นำเข้า / ส่งออก', tic: '5-50M ฿', roi: '15-35%' },
  { icon: '🏭', en: 'Manufacturing', ru: 'Производство', th: 'การผลิต', tic: '20-200M ฿', roi: '12-25%' },
  { icon: '💆', en: 'Wellness / Spa', ru: 'Wellness / Spa', th: 'เวลเนส / สปา', tic: '3-15M ฿', roi: '15-30%' },
];

export default function InvestInThailand() {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const isTh = language === 'th';

  return (
    <>
      <Helmet>
        <title>{isRu ? 'Инвестиции в Таиланд | myUNO' : isTh ? 'ลงทุนในประเทศไทย | myUNO' : 'Invest in Thailand | myUNO'}</title>
        <meta
          name="description"
          content={
            isRu
              ? 'Почему стоит инвестировать в Таиланд: макроэкономика, индустрии, тикеты, ROI.'
              : isTh
              ? 'ทำไมจึงควรลงทุนในประเทศไทย: เศรษฐกิจมหภาค อุตสาหกรรม ขนาดการลงทุน ROI'
              : 'Why invest in Thailand: macro, industries, ticket sizes, ROI.'
          }
        />
      </Helmet>
      <MiniAppLayout title={isRu ? 'Invest in Thailand' : 'Invest in Thailand'} showSearch={false}>
        <div className="space-y-5 pb-10">
          {/* Hero */}
          <Card className="bg-gradient-to-br from-primary/15 via-accent/10 to-primary/5 border-primary/20">
            <CardContent className="p-6 space-y-3">
              <Badge variant="secondary" className="gap-1">
                <Globe2 className="h-3 w-3" /> {isRu ? 'Юго-Восточная Азия' : isTh ? 'เอเชียตะวันออกเฉียงใต้' : 'Southeast Asia'}
              </Badge>
              <h1 className="text-2xl font-bold">
                {isRu
                  ? 'Почему капитал движется в Таиланд'
                  : isTh
                  ? 'ทำไมเงินทุนจึงไหลเข้าสู่ประเทศไทย'
                  : 'Why capital is moving into Thailand'}
              </h1>
              <p className="text-sm text-muted-foreground">
                {isRu
                  ? 'Демография, туризм, льготы BOI, доступ на рынки ASEAN, развитая инфраструктура и доступная стоимость входа делают Таиланд №1 направлением для среднего и крупного капитала из СНГ и EU.'
                  : isTh
                  ? 'ประชากรศาสตร์ การท่องเที่ยว สิทธิประโยชน์ BOI การเข้าถึงตลาด ASEAN โครงสร้างพื้นฐานที่พัฒนาแล้ว และต้นทุนการเข้าที่เข้าถึงได้ ทำให้ประเทศไทยเป็นจุดหมายอันดับ 1 สำหรับเงินทุนขนาดกลางและขนาดใหญ่จาก CIS และ EU'
                  : 'Demographics, tourism, BOI incentives, ASEAN market access, mature infrastructure and accessible entry tickets make Thailand the #1 destination for mid-size CIS and EU capital.'}
              </p>
            </CardContent>
          </Card>

          {/* Macro stats */}
          <div className="grid grid-cols-2 gap-3">
            {MACRO.map(({ icon: Icon, key, en, ru, th }) => (
              <Card key={key}>
                <CardContent className="p-4">
                  <Icon className="h-5 w-5 text-primary mb-2" />
                  <div className="text-sm font-semibold leading-tight">{isRu ? ru : isTh ? th : en}</div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Industry briefs */}
          <section className="space-y-3">
            <div className="flex items-baseline justify-between">
              <h2 className="text-lg font-bold">
                {isRu ? 'Куда инвестировать' : isTh ? 'ลงทุนที่ไหน' : 'Where to invest'}
              </h2>
              <Button
                variant="link"
                size="sm"
                className="text-xs"
                onClick={() => navigate(APP_ROUTES.INVEST_BUSINESS)}
              >
                {isRu ? 'Каталог' : isTh ? 'แคตตาล็อก' : 'Catalog'} →
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {INDUSTRIES.map((ind) => (
                <Card key={ind.en} className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => navigate(APP_ROUTES.INVEST_BUSINESS)}>
                  <CardContent className="p-4 space-y-2">
                    <div className="text-2xl">{ind.icon}</div>
                    <div className="font-semibold text-sm leading-tight">{isRu ? ind.ru : isTh ? ind.th : ind.en}</div>
                    <div className="space-y-1 text-xs">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">{isRu ? 'Тикет' : isTh ? 'ขนาดลงทุน' : 'Ticket'}</span>
                        <span className="font-mono">{ind.tic}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">ROI</span>
                        <span className="font-mono text-primary">{ind.roi}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>

          {/* CTA: Real Estate dominates */}
          <Card className="bg-gradient-to-br from-primary/10 to-accent/10 border-primary/20">
            <CardContent className="p-5 space-y-3">
              <div className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-primary" />
                <h3 className="font-bold">
                  {isRu ? 'Недвижимость — основа портфеля' : isTh ? 'อสังหาริมทรัพย์ — แกนหลักของพอร์ต' : 'Real Estate — portfolio anchor'}
                </h3>
              </div>
              <p className="text-sm text-muted-foreground">
                {isRu
                  ? 'Off-plan на ранней стадии даёт 25-40% ROI до сдачи. Готовые виллы — 7-12% годовых аренды. Резидентская виза от 10M ฿.'
                  : isTh
                  ? 'Off-plan ในระยะแรกให้ ROI 25-40% ก่อนส่งมอบ วิลล่าพร้อมอยู่ให้ผลตอบแทนค่าเช่า 7-12% ต่อปี วีซ่านักลงทุนตั้งแต่ 10M ฿'
                  : 'Early off-plan delivers 25-40% ROI before completion. Ready villas yield 7-12% rental p.a. Investor visa from 10M ฿.'}
              </p>
              <div className="flex gap-2">
                <Button onClick={() => navigate(APP_ROUTES.INVEST_REAL_ESTATE)} className="flex-1 gap-1.5">
                  {isRu ? 'Объекты' : isTh ? 'ดูอสังหาฯ' : 'Browse properties'} <ArrowRight className="h-4 w-4" />
                </Button>
                <Button variant="outline" onClick={() => navigate('/newbuilds')}>
                  {isRu ? 'Новостройки' : isTh ? 'โครงการใหม่' : 'New builds'}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* CTA: Knowledge Base */}
          <Card className="bg-gradient-to-br from-accent/10 to-primary/5 border-accent/20">
            <CardContent className="p-5 space-y-3">
              <div className="flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-primary" />
                <h3 className="font-bold">
                  {isRu ? 'База знаний инвестора' : isTh ? 'ฐานความรู้สำหรับนักลงทุน' : 'Investor knowledge base'}
                </h3>
              </div>
              <p className="text-sm text-muted-foreground">
                {isRu
                  ? 'Гайды по структурам, налогам, визам, due diligence и индустриям Таиланда.'
                  : isTh
                  ? 'คู่มือเกี่ยวกับโครงสร้าง ภาษี วีซ่า due diligence และอุตสาหกรรมของไทย'
                  : 'Guides on structures, taxes, visas, due diligence and Thai industries.'}
              </p>
              <Button variant="outline" onClick={() => navigate('/invest/articles')} className="w-full gap-1.5">
                {isRu ? 'Открыть базу знаний' : isTh ? 'เปิดฐานความรู้' : 'Open knowledge base'} <ArrowRight className="h-4 w-4" />
              </Button>
            </CardContent>
          </Card>

          {/* CTA: Capital deal intake (USD 200K+) — RERE Investment track */}
          <Card className="border-border bg-card">
            <CardContent className="p-5 space-y-3">
              <div className="flex items-center gap-2">
                <Briefcase className="h-5 w-5 text-foreground" />
                <h3 className="font-semibold">
                  {isRu ? 'Инвестиционная сделка от 200 000 USD' : isTh ? 'ดีลการลงทุนตั้งแต่ 200,000 USD' : 'Investment deal from USD 200 000'}
                </h3>
              </div>
              <p className="text-sm text-muted-foreground">
                {isRu
                  ? 'Сопровождение сделки: проверка контрагентов, эскроу, подписание. Комиссия — 2% сделки + 0,5% эскроу. Ставки публичны.'
                  : isTh
                  ? 'การดูแลดีล: ตรวจสอบคู่สัญญา เอสโครว์ การลงนาม ค่าธรรมเนียม — 2% ของดีล + 0.5% เอสโครว์ อัตราเปิดเผยต่อสาธารณะ'
                  : 'Deal support: counterparty checks, escrow, signing. Fee — 2% deal + 0.5% escrow. Rates are public.'}
              </p>
              <Button onClick={() => navigate('/invest/capital-deal')} className="w-full gap-1.5">
                {isRu ? 'Перейти к услуге' : isTh ? 'เปิดบริการ' : 'Open service'} <ArrowRight className="h-4 w-4" />
              </Button>
            </CardContent>
          </Card>

          {/* CTA: Pitch */}
          <Card className="bg-gradient-to-br from-primary/10 to-accent/5 border-primary/20">
            <CardContent className="p-5 space-y-3">
              <div className="flex items-center gap-2">
                <Briefcase className="h-5 w-5 text-primary" />
                <h3 className="font-bold">
                  {isRu ? 'У вас проект или бизнес?' : isTh ? 'มีโครงการหรือธุรกิจหรือไม่?' : 'Have a project or business?'}
                </h3>
              </div>
              <p className="text-sm text-muted-foreground">
                {isRu
                  ? 'Девелоперы, операторы, основатели: подайте проект — мы покажем его релевантным инвесторам анонимно.'
                  : isTh
                  ? 'นักพัฒนา ผู้ดำเนินการ ผู้ก่อตั้ง: นำเสนอโครงการของคุณ — เราจะจับคู่กับนักลงทุนที่เกี่ยวข้องแบบไม่เปิดเผยตัวตน'
                  : 'Developers, operators, founders: pitch your project — we match anonymously to relevant investors.'}
              </p>
              <Button onClick={() => navigate('/invest/submit')} className="w-full gap-1.5">
                {isRu ? 'Подать проект' : isTh ? 'นำเสนอโครงการ' : 'Pitch your project'} <ArrowRight className="h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        </div>
        <div className="mt-6">
          <ConciergeHelpCTA topic="invest" variant="card" />
        </div>
      </MiniAppLayout>
    </>
  );
}
