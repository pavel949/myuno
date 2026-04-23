import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useVendorProfile, useVendorServices } from '@/hooks/useVendor';
import { useUserContext } from '@/hooks/useUserContext';
import { OnboardingLayout } from '@/components/layout/OnboardingLayout';
import { PageContainer } from '@/components/uno/PageContainer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { UnifiedMediaUploader } from '@/components/upload/UnifiedMediaUploader';
import { CategoryPicker } from '@/components/vendor/onboarding/CategoryPicker';
import { toast } from 'sonner';
import { 
  ArrowRight, Phone, Loader2, CheckCircle2, Rocket,
  Package, ChevronRight, Store
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

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
  const [categoryLabel, setCategoryLabel] = useState('');
  const [phone, setPhone] = useState('');

  // Step 2: First listing
  const [serviceName, setServiceName] = useState('');
  const [servicePrice, setServicePrice] = useState('');
  const [serviceDescription, setServiceDescription] = useState('');
  const [servicePhoto, setServicePhoto] = useState('');

  const { createService } = useVendorServices(createdProviderId || undefined);

  React.useEffect(() => {
    if (!authLoading && !user) navigate('/auth');
  }, [user, authLoading, navigate]);

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

          {/* Airbnb-style step indicator */}
          <div className="flex gap-1.5 mb-8">
            {[0, 1, 2].map((step) => (
              <div
                key={step}
                className={cn(
                  'h-1 flex-1 rounded-full transition-all duration-300',
                  step <= currentStep ? 'bg-primary' : 'bg-muted'
                )}
              />
            ))}
          </div>

          <AnimatePresence mode="wait">
            {/* STEP 1: Business Info — Airbnb style */}
            {currentStep === 0 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.2 }}
              >
                <h2 className="text-2xl font-bold tracking-tight mb-1">
                  {isRu ? 'Расскажите о себе' : 'Tell us about your business'}
                </h2>
                <p className="text-muted-foreground text-sm mb-8">
                  {isRu ? 'Заполните 3 поля и начните за 2 минуты' : 'Fill 3 fields and get started in 2 minutes'}
                </p>

                {/* Stacked input group — Airbnb aesthetic */}
                <div className="rounded-none border border-border overflow-hidden mb-6">
                  {/* Business name */}
                  <div className="relative group">
                    <input
                      id="businessName"
                      value={businessName}
                      onChange={(e) => setBusinessName(e.target.value)}
                      placeholder=" "
                      autoFocus
                      className={cn(
                        "peer w-full px-4 pt-7 pb-2 text-base bg-card border-0 outline-none",
                        "focus:ring-2 focus:ring-inset focus:ring-primary/50",
                        "placeholder-transparent"
                      )}
                    />
                    <label
                      htmlFor="businessName"
                      className={cn(
                        "absolute left-4 top-2 text-[11px] font-medium text-muted-foreground",
                        "transition-all duration-150",
                        "peer-placeholder-shown:top-4 peer-placeholder-shown:text-sm peer-placeholder-shown:font-normal",
                        "peer-focus:top-2 peer-focus:text-[11px] peer-focus:font-medium peer-focus:text-primary"
                      )}
                    >
                      {isRu ? 'Название бизнеса' : 'Business name'}
                    </label>
                  </div>

                  <div className="h-px bg-border" />

                  {/* Phone */}
                  <div className="relative group">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none z-10" />
                    <input
                      id="phone"
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder=" "
                      className={cn(
                        "peer w-full pl-10 pr-4 pt-7 pb-2 text-base bg-card border-0 outline-none",
                        "focus:ring-2 focus:ring-inset focus:ring-primary/50",
                        "placeholder-transparent"
                      )}
                    />
                    <label
                      htmlFor="phone"
                      className={cn(
                        "absolute left-10 top-2 text-[11px] font-medium text-muted-foreground",
                        "transition-all duration-150",
                        "peer-placeholder-shown:top-4 peer-placeholder-shown:text-sm peer-placeholder-shown:font-normal",
                        "peer-focus:top-2 peer-focus:text-[11px] peer-focus:font-medium peer-focus:text-primary"
                      )}
                    >
                      {isRu ? 'Телефон / WhatsApp (необязательно)' : 'Phone / WhatsApp (optional)'}
                    </label>
                  </div>
                </div>

                {/* Category picker */}
                <div className="mb-6">
                  <p className="text-sm font-semibold mb-3">
                    {isRu ? 'Чем вы занимаетесь?' : 'What do you do?'} <span className="text-destructive">*</span>
                  </p>
                  <CategoryPicker
                    value={category}
                    onChange={(id, label) => {
                      setCategory(id);
                      setCategoryLabel(label);
                    }}
                  />
                </div>

                <Button
                  onClick={handleStep1Submit}
                  disabled={isSubmitting || !businessName.trim() || !category}
                  className="w-full h-14 text-base font-semibold rounded-none"
                  size="lg"
                >
                  {isSubmitting ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : null}
                  {isRu ? 'Далее' : 'Next'}
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </motion.div>
            )}

            {/* STEP 2: First Listing — Airbnb style */}
            {currentStep === 1 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.2 }}
              >
                <h2 className="text-2xl font-bold tracking-tight mb-1">
                  {isRu ? 'Ваше первое предложение' : 'Your first listing'}
                </h2>
                <p className="text-muted-foreground text-sm mb-8">
                  {isRu
                    ? 'Добавьте услугу или товар — детали можно дополнить позже'
                    : 'Add a service or product — you can refine details later'}
                </p>

                {/* Stacked inputs */}
                <div className="rounded-none border border-border overflow-hidden mb-6">
                  {/* Service name */}
                  <div className="relative">
                    <input
                      id="serviceName"
                      value={serviceName}
                      onChange={(e) => setServiceName(e.target.value)}
                      placeholder=" "
                      autoFocus
                      className={cn(
                        "peer w-full px-4 pt-7 pb-2 text-base bg-card border-0 outline-none",
                        "focus:ring-2 focus:ring-inset focus:ring-primary/50",
                        "placeholder-transparent"
                      )}
                    />
                    <label
                      htmlFor="serviceName"
                      className={cn(
                        "absolute left-4 top-2 text-[11px] font-medium text-muted-foreground",
                        "transition-all duration-150",
                        "peer-placeholder-shown:top-4 peer-placeholder-shown:text-sm peer-placeholder-shown:font-normal",
                        "peer-focus:top-2 peer-focus:text-[11px] peer-focus:font-medium peer-focus:text-primary"
                      )}
                    >
                      {isRu ? 'Название услуги / товара' : 'Service / Product name'}
                    </label>
                  </div>

                  <div className="h-px bg-border" />

                  {/* Price */}
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-base text-muted-foreground font-medium pointer-events-none z-10">฿</span>
                    <input
                      id="servicePrice"
                      type="number"
                      min="0"
                      value={servicePrice}
                      onChange={(e) => setServicePrice(e.target.value)}
                      placeholder=" "
                      className={cn(
                        "peer w-full pl-9 pr-4 pt-7 pb-2 text-base bg-card border-0 outline-none",
                        "focus:ring-2 focus:ring-inset focus:ring-primary/50",
                        "placeholder-transparent",
                        "[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      )}
                    />
                    <label
                      htmlFor="servicePrice"
                      className={cn(
                        "absolute left-9 top-2 text-[11px] font-medium text-muted-foreground",
                        "transition-all duration-150",
                        "peer-placeholder-shown:top-4 peer-placeholder-shown:text-sm peer-placeholder-shown:font-normal",
                        "peer-focus:top-2 peer-focus:text-[11px] peer-focus:font-medium peer-focus:text-primary"
                      )}
                    >
                      {isRu ? 'Цена (THB)' : 'Price (THB)'}
                    </label>
                  </div>

                  <div className="h-px bg-border" />

                  {/* Description */}
                  <div className="relative">
                    <textarea
                      id="serviceDescription"
                      value={serviceDescription}
                      onChange={(e) => setServiceDescription(e.target.value)}
                      placeholder=" "
                      rows={2}
                      className={cn(
                        "peer w-full px-4 pt-7 pb-2 text-base bg-card border-0 outline-none resize-none",
                        "focus:ring-2 focus:ring-inset focus:ring-primary/50",
                        "placeholder-transparent"
                      )}
                    />
                    <label
                      htmlFor="serviceDescription"
                      className={cn(
                        "absolute left-4 top-2 text-[11px] font-medium text-muted-foreground",
                        "transition-all duration-150",
                        "peer-placeholder-shown:top-4 peer-placeholder-shown:text-sm peer-placeholder-shown:font-normal",
                        "peer-focus:top-2 peer-focus:text-[11px] peer-focus:font-medium peer-focus:text-primary"
                      )}
                    >
                      {isRu ? 'Описание (необязательно)' : 'Description (optional)'}
                    </label>
                  </div>
                </div>

                {/* Photo upload */}
                <div className="mb-6">
                  <p className="text-sm font-medium text-muted-foreground mb-2">
                    {isRu ? 'Фото (необязательно)' : 'Photo (optional)'}
                  </p>
                  <UnifiedMediaUploader
                    mode="single"
                    value={servicePhoto}
                    onChange={(v) => setServicePhoto(typeof v === 'string' ? v : v[0] || '')}
                    folder="vendor-services"
                    placeholder={isRu ? 'Загрузите фото' : 'Upload a photo'}
                  />
                </div>

                <Button
                  onClick={handleStep2Submit}
                  disabled={isSubmitting || !serviceName.trim() || !servicePrice}
                  className="w-full h-14 text-base font-semibold rounded-none"
                  size="lg"
                >
                  {isSubmitting ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : null}
                  {isRu ? 'Опубликовать' : 'Publish Listing'}
                  <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
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
                  <p className="text-muted-foreground mb-8 max-w-sm mx-auto">
                    {isRu
                      ? 'Объявление отправлено на модерацию. Завершите профиль, чтобы получить верификацию быстрее.'
                      : 'Your listing is pending review. Complete your profile to get verified faster.'}
                  </p>

                  {/* Checklist */}
                  <div className="text-left rounded-none border border-border p-5 mb-8 space-y-3">
                    <p className="text-sm font-semibold">
                      {isRu ? 'Что дальше:' : 'What\'s next:'}
                    </p>
                    {[
                      { done: true, en: 'Create account', ru: 'Создать аккаунт' },
                      { done: true, en: 'Add first listing', ru: 'Добавить объявление' },
                      { done: false, en: 'Add business description', ru: 'Добавить описание' },
                      { done: false, en: 'Upload logo & cover photo', ru: 'Загрузить логотип' },
                      { done: false, en: 'Set working hours', ru: 'Указать часы работы' },
                    ].map((item, i) => (
                      <div key={i} className="flex items-center gap-3 text-sm">
                        {item.done ? (
                          <CheckCircle2 className="h-5 w-5 text-primary shrink-0" />
                        ) : (
                          <div className="w-5 h-5 rounded-full border-2 border-muted-foreground/30 shrink-0" />
                        )}
                        <span className={item.done ? 'text-muted-foreground line-through' : 'text-foreground'}>
                          {isRu ? item.ru : item.en}
                        </span>
                      </div>
                    ))}
                  </div>

                  <Button
                    onClick={() => navigate('/vendor')}
                    className="w-full h-14 text-base font-semibold rounded-none"
                    size="lg"
                  >
                    {isRu ? 'Перейти в панель управления' : 'Go to Dashboard'}
                    <ArrowRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <p className="text-[11px] text-center text-muted-foreground mt-8">
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
