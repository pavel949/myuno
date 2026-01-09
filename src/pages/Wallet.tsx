import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import {
  Wallet as WalletIcon,
  Plus,
  ArrowUpRight,
  ArrowDownLeft,
  Gift,
  RotateCcw,
  ShoppingBag,
  Clock,
  CreditCard,
  TrendingUp,
} from "lucide-react";
import { format } from "date-fns";
import { ru, enUS } from "date-fns/locale";

interface WalletData {
  id: string;
  balance: number;
  currency: string;
}

interface Transaction {
  id: string;
  type: 'topup' | 'payment' | 'refund' | 'bonus' | 'cashback';
  amount: number;
  currency: string;
  description: string | null;
  description_ru: string | null;
  reference_type: string | null;
  status: string;
  created_at: string;
}

const Wallet = () => {
  const { language } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }

    const loadWalletData = async () => {
      setIsLoading(true);
      try {
        // Get or create wallet using RPC
        const { data: walletData, error: walletError } = await supabase
          .rpc('get_or_create_wallet', { p_user_id: user.id });

        if (walletError) throw walletError;

        if (walletData) {
          setWallet({
            id: walletData.id,
            balance: Number(walletData.balance),
            currency: walletData.currency,
          });

          // Load transactions
          const { data: txData, error: txError } = await supabase
            .from('wallet_transactions')
            .select('*')
            .eq('wallet_id', walletData.id)
            .order('created_at', { ascending: false })
            .limit(50);

          if (txError) throw txError;
          setTransactions((txData || []) as Transaction[]);
        }
      } catch (error) {
        console.error('Error loading wallet:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadWalletData();
  }, [user, navigate]);

  const getTransactionIcon = (type: Transaction['type']) => {
    switch (type) {
      case 'topup':
        return <ArrowDownLeft className="w-5 h-5 text-green-500" />;
      case 'payment':
        return <ArrowUpRight className="w-5 h-5 text-red-500" />;
      case 'refund':
        return <RotateCcw className="w-5 h-5 text-blue-500" />;
      case 'bonus':
        return <Gift className="w-5 h-5 text-purple-500" />;
      case 'cashback':
        return <TrendingUp className="w-5 h-5 text-emerald-500" />;
      default:
        return <ShoppingBag className="w-5 h-5 text-muted-foreground" />;
    }
  };

  const getTransactionLabel = (type: Transaction['type']) => {
    const labels = {
      topup: { en: 'Top Up', ru: 'Пополнение' },
      payment: { en: 'Payment', ru: 'Оплата' },
      refund: { en: 'Refund', ru: 'Возврат' },
      bonus: { en: 'Bonus', ru: 'Бонус' },
      cashback: { en: 'Cashback', ru: 'Кэшбэк' },
    };
    return labels[type]?.[language] || type;
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; label: { en: string; ru: string } }> = {
      completed: { variant: 'default', label: { en: 'Completed', ru: 'Выполнено' } },
      pending: { variant: 'secondary', label: { en: 'Pending', ru: 'Ожидание' } },
      failed: { variant: 'destructive', label: { en: 'Failed', ru: 'Ошибка' } },
      cancelled: { variant: 'outline', label: { en: 'Cancelled', ru: 'Отменено' } },
    };
    const config = variants[status] || variants.completed;
    return <Badge variant={config.variant}>{config.label[language]}</Badge>;
  };

  const formatCurrency = (amount: number, currency: string) => {
    const symbol = currency === 'RUB' ? '₽' : currency;
    return `${amount >= 0 ? '+' : ''}${amount.toLocaleString()} ${symbol}`;
  };

  const quickActions = [
    { 
      icon: Plus, 
      label: language === 'ru' ? 'Пополнить' : 'Top Up',
      color: 'bg-green-500',
      onClick: () => {} // TODO: Implement top up
    },
    { 
      icon: CreditCard, 
      label: language === 'ru' ? 'Карты' : 'Cards',
      color: 'bg-blue-500',
      onClick: () => {} // TODO: Implement cards management
    },
    { 
      icon: Clock, 
      label: language === 'ru' ? 'История' : 'History',
      color: 'bg-purple-500',
      onClick: () => {} // TODO: Full history
    },
  ];

  if (!user) {
    return null;
  }

  return (
    <AppLayout title={language === "ru" ? "Кошелёк" : "Wallet"}>
      <div className="p-4 space-y-6 pb-24">
        {/* Balance Card */}
        <Card className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground overflow-hidden">
          <CardContent className="p-6">
            {isLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-4 w-24 bg-primary-foreground/20" />
                <Skeleton className="h-10 w-40 bg-primary-foreground/20" />
              </div>
            ) : (
              <>
                <div className="flex items-center gap-2 mb-2">
                  <WalletIcon className="w-5 h-5" />
                  <span className="text-sm opacity-90">
                    {language === 'ru' ? 'Баланс' : 'Balance'}
                  </span>
                </div>
                <div className="text-4xl font-bold mb-4">
                  {wallet?.balance.toLocaleString() || 0} ₽
                </div>
                <div className="text-sm opacity-75">
                  {language === 'ru' 
                    ? 'Используйте баланс для оплаты услуг' 
                    : 'Use balance to pay for services'}
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="grid grid-cols-3 gap-3">
          {quickActions.map((action, idx) => {
            const Icon = action.icon;
            return (
              <button
                key={idx}
                onClick={action.onClick}
                className="flex flex-col items-center gap-2 p-4 bg-card rounded-xl border border-border hover:border-primary/50 transition-colors"
              >
                <div className={`w-12 h-12 rounded-full ${action.color} flex items-center justify-center`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <span className="text-sm font-medium">{action.label}</span>
              </button>
            );
          })}
        </div>

        {/* Transactions */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">
              {language === 'ru' ? 'История операций' : 'Transaction History'}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-4 space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center gap-3">
                    <Skeleton className="w-10 h-10 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                    <Skeleton className="h-4 w-16" />
                  </div>
                ))}
              </div>
            ) : transactions.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                <WalletIcon className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>
                  {language === 'ru' 
                    ? 'История операций пуста' 
                    : 'No transactions yet'}
                </p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {transactions.map((tx) => (
                  <div key={tx.id} className="flex items-center gap-3 p-4">
                    <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                      {getTransactionIcon(tx.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium truncate">
                          {getTransactionLabel(tx.type)}
                        </span>
                        {tx.status !== 'completed' && getStatusBadge(tx.status)}
                      </div>
                      <p className="text-sm text-muted-foreground truncate">
                        {language === 'ru' ? tx.description_ru : tx.description || tx.reference_type || '-'}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {format(new Date(tx.created_at), 'dd MMM yyyy, HH:mm', {
                          locale: language === 'ru' ? ru : enUS
                        })}
                      </p>
                    </div>
                    <div className={`font-semibold whitespace-nowrap ${
                      tx.type === 'payment' ? 'text-red-500' : 'text-green-500'
                    }`}>
                      {formatCurrency(
                        tx.type === 'payment' ? -tx.amount : tx.amount,
                        tx.currency
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Promo Banner */}
        <Card className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 border-amber-500/20">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-amber-500/20 flex items-center justify-center">
              <Gift className="w-6 h-6 text-amber-500" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-amber-700 dark:text-amber-400">
                {language === 'ru' ? 'Получайте кэшбэк' : 'Earn Cashback'}
              </h3>
              <p className="text-sm text-muted-foreground">
                {language === 'ru' 
                  ? 'До 10% кэшбэк за каждую покупку' 
                  : 'Up to 10% cashback on every purchase'}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
};

export default Wallet;
