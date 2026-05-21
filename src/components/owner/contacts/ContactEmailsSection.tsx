import { useMemo, useState } from 'react';
import {
  Mail, MailCheck, MailMinus, ArrowDownLeft, ArrowUpRight,
  Plus, FilePlus2, Send, Reply, ChevronDown, ChevronRight, MessageSquare,
} from 'lucide-react';
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
  bounced: 'bg-destructive/10 text-destructive border-destructive/20',
};

function statusLabel(status: string, isRu: boolean): string {
  const map: Record<string, [string, string]> = {
    draft: ['Черновик', 'Draft'],
    sent: ['Отправлено', 'Sent'],
    logged: ['Записано', 'Logged'],
    failed: ['Ошибка', 'Failed'],
    received: ['Получено', 'Received'],
    bounced: ['Возврат', 'Bounced'],
  };
  const pair = map[status];
  if (!pair) return status;
  return isRu ? pair[0] : pair[1];
}

interface ThreadGroup {
  key: string;          // gmail_thread_id or `solo:${email.id}`
  latest: CrmEmail;     // newest message in the group
  earlier: CrmEmail[];  // older messages, newest-first
}

function groupEmails(emails: CrmEmail[]): ThreadGroup[] {
  // Emails arrive sorted by created_at DESC. Bucket by gmail_thread_id;
  // solo emails (no thread id) become their own single-message group.
  const groups = new Map<string, CrmEmail[]>();
  const order: string[] = [];
  for (const e of emails) {
    const key = e.gmail_thread_id ?? `solo:${e.id}`;
    if (!groups.has(key)) {
      groups.set(key, []);
      order.push(key);
    }
    groups.get(key)!.push(e);
  }
  return order.map((key) => {
    const arr = groups.get(key)!;
    return { key, latest: arr[0], earlier: arr.slice(1) };
  });
}

export function ContactEmailsSection({ contactId, companyId, contactEmail }: ContactEmailsSectionProps) {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const locale = isRu ? ru : enUS;
  const { data: emails = [], isLoading } = useCrmEmails(companyId, contactId);
  const sendEmail = useSendCrmEmail();

  const [composerOpen, setComposerOpen] = useState(false);
  const [loggerOpen, setLoggerOpen] = useState(false);
  const [replyTarget, setReplyTarget] = useState<{ id: string; subject: string; to: string } | null>(null);
  const [expandedThreads, setExpandedThreads] = useState<Record<string, boolean>>({});

  const threads = useMemo(() => groupEmails(emails), [emails]);

  const openReply = (email: CrmEmail) => {
    // Replying to inbound goes back to the sender; replying to our outbound
    // continues the chain with the same recipient.
    const inbound = email.direction === 'inbound';
    const target = inbound ? (email.from_email ?? contactEmail ?? '') : email.to_email;
    setReplyTarget({ id: email.id, subject: email.subject ?? '', to: target });
    setComposerOpen(true);
  };

  const openCompose = () => {
    setReplyTarget(null);
    setComposerOpen(true);
  };

  const renderEmail = (email: CrmEmail, isThreadChild = false) => {
    const inbound = email.direction === 'inbound';
    const StatusIcon = email.status === 'sent' || email.status === 'received'
      ? MailCheck
      : email.status === 'failed' || email.status === 'bounced'
      ? MailMinus
      : Mail;
    const displayedAddress = inbound ? (email.from_email ?? email.to_email) : email.to_email;
    return (
      <div
        key={email.id}
        className={cn(
          'flex gap-3 p-3 rounded-none border bg-card',
          isThreadChild && 'ml-6 border-l-2 border-l-muted',
        )}
      >
        <div className="shrink-0 flex flex-col items-center gap-1 pt-0.5">
          <StatusIcon
            className={cn(
              'h-4 w-4',
              email.status === 'sent' || email.status === 'received' ? 'text-success'
                : email.status === 'failed' || email.status === 'bounced' ? 'text-destructive'
                : 'text-muted-foreground',
            )}
          />
          {inbound ? (
            <ArrowDownLeft className="h-3 w-3 text-info" />
          ) : (
            <ArrowUpRight className="h-3 w-3 text-primary" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <p className="text-sm font-medium truncate">{email.subject || (isRu ? '(без темы)' : '(no subject)')}</p>
            <div className="flex items-center gap-1 shrink-0">
              {email.provider === 'gmail' && (
                <Badge variant="outline" className="text-[9px] uppercase tracking-wider">Gmail</Badge>
              )}
              <Badge
                variant="outline"
                className={cn('text-[10px]', STATUS_STYLES[email.status] ?? '')}
              >
                {statusLabel(email.status, isRu)}
              </Badge>
            </div>
          </div>
          <p className="text-xs text-muted-foreground truncate mt-0.5">
            {inbound ? (isRu ? 'От: ' : 'From: ') : (isRu ? 'Кому: ' : 'To: ')}
            {displayedAddress}
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
            {email.has_attachments && (
              <span>· {isRu ? 'вложения' : 'attachments'}</span>
            )}
          </div>
          {email.snippet && !isThreadChild && (
            <p className="text-xs text-muted-foreground/80 mt-1.5 line-clamp-2">{email.snippet}</p>
          )}
          <div className="flex gap-2 mt-2">
            {email.status === 'draft' && (
              <Button
                size="sm"
                variant="outline"
                className="h-7 text-xs"
                onClick={() => sendEmail.mutate(email.id)}
                disabled={sendEmail.isPending}
              >
                <Send className="h-3 w-3 mr-1" />
                {isRu ? 'Отправить' : 'Send'}
              </Button>
            )}
            {(email.status === 'sent' || email.status === 'received') && (
              <Button
                size="sm"
                variant="ghost"
                className="h-7 text-xs"
                onClick={() => openReply(email)}
              >
                <Reply className="h-3 w-3 mr-1" />
                {isRu ? 'Ответить' : 'Reply'}
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderThread = (group: ThreadGroup) => {
    if (group.earlier.length === 0) return renderEmail(group.latest);
    const expanded = expandedThreads[group.key] ?? false;
    return (
      <div key={group.key} className="space-y-1.5">
        {renderEmail(group.latest)}
        <button
          type="button"
          onClick={() => setExpandedThreads((prev) => ({ ...prev, [group.key]: !expanded }))}
          className="ml-6 flex items-center gap-1.5 text-[11px] text-muted-foreground hover:text-foreground transition-colors"
        >
          {expanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
          <MessageSquare className="h-3 w-3" />
          {isRu
            ? `${group.earlier.length} ${group.earlier.length === 1 ? 'предыдущее' : 'предыдущих'}`
            : `${group.earlier.length} earlier ${group.earlier.length === 1 ? 'message' : 'messages'}`}
        </button>
        {expanded && (
          <div className="space-y-1.5">
            {group.earlier.map((e) => renderEmail(e, true))}
          </div>
        )}
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
          <Button size="sm" onClick={openCompose}>
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
        <div className="space-y-2">{threads.map(renderThread)}</div>
      )}

      <ContactEmailComposer
        open={composerOpen}
        onOpenChange={(o) => {
          setComposerOpen(o);
          if (!o) setReplyTarget(null);
        }}
        contactId={contactId}
        companyId={companyId}
        defaultTo={replyTarget?.to ?? contactEmail}
        replyToEmailId={replyTarget?.id ?? null}
        replyToSubject={replyTarget?.subject ?? null}
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
