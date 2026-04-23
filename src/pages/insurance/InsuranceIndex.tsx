import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Heart, Plane, Home, Car, Users, AlertTriangle, ArrowRight } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { MiniAppLayout } from '@/components/miniapp/MiniAppLayout';
import { ItemCard } from '@/components/miniapp';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/uno/EmptyState';
import { Badge } from '@/components/ui/badge';
import { useInsuranceProviders, useInsurancePlans } from '@/hooks/useInsurance';
import { PLACEHOLDER_IMAGES } from '@/lib/config/placeholders';

const categories = [
  { id: 'all', labelEn: 'All', labelRu: 'Все' },
  { id: 'health', labelEn: 'Health', labelRu: 'Здоровье', icon: '🏥' },
  { id: 'travel', labelEn: 'Travel', labelRu: 'Путешествия', icon: '✈️' },
  { id: 'property', labelEn: 'Property', labelRu: 'Имущество', icon: '🏠' },
  { id: 'vehicle', labelEn: 'Vehicle', labelRu: 'Авто', icon: '🚗' },
  { id: 'life', labelEn: 'Life', labelRu: 'Жизнь', icon: '❤️' },
];

const insuranceTypeIcons: Record<string, React.ReactNode> = {
  health: <Heart className="w-4 h-4" />,
  travel: <Plane className="w-4 h-4" />,
  property: <Home className="w-4 h-4" />,
  vehicle: <Car className="w-4 h-4" />,
  life: <Users className="w-4 h-4" />,
};

export default function InsuranceIndex() {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const isRu = language === 'ru';

  const { providers, isLoading: providersLoading } = useInsuranceProviders({
    insuranceType: selectedCategory,
    searchQuery,
  });

  const { plans, isLoading: plansLoading } = useInsurancePlans(undefined, selectedCategory);
  const popularPlans = useMemo(() => plans.filter((p) => p.is_popular).slice(0, 4), [plans]);
  const isLoading = providersLoading || plansLoading;

  return (
    <MiniAppLayout
      title={isRu ? 'Страхование' : 'Insurance'}
      subtitle={`${providers.length} ${isRu ? 'компаний' : 'providers'}`}
      fallbackPath="/discover"
      categories={categories}
      selectedCategory={selectedCategory}
      onCategoryChange={setSelectedCategory}
      searchValue={searchQuery}
      onSearchChange={setSearchQuery}
      searchPlaceholder={isRu ? 'Поиск страховок...' : 'Search insurance...'}
      showHero={false}
      showFilter={false}
    >
      {/* Travel Insurance Promo Banner */}
      <div
        onClick={() => navigate('/insurance/travel')}
        className="p-4 rounded-none bg-destructive/5 border border-destructive/20 cursor-pointer hover:border-destructive/40 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5 text-destructive" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm">
              {isRu ? 'Не летите без страховки!' : "Don't Fly Without Insurance!"}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {isRu ? 'Быстрая туристическая страховка от 100 ₽/день' : 'Quick travel insurance from $1/day'}
            </p>
          </div>
          <ArrowRight className="w-4 h-4 text-muted-foreground shrink-0" />
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-5">
          {[1,2,3].map(i => (
            <div key={i} className="space-y-2">
              <Skeleton className="aspect-[4/3] rounded-none" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          ))}
        </div>
      ) : (
        <>
          {/* Popular Plans */}
          {popularPlans.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold font-display mb-3">
                {isRu ? 'Популярные планы' : 'Popular Plans'}
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {popularPlans.map((plan) => (
                  <div
                    key={plan.id}
                    onClick={() => navigate(`/insurance/plan/${plan.id}`)}
                    className="bg-card border border-border rounded-none p-4 cursor-pointer hover:border-primary/50 transition-colors [box-shadow:var(--shadow-elevation-1)]"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline" className="text-xs">
                            {plan.plan_tier.toUpperCase()}
                          </Badge>
                          {insuranceTypeIcons[plan.insurance_type]}
                        </div>
                        <h3 className="font-semibold">
                          {isRu ? plan.name_ru : plan.name_en}
                        </h3>
                      </div>
                      <div className="text-right">
                        {plan.price_yearly && (
                          <p className="font-bold text-primary">
                            ฿{plan.price_yearly.toLocaleString()}
                            <span className="text-xs text-muted-foreground">/{isRu ? 'год' : 'yr'}</span>
                          </p>
                        )}
                        {plan.price_monthly && (
                          <p className="text-sm text-muted-foreground">
                            ฿{plan.price_monthly.toLocaleString()}/{isRu ? 'мес' : 'mo'}
                          </p>
                        )}
                      </div>
                    </div>
                    {plan.coverage_amount && (
                      <p className="text-sm text-muted-foreground">
                        {isRu ? 'Покрытие до' : 'Coverage up to'} ฿{plan.coverage_amount.toLocaleString()}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Insurance Providers */}
          {providers.length === 0 ? (
            <EmptyState
              icon={Shield}
              title={isRu ? 'Страховые компании не найдены' : 'No insurance providers found'}
            />
          ) : (
            <>
              <h2 className="text-lg font-semibold font-display mb-3">
                {isRu ? 'Страховые компании' : 'Insurance Companies'}
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-5">
                {providers.map((provider) => (
                  <ItemCard
                    key={provider.id}
                    image={provider.cover_image || PLACEHOLDER_IMAGES.insurance}
                    title={isRu ? provider.name_ru : provider.name_en}
                    subtitle={isRu ? provider.description_ru : provider.description_en}
                    rating={provider.rating}
                    reviewCount={provider.review_count}
                    isVerified={provider.is_verified}
                    tags={provider.insurance_types.slice(0, 3).map((t) => t.charAt(0).toUpperCase() + t.slice(1))}
                    onClick={() => navigate(`/insurance/${provider.id}`)}
                  />
                ))}
              </div>
            </>
          )}
        </>
      )}
    </MiniAppLayout>
  );
}
