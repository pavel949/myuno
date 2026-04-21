/**
 * MyJourneyRecommendations — surfaces the latest concierge_journey for the
 * current user (or anonymous session) at the top of /discover.
 *
 * - Authed users: query by user_id.
 * - Anonymous: query via anon_session_id stored in localStorage by /start.
 * Renders nothing if no journey exists yet (silent no-op).
 */
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, ArrowRight, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useFeatureFlag } from '@/hooks/useFeatureFlag';
import { Surface } from '@/components/ui/surface';
import { cn } from '@/lib/utils';

interface JourneyItem {
  title: { en: string; ru: string };
  description: { en: string; ru: string };
  route: string;
  icon: string;
  urgency?: 'high' | 'medium' | 'low';
}

interface JourneyRow {
  id: string;
  recommended_services: unknown;
  primary_cta: string | null;
  reasoning: string | null;
  generator: string | null;
  created_at: string;
}

const ANON_KEY = 'myuno-anon-session-id';

export function MyJourneyRecommendations() {
  const { user } = useAuth();
  const { language } = useLanguage();
  const navigate = useNavigate();
  const flagOn = useFeatureFlag('concierge_routing_v1', false);
  const [journey, setJourney] = useState<JourneyRow | null>(null);
  const [loading, setLoading] = useState(true);
  const isRu = language === 'ru';

  useEffect(() => {
    if (!flagOn) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    const load = async () => {
      try {
        let query = supabase
          .from('concierge_journeys' as any)
          .select('id, recommended_services, primary_cta, reasoning, generator, created_at')
          .order('created_at', { ascending: false })
          .limit(1);

        if (user?.id) {
          query = query.eq('user_id', user.id);
        } else {
          const anon = localStorage.getItem(ANON_KEY);
          if (!anon) {
            if (!cancelled) setLoading(false);
            return;
          }
          // Join via concierge_sessions.anon_session_id
          const { data: sessions } = await supabase
            .from('concierge_sessions' as any)
            .select('id')
            .eq('anon_session_id', anon)
            .order('created_at', { ascending: false })
            .limit(1);
          const sid = (sessions as any)?.[0]?.id as string | undefined;
          if (!sid) {
            if (!cancelled) setLoading(false);
            return;
          }
          query = query.eq('session_id', sid);
        }

        const { data, error } = await query.maybeSingle();
        if (cancelled) return;
        if (!error && data) setJourney(data as unknown as JourneyRow);
      } catch (e) {
        console.warn('Failed to load journey', e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [flagOn, user?.id]);

  if (!flagOn || loading || !journey) return null;

  const items = Array.isArray(journey.recommended_services)
    ? (journey.recommended_services as JourneyItem[])
    : [];
  if (items.length === 0) return null;

  const T = (c: { en: string; ru: string }) => (isRu ? c.ru : c.en);

  return (
    <Surface variant="muted" bordered padding="md" radius="2xl" className="space-y-4">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shrink-0 shadow-sm">
          <Sparkles className="w-5 h-5 text-primary-foreground" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-foreground">
            {isRu ? 'Ваш персональный маршрут' : 'Your personal path'}
          </h3>
          {journey.reasoning && (
            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{journey.reasoning}</p>
          )}
        </div>
        <button
          onClick={() => navigate('/start')}
          className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1 shrink-0"
          aria-label={isRu ? 'Пройти заново' : 'Redo'}
        >
          <RefreshCw className="w-3 h-3" />
          <span className="hidden sm:inline">{isRu ? 'Заново' : 'Redo'}</span>
        </button>
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        {items.slice(0, 4).map((item, idx) => (
          <button
            key={`${item.route}-${idx}`}
            onClick={() => navigate(item.route)}
            className={cn(
              'flex items-center gap-3 p-3 rounded-xl bg-card border text-left transition-all min-h-[64px]',
              'hover:border-primary/60 hover:bg-primary/5 active:scale-[0.99] touch-manipulation',
              idx === 0 ? 'border-primary/60 bg-primary/5' : 'border-border/60',
            )}
          >
            <span className="text-xl shrink-0" aria-hidden>
              {item.icon || '✨'}
            </span>
            <span className="flex-1 min-w-0">
              <span className="block text-sm font-semibold text-foreground truncate">
                {T(item.title)}
              </span>
              {item.description && (T(item.description) ?? '').length > 0 && (
                <span className="block text-xs text-muted-foreground truncate">
                  {T(item.description)}
                </span>
              )}
            </span>
            <ArrowRight className="w-4 h-4 text-muted-foreground/60 shrink-0" />
          </button>
        ))}
      </div>
    </Surface>
  );
}
