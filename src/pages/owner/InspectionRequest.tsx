import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import { useCreateInspection } from '@/hooks/usePropertyCare';
import { useMyProperties } from '@/hooks/useMyProperties';
import { PageContainer } from '@/components/uno/PageContainer';
import { PageHeader } from '@/components/uno/PageHeader';
import { BackButton } from '@/components/uno/BackButton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { 
  Camera, Calendar as CalendarIcon, Home, Loader2,
  ClipboardCheck, AlertTriangle, Key, Search
} from 'lucide-react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { cn } from '@/lib/utils';

export default function InspectionRequest() {
  const { language } = useLanguage();
  const { formatPrice } = useCurrency();
  const navigate = useNavigate();
  const isRu = language === 'ru';

  const { allProperties: properties, isLoading: propertiesLoading } = useMyProperties();
  const createInspection = useCreateInspection();

  const [formData, setFormData] = useState({
    property_id: '',
    inspection_type: 'routine',
    scheduled_date: undefined as Date | undefined,
    scheduled_time: '10:00',
    notes: '',
  });

  const inspectionTypes = [
    { 
      value: 'routine', 
      labelEn: 'Routine Check', 
      labelRu: 'Плановая проверка', 
      icon: ClipboardCheck, 
      color: 'text-info',
      desc: isRu ? 'Стандартный осмотр состояния' : 'Standard condition check'
    },
    { 
      value: 'check_in', 
      labelEn: 'Check-in Inspection', 
      labelRu: 'Инспекция при заезде', 
      icon: Key, 
      color: 'text-success',
      desc: isRu ? 'Фиксация состояния до гостя' : 'Document condition before guest'
    },
    { 
      value: 'check_out', 
      labelEn: 'Check-out Inspection', 
      labelRu: 'Инспекция при выезде', 
      icon: Search, 
      color: 'text-accent-amber',
      desc: isRu ? 'Проверка повреждений' : 'Check for damages'
    },
    { 
      value: 'emergency', 
      labelEn: 'Emergency', 
      labelRu: 'Экстренная', 
      icon: AlertTriangle, 
      color: 'text-destructive',
      desc: isRu ? 'Срочный осмотр по запросу' : 'Urgent inspection on request'
    },
  ];

  const timeSlots = [
    '08:00', '09:00', '10:00', '11:00', '12:00', 
    '13:00', '14:00', '15:00', '16:00', '17:00'
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.property_id || !formData.scheduled_date) {
      return;
    }

    const scheduledAt = new Date(formData.scheduled_date);
    const [hours, minutes] = formData.scheduled_time.split(':');
    scheduledAt.setHours(Number(hours), Number(minutes));

    await createInspection.mutateAsync({
      property_id: formData.property_id,
      inspection_type: formData.inspection_type,
      scheduled_at: scheduledAt.toISOString(),
      notes: formData.notes || undefined,
    });

    navigate('/owner');
  };

  if (propertiesLoading) {
    return (
      <PageContainer>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </PageContainer>
    );
  }

  if (!properties?.length) {
    return (
      <PageContainer>
        <BackButton />
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
          <Home className="h-16 w-16 text-muted-foreground mb-4" />
          <h1 className="text-xl font-bold mb-2">
            {isRu ? 'Сначала добавьте объект' : 'Add Property First'}
          </h1>
          <p className="text-muted-foreground mb-6">
            {isRu 
              ? 'Чтобы заказать инспекцию, нужно добавить недвижимость' 
              : 'To order inspection, you need to add a property'}
          </p>
          <Button onClick={() => navigate('/owner/properties/new')}>
            {isRu ? 'Добавить объект' : 'Add Property'}
          </Button>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <BackButton />
      <PageHeader 
        title={isRu ? 'Заказать инспекцию' : 'Order Inspection'}
        subtitle={isRu ? 'Проверка состояния объекта' : 'Property condition check'}
      />

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Inspection Type */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Camera className="h-4 w-4" />
              {isRu ? 'Тип инспекции' : 'Inspection Type'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {inspectionTypes.map((type) => (
              <div
                key={type.value}
                onClick={() => setFormData(prev => ({ ...prev, inspection_type: type.value }))}
                className={cn(
                  "flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-colors",
                  formData.inspection_type === type.value
                    ? "border-primary bg-primary/5"
                    : "border-muted hover:border-muted-foreground/30"
                )}
              >
                <div className={cn("p-2 rounded-full bg-muted", type.color)}>
                  <type.icon className="h-4 w-4" />
                </div>
                <div className="flex-1">
                  <p className="font-medium">
                    {isRu ? type.labelRu : type.labelEn}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {type.desc}
                  </p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Property Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Home className="h-4 w-4" />
              {isRu ? 'Объект' : 'Property'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Select 
              value={formData.property_id}
              onValueChange={(value) => setFormData(prev => ({ ...prev, property_id: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder={isRu ? 'Выберите объект' : 'Select property'} />
              </SelectTrigger>
              <SelectContent>
                {properties.map((property) => (
                  <SelectItem key={property.property_id} value={property.property_id}>
                    {isRu && property.title_ru ? property.title_ru : property.title}
                    {property.district && ` • ${property.district}`}
                    {property.source === 'managed' && ` (${isRu ? 'управл.' : 'managed'})`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {/* Date & Time */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <CalendarIcon className="h-4 w-4" />
              {isRu ? 'Дата и время' : 'Date & Time'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>{isRu ? 'Дата' : 'Date'} *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !formData.scheduled_date && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.scheduled_date 
                      ? format(formData.scheduled_date, 'PPP', { locale: isRu ? ru : undefined })
                      : (isRu ? 'Выберите дату' : 'Pick a date')}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={formData.scheduled_date}
                    onSelect={(date) => setFormData(prev => ({ ...prev, scheduled_date: date }))}
                    disabled={(date) => date < new Date()}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label>{isRu ? 'Время' : 'Time'} *</Label>
              <Select 
                value={formData.scheduled_time}
                onValueChange={(value) => setFormData(prev => ({ ...prev, scheduled_time: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {timeSlots.map((time) => (
                    <SelectItem key={time} value={time}>
                      {time}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Notes */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              {isRu ? 'Заметки' : 'Notes'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              placeholder={isRu 
                ? 'На что обратить внимание, особые пожелания...' 
                : 'What to pay attention to, special requests...'}
              rows={4}
            />
          </CardContent>
        </Card>

        {/* Pricing Info */}
        <Card className="bg-muted/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">
                  {isRu ? 'Стоимость инспекции' : 'Inspection Cost'}
                </p>
                <p className="text-sm text-muted-foreground">
                  {isRu ? 'Включает фото-отчёт' : 'Includes photo report'}
                </p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold">{formatPrice(500)}</p>
                <p className="text-xs text-muted-foreground">
                  {formData.inspection_type === 'emergency' 
                    ? (isRu ? `+${formatPrice(300)} срочность` : `+${formatPrice(300)} urgency`)
                    : ''}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Submit */}
        <Button 
          type="submit" 
          className="w-full" 
          size="lg"
          disabled={createInspection.isPending || !formData.property_id || !formData.scheduled_date}
        >
          {createInspection.isPending ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              {isRu ? 'Создание...' : 'Creating...'}
            </>
          ) : (
            isRu ? 'Заказать инспекцию' : 'Order Inspection'
          )}
        </Button>
      </form>
    </PageContainer>
  );
}
