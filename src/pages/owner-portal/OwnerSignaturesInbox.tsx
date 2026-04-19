/**
 * OwnerSignaturesInbox — owner-portal page listing contracts awaiting e-signature.
 * Mounted at /my-property/signatures
 */
import React, { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  useMySignatureRequests,
  useSignRequest,
  useDeclineSignRequest,
  type SignatureRequest,
  type SignatureSigner,
} from '@/hooks/useSignatureRequests';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Textarea } from '@/components/ui/textarea';
import { SignaturePad } from '@/components/signatures/SignaturePad';
import { LoadingSpinner } from '@/components/uno/LoadingSpinner';
import { PenLine, ExternalLink, CheckCircle2, XCircle, Clock, FileSignature } from 'lucide-react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { cn } from '@/lib/utils';

type Item = SignatureSigner & { signature_requests: SignatureRequest };

export default function OwnerSignaturesInbox() {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const { data: items = [], isLoading } = useMySignatureRequests();
  const sign = useSignRequest();
  const decline = useDeclineSignRequest();

  const [active, setActive] = useState<Item | null>(null);
  const [mode, setMode] = useState<'sign' | 'decline' | null>(null);
  const [signatureUrl, setSignatureUrl] = useState<string | null>(null);
  const [reason, setReason] = useState('');

  const close = () => {
    setActive(null);
    setMode(null);
    setSignatureUrl(null);
    setReason('');
  };

  const handleSign = async () => {
    if (!active || !signatureUrl) return;
    await sign.mutateAsync({ signerId: active.id, signatureDataUrl: signatureUrl });
    close();
  };

  const handleDecline = async () => {
    if (!active || !reason.trim()) return;
    await decline.mutateAsync({ signerId: active.id, reason: reason.trim() });
    close();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const pending = items.filter(i => i.status === 'pending');
  const past = items.filter(i => i.status !== 'pending');

  return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto space-y-6 pb-24">
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <FileSignature className="w-5 h-5 text-primary" />
          <h1 className="text-xl font-bold">
            {isRu ? 'Документы на подпись' : 'Documents to Sign'}
          </h1>
        </div>
        <p className="text-sm text-muted-foreground">
          {isRu ? 'Договоры и соглашения от управляющей компании.' : 'Contracts and agreements from your management company.'}
        </p>
      </div>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          {isRu ? 'Ожидают подписи' : 'Pending'} ({pending.length})
        </h2>
        {pending.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="py-8 text-center text-sm text-muted-foreground">
              {isRu ? 'Нет документов на подпись' : 'No documents awaiting signature'}
            </CardContent>
          </Card>
        ) : (
          pending.map(item => (
            <SigCard
              key={item.id}
              item={item}
              isRu={isRu}
              onSign={() => { setActive(item); setMode('sign'); }}
              onDecline={() => { setActive(item); setMode('decline'); }}
            />
          ))
        )}
      </section>

      {past.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            {isRu ? 'История' : 'History'}
          </h2>
          {past.map(item => <SigCard key={item.id} item={item} isRu={isRu} readOnly />)}
        </section>
      )}

      <Sheet open={!!active} onOpenChange={open => !open && close()}>
        <SheetContent side="bottom" className="rounded-t-2xl max-h-[90vh] overflow-y-auto">
          <SheetHeader>
            <SheetTitle>
              {mode === 'sign'
                ? (isRu ? 'Подписать документ' : 'Sign Document')
                : (isRu ? 'Отказаться от подписи' : 'Decline Document')}
            </SheetTitle>
          </SheetHeader>

          {active && (
            <div className="mt-4 space-y-4">
              <div className="bg-muted/30 rounded-xl p-3 space-y-1">
                <p className="font-semibold text-sm">{active.signature_requests.title}</p>
                {active.signature_requests.description && (
                  <p className="text-xs text-muted-foreground">{active.signature_requests.description}</p>
                )}
              </div>

              <Button variant="outline" className="w-full" asChild>
                <a href={active.signature_requests.document_url} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="w-4 h-4 mr-2" />
                  {isRu ? 'Открыть документ' : 'Open Document'}
                </a>
              </Button>

              {mode === 'sign' && (
                <>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      {isRu ? 'Подпись' : 'Signature'}
                    </label>
                    <SignaturePad onChange={setSignatureUrl} />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {isRu
                      ? 'Подписывая документ, вы соглашаетесь с его содержанием. Подпись сохраняется с меткой времени и IP.'
                      : 'By signing, you agree to the document terms. Signature is stored with timestamp and IP.'}
                  </p>
                  <Button className="w-full" disabled={!signatureUrl || sign.isPending} onClick={handleSign}>
                    <PenLine className="w-4 h-4 mr-2" />
                    {sign.isPending
                      ? (isRu ? 'Сохранение...' : 'Saving...')
                      : (isRu ? 'Подписать документ' : 'Sign Document')}
                  </Button>
                </>
              )}

              {mode === 'decline' && (
                <>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      {isRu ? 'Причина отказа' : 'Reason'}
                    </label>
                    <Textarea
                      value={reason}
                      onChange={e => setReason(e.target.value)}
                      placeholder={isRu ? 'Объясните причину' : 'Explain'}
                      rows={3}
                    />
                  </div>
                  <Button
                    variant="destructive"
                    className="w-full"
                    disabled={!reason.trim() || decline.isPending}
                    onClick={handleDecline}
                  >
                    <XCircle className="w-4 h-4 mr-2" />
                    {isRu ? 'Отказаться' : 'Decline'}
                  </Button>
                </>
              )}
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}

function SigCard({ item, isRu, onSign, onDecline, readOnly }: {
  item: Item;
  isRu: boolean;
  onSign?: () => void;
  onDecline?: () => void;
  readOnly?: boolean;
}) {
  const cfg: Record<string, { label: string; cls: string; Icon: typeof Clock }> = {
    pending: { label: isRu ? 'Ожидает' : 'Pending', cls: 'bg-warning/15 text-warning', Icon: Clock },
    signed: { label: isRu ? 'Подписано' : 'Signed', cls: 'bg-success/15 text-success', Icon: CheckCircle2 },
    declined: { label: isRu ? 'Отклонено' : 'Declined', cls: 'bg-destructive/15 text-destructive', Icon: XCircle },
  };
  const c = cfg[item.status];
  const Icon = c.Icon;
  return (
    <Card>
      <CardContent className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <Badge variant="outline" className={cn('text-xs gap-1 mb-1.5', c.cls)}>
              <Icon className="w-3 h-3" />
              {c.label}
            </Badge>
            <p className="text-sm font-semibold">{item.signature_requests.title}</p>
            {item.signature_requests.description && (
              <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                {item.signature_requests.description}
              </p>
            )}
            {item.signed_at && (
              <p className="text-xs text-muted-foreground mt-1">
                {isRu ? 'Подписано ' : 'Signed '}
                {format(new Date(item.signed_at), 'd MMM HH:mm', { locale: isRu ? ru : undefined })}
              </p>
            )}
            {item.decline_reason && (
              <p className="text-xs text-destructive mt-1">{item.decline_reason}</p>
            )}
          </div>
        </div>
        {!readOnly && (
          <div className="flex gap-2">
            <Button size="sm" className="flex-1" onClick={onSign}>
              <PenLine className="w-3.5 h-3.5 mr-1.5" />
              {isRu ? 'Подписать' : 'Sign'}
            </Button>
            <Button size="sm" variant="outline" onClick={onDecline}>
              {isRu ? 'Отказаться' : 'Decline'}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
