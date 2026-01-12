import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Filter, Clock, Star, TrendingUp } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useLanguage } from '@/contexts/LanguageContext';
import { FilterChip } from '@/components/uno/FilterChip';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

// Demo services data
const allServices = [
  // Massage
  { id: 'srv-1', category: 'massage', name: 'Thai Massage', nameRu: 'Тайский массаж', price: 600, duration: 60, popular: true, icon: '💆' },
  { id: 'srv-2', category: 'massage', name: 'Aromatherapy Massage', nameRu: 'Ароматерапия', price: 1200, duration: 90, popular: true, icon: '🌸' },
  { id: 'srv-3', category: 'massage', name: 'Hot Stone Massage', nameRu: 'Горячие камни', price: 1500, duration: 90, icon: '🪨' },
  { id: 'srv-4', category: 'massage', name: 'Oil Massage', nameRu: 'Масляный массаж', price: 800, duration: 60, icon: '💧' },
  { id: 'srv-5', category: 'massage', name: 'Foot Massage', nameRu: 'Массаж ног', price: 400, duration: 45, popular: true, icon: '🦶' },
  // Hair
  { id: 'srv-6', category: 'hair', name: 'Haircut - Women', nameRu: 'Стрижка женская', price: 800, duration: 60, popular: true, icon: '💇‍♀️' },
  { id: 'srv-7', category: 'hair', name: 'Haircut - Men', nameRu: 'Стрижка мужская', price: 400, duration: 30, icon: '💇‍♂️' },
  { id: 'srv-8', category: 'hair', name: 'Hair Coloring', nameRu: 'Окрашивание', price: 2500, duration: 180, icon: '🎨' },
  { id: 'srv-9', category: 'hair', name: 'Hair Treatment', nameRu: 'Уход за волосами', price: 1500, duration: 90, icon: '✨' },
  { id: 'srv-10', category: 'hair', name: 'Blowout', nameRu: 'Укладка', price: 600, duration: 45, icon: '💨' },
  // Nails
  { id: 'srv-11', category: 'nails', name: 'Manicure', nameRu: 'Маникюр', price: 400, duration: 45, popular: true, icon: '💅' },
  { id: 'srv-12', category: 'nails', name: 'Pedicure', nameRu: 'Педикюр', price: 500, duration: 60, popular: true, icon: '🦶' },
  { id: 'srv-13', category: 'nails', name: 'Gel Nails', nameRu: 'Гель-лак', price: 800, duration: 90, icon: '💎' },
  { id: 'srv-14', category: 'nails', name: 'Nail Art', nameRu: 'Дизайн ногтей', price: 1000, duration: 120, icon: '🎨' },
  // Facial
  { id: 'srv-15', category: 'facial', name: 'Classic Facial', nameRu: 'Классический уход', price: 1200, duration: 60, popular: true, icon: '🧖' },
  { id: 'srv-16', category: 'facial', name: 'Deep Cleansing', nameRu: 'Глубокое очищение', price: 1500, duration: 75, icon: '🧴' },
  { id: 'srv-17', category: 'facial', name: 'Anti-Aging Treatment', nameRu: 'Антивозрастной уход', price: 2500, duration: 90, icon: '🌟' },
  { id: 'srv-18', category: 'facial', name: 'Hydrating Facial', nameRu: 'Увлажняющий уход', price: 1800, duration: 75, icon: '💧' },
  // Makeup
  { id: 'srv-19', category: 'makeup', name: 'Day Makeup', nameRu: 'Дневной макияж', price: 1000, duration: 45, icon: '💄' },
  { id: 'srv-20', category: 'makeup', name: 'Evening Makeup', nameRu: 'Вечерний макияж', price: 1500, duration: 60, popular: true, icon: '🌙' },
  { id: 'srv-21', category: 'makeup', name: 'Bridal Makeup', nameRu: 'Свадебный макияж', price: 3500, duration: 120, icon: '👰' },
  { id: 'srv-22', category: 'makeup', name: 'Brow Styling', nameRu: 'Оформление бровей', price: 600, duration: 30, popular: true, icon: '🖌️' },
];

