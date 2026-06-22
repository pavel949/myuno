import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export type TransactionType = 'topup' | 'payment' | 'refund' | 'bonus' | 'cashback';
export type TransactionStatus = 'pending' | 'completed' | 'failed' | 'cancelled';

export interface WalletTransaction {
  id: string;
  wallet_id: string;
  type: TransactionType;
  amount: number;
  currency: string;
  description: string | null;
  description_ru: string | null;
  reference_type: string | null;
  reference_id: string | null;
  status: TransactionStatus;
  created_at: string;
}

export interface TransactionFilters {
  type?: TransactionType | 'all';
  dateFrom?: Date;
  dateTo?: Date;
  status?: TransactionStatus | 'all';
}

export function useWalletTransactions(filters: TransactionFilters = {}) {
  const { user } = useAuth();

  const { data: transactions = [], isLoading, error, refetch } = useQuery({
    queryKey: ['wallet-transactions', user?.id, filters],
    queryFn: async (): Promise<WalletTransaction[]> => {
      if (!user?.id) return [];

      // First get the wallet
      const { data: wallet, error: walletError } = await supabase
        .from('wallets')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (walletError) throw walletError;
      if (!wallet) return [];

      // Build query
      let query = supabase
        .from('wallet_transactions')
        .select('*')
        .eq('wallet_id', wallet.id)
        .order('created_at', { ascending: false });

      // Apply filters
      if (filters.type && filters.type !== 'all') {
        query = query.eq('type', filters.type);
      }

      if (filters.status && filters.status !== 'all') {
        query = query.eq('status', filters.status);
      }

      if (filters.dateFrom) {
        query = query.gte('created_at', filters.dateFrom.toISOString());
      }

      if (filters.dateTo) {
        query = query.lte('created_at', filters.dateTo.toISOString());
      }

      const { data, error } = await query.limit(100);

      if (error) throw error;
      return (data || []) as WalletTransaction[];
    },
    enabled: !!user?.id,
  });

  // Calculate summary stats
  const stats = {
    totalIncome: transactions
      .filter(t => ['topup', 'refund', 'bonus', 'cashback'].includes(t.type) && t.status === 'completed')
      .reduce((sum, t) => sum + t.amount, 0),
    totalSpent: transactions
      .filter(t => t.type === 'payment' && t.status === 'completed')
      .reduce((sum, t) => sum + Math.abs(t.amount), 0),
    transactionCount: transactions.length,
  };

  return {
    transactions,
    stats,
    isLoading,
    error,
    refetch,
  };
}

// Export helper for CSV generation
export function generateTransactionsCsv(
  transactions: WalletTransaction[],
  language: 'ru' | 'en' | 'th' = 'ru'
): string {
  const headers = language === 'ru'
    ? ['Дата', 'Тип', 'Сумма', 'Валюта', 'Описание', 'Статус']
    : language === 'th'
    ? ['วันที่', 'ประเภท', 'จำนวน', 'สกุลเงิน', 'รายละเอียด', 'สถานะ']
    : ['Date', 'Type', 'Amount', 'Currency', 'Description', 'Status'];

  const typeLabels: Record<TransactionType, { ru: string; en: string; th: string }> = {
    topup: { ru: 'Пополнение', en: 'Top-up', th: 'เติมเงิน' },
    payment: { ru: 'Оплата', en: 'Payment', th: 'ชำระเงิน' },
    refund: { ru: 'Возврат', en: 'Refund', th: 'คืนเงิน' },
    bonus: { ru: 'Бонус', en: 'Bonus', th: 'โบนัส' },
    cashback: { ru: 'Кэшбэк', en: 'Cashback', th: 'เงินคืน' },
  };

  const statusLabels: Record<TransactionStatus, { ru: string; en: string; th: string }> = {
    pending: { ru: 'В обработке', en: 'Pending', th: 'กำลังดำเนินการ' },
    completed: { ru: 'Завершено', en: 'Completed', th: 'เสร็จสมบูรณ์' },
    failed: { ru: 'Ошибка', en: 'Failed', th: 'ล้มเหลว' },
    cancelled: { ru: 'Отменено', en: 'Cancelled', th: 'ยกเลิกแล้ว' },
  };

  const locale = language === 'ru' ? 'ru-RU' : language === 'th' ? 'th-TH' : 'en-US';
  const rows = transactions.map(t => [
    new Date(t.created_at).toLocaleDateString(locale),
    typeLabels[t.type][language],
    t.amount.toString(),
    t.currency,
    (language === 'ru' ? t.description_ru : t.description) || '',
    statusLabels[t.status][language],
  ]);

  const csvContent = [headers, ...rows]
    .map(row => row.map(cell => `"${cell}"`).join(','))
    .join('\n');

  return csvContent;
}
