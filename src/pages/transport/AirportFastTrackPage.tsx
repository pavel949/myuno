import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { APP_ROUTES } from '@/lib/config/routes';
import { Plane, Shield, Clock, Plus, Minus, ChevronLeft, Loader2, Check, Star, Crown, Sparkles } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { useAirportServices, type AirportService } from '@/hooks/useAirportServices';
import { useBookingDraft } from '@/hooks/useBookingDraft';
import { TransferUpsellScreen } from '@/components/transport/TransferUpsellScreen';
import { cn } from '@/lib/utils';
import { z } from 'zod';
import { bangkokTodayISO, toBangkokDateKey } from '@/lib/hotelDates';
import { BookingField } from '@/components/booking/BookingField';
import { BookingStepProgress, type BookingStep } from '@/components/booking/BookingStepProgress';
import { AirportBookingLayout } from '@/components/booking/AirportBookingLayout';
import { FLIGHT_NUMBER_PATTERN, PHUKET_TIME_ZONE, REQUEST_EMAIL_PATTERN, isRequestPhone, phuketScheduledTime } from '@/lib/services/airportRequestValidation';
import { supabase } from '@/integrations/supabase/client';

// ─── Validation ───
const LATIN_REGEX = /^[a-zA-Z\s-'.]+$/;
const fastTrackSteps: BookingStep[] = [
  { id: 'service', labelEn: 'Flight & service', labelRu: 'Рейс и услуга', labelTh: 'เที่ยวบินและบริการ' },
  { id: 'passenger', labelEn: 'Passengers', labelRu: 'Пассажиры', labelTh: 'ผู้โดยสาร' },
  { id: 'review', labelEn: 'Review', labelRu: 'Проверка', labelTh: 'ตรวจสอบ' },
];

const passengerSchema = z.object({
  firstName: z.string().trim().min(1, 'Required').max(50).regex(LATIN_REGEX, 'Latin characters only'),
  lastName: z.string().trim().min(1, 'Required').max(50).regex(LATIN_REGEX, 'Latin characters only'),
  passportNumber: z.string().trim().min(5, 'Invalid passport').max(20),
  nationality: z.string().trim().min(2, 'Required').max(50),
  dateOfBirth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine(value => !!toBangkokDateKey(value) && value <= bangkokTodayISO()),
});

type PassengerData = z.infer<typeof passengerSchema>;

const emptyPassenger: PassengerData = {
  firstName: '',
  lastName: '',
  passportNumber: '',
  nationality: '',
  dateOfBirth: '',
};

type Direction = 'arrival' | 'departure';
type Language = 'en' | 'ru' | 'th';

// Tier icon mapping by service_type + sort_order patterns
const getTierIcon = (service: AirportService): React.ReactNode => {
  const sku = service.sku.toLowerCase();
  if (sku.includes('fc') || sku.includes('first')) return <Crown className="w-4 h-4" />;
  if (sku.includes('prem')) return <Star className="w-4 h-4" />;
  if (sku.includes('exec') || sku.includes('vip')) return <Shield className="w-4 h-4" />;
  if (sku.includes('bnd') || sku.includes('bundle')) return <Sparkles className="w-4 h-4" />;
  return <Shield className="w-4 h-4" />;
};

export default function AirportFastTrackPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const stepRef = useRef<HTMLDivElement>(null);
  const submitLock = useRef(false);
  const { language } = useLanguage();
  const { user } = useAuth();
  const tr = (en: string, ru: string, th: string) => language === 'th' ? th : language === 'ru' ? ru : en;
  const isRu = language === 'ru';

  // White-label: fetch ALL services (no supplier filter), supplier routing is internal
  const { fastTrackServices, addons, bundles, isLoading, error: catalogueError, refetch } = useAirportServices('HKT');

  // ─── Form State ───
  const [direction, setDirection] = useState<Direction>('arrival');
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(null);
  const [flightNumber, setFlightNumber] = useState('');
  const [airline, setAirline] = useState('');
  const [flightDate, setFlightDate] = useState('');
  const [flightTime, setFlightTime] = useState('');
  const [contactWhatsapp, setContactWhatsapp] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [preferredLang, setPreferredLang] = useState<Language>(language);
  const [specialNotes, setSpecialNotes] = useState('');
  const [passengers, setPassengers] = useState<PassengerData[]>([{ ...emptyPassenger }]);
  const [selectedAddons, setSelectedAddons] = useState<Set<string>>(new Set());
  const [validatedStep, setValidatedStep] = useState<'passenger' | 'review' | null>(null);
  const [step, setStep] = useState<'service' | 'passenger' | 'review'>('service');
  const [showUpsell, setShowUpsell] = useState(false);
  const [submissionError, setSubmissionError] = useState(false);

  // Persist the whole form so a guest who is bounced to /auth (and returned via
  // ?redirect) — or who simply refreshes — doesn't lose passport data they typed.
  // selectedAddons is a Set, so it's (de)serialized as an array.
  const { clear: clearDraft } = useBookingDraft(
    'fasttrack_airport',
    {
      direction, selectedServiceId, flightNumber, airline, flightDate, flightTime,
      contactWhatsapp, contactEmail, preferredLang, specialNotes,
      passengers, selectedAddons: Array.from(selectedAddons), step,
    },
    (draft) => {
      if (draft.direction) setDirection(draft.direction as Direction);
      if (draft.selectedServiceId !== undefined) setSelectedServiceId((draft.selectedServiceId as string | null) ?? null);
      if (typeof draft.flightNumber === 'string') setFlightNumber(draft.flightNumber);
      if (typeof draft.airline === 'string') setAirline(draft.airline);
      if (typeof draft.flightDate === 'string') setFlightDate(draft.flightDate);
      if (typeof draft.flightTime === 'string') setFlightTime(draft.flightTime);
      if (typeof draft.contactWhatsapp === 'string') setContactWhatsapp(draft.contactWhatsapp);
      if (typeof draft.contactEmail === 'string') setContactEmail(draft.contactEmail);
      if (draft.preferredLang) setPreferredLang(draft.preferredLang as Language);
      if (typeof draft.specialNotes === 'string') setSpecialNotes(draft.specialNotes);
      if (Array.isArray(draft.passengers) && draft.passengers.length) setPassengers(draft.passengers as PassengerData[]);
      if (Array.isArray(draft.selectedAddons)) setSelectedAddons(new Set(draft.selectedAddons as string[]));
      if (draft.step === 'service' || draft.step === 'passenger' || draft.step === 'review') setStep(draft.step);
    },
  );

  // ─── Derived ───
  const directionServices = useMemo(() => {
    return fastTrackServices.filter(s => s.direction === direction || s.direction === 'both');
  }, [fastTrackServices, direction]);

  const availableAddons = useMemo(() => {
    return addons.filter(a => a.direction === direction || a.direction === 'both');
  }, [addons, direction]);

  const availableBundles = useMemo(() => {
    return bundles.filter(b => b.direction === direction || b.direction === 'both');
  }, [bundles, direction]);

  const selectedService = [...directionServices, ...availableBundles].find(service => service.id === selectedServiceId);
  const selectedCurrency = selectedService?.currency;
  const compatibleAddons = availableAddons.filter(addon => !selectedCurrency || addon.currency === selectedCurrency);
  const selectedCompatibleAddons = compatibleAddons.filter(addon => selectedAddons.has(addon.id));
  const selectService = (id: string) => {
    setSelectedServiceId(id);
    if (id !== selectedServiceId) setSelectedAddons(new Set());
  };

  const isNightFlight = useMemo(() => {
    if (!flightTime) return false;
    const hour = parseInt(flightTime.split(':')[0], 10);
    return hour >= 0 && hour < 6;
  }, [flightTime]);

  const scheduledFlight = phuketScheduledTime(flightDate, flightTime);
  const cutoffHours = selectedService?.cutoff_hours ?? 24;
  const cutoffViolated = !!(flightDate && flightTime) && (scheduledFlight === undefined || scheduledFlight < Date.now() + cutoffHours * 3_600_000);

  const base = selectedService ? Number(selectedService.base_price) * passengers.length : 0;
  const nightSurcharge = isNightFlight && selectedService ? Number(selectedService.night_surcharge || 0) * passengers.length : 0;
  const addonsTotal = selectedCompatibleAddons.reduce((total, addon) => total + Number(addon.base_price), 0);
  const pricing = { base, nightSurcharge, addonsTotal, total: base + nightSurcharge + addonsTotal };

  // Reset service selection when direction changes
  const handleDirectionChange = (d: Direction) => {
    if (d === direction) return;
    setDirection(d);
    setSelectedServiceId(null);
    setSelectedAddons(new Set());
  };

  // ─── Handlers ───
  const addPassenger = () => {
    if (passengers.length < (selectedService?.max_passengers || 10)) {
      setPassengers(prev => [...prev, { ...emptyPassenger }]);
    }
  };

  const removePassenger = (index: number) => {
    if (passengers.length > 1) {
      setPassengers(prev => prev.filter((_, i) => i !== index));
    }
  };

  const updatePassenger = (index: number, field: keyof PassengerData, value: string) => {
    setPassengers(prev => prev.map((p, i) => i === index ? { ...p, [field]: value } : p));
  };

  const toggleAddon = (addonId: string) => {
    setSelectedAddons(prev => {
      const next = new Set(prev);
      if (next.has(addonId)) next.delete(addonId);
      else next.add(addonId);
      return next;
    });
  };

  const getValidationErrors = (targetStep: 'passenger' | 'review') => {
    const newErrors: Record<string, string> = {};

    if (!selectedService || !Number.isFinite(pricing.total) || pricing.total < 0) newErrors.service = tr('Select a service', 'Выберите услугу', 'เลือกบริการ');
    if (!FLIGHT_NUMBER_PATTERN.test(flightNumber.trim())) newErrors.flightNumber = tr('Enter a flight number such as TG123', 'Укажите номер рейса, например TG123', 'กรอกหมายเลขเที่ยวบิน เช่น TG123');
    if (!/^\d{4}-\d{2}-\d{2}$/.test(flightDate) || !toBangkokDateKey(flightDate)) newErrors.flightDate = tr('Enter the flight date', 'Укажите дату рейса', 'กรอกวันที่เที่ยวบิน');
    if (!flightTime || (flightDate && scheduledFlight === undefined)) newErrors.flightTime = tr('Enter the flight time', 'Укажите время рейса', 'กรอกเวลาเที่ยวบิน');
    if (scheduledFlight !== undefined && scheduledFlight < Date.now() + cutoffHours * 3_600_000) {
      newErrors.flightDate = tr(`Request at least ${cutoffHours} hours ahead`, `Подайте заявку минимум за ${cutoffHours} ч`, `ส่งคำขอล่วงหน้าอย่างน้อย ${cutoffHours} ชั่วโมง`);
    }
    if (selectedService && passengers.length > selectedService.max_passengers) {
      newErrors.service = tr('The selected service cannot accommodate this group', 'Выбранная услуга не рассчитана на эту группу', 'บริการที่เลือกไม่รองรับจำนวนผู้โดยสารกลุ่มนี้');
    }
    if (targetStep === 'review') {
      passengers.forEach((passenger, index) => {
        const result = passengerSchema.safeParse(passenger);
        if (!result.success) {
          result.error.issues.forEach(issue => {
            newErrors[`passenger_${index}_${String(issue.path[0])}`] = tr('Check this value', 'Проверьте значение', 'ตรวจสอบข้อมูลนี้');
          });
        }
      });
      if (!contactWhatsapp.trim() && !contactEmail.trim()) {
        newErrors.contactWhatsapp = tr('Enter WhatsApp or email', 'Укажите WhatsApp или email', 'กรอก WhatsApp หรืออีเมล');
      } else if (contactWhatsapp.trim() && !isRequestPhone(contactWhatsapp)) {
        newErrors.contactWhatsapp = tr('Include the country code', 'Укажите номер с кодом страны', 'กรอกหมายเลขพร้อมรหัสประเทศ');
      }
      if (contactEmail.trim() && !REQUEST_EMAIL_PATTERN.test(contactEmail.trim())) {
        newErrors.contactEmail = tr('Enter a valid email', 'Укажите корректный email', 'กรอกอีเมลที่ถูกต้อง');
      }
    }

    return newErrors;
  };

  const errors = validatedStep ? getValidationErrors(validatedStep) : {};

  const validateStep = (targetStep: 'passenger' | 'review'): boolean => {
    const firstError = Object.keys(getValidationErrors(targetStep))[0];
    setValidatedStep(targetStep);
    if (firstError) {
      const target = firstError.startsWith('passenger_') || firstError.startsWith('contact') ? 'passenger' : 'service';
      setStep(target);
      requestAnimationFrame(() => (document.getElementById(`fasttrack-${firstError}`) || stepRef.current)?.focus());
    }
    return !firstError;
  };

  useEffect(() => {
    if (step !== 'service') stepRef.current?.focus();
  }, [step]);

  const handleNext = () => {
    if (step === 'service') {
      if (validateStep('passenger')) setStep('passenger');
    } else if (step === 'passenger') {
      if (validateStep('review')) setStep('review');
    }
  };

  const handleBack = () => {
    if (step === 'passenger') setStep('service');
    else if (step === 'review') setStep('passenger');
    else navigate(APP_ROUTES.TRANSPORT);
  };

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (submitLock.current || !validateStep('review') || !selectedService) return;
    if (!user) {
      // Draft is already persisted in sessionStorage; send the guest to /auth
      // with a return path so they land back here and the form restores.
      toast.error(isRu ? 'Войдите в аккаунт' : 'Please sign in');
      navigate(`/auth?redirect=${encodeURIComponent(location.pathname + location.search)}`);
      return;
    }
    submitLock.current = true;
    setSubmissionError(false);
    setIsSubmitting(true);
    try {
      const serviceName = isRu ? selectedService.name_ru : selectedService.name_en;

      const { data, error } = await supabase.functions.invoke('notify-fasttrack-booking', {
        body: {
          user_id: user.id,
          service_id: selectedService.id,
          service_name: serviceName,
          direction,
          flight_number: flightNumber.trim(),
          airline: airline || undefined,
          flight_date: flightDate,
          flight_time: flightTime,
          is_night_flight: isNightFlight,
          contact_whatsapp: contactWhatsapp.trim() || undefined,
          contact_email: contactEmail.trim() || undefined,
          preferred_language: preferredLang,
          special_notes: specialNotes || undefined,
          base_price: pricing.base,
          night_surcharge: pricing.nightSurcharge,
          addons_total: pricing.addonsTotal,
          total_price: pricing.total,
          currency: selectedService.currency || 'THB',
          passengers: passengers.map((p, i) => ({
            first_name: p.firstName,
            last_name: p.lastName,
            passport_number: p.passportNumber,
            nationality: p.nationality,
            date_of_birth: p.dateOfBirth,
            is_primary: i === 0,
          })),
          addon_ids: selectedCompatibleAddons.map(addon => addon.id),
          addon_names: selectedCompatibleAddons.map(addon => isRu ? addon.name_ru : addon.name_en),
        },
      });

      if (error || data?.success !== true || !data.booking_id) throw error || new Error(data?.error || "Booking was not accepted");

      toast(tr('Request received', 'Заявка получена', 'ได้รับคำขอแล้ว'), {
        description: isRu ? 'Мы свяжемся с вами для подтверждения' : "We'll contact you to confirm",
      });

      clearDraft();

      if (direction === 'arrival') {
        setShowUpsell(true);
      } else {
        navigate('/bookings');
      }
    } catch (err) {
      console.error('Fast Track submission could not be confirmed:', err);
      setSubmissionError(true);
    } finally {
      submitLock.current = false;
      setIsSubmitting(false);
    }
  };

  const handleTransferSelect = (vehicleType: string) => {
    navigate(`/transport/airport-transfer?from=fast-track&vehicle=${vehicleType}&date=${flightDate}&time=${flightTime}`);
  };

  const handleUpsellSkip = () => {
    navigate('/bookings');
  };

  const minDate = bangkokTodayISO(new Date(Date.now() + cutoffHours * 3_600_000));
  const formatPrice = (amount: number, currency: string) => `${currency || 'THB'} ${amount.toLocaleString(language)}`;
  const currentStep = fastTrackSteps.findIndex(item => item.id === step);

  const getIncludes = (service: AirportService): string[] => {
    const raw = service.includes_items;
    if (Array.isArray(raw)) return raw;
    return [];
  };

  if (catalogueError && !isLoading) {
    return (
      <AppLayout title="Fast Track" showBottomNav={false}>
        <div className="ds-frame ds-frame-article space-y-4 p-4">
          <p role="alert">{tr('Could not load Fast Track services', 'Не удалось загрузить услуги Fast Track', 'โหลดบริการ Fast Track ไม่สำเร็จ')}</p>
          <Button onClick={() => void refetch()}>{tr('Try again', 'Повторить', 'ลองอีกครั้ง')}</Button>
        </div>
      </AppLayout>
    );
  }

  if (isLoading) {
    return (
      <AppLayout title="Fast Track" showBottomNav={false}>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="Fast Track" showBottomNav={false} usePageContainer={false}>
      <AirportBookingLayout
        variant="fast-track"
        title="Fast Track"
        airport={tr('Phuket Airport (HKT)', 'Аэропорт Пхукета (HKT)', 'สนามบินภูเก็ต (HKT)')}
        back={
          <Button variant="ghost" size="sm" className="min-h-11 gap-1" disabled={isSubmitting} onClick={handleBack}>
            <ChevronLeft className="w-4 h-4" />
            {tr('Back', 'Назад', 'ย้อนกลับ')}
          </Button>
        }
        progress={<BookingStepProgress steps={fastTrackSteps} currentStep={currentStep} />}
        summary={<>
          {cutoffViolated && step !== 'service' && <p role="alert" className="text-sm text-destructive">{tr(`Request at least ${cutoffHours} hours ahead`, `Подайте заявку минимум за ${cutoffHours} ч`, `ส่งคำขอล่วงหน้าอย่างน้อย ${cutoffHours} ชั่วโมง`)}</p>}
          <div>
            <p className="text-xs text-muted-foreground">{isRu ? 'Итого' : 'Total'}</p>
            {selectedService ? <span className="text-2xl font-semibold tabular-nums">{formatPrice(pricing.total, selectedService.currency)}</span> : <span className="text-sm font-medium text-muted-foreground">{isRu ? "Выберите услугу" : "Select a service"}</span>}
          </div>
          {submissionError && <p role="alert" className="text-sm text-destructive">{tr(
            'We could not verify receipt. Open My Bookings or contact myUNO before sending again.',
            'Не удалось подтвердить получение. Проверьте «Мои бронирования» или свяжитесь с myUNO перед повторной отправкой.',
            'ยืนยันการรับคำขอไม่ได้ โปรดตรวจสอบการจองของฉันหรือติดต่อ myUNO ก่อนส่งอีกครั้ง',
          )} <a className="underline" href="/bookings">{tr('My bookings', 'Мои бронирования', 'การจองของฉัน')}</a></p>}
          {step === 'review' ? (
            <Button onClick={handleSubmit} className="text-base font-semibold" disabled={cutoffViolated || isSubmitting || showUpsell || submissionError}>
              {isSubmitting
                ? tr('Sending…', 'Отправка…', 'กำลังส่ง…')
                : tr('Send request', 'Отправить заявку', 'ส่งคำขอ')}
            </Button>
          ) : (
            <Button onClick={handleNext} className="text-base font-semibold" disabled={isSubmitting}>
              {tr('Continue', 'Далее', 'ถัดไป')}
            </Button>
          )}
        </>}
      >
        <div ref={stepRef} tabIndex={-1} className="scroll-mt-24 focus:outline-none">
        {/* ═══ Step 1: Service (white-label — no supplier names) ═══ */}
        {step === 'service' && (
          <div className="space-y-5">
            {/* Direction */}
            <div className="space-y-2">
              <Label>{isRu ? 'Направление' : 'Direction'}</Label>
              <div className="grid grid-cols-2 gap-2">
                {(['arrival', 'departure'] as Direction[]).map(d => (
                  <button
                    key={d}
                    type="button"
                    aria-pressed={direction === d}
                    onClick={() => handleDirectionChange(d)}
                    className={cn(
                      "p-3 rounded-none border-2 text-center transition-all",
                      direction === d
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/30"
                    )}
                  >
                    <Plane className={cn("w-5 h-5 mx-auto mb-1", d === 'departure' && "rotate-45")} />
                    <span className="text-sm font-medium">
                      {d === 'arrival'
                        ? tr('Arrival', 'Прилёт', 'ขาเข้า')
                        : tr('Departure', 'Вылет', 'ขาออก')}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <h2 className="font-semibold">{tr('Flight details', 'Данные рейса', 'ข้อมูลเที่ยวบิน')}</h2>
              <p className="text-sm text-muted-foreground">{tr('Phuket local time', 'Местное время Пхукета', 'เวลาท้องถิ่นภูเก็ต')} ({PHUKET_TIME_ZONE})</p>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <BookingField id="fasttrack-flightNumber" label={tr('Flight number', 'Номер рейса', 'หมายเลขเที่ยวบิน')} error={errors.flightNumber}>
                  <Input id="fasttrack-flightNumber" value={flightNumber} onChange={e => setFlightNumber(e.target.value.toUpperCase())} aria-invalid={!!errors.flightNumber} aria-describedby={errors.flightNumber ? 'fasttrack-flightNumber-error' : undefined} placeholder="TG123" />
                </BookingField>
                <BookingField id="fasttrack-airline" label={tr('Airline (optional)', 'Авиакомпания (необязательно)', 'สายการบิน (ไม่บังคับ)')}>
                  <Input id="fasttrack-airline" value={airline} onChange={e => setAirline(e.target.value)} />
                </BookingField>
                <BookingField id="fasttrack-flightDate" label={tr('Flight date', 'Дата рейса', 'วันที่เที่ยวบิน')} error={errors.flightDate}>
                  <Input id="fasttrack-flightDate" type="date" min={minDate} value={flightDate} onChange={e => setFlightDate(e.target.value)} aria-invalid={!!errors.flightDate} aria-describedby={errors.flightDate ? 'fasttrack-flightDate-error' : undefined} />
                </BookingField>
                <BookingField id="fasttrack-flightTime" label={tr('Flight time', 'Время рейса', 'เวลาเที่ยวบิน')} error={errors.flightTime}>
                  <Input id="fasttrack-flightTime" type="time" value={flightTime} onChange={e => setFlightTime(e.target.value)} aria-invalid={!!errors.flightTime} aria-describedby={errors.flightTime ? 'fasttrack-flightTime-error' : undefined} />
                </BookingField>
              </div>
              {isNightFlight && !cutoffViolated && selectedService && Number(selectedService.night_surcharge) > 0 && (
                <div className="flex items-center gap-2 p-3 rounded-none bg-accent text-accent-foreground text-sm">
                  <Clock className="w-4 h-4 shrink-0" />
                  {isRu
                    ? `Ночной рейс — доплата ${selectedService.currency} ${selectedService.night_surcharge}/чел.`
                    : `Night flight — surcharge ${selectedService.currency} ${selectedService.night_surcharge}/pax`}
                </div>
              )}
            </div>

            <div id="fasttrack-service" tabIndex={-1} className="space-y-2">
              <h2 className="font-semibold">{tr('Select a service', 'Выберите услугу', 'เลือกบริการ')}</h2>
              {errors.service && <p role="alert" className="text-sm text-destructive">{errors.service}</p>}
              {directionServices.length === 0 && availableBundles.length === 0 && <p className="text-sm text-muted-foreground">{tr('No Fast Track packages are listed for this direction.', 'Для этого направления нет опубликованных пакетов Fast Track.', 'ไม่มีแพ็กเกจ Fast Track ที่แสดงสำหรับเส้นทางนี้')}</p>}
              <div className="airport-booking__service-options">
                {directionServices.map(service => {
                  const includes = getIncludes(service);
                  const isSelected = selectedServiceId === service.id;
                  return (
                    <button
                      key={service.id}
                      type="button"
                      aria-pressed={isSelected}
                      onClick={() => selectService(service.id)}
                      className={cn(
                        "w-full min-w-0 p-4 rounded-none border-2 text-left transition-all",
                        isSelected
                          ? "border-primary bg-primary/5 shadow-sm"
                          : "border-border hover:border-primary/30"
                      )}
                    >
                      <div className="flex items-start justify-between gap-3 mb-2 min-w-0">
                        <div className="flex items-start gap-2 min-w-0 flex-1">
                          <div className={cn(
                            "w-8 h-8 rounded-none flex items-center justify-center shrink-0",
                            isSelected ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                          )}>
                            {getTierIcon(service)}
                          </div>
                          <h3 className="font-semibold text-sm leading-snug min-w-0 break-words">
                            {isRu ? service.name_ru : service.name_en}
                          </h3>
                        </div>
                        <span className="shrink-0 whitespace-nowrap text-sm font-semibold tabular-nums">{formatPrice(Number(service.base_price), service.currency)}</span>
                      </div>
                      <p className="text-xs text-muted-foreground mb-2">
                        {isRu ? service.description_ru : service.description_en}
                      </p>
                      {includes.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {includes.slice(0, 4).map((item, idx) => (
                            <Badge key={idx} variant="outline" className="text-[10px] font-normal">
                              <Check className="w-2.5 h-2.5 mr-0.5" />
                              {item}
                            </Badge>
                          ))}
                          {includes.length > 4 && (
                            <Badge variant="outline" className="text-[10px] font-normal">
                              +{includes.length - 4}
                            </Badge>
                          )}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Add-ons */}
            {compatibleAddons.length > 0 && (
              <div className="space-y-2">
                <Label>{isRu ? 'Дополнительные услуги' : 'Add-ons'}</Label>
                {compatibleAddons.map(addon => (
                  <button
                    key={addon.id}
                    type="button"
                    aria-pressed={selectedAddons.has(addon.id)}
                    onClick={() => toggleAddon(addon.id)}
                    className={cn(
                      "w-full p-3 rounded-none border-2 flex items-center gap-3 text-left transition-all",
                      selectedAddons.has(addon.id)
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/30"
                    )}
                  >
                    <span className="text-xl">{addon.icon || '✦'}</span>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm">{isRu ? addon.name_ru : addon.name_en}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {isRu ? addon.description_ru : addon.description_en}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="font-mono tabular-nums">{formatPrice(addon.base_price, addon.currency)}</span>
                      {selectedAddons.has(addon.id) && <Check className="w-4 h-4 text-primary ml-auto" />}
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* Bundles */}
            {availableBundles.length > 0 && (
              <div className="space-y-2">
                <Label>{isRu ? 'Пакетные предложения' : 'Bundle offers'}</Label>
                {availableBundles.map(bundle => {
                  const includes = getIncludes(bundle);
                  const isSelected = selectedServiceId === bundle.id;
                  return (
                    <button
                      key={bundle.id}
                      type="button"
                      aria-pressed={isSelected}
                      onClick={() => selectService(bundle.id)}
                      className={cn(
                        "w-full p-4 rounded-none border-2 text-left transition-all relative overflow-hidden",
                        isSelected
                          ? "border-primary bg-primary/5 shadow-sm"
                          : "border-border hover:border-primary/30"
                      )}
                    >
                      <div className="absolute top-0 right-0 bg-primary text-primary-foreground text-[10px] font-bold px-2 py-0.5 rounded-none">
                        {isRu ? 'ВЫГОДА' : 'SAVE'}
                      </div>
                      <div className="flex items-start justify-between gap-3 mb-2 min-w-0">
                        <h3 className="font-semibold text-sm leading-tight pr-12">
                          {isRu ? bundle.name_ru : bundle.name_en}
                        </h3>
                        <span className="font-mono tabular-nums">{formatPrice(bundle.base_price, bundle.currency)}</span>
                      </div>
                      <p className="text-xs text-muted-foreground mb-2">
                        {isRu ? bundle.description_ru : bundle.description_en}
                      </p>
                      {includes.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {includes.map((item, idx) => (
                            <Badge key={idx} variant="outline" className="text-[10px] font-normal">
                              <Check className="w-2.5 h-2.5 mr-0.5" />
                              {item}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Passengers count */}
            <div className="space-y-2">
              <Label>{isRu ? 'Количество пассажиров' : 'Number of passengers'}</Label>
              <div className="flex items-center gap-3">
                <Button variant="outline" size="icon" aria-label={isRu ? 'Убрать пассажира' : 'Remove passenger'} onClick={removePassenger.bind(null, passengers.length - 1)} disabled={passengers.length <= 1}>
                  <Minus className="w-4 h-4" />
                </Button>
                <span className="text-lg font-semibold w-8 text-center">{passengers.length}</span>
                <Button variant="outline" size="icon" aria-label={isRu ? 'Добавить пассажира' : 'Add passenger'} onClick={addPassenger} disabled={passengers.length >= (selectedService?.max_passengers || 10)}>
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* ═══ Step 2: Passengers ═══ */}
        {step === 'passenger' && (
          <div className="space-y-5">
            {passengers.map((pax, i) => (
              <div key={i} className="p-4 rounded-md border bg-card space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-sm">
                    {isRu ? `Пассажир ${i + 1}` : `Passenger ${i + 1}`}
                    {i === 0 && <Badge variant="secondary" className="ml-2 text-[10px]">{isRu ? 'Основной' : 'Primary'}</Badge>}
                  </h3>
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {([
                    ['firstName', tr('First name (Latin)', 'Имя (лат.)', 'ชื่อ (อักษรละติน)')],
                    ['lastName', tr('Last name (Latin)', 'Фамилия (лат.)', 'นามสกุล (อักษรละติน)')],
                    ['passportNumber', tr('Passport number', 'Номер паспорта', 'หมายเลขหนังสือเดินทาง')],
                    ['nationality', tr('Nationality', 'Гражданство', 'สัญชาติ')],
                    ['dateOfBirth', tr('Date of birth', 'Дата рождения', 'วันเกิด')],
                  ] as const).map(([field, label]) => {
                    const key = `passenger_${i}_${field}`;
                    const id = `fasttrack-${key}`;
                    const error = errors[key];
                    return (
                      <BookingField key={field} id={id} label={label} error={error}>
                        <Input id={id}
                          type={field === 'dateOfBirth' ? 'date' : 'text'}
                          max={field === 'dateOfBirth' ? bangkokTodayISO() : undefined}
                          value={pax[field]}
                          onChange={e => updatePassenger(i, field, e.target.value)}
                          aria-invalid={!!error}
                          aria-describedby={error ? `${id}-error` : undefined}
                        />
                      </BookingField>
                    );
                  })}
                </div>
              </div>
            ))}

            <Separator />

            {/* Contact */}
            <div className="space-y-3">
              <Label>{isRu ? 'Контакт' : 'Contact'}</Label>
              <BookingField id="fasttrack-contactWhatsapp" label="WhatsApp" error={errors.contactWhatsapp}>
                <Input id="fasttrack-contactWhatsapp" type="tel" autoComplete="tel" value={contactWhatsapp} onChange={e => setContactWhatsapp(e.target.value)} aria-invalid={!!errors.contactWhatsapp} aria-describedby={errors.contactWhatsapp ? 'fasttrack-contactWhatsapp-error' : undefined} />
              </BookingField>
              <BookingField id="fasttrack-contactEmail" label={tr('Email', 'Email', 'อีเมล')} error={errors.contactEmail}>
                <Input id="fasttrack-contactEmail" type="email" autoComplete="email" value={contactEmail} onChange={e => setContactEmail(e.target.value)} aria-invalid={!!errors.contactEmail} aria-describedby={errors.contactEmail ? 'fasttrack-contactEmail-error' : undefined} />
              </BookingField>
              <div>
                <Label className="text-xs">{isRu ? 'Язык общения' : 'Preferred language'}</Label>
                <div className="flex gap-2 mt-1">
                  {(['en', 'ru', 'th'] as Language[]).map(lang => (
                    <button
                      key={lang}
                      type="button"
                      onClick={() => setPreferredLang(lang)}
                      className={cn(
                        "px-3 py-1.5 rounded-none border text-sm font-medium transition-all",
                        preferredLang === lang ? "border-primary bg-primary/10 text-primary" : "border-border"
                      )}
                    >
                      {lang.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>
              <Textarea
                placeholder={isRu ? 'Особые пожелания (необязательно)' : 'Special notes (optional)'}
                value={specialNotes}
                onChange={e => setSpecialNotes(e.target.value)}
                rows={2}
              />
            </div>
          </div>
        )}

        {/* ═══ Step 3: Review — white-label, no supplier name shown ═══ */}
        {step === 'review' && selectedService && (
          <div className="space-y-4">
            <div className="p-4 rounded-md border bg-card space-y-3">
              <div className="flex items-center gap-2 mb-1">
                <Shield className="w-4 h-4 text-primary" />
                <span className="text-xs text-muted-foreground font-medium">myUNO Airport VIP</span>
              </div>
              <h3 className="font-semibold">{isRu ? 'Детали бронирования' : 'Booking Summary'}</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{isRu ? 'Услуга' : 'Service'}</span>
                  <span className="text-right font-medium">{isRu ? selectedService.name_ru : selectedService.name_en}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{isRu ? 'Рейс' : 'Flight'}</span>
                  <span>{flightNumber} · {flightDate} {flightTime} ({PHUKET_TIME_ZONE})</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{isRu ? 'Пассажиры' : 'Passengers'}</span>
                  <span>{passengers.length}</span>
                </div>
                {passengers.map((p, i) => (
                  <div key={i} className="text-xs text-muted-foreground pl-4">
                    {p.firstName} {p.lastName}
                  </div>
                ))}
              </div>

              <Separator />

              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span>{isRu ? 'Базовая стоимость' : 'Base price'} × {passengers.length}</span>
                  <span className="font-mono tabular-nums">{formatPrice(pricing.base, selectedService.currency)}</span>
                </div>
                {pricing.nightSurcharge > 0 && (
                  <div className="flex justify-between text-accent-foreground">
                    <span>{isRu ? 'Ночная доплата' : 'Night surcharge'}</span>
                    <span>+{selectedService.currency} {pricing.nightSurcharge.toLocaleString()}</span>
                  </div>
                )}
                {pricing.addonsTotal > 0 && (
                  <div className="flex justify-between">
                    <span>{isRu ? 'Доп. услуги' : 'Add-ons'}</span>
                    <span>+{selectedService.currency} {pricing.addonsTotal.toLocaleString()}</span>
                  </div>
                )}
                <Separator />
                <div className="flex justify-between font-bold text-base">
                  <span>{isRu ? 'Итого' : 'Total'}</span>
                  <span className="font-mono tabular-nums">{formatPrice(pricing.total, selectedService.currency)}</span>
                </div>
              </div>
            </div>
          </div>
        )}
        </div>
      </AirportBookingLayout>

      {/* Transfer Upsell Overlay */}
      {showUpsell && (
        <TransferUpsellScreen
          flightDate={flightDate}
          flightTime={flightTime}
          direction={direction}
          onSkip={handleUpsellSkip}
          onSelectTransfer={handleTransferSelect}
        />
      )}
    </AppLayout>
  );
}
