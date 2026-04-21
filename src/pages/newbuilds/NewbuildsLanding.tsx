/**
 * /newbuilds — Themed hub: tools & CTAs. Canonical catalog lives at /property/offplan.
 */
import React, { useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Building2,
  Map,
  GitCompare,
  Users,
  Calculator,
  Compass,
  Shield,
  ArrowRight,
} from 'lucide-react';
import NewbuildsLayout from '@/components/newbuilds/NewbuildsLayout';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { APP_ROUTES } from '@/lib/config/routes';
import { useOffplanProjects } from '@/hooks/useOffplanProjects';
import { StartPageLayout, StepByStepNav, type Step } from '@/components/patterns';

type ToolCard = {
  to: string;
  title: string;
  subtitle: string;
  icon: typeof Building2;
  primary?: boolean;
};

const TOOL_CARDS: ToolCard[] = [
  {
    to: APP_ROUTES.OFFPLAN,
    title: 'Каталог',
    subtitle: 'Фильтры и сетка проектов',
    icon: Building2,
    primary: true,
  },
  { to: APP_ROUTES.NEWBUILDS_MAP, title: 'Карта', subtitle: 'Проекты на карте', icon: Map },
  { to: APP_ROUTES.NEWBUILDS_COMPARE, title: 'Сравнение', subtitle: 'До 4 проектов', icon: GitCompare },
  { to: APP_ROUTES.NEWBUILDS_DEVELOPERS, title: 'Застройщики', subtitle: 'Профили девелоперов', icon: Users },
  { to: APP_ROUTES.NEWBUILDS_AREAS, title: 'Районы', subtitle: 'Гайды по локациям', icon: Compass },
  { to: APP_ROUTES.NEWBUILDS_CALCULATOR, title: 'Калькулятор', subtitle: 'ROI и платежи', icon: Calculator },
  { to: APP_ROUTES.NEWBUILDS_DUE_DILIGENCE, title: 'Due Diligence', subtitle: 'Проверка проектов', icon: Shield },
];

export default function NewbuildsLanding() {
  const navigate = useNavigate();
  const { data: allProjects, isLoading } = useOffplanProjects();
  const projects = allProjects || [];

  const avgYield = useMemo(() => {
    const withRoi = projects.filter((p) => p.roiProjected && p.roiProjected > 0);
    if (withRoi.length === 0) return 0;
    return withRoi.reduce((s, p) => s + (p.roiProjected || 0), 0) / withRoi.length;
  }, [projects]);

  const offplanSteps: Step[] = [
    { id: 'budget', title: 'Определите бюджет', description: 'Цена + рассрочка + меблировка + налоги.', status: 'todo', duration: '30 мин' },
    { id: 'area', title: 'Выберите район', description: 'Bang Tao, Layan, Rawai — у каждого своя экономика.', status: 'todo' },
    { id: 'shortlist', title: 'Соберите шорт-лист', description: 'До 4 проектов в сравнении.', status: 'todo' },
    { id: 'dd', title: 'Due diligence', description: 'Лицензия EIA, escrow, репутация застройщика.', status: 'todo', duration: '1–2 нед' },
    { id: 'reserve', title: 'Резерв и контракт', description: 'Бронь, SPA, перевод первого транша.', status: 'todo', cost: 'от ฿100k' },
    { id: 'payments', title: 'График платежей', description: 'Транши по строительной готовности.', status: 'todo' },
    { id: 'handover', title: 'Приёмка и регистрация', description: 'Snagging, оформление чанот / leasehold.', status: 'todo' },
  ];

  return (
    <NewbuildsLayout>
      <div className="min-h-screen bg-background">
        <header className="relative border-b border-border px-4 py-8 md:py-14 nb-blueprint overflow-hidden">
          <div className="relative z-10 max-w-4xl mx-auto text-center space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[11px] font-semibold tracking-wide bg-primary/10 text-primary">
              <Building2 className="w-3.5 h-3.5" aria-hidden />
              PHUKET NEW BUILDS
            </div>
            <h1 className="nb-display text-2xl md:text-4xl font-semibold text-foreground">
              Новостройки Пхукета
            </h1>
            <p className="text-sm md:text-base max-w-xl mx-auto text-muted-foreground">
              Единый каталог с фильтрами и аналитикой — в разделе Property Hub. Здесь — карта,
              сравнение, калькулятор и гайды в фирменной тёмной теме.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3 text-[11px] md:text-xs text-muted-foreground">
              {isLoading ? (
                <>
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-28" />
                </>
              ) : (
                <>
                  <span>
                    <strong className="text-foreground">{projects.length}</strong> проектов в каталоге
                  </span>
                  {avgYield > 0 && (
                    <span>
                      ~<strong className="text-success">{avgYield.toFixed(1)}%</strong> средний ROI
                    </span>
                  )}
                </>
              )}
            </div>
            <Button
              asChild
              size="lg"
              className="mt-2 gap-2 rounded-xl font-semibold"
            >
              <Link to={APP_ROUTES.OFFPLAN}>
                Открыть каталог
                <ArrowRight className="w-4 h-4" aria-hidden />
              </Link>
            </Button>
          </div>
        </header>

        {/* GOV.UK-style start page for the off-plan purchase journey */}
        <StartPageLayout
          cluster="ИНВЕСТ · 7 ШАГОВ"
          title="Первая покупка off-plan за 7 шагов"
          summary="Понятный путь от выбора района до получения ключей. Каждый шаг — с чек-листом, документами и контактами проверенных юристов."
          meta={{
            duration: '6–24 мес.',
            cost: 'от ฿4,5M',
            eligibility: 'Иностранцы и резиденты',
            requirements: 'Паспорт, бюджет, цель',
          }}
          eligibility={[
            'Иностранец-нерезидент или резидент Таиланда',
            'Цель: жить, сдавать или комбинированная',
            'Бюджет от ฿4,5M (≈ $130k)',
          ]}
          requirements={[
            'Действующий заграничный паспорт',
            'Подтверждение средств на первый взнос',
            'Понимание долгосрочной цели (жить / доход / перепродажа)',
          ]}
          startLabel="Открыть каталог"
          onStart={() => navigate(APP_ROUTES.OFFPLAN)}
          secondaryLabel="Калькулятор ROI"
          onSecondary={() => navigate(APP_ROUTES.NEWBUILDS_CALCULATOR)}
        />

        <StepByStepNav title="Что нужно сделать" steps={offplanSteps} />

        <section className="max-w-5xl mx-auto px-4 py-8 md:py-10">
          <h2 className="text-sm font-semibold mb-4 text-foreground">
            Инструменты и разделы
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {TOOL_CARDS.map(({ to, title, subtitle, icon: Icon, primary }) => (
              <Link
                key={to}
                to={to}
                className={
                  'flex items-start gap-3 p-4 rounded-2xl border transition-all hover:shadow-card-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-ring ' +
                  (primary
                    ? 'border-primary/35 bg-primary/5'
                    : 'border-border bg-card hover:border-primary/30')
                }
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Icon className="w-5 h-5" aria-hidden />
                </div>
                <div>
                  <div className="font-semibold text-sm text-foreground">{title}</div>
                  <div className="text-xs mt-0.5 text-muted-foreground">{subtitle}</div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </NewbuildsLayout>
  );
}
