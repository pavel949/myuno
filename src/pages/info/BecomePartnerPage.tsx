import React, { useState } from 'react';
import { logger } from '@/lib/logger';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Store, 
  Briefcase, 
  Truck, 
  Utensils, 
  Scissors, 
  Home,
  HeartPulse,
  GraduationCap,
  CheckCircle2,
  ArrowRight,
  Shield,
  TrendingUp,
  Users,
  Clock,
  Send
} from 'lucide-react';
import { PageContainer } from '@/components/uno/PageContainer';
import { PageHeader } from '@/components/uno/PageHeader';
import { SectionCard, SectionTitle } from '@/components/uno/SectionCard';
import { PremiumButton } from '@/components/uno/PremiumButton';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

const businessCategories = [
  { id: 'services', icon: Briefcase, labelRu: 'Услуги', labelEn: 'Services' },
  { id: 'food', icon: Utensils, labelRu: 'Еда и напитки', labelEn: 'Food & Drinks' },
  { id: 'beauty', icon: Scissors, labelRu: 'Красота и спа', labelEn: 'Beauty & Spa' },
  { id: 'property', icon: Home, labelRu: 'Недвижимость', labelEn: 'Property' },
  { id: 'transport', icon: Truck, labelRu: 'Транспорт', labelEn: 'Transport' },
  { id: 'medical', icon: HeartPulse, labelRu: 'Медицина', labelEn: 'Medical' },
  { id: 'education', icon: GraduationCap, labelRu: 'Образование', labelEn: 'Education' },
  { id: 'retail', icon: Store, labelRu: 'Розничная торговля', labelEn: 'Retail' },
];

const benefits = [
  { icon: Users, labelRu: 'Доступ к миллионам клиентов', labelEn: 'Access to millions of customers' },
  { icon: Shield, labelRu: 'Защита платежей', labelEn: 'Payment protection' },
  { icon: TrendingUp, labelRu: 'Аналитика и статистика', labelEn: 'Analytics & insights' },
  { icon: Clock, labelRu: 'Удобное управление заказами', labelEn: 'Easy order management' },
];

