import React, { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  STAY_RULE_LIMITS,
  validateStayRules,
  describeStayRulesDbError,
  type StayRuleField,
} from '@/lib/property/stayRulesSchema';

/**
 * Admin editor for property-level stay rules stored on public.properties.
 * All values are optional integers; empty input clears the value (NULL).
 * Ranges mirror the database CHECK constraints (see stayRulesSchema.ts).
 */
type StayRulesForm = Record<StayRuleField, string>;


const EMPTY_FORM: StayRulesForm = {
  min_stay_nights: '',
  max_stay_nights: '',
  advance_notice_hours: '',
  preparation_days: '',
  booking_window_months: '',
};

const FIELDS: Array<{
  key: keyof StayRulesForm;
  labelRu: string;
  labelEn: string;
  hintRu: string;
  hintEn: string;
}> = [
  {
    key: 'min_stay_nights',
    labelRu: 'Минимум ночей',
    labelEn: 'Minimum nights',
    hintRu: 'Короче этого срока бронирование недоступно',
    hintEn: 'Shorter stays cannot be booked',
  },
  {
    key: 'max_stay_nights',
    labelRu: 'Максимум ночей',
    labelEn: 'Maximum nights',
    hintRu: 'Пусто — ограничения нет',
    hintEn: 'Empty means no limit',
  },
  {
    key: 'advance_notice_hours',
    labelRu: 'Предупреждение, часов',
    labelEn: 'Advance notice, hours',
    hintRu: 'За сколько часов до заезда можно бронировать',
    hintEn: 'How long before check-in a booking is allowed',
  },
  {
    key: 'preparation_days',
    labelRu: 'Дней на подготовку',
    labelEn: 'Preparation days',
    hintRu: 'Буфер между бронированиями',
    hintEn: 'Buffer between bookings',
  },
  {
    key: 'booking_window_months',
    labelRu: 'Окно бронирования, месяцев',
    labelEn: 'Booking window, months',
    hintRu: 'Насколько далеко вперёд открыт календарь',
    hintEn: 'How far ahead the calendar is open',
  },
];

interface PropertyStayRulesPanelProps {
  propertyId: string;
}

export function PropertyStayRulesPanel({ propertyId }: PropertyStayRulesPanelProps) {
  const { language } = useLanguage();
  const isRussian = language === 'ru';
  const queryClient = useQueryClient();

  const [form, setForm] = useState<StayRulesForm>(EMPTY_FORM);
  const [errors, setErrors] = useState<Partial<Record<keyof StayRulesForm, string>>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('properties')
          .select(
            'min_stay_nights, max_stay_nights, advance_notice_hours, preparation_days, booking_window_months',
          )
          .eq('id', propertyId)
          .maybeSingle();

        if (error) throw error;
        if (cancelled) return;

        const row = (data ?? {}) as Record<string, number | null>;
        setForm({
          min_stay_nights: row.min_stay_nights?.toString() ?? '',
          max_stay_nights: row.max_stay_nights?.toString() ?? '',
          advance_notice_hours: row.advance_notice_hours?.toString() ?? '',
          preparation_days: row.preparation_days?.toString() ?? '',
          booking_window_months: row.booking_window_months?.toString() ?? '',
        });
      } catch {
        if (!cancelled) {
          toast.error(
            isRussian ? 'Не удалось загрузить условия аренды' : 'Could not load stay rules',
          );
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [propertyId, isRussian]);

  const handleChange = (key: keyof StayRulesForm, raw: string) => {
    const next = raw.replace(/[^\d]/g, '').slice(0, 6);
    setForm((prev) => ({ ...prev, [key]: next }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const handleSave = async () => {
    const lang = (language === 'th' ? 'th' : isRussian ? 'ru' : 'en') as 'ru' | 'en' | 'th';
    const result = validateStayRules(form, lang);
    if (!result.ok || !result.values) {
      setErrors(result.errors);
      toast.error(isRussian ? 'Проверьте значения полей' : 'Check the field values');
      return;
    }

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('properties')
        .update({ ...result.values, updated_at: new Date().toISOString() })
        .eq('id', propertyId);

      if (error) throw error;

      setErrors({});
      queryClient.invalidateQueries({ queryKey: ['admin-properties'] });
      queryClient.invalidateQueries({ queryKey: ['property', propertyId] });
      queryClient.invalidateQueries({ queryKey: ['properties'] });
      toast.success(isRussian ? 'Условия аренды сохранены' : 'Stay rules saved');
    } catch (err) {
      const raw = err instanceof Error ? err.message : String(err);
      const friendly = describeStayRulesDbError(raw, lang);
      toast.error(friendly ?? (isRussian ? 'Не удалось сохранить' : 'Could not save'));
    } finally {
      setIsSaving(false);
    }
  };


  if (isLoading) {
    return (
      <div className="space-y-3">
        {FIELDS.map((f) => (
          <Skeleton key={f.key} className="h-16 w-full" />
        ))}
      </div>
    );
  }

  return (
    <Card>
      <CardContent className="space-y-5 pt-6">
        {FIELDS.map((field) => (
          <div key={field.key} className="space-y-1.5">
            <Label htmlFor={`stay-rule-${field.key}`}>
              {isRussian ? field.labelRu : field.labelEn}
            </Label>
            <Input
              id={`stay-rule-${field.key}`}
              inputMode="numeric"
              min={STAY_RULE_LIMITS[field.key].min}
              max={STAY_RULE_LIMITS[field.key].max}
              value={form[field.key]}
              onChange={(e) => handleChange(field.key, e.target.value)}
              placeholder={isRussian ? 'Не задано' : 'Not set'}
              aria-invalid={!!errors[field.key]}
            />
            <p className="text-xs text-muted-foreground">
              {isRussian ? field.hintRu : field.hintEn}
              {' · '}
              {STAY_RULE_LIMITS[field.key].min}–{STAY_RULE_LIMITS[field.key].max}
            </p>

            {errors[field.key] && (
              <p className="text-xs text-destructive">{errors[field.key]}</p>
            )}
          </div>
        ))}

        <Button onClick={handleSave} disabled={isSaving} className="w-full">
          {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isRussian ? 'Сохранить условия' : 'Save stay rules'}
        </Button>
      </CardContent>
    </Card>
  );
}
