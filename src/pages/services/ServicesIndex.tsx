import { useState, useEffect, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { 
  Wrench, Zap, Droplets, Sparkles, Hammer, PaintBucket,
  Wind, Key, Truck, Star, Clock, MapPin, CheckCircle2
} from "lucide-react";
import { MiniAppLayout, ItemCard, MiniAppQuickGrid, type MiniAppCategory, type QuickGridItem } from "@/components/miniapp";
import { servicesFilterConfig, FilterValues } from "@/components/filters";
import { Badge } from "@/components/ui/badge";

const categories = [
  { id: "water-delivery", icon: '💧', name: 'Water', nameRu: 'Вода' },
  { id: "plumbing", icon: '🔧', name: 'Plumbing', nameRu: 'Сантехник' },
  { id: "electrical", icon: '⚡', name: 'Electrical', nameRu: 'Электрик' },
  { id: "cleaning", icon: '✨', name: 'Cleaning', nameRu: 'Уборка' },
  { id: "repair", icon: '🔨', name: 'Repair', nameRu: 'Ремонт' },
  { id: "hvac", icon: '❄️', name: 'HVAC', nameRu: 'Кондиционеры' },
  { id: "moving", icon: '🚚', name: 'Moving', nameRu: 'Переезд' },
  { id: "road-assistance", icon: '🚗', name: 'Road Help', nameRu: 'Помощь на дороге' },
];

const providers = [
  {
    id: "srv-water-1",
    name: "Aqua Delivery",
    nameRu: "Аква Доставка",
    category: "water-delivery",
    rating: 4.9,
    reviews: 234,
    experience: "5 years",
    experienceRu: "5 лет опыта",
    price: 150,
    location: "All Phuket",
    locationRu: "Весь Пхукет",
    available: true,
    verified: true,
    image: "https://images.unsplash.com/photo-1548839140-29a749e1cf4d?w=200",
    services: ["19L water", "Same day", "Cooler rental"],
    servicesRu: ["Вода 19л", "В день заказа", "Аренда кулера"],
  },
  {
    id: "srv-1",
    name: "Alex Masters",
    nameRu: "Алексей Мастеров",
    category: "plumbing",
    rating: 4.9,
    reviews: 156,
    experience: "10 years",
    experienceRu: "10 лет опыта",
    price: 1500,
    location: "Downtown",
    locationRu: "Центр",
    available: true,
    verified: true,
    image: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=200",
    services: ["Installation", "Pipe repair", "Drain cleaning"],
    servicesRu: ["Установка", "Ремонт труб", "Прочистка"],
  },
  {
    id: "srv-2",
    name: "Igor Electrician",
    nameRu: "Игорь Электриков",
    category: "electrical",
    rating: 4.8,
    reviews: 203,
    experience: "15 years",
    experienceRu: "15 лет опыта",
    price: 2000,
    location: "City-wide",
    locationRu: "Весь город",
    available: true,
    verified: true,
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200",
    services: ["Wiring", "Outlets", "Electrical installation"],
    servicesRu: ["Проводка", "Розетки", "Электромонтаж"],
  },
  {
    id: "srv-3",
    name: "Clean House",
    nameRu: "Чистый Дом",
    category: "cleaning",
    rating: 4.7,
    reviews: 312,
    experience: "Team of 20+",
    experienceRu: "Команда 20+ человек",
    price: 3000,
    location: "City-wide",
    locationRu: "Весь город",
    available: true,
    verified: true,
    image: "https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=200",
    services: ["Deep cleaning", "Maintenance", "Windows"],
    servicesRu: ["Генеральная уборка", "Поддерживающая", "Мытьё окон"],
  },
  {
    id: "srv-6",
    name: "Climate Service",
    nameRu: "Климат Сервис",
    category: "hvac",
    rating: 4.8,
    reviews: 145,
    experience: "6 years",
    experienceRu: "6 лет опыта",
    price: 3500,
    location: "All Phuket",
    locationRu: "Весь Пхукет",
    available: true,
    verified: true,
    image: "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=200",
    services: ["AC install", "Cleaning", "Repair"],
    servicesRu: ["Установка", "Чистка", "Ремонт"],
  },
  {
    id: "srv-road-1",
    name: "Phuket Road Help",
    nameRu: "Phuket Road Help",
    category: "road-assistance",
    rating: 4.9,
    reviews: 312,
    experience: "24/7 service",
    experienceRu: "24/7 сервис",
    price: 500,
    location: "All Phuket",
    locationRu: "Весь Пхукет",
    available: true,
    verified: true,
    image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=200",
    services: ["Tow truck", "Jump start", "Tire change"],
    servicesRu: ["Эвакуатор", "Запуск", "Замена колеса"],
  },
];

const SERVICE_CATEGORIES: MiniAppCategory[] = [
  { id: 'all', labelEn: 'All', labelRu: 'Все' },
  ...categories.map(c => ({ id: c.id, labelEn: c.name, labelRu: c.nameRu })),
];

export default function ServicesIndex() {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [filterValues, setFilterValues] = useState<FilterValues>({});

  useEffect(() => {
    const categoryParam = searchParams.get('category');
    if (categoryParam) setSelectedCategory(categoryParam);
  }, [searchParams]);

  const filteredProviders = useMemo(() => {
    return providers.filter((provider) => {
      const name = language === 'ru' ? provider.nameRu : provider.name;
      const matchesSearch = name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === 'all' || provider.category === selectedCategory;
      
      const features = filterValues.features as string[] || [];
      if (features.includes('verified') && !provider.verified) return false;
      if (features.includes('same-day') && !provider.available) return false;
      
      return matchesSearch && matchesCategory;
    });
  }, [providers, searchQuery, selectedCategory, filterValues, language]);

  const quickItems: QuickGridItem[] = categories.slice(0, 4).map(c => ({
    icon: c.icon,
    label: language === 'ru' ? c.nameRu : c.name,
    onClick: () => setSelectedCategory(c.id),
  }));

  return (
    <MiniAppLayout
      title={language === "ru" ? "Домашние услуги" : "Home Services"}
      subtitle={language === 'ru' ? `${filteredProviders.length} мастеров` : `${filteredProviders.length} professionals`}
      heroIcon={Wrench}
      heroTitle={language === 'ru' ? 'Мастера на все руки' : 'Professional Services'}
      heroSubtitle={language === 'ru' ? 'Сантехники, электрики, уборка и многое другое' : 'Plumbers, electricians, cleaning and more'}
      heroImage="https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=800"
      heroGradient={{ from: 'from-amber-500/20', via: 'via-orange-500/20', to: 'to-primary/20' }}
      searchValue={searchQuery}
      onSearchChange={setSearchQuery}
      searchPlaceholder={language === "ru" ? "Найти услугу или мастера..." : "Find service or professional..."}
      categories={SERVICE_CATEGORIES}
      selectedCategory={selectedCategory}
      onCategoryChange={setSelectedCategory}
      filterConfig={servicesFilterConfig}
      filterValues={filterValues}
      onFilterChange={setFilterValues}
      showMapButton
      onMapClick={() => navigate("/services/map")}
      isLoading={false}
      isEmpty={filteredProviders.length === 0}
      emptyIcon={Wrench}
      emptyText={language === 'ru' ? 'Мастера не найдены' : 'No professionals found'}
    >
      <MiniAppQuickGrid items={quickItems} columns={4} className="mb-6" />
      
      <div className="grid gap-4">
        {filteredProviders.map((provider) => (
          <ItemCard
            key={provider.id}
            image={provider.image}
            title={language === 'ru' ? provider.nameRu : provider.name}
            subtitle={language === 'ru' ? provider.experienceRu : provider.experience}
            rating={provider.rating}
            reviewCount={provider.reviews}
            price={provider.price}
            priceUnit={language === 'ru' ? '/час' : '/hour'}
            currency="฿"
            location={language === 'ru' ? provider.locationRu : provider.location}
            isVerified={provider.verified}
            badge={provider.available 
              ? { text: language === 'ru' ? 'Доступен' : 'Available', className: 'bg-green-500 text-white' }
              : { text: language === 'ru' ? 'Занят' : 'Busy', className: 'bg-muted text-muted-foreground' }
            }
            tags={(language === 'ru' ? provider.servicesRu : provider.services).slice(0, 2)}
            onClick={() => navigate(`/services/provider/${provider.id}?category=${provider.category}`)}
          />
        ))}
      </div>
    </MiniAppLayout>
  );
}