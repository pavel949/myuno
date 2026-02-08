import React, { useState } from 'react';
import { resolveIcon } from '@/lib/iconMap';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { INVESTMENT_CATEGORIES } from '@/hooks/useInvestmentProjects';
import { MiniAppLayout } from '@/components/miniapp';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { 
  ArrowLeft,
  ArrowRight,
  Building2,
  Briefcase,
  Phone,
  Mail,
  User,
  FileText,
  CheckCircle,
  Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

type ProjectType = 'real_estate' | 'business';

export default function RaiseFunding() {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const { user } = useAuth();
  const isRu = language === 'ru';
  
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  
  // Form state
  const [projectType, setProjectType] = useState<ProjectType>('real_estate');
  const [category, setCategory] = useState('');
  const [projectName, setProjectName] = useState('');
  const [fundingGoal, setFundingGoal] = useState('');
  const [description, setDescription] = useState('');
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');

  const realEstateCategories = INVESTMENT_CATEGORIES.filter(c => c.key.startsWith('real_estate'));
  const businessCategories = INVESTMENT_CATEGORIES.filter(c => !c.key.startsWith('real_estate'));

  const handleSubmit = async () => {
    if (!projectName || !fundingGoal || !contactEmail) {
      toast.error(isRu ? 'Заполните все обязательные поля' : 'Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);

    try {
      // Submit as a consultation request for now
      const { error } = await supabase
        .from('consultation_requests')
        .insert({
          user_id: user?.id || null,
          request_type: 'investment_raise',
          name: contactName,
          email: contactEmail,
          phone: contactPhone || null,
          message: `
Project Type: ${projectType}
Category: ${category}
Project Name: ${projectName}
Funding Goal: $${fundingGoal}

Description:
${description}
          `.trim(),
          status: 'new',
        });

      if (error) throw error;

      setSubmitted(true);
      toast.success(isRu ? 'Заявка отправлена!' : 'Application submitted!');
    } catch (error) {
      console.error('Failed to submit:', error);
      toast.error(isRu ? 'Ошибка отправки' : 'Failed to submit');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <MiniAppLayout
        title={isRu ? 'Заявка отправлена' : 'Application Submitted'}
        showSearch={false}
      >
        <div className="flex flex-col items-center justify-center py-12 text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center">
            <CheckCircle className="h-8 w-8 text-emerald-600" />
          </div>
          <h2 className="text-xl font-bold">
            {isRu ? 'Спасибо за заявку!' : 'Thank You!'}
          </h2>
          <p className="text-muted-foreground max-w-sm">
            {isRu 
              ? 'Наш инвестиционный эксперт свяжется с вами в течение 24 часов для обсуждения деталей.'
              : 'Our investment expert will contact you within 24 hours to discuss details.'
            }
          </p>
          <Button onClick={() => navigate('/invest')} className="mt-4">
            {isRu ? 'Вернуться к каталогу' : 'Back to Catalog'}
          </Button>
        </div>
      </MiniAppLayout>
    );
  }

  return (
    <>
      <Helmet>
        <title>{isRu ? 'Привлечь инвестиции | myUNO' : 'Raise Funding | myUNO'}</title>
      </Helmet>

      <MiniAppLayout
        title={isRu ? 'Привлечь инвестиции' : 'Raise Funding'}
        showSearch={false}
      >
        <div className="space-y-6">
          {/* Progress indicator */}
          <div className="flex items-center gap-2">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex-1">
                <div className={cn(
                  'h-1 rounded-full transition-colors',
                  s <= step ? 'bg-primary' : 'bg-muted'
                )} />
              </div>
            ))}
          </div>

          {/* Step 1: Project Type */}
          {step === 1 && (
            <div className="space-y-4">
              <h2 className="text-lg font-bold">
                {isRu ? 'Тип проекта' : 'Project Type'}
              </h2>
              
              <RadioGroup
                value={projectType}
                onValueChange={(v) => setProjectType(v as ProjectType)}
                className="space-y-3"
              >
                <div className={cn(
                  'flex items-center space-x-3 p-4 rounded-xl border-2 transition-colors cursor-pointer',
                  projectType === 'real_estate' ? 'border-primary bg-primary/5' : 'border-border'
                )}>
                  <RadioGroupItem value="real_estate" id="real_estate" />
                  <Label htmlFor="real_estate" className="flex items-center gap-3 cursor-pointer flex-1">
                    <Building2 className="h-6 w-6 text-primary" />
                    <div>
                      <div className="font-semibold">
                        {isRu ? 'Недвижимость' : 'Real Estate'}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {isRu ? 'Новостройки, арендный бизнес' : 'Off-plan, rental business'}
                      </div>
                    </div>
                  </Label>
                </div>

                <div className={cn(
                  'flex items-center space-x-3 p-4 rounded-xl border-2 transition-colors cursor-pointer',
                  projectType === 'business' ? 'border-primary bg-primary/5' : 'border-border'
                )}>
                  <RadioGroupItem value="business" id="business" />
                  <Label htmlFor="business" className="flex items-center gap-3 cursor-pointer flex-1">
                    <Briefcase className="h-6 w-6 text-amber-600" />
                    <div>
                      <div className="font-semibold">
                        {isRu ? 'Бизнес' : 'Business'}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {isRu ? 'Отели, рестораны, стартапы' : 'Hotels, restaurants, startups'}
                      </div>
                    </div>
                  </Label>
                </div>
              </RadioGroup>

              {/* Category selection */}
              <div className="space-y-2 pt-4">
                <Label>{isRu ? 'Категория' : 'Category'}</Label>
                <div className="flex flex-wrap gap-2">
                  {(projectType === 'real_estate' ? realEstateCategories : businessCategories).map((cat) => (
                    <Button
                      key={cat.key}
                      variant={category === cat.key ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setCategory(cat.key)}
                      className="rounded-full gap-1.5"
                    >
                      {(() => { const Icon = resolveIcon(cat.icon); return <Icon className="w-4 h-4" />; })()}
                      <span>{isRu ? cat.ru : cat.en}</span>
                    </Button>
                  ))}
                </div>
              </div>

              <Button 
                className="w-full mt-6"
                onClick={() => setStep(2)}
                disabled={!category}
              >
                {isRu ? 'Далее' : 'Continue'}
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          )}

          {/* Step 2: Project Details */}
          {step === 2 && (
            <div className="space-y-4">
              <h2 className="text-lg font-bold">
                {isRu ? 'Детали проекта' : 'Project Details'}
              </h2>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="projectName">
                    {isRu ? 'Название проекта *' : 'Project Name *'}
                  </Label>
                  <Input
                    id="projectName"
                    placeholder={isRu ? 'Например: Kamala Residences' : 'e.g., Kamala Residences'}
                    value={projectName}
                    onChange={(e) => setProjectName(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="fundingGoal">
                    {isRu ? 'Цель финансирования (USD) *' : 'Funding Goal (USD) *'}
                  </Label>
                  <Input
                    id="fundingGoal"
                    type="number"
                    placeholder="500000"
                    value={fundingGoal}
                    onChange={(e) => setFundingGoal(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">
                    {isRu ? 'Описание проекта' : 'Project Description'}
                  </Label>
                  <Textarea
                    id="description"
                    placeholder={isRu 
                      ? 'Расскажите о проекте, его преимуществах и планируемой доходности...'
                      : 'Tell us about the project, its advantages and expected returns...'
                    }
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={4}
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <Button variant="outline" onClick={() => setStep(1)}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  {isRu ? 'Назад' : 'Back'}
                </Button>
                <Button 
                  className="flex-1"
                  onClick={() => setStep(3)}
                  disabled={!projectName || !fundingGoal}
                >
                  {isRu ? 'Далее' : 'Continue'}
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </div>
          )}

          {/* Step 3: Contact Info */}
          {step === 3 && (
            <div className="space-y-4">
              <h2 className="text-lg font-bold">
                {isRu ? 'Контактная информация' : 'Contact Information'}
              </h2>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="contactName">
                    <User className="h-4 w-4 inline mr-1" />
                    {isRu ? 'Ваше имя' : 'Your Name'}
                  </Label>
                  <Input
                    id="contactName"
                    placeholder={isRu ? 'Иван Иванов' : 'John Smith'}
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contactEmail">
                    <Mail className="h-4 w-4 inline mr-1" />
                    {isRu ? 'Email *' : 'Email *'}
                  </Label>
                  <Input
                    id="contactEmail"
                    type="email"
                    placeholder="you@example.com"
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contactPhone">
                    <Phone className="h-4 w-4 inline mr-1" />
                    {isRu ? 'Телефон' : 'Phone'}
                  </Label>
                  <Input
                    id="contactPhone"
                    placeholder="+66 XX XXX XXXX"
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <Button variant="outline" onClick={() => setStep(2)}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  {isRu ? 'Назад' : 'Back'}
                </Button>
                <Button 
                  className="flex-1"
                  onClick={handleSubmit}
                  disabled={!contactEmail || isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      {isRu ? 'Отправка...' : 'Submitting...'}
                    </>
                  ) : (
                    <>
                      <FileText className="h-4 w-4 mr-2" />
                      {isRu ? 'Отправить заявку' : 'Submit Application'}
                    </>
                  )}
                </Button>
              </div>

              <p className="text-xs text-center text-muted-foreground">
                {isRu 
                  ? 'Наш инвестиционный эксперт свяжется с вами в течение 24 часов'
                  : 'Our investment expert will contact you within 24 hours'
                }
              </p>
            </div>
          )}
        </div>
      </MiniAppLayout>
    </>
  );
}
