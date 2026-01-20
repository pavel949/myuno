import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useConsultationRequests } from '@/hooks/useConsultationRequests';
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
import { 
  Home, Search, MapPin, TrendingUp, Calendar,
  Phone, Mail, MessageCircle, CheckCircle, ArrowRight
} from 'lucide-react';

type RequestType = 'property_consultation' | 'property_tour' | 'investment_advice';

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

export default function PropertyConsultation() {
  const { language } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();
  const isRu = language === 'ru';
  
  const { requestPropertyConsultation, requestPropertyTour, requestInvestmentAdvice } = useConsultationRequests();

  const [requestType, setRequestType] = useState<RequestType>('property_consultation');
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
      const payload = {
        name: formData.name,
        email: formData.email || undefined,
        phone: formData.phone,
        preferred_contact_method: formData.preferred_contact_method,
        preferred_language: language,
        budget_min: formData.budget_min ? Number(formData.budget_min) : undefined,
        budget_max: formData.budget_max ? Number(formData.budget_max) : undefined,
        currency: 'THB',
        property_types: formData.property_types.length > 0 ? formData.property_types : undefined,
        districts: formData.districts.length > 0 ? formData.districts : undefined,
        bedrooms_min: formData.bedrooms_min ? Number(formData.bedrooms_min) : undefined,
        bedrooms_max: formData.bedrooms_max ? Number(formData.bedrooms_max) : undefined,
        purpose: formData.purpose || undefined,
        notes: formData.notes || undefined,
      };

      if (requestType === 'property_consultation') {
        await requestPropertyConsultation.mutateAsync(payload);
      } else if (requestType === 'property_tour') {
        await requestPropertyTour.mutateAsync(payload);
      } else {
        await requestInvestmentAdvice.mutateAsync(payload);
      }
      
      setIsSuccess(true);
    } catch (error) {
      console.error('Failed to submit consultation request:', error);
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
            {isRu 
              ? 'Наш менеджер свяжется с вами в ближайшее время для обсуждения ваших пожеланий.' 
              : 'Our manager will contact you shortly to discuss your requirements.'}
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
            <label className="cursor-pointer">
              <Card className={`transition-all ${requestType === 'property_consultation' ? 'border-primary ring-2 ring-primary/20' : ''}`}>
                <CardContent className="flex items-start gap-4 p-4">
                  <RadioGroupItem value="property_consultation" className="mt-1" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Search className="w-5 h-5 text-primary" />
                      <span className="font-medium">
                        {isRu ? 'Подобрать недвижимость' : 'Find Property'}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {isRu 
                        ? 'Расскажите о своих пожеланиях, и мы подберём лучшие варианты' 
                        : 'Tell us your preferences and we will find the best options'}
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
            {isRu ? 'Ваши критерии' : 'Your Criteria'}
          </h2>

          {/* Budget */}
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

          {/* Property Types */}
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

          {/* Bedrooms */}
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

          {/* Districts */}
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

          {/* Purpose */}
          <div className="space-y-3">
            <Label>{isRu ? 'Цель' : 'Purpose'}</Label>
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

          {/* Notes */}
          <div className="space-y-3">
            <Label>{isRu ? 'Дополнительные пожелания' : 'Additional Requirements'}</Label>
            <Textarea
              placeholder={isRu ? 'Бассейн, вид на море, близость к пляжу...' : 'Pool, sea view, close to beach...'}
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
                placeholder="email@example.com"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              />
            </div>

            <div className="space-y-3">
              <Label>{isRu ? 'Предпочтительный способ связи' : 'Preferred Contact Method'}</Label>
              <div className="flex gap-2">
                {[
                  { value: 'whatsapp', icon: MessageCircle, label: 'WhatsApp' },
                  { value: 'phone', icon: Phone, label: isRu ? 'Звонок' : 'Call' },
                  { value: 'email', icon: Mail, label: 'Email' },
                ].map((method) => (
                  <button
                    key={method.value}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, preferred_contact_method: method.value }))}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      formData.preferred_contact_method === method.value
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted hover:bg-muted/80'
                    }`}
                  >
                    <method.icon className="w-4 h-4" />
                    {method.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
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
