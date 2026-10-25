import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Shield, CalendarCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useLanguage } from '@/contexts/LanguageContext';
import { pickLang } from '@/lib/i18n/pickLang';
import { useMarketplaceServices } from '@/hooks/useServiceMarketplace';
import { ServiceBookingSheet, type BookableService } from './ServiceBookingSheet';
import { ServiceSummary } from './ServiceSummary';

/** Real, bookable services from verified providers (services + providers tables). */
export function MarketplaceServiceGrid({ search = '', returnTo = '/discover/services' }: { search?: string; returnTo?: string }) {
  const { language } = useLanguage();
  const L = (ru: string, en: string, th?: string) => pickLang(language, { ru, en, th });
  const { data, isLoading, isError, refetch } = useMarketplaceServices();
  const [selected, setSelected] = useState<BookableService | null>(null);

  const q = search.trim().toLowerCase();
  const list = (data ?? []).filter((s) => !q || `${s.name_en} ${s.name_ru ?? ''} ${s.provider?.name ?? ''}`.toLowerCase().includes(q));

  // Confirmed absence is context, not the primary task. Keep failures/loading
  // separate so unavailable supply is never inferred from a failed read.
  if (!isLoading && !isError && data?.length === 0) {
    return <p role="status" className="text-sm text-muted-foreground">
      {L('Онлайн-запись пока недоступна. Выберите услугу для дома или опишите задачу.',
        'Online booking is not available yet. Choose a home service or describe your task.',
        'ยังไม่มีบริการจองออนไลน์ เลือกบริการสำหรับบ้านหรืออธิบายสิ่งที่ต้องการ')}
    </p>;
  }

  return (
    <section aria-labelledby="bookable-services" className="space-y-4">
      <div className="flex items-center gap-2 mb-3">
        <CalendarCheck className="h-4 w-4 text-primary" />
        <h2 id="bookable-services" className="font-display text-h3">{L('Онлайн-запись к специалистам', 'Book a provider', 'จองผู้ให้บริการ')}</h2>
      </div>
      {isLoading ? (
        <div role="status" aria-label={L('Загружаем услуги', 'Loading services', 'กำลังโหลดบริการ')} className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-64" />)}</div>
      ) : isError ? (
        <div role="alert" className="border border-border p-4 text-sm flex items-center justify-between gap-2">
          <span className="text-muted-foreground">{L('Не удалось загрузить услуги.', 'Could not load services.', 'โหลดบริการไม่สำเร็จ')}</span>
          <Button size="sm" variant="outline" onClick={() => refetch()}>{L('Повторить', 'Retry', 'ลองใหม่')}</Button>
        </div>
      ) : list.length === 0 ? (
        <p className="text-sm text-muted-foreground border border-border p-4">{(data ?? []).length > 0 && q ? L('По вашему запросу ничего не найдено. Измените поиск.', 'No services match your search. Try another search.', 'ไม่พบบริการที่ตรงกับการค้นหา') : L('Онлайн-запись пока недоступна. Ниже можно оставить заявку на подбор специалиста.', 'Online booking is not available yet. You can request a specialist below.', 'ยังไม่มีบริการจองออนไลน์ ส่งคำขอด้านล่างได้')}</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {list.map((s) => {
            const name = (language === 'ru' ? s.name_ru : s.name_en) || s.name_en;
            const img = s.images?.[0];
            return (
              <article key={s.id} className="flex min-w-0 flex-col border border-border bg-card">
                {img ? <img src={img} alt="" loading="lazy" className="h-40 w-full border-b border-border object-cover" /> : <div aria-hidden="true" className="flex h-24 items-center justify-center border-b border-border bg-muted/50 text-primary sm:h-28"><CalendarCheck className="h-10 w-10" strokeWidth={1.25} /></div>}
                <div className="flex flex-1 min-w-0 flex-col gap-2 p-4">
                  <ServiceSummary name={name} description={(language === 'ru' ? s.description_ru : s.description_en) || s.description_en} price={s.price} currency={s.currency} durationMinutes={s.duration_minutes} />
                  {s.provider && (
                    <Link to={`/services/provider/${s.provider.id}?returnTo=${encodeURIComponent(returnTo)}`} className="min-h-11 text-sm text-muted-foreground hover:underline flex items-center gap-1">
                      {s.provider.is_verified && <Shield className="h-3 w-3 text-primary" aria-label={L('Специалист проверен', 'Verified', 'ยืนยันแล้ว')} />}
                      {s.provider.name}
                    </Link>
                  )}
                  <div className="mt-auto flex flex-col gap-3 border-t border-border pt-3">
                    <Button size="sm" className="min-h-11 w-full" onClick={() => setSelected({
                      id: s.id, providerId: s.provider_id, name, price: s.price, currency: s.currency,
                      durationMinutes: s.duration_minutes, leadTimeHours: s.lead_time_hours,
                    })}>{L('Записаться на услугу', 'Book', 'จอง')}</Button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
      <ServiceBookingSheet service={selected} open={!!selected} onOpenChange={(o) => !o && setSelected(null)} />
    </section>
  );
}
