import { useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import { ru, enUS } from "date-fns/locale";
import { useLanguage } from "@/contexts/LanguageContext";
import { useCart } from "@/contexts/CartContext";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
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
  PackageOpen,
  MessageSquareOff,
} from "lucide-react";
import { BackButton } from "@/components/uno/BackButton";
import { useCartToast } from "@/hooks/useCartToast";
import { PLACEHOLDER_IMAGES } from "@/lib/config/placeholders";
import { useProviderDetails } from "@/hooks/useProviderDetails";
import { useReviews } from "@/hooks/useReviews";

interface CartService {
  id: string;
  name: string;
  price: number;
  duration: string;
}

const ServiceProviderDetail = () => {
  const { language } = useLanguage();
  const isRu = language === "ru";
  const { addItem, removeItem, items } = useCart();
  const navigate = useNavigate();
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const { showAddedToast } = useCartToast();

  // Real DB data
  const { provider, services, isLoading } = useProviderDetails(id || null);
  const { reviews, stats, isLoading: reviewsLoading } = useReviews({
    itemType: "provider",
    itemId: id || "",
  });

  // Fallback name/category from query params if DB row missing
  const fallbackName = searchParams.get("name") || (isRu ? "Специалист" : "Specialist");
  const fallbackCategory = searchParams.get("category") || "";

  const providerName = provider?.name || fallbackName;
  const categoryName = provider?.business_category || fallbackCategory;
  const rating = Number(provider?.rating ?? stats.average ?? 0);
  const reviewCount = provider?.review_count ?? stats.total ?? 0;
  const isVerified = provider?.is_verified ?? false;
  const about = (isRu ? provider?.description_ru : provider?.description_en) || provider?.description_en || "";

  const servicesList = useMemo<CartService[]>(
    () =>
      (services ?? []).map((s) => ({
        id: s.id,
        name: (isRu ? s.name_ru : s.name_en) || s.name_en,
        price: Number(s.price ?? 0),
        duration: "",
      })),
    [services, isRu]
  );

  const badges = useMemo(() => {
    const list: { icon: typeof Shield; text: string }[] = [];
    if (provider?.is_verified) list.push({ icon: Shield, text: isRu ? "Проверен" : "Verified" });
    if ((provider as any)?.has_insurance) list.push({ icon: Award, text: isRu ? "Страховка" : "Insured" });
    if ((provider as any)?.response_time_minutes && (provider as any).response_time_minutes <= 30)
      list.push({ icon: Clock, text: isRu ? "Быстрый отклик" : "Fast Response" });
    return list;
  }, [provider, isRu]);

  const getServiceInCart = (serviceId: string) =>
    items.find((item) => item.id === serviceId && item.type === "service");

  const handleAddToCart = (service: CartService) => {
    const item = {
      id: service.id,
      type: "service" as const,
      name: service.name,
      nameRu: service.name,
      price: service.price,
      currency: "฿",
      providerId: id,
      providerName,
      options: service.duration ? { duration: service.duration } : undefined,
    };
    addItem(item);
    showAddedToast({ item });
  };

  const handleRemoveFromCart = (serviceId: string) => removeItem(serviceId);

  const servicesInCart = items.filter(
    (item) => item.type === "service" && item.providerId === id
  );

  if (isLoading) {
    return (
      <AppLayout>
        <div className="p-4 space-y-4">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-24 w-24 rounded-full" />
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-32" />
          <div className="space-y-3 mt-6">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-20 w-full" />
            ))}
          </div>
        </div>
      </AppLayout>
    );
  }

  if (!provider) {
    return (
      <AppLayout>
        <div className="p-6 text-center space-y-3">
          <BackButton fallbackPath="/services" />
          <p className="text-lg font-medium">{isRu ? "Мастер не найден" : "Provider not found"}</p>
          <p className="text-sm text-muted-foreground">
            {isRu
              ? "Возможно, профиль удалён или ссылка устарела."
              : "This profile may have been removed or the link is outdated."}
          </p>
          <Button onClick={() => navigate("/services")}>
            {isRu ? "К списку мастеров" : "Browse providers"}
          </Button>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="pb-32">
        {/* Header */}
        <div className="relative">
          <BackButton fallbackPath="/services" variant="overlay" className="absolute top-4 left-4 z-10" />
          <div className="h-32 bg-gradient-to-br from-primary to-primary" />
          <div className="absolute -bottom-12 left-4">
            <div className="relative">
              <img
                src={provider.logo_url || provider.cover_image || PLACEHOLDER_IMAGES.provider}
                alt={providerName}
                className="w-24 h-24 rounded-full border-4 border-background object-cover"
              />
              {provider.is_active && (
                <div className="absolute bottom-1 right-1 w-6 h-6 bg-success rounded-full border-2 border-background flex items-center justify-center">
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
                <h1 className="text-xl font-bold">{providerName}</h1>
                {isVerified && <CheckCircle2 className="w-5 h-5 text-primary" />}
              </div>
              {categoryName && <p className="text-muted-foreground">{categoryName}</p>}
            </div>
            {provider.is_active && (
              <Badge variant="default" className="bg-success">
                {isRu ? "Доступен" : "Available"}
              </Badge>
            )}
          </div>

          {/* Stats */}
          <div className="flex items-center gap-4 mt-3 text-sm">
            <div className="flex items-center gap-1">
              <Star className="w-4 h-4 fill-accent text-accent" />
              <span className="font-semibold">{rating.toFixed(1)}</span>
              <span className="text-muted-foreground">
                ({reviewCount} {isRu ? "отзывов" : "reviews"})
              </span>
            </div>
            {(provider as any)?.response_time_minutes && (
              <div className="flex items-center gap-1 text-muted-foreground">
                <Clock className="w-4 h-4" />
                <span>
                  {isRu
                    ? `Ответ за ${(provider as any).response_time_minutes} мин`
                    : `Responds in ${(provider as any).response_time_minutes} min`}
                </span>
              </div>
            )}
          </div>

          {provider.address && (
            <div className="flex items-center gap-1 mt-2 text-sm text-muted-foreground">
              <MapPin className="w-4 h-4" />
              <span>{provider.address}</span>
            </div>
          )}

          {/* Badges */}
          {badges.length > 0 && (
            <div className="flex gap-2 mt-4 flex-wrap">
              {badges.map((badge, idx) => {
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
          )}

          {/* Quick Actions */}
          <div className="flex gap-3 mt-4">
            {provider.phone && (
              <Button variant="outline" className="flex-1 gap-2" asChild>
                <a href={`tel:${provider.phone}`}>
                  <Phone className="w-4 h-4" />
                  {isRu ? "Позвонить" : "Call"}
                </a>
              </Button>
            )}
            <Button variant="outline" className="flex-1 gap-2">
              <MessageCircle className="w-4 h-4" />
              {isRu ? "Написать" : "Message"}
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
              {isRu ? "Услуги" : "Services"}
            </TabsTrigger>
            <TabsTrigger
              value="about"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-3"
            >
              {isRu ? "О мастере" : "About"}
            </TabsTrigger>
            <TabsTrigger
              value="reviews"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-3"
            >
              {isRu ? "Отзывы" : "Reviews"}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="services" className="mt-0 px-4 py-4">
            {servicesList.length === 0 ? (
              <EmptyState
                icon={PackageOpen}
                title={isRu ? "Мастер ещё не добавил услуги" : "No services yet"}
                hint={isRu ? "Загляните позже или напишите напрямую" : "Check back later or message directly"}
              />
            ) : (
              <div className="space-y-3">
                {servicesList.map((service) => {
                  const inCart = getServiceInCart(service.id);
                  return (
                    <div
                      key={service.id}
                      className={`relative overflow-hidden p-4 rounded-none border transition-all ${
                        inCart ? "border-primary bg-primary/5" : "border-border bg-card"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h3 className="font-medium">{service.name}</h3>
                          {service.duration && (
                            <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                              <Clock className="w-3 h-3" />
                              <span>{service.duration}</span>
                            </div>
                          )}
                          <p className="font-bold text-primary mt-1">฿{service.price}</p>
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
                              {isRu ? "В корзину" : "Add"}
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </TabsContent>

          <TabsContent value="about" className="mt-0 px-4 py-4">
            <div className="space-y-4">
              {about ? (
                <p className="text-muted-foreground leading-relaxed">{about}</p>
              ) : (
                <p className="text-sm text-muted-foreground italic">
                  {isRu ? "Мастер пока не добавил описание." : "No description yet."}
                </p>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-card rounded-none border border-border">
                  <p className="text-2xl font-bold text-primary">{reviewCount}</p>
                  <p className="text-sm text-muted-foreground">
                    {isRu ? "Отзывов" : "Reviews"}
                  </p>
                </div>
                <div className="p-4 bg-card rounded-none border border-border">
                  <p className="text-2xl font-bold text-primary">{rating.toFixed(1)}</p>
                  <p className="text-sm text-muted-foreground">
                    {isRu ? "Средний рейтинг" : "Average rating"}
                  </p>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="reviews" className="mt-0 px-4 py-4">
            {reviewsLoading ? (
              <div className="space-y-3">
                {[1, 2].map((i) => (
                  <Skeleton key={i} className="h-24 w-full" />
                ))}
              </div>
            ) : reviews.length === 0 ? (
              <EmptyState
                icon={MessageSquareOff}
                title={isRu ? "Пока нет отзывов" : "No reviews yet"}
                hint={isRu ? "Станьте первым после бронирования" : "Be the first after your booking"}
              />
            ) : (
              <div className="space-y-4">
                {reviews.map((review) => (
                  <div key={review.id} className="p-4 bg-card rounded-none border border-border">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">
                        {review.profile?.full_name || (isRu ? "Гость" : "Guest")}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        {formatDistanceToNow(new Date(review.created_at), {
                          addSuffix: true,
                          locale: isRu ? ru : enUS,
                        })}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 mb-2">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-4 h-4 ${
                            i < review.rating ? "fill-accent text-accent" : "text-muted-foreground"
                          }`}
                        />
                      ))}
                    </div>
                    {review.title && <p className="text-sm font-medium mb-1">{review.title}</p>}
                    {review.content && (
                      <p className="text-sm text-muted-foreground">{review.content}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Bottom CTA */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-background border-t border-border space-y-2">
        {servicesInCart.length > 0 && (
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-muted-foreground">
              {isRu
                ? `Услуг в корзине: ${servicesInCart.length}`
                : `Services in cart: ${servicesInCart.length}`}
            </span>
            <span className="font-bold text-primary">
              ฿{servicesInCart.reduce((sum, item) => sum + item.price * item.quantity, 0)}
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
              {isRu ? "Корзина" : "Cart"}
            </Button>
          )}
          <Button
            onClick={() => navigate(`/services/booking/${id}`)}
            className={`h-14 text-lg font-semibold gap-2 ${
              servicesInCart.length > 0 ? "flex-1" : "w-full"
            }`}
          >
            <Calendar className="w-5 h-5" />
            {isRu ? "Забронировать" : "Book Now"}
          </Button>
        </div>
      </div>
    </AppLayout>
  );
};

const EmptyState = ({
  icon: Icon,
  title,
  hint,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  hint?: string;
}) => (
  <div className="py-12 flex flex-col items-center justify-center text-center text-muted-foreground">
    <Icon className="h-10 w-10 mb-3 opacity-60" />
    <p className="text-sm font-medium">{title}</p>
    {hint && <p className="text-xs mt-1">{hint}</p>}
  </div>
);

export default ServiceProviderDetail;
