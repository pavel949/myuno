import React, { useState, useCallback } from 'react';
import { Search } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useLanguage } from '@/contexts/LanguageContext';
import { SkeletonGrid } from '@/components/uno/SkeletonCard';
import { PullToRefresh } from '@/components/ui/pull-to-refresh';

export default function Discover() {
  const { t } = useLanguage();
  const [refreshKey, setRefreshKey] = useState(0);

  const handleRefresh = useCallback(async () => {
    // Simulate refresh delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    setRefreshKey(prev => prev + 1);
  }, []);

  return (
    <AppLayout>
      <PullToRefresh onRefresh={handleRefresh} className="h-[calc(100vh-8rem)]">
        <div className="p-4 space-y-6" key={refreshKey}>
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
      </PullToRefresh>
    </AppLayout>
  );
}
