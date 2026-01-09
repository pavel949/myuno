import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { PremiumButton } from '@/components/uno/PremiumButton';
import { PullToRefresh } from '@/components/ui/pull-to-refresh';

export default function Bookings() {
  const { t } = useLanguage();
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();
  const [refreshKey, setRefreshKey] = useState(0);

  const handleRefresh = useCallback(async () => {
    await new Promise(resolve => setTimeout(resolve, 1000));
    setRefreshKey(prev => prev + 1);
  }, []);

  useEffect(() => {
    if (!isLoading && !user) {
      navigate('/auth', { replace: true });
    }
  }, [user, isLoading, navigate]);

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
        </div>
      </AppLayout>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <AppLayout>
      <PullToRefresh onRefresh={handleRefresh} className="h-[calc(100vh-8rem)]">
        <div className="flex-1 flex flex-col items-center justify-center p-4 min-h-[60vh]" key={refreshKey}>
          <div className="w-20 h-20 rounded-2xl bg-secondary flex items-center justify-center mb-6">
            <Calendar className="w-10 h-10 text-primary" />
          </div>
          <h2 className="text-2xl font-display font-bold mb-2">{t('nav.bookings')}</h2>
          <p className="text-muted-foreground text-center max-w-sm mb-6">
            You don't have any bookings yet. Start exploring services to make your first booking.
          </p>
          <PremiumButton onClick={() => navigate('/discover')}>
            {t('nav.discover')}
          </PremiumButton>
        </div>
      </PullToRefresh>
    </AppLayout>
  );
}
