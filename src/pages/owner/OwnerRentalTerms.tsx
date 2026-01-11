import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PageContainer } from '@/components/uno/PageContainer';
import { PageHeader } from '@/components/uno/PageHeader';
import { useLanguage } from '@/contexts/LanguageContext';
import { useOwnerProperty, useUpdateOwnerProperty } from '@/hooks/usePropertyCare';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Loader2, DollarSign, Clock, Users, FileText, Shield } from 'lucide-react';

const CANCELLATION_POLICIES = [
  { value: 'flexible', labelEn: 'Flexible (free cancellation 24h before)', labelRu: 'Гибкая (бесплатная отмена за 24ч)' },
  { value: 'moderate', labelEn: 'Moderate (free cancellation 5 days before)', labelRu: 'Умеренная (бесплатная отмена за 5 дней)' },
  { value: 'strict', labelEn: 'Strict (50% refund up to 1 week before)', labelRu: 'Строгая (50% возврат за неделю)' },
  { value: 'non_refundable', labelEn: 'Non-refundable', labelRu: 'Без возврата' },
];

export default function OwnerRentalTerms() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { language } = useLanguage();
  const { toast } = useToast();
  const isRu = language === 'ru';

  const { data: property, isLoading } = useOwnerProperty(id);
  const updateProperty = useUpdateOwnerProperty();

  const [formData, setFormData] = useState({
    price_per_night: '',
    min_stay_nights: '1',
    max_guests: '',
    deposit_amount: '',
    deposit_currency: 'THB',
    check_in_time: '14:00',
    check_out_time: '12:00',
    house_rules: '',
    house_rules_ru: '',
    cancellation_policy: 'flexible',
    instant_booking: false,
  });

  useEffect(() => {
    if (property) {
      setFormData({
        price_per_night: property.price_per_night?.toString() || '',
        min_stay_nights: property.min_stay_nights?.toString() || '1',
        max_guests: property.max_guests?.toString() || '',
        deposit_amount: property.deposit_amount?.toString() || '',
        deposit_currency: property.deposit_currency || 'THB',
        check_in_time: property.check_in_time || '14:00',
        check_out_time: property.check_out_time || '12:00',
        house_rules: property.house_rules || '',
        house_rules_ru: property.house_rules_ru || '',
        cancellation_policy: property.cancellation_policy || 'flexible',
        instant_booking: property.instant_booking || false,
      });
    }
  }, [property]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!id) return;

    try {
      await updateProperty.mutateAsync({
        id,
        price_per_night: formData.price_per_night ? Number(formData.price_per_night) : null,
        min_stay_nights: formData.min_stay_nights ? Number(formData.min_stay_nights) : 1,
        max_guests: formData.max_guests ? Number(formData.max_guests) : null,
        deposit_amount: formData.deposit_amount ? Number(formData.deposit_amount) : null,
        deposit_currency: formData.deposit_currency,
        check_in_time: formData.check_in_time,
        check_out_time: formData.check_out_time,
        house_rules: formData.house_rules || null,
        house_rules_ru: formData.house_rules_ru || null,
        cancellation_policy: formData.cancellation_policy,
        instant_booking: formData.instant_booking,
      });

      toast({
        title: isRu ? 'Сохранено!' : 'Saved!',
        description: isRu ? 'Условия аренды обновлены' : 'Rental terms updated',
      });

      navigate(`/owner/properties/${id}`);
    } catch (error) {
      toast({
        title: isRu ? 'Ошибка' : 'Error',
        description: isRu ? 'Не удалось сохранить' : 'Failed to save',
        variant: 'destructive',
      });
    }
  };

  if (isLoading) {
    return (
      <PageContainer>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </PageContainer>
    );
  }

  if (!property) {
    return (
      <PageContainer>
        <div className="text-center py-12">
          <p className="text-muted-foreground">
            {isRu ? 'Объект не найден' : 'Property not found'}
          </p>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader
        title={isRu ? 'Условия аренды' : 'Rental Terms'}
        showBack
        fallbackPath={`/owner/properties/${id}`}
      />

      <form onSubmit={handleSubmit} className="mt-4 space-y-4">
        {/* Pricing */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <DollarSign className="h-4 w-4 text-primary" />
              {isRu ? 'Цены' : 'Pricing'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>{isRu ? 'Цена за ночь' : 'Price per night'}</Label>
                <Input
                  type="number"
                  value={formData.price_per_night}
                  onChange={(e) => setFormData({ ...formData, price_per_night: e.target.value })}
                  placeholder="0"
                  className="mt-1"
                />
              </div>
              <div>
                <Label>{isRu ? 'Валюта' : 'Currency'}</Label>
                <Select
                  value={formData.deposit_currency}
                  onValueChange={(v) => setFormData({ ...formData, deposit_currency: v })}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="THB">THB ฿</SelectItem>
                    <SelectItem value="USD">USD $</SelectItem>
                    <SelectItem value="EUR">EUR €</SelectItem>
                    <SelectItem value="RUB">RUB ₽</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>{isRu ? 'Залог' : 'Security Deposit'}</Label>
                <Input
                  type="number"
                  value={formData.deposit_amount}
                  onChange={(e) => setFormData({ ...formData, deposit_amount: e.target.value })}
                  placeholder="0"
                  className="mt-1"
                />
              </div>
              <div>
                <Label>{isRu ? 'Мин. ночей' : 'Min. nights'}</Label>
                <Input
                  type="number"
                  min="1"
                  value={formData.min_stay_nights}
                  onChange={(e) => setFormData({ ...formData, min_stay_nights: e.target.value })}
                  className="mt-1"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Capacity & Times */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Clock className="h-4 w-4 text-primary" />
              {isRu ? 'Заезд и выезд' : 'Check-in & Check-out'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>{isRu ? 'Заезд с' : 'Check-in from'}</Label>
                <Input
                  type="time"
                  value={formData.check_in_time}
                  onChange={(e) => setFormData({ ...formData, check_in_time: e.target.value })}
                  className="mt-1"
                />
              </div>
              <div>
                <Label>{isRu ? 'Выезд до' : 'Check-out by'}</Label>
                <Input
                  type="time"
                  value={formData.check_out_time}
                  onChange={(e) => setFormData({ ...formData, check_out_time: e.target.value })}
                  className="mt-1"
                />
              </div>
            </div>

            <div>
              <Label className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                {isRu ? 'Макс. гостей' : 'Max guests'}
              </Label>
              <Input
                type="number"
                min="1"
                value={formData.max_guests}
                onChange={(e) => setFormData({ ...formData, max_guests: e.target.value })}
                placeholder={isRu ? 'Не ограничено' : 'No limit'}
                className="mt-1"
              />
            </div>
          </CardContent>
        </Card>

        {/* Rules */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <FileText className="h-4 w-4 text-primary" />
              {isRu ? 'Правила дома' : 'House Rules'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>English</Label>
              <Textarea
                value={formData.house_rules}
                onChange={(e) => setFormData({ ...formData, house_rules: e.target.value })}
                placeholder="No smoking, no pets..."
                rows={3}
                className="mt-1"
              />
            </div>
            <div>
              <Label>Русский</Label>
              <Textarea
                value={formData.house_rules_ru}
                onChange={(e) => setFormData({ ...formData, house_rules_ru: e.target.value })}
                placeholder="Не курить, без животных..."
                rows={3}
                className="mt-1"
              />
            </div>
          </CardContent>
        </Card>

        {/* Cancellation & Booking */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Shield className="h-4 w-4 text-primary" />
              {isRu ? 'Политика отмены' : 'Cancellation Policy'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Select
              value={formData.cancellation_policy}
              onValueChange={(v) => setFormData({ ...formData, cancellation_policy: v })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CANCELLATION_POLICIES.map((policy) => (
                  <SelectItem key={policy.value} value={policy.value}>
                    {isRu ? policy.labelRu : policy.labelEn}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
              <div>
                <p className="font-medium">
                  {isRu ? 'Мгновенное бронирование' : 'Instant Booking'}
                </p>
                <p className="text-sm text-muted-foreground">
                  {isRu 
                    ? 'Гости могут бронировать без одобрения' 
                    : 'Guests can book without approval'}
                </p>
              </div>
              <Switch
                checked={formData.instant_booking}
                onCheckedChange={(checked) => setFormData({ ...formData, instant_booking: checked })}
              />
            </div>
          </CardContent>
        </Card>

        <Button type="submit" className="w-full" disabled={updateProperty.isPending}>
          {updateProperty.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isRu ? 'Сохранить условия' : 'Save Terms'}
        </Button>
      </form>
    </PageContainer>
  );
}
