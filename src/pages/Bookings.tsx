import React, { useEffect, useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { PremiumButton } from '@/components/uno/PremiumButton';
import { PullToRefresh } from '@/components/ui/pull-to-refresh';
import { PageContainer } from '@/components/uno/PageContainer';
import { PageHeader } from '@/components/uno/PageHeader';
import { LoadingState } from '@/components/uno/LoadingSpinner';
import { EmptyState } from '@/components/uno/EmptyState';

export default function Bookings() {
  const { t, language } = useLanguage();
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
        <LoadingState />
      </AppLayout>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <AppLayout>
      <PullToRefresh onRefresh={handleRefresh} className="h-[calc(100vh-8rem)]">
        <PageContainer key={refreshKey}>
          <PageHeader title={t('nav.bookings')} />
          
          <EmptyState
            icon={Calendar}
            title={language === 'ru' ? 'Нет бронирований' : 'No bookings yet'}
            description={language === 'ru' 
              ? 'Начните изучать услуги, чтобы сделать первое бронирование'
              : 'Start exploring services to make your first booking'}
            action={
              <PremiumButton onClick={() => navigate('/discover')}>
                {t('nav.discover')}
              </PremiumButton>
            }
          />
        </PageContainer>
      </PullToRefresh>
    </AppLayout>
  );
}
