import React, { ReactNode } from 'react';
import { LucideIcon, ShoppingCart, MapIcon, SlidersHorizontal } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageContainer } from '@/components/uno/PageContainer';
import { PageHeader } from '@/components/uno/PageHeader';
import { MiniAppHero } from './MiniAppHero';
import { MiniAppSearch } from './MiniAppSearch';
import { FilterChip, FilterChipGroup } from '@/components/uno/FilterChip';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';

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
  categories?: MiniAppCategory[];
  selectedCategory?: string;
  onCategoryChange?: (categoryId: string) => void;
  showCategories?: boolean;
  filterConfig?: any;
  filterValues?: any;
  onFilterChange?: (values: any) => void;
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
  
  // Categories
  categories = [],
  selectedCategory = 'all',
  onCategoryChange,
  showCategories = true,
  
  // Filter
  filterActiveCount = 0,
  filterButton,
  showFilter = true,
  
  // Map
  mapPath,
  showMapButton = false,
  
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
  const { language } = useLanguage();

  // Build header actions
  const buildHeaderActions = () => {
    const actions: ReactNode[] = [];
    
    if (showMapButton && mapPath) {
      actions.push(
        <Button 
          key="map"
          variant="outline" 
          size="icon"
          onClick={() => navigate(mapPath)}
          className="shrink-0"
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
          className="relative shrink-0"
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
    
    if (headerActions) {
      actions.push(<React.Fragment key="custom">{headerActions}</React.Fragment>);
    }
    
    return actions.length > 0 ? <div className="flex items-center gap-2">{actions}</div> : undefined;
  };

  return (
    <AppLayout showBottomNav={showBottomNav}>
      <PageContainer className={cn("pb-4", showBottomNav && "pb-24", contentClassName)}>
        {/* Header */}
        <PageHeader
          title={title}
          subtitle={subtitle}
          showBack
          fallbackPath={fallbackPath}
          actions={buildHeaderActions()}
        />

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
            className="mt-4 mb-4"
          />
        )}

        {/* Quick Actions */}
        {quickActions && (
          <div className="mb-4">
            {quickActions}
          </div>
        )}

        {/* Search + Filter Row */}
        {(showSearch || showFilter) && (
          <div className="flex gap-2 mb-4">
            {showSearch && onSearchChange && (
              <div className="flex-1">
                <MiniAppSearch
                  value={searchValue}
                  onChange={onSearchChange}
                  placeholder={searchPlaceholder}
                />
              </div>
            )}
            {showFilter && filterButton}
          </div>
        )}

        {/* Category Chips */}
        {showCategories && categories.length > 0 && onCategoryChange && (
          <FilterChipGroup scrollable className="mb-4">
            {categories.map((cat) => (
              <FilterChip
                key={cat.id}
                label={`${cat.icon ? cat.icon + ' ' : ''}${language === 'ru' ? cat.labelRu : cat.labelEn}`}
                isActive={selectedCategory === cat.id}
                size="sm"
                onToggle={() => onCategoryChange(cat.id)}
              />
            ))}
          </FilterChipGroup>
        )}

        {/* Results Count */}
        {resultsCount !== undefined && (
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">
              {resultsLabel || (language === 'ru' ? 'Результаты' : 'Results')}
            </h2>
            <span className="text-sm text-muted-foreground">
              {resultsCount} {language === 'ru' ? 'найдено' : 'found'}
            </span>
          </div>
        )}

        {/* Main Content */}
        {children}
      </PageContainer>
    </AppLayout>
  );
}
