/**
 * ServicesStep — Cleaning, linen, transfers, extra services
 */
import React, { memo } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sparkles, Truck, Clock } from 'lucide-react';
import { TranslatableInput } from '@/components/forms/TranslatableInput';

interface ServicesData {
  cleaning_included?: boolean;
  cleaning_frequency?: string;
  extra_cleaning_price?: number;
  linen_change_price?: number;
  linen_change_frequency?: string;
  early_checkin_price?: number;
  late_checkout_price?: number;
  transfer_available?: boolean;
  transfer_airport_price?: number;
  transfer_notes?: string;
  transfer_notes_ru?: string;
  extra_guest_price?: number;
  extra_guest_threshold?: number;
}

interface ServicesStepProps {
  data: ServicesData;
  onChange: (updates: Partial<ServicesData>) => void;
}

export const ServicesStep = memo(function ServicesStep({ data, onChange }: ServicesStepProps) {
  const { language } = useLanguage();
  const isRu = language === 'ru';

  return (
    <div className="space-y-4">
      {/* Cleaning */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-success" />
            {isRu ? 'Уборка и бельё' : 'Cleaning & Linen'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <Label>{isRu ? 'Уборка включена' : 'Cleaning included'}</Label>
            <Switch
              checked={data.cleaning_included ?? false}
              onCheckedChange={v => onChange({ cleaning_included: v })}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">{isRu ? 'Частота' : 'Frequency'}</Label>
              <Select value={data.cleaning_frequency || ''} onValueChange={v => onChange({ cleaning_frequency: v })}>
                <SelectTrigger><SelectValue placeholder={isRu ? 'Выбрать' : 'Select'} /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">{isRu ? 'Ежедневно' : 'Daily'}</SelectItem>
                  <SelectItem value="every_3_days">{isRu ? 'Каждые 3 дня' : 'Every 3 days'}</SelectItem>
                  <SelectItem value="weekly">{isRu ? 'Еженедельно' : 'Weekly'}</SelectItem>
                  <SelectItem value="checkout_only">{isRu ? 'Только при выезде' : 'Checkout only'}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">{isRu ? 'Допол. уборка (฿)' : 'Extra cleaning (฿)'}</Label>
              <Input
                type="number"
                value={data.extra_cleaning_price ?? ''}
                onChange={e => onChange({ extra_cleaning_price: e.target.value ? Number(e.target.value) : undefined })}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">{isRu ? 'Смена белья (฿)' : 'Linen change (฿)'}</Label>
              <Input
                type="number"
                value={data.linen_change_price ?? ''}
                onChange={e => onChange({ linen_change_price: e.target.value ? Number(e.target.value) : undefined })}
              />
            </div>
            <div>
              <Label className="text-xs">{isRu ? 'Частота смены' : 'Change frequency'}</Label>
              <Select value={data.linen_change_frequency || ''} onValueChange={v => onChange({ linen_change_frequency: v })}>
                <SelectTrigger><SelectValue placeholder={isRu ? 'Выбрать' : 'Select'} /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">{isRu ? 'Ежедневно' : 'Daily'}</SelectItem>
                  <SelectItem value="every_3_days">{isRu ? 'Каждые 3 дня' : 'Every 3 days'}</SelectItem>
                  <SelectItem value="weekly">{isRu ? 'Еженедельно' : 'Weekly'}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Check-in/out extras */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Clock className="h-4 w-4 text-warning" />
            {isRu ? 'Ранний заезд / Поздний выезд' : 'Early Check-in / Late Checkout'}
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-xs">{isRu ? 'Ранний заезд (฿)' : 'Early check-in (฿)'}</Label>
            <Input
              type="number"
              value={data.early_checkin_price ?? ''}
              onChange={e => onChange({ early_checkin_price: e.target.value ? Number(e.target.value) : undefined })}
            />
          </div>
          <div>
            <Label className="text-xs">{isRu ? 'Поздний выезд (฿)' : 'Late checkout (฿)'}</Label>
            <Input
              type="number"
              value={data.late_checkout_price ?? ''}
              onChange={e => onChange({ late_checkout_price: e.target.value ? Number(e.target.value) : undefined })}
            />
          </div>
        </CardContent>
      </Card>

      {/* Extra guests */}
      <Card>
        <CardContent className="p-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">{isRu ? 'Допл. гость после (чел.)' : 'Extra guest after (#)'}</Label>
              <Input
                type="number"
                value={data.extra_guest_threshold ?? ''}
                onChange={e => onChange({ extra_guest_threshold: e.target.value ? Number(e.target.value) : undefined })}
              />
            </div>
            <div>
              <Label className="text-xs">{isRu ? 'Допл. за гостя (฿)' : 'Extra guest fee (฿)'}</Label>
              <Input
                type="number"
                value={data.extra_guest_price ?? ''}
                onChange={e => onChange({ extra_guest_price: e.target.value ? Number(e.target.value) : undefined })}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Transfer */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Truck className="h-4 w-4 text-info" />
            {isRu ? 'Трансфер' : 'Transfer'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <Label>{isRu ? 'Трансфер доступен' : 'Transfer available'}</Label>
            <Switch
              checked={data.transfer_available ?? false}
              onCheckedChange={v => onChange({ transfer_available: v })}
            />
          </div>
          {data.transfer_available && (
            <>
              <div>
                <Label className="text-xs">{isRu ? 'Аэропорт (฿)' : 'Airport (฿)'}</Label>
                <Input
                  type="number"
                  value={data.transfer_airport_price ?? ''}
                  onChange={e => onChange({ transfer_airport_price: e.target.value ? Number(e.target.value) : undefined })}
                />
              </div>
              <TranslatableInput
                label={isRu ? 'Примечания' : 'Transfer notes'}
                value={data.transfer_notes ?? ''}
                translatedValue={data.transfer_notes_ru ?? ''}
                onChange={v => onChange({ transfer_notes: v })}
                onTranslatedChange={v => onChange({ transfer_notes_ru: v })}
                multiline
                rows={2}
              />
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
});
