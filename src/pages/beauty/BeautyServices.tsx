import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Clock, TrendingUp, Sparkles } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import { FilterChip } from '@/components/uno/FilterChip';
import { Input } from '@/components/ui/input';
import { IconBadge } from '@/components/ui/IconBadge';
import { useSupabaseQuery } from '@/hooks/useSupabaseQuery';
import type { SalonService } from '@/hooks/useSalons';
import { Loader2 } from 'lucide-react';

const categories = [
  { id: 'all', labelEn: 'All', labelRu: 'Все' },
  { id: 'popular', labelEn: 'Popular', labelRu: 'Популярное' },
  { id: 'massage', labelEn: 'Massage', labelRu: 'Массаж' },
  { id: 'hair', labelEn: 'Hair', labelRu: 'Волосы' },
  { id: 'nails', labelEn: 'Nails', labelRu: 'Ногти' },
  { id: 'face', labelEn: 'Facial', labelRu: 'Уход за лицом' },
  { id: 'makeup', labelEn: 'Makeup', labelRu: 'Макияж' },
];

export default function BeautyServices() {
  const { language } = useLanguage();
  const { formatPrice } = useCurrency();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const filters = useMemo(() => [{ column: 'is_active', value: true }], []);
  const { data: allServices, isLoading } = useSupabaseQuery<SalonService>({
    table: 'salon_services',
    filters,
    orderBy: { column: 'is_popular', ascending: false },
  });

  const filteredServices = useMemo(() => {
    return (allServices || []).filter(service => {
      const name = language === 'ru' ? service.name_ru : service.name_en;
      const matchesSearch = name.toLowerCase().includes(searchQuery.toLowerCase());
      if (selectedCategory === 'all') return matchesSearch;
      if (selectedCategory === 'popular') return matchesSearch && service.is_popular;
      return matchesSearch && service.category === selectedCategory;
    });
  }, [allServices, searchQuery, selectedCategory, language]);

  const groupedServices = useMemo(() => {
    return filteredServices.reduce((acc, service) => {
      const cat = service.category;
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(service);
      return acc;
    }, {} as Record<string, SalonService[]>);
  }, [filteredServices]);

  const getCategoryLabel = (catId: string) => {
    const cat = categories.find(c => c.id === catId);
    return cat ? (language === 'ru' ? cat.labelRu : cat.labelEn) : catId;
  };

  return (
    <AppLayout>
      <div className="px-4 py-6 space-y-6">
        <div>
          <h1 className="text-2xl font-display font-bold">
            {language === 'ru' ? 'Каталог услуг' : 'Services Catalog'}
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            {isLoading ? '...' : language === 'ru' ? `${allServices?.length || 0} услуг доступно` : `${allServices?.length || 0} services available`}
          </p>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input placeholder={language === 'ru' ? 'Поиск услуг...' : 'Search services...'} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10 h-12 bg-card border-border/50" />
        </div>

        <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
          {categories.map((cat) => (
            <FilterChip key={cat.id} label={language === 'ru' ? cat.labelRu : cat.labelEn} isActive={selectedCategory === cat.id} onToggle={() => setSelectedCategory(cat.id)} />
          ))}
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
        ) : (
          <>
            {selectedCategory === 'all' || selectedCategory === 'popular' ? (
              <div className="space-y-8">
                {Object.entries(groupedServices).map(([category, services]) => (
                  <div key={category}>
                    <h2 className="text-lg font-semibold mb-3">{getCategoryLabel(category)}</h2>
                    <div className="space-y-2">
                      {services.map((service) => (
                        <ServiceCard key={service.id} service={service} language={language} formatPrice={formatPrice} onClick={() => navigate('/beauty')} />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-2">
                {filteredServices.map((service) => (
                  <ServiceCard key={service.id} service={service} language={language} formatPrice={formatPrice} onClick={() => navigate('/beauty')} />
                ))}
              </div>
            )}
            {filteredServices.length === 0 && (
              <div className="text-center py-12">
                <p className="text-muted-foreground">{language === 'ru' ? 'Ничего не найдено' : 'No results found'}</p>
              </div>
            )}
          </>
        )}
      </div>
    </AppLayout>
  );
}

function ServiceCard({ service, language, formatPrice, onClick }: {
  service: SalonService;
  language: 'ru' | 'en' | 'th';
  formatPrice: (price: number) => string;
  onClick: () => void;
}) {
  return (
    <button onClick={onClick} className="w-full flex items-center gap-4 p-4 rounded-xl bg-card border border-border/50 hover:border-primary/30 transition-all text-left">
      <IconBadge icon={Sparkles} size="lg" variant="primary" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h3 className="font-medium truncate">{language === 'ru' ? service.name_ru : service.name_en}</h3>
          {service.is_popular && <TrendingUp className="w-4 h-4 text-primary flex-shrink-0" />}
        </div>
        <div className="flex items-center gap-3 text-sm text-muted-foreground mt-0.5">
          <span className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            {service.duration_minutes} {language === 'ru' ? 'мин' : 'min'}
          </span>
        </div>
      </div>
      <div className="text-right">
        <span className="font-semibold text-primary">{formatPrice(service.price)}</span>
      </div>
    </button>
  );
}
