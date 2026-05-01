/**
 * FeatureLayout — mode-driven framing for mini-app catalogs, landing/promo pages,
 * and other feature surfaces that sit on top of `AppLayout` (consumer chrome).
 *
 * Modes:
 * - `miniapp` — sticky UnifiedHeader, optional hero, filters, ecosystem container (legacy `MiniAppLayout`)
 * - `landing` — gradient hero + optional WhatsApp CTA (legacy `LandingLayout`)
 */
import React, { ReactNode, useCallback, useEffect, useState } from 'react';
import { LucideIcon, ShoppingCart, MapIcon, SlidersHorizontal, MessageCircle, LayoutGrid, MapPin } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { AppLayout } from '@/components/layout/AppLayout';
import { MiniAppHero } from '@/components/miniapp/MiniAppHero';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/contexts/LanguageContext';
import { UniversalFilter, type FilterConfig, type FilterValues } from '@/components/filters/UniversalFilter';
import { UnifiedHeader } from '@/components/shared/UnifiedHeader';
import { UnifiedFilterRibbon, type FilterRibbonItem } from '@/components/shared/UnifiedFilterRibbon';
import { FilterChip, FilterChipGroup } from '@/components/uno/FilterChip';
import { BackButton } from '@/components/uno/BackButton';
import { PersonaFilterChip } from '@/components/landings/PersonaFilterChip';
import { APP_ROUTES } from '@/lib/config/routes';
import { ECOSYSTEM_MAIN_SPACING, ECOSYSTEM_PAGE_CONTAINER } from '@/design-system/ecosystemLayout';
import { SEOHead } from '@/components/seo';
import { CrossSellSection } from '@/components/crosssell/CrossSellSection';
import { UnifiedCatalogMap, type UnifiedMapMarker } from '@/components/map/UnifiedCatalogMap';
import { getDefaultCenter, DEFAULT_CITY } from '@/lib/config';

// ── Mini-app (catalog) types & implementation ─────────────────────────────

export interface MiniAppCategory {
  id: string;
  labelEn: string;
  labelRu: string;
  icon?: string;
}

export interface QuickFilterOption {
  id: string;
  labelEn: string;
  labelRu: string;
  icon?: string;
}

export interface QuickFilterSection {
  id: string;
  options: QuickFilterOption[];
}

export interface MiniAppLayoutProps {
  title: string;
  subtitle?: string;
  fallbackPath?: string;
  headerActions?: ReactNode;
  heroIcon?: LucideIcon;
  heroTitle?: string;
  heroSubtitle?: string;
  heroImage?: string;
  heroBackgroundImage?: string;
  heroGradient?: { from?: string; via?: string; to?: string };
  heroGradientFrom?: string;
  heroGradientVia?: string;
  heroGradientTo?: string;
  showHero?: boolean;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  searchPlaceholder?: string;
  showSearch?: boolean;
  searchResults?: ReactNode;
  isSearching?: boolean;
  categories?: MiniAppCategory[];
  selectedCategory?: string;
  onCategoryChange?: (categoryId: string) => void;
  showCategories?: boolean;
  quickFilters?: QuickFilterSection[];
  filterConfig?: FilterConfig;
  filterValues?: FilterValues;
  onFilterChange?: (values: FilterValues) => void;
  filterActiveCount?: number;
  filterButton?: ReactNode;
  showFilter?: boolean;
  mapPath?: string;
  showMapButton?: boolean;
  onMapClick?: () => void;
  showCartButton?: boolean;
  cartItemCount?: number;
  resultsCount?: number;
  resultsLabel?: string;
  quickActions?: ReactNode;
  isLoading?: boolean;
  isEmpty?: boolean;
  emptyIcon?: LucideIcon;
  emptyText?: string;
  children: ReactNode;
  showBottomNav?: boolean;
  contentClassName?: string;
  stickySubHeader?: ReactNode;
  showQuickFiltersInSubHeader?: boolean;
  showEcosystemHint?: boolean;
  /** Auto-renders <SEOHead> at the top when provided. */
  seoTitle?: string;
  seoDescription?: string;
  seoImage?: string;
  seoNoindex?: boolean;
  /** Auto-renders <CrossSellSection> at the bottom of children when provided. */
  crossSellVertical?: string;
  /**
   * When provided, enables the built-in List/Map toggle in the header.
   * Pass an array of UnifiedMapMarker — one per item to plot on Google Map.
   * Empty array still shows the toggle (with empty-state on map).
   */
  mapMarkers?: UnifiedMapMarker[];
  /** Called when a marker InfoWindow is clicked. */
  onMapMarkerSelect?: (id: string) => void;
  /** Single-char emoji/letter for marker label. */
  mapIconChar?: string;
  /** Initial view when toggle is enabled. Default: 'list'. */
  defaultMapView?: 'list' | 'map';
}

