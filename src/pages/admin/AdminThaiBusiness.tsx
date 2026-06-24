/**
 * AdminThaiBusiness — moderation queue for the Thai Business Layer.
 * Activate / block businesses (controls `is_active`, the B2C/landing gate).
 */
import { useState } from 'react';
import { Check, Ban, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useLanguage } from '@/contexts/LanguageContext';
import { APP_ROUTES } from '@/lib/config/routes';
import { thaiCategoryMeta } from '@/types/thaiBusiness';
import { useAdminThaiBusinesses, useSetThaiBusinessActive } from '@/hooks/thaiServices/useThaiServices';
import ThaiLeadsPanel from './thaiBusiness/ThaiLeadsPanel';

export default function AdminThaiBusiness() {
  const { t, language } = useLanguage();
  const { data: businesses = [], isLoading } = useAdminThaiBusinesses();
  const setActive = useSetThaiBusinessActive();
  const [tab, setTab] = useState<'businesses' | 'leads'>('businesses');
  const [filter, setFilter] = useState<'all' | 'pending' | 'active'>('all');

  const filtered = businesses.filter((b) =>
    filter === 'all' ? true : filter === 'active' ? b.is_active : !b.is_active,
  );

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto">
      <h1 className="text-xl font-semibold text-foreground mb-4">{t('thai.admin.title')}</h1>

      <div className="flex gap-1 mb-5 border-b border-border">
        {(['businesses', 'leads'] as const).map((tb) => (
          <button
            key={tb}
            onClick={() => setTab(tb)}
            className={`text-sm px-4 py-2 -mb-px border-b-2 ${
              tab === tb
                ? 'border-primary text-primary font-medium'
                : 'border-transparent text-muted-foreground'
            }`}
          >
            {tb === 'businesses' ? 'Бизнесы' : 'Заявки'}
          </button>
        ))}
      </div>

      {tab === 'leads' ? (
        <ThaiLeadsPanel />
      ) : (
        <>
      <div className="flex gap-2 mb-4">
        {(['all', 'pending', 'active'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`text-sm rounded-full border px-3 py-1.5 ${filter === f ? 'border-primary bg-primary/10 text-primary' : 'border-border text-foreground'}`}
          >
            {f === 'all' ? 'Все' : f === 'pending' ? 'На модерации' : 'Активные'}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20" />)}</div>
      ) : filtered.length === 0 ? (
        <p className="text-center text-muted-foreground py-12">{t('thai.empty')}</p>
      ) : (
        <div className="space-y-3">
          {filtered.map((b) => {
            const cat = thaiCategoryMeta(b.category);
            return (
              <div key={b.id} className="border border-border p-3 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-foreground truncate">{b.name_ru || b.name_th}</span>
                    <Badge variant={b.is_active ? 'secondary' : 'outline'}>
                      {b.is_active ? t('thai.owner.active') : t('thai.owner.pendingModeration')}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {language === 'ru' ? cat.ru : cat.en} · {b.district ?? '—'} · /ts/{b.slug}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <a href={APP_ROUTES.THAI_LANDING(b.slug)} target="_blank" rel="noreferrer" className="text-muted-foreground p-2">
                    <ExternalLink className="w-4 h-4" />
                  </a>
                  {b.is_active ? (
                    <Button size="sm" variant="ghost" onClick={() => setActive.mutate({ id: b.id, isActive: false })}>
                      <Ban className="w-4 h-4 mr-1" />{t('thai.admin.block')}
                    </Button>
                  ) : (
                    <Button size="sm" onClick={() => setActive.mutate({ id: b.id, isActive: true })}>
                      <Check className="w-4 h-4 mr-1" />{t('thai.admin.activate')}
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
        </>
      )}
    </div>
  );
}
