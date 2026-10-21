/**
 * MoversIndex — каталог компаний переезда «Переезд под ключ».
 * Данные тянет из публичного view `v_public_movers` (без контактов).
 * Все обращения уходят через ConciergeHelpCTA / ConciergeRequestButton.
 */
import { useEffect, useState } from 'react';
import {
  Truck, Package, Warehouse, Plane, PawPrint, ShieldCheck, MapPin,
  ArrowRight, Loader2,
} from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { ConciergeHelpCTA } from '@/components/concierge/ConciergeHelpCTA';
import { ConciergeRequestButton } from '@/components/concierge/ConciergeRequestButton';
import { trackEvent } from '@/lib/analytics/track';

type Mover = {
  id: string;
  business_name: string;
  business_name_ru: string | null;
  district: string | null;
  city: string | null;
  website: string | null;
  specialties: string[];
  languages: string[];
  service_areas: string[];
  verified: boolean;
};

const SERVICE_TYPES = [
  { id: 'packing', icon: Package, ru: 'Упаковка', en: 'Packing' },
  { id: 'local', icon: Truck, ru: 'Локальные перевозки', en: 'Local moves' },
  { id: 'international', icon: Plane, ru: 'Международный переезд', en: 'International moving' },
  { id: 'storage', icon: Warehouse, ru: 'Хранение', en: 'Storage' },
  { id: 'pet', icon: PawPrint, ru: 'Перевозка питомцев', en: 'Pet relocation' },
];

const STEPS = [
  {
    n: 1,
    ru: { t: 'Оставьте заявку', d: 'Опишите откуда, куда, сколько вещей и когда.' },
    en: { t: 'Submit request', d: 'Tell us from, to, volume and date.' },
  },
  {
    n: 2,
    ru: { t: 'Менеджер myUNO подбирает', d: 'Сравнивает 2–3 проверенных подрядчика и согласовывает цену.' },
    en: { t: 'myUNO manager matches', d: 'Compares 2–3 verified vendors and locks the price.' },
  },
  {
    n: 3,
    ru: { t: 'Переезд под контролем myUNO', d: 'Оплата и связь — через приложение. Поддержка на каждом шаге.' },
    en: { t: 'Move runs through myUNO', d: 'Payment & comms in-app. Support at every step.' },
  },
];

