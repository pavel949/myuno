import { useLanguage } from '@/contexts/LanguageContext';
import { useBookingConflictsFromTable, BookingConflictRow } from '@/hooks/useChannelHealth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, CheckCircle2 } from 'lucide-react';
import { format } from 'date-fns';
import { ru, enUS } from 'date-fns/locale';
import type { Locale } from 'date-fns';
import { useState } from 'react';

export function BookingConflictsBanner() {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const locale = isRu ? ru : enUS;
  const { data, isLoading, markResolved, isMarkingResolved } = useBookingConflictsFromTable();
  const [resolvingId, setResolvingId] = useState<string | null>(null);

  if (isLoading || !data) return null;
  if (data.unresolvedCount === 0) return null;

  const handleMarkResolved = async (id: string) => {
    setResolvingId(id);
    try {
      await markResolved({ id });
    } finally {
      setResolvingId(null);
    }
  };

  return (
    <Card className="border-destructive/30 bg-destructive/5">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-destructive text-base">
          <AlertTriangle className="h-5 w-5" />
          {isRu
            ? `${data.unresolvedCount} конфликт${data.unresolvedCount > 1 ? 'а' : ''} бронирований`
            : `${data.unresolvedCount} booking conflict${data.unresolvedCount > 1 ? 's' : ''}`}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground">
          {isRu
            ? 'iCal-события пересекаются с существующими бронированиями. Проверьте и отметьте как решённые.'
            : 'iCal events overlap with existing bookings. Review and mark as resolved.'}
        </p>
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {data.conflicts.map((c) => (
            <ConflictRow
              key={c.id}
              conflict={c}
              isRu={isRu}
              locale={locale}
              onMarkResolved={() => handleMarkResolved(c.id)}
              isResolving={resolvingId === c.id || isMarkingResolved}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function ConflictRow({
  conflict,
  isRu,
  locale,
  onMarkResolved,
  isResolving,
}: {
  conflict: BookingConflictRow;
  isRu: boolean;
  locale: Locale;
  onMarkResolved: () => void;
  isResolving: boolean;
}) {
  const prop = conflict.property as { title_en?: string; title_ru?: string } | undefined;
  const propName = isRu ? prop?.title_ru || prop?.title_en : prop?.title_en || prop?.title_ru;

  return (
    <div className="flex items-center justify-between gap-2 p-2 rounded-none bg-background/50 border text-sm">
      <div className="min-w-0 flex-1">
        <span className="font-medium truncate block">{propName || conflict.property_id.slice(0, 8)}</span>
        <span className="text-muted-foreground">
          {format(new Date(conflict.conflict_date), 'dd MMM yyyy', { locale })} • {conflict.channel_a} ↔ {conflict.channel_b}
        </span>
      </div>
      <Button
        size="sm"
        variant="outline"
        onClick={onMarkResolved}
        disabled={isResolving}
        className="shrink-0"
      >
        <CheckCircle2 className="h-4 w-4 mr-1" />
        {isRu ? 'Решено' : 'Mark Resolved'}
      </Button>
    </div>
  );
}
