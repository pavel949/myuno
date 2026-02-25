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
import { WalletTransaction, TransactionType, TransactionStatus } from '@/hooks/useWalletTransactions';
import { useLanguage } from '@/contexts/LanguageContext';

interface TransactionListProps {
  transactions: WalletTransaction[];
  showStatus?: boolean;
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
    colorClass: 'text-success bg-success/10',
    isPositive: true,
  },
  payment: {
    icon: ArrowUpRight,
    labelRu: 'Оплата',
    labelEn: 'Payment',
    colorClass: 'text-destructive bg-destructive/10',
    isPositive: false,
  },
  refund: {
    icon: RotateCcw,
    labelRu: 'Возврат',
    labelEn: 'Refund',
    colorClass: 'text-info bg-info/10',
    isPositive: true,
  },
  bonus: {
    icon: Gift,
    labelRu: 'Бонус',
    labelEn: 'Bonus',
    colorClass: 'text-accent-purple bg-accent-purple/10',
    isPositive: true,
  },
  cashback: {
    icon: Percent,
    labelRu: 'Кэшбэк',
    labelEn: 'Cashback',
    colorClass: 'text-warning bg-warning/10',
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

export function TransactionList({ transactions, showStatus = false }: TransactionListProps) {
  const { language } = useLanguage();
  const isRu = language === 'ru';

  if (transactions.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        {isRu ? 'Нет транзакций' : 'No transactions'}
      </div>
    );
  }

  // Group transactions by date
  const groupedByDate = transactions.reduce((groups, transaction) => {
    const date = format(new Date(transaction.created_at), 'yyyy-MM-dd');
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(transaction);
    return groups;
  }, {} as Record<string, WalletTransaction[]>);

  return (
    <div className="space-y-4">
      {Object.entries(groupedByDate).map(([date, dayTransactions]) => (
        <div key={date}>
          <p className="text-xs font-medium text-muted-foreground mb-2 px-1">
            {format(new Date(date), 'd MMMM yyyy', { locale: isRu ? ru : undefined })}
          </p>
          <div className="space-y-1">
            {dayTransactions.map((transaction) => {
              const config = typeConfig[transaction.type];
              const status = statusConfig[transaction.status];
              const Icon = config.icon;

              return (
                <div
                  key={transaction.id}
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors"
                >
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
                    config.isPositive ? 'text-success' : 'text-foreground'
                  )}>
                    {config.isPositive ? '+' : '-'}{Math.abs(transaction.amount).toLocaleString()} {transaction.currency}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
