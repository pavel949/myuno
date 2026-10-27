import '@/styles/premium-services.css';
import { pickLang } from '@/lib/i18n/pickLang';
import { servicePriceLabel } from '@/lib/services/servicePresentation';
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
  Building2,
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
import { useProviderDetails } from "@/hooks/useProviderDetails";
import { useReviews } from "@/hooks/useReviews";
import { ServiceBookingSheet, type BookableService } from "@/components/services/ServiceBookingSheet";

import { serviceCatalogueReturnTo } from '@/lib/services/serviceNavigation';

interface CartService {
  id: string;
  name: string;
  price: number | null;
  currency: string | null;
  duration: string;
}

const ServiceProviderDetail = () => {
  const { language } = useLanguage();
  const isRu = language === "ru";
  const text = (ru: string, en: string, th: string) => pickLang(language, { ru, en, th });
  const { addItem, removeItem, items } = useCart();
  const navigate = useNavigate();
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const returnTo = serviceCatalogueReturnTo(searchParams.get('returnTo'));
  const { showAddedToast } = useCartToast();
  const [booking, setBooking] = useState<BookableService | null>(null);
  const [failedAvatar, setFailedAvatar] = useState<string | null>(null);

  // Real DB data
  const { provider, services, isLoading, error, refetch } = useProviderDetails(id || null, 'public');
  const { reviews, stats, isLoading: reviewsLoading } = useReviews({
    itemType: "provider",
    itemId: id || "",
  });

  // Fallback name/category from query params if DB row missing
  const fallbackName = searchParams.get("name") || (pickLang(language, {"ru": "Специалист", "en": "Specialist", "th": "ผู้ให้บริการ"}));
  const fallbackCategory = searchParams.get("category") || "";

  const providerName = provider?.name || fallbackName;
  const avatar = provider?.logo_url || provider?.cover_image;
  const categoryName = provider?.business_category || fallbackCategory;
  const ratingValue = Number(provider?.rating ?? stats.average);
  const rating = Number.isFinite(ratingValue) && ratingValue > 0 && ratingValue <= 5 ? ratingValue : null;
  const reviewCount = provider?.review_count ?? stats.total ?? 0;
  const isVerified = provider?.is_verified ?? false;
  const about = (isRu ? provider?.description_ru : provider?.description_en) || provider?.description_en || "";

  const servicesList = useMemo<CartService[]>(
    () =>
      (services ?? []).map((s) => ({
        id: s.id,
        name: (isRu ? s.name_ru : s.name_en) || s.name_en,
        price: s.price != null && Number.isFinite(Number(s.price)) && Number(s.price) >= 0 ? Number(s.price) : null,
        currency: s.currency?.trim().toUpperCase() || null,
        duration: "",
      })),
    [services, isRu]
  );

  const badges = useMemo(() => {
    const list: { icon: typeof Shield; text: string }[] = [];
    if (provider?.is_verified) list.push({ icon: Shield, text: pickLang(language, {"ru": "Проверен", "en": "Verified", "th": "ยืนยันแล้ว"}) });
    if ((provider as any)?.has_insurance) list.push({ icon: Award, text: pickLang(language, {"ru": "Страховка", "en": "Insured", "th": "มีประกัน"}) });
    if ((provider as any)?.response_time_minutes && (provider as any).response_time_minutes <= 30)
      list.push({ icon: Clock, text: pickLang(language, {"ru": "Быстрый отклик", "en": "Fast Response", "th": "ตอบกลับเร็ว"}) });
    return list;
  }, [provider, language]);

  const getServiceInCart = (serviceId: string) =>
    items.find((item) => item.id === serviceId && item.type === "service");

  const handleAddToCart = (service: CartService) => {
    // The legacy cart checkout is THB-only. Other currencies retain the request path.
    if (service.price == null || service.currency !== 'THB') return;
    const item = {
      id: service.id,
      type: "service" as const,
      name: service.name,
      nameRu: service.name,
      price: service.price,
      currency: service.currency,
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
      <AppLayout usePageContainer={false}>
        <div className="premium-service-provider p-4 space-y-4" role="status" aria-label={text("Загружаем специалиста", "Loading provider", "กำลังโหลดผู้ให้บริการ")}>
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

  if (error) return <AppLayout usePageContainer={false}><div className="premium-service-provider space-y-4" role="alert"><h1 className="service-provider-title">{text('Не удалось загрузить специалиста', 'Could not load this provider', 'ไม่สามารถโหลดผู้ให้บริการได้')}</h1><p>{text('Попробуйте ещё раз. Параметры каталога сохранены.', 'Please try again. Your catalogue choices are kept.', 'กรุณาลองอีกครั้ง ระบบเก็บตัวเลือกการค้นหาไว้แล้ว')}</p><Button onClick={() => refetch()}>{text('Повторить', 'Try again', 'ลองอีกครั้ง')}</Button><Button variant="outline" onClick={() => navigate(returnTo)}>{text('К услугам', 'Back to services', 'กลับไปยังบริการ')}</Button></div></AppLayout>;

  if (!provider) {
    return (
      <AppLayout usePageContainer={false}>
        <div className="premium-service-provider p-6 text-center space-y-3">
          <BackButton fallbackPath={returnTo} />
          <h1 className="service-provider-title">{pickLang(language, {"ru": "Мастер не найден", "en": "Provider not found", "th": "ไม่พบผู้ให้บริการ"})}</h1>
          <p className="text-sm text-muted-foreground">
            {isRu
              ? "Возможно, профиль удалён или ссылка устарела."
              : "This profile may have been removed or the link is outdated."}
          </p>
          <Button onClick={() => navigate(returnTo)}>
            {pickLang(language, {"ru": "К списку мастеров", "en": "Browse providers", "th": "ดูผู้ให้บริการ"})}
          </Button>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout usePageContainer={false}>
      <div className="premium-service-provider">
        {/* Header */}
        <div className="relative">
          <BackButton fallbackPath={returnTo} variant="overlay" className="absolute top-4 left-4 z-10" />
          <div className="h-32 bg-gradient-to-br from-primary to-primary" />
          <div className="absolute -bottom-12 left-4">
            <div className="relative">
              {avatar && failedAvatar !== avatar ? <img
                src={avatar}
                alt={providerName}
                onError={() => setFailedAvatar(avatar)}
                className="w-24 h-24 rounded-full border-4 border-background object-cover"
              /> : <div className="flex w-24 h-24 items-center justify-center rounded-full border-4 border-background bg-muted"><Building2 className="h-8 w-8 text-muted-foreground" aria-hidden="true" /></div>}

            </div>
          </div>
        </div>

        {/* Profile Info */}
        <div className="pt-14 px-4">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="service-provider-title">{providerName}</h1>
                {isVerified && <CheckCircle2 className="w-5 h-5 text-primary" />}
              </div>
              {categoryName && <p className="text-muted-foreground">{categoryName}</p>}
            </div>

          </div>

          {/* Stats */}
          <div className="flex items-center gap-4 mt-3 text-sm">
            <div className="flex items-center gap-1">
              {rating !== null && reviewCount > 0 && <Star className="w-4 h-4 fill-accent text-accent" />}
              {rating !== null && reviewCount > 0 && <span className="font-semibold">{rating.toFixed(1)}</span>}
              <span className="text-muted-foreground">
                ({reviewCount} {pickLang(language, {"ru": "отзывов", "en": "reviews", "th": "รีวิว"})})
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
                  {pickLang(language, {"ru": "Позвонить", "en": "Call", "th": "โทร"})}
                </a>
              </Button>
            )}

          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="services" className="mt-6">
          <TabsList className="w-full justify-start px-4 bg-transparent border-b border-border rounded-none h-auto p-0">
            <TabsTrigger
              value="services"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-3"
            >
              {pickLang(language, {"ru": "Услуги", "en": "Services", "th": "บริการ"})}
            </TabsTrigger>
            <TabsTrigger
              value="about"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-3"
            >
              {pickLang(language, {"ru": "О мастере", "en": "About", "th": "เกี่ยวกับ"})}
            </TabsTrigger>
            <TabsTrigger
              value="reviews"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-3"
            >
              {pickLang(language, {"ru": "Отзывы", "en": "Reviews", "th": "รีวิว"})}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="services" className="mt-0 px-4 py-4">
            {servicesList.length === 0 ? (
              <EmptyState
                icon={PackageOpen}
                title={pickLang(language, {"ru": "Мастер ещё не добавил услуги", "en": "No services yet", "th": "ยังไม่มีบริการ"})}
                hint={pickLang(language, {"ru": "Загляните позже или напишите напрямую", "en": "Check back later or message directly", "th": "โปรดกลับมาดูอีกครั้งหรือติดต่อผู้ให้บริการ"})}
              />
            ) : (
              <div className="space-y-3">
                {servicesList.map((service) => {
                  const inCart = getServiceInCart(service.id);
                  return (
                    <div
                      key={service.id}
                      className={`service-provider-offer relative overflow-hidden p-4 rounded-none border transition-all ${
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
                          <p className="font-medium text-primary mt-1">{servicePriceLabel(service.price, service.currency, language)}</p>
                          {service.currency && service.currency !== 'THB' && <p className="mt-2 text-sm text-muted-foreground">{text('Оставьте заявку для уточнения условий. Корзина поддерживает THB.', 'Request the service to confirm terms. Cart checkout supports THB.', 'ส่งคำขอเพื่อยืนยันเงื่อนไข ตะกร้ารองรับ THB')}</p>}
                        </div>
                        <div className="flex items-center gap-2">
                          {id && (
                            <Button size="sm" variant="outline" className="h-10 px-3" onClick={() => {
                              const raw = (services ?? []).find((x) => x.id === service.id);
                              setBooking({ id: service.id, providerId: id, name: service.name, price: service.price, currency: service.currency, durationMinutes: raw?.duration_minutes ?? null, leadTimeHours: raw?.lead_time_hours ?? null });
                            }}>
                              <Calendar className="w-4 h-4 mr-1" />
                              {pickLang(language, {"ru": "Записаться", "en": "Book", "th": "ขอเวลารับบริการ"})}
                            </Button>
                          )}
                          {inCart ? (
                            <Button
                              size="sm"
                              variant="outline"
                              aria-label={isRu ? 'Удалить из корзины' : 'Remove from cart'}
                              onClick={() => handleRemoveFromCart(service.id)}
                              className="min-h-[44px] px-3 border-destructive text-destructive hover:bg-destructive/10"
                            >
                              <Minus className="w-4 h-4" />
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              disabled={service.price == null || service.currency !== 'THB'}
                              onClick={() => handleAddToCart(service)}
                              className="h-10 px-3"
                            >
                              <Plus className="w-4 h-4 mr-1" />
                              {pickLang(language, {"ru": "В корзину", "en": "Add", "th": "เพิ่ม"})}
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
          <ServiceBookingSheet service={booking} open={!!booking} onOpenChange={(o) => !o && setBooking(null)} />

          <TabsContent value="about" className="mt-0 px-4 py-4">
            <div className="space-y-4">
              {about ? (
                <p className="text-muted-foreground leading-relaxed">{about}</p>
              ) : (
                <p className="text-sm text-muted-foreground italic">
                  {pickLang(language, {"ru": "Мастер пока не добавил описание.", "en": "No description yet.", "th": "ยังไม่มีคำอธิบาย"})}
                </p>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-card rounded-none border border-border">
                  <p className="text-2xl font-bold text-primary">{reviewCount}</p>
                  <p className="text-sm text-muted-foreground">
                    {pickLang(language, {"ru": "Отзывов", "en": "Reviews", "th": "รีวิว"})}
                  </p>
                </div>
                <div className="p-4 bg-card rounded-none border border-border">
                  <p className="text-2xl font-bold text-primary">{rating !== null && reviewCount > 0 ? rating.toFixed(1) : text("Пока нет оценки", "Not rated yet", "ยังไม่มีคะแนน")}</p>
                  <p className="text-sm text-muted-foreground">
                    {pickLang(language, {"ru": "Средний рейтинг", "en": "Average rating", "th": "คะแนนเฉลี่ย"})}
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
                title={pickLang(language, {"ru": "Пока нет отзывов", "en": "No reviews yet", "th": "ยังไม่มีรีวิว"})}
                hint={pickLang(language, {"ru": "Станьте первым после бронирования", "en": "Be the first after your booking", "th": "รีวิวได้หลังใช้บริการ"})}
              />
            ) : (
              <div className="space-y-4">
                {reviews.map((review) => (
                  <div key={review.id} className="p-4 bg-card rounded-none border border-border">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">
                        {review.profile?.full_name || (pickLang(language, {"ru": "Гость", "en": "Guest", "th": "ผู้ใช้"}))}
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
      <div className="service-provider-actions p-4 bg-background border-t border-border space-y-2">
        {servicesInCart.length > 0 && (
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-muted-foreground">
              {isRu
                ? `Услуг в корзине: ${servicesInCart.length}`
                : `Services in cart: ${servicesInCart.length}`}
            </span>
            <span className="font-bold text-primary">
              {new Set(servicesInCart.map(item => item.currency)).size === 1 ? servicePriceLabel(servicesInCart.reduce((sum, item) => sum + item.price * item.quantity, 0), servicesInCart[0]?.currency, language) : text("Стоимость — в корзине", "View prices in cart", "ดูราคาในตะกร้า")}
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
              {pickLang(language, {"ru": "Корзина", "en": "Cart", "th": "ตะกร้า"})}
            </Button>
          )}
          <Button
            onClick={() => navigate(`/services/booking/${id}`)}
            className={`h-14 text-lg font-semibold gap-2 ${
              servicesInCart.length > 0 ? "flex-1" : "w-full"
            }`}
          >
            <Calendar className="w-5 h-5" />
            {text("Выбрать услуги", "Choose services", "เลือกบริการ")}
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
