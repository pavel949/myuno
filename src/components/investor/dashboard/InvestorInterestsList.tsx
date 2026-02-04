import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useInvestmentInterest } from '@/hooks/useInvestmentInterest';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { InvestorInterestCard } from './InvestorInterestCard';
import { FileText, Plus, ArrowRight } from 'lucide-react';

export function InvestorInterestsList() {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const { userInterestsWithProjects, loadingInterests } = useInvestmentInterest();

  if (loadingInterests) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
        </CardHeader>
        <CardContent className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  const hasInterests = userInterestsWithProjects && userInterestsWithProjects.length > 0;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <FileText className="h-5 w-5 text-primary" />
          {isRu ? 'Мои заявки' : 'My Applications'}
        </CardTitle>
        {hasInterests && (
          <span className="text-sm text-muted-foreground">
            {userInterestsWithProjects.length} {isRu ? 'заявок' : 'applications'}
          </span>
        )}
      </CardHeader>
      <CardContent className="space-y-3">
        {hasInterests ? (
          <>
            {userInterestsWithProjects.slice(0, 5).map((interest) => (
              <InvestorInterestCard key={interest.id} interest={interest} />
            ))}
            
            {userInterestsWithProjects.length > 5 && (
              <Button
                variant="outline"
                className="w-full"
                onClick={() => {/* Could navigate to full list */}}
              >
                {isRu ? 'Показать все' : 'Show All'}
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            )}
          </>
        ) : (
          <div className="text-center py-8 space-y-4">
            <div className="w-16 h-16 mx-auto rounded-full bg-muted flex items-center justify-center">
              <FileText className="h-8 w-8 text-muted-foreground" />
            </div>
            <div>
              <p className="font-medium">
                {isRu ? 'Нет активных заявок' : 'No active applications'}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                {isRu 
                  ? 'Изучите наши инвестиционные возможности'
                  : 'Explore our investment opportunities'
                }
              </p>
            </div>
            <Button onClick={() => navigate('/invest')} className="gap-2">
              <Plus className="h-4 w-4" />
              {isRu ? 'Найти проект' : 'Find Project'}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
