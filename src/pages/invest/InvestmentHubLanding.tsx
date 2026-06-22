import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import {
  useFeaturedInvestments,
  useInvestmentProjects,
  REAL_ESTATE_CATEGORIES,
  BUSINESS_CATEGORIES,
} from '@/hooks/useInvestmentProjects';
import { InvestmentCard } from '@/components/invest';
import { MiniAppLayout } from '@/components/miniapp';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Card, CardContent } from '@/components/ui/card';
import { VerticalCTA } from '@/components/leads/VerticalCTA';
import {
  TrendingUp,
  Building2,
  Briefcase,
  BookOpen,
  Handshake,
  Megaphone,
  ArrowRight,
  
  ChevronRight,
  Shield,
  FileText,
  Sparkles,
  User,
  ShieldCheck,
  Wrench,
  Calculator,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { APP_ROUTES } from '@/lib/config/routes';

interface ZoneCardProps {
  icon: React.ElementType;
  titleRu: string;
  titleEn: string;
  titleTh: string;
  descRu: string;
  descEn: string;
  descTh: string;
  bullets: { ru: string; en: string; th: string }[];
  ctaPath: string;
  accentClass: string;
  iconBgClass: string;
  badgeRu?: string;
  badgeEn?: string;
  badgeTh?: string;
}

function ZoneCard({
  icon: Icon,
  titleRu,
  titleEn,
  titleTh,
  descRu,
  descEn,
  descTh,
  bullets,
  ctaPath,
  accentClass,
  iconBgClass,
  badgeRu,
  badgeEn,
  badgeTh,
}: ZoneCardProps) {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const isRu = language === 'ru';
  const isTh = language === 'th';
  return (
    <Card
      className={cn(
        'group relative overflow-hidden border-border/60 bg-card hover:border-primary/40 transition-all cursor-pointer',
        accentClass,
      )}
      onClick={() => navigate(ctaPath)}
    >
      <CardContent className="p-5 space-y-3">
        <div className="flex items-start justify-between">
          <div className={cn('w-11 h-11 rounded-none flex items-center justify-center', iconBgClass)}>
            <Icon className="w-5 h-5" />
          </div>
          {badgeRu && (
            <Badge variant="secondary" className="text-[10px]">
              {isRu ? badgeRu : isTh ? badgeTh : badgeEn}
            </Badge>
          )}
        </div>
        <div>
          <h3 className="font-bold text-base leading-tight">{isRu ? titleRu : isTh ? titleTh : titleEn}</h3>
          <p className="text-xs text-muted-foreground mt-1">{isRu ? descRu : isTh ? descTh : descEn}</p>
        </div>
        <ul className="space-y-1">
          {bullets.map((b, idx) => (
            <li key={idx} className="text-xs text-muted-foreground flex items-start gap-1.5">
              <span className="text-primary mt-0.5">•</span>
              <span>{isRu ? b.ru : isTh ? b.th : b.en}</span>
            </li>
          ))}
        </ul>
        <div className="flex items-center text-xs text-primary font-medium pt-1">
          {isRu ? 'Перейти к разделу' : isTh ? 'ไปยังหมวด' : 'Go to section'}
          <ChevronRight className="w-3.5 h-3.5 ml-1 transition-transform" />
        </div>
      </CardContent>
    </Card>
  );
}

export default function InvestmentHubLanding() {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const { user } = useAuth();
  const isRu = language === 'ru';
  const isTh = language === 'th';

  const { data: featured, isLoading: loadingFeatured } = useFeaturedInvestments();
  const { data: allProjects, isLoading: loadingAll } = useInvestmentProjects();

  const realEstateProjects = (allProjects ?? []).filter((p) => p.project_type.startsWith('real_estate')).slice(0, 8);
  const businessProjects = (allProjects ?? []).filter((p) => !p.project_type.startsWith('real_estate')).slice(0, 8);

  const ProjectsRail = ({ projects, loading }: { projects: typeof allProjects; loading: boolean }) => {
    if (loading) {
      return (
        <div className="flex gap-4 overflow-x-auto pb-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex-shrink-0 w-[280px]">
              <Skeleton className="h-[280px] rounded-none" />
            </div>
          ))}
        </div>
      );
    }
    if (!projects?.length) {
      return (
        <div className="text-center py-6 text-sm text-muted-foreground">
          {isRu ? 'Скоро здесь появятся проекты' : isTh ? 'โครงการจะปรากฏที่นี่เร็ว ๆ นี้' : 'Projects coming soon'}
        </div>
      );
    }
    return (
      <ScrollArea className="w-full whitespace-nowrap">
        <div className="flex gap-4 pb-4">
          {projects.map((project) => (
            <InvestmentCard key={project.id} project={project} variant="compact" />
          ))}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    );
  };

  return (
    <>
      <Helmet>
        <title>{isRu ? 'Инвестиции в Таиланде | myUNO' : isTh ? 'ลงทุนในประเทศไทย | myUNO' : 'Invest in Thailand | myUNO'}</title>
        <meta
          name="description"
          content={
            isRu
              ? 'Капитал в Пхукете: недвижимость, готовый бизнес, франшизы, советы и сопровождение сделок'
              : isTh
              ? 'นำเงินทุนเข้าสู่ภูเก็ต: อสังหาริมทรัพย์ ธุรกิจพร้อมขาย แฟรนไชส์ advisory และการดำเนินดีล'
              : 'Move capital into Phuket: real estate, businesses for sale, franchises, advisory & deal execution'
          }
        />
      </Helmet>

      <MiniAppLayout
        title={isRu ? 'Инвестиции' : isTh ? 'การลงทุน' : 'Invest'}
        showSearch={false}
        headerActions={
          user ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate(APP_ROUTES.INVEST_DASHBOARD)}
              className="gap-1.5"
            >
              <User className="h-4 w-4" />
              {isRu ? 'Личный кабинет' : isTh ? 'บัญชีของฉัน' : 'Cabinet'}
            </Button>
          ) : null
        }
      >
        <div className="space-y-6 pb-10">
          {/* Hero — calm, gov-style */}
          <div className="rounded-none border border-border bg-card p-5 space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-none bg-cluster-invest/10 flex items-center justify-center flex-shrink-0">
                <TrendingUp className="h-5 w-5 text-cluster-invest" />
              </div>
              <div className="min-w-0 flex-1">
                <h1 className="text-lg font-semibold text-foreground leading-tight">
                  {isRu ? 'Инвестиции в Таиланде' : isTh ? 'การลงทุนในประเทศไทย' : 'Investments in Thailand'}
                </h1>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {isRu
                    ? 'Недвижимость, готовый бизнес, франшизы, юридическое сопровождение'
                    : isTh
                    ? 'อสังหาริมทรัพย์ ธุรกิจ แฟรนไชส์ การสนับสนุนด้านกฎหมาย'
                    : 'Real estate, businesses, franchises, legal advisory'}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-1.5">
              <Badge variant="secondary" className="text-[10px]">
                <Shield className="h-3 w-3 mr-1" /> muUNO Score
              </Badge>
              <Badge variant="secondary" className="text-[10px]">
                <FileText className="h-3 w-3 mr-1" /> Due Diligence
              </Badge>
              <Badge variant="secondary" className="text-[10px]">
                <Handshake className="h-3 w-3 mr-1" /> Advisory
              </Badge>
            </div>
            <div className="grid grid-cols-3 gap-2 pt-1">
              <Button
                size="sm"
                variant="outline"
                onClick={() => navigate(APP_ROUTES.INVEST_TOOLS)}
                className="gap-1"
              >
                <Calculator className="h-3.5 w-3.5" />
                {isRu ? 'Инструменты' : isTh ? 'เครื่องมือ' : 'Tools'}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => navigate(APP_ROUTES.INVEST_DEALS_BOARD)}
              >
                {isRu ? 'Сделки' : isTh ? 'ดีล' : 'Deals'}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => navigate(APP_ROUTES.INVEST_SUBMIT)}
              >
                {isRu ? 'Подать' : isTh ? 'ส่ง' : 'Submit'}
              </Button>
            </div>
          </div>

          {/* Wave 1: removed duplicate "Capital marketplace" card.
              Hero CTAs above (Deal list / Raise) cover the same action. */}


          {/* 5 Zones */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold px-1">{isRu ? 'Направления хаба' : isTh ? 'โซนของฮับ' : 'Hub Zones'}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <ZoneCard
                icon={Building2}
                titleRu="Недвижимость"
                titleEn="Real Estate"
                titleTh="อสังหาริมทรัพย์"
                descRu="Off-plan, аренда, вторичка, ROI"
                descEn="Off-plan, rental, resale, ROI"
                descTh="Off-plan, ปล่อยเช่า, ขายต่อ, ROI"
                bullets={[
                  { ru: 'Новостройки от застройщиков', en: 'Off-plan from developers', th: 'โครงการ off-plan จากผู้พัฒนา' },
                  { ru: 'Арендный бизнес и переуступки', en: 'Rental business & assignments', th: 'ธุรกิจปล่อยเช่าและการโอนสิทธิ' },
                  { ru: 'Калькулятор доходности', en: 'ROI & yield calculator', th: 'เครื่องคำนวณ ROI และผลตอบแทน' },
                ]}
                ctaPath={APP_ROUTES.INVEST_REAL_ESTATE}
                accentClass="hover:bg-success/5"
                iconBgClass="bg-success/10 text-success dark:text-success"
                badgeRu="Популярно"
                badgeEn="Popular"
                badgeTh="ยอดนิยม"
              />
              <ZoneCard
                icon={Briefcase}
                titleRu="Готовый бизнес"
                titleEn="Business"
                titleTh="ธุรกิจ"
                descRu="Покупка, франшизы, проекты"
                descEn="Buy, franchise, projects"
                descTh="ซื้อ แฟรนไชส์ โครงการ"
                bullets={[
                  { ru: 'Действующий бизнес на продажу', en: 'Operating businesses for sale', th: 'ธุรกิจที่เปิดดำเนินการพร้อมขาย' },
                  { ru: 'Франшизы и партнёрство', en: 'Franchises & partnerships', th: 'แฟรนไชส์และความร่วมมือ' },
                  { ru: 'F&B, отели, retail, marine, import/export', en: 'F&B, hotels, retail, marine, trade', th: 'F&B โรงแรม ค้าปลีก มารีน การค้า' },
                ]}
                ctaPath={APP_ROUTES.INVEST_BUSINESS}
                accentClass="hover:bg-accent/5"
                iconBgClass="bg-accent/10 text-accent dark:text-accent"
                badgeRu="Новое"
                badgeEn="New"
                badgeTh="ใหม่"
              />
              <ZoneCard
                icon={BookOpen}
                titleRu="Знания"
                titleEn="Knowledge"
                titleTh="ความรู้"
                descRu="Гайды по бизнесу в Таиланде"
                descEn="Doing business in Thailand"
                descTh="คู่มือการทำธุรกิจในไทย"
                bullets={[
                  { ru: 'Структуры собственности (Thai Ltd, BOI)', en: 'Ownership structures (Thai Ltd, BOI)', th: 'โครงสร้างการถือครอง (Thai Ltd, BOI)' },
                  { ru: 'Налоги, виза, work permit', en: 'Taxes, visa, work permit', th: 'ภาษี วีซ่า ใบอนุญาตทำงาน' },
                  { ru: 'Как открыть ресторан / отель / spa', en: 'How to open restaurant / hotel / spa', th: 'วิธีเปิดร้านอาหาร / โรงแรม / สปา' },
                ]}
                ctaPath={APP_ROUTES.INVEST_KNOWLEDGE}
                accentClass="hover:bg-primary/5"
                iconBgClass="bg-primary/10 text-primary dark:text-primary"
              />
              <ZoneCard
                icon={Handshake}
                titleRu="Услуги"
                titleEn="Services"
                titleTh="บริการ"
                descRu="Юристы, advisory, представители"
                descEn="Legal, advisory, representation"
                descTh="กฎหมาย advisory การเป็นตัวแทน"
                bullets={[
                  { ru: 'Представляйте мои интересы', en: 'Represent my interests', th: 'เป็นตัวแทนผลประโยชน์ของฉัน' },
                  { ru: 'Юристы, accountants, BOI', en: 'Lawyers, accountants, BOI', th: 'ทนายความ นักบัญชี BOI' },
                  { ru: 'Due diligence и M&A', en: 'Due diligence & M&A', th: 'การตรวจสอบสถานะและ M&A' },
                ]}
                ctaPath={APP_ROUTES.INVEST_SERVICES}
                accentClass="hover:bg-primary/5"
                iconBgClass="bg-primary/10 text-primary dark:text-primary"
              />
              <ZoneCard
                icon={Wrench}
                titleRu="Инструменты инвестора"
                titleEn="Investor tools"
                titleTh="เครื่องมือนักลงทุน"
                descRu="ClearView рейтинг, калькулятор, advisory, DD-пакеты"
                descEn="ClearView rating, calculator, advisory, DD packs"
                descTh="เรตติง ClearView เครื่องคำนวณ advisory แพ็ก DD"
                bullets={[
                  { ru: 'ClearView™ — рейтинг AAA–CCC', en: 'ClearView™ — AAA–CCC rating', th: 'ClearView™ — เรตติง AAA–CCC' },
                  { ru: 'Калькулятор ROI и yield', en: 'ROI & yield calculator', th: 'เครื่องคำนวณ ROI และผลตอบแทน' },
                  { ru: 'Due diligence отчёты', en: 'Due diligence reports', th: 'รายงานการตรวจสอบสถานะ' },
                ]}
                ctaPath={APP_ROUTES.INVEST_TOOLS}
                accentClass="hover:bg-primary/5"
                iconBgClass="bg-primary/10 text-primary dark:text-primary"
                badgeRu="Moat"
                badgeEn="Moat"
                badgeTh="Moat"
              />
              <ZoneCard
                icon={Megaphone}
                titleRu="Привлечь капитал"
                titleEn="Raise Capital"
                titleTh="ระดมทุน"
                descRu="Проекты, бизнес на продажу, стартапы"
                descEn="Projects, business sales, startups"
                descTh="โครงการ การขายธุรกิจ สตาร์ทอัพ"
                bullets={[
                  { ru: 'Разместить проект недвижимости', en: 'List a property project', th: 'ลงประกาศโครงการอสังหาฯ' },
                  { ru: 'Продать действующий бизнес', en: 'Sell an operating business', th: 'ขายธุรกิจที่กำลังดำเนินการอยู่' },
                  { ru: 'Найти ко-инвестора', en: 'Find a co-investor', th: 'หาผู้ร่วมลงทุน' },
                ]}
                ctaPath={APP_ROUTES.INVEST_RAISE}
                accentClass="hover:bg-accent/5 sm:col-span-2"
                iconBgClass="bg-accent/10 text-accent dark:text-accent"
              />

            </div>
          </section>

          {/* Featured selection */}
          {featured && featured.length > 0 && (
            <section className="space-y-3" aria-label={isRu ? 'Подборка' : isTh ? 'คัดสรร' : 'Selection'}>
              <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-muted-foreground" />
                  <h2 className="font-semibold text-lg text-foreground">{isRu ? 'Подборка' : isTh ? 'คัดสรร' : 'Selection'}</h2>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate(APP_ROUTES.INVEST_REAL_ESTATE)}
                  className="text-muted-foreground"
                >
                  {isRu ? 'Все записи' : isTh ? 'รายการทั้งหมด' : 'All entries'}
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
              <ProjectsRail projects={featured} loading={loadingFeatured} />
            </section>
          )}

          {/* Real Estate */}
          <section className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-foreground" />
                <h2 className="font-semibold text-lg text-foreground">{isRu ? 'Недвижимость' : isTh ? 'อสังหาริมทรัพย์' : 'Real Estate'}</h2>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate(APP_ROUTES.INVEST_REAL_ESTATE)}
                className="text-muted-foreground"
              >
                {isRu ? 'Перейти к разделу' : isTh ? 'ไปยังหมวด' : 'Go to section'}
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
            <ProjectsRail projects={realEstateProjects} loading={loadingAll} />
            <div className="flex flex-wrap gap-2 px-1">
              {REAL_ESTATE_CATEGORIES.map((cat) => (
                <Badge
                  key={cat.key}
                  variant="outline"
                  className="cursor-pointer hover:bg-muted"
                  onClick={() => navigate(`${APP_ROUTES.INVEST_REAL_ESTATE}?type=${cat.key}`)}
                >
                  <span className="mr-1">{cat.icon}</span>
                  {isRu ? cat.ru : cat.en}{/* th label not in source taxonomy → EN fallback */}
                </Badge>
              ))}
            </div>
          </section>

          {/* Business */}
          <section className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2">
                <Briefcase className="h-5 w-5 text-foreground" />
                <h2 className="font-semibold text-lg text-foreground">{isRu ? 'Бизнес и франшизы' : isTh ? 'ธุรกิจและแฟรนไชส์' : 'Business & Franchises'}</h2>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate(APP_ROUTES.INVEST_BUSINESS)}
                className="text-muted-foreground"
              >
                {isRu ? 'Перейти к разделу' : isTh ? 'ไปยังหมวด' : 'Go to section'}
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
            <ProjectsRail projects={businessProjects} loading={loadingAll} />
            <ScrollArea className="w-full whitespace-nowrap">
              <div className="flex gap-2 pb-2 px-1">
                {BUSINESS_CATEGORIES.map((cat) => (
                  <Badge
                    key={cat.key}
                    variant="outline"
                    className="cursor-pointer flex-shrink-0 hover:bg-muted"
                    onClick={() => navigate(`${APP_ROUTES.INVEST_BUSINESS}?type=${cat.key}`)}
                  >
                    <span className="mr-1">{cat.icon}</span>
                    {isRu ? cat.ru : cat.en}{/* th label not in source taxonomy → EN fallback */}
                  </Badge>
                ))}
              </div>
              <ScrollBar orientation="horizontal" />
            </ScrollArea>
          </section>

          {/* Knowledge teaser */}
          <Card
            className="border-border bg-card cursor-pointer hover:border-foreground/20 transition-all"
            onClick={() => navigate(APP_ROUTES.INVEST_KNOWLEDGE)}
          >
            <CardContent className="p-5 flex items-start gap-3">
              <div className="p-2 rounded-none bg-muted">
                <BookOpen className="h-5 w-5 text-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-base text-foreground">
                  {isRu ? 'Бизнес в Таиланде. Справочник' : isTh ? 'ทำธุรกิจในไทย คู่มือ' : 'Doing Business in Thailand. Handbook'}
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {isRu
                    ? 'Структуры компаний, налоги, разрешение на работу, BOI, импорт-экспорт, кейсы.'
                    : isTh
                    ? 'โครงสร้างบริษัท ภาษี ใบอนุญาตทำงาน BOI นำเข้า-ส่งออก กรณีศึกษา'
                    : 'Company structures, taxes, work permit, BOI, import-export, case studies.'}
                </p>
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-1" />
            </CardContent>
          </Card>

          {/* Capital services teaser */}
          <Card
            className="border-border bg-card cursor-pointer hover:border-foreground/20 transition-all"
            onClick={() => navigate(APP_ROUTES.INVEST_SERVICES)}
          >
            <CardContent className="p-5 flex items-start gap-3">
              <div className="p-2 rounded-none bg-muted">
                <ShieldCheck className="h-5 w-5 text-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-base text-foreground">
                  {isRu ? 'Сопровождение проекта' : isTh ? 'การดูแลโครงการ' : 'Project representation'}
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {isRu
                    ? 'Подбор местного партнёра, юриста, бухгалтера или оператора для ведения проекта на месте.'
                    : isTh
                    ? 'จัดหาพาร์ทเนอร์ท้องถิ่น ทนายความ นักบัญชี หรือผู้ดำเนินการเพื่อดูแลโครงการในพื้นที่'
                    : 'Local partner, lawyer, accountant or operator running the project on the ground.'}
                </p>
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-1" />
            </CardContent>
          </Card>

          {/* Wave 1: removed duplicate "Project submission" CTA block.
              Hero already exposes Raise as primary action and the Raise zone tile
              above covers the same flow. */}

        </div>
      </MiniAppLayout>
    </>
  );
}
