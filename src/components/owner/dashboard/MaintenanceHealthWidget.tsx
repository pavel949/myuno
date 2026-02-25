import { useMaintenanceSchedules } from '@/hooks/useMaintenanceSchedules';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent } from '@/components/ui/card';
import { ShieldCheck, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { isPast, parseISO, differenceInDays, format } from 'date-fns';
import { getTemplateByCategory, type MaintenanceCategory } from '@/config/maintenanceScheduleTemplates';
import { cn } from '@/lib/utils';

export function MaintenanceHealthWidget() {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const navigate = useNavigate();
  const { data: schedules = [], isLoading } = useMaintenanceSchedules();

  if (isLoading || schedules.length === 0) return null;

  const overdueCount = schedules.filter(s => isPast(parseISO(s.next_due_date))).length;
  const upcoming = schedules
    .filter(s => !isPast(parseISO(s.next_due_date)))
    .slice(0, 3);

  const healthScore = Math.round(((schedules.length - overdueCount) / schedules.length) * 100);

  return (
    <Card
      variant="interactive"
      className="cursor-pointer"
      onClick={() => navigate('/owner/maintenance-plan')}
    >
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <ShieldCheck className={cn(
              "h-5 w-5",
              healthScore >= 80 ? "text-success" : healthScore >= 50 ? "text-warning" : "text-destructive"
            )} />
            <h3 className="font-semibold text-sm">
              {isRu ? 'Обслуживание' : 'Maintenance'}
            </h3>
          </div>
          <div className="flex items-center gap-1">
            <span className={cn(
              "text-lg font-bold",
              healthScore >= 80 ? "text-success" : healthScore >= 50 ? "text-warning" : "text-destructive"
            )}>
              {healthScore}%
            </span>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </div>
        </div>

        {overdueCount > 0 && (
          <p className="text-xs text-destructive font-medium mb-2">
            {overdueCount} {isRu ? 'просрочено' : 'overdue'}
          </p>
        )}

        {upcoming.length > 0 && (
          <div className="space-y-1.5">
            {upcoming.map(s => {
              const template = getTemplateByCategory(s.category as MaintenanceCategory);
              const Icon = template?.icon;
              const days = differenceInDays(parseISO(s.next_due_date), new Date());
              return (
                <div key={s.id} className="flex items-center gap-2 text-xs">
                  {Icon && <Icon className={cn("h-3.5 w-3.5", template?.color)} />}
                  <span className="truncate flex-1">
                    {isRu ? (s.title_ru || s.title) : s.title}
                  </span>
                  <span className="text-muted-foreground shrink-0">
                    {days}d
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
