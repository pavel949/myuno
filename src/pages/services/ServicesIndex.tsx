import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { AppLayout } from "@/components/layout/AppLayout";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Search, 
  Wrench, 
  Zap, 
  Droplets, 
  Sparkles, 
  Hammer, 
  PaintBucket,
  Wind,
  Key,
  Truck,
  Star,
  Clock,
  MapPin,
  CheckCircle2,
  Map
} from "lucide-react";
import { triggerRipple } from "@/hooks/useRipple";

const ServicesIndex = () => {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Read category from URL params on mount
  useEffect(() => {
    const categoryParam = searchParams.get('category');
    if (categoryParam) {
      setSelectedCategory(categoryParam);
    }
  }, [searchParams]);

  const categories = [
    { id: "water-delivery", icon: Droplets, name: language === "ru" ? "Доставка воды" : "Water Delivery", color: "from-cyan-500 to-blue-500" },
    { id: "plumbing", icon: Wrench, name: language === "ru" ? "Сантехник" : "Plumbing", color: "from-blue-500 to-indigo-500" },
    { id: "electrical", icon: Zap, name: language === "ru" ? "Электрик" : "Electrical", color: "from-yellow-500 to-orange-500" },
    { id: "cleaning", icon: Sparkles, name: language === "ru" ? "Уборка / Прачечная" : "Cleaning / Laundry", color: "from-green-500 to-emerald-500" },
    { id: "repair", icon: Hammer, name: language === "ru" ? "Ремонт" : "Repair", color: "from-stone-500 to-zinc-600" },
    { id: "painting", icon: PaintBucket, name: language === "ru" ? "Покраска" : "Painting", color: "from-purple-500 to-violet-500" },
    { id: "hvac", icon: Wind, name: language === "ru" ? "Кондиционеры" : "HVAC", color: "from-sky-500 to-blue-500" },
    { id: "moving", icon: Truck, name: language === "ru" ? "Переезд" : "Moving", color: "from-rose-500 to-red-500" },
    { id: "locksmith", icon: Key, name: language === "ru" ? "Слесарь" : "Locksmith", color: "from-slate-500 to-zinc-600" },
    { id: "road-assistance", icon: Truck, name: language === "ru" ? "Помощь на дороге" : "Road Assistance", color: "from-amber-500 to-orange-500" },
  ];

  const providers = [
    {
      id: "srv-water-1",
      name: language === "ru" ? "Аква Доставка" : "Aqua Delivery",
      category: "water-delivery",
      rating: 4.9,
      reviews: 234,
      experience: language === "ru" ? "5 лет на рынке" : "5 years in business",
      price: 150,
      currency: "฿",
      priceUnit: language === "ru" ? "/бутыль" : "/bottle",
      location: language === "ru" ? "Весь Пхукет" : "All Phuket",
      available: true,
      verified: true,
      image: "https://images.unsplash.com/photo-1548839140-29a749e1cf4d?w=200&h=200&fit=crop",
      services: language === "ru" 
        ? ["Питьевая вода 19л", "Доставка в день заказа", "Аренда кулера"]
        : ["19L drinking water", "Same day delivery", "Cooler rental"],
    },
    {
      id: "srv-water-2",
      name: language === "ru" ? "Чистая Вода" : "Pure Water",
      category: "water-delivery",
      rating: 4.8,
      reviews: 189,
      experience: language === "ru" ? "Бесплатная доставка" : "Free delivery",
      price: 120,
      currency: "฿",
      priceUnit: language === "ru" ? "/бутыль" : "/bottle",
      location: language === "ru" ? "Патонг, Карон, Ката" : "Patong, Karon, Kata",
      available: true,
      verified: true,
      image: "https://images.unsplash.com/photo-1559839914-17aae19cec71?w=200&h=200&fit=crop",
      services: language === "ru"
        ? ["Артезианская вода", "Минеральная вода", "Подписка со скидкой"]
        : ["Artesian water", "Mineral water", "Subscription discount"],
    },
    {
      id: "srv-1",
      name: language === "ru" ? "Алексей Мастеров" : "Alex Masters",
      category: "plumbing",
      priceUnit: language === "ru" ? "/час" : "/hour",
      location: language === "ru" ? "Центр" : "Downtown",
      available: true,
      verified: true,
      image: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=200&h=200&fit=crop",
      services: language === "ru" 
        ? ["Установка сантехники", "Ремонт труб", "Прочистка канализации"]
        : ["Plumbing installation", "Pipe repair", "Drain cleaning"],
    },
    {
      id: "srv-2",
      name: language === "ru" ? "Игорь Электриков" : "Igor Electrician",
      category: "electrical",
      rating: 4.8,
      reviews: 203,
      experience: language === "ru" ? "15 лет опыта" : "15 years exp.",
      price: 2000,
      currency: "₽",
      priceUnit: language === "ru" ? "/час" : "/hour",
      location: language === "ru" ? "Весь город" : "City-wide",
      available: true,
      verified: true,
      image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop",
      services: language === "ru"
        ? ["Электромонтаж", "Замена проводки", "Установка розеток"]
        : ["Electrical installation", "Rewiring", "Outlet installation"],
    },
    {
      id: "srv-3",
      name: language === "ru" ? "Чистый Дом" : "Clean House",
      category: "cleaning",
      rating: 4.7,
      reviews: 312,
      experience: language === "ru" ? "Команда из 20+ человек" : "Team of 20+ people",
      price: 3000,
      currency: "₽",
      priceUnit: language === "ru" ? "/уборка" : "/cleaning",
      location: language === "ru" ? "Весь город" : "City-wide",
      available: true,
      verified: true,
      image: "https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=200&h=200&fit=crop",
      services: language === "ru"
        ? ["Генеральная уборка", "Поддерживающая уборка", "Мытьё окон"]
        : ["Deep cleaning", "Maintenance cleaning", "Window washing"],
    },
    {
      id: "srv-4",
      name: language === "ru" ? "Мастер Ремонта" : "Repair Master",
      category: "repair",
      rating: 4.6,
      reviews: 89,
      experience: language === "ru" ? "8 лет опыта" : "8 years exp.",
      price: 1800,
      currency: "₽",
      priceUnit: language === "ru" ? "/час" : "/hour",
      location: language === "ru" ? "Север города" : "North side",
      available: false,
      verified: true,
      image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop",
      services: language === "ru"
        ? ["Сборка мебели", "Мелкий ремонт", "Навеска полок"]
        : ["Furniture assembly", "Minor repairs", "Shelf mounting"],
    },
    {
      id: "srv-5",
      name: language === "ru" ? "Краски и Стены" : "Paint & Walls",
      category: "painting",
      rating: 4.9,
      reviews: 67,
      experience: language === "ru" ? "12 лет опыта" : "12 years exp.",
      price: 500,
      currency: "₽",
      priceUnit: language === "ru" ? "/м²" : "/m²",
      location: language === "ru" ? "Юг города" : "South side",
      available: true,
      verified: false,
      image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=200&h=200&fit=crop",
      services: language === "ru"
        ? ["Покраска стен", "Поклейка обоев", "Декоративная штукатурка"]
        : ["Wall painting", "Wallpaper", "Decorative plaster"],
    },
    {
      id: "srv-6",
      name: language === "ru" ? "Климат Сервис" : "Climate Service",
      category: "hvac",
      rating: 4.8,
      reviews: 145,
      experience: language === "ru" ? "6 лет опыта" : "6 years exp.",
      price: 3500,
      currency: "₽",
      priceUnit: language === "ru" ? "/установка" : "/installation",
      location: language === "ru" ? "Весь город" : "City-wide",
      available: true,
      verified: true,
      image: "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=200&h=200&fit=crop",
      services: language === "ru"
        ? ["Установка кондиционеров", "Чистка и заправка", "Ремонт"]
        : ["AC installation", "Cleaning & refill", "Repair"],
    },
  ];

  const filteredProviders = providers.filter((provider) => {
    const matchesSearch = provider.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      provider.services.some(s => s.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = !selectedCategory || provider.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <AppLayout title={language === "ru" ? "Домашние услуги" : "Home Services"} showBottomNav={false}>
      <div className="p-4 space-y-6 pb-24">
        {/* Search + Map Button */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
            <Input
              placeholder={language === "ru" ? "Найти услугу или мастера..." : "Find service or professional..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-12 rounded-xl bg-card border-border"
            />
          </div>
          <Button
            variant="outline"
            size="icon"
            className="h-12 w-12 rounded-xl"
            onClick={() => navigate("/services/map")}
          >
            <Map className="w-5 h-5" />
          </Button>
        </div>

        {/* Categories */}
        <div>
          <h2 className="text-lg font-semibold mb-3">
            {language === "ru" ? "Категории" : "Categories"}
          </h2>
          <div className="grid grid-cols-4 gap-3">
            {categories.map((category) => {
              const Icon = category.icon;
              const isSelected = selectedCategory === category.id;
              return (
                <button
                  key={category.id}
                  onClick={(e) => {
                    triggerRipple(e);
                    setSelectedCategory(isSelected ? null : category.id);
                  }}
                  className={`relative overflow-hidden flex flex-col items-center p-3 rounded-xl transition-all active:scale-95 ${
                    isSelected 
                      ? `bg-gradient-to-br ${category.color} text-white shadow-lg` 
                      : "bg-card border border-border hover:border-primary/50"
                  }`}
                >
                  <Icon className="w-6 h-6 mb-1" />
                  <span className="text-xs font-medium text-center leading-tight truncate w-full">
                    {category.name}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Available Providers */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold">
              {language === "ru" ? "Доступные мастера" : "Available Professionals"}
            </h2>
            <span className="text-sm text-muted-foreground">
              {filteredProviders.length} {language === "ru" ? "найдено" : "found"}
            </span>
          </div>
          
          <div className="space-y-3">
            {filteredProviders.map((provider) => (
              <div
                key={provider.id}
                onClick={(e) => {
                  triggerRipple(e);
                  navigate(`/services/provider/${provider.id}`);
                }}
                className="relative overflow-hidden bg-card border border-border rounded-xl p-4 cursor-pointer hover:border-primary/50 transition-all active:scale-[0.98]"
              >
                <div className="flex gap-4">
                  {/* Avatar */}
                  <div className="relative">
                    <img
                      src={provider.image}
                      alt={provider.name}
                      className="w-16 h-16 rounded-full object-cover"
                    />
                    {provider.available && (
                      <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-2 border-card flex items-center justify-center">
                        <div className="w-2 h-2 bg-white rounded-full" />
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold truncate">{provider.name}</h3>
                        {provider.verified && (
                          <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0" />
                        )}
                      </div>
                      <Badge variant={provider.available ? "default" : "secondary"} className="flex-shrink-0">
                        {provider.available 
                          ? (language === "ru" ? "Доступен" : "Available")
                          : (language === "ru" ? "Занят" : "Busy")
                        }
                      </Badge>
                    </div>

                    <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                        <span>{provider.rating}</span>
                        <span>({provider.reviews})</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>{provider.experience}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 mt-1 text-sm text-muted-foreground">
                      <MapPin className="w-3 h-3" />
                      <span>{provider.location}</span>
                    </div>

                    <div className="flex flex-wrap gap-1 mt-2">
                      {provider.services.slice(0, 2).map((service, idx) => (
                        <Badge key={idx} variant="outline" className="text-xs">
                          {service}
                        </Badge>
                      ))}
                      {provider.services.length > 2 && (
                        <Badge variant="outline" className="text-xs">
                          +{provider.services.length - 2}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>

                {/* Price */}
                <div className="mt-3 pt-3 border-t border-border flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    {language === "ru" ? "от" : "from"}
                  </span>
                  <span className="text-lg font-bold text-primary">
                    {provider.currency}{provider.price}{provider.priceUnit}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default ServicesIndex;
