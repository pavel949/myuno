import { useState } from 'react';
import { useUrlFilters } from '@/hooks/useUrlFilters';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageContainer } from '@/components/uno/PageContainer';
import { PageHeader } from '@/components/uno/PageHeader';
import { TransactionList } from '@/components/wallet/TransactionList';
import { TransactionFiltersComponent } from '@/components/wallet/TransactionFilters';
import { ContentSkeleton } from '@/components/ui/ContentSkeleton';
import { useWalletTransactions, TransactionFilters, generateTransactionsCsv } from '@/hooks/useWalletTransactions';
import { useLanguage } from '@/contexts/LanguageContext';
import { toast } from 'sonner';

export default function TransactionHistory() {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const [filters, setFilters] = useState<TransactionFilters>({});
  const { transactions, stats, isLoading } = useWalletTransactions(filters);

  const handleExport = () => {
    if (transactions.length === 0) {
      toast.error(isRu ? 'Нет транзакций для экспорта' : 'No transactions to export');
      return;
    }

    const csv = generateTransactionsCsv(transactions, language as 'ru' | 'en');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `transactions_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success(isRu ? 'Файл скачан' : 'File downloaded');
  };

  return (
    <AppLayout>
      <PageContainer>
        <PageHeader 
          title={isRu ? 'История транзакций' : 'Transaction History'} 
          showBack 
        />

        {/* Stats Summary */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="p-3 rounded-none bg-success/10 text-center">
            <p className="text-lg font-bold text-success">
              +{stats.totalIncome.toLocaleString()}
            </p>
            <p className="text-xs text-muted-foreground">
              {isRu ? 'Доход' : 'Income'}
            </p>
          </div>
          <div className="p-3 rounded-none bg-destructive/10 text-center">
            <p className="text-lg font-bold text-foreground">
              -{stats.totalSpent.toLocaleString()}
            </p>
            <p className="text-xs text-muted-foreground">
              {isRu ? 'Расход' : 'Spent'}
            </p>
          </div>
          <div className="p-3 rounded-none bg-muted text-center">
            <p className="text-lg font-bold">
              {stats.transactionCount}
            </p>
            <p className="text-xs text-muted-foreground">
              {isRu ? 'Операций' : 'Operations'}
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-4">
          <TransactionFiltersComponent
            filters={filters}
            onFiltersChange={setFilters}
            onExport={handleExport}
          />
        </div>

        {/* Transaction List */}
        {isLoading ? (
          <ContentSkeleton variant="list" count={5} />
        ) : (
          <TransactionList transactions={transactions} showStatus />
        )}
      </PageContainer>
    </AppLayout>
  );
}
