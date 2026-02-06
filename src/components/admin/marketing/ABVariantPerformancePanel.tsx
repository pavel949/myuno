import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { BarChart3, Trophy, Loader2 } from 'lucide-react';
import type { ABTest } from '@/hooks/useABVariants';
import { cn } from '@/lib/utils';

interface ABVariantPerformancePanelProps {
  test: ABTest;
}

function rate(num: number | null, den: number | null): string {
  if (!den || den === 0 || num === null) return '0.0%';
  return ((num / den) * 100).toFixed(1) + '%';
}

export function ABVariantPerformancePanel({ test }: ABVariantPerformancePanelProps) {
  const { language } = useLanguage();
  const isRu = language === 'ru';

  const rows = [
    {
      label: 'A',
      variant: test.variant_a,
      impressions: test.impressions_a ?? 0,
      conversions: test.conversions_a ?? 0,
    },
    {
      label: 'B',
      variant: test.variant_b,
      impressions: test.impressions_b ?? 0,
      conversions: test.conversions_b ?? 0,
    },
  ];

  const bestRate = Math.max(
    ...rows.map(r => r.impressions > 0 ? r.conversions / r.impressions : 0)
  );

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-primary" />
          {isRu ? 'Показатели вариантов' : 'Variant Performance'}
          {test.is_active && <Badge variant="default" className="text-[10px]">Live</Badge>}
          {test.winner && (
            <Badge variant="success" className="text-[10px] gap-1">
              <Trophy className="h-2.5 w-2.5" />
              {isRu ? 'Победитель:' : 'Winner:'} {test.winner}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-16">{isRu ? 'Вариант' : 'Variant'}</TableHead>
              <TableHead>{isRu ? 'Заголовок' : 'Headline'}</TableHead>
              <TableHead className="text-right">{isRu ? 'Показы' : 'Views'}</TableHead>
              <TableHead className="text-right">{isRu ? 'CTA клики' : 'CTA Clicks'}</TableHead>
              <TableHead className="text-right">{isRu ? 'Конверсия' : 'Conv. Rate'}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map(row => {
              const thisRate = row.impressions > 0 ? row.conversions / row.impressions : 0;
              const isBest = thisRate === bestRate && thisRate > 0;
              return (
                <TableRow key={row.label}>
                  <TableCell>
                    <Badge
                      variant={row.label === test.winner ? 'default' : 'outline'}
                      className="text-xs"
                    >
                      {row.label}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm max-w-[200px] truncate">
                    {isRu ? (row.variant.headline_ru || row.variant.headline_en) : row.variant.headline_en}
                  </TableCell>
                  <TableCell className="text-right tabular-nums font-medium">
                    {row.impressions}
                  </TableCell>
                  <TableCell className="text-right tabular-nums font-medium">
                    {row.conversions}
                  </TableCell>
                  <TableCell className="text-right">
                    <span className={cn(
                      "tabular-nums font-semibold",
                      isBest ? "text-success" : "text-muted-foreground"
                    )}>
                      {rate(row.conversions, row.impressions)}
                    </span>
                    {isBest && rows.filter(r => {
                      const rRate = r.impressions > 0 ? r.conversions / r.impressions : 0;
                      return rRate > 0;
                    }).length > 1 && (
                      <Trophy className="h-3 w-3 inline-block ml-1 text-success" />
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>

        {/* Traffic split */}
        <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
          <span>{isRu ? 'Распределение трафика:' : 'Traffic split:'}</span>
          <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden flex">
            <div
              className="bg-primary h-full transition-all"
              style={{ width: `${test.traffic_split ?? 50}%` }}
            />
            <div
              className="bg-accent h-full transition-all"
              style={{ width: `${100 - (test.traffic_split ?? 50)}%` }}
            />
          </div>
          <span className="tabular-nums">A:{test.traffic_split ?? 50}% / B:{100 - (test.traffic_split ?? 50)}%</span>
        </div>
      </CardContent>
    </Card>
  );
}