function MiniappMode({
  title,
  subtitle,
  fallbackPath = '/',
  headerActions,
  heroIcon,
  heroTitle,
  heroSubtitle,
  heroBackgroundImage,
  heroGradientFrom = 'from-primary/20',
  heroGradientVia = 'via-primary/10',
  heroGradientTo = 'to-background',
  showHero = true,
  searchValue = '',
  onSearchChange,
  searchPlaceholder,
  showSearch = true,
  searchResults,
  isSearching,
  categories = [],
  selectedCategory = 'all',
  onCategoryChange,
  showCategories = true,
  quickFilters = [],
  filterConfig,
  filterValues,
  onFilterChange,
  filterActiveCount = 0,
  filterButton,
  showFilter = true,
  mapPath,
  showMapButton = false,
  onMapClick,
  cartItemCount = 0,
  showCartButton = false,
  resultsCount,
  resultsLabel,
  children,
  showBottomNav = true,
  contentClassName,
  quickActions,
  stickySubHeader,
  showQuickFiltersInSubHeader = true,
  showEcosystemHint = true,
  seoTitle,
  seoDescription,
  seoImage,
  seoNoindex,
  crossSellVertical,
  mapMarkers,
  onMapMarkerSelect,
  mapIconChar,
  defaultMapView = 'list',
}: MiniAppLayoutProps) {
  const navigate = useNavigate();
  const { language, t } = useLanguage();

  // Built-in List/Map view state (only active when mapMarkers prop is provided)
  const mapToggleEnabled = Array.isArray(mapMarkers);
  const [view, setView] = useState<'list' | 'map'>(defaultMapView);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    if (!mapToggleEnabled || typeof navigator === 'undefined' || !navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => setUserLocation(getDefaultCenter(DEFAULT_CITY)),
      { timeout: 5000 },
    );
  }, [mapToggleEnabled]);

  // Read distance filter (universal `distance` section, in km) from filterValues
  const distanceKm = (() => {
    const v = filterValues?.distance;
    const n = Number(Array.isArray(v) ? v[0] : v);
    return Number.isFinite(n) && n > 0 ? n : 0;
  })();

  const handleQuickFilterToggle = useCallback(
    (sectionId: string, optionId: string) => {
      if (!onFilterChange || !filterValues) return;

      const currentValues = (filterValues[sectionId] as string[]) || [];
      const isActive = currentValues.includes(optionId);

      const newValues = isActive
        ? currentValues.filter((v) => v !== optionId)
        : [...currentValues, optionId];

      onFilterChange({
        ...filterValues,
        [sectionId]: newValues.length > 0 ? newValues : undefined,
      });
    },
    [filterValues, onFilterChange]
  );

  const buildHeaderActions = () => {
    const actions: ReactNode[] = [];

    if (mapToggleEnabled) {
      actions.push(
        <div key="view-toggle" className="flex items-center bg-muted shrink-0">
          <Button
            type="button"
            variant={view === 'list' ? 'default' : 'ghost'}
            size="sm"
            className="h-8 px-2 rounded-none"
            onClick={() => setView('list')}
            aria-label={language === 'ru' ? 'Список' : 'List'}
            aria-pressed={view === 'list'}
          >
            <LayoutGrid className="w-4 h-4" />
          </Button>
          <Button
            type="button"
            variant={view === 'map' ? 'default' : 'ghost'}
            size="sm"
            className="h-8 px-2 rounded-none"
            onClick={() => setView('map')}
            aria-label={language === 'ru' ? 'Карта' : 'Map'}
            aria-pressed={view === 'map'}
          >
            <MapPin className="w-4 h-4" />
          </Button>
        </div>
      );
    }

    if (showMapButton) {
      actions.push(
        <Button
          key="map"
          variant="ghost"
          size="icon"
          onClick={onMapClick || (mapPath ? () => navigate(mapPath) : undefined)}
          className="shrink-0 h-9 w-9 rounded-none"
        >
          <MapIcon className="w-5 h-5" />
        </Button>
      );
    }

    if (showCartButton) {
      actions.push(
        <Button
          key="cart"
          variant="ghost"
          size="icon"
          onClick={() => navigate(APP_ROUTES.CART)}
          className="relative shrink-0 h-9 w-9 rounded-none"
        >
          <ShoppingCart className="w-5 h-5" />
          {cartItemCount > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center">
              {cartItemCount}
            </span>
          )}
        </Button>
      );
    }

    if (showFilter && filterConfig && onFilterChange) {
      actions.push(
        <UniversalFilter
          key="filter"
          config={filterConfig}
          values={filterValues || {}}
          onChange={onFilterChange}
        >
          <Button variant="ghost" size="icon" className="h-9 w-9 rounded-none relative shrink-0">
            <SlidersHorizontal className="w-5 h-5" />
            {filterActiveCount > 0 && (
              <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-[10px]">
                {filterActiveCount}
              </Badge>
            )}
          </Button>
        </UniversalFilter>
      );
    } else if (showFilter && filterButton) {
      actions.push(<React.Fragment key="filterButton">{filterButton}</React.Fragment>);
    }

    if (headerActions) {
      actions.push(<React.Fragment key="custom">{headerActions}</React.Fragment>);
    }

    return actions.length > 0 ? <div className="flex items-center gap-1">{actions}</div> : undefined;
  };

  const categoryItems: FilterRibbonItem[] = categories.map((cat) => ({
    id: cat.id,
    label: language === 'ru' ? cat.labelRu : cat.labelEn,
    emoji: cat.icon,
  }));

  const hasQuickFilters = quickFilters.length > 0 && onFilterChange && showQuickFiltersInSubHeader;
  const hasCategories = showCategories && categoryItems.length > 0 && onCategoryChange;
  const hasStickySubHeader = stickySubHeader || hasQuickFilters || hasCategories;

  return (
    <AppLayout showBottomNav={showBottomNav} showHeader={false} className="max-w-full min-w-0">
      {(seoTitle || seoDescription) && (
        <SEOHead
          title={seoTitle}
          description={seoDescription}
          image={seoImage}
          noindex={seoNoindex}
        />
      )}
      <div className="sticky top-0 z-40">
        <UnifiedHeader
          title={title}
          subtitle={subtitle}
          showBack
          fallbackPath={fallbackPath}
          searchPlaceholder={searchPlaceholder}
          searchValue={showSearch ? searchValue : undefined}
          onSearchChange={showSearch && onSearchChange ? onSearchChange : undefined}
          rightAction={buildHeaderActions()}
          searchResults={searchResults}
          isSearching={isSearching}
        />

        {hasStickySubHeader && (
          <div className="bg-background border-b border-border/30">
            {hasCategories && (
              <UnifiedFilterRibbon
                items={categoryItems}
                activeId={selectedCategory}
                onSelect={onCategoryChange}
                className="px-4 py-2 border-0"
              />
            )}

            {stickySubHeader}

            {!stickySubHeader && !hasCategories && hasQuickFilters && (
              <div className="px-4 py-2">
                <FilterChipGroup scrollable>
                  {quickFilters.flatMap((section) =>
                    section.options.map((opt) => {
                      const sectionValues = (filterValues?.[section.id] as string[]) || [];
                      const isActive = sectionValues.includes(opt.id);

                      return (
                        <FilterChip
                          key={`${section.id}-${opt.id}`}
                          label={language === 'ru' ? opt.labelRu : opt.labelEn}
                          icon={opt.icon}
                          isActive={isActive}
                          onToggle={() => handleQuickFilterToggle(section.id, opt.id)}
                          size="sm"
                        />
                      );
                    })
                  )}
                </FilterChipGroup>
              </div>
            )}
          </div>
        )}
      </div>

      <div
        className={cn(
          ECOSYSTEM_PAGE_CONTAINER,
          'pb-4 md:pb-8',
          ECOSYSTEM_MAIN_SPACING,
          showBottomNav && 'pb-24 md:pb-8',
          contentClassName
        )}
      >
        {showHero && heroIcon && heroTitle && (
          <MiniAppHero
            icon={heroIcon}
            title={heroTitle}
            subtitle={heroSubtitle}
            backgroundImage={heroBackgroundImage}
            gradientFrom={heroGradientFrom}
            gradientVia={heroGradientVia}
            gradientTo={heroGradientTo}
          />
        )}

        {quickFilters.length > 0 && onFilterChange && hasCategories && (
          <FilterChipGroup scrollable>
            {quickFilters.flatMap((section) =>
              section.options.map((opt) => {
                const sectionValues = (filterValues?.[section.id] as string[]) || [];
                const isActive = sectionValues.includes(opt.id);

                return (
                  <FilterChip
                    key={`${section.id}-${opt.id}`}
                    label={language === 'ru' ? opt.labelRu : opt.labelEn}
                    icon={opt.icon}
                    isActive={isActive}
                    onToggle={() => handleQuickFilterToggle(section.id, opt.id)}
                    size="sm"
                  />
                );
              })
            )}
          </FilterChipGroup>
        )}

        {quickActions}

        {showEcosystemHint && (
          <div className="rounded-none border border-border/60 bg-card/70 px-4 py-3 flex items-center justify-between gap-3">
            <p className="text-xs md:text-sm text-muted-foreground">
              {language === 'ru'
                ? 'myUNO: экосистема сервисов и решений — изучайте рынок и бронируйте в одном контуре.'
                : 'myUNO ecosystem: research the market and book services in one trusted flow.'}
            </p>
            <Button
              size="sm"
              variant="outline"
              onClick={() => navigate(APP_ROUTES.DISCOVER)}
              className="shrink-0"
            >
              {language === 'ru' ? 'Навигатор' : 'Explore'}
            </Button>
          </div>
        )}

        {/* Persona context chip — auto-renders only when ?persona= is in URL.
            Mounted here so every miniapp catalog inherits it without per-page wiring. */}
        <PersonaFilterChip />

        {resultsCount !== undefined && (
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">{resultsLabel || t('booking.results')}</h2>
            <span className="text-sm text-muted-foreground">
              {resultsCount} {t('booking.found')}
            </span>
          </div>
        )}

        {mapToggleEnabled && view === 'map' ? (
          <UnifiedCatalogMap
            markers={mapMarkers ?? []}
            userLocation={userLocation}
            distanceKm={distanceKm}
            onSelect={onMapMarkerSelect}
            iconChar={mapIconChar}
            className="h-[calc(100vh-280px)] min-h-[420px] w-full border border-border/40"
            emptyMessage={
              (mapMarkers?.length ?? 0) === 0
                ? language === 'ru'
                  ? 'Нет объектов с координатами'
                  : 'No items with coordinates'
                : undefined
            }
          />
        ) : (
          children
        )}

        {crossSellVertical && (
          <CrossSellSection currentVertical={crossSellVertical} />
        )}
      </div>
    </AppLayout>
  );
}

