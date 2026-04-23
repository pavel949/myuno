import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useHomeServices, HomeServiceProvider } from '@/hooks/useHomeServices';
import { HomeServiceProviderCard } from './HomeServiceProviderCard';
import { UnifiedSectionHeader } from '@/components/shared';
import { Users } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

interface AllProvidersGridProps {
  className?: string;
}

export function AllProvidersGrid({ className }: AllProvidersGridProps) {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const { providers, isLoading, getProviderImage } = useHomeServices();
  const isRu = language === 'ru';

  if (isLoading) {
    return (
      <div className="px-4 py-4">
        <Skeleton className="h-6 w-44 mb-4" />
        <div className="grid gap-3">
          {[1, 2, 3, 4].map(i => (
            <Skeleton key={i} className="h-[100px] rounded-none" />
          ))}
        </div>
      </div>
    );
  }

  if (providers.length === 0) return null;

  return (
    <section className={cn("py-4 px-4", className)}>
      <UnifiedSectionHeader
        icon={Users}
        iconColor="text-primary"
        title={isRu ? 'Все специалисты' : 'All Professionals'}
        count={providers.length}
      />

      <div className="grid gap-3">
        {providers.map((provider) => (
          <HomeServiceProviderCard
            key={provider.id}
            provider={provider}
            imageUrl={getProviderImage(provider)}
            onClick={() => navigate(`/services/provider/${provider.id}?category=${provider.business_category}`)}
          />
        ))}
      </div>
    </section>
  );
}
