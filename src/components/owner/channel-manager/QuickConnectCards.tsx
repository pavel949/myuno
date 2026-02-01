import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { 
  Plus, 
  ExternalLink, 
  Copy, 
  CheckCircle2,
  Link2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useExternalCalendars, CreateExternalCalendarInput } from '@/hooks/useExternalCalendars';
import { useOwnerProperties } from '@/hooks/usePropertyCare';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const OTA_CHANNELS = [
  {
    id: 'airbnb',
    name: 'Airbnb',
    icon: '🏠',
    color: 'from-rose-500 to-pink-600',
    bgColor: 'bg-rose-50 dark:bg-rose-950/30 hover:bg-rose-100 dark:hover:bg-rose-900/40',
    borderColor: 'border-rose-200 dark:border-rose-800',
    instructions: {
      en: [
        'Go to your Airbnb listing',
        'Click "Pricing and availability" → "Availability"',
        'Scroll down to "Connect calendars"',
        'Click "Export Calendar" and copy the iCal URL'
      ],
      ru: [
        'Откройте ваш листинг на Airbnb',
        'Нажмите "Цены и доступность" → "Доступность"',
        'Прокрутите до "Подключить календари"',
        'Нажмите "Экспорт календаря" и скопируйте iCal URL'
      ]
    },
    helpUrl: 'https://www.airbnb.com/help/article/99'
  },
  {
    id: 'booking',
    name: 'Booking.com',
    icon: '🅱️',
    color: 'from-blue-600 to-indigo-700',
    bgColor: 'bg-blue-50 dark:bg-blue-950/30 hover:bg-blue-100 dark:hover:bg-blue-900/40',
    borderColor: 'border-blue-200 dark:border-blue-800',
    instructions: {
      en: [
        'Log in to Booking.com Extranet',
        'Go to "Calendar" → "Sync calendars"',
        'Click "Export your calendar"',
        'Copy the iCal link provided'
      ],
      ru: [
        'Войдите в Booking.com Extranet',
        'Перейдите в "Календарь" → "Синхронизация календарей"',
        'Нажмите "Экспортировать календарь"',
        'Скопируйте предоставленную iCal-ссылку'
      ]
    },
    helpUrl: 'https://partner.booking.com/en-gb/help/connectivity/how-do-i-sync-my-calendar-external-calendars'
  },
  {
    id: 'vrbo',
    name: 'VRBO / HomeAway',
    icon: '🏡',
    color: 'from-cyan-500 to-teal-600',
    bgColor: 'bg-cyan-50 dark:bg-cyan-950/30 hover:bg-cyan-100 dark:hover:bg-cyan-900/40',
    borderColor: 'border-cyan-200 dark:border-cyan-800',
    instructions: {
      en: [
        'Go to your VRBO dashboard',
        'Select your property → "Calendar"',
        'Click "Import/Export" tab',
        'Copy the "Export calendar" link'
      ],
      ru: [
        'Откройте панель управления VRBO',
        'Выберите объект → "Календарь"',
        'Нажмите на вкладку "Импорт/Экспорт"',
        'Скопируйте ссылку "Экспортировать календарь"'
      ]
    },
    helpUrl: 'https://help.vrbo.com/articles/How-do-I-sync-my-calendar-with-other-sites'
  },
  {
    id: 'google',
    name: 'Google Calendar',
    icon: '📅',
    color: 'from-emerald-500 to-green-600',
    bgColor: 'bg-emerald-50 dark:bg-emerald-950/30 hover:bg-emerald-100 dark:hover:bg-emerald-900/40',
    borderColor: 'border-emerald-200 dark:border-emerald-800',
    instructions: {
      en: [
        'Open Google Calendar settings',
        'Select the calendar to share',
        'Under "Integrate calendar", copy "Public address in iCal format"',
        'Or use "Secret address in iCal format" for private calendars'
      ],
      ru: [
        'Откройте настройки Google Календаря',
        'Выберите календарь для синхронизации',
        'В разделе "Интеграция" скопируйте "Публичный адрес в формате iCal"',
        'Или используйте "Секретный адрес" для приватных календарей'
      ]
    },
    helpUrl: 'https://support.google.com/calendar/answer/37648'
  },
];

interface QuickConnectCardsProps {
  onConnected?: () => void;
}

