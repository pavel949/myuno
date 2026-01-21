import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import { useAuth } from '@/contexts/AuthContext';
import { useConsultationRequests } from '@/hooks/useConsultationRequests';
import { PageContainer } from '@/components/uno/PageContainer';
import { PageHeader } from '@/components/uno/PageHeader';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format, addDays } from 'date-fns';
import { ru, enUS } from 'date-fns/locale';
import { 
  Home, Search, MapPin, TrendingUp, Calendar as CalendarIcon,
  Phone, MessageCircle, CheckCircle, ArrowRight, Palmtree,
  Users, Minus, Plus
} from 'lucide-react';
import { cn } from '@/lib/utils';

type RequestType = 'vacation_rental' | 'property_consultation' | 'property_tour' | 'investment_advice';

const PROPERTY_TYPES = [
  { value: 'villa', labelEn: 'Villa', labelRu: 'Вилла' },
  { value: 'condo', labelEn: 'Condo', labelRu: 'Кондо' },
  { value: 'apartment', labelEn: 'Apartment', labelRu: 'Апартаменты' },
  { value: 'townhouse', labelEn: 'Townhouse', labelRu: 'Таунхаус' },
];

const DISTRICTS = [
  { value: 'rawai', labelEn: 'Rawai', labelRu: 'Раваи' },
  { value: 'kata', labelEn: 'Kata', labelRu: 'Ката' },
  { value: 'karon', labelEn: 'Karon', labelRu: 'Карон' },
  { value: 'patong', labelEn: 'Patong', labelRu: 'Патонг' },
  { value: 'kamala', labelEn: 'Kamala', labelRu: 'Камала' },
  { value: 'surin', labelEn: 'Surin', labelRu: 'Сурин' },
  { value: 'bangtao', labelEn: 'Bang Tao', labelRu: 'Банг Тао' },
  { value: 'laguna', labelEn: 'Laguna', labelRu: 'Лагуна' },
  { value: 'cherngtalay', labelEn: 'Cherngtalay', labelRu: 'Чернгталай' },
  { value: 'naiharn', labelEn: 'Nai Harn', labelRu: 'Най Харн' },
];

const PURPOSES = [
  { value: 'personal', labelEn: 'Personal living', labelRu: 'Личное проживание' },
  { value: 'investment', labelEn: 'Investment', labelRu: 'Инвестиции' },
  { value: 'rental_business', labelEn: 'Rental business', labelRu: 'Арендный бизнес' },
];

