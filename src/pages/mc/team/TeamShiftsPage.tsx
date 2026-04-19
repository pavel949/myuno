/**
 * MC Team Shifts page — schedule and track shifts/timesheets for staff.
 * Route: /mc/team/shifts
 */
import React, { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import {
  useCompanyShifts, useMyShifts, useCreateShift, useClockIn, useClockOut, useCompanyTimesheets,
} from '@/hooks/useTeamShifts';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { LoadingSpinner } from '@/components/uno/LoadingSpinner';
import { CalendarClock, Plus, Play, Square, Clock } from 'lucide-react';
import { format, startOfWeek, endOfWeek, addDays } from 'date-fns';
import { ru } from 'date-fns/locale';
import { cn } from '@/lib/utils';

export default function TeamShiftsPage() {
  const { language } = useLanguage();
  const { user } = useAuth();
  const isRu = language === 'ru';
  const [tab, setTab] = useState<'schedule' | 'mine' | 'timesheets'>('schedule');
  const [creating, setCreating] = useState(false);

  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
  const weekEnd = endOfWeek(new Date(), { weekStartsOn: 1 });

  const { data: shifts = [], isLoading: l1 } = useCompanyShifts({
    from: weekStart.toISOString(), to: weekEnd.toISOString(),
  });
  const { data: myShifts = [], isLoading: l2 } = useMyShifts();
  const { data: timesheets = [], isLoading: l3 } = useCompanyTimesheets();
  const clockIn = useClockIn();
  const clockOut = useClockOut();

  if (l1 || l2 || l3) return <div className="flex items-center justify-center min-h-[60vh]"><LoadingSpinner size="lg" /></div>;

  const openTimesheet = timesheets.find(t => t.user_id === user?.id && !t.clock_out_at);

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto space-y-6 pb-24">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <CalendarClock className="w-5 h-5 text-primary" />
            <h1 className="text-xl md:text-2xl font-bold">{isRu ? 'Смены и табель' : 'Shifts & Timesheets'}</h1>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            {isRu ? 'Планирование смен и учёт рабочего времени персонала.' : 'Plan shifts and track staff time.'}
          </p>
        </div>
        <Sheet open={creating} onOpenChange={setCreating}>
          <SheetTrigger asChild>
            <Button size="sm"><Plus className="w-4 h-4 mr-1.5" />{isRu ? 'Смена' : 'Shift'}</Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
            <SheetHeader><SheetTitle>{isRu ? 'Запланировать смену' : 'Schedule shift'}</SheetTitle></SheetHeader>
            <CreateShiftForm onClose={() => setCreating(false)} />
          </SheetContent>
        </Sheet>
      </div>

      {/* Quick clock in/out */}
      <Card className="border-primary/30 bg-primary/5">
        <CardContent className="p-4 flex items-center gap-3">
          <Clock className="w-5 h-5 text-primary" />
          <div className="flex-1">
            <p className="text-sm font-medium">
              {openTimesheet
                ? (isRu ? `На смене с ${format(new Date(openTimesheet.clock_in_at), 'HH:mm')}` : `On shift since ${format(new Date(openTimesheet.clock_in_at), 'HH:mm')}`)
                : (isRu ? 'Не на смене' : 'Not clocked in')}
            </p>
          </div>
          {openTimesheet ? (
            <Button size="sm" variant="destructive"
              onClick={() => clockOut.mutate({ timesheet_id: openTimesheet.id, shift_id: openTimesheet.shift_id ?? undefined })}
              disabled={clockOut.isPending}>
              <Square className="w-3.5 h-3.5 mr-1.5" />{isRu ? 'Завершить' : 'Clock out'}
            </Button>
          ) : (
            <Button size="sm"
              onClick={() => clockIn.mutate({})}
              disabled={clockIn.isPending}>
              <Play className="w-3.5 h-3.5 mr-1.5" />{isRu ? 'Начать' : 'Clock in'}
            </Button>
          )}
        </CardContent>
      </Card>

      <Tabs value={tab} onValueChange={(v) => setTab(v as any)}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="schedule">{isRu ? 'Неделя' : 'Week'}</TabsTrigger>
          <TabsTrigger value="mine">{isRu ? 'Мои' : 'Mine'}</TabsTrigger>
          <TabsTrigger value="timesheets">{isRu ? 'Табель' : 'Timesheets'}</TabsTrigger>
        </TabsList>

        <TabsContent value="schedule" className="space-y-3 mt-4">
          {Array.from({ length: 7 }).map((_, i) => {
            const day = addDays(weekStart, i);
            const dayShifts = shifts.filter(s => format(new Date(s.start_at), 'yyyy-MM-dd') === format(day, 'yyyy-MM-dd'));
            return (
              <Card key={i}>
                <CardContent className="p-3">
                  <p className="text-xs font-semibold uppercase text-muted-foreground mb-2">
                    {format(day, 'EEE d MMM', { locale: isRu ? ru : undefined })}
                  </p>
                  {dayShifts.length === 0 ? (
                    <p className="text-xs text-muted-foreground italic">{isRu ? 'Нет смен' : 'No shifts'}</p>
                  ) : dayShifts.map(s => <ShiftRow key={s.id} shift={s} isRu={isRu} />)}
                </CardContent>
              </Card>
            );
          })}
        </TabsContent>

        <TabsContent value="mine" className="space-y-2 mt-4">
          {myShifts.length === 0 ? (
            <Card className="border-dashed"><CardContent className="py-12 text-center text-sm text-muted-foreground">
              {isRu ? 'Нет назначенных смен.' : 'No assigned shifts.'}
            </CardContent></Card>
          ) : myShifts.map(s => (
            <Card key={s.id}><CardContent className="p-3"><ShiftRow shift={s} isRu={isRu} /></CardContent></Card>
          ))}
        </TabsContent>

        <TabsContent value="timesheets" className="space-y-2 mt-4">
          {timesheets.length === 0 ? (
            <Card className="border-dashed"><CardContent className="py-12 text-center text-sm text-muted-foreground">
              {isRu ? 'Записей пока нет.' : 'No records yet.'}
            </CardContent></Card>
          ) : timesheets.slice(0, 50).map(t => (
            <Card key={t.id}><CardContent className="p-3 flex items-center gap-3">
              <Clock className="w-4 h-4 text-muted-foreground" />
              <div className="flex-1 min-w-0 text-sm">
                <p className="font-medium">
                  {format(new Date(t.clock_in_at), 'd MMM HH:mm', { locale: isRu ? ru : undefined })}
                  {t.clock_out_at && ` → ${format(new Date(t.clock_out_at), 'HH:mm')}`}
                </p>
                {t.duration_minutes != null && (
                  <p className="text-xs text-muted-foreground">
                    {Math.floor(t.duration_minutes / 60)}h {t.duration_minutes % 60}m
                  </p>
                )}
              </div>
              {!t.clock_out_at && <Badge variant="outline" className="bg-success/15 text-success text-xs">{isRu ? 'Активно' : 'Active'}</Badge>}
            </CardContent></Card>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function ShiftRow({ shift, isRu }: { shift: any; isRu: boolean }) {
  const cfgMap: Record<string, { ru: string; en: string; cls: string }> = {
    scheduled: { ru: 'Запланировано', en: 'Scheduled', cls: 'bg-muted text-muted-foreground' },
    in_progress: { ru: 'В работе', en: 'In progress', cls: 'bg-primary/15 text-primary' },
    completed: { ru: 'Завершено', en: 'Completed', cls: 'bg-success/15 text-success' },
    cancelled: { ru: 'Отменено', en: 'Cancelled', cls: 'bg-destructive/15 text-destructive' },
    missed: { ru: 'Пропущено', en: 'Missed', cls: 'bg-warning/15 text-warning' },
  };
  const cfg = cfgMap[shift.status];
  return (
    <div className="flex items-center gap-3 py-1.5">
      <Badge variant="outline" className={cn('text-xs', cfg.cls)}>{isRu ? cfg.ru : cfg.en}</Badge>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium">
          {format(new Date(shift.start_at), 'HH:mm')} – {format(new Date(shift.end_at), 'HH:mm')}
          {shift.role_label && ` · ${shift.role_label}`}
        </p>
        {shift.notes && <p className="text-xs text-muted-foreground truncate">{shift.notes}</p>}
      </div>
    </div>
  );
}

function CreateShiftForm({ onClose }: { onClose: () => void }) {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const create = useCreateShift();
  const [assignee, setAssignee] = useState('');
  const [startAt, setStartAt] = useState('');
  const [endAt, setEndAt] = useState('');
  const [roleLabel, setRoleLabel] = useState('');
  const [notes, setNotes] = useState('');

  return (
    <form className="space-y-4 mt-4" onSubmit={async (e) => {
      e.preventDefault();
      await create.mutateAsync({
        assignee_user_id: assignee, start_at: startAt, end_at: endAt,
        role_label: roleLabel || undefined, notes: notes || undefined,
      });
      onClose();
    }}>
      <div className="space-y-1.5">
        <Label>{isRu ? 'ID сотрудника' : 'Assignee user ID'}</Label>
        <Input value={assignee} onChange={(e) => setAssignee(e.target.value)} required placeholder="uuid…" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>{isRu ? 'Начало' : 'Start'}</Label>
          <Input type="datetime-local" value={startAt} onChange={(e) => setStartAt(e.target.value)} required />
        </div>
        <div className="space-y-1.5">
          <Label>{isRu ? 'Конец' : 'End'}</Label>
          <Input type="datetime-local" value={endAt} onChange={(e) => setEndAt(e.target.value)} required />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label>{isRu ? 'Роль' : 'Role label'}</Label>
        <Input value={roleLabel} onChange={(e) => setRoleLabel(e.target.value)} placeholder={isRu ? 'Уборка / Тех. поддержка' : 'Cleaner / Maintenance'} />
      </div>
      <div className="space-y-1.5">
        <Label>{isRu ? 'Заметки' : 'Notes'}</Label>
        <Input value={notes} onChange={(e) => setNotes(e.target.value)} />
      </div>
      <Button type="submit" className="w-full" disabled={create.isPending}>
        {create.isPending ? (isRu ? 'Создание…' : 'Creating…') : (isRu ? 'Запланировать' : 'Schedule')}
      </Button>
    </form>
  );
}
