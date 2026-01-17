import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useGuestCheckIn, CheckInFormData } from '@/hooks/useGuestCheckIn';
import { usePropertyBookings } from '@/hooks/usePropertyBookings';
import { PageContainer } from '@/components/uno/PageContainer';
import { PageHeader } from '@/components/uno/PageHeader';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  User, 
  Phone, 
  Clock, 
  Plane, 
  Car, 
  CheckCircle,
  Loader2,
  FileText,
  Shield
} from 'lucide-react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

const countries = [
  { code: 'RU', name: { en: 'Russia', ru: 'Россия' } },
  { code: 'US', name: { en: 'United States', ru: 'США' } },
  { code: 'GB', name: { en: 'United Kingdom', ru: 'Великобритания' } },
  { code: 'DE', name: { en: 'Germany', ru: 'Германия' } },
  { code: 'FR', name: { en: 'France', ru: 'Франция' } },
  { code: 'CN', name: { en: 'China', ru: 'Китай' } },
  { code: 'TH', name: { en: 'Thailand', ru: 'Таиланд' } },
  { code: 'OTHER', name: { en: 'Other', ru: 'Другая' } },
];

const arrivalTimes = [
  '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', 
  '16:00', '17:00', '18:00', '19:00', '20:00', '21:00', '22:00', '23:00',
];

