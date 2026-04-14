import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useLanguage } from '@/contexts/LanguageContext';
import { useInvestmentInterest } from '@/hooks/useInvestmentInterest';
import { FileText, ChevronRight, TrendingUp } from 'lucide-react';

const STATUS_BADGES: Record<string, { en: string; ru: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  pending: { en: 'Pending', ru: 'На рассмотрении', variant: 'secondary' },
  contacted: { en: 'Contacted', ru: 'Связались', variant: 'default' },
  qualified: { en: 'Qualified', ru: 'Квалифицирован', variant: 'default' },
  negotiation: { en: 'Negotiation', ru: 'Переговоры', variant: 'default' },
  closed: { en: 'Closed', ru: 'Закрыто', variant: 'outline' },
  rejected: { en: 'Rejected', ru: 'Отклонено', variant: 'destructive' },
};

export function InvestorInterestsList() {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const isRu = language === 'ru';

  const { userInterestsWithProjects, loadingInterestsWithProjects } = useInvestmentInterest();

  if (loadingInterestsWithProjects) {
    return (
      <Card className="p-6 space-y-3">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-16 w-full" />
      </Card>
    );
  }

  const interests = userInterestsWithProjects || [];

  return (
    <Card className="p-6">
      <h3 className="font-medium mb-3 flex items-center gap-2">
        <FileText className="h-4 w-4 text-primary" />
        {isRu ? 'Мои заявки' : 'My Applications'}
        {interests.length > 0 && (
          <Badge variant="secondary" className="text-xs">{interests.length}</Badge>
        )}
      </h3>

      {interests.length === 0 ? (
        <div className="text-center py-4">
          <p className="text-sm text-muted-foreground mb-3">
            {isRu ? 'У вас пока нет активных заявок' : 'No active applications yet'}
          </p>
          <Button variant="outline" size="sm" onClick={() => navigate('/invest')}>
            {isRu ? 'Смотреть проекты' : 'Browse Projects'}
          </Button>
        </div>
      ) : (
        <div className="space-y-2">
          {interests.map((interest) => {
            const project = interest.project;
            const title = project
              ? (isRu ? project.title_ru : project.title_en) || project.title_en
              : isRu ? 'Проект' : 'Project';
            const statusConfig = STATUS_BADGES[interest.status] || STATUS_BADGES.pending;

            return (
              <CardContent
                key={interest.id}
                className="p-3 rounded-lg border bg-muted/30 cursor-pointer hover:bg-muted/50 transition-colors flex items-center gap-3"
                onClick={() => project && navigate(`/invest/${project.id}`)}
              >
                {project?.cover_image ? (
                  <img src={project.cover_image} alt="" className="w-12 h-12 rounded-lg object-cover shrink-0" />
                ) : (
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <TrendingUp className="h-5 w-5 text-primary" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{title}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    {project?.roi_projected && (
                      <span className="text-xs text-muted-foreground">
                        ROI: {project.roi_projected}%
                      </span>
                    )}
                    {project?.district && (
                      <span className="text-xs text-muted-foreground">• {project.district}</span>
                    )}
                  </div>
                </div>
                <Badge variant={statusConfig.variant} className="text-[10px] shrink-0">
                  {isRu ? statusConfig.ru : statusConfig.en}
                </Badge>
                <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
              </CardContent>
            );
          })}
        </div>
      )}
    </Card>
  );
}
