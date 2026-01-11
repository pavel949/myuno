import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Heart, Plane, Home, Car, Users } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { MiniAppLayout, ItemCard, MiniAppQuickGrid, type MiniAppCategory, type QuickGridItem } from '@/components/miniapp';
import { FilterValues } from '@/components/filters';
import { useInsuranceProviders, useInsurancePlans } from '@/hooks/useInsurance';
import { Badge } from '@/components/ui/badge';

const categories: MiniAppCategory[] = [
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
  const [filterValues, setFilterValues] = useState<FilterValues>({});

  const { providers, isLoading: providersLoading } = useInsuranceProviders({
    insuranceType: selectedCategory,
    searchQuery,
  });

  const { plans, isLoading: plansLoading } = useInsurancePlans(undefined, selectedCategory);

  const quickItems: QuickGridItem[] = [
    { icon: '🏥', label: language === 'ru' ? 'Здоровье' : 'Health', onClick: () => setSelectedCategory('health') },
    { icon: '✈️', label: language === 'ru' ? 'Путешествия' : 'Travel', onClick: () => setSelectedCategory('travel') },
    { icon: '🛂', label: language === 'ru' ? 'Для визы' : 'Visa', onClick: () => navigate('/legal?category=visa') },
    { icon: '⭐', label: language === 'ru' ? 'Elite Виза' : 'Elite Visa', onClick: () => navigate('/legal/visa/elite') },
  ];

  const popularPlans = useMemo(() => plans.filter((p) => p.is_popular).slice(0, 4), [plans]);

  const isLoading = providersLoading || plansLoading;

  return (
    <MiniAppLayout
      title={language === 'ru' ? 'Страхование' : 'Insurance'}
      subtitle={language === 'ru' ? `${providers.length} компаний` : `${providers.length} providers`}
      heroIcon={Shield}
      heroTitle={language === 'ru' ? 'Страхование в Таиланде' : 'Insurance in Thailand'}
      heroSubtitle={language === 'ru' ? 'Медицинское, туристическое и визовое страхование' : 'Health, travel, and visa insurance'}
      heroImage="https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=800"
      heroGradient={{ from: 'from-emerald-600/20', via: 'via-teal-600/20', to: 'to-cyan-700/20' }}
      searchValue={searchQuery}
      onSearchChange={setSearchQuery}
      searchPlaceholder={language === 'ru' ? 'Поиск страховки...' : 'Search insurance...'}
      categories={categories}
      selectedCategory={selectedCategory}
      onCategoryChange={setSelectedCategory}
      isLoading={isLoading}
      isEmpty={providers.length === 0}
      emptyIcon={Shield}
      emptyText={language === 'ru' ? 'Страховые компании не найдены' : 'No insurance providers found'}
    >
      <MiniAppQuickGrid items={quickItems} columns={4} className="mb-6" />

      {/* Popular Plans */}
      {popularPlans.length > 0 && (
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <span className="text-primary">⭐</span>
            {language === 'ru' ? 'Популярные планы' : 'Popular Plans'}
          </h2>
          <div className="grid grid-cols-1 gap-3">
            {popularPlans.map((plan) => (
              <div
                key={plan.id}
                onClick={() => navigate(`/insurance/plan/${plan.id}`)}
                className="bg-card border border-border rounded-xl p-4 cursor-pointer hover:border-primary/50 transition-colors"
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
                      {language === 'ru' ? plan.name_ru : plan.name_en}
                    </h3>
                  </div>
                  <div className="text-right">
                    {plan.price_yearly && (
                      <p className="font-bold text-primary">
                        ฿{plan.price_yearly.toLocaleString()}
                        <span className="text-xs text-muted-foreground">
                          /{language === 'ru' ? 'год' : 'yr'}
                        </span>
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
                  <p className="text-sm text-muted-foreground">
                    {language === 'ru' ? 'Покрытие до' : 'Coverage up to'}{' '}
                    ฿{plan.coverage_amount.toLocaleString()}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Insurance Providers */}
      <h2 className="text-lg font-semibold mb-3">
        {language === 'ru' ? 'Страховые компании' : 'Insurance Companies'}
      </h2>
      <div className="space-y-4">
        {providers.map((provider) => (
          <ItemCard
            key={provider.id}
            image={provider.cover_image || 'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=200'}
            title={language === 'ru' ? provider.name_ru : provider.name_en}
            subtitle={language === 'ru' ? provider.description_ru : provider.description_en}
            rating={provider.rating}
            reviewCount={provider.review_count}
            isVerified={provider.is_verified}
            tags={provider.insurance_types.slice(0, 3).map((t) =>
              t.charAt(0).toUpperCase() + t.slice(1)
            )}
            onClick={() => navigate(`/insurance/${provider.id}`)}
          />
        ))}
      </div>
    </MiniAppLayout>
  );
}
