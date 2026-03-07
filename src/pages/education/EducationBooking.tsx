import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { useBooking } from "@/hooks/useBooking";
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

const courseData: Record<string, any> = {
  "course-1": { title_ru: "Английский для детей", title_en: "English for Kids", price: 150 },
  "course-2": { title_ru: "Курс тайского языка", title_en: "Thai Language Course", price: 200 },
};

const tutorData: Record<string, any> = {
  "tutor-t1": { name: "Sarah Johnson", specialty_ru: "Преподаватель английского", specialty_en: "English Teacher", price: 500 },
  "tutor-t2": { name: "Somchai Wongsa", specialty_ru: "Эксперт тайского языка", specialty_en: "Thai Language Expert", price: 400 },
  "tutor-t3": { name: "Maria Petrova", specialty_ru: "Репетитор по математике и физике", specialty_en: "Math & Physics Tutor", price: 600 },
  "tutor-t4": { name: "John Smith", specialty_ru: "Преподаватель музыки", specialty_en: "Music Teacher", price: 450 },
};

export default function EducationBooking() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { language } = useLanguage();
  const { user, isLoading: authLoading } = useAuth();
  const { createBooking, isSubmitting } = useBooking();

  const isTutor = id?.startsWith("tutor-");
  const data = isTutor ? tutorData[id || ""] : courseData[id || ""];

  // Form state
  const [date, setDate] = useState<Date | undefined>(addDays(new Date(), 1));
  const [time, setTime] = useState<string>("");
  const [contactData, setContactData] = useState<ContactFormData>({ name: "", phone: "" });
  const [studentAge, setStudentAge] = useState<string>("");
  const [message, setMessage] = useState<string>("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cash");
  const [bookingResult, setBookingResult] = useState<{ success: boolean; bookingId?: string } | null>(null);

  const price = data?.price || 0;
  const title = isTutor 
    ? data?.name 
    : (language === 'ru' ? data?.title_ru : data?.title_en);

  // Auth redirect
  if (!authLoading && !user) {
    navigate('/auth', { state: { from: `/education/booking/${id}` } });
    return null;
  }

  // Success state
  if (bookingResult?.success && bookingResult.bookingId) {
    return (
      <AppLayout showBottomNav={false}>
        <BookingConfirmation
          bookingId={bookingResult.bookingId}
          title={title}
          date={date ? format(date, 'PPP', { locale: language === 'ru' ? ru : undefined }) : undefined}
          time={time}
          total={price}
          currency="THB"
          continuePath="/education"
          continueLabel={language === 'ru' ? 'К курсам' : 'Browse Courses'}
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

    const result = await createBooking({
      booking_type: 'service',
      scheduled_at: scheduledAt,
      total_amount: price,
      currency: 'THB',
      notes: `${isTutor ? 'Tutor' : 'Course'}: ${title}. Student age: ${studentAge}. ${message}`.trim(),
      items: [{
        item_type: isTutor ? 'tutor_lesson' : 'course_lesson',
        item_id: id || 'lesson',
        item_name: title,
        quantity: 1,
        unit_price: price,
        subtotal: price,
      }],
      participants: [{
        name: contactData.name,
        phone: contactData.phone,
        email: contactData.email,
        is_primary: true,
      }],
      payment: {
        amount: price,
        payment_method: paymentMethod,
      },
    });

    if (result.success) {
      setBookingResult({ success: true, bookingId: result.booking_id });
    }
  };

  const availableTimes = ["09:00", "10:00", "11:00", "14:00", "15:00", "16:00", "17:00", "18:00", "19:00"];

  return (
    <AppLayout showBottomNav={false}>
      <PageContainer className="pb-32">
        <PageHeader 
          title={language === 'ru' ? 'Запись на занятие' : 'Book a Lesson'} 
          showBack 
          fallbackPath="/education"
        />

        {/* Summary Card */}
        <div className="mt-4 mb-6">
          <BookingSummary
            title={title}
            subtitle={isTutor 
              ? (language === 'ru' ? data?.specialty_ru : data?.specialty_en)
              : undefined
            }
            date={date}
            time={time}
            price={price}
            sourceCurrency="THB"
          />
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

        {/* Contact Info */}
        <div className="bg-card rounded-xl border p-5 mb-4">
          <h3 className="font-semibold mb-4">
            {language === 'ru' ? 'Контактные данные' : 'Contact Information'}
          </h3>
          <BookingContactForm
            data={contactData}
            onChange={setContactData}
            showEmail
          />
          <div className="mt-4">
            <Label>{language === 'ru' ? 'Возраст ученика' : 'Student Age'}</Label>
            <Input
              value={studentAge}
              onChange={(e) => setStudentAge(e.target.value)}
              placeholder={language === 'ru' ? 'Например: 10 лет' : 'E.g.: 10 years'}
              className="mt-1"
            />
          </div>
        </div>

        {/* Additional Info */}
        <div className="bg-card rounded-xl border p-5 mb-4">
          <Label className="font-semibold mb-4 block">
            {language === 'ru' ? 'Дополнительно' : 'Additional Info'}
          </Label>
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder={language === 'ru' ? 'Уровень подготовки, цели обучения...' : 'Current level, learning goals...'}
            rows={3}
            className="mt-2"
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
            amount={price}
            currency="THB"
            showWallet
            showCash
          />
        </div>

        {/* Bottom Bar */}
        <BookingBottomBar
          total={price}
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
          disabled={!date || !time || !contactData.name || !contactData.phone}
          submitLabel={language === 'ru' ? 'Записаться' : 'Book Lesson'}
        />
      </PageContainer>
    </AppLayout>
  );
}
