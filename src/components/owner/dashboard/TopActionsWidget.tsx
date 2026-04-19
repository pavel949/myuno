/**
 * Top 5 AI-suggested actions from ai_task_suggestions table.
 * Falls back to founder inbox items if no suggestions exist yet.
 */
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import {
  Zap, ChevronRight, Phone, FileText, Send, Eye, CheckCircle,
} from 'lucide-react';
import { useFounderInbox } from '@/hooks/useFounderInbox';

interface AISuggestion {
  id: string;
  title: string;
  description: string | null;
  priority: string;
  action_type: string;
  target_entity_type: string | null;
  target_entity_id: string | null;
  status: string;
}

const ACTION_ICONS: Record<string, React.ElementType> = {
  call: Phone,
  review: Eye,
  send: Send,
  approve: CheckCircle,
  document: FileText,
};

export function TopActionsWidget() {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const isRu = language === 'ru';

  // Try AI suggestions first
  const { data: suggestions, isLoading: loadingSuggestions } = useQuery({
    queryKey: ['ai-task-suggestions-top5'],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('ai_task_suggestions')
        .select('*')
        .eq('status', 'pending')
        .order('impact_score', { ascending: false })
        .limit(5);
      if (error) throw error;
      return (data || []) as AISuggestion[];
    },
    staleTime: 30_000,
  });

  // Fallback to founder inbox
  const { data: inboxItems, isLoading: loadingInbox } = useFounderInbox(5);

  const isLoading = loadingSuggestions || loadingInbox;
  const hasAISuggestions = (suggestions?.length || 0) > 0;

  // Build display items
  const items = hasAISuggestions
    ? (suggestions || []).map((s) => ({
        id: s.id,
        title: s.title,
        subtitle: s.description || '',
        priority: s.priority as 'high' | 'medium' | 'low',
        icon: ACTION_ICONS[s.action_type] || Zap,
      }))
    : (inboxItems || []).slice(0, 5).map((item) => ({
        id: item.id,
        title: item.title,
        subtitle: `${item.source_type} • ${item.status}`,
        priority: item.priority,
        icon: item.source_type === 'task' ? CheckCircle : item.source_type === 'deal' ? FileText : Phone,
      }));

  if (isLoading) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-5 w-36" />
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <section className="space-y-2">
        <h3 className="font-semibold text-[15px] flex items-center gap-2 px-1">
          <Zap className="h-4 w-4 text-primary" />
          {isRu ? 'Топ действия' : 'Top Actions'}
        </h3>
        <Card className="border-dashed">
          <CardContent className="py-4 text-center text-muted-foreground text-sm">
            {isRu ? '✨ Нет приоритетных действий' : '✨ No priority actions right now'}
          </CardContent>
        </Card>
      </section>
    );
  }

  const priorityDot = {
    high: 'bg-destructive',
    medium: 'bg-warning',
    low: 'bg-muted-foreground',
  };

  return (
    <section className="space-y-2">
      <div className="flex items-center justify-between px-1">
        <h3 className="font-semibold text-[15px] flex items-center gap-2">
          <Zap className="h-4 w-4 text-primary" />
          {isRu ? 'Топ-5 сейчас' : 'Top 5 Now'}
          {hasAISuggestions && (
            <Badge variant="outline" className="text-[10px] px-1.5 py-0 ml-1">AI</Badge>
          )}
        </h3>
      </div>

      <div className="space-y-1.5">
        {items.map((item, idx) => {
          const Icon = item.icon;
          return (
            <Card
              key={item.id}
              className="cursor-pointer hover:shadow-sm transition-shadow"
              onClick={() => navigate('/mc/tasks')}
            >
              <CardContent className="p-2.5 flex items-center gap-2.5">
                <span className="text-xs font-bold text-muted-foreground w-5 text-center shrink-0">
                  {idx + 1}
                </span>
                <div className={cn('w-1.5 h-1.5 rounded-full shrink-0', priorityDot[item.priority])} />
                <Icon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{item.title}</p>
                  {item.subtitle && (
                    <p className="text-xs text-muted-foreground truncate">{item.subtitle}</p>
                  )}
                </div>
                <ChevronRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              </CardContent>
            </Card>
          );
        })}
      </div>
    </section>
  );
}
