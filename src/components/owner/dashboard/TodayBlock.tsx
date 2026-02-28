import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTodayOperations } from '@/hooks/useOperationalTasks';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { CalendarCheck, CheckCircle2, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { TASK_TYPE_CONFIG, TASK_TYPE_ALT_ICONS } from '@/config/taskColors';

// Map from tasksByType keys to task_type values
const TYPE_KEY_MAP: Record<string, string> = {
  checkIns: 'check_in',
  checkOuts: 'check_out',
  cleaning: 'cleaning',
  maintenance: 'maintenance',
  meterReadings: 'meter_reading',
};

export function TodayBlock() {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const isTh = language === 'th';
  const { todayTasks, tasksByType, isLoading } = useTodayOperations();

  const pendingTasks = todayTasks.filter(t => t.status !== 'completed');
  const taskCounts = Object.entries(tasksByType).filter(([_, tasks]) => 
    tasks.some(t => t.status !== 'completed')
  );

  if (isLoading) {
    return (
      <Card className="overflow-hidden">
        <CardContent className="p-3">
          <Skeleton className="h-5 w-24 mb-2" />
          <Skeleton className="h-8 w-16 mb-2" />
          <Skeleton className="h-6 w-full" />
        </CardContent>
      </Card>
    );
  }

  // All done state
  if (pendingTasks.length === 0) {
    return (
      <Card 
        className="overflow-hidden border-success/20 bg-success/5 cursor-pointer hover:shadow-md transition-all"
        onClick={() => navigate('/owner/operations')}
      >
        <CardContent className="p-3">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5">
              <CalendarCheck className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs font-medium text-muted-foreground">{isRu ? 'СЕГОДНЯ' : isTh ? 'วันนี้' : 'TODAY'}</span>
            </div>
            <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
          </div>
          
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-success" />
            <div>
              <p className="text-sm font-semibold text-success">
                {isRu ? 'Всё готово' : isTh ? 'เสร็จทั้งหมด' : 'All done'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card 
      className="overflow-hidden cursor-pointer hover:shadow-md transition-all"
      onClick={() => navigate('/owner/operations')}
    >
      <CardContent className="p-3">
        {/* Header */}
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-1.5">
            <CalendarCheck className="h-4 w-4 text-muted-foreground" />
            <span className="text-xs font-medium text-muted-foreground">{isRu ? 'СЕГОДНЯ' : isTh ? 'วันนี้' : 'TODAY'}</span>
          </div>
          <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
        </div>

        {/* Task count - large number */}
        <p className="text-2xl font-bold mb-2">
          {pendingTasks.length}
          <span className="text-sm font-normal text-muted-foreground ml-1.5">
            {isRu ? 'задач' : isTh ? 'งาน' : 'tasks'}
          </span>
        </p>

        {/* Task type pills - compact */}
        <div className="flex flex-wrap gap-1.5">
          {taskCounts.map(([typeKey, tasks]) => {
            const taskType = TYPE_KEY_MAP[typeKey] || 'maintenance';
            const config = TASK_TYPE_CONFIG[taskType] || { icon: CalendarCheck, color: 'text-muted-foreground', bgColor: 'bg-muted', label: taskType, labelRu: taskType };
            const Icon = config.icon;
            const count = tasks.filter(t => t.status !== 'completed').length;
            if (count === 0) return null;
            
            return (
              <div 
                key={typeKey}
                className={cn(
                  "flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium",
                  config.bgColor, config.color
                )}
              >
                <Icon className="h-3 w-3" />
                <span>{count}</span>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
