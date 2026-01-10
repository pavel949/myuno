import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useVendorProfile, useVendorPayouts } from '@/hooks/useVendor';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageContainer } from '@/components/uno/PageContainer';
import { PageHeader } from '@/components/uno/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { 
  CreditCard, 
  Wallet,
  ArrowDownToLine,
  Clock,
  CheckCircle,
  XCircle,
  Loader2
} from 'lucide-react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

const paymentMethods = [
  { value: 'bank_card', labelEn: 'Bank Card', labelRu: 'Банковская карта' },
  { value: 'bank_transfer', labelEn: 'Bank Transfer', labelRu: 'Банковский перевод' },
  { value: 'sbp', labelEn: 'SBP (Fast Payment)', labelRu: 'СБП' },
];

const VendorPayouts = () => {
  const navigate = useNavigate();
  const { user, isLoading: authLoading } = useAuth();
  const { language } = useLanguage();
  const { profile, isLoading: profileLoading } = useVendorProfile();
  const { payouts, isLoading: payoutsLoading, requestPayout } = useVendorPayouts(profile?.id);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    amount: '',
    payment_method: 'bank_card',
    card_number: '',
    phone: '',
  });

  const isRussian = language === 'ru';

  React.useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  React.useEffect(() => {
    if (!profileLoading && !profile && user) {
      navigate('/vendor/onboarding');
    }
  }, [profile, profileLoading, user, navigate]);

  const handleRequestPayout = async () => {
    const amount = parseFloat(formData.amount);
    
    if (!amount || amount <= 0) {
      toast.error(isRussian ? 'Введите сумму' : 'Enter amount');
      return;
    }

    if (profile && amount > profile.pending_payout) {
      toast.error(isRussian ? 'Недостаточно средств' : 'Insufficient funds');
      return;
    }

    setIsSubmitting(true);
    try {
      const paymentDetails: Record<string, unknown> = {};
      
      if (formData.payment_method === 'bank_card' && formData.card_number) {
        paymentDetails.card_number = formData.card_number;
      }
      if (formData.payment_method === 'sbp' && formData.phone) {
        paymentDetails.phone = formData.phone;
      }

      const { error } = await requestPayout(amount, formData.payment_method, paymentDetails);
      
      if (error) throw error;
      
      toast.success(isRussian ? 'Заявка на вывод создана' : 'Payout request created');
      setIsDialogOpen(false);
      setFormData({
        amount: '',
        payment_method: 'bank_card',
        card_number: '',
        phone: '',
      });
    } catch (error) {
      console.error('Error requesting payout:', error);
      toast.error(isRussian ? 'Ошибка при создании заявки' : 'Error creating payout request');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <Badge variant="outline" className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20">
            <Clock className="h-3 w-3 mr-1" />
            {isRussian ? 'Ожидает' : 'Pending'}
          </Badge>
        );
      case 'processing':
        return (
          <Badge variant="outline" className="bg-blue-500/10 text-blue-600 border-blue-500/20">
            <Loader2 className="h-3 w-3 mr-1 animate-spin" />
            {isRussian ? 'Обработка' : 'Processing'}
          </Badge>
        );
      case 'completed':
        return (
          <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/20">
            <CheckCircle className="h-3 w-3 mr-1" />
            {isRussian ? 'Выполнено' : 'Completed'}
          </Badge>
        );
      case 'rejected':
        return (
          <Badge variant="outline" className="bg-red-500/10 text-red-600 border-red-500/20">
            <XCircle className="h-3 w-3 mr-1" />
            {isRussian ? 'Отклонено' : 'Rejected'}
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (authLoading || profileLoading) {
    return (
      <AppLayout>
        <PageContainer>
          <div className="space-y-4">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-32" />
            {[1, 2, 3].map(i => (
              <Skeleton key={i} className="h-20" />
            ))}
          </div>
        </PageContainer>
      </AppLayout>
    );
  }

  if (!profile) return null;

  return (
    <AppLayout>
      <PageContainer>
        <PageHeader 
          title={isRussian ? 'Выплаты' : 'Payouts'}
          showBack
        />

        {/* Balance Card */}
        <Card className="mb-6 bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
          <CardContent className="p-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 rounded-full bg-primary/10">
                <Wallet className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  {isRussian ? 'Доступно к выводу' : 'Available for payout'}
                </p>
                <p className="text-3xl font-bold">{profile.pending_payout.toLocaleString()} ₽</p>
              </div>
            </div>
            
            <Button 
              className="w-full" 
              size="lg"
              onClick={() => setIsDialogOpen(true)}
              disabled={profile.pending_payout <= 0}
            >
              <ArrowDownToLine className="h-4 w-4 mr-2" />
              {isRussian ? 'Вывести средства' : 'Withdraw Funds'}
            </Button>
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold">{profile.total_earnings.toLocaleString()} ₽</p>
              <p className="text-xs text-muted-foreground">
                {isRussian ? 'Всего заработано' : 'Total Earned'}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold">{payouts.filter(p => p.status === 'completed').length}</p>
              <p className="text-xs text-muted-foreground">
                {isRussian ? 'Выплат получено' : 'Payouts Received'}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Payout History */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              {isRussian ? 'История выплат' : 'Payout History'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {payoutsLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => (
                  <Skeleton key={i} className="h-16" />
                ))}
              </div>
            ) : payouts.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <CreditCard className="h-10 w-10 mx-auto mb-2 opacity-50" />
                <p>{isRussian ? 'Нет выплат' : 'No payouts yet'}</p>
              </div>
            ) : (
              <div className="space-y-3">
                {payouts.map((payout) => (
                  <div
                    key={payout.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                  >
                    <div>
                      <p className="font-medium">{payout.amount.toLocaleString()} ₽</p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(payout.created_at), 'dd MMMM yyyy', {
                          locale: isRussian ? ru : undefined,
                        })}
                      </p>
                    </div>
                    {getStatusBadge(payout.status)}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Request Payout Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {isRussian ? 'Вывести средства' : 'Withdraw Funds'}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>{isRussian ? 'Сумма' : 'Amount'}</Label>
                <div className="relative">
                  <Input
                    type="number"
                    value={formData.amount}
                    onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                    placeholder="0"
                    className="text-lg pr-12"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                    ₽
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  {isRussian ? 'Доступно:' : 'Available:'} {profile.pending_payout.toLocaleString()} ₽
                </p>
              </div>

              <div className="space-y-2">
                <Label>{isRussian ? 'Способ получения' : 'Payment Method'}</Label>
                <Select
                  value={formData.payment_method}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, payment_method: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {paymentMethods.map(method => (
                      <SelectItem key={method.value} value={method.value}>
                        {isRussian ? method.labelRu : method.labelEn}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {formData.payment_method === 'bank_card' && (
                <div className="space-y-2">
                  <Label>{isRussian ? 'Номер карты' : 'Card Number'}</Label>
                  <Input
                    value={formData.card_number}
                    onChange={(e) => setFormData(prev => ({ ...prev, card_number: e.target.value }))}
                    placeholder="0000 0000 0000 0000"
                  />
                </div>
              )}

              {formData.payment_method === 'sbp' && (
                <div className="space-y-2">
                  <Label>{isRussian ? 'Номер телефона' : 'Phone Number'}</Label>
                  <Input
                    value={formData.phone}
                    onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="+7 (999) 123-45-67"
                  />
                </div>
              )}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                {isRussian ? 'Отмена' : 'Cancel'}
              </Button>
              <Button onClick={handleRequestPayout} disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                {isRussian ? 'Вывести' : 'Withdraw'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </PageContainer>
    </AppLayout>
  );
};

export default VendorPayouts;
