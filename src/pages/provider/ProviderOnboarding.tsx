import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useCategories } from '@/hooks/useCategories';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageContainer } from '@/components/uno/PageContainer';
import { PageHeader } from '@/components/uno/PageHeader';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { 
  Check, ArrowRight, ArrowLeft, Loader2, Phone, Mail,
  User, MessageSquare, Store, Building2, Package
} from 'lucide-react';

type Step = 'category' | 'details' | 'contact' | 'success';

const ProviderOnboarding = () => {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const { user } = useAuth();
  const { flatCategories, getName, isLoading: categoriesLoading } = useCategories();
  const isRu = language === 'ru';

  const [step, setStep] = useState<Step>('category');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    businessName: '',
    description: '',
    contactName: '',
    email: user?.email || '',
    phone: '',
  });

  const toggleCategory = (id: string) => {
    setSelectedCategories(prev => 
      prev.includes(id) 
        ? prev.filter(c => c !== id)
        : [...prev, id]
    );
  };

  const handleSubmit = async () => {
    if (!formData.businessName || !formData.contactName || !formData.phone) {
      toast.error(isRu ? 'Заполните все обязательные поля' : 'Please fill all required fields');
      return;
    }

    setIsSubmitting(true);

    try {
      const { data: inserted, error } = await supabase
        .from('partner_applications')
        .insert({
          user_id: user?.id || null,
          business_name: formData.businessName,
          business_category: selectedCategories.join(', '),
          business_description: formData.description,
          contact_name: formData.contactName,
          contact_email: formData.email,
          contact_phone: formData.phone,
          status: 'pending',
          metadata: {
            selected_categories: selectedCategories,
            source: 'provider_onboarding',
            language: language,
          },
        })
        .select('id')
        .single();

      if (error) throw error;

      // Fire-and-forget: notify admins + acknowledge applicant
      if (inserted?.id) {
        supabase.functions.invoke('notify-admin-partner-application', {
          body: { application_id: inserted.id },
        }).catch(() => {});
      }

      setStep('success');
    } catch (error) {
      console.error('Error submitting application:', error);
      toast.error(isRu ? 'Ошибка при отправке заявки' : 'Error submitting application');
    } finally {
      setIsSubmitting(false);
    }
  };

  const canProceed = () => {
    if (step === 'category') return selectedCategories.length > 0;
    if (step === 'details') return formData.businessName.trim().length > 0;
    if (step === 'contact') return formData.contactName && formData.phone;
    return false;
  };

  const nextStep = () => {
    if (step === 'category') setStep('details');
    else if (step === 'details') setStep('contact');
    else if (step === 'contact') handleSubmit();
  };

  const prevStep = () => {
    if (step === 'details') setStep('category');
    else if (step === 'contact') setStep('details');
  };

  const stepNumber = step === 'category' ? 1 : step === 'details' ? 2 : step === 'contact' ? 3 : 4;

  return (
    <AppLayout>
      <PageContainer>
        <PageHeader
          title={isRu ? 'Предложить услугу' : 'Offer Your Service'}
          subtitle={isRu ? 'Станьте партнёром myUNO' : 'Become a myUNO partner'}
          showBack
          fallbackPath="/"
        />

        {/* Progress indicator */}
        {step !== 'success' && (
          <div className="flex items-center gap-2 mb-6">
            {[1, 2, 3].map((s) => (
              <div 
                key={s} 
                className={cn(
                  "flex-1 h-1.5 rounded-full transition-colors",
                  s <= stepNumber ? "bg-primary" : "bg-muted"
                )}
              />
            ))}
          </div>
        )}

        <AnimatePresence mode="wait">
          {/* Step 1: Category Selection */}
          {step === 'category' && (
            <motion.div
              key="category"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="text-center space-y-2">
                <div className="w-16 h-16 mx-auto rounded-none bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center mb-4">
                  <Store className="w-8 h-8 text-primary-foreground" />
                </div>
                <h2 className="text-xl font-bold">
                  {isRu ? 'Выберите категории услуг' : 'Select Service Categories'}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {isRu ? 'Можно выбрать несколько категорий' : 'You can select multiple categories'}
                </p>
              </div>

              {categoriesLoading ? (
                <div className="grid grid-cols-2 gap-3">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <Skeleton key={i} className="h-16 rounded-none" />
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  {flatCategories.map((cat) => {
                    const Icon = cat.icon || Package;
                    const isSelected = selectedCategories.includes(cat.slug);
                    return (
                      <motion.button
                        key={cat.id}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => toggleCategory(cat.slug)}
                        className={cn(
                          "flex items-center gap-3 p-4 rounded-none border-2 transition-all relative text-left",
                          isSelected 
                            ? "border-primary bg-primary/10" 
                            : "border-border hover:border-primary/50 bg-card"
                        )}
                      >
                        <div className={cn(
                          "w-10 h-10 rounded-none bg-gradient-to-br flex items-center justify-center shrink-0",
                          cat.color
                        )}>
                          <Icon className="w-5 h-5 text-white" />
                        </div>
                        <span className="text-sm font-medium line-clamp-2">
                          {getName(cat)}
                      </span>
                        {isSelected && (
                          <div className="absolute top-2 right-2">
                            <Check className="w-4 h-4 text-primary" />
                          </div>
                        )}
                      </motion.button>
                    );
                  })}
                </div>
              )}
            </motion.div>
          )}

          {/* Step 2: Business Details */}
          {step === 'details' && (
            <motion.div
              key="details"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="text-center space-y-2">
                <div className="w-16 h-16 mx-auto rounded-none bg-gradient-to-br from-accent to-accent flex items-center justify-center mb-4">
                  <Building2 className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-xl font-bold">
                  {isRu ? 'Расскажите о бизнесе' : 'Tell Us About Your Business'}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {isRu ? 'Основная информация о вашей компании' : 'Basic information about your company'}
                </p>
              </div>

              <Card>
                <CardContent className="p-4 space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="businessName">
                      {isRu ? 'Название компании *' : 'Company Name *'}
                    </Label>
                    <Input
                      id="businessName"
                      value={formData.businessName}
                      onChange={(e) => setFormData(prev => ({ ...prev, businessName: e.target.value }))}
                      placeholder={isRu ? 'Например: ООО "Премиум Сервис"' : 'e.g., Premium Service LLC'}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">
                      {isRu ? 'Описание услуг' : 'Service Description'}
                    </Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      placeholder={isRu ? 'Опишите ваши услуги...' : 'Describe your services...'}
                      rows={4}
                    />
                  </div>

                  {/* Show selected categories */}
                  <div className="pt-2">
                    <Label className="text-muted-foreground text-xs">
                      {isRu ? 'Выбранные категории:' : 'Selected categories:'}
                    </Label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {selectedCategories.map(catSlug => {
                        const cat = flatCategories.find(c => c.slug === catSlug);
                        if (!cat) return null;
                        return (
                          <span 
                            key={catSlug}
                            className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-primary/10 text-primary text-xs"
                          >
                            {getName(cat)}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Step 3: Contact Information */}
          {step === 'contact' && (
            <motion.div
              key="contact"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="text-center space-y-2">
                <div className="w-16 h-16 mx-auto rounded-none bg-gradient-to-br from-success to-success flex items-center justify-center mb-4">
                  <MessageSquare className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-xl font-bold">
                  {isRu ? 'Контактные данные' : 'Contact Information'}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {isRu ? 'Как с вами связаться?' : 'How can we reach you?'}
                </p>
              </div>

              <Card>
                <CardContent className="p-4 space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="contactName">
                      {isRu ? 'Контактное лицо *' : 'Contact Person *'}
                    </Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="contactName"
                        value={formData.contactName}
                        onChange={(e) => setFormData(prev => ({ ...prev, contactName: e.target.value }))}
                        placeholder={isRu ? 'Ваше имя' : 'Your name'}
                        className="pl-10"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">
                      {isRu ? 'Телефон *' : 'Phone *'}
                    </Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="phone"
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                        placeholder="+7 (999) 123-45-67"
                        className="pl-10"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">
                      {isRu ? 'Email' : 'Email'}
                    </Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                        placeholder="email@example.com"
                        className="pl-10"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <p className="text-xs text-center text-muted-foreground">
                {isRu 
                  ? 'Нажимая кнопку, вы соглашаетесь с условиями партнёрской программы'
                  : 'By clicking the button, you agree to the partner program terms'}
              </p>
            </motion.div>
          )}

          {/* Success Step */}
          {step === 'success' && (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center space-y-6 py-8"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                className="w-24 h-24 mx-auto rounded-full bg-gradient-to-br from-success to-success flex items-center justify-center shadow-lg shadow-success/20"
              >
                <Check className="w-12 h-12 text-white" />
              </motion.div>

              <div className="space-y-2">
                <h2 className="text-2xl font-bold">
                  {isRu ? 'Заявка отправлена!' : 'Application Submitted!'}
                </h2>
                <p className="text-muted-foreground">
                  {isRu 
                    ? 'Мы свяжемся с вами в ближайшее время для обсуждения сотрудничества.'
                    : 'We will contact you soon to discuss partnership opportunities.'}
                </p>
              </div>

              <div className="space-y-3 pt-4">
                <Card className="bg-card/50">
                  <CardContent className="p-4">
                    <p className="text-sm">
                      <span className="font-medium">{isRu ? 'Компания: ' : 'Company: '}</span>
                      {formData.businessName}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      <span className="font-medium">{isRu ? 'Категории: ' : 'Categories: '}</span>
                      {selectedCategories.map(catSlug => {
                        const cat = flatCategories.find(c => c.slug === catSlug);
                        return cat ? getName(cat) : catSlug;
                      }).join(', ')}
                    </p>
                  </CardContent>
                </Card>

                <Button
                  onClick={() => navigate('/')}
                  className="w-full"
                  size="lg"
                >
                  {isRu ? 'На главную' : 'Go to Home'}
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Navigation Buttons */}
        {step !== 'success' && (
          <div className="flex gap-3 mt-8 pb-8">
            {step !== 'category' && (
              <Button
                variant="outline"
                onClick={prevStep}
                className="flex-1"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                {isRu ? 'Назад' : 'Back'}
              </Button>
            )}
            <Button
              onClick={nextStep}
              disabled={!canProceed() || isSubmitting}
              className={cn(
                step === 'category' ? 'w-full' : 'flex-1'
              )}
            >
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : null}
              {step === 'contact' 
                ? (isRu ? 'Отправить заявку' : 'Submit Application')
                : (isRu ? 'Далее' : 'Next')}
              {!isSubmitting && <ArrowRight className="w-4 h-4 ml-2" />}
            </Button>
          </div>
        )}
      </PageContainer>
    </AppLayout>
  );
};

export default ProviderOnboarding;
