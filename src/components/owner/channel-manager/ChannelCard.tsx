import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Clock, Calendar, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

export interface ChannelConfig {
  id: string;
  name: string;
  logo: string;
  color: string;
  bgColor: string;
  textColor: string;
}

interface ChannelCardProps {
  calendar: any;
  channel: ChannelConfig;
  propertyName?: string;
  bookingsCount: number;
  isRu: boolean;
  locale: any;
}

export function ChannelCard({ calendar, channel, propertyName, bookingsCount, isRu, locale }: ChannelCardProps) {
  const hasError = !!calendar.sync_error;
  const lastSynced = calendar.last_synced_at
    ? formatDistanceToNow(new Date(calendar.last_synced_at), { addSuffix: true, locale })
    : null;

  return (
    <Card className={cn(
      "overflow-hidden transition-all",
      hasError && "border-red-300 dark:border-red-800"
    )}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className={cn(
            "w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0",
            channel.bgColor
          )}>
            {channel.logo}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold truncate">{calendar.name}</h3>
              {hasError ? (
                <Badge variant="destructive" className="text-xs">
                  {isRu ? 'Ошибка' : 'Error'}
                </Badge>
              ) : calendar.is_active ? (
                <Badge variant="secondary" className="text-xs bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600">
                  {isRu ? 'Активен' : 'Active'}
                </Badge>
              ) : (
                <Badge variant="secondary" className="text-xs">
                  {isRu ? 'Неактивен' : 'Inactive'}
                </Badge>
              )}
            </div>

            {propertyName && (
              <p className="text-sm text-muted-foreground truncate mb-1">{propertyName}</p>
            )}

            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              {lastSynced && (
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {lastSynced}
                </span>
              )}
              {bookingsCount > 0 && (
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {bookingsCount} {isRu ? 'брон.' : 'book.'}
                </span>
              )}
            </div>

            {hasError && (
              <p className="text-xs text-red-500 mt-2 truncate">{calendar.sync_error}</p>
            )}
          </div>

          <Button variant="ghost" size="icon" className="shrink-0" asChild>
            <a href={calendar.ical_url} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-4 w-4" />
            </a>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
