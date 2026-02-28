import React, { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useSupabaseQuery } from '@/hooks/useSupabaseQuery';
import { supabase } from '@/integrations/supabase/client';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { Check, X, Filter } from 'lucide-react';
import { toast } from 'sonner';

interface OwnerFinanceTabProps {
  propertyId: string;
}

// Type-safe: property_financials exists in Database schema
const db = supabase;

export function OwnerFinanceTab({ propertyId }: OwnerFinanceTabProps) {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const { user } = useAuth();
  const [filter, setFilter] = useState<'all' | 'income' | 'expense' | 'pending'>('all');

  const { data: financials = [], isLoading, refetch } = useSupabaseQuery<any>({
    table: 'property_financials',
    select: 'id, transaction_date, transaction_type, category, amount, currency, description, approval_status',
    filters: [{ column: 'property_id', value: propertyId }],
    orderBy: { column: 'transaction_date', ascending: false },
    limit: 100,
    enabled: !!user && !!propertyId,
  });

  const filtered = financials.filter((f: any) => {
    if (filter === 'all') return true;
    if (filter === 'pending') return f.approval_status === 'pending';
    return f.transaction_type === filter;
  });

  const pendingCount = financials.filter((f: any) => f.approval_status === 'pending').length;

  const handleApproval = async (id: string, status: 'approved' | 'rejected') => {
    const { error } = await db
      .from('property_financials')
      .update({ approval_status: status })
      .eq('id', id);
    if (error) {
      toast.error(isRu ? 'Ошибка' : 'Error');
    } else {
      toast.success(status === 'approved'
        ? (isRu ? 'Расход одобрен' : 'Expense approved')
        : (isRu ? 'Расход отклонён' : 'Expense rejected')
      );
      refetch();
    }
  };

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
    <div className="space-y-3">
      {/* Filters */}
      <div className="flex items-center gap-2 flex-wrap">
        <Filter className="w-4 h-4 text-muted-foreground" />
        {(['all', 'income', 'expense', 'pending'] as const).map(f => (
          <Button
            key={f}
            variant={filter === f ? 'default' : 'outline'}
            size="sm"
            className="h-7 text-xs"
            onClick={() => setFilter(f)}
          >
            {f === 'all' && (isRu ? 'Все' : 'All')}
            {f === 'income' && (isRu ? 'Доход' : 'Income')}
            {f === 'expense' && (isRu ? 'Расход' : 'Expense')}
            {f === 'pending' && (
              <>
                {isRu ? 'На одобрение' : 'Pending'}
                {pendingCount > 0 && <span className="ml-1 bg-destructive text-destructive-foreground rounded-full px-1.5 text-[10px]">{pendingCount}</span>}
              </>
            )}
          </Button>
        ))}
      </div>

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{isRu ? 'Дата' : 'Date'}</TableHead>
              <TableHead>{isRu ? 'Тип' : 'Type'}</TableHead>
              <TableHead>{isRu ? 'Категория' : 'Category'}</TableHead>
              <TableHead>{isRu ? 'Описание' : 'Description'}</TableHead>
              <TableHead className="text-right">{isRu ? 'Сумма' : 'Amount'}</TableHead>
              <TableHead>{isRu ? 'Статус' : 'Status'}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((f: any) => (
              <TableRow key={f.id}>
                <TableCell className="text-xs whitespace-nowrap">
                  {format(new Date(f.transaction_date), 'd MMM yyyy', { locale: isRu ? ru : undefined })}
                </TableCell>
                <TableCell>
                  <span className={cn(
                    "text-xs font-medium px-2 py-0.5 rounded-full",
                    f.transaction_type === 'income'
                      ? 'bg-success/10 text-success'
                      : 'bg-destructive/10 text-destructive'
                  )}>
                    {f.transaction_type === 'income' ? (isRu ? 'Доход' : 'Income') : (isRu ? 'Расход' : 'Expense')}
                  </span>
                </TableCell>
                <TableCell className="text-xs">{f.category || '—'}</TableCell>
                <TableCell className="text-xs max-w-[200px] truncate">{f.description || '—'}</TableCell>
                <TableCell className={cn("text-right text-sm font-medium", f.transaction_type === 'income' ? 'text-success' : 'text-destructive')}>
                  {f.transaction_type === 'income' ? '+' : '-'}฿{f.amount?.toLocaleString()}
                </TableCell>
                <TableCell>
                  {f.approval_status === 'pending' ? (
                    <div className="flex items-center gap-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-6 w-6 text-success hover:text-success"
                        onClick={() => handleApproval(f.id, 'approved')}
                      >
                        <Check className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-6 w-6 text-destructive hover:text-destructive"
                        onClick={() => handleApproval(f.id, 'rejected')}
                      >
                        <X className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  ) : (
                    <span className={cn(
                      "text-[10px] px-1.5 py-0.5 rounded",
                      f.approval_status === 'approved' && 'bg-success/10 text-success',
                      f.approval_status === 'rejected' && 'bg-destructive/10 text-destructive',
                      f.approval_status === 'auto_approved' && 'bg-muted text-muted-foreground',
                    )}>
                      {f.approval_status === 'auto_approved' ? '✓' : f.approval_status}
                    </span>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
