/**
 * AuditMarker — money-screen audit trail (rule ARCHITECTURE_V2 §13.6).
 *
 * Every money-moving screen must show: tx id + ledger entry id + timestamp.
 * Optional: revenue stream label.
 */
import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { MONETIZATION_LABELS } from '@/lib/copy/govStyle';
import { REVENUE_STREAMS } from '@/lib/monetization/revenueStreams';
import type { RevenueStream } from '@/lib/monetization/realEstateEngine';
import { Receipt } from 'lucide-react';

interface Props {
  txId: string;
  ledgerEntryId?: string | null;
  timestamp: string | Date;
  stream?: RevenueStream;
  className?: string;
}

function formatTs(ts: string | Date, isRu: boolean): string {
  const d = typeof ts === 'string' ? new Date(ts) : ts;
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleString(isRu ? 'ru-RU' : 'en-GB', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function AuditMarker({ txId, ledgerEntryId, timestamp, stream, className }: Props) {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const ts = formatTs(timestamp, isRu);
  const streamMeta = stream ? REVENUE_STREAMS[stream] : null;

  return (
    <div
      className={`rounded-none border border-border bg-card/60 px-3 py-2.5 text-[11.5px] leading-snug font-mono ${className ?? ''}`}
      role="status"
      aria-label={isRu ? MONETIZATION_LABELS.auditMarker.ru : MONETIZATION_LABELS.auditMarker.en}
    >
      <div className="flex items-center gap-1.5 text-muted-foreground mb-1.5 font-sans text-[11px] uppercase tracking-wide">
        <Receipt className="w-3 h-3" />
        {isRu ? MONETIZATION_LABELS.auditMarker.ru : MONETIZATION_LABELS.auditMarker.en}
      </div>
      <dl className="space-y-0.5 text-foreground/90">
        <div className="flex gap-2">
          <dt className="text-muted-foreground shrink-0 w-[88px]">
            {isRu ? MONETIZATION_LABELS.txId.ru : MONETIZATION_LABELS.txId.en}
          </dt>
          <dd className="break-all">{txId}</dd>
        </div>
        {ledgerEntryId && (
          <div className="flex gap-2">
            <dt className="text-muted-foreground shrink-0 w-[88px]">
              {isRu ? MONETIZATION_LABELS.ledgerId.ru : MONETIZATION_LABELS.ledgerId.en}
            </dt>
            <dd className="break-all">{ledgerEntryId}</dd>
          </div>
        )}
        <div className="flex gap-2">
          <dt className="text-muted-foreground shrink-0 w-[88px]">
            {isRu ? 'Время' : 'Timestamp'}
          </dt>
          <dd>{ts}</dd>
        </div>
        {streamMeta && (
          <div className="flex gap-2">
            <dt className="text-muted-foreground shrink-0 w-[88px]">
              {isRu ? 'Поток' : 'Stream'}
            </dt>
            <dd>{isRu ? streamMeta.label.ru : streamMeta.label.en}</dd>
          </div>
        )}
      </dl>
    </div>
  );
}
