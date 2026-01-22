import { useState } from 'react';
import { PageContainer } from '@/components/uno/PageContainer';
import { PageHeader } from '@/components/uno/PageHeader';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useOperationalTasks, OperationalTask } from '@/hooks/useOperationalTasks';
import { useOwnerProperties } from '@/hooks/usePropertyCare';
import { PropertyThumbnailSelector } from '@/components/owner/PropertyThumbnailSelector';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { CreateServiceTaskDialog } from '@/components/owner/CreateServiceTaskDialog';
import { format, isToday, isTomorrow, addDays, isBefore, startOfDay } from 'date-fns';
import { ru } from 'date-fns/locale';
import { 
  ClipboardList, 
  Plus, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  LogIn,
  LogOut,
  Sparkles,
  Wrench,
  Search,
  Gauge,
  CalendarDays
} from 'lucide-react';
import { cn } from '@/lib/utils';

const TASK_CONFIG: Record<OperationalTask['task_type'], {
  icon: React.ElementType;
  color: string;
  bgColor: string;
  label: string;
  labelRu: string;
}> = {
  check_in: { icon: LogIn, color: 'text-success', bgColor: 'bg-success/10', label: 'Check-in', labelRu: 'Заезд' },
  check_out: { icon: LogOut, color: 'text-warning', bgColor: 'bg-warning/10', label: 'Check-out', labelRu: 'Выезд' },
  cleaning: { icon: Sparkles, color: 'text-info', bgColor: 'bg-info/10', label: 'Cleaning', labelRu: 'Уборка' },
  maintenance: { icon: Wrench, color: 'text-orange-500', bgColor: 'bg-orange-500/10', label: 'Maintenance', labelRu: 'Ремонт' },
  inspection: { icon: Search, color: 'text-purple-500', bgColor: 'bg-purple-500/10', label: 'Inspection', labelRu: 'Осмотр' },
  meter_reading: { icon: Gauge, color: 'text-cyan-500', bgColor: 'bg-cyan-500/10', label: 'Meters', labelRu: 'Счётчики' },
};

