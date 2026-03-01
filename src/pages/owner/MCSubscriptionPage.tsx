import React, { useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  CreditCard, Plus, Minus, Building2, CheckCircle, AlertCircle,
  ExternalLink, Zap, Crown, Shield, ToggleLeft, ToggleRight, Sparkles,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { useMCSubscription, type MCPropertySlot } from '@/hooks/useMCSubscription';
import { useLanguage } from '@/contexts/LanguageContext';
import { useActiveCompany } from '@/hooks/useActiveCompany';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Helmet } from 'react-helmet-async';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const PRICE_PER_SLOT = 25;

interface Plan {
  id: string;
  slots: number;
  labelEn: string;
  labelRu: string;
  descEn: string;
  descRu: string;
  icon: React.ElementType;
  popular?: boolean;
  features: { en: string; ru: string }[];
}

const PLANS: Plan[] = [
  {
    id: 'starter',
    slots: 5,
    labelEn: 'Starter',
    labelRu: 'Стартовый',
    descEn: 'For small portfolios',
    descRu: 'Для малого портфолио',
    icon: Zap,
    features: [
      { en: 'Up to 5 properties', ru: 'До 5 объектов' },
      { en: 'Calendar & Bookings', ru: 'Календарь и бронирования' },
      { en: 'Basic financial reports', ru: 'Базовые финансовые отчёты' },
      { en: 'Task management', ru: 'Управление задачами' },
    ],
  },
  {
    id: 'professional',
    slots: 15,
    labelEn: 'Professional',
    labelRu: 'Профессиональный',
    descEn: 'For growing companies',
    descRu: 'Для растущих компаний',
    icon: Crown,
    popular: true,
    features: [
      { en: 'Up to 15 properties', ru: 'До 15 объектов' },
      { en: 'Full CRM & Sales pipeline', ru: 'Полный CRM и воронка продаж' },
      { en: 'Advanced analytics', ru: 'Расширенная аналитика' },
      { en: 'Team permissions', ru: 'Управление доступами команды' },
      { en: 'Owner portal', ru: 'Портал собственника' },
    ],
  },
  {
    id: 'enterprise',
    slots: 50,
    labelEn: 'Enterprise',
    labelRu: 'Корпоративный',
    descEn: 'For large operators',
    descRu: 'Для крупных операторов',
    icon: Shield,
    features: [
      { en: 'Up to 50 properties', ru: 'До 50 объектов' },
      { en: 'Everything in Professional', ru: 'Всё из Профессионального' },
      { en: 'Priority support', ru: 'Приоритетная поддержка' },
      { en: 'Custom integrations', ru: 'Индивидуальные интеграции' },
      { en: 'Dedicated account manager', ru: 'Персональный менеджер' },
    ],
  },
];

