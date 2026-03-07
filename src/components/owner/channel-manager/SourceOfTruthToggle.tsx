import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertCircle, ArrowUpDown, Crown, Download, Upload } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

type SyncMode = 'import_only' | 'myuno_master' | 'external_master';

interface SourceOfTruthToggleProps {
  propertyId: string;
  currentMode: SyncMode;
  propertyTitle?: string;
  onModeChanged?: (mode: SyncMode) => void;
}

const SYNC_MODES: { value: SyncMode; icon: typeof Download; badge: string; badgeVariant: 'default' | 'secondary' | 'outline' }[] = [
  { value: 'import_only', icon: Download, badge: 'iCal', badgeVariant: 'secondary' },
  { value: 'myuno_master', icon: Crown, badge: 'Master', badgeVariant: 'default' },
  { value: 'external_master', icon: Upload, badge: 'OTA', badgeVariant: 'outline' },
];

export function SourceOfTruthToggle({ propertyId, currentMode, propertyTitle, onModeChanged }: SourceOfTruthToggleProps) {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const [mode, setMode] = useState<SyncMode>(currentMode);
  const [saving, setSaving] = useState(false);

  const labels: Record<SyncMode, { title: string; desc: string }> = {
    import_only: {
      title: isRu ? 'Только импорт' : 'Import Only',
      desc: isRu
        ? 'Бронирования подтягиваются из OTA через iCal. Цены управляются на каждой площадке отдельно.'
        : 'Bookings pulled from OTAs via iCal. Prices managed on each platform separately.',
    },
    myuno_master: {
      title: isRu ? 'myUNO — главный источник' : 'myUNO is Master',
      desc: isRu
        ? 'Цены и календарь управляются в myUNO и автоматически отправляются на все подключённые площадки.'
        : 'Prices & calendar managed in myUNO and automatically pushed to all connected platforms.',
    },
    external_master: {
      title: isRu ? 'OTA — главный источник' : 'OTA is Master',
      desc: isRu
        ? 'Одна из площадок (Airbnb, Booking.com) является главной. myUNO только импортирует данные.'
        : 'One OTA platform (Airbnb, Booking.com) is the master. myUNO only imports data.',
    },
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await (supabase as any)
        .from('properties')
        .update({ sync_mode: mode })
        .eq('id', propertyId);

      if (error) throw error;

      onModeChanged?.(mode);
      toast.success(isRu ? 'Режим синхронизации обновлён' : 'Sync mode updated');
    } catch (err) {
      console.error('Failed to update sync mode:', err);
      toast.error(isRu ? 'Ошибка сохранения' : 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="border-2 border-primary/20">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <ArrowUpDown className="h-5 w-5 text-primary" />
          <CardTitle className="text-lg">
            {isRu ? 'Источник данных (Source of Truth)' : 'Source of Truth'}
          </CardTitle>
        </div>
        <CardDescription>
          {isRu
            ? 'Определите, откуда берутся цены и доступность для этого объекта'
            : 'Define where prices and availability come from for this property'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <RadioGroup value={mode} onValueChange={(v) => setMode(v as SyncMode)} className="space-y-3">
          {SYNC_MODES.map(({ value, icon: Icon, badge, badgeVariant }) => (
            <div
              key={value}
              className={cn(
                'flex items-start gap-3 rounded-lg border p-4 cursor-pointer transition-colors',
                mode === value ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/40'
              )}
              onClick={() => setMode(value)}
            >
              <RadioGroupItem value={value} id={value} className="mt-1" />
              <div className="flex-1 space-y-1">
                <div className="flex items-center gap-2">
                  <Icon className="h-4 w-4" />
                  <Label htmlFor={value} className="font-semibold cursor-pointer">
                    {labels[value].title}
                  </Label>
                  <Badge variant={badgeVariant} className="text-xs">{badge}</Badge>
                </div>
                <p className="text-sm text-muted-foreground">{labels[value].desc}</p>
              </div>
            </div>
          ))}
        </RadioGroup>

        {mode === 'myuno_master' && (
          <div className="flex items-start gap-2 rounded-md bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 p-3">
            <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
            <p className="text-sm text-amber-800 dark:text-amber-200">
              {isRu
                ? 'Для полной синхронизации цен на OTA потребуется подключение Rentals United. iCal экспорт обновит только календарь доступности.'
                : 'Full price sync to OTAs requires Rentals United connection. iCal export will only update availability calendar.'}
            </p>
          </div>
        )}

        {mode !== currentMode && (
          <Button onClick={handleSave} disabled={saving} className="w-full">
            {saving
              ? (isRu ? 'Сохранение...' : 'Saving...')
              : (isRu ? 'Сохранить режим' : 'Save sync mode')}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
