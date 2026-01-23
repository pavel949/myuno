import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useVendorProfile } from '@/hooks/useVendor';
import { useUserContext } from '@/hooks/useUserContext';
import { OnboardingLayout } from '@/components/layout/OnboardingLayout';
import { PageContainer } from '@/components/uno/PageContainer';
import { PageHeader } from '@/components/uno/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { 
  Store, 
  ArrowRight, 
  Building2,
  Phone,
  Mail,
  Globe,
  MapPin,
  Loader2,
  Utensils,
  Car,
  Sparkles,
  Stethoscope,
  GraduationCap,
  Brush,
  Baby,
  Flower2,
  Ship,
  Home,
  Calendar,
  Dumbbell,
  Scale,
  PawPrint
} from 'lucide-react';
import { cn } from '@/lib/utils';

// All available verticals for vendor selection
const availableVerticals = [
  { value: 'beauty', labelEn: 'Beauty & Spa', labelRu: 'Красота и спа', icon: Sparkles, color: 'text-pink-500' },
  { value: 'fitness', labelEn: 'Fitness & Sports', labelRu: 'Фитнес и спорт', icon: Dumbbell, color: 'text-orange-500' },
  { value: 'restaurants', labelEn: 'Restaurants', labelRu: 'Рестораны', icon: Utensils, color: 'text-amber-500' },
  { value: 'tours', labelEn: 'Tours & Excursions', labelRu: 'Туры и экскурсии', icon: Calendar, color: 'text-blue-500' },
  { value: 'yachts', labelEn: 'Yachts & Water', labelRu: 'Яхты и водные', icon: Ship, color: 'text-cyan-500' },
  { value: 'transport', labelEn: 'Transport', labelRu: 'Транспорт', icon: Car, color: 'text-indigo-500' },
  { value: 'health', labelEn: 'Medical & Health', labelRu: 'Медицина и здоровье', icon: Stethoscope, color: 'text-green-500' },
  { value: 'education', labelEn: 'Education', labelRu: 'Образование', icon: GraduationCap, color: 'text-purple-500' },
  { value: 'properties', labelEn: 'Properties', labelRu: 'Недвижимость', icon: Home, color: 'text-emerald-500' },
  { value: 'cleaning', labelEn: 'Cleaning', labelRu: 'Клининг', icon: Brush, color: 'text-teal-500' },
  { value: 'childcare', labelEn: 'Childcare', labelRu: 'Няни и уход', icon: Baby, color: 'text-rose-500' },
  { value: 'flowers', labelEn: 'Flowers & Gifts', labelRu: 'Цветы и подарки', icon: Flower2, color: 'text-fuchsia-500' },
  { value: 'events', labelEn: 'Events', labelRu: 'Мероприятия', icon: Calendar, color: 'text-violet-500' },
  { value: 'legal', labelEn: 'Legal Services', labelRu: 'Юридические услуги', icon: Scale, color: 'text-slate-500' },
  { value: 'pets', labelEn: 'Pet Services', labelRu: 'Услуги для питомцев', icon: PawPrint, color: 'text-yellow-600' },
];

const VendorOnboarding = () => {
  const navigate = useNavigate();
  const { user, isLoading: authLoading } = useAuth();
  const { language } = useLanguage();
  const { profile, createProfile, isLoading: profileLoading } = useVendorProfile();
  const { vendorOrgs, isLoading: contextLoading } = useUserContext();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isRussian = language === 'ru';

  const [formData, setFormData] = useState({
    business_name: '',
    business_name_ru: '',
    description: '',
    description_ru: '',
    selected_verticals: [] as string[],
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

  // Redirect if already has vendor org (use same check as VendorDashboard)
  React.useEffect(() => {
    if (!contextLoading && vendorOrgs.length > 0) {
      navigate('/vendor');
    }
  }, [vendorOrgs, contextLoading, navigate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleVerticalToggle = (vertical: string) => {
    setFormData(prev => ({
      ...prev,
      selected_verticals: prev.selected_verticals.includes(vertical)
        ? prev.selected_verticals.filter(v => v !== vertical)
        : [...prev.selected_verticals, vertical],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.business_name || formData.selected_verticals.length === 0) {
      toast.error(isRussian ? 'Заполните название и выберите хотя бы одну категорию' : 'Please fill business name and select at least one category');
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await createProfile({
        business_name: formData.business_name,
        business_name_ru: formData.business_name_ru || undefined,
        description: formData.description || undefined,
        description_ru: formData.description_ru || undefined,
        business_category: formData.selected_verticals[0], // Primary category for legacy
        verticals: formData.selected_verticals, // All selected verticals
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

  if (authLoading || contextLoading) {
    return (
      <OnboardingLayout
        currentStep={1}
        totalSteps={1}
        title="Loading"
        titleRu="Загрузка"
        showBack={false}
        showClose={false}
      >
        <PageContainer>
          <div className="flex items-center justify-center min-h-[60vh]">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </PageContainer>
      </OnboardingLayout>
    );
  }

  return (
    <OnboardingLayout
      currentStep={1}
      totalSteps={1}
      title="Become a Partner"
      titleRu="Стать партнёром"
      role="vendor"
      exitPath="/"
    >
      <PageContainer>

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

              <div className="space-y-3">
                <Label>
                  {isRussian ? 'Выберите категории услуг *' : 'Select service categories *'}
                </Label>
                <p className="text-xs text-muted-foreground">
                  {isRussian 
                    ? 'Отметьте все категории, в которых вы предоставляете услуги' 
                    : 'Check all categories in which you provide services'}
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {availableVerticals.map((vertical) => {
                    const Icon = vertical.icon;
                    const isSelected = formData.selected_verticals.includes(vertical.value);
                    return (
                      <div
                        key={vertical.value}
                        className={cn(
                          "flex items-center gap-2 p-2.5 rounded-lg border cursor-pointer transition-all",
                          isSelected 
                            ? "border-primary bg-primary/5" 
                            : "border-border hover:border-primary/50"
                        )}
                        onClick={() => handleVerticalToggle(vertical.value)}
                      >
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => {}}
                          onClick={(e) => e.stopPropagation()}
                        />
                        <Icon className={cn("h-4 w-4", vertical.color)} />
                        <span className="text-xs font-medium flex-1">
                          {isRussian ? vertical.labelRu : vertical.labelEn}
                        </span>
                      </div>
                    );
                  })}
                </div>
                {formData.selected_verticals.length > 0 && (
                  <p className="text-xs text-primary">
                    {isRussian 
                      ? `Выбрано: ${formData.selected_verticals.length}` 
                      : `Selected: ${formData.selected_verticals.length}`}
                  </p>
                )}
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
