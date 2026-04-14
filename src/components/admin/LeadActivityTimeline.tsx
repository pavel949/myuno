import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Phone, Mail, MessageCircle, StickyNote, ArrowRight, UserPlus,
  Clock, CheckCircle2, XCircle, PhoneOff, PhoneForwarded, Plus
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { ru, enUS } from 'date-fns/locale';

type ActivityType = 'call' | 'email' | 'whatsapp' | 'note' | 'status_change' | 'assignment';
type CallResult = 'answered' | 'no_answer' | 'busy' | 'callback_requested' | 'wrong_number';

interface LeadActivity {
  id: string;
  lead_id: string;
  user_id: string | null;
  activity_type: ActivityType;
  status_from: string | null;
  status_to: string | null;
  notes: string | null;
  call_duration_seconds: number | null;
  call_result: CallResult | null;
  created_at: string;
  // Joined fields
  user_name?: string;
  user_email?: string;
}

interface CreateActivityInput {
  lead_id: string;
  activity_type: ActivityType;
  status_from?: string;
  status_to?: string;
  notes?: string;
  call_duration_seconds?: number;
  call_result?: CallResult;
}

function useLeadActivityLog(leadId?: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: activities, isLoading } = useQuery({
    queryKey: ['lead-activity', leadId],
    queryFn: async () => {
      if (!leadId) return [];

      const { data, error } = await supabase
        .from('lead_activity_log')
        .select('*')
        .eq('lead_id', leadId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Get user info for activities
      const userIds = [...new Set((data || []).map(a => a.user_id).filter(Boolean))];

      let userMap: Record<string, { full_name: string | null; email: string | null }> = {};
      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, full_name, email')
          .in('id', userIds);

        userMap = (profiles || []).reduce((acc, p) => {
          acc[p.id] = { full_name: p.full_name, email: p.email };
          return acc;
        }, {} as Record<string, { full_name: string | null; email: string | null }>);
      }

      return (data || []).map(a => ({
        ...a,
        user_name: a.user_id ? userMap[a.user_id]?.full_name : null,
        user_email: a.user_id ? userMap[a.user_id]?.email : null,
      })) as LeadActivity[];
    },
    enabled: !!leadId,
  });

  const logActivity = useMutation({
    mutationFn: async (input: CreateActivityInput) => {
      const { error } = await supabase
        .from('lead_activity_log')
        .insert({
          ...input,
          user_id: user?.id,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lead-activity', leadId] });
      queryClient.invalidateQueries({ queryKey: ['team-leads'] });
      queryClient.invalidateQueries({ queryKey: ['admin-lead-analytics'] });
    },
    onError: () => {
      toast.error('Ошибка', { description: 'Не удалось сохранить активность' });
    },
  });

  return {
    activities,
    isLoading,
    logActivity: logActivity.mutateAsync,
    isLogging: logActivity.isPending,
  };
}

const ACTIVITY_ICONS: Record<ActivityType, typeof Phone> = {
  call: Phone,
  email: Mail,
  whatsapp: MessageCircle,
  note: StickyNote,
  status_change: ArrowRight,
  assignment: UserPlus,
};

const CALL_RESULT_CONFIG: Record<CallResult, { icon: typeof CheckCircle2; color: string; labelRu: string; labelEn: string }> = {
  answered: { icon: CheckCircle2, color: 'text-success', labelRu: 'Ответил', labelEn: 'Answered' },
  no_answer: { icon: PhoneOff, color: 'text-warning', labelRu: 'Не ответил', labelEn: 'No Answer' },
  busy: { icon: Clock, color: 'text-warning', labelRu: 'Занято', labelEn: 'Busy' },
  callback_requested: { icon: PhoneForwarded, color: 'text-info', labelRu: 'Перезвонить', labelEn: 'Callback' },
  wrong_number: { icon: XCircle, color: 'text-destructive', labelRu: 'Неверный номер', labelEn: 'Wrong Number' },
};

interface LeadActivityTimelineProps {
  leadId: string;
  compact?: boolean;
}

export function LeadActivityTimeline({ leadId, compact = false }: LeadActivityTimelineProps) {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const { activities, isLoading, logActivity, isLogging } = useLeadActivityLog(leadId);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newActivity, setNewActivity] = useState<{
    type: ActivityType;
    notes: string;
    callResult?: CallResult;
  }>({
    type: 'call',
    notes: '',
  });

  const handleAddActivity = async () => {
    await logActivity({
      lead_id: leadId,
      activity_type: newActivity.type,
      notes: newActivity.notes || undefined,
      call_result: newActivity.type === 'call' ? newActivity.callResult : undefined,
    });
    setNewActivity({ type: 'call', notes: '' });
    setShowAddDialog(false);
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map(i => <Skeleton key={i} className="h-16 w-full" />)}
      </div>
    );
  }

  const displayActivities = compact ? activities?.slice(0, 5) : activities;

  return (
    <div className="space-y-4">
      {/* Add Activity Button */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogTrigger asChild>
          <Button size="sm" className="w-full gap-2">
            <Plus className="h-4 w-4" />
            {isRu ? 'Добавить активность' : 'Add Activity'}
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{isRu ? 'Записать активность' : 'Log Activity'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">
                {isRu ? 'Тип активности' : 'Activity Type'}
              </label>
              <Select 
                value={newActivity.type} 
                onValueChange={(v) => setNewActivity(prev => ({ ...prev, type: v as ActivityType }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="call">{isRu ? 'Звонок' : 'Call'}</SelectItem>
                  <SelectItem value="whatsapp">WhatsApp</SelectItem>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="note">{isRu ? 'Заметка' : 'Note'}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {newActivity.type === 'call' && (
              <div>
                <label className="text-sm font-medium mb-2 block">
                  {isRu ? 'Результат звонка' : 'Call Result'}
                </label>
                <Select 
                  value={newActivity.callResult || ''} 
                  onValueChange={(v) => setNewActivity(prev => ({ ...prev, callResult: v as CallResult }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={isRu ? 'Выберите результат' : 'Select result'} />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(CALL_RESULT_CONFIG).map(([key, config]) => (
                      <SelectItem key={key} value={key}>
                        {isRu ? config.labelRu : config.labelEn}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div>
              <label className="text-sm font-medium mb-2 block">
                {isRu ? 'Заметки' : 'Notes'}
              </label>
              <Textarea 
                value={newActivity.notes}
                onChange={(e) => setNewActivity(prev => ({ ...prev, notes: e.target.value }))}
                placeholder={isRu ? 'Добавьте описание...' : 'Add description...'}
                rows={3}
              />
            </div>

            <Button onClick={handleAddActivity} disabled={isLogging} className="w-full">
              {isLogging ? (isRu ? 'Сохранение...' : 'Saving...') : (isRu ? 'Сохранить' : 'Save')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Timeline */}
      {!displayActivities?.length ? (
        <p className="text-sm text-muted-foreground text-center py-4">
          {isRu ? 'Нет записей активности' : 'No activity records'}
        </p>
      ) : (
        <div className="space-y-3">
          {displayActivities.map(activity => (
            <ActivityItem key={activity.id} activity={activity} isRu={isRu} />
          ))}
        </div>
      )}

      {compact && activities && activities.length > 5 && (
        <p className="text-xs text-center text-muted-foreground">
          +{activities.length - 5} {isRu ? 'записей' : 'more'}
        </p>
      )}
    </div>
  );
}

function ActivityItem({ activity, isRu }: { activity: LeadActivity; isRu: boolean }) {
  const Icon = ACTIVITY_ICONS[activity.activity_type] || StickyNote;
  const callResult = activity.call_result ? CALL_RESULT_CONFIG[activity.call_result] : null;

  const getActivityLabel = () => {
    switch (activity.activity_type) {
      case 'call': return isRu ? 'Звонок' : 'Call';
      case 'email': return 'Email';
      case 'whatsapp': return 'WhatsApp';
      case 'note': return isRu ? 'Заметка' : 'Note';
      case 'status_change': 
        return `${activity.status_from} → ${activity.status_to}`;
      case 'assignment': return isRu ? 'Назначение' : 'Assignment';
      default: return activity.activity_type;
    }
  };

  return (
    <div className="flex gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
      <div className="p-2 rounded-full bg-background shrink-0">
        <Icon className="h-4 w-4" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-medium text-sm">{getActivityLabel()}</span>
          {callResult && (
            <Badge variant="outline" className={`gap-1 ${callResult.color}`}>
              <callResult.icon className="h-3 w-3" />
              {isRu ? callResult.labelRu : callResult.labelEn}
            </Badge>
          )}
        </div>
        {activity.notes && (
          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{activity.notes}</p>
        )}
        <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
          <span>{activity.user_name || activity.user_email || (isRu ? 'Система' : 'System')}</span>
          <span>•</span>
          <span>
            {formatDistanceToNow(new Date(activity.created_at), { 
              addSuffix: true, 
              locale: isRu ? ru : enUS 
            })}
          </span>
        </div>
      </div>
    </div>
  );
}
