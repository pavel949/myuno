import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import { useAuth } from '@/contexts/AuthContext';
import { useUserPersonas } from '@/hooks/useUserPersonas';
import { useConsultationRequests } from '@/hooks/useConsultationRequests';
import { APP_ROUTES } from '@/lib/config/routes';
import { PageContainer } from '@/components/uno/PageContainer';
import { PageHeader } from '@/components/uno/PageHeader';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format, addDays, differenceInDays } from 'date-fns';
import { ru, enUS } from 'date-fns/locale';
import {
  Search, MapPin, TrendingUp, Calendar as CalendarIcon,
  Phone, MessageCircle, CheckCircle, ArrowRight, Palmtree,
  Users, Minus, Plus, Moon, HardHat, Building2, Megaphone,
  LineChart, Sparkles, LayoutGrid, FileSearch, Handshake,
  Landmark, RefreshCw, Crown,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

type RequestType = 'vacation_rental' | 'property_consultation' | 'property_tour' | 'investment_advice';

import { PROPERTY_TYPES as TAXONOMY_PROPERTY_TYPES, PHUKET_DISTRICTS } from '@/lib/taxonomies';

// Map taxonomy to form options
const PROPERTY_TYPES = TAXONOMY_PROPERTY_TYPES.map(t => ({
  value: t.id,
  labelEn: t.labelEn,
  labelRu: t.labelRu,
}));

const DISTRICTS = PHUKET_DISTRICTS.map(d => ({
  value: d.id,
  labelEn: d.labelEn,
  labelRu: d.labelRu,
}));

const PURPOSES = [
  { value: 'personal', labelEn: 'Personal living', labelRu: 'Личное проживание' },
  { value: 'investment', labelEn: 'Investment', labelRu: 'Инвестиции' },
  { value: 'rental_business', labelEn: 'Rental business', labelRu: 'Арендный бизнес' },
];

/** Phuket developer intents — stored in vertical_metadata + human-readable notes */
const DEVELOPER_INTENTS: {
  id: string;
  icon: typeof Building2;
  titleEn: string;
  titleRu: string;
  descEn: string;
  descRu: string;
}[] = [
  {
    id: 'newbuilds_showcase',
    icon: LayoutGrid,
    titleEn: 'Newbuilds on myUNO',
    titleRu: 'Витрина новостроек',
    descEn: 'Premium placement in the newbuilds hub, project & unit pages, media.',
    descRu: 'Размещение в разделе новостроек, страницы проекта и юнитов, медиа.',
  },
  {
    id: 'leads_and_tours',
    icon: Users,
    titleEn: 'Leads & showroom',
    titleRu: 'Лиды и туры',
    descEn: 'Qualified demand from residents, investors, relocators; tour handoffs.',
    descRu: 'Целевые лиды резидентов, инвесторов, релокантов; организация показов.',
  },
  {
    id: 'branded_campaign',
    icon: Megaphone,
    titleEn: 'Branded sales pages',
    titleRu: 'Брендовые посадочные',
    descEn: 'Dedicated funnel pages, UTM, CRM handoff (similar to flagship projects).',
    descRu: 'Отдельные посадочные, UTM, передача в CRM (как у флагманских проектов).',
  },
  {
    id: 'inventory_channel',
    icon: LineChart,
    titleEn: 'Inventory & channel mix',
    titleRu: 'Остатки и каналы',
    descEn: 'Sell-down strategy, OTA vs direct, pricing experiments with our audience.',
    descRu: 'Стратегия остатков, OTA и прямые продажи, ценообразование под нашу аудиторию.',
  },
  {
    id: 'strategic_partnership',
    icon: Sparkles,
    titleEn: 'Strategic partnership',
    titleRu: 'Стратегическое партнёрство',
    descEn: 'Bundles, data, co-marketing, or custom integration — let’s scope it.',
    descRu: 'Пакеты, данные, совместный маркетинг или интеграции — обсудим формат.',
  },
  {
    id: 'feasibility_study',
    icon: FileSearch,
    titleEn: 'Feasibility & market study',
    titleRu: 'Технико-экономическое обоснование',
    descEn: 'Demand, pricing, absorption, competition — request an advisory brief from myUNO.',
    descRu: 'Спрос, цены, скорость продаж, конкуренты — запросите разбор и рекомендации от myUNO.',
  },
  {
    id: 'sole_agency',
    icon: Handshake,
    titleEn: 'Sole agency arrangement',
    titleRu: 'Эксклюзивное агентство',
    descEn: 'Discuss exclusive or preferred representation for Phuket sales through myUNO / partners.',
    descRu: 'Обсудить эксклюзивное или приоритетное агентирование продаж на Пхукете через myUNO и партнёров.',
  },
  {
    id: 'capital_raise',
    icon: Landmark,
    titleEn: 'Capital raise & investors',
    titleRu: 'Привлечение капитала',
    descEn: 'Equity, bridge, or strategic capital — connect with our advisory network for next steps.',
    descRu: 'Equity, бридж или стратегический капитал — свяжем с консультационной сетью для следующих шагов.',
  },
  {
    id: 'restructuring',
    icon: RefreshCw,
    titleEn: 'Restructuring & workout',
    titleRu: 'Реструктуризация',
    descEn: 'Debt, JV, or project workout — confidential conversation on options and introductions.',
    descRu: 'Долг, СП или выход из сложной фазы — конфиденциально обсудим варианты и контакты.',
  },
  {
    id: 'club_sales',
    icon: Crown,
    titleEn: 'Club / private sales',
    titleRu: 'Club sales',
    descEn: 'Private rounds, member lists, or invitation-only sales — we help structure and reach buyers.',
    descRu: 'Приватные раунды, списки участников, продажи по приглашению — поможем с форматом и охватом.',
  },
];

const DEVELOPER_PROJECT_FORMATS = [
  { value: 'condo_lowrise', labelEn: 'Low-rise condo', labelRu: 'Кондо low-rise' },
  { value: 'condo_highrise', labelEn: 'High-rise condo', labelRu: 'Кондо high-rise' },
  { value: 'villa_estate', labelEn: 'Villa / estate', labelRu: 'Виллы / посёлок' },
  { value: 'mixed_use', labelEn: 'Mixed-use', labelRu: 'Мixed-use' },
  { value: 'hotel_branded', labelEn: 'Hotel-branded residences', labelRu: 'Hotel-branded резиденции' },
  { value: 'land_bank', labelEn: 'Land / future phases', labelRu: 'Земля / будущие фазы' },
];

const DEVELOPER_STAGES = [
  { value: 'planning', labelEn: 'Planning / permits', labelRu: 'Проектирование / разрешения' },
  { value: 'construction', labelEn: 'Under construction', labelRu: 'Строительство' },
  { value: 'presales', labelEn: 'Pre-sales active', labelRu: 'Предпродажи' },
  { value: 'handover', labelEn: 'Handover phase', labelRu: 'Сдача / ключи' },
  { value: 'completed_stock', labelEn: 'Completed — inventory', labelRu: 'Сдано — остатки' },
];

// Guest Counter Component
function GuestCounter({ 
  label, 
  sublabel,
  value, 
  onChange, 
  min = 0, 
  max = 10 
}: { 
  label: string; 
  sublabel?: string;
  value: number; 
  onChange: (v: number) => void;
  min?: number;
  max?: number;
}) {
  return (
    <div className="flex items-center justify-between py-3">
      <div>
        <div className="font-medium">{label}</div>
        {sublabel && <div className="text-sm text-muted-foreground">{sublabel}</div>}
      </div>
      <div className="flex items-center gap-3">
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="h-8 w-8 rounded-full"
          onClick={() => onChange(Math.max(min, value - 1))}
          disabled={value <= min}
        >
          <Minus className="h-4 w-4" />
        </Button>
        <span className="w-8 text-center font-medium">{value}</span>
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="h-8 w-8 rounded-full"
          onClick={() => onChange(Math.min(max, value + 1))}
          disabled={value >= max}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

export default function PropertyConsultation() {
  const { language } = useLanguage();
  const { currencyInfo } = useCurrency();
  const { user } = useAuth();
  const navigate = useNavigate();
  const isRu = language === 'ru';
  const { personas } = useUserPersonas();
  const isDeveloperPersona = personas.includes('real_estate_developer');

  const {
    requestPropertyConsultation,
    requestPropertyTour,
    requestInvestmentAdvice,
    requestVacationRental,
    requestDeveloperPartnership,
  } = useConsultationRequests();

  const [requestType, setRequestType] = useState<RequestType>('vacation_rental');
  const [developerIntent, setDeveloperIntent] = useState(DEVELOPER_INTENTS[0].id);
  const [developerForm, setDeveloperForm] = useState({
    companyName: '',
    roleTitle: '',
    projectName: '',
    website: '',
    stage: '',
    unitsApprox: '',
    formats: [] as string[],
  });
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
    // Vacation rental specific
    check_in: undefined as Date | undefined,
    check_out: undefined as Date | undefined,
    guests_count: 2,
    children_count: 0,
    total_budget: '',
  });

  const handleDeveloperFormatToggle = (value: string) => {
    setDeveloperForm((prev) => ({
      ...prev,
      formats: prev.formats.includes(value)
        ? prev.formats.filter((f) => f !== value)
        : [...prev.formats, value],
    }));
  };

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
      if (isDeveloperPersona) {
        const intentLabel =
          DEVELOPER_INTENTS.find((i) => i.id === developerIntent)?.[isRu ? 'titleRu' : 'titleEn'] ??
          developerIntent;
        const formatLabels = developerForm.formats
          .map(
            (f) => DEVELOPER_PROJECT_FORMATS.find((p) => p.value === f)?.[isRu ? 'labelRu' : 'labelEn'] ?? f
          )
          .join(', ');
        const districtLabels = formData.districts
          .map((d) => DISTRICTS.find((x) => x.value === d)?.[isRu ? 'labelRu' : 'labelEn'] ?? d)
          .join(', ');
        const stageLabel =
          DEVELOPER_STAGES.find((s) => s.value === developerForm.stage)?.[isRu ? 'labelRu' : 'labelEn'] ?? '';

        const structuredNotes = [
          '[Developer partnership — Phuket / myUNO]',
          `Intent: ${developerIntent} (${intentLabel})`,
          `Company: ${developerForm.companyName || '—'}`,
          `Role: ${developerForm.roleTitle || '—'}`,
          `Project: ${developerForm.projectName || '—'}`,
          `Stage: ${stageLabel || developerForm.stage || '—'}`,
          `Units (approx): ${developerForm.unitsApprox || '—'}`,
          `Formats: ${formatLabels || '—'}`,
          `Website: ${developerForm.website || '—'}`,
          `Districts focus: ${districtLabels || '—'}`,
          '---',
          formData.notes?.trim() ? `Additional:\n${formData.notes.trim()}` : '',
        ]
          .filter(Boolean)
          .join('\n');

        await requestDeveloperPartnership.mutateAsync({
          name: formData.name,
          email: formData.email || undefined,
          phone: formData.phone,
          preferred_contact_method: formData.preferred_contact_method,
          preferred_language: language,
          districts: formData.districts.length > 0 ? formData.districts : undefined,
          notes: structuredNotes,
          vertical_metadata: {
            persona: 'real_estate_developer',
            intent: developerIntent,
            companyName: developerForm.companyName,
            roleTitle: developerForm.roleTitle,
            projectName: developerForm.projectName,
            website: developerForm.website,
            stage: developerForm.stage,
            unitsApprox: developerForm.unitsApprox,
            formats: developerForm.formats,
          },
          entry_point: '/property/consultation',
          lead_source: 'developer_persona',
          currency: 'THB',
        });
        setIsSuccess(true);
        return;
      }

      const basePayload = {
        name: formData.name,
        email: formData.email || undefined,
        phone: formData.phone,
        preferred_contact_method: formData.preferred_contact_method,
        preferred_language: language,
        property_types: formData.property_types.length > 0 ? formData.property_types : undefined,
        districts: formData.districts.length > 0 ? formData.districts : undefined,
        notes: formData.notes || undefined,
      };

      if (requestType === 'vacation_rental') {
        await requestVacationRental.mutateAsync({
          ...basePayload,
          budget_min: formData.budget_min ? Number(formData.budget_min) : undefined,
          budget_max: formData.budget_max ? Number(formData.budget_max) : undefined,
          currency: currencyInfo.code,
          preferred_dates: formData.check_in && formData.check_out ? {
            check_in: format(formData.check_in, 'yyyy-MM-dd'),
            check_out: format(formData.check_out, 'yyyy-MM-dd'),
          } : undefined,
          guests_count: formData.guests_count,
          children_count: formData.children_count,
        });
      } else if (requestType === 'property_consultation') {
        await requestPropertyConsultation.mutateAsync({
          ...basePayload,
          budget_min: formData.budget_min ? Number(formData.budget_min) : undefined,
          budget_max: formData.budget_max ? Number(formData.budget_max) : undefined,
          currency: 'THB',
          bedrooms_min: formData.bedrooms_min ? Number(formData.bedrooms_min) : undefined,
          bedrooms_max: formData.bedrooms_max ? Number(formData.bedrooms_max) : undefined,
          purpose: formData.purpose || undefined,
        });
      } else if (requestType === 'property_tour') {
        await requestPropertyTour.mutateAsync(basePayload);
      } else {
        await requestInvestmentAdvice.mutateAsync({
          ...basePayload,
          budget_min: formData.budget_min ? Number(formData.budget_min) : undefined,
          budget_max: formData.budget_max ? Number(formData.budget_max) : undefined,
          currency: 'THB',
        });
      }

      setIsSuccess(true);
    } catch {
      // Mutations show toast on error
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDateDisplay = (date: Date | undefined) => {
    if (!date) return isRu ? 'Выберите дату' : 'Select date';
    return format(date, 'd MMM yyyy', { locale: isRu ? ru : enUS });
  };

  // Calculate number of nights when dates are selected
  const nightsCount = useMemo(() => {
    if (formData.check_in && formData.check_out) {
      return differenceInDays(formData.check_out, formData.check_in);
    }
    return 0;
  }, [formData.check_in, formData.check_out]);

  if (isSuccess) {
    return (
        <PageContainer>
          <PageHeader 
            title={isRu ? 'Заявка отправлена' : 'Request Sent'}
            showBack
            fallbackPath="/property"
          />
          
          <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
            <div className="w-20 h-20 rounded-full bg-success/20 flex items-center justify-center mb-6">
              <CheckCircle className="w-10 h-10 text-success" />
            </div>
            
            <h2 className="text-2xl font-bold mb-2">
              {isRu ? 'Спасибо за заявку!' : 'Thank you!'}
            </h2>
            
            <p className="text-muted-foreground mb-8 max-w-sm">
              {isDeveloperPersona
                ? (isRu
                    ? 'Менеджер по партнёрству застройщиков свяжется с вами и предложит следующий шаг: витрина, лиды или медиаплан.'
                    : 'Our developer partnerships lead will reach out with next steps: listing, lead flow, or media plan.')
                : requestType === 'vacation_rental'
                  ? (isRu
                      ? 'Мы подберём лучшие варианты и свяжемся с вами в течение 2 часов.'
                      : 'We will find the best options and contact you within 2 hours.')
                  : (isRu
                      ? 'Наш менеджер свяжется с вами в ближайшее время для обсуждения ваших пожеланий.'
                      : 'Our manager will contact you shortly to discuss your requirements.')}
            </p>

            <div className="flex flex-col gap-3 w-full max-w-xs">
              {isDeveloperPersona ? (
                <>
                  <Button onClick={() => navigate(APP_ROUTES.FOR_REAL_ESTATE_DEVELOPERS)} size="lg">
                    {isRu ? 'Страница застройщика' : 'Developer landing'}
                  </Button>
                  <Button variant="outline" onClick={() => navigate(APP_ROUTES.NEWBUILDS)} size="lg">
                    {isRu ? 'Каталог новостроек' : 'Newbuilds hub'}
                  </Button>
                  <Button variant="ghost" onClick={() => navigate('/')} size="lg">
                    {isRu ? 'На главную' : 'Go home'}
                  </Button>
                </>
              ) : (
                <>
                  <Button onClick={() => navigate('/property')} size="lg">
                    {isRu ? 'Смотреть объекты' : 'Browse Properties'}
                  </Button>
                  <Button variant="outline" onClick={() => navigate('/')} size="lg">
                    {isRu ? 'На главную' : 'Go Home'}
                  </Button>
                </>
              )}
            </div>
          </div>
        </PageContainer>
    );
  }

  return (
      <PageContainer>
        <PageHeader
          title={
            isDeveloperPersona
              ? (isRu ? 'Партнёрство застройщика' : 'Developer partnership')
              : (isRu ? 'Консультация' : 'Consultation')
          }
          subtitle={
            isDeveloperPersona
              ? (isRu
                  ? 'Маркетинг, TEO, эксклюзивное агентство, капитал, реструктуризация, club sales — опишите задачу, myUNO подключит нужные сервисы'
                  : 'Marketing, feasibility, sole agency, capital, restructuring, club sales — tell us what you need and myUNO will route the right assistance')
              : (isRu ? 'Поможем найти идеальный вариант' : 'We help you find the perfect option')
          }
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
      {step === 'type' && isDeveloperPersona && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-primary mb-1">
            <HardHat className="w-5 h-5" />
            <span className="text-sm font-semibold uppercase tracking-wide">
              {isRu ? 'Застройщикам Пхукета' : 'Phuket developers'}
            </span>
          </div>
          <h2 className="text-lg font-semibold mb-4">
            {isRu ? 'Какую задачу решаем?' : 'What should we solve first?'}
          </h2>

          <RadioGroup value={developerIntent} onValueChange={setDeveloperIntent}>
            {DEVELOPER_INTENTS.map((item) => {
              const Icon = item.icon;
              return (
                <label key={item.id} className="cursor-pointer">
                  <Card
                    className={`transition-all ${
                      developerIntent === item.id ? 'border-primary ring-2 ring-primary/20' : ''
                    }`}
                  >
                    <CardContent className="flex items-start gap-4 p-4">
                      <RadioGroupItem value={item.id} className="mt-1" />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Icon className="w-5 h-5 text-primary" />
                          <span className="font-medium">
                            {isRu ? item.titleRu : item.titleEn}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {isRu ? item.descRu : item.descEn}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </label>
              );
            })}
          </RadioGroup>

          <Button className="w-full mt-6" size="lg" onClick={() => setStep('criteria')}>
            {isRu ? 'Далее' : 'Continue'}
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      )}

      {step === 'type' && !isDeveloperPersona && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold mb-4">
            {isRu ? 'Чем мы можем помочь?' : 'How can we help?'}
          </h2>

          <RadioGroup value={requestType} onValueChange={(v) => setRequestType(v as RequestType)}>
            {/* Vacation Rental - First and highlighted */}
            <label className="cursor-pointer">
              <Card className={`transition-all ${requestType === 'vacation_rental' ? 'border-primary ring-2 ring-primary/20' : ''}`}>
                <CardContent className="flex items-start gap-4 p-4">
                  <RadioGroupItem value="vacation_rental" className="mt-1" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Palmtree className="w-5 h-5 text-primary" />
                      <span className="font-medium">
                        {isRu ? 'Аренда на отпуск' : 'Vacation Rental'}
                      </span>
                      <Badge className="text-xs bg-primary/10 text-primary hover:bg-primary/20">
                        {isRu ? 'Популярное' : 'Popular'}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {isRu 
                        ? 'Найдём идеальное жильё для вашего отдыха на Пхукете' 
                        : 'Find the perfect accommodation for your vacation in Phuket'}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </label>

            <label className="cursor-pointer">
              <Card className={`transition-all ${requestType === 'property_consultation' ? 'border-primary ring-2 ring-primary/20' : ''}`}>
                <CardContent className="flex items-start gap-4 p-4">
                  <RadioGroupItem value="property_consultation" className="mt-1" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Search className="w-5 h-5 text-primary" />
                      <span className="font-medium">
                        {isRu ? 'Покупка недвижимости' : 'Buy Property'}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {isRu 
                        ? 'Подберём лучшие варианты для покупки под ваш бюджет' 
                        : 'Find the best options to buy within your budget'}
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
      {step === 'criteria' && isDeveloperPersona && (
        <div className="space-y-6">
          <h2 className="text-lg font-semibold">
            {isRu ? 'Проект и контекст' : 'Project & context'}
          </h2>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label>{isRu ? 'Компания / бренд' : 'Company / brand'} *</Label>
              <Input
                placeholder={isRu ? 'Юридическое или маркетинговое название' : 'Legal or marketing name'}
                value={developerForm.companyName}
                onChange={(e) =>
                  setDeveloperForm((p) => ({ ...p, companyName: e.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label>{isRu ? 'Ваша роль' : 'Your role'}</Label>
              <Input
                placeholder={isRu ? 'Напр. Head of Sales' : 'e.g. Head of Sales'}
                value={developerForm.roleTitle}
                onChange={(e) =>
                  setDeveloperForm((p) => ({ ...p, roleTitle: e.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label>{isRu ? 'Название проекта' : 'Project name'}</Label>
              <Input
                placeholder={isRu ? 'Рабочее имя локации' : 'Working title'}
                value={developerForm.projectName}
                onChange={(e) =>
                  setDeveloperForm((p) => ({ ...p, projectName: e.target.value }))
                }
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label>{isRu ? 'Сайт проекта' : 'Project website'}</Label>
              <Input
                type="url"
                placeholder="https://"
                value={developerForm.website}
                onChange={(e) =>
                  setDeveloperForm((p) => ({ ...p, website: e.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label>{isRu ? 'Стадия' : 'Stage'}</Label>
              <RadioGroup
                value={developerForm.stage}
                onValueChange={(v) => setDeveloperForm((p) => ({ ...p, stage: v }))}
                className="grid gap-2"
              >
                {DEVELOPER_STAGES.map((s) => (
                  <label key={s.value} className="flex items-center gap-2 cursor-pointer">
                    <RadioGroupItem value={s.value} />
                    <span className="text-sm">{isRu ? s.labelRu : s.labelEn}</span>
                  </label>
                ))}
              </RadioGroup>
            </div>
            <div className="space-y-2">
              <Label>{isRu ? 'Юнитов (примерно)' : 'Units (approx.)'}</Label>
              <Input
                type="text"
                inputMode="numeric"
                placeholder={isRu ? 'Напр. 120' : 'e.g. 120'}
                value={developerForm.unitsApprox}
                onChange={(e) =>
                  setDeveloperForm((p) => ({ ...p, unitsApprox: e.target.value }))
                }
              />
            </div>
          </div>

          <div className="space-y-3">
            <Label>{isRu ? 'Формат проекта' : 'Project format'}</Label>
            <div className="flex flex-wrap gap-2">
              {DEVELOPER_PROJECT_FORMATS.map((fmt) => (
                <button
                  key={fmt.value}
                  type="button"
                  onClick={() => handleDeveloperFormatToggle(fmt.value)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                    developerForm.formats.includes(fmt.value)
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted hover:bg-muted/80'
                  }`}
                >
                  {isRu ? fmt.labelRu : fmt.labelEn}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <Label>{isRu ? 'Приоритетные районы' : 'Priority districts'}</Label>
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

          <div className="space-y-3">
            <Label>{isRu ? 'Кратко о задаче' : 'Brief for our team'}</Label>
            <Textarea
              placeholder={
                isRu
                  ? 'Что нужно от myUNO: сроки, объём, конфиденциальность, ожидаемый результат (TEO, эксклюзив, капитал, club sales и т.д.)…'
                  : 'What you need from myUNO: timing, scale, confidentiality, desired outcome (feasibility, sole agency, capital, club sales, etc.)…'
              }
              value={formData.notes}
              onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
              rows={4}
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

      {step === 'criteria' && !isDeveloperPersona && (
        <div className="space-y-6">
          <h2 className="text-lg font-semibold">
            {requestType === 'vacation_rental'
              ? (isRu ? 'Детали аренды' : 'Rental Details')
              : (isRu ? 'Ваши критерии' : 'Your Criteria')}
          </h2>

          {/* Vacation Rental: Dates */}
          {requestType === 'vacation_rental' && (
            <>
              <div className="space-y-3">
                <Label>{isRu ? 'Даты проживания' : 'Stay Dates'}</Label>
                <div className="grid grid-cols-2 gap-3">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "justify-start text-left font-normal",
                          !formData.check_in && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {formData.check_in 
                          ? formatDateDisplay(formData.check_in)
                          : (isRu ? 'Заезд' : 'Check-in')}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={formData.check_in}
                        onSelect={(date) => setFormData(prev => ({ 
                          ...prev, 
                          check_in: date,
                          check_out: date && prev.check_out && date >= prev.check_out 
                            ? addDays(date, 1) 
                            : prev.check_out
                        }))}
                        disabled={(date) => date < new Date()}
                        locale={isRu ? ru : enUS}
                      />
                    </PopoverContent>
                  </Popover>

                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "justify-start text-left font-normal",
                          !formData.check_out && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {formData.check_out 
                          ? formatDateDisplay(formData.check_out)
                          : (isRu ? 'Выезд' : 'Check-out')}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={formData.check_out}
                        onSelect={(date) => setFormData(prev => ({ ...prev, check_out: date }))}
                        disabled={(date) => date <= (formData.check_in || new Date())}
                        locale={isRu ? ru : enUS}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                
                {/* Nights count badge */}
                {nightsCount > 0 && (
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-primary/10 border border-primary/20">
                    <Moon className="w-4 h-4 text-primary" />
                    <span className="text-sm font-medium">
                      {nightsCount} {isRu 
                        ? (nightsCount === 1 ? 'ночь' : nightsCount < 5 ? 'ночи' : 'ночей')
                        : (nightsCount === 1 ? 'night' : 'nights')}
                    </span>
                  </div>
                )}
              </div>

              {/* Guests */}
              <Card>
                <CardContent className="p-4 divide-y">
                  <GuestCounter
                    label={isRu ? 'Взрослые' : 'Adults'}
                    sublabel={isRu ? 'От 13 лет' : 'Age 13+'}
                    value={formData.guests_count}
                    onChange={(v) => setFormData(prev => ({ ...prev, guests_count: v }))}
                    min={1}
                    max={10}
                  />
                  <GuestCounter
                    label={isRu ? 'Дети' : 'Children'}
                    sublabel={isRu ? 'До 12 лет' : 'Under 12'}
                    value={formData.children_count}
                    onChange={(v) => setFormData(prev => ({ ...prev, children_count: v }))}
                    min={0}
                    max={6}
                  />
                </CardContent>
              </Card>

              {/* Total Budget */}
              <div className="space-y-3">
                <Label>{isRu ? `Общий бюджет (${currencyInfo.symbol})` : `Total Budget (${currencyInfo.symbol})`}</Label>
                <Input
                  type="number"
                  placeholder={isRu ? 'Введите общий бюджет на проживание' : 'Enter total budget for stay'}
                  value={formData.total_budget}
                  onChange={(e) => setFormData(prev => ({ ...prev, total_budget: e.target.value }))}
                />
                <p className="text-xs text-muted-foreground">
                  {isRu ? 'Укажите сумму, которую вы готовы потратить на всё проживание' : 'Enter the amount you are willing to spend for the entire stay'}
                </p>
              </div>

              {/* Budget per night */}
              <div className="space-y-3">
                <Label>{isRu ? `Бюджет за ночь (${currencyInfo.symbol})` : `Budget per night (${currencyInfo.symbol})`}</Label>
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
            </>
          )}

          {/* Purchase: Budget & Bedrooms */}
          {(requestType === 'property_consultation' || requestType === 'investment_advice') && (
            <>
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

              {requestType === 'property_consultation' && (
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
              )}
            </>
          )}

          {/* Property Types - for all except tour */}
          {requestType !== 'property_tour' && (
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
          )}

          {/* Districts - for all */}
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

          {/* Purpose - only for purchase */}
          {requestType === 'property_consultation' && (
            <div className="space-y-3">
              <Label>{isRu ? 'Цель покупки' : 'Purchase Purpose'}</Label>
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
          )}

          {/* Notes */}
          <div className="space-y-3">
            <Label>
              {requestType === 'vacation_rental' 
                ? (isRu ? 'Особые пожелания' : 'Special Requests')
                : (isRu ? 'Дополнительные пожелания' : 'Additional Requirements')}
            </Label>
            <Textarea
              placeholder={requestType === 'vacation_rental'
                ? (isRu ? 'Бассейн, вид на море, близость к пляжу, трансфер...' : 'Pool, sea view, close to beach, transfer...')
                : (isRu ? 'Бассейн, вид на море, близость к пляжу...' : 'Pool, sea view, close to beach...')}
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
                placeholder="your@email.com"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              />
            </div>

            <div className="space-y-3">
              <Label>{isRu ? 'Предпочтительный способ связи' : 'Preferred Contact Method'}</Label>
              <RadioGroup 
                value={formData.preferred_contact_method} 
                onValueChange={(v) => setFormData(prev => ({ ...prev, preferred_contact_method: v }))}
                className="flex flex-wrap gap-4"
              >
                <label className="flex items-center gap-2 cursor-pointer">
                  <RadioGroupItem value="whatsapp" />
                  <MessageCircle className="w-4 h-4" />
                  <span className="text-sm">WhatsApp</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <RadioGroupItem value="telegram" />
                  <MessageCircle className="w-4 h-4" />
                  <span className="text-sm">Telegram</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <RadioGroupItem value="phone" />
                  <Phone className="w-4 h-4" />
                  <span className="text-sm">{isRu ? 'Звонок' : 'Phone Call'}</span>
                </label>
              </RadioGroup>
            </div>
          </div>

          {/* Summary */}
          <Card className="bg-muted/50">
            <CardContent className="p-4 text-sm space-y-2">
              <div className="font-medium mb-3">
                {isRu ? 'Ваша заявка:' : 'Your request:'}
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{isRu ? 'Тип' : 'Type'}:</span>
                <span>
                  {isDeveloperPersona
                    ? (isRu ? 'Партнёрство застройщика' : 'Developer partnership')
                    : requestType === 'vacation_rental'
                      ? (isRu ? 'Аренда на отпуск' : 'Vacation Rental')
                      : requestType === 'property_consultation'
                        ? (isRu ? 'Покупка' : 'Purchase')
                        : requestType === 'property_tour'
                          ? (isRu ? 'Тур' : 'Tour')
                          : requestType === 'investment_advice'
                            ? (isRu ? 'Инвестиции' : 'Investment')
                            : '—'}
                </span>
              </div>
              {isDeveloperPersona && (
                <>
                  <div className="flex justify-between gap-2">
                    <span className="text-muted-foreground shrink-0">{isRu ? 'Задача' : 'Focus'}:</span>
                    <span className="text-right">
                      {DEVELOPER_INTENTS.find((i) => i.id === developerIntent)?.[isRu ? 'titleRu' : 'titleEn']}
                    </span>
                  </div>
                  {developerForm.companyName && (
                    <div className="flex justify-between gap-2">
                      <span className="text-muted-foreground shrink-0">{isRu ? 'Компания' : 'Company'}:</span>
                      <span className="text-right font-medium">{developerForm.companyName}</span>
                    </div>
                  )}
                  {developerForm.projectName && (
                    <div className="flex justify-between gap-2">
                      <span className="text-muted-foreground shrink-0">{isRu ? 'Проект' : 'Project'}:</span>
                      <span className="text-right">{developerForm.projectName}</span>
                    </div>
                  )}
                </>
              )}
              {requestType === 'vacation_rental' && formData.check_in && formData.check_out && (
                <>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{isRu ? 'Даты' : 'Dates'}:</span>
                    <span>{formatDateDisplay(formData.check_in)} — {formatDateDisplay(formData.check_out)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{isRu ? 'Ночей' : 'Nights'}:</span>
                    <span className="font-medium">{nightsCount}</span>
                  </div>
                </>
              )}
              {requestType === 'vacation_rental' && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{isRu ? 'Гости' : 'Guests'}:</span>
                  <span>
                    {formData.guests_count} {isRu ? 'взр.' : 'adults'}
                    {formData.children_count > 0 && `, ${formData.children_count} ${isRu ? 'дет.' : 'child.'}`}
                  </span>
                </div>
              )}
              {requestType === 'vacation_rental' && formData.total_budget && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{isRu ? 'Общий бюджет' : 'Total Budget'}:</span>
                  <span className="font-medium">{currencyInfo.symbol}{Number(formData.total_budget).toLocaleString()}</span>
                </div>
              )}
              {formData.property_types.length > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{isRu ? 'Тип' : 'Property'}:</span>
                  <span>{formData.property_types.map(t => 
                    PROPERTY_TYPES.find(pt => pt.value === t)?.[isRu ? 'labelRu' : 'labelEn']
                  ).join(', ')}</span>
                </div>
              )}
              {formData.districts.length > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{isRu ? 'Районы' : 'Districts'}:</span>
                  <span className="text-right max-w-[60%]">{formData.districts.map(d => 
                    DISTRICTS.find(dt => dt.value === d)?.[isRu ? 'labelRu' : 'labelEn']
                  ).join(', ')}</span>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="text-xs text-muted-foreground text-center">
            {isDeveloperPersona
              ? (isRu ? 'Ответ по B2B — обычно в течение 1–2 рабочих дней' : 'B2B reply — typically within 1–2 business days')
              : requestType === 'vacation_rental'
                ? (isRu ? 'Ответим в течение 2 часов' : 'We respond within 2 hours')
                : (isRu ? 'Мы свяжемся с вами в ближайшее время' : 'We will contact you shortly')}
          </div>

          <div className="flex gap-3 pt-2">
            <Button variant="outline" onClick={() => setStep('criteria')} className="flex-1">
              {isRu ? 'Назад' : 'Back'}
            </Button>
            <Button
              onClick={handleSubmit}
              className="flex-1"
              disabled={
                !formData.name ||
                !formData.phone ||
                isSubmitting ||
                (isDeveloperPersona && !developerForm.companyName.trim())
              }
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
