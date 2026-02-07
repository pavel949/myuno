import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useOwnerProperties } from '@/hooks/usePropertyCare';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

import { Home, ArrowRight, Plus, CheckCircle2, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

export function PropertiesBlock() {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const { data: properties, isLoading } = useOwnerProperties();

  if (isLoading) {
    return (
      <Card className="overflow-hidden">
        <CardContent className="p-3">
          <Skeleton className="h-5 w-24 mb-2" />
          <div className="flex gap-2">
            {[1, 2, 3].map(i => (
              <Skeleton key={i} className="h-16 w-16 shrink-0 rounded-lg" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const activeCount = properties?.filter(p => p.status === 'active' && p.approval_status === 'approved').length || 0;
  const pendingCount = properties?.filter(p => p.approval_status === 'pending').length || 0;
  const totalCount = properties?.length || 0;

  // Empty state
  if (!properties || properties.length === 0) {
    return (
      <Card className="overflow-hidden">
        <CardContent className="p-3">
          <div className="flex items-center gap-1.5 mb-3">
            <Home className="h-4 w-4 text-muted-foreground" />
            <span className="text-xs font-medium text-muted-foreground">{isRu ? 'ОБЪЕКТЫ' : 'PROPERTIES'}</span>
          </div>
          
          <div className="text-center py-4">
            <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center mx-auto mb-2">
              <Home className="h-5 w-5 text-muted-foreground" />
            </div>
            <p className="text-xs text-muted-foreground mb-3">
              {isRu ? 'Добавьте первый объект' : 'Add your first property'}
            </p>
            <Button size="sm" onClick={() => navigate('/owner/properties/new')}>
              <Plus className="h-3.5 w-3.5 mr-1.5" />
              {isRu ? 'Добавить' : 'Add property'}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const getStatusIndicator = (property: any) => {
    if (property.approval_status === 'pending') {
      return { icon: Clock, color: 'text-warning', bg: 'bg-warning' };
    }
    if (property.status === 'active' && property.approval_status === 'approved') {
      return { icon: CheckCircle2, color: 'text-success', bg: 'bg-success' };
    }
    return { icon: Home, color: 'text-muted-foreground', bg: 'bg-muted-foreground' };
  };

  return (
    <Card 
      className="overflow-hidden cursor-pointer hover:shadow-md transition-all"
      onClick={() => navigate('/owner/properties')}
    >
      <CardContent className="p-3">
        {/* Header */}
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-1.5">
            <Home className="h-4 w-4 text-muted-foreground" />
            <span className="text-xs font-medium text-muted-foreground">{isRu ? 'ОБЪЕКТЫ' : 'PROPERTIES'}</span>
          </div>
          <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
        </div>

        {/* Stats row */}
        <div className="flex items-baseline gap-2 mb-3">
          <span className="text-2xl font-bold">{totalCount}</span>
          <span className="text-sm text-muted-foreground">{isRu ? 'объектов' : 'properties'}</span>
          
          <div className="flex items-center gap-2 ml-auto text-xs">
            {activeCount > 0 && (
              <span className="flex items-center gap-1 text-success">
                <div className="w-1.5 h-1.5 rounded-full bg-success" />
                {activeCount}
              </span>
            )}
            {pendingCount > 0 && (
              <span className="flex items-center gap-1 text-warning">
                <div className="w-1.5 h-1.5 rounded-full bg-warning" />
                {pendingCount}
              </span>
            )}
          </div>
        </div>

        {/* Property thumbnails scroll - compact */}
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1 -mx-3 px-3 touch-pan-y snap-x">
          {properties.slice(0, 6).map((property) => {
            const status = getStatusIndicator(property);
            const title = isRu ? (property.title_ru || property.title) : property.title;
            
            return (
              <button
                key={property.id}
                className="relative shrink-0 group snap-start touch-manipulation"
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/owner/properties/${property.id}`);
                }}
              >
                <div className="w-14 h-14 rounded-lg overflow-hidden bg-muted">
                  {property.cover_image ? (
                    <img 
                      src={property.cover_image} 
                      alt={title}
                      className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-300"
                      loading="lazy"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                        e.currentTarget.nextElementSibling?.classList.remove('hidden');
                      }}
                    />
                  ) : null}
                  <div className={cn(
                    "w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-primary/5",
                    property.cover_image ? "hidden" : ""
                  )}>
                    <Home className="h-5 w-5 text-muted-foreground" />
                  </div>
                </div>
                
                {/* Status dot */}
                <div className={cn(
                  "absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-background",
                  status.bg
                )} />
              </button>
            );
          })}
          
          {/* Add new button */}
          <button
            className="w-14 h-14 rounded-lg border-2 border-dashed border-muted-foreground/30 flex items-center justify-center shrink-0 snap-start touch-manipulation hover:border-primary/50 hover:bg-muted/50 transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              navigate('/owner/properties/new');
            }}
          >
            <Plus className="h-5 w-5 text-muted-foreground" />
          </button>
        </div>
      </CardContent>
    </Card>
  );
}
