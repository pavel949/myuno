import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useInvestmentInterest } from '@/hooks/useInvestmentInterest';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { TrendingUp, FileText, DollarSign, BarChart3 } from 'lucide-react';

export function InvestorWelcomeCard() {
  const { user } = useAuth();
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const { userInterestsWithProjects, loadingInterests } = useInvestmentInterest();

  // Calculate stats
  const activeInterests = userInterestsWithProjects?.filter(
    (i) => !['completed', 'cancelled'].includes(i.status)
  ) || [];
  
  const totalAmount = userInterestsWithProjects?.reduce(
    (sum, i) => sum + (i.preferred_amount || 0), 0
  ) || 0;

  const projectsWithRoi = userInterestsWithProjects?.filter(
    (i) => i.project?.roi_projected
  ) || [];
  
  const avgRoi = projectsWithRoi.length > 0
    ? Math.round(projectsWithRoi.reduce((sum, i) => sum + (i.project?.roi_projected || 0), 0) / projectsWithRoi.length)
    : 0;

  // Get user's display name
  const displayName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Investor';

  if (loadingInterests) {
    return (
      <Card className="bg-gradient-to-br from-emerald-600 to-teal-700 text-white border-0">
        <CardContent className="p-6 space-y-4">
          <Skeleton className="h-7 w-48 bg-white/20" />
          <Skeleton className="h-5 w-full bg-white/20" />
          <div className="flex gap-4">
            <Skeleton className="h-16 flex-1 bg-white/20" />
            <Skeleton className="h-16 flex-1 bg-white/20" />
            <Skeleton className="h-16 flex-1 bg-white/20" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gradient-to-br from-emerald-600 to-teal-700 text-white border-0 overflow-hidden relative">
      {/* Decorative circles */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2" />
      
      <CardContent className="relative z-10 p-6 space-y-4">
        {/* Welcome */}
        <div className="flex items-center gap-2">
          <span className="text-2xl">👋</span>
          <h2 className="text-xl font-bold">
            {isRu ? `Добро пожаловать, ${displayName}` : `Welcome back, ${displayName}`}
          </h2>
        </div>
        
        <p className="text-white/90 text-sm">
          {isRu 
            ? 'Управляйте своими инвестиционными интересами и следите за статусами заявок'
            : 'Manage your investment interests and track application statuses'
          }
        </p>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-3 pt-2">
          <div className="bg-white/15 backdrop-blur rounded-xl p-3 text-center">
            <FileText className="h-5 w-5 mx-auto mb-1 opacity-90" />
            <div className="text-2xl font-bold">{activeInterests.length}</div>
            <div className="text-xs text-white/80">
              {isRu ? 'Активных' : 'Active'}
            </div>
          </div>
          
          <div className="bg-white/15 backdrop-blur rounded-xl p-3 text-center">
            <DollarSign className="h-5 w-5 mx-auto mb-1 opacity-90" />
            <div className="text-2xl font-bold">
              {totalAmount >= 1000000 
                ? `$${(totalAmount / 1000000).toFixed(1)}M`
                : totalAmount >= 1000 
                  ? `$${(totalAmount / 1000).toFixed(0)}K`
                  : `$${totalAmount}`
              }
            </div>
            <div className="text-xs text-white/80">
              {isRu ? 'Интерес' : 'Interest'}
            </div>
          </div>
          
          <div className="bg-white/15 backdrop-blur rounded-xl p-3 text-center">
            <BarChart3 className="h-5 w-5 mx-auto mb-1 opacity-90" />
            <div className="text-2xl font-bold">{avgRoi}%</div>
            <div className="text-xs text-white/80">
              {isRu ? 'Avg ROI' : 'Avg ROI'}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
