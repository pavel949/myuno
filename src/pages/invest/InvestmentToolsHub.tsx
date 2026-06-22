import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useLanguage } from '@/contexts/LanguageContext';
import { MiniAppLayout } from '@/components/miniapp';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Calculator,
  ShieldCheck,
  Handshake,
  FileText,
  ChevronRight,
  Wrench,
  TrendingUp,
  ScrollText,
  Briefcase,
} from 'lucide-react';
import { APP_ROUTES } from '@/lib/config/routes';
import { cn } from '@/lib/utils';
import { UnifiedFilterRibbon, type FilterRibbonItem } from '@/components/shared/UnifiedFilterRibbon';
import { useUrlFilters } from '@/hooks/useUrlFilters';

const TOOL_CATEGORIES = ['all', 'rating', 'calc', 'advisory', 'dd'] as const;
type ToolCategory = typeof TOOL_CATEGORIES[number];
const isToolCategory = (v: string): v is ToolCategory =>
  (TOOL_CATEGORIES as readonly string[]).includes(v);

interface ToolTile {
  icon: React.ElementType;
  titleRu: string;
  titleEn: string;
  titleTh: string;
  descRu: string;
  descEn: string;
  descTh: string;
  path: string;
  category: Exclude<ToolCategory, 'all'>;
  badgeRu?: string;
  badgeEn?: string;
  badgeTh?: string;
}

const TOOLS: ToolTile[] = [
  {
    icon: ShieldCheck,
    titleRu: 'ClearView™ — рейтинг проектов',
    titleEn: 'ClearView™ — project rating',
    titleTh: 'ClearView™ — เรตติงโครงการ',
    descRu: '8 критериев, шкала AAA–CCC. Independent due diligence по off-plan и resale.',
    descEn: '8 criteria, AAA–CCC scale. Independent due diligence for off-plan and resale.',
    descTh: '8 เกณฑ์ มาตรวัด AAA–CCC การตรวจสอบสถานะอิสระสำหรับ off-plan และ resale',
    path: APP_ROUTES.CLEARVIEW,
    category: 'rating',
    badgeRu: 'Moat',
    badgeEn: 'Moat',
    badgeTh: 'Moat',
  },
  {
    icon: FileText,
    titleRu: 'ClearView для застройщиков',
    titleEn: 'ClearView for developers',
    titleTh: 'ClearView สำหรับผู้พัฒนา',
    descRu: 'Подайте проект на независимый рейтинг и получите верифицированный badge.',
    descEn: 'Submit a project for independent rating and earn a verified badge.',
    descTh: 'ส่งโครงการเพื่อรับเรตติงอิสระและรับตราสัญลักษณ์ที่ผ่านการตรวจสอบ',
    path: APP_ROUTES.CLEARVIEW_FOR_DEVELOPERS,
    category: 'rating',
  },
  {
    icon: Calculator,
    titleRu: 'Калькулятор доходности',
    titleEn: 'ROI calculator',
    titleTh: 'เครื่องคำนวณ ROI',
    descRu: 'ROI, yield, окупаемость, сценарии аренды и перепродажи.',
    descEn: 'ROI, yield, payback, rental and resale scenarios.',
    descTh: 'ROI ผลตอบแทน ระยะคืนทุน สถานการณ์ปล่อยเช่าและขายต่อ',
    path: APP_ROUTES.INVEST_CALCULATOR,
    category: 'calc',
  },
  {
    icon: TrendingUp,
    titleRu: 'Сравнение проектов',
    titleEn: 'Project comparison',
    titleTh: 'เปรียบเทียบโครงการ',
    descRu: 'Сравните off-plan по цене за м², доходности и ClearView-грейду.',
    descEn: 'Compare off-plan by price/sqm, yield and ClearView grade.',
    descTh: 'เปรียบเทียบ off-plan ด้วยราคาต่อ ตร.ม. ผลตอบแทน และเกรด ClearView',
    path: APP_ROUTES.INVEST_REAL_ESTATE,
    category: 'calc',
  },
  {
    icon: Handshake,
    titleRu: 'Capital advisory',
    titleEn: 'Capital advisory',
    titleTh: 'Capital advisory',
    descRu: 'Подбор сделки, представление интересов, сопровождение через юристов и BOI.',
    descEn: 'Deal sourcing, representation, legal and BOI support.',
    descTh: 'การจัดหาดีล การเป็นตัวแทน การสนับสนุนด้านกฎหมายและ BOI',
    path: APP_ROUTES.CAPITAL_ADVISORY,
    category: 'advisory',
  },
  {
    icon: Briefcase,
    titleRu: 'Сделки на доске',
    titleEn: 'Deal board',
    titleTh: 'กระดานดีล',
    descRu: 'Закрытый pipeline активных off-plan, resale и бизнес-сделок.',
    descEn: 'Curated pipeline of active off-plan, resale and business deals.',
    descTh: 'ไปป์ไลน์คัดสรรของดีล off-plan, resale และธุรกิจที่กำลังเปิดอยู่',
    path: APP_ROUTES.INVEST_DEALS_BOARD,
    category: 'advisory',
  },
  {
    icon: ScrollText,
    titleRu: 'Due diligence отчёты',
    titleEn: 'Due diligence reports',
    titleTh: 'รายงานการตรวจสอบสถานะ',
    descRu: 'Готовые DD-пакеты по конкретным проектам и компаниям.',
    descEn: 'Ready due diligence packs for projects and companies.',
    descTh: 'แพ็กการตรวจสอบสถานะสำเร็จรูปสำหรับโครงการและบริษัท',
    path: APP_ROUTES.CLEARVIEW,
    category: 'dd',
  },
];

