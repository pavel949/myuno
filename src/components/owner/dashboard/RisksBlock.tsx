import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useOperationalTasks } from '@/hooks/useOperationalTasks';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertTriangle, Wrench, ArrowRight, CheckCircle2, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

export function RisksBlock() {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const isRu = language === 'ru';
  
  // Get all pending/in-progress tasks that represent risks (maintenance, urgent items)
  const { tasks, isLoading } = useOperationalTasks({
    status: ['pending', 'in_progress'],
  });

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

  // Filter for actual risks: maintenance tasks + any urgent priority tasks
  const maintenanceTasks = (tasks || []).filter(t => t.task_type === 'maintenance');
  const urgentTasks = (tasks || []).filter(t => t.priority === 'urgent');
  const overdueTasks = (tasks || []).filter(t => {
    const taskDate = new Date(t.scheduled_date);
    return taskDate < new Date() && t.status === 'pending';
  });
  
  // Combine unique risks
  const allRisks = [...new Set([...maintenanceTasks, ...urgentTasks, ...overdueTasks])];
  const totalIssues = allRisks.length;

  // All clear state
  if (totalIssues === 0) {
    return (
      <Card className="overflow-hidden border-success/20 bg-gradient-to-br from-success/5 to-transparent">
        <CardContent className="p-3">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5">
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs font-medium text-muted-foreground">{isRu ? 'РИСКИ' : 'RISKS'}</span>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-success" />
            <p className="text-sm font-semibold text-success">
              {isRu ? 'Всё в порядке' : 'All clear'}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card 
      className={cn(
        "overflow-hidden cursor-pointer hover:shadow-md transition-all",
        urgentTasks.length > 0 && "border-destructive/30 bg-gradient-to-br from-destructive/5 to-transparent"
      )}
      onClick={() => navigate('/owner/operations?tab=maintenance')}
    >
      <CardContent className="p-3">
        {/* Header */}
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-1.5">
            <AlertTriangle className={cn(
              "h-4 w-4",
              urgentTasks.length > 0 ? "text-destructive" : "text-warning"
            )} />
            <span className="text-xs font-medium text-muted-foreground">{isRu ? 'РИСКИ' : 'RISKS'}</span>
          </div>
          <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
        </div>

        {/* Issue count - large number */}
        <p className={cn(
          "text-2xl font-bold mb-2",
          urgentTasks.length > 0 ? "text-destructive" : "text-warning"
        )}>
          {totalIssues}
          <span className="text-sm font-normal text-muted-foreground ml-1.5">
            {isRu ? 'проблем' : 'issues'}
          </span>
        </p>

        {/* Issue breakdown - compact */}
        <div className="flex flex-wrap gap-1.5">
          {urgentTasks.length > 0 && (
            <div className="flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-destructive/10 text-destructive">
              <AlertTriangle className="h-3 w-3" />
              <span>{urgentTasks.length} {isRu ? 'срочно' : 'urgent'}</span>
            </div>
          )}
          {overdueTasks.length > 0 && (
            <div className="flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-orange-500/10 text-orange-500">
              <AlertCircle className="h-3 w-3" />
              <span>{overdueTasks.length} {isRu ? 'просрочено' : 'overdue'}</span>
            </div>
          )}
          {maintenanceTasks.length > 0 && (
            <div className="flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-warning/10 text-warning">
              <Wrench className="h-3 w-3" />
              <span>{maintenanceTasks.length} {isRu ? 'ремонт' : 'repairs'}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
