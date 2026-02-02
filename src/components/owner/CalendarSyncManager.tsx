import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useExternalCalendars, useICalExportUrl, type ExternalCalendar } from '@/hooks/useExternalCalendars';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { 
  RefreshCw, 
  Plus, 
  Trash2, 
  Copy, 
  ExternalLink, 
  Calendar,
  AlertCircle,
  CheckCircle2,
  Clock,
  Link2
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ru, enUS } from 'date-fns/locale';

interface CalendarSyncManagerProps {
  propertyId: string;
}

const CALENDAR_SOURCES = [
  { value: 'airbnb', label: 'Airbnb', labelRu: 'Airbnb' },
  { value: 'booking', label: 'Booking.com', labelRu: 'Booking.com' },
  { value: 'vrbo', label: 'VRBO', labelRu: 'VRBO' },
  { value: 'expedia', label: 'Expedia', labelRu: 'Expedia' },
  { value: 'google', label: 'Google Calendar', labelRu: 'Google Календарь' },
  { value: 'other', label: 'Other', labelRu: 'Другое' },
];

export function CalendarSyncManager({ propertyId }: CalendarSyncManagerProps) {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const dateLocale = isRu ? ru : enUS;

  const { 
    calendars, 
    isLoading,
    createCalendar,
    deleteCalendar,
    syncCalendar,
    syncAllCalendars,
    isCreating,
    isSyncing,
  } = useExternalCalendars(propertyId);

  const { exportUrl, expiresAt, isExpiringSoon, rotateToken, isRotating } = useICalExportUrl(propertyId);

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newCalendarSource, setNewCalendarSource] = useState('');
  const [newCalendarUrl, setNewCalendarUrl] = useState('');
  const [customName, setCustomName] = useState('');

  const handleCopyExportUrl = () => {
    if (exportUrl) {
      navigator.clipboard.writeText(exportUrl);
      toast.success(isRu ? 'Ссылка скопирована' : 'Link copied');
    }
  };

  const handleRotateToken = async () => {
    try {
      await rotateToken(propertyId);
      toast.success(isRu ? 'Ссылка обновлена. Старая ссылка больше не работает.' : 'Link regenerated. Old link no longer works.');
    } catch (error) {
      toast.error(isRu ? 'Ошибка обновления ссылки' : 'Failed to regenerate link');
    }
  };

  const handleAddCalendar = async () => {
    if (!newCalendarUrl || !newCalendarSource) {
      toast.error(isRu ? 'Заполните все поля' : 'Fill in all fields');
      return;
    }

    try {
      const source = CALENDAR_SOURCES.find(s => s.value === newCalendarSource);
      const name = newCalendarSource === 'other' 
        ? customName || 'External Calendar'
        : source?.label || newCalendarSource;

      await createCalendar({
        property_id: propertyId,
        name,
        ical_url: newCalendarUrl,
      });

      toast.success(isRu ? 'Календарь добавлен' : 'Calendar added');
      setIsAddDialogOpen(false);
      setNewCalendarSource('');
      setNewCalendarUrl('');
      setCustomName('');
    } catch (error) {
      toast.error(isRu ? 'Ошибка добавления календаря' : 'Error adding calendar');
    }
  };

  const handleDeleteCalendar = async (calendar: ExternalCalendar) => {
    if (!confirm(isRu ? 'Удалить этот календарь?' : 'Delete this calendar?')) return;

    try {
      await deleteCalendar(calendar.id);
      toast.success(isRu ? 'Календарь удалён' : 'Calendar deleted');
    } catch (error) {
      toast.error(isRu ? 'Ошибка удаления' : 'Delete error');
    }
  };

  const handleSyncCalendar = async (calendarId: string) => {
    try {
      await syncCalendar(calendarId);
      toast.success(isRu ? 'Синхронизация завершена' : 'Sync completed');
    } catch (error) {
      toast.error(isRu ? 'Ошибка синхронизации' : 'Sync error');
    }
  };

  const handleSyncAll = async () => {
    try {
      await syncAllCalendars(propertyId);
      toast.success(isRu ? 'Все календари синхронизированы' : 'All calendars synced');
    } catch (error) {
      toast.error(isRu ? 'Ошибка синхронизации' : 'Sync error');
    }
  };

  return (
    <div className="space-y-6">
      {/* Export Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ExternalLink className="h-5 w-5" />
            {isRu ? 'Экспорт календаря' : 'Calendar Export'}
          </CardTitle>
          <CardDescription>
            {isRu 
              ? 'Добавьте эту ссылку в Airbnb, Booking.com или другие платформы для синхронизации занятости'
              : 'Add this link to Airbnb, Booking.com or other platforms to sync availability'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input
              value={exportUrl || ''}
              readOnly
              className="font-mono text-sm"
              placeholder={isRu ? 'Загрузка...' : 'Loading...'}
            />
            <Button variant="outline" onClick={handleCopyExportUrl} disabled={!exportUrl}>
              <Copy className="h-4 w-4" />
            </Button>
            <Button 
              variant="outline" 
              onClick={handleRotateToken}
              disabled={isRotating || !exportUrl}
              title={isRu ? 'Обновить ссылку (старая перестанет работать)' : 'Regenerate link (old one will stop working)'}
            >
              <RefreshCw className={`h-4 w-4 ${isRotating ? 'animate-spin' : ''}`} />
            </Button>
          </div>
          {isExpiringSoon && expiresAt && (
            <div className="flex items-center gap-2 mt-2 p-2 bg-amber-500/10 border border-amber-500/20 rounded text-amber-600 dark:text-amber-400">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              <p className="text-xs">
                {isRu 
                  ? `Ссылка истекает ${new Date(expiresAt).toLocaleDateString('ru')}. Обновите её и замените на платформах.`
                  : `Link expires ${new Date(expiresAt).toLocaleDateString('en')}. Regenerate and update on platforms.`}
              </p>
            </div>
          )}
          <p className="text-xs text-muted-foreground mt-2">
            {isRu 
              ? '⚠️ Не делитесь этой ссылкой публично — она даёт доступ к данным бронирований'
              : "⚠️ Don't share this link publicly — it gives access to booking data"}
          </p>
        </CardContent>
      </Card>

      {/* Import Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Link2 className="h-5 w-5" />
                {isRu ? 'Импорт календарей' : 'Import Calendars'}
              </CardTitle>
              <CardDescription>
                {isRu 
                  ? 'Подключите календари с других платформ для автоматической синхронизации'
                  : 'Connect calendars from other platforms for automatic sync'}
              </CardDescription>
            </div>
            <div className="flex gap-2">
              {calendars && calendars.length > 0 && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleSyncAll}
                  disabled={isSyncing}
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${isSyncing ? 'animate-spin' : ''}`} />
                  {isRu ? 'Синхронизировать все' : 'Sync All'}
                </Button>
              )}
              <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" type="button">
                    <Plus className="h-4 w-4 mr-2" />
                    {isRu ? 'Добавить' : 'Add'}
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>
                      {isRu ? 'Добавить внешний календарь' : 'Add External Calendar'}
                    </DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 pt-4">
                    <div className="space-y-2">
                      <Label>{isRu ? 'Источник' : 'Source'}</Label>
                      <Select value={newCalendarSource} onValueChange={setNewCalendarSource}>
                        <SelectTrigger>
                          <SelectValue placeholder={isRu ? 'Выберите платформу' : 'Select platform'} />
                        </SelectTrigger>
                        <SelectContent>
                          {CALENDAR_SOURCES.map(source => (
                            <SelectItem key={source.value} value={source.value}>
                              {isRu ? source.labelRu : source.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {newCalendarSource === 'other' && (
                      <div className="space-y-2">
                        <Label>{isRu ? 'Название' : 'Name'}</Label>
                        <Input
                          value={customName}
                          onChange={(e) => setCustomName(e.target.value)}
                          placeholder={isRu ? 'Например: HomeAway' : 'e.g., HomeAway'}
                        />
                      </div>
                    )}

                    <div className="space-y-2">
                      <Label>{isRu ? 'iCal URL' : 'iCal URL'}</Label>
                      <Input
                        value={newCalendarUrl}
                        onChange={(e) => setNewCalendarUrl(e.target.value)}
                        placeholder="https://..."
                      />
                      <p className="text-xs text-muted-foreground">
                        {isRu 
                          ? 'Найдите ссылку iCal в настройках календаря на платформе'
                          : 'Find the iCal link in the calendar settings on the platform'}
                      </p>
                    </div>

                    <Button 
                      onClick={handleAddCalendar} 
                      className="w-full"
                      disabled={isCreating}
                    >
                      {isCreating 
                        ? (isRu ? 'Добавление...' : 'Adding...') 
                        : (isRu ? 'Добавить календарь' : 'Add Calendar')}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">
              {isRu ? 'Загрузка...' : 'Loading...'}
            </div>
          ) : calendars && calendars.length > 0 ? (
            <div className="space-y-3">
              {calendars.map(calendar => (
                <div 
                  key={calendar.id} 
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <Calendar className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{calendar.name}</span>
                        {calendar.sync_error ? (
                          <Badge variant="destructive" className="text-xs">
                            <AlertCircle className="h-3 w-3 mr-1" />
                            {isRu ? 'Ошибка' : 'Error'}
                          </Badge>
                        ) : calendar.is_active ? (
                          <Badge variant="secondary" className="text-xs">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            {isRu ? 'Активен' : 'Active'}
                          </Badge>
                        ) : null}
                      </div>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {calendar.last_synced_at 
                          ? (isRu ? 'Синхронизировано ' : 'Synced ') + 
                            formatDistanceToNow(new Date(calendar.last_synced_at), { 
                              addSuffix: true, 
                              locale: dateLocale 
                            })
                          : (isRu ? 'Ещё не синхронизировано' : 'Not synced yet')}
                      </div>
                      {calendar.sync_error && (
                        <p className="text-xs text-destructive mt-1">{calendar.sync_error}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => handleSyncCalendar(calendar.id)}
                      disabled={isSyncing}
                    >
                      <RefreshCw className={`h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => handleDeleteCalendar(calendar)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-8 space-y-6">
              <div className="text-center">
                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <Calendar className="h-8 w-8 text-primary" />
                </div>
                <h3 className="font-semibold mb-2">
                  {isRu ? 'Синхронизируйте бронирования' : 'Sync Your Bookings'}
                </h3>
                <p className="text-sm text-muted-foreground max-w-md mx-auto">
                  {isRu 
                    ? 'Подключите календари с других платформ, чтобы избежать двойных бронирований'
                    : 'Connect calendars from other platforms to avoid double bookings'}
                </p>
              </div>

              <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                <p className="text-sm font-medium">
                  {isRu ? '📋 Как найти iCal-ссылку:' : '📋 How to find iCal link:'}
                </p>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <div className="flex gap-2">
                    <span className="font-medium text-foreground">Airbnb:</span>
                    <span>{isRu ? 'Календарь → Доступность → Экспорт календаря' : 'Calendar → Availability → Export Calendar'}</span>
                  </div>
                  <div className="flex gap-2">
                    <span className="font-medium text-foreground">Booking:</span>
                    <span>{isRu ? 'Объект → Цены и доступность → Синхронизация' : 'Property → Rates & Availability → Sync'}</span>
                  </div>
                  <div className="flex gap-2">
                    <span className="font-medium text-foreground">VRBO:</span>
                    <span>{isRu ? 'Календарь → Импорт/Экспорт → Экспорт' : 'Calendar → Import/Export → Export'}</span>
                  </div>
                </div>
              </div>

              <div className="flex justify-center">
                <Button type="button" onClick={() => setIsAddDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  {isRu ? 'Добавить первый канал' : 'Add First Channel'}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
