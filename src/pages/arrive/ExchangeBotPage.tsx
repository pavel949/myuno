/**
 * ExchangeBot — Currency exchange rates & exchanger map for Phuket
 * Bible cluster: ARRIVE
 */
import React, { useState, useEffect } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { SEOHead } from '@/components/seo';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowUpDown, TrendingUp, TrendingDown, MapPin, Clock, RefreshCw } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { getClusterById, getClusterHeaderLabel } from '@/lib/nav/clusterCatalog';

interface ExchangeRate {
  pair: string;
  pairLabel: string;
  pairLabelRu: string;
  rate: number;
  change24h: number;
  inverseRate: number;
}

interface Exchanger {
  id: string;
  name: string;
  nameRu: string;
  area: string;
  areaRu: string;
  rating: number;
  hours: string;
  lat: number;
  lng: number;
  spreadPercent: number;
}

// Static rates (will be replaced with API call later)
const EXCHANGE_RATES: ExchangeRate[] = [
  { pair: 'RUB/THB', pairLabel: 'Russian Ruble → Thai Baht', pairLabelRu: 'Российский рубль → Тайский бат', rate: 0.385, change24h: 0.3, inverseRate: 2.597 },
  { pair: 'USD/THB', pairLabel: 'US Dollar → Thai Baht', pairLabelRu: 'Доллар США → Тайский бат', rate: 33.85, change24h: -0.12, inverseRate: 0.0295 },
  { pair: 'EUR/THB', pairLabel: 'Euro → Thai Baht', pairLabelRu: 'Евро → Тайский бат', rate: 37.20, change24h: 0.15, inverseRate: 0.0269 },
  { pair: 'GBP/THB', pairLabel: 'British Pound → Thai Baht', pairLabelRu: 'Британский фунт → Тайский бат', rate: 43.10, change24h: -0.08, inverseRate: 0.0232 },
  { pair: 'CNY/THB', pairLabel: 'Chinese Yuan → Thai Baht', pairLabelRu: 'Китайский юань → Тайский бат', rate: 4.68, change24h: 0.05, inverseRate: 0.2137 },
];

const EXCHANGERS: Exchanger[] = [
  { id: '1', name: 'SuperRich Phuket', nameRu: 'SuperRich Пхукет', area: 'Phuket Town', areaRu: 'Пхукет-Таун', rating: 4.8, hours: '09:00-18:00', lat: 7.8804, lng: 98.3923, spreadPercent: 0.5 },
  { id: '2', name: 'SiamExchange Patong', nameRu: 'SiamExchange Патонг', area: 'Patong', areaRu: 'Патонг', rating: 4.5, hours: '10:00-22:00', lat: 7.8965, lng: 98.2961, spreadPercent: 1.2 },
  { id: '3', name: 'Phuket Airport Exchange', nameRu: 'Обменник в аэропорту', area: 'Airport', areaRu: 'Аэропорт', rating: 3.9, hours: '06:00-00:00', lat: 8.1082, lng: 98.3169, spreadPercent: 3.0 },
  { id: '4', name: 'K79 Exchange Chalong', nameRu: 'K79 Exchange Чалонг', area: 'Chalong', areaRu: 'Чалонг', rating: 4.6, hours: '09:30-17:30', lat: 7.8385, lng: 98.3405, spreadPercent: 0.8 },
  { id: '5', name: 'TT Currency Kata', nameRu: 'TT Currency Ката', area: 'Kata', areaRu: 'Ката', rating: 4.4, hours: '10:00-20:00', lat: 7.8206, lng: 98.2989, spreadPercent: 1.0 },
];

