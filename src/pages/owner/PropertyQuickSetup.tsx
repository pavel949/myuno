import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useOwnerProperty, useUpdateOwnerProperty } from '@/hooks/usePropertyCare';
import { usePropertyAvailabilityManagement } from '@/hooks/usePropertyAvailabilityManagement';
import { PageContainer } from '@/components/uno/PageContainer';
import { BackButton } from '@/components/uno/BackButton';
import { PropertyCalendar, AvailabilityEntry } from '@/components/property/PropertyCalendar';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { motion } from 'framer-motion';
import { 
  CalendarDays, 
  DollarSign, 
  Zap, 
  Clock, 
  Percent, 
  Shield,
  CheckCircle,
  Sparkles,
  Users,
  Save,
  Home
} from 'lucide-react';
import { toast } from 'sonner';
import { format, addHours, differenceInHours } from 'date-fns';

const CANCELLATION_POLICIES = [
  { value: 'flexible', labelEn: 'Flexible (24h)', labelRu: 'Гибкая (24ч)' },
  { value: 'moderate', labelEn: 'Moderate (5 days)', labelRu: 'Умеренная (5 дней)' },
  { value: 'strict', labelEn: 'Strict (1 week)', labelRu: 'Строгая (1 неделя)' },
  { value: 'non_refundable', labelEn: 'Non-refundable', labelRu: 'Без возврата' },
];

