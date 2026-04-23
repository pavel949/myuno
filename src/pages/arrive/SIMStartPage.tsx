/**
 * SIMstart — SIM card comparison for tourists arriving in Phuket
 * Bible cluster: ARRIVE
 */
import React, { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { SEOHead } from '@/components/seo';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Smartphone, Wifi, Globe, Check, ExternalLink } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { getClusterById, getClusterHeaderLabel } from '@/lib/nav/clusterCatalog';

interface SIMPlan {
  id: string;
  provider: string;
  providerLogo: string;
  planName: string;
  planNameRu: string;
  dataGb: number;
  priceTHB: number;
  durationDays: number;
  esimAvailable: boolean;
  callMinutes: number;
  features: string[];
  featuresRu: string[];
  buyUrl: string;
  popular?: boolean;
}

const SIM_PLANS: SIMPlan[] = [
  {
    id: 'ais-tourist-8d',
    provider: 'AIS',
    providerLogo: '📱',
    planName: 'Tourist SIM 8 Days',
    planNameRu: 'Туристическая SIM 8 дней',
    dataGb: 15,
    priceTHB: 299,
    durationDays: 8,
    esimAvailable: true,
    callMinutes: 100,
    features: ['5G coverage', 'Free WiFi at airports', 'Top-up via app'],
    featuresRu: ['Покрытие 5G', 'Бесплатный WiFi в аэропортах', 'Пополнение через приложение'],
    buyUrl: 'https://www.ais.th/travellersim/',
    popular: true,
  },
  {
    id: 'ais-tourist-15d',
    provider: 'AIS',
    providerLogo: '📱',
    planName: 'Tourist SIM 15 Days',
    planNameRu: 'Туристическая SIM 15 дней',
    dataGb: 30,
    priceTHB: 599,
    durationDays: 15,
    esimAvailable: true,
    callMinutes: 100,
    features: ['5G coverage', 'Unlimited social media', 'Free WiFi at airports'],
    featuresRu: ['Покрытие 5G', 'Безлимитные соцсети', 'Бесплатный WiFi в аэропортах'],
    buyUrl: 'https://www.ais.th/travellersim/',
  },
  {
    id: 'dtac-tourist-8d',
    provider: 'DTAC (now True)',
    providerLogo: '📶',
    planName: 'Happy Tourist 8 Days',
    planNameRu: 'Happy Tourist 8 дней',
    dataGb: 15,
    priceTHB: 299,
    durationDays: 8,
    esimAvailable: true,
    callMinutes: 50,
    features: ['4G/5G', 'Tourist assistance hotline', 'Airport pickup available'],
    featuresRu: ['4G/5G', 'Горячая линия для туристов', 'Покупка в аэропорту'],
    buyUrl: 'https://www.dtac.co.th/en/prepaid/tourist-sim',
    popular: true,
  },
  {
    id: 'dtac-tourist-30d',
    provider: 'DTAC (now True)',
    providerLogo: '📶',
    planName: 'Happy Tourist 30 Days',
    planNameRu: 'Happy Tourist 30 дней',
    dataGb: 50,
    priceTHB: 899,
    durationDays: 30,
    esimAvailable: true,
    callMinutes: 100,
    features: ['4G/5G', 'Unlimited social media', 'Thailand-wide coverage'],
    featuresRu: ['4G/5G', 'Безлимитные соцсети', 'Покрытие по всему Таиланду'],
    buyUrl: 'https://www.dtac.co.th/en/prepaid/tourist-sim',
  },
  {
    id: 'true-tourist-10d',
    provider: 'True Move H',
    providerLogo: '🔴',
    planName: 'Tourist SIM 10 Days',
    planNameRu: 'Туристическая SIM 10 дней',
    dataGb: 20,
    priceTHB: 349,
    durationDays: 10,
    esimAvailable: true,
    callMinutes: 60,
    features: ['5G ready', 'True WiFi included', 'Roaming add-on available'],
    featuresRu: ['Поддержка 5G', 'True WiFi включен', 'Роуминг дополнительно'],
    buyUrl: 'https://www.truemoveh.truecorp.co.th/tourist-sim',
  },
  {
    id: 'true-tourist-30d',
    provider: 'True Move H',
    providerLogo: '🔴',
    planName: 'Tourist Plus 30 Days',
    planNameRu: 'Tourist Plus 30 дней',
    dataGb: 60,
    priceTHB: 999,
    durationDays: 30,
    esimAvailable: true,
    callMinutes: 200,
    features: ['5G', 'Unlimited LINE/WhatsApp', 'Multi-device tethering'],
    featuresRu: ['5G', 'Безлимитный LINE/WhatsApp', 'Раздача интернета'],
    buyUrl: 'https://www.truemoveh.truecorp.co.th/tourist-sim',
  },
];