export default function MoversIndex() {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const [movers, setMovers] = useState<Mover[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    trackEvent('movers_index_view', {});
    let cancelled = false;
    (async () => {
      const { data, error } = await supabase
        .from('v_public_movers' as never)
        .select('*')
        .order('verified', { ascending: false } as never);
      if (cancelled) return;
      if (error) {
        console.error('[MoversIndex] load failed:', error);
        setMovers([]);
      } else {
        const rows = ((data as unknown) as Mover[]) ?? [];
        setMovers(
          rows.map((m) => ({
            ...m,
            specialties: Array.isArray(m.specialties) ? m.specialties : [],
            languages: Array.isArray(m.languages) ? m.languages : [],
            service_areas: Array.isArray(m.service_areas) ? m.service_areas : [],
          })),
        );
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <AppLayout>
      <div className="container max-w-5xl py-6 sm:py-10 space-y-10">
        {/* Hero */}
        <section className="space-y-4">
          <Badge variant="secondary" className="rounded-sm">
            {isRu ? 'Переезд' : 'Relocation'}
          </Badge>
          <h1 className="text-3xl sm:text-4xl font-semibold leading-tight tracking-tight">
            {isRu ? 'Переезд на Пхукет — под ключ' : 'Moving to Phuket — turnkey'}
          </h1>
          <p className="text-base text-muted-foreground max-w-2xl">
            {isRu
              ? 'Упаковка, локальные и международные перевозки, хранение и питомцы — один координатор myUNO ведёт вас от первой коробки до распаковки.'
              : 'Packing, local & international moves, storage and pets — one myUNO coordinator runs the move from the first box to unpacking.'}
          </p>
          <div className="pt-2">
            <ConciergeRequestButton
              topic="relocation"
              label={isRu ? 'Запросить расчёт переезда' : 'Request a moving quote'}
              size="lg"
            />
          </div>
        </section>

        {/* Service types */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold">
            {isRu ? 'Что мы организуем' : 'What we organize'}
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {SERVICE_TYPES.map((s) => (
              <Card key={s.id} className="p-4 flex flex-col items-start gap-2">
                <s.icon className="w-5 h-5 text-primary" />
                <span className="text-sm font-medium leading-tight">
                  {isRu ? s.ru : s.en}
                </span>
              </Card>
            ))}
          </div>
        </section>

        {/* Providers */}
        <section className="space-y-4">
          <div className="flex items-end justify-between gap-3">
            <h2 className="text-xl font-semibold">
              {isRu ? 'Проверенные подрядчики' : 'Verified providers'}
            </h2>
            <p className="text-xs text-muted-foreground">
              {isRu ? 'Контакты — только через myUNO' : 'Contacts via myUNO only'}
            </p>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12 text-muted-foreground">
              <Loader2 className="w-5 h-5 animate-spin" />
            </div>
          ) : movers.length === 0 ? (
            <Card className="p-6 text-sm text-muted-foreground text-center">
              {isRu
                ? 'Каталог формируется. Оставьте заявку — менеджер myUNO подберёт исполнителя индивидуально.'
                : 'Catalog is being assembled. Submit a request — a myUNO manager will match a provider for you.'}
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {movers.map((m) => (
                <Card key={m.id} className="p-4 flex flex-col gap-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="font-medium leading-tight truncate">
                        {isRu && m.business_name_ru ? m.business_name_ru : m.business_name}
                      </div>
                      {m.district && (
                        <div className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                          <MapPin className="w-3 h-3" /> {m.district}
                          {m.city && `, ${m.city}`}
                        </div>
                      )}
                    </div>
                    {m.verified && (
                      <Badge variant="secondary" className="shrink-0 rounded-sm">
                        <ShieldCheck className="w-3 h-3 mr-1" />
                        {isRu ? 'Проверен' : 'Verified'}
                      </Badge>
                    )}
                  </div>

                  {m.specialties.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {m.specialties.slice(0, 4).map((s) => (
                        <Badge key={s} variant="outline" className="rounded-sm text-[10px] font-normal">
                          {s}
                        </Badge>
                      ))}
                    </div>
                  )}

                  <ConciergeRequestButton
                    topic="relocation"
                    vendorId={m.id}
                    vendorName={m.business_name}
                    label={isRu ? 'Запросить через myUNO' : 'Request via myUNO'}
                    size="sm"
                    variant="outline"
                    fullWidth
                  />
                </Card>
              ))}
            </div>
          )}
        </section>

        {/* How it works */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold">
            {isRu ? 'Как это работает' : 'How it works'}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {STEPS.map((s) => {
              const copy = isRu ? s.ru : s.en;
              return (
                <Card key={s.n} className="p-4 space-y-2">
                  <div className="text-xs text-muted-foreground">
                    {isRu ? 'Шаг' : 'Step'} {s.n}
                  </div>
                  <div className="font-medium">{copy.t}</div>
                  <div className="text-sm text-muted-foreground">{copy.d}</div>
                </Card>
              );
            })}
          </div>
        </section>

        {/* Final CTA */}
        <ConciergeHelpCTA topic="relocation" variant="card" />

        <p className="text-xs text-muted-foreground text-center">
          <ShieldCheck className="inline w-3 h-3 mr-1" />
          {isRu
            ? 'Контакты подрядчиков мы не показываем. Все коммуникации — через приложение и менеджера myUNO.'
            : "We don't show provider contacts. All communication runs through the app and a myUNO manager."}
        </p>
      </div>
    </AppLayout>
  );
}
