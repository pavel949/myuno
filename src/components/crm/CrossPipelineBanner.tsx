/**
 * CrossPipelineBanner
 *
 * Renders a small awareness banner inside a contact detail screen when
 * the same identity is present in another CRM pipeline. Bilingual.
 *
 * Example: in MC's /mc/contacts/:id, if the same person is also in
 * /capital/contacts (same email or phone), we show:
 *
 *    «Этот контакт также присутствует в Capital pipeline. Открыть →»
 *
 * Zero data mutation. Pure read. RLS on the underlying view will hide
 * pipelines the current user isn't allowed to see.
 */
import React from 'react';
import { Link } from 'react-router-dom';
import { Building2, Briefcase, Store, ExternalLink } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/contexts/LanguageContext';
import { useUnifiedContact, type CrmSourceTable } from '@/hooks/useUnifiedContact';
import { cn } from '@/lib/utils';

interface Props {
  sourceTable: CrmSourceTable;
  sourceId: string;
  className?: string;
}

const PIPELINE_META: Record<CrmSourceTable, {
  labelEn: string; labelRu: string;
  icon: React.ComponentType<{ className?: string }>;
  href: (id: string) => string;
  tone: string;
}> = {
  crm_contacts: {
    labelEn: 'MC CRM',  labelRu: 'CRM Управляющей',
    icon: Building2,
    href: (id) => `/mc/contacts/${id}`,
    tone: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30',
  },
  capital_contacts: {
    labelEn: 'Capital', labelRu: 'Capital',
    icon: Briefcase,
    href: (id) => `/capital/contacts/${id}`,
    tone: 'bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/30',
  },
  vendor_prospects: {
    labelEn: 'Vendor outreach', labelRu: 'Аутрич вендоров',
    icon: Store,
    href: (id) => `/admin/vendor-prospects?id=${id}`,
    tone: 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30',
  },
};

export function CrossPipelineBanner({ sourceTable, sourceId, className }: Props) {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const { data, isLoading } = useUnifiedContact(sourceTable, sourceId);

  if (isLoading || !data || data.otherPipelines.length === 0) return null;

  return (
    <Card className={cn('p-3 sm:p-4 bg-muted/40 border-dashed', className)}>
      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
        <div className="text-xs sm:text-sm text-muted-foreground shrink-0">
          {isRu
            ? 'Этот человек также присутствует в:'
            : 'This person also exists in:'}
        </div>
        <div className="flex flex-wrap gap-2">
          {data.otherPipelines.map((p) => {
            const meta = PIPELINE_META[p];
            const otherId = data.sourceIds[p];
            const Icon = meta.icon;
            const label = isRu ? meta.labelRu : meta.labelEn;
            if (!otherId) {
              return (
                <Badge key={p} variant="outline" className={cn('gap-1', meta.tone)}>
                  <Icon className="h-3 w-3" />{label}
                </Badge>
              );
            }
            return (
              <Link
                key={p}
                to={meta.href(otherId)}
                className={cn(
                  'inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs font-medium transition-colors hover:opacity-80',
                  meta.tone
                )}
              >
                <Icon className="h-3 w-3" />
                {label}
                <ExternalLink className="h-3 w-3 opacity-60" />
              </Link>
            );
          })}
        </div>
      </div>
    </Card>
  );
}