const SIMStartPage: React.FC = () => {
  const { language } = useLanguage();
  const t = language === 'ru';
  const arriveCluster = getClusterById('arrive');
  const arrivePill = arriveCluster ? getClusterHeaderLabel(arriveCluster, language) : 'Arrival';
  const [durationFilter, setDurationFilter] = useState<string>('all');
  const [providerFilter, setProviderFilter] = useState<string>('all');

  const filtered = SIM_PLANS.filter(p => {
    if (durationFilter !== 'all') {
      const max = parseInt(durationFilter);
      if (max === 10 && p.durationDays > 10) return false;
      if (max === 30 && p.durationDays <= 10) return false;
    }
    if (providerFilter !== 'all' && !p.provider.toLowerCase().includes(providerFilter)) return false;
    return true;
  });

  return (
    <AppLayout>
      <SEOHead
        title={t ? 'SIM-карты в Таиланде — Сравнение тарифов | myUNO' : 'Thailand SIM Cards — Plan Comparison | myUNO'}
        description={t ? 'Сравните тарифы SIM-карт AIS, DTAC, True для туристов на Пхукете. eSIM, 5G, выгодные цены.' : 'Compare AIS, DTAC, True tourist SIM plans for Phuket. eSIM, 5G, competitive prices.'}
      />

      <div className="px-4 md:px-6 lg:px-8 py-6 pb-20 md:pb-8 max-w-[1200px] mx-auto space-y-6">
        {/* Hero */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cluster-arrive/10 text-cluster-arrive text-sm font-medium">
            <Smartphone className="w-4 h-4" />
            {arrivePill}
          </div>
          <h1 className="text-2xl md:text-3xl font-display font-bold text-foreground">
            {t ? '📱 SIM-карты на Пхукете' : '📱 SIM Cards in Phuket'}
          </h1>
          <p className="text-muted-foreground max-w-xl mx-auto">
            {t
              ? 'Сравните тарифы трёх главных операторов Таиланда. Все поддерживают eSIM — активируйте прямо в самолёте.'
              : 'Compare plans from Thailand\'s 3 major carriers. All support eSIM — activate on the plane.'}
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3">
          <Select value={durationFilter} onValueChange={setDurationFilter}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder={t ? 'Срок' : 'Duration'} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t ? 'Все сроки' : 'All durations'}</SelectItem>
              <SelectItem value="10">{t ? 'До 10 дней' : 'Up to 10 days'}</SelectItem>
              <SelectItem value="30">{t ? '15-30 дней' : '15-30 days'}</SelectItem>
            </SelectContent>
          </Select>
          <Select value={providerFilter} onValueChange={setProviderFilter}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder={t ? 'Оператор' : 'Provider'} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t ? 'Все операторы' : 'All providers'}</SelectItem>
              <SelectItem value="ais">AIS</SelectItem>
              <SelectItem value="dtac">DTAC / True</SelectItem>
              <SelectItem value="true move">True Move H</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Plans Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map(plan => (
            <Card key={plan.id} className="relative overflow-hidden border-border hover:border-cluster-arrive/40 transition-colors">
              {plan.popular && (
                <div className="absolute top-3 right-3">
                  <Badge className="bg-cluster-arrive text-white text-xs">{t ? 'Популярный' : 'Popular'}</Badge>
                </div>
              )}
              <CardContent className="p-5 space-y-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{plan.providerLogo}</span>
                    <span className="text-sm font-medium text-muted-foreground">{plan.provider}</span>
                  </div>
                  <h3 className="font-semibold text-foreground">{t ? plan.planNameRu : plan.planName}</h3>
                </div>

                {/* Key stats */}
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="p-2 rounded-lg bg-muted">
                    <Wifi className="w-4 h-4 mx-auto text-cluster-arrive mb-1" />
                    <div className="text-sm font-bold text-foreground">{plan.dataGb} GB</div>
                    <div className="text-[10px] text-muted-foreground">{t ? 'Данные' : 'Data'}</div>
                  </div>
                  <div className="p-2 rounded-lg bg-muted">
                    <Globe className="w-4 h-4 mx-auto text-cluster-arrive mb-1" />
                    <div className="text-sm font-bold text-foreground">{plan.durationDays} {t ? 'дн' : 'days'}</div>
                    <div className="text-[10px] text-muted-foreground">{t ? 'Срок' : 'Duration'}</div>
                  </div>
                  <div className="p-2 rounded-lg bg-muted">
                    <Smartphone className="w-4 h-4 mx-auto text-cluster-arrive mb-1" />
                    <div className="text-sm font-bold text-foreground">{plan.callMinutes} {t ? 'мин' : 'min'}</div>
                    <div className="text-[10px] text-muted-foreground">{t ? 'Звонки' : 'Calls'}</div>
                  </div>
                </div>

                {/* Features */}
                <ul className="space-y-1">
                  {(t ? plan.featuresRu : plan.features).map((f, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Check className="w-3.5 h-3.5 text-success flex-shrink-0" />
                      {f}
                    </li>
                  ))}
                  {plan.esimAvailable && (
                    <li className="flex items-center gap-2 text-sm text-cluster-arrive font-medium">
                      <Check className="w-3.5 h-3.5 flex-shrink-0" />
                      eSIM {t ? 'доступна' : 'available'}
                    </li>
                  )}
                </ul>

                {/* Price + CTA */}
                <div className="flex items-end justify-between pt-2 border-t border-border">
                  <div>
                    <span className="text-2xl font-bold text-foreground">฿{plan.priceTHB}</span>
                    <span className="text-xs text-muted-foreground ml-1">
                      (~{Math.round(plan.priceTHB / 35)}$)
                    </span>
                  </div>
                  <Button
                    size="sm"
                    className="bg-cluster-arrive hover:bg-cluster-arrive/90 text-white"
                    onClick={() => window.open(plan.buyUrl, '_blank')}
                  >
                    {t ? 'Купить' : 'Buy Now'}
                    <ExternalLink className="w-3.5 h-3.5 ml-1" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Tips section */}
        <Card className="bg-cluster-arrive/5 border-cluster-arrive/20">
          <CardContent className="p-5 space-y-3">
            <h2 className="font-display font-semibold text-foreground">
              {t ? '💡 Советы по покупке SIM' : '💡 SIM Card Tips'}
            </h2>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>• {t ? 'Купите eSIM до вылета — активируйте в самолёте и будьте на связи сразу после приземления' : 'Buy eSIM before departure — activate on the plane and stay connected upon landing'}</li>
              <li>• {t ? 'Физическую SIM можно купить в аэропорту Пхукета (стойки AIS, True, DTAC в зоне прилёта)' : 'Physical SIM cards available at Phuket Airport arrivals (AIS, True, DTAC counters)'}</li>
              <li>• {t ? 'Для длительного пребывания (1+ месяц) выгоднее месячные тарифы с пополнением' : 'For stays 1+ month, monthly top-up plans offer better value'}</li>
              <li>• {t ? 'Все операторы покрывают весь Пхукет, включая острова (Пхи-Пхи, Рача)' : 'All carriers cover all of Phuket including islands (Phi Phi, Racha)'}</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
};

export default SIMStartPage;
