import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useFeaturedInvestments } from '@/hooks/useInvestmentProjects';
import { InvestmentCard } from '@/components/invest';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Sparkles, ArrowRight } from 'lucide-react';

export function InvestorRecommendations() {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const { data: featured, isLoading } = useFeaturedInvestments();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 overflow-x-auto pb-2">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-[200px] w-[260px] flex-shrink-0 rounded-xl" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!featured?.length) {
    return null;
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-amber-500" />
          {isRu ? 'Рекомендуемые проекты' : 'Recommended Projects'}
        </CardTitle>
        <Button 
          variant="ghost" 
          size="sm"
          onClick={() => navigate('/invest')}
          className="text-primary"
        >
          {isRu ? 'Все' : 'All'}
          <ArrowRight className="h-4 w-4 ml-1" />
        </Button>
      </CardHeader>
      <CardContent className="pb-4">
        <ScrollArea className="w-full whitespace-nowrap">
          <div className="flex gap-4 pb-2">
            {featured.slice(0, 6).map((project) => (
              <InvestmentCard 
                key={project.id} 
                project={project} 
                variant="compact"
              />
            ))}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
