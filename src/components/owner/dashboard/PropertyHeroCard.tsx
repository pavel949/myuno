import { forwardRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Home, CheckCircle2, Clock, AlertTriangle, Star, Users
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { getPropertyTypeLabel } from '@/lib/propertyTaxonomy';

interface Property {
  id: string;
  title: string;
  title_ru?: string;
  cover_image?: string;
  status?: string;
  approval_status?: string;
  property_type?: string;
  bedrooms?: number;
  rating?: number;
}

interface PropertyHeroCardProps {
  property: Property;
  stats?: {
    activeBooking?: boolean;
    pendingTasks?: number;
    thisMonthRevenue?: number;
  };
}

export const PropertyHeroCard = forwardRef<HTMLDivElement, PropertyHeroCardProps>(
  ({ property, stats }, ref) => {
    const navigate = useNavigate();
    const { language } = useLanguage();
    const isRu = language === 'ru';

    const title = isRu ? (property.title_ru || property.title) : property.title;
    
    const getStatusConfig = () => {
      if (property.approval_status === 'pending') {
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
    };

    const status = getStatusConfig();
    const StatusIcon = status.icon;

    return (
      <Card 
        ref={ref}
        className="overflow-hidden cursor-pointer hover:shadow-lg transition-all group"
        onClick={() => navigate(`/owner/properties/${property.id}`)}
      >
        {/* Image */}
        <div className="relative aspect-[16/9] bg-muted overflow-hidden">
          {property.cover_image ? (
            <img 
              src={property.cover_image} 
              alt={title}
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
          {property.rating && property.rating > 0 && (
            <Badge 
              variant="secondary" 
              className="absolute top-3 right-3 gap-1 backdrop-blur-sm bg-background/80"
            >
              <Star className="h-3 w-3 fill-primary text-primary" />
              {property.rating.toFixed(1)}
            </Badge>
          )}
        </div>

        {/* Content */}
        <div className="p-4">
          <h3 className="font-semibold text-base truncate mb-1">{title}</h3>
          <p className="text-sm text-muted-foreground">
            {property.property_type ? getPropertyTypeLabel(property.property_type, isRu ? 'ru' : 'en') : 'Property'}
            {property.bedrooms && ` · ${property.bedrooms} ${isRu ? 'спален' : 'bedrooms'}`}
          </p>
          
          {/* Revenue if available */}
          {stats?.thisMonthRevenue !== undefined && stats.thisMonthRevenue > 0 && (
            <p className="text-sm font-medium text-success mt-2">
              ฿{stats.thisMonthRevenue.toLocaleString()} {isRu ? 'в этом месяце' : 'this month'}
            </p>
          )}
        </div>
      </Card>
    );
  }
);

PropertyHeroCard.displayName = 'PropertyHeroCard';

export function PropertyHeroCardSkeleton() {
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
