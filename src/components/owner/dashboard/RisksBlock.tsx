import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useOperationalTasks } from '@/hooks/useOperationalTasks';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertTriangle, Wrench, ArrowRight, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export function RisksBlock() {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const isRu = language === 'ru';
  
  // Get all pending maintenance tasks
  const { tasks, isLoading } = useOperationalTasks({
    status: ['pending', 'in_progress'],
    taskType: 'maintenance'
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

  const maintenanceTasks = tasks || [];
  const urgentTasks = maintenanceTasks.filter(t => t.priority === 'urgent');
  const totalIssues = maintenanceTasks.length;

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
          <div className="flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-warning/10 text-warning">
            <Wrench className="h-3 w-3" />
            <span>{maintenanceTasks.length}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
