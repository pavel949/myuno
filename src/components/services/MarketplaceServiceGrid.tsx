import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Shield, Clock, CalendarCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useLanguage } from '@/contexts/LanguageContext';
import { pickLang } from '@/lib/i18n/pickLang';
import { useMarketplaceServices } from '@/hooks/useServiceMarketplace';
import { ServiceBookingSheet, type BookableService } from './ServiceBookingSheet';

/** Real, bookable services from verified providers (services + providers tables). */
export function MarketplaceServiceGrid({ search = '' }: { search?: string }) {
  const { language } = useLanguage();
  const L = (ru: string, en: string, th?: string) => pickLang(language, { ru, en, th });
  const { data, isLoading, isError, refetch } = useMarketplaceServices();
  const [selected, setSelected] = useState<BookableService | null>(null);

  const q = search.trim().toLowerCase();
  const list = (data ?? []).filter((s) => !q || `${s.name_en} ${s.name_ru ?? ''} ${s.provider?.name ?? ''}`.toLowerCase().includes(q));

  return (
    <section aria-labelledby="bookable-services">
      <div className="flex items-center gap-2 mb-3">
        <CalendarCheck className="h-4 w-4 text-primary" />
        <h3 id="bookable-services" className="font-semibold text-sm">{L('Онлайн-запись к специалистам', 'Book a provider', 'จองผู้ให้บริการ')}</h3>
      </div>
      {isLoading ? (
        <div className="grid gap-2 sm:grid-cols-2">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28" />)}</div>
      ) : isError ? (
        <div className="border border-border p-4 text-sm flex items-center justify-between gap-2">
          <span className="text-muted-foreground">{L('Не удалось загрузить услуги.', 'Could not load services.', 'โหลดบริการไม่สำเร็จ')}</span>
          <Button size="sm" variant="outline" onClick={() => refetch()}>{L('Повторить', 'Retry', 'ลองใหม่')}</Button>
        </div>
      ) : list.length === 0 ? (
        <p className="text-sm text-muted-foreground border border-border p-4">{L('Услуги с онлайн-записью пока не добавлены.', 'No bookable services yet.', 'ยังไม่มีบริการที่จองได้')}</p>
      ) : (
        <div className="grid gap-2 sm:grid-cols-2">
          {list.map((s) => {
            const name = (language === 'ru' ? s.name_ru : s.name_en) || s.name_en;
            const img = s.images?.[0];
            return (
              <article key={s.id} className="border border-border bg-card p-3 flex gap-3">
                {img && <img src={img} alt="" loading="lazy" className="h-20 w-20 object-cover shrink-0" />}
                <div className="flex-1 min-w-0 space-y-1">
                  <h4 className="font-medium text-sm leading-snug line-clamp-2">{name}</h4>
                  {s.provider && (
                    <Link to={`/services/provider/${s.provider.id}`} className="text-xs text-muted-foreground hover:underline flex items-center gap-1">
                      {s.provider.is_verified && <Shield className="h-3 w-3 text-primary" aria-label={L('Специалист проверен', 'Verified', 'ยืนยันแล้ว')} />}
                      {s.provider.name}
                    </Link>
                  )}
                  <div className="flex items-center justify-between gap-2 pt-1">
                    <span className="text-sm font-mono">
                      {s.price != null ? `฿${Number(s.price).toLocaleString()}` : L('По запросу', 'On request', 'ตามคำขอ')}
                      {s.duration_minutes ? <span className="text-xs text-muted-foreground ml-1 inline-flex items-center gap-0.5"><Clock className="h-3 w-3" />{s.duration_minutes}′</span> : null}
                    </span>
                    <Button size="sm" className="min-h-[40px]" onClick={() => setSelected({
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
