import React from 'react';
import { useUrlFilters } from '@/hooks/useUrlFilters';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { usePublicListings } from '@/hooks/useUserListings';
import { MiniAppLayout } from '@/components/miniapp/MiniAppLayout';
import { ClassifiedCard } from '@/components/classifieds/ClassifiedCard';
import { ClassifiedFilters } from '@/components/classifieds/ClassifiedFilters';
import { ItemCondition } from '@/types/userListing';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LoadingState } from '@/components/uno/LoadingSpinner';

const CATEGORIES = [
  { id: '', labelEn: 'All', labelRu: 'Все', icon: '🔥' },
  { id: 'electronics', labelEn: 'Electronics', labelRu: 'Электроника', icon: '📱' },
  { id: 'furniture', labelEn: 'Furniture', labelRu: 'Мебель', icon: '🛋️' },
  { id: 'clothing', labelEn: 'Clothing', labelRu: 'Одежда', icon: '👗' },
  { id: 'vehicles', labelEn: 'Vehicles', labelRu: 'Транспорт', icon: '🏍️' },
  { id: 'sports', labelEn: 'Sports', labelRu: 'Спорт', icon: '🏄' },
  { id: 'kids', labelEn: 'Kids', labelRu: 'Детям', icon: '🧸' },
  { id: 'home', labelEn: 'Home', labelRu: 'Дом', icon: '🏠' },
  { id: 'other', labelEn: 'Other', labelRu: 'Другое', icon: '📦' },
];

export default function ClassifiedsIndex() {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const isRu = language === 'ru';

  const { getValue, setValue } = useUrlFilters();
  const selectedCategory = getValue('cat', '');
  const setSelectedCategory = (v: string) => setValue('cat', v || null);
  const selectedCondition = (getValue('condition', '') as ItemCondition | '') || undefined;
  const setSelectedCondition = (v: ItemCondition | undefined) => setValue('condition', v || null);
  const searchQuery = getValue('q', '');
  const setSearchQuery = (v: string) => setValue('q', v || null);

  const { listings, isLoading } = usePublicListings({
    category: selectedCategory || undefined,
    condition: selectedCondition,
    search: searchQuery,
  });

  return (
    <MiniAppLayout
      title={isRu ? 'Барахолка' : 'Flea Market'}
      subtitle={isRu ? 'Объявления от частных лиц' : 'Buy & sell from locals'}
      fallbackPath="/discover"
      categories={CATEGORIES}
      selectedCategory={selectedCategory}
      onCategoryChange={setSelectedCategory}
      searchValue={searchQuery}
      onSearchChange={setSearchQuery}
      searchPlaceholder={isRu ? 'Поиск объявлений...' : 'Search listings...'}
      showHero={false}
      showFilter={false}
    >
      <ClassifiedFilters
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        selectedCondition={selectedCondition}
        onConditionChange={setSelectedCondition}
      />

      {isLoading ? (
        <LoadingState />
      ) : listings.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <span className="text-5xl mb-4">📦</span>
          <h3 className="text-lg font-semibold mb-1">
            {isRu ? 'Пока нет объявлений' : 'No listings yet'}
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
            {isRu ? 'Будьте первым — разместите объявление!' : 'Be the first — post a listing!'}
          </p>
          <Button onClick={() => navigate('/classifieds/sell')} size="sm">
            <Plus className="h-4 w-4 mr-1" />
            {isRu ? 'Подать объявление' : 'Post a listing'}
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-5">
          {listings.map(listing => (
            <ClassifiedCard
              key={listing.id}
              listing={listing}
              onClick={() => navigate(`/classifieds/${listing.id}`)}
            />
          ))}
        </div>
      )}

      {/* FAB - Sell */}
      <button
        onClick={() => navigate('/classifieds/sell')}
        className="fixed bottom-20 right-4 z-40 h-14 w-14 rounded-full bg-primary text-primary-foreground [box-shadow:var(--shadow-elevation-4)] flex items-center justify-center hover:bg-primary/90 transition-colors"
        aria-label={isRu ? 'Подать объявление' : 'Post a listing'}
      >
        <Plus className="h-6 w-6" />
      </button>
    </MiniAppLayout>
  );
}
