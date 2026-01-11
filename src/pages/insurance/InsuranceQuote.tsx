import { useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BackButton } from '@/components/uno/BackButton';
import { LoadingSpinner } from '@/components/uno/LoadingSpinner';
import { useInsuranceProvider, useInsurancePlans } from '@/hooks/useInsurance';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Shield, Calendar, User, Phone, Mail, FileText, CheckCircle2 } from 'lucide-react';

export default function InsuranceQuote() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const planId = searchParams.get('plan');
  const { language } = useLanguage();
  const navigate = useNavigate();
  const { user } = useAuth();

  const { provider, isLoading: providerLoading } = useInsuranceProvider(id || '');
  const { plans } = useInsurancePlans(id);

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    dateOfBirth: '',
    nationality: '',
    selectedPlan: planId || '',
    coverageType: 'individual',
    notes: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const selectedPlan = plans.find((p) => p.id === formData.selectedPlan);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.fullName || !formData.email || !formData.phone) {
      toast.error(language === 'ru' ? 'Заполните обязательные поля' : 'Please fill required fields');
      return;
    }
    setIsSubmitting(true);

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500));

    setIsSubmitting(false);
    setIsSubmitted(true);
    toast.success(language === 'ru' ? 'Заявка отправлена!' : 'Quote request submitted!');
  };

  if (providerLoading) {
    return (
      <AppLayout showBottomNav={false}>
        <div className="flex items-center justify-center h-96">
          <LoadingSpinner />
        </div>
      </AppLayout>
    );
  }

  if (isSubmitted) {
    return (
      <AppLayout showBottomNav={false}>
        <div className="p-4 flex flex-col items-center justify-center min-h-[70vh] text-center">
          <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mb-4">
            <CheckCircle2 className="w-8 h-8 text-green-500" />
          </div>
          <h1 className="text-xl font-bold mb-2">
            {language === 'ru' ? 'Заявка отправлена!' : 'Quote Request Submitted!'}
          </h1>
          <p className="text-muted-foreground mb-6 max-w-sm">
            {language === 'ru'
              ? 'Наш менеджер свяжется с вами в течение 24 часов для уточнения деталей и расчёта стоимости.'
              : 'Our manager will contact you within 24 hours to discuss details and provide a quote.'}
          </p>
          <div className="space-y-2 w-full max-w-xs">
            <Button className="w-full" onClick={() => navigate('/insurance')}>
              {language === 'ru' ? 'Вернуться к страхованию' : 'Back to Insurance'}
            </Button>
            <Button variant="outline" className="w-full" onClick={() => navigate('/bookings')}>
              {language === 'ru' ? 'Мои бронирования' : 'My Bookings'}
            </Button>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout showBottomNav={false}>
      <div className="pb-24">
        {/* Header */}
        <div className="bg-gradient-to-br from-emerald-600/20 via-teal-600/20 to-cyan-700/20 p-4 pb-6">
          <BackButton fallbackPath={`/insurance/${id}`} className="mb-4" />
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
              <Shield className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold">{language === 'ru' ? 'Запрос расчёта' : 'Get Quote'}</h1>
              <p className="text-sm text-muted-foreground">
                {provider && (language === 'ru' ? provider.name_ru : provider.name_en)}
              </p>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* Plan Selection */}
          {plans.length > 0 && (
            <div className="space-y-2">
              <Label>{language === 'ru' ? 'Выберите план' : 'Select Plan'}</Label>
              <Select
                value={formData.selectedPlan}
                onValueChange={(val) => setFormData({ ...formData, selectedPlan: val })}
              >
                <SelectTrigger>
                  <SelectValue placeholder={language === 'ru' ? 'Выберите план...' : 'Select a plan...'} />
                </SelectTrigger>
                <SelectContent>
                  {plans.map((plan) => (
                    <SelectItem key={plan.id} value={plan.id}>
                      {language === 'ru' ? plan.name_ru : plan.name_en} - ฿
                      {plan.price_yearly?.toLocaleString() || plan.price_monthly?.toLocaleString()}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Coverage Type */}
          <div className="space-y-2">
            <Label>{language === 'ru' ? 'Тип покрытия' : 'Coverage Type'}</Label>
            <Select
              value={formData.coverageType}
              onValueChange={(val) => setFormData({ ...formData, coverageType: val })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="individual">{language === 'ru' ? 'Индивидуальный' : 'Individual'}</SelectItem>
                <SelectItem value="couple">{language === 'ru' ? 'Пара' : 'Couple'}</SelectItem>
                <SelectItem value="family">{language === 'ru' ? 'Семья' : 'Family'}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Personal Info */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <User className="w-4 h-4" />
              {language === 'ru' ? 'Полное имя' : 'Full Name'} *
            </Label>
            <Input
              value={formData.fullName}
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              placeholder={language === 'ru' ? 'Ваше полное имя' : 'Your full name'}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                {language === 'ru' ? 'Дата рождения' : 'Date of Birth'}
              </Label>
              <Input
                type="date"
                value={formData.dateOfBirth}
                onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>{language === 'ru' ? 'Гражданство' : 'Nationality'}</Label>
              <Input
                value={formData.nationality}
                onChange={(e) => setFormData({ ...formData, nationality: e.target.value })}
                placeholder="e.g. Russian"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Mail className="w-4 h-4" />
              Email *
            </Label>
            <Input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="your@email.com"
              required
            />
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Phone className="w-4 h-4" />
              {language === 'ru' ? 'Телефон' : 'Phone'} *
            </Label>
            <Input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="+66 XX XXX XXXX"
              required
            />
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              {language === 'ru' ? 'Дополнительные пожелания' : 'Additional Notes'}
            </Label>
            <Textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder={
                language === 'ru'
                  ? 'Опишите ваши потребности, предыдущие заболевания, особые требования...'
                  : 'Describe your needs, pre-existing conditions, special requirements...'
              }
              rows={3}
            />
          </div>

          {/* Selected Plan Summary */}
          {selectedPlan && (
            <div className="bg-card border border-border rounded-xl p-4">
              <h3 className="font-semibold mb-2">{language === 'ru' ? 'Выбранный план' : 'Selected Plan'}</h3>
              <div className="flex items-center justify-between">
                <span>{language === 'ru' ? selectedPlan.name_ru : selectedPlan.name_en}</span>
                <span className="font-bold text-primary">
                  ฿{selectedPlan.price_yearly?.toLocaleString() || selectedPlan.price_monthly?.toLocaleString()}
                </span>
              </div>
            </div>
          )}
        </form>

        {/* Fixed Bottom */}
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/95 backdrop-blur border-t border-border">
          <Button className="w-full" size="lg" onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? (
              <LoadingSpinner size="sm" />
            ) : language === 'ru' ? (
              'Отправить запрос'
            ) : (
              'Submit Quote Request'
            )}
          </Button>
        </div>
      </div>
    </AppLayout>
  );
}
