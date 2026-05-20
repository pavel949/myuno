import { useState } from 'react';
import { Mail, MailCheck, MailMinus, ArrowDownLeft, ArrowUpRight, Plus, FilePlus2, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCrmEmails, useSendCrmEmail, type CrmEmail } from '@/hooks/useCrmEmails';
import { ContactEmailComposer } from './ContactEmailComposer';
import { ContactEmailLogger } from './ContactEmailLogger';
import { formatDistanceToNow, format } from 'date-fns';
import { ru, enUS } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface ContactEmailsSectionProps {
  contactId: string;
  companyId: string;
  contactEmail?: string | null;
}

const STATUS_STYLES: Record<string, string> = {
  draft: 'bg-muted text-muted-foreground',
  sent: 'bg-success/10 text-success border-success/20',
  logged: 'bg-info/10 text-info border-info/20',
  failed: 'bg-destructive/10 text-destructive border-destructive/20',
  received: 'bg-info/10 text-info border-info/20',
};

function statusLabel(status: string, isRu: boolean): string {
  const map: Record<string, [string, string]> = {
    draft: ['Черновик', 'Draft'],
    sent: ['Отправлено', 'Sent'],
    logged: ['Записано', 'Logged'],
    failed: ['Ошибка', 'Failed'],
    received: ['Получено', 'Received'],
  };
  const pair = map[status];
  if (!pair) return status;
  return isRu ? pair[0] : pair[1];
}

export function ContactEmailsSection({ contactId, companyId, contactEmail }: ContactEmailsSectionProps) {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const locale = isRu ? ru : enUS;
  const { data: emails = [], isLoading } = useCrmEmails(companyId, contactId);
  const sendEmail = useSendCrmEmail();
  const [composerOpen, setComposerOpen] = useState(false);
  const [loggerOpen, setLoggerOpen] = useState(false);

  const renderEmail = (email: CrmEmail) => {
    const inbound = email.direction === 'inbound';
    const StatusIcon = email.status === 'sent' ? MailCheck : email.status === 'failed' ? MailMinus : Mail;
    return (
      <div key={email.id} className="flex gap-3 p-3 rounded-none border bg-card">
        <div className="shrink-0 flex flex-col items-center gap-1 pt-0.5">
          <StatusIcon className={cn('h-4 w-4', email.status === 'sent' ? 'text-success' : email.status === 'failed' ? 'text-destructive' : 'text-muted-foreground')} />
          {inbound ? (
            <ArrowDownLeft className="h-3 w-3 text-info" />
          ) : (
            <ArrowUpRight className="h-3 w-3 text-primary" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <p className="text-sm font-medium truncate">{email.subject || (isRu ? '(без темы)' : '(no subject)')}</p>
            <Badge
              variant="outline"
              className={cn('text-[10px] shrink-0', STATUS_STYLES[email.status] ?? '')}
            >
              {statusLabel(email.status, isRu)}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground truncate mt-0.5">
            {inbound ? (isRu ? 'От: ' : 'From: ') : (isRu ? 'Кому: ' : 'To: ')}
            {email.to_email}
          </p>
          <div className="flex items-center gap-2 mt-1 text-[11px] text-muted-foreground flex-wrap">
            <span title={email.sent_at ?? email.created_at}>
              {formatDistanceToNow(new Date(email.sent_at ?? email.created_at), { addSuffix: true, locale })}
            </span>
            {email.opened_at && (
              <span className="text-success">
                · {isRu ? 'открыто' : 'opened'} {format(new Date(email.opened_at), 'd MMM HH:mm', { locale })}
              </span>
            )}
          </div>
          {email.status === 'draft' && (
            <Button
              size="sm"
              variant="outline"
              className="mt-2 h-7 text-xs"
              onClick={() => sendEmail.mutate(email.id)}
              disabled={sendEmail.isPending}
            >
              <Send className="h-3 w-3 mr-1" />
              {isRu ? 'Отправить' : 'Send'}
            </Button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Mail className="h-4 w-4 text-muted-foreground" />
          <p className="text-sm font-medium">{isRu ? 'Письма' : 'Emails'}</p>
          {emails.length > 0 && (
            <span className="text-xs text-muted-foreground">({emails.length})</span>
          )}
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => setLoggerOpen(true)}>
            <FilePlus2 className="h-3.5 w-3.5 mr-1" />
            {isRu ? 'Записать' : 'Log'}
          </Button>
          <Button size="sm" onClick={() => setComposerOpen(true)}>
            <Plus className="h-3.5 w-3.5 mr-1" />
            {isRu ? 'Написать' : 'Compose'}
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </div>
      ) : emails.length === 0 ? (
        <div className="text-center py-12 rounded-none border bg-card">
          <Mail className="h-10 w-10 mx-auto text-muted-foreground/30 mb-2" />
          <p className="text-sm text-muted-foreground">
            {isRu ? 'Нет писем по этому контакту' : 'No emails for this contact'}
          </p>
        </div>
      ) : (
        <div className="space-y-2">{emails.map(renderEmail)}</div>
      )}

      <ContactEmailComposer
        open={composerOpen}
        onOpenChange={setComposerOpen}
        contactId={contactId}
        companyId={companyId}
        defaultTo={contactEmail}
      />
      <ContactEmailLogger
        open={loggerOpen}
        onOpenChange={setLoggerOpen}
        contactId={contactId}
        companyId={companyId}
        defaultEmail={contactEmail}
      />
    </div>
  );
}
