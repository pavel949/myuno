import { useState } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { useBooking } from "@/hooks/useBooking";
import { useWellnessCheckout } from "@/hooks/useWellnessCheckout";
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
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Video, CheckCircle2 } from "lucide-react";

export default function LegalBooking() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const preSelectedService = searchParams.get("service");
  const navigate = useNavigate();
  const { language } = useLanguage();
  const { user, isLoading: authLoading } = useAuth();
  const { createBooking, isSubmitting } = useBooking();
  const { createWellnessCheckout, isProcessing: isStripeProcessing } = useWellnessCheckout();

  // Form state
  const [step, setStep] = useState(1);
  const [date, setDate] = useState<Date | undefined>(addDays(new Date(), 1));
  const [time, setTime] = useState<string>("");
  const [consultationType, setConsultationType] = useState<"office" | "online">("office");
  const [selectedService, setSelectedService] = useState<string>(preSelectedService || "");
  const [description, setDescription] = useState<string>("");
  const [company, setCompany] = useState<string>("");
  const [contactData, setContactData] = useState<ContactFormData>({ name: "", phone: "" });
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cash");
  const [bookingResult, setBookingResult] = useState<{ success: boolean; bookingId?: string } | null>(null);

  const consultationPrice = 2000;

  const services = [
    language === "ru" ? "Регистрация компании" : "Company Registration",
    language === "ru" ? "Сопровождение сделок с недвижимостью" : "Real Estate Transaction",
    language === "ru" ? "Визовая консультация" : "Visa Consultation",
    language === "ru" ? "Трудовое право" : "Employment Law",
    language === "ru" ? "Due Diligence" : "Due Diligence",
    language === "ru" ? "Налоговое планирование" : "Tax Planning",
    language === "ru" ? "Другое" : "Other",
  ];

  const availableTimes = [
    "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
    "14:00", "14:30", "15:00", "15:30", "16:00", "16:30", "17:00"
  ];

  // Auth redirect
  if (!authLoading && !user) {
    navigate('/auth', { state: { from: `/legal/booking/${id}` } });
    return null;
  }

  // Success state
  if (bookingResult?.success && bookingResult.bookingId) {
    return (
      <AppLayout>
        <BookingConfirmation
          bookingId={bookingResult.bookingId}
          title={language === 'ru' ? 'Юридическая консультация' : 'Legal Consultation'}
          date={date ? format(date, 'PPP', { locale: language === 'ru' ? ru : undefined }) : undefined}
          time={time}
          total={consultationPrice}
          currency="THB"
          continuePath="/legal"
          continueLabel={language === 'ru' ? 'К юристам' : 'Browse Legal Services'}
        />
      </AppLayout>
    );
  }

  const handleSubmit = async () => {
    if (!date || !time) return;
    if (!contactData.name || !contactData.phone) return;

    const scheduledAt = new Date(date);
    const [hours, minutes] = time.split(':').map(Number);
    scheduledAt.setHours(hours, minutes, 0, 0);

    // Stripe card payment flow
    if (paymentMethod === 'card') {
      await createWellnessCheckout({
        vertical: 'medical', // legal falls under professional services
        items: [{
          id: id || 'legal-consultation',
          name: selectedService || (language === 'ru' ? 'Юридическая консультация' : 'Legal Consultation'),
          price: consultationPrice,
          duration_minutes: 60,
        }],
        totalAmount: consultationPrice,
        scheduledAt: scheduledAt.toISOString(),
        contactName: contactData.name,
        contactPhone: contactData.phone,
        contactEmail: contactData.email,
        providerName: language === 'ru' ? 'Юридическая консультация' : 'Legal Consultation',
        notes: JSON.stringify({
          provider_id: id,
          service: selectedService,
          consultation_type: consultationType,
          description,
          company,
          visa_type: searchParams.get('visa_type'),
        }),
      });
      return;
    }

    // Cash/wallet flow
    const result = await createBooking({
      booking_type: 'service',
      scheduled_at: scheduledAt,
      total_amount: consultationPrice,
      currency: 'THB',
      notes: JSON.stringify({
        provider_id: id,
        service: selectedService,
        consultation_type: consultationType,
        description,
        company,
      }),
      items: [{
        item_type: 'legal_consultation',
        item_id: id || 'consultation',
        item_name: selectedService || (language === 'ru' ? 'Консультация' : 'Consultation'),
        quantity: 1,
        unit_price: consultationPrice,
        subtotal: consultationPrice,
      }],
      participants: [{
        name: contactData.name,
        phone: contactData.phone,
        email: contactData.email,
        is_primary: true,
      }],
      payment: {
        amount: consultationPrice,
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
          title={language === 'ru' ? 'Запись на консультацию' : 'Book Consultation'} 
          showBack 
        />

        {/* Progress Steps */}
        <div className="flex items-center justify-center gap-2 mt-4 mb-6">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center gap-2">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all ${
                  step >= s
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {step > s ? <CheckCircle2 className="w-5 h-5" /> : s}
              </div>
              {s < 3 && <div className={`w-12 h-0.5 ${step > s ? "bg-primary" : "bg-muted"}`} />}
            </div>
          ))}
        </div>

        {/* Step 1: Date & Time */}
        {step === 1 && (
          <div className="space-y-6">
            {/* Consultation Type */}
            <div className="bg-card rounded-xl border p-5">
              <Label className="font-semibold mb-4 block">
                {language === 'ru' ? 'Формат консультации' : 'Consultation Format'}
              </Label>
              <div className="grid grid-cols-2 gap-3 mt-3">
                <button
                  onClick={() => setConsultationType("office")}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    consultationType === "office"
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  <MapPin className={`w-6 h-6 mx-auto mb-2 ${consultationType === "office" ? "text-primary" : "text-muted-foreground"}`} />
                  <p className="font-medium text-sm">{language === "ru" ? "В офисе" : "In Office"}</p>
                </button>
                <button
                  onClick={() => setConsultationType("online")}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    consultationType === "online"
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  <Video className={`w-6 h-6 mx-auto mb-2 ${consultationType === "online" ? "text-primary" : "text-muted-foreground"}`} />
                  <p className="font-medium text-sm">{language === "ru" ? "Онлайн" : "Online"}</p>
                </button>
              </div>
            </div>

            {/* Date & Time */}
            <div className="bg-card rounded-xl border p-5">
              <h3 className="font-semibold mb-4">
                {language === 'ru' ? 'Дата и время' : 'Date & Time'}
              </h3>
              <BookingDateTimeSelect
                date={date}
                time={time}
                onDateChange={setDate}
                onTimeChange={setTime}
                availableTimes={availableTimes}
              />
            </div>

            <Button
              className="w-full"
              disabled={!date || !time}
              onClick={() => setStep(2)}
            >
              {language === 'ru' ? 'Продолжить' : 'Continue'}
            </Button>
          </div>
        )}

        {/* Step 2: Service Selection */}
        {step === 2 && (
          <div className="space-y-6">
            {/* Summary */}
            <BookingSummary
              title={language === 'ru' ? 'Консультация' : 'Consultation'}
              date={date}
              time={time}
              subtitle={consultationType === 'office' 
                ? (language === 'ru' ? 'В офисе' : 'In Office')
                : (language === 'ru' ? 'Онлайн' : 'Online')
              }
              price={consultationPrice}
              sourceCurrency="THB"
            />

            {/* Service Selection */}
            <div className="bg-card rounded-xl border p-5">
              <Label className="font-semibold mb-4 block">
                {language === 'ru' ? 'Тип услуги' : 'Service Type'}
              </Label>
              <div className="flex flex-wrap gap-2 mt-3">
                {services.map((service) => (
                  <Badge
                    key={service}
                    variant={selectedService === service ? "default" : "outline"}
                    className="cursor-pointer py-2 px-3"
                    onClick={() => setSelectedService(service)}
                  >
                    {service}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Description */}
            <div className="bg-card rounded-xl border p-5">
              <Label className="font-semibold mb-4 block">
                {language === 'ru' ? 'Опишите ваш вопрос' : 'Describe Your Question'}
              </Label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={language === 'ru' 
                  ? 'Кратко опишите, с чем вам нужна помощь...'
                  : 'Briefly describe what you need help with...'}
                rows={4}
                className="mt-2"
              />
            </div>

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setStep(1)} className="flex-1">
                {language === 'ru' ? 'Назад' : 'Back'}
              </Button>
              <Button
                className="flex-1"
                disabled={!selectedService}
                onClick={() => setStep(3)}
              >
                {language === 'ru' ? 'Продолжить' : 'Continue'}
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Contact & Payment */}
        {step === 3 && (
          <div className="space-y-6">
            {/* Summary */}
            <BookingSummary
              title={selectedService}
              date={date}
              time={time}
              price={consultationPrice}
              sourceCurrency="THB"
            />

            {/* Contact Info */}
            <div className="bg-card rounded-xl border p-5">
              <h3 className="font-semibold mb-4">
                {language === 'ru' ? 'Контактные данные' : 'Contact Information'}
              </h3>
              <BookingContactForm
                data={contactData}
                onChange={setContactData}
                showEmail
              />
              <div className="mt-4">
                <Label>{language === 'ru' ? 'Компания (если есть)' : 'Company (if any)'}</Label>
                <Input
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  placeholder={language === 'ru' ? 'Название компании' : 'Company name'}
                  className="mt-1"
                />
              </div>
            </div>

            {/* Payment Method */}
            <div className="bg-card rounded-xl border p-5">
              <h3 className="font-semibold mb-4">
                {language === 'ru' ? 'Способ оплаты' : 'Payment Method'}
              </h3>
              <BookingPaymentSelect
                selected={paymentMethod}
                onSelect={setPaymentMethod}
                amount={consultationPrice}
                currency="THB"
                showWallet
                showCash
              />
            </div>

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setStep(2)} className="flex-1">
                {language === 'ru' ? 'Назад' : 'Back'}
              </Button>
            </div>

            {/* Bottom Bar */}
            <BookingBottomBar
              total={consultationPrice}
              onSubmit={handleSubmit}
              isSubmitting={isSubmitting}
              disabled={!contactData.name || !contactData.phone}
              submitLabel={language === 'ru' ? 'Отправить заявку' : 'Submit Request'}
            />
          </div>
        )}
      </PageContainer>
    </AppLayout>
  );
}