export function QuickConnectCards({ onConnected }: QuickConnectCardsProps) {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  
  const [selectedOta, setSelectedOta] = useState<typeof OTA_CHANNELS[0] | null>(null);
  const [icalUrl, setIcalUrl] = useState('');
  const [calendarName, setCalendarName] = useState('');
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: properties } = useOwnerProperties();
  const { createCalendar } = useExternalCalendars();

  const handleOpenDialog = (ota: typeof OTA_CHANNELS[0]) => {
    setSelectedOta(ota);
    setCalendarName(ota.name);
    setIcalUrl('');
    if (properties && properties.length === 1) {
      setSelectedPropertyId(properties[0].id);
    } else {
      setSelectedPropertyId('');
    }
  };

  const handleConnect = async () => {
    if (!icalUrl || !selectedPropertyId || !calendarName) {
      toast.error(isRu ? 'Заполните все поля' : 'Fill all fields');
      return;
    }

    // Basic URL validation
    if (!icalUrl.startsWith('http')) {
      toast.error(isRu ? 'Некорректный URL' : 'Invalid URL');
      return;
    }

    setIsSubmitting(true);
    try {
      await createCalendar({
        property_id: selectedPropertyId,
        name: calendarName,
        ical_url: icalUrl,
      });
      
      toast.success(isRu ? 'Канал подключён!' : 'Channel connected!');
      setSelectedOta(null);
      onConnected?.();
    } catch (error) {
      toast.error(isRu ? 'Ошибка подключения' : 'Connection failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {OTA_CHANNELS.map(ota => (
          <Card 
            key={ota.id}
            className={cn(
              "cursor-pointer transition-all",
              ota.bgColor,
              ota.borderColor
            )}
            onClick={() => handleOpenDialog(ota)}
          >
            <CardContent className="p-4 text-center">
              <div className="text-3xl mb-2">{ota.icon}</div>
              <h3 className="font-medium text-sm">{ota.name}</h3>
              <div className="mt-2">
                <Plus className="h-4 w-4 mx-auto text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Connect Dialog */}
      <Dialog open={!!selectedOta} onOpenChange={(open) => !open && setSelectedOta(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <span className="text-2xl">{selectedOta?.icon}</span>
              {isRu ? 'Подключить' : 'Connect'} {selectedOta?.name}
            </DialogTitle>
            <DialogDescription>
              {isRu 
                ? 'Добавьте iCal-ссылку для синхронизации календаря'
                : 'Add an iCal link to sync your calendar'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Instructions */}
            <Accordion type="single" collapsible>
              <AccordionItem value="instructions" className="border-none">
                <AccordionTrigger className="py-2 text-sm">
                  {isRu ? 'Как получить iCal-ссылку?' : 'How to get iCal link?'}
                </AccordionTrigger>
                <AccordionContent>
                  <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
                    {selectedOta?.instructions[isRu ? 'ru' : 'en'].map((step, i) => (
                      <li key={i}>{step}</li>
                    ))}
                  </ol>
                  {selectedOta?.helpUrl && (
                    <Button
                      variant="link"
                      size="sm"
                      className="mt-2 h-auto p-0"
                      onClick={() => window.open(selectedOta.helpUrl, '_blank')}
                    >
                      <ExternalLink className="h-3 w-3 mr-1" />
                      {isRu ? 'Подробная инструкция' : 'Detailed instructions'}
                    </Button>
                  )}
                </AccordionContent>
              </AccordionItem>
            </Accordion>

            {/* Property Selection */}
            {properties && properties.length > 1 && (
              <div className="space-y-2">
                <Label>{isRu ? 'Объект' : 'Property'}</Label>
                <Select value={selectedPropertyId} onValueChange={setSelectedPropertyId}>
                  <SelectTrigger>
                    <SelectValue placeholder={isRu ? 'Выберите объект' : 'Select property'} />
                  </SelectTrigger>
                  <SelectContent>
                    {properties.map(prop => (
                      <SelectItem key={prop.id} value={prop.id}>
                        {isRu ? prop.title_ru || prop.title : prop.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Calendar Name */}
            <div className="space-y-2">
              <Label>{isRu ? 'Название канала' : 'Channel name'}</Label>
              <Input
                value={calendarName}
                onChange={(e) => setCalendarName(e.target.value)}
                placeholder={selectedOta?.name || ''}
              />
            </div>

            {/* iCal URL */}
            <div className="space-y-2">
              <Label>iCal URL</Label>
              <Input
                value={icalUrl}
                onChange={(e) => setIcalUrl(e.target.value)}
                placeholder="https://..."
                type="url"
              />
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setSelectedOta(null)}
              >
                {isRu ? 'Отмена' : 'Cancel'}
              </Button>
              <Button
                className="flex-1"
                onClick={handleConnect}
                disabled={isSubmitting || !icalUrl || !selectedPropertyId}
              >
                {isSubmitting ? (
                  <>
                    <Link2 className="h-4 w-4 mr-2 animate-pulse" />
                    {isRu ? 'Подключение...' : 'Connecting...'}
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    {isRu ? 'Подключить' : 'Connect'}
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
