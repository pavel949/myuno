import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from '@/components/ui/sheet';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Clock } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuthSheet } from '@/contexts/AuthSheetContext';
import { useAuth } from '@/contexts/AuthContext';
import { useUniversalLead } from '@/hooks/useUniversalLead';
import type { LeadSource } from '@/lib/leadVerticalConfig';

/** Map vertical-spec id → existing leadVerticalConfig id used by consultation_requests. */
const VERTICAL_TO_LEAD_ID: Record<string, string> = {
  beauty: 'salons',
  fitness: 'gyms',
  tour: 'tours',
  transport: 'vehicles',
  restaurant: 'restaurants',
  yacht: 'yachts',
  property: 'properties',
};

/** Per-vertical request_type sent to consultation_requests. */
const VERTICAL_REQUEST_TYPE: Record<string, string> = {
  beauty: 'salon_appointment',
  fitness: 'gym_inquiry',
  tour: 'tour_booking',
  transport: 'transport_booking',
};

interface SavedInquiry {
  listingId: string;
  verticalId: string;
  requestId: string;
  submittedAt: string;
  status: 'pending' | 'contacted' | 'confirmed';
}

const STORAGE_KEY = 'uno:vertical-inquiries';

function readSavedInquiries(): SavedInquiry[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]') as SavedInquiry[];
  } catch {
    return [];
  }
}

function saveInquiry(entry: SavedInquiry) {
  const all = readSavedInquiries().filter((e) => e.listingId !== entry.listingId);
  all.unshift(entry);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(all.slice(0, 50)));
}

export function getInquiryStatus(listingId: string): SavedInquiry | null {
  return readSavedInquiries().find((e) => e.listingId === listingId) ?? null;
}

const makeSchema = (lang: 'en' | 'ru') =>
  z.object({
    name: z
      .string()
      .trim()
      .min(2, lang === 'ru' ? 'Имя минимум 2 символа' : 'Name must be at least 2 chars')
      .max(100),
    phone: z
      .string()
      .trim()
      .min(7, lang === 'ru' ? 'Введите номер телефона' : 'Enter a phone number')
      .max(32)
      .regex(/^[\d+()\-\s]+$/, lang === 'ru' ? 'Только цифры и +()-' : 'Digits and +()- only'),
    email: z
      .string()
      .trim()
      .max(255)
      .email(lang === 'ru' ? 'Неверный email' : 'Invalid email')
      .optional()
      .or(z.literal('')),
    preferred_date: z.string().optional().or(z.literal('')),
    guests: z
      .coerce.number()
      .int()
      .min(1)
      .max(50)
      .optional(),
    notes: z.string().trim().max(1000).optional().or(z.literal('')),
  });

type FormValues = z.infer<ReturnType<typeof makeSchema>>;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  verticalId: string;        // spec.id (beauty/fitness/tour/transport)
  listingId: string;
  listingTitle: string;
  /** lead_source for analytics. Default 'cta'. */
  source?: LeadSource;
  entryPoint?: string;
}

