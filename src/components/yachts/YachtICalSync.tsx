import React, { useState } from 'react';
import { logger } from '@/lib/logger';
import { useLanguage } from '@/contexts/LanguageContext';
import { useYachtExternalCalendars, useYachtICalExportUrl, CreateYachtCalendarInput } from '@/hooks/useYachtExternalCalendars';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { 
  Link2, 
  Plus, 
  RefreshCw, 
  ExternalLink, 
  Copy, 
  Check, 
  Trash2,
  ChevronDown,
  AlertCircle,
  Calendar
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface YachtICalSyncProps {
  yachtId: string;
  className?: string;
}

export function YachtICalSync({ yachtId, className }: YachtICalSyncProps) {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  
  const { 
    calendars, 
    createCalendar, 
    deleteCalendar, 
    syncCalendar, 
    syncAllCalendars,
    isCreating,
    isDeleting,
    isSyncing 
  } = useYachtExternalCalendars(yachtId);
  
  const { exportUrl } = useYachtICalExportUrl(yachtId);

  const [showAddDialog, setShowAddDialog] = useState(false);
  const [copied, setCopied] = useState(false);
  const [formData, setFormData] = useState({ name: '', ical_url: '' });
  const [isOpen, setIsOpen] = useState(true);

  const handleCopyExportUrl = async () => {
    if (!exportUrl) return;
    
    try {
      await navigator.clipboard.writeText(exportUrl);
      setCopied(true);
      toast.success(isRu ? 'Ссылка скопирована' : 'Link copied');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error(isRu ? 'Ошибка копирования' : 'Failed to copy');
    }
  };

  const handleAddCalendar = async () => {
    if (!formData.name.trim() || !formData.ical_url.trim()) {
      toast.error(isRu ? 'Заполните все поля' : 'Fill all fields');
      return;
    }

    try {
      await createCalendar({
        yacht_id: yachtId,
        name: formData.name.trim(),
        ical_url: formData.ical_url.trim(),
      });
      toast.success(isRu ? 'Календарь добавлен' : 'Calendar added');
      setShowAddDialog(false);
      setFormData({ name: '', ical_url: '' });
    } catch (error) {
      logger.error('Error adding calendar:', error);
      toast.error(isRu ? 'Ошибка добавления' : 'Error adding calendar');
    }
  };

  const handleSyncCalendar = async (calendarId: string) => {
    try {
      await syncCalendar(calendarId);
      toast.success(isRu ? 'Синхронизация завершена' : 'Sync completed');
    } catch (error) {
      logger.error('Error syncing calendar:', error);
      toast.error(isRu ? 'Ошибка синхронизации' : 'Sync failed');
    }
  };

  const handleDeleteCalendar = async (calendarId: string) => {
    try {
      await deleteCalendar(calendarId);
      toast.success(isRu ? 'Календарь удалён' : 'Calendar deleted');
    } catch (error) {
      logger.error('Error deleting calendar:', error);
      toast.error(isRu ? 'Ошибка удаления' : 'Error deleting');
    }
  };

  const handleSyncAll = async () => {
    try {
      const result = await syncAllCalendars(yachtId);
      const successful = result.results?.filter((r: any) => r.success).length || 0;
      toast.success(
        isRu 
          ? `Синхронизировано ${successful} календарей` 
          : `Synced ${successful} calendars`
      );
    } catch (error) {
      logger.error('Error syncing all:', error);
      toast.error(isRu ? 'Ошибка синхронизации' : 'Sync failed');
    }
  };

  return (
    <Card className={cn("", className)}>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CardHeader className="pb-3">
          <CollapsibleTrigger className="flex items-center justify-between w-full">
            <div className="flex items-center gap-2">
              <Link2 className="h-4 w-4" />
              <CardTitle className="text-base">
                {isRu ? 'Синхронизация календаря' : 'Calendar Sync'}
              </CardTitle>
              {calendars && calendars.length > 0 && (
                <Badge variant="secondary" className="text-xs">
                  {calendars.length}
                </Badge>
              )}
            </div>
            <ChevronDown className={cn(
              "h-4 w-4 transition-transform",
              isOpen && "rotate-180"
            )} />
          </CollapsibleTrigger>
          <CardDescription className="mt-1">
            {isRu 
              ? 'Синхронизируйте с GetMyBoat, Boatsetter и другими платформами' 
              : 'Sync with GetMyBoat, Boatsetter and other platforms'}
          </CardDescription>
        </CardHeader>

        <CollapsibleContent>
          <CardContent className="space-y-4">
            {/* Export URL */}
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">
                {isRu ? 'Ссылка для экспорта (iCal)' : 'Export URL (iCal)'}
              </Label>
              <div className="flex gap-2">
                <Input 
                  value={exportUrl || ''} 
                  readOnly 
                  className="text-xs font-mono"
                  placeholder={isRu ? 'Загрузка...' : 'Loading...'}
                />
                <Button 
                  variant="outline" 
                  size="icon"
                  onClick={handleCopyExportUrl}
                  disabled={!exportUrl}
                >
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
              <p className="text-[10px] text-muted-foreground">
                {isRu 
                  ? 'Добавьте эту ссылку в GetMyBoat, Boatsetter или Google Calendar' 
                  : 'Add this link to GetMyBoat, Boatsetter or Google Calendar'}
              </p>
            </div>

            {/* Import Section */}
            <div className="border-t pt-4 space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-xs text-muted-foreground">
                  {isRu ? 'Импортированные календари' : 'Imported Calendars'}
                </Label>
                <div className="flex gap-2">
                  {calendars && calendars.length > 0 && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={handleSyncAll}
                      disabled={isSyncing}
                    >
                      <RefreshCw className={cn("h-3 w-3 mr-1", isSyncing && "animate-spin")} />
                      {isRu ? 'Синхронизировать все' : 'Sync All'}
                    </Button>
                  )}
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setShowAddDialog(true)}
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    {isRu ? 'Добавить' : 'Add'}
                  </Button>
                </div>
              </div>

              {/* Calendar List */}
              {calendars && calendars.length > 0 ? (
                <div className="space-y-2">
                  {calendars.map((calendar) => (
                    <div 
                      key={calendar.id}
                      className="flex items-center justify-between p-3 rounded-lg border bg-muted/30"
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">{calendar.name}</p>
                          <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                            {calendar.last_synced_at ? (
                              <span>
                                {isRu ? 'Обновлено' : 'Synced'}: {format(new Date(calendar.last_synced_at), 'dd.MM HH:mm')}
                              </span>
                            ) : (
                              <span>{isRu ? 'Не синхронизировано' : 'Not synced'}</span>
                            )}
                            {calendar.sync_error && (
                              <Badge variant="destructive" className="text-[9px] px-1">
                                <AlertCircle className="h-2 w-2 mr-0.5" />
                                Error
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8"
                          onClick={() => handleSyncCalendar(calendar.id)}
                          disabled={isSyncing}
                        >
                          <RefreshCw className={cn("h-3 w-3", isSyncing && "animate-spin")} />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => handleDeleteCalendar(calendar.id)}
                          disabled={isDeleting}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-muted-foreground">
                  <Calendar className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">
                    {isRu 
                      ? 'Нет подключённых календарей' 
                      : 'No connected calendars'}
                  </p>
                  <p className="text-xs mt-1">
                    {isRu 
                      ? 'Добавьте iCal ссылку с другой платформы' 
                      : 'Add an iCal link from another platform'}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>

      {/* Add Calendar Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {isRu ? 'Добавить внешний календарь' : 'Add External Calendar'}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div>
              <Label>{isRu ? 'Название' : 'Name'}</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData(f => ({ ...f, name: e.target.value }))}
                placeholder={isRu ? 'GetMyBoat, Boatsetter...' : 'GetMyBoat, Boatsetter...'}
              />
            </div>
            <div>
              <Label>{isRu ? 'Ссылка iCal' : 'iCal URL'}</Label>
              <Input
                value={formData.ical_url}
                onChange={(e) => setFormData(f => ({ ...f, ical_url: e.target.value }))}
                placeholder="https://..."
              />
              <p className="text-xs text-muted-foreground mt-1">
                {isRu 
                  ? 'Скопируйте ссылку iCal из настроек другой платформы' 
                  : 'Copy the iCal link from the other platform settings'}
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              {isRu ? 'Отмена' : 'Cancel'}
            </Button>
            <Button onClick={handleAddCalendar} disabled={isCreating}>
              {isCreating 
                ? (isRu ? 'Добавление...' : 'Adding...') 
                : (isRu ? 'Добавить' : 'Add')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
