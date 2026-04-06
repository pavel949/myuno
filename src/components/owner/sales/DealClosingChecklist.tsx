import { CheckCircle2, Circle, ListChecks, Plus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useDealChecklist, useCreateDealChecklist, useToggleChecklistItem } from '@/hooks/useDealChecklist';
import { cn } from '@/lib/utils';

interface Props {
  dealId: string;
  dealType: string;
  companyId: string;
}

export function DealClosingChecklist({ dealId, dealType, companyId }: Props) {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const { user } = useAuth();
  const { data: items = [], isLoading } = useDealChecklist(dealId);
  const createChecklist = useCreateDealChecklist();
  const toggleItem = useToggleChecklistItem();

  const doneCount = items.filter(i => i.status === 'done').length;
  const totalCount = items.length;
  const progress = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0;

  if (isLoading) {
    return <Card><CardContent className="py-8 text-center text-muted-foreground text-sm">Loading...</CardContent></Card>;
  }

  if (items.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center space-y-3">
          <ListChecks className="h-8 w-8 mx-auto text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            {isRu ? 'Чеклист закрытия ещё не создан' : 'No closing checklist yet'}
          </p>
          <Button
            size="sm"
            onClick={() => createChecklist.mutate({
              dealId,
              dealType,
              companyId,
              createdBy: user?.id || '',
              isRu,
            })}
            disabled={createChecklist.isPending}
          >
            <Plus className="h-4 w-4 mr-1" />
            {isRu ? 'Создать чеклист' : 'Generate Checklist'}
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <ListChecks className="h-4 w-4" />
            {isRu ? 'Чеклист закрытия' : 'Closing Checklist'}
          </CardTitle>
          <span className="text-xs text-muted-foreground">{doneCount}/{totalCount}</span>
        </div>
        <Progress value={progress} className="h-1.5 mt-2" />
      </CardHeader>
      <CardContent className="space-y-1 pt-0">
        {items.map((item) => {
          const isDone = item.status === 'done';
          return (
            <button
              key={item.id}
              onClick={() => toggleItem.mutate({ id: item.id, done: !isDone })}
              disabled={toggleItem.isPending}
              className={cn(
                'flex items-center gap-3 w-full text-left px-3 py-2 rounded-lg transition-colors text-sm',
                isDone ? 'text-muted-foreground' : 'hover:bg-muted/50'
              )}
            >
              {isDone ? (
                <CheckCircle2 className="h-4 w-4 text-success shrink-0" />
              ) : (
                <Circle className="h-4 w-4 text-muted-foreground shrink-0" />
              )}
              <span className={cn(isDone && 'line-through')}>{item.title}</span>
              {item.priority === 'high' && !isDone && (
                <span className="ml-auto text-[10px] font-medium text-warning">!</span>
              )}
            </button>
          );
        })}
      </CardContent>
    </Card>
  );
}