export default function MCSubscriptionPage() {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const { activeCompany } = useActiveCompany();
  const companyId = activeCompany?.company_id;
  const {
    subscription, slots, isLoading, paidSlots, usedSlots,
    canActivateMore, createCheckout, openBillingPortal,
    activateProperty, deactivateProperty,
  } = useMCSubscription();
  const [searchParams] = useSearchParams();
  const [customSlots, setCustomSlots] = useState(10);

  const success = searchParams.get('success') === 'true';
  const cancelled = searchParams.get('cancelled') === 'true';
  const isActive = subscription?.subscription_status === 'active';
  const usagePercent = paidSlots > 0 ? Math.round((usedSlots / paidSlots) * 100) : 0;

  // Fetch property details for slot display
  const { data: properties = [] } = useQuery({
    queryKey: ['mc-properties-for-slots', companyId],
    queryFn: async () => {
      if (!companyId) return [];
      const { data, error } = await supabase
        .from('properties')
        .select('id, title, address, property_type, is_active')
        .eq('management_company_id', companyId);
      if (error) return [];
      return data || [];
    },
    enabled: !!companyId,
  });

  // Merge properties with slot status
  const propertyList = useMemo(() => {
    return properties.map(p => {
      const slot = slots.find(s => s.property_id === p.id);
      return {
        ...p,
        slotActive: slot?.is_active ?? false,
        hasSlot: !!slot,
      };
    });
  }, [properties, slots]);

  const activeCount = propertyList.filter(p => p.slotActive).length;
  const inactiveCount = propertyList.length - activeCount;

  const handleToggleProperty = (propertyId: string, currentlyActive: boolean) => {
    if (currentlyActive) {
      deactivateProperty(propertyId);
    } else {
      if (!canActivateMore) {
        toast.error(isRu
          ? 'Все слоты заняты. Увеличьте подписку.'
          : 'All slots used. Upgrade your plan.');
        return;
      }
      activateProperty(propertyId);
    }
  };

  const companyName = activeCompany
    ? (isRu ? activeCompany.name_ru : activeCompany.name_en)
    : '';

  // Determine current plan tier
  const currentPlanTier = PLANS.find(p => paidSlots <= p.slots) || PLANS[PLANS.length - 1];

  if (isLoading) {
    return (
      <div className="p-6 space-y-4 animate-pulse">
        <div className="h-8 bg-muted rounded w-64" />
        <div className="h-48 bg-muted rounded" />
        <div className="h-48 bg-muted rounded" />
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>{isRu ? 'Подписка — PMS' : 'Subscription — PMS'}</title>
      </Helmet>

      <div className="p-4 md:p-6 max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold">
            {isRu ? 'Подписка и тарифы' : 'Subscription & Plans'}
          </h1>
          {companyName && (
            <p className="text-muted-foreground text-sm">{companyName}</p>
          )}
        </div>

        {/* Success / Cancel alerts */}
        {success && (
          <Card className="border-primary/50 bg-primary/5">
            <CardContent className="flex items-center gap-3 py-4">
              <CheckCircle className="h-5 w-5 text-primary shrink-0" />
              <span className="text-sm">{isRu ? 'Подписка успешно оформлена! Активируйте объекты ниже.' : 'Subscription activated! Enable your properties below.'}</span>
            </CardContent>
          </Card>
        )}
        {cancelled && (
          <Card className="border-destructive/50 bg-destructive/5">
            <CardContent className="flex items-center gap-3 py-4">
              <AlertCircle className="h-5 w-5 text-destructive shrink-0" />
              <span className="text-sm">{isRu ? 'Оплата отменена. Попробуйте ещё раз.' : 'Payment cancelled. Try again.'}</span>
            </CardContent>
          </Card>
        )}

        {/* Current Status Bar */}
        {isActive && (
          <Card>
            <CardContent className="py-4">
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="default" className="bg-primary">{isRu ? 'Активна' : 'Active'}</Badge>
                    <span className="text-sm font-medium">${paidSlots * PRICE_PER_SLOT}/{isRu ? 'мес' : 'mo'}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <span className="text-muted-foreground">{isRu ? 'Использовано' : 'Used'}</span>
                    <span className="font-mono font-semibold">{usedSlots}/{paidSlots}</span>
                  </div>
                  <Progress value={usagePercent} className="h-2 mt-2" />
                  <p className="text-xs text-muted-foreground mt-1">
                    {paidSlots - usedSlots > 0
                      ? (isRu ? `${paidSlots - usedSlots} свободных слотов` : `${paidSlots - usedSlots} slots available`)
                      : (isRu ? 'Все слоты заняты' : 'All slots used')}
                  </p>
                </div>
                <Button variant="outline" size="sm" onClick={openBillingPortal} className="gap-2 shrink-0">
                  <ExternalLink className="h-4 w-4" />
                  {isRu ? 'Управление биллингом' : 'Manage Billing'}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Plans Grid */}
        <div>
          <h2 className="text-lg font-semibold mb-4">
            {isActive
              ? (isRu ? 'Изменить план' : 'Change Plan')
              : (isRu ? 'Выберите план' : 'Choose a Plan')}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {PLANS.map(plan => {
              const PlanIcon = plan.icon;
              const isCurrentPlan = isActive && currentPlanTier.id === plan.id;
              const price = plan.slots * PRICE_PER_SLOT;

              return (
                <Card
                  key={plan.id}
                  className={cn(
                    "relative transition-all",
                    plan.popular && "border-primary shadow-md",
                    isCurrentPlan && "ring-2 ring-primary"
                  )}
                >
                  {plan.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <Badge className="bg-primary text-primary-foreground gap-1">
                        <Sparkles className="h-3 w-3" />
                        {isRu ? 'Популярный' : 'Popular'}
                      </Badge>
                    </div>
                  )}
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                        <PlanIcon className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-base">
                          {isRu ? plan.labelRu : plan.labelEn}
                        </CardTitle>
                        <CardDescription className="text-xs">
                          {isRu ? plan.descRu : plan.descEn}
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <span className="text-3xl font-bold">${price}</span>
                      <span className="text-muted-foreground text-sm">/{isRu ? 'мес' : 'mo'}</span>
                      <p className="text-xs text-muted-foreground">
                        ${PRICE_PER_SLOT} × {plan.slots} {isRu ? 'объектов' : 'properties'}
                      </p>
                    </div>

                    <ul className="space-y-1.5">
                      {plan.features.map((f, i) => (
                        <li key={i} className="flex items-start gap-2 text-xs">
                          <CheckCircle className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
                          <span>{isRu ? f.ru : f.en}</span>
                        </li>
                      ))}
                    </ul>

                    {isCurrentPlan ? (
                      <Button variant="secondary" disabled className="w-full text-xs">
                        {isRu ? 'Текущий план' : 'Current Plan'}
                      </Button>
                    ) : (
                      <Button
                        onClick={() => createCheckout(plan.slots)}
                        variant={plan.popular ? 'default' : 'outline'}
                        className="w-full text-xs"
                      >
                        {isActive
                          ? (isRu ? 'Переключить' : 'Switch')
                          : (isRu ? 'Подключить' : 'Subscribe')}
                      </Button>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Custom quantity */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">
              {isRu ? 'Нестандартное количество' : 'Custom Quantity'}
            </CardTitle>
            <CardDescription className="text-xs">
              {isRu ? 'Укажите точное количество объектов' : 'Specify exact number of properties'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <Button
                variant="outline" size="icon" className="h-8 w-8"
                onClick={() => setCustomSlots(Math.max(1, customSlots - 1))}
                disabled={customSlots <= 1}
              >
                <Minus className="h-4 w-4" />
              </Button>
              <div className="text-center min-w-[60px]">
                <div className="text-2xl font-bold">{customSlots}</div>
                <div className="text-[10px] text-muted-foreground uppercase">
                  {isRu ? 'объектов' : 'properties'}
                </div>
              </div>
              <Button
                variant="outline" size="icon" className="h-8 w-8"
                onClick={() => setCustomSlots(customSlots + 1)}
              >
                <Plus className="h-4 w-4" />
              </Button>
              <div className="flex-1" />
              <div className="text-right">
                <div className="text-lg font-semibold">${customSlots * PRICE_PER_SLOT}/{isRu ? 'мес' : 'mo'}</div>
              </div>
              <Button onClick={() => createCheckout(customSlots)} size="sm" className="gap-2">
                <CreditCard className="h-4 w-4" />
                {isActive ? (isRu ? 'Обновить' : 'Update') : (isRu ? 'Оплатить' : 'Subscribe')}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Separator />

        {/* Property Slots Management */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold">
                {isRu ? 'Управление объектами' : 'Property Management'}
              </h2>
              <p className="text-sm text-muted-foreground">
                {isRu
                  ? `${activeCount} активных из ${propertyList.length} объектов`
                  : `${activeCount} active of ${propertyList.length} properties`}
              </p>
            </div>
            {!isActive && propertyList.length > 0 && (
              <Badge variant="outline" className="text-xs">
                {isRu ? 'Требуется подписка' : 'Subscription required'}
              </Badge>
            )}
          </div>

          {propertyList.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center py-12 text-center gap-3">
                <Building2 className="h-10 w-10 text-muted-foreground/40" />
                <div>
                  <p className="font-medium">{isRu ? 'Нет объектов' : 'No properties'}</p>
                  <p className="text-sm text-muted-foreground">
                    {isRu ? 'Добавьте объекты в портфолио УК' : 'Add properties to your MC portfolio'}
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {propertyList.map(property => (
                <Card
                  key={property.id}
                  className={cn(
                    "transition-all",
                    !property.slotActive && "opacity-60"
                  )}
                >
                  <CardContent className="flex items-center gap-3 py-3 px-4">
                    <div className={cn(
                      "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
                      property.slotActive ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                    )}>
                      <Building2 className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {property.title || property.address || property.id.slice(0, 8)}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {property.property_type && (
                          <span className="capitalize">{property.property_type}</span>
                        )}
                        {property.address && property.title && (
                          <span> · {property.address}</span>
                        )}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      {property.slotActive ? (
                        <Badge variant="default" className="text-[10px] bg-primary/15 text-primary border-0">
                          {isRu ? 'Активен' : 'Active'}
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-[10px]">
                          {isRu ? 'Выкл' : 'Off'}
                        </Badge>
                      )}
                      <Switch
                        checked={property.slotActive}
                        onCheckedChange={() => handleToggleProperty(property.id, property.slotActive)}
                        disabled={!isActive && !property.slotActive}
                      />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Info footer */}
        <Card className="bg-muted/30 border-dashed">
          <CardContent className="py-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <CreditCard className="h-4 w-4 text-primary" />
              </div>
              <div className="text-xs text-muted-foreground space-y-1">
                <p className="font-medium text-foreground">
                  {isRu ? 'Как работает биллинг' : 'How billing works'}
                </p>
                <p>
                  {isRu
                    ? `Вы платите $${PRICE_PER_SLOT}/мес за каждый активный объект. Оплата списывается ежемесячно через Stripe. Вы можете включать и отключать объекты в любой момент — стоимость пересчитывается автоматически.`
                    : `You pay $${PRICE_PER_SLOT}/mo per active property. Billing is charged monthly via Stripe. You can enable/disable properties anytime — cost adjusts automatically.`}
                </p>
                <p>
                  {isRu
                    ? 'Деактивированные объекты сохраняют данные, но PMS-функции (календарь, бронирования, финансы) будут недоступны.'
                    : 'Deactivated properties keep their data, but PMS features (calendar, bookings, finances) will be unavailable.'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
