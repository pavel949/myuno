import { useState } from 'react';
import { logger } from '@/lib/logger';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useConsultationRequests } from '@/hooks/useConsultationRequests';
import { useOwnerProperties } from '@/hooks/usePropertyCare';
import { PageContainer } from '@/components/uno/PageContainer';
import { PageHeader } from '@/components/uno/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Badge } from '@/components/ui/badge';
import { APP_ROUTES } from '@/lib/config/routes';
import { 
  Home, CheckCircle, Users, Calendar, Sparkles, 
  Brush, Wrench, DollarSign, HeadphonesIcon, Key,
  TrendingUp, Shield, Clock, Star
} from 'lucide-react';

const SERVICES = [
  { 
    value: 'bookings', 
    icon: Users,
    labelEn: 'Guest bookings & management', 
    labelRu: 'Поиск и управление гостями',
    descEn: 'We find guests, handle inquiries, and manage all bookings',
    descRu: 'Найдём гостей, обработаем заявки и управляем бронированиями',
  },
  { 
    value: 'check_in_out', 
    icon: Key,
    labelEn: 'Check-in / Check-out', 
    labelRu: 'Check-in / Check-out',
    descEn: 'Meet guests, hand over keys, and handle departures',
    descRu: 'Встретим гостей, передадим ключи, проводим при выезде',
  },
  { 
    value: 'cleaning', 
    icon: Brush,
    labelEn: 'Cleaning after guests', 
    labelRu: 'Уборка после гостей',
    descEn: 'Professional cleaning and linen change',
    descRu: 'Профессиональная уборка и смена белья',
  },
  { 
    value: 'maintenance', 
    icon: Wrench,
    labelEn: 'Technical maintenance', 
    labelRu: 'Техническое обслуживание',
    descEn: 'Pool, AC, repairs, and ongoing maintenance',
    descRu: 'Бассейн, кондиционеры, ремонт и текущее обслуживание',
  },
  { 
    value: 'utilities', 
    icon: DollarSign,
    labelEn: 'Utility payments', 
    labelRu: 'Оплата коммунальных услуг',
    descEn: 'We handle all bills and payments on your behalf',
    descRu: 'Оплатим все счета от вашего имени',
  },
  { 
    value: 'accounting', 
    icon: TrendingUp,
    labelEn: 'Financial reporting', 
    labelRu: 'Финансовая отчётность',
    descEn: 'Monthly reports on income, expenses, and occupancy',
    descRu: 'Ежемесячные отчёты о доходах, расходах и заполняемости',
  },
  { 
    value: 'support', 
    icon: HeadphonesIcon,
    labelEn: '24/7 Guest support', 
    labelRu: 'Поддержка гостей 24/7',
    descEn: 'Round-the-clock assistance for your guests',
    descRu: 'Круглосуточная помощь вашим гостям',
  },
];

const OCCUPANCY_OPTIONS = [
  { value: 'vacant', labelEn: 'Vacant', labelRu: 'Свободен' },
  { value: 'tenant', labelEn: 'Has a tenant', labelRu: 'Есть арендатор' },
  { value: 'owner_use', labelEn: 'I use it myself', labelRu: 'Использую сам' },
];

