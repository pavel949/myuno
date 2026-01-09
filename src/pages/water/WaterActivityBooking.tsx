import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { useWaterActivity } from "@/hooks/useWaterActivities";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { AppLayout } from "@/components/layout/AppLayout";
import { PageContainer } from "@/components/uno/PageContainer";
import { PageHeader } from "@/components/uno/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { toast } from "sonner";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { CalendarIcon, Minus, Plus, Users, Clock, Shield } from "lucide-react";
import { cn } from "@/lib/utils";

export default function WaterActivityBooking() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { language } = useLanguage();
  const { user } = useAuth();
  const { activity, isLoading } = useWaterActivity(id);
  
  const [date, setDate] = useState<Date>();
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [participants, setParticipants] = useState(1);
  const [contactName, setContactName] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (isLoading || !activity) {
    return (
      <AppLayout>
        <PageContainer>
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-muted rounded w-3/4" />
            <div className="h-64 bg-muted rounded" />
          </div>
        </PageContainer>
      </AppLayout>
    );
  }

  const totalAmount = (activity.price || 0) * participants;

  const handleSubmit = async () => {
    if (!user) {
      toast.error(language === 'ru' ? 'Войдите в аккаунт' : 'Please login first');
      navigate('/auth');
      return;
    }

    if (!date || !selectedTime) {
      toast.error(language === 'ru' ? 'Выберите дату и время' : 'Select date and time');
      return;
    }

    if (!contactName || !contactPhone) {
      toast.error(language === 'ru' ? 'Заполните контактные данные' : 'Fill contact details');
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase.from('water_activity_bookings').insert({
        activity_id: activity.id,
        user_id: user.id,
        booking_date: format(date, 'yyyy-MM-dd'),
        start_time: selectedTime,
        participants,
        total_amount: totalAmount,
        currency: activity.currency,
        contact_name: contactName,
        contact_phone: contactPhone,
        contact_email: contactEmail,
        notes,
        status: 'pending',
      });

      if (error) throw error;

      toast.success(language === 'ru' ? 'Бронирование отправлено!' : 'Booking submitted!');
      navigate('/bookings');
    } catch (error) {
      console.error('Booking error:', error);
      toast.error(language === 'ru' ? 'Ошибка бронирования' : 'Booking failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AppLayout>
      <PageContainer className="pb-32">
        <PageHeader 
          title={language === 'ru' ? 'Бронирование' : 'Booking'}
          showBack
        />

        {/* Activity Summary */}
        <div className="bg-card rounded-2xl p-4 border mb-6 mt-4">
          <div className="flex gap-4">
            <img
              src={activity.cover_image || 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=200'}
              alt=""
              className="w-20 h-20 rounded-xl object-cover"
            />
            <div className="flex-1">
              <h3 className="font-semibold">
                {language === 'ru' ? activity.title_ru : activity.title_en}
              </h3>
              <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {activity.duration_minutes ? `${Math.round(activity.duration_minutes / 60)}h` : '-'}
                </span>
                <span className="flex items-center gap-1">
                  <Users className="w-3 h-3" />
                  max {activity.max_participants}
                </span>
                {activity.is_certified && (
                  <span className="flex items-center gap-1 text-primary">
                    <Shield className="w-3 h-3" />
                    {language === 'ru' ? 'Серт.' : 'Cert.'}
                  </span>
                )}
              </div>
              <p className="text-primary font-bold mt-2">
                ฿{activity.price?.toLocaleString()} / {activity.price_per}
              </p>
            </div>
          </div>
        </div>

        {/* Date Selection */}
        <div className="space-y-4 mb-6">
          <Label>{language === 'ru' ? 'Дата' : 'Date'}</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !date && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {date ? format(date, "PPP", { locale: language === 'ru' ? ru : undefined }) : (
                  language === 'ru' ? 'Выберите дату' : 'Pick a date'
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={date}
                onSelect={setDate}
                disabled={(date) => date < new Date()}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>

        {/* Time Selection */}
        <div className="space-y-4 mb-6">
          <Label>{language === 'ru' ? 'Время' : 'Time'}</Label>
          <div className="grid grid-cols-3 gap-2">
            {activity.available_times.map((time) => (
              <Button
                key={time}
                variant={selectedTime === time ? "default" : "outline"}
                className="w-full"
                onClick={() => setSelectedTime(time)}
              >
                {time}
              </Button>
            ))}
          </div>
        </div>

        {/* Participants */}
        <div className="space-y-4 mb-6">
          <Label>{language === 'ru' ? 'Участники' : 'Participants'}</Label>
          <div className="flex items-center justify-between bg-muted/50 rounded-xl p-4">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setParticipants(Math.max(activity.min_participants, participants - 1))}
              disabled={participants <= activity.min_participants}
            >
              <Minus className="w-4 h-4" />
            </Button>
            <span className="text-2xl font-bold">{participants}</span>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setParticipants(Math.min(activity.max_participants, participants + 1))}
              disabled={participants >= activity.max_participants}
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Contact Details */}
        <div className="space-y-4 mb-6">
          <Label>{language === 'ru' ? 'Контактные данные' : 'Contact Details'}</Label>
          <Input
            placeholder={language === 'ru' ? 'Имя' : 'Name'}
            value={contactName}
            onChange={(e) => setContactName(e.target.value)}
          />
          <Input
            placeholder={language === 'ru' ? 'Телефон' : 'Phone'}
            value={contactPhone}
            onChange={(e) => setContactPhone(e.target.value)}
          />
          <Input
            placeholder="Email"
            type="email"
            value={contactEmail}
            onChange={(e) => setContactEmail(e.target.value)}
          />
        </div>

        {/* Notes */}
        <div className="space-y-4 mb-6">
          <Label>{language === 'ru' ? 'Примечания' : 'Notes'}</Label>
          <Textarea
            placeholder={language === 'ru' ? 'Особые пожелания...' : 'Special requests...'}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>

        {/* Fixed Bottom */}
        <div className="fixed bottom-20 left-0 right-0 p-4 bg-background/95 backdrop-blur-sm border-t">
          <div className="flex items-center justify-between mb-3">
            <span className="text-muted-foreground">
              {language === 'ru' ? 'Итого' : 'Total'}
            </span>
            <span className="text-2xl font-bold text-primary">
              ฿{totalAmount.toLocaleString()}
            </span>
          </div>
          <Button 
            className="w-full h-12 text-base font-semibold" 
            onClick={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting 
              ? (language === 'ru' ? 'Отправка...' : 'Submitting...') 
              : (language === 'ru' ? 'Подтвердить бронирование' : 'Confirm Booking')}
          </Button>
        </div>
      </PageContainer>
    </AppLayout>
  );
}
