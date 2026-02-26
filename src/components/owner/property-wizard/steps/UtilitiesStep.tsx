/**
 * UtilitiesStep — Electricity, water, internet settings for property
 */
import React, { memo } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Zap, Droplets, Wifi } from 'lucide-react';
import { TranslatableInput } from '@/components/forms/TranslatableInput';

interface UtilitiesData {
  electricity_included?: boolean;
  electricity_unit_price?: number;
  electricity_provider?: string;
  electricity_metering?: string;
  electricity_notes?: string;
  electricity_notes_ru?: string;
  water_included?: boolean;
  water_unit_price?: number;
  water_notes?: string;
  water_notes_ru?: string;
  internet_speed?: string;
  internet_provider?: string;
}

interface UtilitiesStepProps {
  data: UtilitiesData;
  onChange: (updates: Partial<UtilitiesData>) => void;
}

export const UtilitiesStep = memo(function UtilitiesStep({ data, onChange }: UtilitiesStepProps) {
  const { language } = useLanguage();
  const isRu = language === 'ru';

  return (
    <div className="space-y-4">
      {/* Electricity */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Zap className="h-4 w-4 text-warning" />
            {isRu ? 'Электричество' : 'Electricity'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <Label>{isRu ? 'Включено в стоимость' : 'Included in price'}</Label>
            <Switch
              checked={data.electricity_included ?? false}
              onCheckedChange={v => onChange({ electricity_included: v })}
            />
          </div>
          {!data.electricity_included && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">{isRu ? 'Цена за юнит (฿)' : 'Unit price (฿)'}</Label>
                <Input
                  type="number"
                  step="0.1"
                  value={data.electricity_unit_price ?? ''}
                  onChange={e => onChange({ electricity_unit_price: e.target.value ? Number(e.target.value) : undefined })}
                />
              </div>
              <div>
                <Label className="text-xs">{isRu ? 'Учёт' : 'Metering'}</Label>
                <Select value={data.electricity_metering || ''} onValueChange={v => onChange({ electricity_metering: v })}>
                  <SelectTrigger><SelectValue placeholder={isRu ? 'Выбрать' : 'Select'} /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="own_meter">{isRu ? 'Свой счётчик' : 'Own meter'}</SelectItem>
                    <SelectItem value="shared_meter">{isRu ? 'Общий счётчик' : 'Shared meter'}</SelectItem>
                    <SelectItem value="flat_rate">{isRu ? 'Фиксированная ставка' : 'Flat rate'}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          <div>
            <Label className="text-xs">{isRu ? 'Провайдер' : 'Provider'}</Label>
            <Input
              value={data.electricity_provider ?? ''}
              onChange={e => onChange({ electricity_provider: e.target.value })}
              placeholder="PEA, MEA..."
            />
          </div>
          <TranslatableInput
            label={isRu ? 'Примечания' : 'Notes'}
            value={data.electricity_notes ?? ''}
            translatedValue={data.electricity_notes_ru ?? ''}
            onChange={v => onChange({ electricity_notes: v })}
            onTranslatedChange={v => onChange({ electricity_notes_ru: v })}
            multiline
            rows={2}
          />
        </CardContent>
      </Card>

      {/* Water */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Droplets className="h-4 w-4 text-info" />
            {isRu ? 'Вода' : 'Water'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <Label>{isRu ? 'Включено в стоимость' : 'Included in price'}</Label>
            <Switch
              checked={data.water_included ?? false}
              onCheckedChange={v => onChange({ water_included: v })}
            />
          </div>
          {!data.water_included && (
            <div>
              <Label className="text-xs">{isRu ? 'Цена за юнит (฿)' : 'Unit price (฿)'}</Label>
              <Input
                type="number"
                step="0.1"
                value={data.water_unit_price ?? ''}
                onChange={e => onChange({ water_unit_price: e.target.value ? Number(e.target.value) : undefined })}
              />
            </div>
          )}
          <TranslatableInput
            label={isRu ? 'Примечания' : 'Notes'}
            value={data.water_notes ?? ''}
            translatedValue={data.water_notes_ru ?? ''}
            onChange={v => onChange({ water_notes: v })}
            onTranslatedChange={v => onChange({ water_notes_ru: v })}
            multiline
            rows={2}
          />
        </CardContent>
      </Card>

      {/* Internet */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Wifi className="h-4 w-4 text-primary" />
            {isRu ? 'Интернет' : 'Internet'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">{isRu ? 'Скорость' : 'Speed'}</Label>
              <Input
                value={data.internet_speed ?? ''}
                onChange={e => onChange({ internet_speed: e.target.value })}
                placeholder="100 Mbps"
              />
            </div>
            <div>
              <Label className="text-xs">{isRu ? 'Провайдер' : 'Provider'}</Label>
              <Input
                value={data.internet_provider ?? ''}
                onChange={e => onChange({ internet_provider: e.target.value })}
                placeholder="3BB, True, AIS..."
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
});