export default function InvestmentToolsHub() {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const isTh = language === 'th';
  const { getValue, setValue } = useUrlFilters();
  const raw = getValue('cat', 'all');
  const active: ToolCategory = isToolCategory(raw) ? raw : 'all';
  const setActive = (id: ToolCategory) => setValue('cat', id === 'all' ? null : id);


  const filters: FilterRibbonItem[] = useMemo(
    () => [
      { id: 'all', label: isRu ? 'Все' : isTh ? 'ทั้งหมด' : 'All', icon: Wrench, variant: 'primary' },
      { id: 'rating', label: isRu ? 'Рейтинг' : isTh ? 'เรตติง' : 'Rating', icon: ShieldCheck },
      { id: 'calc', label: isRu ? 'Расчёт' : isTh ? 'คำนวณ' : 'Calc', icon: Calculator },
      { id: 'advisory', label: 'Advisory', icon: Handshake },
      { id: 'dd', label: 'DD', icon: FileText },
    ],
    [isRu, isTh],
  );

  const visible = useMemo(
    () => (active === 'all' ? TOOLS : TOOLS.filter((t) => t.category === active)),
    [active],
  );

  return (
    <>
      <Helmet>
        <title>{isRu ? 'Инвестиционные инструменты | myUNO' : isTh ? 'เครื่องมือการลงทุน | myUNO' : 'Investment tools | myUNO'}</title>
        <meta
          name="description"
          content={
            isRu
              ? 'ClearView, калькулятор доходности, advisory и due diligence — все инструменты для инвестора в одном месте.'
              : isTh
              ? 'ClearView เครื่องคำนวณ ROI advisory และการตรวจสอบสถานะ — เครื่องมือสำหรับนักลงทุนครบในที่เดียว'
              : 'ClearView, ROI calculator, advisory and due diligence — all investor tools in one place.'
          }
        />
      </Helmet>

      <MiniAppLayout title={isRu ? 'Инструменты' : isTh ? 'เครื่องมือ' : 'Tools'} showSearch={false}>
        <div className="space-y-4 pb-10">
          <div className="rounded-none border border-border bg-card p-5 space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-none bg-cluster-invest/10 flex items-center justify-center flex-shrink-0">
                <Wrench className="h-5 w-5 text-cluster-invest" />
              </div>
              <div className="min-w-0 flex-1">
                <h1 className="text-lg font-semibold text-foreground leading-tight">
                  {isRu ? 'Инвестиционные инструменты' : isTh ? 'เครื่องมือการลงทุน' : 'Investment tools'}
                </h1>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {isRu
                    ? 'Оценка, расчёт и сопровождение сделок в одном движке'
                    : isTh
                    ? 'การประเมิน คำนวณ และสนับสนุนดีลในเอนจินเดียว'
                    : 'Rating, calculation, deal support in one engine'}
                </p>
              </div>
            </div>
          </div>

          <UnifiedFilterRibbon
            items={filters}
            activeId={active}
            onSelect={(id) => setActive(id as ToolCategory)}
          />

          <section className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {visible.map((tool) => {
                const Icon = tool.icon;
                return (
                  <Card
                    key={`${tool.titleEn}-${tool.path}`}
                    className={cn(
                      'group relative overflow-hidden border-border/60 bg-card hover:border-primary/40 transition-all cursor-pointer',
                    )}
                    onClick={() => navigate(tool.path)}
                  >
                    <CardContent className="p-5 space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="w-11 h-11 rounded-none bg-primary/10 text-primary flex items-center justify-center">
                          <Icon className="w-5 h-5" />
                        </div>
                        {tool.badgeRu && (
                          <Badge variant="secondary" className="text-[10px]">
                            {isRu ? tool.badgeRu : isTh ? tool.badgeTh : tool.badgeEn}
                          </Badge>
                        )}
                      </div>
                      <div>
                        <h3 className="font-bold text-base leading-tight">
                          {isRu ? tool.titleRu : isTh ? tool.titleTh : tool.titleEn}
                        </h3>
                        <p className="text-xs text-muted-foreground mt-1">
                          {isRu ? tool.descRu : isTh ? tool.descTh : tool.descEn}
                        </p>
                      </div>
                      <div className="flex items-center text-xs text-primary font-medium pt-1">
                        {isRu ? 'Открыть' : isTh ? 'เปิด' : 'Open'}
                        <ChevronRight className="w-3.5 h-3.5 ml-1 transition-transform" />
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
            {visible.length === 0 && (
              <div
                role="status"
                aria-live="polite"
                className="border border-dashed border-border bg-card/40 px-6 py-10 flex flex-col items-center text-center gap-3"
              >
                <div className="w-12 h-12 rounded-none bg-muted flex items-center justify-center">
                  <Wrench className="w-5 h-5 text-muted-foreground" aria-hidden />
                </div>
                <div className="space-y-1 max-w-xs">
                  <p className="text-sm font-semibold text-foreground">
                    {isRu ? 'В этой категории пока пусто' : isTh ? 'ยังไม่มีรายการในหมวดนี้' : 'Nothing in this category yet'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {isRu
                      ? 'Сбросьте фильтр, чтобы увидеть все инвестиционные инструменты.'
                      : isTh
                      ? 'รีเซ็ตตัวกรองเพื่อดูเครื่องมือสำหรับนักลงทุนทั้งหมด'
                      : 'Reset the filter to see all investor tools.'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setActive('all')}
                  className="text-xs font-medium text-primary hover:underline"
                >
                  {isRu ? 'Показать все инструменты' : isTh ? 'แสดงเครื่องมือทั้งหมด' : 'Show all tools'}
                </button>
              </div>
            )}
          </section>
        </div>
      </MiniAppLayout>
    </>
  );
}
