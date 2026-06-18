import React, { useEffect, useMemo, useState, useCallback } from 'react';
import {
  CheckCircle2, XCircle, Clock, Copy as CopyIcon, ExternalLink,
  Mail, Phone, Globe, MapPin, Search, RefreshCw, Building2,
} from 'lucide-react';
import { PageContainer } from '@/components/uno/PageContainer';
import { PageHeader } from '@/components/uno/PageHeader';
import { SectionCard } from '@/components/uno/SectionCard';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useIsAdmin } from '@/hooks/useIsAdmin';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ru as ruLocale, enUS } from 'date-fns/locale';
import { cn } from '@/lib/utils';

type ClaimStatus = 'pending' | 'approved' | 'rejected' | 'duplicate';

interface PoiClaim {
  id: string;
  osm_type: string | null;
  osm_id: number | null;
  google_place_id: string | null;
  poi_name: string;
  poi_category: string | null;
  lat: number | null;
  lng: number | null;
  owner_user_id: string | null;
  owner_name: string;
  owner_email: string;
  owner_phone: string | null;
  business_name: string | null;
  business_website: string | null;
  target_vertical: string | null;
  message: string | null;
  status: ClaimStatus;
  reviewed_by: string | null;
  reviewed_at: string | null;
  reviewer_notes: string | null;
  resulting_provider_id: string | null;
  created_at: string;
  updated_at: string;
}

const STATUS_META: Record<ClaimStatus, { icon: React.ElementType; cls: string; ru: string; en: string }> = {
  pending:   { icon: Clock,        cls: 'bg-warning/15 text-warning border-warning/30',           ru: 'Ожидает',   en: 'Pending' },
  approved:  { icon: CheckCircle2, cls: 'bg-success/15 text-success border-success/30',           ru: 'Одобрено',  en: 'Approved' },
  rejected:  { icon: XCircle,      cls: 'bg-destructive/15 text-destructive border-destructive/30', ru: 'Отклонено', en: 'Rejected' },
  duplicate: { icon: CopyIcon,     cls: 'bg-muted text-muted-foreground border-border',           ru: 'Дубль',     en: 'Duplicate' },
};

