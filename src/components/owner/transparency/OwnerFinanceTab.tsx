import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useSupabaseQuery } from '@/hooks/useSupabaseQuery';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface OwnerFinanceTabProps {
  propertyId: string;
}

export function OwnerFinanceTab({ propertyId }: OwnerFinanceTabProps) {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const { user } = useAuth();

  const { data: financials = [], isLoading } = useSupabaseQuery<any>({
    table: 'property_financials',
    select: 'id, date, type, category, amount, currency, description',
    filters: [{ column: 'property_id', value: propertyId }],
    orderBy: { column: 'date', ascending: false },
    limit: 100,
    enabled: !!user && !!propertyId,
  });

  if (isLoading) {
    return <div className="space-y-2">{[1, 2, 3].map(i => <div key={i} className="h-12 bg-muted animate-pulse rounded" />)}</div>;
  }

  if (financials.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground text-sm">
        {isRu ? 'Нет финансовых записей' : 'No financial records'}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{isRu ? 'Дата' : 'Date'}</TableHead>
            <TableHead>{isRu ? 'Тип' : 'Type'}</TableHead>
            <TableHead>{isRu ? 'Категория' : 'Category'}</TableHead>
            <TableHead>{isRu ? 'Описание' : 'Description'}</TableHead>
            <TableHead className="text-right">{isRu ? 'Сумма' : 'Amount'}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {financials.map((f: any) => (
            <TableRow key={f.id}>
              <TableCell className="text-xs whitespace-nowrap">
                {format(new Date(f.date), 'd MMM yyyy', { locale: isRu ? ru : undefined })}
              </TableCell>
              <TableCell>
                <span className={cn(
                  "text-xs font-medium px-2 py-0.5 rounded-full",
                  f.type === 'income' 
                    ? 'bg-success/10 text-success'
                    : 'bg-destructive/10 text-destructive'
                )}>
                  {f.type === 'income' ? (isRu ? 'Доход' : 'Income') : (isRu ? 'Расход' : 'Expense')}
                </span>
              </TableCell>
              <TableCell className="text-xs">{f.category || '—'}</TableCell>
              <TableCell className="text-xs max-w-[200px] truncate">{f.description || '—'}</TableCell>
              <TableCell className={cn("text-right text-sm font-medium", f.type === 'income' ? 'text-success' : 'text-destructive')}>
                {f.type === 'income' ? '+' : '-'}฿{f.amount?.toLocaleString()}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
