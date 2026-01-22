import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Check, X, Minus } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent } from '@/components/ui/card';

interface ComparisonRow {
  featureRu: string;
  featureEn: string;
  uno: 'yes' | 'no' | 'partial';
  hostaway: 'yes' | 'no' | 'partial';
  guesty: 'yes' | 'no' | 'partial';
  lodgify: 'yes' | 'no' | 'partial';
}

const comparisonData: ComparisonRow[] = [
  { featureRu: 'Синхронизация календарей', featureEn: 'Calendar sync', uno: 'yes', hostaway: 'yes', guesty: 'yes', lodgify: 'yes' },
  { featureRu: 'Финансовая отчётность', featureEn: 'Financial reports', uno: 'yes', hostaway: 'yes', guesty: 'yes', lodgify: 'partial' },
  { featureRu: 'Автоматизация задач', featureEn: 'Task automation', uno: 'yes', hostaway: 'partial', guesty: 'partial', lodgify: 'no' },
  { featureRu: 'Снятие показаний счётчиков', featureEn: 'Meter reading', uno: 'yes', hostaway: 'no', guesty: 'no', lodgify: 'no' },
  { featureRu: 'Управление залогами', featureEn: 'Deposit management', uno: 'yes', hostaway: 'partial', guesty: 'partial', lodgify: 'no' },
  { featureRu: 'Инвентарь и повреждения', featureEn: 'Inventory & damage', uno: 'yes', hostaway: 'no', guesty: 'no', lodgify: 'no' },
  { featureRu: 'Связь с УК здания', featureEn: 'Building MC contact', uno: 'yes', hostaway: 'no', guesty: 'no', lodgify: 'no' },
  { featureRu: 'Команда на месте', featureEn: 'On-ground team', uno: 'yes', hostaway: 'no', guesty: 'no', lodgify: 'no' },
  { featureRu: 'Опция полного управления', featureEn: 'Full management option', uno: 'yes', hostaway: 'no', guesty: 'no', lodgify: 'no' },
  { featureRu: 'Русский язык', featureEn: 'Russian language', uno: 'yes', hostaway: 'no', guesty: 'no', lodgify: 'no' },
  { featureRu: 'Интеграция с локальными услугами', featureEn: 'Local services integration', uno: 'yes', hostaway: 'no', guesty: 'no', lodgify: 'no' },
];

function StatusIcon({ status }: { status: 'yes' | 'no' | 'partial' }) {
  if (status === 'yes') {
    return <Check className="w-5 h-5 text-green-500" />;
  }
  if (status === 'partial') {
    return <Minus className="w-5 h-5 text-yellow-500" />;
  }
  return <X className="w-5 h-5 text-red-500" />;
}

export function GuideComparison() {
  const { language } = useLanguage();
  const isRu = language === 'ru';

  return (
    <div className="p-8 print:p-12 space-y-8">
      <section id="comparison" className="print-break-before">
        <h2 className="text-2xl font-bold mb-6 text-foreground">
          {isRu ? 'Сравнение с мировыми системами' : 'Comparison with Global Systems'}
        </h2>

        <p className="text-muted-foreground mb-6">
          {isRu 
            ? 'Как UNO Property Care соотносится с ведущими PMS-системами:'
            : 'How UNO Property Care compares to leading PMS systems:'
          }
        </p>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="min-w-[200px]">
                  {isRu ? 'Функция' : 'Feature'}
                </TableHead>
                <TableHead className="text-center bg-primary/5">UNO</TableHead>
                <TableHead className="text-center">Hostaway</TableHead>
                <TableHead className="text-center">Guesty</TableHead>
                <TableHead className="text-center">Lodgify</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {comparisonData.map((row) => (
                <TableRow key={row.featureEn}>
                  <TableCell className="font-medium">
                    {isRu ? row.featureRu : row.featureEn}
                  </TableCell>
                  <TableCell className="text-center bg-primary/5">
                    <div className="flex justify-center">
                      <StatusIcon status={row.uno} />
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex justify-center">
                      <StatusIcon status={row.hostaway} />
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex justify-center">
                      <StatusIcon status={row.guesty} />
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex justify-center">
                      <StatusIcon status={row.lodgify} />
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <Card className="mt-8 bg-primary/5 border-primary/20">
          <CardContent className="p-6">
            <h4 className="font-semibold text-foreground mb-3">
              {isRu ? 'Главное отличие UNO:' : 'UNO\'s Key Difference:'}
            </h4>
            <p className="text-muted-foreground italic">
              {isRu 
                ? '«Глобальные системы — это софт. UNO — это софт + сервис + люди на месте.»'
                : '"Global systems are software. UNO is software + service + people on the ground."'
              }
            </p>
          </CardContent>
        </Card>

        {/* Legend */}
        <div className="mt-6 flex flex-wrap gap-6 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-green-500" />
            <span>{isRu ? 'Полная поддержка' : 'Full support'}</span>
          </div>
          <div className="flex items-center gap-2">
            <Minus className="w-4 h-4 text-yellow-500" />
            <span>{isRu ? 'Частичная поддержка' : 'Partial support'}</span>
          </div>
          <div className="flex items-center gap-2">
            <X className="w-4 h-4 text-red-500" />
            <span>{isRu ? 'Не поддерживается' : 'Not supported'}</span>
          </div>
        </div>
      </section>
    </div>
  );
}
