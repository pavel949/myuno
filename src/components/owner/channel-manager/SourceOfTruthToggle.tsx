import { useState } from 'react';
import { logger } from '@/lib/logger';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertCircle, Crown, Download, Upload, Home, ChevronDown, ChevronUp } from 'lucide-react';
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
  const [expanded, setExpanded] = useState(false);

  const labels: Record<SyncMode, { title: string; shortDesc: string; desc: string }> = {
    import_only: {
      title: isRu ? 'Только импорт' : 'Import Only',
      shortDesc: isRu ? 'Бронирования из OTA, цены — на площадках' : 'Bookings from OTAs, prices on platforms',
      desc: isRu
        ? 'Бронирования подтягиваются из OTA через iCal. Цены и доступность управляются на каждой площадке отдельно.'
        : 'Bookings pulled from OTAs via iCal. Prices and availability managed on each platform separately.',
    },
    myuno_master: {
      title: isRu ? 'myUNO — главный' : 'myUNO is Master',
      shortDesc: isRu ? 'Цены и календарь из myUNO → на площадки' : 'Prices & calendar from myUNO → to platforms',
      desc: isRu
        ? 'Цены и календарь управляются в myUNO и автоматически отправляются на все подключённые площадки.'
        : 'Prices & calendar managed in myUNO and automatically pushed to all connected platforms.',
    },
    external_master: {
      title: isRu ? 'OTA — главный' : 'OTA is Master',
      shortDesc: isRu ? 'Площадка (Airbnb/Booking) управляет данными' : 'Platform (Airbnb/Booking) controls data',
      desc: isRu
        ? 'Одна из площадок (Airbnb, Booking.com) является главной. myUNO только импортирует данные.'
        : 'One OTA platform (Airbnb, Booking.com) is the master. myUNO only imports data.',
    },
  };

  const currentLabel = labels[currentMode];

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await (supabase as any)
        .from('properties')
        .update({ sync_mode: mode })
        .eq('id', propertyId);

      if (error) throw error;

      onModeChanged?.(mode);
      setExpanded(false);
      toast.success(isRu ? 'Режим синхронизации обновлён' : 'Sync mode updated');
    } catch (err) {
      logger.error('Failed to update sync mode:', err);
      toast.error(isRu ? 'Ошибка сохранения' : 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className={cn(
      'transition-all',
      expanded ? 'border-primary/30 shadow-sm' : 'border-border'
    )}>
      {/* Collapsed header — always visible */}
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-3 p-4 text-left hover:bg-muted/30 transition-colors rounded-t-xl"
      >
        <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
          <Home className="h-4 w-4 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground truncate">
            {propertyTitle || propertyId}
          </p>
          <div className="flex items-center gap-2 mt-0.5">
            <Badge variant={SYNC_MODES.find(m => m.value === currentMode)?.badgeVariant || 'secondary'} className="text-xs">
              {SYNC_MODES.find(m => m.value === currentMode)?.badge}
            </Badge>
            <span className="text-xs text-muted-foreground truncate">
              {currentLabel.shortDesc}
            </span>
          </div>
        </div>
        {expanded ? (
          <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0" />
        ) : (
          <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
        )}
      </button>

      {/* Expanded — mode selector */}
      {expanded && (
        <CardContent className="pt-0 pb-4 space-y-3">
          <p className="text-xs text-muted-foreground px-1">
            {isRu
              ? 'Выберите, откуда берутся цены и доступность для этого объекта:'
              : 'Choose where prices and availability come from for this property:'}
          </p>

          <RadioGroup value={mode} onValueChange={(v) => setMode(v as SyncMode)} className="space-y-2">
            {SYNC_MODES.map(({ value, icon: Icon, badge, badgeVariant }) => (
              <div
                key={value}
                className={cn(
                  'flex items-start gap-3 rounded-lg border p-3 cursor-pointer transition-colors',
                  mode === value ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/40'
                )}
                onClick={() => setMode(value)}
              >
                <RadioGroupItem value={value} id={`${propertyId}-${value}`} className="mt-0.5" />
                <div className="flex-1 space-y-0.5">
                  <div className="flex items-center gap-2">
                    <Icon className="h-4 w-4 text-muted-foreground" />
                    <Label htmlFor={`${propertyId}-${value}`} className="font-medium cursor-pointer text-sm">
                      {labels[value].title}
                    </Label>
                    <Badge variant={badgeVariant} className="text-[10px] px-1.5 py-0">{badge}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">{labels[value].desc}</p>
                </div>
              </div>
            ))}
          </RadioGroup>

          {mode === 'myuno_master' && (
            <div className="flex items-start gap-2 rounded-md bg-warning/10 border border-warning/30 p-3">
              <AlertCircle className="h-4 w-4 text-warning mt-0.5 shrink-0" />
              <p className="text-xs text-muted-foreground">
                {isRu
                  ? 'Для полной синхронизации цен на OTA потребуется подключение Rentals United. iCal экспорт обновит только календарь доступности.'
                  : 'Full price sync to OTAs requires Rentals United connection. iCal export will only update availability calendar.'}
              </p>
            </div>
          )}

          {mode !== currentMode && (
            <Button onClick={handleSave} disabled={saving} size="sm" className="w-full">
              {saving
                ? (isRu ? 'Сохранение...' : 'Saving...')
                : (isRu ? 'Сохранить режим' : 'Save sync mode')}
            </Button>
          )}
        </CardContent>
      )}
    </Card>
  );
}
