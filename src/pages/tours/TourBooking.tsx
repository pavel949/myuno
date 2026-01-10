import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { useTour } from "@/hooks/useTours";
import { supabase } from "@/integrations/supabase/client";
import { AppLayout } from "@/components/layout/AppLayout";
import { PageContainer } from "@/components/uno/PageContainer";
import { PageHeader } from "@/components/uno/PageHeader";
import { LoadingSpinner } from "@/components/uno/LoadingSpinner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Users, Clock } from "lucide-react";
import { format, addDays } from "date-fns";

export default function TourBooking() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { language, t } = useLanguage();
  const { user, isLoading: authLoading } = useAuth();
  const { tour, isLoading } = useTour(id);
  const { toast } = useToast();

  const [date, setDate] = useState<Date | undefined>(addDays(new Date(), 1));
  const [startTime, setStartTime] = useState<string>("");
  const [participants, setParticipants] = useState(1);
  const [contactName, setContactName] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!authLoading && !user) { navigate('/auth', { state: { from: `/tours/${id}/book` } }); return null; }
  if (isLoading || authLoading) return <AppLayout showBottomNav={false}><div className="flex items-center justify-center min-h-screen"><LoadingSpinner size="lg" /></div></AppLayout>;
  if (!tour) return <AppLayout><PageContainer><div className="text-center py-12"><p>{t('tours.notFound')}</p></div></PageContainer></AppLayout>;

  const totalAmount = (tour.price || 0) * participants;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!date || !startTime || !contactName || !contactPhone) {
      toast({ title: t('message.error'), description: t('tours.fillAllFields'), variant: 'destructive' });
      return;
    }
    setIsSubmitting(true);
    try {
      const { error } = await supabase.from('tour_bookings').insert({
        tour_id: tour.id, user_id: user!.id, booking_date: format(date, 'yyyy-MM-dd'), start_time: startTime,
        participants, total_amount: totalAmount, currency: tour.currency, contact_name: contactName, contact_phone: contactPhone, status: 'pending',
      });
      if (error) throw error;
      toast({ title: t('message.success'), description: t('tours.bookingSent') });
      navigate('/bookings');
    } catch (error) {
      toast({ title: t('message.error'), description: t('tours.bookingFailed'), variant: 'destructive' });
    } finally { setIsSubmitting(false); }
  };

  return (
    <AppLayout showBottomNav={false}>
      <PageContainer>
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}><ArrowLeft className="w-5 h-5" /></Button>
          <PageHeader title={t('tours.booking')} />
        </div>

        <div className="bg-card rounded-xl p-4 mb-6 border flex gap-4">
          <img src={tour.cover_image || ''} alt="" className="w-20 h-20 rounded-lg object-cover" />
          <div>
            <h3 className="font-semibold">{language === 'ru' ? tour.title_ru : tour.title_en}</h3>
            <div className="flex gap-3 mt-2 text-sm text-muted-foreground">
              <span className="flex items-center gap-1"><Clock className="w-4 h-4" />{tour.duration_hours}h</span>
              <span className="flex items-center gap-1"><Users className="w-4 h-4" />{t('water.max')} {tour.max_participants}</span>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <Label className="text-base font-semibold mb-3 block">{t('label.date')}</Label>
            <div className="bg-card rounded-xl border p-4 flex justify-center">
              <Calendar 
                mode="single" 
                selected={date} 
                onSelect={setDate} 
                disabled={(d) => d < new Date()} 
              />
            </div>
          </div>

          <div>
            <Label>{t('label.time')}</Label>
            <Select value={startTime} onValueChange={setStartTime}>
              <SelectTrigger><SelectValue placeholder={t('tours.selectTime')} /></SelectTrigger>
              <SelectContent>{tour.start_times.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
            </Select>
          </div>

          <div>
            <Label>{t('tours.participants')}</Label>
            <div className="flex items-center gap-4 mt-2">
              <Button type="button" variant="outline" size="icon" onClick={() => setParticipants(Math.max(1, participants - 1))}>-</Button>
              <span className="text-xl font-semibold w-12 text-center">{participants}</span>
              <Button type="button" variant="outline" size="icon" onClick={() => setParticipants(Math.min(tour.max_participants, participants + 1))}>+</Button>
            </div>
          </div>

          <div className="space-y-4">
            <div><Label>{t('tours.name')} *</Label><Input value={contactName} onChange={(e) => setContactName(e.target.value)} required /></div>
            <div><Label>{t('tours.phone')} *</Label><Input type="tel" value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} required /></div>
          </div>

          <div className="bg-muted/50 rounded-xl p-4">
            <div className="flex justify-between font-semibold text-lg"><span>{t('tours.total')}</span><span className="text-primary">฿{totalAmount.toLocaleString()}</span></div>
          </div>

          <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
            {isSubmitting && <LoadingSpinner size="sm" className="mr-2" />}
            {t('tours.confirmBooking')}
          </Button>
        </form>
      </PageContainer>
    </AppLayout>
  );
}
