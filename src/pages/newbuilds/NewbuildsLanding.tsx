/**
 * /newbuilds — Public Landing Page
 * Dark luxury editorial design, lead magnet hero
 */
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, MapPin, Building2, TrendingUp, ChevronRight, Check, Calculator, Shield, Map, Compass, GitCompareArrows } from 'lucide-react';
import NewbuildsLayout from '@/components/newbuilds/NewbuildsLayout';
import { NbProjectCard } from '@/components/newbuilds/NbProjectCard';
import { NbPriceDisplay } from '@/components/newbuilds/NbPriceDisplay';
import { NbLeadForm } from '@/components/newbuilds/NbLeadForm';
import { useNewbuildProjects, useNewbuildStats } from '@/hooks/useNewbuildProjects';
import { PHUKET_AREAS } from '@/lib/config/phuketAreas';
import { Skeleton } from '@/components/ui/skeleton';
import { APP_ROUTES } from '@/lib/config/routes';

const AREA_PILLS = ['Все', 'Bang Tao', 'Rawai', 'Kamala', 'Laguna', 'Surin', 'Nai Harn', 'Layan'];
const BUDGET_PILLS = ['до ฿5M', '฿5M–15M', '฿15M+'];
const TYPE_PILLS = ['Вилла', 'Апартаменты'];