const ExchangeBotPage: React.FC = () => {
  const { language } = useLanguage();
  const t = language === 'ru';
  const arriveCluster = getClusterById('arrive');
  const arrivePill = arriveCluster ? getClusterHeaderLabel(arriveCluster, language) : 'Arrival';
  const [amount, setAmount] = useState('1000');
  const [selectedPair, setSelectedPair] = useState('RUB/THB');
  const [lastUpdated] = useState(new Date());

  const currentRate = EXCHANGE_RATES.find(r => r.pair === selectedPair)!;
  const convertedAmount = parseFloat(amount || '0') * currentRate.rate;

  return (
    <AppLayout>
      <SEOHead
        title={t ? 'Курс валют на Пхукете — Обменники | myUNO' : 'Phuket Exchange Rates — Currency Exchangers | myUNO'}
        description={t ? 'Актуальные курсы валют THB/RUB/USD/EUR. Лучшие обменники на Пхукете с рейтингами.' : 'Live THB/RUB/USD/EUR exchange rates. Best Phuket currency exchangers with ratings.'}
      />

      <div className="px-4 md:px-6 lg:px-8 py-6 pb-20 md:pb-8 max-w-[1200px] mx-auto space-y-6">
        {/* Hero */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cluster-arrive/10 text-cluster-arrive text-sm font-medium">
            <ArrowUpDown className="w-4 h-4" />
            {arrivePill}
          </div>
          <h1 className="text-2xl md:text-3xl font-display font-bold text-foreground">
            {t ? '💱 Курсы валют на Пхукете' : '💱 Phuket Exchange Rates'}
          </h1>
          <p className="text-muted-foreground flex items-center justify-center gap-2 text-sm">
            <Clock className="w-3.5 h-3.5" />
            {t ? 'Обновлено' : 'Updated'}: {lastUpdated.toLocaleTimeString()}
          </p>
        </div>

        <Tabs defaultValue="rates" className="space-y-4">
          <TabsList className="w-full grid grid-cols-2">
            <TabsTrigger value="rates">{t ? 'Курсы' : 'Rates'}</TabsTrigger>
            <TabsTrigger value="exchangers">{t ? 'Обменники' : 'Exchangers'}</TabsTrigger>
          </TabsList>

          <TabsContent value="rates" className="space-y-4">
            {/* Converter */}
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
                      value={selectedPair}
                      onChange={(e) => setSelectedPair(e.target.value)}
                      className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                    >
                      {EXCHANGE_RATES.map(r => (
                        <option key={r.pair} value={r.pair}>{r.pair}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex-1 min-w-[120px]">
                    <label className="text-xs text-muted-foreground mb-1 block">{t ? 'Результат (THB)' : 'Result (THB)'}</label>
                    <div className="h-10 flex items-center px-3 rounded-md bg-muted text-lg font-mono font-bold text-foreground">
                      ฿{convertedAmount.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Rates Table */}
            <div className="space-y-3">
              {EXCHANGE_RATES.map(rate => (
                <Card key={rate.pair} className="hover:border-cluster-arrive/30 transition-colors cursor-pointer" onClick={() => setSelectedPair(rate.pair)}>
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="space-y-0.5">
                      <div className="font-semibold text-foreground">{rate.pair}</div>
                      <div className="text-xs text-muted-foreground">{t ? rate.pairLabelRu : rate.pairLabel}</div>
                    </div>
                    <div className="text-right space-y-0.5">
                      <div className="text-lg font-mono font-bold text-foreground">
                        {rate.rate.toFixed(rate.rate >= 1 ? 2 : 4)}
                      </div>
                      <div className={`flex items-center gap-1 text-xs justify-end ${rate.change24h >= 0 ? 'text-success' : 'text-destructive'}`}>
                        {rate.change24h >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                        {rate.change24h >= 0 ? '+' : ''}{rate.change24h}%
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <p className="text-xs text-muted-foreground text-center">
              {t
                ? '⚠️ Курсы ориентировочные. Реальный курс в обменнике может отличаться.'
                : '⚠️ Rates are indicative. Actual exchanger rates may differ.'}
            </p>
          </TabsContent>

          <TabsContent value="exchangers" className="space-y-4">
            <div className="space-y-3">
              {EXCHANGERS.map(ex => (
                <Card key={ex.id} className="hover:border-cluster-arrive/30 transition-colors">
                  <CardContent className="p-4 space-y-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold text-foreground">{t ? ex.nameRu : ex.name}</h3>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <MapPin className="w-3.5 h-3.5" />
                          {t ? ex.areaRu : ex.area}
                        </div>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        ⭐ {ex.rating}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <Clock className="w-3.5 h-3.5" />
                        {ex.hours}
                      </div>
                      <div className={`text-xs font-medium ${ex.spreadPercent <= 1 ? 'text-success' : ex.spreadPercent <= 2 ? 'text-warning' : 'text-destructive'}`}>
                        {t ? 'Спред' : 'Spread'}: {ex.spreadPercent}%
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full mt-1"
                      onClick={() => window.open(`https://www.google.com/maps/search/?api=1&query=${ex.lat},${ex.lng}`, '_blank')}
                    >
                      <MapPin className="w-3.5 h-3.5 mr-1" />
                      {t ? 'Показать на карте' : 'Show on Map'}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Tips */}
            <Card className="bg-cluster-arrive/5 border-cluster-arrive/20">
              <CardContent className="p-5 space-y-2">
                <h2 className="font-display font-semibold text-foreground">
                  {t ? '💡 Советы по обмену' : '💡 Exchange Tips'}
                </h2>
                <ul className="space-y-1.5 text-sm text-muted-foreground">
                  <li>• {t ? 'Избегайте обмена в аэропорту — курс на 2-5% хуже' : 'Avoid airport exchanges — rates are 2-5% worse'}</li>
                  <li>• {t ? 'SuperRich и K79 — выгодные курсы на острове' : 'SuperRich and K79 offer competitive rates on the island'}</li>
                  <li>• {t ? 'Банкоматы берут комиссию 220฿ за снятие. Банк Bangkok Bank — минимальная комиссия' : 'ATMs charge ฿220 withdrawal fee. Bangkok Bank has lowest fees'}</li>
                  <li>• {t ? 'Visa/Mastercard в крупных магазинах — курс банка, без наценки' : 'Visa/Mastercard at large stores — bank rate, no markup'}</li>
                </ul>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
};

export default ExchangeBotPage;
