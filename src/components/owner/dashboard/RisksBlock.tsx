import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useOperationalTasks } from '@/hooks/useOperationalTasks';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertTriangle, Wrench, Package, ArrowRight, CheckCircle2 } from 'lucide-react';
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
        <CardContent className="p-4">
          <Skeleton className="h-6 w-32 mb-3" />
          <Skeleton className="h-16 w-full" />
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
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-muted-foreground" />
              <span className="font-semibold">{isRu ? 'Риски' : 'Risks'}</span>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-success/10">
              <CheckCircle2 className="h-5 w-5 text-success" />
            </div>
            <div>
              <p className="font-medium text-success">
                {isRu ? 'Всё в порядке' : 'All clear'}
              </p>
              <p className="text-xs text-muted-foreground">
                {isRu ? 'Нет открытых проблем' : 'No open issues'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card 
      className={cn(
        "overflow-hidden cursor-pointer hover:shadow-md transition-shadow",
        urgentTasks.length > 0 && "border-destructive/30 bg-gradient-to-br from-destructive/5 to-transparent"
      )}
      onClick={() => navigate('/owner/operations?tab=maintenance')}
    >
      <CardContent className="p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className={cn(
              "h-5 w-5",
              urgentTasks.length > 0 ? "text-destructive" : "text-warning"
            )} />
            <span className="font-semibold">{isRu ? 'Риски' : 'Risks'}</span>
          </div>
          <ArrowRight className="h-4 w-4 text-muted-foreground" />
        </div>

        {/* Issue count */}
        <p className={cn(
          "text-2xl font-bold mb-3",
          urgentTasks.length > 0 ? "text-destructive" : "text-warning"
        )}>
          {totalIssues} {isRu 
            ? (totalIssues === 1 ? 'проблема' : 'проблем') 
            : (totalIssues === 1 ? 'issue' : 'issues')}
        </p>

        {/* Issue breakdown */}
        <div className="flex flex-wrap gap-2 mb-4">
          {urgentTasks.length > 0 && (
            <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-sm font-medium bg-destructive/10 text-destructive">
              <AlertTriangle className="h-3.5 w-3.5" />
              <span>{urgentTasks.length} {isRu ? 'срочно' : 'urgent'}</span>
            </div>
          )}
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-sm font-medium bg-warning/10 text-warning">
            <Wrench className="h-3.5 w-3.5" />
            <span>{maintenanceTasks.length} {isRu ? 'ремонт' : 'maintenance'}</span>
          </div>
        </div>

        {/* Main action */}
        <Button 
          variant={urgentTasks.length > 0 ? "destructive" : "outline"}
          className="w-full"
          onClick={(e) => {
            e.stopPropagation();
            navigate('/owner/operations?tab=maintenance');
          }}
        >
          {isRu ? 'Решить проблемы' : 'Resolve issues'}
        </Button>
      </CardContent>
    </Card>
  );
}
