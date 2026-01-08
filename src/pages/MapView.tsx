import React from 'react';
import { MapPin } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useLanguage } from '@/contexts/LanguageContext';

export default function MapView() {
  const { t } = useLanguage();

  return (
    <AppLayout>
      <div className="flex-1 flex flex-col items-center justify-center p-4 min-h-[60vh]">
        <div className="w-20 h-20 rounded-2xl bg-secondary flex items-center justify-center mb-6">
          <MapPin className="w-10 h-10 text-primary" />
        </div>
        <h2 className="text-2xl font-display font-bold mb-2">{t('nav.map')}</h2>
        <p className="text-muted-foreground text-center max-w-sm">
          Interactive map coming soon. Discover services and locations near you.
        </p>
      </div>
    </AppLayout>
  );
}
