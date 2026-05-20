import { useState } from 'react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useCreateCrmEmail } from '@/hooks/useCrmEmails';
import { toast } from 'sonner';

interface ContactEmailLoggerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contactId: string;
  companyId: string;
  defaultEmail?: string | null;
}

export function ContactEmailLogger({
  open,
  onOpenChange,
  contactId,
  companyId,
  defaultEmail,
}: ContactEmailLoggerProps) {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const { user } = useAuth();
  const createEmail = useCreateCrmEmail();

  const [direction, setDirection] = useState<'outbound' | 'inbound'>('outbound');
  const [otherEmail, setOtherEmail] = useState(defaultEmail ?? '');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [occurredAt, setOccurredAt] = useState(() => new Date().toISOString().slice(0, 16));

  const reset = () => {
    setDirection('outbound');
    setOtherEmail(defaultEmail ?? '');
    setSubject('');
    setBody('');
    setOccurredAt(new Date().toISOString().slice(0, 16));
  };

  const handleLog = async () => {
    if (!user) return;
    if (!otherEmail.trim() || !subject.trim()) {
      toast.error(isRu ? 'Укажите адрес и тему' : 'Enter address and subject');
      return;
    }
    const bodyHtml = body.trim()
      ? body.split('\n').map((line) => `<p>${line || '&nbsp;'}</p>`).join('')
      : '';
    await createEmail.mutateAsync({
      company_id: companyId,
      contact_id: contactId,
      deal_id: null,
      direction,
      to_email: otherEmail.trim(),
      subject: subject.trim(),
      body_html: bodyHtml,
      status: 'logged',
      sent_at: new Date(occurredAt).toISOString(),
      opened_at: null,
      sent_by: user.id,
    });
    toast.success(isRu ? 'Письмо записано' : 'Email logged');
    reset();
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md flex flex-col">
        <SheetHeader>
          <SheetTitle>{isRu ? 'Записать письмо' : 'Log email'}</SheetTitle>
          <SheetDescription>
            {isRu
              ? 'Зафиксировать письмо без отправки через Resend.'
              : 'Record an email without sending through Resend.'}
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto space-y-3 py-4">
          <div className="space-y-1">
            <Label htmlFor="log-direction">{isRu ? 'Направление' : 'Direction'}</Label>
            <Select value={direction} onValueChange={(v) => setDirection(v as 'outbound' | 'inbound')}>
              <SelectTrigger id="log-direction">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="outbound">{isRu ? 'Исходящее' : 'Outbound'}</SelectItem>
                <SelectItem value="inbound">{isRu ? 'Входящее' : 'Inbound'}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label htmlFor="log-other-email">
              {direction === 'outbound'
                ? (isRu ? 'Кому' : 'To')
                : (isRu ? 'От кого' : 'From')}
            </Label>
            <Input
              id="log-other-email"
              type="email"
              value={otherEmail}
              onChange={(e) => setOtherEmail(e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="log-subject">{isRu ? 'Тема' : 'Subject'}</Label>
            <Input
              id="log-subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="log-when">{isRu ? 'Когда' : 'When'}</Label>
            <Input
              id="log-when"
              type="datetime-local"
              value={occurredAt}
              onChange={(e) => setOccurredAt(e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="log-body">{isRu ? 'Заметка / содержание' : 'Note / body'}</Label>
            <Textarea
              id="log-body"
              className="min-h-[120px]"
              value={body}
              onChange={(e) => setBody(e.target.value)}
            />
          </div>
        </div>

        <SheetFooter>
          <Button
            onClick={handleLog}
            disabled={createEmail.isPending || !otherEmail.trim() || !subject.trim()}
          >
            {isRu ? 'Записать' : 'Log'}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
