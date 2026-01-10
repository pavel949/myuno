import { useState } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { 
  CalendarIcon, 
  Clock, 
  User, 
  Mail, 
  Phone as PhoneIcon,
  FileText,
  CheckCircle2,
  Building2,
  Video,
  MapPin
} from "lucide-react";
import { format } from "date-fns";
import { ru, enUS } from "date-fns/locale";

const LegalBooking = () => {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const preSelectedService = searchParams.get("service");
  const { language } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [selectedTime, setSelectedTime] = useState<string>();
  const [consultationType, setConsultationType] = useState<"office" | "online">("office");
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    company: "",
    service: preSelectedService || "",
    description: "",
  });

  const timeSlots = [
    "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
    "14:00", "14:30", "15:00", "15:30", "16:00", "16:30", "17:00"
  ];

  const services = [
    language === "ru" ? "Регистрация компании" : "Company Registration",
    language === "ru" ? "Сопровождение сделок с недвижимостью" : "Real Estate Transaction",
    language === "ru" ? "Визовая консультация" : "Visa Consultation",
    language === "ru" ? "Трудовое право" : "Employment Law",
    language === "ru" ? "Due Diligence" : "Due Diligence",
    language === "ru" ? "Налоговое планирование" : "Tax Planning",
    language === "ru" ? "Бухгалтерские услуги" : "Accounting Services",
    language === "ru" ? "Другое" : "Other",
  ];

  const handleSubmit = async () => {
    if (!user) {
      toast.error(language === "ru" ? "Пожалуйста, войдите в аккаунт" : "Please sign in to book");
      navigate("/auth");
      return;
    }

    if (!selectedDate || !selectedTime || !formData.name || !formData.phone) {
      toast.error(language === "ru" ? "Заполните все обязательные поля" : "Please fill all required fields");
      return;
    }

    setIsSubmitting(true);

    try {
      const scheduledAt = new Date(selectedDate);
      const [hours, minutes] = selectedTime.split(":").map(Number);
      scheduledAt.setHours(hours, minutes, 0, 0);

      // Create booking
      const { data: booking, error: bookingError } = await supabase
        .from("bookings")
        .insert({
          user_id: user.id,
          booking_type: "service",
          status: "submitted",
          scheduled_at: scheduledAt.toISOString(),
          notes: JSON.stringify({
            provider_id: id,
            provider_name: "Phuket Legal Partners",
            service: formData.service,
            consultation_type: consultationType,
            description: formData.description,
            company: formData.company,
          }),
        })
        .select()
        .single();

      if (bookingError) throw bookingError;

      // Add participant info
      await supabase.from("booking_participants").insert({
        booking_id: booking.id,
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        is_primary: true,
      });

      toast.success(
        language === "ru" 
          ? "Заявка отправлена! Мы свяжемся с вами для подтверждения." 
          : "Request submitted! We will contact you to confirm."
      );
      navigate("/bookings");
    } catch (error) {
      console.error("Booking error:", error);
      toast.error(language === "ru" ? "Ошибка при бронировании" : "Booking failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AppLayout title={language === "ru" ? "Запись на консультацию" : "Book Consultation"} showBottomNav={false}>
      <div className="p-4 pb-24 space-y-6">
        {/* Progress Steps */}
        <div className="flex items-center justify-center gap-2">
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
            <div className="text-center">
              <h2 className="text-xl font-bold">
                {language === "ru" ? "Выберите дату и время" : "Select Date & Time"}
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                {language === "ru" ? "Шаг 1 из 3" : "Step 1 of 3"}
              </p>
            </div>

            {/* Consultation Type */}
            <div className="space-y-3">
              <Label>{language === "ru" ? "Формат консультации" : "Consultation Format"}</Label>
              <div className="grid grid-cols-2 gap-3">
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

            {/* Calendar */}
            <div className="bg-card border border-border rounded-xl p-4">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                locale={language === "ru" ? ru : enUS}
                disabled={(date) => date < new Date() || date.getDay() === 0}
                className="mx-auto"
              />
            </div>

            {/* Time Slots */}
            {selectedDate && (
              <div className="space-y-3">
                <Label className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  {language === "ru" ? "Доступное время" : "Available Time"}
                </Label>
                <div className="grid grid-cols-4 gap-2">
                  {timeSlots.map((time) => (
                    <button
                      key={time}
                      onClick={() => setSelectedTime(time)}
                      className={`py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                        selectedTime === time
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted hover:bg-muted/80"
                      }`}
                    >
                      {time}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <Button
              className="w-full"
              disabled={!selectedDate || !selectedTime}
              onClick={() => setStep(2)}
            >
              {language === "ru" ? "Продолжить" : "Continue"}
            </Button>
          </div>
        )}

        {/* Step 2: Service & Details */}
        {step === 2 && (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-xl font-bold">
                {language === "ru" ? "Выберите услугу" : "Select Service"}
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                {language === "ru" ? "Шаг 2 из 3" : "Step 2 of 3"}
              </p>
            </div>

            {/* Selected Date Summary */}
            <div className="bg-card border border-border rounded-xl p-4 flex items-center gap-3">
              <CalendarIcon className="w-5 h-5 text-primary" />
              <div>
                <p className="font-medium">
                  {selectedDate && format(selectedDate, "d MMMM yyyy", { locale: language === "ru" ? ru : enUS })}
                </p>
                <p className="text-sm text-muted-foreground">
                  {selectedTime} • {consultationType === "office" 
                    ? (language === "ru" ? "В офисе" : "In Office")
                    : (language === "ru" ? "Онлайн" : "Online")
                  }
                </p>
              </div>
            </div>

            {/* Service Selection */}
            <div className="space-y-3">
              <Label>{language === "ru" ? "Тип услуги" : "Service Type"}</Label>
              <div className="flex flex-wrap gap-2">
                {services.map((service) => (
                  <Badge
                    key={service}
                    variant={formData.service === service ? "default" : "outline"}
                    className="cursor-pointer py-2 px-3"
                    onClick={() => setFormData({ ...formData, service })}
                  >
                    {service}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <FileText className="w-4 h-4" />
                {language === "ru" ? "Опишите ваш вопрос" : "Describe Your Question"}
              </Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder={language === "ru" 
                  ? "Кратко опишите, с чем вам нужна помощь..."
                  : "Briefly describe what you need help with..."
                }
                rows={4}
              />
            </div>

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setStep(1)} className="flex-1">
                {language === "ru" ? "Назад" : "Back"}
              </Button>
              <Button
                className="flex-1"
                disabled={!formData.service}
                onClick={() => setStep(3)}
              >
                {language === "ru" ? "Продолжить" : "Continue"}
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Contact Info */}
        {step === 3 && (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-xl font-bold">
                {language === "ru" ? "Контактные данные" : "Contact Details"}
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                {language === "ru" ? "Шаг 3 из 3" : "Step 3 of 3"}
              </p>
            </div>

            {/* Summary */}
            <div className="bg-card border border-border rounded-xl p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{language === "ru" ? "Дата" : "Date"}</span>
                <span className="font-medium">
                  {selectedDate && format(selectedDate, "d MMMM yyyy", { locale: language === "ru" ? ru : enUS })}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{language === "ru" ? "Время" : "Time"}</span>
                <span className="font-medium">{selectedTime}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{language === "ru" ? "Формат" : "Format"}</span>
                <span className="font-medium">
                  {consultationType === "office" 
                    ? (language === "ru" ? "В офисе" : "In Office")
                    : (language === "ru" ? "Онлайн" : "Online")
                  }
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{language === "ru" ? "Услуга" : "Service"}</span>
                <span className="font-medium">{formData.service}</span>
              </div>
            </div>

            {/* Contact Form */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <User className="w-4 h-4" />
                  {language === "ru" ? "Ваше имя *" : "Your Name *"}
                </Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder={language === "ru" ? "Иван Иванов" : "John Smith"}
                />
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <PhoneIcon className="w-4 h-4" />
                  {language === "ru" ? "Телефон *" : "Phone *"}
                </Label>
                <Input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+66..."
                />
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  Email
                </Label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="email@example.com"
                />
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Building2 className="w-4 h-4" />
                  {language === "ru" ? "Компания (если есть)" : "Company (if any)"}
                </Label>
                <Input
                  value={formData.company}
                  onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                  placeholder={language === "ru" ? "Название компании" : "Company name"}
                />
              </div>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setStep(2)} className="flex-1">
                {language === "ru" ? "Назад" : "Back"}
              </Button>
              <Button
                className="flex-1"
                disabled={!formData.name || !formData.phone || isSubmitting}
                onClick={handleSubmit}
              >
                {isSubmitting 
                  ? (language === "ru" ? "Отправка..." : "Submitting...")
                  : (language === "ru" ? "Отправить заявку" : "Submit Request")
                }
              </Button>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default LegalBooking;
