import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useOwnerProperties } from '@/hooks/usePropertyCare';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ChevronRight, Plus, Home } from 'lucide-react';
import { PropertyCard, PropertyCardSkeleton } from '@/components/property/PropertyCard';


export function PortfolioSection() {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const { data: properties, isLoading } = useOwnerProperties();

  if (isLoading) {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-4 w-16" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <PropertyCardSkeleton variant="hero" />
          <PropertyCardSkeleton variant="hero" />
        </div>
      </div>
    );
  }

  // Empty state
  if (!properties || properties.length === 0) {
    return (
      <div className="space-y-3">
        <h2 className="font-semibold text-base">
          {isRu ? 'Ваши объекты' : 'Your Properties'}
        </h2>
        
        <div 
          className="border-2 border-dashed border-muted-foreground/20 rounded-xl p-8 text-center cursor-pointer hover:border-primary/50 hover:bg-muted/30 transition-colors"
          onClick={() => navigate('/owner/properties/new')}
        >
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
            <Home className="h-6 w-6 text-primary" />
          </div>
          <h3 className="font-medium mb-1">
            {isRu ? 'Добавьте ваш первый объект' : 'Add your first property'}
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
            {isRu 
              ? 'Начните управлять недвижимостью с UNO' 
              : 'Start managing your property with UNO'}
          </p>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            {isRu ? 'Добавить объект' : 'Add Property'}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div data-tour="portfolio" className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="font-semibold text-base">
            {isRu ? 'Ваши объекты' : 'Your Properties'}
          </h2>
          <span className="text-xs text-muted-foreground">
            ({properties.length})
          </span>
        </div>
        <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => navigate('/owner/properties')}>
          {isRu ? 'Все' : 'View all'}
          <ChevronRight className="h-3 w-3 ml-1" />
        </Button>
      </div>

      {/* Properties grid/scroll */}
      {properties.length <= 2 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {properties.map((property) => (
            <PropertyCard 
              key={property.id} 
              property={property}
              variant="hero"
              mode="owner"
            />
          ))}
          
          {/* Add new card */}
          <div 
            className="border-2 border-dashed border-muted-foreground/20 rounded-xl flex flex-col items-center justify-center p-6 cursor-pointer hover:border-primary/50 hover:bg-muted/30 transition-colors min-h-[200px]"
            onClick={() => navigate('/owner/properties/new')}
          >
            <Plus className="h-8 w-8 text-muted-foreground mb-2" />
            <span className="text-sm text-muted-foreground">
              {isRu ? 'Добавить' : 'Add new'}
            </span>
          </div>
        </div>
      ) : (
        <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2 -mx-4 px-4 touch-pan-y snap-x snap-mandatory">
          {properties.slice(0, 5).map((property) => (
            <div key={property.id} className="w-[85vw] max-w-[280px] flex-shrink-0 snap-start touch-manipulation">
              <PropertyCard property={property} variant="hero" mode="owner" />
            </div>
          ))}
          
          {/* Add new card */}
          <button 
            className="w-[85vw] max-w-[280px] flex-shrink-0 snap-start touch-manipulation border-2 border-dashed border-muted-foreground/20 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-primary/50 hover:bg-muted/30 transition-colors min-h-[200px]"
            onClick={() => navigate('/owner/properties/new')}
          >
            <Plus className="h-8 w-8 text-muted-foreground mb-2" />
            <span className="text-sm text-muted-foreground">
              {isRu ? 'Добавить' : 'Add new'}
            </span>
          </button>
        </div>
      )}
    </div>
  );
}
