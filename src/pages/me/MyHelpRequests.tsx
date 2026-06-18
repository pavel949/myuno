/**
 * MyHelpRequests — список заявок «Помощь myUNO» текущего пользователя.
 * Доступ только авторизованным; гостевые заявки идут на менеджера напрямую.
 */
import { useEffect, useState } from 'react';
import { Loader2, MessageCircleQuestion, Clock, CheckCircle2, AlertCircle } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { ConciergeHelpCTA } from '@/components/concierge/ConciergeHelpCTA';
import { formatDistanceToNow } from 'date-fns';
import { ru as ruLocale, enUS } from 'date-fns/locale';

type HelpRequest = {
  id: string;
  topic: string;
  subject: string | null;
  message: string;
  urgency: string;
  status: string;
  created_at: string;
};

const TOPIC_LABEL: Record<string, { ru: string; en: string }> = {
  visa: { ru: 'Виза', en: 'Visa' },
  invest: { ru: 'Инвестиции', en: 'Investment' },
  business: { ru: 'Бизнес', en: 'Business' },
  relocation: { ru: 'Переезд', en: 'Relocation' },
  property: { ru: 'Недвижимость', en: 'Property' },
  legal: { ru: 'Юр. вопрос', en: 'Legal' },
  finance: { ru: 'Финансы', en: 'Finance' },
  general: { ru: 'Общее', en: 'General' },
};

const STATUS_ICON: Record<string, React.ComponentType<{ className?: string }>> = {
  new: Clock,
  triaged: Clock,
  in_progress: AlertCircle,
  waiting_user: AlertCircle,
  closed: CheckCircle2,
  spam: AlertCircle,
};

const STATUS_LABEL: Record<string, { ru: string; en: string }> = {
  new: { ru: 'Новая', en: 'New' },
  triaged: { ru: 'В обработке', en: 'Triaged' },
  in_progress: { ru: 'В работе', en: 'In progress' },
  waiting_user: { ru: 'Ждём ответ', en: 'Waiting on you' },
  closed: { ru: 'Закрыта', en: 'Closed' },
  spam: { ru: 'Спам', en: 'Spam' },
};

export default function MyHelpRequests() {
  const { language } = useLanguage();
  const { user, isLoading: authLoading } = useAuth();
  const isRu = language === 'ru';
  const [requests, setRequests] = useState<HelpRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      const { data, error } = await supabase
        .from('help_requests')
        .select('id, topic, subject, message, urgency, status, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (cancelled) return;
      if (error) {
        console.error('[MyHelpRequests] load failed:', error);
      } else {
        setRequests((data ?? []) as HelpRequest[]);
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [user, authLoading]);

  return (
    <AppLayout>
      <div className="container max-w-3xl py-6 sm:py-10 space-y-6">
        <header className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">
            {isRu ? 'Мои заявки myUNO' : 'My myUNO Requests'}
          </h1>
          <p className="text-sm text-muted-foreground">
            {isRu
              ? 'История ваших обращений к менеджерам myUNO.'
              : 'History of your requests to myUNO managers.'}
          </p>
        </header>

        {!user && !authLoading ? (
          <Card className="p-6 text-center space-y-3">
            <p className="text-sm text-muted-foreground">
              {isRu ? 'Войдите, чтобы увидеть свои заявки.' : 'Sign in to view your requests.'}
            </p>
          </Card>
        ) : loading || authLoading ? (
          <div className="flex items-center justify-center py-12 text-muted-foreground">
            <Loader2 className="w-5 h-5 animate-spin" />
          </div>
        ) : requests.length === 0 ? (
          <Card className="p-8 text-center space-y-4">
            <MessageCircleQuestion className="w-10 h-10 mx-auto text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              {isRu ? 'У вас пока нет заявок.' : "You haven't sent any requests yet."}
            </p>
          </Card>
        ) : (
          <div className="space-y-3">
            {requests.map((r) => {
              const StatusIcon = STATUS_ICON[r.status] ?? Clock;
              const topicCopy = TOPIC_LABEL[r.topic]?.[isRu ? 'ru' : 'en'] ?? r.topic;
              const statusCopy = STATUS_LABEL[r.status]?.[isRu ? 'ru' : 'en'] ?? r.status;
              return (
                <Card key={r.id} className="p-4 space-y-2">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="secondary" className="rounded-sm">
                          {topicCopy}
                        </Badge>
                        {r.urgency === 'urgent' && (
                          <Badge variant="destructive" className="rounded-sm text-[10px]">
                            {isRu ? 'Срочно' : 'Urgent'}
                          </Badge>
                        )}
                      </div>
                      <div className="font-medium mt-2 truncate">
                        {r.subject ?? r.message.slice(0, 80)}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {formatDistanceToNow(new Date(r.created_at), {
                          addSuffix: true,
                          locale: isRu ? ruLocale : enUS,
                        })}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground shrink-0">
                      <StatusIcon className="w-3.5 h-3.5" />
                      {statusCopy}
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-2">{r.message}</p>
                </Card>
              );
            })}
          </div>
        )}

        <ConciergeHelpCTA topic="general" variant="card" />
      </div>
    </AppLayout>
  );
}
