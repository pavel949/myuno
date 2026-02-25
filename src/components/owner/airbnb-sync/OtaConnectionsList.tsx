import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useOtaConnections, useOtaSync, OtaConnection } from '@/hooks/useOtaSync';
import { formatDistanceToNow } from 'date-fns';
import { ru, enUS } from 'date-fns/locale';
import {
  RefreshCw,
  ExternalLink,
  Trash2,
  Clock,
  CheckCircle2,
  AlertCircle,
  Link2,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

const PLATFORM_CONFIG = {
  airbnb: {
    name: 'Airbnb',
    logo: '🏠',
    color: 'from-destructive to-destructive/80',
    bgColor: 'bg-destructive/10',
  },
  booking: {
    name: 'Booking.com',
    logo: '🅱️',
    color: 'from-info to-primary',
    bgColor: 'bg-info/10',
  },
  vrbo: {
    name: 'VRBO',
    logo: '🏡',
    color: 'from-accent-cyan to-accent-teal',
    bgColor: 'bg-accent-cyan/10',
  },
  expedia: {
    name: 'Expedia',
    logo: '✈️',
    color: 'from-warning to-accent-amber',
    bgColor: 'bg-warning/10',
  },
};

interface OtaConnectionsListProps {
  onSelectConnection?: (connection: OtaConnection) => void;
}

export function OtaConnectionsList({ onSelectConnection }: OtaConnectionsListProps) {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const locale = isRu ? ru : enUS;

  const { connections, isLoading, deleteConnection } = useOtaConnections();
  const syncMutation = useOtaSync();

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2].map(i => (
          <div key={i} className="h-24 bg-muted animate-pulse rounded-lg" />
        ))}
      </div>
    );
  }

  if (!connections || connections.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Link2 className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-50" />
          <p className="text-muted-foreground">
            {isRu 
              ? 'Нет подключённых OTA-площадок' 
              : 'No OTA platforms connected'}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {connections.map((connection, index) => {
        const platform = PLATFORM_CONFIG[connection.platform];
        const isSyncing = syncMutation.isPending && syncMutation.variables?.connection_id === connection.id;
        
        return (
          <motion.div
            key={connection.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <Card 
              className={cn(
                "overflow-hidden transition-all cursor-pointer hover:shadow-md",
                connection.sync_error && "border-destructive/30"
              )}
              onClick={() => onSelectConnection?.(connection)}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  {/* Platform Logo */}
                  <div className={cn(
                    "w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0",
                    platform.bgColor
                  )}>
                    {platform.logo}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold">{platform.name}</h3>
                      {connection.last_sync_status === 'success' && (
                        <Badge variant="secondary" className="text-xs bg-success/10 text-success">
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          {isRu ? 'Синхр.' : 'Synced'}
                        </Badge>
                      )}
                      {connection.last_sync_status === 'failed' && (
                        <Badge variant="destructive" className="text-xs">
                          <AlertCircle className="h-3 w-3 mr-1" />
                          {isRu ? 'Ошибка' : 'Error'}
                        </Badge>
                      )}
                    </div>

                    <p className="text-sm text-muted-foreground truncate">
                      {connection.listing_id 
                        ? `ID: ${connection.listing_id}` 
                        : connection.listing_url}
                    </p>

                    {connection.last_sync_at && (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                        <Clock className="h-3 w-3" />
                        {formatDistanceToNow(new Date(connection.last_sync_at), { addSuffix: true, locale })}
                      </div>
                    )}

                    {connection.sync_error && (
                      <p className="text-xs text-destructive mt-1 truncate">
                        {connection.sync_error}
                      </p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 shrink-0">
                    <Button
                      variant="ghost"
                      size="icon"
                      disabled={isSyncing}
                      onClick={(e) => {
                        e.stopPropagation();
                        syncMutation.mutate({ connection_id: connection.id, sync_type: 'full' });
                      }}
                    >
                      {isSyncing ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <RefreshCw className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      asChild
                      onClick={(e) => e.stopPropagation()}
                    >
                      <a href={connection.listing_url} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:text-destructive"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm(isRu ? 'Удалить подключение?' : 'Delete connection?')) {
                          deleteConnection.mutate(connection.id);
                        }
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        );
      })}
    </div>
  );
}
