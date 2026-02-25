import { useState } from 'react';
import { MessageCircle, Mail, Copy, Loader2, Check, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useLeadsFactory } from '@/hooks/useLeadsFactory';
import { toast } from 'sonner';

interface FollowUpGeneratorProps {
  leadId: string;
  leadName: string;
  leadPhone: string;
  leadEmail?: string | null;
  trigger?: React.ReactNode;
}

export function FollowUpGenerator({
  leadId,
  leadName,
  leadPhone,
  leadEmail,
  trigger,
}: FollowUpGeneratorProps) {
  const { generateFollowUp } = useLeadsFactory();
  const [open, setOpen] = useState(false);
  const [whatsappMessage, setWhatsappMessage] = useState('');
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');
  const [copied, setCopied] = useState<'whatsapp' | 'email' | null>(null);

  const handleGenerateWhatsApp = async () => {
    const result = await generateFollowUp.mutateAsync({ leadId, channel: 'whatsapp' });
    setWhatsappMessage(result.message);
  };

  const handleGenerateEmail = async () => {
    const result = await generateFollowUp.mutateAsync({ leadId, channel: 'email' });
    setEmailBody(result.message);
    if (result.subject) setEmailSubject(result.subject);
  };

  const handleCopy = (type: 'whatsapp' | 'email') => {
    const text = type === 'whatsapp' ? whatsappMessage : `Subject: ${emailSubject}\n\n${emailBody}`;
    navigator.clipboard.writeText(text);
    setCopied(type);
    toast.success('Скопировано');
    setTimeout(() => setCopied(null), 2000);
  };

  const handleOpenWhatsApp = () => {
    const cleanPhone = leadPhone.replace(/\D/g, '');
    const encodedMessage = encodeURIComponent(whatsappMessage);
    window.open(`https://wa.me/${cleanPhone}?text=${encodedMessage}`, '_blank');
  };

  const handleOpenEmail = () => {
    const encodedSubject = encodeURIComponent(emailSubject);
    const encodedBody = encodeURIComponent(emailBody);
    window.open(`mailto:${leadEmail}?subject=${encodedSubject}&body=${encodedBody}`, '_blank');
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            <MessageCircle className="h-4 w-4 mr-2" />
            Написать
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Follow-up для {leadName}</DialogTitle>
          <DialogDescription>
            Сгенерируйте персонализированное сообщение с помощью AI
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="whatsapp" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="whatsapp">
              <MessageCircle className="h-4 w-4 mr-2" />
              WhatsApp
            </TabsTrigger>
            <TabsTrigger value="email">
              <Mail className="h-4 w-4 mr-2" />
              Email
            </TabsTrigger>
          </TabsList>

          <TabsContent value="whatsapp" className="space-y-4 mt-4">
            <div className="flex gap-2">
              <Button
                onClick={handleGenerateWhatsApp}
                disabled={generateFollowUp.isPending}
                className="flex-1"
              >
                {generateFollowUp.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : null}
                Сгенерировать сообщение
              </Button>
            </div>

            <Textarea
              value={whatsappMessage}
              onChange={(e) => setWhatsappMessage(e.target.value)}
              placeholder="Сообщение появится здесь..."
              className="min-h-[150px]"
            />

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => handleCopy('whatsapp')}
                disabled={!whatsappMessage}
              >
                {copied === 'whatsapp' ? (
                  <Check className="h-4 w-4 mr-2" />
                ) : (
                  <Copy className="h-4 w-4 mr-2" />
                )}
                Копировать
              </Button>
              <Button
                onClick={handleOpenWhatsApp}
                disabled={!whatsappMessage}
                className="bg-success hover:bg-success/90"
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Открыть в WhatsApp
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="email" className="space-y-4 mt-4">
            <div className="flex gap-2">
              <Button
                onClick={handleGenerateEmail}
                disabled={generateFollowUp.isPending}
                className="flex-1"
              >
                {generateFollowUp.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : null}
                Сгенерировать письмо
              </Button>
            </div>

            <div className="space-y-2">
              <Label htmlFor="subject">Тема</Label>
              <Input
                id="subject"
                value={emailSubject}
                onChange={(e) => setEmailSubject(e.target.value)}
                placeholder="Тема письма..."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="body">Текст письма</Label>
              <Textarea
                id="body"
                value={emailBody}
                onChange={(e) => setEmailBody(e.target.value)}
                placeholder="Текст письма появится здесь..."
                className="min-h-[200px]"
              />
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => handleCopy('email')}
                disabled={!emailBody}
              >
                {copied === 'email' ? (
                  <Check className="h-4 w-4 mr-2" />
                ) : (
                  <Copy className="h-4 w-4 mr-2" />
                )}
                Копировать
              </Button>
              {leadEmail && (
                <Button onClick={handleOpenEmail} disabled={!emailBody}>
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Открыть почтовый клиент
                </Button>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
