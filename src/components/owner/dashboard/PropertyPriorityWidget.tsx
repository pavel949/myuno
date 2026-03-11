import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useMyProperties } from '@/hooks/useMyProperties';
import { useCrmTasks } from '@/hooks/useCrmTasks';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import {
  AlertTriangle, ChevronRight, LogIn, LogOut, Sparkles,
  ClipboardCheck, Flame,
} from 'lucide-react';
import { isPast, isToday, format } from 'date-fns';
import { APP_ROUTES } from '@/lib/config/routes';

interface PropertyPriority {
  propertyId: string;
  title: string;
  urgencyScore: number;
  checkIns: number;
  checkOuts: number;
  overdueTasks: number;
  pendingTasks: number;
}

export function PropertyPriorityWidget() {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const isRu = language === 'ru';
  const { allProperties, isLoading: propsLoading } = useMyProperties();
  const { data: tasks, isLoading: tasksLoading } = useCrmTasks({ status: 'pending' });

  const propertyIds = useMemo(() => allProperties.map(p => p.property_id), [allProperties]);
  const todayStr = format(new Date(), 'yyyy-MM-dd');

  // Fetch today's bookings directly
  const { data: bookings, isLoading: bookingsLoading } = useQuery({
    queryKey: ['property-priority-bookings', propertyIds.join(','), todayStr],
    queryFn: async () => {
      if (!propertyIds.length) return [];
      const { data } = await supabase
        .from('property_bookings')
        .select('id, property_id, check_in, check_out, status')
        .in('property_id', propertyIds)
        .in('status', ['confirmed', 'checked_in'])
        .or(`check_in.eq.${todayStr},check_out.eq.${todayStr}`);
      return data || [];
    },
    enabled: propertyIds.length > 0,
    staleTime: 60000,
  });

  const priorities = useMemo<PropertyPriority[]>(() => {
    if (!allProperties.length) return [];

    const map = new Map<string, PropertyPriority>();
    allProperties.forEach((p) => {
      map.set(p.property_id, {
        propertyId: p.property_id,
        title: isRu ? p.title_ru : p.title,
        urgencyScore: 0,
        checkIns: 0,
        checkOuts: 0,
        overdueTasks: 0,
        pendingTasks: 0,
      });
    });

    // Count bookings
    (bookings || []).forEach((b: any) => {
      const entry = map.get(b.property_id);
      if (!entry) return;
      const ciDate = b.check_in?.split('T')[0];
      const coDate = b.check_out?.split('T')[0];
      if (ciDate === todayStr) entry.checkIns++;
      if (coDate === todayStr) entry.checkOuts++;
    });

    // Count tasks per property
    (tasks || []).forEach((t) => {
      if (!t.property_id || !map.has(t.property_id)) return;
      const entry = map.get(t.property_id)!;
      if (t.due_date && isPast(new Date(t.due_date)) && !isToday(new Date(t.due_date))) {
        entry.overdueTasks++;
      } else {
        entry.pendingTasks++;
      }
    });

    // Calculate urgency score
    map.forEach((entry) => {
      entry.urgencyScore =
        entry.overdueTasks * 10 +
        entry.checkIns * 5 +
        entry.checkOuts * 4 +
        entry.pendingTasks * 1;
    });

    return Array.from(map.values())
      .filter((p) => p.urgencyScore > 0)
      .sort((a, b) => b.urgencyScore - a.urgencyScore)
      .slice(0, 8);
  }, [allProperties, bookings, tasks, isRu, todayStr]);

  const isLoading = propsLoading || tasksLoading || bookingsLoading;

  if (isLoading) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-16 w-full rounded-xl" />
        <Skeleton className="h-16 w-full rounded-xl" />
      </div>
    );
  }

  if (priorities.length === 0) return null;

  return (
    <section className="space-y-2">
      <h3 className="font-semibold text-[15px] flex items-center gap-2 px-1">
        <Flame className="h-4 w-4 text-destructive" />
        {isRu ? 'Приоритеты по объектам' : 'Property Priorities'}
      </h3>
      <div className="space-y-1.5">
        {priorities.map((p) => (
          <Card
            key={p.propertyId}
            variant="interactive"
            className={cn(
              'cursor-pointer',
              p.overdueTasks > 0 && 'border-l-4 border-l-destructive'
            )}
            onClick={() => navigate(`${APP_ROUTES.MC_PROPERTIES}/${p.propertyId}/manage`)}
          >
            <CardContent className="p-3 flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{p.title}</p>
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {p.overdueTasks > 0 && (
                    <Badge variant="destructive" className="text-[10px] gap-0.5 px-1.5 py-0">
                      <AlertTriangle className="h-2.5 w-2.5" />
                      {p.overdueTasks} {isRu ? 'просроч.' : 'overdue'}
                    </Badge>
                  )}
                  {p.checkIns > 0 && (
                    <Badge variant="outline" className="text-[10px] gap-0.5 px-1.5 py-0 text-success border-success/30">
                      <LogIn className="h-2.5 w-2.5" />
                      {p.checkIns} {isRu ? 'заезд' : 'check-in'}
                    </Badge>
                  )}
                  {p.checkOuts > 0 && (
                    <Badge variant="outline" className="text-[10px] gap-0.5 px-1.5 py-0 text-warning border-warning/30">
                      <LogOut className="h-2.5 w-2.5" />
                      {p.checkOuts} {isRu ? 'выезд' : 'check-out'}
                    </Badge>
                  )}
                  {p.pendingTasks > 0 && (
                    <Badge variant="outline" className="text-[10px] gap-0.5 px-1.5 py-0">
                      <ClipboardCheck className="h-2.5 w-2.5" />
                      {p.pendingTasks} {isRu ? 'задач' : 'tasks'}
                    </Badge>
                  )}
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground/50 shrink-0" />
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