export function InquiryForm({
  open, onOpenChange, verticalId, listingId, listingTitle,
  source = 'cta', entryPoint,
}: Props) {
  const { language } = useLanguage();
  const lang = (language === 'ru' ? 'ru' : 'en') as 'en' | 'ru';
  const { user } = useAuth();
  const { openAuthSheet } = useAuthSheet();
  const { submitLead, isSubmitting } = useUniversalLead();

  const form = useForm<FormValues>({
    resolver: zodResolver(makeSchema(lang)),
    defaultValues: { name: '', phone: '', email: '', preferred_date: '', notes: '' },
  });

  useEffect(() => {
    if (open && user) {
      form.reset({
        name: (user.user_metadata?.full_name as string) ?? '',
        phone: (user.user_metadata?.phone as string) ?? '',
        email: user.email ?? '',
        preferred_date: '',
        notes: '',
      });
    }
  }, [open, user, form]);

  const onSubmit = async (values: FormValues) => {
    const requestType = VERTICAL_REQUEST_TYPE[verticalId] ?? 'general_inquiry';
    const leadVerticalId = VERTICAL_TO_LEAD_ID[verticalId] ?? 'other';

    const result = await submitLead.mutateAsync({
      vertical_id: leadVerticalId,
      request_type: requestType,
      lead_source: source,
      entry_point: entryPoint ?? `vertical_detail:${verticalId}`,
      name: values.name,
      phone: values.phone,
      email: values.email || undefined,
      preferred_language: lang,
      guests_count: values.guests ?? undefined,
      preferred_dates: values.preferred_date
        ? [{ date: values.preferred_date, time: '' }]
        : undefined,
      notes: values.notes
        ? `${values.notes}\n\n— ${listingTitle} (${listingId})`
        : `${listingTitle} (${listingId})`,
      vertical_metadata: {
        listing_id: listingId,
        listing_title: listingTitle,
        spec_vertical: verticalId,
      },
    });

    if (result?.id) {
      saveInquiry({
        listingId,
        verticalId,
        requestId: result.id as string,
        submittedAt: new Date().toISOString(),
        status: 'pending',
      });
      onOpenChange(false);
    }
  };

  // Gate behind auth so the lead is linked to the user UUID (no anonymous sign-ups).
  const handleSubmitClick = form.handleSubmit((values) => {
    if (!user) {
      openAuthSheet({
        intent: 'inquiry',
        onSuccess: () => onSubmit(values),
      });
      return;
    }
    return onSubmit(values);
  });

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="max-h-[90vh] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>
            {lang === 'ru' ? 'Оставить заявку' : 'Send inquiry'}
          </SheetTitle>
          <SheetDescription>{listingTitle}</SheetDescription>
        </SheetHeader>

        <Form {...form}>
          <form onSubmit={handleSubmitClick} className="space-y-4 py-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{lang === 'ru' ? 'Имя *' : 'Name *'}</FormLabel>
                  <FormControl><Input {...field} maxLength={100} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{lang === 'ru' ? 'Телефон / WhatsApp *' : 'Phone / WhatsApp *'}</FormLabel>
                  <FormControl><Input {...field} inputMode="tel" placeholder="+66 ..." maxLength={32} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl><Input {...field} type="email" maxLength={255} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="preferred_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{lang === 'ru' ? 'Дата' : 'Date'}</FormLabel>
                    <FormControl><Input {...field} type="date" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="guests"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{lang === 'ru' ? 'Гостей' : 'Guests'}</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="number"
                        min={1}
                        max={50}
                        value={field.value ?? ''}
                        onChange={(e) => field.onChange(e.target.value === '' ? undefined : Number(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{lang === 'ru' ? 'Комментарий' : 'Notes'}</FormLabel>
                  <FormControl><Textarea {...field} rows={3} maxLength={1000} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <SheetFooter className="gap-2 sm:gap-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                {lang === 'ru' ? 'Отмена' : 'Cancel'}
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting
                  ? (lang === 'ru' ? 'Отправка…' : 'Sending…')
                  : (lang === 'ru' ? 'Отправить' : 'Send')}
              </Button>
            </SheetFooter>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}

export function InquiryStatusBadge({ status, lang }: { status: SavedInquiry; lang: 'en' | 'ru' }) {
  const map = {
    pending: {
      icon: Clock,
      label: lang === 'ru' ? 'Заявка отправлена' : 'Inquiry sent',
      variant: 'secondary' as const,
    },
    contacted: {
      icon: CheckCircle2,
      label: lang === 'ru' ? 'С вами связались' : 'Contacted',
      variant: 'default' as const,
    },
    confirmed: {
      icon: CheckCircle2,
      label: lang === 'ru' ? 'Подтверждено' : 'Confirmed',
      variant: 'default' as const,
    },
  };
  const m = map[status.status];
  const Icon = m.icon;
  return (
    <Badge variant={m.variant} className="gap-1">
      <Icon className="h-3 w-3" />
      {m.label}
    </Badge>
  );
}
