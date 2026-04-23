/**
 * AdminAddHub — single entry point for adding services & products to the platform.
 *
 * Four large cards routed to existing intake / vendor flows:
 *   1. Single object        → /admin/intake?mode=single
 *   2. Bulk text/URL        → /admin/intake?mode=bulk_text
 *   3. CSV / Excel          → /admin/intake?mode=csv
 *   4. Vendor applications  → /admin/vendor-prospects
 */
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { PageContainer } from '@/components/uno/PageContainer';
import { PageHeader } from '@/components/uno/PageHeader';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';
import {
  FilePlus2,
  Files,
  FileSpreadsheet,
  Inbox,
  ArrowRight,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface HubCard {
  to: string;
  icon: LucideIcon;
  titleEn: string;
  titleRu: string;
  descEn: string;
  descRu: string;
  whenEn: string;
  whenRu: string;
  tone: string;
  badgeCount?: number;
}

export default function AdminAddHub() {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const [pendingProspects, setPendingProspects] = useState<number | null>(null);

  // Lightweight count of partner applications awaiting review. Failure is silent —
  // the badge just hides — so the hub is never blocked by the count query.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { count, error } = await supabase
          .from('vendor_prospects' as any)
          .select('id', { count: 'exact', head: true })
          .eq('status', 'pending');
        if (cancelled) return;
        if (error) {
          logger.log('[AdminAddHub] prospects count skipped:', error.message);
          return;
        }
        setPendingProspects(count ?? 0);
      } catch (err) {
        logger.log('[AdminAddHub] prospects count failed:', err);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const cards: HubCard[] = [
    {
      to: '/admin/intake?mode=single',
      icon: FilePlus2,
      titleEn: 'Single listing',
      titleRu: 'Один объект',
      descEn: 'Paste text, a URL, or upload one set of photos.',
      descRu: 'Вставьте текст, ссылку или фото одного объекта.',
      whenEn: 'Best for: a referral, walk-in, a single villa or service.',
      whenRu: 'Когда: один объект — реферал, заявка, одна вилла или услуга.',
      tone: 'from-primary/10 to-transparent text-primary',
    },
    {
      to: '/admin/intake?mode=bulk_text',
      icon: Files,
      titleEn: 'Bulk text / URLs',
      titleRu: 'Bulk текст / URL',
      descEn: 'Paste a chat dump, a list, or many URLs at once.',
      descRu: 'Вставьте чат, список или много ссылок сразу.',
      whenEn: 'Best for: WhatsApp/Telegram dumps, agent broadcasts.',
      whenRu: 'Когда: дампы из WA/TG, рассылки агентов.',
      tone: 'from-accent/15 to-transparent text-accent-foreground',
    },
    {
      to: '/admin/intake?mode=csv',
      icon: FileSpreadsheet,
      titleEn: 'CSV / Excel',
      titleRu: 'CSV / Excel',
      descEn: 'Upload a spreadsheet, map columns, import.',
      descRu: 'Загрузите таблицу, сопоставьте колонки, импортируйте.',
      whenEn: 'Best for: partner exports, migrations, 50+ rows.',
      whenRu: 'Когда: выгрузки партнёров, миграции, 50+ строк.',
      tone: 'from-success/15 to-transparent text-success',
    },
    {
      to: '/admin/vendor-prospects',
      icon: Inbox,
      titleEn: 'Vendor applications',
      titleRu: 'Заявки партнёров',
      descEn: 'Review self-service signups from /vendor/join.',
      descRu: 'Заявки на саморегистрацию с /vendor/join.',
      whenEn: 'Best for: triage of inbound partner signups.',
      whenRu: 'Когда: разбор входящих заявок партнёров.',
      tone: 'from-warning/15 to-transparent text-warning',
      badgeCount: pendingProspects ?? undefined,
    },
  ];

  return (
    <PageContainer>
      <PageHeader
        title={isRu ? 'Добавить' : 'Add'}
        subtitle={
          isRu
            ? 'Выберите способ внесения сервиса, продукта или объекта'
            : 'Choose how to add a service, product, or listing'
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
        {cards.map(card => {
          const Icon = card.icon;
          return (
            <Link key={card.to} to={card.to} className="group block">
              <Card
                className={cn(
                  'relative h-full p-5 sm:p-6 overflow-hidden border transition-all',
                  'hover:border-primary/40 hover:shadow-md focus-within:border-primary/40'
                )}
              >
                <div
                  className={cn(
                    'absolute inset-0 bg-gradient-to-br opacity-60 pointer-events-none',
                    card.tone
                  )}
                  aria-hidden
                />
                <div className="relative space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div
                      className={cn(
                        'h-12 w-12 rounded-none bg-background/80 flex items-center justify-center shadow-sm',
                        card.tone
                      )}
                    >
                      <Icon className="h-6 w-6" />
                    </div>
                    {card.badgeCount && card.badgeCount > 0 ? (
                      <Badge variant="destructive" className="shrink-0">
                        {card.badgeCount} {isRu ? 'новых' : 'new'}
                      </Badge>
                    ) : null}
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold">
                      {isRu ? card.titleRu : card.titleEn}
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {isRu ? card.descRu : card.descEn}
                    </p>
                  </div>

                  <p className="text-xs text-muted-foreground/80">
                    {isRu ? card.whenRu : card.whenEn}
                  </p>

                  <div className="flex items-center gap-1 text-sm font-medium text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                    {isRu ? 'Открыть' : 'Open'}
                    <ArrowRight className="h-4 w-4" />
                  </div>
                </div>
              </Card>
            </Link>
          );
        })}
      </div>
    </PageContainer>
  );
}
