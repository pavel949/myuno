/**
 * ExchangeBot — Currency exchange rates & exchanger comparison for Phuket
 * Master Taxonomy cluster: ARRIVE
 *
 * Reference THB rates and verified exchanger listings come from Supabase
 * (`currency_rates` + `exchangers`). Monetisation surfaces (affiliate rails,
 * "become a verified partner") are gated behind `feature_flag:currency_exchange`.
 */
import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { SEOHead } from '@/components/seo';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  ArrowUpDown, MapPin, Clock, ShieldCheck, BadgeCheck, Store, ArrowRight, Info,
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useFeatureFlag } from '@/hooks/useFeatureFlag';
import { getClusterById, getClusterHeaderLabel } from '@/lib/nav/clusterCatalog';
import {
  useReferenceRates,
  useExchangers,
  useExchangeAffiliate,
} from '@/hooks/exchange/useExchange';
import {
  CURRENCY_LABELS,
  type Exchanger,
  type ExchangeCurrency,
} from '@/types/exchange';

function formatRate(value: number): string {
  return value.toLocaleString(undefined, {
    minimumFractionDigits: value >= 1 ? 2 : 4,
    maximumFractionDigits: value >= 1 ? 2 : 4,
  });
}

const ExchangeBotPage: React.FC = () => {
  const { language } = useLanguage();
  const t = language === 'ru';
  const arriveCluster = getClusterById('arrive');
  const arrivePill = arriveCluster ? getClusterHeaderLabel(arriveCluster, language) : 'Arrival';

  const ratesQuery = useReferenceRates();
  const exchangersQuery = useExchangers();
  const affiliateQuery = useExchangeAffiliate();
  const monetisationOn = useFeatureFlag('currency_exchange');

  const rates = ratesQuery.data ?? [];
  const exchangers = exchangersQuery.data ?? [];
  const affiliate = affiliateQuery.data;

  const [amount, setAmount] = useState('1000');
  const [selected, setSelected] = useState<ExchangeCurrency>('RUB');

  const currentRate = rates.find((r) => r.currency === selected) ?? null;
  const lastUpdated = currentRate?.updatedAt ? new Date(currentRate.updatedAt) : null;
  const convertedAmount = currentRate ? parseFloat(amount || '0') * currentRate.thbPerUnit : 0;

  // Honest comparison: exchangers that quote the selected currency, best rate first.
  const { ordered, bestId } = useMemo(() => {
    const withRate = exchangers
      .filter((e) => typeof e.quoted_rates?.[selected] === 'number')
      .sort((a, b) => (b.quoted_rates[selected]! - a.quoted_rates[selected]!));
    const withoutRate = exchangers.filter((e) => typeof e.quoted_rates?.[selected] !== 'number');
    return { ordered: [...withRate, ...withoutRate], bestId: withRate[0]?.id ?? null };
  }, [exchangers, selected]);

  return (
    <AppLayout>
      <SEOHead
        title={t ? 'Курс валют на Пхукете — Обменники | myUNO' : 'Phuket Exchange Rates — Currency Exchangers | myUNO'}
        description={t ? 'Актуальные курсы THB/RUB/USD/EUR и проверенные обменники Пхукета с возможностью сравнить курс.' : 'Live THB/RUB/USD/EUR rates and verified Phuket exchangers — compare the best rate.'}
      />

      <div className="px-4 md:px-6 lg:px-8 py-6 pb-20 md:pb-8 max-w-[1200px] mx-auto space-y-6">
        {/* Hero */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cluster-arrive/10 text-cluster-arrive text-sm font-medium">
            <ArrowUpDown className="w-4 h-4" />
            {arrivePill}
          </div>
          <h1 className="text-2xl md:text-3xl font-display font-bold text-foreground">
            {t ? 'Обмен валюты на Пхукете' : 'Currency Exchange in Phuket'}
          </h1>
          {lastUpdated && (
            <p className="text-muted-foreground flex items-center justify-center gap-2 text-sm">
              <Clock className="w-3.5 h-3.5" />
              {t ? 'Справочный курс обновлён' : 'Reference rate updated'}: {lastUpdated.toLocaleDateString()}
            </p>
          )}
        </div>

        <Tabs defaultValue="rates" className="space-y-4">
          <TabsList className="w-full grid grid-cols-2">
            <TabsTrigger value="rates">{t ? 'Курсы' : 'Rates'}</TabsTrigger>
            <TabsTrigger value="exchangers">{t ? 'Обменники' : 'Exchangers'}</TabsTrigger>
          </TabsList>

          {/* RATES TAB */}
          <TabsContent value="rates" className="space-y-4">
            <Card className="border-cluster-arrive/20">
              <CardContent className="p-5 space-y-4">
                <h2 className="font-semibold text-foreground">{t ? 'Калькулятор' : 'Converter'}</h2>
                <div className="flex gap-3 items-end flex-wrap">
                  <div className="flex-1 min-w-[120px]">
                    <label className="text-xs text-muted-foreground mb-1 block">{t ? 'Сумма' : 'Amount'}</label>
                    <Input
                      type="number"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="text-lg font-mono"
                    />
                  </div>
                  <div className="flex-1 min-w-[140px]">
                    <label className="text-xs text-muted-foreground mb-1 block">{t ? 'Валюта' : 'Currency'}</label>
                    <select
                      value={selected}
                      onChange={(e) => setSelected(e.target.value as ExchangeCurrency)}
                      className="w-full h-10 rounded-none border border-input bg-background px-3 text-sm"
                    >
                      {rates.map((r) => (
                        <option key={r.currency} value={r.currency}>{r.currency}/THB</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex-1 min-w-[120px]">
                    <label className="text-xs text-muted-foreground mb-1 block">{t ? 'Результат (THB)' : 'Result (THB)'}</label>
                    <div className="h-10 flex items-center px-3 rounded-none bg-muted text-lg font-mono font-bold text-foreground">
                      ฿{convertedAmount.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Reference rate list */}
            <div className="space-y-3">
              {ratesQuery.isLoading &&
                Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-[68px] w-full" />)}

              {ratesQuery.isError && (
                <Card><CardContent className="p-4 text-sm text-muted-foreground">
                  {t ? 'Не удалось загрузить курсы. Попробуйте позже.' : 'Could not load rates. Please try again later.'}
                </CardContent></Card>
              )}

              {!ratesQuery.isLoading && rates.map((rate) => {
                const labels = CURRENCY_LABELS[rate.currency];
                return (
                  <Card
                    key={rate.currency}
                    className="hover:border-cluster-arrive/30 transition-colors cursor-pointer"
                    onClick={() => setSelected(rate.currency)}
                  >
                    <CardContent className="p-4 flex items-center justify-between">
                      <div className="space-y-0.5">
                        <div className="font-semibold text-foreground">{rate.currency}/THB</div>
                        <div className="text-xs text-muted-foreground">{t ? labels.ru : labels.en}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-mono font-bold text-foreground">{formatRate(rate.thbPerUnit)}</div>
                        <div className="text-[11px] text-muted-foreground">{t ? `฿ за 1 ${rate.currency}` : `THB per 1 ${rate.currency}`}</div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            <p className="text-xs text-muted-foreground flex items-start gap-1.5">
              <Info className="w-3.5 h-3.5 mt-0.5 shrink-0" />
              {t
                ? 'Справочный курс по данным мировых FX-источников. Проверенные обменники указывают собственный курс — сравните их на вкладке «Обменники».'
                : 'Reference rate from global FX sources. Verified exchangers quote their own rate — compare them in the “Exchangers” tab.'}
            </p>
          </TabsContent>

          {/* EXCHANGERS TAB */}
          <TabsContent value="exchangers" className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {t
                ? `Сравнение курса на ${selected} — лучший курс выделен.`
                : `Comparing rates for ${selected} — best rate highlighted.`}
            </p>

            {exchangersQuery.isLoading &&
              Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28 w-full" />)}

            {!exchangersQuery.isLoading && ordered.length === 0 && (
              <Card><CardContent className="p-6 text-center text-sm text-muted-foreground">
                {t ? 'Список обменников пока пуст.' : 'No exchangers listed yet.'}
              </CardContent></Card>
            )}

            <div className="space-y-3">
              {ordered.map((ex) => (
                <ExchangerCard
                  key={ex.id}
                  exchanger={ex}
                  currency={selected}
                  isBest={ex.id === bestId}
                  isRu={t}
                />
              ))}
            </div>

            {/* How the exchange works — process guidance */}
            <Card className="bg-cluster-arrive/5 border-cluster-arrive/20">
              <CardContent className="p-5 space-y-2">
                <h2 className="font-display font-semibold text-foreground">
                  {t ? 'Как проходит обмен' : 'How the exchange works'}
                </h2>
                <ul className="space-y-1.5 text-sm text-muted-foreground">
                  <li>• {t ? 'Возьмите паспорт — для крупных сумм его попросят.' : 'Bring your passport — required for larger amounts.'}</li>
                  <li>• {t ? 'Уточните курс и сумму к получению до передачи денег.' : 'Confirm the rate and the amount you receive before handing over cash.'}</li>
                  <li>• {t ? 'Пересчитайте полученные купюры на месте.' : 'Count the cash you receive before leaving the counter.'}</li>
                  <li>• {t ? 'Курс в аэропорту обычно хуже, чем в городе.' : 'Airport rates are usually worse than in-town exchangers.'}</li>
                </ul>
              </CardContent>
            </Card>

            {/* Monetisation surfaces — gated behind the feature flag */}
            {monetisationOn && affiliate && (affiliate.wise_url || affiliate.crypto_onramp_url) && (
              <Card className="border-cluster-arrive/20">
                <CardContent className="p-5 space-y-3">
                  <h2 className="font-display font-semibold text-foreground">
                    {t ? 'Перевод вместо наличных' : 'Transfer instead of cash'}
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    {t
                      ? 'Для крупных сумм цифровой перевод часто выгоднее наличного обмена.'
                      : 'For larger amounts a digital transfer is often better than cash exchange.'}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {affiliate.wise_url && (
                      <Button asChild variant="outline" size="sm">
                        <a href={affiliate.wise_url} target="_blank" rel="noopener noreferrer">Wise</a>
                      </Button>
                    )}
                    {affiliate.crypto_onramp_url && (
                      <Button asChild variant="outline" size="sm">
                        <a href={affiliate.crypto_onramp_url} target="_blank" rel="noopener noreferrer">USDT</a>
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {monetisationOn && (
              <Card className="border-dashed">
                <CardContent className="p-5 flex items-center gap-4">
                  <Store className="w-8 h-8 text-cluster-arrive shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-foreground">
                      {t ? 'Вы — обменник?' : 'Run an exchange office?'}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {t ? 'Станьте проверенным партнёром и показывайте свой курс.' : 'Become a verified partner and publish your rate.'}
                    </p>
                  </div>
                  <Button asChild size="sm">
                    <Link to="/vendor/onboarding">
                      {t ? 'Подключиться' : 'Join'}
                      <ArrowRight className="w-3.5 h-3.5 ml-1" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
};

interface ExchangerCardProps {
  exchanger: Exchanger;
  currency: ExchangeCurrency;
  isBest: boolean;
  isRu: boolean;
}

function ExchangerCard({ exchanger: ex, currency, isBest, isRu }: ExchangerCardProps) {
  const quoted = ex.quoted_rates?.[currency];
  const name = isRu ? ex.name_ru || ex.name : ex.name;
  const area = isRu ? ex.area_ru || ex.area : ex.area;
  const mapUrl =
    ex.lat != null && ex.lng != null
      ? `https://www.google.com/maps/search/?api=1&query=${ex.lat},${ex.lng}`
      : null;

  return (
    <Card className={isBest ? 'border-cluster-arrive ring-1 ring-cluster-arrive/30' : ''}>
      <CardContent className="p-4 space-y-2">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <h3 className="font-semibold text-foreground">{name}</h3>
              {ex.is_verified && (
                <Badge variant="outline" className="text-[10px] gap-1 border-cluster-arrive/40 text-cluster-arrive">
                  <BadgeCheck className="w-3 h-3" />
                  {isRu ? 'Проверен' : 'Verified'}
                </Badge>
              )}
              {ex.is_featured && (
                <Badge variant="outline" className="text-[10px]">
                  {isRu ? 'Партнёр' : 'Partner'}
                </Badge>
              )}
            </div>
            {area && (
              <div className="flex items-center gap-1 text-sm text-muted-foreground mt-0.5">
                <MapPin className="w-3.5 h-3.5" />
                {area}
              </div>
            )}
          </div>
          <div className="text-right shrink-0">
            {typeof quoted === 'number' ? (
              <>
                <div className="text-lg font-mono font-bold text-foreground">{formatRate(quoted)}</div>
                <div className="text-[10px] text-muted-foreground">{isRu ? `฿ за 1 ${currency}` : `THB / ${currency}`}</div>
              </>
            ) : (
              <div className="text-xs text-muted-foreground">{isRu ? 'Курс по запросу' : 'Rate on request'}</div>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 text-sm">
          <div className="flex items-center gap-3 text-muted-foreground">
            {ex.hours && (
              <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{ex.hours}</span>
            )}
            {ex.rating != null && <span>⭐ {ex.rating}</span>}
          </div>
          {isBest && (
            <span className="flex items-center gap-1 text-xs font-medium text-cluster-arrive">
              <ShieldCheck className="w-3.5 h-3.5" />
              {isRu ? 'Лучший курс' : 'Best rate'}
            </span>
          )}
        </div>

        {mapUrl && (
          <Button asChild variant="outline" size="sm" className="w-full mt-1">
            <a href={mapUrl} target="_blank" rel="noopener noreferrer">
              <MapPin className="w-3.5 h-3.5 mr-1" />
              {isRu ? 'Показать на карте' : 'Show on Map'}
            </a>
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

export default ExchangeBotPage;