export default function PropertyQuickSetup() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { language } = useLanguage();
  const isRu = language === 'ru';

  const { data: property, isLoading } = useOwnerProperty(id);
  const updateProperty = useUpdateOwnerProperty();
  const { 
    availability, 
    isLoading: isLoadingAvailability,
    syncAvailability
  } = usePropertyAvailabilityManagement(property?.marketplace_property_id);

  const [activeTab, setActiveTab] = useState('pricing');
  const [isSaving, setIsSaving] = useState(false);
  const [localAvailability, setLocalAvailability] = useState<AvailabilityEntry[]>([]);

  // Form state
  const [formData, setFormData] = useState({
    price_per_night: '',
    weekly_discount: '10',
    monthly_discount: '20',
    min_stay_nights: '1',
    max_guests: '2',
    deposit_amount: '',
    check_in_time: '14:00',
    check_out_time: '12:00',
    instant_booking: false,
    cancellation_policy: 'flexible',
  });

  // Initialize form data from property
  useEffect(() => {
    if (property) {
      setFormData({
        price_per_night: property.price_per_night?.toString() || '',
        weekly_discount: (property as any).weekly_discount?.toString() || '10',
        monthly_discount: (property as any).monthly_discount?.toString() || '20',
        min_stay_nights: property.min_stay_nights?.toString() || '1',
        max_guests: property.max_guests?.toString() || '2',
        deposit_amount: property.deposit_amount?.toString() || '',
        check_in_time: property.check_in_time || '14:00',
        check_out_time: property.check_out_time || '12:00',
        instant_booking: property.instant_booking || false,
        cancellation_policy: (property as any).cancellation_policy || 'flexible',
      });
    }
  }, [property]);

  // Initialize availability from fetched data
  useEffect(() => {
    if (availability.length > 0) {
      setLocalAvailability(availability);
    }
  }, [availability]);

  // Calculate protection period remaining
  const instantBookingEnabledAt = (property as any)?.instant_booking_enabled_at;
  const protectionEndTime = instantBookingEnabledAt 
    ? new Date(instantBookingEnabledAt) 
    : null;
  const isInProtectionPeriod = protectionEndTime && protectionEndTime > new Date();
  const hoursRemaining = protectionEndTime 
    ? Math.max(0, differenceInHours(protectionEndTime, new Date())) 
    : 0;

  const handleSave = async () => {
    if (!id) return;
    
    setIsSaving(true);
    try {
      // Save property settings
      await updateProperty.mutateAsync({
        id,
        price_per_night: formData.price_per_night ? Number(formData.price_per_night) : undefined,
        min_stay_nights: formData.min_stay_nights ? Number(formData.min_stay_nights) : undefined,
        max_guests: formData.max_guests ? Number(formData.max_guests) : undefined,
        deposit_amount: formData.deposit_amount ? Number(formData.deposit_amount) : undefined,
        check_in_time: formData.check_in_time,
        check_out_time: formData.check_out_time,
        instant_booking: formData.instant_booking,
      });

      // Save availability/calendar if there are changes
      if (localAvailability.length > 0 && property?.marketplace_property_id) {
        await syncAvailability(localAvailability);
      }

      toast.success(isRu ? 'Настройки сохранены!' : 'Settings saved!');
    } catch (error) {
      console.error('Error saving:', error);
      toast.error(isRu ? 'Ошибка сохранения' : 'Save failed');
    } finally {
      setIsSaving(false);
    }
  };

  const handleFinish = async () => {
    await handleSave();
    navigate(`/mc/properties/${id}`);
  };

  if (isLoading) {
    return (
      <PageContainer>
        <Skeleton className="h-8 w-48 mb-4" />
        <Skeleton className="h-64 w-full" />
      </PageContainer>
    );
  }

  if (!property) {
    return (
      <PageContainer>
        <div className="text-center py-12">
          <Home className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">
            {isRu ? 'Объект не найден' : 'Property not found'}
          </p>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <BackButton />

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="h-5 w-5 text-primary" />
          <h1 className="text-xl font-bold">
            {isRu ? 'Быстрая настройка' : 'Quick Setup'}
          </h1>
        </div>
        <p className="text-sm text-muted-foreground">
          {isRu 
            ? 'Настройте цены и календарь для начала приёма бронирований' 
            : 'Set up pricing and calendar to start accepting bookings'}
        </p>
        
        {/* Property name */}
        <Card className="mt-4 bg-muted/50">
          <CardContent className="p-3 flex items-center gap-3">
            {property.cover_image ? (
              <img 
                src={property.cover_image} 
                alt={property.title}
                className="w-12 h-12 rounded-lg object-cover"
              />
            ) : (
              <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center">
                <Home className="h-6 w-6 text-muted-foreground" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">{property.title}</p>
              <p className="text-xs text-muted-foreground truncate">{property.address}</p>
            </div>
            <Badge className="bg-success gap-1">
              <CheckCircle className="h-3 w-3" />
              {isRu ? 'Одобрен' : 'Approved'}
            </Badge>
          </CardContent>
        </Card>

        {/* Protection period notice */}
        {isInProtectionPeriod && (
          <Card className="mt-3 border-info/20 bg-info/5">
            <CardContent className="p-3 flex items-start gap-3">
              <Shield className="h-5 w-5 text-info flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-info">
                  {isRu ? 'Защитный период' : 'Protection Period'}
                </p>
                <p className="text-xs text-info/80">
                  {isRu 
                    ? `Ещё ${hoursRemaining}ч все бронирования требуют вашего подтверждения` 
                    : `${hoursRemaining}h remaining - all bookings require your approval`}
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </motion.div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="pricing" className="gap-1">
            <DollarSign className="h-4 w-4" />
            <span className="hidden sm:inline">{isRu ? 'Цены' : 'Pricing'}</span>
          </TabsTrigger>
          <TabsTrigger value="calendar" className="gap-1">
            <CalendarDays className="h-4 w-4" />
            <span className="hidden sm:inline">{isRu ? 'Календарь' : 'Calendar'}</span>
          </TabsTrigger>
          <TabsTrigger value="rules" className="gap-1">
            <Clock className="h-4 w-4" />
            <span className="hidden sm:inline">{isRu ? 'Правила' : 'Rules'}</span>
          </TabsTrigger>
        </TabsList>

        {/* Pricing Tab */}
        <TabsContent value="pricing" className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                {isRu ? 'Базовая цена' : 'Base Price'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>{isRu ? 'Цена за ночь (THB)' : 'Price per night (THB)'}</Label>
                <Input
                  type="number"
                  value={formData.price_per_night}
                  onChange={(e) => setFormData(prev => ({ ...prev, price_per_night: e.target.value }))}
                  placeholder="2500"
                  className="mt-1"
                />
              </div>

              <div>
                <Label>{isRu ? 'Залог (THB)' : 'Deposit (THB)'}</Label>
                <Input
                  type="number"
                  value={formData.deposit_amount}
                  onChange={(e) => setFormData(prev => ({ ...prev, deposit_amount: e.target.value }))}
                  placeholder="5000"
                  className="mt-1"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {isRu ? 'Возвращается после выезда' : 'Returned after checkout'}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Percent className="h-4 w-4" />
                {isRu ? 'Скидки' : 'Discounts'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>{isRu ? 'Неделя (%)' : 'Weekly (%)'}</Label>
                  <Input
                    type="number"
                    value={formData.weekly_discount}
                    onChange={(e) => setFormData(prev => ({ ...prev, weekly_discount: e.target.value }))}
                    placeholder="10"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>{isRu ? 'Месяц (%)' : 'Monthly (%)'}</Label>
                  <Input
                    type="number"
                    value={formData.monthly_discount}
                    onChange={(e) => setFormData(prev => ({ ...prev, monthly_discount: e.target.value }))}
                    placeholder="20"
                    className="mt-1"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Zap className="h-4 w-4" />
                {isRu ? 'Мгновенное бронирование' : 'Instant Booking'}
              </CardTitle>
              <CardDescription>
                {isRu 
                  ? 'Гости смогут бронировать без вашего подтверждения' 
                  : 'Guests can book without your approval'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Switch
                    checked={formData.instant_booking}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, instant_booking: checked }))}
                    disabled={isInProtectionPeriod}
                  />
                  <span className="text-sm">
                    {formData.instant_booking 
                      ? (isRu ? 'Включено' : 'Enabled')
                      : (isRu ? 'Выключено' : 'Disabled')}
                  </span>
                </div>
                {isInProtectionPeriod && (
                  <Badge variant="secondary" className="text-xs">
                    <Shield className="h-3 w-3 mr-1" />
                    {isRu ? `Доступно через ${hoursRemaining}ч` : `Available in ${hoursRemaining}h`}
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Calendar Tab */}
        <TabsContent value="calendar" className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <CalendarDays className="h-4 w-4" />
                {isRu ? 'Управление календарём' : 'Calendar Management'}
              </CardTitle>
              <CardDescription>
                {isRu 
                  ? 'Выберите даты для блокировки или установки специальных цен' 
                  : 'Select dates to block or set special prices'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingAvailability ? (
                <Skeleton className="h-64 w-full" />
              ) : (
                <PropertyCalendar
                  availability={localAvailability}
                  onChange={setLocalAvailability}
                  basePrice={Number(formData.price_per_night) || 0}
                  currency="THB"
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Rules Tab */}
        <TabsContent value="rules" className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Clock className="h-4 w-4" />
                {isRu ? 'Время заезда/выезда' : 'Check-in/out Times'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>{isRu ? 'Заезд' : 'Check-in'}</Label>
                  <Select
                    value={formData.check_in_time}
                    onValueChange={(v) => setFormData(prev => ({ ...prev, check_in_time: v }))}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {['12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00'].map(t => (
                        <SelectItem key={t} value={t}>{t}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>{isRu ? 'Выезд' : 'Check-out'}</Label>
                  <Select
                    value={formData.check_out_time}
                    onValueChange={(v) => setFormData(prev => ({ ...prev, check_out_time: v }))}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {['09:00', '10:00', '11:00', '12:00', '13:00'].map(t => (
                        <SelectItem key={t} value={t}>{t}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Users className="h-4 w-4" />
                {isRu ? 'Гости и проживание' : 'Guests & Stay'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>{isRu ? 'Мин. ночей' : 'Min nights'}</Label>
                  <Input
                    type="number"
                    value={formData.min_stay_nights}
                    onChange={(e) => setFormData(prev => ({ ...prev, min_stay_nights: e.target.value }))}
                    min="1"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>{isRu ? 'Макс. гостей' : 'Max guests'}</Label>
                  <Input
                    type="number"
                    value={formData.max_guests}
                    onChange={(e) => setFormData(prev => ({ ...prev, max_guests: e.target.value }))}
                    min="1"
                    className="mt-1"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Shield className="h-4 w-4" />
                {isRu ? 'Политика отмены' : 'Cancellation Policy'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Select
                value={formData.cancellation_policy}
                onValueChange={(v) => setFormData(prev => ({ ...prev, cancellation_policy: v }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CANCELLATION_POLICIES.map(policy => (
                    <SelectItem key={policy.value} value={policy.value}>
                      {isRu ? policy.labelRu : policy.labelEn}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Save buttons */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-background border-t safe-area-pb">
        <div className="max-w-lg mx-auto flex gap-3">
          <Button
            variant="outline"
            className="flex-1"
            onClick={handleSave}
            disabled={isSaving}
          >
            <Save className="h-4 w-4 mr-2" />
            {isRu ? 'Сохранить' : 'Save'}
          </Button>
          <Button
            className="flex-1"
            onClick={handleFinish}
            disabled={isSaving}
          >
            {isSaving ? (
              <span className="animate-spin">⏳</span>
            ) : (
              <CheckCircle className="h-4 w-4 mr-2" />
            )}
            {isRu ? 'Готово' : 'Done'}
          </Button>
        </div>
      </div>

      {/* Bottom padding for fixed buttons */}
      <div className="h-24" />
    </PageContainer>
  );
}