export default function BecomePartnerPage() {
  const { language } = useLanguage();
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    businessName: '',
    contactName: '',
    email: '',
    phone: '',
    website: '',
    description: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedCategory) {
      toast({
        title: language === 'ru' ? 'Выберите категорию' : 'Select a category',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const { data: inserted, error } = await supabase
        .from('partner_applications')
        .insert({
          user_id: user?.id || null,
          business_name: formData.businessName,
          business_category: selectedCategory,
          business_description: formData.description,
          contact_name: formData.contactName,
          contact_email: formData.email,
          contact_phone: formData.phone,
          website: formData.website || null,
          status: 'pending',
        })
        .select('id')
        .single();

      if (error) throw error;

      if (inserted?.id) {
        supabase.functions.invoke('notify-admin-partner-application', {
          body: { application_id: inserted.id },
        }).catch(() => {});
      }

      setIsSubmitted(true);
      toast({
        title: language === 'ru' ? 'Заявка отправлена!' : 'Application submitted!',
        description: language === 'ru'
          ? 'Мы свяжемся с вами в ближайшее время'
          : 'We will contact you soon',
      });
    } catch (error) {
      logger.error('Error submitting application:', error);
      toast({
        title: language === 'ru' ? 'Ошибка' : 'Error',
        description: language === 'ru' 
          ? 'Не удалось отправить заявку. Попробуйте позже.' 
          : 'Failed to submit application. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <PageContainer>
        <div className="min-h-[60vh] flex items-center justify-center">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center max-w-md"
          >
            <div className="w-20 h-20 rounded-full bg-success/20 flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="w-10 h-10 text-success" />
            </div>
            <h1 className="text-2xl font-bold mb-4">
              {language === 'ru' ? 'Заявка принята!' : 'Application Received!'}
            </h1>
            <p className="text-muted-foreground mb-6">
              {language === 'ru' 
                ? 'Наша команда рассмотрит вашу заявку и свяжется с вами в течение 2-3 рабочих дней для верификации.' 
                : 'Our team will review your application and contact you within 2-3 business days for verification.'}
            </p>
            <PremiumButton onClick={() => navigate('/')}>
              {language === 'ru' ? 'На главную' : 'Go to Home'}
            </PremiumButton>
          </motion.div>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader 
        title={language === 'ru' ? 'Станьте партнёром UNO' : 'Become a UNO Partner'}
        showBack
      />

      {/* Hero Section */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative rounded-2xl overflow-hidden mb-8 p-6 sm:p-8"
      >
        <div className="absolute inset-0 gradient-gold opacity-10" />
        <div className="relative">
          <h1 className="text-2xl sm:text-3xl font-bold mb-4">
            {language === 'ru' 
              ? 'Развивайте бизнес вместе с UNO' 
              : 'Grow Your Business with UNO'}
          </h1>
          <p className="text-muted-foreground max-w-2xl mb-6">
            {language === 'ru' 
              ? 'Присоединяйтесь к экосистеме UNO и получите доступ к миллионам активных пользователей. Мы поможем вам увеличить продажи и расширить клиентскую базу.' 
              : 'Join the UNO ecosystem and get access to millions of active users. We will help you increase sales and expand your customer base.'}
          </p>

          {/* Benefits */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {benefits.map((benefit, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-center gap-2 text-sm"
              >
                <benefit.icon className="w-5 h-5 text-primary" />
                <span>{language === 'ru' ? benefit.labelRu : benefit.labelEn}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Application Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Category Selection */}
        <SectionCard>
          <SectionTitle>
            {language === 'ru' ? 'Выберите категорию бизнеса' : 'Select Business Category'}
          </SectionTitle>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {businessCategories.map((category) => (
              <button
                key={category.id}
                type="button"
                onClick={() => setSelectedCategory(category.id)}
                className={cn(
                  "flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all",
                  selectedCategory === category.id
                    ? "border-primary bg-primary/10"
                    : "border-border hover:border-primary/50"
                )}
              >
                <category.icon className={cn(
                  "w-6 h-6",
                  selectedCategory === category.id ? "text-primary" : "text-muted-foreground"
                )} />
                <span className="text-sm font-medium text-center">
                  {language === 'ru' ? category.labelRu : category.labelEn}
                </span>
              </button>
            ))}
          </div>
        </SectionCard>

        {/* Business Info */}
        <SectionCard>
          <SectionTitle>
            {language === 'ru' ? 'Информация о бизнесе' : 'Business Information'}
          </SectionTitle>
          <div className="grid gap-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">
                  {language === 'ru' ? 'Название компании *' : 'Business Name *'}
                </label>
                <Input
                  required
                  value={formData.businessName}
                  onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                  placeholder={language === 'ru' ? 'ООО "Ваша компания"' : 'Your Company LLC'}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">
                  {language === 'ru' ? 'Контактное лицо *' : 'Contact Person *'}
                </label>
                <Input
                  required
                  value={formData.contactName}
                  onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
                  placeholder={language === 'ru' ? 'Иван Иванов' : 'John Doe'}
                />
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">
                  {language === 'ru' ? 'Email *' : 'Email *'}
                </label>
                <Input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="email@company.com"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">
                  {language === 'ru' ? 'Телефон *' : 'Phone *'}
                </label>
                <Input
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+7 (999) 123-45-67"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">
                {language === 'ru' ? 'Веб-сайт (необязательно)' : 'Website (optional)'}
              </label>
              <Input
                type="url"
                value={formData.website}
                onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                placeholder="https://your-website.com"
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">
                {language === 'ru' ? 'Расскажите о вашем бизнесе *' : 'Tell us about your business *'}
              </label>
              <Textarea
                required
                rows={4}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder={language === 'ru' 
                  ? 'Опишите ваши услуги или товары, опыт работы, преимущества...' 
                  : 'Describe your services or products, experience, advantages...'}
              />
            </div>
          </div>
        </SectionCard>

        {/* Verification Info */}
        <div className="bg-secondary/50 rounded-xl p-4 border border-border/50">
          <div className="flex items-start gap-3">
            <Shield className="w-5 h-5 text-primary mt-0.5" />
            <div>
              <h4 className="font-medium mb-1">
                {language === 'ru' ? 'Процесс верификации' : 'Verification Process'}
              </h4>
              <p className="text-sm text-muted-foreground">
                {language === 'ru' 
                  ? 'После подачи заявки наша команда свяжется с вами для проверки документов и подписания договора. Обычно это занимает 2-3 рабочих дня.' 
                  : 'After submitting your application, our team will contact you to verify documents and sign an agreement. This usually takes 2-3 business days.'}
              </p>
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <PremiumButton
          type="submit"
          className="w-full"
          size="lg"
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <span className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
              {language === 'ru' ? 'Отправка...' : 'Submitting...'}
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <Send className="w-4 h-4" />
              {language === 'ru' ? 'Отправить заявку' : 'Submit Application'}
            </span>
          )}
        </PremiumButton>
      </form>
    </PageContainer>
  );
}
