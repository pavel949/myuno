import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useMyProperties, type UnifiedProperty } from '@/hooks/useMyProperties';
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
        <Skeleton className="h-20 w-full rounded-xl" />
        <Skeleton className="h-20 w-full rounded-xl" />
      </div>
    );
  }

  if (allProperties.length === 0) {
    return (
      <div>
        <h2 className="text-xl font-semibold mb-4">
          {isRu ? 'Ваши объявления' : 'Your listings'}
        </h2>
        <button
          onClick={() => navigate('/owner/properties/new')}
          className="w-full flex items-center gap-4 py-4 hover:opacity-70 transition-opacity"
        >
          <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
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

  const renderProperty = (property: UnifiedProperty) => {
    const title = isRu ? property.title_ru : property.title;

    return (
      <button
        key={`${property.source}-${property.property_id}`}
        onClick={() => navigate(`/owner/properties/${property.property_id}/manage`)}
        className="w-full flex items-center gap-4 py-4 text-left hover:opacity-70 transition-opacity"
      >
        <div className="relative w-[72px] h-[72px] rounded-xl overflow-hidden flex-shrink-0 bg-muted">
          {property.cover_image ? (
            <img src={property.cover_image} alt={title} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Home className="h-6 w-6 text-muted-foreground" />
            </div>
          )}
          {property.is_active && (
            <div className="absolute top-1.5 left-1.5 w-3 h-3 rounded-full bg-green-500 border-2 border-background" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <p className="font-medium text-[15px] line-clamp-2">{title}</p>
          {property.address && (
            <p className="text-sm text-muted-foreground mt-0.5 truncate">
              {property.address}
            </p>
          )}
        </div>

        <ChevronRight className="h-5 w-5 text-muted-foreground/50 flex-shrink-0" />
      </button>
    );
  };

  const showSections = accessRole === 'both';

  return (
    <div className="space-y-6">
      {/* Owned properties */}
      {ownedProperties.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-semibold">
                {showSections 
                  ? (isRu ? 'Мои объекты' : 'My Properties')
                  : (isRu ? 'Опубликовано' : 'Published')
                }
              </h2>
              {showSections && (
                <Badge variant="secondary" className="gap-1 text-xs">
                  <Building2 className="h-3 w-3" />
                  {isRu ? 'Собственник' : 'Owner'}
                </Badge>
              )}
            </div>
            <button
              onClick={() => navigate('/owner/properties')}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              {isRu ? 'Все' : 'View all'}
            </button>
          </div>
          <div className="divide-y">
            {ownedProperties.map(renderProperty)}
          </div>
        </div>
      )}

      {/* Managed properties */}
      {managedProperties.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h2 className="text-xl font-semibold">
              {showSections 
                ? (isRu ? 'Под управлением' : 'Managed')
                : (isRu ? 'Объекты' : 'Properties')
              }
            </h2>
            {showSections && (
              <Badge variant="outline" className="gap-1 text-xs">
                <Users className="h-3 w-3" />
                {isRu ? 'Управляющий' : 'Manager'}
              </Badge>
            )}
          </div>
          <div className="divide-y">
            {managedProperties.map(renderProperty)}
          </div>
        </div>
      )}

      {/* Add new listing */}
      {(
        <button
          onClick={() => navigate('/owner/properties/new')}
          className="w-full flex items-center gap-4 py-3 hover:opacity-70 transition-opacity"
        >
          <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
            <Plus className="h-5 w-5 text-muted-foreground" />
          </div>
          <span className="text-[15px] font-medium">{isRu ? 'Создайте новое объявление' : 'Create a new listing'}</span>
        </button>
      )}
    </div>
  );
}
