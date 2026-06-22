/**
 * OwnerStatementsInbox — owner-portal page listing pending/past statements requiring approval.
 * Mounted at /my-property/statements
 */
import React, { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import type { Language } from '@/i18n';
import {
  useMyStatementApprovals,
  useSignStatement,
  useRejectStatement,
  type StatementApproval,
} from '@/hooks/useStatementApprovals';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Textarea } from '@/components/ui/textarea';
import { SignaturePad } from '@/components/signatures/SignaturePad';
import { LoadingSpinner } from '@/components/uno/LoadingSpinner';
import { FileText, ExternalLink, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { cn } from '@/lib/utils';

export default function OwnerStatementsInbox() {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const isTh = language === 'th';
  const { data: items = [], isLoading } = useMyStatementApprovals();
  const sign = useSignStatement();
  const reject = useRejectStatement();
  const [active, setActive] = useState<StatementApproval | null>(null);
  const [mode, setMode] = useState<'sign' | 'reject' | null>(null);
  const [signatureUrl, setSignatureUrl] = useState<string | null>(null);
  const [comment, setComment] = useState('');
  const [reason, setReason] = useState('');

  const closeSheet = () => {
    setActive(null);
    setMode(null);
    setSignatureUrl(null);
    setComment('');
    setReason('');
  };

  const handleSign = async () => {
    if (!active || !signatureUrl) return;
    await sign.mutateAsync({ id: active.id, signatureDataUrl: signatureUrl, comment });
    closeSheet();
  };

  const handleReject = async () => {
    if (!active || !reason.trim()) return;
    await reject.mutateAsync({ id: active.id, reason: reason.trim() });
    closeSheet();
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
          <FileText className="w-5 h-5 text-primary" />
          <h1 className="text-xl font-bold">
            {isRu ? 'Отчёты на одобрение' : isTh ? 'รายงานที่รออนุมัติ' : 'Statements for Approval'}
          </h1>
        </div>
        <p className="text-sm text-muted-foreground">
          {isRu
            ? 'Просмотрите ежемесячные отчёты от управляющей компании и подпишите их.'
            : isTh
            ? 'ตรวจสอบรายงานประจำเดือนจากบริษัทบริหารจัดการของคุณและลงนาม'
            : 'Review monthly statements from your management company and sign them.'}
        </p>
      </div>

      {/* Pending */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          {isRu ? 'Ожидают подписи' : isTh ? 'รอการลงนาม' : 'Pending'} ({pending.length})
        </h2>
        {pending.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="py-8 text-center text-sm text-muted-foreground">
              {isRu ? 'Нет отчётов на одобрение' : isTh ? 'ไม่มีรายงานที่รออนุมัติ' : 'No statements awaiting approval'}
            </CardContent>
          </Card>
        ) : (
          pending.map(item => (
            <StatementCard
              key={item.id}
              item={item}
              language={language}
              onSign={() => { setActive(item); setMode('sign'); }}
              onReject={() => { setActive(item); setMode('reject'); }}
            />
          ))
        )}
      </section>

      {/* Past */}
      {past.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            {isRu ? 'История' : isTh ? 'ประวัติ' : 'History'}
          </h2>
          {past.map(item => (
            <StatementCard key={item.id} item={item} language={language} readOnly />
          ))}
        </section>
      )}

      {/* Sign / Reject sheet */}
      <Sheet open={!!active} onOpenChange={open => !open && closeSheet()}>
        <SheetContent side="bottom" className="rounded-none max-h-[90vh] overflow-y-auto">
          <SheetHeader>
            <SheetTitle>
              {mode === 'sign'
                ? (isRu ? 'Подписать отчёт' : isTh ? 'ลงนามรายงาน' : 'Sign Statement')
                : (isRu ? 'Отклонить отчёт' : isTh ? 'ปฏิเสธรายงาน' : 'Reject Statement')}
            </SheetTitle>
          </SheetHeader>

          {active && (
            <div className="mt-4 space-y-4">
              {/* Period & amount */}
              <div className="bg-muted/30 rounded-none p-3 space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{isRu ? 'Период' : isTh ? 'รอบระยะเวลา' : 'Period'}</span>
                  <span className="font-medium">
                    {format(new Date(active.period_start), 'd MMM', { locale: isRu ? ru : undefined })} – {format(new Date(active.period_end), 'd MMM yyyy', { locale: isRu ? ru : undefined })}
                  </span>
                </div>
                {active.net_amount != null && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{isRu ? 'К выплате' : isTh ? 'ยอดสุทธิที่จ่าย' : 'Net payout'}</span>
                    <span className="font-bold text-success">
                      {active.net_amount.toLocaleString()} {active.currency || 'THB'}
                    </span>
                  </div>
                )}
              </div>

              {active.statement_url && (
                <Button variant="outline" className="w-full" asChild>
                  <a href={active.statement_url} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="w-4 h-4 mr-2" />
                    {isRu ? 'Открыть PDF отчёта' : isTh ? 'เปิดไฟล์ PDF รายงาน' : 'Open Statement PDF'}
                  </a>
                </Button>
              )}

              {mode === 'sign' && (
                <>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      {isRu ? 'Ваша подпись' : isTh ? 'ลายเซ็นของคุณ' : 'Your signature'}
                    </label>
                    <SignaturePad onChange={setSignatureUrl} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      {isRu ? 'Комментарий (опционально)' : isTh ? 'ความคิดเห็น (ไม่บังคับ)' : 'Comment (optional)'}
                    </label>
                    <Textarea
                      value={comment}
                      onChange={e => setComment(e.target.value)}
                      placeholder={isRu ? 'Например: всё проверил, согласен' : isTh ? 'เช่น ตรวจสอบเรียบร้อยแล้ว เห็นชอบ' : 'E.g. all good, agreed'}
                      rows={2}
                    />
                  </div>
                  <Button
                    className="w-full"
                    disabled={!signatureUrl || sign.isPending}
                    onClick={handleSign}
                  >
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    {sign.isPending
                      ? (isRu ? 'Сохранение...' : isTh ? 'กำลังบันทึก...' : 'Saving...')
                      : (isRu ? 'Подписать и одобрить' : isTh ? 'ลงนามและอนุมัติ' : 'Sign & Approve')}
                  </Button>
                </>
              )}

              {mode === 'reject' && (
                <>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      {isRu ? 'Причина отклонения' : isTh ? 'เหตุผลในการปฏิเสธ' : 'Reason for rejection'}
                    </label>
                    <Textarea
                      value={reason}
                      onChange={e => setReason(e.target.value)}
                      placeholder={isRu ? 'Опишите, что нужно исправить' : isTh ? 'อธิบายสิ่งที่ต้องแก้ไข' : 'Describe what needs to be corrected'}
                      rows={3}
                      required
                    />
                  </div>
                  <Button
                    variant="destructive"
                    className="w-full"
                    disabled={!reason.trim() || reject.isPending}
                    onClick={handleReject}
                  >
                    <XCircle className="w-4 h-4 mr-2" />
                    {isRu ? 'Отклонить отчёт' : isTh ? 'ปฏิเสธรายงาน' : 'Reject Statement'}
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

function StatementCard({
  item,
  language,
  onSign,
  onReject,
  readOnly,
}: {
  item: StatementApproval;
  language: Language;
  onSign?: () => void;
  onReject?: () => void;
  readOnly?: boolean;
}) {
  const isRu = language === 'ru';
  const isTh = language === 'th';
  const statusConfig: Record<string, { label: string; cls: string; Icon: typeof Clock }> = {
    pending: { label: isRu ? 'Ожидает' : isTh ? 'รอดำเนินการ' : 'Pending', cls: 'bg-warning/15 text-warning', Icon: Clock },
    approved: { label: isRu ? 'Одобрено' : isTh ? 'อนุมัติแล้ว' : 'Approved', cls: 'bg-success/15 text-success', Icon: CheckCircle2 },
    rejected: { label: isRu ? 'Отклонено' : isTh ? 'ปฏิเสธแล้ว' : 'Rejected', cls: 'bg-destructive/15 text-destructive', Icon: XCircle },
    expired: { label: isRu ? 'Истёк' : isTh ? 'หมดอายุ' : 'Expired', cls: 'bg-muted text-muted-foreground', Icon: Clock },
  };
  const cfg = statusConfig[item.status];
  const Icon = cfg.Icon;
  return (
    <Card>
      <CardContent className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="outline" className={cn('text-xs gap-1', cfg.cls)}>
                <Icon className="w-3 h-3" />
                {cfg.label}
              </Badge>
            </div>
            <p className="text-sm font-semibold">
              {format(new Date(item.period_start), 'd MMM', { locale: isRu ? ru : undefined })} –{' '}
              {format(new Date(item.period_end), 'd MMM yyyy', { locale: isRu ? ru : undefined })}
            </p>
            {item.net_amount != null && (
              <p className="text-xs text-muted-foreground mt-0.5">
                {isRu ? 'К выплате: ' : isTh ? 'ยอดสุทธิ: ' : 'Net: '}
                <span className="font-semibold text-foreground">
                  {item.net_amount.toLocaleString()} {item.currency || 'THB'}
                </span>
              </p>
            )}
            {item.signed_at && (
              <p className="text-xs text-muted-foreground mt-0.5">
                {isRu ? 'Подписано: ' : isTh ? 'ลงนามเมื่อ: ' : 'Signed: '}
                {format(new Date(item.signed_at), 'd MMM HH:mm', { locale: isRu ? ru : undefined })}
              </p>
            )}
            {item.rejection_reason && (
              <p className="text-xs text-destructive mt-1">{item.rejection_reason}</p>
            )}
          </div>
        </div>

        {!readOnly && (
          <div className="flex gap-2">
            <Button size="sm" className="flex-1" onClick={onSign}>
              <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />
              {isRu ? 'Подписать' : isTh ? 'ลงนาม' : 'Sign'}
            </Button>
            <Button size="sm" variant="outline" onClick={onReject}>
              <XCircle className="w-3.5 h-3.5 mr-1.5" />
              {isRu ? 'Отклонить' : isTh ? 'ปฏิเสธ' : 'Reject'}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
