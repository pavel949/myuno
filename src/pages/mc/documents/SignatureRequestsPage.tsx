/**
 * MC E-Signatures page — create & manage signature requests.
 * Route: /mc/documents/signatures
 */
import React, { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  useCompanySignatureRequests,
  useCreateSignatureRequest,
  useCancelSignatureRequest,
} from '@/hooks/useSignatureRequests';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { LoadingSpinner } from '@/components/uno/LoadingSpinner';
import {
  FileSignature, Plus, Clock, CheckCircle2, XCircle,
  ExternalLink, Send, Ban, User as UserIcon,
} from 'lucide-react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { cn } from '@/lib/utils';

const statusCfg = (isRu: boolean) => ({
  draft: { label: isRu ? 'Черновик' : 'Draft', cls: 'bg-muted text-muted-foreground', Icon: Clock },
  sent: { label: isRu ? 'Отправлено' : 'Sent', cls: 'bg-primary/15 text-primary', Icon: Send },
  partially_signed: { label: isRu ? 'Частично подписано' : 'Partial', cls: 'bg-warning/15 text-warning', Icon: Clock },
  completed: { label: isRu ? 'Подписано' : 'Completed', cls: 'bg-success/15 text-success', Icon: CheckCircle2 },
  declined: { label: isRu ? 'Отклонено' : 'Declined', cls: 'bg-destructive/15 text-destructive', Icon: XCircle },
  expired: { label: isRu ? 'Истёк' : 'Expired', cls: 'bg-muted text-muted-foreground', Icon: Clock },
  cancelled: { label: isRu ? 'Отменено' : 'Cancelled', cls: 'bg-muted text-muted-foreground', Icon: Ban },
});

