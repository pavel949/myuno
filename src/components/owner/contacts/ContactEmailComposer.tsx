import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Send, Save, Mail, AlertCircle } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useCreateCrmEmail, useSendCrmEmail } from '@/hooks/useCrmEmails';
import { useCrmEmailAccount } from '@/hooks/useCrmEmailAccount';
import { toast } from 'sonner';

interface ContactEmailComposerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contactId: string;
  companyId: string;
  defaultTo?: string | null;
  /** When set, sends as a threaded reply to the given crm_emails row. */
  replyToEmailId?: string | null;
  /** Subject of the email being replied to (used to prefill "Re: …"). */
  replyToSubject?: string | null;
}

export function ContactEmailComposer({
  open,
  onOpenChange,
  contactId,
  companyId,
  defaultTo,
  replyToEmailId = null,
  replyToSubject = null,
}: ContactEmailComposerProps) {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const { user } = useAuth();
  const createEmail = useCreateCrmEmail();
  const sendEmail = useSendCrmEmail();
  const { data: account } = useCrmEmailAccount();
  const accountUnhealthy = account?.last_sync_status === 'reauth_required';

  const buildInitialSubject = () => {
    if (!replyToSubject) return '';
    return /^re:\s/i.test(replyToSubject) ? replyToSubject : `Re: ${replyToSubject}`;
  };

  const [to, setTo] = useState(defaultTo ?? '');
  const [subject, setSubject] = useState(buildInitialSubject());
  const [body, setBody] = useState('');

  // Re-sync prefills when the sheet reopens for a different reply target.
  useEffect(() => {
    if (open) {
      setTo(defaultTo ?? '');
      setSubject(buildInitialSubject());
      setBody('');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, defaultTo, replyToSubject, replyToEmailId]);

  const reset = () => {
    setTo(defaultTo ?? '');
    setSubject(buildInitialSubject());
    setBody('');
  };

  const createDraft = async (): Promise<string | null> => {
    if (!user) return null;
    if (!to.trim() || !subject.trim()) {
      toast.error(isRu ? 'Укажите получателя и тему' : 'Enter recipient and subject');
      return null;
    }
    const bodyHtml = body.trim()
      ? body.split('\n').map((line) => `<p>${line || '&nbsp;'}</p>`).join('')
      : '';
    const draft = await createEmail.mutateAsync({
      company_id: companyId,
      contact_id: contactId,
      deal_id: null,
      direction: 'outbound',
      to_email: to.trim(),
      subject: subject.trim(),
      body_html: bodyHtml,
      body_text: body.trim() || null,
      status: 'draft',
      sent_at: null,
      opened_at: null,
      sent_by: user.id,
      provider: account ? 'gmail' : 'resend',
      from_email: null,
      gmail_message_id: null,
      gmail_thread_id: null,
      in_reply_to: null,
      references_ids: null,
      snippet: null,
      has_attachments: false,
      cc: null,
      bcc: null,
      email_account_id: account?.id ?? null,
    });
    return draft.id;
  };

  const handleSaveDraft = async () => {
    const id = await createDraft();
    if (id) {
      toast.success(isRu ? 'Черновик сохранён' : 'Draft saved');
      reset();
      onOpenChange(false);
    }
  };

  const handleSend = async () => {
    const id = await createDraft();
    if (!id) return;
    try {
      await sendEmail.mutateAsync({ emailId: id, replyToEmailId });
      reset();
      onOpenChange(false);
    } catch {
      // toast handled in hook
    }
  };

  const description = account
    ? (isRu
        ? 'Отправка через ваш Gmail, копия в Sent, запись в CRM.'
        : 'Sent via your Gmail (lands in Sent), logged in CRM.')
    : (isRu
        ? 'Отправка через Resend (crm@updates.myuno.ai). Подключите Gmail, чтобы письма уходили с вашего адреса.'
        : 'Sent via Resend (crm@updates.myuno.ai). Connect Gmail to send from your own address.');

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-xl flex flex-col">
        <SheetHeader>
          <SheetTitle>
            {replyToEmailId
              ? (isRu ? 'Ответ' : 'Reply')
              : (isRu ? 'Новое письмо' : 'New email')}
          </SheetTitle>
          <SheetDescription>{description}</SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto space-y-3 py-4">
          {/* FROM indicator */}
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">{isRu ? 'Отправитель' : 'From'}</Label>
            {account ? (
              <div className="flex items-center gap-2 text-sm px-3 py-2 border border-border bg-muted/30">
                <Mail className="w-4 h-4 text-primary shrink-0" strokeWidth={1.75} />
                <span className="font-mono text-[13px]">{account.email_address}</span>
                {accountUnhealthy && (
                  <span className="ml-auto inline-flex items-center gap-1 text-destructive text-xs">
                    <AlertCircle className="w-3.5 h-3.5" />
                    {isRu ? 'Переподключите Gmail' : 'Reconnect Gmail'}
                  </span>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2 text-sm px-3 py-2 border border-dashed border-border">
                <Mail className="w-4 h-4 text-muted-foreground shrink-0" strokeWidth={1.75} />
                <span className="font-mono text-[13px] text-muted-foreground">crm@updates.myuno.ai</span>
                <Link
                  to="/mc/crm-emails/settings"
                  className="ml-auto text-xs text-primary hover:underline"
                  onClick={() => onOpenChange(false)}
                >
                  {isRu ? 'Подключить Gmail →' : 'Connect Gmail →'}
                </Link>
              </div>
            )}
          </div>

          <div className="space-y-1">
            <Label htmlFor="email-to">{isRu ? 'Кому' : 'To'}</Label>
            <Input
              id="email-to"
              type="email"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              placeholder="recipient@example.com"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="email-subject">{isRu ? 'Тема' : 'Subject'}</Label>
            <Input
              id="email-subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="email-body">{isRu ? 'Сообщение' : 'Message'}</Label>
            <Textarea
              id="email-body"
              className="min-h-[240px]"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder={isRu ? 'Текст письма…' : 'Email body…'}
            />
          </div>
        </div>

        <SheetFooter className="flex-row gap-2 sm:justify-end">
          <Button
            variant="outline"
            onClick={handleSaveDraft}
            disabled={createEmail.isPending || sendEmail.isPending}
          >
            <Save className="h-4 w-4 mr-1.5" />
            {isRu ? 'Сохранить черновик' : 'Save draft'}
          </Button>
          <Button
            onClick={handleSend}
            disabled={createEmail.isPending || sendEmail.isPending || !to.trim() || !subject.trim() || accountUnhealthy}
          >
            <Send className="h-4 w-4 mr-1.5" />
            {sendEmail.isPending
              ? (isRu ? 'Отправка…' : 'Sending…')
              : (isRu ? 'Отправить' : 'Send')}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
