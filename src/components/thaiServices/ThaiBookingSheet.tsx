/**
 * ThaiBookingSheet — lightweight booking wizard.
 *
 * MVP: status-only payment (no online charge). Steps: service → date/time →
 * contact → payment → confirmation. On submit creates a `thai_bookings` row
 * (status `requested`) and notifies the business; success screen offers chat +
 * add-to-calendar (ICS).
 */
import { useMemo, useState } from 'react';
import { CheckCircle2, Loader2 } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { pickLang } from '@/lib/i18n/pickLang';
import { useCurrency } from '@/contexts/CurrencyContext';
import { useCreateThaiBooking } from '@/hooks/thaiServices/useThaiServices';
import { buildIcs, downloadIcs } from '@/lib/thaiServices/ics';
import type { ThaiBusiness, ThaiService } from '@/types/thaiBusiness';

interface Props {
  business: ThaiBusiness;
  services: ThaiService[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  presetServiceId?: string | null;
  onOpenChat?: () => void;
}

type Step = 'service' | 'date' | 'contact' | 'payment' | 'summary' | 'done';

export function ThaiBookingSheet({ business, services, open, onOpenChange, presetServiceId, onOpenChat }: Props) {
  const { user } = useAuth();
  const { t, language } = useLanguage();
  const { formatPrice } = useCurrency();
  const create = useCreateThaiBooking();

  const [step, setStep] = useState<Step>('service');
  const [serviceId, setServiceId] = useState<string | null>(presetServiceId ?? services[0]?.id ?? null);
  const [dateTime, setDateTime] = useState('');
  const [name, setName] = useState(user?.user_metadata?.full_name ?? '');
  const [phone, setPhone] = useState(user?.phone ?? '');
  const [payment, setPayment] = useState<'on_site' | 'deposit'>('on_site');

  const service = useMemo(() => services.find((s) => s.id === serviceId) ?? null, [services, serviceId]);
  const svcName = (s: ThaiService) => pickLang(language, { ru: s.name_ru || s.name_th, en: s.name_th, th: s.name_th });

  const submit = async () => {
    const notes = [name && `Имя: ${name}`, phone && `Тел: ${phone}`, `Оплата: ${payment}`].filter(Boolean).join(' · ');
    await create.mutateAsync({
      business_id: business.id,
      service_id: serviceId,
      date_time: dateTime ? new Date(dateTime).toISOString() : null,
      total_amount_thb: service?.price_thb ?? 0,
      notes,
    });
    setStep('done');
  };

  const next = (s: Step) => () => setStep(s);

  const addToCalendar = () => {
    const start = dateTime ? new Date(dateTime) : new Date();
    const ics = buildIcs({
      title: `${pickLang(language, { ru: business.name_ru || business.name_th, en: business.name_en || business.name_th, th: business.name_th })} — ${service ? svcName(service) : ''}`,
      start,
      durationMinutes: service?.duration_minutes ?? 60,
      location: business.address ?? '',
    });
    downloadIcs(ics, `booking-${business.slug}.ics`);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="max-h-[90vh] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{t('thai.booking.title')}</SheetTitle>
        </SheetHeader>

        <div className="py-4 space-y-4">
          {step === 'service' && (
            <div className="space-y-2">
              <Label>{t('thai.booking.selectService')}</Label>
              {services.length === 0 && <p className="text-sm text-muted-foreground">—</p>}
              {services.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setServiceId(s.id)}
                  className={`w-full text-left border p-3 ${serviceId === s.id ? 'border-primary bg-primary/5' : 'border-border'}`}
                >
                  <div className="flex justify-between">
                    <span className="text-foreground">{svcName(s)}</span>
                    <span className="font-mono text-foreground">{formatPrice(s.price_thb)}</span>
                  </div>
                </button>
              ))}
              <Button className="w-full" disabled={!serviceId} onClick={next('date')}>{t('thai.booking.next')}</Button>
            </div>
          )}

          {step === 'date' && (
            <div className="space-y-3">
              <Label>{t('thai.booking.selectDate')}</Label>
              <Input type="datetime-local" value={dateTime} onChange={(e) => setDateTime(e.target.value)} />
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={next('service')}>{t('thai.booking.back')}</Button>
                <Button className="flex-1" onClick={next('contact')}>{t('thai.booking.next')}</Button>
              </div>
            </div>
          )}

          {step === 'contact' && (
            <div className="space-y-3">
              <Label>{t('thai.booking.contact')}</Label>
              <Input placeholder="Имя / Name" value={name} onChange={(e) => setName(e.target.value)} />
              <Input placeholder="+66…" value={phone} onChange={(e) => setPhone(e.target.value)} />
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={next('date')}>{t('thai.booking.back')}</Button>
                <Button className="flex-1" onClick={next('payment')}>{t('thai.booking.next')}</Button>
              </div>
            </div>
          )}

          {step === 'payment' && (
            <div className="space-y-3">
              <Label>{t('thai.booking.payment')}</Label>
              {(['on_site', 'deposit'] as const).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPayment(p)}
                  className={`w-full text-left border p-3 ${payment === p ? 'border-primary bg-primary/5' : 'border-border'}`}
                >
                  {p === 'on_site' ? t('thai.booking.payOnSite') : t('thai.booking.deposit')}
                </button>
              ))}
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={next('contact')}>{t('thai.booking.back')}</Button>
                <Button className="flex-1" onClick={next('summary')}>{t('thai.booking.next')}</Button>
              </div>
            </div>
          )}

          {step === 'summary' && (
            <div className="space-y-3">
              <Label>{t('thai.booking.summary')}</Label>
              <div className="border border-border p-3 text-sm space-y-1">
                <div className="flex justify-between"><span className="text-muted-foreground">{pickLang(language, { ru: business.name_ru || business.name_th, en: business.name_en || business.name_th, th: business.name_th })}</span></div>
                {service && <div className="flex justify-between"><span>{svcName(service)}</span><span className="font-mono">{formatPrice(service.price_thb)}</span></div>}
                {dateTime && <div className="flex justify-between"><span className="text-muted-foreground">{new Date(dateTime).toLocaleString()}</span></div>}
              </div>
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={next('payment')}>{t('thai.booking.back')}</Button>
                <Button className="flex-1" onClick={submit} disabled={create.isPending}>
                  {create.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : t('thai.booking.submit')}
                </Button>
              </div>
            </div>
          )}

          {step === 'done' && (
            <div className="space-y-4 text-center py-4">
              <CheckCircle2 className="w-12 h-12 text-accent mx-auto" />
              <div>
                <p className="font-medium text-foreground">{t('thai.booking.success')}</p>
                <p className="text-sm text-muted-foreground">{t('thai.booking.successHint')}</p>
              </div>
              <div className="flex flex-col gap-2">
                {onOpenChat && (
                  <Button onClick={() => { onOpenChange(false); onOpenChat(); }}>{t('thai.cta.openChat')}</Button>
                )}
                <Button variant="outline" onClick={addToCalendar}>{t('thai.cta.addToCalendar')}</Button>
              </div>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