// Guest Counter Component
function GuestCounter({ 
  label, 
  sublabel,
  value, 
  onChange, 
  min = 0, 
  max = 10 
}: { 
  label: string; 
  sublabel?: string;
  value: number; 
  onChange: (v: number) => void;
  min?: number;
  max?: number;
}) {
  return (
    <div className="flex items-center justify-between py-3">
      <div>
        <div className="font-medium">{label}</div>
        {sublabel && <div className="text-sm text-muted-foreground">{sublabel}</div>}
      </div>
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
        <span className="w-8 text-center font-medium">{value}</span>
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

export default function PropertyConsultation() {
  const { language } = useLanguage();
  const { currencyInfo } = useCurrency();
  const { user } = useAuth();
  const navigate = useNavigate();
  const isRu = language === 'ru';
  
  const { 
    requestPropertyConsultation, 
    requestPropertyTour, 
    requestInvestmentAdvice,
    requestVacationRental 
  } = useConsultationRequests();

  const [requestType, setRequestType] = useState<RequestType>('vacation_rental');
  const [step, setStep] = useState<'type' | 'criteria' | 'contact'>('type');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: user?.user_metadata?.full_name || '',
    email: user?.email || '',
    phone: '',
    preferred_contact_method: 'whatsapp',
    budget_min: '',
    budget_max: '',
    property_types: [] as string[],
    districts: [] as string[],
    bedrooms_min: '',
    bedrooms_max: '',
    purpose: '',
    notes: '',
    // Vacation rental specific
    check_in: undefined as Date | undefined,
    check_out: undefined as Date | undefined,
    guests_count: 2,
    children_count: 0,
  });

  const handlePropertyTypeToggle = (value: string) => {
    setFormData(prev => ({
      ...prev,
      property_types: prev.property_types.includes(value)
        ? prev.property_types.filter(t => t !== value)
        : [...prev.property_types, value],
    }));
  };

  const handleDistrictToggle = (value: string) => {
    setFormData(prev => ({
      ...prev,
      districts: prev.districts.includes(value)
        ? prev.districts.filter(d => d !== value)
        : [...prev.districts, value],
    }));
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.phone) return;
    
    setIsSubmitting(true);
    try {
      const basePayload = {
        name: formData.name,
        email: formData.email || undefined,
        phone: formData.phone,
        preferred_contact_method: formData.preferred_contact_method,
        preferred_language: language,
        property_types: formData.property_types.length > 0 ? formData.property_types : undefined,
        districts: formData.districts.length > 0 ? formData.districts : undefined,
        notes: formData.notes || undefined,
      };

      if (requestType === 'vacation_rental') {
        await requestVacationRental.mutateAsync({
          ...basePayload,
          budget_min: formData.budget_min ? Number(formData.budget_min) : undefined,
          budget_max: formData.budget_max ? Number(formData.budget_max) : undefined,
          currency: currencyInfo.code,
          preferred_dates: formData.check_in && formData.check_out ? {
            check_in: format(formData.check_in, 'yyyy-MM-dd'),
            check_out: format(formData.check_out, 'yyyy-MM-dd'),
          } : undefined,
          guests_count: formData.guests_count,
          children_count: formData.children_count,
        });
      } else if (requestType === 'property_consultation') {
        await requestPropertyConsultation.mutateAsync({
          ...basePayload,
          budget_min: formData.budget_min ? Number(formData.budget_min) : undefined,
          budget_max: formData.budget_max ? Number(formData.budget_max) : undefined,
          currency: 'THB',
          bedrooms_min: formData.bedrooms_min ? Number(formData.bedrooms_min) : undefined,
          bedrooms_max: formData.bedrooms_max ? Number(formData.bedrooms_max) : undefined,
          purpose: formData.purpose || undefined,
        });
      } else if (requestType === 'property_tour') {
        await requestPropertyTour.mutateAsync(basePayload);
      } else {
        await requestInvestmentAdvice.mutateAsync({
          ...basePayload,
          budget_min: formData.budget_min ? Number(formData.budget_min) : undefined,
          budget_max: formData.budget_max ? Number(formData.budget_max) : undefined,
          currency: 'THB',
        });
      }
      
      setIsSuccess(true);
    } catch (error) {
      console.error('Failed to submit consultation request:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDateDisplay = (date: Date | undefined) => {
    if (!date) return isRu ? 'Выберите дату' : 'Select date';
    return format(date, 'd MMM yyyy', { locale: isRu ? ru : enUS });
  };

  if (isSuccess) {
    return (
      <PageContainer>
        <PageHeader 
          title={isRu ? 'Заявка отправлена' : 'Request Sent'}
          showBack
          fallbackPath="/property"
        />
        
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
          <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center mb-6">
            <CheckCircle className="w-10 h-10 text-green-500" />
          </div>
          
          <h2 className="text-2xl font-bold mb-2">
            {isRu ? 'Спасибо за заявку!' : 'Thank you!'}
          </h2>
          
          <p className="text-muted-foreground mb-8 max-w-sm">
            {requestType === 'vacation_rental' 
              ? (isRu 
                  ? 'Мы подберём лучшие варианты и свяжемся с вами в течение 2 часов.' 
                  : 'We will find the best options and contact you within 2 hours.')
              : (isRu 
                  ? 'Наш менеджер свяжется с вами в ближайшее время для обсуждения ваших пожеланий.' 
                  : 'Our manager will contact you shortly to discuss your requirements.')}
          </p>
          
          <div className="flex flex-col gap-3 w-full max-w-xs">
            <Button onClick={() => navigate('/property')} size="lg">
              {isRu ? 'Смотреть объекты' : 'Browse Properties'}
            </Button>
            <Button variant="outline" onClick={() => navigate('/')} size="lg">
              {isRu ? 'На главную' : 'Go Home'}
            </Button>
          </div>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader 
        title={isRu ? 'Консультация' : 'Consultation'}
        subtitle={isRu ? 'Поможем найти идеальный вариант' : 'We help you find the perfect option'}
        showBack
        fallbackPath="/property"
      />

      {/* Progress */}
      <div className="flex items-center gap-2 mb-6">
        {['type', 'criteria', 'contact'].map((s, idx) => (
          <div
            key={s}
            className={`flex-1 h-1 rounded-full transition-colors ${
              ['type', 'criteria', 'contact'].indexOf(step) >= idx
                ? 'bg-primary'
                : 'bg-muted'
            }`}
          />
        ))}
      </div>

      {/* Step 1: Request Type */}
      {step === 'type' && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold mb-4">
            {isRu ? 'Чем мы можем помочь?' : 'How can we help?'}
          </h2>

          <RadioGroup value={requestType} onValueChange={(v) => setRequestType(v as RequestType)}>
            {/* Vacation Rental - First and highlighted */}
            <label className="cursor-pointer">
              <Card className={`transition-all ${requestType === 'vacation_rental' ? 'border-primary ring-2 ring-primary/20' : ''}`}>
                <CardContent className="flex items-start gap-4 p-4">
                  <RadioGroupItem value="vacation_rental" className="mt-1" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Palmtree className="w-5 h-5 text-primary" />
                      <span className="font-medium">
                        {isRu ? 'Аренда на отпуск' : 'Vacation Rental'}
                      </span>
                      <Badge className="text-xs bg-primary/10 text-primary hover:bg-primary/20">
                        {isRu ? 'Популярное' : 'Popular'}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {isRu 
                        ? 'Найдём идеальное жильё для вашего отдыха на Пхукете' 
                        : 'Find the perfect accommodation for your vacation in Phuket'}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </label>

            <label className="cursor-pointer">
              <Card className={`transition-all ${requestType === 'property_consultation' ? 'border-primary ring-2 ring-primary/20' : ''}`}>
                <CardContent className="flex items-start gap-4 p-4">
                  <RadioGroupItem value="property_consultation" className="mt-1" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Search className="w-5 h-5 text-primary" />
                      <span className="font-medium">
                        {isRu ? 'Покупка недвижимости' : 'Buy Property'}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {isRu 
                        ? 'Подберём лучшие варианты для покупки под ваш бюджет' 
                        : 'Find the best options to buy within your budget'}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </label>

            <label className="cursor-pointer">
              <Card className={`transition-all ${requestType === 'property_tour' ? 'border-primary ring-2 ring-primary/20' : ''}`}>
                <CardContent className="flex items-start gap-4 p-4">
                  <RadioGroupItem value="property_tour" className="mt-1" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <MapPin className="w-5 h-5 text-primary" />
                      <span className="font-medium">
                        {isRu ? 'Тур по объектам' : 'Property Tour'}
                      </span>
                      <Badge variant="secondary" className="text-xs">
                        {isRu ? 'Бесплатно' : 'Free'}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {isRu 
                        ? 'Покажем выбранные объекты лично с менеджером' 
                        : 'We will show you selected properties in person'}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </label>

            <label className="cursor-pointer">
              <Card className={`transition-all ${requestType === 'investment_advice' ? 'border-primary ring-2 ring-primary/20' : ''}`}>
                <CardContent className="flex items-start gap-4 p-4">
                  <RadioGroupItem value="investment_advice" className="mt-1" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <TrendingUp className="w-5 h-5 text-primary" />
                      <span className="font-medium">
                        {isRu ? 'Инвестиционная консультация' : 'Investment Advice'}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {isRu 
                        ? 'Анализ доходности, рисков и лучших локаций для инвестиций' 
                        : 'ROI analysis, risks, and best locations for investment'}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </label>
          </RadioGroup>

          <Button 
            className="w-full mt-6" 
            size="lg"
            onClick={() => setStep('criteria')}
          >
            {isRu ? 'Далее' : 'Continue'}
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      )}

      {/* Step 2: Criteria */}
      {step === 'criteria' && (
        <div className="space-y-6">
          <h2 className="text-lg font-semibold">
            {requestType === 'vacation_rental' 
              ? (isRu ? 'Детали аренды' : 'Rental Details')
              : (isRu ? 'Ваши критерии' : 'Your Criteria')}
          </h2>

          {/* Vacation Rental: Dates */}
          {requestType === 'vacation_rental' && (
            <>
              <div className="space-y-3">
                <Label>{isRu ? 'Даты проживания' : 'Stay Dates'}</Label>
                <div className="grid grid-cols-2 gap-3">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "justify-start text-left font-normal",
                          !formData.check_in && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {formData.check_in 
                          ? formatDateDisplay(formData.check_in)
                          : (isRu ? 'Заезд' : 'Check-in')}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={formData.check_in}
                        onSelect={(date) => setFormData(prev => ({ 
                          ...prev, 
                          check_in: date,
                          check_out: date && prev.check_out && date >= prev.check_out 
                            ? addDays(date, 1) 
                            : prev.check_out
                        }))}
                        disabled={(date) => date < new Date()}
                        locale={isRu ? ru : enUS}
                      />
                    </PopoverContent>
                  </Popover>

                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "justify-start text-left font-normal",
                          !formData.check_out && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {formData.check_out 
                          ? formatDateDisplay(formData.check_out)
                          : (isRu ? 'Выезд' : 'Check-out')}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={formData.check_out}
                        onSelect={(date) => setFormData(prev => ({ ...prev, check_out: date }))}
                        disabled={(date) => date <= (formData.check_in || new Date())}
                        locale={isRu ? ru : enUS}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              {/* Guests */}
              <Card>
                <CardContent className="p-4 divide-y">
                  <GuestCounter
                    label={isRu ? 'Взрослые' : 'Adults'}
                    sublabel={isRu ? 'От 13 лет' : 'Age 13+'}
                    value={formData.guests_count}
                    onChange={(v) => setFormData(prev => ({ ...prev, guests_count: v }))}
                    min={1}
                    max={10}
                  />
                  <GuestCounter
                    label={isRu ? 'Дети' : 'Children'}
                    sublabel={isRu ? 'До 12 лет' : 'Under 12'}
                    value={formData.children_count}
                    onChange={(v) => setFormData(prev => ({ ...prev, children_count: v }))}
                    min={0}
                    max={6}
                  />
                </CardContent>
              </Card>

              {/* Budget per night */}
              <div className="space-y-3">
                <Label>{isRu ? `Бюджет за ночь (${currencyInfo.symbol})` : `Budget per night (${currencyInfo.symbol})`}</Label>
                <div className="flex gap-3">
                  <Input
                    type="number"
                    placeholder={isRu ? 'От' : 'From'}
                    value={formData.budget_min}
                    onChange={(e) => setFormData(prev => ({ ...prev, budget_min: e.target.value }))}
                  />
                  <Input
                    type="number"
                    placeholder={isRu ? 'До' : 'To'}
                    value={formData.budget_max}
                    onChange={(e) => setFormData(prev => ({ ...prev, budget_max: e.target.value }))}
                  />
                </div>
              </div>
            </>
          )}

          {/* Purchase: Budget & Bedrooms */}
          {(requestType === 'property_consultation' || requestType === 'investment_advice') && (
            <>
              <div className="space-y-3">
                <Label>{isRu ? 'Бюджет (THB)' : 'Budget (THB)'}</Label>
                <div className="flex gap-3">
                  <Input
                    type="number"
                    placeholder={isRu ? 'От' : 'From'}
                    value={formData.budget_min}
                    onChange={(e) => setFormData(prev => ({ ...prev, budget_min: e.target.value }))}
                  />
                  <Input
                    type="number"
                    placeholder={isRu ? 'До' : 'To'}
                    value={formData.budget_max}
                    onChange={(e) => setFormData(prev => ({ ...prev, budget_max: e.target.value }))}
                  />
                </div>
              </div>

              {requestType === 'property_consultation' && (
                <div className="space-y-3">
                  <Label>{isRu ? 'Спален' : 'Bedrooms'}</Label>
                  <div className="flex gap-3">
                    <Input
                      type="number"
                      placeholder={isRu ? 'От' : 'Min'}
                      value={formData.bedrooms_min}
                      onChange={(e) => setFormData(prev => ({ ...prev, bedrooms_min: e.target.value }))}
                    />
                    <Input
                      type="number"
                      placeholder={isRu ? 'До' : 'Max'}
                      value={formData.bedrooms_max}
                      onChange={(e) => setFormData(prev => ({ ...prev, bedrooms_max: e.target.value }))}
                    />
                  </div>
                </div>
              )}
            </>
          )}

          {/* Property Types - for all except tour */}
          {requestType !== 'property_tour' && (
            <div className="space-y-3">
              <Label>{isRu ? 'Тип недвижимости' : 'Property Type'}</Label>
              <div className="flex flex-wrap gap-2">
                {PROPERTY_TYPES.map((type) => (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() => handlePropertyTypeToggle(type.value)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                      formData.property_types.includes(type.value)
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted hover:bg-muted/80'
                    }`}
                  >
                    {isRu ? type.labelRu : type.labelEn}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Districts - for all */}
          <div className="space-y-3">
            <Label>{isRu ? 'Районы' : 'Districts'}</Label>
            <div className="flex flex-wrap gap-2">
              {DISTRICTS.map((district) => (
                <button
                  key={district.value}
                  type="button"
                  onClick={() => handleDistrictToggle(district.value)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                    formData.districts.includes(district.value)
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted hover:bg-muted/80'
                  }`}
                >
                  {isRu ? district.labelRu : district.labelEn}
                </button>
              ))}
            </div>
          </div>

          {/* Purpose - only for purchase */}
          {requestType === 'property_consultation' && (
            <div className="space-y-3">
              <Label>{isRu ? 'Цель покупки' : 'Purchase Purpose'}</Label>
              <RadioGroup 
                value={formData.purpose} 
                onValueChange={(v) => setFormData(prev => ({ ...prev, purpose: v }))}
              >
                {PURPOSES.map((purpose) => (
                  <label key={purpose.value} className="flex items-center gap-3 cursor-pointer">
                    <RadioGroupItem value={purpose.value} />
                    <span className="text-sm">{isRu ? purpose.labelRu : purpose.labelEn}</span>
                  </label>
                ))}
              </RadioGroup>
            </div>
          )}

          {/* Notes */}
          <div className="space-y-3">
            <Label>
              {requestType === 'vacation_rental' 
                ? (isRu ? 'Особые пожелания' : 'Special Requests')
                : (isRu ? 'Дополнительные пожелания' : 'Additional Requirements')}
            </Label>
            <Textarea
              placeholder={requestType === 'vacation_rental'
                ? (isRu ? 'Бассейн, вид на море, близость к пляжу, трансфер...' : 'Pool, sea view, close to beach, transfer...')
                : (isRu ? 'Бассейн, вид на море, близость к пляжу...' : 'Pool, sea view, close to beach...')}
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              rows={3}
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button variant="outline" onClick={() => setStep('type')} className="flex-1">
              {isRu ? 'Назад' : 'Back'}
            </Button>
            <Button onClick={() => setStep('contact')} className="flex-1">
              {isRu ? 'Далее' : 'Continue'}
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      )}

      {/* Step 3: Contact */}
      {step === 'contact' && (
        <div className="space-y-6">
          <h2 className="text-lg font-semibold">
            {isRu ? 'Контактные данные' : 'Contact Information'}
          </h2>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>{isRu ? 'Ваше имя' : 'Your Name'} *</Label>
              <Input
                placeholder={isRu ? 'Как к вам обращаться?' : 'How should we call you?'}
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label>{isRu ? 'Телефон / WhatsApp' : 'Phone / WhatsApp'} *</Label>
              <Input
                type="tel"
                placeholder="+66..."
                value={formData.phone}
                onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label>{isRu ? 'Email' : 'Email'}</Label>
              <Input
                type="email"
                placeholder="your@email.com"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              />
            </div>

            <div className="space-y-3">
              <Label>{isRu ? 'Предпочтительный способ связи' : 'Preferred Contact Method'}</Label>
              <RadioGroup 
                value={formData.preferred_contact_method} 
                onValueChange={(v) => setFormData(prev => ({ ...prev, preferred_contact_method: v }))}
                className="flex flex-wrap gap-4"
              >
                <label className="flex items-center gap-2 cursor-pointer">
                  <RadioGroupItem value="whatsapp" />
                  <MessageCircle className="w-4 h-4" />
                  <span className="text-sm">WhatsApp</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <RadioGroupItem value="telegram" />
                  <MessageCircle className="w-4 h-4" />
                  <span className="text-sm">Telegram</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <RadioGroupItem value="phone" />
                  <Phone className="w-4 h-4" />
                  <span className="text-sm">{isRu ? 'Звонок' : 'Phone Call'}</span>
                </label>
              </RadioGroup>
            </div>
          </div>

          {/* Summary */}
          <Card className="bg-muted/50">
            <CardContent className="p-4 text-sm space-y-2">
              <div className="font-medium mb-3">
                {isRu ? 'Ваша заявка:' : 'Your request:'}
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{isRu ? 'Тип' : 'Type'}:</span>
                <span>
                  {requestType === 'vacation_rental' && (isRu ? 'Аренда на отпуск' : 'Vacation Rental')}
                  {requestType === 'property_consultation' && (isRu ? 'Покупка' : 'Purchase')}
                  {requestType === 'property_tour' && (isRu ? 'Тур' : 'Tour')}
                  {requestType === 'investment_advice' && (isRu ? 'Инвестиции' : 'Investment')}
                </span>
              </div>
              {requestType === 'vacation_rental' && formData.check_in && formData.check_out && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{isRu ? 'Даты' : 'Dates'}:</span>
                  <span>{formatDateDisplay(formData.check_in)} — {formatDateDisplay(formData.check_out)}</span>
                </div>
              )}
              {requestType === 'vacation_rental' && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{isRu ? 'Гости' : 'Guests'}:</span>
                  <span>
                    {formData.guests_count} {isRu ? 'взр.' : 'adults'}
                    {formData.children_count > 0 && `, ${formData.children_count} ${isRu ? 'дет.' : 'child.'}`}
                  </span>
                </div>
              )}
              {formData.property_types.length > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{isRu ? 'Тип' : 'Property'}:</span>
                  <span>{formData.property_types.map(t => 
                    PROPERTY_TYPES.find(pt => pt.value === t)?.[isRu ? 'labelRu' : 'labelEn']
                  ).join(', ')}</span>
                </div>
              )}
              {formData.districts.length > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{isRu ? 'Районы' : 'Districts'}:</span>
                  <span className="text-right max-w-[60%]">{formData.districts.map(d => 
                    DISTRICTS.find(dt => dt.value === d)?.[isRu ? 'labelRu' : 'labelEn']
                  ).join(', ')}</span>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="text-xs text-muted-foreground text-center">
            {requestType === 'vacation_rental' 
              ? (isRu ? 'Ответим в течение 2 часов' : 'We respond within 2 hours')
              : (isRu ? 'Мы свяжемся с вами в ближайшее время' : 'We will contact you shortly')}
          </div>

          <div className="flex gap-3 pt-2">
            <Button variant="outline" onClick={() => setStep('criteria')} className="flex-1">
              {isRu ? 'Назад' : 'Back'}
            </Button>
            <Button 
              onClick={handleSubmit} 
              className="flex-1"
              disabled={!formData.name || !formData.phone || isSubmitting}
            >
              {isSubmitting 
                ? (isRu ? 'Отправка...' : 'Sending...') 
                : (isRu ? 'Отправить заявку' : 'Submit Request')}
            </Button>
          </div>
        </div>
      )}
    </PageContainer>
  );
}
