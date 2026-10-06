import { useState, useEffect, useMemo } from "react";
import { PLACEHOLDER_IMAGES } from '@/lib/config/placeholders';
import { useNavigate, useParams } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { useBooking } from "@/hooks/useBooking";
import { useServiceBookingCatalogue } from "@/hooks/useServiceBookingCatalogue";
import { AppLayout } from "@/components/layout/AppLayout";
import { PageContainer } from "@/components/uno/PageContainer";
import { PageHeader } from "@/components/uno/PageHeader";
import {
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
import { Home, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { redirectToAuth } from '@/lib/auth/redirectToAuth';
import {
  buildServiceOrderParams,
  UNRESOLVED_FIXED_TIME_SLOTS,
  UNRESOLVED_SERVICE_FEE_THB,
} from '@/lib/services/serviceBookingModel';

function Notice({ title, text, testId }: { title: string; text: string; testId: string }) {
  return (
    <AppLayout>
      <PageContainer className="pb-32">
        <PageHeader title={title} showBack />
        <p className="mt-6 text-sm text-muted-foreground" data-testid={testId}>{text}</p>
      </PageContainer>
    </AppLayout>
  );
}

export default function ServiceBooking() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { language } = useLanguage();
  const ruLang = language === 'ru';
  const { user, isLoading: authLoading } = useAuth();
  const { getItemsByProvider, clearByProvider } = useCart();
  const { createBooking, isSubmitting } = useBooking();
  const catalogue = useServiceBookingCatalogue(id);

  const [date, setDate] = useState<Date | undefined>(addDays(new Date(), 1));
  const [time, setTime] = useState<string>("");
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [address, setAddress] = useState<string>("");
  const [contactData, setContactData] = useState<ContactFormData>({ name: "", phone: "" });
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cash");
  const [bookingResult, setBookingResult] = useState<{ success: boolean; bookingId?: string } | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Auth redirect as an effect, never during render
  useEffect(() => {
    if (!authLoading && !user) redirectToAuth(navigate, { from: `/services/booking/${id}` });
  }, [authLoading, user, navigate, id]);

  const offerings = useMemo(() => (catalogue.status === 'ready' ? catalogue.offerings : []), [catalogue]);

  // Preselect from cart, keeping only real active offerings
  useEffect(() => {
    if (!id || offerings.length === 0) return;
    const valid = new Set(offerings.map(o => o.id));
    const fromCart = getItemsByProvider(id).map(item => item.id).filter(x => valid.has(x));
    if (fromCart.length > 0) setSelectedServices(fromCart);
  }, [id, offerings, getItemsByProvider]);

  // Clear cart only after a confirmed booking, as an effect
  useEffect(() => {
    if (bookingResult?.success && id) clearByProvider(id);
  }, [bookingResult, id, clearByProvider]);

  if (authLoading || !user) return null;

  if (catalogue.status === 'loading') {
    return (
      <AppLayout>
        <PageContainer className="pb-32">
          <PageHeader title={ruLang ? 'Загрузка…' : 'Loading…'} showBack />
          <div className="space-y-4 mt-4" data-testid="service-booking-loading">
            <Skeleton className="h-20 w-full rounded-none" />
            <Skeleton className="h-40 w-full rounded-none" />
          </div>
        </PageContainer>
      </AppLayout>
    );
  }

  const title = ruLang ? 'Запись к специалисту' : 'Book a specialist';
  if (catalogue.status === 'missing') {
    return <Notice title={title} testId="service-booking-missing" text={ruLang
      ? 'Исполнитель не найден. Выберите специалиста в каталоге услуг.'
      : 'Provider not found. Please choose a specialist in the service catalogue.'} />;
  }
  if (catalogue.status === 'inactive') {
    return <Notice title={title} testId="service-booking-inactive" text={ruLang
      ? 'Этот исполнитель сейчас не принимает заявки. Выберите другого специалиста в каталоге.'
      : 'This provider is not accepting requests right now. Please choose another specialist.'} />;
  }
  if (catalogue.status === 'error') {
    return <Notice title={title} testId="service-booking-error" text={ruLang
      ? 'Не удалось загрузить перечень услуг. Обновите страницу или повторите попытку позже.'
      : 'Could not load the list of services. Please refresh the page or try again later.'} />;
  }
  if (catalogue.status === 'empty') {
    return <Notice title={title} testId="service-booking-empty" text={ruLang
      ? 'У этого исполнителя пока нет услуг, доступных для записи. Выберите другого специалиста в каталоге.'
      : 'This provider has no services available for booking yet. Please choose another specialist.'} />;
  }

  const { provider, org } = catalogue;
  const bookable = org.status === 'mapped';
  const selected = offerings.filter(s => selectedServices.includes(s.id));
  const subtotal = selected.reduce((sum, s) => sum + s.price, 0);
  const serviceFee = UNRESOLVED_SERVICE_FEE_THB;
  const totalAmount = subtotal + serviceFee;

  const toggleService = (serviceId: string) => {
    setSelectedServices(prev => prev.includes(serviceId) ? prev.filter(x => x !== serviceId) : [...prev, serviceId]);
  };

  if (bookingResult?.success && bookingResult.bookingId) {
    return (
      <AppLayout>
        <BookingConfirmation
          bookingId={bookingResult.bookingId}
          title={provider.name}
          date={date ? format(date, 'PPP', { locale: ruLang ? ru : undefined }) : undefined}
          time={time}
          location={address}
          total={totalAmount}
          currency="THB"
          continuePath="/services"
          continueLabel={ruLang ? 'К услугам' : 'Browse Services'}
        />
      </AppLayout>
    );
  }

  const handleSubmit = async () => {
    setSubmitError(null);
    if (!date || !time || !contactData.name || !contactData.phone || !address) return;
    const scheduledAt = new Date(date);
    const [hours, minutes] = time.split(':').map(Number);
    scheduledAt.setHours(hours, minutes, 0, 0);

    const built = buildServiceOrderParams({
      provider, org, selected, scheduledAt,
      contact: { name: contactData.name, phone: contactData.phone, email: contactData.email, notes: contactData.notes },
      address, paymentMethod, serviceFee,
    });
    if (!built.ok) { setSubmitError(built.reason); return; }

    const result = await createBooking(built.params);
    if (result.success) setBookingResult({ success: true, bookingId: result.booking_id });
  };

  return (
    <AppLayout>
      <PageContainer className="pb-32">
        <PageHeader title={ruLang ? 'Запись к специалисту' : 'Book a specialist'} showBack />

        <div className="flex items-center gap-3 p-4 bg-card rounded-none border mt-4 mb-6">
          <img src={provider.logo_url || PLACEHOLDER_IMAGES.provider} alt={provider.name} className="w-12 h-12 rounded-full object-cover" />
          <div>
            <h3 className="font-semibold">{provider.name}</h3>
            {provider.business_category && <p className="text-sm text-muted-foreground">{provider.business_category}</p>}
          </div>
        </div>

        {!bookable && (
          <div className="border border-border bg-card p-4 mb-4 text-sm" role="status" data-testid="service-booking-blocked">
            {ruLang
              ? 'Онлайн-запись к этому исполнителю временно недоступна: исполнитель ещё не подключён к приёму заказов. Перечень услуг и цены приведены для ознакомления.'
              : 'Online booking with this provider is temporarily unavailable: the provider is not yet connected to order processing. Services and prices are shown for reference.'}
          </div>
        )}

        <div className="bg-card rounded-none border p-5 mb-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">{ruLang ? 'Услуги' : 'Services'}</h3>
            {bookable && selectedServices.length > 0 && (
              <Badge variant="secondary">{selectedServices.length} {ruLang ? 'выбрано' : 'selected'}</Badge>
            )}
          </div>
          <div className="space-y-2" data-testid="service-booking-offerings">
            {offerings.map((service) => {
              const isSelected = selectedServices.includes(service.id);
              return (
                <button
                  type="button"
                  key={service.id}
                  disabled={!bookable}
                  onClick={() => toggleService(service.id)}
                  className={cn(
                    "w-full flex items-center justify-between p-4 rounded-none border text-left transition-colors disabled:cursor-default",
                    isSelected ? "border-primary bg-primary/5" : "border-border",
                  )}
                >
                  <span className="flex items-center gap-3">
                    {bookable && (
                      <span className={cn("w-5 h-5 rounded-none border-2 flex items-center justify-center",
                        isSelected ? "border-primary bg-primary" : "border-muted-foreground")}>
                        {isSelected && <CheckCircle2 className="w-3 h-3 text-primary-foreground" />}
                      </span>
                    )}
                    <span className="font-medium">{ruLang ? service.nameRu : service.nameEn}</span>
                  </span>
                  <span className="font-bold text-primary">฿{service.price.toLocaleString()}</span>
                </button>
              );
            })}
          </div>
        </div>

        {bookable && (
          <>
            <div className="bg-card rounded-none border p-5 mb-4">
              <h3 className="font-semibold mb-4">{ruLang ? 'Дата и время' : 'Date & Time'}</h3>
              <BookingDateTimeSelect date={date} time={time} onDateChange={setDate} onTimeChange={setTime}
                availableTimes={UNRESOLVED_FIXED_TIME_SLOTS} showQuickDates />
            </div>

            <div className="bg-card rounded-none border p-5 mb-4">
              <Label className="font-semibold mb-4 flex items-center gap-2">
                <Home className="w-5 h-5 text-primary" />
                {ruLang ? 'Адрес' : 'Address'}
              </Label>
              <Input value={address} onChange={(e) => setAddress(e.target.value)}
                placeholder={ruLang ? 'Адрес оказания услуги' : 'Service address'} className="mt-2" required />
            </div>

            <div className="bg-card rounded-none border p-5 mb-4">
              <h3 className="font-semibold mb-4">{ruLang ? 'Контактные данные' : 'Contact Information'}</h3>
              <BookingContactForm data={contactData} onChange={setContactData} showNotes />
            </div>

            <div className="bg-card rounded-none border p-5 mb-4">
              <h3 className="font-semibold mb-4">{ruLang ? 'Способ оплаты' : 'Payment Method'}</h3>
              <BookingPaymentSelect selected={paymentMethod} onSelect={setPaymentMethod} amount={totalAmount} currency="THB" showWallet showCash />
            </div>

            {selected.length > 0 && (
              <div className="bg-card rounded-none border p-5 mb-4">
                <div className="space-y-2 text-sm">
                  {selected.map(service => (
                    <div key={service.id} className="flex justify-between">
                      <span className="text-muted-foreground">{ruLang ? service.nameRu : service.nameEn}</span>
                      <span>฿{service.price.toLocaleString()}</span>
                    </div>
                  ))}
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{ruLang ? 'Сервисный сбор' : 'Service fee'}</span>
                    <span>฿{serviceFee}</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold pt-2 border-t border-border">
                    <span>{ruLang ? 'Итого' : 'Total'}</span>
                    <span className="text-primary">฿{totalAmount.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            )}

            {submitError && (
              <p className="text-sm text-destructive mb-4" role="alert" data-testid="service-booking-submit-error">
                {ruLang ? 'Не удалось оформить заявку. Проверьте выбранные услуги и повторите попытку.' : 'Could not submit the request. Check the selected services and try again.'}
              </p>
            )}

            <BookingBottomBar
              total={totalAmount}
              onSubmit={handleSubmit}
              isSubmitting={isSubmitting}
              disabled={!date || !time || !contactData.name || !contactData.phone || !address || selected.length === 0}
              submitLabel={ruLang ? 'Отправить заявку' : 'Submit request'}
            />
          </>
        )}
      </PageContainer>
    </AppLayout>
  );
}