export default function SignatureRequestsPage() {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const { data: items = [], isLoading } = useCompanySignatureRequests();
  const create = useCreateSignatureRequest();
  const cancel = useCancelSignatureRequest();

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    title: '',
    description: '',
    document_url: '',
    signer_user_id: '',
    signer_name: '',
    signer_email: '',
    signer_role: 'owner',
    expires_in_days: 14,
  });

  const reset = () => setForm({
    title: '', description: '', document_url: '',
    signer_user_id: '', signer_name: '', signer_email: '', signer_role: 'owner',
    expires_in_days: 14,
  });

  const handleCreate = async () => {
    if (!form.title || !form.document_url || !form.signer_name) return;
    await create.mutateAsync({
      title: form.title,
      description: form.description || undefined,
      document_url: form.document_url,
      expires_in_days: form.expires_in_days,
      signers: [{
        signer_user_id: form.signer_user_id || undefined,
        signer_email: form.signer_email || undefined,
        signer_name: form.signer_name,
        signer_role: form.signer_role,
      }],
    });
    reset();
    setOpen(false);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const cfgMap = statusCfg(isRu);

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto space-y-6 pb-24">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <FileSignature className="w-5 h-5 text-primary" />
            <h1 className="text-xl md:text-2xl font-bold">
              {isRu ? 'Электронные подписи' : 'E-Signatures'}
            </h1>
          </div>
          <p className="text-sm text-muted-foreground">
            {isRu
              ? 'Отправляйте договоры собственникам и контрагентам на подпись.'
              : 'Send contracts to owners and counterparties for e-signature.'}
          </p>
        </div>
        <Button onClick={() => setOpen(true)} size="sm">
          <Plus className="w-4 h-4 mr-1.5" />
          {isRu ? 'Отправить' : 'New Request'}
        </Button>
      </div>

      {items.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center text-muted-foreground">
            <FileSignature className="w-10 h-10 opacity-30 mx-auto mb-3" />
            <p className="text-sm">
              {isRu ? 'Нет отправленных запросов на подпись.' : 'No signature requests yet.'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {items.map(item => {
            const cfg = cfgMap[item.status];
            const Icon = cfg.Icon;
            const signers = item.signature_request_signers || [];
            const signedCount = signers.filter(s => s.status === 'signed').length;
            return (
              <Card key={item.id}>
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline" className={cn('text-xs gap-1', cfg.cls)}>
                          <Icon className="w-3 h-3" />
                          {cfg.label}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {signedCount}/{signers.length} {isRu ? 'подписей' : 'signed'}
                        </span>
                      </div>
                      <p className="text-sm font-semibold">{item.title}</p>
                      {item.description && (
                        <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{item.description}</p>
                      )}
                      <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1.5 text-xs text-muted-foreground">
                        <span>
                          {isRu ? 'Создано ' : 'Created '}
                          {format(new Date(item.created_at), 'd MMM HH:mm', { locale: isRu ? ru : undefined })}
                        </span>
                        {item.expires_at && (
                          <span>
                            {isRu ? 'Истекает ' : 'Expires '}
                            {format(new Date(item.expires_at), 'd MMM yyyy', { locale: isRu ? ru : undefined })}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <a href={item.document_url} target="_blank" rel="noopener noreferrer">
                        <Button size="icon" variant="ghost"><ExternalLink className="w-4 h-4" /></Button>
                      </a>
                      {['draft', 'sent', 'partially_signed'].includes(item.status) && (
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => cancel.mutate({ id: item.id })}
                        >
                          <Ban className="w-4 h-4 text-destructive" />
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Signer chips */}
                  {signers.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {signers.map(s => (
                        <div
                          key={s.id}
                          className={cn(
                            'inline-flex items-center gap-1.5 text-xs px-2 py-1 rounded-full border',
                            s.status === 'signed' && 'bg-success/10 text-success border-success/30',
                            s.status === 'declined' && 'bg-destructive/10 text-destructive border-destructive/30',
                            s.status === 'pending' && 'bg-muted/50 text-muted-foreground'
                          )}
                        >
                          <UserIcon className="w-3 h-3" />
                          {s.signer_name}
                          {s.status === 'signed' && <CheckCircle2 className="w-3 h-3" />}
                          {s.status === 'declined' && <XCircle className="w-3 h-3" />}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create sheet */}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
          <SheetHeader>
            <SheetTitle>{isRu ? 'Новый запрос на подпись' : 'New Signature Request'}</SheetTitle>
          </SheetHeader>
          <div className="mt-4 space-y-3">
            <Field label={isRu ? 'Заголовок *' : 'Title *'}>
              <Input
                value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                placeholder={isRu ? 'Договор управления' : 'Management agreement'}
              />
            </Field>
            <Field label={isRu ? 'Описание' : 'Description'}>
              <Textarea
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                rows={2}
              />
            </Field>
            <Field label={isRu ? 'URL документа (PDF) *' : 'Document URL (PDF) *'}>
              <Input
                value={form.document_url}
                onChange={e => setForm(f => ({ ...f, document_url: e.target.value }))}
                placeholder="https://..."
              />
            </Field>
            <div className="border-t pt-3 space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {isRu ? 'Подписант' : 'Signer'}
              </p>
              <Field label={isRu ? 'Имя *' : 'Name *'}>
                <Input
                  value={form.signer_name}
                  onChange={e => setForm(f => ({ ...f, signer_name: e.target.value }))}
                />
              </Field>
              <Field label={isRu ? 'User ID собственника (опционально)' : 'Owner user ID (optional)'}>
                <Input
                  value={form.signer_user_id}
                  onChange={e => setForm(f => ({ ...f, signer_user_id: e.target.value }))}
                  placeholder="uuid"
                />
              </Field>
              <Field label="Email">
                <Input
                  type="email"
                  value={form.signer_email}
                  onChange={e => setForm(f => ({ ...f, signer_email: e.target.value }))}
                />
              </Field>
            </div>
            <Field label={isRu ? 'Срок действия (дней)' : 'Expires in (days)'}>
              <Input
                type="number"
                value={form.expires_in_days}
                onChange={e => setForm(f => ({ ...f, expires_in_days: parseInt(e.target.value) || 14 }))}
              />
            </Field>
            <Button
              className="w-full"
              onClick={handleCreate}
              disabled={!form.title || !form.document_url || !form.signer_name || create.isPending}
            >
              <Send className="w-4 h-4 mr-2" />
              {create.isPending
                ? (isRu ? 'Отправка...' : 'Sending...')
                : (isRu ? 'Отправить на подпись' : 'Send for Signature')}
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <label className="text-xs font-medium text-muted-foreground">{label}</label>
      {children}
    </div>
  );
}
