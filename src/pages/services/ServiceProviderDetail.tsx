import { useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { useCart } from "@/contexts/CartContext";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Star,
  Clock,
  MapPin,
  Phone,
  MessageCircle,
  CheckCircle2,
  Shield,
  Award,
  Calendar,
  ShoppingBag,
  Plus,
  Minus,
} from "lucide-react";
import { BackButton } from "@/components/uno/BackButton";
import { useCartToast } from "@/hooks/useCartToast";

// Services data by category
const getServicesByCategory = (category: string, language: string) => {
  const servicesData: Record<string, Array<{ id: string; name: string; price: number; duration: string }>> = {
    "plumbing": [
      { id: "s1", name: language === "ru" ? "Установка смесителя" : "Faucet installation", price: 1500, duration: language === "ru" ? "1 час" : "1 hour" },
      { id: "s2", name: language === "ru" ? "Замена труб" : "Pipe replacement", price: 3000, duration: language === "ru" ? "2-4 часа" : "2-4 hours" },
      { id: "s3", name: language === "ru" ? "Прочистка канализации" : "Drain cleaning", price: 2000, duration: language === "ru" ? "1-2 часа" : "1-2 hours" },
      { id: "s4", name: language === "ru" ? "Установка унитаза" : "Toilet installation", price: 2500, duration: language === "ru" ? "2 часа" : "2 hours" },
    ],
    "electrical": [
      { id: "s1", name: language === "ru" ? "Замена розетки" : "Socket replacement", price: 500, duration: language === "ru" ? "30 мин" : "30 min" },
      { id: "s2", name: language === "ru" ? "Установка люстры" : "Chandelier installation", price: 1000, duration: language === "ru" ? "1 час" : "1 hour" },
      { id: "s3", name: language === "ru" ? "Прокладка проводки" : "Wiring", price: 3000, duration: language === "ru" ? "2-4 часа" : "2-4 hours" },
      { id: "s4", name: language === "ru" ? "Установка автоматов" : "Circuit breaker installation", price: 1500, duration: language === "ru" ? "1 час" : "1 hour" },
    ],
    "road-assistance": [
      { id: "s1", name: language === "ru" ? "Эвакуатор" : "Tow truck", price: 2000, duration: language === "ru" ? "30-60 мин" : "30-60 min" },
      { id: "s2", name: language === "ru" ? "Запуск аккумулятора" : "Jump start", price: 500, duration: language === "ru" ? "15-30 мин" : "15-30 min" },
      { id: "s3", name: language === "ru" ? "Замена колеса" : "Tire change", price: 400, duration: language === "ru" ? "20 мин" : "20 min" },
      { id: "s4", name: language === "ru" ? "Подвоз топлива" : "Fuel delivery", price: 300, duration: language === "ru" ? "30 мин" : "30 min" },
      { id: "s5", name: language === "ru" ? "Вскрытие замков" : "Lockout service", price: 800, duration: language === "ru" ? "15-30 мин" : "15-30 min" },
      { id: "s6", name: language === "ru" ? "Буксировка" : "Towing", price: 1500, duration: language === "ru" ? "зависит от расстояния" : "depends on distance" },
    ],
    "ac": [
      { id: "s1", name: language === "ru" ? "Установка кондиционера" : "AC installation", price: 3500, duration: language === "ru" ? "3-4 часа" : "3-4 hours" },
      { id: "s2", name: language === "ru" ? "Чистка кондиционера" : "AC cleaning", price: 1000, duration: language === "ru" ? "1 час" : "1 hour" },
      { id: "s3", name: language === "ru" ? "Заправка фреоном" : "Freon refill", price: 1500, duration: language === "ru" ? "30 мин" : "30 min" },
      { id: "s4", name: language === "ru" ? "Ремонт кондиционера" : "AC repair", price: 2000, duration: language === "ru" ? "1-2 часа" : "1-2 hours" },
    ],
  };
  
  return servicesData[category] || servicesData["plumbing"];
};

const getCategoryName = (category: string, language: string) => {
  const names: Record<string, { ru: string; en: string }> = {
    "plumbing": { ru: "Сантехник", en: "Plumber" },
    "electrical": { ru: "Электрик", en: "Electrician" },
    "road-assistance": { ru: "Помощь на дороге", en: "Road Assistance" },
    "ac": { ru: "Кондиционеры", en: "AC Services" },
  };
  return language === "ru" ? names[category]?.ru || category : names[category]?.en || category;
};

