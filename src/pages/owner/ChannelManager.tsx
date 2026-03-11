import { useState } from 'react';
import { PageContainer } from '@/components/uno/PageContainer';
import { PageHeader } from '@/components/uno/PageHeader';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useExternalCalendars } from '@/hooks/useExternalCalendars';
import { useOwnerProperties } from '@/hooks/usePropertyCare';
import { usePropertyBookings } from '@/hooks/usePropertyBookings';
import { useOtaConnections, OtaConnection } from '@/hooks/useOtaSync';
import { ChannelManagementCTA } from '@/components/owner/ChannelManagementCTA';
import { AirbnbSyncDialog } from '@/components/owner/airbnb-sync/AirbnbSyncDialog';
import { OtaConnectionsList } from '@/components/owner/airbnb-sync/OtaConnectionsList';
import { SyncedListingPreview } from '@/components/owner/airbnb-sync/SyncedListingPreview';
import { ChannelHealthDashboard } from '@/components/owner/channel-manager/ChannelHealthDashboard';
import { SyncTimeline, SyncStatsChart } from '@/components/owner/channel-manager/SyncTimeline';
import { ConflictResolver } from '@/components/owner/channel-manager/ConflictResolver';
import { QuickConnectCards } from '@/components/owner/channel-manager/QuickConnectCards';
import { ChannelStatsCard } from '@/components/owner/channel-manager/ChannelStatsCard';
import { ChannelCard } from '@/components/owner/channel-manager/ChannelCard';
import { ExportLinkCard } from '@/components/owner/channel-manager/ExportLinkCard';
import { SourceOfTruthToggle } from '@/components/owner/channel-manager/SourceOfTruthToggle';
import { CHANNELS, getChannelConfig } from '@/components/owner/channel-manager/channelConfig';
import { 
  RefreshCw, Plus, Link2, Calendar, TrendingUp, Crown,
  CheckCircle2, AlertCircle, Download, Upload, Activity, AlertTriangle, Settings2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { ru, enUS } from 'date-fns/locale';
import { APP_ROUTES } from '@/lib/config/routes';

export default function ChannelManager() {
  const { language } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();
  const isRu = language === 'ru';
  const locale = isRu ? ru : enUS;

  const [showAirbnbSync, setShowAirbnbSync] = useState(false);
  const [selectedConnection, setSelectedConnection] = useState<OtaConnection | null>(null);
  const [activeTab, setActiveTab] = useState('connections');

  const { data: properties } = useOwnerProperties();
  const { calendars, isLoading, syncAllCalendars, isSyncing } = useExternalCalendars();
  const { bookings } = usePropertyBookings();
  const { connections: otaConnections } = useOtaConnections();

  const totalChannels = (calendars?.length || 0) + (otaConnections?.length || 0);
  const activeChannels = (calendars?.filter(c => c.is_active && !c.sync_error).length || 0) + 
    (otaConnections?.filter(c => c.is_active && !c.sync_error).length || 0);
  const errorChannels = (calendars?.filter(c => c.sync_error).length || 0) + 
    (otaConnections?.filter(c => c.sync_error).length || 0);
  
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
          <h1 className="text-2xl font-bold mb-2">Channel Manager</h1>
          <p className="text-muted-foreground mb-6">
            {isRu ? 'Войдите для управления каналами' : 'Sign in to manage channels'}
          </p>
          <Button onClick={() => navigate(APP_ROUTES.AUTH)}>{isRu ? 'Войти' : 'Sign In'}</Button>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader title="Channel Manager" showBack fallbackPath={APP_ROUTES.MC} />

      <div className="mt-4 space-y-6">
        {/* Stats Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <ChannelStatsCard icon={<Link2 className="h-5 w-5" />} label={isRu ? 'Подключено' : 'Connected'} value={totalChannels} color="bg-primary/10 text-primary" />
          <ChannelStatsCard icon={<CheckCircle2 className="h-5 w-5" />} label={isRu ? 'Активных' : 'Active'} value={activeChannels} color="bg-success/10 text-success" />
          <ChannelStatsCard icon={<Calendar className="h-5 w-5" />} label={isRu ? 'OTA-брони' : 'OTA Bookings'} value={totalOtaBookings} color="bg-info/10 text-info" />
          <ChannelStatsCard icon={<AlertCircle className="h-5 w-5" />} label={isRu ? 'Ошибки' : 'Errors'} value={errorChannels} color={errorChannels > 0 ? "bg-destructive/10 text-destructive" : "bg-muted text-muted-foreground"} />
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <Button onClick={handleSyncAll} disabled={isSyncing || totalChannels === 0} className="flex-1">
            <RefreshCw className={cn("h-4 w-4 mr-2", isSyncing && "animate-spin")} />
            {isSyncing ? (isRu ? 'Синхронизация...' : 'Syncing...') : (isRu ? 'Синхронизировать все' : 'Sync All')}
          </Button>
          <Button variant="outline" onClick={() => setShowAirbnbSync(true)}>
            <Download className="h-4 w-4 mr-2" />
            {isRu ? 'Импорт' : 'Import'}
          </Button>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 h-auto gap-1">
            <TabsTrigger value="connections" className="gap-1 px-2">
              <Link2 className="h-4 w-4" />
              <span className="hidden sm:inline">{isRu ? 'Подключения' : 'Connections'}</span>
            </TabsTrigger>
            <TabsTrigger value="sync-health" className="gap-1 px-2">
              <Activity className="h-4 w-4" />
              <span className="hidden sm:inline">{isRu ? 'Состояние синка' : 'Sync Health'}</span>
            </TabsTrigger>
            <TabsTrigger value="conflicts" className="gap-1 px-2">
              <AlertTriangle className="h-4 w-4" />
              <span className="hidden sm:inline">{isRu ? 'Конфликты' : 'Conflicts'}</span>
            </TabsTrigger>
            <TabsTrigger value="distribution" className="gap-1 px-2">
              <Settings2 className="h-4 w-4" />
              <span className="hidden sm:inline">{isRu ? 'Настройки дистрибуции' : 'Distribution Settings'}</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="connections" className="space-y-4 mt-4">
            <Card className="bg-gradient-to-br from-rose-500/10 to-pink-500/10 border-rose-200 dark:border-rose-800">
              <CardContent className="pt-4">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-xl bg-rose-100 dark:bg-rose-900/50 flex items-center justify-center text-3xl shrink-0">🏠</div>
                  <div className="flex-1">
                    <h3 className="font-semibold">{isRu ? 'Импорт листинга с Airbnb' : 'Import listing from Airbnb'}</h3>
                    <p className="text-sm text-muted-foreground">
                      {isRu ? 'Автоматически скопируйте название, фото, описание и характеристики' : 'Automatically copy title, photos, description and specs'}
                    </p>
                  </div>
                  <Button onClick={() => setShowAirbnbSync(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    {isRu ? 'Импорт' : 'Import'}
                  </Button>
                </div>
              </CardContent>
            </Card>

            <div>
              <h2 className="text-lg font-semibold mb-3">{isRu ? 'Быстрое подключение каналов' : 'Quick Connect'}</h2>
              <QuickConnectCards />
            </div>

            <div>
              <h2 className="text-lg font-semibold mb-3">{isRu ? 'Подключённые OTA' : 'Connected OTAs'}</h2>
              <OtaConnectionsList onSelectConnection={setSelectedConnection} />
            </div>

            {selectedConnection && (
              <div>
                <h2 className="text-lg font-semibold mb-3">{isRu ? 'Импортированные данные' : 'Imported Data'}</h2>
                <SyncedListingPreview connectionId={selectedConnection.id} propertyId={selectedConnection.property_id || properties?.[0]?.id} onApplied={() => setSelectedConnection(null)} />
              </div>
            )}
          </TabsContent>

          <TabsContent value="sync-health" className="space-y-4 mt-4">
            <ChannelHealthDashboard />
            <SyncStatsChart />
            <div>
              <h2 className="text-lg font-semibold mb-3">{isRu ? 'История синхронизации' : 'Sync History'}</h2>
              <SyncTimeline limit={30} />
            </div>
          </TabsContent>

          <TabsContent value="conflicts" className="space-y-4 mt-4">
            {properties && properties.length > 0 ? (
              <>
                <Card className="border-warning/30 bg-warning/5">
                  <CardContent className="pt-4 text-sm text-muted-foreground">
                    {isRu
                      ? 'Конфликты показывают пересечения бронирований между каналами. Для production-режима проверяйте каждую коллизию перед ручным override.'
                      : 'Conflicts highlight booking overlaps between channels. In production, review each collision before manual override.'}
                  </CardContent>
                </Card>
                <ConflictResolver
                  propertyId={properties[0].id}
                  propertyName={isRu ? properties[0].title_ru || properties[0].title : properties[0].title}
                />
              </>
            ) : (
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                  {isRu ? 'Нет объектов для проверки конфликтов' : 'No properties available for conflict checks'}
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="distribution" className="space-y-4 mt-4">
            <ChannelManagementCTA />

            {properties && properties.length > 0 ? (
              <>
                <p className="text-sm text-muted-foreground">
                  {isRu
                    ? 'Настройте source of truth по каждому объекту. Режим влияет на приоритет цен/доступности при синке.'
                    : 'Configure source of truth per property. This mode defines price/availability priority during sync.'}
                </p>
                {properties.map((property) => (
                  <SourceOfTruthToggle
                    key={property.id}
                    propertyId={property.id}
                    currentMode={(property as any).sync_mode || 'import_only'}
                    propertyTitle={isRu ? property.title_ru || property.title : property.title}
                  />
                ))}
              </>
            ) : (
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                  {isRu ? 'Нет объектов для настройки' : 'No properties to configure'}
                </CardContent>
              </Card>
            )}

            <div>
              <h2 className="text-lg font-semibold mb-3">{isRu ? 'Подключённые каналы (iCal)' : 'Connected Channels (iCal)'}</h2>
              {isLoading ? (
                <div className="space-y-3">
                  {[1, 2].map((i) => <div key={i} className="h-24 bg-muted animate-pulse rounded-lg" />)}
                </div>
              ) : calendars && calendars.length > 0 ? (
                <div className="space-y-3">
                  {calendars.map((calendar, index) => {
                    const channel = getChannelConfig(calendar.name);
                    const property = properties?.find((p) => p.id === calendar.property_id);
                    return (
                      <motion.div key={calendar.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }}>
                        <ChannelCard calendar={calendar} channel={channel} propertyName={isRu ? property?.title_ru || property?.title : property?.title} bookingsCount={bookingsBySource[calendar.name] || 0} isRu={isRu} locale={locale} />
                      </motion.div>
                    );
                  })}
                </div>
              ) : (
                <Card>
                  <CardContent className="py-12 text-center">
                    <Link2 className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-50" />
                    <p className="text-muted-foreground mb-4">
                      {isRu ? 'Нет подключённых каналов. Добавьте iCal-ссылку с вашего OTA.' : 'No connected channels. Add an iCal link from your OTA.'}
                    </p>
                    <Button onClick={() => navigate(APP_ROUTES.MC_CALENDAR)}>
                      <Plus className="h-4 w-4 mr-2" />
                      {isRu ? 'Подключить канал' : 'Connect Channel'}
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>

            {properties && properties.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold mb-3">{isRu ? 'Экспорт календаря UNO' : 'Export UNO Calendar'}</h2>
                <div className="space-y-2">
                  {properties.slice(0, 3).map((property) => (
                    <ExportLinkCard key={property.id} propertyId={property.id} propertyName={isRu ? property.title_ru || property.title : property.title} isRu={isRu} />
                  ))}
                  {properties.length > 3 && (
                    <Button variant="ghost" className="w-full" onClick={() => navigate(APP_ROUTES.MC_CALENDAR)}>
                      {isRu ? `Ещё ${properties.length - 3} объектов...` : `${properties.length - 3} more properties...`}
                    </Button>
                  )}
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>

        <AirbnbSyncDialog open={showAirbnbSync} onOpenChange={setShowAirbnbSync} onSuccess={() => setShowAirbnbSync(false)} />
      </div>
    </PageContainer>
  );
}
