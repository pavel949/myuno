import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useVendorProfile } from '@/hooks/useVendor';
import { OnboardingLayout } from '@/components/layout/OnboardingLayout';
import { PageContainer } from '@/components/uno/PageContainer';
import { PageHeader } from '@/components/uno/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { 
  Store, 
  ArrowRight, 
  Building2,
  Phone,
  Mail,
  Globe,
  MapPin,
  Loader2
} from 'lucide-react';

const businessCategories = [
  { value: 'beauty', labelEn: 'Beauty & Spa', labelRu: 'Красота и спа' },
  { value: 'fitness', labelEn: 'Fitness & Sports', labelRu: 'Фитнес и спорт' },
  { value: 'food', labelEn: 'Food & Restaurant', labelRu: 'Еда и рестораны' },
  { value: 'tours', labelEn: 'Tours & Excursions', labelRu: 'Туры и экскурсии' },
  { value: 'water', labelEn: 'Water Activities', labelRu: 'Водные активности' },
  { value: 'medical', labelEn: 'Medical & Health', labelRu: 'Медицина и здоровье' },
  { value: 'education', labelEn: 'Education', labelRu: 'Образование' },
  { value: 'transport', labelEn: 'Transport', labelRu: 'Транспорт' },
  { value: 'property', labelEn: 'Property', labelRu: 'Недвижимость' },
  { value: 'services', labelEn: 'Home Services', labelRu: 'Бытовые услуги' },
  { value: 'flowers', labelEn: 'Flowers & Gifts', labelRu: 'Цветы и подарки' },
  { value: 'events', labelEn: 'Events', labelRu: 'Мероприятия' },
  { value: 'other', labelEn: 'Other', labelRu: 'Другое' },
];

const VendorOnboarding = () => {
  const navigate = useNavigate();
  const { user, isLoading: authLoading } = useAuth();
  const { language } = useLanguage();
  const { profile, createProfile, isLoading: profileLoading } = useVendorProfile();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isRussian = language === 'ru';

  const [formData, setFormData] = useState({
    business_name: '',
    business_name_ru: '',
    description: '',
    description_ru: '',
    business_category: '',
    phone: '',
    email: user?.email || '',
    website: '',
    address: '',
  });

  // Redirect if not authenticated
  React.useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  // Redirect if already has profile
  React.useEffect(() => {
    if (!profileLoading && profile) {
      navigate('/vendor');
    }
  }, [profile, profileLoading, navigate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.business_name || !formData.business_category) {
      toast.error(isRussian ? 'Заполните обязательные поля' : 'Please fill required fields');
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await createProfile({
        business_name: formData.business_name,
        business_name_ru: formData.business_name_ru || undefined,
        description: formData.description || undefined,
        description_ru: formData.description_ru || undefined,
        business_category: formData.business_category,
        phone: formData.phone || undefined,
        email: formData.email || undefined,
        website: formData.website || undefined,
        address: formData.address || undefined,
        commission_rate: 10,
        is_verified: false,
        is_active: true,
      });

      if (error) throw error;

      toast.success(isRussian ? 'Профиль создан! Ожидайте верификации.' : 'Profile created! Awaiting verification.');
      navigate('/vendor');
    } catch (error) {
      console.error('Error creating profile:', error);
      toast.error(isRussian ? 'Ошибка при создании профиля' : 'Error creating profile');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (authLoading || profileLoading) {
    return (
      <OnboardingLayout>
        <PageContainer>
          <div className="flex items-center justify-center min-h-[60vh]">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </PageContainer>
      </OnboardingLayout>
    );
  }

  return (
    <OnboardingLayout>
      <PageContainer>
        <PageHeader 
          title={isRussian ? 'Стать партнёром' : 'Become a Partner'}
          showBack
        />

        {/* Hero */}
        <Card className="mb-6 bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
          <CardContent className="p-6 text-center">
            <div className="inline-flex p-4 rounded-full bg-primary/10 mb-4">
              <Store className="h-8 w-8 text-primary" />
            </div>
            <h2 className="text-xl font-bold mb-2">
              {isRussian ? 'Начните продавать на UNO' : 'Start selling on UNO'}
            </h2>
            <p className="text-sm text-muted-foreground">
              {isRussian 
                ? 'Заполните форму и получите доступ к тысячам клиентов' 
                : 'Fill out the form and get access to thousands of customers'}
            </p>
          </CardContent>
        </Card>

        <form onSubmit={handleSubmit}>
          <Card className="mb-4">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                {isRussian ? 'Информация о бизнесе' : 'Business Information'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="business_name">
                  {isRussian ? 'Название бизнеса *' : 'Business Name *'}
                </Label>
                <Input
                  id="business_name"
                  name="business_name"
                  value={formData.business_name}
                  onChange={handleChange}
                  placeholder={isRussian ? 'Например: Салон красоты Элегант' : 'e.g., Elegant Beauty Salon'}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="business_name_ru">
                  {isRussian ? 'Название (на русском)' : 'Name (in Russian)'}
                </Label>
                <Input
                  id="business_name_ru"
                  name="business_name_ru"
                  value={formData.business_name_ru}
                  onChange={handleChange}
                  placeholder={isRussian ? 'Название на русском' : 'Russian name'}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="business_category">
                  {isRussian ? 'Категория *' : 'Category *'}
                </Label>
                <Select
                  value={formData.business_category}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, business_category: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={isRussian ? 'Выберите категорию' : 'Select category'} />
                  </SelectTrigger>
                  <SelectContent>
                    {businessCategories.map(cat => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {isRussian ? cat.labelRu : cat.labelEn}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">
                  {isRussian ? 'Описание' : 'Description'}
                </Label>
                <Textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder={isRussian ? 'Расскажите о вашем бизнесе...' : 'Tell us about your business...'}
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          <Card className="mb-4">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Phone className="h-4 w-4" />
                {isRussian ? 'Контактная информация' : 'Contact Information'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="phone">
                  {isRussian ? 'Телефон' : 'Phone'}
                </Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="+7 (999) 123-45-67"
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">
                  {isRussian ? 'Email' : 'Email'}
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="business@example.com"
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="website">
                  {isRussian ? 'Веб-сайт' : 'Website'}
                </Label>
                <div className="relative">
                  <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="website"
                    name="website"
                    type="url"
                    value={formData.website}
                    onChange={handleChange}
                    placeholder="https://example.com"
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">
                  {isRussian ? 'Адрес' : 'Address'}
                </Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="address"
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    placeholder={isRussian ? 'ул. Примерная, 123' : '123 Example Street'}
                    className="pl-10"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Button 
            type="submit" 
            className="w-full" 
            size="lg"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : null}
            {isRussian ? 'Создать аккаунт партнёра' : 'Create Partner Account'}
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>

          <p className="text-xs text-center text-muted-foreground mt-4">
            {isRussian 
              ? 'Нажимая кнопку, вы соглашаетесь с условиями партнёрской программы'
              : 'By clicking the button, you agree to the partner program terms'}
          </p>
        </form>
      </PageContainer>
    </OnboardingLayout>
  );
};

export default VendorOnboarding;
