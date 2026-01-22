import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useOwnerProperties } from '@/hooks/usePropertyCare';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Home, ArrowRight, Plus, CheckCircle2, Clock, Users } from 'lucide-react';
import { cn } from '@/lib/utils';

export function PropertiesBlock() {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const { data: properties, isLoading } = useOwnerProperties();

  if (isLoading) {
    return (
      <Card className="overflow-hidden">
        <CardContent className="p-4">
          <Skeleton className="h-6 w-32 mb-3" />
          <div className="flex gap-3">
            {[1, 2, 3].map(i => (
              <Skeleton key={i} className="h-24 w-20 shrink-0 rounded-xl" />
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
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Home className="h-5 w-5 text-muted-foreground" />
              <span className="font-semibold">{isRu ? 'Объекты' : 'Properties'}</span>
            </div>
          </div>
          
          <div className="text-center py-6">
            <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-3">
              <Home className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              {isRu ? 'Добавьте первый объект' : 'Add your first property'}
            </p>
            <Button onClick={() => navigate('/owner/properties/new')}>
              <Plus className="h-4 w-4 mr-2" />
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
      className="overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
      onClick={() => navigate('/owner/properties')}
    >
      <CardContent className="p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Home className="h-5 w-5 text-muted-foreground" />
            <span className="font-semibold">{isRu ? 'Объекты' : 'Properties'}</span>
          </div>
          <ArrowRight className="h-4 w-4 text-muted-foreground" />
        </div>

        {/* Stats summary */}
        <div className="flex items-center gap-3 text-sm mb-4">
          <span className="font-medium">{totalCount} {isRu ? 'объектов' : 'properties'}</span>
          {activeCount > 0 && (
            <span className="flex items-center gap-1 text-success">
              <CheckCircle2 className="h-3.5 w-3.5" />
              {activeCount} {isRu ? 'активно' : 'active'}
            </span>
          )}
          {pendingCount > 0 && (
            <span className="flex items-center gap-1 text-warning">
              <Clock className="h-3.5 w-3.5" />
              {pendingCount} {isRu ? 'на проверке' : 'pending'}
            </span>
          )}
        </div>

        {/* Property thumbnails scroll */}
        <ScrollArea className="w-full mb-4">
          <div className="flex gap-3 pb-2">
            {properties.slice(0, 6).map((property) => {
              const status = getStatusIndicator(property);
              const title = isRu ? (property.title_ru || property.title) : property.title;
              
              return (
                <button
                  key={property.id}
                  className="relative shrink-0 group"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/owner/properties/${property.id}`);
                  }}
                >
                  <div className="w-20 h-20 rounded-xl overflow-hidden bg-muted">
                    {property.cover_image ? (
                      <img 
                        src={property.cover_image} 
                        alt={title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-primary/5">
                        <Home className="h-6 w-6 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  
                  {/* Status dot */}
                  <div className={cn(
                    "absolute -top-1 -right-1 w-4 h-4 rounded-full border-2 border-background",
                    status.bg
                  )} />
                  
                  {/* Title */}
                  <p className="text-xs mt-1 truncate w-20 text-center">
                    {title?.slice(0, 10) || 'Property'}
                  </p>
                </button>
              );
            })}
            
            {/* Add new button */}
            <button
              className="w-20 h-20 rounded-xl border-2 border-dashed border-muted-foreground/30 flex items-center justify-center shrink-0 hover:border-primary/50 hover:bg-muted/50 transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                navigate('/owner/properties/new');
              }}
            >
              <Plus className="h-6 w-6 text-muted-foreground" />
            </button>
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>

        {/* Main action */}
        <Button 
          variant="outline"
          className="w-full"
          onClick={(e) => {
            e.stopPropagation();
            navigate('/owner/properties/new');
          }}
        >
          <Plus className="h-4 w-4 mr-2" />
          {isRu ? 'Добавить объект' : 'Add property'}
        </Button>
      </CardContent>
    </Card>
  );
}