// ── Landing / promo mode ───────────────────────────────────────────────────

export interface LandingLayoutProps {
  icon: LucideIcon;
  title: string;
  subtitle: string;
  /** e.g. "from-primary via-primary to-primary" */
  gradient: string;
  fallbackPath?: string;
  heroCta?: { label: string; onClick: () => void };
  whatsappUrl?: string;
  whatsappLabel?: string;
  children: ReactNode;
  className?: string;
}

function LandingMode({
  icon: Icon,
  title,
  subtitle,
  gradient,
  fallbackPath = '/',
  heroCta,
  whatsappUrl,
  whatsappLabel,
  children,
  className,
}: LandingLayoutProps) {
  return (
    <AppLayout>
      <div className={cn('pb-24', className)}>
        <div className={cn('relative bg-gradient-to-br p-6 pt-16 pb-12', gradient)}>
          <BackButton fallbackPath={fallbackPath} variant="overlay" className="absolute top-4 left-4" />
          <div className="text-white text-center max-w-lg mx-auto">
            <div className="w-16 h-16 bg-white/20 rounded-none flex items-center justify-center mx-auto mb-4">
              <Icon className="w-8 h-8" />
            </div>
            <h1 className="text-3xl font-bold font-display mb-2">{title}</h1>
            <p className="text-white/80 text-sm mb-6">{subtitle}</p>
            {heroCta && (
              <Button
                onClick={heroCta.onClick}
                className="bg-white text-foreground hover:bg-white/90 font-semibold gap-2"
              >
                <MessageCircle className="w-4 h-4" />
                {heroCta.label}
              </Button>
            )}
          </div>
        </div>

        {children}

        {whatsappUrl && (
          <div className="px-4 py-8 text-center">
            <Button
              size="lg"
              onClick={() => window.open(whatsappUrl, '_blank')}
              className="gap-2"
            >
              <MessageCircle className="w-5 h-5" />
              {whatsappLabel || 'WhatsApp'}
            </Button>
          </div>
        )}
      </div>
    </AppLayout>
  );
}

// ── Public switch ─────────────────────────────────────────────────────────

export type FeatureLayoutProps =
  | ({ mode: 'miniapp' } & MiniAppLayoutProps)
  | ({ mode: 'landing' } & LandingLayoutProps);

export function FeatureLayout(props: FeatureLayoutProps) {
  if (props.mode === 'landing') {
    const { mode: _m, ...rest } = props;
    return <LandingMode {...rest} />;
  }
  const { mode: _m, ...rest } = props;
  return <MiniappMode {...rest} />;
}
