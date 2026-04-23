import { useParams, useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useInsurancePlans } from '@/hooks/useInsurance';
import { AppLayout } from '@/components/layout/AppLayout';
import { BackButton } from '@/components/uno/BackButton';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Shield, 
  CheckCircle2, 
  XCircle, 
  Calendar, 
  MessageCircle,
  Heart,
  Plane,
  Home,
  Car,
  Users
} from 'lucide-react';

const insuranceTypeIcons: Record<string, React.ReactNode> = {
  health: <Heart className="w-5 h-5" />,
  travel: <Plane className="w-5 h-5" />,
  property: <Home className="w-5 h-5" />,
  vehicle: <Car className="w-5 h-5" />,
  life: <Users className="w-5 h-5" />,
};

export default function InsurancePlanDetail() {
  const { planId } = useParams();
  const { language } = useLanguage();
  const navigate = useNavigate();
  const { plans, isLoading } = useInsurancePlans();

  const plan = plans.find((p) => p.id === planId);

  if (isLoading) {
    return (
      <AppLayout showBottomNav={false}>
        <div className="p-4 space-y-4">
          <div className="h-48 bg-muted animate-pulse rounded-none" />
          <div className="h-8 bg-muted animate-pulse rounded-none" />
          <div className="h-24 bg-muted animate-pulse rounded-none" />
        </div>
      </AppLayout>
    );
  }

  if (!plan) {
    return (
      <AppLayout showBottomNav={false}>
        <div className="p-4 text-center">
          <p>{language === 'ru' ? 'План не найден' : 'Plan not found'}</p>
          <Button onClick={() => navigate('/insurance')} className="mt-4">
            {language === 'ru' ? 'Назад' : 'Go back'}
          </Button>
        </div>
      </AppLayout>
    );
  }

  const features = (plan.features as { en?: string[]; ru?: string[] }) || {};
  const exclusions = (plan.exclusions as { en?: string[]; ru?: string[] }) || {};

  return (
    <AppLayout showBottomNav={false}>
      <div className="pb-24">
        {/* Hero */}
        <div className="relative bg-gradient-to-br from-success via-success to-primary p-6 pt-16">
          <BackButton fallbackPath="/insurance" variant="overlay" className="absolute top-4 left-4" />
          
          <div className="text-white">
            <div className="flex items-center gap-2 mb-2">
              <Badge className="bg-white/20 text-white text-xs">
                {plan.plan_tier?.toUpperCase()}
              </Badge>
              <div className="text-white/80">
                {insuranceTypeIcons[plan.insurance_type]}
              </div>
              {plan.is_popular && (
                <Badge className="bg-warning text-warning-foreground text-xs">
                  ⭐ {language === 'ru' ? 'Популярно' : 'Popular'}
                </Badge>
              )}
            </div>
            
            <h1 className="text-2xl font-bold mb-2">
              {language === 'ru' ? plan.name_ru : plan.name_en}
            </h1>
            <p className="text-white/80 text-sm">
              {language === 'ru' ? plan.description_ru : plan.description_en}
            </p>
          </div>
        </div>

        {/* Pricing */}
        <div className="px-4 py-4 border-b border-border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">
                {language === 'ru' ? 'Стоимость' : 'Price'}
              </p>
              <div className="flex items-baseline gap-2">
                {plan.price_yearly && (
                  <span className="text-2xl font-bold text-primary">
                    ฿{plan.price_yearly.toLocaleString()}
                    <span className="text-sm text-muted-foreground font-normal">
                      /{language === 'ru' ? 'год' : 'year'}
                    </span>
                  </span>
                )}
                {plan.price_monthly && (
                  <span className="text-sm text-muted-foreground">
                    (฿{plan.price_monthly.toLocaleString()}/{language === 'ru' ? 'мес' : 'mo'})
                  </span>
                )}
              </div>
            </div>
            {plan.coverage_amount && (
              <div className="text-right">
                <p className="text-sm text-muted-foreground">
                  {language === 'ru' ? 'Покрытие до' : 'Coverage up to'}
                </p>
                <p className="text-lg font-bold">฿{plan.coverage_amount.toLocaleString()}</p>
              </div>
            )}
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="features" className="px-4 pt-4">
          <TabsList className="w-full grid grid-cols-2">
            <TabsTrigger value="features">{language === 'ru' ? 'Включено' : 'Features'}</TabsTrigger>
            <TabsTrigger value="exclusions">{language === 'ru' ? 'Исключения' : 'Exclusions'}</TabsTrigger>
          </TabsList>

          <TabsContent value="features" className="space-y-4 mt-4">
            <div className="bg-card border border-border rounded-none p-4">
              <ul className="space-y-3">
                {(language === 'ru' ? features.ru : features.en)?.map((feature, idx) => (
                  <li key={idx} className="flex items-start gap-3 text-sm">
                    <CheckCircle2 className="w-5 h-5 text-success flex-shrink-0" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Age requirements */}
            {(plan.min_age || plan.max_age) && (
              <div className="bg-card border border-border rounded-none p-4">
                <h3 className="font-semibold mb-2">
                  {language === 'ru' ? 'Возрастные ограничения' : 'Age Requirements'}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {plan.min_age && plan.max_age
                    ? `${plan.min_age} - ${plan.max_age} ${language === 'ru' ? 'лет' : 'years'}`
                    : plan.min_age
                    ? `${language === 'ru' ? 'От' : 'From'} ${plan.min_age} ${language === 'ru' ? 'лет' : 'years'}`
                    : `${language === 'ru' ? 'До' : 'Up to'} ${plan.max_age} ${language === 'ru' ? 'лет' : 'years'}`}
                </p>
              </div>
            )}

            {/* Deductible */}
            {plan.deductible && (
              <div className="bg-card border border-border rounded-none p-4">
                <h3 className="font-semibold mb-2">
                  {language === 'ru' ? 'Франшиза' : 'Deductible'}
                </h3>
                <p className="text-lg font-bold text-primary">฿{plan.deductible.toLocaleString()}</p>
              </div>
            )}

            {/* Medical exam */}
            {plan.requires_medical_exam !== null && (
              <div className="bg-card border border-border rounded-none p-4 flex items-center justify-between">
                <span className="text-sm">
                  {language === 'ru' ? 'Мед. осмотр' : 'Medical exam required'}
                </span>
                {plan.requires_medical_exam ? (
                  <Badge variant="secondary">
                    {language === 'ru' ? 'Требуется' : 'Required'}
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-success">
                    {language === 'ru' ? 'Не требуется' : 'Not required'}
                  </Badge>
                )}
              </div>
            )}
          </TabsContent>

          <TabsContent value="exclusions" className="space-y-4 mt-4">
            <div className="bg-card border border-border rounded-none p-4">
              <ul className="space-y-3">
                {(language === 'ru' ? exclusions.ru : exclusions.en)?.map((exclusion, idx) => (
                  <li key={idx} className="flex items-start gap-3 text-sm">
                    <XCircle className="w-5 h-5 text-destructive flex-shrink-0" />
                    <span>{exclusion}</span>
                  </li>
                ))}
              </ul>
            </div>
          </TabsContent>
        </Tabs>

        {/* Fixed Bottom Actions */}
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/95 backdrop-blur border-t border-border">
          <div className="flex gap-3 max-w-lg mx-auto">
            <Button variant="outline" className="flex-1">
              <MessageCircle className="w-4 h-4 mr-2" />
              {language === 'ru' ? 'Консультация' : 'Consult'}
            </Button>
            <Button className="flex-1" onClick={() => navigate(`/insurance/${plan.provider_id}/quote?plan=${plan.id}`)}>
              <Calendar className="w-4 h-4 mr-2" />
              {language === 'ru' ? 'Оформить' : 'Get Quote'}
            </Button>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