export default function OwnerOperations() {
  const { language } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();
  const isRu = language === 'ru';
  
  const [selectedPropertyId, setSelectedPropertyId] = useState('');
  const [activeTab, setActiveTab] = useState<'today' | 'upcoming' | 'completed'>('today');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  
  const { data: properties, isLoading: propertiesLoading } = useOwnerProperties();
  
  const { 
    tasks, 
    todayTasks,
    isLoading: tasksLoading,
    completeTask,
    updateTaskStatus 
  } = useOperationalTasks({
    propertyId: selectedPropertyId || undefined,
  });

  // Filter tasks by tab
  const filteredTasks = tasks?.filter(task => {
    const taskDate = new Date(task.scheduled_date);
    const today = startOfDay(new Date());
    
    if (activeTab === 'today') {
      return isToday(taskDate) && task.status !== 'completed';
    } else if (activeTab === 'upcoming') {
      return !isBefore(taskDate, today) && !isToday(taskDate) && task.status !== 'completed';
    } else {
      return task.status === 'completed';
    }
  }) || [];

  // Group upcoming tasks by date
  const groupedUpcoming = filteredTasks.reduce((acc, task) => {
    const dateKey = format(new Date(task.scheduled_date), 'yyyy-MM-dd');
    if (!acc[dateKey]) acc[dateKey] = [];
    acc[dateKey].push(task);
    return acc;
  }, {} as Record<string, OperationalTask[]>);

  const formatDateHeader = (dateStr: string) => {
    const date = new Date(dateStr);
    if (isToday(date)) return isRu ? 'Сегодня' : 'Today';
    if (isTomorrow(date)) return isRu ? 'Завтра' : 'Tomorrow';
    return format(date, 'd MMMM', { locale: isRu ? ru : undefined });
  };

  const handleCompleteTask = (taskId: string) => {
    completeTask.mutate(taskId);
  };

  if (!user) {
    return (
      <PageContainer>
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
          <ClipboardList className="h-16 w-16 text-muted-foreground mb-4" />
          <h1 className="text-2xl font-bold mb-2">
            {isRu ? 'Операции' : 'Operations'}
          </h1>
          <p className="text-muted-foreground mb-6">
            {isRu ? 'Войдите для просмотра задач' : 'Sign in to view tasks'}
          </p>
          <Button onClick={() => navigate('/auth')}>
            {isRu ? 'Войти' : 'Sign In'}
          </Button>
        </div>
      </PageContainer>
    );
  }

  const pendingCount = todayTasks?.filter(t => t.status === 'pending').length || 0;
  const inProgressCount = todayTasks?.filter(t => t.status === 'in_progress').length || 0;

  return (
    <PageContainer>
      <PageHeader
        title={isRu ? 'Операции' : 'Operations'}
        showBack
        fallbackPath="/owner"
        actions={
          <Button size="sm" onClick={() => setShowCreateDialog(true)} className="gap-1">
            <Plus className="h-4 w-4" />
            {isRu ? 'Задача' : 'Task'}
          </Button>
        }
      />

      <div className="mt-4 space-y-4">
        {/* Property Filter */}
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">
            {isRu ? 'Фильтр по объекту' : 'Filter by Property'}
          </p>
          <PropertyThumbnailSelector
            properties={[{ id: '', title: isRu ? 'Все объекты' : 'All Properties', title_ru: 'Все объекты' } as any, ...(properties || [])]}
            selectedId={selectedPropertyId}
            onSelect={setSelectedPropertyId}
            isLoading={propertiesLoading}
          />
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-3 gap-3">
          <Card className={cn(pendingCount > 0 && "border-warning/50 bg-warning/5")}>
            <CardContent className="p-3 text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Clock className="h-4 w-4 text-warning" />
                <span className="text-2xl font-bold">{pendingCount}</span>
              </div>
              <p className="text-xs text-muted-foreground">
                {isRu ? 'Ожидают' : 'Pending'}
              </p>
            </CardContent>
          </Card>
          <Card className={cn(inProgressCount > 0 && "border-info/50 bg-info/5")}>
            <CardContent className="p-3 text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <AlertCircle className="h-4 w-4 text-info" />
                <span className="text-2xl font-bold">{inProgressCount}</span>
              </div>
              <p className="text-xs text-muted-foreground">
                {isRu ? 'В работе' : 'In Progress'}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <CheckCircle2 className="h-4 w-4 text-success" />
                <span className="text-2xl font-bold">
                  {tasks?.filter(t => t.status === 'completed' && isToday(new Date(t.completed_at || ''))).length || 0}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                {isRu ? 'Выполнено' : 'Done'}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="today" className="gap-1">
              <Clock className="h-4 w-4" />
              {isRu ? 'Сегодня' : 'Today'}
              {pendingCount + inProgressCount > 0 && (
                <Badge variant="secondary" className="ml-1 h-5 px-1.5">
                  {pendingCount + inProgressCount}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="upcoming" className="gap-1">
              <CalendarDays className="h-4 w-4" />
              {isRu ? 'Предстоящие' : 'Upcoming'}
            </TabsTrigger>
            <TabsTrigger value="completed" className="gap-1">
              <CheckCircle2 className="h-4 w-4" />
              {isRu ? 'Выполнено' : 'Done'}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="today" className="mt-4 space-y-3">
            {tasksLoading ? (
              <>
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-20 w-full" />
              </>
            ) : filteredTasks.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center">
                  <CheckCircle2 className="h-12 w-12 mx-auto mb-2 text-success opacity-50" />
                  <p className="text-muted-foreground">
                    {isRu ? 'Все задачи на сегодня выполнены!' : 'All tasks for today are done!'}
                  </p>
                </CardContent>
              </Card>
            ) : (
              filteredTasks.map((task) => (
                <TaskCard 
                  key={task.id} 
                  task={task} 
                  isRu={isRu}
                  onComplete={handleCompleteTask}
                  onStartProgress={(id) => updateTaskStatus.mutate({ taskId: id, status: 'in_progress' })}
                  isPending={completeTask.isPending || updateTaskStatus.isPending}
                />
              ))
            )}
          </TabsContent>

          <TabsContent value="upcoming" className="mt-4 space-y-4">
            {tasksLoading ? (
              <Skeleton className="h-20 w-full" />
            ) : Object.keys(groupedUpcoming).length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center">
                  <CalendarDays className="h-12 w-12 mx-auto mb-2 text-muted-foreground opacity-50" />
                  <p className="text-muted-foreground">
                    {isRu ? 'Нет запланированных задач' : 'No upcoming tasks'}
                  </p>
                </CardContent>
              </Card>
            ) : (
              Object.entries(groupedUpcoming)
                .sort(([a], [b]) => a.localeCompare(b))
                .map(([dateKey, dateTasks]) => (
                  <div key={dateKey}>
                    <h3 className="text-sm font-medium text-muted-foreground mb-2">
                      {formatDateHeader(dateKey)}
                    </h3>
                    <div className="space-y-2">
                      {dateTasks.map((task) => (
                        <TaskCard 
                          key={task.id} 
                          task={task} 
                          isRu={isRu}
                          onComplete={handleCompleteTask}
                          onStartProgress={(id) => updateTaskStatus.mutate({ taskId: id, status: 'in_progress' })}
                          isPending={completeTask.isPending || updateTaskStatus.isPending}
                          compact
                        />
                      ))}
                    </div>
                  </div>
                ))
            )}
          </TabsContent>

          <TabsContent value="completed" className="mt-4 space-y-3">
            {tasksLoading ? (
              <Skeleton className="h-20 w-full" />
            ) : filteredTasks.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center">
                  <ClipboardList className="h-12 w-12 mx-auto mb-2 text-muted-foreground opacity-50" />
                  <p className="text-muted-foreground">
                    {isRu ? 'Нет выполненных задач' : 'No completed tasks'}
                  </p>
                </CardContent>
              </Card>
            ) : (
              filteredTasks.slice(0, 20).map((task) => (
                <TaskCard 
                  key={task.id} 
                  task={task} 
                  isRu={isRu}
                  onComplete={handleCompleteTask}
                  isPending={false}
                  completed
                />
              ))
            )}
          </TabsContent>
        </Tabs>
      </div>

      <CreateServiceTaskDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        properties={properties || []}
        defaultPropertyId={selectedPropertyId || undefined}
      />
    </PageContainer>
  );
}

