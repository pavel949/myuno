import { useState } from 'react';
import { Send, Save } from 'lucide-react';
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
import { toast } from 'sonner';

interface ContactEmailComposerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contactId: string;
  companyId: string;
  defaultTo?: string | null;
}

export function ContactEmailComposer({
  open,
  onOpenChange,
  contactId,
  companyId,
  defaultTo,
}: ContactEmailComposerProps) {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const { user } = useAuth();
  const createEmail = useCreateCrmEmail();
  const sendEmail = useSendCrmEmail();

  const [to, setTo] = useState(defaultTo ?? '');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');

  const reset = () => {
    setTo(defaultTo ?? '');
    setSubject('');
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
      status: 'draft',
      sent_at: null,
      opened_at: null,
      sent_by: user.id,
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
      await sendEmail.mutateAsync(id);
      reset();
      onOpenChange(false);
    } catch {
      // toast handled in hook
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-xl flex flex-col">
        <SheetHeader>
          <SheetTitle>{isRu ? 'Новое письмо' : 'New email'}</SheetTitle>
          <SheetDescription>
            {isRu ? 'Отправка через Resend, запись в CRM.' : 'Sent via Resend, logged in CRM.'}
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto space-y-3 py-4">
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
            disabled={createEmail.isPending || sendEmail.isPending || !to.trim() || !subject.trim()}
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
