import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { CreditCard, Plus, Minus, Building2, CheckCircle, AlertCircle, ExternalLink } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useMCSubscription } from '@/hooks/useMCSubscription';
import { useLanguage } from '@/contexts/LanguageContext';
import { useActiveCompany } from '@/hooks/useActiveCompany';
import { Helmet } from 'react-helmet-async';

export default function MCSubscriptionPage() {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const { activeCompany } = useActiveCompany();
  const {
    subscription, slots, isLoading, paidSlots, usedSlots,
    canActivateMore, createCheckout, openBillingPortal,
    deactivateProperty,
  } = useMCSubscription();
  const [searchParams] = useSearchParams();
  const [desiredSlots, setDesiredSlots] = useState(10);

  const success = searchParams.get('success') === 'true';
  const cancelled = searchParams.get('cancelled') === 'true';

  const usagePercent = paidSlots > 0 ? Math.round((usedSlots / paidSlots) * 100) : 0;

  const companyName = activeCompany
    ? (isRu ? activeCompany.name_ru : activeCompany.name_en)
    : '';

  if (isLoading) {
    return (
      <div className="p-6 space-y-4 animate-pulse">
        <div className="h-8 bg-muted rounded w-64" />
        <div className="h-48 bg-muted rounded" />
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>{isRu ? 'Подписка — PMS' : 'Subscription — PMS'}</title>
      </Helmet>

      <div className="p-4 md:p-6 max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold">
            {isRu ? 'Управление подпиской' : 'Subscription Management'}
          </h1>
          {companyName && (
            <p className="text-muted-foreground">{companyName}</p>
          )}
        </div>

        {success && (
          <Card className="border-primary/50 bg-primary/5">
            <CardContent className="flex items-center gap-3 py-4">
              <CheckCircle className="h-5 w-5 text-primary" />
              <span className="text-foreground">
                {isRu ? 'Подписка успешно оформлена!' : 'Subscription activated successfully!'}
              </span>
            </CardContent>
          </Card>
        )}

        {cancelled && (
          <Card className="border-destructive/50 bg-destructive/5">
            <CardContent className="flex items-center gap-3 py-4">
              <AlertCircle className="h-5 w-5 text-destructive" />
              <span className="text-foreground">
                {isRu ? 'Оплата отменена. Попробуйте ещё раз.' : 'Payment cancelled. Try again.'}
              </span>
            </CardContent>
          </Card>
        )}

        {/* Current plan card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              {isRu ? 'Текущий план' : 'Current Plan'}
            </CardTitle>
            <CardDescription>
              {subscription?.subscription_status === 'active'
                ? (isRu ? 'Подписка активна' : 'Subscription active')
                : (isRu ? 'Нет активной подписки' : 'No active subscription')}
              {subscription?.subscription_status === 'active' && (
                <Badge variant="secondary" className="ml-2">
                  ${paidSlots * 25}/mo
                </Badge>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between text-sm">
              <span>{isRu ? 'Использовано слотов' : 'Slots used'}</span>
              <span className="font-mono font-semibold">
                {usedSlots} / {paidSlots}
              </span>
            </div>
            <Progress value={usagePercent} className="h-3" />
            <p className="text-xs text-muted-foreground">
              {isRu
                ? `${paidSlots - usedSlots} свободных слотов • $25 за объект в месяц`
                : `${paidSlots - usedSlots} slots available • $25 per property/month`}
            </p>

            {subscription?.subscription_status === 'active' && (
              <Button variant="outline" size="sm" onClick={openBillingPortal} className="gap-2">
                <ExternalLink className="h-4 w-4" />
                {isRu ? 'Управление биллингом' : 'Manage Billing'}
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Buy / upgrade slots */}
        <Card>
          <CardHeader>
            <CardTitle>
              {paidSlots > 0
                ? (isRu ? 'Изменить количество слотов' : 'Change Slot Count')
                : (isRu ? 'Купить слоты' : 'Buy Slots')}
            </CardTitle>
            <CardDescription>
              {isRu ? '$25 в месяц за каждый объект' : '$25/month per property'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <Button
                variant="outline" size="icon"
                onClick={() => setDesiredSlots(Math.max(1, desiredSlots - 1))}
                disabled={desiredSlots <= 1}
              >
                <Minus className="h-4 w-4" />
              </Button>
              <div className="text-center min-w-[80px]">
                <div className="text-3xl font-bold">{desiredSlots}</div>
                <div className="text-xs text-muted-foreground">
                  {isRu ? 'объектов' : 'properties'}
                </div>
              </div>
              <Button
                variant="outline" size="icon"
                onClick={() => setDesiredSlots(desiredSlots + 1)}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            <div className="text-sm text-muted-foreground">
              {isRu ? 'Итого:' : 'Total:'}{' '}
              <span className="font-semibold text-foreground">${desiredSlots * 25}/mo</span>
            </div>

            <Button onClick={() => createCheckout(desiredSlots)} className="w-full gap-2">
              <CreditCard className="h-4 w-4" />
              {paidSlots > 0
                ? (isRu ? 'Обновить подписку' : 'Update Subscription')
                : (isRu ? 'Оформить подписку' : 'Subscribe Now')}
            </Button>
          </CardContent>
        </Card>

        {/* Active slots list */}
        {slots.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                {isRu ? 'Активные объекты' : 'Active Properties'}
                <Badge variant="secondary">{slots.filter(s => s.is_active).length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="divide-y">
                {slots.map(slot => (
                  <div key={slot.id} className="flex items-center justify-between py-3">
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-mono">{slot.property_id.slice(0, 8)}...</span>
                      {slot.is_active ? (
                        <Badge variant="default" className="text-xs">Active</Badge>
                      ) : (
                        <Badge variant="outline" className="text-xs">Inactive</Badge>
                      )}
                    </div>
                    {slot.is_active && (
                      <Button
                        variant="ghost" size="sm"
                        onClick={() => deactivateProperty(slot.property_id)}
                      >
                        {isRu ? 'Деактивировать' : 'Deactivate'}
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </>
  );
}