const ServiceProviderDetail = () => {
  const { language } = useLanguage();
  const { addItem, removeItem, items } = useCart();
  const navigate = useNavigate();
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const category = searchParams.get("category") || "plumbing";
  const providerName = searchParams.get("name") || (language === "ru" ? "Специалист" : "Specialist");
  const [selectedService, setSelectedService] = useState<string | null>(null);
  const { showAddedToast } = useCartToast();

  const getServiceInCart = (serviceId: string) => {
    return items.find(item => item.id === serviceId && item.type === 'service');
  };

  const handleAddToCart = (service: { id: string; name: string; price: number; duration: string }) => {
    const item = {
      id: service.id,
      type: 'service' as const,
      name: service.name,
      nameRu: service.name,
      price: service.price,
      currency: '฿',
      providerId: id,
      providerName: providerName,
      options: { duration: service.duration }
    };
    addItem(item);
    showAddedToast({ item });
  };

  const handleRemoveFromCart = (serviceId: string) => {
    removeItem(serviceId);
  };

  const servicesInCart = items.filter(item => item.type === 'service' && item.providerId === id);

  // Dynamic provider data based on category
  const provider = {
    id: id,
    name: providerName,
    category: category,
    categoryName: getCategoryName(category, language),
    rating: 4.9,
    reviews: 156,
    experience: language === "ru" ? "Опытный специалист" : "Experienced specialist",
    completedJobs: 1250,
    location: language === "ru" ? "Весь Пхукет" : "All Phuket",
    available: true,
    verified: true,
    responseTime: language === "ru" ? "Отвечает за 15 мин" : "Responds in 15 min",
    image: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400&h=400&fit=crop",
    about: language === "ru"
      ? "Профессионал с многолетним опытом работы. Выполняю все виды работ в своей сфере. Работаю быстро и качественно. Гарантия на все услуги."
      : "Professional with years of experience. I perform all types of work in my field. Fast and quality work. Warranty on all services.",
    servicesList: getServicesByCategory(category, language),
    reviewsList: [
      {
        id: "r1",
        author: language === "ru" ? "Мария К." : "Maria K.",
        rating: 5,
        date: language === "ru" ? "2 дня назад" : "2 days ago",
        text: language === "ru" 
          ? "Отличный специалист! Приехал вовремя, всё сделал быстро и качественно. Рекомендую!"
          : "Excellent professional! Arrived on time, did everything quickly and efficiently. Recommended!",
      },
      {
        id: "r2",
        author: language === "ru" ? "Андрей П." : "Andrew P.",
        rating: 5,
        date: language === "ru" ? "1 неделю назад" : "1 week ago",
        text: language === "ru"
          ? "Быстро приехал и решил проблему. Очень доволен работой."
          : "Arrived quickly and solved the problem. Very satisfied with the work.",
      },
      {
        id: "r3",
        author: language === "ru" ? "Елена С." : "Elena S.",
        rating: 4,
        date: language === "ru" ? "2 недели назад" : "2 weeks ago",
        text: language === "ru"
          ? "Хороший специалист, но немного задержался. В остальном всё отлично."
          : "Good specialist, but was a bit late. Otherwise everything is great.",
      },
    ],
    badges: [
      { icon: Shield, text: language === "ru" ? "Проверен" : "Verified" },
      { icon: Award, text: language === "ru" ? "Топ мастер" : "Top Pro" },
      { icon: Clock, text: language === "ru" ? "Быстрый отклик" : "Fast Response" },
    ],
  };

  return (
    <AppLayout>
      <div className="pb-32">
        {/* Header */}
        <div className="relative">
          <BackButton fallbackPath="/services" variant="overlay" className="absolute top-4 left-4 z-10" />
          <div className="h-32 bg-gradient-to-br from-blue-500 to-cyan-500" />
          <div className="absolute -bottom-12 left-4">
            <div className="relative">
              <img
                src={provider.image}
                alt={provider.name}
                className="w-24 h-24 rounded-full border-4 border-background object-cover"
              />
              {provider.available && (
                <div className="absolute bottom-1 right-1 w-6 h-6 bg-green-500 rounded-full border-2 border-background flex items-center justify-center">
                  <div className="w-2.5 h-2.5 bg-white rounded-full" />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Profile Info */}
        <div className="pt-14 px-4">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold">{provider.name}</h1>
                {provider.verified && (
                  <CheckCircle2 className="w-5 h-5 text-primary" />
                )}
              </div>
              <p className="text-muted-foreground">{provider.categoryName}</p>
            </div>
            <Badge variant="default" className="bg-green-500">
              {language === "ru" ? "Доступен" : "Available"}
            </Badge>
          </div>

          {/* Stats */}
          <div className="flex items-center gap-4 mt-3 text-sm">
            <div className="flex items-center gap-1">
              <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
              <span className="font-semibold">{provider.rating}</span>
              <span className="text-muted-foreground">({provider.reviewsList.length} отзывов)</span>
            </div>
            <div className="flex items-center gap-1 text-muted-foreground">
              <Clock className="w-4 h-4" />
              <span>{provider.experience}</span>
            </div>
          </div>

          <div className="flex items-center gap-1 mt-2 text-sm text-muted-foreground">
            <MapPin className="w-4 h-4" />
            <span>{provider.location}</span>
          </div>

          {/* Badges */}
          <div className="flex gap-2 mt-4">
            {provider.badges.map((badge, idx) => {
              const Icon = badge.icon;
              return (
                <div
                  key={idx}
                  className="flex items-center gap-1 px-3 py-1.5 bg-primary/10 text-primary rounded-full text-xs font-medium"
                >
                  <Icon className="w-3 h-3" />
                  <span>{badge.text}</span>
                </div>
              );
            })}
          </div>

          {/* Quick Actions */}
          <div className="flex gap-3 mt-4">
            <Button variant="outline" className="flex-1 gap-2">
              <Phone className="w-4 h-4" />
              {language === "ru" ? "Позвонить" : "Call"}
            </Button>
            <Button variant="outline" className="flex-1 gap-2">
              <MessageCircle className="w-4 h-4" />
              {language === "ru" ? "Написать" : "Message"}
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="services" className="mt-6">
          <TabsList className="w-full justify-start px-4 bg-transparent border-b border-border rounded-none h-auto p-0">
            <TabsTrigger 
              value="services"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-3"
            >
              {language === "ru" ? "Услуги" : "Services"}
            </TabsTrigger>
            <TabsTrigger 
              value="about"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-3"
            >
              {language === "ru" ? "О мастере" : "About"}
            </TabsTrigger>
            <TabsTrigger 
              value="reviews"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-3"
            >
              {language === "ru" ? "Отзывы" : "Reviews"}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="services" className="mt-0 px-4 py-4">
            <div className="space-y-3">
              {provider.servicesList.map((service) => {
                const inCart = getServiceInCart(service.id);
                return (
                  <div
                    key={service.id}
                    className={`relative overflow-hidden p-4 rounded-xl border transition-all ${
                      inCart
                        ? "border-primary bg-primary/5"
                        : "border-border bg-card"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h3 className="font-medium">{service.name}</h3>
                        <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                          <Clock className="w-3 h-3" />
                          <span>{service.duration}</span>
                        </div>
                        <p className="font-bold text-primary mt-1">₽{service.price}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {inCart ? (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleRemoveFromCart(service.id)}
                            className="h-10 px-3 border-destructive text-destructive hover:bg-destructive/10"
                          >
                            <Minus className="w-4 h-4" />
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            onClick={() => handleAddToCart(service)}
                            className="h-10 px-3"
                          >
                            <Plus className="w-4 h-4 mr-1" />
                            {language === "ru" ? "В корзину" : "Add"}
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </TabsContent>

          <TabsContent value="about" className="mt-0 px-4 py-4">
            <div className="space-y-4">
              <p className="text-muted-foreground leading-relaxed">
                {provider.about}
              </p>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-card rounded-xl border border-border">
                  <p className="text-2xl font-bold text-primary">{provider.completedJobs}</p>
                  <p className="text-sm text-muted-foreground">
                    {language === "ru" ? "Выполнено заказов" : "Completed jobs"}
                  </p>
                </div>
                <div className="p-4 bg-card rounded-xl border border-border">
                  <p className="text-2xl font-bold text-primary">{provider.rating}</p>
                  <p className="text-sm text-muted-foreground">
                    {language === "ru" ? "Средний рейтинг" : "Average rating"}
                  </p>
                </div>
              </div>

              <div className="p-4 bg-green-500/10 rounded-xl">
                <p className="text-sm text-green-600 font-medium">
                  {provider.responseTime}
                </p>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="reviews" className="mt-0 px-4 py-4">
            <div className="space-y-4">
              {provider.reviewsList.map((review) => (
                <div key={review.id} className="p-4 bg-card rounded-xl border border-border">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">{review.author}</span>
                    <span className="text-sm text-muted-foreground">{review.date}</span>
                  </div>
                  <div className="flex items-center gap-1 mb-2">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-4 h-4 ${
                          i < review.rating
                            ? "fill-yellow-400 text-yellow-400"
                            : "text-muted-foreground"
                        }`}
                      />
                    ))}
                  </div>
                  <p className="text-sm text-muted-foreground">{review.text}</p>
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Bottom CTA */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-background border-t border-border space-y-2">
        {servicesInCart.length > 0 && (
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-muted-foreground">
              {language === "ru" ? `Услуг в корзине: ${servicesInCart.length}` : `Services in cart: ${servicesInCart.length}`}
            </span>
            <span className="font-bold text-primary">
              ₽{servicesInCart.reduce((sum, item) => sum + item.price * item.quantity, 0)}
            </span>
          </div>
        )}
        <div className="flex gap-2">
          {servicesInCart.length > 0 && (
            <Button
              variant="outline"
              onClick={() => navigate("/cart")}
              className="flex-1 h-14 text-lg font-semibold gap-2"
            >
              <ShoppingBag className="w-5 h-5" />
              {language === "ru" ? "Корзина" : "Cart"}
            </Button>
          )}
          <Button
            onClick={() => navigate(`/services/booking/${id}`)}
            className={`h-14 text-lg font-semibold gap-2 ${servicesInCart.length > 0 ? 'flex-1' : 'w-full'}`}
          >
            <Calendar className="w-5 h-5" />
            {language === "ru" ? "Забронировать" : "Book Now"}
          </Button>
        </div>
      </div>
    </AppLayout>
  );
};

export default ServiceProviderDetail;
