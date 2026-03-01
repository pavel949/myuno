/**
 * PropertyCard - Unified property card with hero/list/compact variants
 * Replaces: PropertyHeroCard, PropertyListItem
 * Used in: Owner Dashboard, Admin Properties, Property Lists
 */

import React, { forwardRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { mapPropertyToCardProps, type UnifiedPropertyCardProps } from '@/lib/adapters';
import type { OwnerProperty, VendorProperty } from '@/types/property';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import {
  Home,
  Building2,
  MapPin,
  Bed,
  Bath,
  SquareStack,
  MoreVertical,
  Eye,
  Pencil,
  Trash2,
  Copy,
  Globe,
  Shield,
  Zap,
  Clock,
  CheckCircle,
  CheckCircle2,
  XCircle,
  FileEdit,
  Star,
  Users,
  AlertTriangle,
} from 'lucide-react';
import { getPropertyTypeLabel } from '@/lib/propertyTaxonomy';
import { getCurrencySymbol } from '@/lib/config/currencies';

// ============= TYPES =============

export type PropertyCardVariant = 'hero' | 'list' | 'compact';
export type PropertyCardMode = 'admin' | 'owner' | 'public';

interface ApprovalConfig {
  icon: React.ElementType;
  label: string;
  color: string;
  bgColor: string;
}

export interface PropertyCardStats {
  activeBooking?: boolean;
  pendingTasks?: number;
  thisMonthRevenue?: number;
}

export interface PropertyCardProps {
  property: OwnerProperty | VendorProperty;
  variant?: PropertyCardVariant;
  mode?: PropertyCardMode;
  stats?: PropertyCardStats;
  companyName?: string;
  onEdit?: (id: string) => void;
  onView?: (id: string) => void;
  onDelete?: (id: string) => void;
  onDuplicate?: (id: string) => void;
  onToggleActive?: (id: string, active: boolean) => void;
  showApprovalStatus?: boolean;
  showInstantBadge?: boolean;
  showProtectionBadge?: boolean;
  showMarketplaceBadge?: boolean;
  navigateTo?: string;
  className?: string;
}

// ============= HELPERS =============

function getApprovalConfig(status: string | undefined, isRu: boolean): ApprovalConfig {
  switch (status) {
    case 'pending':
      return {
        icon: Clock,
        label: isRu ? 'На рассмотрении' : 'Under Review',
        color: 'text-warning',
        bgColor: 'bg-warning/10 border-warning/20',
      };
    case 'approved':
      return {
        icon: CheckCircle,
        label: isRu ? 'Активен' : 'Active',
        color: 'text-success',
        bgColor: 'bg-success/10 border-success/20',
      };
    case 'rejected':
      return {
        icon: XCircle,
        label: isRu ? 'Требует доработки' : 'Needs Revision',
        color: 'text-destructive',
        bgColor: 'bg-destructive/10 border-destructive/20',
      };
    default:
      return {
        icon: FileEdit,
        label: isRu ? 'Черновик' : 'Draft',
        color: 'text-muted-foreground',
        bgColor: 'bg-muted border-border',
      };
  }
}

function getOperationalStatus(
  approvalStatus: string | undefined, 
  stats: PropertyCardStats | undefined, 
  isRu: boolean
) {
  if (approvalStatus === 'pending') {
    return { 
      icon: Clock, 
      label: isRu ? 'На модерации' : 'Pending Review',
      color: 'bg-warning/10 text-warning border-warning/20'
    };
  }
  if (stats?.activeBooking) {
    return { 
      icon: Users, 
      label: isRu ? 'Гости в объекте' : 'Guests Staying',
      color: 'bg-success/10 text-success border-success/20'
    };
  }
  if (stats?.pendingTasks && stats.pendingTasks > 0) {
    return { 
      icon: AlertTriangle, 
      label: `${stats.pendingTasks} ${isRu ? 'задач' : 'tasks'}`,
      color: 'bg-orange-500/10 text-orange-600 border-orange-500/20'
    };
  }
  return { 
    icon: CheckCircle2, 
    label: isRu ? 'Готово к заезду' : 'Ready',
    color: 'bg-muted text-muted-foreground border-border'
  };
}

function formatPrice(price: number | undefined, period: string | undefined, isRu: boolean): string {
  if (!price) return '';
  const symbol = getCurrencySymbol('THB');
  const periodLabel = period === 'day' || period === 'night'
    ? (isRu ? '/ночь' : '/night')
    : period === 'month'
      ? (isRu ? '/мес' : '/mo')
      : period === 'year'
        ? (isRu ? '/год' : '/yr')
        : '';
  return `${symbol}${price.toLocaleString()}${periodLabel}`;
}

// ============= HERO VARIANT =============

interface HeroVariantProps {
  cardProps: UnifiedPropertyCardProps;
  stats?: PropertyCardStats;
  isRu: boolean;
  onClick: () => void;
}

function HeroVariant({ cardProps, stats, isRu, onClick }: HeroVariantProps) {
  const status = getOperationalStatus(cardProps.approvalStatus, stats, isRu);
  const StatusIcon = status.icon;

  return (
    <Card 
      className="overflow-hidden cursor-pointer hover:shadow-md hover:-translate-y-0.5 transition-all group"
      onClick={onClick}
    >
      {/* Image */}
      <div className="relative aspect-[16/9] bg-muted overflow-hidden">
        {cardProps.coverImage ? (
          <img 
            src={cardProps.coverImage} 
            alt={cardProps.title}
            className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-300"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-primary/5">
            <Home className="h-12 w-12 text-muted-foreground/50" />
          </div>
        )}
        
        {/* Status badge overlay */}
        <Badge 
          variant="outline" 
          className={cn(
            "absolute top-3 left-3 gap-1.5 backdrop-blur-sm border",
            status.color
          )}
        >
          <StatusIcon className="h-3 w-3" />
          {status.label}
        </Badge>

        {/* Rating if available */}
        {cardProps.rating && cardProps.rating > 0 && (
          <Badge 
            variant="secondary" 
            className="absolute top-3 right-3 gap-1 backdrop-blur-sm bg-background/80"
          >
            <Star className="h-3 w-3 fill-primary text-primary" />
            {cardProps.rating.toFixed(1)}
          </Badge>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="font-semibold text-base truncate mb-1">{cardProps.title}</h3>
        <p className="text-sm text-muted-foreground">
          {cardProps.propertyType ? getPropertyTypeLabel(cardProps.propertyType, isRu ? 'ru' : 'en') : 'Property'}
          {cardProps.bedrooms && ` · ${cardProps.bedrooms} ${isRu ? 'спален' : 'bedrooms'}`}
        </p>
        
        {/* Revenue if available */}
        {stats?.thisMonthRevenue !== undefined && stats.thisMonthRevenue > 0 && (
          <p className="text-sm font-medium text-success mt-2">
            {getCurrencySymbol('THB')}{stats.thisMonthRevenue.toLocaleString()} {isRu ? 'в этом месяце' : 'this month'}
          </p>
        )}
      </div>
    </Card>
  );
}

// ============= LIST VARIANT =============

interface ListVariantProps {
  cardProps: UnifiedPropertyCardProps;
  property: OwnerProperty | VendorProperty;
  mode: PropertyCardMode;
  isRu: boolean;
  companyName?: string;
  showApprovalStatus: boolean;
  showInstantBadge: boolean;
  showProtectionBadge: boolean;
  showMarketplaceBadge: boolean;
  onEdit?: (id: string) => void;
  onView?: (id: string) => void;
  onDelete?: (id: string) => void;
  onDuplicate?: (id: string) => void;
  onToggleActive?: (id: string, active: boolean) => void;
  onClick: () => void;
}

function ListVariant({
  cardProps,
  property,
  mode,
  isRu,
  companyName,
  showApprovalStatus,
  showInstantBadge,
  showProtectionBadge,
  showMarketplaceBadge,
  onEdit,
  onView,
  onDelete,
  onDuplicate,
  onToggleActive,
  onClick,
}: ListVariantProps) {
  const approvalConfig = getApprovalConfig(cardProps.approvalStatus, isRu);
  const ApprovalIcon = approvalConfig.icon;
  const isInactive = 'is_active' in property && property.is_active === false;

  return (
    <Card className={cn(
      'overflow-hidden hover:shadow-md hover:-translate-y-0.5 transition-all group',
      isInactive && 'opacity-60'
    )}>
      <CardContent className="p-0">
        <div className="flex">
          {/* Image */}
          <div 
            className="w-24 h-24 sm:w-28 sm:h-28 bg-muted flex-shrink-0 relative cursor-pointer"
            onClick={onClick}
          >
            {cardProps.coverImage ? (
              <img 
                src={cardProps.coverImage} 
                alt={cardProps.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Home className="h-8 w-8 text-muted-foreground" />
              </div>
            )}
            
            {/* Status overlay */}
            {showApprovalStatus && (
              <div className={cn(
                "absolute bottom-0 left-0 right-0 px-2 py-1 flex items-center gap-1 text-xs font-medium border-t",
                approvalConfig.bgColor,
                approvalConfig.color
              )}>
                <ApprovalIcon className="h-3 w-3" />
                <span className="truncate">{approvalConfig.label}</span>
              </div>
            )}
          </div>

          {/* Content */}
          <div 
            className="flex-1 p-3 flex flex-col justify-between min-w-0 cursor-pointer"
            onClick={onClick}
          >
            <div className="min-w-0">
              {/* Title row with badges */}
              <div className="flex items-start gap-2 mb-1">
                <h3 className="font-semibold text-sm line-clamp-2 leading-snug group-hover:text-primary transition-colors flex-1">
                  {cardProps.title || (isRu ? 'Без названия' : 'Untitled')}
                </h3>
                <div className="flex items-center gap-1 flex-shrink-0">
                  {showInstantBadge && cardProps.instantBooking && (
                    <Badge className="bg-amber-500 text-white text-xs h-5 px-1">
                      <Zap className="h-3 w-3" />
                    </Badge>
                  )}
                  {showProtectionBadge && (property as any).instant_booking_enabled_at && (
                    <Badge variant="outline" className="text-xs h-5 px-1 border-blue-300 text-blue-700">
                      <Shield className="h-3 w-3" />
                    </Badge>
                  )}
                  {showMarketplaceBadge && cardProps.marketplacePropertyId && (
                    <Badge variant="outline" className="text-xs h-5 px-1">
                      <Globe className="h-3 w-3" />
                    </Badge>
                  )}
                  {isInactive && (
                    <Badge variant="outline" className="text-xs h-5">
                      {isRu ? 'Неактивен' : 'Inactive'}
                    </Badge>
                  )}
                </div>
              </div>

              {/* Company name */}
              {companyName && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
                  <Building2 className="h-3 w-3 flex-shrink-0 text-primary/60" />
                  <span className="truncate font-medium">{companyName}</span>
                </div>
              )}

              {/* Location */}
              {(cardProps.district || cardProps.address) && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
                  <MapPin className="h-3 w-3 flex-shrink-0" />
                  <span className="truncate">{cardProps.district || cardProps.address}</span>
                </div>
              )}

              {/* Specs */}
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                {cardProps.propertyType && (
                  <span className="capitalize truncate max-w-[60px]">{cardProps.propertyType}</span>
                )}
                {cardProps.bedrooms && (
                  <span className="flex items-center gap-0.5 flex-shrink-0">
                    <Bed className="h-3 w-3" />
                    {cardProps.bedrooms}
                  </span>
                )}
                {cardProps.bathrooms && (
                  <span className="flex items-center gap-0.5 flex-shrink-0">
                    <Bath className="h-3 w-3" />
                    {cardProps.bathrooms}
                  </span>
                )}
                {cardProps.areaSqm && (
                  <span className="flex items-center gap-0.5 flex-shrink-0">
                    <SquareStack className="h-3 w-3" />
                    {cardProps.areaSqm}м²
                  </span>
                )}
              </div>
            </div>

            {/* Price */}
            {cardProps.price && (
              <p className="font-bold text-primary text-sm mt-1">
                {formatPrice(cardProps.price, cardProps.pricePeriod, isRu)}
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="p-2 flex items-start" onClick={(e) => e.stopPropagation()}>
            {mode === 'owner' && onEdit && onView && (
              <div className="flex flex-col gap-1">
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="h-7 text-xs px-2"
                  onClick={() => onEdit(property.id)}
                >
                  <Pencil className="h-3 w-3" />
                  <span className="hidden sm:inline ml-1">{isRu ? 'Ред.' : 'Edit'}</span>
                </Button>
                <Button 
                  size="sm" 
                  variant="ghost" 
                  className="h-7 text-xs"
                  onClick={() => onView(property.id)}
                >
                  <Eye className="h-3 w-3 mr-1" />
                  {isRu ? 'Просмотр' : 'View'}
                </Button>
              </div>
            )}
            
            {(mode === 'admin' || (mode === 'owner' && (onDuplicate || onToggleActive || onDelete))) && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {onView && (
                    <DropdownMenuItem onClick={() => onView(property.id)}>
                      <Eye className="h-4 w-4 mr-2" />
                      {isRu ? 'Открыть' : 'View'}
                    </DropdownMenuItem>
                  )}
                  {onEdit && (
                    <DropdownMenuItem onClick={() => onEdit(property.id)}>
                      <Pencil className="h-4 w-4 mr-2" />
                      {isRu ? 'Редактировать' : 'Edit'}
                    </DropdownMenuItem>
                  )}
                  {onDuplicate && (
                    <DropdownMenuItem onClick={() => onDuplicate(property.id)}>
                      <Copy className="h-4 w-4 mr-2" />
                      {isRu ? 'Создать на основе' : 'Duplicate'}
                    </DropdownMenuItem>
                  )}
                  {onToggleActive && (
                    <DropdownMenuItem onClick={() => onToggleActive(property.id, !!isInactive)}>
                      {isInactive ? (
                        <>
                          <CheckCircle className="h-4 w-4 mr-2 text-success" />
                          {isRu ? 'Активировать' : 'Activate'}
                        </>
                      ) : (
                        <>
                          <XCircle className="h-4 w-4 mr-2 text-warning" />
                          {isRu ? 'Деактивировать' : 'Deactivate'}
                        </>
                      )}
                    </DropdownMenuItem>
                  )}
                  {onDelete && (
                    <DropdownMenuItem 
                      className="text-destructive"
                      onClick={() => onDelete(property.id)}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      {isRu ? 'Удалить' : 'Delete'}
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ============= COMPACT VARIANT =============

interface CompactVariantProps {
  cardProps: UnifiedPropertyCardProps;
  isRu: boolean;
  onClick: () => void;
}

function CompactVariant({ cardProps, isRu, onClick }: CompactVariantProps) {
  return (
    <Card 
      className="overflow-hidden cursor-pointer hover:shadow-md hover:-translate-y-0.5 transition-all group"
      onClick={onClick}
    >
      <CardContent className="p-2">
        <div className="flex gap-3">
          {/* Small thumbnail */}
          <div className="w-16 h-16 bg-muted rounded-lg overflow-hidden flex-shrink-0">
            {cardProps.coverImage ? (
              <img 
                src={cardProps.coverImage} 
                alt={cardProps.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Home className="h-5 w-5 text-muted-foreground" />
              </div>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0 py-0.5">
            <h4 className="font-medium text-sm truncate group-hover:text-primary transition-colors">
              {cardProps.title || (isRu ? 'Без названия' : 'Untitled')}
            </h4>
            
            <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
              {cardProps.bedrooms && (
                <span className="flex items-center gap-0.5">
                  <Bed className="h-3 w-3" />
                  {cardProps.bedrooms}
                </span>
              )}
              {cardProps.district && (
                <span className="truncate">{cardProps.district}</span>
              )}
            </div>

            {cardProps.price && (
              <p className="font-semibold text-primary text-xs mt-1">
                {formatPrice(cardProps.price, cardProps.pricePeriod, isRu)}
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ============= MAIN COMPONENT =============

export const PropertyCard = forwardRef<HTMLDivElement, PropertyCardProps>(
   ({
    property,
    variant = 'list',
    mode = 'owner',
    stats,
    companyName,
    onEdit,
    onView,
    onDelete,
    onDuplicate,
    onToggleActive,
    showApprovalStatus = true,
    showInstantBadge = false,
    showProtectionBadge = false,
    showMarketplaceBadge = false,
    navigateTo,
    className,
  }, ref) => {
    const navigate = useNavigate();
    const { language } = useLanguage();
    const isRu = language === 'ru';

    // Normalize data via adapter
    const cardProps = mapPropertyToCardProps(property, language);

    const handleClick = () => {
      if (navigateTo) {
        navigate(navigateTo);
      } else if (onView) {
        onView(property.id);
      } else {
        // Default navigation based on mode
        const basePath = mode === 'admin' ? '/admin/properties' : '/owner/properties';
        navigate(`${basePath}/${property.id}`);
      }
    };

    return (
      <div ref={ref} className={className}>
        {variant === 'hero' && (
          <HeroVariant 
            cardProps={cardProps} 
            stats={stats} 
            isRu={isRu} 
            onClick={handleClick} 
          />
        )}
        
        {variant === 'list' && (
          <ListVariant
            cardProps={cardProps}
            property={property}
            mode={mode}
            companyName={companyName}
            isRu={isRu}
            showApprovalStatus={showApprovalStatus}
            showInstantBadge={showInstantBadge}
            showProtectionBadge={showProtectionBadge}
            showMarketplaceBadge={showMarketplaceBadge}
            onEdit={onEdit}
            onView={onView}
            onDelete={onDelete}
            onDuplicate={onDuplicate}
            onToggleActive={onToggleActive}
            onClick={handleClick}
          />
        )}
        
        {variant === 'compact' && (
          <CompactVariant 
            cardProps={cardProps} 
            isRu={isRu} 
            onClick={handleClick} 
          />
        )}
      </div>
    );
  }
);

PropertyCard.displayName = 'PropertyCard';

// ============= SKELETONS =============

export function PropertyCardSkeleton({ variant = 'list' }: { variant?: PropertyCardVariant }) {
  if (variant === 'hero') {
    return (
      <Card className="overflow-hidden">
        <Skeleton className="aspect-[16/9]" />
        <div className="p-4 space-y-2">
          <Skeleton className="h-5 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      </Card>
    );
  }

  if (variant === 'compact') {
    return (
      <Card>
        <CardContent className="p-2">
          <div className="flex gap-3">
            <Skeleton className="w-16 h-16 rounded-lg" />
            <div className="flex-1 space-y-2 py-1">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // List variant (default)
  return (
    <Card>
      <CardContent className="p-0">
        <div className="flex">
          <Skeleton className="w-24 h-24 sm:w-28 sm:h-28" />
          <div className="flex-1 p-3 space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
            <Skeleton className="h-3 w-1/3" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ============= RE-EXPORTS FOR BACKWARD COMPATIBILITY =============

/** @deprecated Use PropertyCard with variant="hero" instead */
export const PropertyHeroCard = forwardRef<
  HTMLDivElement, 
  { property: OwnerProperty | VendorProperty; stats?: PropertyCardStats }
>(({ property, stats }, ref) => (
  <PropertyCard 
    ref={ref} 
    property={property} 
    variant="hero" 
    stats={stats} 
    mode="owner" 
  />
));
PropertyHeroCard.displayName = 'PropertyHeroCard';

/** @deprecated Use PropertyCardSkeleton with variant="hero" instead */
export const PropertyHeroCardSkeleton = () => <PropertyCardSkeleton variant="hero" />;

/** @deprecated Use PropertyCard with variant="list" instead */
export const PropertyListItem = forwardRef<HTMLDivElement, PropertyCardProps>(
  (props, ref) => <PropertyCard ref={ref} {...props} variant="list" />
);
PropertyListItem.displayName = 'PropertyListItem';
