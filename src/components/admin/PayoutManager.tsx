import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Wallet, Clock, CheckCircle2, XCircle, Send, Users,
  Building2, Calendar
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAdminPayouts, VendorPayout } from '@/hooks/useAdminPayouts';
import { format } from 'date-fns';
import { ru, enUS, th } from 'date-fns/locale';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';

function formatCurrency(amount: number, locale: string, currency = 'THB'): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

const LOCALE_MAP: Record<string, typeof enUS> = { ru, en: enUS, th };
const INTL_LOCALE: Record<string, string> = { ru: 'ru-RU', en: 'en-US', th: 'th-TH' };

export function PayoutManager() {
  const { t, language } = useLanguage();
  const dateLocale = LOCALE_MAP[language] || enUS;
  const intlLocale = INTL_LOCALE[language] || 'en-US';

  const { 
    payouts, 
    pendingProviders, 
    isLoading, 
    processPayout,
    createBulkPayouts,
    totalPendingAmount,
  } = useAdminPayouts();

  const [selectedProviders, setSelectedProviders] = useState<string[]>([]);
  const [processDialogOpen, setProcessDialogOpen] = useState(false);
  const [selectedPayout, setSelectedPayout] = useState<VendorPayout | null>(null);
  const [paymentReference, setPaymentReference] = useState('');

  const pendingPayouts = payouts.filter(p => p.status === 'pending' || p.status === 'processing');
  const completedPayouts = payouts.filter(p => p.status === 'completed');

  function getStatusBadge(status: string) {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="bg-warning/10 text-warning border-warning/30">{t('admin.payouts.status.pending')}</Badge>;
      case 'processing':
        return <Badge variant="outline" className="bg-info/10 text-info border-info/30">{t('admin.payouts.status.processing')}</Badge>;
      case 'completed':
        return <Badge variant="outline" className="bg-success/10 text-success border-success/30">{t('admin.payouts.status.completed')}</Badge>;
      case 'failed':
        return <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/30">{t('admin.payouts.status.failed')}</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  }

  const toggleProvider = (providerId: string) => {
    setSelectedProviders(prev => 
      prev.includes(providerId) 
        ? prev.filter(id => id !== providerId)
        : [...prev, providerId]
    );
  };

  const selectAllProviders = () => {
    if (selectedProviders.length === pendingProviders.length) {
      setSelectedProviders([]);
    } else {
      setSelectedProviders(pendingProviders.map(p => p.id));
    }
  };

  const handleBulkCreate = async () => {
    if (selectedProviders.length === 0) return;
    await createBulkPayouts.mutateAsync(selectedProviders);
    setSelectedProviders([]);
  };

  const handleProcessPayout = async (status: 'completed' | 'failed') => {
    if (!selectedPayout) return;
    await processPayout.mutateAsync({
      payoutId: selectedPayout.id,
      status,
      paymentReference: paymentReference || undefined,
    });
    setProcessDialogOpen(false);
    setSelectedPayout(null);
    setPaymentReference('');
  };

  const openProcessDialog = (payout: VendorPayout) => {
    setSelectedPayout(payout);
    setProcessDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-none bg-warning/10 flex items-center justify-center">
                <Clock className="w-6 h-6 text-warning" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t('admin.payouts.summary.toPay')}</p>
                <p className="text-2xl font-bold">{formatCurrency(totalPendingAmount, intlLocale)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-none bg-info/10 flex items-center justify-center">
                <Users className="w-6 h-6 text-info" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t('admin.payouts.summary.providers')}</p>
                <p className="text-2xl font-bold">{pendingProviders.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-none bg-accent-purple/10 flex items-center justify-center">
                <Send className="w-6 h-6 text-accent-purple" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t('admin.payouts.summary.awaiting')}</p>
                <p className="text-2xl font-bold">{pendingPayouts.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="providers" className="space-y-4">
        <TabsList>
          <TabsTrigger value="providers">{t('admin.payouts.tabs.providers')}</TabsTrigger>
          <TabsTrigger value="pending">{t('admin.payouts.tabs.pending')}</TabsTrigger>
          <TabsTrigger value="history">{t('admin.payouts.tabs.history')}</TabsTrigger>
        </TabsList>

        {/* Providers with pending payouts */}
        <TabsContent value="providers">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">{t('admin.payouts.providers.title')}</CardTitle>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={selectAllProviders}
                >
                  {selectedProviders.length === pendingProviders.length
                    ? t('admin.payouts.providers.deselectAll')
                    : t('admin.payouts.providers.selectAll')}
                </Button>
                <Button
                  size="sm"
                  disabled={selectedProviders.length === 0 || createBulkPayouts.isPending}
                  onClick={handleBulkCreate}
                >
                  <Send className="w-4 h-4 mr-2" />
                  {t('admin.payouts.providers.createPayouts')} ({selectedProviders.length})
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {pendingProviders.length === 0 ? (
                <div className="text-center py-10">
                  <Wallet className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
                  <p className="text-muted-foreground">{t('admin.payouts.providers.empty')}</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {pendingProviders.map((provider, index) => (
                    <motion.div
                      key={provider.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.03 }}
                      className={`flex items-center justify-between p-4 rounded-none border ${
                        selectedProviders.includes(provider.id) 
                          ? 'border-primary bg-primary/5' 
                          : 'border-border hover:bg-muted/50'
                      } cursor-pointer transition-colors`}
                      onClick={() => toggleProvider(provider.id)}
                    >
                      <div className="flex items-center gap-4">
                        <Checkbox
                          checked={selectedProviders.includes(provider.id)}
                          onCheckedChange={() => toggleProvider(provider.id)}
                        />
                        <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                          <Building2 className="w-5 h-5 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="font-medium">{provider.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {provider.businessCategory}
                            {provider.lastPayoutDate && (
                              <> • {t('admin.payouts.providers.lastPayout')}: {format(new Date(provider.lastPayoutDate), 'd MMM yyyy', { locale: dateLocale })}</>
                            )}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-success">
                          {formatCurrency(provider.pendingPayout, intlLocale)}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {t('admin.payouts.providers.totalEarned')}: {formatCurrency(provider.totalEarnings, intlLocale)}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Pending payouts */}
        <TabsContent value="pending">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{t('admin.payouts.pending.title')}</CardTitle>
            </CardHeader>
            <CardContent>
              {pendingPayouts.length === 0 ? (
                <div className="text-center py-10">
                  <CheckCircle2 className="w-12 h-12 mx-auto text-success/50 mb-4" />
                  <p className="text-muted-foreground">{t('admin.payouts.pending.empty')}</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {pendingPayouts.map((payout, index) => (
                    <motion.div
                      key={payout.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.03 }}
                      className="flex items-center justify-between p-4 rounded-none border border-border hover:bg-muted/50"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-warning/10 flex items-center justify-center">
                          <Clock className="w-5 h-5 text-warning" />
                        </div>
                        <div>
                          <p className="font-medium">{payout.provider?.name || t('admin.payouts.pending.unknownProvider')}</p>
                          <p className="text-sm text-muted-foreground">
                            {format(new Date(payout.created_at), 'd MMM yyyy, HH:mm', { locale: dateLocale })}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-lg font-bold">{formatCurrency(payout.amount, intlLocale)}</p>
                          {getStatusBadge(payout.status)}
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="default"
                            onClick={() => openProcessDialog(payout)}
                          >
                            <CheckCircle2 className="w-4 h-4 mr-1" />
                            {t('admin.payouts.pending.payAction')}
                          </Button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* History */}
        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{t('admin.payouts.history.title')}</CardTitle>
            </CardHeader>
            <CardContent>
              {completedPayouts.length === 0 ? (
                <div className="text-center py-10">
                  <Calendar className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
                  <p className="text-muted-foreground">{t('admin.payouts.history.empty')}</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {completedPayouts.map((payout, index) => (
                    <motion.div
                      key={payout.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.02 }}
                      className="flex items-center justify-between p-4 rounded-none border border-border"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-success/10 flex items-center justify-center">
                          <CheckCircle2 className="w-5 h-5 text-success" />
                        </div>
                        <div>
                          <p className="font-medium">{payout.provider?.name || t('admin.payouts.pending.unknownProvider')}</p>
                          <p className="text-sm text-muted-foreground">
                            {payout.processed_at 
                              ? format(new Date(payout.processed_at), 'd MMM yyyy, HH:mm', { locale: dateLocale })
                              : format(new Date(payout.created_at), 'd MMM yyyy, HH:mm', { locale: dateLocale })
                            }
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-success">{formatCurrency(payout.amount, intlLocale)}</p>
                        {payout.payment_reference && (
                          <p className="text-xs text-muted-foreground">Ref: {payout.payment_reference}</p>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Process Payout Dialog */}
      <Dialog open={processDialogOpen} onOpenChange={setProcessDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('admin.payouts.dialog.title')}</DialogTitle>
            <DialogDescription>
              {selectedPayout && (
                <>
                  {t('admin.payouts.dialog.descFor')} {selectedPayout.provider?.name}: {formatCurrency(selectedPayout.amount, intlLocale)}
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="payment-ref">{t('admin.payouts.dialog.refLabel')}</Label>
              <Input
                id="payment-ref"
                placeholder={t('admin.payouts.dialog.refPlaceholder')}
                value={paymentReference}
                onChange={(e) => setPaymentReference(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => handleProcessPayout('failed')}
              disabled={processPayout.isPending}
            >
              <XCircle className="w-4 h-4 mr-2" />
              {t('admin.payouts.dialog.reject')}
            </Button>
            <Button
              onClick={() => handleProcessPayout('completed')}
              disabled={processPayout.isPending}
            >
              <CheckCircle2 className="w-4 h-4 mr-2" />
              {t('admin.payouts.dialog.confirm')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
