import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  useRealEstateDomainChain,
  useRealEstateDomainCoverage,
} from '@/hooks/useRealEstateDomainChain';
import {
  REAL_ESTATE_DOMAIN_TABLES,
  UNIT_SOURCE_LABELS,
  DOMAIN_LEVEL_LABELS,
} from '@/lib/real-estate/domains';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Link2Off, Layers } from 'lucide-react';

/**
 * Admin visibility into the developer -> project -> unit chain:
 * coverage per unit table plus the units that still need a project.
 */
export function RealEstateDomainHealthPanel() {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const { data: coverage, isLoading } = useRealEstateDomainCoverage();
  const { data: orphans } = useRealEstateDomainChain({ orphansOnly: true, limit: 50 });

  const t = (ru: string, en: string) => (isRu ? ru : en);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Layers className="h-4 w-4 text-muted-foreground" />
          {t('Структура данных недвижимости', 'Real-estate data structure')}
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          {t(
            'Застройщик → Проект → Юнит. Застройщик выводится через проект и не дублируется на юните.',
            'Developer → Project → Unit. The developer is derived through the project, never duplicated on the unit.',
          )}
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-3 sm:grid-cols-3">
          {(['developer', 'project', 'unit'] as const).map((level) => (
            <div key={level} className="border border-border p-3">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                {isRu ? DOMAIN_LEVEL_LABELS[level].ru : DOMAIN_LEVEL_LABELS[level].en}
              </p>
              <ul className="mt-2 space-y-1">
                {REAL_ESTATE_DOMAIN_TABLES.filter((tb) => tb.level === level).map((tb) => (
                  <li key={tb.table} className="flex items-center gap-2 text-sm">
                    <code className="font-mono text-xs">{tb.table}</code>
                    {tb.status === 'deprecated' && (
                      <Badge variant="outline" className="text-[10px]">
                        {t(`устарело → ${tb.useInstead}`, `deprecated → ${tb.useInstead}`)}
                      </Badge>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div>
          <p className="mb-2 text-sm font-medium">
            {t('Привязка юнитов к проектам', 'Unit-to-project linkage')}
          </p>
          {isLoading ? (
            <Skeleton className="h-24 w-full" />
          ) : (
            <div className="space-y-2">
              {(coverage ?? []).map((row) => {
                const pct = row.total ? Math.round((row.linked / row.total) * 100) : 0;
                return (
                  <div key={row.unit_source} className="flex items-center justify-between gap-3 text-sm">
                    <span className="flex items-center gap-2">
                      {isRu
                        ? UNIT_SOURCE_LABELS[row.unit_source]?.ru
                        : UNIT_SOURCE_LABELS[row.unit_source]?.en}
                      <code className="font-mono text-xs text-muted-foreground">{row.unit_source}</code>
                    </span>
                    <span className="font-mono text-xs">
                      {row.linked}/{row.total} · {pct}%
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {(orphans?.length ?? 0) > 0 && (
          <div>
            <p className="mb-2 flex items-center gap-2 text-sm font-medium">
              <Link2Off className="h-4 w-4 text-muted-foreground" />
              {t('Требуют привязки к проекту', 'Need a project link')}
              <Badge variant="secondary">{orphans?.length}</Badge>
            </p>
            <div className="max-h-56 space-y-1 overflow-y-auto">
              {orphans?.map((row) => (
                <div
                  key={`${row.unit_source}-${row.unit_id}`}
                  className="flex items-center justify-between gap-3 border-b border-border py-1 text-sm"
                >
                  <span className="truncate">
                    {row.unit_label || row.unit_number || row.unit_id.slice(0, 8)}
                  </span>
                  <code className="shrink-0 font-mono text-xs text-muted-foreground">
                    {row.unit_source}
                  </code>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
