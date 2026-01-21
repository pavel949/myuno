import { useState } from 'react';
import { PageContainer } from '@/components/uno/PageContainer';
import { PageHeader } from '@/components/uno/PageHeader';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useExternalCalendars, useICalExportUrl } from '@/hooks/useExternalCalendars';
import { useOwnerProperties } from '@/hooks/usePropertyCare';
import { usePropertyBookings } from '@/hooks/usePropertyBookings';
import { 
  RefreshCw, 
  Plus, 
  Link2, 
  Calendar, 
  TrendingUp,
  CheckCircle2,
  AlertCircle,
  Clock,
  ExternalLink,
  Copy,
  Unlink
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { format, formatDistanceToNow } from 'date-fns';
import { ru, enUS } from 'date-fns/locale';

// Channel configuration
const CHANNELS = [
  {
    id: 'airbnb',
    name: 'Airbnb',
    logo: '🏠',
    color: 'from-rose-500 to-pink-600',
    bgColor: 'bg-rose-50 dark:bg-rose-950/30',
    textColor: 'text-rose-600 dark:text-rose-400',
  },
  {
    id: 'booking',
    name: 'Booking.com',
    logo: '🅱️',
    color: 'from-blue-600 to-indigo-700',
    bgColor: 'bg-blue-50 dark:bg-blue-950/30',
    textColor: 'text-blue-600 dark:text-blue-400',
  },
  {
    id: 'vrbo',
    name: 'VRBO',
    logo: '🏡',
    color: 'from-cyan-500 to-teal-600',
    bgColor: 'bg-cyan-50 dark:bg-cyan-950/30',
    textColor: 'text-cyan-600 dark:text-cyan-400',
  },
  {
    id: 'expedia',
    name: 'Expedia',
    logo: '✈️',
    color: 'from-yellow-500 to-amber-600',
    bgColor: 'bg-yellow-50 dark:bg-yellow-950/30',
    textColor: 'text-yellow-600 dark:text-yellow-400',
  },
  {
    id: 'google',
    name: 'Google Calendar',
    logo: '📅',
    color: 'from-emerald-500 to-green-600',
    bgColor: 'bg-emerald-50 dark:bg-emerald-950/30',
    textColor: 'text-emerald-600 dark:text-emerald-400',
  },
  {
    id: 'manual',
    name: 'Manual',
    logo: '✏️',
    color: 'from-slate-500 to-gray-600',
    bgColor: 'bg-slate-50 dark:bg-slate-950/30',
    textColor: 'text-slate-600 dark:text-slate-400',
  },
];

function getChannelConfig(source: string) {
  const normalized = source.toLowerCase();
  return CHANNELS.find(c => normalized.includes(c.id)) || CHANNELS[CHANNELS.length - 1];
}

export default function ChannelManager() {
  const { language } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();
  const isRu = language === 'ru';
  const locale = isRu ? ru : enUS;

  const { data: properties } = useOwnerProperties();
  const { calendars, isLoading, syncAllCalendars, isSyncing } = useExternalCalendars();
  const { bookings } = usePropertyBookings();

  // Calculate stats
  const totalChannels = calendars?.length || 0;
  const activeChannels = calendars?.filter(c => c.is_active && !c.sync_error).length || 0;
  const errorChannels = calendars?.filter(c => c.sync_error).length || 0;
  
  // Group bookings by source
  const bookingsBySource = bookings?.reduce((acc, booking) => {
    const source = booking.source || 'manual';
    acc[source] = (acc[source] || 0) + 1;
    return acc;
  }, {} as Record<string, number>) || {};

  const totalOtaBookings = Object.entries(bookingsBySource)
    .filter(([source]) => source !== 'manual')
    .reduce((sum, [, count]) => sum + count, 0);

  const handleSyncAll = async () => {
    try {
      await syncAllCalendars(undefined);
      toast.success(isRu ? 'Все каналы синхронизированы' : 'All channels synced');
    } catch (error) {
      toast.error(isRu ? 'Ошибка синхронизации' : 'Sync failed');
    }
  };

  if (!user) {
    return (
      <PageContainer>
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
          <Link2 className="h-16 w-16 text-muted-foreground mb-4" />
          <h1 className="text-2xl font-bold mb-2">
            {isRu ? 'Channel Manager' : 'Channel Manager'}
          </h1>
          <p className="text-muted-foreground mb-6">
            {isRu ? 'Войдите для управления каналами' : 'Sign in to manage channels'}
          </p>
          <Button onClick={() => navigate('/auth')}>
            {isRu ? 'Войти' : 'Sign In'}
          </Button>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader
        title="Channel Manager"
        showBack
        fallbackPath="/owner"
      />

      <div className="mt-4 space-y-6">
        {/* Stats Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatsCard
            icon={<Link2 className="h-5 w-5" />}
            label={isRu ? 'Подключено' : 'Connected'}
            value={totalChannels}
            color="bg-primary/10 text-primary"
          />
          <StatsCard
            icon={<CheckCircle2 className="h-5 w-5" />}
            label={isRu ? 'Активных' : 'Active'}
            value={activeChannels}
            color="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600"
          />
          <StatsCard
            icon={<Calendar className="h-5 w-5" />}
            label={isRu ? 'OTA-брони' : 'OTA Bookings'}
            value={totalOtaBookings}
            color="bg-blue-100 dark:bg-blue-900/30 text-blue-600"
          />
          <StatsCard
            icon={<AlertCircle className="h-5 w-5" />}
            label={isRu ? 'Ошибки' : 'Errors'}
            value={errorChannels}
            color={errorChannels > 0 ? "bg-red-100 dark:bg-red-900/30 text-red-600" : "bg-muted text-muted-foreground"}
          />
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <Button 
            onClick={handleSyncAll} 
            disabled={isSyncing || totalChannels === 0}
            className="flex-1"
          >
            <RefreshCw className={cn("h-4 w-4 mr-2", isSyncing && "animate-spin")} />
            {isSyncing 
              ? (isRu ? 'Синхронизация...' : 'Syncing...') 
              : (isRu ? 'Синхронизировать все' : 'Sync All')}
          </Button>
          <Button 
            variant="outline" 
            onClick={() => navigate('/owner/calendar')}
          >
            <Plus className="h-4 w-4 mr-2" />
            {isRu ? 'Добавить' : 'Add'}
          </Button>
        </div>

        {/* How it Works */}
        <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
          <CardContent className="pt-4">
            <h3 className="font-semibold mb-2 flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              {isRu ? 'Как работает синхронизация' : 'How Sync Works'}
            </h3>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• {isRu ? 'Подключите iCal-ссылку с Airbnb, Booking и других OTA' : 'Connect iCal link from Airbnb, Booking and other OTAs'}</li>
              <li>• {isRu ? 'UNO автоматически импортирует бронирования' : 'UNO automatically imports bookings'}</li>
              <li>• {isRu ? 'Экспортируйте календарь UNO обратно на OTA' : 'Export UNO calendar back to OTAs'}</li>
              <li>• {isRu ? 'Избегайте двойных бронирований!' : 'Avoid double bookings!'}</li>
            </ul>
          </CardContent>
        </Card>

        {/* Connected Channels */}
        <div>
          <h2 className="text-lg font-semibold mb-3">
            {isRu ? 'Подключённые каналы' : 'Connected Channels'}
          </h2>

          {isLoading ? (
            <div className="space-y-3">
              {[1, 2].map(i => (
                <div key={i} className="h-24 bg-muted animate-pulse rounded-lg" />
              ))}
            </div>
          ) : calendars && calendars.length > 0 ? (
            <div className="space-y-3">
              {calendars.map((calendar, index) => {
                const channel = getChannelConfig(calendar.name);
                const property = properties?.find(p => p.id === calendar.property_id);
                
                return (
                  <motion.div
                    key={calendar.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <ChannelCard
                      calendar={calendar}
                      channel={channel}
                      propertyName={isRu ? property?.title_ru || property?.title : property?.title}
                      bookingsCount={bookingsBySource[calendar.name] || 0}
                      isRu={isRu}
                      locale={locale}
                    />
                  </motion.div>
                );
              })}
            </div>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <Link2 className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-50" />
                <p className="text-muted-foreground mb-4">
                  {isRu 
                    ? 'Нет подключённых каналов. Добавьте iCal-ссылку с вашего OTA.' 
                    : 'No connected channels. Add an iCal link from your OTA.'}
                </p>
                <Button onClick={() => navigate('/owner/calendar')}>
                  <Plus className="h-4 w-4 mr-2" />
                  {isRu ? 'Подключить канал' : 'Connect Channel'}
                </Button>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Bookings by Source */}
        {Object.keys(bookingsBySource).length > 0 && (
          <div>
            <h2 className="text-lg font-semibold mb-3">
              {isRu ? 'Бронирования по источникам' : 'Bookings by Source'}
            </h2>
            <Card>
              <CardContent className="pt-4">
                <div className="space-y-3">
                  {Object.entries(bookingsBySource)
                    .sort(([, a], [, b]) => b - a)
                    .map(([source, count]) => {
                      const channel = getChannelConfig(source);
                      const percentage = Math.round((count / (bookings?.length || 1)) * 100);
                      
                      return (
                        <div key={source} className="flex items-center gap-3">
                          <div className={cn(
                            "w-10 h-10 rounded-lg flex items-center justify-center text-lg",
                            channel.bgColor
                          )}>
                            {channel.logo}
                          </div>
                          <div className="flex-1">
                            <div className="flex justify-between items-center mb-1">
                              <span className="font-medium text-sm">{source}</span>
                              <span className="text-sm text-muted-foreground">
                                {count} ({percentage}%)
                              </span>
                            </div>
                            <div className="h-2 bg-muted rounded-full overflow-hidden">
                              <div 
                                className={cn("h-full rounded-full bg-gradient-to-r", channel.color)}
                                style={{ width: `${percentage}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Export Section */}
        {properties && properties.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold mb-3">
              {isRu ? 'Экспорт календаря UNO' : 'Export UNO Calendar'}
            </h2>
            <p className="text-sm text-muted-foreground mb-3">
              {isRu 
                ? 'Добавьте эту ссылку на ваши OTA-площадки для синхронизации занятости' 
                : 'Add this link to your OTA platforms to sync availability'}
            </p>
            <div className="space-y-2">
              {properties.slice(0, 3).map(property => (
                <ExportLinkCard 
                  key={property.id} 
                  propertyId={property.id}
                  propertyName={isRu ? property.title_ru || property.title : property.title}
                  isRu={isRu}
                />
              ))}
              {properties.length > 3 && (
                <Button 
                  variant="ghost" 
                  className="w-full"
                  onClick={() => navigate('/owner/calendar')}
                >
                  {isRu ? `Ещё ${properties.length - 3} объектов...` : `${properties.length - 3} more properties...`}
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
    </PageContainer>
  );
}

// Stats Card Component
function StatsCard({ 
  icon, 
  label, 
  value, 
  color 
}: { 
  icon: React.ReactNode; 
  label: string; 
  value: number; 
  color: string;
}) {
  return (
    <Card>
      <CardContent className="pt-4 pb-3">
        <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center mb-2", color)}>
          {icon}
        </div>
        <div className="text-2xl font-bold">{value}</div>
        <div className="text-xs text-muted-foreground">{label}</div>
      </CardContent>
    </Card>
  );
}

// Channel Card Component
function ChannelCard({ 
  calendar, 
  channel, 
  propertyName,
  bookingsCount,
  isRu,
  locale
}: { 
  calendar: any;
  channel: typeof CHANNELS[0];
  propertyName?: string;
  bookingsCount: number;
  isRu: boolean;
  locale: any;
}) {
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
          {/* Channel Logo */}
          <div className={cn(
            "w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0",
            channel.bgColor
          )}>
            {channel.logo}
          </div>

          {/* Info */}
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
              <p className="text-sm text-muted-foreground truncate mb-1">
                {propertyName}
              </p>
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
              <p className="text-xs text-red-500 mt-2 truncate">
                {calendar.sync_error}
              </p>
            )}
          </div>

          {/* External Link */}
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

// Export Link Card Component
function ExportLinkCard({ 
  propertyId, 
  propertyName,
  isRu 
}: { 
  propertyId: string; 
  propertyName?: string;
  isRu: boolean;
}) {
  const { exportUrl, isLoading } = useICalExportUrl(propertyId);

  const handleCopy = () => {
    if (exportUrl) {
      navigator.clipboard.writeText(exportUrl);
      toast.success(isRu ? 'Ссылка скопирована!' : 'Link copied!');
    }
  };

  if (isLoading) {
    return <div className="h-16 bg-muted animate-pulse rounded-lg" />;
  }

  return (
    <Card>
      <CardContent className="p-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            <Calendar className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm truncate">{propertyName}</p>
            <p className="text-xs text-muted-foreground truncate">
              {exportUrl ? exportUrl.slice(0, 50) + '...' : 'Loading...'}
            </p>
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={handleCopy}
            disabled={!exportUrl}
          >
            <Copy className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
