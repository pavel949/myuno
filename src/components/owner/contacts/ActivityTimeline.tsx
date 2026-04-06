import React, { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCrmActivities, useLogActivity, ACTIVITY_TYPES, ACTIVITY_OUTCOMES, ACTIVITY_TYPE_CONFIG } from '@/hooks/useCrmActivities';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Plus, Phone, Mail, Users, FileText, MessageCircle, MessageSquare, Eye, Send, ClipboardList, CheckCircle, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { toast } from 'sonner';

const iconMap: Record<string, React.ElementType> = {
  Phone, Mail, MailOpen: Mail, Users, FileText, MessageCircle, MessageSquare,
  CheckCircle, ArrowRight, Eye, Send, ClipboardList,
};

interface Props {
  companyId: string;
  contactId?: string;
  dealId?: string;
}

export function ActivityTimeline({ companyId, contactId, dealId }: Props) {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const { user } = useAuth();
  const { data: activities = [], isLoading } = useCrmActivities(contactId, dealId);
  const logActivity = useLogActivity();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ activity_type: 'call', subject: '', description: '', outcome: '', duration_minutes: '' });

  const handleSubmit = async () => {
    if (!user) return;
    try {
      await logActivity.mutateAsync({
        company_id: companyId,
        contact_id: contactId || null,
        deal_id: dealId || null,
        activity_type: form.activity_type,
        subject: form.subject || null,
        description: form.description || null,
        outcome: form.outcome || null,
        duration_minutes: form.duration_minutes ? Number(form.duration_minutes) : null,
        metadata: null,
        logged_by: user.id,
        activity_date: new Date().toISOString(),
      });
      toast(isRu)toast.error(isRu, { description: '' }))}
                        className={cn(
                          'px-2.5 py-1 rounded-full text-xs border transition-colors',
                          form.activity_type === t
                            ? 'bg-primary text-primary-foreground border-primary'
                            : 'bg-card border-border text-muted-foreground hover:border-primary/50',
                        )}
                      >
                        {isRu ? cfg?.labelRu : cfg?.labelEn}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div>
                <Label>{isRu ? 'Тема' : 'Subject'}</Label>
                <Input value={form.subject} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))} />
              </div>
              <div>
                <Label>{isRu ? 'Результат' : 'Outcome'}</Label>
                <Select value={form.outcome} onValueChange={v => setForm(f => ({ ...f, outcome: v }))}>
                  <SelectTrigger><SelectValue placeholder={isRu ? 'Выберите' : 'Select'} /></SelectTrigger>
                  <SelectContent>
                    {ACTIVITY_OUTCOMES.map(o => (
                      <SelectItem key={o} value={o}>{o}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>{isRu ? 'Описание' : 'Description'}</Label>
                <Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={2} />
              </div>
              <Button onClick={handleSubmit} disabled={logActivity.isPending} className="w-full">
                {logActivity.isPending ? '...' : (isRu ? 'Сохранить' : 'Save')}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <p className="text-xs text-muted-foreground">{isRu ? 'Загрузка...' : 'Loading...'}</p>
      ) : activities.length === 0 ? (
        <p className="text-xs text-muted-foreground text-center py-4">
          {isRu ? 'Нет активности' : 'No activity yet'}
        </p>
      ) : (
        <div className="space-y-1">
          {activities.map(a => {
            const cfg = ACTIVITY_TYPE_CONFIG[a.activity_type] || ACTIVITY_TYPE_CONFIG.note;
            const IconComp = iconMap[cfg.icon] || FileText;
            return (
              <div key={a.id} className="flex items-start gap-2 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                <div className={cn('mt-0.5 p-1 rounded', cfg.color.replace('text-', 'bg-') + '/10')}>
                  <IconComp className={cn('h-3.5 w-3.5', cfg.color)} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium">{isRu ? cfg.labelRu : cfg.labelEn}</span>
                    {a.outcome && (
                      <Badge variant="secondary" className="text-[9px] h-4">{a.outcome}</Badge>
                    )}
                    <span className="text-[10px] text-muted-foreground ml-auto">
                      {format(new Date(a.activity_date), 'dd.MM HH:mm')}
                    </span>
                  </div>
                  {a.subject && <p className="text-xs text-foreground mt-0.5">{a.subject}</p>}
                  {a.description && <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2">{a.description}</p>}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