interface TaskCardProps {
  task: OperationalTask;
  isRu: boolean;
  onComplete: (id: string) => void;
  onStartProgress?: (id: string) => void;
  isPending: boolean;
  compact?: boolean;
  completed?: boolean;
}

function TaskCard({ task, isRu, onComplete, onStartProgress, isPending, compact, completed }: TaskCardProps) {
  const config = TASK_CONFIG[task.task_type];
  const Icon = config.icon;
  
  return (
    <Card className={cn(
      "transition-all",
      completed && "opacity-60",
      task.priority === 'urgent' && !completed && "border-destructive/50"
    )}>
      <CardContent className={cn("flex items-center gap-3", compact ? "p-3" : "p-4")}>
        <div className={cn(
          "rounded-lg flex items-center justify-center shrink-0",
          config.bgColor,
          compact ? "w-10 h-10" : "w-12 h-12"
        )}>
          <Icon className={cn(config.color, compact ? "h-5 w-5" : "h-6 w-6")} />
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className={cn("font-medium truncate", compact && "text-sm")}>
              {isRu ? (task.title_ru || task.title) : task.title}
            </p>
            {task.priority === 'urgent' && (
              <Badge variant="destructive" className="text-xs px-1.5 py-0">
                {isRu ? 'Срочно' : 'Urgent'}
              </Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground truncate">
            {task.property?.title || (isRu ? 'Объект' : 'Property')}
            {task.scheduled_time && ` • ${task.scheduled_time.slice(0, 5)}`}
          </p>
          {task.description && !compact && (
            <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
              {task.description}
            </p>
          )}
        </div>

        {!completed && (
          <div className="flex items-center gap-2 shrink-0">
            {task.status === 'pending' && onStartProgress && (
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => onStartProgress(task.id)}
                disabled={isPending}
              >
                {isRu ? 'Начать' : 'Start'}
              </Button>
            )}
            {task.status === 'in_progress' && (
              <Button 
                size="sm" 
                onClick={() => onComplete(task.id)}
                disabled={isPending}
              >
                <CheckCircle2 className="h-4 w-4 mr-1" />
                {isRu ? 'Готово' : 'Done'}
              </Button>
            )}
          </div>
        )}

        {completed && task.completed_at && (
          <p className="text-xs text-muted-foreground shrink-0">
            {format(new Date(task.completed_at), 'HH:mm', { locale: isRu ? ru : undefined })}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
