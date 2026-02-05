import React, { ReactNode } from 'react';
import { LucideIcon, ShoppingCart, MapIcon, SlidersHorizontal } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { AppLayout } from '@/components/layout/AppLayout';
import { MiniAppHero } from './MiniAppHero';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/contexts/LanguageContext';
import { UniversalFilter, type FilterConfig, type FilterValues } from '@/components/filters/UniversalFilter';
import { UnifiedHeader } from '@/components/shared/UnifiedHeader';
import { UnifiedFilterRibbon, type FilterRibbonItem } from '@/components/shared/UnifiedFilterRibbon';

export interface MiniAppCategory {
  id: string;
  labelEn: string;
  labelRu: string;
  icon?: string;
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
}

export function MiniAppLayout({
  // Header
  title,
  subtitle,
  fallbackPath = '/',
  headerActions,
  
  // Hero
  heroIcon,
  heroTitle,
  heroSubtitle,
  heroBackgroundImage,
  heroGradientFrom = 'from-primary/20',
  heroGradientVia = 'via-primary/10',
  heroGradientTo = 'to-background',
  showHero = true,
  
  // Search
  searchValue = '',
  onSearchChange,
  searchPlaceholder,
  showSearch = true,
  searchResults,
  isSearching,
  
  // Categories
  categories = [],
  selectedCategory = 'all',
  onCategoryChange,
  showCategories = true,
  
  // Filter
  filterConfig,
  filterValues,
  onFilterChange,
  filterActiveCount = 0,
  filterButton,
  showFilter = true,
  
  // Map
  mapPath,
  showMapButton = false,
  onMapClick,
  
  // Cart
  cartItemCount = 0,
  showCartButton = false,
  
  // Results
  resultsCount,
  resultsLabel,
  
  // Content
  children,
  
  // Layout
  showBottomNav = true,
  contentClassName,
  
  // Quick actions
  quickActions,
}: MiniAppLayoutProps) {
  const navigate = useNavigate();
  const { language, t } = useLanguage();

  // Build header right actions
  const buildHeaderActions = () => {
    const actions: ReactNode[] = [];
    
    if (showMapButton) {
      actions.push(
        <Button 
          key="map"
          variant="ghost" 
          size="icon"
          onClick={onMapClick || (mapPath ? () => navigate(mapPath) : undefined)}
          className="shrink-0 h-9 w-9 rounded-xl"
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
          onClick={() => navigate('/cart')}
          className="relative shrink-0 h-9 w-9 rounded-xl"
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

    // Filter button
    if (showFilter && filterConfig && onFilterChange) {
      actions.push(
        <UniversalFilter
          key="filter"
          config={filterConfig}
          values={filterValues || {}}
          onChange={onFilterChange}
        >
          <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl relative shrink-0">
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

  // Convert categories to FilterRibbonItem format
  const categoryItems: FilterRibbonItem[] = categories.map(cat => ({
    id: cat.id,
    label: language === 'ru' ? cat.labelRu : cat.labelEn,
    emoji: cat.icon, // MiniAppCategory uses string emoji icons
  }));

  return (
    <AppLayout showBottomNav={showBottomNav} className="max-w-full min-w-0">
      {/* Unified Sticky Header */}
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
        
        {/* Category Filter Ribbon */}
        {showCategories && categoryItems.length > 0 && onCategoryChange && (
          <div className="bg-background/95 backdrop-blur-sm border-b border-border/30">
            <UnifiedFilterRibbon
              items={categoryItems}
              activeId={selectedCategory}
              onSelect={onCategoryChange}
              className="px-4 py-2 border-0"
            />
          </div>
        )}
      </div>

      <div className={cn("px-4 md:px-6 lg:px-8 pb-4 space-y-4 w-full", showBottomNav && "pb-24", contentClassName)}>
        {/* Hero Section */}
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

        {/* Quick Actions */}
        {quickActions}

        {/* Results Count */}
        {resultsCount !== undefined && (
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">
              {resultsLabel || t('booking.results')}
            </h2>
            <span className="text-sm text-muted-foreground">
              {resultsCount} {t('booking.found')}
            </span>
          </div>
        )}

        {/* Main Content */}
        {children}
      </div>
    </AppLayout>
  );
}
