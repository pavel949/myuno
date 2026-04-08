import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
  Loader2,
} from "lucide-react";
import { format } from "date-fns";
import { ru, enUS } from "date-fns/locale";
import { toast } from "sonner";
import { CashbackRatesCard } from "@/components/uno/CashbackBadge";
import { ReferralCard } from "@/components/uno/ReferralCard";
import { LoyaltyStatusCard } from "@/components/wallet/LoyaltyStatusCard";
import { AchievementsCard } from "@/components/wallet/AchievementsCard";
import { PaymentMethodsSection } from "@/components/wallet/PaymentMethodsSection";
import { SpendingInsights } from "@/components/wallet/SpendingInsights";

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

const QUICK_AMOUNTS = [500, 1000, 2000, 5000];

const Wallet = () => {
  const { language, t } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isTopUpOpen, setIsTopUpOpen] = useState(false);
  const [topUpAmount, setTopUpAmount] = useState<number>(1000);
  const [isProcessing, setIsProcessing] = useState(false);

  // Handle success/cancel from Stripe redirect
  useEffect(() => {
    const success = searchParams.get('success');
    const canceled = searchParams.get('canceled');
    const amount = searchParams.get('amount');

    if (success === 'true') {
      toast.success(t('wallet.toppedUp').replace('{amount}', `${amount} ₽`));
      // Remove query params from URL
      navigate('/wallet', { replace: true });
    } else if (canceled === 'true') {
      toast.error(t('wallet.paymentCanceled'));
      navigate('/wallet', { replace: true });
    }
  }, [searchParams, navigate, language]);

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

  const handleTopUp = async () => {
    if (!user || topUpAmount < 100) {
      toast.error(language === 'ru' ? 'Минимальная сумма 100 ₽' : 'Minimum amount is 100 ₽');
      return;
    }

    setIsProcessing(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      
      const response = await supabase.functions.invoke('create-checkout-session', {
        body: { 
          amount: topUpAmount,
          currency: 'rub',
        },
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      if (response.data?.url) {
        // Redirect to Stripe Checkout
        window.location.href = response.data.url;
      } else {
        throw new Error('No checkout URL received');
      }
    } catch (error) {
      console.error('Error creating checkout session:', error);
      toast.error(language === 'ru' ? 'Ошибка при создании платежа' : 'Error creating payment');
    } finally {
      setIsProcessing(false);
    }
  };

  const getTransactionIcon = (type: Transaction['type']) => {
    switch (type) {
      case 'topup':
        return <ArrowDownLeft className="w-5 h-5 text-success" />;
      case 'payment':
        return <ArrowUpRight className="w-5 h-5 text-destructive" />;
      case 'refund':
        return <RotateCcw className="w-5 h-5 text-info" />;
      case 'bonus':
        return <Gift className="w-5 h-5 text-accent-purple" />;
      case 'cashback':
        return <TrendingUp className="w-5 h-5 text-success" />;
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
      color: 'bg-success',
      onClick: () => setIsTopUpOpen(true)
    },
    { 
      icon: CreditCard, 
      label: language === 'ru' ? 'Карты' : 'Cards',
      color: 'bg-info',
      onClick: () => navigate('/wallet/cards')
    },
    { 
      icon: Clock, 
      label: language === 'ru' ? 'История' : 'History',
      color: 'bg-accent-purple',
      onClick: () => navigate('/wallet/history')
    },
  ];

  if (!user) {
    return null;
  }

  return (
    <AppLayout title={t('wallet.title')}>
      <div className="p-4 space-y-6 pb-24">
        {/* Balance Card */}
        <Card className="bg-primary text-primary-foreground overflow-hidden">
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
                <div className="text-4xl font-bold mb-4" data-testid="wallet-balance">
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
                data-testid={idx === 0 ? 'topup-button' : undefined}
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

        {/* Spending Insights */}
        <SpendingInsights transactions={transactions} />

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
                <Button 
                  variant="link" 
                  className="mt-2"
                  onClick={() => setIsTopUpOpen(true)}
                >
                  {language === 'ru' ? 'Пополнить кошелёк' : 'Top up wallet'}
                </Button>
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
                      tx.type === 'payment' ? 'text-destructive' : 'text-success'
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

        {/* Payment Methods */}
        <PaymentMethodsSection />

        {/* Loyalty Status */}
        <LoyaltyStatusCard />

        {/* Achievements */}
        <AchievementsCard />

        {/* Referral Program */}
        <ReferralCard />

        {/* Cashback Rates */}
        <CashbackRatesCard />

        {/* Promo Banner */}
        <Card className="bg-warning/5 border-warning/20">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-warning/20 flex items-center justify-center">
              <Gift className="w-6 h-6 text-warning" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-warning">
                {language === 'ru' ? 'Получайте кэшбэк' : 'Earn Cashback'}
              </h3>
              <p className="text-sm text-muted-foreground">
                {language === 'ru' 
                  ? 'Кэшбэк начисляется автоматически после завершения бронирования' 
                  : 'Cashback is credited automatically after booking completion'}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Up Dialog */}
      <Dialog open={isTopUpOpen} onOpenChange={setIsTopUpOpen}>
        <DialogContent className="sm:max-w-md" data-testid="topup-modal">
          <DialogHeader>
            <DialogTitle>
              {language === 'ru' ? 'Пополнить кошелёк' : 'Top Up Wallet'}
            </DialogTitle>
            <DialogDescription>
              {language === 'ru' 
                ? 'Выберите сумму для пополнения' 
                : 'Choose amount to top up'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {/* Quick amount buttons */}
            <div className="grid grid-cols-4 gap-2">
              {QUICK_AMOUNTS.map((amount) => (
                <Button
                  key={amount}
                  variant={topUpAmount === amount ? "default" : "outline"}
                  onClick={() => setTopUpAmount(amount)}
                  className="h-12"
                >
                  {amount} ₽
                </Button>
              ))}
            </div>

            {/* Custom amount input */}
            <div className="space-y-2">
              <label className="text-sm font-medium">
                {language === 'ru' ? 'Или введите сумму' : 'Or enter amount'}
              </label>
              <div className="relative">
                <Input
                  type="number"
                  value={topUpAmount}
                  onChange={(e) => setTopUpAmount(Number(e.target.value))}
                  min={100}
                  step={100}
                  className="pr-12 h-12 text-lg"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground">
                  ₽
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                {language === 'ru' ? 'Минимум 100 ₽' : 'Minimum 100 ₽'}
              </p>
            </div>

            {/* Payment button */}
            <Button 
              onClick={handleTopUp}
              disabled={isProcessing || topUpAmount < 100}
              className="w-full h-14 text-lg font-semibold gap-2"
              data-testid="confirm-topup"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  {language === 'ru' ? 'Обработка...' : 'Processing...'}
                </>
              ) : (
                <>
                  <CreditCard className="w-5 h-5" />
                  {language === 'ru' ? `Оплатить ${topUpAmount} ₽` : `Pay ${topUpAmount} ₽`}
                </>
              )}
            </Button>

            <p className="text-xs text-center text-muted-foreground">
              {language === 'ru' 
                ? 'Безопасная оплата через Stripe' 
                : 'Secure payment via Stripe'}
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
};

export default Wallet;
