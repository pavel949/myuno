/**
 * PropertyListItem - Unified property card for list views
 * Used in: AdminProperties, OwnerProperties, HostListingsPanel
 * Supports modes: admin, owner, public
 */

import { useLanguage } from '@/contexts/LanguageContext';
import { mapPropertyToCardProps, type UnifiedPropertyCardProps } from '@/lib/adapters';
import type { OwnerProperty, VendorProperty } from '@/types/property';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import {
  Home,
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
  XCircle,
  FileEdit,
} from 'lucide-react';

export interface PropertyListItemProps {
  property: OwnerProperty | VendorProperty;
  mode: 'admin' | 'owner' | 'public';
  onEdit?: (id: string) => void;
  onView?: (id: string) => void;
  onDelete?: (id: string) => void;
  onDuplicate?: (id: string) => void;
  showApprovalStatus?: boolean;
  showInstantBadge?: boolean;
  showProtectionBadge?: boolean;
  showMarketplaceBadge?: boolean;
  className?: string;
}

interface ApprovalConfig {
  icon: React.ElementType;
  label: string;
  color: string;
  bgColor: string;
}

function getApprovalConfig(status: string | undefined, isRu: boolean): ApprovalConfig {
  switch (status) {
    case 'pending':
      return {
        icon: Clock,
        label: isRu ? 'На рассмотрении' : 'Under Review',
        color: 'text-warning',
        bgColor: 'bg-warning/10 border-warning/30',
      };
    case 'approved':
      return {
        icon: CheckCircle,
        label: isRu ? 'Активен' : 'Active',
        color: 'text-success',
        bgColor: 'bg-success/10 border-success/30',
      };
    case 'rejected':
      return {
        icon: XCircle,
        label: isRu ? 'Требует доработки' : 'Needs Revision',
        color: 'text-destructive',
        bgColor: 'bg-destructive/10 border-destructive/30',
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

function formatPrice(price: number | undefined, period: string | undefined, isRu: boolean): string {
  if (!price) return '';
  const periodLabel = period === 'day' || period === 'night'
    ? (isRu ? '/ночь' : '/night')
    : period === 'month'
      ? (isRu ? '/мес' : '/mo')
      : period === 'year'
        ? (isRu ? '/год' : '/yr')
        : '';
  return `฿${price.toLocaleString()}${periodLabel}`;
}

export function PropertyListItem({
  property,
  mode,
  onEdit,
  onView,
  onDelete,
  onDuplicate,
  showApprovalStatus = true,
  showInstantBadge = false,
  showProtectionBadge = false,
  showMarketplaceBadge = false,
  className,
}: PropertyListItemProps) {
  const { language } = useLanguage();
  const isRu = language === 'ru';

  // Use adapter to normalize data
  const cardProps = mapPropertyToCardProps(property, language);
  const approvalConfig = getApprovalConfig(cardProps.approvalStatus, isRu);
  const ApprovalIcon = approvalConfig.icon;

  const isInactive = 'is_active' in property && property.is_active === false;

  const handleClick = () => {
    if (onView) onView(property.id);
  };

  return (
    <Card className={cn(
      'overflow-hidden hover:shadow-md transition-all group',
      isInactive && 'opacity-60',
      className
    )}>
      <CardContent className="p-0">
        <div className="flex">
          {/* Image */}
          <div 
            className="w-24 h-24 sm:w-28 sm:h-28 bg-muted flex-shrink-0 relative cursor-pointer"
            onClick={handleClick}
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
                "absolute bottom-0 left-0 right-0 px-2 py-1 flex items-center gap-1 text-xs font-medium",
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
            onClick={handleClick}
          >
            <div className="min-w-0">
              {/* Title row with badges */}
              <div className="flex items-start gap-2 mb-1">
                <h3 className="font-semibold text-sm line-clamp-2 leading-snug group-hover:text-primary transition-colors flex-1">
                  {cardProps.title || (isRu ? 'Без названия' : 'Untitled')}
                </h3>
                <div className="flex items-center gap-1 flex-shrink-0">
                  {showInstantBadge && cardProps.instantBooking && (
                    <Badge className="bg-accent-amber text-white text-xs h-5 px-1">
                      <Zap className="h-3 w-3" />
                    </Badge>
                  )}
                  {showProtectionBadge && (property as any).instant_booking_enabled_at && (
                    <Badge variant="outline" className="text-xs h-5 px-1 border-info/30 text-info">
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
          <div className="p-2 flex items-start flex-shrink-0" onClick={(e) => e.stopPropagation()}>
            {mode === 'owner' && onEdit && onView && (
              <div className="flex flex-col gap-1">
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="h-7 text-xs px-2 whitespace-nowrap"
                  onClick={() => onEdit(property.id)}
                >
                  <Pencil className="h-3 w-3" />
                  <span className="hidden sm:inline ml-1">{isRu ? 'Ред.' : 'Edit'}</span>
                </Button>
                <Button 
                  size="sm" 
                  variant="ghost" 
                  className="h-7 text-xs whitespace-nowrap"
                  onClick={() => onView(property.id)}
                >
                  <Eye className="h-3 w-3 mr-1" />
                  {isRu ? 'Просмотр' : 'View'}
                </Button>
              </div>
            )}
            
            {(mode === 'admin' || (mode === 'owner' && onDuplicate)) && (
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
                  {onDelete && mode === 'admin' && (
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
