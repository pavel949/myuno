import { useLanguage } from '@/contexts/LanguageContext';
import { useChecklistCompletions } from '@/hooks/useChecklists';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { ClipboardCheck, CheckCircle2, XCircle } from 'lucide-react';

interface Props {
  propertyId: string;
}

export function ChecklistHistory({ propertyId }: Props) {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const t = (en: string, ru: string) => isRu ? ru : en;
  const { data: completions = [], isLoading } = useChecklistCompletions(propertyId);

  if (isLoading) {
    return <Skeleton className="h-24 w-full rounded-xl" />;
  }

  if (completions.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <ClipboardCheck className="h-4 w-4" />
          {t('Checklist History', 'История чеклистов')}
          <Badge variant="secondary" className="text-[10px]">{completions.length}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {completions.slice(0, 5).map(c => {
          const total = (c.items || []).length;
          const checked = (c.items || []).filter((i: any) => i.checked).length;
          const allDone = total > 0 && checked === total;

          return (
            <div key={c.id} className="flex items-center gap-3 p-2 rounded-lg border text-sm">
              {allDone ? (
                <CheckCircle2 className="h-4 w-4 text-success shrink-0" />
              ) : (
                <XCircle className="h-4 w-4 text-warning shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground">
                  {format(new Date(c.completed_at), 'dd MMM yyyy HH:mm', { locale: isRu ? ru : undefined })}
                </p>
              </div>
              <Badge variant={allDone ? 'default' : 'outline'} className="text-[10px]">
                {checked}/{total}
              </Badge>
              {c.notes && (
                <span className="text-xs text-muted-foreground truncate max-w-[100px]">{c.notes}</span>
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
