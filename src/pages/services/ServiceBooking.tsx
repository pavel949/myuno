import { useState, useEffect, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { useBooking } from "@/hooks/useBooking";
import { useProviderDetails } from "@/hooks/useProviderDetails";
import { AppLayout } from "@/components/layout/AppLayout";
import { PageContainer } from "@/components/uno/PageContainer";
import { PageHeader } from "@/components/uno/PageHeader";
import { 
  BookingSummary, 
  BookingDateTimeSelect, 
  BookingContactForm, 
  BookingPaymentSelect,
  BookingBottomBar,
  BookingConfirmation,
  type ContactFormData,
  type PaymentMethod 
} from "@/components/booking";
import { addDays, format } from "date-fns";
import { ru } from "date-fns/locale";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Home, CheckCircle2, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

// Fallback services for when no provider data is available
const fallbackServices = [
  { id: "s1", nameEn: "Faucet installation", nameRu: "Установка смесителя", price: 1500, duration: "1 час" },
  { id: "s2", nameEn: "Pipe replacement", nameRu: "Замена труб", price: 3000, duration: "2-4 часа" },
  { id: "s3", nameEn: "Drain cleaning", nameRu: "Прочистка канализации", price: 2000, duration: "1-2 часа" },
  { id: "s4", nameEn: "Toilet installation", nameRu: "Установка унитаза", price: 2500, duration: "2 часа" },
];

export default function ServiceBooking() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { language } = useLanguage();
  const { user, isLoading: authLoading } = useAuth();
  const { getItemsByProvider, clearByProvider } = useCart();
  const { createBooking, isSubmitting } = useBooking();

  // Fetch provider and services from database
  const { provider: dbProvider, services: dbServices, isLoading: providerLoading } = useProviderDetails(id || null);

  // Use database data or fallback
  const services = useMemo(() => {
    if (dbServices && dbServices.length > 0) {
      return dbServices.map(s => ({
        id: s.id,
        nameEn: s.name_en,
        nameRu: s.name_ru,
        price: s.price || 0,
        duration: '1 час',
      }));
    }
    return fallbackServices;
  }, [dbServices]);

  const providerInfo = useMemo(() => {
    if (dbProvider) {
      return {
        id: dbProvider.id,
        name: dbProvider.name,
        image: dbProvider.logo_url || PLACEHOLDER_IMAGES.provider,
      };
    }
    return {
      id: id,
      name: language === "ru" ? "Специалист" : "Specialist",
      image: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=100&h=100&fit=crop",
    };
  }, [dbProvider, language, id]);

  // Form state
  const [date, setDate] = useState<Date | undefined>(addDays(new Date(), 1));
  const [time, setTime] = useState<string>("");
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [address, setAddress] = useState<string>("");
  const [contactData, setContactData] = useState<ContactFormData>({ name: "", phone: "" });
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cash");
  const [bookingResult, setBookingResult] = useState<{ success: boolean; bookingId?: string } | null>(null);

  // Load services from cart on mount
  useEffect(() => {
    if (id) {
      const cartServices = getItemsByProvider(id);
      if (cartServices.length > 0) {
        setSelectedServices(cartServices.map(item => item.id));
      }
    }
  }, [id, getItemsByProvider]);

  const selectedServicesData = services.filter(s => selectedServices.includes(s.id));
  const servicesTotal = selectedServicesData.reduce((sum, s) => sum + s.price, 0);
  const serviceFee = 100;
  const totalAmount = servicesTotal + serviceFee;

  const availableTimes = ["09:00", "10:00", "11:00", "12:00", "14:00", "15:00", "16:00", "17:00", "18:00"];

  // Auth redirect
  if (!authLoading && !user) {
    navigate('/auth', { state: { from: `/services/booking/${id}` } });
    return null;
  }

  // Loading state
  if (providerLoading) {
    return (
      <AppLayout>
        <PageContainer className="pb-32">
          <PageHeader title={language === 'ru' ? 'Загрузка...' : 'Loading...'} showBack />
          <div className="space-y-4 mt-4">
            <Skeleton className="h-20 w-full rounded-xl" />
            <Skeleton className="h-40 w-full rounded-xl" />
            <Skeleton className="h-40 w-full rounded-xl" />
          </div>
        </PageContainer>
      </AppLayout>
    );
  }

  const toggleService = (serviceId: string) => {
    setSelectedServices(prev => 
      prev.includes(serviceId) 
        ? prev.filter(id => id !== serviceId)
        : [...prev, serviceId]
    );
  };

  // Success state
  if (bookingResult?.success && bookingResult.bookingId) {
    // Clear cart after successful booking
    if (id) {
      clearByProvider(id);
    }
    
    return (
      <AppLayout>
        <BookingConfirmation
          bookingId={bookingResult.bookingId}
          title={providerInfo.name}
          date={date ? format(date, 'PPP', { locale: language === 'ru' ? ru : undefined }) : undefined}
          time={time}
          location={address}
          total={totalAmount}
          currency="THB"
          continuePath="/services"
          continueLabel={language === 'ru' ? 'К услугам' : 'Browse Services'}
        />
      </AppLayout>
    );
  }

  const handleSubmit = async () => {
    if (!date || !time) return;
    if (!contactData.name || !contactData.phone || !address) return;
    if (selectedServices.length === 0) return;

    const scheduledAt = new Date(date);
    const [hours, minutes] = time.split(':').map(Number);
    scheduledAt.setHours(hours, minutes, 0, 0);

    const items = selectedServicesData.map(service => ({
      item_type: 'service',
      item_id: service.id,
      item_name: language === 'ru' ? service.nameRu : service.nameEn,
      quantity: 1,
      unit_price: service.price,
      subtotal: service.price,
    }));

    // Add service fee
    items.push({
      item_type: 'fee',
      item_id: 'service_fee',
      item_name: language === 'ru' ? 'Сервисный сбор' : 'Service fee',
      quantity: 1,
      unit_price: serviceFee,
      subtotal: serviceFee,
    });

    const result = await createBooking({
      booking_type: 'service',
      scheduled_at: scheduledAt,
      total_amount: totalAmount,
      currency: 'THB',
      notes: contactData.notes,
      items,
      participants: [{
        name: contactData.name,
        phone: contactData.phone,
        email: contactData.email,
        is_primary: true,
      }],
      addresses: [{
        address_type: 'service',
        address: address,
      }],
      payment: {
        amount: totalAmount,
        payment_method: paymentMethod,
      },
    });

    if (result.success) {
      setBookingResult({ success: true, bookingId: result.booking_id });
    }
  };

  return (
    <AppLayout>
      <PageContainer className="pb-32">
        <PageHeader 
          title={language === 'ru' ? 'Бронирование' : 'Booking'} 
          showBack 
        />

        {/* Provider Info */}
        <div className="flex items-center gap-3 p-4 bg-card rounded-xl border mt-4 mb-6">
          <img
            src={providerInfo.image}
            alt={providerInfo.name}
            className="w-12 h-12 rounded-full object-cover"
          />
          <div>
            <h3 className="font-semibold">{providerInfo.name}</h3>
            <p className="text-sm text-muted-foreground">
              {language === "ru" ? "Сантехник" : "Plumber"}
            </p>
          </div>
        </div>

        {/* Select Services */}
        <div className="bg-card rounded-xl border p-5 mb-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">
              {language === 'ru' ? 'Выберите услуги' : 'Select Services'}
            </h3>
            {selectedServices.length > 0 && (
              <Badge variant="secondary">
                {selectedServices.length} {language === 'ru' ? 'выбрано' : 'selected'}
              </Badge>
            )}
          </div>
          <div className="space-y-2">
            {services.map((service) => {
              const isSelected = selectedServices.includes(service.id);
              return (
                <div
                  key={service.id}
                  onClick={() => toggleService(service.id)}
                  className={cn(
                    "flex items-center justify-between p-4 rounded-xl border cursor-pointer transition-all",
                    isSelected 
                      ? "border-primary bg-primary/5" 
                      : "border-border hover:border-primary/50"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "w-5 h-5 rounded border-2 flex items-center justify-center",
                      isSelected ? "border-primary bg-primary" : "border-muted-foreground"
                    )}>
                      {isSelected && <CheckCircle2 className="w-3 h-3 text-primary-foreground" />}
                    </div>
                    <div>
                      <span className="font-medium">
                        {language === 'ru' ? service.nameRu : service.nameEn}
                      </span>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                        <Clock className="w-3 h-3" />
                        <span>{service.duration}</span>
                      </div>
                    </div>
                  </div>
                  <span className="font-bold text-primary">฿{service.price.toLocaleString()}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Date & Time */}
        <div className="bg-card rounded-xl border p-5 mb-4">
          <h3 className="font-semibold mb-4">
            {language === 'ru' ? 'Дата и время' : 'Date & Time'}
          </h3>
          <BookingDateTimeSelect
            date={date}
            time={time}
            onDateChange={setDate}
            onTimeChange={setTime}
            availableTimes={availableTimes}
            showQuickDates
          />
        </div>

        {/* Address */}
        <div className="bg-card rounded-xl border p-5 mb-4">
          <Label className="font-semibold mb-4 flex items-center gap-2">
            <Home className="w-5 h-5 text-primary" />
            {language === 'ru' ? 'Адрес' : 'Address'}
          </Label>
          <Input
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder={language === 'ru' ? 'Адрес оказания услуги' : 'Service address'}
            className="mt-2"
            required
          />
        </div>

        {/* Contact Info */}
        <div className="bg-card rounded-xl border p-5 mb-4">
          <h3 className="font-semibold mb-4">
            {language === 'ru' ? 'Контактные данные' : 'Contact Information'}
          </h3>
          <BookingContactForm
            data={contactData}
            onChange={setContactData}
            showNotes
          />
        </div>

        {/* Payment Method */}
        <div className="bg-card rounded-xl border p-5 mb-4">
          <h3 className="font-semibold mb-4">
            {language === 'ru' ? 'Способ оплаты' : 'Payment Method'}
          </h3>
          <BookingPaymentSelect
            selected={paymentMethod}
            onSelect={setPaymentMethod}
            amount={totalAmount}
            currency="THB"
            showWallet
            showCash
          />
        </div>

        {/* Price Summary */}
        {selectedServices.length > 0 && (
          <div className="bg-card rounded-xl border p-5 mb-4">
            <div className="space-y-2 text-sm">
              {selectedServicesData.map(service => (
                <div key={service.id} className="flex justify-between">
                  <span className="text-muted-foreground">
                    {language === 'ru' ? service.nameRu : service.nameEn}
                  </span>
                  <span>฿{service.price.toLocaleString()}</span>
                </div>
              ))}
              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  {language === 'ru' ? 'Сервисный сбор' : 'Service fee'}
                </span>
                <span>฿{serviceFee}</span>
              </div>
              <div className="flex justify-between text-lg font-bold pt-2 border-t border-border">
                <span>{language === 'ru' ? 'Итого' : 'Total'}</span>
                <span className="text-primary">฿{totalAmount.toLocaleString()}</span>
              </div>
            </div>
          </div>
        )}

        {/* Bottom Bar */}
        <BookingBottomBar
          total={totalAmount}
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
          disabled={!date || !time || !contactData.name || !contactData.phone || !address || selectedServices.length === 0}
          submitLabel={language === 'ru' ? 'Подтвердить заказ' : 'Confirm Order'}
        />
      </PageContainer>
    </AppLayout>
  );
}
