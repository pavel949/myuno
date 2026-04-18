/**
 * /newbuilds — Themed hub: tools & CTAs. Canonical catalog lives at /property/offplan.
 */
import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
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
import { APP_ROUTES } from '@/lib/config/routes';
import { useOffplanProjects } from '@/hooks/useOffplanProjects';

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
  const { data: allProjects, isLoading } = useOffplanProjects();
  const projects = allProjects || [];

  const avgYield = useMemo(() => {
    const withRoi = projects.filter((p) => p.roiProjected && p.roiProjected > 0);
    if (withRoi.length === 0) return 0;
    return withRoi.reduce((s, p) => s + (p.roiProjected || 0), 0) / withRoi.length;
  }, [projects]);

  return (
    <NewbuildsLayout>
      <div className="min-h-screen" style={{ background: 'hsl(var(--nb-bg))' }}>
        <header
          className="border-b px-4 py-10 md:py-14"
          style={{ borderColor: 'hsl(var(--nb-gold) / 0.12)', background: 'linear-gradient(180deg, hsl(var(--nb-surface)) 0%, hsl(var(--nb-bg)) 100%)' }}
        >
          <div className="max-w-4xl mx-auto text-center space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[11px] font-semibold tracking-wide" style={{ background: 'hsl(var(--nb-gold) / 0.12)', color: 'hsl(var(--nb-gold))' }}>
              <Building2 className="w-3.5 h-3.5" />
              PHUKET NEW BUILDS
            </div>
            <h1 className="text-2xl md:text-3xl font-bold" style={{ color: 'hsl(var(--nb-text))', fontFamily: 'var(--font-heading-nb)' }}>
              Новостройки Пхукета
            </h1>
            <p className="text-sm md:text-base max-w-xl mx-auto" style={{ color: 'hsl(var(--nb-muted))' }}>
              Единый каталог с фильтрами и аналитикой — в разделе Property Hub. Здесь — карта, сравнение, калькулятор и гайды в фирменной тёмной теме.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3 text-[11px] md:text-xs" style={{ color: 'hsl(var(--nb-muted))' }}>
              {isLoading ? (
                <span>…</span>
              ) : (
                <>
                  <span>
                    <strong style={{ color: 'hsl(var(--nb-text))' }}>{projects.length}</strong> проектов в каталоге
                  </span>
                  {avgYield > 0 && (
                    <span>
                      ~<strong style={{ color: '#22c55e' }}>{avgYield.toFixed(1)}%</strong> средний ROI
                    </span>
                  )}
                </>
              )}
            </div>
            <Button
              asChild
              size="lg"
              className="mt-2 gap-2 rounded-xl font-semibold"
              style={{ background: 'hsl(var(--nb-gold))', color: 'hsl(var(--nb-bg))' }}
            >
              <Link to={APP_ROUTES.OFFPLAN}>
                Открыть каталог
                <ArrowRight className="w-4 h-4" />
              </Link>
            </Button>
          </div>
        </header>

        <section className="max-w-5xl mx-auto px-4 py-8 md:py-10">
          <h2 className="text-sm font-semibold mb-4" style={{ color: 'hsl(var(--nb-text))' }}>
            Инструменты и разделы
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {TOOL_CARDS.map(({ to, title, subtitle, icon: Icon, primary }) => (
              <Link
                key={to}
                to={to}
                className="flex items-start gap-3 p-4 rounded-2xl border transition-all hover:opacity-95"
                style={{
                  borderColor: primary ? 'hsl(var(--nb-gold) / 0.35)' : 'hsl(var(--nb-gold) / 0.12)',
                  background: primary ? 'hsl(var(--nb-gold) / 0.08)' : 'hsl(var(--nb-surface))',
                }}
              >
                <div
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                  style={{ background: 'hsl(var(--nb-gold) / 0.12)', color: 'hsl(var(--nb-gold))' }}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-semibold text-sm" style={{ color: 'hsl(var(--nb-text))' }}>
                    {title}
                  </div>
                  <div className="text-xs mt-0.5" style={{ color: 'hsl(var(--nb-muted))' }}>
                    {subtitle}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </NewbuildsLayout>
  );
}
