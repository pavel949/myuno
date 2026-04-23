import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useLanguage } from '@/contexts/LanguageContext';
import { useInvestmentProjects } from '@/hooks/useInvestmentProjects';
import { Sparkles, TrendingUp, ChevronRight, MapPin } from 'lucide-react';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';

export function InvestorRecommendations() {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const isRu = language === 'ru';

  const { data: projects, isLoading } = useInvestmentProjects({ isFeatured: true });

  if (isLoading) {
    return (
      <Card className="p-6 space-y-3">
        <Skeleton className="h-5 w-40" />
        <div className="flex gap-3">
          <Skeleton className="h-36 w-56 rounded-none shrink-0" />
          <Skeleton className="h-36 w-56 rounded-none shrink-0" />
        </div>
      </Card>
    );
  }

  const recommended = (projects || []).slice(0, 6);

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-medium flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          {isRu ? 'Рекомендации' : 'Recommendations'}
        </h3>
        {recommended.length > 0 && (
          <Button variant="ghost" size="sm" className="text-xs gap-1 h-7" onClick={() => navigate('/invest')}>
            {isRu ? 'Все проекты' : 'All Projects'}
            <ChevronRight className="h-3 w-3" />
          </Button>
        )}
      </div>

      {recommended.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          {isRu ? 'Проекты, которые могут вас заинтересовать' : 'Projects you might be interested in'}
        </p>
      ) : (
        <ScrollArea className="w-full">
          <div className="flex gap-3 pb-2">
            {recommended.map((project) => {
              const title = (isRu ? project.title_ru : project.title_en) || project.title_en;
              return (
                <CardContent
                  key={project.id}
                  className="p-0 shrink-0 w-56 rounded-none border overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => navigate(`/invest/${project.id}`)}
                >
                  {project.cover_image ? (
                    <img src={project.cover_image} alt="" className="w-full h-24 object-cover" />
                  ) : (
                    <div className="w-full h-24 bg-primary/5 flex items-center justify-center">
                      <TrendingUp className="h-8 w-8 text-primary/30" />
                    </div>
                  )}
                  <div className="p-3 space-y-1.5">
                    <p className="text-sm font-medium truncate">{title}</p>
                    <div className="flex items-center gap-2 flex-wrap">
                      {project.roi_projected && (
                        <Badge variant="secondary" className="text-[10px]">
                          ROI {project.roi_projected}%
                        </Badge>
                      )}
                      {project.is_hot && (
                        <Badge variant="destructive" className="text-[10px]">
                          HOT
                        </Badge>
                      )}
                    </div>
                    {project.district && (
                      <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {project.district}
                      </p>
                    )}
                  </div>
                </CardContent>
              );
            })}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      )}
    </Card>
  );
}
