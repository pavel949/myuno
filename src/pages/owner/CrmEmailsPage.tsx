import React, { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useActiveCompany } from '@/hooks/useActiveCompany';
import { useCrmEmails, useCreateCrmEmail, useSendCrmEmail } from '@/hooks/useCrmEmails';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Plus, Mail, Send, Trash2, Eye } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

const STATUS_BADGE: Record<string, string> = {
  draft: 'secondary',
  sent: 'default',
  failed: 'destructive',
  opened: 'outline',
};

export default function CrmEmailsPage() {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const { user } = useAuth();
  const { activeCompany } = useActiveCompany();
  const companyId = activeCompany?.company_id;
  const { data: emails = [], isLoading, isError: emailsError, refetch: refetchEmails } = useCrmEmails(companyId);
  const createEmail = useCreateCrmEmail();
  const sendEmail = useSendCrmEmail();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ to_email: '', subject: '', body_html: '' });

  const handleCreate = async () => {
    if (!companyId || !user) return;
    try {
      const email = await createEmail.mutateAsync({
        company_id: companyId,
        contact_id: '', // Would normally be set from context
        deal_id: null,
        direction: 'outbound',
        to_email: form.to_email,
        subject: form.subject,
        body_html: form.body_html,
        status: 'draft',
        sent_at: null,
        opened_at: null,
        sent_by: user.id,
      });
      setOpen(false);
      setForm({ to_email: '', subject: '', body_html: '' });
      toast({ title: isRu ? 'Черновик создан' : 'Draft created' });
    } catch {
      toast({ title: isRu ? 'Ошибка' : 'Error', variant: 'destructive' });
    }
  };

  const handleSend = async (id: string) => {
    try {
      await sendEmail.mutateAsync(id);
      toast({ title: isRu ? 'Email отправлен' : 'Email sent' });
    } catch {
      toast({ title: isRu ? 'Ошибка отправки' : 'Send failed', variant: 'destructive' });
    }
  };

  if (emailsError) {
    return (
      <div className="p-4 md:p-6 lg:p-8 text-center pt-20 max-w-[1536px] mx-auto">
        <p className="text-destructive font-medium">{isRu ? 'Ошибка загрузки писем' : 'Failed to load emails'}</p>
        <Button variant="outline" size="sm" className="mt-3" onClick={() => refetchEmails()}>
          {isRu ? 'Повторить' : 'Retry'}
        </Button>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6 max-w-[1536px] mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{isRu ? 'CRM Email' : 'CRM Email'}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {isRu ? 'Управление email-коммуникациями' : 'Manage email communications'}
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" />{isRu ? 'Новый email' : 'New Email'}</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{isRu ? 'Новый email' : 'New Email'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-3 mt-2">
              <div>
                <Label>To</Label>
                <Input type="email" value={form.to_email} onChange={e => setForm(f => ({ ...f, to_email: e.target.value }))} placeholder="client@example.com" />
              </div>
              <div>
                <Label>{isRu ? 'Тема' : 'Subject'}</Label>
                <Input value={form.subject} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))} />
              </div>
              <div>
                <Label>{isRu ? 'Содержание' : 'Body'}</Label>
                <Textarea value={form.body_html} onChange={e => setForm(f => ({ ...f, body_html: e.target.value }))} rows={5} />
              </div>
              <Button onClick={handleCreate} disabled={!form.to_email || !form.subject || createEmail.isPending} className="w-full">
                {isRu ? 'Сохранить черновик' : 'Save Draft'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">{isRu ? 'Загрузка...' : 'Loading...'}</p>
      ) : emails.length === 0 ? (
        <Card className="p-12 text-center">
          <Mail className="h-12 w-12 mx-auto text-muted-foreground/30 mb-3" />
          <p className="text-muted-foreground">{isRu ? 'Нет писем' : 'No emails yet'}</p>
        </Card>
      ) : (
        <div className="space-y-2">
          {emails.map(e => (
            <Card key={e.id} className="hover:bg-muted/50 transition-colors">
              <CardContent className="p-4 flex items-center gap-4">
                <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium truncate">{e.subject}</span>
                    <Badge variant={STATUS_BADGE[e.status] as any || 'secondary'} className="text-[10px]">
                      {e.status}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    → {e.to_email} · {format(new Date(e.created_at), 'dd.MM.yyyy HH:mm')}
                  </p>
                </div>
                {e.status === 'draft' && (
                  <Button variant="outline" size="sm" onClick={() => handleSend(e.id)} disabled={sendEmail.isPending}>
                    <Send className="h-3.5 w-3.5 mr-1" />
                    {isRu ? 'Отправить' : 'Send'}
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
