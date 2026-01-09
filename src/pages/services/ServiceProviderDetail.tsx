import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
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
  ChevronRight,
} from "lucide-react";
import { triggerRipple } from "@/hooks/useRipple";

const ServiceProviderDetail = () => {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const { id } = useParams();
  const [selectedService, setSelectedService] = useState<string | null>(null);

  // Mock provider data
  const provider = {
    id: id,
    name: language === "ru" ? "Алексей Мастеров" : "Alex Masters",
    category: "plumbing",
    categoryName: language === "ru" ? "Сантехник" : "Plumber",
    rating: 4.9,
    reviews: 156,
    experience: language === "ru" ? "10 лет опыта" : "10 years experience",
    completedJobs: 1250,
    location: language === "ru" ? "Центр города, выезд по всему городу" : "Downtown, city-wide service",
    available: true,
    verified: true,
    responseTime: language === "ru" ? "Отвечает за 15 мин" : "Responds in 15 min",
    image: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400&h=400&fit=crop",
    about: language === "ru"
      ? "Профессиональный сантехник с 10-летним опытом работы. Выполняю все виды сантехнических работ: установка, ремонт, замена. Работаю быстро и качественно. Гарантия на все работы."
      : "Professional plumber with 10 years of experience. I perform all types of plumbing work: installation, repair, replacement. Fast and quality work. Warranty on all services.",
    servicesList: [
      { id: "s1", name: language === "ru" ? "Установка смесителя" : "Faucet installation", price: 1500, duration: "1 час" },
      { id: "s2", name: language === "ru" ? "Замена труб" : "Pipe replacement", price: 3000, duration: "2-4 часа" },
      { id: "s3", name: language === "ru" ? "Прочистка канализации" : "Drain cleaning", price: 2000, duration: "1-2 часа" },
      { id: "s4", name: language === "ru" ? "Установка унитаза" : "Toilet installation", price: 2500, duration: "2 часа" },
      { id: "s5", name: language === "ru" ? "Ремонт протечек" : "Leak repair", price: 1000, duration: "30 мин - 1 час" },
      { id: "s6", name: language === "ru" ? "Установка водонагревателя" : "Water heater installation", price: 4000, duration: "3 часа" },
    ],
    reviewsList: [
      {
        id: "r1",
        author: language === "ru" ? "Мария К." : "Maria K.",
        rating: 5,
        date: "2 дня назад",
        text: language === "ru" 
          ? "Отличный мастер! Приехал вовремя, всё сделал быстро и качественно. Рекомендую!"
          : "Excellent professional! Arrived on time, did everything quickly and efficiently. Recommended!",
      },
      {
        id: "r2",
        author: language === "ru" ? "Андрей П." : "Andrew P.",
        rating: 5,
        date: "1 неделю назад",
        text: language === "ru"
          ? "Заменил старые трубы на новые. Работа выполнена аккуратно, мусор убрал за собой."
          : "Replaced old pipes with new ones. Work done neatly, cleaned up after himself.",
      },
      {
        id: "r3",
        author: language === "ru" ? "Елена С." : "Elena S.",
        rating: 4,
        date: "2 недели назад",
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
    <AppLayout title={provider.name} showBottomNav={false}>
      <div className="pb-32">
        {/* Header */}
        <div className="relative">
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
              {provider.servicesList.map((service) => (
                <div
                  key={service.id}
                  onClick={(e) => {
                    triggerRipple(e);
                    setSelectedService(selectedService === service.id ? null : service.id);
                  }}
                  className={`relative overflow-hidden p-4 rounded-xl border cursor-pointer transition-all active:scale-[0.98] ${
                    selectedService === service.id
                      ? "border-primary bg-primary/5"
                      : "border-border bg-card hover:border-primary/50"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium">{service.name}</h3>
                      <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                        <Clock className="w-3 h-3" />
                        <span>{service.duration}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-primary">₽{service.price}</p>
                      <ChevronRight className={`w-5 h-5 text-muted-foreground ml-auto transition-transform ${
                        selectedService === service.id ? "rotate-90" : ""
                      }`} />
                    </div>
                  </div>
                </div>
              ))}
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
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-background border-t border-border">
        <Button
          onClick={() => navigate(`/services/booking/${id}`)}
          className="w-full h-14 text-lg font-semibold gap-2"
        >
          <Calendar className="w-5 h-5" />
          {language === "ru" ? "Забронировать" : "Book Now"}
        </Button>
      </div>
    </AppLayout>
  );
};

export default ServiceProviderDetail;
