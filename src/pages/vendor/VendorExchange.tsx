/**
 * VendorExchange — self-serve panel for currency-exchange providers.
 *
 * An exchanger vendor publishes their live buy rates (THB per 1 foreign unit)
 * and contact details. Verification / featured placement is controlled by the
 * myUNO team (tier shown read-only here). Mounted at /vendor/exchange.
 */
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useVendorProfile } from '@/hooks/useVendor';
import { useMyExchanger } from '@/hooks/exchange/useExchange';
import { PageContainer } from '@/components/uno/PageContainer';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { Loader2, ArrowLeftRight, BadgeCheck } from 'lucide-react';
import {
  EXCHANGE_CURRENCIES,
  CURRENCY_LABELS,
  type ExchangeCurrency,
} from '@/types/exchange';

type RatesForm = Partial<Record<ExchangeCurrency, string>>;

const VendorExchange: React.FC = () => {
  const navigate = useNavigate();
  const { user, isLoading: authLoading } = useAuth();
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const { profile, isLoading: profileLoading } = useVendorProfile();
  const { exchanger, isLoading, save } = useMyExchanger(profile?.id);

  const [name, setName] = useState('');
  const [area, setArea] = useState('');
  const [hours, setHours] = useState('');
  const [phone, setPhone] = useState('');
  const [rates, setRates] = useState<RatesForm>({});

  useEffect(() => {
    if (!authLoading && !user) navigate('/auth');
  }, [user, authLoading, navigate]);

  // Hydrate the form once the existing listing loads.
  useEffect(() => {
    if (!exchanger) return;
    setName(exchanger.name ?? '');
    setArea(exchanger.area ?? '');
    setHours(exchanger.hours ?? '');
    setPhone(exchanger.phone ?? '');
    const next: RatesForm = {};
    for (const c of EXCHANGE_CURRENCIES) {
      const v = exchanger.quoted_rates?.[c];
      if (typeof v === 'number') next[c] = String(v);
    }
    setRates(next);
  }, [exchanger]);

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error(isRu ? 'Укажите название обменника' : 'Enter the exchanger name');
      return;
    }
    const quoted: Partial<Record<ExchangeCurrency, number>> = {};
    for (const c of EXCHANGE_CURRENCIES) {
      const raw = rates[c]?.trim();
      if (!raw) continue;
      const num = Number(raw);
      if (Number.isFinite(num) && num > 0) quoted[c] = num;
    }
    try {
      await save.mutateAsync({
        name: name.trim(),
        area: area.trim() || null,
        hours: hours.trim() || null,
        phone: phone.trim() || null,
        quoted_rates: quoted,
      });
      toast.success(isRu ? 'Курс обновлён' : 'Rates updated');
    } catch (error) {
      console.error('Failed to save exchanger', error);
      toast.error(isRu ? 'Не удалось сохранить' : 'Could not save');
    }
  };

  if (authLoading || profileLoading || isLoading) {
    return (
      <PageContainer>
        <div className="max-w-lg mx-auto space-y-3 py-8">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-40 w-full" />
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <div className="max-w-lg mx-auto py-6 space-y-6">
        <div className="flex items-center gap-3">
          <ArrowLeftRight className="w-6 h-6 text-cluster-arrive" />
          <div>
            <h1 className="text-xl font-display font-bold text-foreground">
              {isRu ? 'Мой обменник' : 'My exchanger'}
            </h1>
            <p className="text-sm text-muted-foreground">
              {isRu ? 'Публикуйте свой курс — туристы видят его в сравнении.' : 'Publish your rate — travellers see it in the comparison.'}
            </p>
          </div>
        </div>

        {/* Tier status (read-only — controlled by myUNO) */}
        <Card className="border-cluster-arrive/20">
          <CardContent className="p-4 flex items-center justify-between">
            <span className="text-sm text-muted-foreground">{isRu ? 'Статус листинга' : 'Listing status'}</span>
            <div className="flex items-center gap-2">
              {exchanger?.is_verified && (
                <Badge variant="outline" className="gap-1 border-cluster-arrive/40 text-cluster-arrive">
                  <BadgeCheck className="w-3 h-3" />{isRu ? 'Проверен' : 'Verified'}
                </Badge>
              )}
              <Badge variant="outline" className="capitalize">{exchanger?.subscription_tier ?? 'free'}</Badge>
            </div>
          </CardContent>
        </Card>

        {/* Business details */}
        <Card>
          <CardContent className="p-5 space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="ex-name">{isRu ? 'Название' : 'Name'}</Label>
              <Input id="ex-name" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="ex-area">{isRu ? 'Район' : 'Area'}</Label>
                <Input id="ex-area" value={area} onChange={(e) => setArea(e.target.value)} placeholder="Patong" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="ex-hours">{isRu ? 'Часы работы' : 'Hours'}</Label>
                <Input id="ex-hours" value={hours} onChange={(e) => setHours(e.target.value)} placeholder="09:00-18:00" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ex-phone">{isRu ? 'Телефон' : 'Phone'}</Label>
              <Input id="ex-phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
            </div>
          </CardContent>
        </Card>

        {/* Live buy rates */}
        <Card>
          <CardContent className="p-5 space-y-4">
            <div>
              <h2 className="font-semibold text-foreground">{isRu ? 'Ваш курс покупки' : 'Your buy rates'}</h2>
              <p className="text-xs text-muted-foreground">
                {isRu ? 'Сколько THB вы даёте за 1 единицу валюты. Оставьте пустым, если не работаете с валютой.' : 'THB you give per 1 unit. Leave blank if you do not handle a currency.'}
              </p>
            </div>
            <div className="space-y-2.5">
              {EXCHANGE_CURRENCIES.map((c) => (
                <div key={c} className="flex items-center gap-3">
                  <div className="w-28 shrink-0">
                    <div className="text-sm font-semibold text-foreground">{c}</div>
                    <div className="text-[11px] text-muted-foreground">{isRu ? CURRENCY_LABELS[c].ru : CURRENCY_LABELS[c].en}</div>
                  </div>
                  <Input
                    type="number"
                    inputMode="decimal"
                    min="0"
                    step="0.0001"
                    value={rates[c] ?? ''}
                    onChange={(e) => setRates((prev) => ({ ...prev, [c]: e.target.value }))}
                    className="font-mono"
                    placeholder={isRu ? `฿ за 1 ${c}` : `THB / ${c}`}
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Button onClick={handleSave} disabled={save.isPending} className="w-full h-12" size="lg">
          {save.isPending && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
          {isRu ? 'Сохранить курс' : 'Save rates'}
        </Button>
      </div>
    </PageContainer>
  );
};

export default VendorExchange;
