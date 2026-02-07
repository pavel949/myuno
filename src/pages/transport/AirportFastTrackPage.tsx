import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plane, Shield, Clock, Users, Plus, Minus, ChevronLeft, Loader2, AlertCircle, Check } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { useAirportServices, type AirportService } from '@/hooks/useAirportServices';
import { cn } from '@/lib/utils';
import { z } from 'zod';
import { addDays, format, parse, isAfter } from 'date-fns';

// ─── Validation ───
const LATIN_REGEX = /^[a-zA-Z\s\-'.]+$/;
const FLIGHT_REGEX = /^[A-Z0-9]{2,3}\s?\d{1,4}$/i;

const passengerSchema = z.object({
  firstName: z.string().trim().min(1, 'Required').max(50).regex(LATIN_REGEX, 'Latin characters only'),
  lastName: z.string().trim().min(1, 'Required').max(50).regex(LATIN_REGEX, 'Latin characters only'),
  passportNumber: z.string().trim().min(5, 'Invalid passport').max(20),
  nationality: z.string().trim().min(2, 'Required').max(50),
  dateOfBirth: z.string().min(1, 'Required'),
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

export default function AirportFastTrackPage() {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const { user } = useAuth();
  const { toast } = useToast();
  const isRu = language === 'ru';

  const { fastTrackServices, addons, bundles, isLoading } = useAirportServices();

  // ─── Form State ───
  const [direction, setDirection] = useState<Direction>('arrival');
  const [flightNumber, setFlightNumber] = useState('');
  const [airline, setAirline] = useState('');
  const [flightDate, setFlightDate] = useState('');
  const [flightTime, setFlightTime] = useState('');
  const [contactWhatsapp, setContactWhatsapp] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [preferredLang, setPreferredLang] = useState<Language>('en');
  const [specialNotes, setSpecialNotes] = useState('');
  const [passengers, setPassengers] = useState<PassengerData[]>([{ ...emptyPassenger }]);
  const [selectedAddons, setSelectedAddons] = useState<Set<string>>(new Set());
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [step, setStep] = useState<'service' | 'passenger' | 'review'>('service');

  // ─── Derived ───
  const selectedService = useMemo(() => {
    return fastTrackServices.find(s =>
      s.direction === direction || s.direction === 'both'
    );
  }, [fastTrackServices, direction]);

  const availableAddons = useMemo(() => {
    return addons.filter(a =>
      a.direction === direction || a.direction === 'both'
    );
  }, [addons, direction]);

  const isNightFlight = useMemo(() => {
    if (!flightTime) return false;
    const hour = parseInt(flightTime.split(':')[0], 10);
    return hour >= 0 && hour < 6;
  }, [flightTime]);

  const cutoffViolated = useMemo(() => {
    if (!flightDate || !flightTime) return false;
    try {
      const flightDT = new Date(`${flightDate}T${flightTime}`);
      const cutoff = new Date(Date.now() + 24 * 60 * 60 * 1000);
      return flightDT < cutoff;
    } catch { return false; }
  }, [flightDate, flightTime]);

  const pricing = useMemo(() => {
    if (!selectedService) return { base: 0, nightSurcharge: 0, addonsTotal: 0, total: 0 };
    const base = Number(selectedService.base_price) * passengers.length;
    const nightSurcharge = isNightFlight ? Number(selectedService.night_surcharge || 0) * passengers.length : 0;
    let addonsTotal = 0;
    selectedAddons.forEach(addonId => {
      const addon = addons.find(a => a.id === addonId);
      if (addon) addonsTotal += Number(addon.base_price);
    });
    return { base, nightSurcharge, addonsTotal, total: base + nightSurcharge + addonsTotal };
  }, [selectedService, passengers.length, isNightFlight, selectedAddons, addons]);

  // ─── Handlers ───
  const addPassenger = () => {
    if (passengers.length < (selectedService?.max_passengers || 6)) {
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

  const validateStep = (targetStep: 'passenger' | 'review'): boolean => {
    const newErrors: Record<string, string> = {};

    if (targetStep === 'passenger' || targetStep === 'review') {
      if (!flightNumber) newErrors.flightNumber = isRu ? 'Укажите номер рейса' : 'Flight number required';
      if (flightNumber && !FLIGHT_REGEX.test(flightNumber)) newErrors.flightNumber = isRu ? 'Неверный формат рейса' : 'Invalid flight format (e.g. TG123)';
      if (!flightDate) newErrors.flightDate = isRu ? 'Укажите дату' : 'Date required';
      if (!flightTime) newErrors.flightTime = isRu ? 'Укажите время' : 'Time required';
      if (cutoffViolated) newErrors.flightDate = isRu ? 'Бронирование за 24+ часа' : 'Must book 24+ hours ahead';
    }

    if (targetStep === 'review') {
      passengers.forEach((p, i) => {
        const result = passengerSchema.safeParse(p);
        if (!result.success) {
          result.error.errors.forEach(e => {
            newErrors[`passenger_${i}_${e.path[0]}`] = e.message;
          });
        }
      });
      if (!contactWhatsapp && !contactEmail) {
        newErrors.contact = isRu ? 'Укажите WhatsApp или email' : 'WhatsApp or email required';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

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
    else navigate(-1);
  };

  const handleSubmit = () => {
    if (!user) {
      toast({ title: isRu ? 'Войдите в аккаунт' : 'Please sign in', variant: 'destructive' });
      navigate('/auth');
      return;
    }
    // TODO: Create booking via supabase, then navigate to transfer upsell
    toast({ title: isRu ? 'Бронирование создано!' : 'Booking created!', description: isRu ? 'Переход к выбору трансфера' : 'Proceeding to transfer selection' });
    navigate('/transport/airport-transfer?from=fast-track');
  };

  const minDate = format(addDays(new Date(), 1), 'yyyy-MM-dd');

  if (isLoading) {
    return (
      <AppLayout title="Fast Track">
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="Fast Track">
      <div className="pb-32">
        {/* Hero */}
        {/* Back button */}
        <div className="px-4 pt-3">
          <Button variant="ghost" size="sm" className="gap-1 -ml-2" onClick={handleBack}>
            <ChevronLeft className="w-4 h-4" />
            {isRu ? 'Назад' : 'Back'}
          </Button>
        </div>

        <div className="bg-gradient-to-br from-primary/10 via-primary/5 to-background px-4 py-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
              <Shield className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-lg font-bold">
                {isRu ? 'Fast Track — Аэропорт Пхукет' : 'Fast Track — Phuket Airport'}
              </h1>
              <p className="text-sm text-muted-foreground">
                {isRu ? 'Приоритетное прохождение. Экономия до 60 мин.' : 'Priority processing. Save up to 60 min.'}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Badge variant="secondary" className="text-xs gap-1">
              <Clock className="w-3 h-3" />
              {isRu ? 'До 60 мин экономии' : 'Save up to 60 min'}
            </Badge>
            <Badge variant="secondary" className="text-xs gap-1">
              <Users className="w-3 h-3" />
              {isRu ? 'Персональный эскорт' : 'Personal escort'}
            </Badge>
          </div>
        </div>

        {/* Step indicator */}
        <div className="px-4 py-3">
          <div className="flex gap-1">
            {['service', 'passenger', 'review'].map((s, i) => (
              <div key={s} className={cn(
                "h-1 flex-1 rounded-full transition-colors",
                i <= ['service', 'passenger', 'review'].indexOf(step) ? "bg-primary" : "bg-muted"
              )} />
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {step === 'service' && (isRu ? 'Шаг 1: Рейс и услуги' : 'Step 1: Flight & services')}
            {step === 'passenger' && (isRu ? 'Шаг 2: Данные пассажиров' : 'Step 2: Passenger details')}
            {step === 'review' && (isRu ? 'Шаг 3: Подтверждение' : 'Step 3: Confirmation')}
          </p>
        </div>

        {/* ═══ Step 1: Service ═══ */}
        {step === 'service' && (
          <div className="px-4 space-y-5">
            {/* Direction */}
            <div className="space-y-2">
              <Label>{isRu ? 'Направление' : 'Direction'}</Label>
              <div className="grid grid-cols-2 gap-2">
                {(['arrival', 'departure'] as Direction[]).map(d => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setDirection(d)}
                    className={cn(
                      "p-3 rounded-xl border-2 text-center transition-all",
                      direction === d
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/30"
                    )}
                  >
                    <Plane className={cn("w-5 h-5 mx-auto mb-1", d === 'departure' && "rotate-45")} />
                    <span className="text-sm font-medium">
                      {d === 'arrival'
                        ? (isRu ? 'Прилёт' : 'Arrival')
                        : (isRu ? 'Вылет' : 'Departure')}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Flight info */}
            <div className="space-y-3">
              <Label>{isRu ? 'Информация о рейсе' : 'Flight Information'}</Label>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Input
                    placeholder={isRu ? 'Номер рейса' : 'Flight number'}
                    value={flightNumber}
                    onChange={e => setFlightNumber(e.target.value.toUpperCase())}
                    className={cn(errors.flightNumber && "border-destructive")}
                  />
                  {errors.flightNumber && <p className="text-xs text-destructive mt-1">{errors.flightNumber}</p>}
                </div>
                <Input
                  placeholder={isRu ? 'Авиакомпания' : 'Airline'}
                  value={airline}
                  onChange={e => setAirline(e.target.value)}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Input
                    type="date"
                    min={minDate}
                    value={flightDate}
                    onChange={e => setFlightDate(e.target.value)}
                    className={cn(errors.flightDate && "border-destructive")}
                  />
                  {errors.flightDate && <p className="text-xs text-destructive mt-1">{errors.flightDate}</p>}
                </div>
                <div>
                  <Input
                    type="time"
                    value={flightTime}
                    onChange={e => setFlightTime(e.target.value)}
                    className={cn(errors.flightTime && "border-destructive")}
                  />
                  {errors.flightTime && <p className="text-xs text-destructive mt-1">{errors.flightTime}</p>}
                </div>
              </div>
              {cutoffViolated && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  {isRu ? 'Бронирование возможно за 24+ часов до рейса' : 'Booking requires 24+ hours before flight'}
                </div>
              )}
              {isNightFlight && !cutoffViolated && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-accent text-accent-foreground text-sm">
                  <Clock className="w-4 h-4 shrink-0" />
                  {isRu
                    ? `Ночной рейс — доплата ฿${selectedService?.night_surcharge || 500}/чел.`
                    : `Night flight — surcharge ฿${selectedService?.night_surcharge || 500}/pax`}
                </div>
              )}
            </div>

            {/* Service card */}
            {selectedService && (
              <div className="p-4 rounded-2xl border bg-card">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold">
                    {isRu ? selectedService.name_ru : selectedService.name_en}
                  </h3>
                  <span className="text-lg font-bold text-primary">
                    ฿{Number(selectedService.base_price).toLocaleString()}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">
                  {isRu ? selectedService.description_ru : selectedService.description_en}
                </p>
              </div>
            )}

            {/* Add-ons */}
            {availableAddons.length > 0 && (
              <div className="space-y-2">
                <Label>{isRu ? 'Дополнительные услуги' : 'Add-ons'}</Label>
                {availableAddons.map(addon => (
                  <button
                    key={addon.id}
                    type="button"
                    onClick={() => toggleAddon(addon.id)}
                    className={cn(
                      "w-full p-3 rounded-xl border-2 flex items-center gap-3 text-left transition-all",
                      selectedAddons.has(addon.id)
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/30"
                    )}
                  >
                    <span className="text-xl">{addon.icon}</span>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm">{isRu ? addon.name_ru : addon.name_en}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {isRu ? addon.description_ru : addon.description_en}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="font-semibold text-sm">+฿{Number(addon.base_price).toLocaleString()}</span>
                      {selectedAddons.has(addon.id) && <Check className="w-4 h-4 text-primary ml-auto" />}
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* Passengers count */}
            <div className="space-y-2">
              <Label>{isRu ? 'Количество пассажиров' : 'Number of passengers'}</Label>
              <div className="flex items-center gap-3">
                <Button variant="outline" size="icon" onClick={removePassenger.bind(null, passengers.length - 1)} disabled={passengers.length <= 1}>
                  <Minus className="w-4 h-4" />
                </Button>
                <span className="text-lg font-semibold w-8 text-center">{passengers.length}</span>
                <Button variant="outline" size="icon" onClick={addPassenger} disabled={passengers.length >= (selectedService?.max_passengers || 6)}>
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* ═══ Step 2: Passengers ═══ */}
        {step === 'passenger' && (
          <div className="px-4 space-y-5">
            {passengers.map((pax, i) => (
              <div key={i} className="p-4 rounded-2xl border bg-card space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-sm">
                    {isRu ? `Пассажир ${i + 1}` : `Passenger ${i + 1}`}
                    {i === 0 && <Badge variant="secondary" className="ml-2 text-[10px]">{isRu ? 'Основной' : 'Primary'}</Badge>}
                  </h3>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs">{isRu ? 'Имя (лат.)' : 'First name (Latin)'}</Label>
                    <Input
                      value={pax.firstName}
                      onChange={e => updatePassenger(i, 'firstName', e.target.value)}
                      placeholder="John"
                      className={cn(errors[`passenger_${i}_firstName`] && "border-destructive")}
                    />
                    {errors[`passenger_${i}_firstName`] && <p className="text-xs text-destructive mt-0.5">{errors[`passenger_${i}_firstName`]}</p>}
                  </div>
                  <div>
                    <Label className="text-xs">{isRu ? 'Фамилия (лат.)' : 'Last name (Latin)'}</Label>
                    <Input
                      value={pax.lastName}
                      onChange={e => updatePassenger(i, 'lastName', e.target.value)}
                      placeholder="Doe"
                      className={cn(errors[`passenger_${i}_lastName`] && "border-destructive")}
                    />
                    {errors[`passenger_${i}_lastName`] && <p className="text-xs text-destructive mt-0.5">{errors[`passenger_${i}_lastName`]}</p>}
                  </div>
                </div>
                <div>
                  <Label className="text-xs">{isRu ? 'Номер паспорта' : 'Passport number'}</Label>
                  <Input
                    value={pax.passportNumber}
                    onChange={e => updatePassenger(i, 'passportNumber', e.target.value)}
                    className={cn(errors[`passenger_${i}_passportNumber`] && "border-destructive")}
                  />
                  {errors[`passenger_${i}_passportNumber`] && <p className="text-xs text-destructive mt-0.5">{errors[`passenger_${i}_passportNumber`]}</p>}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs">{isRu ? 'Гражданство' : 'Nationality'}</Label>
                    <Input
                      value={pax.nationality}
                      onChange={e => updatePassenger(i, 'nationality', e.target.value)}
                      className={cn(errors[`passenger_${i}_nationality`] && "border-destructive")}
                    />
                  </div>
                  <div>
                    <Label className="text-xs">{isRu ? 'Дата рождения' : 'Date of birth'}</Label>
                    <Input
                      type="date"
                      value={pax.dateOfBirth}
                      onChange={e => updatePassenger(i, 'dateOfBirth', e.target.value)}
                      className={cn(errors[`passenger_${i}_dateOfBirth`] && "border-destructive")}
                    />
                  </div>
                </div>
              </div>
            ))}

            <Separator />

            {/* Contact */}
            <div className="space-y-3">
              <Label>{isRu ? 'Контакт' : 'Contact'}</Label>
              <Input
                placeholder="WhatsApp"
                type="tel"
                value={contactWhatsapp}
                onChange={e => setContactWhatsapp(e.target.value)}
              />
              <Input
                placeholder="Email"
                type="email"
                value={contactEmail}
                onChange={e => setContactEmail(e.target.value)}
              />
              {errors.contact && <p className="text-xs text-destructive">{errors.contact}</p>}
              <div>
                <Label className="text-xs">{isRu ? 'Язык общения' : 'Preferred language'}</Label>
                <div className="flex gap-2 mt-1">
                  {(['en', 'ru', 'th'] as Language[]).map(lang => (
                    <button
                      key={lang}
                      type="button"
                      onClick={() => setPreferredLang(lang)}
                      className={cn(
                        "px-3 py-1.5 rounded-lg border text-sm font-medium transition-all",
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

        {/* ═══ Step 3: Review ═══ */}
        {step === 'review' && selectedService && (
          <div className="px-4 space-y-4">
            <div className="p-4 rounded-2xl border bg-card space-y-3">
              <h3 className="font-semibold">{isRu ? 'Детали бронирования' : 'Booking Summary'}</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{isRu ? 'Услуга' : 'Service'}</span>
                  <span>{isRu ? selectedService.name_ru : selectedService.name_en}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{isRu ? 'Рейс' : 'Flight'}</span>
                  <span>{flightNumber} — {flightDate} {flightTime}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{isRu ? 'Пассажиры' : 'Passengers'}</span>
                  <span>{passengers.length}</span>
                </div>
                {passengers.map((p, i) => (
                  <div key={i} className="text-xs text-muted-foreground pl-4">
                    {p.firstName} {p.lastName} — {p.passportNumber}
                  </div>
                ))}
              </div>

              <Separator />

              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span>{isRu ? 'Базовая стоимость' : 'Base price'} × {passengers.length}</span>
                  <span>฿{pricing.base.toLocaleString()}</span>
                </div>
                {pricing.nightSurcharge > 0 && (
                  <div className="flex justify-between text-accent-foreground">
                    <span>{isRu ? 'Ночная доплата' : 'Night surcharge'}</span>
                    <span>+฿{pricing.nightSurcharge.toLocaleString()}</span>
                  </div>
                )}
                {pricing.addonsTotal > 0 && (
                  <div className="flex justify-between">
                    <span>{isRu ? 'Доп. услуги' : 'Add-ons'}</span>
                    <span>+฿{pricing.addonsTotal.toLocaleString()}</span>
                  </div>
                )}
                <Separator />
                <div className="flex justify-between font-bold text-base">
                  <span>{isRu ? 'Итого' : 'Total'}</span>
                  <span className="text-primary">฿{pricing.total.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-background border-t p-4 pb-safe z-50">
        <div className="flex items-center justify-between mb-2">
          <div>
            <p className="text-xs text-muted-foreground">{isRu ? 'Итого' : 'Total'}</p>
            <p className="text-xl font-bold text-primary">฿{pricing.total.toLocaleString()}</p>
          </div>
          {step === 'review' ? (
            <Button onClick={handleSubmit} className="px-8" disabled={cutoffViolated}>
              {isRu ? 'Забронировать' : 'Book Now'}
            </Button>
          ) : (
            <Button onClick={handleNext} className="px-8" disabled={cutoffViolated}>
              {isRu ? 'Далее' : 'Next'}
            </Button>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