export default function GuestCheckIn() {
  const { bookingId } = useParams<{ bookingId: string }>();
  const { language } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();
  const isRu = language === 'ru';

  // Pass the marketplace bookingId (from 'bookings' table) - hook will find property_booking
  const { checkInData, propertyBooking, isLoading, submitCheckIn, isSubmitted, isVerified, hasPropertyBooking } = useGuestCheckIn(bookingId);

  const [formData, setFormData] = useState<CheckInFormData>({
    full_name: '',
    passport_number: '',
    passport_country: '',
    passport_expiry: '',
    phone: '',
    email: user?.email || '',
    emergency_contact_name: '',
    emergency_contact_phone: '',
    arrival_time: '14:00',
    arrival_flight: '',
    needs_transfer: false,
    rules_accepted: false,
  });

  // Pre-fill form with existing data
  useEffect(() => {
    if (checkInData) {
      setFormData({
        full_name: checkInData.full_name || '',
        passport_number: checkInData.passport_number || '',
        passport_country: checkInData.passport_country || '',
        passport_expiry: checkInData.passport_expiry || '',
        phone: checkInData.phone || '',
        email: checkInData.email || user?.email || '',
        emergency_contact_name: checkInData.emergency_contact_name || '',
        emergency_contact_phone: checkInData.emergency_contact_phone || '',
        arrival_time: checkInData.arrival_time || '14:00',
        arrival_flight: checkInData.arrival_flight || '',
        needs_transfer: checkInData.needs_transfer || false,
        rules_accepted: checkInData.rules_accepted || false,
      });
    }
  }, [checkInData, user]);

  const handleChange = (field: keyof CheckInFormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.rules_accepted) {
      return;
    }

    await submitCheckIn.mutateAsync(formData);
  };

  if (!user) {
    return (
      <PageContainer>
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
          <User className="w-16 h-16 text-muted-foreground" />
          <p className="text-muted-foreground">
            {isRu ? 'Войдите для онлайн регистрации' : 'Please login for online check-in'}
          </p>
          <Button onClick={() => navigate('/auth')}>
            {isRu ? 'Войти' : 'Login'}
          </Button>
        </div>
      </PageContainer>
    );
  }

  if (isLoading) {
    return (
      <PageContainer>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </PageContainer>
    );
  }

  // Show message if property booking not yet created (booking not synced to owner calendar)
  if (!isLoading && !hasPropertyBooking) {
    return (
      <PageContainer>
        <PageHeader 
          title={isRu ? 'Онлайн регистрация' : 'Online Check-in'} 
          showBack 
        />
        <Card className="border-yellow-500/50 bg-yellow-500/5">
          <CardContent className="p-6 text-center">
            <Clock className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">
              {isRu ? 'Ожидайте подтверждения' : 'Awaiting Confirmation'}
            </h2>
            <p className="text-muted-foreground mb-4">
              {isRu 
                ? 'Онлайн регистрация станет доступна после подтверждения бронирования владельцем.'
                : 'Online check-in will be available after the booking is confirmed by the property owner.'}
            </p>
            <Button variant="outline" onClick={() => navigate('/bookings')}>
              {isRu ? 'К бронированиям' : 'Back to Bookings'}
            </Button>
          </CardContent>
        </Card>
      </PageContainer>
    );
  }

  // Already submitted view
  if (isSubmitted) {
    return (
      <PageContainer>
        <PageHeader 
          title={isRu ? 'Онлайн регистрация' : 'Online Check-in'} 
          showBack 
        />

        <Card className="border-success/50 bg-success/5">
          <CardContent className="p-6 text-center">
            <CheckCircle className="w-16 h-16 text-success mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">
              {isVerified 
                ? (isRu ? 'Регистрация подтверждена!' : 'Check-in Verified!')
                : (isRu ? 'Регистрация отправлена!' : 'Check-in Submitted!')
              }
            </h2>
            <p className="text-muted-foreground mb-4">
              {isVerified
                ? (isRu ? 'Ваша регистрация подтверждена. Добро пожаловать!' : 'Your check-in has been verified. Welcome!')
                : (isRu ? 'Мы проверим ваши данные и свяжемся с вами' : 'We will verify your information and contact you')
              }
            </p>

            {isVerified && (
              <Badge className="bg-success text-white mb-4">
                <Shield className="w-3 h-3 mr-1" />
                {isRu ? 'Подтверждено' : 'Verified'}
              </Badge>
            )}

            <Separator className="my-4" />

            <div className="text-left space-y-3">
              <div className="flex items-center gap-3">
                <User className="w-5 h-5 text-muted-foreground" />
                <span>{checkInData?.full_name}</span>
              </div>
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-muted-foreground" />
                <span>{isRu ? 'Время прибытия:' : 'Arrival time:'} {checkInData?.arrival_time}</span>
              </div>
              {checkInData?.arrival_flight && (
                <div className="flex items-center gap-3">
                  <Plane className="w-5 h-5 text-muted-foreground" />
                  <span>{isRu ? 'Рейс:' : 'Flight:'} {checkInData?.arrival_flight}</span>
                </div>
              )}
              {checkInData?.needs_transfer && (
                <div className="flex items-center gap-3">
                  <Car className="w-5 h-5 text-primary" />
                  <span className="text-primary">{isRu ? 'Требуется трансфер' : 'Transfer requested'}</span>
                </div>
              )}
            </div>

            <Button 
              className="w-full mt-6"
              onClick={() => navigate('/my-stay')}
            >
              {isRu ? 'Перейти к моему визиту' : 'Go to My Stay'}
            </Button>
          </CardContent>
        </Card>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader 
        title={isRu ? 'Онлайн регистрация' : 'Online Check-in'} 
        showBack 
      />

      <Card className="mb-4 border-primary/20 bg-primary/5">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <FileText className="w-5 h-5 text-primary mt-0.5" />
            <div>
              <p className="font-medium">{isRu ? 'Заполните данные заранее' : 'Complete your details in advance'}</p>
              <p className="text-sm text-muted-foreground">
                {isRu 
                  ? 'Это ускорит процесс заселения и позволит нам подготовиться к вашему приезду'
                  : 'This will speed up check-in and allow us to prepare for your arrival'
                }
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Personal Information */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <User className="w-5 h-5" />
              {isRu ? 'Личные данные' : 'Personal Information'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="full_name">{isRu ? 'ФИО (как в паспорте)' : 'Full Name (as in passport)'} *</Label>
              <Input
                id="full_name"
                value={formData.full_name}
                onChange={(e) => handleChange('full_name', e.target.value)}
                placeholder={isRu ? 'Иванов Иван Иванович' : 'John Doe'}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="passport_number">{isRu ? 'Номер паспорта' : 'Passport Number'} *</Label>
                <Input
                  id="passport_number"
                  value={formData.passport_number}
                  onChange={(e) => handleChange('passport_number', e.target.value)}
                  placeholder="AB1234567"
                  required
                />
              </div>
              <div>
                <Label htmlFor="passport_country">{isRu ? 'Страна' : 'Country'} *</Label>
                <Select
                  value={formData.passport_country}
                  onValueChange={(value) => handleChange('passport_country', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={isRu ? 'Выберите' : 'Select'} />
                  </SelectTrigger>
                  <SelectContent>
                    {countries.map(country => (
                      <SelectItem key={country.code} value={country.code}>
                        {isRu ? country.name.ru : country.name.en}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="passport_expiry">{isRu ? 'Срок действия паспорта' : 'Passport Expiry'} *</Label>
              <Input
                id="passport_expiry"
                type="date"
                value={formData.passport_expiry}
                onChange={(e) => handleChange('passport_expiry', e.target.value)}
                required
              />
            </div>
          </CardContent>
        </Card>

        {/* Contact Information */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Phone className="w-5 h-5" />
              {isRu ? 'Контакты' : 'Contact Information'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="phone">{isRu ? 'Телефон' : 'Phone'} *</Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => handleChange('phone', e.target.value)}
                placeholder="+7 (999) 123-45-67"
                required
              />
            </div>

            <div>
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)}
                placeholder="email@example.com"
                required
              />
            </div>

            <Separator />

            <p className="text-sm text-muted-foreground">
              {isRu ? 'Экстренный контакт (необязательно)' : 'Emergency Contact (optional)'}
            </p>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="emergency_name">{isRu ? 'Имя' : 'Name'}</Label>
                <Input
                  id="emergency_name"
                  value={formData.emergency_contact_name}
                  onChange={(e) => handleChange('emergency_contact_name', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="emergency_phone">{isRu ? 'Телефон' : 'Phone'}</Label>
                <Input
                  id="emergency_phone"
                  type="tel"
                  value={formData.emergency_contact_phone}
                  onChange={(e) => handleChange('emergency_contact_phone', e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Arrival Information */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Plane className="w-5 h-5" />
              {isRu ? 'Информация о прибытии' : 'Arrival Information'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="arrival_time">{isRu ? 'Примерное время прибытия' : 'Estimated Arrival Time'} *</Label>
              <Select
                value={formData.arrival_time}
                onValueChange={(value) => handleChange('arrival_time', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {arrivalTimes.map(time => (
                    <SelectItem key={time} value={time}>{time}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="arrival_flight">{isRu ? 'Номер рейса (если применимо)' : 'Flight Number (if applicable)'}</Label>
              <Input
                id="arrival_flight"
                value={formData.arrival_flight}
                onChange={(e) => handleChange('arrival_flight', e.target.value)}
                placeholder="SU 123"
              />
            </div>

            <div className="flex items-center space-x-3 p-4 bg-muted rounded-lg">
              <Checkbox
                id="needs_transfer"
                checked={formData.needs_transfer}
                onCheckedChange={(checked) => handleChange('needs_transfer', checked as boolean)}
              />
              <div>
                <Label htmlFor="needs_transfer" className="cursor-pointer font-medium">
                  <Car className="w-4 h-4 inline mr-2" />
                  {isRu ? 'Мне нужен трансфер из аэропорта' : 'I need airport transfer'}
                </Label>
                <p className="text-sm text-muted-foreground">
                  {isRu ? 'Мы свяжемся с вами для уточнения деталей' : 'We will contact you to arrange details'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Rules Acceptance */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <FileText className="w-5 h-5" />
              {isRu ? 'Правила проживания' : 'House Rules'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-muted p-4 rounded-lg mb-4 text-sm space-y-2">
              {(() => {
                const ownerProperty = propertyBooking?.owner_properties as { house_rules?: string; house_rules_ru?: string; check_in_time?: string; check_out_time?: string } | null;
                const houseRules = isRu ? ownerProperty?.house_rules_ru : ownerProperty?.house_rules;
                const checkInTime = ownerProperty?.check_in_time || '14:00';
                const checkOutTime = ownerProperty?.check_out_time || '12:00';
                
                // Default rules if none provided
                const defaultRules = [
                  isRu ? `Заезд с ${checkInTime}, выезд до ${checkOutTime}` : `Check-in from ${checkInTime}, check-out by ${checkOutTime}`,
                  isRu ? 'Не курить в помещении' : 'No smoking indoors',
                  isRu ? 'Соблюдать тишину после 22:00' : 'Quiet hours after 10 PM',
                  isRu ? 'Бережно относиться к имуществу' : 'Take care of the property',
                ];

                if (houseRules && houseRules.trim()) {
                  // Parse house rules - split by newlines or bullets
                  const rules = houseRules.split(/[\n•\-]/).map(r => r.trim()).filter(r => r.length > 0);
                  return rules.map((rule, idx) => (
                    <p key={idx}>• {rule}</p>
                  ));
                }
                
                return defaultRules.map((rule, idx) => (
                  <p key={idx}>• {rule}</p>
                ));
              })()}
            </div>

            <div className="flex items-start space-x-3">
              <Checkbox
                id="rules_accepted"
                checked={formData.rules_accepted}
                onCheckedChange={(checked) => handleChange('rules_accepted', checked as boolean)}
                required
              />
              <Label htmlFor="rules_accepted" className="cursor-pointer">
                {isRu 
                  ? 'Я прочитал(а) и согласен(на) с правилами проживания'
                  : 'I have read and agree to the house rules'
                } *
              </Label>
            </div>
          </CardContent>
        </Card>

        <Button 
          type="submit" 
          className="w-full" 
          size="lg"
          disabled={!formData.rules_accepted || submitCheckIn.isPending}
        >
          {submitCheckIn.isPending ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              {isRu ? 'Отправка...' : 'Submitting...'}
            </>
          ) : (
            <>
              <CheckCircle className="w-4 h-4 mr-2" />
              {isRu ? 'Отправить регистрацию' : 'Submit Check-in'}
            </>
          )}
        </Button>
      </form>
    </PageContainer>
  );
}
