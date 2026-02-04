import React, { useState, useMemo } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import { useUniversalLead, UniversalLeadInput } from '@/hooks/useUniversalLead';
import { useLeadConfigByVertical } from '@/hooks/useLeadConfigs';
import { 
  LeadVerticalConfig, 
  LeadFormField,
  LeadSource 
} from '@/lib/leadVerticalConfig';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { format } from 'date-fns';
import { ru, enUS } from 'date-fns/locale';
import { 
  CalendarIcon, 
  CheckCircle, 
  ArrowRight, 
  Minus, 
  Plus,
  Phone,
  MessageCircle,
  Mail,
  Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface UniversalLeadFormProps {
  verticalId: string;
  leadSource: LeadSource;
  entryPoint: string;
  preselectedRequestType?: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

type FormStep = 'request_type' | 'details' | 'contact';

export function UniversalLeadForm({
  verticalId,
  leadSource,
  entryPoint,
  preselectedRequestType,
  onSuccess,
  onCancel,
}: UniversalLeadFormProps) {
  const { language } = useLanguage();
  const { user } = useAuth();
  const { currencyInfo } = useCurrency();
  const { submitLead, isSubmitting } = useUniversalLead();
  const isRu = language === 'ru';

  // Use DB-driven config with fallback
  const { config: vertical, isLoading: configLoading } = useLeadConfigByVertical(verticalId);
  
  const [step, setStep] = useState<FormStep>(
    preselectedRequestType ? 'details' : 'request_type'
  );
  const [requestType, setRequestType] = useState(preselectedRequestType || '');
  const [isSuccess, setIsSuccess] = useState(false);

  // Form data
  const [formData, setFormData] = useState<Record<string, unknown>>({
    name: user?.user_metadata?.full_name || '',
    email: user?.email || '',
    phone: '',
    preferred_contact_method: 'whatsapp',
    guests_count: 2,
    children_count: 0,
  });

  const updateFormData = (key: string, value: unknown) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  // Loading state for config
  if (configLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!vertical) {
    return <div className="text-center text-muted-foreground">Vertical not found</div>;
  }

  const handleSubmit = async () => {
    if (!formData.name || !formData.phone) return;

    try {
      await submitLead.mutateAsync({
        vertical_id: verticalId,
        request_type: requestType,
        lead_source: leadSource,
        entry_point: entryPoint,
        name: formData.name as string,
        phone: formData.phone as string,
        email: formData.email as string || undefined,
        preferred_language: language,
        preferred_contact_method: formData.preferred_contact_method as string,
        currency: currencyInfo.code,
        guests_count: formData.guests_count as number || undefined,
        children_count: formData.children_count as number || undefined,
        notes: formData.notes as string || undefined,
        preferred_dates: formData.dates as any || undefined,
        budget_min: formData.budget_min as number || undefined,
        budget_max: formData.budget_max as number || undefined,
        property_types: formData.property_type as string[] || undefined,
        districts: formData.districts as string[] || undefined,
        vertical_metadata: formData,
      });

      setIsSuccess(true);
      onSuccess?.();
    } catch (error) {
      console.error('Submit error:', error);
    }
  };

  if (isSuccess) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mb-4">
          <CheckCircle className="w-8 h-8 text-green-500" />
        </div>
        <h3 className="text-lg font-semibold mb-2">
          {isRu ? 'Заявка отправлена!' : 'Request Sent!'}
        </h3>
        <p className="text-muted-foreground text-sm mb-4">
          {isRu 
            ? 'Мы свяжемся с вами в течение 2 часов' 
            : 'We will contact you within 2 hours'}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Trust Header */}
      <div className="flex items-center justify-center gap-3 py-2 text-[10px] text-muted-foreground border-b border-border/50 pb-4">
        <span className="flex items-center gap-1">
          <CheckCircle className="w-3.5 h-3.5 text-primary" />
          {isRu ? 'Проверено' : 'Verified'}
        </span>
        <span className="text-border">•</span>
        <span className="flex items-center gap-1">
          🔒
          {isRu ? 'Защита данных' : 'Data Protection'}
        </span>
        <span className="text-border">•</span>
        <span className="flex items-center gap-1">
          ⚡
          {isRu ? 'Ответ 24ч' : '24h Response'}
        </span>
      </div>
      
      {/* Progress indicator */}
      <div className="flex items-center gap-2">
        {['request_type', 'details', 'contact'].map((s, idx) => (
          <div
            key={s}
            className={cn(
              "flex-1 h-1 rounded-full transition-colors",
              ['request_type', 'details', 'contact'].indexOf(step) >= idx
                ? 'bg-primary'
                : 'bg-muted'
            )}
          />
        ))}
      </div>

      {/* Step 1: Request Type */}
      {step === 'request_type' && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-2xl">{vertical.icon}</span>
            <h3 className="font-semibold">
              {isRu ? vertical.nameRu : vertical.nameEn}
            </h3>
          </div>

          <p className="text-sm text-muted-foreground mb-4">
            {isRu ? 'Что именно вас интересует?' : 'What are you looking for?'}
          </p>

          <RadioGroup value={requestType} onValueChange={setRequestType}>
            {vertical.requestTypes.map((rt) => (
              <label key={rt.value} className="cursor-pointer">
                <Card className={cn(
                  "transition-all",
                  requestType === rt.value && "border-primary ring-2 ring-primary/20"
                )}>
                  <CardContent className="flex items-center gap-3 p-4">
                    <RadioGroupItem value={rt.value} />
                    <span className="font-medium">
                      {isRu ? rt.labelRu : rt.labelEn}
                    </span>
                  </CardContent>
                </Card>
              </label>
            ))}
          </RadioGroup>

          <Button
            className="w-full mt-4"
            size="lg"
            disabled={!requestType}
            onClick={() => setStep('details')}
          >
            {isRu ? 'Далее' : 'Continue'}
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      )}

      {/* Step 2: Details */}
      {step === 'details' && (
        <div className="space-y-4">
          <h3 className="font-semibold">
            {isRu ? 'Детали запроса' : 'Request Details'}
          </h3>

          {vertical.fields.map((field) => (
            <FormFieldRenderer
              key={field.key}
              field={field}
              value={formData[field.key]}
              onChange={(value) => updateFormData(field.key, value)}
              isRu={isRu}
            />
          ))}

          <div className="flex gap-2 mt-6">
            <Button variant="outline" onClick={() => setStep('request_type')}>
              {isRu ? 'Назад' : 'Back'}
            </Button>
            <Button className="flex-1" onClick={() => setStep('contact')}>
              {isRu ? 'Далее' : 'Continue'}
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      )}

      {/* Step 3: Contact */}
      {step === 'contact' && (
        <div className="space-y-4">
          <h3 className="font-semibold">
            {isRu ? 'Контактные данные' : 'Contact Information'}
          </h3>

          <div className="space-y-3">
            <div>
              <Label>{isRu ? 'Ваше имя' : 'Your Name'} *</Label>
              <Input
                value={formData.name as string}
                onChange={(e) => updateFormData('name', e.target.value)}
                placeholder={isRu ? 'Как к вам обращаться?' : 'How should we address you?'}
              />
            </div>

            <div>
              <Label>{isRu ? 'Телефон' : 'Phone'} *</Label>
              <Input
                type="tel"
                value={formData.phone as string}
                onChange={(e) => updateFormData('phone', e.target.value)}
                placeholder="+66..."
              />
            </div>

            <div>
              <Label>{isRu ? 'Email' : 'Email'}</Label>
              <Input
                type="email"
                value={formData.email as string}
                onChange={(e) => updateFormData('email', e.target.value)}
                placeholder="email@example.com"
              />
            </div>

            <div>
              <Label>{isRu ? 'Предпочтительный способ связи' : 'Preferred Contact Method'}</Label>
              <div className="flex gap-2 mt-2">
                {[
                  { value: 'whatsapp', icon: MessageCircle, label: 'WhatsApp' },
                  { value: 'phone', icon: Phone, label: isRu ? 'Звонок' : 'Call' },
                  { value: 'email', icon: Mail, label: 'Email' },
                ].map((method) => (
                  <Button
                    key={method.value}
                    type="button"
                    variant={formData.preferred_contact_method === method.value ? 'default' : 'outline'}
                    size="sm"
                    className="flex-1"
                    onClick={() => updateFormData('preferred_contact_method', method.value)}
                  >
                    <method.icon className="w-4 h-4 mr-1" />
                    {method.label}
                  </Button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex gap-2 mt-6">
            <Button variant="outline" onClick={() => setStep('details')}>
              {isRu ? 'Назад' : 'Back'}
            </Button>
            <Button 
              className="flex-1" 
              onClick={handleSubmit}
              disabled={!formData.name || !formData.phone || isSubmitting}
            >
              {isSubmitting 
                ? (isRu ? 'Отправка...' : 'Sending...') 
                : (isRu ? vertical.ctaTextRu : vertical.ctaTextEn)}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

// Dynamic form field renderer
function FormFieldRenderer({
  field,
  value,
  onChange,
  isRu,
}: {
  field: LeadFormField;
  value: unknown;
  onChange: (value: unknown) => void;
  isRu: boolean;
}) {
  const label = isRu ? field.labelRu : field.labelEn;
  const placeholder = isRu ? field.placeholderRu : field.placeholderEn;

  switch (field.type) {
    case 'text':
      return (
        <div>
          <Label>{label} {field.required && '*'}</Label>
          <Input
            value={(value as string) || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
          />
        </div>
      );

    case 'textarea':
      return (
        <div>
          <Label>{label}</Label>
          <Textarea
            value={(value as string) || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            rows={3}
          />
        </div>
      );

    case 'select':
      return (
        <div>
          <Label>{label} {field.required && '*'}</Label>
          <Select value={(value as string) || ''} onValueChange={onChange}>
            <SelectTrigger>
              <SelectValue placeholder={isRu ? 'Выберите...' : 'Select...'} />
            </SelectTrigger>
            <SelectContent>
              {field.options?.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {isRu ? opt.labelRu : opt.labelEn}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      );

    case 'multiselect':
      const selectedValues = (value as string[]) || [];
      return (
        <div>
          <Label>{label}</Label>
          <div className="flex flex-wrap gap-2 mt-2">
            {field.options?.map((opt) => {
              const isSelected = selectedValues.includes(opt.value);
              return (
                <Badge
                  key={opt.value}
                  variant={isSelected ? 'default' : 'outline'}
                  className="cursor-pointer"
                  onClick={() => {
                    if (isSelected) {
                      onChange(selectedValues.filter(v => v !== opt.value));
                    } else {
                      onChange([...selectedValues, opt.value]);
                    }
                  }}
                >
                  {isRu ? opt.labelRu : opt.labelEn}
                </Badge>
              );
            })}
          </div>
        </div>
      );

    case 'date':
      return (
        <div>
          <Label>{label} {field.required && '*'}</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-full justify-start text-left font-normal">
                <CalendarIcon className="mr-2 h-4 w-4" />
                {value 
                  ? format(value as Date, 'd MMM yyyy', { locale: isRu ? ru : enUS })
                  : (isRu ? 'Выберите дату' : 'Select date')
                }
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={value as Date | undefined}
                onSelect={onChange}
                disabled={(date) => date < new Date()}
                locale={isRu ? ru : enUS}
              />
            </PopoverContent>
          </Popover>
        </div>
      );

    case 'daterange':
      const dateRange = (value as { from?: Date; to?: Date }) || {};
      return (
        <div>
          <Label>{label} {field.required && '*'}</Label>
          <div className="grid grid-cols-2 gap-2 mt-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="justify-start text-left font-normal">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateRange.from 
                    ? format(dateRange.from, 'd MMM', { locale: isRu ? ru : enUS })
                    : (isRu ? 'Заезд' : 'Check-in')
                  }
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={dateRange.from}
                  onSelect={(date) => onChange({ ...dateRange, from: date })}
                  disabled={(date) => date < new Date()}
                  locale={isRu ? ru : enUS}
                />
              </PopoverContent>
            </Popover>

            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="justify-start text-left font-normal">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateRange.to 
                    ? format(dateRange.to, 'd MMM', { locale: isRu ? ru : enUS })
                    : (isRu ? 'Выезд' : 'Check-out')
                  }
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={dateRange.to}
                  onSelect={(date) => onChange({ ...dateRange, to: date })}
                  disabled={(date) => date < (dateRange.from || new Date())}
                  locale={isRu ? ru : enUS}
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>
      );

    case 'guests':
      const guests = (value as { adults: number; children: number }) || { adults: 2, children: 0 };
      return (
        <div className="space-y-2">
          <Label>{label}</Label>
          <div className="space-y-2">
            <GuestCounter
              label={isRu ? 'Взрослые' : 'Adults'}
              value={guests.adults || 2}
              onChange={(v) => onChange({ ...guests, adults: v })}
              min={1}
              max={20}
            />
            <GuestCounter
              label={isRu ? 'Дети' : 'Children'}
              value={guests.children || 0}
              onChange={(v) => onChange({ ...guests, children: v })}
              min={0}
              max={10}
            />
          </div>
        </div>
      );

    case 'budget':
      const budget = (value as { min?: number; max?: number }) || {};
      return (
        <div>
          <Label>{label}</Label>
          <div className="grid grid-cols-2 gap-2 mt-2">
            <Input
              type="number"
              placeholder={isRu ? 'От' : 'From'}
              value={budget.min || ''}
              onChange={(e) => onChange({ ...budget, min: e.target.value ? Number(e.target.value) : undefined })}
            />
            <Input
              type="number"
              placeholder={isRu ? 'До' : 'To'}
              value={budget.max || ''}
              onChange={(e) => onChange({ ...budget, max: e.target.value ? Number(e.target.value) : undefined })}
            />
          </div>
        </div>
      );

    default:
      return null;
  }
}

// Guest counter component
function GuestCounter({
  label,
  value,
  onChange,
  min = 0,
  max = 10,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
}) {
  return (
    <div className="flex items-center justify-between py-2">
      <span className="text-sm">{label}</span>
      <div className="flex items-center gap-3">
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="h-8 w-8 rounded-full"
          onClick={() => onChange(Math.max(min, value - 1))}
          disabled={value <= min}
        >
          <Minus className="h-4 w-4" />
        </Button>
        <span className="w-6 text-center font-medium">{value}</span>
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="h-8 w-8 rounded-full"
          onClick={() => onChange(Math.min(max, value + 1))}
          disabled={value >= max}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
