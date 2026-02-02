import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { useBooking } from "@/hooks/useBooking";
import { AppLayout } from "@/components/layout/AppLayout";
import { PageContainer } from "@/components/uno/PageContainer";
import { PageHeader } from "@/components/uno/PageHeader";
import { 
  BookingDateTimeSelect, 
  BookingContactForm, 
  BookingPaymentSelect,
  BookingBottomBar,
  BookingConfirmation,
  AddressPickerInput,
  type ContactFormData,
  type PaymentMethod 
} from "@/components/booking";
import { addDays, format } from "date-fns";
import { ru } from "date-fns/locale";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Baby, Clock, Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

const babysitters: Record<string, { nameEn: string; nameRu: string; pricePerHour: number; image: string }> = {
  'bs-1': { nameEn: 'Anna Petrova', nameRu: 'Анна Петрова', pricePerHour: 500, image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100' },
  'bs-2': { nameEn: 'Maria Ivanova', nameRu: 'Мария Иванова', pricePerHour: 600, image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100' },
  'bs-3': { nameEn: 'Olga Smirnova', nameRu: 'Ольга Смирнова', pricePerHour: 400, image: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100' },
  'bs-4': { nameEn: 'Natalia Kozlova', nameRu: 'Наталья Козлова', pricePerHour: 800, image: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=100' },
};

export default function BabysitterBooking() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { language } = useLanguage();
  const { user, isLoading: authLoading } = useAuth();
  const { createBooking, isSubmitting } = useBooking();

  const babysitter = babysitters[id || 'bs-1'] || babysitters['bs-1'];

  // Form state
  const [date, setDate] = useState<Date | undefined>(addDays(new Date(), 1));
  const [time, setTime] = useState<string>("");
  const [hours, setHours] = useState<number>(3);
  const [address, setAddress] = useState<string>("");
  const [childrenCount, setChildrenCount] = useState<number>(1);
  const [childrenAges, setChildrenAges] = useState<string>("");
  const [contactData, setContactData] = useState<ContactFormData>({ name: "", phone: "" });
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cash");
  const [bookingResult, setBookingResult] = useState<{ success: boolean; bookingId?: string } | null>(null);

  const serviceFee = 100;
  const totalAmount = (babysitter.pricePerHour * hours) + serviceFee;

  const availableTimes = ["09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00", "18:00", "19:00", "20:00"];

  // Auth redirect
  if (!authLoading && !user) {
    navigate('/auth', { state: { from: `/babysitter/${id}/book` } });
    return null;
  }

  // Success state
  if (bookingResult?.success && bookingResult.bookingId) {
    return (
      <AppLayout>
        <BookingConfirmation
          bookingId={bookingResult.bookingId}
          title={language === 'ru' ? babysitter.nameRu : babysitter.nameEn}
          date={date ? format(date, 'PPP', { locale: language === 'ru' ? ru : undefined }) : undefined}
          time={`${time} (${hours}h)`}
          location={address}
          total={totalAmount}
          currency="THB"
          continuePath="/babysitter"
          continueLabel={language === 'ru' ? 'К няням' : 'Browse Babysitters'}
        />
      </AppLayout>
    );
  }

  const handleSubmit = async () => {
    if (!date || !time) return;
    if (!contactData.name || !contactData.phone || !address) return;

    const scheduledAt = new Date(date);
    const [h, m] = time.split(':').map(Number);
    scheduledAt.setHours(h, m, 0, 0);

    const items = [
      {
        item_type: 'service',
        item_id: id || 'bs-1',
        item_name: `${language === 'ru' ? babysitter.nameRu : babysitter.nameEn} (${hours}h)`,
        quantity: hours,
        unit_price: babysitter.pricePerHour,
        subtotal: babysitter.pricePerHour * hours,
      },
      {
        item_type: 'fee',
        item_id: 'service_fee',
        item_name: language === 'ru' ? 'Сервисный сбор' : 'Service fee',
        quantity: 1,
        unit_price: serviceFee,
        subtotal: serviceFee,
      },
    ];

    const result = await createBooking({
      booking_type: 'service',
      scheduled_at: scheduledAt,
      total_amount: totalAmount,
      currency: 'THB',
      notes: `${language === 'ru' ? 'Детей' : 'Children'}: ${childrenCount}. ${language === 'ru' ? 'Возраст' : 'Ages'}: ${childrenAges}. ${contactData.notes || ''}`,
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
      <PageContainer className="pb-40">
        <PageHeader 
          title={language === 'ru' ? 'Бронирование няни' : 'Book Babysitter'} 
          showBack 
        />

        {/* Babysitter Info */}
        <div className="flex items-center gap-3 p-4 bg-card rounded-xl border mt-4 mb-6">
          <img
            src={babysitter.image}
            alt={language === 'ru' ? babysitter.nameRu : babysitter.nameEn}
            className="w-14 h-14 rounded-full object-cover"
          />
          <div>
            <h3 className="font-semibold">
              {language === 'ru' ? babysitter.nameRu : babysitter.nameEn}
            </h3>
            <p className="text-sm text-muted-foreground">
              ฿{babysitter.pricePerHour}/{language === 'ru' ? 'час' : 'hour'}
            </p>
          </div>
        </div>

        {/* Date & Time */}
        <div className="bg-card rounded-2xl border p-5 mb-4">
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

        {/* Duration */}
        <div className="bg-card rounded-2xl border p-5 mb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-primary" />
              <span className="font-semibold">
                {language === 'ru' ? 'Продолжительность' : 'Duration'}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <Button 
                variant="outline" 
                size="icon" 
                onClick={() => setHours(Math.max(1, hours - 1))}
                disabled={hours <= 1}
              >
                <Minus className="w-4 h-4" />
              </Button>
              <span className="font-bold text-lg w-12 text-center">{hours}h</span>
              <Button 
                variant="outline" 
                size="icon"
                onClick={() => setHours(Math.min(12, hours + 1))}
                disabled={hours >= 12}
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Children Info */}
        <div className="bg-card rounded-2xl border p-5 mb-4">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <Baby className="w-5 h-5 text-primary" />
            {language === 'ru' ? 'Информация о детях' : 'Children Info'}
          </h3>
          <div className="space-y-4">
            <div>
              <Label>{language === 'ru' ? 'Количество детей' : 'Number of children'}</Label>
              <div className="flex items-center gap-3 mt-2">
                <Button 
                  variant="outline" 
                  size="icon" 
                  onClick={() => setChildrenCount(Math.max(1, childrenCount - 1))}
                  disabled={childrenCount <= 1}
                >
                  <Minus className="w-4 h-4" />
                </Button>
                <span className="font-bold text-lg w-8 text-center">{childrenCount}</span>
                <Button 
                  variant="outline" 
                  size="icon"
                  onClick={() => setChildrenCount(Math.min(5, childrenCount + 1))}
                  disabled={childrenCount >= 5}
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>
            <div>
              <Label>{language === 'ru' ? 'Возраст детей' : 'Children ages'}</Label>
              <Input
                value={childrenAges}
                onChange={(e) => setChildrenAges(e.target.value)}
                placeholder={language === 'ru' ? 'Например: 3 года, 5 лет' : 'e.g., 3 years, 5 years'}
                className="mt-2"
              />
            </div>
          </div>
        </div>

        {/* Address */}
        <div className="bg-card rounded-2xl border p-5 mb-4">
          <AddressPickerInput
            value={address}
            onChange={(addr) => setAddress(addr)}
            label={language === 'ru' ? 'Адрес' : 'Address'}
            placeholder={language === 'ru' ? 'Ваш адрес' : 'Your address'}
            type="service"
            required
          />
        </div>

        {/* Contact Info */}
        <div className="bg-card rounded-2xl border p-5 mb-4">
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
        <div className="bg-card rounded-2xl border p-5 mb-4">
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
        <div className="bg-card rounded-2xl border p-5 mb-4">
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">
                {language === 'ru' ? babysitter.nameRu : babysitter.nameEn} × {hours}h
              </span>
              <span>฿{(babysitter.pricePerHour * hours).toLocaleString()}</span>
            </div>
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

        {/* Bottom Bar */}
        <BookingBottomBar
          total={totalAmount}
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
          disabled={!date || !time || !contactData.name || !contactData.phone || !address}
          submitLabel={language === 'ru' ? 'Подтвердить бронь' : 'Confirm Booking'}
        />
      </PageContainer>
    </AppLayout>
  );
}
