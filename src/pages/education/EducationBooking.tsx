import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, CalendarIcon, Clock, User, Phone, Mail, MessageSquare, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { cn } from "@/lib/utils";

const courseData: Record<string, any> = {
  "course-1": { title_ru: "Английский для детей", title_en: "English for Kids", price: 150, currency: "฿" },
  "course-2": { title_ru: "Курс тайского языка", title_en: "Thai Language Course", price: 200, currency: "฿" },
};

const tutorData: Record<string, any> = {
  "tutor-t1": { name: "Sarah Johnson", specialty_ru: "Преподаватель английского", specialty_en: "English Teacher", price: 500, currency: "฿" },
  "tutor-t2": { name: "Somchai Wongsa", specialty_ru: "Эксперт тайского языка", specialty_en: "Thai Language Expert", price: 400, currency: "฿" },
  "tutor-t3": { name: "Maria Petrova", specialty_ru: "Репетитор по математике и физике", specialty_en: "Math & Physics Tutor", price: 600, currency: "฿" },
  "tutor-t4": { name: "John Smith", specialty_ru: "Преподаватель музыки", specialty_en: "Music Teacher", price: 450, currency: "฿" },
};

export default function EducationBooking() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { language } = useLanguage();
  const { user } = useAuth();

  const isTutor = id?.startsWith("tutor-");
  const data = isTutor ? tutorData[id || ""] : courseData[id || ""];

  const [selectedDate, setSelectedDate] = useState<Date>();
  const [selectedTime, setSelectedTime] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    studentAge: "",
    message: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const timeSlots = ["09:00", "10:00", "11:00", "14:00", "15:00", "16:00", "17:00", "18:00", "19:00"];

  const handleSubmit = async () => {
    if (!formData.name || !formData.phone || !selectedDate || !selectedTime) {
      toast.error(language === "ru" ? "Заполните все обязательные поля" : "Please fill all required fields");
      return;
    }

    if (!user) {
      toast.error(language === "ru" ? "Войдите для записи" : "Please login to book");
      navigate("/auth");
      return;
    }

    setIsSubmitting(true);

    try {
      const dateStr = format(selectedDate, 'yyyy-MM-dd');
      const scheduledAt = new Date(`${dateStr}T${selectedTime}`);
      const price = data?.price || 0;

      const { data: booking, error } = await supabase
        .from("bookings")
        .insert({
          user_id: user.id,
          booking_type: "service",
          status: "submitted",
          scheduled_at: scheduledAt.toISOString(),
          total_amount: price,
          currency: "THB",
          notes: `${isTutor ? "Tutor" : "Course"}: ${isTutor ? data?.name : (language === "ru" ? data?.title_ru : data?.title_en)}. Student age: ${formData.studentAge}. ${formData.message}`
        })
        .select()
        .single();

      if (error) throw error;

      await supabase.from("booking_participants").insert({
        booking_id: booking.id,
        name: formData.name,
        phone: formData.phone,
        email: formData.email || null,
        is_primary: true
      });

      await supabase.from("booking_items").insert({
        booking_id: booking.id,
        item_type: isTutor ? "tutor_lesson" : "course_lesson",
        item_name: isTutor ? data?.name : (language === "ru" ? data?.title_ru : data?.title_en),
        quantity: 1,
        unit_price: price,
        subtotal: price
      });

      setIsSuccess(true);
      toast.success(language === "ru" ? "Заявка отправлена!" : "Booking submitted!");
    } catch (error) {
      console.error("Booking error:", error);
      toast.error(language === "ru" ? "Ошибка при записи" : "Booking failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="h-10 w-10 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-2">
            {language === "ru" ? "Заявка отправлена!" : "Booking Submitted!"}
          </h1>
          <p className="text-muted-foreground mb-6">
            {language === "ru" 
              ? "Мы свяжемся с вами для подтверждения" 
              : "We will contact you to confirm"}
          </p>
          <Button onClick={() => navigate("/education")}>
            {language === "ru" ? "Вернуться к курсам" : "Back to Courses"}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white p-4">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
            className="text-white hover:bg-white/20"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-xl font-bold">
              {language === "ru" ? "Запись на занятие" : "Book a Lesson"}
            </h1>
            <p className="text-sm text-white/80">
              {isTutor 
                ? data?.name 
                : (language === "ru" ? data?.title_ru : data?.title_en)}
            </p>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Date & Time */}
        <div className="bg-card rounded-xl p-4 shadow-sm space-y-4">
          <h2 className="font-semibold text-foreground flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            {language === "ru" ? "Дата и время" : "Date & Time"}
          </h2>
          
          <div>
            <Label>{language === "ru" ? "Дата" : "Date"} *</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal mt-2",
                    !selectedDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {selectedDate 
                    ? format(selectedDate, "PPP", { locale: language === 'ru' ? ru : undefined }) 
                    : (language === "ru" ? "Выберите дату" : "Pick a date")}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 bg-popover z-50" align="start">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  disabled={(date) => date < new Date()}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <div>
            <Label>{language === "ru" ? "Время" : "Time"} *</Label>
            <div className="grid grid-cols-3 gap-2 mt-2">
              {timeSlots.map(slot => (
                <Button
                  key={slot}
                  variant={selectedTime === slot ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedTime(slot)}
                >
                  {slot}
                </Button>
              ))}
            </div>
          </div>
        </div>

        {/* Contact Info */}
        <div className="bg-card rounded-xl p-4 shadow-sm space-y-4">
          <h2 className="font-semibold text-foreground flex items-center gap-2">
            <User className="h-5 w-5" />
            {language === "ru" ? "Контактные данные" : "Contact Info"}
          </h2>
          
          <div>
            <Label>{language === "ru" ? "Имя" : "Name"} *</Label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder={language === "ru" ? "Ваше имя" : "Your name"}
            />
          </div>

          <div>
            <Label>{language === "ru" ? "Телефон" : "Phone"} *</Label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+66"
                className="pl-10"
              />
            </div>
          </div>

          <div>
            <Label>Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="email@example.com"
                className="pl-10"
              />
            </div>
          </div>

          <div>
            <Label>{language === "ru" ? "Возраст ученика" : "Student Age"}</Label>
            <Input
              value={formData.studentAge}
              onChange={(e) => setFormData({ ...formData, studentAge: e.target.value })}
              placeholder={language === "ru" ? "Например: 10 лет" : "E.g.: 10 years"}
            />
          </div>
        </div>

        {/* Notes */}
        <div className="bg-card rounded-xl p-4 shadow-sm space-y-4">
          <h2 className="font-semibold text-foreground flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            {language === "ru" ? "Дополнительно" : "Additional Info"}
          </h2>
          
          <Textarea
            value={formData.message}
            onChange={(e) => setFormData({ ...formData, message: e.target.value })}
            placeholder={language === "ru" ? "Уровень подготовки, цели обучения..." : "Current level, learning goals..."}
            rows={3}
          />
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-card border-t p-4">
        <div className="flex items-center justify-between mb-3">
          <span className="text-muted-foreground">{language === "ru" ? "Цена за занятие" : "Lesson price"}</span>
          <span className="text-xl font-bold text-primary">{data?.currency}{data?.price}</span>
        </div>
        <Button 
          className="w-full" 
          size="lg"
          onClick={handleSubmit}
          disabled={isSubmitting}
        >
          {isSubmitting 
            ? (language === "ru" ? "Отправка..." : "Submitting...")
            : (language === "ru" ? "Записаться" : "Book Lesson")}
        </Button>
      </div>
    </div>
  );
}
