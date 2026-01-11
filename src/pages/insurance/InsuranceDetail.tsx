import { useParams, useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BackButton } from '@/components/uno/BackButton';
import { LoadingSpinner } from '@/components/uno/LoadingSpinner';
import { useInsuranceProvider, useInsurancePlans } from '@/hooks/useInsurance';
import {
  Star,
  Phone,
  Mail,
  Globe,
  CheckCircle2,
  Languages,
  Shield,
  Clock,
  Award,
  Heart,
  Plane,
  Home,
  Car,
} from 'lucide-react';

const insuranceTypeLabels: Record<string, { en: string; ru: string }> = {
  health: { en: 'Health', ru: 'Здоровье' },
  travel: { en: 'Travel', ru: 'Путешествия' },
  property: { en: 'Property', ru: 'Имущество' },
  vehicle: { en: 'Vehicle', ru: 'Авто' },
  life: { en: 'Life', ru: 'Жизнь' },
};

const tierColors: Record<string, string> = {
  basic: 'bg-gray-500/20 text-gray-400',
  standard: 'bg-blue-500/20 text-blue-400',
  premium: 'bg-purple-500/20 text-purple-400',
  vip: 'bg-primary/20 text-primary',
};

export default function InsuranceDetail() {
  const { id } = useParams<{ id: string }>();
  const { language } = useLanguage();
  const navigate = useNavigate();

  const { provider, isLoading: providerLoading } = useInsuranceProvider(id || '');
  const { plans, isLoading: plansLoading } = useInsurancePlans(id);

  if (providerLoading || plansLoading) {
    return (
      <AppLayout showBottomNav={false}>
        <div className="flex items-center justify-center h-96">
          <LoadingSpinner />
        </div>
      </AppLayout>
    );
  }

  if (!provider) {
    return (
      <AppLayout showBottomNav={false}>
        <div className="p-4 text-center">
          <p>{language === 'ru' ? 'Компания не найдена' : 'Provider not found'}</p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout showBottomNav={false}>
      <div className="pb-24">
        {/* Hero Image */}
        <div className="relative h-48">
          <BackButton fallbackPath="/insurance" variant="overlay" className="absolute top-4 left-4 z-10" />
          <img
            src={provider.cover_image || 'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=800'}
            alt={provider.name_en}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background/90 to-transparent" />
          <div className="absolute bottom-4 left-4 right-4">
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-xl font-bold">{language === 'ru' ? provider.name_ru : provider.name_en}</h1>
              {provider.is_verified && <CheckCircle2 className="w-5 h-5 text-primary" />}
            </div>
            <div className="flex flex-wrap gap-1">
              {provider.insurance_types.map((type) => (
                <Badge key={type} variant="secondary" className="text-xs">
                  {insuranceTypeLabels[type]?.[language] || type}
                </Badge>
              ))}
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="px-4 py-4 border-b border-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1">
                <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                <span className="font-semibold">{provider.rating}</span>
                <span className="text-sm text-muted-foreground">({provider.review_count})</span>
              </div>
              {provider.has_24h_support && (
                <div className="flex items-center gap-1 text-sm text-green-500">
                  <Clock className="w-4 h-4" />
                  <span>24/7</span>
                </div>
              )}
            </div>
            <div className="flex gap-1">
              {provider.languages.slice(0, 3).map((lang) => (
                <Badge key={lang} variant="outline" className="text-xs">
                  {lang.slice(0, 2).toUpperCase()}
                </Badge>
              ))}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="plans" className="px-4 pt-4">
          <TabsList className="w-full grid grid-cols-3">
            <TabsTrigger value="plans">{language === 'ru' ? 'Планы' : 'Plans'}</TabsTrigger>
            <TabsTrigger value="about">{language === 'ru' ? 'О нас' : 'About'}</TabsTrigger>
            <TabsTrigger value="contact">{language === 'ru' ? 'Контакты' : 'Contact'}</TabsTrigger>
          </TabsList>

          <TabsContent value="plans" className="space-y-4 mt-4">
            {plans.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                {language === 'ru' ? 'Нет доступных планов' : 'No plans available'}
              </p>
            ) : (
              plans.map((plan) => (
                <div
                  key={plan.id}
                  className="bg-card border border-border rounded-xl p-4 cursor-pointer hover:border-primary/50 transition-colors"
                  onClick={() => navigate(`/insurance/plan/${plan.id}`)}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Badge className={tierColors[plan.plan_tier] || tierColors.standard}>
                          {plan.plan_tier.toUpperCase()}
                        </Badge>
                        {plan.is_popular && (
                          <Badge variant="outline" className="text-xs border-primary text-primary">
                            ⭐ {language === 'ru' ? 'Популярный' : 'Popular'}
                          </Badge>
                        )}
                      </div>
                      <h3 className="font-semibold">{language === 'ru' ? plan.name_ru : plan.name_en}</h3>
                    </div>
                    <div className="text-right">
                      {plan.price_yearly && (
                        <p className="font-bold text-primary">
                          ฿{plan.price_yearly.toLocaleString()}
                          <span className="text-xs text-muted-foreground">/{language === 'ru' ? 'год' : 'yr'}</span>
                        </p>
                      )}
                      {plan.price_monthly && (
                        <p className="text-sm text-muted-foreground">
                          ฿{plan.price_monthly.toLocaleString()}/{language === 'ru' ? 'мес' : 'mo'}
                        </p>
                      )}
                    </div>
                  </div>

                  {plan.coverage_amount && (
                    <p className="text-sm text-muted-foreground mb-2">
                      <Shield className="w-4 h-4 inline mr-1" />
                      {language === 'ru' ? 'Покрытие:' : 'Coverage:'} ฿{plan.coverage_amount.toLocaleString()}
                    </p>
                  )}

                  {plan.features.length > 0 && (
                    <div className="space-y-1">
                      {plan.features.slice(0, 3).map((feature, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-sm">
                          <CheckCircle2 className="w-3 h-3 text-green-500 flex-shrink-0" />
                          <span className="text-muted-foreground">{language === 'ru' ? feature.ru : feature.en}</span>
                        </div>
                      ))}
                      {plan.features.length > 3 && (
                        <p className="text-xs text-primary">
                          +{plan.features.length - 3} {language === 'ru' ? 'ещё' : 'more'}
                        </p>
                      )}
                    </div>
                  )}

                  <Button className="w-full mt-4" variant="outline">
                    {language === 'ru' ? 'Подробнее' : 'View Details'}
                  </Button>
                </div>
              ))
            )}
          </TabsContent>

          <TabsContent value="about" className="space-y-4 mt-4">
            <div className="bg-card border border-border rounded-xl p-4">
              <p className="text-sm text-muted-foreground">
                {language === 'ru' ? provider.description_ru : provider.description_en}
              </p>
            </div>

            {provider.license_number && (
              <div className="bg-card border border-border rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Award className="w-4 h-4 text-primary" />
                  <h3 className="font-semibold">{language === 'ru' ? 'Лицензия' : 'License'}</h3>
                </div>
                <p className="text-sm text-muted-foreground">{provider.license_number}</p>
              </div>
            )}

            <div className="bg-card border border-border rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <Languages className="w-4 h-4 text-primary" />
                <h3 className="font-semibold">{language === 'ru' ? 'Языки поддержки' : 'Support Languages'}</h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {provider.languages.map((lang) => (
                  <Badge key={lang} variant="outline">
                    {lang}
                  </Badge>
                ))}
              </div>
            </div>

            <div className="bg-card border border-border rounded-xl p-4">
              <h3 className="font-semibold mb-3">{language === 'ru' ? 'Преимущества' : 'Features'}</h3>
              <div className="space-y-2">
                {provider.has_online_claims && (
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                    <span>{language === 'ru' ? 'Онлайн подача заявок' : 'Online claims submission'}</span>
                  </div>
                )}
                {provider.has_24h_support && (
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                    <span>{language === 'ru' ? 'Поддержка 24/7' : '24/7 support'}</span>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="contact" className="space-y-4 mt-4">
            <div className="bg-card border border-border rounded-xl p-4 space-y-3">
              {provider.phone && (
                <a href={`tel:${provider.phone}`} className="flex items-center gap-3 text-sm hover:text-primary transition-colors">
                  <Phone className="w-4 h-4 text-muted-foreground" />
                  <span>{provider.phone}</span>
                </a>
              )}
              {provider.email && (
                <a href={`mailto:${provider.email}`} className="flex items-center gap-3 text-sm hover:text-primary transition-colors">
                  <Mail className="w-4 h-4 text-muted-foreground" />
                  <span>{provider.email}</span>
                </a>
              )}
              {provider.website && (
                <a href={provider.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-sm hover:text-primary transition-colors">
                  <Globe className="w-4 h-4 text-muted-foreground" />
                  <span>{provider.website}</span>
                </a>
              )}
            </div>
          </TabsContent>
        </Tabs>

        {/* Fixed Bottom Actions */}
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/95 backdrop-blur border-t border-border">
          <div className="flex gap-3 max-w-lg mx-auto">
            <Button variant="outline" className="flex-1" onClick={() => provider.phone && window.open(`tel:${provider.phone}`)}>
              <Phone className="w-4 h-4 mr-2" />
              {language === 'ru' ? 'Позвонить' : 'Call'}
            </Button>
            <Button className="flex-1" onClick={() => navigate(`/insurance/${id}/quote`)}>
              <Shield className="w-4 h-4 mr-2" />
              {language === 'ru' ? 'Получить расчёт' : 'Get Quote'}
            </Button>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
