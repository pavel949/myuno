import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, Sun, Snowflake, Sparkles, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface SeasonalPrice {
  id: string;
  name: string;
  nameRu?: string;
  type: 'high' | 'low' | 'holiday' | 'custom';
  startMonth: number; // 1-12
  startDay: number;
  endMonth: number;
  endDay: number;
  /** Direct price per night for this season (THB). Takes priority if set. */
  pricePerNight?: number;
  /** Legacy: percentage modifier (130 = +30%). Kept for backward compat. */
  priceModifier: number;
  minNights?: number;
}

interface SeasonalPricingProps {
  basePrice: number;
  currency?: string;
  seasons: SeasonalPrice[];
  onChange: (seasons: SeasonalPrice[]) => void;
  className?: string;
}

const seasonTypes = [
  { value: 'high', labelEn: 'High Season', labelRu: 'Высокий сезон', icon: Sun, color: 'text-warning' },
  { value: 'low', labelEn: 'Low Season', labelRu: 'Низкий сезон', icon: Snowflake, color: 'text-primary' },
  { value: 'holiday', labelEn: 'Holiday', labelRu: 'Праздник', icon: Sparkles, color: 'text-accent' },
  { value: 'custom', labelEn: 'Custom', labelRu: 'Особый', icon: Calendar, color: 'text-success' },
];

const months = [
  { value: 1, labelEn: 'Jan', labelRu: 'Янв' },
  { value: 2, labelEn: 'Feb', labelRu: 'Фев' },
  { value: 3, labelEn: 'Mar', labelRu: 'Мар' },
  { value: 4, labelEn: 'Apr', labelRu: 'Апр' },
  { value: 5, labelEn: 'May', labelRu: 'Май' },
  { value: 6, labelEn: 'Jun', labelRu: 'Июн' },
  { value: 7, labelEn: 'Jul', labelRu: 'Июл' },
  { value: 8, labelEn: 'Aug', labelRu: 'Авг' },
  { value: 9, labelEn: 'Sep', labelRu: 'Сен' },
  { value: 10, labelEn: 'Oct', labelRu: 'Окт' },
  { value: 11, labelEn: 'Nov', labelRu: 'Ноя' },
  { value: 12, labelEn: 'Dec', labelRu: 'Дек' },
];

// Preset seasons for Thailand
const presetSeasons: Omit<SeasonalPrice, 'id'>[] = [
  {
    name: 'High Season',
    nameRu: 'Высокий сезон',
    type: 'high',
    startMonth: 12,
    startDay: 1,
    endMonth: 2,
    endDay: 28,
    priceModifier: 130,
    minNights: 3,
  },
  {
    name: 'New Year',
    nameRu: 'Новый год',
    type: 'holiday',
    startMonth: 12,
    startDay: 20,
    endMonth: 1,
    endDay: 10,
    priceModifier: 150,
    minNights: 5,
  },
  {
    name: 'Low Season',
    nameRu: 'Низкий сезон',
    type: 'low',
    startMonth: 5,
    startDay: 1,
    endMonth: 10,
    endDay: 31,
    priceModifier: 80,
  },
];