const categories = [
  { id: 'all', labelEn: 'All', labelRu: 'Все', icon: '✨' },
  { id: 'popular', labelEn: 'Popular', labelRu: 'Популярное', icon: '🔥' },
  { id: 'massage', labelEn: 'Massage', labelRu: 'Массаж', icon: '💆' },
  { id: 'hair', labelEn: 'Hair', labelRu: 'Волосы', icon: '💇' },
  { id: 'nails', labelEn: 'Nails', labelRu: 'Ногти', icon: '💅' },
  { id: 'facial', labelEn: 'Facial', labelRu: 'Уход за лицом', icon: '🧖' },
  { id: 'makeup', labelEn: 'Makeup', labelRu: 'Макияж', icon: '💄' },
];

export default function BeautyServices() {
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const filteredServices = allServices.filter(service => {
    const name = language === 'ru' ? service.nameRu : service.name;
    const matchesSearch = name.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (selectedCategory === 'all') return matchesSearch;
    if (selectedCategory === 'popular') return matchesSearch && service.popular;
    return matchesSearch && service.category === selectedCategory;
  });

  // Group services by category for display
  const groupedServices = filteredServices.reduce((acc, service) => {
    const cat = service.category;
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(service);
    return acc;
  }, {} as Record<string, typeof allServices>);

  const getCategoryLabel = (cat: string) => {
    const category = categories.find(c => c.id === cat);
    return language === 'ru' ? category?.labelRu : category?.labelEn;
  };

  return (
    <AppLayout>
      <div className="px-4 py-6 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-display font-bold">
            {language === 'ru' ? 'Каталог услуг' : 'Services Catalog'}
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            {language === 'ru' 
              ? `${allServices.length} услуг доступно` 
              : `${allServices.length} services available`}
          </p>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            placeholder={language === 'ru' ? 'Поиск услуг...' : 'Search services...'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-12 bg-card border-border/50"
          />
        </div>

        {/* Category filters */}
        <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
          {categories.map((cat) => (
            <FilterChip
              key={cat.id}
              label={`${cat.icon} ${language === 'ru' ? cat.labelRu : cat.labelEn}`}
              isActive={selectedCategory === cat.id}
              onToggle={() => setSelectedCategory(cat.id)}
            />
          ))}
        </div>

        {/* Services List */}
        {selectedCategory === 'all' || selectedCategory === 'popular' ? (
          // Grouped view
          <div className="space-y-8">
            {Object.entries(groupedServices).map(([category, services]) => (
              <div key={category}>
                <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  {categories.find(c => c.id === category)?.icon}
                  {getCategoryLabel(category)}
                </h2>
                <div className="space-y-2">
                  {services.map((service) => (
                    <ServiceCard 
                      key={service.id} 
                      service={service} 
                      language={language}
                      onClick={() => navigate('/beauty')}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          // Single category view
          <div className="space-y-2">
            {filteredServices.map((service) => (
              <ServiceCard 
                key={service.id} 
                service={service} 
                language={language}
                onClick={() => navigate('/beauty')}
              />
            ))}
          </div>
        )}

        {filteredServices.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">{t('message.noResults')}</p>
          </div>
        )}
      </div>
    </AppLayout>
  );
}

function ServiceCard({ 
  service, 
  language,
  onClick 
}: { 
  service: typeof allServices[0];
  language: 'ru' | 'en' | 'th';
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-4 p-4 rounded-xl bg-card border border-border/50 hover:border-primary/30 transition-all text-left"
    >
      <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-2xl flex-shrink-0">
        {service.icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h3 className="font-medium truncate">
            {language === 'ru' ? service.nameRu : service.name}
          </h3>
          {service.popular && (
            <TrendingUp className="w-4 h-4 text-primary flex-shrink-0" />
          )}
        </div>
        <div className="flex items-center gap-3 text-sm text-muted-foreground mt-0.5">
          <span className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            {service.duration} {language === 'ru' ? 'мин' : 'min'}
          </span>
        </div>
      </div>
      <div className="text-right">
        <span className="font-semibold text-primary">฿{service.price.toLocaleString()}</span>
      </div>
    </button>
  );
}