export default function AdminPoiClaims() {
  const { language } = useLanguage();
  const t = (ruText: string, enText: string) => (language === 'ru' ? ruText : enText);
  const dateLocale = language === 'ru' ? ruLocale : enUS;

  const { user } = useAuth();
  const { isAdmin, isLoading: adminLoading } = useIsAdmin();

  const [claims, setClaims] = useState<PoiClaim[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState<ClaimStatus | 'all'>('pending');

  const [selected, setSelected] = useState<PoiClaim | null>(null);
  const [actionOpen, setActionOpen] = useState<null | 'approve' | 'reject' | 'duplicate'>(null);
  const [notes, setNotes] = useState('');
  const [processing, setProcessing] = useState(false);

  const fetchClaims = useCallback(async () => {
    if (!isAdmin) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('poi_claim_requests')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setClaims((data as PoiClaim[]) || []);
    } catch (e) {
      console.error('[AdminPoiClaims] fetch failed', e);
      toast.error(t('Не удалось загрузить заявки', 'Failed to load claims'));
    } finally {
      setLoading(false);
    }
  }, [isAdmin, language]);

  useEffect(() => { void fetchClaims(); }, [fetchClaims]);

  const counts = useMemo(() => {
    const c = { all: claims.length, pending: 0, approved: 0, rejected: 0, duplicate: 0 } as Record<string, number>;
    claims.forEach(x => { c[x.status] = (c[x.status] || 0) + 1; });
    return c;
  }, [claims]);

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return claims.filter(c => {
      if (tab !== 'all' && c.status !== tab) return false;
      if (!q) return true;
      return (
        c.poi_name.toLowerCase().includes(q) ||
        (c.business_name || '').toLowerCase().includes(q) ||
        c.owner_name.toLowerCase().includes(q) ||
        c.owner_email.toLowerCase().includes(q)
      );
    });
  }, [claims, tab, search]);

  const openAction = (claim: PoiClaim, type: 'approve' | 'reject' | 'duplicate') => {
    setSelected(claim);
    setNotes(claim.reviewer_notes || '');
    setActionOpen(type);
  };

  const performAction = async () => {
    if (!selected || !actionOpen || !user) return;
    setProcessing(true);
    try {
      let resulting_provider_id: string | null = selected.resulting_provider_id;

      // On approve: create a lightweight provider record and link it.
      if (actionOpen === 'approve' && !resulting_provider_id) {
        const providerName = selected.business_name || selected.poi_name;
        const { data: provider, error: pErr } = await supabase
          .from('providers')
          .insert({
            name: providerName,
            email: selected.owner_email,
            phone: selected.owner_phone,
            website: selected.business_website,
            address: null,
            lat: selected.lat,
            lng: selected.lng,
            business_category: selected.target_vertical || selected.poi_category,
            provider_type: selected.target_vertical,
            user_id: selected.owner_user_id,
            is_active: false,
            is_verified: false,
            approval_status: 'pending_onboarding',
            created_by_uno_team: true,
            uno_team_creator_id: user.id,
            source_urls: selected.business_website ? [selected.business_website] : null,
          })
          .select('id')
          .single();
        if (pErr) throw pErr;
        resulting_provider_id = provider.id;
      }

      const newStatus: ClaimStatus =
        actionOpen === 'approve' ? 'approved'
        : actionOpen === 'reject' ? 'rejected'
        : 'duplicate';

      const { error } = await supabase
        .from('poi_claim_requests')
        .update({
          status: newStatus,
          reviewed_by: user.id,
          reviewed_at: new Date().toISOString(),
          reviewer_notes: notes.trim() || null,
          resulting_provider_id,
        })
        .eq('id', selected.id);
      if (error) throw error;

      setClaims(prev => prev.map(c => c.id === selected.id ? {
        ...c,
        status: newStatus,
        reviewed_by: user.id,
        reviewed_at: new Date().toISOString(),
        reviewer_notes: notes.trim() || null,
        resulting_provider_id,
      } : c));

      toast.success(
        actionOpen === 'approve' ? t('Заявка одобрена, создан провайдер', 'Claim approved, provider created')
        : actionOpen === 'reject' ? t('Заявка отклонена', 'Claim rejected')
        : t('Заявка помечена как дубль', 'Claim marked as duplicate')
      );
      setActionOpen(null);
      setSelected(null);
      setNotes('');
    } catch (e) {
      console.error('[AdminPoiClaims] action failed', e);
      toast.error(t('Не удалось обновить статус', 'Failed to update status'));
    } finally {
      setProcessing(false);
    }
  };

  if (adminLoading) {
    return <PageContainer><div className="py-12 text-center text-muted-foreground">{t('Проверка прав…', 'Checking access…')}</div></PageContainer>;
  }
  if (!isAdmin) {
    return (
      <PageContainer>
        <PageHeader title={t('Доступ запрещён', 'Access denied')} />
        <p className="text-muted-foreground">{t('Только для администраторов.', 'Admins only.')}</p>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader
        title={t('Заявки на claim POI', 'POI Claim Requests')}
        subtitle={t(
          'Модерация заявок владельцев бизнеса на привязку точки к myUNO',
          'Moderate business owners’ requests to claim a map POI'
        )}
        actions={
          <Button variant="outline" size="sm" onClick={() => void fetchClaims()} disabled={loading}>
            <RefreshCw className={cn('h-4 w-4 mr-2', loading && 'animate-spin')} />
            {t('Обновить', 'Refresh')}
          </Button>
        }
      />

      <SectionCard className="mb-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <Tabs value={tab} onValueChange={(v) => setTab(v as ClaimStatus | 'all')}>
            <TabsList className="flex-wrap">
              <TabsTrigger value="pending">{t('Ожидают', 'Pending')} ({counts.pending || 0})</TabsTrigger>
              <TabsTrigger value="approved">{t('Одобрены', 'Approved')} ({counts.approved || 0})</TabsTrigger>
              <TabsTrigger value="rejected">{t('Отклонены', 'Rejected')} ({counts.rejected || 0})</TabsTrigger>
              <TabsTrigger value="duplicate">{t('Дубли', 'Duplicates')} ({counts.duplicate || 0})</TabsTrigger>
              <TabsTrigger value="all">{t('Все', 'All')} ({counts.all})</TabsTrigger>
            </TabsList>
          </Tabs>
          <div className="relative md:w-72">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              className="pl-8"
              placeholder={t('Поиск по имени, бизнесу, email…', 'Search by name, business, email…')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
      </SectionCard>

      {loading ? (
        <div className="py-12 text-center text-muted-foreground">{t('Загрузка…', 'Loading…')}</div>
      ) : visible.length === 0 ? (
        <SectionCard>
          <div className="py-10 text-center text-muted-foreground">
            {t('Нет заявок в этом разделе', 'No claims in this section')}
          </div>
        </SectionCard>
      ) : (
        <div className="grid gap-3">
          {visible.map((c) => {
            const meta = STATUS_META[c.status];
            const StatusIcon = meta.icon;
            return (
              <SectionCard key={c.id} className="hover:border-primary/30 transition-colors">
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <h3 className="font-semibold truncate">{c.poi_name}</h3>
                      <Badge variant="outline" className={meta.cls}>
                        <StatusIcon className="h-3 w-3 mr-1" />
                        {language === 'ru' ? meta.ru : meta.en}
                      </Badge>
                      {c.poi_category && (
                        <Badge variant="outline" className="text-xs">{c.poi_category}</Badge>
                      )}
                      {c.target_vertical && (
                        <Badge variant="outline" className="text-xs bg-primary/5">→ {c.target_vertical}</Badge>
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground space-y-0.5">
                      {c.business_name && (
                        <div className="flex items-center gap-1.5"><Building2 className="h-3.5 w-3.5" />{c.business_name}</div>
                      )}
                      <div className="flex items-center gap-1.5"><Mail className="h-3.5 w-3.5" />{c.owner_name} · {c.owner_email}</div>
                      {c.owner_phone && (
                        <div className="flex items-center gap-1.5"><Phone className="h-3.5 w-3.5" />{c.owner_phone}</div>
                      )}
                      {c.business_website && (
                        <div className="flex items-center gap-1.5">
                          <Globe className="h-3.5 w-3.5" />
                          <a href={c.business_website} target="_blank" rel="noreferrer" className="underline truncate">
                            {c.business_website}
                          </a>
                        </div>
                      )}
                      {(c.lat != null && c.lng != null) && (
                        <div className="flex items-center gap-1.5">
                          <MapPin className="h-3.5 w-3.5" />
                          {Number(c.lat).toFixed(5)}, {Number(c.lng).toFixed(5)}
                        </div>
                      )}
                      <div className="text-xs opacity-70 pt-1">
                        {format(new Date(c.created_at), 'PPp', { locale: dateLocale })}
                        {c.osm_type && c.osm_id && <> · OSM {c.osm_type}/{c.osm_id}</>}
                        {c.google_place_id && <> · Google {c.google_place_id.slice(0, 12)}…</>}
                      </div>
                      {c.message && (
                        <p className="mt-2 text-foreground/90 whitespace-pre-wrap">{c.message}</p>
                      )}
                      {c.reviewer_notes && (
                        <p className="mt-2 text-xs italic">
                          {t('Заметка модератора:', 'Reviewer notes:')} {c.reviewer_notes}
                        </p>
                      )}
                      {c.resulting_provider_id && (
                        <div className="mt-2">
                          <a
                            href={`/admin/providers/${c.resulting_provider_id}`}
                            className="inline-flex items-center gap-1 text-xs text-primary underline"
                          >
                            <ExternalLink className="h-3 w-3" />
                            {t('Открыть провайдера', 'Open provider')}
                          </a>
                        </div>
                      )}
                    </div>
                  </div>

                  {c.status === 'pending' ? (
                    <div className="flex flex-row md:flex-col gap-2 md:w-44">
                      <Button size="sm" onClick={() => openAction(c, 'approve')} className="flex-1">
                        <CheckCircle2 className="h-4 w-4 mr-1" />
                        {t('Одобрить', 'Approve')}
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => openAction(c, 'reject')} className="flex-1">
                        <XCircle className="h-4 w-4 mr-1" />
                        {t('Отклонить', 'Reject')}
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => openAction(c, 'duplicate')} className="flex-1">
                        <CopyIcon className="h-4 w-4 mr-1" />
                        {t('Дубль', 'Duplicate')}
                      </Button>
                    </div>
                  ) : (
                    <div className="md:w-44 text-xs text-muted-foreground md:text-right">
                      {c.reviewed_at && (
                        <>
                          {t('Решено', 'Reviewed')}: {format(new Date(c.reviewed_at), 'PP', { locale: dateLocale })}
                        </>
                      )}
                      <div className="mt-2">
                        <Button size="sm" variant="outline" onClick={() => openAction(c, 'approve')}>
                          {t('Изменить', 'Re-decide')}
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </SectionCard>
            );
          })}
        </div>
      )}

      <Dialog open={!!actionOpen} onOpenChange={(open) => { if (!open) { setActionOpen(null); setSelected(null); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionOpen === 'approve' && t('Одобрить заявку', 'Approve claim')}
              {actionOpen === 'reject' && t('Отклонить заявку', 'Reject claim')}
              {actionOpen === 'duplicate' && t('Пометить как дубль', 'Mark as duplicate')}
            </DialogTitle>
            <DialogDescription>
              {selected?.poi_name}
              {actionOpen === 'approve' && !selected?.resulting_provider_id && (
                <span className="block mt-2 text-xs">
                  {t(
                    'Будет создан провайдер (неактивный) и связан с этой заявкой. Активация — на странице провайдера.',
                    'A provider (inactive) will be created and linked to this claim. Activation happens on the provider page.'
                  )}
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder={t('Заметка модератора (опционально)', 'Reviewer notes (optional)')}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
          />
          <DialogFooter>
            <Button variant="ghost" onClick={() => setActionOpen(null)} disabled={processing}>
              {t('Отмена', 'Cancel')}
            </Button>
            <Button onClick={performAction} disabled={processing}>
              {processing ? t('Сохранение…', 'Saving…') : t('Подтвердить', 'Confirm')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
}
