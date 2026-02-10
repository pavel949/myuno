/**
 * HomeFeaturedProperties — Airbnb-style property grid
 * Shows real featured properties from DB in a 2-column grid
 */
import React, { memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useFeaturedProperties } from '@/hooks/useProperties';
import { PropertyListingCard } from '@/components/property/PropertyListingCard';
import { Skeleton } from '@/components/ui/skeleton';

export const HomeFeaturedProperties = memo(function HomeFeaturedProperties() {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const { data: properties, isLoading } = useFeaturedProperties(6);

  if (isLoading) {
    return (
      <section className="space-y-4">
        <Skeleton className="h-5 w-40" />
        <div className="grid grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="space-y-3">
              <Skeleton className="aspect-square rounded-2xl" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          ))}
        </div>
      </section>
    );
  }

  if (!properties?.length) return null;

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-foreground">
          {isRu ? 'Популярное жильё' : 'Popular stays'}
        </h2>
        <button
          onClick={() => navigate('/property')}
          className="flex items-center gap-1 text-sm font-medium text-primary hover:underline"
        >
          {isRu ? 'Все' : 'All'}
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="grid grid-cols-2 gap-x-4 gap-y-6">
        {properties.slice(0, 4).map((property) => (
          <PropertyListingCard
            key={property.id}
            property={property}
            mode="rent"
          />
        ))}
      </div>
    </section>
  );
});

export default HomeFeaturedProperties;
