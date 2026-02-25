import React from 'react';
import { Navigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { MiniAppLayout } from '@/components/miniapp';
import {
  InvestorWelcomeCard,
  InvestorQuickActions,
  InvestorInterestsList,
  InvestorRecommendations,
} from '@/components/investor/dashboard';
import { LoadingState } from '@/components/uno/LoadingSpinner';
import { YourDayFeed } from '@/components/shared/YourDayFeed';

export default function InvestorDashboard() {
  const { user, isLoading } = useAuth();
  const { language } = useLanguage();
  const isRu = language === 'ru';

  // Show loading while checking auth
  if (isLoading) {
    return <LoadingState />;
  }

  // Redirect to auth if not logged in
  if (!user) {
    return <Navigate to="/auth?redirect=/property/invest/dashboard" replace />;
  }

  return (
    <>
      <Helmet>
        <title>{isRu ? 'Мои инвестиции | myUNO' : 'My Investments | myUNO'}</title>
        <meta 
          name="description" 
          content={isRu 
            ? 'Управляйте своими инвестиционными заявками и отслеживайте статусы'
            : 'Manage your investment applications and track statuses'
          } 
        />
      </Helmet>

      <MiniAppLayout
        title={isRu ? 'Мои инвестиции' : 'My Investments'}
        showSearch={false}
        fallbackPath="/invest"
      >
        <div className="space-y-6">
          {/* Your Day Feed */}
          <YourDayFeed role="investor" compact />

          {/* Welcome Card with Stats */}
          <InvestorWelcomeCard />
          
          {/* Quick Actions */}
          <InvestorQuickActions />
          
          {/* My Applications List */}
          <InvestorInterestsList />
          
          {/* Recommendations Carousel */}
          <InvestorRecommendations />
        </div>
      </MiniAppLayout>
    </>
  );
}
