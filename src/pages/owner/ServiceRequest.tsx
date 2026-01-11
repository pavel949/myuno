import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useOwnerProperties, useCreateServiceRequest } from '@/hooks/usePropertyCare';
import { PageContainer } from '@/components/uno/PageContainer';
import { PageHeader } from '@/components/uno/PageHeader';
import { BackButton } from '@/components/uno/BackButton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { 
  Key, Sparkles, Wrench, FileText, Calendar as CalendarIcon, 
  User, Phone, Users, Loader2, Home, DollarSign
} from 'lucide-react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { cn } from '@/lib/utils';

export default function ServiceRequest() {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isRu = language === 'ru';

  const { data: properties, isLoading: propertiesLoading } = useOwnerProperties();
  const createRequest = useCreateServiceRequest();

  const typeFromUrl = searchParams.get('type') || 'check_in';

  const [formData, setFormData] = useState({
    property_id: '',
    service_type: typeFromUrl,
    priority: 'normal',
    scheduled_date: undefined as Date | undefined,
    scheduled_time: '14:00',
    guest_name: '',
    guest_phone: '',
    guest_count: 1,
    deposit_amount: '',
    description: '',
    special_instructions: '',
  });

  const serviceTypes = [
    { value: 'check_in', labelEn: 'Check-in', labelRu: 'Check-in', icon: Key, color: 'text-green-500' },
    { value: 'check_out', labelEn: 'Check-out', labelRu: 'Check-out', icon: Key, color: 'text-orange-500' },
    { value: 'cleaning', labelEn: 'Cleaning', labelRu: 'Клининг', icon: Sparkles, color: 'text-blue-500' },
    { value: 'maintenance', labelEn: 'Maintenance', labelRu: 'Ремонт', icon: Wrench, color: 'text-purple-500' },
    { value: 'key_handover', labelEn: 'Key Handover', labelRu: 'Передача ключей', icon: Key, color: 'text-amber-500' },
    { value: 'bill_payment', labelEn: 'Bill Payment', labelRu: 'Оплата счетов', icon: FileText, color: 'text-cyan-500' },
  ];

  const timeSlots = [
    '08:00', '09:00', '10:00', '11:00', '12:00', 
    '13:00', '14:00', '15:00', '16:00', '17:00', 
    '18:00', '19:00', '20:00', '21:00'
  ];

  const isGuestRequired = ['check_in', 'check_out', 'key_handover'].includes(formData.service_type);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.property_id || !formData.scheduled_date) {
      return;
    }

    const scheduledAt = new Date(formData.scheduled_date);
    const [hours, minutes] = formData.scheduled_time.split(':');
    scheduledAt.setHours(Number(hours), Number(minutes));

    await createRequest.mutateAsync({
      property_id: formData.property_id,
      service_type: formData.service_type,
      priority: formData.priority,
      scheduled_at: scheduledAt.toISOString(),
      guest_name: formData.guest_name || undefined,
      guest_phone: formData.guest_phone || undefined,
      guest_count: formData.guest_count || undefined,
      deposit_amount: formData.deposit_amount ? Number(formData.deposit_amount) : undefined,
      description: formData.description || undefined,
      special_instructions: formData.special_instructions || undefined,
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
              ? 'Чтобы создать заявку, нужно добавить недвижимость' 
              : 'To create a request, you need to add a property'}
          </p>
          <Button onClick={() => navigate('/owner/properties/new')}>
            {isRu ? 'Добавить объект' : 'Add Property'}
          </Button>
        </div>
      </PageContainer>
    );
  }

  const selectedType = serviceTypes.find(t => t.value === formData.service_type);

  return (
    <PageContainer>
      <BackButton />
      <PageHeader 
        title={isRu ? 'Новая заявка' : 'New Request'}
        subtitle={selectedType ? (isRu ? selectedType.labelRu : selectedType.labelEn) : ''}
      />

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Service Type */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              {isRu ? 'Тип услуги' : 'Service Type'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-2">
              {serviceTypes.map((type) => (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, service_type: type.value }))}
                  className={cn(
                    "flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-colors",
                    formData.service_type === type.value
                      ? "border-primary bg-primary/5"
                      : "border-muted hover:border-muted-foreground/30"
                  )}
                >
                  <type.icon className={cn("h-5 w-5", type.color)} />
                  <span className="text-xs font-medium text-center">
                    {isRu ? type.labelRu : type.labelEn}
                  </span>
                </button>
              ))}
            </div>
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
                  <SelectItem key={property.id} value={property.id}>
                    {isRu && property.title_ru ? property.title_ru : property.title}
                    {property.district && ` • ${property.district}`}
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

        {/* Guest Info (for check-in/out) */}
        {isGuestRequired && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <User className="h-4 w-4" />
                {isRu ? 'Информация о госте' : 'Guest Information'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="flex items-center gap-1">
                  <User className="h-3 w-3" />
                  {isRu ? 'Имя гостя' : 'Guest Name'}
                </Label>
                <Input
                  value={formData.guest_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, guest_name: e.target.value }))}
                  placeholder="John Smith"
                />
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-1">
                  <Phone className="h-3 w-3" />
                  {isRu ? 'Телефон гостя' : 'Guest Phone'}
                </Label>
                <Input
                  type="tel"
                  value={formData.guest_phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, guest_phone: e.target.value }))}
                  placeholder="+66 XXX XXX XXXX"
                />
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  {isRu ? 'Количество гостей' : 'Number of Guests'}
                </Label>
                <Input
                  type="number"
                  min={1}
                  value={formData.guest_count}
                  onChange={(e) => setFormData(prev => ({ ...prev, guest_count: Number(e.target.value) }))}
                />
              </div>

              {formData.service_type === 'check_in' && (
                <div className="space-y-2">
                  <Label className="flex items-center gap-1">
                    <DollarSign className="h-3 w-3" />
                    {isRu ? 'Депозит (THB)' : 'Deposit (THB)'}
                  </Label>
                  <Input
                    type="number"
                    min={0}
                    value={formData.deposit_amount}
                    onChange={(e) => setFormData(prev => ({ ...prev, deposit_amount: e.target.value }))}
                    placeholder="10000"
                  />
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Additional Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              {isRu ? 'Дополнительно' : 'Additional Info'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>{isRu ? 'Описание задачи' : 'Task Description'}</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder={isRu ? 'Опишите, что нужно сделать...' : 'Describe what needs to be done...'}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label>{isRu ? 'Особые инструкции' : 'Special Instructions'}</Label>
              <Textarea
                value={formData.special_instructions}
                onChange={(e) => setFormData(prev => ({ ...prev, special_instructions: e.target.value }))}
                placeholder={isRu ? 'Код от ворот, где ключи...' : 'Gate code, where are the keys...'}
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label>{isRu ? 'Приоритет' : 'Priority'}</Label>
              <Select 
                value={formData.priority}
                onValueChange={(value) => setFormData(prev => ({ ...prev, priority: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">{isRu ? 'Низкий' : 'Low'}</SelectItem>
                  <SelectItem value="normal">{isRu ? 'Обычный' : 'Normal'}</SelectItem>
                  <SelectItem value="high">{isRu ? 'Высокий' : 'High'}</SelectItem>
                  <SelectItem value="urgent">{isRu ? 'Срочно' : 'Urgent'}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Submit */}
        <Button 
          type="submit" 
          className="w-full" 
          size="lg"
          disabled={createRequest.isPending || !formData.property_id || !formData.scheduled_date}
        >
          {createRequest.isPending ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              {isRu ? 'Создание...' : 'Creating...'}
            </>
          ) : (
            isRu ? 'Создать заявку' : 'Create Request'
          )}
        </Button>
      </form>
    </PageContainer>
  );
}
