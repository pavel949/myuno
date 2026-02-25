import { useState, useMemo } from 'react';
import { useMaintenanceSchedules } from '@/hooks/useMaintenanceSchedules';
import { useOwnerProperties } from '@/hooks/usePropertyCare';
import { useLanguage } from '@/contexts/LanguageContext';
import { ScheduleCard } from '@/components/owner/maintenance/ScheduleCard';
import { AddScheduleDialog } from '@/components/owner/maintenance/AddScheduleDialog';
import { Button } from '@/components/ui/button';
import { Plus, ShieldCheck } from 'lucide-react';
import { isPast, parseISO, differenceInDays } from 'date-fns';

export default function MaintenancePlan() {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const [showAdd, setShowAdd] = useState(false);

  const { data: schedules = [], isLoading, addSchedule, markCompleted, deleteSchedule } = useMaintenanceSchedules();
  const { data: properties = [] } = useOwnerProperties();

  const { overdue, upcoming, onTrack } = useMemo(() => {
    const now = new Date();
    const _overdue: typeof schedules = [];
    const _upcoming: typeof schedules = [];
    const _onTrack: typeof schedules = [];

    for (const s of schedules) {
      const due = parseISO(s.next_due_date);
      if (isPast(due)) _overdue.push(s);
      else if (differenceInDays(due, now) <= 30) _upcoming.push(s);
      else _onTrack.push(s);
    }
    return { overdue: _overdue, upcoming: _upcoming, onTrack: _onTrack };
  }, [schedules]);

  const healthScore = schedules.length > 0
    ? Math.round(((schedules.length - overdue.length) / schedules.length) * 100)
    : 100;

  const propList = (properties as any[]).map((p: any) => ({ id: p.id, title: p.title }));

  return (
    <div className="space-y-6 pb-24">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">{isRu ? 'План обслуживания' : 'Maintenance Plan'}</h1>
          <p className="text-sm text-muted-foreground">
            {isRu ? 'Плановое обслуживание ваших объектов' : 'Preventive maintenance for your properties'}
          </p>
        </div>
        <Button size="sm" onClick={() => setShowAdd(true)}>
          <Plus className="h-4 w-4 mr-1" />
          {isRu ? 'Добавить' : 'Add'}
        </Button>
      </div>

      {/* Health Score */}
      <div className="flex items-center gap-3 p-4 rounded-2xl bg-muted/30">
        <div className={`rounded-full w-12 h-12 flex items-center justify-center ${healthScore >= 80 ? 'bg-success/10' : healthScore >= 50 ? 'bg-warning/10' : 'bg-destructive/10'}`}>
          <ShieldCheck className={`h-6 w-6 ${healthScore >= 80 ? 'text-success' : healthScore >= 50 ? 'text-warning' : 'text-destructive'}`} />
        </div>
        <div>
          <p className="text-2xl font-bold">{healthScore}%</p>
          <p className="text-xs text-muted-foreground">
            {isRu ? 'Показатель обслуживания' : 'Maintenance Health Score'}
          </p>
        </div>
        <div className="ml-auto text-right text-xs text-muted-foreground">
          <p>{schedules.length} {isRu ? 'всего' : 'total'}</p>
          {overdue.length > 0 && <p className="text-destructive font-medium">{overdue.length} {isRu ? 'просрочено' : 'overdue'}</p>}
        </div>
      </div>

      {isLoading && <p className="text-sm text-muted-foreground">{isRu ? 'Загрузка...' : 'Loading...'}</p>}

      {/* Overdue */}
      {overdue.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-destructive mb-2">
            {isRu ? `Просрочено (${overdue.length})` : `Overdue (${overdue.length})`}
          </h2>
          <div className="space-y-2">
            {overdue.map(s => (
              <ScheduleCard
                key={s.id}
                schedule={s}
                isRu={isRu}
                onComplete={(id) => markCompleted.mutate(id)}
                onDelete={(id) => deleteSchedule.mutate(id)}
                isPending={markCompleted.isPending || deleteSchedule.isPending}
              />
            ))}
          </div>
        </section>
      )}

      {/* Upcoming */}
      {upcoming.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold mb-2">
            {isRu ? `Ближайшие 30 дней (${upcoming.length})` : `Upcoming 30 days (${upcoming.length})`}
          </h2>
          <div className="space-y-2">
            {upcoming.map(s => (
              <ScheduleCard
                key={s.id}
                schedule={s}
                isRu={isRu}
                onComplete={(id) => markCompleted.mutate(id)}
                onDelete={(id) => deleteSchedule.mutate(id)}
                isPending={markCompleted.isPending || deleteSchedule.isPending}
              />
            ))}
          </div>
        </section>
      )}

      {/* On Track */}
      {onTrack.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold mb-2">
            {isRu ? `По графику (${onTrack.length})` : `On Track (${onTrack.length})`}
          </h2>
          <div className="space-y-2">
            {onTrack.map(s => (
              <ScheduleCard
                key={s.id}
                schedule={s}
                isRu={isRu}
                onComplete={(id) => markCompleted.mutate(id)}
                onDelete={(id) => deleteSchedule.mutate(id)}
                isPending={markCompleted.isPending || deleteSchedule.isPending}
              />
            ))}
          </div>
        </section>
      )}

      {/* Empty state */}
      {!isLoading && schedules.length === 0 && (
        <div className="text-center py-12">
          <ShieldCheck className="h-12 w-12 text-muted-foreground/40 mx-auto mb-3" />
          <p className="font-medium">{isRu ? 'Нет расписаний' : 'No schedules yet'}</p>
          <p className="text-sm text-muted-foreground mb-4">
            {isRu ? 'Добавьте плановое обслуживание для ваших объектов' : 'Add preventive maintenance schedules for your properties'}
          </p>
          <Button variant="outline" onClick={() => setShowAdd(true)}>
            <Plus className="h-4 w-4 mr-1" />
            {isRu ? 'Добавить первое' : 'Add first schedule'}
          </Button>
        </div>
      )}

      <AddScheduleDialog
        open={showAdd}
        onOpenChange={setShowAdd}
        properties={propList}
        isRu={isRu}
        onAdd={(data) => addSchedule.mutate(data)}
        isPending={addSchedule.isPending}
      />
    </div>
  );
}