export default function NewbuildsLanding() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeArea, setActiveArea] = useState('Все');
  const { data: stats, isLoading: statsLoading } = useNewbuildStats();
  const { data: featured } = useNewbuildProjects({ sort: 'featured' });
  const { data: allProjects } = useNewbuildProjects();

  const featuredProjects = (featured || []).filter(p => p.is_featured).slice(0, 3);
  const gridProjects = (allProjects || []).slice(0, 6);

  return (
    <NewbuildsLayout>
      {/* ── HERO ── */}
      <section className="relative min-h-screen flex flex-col items-center justify-center px-4 nb-blueprint nb-grain overflow-hidden">
        <div className="relative z-10 max-w-4xl mx-auto text-center space-y-8">
          <h1 className="nb-display text-5xl md:text-7xl lg:text-[80px]" style={{ color: 'hsl(var(--nb-gold))' }}>
            Новостройки Пхукета
          </h1>
          <p className="text-lg md:text-xl max-w-2xl mx-auto" style={{ color: 'hsl(var(--nb-text))', fontFamily: 'var(--font-body-nb)' }}>
            Лучшие девелоперские проекты острова. Прямой доступ. Без посредников.
          </p>

          {/* Search bar */}
          <div className="max-w-2xl mx-auto relative">
            <input
              type="text"
              placeholder="Введите район, бюджет или тип недвижимости..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full px-5 py-4 pr-14 rounded-xl text-base"
              style={{
                background: 'hsl(var(--nb-surface))',
                color: 'hsl(var(--nb-text))',
                border: '1px solid hsl(var(--nb-gold) / 0.3)',
                fontFamily: 'var(--font-body-nb)',
              }}
            />
            <button className="absolute right-2 top-1/2 -translate-y-1/2 p-2.5 rounded-lg" style={{ background: 'hsl(var(--nb-gold))', color: 'hsl(var(--nb-bg))' }}>
              <Search className="w-5 h-5" />
            </button>
          </div>

          {/* Filter pills */}
          <div className="flex flex-wrap justify-center gap-2">
            {AREA_PILLS.map(pill => (
              <button
                key={pill}
                onClick={() => setActiveArea(pill)}
                className="px-4 py-1.5 rounded-full text-sm transition-all duration-200"
                style={{
                  background: activeArea === pill ? 'hsl(var(--nb-gold))' : 'hsl(var(--nb-gold) / 0.1)',
                  color: activeArea === pill ? 'hsl(var(--nb-bg))' : 'hsl(var(--nb-gold))',
                  border: `1px solid hsl(var(--nb-gold) / ${activeArea === pill ? '1' : '0.2'})`,
                  fontFamily: 'var(--font-body-nb)',
                }}
              >
                {pill}
              </button>
            ))}
            <div className="w-px h-6 self-center" style={{ background: 'hsl(var(--nb-gold) / 0.3)' }} />
            {BUDGET_PILLS.map(pill => (
              <button key={pill} className="px-4 py-1.5 rounded-full text-sm" style={{ background: 'hsl(var(--nb-gold) / 0.1)', color: 'hsl(var(--nb-gold))', border: '1px solid hsl(var(--nb-gold) / 0.2)', fontFamily: 'var(--font-body-nb)' }}>
                {pill}
              </button>
            ))}
            <div className="w-px h-6 self-center" style={{ background: 'hsl(var(--nb-gold) / 0.3)' }} />
            {TYPE_PILLS.map(pill => (
              <button key={pill} className="px-4 py-1.5 rounded-full text-sm" style={{ background: 'hsl(var(--nb-gold) / 0.1)', color: 'hsl(var(--nb-gold))', border: '1px solid hsl(var(--nb-gold) / 0.2)', fontFamily: 'var(--font-body-nb)' }}>
                {pill}
              </button>
            ))}
          </div>
        </div>

        {/* Stats bar */}
        <div className="relative z-10 mt-16 w-full max-w-3xl mx-auto">
          <div className="nb-separator mb-6" />
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="nb-mono text-2xl md:text-3xl font-bold" style={{ color: 'hsl(var(--nb-text))' }}>
                {statsLoading ? <Skeleton className="h-8 w-16 mx-auto" /> : stats?.projectCount || 0}
              </p>
              <p className="text-sm mt-1" style={{ color: 'hsl(var(--nb-muted))' }}>Проектов</p>
            </div>
            <div className="border-x" style={{ borderColor: 'hsl(var(--nb-gold) / 0.2)' }}>
              <p className="nb-mono text-2xl md:text-3xl font-bold" style={{ color: 'hsl(var(--nb-text))' }}>
                {statsLoading ? <Skeleton className="h-8 w-16 mx-auto" /> : stats?.developerCount || 0}
              </p>
              <p className="text-sm mt-1" style={{ color: 'hsl(var(--nb-muted))' }}>Девелоперов</p>
            </div>
            <div>
              {statsLoading ? <Skeleton className="h-8 w-24 mx-auto" /> : (
                <NbPriceDisplay price={stats?.avgPrice || 0} showFrom={false} size="lg" className="justify-center" />
              )}
              <p className="text-sm mt-1" style={{ color: 'hsl(var(--nb-muted))' }}>Средняя цена</p>
            </div>
          </div>
          <div className="nb-separator mt-6" />
        </div>
      </section>

      {/* ── FEATURED PROJECTS ── */}
      {featuredProjects.length > 0 && (
        <section className="px-4 py-16 max-w-7xl mx-auto">
          <p className="nb-label mb-8">FEATURED PROJECTS</p>
          <div className="space-y-6">
            {featuredProjects.map(p => (
              <NbProjectCard key={p.id} project={p} variant="featured" />
            ))}
          </div>
        </section>
      )}

      {/* ── ALL PROJECTS GRID ── */}
      <section className="px-4 py-16 max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h2 className="nb-display text-2xl md:text-3xl" style={{ color: 'hsl(var(--nb-text))' }}>Все проекты</h2>
          <Link to={APP_ROUTES.NEWBUILDS_PROJECTS} className="text-sm flex items-center gap-1 transition-colors hover:opacity-80" style={{ color: 'hsl(var(--nb-gold))' }}>
            Смотреть все {stats?.projectCount || ''} проектов <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {gridProjects.map(p => (
            <NbProjectCard key={p.id} project={p} />
          ))}
        </div>
      </section>

      {/* ── TOOLS & SERVICES ── */}
      <section className="px-4 py-16 max-w-7xl mx-auto">
        <h2 className="nb-display text-2xl md:text-3xl mb-2" style={{ color: 'hsl(var(--nb-text))' }}>
          Инструменты инвестора
        </h2>
        <p className="text-sm mb-8" style={{ color: 'hsl(var(--nb-muted))' }}>
          Всё для принятия взвешенного решения об инвестициях в новостройки Пхукета
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { icon: Calculator, label: 'ROI Калькулятор', desc: 'Рассчитайте доходность', path: '/newbuilds/calculator' },
            { icon: Map, label: 'Карта проектов', desc: 'Все проекты на карте', path: '/newbuilds/map' },
            { icon: Compass, label: 'Гид по районам', desc: '10 районов Пхукета', path: '/newbuilds/areas' },
            { icon: Shield, label: 'Due Diligence', desc: 'Чек-лист покупателя', path: '/newbuilds/due-diligence' },
          ].map(tool => {
            const Icon = tool.icon;
            return (
              <Link key={tool.path} to={tool.path} className="nb-glass p-5 text-center group hover:border-[hsl(var(--nb-gold)/0.5)] transition-all">
                <div className="w-12 h-12 rounded-xl mx-auto mb-3 flex items-center justify-center" style={{ background: 'hsl(var(--nb-gold) / 0.12)' }}>
                  <Icon className="w-6 h-6" style={{ color: 'hsl(var(--nb-gold))' }} />
                </div>
                <h3 className="nb-display text-base mb-1" style={{ color: 'hsl(var(--nb-text))' }}>{tool.label}</h3>
                <p className="text-xs" style={{ color: 'hsl(var(--nb-muted))' }}>{tool.desc}</p>
              </Link>
            );
          })}
        </div>
      </section>

      {/* ── AREA GUIDES QUICK LINKS ── */}
      <section className="px-4 py-16" style={{ background: 'hsl(var(--nb-surface))' }}>
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <h2 className="nb-display text-2xl md:text-3xl" style={{ color: 'hsl(var(--nb-text))' }}>Районы Пхукета</h2>
            <Link to="/newbuilds/areas" className="text-sm flex items-center gap-1" style={{ color: 'hsl(var(--nb-gold))' }}>
              Все районы <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2">
            {PHUKET_AREAS.slice(0, 6).map(area => (
              <Link
                key={area.slug}
                to={`/newbuilds/areas/${area.slug}`}
                className="nb-glass p-4 min-w-[200px] flex-shrink-0 group hover:border-[hsl(var(--nb-gold)/0.5)] transition-all"
              >
                <h3 className="nb-display text-base mb-1" style={{ color: 'hsl(var(--nb-text))' }}>{area.name_ru}</h3>
                <div className="flex items-center gap-3 text-xs" style={{ color: 'hsl(var(--nb-muted))' }}>
                  <span className="nb-mono" style={{ color: 'hsl(var(--nb-gold))' }}>฿{(area.avg_price_sqm / 1000).toFixed(0)}K/м²</span>
                  <span style={{ color: 'hsl(142 70% 55%)' }}>{area.avg_yield}%</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── WHY INVEST ── */}
      <section className="px-4 py-16 max-w-7xl mx-auto">
        <h2 className="nb-display text-2xl md:text-3xl mb-8 text-center" style={{ color: 'hsl(var(--nb-text))' }}>
          Почему инвестировать в Пхукет
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { title: 'Рост цен 5-8% в год', desc: 'Стабильный рост рынка недвижимости. Пхукет — один из самых востребованных островов Юго-Восточной Азии.' },
            { title: 'Доходность 6-8% годовых', desc: 'Высокий туристический поток обеспечивает стабильную арендную доходность круглый год.' },
            { title: 'Freehold для иностранцев', desc: 'Иностранцы могут владеть квартирами в freehold. Прозрачная юридическая система и защита прав покупателей.' },
          ].map(item => (
            <div key={item.title} className="nb-glass p-6 space-y-3">
              <h3 className="nb-display text-lg" style={{ color: 'hsl(var(--nb-gold))' }}>{item.title}</h3>
              <p className="text-sm leading-relaxed" style={{ color: 'hsl(var(--nb-text-secondary))' }}>{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── LEAD CAPTURE ── */}
      <section className="px-4 py-16" style={{ background: 'hsl(var(--nb-surface))' }}>
        <div className="max-w-2xl mx-auto text-center space-y-4 mb-8">
          <h2 className="nb-display text-2xl md:text-3xl" style={{ color: 'hsl(var(--nb-text))' }}>Получайте первыми</h2>
          <p className="text-base" style={{ color: 'hsl(var(--nb-muted))' }}>
            Новые проекты, специальные цены, обновления строительства — в WhatsApp или Telegram
          </p>
        </div>
        <div className="max-w-md mx-auto">
          <NbLeadForm source="alert_signup" compact />
        </div>
      </section>

      {/* ── DEVELOPER CTA ── */}
      <section className="px-4 py-16 max-w-7xl mx-auto">
        <div className="nb-glass p-8 md:p-12 flex flex-col md:flex-row gap-8 md:gap-12 items-start nb-glow-pulse">
          <div className="flex-1 space-y-4">
            <h2 className="nb-display text-2xl md:text-3xl" style={{ color: 'hsl(var(--nb-text))' }}>
              Вы девелопер или представитель проекта?
            </h2>
            <p style={{ color: 'hsl(var(--nb-muted))' }}>
              Разместите проект на лучшей платформе Пхукета. Прямые лиды. Инструменты продаж. Аналитика.
            </p>
            <Link to="/developer-portal" className="nb-btn-gold inline-flex items-center gap-2 mt-4">
              Добавить проект <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="space-y-3">
            {[
              'Страница проекта с галереей и инвентарём',
              'Управление лидами и CRM',
              'Обновления стройки и отчёты',
              'Интеграция с AI-ассистентом',
              'Аналитика и воронка продаж',
            ].map(item => (
              <div key={item} className="flex items-center gap-2.5">
                <Check className="w-4 h-4 flex-shrink-0" style={{ color: 'hsl(var(--nb-gold))' }} />
                <span className="text-sm" style={{ color: 'hsl(var(--nb-text-secondary))' }}>{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </NewbuildsLayout>
  );
}
