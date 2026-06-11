import { useMemo, useState } from 'react';
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
  descRu: string;
  descEn: string;
  path: string;
  category: Exclude<ToolCategory, 'all'>;
  badgeRu?: string;
  badgeEn?: string;
}

const TOOLS: ToolTile[] = [
  {
    icon: ShieldCheck,
    titleRu: 'ClearView™ — рейтинг проектов',
    titleEn: 'ClearView™ — project rating',
    descRu: '8 критериев, шкала AAA–CCC. Independent due diligence по off-plan и resale.',
    descEn: '8 criteria, AAA–CCC scale. Independent due diligence for off-plan and resale.',
    path: APP_ROUTES.CLEARVIEW,
    category: 'rating',
    badgeRu: 'Moat',
    badgeEn: 'Moat',
  },
  {
    icon: FileText,
    titleRu: 'ClearView для застройщиков',
    titleEn: 'ClearView for developers',
    descRu: 'Подайте проект на независимый рейтинг и получите верифицированный badge.',
    descEn: 'Submit a project for independent rating and earn a verified badge.',
    path: APP_ROUTES.CLEARVIEW_FOR_DEVELOPERS,
    category: 'rating',
  },
  {
    icon: Calculator,
    titleRu: 'Калькулятор доходности',
    titleEn: 'ROI calculator',
    descRu: 'ROI, yield, окупаемость, сценарии аренды и перепродажи.',
    descEn: 'ROI, yield, payback, rental and resale scenarios.',
    path: APP_ROUTES.INVEST_CALCULATOR,
    category: 'calc',
  },
  {
    icon: TrendingUp,
    titleRu: 'Сравнение проектов',
    titleEn: 'Project comparison',
    descRu: 'Сравните off-plan по цене за м², доходности и ClearView-грейду.',
    descEn: 'Compare off-plan by price/sqm, yield and ClearView grade.',
    path: APP_ROUTES.INVEST_REAL_ESTATE,
    category: 'calc',
  },
  {
    icon: Handshake,
    titleRu: 'Capital advisory',
    titleEn: 'Capital advisory',
    descRu: 'Подбор сделки, представление интересов, сопровождение через юристов и BOI.',
    descEn: 'Deal sourcing, representation, legal and BOI support.',
    path: APP_ROUTES.INVEST_SERVICES,
    category: 'advisory',
  },
  {
    icon: Briefcase,
    titleRu: 'Сделки на доске',
    titleEn: 'Deal board',
    descRu: 'Закрытый pipeline активных off-plan, resale и бизнес-сделок.',
    descEn: 'Curated pipeline of active off-plan, resale and business deals.',
    path: APP_ROUTES.INVEST_DEALS_BOARD,
    category: 'advisory',
  },
  {
    icon: ScrollText,
    titleRu: 'Due diligence отчёты',
    titleEn: 'Due diligence reports',
    descRu: 'Готовые DD-пакеты по конкретным проектам и компаниям.',
    descEn: 'Ready due diligence packs for projects and companies.',
    path: APP_ROUTES.CLEARVIEW,
    category: 'dd',
  },
];

export default function InvestmentToolsHub() {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const { getValue, setValue } = useUrlFilters();
  const raw = getValue('cat', 'all');
  const active: ToolCategory = isToolCategory(raw) ? raw : 'all';
  const setActive = (id: ToolCategory) => setValue('cat', id === 'all' ? null : id);


  const filters: FilterRibbonItem[] = useMemo(
    () => [
      { id: 'all', label: isRu ? 'Все' : 'All', icon: Wrench, variant: 'primary' },
      { id: 'rating', label: isRu ? 'Рейтинг' : 'Rating', icon: ShieldCheck },
      { id: 'calc', label: isRu ? 'Расчёт' : 'Calc', icon: Calculator },
      { id: 'advisory', label: 'Advisory', icon: Handshake },
      { id: 'dd', label: 'DD', icon: FileText },
    ],
    [isRu],
  );

  const visible = useMemo(
    () => (active === 'all' ? TOOLS : TOOLS.filter((t) => t.category === active)),
    [active],
  );

  return (
    <>
      <Helmet>
        <title>{isRu ? 'Инвестиционные инструменты | myUNO' : 'Investment tools | myUNO'}</title>
        <meta
          name="description"
          content={
            isRu
              ? 'ClearView, калькулятор доходности, advisory и due diligence — все инструменты для инвестора в одном месте.'
              : 'ClearView, ROI calculator, advisory and due diligence — all investor tools in one place.'
          }
        />
      </Helmet>

      <MiniAppLayout title={isRu ? 'Инструменты' : 'Tools'} showSearch={false}>
        <div className="space-y-4 pb-10">
          <div className="rounded-none border border-border bg-card p-5 space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-none bg-cluster-invest/10 flex items-center justify-center flex-shrink-0">
                <Wrench className="h-5 w-5 text-cluster-invest" />
              </div>
              <div className="min-w-0 flex-1">
                <h1 className="text-lg font-semibold text-foreground leading-tight">
                  {isRu ? 'Инвестиционные инструменты' : 'Investment tools'}
                </h1>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {isRu
                    ? 'Оценка, расчёт и сопровождение сделок в одном движке'
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
                            {isRu ? tool.badgeRu : tool.badgeEn}
                          </Badge>
                        )}
                      </div>
                      <div>
                        <h3 className="font-bold text-base leading-tight">
                          {isRu ? tool.titleRu : tool.titleEn}
                        </h3>
                        <p className="text-xs text-muted-foreground mt-1">
                          {isRu ? tool.descRu : tool.descEn}
                        </p>
                      </div>
                      <div className="flex items-center text-xs text-primary font-medium pt-1">
                        {isRu ? 'Открыть' : 'Open'}
                        <ChevronRight className="w-3.5 h-3.5 ml-1 transition-transform" />
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
            {visible.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-8">
                {isRu ? 'Нет инструментов в этой категории' : 'No tools in this category'}
              </p>
            )}
          </section>
        </div>
      </MiniAppLayout>
    </>
  );
}
