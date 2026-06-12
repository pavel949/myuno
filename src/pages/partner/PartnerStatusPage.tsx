import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Clock, CheckCircle2, XCircle, AlertCircle, Building2, Mail, Phone, Globe,
  Calendar, RefreshCw, ArrowRight, Loader2, FileText,
} from 'lucide-react';
import { format } from 'date-fns';
import { ru, enUS } from 'date-fns/locale';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageContainer } from '@/components/uno/PageContainer';
import { PageHeader } from '@/components/uno/PageHeader';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/page/EmptyState';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface PartnerApplication {
  id: string;
  business_name: string;
  business_category: string;
  business_description: string | null;
  contact_name: string;
  contact_email: string;
  contact_phone: string | null;
  website: string | null;
  status: string;
  rejection_reason: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  reviewed_at: string | null;
}

const STATUS_META: Record<string, { en: string; ru: string; icon: typeof Clock; cls: string }> = {
  pending: { en: 'Pending review', ru: 'На модерации', icon: Clock, cls: 'bg-warning/15 text-warning border-warning/30' },
  approved: { en: 'Approved', ru: 'Одобрена', icon: CheckCircle2, cls: 'bg-success/15 text-success border-success/30' },
  rejected: { en: 'Rejected', ru: 'Отклонена', icon: XCircle, cls: 'bg-destructive/15 text-destructive border-destructive/30' },
};

const PartnerStatusPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, isLoading: authLoading } = useAuth();
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const locale = isRu ? ru : enUS;

  const [apps, setApps] = useState<PartnerApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) navigate('/auth?redirect=/partner/status');
  }, [authLoading, user, navigate]);

  const load = async (silent = false) => {
    if (!user) return;
    if (silent) setRefreshing(true); else setLoading(true);
    const { data, error } = await supabase
      .from('partner_applications')
      .select('id, business_name, business_category, business_description, contact_name, contact_email, contact_phone, website, status, rejection_reason, notes, created_at, updated_at, reviewed_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    if (error) {
      toast.error(isRu ? 'Не удалось загрузить заявки' : 'Failed to load applications');
    } else {
      setApps((data || []) as PartnerApplication[]);
    }
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => {
    if (user) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const fmt = (iso: string) => format(new Date(iso), 'd MMM yyyy, HH:mm', { locale });

  const buildTimeline = (a: PartnerApplication) => {
    const items: { label: string; date: string; icon: typeof Clock; tone: string }[] = [
      {
        label: isRu ? 'Заявка отправлена' : 'Application submitted',
        date: a.created_at,
        icon: FileText,
        tone: 'text-primary',
      },
    ];
    if (a.status === 'pending' && a.updated_at && a.updated_at !== a.created_at) {
      items.push({
        label: isRu ? 'Заявка обновлена' : 'Application updated',
        date: a.updated_at,
        icon: RefreshCw,
        tone: 'text-muted-foreground',
      });
    }
    if (a.reviewed_at) {
      items.push({
        label: a.status === 'approved'
          ? (isRu ? 'Одобрена модератором' : 'Approved by moderator')
          : a.status === 'rejected'
            ? (isRu ? 'Отклонена модератором' : 'Rejected by moderator')
            : (isRu ? 'Рассмотрена' : 'Reviewed'),
        date: a.reviewed_at,
        icon: a.status === 'approved' ? CheckCircle2 : XCircle,
        tone: a.status === 'approved' ? 'text-success' : 'text-destructive',
      });
    }
    return items;
  };

  if (authLoading || loading) {
    return (
      <PageContainer>
        <div className="flex items-center justify-center py-32">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader
        title={isRu ? 'Мои заявки партнёра' : 'My partner applications'}
        subtitle={isRu
          ? 'Статус модерации, история изменений и решение по каждой заявке'
          : 'Moderation status, change history and decision for each application'}
      />

      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-muted-foreground">
          {isRu ? `Всего заявок: ${apps.length}` : `Total: ${apps.length}`}
        </p>
        <Button
          variant="outline"
          size="sm"
          onClick={() => load(true)}
          disabled={refreshing}
          className="rounded-none"
        >
          {refreshing ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : <RefreshCw className="h-4 w-4 mr-1.5" />}
          {isRu ? 'Обновить' : 'Refresh'}
        </Button>
      </div>

      {apps.length === 0 ? (
        <EmptyState
          icon={Building2}
          isRu={isRu}
          title="No applications yet"
          titleRu="Заявок пока нет"
          description="Submit a partner application to start listing your services on myUNO."
          descriptionRu="Отправьте заявку, чтобы начать продавать ваши услуги на myUNO."
          action={
            <Button onClick={() => navigate('/become-partner')} className="rounded-none">
              {isRu ? 'Стать партнёром' : 'Become a partner'}
              <ArrowRight className="h-4 w-4 ml-1.5" />
            </Button>
          }
        />
      ) : (
        <div className="space-y-4">
          {apps.map((app, idx) => {
            const meta = STATUS_META[app.status] || STATUS_META.pending;
            const StatusIcon = meta.icon;
            const timeline = buildTimeline(app);
            return (
              <motion.div
                key={app.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.04 }}
                className="border border-border bg-card"
              >
                {/* Header */}
                <div className="p-5 border-b border-border">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="min-w-0">
                      <h3 className="text-lg font-semibold truncate">{app.business_name}</h3>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {app.business_category} · #{app.id.slice(0, 8)}
                      </p>
                    </div>
                    <Badge variant="outline" className={cn('rounded-none gap-1.5 shrink-0', meta.cls)}>
                      <StatusIcon className="h-3.5 w-3.5" />
                      {isRu ? meta.ru : meta.en}
                    </Badge>
                  </div>
                </div>

                {/* Decision block */}
                {app.status === 'rejected' && app.rejection_reason && (
                  <div className="mx-5 mt-4 p-3 border border-destructive/30 bg-destructive/5 flex gap-2">
                    <AlertCircle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
                    <div className="text-sm">
                      <p className="font-medium text-destructive mb-0.5">
                        {isRu ? 'Причина отклонения' : 'Rejection reason'}
                      </p>
                      <p className="text-foreground/80">{app.rejection_reason}</p>
                    </div>
                  </div>
                )}
                {app.status === 'approved' && (
                  <div className="mx-5 mt-4 p-3 border border-success/30 bg-success/5 flex items-center justify-between gap-2">
                    <div className="flex gap-2">
                      <CheckCircle2 className="h-4 w-4 text-success shrink-0 mt-0.5" />
                      <p className="text-sm text-foreground/80">
                        {isRu
                          ? 'Профиль активирован. Откройте панель партнёра, чтобы продолжить.'
                          : 'Your profile is live. Open the partner dashboard to continue.'}
                      </p>
                    </div>
                    <Button size="sm" onClick={() => navigate('/vendor')} className="rounded-none shrink-0">
                      {isRu ? 'В панель' : 'Dashboard'}
                    </Button>
                  </div>
                )}
                {app.status === 'pending' && (
                  <div className="mx-5 mt-4 p-3 border border-warning/30 bg-warning/5 flex gap-2">
                    <Clock className="h-4 w-4 text-warning shrink-0 mt-0.5" />
                    <p className="text-sm text-foreground/80">
                      {isRu
                        ? 'Заявка в очереди модерации. Среднее время ответа — 24 часа. Решение придёт на email.'
                        : 'Application is in the moderation queue. Average response time is 24 hours. You will receive the decision by email.'}
                    </p>
                  </div>
                )}

                {/* Contact summary */}
                <div className="px-5 py-4 grid sm:grid-cols-2 gap-2 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Mail className="h-3.5 w-3.5" /> <span className="truncate">{app.contact_email}</span>
                  </div>
                  {app.contact_phone && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Phone className="h-3.5 w-3.5" /> <span>{app.contact_phone}</span>
                    </div>
                  )}
                  {app.website && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Globe className="h-3.5 w-3.5" /> <a href={app.website} target="_blank" rel="noreferrer" className="truncate hover:text-primary">{app.website}</a>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="h-3.5 w-3.5" /> <span>{fmt(app.created_at)}</span>
                  </div>
                </div>

                {app.notes && (
                  <div className="mx-5 mb-4 p-3 border border-border bg-muted/30 text-sm">
                    <p className="text-[11px] uppercase tracking-wide text-muted-foreground mb-1">
                      {isRu ? 'Заметка модератора' : 'Moderator note'}
                    </p>
                    <p className="text-foreground/80">{app.notes}</p>
                  </div>
                )}

                {/* Timeline */}
                <div className="px-5 pb-5">
                  <p className="text-[11px] uppercase tracking-wide text-muted-foreground mb-3">
                    {isRu ? 'История' : 'History'}
                  </p>
                  <ol className="relative border-l border-border ml-1.5 space-y-3">
                    {timeline.map((t, i) => {
                      const Icon = t.icon;
                      return (
                        <li key={i} className="pl-4 relative">
                          <span className={cn('absolute -left-[7px] top-1 h-3 w-3 rounded-full bg-card border-2', t.tone.replace('text-', 'border-'))} />
                          <div className="flex items-center gap-2">
                            <Icon className={cn('h-3.5 w-3.5', t.tone)} />
                            <span className="text-sm font-medium">{t.label}</span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5">{fmt(t.date)}</p>
                        </li>
                      );
                    })}
                  </ol>
                </div>
              </motion.div>
            );
          })}

          <div className="pt-4">
            <Button
              variant="outline"
              onClick={() => navigate('/become-partner')}
              className="rounded-none w-full sm:w-auto"
            >
              {isRu ? 'Подать ещё одну заявку' : 'Submit another application'}
            </Button>
          </div>
        </div>
      )}
    </PageContainer>
  );
};

export default PartnerStatusPage;
