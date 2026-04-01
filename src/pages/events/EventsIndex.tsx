/**
 * EventsIndex — MiniAppLayout + CatalogCard
 */
import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Ticket } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useEvents } from '@/hooks/useEvents';
import { MiniAppLayout } from '@/components/miniapp/MiniAppLayout';
import { CatalogCard } from '@/components/miniapp/CatalogCard';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/uno/EmptyState';
import { mapEventToCatalogCard } from '@/lib/adapters/catalogCardAdapters';

const CATEGORIES = [
  { id: 'all', labelEn: 'All', labelRu: 'Все' },
  { id: 'beach_club', labelEn: 'Beach Clubs', labelRu: 'Пляжные клубы' },
  { id: 'dj_party', labelEn: 'DJ Parties', labelRu: 'DJ вечеринки' },
  { id: 'cultural', labelEn: 'Shows', labelRu: 'Шоу' },
  { id: 'sports_fitness', labelEn: 'Sports', labelRu: 'Спорт' },
  { id: 'music_live', labelEn: 'Live Music', labelRu: 'Живая музыка' },
  { id: 'nightlife', labelEn: 'Nightlife', labelRu: 'Ночная жизнь' },
];

export default function EventsIndex() {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState('all');
  const isRu = language === 'ru';

  const { events, isLoading } = useEvents({ category: selectedCategory !== 'all' ? selectedCategory : undefined });

  const formatDate = useCallback((dateStr: string | null) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString(isRu ? 'ru-RU' : 'en-US', {
      day: 'numeric', month: 'short', weekday: 'short',
    });
  }, [isRu]);

  return (
    <MiniAppLayout
      title={isRu ? 'Афиша' : 'Events'}
      subtitle={`${events.length} ${isRu ? 'событий' : 'events'}`}
      fallbackPath="/discover"
      categories={CATEGORIES}
      selectedCategory={selectedCategory}
      onCategoryChange={setSelectedCategory}
      showHero={false}
      showSearch={false}
      showFilter={false}
    >
      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="aspect-[4/3] rounded-xl" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          ))}
        </div>
      ) : events.length === 0 ? (
        <EmptyState
          icon={Ticket}
          title={isRu ? 'События не найдены' : 'No events found'}
          description={isRu ? 'Попробуйте изменить фильтры' : 'Try adjusting your filters'}
        />
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {events.map(event => (
            <CatalogCard key={event.id} {...mapEventToCatalogCard(event, language, navigate, formatDate)} />
          ))}
        </div>
      )}
    </MiniAppLayout>
  );
}
