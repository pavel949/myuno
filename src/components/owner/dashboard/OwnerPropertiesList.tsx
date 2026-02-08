import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useOwnerProperties } from '@/hooks/usePropertyCare';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { ChevronRight, Plus, Home, MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';

export function OwnerPropertiesList() {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const { data: properties, isLoading } = useOwnerProperties();

  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-7 w-40" />
        <Skeleton className="h-20 w-full rounded-xl" />
        <Skeleton className="h-20 w-full rounded-xl" />
      </div>
    );
  }

  if (!properties || properties.length === 0) {
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

  // Group by status-like categories
  const published = properties.filter(p => p.status === 'active' || p.status === 'published' || !p.status);
  const inProgress = properties.filter(p => p.status === 'draft' || p.status === 'pending');

  const renderProperty = (property: typeof properties[0]) => {
    const title = isRu ? (property.title_ru || property.title) : property.title;
    const image = property.cover_image || property.images?.[0];

    return (
      <button
        key={property.id}
        onClick={() => navigate(`/owner/properties/${property.id}/manage`)}
        className="w-full flex items-center gap-4 py-4 text-left hover:opacity-70 transition-opacity"
      >
        {/* Thumbnail */}
        <div className="relative w-[72px] h-[72px] rounded-xl overflow-hidden flex-shrink-0 bg-muted">
          {image ? (
            <img src={image} alt={title} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Home className="h-6 w-6 text-muted-foreground" />
            </div>
          )}
          {/* Green dot for active */}
          {(!property.status || property.status === 'active' || property.status === 'published') && (
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

  return (
    <div className="space-y-6">
      {/* Published */}
      {published.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-1">
            <h2 className="text-xl font-semibold">{isRu ? 'Опубликовано' : 'Published'}</h2>
            <button
              onClick={() => navigate('/owner/properties')}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              {isRu ? 'Все' : 'View all'}
            </button>
          </div>
          <div className="divide-y">
            {published.map(renderProperty)}
          </div>
        </div>
      )}

      {/* In Progress */}
      {inProgress.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold mb-1">{isRu ? 'В процессе' : 'In progress'}</h2>
          <div className="divide-y">
            {inProgress.map(renderProperty)}
          </div>
        </div>
      )}

      {/* Add new listing */}
      <button
        onClick={() => navigate('/owner/properties/new')}
        className="w-full flex items-center gap-4 py-3 hover:opacity-70 transition-opacity"
      >
        <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
          <Plus className="h-5 w-5 text-muted-foreground" />
        </div>
        <span className="text-[15px] font-medium">{isRu ? 'Создайте новое объявление' : 'Create a new listing'}</span>
      </button>
    </div>
  );
}
