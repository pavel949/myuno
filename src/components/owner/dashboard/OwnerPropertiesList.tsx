import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useMyProperties, type UnifiedProperty } from '@/hooks/useMyProperties';
import { PropertyCard } from '@/components/property/PropertyCard';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { ChevronRight, Plus, Home, Building2, Users } from 'lucide-react';

export function OwnerPropertiesList() {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const { ownedProperties, managedProperties, allProperties, accessRole, isLoading } = useMyProperties();

  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-7 w-40" />
        <Skeleton className="h-20 w-full rounded-none" />
        <Skeleton className="h-20 w-full rounded-none" />
      </div>
    );
  }

  if (allProperties.length === 0) {
    return (
      <div>
          <h3 className="font-semibold text-[15px] mb-4">
            {isRu ? 'Ваши объявления' : 'Your listings'}
          </h3>
        <button
          onClick={() => navigate('/mc/properties/new')}
          className="w-full flex items-center gap-4 py-4 hover:opacity-70 transition-opacity"
        >
          <div className="w-14 h-14 rounded-none bg-primary/10 flex items-center justify-center flex-shrink-0">
            <Plus className="h-6 w-6 text-primary" />
          </div>
          <div className="flex-1 text-left">
            <p className="font-medium text-[15px]">{isRu ? 'Добавьте ваш первый объект' : 'Add your first property'}</p>
            <p className="text-sm text-muted-foreground">{isRu ? 'Начните управлять с UNO' : 'Start managing with UNO'}</p>
          </div>
          <ChevronRight className="h-5 w-5 text-muted-foreground/50" />
        </button>
      </div>
    );
  }

  const mapToOwnerProperty = (property: UnifiedProperty) => ({
    id: property.property_id,
    title: isRu ? property.title_ru : property.title,
    title_ru: property.title_ru,
    cover_image: property.cover_image || undefined,
    address: property.address || undefined,
    district: property.district || undefined,
    is_active: property.is_active,
    approval_status: (property as any).approval_status || 'approved',
    property_type: (property as any).property_type,
    bedrooms: (property as any).bedrooms,
    bathrooms: (property as any).bathrooms,
    price_per_night: (property as any).price_per_night,
    currency: (property as any).currency || 'THB',
  });

  const renderProperty = (property: UnifiedProperty) => (
    <div key={`${property.source}-${property.property_id}`}>
      <PropertyCard
        property={mapToOwnerProperty(property) as any}
        variant="compact"
        mode="owner"
        navigateTo={`/mc/properties/${property.property_id}/manage`}
      />
    </div>
  );

  const showSections = accessRole === 'both';

  return (
    <div className="space-y-6">
      {/* Owned properties */}
      {ownedProperties.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-[15px]">
                {showSections 
                  ? (isRu ? 'Мои объекты' : 'My Properties')
                  : (isRu ? 'Опубликовано' : 'Published')
                }
              </h3>
              {showSections && (
                <Badge variant="secondary" className="gap-1 text-xs">
                  <Building2 className="h-3 w-3" />
                  {isRu ? 'Собственник' : 'Owner'}
                </Badge>
              )}
            </div>
            <button
              onClick={() => navigate('/mc/properties')}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              {isRu ? 'Все' : 'View all'}
            </button>
          </div>
          {/* Grid on desktop, list on mobile */}
          <div className="divide-y md:divide-y-0 md:grid md:grid-cols-2 lg:grid-cols-3 md:gap-3">
            {ownedProperties.map(renderProperty)}
          </div>
        </div>
      )}

      {/* Managed properties */}
      {managedProperties.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-[15px]">
              {showSections 
                ? (isRu ? 'Под управлением' : 'Managed')
                : (isRu ? 'Объекты' : 'Properties')
              }
            </h3>
            {showSections && (
              <Badge variant="outline" className="gap-1 text-xs">
                <Users className="h-3 w-3" />
                {isRu ? 'Управляющий' : 'Manager'}
              </Badge>
            )}
          </div>
          <div className="divide-y md:divide-y-0 md:grid md:grid-cols-2 lg:grid-cols-3 md:gap-3">
            {managedProperties.map(renderProperty)}
          </div>
        </div>
      )}

      {/* Add new listing */}
      {
        <button
          onClick={() => navigate('/mc/properties/new')}
          className="w-full flex items-center gap-4 py-3 hover:opacity-70 transition-opacity"
        >
          <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
            <Plus className="h-5 w-5 text-muted-foreground" />
          </div>
          <span className="text-[15px] font-medium">{isRu ? 'Создайте новое объявление' : 'Create a new listing'}</span>
        </button>
      }
    </div>
  );
}
