import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useVendorProfile, useVendorServices } from '@/hooks/useVendor';
import { useUserContext } from '@/hooks/useUserContext';
import { OnboardingLayout } from '@/components/layout/OnboardingLayout';
import { PageContainer } from '@/components/uno/PageContainer';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { UnifiedMediaUploader } from '@/components/upload/UnifiedMediaUploader';
import { toast } from 'sonner';
import { 
  Store, ArrowRight, Phone, Loader2, Utensils, Car, Sparkles, 
  Stethoscope, GraduationCap, Brush, Baby, Flower2, Ship, Home, 
  Calendar, Dumbbell, Scale, PawPrint, CheckCircle2, Rocket,
  Package, ChevronRight
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

// Category options for dropdown
const categoryOptions = [
  { value: 'beauty', labelEn: 'Beauty & Spa', labelRu: 'Красота и спа', icon: '✨' },
  { value: 'fitness', labelEn: 'Fitness & Sports', labelRu: 'Фитнес и спорт', icon: '💪' },
  { value: 'restaurants', labelEn: 'Restaurants & Food', labelRu: 'Рестораны и еда', icon: '🍽️' },
  { value: 'tours', labelEn: 'Tours & Excursions', labelRu: 'Туры и экскурсии', icon: '🗺️' },
  { value: 'yachts', labelEn: 'Yachts & Water', labelRu: 'Яхты и водные', icon: '⛵' },
  { value: 'transport', labelEn: 'Transport', labelRu: 'Транспорт', icon: '🚗' },
  { value: 'health', labelEn: 'Medical & Health', labelRu: 'Медицина', icon: '🏥' },
  { value: 'education', labelEn: 'Education', labelRu: 'Образование', icon: '🎓' },
  { value: 'properties', labelEn: 'Properties', labelRu: 'Недвижимость', icon: '🏠' },
  { value: 'cleaning', labelEn: 'Cleaning', labelRu: 'Клининг', icon: '🧹' },
  { value: 'childcare', labelEn: 'Childcare', labelRu: 'Няни и уход', icon: '👶' },
  { value: 'flowers', labelEn: 'Flowers & Gifts', labelRu: 'Цветы и подарки', icon: '💐' },
  { value: 'events', labelEn: 'Events', labelRu: 'Мероприятия', icon: '🎉' },
  { value: 'legal', labelEn: 'Legal Services', labelRu: 'Юридические услуги', icon: '⚖️' },
  { value: 'pets', labelEn: 'Pet Services', labelRu: 'Для питомцев', icon: '🐾' },
];

const VendorOnboarding = () => {
  const navigate = useNavigate();
  const { user, isLoading: authLoading } = useAuth();
  const { language } = useLanguage();
  const { profile, createProfile, isLoading: profileLoading } = useVendorProfile();
  const { vendorOrgs, isLoading: contextLoading } = useUserContext();
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdProviderId, setCreatedProviderId] = useState<string | null>(null);

  const isRu = language === 'ru';

  // Step 1: Business info
  const [businessName, setBusinessName] = useState('');
  const [category, setCategory] = useState('');
  const [phone, setPhone] = useState('');

  // Step 2: First listing
  const [serviceName, setServiceName] = useState('');
  const [servicePrice, setServicePrice] = useState('');
  const [serviceDescription, setServiceDescription] = useState('');
  const [servicePhoto, setServicePhoto] = useState('');

  // Use vendor services hook once we have provider ID
  const { createService } = useVendorServices(createdProviderId || undefined);

  // Auth redirect
  React.useEffect(() => {
    if (!authLoading && !user) navigate('/auth');
  }, [user, authLoading, navigate]);

  // Already onboarded redirect
  React.useEffect(() => {
    if (!contextLoading && vendorOrgs.length > 0) navigate('/vendor');
  }, [vendorOrgs, contextLoading, navigate]);

  const handleStep1Submit = async () => {
    if (!businessName.trim()) {
      toast.error(isRu ? 'Введите название бизнеса' : 'Enter business name');
      return;
    }
    if (!category) {
      toast.error(isRu ? 'Выберите категорию' : 'Select a category');
      return;
    }

    // If profile was already created (user went back), skip to step 2
    if (createdProviderId) {
      setCurrentStep(1);
      return;
    }

    setIsSubmitting(true);
    try {
      const { data, error } = await createProfile({
        business_name: businessName.trim(),
        business_category: category,
        verticals: [category],
        phone: phone.trim() || undefined,
        email: user?.email || undefined,
        commission_rate: 10,
        is_verified: false,
        is_active: true,
      });

      if (error) throw error;
      setCreatedProviderId(data?.id || null);
      setCurrentStep(1);
    } catch (error) {
      console.error('Error creating profile:', error);
      toast.error(isRu ? 'Ошибка при создании профиля' : 'Error creating profile');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStep2Submit = async () => {
    if (!serviceName.trim()) {
      toast.error(isRu ? 'Введите название услуги' : 'Enter service name');
      return;
    }
    if (!servicePrice || Number(servicePrice) <= 0) {
      toast.error(isRu ? 'Укажите цену' : 'Enter a price');
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await createService({
        name: serviceName.trim(),
        description: serviceDescription.trim() || undefined,
        price: Number(servicePrice),
        currency: 'THB',
        category: category,
        images: servicePhoto ? [servicePhoto] : [],
        is_active: true,
        max_capacity: 1,
      });

      if (error) throw error;
      setCurrentStep(2);
    } catch (error) {
      console.error('Error creating service:', error);
      toast.error(isRu ? 'Ошибка при создании услуги' : 'Error creating listing');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (authLoading || contextLoading) {
    return (
      <OnboardingLayout currentStep={1} totalSteps={3} title="Loading" titleRu="Загрузка" showBack={false} showClose={false}>
        <PageContainer>
          <div className="flex items-center justify-center min-h-[60vh]">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </PageContainer>
      </OnboardingLayout>
    );
  }

  const stepTitles = [
    { en: 'About You', ru: 'О вас' },
    { en: 'First Listing', ru: 'Первое объявление' },
    { en: "You're Live!", ru: 'Вы на связи!' },
  ];

  return (
    <OnboardingLayout
      currentStep={currentStep + 1}
      totalSteps={3}
      title={stepTitles[currentStep].en}
      titleRu={stepTitles[currentStep].ru}
      role="vendor"
      exitPath="/"
      showBack={currentStep > 0 && currentStep < 2}
      onBack={() => currentStep > 0 && setCurrentStep(currentStep - 1)}
    >
      <PageContainer className="pb-8">
        <div className="max-w-lg mx-auto">
        {/* Step Indicator */}
        <div className="flex items-center justify-center gap-2 mb-6">
          {[0, 1, 2].map((step) => (
            <div key={step} className="flex items-center gap-2">
              <div className={cn(
                'w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all',
                step < currentStep && 'bg-primary text-primary-foreground',
                step === currentStep && 'bg-primary text-primary-foreground ring-2 ring-primary/30 ring-offset-2 ring-offset-background',
                step > currentStep && 'bg-muted text-muted-foreground'
              )}>
                {step < currentStep ? <CheckCircle2 className="h-4 w-4" /> : step + 1}
              </div>
              {step < 2 && (
                <div className={cn(
                  'w-12 h-0.5 rounded-full',
                  step < currentStep ? 'bg-primary' : 'bg-muted'
                )} />
              )}
            </div>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {/* STEP 1: Business Info */}
          {currentStep === 0 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              <Card className="mb-6 border-primary/20 bg-gradient-to-br from-primary/5 to-accent/5">
                <CardContent className="p-5 text-center">
                  <div className="inline-flex p-3 rounded-full bg-primary/10 mb-3">
                    <Store className="h-6 w-6 text-primary" />
                  </div>
                  <h2 className="text-lg font-bold mb-1">
                    {isRu ? 'Расскажите о себе' : 'Tell us about your business'}
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    {isRu ? 'Всего 3 поля — начните за 2 минуты' : 'Just 3 fields — get started in 2 minutes'}
                  </p>
                </CardContent>
              </Card>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="businessName" className="text-sm font-medium">
                    {isRu ? 'Название бизнеса' : 'Business Name'} <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="businessName"
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    placeholder={isRu ? 'Например: Салон красоты Элегант' : 'e.g., Elegant Beauty Salon'}
                    autoFocus
                    className="h-12 text-base"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">
                    {isRu ? 'Категория' : 'Category'} <span className="text-destructive">*</span>
                  </Label>
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger className="h-12 text-base">
                      <SelectValue placeholder={isRu ? 'Выберите категорию...' : 'Choose a category...'} />
                    </SelectTrigger>
                    <SelectContent>
                      {categoryOptions.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          <span className="flex items-center gap-2">
                            <span>{opt.icon}</span>
                            <span>{isRu ? opt.labelRu : opt.labelEn}</span>
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-sm font-medium">
                    {isRu ? 'Телефон / WhatsApp' : 'Phone / WhatsApp'}
                  </Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="phone"
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+66 812 345 678"
                      className="h-12 text-base pl-10"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {isRu ? 'Необязательно — можно добавить позже' : 'Optional — you can add it later'}
                  </p>
                </div>

                <Button
                  onClick={handleStep1Submit}
                  disabled={isSubmitting}
                  className="w-full h-12 text-base font-semibold mt-4"
                  size="lg"
                >
                  {isSubmitting ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : null}
                  {isRu ? 'Далее' : 'Next'}
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </motion.div>
          )}

          {/* STEP 2: First Listing */}
          {currentStep === 1 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              <Card className="mb-6 border-primary/20 bg-gradient-to-br from-primary/5 to-accent/5">
                <CardContent className="p-5 text-center">
                  <div className="inline-flex p-3 rounded-full bg-primary/10 mb-3">
                    <Package className="h-6 w-6 text-primary" />
                  </div>
                  <h2 className="text-lg font-bold mb-1">
                    {isRu ? 'Ваше первое предложение' : 'Your first listing'}
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    {isRu ? 'Добавьте услугу или товар — остальное можно дополнить позже' : 'Add a service or product — you can add more details later'}
                  </p>
                </CardContent>
              </Card>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="serviceName" className="text-sm font-medium">
                    {isRu ? 'Название услуги / товара' : 'Service / Product Name'} <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="serviceName"
                    value={serviceName}
                    onChange={(e) => setServiceName(e.target.value)}
                    placeholder={isRu ? 'Например: Стрижка мужская' : 'e.g., Men\'s Haircut'}
                    autoFocus
                    className="h-12 text-base"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="servicePrice" className="text-sm font-medium">
                    {isRu ? 'Цена (THB)' : 'Price (THB)'} <span className="text-destructive">*</span>
                  </Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">฿</span>
                    <Input
                      id="servicePrice"
                      type="number"
                      min="0"
                      value={servicePrice}
                      onChange={(e) => setServicePrice(e.target.value)}
                      placeholder="500"
                      className="h-12 text-base pl-8"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">
                    {isRu ? 'Фото' : 'Photo'}
                    <span className="text-muted-foreground font-normal ml-1">
                      ({isRu ? 'необязательно' : 'optional'})
                    </span>
                  </Label>
                  <UnifiedMediaUploader
                    mode="single"
                    value={servicePhoto}
                    onChange={(v) => setServicePhoto(typeof v === 'string' ? v : v[0] || '')}
                    folder="vendor-services"
                    placeholder={isRu ? 'Загрузите фото услуги' : 'Upload a photo of your service'}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="serviceDescription" className="text-sm font-medium">
                    {isRu ? 'Краткое описание' : 'Brief description'}
                    <span className="text-muted-foreground font-normal ml-1">
                      ({isRu ? 'необязательно' : 'optional'})
                    </span>
                  </Label>
                  <Textarea
                    id="serviceDescription"
                    value={serviceDescription}
                    onChange={(e) => setServiceDescription(e.target.value)}
                    placeholder={isRu ? 'Опишите в нескольких словах...' : 'Describe in a few words...'}
                    rows={2}
                  />
                </div>

                <Button
                  onClick={handleStep2Submit}
                  disabled={isSubmitting}
                  className="w-full h-12 text-base font-semibold mt-4"
                  size="lg"
                >
                  {isSubmitting ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : null}
                  {isRu ? 'Опубликовать' : 'Publish Listing'}
                  <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </motion.div>
          )}

          {/* STEP 3: Success */}
          {currentStep === 2 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
              className="text-center"
            >
              <div className="py-8">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.15, type: 'spring', stiffness: 200 }}
                  className="inline-flex p-5 rounded-full bg-primary/10 mb-5"
                >
                  <Rocket className="h-10 w-10 text-primary" />
                </motion.div>

                <h2 className="text-2xl font-bold mb-2">
                  {isRu ? '🎉 Вы в деле!' : '🎉 You\'re Live!'}
                </h2>
                <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
                  {isRu
                    ? 'Ваше объявление отправлено на проверку. Завершите профиль, чтобы получить верификацию быстрее.'
                    : 'Your listing is pending review. Complete your profile to get verified faster.'}
                </p>

                {/* Quick checklist preview */}
                <Card className="text-left mb-6 border-primary/20">
                  <CardContent className="p-4 space-y-2.5">
                    <p className="text-sm font-semibold mb-3">
                      {isRu ? 'Что дальше:' : 'What\'s next:'}
                    </p>
                    {[
                      { done: true, en: 'Create account', ru: 'Создать аккаунт' },
                      { done: true, en: 'Add first listing', ru: 'Добавить объявление' },
                      { done: false, en: 'Add business description', ru: 'Добавить описание' },
                      { done: false, en: 'Upload logo & cover photo', ru: 'Загрузить логотип' },
                      { done: false, en: 'Set working hours', ru: 'Указать часы работы' },
                    ].map((item, i) => (
                      <div key={i} className="flex items-center gap-2.5 text-sm">
                        {item.done ? (
                          <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                        ) : (
                          <div className="w-4 h-4 rounded-full border-2 border-muted-foreground/30 shrink-0" />
                        )}
                        <span className={item.done ? 'text-muted-foreground line-through' : 'text-foreground'}>
                          {isRu ? item.ru : item.en}
                        </span>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                <Button
                  onClick={() => navigate('/vendor')}
                  className="w-full h-12 text-base font-semibold"
                  size="lg"
                >
                  {isRu ? 'Перейти в панель управления' : 'Go to Dashboard'}
                  <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <p className="text-xs text-center text-muted-foreground mt-6">
          {isRu 
            ? 'Нажимая кнопку, вы соглашаетесь с условиями партнёрской программы'
            : 'By continuing, you agree to the partner program terms'}
        </p>
        </div>
      </PageContainer>
    </OnboardingLayout>
  );
};

export default VendorOnboarding;
