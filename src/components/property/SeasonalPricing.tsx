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
  priceModifier: number; // percentage: 130 = +30%, 80 = -20%
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
  { value: 'high', labelEn: 'High Season', labelRu: 'Высокий сезон', icon: Sun, color: 'text-orange-500' },
  { value: 'low', labelEn: 'Low Season', labelRu: 'Низкий сезон', icon: Snowflake, color: 'text-blue-500' },
  { value: 'holiday', labelEn: 'Holiday', labelRu: 'Праздник', icon: Sparkles, color: 'text-purple-500' },
  { value: 'custom', labelEn: 'Custom', labelRu: 'Особый', icon: Calendar, color: 'text-green-500' },
];

const months = [
  { value: 1, labelEn: 'January', labelRu: 'Январь' },
  { value: 2, labelEn: 'February', labelRu: 'Февраль' },
  { value: 3, labelEn: 'March', labelRu: 'Март' },
  { value: 4, labelEn: 'April', labelRu: 'Апрель' },
  { value: 5, labelEn: 'May', labelRu: 'Май' },
  { value: 6, labelEn: 'June', labelRu: 'Июнь' },
  { value: 7, labelEn: 'July', labelRu: 'Июль' },
  { value: 8, labelEn: 'August', labelRu: 'Август' },
  { value: 9, labelEn: 'September', labelRu: 'Сентябрь' },
  { value: 10, labelEn: 'October', labelRu: 'Октябрь' },
  { value: 11, labelEn: 'November', labelRu: 'Ноябрь' },
  { value: 12, labelEn: 'December', labelRu: 'Декабрь' },
];

// Preset seasons for Thailand
const presetSeasons: Omit<SeasonalPrice, 'id'>[] = [
  {
    name: 'High Season (Dec-Feb)',
    nameRu: 'Высокий сезон (Дек-Фев)',
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
    name: 'Low Season (May-Oct)',
    nameRu: 'Низкий сезон (Май-Окт)',
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
      ? { ...preset, id: crypto.randomUUID() }
      : {
          id: crypto.randomUUID(),
          name: isRu ? 'Новый сезон' : 'New Season',
          type: 'custom',
          startMonth: 1,
          startDay: 1,
          endMonth: 1,
          endDay: 31,
          priceModifier: 100,
        };
    onChange([...seasons, newSeason]);
  };

  const removeSeason = (id: string) => {
    onChange(seasons.filter(s => s.id !== id));
  };

  const updateSeason = (id: string, updates: Partial<SeasonalPrice>) => {
    onChange(seasons.map(s => s.id === id ? { ...s, ...updates } : s));
  };

  const calculatePrice = (modifier: number) => {
    return Math.round(basePrice * modifier / 100);
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
    return `${season.startDay} ${startLabel} - ${season.endDay} ${endLabel}`;
  };

  return (
    <Card className={cn("", className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <div>
          <CardTitle className="text-lg">
            {isRu ? 'Сезонные цены' : 'Seasonal Pricing'}
          </CardTitle>
          <p className="text-sm text-muted-foreground mt-1">
            {isRu ? 'Базовая цена:' : 'Base price:'} {basePrice.toLocaleString()} {currency}/{isRu ? 'ночь' : 'night'}
          </p>
        </div>
        <Button onClick={() => addSeason()} size="sm" variant="outline">
          <Plus className="h-4 w-4 mr-1" />
          {isRu ? 'Добавить' : 'Add Season'}
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Quick Add Presets */}
        {seasons.length === 0 && (
          <div className="border-2 border-dashed rounded-lg p-4 space-y-3">
            <p className="text-sm text-muted-foreground text-center">
              {isRu ? 'Быстрое добавление популярных сезонов для Таиланда:' : 'Quick add popular seasons for Thailand:'}
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
          const calculatedPrice = calculatePrice(season.priceModifier);
          const priceDiff = calculatedPrice - basePrice;
          
          return (
            <div key={season.id} className="border rounded-lg p-4 space-y-4">
              {/* Season Header */}
              <div className="flex items-center gap-3">
                <div className={cn("p-2 bg-muted rounded-lg", getSeasonColor(season.type))}>
                  <SeasonIcon className="h-5 w-5" />
                </div>
                <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs text-muted-foreground">
                      {isRu ? 'Название' : 'Name'}
                    </Label>
                    <Input
                      value={season.name}
                      onChange={(e) => updateSeason(season.id, { name: e.target.value })}
                      className="h-9"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">
                      {isRu ? 'Тип' : 'Type'}
                    </Label>
                    <Select
                      value={season.type}
                      onValueChange={(value) => updateSeason(season.id, { type: value as SeasonalPrice['type'] })}
                    >
                      <SelectTrigger className="h-9">
                        <SelectValue />
                      </SelectTrigger>
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
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>

              {/* Date Range */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div>
                  <Label className="text-xs text-muted-foreground">
                    {isRu ? 'Начало: месяц' : 'Start: month'}
                  </Label>
                  <Select
                    value={season.startMonth.toString()}
                    onValueChange={(value) => updateSeason(season.id, { startMonth: Number(value) })}
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue />
                    </SelectTrigger>
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
                  <Label className="text-xs text-muted-foreground">
                    {isRu ? 'день' : 'day'}
                  </Label>
                  <Input
                    type="number"
                    min={1}
                    max={31}
                    value={season.startDay}
                    onChange={(e) => updateSeason(season.id, { startDay: Number(e.target.value) })}
                    className="h-9"
                  />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">
                    {isRu ? 'Конец: месяц' : 'End: month'}
                  </Label>
                  <Select
                    value={season.endMonth.toString()}
                    onValueChange={(value) => updateSeason(season.id, { endMonth: Number(value) })}
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue />
                    </SelectTrigger>
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
                  <Label className="text-xs text-muted-foreground">
                    {isRu ? 'день' : 'day'}
                  </Label>
                  <Input
                    type="number"
                    min={1}
                    max={31}
                    value={season.endDay}
                    onChange={(e) => updateSeason(season.id, { endDay: Number(e.target.value) })}
                    className="h-9"
                  />
                </div>
              </div>

              {/* Pricing */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs text-muted-foreground">
                    {isRu ? 'Модификатор цены (%)' : 'Price modifier (%)'}
                  </Label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      min={10}
                      max={500}
                      value={season.priceModifier}
                      onChange={(e) => updateSeason(season.id, { priceModifier: Number(e.target.value) })}
                      className="h-9"
                    />
                    <Badge 
                      variant={priceDiff >= 0 ? 'default' : 'secondary'}
                      className="whitespace-nowrap"
                    >
                      {priceDiff >= 0 ? '+' : ''}{priceDiff.toLocaleString()} {currency}
                    </Badge>
                  </div>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">
                    {isRu ? 'Мин. ночей' : 'Min nights'}
                  </Label>
                  <Input
                    type="number"
                    min={1}
                    placeholder="1"
                    value={season.minNights ?? ''}
                    onChange={(e) => updateSeason(season.id, { minNights: e.target.value ? Number(e.target.value) : undefined })}
                    className="h-9"
                  />
                </div>
              </div>

              {/* Summary */}
              <div className="flex items-center justify-between text-sm bg-muted/50 rounded-lg px-3 py-2">
                <span className="text-muted-foreground">
                  {formatDateRange(season)}
                </span>
                <span className="font-medium">
                  {calculatedPrice.toLocaleString()} {currency}/{isRu ? 'ночь' : 'night'}
                </span>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
