/**
 * /newbuilds — Public Landing Page
 * Dark luxury editorial design, lead magnet hero
 */
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, MapPin, Building2, TrendingUp, ChevronRight, Check } from 'lucide-react';
import NewbuildsLayout from '@/components/newbuilds/NewbuildsLayout';
import { NbProjectCard } from '@/components/newbuilds/NbProjectCard';
import { NbPriceDisplay } from '@/components/newbuilds/NbPriceDisplay';
import { NbLeadForm } from '@/components/newbuilds/NbLeadForm';
import { useNewbuildProjects, useNewbuildStats } from '@/hooks/useNewbuildProjects';
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

      {/* ── PEYLAA SPOTLIGHT ── */}
      <section className="px-4 py-12 max-w-7xl mx-auto">
        <Link
          to="/peylaa"
          className="nb-glass group block overflow-hidden relative"
          style={{ borderColor: 'hsl(var(--nb-gold) / 0.3)' }}
        >
          <div className="flex flex-col md:flex-row">
            <div className="md:w-[45%] relative overflow-hidden">
              <img
                src="https://bhmvnorkswapjkmbvykk.supabase.co/storage/v1/object/public/media/exterior/peylaa_drone-shot-with-3d-building.jpg"
                alt="PEYLAA Phuket"
                className="w-full h-[220px] md:h-[320px] object-cover group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-transparent to-black/70 hidden md:block" />
              <div className="absolute top-3 left-3 flex gap-2">
                <span className="nb-badge" style={{ background: 'hsl(var(--nb-gold))', color: 'hsl(var(--nb-bg))' }}>
                  SPOTLIGHT
                </span>
                <span className="nb-badge" style={{ background: 'hsl(var(--nb-gold) / 0.15)', color: 'hsl(var(--nb-gold))', border: '1px solid hsl(var(--nb-gold) / 0.3)' }}>
                  MARRIOTT
                </span>
              </div>
            </div>
            <div className="flex-1 p-6 md:p-8 flex flex-col justify-between">
              <div>
                <p className="nb-label mb-2">AUTOGRAPH COLLECTION RESIDENCES</p>
                <h3 className="nb-display text-2xl md:text-3xl mb-3" style={{ color: 'hsl(var(--nb-text))' }}>
                  PEYLAA Phuket
                </h3>
                <p className="text-sm md:text-base mb-4" style={{ color: 'hsl(var(--nb-muted))', fontFamily: 'var(--font-body-nb)' }}>
                  Первый проект Autograph Collection в Азии. 408 резиденций в Bang Tao.
                  Полная отделка. Статус Marriott Bonvoy Gold Elite.
                </p>
                <div className="flex flex-wrap gap-4 mb-4">
                  <div>
                    <span className="nb-mono text-lg font-bold" style={{ color: 'hsl(var(--nb-gold))' }}>฿7.1M</span>
                    <span className="text-xs ml-1" style={{ color: 'hsl(var(--nb-muted))' }}>от</span>
                  </div>
                  <div>
                    <span className="nb-mono text-lg font-bold" style={{ color: 'hsl(var(--nb-text))' }}>408</span>
                    <span className="text-xs ml-1" style={{ color: 'hsl(var(--nb-muted))' }}>юнитов</span>
                  </div>
                  <div>
                    <span className="nb-mono text-lg font-bold" style={{ color: 'hsl(var(--nb-text))' }}>Q4 2027</span>
                    <span className="text-xs ml-1" style={{ color: 'hsl(var(--nb-muted))' }}>сдача</span>
                  </div>
                </div>
              </div>
              <span className="text-sm font-medium group-hover:text-[hsl(var(--nb-gold))] transition-colors inline-flex items-center gap-1" style={{ color: 'hsl(var(--nb-text))' }}>
                Открыть каталог резиденций <ChevronRight className="w-4 h-4" />
              </span>
            </div>
          </div>
        </Link>
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
          <Link to={APP_ROUTES.OFFPLAN} className="text-sm flex items-center gap-1 transition-colors hover:opacity-80" style={{ color: 'hsl(var(--nb-gold))' }}>
            Смотреть все {stats?.projectCount || ''} проектов <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {gridProjects.map(p => (
            <NbProjectCard key={p.id} project={p} />
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
