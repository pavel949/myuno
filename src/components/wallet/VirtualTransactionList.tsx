import { useMemo } from 'react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { 
  ArrowDownLeft, 
  ArrowUpRight, 
  RotateCcw, 
  Gift, 
  Percent,
  Clock,
  CheckCircle2,
  XCircle,
  Ban
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { GroupedVirtualList } from '@/components/ui/VirtualList';
import { WalletTransaction, TransactionType, TransactionStatus } from '@/hooks/useWalletTransactions';
import { useLanguage } from '@/contexts/LanguageContext';

interface VirtualTransactionListProps {
  transactions: WalletTransaction[];
  showStatus?: boolean;
  maxHeight?: string;
}

const typeConfig: Record<TransactionType, {
  icon: typeof ArrowDownLeft;
  labelRu: string;
  labelEn: string;
  colorClass: string;
  isPositive: boolean;
}> = {
  topup: {
    icon: ArrowDownLeft,
    labelRu: 'Пополнение',
    labelEn: 'Top-up',
    colorClass: 'text-green-500 bg-green-500/10',
    isPositive: true,
  },
  payment: {
    icon: ArrowUpRight,
    labelRu: 'Оплата',
    labelEn: 'Payment',
    colorClass: 'text-red-500 bg-red-500/10',
    isPositive: false,
  },
  refund: {
    icon: RotateCcw,
    labelRu: 'Возврат',
    labelEn: 'Refund',
    colorClass: 'text-blue-500 bg-blue-500/10',
    isPositive: true,
  },
  bonus: {
    icon: Gift,
    labelRu: 'Бонус',
    labelEn: 'Bonus',
    colorClass: 'text-purple-500 bg-purple-500/10',
    isPositive: true,
  },
  cashback: {
    icon: Percent,
    labelRu: 'Кэшбэк',
    labelEn: 'Cashback',
    colorClass: 'text-amber-500 bg-amber-500/10',
    isPositive: true,
  },
};

const statusConfig: Record<TransactionStatus, {
  icon: typeof Clock;
  labelRu: string;
  labelEn: string;
  variant: 'default' | 'secondary' | 'destructive' | 'outline';
}> = {
  pending: {
    icon: Clock,
    labelRu: 'В обработке',
    labelEn: 'Pending',
    variant: 'secondary',
  },
  completed: {
    icon: CheckCircle2,
    labelRu: 'Завершено',
    labelEn: 'Completed',
    variant: 'default',
  },
  failed: {
    icon: XCircle,
    labelRu: 'Ошибка',
    labelEn: 'Failed',
    variant: 'destructive',
  },
  cancelled: {
    icon: Ban,
    labelRu: 'Отменено',
    labelEn: 'Cancelled',
    variant: 'outline',
  },
};

export function VirtualTransactionList({ 
  transactions, 
  showStatus = false,
  maxHeight = 'calc(100vh - 280px)',
}: VirtualTransactionListProps) {
  const { language } = useLanguage();
  const isRu = language === 'ru';

  // Group transactions by date
  const groups = useMemo(() => {
    const grouped = transactions.reduce((acc, transaction) => {
      const date = format(new Date(transaction.created_at), 'yyyy-MM-dd');
      if (!acc[date]) {
        acc[date] = [];
      }
      acc[date].push(transaction);
      return acc;
    }, {} as Record<string, WalletTransaction[]>);

    return Object.entries(grouped).map(([date, items]) => ({
      label: format(new Date(date), 'd MMMM yyyy', { locale: isRu ? ru : undefined }),
      items,
    }));
  }, [transactions, isRu]);

  if (transactions.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        {isRu ? 'Нет транзакций' : 'No transactions'}
      </div>
    );
  }

  // For small lists, use regular rendering
  if (transactions.length < 50) {
    return (
      <div className="space-y-4">
        {groups.map((group) => (
          <div key={group.label}>
            <p className="text-xs font-medium text-muted-foreground mb-2 px-1">
              {group.label}
            </p>
            <div className="space-y-1">
              {group.items.map((transaction) => (
                <TransactionRow 
                  key={transaction.id} 
                  transaction={transaction} 
                  showStatus={showStatus}
                  isRu={isRu}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Use virtualization for large lists
  return (
    <GroupedVirtualList
      groups={groups}
      estimateSize={64}
      estimateHeaderSize={32}
      maxHeight={maxHeight}
      renderHeader={(label) => (
        <p className="text-xs font-medium text-muted-foreground px-1 py-2 bg-background sticky top-0">
          {label}
        </p>
      )}
      renderItem={(transaction) => (
        <TransactionRow 
          transaction={transaction} 
          showStatus={showStatus}
          isRu={isRu}
        />
      )}
      getItemKey={(item) => item.id}
    />
  );
}

// Extracted row component for reuse
function TransactionRow({ 
  transaction, 
  showStatus, 
  isRu 
}: { 
  transaction: WalletTransaction; 
  showStatus: boolean;
  isRu: boolean;
}) {
  const config = typeConfig[transaction.type];
  const status = statusConfig[transaction.status];
  const Icon = config.icon;

  return (
    <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
      <div className={cn('p-2 rounded-full', config.colorClass)}>
        <Icon className="w-4 h-4" />
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">
          {isRu ? transaction.description_ru || config.labelRu : transaction.description || config.labelEn}
        </p>
        <p className="text-xs text-muted-foreground">
          {format(new Date(transaction.created_at), 'HH:mm')}
          {showStatus && transaction.status !== 'completed' && (
            <Badge variant={status.variant} className="ml-2 text-[10px] px-1.5 py-0">
              {isRu ? status.labelRu : status.labelEn}
            </Badge>
          )}
        </p>
      </div>

      <div className={cn(
        'text-sm font-semibold tabular-nums',
        config.isPositive ? 'text-green-600' : 'text-foreground'
      )}>
        {config.isPositive ? '+' : '-'}{Math.abs(transaction.amount).toLocaleString()} {transaction.currency}
      </div>
    </div>
  );
}