export function SeasonalPricing({ 
  basePrice, 
  currency = 'THB', 
  seasons, 
  onChange,
  className 
}: SeasonalPricingProps) {
  const { language } = useLanguage();
  const isRu = language === 'ru';

  const addSeason = (preset?: Omit<SeasonalPrice, 'id'>) => {
    const newSeason: SeasonalPrice = preset 
      ? { ...preset, id: crypto.randomUUID(), pricePerNight: Math.round(basePrice * preset.priceModifier / 100) }
      : {
          id: crypto.randomUUID(),
          name: isRu ? 'Новый сезон' : 'New Season',
          type: 'custom',
          startMonth: 1,
          startDay: 1,
          endMonth: 1,
          endDay: 31,
          priceModifier: 100,
          pricePerNight: basePrice,
        };
    onChange([...seasons, newSeason]);
  };

  const removeSeason = (id: string) => {
    onChange(seasons.filter(s => s.id !== id));
  };

  const updateSeason = (id: string, updates: Partial<SeasonalPrice>) => {
    onChange(seasons.map(s => {
      if (s.id !== id) return s;
      const updated = { ...s, ...updates };
      // Sync priceModifier from pricePerNight for backward compat
      if (updates.pricePerNight !== undefined && basePrice > 0) {
        updated.priceModifier = Math.round((updates.pricePerNight / basePrice) * 100);
      }
      return updated;
    }));
  };

  /** Resolve the effective price for a season */
  const getEffectivePrice = (season: SeasonalPrice) => {
    if (season.pricePerNight !== undefined && season.pricePerNight > 0) return season.pricePerNight;
    return Math.round(basePrice * season.priceModifier / 100);
  };

  const getSeasonIcon = (type: string) => {
    const season = seasonTypes.find(s => s.value === type);
    return season?.icon || Calendar;
  };

  const getSeasonColor = (type: string) => {
    const season = seasonTypes.find(s => s.value === type);
    return season?.color || 'text-muted-foreground';
  };

  const formatDateRange = (season: SeasonalPrice) => {
    const startMonth = months.find(m => m.value === season.startMonth);
    const endMonth = months.find(m => m.value === season.endMonth);
    const startLabel = isRu ? startMonth?.labelRu : startMonth?.labelEn;
    const endLabel = isRu ? endMonth?.labelRu : endMonth?.labelEn;
    return `${season.startDay} ${startLabel} — ${season.endDay} ${endLabel}`;
  };

  return (
    <Card className={cn("", className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <div>
          <CardTitle className="text-lg">
            {isRu ? 'Сезонные цены' : 'Seasonal Pricing'}
          </CardTitle>
          <p className="text-sm text-muted-foreground mt-1">
            {isRu ? 'Базовая:' : 'Base:'} {basePrice.toLocaleString()} {currency}/{isRu ? 'ночь' : 'night'}
          </p>
        </div>
        <Button onClick={() => addSeason()} size="sm" variant="outline">
          <Plus className="h-4 w-4 mr-1" />
          {isRu ? 'Добавить' : 'Add'}
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Quick Add Presets */}
        {seasons.length === 0 && (
          <div className="border-2 border-dashed rounded-lg p-4 space-y-3">
            <p className="text-sm text-muted-foreground text-center">
              {isRu ? 'Быстрое добавление:' : 'Quick add:'}
            </p>
            <div className="flex flex-wrap gap-2 justify-center">
              {presetSeasons.map((preset, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  onClick={() => addSeason(preset)}
                >
                  {isRu ? preset.nameRu : preset.name}
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Season List */}
        {seasons.map((season) => {
          const SeasonIcon = getSeasonIcon(season.type);
          const effectivePrice = getEffectivePrice(season);
          const priceDiff = effectivePrice - basePrice;
          
          return (
            <div key={season.id} className="border rounded-lg p-4 space-y-3">
              {/* Row 1: Name + Type + Delete */}
              <div className="flex items-start gap-2">
                <div className={cn("p-2 bg-muted rounded-lg mt-1", getSeasonColor(season.type))}>
                  <SeasonIcon className="h-4 w-4" />
                </div>
                <div className="flex-1 grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-xs text-muted-foreground">{isRu ? 'Название' : 'Name'}</Label>
                    <Input
                      value={season.name}
                      onChange={(e) => updateSeason(season.id, { name: e.target.value })}
                      className="h-8 text-sm"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">{isRu ? 'Тип' : 'Type'}</Label>
                    <Select
                      value={season.type}
                      onValueChange={(value) => updateSeason(season.id, { type: value as SeasonalPrice['type'] })}
                    >
                      <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {seasonTypes.map(st => (
                          <SelectItem key={st.value} value={st.value}>
                            {isRu ? st.labelRu : st.labelEn}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removeSeason(season.id)}
                  className="text-destructive hover:text-destructive h-8 w-8 mt-4"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>

              {/* Row 2: Date range — From / To */}
              <div className="grid grid-cols-4 gap-2">
                <div>
                  <Label className="text-xs text-muted-foreground">{isRu ? 'С: месяц' : 'From: month'}</Label>
                  <Select
                    value={season.startMonth.toString()}
                    onValueChange={(v) => updateSeason(season.id, { startMonth: Number(v) })}
                  >
                    <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {months.map(m => (
                        <SelectItem key={m.value} value={m.value.toString()}>
                          {isRu ? m.labelRu : m.labelEn}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">{isRu ? 'день' : 'day'}</Label>
                  <Input
                    type="number" min={1} max={31}
                    value={season.startDay}
                    onChange={(e) => updateSeason(season.id, { startDay: Number(e.target.value) })}
                    className="h-8 text-sm"
                  />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">{isRu ? 'По: месяц' : 'To: month'}</Label>
                  <Select
                    value={season.endMonth.toString()}
                    onValueChange={(v) => updateSeason(season.id, { endMonth: Number(v) })}
                  >
                    <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {months.map(m => (
                        <SelectItem key={m.value} value={m.value.toString()}>
                          {isRu ? m.labelRu : m.labelEn}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">{isRu ? 'день' : 'day'}</Label>
                  <Input
                    type="number" min={1} max={31}
                    value={season.endDay}
                    onChange={(e) => updateSeason(season.id, { endDay: Number(e.target.value) })}
                    className="h-8 text-sm"
                  />
                </div>
              </div>

              {/* Row 3: Price per night + Min nights */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs text-muted-foreground">
                    {isRu ? 'Цена за ночь (THB)' : 'Price per night (THB)'}
                  </Label>
                  <Input
                    type="number"
                    min={0}
                    value={season.pricePerNight ?? effectivePrice}
                    onChange={(e) => updateSeason(season.id, { pricePerNight: Number(e.target.value) || 0 })}
                    className="h-8 text-sm"
                    placeholder={basePrice.toString()}
                  />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">
                    {isRu ? 'Мин. ночей' : 'Min nights'}
                  </Label>
                  <Input
                    type="number" min={1}
                    placeholder="1"
                    value={season.minNights ?? ''}
                    onChange={(e) => updateSeason(season.id, { minNights: e.target.value ? Number(e.target.value) : undefined })}
                    className="h-8 text-sm"
                  />
                </div>
              </div>

              {/* Summary */}
              <div className="flex items-center justify-between text-sm bg-muted/50 rounded-lg px-3 py-2">
                <span className="text-muted-foreground">{formatDateRange(season)}</span>
                <div className="flex items-center gap-2">
                  <span className="font-semibold">
                    {effectivePrice.toLocaleString()} {currency}/{isRu ? 'ночь' : 'night'}
                  </span>
                  {priceDiff !== 0 && (
                    <Badge variant={priceDiff > 0 ? 'default' : 'secondary'} className="text-xs">
                      {priceDiff > 0 ? '+' : ''}{priceDiff.toLocaleString()}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
