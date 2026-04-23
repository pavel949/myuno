import { useState, useMemo } from 'react';
import { resolveIcon } from '@/lib/iconMap';
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
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { 
  Plus, 
  ExternalLink, 
  CheckCircle2,
  Link2,
  Search,
  ChevronDown,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useExternalCalendars } from '@/hooks/useExternalCalendars';
import { useOwnerProperties } from '@/hooks/usePropertyCare';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  type ChannelRegistryEntry,
  getFeaturedChannels,
  getChannelsByCategory,
  CATEGORY_LABELS,
  CHANNEL_REGISTRY,
} from './channelRegistry';

interface QuickConnectCardsProps {
  onConnected?: () => void;
}

export function QuickConnectCards({ onConnected }: QuickConnectCardsProps) {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  
  const [selectedOta, setSelectedOta] = useState<ChannelRegistryEntry | null>(null);
  const [icalUrl, setIcalUrl] = useState('');
  const [calendarName, setCalendarName] = useState('');
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAll, setShowAll] = useState(false);

  const { data: properties } = useOwnerProperties();
  const { createCalendar } = useExternalCalendars();

  const featured = useMemo(() => getFeaturedChannels(), []);
  const grouped = useMemo(() => getChannelsByCategory(), []);

  const filteredGrouped = useMemo(() => {
    if (!searchQuery.trim()) return grouped;
    const q = searchQuery.toLowerCase();
    return grouped
      .map(g => ({
        ...g,
        channels: g.channels.filter(c => c.name.toLowerCase().includes(q) || c.id.includes(q)),
      }))
      .filter(g => g.channels.length > 0);
  }, [grouped, searchQuery]);

  const handleOpenDialog = (ota: ChannelRegistryEntry) => {
    setSelectedOta(ota);
    setCalendarName(ota.id === 'custom' ? '' : ota.name);
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

  const ChannelCard = ({ ota }: { ota: ChannelRegistryEntry }) => (
    <Card
      className={cn(
        "cursor-pointer transition-all",
        ota.bgColor,
        ota.borderColor
      )}
      onClick={() => handleOpenDialog(ota)}
    >
      <CardContent className="p-3 text-center">
        <div className="text-2xl mb-1">{ota.icon}</div>
        <h3 className="font-medium text-xs leading-tight truncate">{ota.name}</h3>
        <Plus className="h-3 w-3 mx-auto mt-1 text-muted-foreground" />
      </CardContent>
    </Card>
  );

  return (
    <>
      {/* Featured channels */}
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-7 gap-2">
        {featured.map(ota => (
          <ChannelCard key={ota.id} ota={ota} />
        ))}
      </div>

      {/* All channels — collapsible */}
      <Collapsible open={showAll} onOpenChange={setShowAll}>
        <CollapsibleTrigger asChild>
          <Button variant="ghost" size="sm" className="w-full mt-3 text-muted-foreground">
            <ChevronDown className={cn("h-4 w-4 mr-1 transition-transform", showAll && "rotate-180")} />
            {isRu
              ? `Все каналы (${CHANNEL_REGISTRY.length - 2})`
              : `All channels (${CHANNEL_REGISTRY.length - 2})`}
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="mt-3 space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={isRu ? 'Поиск канала...' : 'Search channel...'}
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-9 h-9"
            />
          </div>

          {/* Grouped channels */}
          {filteredGrouped.map(group => (
            <div key={group.category}>
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                {isRu ? CATEGORY_LABELS[group.category].ru : CATEGORY_LABELS[group.category].en}
              </h4>
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                {group.channels.map(ota => (
                  <ChannelCard key={ota.id} ota={ota} />
                ))}
              </div>
            </div>
          ))}
        </CollapsibleContent>
      </Collapsible>

      {/* Connect Dialog */}
      <Dialog open={!!selectedOta} onOpenChange={(open) => !open && setSelectedOta(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <span className="text-xl">{selectedOta?.icon}</span>
              {isRu ? 'Подключить' : 'Connect'} {selectedOta?.name}
            </DialogTitle>
            <DialogDescription>
              {isRu 
                ? 'Добавьте iCal-ссылку для синхронизации календаря'
                : 'Add an iCal link to sync your calendar'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Instructions — shown by default */}
            {selectedOta && selectedOta.instructions[isRu ? 'ru' : 'en'].length > 0 && (
              <div className="rounded-none bg-muted/50 border border-border p-3 space-y-2">
                <h4 className="text-sm font-medium text-foreground">
                  {isRu ? '📋 Как получить iCal-ссылку' : '📋 How to get iCal link'}
                </h4>
                <ol className="list-decimal list-inside space-y-1.5 text-sm text-muted-foreground">
                  {selectedOta.instructions[isRu ? 'ru' : 'en'].map((step, i) => (
                    <li key={i} className="leading-relaxed">{step}</li>
                  ))}
                </ol>
                {selectedOta.helpUrl && (
                  <Button
                    variant="link"
                    size="sm"
                    className="mt-1 h-auto p-0 text-xs"
                    onClick={() => window.open(selectedOta.helpUrl, '_blank')}
                  >
                    <ExternalLink className="h-3 w-3 mr-1" />
                    {isRu ? 'Официальная документация' : 'Official documentation'}
                  </Button>
                )}
              </div>
            )}

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