export default function FullManagement() {
  const { language } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();
  const isRu = language === 'ru';
  
  const { requestFullManagement } = useConsultationRequests();
  const { data: properties } = useOwnerProperties();

  const [step, setStep] = useState<'info' | 'form'>('info');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const [formData, setFormData] = useState({
    name: user?.user_metadata?.full_name || '',
    email: user?.email || '',
    phone: '',
    owner_property_id: '',
    services_requested: ['bookings', 'check_in_out', 'cleaning'] as string[],
    current_occupancy: 'vacant',
    notes: '',
  });

  const handleServiceToggle = (value: string) => {
    setFormData(prev => ({
      ...prev,
      services_requested: prev.services_requested.includes(value)
        ? prev.services_requested.filter(s => s !== value)
        : [...prev.services_requested, value],
    }));
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.phone) return;
    
    setIsSubmitting(true);
    try {
      await requestFullManagement.mutateAsync({
        name: formData.name,
        email: formData.email || undefined,
        phone: formData.phone,
        preferred_language: language,
        owner_property_id: formData.owner_property_id || undefined,
        services_requested: formData.services_requested,
        current_occupancy: formData.current_occupancy,
        notes: formData.notes || undefined,
      });
      
      setIsSuccess(true);
    } catch (error) {
      logger.error('Failed to submit management request:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <PageContainer>
        <PageHeader 
          title={isRu ? 'Заявка отправлена' : 'Request Sent'}
          showBack
          fallbackPath="/owner"
        />
        
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
          <div className="w-20 h-20 rounded-full bg-success/20 flex items-center justify-center mb-6">
            <CheckCircle className="w-10 h-10 text-success" />
          </div>
          
          <h2 className="text-2xl font-bold mb-2">
            {isRu ? 'Заявка принята!' : 'Request Received!'}
          </h2>
          
          <p className="text-muted-foreground mb-8 max-w-sm">
            {isRu 
              ? 'Наш менеджер свяжется с вами в течение 24 часов для обсуждения условий управления.' 
              : 'Our manager will contact you within 24 hours to discuss management terms.'}
          </p>
          
          <div className="flex flex-col gap-3 w-full max-w-xs">
            <Button onClick={() => navigate('/owner')} size="lg">
              {isRu ? 'В личный кабинет' : 'Go to Dashboard'}
            </Button>
          </div>
        </div>
      </PageContainer>
    );
  }

  if (step === 'info') {
    return (
      <PageContainer>
        <PageHeader 
          title="myUNO Full Management"
          subtitle={isRu ? 'Передайте управление профессионалам' : 'Leave it to the professionals'}
          showBack
          fallbackPath="/owner"
        />

        {/* Hero Section */}
        <Card className="mb-6 border-primary/30 bg-gradient-to-br from-primary/5 to-primary/10">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 rounded-2xl bg-primary/20">
                <Sparkles className="w-8 h-8 text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-bold">
                  {isRu ? 'Полное управление' : 'Full Management'}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {isRu ? 'Мы возьмём всё на себя' : 'We take care of everything'}
                </p>
              </div>
            </div>
            
            <p className="text-sm text-muted-foreground mb-4">
              {isRu 
                ? 'Доверьте управление своей недвижимостью команде myUNO. Мы найдём гостей, обеспечим сервис и максимизируем ваш доход.' 
                : 'Trust your property management to the myUNO team. We find guests, provide service, and maximize your income.'}
            </p>

            <div className="flex items-center gap-2 text-sm flex-wrap">
              <Badge variant="secondary" className="bg-primary/20">
                {isRu ? '70% вам / 30% нам' : '70% you / 30% us'}
              </Badge>
              <Badge variant="outline">
                {isRu ? 'После расходов' : 'After expenses'}
              </Badge>
              <Badge variant="outline">
                {isRu ? 'Без скрытых платежей' : 'No hidden fees'}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Benefits - Condensed */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          {[
            { 
              icon: TrendingUp, 
              titleEn: 'Higher Occupancy', 
              titleRu: 'Загрузка 85%',
            },
            { 
              icon: Shield, 
              titleEn: 'Verified Guests', 
              titleRu: 'Проверка гостей',
            },
          ].map((benefit, idx) => (
            <Card key={idx}>
              <CardContent className="flex items-center gap-3 p-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <benefit.icon className="w-4 h-4 text-primary" />
                </div>
                <span className="font-medium text-sm">
                  {isRu ? benefit.titleRu : benefit.titleEn}
                </span>
              </CardContent>
            </Card>
          ))}
        </div>

        <Button onClick={() => setStep('form')} className="w-full" size="lg">
          {isRu ? 'Оставить заявку' : 'Submit Request'}
        </Button>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader 
        title={isRu ? 'Заявка на управление' : 'Management Request'}
        showBack
        fallbackPath={APP_ROUTES.OWNER_FULL_MANAGEMENT}
      />

      <div className="space-y-6">
        {/* Property Selection (if has properties) */}
        {properties && properties.length > 0 && (
          <div className="space-y-3">
            <Label>{isRu ? 'Выберите объект' : 'Select Property'}</Label>
            <RadioGroup 
              value={formData.owner_property_id}
              onValueChange={(v) => setFormData(prev => ({ ...prev, owner_property_id: v }))}
            >
              {properties.map((property) => (
                <label key={property.id} className="cursor-pointer">
                  <Card className={`transition-all ${formData.owner_property_id === property.id ? 'border-primary ring-2 ring-primary/20' : ''}`}>
                    <CardContent className="flex items-center gap-3 p-3">
                      <RadioGroupItem value={property.id} />
                      <div className="flex-1">
                        <p className="font-medium text-sm">{property.title}</p>
                        <p className="text-xs text-muted-foreground">{property.address}</p>
                      </div>
                    </CardContent>
                  </Card>
                </label>
              ))}
              <label className="cursor-pointer">
                <Card className={`transition-all ${formData.owner_property_id === '' ? 'border-primary ring-2 ring-primary/20' : ''}`}>
                  <CardContent className="flex items-center gap-3 p-3">
                    <RadioGroupItem value="" />
                    <p className="text-sm text-muted-foreground">
                      {isRu ? 'Другой объект (опишу ниже)' : 'Other property (will describe below)'}
                    </p>
                  </CardContent>
                </Card>
              </label>
            </RadioGroup>
          </div>
        )}

        {/* Services */}
        <div className="space-y-3">
          <Label>{isRu ? 'Какие услуги вам нужны?' : 'Which services do you need?'}</Label>
          <div className="space-y-2">
            {SERVICES.map((service) => (
              <label 
                key={service.value}
                className="flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors hover:bg-muted/50"
              >
                <Checkbox
                  checked={formData.services_requested.includes(service.value)}
                  onCheckedChange={() => handleServiceToggle(service.value)}
                  className="mt-0.5"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <service.icon className="w-4 h-4 text-primary" />
                    <span className="font-medium text-sm">
                      {isRu ? service.labelRu : service.labelEn}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {isRu ? service.descRu : service.descEn}
                  </p>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Current Occupancy */}
        <div className="space-y-3">
          <Label>{isRu ? 'Текущий статус объекта' : 'Current Property Status'}</Label>
          <RadioGroup 
            value={formData.current_occupancy}
            onValueChange={(v) => setFormData(prev => ({ ...prev, current_occupancy: v }))}
          >
            {OCCUPANCY_OPTIONS.map((option) => (
              <label key={option.value} className="flex items-center gap-3 cursor-pointer">
                <RadioGroupItem value={option.value} />
                <span className="text-sm">{isRu ? option.labelRu : option.labelEn}</span>
              </label>
            ))}
          </RadioGroup>
        </div>

        {/* Contact Info */}
        <div className="space-y-4">
          <h3 className="font-semibold">{isRu ? 'Контактные данные' : 'Contact Information'}</h3>
          
          <div className="space-y-2">
            <Label>{isRu ? 'Ваше имя' : 'Your Name'} *</Label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder={isRu ? 'Как к вам обращаться?' : 'How should we call you?'}
            />
          </div>

          <div className="space-y-2">
            <Label>{isRu ? 'Телефон / WhatsApp' : 'Phone / WhatsApp'} *</Label>
            <Input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
              placeholder="+66..."
            />
          </div>

          <div className="space-y-2">
            <Label>Email</Label>
            <Input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              placeholder="email@example.com"
            />
          </div>
        </div>

        {/* Notes */}
        <div className="space-y-2">
          <Label>{isRu ? 'Комментарий' : 'Comments'}</Label>
          <Textarea
            value={formData.notes}
            onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
            placeholder={isRu ? 'Дополнительная информация об объекте...' : 'Additional information about the property...'}
            rows={3}
          />
        </div>

        <Button 
          onClick={handleSubmit}
          className="w-full"
          size="lg"
          disabled={!formData.name || !formData.phone || formData.services_requested.length === 0 || isSubmitting}
        >
          {isSubmitting 
            ? (isRu ? 'Отправка...' : 'Sending...') 
            : (isRu ? 'Отправить заявку' : 'Submit Request')}
        </Button>
      </div>
    </PageContainer>
  );
}
