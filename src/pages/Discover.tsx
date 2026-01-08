import React from 'react';
import { Search } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useLanguage } from '@/contexts/LanguageContext';
import { SkeletonGrid } from '@/components/uno/SkeletonCard';

export default function Discover() {
  const { t } = useLanguage();

  return (
    <AppLayout>
      <div className="p-4 space-y-6">
        {/* Search bar */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <input
            type="text"
            placeholder={t('action.search')}
            className="w-full h-12 pl-12 pr-4 rounded-xl bg-secondary border border-border focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors"
          />
        </div>

        {/* Coming soon placeholder */}
        <div className="text-center py-12">
          <h2 className="text-2xl font-display font-bold mb-2">{t('nav.discover')}</h2>
          <p className="text-muted-foreground mb-8">
            Explore all categories and services
          </p>
          <SkeletonGrid count={6} />
        </div>
      </div>
    </AppLayout>
  );
}
